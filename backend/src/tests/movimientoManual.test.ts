import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { app } from "../app";
import { resetDb, type Fixtures } from "./helpers";

// Cubre el hallazgo: el formulario de "Nuevo Movimiento Manual" permitía
// elegir categorías de préstamo (abono/interés/mora, desembolso) que solo
// deben registrarse desde su flujo estructurado (cobro de cuota /
// desembolso) — esas sí actualizan saldo_capital y crean prestamo_pagos.
// Registradas a mano, el efectivo queda contado en la caja pero el crédito
// nunca se entera del pago. El endpoint ahora rechaza esas categorías.
describe("POST /api/caja-auxiliar/:id/movimientos — rechaza categorías de uso interno", () => {
  let fx: Fixtures;
  let diaId: string;

  beforeEach(async () => {
    fx = await resetDb();
    const dia = await request(app)
      .post("/api/caja-auxiliar/abrir")
      .set("Authorization", `Bearer ${fx.tokens.CAJERO}`)
      .send({ agenciaId: fx.agenciaId, saldoInicial: 500 });
    diaId = dia.body.id;
  });

  it.each([
    "ABONO_PRESTAMO_FIDUCIARIO",
    "INTERES_PRESTAMO_FIDUCIARIO",
    "MORA_PRESTAMO_FIDUCIARIO",
    "ABONO_PRESTAMO_HIPOTECARIO",
    "INTERES_PRESTAMO_HIPOTECARIO",
    "MORA_PRESTAMO_HIPOTECARIO",
    "COLOCACION_PRESTAMO",
  ])("rechaza la categoría %s en el registro manual", async (categoria) => {
    const res = await request(app)
      .post(`/api/caja-auxiliar/${diaId}/movimientos`)
      .set("Authorization", `Bearer ${fx.tokens.CAJERO}`)
      .send({ categoria, monto: 500 });

    expect(res.status).toBe(400);
  });

  it("sigue aceptando una categoría manual normal (Ingreso vario)", async () => {
    const res = await request(app)
      .post(`/api/caja-auxiliar/${diaId}/movimientos`)
      .set("Authorization", `Bearer ${fx.tokens.CAJERO}`)
      .send({ categoria: "INGRESO_VARIO", monto: 50, beneficiario: "Prueba" });

    expect(res.status).toBe(201);
  });
});
