import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    globals: false,
    setupFiles: ["./src/tests/env.setup.ts", "./src/tests/db.setup.ts"],
    // Pruebas de integración contra Postgres real: se ejecutan en serie para
    // evitar que dos archivos truncando/leyendo las mismas tablas interfieran.
    fileParallelism: false,
    testTimeout: 15000,
    hookTimeout: 30000,
  },
});
