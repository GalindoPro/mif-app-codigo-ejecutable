import "dotenv/config";
import { execSync } from "child_process";
import path from "path";
import { pool } from "./pool";
import { hashPassword } from "../utils/auth";

interface RawSocio {
  numero_asociado: string;
  nombre: string;
  dpi: string | null;
  edad: number | null;
  genero: string;
  monto_aportacion: number;
  numero_cuenta: string;
  fecha_ingreso: string;
  numero_recibo: string | null;
}

interface RawPrestamo {
  codigo: string;
  socio_nombre: string;
  tipo: "HIPOTECARIO" | "FIDUCIARIO";
  doc_desembolso: string | null;
  ubicacion_garantia: string | null;
  fiador: string | null;
  plazo_meses: number;
  fecha_desembolso: string;
  fecha_vencimiento: string;
  monto_aprobado: number;
  saldo_capital: number;
}

interface RawPlazoFijo {
  socio_nombre: string;
  numero_cuenta: string;
  numero_certificacion: string;
  plazo_meses: number;
  monto_deposito: number;
  fecha_inicio: string;
  fecha_retiro: string | null;
  recibo_retiro: string | null;
  monto_liquidado: number | null;
  estado: "ACTIVO" | "LIQUIDADO";
}

interface ExtractedData {
  socios: RawSocio[];
  prestamos: RawPrestamo[];
  plazos_fijos: RawPlazoFijo[];
}

function sanitizeDate(val: string | null | undefined, fallback: string = "2026-01-02"): string {
  if (!val || typeof val !== "string" || !val.trim()) return fallback;
  const trimmed = val.trim();
  const d = new Date(trimmed);
  if (isNaN(d.getTime())) return fallback;
  return trimmed.slice(0, 10);
}

function addMonths(dateStr: string, months: number): string {
  try {
    const cleanDate = sanitizeDate(dateStr, "2026-01-02");
    const d = new Date(cleanDate);
    if (isNaN(d.getTime())) return cleanDate;
    d.setMonth(d.getMonth() + months);
    return d.toISOString().slice(0, 10);
  } catch {
    return dateStr;
  }
}

