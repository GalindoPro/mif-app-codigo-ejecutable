import { PoolClient } from "pg";
import { pool } from "../../db/pool";
import { withTransaction } from "../../db/transaction";
import { registrarAuditoria } from "../../utils/auditoria";
import { badRequest, notFound, forbidden, conflict } from "../../utils/errors";
import * as cuentasService from "../cuentas/service";
import { CATEGORIAS, CajaCategoria, DENOMINACIONES, categoriasDelGrupo } from "./categorias";
import { calcularLiquidacionCredito, distribuirMontoCobro } from "../prestamos/liquidacion";

function hoyISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function checarAgencia(agenciaId: string, agenciaVisible: string | null) {
  if (agenciaVisible && agenciaId !== agenciaVisible) throw forbidden("Esa caja pertenece a otra agencia");
}

export async function estado(agenciaId: string, agenciaVisible: string | null) {
  checarAgencia(agenciaId, agenciaVisible);
  const fecha = hoyISO();

  // 1. ¿Hay caja abierta actualmente?
  const { rows: abiertos } = await pool.query(
    `select * from caja_dias where agencia_id = $1 and estado = 'ABIERTO' order by fecha desc limit 1`,
    [agenciaId],
  );
  if (abiertos[0]) return { estado: "ABIERTO" as const, dia: abiertos[0] };

  // 2. ¿La caja de hoy ya fue cerrada?
  const { rows: cerradosHoy } = await pool.query(
    `select * from caja_dias where agencia_id = $1 and fecha = $2 and estado = 'CERRADO' order by created_at desc limit 1`,
    [agenciaId, fecha],
  );
  if (cerradosHoy[0]) {
    const detalleCerrado = await detalle(cerradosHoy[0].id, agenciaVisible);
    return {
      estado: "CERRADO" as const,
      dia: cerradosHoy[0],
      detalle: detalleCerrado,
    };
  }

  // 3. Pendiente de abrir (toma saldo de la última caja cerrada)
  const { rows: ultimos } = await pool.query(
    `select * from caja_dias where agencia_id = $1 order by fecha desc limit 1`,
    [agenciaId],
  );
  const ultimo = ultimos[0] ?? null;
  return {
    estado: "SIN_ABRIR" as const,
    saldoSugerido: ultimo ? Number(ultimo.saldo_final) : null,
    fechaUltimoCierre: ultimo ? ultimo.fecha : null,
    esPrimeraVez: !ultimo,
  };
}

export async function historialDias(agenciaId: string, agenciaVisible: string | null, limite = 30) {
  checarAgencia(agenciaId, agenciaVisible);
  const { rows } = await pool.query(
    `select d.*,
       u_abrio.nombre as abierto_por_nombre,
       u_cerro.nombre as cerrado_por_nombre,
       (select count(*) from caja_movimientos_auxiliar m where m.caja_dia_id = d.id)::int as total_movimientos,
       (select coalesce(sum(case when tipo = 'INGRESO' then monto else 0 end), 0) from caja_movimientos_auxiliar m where m.caja_dia_id = d.id) as total_ingresos,
       (select coalesce(sum(case when tipo = 'EGRESO' then monto else 0 end), 0) from caja_movimientos_auxiliar m where m.caja_dia_id = d.id) as total_egresos
     from caja_dias d
     left join usuarios u_abrio on u_abrio.id = d.abierto_por
     left join usuarios u_cerro on u_cerro.id = d.cerrado_por
     where d.agencia_id = $1
     order by d.fecha desc, d.created_at desc
     limit $2`,
    [agenciaId, limite],
  );
  return rows;
}

export async function abrirDia(agenciaId: string, usuarioId: string, agenciaVisible: string | null, saldoInicialManual?: number) {
  checarAgencia(agenciaId, agenciaVisible);
  const fecha = hoyISO();

  return withTransaction(async (client) => {
    const { rows: abiertos } = await client.query(
      `select * from caja_dias where agencia_id = $1 and estado = 'ABIERTO' order by fecha desc limit 1`,
      [agenciaId],
    );
    if (abiertos[0]) {
      const fechaAbierto = new Date(abiertos[0].fecha).toISOString().slice(0, 10);
      if (fechaAbierto === fecha) return abiertos[0];
      throw conflict(`Todavía tienes la caja del ${fechaAbierto} sin cerrar. Ciérrala antes de abrir la de hoy.`);
    }

    const { rows: existeHoy } = await client.query(
      `select * from caja_dias where agencia_id = $1 and fecha = $2`,
      [agenciaId, fecha],
    );
    if (existeHoy[0]) throw conflict("La caja de hoy ya fue cerrada; no se puede volver a abrir.");

    const { rows: ultimos } = await client.query(
      `select * from caja_dias where agencia_id = $1 order by fecha desc limit 1`,
      [agenciaId],
    );
    const ultimo = ultimos[0] ?? null;

    let saldoInicial: number;
    if (ultimo) {
      saldoInicial = Number(ultimo.saldo_final);
    } else {
      if (saldoInicialManual === undefined || saldoInicialManual === null) {
        throw badRequest("Es la primera vez que se abre la caja de esta agencia; indica el saldo inicial.");
      }
      saldoInicial = saldoInicialManual;
    }

    const { rows } = await client.query(
      `insert into caja_dias (agencia_id, fecha, saldo_inicial, estado, abierto_por)
       values ($1,$2,$3,'ABIERTO',$4)
       returning *`,
      [agenciaId, fecha, saldoInicial, usuarioId],
    );
    const dia = rows[0];
    await registrarAuditoria({ entidad: "CajaDia", entidadId: dia.id, accion: "CREAR", usuarioId, datosNuevos: dia });
    return dia;
  });
}

async function obtenerDiaCrudo(id: string, agenciaVisible: string | null) {
  const { rows } = await pool.query(`select * from caja_dias where id = $1`, [id]);
  const dia = rows[0];
  if (!dia) throw notFound("Día de caja no encontrado");
  checarAgencia(dia.agencia_id, agenciaVisible);
  return dia;
}

export async function detalle(id: string, agenciaVisible: string | null) {
  const dia = await obtenerDiaCrudo(id, agenciaVisible);

  const { rows: movimientos } = await pool.query(
    `select m.*, u.nombre as usuario_nombre
     from caja_movimientos_auxiliar m join usuarios u on u.id = m.usuario_id
     where m.caja_dia_id = $1
     order by m.created_at asc`,
    [id],
  );

  const totalIngreso = movimientos.filter((m) => m.tipo === "INGRESO").reduce((acc, m) => acc + Number(m.monto), 0);
  const totalEgreso = movimientos.filter((m) => m.tipo === "EGRESO").reduce((acc, m) => acc + Number(m.monto), 0);
  const saldoActual = movimientos.length ? Number(movimientos[movimientos.length - 1].saldo_acumulado) : Number(dia.saldo_inicial);

  let arqueo = null;
  if (dia.estado === "CERRADO") {
    const { rows: arqueos } = await pool.query(`select * from caja_arqueos where caja_dia_id = $1`, [id]);
    arqueo = arqueos[0] ?? null;
  }

  return { dia, movimientos, totalIngreso, totalEgreso, saldoActual, arqueo };
}

export interface DatosMovimientoAuxiliar {
  categoria: CajaCategoria;
  monto: number;
  beneficiario?: string;
  socioId?: string;
  cuentaId?: string;
  docNo?: string;
  referenciaAut?: string;
}

