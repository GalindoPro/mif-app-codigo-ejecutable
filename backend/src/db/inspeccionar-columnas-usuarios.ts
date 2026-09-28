import "dotenv/config";
import { pool } from "./pool";

async function checkCols() {
  const tables = [
    "caja_dias",
    "caja_movimientos_auxiliar",
    "caja_arqueos",
    "arqueos_caja",
    "movimientos",
    "movimientos_caja",
    "auditoria",
    "ingresos_comif",
    "cobros_campo"
  ];
  for (const t of tables) {
    const { rows } = await pool.query(
      `SELECT column_name FROM information_schema.columns 
       WHERE table_name = $1 AND table_schema = 'public' 
       ORDER BY ordinal_position`,
      [t]
    );
    console.log(t, "->", rows.map((r) => r.column_name).join(", "));
  }
}

checkCols()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
