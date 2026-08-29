import { pool } from "../../db/pool";
import { Agencia } from "../../types/models";
import { conflict } from "../../utils/errors";

export async function listar(): Promise<Agencia[]> {
  const { rows } = await pool.query<Agencia>(`select * from agencias order by nombre`);
  return rows;
}

export async function crear(data: { codigo: string; nombre: string; direccion?: string }) {
  try {
    const { rows } = await pool.query<Agencia>(
      `insert into agencias (codigo, nombre, direccion) values ($1, $2, $3) returning *`,
      [data.codigo.toUpperCase(), data.nombre, data.direccion ?? null],
    );
    return rows[0];
  } catch (err) {
    if (typeof err === "object" && err && "code" in err && (err as { code: string }).code === "23505") {
      throw conflict(`Ya existe una agencia con el código "${data.codigo}"`);
    }
    throw err;
  }
}
