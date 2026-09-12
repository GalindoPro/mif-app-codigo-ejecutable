export type RolUsuario = "GERENCIA" | "SUPERVISOR" | "CAJERO" | "CAJA_CHICA" | "PROMOTOR";

export interface UsuarioAutenticado {
  id: string;
  nombre: string;
  email: string;
  rol: RolUsuario;
  agenciaId: string | null;
}

export interface Agencia {
  id: string;
  codigo: string;
  nombre: string;
  direccion: string | null;
  activa: boolean;
}

export interface Socio {
  id: string;
  numero_asociado: string;
  agencia_id: string;
  agencia_nombre?: string;
  agencia_codigo?: string;
  nombres: string;
  genero: "M" | "F" | null;
  edad?: number | null;
  fecha_ingreso: string;
  estado: "ACTIVO" | "INACTIVO";
  dpi: string | null;
  direccion: string | null;
  telefono: string | null;
  nombre_beneficiario: string | null;
  dpi_beneficiario?: string | null;
  telefono_beneficiario?: string | null;
  parentesco_beneficiario?: string | null;
  total_cuentas?: number;
  created_at: string;
}

export const PARENTESCOS_BENEFICIARIO = [
  "Cónyuge / Esposo(a)",
  "Hijo(a)",
  "Padre / Madre",
  "Hermano(a)",
  "Abuelo(a)",
  "Nieto(a)",
  "Tío(a)",
  "Primo(a)",
  "Sobrino(a)",
  "Suegro(a)",
  "Yerno / Nuera",
  "Amigo(a)",
  "Otro",
] as const;

export const PARENTESCOS_BENEFICIARIO_MENOR = [
  "Hijo(a)",
  "Nieto(a)",
  "Hermano(a)",
  "Sobrino(a)",
  "Primo(a)",
  "Otro",
] as const;

export interface AportacionSocio {
  socio_id: string;
  numero_asociado: string;
  nombres: string;
  dpi: string | null;
  edad: number | null;
  genero: "M" | "F" | null;
  fecha_ingreso: string;
  direccion: string | null;
  telefono: string | null;
  nombre_beneficiario: string | null;
  dpi_beneficiario: string | null;
  telefono_beneficiario: string | null;
  parentesco_beneficiario?: string | null;
  estado: "ACTIVO" | "INACTIVO";
  agencia_nombre: string;
  total_aportaciones: string | number;
}

export interface ListaSocios {
  data: Socio[];
  total: number;
  page: number;
  pageSize: number;
}

export const ROL_LABEL: Record<RolUsuario, string> = {
  GERENCIA: "Administrador",
  SUPERVISOR: "Jefe de Agencia",
  CAJERO: "Cajero Auxiliar",
  CAJA_CHICA: "Operador Caja Chica",
  PROMOTOR: "Promotor de Crédito",
};

export type TipoCuentaAhorro =
  | "AHORRO_CORRIENTE"
  | "AHORRO_PROGRAMADO"
  | "AHORRO_INFANTO_JUVENIL"
  | "AHORRO_SOBRE_PRESTAMO"
  | "AHORRO_PLAZO_FIJO";

export interface Cuenta {
  id: string;
  numero_cuenta: string;
  tipo: TipoCuentaAhorro;
  estado: "ACTIVA" | "CERRADA";
  socio_id: string;
  socio_nombres: string;
  numero_asociado: string;
  agencia_id: string;
  agencia_nombre?: string;
  saldo_inicial: string;
  saldo_actual: string;
  cuota_pactada?: string | number | null;
  observaciones_apertura?: string | null;
  prestamo_id?: string | null;
  prestamo_codigo?: string | null;
  prestamo_estado?: string | null;
  prestamo_saldo_capital?: string | number | null;
  creado_por_id?: string | null;
  promotor_nombre?: string | null;
  promotor_email?: string | null;
  socio_telefono?: string | null;
  created_at: string;
}

export interface Movimiento {
  id: string;
  cuenta_id: string;
  tipo: "DEPOSITO" | "RETIRO" | "AJUSTE";
  monto: string;
  fecha: string;
  numero_recibo: string | null;
  descripcion: string | null;
  usuario_nombre: string;
  created_at: string;
}

export type CuentaConMovimientos = Cuenta & { movimientos: Movimiento[] };

export interface AhorroTipoConfig {
  tipo: TipoCuentaAhorro;
  slug: string;
  titulo: string;
  descripcion: string;
}

