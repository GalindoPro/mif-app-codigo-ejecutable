# Código del backend — Sistema Integral MIF

Código real y completo del backend (API en Node.js + TypeScript + PostgreSQL), tal como está construido y probado en la Fase 1. Incluye también el borrador de esquema adaptado a Supabase (`db/schema.supabase.sql`), que todavía no está conectado al código — está listo para cuando confirmemos cómo seguir con la integración de Supabase.

## Índice de archivos

- [`backend/package.json`](#backendpackagejson)
- [`backend/tsconfig.json`](#backendtsconfigjson)
- [`backend/src/app.ts`](#backendsrcappts)
- [`backend/src/index.ts`](#backendsrcindexts)
- [`backend/src/modules/agencias/routes.ts`](#backendsrcmodulesagenciasroutests)
- [`backend/src/modules/agencias/service.ts`](#backendsrcmodulesagenciasservicets)
- [`backend/src/modules/auth/routes.ts`](#backendsrcmodulesauthroutests)
- [`backend/src/modules/auth/service.ts`](#backendsrcmodulesauthservicets)
- [`backend/src/modules/usuarios/routes.ts`](#backendsrcmodulesusuariosroutests)
- [`backend/src/modules/usuarios/service.ts`](#backendsrcmodulesusuariosservicets)
- [`backend/src/modules/cuentas/routes.ts`](#backendsrcmodulescuentasroutests)
- [`backend/src/modules/cuentas/service.ts`](#backendsrcmodulescuentasservicets)
- [`backend/src/modules/cajachica/routes.ts`](#backendsrcmodulescajachicaroutests)
- [`backend/src/modules/cajachica/service.ts`](#backendsrcmodulescajachicaservicets)
- [`backend/src/modules/cajaauxiliar/categorias.ts`](#backendsrcmodulescajaauxiliarcategoriasts)
- [`backend/src/modules/cajaauxiliar/routes.ts`](#backendsrcmodulescajaauxiliarroutests)
- [`backend/src/modules/cajaauxiliar/service.ts`](#backendsrcmodulescajaauxiliarservicets)
- [`backend/src/modules/dashboard/routes.ts`](#backendsrcmodulesdashboardroutests)
- [`backend/src/modules/dashboard/service.ts`](#backendsrcmodulesdashboardservicets)
- [`backend/src/modules/socios/routes.ts`](#backendsrcmodulessociosroutests)
- [`backend/src/modules/socios/service.ts`](#backendsrcmodulessociosservicets)
- [`backend/src/types/models.ts`](#backendsrctypesmodelsts)
- [`backend/src/middleware/auth.ts`](#backendsrcmiddlewareauthts)
- [`backend/src/middleware/errorHandler.ts`](#backendsrcmiddlewareerrorhandlerts)
- [`backend/src/db/migrate.ts`](#backendsrcdbmigratets)
- [`backend/src/db/pool.ts`](#backendsrcdbpoolts)
- [`backend/src/db/seed.ts`](#backendsrcdbseedts)
- [`backend/src/utils/asyncHandler.ts`](#backendsrcutilsasynchandlerts)
- [`backend/src/utils/auditoria.ts`](#backendsrcutilsauditoriats)
- [`backend/src/utils/auth.ts`](#backendsrcutilsauthts)
- [`backend/src/utils/errors.ts`](#backendsrcutilserrorsts)
- [`backend/db/schema.sql`](#backenddbschemasql)
- [`backend/db/schema.supabase.sql`](#backenddbschemasupabasesql)

---

## `backend/package.json` {#backendpackagejson}

```json
{
  "name": "mif-backend",
  "version": "0.1.0",
  "private": true,
  "type": "commonjs",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc -p tsconfig.json",
    "start": "node dist/index.js",
    "db:migrate": "tsx src/db/migrate.ts",
    "db:seed": "tsx src/db/seed.ts",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "bcryptjs": "^2.4.3",
    "cors": "^2.8.5",
    "dotenv": "^16.4.5",
    "express": "^4.21.0",
    "jsonwebtoken": "^9.0.2",
    "pg": "^8.23.0",
    "zod": "^3.23.8"
  },
  "devDependencies": {
    "@types/bcryptjs": "^2.4.6",
    "@types/cors": "^2.8.17",
    "@types/express": "^4.17.21",
    "@types/jsonwebtoken": "^9.0.7",
    "@types/node": "^20.14.15",
    "@types/pg": "^8.23.1",
    "tsx": "^4.19.1",
    "typescript": "^5.5.4"
  }
}
```

## `backend/tsconfig.json` {#backendtsconfigjson}

```json
{
  "compilerOptions": {
    "target": "ES2021",
    "module": "commonjs",
    "moduleResolution": "node",
    "lib": ["ES2021"],
    "outDir": "dist",
    "rootDir": "src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": false,
    "sourceMap": true
  },
  "include": ["src"]
}
```

## `backend/src/app.ts` {#backendsrcappts}

```ts
import "dotenv/config";
import cors from "cors";
import express from "express";
import { errorHandler } from "./middleware/errorHandler";
import { authRouter } from "./modules/auth/routes";
import { agenciasRouter } from "./modules/agencias/routes";
import { usuariosRouter } from "./modules/usuarios/routes";
import { sociosRouter } from "./modules/socios/routes";
import { cuentasRouter } from "./modules/cuentas/routes";
import { cajaChicaRouter } from "./modules/cajachica/routes";
import { cajaAuxiliarRouter } from "./modules/cajaauxiliar/routes";
import { dashboardRouter } from "./modules/dashboard/routes";

export const app = express();

app.use(cors({ origin: process.env.CORS_ORIGIN?.split(",") ?? true, credentials: true }));
app.use(express.json());

app.get("/health", (_req, res) => res.json({ ok: true, servicio: "mif-backend" }));

app.use("/api/auth", authRouter);
app.use("/api/agencias", agenciasRouter);
app.use("/api/usuarios", usuariosRouter);
app.use("/api/socios", sociosRouter);
app.use("/api/cuentas", cuentasRouter);
app.use("/api/caja-chica", cajaChicaRouter);
app.use("/api/caja-auxiliar", cajaAuxiliarRouter);
app.use("/api/dashboard", dashboardRouter);

app.use((_req, res) => res.status(404).json({ error: "Ruta no encontrada" }));
app.use(errorHandler);
```

## `backend/src/index.ts` {#backendsrcindexts}

```ts
import { app } from "./app";

const port = Number(process.env.PORT) || 4000;

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`MIF backend escuchando en http://localhost:${port}`);
});
```

## `backend/src/modules/agencias/routes.ts` {#backendsrcmodulesagenciasroutests}

```ts
import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../../utils/asyncHandler";
import { requireAuth, requireRole } from "../../middleware/auth";
import * as service from "./service";

export const agenciasRouter = Router();
agenciasRouter.use(requireAuth);

agenciasRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    res.json(await service.listar());
  }),
);

const crearSchema = z.object({
  codigo: z.string().min(2).max(30),
  nombre: z.string().min(2),
  direccion: z.string().optional(),
});

agenciasRouter.post(
  "/",
  requireRole("ADMIN"),
  asyncHandler(async (req, res) => {
    const data = crearSchema.parse(req.body);
    res.status(201).json(await service.crear(data));
  }),
);
```

## `backend/src/modules/agencias/service.ts` {#backendsrcmodulesagenciasservicets}

```ts
import { pool } from "../../db/pool";
import { Agencia } from "../../types/models";
import { conflict } from "../../utils/errors";

export async function listar(): Promise<Agencia[]> {
  const { rows } = await pool.query<Agencia>(`select * from agencias order by nombre`);
  return rows;
}

export async function crear(data: { codigo: string; nombre: string; direccion?: string }) {
  try {
    const { rows } = await pool.query<Agencia>(
      `insert into agencias (codigo, nombre, direccion) values ($1, $2, $3) returning *`,
      [data.codigo.toUpperCase(), data.nombre, data.direccion ?? null],
    );
    return rows[0];
  } catch (err) {
    if (typeof err === "object" && err && "code" in err && (err as { code: string }).code === "23505") {
      throw conflict(`Ya existe una agencia con el código "${data.codigo}"`);
    }
    throw err;
  }
}
```

## `backend/src/modules/auth/routes.ts` {#backendsrcmodulesauthroutests}

```ts
import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../../utils/asyncHandler";
import { requireAuth } from "../../middleware/auth";
import * as service from "./service";

export const authRouter = Router();

const loginSchema = z.object({
  email: z.string().email("Correo inválido"),
  password: z.string().min(1, "La contraseña es obligatoria"),
});

authRouter.post(
  "/login",
  asyncHandler(async (req, res) => {
    const { email, password } = loginSchema.parse(req.body);
    const result = await service.login(email, password);
    res.json(result);
  }),
);

authRouter.get("/me", requireAuth, (req, res) => {
  res.json({ usuario: req.user });
});
```

## `backend/src/modules/auth/service.ts` {#backendsrcmodulesauthservicets}

```ts
import { pool } from "../../db/pool";
import { comparePassword, signToken } from "../../utils/auth";
import { unauthorized } from "../../utils/errors";
import { Usuario, UsuarioAutenticado } from "../../types/models";

export async function login(email: string, password: string) {
  const { rows } = await pool.query<Usuario>(
    `select * from usuarios where lower(email) = lower($1) limit 1`,
    [email],
  );
  const usuario = rows[0];
  if (!usuario || !usuario.activo) throw unauthorized("Correo o contraseña incorrectos");

  const ok = await comparePassword(password, usuario.password_hash);
  if (!ok) throw unauthorized("Correo o contraseña incorrectos");

  const payload: UsuarioAutenticado = {
    id: usuario.id,
    nombre: usuario.nombre,
    email: usuario.email,
    rol: usuario.rol,
    agenciaId: usuario.agencia_id,
  };
  return { token: signToken(payload), usuario: payload };
}
```

## `backend/src/modules/usuarios/routes.ts` {#backendsrcmodulesusuariosroutests}

```ts
import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../../utils/asyncHandler";
import { requireAuth, requireRole, agenciaVisible } from "../../middleware/auth";
import * as service from "./service";

export const usuariosRouter = Router();
usuariosRouter.use(requireAuth);

usuariosRouter.get(
  "/",
  requireRole("ADMIN", "GERENCIA", "SUPERVISOR"),
  asyncHandler(async (req, res) => {
    res.json(await service.listar(agenciaVisible(req)));
  }),
);

const crearSchema = z.object({
  nombre: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
  rol: z.enum(["ADMIN", "GERENCIA", "SUPERVISOR", "CAJERO"]),
  agenciaId: z.string().uuid().optional(),
});

usuariosRouter.post(
  "/",
  requireRole("ADMIN"),
  asyncHandler(async (req, res) => {
    const data = crearSchema.parse(req.body);
    res.status(201).json(await service.crear(data));
  }),
);
```

## `backend/src/modules/usuarios/service.ts` {#backendsrcmodulesusuariosservicets}

```ts
import { pool } from "../../db/pool";
import { hashPassword } from "../../utils/auth";
import { RolUsuario, UsuarioPublico } from "../../types/models";
import { badRequest, conflict } from "../../utils/errors";

const PUBLIC_COLUMNS = "id, nombre, email, rol, activo, agencia_id, created_at, updated_at";

export async function listar(agenciaId: string | null): Promise<UsuarioPublico[]> {
  const { rows } = agenciaId
    ? await pool.query(`select ${PUBLIC_COLUMNS} from usuarios where agencia_id = $1 order by nombre`, [agenciaId])
    : await pool.query(`select ${PUBLIC_COLUMNS} from usuarios order by nombre`);
  return rows;
}

export async function crear(data: {
  nombre: string;
  email: string;
  password: string;
  rol: RolUsuario;
  agenciaId?: string | null;
}): Promise<UsuarioPublico> {
  if ((data.rol === "SUPERVISOR" || data.rol === "CAJERO") && !data.agenciaId) {
    throw badRequest("Un usuario Supervisor o Cajero debe pertenecer a una agencia");
  }
  const passwordHash = await hashPassword(data.password);
  try {
    const { rows } = await pool.query(
      `insert into usuarios (nombre, email, password_hash, rol, agencia_id)
       values ($1, $2, $3, $4, $5)
       returning ${PUBLIC_COLUMNS}`,
      [data.nombre, data.email.toLowerCase(), passwordHash, data.rol, data.agenciaId ?? null],
    );
    return rows[0];
  } catch (err) {
    if (typeof err === "object" && err && "code" in err && (err as { code: string }).code === "23505") {
      throw conflict(`Ya existe un usuario con el correo "${data.email}"`);
    }
    throw err;
  }
}
```

## `backend/src/modules/cuentas/routes.ts` {#backendsrcmodulescuentasroutests}

```ts
import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../../utils/asyncHandler";
import { requireAuth, requireRole, agenciaVisible } from "../../middleware/auth";
import { badRequest, forbidden } from "../../utils/errors";
import * as service from "./service";

export const cuentasRouter = Router();
cuentasRouter.use(requireAuth);

const TIPOS = ["AHORRO_CORRIENTE", "AHORRO_PROGRAMADO", "AHORRO_INFANTO_JUVENIL"] as const;
const tipoSchema = z.enum(TIPOS);

cuentasRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const tipo = tipoSchema.parse(req.query.tipo);
    const q = typeof req.query.q === "string" ? req.query.q : undefined;
    res.json(await service.listar({ tipo, agenciaId: agenciaVisible(req), q }));
  }),
);

cuentasRouter.get(
  "/resumen",
  asyncHandler(async (req, res) => {
    const tipo = tipoSchema.parse(req.query.tipo);
    res.json(await service.resumen({ tipo, agenciaId: agenciaVisible(req) }));
  }),
);

cuentasRouter.get(
  "/siguiente-numero",
  asyncHandler(async (req, res) => {
    const tipo = tipoSchema.parse(req.query.tipo);
    const agenciaId = (req.query.agenciaId as string) || req.user?.agenciaId;
    if (!agenciaId) throw badRequest("Falta indicar la agencia");
    res.json(await service.siguienteNumero(agenciaId, tipo));
  }),
);

cuentasRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    res.json(await service.obtener(req.params.id, agenciaVisible(req)));
  }),
);

const crearSchema = z.object({
  tipo: tipoSchema,
  agenciaId: z.string().uuid(),
  socioId: z.string().uuid(),
  numeroCuenta: z.string().min(1),
  saldoInicial: z.number().nonnegative().optional(),
});

cuentasRouter.post(
  "/",
  requireRole("ADMIN", "GERENCIA", "SUPERVISOR", "CAJERO"),
  asyncHandler(async (req, res) => {
    const data = crearSchema.parse(req.body);
    const visible = agenciaVisible(req);
    if (visible && data.agenciaId !== visible) throw forbidden("No puedes abrir cuentas en otra agencia");
    res.status(201).json(await service.crear(data, req.user!.id));
  }),
);

const movimientoSchema = z.object({
  tipo: z.enum(["DEPOSITO", "RETIRO"]),
  monto: z.number().positive("El monto debe ser mayor a cero"),
  fecha: z.string().min(1),
  numeroRecibo: z.string().optional(),
  descripcion: z.string().optional(),
});

cuentasRouter.post(
  "/:id/movimientos",
  requireRole("ADMIN", "GERENCIA", "SUPERVISOR", "CAJERO"),
  asyncHandler(async (req, res) => {
    const data = movimientoSchema.parse(req.body);
    res.status(201).json(await service.registrarMovimiento(req.params.id, data, req.user!.id, agenciaVisible(req)));
  }),
);
```

## `backend/src/modules/cuentas/service.ts` {#backendsrcmodulescuentasservicets}

```ts
import { pool } from "../../db/pool";
import { registrarAuditoria } from "../../utils/auditoria";
import { badRequest, notFound, forbidden, conflict } from "../../utils/errors";

// Prefijo del número de cuenta sugerido por tipo — solo una ayuda visual,
// el usuario puede cambiarlo antes de guardar.
const PREFIJO_TIPO: Record<string, string> = {
  AHORRO_CORRIENTE: "AC",
  AHORRO_PROGRAMADO: "AP",
  AHORRO_INFANTO_JUVENIL: "AIJ",
};

export type TipoCuentaAhorro = "AHORRO_CORRIENTE" | "AHORRO_PROGRAMADO" | "AHORRO_INFANTO_JUVENIL";

export async function listar(params: {
  tipo: TipoCuentaAhorro;
  agenciaId: string | null;
  q?: string;
}) {
  const condiciones = ["c.tipo = $1"];
  const valores: unknown[] = [params.tipo];

  if (params.agenciaId) {
    valores.push(params.agenciaId);
    condiciones.push(`c.agencia_id = $${valores.length}`);
  }
  if (params.q) {
    valores.push(`%${params.q.toLowerCase()}%`);
    const idx = valores.length;
    condiciones.push(`(lower(s.nombres) like $${idx} or lower(c.numero_cuenta) like $${idx})`);
  }

  const { rows } = await pool.query(
    `select c.*, s.nombres as socio_nombres, s.numero_asociado,
            coalesce(sc.saldo_actual, c.saldo_inicial) as saldo_actual
     from cuentas c
     join socios s on s.id = c.socio_id
     left join saldos_cuenta sc on sc.cuenta_id = c.id
     where ${condiciones.join(" and ")}
     order by c.created_at desc`,
    valores,
  );
  return rows;
}

export async function resumen(params: { tipo: TipoCuentaAhorro; agenciaId: string | null }) {
  const condiciones = ["c.tipo = $1"];
  const valores: unknown[] = [params.tipo];

  if (params.agenciaId) {
    valores.push(params.agenciaId);
    condiciones.push(`c.agencia_id = $${valores.length}`);
  }
  const where = condiciones.join(" and ");

  const { rows } = await pool.query(
    `select
       count(distinct c.id)::int as total_cuentas,
       coalesce(sum(coalesce(sc.saldo_actual, c.saldo_inicial)), 0) as saldo_total,
       coalesce(sum(case when m.tipo = 'DEPOSITO' then m.monto else 0 end), 0) as total_depositos,
       coalesce(sum(case when m.tipo = 'RETIRO' then m.monto else 0 end), 0) as total_retiros
     from cuentas c
     left join saldos_cuenta sc on sc.cuenta_id = c.id
     left join movimientos m on m.cuenta_id = c.id
     where ${where}`,
    valores,
  );
  const fila = rows[0];
  return {
    totalCuentas: Number(fila.total_cuentas),
    saldoTotal: Number(fila.saldo_total),
    totalDepositos: Number(fila.total_depositos),
    totalRetiros: Number(fila.total_retiros),
  };
}

export async function siguienteNumero(agenciaId: string, tipo: TipoCuentaAhorro) {
  const { rows } = await pool.query(
    `select a.codigo, count(c.id)::int as total
     from agencias a left join cuentas c on c.agencia_id = a.id and c.tipo = $2
     where a.id = $1
     group by a.codigo`,
    [agenciaId, tipo],
  );
  const fila = rows[0];
  if (!fila) throw notFound("Agencia no encontrada");
  const prefijo = PREFIJO_TIPO[tipo] ?? tipo;
  const siguiente = String(fila.total + 1).padStart(4, "0");
  return { numeroCuenta: `${fila.codigo}-${prefijo}-${siguiente}` };
}

export async function obtener(id: string, agenciaVisible: string | null) {
  const { rows } = await pool.query(
    `select c.*, s.nombres as socio_nombres, s.numero_asociado, a.nombre as agencia_nombre,
            coalesce(sc.saldo_actual, c.saldo_inicial) as saldo_actual
     from cuentas c
     join socios s on s.id = c.socio_id
     join agencias a on a.id = c.agencia_id
     left join saldos_cuenta sc on sc.cuenta_id = c.id
     where c.id = $1`,
    [id],
  );
  const cuenta = rows[0];
  if (!cuenta) throw notFound("Cuenta no encontrada");
  if (agenciaVisible && cuenta.agencia_id !== agenciaVisible) throw forbidden("Esa cuenta pertenece a otra agencia");

  const { rows: movimientos } = await pool.query(
    `select m.*, u.nombre as usuario_nombre
     from movimientos m join usuarios u on u.id = m.usuario_id
     where m.cuenta_id = $1
     order by m.fecha desc, m.created_at desc`,
    [id],
  );

  return { ...cuenta, movimientos };
}

export interface DatosCuenta {
  tipo: TipoCuentaAhorro;
  agenciaId: string;
  socioId: string;
  numeroCuenta: string;
  saldoInicial?: number;
}

export async function crear(data: DatosCuenta, usuarioId: string) {
  const { rows } = await pool.query(
    `insert into cuentas (numero_cuenta, tipo, socio_id, agencia_id, saldo_inicial)
     values ($1,$2,$3,$4,$5)
     returning *`,
    [data.numeroCuenta, data.tipo, data.socioId, data.agenciaId, data.saldoInicial ?? 0],
  );
  const cuenta = rows[0];
  await registrarAuditoria({ entidad: "Cuenta", entidadId: cuenta.id, accion: "CREAR", usuarioId, datosNuevos: cuenta });
  return cuenta;
}

export interface DatosMovimiento {
  tipo: "DEPOSITO" | "RETIRO";
  monto: number;
  fecha: string;
  numeroRecibo?: string;
  descripcion?: string;
}

export async function registrarMovimiento(
  cuentaId: string,
  data: DatosMovimiento,
  usuarioId: string,
  agenciaVisible: string | null,
) {
  const cuenta = await obtener(cuentaId, agenciaVisible);
  if (cuenta.estado !== "ACTIVA") throw badRequest("Esta cuenta está cerrada; no se pueden registrar movimientos");

  if (data.tipo === "RETIRO" && Number(data.monto) > Number(cuenta.saldo_actual)) {
    throw conflict(
      `El retiro (Q ${Number(data.monto).toFixed(2)}) es mayor que el saldo disponible (Q ${Number(cuenta.saldo_actual).toFixed(2)})`,
    );
  }

  const clienteMovimientoId = `srv-${cuentaId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  const { rows } = await pool.query(
    `insert into movimientos (cuenta_id, tipo, monto, fecha, numero_recibo, descripcion, usuario_id, cliente_movimiento_id)
     values ($1,$2,$3,$4,$5,$6,$7,$8)
     returning *`,
    [cuentaId, data.tipo, data.monto, data.fecha, data.numeroRecibo ?? null, data.descripcion ?? null, usuarioId, clienteMovimientoId],
  );
  const movimiento = rows[0];
  await registrarAuditoria({
    entidad: "Movimiento",
    entidadId: movimiento.id,
    accion: "CREAR",
    usuarioId,
    datosNuevos: movimiento,
  });
  return movimiento;
}
```

## `backend/src/modules/cajachica/routes.ts` {#backendsrcmodulescajachicaroutests}

```ts
import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../../utils/asyncHandler";
import { requireAuth, requireRole, agenciaVisible } from "../../middleware/auth";
import { badRequest, forbidden } from "../../utils/errors";
import * as service from "./service";

export const cajaChicaRouter = Router();
cajaChicaRouter.use(requireAuth);

cajaChicaRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const q = typeof req.query.q === "string" ? req.query.q : undefined;
    res.json(await service.listar({ agenciaId: agenciaVisible(req), q }));
  }),
);

const CATEGORIAS_CAJA_CHICA = [
  "SUMINISTROS_OFICINA",
  "CAFETERIA_LIMPIEZA",
  "COMBUSTIBLES_LUBRICANTES",
  "COMISIONES_GASTOS",
  "TELEFONO",
  "INTERNET",
  "ENERGIA_ELECTRICA",
  "GASTOS_DIVERSOS",
  "REPARACION_MANTENIMIENTO",
  "FLETES_ACARREO",
  "PROYECCION_SOCIAL",
  "OTRO",
] as const;

const crearSchema = z.object({
  agenciaId: z.string().uuid(),
  fecha: z.string().min(1),
  numeroDocumento: z.string().optional(),
  beneficiario: z.string().min(2),
  descripcion: z.string().min(2),
  tipo: z.enum(["INGRESO", "EGRESO"]),
  categoria: z.enum(CATEGORIAS_CAJA_CHICA).optional(),
  monto: z.number().positive("El monto debe ser mayor a cero"),
});

cajaChicaRouter.post(
  "/",
  requireRole("ADMIN", "GERENCIA", "SUPERVISOR", "CAJERO"),
  asyncHandler(async (req, res) => {
    const data = crearSchema.parse(req.body);
    const visible = agenciaVisible(req);
    if (visible && data.agenciaId !== visible) throw forbidden("No puedes registrar comprobantes en otra agencia");
    if (!visible && !req.query.agenciaId && !data.agenciaId) throw badRequest("Falta indicar la agencia");
    res.status(201).json(await service.crear(data, req.user!.id));
  }),
);
```

## `backend/src/modules/cajachica/service.ts` {#backendsrcmodulescajachicaservicets}

```ts
import { pool } from "../../db/pool";
import { registrarAuditoria } from "../../utils/auditoria";
import { conflict } from "../../utils/errors";

export async function listar(params: { agenciaId: string | null; q?: string }) {
  const condiciones: string[] = [];
  const valores: unknown[] = [];

  if (params.agenciaId) {
    valores.push(params.agenciaId);
    condiciones.push(`c.agencia_id = $${valores.length}`);
  }
  if (params.q) {
    valores.push(`%${params.q.toLowerCase()}%`);
    condiciones.push(`(lower(c.beneficiario) like $${valores.length} or lower(c.descripcion) like $${valores.length})`);
  }
  const where = condiciones.length ? `where ${condiciones.join(" and ")}` : "";

  const [{ rows: comprobantes }, { rows: totales }, { rows: porCategoria }] = await Promise.all([
    pool.query(
      `select c.*, u.nombre as usuario_nombre
       from caja_chica_comprobantes c join usuarios u on u.id = c.usuario_id
       ${where}
       order by c.fecha desc, c.created_at desc
       limit 200`,
      valores,
    ),
    pool.query(
      `select
         coalesce(sum(case when tipo = 'INGRESO' then monto else 0 end), 0) as total_ingresos,
         coalesce(sum(case when tipo = 'EGRESO' then monto else 0 end), 0) as total_egresos
       from caja_chica_comprobantes c ${where}`,
      valores,
    ),
    pool.query(
      `select coalesce(c.categoria::text, 'SIN_CATEGORIA') as categoria, sum(c.monto)::numeric as total
       from caja_chica_comprobantes c
       ${where ? `${where} and c.tipo = 'EGRESO'` : "where c.tipo = 'EGRESO'"}
       group by c.categoria
       order by total desc`,
      valores,
    ),
  ]);

  const totalIngresos = Number(totales[0].total_ingresos);
  const totalEgresos = Number(totales[0].total_egresos);
  const totalesPorCategoria = porCategoria.map((r) => ({ categoria: r.categoria, total: Number(r.total) }));

  return {
    data: comprobantes,
    saldoActual: totalIngresos - totalEgresos,
    totalIngresos,
    totalEgresos,
    totalesPorCategoria,
  };
}

export interface DatosComprobante {
  agenciaId: string;
  fecha: string;
  numeroDocumento?: string;
  beneficiario: string;
  descripcion: string;
  tipo: "INGRESO" | "EGRESO";
  categoria?: string;
  monto: number;
}

export async function crear(data: DatosComprobante, usuarioId: string) {
  if (data.tipo === "EGRESO") {
    const { rows } = await pool.query(
      `select
         coalesce(sum(case when tipo = 'INGRESO' then monto else 0 end), 0)
         - coalesce(sum(case when tipo = 'EGRESO' then monto else 0 end), 0) as saldo
       from caja_chica_comprobantes where agencia_id = $1`,
      [data.agenciaId],
    );
    const saldo = Number(rows[0].saldo);
    if (data.monto > saldo) {
      throw conflict(`El egreso (Q ${data.monto.toFixed(2)}) es mayor que el saldo disponible en caja (Q ${saldo.toFixed(2)})`);
    }
  }

  const { rows } = await pool.query(
    `insert into caja_chica_comprobantes (agencia_id, fecha, numero_documento, beneficiario, descripcion, tipo, categoria, monto, usuario_id)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9)
     returning *`,
    [
      data.agenciaId,
      data.fecha,
      data.numeroDocumento ?? "DTE",
      data.beneficiario,
      data.descripcion,
      data.tipo,
      data.tipo === "EGRESO" ? data.categoria ?? null : null,
      data.monto,
      usuarioId,
    ],
  );
  const comprobante = rows[0];
  await registrarAuditoria({
    entidad: "CajaChicaComprobante",
    entidadId: comprobante.id,
    accion: "CREAR",
    usuarioId,
    datosNuevos: comprobante,
  });
  return comprobante;
}
```

## `backend/src/modules/cajaauxiliar/categorias.ts` {#backendsrcmodulescajaauxiliarcategoriasts}

```ts
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

export type TipoCuentaAuxiliar = "AHORRO_CORRIENTE" | "AHORRO_PROGRAMADO" | "AHORRO_INFANTO_JUVENIL";

export interface CategoriaInfo {
  seccion: "BI" | "PROPIO";
  tipo: "INGRESO" | "EGRESO";
  grupoContador: string;
  descripcion: string;
  requiereCuenta?: TipoCuentaAuxiliar;
  movimientoTipo?: "DEPOSITO" | "RETIRO";
  ingresosComifCategoria?: string;
  sinModuloReal?: boolean;
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
  },
  INTERES_PRESTAMO_HIPOTECARIO: {
    seccion: "PROPIO",
    tipo: "INGRESO",
    grupoContador: "prestamo",
    descripcion: "Interés hipotecario",
    ingresosComifCategoria: "INTERES_PRESTAMO",
  },
  MORA_PRESTAMO_HIPOTECARIO: {
    seccion: "PROPIO",
    tipo: "INGRESO",
    grupoContador: "prestamo",
    descripcion: "Mora sobre préstamo hipotecario",
    ingresosComifCategoria: "MORA_PRESTAMO",
  },
  ABONO_PRESTAMO_FIDUCIARIO: {
    seccion: "PROPIO",
    tipo: "INGRESO",
    grupoContador: "prestamo",
    descripcion: "Abono sobre préstamo fiduciario",
    ingresosComifCategoria: "ABONO_PRESTAMO_FIDUCIARIO",
  },
  INTERES_PRESTAMO_FIDUCIARIO: {
    seccion: "PROPIO",
    tipo: "INGRESO",
    grupoContador: "prestamo",
    descripcion: "Interés fiduciario",
    ingresosComifCategoria: "INTERES_FIDUCIARIO",
  },
  MORA_PRESTAMO_FIDUCIARIO: {
    seccion: "PROPIO",
    tipo: "INGRESO",
    grupoContador: "prestamo",
    descripcion: "Mora sobre préstamo fiduciario",
    ingresosComifCategoria: "MORA_PRESTAMO",
  },

  COLOCACION_PRESTAMO: {
    seccion: "PROPIO",
    tipo: "EGRESO",
    grupoContador: "colocacion",
    descripcion: "Colocación de préstamo (desembolso)",
    sinModuloReal: true,
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

export function categoriasDelGrupo(grupo: string): CajaCategoria[] {
  return CATEGORIA_KEYS.filter((k) => CATEGORIAS[k].grupoContador === grupo);
}

// Denominaciones de billetes y monedas de Guatemala usadas en el arqueo.
export const DENOMINACIONES = [200, 100, 50, 20, 10, 5, 1, 0.5, 0.25, 0.1, 0.05, 0.01];
```

## `backend/src/modules/cajaauxiliar/routes.ts` {#backendsrcmodulescajaauxiliarroutests}

```ts
import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../../utils/asyncHandler";
import { requireAuth, requireRole, agenciaVisible } from "../../middleware/auth";
import { badRequest, forbidden } from "../../utils/errors";
import * as service from "./service";
import { CATEGORIA_KEYS } from "./categorias";

export const cajaAuxiliarRouter = Router();
cajaAuxiliarRouter.use(requireAuth);

cajaAuxiliarRouter.get(
  "/estado",
  asyncHandler(async (req, res) => {
    const agenciaId = (req.query.agenciaId as string) || req.user?.agenciaId;
    if (!agenciaId) throw badRequest("Falta indicar la agencia");
    res.json(await service.estado(agenciaId, agenciaVisible(req)));
  }),
);

const abrirSchema = z.object({
  agenciaId: z.string().uuid(),
  saldoInicial: z.number().nonnegative().optional(),
});

cajaAuxiliarRouter.post(
  "/abrir",
  requireRole("ADMIN", "GERENCIA", "SUPERVISOR", "CAJERO"),
  asyncHandler(async (req, res) => {
    const data = abrirSchema.parse(req.body);
    const visible = agenciaVisible(req);
    if (visible && data.agenciaId !== visible) throw forbidden("No puedes abrir la caja de otra agencia");
    res.status(201).json(await service.abrirDia(data.agenciaId, req.user!.id, visible, data.saldoInicial));
  }),
);

cajaAuxiliarRouter.get(
  "/beneficiarios",
  asyncHandler(async (req, res) => {
    const agenciaId = (req.query.agenciaId as string) || req.user?.agenciaId;
    const q = typeof req.query.q === "string" ? req.query.q : "";
    if (!agenciaId) throw badRequest("Falta indicar la agencia");
    res.json(await service.beneficiariosFrecuentes(agenciaId, q, agenciaVisible(req)));
  }),
);

cajaAuxiliarRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    res.json(await service.detalle(req.params.id, agenciaVisible(req)));
  }),
);

const movimientoSchema = z.object({
  categoria: z.enum(CATEGORIA_KEYS as [string, ...string[]]),
  monto: z.number().positive("El monto debe ser mayor a cero"),
  beneficiario: z.string().optional(),
  socioId: z.string().uuid().optional(),
  cuentaId: z.string().uuid().optional(),
  docNo: z.string().optional(),
  referenciaAut: z.string().optional(),
});

cajaAuxiliarRouter.post(
  "/:id/movimientos",
  requireRole("ADMIN", "GERENCIA", "SUPERVISOR", "CAJERO"),
  asyncHandler(async (req, res) => {
    const data = movimientoSchema.parse(req.body);
    res.status(201).json(
      await service.crearMovimiento(req.params.id, data as service.DatosMovimientoAuxiliar, req.user!.id, agenciaVisible(req)),
    );
  }),
);

const cerrarSchema = z.object({
  conteo: z
    .array(
      z.object({
        valor: z.number().positive(),
        cantidad: z.number().int().nonnegative(),
      }),
    )
    .min(1),
});

cajaAuxiliarRouter.post(
  "/:id/cerrar",
  requireRole("ADMIN", "GERENCIA", "SUPERVISOR", "CAJERO"),
  asyncHandler(async (req, res) => {
    const data = cerrarSchema.parse(req.body);
    res.json(await service.cerrarDia(req.params.id, data.conteo, req.user!.id, agenciaVisible(req)));
  }),
);
```

## `backend/src/modules/cajaauxiliar/service.ts` {#backendsrcmodulescajaauxiliarservicets}

```ts
import { pool } from "../../db/pool";
import { registrarAuditoria } from "../../utils/auditoria";
import { badRequest, notFound, forbidden, conflict } from "../../utils/errors";
import * as cuentasService from "../cuentas/service";
import { CATEGORIAS, CajaCategoria, DENOMINACIONES, categoriasDelGrupo } from "./categorias";

function hoyISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function checarAgencia(agenciaId: string, agenciaVisible: string | null) {
  if (agenciaVisible && agenciaId !== agenciaVisible) throw forbidden("Esa caja pertenece a otra agencia");
}

export async function estado(agenciaId: string, agenciaVisible: string | null) {
  checarAgencia(agenciaId, agenciaVisible);

  const { rows: abiertos } = await pool.query(
    `select * from caja_dias where agencia_id = $1 and estado = 'ABIERTO' order by fecha desc limit 1`,
    [agenciaId],
  );
  if (abiertos[0]) return { estado: "ABIERTO" as const, dia: abiertos[0] };

  const { rows: ultimos } = await pool.query(
    `select * from caja_dias where agencia_id = $1 order by fecha desc limit 1`,
    [agenciaId],
  );
  const ultimo = ultimos[0] ?? null;
  return {
    estado: "SIN_ABRIR" as const,
    saldoSugerido: ultimo ? Number(ultimo.saldo_final) : null,
    fechaUltimoCierre: ultimo ? ultimo.fecha : null,
    esPrimeraVez: !ultimo,
  };
}

export async function abrirDia(agenciaId: string, usuarioId: string, agenciaVisible: string | null, saldoInicialManual?: number) {
  checarAgencia(agenciaId, agenciaVisible);
  const fecha = hoyISO();

  const { rows: abiertos } = await pool.query(
    `select * from caja_dias where agencia_id = $1 and estado = 'ABIERTO' order by fecha desc limit 1`,
    [agenciaId],
  );
  if (abiertos[0]) {
    const fechaAbierto = new Date(abiertos[0].fecha).toISOString().slice(0, 10);
    if (fechaAbierto === fecha) return abiertos[0];
    throw conflict(`Todavía tienes la caja del ${fechaAbierto} sin cerrar. Ciérrala antes de abrir la de hoy.`);
  }

  const { rows: existeHoy } = await pool.query(
    `select * from caja_dias where agencia_id = $1 and fecha = $2`,
    [agenciaId, fecha],
  );
  if (existeHoy[0]) throw conflict("La caja de hoy ya fue cerrada; no se puede volver a abrir.");

  const { rows: ultimos } = await pool.query(
    `select * from caja_dias where agencia_id = $1 order by fecha desc limit 1`,
    [agenciaId],
  );
  const ultimo = ultimos[0] ?? null;

  let saldoInicial: number;
  if (ultimo) {
    saldoInicial = Number(ultimo.saldo_final);
  } else {
    if (saldoInicialManual === undefined || saldoInicialManual === null) {
      throw badRequest("Es la primera vez que se abre la caja de esta agencia; indica el saldo inicial.");
    }
    saldoInicial = saldoInicialManual;
  }

  const { rows } = await pool.query(
    `insert into caja_dias (agencia_id, fecha, saldo_inicial, estado, abierto_por)
     values ($1,$2,$3,'ABIERTO',$4)
     returning *`,
    [agenciaId, fecha, saldoInicial, usuarioId],
  );
  const dia = rows[0];
  await registrarAuditoria({ entidad: "CajaDia", entidadId: dia.id, accion: "CREAR", usuarioId, datosNuevos: dia });
  return dia;
}

async function obtenerDiaCrudo(id: string, agenciaVisible: string | null) {
  const { rows } = await pool.query(`select * from caja_dias where id = $1`, [id]);
  const dia = rows[0];
  if (!dia) throw notFound("Día de caja no encontrado");
  checarAgencia(dia.agencia_id, agenciaVisible);
  return dia;
}

export async function detalle(id: string, agenciaVisible: string | null) {
  const dia = await obtenerDiaCrudo(id, agenciaVisible);

  const { rows: movimientos } = await pool.query(
    `select m.*, u.nombre as usuario_nombre
     from caja_movimientos_auxiliar m join usuarios u on u.id = m.usuario_id
     where m.caja_dia_id = $1
     order by m.created_at asc`,
    [id],
  );

  const totalIngreso = movimientos.filter((m) => m.tipo === "INGRESO").reduce((acc, m) => acc + Number(m.monto), 0);
  const totalEgreso = movimientos.filter((m) => m.tipo === "EGRESO").reduce((acc, m) => acc + Number(m.monto), 0);
  const saldoActual = movimientos.length ? Number(movimientos[movimientos.length - 1].saldo_acumulado) : Number(dia.saldo_inicial);

  let arqueo = null;
  if (dia.estado === "CERRADO") {
    const { rows: arqueos } = await pool.query(`select * from caja_arqueos where caja_dia_id = $1`, [id]);
    arqueo = arqueos[0] ?? null;
  }

  return { dia, movimientos, totalIngreso, totalEgreso, saldoActual, arqueo };
}

export interface DatosMovimientoAuxiliar {
  categoria: CajaCategoria;
  monto: number;
  beneficiario?: string;
  socioId?: string;
  cuentaId?: string;
  docNo?: string;
  referenciaAut?: string;
}

export async function crearMovimiento(
  diaId: string,
  data: DatosMovimientoAuxiliar,
  usuarioId: string,
  agenciaVisible: string | null,
) {
  const dia = await obtenerDiaCrudo(diaId, agenciaVisible);
  if (dia.estado !== "ABIERTO") throw conflict("La caja de este día ya está cerrada; no se pueden agregar movimientos.");

  const info = CATEGORIAS[data.categoria];
  if (!info) throw badRequest("Categoría de movimiento no reconocida");
  if (!data.monto || data.monto <= 0) throw badRequest("El monto debe ser mayor a cero");

  const { rows: contadorRows } = await pool.query(
    `select count(*)::int as total from caja_movimientos_auxiliar
     where agencia_id = $1 and categoria::text = any($2::text[])`,
    [dia.agencia_id, categoriasDelGrupo(info.grupoContador)],
  );
  const contador = contadorRows[0].total + 1;

  let socioId: string | null = data.socioId ?? null;
  let cuentaId: string | null = null;
  let movimientoId: string | null = null;
  let ingresoComifId: string | null = null;
  let referencia: string | null = data.referenciaAut ?? null;
  let beneficiario = data.beneficiario?.trim() ?? "";

  if (info.requiereCuenta) {
    if (!data.cuentaId) throw badRequest("Selecciona la cuenta del socio");
    const cuenta = await cuentasService.obtener(data.cuentaId, agenciaVisible);
    if (cuenta.tipo !== info.requiereCuenta) throw badRequest("La cuenta seleccionada no corresponde a este tipo de ahorro");

    const movimiento = await cuentasService.registrarMovimiento(
      data.cuentaId,
      {
        tipo: info.movimientoTipo!,
        monto: data.monto,
        fecha: new Date(dia.fecha).toISOString().slice(0, 10),
        numeroRecibo: data.docNo,
        descripcion: info.descripcion,
      },
      usuarioId,
      agenciaVisible,
    );

    cuentaId = data.cuentaId;
    movimientoId = movimiento.id;
    socioId = cuenta.socio_id;
    beneficiario = cuenta.socio_nombres;
    referencia = `${cuenta.numero_cuenta}-${info.tipo === "INGRESO" ? "IN" : "EN"}`;
  } else if (info.ingresosComifCategoria) {
    if (!beneficiario) throw badRequest("Indica el nombre del socio o beneficiario");
    const { rows } = await pool.query(
      `insert into ingresos_comif (agencia_id, fecha, numero_documento, nombre_socio, categoria, monto, usuario_id)
       values ($1,$2,$3,$4,$5,$6,$7)
       returning id`,
      [dia.agencia_id, dia.fecha, data.docNo ?? null, beneficiario, info.ingresosComifCategoria, data.monto, usuarioId],
    );
    ingresoComifId = rows[0].id;
  } else {
    if (!beneficiario) throw badRequest("Indica el beneficiario");
  }

  const { rows: ultimoMovRows } = await pool.query(
    `select saldo_acumulado from caja_movimientos_auxiliar where caja_dia_id = $1 order by created_at desc limit 1`,
    [diaId],
  );
  const saldoPrevio = ultimoMovRows[0] ? Number(ultimoMovRows[0].saldo_acumulado) : Number(dia.saldo_inicial);
  const saldoAcumulado = info.tipo === "INGRESO" ? saldoPrevio + data.monto : saldoPrevio - data.monto;

  if (info.tipo === "EGRESO" && saldoAcumulado < 0) {
    throw conflict(
      `Este egreso (Q ${data.monto.toFixed(2)}) dejaría la caja en negativo (saldo disponible: Q ${saldoPrevio.toFixed(2)})`,
    );
  }

  const { rows } = await pool.query(
    `insert into caja_movimientos_auxiliar
       (caja_dia_id, agencia_id, fecha, seccion, categoria, tipo, contador, referencia,
        socio_id, cuenta_id, movimiento_id, ingreso_comif_id, beneficiario, descripcion, doc_no,
        monto, saldo_acumulado, usuario_id)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)
     returning *`,
    [
      diaId,
      dia.agencia_id,
      dia.fecha,
      info.seccion,
      data.categoria,
      info.tipo,
      contador,
      referencia,
      socioId,
      cuentaId,
      movimientoId,
      ingresoComifId,
      beneficiario,
      info.descripcion,
      data.docNo ?? null,
      data.monto,
      saldoAcumulado,
      usuarioId,
    ],
  );
  const registro = rows[0];
  await registrarAuditoria({
    entidad: "CajaMovimientoAuxiliar",
    entidadId: registro.id,
    accion: "CREAR",
    usuarioId,
    datosNuevos: registro,
  });
  return registro;
}

export interface ItemConteo {
  valor: number;
  cantidad: number;
}

export async function cerrarDia(diaId: string, conteo: ItemConteo[], usuarioId: string, agenciaVisible: string | null) {
  const dia = await obtenerDiaCrudo(diaId, agenciaVisible);
  if (dia.estado !== "ABIERTO") throw conflict("Esta caja ya está cerrada");

  const denominacionesFaltantes = DENOMINACIONES.filter((d) => !conteo.some((c) => Math.abs(c.valor - d) < 0.001));
  if (denominacionesFaltantes.length) {
    throw badRequest(`Falta el conteo de: Q${denominacionesFaltantes.join(", Q")}`);
  }

  const { rows: ultimoMovRows } = await pool.query(
    `select saldo_acumulado from caja_movimientos_auxiliar where caja_dia_id = $1 order by created_at desc limit 1`,
    [diaId],
  );
  const saldoFinal = ultimoMovRows[0] ? Number(ultimoMovRows[0].saldo_acumulado) : Number(dia.saldo_inicial);

  const totalContado = conteo.reduce((acc, c) => acc + c.valor * c.cantidad, 0);
  const diferencia = Math.round((totalContado - saldoFinal) * 100) / 100;

  if (Math.abs(diferencia) > 0.01) {
    throw conflict(
      `La caja no cuadra: contado Q ${totalContado.toFixed(2)} vs. saldo esperado Q ${saldoFinal.toFixed(2)} (diferencia Q ${diferencia.toFixed(2)}). Revisa el conteo o los movimientos antes de cerrar.`,
    );
  }

  const client = await pool.connect();
  try {
    await client.query("begin");
    await client.query(
      `insert into caja_arqueos (caja_dia_id, detalle, total_contado, diferencia, usuario_id)
       values ($1,$2,$3,$4,$5)`,
      [diaId, JSON.stringify(conteo), totalContado, diferencia, usuarioId],
    );
    const { rows } = await client.query(
      `update caja_dias set estado = 'CERRADO', saldo_final = $2, cerrado_por = $3, cerrado_at = now()
       where id = $1
       returning *`,
      [diaId, saldoFinal, usuarioId],
    );
    await client.query("commit");
    const diaActualizado = rows[0];
    await registrarAuditoria({
      entidad: "CajaDia",
      entidadId: diaId,
      accion: "ACTUALIZAR",
      usuarioId,
      datosNuevos: diaActualizado,
    });
    return diaActualizado;
  } catch (err) {
    await client.query("rollback");
    throw err;
  } finally {
    client.release();
  }
}

export async function beneficiariosFrecuentes(agenciaId: string, q: string, agenciaVisible: string | null) {
  checarAgencia(agenciaId, agenciaVisible);
  const { rows } = await pool.query(
    `select distinct beneficiario from caja_movimientos_auxiliar
     where agencia_id = $1 and seccion = 'BI' and lower(beneficiario) like $2
     order by beneficiario
     limit 10`,
    [agenciaId, `%${q.toLowerCase()}%`],
  );
  return rows.map((r) => r.beneficiario);
}
```

## `backend/src/modules/dashboard/routes.ts` {#backendsrcmodulesdashboardroutests}

```ts
import { Router } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { requireAuth, agenciaVisible } from "../../middleware/auth";
import * as service from "./service";

export const dashboardRouter = Router();
dashboardRouter.use(requireAuth);

dashboardRouter.get(
  "/resumen",
  asyncHandler(async (req, res) => {
    res.json(await service.resumen(agenciaVisible(req)));
  }),
);
```

## `backend/src/modules/dashboard/service.ts` {#backendsrcmodulesdashboardservicets}

```ts
import { pool } from "../../db/pool";

// Resumen para el tablero del jefe de agencia: saldo de caja chica y saldo
// total de cada tipo de ahorro, por agencia. Si agenciaId es null (Admin o
// Gerencia), se calcula para todas las agencias visibles.
export async function resumen(agenciaId: string | null) {
  const filtroAgencia = agenciaId ? "where a.id = $1" : "";
  const valores = agenciaId ? [agenciaId] : [];

  const { rows: agencias } = await pool.query(
    `select a.id, a.nombre, a.codigo from agencias a ${filtroAgencia} order by a.nombre`,
    valores,
  );

  const { rows: cajaChica } = await pool.query(
    `select agencia_id,
            coalesce(sum(case when tipo = 'INGRESO' then monto else 0 end), 0)
              - coalesce(sum(case when tipo = 'EGRESO' then monto else 0 end), 0) as saldo
     from caja_chica_comprobantes
     group by agencia_id`,
  );

  const { rows: ahorros } = await pool.query(
    `select c.agencia_id, c.tipo,
            count(*)::int as total_cuentas,
            coalesce(sum(coalesce(sc.saldo_actual, c.saldo_inicial)), 0) as saldo_total
     from cuentas c
     left join saldos_cuenta sc on sc.cuenta_id = c.id
     where c.tipo in ('AHORRO_CORRIENTE', 'AHORRO_PROGRAMADO', 'AHORRO_INFANTO_JUVENIL')
     group by c.agencia_id, c.tipo`,
  );

  const { rows: socios } = await pool.query(
    `select agencia_id, count(*)::int as total from socios where estado = 'ACTIVO' group by agencia_id`,
  );

  const { rows: movimientosHoy } = await pool.query(
    `select cu.agencia_id, count(*)::int as total
     from movimientos m join cuentas cu on cu.id = m.cuenta_id
     where m.fecha = current_date
     group by cu.agencia_id`,
  );

  const mapaCajaChica = new Map(cajaChica.map((r) => [r.agencia_id, Number(r.saldo)]));
  const mapaSocios = new Map(socios.map((r) => [r.agencia_id, r.total]));
  const mapaMovHoy = new Map(movimientosHoy.map((r) => [r.agencia_id, r.total]));

  const porAgencia = agencias.map((ag) => {
    const ahorrosAgencia = ahorros.filter((a) => a.agencia_id === ag.id);
    const porTipo = (tipo: string) => {
      const fila = ahorrosAgencia.find((a) => a.tipo === tipo);
      return { totalCuentas: fila?.total_cuentas ?? 0, saldoTotal: Number(fila?.saldo_total ?? 0) };
    };
    return {
      agenciaId: ag.id,
      agenciaNombre: ag.nombre,
      agenciaCodigo: ag.codigo,
      cajaChica: { saldo: mapaCajaChica.get(ag.id) ?? 0 },
      ahorroCorriente: porTipo("AHORRO_CORRIENTE"),
      ahorroProgramado: porTipo("AHORRO_PROGRAMADO"),
      ahorroInfantoJuvenil: porTipo("AHORRO_INFANTO_JUVENIL"),
      totalSocios: mapaSocios.get(ag.id) ?? 0,
      movimientosHoy: mapaMovHoy.get(ag.id) ?? 0,
    };
  });

  const global = porAgencia.reduce(
    (acc, a) => ({
      cajaChica: acc.cajaChica + a.cajaChica.saldo,
      ahorroCorriente: acc.ahorroCorriente + a.ahorroCorriente.saldoTotal,
      ahorroProgramado: acc.ahorroProgramado + a.ahorroProgramado.saldoTotal,
      ahorroInfantoJuvenil: acc.ahorroInfantoJuvenil + a.ahorroInfantoJuvenil.saldoTotal,
      totalSocios: acc.totalSocios + a.totalSocios,
      movimientosHoy: acc.movimientosHoy + a.movimientosHoy,
    }),
    { cajaChica: 0, ahorroCorriente: 0, ahorroProgramado: 0, ahorroInfantoJuvenil: 0, totalSocios: 0, movimientosHoy: 0 },
  );

  return { global, porAgencia };
}
```

## `backend/src/modules/socios/routes.ts` {#backendsrcmodulessociosroutests}

```ts
import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../../utils/asyncHandler";
import { requireAuth, requireRole, agenciaVisible } from "../../middleware/auth";
import { badRequest, forbidden } from "../../utils/errors";
import * as service from "./service";

export const sociosRouter = Router();
sociosRouter.use(requireAuth);

sociosRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const page = Math.max(1, Number(req.query.page) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(req.query.pageSize) || 20));
    const estado = req.query.estado as "ACTIVO" | "INACTIVO" | undefined;
    const q = typeof req.query.q === "string" ? req.query.q : undefined;

    res.json(await service.listar({ agenciaId: agenciaVisible(req), q, estado, page, pageSize }));
  }),
);

sociosRouter.get(
  "/siguiente-numero",
  asyncHandler(async (req, res) => {
    const agenciaId = (req.query.agenciaId as string) || req.user?.agenciaId;
    if (!agenciaId) throw badRequest("Falta indicar la agencia");
    res.json(await service.siguienteNumero(agenciaId));
  }),
);

sociosRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    res.json(await service.obtener(req.params.id, agenciaVisible(req)));
  }),
);

const datosSocioSchema = z.object({
  numeroAsociado: z.string().min(1),
  agenciaId: z.string().uuid(),
  nombres: z.string().min(3, "El nombre completo es obligatorio"),
  genero: z.enum(["M", "F"]).optional(),
  fechaIngreso: z.string().min(1, "La fecha de ingreso es obligatoria"),
  dpi: z.string().min(13).max(13).optional().or(z.literal("")).transform((v) => (v ? v : undefined)),
  direccion: z.string().optional(),
  telefono: z.string().optional(),
  nombreBeneficiario: z.string().optional(),
});

sociosRouter.post(
  "/",
  requireRole("ADMIN", "GERENCIA", "SUPERVISOR", "CAJERO"),
  asyncHandler(async (req, res) => {
    const data = datosSocioSchema.parse(req.body);
    const visible = agenciaVisible(req);
    if (visible && data.agenciaId !== visible) throw forbidden("No puedes registrar socios en otra agencia");
    res.status(201).json(await service.crear(data, req.user!.id));
  }),
);

const actualizarSchema = datosSocioSchema
  .omit({ numeroAsociado: true, agenciaId: true })
  .partial()
  .extend({ estado: z.enum(["ACTIVO", "INACTIVO"]).optional() });

sociosRouter.patch(
  "/:id",
  requireRole("ADMIN", "GERENCIA", "SUPERVISOR", "CAJERO"),
  asyncHandler(async (req, res) => {
    const data = actualizarSchema.parse(req.body);
    res.json(await service.actualizar(req.params.id, data, req.user!.id, agenciaVisible(req)));
  }),
);
```

## `backend/src/modules/socios/service.ts` {#backendsrcmodulessociosservicets}

```ts
import { pool } from "../../db/pool";
import { Socio } from "../../types/models";
import { registrarAuditoria } from "../../utils/auditoria";
import { notFound, forbidden } from "../../utils/errors";

export interface FiltrosSocios {
  agenciaId: string | null; // null = todas (ADMIN/GERENCIA)
  q?: string;
  estado?: "ACTIVO" | "INACTIVO";
  page: number;
  pageSize: number;
}

export async function listar(filtros: FiltrosSocios) {
  const condiciones: string[] = [];
  const valores: unknown[] = [];

  if (filtros.agenciaId) {
    valores.push(filtros.agenciaId);
    condiciones.push(`s.agencia_id = $${valores.length}`);
  }
  if (filtros.estado) {
    valores.push(filtros.estado);
    condiciones.push(`s.estado = $${valores.length}`);
  }
  if (filtros.q) {
    valores.push(`%${filtros.q.toLowerCase()}%`);
    const idx = valores.length;
    condiciones.push(
      `(lower(s.nombres) like $${idx} or s.dpi like $${idx} or lower(s.numero_asociado) like $${idx})`,
    );
  }

  const where = condiciones.length ? `where ${condiciones.join(" and ")}` : "";
  const offset = (filtros.page - 1) * filtros.pageSize;

  valores.push(filtros.pageSize, offset);
  const limitIdx = valores.length - 1;
  const offsetIdx = valores.length;

  const [{ rows }, { rows: countRows }] = await Promise.all([
    pool.query(
      `select s.*, a.nombre as agencia_nombre, a.codigo as agencia_codigo,
              coalesce(cnt.total_cuentas, 0)::int as total_cuentas
       from socios s
       join agencias a on a.id = s.agencia_id
       left join (select socio_id, count(*) as total_cuentas from cuentas group by socio_id) cnt
              on cnt.socio_id = s.id
       ${where}
       order by s.created_at desc
       limit $${limitIdx} offset $${offsetIdx}`,
      valores,
    ),
    pool.query(`select count(*)::int as total from socios s ${where}`, valores.slice(0, -2)),
  ]);

  return { data: rows, total: countRows[0].total, page: filtros.page, pageSize: filtros.pageSize };
}

export async function obtener(id: string, agenciaVisible: string | null) {
  const { rows } = await pool.query(
    `select s.*, a.nombre as agencia_nombre, a.codigo as agencia_codigo
     from socios s join agencias a on a.id = s.agencia_id
     where s.id = $1`,
    [id],
  );
  const socio = rows[0];
  if (!socio) throw notFound("Socio no encontrado");
  if (agenciaVisible && socio.agencia_id !== agenciaVisible) throw forbidden("Ese socio pertenece a otra agencia");

  const { rows: cuentas } = await pool.query(
    `select c.*, coalesce(sc.saldo_actual, c.saldo_inicial) as saldo_actual
     from cuentas c
     left join saldos_cuenta sc on sc.cuenta_id = c.id
     where c.socio_id = $1
     order by c.created_at`,
    [id],
  );

  return { ...socio, cuentas };
}

export async function siguienteNumero(agenciaId: string) {
  const { rows } = await pool.query(
    `select a.codigo, count(s.id)::int as total
     from agencias a left join socios s on s.agencia_id = a.id
     where a.id = $1
     group by a.codigo`,
    [agenciaId],
  );
  const fila = rows[0];
  if (!fila) throw notFound("Agencia no encontrada");
  const siguiente = String(fila.total + 1).padStart(4, "0");
  return { numeroAsociado: `${fila.codigo}-${siguiente}` };
}

export interface DatosSocio {
  numeroAsociado: string;
  agenciaId: string;
  nombres: string;
  genero?: "M" | "F";
  fechaIngreso: string;
  dpi?: string;
  direccion?: string;
  telefono?: string;
  nombreBeneficiario?: string;
}

export async function crear(data: DatosSocio, usuarioId: string): Promise<Socio> {
  const { rows } = await pool.query<Socio>(
    `insert into socios
      (numero_asociado, agencia_id, nombres, genero, fecha_ingreso, dpi, direccion, telefono, nombre_beneficiario, creado_por_id)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
     returning *`,
    [
      data.numeroAsociado,
      data.agenciaId,
      data.nombres,
      data.genero ?? null,
      data.fechaIngreso,
      data.dpi ?? null,
      data.direccion ?? null,
      data.telefono ?? null,
      data.nombreBeneficiario ?? null,
      usuarioId,
    ],
  );
  const socio = rows[0];
  await registrarAuditoria({ entidad: "Socio", entidadId: socio.id, accion: "CREAR", usuarioId, datosNuevos: socio });
  return socio;
}

export async function actualizar(
  id: string,
  data: Partial<DatosSocio> & { estado?: "ACTIVO" | "INACTIVO" },
  usuarioId: string,
  agenciaVisibleParaUsuario: string | null,
): Promise<Socio> {
  const anterior = await obtener(id, agenciaVisibleParaUsuario);

  const campos: Record<string, unknown> = {
    nombres: data.nombres,
    genero: data.genero,
    fecha_ingreso: data.fechaIngreso,
    dpi: data.dpi,
    direccion: data.direccion,
    telefono: data.telefono,
    nombre_beneficiario: data.nombreBeneficiario,
    estado: data.estado,
  };

  const sets: string[] = [];
  const valores: unknown[] = [];
  for (const [col, val] of Object.entries(campos)) {
    if (val === undefined) continue;
    valores.push(val);
    sets.push(`${col} = $${valores.length}`);
  }
  if (sets.length === 0) return anterior as unknown as Socio;

  sets.push(`updated_at = now()`);
  valores.push(id);

  const { rows } = await pool.query<Socio>(
    `update socios set ${sets.join(", ")} where id = $${valores.length} returning *`,
    valores,
  );
  const socio = rows[0];
  await registrarAuditoria({
    entidad: "Socio",
    entidadId: id,
    accion: "ACTUALIZAR",
    usuarioId,
    datosAnteriores: anterior,
    datosNuevos: socio,
  });
  return socio;
}
```

## `backend/src/types/models.ts` {#backendsrctypesmodelsts}

```ts
export type RolUsuario = "ADMIN" | "GERENCIA" | "SUPERVISOR" | "CAJERO";
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
```

## `backend/src/middleware/auth.ts` {#backendsrcmiddlewareauthts}

```ts
import { NextFunction, Request, Response } from "express";
import { verifyToken } from "../utils/auth";
import { unauthorized, forbidden } from "../utils/errors";
import { RolUsuario, UsuarioAutenticado } from "../types/models";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: UsuarioAutenticado;
    }
  }
}

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) return next(unauthorized());
  try {
    req.user = verifyToken(header.slice("Bearer ".length));
    return next();
  } catch {
    return next(unauthorized("Sesión inválida o expirada"));
  }
}

export function requireRole(...roles: RolUsuario[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) return next(unauthorized());
    if (!roles.includes(req.user.rol)) return next(forbidden());
    return next();
  };
}

// ADMIN y GERENCIA ven todas las agencias; SUPERVISOR y CAJERO quedan
// limitados a la suya. Devuelve el id de agencia por el que hay que filtrar,
// o null si el usuario puede ver todas.
export function agenciaVisible(req: Request): string | null {
  if (!req.user) throw unauthorized();
  if (req.user.rol === "ADMIN" || req.user.rol === "GERENCIA") return null;
  return req.user.agenciaId;
}
```

## `backend/src/middleware/errorHandler.ts` {#backendsrcmiddlewareerrorhandlerts}

```ts
import { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { AppError } from "../utils/errors";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: "Datos inválidos",
      detalles: err.issues.map((i) => ({ campo: i.path.join("."), mensaje: i.message })),
    });
  }

  if (err instanceof AppError) {
    return res.status(err.status).json({ error: err.message });
  }

  // Violación de restricción única de PostgreSQL (p.ej. DPI o email duplicado)
  if (typeof err === "object" && err !== null && "code" in err && (err as { code: string }).code === "23505") {
    return res.status(409).json({ error: "Ya existe un registro con ese dato único (DPI, correo o número de cuenta)." });
  }

  // eslint-disable-next-line no-console
  console.error("Error no controlado:", err);
  return res.status(500).json({ error: "Ocurrió un error inesperado en el servidor" });
}
```

## `backend/src/db/migrate.ts` {#backendsrcdbmigratets}

```ts
// Aplica db/schema.sql contra la base de datos indicada en DATABASE_URL.
// El script es idempotente: se puede correr varias veces sin error.
import "dotenv/config";
import { readFileSync } from "node:fs";
import path from "node:path";
import { pool } from "./pool";

async function main() {
  const sqlPath = path.join(__dirname, "..", "..", "db", "schema.sql");
  const sql = readFileSync(sqlPath, "utf-8");
  console.log(`Aplicando ${sqlPath} ...`);
  await pool.query(sql);
  console.log("Esquema aplicado correctamente.");
  await pool.end();
}

main().catch((err) => {
  console.error("Falló la migración:", err);
  process.exit(1);
});
```

## `backend/src/db/pool.ts` {#backendsrcdbpoolts}

```ts
import { Pool } from "pg";

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

pool.on("error", (err) => {
  // eslint-disable-next-line no-console
  console.error("Error inesperado en el pool de PostgreSQL", err);
});
```

## `backend/src/db/seed.ts` {#backendsrcdbseedts}

```ts
// Crea la agencia y el usuario administrador iniciales. Se puede correr una
// sola vez después de aplicar db/schema.sql (npm run db:migrate && npm run db:seed).
import "dotenv/config";
import { pool } from "./pool";
import { hashPassword } from "../utils/auth";

async function main() {
  const { rows: agencias } = await pool.query(
    `insert into agencias (codigo, nombre, direccion)
     values ('CHAJUL', 'Agencia Chajul', 'Chajul, Quiché')
     on conflict (codigo) do update set nombre = excluded.nombre
     returning *`,
  );
  const agencia = agencias[0];
  console.log(`Agencia lista: ${agencia.nombre} (${agencia.id})`);

  const email = "admin@mif.coop";
  const passwordTemporal = "CambiaEsto123!";
  const passwordHash = await hashPassword(passwordTemporal);

  await pool.query(
    `insert into usuarios (nombre, email, password_hash, rol, agencia_id)
     values ('Administrador MIF', $1, $2, 'ADMIN', null)
     on conflict (email) do update set password_hash = excluded.password_hash`,
    [email, passwordHash],
  );

  console.log("Usuario administrador listo:");
  console.log(`  correo:      ${email}`);
  console.log(`  contraseña:  ${passwordTemporal}  (cámbiala después del primer ingreso)`);

  await pool.end();
}

main().catch((err) => {
  console.error("Falló el seed:", err);
  process.exit(1);
});
```

## `backend/src/utils/asyncHandler.ts` {#backendsrcutilsasynchandlerts}

```ts
import { NextFunction, Request, Response } from "express";

type Handler = (req: Request, res: Response, next: NextFunction) => Promise<unknown>;

// Envuelve un controlador async para que sus errores lleguen al errorHandler
// central en vez de tumbar el proceso.
export const asyncHandler = (fn: Handler) => (req: Request, res: Response, next: NextFunction) => {
  fn(req, res, next).catch(next);
};
```

## `backend/src/utils/auditoria.ts` {#backendsrcutilsauditoriats}

```ts
import { PoolClient } from "pg";
import { pool } from "../db/pool";

type Accion = "CREAR" | "ACTUALIZAR" | "ELIMINAR";

// Deja constancia de quién creó, modificó o eliminó un registro y cuándo.
// Se llama desde cada servicio de escritura (ver modules/socios/service.ts).
export async function registrarAuditoria(
  params: {
    entidad: string;
    entidadId: string;
    accion: Accion;
    usuarioId: string;
    datosAnteriores?: unknown;
    datosNuevos?: unknown;
  },
  client: Pick<PoolClient, "query"> = pool,
) {
  await client.query(
    `insert into auditoria (entidad, entidad_id, accion, usuario_id, datos_anteriores, datos_nuevos)
     values ($1, $2, $3, $4, $5, $6)`,
    [
      params.entidad,
      params.entidadId,
      params.accion,
      params.usuarioId,
      params.datosAnteriores ? JSON.stringify(params.datosAnteriores) : null,
      params.datosNuevos ? JSON.stringify(params.datosNuevos) : null,
    ],
  );
}
```

## `backend/src/utils/auth.ts` {#backendsrcutilsauthts}

```ts
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { UsuarioAutenticado } from "../types/models";

const JWT_SECRET = process.env.JWT_SECRET ?? "";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN ?? "8h";

if (!JWT_SECRET) {
  throw new Error("Falta configurar JWT_SECRET en el archivo .env");
}

export const hashPassword = (plain: string) => bcrypt.hash(plain, 10);
export const comparePassword = (plain: string, hash: string) => bcrypt.compare(plain, hash);

export const signToken = (usuario: UsuarioAutenticado) =>
  jwt.sign(usuario, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions);

export const verifyToken = (token: string): UsuarioAutenticado =>
  jwt.verify(token, JWT_SECRET) as UsuarioAutenticado;
```

## `backend/src/utils/errors.ts` {#backendsrcutilserrorsts}

```ts
export class AppError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export const badRequest = (msg: string) => new AppError(400, msg);
export const unauthorized = (msg = "No autenticado") => new AppError(401, msg);
export const forbidden = (msg = "No tienes permiso para esta acción") => new AppError(403, msg);
export const notFound = (msg = "No encontrado") => new AppError(404, msg);
export const conflict = (msg: string) => new AppError(409, msg);
```

## `backend/db/schema.sql` {#backenddbschemasql}

```sql
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
    'DEPOSITO_PLAZO_FIJO', 'RETIRO_PLAZO_FIJO',
    'APORTACION', 'INGRESO_ASOCIADO', 'COMISION',
    'ABONO_PRESTAMO_HIPOTECARIO', 'INTERES_PRESTAMO_HIPOTECARIO', 'MORA_PRESTAMO_HIPOTECARIO',
    'ABONO_PRESTAMO_FIDUCIARIO', 'INTERES_PRESTAMO_FIDUCIARIO', 'MORA_PRESTAMO_FIDUCIARIO',
    'COLOCACION_PRESTAMO', 'EGRESO_VARIO', 'INGRESO_VARIO'
  );
exception when duplicate_object then null; end $$;

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
  created_at       timestamptz not null default now()
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
```

## `backend/db/schema.supabase.sql` {#backenddbschemasupabasesql}

```sql
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
```

