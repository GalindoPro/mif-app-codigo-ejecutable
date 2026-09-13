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

const DOC_PLACEHOLDER = "DTE";

export async function obtenerUltimoDocumento(agenciaId: string, fecha: string) {
  const { rows } = await pool.query(
    `select numero_documento from caja_chica_comprobantes
     where agencia_id = $1 and fecha = $2
       and numero_documento is not null and trim(numero_documento) <> ''
       and upper(trim(numero_documento)) <> $3
     order by created_at desc limit 1`,
    [agenciaId, fecha, DOC_PLACEHOLDER],
  );
  return { ultimoNumeroDocumento: rows[0]?.numero_documento ?? null };
}

export async function verificarNumeroDocumentoExiste(agenciaId: string, fecha: string, numeroDocumento: string) {
  const doc = numeroDocumento.trim();
  if (!doc || doc.toUpperCase() === DOC_PLACEHOLDER) return { existe: false };

  const { rows } = await pool.query(
    `select id from caja_chica_comprobantes
     where agencia_id = $1 and fecha = $2 and lower(trim(numero_documento)) = lower($3)
     limit 1`,
    [agenciaId, fecha, doc],
  );
  return { existe: rows.length > 0 };
}

export interface DatosReposicionCajaChica {
  agenciaId: string;
  monto: number;
  numeroCheque: string;
  descripcion?: string;
  fecha?: string;
}