export async function crearMovimiento(
  diaId: string,
  data: DatosMovimientoAuxiliar,
  usuarioId: string,
  agenciaVisible: string | null,
) {
  return withTransaction(async (client) => {
    const { rows: diaRows } = await client.query(`select * from caja_dias where id = $1`, [diaId]);
    const dia = diaRows[0];
    if (!dia) throw notFound("Día de caja no encontrado");
    checarAgencia(dia.agencia_id, agenciaVisible);
    if (dia.estado !== "ABIERTO") throw conflict("La caja de este día ya está cerrada; no se pueden agregar movimientos.");

    const info = CATEGORIAS[data.categoria];
    if (!info) throw badRequest("Categoría de movimiento no reconocida");
    if (!data.monto || data.monto <= 0) throw badRequest("El monto debe ser mayor a cero");

    // Validación de número de documento / recibo anti-duplicados
    if (data.docNo && data.docNo.trim()) {
      const doc = data.docNo.trim();
      // 1. Checar en caja_movimientos_auxiliar
      const { rows: repetidoAux } = await client.query(
        `select fecha, doc_no, beneficiario, descripcion
         from caja_movimientos_auxiliar
         where agencia_id = $1 and lower(trim(doc_no)) = lower($2)
         limit 1`,
        [dia.agencia_id, doc],
      );
      if (repetidoAux[0]) {
        const fechaStr = new Date(repetidoAux[0].fecha).toLocaleDateString("es-GT");
        throw conflict(
          `El número de documento/recibo "${doc}" ya fue registrado el ${fechaStr} en Auxiliar de Caja (${repetidoAux[0].descripcion} - ${repetidoAux[0].beneficiario}). No se permiten documentos duplicados.`,
        );
      }

      // 2. Checar en prestamo_pagos
      const { rows: repetidoPago } = await client.query(
        `select pp.fecha, pp.numero_recibo, p.codigo, s.nombres as socio_nombres
         from prestamo_pagos pp
         join prestamos p on p.id = pp.prestamo_id
         join socios s on s.id = pp.socio_id
         where pp.agencia_id = $1 and lower(trim(pp.numero_recibo)) = lower($2)
         limit 1`,
        [dia.agencia_id, doc],
      );
      if (repetidoPago[0]) {
        const fechaStr = new Date(repetidoPago[0].fecha).toLocaleDateString("es-GT");
        throw conflict(
          `El número de recibo "${doc}" ya fue registrado el ${fechaStr} en el crédito ${repetidoPago[0].codigo} (${repetidoPago[0].socio_nombres}). No se permiten recibos duplicados.`,
        );
      }

      // 3. Checar en movimientos de cuentas (si no requiereCuenta, pues requiereCuenta se valida en cuentasService)
      if (!info.requiereCuenta) {
        const { rows: repetidoMov } = await client.query(
          `select m.fecha, m.numero_recibo, c.numero_cuenta, s.nombres as socio_nombres
           from movimientos m
           join cuentas c on c.id = m.cuenta_id
           join socios s on s.id = c.socio_id
           where c.agencia_id = $1 and lower(trim(m.numero_recibo)) = lower($2)
           limit 1`,
          [dia.agencia_id, doc],
        );
        if (repetidoMov[0]) {
          const fechaStr = new Date(repetidoMov[0].fecha).toLocaleDateString("es-GT");
          throw conflict(
            `El número de recibo "${doc}" ya fue registrado el ${fechaStr} en la cuenta ${repetidoMov[0].numero_cuenta} (${repetidoMov[0].socio_nombres}). No se permiten recibos duplicados.`,
          );
        }
      }
    }

    const { rows: contadorRows } = await client.query(
      `select count(*)::int as total from caja_movimientos_auxiliar
       where agencia_id = $1 and categoria::text = any($2::text[])`,
      [dia.agencia_id, categoriasDelGrupo(info.grupoContador)],
    );
    const contador = contadorRows[0].total + 1;

    let socioId: string | null = data.socioId ?? null;
    let cuentaId: string | null = null;
    let movimientoId: string | null = null;
    let ingresoComifId: string | null = null;
    let referencia: string | null = data.referenciaAut ?? null;
    let beneficiario = data.beneficiario?.trim() ?? "";

    if (info.requiereCuenta) {
      if (!data.cuentaId) throw badRequest("Selecciona la cuenta del socio");
      const { rows: ctaRows } = await client.query(
        `select c.*, s.nombres as socio_nombres, s.id as socio_id from cuentas c join socios s on s.id = c.socio_id where c.id = $1`,
        [data.cuentaId],
      );
      const cuenta = ctaRows[0];
      if (!cuenta) throw notFound("Cuenta no encontrada");
      if (agenciaVisible && cuenta.agencia_id !== agenciaVisible) throw forbidden("Esa cuenta pertenece a otra agencia");
      if (cuenta.tipo !== info.requiereCuenta) throw badRequest("La cuenta seleccionada no corresponde a este tipo de ahorro");

      const movimiento = await cuentasService.registrarMovimientoConClient(
        client,
        data.cuentaId,
        {
          tipo: info.movimientoTipo!,
          monto: data.monto,
          fecha: new Date(dia.fecha).toISOString().slice(0, 10),
          numeroRecibo: data.docNo,
          descripcion: info.descripcion,
        },
        usuarioId,
        agenciaVisible,
      );

      cuentaId = data.cuentaId;
      movimientoId = movimiento.id;
      socioId = cuenta.socio_id;
      beneficiario = cuenta.socio_nombres;
      referencia = `${cuenta.numero_cuenta}-${info.tipo === "INGRESO" ? "IN" : "EN"}`;
    } else if (info.ingresosComifCategoria) {
      if (!beneficiario) throw badRequest("Indica el nombre del socio o beneficiario");
      const { rows } = await client.query(
        `insert into ingresos_comif (agencia_id, fecha, numero_documento, nombre_socio, categoria, monto, usuario_id)
         values ($1,$2,$3,$4,$5,$6,$7)
         returning id`,
        [dia.agencia_id, dia.fecha, data.docNo ?? null, beneficiario, info.ingresosComifCategoria, data.monto, usuarioId],
      );
      ingresoComifId = rows[0].id;
    } else {
      if (!beneficiario) throw badRequest("Indica el beneficiario");
    }

    const { rows: ultimoMovRows } = await client.query(
      `select saldo_acumulado from caja_movimientos_auxiliar where caja_dia_id = $1 order by created_at desc limit 1`,
      [diaId],
    );
    const saldoPrevio = ultimoMovRows[0] ? Number(ultimoMovRows[0].saldo_acumulado) : Number(dia.saldo_inicial);
    const saldoAcumulado = info.tipo === "INGRESO" ? saldoPrevio + data.monto : saldoPrevio - data.monto;

    if (info.tipo === "EGRESO" && saldoAcumulado < 0) {
      throw conflict(
        `Este egreso (Q ${data.monto.toFixed(2)}) dejaría la caja en negativo (saldo disponible: Q ${saldoPrevio.toFixed(2)})`,
      );
    }

    const { rows } = await client.query(
      `insert into caja_movimientos_auxiliar
         (caja_dia_id, agencia_id, fecha, seccion, categoria, tipo, contador, referencia,
          socio_id, cuenta_id, movimiento_id, ingreso_comif_id, beneficiario, descripcion, doc_no,
          monto, saldo_acumulado, usuario_id)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)
       returning *`,
      [
        diaId,
        dia.agencia_id,
        dia.fecha,
        info.seccion,
        data.categoria,
        info.tipo,
        contador,
        referencia,
        socioId,
        cuentaId,
        movimientoId,
        ingresoComifId,
        beneficiario,
        info.descripcion,
        data.docNo ?? null,
        data.monto,
        saldoAcumulado,
        usuarioId,
      ],
    );
    const registro = rows[0];
    await registrarAuditoria({
      entidad: "CajaMovimientoAuxiliar",
      entidadId: registro.id,
      accion: "CREAR",
      usuarioId,
      datosNuevos: registro,
    });
    return registro;
  });
}

export interface ItemConteo {
  valor: number;
  cantidad: number;
}

export async function cerrarDia(diaId: string, conteo: ItemConteo[], usuarioId: string, agenciaVisible: string | null) {
  return withTransaction(async (client) => {
    const { rows: diaRows } = await client.query(`select * from caja_dias where id = $1`, [diaId]);
    const dia = diaRows[0];
    if (!dia) throw notFound("Día de caja no encontrado");
    checarAgencia(dia.agencia_id, agenciaVisible);
    if (dia.estado !== "ABIERTO") throw conflict("Esta caja ya está cerrada");

    const denominacionesFaltantes = DENOMINACIONES.filter((d) => !conteo.some((c) => Math.abs(c.valor - d) < 0.001));
    if (denominacionesFaltantes.length) {
      throw badRequest(`Falta el conteo de: Q${denominacionesFaltantes.join(", Q")}`);
    }

    const { rows: ultimoMovRows } = await client.query(
      `select saldo_acumulado from caja_movimientos_auxiliar where caja_dia_id = $1 order by created_at desc limit 1`,
      [diaId],
    );
    const saldoFinal = ultimoMovRows[0] ? Number(ultimoMovRows[0].saldo_acumulado) : Number(dia.saldo_inicial);

    const totalContado = conteo.reduce((acc, c) => acc + c.valor * c.cantidad, 0);
    const diferencia = Math.round((totalContado - saldoFinal) * 100) / 100;

    if (Math.abs(diferencia) > 0.01) {
      throw conflict(
        `La caja no cuadra: contado Q ${totalContado.toFixed(2)} vs. saldo esperado Q ${saldoFinal.toFixed(2)} (diferencia Q ${diferencia.toFixed(2)}). Revisa el conteo o los movimientos antes de cerrar.`,
      );
    }

    await client.query(
      `insert into caja_arqueos (caja_dia_id, detalle, total_contado, diferencia, usuario_id)
       values ($1,$2,$3,$4,$5)`,
      [diaId, JSON.stringify(conteo), totalContado, diferencia, usuarioId],
    );
    const { rows } = await client.query(
      `update caja_dias set estado = 'CERRADO', saldo_final = $2, cerrado_por = $3, cerrado_at = now()
       where id = $1
       returning *`,
      [diaId, saldoFinal, usuarioId],
    );
    const diaActualizado = rows[0];
    await registrarAuditoria({
      entidad: "CajaDia",
      entidadId: diaId,
      accion: "ACTUALIZAR",
      usuarioId,
      datosNuevos: diaActualizado,
    });
    return diaActualizado;
  });
}

