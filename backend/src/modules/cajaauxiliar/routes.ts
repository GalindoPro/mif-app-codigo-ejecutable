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

cajaAuxiliarRouter.get(
  "/historial",
  asyncHandler(async (req, res) => {
    const agenciaId = (req.query.agenciaId as string) || req.user?.agenciaId;
    if (!agenciaId) throw badRequest("Falta indicar la agencia");
    const limite = req.query.limite ? Number(req.query.limite) : 30;
    res.json(await service.historialDias(agenciaId, agenciaVisible(req), limite));
  }),
);

cajaAuxiliarRouter.get(
  "/analitica-servicios",
  asyncHandler(async (req, res) => {
    const agenciaId = (req.query.agenciaId as string) || req.user?.agenciaId || undefined;
    const periodo = (req.query.periodo as "semana" | "mes" | "anio") || "mes";
    res.json(await service.analiticaServicios(agenciaId, agenciaVisible(req), periodo));
  }),
);

cajaAuxiliarRouter.get(
  "/arqueos-mes",
  asyncHandler(async (req, res) => {
    const agenciaId = (req.query.agenciaId as string) || req.user?.agenciaId || undefined;
    const mes = typeof req.query.mes === "string" ? req.query.mes : undefined;
    res.json(await service.arqueosMensuales(agenciaId, agenciaVisible(req), mes));
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

const cobroCreditoSchema = z.object({
  prestamoId: z.string().uuid(),
  socioId: z.string().uuid(),
  abonoCapital: z.number().min(0),
  interes: z.number().min(0),
  mora: z.number().min(0).optional(),
  docNo: z.string().optional(),
  cuentaDebitoId: z.string().uuid().optional(),
});

cajaAuxiliarRouter.post(
  "/:id/cobro-credito",
  requireRole("ADMIN", "GERENCIA", "SUPERVISOR", "CAJERO"),
  asyncHandler(async (req, res) => {
    const data = cobroCreditoSchema.parse(req.body);
    res.status(201).json(
      await service.cobrarCuotaCredito(req.params.id, data, req.user!.id, agenciaVisible(req)),
    );
  }),
);

const desembolsoCreditoSchema = z.object({
  prestamoId: z.string().uuid(),
  docNo: z.string().optional(),
});

cajaAuxiliarRouter.post(
  "/:id/desembolso-credito",
  requireRole("ADMIN", "GERENCIA", "SUPERVISOR", "CAJERO"),
  asyncHandler(async (req, res) => {
    const data = desembolsoCreditoSchema.parse(req.body);
    res.status(201).json(
      await service.desembolsarCredito(req.params.id, data, req.user!.id, agenciaVisible(req)),
    );
  }),
);

const liquidarPlazoFijoSchema = z.object({
  contratoId: z.string().uuid(),
  reciboRetiro: z.string().min(1, "El número de recibo de retiro (RE. No.) es obligatorio"),
  incluirIntereses: z.boolean().optional(),
});

cajaAuxiliarRouter.post(
  "/:id/liquidar-plazo-fijo",
  requireRole("ADMIN", "GERENCIA", "SUPERVISOR", "CAJERO"),
  asyncHandler(async (req, res) => {
    const data = liquidarPlazoFijoSchema.parse(req.body);
    res.status(201).json(
      await service.liquidarPlazoFijo(req.params.id, data, req.user!.id, agenciaVisible(req)),
    );
  }),
);