export async function reponerFondo(data: DatosReposicionCajaChica, usuarioId: string) {
  if (!data.numeroCheque || !data.numeroCheque.trim()) {
    throw conflict("El número de cheque o documento de reposición (No. CH.) es obligatorio.");
  }
  const fecha = data.fecha || new Date().toISOString().slice(0, 10);
  const ch = data.numeroCheque.trim();

  // Validar anti-duplicados del cheque en caja chica
  const { rows: repetido } = await pool.query(
    `select fecha, numero_documento, descripcion from caja_chica_comprobantes
     where agencia_id = $1 and tipo = 'INGRESO' and lower(trim(numero_documento)) = lower($2) limit 1`,
    [data.agenciaId, ch],
  );
  if (repetido[0]) {
    const fechaStr = new Date(repetido[0].fecha).toLocaleDateString("es-GT");
    throw conflict(`El cheque o recibo de reposición "${ch}" ya fue registrado el ${fechaStr} en Caja Chica.`);
  }

  const { rows } = await pool.query(
    `insert into caja_chica_comprobantes (agencia_id, fecha, numero_documento, beneficiario, descripcion, tipo, monto, usuario_id)
     values ($1, $2, $3, $4, $5, 'INGRESO', $6, $7)
     returning *`,
    [
      data.agenciaId,
      fecha,
      ch,
      `BANCO / REPOSICIÓN CHEQUE No. ${ch}`,
      data.descripcion?.trim() || `Reposición de Fondo Fijo de Caja Chica (Cheque No. ${ch})`,
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

export interface ParamsReporteCajaChica {
  agenciaId: string;
  fechaInicio?: string;
  fechaFin?: string;
  categoria?: string;
}

export async function generarReporte(params: ParamsReporteCajaChica) {
  const { agenciaId, fechaInicio, fechaFin, categoria } = params;

  // 1. Obtener datos de la agencia
  const { rows: agRows } = await pool.query(
    `select id, codigo, nombre from agencias where id = $1`,
    [agenciaId],
  );
  const agencia = agRows[0] || { id: agenciaId, codigo: "AG", nombre: "Agencia" };

  // 2. Obtener última reposición (último INGRESO registrado en la agencia)
  const { rows: lastRepoRows } = await pool.query(
    `select fecha, numero_documento, monto, descripcion, created_at
     from caja_chica_comprobantes
     where agencia_id = $1 and tipo = 'INGRESO'
     order by fecha desc, created_at desc
     limit 1`,
    [agenciaId],
  );
  const ultimaReposicion = lastRepoRows[0]
    ? {
        fecha: lastRepoRows[0].fecha,
        numeroDocumento: lastRepoRows[0].numero_documento,
        monto: Number(lastRepoRows[0].monto),
        descripcion: lastRepoRows[0].descripcion,
      }
    : null;

  // 3. Saldo acumulado histórico total de la agencia
  const { rows: balanceGlobal } = await pool.query(
    `select
       coalesce(sum(case when tipo = 'INGRESO' then monto else 0 end), 0) as total_ingresos_global,
       coalesce(sum(case when tipo = 'EGRESO' then monto else 0 end), 0) as total_egresos_global
     from caja_chica_comprobantes
     where agencia_id = $1`,
    [agenciaId],
  );
  const saldoDisponibleActual =
    Number(balanceGlobal[0].total_ingresos_global) - Number(balanceGlobal[0].total_egresos_global);

  // 4. Saldo anterior a fechaInicio (si se especifica fechaInicio)
  let saldoAnterior = 0;
  if (fechaInicio) {
    const { rows: anteriorRows } = await pool.query(
      `select
         coalesce(sum(case when tipo = 'INGRESO' then monto else 0 end), 0)
         - coalesce(sum(case when tipo = 'EGRESO' then monto else 0 end), 0) as saldo_anterior
       from caja_chica_comprobantes
       where agencia_id = $1 and fecha < $2`,
      [agenciaId, fechaInicio],
    );
    saldoAnterior = Number(anteriorRows[0].saldo_anterior);
  }

  // 5. Filtros para el período
  const condiciones: string[] = [`c.agencia_id = $1`];
  const valores: unknown[] = [agenciaId];

  if (fechaInicio) {
    valores.push(fechaInicio);
    condiciones.push(`c.fecha >= $${valores.length}`);
  }
  if (fechaFin) {
    valores.push(fechaFin);
    condiciones.push(`c.fecha <= $${valores.length}`);
  }
  if (categoria) {
    valores.push(categoria);
    condiciones.push(`c.categoria = $${valores.length}`);
  }

  const wherePeriodo = `where ${condiciones.join(" and ")}`;

  // 6. Consultar comprobantes del período con usuario
  const { rows: comprobantes } = await pool.query(
    `select c.*, u.nombre as usuario_nombre
     from caja_chica_comprobantes c join usuarios u on u.id = c.usuario_id
     ${wherePeriodo}
     order by c.fecha asc, c.created_at asc`,
    valores,
  );

  // 7. Agrupar egresos por categoría en el período
  const { rows: porCatRows } = await pool.query(
    `select coalesce(c.categoria::text, 'SIN_CATEGORIA') as categoria, sum(c.monto)::numeric as total, count(*)::int as cantidad
     from caja_chica_comprobantes c
     ${wherePeriodo} and c.tipo = 'EGRESO'
     group by c.categoria
     order by total desc`,
    valores,
  );

  // Separar ingresos y egresos
  const egresos = comprobantes.filter((c) => c.tipo === "EGRESO");
  const ingresos = comprobantes.filter((c) => c.tipo === "INGRESO");

  const totalEgresosPeriodo = egresos.reduce((acc, c) => acc + Number(c.monto), 0);
  const totalIngresosPeriodo = ingresos.reduce((acc, c) => acc + Number(c.monto), 0);
  const saldoFinalPeriodo = fechaInicio
    ? saldoAnterior + totalIngresosPeriodo - totalEgresosPeriodo
    : saldoDisponibleActual;

  return {
    agencia,
    fechaInicio: fechaInicio || null,
    fechaFin: fechaFin || null,
    categoriaFiltro: categoria || null,
    ultimaReposicion,
    saldoAnterior,
    totalIngresosPeriodo,
    totalEgresosPeriodo,
    saldoFinalPeriodo,
    saldoDisponibleActual,
    egresos,
    ingresos,
    totalesPorCategoria: porCatRows.map((r) => ({
      categoria: r.categoria,
      total: Number(r.total),
      cantidad: Number(r.cantidad),
      porcentaje: totalEgresosPeriodo > 0 ? (Number(r.total) / totalEgresosPeriodo) * 100 : 0,
    })),
  };
}


export async function editar(id: string, data: Partial<DatosComprobante>, usuarioId: string, motivo: string) {
  const { rows: anteriores } = await pool.query(
    "select * from caja_chica_comprobantes where id = $1",
    [id]
  );
  if (!anteriores[0]) throw conflict("El comprobante no existe.");
  const ant = anteriores[0];

  const { rows } = await pool.query(
    `update caja_chica_comprobantes
     set fecha = coalesce($1, fecha),
         numero_documento = coalesce($2, numero_documento),
         beneficiario = coalesce($3, beneficiario),
         descripcion = coalesce($4, descripcion),
         tipo = coalesce($5, tipo),
         categoria = coalesce($6, categoria),
         monto = coalesce($7, monto)
     where id = $8
     returning *`,
    [
      data.fecha,
      data.numeroDocumento,
      data.beneficiario,
      data.descripcion,
      data.tipo,
      data.categoria,
      data.monto,
      id
    ]
  );

  const comprobante = rows[0];
  await registrarAuditoria({
    entidad: "CajaChicaComprobante",
    entidadId: id,
    accion: "ACTUALIZAR",
    usuarioId,
    datosAnteriores: ant,
    datosNuevos: comprobante,
    motivo
  });
  return comprobante;
}
