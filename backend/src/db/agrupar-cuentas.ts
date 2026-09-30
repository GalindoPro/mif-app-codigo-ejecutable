import "dotenv/config";
import { pool } from "./pool";

async function run() {
  console.log("Iniciando agrupación de cuentas duplicadas por socio y tipo...");
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const { rows: duplicados } = await client.query(`
      SELECT socio_id, tipo, array_agg(id ORDER BY created_at ASC) as cuentas_ids
      FROM cuentas
      WHERE tipo != 'AHORRO_PLAZO_FIJO'
      GROUP BY socio_id, tipo
      HAVING count(id) > 1
    `);

    console.log(`Se encontraron ${duplicados.length} grupos de cuentas duplicadas.`);

    let cuentasEliminadas = 0;
    let movimientosActualizados = 0;

    for (const grupo of duplicados) {
      const ids = grupo.cuentas_ids;
      const cuentaMaestraId = ids[0]; // Conservamos la primera creada
      const cuentasAColapsar = ids.slice(1);

      // 1. Reasignar movimientos a la cuenta maestra
      const resMov = await client.query(`
        UPDATE movimientos
        SET cuenta_id = $1
        WHERE cuenta_id = ANY($2)
      `, [cuentaMaestraId, cuentasAColapsar]);
      movimientosActualizados += resMov.rowCount || 0;

      // 2. Eliminar las cuentas duplicadas
      const resDel = await client.query(`
        DELETE FROM cuentas
        WHERE id = ANY($1)
      `, [cuentasAColapsar]);
      cuentasEliminadas += resDel.rowCount || 0;
    }

    await client.query("COMMIT");
    console.log(`✅ ¡Éxito!`);
    console.log(`Se agruparon movimientos en cuentas maestras.`);
    console.log(`Se eliminaron ${cuentasEliminadas} cuentas duplicadas vaciadas.`);
    console.log(`Se reasignaron ${movimientosActualizados} movimientos.`);

  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error durante la agrupación:", error);
  } finally {
    client.release();
    process.exit(0);
  }
}

run();
