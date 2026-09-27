import { Router, Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { requireAuth, requireRole } from "../../middleware/auth";
import * as service from "./service";
import { forbidden } from "../../utils/errors";

const router = Router();

// Accesible para roles directivos y de supervisión
router.get(
  "/",
  requireAuth,
  requireRole("ADMIN", "GERENCIA", "SUPERVISOR"),
  asyncHandler(async (req: Request, res: Response) => {
    let agenciaId: string | null = null;

    if (req.user?.rol === "SUPERVISOR") {
      // Supervisor solo puede consultar su propia agencia
      if (!req.user.agenciaId) {
        throw forbidden("No tienes una agencia asignada para consultar estados financieros");
      }
      agenciaId = req.user.agenciaId;
    } else {
      // ADMIN y GERENCIA pueden filtrar por agencia o consultar consolidado (null)
      if (req.query.agenciaId && typeof req.query.agenciaId === "string" && req.query.agenciaId !== "all") {
        agenciaId = req.query.agenciaId;
      }
    }

    const fechaCorte = typeof req.query.fechaCorte === "string" ? req.query.fechaCorte : undefined;

    const data = await service.obtenerConsolidado(agenciaId, fechaCorte);
    res.json(data);
  })
);

export default router;
