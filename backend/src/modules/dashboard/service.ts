import { pool } from "../../db/pool";

// Resumen para el tablero del jefe de agencia: saldo de caja chica y saldo
// total de cada tipo de ahorro, por agencia. Si agenciaId es null (Admin o
// Gerencia), se calcula para todas las agencias visibles.
export async function resumen(agenciaId: string | null) {
  const filtroAgencia = agenciaId ? "where a.id = $1" : "";
  const valores = agenciaId ? [agenciaId] : [];

  const { rows: agencias } = await pool.query(
    `select a.id, a.nombre, a.codigo from agencias a ${filtroAgencia} order by a.nombre`,
    valores,
  );

  const { rows: cajaChica } = await pool.query(
    `select agencia_id,
            coalesce(sum(case when tipo = 'INGRESO' then monto else 0 end), 0)
              - coalesce(sum(case when tipo = 'EGRESO' then monto else 0 end), 0) as saldo
     from caja_chica_comprobantes
     group by agencia_id`,
  );

  const { rows: ahorros } = await pool.query(
    `select c.agencia_id, c.tipo,
            count(*)::int as total_cuentas,
            coalesce(sum(coalesce(sc.saldo_actual, c.saldo_inicial)), 0) as saldo_total
     from cuentas c
     left join saldos_cuenta sc on sc.cuenta_id = c.id
     where c.tipo in ('AHORRO_CORRIENTE', 'AHORRO_PROGRAMADO', 'AHORRO_INFANTO_JUVENIL')
     group by c.agencia_id, c.tipo`,
  );

  const { rows: socios } = await pool.query(
    `select agencia_id, count(*)::int as total from socios where estado = 'ACTIVO' group by agencia_id`,
  );

  const { rows: movimientosHoy } = await pool.query(
    `select cu.agencia_id, count(*)::int as total
     from movimientos m join cuentas cu on cu.id = m.cuenta_id
     where m.fecha = current_date
     group by cu.agencia_id`,
  );

  const mapaCajaChica = new Map(cajaChica.map((r) => [r.agencia_id, Number(r.saldo)]));
  const mapaSocios = new Map(socios.map((r) => [r.agencia_id, r.total]));
  const mapaMovHoy = new Map(movimientosHoy.map((r) => [r.agencia_id, r.total]));

  const porAgencia = agencias.map((ag) => {
    const ahorrosAgencia = ahorros.filter((a) => a.agencia_id === ag.id);
    const porTipo = (tipo: string) => {
      const fila = ahorrosAgencia.find((a) => a.tipo === tipo);
      return { totalCuentas: fila?.total_cuentas ?? 0, saldoTotal: Number(fila?.saldo_total ?? 0) };
    };
    return {
      agenciaId: ag.id,
      agenciaNombre: ag.nombre,
      agenciaCodigo: ag.codigo,
      cajaChica: { saldo: mapaCajaChica.get(ag.id) ?? 0 },
      ahorroCorriente: porTipo("AHORRO_CORRIENTE"),
      ahorroProgramado: porTipo("AHORRO_PROGRAMADO"),
      ahorroInfantoJuvenil: porTipo("AHORRO_INFANTO_JUVENIL"),
      totalSocios: mapaSocios.get(ag.id) ?? 0,
      movimientosHoy: mapaMovHoy.get(ag.id) ?? 0,
    };
  });

  const global = porAgencia.reduce(
    (acc, a) => ({
      cajaChica: acc.cajaChica + a.cajaChica.saldo,
      ahorroCorriente: acc.ahorroCorriente + a.ahorroCorriente.saldoTotal,
      ahorroProgramado: acc.ahorroProgramado + a.ahorroProgramado.saldoTotal,
      ahorroInfantoJuvenil: acc.ahorroInfantoJuvenil + a.ahorroInfantoJuvenil.saldoTotal,
      totalSocios: acc.totalSocios + a.totalSocios,
      movimientosHoy: acc.movimientosHoy + a.movimientosHoy,
    }),
    { cajaChica: 0, ahorroCorriente: 0, ahorroProgramado: 0, ahorroInfantoJuvenil: 0, totalSocios: 0, movimientosHoy: 0 },
  );

  return { global, porAgencia };
}
