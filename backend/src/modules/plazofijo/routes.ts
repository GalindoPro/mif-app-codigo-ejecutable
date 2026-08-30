import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../../utils/asyncHandler";
import { requireAuth, requireRole, agenciaVisible } from "../../middleware/auth";
import * as service from "./service";

export const plazoFijoRouter = Router();
plazoFijoRouter.use(requireAuth);

const simularSchema = z.object({
  montoDeposito: z.number().positive("El monto debe ser mayor a 0"),
  plazoMeses: z.number().int().min(1, "El plazo mínimo es de 1 mes"),
  tasaAnual: z.number().positive("La tasa debe ser mayor a 0"),
  isrPorcentaje: z.number().min(0).default(10.0),
  fechaInicio: z.string().optional(),
});

plazoFijoRouter.post(
  "/simular",
  asyncHandler(async (req, res) => {
    const data = simularSchema.parse(req.body);
    res.json(service.simular(data));
  }),
);

plazoFijoRouter.get(
  "/siguiente-certificado",
  asyncHandler(async (req, res) => {
    const agenciaId = (req.query.agenciaId as string) || agenciaVisible(req);
    if (!agenciaId) return res.status(400).json({ error: "Agencia requerida" });
    const numero = await service.siguienteCertificado(agenciaId);
    res.json({ numero });
  }),
);

plazoFijoRouter.get(
  "/siguiente-codigo",
  asyncHandler(async (req, res) => {
    const agenciaId = (req.query.agenciaId as string) || agenciaVisible(req);
    if (!agenciaId) return res.status(400).json({ error: "Agencia requerida" });
    const codigo = await service.siguienteCodigoCuenta(agenciaId);
    res.json({ codigo });
  }),
);

plazoFijoRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const contratos = await service.listar({
      agenciaId: agenciaVisible(req) ?? (req.query.agenciaId as string) ?? null,
      estado: req.query.estado as any,
      q: req.query.q as string,
    });
    res.json(contratos);
  }),
);

const crearSchema = z.object({
  agenciaId: z.string().uuid(),
  socioId: z.string().uuid(),
  numeroCuenta: z.string().optional(),
  numeroCertificacion: z.string().optional(),
  montoDeposito: z.number().positive("El monto debe ser mayor a 0"),
  plazoMeses: z.number().int().min(1, "El plazo mínimo es de 1 mes"),
  tasaAnual: z.number().positive("La tasa de interés anual debe ser mayor a 0"),
  isrPorcentaje: z.number().min(0).default(10.0),
  fechaInicio: z.string().optional(),
});

plazoFijoRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const data = crearSchema.parse(req.body);
    const contrato = await service.crear(data, req.user!.id);
    res.status(201).json(contrato);
  }),
);

plazoFijoRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const contrato = await service.obtener(req.params.id, agenciaVisible(req));
    res.json(contrato);
  }),
);

const liquidarSchema = z.object({
  reciboRetiro: z.string().optional(),
  incluirIntereses: z.boolean().optional(),
  montoLiquidado: z.number().positive().optional(),
});

plazoFijoRouter.post(
  "/:id/liquidar",
  requireRole("ADMIN", "GERENCIA", "SUPERVISOR", "CAJERO"),
  asyncHandler(async (req, res) => {
    const data = liquidarSchema.parse(req.body ?? {});
    const liquidado = await service.liquidar(req.params.id, data, req.user!.id, agenciaVisible(req));
    res.json(liquidado);
  }),
);

