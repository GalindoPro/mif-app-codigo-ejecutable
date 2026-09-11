// Escenario de demostración repetible: simula ~5 meses de uso real de la
// cooperativa usando las MISMAS funciones de servicio que expone la API (no
// SQL directo salvo para leer/limpiar), para que cualquier bug de negocio se
// note igual que si un usuario real lo hiciera desde el navegador.
//
// Crea:
//  - 5 socios preexistentes migrados (créditos con historial físico previo,
//    con y sin mora) para demostrar el flujo de migración.
//  - 5 socios nuevos, solicitando crédito alternando entre 2 promotores.
//  - Una sesión de caja auxiliar de "hoy": desembolsos, cobros de cuota
//    (incluyendo uno con un monto distinto al calculado por el sistema, para
//    ver la marca de auditoría "diferenciaCalculoOficial" en acción) y cierre
//    de caja cuadrado.
//  - Cuentas de ahorro corriente con depósito y retiro para 2 socios nuevos.
//  - Comprobantes de caja chica distribuidos en los últimos meses.
//
// Es idempotente por reinicio: cada corrida borra primero cualquier dato
// creado por una corrida anterior de este mismo script (identificado por el
// marcador "(Demo)" en el nombre) y vuelve a construir todo desde cero.
//
// Uso: npm run db:seed:demo  (requiere que ya exista `npm run db:seed`)

import "dotenv/config";
import { pool } from "./pool";
import { hashPassword } from "../utils/auth";
import * as sociosService from "../modules/socios/service";
import * as prestamosService from "../modules/prestamos/service";
import * as cuentasService from "../modules/cuentas/service";
import * as cajaAuxiliarService from "../modules/cajaauxiliar/service";
import * as cajaChicaService from "../modules/cajachica/service";
import * as plazofijoService from "../modules/plazofijo/service";
import { DENOMINACIONES } from "../modules/cajaauxiliar/categorias";

const MARCADOR = "(Demo)";

function construirConteoExacto(totalQuetzales: number) {
  let centavos = Math.round(totalQuetzales * 100);
  const conteo: { valor: number; cantidad: number }[] = [];
  for (const denom of [...DENOMINACIONES].sort((a, b) => b - a)) {
    const denomCentavos = Math.round(denom * 100);
    const cantidad = Math.floor(centavos / denomCentavos);
    centavos -= cantidad * denomCentavos;
    conteo.push({ valor: denom, cantidad });
  }
  if (centavos !== 0) {
    throw new Error(`No se pudo cuadrar el conteo exacto para Q${totalQuetzales.toFixed(2)} (resto ${centavos}c)`);
  }
  return conteo;
}

async function limpiarCorridaAnterior() {
  const { rows: socios } = await pool.query(`select id from socios where nombres like '%' || $1 || '%'`, [MARCADOR]);
  if (socios.length === 0) return;
  const ids = socios.map((s) => s.id);

  const { rows: prestamos } = await pool.query(`select id from prestamos where socio_id = any($1)`, [ids]);
  const prestamoIds = prestamos.map((p) => p.id);
  const { rows: cuentas } = await pool.query(`select id from cuentas where socio_id = any($1)`, [ids]);
  const cuentaIds = cuentas.map((c) => c.id);
  const { rows: dias } = await pool.query(
    `select distinct caja_dia_id as id from caja_movimientos_auxiliar where socio_id = any($1)`,
    [ids],
  );
  const diaIds = dias.map((d) => d.id);

  await pool.query(`delete from prestamo_pagos where prestamo_id = any($1)`, [prestamoIds]);
  await pool.query(`delete from caja_arqueos where caja_dia_id = any($1)`, [diaIds]);
  await pool.query(`delete from caja_movimientos_auxiliar where caja_dia_id = any($1)`, [diaIds]);
  await pool.query(`delete from caja_dias where id = any($1)`, [diaIds]);
  await pool.query(`delete from movimientos where cuenta_id = any($1)`, [cuentaIds]);
  await pool.query(`delete from plazo_fijo_contratos where cuenta_id = any($1)`, [cuentaIds]);
  await pool.query(`delete from cuentas where id = any($1)`, [cuentaIds]);
  await pool.query(`delete from prestamos where id = any($1)`, [prestamoIds]);
  await pool.query(
    `delete from caja_chica_comprobantes where descripcion like '%' || $1 || '%'`,
    [MARCADOR],
  );
  await pool.query(`delete from socios where id = any($1)`, [ids]);
  console.log(`Corrida anterior limpiada: ${ids.length} socio(s) de demo y su actividad ligada.`);
}

