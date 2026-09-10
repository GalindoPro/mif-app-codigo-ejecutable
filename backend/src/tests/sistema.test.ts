import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { app } from "../app";
import { resetDb, type Fixtures } from "./helpers";
import { pool } from "../db/pool";

// Cubre el hallazgo C.1: /sistema/reset y /recargar-datos aceptaban los 5
// roles existentes (equivalente a no tener restricción). Ahora deben exigir
// ADMIN exclusivamente.
describe("POST /api/sistema/reset y /recargar-datos — restricción de rol", () => {
  let fx: Fixtures;

  beforeEach(async () => {
    fx = await resetDb();
  });

  it.each(["GERENCIA", "SUPERVISOR", "CAJERO", "PROMOTOR"] as const)(
    "rechaza /reset para el rol %s con 403",
    async (rol) => {
      const res = await request(app)
        .post("/api/sistema/reset")
        .set("Authorization", `Bearer ${fx.tokens[rol]}`);
      expect(res.status).toBe(403);
    },
  );

  it.each(["GERENCIA", "SUPERVISOR", "CAJERO", "PROMOTOR"] as const)(
    "rechaza /recargar-datos para el rol %s con 403",
    async (rol) => {
      const res = await request(app)
        .post("/api/sistema/recargar-datos")
        .set("Authorization", `Bearer ${fx.tokens[rol]}`);
      expect(res.status).toBe(403);
    },
  );

  it("rechaza ambas rutas sin autenticación", async () => {
    const resReset = await request(app).post("/api/sistema/reset");
    const resRecarga = await request(app).post("/api/sistema/recargar-datos");
    expect(resReset.status).toBe(401);
    expect(resRecarga.status).toBe(401);
  });

  it("permite /reset al rol ADMIN y de verdad limpia los datos transaccionales", async () => {
    await pool.query(
      `insert into socios (numero_asociado, agencia_id, nombres, fecha_ingreso, creado_por_id)
       values ('TST-0001', $1, 'Socio de Prueba', current_date, $2)`,
      [fx.agenciaId, fx.usuarios.ADMIN.id],
    );
    const antes = await pool.query(`select count(*)::int as total from socios`);
    expect(antes.rows[0].total).toBe(1);

    const res = await request(app)
      .post("/api/sistema/reset")
      .set("Authorization", `Bearer ${fx.tokens.ADMIN}`);
    expect(res.status).toBe(200);

    const despues = await pool.query(`select count(*)::int as total from socios`);
    expect(despues.rows[0].total).toBe(0);
  });

  // No se prueba el camino feliz de /recargar-datos: ejecuta `execSync("npm
  // run db:seed:excel")`, un comando de shell real que lee archivos Excel.
  // No es apropiado disparar eso desde una prueba automatizada hermética.
});
