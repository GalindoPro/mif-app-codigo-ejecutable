import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../../utils/asyncHandler";
import { requireAuth, requireRole, agenciaVisible } from "../../middleware/auth";
import * as service from "./service";

export const usuariosRouter = Router();
usuariosRouter.use(requireAuth);

usuariosRouter.get(
  "/",
  requireRole("ADMIN", "GERENCIA", "SUPERVISOR"),
  asyncHandler(async (req, res) => {
    res.json(await service.listar(agenciaVisible(req)));
  }),
);

const crearSchema = z.object({
  nombre: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
  rol: z.enum(["ADMIN", "GERENCIA", "SUPERVISOR", "CAJERO", "PROMOTOR"]),
  agenciaId: z.string().uuid().optional(),
});

usuariosRouter.post(
  "/",
  requireRole("ADMIN"),
  asyncHandler(async (req, res) => {
    const data = crearSchema.parse(req.body);
    res.status(201).json(await service.crear(data));
  }),
);
