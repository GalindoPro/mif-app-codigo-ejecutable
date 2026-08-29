import { pool } from "../../db/pool";
import { comparePassword, signToken } from "../../utils/auth";
import { unauthorized } from "../../utils/errors";
import { Usuario, UsuarioAutenticado } from "../../types/models";

export async function login(email: string, password: string) {
  const { rows } = await pool.query<Usuario>(
    `select * from usuarios where lower(email) = lower($1) limit 1`,
    [email],
  );
  const usuario = rows[0];
  if (!usuario || !usuario.activo) throw unauthorized("Correo o contraseña incorrectos");

  const ok = await comparePassword(password, usuario.password_hash);
  if (!ok) throw unauthorized("Correo o contraseña incorrectos");

  const payload: UsuarioAutenticado = {
    id: usuario.id,
    nombre: usuario.nombre,
    email: usuario.email,
    rol: usuario.rol,
    agenciaId: usuario.agencia_id,
  };
  return { token: signToken(payload), usuario: payload };
}
