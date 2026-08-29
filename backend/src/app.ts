import "dotenv/config";
import cors from "cors";
import express from "express";
import { errorHandler } from "./middleware/errorHandler";
import { authRouter } from "./modules/auth/routes";
import { agenciasRouter } from "./modules/agencias/routes";
import { usuariosRouter } from "./modules/usuarios/routes";
import { sociosRouter } from "./modules/socios/routes";
import { cuentasRouter } from "./modules/cuentas/routes";
import { cajaChicaRouter } from "./modules/cajachica/routes";
import { cajaAuxiliarRouter } from "./modules/cajaauxiliar/routes";
import { dashboardRouter } from "./modules/dashboard/routes";
import { sistemaRouter } from "./modules/sistema/routes";
import { prestamosRouter } from "./modules/prestamos/routes";

export const app = express();

app.use(cors({ origin: process.env.CORS_ORIGIN?.split(",") ?? true, credentials: true }));
app.use(express.json());

app.get("/health", (_req, res) => res.json({ ok: true, servicio: "mif-backend" }));

app.use("/api/auth", authRouter);
app.use("/api/agencias", agenciasRouter);
app.use("/api/usuarios", usuariosRouter);
app.use("/api/socios", sociosRouter);
app.use("/api/cuentas", cuentasRouter);
app.use("/api/caja-chica", cajaChicaRouter);
app.use("/api/caja-auxiliar", cajaAuxiliarRouter);
app.use("/api/dashboard", dashboardRouter);
app.use("/api/sistema", sistemaRouter);
app.use("/api/prestamos", prestamosRouter);

app.use((_req, res) => res.status(404).json({ error: "Ruta no encontrada" }));
app.use(errorHandler);
