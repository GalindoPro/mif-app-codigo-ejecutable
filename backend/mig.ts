import { config } from "dotenv";
config();
import { pool } from "./src/db/pool";

async function run() {
  try {
    await pool.query(`alter table cobros_campo add column pago_capital numeric(14,2) not null default 0`);
    await pool.query(`alter table cobros_campo add column pago_interes numeric(14,2) not null default 0`);
    await pool.query(`alter table cobros_campo add column pago_mora numeric(14,2) not null default 0`);
    await pool.query(`alter table cobros_campo add column ahorro_prestamo numeric(14,2) not null default 0`);
    console.log("Migration successful");
  } catch (e) {
    console.log("Migration error, might already exist", e);
  } finally {
    process.exit(0);
  }
}
run();
