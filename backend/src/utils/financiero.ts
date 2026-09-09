export function redondear2(val: number): number {
  return Math.round((val + Number.EPSILON) * 100) / 100;
}

export function formatearFecha(fecha: string | Date | undefined): string {
  if (!fecha) return new Date().toISOString().slice(0, 10);
  if (fecha instanceof Date) return fecha.toISOString().slice(0, 10);
  return String(fecha).slice(0, 10);
}

// Suma meses respetando el último día válido del mes destino (sin overflow tipo setMonth).
export function sumarMesesFinanciero(fechaEntrada: string | Date | undefined, meses: number): string {
  const fechaStr = formatearFecha(fechaEntrada);
  const [año, mes, diaOriginal] = fechaStr.split("-").map(Number);
  const totalMeses = mes - 1 + meses;
  const targetAño = año + Math.floor(totalMeses / 12);
  const targetMes = ((totalMeses % 12) + 12) % 12; // 0..11
  const maxDiasMes = new Date(Date.UTC(targetAño, targetMes + 1, 0)).getUTCDate();
  const diaFinal = Math.min(diaOriginal || 1, maxDiasMes);
  return new Date(Date.UTC(targetAño, targetMes, diaFinal)).toISOString().slice(0, 10);
}
