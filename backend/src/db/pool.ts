import { Pool, QueryConfig, QueryResult, QueryResultRow } from "pg";

const isLocal =
  !process.env.DATABASE_URL ||
  process.env.DATABASE_URL.includes("localhost") ||
  process.env.DATABASE_URL.includes("127.0.0.1");

// Supabase Transaction Pooler (puerto 6543) permite ~10 conexiones en el plan
// gratuito. Con max=5 dejamos margen para múltiples requests concurrentes.
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: isLocal ? false : { rejectUnauthorized: false },
  max: 5,                        // Máximo de conexiones en el pool
  idleTimeoutMillis: 30000,      // Liberar conexiones ociosas tras 30 s
  connectionTimeoutMillis: 8000, // Esperar hasta 8 s para obtener una conexión
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000,
});

pool.on("error", (err) => {
  // eslint-disable-next-line no-console
  console.error("Error inesperado en el pool de PostgreSQL", err);
});

// ─── Helper con reintentos automáticos ─────────────────────────────────────
// Reintenta la query hasta `intentos` veces si ocurre un error de conexión
// transitorio (timeout / connection terminated). Pausa exponencial entre intentos.
const ERRORES_TRANSITORIOS = [
  "Connection terminated",
  "Connection terminated due to connection timeout",
  "timeout exceeded when trying to connect",
  "ECONNRESET",
  "ECONNREFUSED",
];

function esErrorTransitorio(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return ERRORES_TRANSITORIOS.some((e) => msg.includes(e));
}

export async function queryWithRetry<R extends QueryResultRow = QueryResultRow>(
  queryOrText: string | QueryConfig<unknown[]>,
  values?: unknown[],
  intentos = 3,
): Promise<QueryResult<R>> {
  let ultimo: unknown;
  for (let i = 0; i < intentos; i++) {
    try {
      return values
        ? await pool.query<R>(queryOrText as string, values)
        : await pool.query<R>(queryOrText as QueryConfig<unknown[]>);
    } catch (err) {
      ultimo = err;
      if (!esErrorTransitorio(err)) throw err;          // Error no recuperable
      const espera = 300 * Math.pow(2, i);              // 300 ms, 600 ms, 1.2 s
      // eslint-disable-next-line no-console
      console.warn(`[pool] Error de conexión (intento ${i + 1}/${intentos}). Reintentando en ${espera} ms...`);
      await new Promise((r) => setTimeout(r, espera));
    }
  }
  throw ultimo;
}