export async function beneficiariosFrecuentes(agenciaId: string, q: string, agenciaVisible: string | null) {
  checarAgencia(agenciaId, agenciaVisible);
  const { rows } = await pool.query(
    `select distinct beneficiario from caja_movimientos_auxiliar
     where agencia_id = $1 and seccion = 'BI' and lower(beneficiario) like $2
     order by beneficiario
     limit 10`,
    [agenciaId, `%${q.toLowerCase()}%`],
  );
  return rows.map((r) => r.beneficiario);
}

export interface DatosCobroCredito {
  prestamoId: string;
  socioId: string;
  abonoCapital: number;
  interes: number;
  mora?: number;
  ahorroSobrePrestamo?: number;
  origenFondos?: "FONDOS_PROPIOS" | "FEDERURAL" | "CHN_GUATEMALA";
  docNo?: string;
  cuentaDebitoId?: string;
}

export async function cobrarCuotaCredito(
  diaId: string,
  data: DatosCobroCredito,
  usuarioId: string,
  agenciaVisible: string | null,
) {
  return withTransaction(async (client) => {
    const { rows: diaRows } = await client.query(`select * from caja_dias where id = $1`, [diaId]);
    const dia = diaRows[0];
    if (!dia) throw notFound("Día de caja no encontrado");
    checarAgencia(dia.agencia_id, agenciaVisible);
    if (dia.estado !== "ABIERTO") {
      throw conflict("La caja de este día ya está cerrada; no se pueden registrar cobros.");
    }

    const { rows: prestamoRows } = await client.query(
      `select p.*, s.nombres as socio_nombres, s.numero_asociado
       from prestamos p
       join socios s on s.id = p.socio_id
       where p.id = $1`,
      [data.prestamoId],
    );
    const prestamo = prestamoRows[0];
    if (!prestamo) throw notFound("Préstamo no encontrado");
    if (agenciaVisible && prestamo.agencia_id !== agenciaVisible) {
      throw forbidden("Ese préstamo pertenece a otra agencia");
    }
    if (prestamo.estado !== "DESEMBOLSADO" && prestamo.estado !== "APROBADO") {
      throw badRequest(`El préstamo no está activo para cobro (estado actual: ${prestamo.estado})`);
    }

    const abonoCapital = Number(data.abonoCapital) || 0;
    const interes = Number(data.interes) || 0;
    const mora = Number(data.mora) || 0;
    const ahorroSobrePrestamo = Number(data.ahorroSobrePrestamo) || 0;
    const totalCobro = Math.round((abonoCapital + interes + mora + ahorroSobrePrestamo) * 100) / 100;

    if (totalCobro <= 0) {
      throw badRequest("El monto total a cobrar debe ser mayor a cero");
    }

    const saldoActualCapital = Number(
      prestamo.saldo_capital !== null && prestamo.saldo_capital !== undefined
        ? prestamo.saldo_capital
        : prestamo.monto_aprobado || prestamo.monto_solicitado,
    );

    if (abonoCapital > saldoActualCapital) {
      throw badRequest(
        `El abono a capital (Q ${abonoCapital.toFixed(2)}) no puede ser mayor al saldo pendiente de capital (Q ${saldoActualCapital.toFixed(2)}).`,
      );
    }

    const nuevoSaldoCapital = Math.max(0, Math.round((saldoActualCapital - abonoCapital) * 100) / 100);
    const nuevoEstadoPrestamo = nuevoSaldoCapital === 0 ? "CANCELADO" : prestamo.estado;

    // Validación de número de recibo anti-duplicados
    if (data.docNo && data.docNo.trim()) {
      const doc = data.docNo.trim();
      const { rows: repetidoPago } = await client.query(
        `select pp.fecha, pp.numero_recibo, p.codigo, s.nombres as socio_nombres
         from prestamo_pagos pp
         join prestamos p on p.id = pp.prestamo_id
         join socios s on s.id = pp.socio_id
         where pp.agencia_id = $1 and lower(trim(pp.numero_recibo)) = lower($2)
         limit 1`,
        [dia.agencia_id, doc],
      );
      if (repetidoPago[0]) {
        const fechaStr = new Date(repetidoPago[0].fecha).toLocaleDateString("es-GT");
        throw conflict(
          `El número de recibo "${doc}" ya fue registrado el ${fechaStr} en el crédito ${repetidoPago[0].codigo} (${repetidoPago[0].socio_nombres}). No se permiten recibos duplicados.`,
        );
      }

      const { rows: repetidoAux } = await client.query(
        `select fecha, doc_no, beneficiario, descripcion
         from caja_movimientos_auxiliar
         where agencia_id = $1 and lower(trim(doc_no)) = lower($2)
         limit 1`,
        [dia.agencia_id, doc],
      );
      if (repetidoAux[0]) {
        const fechaStr = new Date(repetidoAux[0].fecha).toLocaleDateString("es-GT");
        throw conflict(
          `El número de recibo/documento "${doc}" ya fue registrado el ${fechaStr} en Auxiliar de Caja (${repetidoAux[0].descripcion} - ${repetidoAux[0].beneficiario}). No se permiten documentos duplicados.`,
        );
      }

      const { rows: repetidoMov } = await client.query(
        `select m.fecha, m.numero_recibo, c.numero_cuenta, s.nombres as socio_nombres
         from movimientos m
         join cuentas c on c.id = m.cuenta_id
         join socios s on s.id = c.socio_id
         where c.agencia_id = $1 and lower(trim(m.numero_recibo)) = lower($2)
         limit 1`,
        [dia.agencia_id, doc],
      );
      if (repetidoMov[0]) {
        const fechaStr = new Date(repetidoMov[0].fecha).toLocaleDateString("es-GT");
        throw conflict(
          `El número de recibo "${doc}" ya fue registrado el ${fechaStr} en la cuenta ${repetidoMov[0].numero_cuenta} (${repetidoMov[0].socio_nombres}). No se permiten recibos duplicados.`,
        );
      }
    }

    // 1. Contador correlativo para categoría prestamo
    const categoriaPrestamo =
      prestamo.tipo === "HIPOTECARIO" ? "ABONO_PRESTAMO_HIPOTECARIO" : "ABONO_PRESTAMO_FIDUCIARIO";
    const info = CATEGORIAS[categoriaPrestamo];
    const { rows: contadorRows } = await client.query(
      `select count(*)::int as total from caja_movimientos_auxiliar
       where agencia_id = $1 and categoria::text = any($2::text[])`,
      [dia.agencia_id, categoriasDelGrupo(info.grupoContador)],
    );
    const contador = contadorRows[0].total + 1;

    // 2. Saldo previo y acumulado en caja
    const { rows: ultimoMovRows } = await client.query(
      `select saldo_acumulado from caja_movimientos_auxiliar where caja_dia_id = $1 order by created_at desc limit 1`,
      [diaId],
    );
    const saldoPrevio = ultimoMovRows[0] ? Number(ultimoMovRows[0].saldo_acumulado) : Number(dia.saldo_inicial);
    const saldoAcumulado = saldoPrevio + totalCobro;

    // Débito a cuenta de ahorro si se indicó
    let infoCuentaDebito: { id: string; numero_cuenta: string } | null = null;
    if (data.cuentaDebitoId) {
      const { rows: ctaRows } = await client.query(
        `select c.id, c.numero_cuenta, coalesce(sc.saldo_actual, c.saldo_inicial) as saldo_actual
         from cuentas c
         left join saldos_cuenta sc on sc.cuenta_id = c.id
         where c.id = $1 and c.socio_id = $2`,
        [data.cuentaDebitoId, prestamo.socio_id],
      );
      const cta = ctaRows[0];
      if (!cta) throw badRequest("La cuenta seleccionada para débito no pertenece al socio del crédito");
      if (Number(cta.saldo_actual) < totalCobro) {
        throw conflict(
          `Saldo insuficiente en la cuenta ${cta.numero_cuenta}: tiene Q ${Number(cta.saldo_actual).toFixed(2)} y el cobro es de Q ${totalCobro.toFixed(2)}`,
        );
      }
      infoCuentaDebito = cta;

      const clienteMovId = `DEB-CUOTA-${prestamo.id}-${Date.now()}`;
      await client.query(
        `insert into movimientos (cuenta_id, tipo, monto, fecha, numero_recibo, descripcion, usuario_id, cliente_movimiento_id)
         values ($1, 'RETIRO', $2, $3, $4, $5, $6, $7)`,
        [
          cta.id,
          totalCobro,
          dia.fecha,
          data.docNo ?? null,
          `Débito para pago de cuota crédito ${prestamo.codigo}`,
          usuarioId,
          clienteMovId,
        ],
      );
    }

    // 3. Si se incluye Ahorro sobre Préstamo, acreditar depósito a la cuenta ASP del socio
    let cuentaAspInfo: { id: string; numero_cuenta: string } | null = null;
    if (ahorroSobrePrestamo > 0) {
      const { rows: ctaAspRows } = await client.query(
        `select id, numero_cuenta from cuentas
         where socio_id = $1 and tipo = 'AHORRO_SOBRE_PRESTAMO'
         order by (case when prestamo_id = $2 then 0 else 1 end), created_at desc
         limit 1`,
        [prestamo.socio_id, prestamo.id],
      );

      let ctaAsp = ctaAspRows[0];
      if (!ctaAsp) {
        const { numeroCuenta } = await cuentasService.siguienteNumero(dia.agencia_id, "AHORRO_SOBRE_PRESTAMO");
        const { rows: nuevaCta } = await client.query(
          `insert into cuentas (numero_cuenta, tipo, socio_id, agencia_id, saldo_inicial, observaciones_apertura, prestamo_id, creado_por_id)
           values ($1, 'AHORRO_SOBRE_PRESTAMO', $2, $3, 0, $4, $5, $6)
           returning id, numero_cuenta`,
          [
            numeroCuenta,
            prestamo.socio_id,
            dia.agencia_id,
            `Cuenta de ahorro en garantía vinculada al crédito ${prestamo.codigo}`,
            prestamo.id,
            usuarioId,
          ],
        );
        ctaAsp = nuevaCta[0];
      }
      cuentaAspInfo = ctaAsp;

      const clienteMovAspId = `DEP-ASP-CUOTA-${prestamo.id}-${Date.now()}`;
      await client.query(
        `insert into movimientos (cuenta_id, tipo, monto, fecha, numero_recibo, descripcion, usuario_id, cliente_movimiento_id)
         values ($1, 'DEPOSITO', $2, $3, $4, $5, $6, $7)`,
        [
          ctaAsp.id,
          ahorroSobrePrestamo,
          dia.fecha,
          data.docNo ?? null,
          `Aporte Ahorro sobre Préstamo cuota crédito ${prestamo.codigo}`,
          usuarioId,
          clienteMovAspId,
        ],
      );
    }

    // 4. Registrar en caja_movimientos_auxiliar
    const origenFondosFinal = data.origenFondos || prestamo.origen_fondos || "FONDOS_PROPIOS";
    const ref = `${prestamo.codigo}-CUOTA`;
    const detalleDebito = infoCuentaDebito ? ` (Cobrado con débito de cuenta ${infoCuentaDebito.numero_cuenta})` : "";
    const detalleAsp = ahorroSobrePrestamo > 0 ? `, Ahorro: Q${ahorroSobrePrestamo.toFixed(2)}` : "";
    const descripcion = `Cobro cuota crédito ${prestamo.codigo} (Cap: Q${abonoCapital.toFixed(2)}, Int: Q${interes.toFixed(2)}${detalleAsp}${mora > 0 ? `, Mora: Q${mora.toFixed(2)}` : ""})${detalleDebito}`;

    const { rows: cajaMovRows } = await client.query(
      `insert into caja_movimientos_auxiliar (
         caja_dia_id, agencia_id, fecha, seccion, categoria, tipo, contador,
         referencia, socio_id, beneficiario, descripcion, doc_no, monto, saldo_acumulado, origen_fondos, usuario_id
       ) values ($1, $2, $3, 'PROPIO', $4, 'INGRESO', $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
       returning *`,
      [
        diaId,
        dia.agencia_id,
        dia.fecha,
        categoriaPrestamo,
        contador,
        ref,
        prestamo.socio_id,
        prestamo.socio_nombres,
        descripcion,
        data.docNo ?? null,
        totalCobro,
        saldoAcumulado,
        origenFondosFinal,
        usuarioId,
      ],
    );
    const cajaMov = cajaMovRows[0];

    // 5. Registrar en ingresos_comif
    if (abonoCapital > 0) {
      await client.query(
        `insert into ingresos_comif (agencia_id, fecha, numero_documento, nombre_socio, categoria, monto, origen_fondos, usuario_id)
         values ($1, $2, $3, $4, 'ABONO_PRESTAMO', $5, $6, $7)`,
        [dia.agencia_id, dia.fecha, data.docNo ?? null, prestamo.socio_nombres, abonoCapital, origenFondosFinal, usuarioId],
      );
    }
    if (interes + mora > 0) {
      await client.query(
        `insert into ingresos_comif (agencia_id, fecha, numero_documento, nombre_socio, categoria, monto, origen_fondos, usuario_id)
         values ($1, $2, $3, $4, 'INTERES_PRESTAMO', $5, $6, $7)`,
        [dia.agencia_id, dia.fecha, data.docNo ?? null, prestamo.socio_nombres, interes + mora, origenFondosFinal, usuarioId],
      );
    }

    // 6. Actualizar préstamo (reducir saldo_capital y si llega a 0 cambiar a CANCELADO)
    await client.query(
      `update prestamos
       set saldo_capital = $1,
           estado = $2,
           updated_at = now()
       where id = $3`,
      [nuevoSaldoCapital, nuevoEstadoPrestamo, prestamo.id],
    );

    // 7. Registrar en prestamo_pagos
    const { rows: pagoRows } = await client.query(
      `insert into prestamo_pagos (
         prestamo_id, socio_id, agencia_id, caja_dia_id, caja_movimiento_id,
         fecha, numero_recibo, abono_capital, interes, mora, total_pagado,
         saldo_capital_restante, origen_fondos, usuario_id
       ) values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
       returning *`,
      [
        prestamo.id,
        prestamo.socio_id,
        dia.agencia_id,
        diaId,
        cajaMov.id,
        dia.fecha,
        data.docNo ?? null,
        abonoCapital,
        interes,
        mora,
        totalCobro,
        nuevoSaldoCapital,
        origenFondosFinal,
        usuarioId,
      ],
    );

    await registrarAuditoria({
      entidad: "PrestamoPago",
      entidadId: pagoRows[0].id,
      accion: "CREAR",
      usuarioId,
      datosNuevos: {
        prestamoId: prestamo.id,
        codigo: prestamo.codigo,
        pago: pagoRows[0],
        ahorroSobrePrestamo,
        cuentaAsp: cuentaAspInfo,
        nuevoSaldoCapital,
      },
    });

    return {
      pago: pagoRows[0],
      cajaMovimiento: cajaMov,
      saldoCapitalRestante: nuevoSaldoCapital,
      ahorroSobrePrestamoAcreditado: ahorroSobrePrestamo,
      cuentaAsp: cuentaAspInfo,
      prestamoCancelado: nuevoEstadoPrestamo === "CANCELADO",
    };
  });
}

