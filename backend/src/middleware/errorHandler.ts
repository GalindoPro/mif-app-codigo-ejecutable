import { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { AppError } from "../utils/errors";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: "Datos inválidos",
      detalles: err.issues.map((i) => ({ campo: i.path.join("."), mensaje: i.message })),
    });
  }

  if (err instanceof AppError) {
    return res.status(err.status).json({ error: err.message });
  }

  // Violación de restricción única de PostgreSQL (p.ej. DPI o email duplicado)
  if (typeof err === "object" && err !== null && "code" in err && (err as { code: string }).code === "23505") {
    return res.status(409).json({ error: "Ya existe un registro con ese dato único (DPI, correo o número de cuenta)." });
  }

  // eslint-disable-next-line no-console
  console.error("Error no controlado:", err);
  
  try {
    const fs = require("fs");
    fs.appendFileSync("error.log", new Date().toISOString() + " - " + String(err) + (err instanceof Error ? "\n" + err.stack : "") + "\n");
  } catch (e) {}
  
  return res.status(500).json({ error: "Ocurrió un error inesperado en el servidor" });
}
