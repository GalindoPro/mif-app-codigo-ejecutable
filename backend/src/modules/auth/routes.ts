import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../../utils/asyncHandler";
import { requireAuth, requireRole } from "../../middleware/auth";
import { badRequest } from "../../utils/errors";
import * as service from "./service";

export const authRouter = Router();

const loginSchema = z.object({
  email: z.string().email("Correo inválido"),
  password: z.string().min(1, "La contraseña es obligatoria"),
});

authRouter.post(
  "/login",
  asyncHandler(async (req, res) => {
    const { email, password } = loginSchema.parse(req.body);
    const ip = (req.headers["x-forwarded-for"] as string)?.split(",")[0].trim() ?? req.socket.remoteAddress ?? undefined;
    const userAgent = req.headers["user-agent"] ?? undefined;
    const result = await service.login(email, password, ip, userAgent);
    res.json(result);
  }),
);

authRouter.get("/me", requireAuth, (req, res) => {
  res.json({ usuario: req.user });
});

// Sesiones activas
authRouter.get(
  "/sesiones",
  requireAuth,
  asyncHandler(async (req, res) => {
    const esAdmin = req.user!.rol === "ADMIN" || req.user!.rol === "GERENCIA";
    const filtroPorUsuario = typeof req.query.usuarioId === "string" ? req.query.usuarioId : undefined;
    res.json(await service.listarSesiones(req.user!.id, esAdmin, filtroPorUsuario));
  }),
);

authRouter.delete(
  "/sesiones/:jti",
  requireAuth,
  asyncHandler(async (req, res) => {
    const esAdmin = req.user!.rol === "ADMIN" || req.user!.rol === "GERENCIA";
    // Un usuario solo puede revocar sus propias sesiones; admin puede revocar cualquiera
    if (!esAdmin) {
      const { rows } = await (await import("../../db/pool")).pool.query(
        `select usuario_id from sesiones where jti = $1`,
        [req.params.jti],
      );
      if (!rows[0] || rows[0].usuario_id !== req.user!.id) {
        throw badRequest("Solo puedes revocar tus propias sesiones");
      }
    }
    res.json(await service.revocarSesion(req.params.jti, req.user!.id));
  }),
);

authRouter.post(
  "/sesiones/revocar-todas",
  requireAuth,
  requireRole("ADMIN", "GERENCIA"),
  asyncHandler(async (req, res) => {
    const usuarioId = typeof req.query.usuarioId === "string" ? req.query.usuarioId : req.user!.id;
    const jtiActual = (req.user as { jti?: string }).jti ?? "";
    res.json(await service.revocarTodasLasSesiones(usuarioId, jtiActual, req.user!.id));
  }),
);
