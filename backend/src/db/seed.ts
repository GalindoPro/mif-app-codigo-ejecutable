// Crea la agencia y el usuario administrador iniciales. Se puede correr una
// sola vez después de aplicar db/schema.sql (npm run db:migrate && npm run db:seed).
import "dotenv/config";
import { pool } from "./pool";
import { hashPassword } from "../utils/auth";

async function main() {
  const { rows: agencias } = await pool.query(
    `insert into agencias (codigo, nombre, direccion)
     values ('CHAJUL', 'Agencia Chajul', 'Chajul, Quiché')
     on conflict (codigo) do update set nombre = excluded.nombre
     returning *`,
  );
  const agencia = agencias[0];
  console.log(`Agencia lista: ${agencia.nombre} (${agencia.id})`);

  const email = "admin@mif.coop";
  const passwordTemporal = "CambiaEsto123!";
  const passwordHash = await hashPassword(passwordTemporal);

  await pool.query(
    `insert into usuarios (nombre, email, password_hash, rol, agencia_id)
     values ('Administrador MIF', $1, $2, 'ADMIN', null)
     on conflict (email) do update set password_hash = excluded.password_hash`,
    [email, passwordHash],
  );

  const promotorEmail = "promotor@mif.coop";
  const promotorHash = await hashPassword(passwordTemporal);

  await pool.query(
    `insert into usuarios (nombre, email, password_hash, rol, agencia_id)
     values ('Carlos Promotor Chajul', $1, $2, 'PROMOTOR', $3)
     on conflict (email) do update set password_hash = excluded.password_hash`,
    [promotorEmail, promotorHash, agencia.id],
  );

  const supervisorEmail = "supervisor@mif.coop";
  const supervisorHash = await hashPassword(passwordTemporal);

  await pool.query(
    `insert into usuarios (nombre, email, password_hash, rol, agencia_id)
     values ('Marta Supervisora Chajul', $1, $2, 'SUPERVISOR', $3)
     on conflict (email) do update set password_hash = excluded.password_hash`,
    [supervisorEmail, supervisorHash, agencia.id],
  );

  const cajeroEmail = "cajero@mif.coop";
  const cajeroHash = await hashPassword(passwordTemporal);

  await pool.query(
    `insert into usuarios (nombre, email, password_hash, rol, agencia_id)
     values ('Ana Cajera Chajul', $1, $2, 'CAJERO', $3)
     on conflict (email) do update set password_hash = excluded.password_hash`,
    [cajeroEmail, cajeroHash, agencia.id],
  );

  console.log("Usuarios listos:");
  console.log(`  Admin:       ${email}`);
  console.log(`  Supervisor:  ${supervisorEmail}`);
  console.log(`  Cajero:      ${cajeroEmail}`);
  console.log(`  Promotor:    ${promotorEmail}`);
  console.log(`  Contraseña para todos: ${passwordTemporal}`);

  await pool.end();
}

main().catch((err) => {
  console.error("Falló el seed:", err);
  process.exit(1);
});
