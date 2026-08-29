import { pool } from "../../db/pool";
import { registrarAuditoria } from "../../utils/auditoria";
import { badRequest, notFound, forbidden, conflict } from "../../utils/errors";
import * as cuentasService from "../cuentas/service";
import { CATEGORIAS, CajaCategoria, DENOMINACIONES, categoriasDelGrupo } from "./categorias";

function hoyISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function checarAgencia(agenciaId: string, agenciaVisible: string | null) {
  if (agenciaVisible && agenciaId !== agenciaVisible) throw forbidden("Esa caja pertenece a otra agencia");
}

export async function estado(agenciaId: string, agenciaVisible: string | null) {
  checarAgencia(agenciaId, agenciaVisible);

  const { rows: abiertos } = await pool.query(
    `select * from caja_dias where agencia_id = $1 and estado = 'ABIERTO' order by fecha desc limit 1`,
    [agenciaId],
  );
  if (abiertos[0]) return { estado: "ABIERTO" as const, dia: abiertos[0] };

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

export async function abrirDia(agenciaId: string, usuarioId: string, agenciaVisible: string | null, saldoInicialManual?: number) {
  checarAgencia(agenciaId, agenciaVisible);
  const fecha = hoyISO();

  const { rows: abiertos } = await pool.query(
    `select * from caja_dias where agencia_id = $1 and estado = 'ABIERTO' order by fecha desc limit 1`,
    [agenciaId],
  );
  if (abiertos[0]) {
    const fechaAbierto = new Date(abiertos[0].fecha).toISOString().slice(0, 10);
    if (fechaAbierto === fecha) return abiertos[0];
    throw conflict(`Todavía tienes la caja del ${fechaAbierto} sin cerrar. Ciérrala antes de abrir la de hoy.`);
  }

  const { rows: existeHoy } = await pool.query(
    `select * from caja_dias where agencia_id = $1 and fecha = $2`,
    [agenciaId, fecha],
  );
  if (existeHoy[0]) throw conflict("La caja de hoy ya fue cerrada; no se puede volver a abrir.");

  const { rows: ultimos } = await pool.query(
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

  const { rows } = await pool.query(
    `insert into caja_dias (agencia_id, fecha, saldo_inicial, estado, abierto_por)
     values ($1,$2,$3,'ABIERTO',$4)
     returning *`,
    [agenciaId, fecha, saldoInicial, usuarioId],
  );
  const dia = rows[0];
  await registrarAuditoria({ entidad: "CajaDia", entidadId: dia.id, accion: "CREAR", usuarioId, datosNuevos: dia });
  return dia;
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
  const dia = await obtenerDiaCrudo(diaId, agenciaVisible);
  if (dia.estado !== "ABIERTO") throw conflict("La caja de este día ya está cerrada; no se pueden agregar movimientos.");

  const info = CATEGORIAS[data.categoria];
  if (!info) throw badRequest("Categoría de movimiento no reconocida");
  if (!data.monto || data.monto <= 0) throw badRequest("El monto debe ser mayor a cero");

  const { rows: contadorRows } = await pool.query(
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
    const cuenta = await cuentasService.obtener(data.cuentaId, agenciaVisible);
    if (cuenta.tipo !== info.requiereCuenta) throw badRequest("La cuenta seleccionada no corresponde a este tipo de ahorro");

    const movimiento = await cuentasService.registrarMovimiento(
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
    const { rows } = await pool.query(
      `insert into ingresos_comif (agencia_id, fecha, numero_documento, nombre_socio, categoria, monto, usuario_id)
       values ($1,$2,$3,$4,$5,$6,$7)
       returning id`,
      [dia.agencia_id, dia.fecha, data.docNo ?? null, beneficiario, info.ingresosComifCategoria, data.monto, usuarioId],
    );
    ingresoComifId = rows[0].id;
  } else {
    if (!beneficiario) throw badRequest("Indica el beneficiario");
  }

  const { rows: ultimoMovRows } = await pool.query(
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

  const { rows } = await pool.query(
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
}

export interface ItemConteo {
  valor: number;
  cantidad: number;
}

export async function cerrarDia(diaId: string, conteo: ItemConteo[], usuarioId: string, agenciaVisible: string | null) {
  const dia = await obtenerDiaCrudo(diaId, agenciaVisible);
  if (dia.estado !== "ABIERTO") throw conflict("Esta caja ya está cerrada");

  const denominacionesFaltantes = DENOMINACIONES.filter((d) => !conteo.some((c) => Math.abs(c.valor - d) < 0.001));
  if (denominacionesFaltantes.length) {
    throw badRequest(`Falta el conteo de: Q${denominacionesFaltantes.join(", Q")}`);
  }

  const { rows: ultimoMovRows } = await pool.query(
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

  const client = await pool.connect();
  try {
    await client.query("begin");
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
    await client.query("commit");
    const diaActualizado = rows[0];
    await registrarAuditoria({
      entidad: "CajaDia",
      entidadId: diaId,
      accion: "ACTUALIZAR",
      usuarioId,
      datosNuevos: diaActualizado,
    });
    return diaActualizado;
  } catch (err) {
    await client.query("rollback");
    throw err;
  } finally {
    client.release();
  }
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
