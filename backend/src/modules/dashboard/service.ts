import { queryWithRetry } from "../../db/pool";

// Resumen para el tablero del jefe de agencia: saldo de caja chica y saldo
// total de cada tipo de ahorro, por agencia. Si agenciaId es null (Admin o
// Gerencia), se calcula para todas las agencias visibles.
// Las queries se ejecutan de forma SECUENCIAL (no en paralelo) para no saturar
// el Transaction Pooler de Supabase (plan gratuito: máx ~10 conexiones).
export async function resumen(agenciaId: string | null) {
  const filtroAgencia = agenciaId ? "where a.id = $1" : "";
  const valores = agenciaId ? [agenciaId] : [];

  const { rows: agencias } = await queryWithRetry(
    `select a.id, a.nombre, a.codigo from agencias a ${filtroAgencia} order by a.nombre`,
    valores,
  );

  const { rows: cajaChica } = await queryWithRetry(
    `select agencia_id,
            coalesce(sum(case when tipo = 'INGRESO' then monto else 0 end), 0)
              - coalesce(sum(case when tipo = 'EGRESO' then monto else 0 end), 0) as saldo
     from caja_chica_comprobantes
     group by agencia_id`,
  );

  const { rows: ahorros } = await queryWithRetry(
    `select c.agencia_id, c.tipo,
            count(*)::int as total_cuentas,
            coalesce(sum(coalesce(sc.saldo_actual, c.saldo_inicial)), 0) as saldo_total
     from cuentas c
     left join saldos_cuenta sc on sc.cuenta_id = c.id
     where c.tipo in ('AHORRO_CORRIENTE', 'AHORRO_PROGRAMADO', 'AHORRO_INFANTO_JUVENIL')
     group by c.agencia_id, c.tipo`,
  );

  const { rows: socios } = await queryWithRetry(
    `select agencia_id, count(*)::int as total from socios where estado = 'ACTIVO' group by agencia_id`,
  );

  const { rows: movimientosHoy } = await queryWithRetry(
    `select cu.agencia_id, count(*)::int as total
     from movimientos m join cuentas cu on cu.id = m.cuenta_id
     where m.fecha = current_date
     group by cu.agencia_id`,
  );

  const { rows: prestamos } = await queryWithRetry(
    `select p.agencia_id,
            count(*)::int as total_prestamos,
            coalesce(sum(coalesce(p.saldo_capital, p.monto_aprobado)), 0)::numeric(14,2) as saldo_total
     from prestamos p
     where p.estado in ('DESEMBOLSADO', 'APROBADO')
     group by p.agencia_id`,
  );

  const { rows: plazoFijo } = await queryWithRetry(
    `select c.agencia_id,
            count(*)::int as total_certificados,
            coalesce(sum(pf.monto_deposito), 0)::numeric(14,2) as monto_total
     from plazo_fijo_contratos pf
     join cuentas c on c.id = pf.cuenta_id
     group by c.agencia_id`,
  );

  const { rows: aportaciones } = await queryWithRetry(
    `select c.agencia_id,
            count(*)::int as total_aportantes,
            coalesce(sum(coalesce(sc.saldo_actual, c.saldo_inicial)), 0)::numeric(14,2) as saldo_total
     from cuentas c
     left join saldos_cuenta sc on sc.cuenta_id = c.id
     where c.tipo = 'APORTACION'
     group by c.agencia_id`,
  );

  const { rows: cuotasIngresoRows } = await queryWithRetry(
    `select agencia_id,
            count(*)::int as total_cuotas,
            coalesce(sum(monto), 0)::numeric(14,2) as monto_total
     from caja_movimientos_auxiliar
     where categoria = 'INGRESO_ASOCIADO'
     group by agencia_id`,
  );

  const mapaCajaChica = new Map(cajaChica.map((r) => [r.agencia_id, Number(r.saldo)]));
  const mapaSocios = new Map(socios.map((r) => [r.agencia_id, r.total]));
  const mapaMovHoy = new Map(movimientosHoy.map((r) => [r.agencia_id, r.total]));
  const mapaPrestamos = new Map(prestamos.map((r) => [r.agencia_id, { count: r.total_prestamos, saldo: Number(r.saldo_total) }]));
  const mapaPlazoFijo = new Map(plazoFijo.map((r) => [r.agencia_id, { count: r.total_certificados, monto: Number(r.monto_total) }]));
  const mapaAportaciones = new Map(aportaciones.map((r) => [r.agencia_id, { count: r.total_aportantes, saldo: Number(r.saldo_total) }]));
  const mapaCuotasIngreso = new Map(cuotasIngresoRows.map((r) => [r.agencia_id, { count: r.total_cuotas, monto: Number(r.monto_total) }]));

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
      carteraPrestamos: mapaPrestamos.get(ag.id) ?? { count: 0, saldo: 0 },
      plazoFijo: mapaPlazoFijo.get(ag.id) ?? { count: 0, monto: 0 },
      aportaciones: mapaAportaciones.get(ag.id) ?? { count: 0, saldo: 0 },
      cuotasIngreso: mapaCuotasIngreso.get(ag.id) ?? { count: 0, monto: 0 },
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
      carteraPrestamos: {
        count: acc.carteraPrestamos.count + a.carteraPrestamos.count,
        saldo: acc.carteraPrestamos.saldo + a.carteraPrestamos.saldo,
      },
      plazoFijo: {
        count: acc.plazoFijo.count + a.plazoFijo.count,
        monto: acc.plazoFijo.monto + a.plazoFijo.monto,
      },
      aportaciones: {
        count: acc.aportaciones.count + a.aportaciones.count,
        saldo: acc.aportaciones.saldo + a.aportaciones.saldo,
      },
      cuotasIngreso: {
        count: acc.cuotasIngreso.count + a.cuotasIngreso.count,
        monto: acc.cuotasIngreso.monto + a.cuotasIngreso.monto,
      },
      totalSocios: acc.totalSocios + a.totalSocios,
      movimientosHoy: acc.movimientosHoy + a.movimientosHoy,
    }),
    {
      cajaChica: 0,
      ahorroCorriente: 0,
      ahorroProgramado: 0,
      ahorroInfantoJuvenil: 0,
      carteraPrestamos: { count: 0, saldo: 0 },
      plazoFijo: { count: 0, monto: 0 },
      aportaciones: { count: 0, saldo: 0 },
      cuotasIngreso: { count: 0, monto: 0 },
      totalSocios: 0,
      movimientosHoy: 0,
    },
  );

  return { global, porAgencia };
}
