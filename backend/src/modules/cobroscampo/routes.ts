import { Router } from "express";
import { requireAuth, requireRole } from "../../middleware/auth";
import { pool } from "../../db/pool";
import { CobroCampo } from "../../types/models";

export const cobrosCampoRouter = Router();

// GET /api/cobros-campo/pendientes
// Obtiene la lista de cobros pendientes del promotor autenticado.
cobrosCampoRouter.get("/pendientes", requireAuth, requireRole("PROMOTOR"), async (req, res, next) => {
  try {
    const promotorId = req.user!.id;
    const { rows } = await pool.query<CobroCampo>(`
      select 
        c.*,
        s.nombres as socio_nombres,
        s.numero_asociado,
        p.codigo as prestamo_codigo
      from cobros_campo c
      join socios s on s.id = c.socio_id
      join prestamos p on p.id = c.prestamo_id
      where c.promotor_id = $1 and c.estado = 'PENDIENTE'
      order by c.created_at asc
    `, [promotorId]);
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

// POST /api/cobros-campo
// Registra un nuevo cobro de campo (solo Promotores)
cobrosCampoRouter.post("/", requireAuth, requireRole("PROMOTOR"), async (req, res, next) => {
  try {
    const { prestamo_id, socio_id, numero_recibo_fisico, monto, pago_capital, pago_interes, pago_mora, ahorro_prestamo } = req.body;
    const promotorId = req.user!.id;
    const agenciaId = req.user!.agenciaId;

    if (!agenciaId) {
      return res.status(400).json({ error: "El promotor no tiene agencia asignada" });
    }

    if (!prestamo_id || !socio_id || monto <= 0) {
      return res.status(400).json({ error: "Datos incompletos o monto inválido" });
    }

    const { rows } = await pool.query<CobroCampo>(`
      insert into cobros_campo 
        (promotor_id, agencia_id, socio_id, prestamo_id, numero_recibo_fisico, monto, pago_capital, pago_interes, pago_mora, ahorro_prestamo)
      values
        ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      returning *
    `, [promotorId, agenciaId, socio_id, prestamo_id, numero_recibo_fisico || "", monto, pago_capital || 0, pago_interes || 0, pago_mora || 0, ahorro_prestamo || 0]);

    res.status(201).json(rows[0]);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/cobros-campo/:id
// Permite editar un cobro pendiente (1 vez, con justificación obligatoria)
cobrosCampoRouter.patch("/:id", requireAuth, requireRole("PROMOTOR"), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { monto, justificacion_edicion, pago_capital, pago_interes, pago_mora, ahorro_prestamo } = req.body;
    const promotorId = req.user!.id;

    if (!justificacion_edicion || justificacion_edicion.trim().length < 5) {
      return res.status(400).json({ error: "Debe proveer una justificación clara de por qué edita este cobro." });
    }
    if (monto <= 0) {
      return res.status(400).json({ error: "El monto debe ser mayor a 0." });
    }

    // Verificar si se puede editar
    const { rows: current } = await pool.query<CobroCampo>(
      `select veces_editado, estado from cobros_campo where id = $1 and promotor_id = $2`, 
      [id, promotorId]
    );

    if (current.length === 0) return res.status(404).json({ error: "Cobro no encontrado." });
    if (current[0].estado !== "PENDIENTE") return res.status(400).json({ error: "El cobro ya fue liquidado y no se puede editar." });
    if (current[0].veces_editado >= 1) return res.status(400).json({ error: "Solo se permite 1 edición por cobro." });

    const { rows } = await pool.query<CobroCampo>(`
      update cobros_campo 
      set 
        monto = $1,
        justificacion_edicion = $2,
        pago_capital = $3,
        pago_interes = $4,
        pago_mora = $5,
        ahorro_prestamo = $6,
        veces_editado = veces_editado + 1,
        updated_at = now()
      where id = $7 and promotor_id = $8
      returning *
    `, [monto, justificacion_edicion, pago_capital || 0, pago_interes || 0, pago_mora || 0, ahorro_prestamo || 0, id, promotorId]);

    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/cobros-campo/:id
// Elimina un cobro pendiente.
cobrosCampoRouter.delete("/:id", requireAuth, requireRole("PROMOTOR"), async (req, res, next) => {
  try {
    const { id } = req.params;
    const promotorId = req.user!.id;

    const { rowCount } = await pool.query(`
      delete from cobros_campo 
      where id = $1 and promotor_id = $2 and estado = 'PENDIENTE'
    `, [id, promotorId]);

    if (rowCount === 0) {
      return res.status(400).json({ error: "No se pudo eliminar el cobro (no existe o ya fue liquidado)." });
    }

    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});
