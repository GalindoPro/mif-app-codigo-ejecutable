export interface ParametrosPlazoFijo {
  montoDeposito: number;
  plazoMeses: number;
  tasaAnual: number;
  isrPorcentaje?: number;
  fechaInicio?: string | Date;
}

export interface ResultadoPlazoFijo {
  montoDeposito: number;
  plazoMeses: number;
  tasaAnual: number;
  isrPorcentaje: number;
  fechaInicio: string;
  fechaVencimiento: string;
  interesGenerado: number;
  isrRetencion: number;
  interesNeto: number;
  saldoLiquidoAPagar: number;
}

function redondear2(val: number): number {
  return Math.round((val + Number.EPSILON) * 100) / 100;
}

function formatearFecha(fecha: string | Date | undefined): string {
  if (!fecha) return new Date().toISOString().slice(0, 10);
  if (fecha instanceof Date) return fecha.toISOString().slice(0, 10);
  return String(fecha).slice(0, 10);
}

export function calcularVencimiento(fechaEntrada: string | Date | undefined, meses: number): string {
  const fechaStr = formatearFecha(fechaEntrada);
  const [año, mes, dia] = fechaStr.split("-").map(Number);
  const fecha = new Date(año, mes - 1 + meses, dia || 1);
  return fecha.toISOString().slice(0, 10);
}

export function calcularPlazoFijo(params: ParametrosPlazoFijo): ResultadoPlazoFijo {
  const monto = Number(params.montoDeposito);
  const n = Math.max(1, Math.floor(Number(params.plazoMeses)));
  const tasa = Number(params.tasaAnual);
  const isrPct = params.isrPorcentaje !== undefined ? Number(params.isrPorcentaje) : 10.0;
  const fechaInicio = formatearFecha(params.fechaInicio);
  const fechaVencimiento = calcularVencimiento(fechaInicio, n);

  // Fórmula anual estándar de cooperativas:
  // Interés = Monto * (Tasa / 100) * (Meses / 12)
  const interesGenerado = redondear2(monto * (tasa / 100) * (n / 12));
  const isrRetencion = redondear2(interesGenerado * (isrPct / 100));
  const interesNeto = redondear2(interesGenerado - isrRetencion);
  const saldoLiquidoAPagar = redondear2(monto + interesNeto);

  return {
    montoDeposito: monto,
    plazoMeses: n,
    tasaAnual: tasa,
    isrPorcentaje: isrPct,
    fechaInicio,
    fechaVencimiento,
    interesGenerado,
    isrRetencion,
    interesNeto,
    saldoLiquidoAPagar,
  };
}
