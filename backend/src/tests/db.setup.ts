// Aplica el esquema real (db/schema.sql, el mismo que usa producción) contra
// mif_test antes de correr las pruebas de este archivo. Se ejecuta después de
// env.setup.ts, así que process.env.DATABASE_URL ya apunta a mif_test.
import { readFileSync } from "node:fs";
import path from "node:path";
import { beforeAll, afterAll } from "vitest";
import { pool } from "../db/pool";

beforeAll(async () => {
  const sqlPath = path.join(__dirname, "..", "..", "db", "schema.sql");
  const sql = readFileSync(sqlPath, "utf-8");
  await pool.query(sql);
});

afterAll(async () => {
  await pool.end();
});
