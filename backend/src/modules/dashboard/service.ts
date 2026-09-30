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
     join socios s on s.id = c.socio_id
     where c.tipo in ('AHORRO_CORRIENTE', 'AHORRO_PROGRAMADO', 'AHORRO_INFANTO_JUVENIL')
       and s.fecha_ingreso >= '2026-01-01'
     group by c.agencia_id, c.tipo`,
  );

  const { rows: socios } = await queryWithRetry(
    `select agencia_id, 
            count(*)::int as total,
            count(*) filter (where exists (select 1 from cuentas where socio_id = socios.id and estado = 'ACTIVA'))::int as con_cuentas,
            count(*) filter (where not exists (select 1 from cuentas where socio_id = socios.id and estado = 'ACTIVA') and exists (select 1 from prestamos where socio_id = socios.id and estado = 'DESEMBOLSADO' and saldo_capital > 0))::int as solo_creditos,
            count(*) filter (where not exists (select 1 from cuentas where socio_id = socios.id and estado = 'ACTIVA') and not exists (select 1 from prestamos where socio_id = socios.id and estado = 'DESEMBOLSADO' and saldo_capital > 0))::int as sin_productos
     from socios 
     where estado = 'ACTIVO' and fecha_ingreso >= '2026-01-01' 
     group by agencia_id`,
  );

  const { rows: movimientosHoy } = await queryWithRetry(
    `select cu.agencia_id, count(*)::int as total
     from movimientos m 
     join cuentas cu on cu.id = m.cuenta_id
     join socios s on s.id = cu.socio_id
     where m.fecha = current_date
       and s.fecha_ingreso >= '2026-01-01'
     group by cu.agencia_id`,
  );

  const { rows: prestamos } = await queryWithRetry(
    `select p.agencia_id,
            count(*)::int as total_prestamos,
            coalesce(sum(coalesce(p.saldo_capital, p.monto_aprobado)), 0)::numeric(14,2) as saldo_total
     from prestamos p
     join socios s on s.id = p.socio_id
     where p.estado in ('DESEMBOLSADO', 'APROBADO')
       and s.fecha_ingreso >= '2026-01-01'
     group by p.agencia_id`,
  );

  const { rows: plazoFijo } = await queryWithRetry(
    `select c.agencia_id,
            count(*)::int as total_certificados,
            coalesce(sum(pf.monto_deposito), 0)::numeric(14,2) as monto_total
     from plazo_fijo_contratos pf
     join cuentas c on c.id = pf.cuenta_id
     join socios s on s.id = c.socio_id
     where s.fecha_ingreso >= '2026-01-01' and pf.estado = 'ACTIVO'
     group by c.agencia_id`,
  );

  const { rows: aportaciones } = await queryWithRetry(
    `select c.agencia_id,
            count(*)::int as total_aportantes,
            coalesce(sum(coalesce(sc.saldo_actual, c.saldo_inicial)), 0)::numeric(14,2) as saldo_total
     from cuentas c
     left join saldos_cuenta sc on sc.cuenta_id = c.id
     join socios s on s.id = c.socio_id
     where c.tipo = 'APORTACION'
       and s.fecha_ingreso >= '2026-01-01'
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
  const mapaSocios = new Map(socios.map((r) => [r.agencia_id, { total: r.total, conCuentas: r.con_cuentas, soloCreditos: r.solo_creditos, sinProductos: r.sin_productos }]));
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
      totalSocios: (mapaSocios.get(ag.id) as any)?.total ?? 0,
      sociosConCuentas: (mapaSocios.get(ag.id) as any)?.conCuentas ?? 0,
      sociosSoloCreditos: (mapaSocios.get(ag.id) as any)?.soloCreditos ?? 0,
      sociosSinProductos: (mapaSocios.get(ag.id) as any)?.sinProductos ?? 0,
      movimientosHoy: mapaMovHoy.get(ag.id) ?? 0,
    };
  });

  const global = porAgencia.reduce(
    (acc, a) => ({
      cajaChica: acc.cajaChica + a.cajaChica.saldo,
      ahorroCorriente: { count: acc.ahorroCorriente.count + a.ahorroCorriente.totalCuentas, saldo: acc.ahorroCorriente.saldo + a.ahorroCorriente.saldoTotal },
      ahorroProgramado: { count: acc.ahorroProgramado.count + a.ahorroProgramado.totalCuentas, saldo: acc.ahorroProgramado.saldo + a.ahorroProgramado.saldoTotal },
      ahorroInfantoJuvenil: { count: acc.ahorroInfantoJuvenil.count + a.ahorroInfantoJuvenil.totalCuentas, saldo: acc.ahorroInfantoJuvenil.saldo + a.ahorroInfantoJuvenil.saldoTotal },
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
      sociosConCuentas: (acc.sociosConCuentas || 0) + a.sociosConCuentas,
      sociosSoloCreditos: (acc.sociosSoloCreditos || 0) + a.sociosSoloCreditos,
      sociosSinProductos: (acc.sociosSinProductos || 0) + a.sociosSinProductos,
      movimientosHoy: acc.movimientosHoy + a.movimientosHoy,
    }),
    {
      cajaChica: 0,
      ahorroCorriente: { count: 0, saldo: 0 },
      ahorroProgramado: { count: 0, saldo: 0 },
      ahorroInfantoJuvenil: { count: 0, saldo: 0 },
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
