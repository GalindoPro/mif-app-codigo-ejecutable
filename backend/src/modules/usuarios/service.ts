import { pool } from "../../db/pool";
import { hashPassword } from "../../utils/auth";
import { RolUsuario, UsuarioPublico } from "../../types/models";
import { badRequest, conflict } from "../../utils/errors";

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
