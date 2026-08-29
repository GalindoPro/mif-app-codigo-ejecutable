import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../../utils/asyncHandler";
import { requireAuth, requireRole, agenciaVisible } from "../../middleware/auth";
import { badRequest, forbidden } from "../../utils/errors";
import * as service from "./service";
import { CATEGORIA_KEYS } from "./categorias";

export const cajaAuxiliarRouter = Router();
cajaAuxiliarRouter.use(requireAuth);

cajaAuxiliarRouter.get(
  "/estado",
  asyncHandler(async (req, res) => {
    const agenciaId = (req.query.agenciaId as string) || req.user?.agenciaId;
    if (!agenciaId) throw badRequest("Falta indicar la agencia");
    res.json(await service.estado(agenciaId, agenciaVisible(req)));
  }),
);

const abrirSchema = z.object({
  agenciaId: z.string().uuid(),
  saldoInicial: z.number().nonnegative().optional(),
});

cajaAuxiliarRouter.post(
  "/abrir",
  requireRole("ADMIN", "GERENCIA", "SUPERVISOR", "CAJERO"),
  asyncHandler(async (req, res) => {
    const data = abrirSchema.parse(req.body);
    const visible = agenciaVisible(req);
    if (visible && data.agenciaId !== visible) throw forbidden("No puedes abrir la caja de otra agencia");
    res.status(201).json(await service.abrirDia(data.agenciaId, req.user!.id, visible, data.saldoInicial));
  }),
);

cajaAuxiliarRouter.get(
  "/beneficiarios",
  asyncHandler(async (req, res) => {
    const agenciaId = (req.query.agenciaId as string) || req.user?.agenciaId;
    const q = typeof req.query.q === "string" ? req.query.q : "";
    if (!agenciaId) throw badRequest("Falta indicar la agencia");
    res.json(await service.beneficiariosFrecuentes(agenciaId, q, agenciaVisible(req)));
  }),
);

cajaAuxiliarRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    res.json(await service.detalle(req.params.id, agenciaVisible(req)));
  }),
);

const movimientoSchema = z.object({
  categoria: z.enum(CATEGORIA_KEYS as [string, ...string[]]),
  monto: z.number().positive("El monto debe ser mayor a cero"),
  beneficiario: z.string().optional(),
  socioId: z.string().uuid().optional(),
  cuentaId: z.string().uuid().optional(),
  docNo: z.string().optional(),
  referenciaAut: z.string().optional(),
});

cajaAuxiliarRouter.post(
  "/:id/movimientos",
  requireRole("ADMIN", "GERENCIA", "SUPERVISOR", "CAJERO"),
  asyncHandler(async (req, res) => {
    const data = movimientoSchema.parse(req.body);
    res.status(201).json(
      await service.crearMovimiento(req.params.id, data as service.DatosMovimientoAuxiliar, req.user!.id, agenciaVisible(req)),
    );
  }),
);

const cerrarSchema = z.object({
  conteo: z
    .array(
      z.object({
        valor: z.number().positive(),
        cantidad: z.number().int().nonnegative(),
      }),
    )
    .min(1),
});

cajaAuxiliarRouter.post(
  "/:id/cerrar",
  requireRole("ADMIN", "GERENCIA", "SUPERVISOR", "CAJERO"),
  asyncHandler(async (req, res) => {
    const data = cerrarSchema.parse(req.body);
    res.json(await service.cerrarDia(req.params.id, data.conteo, req.user!.id, agenciaVisible(req)));
  }),
);
