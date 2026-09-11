import { pool } from "../../db/pool";
import { withTransaction } from "../../db/transaction";
import { registrarAuditoria } from "../../utils/auditoria";
import { redondear2, hoyGT } from "../../utils/financiero";
import { badRequest, notFound, conflict } from "../../utils/errors";

export async function calcularExcedentes(
  anio: number,
  montoTotal: number,
  agenciaId: string | null,
  usuarioId: string,
) {
  if (montoTotal <= 0) throw badRequest("El monto de excedentes debe ser mayor a cero");
  if (!Number.isInteger(anio) || anio < 2000 || anio > 2100) throw badRequest("Año inválido");

  // Verificar que no exista ya para este año/agencia
  const { rows: existe } = await pool.query(
    `select id, estado from excedentes
     where anio = $1 and ($2::uuid is null and agencia_id is null or agencia_id = $2) limit 1`,
    [anio, agenciaId],
  );
  if (existe[0]) {
    throw conflict(
      `Ya existe un cálculo de excedentes para el año ${anio}. Estado: ${existe[0].estado}. Elimínelo antes de recalcular.`,
    );
  }

  // Aportaciones de socios ACTIVOS con cuenta APORTACION ACTIVA
  const { rows: aportaciones } = await pool.query(
    `select s.id as socio_id, s.nombres, s.numero_asociado,
            c.id as cuenta_id,
            coalesce(sc.saldo_actual, c.saldo_inicial, 0)::numeric as total_aportacion
     from socios s
     join cuentas c on c.socio_id = s.id and c.tipo = 'APORTACION' and c.estado = 'ACTIVA'
     left join saldos_cuenta sc on sc.cuenta_id = c.id
     where s.estado = 'ACTIVO' and ($1::uuid is null or s.agencia_id = $1)`,
    [agenciaId],
  );

  if (aportaciones.length === 0)
    throw badRequest("No hay socios activos con aportaciones para distribuir excedentes");

  const totalAportaciones = aportaciones.reduce((acc, r) => acc + Number(r.total_aportacion), 0);
  if (totalAportaciones <= 0) throw badRequest("El total de aportaciones es cero; no se puede distribuir");

  return withTransaction(async (client) => {
    const { rows: excRows } = await client.query(
      `insert into excedentes (anio, agencia_id, monto_total, estado, creado_por)
       values ($1, $2, $3, 'CALCULADO', $4) returning *`,
      [anio, agenciaId, montoTotal, usuarioId],
    );
    const excedente = excRows[0];

    const detalles = [];
    for (const apor of aportaciones) {
      const pct = Number(apor.total_aportacion) / totalAportaciones;
      const montoAsignado = redondear2(montoTotal * pct);
      detalles.push({ socioId: apor.socio_id, nombres: apor.nombres, numeroAsociado: apor.numero_asociado, montoAsignado, pct: redondear2(pct * 100) });
      await client.query(
        `insert into excedentes_detalle
           (excedente_id, socio_id, total_aportacion, porcentaje, monto_asignado, cuenta_id, aplicado)
         values ($1,$2,$3,$4,$5,$6,false)`,
        [excedente.id, apor.socio_id, apor.total_aportacion, redondear2(pct * 100), montoAsignado, apor.cuenta_id],
      );
    }

    await registrarAuditoria({
      entidad: "Excedente",
      entidadId: excedente.id,
      accion: "CREAR",
      usuarioId,
      datosNuevos: { anio, montoTotal, socios: aportaciones.length, totalAportaciones: redondear2(totalAportaciones) },
    });

    return {
      excedente,
      totalAportaciones: redondear2(totalAportaciones),
      totalSocios: aportaciones.length,
      detalles,
    };
  });
}

export async function listarExcedentes(agenciaId: string | null) {
  const { rows } = await pool.query(
    `select e.*, u.nombre as creado_por_nombre,
            count(ed.id)::int as total_socios,
            coalesce(sum(ed.monto_asignado), 0)::numeric as total_distribuido
     from excedentes e
     left join usuarios u on u.id = e.creado_por
     left join excedentes_detalle ed on ed.excedente_id = e.id
     where ($1::uuid is null or e.agencia_id = $1)
     group by e.id, u.nombre
     order by e.anio desc, e.created_at desc`,
    [agenciaId],
  );
  return rows;
}

export async function obtenerExcedente(id: string) {
  const { rows: eRows } = await pool.query(`select * from excedentes where id = $1`, [id]);
  if (!eRows[0]) throw notFound("Distribución de excedentes no encontrada");

  const { rows: detalle } = await pool.query(
    `select ed.*, s.nombres as socio_nombres, s.numero_asociado, c.numero_cuenta
     from excedentes_detalle ed
     join socios s on s.id = ed.socio_id
     left join cuentas c on c.id = ed.cuenta_id
     where ed.excedente_id = $1
     order by ed.monto_asignado desc`,
    [id],
  );
  return { ...eRows[0], detalle };
}

export async function aplicarExcedentes(id: string, usuarioId: string) {
  const exc = await obtenerExcedente(id);
  if (exc.estado === "APLICADO") throw badRequest("Este excedente ya fue aplicado");

  const hoy = hoyGT();

  return withTransaction(async (client) => {
    for (const d of exc.detalle) {
      if (!d.cuenta_id || d.aplicado || Number(d.monto_asignado) <= 0) continue;

      await client.query(
        `insert into movimientos
           (cuenta_id, tipo, monto, fecha, descripcion, usuario_id, cliente_movimiento_id)
         values ($1,'DEPOSITO',$2,$3,$4,$5,$6)`,
        [
          d.cuenta_id,
          Number(d.monto_asignado),
          hoy,
          `Excedentes cooperativa año ${exc.anio}`,
          usuarioId,
          `EXC-${id.slice(-6)}-${d.socio_id.slice(-6)}`,
        ],
      );

      await client.query(
        `update excedentes_detalle set aplicado = true where id = $1`,
        [d.id],
      );
    }

    const { rows: updated } = await client.query(
      `update excedentes set estado = 'APLICADO', aplicado_at = now() where id = $1 returning *`,
      [id],
    );

    await registrarAuditoria({
      entidad: "Excedente",
      entidadId: id,
      accion: "ACTUALIZAR",
      usuarioId,
      datosNuevos: { estado: "APLICADO", socios_acreditados: exc.detalle.filter((d: any) => !d.aplicado).length },
    });

    return updated[0];
  });
}