export const TIPOS_AHORRO: AhorroTipoConfig[] = [
  {
    tipo: "AHORRO_CORRIENTE",
    slug: "corriente",
    titulo: "Ahorro Corriente",
    descripcion: "Depósitos y retiros de las cuentas de ahorro corriente.",
  },
  {
    tipo: "AHORRO_PROGRAMADO",
    slug: "programado",
    titulo: "Ahorro Programado",
    descripcion: "Cuentas de ahorro programado por socio.",
  },
  {
    tipo: "AHORRO_INFANTO_JUVENIL",
    slug: "infanto-juvenil",
    titulo: "Ahorro Infanto Juvenil",
    descripcion: "Cuentas de ahorro para niñas, niños y jóvenes asociados.",
  },
  {
    tipo: "AHORRO_SOBRE_PRESTAMO",
    slug: "sobre-prestamo",
    titulo: "Ahorro sobre Préstamo",
    descripcion: "Cuenta en garantía de crédito; no se toca hasta que concluye el pago del préstamo.",
  },
  {
    tipo: "AHORRO_PLAZO_FIJO",
    slug: "plazo-fijo",
    titulo: "Ahorro a Plazo Fijo",
    descripcion: "Certificados de depósito a plazo fijo (Kardex PF) con cálculo de intereses e ISR.",
  },
];

export type CategoriaCajaChica =
  | "SUMINISTROS_OFICINA"
  | "CAFETERIA_LIMPIEZA"
  | "COMBUSTIBLES_LUBRICANTES"
  | "COMISIONES_GASTOS"
  | "TELEFONO"
  | "INTERNET"
  | "ENERGIA_ELECTRICA"
  | "GASTOS_DIVERSOS"
  | "REPARACION_MANTENIMIENTO"
  | "FLETES_ACARREO"
  | "PROYECCION_SOCIAL"
  | "OTRO";

export const CATEGORIA_CAJA_CHICA_LABEL: Record<CategoriaCajaChica, string> = {
  SUMINISTROS_OFICINA: "Suministros de oficina",
  CAFETERIA_LIMPIEZA: "Cafetería y limpieza",
  COMBUSTIBLES_LUBRICANTES: "Combustibles y lubricantes",
  COMISIONES_GASTOS: "Comisiones gastos",
  TELEFONO: "Teléfono",
  INTERNET: "Internet",
  ENERGIA_ELECTRICA: "Energía eléctrica",
  GASTOS_DIVERSOS: "Gastos diversos de agencia",
  REPARACION_MANTENIMIENTO: "Reparación y mantenimiento de agencia",
  FLETES_ACARREO: "Fletes y acarreo",
  PROYECCION_SOCIAL: "Proyección social",
  OTRO: "Otro",
};

export interface CajaChicaComprobante {
  id: string;
  agencia_id: string;
  fecha: string;
  numero_documento: string | null;
  beneficiario: string;
  descripcion: string;
  tipo: "INGRESO" | "EGRESO";
  categoria: CategoriaCajaChica | null;
  monto: string;
  usuario_id: string;
  usuario_nombre: string;
  created_at: string;
}

export interface TotalPorCategoria {
  categoria: string;
  total: number;
}

export interface ListaCajaChica {
  data: CajaChicaComprobante[];
  saldoActual: number;
  totalIngresos: number;
  totalEgresos: number;
  totalesPorCategoria: TotalPorCategoria[];
}

export interface ReporteCajaChicaTotalCat {
  categoria: string;
  total: number;
  cantidad: number;
  porcentaje: number;
}

export interface ReporteCajaChicaUltimaRepo {
  fecha: string;
  numeroDocumento: string;
  monto: number;
  descripcion: string;
}

export interface ReporteCajaChica {
  agencia: { id: string; codigo: string; nombre: string };
  fechaInicio: string | null;
  fechaFin: string | null;
  categoriaFiltro: string | null;
  ultimaReposicion: ReporteCajaChicaUltimaRepo | null;
  saldoAnterior: number;
  totalIngresosPeriodo: number;
  totalEgresosPeriodo: number;
  saldoFinalPeriodo: number;
  saldoDisponibleActual: number;
  egresos: CajaChicaComprobante[];
  ingresos: CajaChicaComprobante[];
  totalesPorCategoria: ReporteCajaChicaTotalCat[];
}

export interface ResumenCuentas {
  totalCuentas: number;
  saldoTotal: number;
  totalDepositos: number;
  totalRetiros: number;
}

