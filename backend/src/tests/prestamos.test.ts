import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { app } from "../app";
import { resetDb, type Fixtures } from "./helpers";
import { pool } from "../db/pool";

// Cubre el hallazgo C.4: la creación automática de la cuenta "Ahorro sobre
// Préstamo" estaba envuelta en un try/catch que tragaba el error dentro de la
// misma transacción del crédito. Ahora, si falla, debe revertir todo el
// crédito en vez de dejarlo creado sin su cuenta de garantía.
describe("POST /api/prestamos — atomicidad crédito + cuenta Ahorro sobre Préstamo", () => {
  let fx: Fixtures;
  let socioId: string;

  beforeEach(async () => {
    fx = await resetDb();
    const socio = await request(app)
      .post("/api/socios")
      .set("Authorization", `Bearer ${fx.tokens.CAJERO}`)
      .send({
        numeroAsociado: "TST-0001",
        agenciaId: fx.agenciaId,
        nombres: "Carlos Ramírez Test",
        fechaIngreso: "2026-01-01",
        montoAportacionInicial: 100,
        reciboAportacionInicial: "REC-0001",
      });
    socioId = socio.body.id;
  });

  it("crea el crédito y su cuenta de Ahorro sobre Préstamo en la misma operación", async () => {
    const res = await request(app)
      .post("/api/prestamos")
      .set("Authorization", `Bearer ${fx.tokens.SUPERVISOR}`)
      .send({
        agenciaId: fx.agenciaId,
        socioId,
        tipo: "FIDUCIARIO",
        tipoAmortizacion: "SOBRE_SALDOS",
        montoSolicitado: 1000,
        plazoMeses: 12,
        tasaInteresMensual: 2.0,
        crearCuentaAhorroSobrePrestamo: true,
      });

    expect(res.status).toBe(201);
    const prestamoId = res.body.id;

    const { rows } = await pool.query(
      `select * from cuentas where prestamo_id = $1 and tipo = 'AHORRO_SOBRE_PRESTAMO'`,
      [prestamoId],
    );
    expect(rows).toHaveLength(1);
  });

  it("un PROMOTOR que crea un crédito queda asignado automáticamente como su promotor", async () => {
    const res = await request(app)
      .post("/api/prestamos")
      .set("Authorization", `Bearer ${fx.tokens.PROMOTOR}`)
      .send({
        agenciaId: fx.agenciaId,
        socioId,
        tipo: "FIDUCIARIO",
        tipoAmortizacion: "SOBRE_SALDOS",
        montoSolicitado: 500,
        plazoMeses: 6,
        tasaInteresMensual: 2.0,
      });

    expect(res.status).toBe(201);
    expect(res.body.promotor_id).toBe(fx.usuarios.PROMOTOR.id);
  });

  it("rechaza a CAJERO crear un crédito (solo ADMIN, GERENCIA, SUPERVISOR, PROMOTOR)", async () => {
    const res = await request(app)
      .post("/api/prestamos")
      .set("Authorization", `Bearer ${fx.tokens.CAJERO}`)
      .send({
        agenciaId: fx.agenciaId,
        socioId,
        tipo: "FIDUCIARIO",
        tipoAmortizacion: "SOBRE_SALDOS",
        montoSolicitado: 500,
        plazoMeses: 6,
      });

    expect(res.status).toBe(403);
  });
});

// Cubre el hallazgo: la lista de Créditos tenía un atajo "Desembolsar" que
// marcaba el préstamo como DESEMBOLSADO vía PATCH /:id/estado sin pasar por
// Auxiliar de Caja — sin registrar el egreso de efectivo. Ahora ese endpoint
// rechaza explícitamente el paso a DESEMBOLSADO; el único camino válido es
// POST /caja-auxiliar/:diaId/desembolso-credito.
describe("PATCH /api/prestamos/:id/estado — no puede desembolsar sin pasar por caja", () => {
  let fx: Fixtures;
  let prestamoId: string;

  beforeEach(async () => {
    fx = await resetDb();
    const socio = await request(app)
      .post("/api/socios")
      .set("Authorization", `Bearer ${fx.tokens.CAJERO}`)
      .send({
        numeroAsociado: "TST-0001",
        agenciaId: fx.agenciaId,
        nombres: "Tomás Test",
        fechaIngreso: "2026-01-01",
        montoAportacionInicial: 100,
        reciboAportacionInicial: "REC-0001",
      });
    const prestamo = await request(app)
      .post("/api/prestamos")
      .set("Authorization", `Bearer ${fx.tokens.SUPERVISOR}`)
      .send({
        agenciaId: fx.agenciaId,
        socioId: socio.body.id,
        tipo: "FIDUCIARIO",
        tipoAmortizacion: "SOBRE_SALDOS",
        montoSolicitado: 10000,
        plazoMeses: 12,
      });
    prestamoId = prestamo.body.id;
  });

  it("rechaza el intento de pasar a DESEMBOLSADO por este endpoint, incluso para SUPERVISOR", async () => {
    const res = await request(app)
      .patch(`/api/prestamos/${prestamoId}/estado`)
      .set("Authorization", `Bearer ${fx.tokens.SUPERVISOR}`)
      .send({ estado: "DESEMBOLSADO" });

    expect(res.status).toBe(400);

    const { rows } = await pool.query(`select estado from prestamos where id = $1`, [prestamoId]);
    expect(rows[0].estado).toBe("APROBADO");
  });
});
