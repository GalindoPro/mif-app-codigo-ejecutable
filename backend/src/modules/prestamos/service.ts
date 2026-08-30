import { pool } from "../../db/pool";
import { registrarAuditoria } from "../../utils/auditoria";
import { badRequest, notFound, forbidden } from "../../utils/errors";
import { calcularAmortizacion } from "./amortizacion";
import type { OpcionesSimulacion } from "./amortizacion";
import type {
  EstadoPrestamo,
  Prestamo,
  TipoAmortizacion,
  TipoPrestamo,
} from "../../types/models";

export async function siguienteCodigo(agenciaId: string): Promise<string> {
  const { rows: agencias } = await pool.query(`select codigo from agencias where id = $1`, [agenciaId]);
  const codigoAgencia = agencias[0]?.codigo ?? "MIF";

  const { rows } = await pool.query(
    `select count(*)::int as total from prestamos where agencia_id = $1`,
    [agenciaId],
  );
  const secuencial = String(rows[0].total + 1).padStart(4, "0");
  return `${codigoAgencia}-CR-${secuencial}`;
}

export async function listar(params: {
  agenciaId: string | null;
  promotorId?: string;
  socioId?: string;
  estado?: EstadoPrestamo;
  q?: string;
}) {
  const condiciones: string[] = [];
  const valores: unknown[] = [];

  if (params.agenciaId) {
    valores.push(params.agenciaId);
    condiciones.push(`p.agencia_id = $${valores.length}`);
  }
  if (params.promotorId) {
    valores.push(params.promotorId);
    condiciones.push(`p.promotor_id = $${valores.length}`);
  }
  if (params.socioId) {
    valores.push(params.socioId);
    condiciones.push(`p.socio_id = $${valores.length}`);
  }
  if (params.estado) {
    valores.push(params.estado);
    condiciones.push(`p.estado = $${valores.length}`);
  }
  if (params.q) {
    valores.push(`%${params.q.toLowerCase()}%`);
    const idx = valores.length;
    condiciones.push(`(lower(s.nombres) like $${idx} or lower(p.codigo) like $${idx} or s.dpi like $${idx})`);
  }

  const where = condiciones.length ? `where ${condiciones.join(" and ")}` : "";

  const query = `
    select p.*,
           s.nombres as socio_nombres, s.numero_asociado, s.dpi as socio_dpi, s.telefono as socio_telefono,
           a.nombre as agencia_nombre, a.codigo as agencia_codigo,
           u.nombre as promotor_nombre
    from prestamos p
    join socios s on s.id = p.socio_id
    join agencias a on a.id = p.agencia_id
    left join usuarios u on u.id = p.promotor_id
    ${where}
    order by p.created_at desc
  `;

  const { rows } = await pool.query(query, valores);
  return rows;
}

export async function obtener(id: string, agenciaVisible: string | null) {
  const query = `
    select p.*,
           s.nombres as socio_nombres, s.numero_asociado, s.dpi as socio_dpi, s.telefono as socio_telefono, s.direccion as socio_direccion,
           a.nombre as agencia_nombre, a.codigo as agencia_codigo,
           u.nombre as promotor_nombre, u.email as promotor_email
    from prestamos p
    join socios s on s.id = p.socio_id
    join agencias a on a.id = p.agencia_id
    left join usuarios u on u.id = p.promotor_id
    where p.id = $1
  `;

  const { rows } = await pool.query(query, [id]);
  const prestamo = rows[0];
  if (!prestamo) throw notFound("Préstamo no encontrado");
  if (agenciaVisible && prestamo.agencia_id !== agenciaVisible) {
    throw forbidden("Ese préstamo pertenece a otra agencia");
  }

  // Generar tabla de amortización oficial del préstamo
  const sim = calcularAmortizacion({
    monto: Number(prestamo.monto_aprobado ?? prestamo.monto_solicitado),
    plazoMeses: Number(prestamo.plazo_meses),
    tasaInteresMensual: Number(prestamo.tasa_interes_mensual),
    tipoAmortizacion: prestamo.tipo_amortizacion,
    fechaInicio: prestamo.fecha_desembolso || prestamo.fecha_solicitud,
  });

  return { ...prestamo, amortizacion: sim };
}

export interface DatosCrearPrestamo {
  agenciaId: string;
  socioId: string;
  promotorId?: string | null;
  tipo: TipoPrestamo;
  tipoAmortizacion?: TipoAmortizacion;
  montoSolicitado: number;
  plazoMeses: number;
  tasaInteresMensual?: number;
  destino?: string;
  garantia?: string;
  ubicacionGarantia?: string | null;
  nombreFiador?: string | null;
  documentoDesembolso?: string | null;
  observaciones?: string;
  fechaSolicitud?: string;
}

