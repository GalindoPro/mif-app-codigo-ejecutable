import { pool } from "../../db/pool";
import { hashPassword } from "../../utils/auth";
import { RolUsuario, UsuarioPublico } from "../../types/models";
import { badRequest, conflict, notFound } from "../../utils/errors";

const PUBLIC_COLUMNS = "id, nombre, email, rol, activo, agencia_id, created_at, updated_at";

export async function listar(agenciaId: string | null) {
  const query = `
    select u.id, u.nombre, u.email, u.rol, u.activo, u.agencia_id, u.created_at, u.updated_at,
           a.nombre as agencia_nombre, a.codigo as agencia_codigo
    from usuarios u
    left join agencias a on a.id = u.agencia_id
    ${agenciaId ? "where u.agencia_id = $1" : ""}
    order by u.nombre
  `;
  const { rows } = agenciaId ? await pool.query(query, [agenciaId]) : await pool.query(query);
  return rows;
}

export async function crear(data: {
  nombre: string;
  email: string;
  password: string;
  rol: RolUsuario;
  agenciaId?: string | null;
}): Promise<UsuarioPublico> {
  if ((data.rol === "SUPERVISOR" || data.rol === "CAJERO" || data.rol === "PROMOTOR") && !data.agenciaId) {
    throw badRequest("Un usuario Supervisor, Cajero o Promotor debe pertenecer a una agencia");
  }
  const passwordHash = await hashPassword(data.password);
  try {
    const { rows } = await pool.query(
      `insert into usuarios (nombre, email, password_hash, rol, agencia_id)
       values ($1, $2, $3, $4, $5)
       returning ${PUBLIC_COLUMNS}`,
      [data.nombre, data.email.toLowerCase(), passwordHash, data.rol, data.agenciaId ?? null],
    );
    return rows[0];
  } catch (err) {
    if (typeof err === "object" && err && "code" in err && (err as { code: string }).code === "23505") {
      throw conflict(`Ya existe un usuario con el correo "${data.email}"`);
    }
    throw err;
  }
}

export async function actualizar(
  id: string,
  data: {
    nombre?: string;
    email?: string;
    rol?: RolUsuario;
    agenciaId?: string | null;
    activo?: boolean;
  }
): Promise<UsuarioPublico> {
  const { rows: existing } = await pool.query("select id, rol, agencia_id from usuarios where id = $1", [id]);
  if (!existing[0]) throw notFound("Usuario no encontrado");

  const targetRol = data.rol ?? existing[0].rol;
  const targetAgencia = data.agenciaId !== undefined ? data.agenciaId : existing[0].agencia_id;

  if ((targetRol === "SUPERVISOR" || targetRol === "CAJERO" || targetRol === "PROMOTOR") && !targetAgencia) {
    throw badRequest("Un usuario Supervisor, Cajero o Promotor debe pertenecer a una agencia");
  }

  try {
    const { rows } = await pool.query(
      `update usuarios
       set nombre = coalesce($1, nombre),
           email = coalesce(lower($2), email),
           rol = coalesce($3, rol),
           agencia_id = case when $4::boolean then $5 else agencia_id end,
           activo = coalesce($6, activo),
           updated_at = now()
       where id = $7
       returning ${PUBLIC_COLUMNS}`,
      [
        data.nombre ?? null,
        data.email ?? null,
        data.rol ?? null,
        data.agenciaId !== undefined,
        data.agenciaId ?? null,
        data.activo ?? null,
        id,
      ]
    );
    return rows[0];
  } catch (err) {
    if (typeof err === "object" && err && "code" in err && (err as { code: string }).code === "23505") {
      throw conflict(`Ya existe otro usuario con el correo "${data.email}"`);
    }
    throw err;
  }
}

export async function cambiarPassword(
  id: string,
  nuevaPassword: string
): Promise<{ success: boolean; mensaje: string }> {
  const { rows } = await pool.query("select id from usuarios where id = $1", [id]);
  if (!rows[0]) throw notFound("Usuario no encontrado");

  const passwordHash = await hashPassword(nuevaPassword);
  await pool.query("update usuarios set password_hash = $1, updated_at = now() where id = $2", [passwordHash, id]);
  return { success: true, mensaje: "Contraseña actualizada exitosamente" };
}

export async function toggleActivo(id: string): Promise<UsuarioPublico> {
  const { rows } = await pool.query(
    `update usuarios
     set activo = not activo, updated_at = now()
     where id = $1
     returning ${PUBLIC_COLUMNS}`,
    [id]
  );
  if (!rows[0]) throw notFound("Usuario no encontrado");
  return rows[0];
}

