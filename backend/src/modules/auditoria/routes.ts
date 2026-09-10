import { Router } from "express";
import { pool } from "../../db/pool";
import { requireAuth, requireRole } from "../../middleware/auth";
import { asyncHandler } from "../../utils/asyncHandler";

export const auditoriaRouter = Router();

auditoriaRouter.use(requireAuth);
auditoriaRouter.use(requireRole("ADMIN", "GERENCIA", "SUPERVISOR"));

// Listar tipos de entidades registradas en la bitácora
auditoriaRouter.get(
  "/entidades",
  asyncHandler(async (_req, res) => {
    const { rows } = await pool.query<{ entidad: string }>(
      `SELECT DISTINCT entidad FROM auditoria ORDER BY entidad ASC`
    );
    res.json(rows.map((r) => r.entidad));
  })
);

// Consulta paginada con filtros avanzados
auditoriaRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const page = Math.max(1, Number(req.query.page) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(req.query.pageSize) || 25));
    const offset = (page - 1) * pageSize;

    const { q, entidad, accion, desde, hasta } = req.query;

    const conditions: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    if (q && typeof q === "string" && q.trim()) {
      const term = `%${q.trim()}%`;
      conditions.push(`(u.nombre ILIKE $${idx} OR a.entidad ILIKE $${idx} OR CAST(a.entidad_id AS TEXT) ILIKE $${idx})`);
      values.push(term);
      idx++;
    }

    if (entidad && typeof entidad === "string" && entidad.trim()) {
      conditions.push(`a.entidad = $${idx}`);
      values.push(entidad.trim());
      idx++;
    }

    if (accion && typeof accion === "string" && accion.trim()) {
      conditions.push(`a.accion = $${idx}`);
      values.push(accion.trim());
      idx++;
    }

    if (desde && typeof desde === "string" && desde.trim()) {
      conditions.push(`a.fecha >= $${idx}`);
      values.push(`${desde.trim()} 00:00:00`);
      idx++;
    }

    if (hasta && typeof hasta === "string" && hasta.trim()) {
      conditions.push(`a.fecha <= $${idx}`);
      values.push(`${hasta.trim()} 23:59:59`);
      idx++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    // Total conteo
    const countSql = `
      SELECT COUNT(*)::int AS total
      FROM auditoria a
      LEFT JOIN usuarios u ON u.id = a.usuario_id
      ${whereClause}
    `;
    try {
      const countRes = await pool.query<{ total: number }>(countSql, values);
      const total = countRes.rows[0]?.total ?? 0;

      const dataSql = `
        SELECT
          a.id,
          a.entidad,
          a.entidad_id,
          a.accion,
          a.datos_anteriores,
          a.datos_nuevos,
          a.fecha,
          COALESCE(u.nombre, 'Sistema / Automático') AS usuario_nombre,
          COALESCE(u.rol::text, 'ADMIN') AS usuario_rol
        FROM auditoria a
        LEFT JOIN usuarios u ON u.id = a.usuario_id
        ${whereClause}
        ORDER BY a.fecha DESC
        LIMIT $${idx} OFFSET $${idx + 1}
      `;
      const dataRes = await pool.query(dataSql, [...values, pageSize, offset]);

      res.json({
        data: dataRes.rows,
        total,
        page,
        pageSize,
      });
    } catch (err) {
      console.error("ERROR EN AUDITORIA GET:", err);
      throw err;
    }
  })
);
