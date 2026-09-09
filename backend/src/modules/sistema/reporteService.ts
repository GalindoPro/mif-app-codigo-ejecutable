import { pool } from "../../db/pool";

export async function generarReporteRegulatorio(params: {
  agenciaId: string | null;
  fechaCorte?: string;
}) {
  const fechaCorte = params.fechaCorte || new Date().toISOString().slice(0, 10);
  const anio = fechaCorte.slice(0, 4);
  const agId = params.agenciaId;

  const [socios, cartera, mora, captaciones, plazoFijo, aportaciones, cobranzaAnual] =
    await Promise.all([

      // 1. Socios por estado
      pool.query(
        `select estado, count(*)::int as total
         from socios
         where ($1::uuid is null or agencia_id = $1)
         group by estado`,
        [agId],
      ),

      // 2. Cartera de créditos: colocado, saldo y distribución por tipo/estado
      pool.query(
        `select tipo, estado,
                count(*)::int as total_creditos,
                coalesce(sum(monto_aprobado), 0)::numeric as total_colocado,
                coalesce(sum(coalesce(saldo_capital, monto_aprobado, monto_solicitado)), 0)::numeric as saldo_total
         from prestamos
         where ($1::uuid is null or agencia_id = $1)
         group by tipo, estado
         order by tipo, estado`,
        [agId],
      ),

      // 3. Mora aproximada (créditos activos con > 30 días sin pago)
      pool.query(
        `select p.tipo,
                count(*)::int as creditos_en_mora,
                coalesce(sum(coalesce(p.saldo_capital, p.monto_aprobado)), 0)::numeric as saldo_en_mora
         from prestamos p
         left join lateral (
           select fecha from prestamo_pagos pp
           where pp.prestamo_id = p.id
           order by fecha desc limit 1
         ) lp on true
         where p.estado = 'DESEMBOLSADO'
           and ($1::uuid is null or p.agencia_id = $1)
           and coalesce(lp.fecha, p.fecha_desembolso, p.fecha_solicitud) < (current_date - interval '30 days')
         group by p.tipo`,
        [agId],
      ),

      // 4. Captaciones de ahorro por tipo (excluye plazo fijo)
      pool.query(
        `select c.tipo,
                count(distinct c.id)::int as total_cuentas,
                coalesce(sum(coalesce(sc.saldo_actual, c.saldo_inicial, 0)), 0)::numeric as saldo_total
         from cuentas c
         left join saldos_cuenta sc on sc.cuenta_id = c.id
         where c.tipo not in ('AHORRO_PLAZO_FIJO','APORTACION') and c.estado = 'ACTIVA'
           and ($1::uuid is null or c.agencia_id = $1)
         group by c.tipo
         order by c.tipo`,
        [agId],
      ),

      // 5. Plazo fijo
      pool.query(
        `select pf.estado,
                count(*)::int as total_contratos,
                coalesce(sum(pf.monto_deposito), 0)::numeric as total_deposito,
                coalesce(sum(pf.saldo_liquido_a_pagar), 0)::numeric as total_a_pagar
         from plazo_fijo_contratos pf
         join cuentas c on c.id = pf.cuenta_id
         where ($1::uuid is null or c.agencia_id = $1)
         group by pf.estado`,
        [agId],
      ),

      // 6. Aportaciones
      pool.query(
        `select count(distinct s.id)::int as total_socios,
                coalesce(sum(coalesce(sc.saldo_actual, c.saldo_inicial, 0)), 0)::numeric as total_aportaciones
         from cuentas c
         join socios s on s.id = c.socio_id
         left join saldos_cuenta sc on sc.cuenta_id = c.id
         where c.tipo = 'APORTACION' and c.estado = 'ACTIVA'
           and ($1::uuid is null or c.agencia_id = $1)`,
        [agId],
      ),

      // 7. Cobranza del año (capital, intereses, mora recuperados)
      pool.query(
        `select
                coalesce(sum(abono_capital), 0)::numeric as capital_recuperado,
                coalesce(sum(interes), 0)::numeric as intereses_cobrados,
                coalesce(sum(mora), 0)::numeric as mora_cobrada,
                count(*)::int as total_operaciones
         from prestamo_pagos pp
         where extract(year from fecha) = $1::int
           and ($2::uuid is null or pp.agencia_id = $2)`,
        [Number(anio), agId],
      ),
    ]);

  return {
    metadata: {
      fechaCorte,
      anio: Number(anio),
      agenciaId: agId,
      generadoEn: new Date().toISOString(),
      formato: "MICOOPE-MIF-v1",
    },
    socios: {
      detalle: socios.rows,
      totalActivos: socios.rows.find((r) => r.estado === "ACTIVO")?.total ?? 0,
      totalInactivos: socios.rows.find((r) => r.estado === "INACTIVO")?.total ?? 0,
    },
    carteraCrediticia: {
      detalle: cartera.rows,
      totalColocado: cartera.rows.reduce((a, r) => a + Number(r.total_colocado), 0),
      saldoVigente: cartera.rows
        .filter((r) => r.estado === "DESEMBOLSADO")
        .reduce((a, r) => a + Number(r.saldo_total), 0),
    },
    mora: {
      detalle: mora.rows,
      totalCreditosEnMora: mora.rows.reduce((a, r) => a + r.creditos_en_mora, 0),
      saldoEnMora: mora.rows.reduce((a, r) => a + Number(r.saldo_en_mora), 0),
    },
    captacionesAhorro: {
      detalle: captaciones.rows,
      totalSaldo: captaciones.rows.reduce((a, r) => a + Number(r.saldo_total), 0),
    },
    plazoFijo: {
      detalle: plazoFijo.rows,
      totalActivos: plazoFijo.rows.find((r) => r.estado === "ACTIVO")?.total_contratos ?? 0,
      totalDeposito: plazoFijo.rows
        .filter((r) => r.estado === "ACTIVO")
        .reduce((a, r) => a + Number(r.total_deposito), 0),
    },
    aportaciones: {
      totalSocios: Number(aportaciones.rows[0]?.total_socios ?? 0),
      totalAportaciones: Number(aportaciones.rows[0]?.total_aportaciones ?? 0),
    },
    cobranzaAnual: {
      capitalRecuperado: Number(cobranzaAnual.rows[0]?.capital_recuperado ?? 0),
      interesesCobrados: Number(cobranzaAnual.rows[0]?.intereses_cobrados ?? 0),
      moraCobrada: Number(cobranzaAnual.rows[0]?.mora_cobrada ?? 0),
      totalOperaciones: cobranzaAnual.rows[0]?.total_operaciones ?? 0,
    },
  };
}
