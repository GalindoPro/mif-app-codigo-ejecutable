import { Router } from "express";
import { pool } from "../../db/pool";
import { requireAuth, requireRole } from "../../middleware/auth";
import { asyncHandler } from "../../utils/asyncHandler";

export const sesionesRouter = Router();

sesionesRouter.use(requireAuth);
sesionesRouter.use(requireRole("GERENCIA", "SUPERVISOR"));

sesionesRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    // Listar usuarios activos en el sistema y su última actividad en bitácora
    const { rows } = await pool.query<{
      id: string;
      nombre: string;
      email: string;
      rol: string;
      agencia_nombre: string | null;
      activo: boolean;
      ultima_accion: string | null;
      ultima_fecha: string | null;
      total_acciones: number;
    }>(`
      SELECT
        u.id,
        u.nombre,
        u.email,
        u.rol,
        a.nombre AS agencia_nombre,
        u.activo,
        MAX(aud.fecha) AS ultima_fecha,
        (
          SELECT aud2.accion || ' ' || aud2.entidad
          FROM auditoria aud2
          WHERE aud2.usuario_id = u.id
          ORDER BY aud2.fecha DESC
          LIMIT 1
        ) AS ultima_accion,
        COUNT(aud.id)::int AS total_acciones
      FROM usuarios u
      LEFT JOIN agencias a ON a.id = u.agencia_id
      LEFT JOIN auditoria aud ON aud.usuario_id = u.id
      GROUP BY u.id, u.nombre, u.email, u.rol, a.nombre, u.activo
      ORDER BY ultima_fecha DESC NULLS LAST, u.nombre ASC
    `);

    res.json(rows);
  })
);
