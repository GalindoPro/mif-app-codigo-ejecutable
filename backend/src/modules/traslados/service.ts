import { pool } from "../../db/pool";
import { notFound, forbidden, conflict } from "../../utils/errors";

/** Listar traslados — Admin/Gerencia ve todos; Supervisor solo su agencia */
export async function listarTraslados(usuarioRol: string, agenciaId: string | null) {
  const { rows } = await pool.query(
    `select t.*,
       s.nombres as socio_nombre,
       s.numero_asociado,
       s.dpi as socio_dpi,
       ao.nombre as agencia_origen_nombre,
       ao.codigo as agencia_origen_codigo,
       ad.nombre as agencia_destino_nombre,
       ad.codigo as agencia_destino_codigo,
       us.nombre as solicitado_por_nombre,
       us.rol as solicitado_por_rol,
       ua.nombre as aprobado_por_nombre
     from traslados t
     join socios s on s.id = t.socio_id
     join agencias ao on ao.id = t.agencia_origen_id
     join agencias ad on ad.id = t.agencia_destino_id
     join usuarios us on us.id = t.solicitado_por_id
     left join usuarios ua on ua.id = t.aprobado_por_id
     ${agenciaId && !["GERENCIA", "ADMIN"].includes(usuarioRol)
        ? "where (t.agencia_origen_id = $1 or t.agencia_destino_id = $1)"
        : ""}
     order by t.created_at desc`,
    agenciaId && !["GERENCIA", "ADMIN"].includes(usuarioRol) ? [agenciaId] : []
  );
  return rows;
}

/** Solicitar traslado */
export async function solicitarTraslado(
  socioId: string,
  agenciaDestinoId: string,
  motivo: string,
  solicitadoPorId: string,
  solicitadoPorRol: string,
  agenciaUsuario: string | null
) {
  // Verificar que el socio existe y obtener su agencia actual
  const { rows: socioRows } = await pool.query(
    "select id, nombres, numero_asociado, agencia_id from socios where id = $1",
    [socioId]
  );
  if (!socioRows[0]) throw notFound("Socio no encontrado.");
  const socio = socioRows[0];

  // Verificar que el usuario puede operar sobre este socio (misma agencia o admin)
  if (agenciaUsuario && !["GERENCIA", "ADMIN"].includes(solicitadoPorRol)) {
    if (socio.agencia_id !== agenciaUsuario) {
      throw forbidden("Solo puedes solicitar traslados de socios de tu agencia.");
    }
  }

  // Verificar que el destino es diferente al origen
  if (socio.agencia_id === agenciaDestinoId) {
    throw conflict("El socio ya pertenece a esa agencia.");
  }

  // Verificar si ya existe un traslado pendiente para este socio
  const { rows: pendientes } = await pool.query(
    "select id from traslados where socio_id = $1 and estado = 'PENDIENTE'",
    [socioId]
  );
  if (pendientes.length > 0) {
    throw conflict("Ya existe una solicitud de traslado pendiente para este socio.");
  }

  // Verificar crédito activo y saldo en ahorro
  const { rows: creditos } = await pool.query(
    "select count(*) as cnt from prestamos where socio_id = $1 and estado = 'DESEMBOLSADO'",
    [socioId]
  );
  const tieneCreditoActivo = Number(creditos[0].cnt) > 0;

  const { rows: ahorros } = await pool.query(
    "select coalesce(sum(saldo), 0) as total from cuentas where socio_id = $1",
    [socioId]
  );
  const tieneSaldoAhorro = Number(ahorros[0].total) > 0;

  // Insertar traslado
  const { rows } = await pool.query(
    `insert into traslados (
      socio_id, agencia_origen_id, agencia_destino_id,
      solicitado_por_id, estado, motivo,
      tiene_credito_activo, tiene_saldo_ahorro
    ) values ($1, $2, $3, $4, 'PENDIENTE', $5, $6, $7)
    returning *`,
    [
      socioId,
      socio.agencia_id,
      agenciaDestinoId,
      solicitadoPorId,
      motivo,
      tieneCreditoActivo,
      tieneSaldoAhorro,
    ]
  );

  return {
    traslado: rows[0],
    avisos: [
      tieneCreditoActivo
        ? "⚠️ El socio tiene un crédito activo. El traslado requiere que el crédito sea cancelado o transferido antes de ejecutarse."
        : null,
      tieneSaldoAhorro
        ? "ℹ️ El socio tiene saldo en cuentas de ahorro. El historial se transferirá completo a la agencia destino."
        : null,
    ].filter(Boolean),
  };
}

