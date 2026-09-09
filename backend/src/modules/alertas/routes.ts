import { Router } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { requireAuth } from "../../middleware/auth";
import { agenciaVisible } from "../../middleware/auth";
import { pool } from "../../db/pool";

export const alertasRouter = Router();
alertasRouter.use(requireAuth);

alertasRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const agId = agenciaVisible(req) ?? (req.query.agenciaId as string) ?? null;
    const diasVencimiento = Number(req.query.diasVencimiento) || 30;

    const [plazoFijoVenciendo, creditosMora, creditosVencimiento] = await Promise.all([
      // 1. Plazo fijo venciendo pronto
      pool.query(
        `select pf.id as contrato_id, pf.fecha_vencimiento, pf.monto_deposito, pf.saldo_liquido_a_pagar,
                c.numero_cuenta, s.nombres as socio_nombres, s.numero_asociado, s.telefono as socio_telefono,
                a.nombre as agencia_nombre,
                (pf.fecha_vencimiento - current_date)::int as dias_para_vencimiento
         from plazo_fijo_contratos pf
         join cuentas c on c.id = pf.cuenta_id
         join socios s on s.id = c.socio_id
         join agencias a on a.id = c.agencia_id
         where pf.estado = 'ACTIVO'
           and pf.fecha_vencimiento between current_date and (current_date + ($1 * interval '1 day')::interval)
           and ($2::uuid is null or c.agencia_id = $2)
         order by pf.fecha_vencimiento asc`,
        [diasVencimiento, agId],
      ),

      // 2. Créditos en mora (> 34 días sin pago: 30 días + 4 de gracia)
      pool.query(
        `select p.id, p.codigo, p.tipo, p.saldo_capital, p.cuota_mensual,
                s.nombres as socio_nombres, s.numero_asociado, s.telefono as socio_telefono,
                u.nombre as promotor_nombre,
                a.nombre as agencia_nombre,
                coalesce(lp.fecha, p.fecha_ultimo_pago_migracion, p.fecha_desembolso) as fecha_referencia,
                (current_date - coalesce(lp.fecha, p.fecha_ultimo_pago_migracion, p.fecha_desembolso)::date)::int as dias_sin_pago
         from prestamos p
         join socios s on s.id = p.socio_id
         join agencias a on a.id = p.agencia_id
         left join usuarios u on u.id = p.promotor_id
         left join lateral (
           select fecha from prestamo_pagos pp where pp.prestamo_id = p.id
           order by fecha desc, created_at desc limit 1
         ) lp on true
         where p.estado = 'DESEMBOLSADO' and p.saldo_capital > 0
           and (current_date - coalesce(lp.fecha, p.fecha_ultimo_pago_migracion, p.fecha_desembolso)::date) > 34
           and ($1::uuid is null or p.agencia_id = $1)
         order by dias_sin_pago desc
         limit 50`,
        [agId],
      ),

      // 3. Créditos próximos a vencer (fecha_vencimiento en los próximos N días)
      pool.query(
        `select p.id, p.codigo, p.tipo, p.saldo_capital, p.fecha_vencimiento,
                s.nombres as socio_nombres, s.numero_asociado, s.telefono as socio_telefono,
                a.nombre as agencia_nombre,
                (p.fecha_vencimiento - current_date)::int as dias_para_vencimiento
         from prestamos p
         join socios s on s.id = p.socio_id
         join agencias a on a.id = p.agencia_id
         where p.estado = 'DESEMBOLSADO' and p.saldo_capital > 0
           and p.fecha_vencimiento is not null
           and p.fecha_vencimiento between current_date and (current_date + ($1 * interval '1 day')::interval)
           and ($2::uuid is null or p.agencia_id = $2)
         order by p.fecha_vencimiento asc
         limit 20`,
        [diasVencimiento, agId],
      ),
    ]);

    const total =
      (plazoFijoVenciendo.rowCount ?? 0) +
      (creditosMora.rowCount ?? 0) +
      (creditosVencimiento.rowCount ?? 0);

    res.json({
      total,
      plazoFijoVenciendo: plazoFijoVenciendo.rows,
      creditosMora: creditosMora.rows,
      creditosVencimiento: creditosVencimiento.rows,
    });
  }),
);
