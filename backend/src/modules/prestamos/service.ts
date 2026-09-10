import { pool } from "../../db/pool";
import { withTransaction } from "../../db/transaction";
import { registrarAuditoria } from "../../utils/auditoria";
import { badRequest, notFound, forbidden, conflict } from "../../utils/errors";
import * as cuentasService from "../cuentas/service";
import { calcularAmortizacion } from "./amortizacion";
import { calcularLiquidacionCredito, distribuirMontoCobro } from "./liquidacion";
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

  // Se toma el máximo número ya usado (no count(*)): un count(*) genera un
  // código duplicado en cuanto hay un hueco en la secuencia, por ejemplo tras
  // borrar un crédito de prueba o si una migración entró con un correlativo
  // fuera de orden.
  const { rows } = await pool.query(
    `select coalesce(max(nullif(regexp_replace(codigo, '\\D', '', 'g'), '')::int), 0) as max_num
     from prestamos where agencia_id = $1`,
    [agenciaId],
  );
  const secuencial = String(rows[0].max_num + 1).padStart(4, "0");
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
    const qClean = params.q.replace(/\D/g, "");
    valores.push(`%${params.q.toLowerCase()}%`);
    const idx = valores.length;
    if (qClean.length >= 3) {
      valores.push(`%${qClean}%`);
      const idxClean = valores.length;
      condiciones.push(
        `(lower(s.nombres) like $${idx} or lower(p.codigo) like $${idx} or lower(coalesce(p.numero_credito_anterior, '')) like $${idx} or s.dpi like $${idx} or regexp_replace(coalesce(s.dpi, ''), '[^0-9]', '', 'g') like $${idxClean})`,
      );
    } else {
      condiciones.push(`(lower(s.nombres) like $${idx} or lower(p.codigo) like $${idx} or lower(coalesce(p.numero_credito_anterior, '')) like $${idx} or s.dpi like $${idx})`);
    }
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
  dpiFiador?: string | null;
  telefonoFiador?: string | null;
  documentoDesembolso?: string | null;
  observaciones?: string;
  fechaSolicitud?: string;
  crearCuentaAhorroSobrePrestamo?: boolean;
  origenFondos?: "FONDOS_PROPIOS" | "FEDERURAL" | "CHN_GUATEMALA";
  esMigracion?: boolean;
  saldoCapitalActual?: number;
  fechaUltimoPago?: string;
  fechaDesembolsoOriginal?: string;
  numeroCreditoAnterior?: string | null;
}

