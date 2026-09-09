import { pool } from "../../db/pool";
import { comparePassword, signTokenConJti, revocarJti } from "../../utils/auth";
import { unauthorized, notFound } from "../../utils/errors";
import { Usuario, UsuarioAutenticado } from "../../types/models";

export async function login(email: string, password: string, ip?: string, userAgent?: string) {
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

  const { token, jti, expiresAt } = signTokenConJti(payload);

  // Registrar la sesión en BD (best-effort — no bloquea el login si falla)
  pool.query(
    `insert into sesiones (jti, usuario_id, ip, user_agent, expires_at)
     values ($1, $2, $3, $4, $5)`,
    [jti, usuario.id, ip ?? null, userAgent ?? null, expiresAt],
  ).catch(() => {});

  return { token, usuario: payload };
}

export async function listarSesiones(usuarioId: string, esAdmin: boolean, filtroPorUsuario?: string) {
  const filtroId = esAdmin && filtroPorUsuario ? filtroPorUsuario : usuarioId;
  const where = esAdmin && !filtroPorUsuario ? "" : `where s.usuario_id = $1`;
  const params = esAdmin && !filtroPorUsuario ? [] : [filtroId];

  const { rows } = await pool.query(
    `select s.jti, s.usuario_id, s.ip, s.user_agent, s.activa,
            s.created_at, s.expires_at, s.revocada_at,
            u.nombre as usuario_nombre, u.rol as usuario_rol,
            rv.nombre as revocada_por_nombre
     from sesiones s
     join usuarios u on u.id = s.usuario_id
     left join usuarios rv on rv.id = s.revocada_por
     ${where}
     order by s.created_at desc
     limit 100`,
    params,
  );
  return rows;
}

export async function revocarSesion(jti: string, revocadaPor: string) {
  const { rows } = await pool.query(
    `update sesiones set activa = false, revocada_at = now(), revocada_por = $1
     where jti = $2 and activa = true
     returning *`,
    [revocadaPor, jti],
  );
  if (!rows[0]) throw notFound("Sesión no encontrada o ya revocada");
  revocarJti(jti); // marcar en blocklist de memoria
  return rows[0];
}

export async function revocarTodasLasSesiones(usuarioId: string, exceptoJti: string, revocadaPor: string) {
  const { rows } = await pool.query(
    `update sesiones set activa = false, revocada_at = now(), revocada_por = $1
     where usuario_id = $2 and activa = true and jti != $3
     returning jti`,
    [revocadaPor, usuarioId, exceptoJti],
  );
  for (const r of rows) revocarJti(r.jti);
  return { revocadas: rows.length };
}
