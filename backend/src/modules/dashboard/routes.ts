import { Router } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { requireAuth, agenciaVisible } from "../../middleware/auth";
import * as service from "./service";

export const dashboardRouter = Router();
dashboardRouter.use(requireAuth);

dashboardRouter.get(
  "/resumen",
  asyncHandler(async (req, res) => {
    res.json(await service.resumen(agenciaVisible(req)));
  }),
);
