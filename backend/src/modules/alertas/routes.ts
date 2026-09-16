import { Router } from "express";
import { pool } from "../../db/pool";
import { requireAuth } from "../../middleware/auth";
import { asyncHandler } from "../../utils/asyncHandler";

export const alertasRouter = Router();

alertasRouter.use(requireAuth);

export interface AlertaItem {
  id: string;
  tipo: "PELIGRO" | "ADVERTENCIA" | "INFO";
  categoria: "CREDITOS" | "CAJA" | "PLAZO_FIJO" | "CAJA_CHICA" | "SOCIOS";
  titulo: string;
  descripcion: string;
  detalle: string;
  enlace: string;
  fecha: string;
}

alertasRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    const alertas: AlertaItem[] = [];
    const hoy = new Date().toISOString().slice(0, 10);

    // 1. Cajas auxiliares abiertas
    try {
      const { rows: cajasAbiertas } = await pool.query<{
        id: string;
        fecha: string;
        agencia_nombre: string;
        usuario_nombre: string;
      }>(`
        SELECT cd.id, cd.fecha, a.nombre AS agencia_nombre, u.nombre AS usuario_nombre
        FROM caja_dias cd
        JOIN agencias a ON a.id = cd.agencia_id
        LEFT JOIN usuarios u ON u.id = cd.cajero_id
        WHERE cd.estado = 'ABIERTO'
        ORDER BY cd.fecha DESC
      `);

      for (const c of cajasAbiertas) {
        const esAnterior = c.fecha < hoy;
        alertas.push({
          id: `caja-${c.id}`,
          tipo: esAnterior ? "PELIGRO" : "ADVERTENCIA",
          categoria: "CAJA",
          titulo: esAnterior ? "Caja del día anterior sin cerrar" : "Caja auxiliar actualmente abierta",
          descripcion: `Agencia ${c.agencia_nombre} tiene la caja de fecha ${c.fecha} en estado ABIERTO.`,
          detalle: `Responsable: ${c.usuario_nombre || "Cajero asignado"}. Se requiere arqueo y cierre.`,
          enlace: "/auxiliar-caja",
          fecha: c.fecha,
        });
      }
    } catch {
      // Ignorar si la tabla no existe o error temporal
    }

    // 2. Certificados de Plazo Fijo por vencer o vencidos
    try {
      const { rows: plazos } = await pool.query<{
        id: string;
        numero_contrato: string;
        monto_deposito: number;
        fecha_vencimiento: string;
        socio_nombres: string;
      }>(`
        SELECT pfc.id, pfc.numero_contrato, pfc.monto_deposito, pfc.fecha_vencimiento, s.nombres AS socio_nombres
        FROM plazo_fijo_contratos pfc
        JOIN socios s ON s.id = pfc.socio_id
        WHERE pfc.estado = 'ACTIVO' AND pfc.fecha_vencimiento <= (CURRENT_DATE + INTERVAL '15 days')
        ORDER BY pfc.fecha_vencimiento ASC
      `);

      for (const p of plazos) {
        const yaVencio = p.fecha_vencimiento <= hoy;
        alertas.push({
          id: `pf-${p.id}`,
          tipo: yaVencio ? "PELIGRO" : "ADVERTENCIA",
          categoria: "PLAZO_FIJO",
          titulo: yaVencio ? "Certificado de Plazo Fijo Vencido" : "Plazo Fijo próximo a vencer (≤ 15 días)",
          descripcion: `Certificado No. ${p.numero_contrato} por Q ${Number(p.monto_deposito).toLocaleString("es-GT", { minimumFractionDigits: 2 })} - ${p.socio_nombres}.`,
          detalle: `Fecha de vencimiento: ${p.fecha_vencimiento}. Requiere contactar al inversionista para liquidación o renovación.`,
          enlace: `/ahorros/plazo-fijo/${p.id}`,
          fecha: p.fecha_vencimiento,
        });
      }
    } catch {
      // ignore
    }

    // 3. Créditos aprobados pendientes de desembolso
    try {
      const { rows: creditosAprobados } = await pool.query<{
        id: string;
        codigo: string;
        monto_aprobado: number;
        socio_nombres: string;
        created_at: string;
      }>(`
        SELECT p.id, p.codigo, COALESCE(p.monto_aprobado, p.monto_solicitado) AS monto_aprobado, s.nombres AS socio_nombres, p.created_at
        FROM prestamos p
        JOIN socios s ON s.id = p.socio_id
        WHERE p.estado = 'APROBADO'
        ORDER BY p.created_at DESC
      `);

      for (const cr of creditosAprobados) {
        alertas.push({
          id: `cred-aprob-${cr.id}`,
          tipo: "INFO",
          categoria: "CREDITOS",
          titulo: "Crédito aprobado pendiente de desembolso",
          descripcion: `Crédito ${cr.codigo} por Q ${Number(cr.monto_aprobado).toLocaleString("es-GT", { minimumFractionDigits: 2 })} para ${cr.socio_nombres}.`,
          detalle: "Listo para que el cajero efectúe la entrega de fondos en ventanilla.",
          enlace: `/creditos/${cr.id}`,
          fecha: new Date(cr.created_at).toISOString().slice(0, 10),
        });
      }
    } catch {
      // ignore
    }

    // 4. Saldo bajo en Caja Chica
    try {
      const { rows: ccRes } = await pool.query<{
        total_ingresos: number;
        total_egresos: number;
      }>(`
        SELECT
          COALESCE(SUM(CASE WHEN tipo = 'INGRESO' THEN monto ELSE 0 END), 0) AS total_ingresos,
          COALESCE(SUM(CASE WHEN tipo = 'EGRESO' THEN monto ELSE 0 END), 0) AS total_egresos
        FROM caja_chica_comprobantes
      `);
      if (ccRes.length > 0) {
        const saldoCC = Number(ccRes[0].total_ingresos) - Number(ccRes[0].total_egresos);
        if (saldoCC < 500) {
          alertas.push({
            id: "cc-saldo-bajo",
            tipo: saldoCC <= 200 ? "PELIGRO" : "ADVERTENCIA",
            categoria: "CAJA_CHICA",
            titulo: "Saldo de Caja Chica disponible bajo",
            descripcion: `El saldo disponible actual en caja chica es de Q ${saldoCC.toLocaleString("es-GT", { minimumFractionDigits: 2 })}.`,
            detalle: "Se recomienda tramitar reposición de fondo fijo mediante cheque bancario.",
            enlace: "/caja-chica",
            fecha: hoy,
          });
        }
      }
    } catch {
      // ignore
    }

    // 5. Socios con datos incompletos
    try {
      const { rows: sociosIncompletos } = await pool.query<{
        id: string;
        nombres: string;
        numero_asociado: string;
      }>(`
        SELECT id, nombres, numero_asociado
        FROM socios
        WHERE (dpi IS NULL OR TRIM(dpi) = '') OR (telefono IS NULL OR TRIM(telefono) = '')
        LIMIT 5
      `);

      for (const s of sociosIncompletos) {
        alertas.push({
          id: `socio-inc-${s.id}`,
          tipo: "INFO",
          categoria: "SOCIOS",
          titulo: `Expediente incompleto: ${s.numero_asociado}`,
          descripcion: `El asociado ${s.nombres} no cuenta con DPI o teléfono registrado.`,
          detalle: "Actualizar datos en el padrón para cumplir con los requerimientos de auditoría.",
          enlace: `/socios/${s.id}`,
          fecha: hoy,
        });
      }
    } catch {
      // ignore
    }

    res.json(alertas);
  })
);
