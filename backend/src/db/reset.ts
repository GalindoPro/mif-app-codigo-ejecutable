import "dotenv/config";
import { pool } from "./pool";

async function main() {
  console.log("Reiniciando datos del sistema...");
  await pool.query(`
    TRUNCATE TABLE
      prestamos,
      caja_arqueos,
      caja_movimientos_auxiliar,
      caja_dias,
      caja_chica_comprobantes,
      ingresos_comif,
      plazo_fijo_contratos,
      movimientos,
      cuentas,
      socios,
      auditoria
    CASCADE;
  `);

  await pool.query(`
    insert into agencias (codigo, nombre, direccion, activa)
    values ('CHAJUL', 'Agencia Chajul', 'Chajul, Quiché', true)
    on conflict (codigo) do update set activa = true;
  `);

  console.log("Sistema reiniciado desde cero exitosamente.");
  await pool.end();
}

main().catch((err) => {
  console.error("Error al reiniciar:", err);
  process.exit(1);
});