export async function crear(data: DatosCrearPrestamo, usuarioId: string) {
  if (data.montoSolicitado <= 0) throw badRequest("El monto solicitado debe ser mayor a cero");
  if (data.plazoMeses < 1) throw badRequest("El plazo debe ser de al menos 1 mes");

  const tasa = data.tasaInteresMensual !== undefined ? Number(data.tasaInteresMensual) : 2.0;
  const tipoAmort = data.tipoAmortizacion ?? "CUOTA_NIVELADA";

  const sim = calcularAmortizacion({
    monto: data.montoSolicitado,
    plazoMeses: data.plazoMeses,
    tasaInteresMensual: tasa,
    tipoAmortizacion: tipoAmort,
    fechaInicio: data.fechaSolicitud,
  });

  const codigo = await siguienteCodigo(data.agenciaId);

  const { rows } = await pool.query(
    `insert into prestamos (
       codigo, socio_id, agencia_id, promotor_id, tipo, estado,
       tipo_amortizacion, monto_solicitado, monto_aprobado, saldo_capital, tasa_interes_mensual,
       plazo_meses, cuota_mensual, destino, garantia, ubicacion_garantia, nombre_fiador, documento_desembolso, observaciones, fecha_solicitud
     ) values ($1, $2, $3, $4, $5, 'SOLICITUD', $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
     returning *`,
    [
      codigo,
      data.socioId,
      data.agenciaId,
      data.promotorId ?? null,
      data.tipo,
      tipoAmort,
      data.montoSolicitado,
      data.montoSolicitado, // inicialmente igual al solicitado
      data.montoSolicitado, // saldo_capital inicial
      tasa,
      data.plazoMeses,
      sim.cuotaMensualEstimada,
      data.destino ?? null,
      data.garantia ?? null,
      data.ubicacionGarantia ?? null,
      data.nombreFiador ?? null,
      data.documentoDesembolso ?? null,
      data.observaciones ?? null,
      data.fechaSolicitud || new Date().toISOString().slice(0, 10),
    ],
  );

  const prestamo = rows[0];

  await registrarAuditoria({
    entidad: "Prestamo",
    entidadId: prestamo.id,
    accion: "CREAR",
    usuarioId,
    datosNuevos: prestamo,
  });

  return prestamo;
}

export async function cambiarEstado(
  id: string,
  nuevoEstado: EstadoPrestamo,
  usuarioId: string,
  agenciaVisible: string | null,
  montoAprobado?: number,
) {
  const actual = await obtener(id, agenciaVisible);

  let fechaAprobacion = actual.fecha_aprobacion;
  let fechaDesembolso = actual.fecha_desembolso;
  let fechaVencimiento = actual.fecha_vencimiento;
  const hoy = new Date().toISOString().slice(0, 10);
  let nuevoSaldoCapital = actual.saldo_capital;

  if (nuevoEstado === "APROBADO") {
    fechaAprobacion = hoy;
    nuevoSaldoCapital = montoAprobado ?? actual.monto_aprobado ?? actual.monto_solicitado;
  } else if (nuevoEstado === "DESEMBOLSADO") {
    if (!fechaAprobacion) fechaAprobacion = hoy;
    fechaDesembolso = hoy;
    nuevoSaldoCapital = actual.saldo_capital ?? montoAprobado ?? actual.monto_aprobado ?? actual.monto_solicitado;
    const { rows: vencRows } = await pool.query(
      `select (current_date + ($1 * interval '1 month'))::date as venc`,
      [Number(actual.plazo_meses) || 12],
    );
    fechaVencimiento = vencRows[0]?.venc ?? null;
  }

  const { rows } = await pool.query(
    `update prestamos
     set estado = $1,
         monto_aprobado = coalesce($2, monto_aprobado),
         saldo_capital = coalesce($3, saldo_capital),
         fecha_aprobacion = $4,
         fecha_desembolso = $5,
         fecha_vencimiento = coalesce($6, fecha_vencimiento),
         updated_at = now()
     where id = $7
     returning *`,
    [nuevoEstado, montoAprobado ?? null, nuevoSaldoCapital, fechaAprobacion, fechaDesembolso, fechaVencimiento, id],
  );

  const actualizado = rows[0];

  await registrarAuditoria({
    entidad: "Prestamo",
    entidadId: id,
    accion: "ACTUALIZAR",
    usuarioId,
    datosAnteriores: { estado: actual.estado, monto_aprobado: actual.monto_aprobado },
    datosNuevos: { estado: nuevoEstado, monto_aprobado: actualizado.monto_aprobado },
  });

  return actualizado;
}

export async function listarPagos(prestamoId: string) {
  const { rows } = await pool.query(
    `select pp.*, u.nombre as usuario_nombre
     from prestamo_pagos pp
     join usuarios u on u.id = pp.usuario_id
     where pp.prestamo_id = $1
     order by pp.fecha asc, pp.created_at asc`,
    [prestamoId],
  );
  return rows;
}

export interface FiltrosKardexCartera {
  agenciaId: string | null;
  promotorId?: string | null;
  tipo?: TipoPrestamo;
  mes?: string; // YYYY-MM
}

