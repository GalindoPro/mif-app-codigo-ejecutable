-- ============================================================================
-- Esquema de base de datos — Sistema Integral MIF (variante Supabase)
-- Igual al esquema original (db/schema.sql), pero:
--   1) "usuarios" ya NO guarda contraseña: su identidad vive en auth.users
--      (Supabase Auth) y usuarios.id referencia ese id.
--   2) Se activa Row Level Security en todas las tablas, con políticas por
--      rol y por agencia — así, aunque alguien llame a la API automática de
--      Supabase (PostgREST) directamente, nunca ve datos de otra agencia.
--
-- Cómo aplicarlo: pega este archivo completo en Supabase → SQL Editor → Run.
-- Es idempotente: se puede correr varias veces sin error.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Tipos enumerados (igual que antes)
-- ---------------------------------------------------------------------------
do $$ begin
  create type rol_usuario as enum ('ADMIN', 'GERENCIA', 'SUPERVISOR', 'CAJERO');
exception when duplicate_object then null; end $$;

do $$ begin
  create type estado_socio as enum ('ACTIVO', 'INACTIVO');
exception when duplicate_object then null; end $$;

do $$ begin
  create type genero as enum ('M', 'F');
exception when duplicate_object then null; end $$;

do $$ begin
  create type tipo_cuenta as enum (
    'APORTACION', 'AHORRO_CORRIENTE', 'AHORRO_PROGRAMADO',
    'AHORRO_INFANTO_JUVENIL', 'AHORRO_PLAZO_FIJO'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type estado_cuenta as enum ('ACTIVA', 'CERRADA');
exception when duplicate_object then null; end $$;

do $$ begin
  create type tipo_movimiento as enum ('DEPOSITO', 'RETIRO', 'AJUSTE');
exception when duplicate_object then null; end $$;

do $$ begin
  create type estado_plazo_fijo as enum ('ACTIVO', 'LIQUIDADO');
exception when duplicate_object then null; end $$;

do $$ begin
  create type tipo_comprobante_caja as enum ('INGRESO', 'EGRESO');
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

-- La identidad y la contraseña las maneja Supabase Auth (tabla auth.users).
-- Esta tabla es el "perfil" de la aplicación: rol, agencia y datos propios.
create table if not exists usuarios (
  id            uuid primary key references auth.users(id) on delete cascade,
  nombre        text not null,
  email         text not null unique,
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
  accion           text not null,
  datos_anteriores jsonb,
  datos_nuevos     jsonb,
  usuario_id       uuid not null references usuarios(id),
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
  creado_por_id        uuid references usuarios(id),
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);
create index if not exists idx_socios_agencia on socios(agencia_id);
create index if not exists idx_socios_nombres on socios using gin (to_tsvector('spanish', nombres));

-- ---------------------------------------------------------------------------
-- Cuentas y movimientos
-- ---------------------------------------------------------------------------
create table if not exists cuentas (
  id            uuid primary key default gen_random_uuid(),
  numero_cuenta text not null unique,
  tipo          tipo_cuenta not null,
  estado        estado_cuenta not null default 'ACTIVA',
  socio_id      uuid not null references socios(id),
  agencia_id    uuid not null references agencias(id),
  saldo_inicial numeric(14,2) not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index if not exists idx_cuentas_socio on cuentas(socio_id);
create index if not exists idx_cuentas_agencia_tipo on cuentas(agencia_id, tipo);

create table if not exists movimientos (
  id                     uuid primary key default gen_random_uuid(),
  cuenta_id              uuid not null references cuentas(id),
  tipo                   tipo_movimiento not null,
  monto                  numeric(14,2) not null,
  fecha                  date not null,
  numero_recibo          text,
  descripcion            text,
  usuario_id             uuid not null references usuarios(id),
  cliente_movimiento_id  text not null unique,
  sincronizado_en        timestamptz,
  created_at             timestamptz not null default now()
);
create index if not exists idx_movimientos_cuenta_fecha on movimientos(cuenta_id, fecha);

create or replace view saldos_cuenta as
select
  c.id as cuenta_id,
  c.agencia_id,
  c.saldo_inicial
    + coalesce(sum(case when m.tipo = 'DEPOSITO' then m.monto
                         when m.tipo = 'AJUSTE' then m.monto
                         else 0 end), 0)
    - coalesce(sum(case when m.tipo = 'RETIRO' then m.monto else 0 end), 0)
    as saldo_actual
from cuentas c
left join movimientos m on m.cuenta_id = c.id
group by c.id, c.agencia_id, c.saldo_inicial;

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
  monto            numeric(14,2) not null,
  usuario_id       uuid not null references usuarios(id),
  created_at       timestamptz not null default now()
);
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

-- ============================================================================
-- Row Level Security
-- ============================================================================

-- Funciones auxiliares: leen el perfil (usuarios) de la persona que hizo la
-- petición (auth.uid()). SECURITY DEFINER + search_path fijo para que se
-- puedan usar dentro de las políticas sin caer en recursión de RLS.
create or replace function usuario_rol()
returns rol_usuario
language sql security definer set search_path = public stable
as $$
  select rol from usuarios where id = auth.uid();
$$;

create or replace function usuario_agencia_id()
returns uuid
language sql security definer set search_path = public stable
as $$
  select agencia_id from usuarios where id = auth.uid();
$$;

create or replace function usuario_es_gerencia()
returns boolean
language sql security definer set search_path = public stable
as $$
  select usuario_rol() in ('ADMIN', 'GERENCIA');
$$;

alter table agencias enable row level security;
alter table usuarios enable row level security;
alter table auditoria enable row level security;
alter table socios enable row level security;
alter table cuentas enable row level security;
alter table movimientos enable row level security;
alter table plazo_fijo_contratos enable row level security;
alter table caja_chica_comprobantes enable row level security;
alter table ingresos_comif enable row level security;

-- agencias: cualquier persona autenticada puede leerlas (para el selector de
-- agencia); solo ADMIN puede crear/editar.
drop policy if exists agencias_select on agencias;
create policy agencias_select on agencias for select
  using (auth.role() = 'authenticated');

drop policy if exists agencias_write on agencias;
create policy agencias_write on agencias for all
  using (usuario_rol() = 'ADMIN') with check (usuario_rol() = 'ADMIN');

-- usuarios: cada quien ve su propio perfil; ADMIN/GERENCIA ven todos;
-- SUPERVISOR ve los de su agencia. Solo ADMIN puede crear usuarios (el alta
-- real de la cuenta de acceso se hace vía Auth Admin API desde el backend).
drop policy if exists usuarios_select on usuarios;
create policy usuarios_select on usuarios for select
  using (
    id = auth.uid()
    or usuario_es_gerencia()
    or (usuario_rol() = 'SUPERVISOR' and agencia_id = usuario_agencia_id())
  );

drop policy if exists usuarios_write on usuarios;
create policy usuarios_write on usuarios for all
  using (usuario_rol() = 'ADMIN') with check (usuario_rol() = 'ADMIN');

-- auditoria: solo ADMIN/GERENCIA la consultan; cualquier autenticado puede
-- insertar (queda su propio usuario_id como autor).
drop policy if exists auditoria_select on auditoria;
create policy auditoria_select on auditoria for select
  using (usuario_es_gerencia());

drop policy if exists auditoria_insert on auditoria;
create policy auditoria_insert on auditoria for insert
  with check (usuario_id = auth.uid());

-- socios: visibles/editables por ADMIN/GERENCIA (todas las agencias) o por
-- SUPERVISOR/CAJERO limitados a su propia agencia.
drop policy if exists socios_select on socios;
create policy socios_select on socios for select
  using (usuario_es_gerencia() or agencia_id = usuario_agencia_id());

drop policy if exists socios_write on socios;
create policy socios_write on socios for all
  using (usuario_es_gerencia() or agencia_id = usuario_agencia_id())
  with check (usuario_es_gerencia() or agencia_id = usuario_agencia_id());

-- cuentas, movimientos, plazo fijo, caja chica e ingresos COMIF: mismo
-- criterio, ya sea por agencia_id directo o por la agencia de su cuenta.
drop policy if exists cuentas_rw on cuentas;
create policy cuentas_rw on cuentas for all
  using (usuario_es_gerencia() or agencia_id = usuario_agencia_id())
  with check (usuario_es_gerencia() or agencia_id = usuario_agencia_id());

drop policy if exists movimientos_rw on movimientos;
create policy movimientos_rw on movimientos for all
  using (
    usuario_es_gerencia()
    or cuenta_id in (select id from cuentas where agencia_id = usuario_agencia_id())
  )
  with check (
    usuario_es_gerencia()
    or cuenta_id in (select id from cuentas where agencia_id = usuario_agencia_id())
  );

drop policy if exists plazo_fijo_rw on plazo_fijo_contratos;
create policy plazo_fijo_rw on plazo_fijo_contratos for all
  using (
    usuario_es_gerencia()
    or cuenta_id in (select id from cuentas where agencia_id = usuario_agencia_id())
  )
  with check (
    usuario_es_gerencia()
    or cuenta_id in (select id from cuentas where agencia_id = usuario_agencia_id())
  );

drop policy if exists caja_chica_rw on caja_chica_comprobantes;
create policy caja_chica_rw on caja_chica_comprobantes for all
  using (usuario_es_gerencia() or agencia_id = usuario_agencia_id())
  with check (usuario_es_gerencia() or agencia_id = usuario_agencia_id());

drop policy if exists ingresos_comif_rw on ingresos_comif;
create policy ingresos_comif_rw on ingresos_comif for all
  using (usuario_es_gerencia() or agencia_id = usuario_agencia_id())
  with check (usuario_es_gerencia() or agencia_id = usuario_agencia_id());