export interface ResumenAgencia {
  agenciaId: string;
  agenciaNombre: string;
  agenciaCodigo: string;
  cajaChica: { saldo: number };
  ahorroCorriente: { totalCuentas: number; saldoTotal: number };
  ahorroProgramado: { totalCuentas: number; saldoTotal: number };
  ahorroInfantoJuvenil: { totalCuentas: number; saldoTotal: number };
  carteraPrestamos?: { count: number; saldo: number };
  plazoFijo?: { count: number; monto: number };
  aportaciones?: { count: number; saldo: number };
  totalSocios: number;
  movimientosHoy: number;
}

export interface ResumenDashboard {
  global: {
    cajaChica: number;
    ahorroCorriente: number;
    ahorroProgramado: number;
    ahorroInfantoJuvenil: number;
    carteraPrestamos?: { count: number; saldo: number };
    plazoFijo?: { count: number; monto: number };
    aportaciones?: { count: number; saldo: number };
    totalSocios: number;
    movimientosHoy: number;
  };
  porAgencia: ResumenAgencia[];
}

// ---------------------------------------------------------------------------
// Auxiliar de Caja (libro de caja diario)
// ---------------------------------------------------------------------------

export type CajaCategoria =
  | "SERVICIOS_BI"
  | "DEPOSITO_BI"
  | "RETIRO_BI"
  | "REMESA_BI"
  | "DEPOSITO_AHORRO_CORRIENTE"
  | "DEPOSITO_AHORRO_PROGRAMADO"
  | "DEPOSITO_AHORRO_INFANTO_JUVENIL"
  | "DEPOSITO_AHORRO_SOBRE_PRESTAMO"
  | "RETIRO_AHORRO_CORRIENTE"
  | "RETIRO_AHORRO_PROGRAMADO"
  | "RETIRO_AHORRO_INFANTO_JUVENIL"
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

export interface CategoriaAuxiliarInfo {
  seccion: "BI" | "PROPIO";
  tipo: "INGRESO" | "EGRESO";
  descripcion: string;
  requiereCuenta?: TipoCuentaAhorro;
  requiereSocio?: boolean;
  sinModuloReal?: boolean;
}

