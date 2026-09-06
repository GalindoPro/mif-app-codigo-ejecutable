export interface ResultadoLiquidacion {
  saldoCapital: number;
  tasaInteresMensual: number;
  tasaInteresAnual: number;
  fechaUltimoPago: string;
  fechaLiquidacion: string;
  diasTranscurridos: number;
  interesDiario: number;
  interesDevengado: number;
  diasGracia: number;
  diasAtraso: number;
  estaEnMora: boolean;
  cuotasVencidas: number;
  moraFijaSugerida: number;
  cuotaCapitalSugerida: number;
  pagoMinimoSugerido: number;
  saldoCancelacionTotal: number;
}

function redondear2(val: number): number {
  return Math.round((val + Number.EPSILON) * 100) / 100;
}

/**
 * Desglosa un monto entregado por el socio en:
 * 1. Mora exigible
 * 2. Interés diario exacto devengado
 * 3. Todo el excedente se va DIRECTO a Abono a Capital (reducción del saldo deudor).
 */
export function distribuirMontoCobro(
  montoEntregado: number,
  moraRequerida: number,
  interesRequerido: number,
  saldoCapitalActual: number,
) {
  const monto = Math.max(0, Number(montoEntregado) || 0);
  const mora = Math.max(0, Number(moraRequerida) || 0);
  const interes = Math.max(0, Number(interesRequerido) || 0);
  const saldo = Math.max(0, Number(saldoCapitalActual) || 0);

  // 1. Mora
  const pagoMora = redondear2(Math.min(monto, mora));
  let restante = redondear2(monto - pagoMora);

  // 2. Interés
  const pagoInteres = redondear2(Math.min(restante, interes));
  restante = redondear2(restante - pagoInteres);

  // 3. Capital (todo el remanente)
  const pagoCapital = redondear2(Math.min(saldo, restante));
  const cambio = redondear2(Math.max(0, restante - pagoCapital));
  const nuevoSaldoCapital = redondear2(Math.max(0, saldo - pagoCapital));

  return {
    montoEntregado: monto,
    pagoMora,
    pagoInteres,
    pagoCapital,
    cambio,
    nuevoSaldoCapital,
  };
}
