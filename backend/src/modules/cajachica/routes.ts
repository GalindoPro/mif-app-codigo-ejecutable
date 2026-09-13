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
  requireRole("GERENCIA", "SUPERVISOR", "CAJERO", "CAJA_CHICA"),
  asyncHandler(async (req, res) => {
    const q = typeof req.query.q === "string" ? req.query.q : undefined;
    res.json(await service.listar({ agenciaId: agenciaVisible(req), q }));
  }),
);

cajaChicaRouter.get(
  "/reporte",
  requireRole("GERENCIA", "SUPERVISOR", "CAJERO", "CAJA_CHICA"),
  asyncHandler(async (req, res) => {
    const visible = agenciaVisible(req);
    const agenciaId = (visible || req.query.agenciaId) as string;
    if (!agenciaId) throw badRequest("Falta indicar la agencia para el reporte");

    const fechaInicio = typeof req.query.fechaInicio === "string" ? req.query.fechaInicio : undefined;
    const fechaFin = typeof req.query.fechaFin === "string" ? req.query.fechaFin : undefined;
    const categoria = typeof req.query.categoria === "string" ? req.query.categoria : undefined;

    res.json(await service.generarReporte({ agenciaId, fechaInicio, fechaFin, categoria }));
  }),
);

cajaChicaRouter.get(
  "/ultimo-documento",
  requireRole("GERENCIA", "SUPERVISOR", "CAJERO", "CAJA_CHICA"),
  asyncHandler(async (req, res) => {
    const visible = agenciaVisible(req);
    const agenciaId = (visible || (req.query.agenciaId as string)) as string;
    if (!agenciaId) throw badRequest("Falta indicar la agencia");
    const fecha = typeof req.query.fecha === "string" ? req.query.fecha : new Date().toISOString().slice(0, 10);
    res.json(await service.obtenerUltimoDocumento(agenciaId, fecha));
  }),
);

cajaChicaRouter.get(
  "/verificar-documento",
  requireRole("GERENCIA", "SUPERVISOR", "CAJERO", "CAJA_CHICA"),
  asyncHandler(async (req, res) => {
    const visible = agenciaVisible(req);
    const agenciaId = (visible || (req.query.agenciaId as string)) as string;
    if (!agenciaId) throw badRequest("Falta indicar la agencia");
    const fecha = typeof req.query.fecha === "string" ? req.query.fecha : new Date().toISOString().slice(0, 10);
    const numeroDocumento = typeof req.query.numeroDocumento === "string" ? req.query.numeroDocumento : "";
    res.json(await service.verificarNumeroDocumentoExiste(agenciaId, fecha, numeroDocumento));
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
  requireRole("GERENCIA", "SUPERVISOR", "CAJERO", "CAJA_CHICA"),
  asyncHandler(async (req, res) => {
    const data = crearSchema.parse(req.body);
    const visible = agenciaVisible(req);
    if (visible && data.agenciaId !== visible) throw forbidden("No puedes registrar comprobantes en otra agencia");
    if (!visible && !req.query.agenciaId && !data.agenciaId) throw badRequest("Falta indicar la agencia");
    res.status(201).json(await service.crear(data, req.user!.id));
  }),
);

const reponerFondoSchema = z.object({
  agenciaId: z.string().uuid(),
  monto: z.number().positive("El monto a reponer debe ser mayor a 0"),
  numeroCheque: z.string().min(1, "El número de cheque o documento (No. CH.) es obligatorio"),
  descripcion: z.string().optional(),
  fecha: z.string().optional(),
});

cajaChicaRouter.post(
  "/reponer-fondo",
  requireRole("GERENCIA", "SUPERVISOR", "CAJERO", "CAJA_CHICA"),
  asyncHandler(async (req, res) => {
    const data = reponerFondoSchema.parse(req.body);
    const visible = agenciaVisible(req);
    if (visible && data.agenciaId !== visible) throw forbidden("No puedes reponer caja chica en otra agencia");
    res.status(201).json(await service.reponerFondo(data, req.user!.id));
  }),
);

const editarSchema = z.object({
  fecha: z.string().min(1).optional(),
  numeroDocumento: z.string().optional(),
  beneficiario: z.string().min(2).optional(),
  descripcion: z.string().min(2).optional(),
  tipo: z.enum(["INGRESO", "EGRESO"]).optional(),
  categoria: z.enum(CATEGORIAS_CAJA_CHICA).optional(),
  monto: z.number().positive("El monto debe ser mayor a cero").optional(),
  motivo: z.string().min(10, "El motivo de la corrección es obligatorio (mínimo 10 caracteres)"),
});

cajaChicaRouter.patch(
  "/:id",
  requireRole("GERENCIA", "CAJERO", "CAJA_CHICA"),
  asyncHandler(async (req, res) => {
    const id = req.params.id;
    const data = editarSchema.parse(req.body);
    const { motivo, ...updates } = data;

    // Verificar permisos operativos (GERENCIA salta esto)
    if (req.user!.rol !== "GERENCIA") {
      const { pool } = await import("../../db/pool");
      const { rows } = await pool.query(
        "select usuario_id, created_at from caja_chica_comprobantes where id = $1",
        [id]
      );
      if (!rows[0]) throw badRequest("El registro no existe");
      const reg = rows[0];
      
      // Debe ser el mismo usuario
      if (reg.usuario_id !== req.user!.id) {
        throw forbidden("No autorizado: Solo puedes editar tus propios registros");
      }
      
      // Debe ser del mismo día (hoy localmente o created_at)
      const hoy = new Date().toISOString().slice(0, 10);
      const fechaRegistro = new Date(reg.created_at).toISOString().slice(0, 10);
      if (hoy !== fechaRegistro) {
        throw forbidden("No autorizado: Solo puedes editar registros creados el día de hoy");
      }
    }

    res.json(await service.editar(id, updates, req.user!.id, motivo));
  }),
);
