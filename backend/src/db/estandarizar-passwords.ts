import "dotenv/config";
import { pool } from "./pool";
import { hashPassword } from "../utils/auth";

export async function estandarizarPasswords() {
  const hash = await hashPassword("Comif2026!");
  const { rows } = await pool.query(
    "UPDATE usuarios SET password_hash = $1, updated_at = NOW() RETURNING nombre, email, rol, activo",
    [hash]
  );
  console.log("\n✅ Contraseña institucional uniforme 'Comif2026!' configurada para todos los usuarios:");
  console.table(rows);
}

if (require.main === module) {
  estandarizarPasswords()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
