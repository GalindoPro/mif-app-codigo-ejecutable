// Genera datos sintéticos EN VOLUMEN (decenas de socios, cientos de créditos
// y cobros) directo por SQL en bloque — a propósito NO pasa por las funciones
// de servicio una por una: seed-demo.ts ya cubre que la lógica de negocio
// funciona bien; este script existe solo para medir si las pantallas y
// consultas (listados, Kardex, Tablero) siguen respondiendo rápido cuando
// hay muchos registros, no 12.
//
// Repetible: borra su propia corrida anterior (marcador "(Carga)") antes de
// generar de nuevo.
//
// Uso: npm run db:seed:load-test [-- --socios=60 --creditos=200]

import "dotenv/config";
import { pool } from "./pool";

const MARCADOR = "(Carga)";
const N_SOCIOS = Number(process.argv.find((a) => a.startsWith("--socios="))?.split("=")[1]) || 60;
const N_CREDITOS = Number(process.argv.find((a) => a.startsWith("--creditos="))?.split("=")[1]) || 200;

const NOMBRES = ["María", "José", "Juana", "Pedro", "Rosa", "Diego", "Elena", "Carlos", "Ana", "Miguel", "Lucía", "Manuel", "Carmen", "Francisco", "Juan"];
const APELLIDOS = ["Xicay", "Us", "Bernal", "Ramírez", "Chocoj", "Coc", "Ajpop", "Poou", "Tzunun", "Sicay", "Tum", "Mendoza", "Say", "Ixchop", "Batz"];

