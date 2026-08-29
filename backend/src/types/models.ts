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
  nombre_beneficiario: string | null;
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
  monto_solicitado: number;
  monto_aprobado: number | null;
  tasa_interes_mensual: number;
  plazo_meses: number;
  cuota_mensual: number;
  destino: string | null;
  garantia: string | null;
  observaciones: string | null;
  fecha_solicitud: string;
  fecha_aprobacion: string | null;
  fecha_desembolso: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface CuotaAmortizacion {
  numero: number;
  fechaPago: string;
  cuota: number;
  capital: number;
  interes: number;
  saldoRestante: number;
}

