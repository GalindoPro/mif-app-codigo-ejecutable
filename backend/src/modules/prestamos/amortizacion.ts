import { CuotaAmortizacion, TipoAmortizacion } from "../../types/models";

export interface OpcionesSimulacion {
  monto: number;
  plazoMeses: number;
  tasaInteresMensual?: number; // default 2.0%
  tipoAmortizacion?: TipoAmortizacion; // default CUOTA_NIVELADA
  fechaInicio?: string; // YYYY-MM-DD
}

export interface ResultadoSimulacion {
  monto: number;
  plazoMeses: number;
  tasaInteresMensual: number;
  tipoAmortizacion: TipoAmortizacion;
  cuotaMensualEstimada: number;
  totalIntereses: number;
  totalPagar: number;
  tabla: CuotaAmortizacion[];
}

function redondear2(val: number): number {
  return Math.round((val + Number.EPSILON) * 100) / 100;
}

function formatearAFechaString(fecha: string | Date | undefined): string {
  if (!fecha) return new Date().toISOString().slice(0, 10);
  if (fecha instanceof Date) return fecha.toISOString().slice(0, 10);
  return String(fecha).slice(0, 10);
}

function sumarMes(fechaEntrada: string | Date | undefined, meses: number): string {
  const fechaStr = formatearAFechaString(fechaEntrada);
  const [año, mes, dia] = fechaStr.split("-").map(Number);
  const fecha = new Date(año, mes - 1 + meses, dia || 1);
  return fecha.toISOString().slice(0, 10);
}

function calcularDiasEntreFechas(f1: string, f2: string): number {
  const d1 = new Date(f1 + "T00:00:00");
  const d2 = new Date(f2 + "T00:00:00");
  const diffMs = d2.getTime() - d1.getTime();
  return Math.max(1, Math.round(diffMs / (1000 * 60 * 60 * 24)));
}

export function calcularAmortizacion(opciones: OpcionesSimulacion): ResultadoSimulacion {
  const monto = Number(opciones.monto);
  const n = Math.max(1, Math.floor(Number(opciones.plazoMeses)));
  const tasaMensual = opciones.tasaInteresMensual !== undefined ? Number(opciones.tasaInteresMensual) : 2.0;
  const tasaAnual = tasaMensual * 12;
  const tipo = opciones.tipoAmortizacion ?? "SOBRE_SALDOS";
  const fechaBase = formatearAFechaString(opciones.fechaInicio || new Date());

  const i = tasaMensual / 100;
  const tabla: CuotaAmortizacion[] = [];

  let saldo = monto;
  let totalIntereses = 0;

  if (tipo === "CUOTA_NIVELADA") {
    // Cuota fija mensual
    const factor = Math.pow(1 + i, n);
    const cuotaFija = i === 0 ? monto / n : redondear2(monto * ((i * factor) / (factor - 1)));

    for (let k = 1; k <= n; k++) {
      const fechaAnterior = k === 1 ? fechaBase : sumarMes(fechaBase, k - 1);
      const fechaPago = sumarMes(fechaBase, k);
      const dias = calcularDiasEntreFechas(fechaAnterior, fechaPago);

      const interes = redondear2(saldo * i);
      let capital = redondear2(cuotaFija - interes);
      let cuota = cuotaFija;

      if (k === n) {
        // Ajuste por centavos en la última cuota
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
    // Sobre saldos (Capital constante + interés sobre días exactos del mes / 365)
    const capitalConstante = redondear2(monto / n);
    let cuotaPrimera = 0;

    for (let k = 1; k <= n; k++) {
      const fechaAnterior = k === 1 ? fechaBase : sumarMes(fechaBase, k - 1);
      const fechaPago = sumarMes(fechaBase, k);
      const dias = calcularDiasEntreFechas(fechaAnterior, fechaPago);

      // Interés por días calendario exactos del mes (base 365 días)
      const interes = redondear2((saldo * (tasaAnual / 100) * dias) / 365);
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
