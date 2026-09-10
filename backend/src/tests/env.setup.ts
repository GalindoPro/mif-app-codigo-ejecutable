// Carga las variables de entorno de PRUEBA antes de que cualquier otro módulo
// (pool de Postgres, JWT_SECRET) se importe y las lea. Debe ser el primer
// archivo de setupFiles en vitest.config.ts y no debe importar nada más:
// cualquier import aquí se evaluaría antes que dotenv.config() (hoisting de
// módulos ES), apuntando por accidente a la base de datos de desarrollo.
import path from "node:path";
import dotenv from "dotenv";

dotenv.config({ path: path.join(__dirname, "..", "..", ".env.test"), override: true });

if (!process.env.DATABASE_URL?.includes("mif_test")) {
  throw new Error(
    "Las pruebas deben correr contra la base de datos 'mif_test'. Revisa backend/.env.test.",
  );
}