async function main() {
  console.log("==================================================================");
  console.log("   INICIANDO MIGRACIÓN DE DATOS INICIALES DESDE LIBROS EXCEL");
  console.log("==================================================================");

  // 1. Extraer datos con el script python
  const scriptPath = path.resolve(__dirname, "../../scripts/extract_excel_data.py");
  console.log("1. Extrayendo datos desde los archivos Excel...");
  const rawOutput = execSync(`python3 "${scriptPath}"`, { maxBuffer: 50 * 1024 * 1024 }).toString();
  const data: ExtractedData = JSON.parse(rawOutput);

  console.log(`   ✓ Extraídos: ${data.socios.length} asociados, ${data.prestamos.length} préstamos, ${data.plazos_fijos.length} certificados de plazo fijo.\n`);

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // 2. Asegurar agencia y usuarios base
    const { rows: agRows } = await client.query(
      `insert into agencias (codigo, nombre, direccion)
       values ('CHAJUL', 'Agencia Chajul', 'Chajul, Quiché')
       on conflict (codigo) do update set nombre = excluded.nombre
       returning *`,
    );
    const agencia = agRows[0];

    const passwordHash = await hashPassword("CambiaEsto123!");
    const { rows: userRows } = await client.query(
      `insert into usuarios (nombre, email, password_hash, rol, agencia_id)
       values ('Administrador MIF', 'admin@mif.coop', $1, 'ADMIN', null)
       on conflict (email) do update set password_hash = excluded.password_hash
       returning *`,
      [passwordHash],
    );
    const adminUser = userRows[0];

    const { rows: promotorRows } = await client.query(
      `insert into usuarios (nombre, email, password_hash, rol, agencia_id)
       values ('Carlos Promotor Chajul', 'promotor@mif.coop', $1, 'PROMOTOR', $2)
       on conflict (email) do update set password_hash = excluded.password_hash
       returning *`,
      [passwordHash, agencia.id],
    );
    const promotorUser = promotorRows[0];

    // Mapa para resolución rápida de socio por nombre o DPI
    const sociosMap = new Map<string, string>(); // clave normalizada -> socio_id
    const { rows: existingSocios } = await client.query(`select id, nombres, dpi from socios`);
    for (const s of existingSocios) {
      sociosMap.set(s.nombres.trim().toUpperCase(), s.id);
      if (s.dpi) sociosMap.set(s.dpi.replace(/\D/g, ""), s.id);
    }

    let socioSeq = existingSocios.length + 1;

    // Helper para obtener o registrar socio
    async function obtenerORegistrarSocio(
      nombre: string,
      dpi: string | null = null,
      edad: number | null = null,
      genero: string = "M",
      fechaIngreso: string = "2026-01-02",
      asocNoPrefix: string = "CHAJ",
    ): Promise<string> {
      const normNombre = nombre.trim().toUpperCase();
      const cleanDpi = dpi && dpi.trim().length > 0 ? dpi.trim() : null;
      const normDpiKey = cleanDpi ? cleanDpi.replace(/\D/g, "") : null;
      const cleanFecha = sanitizeDate(fechaIngreso, "2026-01-02");

      if (normDpiKey && sociosMap.has(normDpiKey)) return sociosMap.get(normDpiKey)!;
      if (sociosMap.has(normNombre)) return sociosMap.get(normNombre)!;

      const asocNo = `${asocNoPrefix}-${String(socioSeq++).padStart(5, "0")}`;
      const { rows } = await client.query(
        `insert into socios (numero_asociado, agencia_id, nombres, dpi, edad, genero, fecha_ingreso, estado, creado_por_id)
         values ($1, $2, $3, $4, $5, $6, $7, 'ACTIVO', $8)
         returning id`,
        [asocNo, agencia.id, normNombre, cleanDpi, edad, genero, cleanFecha, adminUser.id],
      );
      const newId = rows[0].id;
      sociosMap.set(normNombre, newId);
      if (normDpiKey) sociosMap.set(normDpiKey, newId);
      return newId;
    }

    // 3. Migrar Socios y Cuentas de Aportaciones
    console.log("2. Migrando 122 Asociados y Aportaciones de Capital...");
    let sociosMigrados = 0;
    for (const s of data.socios) {
      const socioId = await obtenerORegistrarSocio(
        s.nombre,
        s.dpi,
        s.edad,
        s.genero,
        s.fecha_ingreso,
        s.numero_asociado,
      );

      // Cuenta de Aportaciones
      const { rows: cuentaRows } = await client.query(
        `select id from cuentas where socio_id = $1 and tipo = 'APORTACION'`,
        [socioId],
      );
      let cuentaId = cuentaRows[0]?.id;
      if (!cuentaId) {
        const { rows: newCuenta } = await client.query(
          `insert into cuentas (socio_id, agencia_id, tipo, numero_cuenta, estado, observaciones_apertura)
           values ($1, $2, 'APORTACION', $3, 'ACTIVA', 'Aportación inicial migrada de libro oficial')
           on conflict (numero_cuenta) do update set estado = 'ACTIVA'
           returning id`,
          [socioId, agencia.id, s.numero_cuenta],
        );
        cuentaId = newCuenta[0].id;

        // Registrar depósito de aportación
        const clienteMovId = `APOR-INIT-${cuentaId}`;
        const cleanFechaApor = sanitizeDate(s.fecha_ingreso, "2026-01-02");
        await client.query(
          `insert into movimientos (cuenta_id, tipo, monto, fecha, descripcion, numero_recibo, usuario_id, cliente_movimiento_id)
           values ($1, 'DEPOSITO', $2, $3, 'Aportación inicial de capital', $4, $5, $6)
           on conflict (cliente_movimiento_id) do nothing`,
          [cuentaId, s.monto_aportacion, cleanFechaApor, s.numero_recibo, adminUser.id, clienteMovId],
        );
      }
      sociosMigrados++;
    }
    console.log(`   ✓ ${sociosMigrados} Asociados y Cuentas de Aportación vinculados.`);

    // 4. Migrar Cartera de Préstamos (Hipotecario y Fiduciario)
    console.log("\n3. Migrando Cartera de Préstamos del Promotor...");
    let prestamosMigrados = 0;
    for (const p of data.prestamos) {
      const socioId = await obtenerORegistrarSocio(p.socio_nombre);

      // Verificar si ya existe préstamo por código
      const { rows: pExist } = await client.query(`select id from prestamos where codigo = $1`, [p.codigo]);
      if (!pExist[0]) {
        // Cuota mensual estimada (al 2% mensual)
        const tasaMensual = 0.02;
        const n = p.plazo_meses;
        const r = tasaMensual;
        const cuota = (p.monto_aprobado * (r * Math.pow(1 + r, n))) / (Math.pow(1 + r, n) - 1);
        const cuotaRedondeada = Math.round(cuota * 100) / 100;

        const fDes = sanitizeDate(p.fecha_desembolso, "2026-01-01");
        const fVenc = sanitizeDate(p.fecha_vencimiento, "2027-01-01");

        await client.query(
          `insert into prestamos (
             codigo, socio_id, agencia_id, promotor_id, tipo, estado, tipo_amortizacion,
             monto_solicitado, monto_aprobado, saldo_capital, tasa_interes_mensual, plazo_meses, cuota_mensual,
             fecha_solicitud, fecha_aprobacion, fecha_desembolso, fecha_vencimiento, documento_desembolso,
             ubicacion_garantia, nombre_fiador
           ) values ($1, $2, $3, $4, $5, 'DESEMBOLSADO', 'CUOTA_NIVELADA', $6, $7, $8, 2.0, $9, $10, $11, $12, $13, $14, $15, $16, $17)`,
          [
            p.codigo,
            socioId,
            agencia.id,
            promotorUser.id,
            p.tipo,
            p.monto_aprobado,
            p.monto_aprobado,
            p.saldo_capital,
            p.plazo_meses,
            cuotaRedondeada,
            fDes,
            fDes,
            fDes,
            fVenc,
            p.doc_desembolso,
            p.ubicacion_garantia,
            p.fiador,
          ],
        );
        prestamosMigrados++;
      }
    }
    console.log(`   ✓ ${prestamosMigrados} Préstamos migrados y listos en cartera viva.`);

    // 5. Migrar Certificados de Ahorro a Plazo Fijo
    console.log("\n4. Migrando Certificados de Ahorro a Plazo Fijo...");
    let pfMigrados = 0;
    for (let i = 0; i < data.plazos_fijos.length; i++) {
      const pf = data.plazos_fijos[i];
      const socioId = await obtenerORegistrarSocio(pf.socio_nombre);

      // Crear o reusar cuenta de Plazo Fijo
      const numCuenta = `CHAJ-PF-${pf.numero_certificacion}-${i + 1}`;
      let cuentaId: string;
      const { rows: cExist } = await client.query(`select id from cuentas where numero_cuenta = $1`, [numCuenta]);
      if (cExist[0]) {
        cuentaId = cExist[0].id;
      } else {
        const { rows: newCuenta } = await client.query(
          `insert into cuentas (socio_id, agencia_id, tipo, numero_cuenta, estado, observaciones_apertura)
           values ($1, $2, 'AHORRO_PLAZO_FIJO', $3, 'ACTIVA', 'Certificado Plazo Fijo migrado de Kardex oficial')
           returning id`,
          [socioId, agencia.id, numCuenta],
        );
        cuentaId = newCuenta[0].id;
      }

      // Verificar si ya existe el contrato
      const { rows: pfExist } = await client.query(
        `select id from plazo_fijo_contratos where cuenta_id = $1 or numero_certificacion = $2`,
        [cuentaId, pf.numero_certificacion],
      );
      if (!pfExist[0]) {
        const fInicio = sanitizeDate(pf.fecha_inicio, "2025-01-01");
        const fRet = pf.fecha_retiro ? sanitizeDate(pf.fecha_retiro, "2026-01-01") : null;
        const interesGenerado = Math.round(pf.monto_deposito * 0.1 * (pf.plazo_meses / 12) * 100) / 100;
        const interesNeto = Math.round(interesGenerado * 0.9 * 100) / 100;
        const saldoLiquido = Math.round((pf.monto_deposito + interesNeto) * 100) / 100;
        const fechaVencimiento = addMonths(fInicio, pf.plazo_meses);

        await client.query(
          `insert into plazo_fijo_contratos (
             cuenta_id, numero_certificacion, plazo_meses, tasa_anual, isr_porcentaje, monto_deposito,
             fecha_inicio, fecha_vencimiento, interes_generado, interes_neto, saldo_liquido_a_pagar,
             estado, fecha_retiro, recibo_retiro, monto_liquidado
           ) values ($1, $2, $3, 10.0, 10.0, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
          [
            cuentaId,
            pf.numero_certificacion,
            pf.plazo_meses,
            pf.monto_deposito,
            fInicio,
            fechaVencimiento,
            interesGenerado,
            interesNeto,
            saldoLiquido,
            pf.estado,
            fRet,
            pf.recibo_retiro,
            pf.monto_liquidado,
          ],
        );

        // Movimiento de apertura
        const clienteMovIdDep = `PF-DEP-${cuentaId}`;
        await client.query(
          `insert into movimientos (cuenta_id, tipo, monto, fecha, descripcion, numero_recibo, usuario_id, cliente_movimiento_id)
           values ($1, 'DEPOSITO', $2, $3, 'Apertura de Certificado Plazo Fijo', $4, $5, $6)
           on conflict (cliente_movimiento_id) do nothing`,
          [cuentaId, pf.monto_deposito, fInicio, pf.numero_certificacion, adminUser.id, clienteMovIdDep],
        );

        if (pf.estado === "LIQUIDADO" && fRet) {
          const clienteMovIdRet = `PF-RET-${cuentaId}`;
          await client.query(
            `insert into movimientos (cuenta_id, tipo, monto, fecha, descripcion, numero_recibo, usuario_id, cliente_movimiento_id)
             values ($1, 'RETIRO', $2, $3, 'Liquidación de Certificado Plazo Fijo', $4, $5, $6)
             on conflict (cliente_movimiento_id) do nothing`,
            [
              cuentaId,
              pf.monto_liquidado ?? pf.monto_deposito,
              fRet,
              pf.recibo_retiro ?? pf.numero_certificacion,
              adminUser.id,
              clienteMovIdRet,
            ],
          );
        }

        pfMigrados++;
      }
    }
    console.log(`   ✓ ${pfMigrados} Certificados de Plazo Fijo migrados.`);

    await client.query("COMMIT");

    console.log("\n==================================================================");
    console.log("   MIGRACIÓN COMPLETADA EXITOSAMENTE");
    console.log("==================================================================");
    console.log(`   • Padrón de Asociados:    ${sociosMigrados} socios cargados.`);
    console.log(`   • Cartera de Préstamos:   ${prestamosMigrados} créditos vivos activos.`);
    console.log(`   • Ahorro a Plazo Fijo:    ${pfMigrados} certificados cargados.`);
    console.log("==================================================================\n");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Error durante la migración:", err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error("Falló el script de migración:", err);
  process.exit(1);
});
