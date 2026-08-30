import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../../utils/asyncHandler";
import { requireAuth, requireRole, agenciaVisible } from "../../middleware/auth";
import { badRequest, forbidden } from "../../utils/errors";
import * as service from "./service";

export const sociosRouter = Router();
sociosRouter.use(requireAuth);

sociosRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const page = Math.max(1, Number(req.query.page) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(req.query.pageSize) || 10));
    const estado = req.query.estado as "ACTIVO" | "INACTIVO" | undefined;
    const q = typeof req.query.q === "string" ? req.query.q : undefined;

    res.json(await service.listar({ agenciaId: agenciaVisible(req), q, estado, page, pageSize }));
  }),
);

sociosRouter.get(
  "/siguiente-numero",
  asyncHandler(async (req, res) => {
    const agenciaId = (req.query.agenciaId as string) || req.user?.agenciaId;
    if (!agenciaId) throw badRequest("Falta indicar la agencia");
    res.json(await service.siguienteNumero(agenciaId));
  }),
);

sociosRouter.get(
  "/aportaciones",
  asyncHandler(async (req, res) => {
    const q = typeof req.query.q === "string" ? req.query.q : undefined;
    res.json(await service.listarAportaciones({ agenciaId: agenciaVisible(req), q }));
  }),
);

sociosRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    res.json(await service.obtener(req.params.id, agenciaVisible(req)));
  }),
);

const datosSocioSchema = z.object({
  numeroAsociado: z.string().min(1),
  agenciaId: z.string().uuid(),
  nombres: z.string().min(3, "El nombre completo es obligatorio"),
  genero: z.enum(["M", "F"]).optional().nullable(),
  edad: z.number().int().min(1).max(120).optional().nullable(),
  fechaIngreso: z.string().min(1, "La fecha de ingreso es obligatoria"),
  dpi: z.string().min(13).max(13).optional().or(z.literal("")).transform((v) => (v ? v : undefined)),
  direccion: z.string().optional().nullable(),
  telefono: z.string().optional().nullable(),
  nombreBeneficiario: z.string().optional().nullable(),
  dpiBeneficiario: z.string().optional().nullable(),
  telefonoBeneficiario: z.string().optional().nullable(),
});

sociosRouter.post(
  "/",
  requireRole("ADMIN", "GERENCIA", "SUPERVISOR", "CAJERO", "PROMOTOR"),
  asyncHandler(async (req, res) => {
    const data = datosSocioSchema.parse(req.body);
    const visible = agenciaVisible(req);
    if (visible && data.agenciaId !== visible) throw forbidden("No puedes registrar socios en otra agencia");
    res.status(201).json(await service.crear(data, req.user!.id));
  }),
);

const actualizarSchema = datosSocioSchema
  .omit({ numeroAsociado: true, agenciaId: true })
  .partial()
  .extend({ estado: z.enum(["ACTIVO", "INACTIVO"]).optional() });

sociosRouter.patch(
  "/:id",
  requireRole("ADMIN", "GERENCIA", "SUPERVISOR", "CAJERO", "PROMOTOR"),
  asyncHandler(async (req, res) => {
    const data = actualizarSchema.parse(req.body);
    res.json(await service.actualizar(req.params.id, data, req.user!.id, agenciaVisible(req)));
  }),
);