export async function crear(data: DatosCrearPrestamo, usuarioId: string) {
  if (data.montoSolicitado <= 0) throw badRequest("El monto solicitado debe ser mayor a cero");
  if (data.plazoMeses < 1) throw badRequest("El plazo debe ser de al menos 1 mes");

  const tasa = data.tasaInteresMensual !== undefined ? Number(data.tasaInteresMensual) : 2.0;
  const tipoAmort = data.tipoAmortizacion ?? "SOBRE_SALDOS";

  const fechaBaseCalculo = data.esMigracion && data.fechaDesembolsoOriginal ? data.fechaDesembolsoOriginal : data.fechaSolicitud;

  const sim = calcularAmortizacion({
    monto: data.montoSolicitado,
    plazoMeses: data.plazoMeses,
    tasaInteresMensual: tasa,
    tipoAmortizacion: tipoAmort,
    fechaInicio: fechaBaseCalculo,
  });

  return withTransaction(async (client) => {
    // Validaciones del Fiador si el crédito es FIDUCIARIO
    if (data.tipo === "FIDUCIARIO" && data.dpiFiador && data.dpiFiador.trim()) {
      const rawDpiFiador = data.dpiFiador.replace(/\D/g, "");
      if (rawDpiFiador.length === 13) {
        // 1. Verificar si coincide con el socio solicitante
        const { rows: sRows } = await client.query(`select dpi, nombres from socios where id = $1`, [data.socioId]);
        if (sRows[0]?.dpi && sRows[0].dpi.replace(/\D/g, "") === rawDpiFiador) {
          throw badRequest(`El socio solicitante (${sRows[0].nombres}) no puede ser su propio fiador.`);
        }

        // 2. Verificar si este fiador ya respalda un crédito activo
        const { rows: dupFiador } = await client.query(
          `select p.codigo, s.nombres as socio_nombre, s.numero_asociado, p.estado
           from prestamos p
           join socios s on s.id = p.socio_id
           where regexp_replace(coalesce(p.dpi_fiador, ''), '[^0-9]', '', 'g') = $1
             and p.estado in ('SOLICITUD', 'APROBADO', 'DESEMBOLSADO')
           limit 1`,
          [rawDpiFiador],
        );
        if (dupFiador[0]) {
          throw conflict(
            `El fiador con DPI "${data.dpiFiador.trim()}" ya está respaldando el crédito ${dupFiador[0].codigo} (${dupFiador[0].estado}) del socio "${dupFiador[0].socio_nombre}" (${dupFiador[0].numero_asociado}). No se permiten fiadores duplicados en créditos activos.`,
          );
        }
      }
    }

    const { rows: agencias } = await client.query(`select codigo from agencias where id = $1`, [data.agenciaId]);
    const codigoAgencia = agencias[0]?.codigo ?? "MIF";
    const { rows: totalRows } = await client.query(
      `select coalesce(max(nullif(regexp_replace(codigo, '\\D', '', 'g'), '')::int), 0) as max_num
       from prestamos where agencia_id = $1`,
      [data.agenciaId],
    );
    const secuencial = String(totalRows[0].max_num + 1).padStart(4, "0");
    const codigo = `${codigoAgencia}-CR-${secuencial}`;

    const hoy = new Date().toISOString().slice(0, 10);
    const origenFondos = data.origenFondos || "FONDOS_PROPIOS";
    const esMigracion = Boolean(data.esMigracion);

    const estadoInicial = esMigracion ? "DESEMBOLSADO" : "APROBADO";
    const saldoCapitalInicial = esMigracion && data.saldoCapitalActual !== undefined && Number(data.saldoCapitalActual) >= 0
      ? Number(data.saldoCapitalActual)
      : data.montoSolicitado;
    const fechaSolicitud = esMigracion ? (data.fechaDesembolsoOriginal || data.fechaSolicitud || hoy) : (data.fechaSolicitud || hoy);
    const fechaAprobacion = esMigracion ? (data.fechaDesembolsoOriginal || hoy) : hoy;
    const fechaDesembolso = esMigracion ? (data.fechaDesembolsoOriginal || hoy) : null;
    const fechaUltimoPago = esMigracion ? (data.fechaUltimoPago || data.fechaDesembolsoOriginal || hoy) : null;

    let fechaVencimiento: string | null = null;
    if (esMigracion && fechaDesembolso) {
      const { rows: vencRows } = await client.query(
        `select ($1::date + ($2 * interval '1 month'))::date as venc`,
        [fechaDesembolso, Number(data.plazoMeses) || 12],
      );
      fechaVencimiento = vencRows[0]?.venc ?? null;
    }

    let observacionesFinal = data.observaciones ?? "";
    if (esMigracion) {
      const notaMigracion = `[MIGRACIÓN HISTÓRICA] Crédito preexistente migrado.${data.numeroCreditoAnterior ? ` No. Crédito Anterior: ${data.numeroCreditoAnterior}.` : ''} Saldo capital migrado: Q ${saldoCapitalInicial.toFixed(2)}, Desembolso original: ${fechaDesembolso || 'N/A'}, Último pago registrado: ${fechaUltimoPago || 'N/A'}.`;
      observacionesFinal = observacionesFinal ? `${notaMigracion} ${observacionesFinal}` : notaMigracion;
    }

    const { rows } = await client.query(
      `insert into prestamos (
         codigo, socio_id, agencia_id, promotor_id, tipo, estado,
         tipo_amortizacion, monto_solicitado, monto_aprobado, saldo_capital, tasa_interes_mensual,
         plazo_meses, cuota_mensual, destino, garantia, ubicacion_garantia, nombre_fiador, dpi_fiador, telefono_fiador,
         documento_desembolso, observaciones, origen_fondos, fecha_solicitud, fecha_aprobacion, fecha_desembolso, fecha_vencimiento, fecha_ultimo_pago_migracion, es_migracion, numero_credito_anterior
       ) values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29)
       returning *`,
      [
        codigo,
        data.socioId,
        data.agenciaId,
        data.promotorId ?? null,
        data.tipo,
        estadoInicial,
        tipoAmort,
        data.montoSolicitado,
        data.montoSolicitado, // inicialmente igual al solicitado
        saldoCapitalInicial,
        tasa,
        data.plazoMeses,
        sim.cuotaMensualEstimada,
        data.destino ?? null,
        data.garantia ?? null,
        data.ubicacionGarantia ?? null,
        data.nombreFiador ?? null,
        data.dpiFiador ?? null,
        data.telefonoFiador ?? null,
        data.documentoDesembolso ?? null,
        observacionesFinal || null,
        origenFondos,
        fechaSolicitud,
        fechaAprobacion,
        fechaDesembolso,
        fechaVencimiento,
        fechaUltimoPago,
        esMigracion,
        data.numeroCreditoAnterior ?? null,
      ],
    );

    const prestamo = rows[0];

    // Si se solicitó, abrir automáticamente la cuenta de Ahorro sobre Préstamo dentro de la transacción.
    // Si esto falla, debe revertirse también la creación del crédito (no tragarse el error).
    if (data.crearCuentaAhorroSobrePrestamo) {
      const { numeroCuenta } = await cuentasService.siguienteNumero(data.agenciaId, "AHORRO_SOBRE_PRESTAMO");
      await client.query(
        `insert into cuentas (numero_cuenta, tipo, socio_id, agencia_id, saldo_inicial, observaciones_apertura, prestamo_id, creado_por_id)
         values ($1, 'AHORRO_SOBRE_PRESTAMO', $2, $3, 0, $4, $5, $6)
         on conflict do nothing`,
        [
          numeroCuenta,
          data.socioId,
          data.agenciaId,
          `Cuenta de ahorro en garantía vinculada al crédito ${prestamo.codigo}`,
          prestamo.id,
          usuarioId,
        ],
      );
    }

    await registrarAuditoria({
      entidad: "Prestamo",
      entidadId: prestamo.id,
      accion: "CREAR",
      usuarioId,
      datosNuevos: prestamo,
    });

    return prestamo;
  });
}

