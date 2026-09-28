import "dotenv/config";
import { pool } from "./pool";

export async function unificarCarteraPromotores() {
  const client = await pool.connect();
  try {
    console.log("================================================================================");
    console.log("🚀 UNIFICANDO CARTERA DE CRÉDITOS EN PROMOTOR 1 (DIEGO) Y PROMOTOR 2 (WALTER)");
    console.log("================================================================================\n");

    const { rows: users } = await client.query<{ id: string; email: string; nombre: string }>(
      "SELECT id, email, nombre FROM usuarios WHERE email IN ('diego.promotor@mif.coop', 'walter.promotor@mif.coop')"
    );

    const diego = users.find((u) => u.email === "diego.promotor@mif.coop");
    const walter = users.find((u) => u.email === "walter.promotor@mif.coop");

    if (!diego || !walter) {
      throw new Error("No se encontraron los usuarios de Diego o Walter en la base de datos.");
    }

    console.log(`✓ Promotor 1: ${diego.nombre} (${diego.id})`);
    console.log(`✓ Promotor 2: ${walter.nombre} (${walter.id})\n`);

    // 1. Asignar todos los que estaban POR_REGULARIZAR a Diego (Promotor 1) y pasar a OFICIAL_PROMOTOR
    const rDiego = await client.query(
      `UPDATE prestamos
       SET origen_cartera = 'OFICIAL_PROMOTOR',
           promotor_id = $1,
           updated_at = NOW()
       WHERE origen_cartera = 'POR_REGULARIZAR' OR promotor_id = $1
       RETURNING id`,
      [diego.id]
    );
    console.log(`✓ ${rDiego.rowCount} créditos asignados a Promotor 1: Diego Laynez (OFICIAL_PROMOTOR)`);

    // 2. Asignar los 66 oficiales a Walter (Promotor 2)
    const rWalter = await client.query(
      `UPDATE prestamos
       SET origen_cartera = 'OFICIAL_PROMOTOR',
           promotor_id = $1,
           updated_at = NOW()
       WHERE promotor_id = $1 OR (promotor_id IS NULL AND origen_cartera = 'OFICIAL_PROMOTOR')
       RETURNING id`,
      [walter.id]
    );
    console.log(`✓ ${rWalter.rowCount} créditos asignados a Promotor 2: Walter Mendoza (OFICIAL_PROMOTOR)`);

    // 3. Verificar que no quede ningún crédito como POR_REGULARIZAR
    const rRestantes = await client.query(
      `UPDATE prestamos
       SET origen_cartera = 'OFICIAL_PROMOTOR'
       WHERE origen_cartera != 'OFICIAL_PROMOTOR' OR origen_cartera IS NULL
       RETURNING id`
    );
    if (rRestantes.rowCount && rRestantes.rowCount > 0) {
      console.log(`✓ ${rRestantes.rowCount} créditos restantes regularizados a OFICIAL_PROMOTOR.`);
    }

    // 4. Conteo final de validación
    const { rows: conteo } = await client.query(`
      SELECT 
        u.nombre as promotor,
        u.email,
        COUNT(p.id) as cantidad_creditos,
        COALESCE(SUM(p.saldo_capital), 0) as saldo_cartera_viva
      FROM prestamos p
      LEFT JOIN usuarios u ON u.id = p.promotor_id
      GROUP BY u.nombre, u.email
      ORDER BY u.nombre
    `);

    console.log("\n📊 BALANCE FINAL DE CARTERA UNIFICADA:");
    console.table(conteo);

    console.log("\n✅ Cartera unificada con éxito: 0 créditos pendientes de regularizar.");
  } finally {
    client.release();
  }
}

if (require.main === module) {
  unificarCarteraPromotores()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("❌ Error unificando cartera:", err);
      process.exit(1);
    });
}
