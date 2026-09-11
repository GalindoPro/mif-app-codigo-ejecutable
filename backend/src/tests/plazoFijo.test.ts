import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { app } from "../app";
import { resetDb, type Fixtures } from "./helpers";

// Cubre el hallazgo: PlazoFijoDetail.tsx llamaba POST /plazo-fijo/:id/liquidar
// directo, un atajo que marca el certificado LIQUIDADO y retira de la cuenta
// sin pasar por Auxiliar de Caja — el efectivo entregado nunca queda
// contabilizado en la caja del día. El único camino válido ahora es
// POST /caja-auxiliar/:diaId/liquidar-plazo-fijo.
describe("POST /api/plazo-fijo/:id/liquidar — bloqueado, debe usarse Auxiliar de Caja", () => {
  let fx: Fixtures;
  let contratoId: string;

  beforeEach(async () => {
    fx = await resetDb();
    const socio = await request(app)
      .post("/api/socios")
      .set("Authorization", `Bearer ${fx.tokens.CAJERO}`)
      .send({
        numeroAsociado: "TST-0001",
        agenciaId: fx.agenciaId,
        nombres: "Test Plazo Fijo",
        fechaIngreso: "2026-01-01",
        montoAportacionInicial: 100,
        reciboAportacionInicial: "REC-0001",
      });

    const contrato = await request(app)
      .post("/api/plazo-fijo")
      .set("Authorization", `Bearer ${fx.tokens.CAJERO}`)
      .send({
        agenciaId: fx.agenciaId,
        socioId: socio.body.id,
        montoDeposito: 5000,
        plazoMeses: 6,
        tasaAnual: 6.0,
      });
    expect(contrato.status).toBe(201);
    contratoId = contrato.body.id;
  });

  it("rechaza la liquidación directa, incluso para ADMIN", async () => {
    const res = await request(app)
      .post(`/api/plazo-fijo/${contratoId}/liquidar`)
      .set("Authorization", `Bearer ${fx.tokens.ADMIN}`)
      .send({ reciboRetiro: "RE-0001" });

    expect(res.status).toBe(400);

    const detalle = await request(app)
      .get(`/api/plazo-fijo/${contratoId}`)
      .set("Authorization", `Bearer ${fx.tokens.ADMIN}`);
    expect(detalle.body.estado).toBe("ACTIVO");
  });
});
