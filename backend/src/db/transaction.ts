import { PoolClient } from "pg";
import { pool } from "./pool";

/**
 * Ejecuta una operación atómica dentro de una transacción PostgreSQL.
 * Realiza BEGIN al inicio, COMMIT al completar exitosamente,
 * y ROLLBACK automático si ocurre cualquier excepción.
 */
export async function withTransaction<T>(
  callback: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await callback(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch (rollbackError) {
      console.error("Error al ejecutar ROLLBACK en la transacción:", rollbackError);
    }
    throw error;
  } finally {
    client.release();
  }
}