export interface DatosDesembolsoCredito {
  prestamoId: string;
  docNo?: string;
  origenFondos?: "FONDOS_PROPIOS" | "FEDERURAL" | "CHN_GUATEMALA";
  montoAhorroSobrePrestamo?: number;
}

export async function desembolsarCredito(
  diaId: string,
  data: DatosDesembolsoCredito,
  usuarioId: string,
  agenciaVisible: string | null,
) {
  return withTransaction(async (client) => {
    const { rows: diaRows } = await client.query(`select * from caja_dias where id = $1`, [diaId]);
    const dia = diaRows[0];
    if (!dia) throw notFound("Día de caja no encontrado");
    checarAgencia(dia.agencia_id, agenciaVisible);
    if (dia.estado !== "ABIERTO") {
      throw conflict("La caja de este día ya está cerrada; no se pueden realizar desembolsos.");
    }

    const { rows: prestamoRows } = await client.query(
      `select p.*, s.nombres as socio_nombres, s.numero_asociado
       from prestamos p
       join socios s on s.id = p.socio_id
       where p.id = $1`,
      [data.prestamoId],
    );
    const prestamo = prestamoRows[0];
    if (!prestamo) throw notFound("Préstamo no encontrado");
    if (agenciaVisible && prestamo.agencia_id !== agenciaVisible) {
      throw forbidden("Ese préstamo pertenece a otra agencia");
    }

    // Regla de Oro: Préstamos migrados no se desembolsan en efectivo de caja
    if (prestamo.es_migracion) {
      throw badRequest(
        `El crédito ${prestamo.codigo} es una migración histórica preexistente (ya desembolsado con anterioridad). No requiere ni permite desembolso físico en la caja de ventanilla.`,
      );
    }

    if (prestamo.estado !== "APROBADO") {
      throw badRequest(
        `El préstamo debe estar en estado APROBADO para ser desembolsado en caja (estado actual: ${prestamo.estado})`,
      );
    }

    const montoDesembolso = Number(prestamo.monto_aprobado || prestamo.monto_solicitado);
    if (montoDesembolso <= 0) {
      throw badRequest("El monto aprobado debe ser mayor a cero");
    }

    const montoAsp = Math.max(0, Math.min(montoDesembolso, Math.round((Number(data.montoAhorroSobrePrestamo) || 0) * 100) / 100));
    const efectivoNetoRequerido = Math.round((montoDesembolso - montoAsp) * 100) / 100;

    // Validar si hay saldo suficiente en la caja física para el efectivo neto a entregar
    const { rows: ultimoMovRows } = await client.query(
      `select saldo_acumulado from caja_movimientos_auxiliar where caja_dia_id = $1 order by created_at desc limit 1`,
      [diaId],
    );
    const saldoPrevio = ultimoMovRows[0] ? Number(ultimoMovRows[0].saldo_acumulado) : Number(dia.saldo_inicial);

    if (efectivoNetoRequerido > saldoPrevio) {
      throw conflict(
        `Saldo insuficiente en la caja física: Se requieren Q ${efectivoNetoRequerido.toFixed(2)} en efectivo pero el saldo actual en caja es de Q ${saldoPrevio.toFixed(2)}. Ingrese fondos o reduzca la entrega.`,
      );
    }

    // Validación de docNo anti-duplicados
    if (data.docNo && data.docNo.trim()) {
      const doc = data.docNo.trim();
      const { rows: repetidoAux } = await client.query(
        `select fecha, doc_no, beneficiario, descripcion
         from caja_movimientos_auxiliar
         where agencia_id = $1 and lower(trim(doc_no)) = lower($2)
         limit 1`,
        [dia.agencia_id, doc],
      );
      if (repetidoAux[0]) {
        const fechaStr = new Date(repetidoAux[0].fecha).toLocaleDateString("es-GT");
        throw conflict(
          `El número de comprobante/recibo "${doc}" ya fue registrado el ${fechaStr} en Auxiliar de Caja (${repetidoAux[0].descripcion} - ${repetidoAux[0].beneficiario}). No se permiten documentos duplicados.`,
        );
      }
    }

    // 1. Contador de colocación
    const info = CATEGORIAS.COLOCACION_PRESTAMO;
    const { rows: contadorRows } = await client.query(
      `select count(*)::int as total from caja_movimientos_auxiliar
       where agencia_id = $1 and categoria::text = any($2::text[])`,
      [dia.agencia_id, categoriasDelGrupo(info.grupoContador)],
    );
    const contador = contadorRows[0].total + 1;
    let saldoAcumulado = Math.round((saldoPrevio - montoDesembolso) * 100) / 100;

    // 2. Registrar egreso en caja_movimientos_auxiliar (Colocación Préstamo)
    const origenFondosFinal = data.origenFondos || prestamo.origen_fondos || "FONDOS_PROPIOS";
    const detalleAspDesc = montoAsp > 0 ? ` (Retención Ahorro: Q${montoAsp.toFixed(2)}, Neto entregado: Q${efectivoNetoRequerido.toFixed(2)})` : "";
    const descripcion = `Desembolso de crédito ${prestamo.codigo} (${prestamo.tipo})${detalleAspDesc}`;
    const { rows: cajaMovRows } = await client.query(
      `insert into caja_movimientos_auxiliar (
         caja_dia_id, agencia_id, fecha, seccion, categoria, tipo, contador,
         referencia, socio_id, beneficiario, descripcion, doc_no, monto, saldo_acumulado, origen_fondos, usuario_id
       ) values ($1, $2, $3, 'PROPIO', 'COLOCACION_PRESTAMO', 'EGRESO', $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       returning *`,
      [
        diaId,
        dia.agencia_id,
        dia.fecha,
        contador,
        prestamo.codigo,
        prestamo.socio_id,
        prestamo.socio_nombres,
        descripcion,
        data.docNo ?? null,
        montoDesembolso,
        saldoAcumulado,
        origenFondosFinal,
        usuarioId,
      ],
    );
    const cajaMov = cajaMovRows[0];

    // 3. Si se especificó retención de Ahorro sobre Préstamo, acreditar a la cuenta y registrar ingreso
    let cuentaAspInfo: { id: string; numero_cuenta: string } | null = null;
    if (montoAsp > 0) {
      const { rows: ctaAspRows } = await client.query(
        `select id, numero_cuenta from cuentas
         where socio_id = $1 and tipo = 'AHORRO_SOBRE_PRESTAMO'
         order by (case when prestamo_id = $2 then 0 else 1 end), created_at desc
         limit 1`,
        [prestamo.socio_id, prestamo.id],
      );

      let cta = ctaAspRows[0];
      if (!cta) {
        const { numeroCuenta } = await cuentasService.siguienteNumero(dia.agencia_id, "AHORRO_SOBRE_PRESTAMO");
        const { rows: nuevaCta } = await client.query(
          `insert into cuentas (numero_cuenta, tipo, socio_id, agencia_id, saldo_inicial, observaciones_apertura, prestamo_id, creado_por_id)
           values ($1, 'AHORRO_SOBRE_PRESTAMO', $2, $3, 0, $4, $5, $6)
           returning id, numero_cuenta`,
          [
            numeroCuenta,
            prestamo.socio_id,
            dia.agencia_id,
            `Cuenta de ahorro en garantía vinculada al crédito ${prestamo.codigo}`,
            prestamo.id,
            usuarioId,
          ],
        );
        cta = nuevaCta[0];
      }
      cuentaAspInfo = cta;

      const clienteMovId = `DEP-ASP-${prestamo.id}-${Date.now()}`;
      await client.query(
        `insert into movimientos (cuenta_id, tipo, monto, fecha, numero_recibo, descripcion, usuario_id, cliente_movimiento_id)
         values ($1, 'DEPOSITO', $2, $3, $4, $5, $6, $7)`,
        [
          cta.id,
          montoAsp,
          dia.fecha,
          data.docNo ?? null,
          `Acreditación de retención Ahorro sobre Préstamo (Garantía) - Crédito ${prestamo.codigo}`,
          usuarioId,
          clienteMovId,
        ],
      );

      const infoAsp = CATEGORIAS.DEPOSITO_AHORRO_SOBRE_PRESTAMO;
      const { rows: contadorAspRows } = await client.query(
        `select count(*)::int as total from caja_movimientos_auxiliar
         where agencia_id = $1 and categoria::text = any($2::text[])`,
        [dia.agencia_id, categoriasDelGrupo(infoAsp.grupoContador)],
      );
      const contadorAsp = contadorAspRows[0].total + 1;
      saldoAcumulado = Math.round((saldoAcumulado + montoAsp) * 100) / 100;

      await client.query(
        `insert into caja_movimientos_auxiliar (
           caja_dia_id, agencia_id, fecha, seccion, categoria, tipo, contador,
           referencia, socio_id, beneficiario, descripcion, doc_no, monto, saldo_acumulado, usuario_id
         ) values ($1, $2, $3, 'PROPIO', 'DEPOSITO_AHORRO_SOBRE_PRESTAMO', 'INGRESO', $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
        [
          diaId,
          dia.agencia_id,
          dia.fecha,
          contadorAsp,
          `${cta.numero_cuenta}-IN`,
          prestamo.socio_id,
          prestamo.socio_nombres,
          `Retención Ahorro sobre Préstamo crédito ${prestamo.codigo} (Cuenta ${cta.numero_cuenta})`,
          data.docNo ?? null,
          montoAsp,
          saldoAcumulado,
          usuarioId,
        ],
      );
    }

    // 4. Actualizar estado del préstamo a DESEMBOLSADO
    const { rows: prestamoActualizadoRows } = await client.query(
      `update prestamos
       set estado = 'DESEMBOLSADO',
           origen_fondos = $1,
           fecha_desembolso = $2,
           saldo_capital = $3,
           updated_at = now()
       where id = $4
       returning *`,
      [origenFondosFinal, dia.fecha, montoDesembolso, prestamo.id],
    );

    await registrarAuditoria({
      entidad: "Prestamo",
      entidadId: prestamo.id,
      accion: "ACTUALIZAR",
      usuarioId,
      datosNuevos: {
        estado: "DESEMBOLSADO",
        desembolsoCajaMovimientoId: cajaMov.id,
        monto: montoDesembolso,
        montoAhorroSobrePrestamo: montoAsp,
        cuentaAsp: cuentaAspInfo,
      },
    });

    return {
      prestamo: prestamoActualizadoRows[0],
      cajaMovimiento: cajaMov,
      efectivoNetoEntregado: efectivoNetoRequerido,
      ahorroSobrePrestamoRetenido: montoAsp,
      cuentaAsp: cuentaAspInfo,
    };
  });
}

export interface DatosLiquidarPlazoFijoVentanilla {
  contratoId: string;
  reciboRetiro: string; // RE. No.
  incluirIntereses?: boolean;
}

export async function liquidarPlazoFijo(
  diaId: string,
  data: DatosLiquidarPlazoFijoVentanilla,
  usuarioId: string,
  agenciaVisible: string | null,
) {
  return withTransaction(async (client) => {
    const { rows: diaRows } = await client.query(`select * from caja_dias where id = $1`, [diaId]);
    const dia = diaRows[0];
    if (!dia) throw notFound("Día de caja no encontrado");
    checarAgencia(dia.agencia_id, agenciaVisible);
    if (dia.estado !== "ABIERTO") {
      throw conflict("La caja de este día ya está cerrada. No se pueden registrar liquidaciones.");
    }

    if (!data.reciboRetiro || !data.reciboRetiro.trim()) {
      throw badRequest("El número de recibo de egreso (RE. No.) es obligatorio para liquidar el plazo fijo.");
    }
    const recibo = data.reciboRetiro.trim();

    // Obtener contrato
    const { rows: contratoRows } = await client.query(
      `select pf.*, c.numero_cuenta, c.agencia_id, s.nombres as socio_nombres, s.id as socio_id, s.numero_asociado
       from plazo_fijo_contratos pf
       join cuentas c on c.id = pf.cuenta_id
       join socios s on s.id = c.socio_id
       where pf.id = $1`,
      [data.contratoId],
    );
    const contrato = contratoRows[0];
    if (!contrato) throw notFound("Contrato de plazo fijo no encontrado");
    if (contrato.agencia_id !== dia.agencia_id) {
      throw forbidden("Ese contrato pertenece a otra agencia");
    }
    if (contrato.estado === "LIQUIDADO") {
      throw conflict(`El certificado No. ${contrato.numero_certificacion} ya fue liquidado anteriormente.`);
    }

    const montoALiquidar = data.incluirIntereses
      ? Number(contrato.saldo_liquido_a_pagar)
      : Number(contrato.monto_deposito);

    // Validar saldo suficiente en caja
    const { rows: ultimoMovRows } = await client.query(
      `select saldo_acumulado from caja_movimientos_auxiliar where caja_dia_id = $1 order by created_at desc limit 1`,
      [diaId],
    );
    const saldoPrevio = ultimoMovRows[0] ? Number(ultimoMovRows[0].saldo_acumulado) : Number(dia.saldo_inicial);
    if (montoALiquidar > saldoPrevio) {
      throw conflict(
        `Saldo insuficiente en la caja física: Se requieren Q ${montoALiquidar.toFixed(2)} para liquidar el certificado pero la caja solo tiene Q ${saldoPrevio.toFixed(2)}. Ingrese fondos antes de pagar.`,
      );
    }

    // Validación anti-duplicados del recibo de retiro
    const { rows: repetidoAux } = await client.query(
      `select fecha, doc_no, beneficiario, descripcion
       from caja_movimientos_auxiliar
       where agencia_id = $1 and lower(trim(doc_no)) = lower($2)
       limit 1`,
      [dia.agencia_id, recibo],
    );
    if (repetidoAux[0]) {
      const fechaStr = new Date(repetidoAux[0].fecha).toLocaleDateString("es-GT");
      throw conflict(
        `El número de recibo de retiro "${recibo}" ya fue registrado el ${fechaStr} en Auxiliar de Caja (${repetidoAux[0].descripcion} - ${repetidoAux[0].beneficiario}). No se permiten recibos duplicados.`,
      );
    }

    const { rows: repetidoPF } = await client.query(
      `select fecha_retiro, recibo_retiro, numero_certificacion
       from plazo_fijo_contratos
       where lower(trim(recibo_retiro)) = lower($1)
       limit 1`,
      [recibo],
    );
    if (repetidoPF[0]) {
      const fechaStr = repetidoPF[0].fecha_retiro ? new Date(repetidoPF[0].fecha_retiro).toLocaleDateString("es-GT") : "";
      throw conflict(
        `El número de recibo "${recibo}" ya fue utilizado en la liquidación del certificado No. ${repetidoPF[0].numero_certificacion} el ${fechaStr}.`,
      );
    }

    const info = CATEGORIAS.RETIRO_PLAZO_FIJO;
    const { rows: contadorRows } = await client.query(
      `select count(*)::int as total from caja_movimientos_auxiliar
       where agencia_id = $1 and categoria::text = any($2::text[])`,
      [dia.agencia_id, categoriasDelGrupo(info.grupoContador)],
    );
    const contador = contadorRows[0].total + 1;
    const saldoAcumulado = Math.round((saldoPrevio - montoALiquidar) * 100) / 100;

    // 1. Insertar egreso en caja_movimientos_auxiliar
    const { rows: cajaMovRows } = await client.query(
      `insert into caja_movimientos_auxiliar (
         caja_dia_id, agencia_id, fecha, seccion, categoria, tipo, contador,
         referencia, socio_id, cuenta_id, beneficiario, descripcion, doc_no,
         monto, saldo_acumulado, usuario_id
       ) values ($1, $2, $3, 'PROPIO', 'RETIRO_PLAZO_FIJO', 'EGRESO', $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       returning *`,
      [
        diaId,
        dia.agencia_id,
        dia.fecha,
        contador,
        contrato.numero_certificacion,
        contrato.socio_id,
        contrato.cuenta_id,
        contrato.socio_nombres,
        `Liquidación Plazo Fijo Certificado No. ${contrato.numero_certificacion}${data.incluirIntereses ? " (Cap + Int)" : " (Capital)"}`,
        recibo,
        montoALiquidar,
        saldoAcumulado,
        usuarioId,
      ],
    );
    const cajaMov = cajaMovRows[0];

    // 2. Actualizar contrato a LIQUIDADO
    const { rows: pfActualizadoRows } = await client.query(
      `update plazo_fijo_contratos
       set estado = 'LIQUIDADO',
           fecha_retiro = $1,
           recibo_retiro = $2,
           monto_liquidado = $3,
           updated_at = now()
       where id = $4
       returning *`,
      [dia.fecha, recibo, montoALiquidar, contrato.id],
    );

    // 3. Registrar retiro en la cuenta
    const clienteMovId = `LIQ-PF-${contrato.id}-${Date.now()}`;
    await client.query(
      `insert into movimientos (cuenta_id, tipo, monto, fecha, descripcion, numero_recibo, usuario_id, cliente_movimiento_id)
       values ($1, 'RETIRO', $2, $3, $4, $5, $6, $7)`,
      [
        contrato.cuenta_id,
        montoALiquidar,
        dia.fecha,
        `Liquidación Certificado No. ${contrato.numero_certificacion}`,
        recibo,
        usuarioId,
        clienteMovId,
      ],
    );

    await registrarAuditoria({
      entidad: "PlazoFijoContrato",
      entidadId: contrato.id,
      accion: "ACTUALIZAR",
      usuarioId,
      datosNuevos: {
        estado: "LIQUIDADO",
        montoLiquidado: montoALiquidar,
        reciboRetiro: recibo,
        cajaMovimientoId: cajaMov.id,
      },
    });

    return {
      contrato: pfActualizadoRows[0],
      cajaMovimiento: cajaMov,
      montoLiquidado: montoALiquidar,
    };
  });
}

export async function analiticaServicios(
  agenciaId: string | null | undefined,
  agenciaVisible: string | null,
  periodo: "semana" | "mes" | "anio" = "mes",
) {
  let filtroAgenciaAux = "";
  let filtroAgenciaCuentas = "";
  let filtroAgenciaPrestamos = "";
  let filtroAgenciaCajaChica = "";
  const params: unknown[] = [];

  const targetAgencia = agenciaVisible || (agenciaId && agenciaId !== "TODAS" ? agenciaId : null);
  if (targetAgencia) {
    params.push(targetAgencia);
    filtroAgenciaAux = `and d.agencia_id = $${params.length}`;
    filtroAgenciaCuentas = `and c.agencia_id = $${params.length}`;
    filtroAgenciaPrestamos = `and p.agencia_id = $${params.length}`;
    filtroAgenciaCajaChica = `and cc.agencia_id = $${params.length}`;
  }

  let fechaInicioSql = "current_date - interval '30 days'";
  if (periodo === "semana") {
    fechaInicioSql = "current_date - interval '7 days'";
  } else if (periodo === "anio") {
    fechaInicioSql = "date_trunc('year', current_date)";
  }

  const query = `
    with ops as (
      -- 1. Movimientos de Ventanilla en Auxiliar de Caja
      select m.categoria::text, count(*)::int as cant, sum(m.monto)::numeric(14,2) as monto
      from caja_movimientos_auxiliar m
      join caja_dias d on d.id = m.caja_dia_id
      where d.fecha >= ${fechaInicioSql} and d.fecha <= current_date + interval '1 day' ${filtroAgenciaAux}
      group by m.categoria

      union all

      -- 2. Movimientos de Ahorros, Plazos Fijos y Aportaciones
      select 
        case 
          when c.tipo = 'APORTACION' then 'APORTACION'
          when c.tipo = 'AHORRO_CORRIENTE' and m.tipo = 'DEPOSITO' then 'DEPOSITO_AHORRO_CORRIENTE'
          when c.tipo = 'AHORRO_CORRIENTE' and m.tipo = 'RETIRO' then 'RETIRO_AHORRO_CORRIENTE'
          when c.tipo = 'AHORRO_PROGRAMADO' then 'DEPOSITO_AHORRO_PROGRAMADO'
          when c.tipo = 'AHORRO_INFANTO_JUVENIL' then 'DEPOSITO_AHORRO_INFANTO_JUVENIL'
          when c.tipo = 'AHORRO_SOBRE_PRESTAMO' and m.tipo = 'DEPOSITO' then 'DEPOSITO_AHORRO_SOBRE_PRESTAMO'
          when c.tipo = 'AHORRO_SOBRE_PRESTAMO' and m.tipo = 'RETIRO' then 'RETIRO_AHORRO_SOBRE_PRESTAMO'
          when c.tipo = 'AHORRO_PLAZO_FIJO' and m.tipo = 'DEPOSITO' then 'DEPOSITO_PLAZO_FIJO'
          when c.tipo = 'AHORRO_PLAZO_FIJO' and m.tipo = 'RETIRO' then 'RETIRO_PLAZO_FIJO'
          else 'INGRESO_VARIO'
        end as categoria,
        count(*)::int as cant,
        sum(m.monto)::numeric(14,2) as monto
      from movimientos m
      join cuentas c on c.id = m.cuenta_id
      where m.fecha >= ${fechaInicioSql} and m.fecha <= current_date + interval '1 day' ${filtroAgenciaCuentas}
      group by 1

      union all

      -- 3. Préstamos Colocados
      select 
        case 
          when p.tipo = 'HIPOTECARIO' then 'COLOCACION_PRESTAMO'
          else 'COLOCACION_PRESTAMO'
        end as categoria,
        count(*)::int as cant,
        sum(p.monto_aprobado)::numeric(14,2) as monto
      from prestamos p
      where coalesce(p.fecha_aprobacion, p.created_at::date) >= ${fechaInicioSql}
        and coalesce(p.fecha_aprobacion, p.created_at::date) <= current_date + interval '1 day'
        ${filtroAgenciaPrestamos}
      group by 1

      union all

      -- 4. Gastos y Comprobantes de Caja Chica
      select
        coalesce('CAJA_CHICA_' || cc.categoria::text, 'CAJA_CHICA_GASTO') as categoria,
        count(*)::int as cant,
        sum(cc.monto)::numeric(14,2) as monto
      from caja_chica_comprobantes cc
      where cc.fecha >= ${fechaInicioSql}
        and cc.fecha <= current_date + interval '1 day'
        ${filtroAgenciaCajaChica}
      group by 1
    )
    select categoria, sum(cant)::int as cantidad, sum(monto)::numeric(14,2) as total_monto
    from ops
    group by categoria
    order by cantidad desc;
  `;

  const { rows } = await pool.query(query, params);

  const GRUPOS: Record<string, { label: string; icon: string }> = {
    SERVICIOS_BI: { label: "Pago de Servicios (Agente BI)", icon: "🏦" },
    DEPOSITO_BI: { label: "Depósitos Agente BI", icon: "📥" },
    RETIRO_BI: { label: "Retiros Agente BI", icon: "📤" },
    REMESA_BI: { label: "Cobro de Remesas BI", icon: "💵" },
    ABONO_PRESTAMO_HIPOTECARIO: { label: "Abono Préstamo Hipotecario", icon: "🏠" },
    INTERES_PRESTAMO_HIPOTECARIO: { label: "Interés Préstamo Hipotecario", icon: "📊" },
    MORA_PRESTAMO_HIPOTECARIO: { label: "Mora Préstamo Hipotecario", icon: "⚠️" },
    ABONO_PRESTAMO_FIDUCIARIO: { label: "Abono Préstamo Fiduciario", icon: "🤝" },
    INTERES_PRESTAMO_FIDUCIARIO: { label: "Interés Préstamo Fiduciario", icon: "📈" },
    MORA_PRESTAMO_FIDUCIARIO: { label: "Mora Préstamo Fiduciario", icon: "⚠️" },
    COLOCACION_PRESTAMO: { label: "Desembolso de Préstamos", icon: "💼" },
    DEPOSITO_AHORRO_CORRIENTE: { label: "Depósito Ahorro Corriente", icon: "💰" },
    RETIRO_AHORRO_CORRIENTE: { label: "Retiro Ahorro Corriente", icon: "💸" },
    DEPOSITO_AHORRO_PROGRAMADO: { label: "Depósito Ahorro Programado", icon: "📅" },
    RETIRO_AHORRO_PROGRAMADO: { label: "Retiro Ahorro Programado", icon: "📅" },
    DEPOSITO_AHORRO_INFANTO_JUVENIL: { label: "Depósito Ahorro Infantil", icon: "🧒" },
    RETIRO_AHORRO_INFANTO_JUVENIL: { label: "Retiro Ahorro Infantil", icon: "🧒" },
    DEPOSITO_AHORRO_SOBRE_PRESTAMO: { label: "Depósito Ahorro sobre Préstamo", icon: "🛡️" },
    RETIRO_AHORRO_SOBRE_PRESTAMO: { label: "Retiro Ahorro sobre Préstamo", icon: "🛡️" },
    DEPOSITO_PLAZO_FIJO: { label: "Apertura Plazo Fijo", icon: "🔒" },
    RETIRO_PLAZO_FIJO: { label: "Liquidación Plazo Fijo", icon: "📦" },
    APORTACION: { label: "Aportaciones de Capital", icon: "🏛️" },
    INGRESO_ASOCIADO: { label: "Cuotas de Ingreso Asociado", icon: "📝" },
    COMISION: { label: "Comisiones por Servicios", icon: "🏷️" },
    INGRESO_VARIO: { label: "Ingresos Varios", icon: "➕" },
    EGRESO_VARIO: { label: "Egresos Varios", icon: "➖" },
    CAJA_CHICA_SUMINISTROS_OFICINA: { label: "Papelería y Suministros (C.Chica)", icon: "📎" },
    CAJA_CHICA_CAFETERIA_LIMPIEZA: { label: "Cafetería y Limpieza (C.Chica)", icon: "☕" },
    CAJA_CHICA_COMBUSTIBLES_LUBRICANTES: { label: "Combustibles (C.Chica)", icon: "⛽" },
    CAJA_CHICA_COMISIONES_GASTOS: { label: "Comisiones y Gastos (C.Chica)", icon: "🧾" },
    CAJA_CHICA_TELEFONO: { label: "Telefonía (C.Chica)", icon: "📞" },
    CAJA_CHICA_INTERNET: { label: "Internet (C.Chica)", icon: "🌐" },
    CAJA_CHICA_ENERGIA_ELECTRICA: { label: "Energía Eléctrica (C.Chica)", icon: "⚡" },
    CAJA_CHICA_GASTOS_DIVERSOS: { label: "Gastos Diversos (C.Chica)", icon: "📦" },
    CAJA_CHICA_REPARACION_MANTENIMIENTO: { label: "Mantenimiento (C.Chica)", icon: "🔧" },
    CAJA_CHICA_FLETES_ACARREO: { label: "Fletes y Acarreo (C.Chica)", icon: "🚚" },
    CAJA_CHICA_PROYECCION_SOCIAL: { label: "Proyección Social (C.Chica)", icon: "🤝" },
    CAJA_CHICA_OTRO: { label: "Otros Gastos C.Chica", icon: "📋" },
    CAJA_CHICA_GASTO: { label: "Gastos Operativos (C.Chica)", icon: "☕" },
  };

  function determinarModulo(cat: string): "AHORROS" | "CREDITOS" | "CAJA_CHICA" | "VENTANILLA" {
    if (cat.startsWith("CAJA_CHICA")) return "CAJA_CHICA";
    if (cat.includes("PRESTAMO")) return "CREDITOS";
    if (cat.includes("AHORRO") || cat.includes("PLAZO_FIJO") || cat === "APORTACION") return "AHORROS";
    return "VENTANILLA";
  }

  const totalOperaciones = rows.reduce((acc, r) => acc + Number(r.cantidad), 0);
  const volumenTotal = rows.reduce((acc, r) => acc + Number(r.total_monto), 0);

  const servicios = rows.map((r) => {
    const info = GRUPOS[r.categoria] ?? { label: r.categoria, icon: "📌" };
    const cant = Number(r.cantidad);
    const monto = Number(r.total_monto);
    const pct = totalOperaciones > 0 ? Math.round((cant / totalOperaciones) * 1000) / 10 : 0;
    return {
      categoria: r.categoria,
      modulo: determinarModulo(r.categoria),
      label: info.label,
      icon: info.icon,
      cantidad: cant,
      totalMonto: monto,
      porcentaje: pct,
    };
  });

  return {
    periodo,
    totalOperaciones,
    volumenTotal,
    servicioTop: servicios[0] ?? null,
    servicios,
  };
}

export async function arqueosMensuales(
  agenciaId: string | null | undefined,
  agenciaVisible: string | null,
  mes?: string,
) {
  let targetAgencia = agenciaVisible || agenciaId;
  if (!targetAgencia) {
    const { rows: ags } = await pool.query("select id from agencias limit 1");
    targetAgencia = ags[0]?.id;
  }
  if (!targetAgencia) throw badRequest("No hay agencias configuradas");
  checarAgencia(targetAgencia, agenciaVisible);

  const mesParam = mes && /^\d{4}-\d{2}$/.test(mes) ? mes : hoyISO().slice(0, 7);

  const { rows } = await pool.query(
    `select d.*,
       u_abrio.nombre as abierto_por_nombre,
       u_cerro.nombre as cerrado_por_nombre,
       (select count(*) from caja_movimientos_auxiliar m where m.caja_dia_id = d.id)::int as total_movimientos,
       coalesce((select sum(monto) from caja_movimientos_auxiliar m where m.caja_dia_id = d.id and m.tipo = 'INGRESO'), 0)::numeric(14,2) as total_ingresos,
       coalesce((select sum(monto) from caja_movimientos_auxiliar m where m.caja_dia_id = d.id and m.tipo = 'EGRESO'), 0)::numeric(14,2) as total_egresos,
       a.total_contado,
       a.diferencia,
       a.detalle as arqueo_detalle
     from caja_dias d
     left join usuarios u_abrio on u_abrio.id = d.abierto_por
     left join usuarios u_cerro on u_cerro.id = d.cerrado_por
     left join caja_arqueos a on a.caja_dia_id = d.id
     where d.agencia_id = $1 and to_char(d.fecha, 'YYYY-MM') = $2
     order by d.fecha asc`,
    [targetAgencia, mesParam],
  );

  let totalDiasOperados = rows.length;
  let diasCuadrados = 0;
  let diasConDiferencia = 0;
  let totalSobrante = 0;
  let totalFaltante = 0;
  let totalMovimientosMes = 0;
  let totalIngresosMes = 0;
  let totalEgresosMes = 0;

  for (const r of rows) {
    totalMovimientosMes += Number(r.total_movimientos || 0);
    totalIngresosMes += Number(r.total_ingresos || 0);
    totalEgresosMes += Number(r.total_egresos || 0);

    const dif = Number(r.diferencia || 0);
    if (dif === 0) {
      diasCuadrados++;
    } else {
      diasConDiferencia++;
      if (dif > 0) totalSobrante += dif;
      else totalFaltante += Math.abs(dif);
    }
  }

  return {
    mes: mesParam,
    resumen: {
      totalDiasOperados,
      diasCuadrados,
      diasConDiferencia,
      totalSobrante,
      totalFaltante,
      totalMovimientosMes,
      totalIngresosMes,
      totalEgresosMes,
    },
    dias: rows,
  };
}



export interface DatosEdicionAuxiliar {
  seccion?: string;
  categoria?: CajaCategoria;
  tipo?: "INGRESO" | "EGRESO";
  monto?: number;
  referencia?: string;
  descripcion?: string;
}

export async function editar(id: string, data: DatosEdicionAuxiliar, usuarioId: string, motivo: string) {
  const { rows: anteriores } = await pool.query(
    "select * from caja_movimientos_auxiliar where id = $1",
    [id]
  );
  if (!anteriores[0]) throw notFound("El movimiento no existe");
  const ant = anteriores[0];

  const { rows } = await pool.query(
    `update caja_movimientos_auxiliar
     set seccion = coalesce($1, seccion),
         categoria = coalesce($2, categoria),
         tipo = coalesce($3, tipo),
         monto = coalesce($4, monto),
         referencia = coalesce($5, referencia),
         descripcion = coalesce($6, descripcion)
     where id = $7
     returning *`,
    [
      data.seccion,
      data.categoria,
      data.tipo,
      data.monto,
      data.referencia,
      data.descripcion,
      id
    ]
  );

  const mov = rows[0];
  await registrarAuditoria({
    entidad: "CajaMovimientoAuxiliar",
    entidadId: id,
    accion: "ACTUALIZAR",
    usuarioId,
    datosAnteriores: ant,
    datosNuevos: mov,
    motivo
  });
  return mov;
}

// ---------------------------------------------------------------------------
// Liquidación de Promotores
// ---------------------------------------------------------------------------

export async function listarLiquidacionesPendientes(agenciaId: string, agenciaVisible: string | null) {
  checarAgencia(agenciaId, agenciaVisible);
  const { rows } = await pool.query(
    `
    select 
      u.id as promotor_id,
      u.nombre as promotor_nombre,
      count(c.id)::int as cantidad_recibos,
      sum(c.monto)::numeric as total_efectivo,
      json_agg(
        json_build_object(
          'id', c.id,
          'socio_nombres', s.nombres,
          'prestamo_codigo', p.codigo,
          'fecha', c.fecha,
          'numero_recibo_fisico', c.numero_recibo_fisico,
          'monto', c.monto,
          'justificacion_edicion', c.justificacion_edicion,
          'veces_editado', c.veces_editado
        ) order by c.created_at asc
      ) as cobros
    from cobros_campo c
    join usuarios u on u.id = c.promotor_id
    join socios s on s.id = c.socio_id
    join prestamos p on p.id = c.prestamo_id
    where c.agencia_id = $1 and c.estado = 'PENDIENTE'
    group by u.id, u.nombre
    `, [agenciaId]
  );
  return rows;
}

export async function aprobarLiquidacion(agenciaId: string, promotorId: string, usuarioId: string) {
  // 1. Get current OPEN caja_dia for this agency
  const { rows: diaRows } = await pool.query(`select id from caja_dias where agencia_id = $1 and estado = 'ABIERTO'`, [agenciaId]);
  if (diaRows.length === 0) throw badRequest("No hay caja abierta para procesar liquidaciones.");
  const diaId = diaRows[0].id;

  // 2. Get pending cobros for this promoter
  const { rows: cobros } = await pool.query(`
    select c.*
    from cobros_campo c
    where c.promotor_id = $1 and c.agencia_id = $2 and c.estado = 'PENDIENTE'
    order by c.created_at asc
  `, [promotorId, agenciaId]);

  if (cobros.length === 0) throw badRequest("Este promotor no tiene cobros pendientes de liquidar.");

  let procesados = 0;
  // 3. Process each cobro sequentially
  for (const cobro of cobros) {
    const { rows: prestamoInfoRows } = await pool.query(`select * from prestamos where id = $1`, [cobro.prestamo_id]);
    const prestamo = prestamoInfoRows[0];
    const { rows: pagosRows } = await pool.query(`select * from prestamo_pagos where prestamo_id = $1 order by fecha desc, created_at desc`, [cobro.prestamo_id]);
    
    const fechaUltimoPago = pagosRows.length > 0 ? pagosRows[0].fecha : prestamo.fecha_desembolso;
    const liquidacion = calcularLiquidacionCredito({
      saldoCapital: Number(prestamo.saldo_capital || prestamo.monto_aprobado),
      tasaInteresMensual: Number(prestamo.tasa_interes_mensual),
      plazoMeses: prestamo.plazo_meses,
      montoOriginal: Number(prestamo.monto_aprobado),
      cuotaMensualEstimada: Number(prestamo.cuota_mensual),
      fechaUltimoPago,
      tipoAmortizacion: prestamo.tipo_amortizacion,
    });

    // Usamos EXACTAMENTE el desglose ingresado por el promotor en campo.
    const mov = await cobrarCuotaCredito(
      diaId,
      {
        prestamoId: cobro.prestamo_id,
        socioId: cobro.socio_id,
        abonoCapital: Number(cobro.pago_capital),
        interes: Number(cobro.pago_interes),
        mora: Number(cobro.pago_mora),
        ahorroSobrePrestamo: Number(cobro.ahorro_prestamo),
        origenFondos: prestamo.origen_fondos || "FONDOS_PROPIOS",
        docNo: cobro.numero_recibo_fisico, // Usar el número de recibo físico que digitó el promotor
      },
      usuarioId,
      agenciaId,
    );

    // Marcar como liquidado, enlazando los IDs
    await pool.query(`
      update cobros_campo 
      set estado = 'LIQUIDADO', liquidado_at = now(), caja_dia_id = $1, caja_movimiento_id = $2
      where id = $3
    `, [diaId, mov.cajaMovimiento.id, cobro.id]);

    procesados++;
  }

  return { ok: true, procesados, mensaje: `Se liquidaron exitosamente ${procesados} cobros.` };
}
