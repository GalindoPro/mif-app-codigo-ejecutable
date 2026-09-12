import { NextFunction, Request, Response } from "express";
import { verifyToken } from "../utils/auth";
import { unauthorized, forbidden } from "../utils/errors";
import { RolUsuario, UsuarioAutenticado } from "../types/models";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: UsuarioAutenticado;
    }
  }
}

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) return next(unauthorized());
  try {
    req.user = verifyToken(header.slice("Bearer ".length));
    return next();
  } catch {
    return next(unauthorized("Sesión inválida o expirada"));
  }
}

export function requireRole(...roles: RolUsuario[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) return next(unauthorized());
    if (!roles.includes(req.user.rol)) return next(forbidden());
    return next();
  };
}

// GERENCIA ve todas las agencias; los demás roles quedan limitados a la suya.
// Devuelve el id de agencia por el que hay que filtrar, o null si puede ver todas.
export function agenciaVisible(req: Request): string | null {
  if (!req.user) throw unauthorized();
  if (req.user.rol === "GERENCIA") return null;
  return req.user.agenciaId;
}