export const CATEGORIAS_AUXILIAR: Record<CajaCategoria, CategoriaAuxiliarInfo> = {
  SERVICIOS_BI: { seccion: "BI", tipo: "INGRESO", descripcion: "Cobros por cuenta ajena BI — Servicios" },
  DEPOSITO_BI: { seccion: "BI", tipo: "INGRESO", descripcion: "Cobros por cuenta ajena BI — Depósitos" },
  RETIRO_BI: { seccion: "BI", tipo: "EGRESO", descripcion: "Pago por cuenta ajena BI — Retiro" },
  REMESA_BI: { seccion: "BI", tipo: "EGRESO", descripcion: "Pago por cuenta ajena BI — Remesa" },

  DEPOSITO_AHORRO_CORRIENTE: {
    seccion: "PROPIO",
    tipo: "INGRESO",
    descripcion: "Depósito de Ahorro Corriente",
    requiereCuenta: "AHORRO_CORRIENTE",
  },
  DEPOSITO_AHORRO_PROGRAMADO: {
    seccion: "PROPIO",
    tipo: "INGRESO",
    descripcion: "Depósito de Ahorro Programado",
    requiereCuenta: "AHORRO_PROGRAMADO",
  },
  DEPOSITO_AHORRO_INFANTO_JUVENIL: {
    seccion: "PROPIO",
    tipo: "INGRESO",
    descripcion: "Depósito de Ahorro Infanto Juvenil",
    requiereCuenta: "AHORRO_INFANTO_JUVENIL",
  },
  DEPOSITO_AHORRO_SOBRE_PRESTAMO: {
    seccion: "PROPIO",
    tipo: "INGRESO",
    descripcion: "Depósito Ahorro sobre Préstamo (Garantía)",
    requiereCuenta: "AHORRO_SOBRE_PRESTAMO",
  },
  RETIRO_AHORRO_CORRIENTE: {
    seccion: "PROPIO",
    tipo: "EGRESO",
    descripcion: "Retiro de Ahorro Corriente",
    requiereCuenta: "AHORRO_CORRIENTE",
  },
  RETIRO_AHORRO_PROGRAMADO: {
    seccion: "PROPIO",
    tipo: "EGRESO",
    descripcion: "Retiro de Ahorro Programado",
    requiereCuenta: "AHORRO_PROGRAMADO",
  },
  RETIRO_AHORRO_INFANTO_JUVENIL: {
    seccion: "PROPIO",
    tipo: "EGRESO",
    descripcion: "Retiro de Ahorro Infanto Juvenil",
    requiereCuenta: "AHORRO_INFANTO_JUVENIL",
  },
  RETIRO_AHORRO_SOBRE_PRESTAMO: {
    seccion: "PROPIO",
    tipo: "EGRESO",
    descripcion: "Retiro Ahorro sobre Préstamo (Garantía)",
    requiereCuenta: "AHORRO_SOBRE_PRESTAMO",
  },

  DEPOSITO_PLAZO_FIJO: { seccion: "PROPIO", tipo: "INGRESO", descripcion: "Depósito a Plazo Fijo", requiereSocio: true, sinModuloReal: true },
  RETIRO_PLAZO_FIJO: { seccion: "PROPIO", tipo: "EGRESO", descripcion: "Retiro de Plazo Fijo", requiereSocio: true, sinModuloReal: true },

  APORTACION: { seccion: "PROPIO", tipo: "INGRESO", descripcion: "Aportación", requiereSocio: true },
  INGRESO_ASOCIADO: { seccion: "PROPIO", tipo: "INGRESO", descripcion: "Ingreso de asociado (cuota de ingreso)", requiereSocio: true },
  COMISION: { seccion: "PROPIO", tipo: "INGRESO", descripcion: "Comisión", requiereSocio: true },

  ABONO_PRESTAMO_HIPOTECARIO: { seccion: "PROPIO", tipo: "INGRESO", descripcion: "Abono sobre préstamo hipotecario", requiereSocio: true },
  INTERES_PRESTAMO_HIPOTECARIO: { seccion: "PROPIO", tipo: "INGRESO", descripcion: "Interés hipotecario", requiereSocio: true },
  MORA_PRESTAMO_HIPOTECARIO: { seccion: "PROPIO", tipo: "INGRESO", descripcion: "Mora sobre préstamo hipotecario", requiereSocio: true },
  ABONO_PRESTAMO_FIDUCIARIO: { seccion: "PROPIO", tipo: "INGRESO", descripcion: "Abono sobre préstamo fiduciario", requiereSocio: true },
  INTERES_PRESTAMO_FIDUCIARIO: { seccion: "PROPIO", tipo: "INGRESO", descripcion: "Interés fiduciario", requiereSocio: true },
  MORA_PRESTAMO_FIDUCIARIO: { seccion: "PROPIO", tipo: "INGRESO", descripcion: "Mora sobre préstamo fiduciario", requiereSocio: true },

  COLOCACION_PRESTAMO: { seccion: "PROPIO", tipo: "EGRESO", descripcion: "Colocación de préstamo (desembolso)", requiereSocio: true, sinModuloReal: true },
  EGRESO_VARIO: { seccion: "PROPIO", tipo: "EGRESO", descripcion: "Egreso vario" },
  INGRESO_VARIO: { seccion: "PROPIO", tipo: "INGRESO", descripcion: "Ingreso vario", requiereSocio: true },
};

export const CATEGORIA_AUXILIAR_KEYS = Object.keys(CATEGORIAS_AUXILIAR) as CajaCategoria[];

// Denominaciones de billetes y monedas de Guatemala usadas en el arqueo.
export const DENOMINACIONES_GT = [200, 100, 50, 20, 10, 5, 1, 0.5, 0.25, 0.1, 0.05, 0.01];

export function labelDenominacion(valor: number): string {
  return valor >= 1 ? `Q ${valor}` : `${Math.round(valor * 100)} ctv.`;
}

export interface CajaDia {
  id: string;
  agencia_id: string;
  fecha: string;
  saldo_inicial: string;
  saldo_final: string | null;
  estado: "ABIERTO" | "CERRADO";
  created_at: string;
}

export type EstadoCajaAuxiliar =
  | { estado: "ABIERTO"; dia: CajaDia }
  | { estado: "SIN_ABRIR"; saldoSugerido: number | null; fechaUltimoCierre: string | null; esPrimeraVez: boolean }
  | { estado: "CERRADO"; dia: CajaDia; detalle: DetalleCajaAuxiliar };

export interface CajaMovimientoAuxiliar {
  id: string;
  caja_dia_id: string;
  seccion: "BI" | "PROPIO";
  categoria: CajaCategoria;
  tipo: "INGRESO" | "EGRESO";
  contador: number;
  referencia: string | null;
  socio_id: string | null;
  cuenta_id: string | null;
  beneficiario: string;
  descripcion: string;
  doc_no: string | null;
  monto: string;
  saldo_acumulado: string;
  origen_fondos?: OrigenFondos;
  usuario_id: string;
  usuario_nombre: string;
  created_at: string;
}