/** Aprobar traslado — Solo SUPERVISOR (de la agencia origen) o GERENCIA/ADMIN */
export async function aprobarTraslado(
  trasladoId: string,
  aprobadoPorId: string,
  aprobadoPorRol: string,
  agenciaUsuario: string | null,
  notasAdmin?: string
) {
  const { rows } = await pool.query(
    "select * from traslados where id = $1",
    [trasladoId]
  );
  if (!rows[0]) throw notFound("Solicitud de traslado no encontrada.");
  const traslado = rows[0];

  if (traslado.estado !== "PENDIENTE") {
    throw conflict(`La solicitud ya fue ${traslado.estado.toLowerCase()}.`);
  }

  // Solo supervisor de la agencia origen o gerencia puede aprobar
  if (!["GERENCIA", "ADMIN", "SUPERVISOR"].includes(aprobadoPorRol)) {
    throw forbidden("No tienes permisos para aprobar traslados.");
  }
  if (aprobadoPorRol === "SUPERVISOR" && agenciaUsuario !== traslado.agencia_origen_id) {
    throw forbidden("Solo el supervisor de la agencia de origen puede aprobar este traslado.");
  }

  // Verificar que no tenga crédito activo
  if (traslado.tiene_credito_activo) {
    const { rows: creds } = await pool.query(
      "select count(*) as cnt from prestamos where socio_id = $1 and estado = 'DESEMBOLSADO'",
      [traslado.socio_id]
    );
    if (Number(creds[0].cnt) > 0) {
      throw conflict(
        "No se puede aprobar el traslado: el socio tiene un crédito activo. Debe cancelarlo antes del traslado."
      );
    }
  }

  // Ejecutar traslado: actualizar agencia del socio y todas sus cuentas
  await pool.query("begin");
  try {
    // Actualizar agencia del socio
    await pool.query(
      "update socios set agencia_id = $1 where id = $2",
      [traslado.agencia_destino_id, traslado.socio_id]
    );

    // Actualizar cuentas de ahorro
    await pool.query(
      "update cuentas set agencia_id = $1 where socio_id = $2",
      [traslado.agencia_destino_id, traslado.socio_id]
    );

    // Marcar traslado como aprobado
    await pool.query(
      `update traslados set
        estado = 'APROBADO',
        aprobado_por_id = $1,
        notas_admin = $2,
        fecha_resolucion = current_date,
        updated_at = now()
      where id = $3`,
      [aprobadoPorId, notasAdmin ?? null, trasladoId]
    );

    await pool.query("commit");
  } catch (e) {
    await pool.query("rollback");
    throw e;
  }

  return { mensaje: "Traslado aprobado y ejecutado correctamente." };
}

/** Rechazar traslado */
export async function rechazarTraslado(
  trasladoId: string,
  rechazadoPorId: string,
  rechazadoPorRol: string,
  agenciaUsuario: string | null,
  notasAdmin: string
) {
  const { rows } = await pool.query(
    "select * from traslados where id = $1",
    [trasladoId]
  );
  if (!rows[0]) throw notFound("Solicitud de traslado no encontrada.");
  const traslado = rows[0];

  if (traslado.estado !== "PENDIENTE") {
    throw conflict(`La solicitud ya fue ${traslado.estado.toLowerCase()}.`);
  }

  if (!["GERENCIA", "ADMIN", "SUPERVISOR"].includes(rechazadoPorRol)) {
    throw forbidden("No tienes permisos para rechazar traslados.");
  }
  if (rechazadoPorRol === "SUPERVISOR" && agenciaUsuario !== traslado.agencia_origen_id) {
    throw forbidden("Solo el supervisor de la agencia de origen puede rechazar este traslado.");
  }

  await pool.query(
    `update traslados set
      estado = 'RECHAZADO',
      aprobado_por_id = $1,
      notas_admin = $2,
      fecha_resolucion = current_date,
      updated_at = now()
    where id = $3`,
    [rechazadoPorId, notasAdmin, trasladoId]
  );

  return { mensaje: "Solicitud de traslado rechazada." };
}

/** Estadísticas de traslados para dashboard */
export async function estadisticasTraslados(agenciaId: string | null) {
  const where = agenciaId
    ? "where (agencia_origen_id = $1 or agencia_destino_id = $1)"
    : "";
  const params = agenciaId ? [agenciaId] : [];

  const { rows } = await pool.query(
    `select
      count(*) filter (where estado = 'PENDIENTE') as pendientes,
      count(*) filter (where estado = 'APROBADO') as aprobados,
      count(*) filter (where estado = 'RECHAZADO') as rechazados,
      count(*) as total
     from traslados ${where}`,
    params
  );
  return rows[0];
}
