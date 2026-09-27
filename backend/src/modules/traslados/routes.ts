import { Router } from "express";
import { requireAuth } from "../../middleware/auth";
import {
  listarTraslados,
  solicitarTraslado,
  aprobarTraslado,
  rechazarTraslado,
  estadisticasTraslados,
} from "./service";

const router = Router();
router.use(requireAuth);

/** GET /api/traslados — Listar todos */
router.get("/", async (req, res, next) => {
  try {
    const { rol, agenciaId } = req.user!;
    const data = await listarTraslados(rol, agenciaId ?? null);
    res.json(data);
  } catch (e) {
    next(e);
  }
});

/** GET /api/traslados/estadisticas */
router.get("/estadisticas", async (req, res, next) => {
  try {
    const { rol, agenciaId } = req.user!;
    const agId = ["GERENCIA", "ADMIN"].includes(rol) ? null : (agenciaId ?? null);
    const data = await estadisticasTraslados(agId);
    res.json(data);
  } catch (e) {
    next(e);
  }
});

/** POST /api/traslados — Solicitar traslado */
router.post("/", async (req, res, next) => {
  try {
    const { id: userId, rol, agenciaId } = req.user!;
    const { socio_id, agencia_destino_id, motivo } = req.body;

    if (!socio_id || !agencia_destino_id || !motivo) {
      return res.status(400).json({ error: "Faltan campos: socio_id, agencia_destino_id, motivo." });
    }

    const result = await solicitarTraslado(
      socio_id,
      agencia_destino_id,
      motivo,
      userId,
      rol,
      agenciaId ?? null
    );
    res.status(201).json(result);
  } catch (e) {
    next(e);
  }
});

/** PATCH /api/traslados/:id/aprobar */
router.patch("/:id/aprobar", async (req, res, next) => {
  try {
    const { id: userId, rol, agenciaId } = req.user!;
    const { notas_admin } = req.body;

    const result = await aprobarTraslado(
      req.params.id,
      userId,
      rol,
      agenciaId ?? null,
      notas_admin
    );
    res.json(result);
  } catch (e) {
    next(e);
  }
});

/** PATCH /api/traslados/:id/rechazar */
router.patch("/:id/rechazar", async (req, res, next) => {
  try {
    const { id: userId, rol, agenciaId } = req.user!;
    const { notas_admin } = req.body;

    if (!notas_admin) {
      return res.status(400).json({ error: "Debe indicar el motivo del rechazo en notas_admin." });
    }

    const result = await rechazarTraslado(
      req.params.id,
      userId,
      rol,
      agenciaId ?? null,
      notas_admin
    );
    res.json(result);
  } catch (e) {
    next(e);
  }
});

export default router;
