import { NextFunction, Request, Response } from "express";
import { verifyToken, jtiEstaRevocado } from "../utils/auth";
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
    const decoded = verifyToken(header.slice("Bearer ".length));
    if (decoded.jti && jtiEstaRevocado(decoded.jti)) {
      return next(unauthorized("Sesión revocada. Por favor inicia sesión nuevamente."));
    }
    req.user = decoded;
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

// ADMIN y GERENCIA ven todas las agencias; SUPERVISOR y CAJERO quedan
// limitados a la suya. Devuelve el id de agencia por el que hay que filtrar,
// o null si el usuario puede ver todas.
export function agenciaVisible(req: Request): string | null {
  if (!req.user) throw unauthorized();
  if (req.user.rol === "ADMIN" || req.user.rol === "GERENCIA") return null;
  return req.user.agenciaId;
}
