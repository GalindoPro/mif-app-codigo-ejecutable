// Catálogo de categorías del Auxiliar de Caja — tomado directamente del libro
// de caja real de la agencia (hoja "LIBRO DE CAJA" del Excel de referencia):
// dos secciones (transacciones como agente Banco Industrial, y operaciones
// propias de la cooperativa), cada categoría con su propio contador
// correlativo por agencia (continuo, nunca se reinicia por día).

export type CajaCategoria =
  | "SERVICIOS_BI"
  | "DEPOSITO_BI"
  | "RETIRO_BI"
  | "REMESA_BI"
  | "DEPOSITO_AHORRO_CORRIENTE"
  | "DEPOSITO_AHORRO_PROGRAMADO"
  | "DEPOSITO_AHORRO_INFANTO_JUVENIL"
  | "RETIRO_AHORRO_CORRIENTE"
  | "RETIRO_AHORRO_PROGRAMADO"
  | "RETIRO_AHORRO_INFANTO_JUVENIL"
  | "DEPOSITO_AHORRO_SOBRE_PRESTAMO"
  | "RETIRO_AHORRO_SOBRE_PRESTAMO"
  | "DEPOSITO_PLAZO_FIJO"
  | "RETIRO_PLAZO_FIJO"
  | "APORTACION"
  | "INGRESO_ASOCIADO"
  | "COMISION"
  | "ABONO_PRESTAMO_HIPOTECARIO"
  | "INTERES_PRESTAMO_HIPOTECARIO"
  | "MORA_PRESTAMO_HIPOTECARIO"
  | "ABONO_PRESTAMO_FIDUCIARIO"
  | "INTERES_PRESTAMO_FIDUCIARIO"
  | "MORA_PRESTAMO_FIDUCIARIO"
  | "COLOCACION_PRESTAMO"
  | "EGRESO_VARIO"
  | "INGRESO_VARIO";

export type TipoCuentaAuxiliar =
  | "AHORRO_CORRIENTE"
  | "AHORRO_PROGRAMADO"
  | "AHORRO_INFANTO_JUVENIL"
  | "AHORRO_SOBRE_PRESTAMO";

export interface CategoriaInfo {
  seccion: "BI" | "PROPIO";
  tipo: "INGRESO" | "EGRESO";
  grupoContador: string;
  descripcion: string;
  requiereCuenta?: TipoCuentaAuxiliar;
  movimientoTipo?: "DEPOSITO" | "RETIRO";
  ingresosComifCategoria?: string;
  sinModuloReal?: boolean;
  // Categorías que SOLO deben registrarse desde su flujo estructurado
  // (cobro de cuota / desembolso), nunca a mano: ahí sí quedan ligadas al
  // prestamo_id real, actualizan saldo_capital, y crean su registro en
  // prestamo_pagos. Si se registran manualmente aquí, el efectivo queda
  // contado en la caja del día, pero el crédito nunca se entera del pago.
  usoInternoSolo?: boolean;
}

