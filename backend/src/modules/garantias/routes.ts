import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../../utils/asyncHandler";
import { requireAuth, requireRole, agenciaVisible } from "../../middleware/auth";
import { pool } from "../../db/pool";
import { withTransaction } from "../../db/transaction";
import { registrarAuditoria } from "../../utils/auditoria";
import { notFound, forbidden } from "../../utils/errors";

export const garantiasRouter = Router();
garantiasRouter.use(requireAuth);

garantiasRouter.get(
  "/:prestamoId",
  asyncHandler(async (req, res) => {
    const { rows: pRows } = await pool.query(
      `select p.agencia_id from prestamos p where p.id = $1`,
      [req.params.prestamoId],
    );
    if (!pRows[0]) throw notFound("Préstamo no encontrado");
    const visible = agenciaVisible(req);
    if (visible && pRows[0].agencia_id !== visible) throw forbidden("Acceso denegado");

    const { rows } = await pool.query(
      `select g.*, u.nombre as registrado_por_nombre
       from garantias_hipotecarias g
       join usuarios u on u.id = g.usuario_id
       where g.prestamo_id = $1`,
      [req.params.prestamoId],
    );
    res.json(rows[0] ?? null);
  }),
);

const garantiaSchema = z.object({
  tipoBien: z.string().default("INMUEBLE"),
  descripcion: z.string().min(5, "Descripción obligatoria (mín. 5 caracteres)"),
  valorTasacion: z.number().positive().optional().nullable(),
  direccion: z.string().optional().nullable(),
  municipio: z.string().optional().nullable(),
  departamento: z.string().optional().nullable(),
  noFinca: z.string().optional().nullable(),
  folio: z.string().optional().nullable(),
  libro: z.string().optional().nullable(),
  fechaInscripcion: z.string().optional().nullable(),
  fechaVencimiento: z.string().optional().nullable(),
  observaciones: z.string().optional().nullable(),
});

garantiasRouter.put(
  "/:prestamoId",
  requireRole("GERENCIA", "SUPERVISOR"),
  asyncHandler(async (req, res) => {
    const data = garantiaSchema.parse(req.body);
    const visible = agenciaVisible(req);

    const { rows: pRows } = await pool.query(
      `select p.id, p.tipo, p.agencia_id from prestamos p where p.id = $1`,
      [req.params.prestamoId],
    );
    if (!pRows[0]) throw notFound("Préstamo no encontrado");
    if (visible && pRows[0].agencia_id !== visible) throw forbidden("Acceso denegado");

    return withTransaction(async (client) => {
      const { rows } = await client.query(
        `insert into garantias_hipotecarias
           (prestamo_id, tipo_bien, descripcion, valor_tasacion, direccion, municipio, departamento,
            no_finca, folio, libro, fecha_inscripcion, fecha_vencimiento, observaciones, usuario_id)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
         on conflict (prestamo_id) do update set
           tipo_bien=$2, descripcion=$3, valor_tasacion=$4, direccion=$5, municipio=$6,
           departamento=$7, no_finca=$8, folio=$9, libro=$10, fecha_inscripcion=$11,
           fecha_vencimiento=$12, observaciones=$13, usuario_id=$14, updated_at=now()
         returning *`,
        [
          req.params.prestamoId,
          data.tipoBien,
          data.descripcion,
          data.valorTasacion ?? null,
          data.direccion ?? null,
          data.municipio ?? null,
          data.departamento ?? null,
          data.noFinca ?? null,
          data.folio ?? null,
          data.libro ?? null,
          data.fechaInscripcion ?? null,
          data.fechaVencimiento ?? null,
          data.observaciones ?? null,
          req.user!.id,
        ],
      );
      await registrarAuditoria({
        entidad: "GarantiaHipotecaria",
        entidadId: rows[0].id,
        accion: "ACTUALIZAR",
        usuarioId: req.user!.id,
        datosNuevos: rows[0],
      });
      res.json(rows[0]);
    });
  }),
);

garantiasRouter.delete(
  "/:prestamoId",
  requireRole("GERENCIA"),
  asyncHandler(async (req, res) => {
    const { rows } = await pool.query(
      `delete from garantias_hipotecarias where prestamo_id = $1 returning id`,
      [req.params.prestamoId],
    );
    if (!rows[0]) throw notFound("Garantía no encontrada");
    res.json({ ok: true });
  }),
);
