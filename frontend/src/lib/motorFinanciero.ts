import type { CuotaAmortizacion, ResultadoSimulacion, TipoAmortizacion } from "../types";

export interface OpcionesSimulacion {
  monto: number;
  plazoMeses: number;
  tasaInteresMensual?: number;
  tipoAmortizacion?: TipoAmortizacion;
  fechaInicio?: string;
}

export interface OpcionesLiquidacion {
  saldoCapital: number;
  tasaInteresMensual: number;
  plazoMeses: number;
  montoOriginal: number;
  cuotaMensualEstimada: number;
  fechaUltimoPago: string | Date;
  fechaLiquidacion?: string | Date;
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

export function redondear2(val: number): number {
  return Math.round((val + Number.EPSILON) * 100) / 100;
}

export function formatearAFechaString(fecha: string | Date | undefined): string {
  if (!fecha) return new Date().toISOString().slice(0, 10);
  if (fecha instanceof Date) return fecha.toISOString().slice(0, 10);
  return String(fecha).slice(0, 10);
}

/**
 * Suma meses a una fecha calendario preservando el día del mes
 * y ajustando al último día disponible si el mes objetivo tiene menos días.
 */
export function sumarMesesFinanciero(fechaEntrada: string | Date | undefined, meses: number): string {
  const fechaStr = formatearAFechaString(fechaEntrada);
  const [año, mes, diaOriginal] = fechaStr.split("-").map(Number);
  const totalMeses = mes - 1 + meses;
  const targetAño = año + Math.floor(totalMeses / 12);
  const targetMes = ((totalMeses % 12) + 12) % 12; // 0..11
  const maxDiasMes = new Date(Date.UTC(targetAño, targetMes + 1, 0)).getUTCDate();
  const diaFinal = Math.min(diaOriginal || 1, maxDiasMes);
  const fecha = new Date(Date.UTC(targetAño, targetMes, diaFinal));
  return fecha.toISOString().slice(0, 10);
}

/**
 * Motor de Amortización Unificado
 * Cálculo idéntico al del servidor (exact 365 days / declining balance / cuota fija)
 */
export function calcularAmortizacion(opciones: OpcionesSimulacion): ResultadoSimulacion {
  const monto = Number(opciones.monto);
  const n = Math.max(1, Math.floor(Number(opciones.plazoMeses)));
  const tasaMensual = opciones.tasaInteresMensual !== undefined ? Number(opciones.tasaInteresMensual) : 2.0;
  const tipo = opciones.tipoAmortizacion ?? "CUOTA_NIVELADA";
  const fechaBase = opciones.fechaInicio || new Date().toISOString().slice(0, 10);
  const tasaAnual = tasaMensual * 12;

  const tabla: CuotaAmortizacion[] = [];
  let saldo = monto;
  let totalIntereses = 0;

  if (tipo === "CUOTA_NIVELADA") {
    const i = tasaMensual / 100;
    const factor = Math.pow(1 + i, n);
    const cuotaFija = i === 0 ? monto / n : redondear2(monto * ((i * factor) / (factor - 1)));

    for (let k = 1; k <= n; k++) {
      const fechaAnterior = k === 1 ? fechaBase : sumarMesesFinanciero(fechaBase, k - 1);
      const fechaPago = sumarMesesFinanciero(fechaBase, k);
      const diffMs = new Date(fechaPago + "T00:00:00").getTime() - new Date(fechaAnterior + "T00:00:00").getTime();
      const dias = Math.max(1, Math.round(diffMs / (1000 * 60 * 60 * 24)));

      const interes = redondear2(saldo * i);
      let capital = redondear2(cuotaFija - interes);
      let cuota = cuotaFija;

      if (k === n) {
        capital = saldo;
        cuota = redondear2(capital + interes);
        saldo = 0;
      } else {
        saldo = redondear2(saldo - capital);
      }

      totalIntereses = redondear2(totalIntereses + interes);

      tabla.push({
        numero: k,
        fechaPago,
        dias,
        cuota,
        capital,
        interes,
        saldoRestante: Math.max(0, saldo),
      });
    }

    return {
      monto,
      plazoMeses: n,
      tasaInteresMensual: tasaMensual,
      tipoAmortizacion: tipo,
      cuotaMensualEstimada: cuotaFija,
      totalIntereses,
      totalPagar: redondear2(monto + totalIntereses),
      tabla,
    };
  } else {
    // Sobre saldos (Capital constante) con días calendario exactos (Base 365)
    const capitalConstante = redondear2(monto / n);
    let cuotaPrimera = 0;

    for (let k = 1; k <= n; k++) {
      const fechaAnterior = k === 1 ? fechaBase : sumarMesesFinanciero(fechaBase, k - 1);
      const fechaPago = sumarMesesFinanciero(fechaBase, k);
      const diffMs = new Date(fechaPago + "T00:00:00").getTime() - new Date(fechaAnterior + "T00:00:00").getTime();
      const dias = Math.max(1, Math.round(diffMs / (1000 * 60 * 60 * 24)));

      const interes = redondear2(saldo * (tasaAnual / 100 / 365) * dias);
      let capital = capitalConstante;

      if (k === n) {
        capital = saldo;
        saldo = 0;
      } else {
        saldo = redondear2(saldo - capital);
      }

      const cuota = redondear2(capital + interes);
      if (k === 1) cuotaPrimera = cuota;
      totalIntereses = redondear2(totalIntereses + interes);

      tabla.push({
        numero: k,
        fechaPago,
        dias,
        cuota,
        capital,
        interes,
        saldoRestante: Math.max(0, saldo),
      });
    }

    return {
      monto,
      plazoMeses: n,
      tasaInteresMensual: tasaMensual,
      tipoAmortizacion: tipo,
      cuotaMensualEstimada: cuotaPrimera,
      totalIntereses,
      totalPagar: redondear2(monto + totalIntereses),
      tabla,
    };
  }
}

/**
 * Motor de Liquidación Diaria de Créditos y Mora
 */
export function calcularLiquidacionCredito(opciones: OpcionesLiquidacion): ResultadoLiquidacion {
  const saldoCapital = Math.max(0, Number(opciones.saldoCapital) || 0);
  const tasaMensual = Number(opciones.tasaInteresMensual) || 2.0;
  const tasaAnual = tasaMensual * 12;
  const plazoMeses = Math.max(1, Number(opciones.plazoMeses) || 12);
  const montoOriginal = Number(opciones.montoOriginal) || saldoCapital;

  const fechaUltimoPago = formatearAFechaString(opciones.fechaUltimoPago);
  const fechaLiquidacion = formatearAFechaString(opciones.fechaLiquidacion || new Date());

  const dUltimo = new Date(fechaUltimoPago + "T00:00:00");
  const dLiq = new Date(fechaLiquidacion + "T00:00:00");
  const diffMs = dLiq.getTime() - dUltimo.getTime();
  const diasTranscurridos = Math.max(1, Math.round(diffMs / (1000 * 60 * 60 * 24)));

  const interesDiario = (saldoCapital * (tasaAnual / 100)) / 365;
  const interesDevengado = redondear2(interesDiario * diasTranscurridos);
  const cuotaCapitalBase = redondear2(montoOriginal / plazoMeses);

  const diasAtraso = Math.max(0, diasTranscurridos - 30);
  const diasGracia = 4;

  let cuotasVencidas = 0;
  let moraFijaSugerida = 0;
  let estaEnMora = false;

  if (diasTranscurridos >= 30) {
    cuotasVencidas = Math.max(1, Math.floor(diasTranscurridos / 30));
    let cuotasConMora = 0;
    for (let k = 1; k <= cuotasVencidas + 1; k++) {
      const diaLimiteGracia = k * 30 + diasGracia;
      if (diasTranscurridos > diaLimiteGracia) {
        cuotasConMora++;
      }
    }
    if (cuotasConMora > 0) {
      estaEnMora = true;
      moraFijaSugerida = cuotasConMora * 25.0;
    }
  }

  const fechaProximaCuota = sumarMesesFinanciero(fechaUltimoPago, 1);
  const dProx = new Date(fechaProximaCuota + "T00:00:00");
  const diffMesMs = dProx.getTime() - dUltimo.getTime();
  const diasMesCompleto = Math.max(28, Math.round(diffMesMs / (1000 * 60 * 60 * 24)));

  const interesMesCompleto = redondear2((saldoCapital * (tasaAnual / 100) / 365) * diasMesCompleto);
  const cuotaProgramadaOficial = redondear2(cuotaCapitalBase + interesMesCompleto);

  const multiplicadorCapital = Math.max(1, Math.floor(diasTranscurridos / 30));
  const cuotaCapitalSugerida = Math.min(saldoCapital, redondear2(cuotaCapitalBase * multiplicadorCapital));

  const pagoMinimoSugerido = estaEnMora || cuotasVencidas > 0
    ? redondear2(cuotaCapitalSugerida + interesDevengado + moraFijaSugerida)
    : cuotaProgramadaOficial;

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
 * Cascada de Pago de Cuota de Crédito
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

  const pagoMora = redondear2(Math.min(monto, mora));
  let restante = redondear2(monto - pagoMora);

  const pagoInteres = redondear2(Math.min(restante, interes));
  restante = redondear2(restante - pagoInteres);

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
