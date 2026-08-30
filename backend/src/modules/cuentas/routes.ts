import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../../utils/asyncHandler";
import { requireAuth, requireRole, agenciaVisible } from "../../middleware/auth";
import { badRequest, forbidden } from "../../utils/errors";
import * as service from "./service";

export const cuentasRouter = Router();
cuentasRouter.use(requireAuth);

const TIPOS = ["AHORRO_CORRIENTE", "AHORRO_PROGRAMADO", "AHORRO_INFANTO_JUVENIL"] as const;
const tipoSchema = z.enum(TIPOS);

cuentasRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const tipo = tipoSchema.parse(req.query.tipo);
    const q = typeof req.query.q === "string" ? req.query.q : undefined;
    res.json(await service.listar({ tipo, agenciaId: agenciaVisible(req), q }));
  }),
);

cuentasRouter.get(
  "/resumen",
  asyncHandler(async (req, res) => {
    const tipo = tipoSchema.parse(req.query.tipo);
    res.json(await service.resumen({ tipo, agenciaId: agenciaVisible(req) }));
  }),
);

cuentasRouter.get(
  "/siguiente-numero",
  asyncHandler(async (req, res) => {
    const tipo = tipoSchema.parse(req.query.tipo);
    const agenciaId = (req.query.agenciaId as string) || req.user?.agenciaId;
    if (!agenciaId) throw badRequest("Falta indicar la agencia");
    res.json(await service.siguienteNumero(agenciaId, tipo));
  }),
);

cuentasRouter.get(
  "/novedades-campo",
  asyncHandler(async (req, res) => {
    const agenciaId = agenciaVisible(req) || (req.query.agenciaId as string) || null;
    res.json(await service.listarNovedadesCampo(agenciaId));
  }),
);

cuentasRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    res.json(await service.obtener(req.params.id, agenciaVisible(req)));
  }),
);

const crearSchema = z.object({
  tipo: tipoSchema,
  agenciaId: z.string().uuid(),
  socioId: z.string().uuid(),
  numeroCuenta: z.string().min(1),
  saldoInicial: z.number().nonnegative().optional(),
  cuotaPactada: z.number().positive().optional().nullable(),
  observacionesApertura: z.string().optional().nullable(),
});

cuentasRouter.post(
  "/",
  requireRole("ADMIN", "GERENCIA", "SUPERVISOR", "CAJERO", "PROMOTOR"),
  asyncHandler(async (req, res) => {
    const data = crearSchema.parse(req.body);
    const visible = agenciaVisible(req);
    if (visible && data.agenciaId !== visible) throw forbidden("No puedes abrir cuentas en otra agencia");
    res.status(201).json(await service.crear(data, req.user!.id));
  }),
);

const movimientoSchema = z.object({
  tipo: z.enum(["DEPOSITO", "RETIRO"]),
  monto: z.number().positive("El monto debe ser mayor a cero"),
  fecha: z.string().min(1),
  numeroRecibo: z.string().optional(),
  descripcion: z.string().optional(),
});

cuentasRouter.post(
  "/:id/movimientos",
  requireRole("ADMIN", "GERENCIA", "SUPERVISOR", "CAJERO"),
  asyncHandler(async (req, res) => {
    const data = movimientoSchema.parse(req.body);
    res.status(201).json(await service.registrarMovimiento(req.params.id, data, req.user!.id, agenciaVisible(req)));
  }),
);
