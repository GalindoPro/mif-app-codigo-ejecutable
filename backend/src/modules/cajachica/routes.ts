import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../../utils/asyncHandler";
import { requireAuth, requireRole, agenciaVisible } from "../../middleware/auth";
import { badRequest, forbidden } from "../../utils/errors";
import * as service from "./service";

export const cajaChicaRouter = Router();
cajaChicaRouter.use(requireAuth);

cajaChicaRouter.get(
  "/",
  requireRole("ADMIN", "GERENCIA", "SUPERVISOR", "CAJERO"),
  asyncHandler(async (req, res) => {
    const q = typeof req.query.q === "string" ? req.query.q : undefined;
    res.json(await service.listar({ agenciaId: agenciaVisible(req), q }));
  }),
);

const CATEGORIAS_CAJA_CHICA = [
  "SUMINISTROS_OFICINA",
  "CAFETERIA_LIMPIEZA",
  "COMBUSTIBLES_LUBRICANTES",
  "COMISIONES_GASTOS",
  "TELEFONO",
  "INTERNET",
  "ENERGIA_ELECTRICA",
  "GASTOS_DIVERSOS",
  "REPARACION_MANTENIMIENTO",
  "FLETES_ACARREO",
  "PROYECCION_SOCIAL",
  "OTRO",
] as const;

const crearSchema = z.object({
  agenciaId: z.string().uuid(),
  fecha: z.string().min(1),
  numeroDocumento: z.string().optional(),
  beneficiario: z.string().min(2),
  descripcion: z.string().min(2),
  tipo: z.enum(["INGRESO", "EGRESO"]),
  categoria: z.enum(CATEGORIAS_CAJA_CHICA).optional(),
  monto: z.number().positive("El monto debe ser mayor a cero"),
});

cajaChicaRouter.post(
  "/",
  requireRole("ADMIN", "GERENCIA", "SUPERVISOR", "CAJERO"),
  asyncHandler(async (req, res) => {
    const data = crearSchema.parse(req.body);
    const visible = agenciaVisible(req);
    if (visible && data.agenciaId !== visible) throw forbidden("No puedes registrar comprobantes en otra agencia");
    if (!visible && !req.query.agenciaId && !data.agenciaId) throw badRequest("Falta indicar la agencia");
    res.status(201).json(await service.crear(data, req.user!.id));
  }),
);
