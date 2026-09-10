import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { app } from "../app";
import { resetDb, type Fixtures } from "./helpers";

// Cubre el hallazgo C.5: dos egresos concurrentes podían leer el mismo saldo
// disponible y ambos pasar la validación antes de que cualquiera quedara
// insertado, sobregirando la caja chica. Ahora la validación + inserción
// corren en una transacción serializada con pg_advisory_xact_lock por agencia.
describe("POST /api/caja-chica — condición de carrera en egresos concurrentes", () => {
  let fx: Fixtures;

  beforeEach(async () => {
    fx = await resetDb();
    await request(app)
      .post("/api/caja-chica")
      .set("Authorization", `Bearer ${fx.tokens.ADMIN}`)
      .send({
        agenciaId: fx.agenciaId,
        fecha: "2026-01-01",
        beneficiario: "Reposición inicial",
        descripcion: "Fondo fijo inicial",
        tipo: "INGRESO",
        monto: 100,
      });
  });

  it("nunca deja que dos egresos concurrentes sobregiren el saldo disponible (Q100)", async () => {
    const egreso = () =>
      request(app)
        .post("/api/caja-chica")
        .set("Authorization", `Bearer ${fx.tokens.CAJERO}`)
        .send({
          agenciaId: fx.agenciaId,
          fecha: "2026-01-01",
          beneficiario: "Proveedor X",
          descripcion: "Compra de suministros",
          tipo: "EGRESO",
          categoria: "SUMINISTROS_OFICINA",
          monto: 80,
        });

    const [r1, r2] = await Promise.all([egreso(), egreso()]);
    const statuses = [r1.status, r2.status].sort();

    // Uno de los dos debe rechazarse: 80 + 80 = 160 > 100 disponibles.
    expect(statuses).toEqual([201, 409]);

    const reporte = await request(app)
      .get("/api/caja-chica")
      .set("Authorization", `Bearer ${fx.tokens.CAJERO}`)
      .query({});
    expect(reporte.body.saldoActual).toBeGreaterThanOrEqual(0);
    expect(reporte.body.saldoActual).toBe(20);
  });
});
