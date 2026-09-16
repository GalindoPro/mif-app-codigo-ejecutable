-- ============================================================================
-- Esquema de base de datos — Sistema Integral MIF
-- Fase 1: se modela TODO el dominio (para no rediseñar la base más adelante),
-- aunque la API y el frontend de esta fase solo construyen Agencias, Usuarios
-- y Socios. El resto de tablas (cuentas, movimientos, plazo fijo, caja chica,
-- ingresos COMIF) quedan listas para las siguientes fases.
--
-- Este script es idempotente: se puede correr varias veces sin error.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Tipos enumerados
-- ---------------------------------------------------------------------------
do $$ begin
  create type rol_usuario as enum ('ADMIN', 'GERENCIA', 'SUPERVISOR', 'CAJERO', 'PROMOTOR');
exception when duplicate_object then null; end $$;
alter type rol_usuario add value if not exists 'PROMOTOR';
alter type rol_usuario add value if not exists 'CAJA_CHICA';


do $$ begin
  create type estado_socio as enum ('ACTIVO', 'INACTIVO');
exception when duplicate_object then null; end $$;

do $$ begin
  create type genero as enum ('M', 'F');
exception when duplicate_object then null; end $$;

do $$ begin
  create type tipo_cuenta as enum (
    'APORTACION', 'AHORRO_CORRIENTE', 'AHORRO_PROGRAMADO',
    'AHORRO_INFANTO_JUVENIL', 'AHORRO_PLAZO_FIJO', 'AHORRO_SOBRE_PRESTAMO'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type estado_cuenta as enum ('ACTIVA', 'CERRADA');
exception when duplicate_object then null; end $$;

do $$ begin
  create type tipo_movimiento as enum ('DEPOSITO', 'RETIRO', 'AJUSTE');
exception when duplicate_object then null; end $$;

do $$ begin
  create type estado_caja_dia as enum ('ABIERTO', 'CERRADO');
exception when duplicate_object then null; end $$;

do $$ begin
  create type caja_seccion as enum ('BI', 'PROPIO');
exception when duplicate_object then null; end $$;

do $$ begin
  create type caja_categoria as enum (
    'SERVICIOS_BI', 'DEPOSITO_BI', 'RETIRO_BI', 'REMESA_BI',
    'DEPOSITO_AHORRO_CORRIENTE', 'DEPOSITO_AHORRO_PROGRAMADO', 'DEPOSITO_AHORRO_INFANTO_JUVENIL',
    'RETIRO_AHORRO_CORRIENTE', 'RETIRO_AHORRO_PROGRAMADO', 'RETIRO_AHORRO_INFANTO_JUVENIL',
    'DEPOSITO_AHORRO_SOBRE_PRESTAMO', 'RETIRO_AHORRO_SOBRE_PRESTAMO',
    'DEPOSITO_PLAZO_FIJO', 'RETIRO_PLAZO_FIJO',
    'APORTACION', 'INGRESO_ASOCIADO', 'COMISION',
    'ABONO_PRESTAMO_HIPOTECARIO', 'INTERES_PRESTAMO_HIPOTECARIO', 'MORA_PRESTAMO_HIPOTECARIO',
    'ABONO_PRESTAMO_FIDUCIARIO', 'INTERES_PRESTAMO_FIDUCIARIO', 'MORA_PRESTAMO_FIDUCIARIO',
    'COLOCACION_PRESTAMO', 'EGRESO_VARIO', 'INGRESO_VARIO'
  );
exception when duplicate_object then null; end $$;
alter type caja_categoria add value if not exists 'DEPOSITO_AHORRO_SOBRE_PRESTAMO';
alter type caja_categoria add value if not exists 'RETIRO_AHORRO_SOBRE_PRESTAMO';


do $$ begin
  create type estado_plazo_fijo as enum ('ACTIVO', 'LIQUIDADO');
exception when duplicate_object then null; end $$;

do $$ begin
  create type tipo_comprobante_caja as enum ('INGRESO', 'EGRESO');
exception when duplicate_object then null; end $$;

do $$ begin
  create type categoria_caja_chica as enum (
    'SUMINISTROS_OFICINA', 'CAFETERIA_LIMPIEZA', 'COMBUSTIBLES_LUBRICANTES',
    'COMISIONES_GASTOS', 'TELEFONO', 'INTERNET', 'ENERGIA_ELECTRICA',
    'GASTOS_DIVERSOS', 'REPARACION_MANTENIMIENTO', 'FLETES_ACARREO',
    'PROYECCION_SOCIAL', 'OTRO'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type categoria_ingreso_comif as enum (
    'ABONO_PRESTAMO', 'APORTACION_VOLUNTARIA', 'ABONO_PRESTAMO_FIDUCIARIO',
    'INTERES_FIDUCIARIO', 'COMISION_PRESTAMO', 'INTERES_PRESTAMO',
    'CUOTA_INGRESO', 'INGRESO_VARIO', 'MORA_PRESTAMO'
  );
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------------
-- Organización y acceso
-- ---------------------------------------------------------------------------
create table if not exists agencias (
  id         uuid primary key default gen_random_uuid(),
  codigo     text not null unique,
  nombre     text not null,
  direccion  text,
  activa     boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists usuarios (
  id            uuid primary key default gen_random_uuid(),
  nombre        text not null,
  email         text not null unique,
  password_hash text not null,
  rol           rol_usuario not null,
  activo        boolean not null default true,
  agencia_id    uuid references agencias(id),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index if not exists idx_usuarios_agencia on usuarios(agencia_id);

create table if not exists auditoria (
  id               uuid primary key default gen_random_uuid(),
  entidad          text not null,
  entidad_id       uuid not null,
  accion           text not null, -- CREAR | ACTUALIZAR | ELIMINAR
  datos_anteriores jsonb,
  datos_nuevos     jsonb,
  usuario_id       uuid not null references usuarios(id),
  motivo           text,
  fecha            timestamptz not null default now()
);
create index if not exists idx_auditoria_entidad on auditoria(entidad, entidad_id);
create index if not exists idx_auditoria_usuario on auditoria(usuario_id);

-- ---------------------------------------------------------------------------
-- Socios
-- ---------------------------------------------------------------------------
create table if not exists socios (
  id                   uuid primary key default gen_random_uuid(),
  numero_asociado      text not null unique,
  agencia_id           uuid not null references agencias(id),
  nombres              text not null,
  genero               genero,
  fecha_ingreso        date not null,
  estado               estado_socio not null default 'ACTIVO',
  dpi                  text unique,
  direccion            text,
  telefono             text,
  nombre_beneficiario  text,
  dpi_beneficiario     text,
  telefono_beneficiario text,
  parentesco_beneficiario text,
  creado_por_id        uuid references usuarios(id),
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);
create index if not exists idx_socios_agencia on socios(agencia_id);
create index if not exists idx_socios_nombres on socios using gin (to_tsvector('spanish', nombres));

alter table socios add column if not exists dpi_beneficiario text;
alter table socios add column if not exists telefono_beneficiario text;
alter table socios add column if not exists parentesco_beneficiario text;

-- ---------------------------------------------------------------------------
-- Cuentas y movimientos
-- ---------------------------------------------------------------------------
create table if not exists cuentas (
  id                     uuid primary key default gen_random_uuid(),
  numero_cuenta          text not null unique,
  tipo                   tipo_cuenta not null,
  estado                 estado_cuenta not null default 'ACTIVA',
  socio_id               uuid not null references socios(id),
  agencia_id             uuid not null references agencias(id),
  saldo_inicial          numeric(14,2) not null default 0,
  cuota_pactada          numeric(14,2),
  observaciones_apertura text,
  prestamo_id            uuid,
  creado_por_id          uuid references usuarios(id),
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);
create index if not exists idx_cuentas_socio on cuentas(socio_id);
create index if not exists idx_cuentas_agencia_tipo on cuentas(agencia_id, tipo);
create index if not exists idx_cuentas_prestamo on cuentas(prestamo_id);

alter type tipo_cuenta add value if not exists 'AHORRO_SOBRE_PRESTAMO';
alter table cuentas add column if not exists cuota_pactada numeric(14,2);
alter table cuentas add column if not exists observaciones_apertura text;
alter table cuentas add column if not exists prestamo_id uuid;
alter table cuentas add column if not exists creado_por_id uuid references usuarios(id);
alter table cuentas add column if not exists titular_menor_nombre text;
alter table cuentas add column if not exists titular_menor_parentesco text;
alter table cuentas add column if not exists titular_menor_cui text;
alter table cuentas add column if not exists titular_menor_fecha_nacimiento date;

-- El saldo de una cuenta NUNCA se guarda como campo fijo: se calcula sumando
-- sus movimientos (ver vista saldos_cuenta más abajo). Esto reemplaza las
-- fórmulas de saldo corrido (=G+H-I) del Excel actual.
create table if not exists movimientos (
  id                     uuid primary key default gen_random_uuid(),
  cuenta_id              uuid not null references cuentas(id),
  tipo                   tipo_movimiento not null,
  monto                  numeric(14,2) not null,
  fecha                  date not null,
  numero_recibo          text,
  descripcion            text,
  usuario_id             uuid not null references usuarios(id),
  -- Generado en el dispositivo al capturar (incluso sin internet). Permite
  -- que la sincronización offline nunca duplique un movimiento reenviado.
  cliente_movimiento_id  text not null unique,
  sincronizado_en        timestamptz,
  created_at             timestamptz not null default now()
);
create index if not exists idx_movimientos_cuenta_fecha on movimientos(cuenta_id, fecha);

create or replace view saldos_cuenta as
select
  c.id as cuenta_id,
  c.saldo_inicial
    + coalesce(sum(case when m.tipo = 'DEPOSITO' then m.monto
                         when m.tipo = 'AJUSTE' then m.monto
                         else 0 end), 0)
    - coalesce(sum(case when m.tipo = 'RETIRO' then m.monto else 0 end), 0)
    as saldo_actual
from cuentas c
left join movimientos m on m.cuenta_id = c.id
group by c.id, c.saldo_inicial;

-- ---------------------------------------------------------------------------
-- Ahorro a plazo fijo
-- ---------------------------------------------------------------------------
create table if not exists plazo_fijo_contratos (
  id                     uuid primary key default gen_random_uuid(),
  cuenta_id              uuid not null unique references cuentas(id),
  numero_certificacion   text,
  plazo_meses            int not null,
  tasa_anual             numeric(5,2) not null,
  isr_porcentaje         numeric(5,2) not null default 10,
  monto_deposito         numeric(14,2) not null,
  fecha_inicio           date not null,
  fecha_vencimiento      date not null,
  interes_generado       numeric(14,2),
  interes_neto           numeric(14,2),
  saldo_liquido_a_pagar  numeric(14,2),
  estado                 estado_plazo_fijo not null default 'ACTIVO',
  fecha_retiro           date,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);
create index if not exists idx_plazo_fijo_vencimiento on plazo_fijo_contratos(fecha_vencimiento);
alter table plazo_fijo_contratos add column if not exists recibo_retiro text;
alter table plazo_fijo_contratos add column if not exists monto_liquidado numeric(14,2);

-- ---------------------------------------------------------------------------
-- Caja chica
-- ---------------------------------------------------------------------------
create table if not exists caja_chica_comprobantes (
  id               uuid primary key default gen_random_uuid(),
  agencia_id       uuid not null references agencias(id),
  fecha            date not null,
  numero_documento text,
  beneficiario     text not null,
  descripcion      text not null,
  tipo             tipo_comprobante_caja not null,
  categoria        categoria_caja_chica,
  monto            numeric(14,2) not null,
  usuario_id       uuid not null references usuarios(id),
  created_at       timestamptz not null default now()
);
alter table caja_chica_comprobantes add column if not exists categoria categoria_caja_chica;
create index if not exists idx_caja_chica_agencia_fecha on caja_chica_comprobantes(agencia_id, fecha);

-- ---------------------------------------------------------------------------
-- Ingresos COMIF
-- ---------------------------------------------------------------------------
create table if not exists ingresos_comif (
  id               uuid primary key default gen_random_uuid(),
  agencia_id       uuid not null references agencias(id),
  fecha            date not null,
  numero_documento text,
  nombre_socio     text not null,
  categoria        categoria_ingreso_comif not null,
  monto            numeric(14,2) not null,
  usuario_id       uuid not null references usuarios(id),
  created_at       timestamptz not null default now()
);
create index if not exists idx_ingresos_comif_agencia_fecha on ingresos_comif(agencia_id, fecha);

-- ---------------------------------------------------------------------------
-- Auxiliar de Caja (libro de caja diario: transacciones agente Bi + propias)
-- ---------------------------------------------------------------------------
create table if not exists caja_dias (
  id            uuid primary key default gen_random_uuid(),
  agencia_id    uuid not null references agencias(id),
  fecha         date not null,
  saldo_inicial numeric(14,2) not null,
  saldo_final   numeric(14,2),
  estado        estado_caja_dia not null default 'ABIERTO',
  abierto_por   uuid not null references usuarios(id),
  cerrado_por   uuid references usuarios(id),
  cerrado_at    timestamptz,
  created_at    timestamptz not null default now(),
  unique (agencia_id, fecha)
);
create index if not exists idx_caja_dias_agencia_fecha on caja_dias(agencia_id, fecha desc);

create table if not exists caja_movimientos_auxiliar (
  id               uuid primary key default gen_random_uuid(),
  caja_dia_id      uuid not null references caja_dias(id),
  agencia_id       uuid not null references agencias(id),
  fecha            date not null,
  seccion          caja_seccion not null,
  categoria        caja_categoria not null,
  tipo             tipo_comprobante_caja not null,
  contador         int not null,
  referencia       text,
  socio_id         uuid references socios(id),
  cuenta_id        uuid references cuentas(id),
  movimiento_id    uuid references movimientos(id),
  ingreso_comif_id uuid references ingresos_comif(id),
  beneficiario     text not null,
  descripcion      text not null,
  doc_no           text,
  monto            numeric(14,2) not null,
  saldo_acumulado  numeric(14,2) not null,
  usuario_id       uuid not null references usuarios(id),
  created_at       timestamptz not null default now(),
  saldo_anterior_reportado numeric(14,2),
  saldo_actual_reportado   numeric(14,2),
  numero_cuota             int
);
create index if not exists idx_caja_mov_aux_dia on caja_movimientos_auxiliar(caja_dia_id, created_at);
create index if not exists idx_caja_mov_aux_agencia_categoria on caja_movimientos_auxiliar(agencia_id, categoria);

create table if not exists caja_arqueos (
  id              uuid primary key default gen_random_uuid(),
  caja_dia_id     uuid not null unique references caja_dias(id),
  detalle         jsonb not null,
  total_contado   numeric(14,2) not null,
  diferencia      numeric(14,2) not null,
  usuario_id      uuid not null references usuarios(id),
  created_at      timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Módulo de Créditos / Préstamos
-- ---------------------------------------------------------------------------
do $$ begin
  create type tipo_prestamo as enum ('FIDUCIARIO', 'HIPOTECARIO');
exception when duplicate_object then null; end $$;

do $$ begin
  create type estado_prestamo as enum ('SOLICITUD', 'APROBADO', 'DESEMBOLSADO', 'CANCELADO', 'RECHAZADO');
exception when duplicate_object then null; end $$;

do $$ begin
  create type tipo_amortizacion as enum ('CUOTA_NIVELADA', 'SOBRE_SALDOS');
exception when duplicate_object then null; end $$;

create table if not exists prestamos (
  id                    uuid primary key default gen_random_uuid(),
  codigo                text not null unique,
  socio_id              uuid not null references socios(id),
  agencia_id            uuid not null references agencias(id),
  promotor_id           uuid references usuarios(id),
  tipo                  tipo_prestamo not null default 'FIDUCIARIO',
  estado                estado_prestamo not null default 'SOLICITUD',
  tipo_amortizacion     tipo_amortizacion not null default 'CUOTA_NIVELADA',
  monto_solicitado      numeric(14,2) not null,
  monto_aprobado        numeric(14,2),
  tasa_interes_mensual  numeric(6,2) not null default 2.00,
  plazo_meses           integer not null,
  cuota_mensual         numeric(14,2) not null,
  destino               text,
  garantia              text,
  observaciones         text,
  fecha_solicitud       date not null default current_date,
  fecha_aprobacion      date,
  fecha_desembolso      date,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create index if not exists idx_prestamos_socio on prestamos(socio_id);
create index if not exists idx_prestamos_agencia on prestamos(agencia_id);
create index if not exists idx_prestamos_promotor on prestamos(promotor_id);
create index if not exists idx_prestamos_estado on prestamos(estado);

alter table prestamos add column if not exists saldo_capital numeric(14,2);
alter table prestamos add column if not exists ubicacion_garantia text;
alter table prestamos add column if not exists nombre_fiador text;
alter table prestamos add column if not exists dpi_fiador text;
alter table prestamos add column if not exists telefono_fiador text;
alter table prestamos add column if not exists documento_desembolso text;
alter table prestamos add column if not exists fecha_vencimiento date;
alter table prestamos add column if not exists origen_fondos text not null default 'FONDOS_PROPIOS';
alter table prestamos add column if not exists fecha_ultimo_pago_migracion date;
alter table prestamos add column if not exists es_migracion boolean default false;
alter table prestamos add column if not exists numero_credito_anterior text;

do $$ begin
  alter table cuentas add constraint fk_cuentas_prestamo foreign key (prestamo_id) references prestamos(id) on delete set null;
exception when duplicate_object then null; end $$;

create table if not exists prestamo_pagos (
  id                       uuid primary key default gen_random_uuid(),
  prestamo_id              uuid not null references prestamos(id),
  socio_id                 uuid not null references socios(id),
  agencia_id               uuid not null references agencias(id),
  caja_dia_id              uuid references caja_dias(id),
  caja_movimiento_id       uuid references caja_movimientos_auxiliar(id),
  fecha                    date not null default current_date,
  numero_recibo            text,
  abono_capital            numeric(14,2) not null default 0,
  interes                  numeric(14,2) not null default 0,
  mora                     numeric(14,2) not null default 0,
  total_pagado             numeric(14,2) not null,
  saldo_capital_restante   numeric(14,2) not null,
  origen_fondos            text default 'FONDOS_PROPIOS',
  usuario_id               uuid not null references usuarios(id),
  created_at               timestamptz not null default now()
);

create index if not exists idx_prestamo_pagos_prestamo on prestamo_pagos(prestamo_id, fecha);
create index if not exists idx_prestamo_pagos_socio on prestamo_pagos(socio_id);

alter table prestamo_pagos add column if not exists origen_fondos text default 'FONDOS_PROPIOS';
alter table caja_movimientos_auxiliar add column if not exists origen_fondos text;
alter table ingresos_comif add column if not exists origen_fondos text;

-- ---------------------------------------------------------------------------
-- Liquidación de Promotores (Cobros de Campo)
-- ---------------------------------------------------------------------------
do $$ begin
  create type estado_cobro_campo as enum ('PENDIENTE', 'LIQUIDADO', 'RECHAZADO');
exception when duplicate_object then null; end $$;

create table if not exists cobros_campo (
  id                       uuid primary key default gen_random_uuid(),
  promotor_id              uuid not null references usuarios(id),
  agencia_id               uuid not null references agencias(id),
  socio_id                 uuid not null references socios(id),
  prestamo_id              uuid not null references prestamos(id),
  fecha                    date not null default current_date,
  numero_recibo_fisico     text not null,
  monto                    numeric(14,2) not null,
  pago_capital             numeric(14,2) not null default 0,
  pago_interes             numeric(14,2) not null default 0,
  pago_mora                numeric(14,2) not null default 0,
  ahorro_prestamo          numeric(14,2) not null default 0,
  estado                   estado_cobro_campo not null default 'PENDIENTE',
  justificacion_edicion    text,
  veces_editado            integer not null default 0,
  caja_dia_id              uuid references caja_dias(id),
  caja_movimiento_id       uuid references caja_movimientos_auxiliar(id),
  prestamo_pago_id         uuid references prestamo_pagos(id),
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now(),
  liquidado_at             timestamptz
);

create index if not exists idx_cobros_campo_promotor on cobros_campo(promotor_id, estado);
create index if not exists idx_cobros_campo_prestamo on cobros_campo(prestamo_id);

-- ---------------------------------------------------------------------------
-- Google Drive Integración
-- ---------------------------------------------------------------------------

create table if not exists usuario_drive_tokens (
  usuario_id      uuid primary key references usuarios(id) on delete cascade,
  access_token    text not null,
  refresh_token   text,
  expiry_date     bigint,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create table if not exists drive_sync_queue (
  id              uuid primary key default uuid_generate_v4(),
  usuario_id      uuid not null references usuarios(id) on delete cascade,
  nombre_archivo  text not null,
  carpeta_destino text not null,
  archivo_base64  text not null,
  status          text not null default 'PENDING', -- PENDING, COMPLETED, FAILED
  intentos        integer not null default 0,
  error_mensaje   text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

