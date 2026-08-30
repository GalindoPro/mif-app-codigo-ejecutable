import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../../utils/asyncHandler";
import { requireAuth, requireRole, agenciaVisible } from "../../middleware/auth";
import * as service from "./service";

export const prestamosRouter = Router();
prestamosRouter.use(requireAuth);

const simularSchema = z.object({
  monto: z.number().positive("El monto debe ser mayor a 0"),
  plazoMeses: z.number().int().min(1, "El plazo mínimo es de 1 mes"),
  tasaInteresMensual: z.number().positive().default(2.0),
  tipoAmortizacion: z.enum(["CUOTA_NIVELADA", "SOBRE_SALDOS"]).default("CUOTA_NIVELADA"),
  fechaInicio: z.string().optional(),
});

prestamosRouter.post(
  "/simular",
  asyncHandler(async (req, res) => {
    const data = simularSchema.parse(req.body);
    res.json(service.simular(data));
  }),
);

prestamosRouter.get(
  "/siguiente-codigo",
  asyncHandler(async (req, res) => {
    const agenciaId = (req.query.agenciaId as string) || agenciaVisible(req);
    if (!agenciaId) return res.status(400).json({ error: "Agencia requerida" });
    const codigo = await service.siguienteCodigo(agenciaId);
    res.json({ codigo });
  }),
);

prestamosRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const prestamos = await service.listar({
      agenciaId: agenciaVisible(req) ?? (req.query.agenciaId as string) ?? null,
      promotorId: req.query.promotorId as string,
      socioId: req.query.socioId as string,
      estado: req.query.estado as any,
      q: req.query.q as string,
    });
    res.json(prestamos);
  }),
);

prestamosRouter.get(
  "/kardex-cartera",
  asyncHandler(async (req, res) => {
    const agenciaId = agenciaVisible(req) ?? (req.query.agenciaId as string) ?? null;
    const promotorId =
      req.user?.rol === "PROMOTOR"
        ? req.user.id
        : (req.query.promotorId as string) || null;
    const tipo = req.query.tipo as any;
    const mes = req.query.mes as string | undefined;
    res.json(await service.obtenerKardexCartera({ agenciaId, promotorId, tipo, mes }));
  }),
);

const crearSchema = z.object({
  agenciaId: z.string().uuid(),
  socioId: z.string().uuid(),
  promotorId: z.string().uuid().optional().nullable(),
  tipo: z.enum(["FIDUCIARIO", "HIPOTECARIO"]),
  tipoAmortizacion: z.enum(["CUOTA_NIVELADA", "SOBRE_SALDOS"]).default("CUOTA_NIVELADA"),
  montoSolicitado: z.number().positive(),
  plazoMeses: z.number().int().min(1),
  tasaInteresMensual: z.number().positive().default(2.0),
  destino: z.string().optional(),
  garantia: z.string().optional(),
  ubicacionGarantia: z.string().optional().nullable(),
  nombreFiador: z.string().optional().nullable(),
  documentoDesembolso: z.string().optional().nullable(),
  observaciones: z.string().optional(),
  fechaSolicitud: z.string().optional(),
});

prestamosRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const data = crearSchema.parse(req.body);
    if (req.user?.rol === "PROMOTOR" && !data.promotorId) {
      data.promotorId = req.user.id;
    }
    const prestamo = await service.crear(data, req.user!.id);
    res.status(201).json(prestamo);
  }),
);

prestamosRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const prestamo = await service.obtener(req.params.id, agenciaVisible(req));
    res.json(prestamo);
  }),
);

const estadoSchema = z.object({
  estado: z.enum(["SOLICITUD", "APROBADO", "DESEMBOLSADO", "CANCELADO", "RECHAZADO"]),
  montoAprobado: z.number().positive().optional(),
});

prestamosRouter.patch(
  "/:id/estado",
  requireRole("ADMIN", "GERENCIA", "SUPERVISOR"),
  asyncHandler(async (req, res) => {
    const { estado, montoAprobado } = estadoSchema.parse(req.body);
    const actualizado = await service.cambiarEstado(
      req.params.id,
      estado,
      req.user!.id,
      agenciaVisible(req),
      montoAprobado,
    );
    res.json(actualizado);
  }),
);

prestamosRouter.get(
  "/:id/pagos",
  asyncHandler(async (req, res) => {
    res.json(await service.listarPagos(req.params.id));
  }),
);