export const CATEGORIAS: Record<CajaCategoria, CategoriaInfo> = {
  SERVICIOS_BI: {
    seccion: "BI",
    tipo: "INGRESO",
    grupoContador: "servicios_bi",
    descripcion: "Cobros por cuenta ajena BI — Servicios",
  },
  DEPOSITO_BI: {
    seccion: "BI",
    tipo: "INGRESO",
    grupoContador: "deposito_bi",
    descripcion: "Cobros por cuenta ajena BI — Depósitos",
  },
  RETIRO_BI: {
    seccion: "BI",
    tipo: "EGRESO",
    grupoContador: "retiro_bi",
    descripcion: "Pago por cuenta ajena BI — Retiro",
  },
  REMESA_BI: {
    seccion: "BI",
    tipo: "EGRESO",
    grupoContador: "remesa_bi",
    descripcion: "Pago por cuenta ajena BI — Remesa",
  },

  DEPOSITO_AHORRO_CORRIENTE: {
    seccion: "PROPIO",
    tipo: "INGRESO",
    grupoContador: "ahorro_corriente",
    descripcion: "Depósito de Ahorro Corriente",
    requiereCuenta: "AHORRO_CORRIENTE",
    movimientoTipo: "DEPOSITO",
  },
  DEPOSITO_AHORRO_PROGRAMADO: {
    seccion: "PROPIO",
    tipo: "INGRESO",
    grupoContador: "ahorro_programado",
    descripcion: "Depósito de Ahorro Programado",
    requiereCuenta: "AHORRO_PROGRAMADO",
    movimientoTipo: "DEPOSITO",
  },
  DEPOSITO_AHORRO_INFANTO_JUVENIL: {
    seccion: "PROPIO",
    tipo: "INGRESO",
    grupoContador: "ahorro_infanto",
    descripcion: "Depósito de Ahorro Infanto Juvenil",
    requiereCuenta: "AHORRO_INFANTO_JUVENIL",
    movimientoTipo: "DEPOSITO",
  },
  RETIRO_AHORRO_CORRIENTE: {
    seccion: "PROPIO",
    tipo: "EGRESO",
    grupoContador: "egreso_propio",
    descripcion: "Retiro de Ahorro Corriente",
    requiereCuenta: "AHORRO_CORRIENTE",
    movimientoTipo: "RETIRO",
  },
  RETIRO_AHORRO_PROGRAMADO: {
    seccion: "PROPIO",
    tipo: "EGRESO",
    grupoContador: "egreso_propio",
    descripcion: "Retiro de Ahorro Programado",
    requiereCuenta: "AHORRO_PROGRAMADO",
    movimientoTipo: "RETIRO",
  },
  RETIRO_AHORRO_INFANTO_JUVENIL: {
    seccion: "PROPIO",
    tipo: "EGRESO",
    grupoContador: "egreso_propio",
    descripcion: "Retiro de Ahorro Infanto Juvenil",
    requiereCuenta: "AHORRO_INFANTO_JUVENIL",
    movimientoTipo: "RETIRO",
  },
  DEPOSITO_AHORRO_SOBRE_PRESTAMO: {
    seccion: "PROPIO",
    tipo: "INGRESO",
    grupoContador: "ahorro_sobre_prestamo",
    descripcion: "Depósito Ahorro sobre Préstamo",
    requiereCuenta: "AHORRO_SOBRE_PRESTAMO",
    movimientoTipo: "DEPOSITO",
  },
  RETIRO_AHORRO_SOBRE_PRESTAMO: {
    seccion: "PROPIO",
    tipo: "EGRESO",
    grupoContador: "egreso_propio",
    descripcion: "Retiro Ahorro sobre Préstamo",
    requiereCuenta: "AHORRO_SOBRE_PRESTAMO",
    movimientoTipo: "RETIRO",
  },

  DEPOSITO_PLAZO_FIJO: {
    seccion: "PROPIO",
    tipo: "INGRESO",
    grupoContador: "plazo_fijo",
    descripcion: "Depósito a Plazo Fijo",
    sinModuloReal: true,
  },
  RETIRO_PLAZO_FIJO: {
    seccion: "PROPIO",
    tipo: "EGRESO",
    grupoContador: "egreso_propio",
    descripcion: "Retiro de Plazo Fijo",
    sinModuloReal: true,
  },

  APORTACION: {
    seccion: "PROPIO",
    tipo: "INGRESO",
    grupoContador: "aportacion",
    descripcion: "Aportación",
    ingresosComifCategoria: "APORTACION_VOLUNTARIA",
  },
  INGRESO_ASOCIADO: {
    seccion: "PROPIO",
    tipo: "INGRESO",
    grupoContador: "ingreso_asociado",
    descripcion: "Ingreso de asociado (cuota de ingreso)",
    ingresosComifCategoria: "CUOTA_INGRESO",
  },
  COMISION: {
    seccion: "PROPIO",
    tipo: "INGRESO",
    grupoContador: "comision",
    descripcion: "Comisión",
    ingresosComifCategoria: "COMISION_PRESTAMO",
  },

  ABONO_PRESTAMO_HIPOTECARIO: {
    seccion: "PROPIO",
    tipo: "INGRESO",
    grupoContador: "prestamo",
    descripcion: "Abono sobre préstamo hipotecario",
    ingresosComifCategoria: "ABONO_PRESTAMO",
    usoInternoSolo: true,
  },
  INTERES_PRESTAMO_HIPOTECARIO: {
    seccion: "PROPIO",
    tipo: "INGRESO",
    grupoContador: "prestamo",
    descripcion: "Interés hipotecario",
    ingresosComifCategoria: "INTERES_PRESTAMO",
    usoInternoSolo: true,
  },
  MORA_PRESTAMO_HIPOTECARIO: {
    seccion: "PROPIO",
    tipo: "INGRESO",
    grupoContador: "prestamo",
    descripcion: "Mora sobre préstamo hipotecario",
    ingresosComifCategoria: "MORA_PRESTAMO",
    usoInternoSolo: true,
  },
  ABONO_PRESTAMO_FIDUCIARIO: {
    seccion: "PROPIO",
    tipo: "INGRESO",
    grupoContador: "prestamo",
    descripcion: "Abono sobre préstamo fiduciario",
    ingresosComifCategoria: "ABONO_PRESTAMO_FIDUCIARIO",
    usoInternoSolo: true,
  },
  INTERES_PRESTAMO_FIDUCIARIO: {
    seccion: "PROPIO",
    tipo: "INGRESO",
    grupoContador: "prestamo",
    descripcion: "Interés fiduciario",
    ingresosComifCategoria: "INTERES_FIDUCIARIO",
    usoInternoSolo: true,
  },
  MORA_PRESTAMO_FIDUCIARIO: {
    seccion: "PROPIO",
    tipo: "INGRESO",
    grupoContador: "prestamo",
    descripcion: "Mora sobre préstamo fiduciario",
    ingresosComifCategoria: "MORA_PRESTAMO",
    usoInternoSolo: true,
  },

  COLOCACION_PRESTAMO: {
    seccion: "PROPIO",
    tipo: "EGRESO",
    grupoContador: "colocacion",
    descripcion: "Colocación de préstamo (desembolso)",
    sinModuloReal: true,
    usoInternoSolo: true,
  },
  EGRESO_VARIO: {
    seccion: "PROPIO",
    tipo: "EGRESO",
    grupoContador: "egreso_propio",
    descripcion: "Egreso vario",
  },
  INGRESO_VARIO: {
    seccion: "PROPIO",
    tipo: "INGRESO",
    grupoContador: "ingreso_vario",
    descripcion: "Ingreso vario",
    ingresosComifCategoria: "INGRESO_VARIO",
  },
};

export const CATEGORIA_KEYS = Object.keys(CATEGORIAS) as CajaCategoria[];

// Categorías permitidas para el registro MANUAL de movimientos (excluye las
// que solo debe escribir el propio código del cobro de cuota / desembolso).
export const CATEGORIA_MANUAL_KEYS = CATEGORIA_KEYS.filter((k) => !CATEGORIAS[k].usoInternoSolo);

export function categoriasDelGrupo(grupo: string): CajaCategoria[] {
  return CATEGORIA_KEYS.filter((k) => CATEGORIAS[k].grupoContador === grupo);
}

// Denominaciones de billetes y monedas de Guatemala usadas en el arqueo.
export const DENOMINACIONES = [200, 100, 50, 20, 10, 5, 1, 0.5, 0.25, 0.1, 0.05, 0.01];
