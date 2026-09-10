import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { app } from "../app";
import { resetDb, type Fixtures } from "./helpers";
import { pool } from "../db/pool";

// Cubre el hallazgo C.6: crear un socio insertaba el socio y su cuenta de
// aportación en dos queries separadas sin transacción. Ahora ambos inserts
// están dentro de un único withTransaction.
describe("POST /api/socios — atomicidad socio + cuenta de aportación", () => {
  let fx: Fixtures;

  beforeEach(async () => {
    fx = await resetDb();
  });

  function datosSocio(numeroAsociado: string) {
    return {
      numeroAsociado,
      agenciaId: fx.agenciaId,
      nombres: "María López Test",
      fechaIngreso: "2026-01-01",
      montoAportacionInicial: 150,
      reciboAportacionInicial: "REC-0001",
    };
  }

  it("crea el socio y su cuenta de APORTACION juntos, con el monto correcto", async () => {
    const res = await request(app)
      .post("/api/socios")
      .set("Authorization", `Bearer ${fx.tokens.CAJERO}`)
      .send(datosSocio("TST-0001"));

    expect(res.status).toBe(201);
    const socioId = res.body.id;

    const { rows } = await pool.query(
      `select * from cuentas where socio_id = $1 and tipo = 'APORTACION'`,
      [socioId],
    );
    expect(rows).toHaveLength(1);
    expect(Number(rows[0].saldo_inicial)).toBe(150);
    expect(rows[0].estado).toBe("ACTIVA");
  });

  it("un número de asociado duplicado se rechaza sin crear registros huérfanos", async () => {
    const primero = await request(app)
      .post("/api/socios")
      .set("Authorization", `Bearer ${fx.tokens.CAJERO}`)
      .send(datosSocio("TST-0002"));
    expect(primero.status).toBe(201);

    const duplicado = await request(app)
      .post("/api/socios")
      .set("Authorization", `Bearer ${fx.tokens.CAJERO}`)
      .send(datosSocio("TST-0002"));
    expect(duplicado.status).toBe(409);

    const { rows: socios } = await pool.query(`select count(*)::int as total from socios`);
    expect(socios[0].total).toBe(1);
    const { rows: cuentas } = await pool.query(`select count(*)::int as total from cuentas`);
    expect(cuentas[0].total).toBe(1);
  });
});
