import dotenv from "dotenv";
dotenv.config();

import { pool } from "./src/db/pool";

async function run() {
  try {
    const agenciaId = null;
    const agCondicion = agenciaId ? `AND s.agencia_id = '${agenciaId}'` : "";

    console.log("Running Query 1...");
    const { rows: sinDpi } = await pool.query(`
      SELECT
        s.id, s.numero_asociado, s.nombres, s.estado,
        s.dpi, s.advertencia_importacion, s.created_at,
        COALESCE(a.nombre, 'Sin agencia') AS agencia,
        COUNT(c.id) AS total_cuentas,
        COUNT(m.id) AS total_movimientos
      FROM socios s
      LEFT JOIN agencias a ON a.id = s.agencia_id
      LEFT JOIN cuentas c ON c.socio_id = s.id
      LEFT JOIN movimientos m ON m.cuenta_id = c.id
      WHERE (s.dpi IS NULL OR TRIM(s.dpi) = '' OR LENGTH(TRIM(s.dpi)) < 5)
        ${agCondicion}
      GROUP BY s.id, a.nombre
      ORDER BY s.numero_asociado DESC
    `);
    console.log("Query 1 success. Rows:", sinDpi.length);

    console.log("Running Query 2...");
    const { rows: duplicados } = await pool.query(`
      SELECT
        s1.id AS id1, s1.numero_asociado AS codigo1, s1.nombres AS nombre1,
        s1.dpi AS dpi1,
        s2.id AS id2, s2.numero_asociado AS codigo2, s2.nombres AS nombre2,
        s2.dpi AS dpi2
      FROM socios s1
      JOIN socios s2 ON LOWER(TRIM(s1.nombres)) = LOWER(TRIM(s2.nombres))
        AND s1.id <> s2.id
        AND s1.numero_asociado < s2.numero_asociado
      ${agenciaId ? `WHERE s1.agencia_id = '${agenciaId}' AND s2.agencia_id = '${agenciaId}'` : ""}
      ORDER BY s1.nombres ASC
      LIMIT 50
    `);
    console.log("Query 2 success. Rows:", duplicados.length);

    console.log("Running Query 3...");
    const { rows: stats } = await pool.query(`
      SELECT
        COUNT(*) AS total_socios,
        COUNT(*) FILTER (WHERE dpi IS NOT NULL AND TRIM(dpi) <> '' AND LENGTH(TRIM(dpi)) >= 5) AS con_dpi,
        COUNT(*) FILTER (WHERE dpi IS NULL OR TRIM(dpi) = '' OR LENGTH(TRIM(dpi)) < 5) AS sin_dpi,
        COUNT(*) FILTER (WHERE advertencia_importacion IS NOT NULL) AS con_advertencia
      FROM socios s
      ${agenciaId ? `WHERE s.agencia_id = '${agenciaId}'` : ""}
    `);
    console.log("Query 3 success. Stats:", stats[0]);

  } catch (err) {
    console.error("Error executing queries:", err);
  } finally {
    await pool.end();
  }
}

run();
