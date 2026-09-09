import bcrypt from "bcryptjs";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { UsuarioAutenticado } from "../types/models";

const JWT_SECRET = process.env.JWT_SECRET ?? "";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN ?? "8h";

if (!JWT_SECRET) {
  throw new Error("Falta configurar JWT_SECRET en el archivo .env");
}

// Blocklist en memoria de JTIs revocados (se carga desde BD al revocar)
const _blocklist = new Set<string>();

export const hashPassword = (plain: string) => bcrypt.hash(plain, 10);
export const comparePassword = (plain: string, hash: string) => bcrypt.compare(plain, hash);

export function signTokenConJti(usuario: UsuarioAutenticado): { token: string; jti: string; expiresAt: Date } {
  const jti = crypto.randomUUID();
  const expiresIn = JWT_EXPIRES_IN;
  const token = jwt.sign({ ...usuario, jti }, JWT_SECRET, { expiresIn } as jwt.SignOptions);
  // Calcular fecha de expiración
  const decoded = jwt.decode(token) as { exp?: number };
  const expiresAt = decoded.exp ? new Date(decoded.exp * 1000) : new Date(Date.now() + 8 * 3600 * 1000);
  return { token, jti, expiresAt };
}

// Mantener retrocompatibilidad
export const signToken = (usuario: UsuarioAutenticado) =>
  signTokenConJti(usuario).token;

export const verifyToken = (token: string): UsuarioAutenticado & { jti?: string } =>
  jwt.verify(token, JWT_SECRET) as UsuarioAutenticado & { jti?: string };

export function revocarJti(jti: string) {
  _blocklist.add(jti);
}

export function jtiEstaRevocado(jti: string): boolean {
  return _blocklist.has(jti);
}
