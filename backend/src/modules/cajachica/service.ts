import { pool } from "../../db/pool";
import { registrarAuditoria } from "../../utils/auditoria";
import { conflict } from "../../utils/errors";

export async function listar(params: { agenciaId: string | null; q?: string }) {
  const condiciones: string[] = [];
  const valores: unknown[] = [];

  if (params.agenciaId) {
    valores.push(params.agenciaId);
    condiciones.push(`c.agencia_id = $${valores.length}`);
  }
  if (params.q) {
    valores.push(`%${params.q.toLowerCase()}%`);
    condiciones.push(`(lower(c.beneficiario) like $${valores.length} or lower(c.descripcion) like $${valores.length})`);
  }
  const where = condiciones.length ? `where ${condiciones.join(" and ")}` : "";

  const [{ rows: comprobantes }, { rows: totales }, { rows: porCategoria }] = await Promise.all([
    pool.query(
      `select c.*, u.nombre as usuario_nombre
       from caja_chica_comprobantes c join usuarios u on u.id = c.usuario_id
       ${where}
       order by c.fecha desc, c.created_at desc
       limit 200`,
      valores,
    ),
    pool.query(
      `select
         coalesce(sum(case when tipo = 'INGRESO' then monto else 0 end), 0) as total_ingresos,
         coalesce(sum(case when tipo = 'EGRESO' then monto else 0 end), 0) as total_egresos
       from caja_chica_comprobantes c ${where}`,
      valores,
    ),
    pool.query(
      `select coalesce(c.categoria::text, 'SIN_CATEGORIA') as categoria, sum(c.monto)::numeric as total
       from caja_chica_comprobantes c
       ${where ? `${where} and c.tipo = 'EGRESO'` : "where c.tipo = 'EGRESO'"}
       group by c.categoria
       order by total desc`,
      valores,
    ),
  ]);

  const totalIngresos = Number(totales[0].total_ingresos);
  const totalEgresos = Number(totales[0].total_egresos);
  const totalesPorCategoria = porCategoria.map((r) => ({ categoria: r.categoria, total: Number(r.total) }));

  return {
    data: comprobantes,
    saldoActual: totalIngresos - totalEgresos,
    totalIngresos,
    totalEgresos,
    totalesPorCategoria,
  };
}

export interface DatosComprobante {
  agenciaId: string;
  fecha: string;
  numeroDocumento?: string;
  beneficiario: string;
  descripcion: string;
  tipo: "INGRESO" | "EGRESO";
  categoria?: string;
  monto: number;
}

export async function crear(data: DatosComprobante, usuarioId: string) {
  if (data.tipo === "EGRESO") {
    const { rows } = await pool.query(
      `select
         coalesce(sum(case when tipo = 'INGRESO' then monto else 0 end), 0)
         - coalesce(sum(case when tipo = 'EGRESO' then monto else 0 end), 0) as saldo
       from caja_chica_comprobantes where agencia_id = $1`,
      [data.agenciaId],
    );
    const saldo = Number(rows[0].saldo);
    if (data.monto > saldo) {
      throw conflict(`El egreso (Q ${data.monto.toFixed(2)}) es mayor que el saldo disponible en caja (Q ${saldo.toFixed(2)})`);
    }
  }

  const { rows } = await pool.query(
    `insert into caja_chica_comprobantes (agencia_id, fecha, numero_documento, beneficiario, descripcion, tipo, categoria, monto, usuario_id)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9)
     returning *`,
    [
      data.agenciaId,
      data.fecha,
      data.numeroDocumento ?? "DTE",
      data.beneficiario,
      data.descripcion,
      data.tipo,
      data.tipo === "EGRESO" ? data.categoria ?? null : null,
      data.monto,
      usuarioId,
    ],
  );
  const comprobante = rows[0];
  await registrarAuditoria({
    entidad: "CajaChicaComprobante",
    entidadId: comprobante.id,
    accion: "CREAR",
    usuarioId,
    datosNuevos: comprobante,
  });
  return comprobante;
}
