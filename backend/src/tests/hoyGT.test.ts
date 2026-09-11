import { describe, it, expect, vi, afterEach } from "vitest";
import { hoyGT } from "../utils/financiero";

// Cubre el bug real: Guatemala es siempre UTC-6 (sin horario de verano), así
// que usar new Date().toISOString() para "hoy" hace que el sistema salte al
// día siguiente a partir de las 18:00 hora local — 6 horas antes de la
// medianoche real. Esto rompía la apertura de caja del día, las fechas de
// solicitud/aprobación de créditos, y el cálculo de interés/mora cuando no
// se pasaba una fecha explícita.
describe("hoyGT — fecha de Guatemala, no UTC", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("a las 7pm hora de Guatemala (01:00 UTC del día siguiente) sigue siendo el día anterior", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-11T01:00:00.000Z")); // 19:00 del 10/09 en Guatemala
    expect(hoyGT()).toBe("2026-09-10");
  });

  it("justo a medianoche real de Guatemala (06:00 UTC) ya es el día nuevo", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-11T06:00:00.000Z")); // 00:00 del 11/09 en Guatemala
    expect(hoyGT()).toBe("2026-09-11");
  });

  it("un minuto antes de medianoche de Guatemala todavía es el día anterior", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-11T05:59:00.000Z")); // 23:59 del 10/09 en Guatemala
    expect(hoyGT()).toBe("2026-09-10");
  });
});
