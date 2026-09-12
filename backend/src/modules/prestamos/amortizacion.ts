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

export function calcularAmortizacion(opciones: OpcionesSimulacion): ResultadoSimulacion {
  const monto = Number(opciones.monto);
  const n = Math.max(1, Math.floor(Number(opciones.plazoMeses)));
  const tasaMensual = opciones.tasaInteresMensual !== undefined ? Number(opciones.tasaInteresMensual) : 2.0;
  const tipo = opciones.tipoAmortizacion ?? "CUOTA_NIVELADA";
  const fechaBase = opciones.fechaInicio || new Date().toISOString().slice(0, 10);
  const tasaAnual = tasaMensual * 12; // Ej. 24.0%

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
    // Sobre saldos (Capital constante) con días calendario reales exactos (Base 365 días)
    const capitalConstante = redondear2(monto / n);
    let cuotaPrimera = 0;

    for (let k = 1; k <= n; k++) {
      const fechaAnterior = k === 1 ? fechaBase : sumarMesesFinanciero(fechaBase, k - 1);
      const fechaPago = sumarMesesFinanciero(fechaBase, k);
      const diffMs = new Date(fechaPago + "T00:00:00").getTime() - new Date(fechaAnterior + "T00:00:00").getTime();
      const dias = Math.max(1, Math.round(diffMs / (1000 * 60 * 60 * 24)));

      // Interés oficial cooperativa: Saldo * (Tasa Anual / 100 / 365) * Días calendario
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
