export type RolUsuario = "ADMIN" | "GERENCIA" | "SUPERVISOR" | "CAJERO" | "PROMOTOR";
export type EstadoSocio = "ACTIVO" | "INACTIVO";
export type Genero = "M" | "F";

export interface Agencia {
  id: string;
  codigo: string;
  nombre: string;
  direccion: string | null;
  activa: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface Usuario {
  id: string;
  nombre: string;
  email: string;
  password_hash: string;
  rol: RolUsuario;
  activo: boolean;
  agencia_id: string | null;
  created_at: Date;
  updated_at: Date;
}

export type UsuarioPublico = Omit<Usuario, "password_hash">;

export interface Socio {
  id: string;
  numero_asociado: string;
  agencia_id: string;
  nombres: string;
  genero: Genero | null;
  fecha_ingreso: string; // date
  estado: EstadoSocio;
  dpi: string | null;
  direccion: string | null;
  telefono: string | null;
  edad: number | null;
  nombre_beneficiario: string | null;
  dpi_beneficiario: string | null;
  telefono_beneficiario: string | null;
  parentesco_beneficiario: string | null;
  creado_por_id: string | null;
  created_at: Date;
  updated_at: Date;
}

// El usuario autenticado, tal como viaja en el token y en req.user
export interface UsuarioAutenticado {
  id: string;
  nombre: string;
  email: string;
  rol: RolUsuario;
  agenciaId: string | null;
}

export type TipoPrestamo = "FIDUCIARIO" | "HIPOTECARIO";
export type EstadoPrestamo = "SOLICITUD" | "APROBADO" | "DESEMBOLSADO" | "CANCELADO" | "RECHAZADO";
export type TipoAmortizacion = "CUOTA_NIVELADA" | "SOBRE_SALDOS";
export type OrigenFondos = "FONDOS_PROPIOS" | "FEDERURAL" | "CHN_GUATEMALA";

export interface Prestamo {
  id: string;
  codigo: string;
  socio_id: string;
  socio_nombres?: string;
  numero_asociado?: string;
  agencia_id: string;
  agencia_nombre?: string;
  promotor_id: string | null;
  promotor_nombre?: string | null;
  tipo: TipoPrestamo;
  estado: EstadoPrestamo;
  tipo_amortizacion: TipoAmortizacion;
  origen_fondos?: OrigenFondos;
  monto_solicitado: number;
  monto_aprobado: number | null;
  saldo_capital?: number | null;
  tasa_interes_mensual: number;
  plazo_meses: number;
  cuota_mensual: number;
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
  created_at: Date;
  updated_at: Date;
}

export interface CuotaAmortizacion {
  numero: number;
  fechaPago: string;
  dias?: number;
  cuota: number;
  capital: number;
  interes: number;
  saldoRestante: number;
}

export type EstadoPlazoFijo = "ACTIVO" | "LIQUIDADO";

export interface PlazoFijoContrato {
  id: string;
  cuenta_id: string;
  numero_certificacion: string | null;
  plazo_meses: number;
  tasa_anual: number;
  isr_porcentaje: number;
  monto_deposito: number;
  fecha_inicio: string;
  fecha_vencimiento: string;
  interes_generado: number;
  interes_neto: number;
  saldo_liquido_a_pagar: number;
  estado: EstadoPlazoFijo;
  fecha_retiro: string | null;
  recibo_retiro?: string | null;
  monto_liquidado?: number | null;
  created_at: Date;
  updated_at: Date;
}

