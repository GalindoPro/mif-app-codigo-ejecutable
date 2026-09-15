import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../../utils/asyncHandler";
import { requireAuth } from "../../middleware/auth";
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
    const result = await service.login(email, password);
    res.json(result);
  }),
);

authRouter.get("/me", requireAuth, async (req, res) => {
  const { pool } = require("../../db/pool");
  const result = await pool.query("SELECT 1 FROM usuario_drive_tokens WHERE usuario_id = $1", [req.user!.id]);
  res.json({ 
    usuario: req.user,
    driveConnected: result.rows.length > 0 
  });
});

authRouter.get("/google", requireAuth, (req, res) => {
  const { getAuthUrl } = require("../../services/googleDriveService");
  const url = getAuthUrl(req.user!.id);
  res.json({ url });
});

authRouter.get(
  "/google/callback",
  asyncHandler(async (req, res) => {
    const code = req.query.code as string;
    const usuarioId = req.query.state as string;

    if (!code || !usuarioId) {
      res.status(400).send("Faltan parámetros (code o state).");
      return;
    }

    const { getOAuthClient } = require("../../services/googleDriveService");
    const { pool } = require("../../db/pool");
    
    const oauth2Client = getOAuthClient();
    const { tokens } = await oauth2Client.getToken(code);
    
    // Guardar tokens en BD
    await pool.query(
      `INSERT INTO usuario_drive_tokens (usuario_id, access_token, refresh_token, expiry_date) 
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (usuario_id) DO UPDATE SET 
       access_token = EXCLUDED.access_token,
       refresh_token = COALESCE(EXCLUDED.refresh_token, usuario_drive_tokens.refresh_token),
       expiry_date = EXCLUDED.expiry_date`,
      [usuarioId, tokens.access_token, tokens.refresh_token, tokens.expiry_date]
    );

    // Redirigir al frontend al Dashboard o Perfil (cerrando la ventana o regresando a la app)
    // Asumiendo que el frontend está en el mismo host o manejamos la redirección
    res.redirect(`${process.env.FRONTEND_URL || "http://localhost:5173"}/?drive_connected=true`);
  })
);

