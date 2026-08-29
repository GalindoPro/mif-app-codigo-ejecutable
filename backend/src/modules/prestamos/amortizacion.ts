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

export function calcularAmortizacion(opciones: OpcionesSimulacion): ResultadoSimulacion {
  const monto = Number(opciones.monto);
  const n = Math.max(1, Math.floor(Number(opciones.plazoMeses)));
  const tasaMensual = opciones.tasaInteresMensual !== undefined ? Number(opciones.tasaInteresMensual) : 2.0;
  const tipo = opciones.tipoAmortizacion ?? "CUOTA_NIVELADA";
  const fechaBase = opciones.fechaInicio || new Date().toISOString().slice(0, 10);

  const i = tasaMensual / 100;
  const tabla: CuotaAmortizacion[] = [];

  let saldo = monto;
  let totalIntereses = 0;

  if (tipo === "CUOTA_NIVELADA") {
    // Cuota fija mensual
    const factor = Math.pow(1 + i, n);
    const cuotaFija = i === 0 ? monto / n : redondear2(monto * ((i * factor) / (factor - 1)));

    for (let k = 1; k <= n; k++) {
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
        fechaPago: sumarMes(fechaBase, k),
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
    // Sobre saldos (Capital constante)
    const capitalConstante = redondear2(monto / n);
    let cuotaPrimera = 0;

    for (let k = 1; k <= n; k++) {
      const interes = redondear2(saldo * i);
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
        fechaPago: sumarMes(fechaBase, k),
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
