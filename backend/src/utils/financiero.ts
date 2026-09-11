export function redondear2(val: number): number {
  return Math.round((val + Number.EPSILON) * 100) / 100;
}

// Guatemala no tiene horario de verano: su desfase es siempre UTC-6, todo el
// año. "new Date().toISOString()" da la fecha en UTC, así que a partir de las
// 18:00 hora local el sistema ya "ve" el día siguiente (medianoche UTC llega
// 6 horas antes de la medianoche real en Guatemala) — eso rompía la caja del
// día, las fechas por defecto de solicitud/aprobación, y el cálculo de
// interés/mora cuando no se pasaba una fecha explícita. Esta es la ÚNICA
// función que debe usarse para obtener "la fecha de hoy" en Guatemala.
export function hoyGT(): string {
  return new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

export function formatearFecha(fecha: string | Date | undefined): string {
  if (!fecha) return hoyGT();
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
