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
  fechaProximaCuota: string;
  diasTranscurridos: number;
  diasMesCompleto: number;
  interesDiario: number;
  interesDevengado: number;
  interesMesCompleto: number;
  diasGracia: number;
  diasAtraso: number;
  estaEnMora: boolean;
  cuotasVencidas: number;
  moraFijaSugerida: number;
  cuotaCapitalBase: number;
  cuotaCapitalSugerida: number;
  cuotaProgramadaOficial: number;
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
  // 4 días de gracia por cuota.
  // Cuota 1 vence a los 30 días -> gracia hasta día 34 -> mora a partir del día 35 (Q 25)
  // Cuota 2 vence a los 60 días -> gracia hasta día 64 -> mora a partir del día 65 (Q 25)
  // Cuota 3 vence a los 90 días -> gracia hasta día 94 -> mora a partir del día 95 (Q 25)
  // Cuota 4 vence a los 120 días -> gracia hasta día 124 -> mora a partir del día 125 (Q 25)
  let cuotasVencidas = 0;
  let moraFijaSugerida = 0;
  let estaEnMora = false;

  if (diasTranscurridos >= 30) {
    cuotasVencidas = Math.max(1, Math.floor(diasTranscurridos / 30));
    
    let cuotasConMora = 0;
    for (let k = 1; k <= cuotasVencidas + 1; k++) {
      const diaLimiteGracia = k * 30 + diasGracia; // 34, 64, 94, 124...
      if (diasTranscurridos > diaLimiteGracia) {
        cuotasConMora++;
      }
    }

    if (cuotasConMora > 0) {
      estaEnMora = true;
      moraFijaSugerida = cuotasConMora * 25.0;
    }
  }

  // 4. Cálculo de la cuota programada oficial de la tabla (mes completo según calendario)
  const dProx = new Date(fechaUltimoPago + "T00:00:00");
  dProx.setMonth(dProx.getMonth() + 1);
  const fechaProximaCuota = dProx.toISOString().slice(0, 10);
  const diffMesMs = dProx.getTime() - dUltimo.getTime();
  const diasMesCompleto = Math.max(28, Math.round(diffMesMs / (1000 * 60 * 60 * 24)));

  const interesMesCompleto = redondear2((saldoCapital * (tasaAnual / 100) / 365) * diasMesCompleto);
  const cuotaProgramadaOficial = redondear2(cuotaCapitalBase + interesMesCompleto);

  // Cuota capital exigible sugerida (se acumulan las cuotas de capital de los meses vencidos)
  const multiplicadorCapital = Math.max(1, Math.floor(diasTranscurridos / 30));
  const cuotaCapitalSugerida = Math.min(saldoCapital, redondear2(cuotaCapitalBase * multiplicadorCapital));

  // Pago mínimo sugerido:
  // Si está en mora o atrasado, ponerse al día con cuotas vencidas + mora + interés.
  // Si está al día, sugerir la cuota oficial completa programada de la tabla.
  const pagoMinimoSugerido = estaEnMora || cuotasVencidas > 0
    ? redondear2(cuotaCapitalSugerida + interesDevengado + moraFijaSugerida)
    : cuotaProgramadaOficial;

  // Saldo de cancelación total al día de hoy
  const saldoCancelacionTotal = redondear2(saldoCapital + interesDevengado + moraFijaSugerida);

  return {
    saldoCapital,
    tasaInteresMensual: tasaMensual,
    tasaInteresAnual: tasaAnual,
    fechaUltimoPago,
    fechaLiquidacion,
    fechaProximaCuota,
    diasTranscurridos,
    diasMesCompleto,
    interesDiario: redondear2(interesDiario),
    interesDevengado,
    interesMesCompleto,
    diasGracia,
    diasAtraso,
    estaEnMora,
    cuotasVencidas,
    moraFijaSugerida,
    cuotaCapitalBase,
    cuotaCapitalSugerida,
    cuotaProgramadaOficial,
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
