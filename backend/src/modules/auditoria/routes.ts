import { Router } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { requireAuth, requireRole } from "../../middleware/auth";
import { pool } from "../../db/pool";

export const auditoriaRouter = Router();
auditoriaRouter.use(requireAuth);
auditoriaRouter.use(requireRole("ADMIN", "GERENCIA"));

auditoriaRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const page = Math.max(1, Number(req.query.page) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(req.query.pageSize) || 25));
    const offset = (page - 1) * pageSize;

    const condiciones: string[] = [];
    const valores: unknown[] = [];

    if (req.query.entidad) {
      valores.push(req.query.entidad as string);
      condiciones.push(`a.entidad = $${valores.length}`);
    }
    if (req.query.accion) {
      valores.push(req.query.accion as string);
      condiciones.push(`a.accion = $${valores.length}`);
    }
    if (req.query.usuarioId) {
      valores.push(req.query.usuarioId as string);
      condiciones.push(`a.usuario_id = $${valores.length}`);
    }
    if (req.query.desde) {
      valores.push(req.query.desde as string);
      condiciones.push(`a.fecha >= $${valores.length}::date`);
    }
    if (req.query.hasta) {
      valores.push(req.query.hasta as string);
      condiciones.push(`a.fecha < ($${valores.length}::date + interval '1 day')`);
    }
    if (req.query.q) {
      valores.push(`%${(req.query.q as string).toLowerCase()}%`);
      condiciones.push(`(lower(u.nombre) like $${valores.length} or lower(a.entidad) like $${valores.length})`);
    }

    const where = condiciones.length ? `where ${condiciones.join(" and ")}` : "";

    const baseQuery = `
      from auditoria a
      join usuarios u on u.id = a.usuario_id
      ${where}
    `;

    const [{ rows }, { rows: countRows }] = await Promise.all([
      pool.query(
        `select a.id, a.entidad, a.entidad_id, a.accion,
                a.datos_anteriores, a.datos_nuevos,
                a.fecha, u.nombre as usuario_nombre, u.rol as usuario_rol
         ${baseQuery}
         order by a.fecha desc
         limit $${valores.length + 1} offset $${valores.length + 2}`,
        [...valores, pageSize, offset],
      ),
      pool.query(`select count(*)::int as total ${baseQuery}`, valores),
    ]);

    res.json({ data: rows, total: countRows[0].total, page, pageSize });
  }),
);

auditoriaRouter.get(
  "/entidades",
  asyncHandler(async (_req, res) => {
    const { rows } = await pool.query(
      `select distinct entidad from auditoria order by entidad`,
    );
    res.json(rows.map((r) => r.entidad));
  }),
);
