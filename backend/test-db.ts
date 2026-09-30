import { Pool } from 'pg';
const pool = new Pool({ connectionString: 'postgresql://postgres:postgres@localhost:5432/mif_db' });
async function run() {
  const prestamos = await pool.query('SELECT promotor_id, count(*) FROM prestamos GROUP BY promotor_id;');
  console.log("Prestamos:", prestamos.rows);
  const pendientes = await pool.query("SELECT * FROM cuentas WHERE tipo='APORTACION' AND estado='PENDIENTE'");
  console.log("Aportaciones pendientes:", pendientes.rows.length);
  process.exit(0);
}
run();
