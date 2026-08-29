import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../../utils/asyncHandler";
import { requireAuth, requireRole } from "../../middleware/auth";
import * as service from "./service";

export const agenciasRouter = Router();
agenciasRouter.use(requireAuth);

agenciasRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    res.json(await service.listar());
  }),
);

const crearSchema = z.object({
  codigo: z.string().min(2).max(30),
  nombre: z.string().min(2),
  direccion: z.string().optional(),
});

agenciasRouter.post(
  "/",
  requireRole("ADMIN"),
  asyncHandler(async (req, res) => {
    const data = crearSchema.parse(req.body);
    res.status(201).json(await service.crear(data));
  }),
);
