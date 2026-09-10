import { describe, it, expect, beforeEach } from "vitest";
import { resetDb, type Fixtures } from "./helpers";
import * as cuentasService from "../modules/cuentas/service";

// Cubre el bug encontrado en el recorrido manual: el join de cuentas con
// movimientos en la misma consulta que sumaba el saldo producía fan-out —
// una cuenta con 2 movimientos contaba su saldo 2 veces en el total.
describe("cuentasService.resumen — no duplica el saldo por cantidad de movimientos", () => {
  let fx: Fixtures;

  beforeEach(async () => {
    fx = await resetDb();
  });

  it("una cuenta con dos movimientos no duplica su saldo en el total", async () => {
    const socio = await (await import("../modules/socios/service")).crear(
      {
        numeroAsociado: "TST-0001",
        agenciaId: fx.agenciaId,
        nombres: "Test Resumen",
        fechaIngreso: "2026-01-01",
        montoAportacionInicial: 100,
        reciboAportacionInicial: "REC-0001",
      },
      fx.usuarios.ADMIN.id,
    );

    const { numeroCuenta } = await cuentasService.siguienteNumero(fx.agenciaId, "AHORRO_CORRIENTE");
    const cuenta = await cuentasService.crear(
      { tipo: "AHORRO_CORRIENTE", agenciaId: fx.agenciaId, socioId: socio.id, numeroCuenta, saldoInicial: 0 },
      fx.usuarios.ADMIN.id,
    );

    await cuentasService.registrarMovimiento(cuenta.id, { tipo: "DEPOSITO", monto: 500 }, fx.usuarios.CAJERO.id, null);
    await cuentasService.registrarMovimiento(cuenta.id, { tipo: "RETIRO", monto: 200 }, fx.usuarios.CAJERO.id, null);

    const resumen = await cuentasService.resumen({ tipo: "AHORRO_CORRIENTE", agenciaId: null });
    expect(resumen.totalCuentas).toBe(1);
    expect(resumen.saldoTotal).toBe(300); // 500 - 200, contado UNA sola vez
    expect(resumen.totalDepositos).toBe(500);
    expect(resumen.totalRetiros).toBe(200);
  });
});
