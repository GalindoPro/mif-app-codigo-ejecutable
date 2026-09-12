import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { UsuarioAutenticado } from "../types/models";

const JWT_SECRET = process.env.JWT_SECRET ?? "";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN ?? "8h";

if (!JWT_SECRET) {
  throw new Error("Falta configurar JWT_SECRET en el archivo .env");
}

export const hashPassword = (plain: string) => bcrypt.hash(plain, 10);
export const comparePassword = (plain: string, hash: string) => bcrypt.compare(plain, hash);

export const signToken = (usuario: UsuarioAutenticado) =>
  jwt.sign(usuario, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions);

export const verifyToken = (token: string): UsuarioAutenticado =>
  jwt.verify(token, JWT_SECRET) as UsuarioAutenticado;