export async function obtenerKardexCartera(filtros: FiltrosKardexCartera) {
  const condiciones: string[] = ["p.estado in ('DESEMBOLSADO', 'CANCELADO')"];
  const valores: any[] = [];
  let idx = 1;

  if (filtros.agenciaId) {
    condiciones.push(`p.agencia_id = $${idx++}`);
    valores.push(filtros.agenciaId);
  }
  if (filtros.promotorId) {
    condiciones.push(`p.promotor_id = $${idx++}`);
    valores.push(filtros.promotorId);
  }
  if (filtros.tipo) {
    condiciones.push(`p.tipo = $${idx++}`);
    valores.push(filtros.tipo);
  }

  const { rows: prestamos } = await pool.query(
    `select p.*,
            s.nombres as socio_nombres, s.numero_asociado, s.telefono as socio_telefono,
            s.dpi as socio_dpi, s.direccion as socio_direccion,
            a.nombre as agencia_nombre, a.codigo as agencia_codigo,
            u.nombre as promotor_nombre, u.email as promotor_email
     from prestamos p
     join socios s on s.id = p.socio_id
     join agencias a on a.id = p.agencia_id
     left join usuarios u on u.id = p.promotor_id
     where ${condiciones.join(" and ")}
     order by p.tipo asc, p.codigo asc`,
    valores,
  );

  const mesFiltro = filtros.mes || new Date().toISOString().slice(0, 7); // 'YYYY-MM'

  const kardexItems = await Promise.all(
    prestamos.map(async (p) => {
      const { rows: pagos } = await pool.query(
        `select pp.*, u.nombre as usuario_nombre
         from prestamo_pagos pp
         left join usuarios u on u.id = pp.usuario_id
         where pp.prestamo_id = $1
         order by pp.fecha asc, pp.created_at asc`,
        [p.id],
      );

      const pagosMes = pagos.filter((pg) => {
        const f = pg.fecha instanceof Date ? pg.fecha.toISOString().slice(0, 7) : String(pg.fecha).slice(0, 7);
        return f === mesFiltro;
      });
      const totalPagadoMes = pagosMes.reduce((acc, pg) => acc + Number(pg.total_pagado), 0);
      const abonoCapitalMes = pagosMes.reduce((acc, pg) => acc + Number(pg.abono_capital), 0);
      const totalPagadoHistorico = pagos.reduce((acc, pg) => acc + Number(pg.total_pagado), 0);

      const ultimoPago = pagos[pagos.length - 1];

      let estadoCuotaMes: "AL_DIA" | "PENDIENTE_MES" | "CANCELADO" = "PENDIENTE_MES";
      if (p.estado === "CANCELADO" || Number(p.saldo_capital) <= 0) {
        estadoCuotaMes = "CANCELADO";
      } else if (pagosMes.length > 0) {
        estadoCuotaMes = "AL_DIA";
      }

      return {
        ...p,
        pagos,
        mesFiltro,
        pagosMesCount: pagosMes.length,
        totalPagadoMes,
        abonoCapitalMes,
        totalPagadoHistorico,
        ultimoPagoFecha: ultimoPago?.fecha ?? null,
        ultimoPagoRecibo: ultimoPago?.numero_recibo ?? null,
        estadoCuotaMes,
      };
    }),
  );

  const totalCarteraViva = kardexItems
    .filter((k) => k.estado !== "CANCELADO")
    .reduce((acc, k) => acc + Number(k.saldo_capital || 0), 0);

  const hipotecarios = kardexItems.filter((k) => k.tipo === "HIPOTECARIO");
  const fiduciarios = kardexItems.filter((k) => k.tipo === "FIDUCIARIO");

  const totalColocadoHipotecario = hipotecarios.reduce(
    (acc, k) => acc + Number(k.monto_aprobado || k.monto_solicitado),
    0,
  );
  const totalColocadoFiduciario = fiduciarios.reduce(
    (acc, k) => acc + Number(k.monto_aprobado || k.monto_solicitado),
    0,
  );

  const sociosAlDia = kardexItems.filter((k) => k.estadoCuotaMes === "AL_DIA").length;
  const sociosPendientes = kardexItems.filter((k) => k.estadoCuotaMes === "PENDIENTE_MES").length;
  const totalCobradoMes = kardexItems.reduce((acc, k) => acc + k.totalPagadoMes, 0);

  return {
    items: kardexItems,
    resumen: {
      mes: mesFiltro,
      totalCreditos: kardexItems.length,
      totalCarteraViva,
      totalColocadoHipotecario,
      countHipotecarios: hipotecarios.length,
      totalColocadoFiduciario,
      countFiduciarios: fiduciarios.length,
      sociosAlDia,
      sociosPendientes,
      totalCobradoMes,
    },
  };
}

export function simular(opciones: OpcionesSimulacion) {
  return calcularAmortizacion(opciones);
}