async function main() {
  const { rows: agRows } = await pool.query(`select * from agencias where codigo = 'CHAJUL'`);
  const agencia = agRows[0];
  if (!agencia) throw new Error("No existe la agencia CHAJUL. Corre primero: npm run db:seed");

  const { rows: usuarios } = await pool.query(
    `select * from usuarios where email in ('admin@mif.coop','supervisor@mif.coop','cajero@mif.coop','promotor@mif.coop')`,
  );
  const porEmail = Object.fromEntries(usuarios.map((u) => [u.email, u]));
  const admin = porEmail["admin@mif.coop"];
  const cajero = porEmail["cajero@mif.coop"];
  const promotor1 = porEmail["promotor@mif.coop"];
  if (!admin || !cajero || !promotor1) throw new Error("Faltan usuarios base. Corre primero: npm run db:seed");

  // Un segundo promotor, para demostrar que cada crédito conserva registro de
  // quién lo solicitó cuando hay más de un promotor en la agencia.
  const passwordHash = await hashPassword("Prueba123!");
  const { rows: promotor2Rows } = await pool.query(
    `insert into usuarios (nombre, email, password_hash, rol, agencia_id)
     values ('Elena Promotora Chajul', 'promotor2@mif.coop', $1, 'PROMOTOR', $2)
     on conflict (email) do update set nombre = excluded.nombre
     returning *`,
    [passwordHash, agencia.id],
  );
  const promotor2 = promotor2Rows[0];

  await limpiarCorridaAnterior();

  // ---------------------------------------------------------------------
  // 1) Cinco socios preexistentes, migrados con historial físico previo.
  // ---------------------------------------------------------------------
  const migraciones = [
    {
      nombres: `María Xicay Tzul ${MARCADOR}`,
      dpi: "1801234560101",
      telefono: "55011001",
      montoOriginal: 15000,
      saldoCapitalActual: 11500,
      plazoMeses: 18,
      fechaDesembolsoOriginal: "2026-01-15",
      fechaUltimoPago: "2026-08-20", // ~21 días atrás -> al día
      numeroCreditoAnterior: "LIBRO-2025-041",
    },
    {
      nombres: `Pedro Us Ixchop ${MARCADOR}`,
      dpi: "1801234560102",
      telefono: "55011002",
      montoOriginal: 8000,
      saldoCapitalActual: 6200,
      plazoMeses: 12,
      fechaDesembolsoOriginal: "2026-02-10",
      fechaUltimoPago: "2026-08-15", // ~26 días -> al día, cerca del límite
      numeroCreditoAnterior: "LIBRO-2025-058",
    },
    {
      nombres: `Juana Bernal Say ${MARCADOR}`,
      dpi: "1801234560103",
      telefono: "55011003",
      montoOriginal: 25000,
      saldoCapitalActual: 20500,
      plazoMeses: 24,
      fechaDesembolsoOriginal: "2026-03-05",
      fechaUltimoPago: "2026-07-01", // ~71 días -> mora real
      numeroCreditoAnterior: "LIBRO-2025-063",
    },
    {
      nombres: `Diego Ramírez Coy ${MARCADOR}`,
      dpi: "1801234560104",
      telefono: "55011004",
      montoOriginal: 12000,
      saldoCapitalActual: 9800,
      plazoMeses: 12,
      fechaDesembolsoOriginal: "2026-04-12",
      fechaUltimoPago: "2026-08-25", // ~16 días -> al día
      numeroCreditoAnterior: "LIBRO-2025-071",
    },
    {
      nombres: `Rosa Chocoj Mendoza ${MARCADOR}`,
      dpi: "1801234560105",
      telefono: "55011005",
      montoOriginal: 30000,
      saldoCapitalActual: 26000,
      plazoMeses: 36,
      fechaDesembolsoOriginal: "2026-05-01",
      fechaUltimoPago: "2026-06-20", // ~82 días -> mora fuerte
      numeroCreditoAnterior: "LIBRO-2025-089",
    },
  ];

  const sociosMigracion: { socio: any; prestamo: any }[] = [];
  for (const m of migraciones) {
    const { numeroAsociado } = await sociosService.siguienteNumero(agencia.id);
    const socio = await sociosService.crear(
      {
        numeroAsociado,
        agenciaId: agencia.id,
        nombres: m.nombres,
        fechaIngreso: m.fechaDesembolsoOriginal,
        dpi: m.dpi,
        telefono: m.telefono,
        direccion: "Chajul, Quiché",
        montoAportacionInicial: 100,
        reciboAportacionInicial: `DEMO-APOR-${m.numeroCreditoAnterior}`,
      },
      admin.id,
    );

    const prestamo = await prestamosService.crear(
      {
        agenciaId: agencia.id,
        socioId: socio.id,
        tipo: "FIDUCIARIO",
        tipoAmortizacion: "SOBRE_SALDOS",
        montoSolicitado: m.montoOriginal,
        plazoMeses: m.plazoMeses,
        tasaInteresMensual: 2.0,
        esMigracion: true,
        saldoCapitalActual: m.saldoCapitalActual,
        fechaDesembolsoOriginal: m.fechaDesembolsoOriginal,
        fechaUltimoPago: m.fechaUltimoPago,
        numeroCreditoAnterior: m.numeroCreditoAnterior,
        observaciones: `Migrado desde libro físico ${m.numeroCreditoAnterior}`,
      },
      admin.id,
    );

    sociosMigracion.push({ socio, prestamo });
    console.log(`Migrado: ${socio.nombres} — crédito ${prestamo.codigo} (saldo Q${m.saldoCapitalActual})`);
  }

  // ---------------------------------------------------------------------
  // 2) Cinco socios nuevos, afiliados en distintos meses, alternando
  //    promotor. Los primeros 3 se desembolsan hoy; los últimos 2 quedan
  //    APROBADOS (pipeline pendiente), como en una operación real.
  // ---------------------------------------------------------------------
  const nuevos = [
    { nombres: `Carlos Ajpop Mérida ${MARCADOR}`, dpi: "1801234560201", telefono: "55012001", fechaSolicitud: "2026-05-20", promotor: promotor1, monto: 10000, plazoMeses: 12, desembolsarHoy: true, crearAsp: false },
    { nombres: `Elena Coc Batz ${MARCADOR}`, dpi: "1801234560202", telefono: "55012002", fechaSolicitud: "2026-06-15", promotor: promotor2, monto: 18000, plazoMeses: 18, desembolsarHoy: true, crearAsp: true },
    { nombres: `Miguel Sicay Tum ${MARCADOR}`, dpi: "1801234560203", telefono: "55012003", fechaSolicitud: "2026-07-10", promotor: promotor1, monto: 7000, plazoMeses: 12, desembolsarHoy: true, crearAsp: false },
    { nombres: `Ana Poou Chach ${MARCADOR}`, dpi: "1801234560204", telefono: "55012004", fechaSolicitud: "2026-08-05", promotor: promotor2, monto: 22000, plazoMeses: 24, desembolsarHoy: false, crearAsp: false },
    { nombres: `Luis Tzunun Ordóñez ${MARCADOR}`, dpi: "1801234560205", telefono: "55012005", fechaSolicitud: "2026-09-10", promotor: promotor1, monto: 9000, plazoMeses: 12, desembolsarHoy: false, crearAsp: false },
  ];

  const sociosNuevos: { socio: any; prestamo: any; desembolsarHoy: boolean; crearAsp: boolean }[] = [];
  for (const n of nuevos) {
    const { numeroAsociado } = await sociosService.siguienteNumero(agencia.id);
    const socio = await sociosService.crear(
      {
        numeroAsociado,
        agenciaId: agencia.id,
        nombres: n.nombres,
        fechaIngreso: n.fechaSolicitud,
        dpi: n.dpi,
        telefono: n.telefono,
        direccion: "Chajul, Quiché",
        montoAportacionInicial: 100,
        reciboAportacionInicial: `DEMO-APOR-NUEVO-${n.dpi.slice(-4)}`,
      },
      admin.id,
    );

    const prestamo = await prestamosService.crear(
      {
        agenciaId: agencia.id,
        socioId: socio.id,
        promotorId: n.promotor.id,
        tipo: "FIDUCIARIO",
        tipoAmortizacion: "SOBRE_SALDOS",
        montoSolicitado: n.monto,
        plazoMeses: n.plazoMeses,
        tasaInteresMensual: 2.0,
        fechaSolicitud: n.fechaSolicitud,
        destino: "Capital de trabajo / Comercio",
        crearCuentaAhorroSobrePrestamo: n.crearAsp,
      },
      n.promotor.id,
    );

    sociosNuevos.push({ socio, prestamo, desembolsarHoy: n.desembolsarHoy, crearAsp: n.crearAsp });
    console.log(`Nuevo: ${socio.nombres} — crédito ${prestamo.codigo} solicitado por ${n.promotor.nombre} el ${n.fechaSolicitud}`);
  }

  // ---------------------------------------------------------------------
  // 2.5) Plazo Fijo: 3 certificados con fechas distintas. Uno ya vencido
  //      (Pedro) para liquidarlo hoy mismo dentro de la sesión de caja de
  //      abajo; los otros dos quedan ACTIVOS para navegarlos en pantalla.
  // ---------------------------------------------------------------------
  const certificadoVencido = await plazofijoService.crear(
    {
      agenciaId: agencia.id,
      socioId: sociosMigracion[1].socio.id, // Pedro Us Ixchop
      montoDeposito: 3000,
      plazoMeses: 6,
      tasaAnual: 6.0,
      fechaInicio: "2026-02-05", // vence ~2026-08-05, ya vencido hoy
    },
    admin.id,
  );
  console.log(`Plazo fijo certificado ${certificadoVencido.numero_certificacion} — Pedro Us Ixchop, Q3,000 (vencido, listo para liquidar)`);

  const certificadoActivo1 = await plazofijoService.crear(
    {
      agenciaId: agencia.id,
      socioId: sociosMigracion[4].socio.id, // Rosa Chocoj Mendoza
      montoDeposito: 8000,
      plazoMeses: 12,
      tasaAnual: 14.0,
      fechaInicio: "2026-03-10",
    },
    admin.id,
  );
  console.log(`Plazo fijo certificado ${certificadoActivo1.numero_certificacion} — Rosa Chocoj Mendoza, Q8,000 (activo)`);

  const certificadoActivo2 = await plazofijoService.crear(
    {
      agenciaId: agencia.id,
      socioId: sociosNuevos[3].socio.id, // Ana Poou Chach
      montoDeposito: 5000,
      plazoMeses: 6,
      tasaAnual: 6.0,
      fechaInicio: "2026-06-01",
    },
    admin.id,
  );
  console.log(`Plazo fijo certificado ${certificadoActivo2.numero_certificacion} — Ana Poou Chach, Q5,000 (activo)`);

  // ---------------------------------------------------------------------
  // 3) Sesión de caja auxiliar de hoy: desembolsos + cobros de cuota +
  //    liquidación del plazo fijo vencido de Pedro.
  // ---------------------------------------------------------------------
  const dia = await cajaAuxiliarService.abrirDia(agencia.id, cajero.id, null, 100000);
  console.log(`Caja abierta: día ${dia.fecha}, saldo inicial Q${dia.saldo_inicial}`);

  for (const { prestamo, desembolsarHoy, crearAsp } of sociosNuevos) {
    if (!desembolsarHoy) continue;
    await cajaAuxiliarService.desembolsarCredito(
      dia.id,
      { prestamoId: prestamo.id, montoAhorroSobrePrestamo: crearAsp ? Math.round(prestamo.monto_solicitado * 0.05 * 100) / 100 : 0 },
      cajero.id,
      null,
    );
    console.log(`Desembolsado: crédito ${prestamo.codigo}`);
  }

  // Cobro limpio (sin mora): María, al día.
  await cobrarSegunTabla(sociosMigracion[0].prestamo.id, dia.id, cajero.id);
  // Cobro limpio con mora real: Juana, atrasada.
  await cobrarSegunTabla(sociosMigracion[2].prestamo.id, dia.id, cajero.id);

  // Cobro con diferencia DELIBERADA respecto al cálculo oficial (recibo físico
  // no coincide con el sistema): se cobra Q30 menos de interés del sugerido.
  // Debe quedar marcado con diferenciaCalculoOficial en la respuesta y en
  // auditoría, sin ser bloqueado.
  {
    const prestamo = sociosNuevos[0].prestamo; // Carlos, recién desembolsado
    const { liquidacion } = await prestamosService.obtenerLiquidacion(prestamo.id);
    const interesAjustado = Math.max(0, Math.round((liquidacion.interesDevengado - 30) * 100) / 100);
    const resultado = await cajaAuxiliarService.cobrarCuotaCredito(
      dia.id,
      {
        prestamoId: prestamo.id,
        socioId: sociosNuevos[0].socio.id,
        abonoCapital: liquidacion.cuotaCapitalSugerida,
        interes: interesAjustado,
        mora: 0,
      },
      cajero.id,
      null,
    );
    console.log(
      `Cobro con diferencia deliberada en crédito ${prestamo.codigo}: interés cobrado Q${interesAjustado} vs. calculado Q${liquidacion.interesDevengado} ` +
      `-> diferenciaCalculoOficial: ${resultado.diferenciaCalculoOficial ? "SÍ quedó marcada" : "no se marcó (revisar)"}`,
    );
  }

  async function cobrarSegunTabla(prestamoId: string, diaId: string, usuarioId: string) {
    const { liquidacion, prestamo } = await prestamosService.obtenerLiquidacion(prestamoId);
    await cajaAuxiliarService.cobrarCuotaCredito(
      diaId,
      {
        prestamoId,
        socioId: prestamo.socio_id,
        abonoCapital: liquidacion.cuotaCapitalSugerida,
        interes: liquidacion.interesDevengado,
        mora: liquidacion.moraFijaSugerida,
      },
      usuarioId,
      null,
    );
    console.log(
      `Cobro exacto según tabla: crédito ${prestamo.codigo} — capital Q${liquidacion.cuotaCapitalSugerida}, interés Q${liquidacion.interesDevengado}, mora Q${liquidacion.moraFijaSugerida}`,
    );
  }

  // Liquidación del plazo fijo vencido de Pedro, por el único camino válido
  // hoy en día (Auxiliar de Caja, no el atajo directo que bloqueamos).
  await cajaAuxiliarService.liquidarPlazoFijo(
    dia.id,
    { contratoId: certificadoVencido.id, reciboRetiro: "DEMO-RE-PF-001", incluirIntereses: true },
    cajero.id,
    null,
  );
  console.log(`Plazo fijo ${certificadoVencido.numero_certificacion} liquidado hoy vía Auxiliar de Caja (capital + interés neto)`);

  // Cierre de caja, cuadrado exacto contra lo acumulado en el sistema.
  const { rows: ultimoMov } = await pool.query(
    `select saldo_acumulado from caja_movimientos_auxiliar where caja_dia_id = $1 order by created_at desc limit 1`,
    [dia.id],
  );
  const saldoFinal = Number(ultimoMov[0].saldo_acumulado);
  await cajaAuxiliarService.cerrarDia(dia.id, construirConteoExacto(saldoFinal), cajero.id, null);
  console.log(`Caja cerrada: saldo final Q${saldoFinal.toFixed(2)} (conteo cuadrado exacto)`);

  // ---------------------------------------------------------------------
  // 4) Cuentas de ahorro corriente para 2 socios nuevos, con depósito y
  //    retiro en fechas distintas (simulando visitas en meses distintos).
  // ---------------------------------------------------------------------
  {
    const carlos = sociosNuevos[0].socio;
    const { numeroCuenta } = await cuentasService.siguienteNumero(agencia.id, "AHORRO_CORRIENTE");
    const cuenta = await cuentasService.crear(
      { tipo: "AHORRO_CORRIENTE", agenciaId: agencia.id, socioId: carlos.id, numeroCuenta, saldoInicial: 0 },
      admin.id,
    );
    await cuentasService.registrarMovimiento(
      cuenta.id,
      { tipo: "DEPOSITO", monto: 500, fecha: "2026-06-01", numeroRecibo: "DEMO-AHO-001", descripcion: "Depósito inicial" },
      cajero.id,
      null,
    );
    await cuentasService.registrarMovimiento(
      cuenta.id,
      { tipo: "RETIRO", monto: 200, fecha: "2026-07-15", numeroRecibo: "DEMO-AHO-002", descripcion: "Retiro parcial" },
      cajero.id,
      null,
    );
    console.log(`Ahorro corriente ${cuenta.numero_cuenta} para ${carlos.nombres}: depósito Q500 (jun) y retiro Q200 (jul)`);
  }
  {
    const elena = sociosNuevos[1].socio;
    const { numeroCuenta } = await cuentasService.siguienteNumero(agencia.id, "AHORRO_CORRIENTE");
    const cuenta = await cuentasService.crear(
      { tipo: "AHORRO_CORRIENTE", agenciaId: agencia.id, socioId: elena.id, numeroCuenta, saldoInicial: 0 },
      admin.id,
    );
    await cuentasService.registrarMovimiento(
      cuenta.id,
      { tipo: "DEPOSITO", monto: 1000, fecha: "2026-07-01", numeroRecibo: "DEMO-AHO-003", descripcion: "Depósito inicial" },
      cajero.id,
      null,
    );
    console.log(`Ahorro corriente ${cuenta.numero_cuenta} para ${elena.nombres}: depósito Q1000 (jul)`);
  }

  // ---------------------------------------------------------------------
  // 4.5) Ahorro Programado (con cuota pactada) e Infanto Juvenil.
  // ---------------------------------------------------------------------
  {
    const miguel = sociosNuevos[2].socio;
    const { numeroCuenta } = await cuentasService.siguienteNumero(agencia.id, "AHORRO_PROGRAMADO");
    const cuenta = await cuentasService.crear(
      { tipo: "AHORRO_PROGRAMADO", agenciaId: agencia.id, socioId: miguel.id, numeroCuenta, saldoInicial: 0, cuotaPactada: 200 },
      admin.id,
    );
    await cuentasService.registrarMovimiento(
      cuenta.id,
      { tipo: "DEPOSITO", monto: 200, fecha: "2026-07-15", numeroRecibo: "DEMO-PROG-001", descripcion: "Cuota programada julio" },
      cajero.id,
      null,
    );
    await cuentasService.registrarMovimiento(
      cuenta.id,
      { tipo: "DEPOSITO", monto: 200, fecha: "2026-08-15", numeroRecibo: "DEMO-PROG-002", descripcion: "Cuota programada agosto" },
      cajero.id,
      null,
    );
    console.log(`Ahorro programado ${cuenta.numero_cuenta} para ${miguel.nombres}: 2 cuotas de Q200 (jul, ago)`);
  }
  {
    const diego = sociosMigracion[3].socio; // Diego Ramírez Coy
    const { numeroCuenta } = await cuentasService.siguienteNumero(agencia.id, "AHORRO_PROGRAMADO");
    const cuenta = await cuentasService.crear(
      { tipo: "AHORRO_PROGRAMADO", agenciaId: agencia.id, socioId: diego.id, numeroCuenta, saldoInicial: 0, cuotaPactada: 150 },
      admin.id,
    );
    for (const fecha of ["2026-05-01", "2026-06-01", "2026-07-01"]) {
      await cuentasService.registrarMovimiento(
        cuenta.id,
        { tipo: "DEPOSITO", monto: 150, fecha, numeroRecibo: `DEMO-PROG-${fecha}`, descripcion: "Cuota programada" },
        cajero.id,
        null,
      );
    }
    console.log(`Ahorro programado ${cuenta.numero_cuenta} para ${diego.nombres}: 3 cuotas de Q150 (may-jul)`);
  }
  {
    const maria = sociosMigracion[0].socio; // María Xicay Tzul
    const { numeroCuenta } = await cuentasService.siguienteNumero(agencia.id, "AHORRO_INFANTO_JUVENIL");
    const cuenta = await cuentasService.crear(
      { tipo: "AHORRO_INFANTO_JUVENIL", agenciaId: agencia.id, socioId: maria.id, numeroCuenta, saldoInicial: 0 },
      admin.id,
    );
    await cuentasService.registrarMovimiento(
      cuenta.id,
      { tipo: "DEPOSITO", monto: 100, fecha: "2026-06-10", numeroRecibo: "DEMO-INF-001", descripcion: "Ahorro infantil" },
      cajero.id,
      null,
    );
    await cuentasService.registrarMovimiento(
      cuenta.id,
      { tipo: "DEPOSITO", monto: 100, fecha: "2026-08-10", numeroRecibo: "DEMO-INF-002", descripcion: "Ahorro infantil" },
      cajero.id,
      null,
    );
    console.log(`Ahorro infanto juvenil ${cuenta.numero_cuenta} para ${maria.nombres}: 2 depósitos de Q100 (jun, ago)`);
  }

  // ---------------------------------------------------------------------
  // 5) Caja chica: comprobantes distribuidos en los últimos meses.
  // ---------------------------------------------------------------------
  const comprobantesCajaChica: Array<{
    fecha: string;
    tipo: "INGRESO" | "EGRESO";
    categoria?: string;
    beneficiario: string;
    descripcion: string;
    monto: number;
  }> = [
    { fecha: "2026-05-10", tipo: "INGRESO", beneficiario: "Banco / Reposición", descripcion: `Reposición mensual de fondo fijo ${MARCADOR}`, monto: 2000 },
    { fecha: "2026-05-25", tipo: "EGRESO", categoria: "SUMINISTROS_OFICINA", beneficiario: "Papelería Chajul", descripcion: `Compra de suministros de oficina ${MARCADOR}`, monto: 150 },
    { fecha: "2026-06-30", tipo: "EGRESO", categoria: "COMBUSTIBLES_LUBRICANTES", beneficiario: "Gasolinera Ixil", descripcion: `Combustible para visitas de campo ${MARCADOR}`, monto: 300 },
    { fecha: "2026-07-20", tipo: "EGRESO", categoria: "CAFETERIA_LIMPIEZA", beneficiario: "Tienda local", descripcion: `Cafetería y limpieza ${MARCADOR}`, monto: 80 },
    { fecha: "2026-08-15", tipo: "EGRESO", categoria: "REPARACION_MANTENIMIENTO", beneficiario: "Servicio técnico", descripcion: `Mantenimiento de equipo de oficina ${MARCADOR}`, monto: 450 },
  ];
  for (const c of comprobantesCajaChica) {
    await cajaChicaService.crear(
      {
        agenciaId: agencia.id,
        fecha: c.fecha,
        beneficiario: c.beneficiario,
        descripcion: c.descripcion,
        tipo: c.tipo,
        categoria: c.categoria as any,
        monto: c.monto,
      },
      admin.id,
    );
  }
  console.log(`Caja chica: ${comprobantesCajaChica.length} comprobantes distribuidos entre mayo y agosto.`);

  console.log("\nEscenario de demo listo: 5 socios migrados + 5 nuevos, 3 créditos desembolsados hoy, 3 cobros (uno con diferencia marcada), 2 cuentas de ahorro con movimientos, 5 comprobantes de caja chica.");
  await pool.end();
}

main().catch((err) => {
  console.error("Falló el seed de demo:", err);
  process.exit(1);
});
