// Aplica db/schema.sql contra la base de datos indicada en DATABASE_URL.
// El script es idempotente: se puede correr varias veces sin error.
import "dotenv/config";
import { readFileSync } from "node:fs";
import path from "node:path";
import { pool } from "./pool";

async function main() {
  const sqlPath = path.join(__dirname, "..", "..", "db", "schema.sql");
  const sql = readFileSync(sqlPath, "utf-8");
  console.log(`Aplicando ${sqlPath} ...`);
  await pool.query(sql);
  console.log("Esquema aplicado correctamente.");
  await pool.end();
}

main().catch((err) => {
  console.error("Falló la migración:", err);
  process.exit(1);
});
