export interface OpcionesLiquidacion {
  saldoCapital: number;
  tasaInteresMensual: number; // Ej. 2.0%
  plazoMeses: number;
  montoOriginal: number;
  cuotaMensualEstimada: number;
  fechaUltimoPago: string | Date; // YYYY-MM-DD
  fechaLiquidacion?: string | Date; // YYYY-MM-DD (default: hoy)
  tipoAmortizacion?: string;
}

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

function formatearFecha(fecha: string | Date | undefined): string {
  if (!fecha) return new Date().toISOString().slice(0, 10);
  if (fecha instanceof Date) return fecha.toISOString().slice(0, 10);
  return String(fecha).slice(0, 10);
}

/**
 * Calcula la liquidación de intereses diarios, mora y capital exigible
 * en base a días transcurridos desde el último pago (o desembolso).
 */
export function calcularLiquidacionCredito(opciones: OpcionesLiquidacion): ResultadoLiquidacion {
  const saldoCapital = Math.max(0, Number(opciones.saldoCapital) || 0);
  const tasaMensual = Number(opciones.tasaInteresMensual) || 2.0;
  const tasaAnual = tasaMensual * 12; // Ej. 24.0%
  const plazoMeses = Math.max(1, Number(opciones.plazoMeses) || 12);
  const montoOriginal = Number(opciones.montoOriginal) || saldoCapital;

  const fechaUltimoPago = formatearFecha(opciones.fechaUltimoPago);
  const fechaLiquidacion = formatearFecha(opciones.fechaLiquidacion || new Date());

  // Cálculo de días exactos entre la fecha del último pago y la fecha de liquidación
  const dUltimo = new Date(fechaUltimoPago + "T00:00:00");
  const dLiq = new Date(fechaLiquidacion + "T00:00:00");
  const diffMs = dLiq.getTime() - dUltimo.getTime();
  const diasTranscurridos = Math.max(1, Math.round(diffMs / (1000 * 60 * 60 * 24)));

  // 1. Interés diario exacto = (Saldo Capital * Tasa Anual) / 365
  const interesDiario = (saldoCapital * (tasaAnual / 100)) / 365;
  const interesDevengado = redondear2(interesDiario * diasTranscurridos);

  // 2. Cuota de capital base
  const cuotaCapitalBase = redondear2(montoOriginal / plazoMeses);

  // 3. Cuotas de capital acumuladas y días de atraso
  // Ciclo regular: 30 días
  const diasAtraso = Math.max(0, diasTranscurridos - 30);
  const diasGracia = 4;

  // Regla de Mora Oficial:
  // 4 días de gracia: Días de atraso 1 a 4 -> Mora Q 0.00
  // A partir del 5to día de atraso (diasAtraso >= 5, es decir diasTranscurridos >= 35):
  // Se cobra Q 25.00 de cargo fijo por cada cuota que ha cumplido más de 4 días de atraso.
  let cuotasVencidas = 0;
  let moraFijaSugerida = 0;
  let estaEnMora = false;

  if (diasTranscurridos >= 30) {
    // Cuántos ciclos mensuales completos han transcurrido
    cuotasVencidas = Math.max(1, Math.floor(diasTranscurridos / 30));
    
    // Verificamos si la primera cuota ya excedió los 4 días de gracia (día 5 de atraso = 35 días transcurridos)
    if (diasTranscurridos >= 35) {
      estaEnMora = true;
      // Para cada cuota mensual vencida que superó los 4 días de gracia
      // Cuota 1 vence en día 30 -> gracia hasta día 34 -> mora en día 35
      // Cuota 2 vence en día 60 -> gracia hasta día 64 -> mora en día 65
      const cuotasConMora = Math.max(1, Math.floor((diasTranscurridos - 5) / 30));
      moraFijaSugerida = cuotasConMora * 25.0;
    }
  }

  // Cuota capital exigible sugerida (se acumula si han pasado varios meses)
  const multiplicadorCapital = Math.max(1, Math.floor(diasTranscurridos / 30));
  const cuotaCapitalSugerida = Math.min(saldoCapital, redondear2(cuotaCapitalBase * multiplicadorCapital));

  // Pago mínimo sugerido
  const pagoMinimoSugerido = redondear2(cuotaCapitalSugerida + interesDevengado + moraFijaSugerida);

  // Saldo de cancelación total al día de hoy
  const saldoCancelacionTotal = redondear2(saldoCapital + interesDevengado + moraFijaSugerida);

  return {
    saldoCapital,
    tasaInteresMensual: tasaMensual,
    tasaInteresAnual: tasaAnual,
    fechaUltimoPago,
    fechaLiquidacion,
    diasTranscurridos,
    interesDiario: redondear2(interesDiario),
    interesDevengado,
    diasGracia,
    diasAtraso,
    estaEnMora,
    cuotasVencidas,
    moraFijaSugerida,
    cuotaCapitalSugerida,
    pagoMinimoSugerido,
    saldoCancelacionTotal,
  };
}

/**
 * Desglosa un monto total entregado por el socio:
 * 1. Cubre mora
 * 2. Cubre interés devengado
 * 3. El remanente va DIRECTO a abono a capital (reduciendo el saldo deudor).
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
