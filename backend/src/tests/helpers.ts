import { pool } from "../db/pool";
import { hashPassword, signTokenConJti } from "../utils/auth";
import type { RolUsuario, UsuarioAutenticado } from "../types/models";

const ROLES: RolUsuario[] = ["ADMIN", "GERENCIA", "SUPERVISOR", "CAJERO", "PROMOTOR"];

let cachedPasswordHash: Promise<string> | null = null;
function passwordHashDePrueba(): Promise<string> {
  if (!cachedPasswordHash) cachedPasswordHash = hashPassword("Prueba123!");
  return cachedPasswordHash;
}

export interface Fixtures {
  agenciaId: string;
  agenciaCodigo: string;
  usuarios: Record<RolUsuario, UsuarioAutenticado>;
  tokens: Record<RolUsuario, string>;
}

/**
 * Deja la base de prueba en blanco (trunca en cascada desde agencias/usuarios,
 * que arrastra todo lo demás) y siembra una agencia + un usuario de cada rol.
 * Se debe llamar en un beforeEach de cada archivo de pruebas.
 */
export async function resetDb(): Promise<Fixtures> {
  await pool.query(`truncate table agencias, usuarios cascade`);

  const { rows: agRows } = await pool.query(
    `insert into agencias (codigo, nombre, direccion, activa) values ('TST', 'Agencia de Prueba', 'Dirección de prueba', true) returning *`,
  );
  const agencia = agRows[0];

  const hash = await passwordHashDePrueba();
  const usuarios = {} as Record<RolUsuario, UsuarioAutenticado>;
  const tokens = {} as Record<RolUsuario, string>;

  for (const rol of ROLES) {
    // ADMIN y GERENCIA ven todas las agencias (agenciaVisible en middleware/auth.ts),
    // por eso no quedan atados a una agencia específica, igual que en db/seed.ts.
    const agenciaIdUsuario = rol === "ADMIN" || rol === "GERENCIA" ? null : agencia.id;
    const { rows } = await pool.query(
      `insert into usuarios (nombre, email, password_hash, rol, agencia_id)
       values ($1, $2, $3, $4, $5) returning *`,
      [`Usuario ${rol}`, `${rol.toLowerCase()}@test.mif`, hash, rol, agenciaIdUsuario],
    );
    const u = rows[0];
    const usuarioAuth: UsuarioAutenticado = {
      id: u.id,
      nombre: u.nombre,
      email: u.email,
      rol: u.rol,
      agenciaId: u.agencia_id,
    };
    usuarios[rol] = usuarioAuth;
    tokens[rol] = signTokenConJti(usuarioAuth).token;
  }

  return { agenciaId: agencia.id, agenciaCodigo: agencia.codigo, usuarios, tokens };
}
