import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../../utils/asyncHandler";
import { requireAuth, requireRole, agenciaVisible } from "../../middleware/auth";
import * as service from "./service";

export const usuariosRouter = Router();
usuariosRouter.use(requireAuth);

usuariosRouter.get(
  "/",
  requireRole("GERENCIA", "SUPERVISOR"),
  asyncHandler(async (req, res) => {
    res.json(await service.listar(agenciaVisible(req)));
  }),
);

const crearSchema = z.object({
  nombre: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
  rol: z.enum(["GERENCIA", "SUPERVISOR", "CAJERO", "CAJA_CHICA", "PROMOTOR"]),
  agenciaId: z.string().uuid().optional(),
});

usuariosRouter.post(
  "/",
  requireRole("GERENCIA"),
  asyncHandler(async (req, res) => {
    const data = crearSchema.parse(req.body);
    res.status(201).json(await service.crear(data));
  }),
);

const actualizarSchema = z.object({
  nombre: z.string().min(2).optional(),
  email: z.string().email().optional(),
  rol: z.enum(["GERENCIA", "SUPERVISOR", "CAJERO", "CAJA_CHICA", "PROMOTOR"]).optional(),
  agenciaId: z.string().uuid().nullable().optional(),
  activo: z.boolean().optional(),
});

usuariosRouter.put(
  "/:id",
  requireRole("GERENCIA"),
  asyncHandler(async (req, res) => {
    const data = actualizarSchema.parse(req.body);
    res.json(await service.actualizar(req.params.id, data));
  }),
);

const passwordSchema = z.object({
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
});

usuariosRouter.patch(
  "/:id/password",
  requireRole("GERENCIA", "SUPERVISOR"),
  asyncHandler(async (req, res) => {
    const data = passwordSchema.parse(req.body);
    res.json(await service.cambiarPassword(req.params.id, data.password));
  }),
);

usuariosRouter.patch(
  "/:id/toggle-activo",
  requireRole("GERENCIA"),
  asyncHandler(async (req, res) => {
    res.json(await service.toggleActivo(req.params.id));
  }),
);

