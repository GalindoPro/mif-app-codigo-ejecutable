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
  diasExactos: number;
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
  const fechaTarget = new Date(Date.UTC(año, mes - 1 + meses, dia));
  
  // Si el mes se desborda (ej. 31 de agosto + 6 meses hacia febrero),
  // ajustar al último día real del mes destino (28 o 29 de febrero)
  if (fechaTarget.getUTCDate() !== dia) {
    const ultimoDia = new Date(Date.UTC(año, mes - 1 + meses + 1, 0));
    return ultimoDia.toISOString().slice(0, 10);
  }
  return fechaTarget.toISOString().slice(0, 10);
}

export function calcularDiasExactos(fechaInicioStr: string, fechaFinStr: string): number {
  const inicio = new Date(fechaInicioStr + "T00:00:00Z");
  const fin = new Date(fechaFinStr + "T00:00:00Z");
  const diffMs = fin.getTime() - inicio.getTime();
  return Math.max(1, Math.round(diffMs / (1000 * 60 * 60 * 24)));
}

export function calcularPlazoFijo(params: ParametrosPlazoFijo): ResultadoPlazoFijo {
  const monto = Number(params.montoDeposito);
  const n = Math.max(1, Math.floor(Number(params.plazoMeses)));
  
  // Regla de cooperativa: menor a 12 meses = 6.0% anual; 12 meses o más = 14.0% anual
  let tasa = Number(params.tasaAnual);
  if (!params.tasaAnual || Number(params.tasaAnual) <= 0) {
    tasa = n >= 12 ? 14.0 : 6.0;
  }
  
  const isrPct = params.isrPorcentaje !== undefined ? Number(params.isrPorcentaje) : 10.0;
  const fechaInicio = formatearFecha(params.fechaInicio);
  const fechaVencimiento = calcularVencimiento(fechaInicio, n);
  const diasExactos = calcularDiasExactos(fechaInicio, fechaVencimiento);

  // Cálculo diario exacto (días reales del mes / 365 días del año)
  // Cada día devenga su interés correspondiente según los días reales de cada mes calendario
  const interesGenerado = redondear2(monto * (tasa / 100) * (diasExactos / 365));
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
    diasExactos,
    interesGenerado,
    isrRetencion,
    interesNeto,
    saldoLiquidoAPagar,
  };
}
