import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { app } from "../app";
import { resetDb, type Fixtures } from "./helpers";
import { pool } from "../db/pool";

// Cubre el comportamiento de cobrarCuotaCredito: el cajero puede cobrar
// cualquier interés/mora (el recibo físico manda), pero el backend recalcula
// la liquidación oficial (mismo motor que /prestamos/:id/liquidacion) y deja
// una marca "diferenciaCalculoOficial" —en la respuesta y en auditoría—
// cuando lo cobrado no coincide con lo calculado.
describe("POST /api/caja-auxiliar/:id/cobro-credito — marca de diferencia contra el cálculo oficial", () => {
  let fx: Fixtures;
  let prestamoId: string;
  let socioId: string;
  let diaId: string;

  beforeEach(async () => {
    fx = await resetDb();

    const socio = await request(app)
      .post("/api/socios")
      .set("Authorization", `Bearer ${fx.tokens.CAJERO}`)
      .send({
        numeroAsociado: "TST-0001",
        agenciaId: fx.agenciaId,
        nombres: "Juan Pérez Test",
        fechaIngreso: "2026-01-01",
        montoAportacionInicial: 100,
        reciboAportacionInicial: "REC-0001",
      });
    socioId = socio.body.id;

    const prestamo = await request(app)
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
        // Solicitado hace varios días para que ya haya interés devengado real.
        fechaSolicitud: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      });
    expect(prestamo.status).toBe(201);
    prestamoId = prestamo.body.id;

    const dia = await request(app)
      .post("/api/caja-auxiliar/abrir")
      .set("Authorization", `Bearer ${fx.tokens.CAJERO}`)
      .send({ agenciaId: fx.agenciaId, saldoInicial: 500 });
    expect(dia.status).toBe(201);
    diaId = dia.body.id;
  });

  it("acepta un interés mayor al devengado y lo marca con diferenciaCalculoOficial", async () => {
    const res = await request(app)
      .post(`/api/caja-auxiliar/${diaId}/cobro-credito`)
      .set("Authorization", `Bearer ${fx.tokens.CAJERO}`)
      .send({ prestamoId, socioId, abonoCapital: 0, interes: 999999, mora: 0 });

    expect(res.status).toBe(201);
    expect(res.body.diferenciaCalculoOficial).not.toBeNull();
    expect(res.body.diferenciaCalculoOficial.interesCobrado).toBe(999999);

    const { rows } = await pool.query(
      `select datos_nuevos from auditoria where entidad = 'PrestamoPago' order by fecha desc limit 1`,
    );
    expect(rows[0].datos_nuevos.diferenciaCalculoOficial).not.toBeNull();
  });

  it("acepta una mora mayor a la calculada y la marca con diferenciaCalculoOficial", async () => {
    const res = await request(app)
      .post(`/api/caja-auxiliar/${diaId}/cobro-credito`)
      .set("Authorization", `Bearer ${fx.tokens.CAJERO}`)
      .send({ prestamoId, socioId, abonoCapital: 0, interes: 0, mora: 999999 });

    expect(res.status).toBe(201);
    expect(res.body.diferenciaCalculoOficial).not.toBeNull();
    expect(res.body.diferenciaCalculoOficial.moraCobrada).toBe(999999);
  });

  it("no marca diferencia cuando el cobro coincide exactamente con el cálculo oficial", async () => {
    const liquidacion = await request(app)
      .get(`/api/prestamos/${prestamoId}/liquidacion`)
      .set("Authorization", `Bearer ${fx.tokens.CAJERO}`);
    expect(liquidacion.status).toBe(200);
    const { interesDevengado, moraFijaSugerida } = liquidacion.body.liquidacion;

    const res = await request(app)
      .post(`/api/caja-auxiliar/${diaId}/cobro-credito`)
      .set("Authorization", `Bearer ${fx.tokens.CAJERO}`)
      .send({ prestamoId, socioId, abonoCapital: 50, interes: interesDevengado, mora: moraFijaSugerida });

    expect(res.status).toBe(201);
    expect(res.body.diferenciaCalculoOficial).toBeNull();
  });
});