export interface DetalleCajaAuxiliar {
  dia: CajaDia;
  movimientos: CajaMovimientoAuxiliar[];
  totalIngreso: number;
  totalEgreso: number;
  saldoActual: number;
  arqueo: { detalle: { valor: number; cantidad: number }[]; total_contado: string; diferencia: string } | null;
}

export function formatoQ(valor: string | number): string {
  return `Q ${Number(valor).toLocaleString("es-GT", { minimumFractionDigits: 2 })}`;
}

export interface UsuarioItem {
  id: string;
  nombre: string;
  email: string;
  rol: RolUsuario;
  activo: boolean;
  agencia_id: string | null;
  agencia_nombre?: string;
  agencia_codigo?: string;
  created_at: string;
}

export type TipoPrestamo = "FIDUCIARIO" | "HIPOTECARIO";
export type EstadoPrestamo = "SOLICITUD" | "APROBADO" | "DESEMBOLSADO" | "CANCELADO" | "RECHAZADO";
export type TipoAmortizacion = "CUOTA_NIVELADA" | "SOBRE_SALDOS";

export interface CuotaAmortizacion {
  numero: number;
  fechaPago: string;
  dias?: number;
  cuota: number;
  capital: number;
  interes: number;
  saldoRestante: number;
}

export type OrigenFondos = "FONDOS_PROPIOS" | "FEDERURAL" | "CHN_GUATEMALA";

export const ORIGEN_FONDOS_LABEL: Record<OrigenFondos, string> = {
  FONDOS_PROPIOS: "Fondos Propios (MIF COOP)",
  FEDERURAL: "FEDERURAL",
  CHN_GUATEMALA: "CHN - Guatemala",
};

export const ORIGEN_FONDOS_SHORT_LABEL: Record<OrigenFondos, string> = {
  FONDOS_PROPIOS: "Fondos Propios",
  FEDERURAL: "FEDERURAL",
  CHN_GUATEMALA: "CHN-GUATEMALA",
};

export const ORIGEN_FONDOS_BADGE_STYLE: Record<
  OrigenFondos,
  { bg: string; color: string; border: string; icon: string }
> = {
  FONDOS_PROPIOS: { bg: "#ecfdf5", color: "#065f46", border: "#a7f3d0", icon: "🏦" },
  FEDERURAL: { bg: "#eff6ff", color: "#1e40af", border: "#bfdbfe", icon: "🌾" },
  CHN_GUATEMALA: { bg: "#fef3c7", color: "#92400e", border: "#fde68a", icon: "🏛️" },
};

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

export interface Prestamo {
  id: string;
  codigo: string;
  socio_id: string;
  socio_nombres?: string;
  numero_asociado?: string;
  socio_dpi?: string;
  socio_telefono?: string;
  socio_direccion?: string;
  agencia_id: string;
  agencia_nombre?: string;
  promotor_id: string | null;
  promotor_nombre?: string | null;
  promotor_email?: string | null;
  tipo: TipoPrestamo;
  estado: EstadoPrestamo;
  tipo_amortizacion: TipoAmortizacion;
  origen_fondos?: OrigenFondos;
  monto_solicitado: string | number;
  monto_aprobado: string | number | null;
  saldo_capital?: string | number | null;
  tasa_interes_mensual: string | number;
  plazo_meses: number;
  cuota_mensual: string | number;
  destino: string | null;
  garantia: string | null;
  ubicacion_garantia?: string | null;
  nombre_fiador?: string | null;
  dpi_fiador?: string | null;
  telefono_fiador?: string | null;
  documento_desembolso?: string | null;
  observaciones: string | null;
  fecha_solicitud: string;
  fecha_aprobacion: string | null;
  fecha_desembolso: string | null;
  fecha_vencimiento?: string | null;
  fecha_ultimo_pago_migracion?: string | null;
  es_migracion?: boolean;
  numero_credito_anterior?: string | null;
  created_at: string;
  amortizacion?: ResultadoSimulacion;
}