function elegir<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
function entero(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function fechaHace(diasAtras: number): string {
  const d = new Date();
  d.setDate(d.getDate() - diasAtras);
  return d.toISOString().slice(0, 10);
}

async function limpiarCorridaAnterior() {
  const { rows: socios } = await pool.query(`select id from socios where nombres like '%' || $1 || '%'`, [MARCADOR]);
  if (socios.length === 0) return;
  const ids = socios.map((s) => s.id);
  const { rows: prestamos } = await pool.query(`select id from prestamos where socio_id = any($1)`, [ids]);
  const prestamoIds = prestamos.map((p) => p.id);
  const { rows: cuentas } = await pool.query(`select id from cuentas where socio_id = any($1)`, [ids]);
  const cuentaIds = cuentas.map((c) => c.id);

  await pool.query(`delete from prestamo_pagos where prestamo_id = any($1)`, [prestamoIds]);
  await pool.query(`delete from movimientos where cuenta_id = any($1)`, [cuentaIds]);
  await pool.query(`delete from cuentas where id = any($1)`, [cuentaIds]);
  await pool.query(`delete from prestamos where id = any($1)`, [prestamoIds]);
  await pool.query(`delete from socios where id = any($1)`, [ids]);
  console.log(`Corrida anterior de carga limpiada: ${ids.length} socios y su actividad ligada.`);
}

async function main() {
  const t0 = Date.now();
  const { rows: agRows } = await pool.query(`select * from agencias where codigo = 'CHAJUL'`);
  const agencia = agRows[0];
  if (!agencia) throw new Error("No existe la agencia CHAJUL. Corre primero: npm run db:seed");

  const { rows: usuarios } = await pool.query(
    `select * from usuarios where email in ('admin@mif.coop','cajero@mif.coop')`,
  );
  const admin = usuarios.find((u) => u.email === "admin@mif.coop");
  const cajero = usuarios.find((u) => u.email === "cajero@mif.coop");
  if (!admin || !cajero) throw new Error("Faltan usuarios base. Corre primero: npm run db:seed");

  await limpiarCorridaAnterior();

  // ---------------------------------------------------------------------
  // Socios en bloque (numeración continuando desde el máximo real actual).
  // ---------------------------------------------------------------------
  const { rows: maxSocioRows } = await pool.query(
    `select coalesce(max(nullif(regexp_replace(numero_asociado, '\\D', '', 'g'), '')::int), 0) as max_num
     from socios where agencia_id = $1`,
    [agencia.id],
  );
  let siguienteNumSocio = maxSocioRows[0].max_num + 1;

  const socioIds: string[] = [];
  const sociosRows = [];
  for (let i = 0; i < N_SOCIOS; i++) {
    const numeroAsociado = `${agencia.codigo}-${String(siguienteNumSocio + i).padStart(4, "0")}`;
    const nombres = `${elegir(NOMBRES)} ${elegir(APELLIDOS)} ${elegir(APELLIDOS)} ${MARCADOR}`;
    const dpi = `19${String(2000000 + i).padStart(11, "0")}`;
    sociosRows.push({ numeroAsociado, nombres, dpi, fechaIngreso: fechaHace(entero(30, 400)) });
  }

  const { rows: sociosInsertados } = await pool.query(
    `insert into socios (numero_asociado, agencia_id, nombres, fecha_ingreso, dpi, creado_por_id)
     select * from unnest($1::text[], $2::uuid[], $3::text[], $4::date[], $5::text[], $6::uuid[])
     returning id`,
    [
      sociosRows.map((s) => s.numeroAsociado),
      sociosRows.map(() => agencia.id),
      sociosRows.map((s) => s.nombres),
      sociosRows.map((s) => s.fechaIngreso),
      sociosRows.map((s) => s.dpi),
      sociosRows.map(() => admin.id),
    ],
  );
  sociosInsertados.forEach((r) => socioIds.push(r.id));
  console.log(`Socios creados: ${socioIds.length}`);

  // Cuenta de APORTACION (Q100) para cada uno, en bloque.
  await pool.query(
    `insert into cuentas (numero_cuenta, tipo, estado, socio_id, agencia_id, saldo_inicial, creado_por_id)
     select $1 || '-APOR-' || row_number() over (), 'APORTACION', 'ACTIVA', s, $2, 100, $3
     from unnest($4::uuid[]) as s`,
    [agencia.codigo, agencia.id, admin.id, socioIds],
  );

  // ---------------------------------------------------------------------
  // Créditos en bloque: mezcla de estados y fechas repartidas en el último año.
  // ---------------------------------------------------------------------
  const { rows: maxCreditoRows } = await pool.query(
    `select coalesce(max(nullif(regexp_replace(codigo, '\\D', '', 'g'), '')::int), 0) as max_num
     from prestamos where agencia_id = $1`,
    [agencia.id],
  );
  let siguienteNumCredito = maxCreditoRows[0].max_num + 1;

  type CreditoRow = {
    id: string;
    codigo: string;
    socioId: string;
    estado: string;
    montoAprobado: number;
    saldoCapital: number;
    plazoMeses: number;
    fechaDesembolso: string | null;
  };
  const creditos: CreditoRow[] = [];
  const codigos: string[] = [];
  const socioIdsCred: string[] = [];
  const tipos: string[] = [];
  const estados: string[] = [];
  const tipoAmorts: string[] = [];
  const montoSolicitados: number[] = [];
  const montoAprobados: (number | null)[] = [];
  const tasas: number[] = [];
  const plazos: number[] = [];
  const cuotas: number[] = [];
  const fechasSolicitud: string[] = [];
  const fechasAprobacion: (string | null)[] = [];
  const fechasDesembolso: (string | null)[] = [];
  const saldosCapital: (number | null)[] = [];

  for (let i = 0; i < N_CREDITOS; i++) {
    const codigo = `${agencia.codigo}-CR-${String(siguienteNumCredito + i).padStart(4, "0")}`;
    const socioId = elegir(socioIds);
    const monto = entero(1000, 50000);
    const plazoMeses = elegir([6, 12, 18, 24, 36]);
    const tasa = 2.0;
    const i2 = tasa / 100;
    const cuota = Math.round((monto * ((i2 * Math.pow(1 + i2, plazoMeses)) / (Math.pow(1 + i2, plazoMeses) - 1))) * 100) / 100;

    const r = Math.random();
    const estado = r < 0.7 ? "DESEMBOLSADO" : r < 0.9 ? "APROBADO" : "CANCELADO";
    const diasSolicitud = entero(5, 365);
    const fechaSolicitud = fechaHace(diasSolicitud);
    const fechaAprobacion = estado === "APROBADO" || estado === "DESEMBOLSADO" || estado === "CANCELADO" ? fechaHace(diasSolicitud - 1) : null;
    const fechaDesembolso = estado === "DESEMBOLSADO" || estado === "CANCELADO" ? fechaHace(Math.max(0, diasSolicitud - 3)) : null;

    let saldoCapital: number | null = null;
    if (estado === "DESEMBOLSADO") {
      const pctPagado = Math.random() * 0.6; // hasta 60% pagado
      saldoCapital = Math.round(monto * (1 - pctPagado) * 100) / 100;
    } else if (estado === "CANCELADO") {
      saldoCapital = 0;
    }

    codigos.push(codigo);
    socioIdsCred.push(socioId);
    tipos.push(Math.random() < 0.85 ? "FIDUCIARIO" : "HIPOTECARIO");
    estados.push(estado);
    tipoAmorts.push("CUOTA_NIVELADA");
    montoSolicitados.push(monto);
    montoAprobados.push(monto);
    tasas.push(tasa);
    plazos.push(plazoMeses);
    cuotas.push(cuota);
    fechasSolicitud.push(fechaSolicitud);
    fechasAprobacion.push(fechaAprobacion);
    fechasDesembolso.push(fechaDesembolso);
    saldosCapital.push(saldoCapital);

    creditos.push({ id: "", codigo, socioId, estado, montoAprobado: monto, saldoCapital: saldoCapital ?? 0, plazoMeses, fechaDesembolso });
  }

  const { rows: creditosInsertados } = await pool.query(
    `insert into prestamos (
       codigo, socio_id, agencia_id, tipo, estado, tipo_amortizacion,
       monto_solicitado, monto_aprobado, tasa_interes_mensual, plazo_meses, cuota_mensual,
       fecha_solicitud, fecha_aprobacion, fecha_desembolso, saldo_capital
     )
     select codigo, socio_id, $14, tipo::tipo_prestamo, estado::estado_prestamo, tipo_amort::tipo_amortizacion,
            monto_sol, monto_apr, $15, plazo, cuota,
            f_sol, f_apr, f_des, saldo_cap
     from unnest(
       $1::text[], $2::uuid[], $3::text[], $4::text[], $5::text[],
       $6::numeric[], $7::numeric[], $8::int[], $9::numeric[],
       $10::date[], $11::date[], $12::date[], $13::numeric[]
     ) as t(codigo, socio_id, tipo, estado, tipo_amort, monto_sol, monto_apr, plazo, cuota, f_sol, f_apr, f_des, saldo_cap)
     returning id, codigo`,
    [
      codigos,
      socioIdsCred,
      tipos,
      estados,
      tipoAmorts,
      montoSolicitados,
      montoAprobados,
      plazos,
      cuotas,
      fechasSolicitud,
      fechasAprobacion,
      fechasDesembolso,
      saldosCapital,
      agencia.id,
      tasas[0],
    ],
  );
  const idPorCodigo = new Map(creditosInsertados.map((r) => [r.codigo, r.id]));
  creditos.forEach((c) => (c.id = idPorCodigo.get(c.codigo)!));
  console.log(`Créditos creados: ${creditos.length} (${estados.filter((e) => e === "DESEMBOLSADO").length} desembolsados, ${estados.filter((e) => e === "APROBADO").length} aprobados, ${estados.filter((e) => e === "CANCELADO").length} cancelados)`);

  // ---------------------------------------------------------------------
  // Historial de pagos: 2-6 cobros por cada crédito desembolsado, spread
  // en los meses desde el desembolso hasta hoy.
  // ---------------------------------------------------------------------
  const pagoPrestamoId: string[] = [];
  const pagoSocioId: string[] = [];
  const pagoFecha: string[] = [];
  const pagoAbono: number[] = [];
  const pagoInteres: number[] = [];
  const pagoMora: number[] = [];
  const pagoTotal: number[] = [];
  const pagoSaldoRestante: number[] = [];
  const pagoUsuario: string[] = [];

  for (const c of creditos) {
    if (c.estado !== "DESEMBOLSADO" && c.estado !== "CANCELADO") continue;
    if (!c.fechaDesembolso) continue;
    const nPagos = entero(2, 6);
    let saldoSimulado = c.montoAprobado;
    const capitalPorPago = Math.round(((c.montoAprobado - c.saldoCapital) / nPagos) * 100) / 100;
    for (let k = 0; k < nPagos; k++) {
      const diasDesdeDesembolso = Math.floor((Date.now() - new Date(c.fechaDesembolso).getTime()) / 86400000);
      const diaPago = Math.max(1, Math.round(((k + 1) / nPagos) * diasDesdeDesembolso));
      const capital = Math.min(saldoSimulado, capitalPorPago);
      saldoSimulado = Math.max(0, Math.round((saldoSimulado - capital) * 100) / 100);
      const interes = Math.round(capital * 0.15 * 100) / 100;
      pagoPrestamoId.push(c.id);
      pagoSocioId.push(c.socioId);
      pagoFecha.push(fechaHace(Math.max(0, diasDesdeDesembolso - diaPago)));
      pagoAbono.push(capital);
      pagoInteres.push(interes);
      pagoMora.push(0);
      pagoTotal.push(Math.round((capital + interes) * 100) / 100);
      pagoSaldoRestante.push(saldoSimulado);
      pagoUsuario.push(cajero.id);
    }
  }

  if (pagoPrestamoId.length > 0) {
    await pool.query(
      `insert into prestamo_pagos (
         prestamo_id, socio_id, agencia_id, fecha, abono_capital, interes, mora,
         total_pagado, saldo_capital_restante, usuario_id
       )
       select * from unnest(
         $1::uuid[], $2::uuid[], $3::uuid[], $4::date[], $5::numeric[], $6::numeric[], $7::numeric[],
         $8::numeric[], $9::numeric[], $10::uuid[]
       )`,
      [
        pagoPrestamoId,
        pagoSocioId,
        pagoPrestamoId.map(() => agencia.id),
        pagoFecha,
        pagoAbono,
        pagoInteres,
        pagoMora,
        pagoTotal,
        pagoSaldoRestante,
        pagoUsuario,
      ],
    );
  }
  console.log(`Pagos históricos creados: ${pagoPrestamoId.length}`);

  const ms = Date.now() - t0;
  console.log(`\nCarga completa en ${ms}ms: ${socioIds.length} socios, ${creditos.length} créditos, ${pagoPrestamoId.length} pagos.`);
  await pool.end();
}

main().catch((err) => {
  console.error("Falló el seed de carga:", err);
  process.exit(1);
});