export async function cambiarEstado(
  id: string,
  nuevoEstado: EstadoPrestamo,
  usuarioId: string,
  agenciaVisible: string | null,
  montoAprobado?: number,
) {
  return withTransaction(async (client) => {
    const { rows: pRows } = await client.query(
      `select p.*,
              s.nombres as socio_nombres, s.numero_asociado, s.dpi as socio_dpi,
              a.nombre as agencia_nombre, a.codigo as agencia_codigo
       from prestamos p
       join socios s on s.id = p.socio_id
       join agencias a on a.id = p.agencia_id
       where p.id = $1`,
      [id],
    );
    const actual = pRows[0];
    if (!actual) throw notFound("Préstamo no encontrado");
    if (agenciaVisible && actual.agencia_id !== agenciaVisible) {
      throw forbidden("Ese préstamo pertenece a otra agencia");
    }

    // Reglas de la Máquina de Estados Financiera
    if (actual.estado === "CANCELADO" && nuevoEstado !== "CANCELADO") {
      throw conflict("El préstamo ya está CANCELADO y su saldo fue liquidado. No se permite reabrir el crédito.");
    }
    if (actual.estado === "RECHAZADO" && nuevoEstado !== "RECHAZADO") {
      throw conflict("El préstamo fue RECHAZADO por el comité. Debe crearse una nueva solicitud.");
    }

    if (nuevoEstado === "CANCELADO") {
      const saldo = Number(actual.saldo_capital);
      if (saldo > 0.01) {
        throw conflict(
          `No se puede marcar como CANCELADO un préstamo que aún tiene saldo de capital pendiente (Q ${saldo.toFixed(2)}). Debe liquidarse a través de un cobro de cuota o pago total.`,
        );
      }
    }

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
      const { rows: vencRows } = await client.query(
        `select (current_date + ($1 * interval '1 month'))::date as venc`,
        [Number(actual.plazo_meses) || 12],
      );
      fechaVencimiento = vencRows[0]?.venc ?? null;
    }

    const { rows } = await client.query(
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
  });
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

export async function obtenerLiquidacion(prestamoId: string, fechaLiquidacion?: string) {
  const { rows: pRows } = await pool.query(
    `select p.*, s.nombres as socio_nombres, s.numero_asociado, s.dpi as socio_dpi
     from prestamos p
     join socios s on s.id = p.socio_id
     where p.id = $1`,
    [prestamoId],
  );
  const prestamo = pRows[0];
  if (!prestamo) throw notFound("Préstamo no encontrado");

  // Buscar último pago registrado
  const { rows: pagos } = await pool.query(
    `select fecha from prestamo_pagos where prestamo_id = $1 order by fecha desc, created_at desc limit 1`,
    [prestamoId],
  );

  const fechaUltimoPago =
    pagos[0]?.fecha || prestamo.fecha_ultimo_pago_migracion || prestamo.fecha_desembolso || prestamo.fecha_solicitud || prestamo.created_at;

  const saldoCapital = Number(
    prestamo.saldo_capital !== null && prestamo.saldo_capital !== undefined
      ? prestamo.saldo_capital
      : prestamo.monto_aprobado || prestamo.monto_solicitado,
  );

  const liquidacion = calcularLiquidacionCredito({
    saldoCapital,
    tasaInteresMensual: Number(prestamo.tasa_interes_mensual) || 2.0,
    plazoMeses: Number(prestamo.plazo_meses) || 12,
    montoOriginal: Number(prestamo.monto_aprobado || prestamo.monto_solicitado),
    cuotaMensualEstimada: Number(prestamo.cuota_mensual) || 0,
    fechaUltimoPago,
    fechaLiquidacion: fechaLiquidacion || new Date().toISOString().slice(0, 10),
    tipoAmortizacion: prestamo.tipo_amortizacion,
  });

  return {
    prestamo,
    liquidacion,
  };
}

export async function verificarFiador(dpi: string, socioIdSolicitante?: string) {
  const rawDpi = dpi.replace(/\D/g, "");
  if (rawDpi.length !== 13) {
    return { valido: false, mensaje: "El DPI del fiador debe contener 13 dígitos numéricos" };
  }

  // 1. Verificar si coincide con el socio solicitante
  if (socioIdSolicitante) {
    const { rows: socioRows } = await pool.query(`select id, nombres, dpi from socios where id = $1`, [socioIdSolicitante]);
    if (socioRows[0] && socioRows[0].dpi) {
      const socioDpiClean = socioRows[0].dpi.replace(/\D/g, "");
      if (socioDpiClean === rawDpi) {
        return {
          valido: true,
          disponible: false,
          motivo: "SOCIO_MISMO",
          mensaje: `El socio solicitante (${socioRows[0].nombres}) no puede ser su propio fiador.`,
        };
      }
    }
  }

  // 2. Verificar si este fiador ya respalda un crédito activo
  const { rows: prestamoRows } = await pool.query(
    `select p.id, p.codigo, p.monto_solicitado, p.estado, s.nombres as socio_nombre, s.numero_asociado
     from prestamos p
     join socios s on s.id = p.socio_id
     where regexp_replace(coalesce(p.dpi_fiador, ''), '[^0-9]', '', 'g') = $1
       and p.estado in ('SOLICITUD', 'APROBADO', 'DESEMBOLSADO')
     limit 1`,
    [rawDpi],
  );

  if (prestamoRows[0]) {
    return {
      valido: true,
      disponible: false,
      motivo: "FIADOR_REPETIDO",
      mensaje: `Este fiador ya respalda el crédito ${prestamoRows[0].codigo} (${prestamoRows[0].estado}) del socio ${prestamoRows[0].socio_nombre} (${prestamoRows[0].numero_asociado}). No se permiten fiadores duplicados en créditos activos.`,
      prestamo: {
        codigo: prestamoRows[0].codigo,
        socioNombre: prestamoRows[0].socio_nombre,
        numeroAsociado: prestamoRows[0].numero_asociado,
        estado: prestamoRows[0].estado,
      },
    };
  }

  // 3. Verificar si el fiador es un socio registrado de la cooperativa
  const { rows: socioFiador } = await pool.query(
    `select id, nombres, numero_asociado from socios where regexp_replace(coalesce(dpi, ''), '[^0-9]', '', 'g') = $1 limit 1`,
    [rawDpi],
  );

  if (socioFiador[0]) {
    return {
      valido: true,
      disponible: true,
      esSocio: true,
      socio: {
        id: socioFiador[0].id,
        nombres: socioFiador[0].nombres,
        numeroAsociado: socioFiador[0].numero_asociado,
      },
      mensaje: `✓ Fiador identificado: Socio ${socioFiador[0].nombres} (${socioFiador[0].numero_asociado}) — Al día y disponible.`,
    };
  }

  return {
    valido: true,
    disponible: true,
    esSocio: false,
    mensaje: "✓ Fiador externo válido y disponible (no requiere aportación previa).",
  };
}

export interface FiltrosFiadores {
  agenciaId?: string | null;
  q?: string;
  tipoFiltro?: "TODOS" | "EXTERNOS" | "SOCIOS";
}

export async function listarFiadores(filtros: FiltrosFiadores) {
  const valores: unknown[] = [];
  const condiciones: string[] = [
    `p.tipo = 'FIDUCIARIO'`,
    `p.nombre_fiador is not null`,
    `trim(p.nombre_fiador) != ''`,
  ];

  if (filtros.agenciaId) {
    valores.push(filtros.agenciaId);
    condiciones.push(`p.agencia_id = $${valores.length}`);
  }

  if (filtros.q) {
    const qClean = filtros.q.replace(/\D/g, "");
    valores.push(`%${filtros.q.toLowerCase()}%`);
    const idx = valores.length;
    if (qClean.length >= 3) {
      valores.push(`%${qClean}%`);
      const idxClean = valores.length;
      condiciones.push(
        `(lower(p.nombre_fiador) like $${idx} or p.dpi_fiador like $${idx} or regexp_replace(coalesce(p.dpi_fiador, ''), '[^0-9]', '', 'g') like $${idxClean} or lower(s.nombres) like $${idx} or lower(p.codigo) like $${idx})`,
      );
    } else {
      condiciones.push(
        `(lower(p.nombre_fiador) like $${idx} or p.dpi_fiador like $${idx} or lower(s.nombres) like $${idx} or lower(p.codigo) like $${idx})`,
      );
    }
  }

  const query = `
    select distinct on (coalesce(nullif(regexp_replace(coalesce(p.dpi_fiador, ''), '[^0-9]', '', 'g'), ''), lower(trim(p.nombre_fiador))))
      p.id as prestamo_id,
      p.codigo as prestamo_codigo,
      p.estado as prestamo_estado,
      p.monto_solicitado,
      p.monto_aprobado,
      p.saldo_capital,
      p.fecha_solicitud,
      p.fecha_desembolso,
      p.nombre_fiador,
      p.dpi_fiador,
      p.telefono_fiador,
      p.ubicacion_garantia as lugar_fiador,
      s.id as socio_id,
      s.numero_asociado as socio_numero,
      s.nombres as socio_nombre,
      a.nombre as agencia_nombre,
      u.nombre as promotor_nombre,
      sf.id as socio_fiador_id,
      sf.numero_asociado as socio_fiador_numero,
      sf.nombres as socio_fiador_nombres,
      case when sf.id is not null then true else false end as es_socio_activo
    from prestamos p
    join socios s on s.id = p.socio_id
    join agencias a on a.id = p.agencia_id
    left join usuarios u on u.id = p.promotor_id
    left join socios sf on regexp_replace(coalesce(sf.dpi, ''), '[^0-9]', '', 'g') = regexp_replace(coalesce(p.dpi_fiador, ''), '[^0-9]', '', 'g') and coalesce(p.dpi_fiador, '') != ''
    where ${condiciones.join(" and ")}
    order by coalesce(nullif(regexp_replace(coalesce(p.dpi_fiador, ''), '[^0-9]', '', 'g'), ''), lower(trim(p.nombre_fiador))), p.created_at desc
  `;

  const { rows } = await pool.query(query, valores);

  if (filtros.tipoFiltro === "EXTERNOS") {
    return rows.filter((r) => !r.es_socio_activo);
  }
  if (filtros.tipoFiltro === "SOCIOS") {
    return rows.filter((r) => r.es_socio_activo);
  }

  return rows;
}

export interface DatosRefinanciar {
  nuevaTasa: number;
  nuevoPlazo: number;
  observaciones?: string;
}

export async function refinanciar(
  prestamoId: string,
  data: DatosRefinanciar,
  usuarioId: string,
  agenciaVisibleParam: string | null,
) {
  if (data.nuevaTasa <= 0) throw badRequest("La nueva tasa debe ser mayor a cero");
  if (data.nuevoPlazo < 1) throw badRequest("El nuevo plazo debe ser de al menos 1 mes");

  return withTransaction(async (client) => {
    const { rows: pRows } = await client.query(
      `select * from prestamos where id = $1`,
      [prestamoId],
    );
    const prestamo = pRows[0];
    if (!prestamo) throw notFound("Préstamo no encontrado");
    if (agenciaVisibleParam && prestamo.agencia_id !== agenciaVisibleParam) {
      throw forbidden("Ese préstamo pertenece a otra agencia");
    }
    if (prestamo.estado !== "DESEMBOLSADO") {
      throw badRequest(`Solo se pueden refinanciar préstamos desembolsados (estado actual: ${prestamo.estado})`);
    }
    if (Number(prestamo.saldo_capital) <= 0) {
      throw badRequest("El préstamo ya está saldado; no requiere refinanciamiento");
    }

    // Calcular nueva cuota con el saldo actual como nuevo monto
    const nuevaSim = calcularAmortizacion({
      monto: Number(prestamo.saldo_capital),
      plazoMeses: data.nuevoPlazo,
      tasaInteresMensual: data.nuevaTasa,
      tipoAmortizacion: prestamo.tipo_amortizacion,
      fechaInicio: new Date().toISOString().slice(0, 10),
    });

    // Registrar el refinanciamiento
    await client.query(
      `insert into refinanciamientos
         (prestamo_id, saldo_capital_anterior, tasa_anterior, plazo_anterior, cuota_anterior,
          nueva_tasa, nuevo_plazo, nueva_cuota, observaciones, usuario_id)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
      [
        prestamoId,
        prestamo.saldo_capital,
        prestamo.tasa_interes_mensual,
        prestamo.plazo_meses,
        prestamo.cuota_mensual,
        data.nuevaTasa,
        data.nuevoPlazo,
        nuevaSim.cuotaMensualEstimada,
        data.observaciones ?? null,
        usuarioId,
      ],
    );

    // Actualizar el préstamo con los nuevos términos
    const hoy = new Date().toISOString().slice(0, 10);
    const { rows: vencRows } = await client.query(
      `select ($1::date + ($2 * interval '1 month'))::date as venc`,
      [hoy, data.nuevoPlazo],
    );

    const notaRefinanciamiento = `[REFINANCIAMIENTO ${hoy}] Tasa anterior: ${prestamo.tasa_interes_mensual}%, Plazo anterior: ${prestamo.plazo_meses} meses, Cuota anterior: Q${Number(prestamo.cuota_mensual).toFixed(2)}.`;
    const obsActualizada = prestamo.observaciones
      ? `${prestamo.observaciones}\n${notaRefinanciamiento}`
      : notaRefinanciamiento;

    const { rows } = await client.query(
      `update prestamos set
         tasa_interes_mensual = $1,
         plazo_meses = $2,
         cuota_mensual = $3,
         fecha_vencimiento = $4,
         observaciones = $5,
         updated_at = now()
       where id = $6
       returning *`,
      [
        data.nuevaTasa,
        data.nuevoPlazo,
        nuevaSim.cuotaMensualEstimada,
        vencRows[0]?.venc ?? null,
        obsActualizada,
        prestamoId,
      ],
    );

    await registrarAuditoria({
      entidad: "Prestamo",
      entidadId: prestamoId,
      accion: "ACTUALIZAR",
      usuarioId,
      datosAnteriores: {
        tasa_interes_mensual: prestamo.tasa_interes_mensual,
        plazo_meses: prestamo.plazo_meses,
        cuota_mensual: prestamo.cuota_mensual,
      },
      datosNuevos: {
        tasa_interes_mensual: data.nuevaTasa,
        plazo_meses: data.nuevoPlazo,
        cuota_mensual: nuevaSim.cuotaMensualEstimada,
        tipo: "REFINANCIAMIENTO",
      },
    });

    return { prestamo: rows[0], simulacion: nuevaSim };
  });
}

export async function listarRefinanciamientos(prestamoId: string) {
  const { rows } = await pool.query(
    `select r.*, u.nombre as usuario_nombre
     from refinanciamientos r
     join usuarios u on u.id = r.usuario_id
     where r.prestamo_id = $1
     order by r.created_at desc`,
    [prestamoId],
  );
  return rows;
}