export interface FiadorItem {
  prestamo_id: string;
  prestamo_codigo: string;
  prestamo_estado: EstadoPrestamo;
  monto_solicitado: number;
  monto_aprobado: number | null;
  saldo_capital: number | null;
  fecha_solicitud: string;
  fecha_desembolso: string | null;
  nombre_fiador: string;
  dpi_fiador: string | null;
  telefono_fiador: string | null;
  lugar_fiador: string | null;
  socio_id: string;
  socio_numero: string;
  socio_nombre: string;
  agencia_nombre: string;
  promotor_nombre: string | null;
  socio_fiador_id: string | null;
  socio_fiador_numero: string | null;
  socio_fiador_nombres: string | null;
  es_socio_activo: boolean;
}

export interface PrestamoPago {
  id: string;
  prestamo_id: string;
  socio_id: string;
  agencia_id: string;
  caja_dia_id: string | null;
  caja_movimiento_id: string | null;
  fecha: string;
  numero_recibo: string | null;
  abono_capital: string | number;
  interes: string | number;
  mora: string | number;
  total_pagado: string | number;
  saldo_capital_restante: string | number;
  origen_fondos?: OrigenFondos;
  usuario_id: string;
  usuario_nombre?: string;
  created_at: string;
}

export interface KardexCarteraItem extends Prestamo {
  pagos: PrestamoPago[];
  mesFiltro: string;
  pagosMesCount: number;
  totalPagadoMes: number;
  abonoCapitalMes: number;
  totalPagadoHistorico: number;
  ultimoPagoFecha: string | null;
  ultimoPagoRecibo: string | null;
  estadoCuotaMes: "AL_DIA" | "PENDIENTE_MES" | "CANCELADO";
}

export interface KardexCarteraRespuesta {
  items: KardexCarteraItem[];
  resumen: {
    mes: string;
    totalCreditos: number;
    totalCarteraViva: number;
    totalColocadoHipotecario: number;
    countHipotecarios: number;
    totalColocadoFiduciario: number;
    countFiduciarios: number;
    sociosAlDia: number;
    sociosPendientes: number;
    totalCobradoMes: number;
  };
}

export const ESTADO_PRESTAMO_LABEL: Record<EstadoPrestamo, string> = {
  SOLICITUD: "Solicitud",
  APROBADO: "Aprobado",
  DESEMBOLSADO: "Desembolsado",
  CANCELADO: "Cancelado / Pagado",
  RECHAZADO: "Rechazado",
};

export const TIPO_PRESTAMO_LABEL: Record<TipoPrestamo, string> = {
  FIDUCIARIO: "Fiduciario",
  HIPOTECARIO: "Hipotecario",
};

export type EstadoPlazoFijo = "ACTIVO" | "LIQUIDADO";

export interface PlazoFijoContrato {
  id: string;
  cuenta_id: string;
  numero_cuenta: string;
  agencia_id: string;
  agencia_nombre?: string;
  socio_id: string;
  socio_nombres?: string;
  numero_asociado?: string;
  socio_dpi?: string;
  socio_telefono?: string;
  socio_direccion?: string;
  numero_certificacion: string | null;
  plazo_meses: number;
  tasa_anual: string | number;
  isr_porcentaje: string | number;
  monto_deposito: string | number;
  fecha_inicio: string;
  fecha_vencimiento: string;
  interes_generado: string | number;
  interes_neto: string | number;
  saldo_liquido_a_pagar: string | number;
  estado: EstadoPlazoFijo;
  fecha_retiro: string | null;
  recibo_retiro?: string | null;
  monto_liquidado?: string | number | null;
  created_at: string;
  saldo_actual?: string | number;
}

export interface ResultadoSimulacionPF {
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

export const ESTADO_PLAZO_FIJO_LABEL: Record<EstadoPlazoFijo, string> = {
  ACTIVO: "Vigente / Activo",
  LIQUIDADO: "Liquidado / Pagado",
};

// ---------------------------------------------------------------------------
// Liquidación de Promotores (Cobros de Campo)
// ---------------------------------------------------------------------------
export type EstadoCobroCampo = "PENDIENTE" | "LIQUIDADO" | "RECHAZADO";

export interface CobroCampo {
  id: string;
  promotor_id: string;
  agencia_id: string;
  socio_id: string;
  socio_nombres?: string;
  numero_asociado?: string;
  prestamo_id: string;
  prestamo_codigo?: string;
  fecha: string;
  numero_recibo_fisico: string;
  monto: number;
  estado: EstadoCobroCampo;
  justificacion_edicion?: string | null;
  veces_editado: number;
  caja_dia_id?: string | null;
  caja_movimiento_id?: string | null;
  prestamo_pago_id?: string | null;
  created_at: string;
  updated_at: string;
  liquidado_at?: string | null;
}
