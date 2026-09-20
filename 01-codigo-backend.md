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
  "include": ["src"],
  "exclude": ["src/tests"]
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
import { sistemaRouter } from "./modules/sistema/routes";
import { prestamosRouter } from "./modules/prestamos/routes";
import { plazoFijoRouter } from "./modules/plazofijo/routes";
import { auditoriaRouter } from "./modules/auditoria/routes";
import { alertasRouter } from "./modules/alertas/routes";
import { sesionesRouter } from "./modules/sesiones/routes";
import { cobrosCampoRouter } from "./modules/cobroscampo/routes";

export const app = express();

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
        return callback(null, true);
      }
      try {
        const hostname = new URL(origin).hostname;
        if (hostname.endsWith(".vercel.app")) {
          return callback(null, true);
        }
      } catch {}
      const allowedOrigins = process.env.CORS_ORIGIN?.split(",").map((s) => s.trim()) ?? [];
      if (allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(null, true);
    },
    credentials: true,
  }),
);
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
app.use("/api/sistema", sistemaRouter);
app.use("/api/prestamos", prestamosRouter);
app.use("/api/plazo-fijo", plazoFijoRouter);
app.use("/api/auditoria", auditoriaRouter);
app.use("/api/alertas", alertasRouter);
app.use("/api/sesiones", sesionesRouter);
app.use("/api/cobros-campo", cobrosCampoRouter);

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
      `select c.*, u.nombre as usuario_nombre, u.rol as usuario_rol
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

  if (data.numeroDocumento && data.numeroDocumento.trim() && data.numeroDocumento.trim().toUpperCase() !== DOC_PLACEHOLDER) {
    const doc = data.numeroDocumento.trim();
    // 1. Checar en caja_chica_comprobantes
    const { rows: repetidoCC } = await pool.query(
      `select fecha, numero_documento, beneficiario, descripcion
       from caja_chica_comprobantes
       where agencia_id = $1 and lower(trim(numero_documento)) = lower($2)
       limit 1`,
      [data.agenciaId, doc],
    );
    if (repetidoCC[0]) {
      const fechaStr = new Date(repetidoCC[0].fecha).toLocaleDateString("es-GT");
      throw conflict(
        `El número de documento "${doc}" ya fue registrado el ${fechaStr} en Caja Chica (${repetidoCC[0].descripcion} - ${repetidoCC[0].beneficiario}). No se permiten comprobantes duplicados.`
      );
    }

    // 2. Checar en caja_movimientos_auxiliar
    const { rows: repetidoAux } = await pool.query(
      `select m.fecha, m.doc_no, m.beneficiario, m.descripcion, u.nombre as usuario_nombre
       from caja_movimientos_auxiliar m
       left join usuarios u on u.id = m.usuario_id
       where m.agencia_id = $1 and lower(trim(m.doc_no)) = lower($2)
       limit 1`,
      [data.agenciaId, doc],
    );
    if (repetidoAux[0]) {
      const fechaStr = new Date(repetidoAux[0].fecha).toLocaleDateString("es-GT");
      throw conflict(
        `El número de documento "${doc}" ya fue registrado el ${fechaStr} en Auxiliar de Caja (${repetidoAux[0].descripcion} - ${repetidoAux[0].beneficiario}). No se permiten documentos duplicados entre Caja Chica y Auxiliar de Caja.`
      );
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

const DOC_PLACEHOLDER = "DTE";

export async function obtenerUltimoDocumento(agenciaId: string, fecha: string) {
  const { rows } = await pool.query(
    `select numero_documento from caja_chica_comprobantes
     where agencia_id = $1 and fecha = $2
       and numero_documento is not null and trim(numero_documento) <> ''
       and upper(trim(numero_documento)) <> $3
     order by created_at desc limit 1`,
    [agenciaId, fecha, DOC_PLACEHOLDER],
  );
  return { ultimoNumeroDocumento: rows[0]?.numero_documento ?? null };
}

export async function verificarNumeroDocumentoExiste(agenciaId: string, fecha: string, numeroDocumento: string) {
  const doc = numeroDocumento.trim();
  if (!doc || doc.toUpperCase() === DOC_PLACEHOLDER) return { existe: false };

  // 1. Checar en caja_chica_comprobantes
  const { rows: ccRows } = await pool.query(
    `select c.fecha, c.numero_documento, c.beneficiario, c.descripcion, u.nombre as usuario_nombre, u.rol as usuario_rol
     from caja_chica_comprobantes c
     left join usuarios u on u.id = c.usuario_id
     where c.agencia_id = $1 and lower(trim(c.numero_documento)) = lower($2)
     limit 1`,
    [agenciaId, doc],
  );
  if (ccRows[0]) {
    return {
      existe: true,
      modulo: "Caja Chica",
      fecha: ccRows[0].fecha,
      beneficiario: ccRows[0].beneficiario,
      descripcion: ccRows[0].descripcion,
      usuario: ccRows[0].usuario_nombre,
      usuarioRol: ccRows[0].usuario_rol,
    };
  }

  // 2. Checar en caja_movimientos_auxiliar
  const { rows: auxRows } = await pool.query(
    `select m.fecha, m.doc_no, m.beneficiario, m.descripcion, u.nombre as usuario_nombre, u.rol as usuario_rol
     from caja_movimientos_auxiliar m
     left join usuarios u on u.id = m.usuario_id
     where m.agencia_id = $1 and lower(trim(m.doc_no)) = lower($2)
     limit 1`,
    [agenciaId, doc],
  );
  if (auxRows[0]) {
    return {
      existe: true,
      modulo: "Auxiliar de Caja",
      fecha: auxRows[0].fecha,
      beneficiario: auxRows[0].beneficiario,
      descripcion: auxRows[0].descripcion,
      usuario: auxRows[0].usuario_nombre,
      usuarioRol: auxRows[0].usuario_rol,
    };
  }

  return { existe: false };
}

export interface DatosReposicionCajaChica {
  agenciaId: string;
  monto: number;
  numeroCheque: string;
  descripcion?: string;
  fecha?: string;
}

export async function reponerFondo(data: DatosReposicionCajaChica, usuarioId: string) {
  if (!data.numeroCheque || !data.numeroCheque.trim()) {
    throw conflict("El número de cheque o documento de reposición (No. CH.) es obligatorio.");
  }
  const fecha = data.fecha || new Date().toISOString().slice(0, 10);
  const ch = data.numeroCheque.trim();

  // Validar anti-duplicados del cheque en caja chica
  const { rows: repetido } = await pool.query(
    `select fecha, numero_documento, descripcion from caja_chica_comprobantes
     where agencia_id = $1 and tipo = 'INGRESO' and lower(trim(numero_documento)) = lower($2) limit 1`,
    [data.agenciaId, ch],
  );
  if (repetido[0]) {
    const fechaStr = new Date(repetido[0].fecha).toLocaleDateString("es-GT");
    throw conflict(`El cheque o recibo de reposición "${ch}" ya fue registrado el ${fechaStr} en Caja Chica.`);
  }

  // Validar también en caja_movimientos_auxiliar
  const { rows: repetidoAux } = await pool.query(
    `select fecha, doc_no, descripcion, beneficiario from caja_movimientos_auxiliar
     where agencia_id = $1 and lower(trim(doc_no)) = lower($2) limit 1`,
    [data.agenciaId, ch],
  );
  if (repetidoAux[0]) {
    const fechaStr = new Date(repetidoAux[0].fecha).toLocaleDateString("es-GT");
    throw conflict(`El documento "${ch}" ya fue registrado el ${fechaStr} en Auxiliar de Caja (${repetidoAux[0].descripcion} - ${repetidoAux[0].beneficiario}). No se permiten documentos duplicados entre Caja Chica y Auxiliar de Caja.`);
  }

  const { rows } = await pool.query(
    `insert into caja_chica_comprobantes (agencia_id, fecha, numero_documento, beneficiario, descripcion, tipo, monto, usuario_id)
     values ($1, $2, $3, $4, $5, 'INGRESO', $6, $7)
     returning *`,
    [
      data.agenciaId,
      fecha,
      ch,
      `BANCO / REPOSICIÓN CHEQUE No. ${ch}`,
      data.descripcion?.trim() || `Reposición de Fondo Fijo de Caja Chica (Cheque No. ${ch})`,
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

export interface ParamsReporteCajaChica {
  agenciaId: string;
  fechaInicio?: string;
  fechaFin?: string;
  categoria?: string;
}

export async function generarReporte(params: ParamsReporteCajaChica) {
  const { agenciaId, fechaInicio, fechaFin, categoria } = params;

  // 1. Obtener datos de la agencia
  const { rows: agRows } = await pool.query(
    `select id, codigo, nombre from agencias where id = $1`,
    [agenciaId],
  );
  const agencia = agRows[0] || { id: agenciaId, codigo: "AG", nombre: "Agencia" };

  // 2. Obtener última reposición (último INGRESO registrado en la agencia)
  const { rows: lastRepoRows } = await pool.query(
    `select fecha, numero_documento, monto, descripcion, created_at
     from caja_chica_comprobantes
     where agencia_id = $1 and tipo = 'INGRESO'
     order by fecha desc, created_at desc
     limit 1`,
    [agenciaId],
  );
  const ultimaReposicion = lastRepoRows[0]
    ? {
        fecha: lastRepoRows[0].fecha,
        numeroDocumento: lastRepoRows[0].numero_documento,
        monto: Number(lastRepoRows[0].monto),
        descripcion: lastRepoRows[0].descripcion,
      }
    : null;

  // 3. Saldo acumulado histórico total de la agencia
  const { rows: balanceGlobal } = await pool.query(
    `select
       coalesce(sum(case when tipo = 'INGRESO' then monto else 0 end), 0) as total_ingresos_global,
       coalesce(sum(case when tipo = 'EGRESO' then monto else 0 end), 0) as total_egresos_global
     from caja_chica_comprobantes
     where agencia_id = $1`,
    [agenciaId],
  );
  const saldoDisponibleActual =
    Number(balanceGlobal[0].total_ingresos_global) - Number(balanceGlobal[0].total_egresos_global);

  // 4. Saldo anterior a fechaInicio (si se especifica fechaInicio)
  let saldoAnterior = 0;
  if (fechaInicio) {
    const { rows: anteriorRows } = await pool.query(
      `select
         coalesce(sum(case when tipo = 'INGRESO' then monto else 0 end), 0)
         - coalesce(sum(case when tipo = 'EGRESO' then monto else 0 end), 0) as saldo_anterior
       from caja_chica_comprobantes
       where agencia_id = $1 and fecha < $2`,
      [agenciaId, fechaInicio],
    );
    saldoAnterior = Number(anteriorRows[0].saldo_anterior);
  }

  // 5. Filtros para el período
  const condiciones: string[] = [`c.agencia_id = $1`];
  const valores: unknown[] = [agenciaId];

  if (fechaInicio) {
    valores.push(fechaInicio);
    condiciones.push(`c.fecha >= $${valores.length}`);
  }
  if (fechaFin) {
    valores.push(fechaFin);
    condiciones.push(`c.fecha <= $${valores.length}`);
  }
  if (categoria) {
    valores.push(categoria);
    condiciones.push(`c.categoria = $${valores.length}`);
  }

  const wherePeriodo = `where ${condiciones.join(" and ")}`;

  // 6. Consultar comprobantes del período con usuario
  const { rows: comprobantes } = await pool.query(
    `select c.*, u.nombre as usuario_nombre, u.rol as usuario_rol
     from caja_chica_comprobantes c join usuarios u on u.id = c.usuario_id
     ${wherePeriodo}
     order by c.fecha asc, c.created_at asc`,
    valores,
  );

  // 7. Agrupar egresos por categoría en el período
  const { rows: porCatRows } = await pool.query(
    `select coalesce(c.categoria::text, 'SIN_CATEGORIA') as categoria, sum(c.monto)::numeric as total, count(*)::int as cantidad
     from caja_chica_comprobantes c
     ${wherePeriodo} and c.tipo = 'EGRESO'
     group by c.categoria
     order by total desc`,
    valores,
  );

  // Separar ingresos y egresos
  const egresos = comprobantes.filter((c) => c.tipo === "EGRESO");
  const ingresos = comprobantes.filter((c) => c.tipo === "INGRESO");

  const totalEgresosPeriodo = egresos.reduce((acc, c) => acc + Number(c.monto), 0);
  const totalIngresosPeriodo = ingresos.reduce((acc, c) => acc + Number(c.monto), 0);
  const saldoFinalPeriodo = fechaInicio
    ? saldoAnterior + totalIngresosPeriodo - totalEgresosPeriodo
    : saldoDisponibleActual;

  return {
    agencia,
    fechaInicio: fechaInicio || null,
    fechaFin: fechaFin || null,
    categoriaFiltro: categoria || null,
    ultimaReposicion,
    saldoAnterior,
    totalIngresosPeriodo,
    totalEgresosPeriodo,
    saldoFinalPeriodo,
    saldoDisponibleActual,
    egresos,
    ingresos,
    totalesPorCategoria: porCatRows.map((r) => ({
      categoria: r.categoria,
      total: Number(r.total),
      cantidad: Number(r.cantidad),
      porcentaje: totalEgresosPeriodo > 0 ? (Number(r.total) / totalEgresosPeriodo) * 100 : 0,
    })),
  };
}


export async function editar(id: string, data: Partial<DatosComprobante>, usuarioId: string, motivo: string) {
  const { rows: anteriores } = await pool.query(
    "select * from caja_chica_comprobantes where id = $1",
    [id]
  );
  if (!anteriores[0]) throw conflict("El comprobante no existe.");
  const ant = anteriores[0];

  const { rows } = await pool.query(
    `update caja_chica_comprobantes
     set fecha = coalesce($1, fecha),
         numero_documento = coalesce($2, numero_documento),
         beneficiario = coalesce($3, beneficiario),
         descripcion = coalesce($4, descripcion),
         tipo = coalesce($5, tipo),
         categoria = coalesce($6, categoria),
         monto = coalesce($7, monto)
     where id = $8
     returning *`,
    [
      data.fecha,
      data.numeroDocumento,
      data.beneficiario,
      data.descripcion,
      data.tipo,
      data.categoria,
      data.monto,
      id
    ]
  );

  const comprobante = rows[0];
  await registrarAuditoria({
    entidad: "CajaChicaComprobante",
    entidadId: id,
    accion: "ACTUALIZAR",
    usuarioId,
    datosAnteriores: ant,
    datosNuevos: comprobante,
    motivo
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

cajaAuxiliarRouter.get(
  "/reporte",
  asyncHandler(async (req, res) => {
    const agenciaId = (req.query.agenciaId as string) || req.user?.agenciaId;
    if (!agenciaId) throw badRequest("Falta indicar la agencia");
    const fechaInicio = typeof req.query.fechaInicio === "string" ? req.query.fechaInicio : undefined;
    const fechaFin = typeof req.query.fechaFin === "string" ? req.query.fechaFin : undefined;
    res.json(await service.reporteMovimientos(agenciaId, agenciaVisible(req), fechaInicio, fechaFin));
  }),
);

cajaAuxiliarRouter.get(
  "/historial",
  requireRole("GERENCIA", "SUPERVISOR"),
  asyncHandler(async (req, res) => {
    const agenciaId = (req.query.agenciaId as string) || req.user?.agenciaId;
    if (!agenciaId) throw badRequest("Falta indicar la agencia");
    const limite = req.query.limite ? Number(req.query.limite) : 30;
    res.json(await service.historialDias(agenciaId, agenciaVisible(req), limite));
  }),
);

cajaAuxiliarRouter.get(
  "/analitica-servicios",
  asyncHandler(async (req, res) => {
    const agenciaId = (req.query.agenciaId as string) || req.user?.agenciaId || undefined;
    const periodo = (req.query.periodo as "dia" | "semana" | "mes" | "anio") || "mes";
    res.json(await service.analiticaServicios(agenciaId, agenciaVisible(req), periodo));
  }),
);

cajaAuxiliarRouter.get(
  "/arqueos-mes",
  requireRole("GERENCIA", "SUPERVISOR"),
  asyncHandler(async (req, res) => {
    const agenciaId = (req.query.agenciaId as string) || req.user?.agenciaId || undefined;
    const mes = typeof req.query.mes === "string" ? req.query.mes : undefined;
    res.json(await service.arqueosMensuales(agenciaId, agenciaVisible(req), mes));
  }),
);
cajaAuxiliarRouter.get(
  "/liquidaciones",
  requireRole("GERENCIA", "SUPERVISOR", "CAJERO", "CAJA_CHICA"),
  asyncHandler(async (req, res) => {
    const agenciaId = (req.query.agenciaId as string) || req.user?.agenciaId;
    if (!agenciaId) throw badRequest("Falta indicar la agencia");
    res.json(await service.listarLiquidacionesPendientes(agenciaId, agenciaVisible(req)));
  }),
);

cajaAuxiliarRouter.post(
  "/liquidaciones/aprobar",
  requireRole("GERENCIA", "SUPERVISOR", "CAJERO", "CAJA_CHICA"),
  asyncHandler(async (req, res) => {
    const { promotorId } = req.body;
    if (!promotorId) throw badRequest("Falta promotorId");
    const agenciaId = req.user!.agenciaId;
    if (!agenciaId) throw badRequest("Cajero sin agencia");
    res.json(await service.aprobarLiquidacion(agenciaId, promotorId, req.user!.id));
  }),
);

const abrirSchema = z.object({
  agenciaId: z.string().uuid(),
  saldoInicial: z.number().nonnegative().optional(),
});

cajaAuxiliarRouter.post(
  "/abrir",
  requireRole("GERENCIA", "SUPERVISOR", "CAJERO", "CAJA_CHICA"),
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
  "/verificar-documento",
  asyncHandler(async (req, res) => {
    const agenciaId = (req.query.agenciaId as string) || req.user?.agenciaId;
    if (!agenciaId) throw badRequest("Falta indicar la agencia");
    const docNo = typeof req.query.docNo === "string" ? req.query.docNo : "";
    res.json(await service.verificarReciboExiste(agenciaId, docNo));
  }),
);

cajaAuxiliarRouter.get(
  "/:diaId/ultimo-doc-no",
  asyncHandler(async (req, res) => {
    res.json(await service.obtenerUltimoDocNo(req.params.diaId, agenciaVisible(req)));
  }),
);

cajaAuxiliarRouter.get(
  "/:diaId/verificar-doc-no",
  asyncHandler(async (req, res) => {
    const docNo = typeof req.query.docNo === "string" ? req.query.docNo : "";
    res.json(await service.verificarDocNoExiste(req.params.diaId, docNo, agenciaVisible(req)));
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
  requireRole("GERENCIA", "SUPERVISOR", "CAJERO", "CAJA_CHICA"),
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
  requireRole("GERENCIA", "SUPERVISOR", "CAJERO"),
  asyncHandler(async (req, res) => {
    const data = cerrarSchema.parse(req.body);
    res.json(await service.cerrarDia(req.params.id, data.conteo, req.user!.id, agenciaVisible(req)));
  }),
);

const cobroCreditoSchema = z.object({
  prestamoId: z.string().uuid(),
  socioId: z.string().uuid(),
  abonoCapital: z.number().min(0),
  interes: z.number().min(0),
  mora: z.number().min(0).optional(),
  ahorroSobrePrestamo: z.number().min(0).optional(),
  origenFondos: z.enum(["FONDOS_PROPIOS", "FEDERURAL", "CHN_GUATEMALA"]).optional(),
  docNo: z.string().optional(),
  cuentaDebitoId: z.string().uuid().optional(),
  saldoAnteriorReportado: z.number().optional(),
  saldoActualReportado: z.number().optional(),
  numeroCuota: z.number().optional(),
  cantidadCuotas: z.number().min(1).optional(),
  descripcion: z.string().optional(),
});

cajaAuxiliarRouter.post(
  "/:id/cobro-credito",
  requireRole("GERENCIA", "SUPERVISOR", "CAJERO", "CAJA_CHICA"),
  asyncHandler(async (req, res) => {
    const data = cobroCreditoSchema.parse(req.body);
    res.status(201).json(
      await service.cobrarCuotaCredito(req.params.id, data, req.user!.id, agenciaVisible(req)),
    );
  }),
);

const desembolsoCreditoSchema = z.object({
  prestamoId: z.string().uuid(),
  docNo: z.string().optional(),
  origenFondos: z.enum(["FONDOS_PROPIOS", "FEDERURAL", "CHN_GUATEMALA"]).optional(),
  montoAhorroSobrePrestamo: z.number().min(0).optional(),
});

cajaAuxiliarRouter.post(
  "/:id/desembolso-credito",
  requireRole("GERENCIA", "SUPERVISOR", "CAJERO", "CAJA_CHICA"),
  asyncHandler(async (req, res) => {
    const data = desembolsoCreditoSchema.parse(req.body);
    res.status(201).json(
      await service.desembolsarCredito(req.params.id, data, req.user!.id, agenciaVisible(req)),
    );
  }),
);

const liquidarPlazoFijoSchema = z.object({
  contratoId: z.string().uuid(),
  reciboRetiro: z.string().min(1, "El número de recibo de retiro (RE. No.) es obligatorio"),
  incluirIntereses: z.boolean().optional(),
});

cajaAuxiliarRouter.post(
  "/:id/liquidar-plazo-fijo",
  requireRole("GERENCIA", "SUPERVISOR", "CAJERO", "CAJA_CHICA"),
  asyncHandler(async (req, res) => {
    const data = liquidarPlazoFijoSchema.parse(req.body);
    res.status(201).json(
      await service.liquidarPlazoFijo(req.params.id, data, req.user!.id, agenciaVisible(req)),
    );
  }),
);

const editarMovimientoSchema = z.object({
  seccion: z.enum(["BI", "PROPIO"]).optional(),
  categoria: z.any().optional(),
  tipo: z.enum(["INGRESO", "EGRESO"]).optional(),
  monto: z.number().positive().optional(),
  referencia: z.string().optional(),
  descripcion: z.string().optional(),
  motivo: z.string().min(10, "El motivo de la corrección es obligatorio (mínimo 10 caracteres)"),
});

cajaAuxiliarRouter.patch(
  "/movimiento/:id",
  requireRole("GERENCIA", "CAJERO", "CAJA_CHICA"),
  asyncHandler(async (req, res) => {
    const id = req.params.id;
    const data = editarMovimientoSchema.parse(req.body);
    const { motivo, ...updates } = data;

    // Verificar permisos operativos
    if (req.user!.rol !== "GERENCIA") {
      const { pool } = await import("../../db/pool");
      const { rows } = await pool.query(
        "select usuario_id, created_at from caja_movimientos_auxiliar where id = $1",
        [id]
      );
      if (!rows[0]) throw badRequest("El registro no existe");
      const reg = rows[0];
      
      if (reg.usuario_id !== req.user!.id) {
        throw forbidden("No autorizado: Solo puedes editar tus propios registros");
      }
      
      const hoy = new Date().toISOString().slice(0, 10);
      const fechaRegistro = new Date(reg.created_at).toISOString().slice(0, 10);
      if (hoy !== fechaRegistro) {
        throw forbidden("No autorizado: Solo puedes editar registros creados el día de hoy");
      }
    }

    res.json(await service.editar(id, updates, req.user!.id, motivo));
  }),
);
```

## `backend/src/modules/cajaauxiliar/service.ts` {#backendsrcmodulescajaauxiliarservicets}

```ts
import { PoolClient } from "pg";
import { pool } from "../../db/pool";
import { withTransaction } from "../../db/transaction";
import { registrarAuditoria } from "../../utils/auditoria";
import { badRequest, notFound, forbidden, conflict } from "../../utils/errors";
import * as cuentasService from "../cuentas/service";
import { CATEGORIAS, CajaCategoria, DENOMINACIONES, categoriasDelGrupo } from "./categorias";
import { calcularLiquidacionCredito, distribuirMontoCobro } from "../prestamos/liquidacion";

function hoyISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function checarAgencia(agenciaId: string, agenciaVisible: string | null) {
  if (agenciaVisible && agenciaId !== agenciaVisible) throw forbidden("Esa caja pertenece a otra agencia");
}

export async function estado(agenciaId: string, agenciaVisible: string | null) {
  checarAgencia(agenciaId, agenciaVisible);
  const fecha = hoyISO();

  // 1. ¿Hay caja abierta actualmente?
  const { rows: abiertos } = await pool.query(
    `select * from caja_dias where agencia_id = $1 and estado = 'ABIERTO' order by fecha desc limit 1`,
    [agenciaId],
  );
  if (abiertos[0]) return { estado: "ABIERTO" as const, dia: abiertos[0] };

  // 2. ¿La caja de hoy ya fue cerrada?
  const { rows: cerradosHoy } = await pool.query(
    `select * from caja_dias where agencia_id = $1 and fecha = $2 and estado = 'CERRADO' order by created_at desc limit 1`,
    [agenciaId, fecha],
  );
  if (cerradosHoy[0]) {
    const detalleCerrado = await detalle(cerradosHoy[0].id, agenciaVisible);
    return {
      estado: "CERRADO" as const,
      dia: cerradosHoy[0],
      detalle: detalleCerrado,
    };
  }

  // 3. Pendiente de abrir (toma saldo de la última caja cerrada)
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

export async function historialDias(agenciaId: string, agenciaVisible: string | null, limite = 30) {
  checarAgencia(agenciaId, agenciaVisible);
  const { rows } = await pool.query(
    `select d.*,
       u_abrio.nombre as abierto_por_nombre,
       u_cerro.nombre as cerrado_por_nombre,
       (select count(*) from caja_movimientos_auxiliar m where m.caja_dia_id = d.id)::int as total_movimientos,
       (select coalesce(sum(case when tipo = 'INGRESO' then monto else 0 end), 0) from caja_movimientos_auxiliar m where m.caja_dia_id = d.id) as total_ingresos,
       (select coalesce(sum(case when tipo = 'EGRESO' then monto else 0 end), 0) from caja_movimientos_auxiliar m where m.caja_dia_id = d.id) as total_egresos
     from caja_dias d
     left join usuarios u_abrio on u_abrio.id = d.abierto_por
     left join usuarios u_cerro on u_cerro.id = d.cerrado_por
     where d.agencia_id = $1
     order by d.fecha desc, d.created_at desc
     limit $2`,
    [agenciaId, limite],
  );
  return rows;
}

export async function abrirDia(agenciaId: string, usuarioId: string, agenciaVisible: string | null, saldoInicialManual?: number) {
  checarAgencia(agenciaId, agenciaVisible);
  const fecha = hoyISO();

  return withTransaction(async (client) => {
    const { rows: abiertos } = await client.query(
      `select * from caja_dias where agencia_id = $1 and estado = 'ABIERTO' order by fecha desc limit 1`,
      [agenciaId],
    );
    if (abiertos[0]) {
      const fechaAbierto = new Date(abiertos[0].fecha).toISOString().slice(0, 10);
      if (fechaAbierto === fecha) return abiertos[0];
      throw conflict(`Todavía tienes la caja del ${fechaAbierto} sin cerrar. Ciérrala antes de abrir la de hoy.`);
    }

    const { rows: existeHoy } = await client.query(
      `select * from caja_dias where agencia_id = $1 and fecha = $2`,
      [agenciaId, fecha],
    );
    if (existeHoy[0]) throw conflict("La caja de hoy ya fue cerrada; no se puede volver a abrir.");

    const { rows: ultimos } = await client.query(
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

    const { rows } = await client.query(
      `insert into caja_dias (agencia_id, fecha, saldo_inicial, estado, abierto_por)
       values ($1,$2,$3,'ABIERTO',$4)
       returning *`,
      [agenciaId, fecha, saldoInicial, usuarioId],
    );
    const dia = rows[0];
    await registrarAuditoria({ entidad: "CajaDia", entidadId: dia.id, accion: "CREAR", usuarioId, datosNuevos: dia });
    return dia;
  });
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
    `select m.*, u.nombre as usuario_nombre, u.rol as usuario_rol
     from caja_movimientos_auxiliar m join usuarios u on u.id = m.usuario_id
     where m.caja_dia_id = $1
     order by m.created_at desc`,
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
  return withTransaction(async (client) => {
    const { rows: diaRows } = await client.query(`select * from caja_dias where id = $1`, [diaId]);
    const dia = diaRows[0];
    if (!dia) throw notFound("Día de caja no encontrado");
    checarAgencia(dia.agencia_id, agenciaVisible);
    if (dia.estado !== "ABIERTO") throw conflict("La caja de este día ya está cerrada; no se pueden agregar movimientos.");

    const info = CATEGORIAS[data.categoria];
    if (!info) throw badRequest("Categoría de movimiento no reconocida");
    if (!data.monto || data.monto <= 0) throw badRequest("El monto debe ser mayor a cero");

    // Validación de número de documento / recibo anti-duplicados
    if (data.docNo && data.docNo.trim()) {
      const doc = data.docNo.trim();
      // 1. Checar en caja_movimientos_auxiliar
      const { rows: repetidoAux } = await client.query(
        `select fecha, doc_no, beneficiario, descripcion
         from caja_movimientos_auxiliar
         where agencia_id = $1 and lower(trim(doc_no)) = lower($2)
         limit 1`,
        [dia.agencia_id, doc],
      );
      if (repetidoAux[0]) {
        const fechaStr = new Date(repetidoAux[0].fecha).toLocaleDateString("es-GT");
        throw conflict(
          `El número de documento/recibo "${doc}" ya fue registrado el ${fechaStr} en Auxiliar de Caja (${repetidoAux[0].descripcion} - ${repetidoAux[0].beneficiario}). No se permiten documentos duplicados.`,
        );
      }

      // 1.1 Checar en caja_chica_comprobantes
      const { rows: repetidoCC } = await client.query(
        `select c.fecha, c.numero_documento, c.beneficiario, c.descripcion
         from caja_chica_comprobantes c
         where c.agencia_id = $1 and lower(trim(c.numero_documento)) = lower($2)
         limit 1`,
        [dia.agencia_id, doc],
      );
      if (repetidoCC[0]) {
        const fechaStr = new Date(repetidoCC[0].fecha).toLocaleDateString("es-GT");
        throw conflict(
          `El número de documento "${doc}" ya fue registrado el ${fechaStr} en Caja Chica (${repetidoCC[0].descripcion} - ${repetidoCC[0].beneficiario}). No se permiten documentos duplicados entre Auxiliar de Caja y Caja Chica.`,
        );
      }

      // 2. Checar en prestamo_pagos
      const { rows: repetidoPago } = await client.query(
        `select pp.fecha, pp.numero_recibo, p.codigo, s.nombres as socio_nombres
         from prestamo_pagos pp
         join prestamos p on p.id = pp.prestamo_id
         join socios s on s.id = pp.socio_id
         where pp.agencia_id = $1 and lower(trim(pp.numero_recibo)) = lower($2)
         limit 1`,
        [dia.agencia_id, doc],
      );
      if (repetidoPago[0]) {
        const fechaStr = new Date(repetidoPago[0].fecha).toLocaleDateString("es-GT");
        throw conflict(
          `El número de recibo "${doc}" ya fue registrado el ${fechaStr} en el crédito ${repetidoPago[0].codigo} (${repetidoPago[0].socio_nombres}). No se permiten recibos duplicados.`,
        );
      }

      // 3. Checar en movimientos de cuentas (si no requiereCuenta, pues requiereCuenta se valida en cuentasService)
      if (!info.requiereCuenta) {
        const { rows: repetidoMov } = await client.query(
          `select m.fecha, m.numero_recibo, c.numero_cuenta, s.nombres as socio_nombres
           from movimientos m
           join cuentas c on c.id = m.cuenta_id
           join socios s on s.id = c.socio_id
           where c.agencia_id = $1 and lower(trim(m.numero_recibo)) = lower($2)
           limit 1`,
          [dia.agencia_id, doc],
        );
        if (repetidoMov[0]) {
          const fechaStr = new Date(repetidoMov[0].fecha).toLocaleDateString("es-GT");
          throw conflict(
            `El número de recibo "${doc}" ya fue registrado el ${fechaStr} en la cuenta ${repetidoMov[0].numero_cuenta} (${repetidoMov[0].socio_nombres}). No se permiten recibos duplicados.`,
          );
        }
      }
    }

    const { rows: contadorRows } = await client.query(
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
      const { rows: ctaRows } = await client.query(
        `select c.*, s.nombres as socio_nombres, s.id as socio_id from cuentas c join socios s on s.id = c.socio_id where c.id = $1`,
        [data.cuentaId],
      );
      const cuenta = ctaRows[0];
      if (!cuenta) throw notFound("Cuenta no encontrada");
      if (agenciaVisible && cuenta.agencia_id !== agenciaVisible) throw forbidden("Esa cuenta pertenece a otra agencia");
      if (cuenta.tipo !== info.requiereCuenta) throw badRequest("La cuenta seleccionada no corresponde a este tipo de ahorro");

      const movimiento = await cuentasService.registrarMovimientoConClient(
        client,
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
      const { rows } = await client.query(
        `insert into ingresos_comif (agencia_id, fecha, numero_documento, nombre_socio, categoria, monto, usuario_id)
         values ($1,$2,$3,$4,$5,$6,$7)
         returning id`,
        [dia.agencia_id, dia.fecha, data.docNo ?? null, beneficiario, info.ingresosComifCategoria, data.monto, usuarioId],
      );
      ingresoComifId = rows[0].id;
    } else {
      if (!beneficiario) throw badRequest("Indica el beneficiario");
    }

    const { rows: ultimoMovRows } = await client.query(
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

    const { rows } = await client.query(
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
  });
}

export interface ItemConteo {
  valor: number;
  cantidad: number;
}

export async function cerrarDia(diaId: string, conteo: ItemConteo[], usuarioId: string, agenciaVisible: string | null) {
  return withTransaction(async (client) => {
    const { rows: diaRows } = await client.query(`select * from caja_dias where id = $1`, [diaId]);
    const dia = diaRows[0];
    if (!dia) throw notFound("Día de caja no encontrado");
    checarAgencia(dia.agencia_id, agenciaVisible);
    if (dia.estado !== "ABIERTO") throw conflict("Esta caja ya está cerrada");

    const denominacionesFaltantes = DENOMINACIONES.filter((d) => !conteo.some((c) => Math.abs(c.valor - d) < 0.001));
    if (denominacionesFaltantes.length) {
      throw badRequest(`Falta el conteo de: Q${denominacionesFaltantes.join(", Q")}`);
    }

    const { rows: ultimoMovRows } = await client.query(
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
    const diaActualizado = rows[0];
    await registrarAuditoria({
      entidad: "CajaDia",
      entidadId: diaId,
      accion: "ACTUALIZAR",
      usuarioId,
      datosNuevos: diaActualizado,
    });
    return diaActualizado;
  });
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

export async function obtenerUltimoDocNo(diaId: string, agenciaVisible: string | null) {
  const dia = await obtenerDiaCrudo(diaId, agenciaVisible);

  const { rows: docRows } = await pool.query(
    `select doc_no from caja_movimientos_auxiliar
     where caja_dia_id = $1 and doc_no is not null and trim(doc_no) <> ''
     order by created_at desc limit 1`,
    [dia.id],
  );
  const { rows: refRows } = await pool.query(
    `select referencia from caja_movimientos_auxiliar
     where caja_dia_id = $1 and seccion = 'BI' and referencia is not null and trim(referencia) <> ''
     order by created_at desc limit 1`,
    [dia.id],
  );

  return {
    ultimoDocNo: docRows[0]?.doc_no ?? null,
    ultimoReferenciaAut: refRows[0]?.referencia ?? null,
  };
}

export async function verificarReciboExiste(agenciaId: string, docNo: string) {
  const doc = docNo.trim();
  if (!doc) return { existe: false };

  // 1. Auxiliar de Caja
  const { rows: auxRows } = await pool.query(
    `select m.fecha, m.doc_no, m.beneficiario, m.descripcion, u.nombre as usuario_nombre, u.rol as usuario_rol
     from caja_movimientos_auxiliar m
     left join usuarios u on u.id = m.usuario_id
     where m.agencia_id = $1 and lower(trim(m.doc_no)) = lower($2)
     limit 1`,
    [agenciaId, doc],
  );
  if (auxRows[0]) {
    return {
      existe: true,
      modulo: "Auxiliar de Caja",
      fecha: auxRows[0].fecha,
      beneficiario: auxRows[0].beneficiario,
      descripcion: auxRows[0].descripcion,
      usuario: auxRows[0].usuario_nombre,
      usuarioRol: auxRows[0].usuario_rol,
    };
  }

  // 2. Caja Chica
  const { rows: ccRows } = await pool.query(
    `select c.fecha, c.numero_documento, c.beneficiario, c.descripcion, u.nombre as usuario_nombre, u.rol as usuario_rol
     from caja_chica_comprobantes c
     left join usuarios u on u.id = c.usuario_id
     where c.agencia_id = $1 and lower(trim(c.numero_documento)) = lower($2)
     limit 1`,
    [agenciaId, doc],
  );
  if (ccRows[0]) {
    return {
      existe: true,
      modulo: "Caja Chica",
      fecha: ccRows[0].fecha,
      beneficiario: ccRows[0].beneficiario,
      descripcion: ccRows[0].descripcion,
      usuario: ccRows[0].usuario_nombre,
      usuarioRol: ccRows[0].usuario_rol,
    };
  }

  // 3. Pagos de préstamos
  const { rows: ppRows } = await pool.query(
    `select pp.fecha, pp.numero_recibo, p.codigo, s.nombres as socio_nombres
     from prestamo_pagos pp
     join prestamos p on p.id = pp.prestamo_id
     join socios s on s.id = pp.socio_id
     where pp.agencia_id = $1 and lower(trim(pp.numero_recibo)) = lower($2)
     limit 1`,
    [agenciaId, doc],
  );
  if (ppRows[0]) {
    return {
      existe: true,
      modulo: "Cobro de Crédito",
      fecha: ppRows[0].fecha,
      beneficiario: ppRows[0].socio_nombres,
      descripcion: `Crédito ${ppRows[0].codigo}`,
    };
  }

  // 4. Movimientos de cuentas de ahorro/aportaciones
  const { rows: movRows } = await pool.query(
    `select m.fecha, m.numero_recibo, c.numero_cuenta, s.nombres as socio_nombres
     from movimientos m
     join cuentas c on c.id = m.cuenta_id
     join socios s on s.id = c.socio_id
     where c.agencia_id = $1 and lower(trim(m.numero_recibo)) = lower($2)
     limit 1`,
    [agenciaId, doc],
  );
  if (movRows[0]) {
    return {
      existe: true,
      modulo: "Movimiento de Cuenta",
      fecha: movRows[0].fecha,
      beneficiario: movRows[0].socio_nombres,
      descripcion: `Cuenta ${movRows[0].numero_cuenta}`,
    };
  }

  return { existe: false };
}

export async function verificarDocNoExiste(diaId: string, docNo: string, agenciaVisible: string | null) {
  const dia = await obtenerDiaCrudo(diaId, agenciaVisible);
  return verificarReciboExiste(dia.agencia_id, docNo);
}

export interface DatosCobroCredito {
  prestamoId: string;
  socioId: string;
  abonoCapital: number;
  interes: number;
  mora?: number;
  ahorroSobrePrestamo?: number;
  origenFondos?: "FONDOS_PROPIOS" | "FEDERURAL" | "CHN_GUATEMALA";
  docNo?: string;
  cuentaDebitoId?: string;
  saldoAnteriorReportado?: number;
  saldoActualReportado?: number;
  numeroCuota?: number;
  cantidadCuotas?: number;
  descripcion?: string;
}

export async function cobrarCuotaCredito(
  diaId: string,
  data: DatosCobroCredito,
  usuarioId: string,
  agenciaVisible: string | null,
) {
  return withTransaction(async (client) => {
    const { rows: diaRows } = await client.query(`select * from caja_dias where id = $1`, [diaId]);
    const dia = diaRows[0];
    if (!dia) throw notFound("Día de caja no encontrado");
    checarAgencia(dia.agencia_id, agenciaVisible);
    if (dia.estado !== "ABIERTO") {
      throw conflict("La caja de este día ya está cerrada; no se pueden registrar cobros.");
    }

    const { rows: prestamoRows } = await client.query(
      `select p.*, s.nombres as socio_nombres, s.numero_asociado
       from prestamos p
       join socios s on s.id = p.socio_id
       where p.id = $1`,
      [data.prestamoId],
    );
    const prestamo = prestamoRows[0];
    if (!prestamo) throw notFound("Préstamo no encontrado");
    if (agenciaVisible && prestamo.agencia_id !== agenciaVisible) {
      throw forbidden("Ese préstamo pertenece a otra agencia");
    }
    if (prestamo.estado !== "DESEMBOLSADO" && prestamo.estado !== "APROBADO") {
      throw badRequest(`El préstamo no está activo para cobro (estado actual: ${prestamo.estado})`);
    }

    const abonoCapital = Number(data.abonoCapital) || 0;
    const interes = Number(data.interes) || 0;
    const mora = Number(data.mora) || 0;
    const ahorroSobrePrestamo = Number(data.ahorroSobrePrestamo) || 0;
    const totalCobro = Math.round((abonoCapital + interes + mora + ahorroSobrePrestamo) * 100) / 100;

    if (totalCobro <= 0) {
      throw badRequest("El monto total a cobrar debe ser mayor a cero");
    }

    const saldoActualCapital = Number(
      prestamo.saldo_capital !== null && prestamo.saldo_capital !== undefined
        ? prestamo.saldo_capital
        : prestamo.monto_aprobado || prestamo.monto_solicitado,
    );

    if (abonoCapital > saldoActualCapital) {
      throw badRequest(
        `El abono a capital (Q ${abonoCapital.toFixed(2)}) no puede ser mayor al saldo pendiente de capital (Q ${saldoActualCapital.toFixed(2)}).`,
      );
    }

    const nuevoSaldoCapital = Math.max(0, Math.round((saldoActualCapital - abonoCapital) * 100) / 100);
    const nuevoEstadoPrestamo = nuevoSaldoCapital === 0 ? "CANCELADO" : prestamo.estado;

    // Validación de número de recibo anti-duplicados
    if (data.docNo && data.docNo.trim()) {
      const doc = data.docNo.trim();
      const { rows: repetidoPago } = await client.query(
        `select pp.fecha, pp.numero_recibo, p.codigo, s.nombres as socio_nombres
         from prestamo_pagos pp
         join prestamos p on p.id = pp.prestamo_id
         join socios s on s.id = pp.socio_id
         where pp.agencia_id = $1 and lower(trim(pp.numero_recibo)) = lower($2)
         limit 1`,
        [dia.agencia_id, doc],
      );
      if (repetidoPago[0]) {
        const fechaStr = new Date(repetidoPago[0].fecha).toLocaleDateString("es-GT");
        throw conflict(
          `El número de recibo "${doc}" ya fue registrado el ${fechaStr} en el crédito ${repetidoPago[0].codigo} (${repetidoPago[0].socio_nombres}). No se permiten recibos duplicados.`,
        );
      }

      const { rows: repetidoAux } = await client.query(
        `select fecha, doc_no, beneficiario, descripcion
         from caja_movimientos_auxiliar
         where agencia_id = $1 and lower(trim(doc_no)) = lower($2)
         limit 1`,
        [dia.agencia_id, doc],
      );
      if (repetidoAux[0]) {
        const fechaStr = new Date(repetidoAux[0].fecha).toLocaleDateString("es-GT");
        throw conflict(
          `El número de recibo/documento "${doc}" ya fue registrado el ${fechaStr} en Auxiliar de Caja (${repetidoAux[0].descripcion} - ${repetidoAux[0].beneficiario}). No se permiten documentos duplicados.`,
        );
      }

      const { rows: repetidoCC } = await client.query(
        `select c.fecha, c.numero_documento, c.beneficiario, c.descripcion
         from caja_chica_comprobantes c
         where c.agencia_id = $1 and lower(trim(c.numero_documento)) = lower($2)
         limit 1`,
        [dia.agencia_id, doc],
      );
      if (repetidoCC[0]) {
        const fechaStr = new Date(repetidoCC[0].fecha).toLocaleDateString("es-GT");
        throw conflict(
          `El número de recibo/documento "${doc}" ya fue registrado el ${fechaStr} en Caja Chica (${repetidoCC[0].descripcion} - ${repetidoCC[0].beneficiario}). No se permiten comprobantes duplicados entre Auxiliar de Caja y Caja Chica.`,
        );
      }

      const { rows: repetidoMov } = await client.query(
        `select m.fecha, m.numero_recibo, c.numero_cuenta, s.nombres as socio_nombres
         from movimientos m
         join cuentas c on c.id = m.cuenta_id
         join socios s on s.id = c.socio_id
         where c.agencia_id = $1 and lower(trim(m.numero_recibo)) = lower($2)
         limit 1`,
        [dia.agencia_id, doc],
      );
      if (repetidoMov[0]) {
        const fechaStr = new Date(repetidoMov[0].fecha).toLocaleDateString("es-GT");
        throw conflict(
          `El número de recibo "${doc}" ya fue registrado el ${fechaStr} en la cuenta ${repetidoMov[0].numero_cuenta} (${repetidoMov[0].socio_nombres}). No se permiten recibos duplicados.`,
        );
      }
    }

    // 1. Contador correlativo para categoría prestamo
    const categoriaPrestamo =
      prestamo.tipo === "HIPOTECARIO" ? "ABONO_PRESTAMO_HIPOTECARIO" : "ABONO_PRESTAMO_FIDUCIARIO";
    const info = CATEGORIAS[categoriaPrestamo];
    const { rows: contadorRows } = await client.query(
      `select count(*)::int as total from caja_movimientos_auxiliar
       where agencia_id = $1 and categoria::text = any($2::text[])`,
      [dia.agencia_id, categoriasDelGrupo(info.grupoContador)],
    );
    const contador = contadorRows[0].total + 1;

    // 2. Saldo previo y acumulado en caja
    const { rows: ultimoMovRows } = await client.query(
      `select saldo_acumulado from caja_movimientos_auxiliar where caja_dia_id = $1 order by created_at desc limit 1`,
      [diaId],
    );
    const saldoPrevio = ultimoMovRows[0] ? Number(ultimoMovRows[0].saldo_acumulado) : Number(dia.saldo_inicial);
    const saldoAcumulado = saldoPrevio + totalCobro;

    // Débito a cuenta de ahorro si se indicó
    let infoCuentaDebito: { id: string; numero_cuenta: string } | null = null;
    if (data.cuentaDebitoId) {
      const { rows: ctaRows } = await client.query(
        `select c.id, c.numero_cuenta, coalesce(sc.saldo_actual, c.saldo_inicial) as saldo_actual
         from cuentas c
         left join saldos_cuenta sc on sc.cuenta_id = c.id
         where c.id = $1 and c.socio_id = $2`,
        [data.cuentaDebitoId, prestamo.socio_id],
      );
      const cta = ctaRows[0];
      if (!cta) throw badRequest("La cuenta seleccionada para débito no pertenece al socio del crédito");
      if (Number(cta.saldo_actual) < totalCobro) {
        throw conflict(
          `Saldo insuficiente en la cuenta ${cta.numero_cuenta}: tiene Q ${Number(cta.saldo_actual).toFixed(2)} y el cobro es de Q ${totalCobro.toFixed(2)}`,
        );
      }
      infoCuentaDebito = cta;

      const clienteMovId = `DEB-CUOTA-${prestamo.id}-${Date.now()}`;
      await client.query(
        `insert into movimientos (cuenta_id, tipo, monto, fecha, numero_recibo, descripcion, usuario_id, cliente_movimiento_id)
         values ($1, 'RETIRO', $2, $3, $4, $5, $6, $7)`,
        [
          cta.id,
          totalCobro,
          dia.fecha,
          data.docNo ?? null,
          `Débito para pago de cuota crédito ${prestamo.codigo}`,
          usuarioId,
          clienteMovId,
        ],
      );
    }

    // 3. Si se incluye Ahorro sobre Préstamo, acreditar depósito a la cuenta ASP del socio
    let cuentaAspInfo: { id: string; numero_cuenta: string } | null = null;
    if (ahorroSobrePrestamo > 0) {
      const { rows: ctaAspRows } = await client.query(
        `select id, numero_cuenta from cuentas
         where socio_id = $1 and tipo = 'AHORRO_SOBRE_PRESTAMO'
         order by (case when prestamo_id = $2 then 0 else 1 end), created_at desc
         limit 1`,
        [prestamo.socio_id, prestamo.id],
      );

      let ctaAsp = ctaAspRows[0];
      if (!ctaAsp) {
        const { numeroCuenta } = await cuentasService.siguienteNumero(dia.agencia_id, "AHORRO_SOBRE_PRESTAMO");
        const { rows: nuevaCta } = await client.query(
          `insert into cuentas (numero_cuenta, tipo, socio_id, agencia_id, saldo_inicial, observaciones_apertura, prestamo_id, creado_por_id)
           values ($1, 'AHORRO_SOBRE_PRESTAMO', $2, $3, 0, $4, $5, $6)
           returning id, numero_cuenta`,
          [
            numeroCuenta,
            prestamo.socio_id,
            dia.agencia_id,
            `Cuenta de ahorro en garantía vinculada al crédito ${prestamo.codigo}`,
            prestamo.id,
            usuarioId,
          ],
        );
        ctaAsp = nuevaCta[0];
      }
      cuentaAspInfo = ctaAsp;

      const clienteMovAspId = `DEP-ASP-CUOTA-${prestamo.id}-${Date.now()}`;
      await client.query(
        `insert into movimientos (cuenta_id, tipo, monto, fecha, numero_recibo, descripcion, usuario_id, cliente_movimiento_id)
         values ($1, 'DEPOSITO', $2, $3, $4, $5, $6, $7)`,
        [
          ctaAsp.id,
          ahorroSobrePrestamo,
          dia.fecha,
          data.docNo ?? null,
          `Aporte Ahorro sobre Préstamo cuota crédito ${prestamo.codigo}`,
          usuarioId,
          clienteMovAspId,
        ],
      );
    }

    // 4. Registrar en caja_movimientos_auxiliar
    const origenFondosFinal = data.origenFondos || prestamo.origen_fondos || "FONDOS_PROPIOS";
    const ref = `${prestamo.codigo}-CUOTA`;
    const detalleDebito = infoCuentaDebito ? ` (Cobrado con débito de cuenta ${infoCuentaDebito.numero_cuenta})` : "";
    const detalleAsp = ahorroSobrePrestamo > 0 ? `, Ahorro: Q${ahorroSobrePrestamo.toFixed(2)}` : "";
    const baseDescripcion = `Cobro cuota crédito ${prestamo.codigo} (Cap: Q${abonoCapital.toFixed(2)}, Int: Q${interes.toFixed(2)}${detalleAsp}${mora > 0 ? `, Mora: Q${mora.toFixed(2)}` : ""})${detalleDebito}`;
    const descripcion = data.descripcion ? `${baseDescripcion} - Obs: ${data.descripcion}` : baseDescripcion;

    const { rows: cajaMovRows } = await client.query(
      `insert into caja_movimientos_auxiliar (
         caja_dia_id, agencia_id, fecha, seccion, categoria, tipo, contador,
         referencia, socio_id, beneficiario, descripcion, doc_no, monto, saldo_acumulado, origen_fondos, usuario_id,
         saldo_anterior_reportado, saldo_actual_reportado, numero_cuota
       ) values ($1, $2, $3, 'PROPIO', $4, 'INGRESO', $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
       returning *`,
      [
        diaId,
        dia.agencia_id,
        dia.fecha,
        categoriaPrestamo,
        contador,
        ref,
        prestamo.socio_id,
        prestamo.socio_nombres,
        descripcion,
        data.docNo ?? null,
        totalCobro,
        saldoAcumulado,
        origenFondosFinal,
        usuarioId,
        data.saldoAnteriorReportado ?? null,
        data.saldoActualReportado ?? null,
        data.numeroCuota ?? null,
      ],
    );
    const cajaMov = cajaMovRows[0];

    // 5. Registrar en ingresos_comif
    if (abonoCapital > 0) {
      await client.query(
        `insert into ingresos_comif (agencia_id, fecha, numero_documento, nombre_socio, categoria, monto, origen_fondos, usuario_id)
         values ($1, $2, $3, $4, 'ABONO_PRESTAMO', $5, $6, $7)`,
        [dia.agencia_id, dia.fecha, data.docNo ?? null, prestamo.socio_nombres, abonoCapital, origenFondosFinal, usuarioId],
      );
    }
    if (interes + mora > 0) {
      await client.query(
        `insert into ingresos_comif (agencia_id, fecha, numero_documento, nombre_socio, categoria, monto, origen_fondos, usuario_id)
         values ($1, $2, $3, $4, 'INTERES_PRESTAMO', $5, $6, $7)`,
        [dia.agencia_id, dia.fecha, data.docNo ?? null, prestamo.socio_nombres, interes + mora, origenFondosFinal, usuarioId],
      );
    }

    // 6. Actualizar préstamo (reducir saldo_capital y si llega a 0 cambiar a CANCELADO)
    const cuotasIncremento = data.cantidadCuotas || 1;
    const cuotaFinal = data.numeroCuota ? (data.numeroCuota + cuotasIncremento - 1) : (prestamo.cuotas_pagadas + cuotasIncremento);

    await client.query(
      `update prestamos
       set saldo_capital = $1,
           estado = $2,
           cuotas_pagadas = $3,
           updated_at = now()
       where id = $4`,
      [nuevoSaldoCapital, nuevoEstadoPrestamo, cuotaFinal, prestamo.id],
    );

    // 7. Registrar en prestamo_pagos
    const { rows: pagoRows } = await client.query(
      `insert into prestamo_pagos (
         prestamo_id, socio_id, agencia_id, caja_dia_id, caja_movimiento_id,
         fecha, numero_recibo, abono_capital, interes, mora, total_pagado,
         saldo_capital_restante, origen_fondos, usuario_id
       ) values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
       returning *`,
      [
        prestamo.id,
        prestamo.socio_id,
        dia.agencia_id,
        diaId,
        cajaMov.id,
        dia.fecha,
        data.docNo ?? null,
        abonoCapital,
        interes,
        mora,
        totalCobro,
        nuevoSaldoCapital,
        origenFondosFinal,
        usuarioId,
      ],
    );

    await registrarAuditoria({
      entidad: "PrestamoPago",
      entidadId: pagoRows[0].id,
      accion: "CREAR",
      usuarioId,
      datosNuevos: {
        prestamoId: prestamo.id,
        codigo: prestamo.codigo,
        pago: pagoRows[0],
        ahorroSobrePrestamo,
        cuentaAsp: cuentaAspInfo,
        nuevoSaldoCapital,
      },
    });

    return {
      pago: pagoRows[0],
      cajaMovimiento: cajaMov,
      saldoCapitalRestante: nuevoSaldoCapital,
      ahorroSobrePrestamoAcreditado: ahorroSobrePrestamo,
      cuentaAsp: cuentaAspInfo,
      prestamoCancelado: nuevoEstadoPrestamo === "CANCELADO",
    };
  });
}

export interface DatosDesembolsoCredito {
  prestamoId: string;
  docNo?: string;
  origenFondos?: "FONDOS_PROPIOS" | "FEDERURAL" | "CHN_GUATEMALA";
  montoAhorroSobrePrestamo?: number;
}

export async function desembolsarCredito(
  diaId: string,
  data: DatosDesembolsoCredito,
  usuarioId: string,
  agenciaVisible: string | null,
) {
  return withTransaction(async (client) => {
    const { rows: diaRows } = await client.query(`select * from caja_dias where id = $1`, [diaId]);
    const dia = diaRows[0];
    if (!dia) throw notFound("Día de caja no encontrado");
    checarAgencia(dia.agencia_id, agenciaVisible);
    if (dia.estado !== "ABIERTO") {
      throw conflict("La caja de este día ya está cerrada; no se pueden realizar desembolsos.");
    }

    const { rows: prestamoRows } = await client.query(
      `select p.*, s.nombres as socio_nombres, s.numero_asociado
       from prestamos p
       join socios s on s.id = p.socio_id
       where p.id = $1`,
      [data.prestamoId],
    );
    const prestamo = prestamoRows[0];
    if (!prestamo) throw notFound("Préstamo no encontrado");
    if (agenciaVisible && prestamo.agencia_id !== agenciaVisible) {
      throw forbidden("Ese préstamo pertenece a otra agencia");
    }

    // Regla de Oro: Préstamos migrados no se desembolsan en efectivo de caja
    if (prestamo.es_migracion) {
      throw badRequest(
        `El crédito ${prestamo.codigo} es una migración histórica preexistente (ya desembolsado con anterioridad). No requiere ni permite desembolso físico en la caja de ventanilla.`,
      );
    }

    if (prestamo.estado !== "APROBADO") {
      throw badRequest(
        `El préstamo debe estar en estado APROBADO para ser desembolsado en caja (estado actual: ${prestamo.estado})`,
      );
    }

    const montoDesembolso = Number(prestamo.monto_aprobado || prestamo.monto_solicitado);
    if (montoDesembolso <= 0) {
      throw badRequest("El monto aprobado debe ser mayor a cero");
    }

    const montoAsp = Math.max(0, Math.min(montoDesembolso, Math.round((Number(data.montoAhorroSobrePrestamo) || 0) * 100) / 100));
    const efectivoNetoRequerido = Math.round((montoDesembolso - montoAsp) * 100) / 100;

    // Validar si hay saldo suficiente en la caja física para el efectivo neto a entregar
    const { rows: ultimoMovRows } = await client.query(
      `select saldo_acumulado from caja_movimientos_auxiliar where caja_dia_id = $1 order by created_at desc limit 1`,
      [diaId],
    );
    const saldoPrevio = ultimoMovRows[0] ? Number(ultimoMovRows[0].saldo_acumulado) : Number(dia.saldo_inicial);

    if (efectivoNetoRequerido > saldoPrevio) {
      throw conflict(
        `Saldo insuficiente en la caja física: Se requieren Q ${efectivoNetoRequerido.toFixed(2)} en efectivo pero el saldo actual en caja es de Q ${saldoPrevio.toFixed(2)}. Ingrese fondos o reduzca la entrega.`,
      );
    }

    // Validación de docNo anti-duplicados
    if (data.docNo && data.docNo.trim()) {
      const doc = data.docNo.trim();
      const { rows: repetidoAux } = await client.query(
        `select fecha, doc_no, beneficiario, descripcion
         from caja_movimientos_auxiliar
         where agencia_id = $1 and lower(trim(doc_no)) = lower($2)
         limit 1`,
        [dia.agencia_id, doc],
      );
      if (repetidoAux[0]) {
        const fechaStr = new Date(repetidoAux[0].fecha).toLocaleDateString("es-GT");
        throw conflict(
          `El número de comprobante/recibo "${doc}" ya fue registrado el ${fechaStr} en Auxiliar de Caja (${repetidoAux[0].descripcion} - ${repetidoAux[0].beneficiario}). No se permiten documentos duplicados.`,
        );
      }

      const { rows: repetidoCC } = await client.query(
        `select c.fecha, c.numero_documento, c.beneficiario, c.descripcion
         from caja_chica_comprobantes c
         where c.agencia_id = $1 and lower(trim(c.numero_documento)) = lower($2)
         limit 1`,
        [dia.agencia_id, doc],
      );
      if (repetidoCC[0]) {
        const fechaStr = new Date(repetidoCC[0].fecha).toLocaleDateString("es-GT");
        throw conflict(
          `El número de comprobante/recibo "${doc}" ya fue registrado el ${fechaStr} en Caja Chica (${repetidoCC[0].descripcion} - ${repetidoCC[0].beneficiario}). No se permiten documentos duplicados entre Auxiliar de Caja y Caja Chica.`,
        );
      }
    }

    // 1. Contador de colocación
    const info = CATEGORIAS.COLOCACION_PRESTAMO;
    const { rows: contadorRows } = await client.query(
      `select count(*)::int as total from caja_movimientos_auxiliar
       where agencia_id = $1 and categoria::text = any($2::text[])`,
      [dia.agencia_id, categoriasDelGrupo(info.grupoContador)],
    );
    const contador = contadorRows[0].total + 1;
    let saldoAcumulado = Math.round((saldoPrevio - montoDesembolso) * 100) / 100;

    // 2. Registrar egreso en caja_movimientos_auxiliar (Colocación Préstamo)
    const origenFondosFinal = data.origenFondos || prestamo.origen_fondos || "FONDOS_PROPIOS";
    const detalleAspDesc = montoAsp > 0 ? ` (Retención Ahorro: Q${montoAsp.toFixed(2)}, Neto entregado: Q${efectivoNetoRequerido.toFixed(2)})` : "";
    const descripcion = `Desembolso de crédito ${prestamo.codigo} (${prestamo.tipo})${detalleAspDesc}`;
    const { rows: cajaMovRows } = await client.query(
      `insert into caja_movimientos_auxiliar (
         caja_dia_id, agencia_id, fecha, seccion, categoria, tipo, contador,
         referencia, socio_id, beneficiario, descripcion, doc_no, monto, saldo_acumulado, origen_fondos, usuario_id
       ) values ($1, $2, $3, 'PROPIO', 'COLOCACION_PRESTAMO', 'EGRESO', $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       returning *`,
      [
        diaId,
        dia.agencia_id,
        dia.fecha,
        contador,
        prestamo.codigo,
        prestamo.socio_id,
        prestamo.socio_nombres,
        descripcion,
        data.docNo ?? null,
        montoDesembolso,
        saldoAcumulado,
        origenFondosFinal,
        usuarioId,
      ],
    );
    const cajaMov = cajaMovRows[0];

    // 3. Si se especificó retención de Ahorro sobre Préstamo, acreditar a la cuenta y registrar ingreso
    let cuentaAspInfo: { id: string; numero_cuenta: string } | null = null;
    if (montoAsp > 0) {
      const { rows: ctaAspRows } = await client.query(
        `select id, numero_cuenta from cuentas
         where socio_id = $1 and tipo = 'AHORRO_SOBRE_PRESTAMO'
         order by (case when prestamo_id = $2 then 0 else 1 end), created_at desc
         limit 1`,
        [prestamo.socio_id, prestamo.id],
      );

      let cta = ctaAspRows[0];
      if (!cta) {
        const { numeroCuenta } = await cuentasService.siguienteNumero(dia.agencia_id, "AHORRO_SOBRE_PRESTAMO");
        const { rows: nuevaCta } = await client.query(
          `insert into cuentas (numero_cuenta, tipo, socio_id, agencia_id, saldo_inicial, observaciones_apertura, prestamo_id, creado_por_id)
           values ($1, 'AHORRO_SOBRE_PRESTAMO', $2, $3, 0, $4, $5, $6)
           returning id, numero_cuenta`,
          [
            numeroCuenta,
            prestamo.socio_id,
            dia.agencia_id,
            `Cuenta de ahorro en garantía vinculada al crédito ${prestamo.codigo}`,
            prestamo.id,
            usuarioId,
          ],
        );
        cta = nuevaCta[0];
      }
      cuentaAspInfo = cta;

      const clienteMovId = `DEP-ASP-${prestamo.id}-${Date.now()}`;
      await client.query(
        `insert into movimientos (cuenta_id, tipo, monto, fecha, numero_recibo, descripcion, usuario_id, cliente_movimiento_id)
         values ($1, 'DEPOSITO', $2, $3, $4, $5, $6, $7)`,
        [
          cta.id,
          montoAsp,
          dia.fecha,
          data.docNo ?? null,
          `Acreditación de retención Ahorro sobre Préstamo (Garantía) - Crédito ${prestamo.codigo}`,
          usuarioId,
          clienteMovId,
        ],
      );

      const infoAsp = CATEGORIAS.DEPOSITO_AHORRO_SOBRE_PRESTAMO;
      const { rows: contadorAspRows } = await client.query(
        `select count(*)::int as total from caja_movimientos_auxiliar
         where agencia_id = $1 and categoria::text = any($2::text[])`,
        [dia.agencia_id, categoriasDelGrupo(infoAsp.grupoContador)],
      );
      const contadorAsp = contadorAspRows[0].total + 1;
      saldoAcumulado = Math.round((saldoAcumulado + montoAsp) * 100) / 100;

      await client.query(
        `insert into caja_movimientos_auxiliar (
           caja_dia_id, agencia_id, fecha, seccion, categoria, tipo, contador,
           referencia, socio_id, beneficiario, descripcion, doc_no, monto, saldo_acumulado, usuario_id
         ) values ($1, $2, $3, 'PROPIO', 'DEPOSITO_AHORRO_SOBRE_PRESTAMO', 'INGRESO', $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
        [
          diaId,
          dia.agencia_id,
          dia.fecha,
          contadorAsp,
          `${cta.numero_cuenta}-IN`,
          prestamo.socio_id,
          prestamo.socio_nombres,
          `Retención Ahorro sobre Préstamo crédito ${prestamo.codigo} (Cuenta ${cta.numero_cuenta})`,
          data.docNo ?? null,
          montoAsp,
          saldoAcumulado,
          usuarioId,
        ],
      );
    }

    // 4. Actualizar estado del préstamo a DESEMBOLSADO
    const { rows: prestamoActualizadoRows } = await client.query(
      `update prestamos
       set estado = 'DESEMBOLSADO',
           origen_fondos = $1,
           fecha_desembolso = $2,
           saldo_capital = $3,
           updated_at = now()
       where id = $4
       returning *`,
      [origenFondosFinal, dia.fecha, montoDesembolso, prestamo.id],
    );

    await registrarAuditoria({
      entidad: "Prestamo",
      entidadId: prestamo.id,
      accion: "ACTUALIZAR",
      usuarioId,
      datosNuevos: {
        estado: "DESEMBOLSADO",
        desembolsoCajaMovimientoId: cajaMov.id,
        monto: montoDesembolso,
        montoAhorroSobrePrestamo: montoAsp,
        cuentaAsp: cuentaAspInfo,
      },
    });

    return {
      prestamo: prestamoActualizadoRows[0],
      cajaMovimiento: cajaMov,
      efectivoNetoEntregado: efectivoNetoRequerido,
      ahorroSobrePrestamoRetenido: montoAsp,
      cuentaAsp: cuentaAspInfo,
    };
  });
}

export interface DatosLiquidarPlazoFijoVentanilla {
  contratoId: string;
  reciboRetiro: string; // RE. No.
  incluirIntereses?: boolean;
}

export async function liquidarPlazoFijo(
  diaId: string,
  data: DatosLiquidarPlazoFijoVentanilla,
  usuarioId: string,
  agenciaVisible: string | null,
) {
  return withTransaction(async (client) => {
    const { rows: diaRows } = await client.query(`select * from caja_dias where id = $1`, [diaId]);
    const dia = diaRows[0];
    if (!dia) throw notFound("Día de caja no encontrado");
    checarAgencia(dia.agencia_id, agenciaVisible);
    if (dia.estado !== "ABIERTO") {
      throw conflict("La caja de este día ya está cerrada. No se pueden registrar liquidaciones.");
    }

    if (!data.reciboRetiro || !data.reciboRetiro.trim()) {
      throw badRequest("El número de recibo de egreso (RE. No.) es obligatorio para liquidar el plazo fijo.");
    }
    const recibo = data.reciboRetiro.trim();

    // Obtener contrato
    const { rows: contratoRows } = await client.query(
      `select pf.*, c.numero_cuenta, c.agencia_id, s.nombres as socio_nombres, s.id as socio_id, s.numero_asociado
       from plazo_fijo_contratos pf
       join cuentas c on c.id = pf.cuenta_id
       join socios s on s.id = c.socio_id
       where pf.id = $1`,
      [data.contratoId],
    );
    const contrato = contratoRows[0];
    if (!contrato) throw notFound("Contrato de plazo fijo no encontrado");
    if (contrato.agencia_id !== dia.agencia_id) {
      throw forbidden("Ese contrato pertenece a otra agencia");
    }
    if (contrato.estado === "LIQUIDADO") {
      throw conflict(`El certificado No. ${contrato.numero_certificacion} ya fue liquidado anteriormente.`);
    }

    const montoALiquidar = data.incluirIntereses
      ? Number(contrato.saldo_liquido_a_pagar)
      : Number(contrato.monto_deposito);

    // Validar saldo suficiente en caja
    const { rows: ultimoMovRows } = await client.query(
      `select saldo_acumulado from caja_movimientos_auxiliar where caja_dia_id = $1 order by created_at desc limit 1`,
      [diaId],
    );
    const saldoPrevio = ultimoMovRows[0] ? Number(ultimoMovRows[0].saldo_acumulado) : Number(dia.saldo_inicial);
    if (montoALiquidar > saldoPrevio) {
      throw conflict(
        `Saldo insuficiente en la caja física: Se requieren Q ${montoALiquidar.toFixed(2)} para liquidar el certificado pero la caja solo tiene Q ${saldoPrevio.toFixed(2)}. Ingrese fondos antes de pagar.`,
      );
    }

    // Validación anti-duplicados del recibo de retiro
    const { rows: repetidoAux } = await client.query(
      `select fecha, doc_no, beneficiario, descripcion
       from caja_movimientos_auxiliar
       where agencia_id = $1 and lower(trim(doc_no)) = lower($2)
       limit 1`,
      [dia.agencia_id, recibo],
    );
    if (repetidoAux[0]) {
      const fechaStr = new Date(repetidoAux[0].fecha).toLocaleDateString("es-GT");
      throw conflict(
        `El número de recibo de retiro "${recibo}" ya fue registrado el ${fechaStr} en Auxiliar de Caja (${repetidoAux[0].descripcion} - ${repetidoAux[0].beneficiario}). No se permiten recibos duplicados.`,
      );
    }

    const { rows: repetidoCC } = await client.query(
      `select c.fecha, c.numero_documento, c.beneficiario, c.descripcion
       from caja_chica_comprobantes c
       where c.agencia_id = $1 and lower(trim(c.numero_documento)) = lower($2)
       limit 1`,
      [dia.agencia_id, recibo],
    );
    if (repetidoCC[0]) {
      const fechaStr = new Date(repetidoCC[0].fecha).toLocaleDateString("es-GT");
      throw conflict(
        `El número de recibo de retiro "${recibo}" ya fue registrado el ${fechaStr} en Caja Chica (${repetidoCC[0].descripcion} - ${repetidoCC[0].beneficiario}). No se permiten comprobantes duplicados entre Auxiliar de Caja y Caja Chica.`,
      );
    }

    const { rows: repetidoPF } = await client.query(
      `select fecha_retiro, recibo_retiro, numero_certificacion
       from plazo_fijo_contratos
       where lower(trim(recibo_retiro)) = lower($1)
       limit 1`,
      [recibo],
    );
    if (repetidoPF[0]) {
      const fechaStr = repetidoPF[0].fecha_retiro ? new Date(repetidoPF[0].fecha_retiro).toLocaleDateString("es-GT") : "";
      throw conflict(
        `El número de recibo "${recibo}" ya fue utilizado en la liquidación del certificado No. ${repetidoPF[0].numero_certificacion} el ${fechaStr}.`,
      );
    }

    const info = CATEGORIAS.RETIRO_PLAZO_FIJO;
    const { rows: contadorRows } = await client.query(
      `select count(*)::int as total from caja_movimientos_auxiliar
       where agencia_id = $1 and categoria::text = any($2::text[])`,
      [dia.agencia_id, categoriasDelGrupo(info.grupoContador)],
    );
    const contador = contadorRows[0].total + 1;
    const saldoAcumulado = Math.round((saldoPrevio - montoALiquidar) * 100) / 100;

    // 1. Insertar egreso en caja_movimientos_auxiliar
    const { rows: cajaMovRows } = await client.query(
      `insert into caja_movimientos_auxiliar (
         caja_dia_id, agencia_id, fecha, seccion, categoria, tipo, contador,
         referencia, socio_id, cuenta_id, beneficiario, descripcion, doc_no,
         monto, saldo_acumulado, usuario_id
       ) values ($1, $2, $3, 'PROPIO', 'RETIRO_PLAZO_FIJO', 'EGRESO', $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       returning *`,
      [
        diaId,
        dia.agencia_id,
        dia.fecha,
        contador,
        contrato.numero_certificacion,
        contrato.socio_id,
        contrato.cuenta_id,
        contrato.socio_nombres,
        `Liquidación Plazo Fijo Certificado No. ${contrato.numero_certificacion}${data.incluirIntereses ? " (Cap + Int)" : " (Capital)"}`,
        recibo,
        montoALiquidar,
        saldoAcumulado,
        usuarioId,
      ],
    );
    const cajaMov = cajaMovRows[0];

    // 2. Actualizar contrato a LIQUIDADO
    const { rows: pfActualizadoRows } = await client.query(
      `update plazo_fijo_contratos
       set estado = 'LIQUIDADO',
           fecha_retiro = $1,
           recibo_retiro = $2,
           monto_liquidado = $3,
           updated_at = now()
       where id = $4
       returning *`,
      [dia.fecha, recibo, montoALiquidar, contrato.id],
    );

    // 3. Registrar retiro en la cuenta
    const clienteMovId = `LIQ-PF-${contrato.id}-${Date.now()}`;
    await client.query(
      `insert into movimientos (cuenta_id, tipo, monto, fecha, descripcion, numero_recibo, usuario_id, cliente_movimiento_id)
       values ($1, 'RETIRO', $2, $3, $4, $5, $6, $7)`,
      [
        contrato.cuenta_id,
        montoALiquidar,
        dia.fecha,
        `Liquidación Certificado No. ${contrato.numero_certificacion}`,
        recibo,
        usuarioId,
        clienteMovId,
      ],
    );

    await registrarAuditoria({
      entidad: "PlazoFijoContrato",
      entidadId: contrato.id,
      accion: "ACTUALIZAR",
      usuarioId,
      datosNuevos: {
        estado: "LIQUIDADO",
        montoLiquidado: montoALiquidar,
        reciboRetiro: recibo,
        cajaMovimientoId: cajaMov.id,
      },
    });

    return {
      contrato: pfActualizadoRows[0],
      cajaMovimiento: cajaMov,
      montoLiquidado: montoALiquidar,
    };
  });
}

export async function analiticaServicios(
  agenciaId: string | null | undefined,
  agenciaVisible: string | null,
  periodo: "dia" | "semana" | "mes" | "anio" = "mes",
) {
  let filtroAgenciaAux = "";
  let filtroAgenciaCuentas = "";
  let filtroAgenciaPrestamos = "";
  let filtroAgenciaCajaChica = "";
  const params: unknown[] = [];

  const targetAgencia = agenciaVisible || (agenciaId && agenciaId !== "TODAS" ? agenciaId : null);
  if (targetAgencia) {
    params.push(targetAgencia);
    filtroAgenciaAux = `and d.agencia_id = $${params.length}`;
    filtroAgenciaCuentas = `and c.agencia_id = $${params.length}`;
    filtroAgenciaPrestamos = `and p.agencia_id = $${params.length}`;
    filtroAgenciaCajaChica = `and cc.agencia_id = $${params.length}`;
  }

  let fechaInicioSql = "current_date - interval '30 days'";
  if (periodo === "dia") {
    fechaInicioSql = "current_date";
  } else if (periodo === "semana") {
    fechaInicioSql = "current_date - interval '7 days'";
  } else if (periodo === "anio") {
    fechaInicioSql = "date_trunc('year', current_date)";
  }

  const query = `
    with ops as (
      -- 1. Movimientos de Ventanilla en Auxiliar de Caja
      select 
        d.fecha::date as fecha,
        m.categoria::text as categoria,
        case when m.tipo = 'INGRESO' then 'INGRESO' else 'EGRESO' end as flujo,
        m.monto as monto
      from caja_movimientos_auxiliar m
      join caja_dias d on d.id = m.caja_dia_id
      where d.fecha >= ${fechaInicioSql} and d.fecha <= current_date + interval '1 day' ${filtroAgenciaAux}

      union all

      -- 2. Aperturas de Cuentas / Aportaciones Estatutarias de Capital
      select
        c.created_at::date as fecha,
        case 
          when c.tipo = 'APORTACION' then 'APORTACION'
          when c.tipo = 'AHORRO_CORRIENTE' then 'DEPOSITO_AHORRO_CORRIENTE'
          when c.tipo = 'AHORRO_PROGRAMADO' then 'DEPOSITO_AHORRO_PROGRAMADO'
          when c.tipo = 'AHORRO_INFANTO_JUVENIL' then 'DEPOSITO_AHORRO_INFANTO_JUVENIL'
          when c.tipo = 'AHORRO_SOBRE_PRESTAMO' then 'DEPOSITO_AHORRO_SOBRE_PRESTAMO'
          when c.tipo = 'AHORRO_PLAZO_FIJO' then 'DEPOSITO_PLAZO_FIJO'
          else 'INGRESO_VARIO'
        end as categoria,
        'INGRESO' as flujo,
        c.saldo_inicial as monto
      from cuentas c
      where c.saldo_inicial > 0
        and c.created_at::date >= ${fechaInicioSql}
        and c.created_at::date <= current_date + interval '1 day'
        ${filtroAgenciaCuentas}

      union all

      -- 3. Movimientos en Cuentas (evitando duplicar con ventanilla)
      select 
        m.fecha::date as fecha,
        case 
          when c.tipo = 'APORTACION' then 'APORTACION'
          when c.tipo = 'AHORRO_CORRIENTE' and m.tipo = 'DEPOSITO' then 'DEPOSITO_AHORRO_CORRIENTE'
          when c.tipo = 'AHORRO_CORRIENTE' and m.tipo = 'RETIRO' then 'RETIRO_AHORRO_CORRIENTE'
          when c.tipo = 'AHORRO_PROGRAMADO' and m.tipo = 'DEPOSITO' then 'DEPOSITO_AHORRO_PROGRAMADO'
          when c.tipo = 'AHORRO_PROGRAMADO' and m.tipo = 'RETIRO' then 'RETIRO_AHORRO_PROGRAMADO'
          when c.tipo = 'AHORRO_INFANTO_JUVENIL' and m.tipo = 'DEPOSITO' then 'DEPOSITO_AHORRO_INFANTO_JUVENIL'
          when c.tipo = 'AHORRO_INFANTO_JUVENIL' and m.tipo = 'RETIRO' then 'RETIRO_AHORRO_INFANTO_JUVENIL'
          when c.tipo = 'AHORRO_SOBRE_PRESTAMO' and m.tipo = 'DEPOSITO' then 'DEPOSITO_AHORRO_SOBRE_PRESTAMO'
          when c.tipo = 'AHORRO_SOBRE_PRESTAMO' and m.tipo = 'RETIRO' then 'RETIRO_AHORRO_SOBRE_PRESTAMO'
          when c.tipo = 'AHORRO_PLAZO_FIJO' and m.tipo = 'DEPOSITO' then 'DEPOSITO_PLAZO_FIJO'
          when c.tipo = 'AHORRO_PLAZO_FIJO' and m.tipo = 'RETIRO' then 'RETIRO_PLAZO_FIJO'
          else 'INGRESO_VARIO'
        end as categoria,
        case when m.tipo = 'DEPOSITO' or c.tipo = 'APORTACION' then 'INGRESO' else 'EGRESO' end as flujo,
        m.monto as monto
      from movimientos m
      join cuentas c on c.id = m.cuenta_id
      where m.fecha >= ${fechaInicioSql} and m.fecha <= current_date + interval '1 day' ${filtroAgenciaCuentas}
        and not exists (select 1 from caja_movimientos_auxiliar cma where cma.movimiento_id = m.id)

      union all

      -- 4. Préstamos Colocados
      select 
        coalesce(p.fecha_aprobacion, p.created_at::date) as fecha,
        'COLOCACION_PRESTAMO' as categoria,
        'EGRESO' as flujo,
        p.monto_aprobado as monto
      from prestamos p
      where coalesce(p.fecha_aprobacion, p.created_at::date) >= ${fechaInicioSql}
        and coalesce(p.fecha_aprobacion, p.created_at::date) <= current_date + interval '1 day'
        ${filtroAgenciaPrestamos}

      union all

      -- 5. Gastos y Comprobantes de Caja Chica
      select
        cc.fecha::date as fecha,
        coalesce('CAJA_CHICA_' || cc.categoria::text, 'CAJA_CHICA_GASTO') as categoria,
        case when cc.tipo = 'INGRESO' then 'INGRESO' else 'EGRESO' end as flujo,
        cc.monto as monto
      from caja_chica_comprobantes cc
      where cc.fecha >= ${fechaInicioSql}
        and cc.fecha <= current_date + interval '1 day'
        ${filtroAgenciaCajaChica}
    )
    select 
      categoria, 
      flujo, 
      count(*)::int as cantidad, 
      sum(monto)::numeric(14,2) as total_monto
    from ops
    group by categoria, flujo
    order by cantidad desc;
  `;

  const queryTendencia = `
    with ops as (
      select 
        d.fecha::date as fecha,
        case when m.tipo = 'INGRESO' then 'INGRESO' else 'EGRESO' end as flujo,
        m.monto as monto
      from caja_movimientos_auxiliar m
      join caja_dias d on d.id = m.caja_dia_id
      where d.fecha >= ${fechaInicioSql} and d.fecha <= current_date + interval '1 day' ${filtroAgenciaAux}

      union all

      select
        c.created_at::date as fecha,
        'INGRESO' as flujo,
        c.saldo_inicial as monto
      from cuentas c
      where c.saldo_inicial > 0
        and c.created_at::date >= ${fechaInicioSql}
        and c.created_at::date <= current_date + interval '1 day'
        ${filtroAgenciaCuentas}

      union all

      select 
        m.fecha::date as fecha,
        case when m.tipo = 'DEPOSITO' or c.tipo = 'APORTACION' then 'INGRESO' else 'EGRESO' end as flujo,
        m.monto as monto
      from movimientos m
      join cuentas c on c.id = m.cuenta_id
      where m.fecha >= ${fechaInicioSql} and m.fecha <= current_date + interval '1 day' ${filtroAgenciaCuentas}
        and not exists (select 1 from caja_movimientos_auxiliar cma where cma.movimiento_id = m.id)

      union all

      select 
        coalesce(p.fecha_aprobacion, p.created_at::date) as fecha,
        'EGRESO' as flujo,
        p.monto_aprobado as monto
      from prestamos p
      where coalesce(p.fecha_aprobacion, p.created_at::date) >= ${fechaInicioSql}
        and coalesce(p.fecha_aprobacion, p.created_at::date) <= current_date + interval '1 day'
        ${filtroAgenciaPrestamos}

      union all

      select
        cc.fecha::date as fecha,
        case when cc.tipo = 'INGRESO' then 'INGRESO' else 'EGRESO' end as flujo,
        cc.monto as monto
      from caja_chica_comprobantes cc
      where cc.fecha >= ${fechaInicioSql}
        and cc.fecha <= current_date + interval '1 day'
        ${filtroAgenciaCajaChica}
    )
    select 
      fecha::text as fecha,
      sum(case when flujo = 'INGRESO' then monto else 0 end)::numeric(14,2) as ingresos,
      sum(case when flujo = 'EGRESO' then monto else 0 end)::numeric(14,2) as egresos,
      (sum(case when flujo = 'INGRESO' then monto else 0 end) - sum(case when flujo = 'EGRESO' then monto else 0 end))::numeric(14,2) as neto,
      count(*)::int as operaciones
    from ops
    group by fecha
    order by fecha asc;
  `;

  const [{ rows }, { rows: rowsTendencia }] = await Promise.all([
    pool.query(query, params),
    pool.query(queryTendencia, params),
  ]);

  const GRUPOS: Record<string, { label: string; icon: string; producto: string }> = {
    // 🏦 Agente BI
    SERVICIOS_BI: { label: "Pago de Servicios (Agente BI)", icon: "💡", producto: "AGENTE_BI" },
    DEPOSITO_BI: { label: "Depósitos Agente BI", icon: "📥", producto: "AGENTE_BI" },
    RETIRO_BI: { label: "Retiros Agente BI", icon: "📤", producto: "AGENTE_BI" },
    REMESA_BI: { label: "Cobro de Remesas BI", icon: "💵", producto: "AGENTE_BI" },

    // 💼 Créditos
    ABONO_PRESTAMO_HIPOTECARIO: { label: "Abono Capital Crédito Hipotecario", icon: "🏠", producto: "CREDITOS" },
    INTERES_PRESTAMO_HIPOTECARIO: { label: "Interés Crédito Hipotecario", icon: "📊", producto: "CREDITOS" },
    MORA_PRESTAMO_HIPOTECARIO: { label: "Mora Crédito Hipotecario", icon: "⚠️", producto: "CREDITOS" },
    ABONO_PRESTAMO_FIDUCIARIO: { label: "Abono Capital Crédito Fiduciario", icon: "🤝", producto: "CREDITOS" },
    INTERES_PRESTAMO_FIDUCIARIO: { label: "Interés Crédito Fiduciario", icon: "📈", producto: "CREDITOS" },
    MORA_PRESTAMO_FIDUCIARIO: { label: "Mora Crédito Fiduciario", icon: "⚠️", producto: "CREDITOS" },
    COLOCACION_PRESTAMO: { label: "Desembolso de Préstamo", icon: "💼", producto: "CREDITOS" },

    // 💰 Ahorro Corriente
    DEPOSITO_AHORRO_CORRIENTE: { label: "Depósito Ahorro Corriente", icon: "💰", producto: "AHORRO_CORRIENTE" },
    RETIRO_AHORRO_CORRIENTE: { label: "Retiro Ahorro Corriente", icon: "💸", producto: "AHORRO_CORRIENTE" },

    // 📅 Ahorro Programado
    DEPOSITO_AHORRO_PROGRAMADO: { label: "Depósito Ahorro Programado", icon: "📅", producto: "AHORRO_PROGRAMADO" },
    RETIRO_AHORRO_PROGRAMADO: { label: "Retiro Ahorro Programado", icon: "📅", producto: "AHORRO_PROGRAMADO" },

    // 🧒 Ahorro Infantil
    DEPOSITO_AHORRO_INFANTO_JUVENIL: { label: "Depósito Ahorro Infantil", icon: "🧒", producto: "AHORRO_INFANTIL" },
    RETIRO_AHORRO_INFANTO_JUVENIL: { label: "Retiro Ahorro Infantil", icon: "🧒", producto: "AHORRO_INFANTIL" },

    // 🛡️ Ahorro sobre Préstamo
    DEPOSITO_AHORRO_SOBRE_PRESTAMO: { label: "Depósito Ahorro sobre Préstamo", icon: "🛡️", producto: "AHORRO_SOBRE_PRESTAMO" },
    RETIRO_AHORRO_SOBRE_PRESTAMO: { label: "Retiro Ahorro sobre Préstamo", icon: "🛡️", producto: "AHORRO_SOBRE_PRESTAMO" },

    // 🔒 Plazo Fijo
    DEPOSITO_PLAZO_FIJO: { label: "Apertura Certificado Plazo Fijo", icon: "🔒", producto: "PLAZO_FIJO" },
    RETIRO_PLAZO_FIJO: { label: "Liquidación Certificado Plazo Fijo", icon: "📦", producto: "PLAZO_FIJO" },

    // 🏛️ Aportaciones
    APORTACION: { label: "Aportación de Capital Social", icon: "🏛️", producto: "APORTACIONES" },

    // 💵 Ventanilla & Tesorería
    INGRESO_ASOCIADO: { label: "Cuota de Ingreso / Inscripción", icon: "📝", producto: "VENTANILLA_TESORERIA" },
    COMISION: { label: "Comisiones por Servicios", icon: "🏷️", producto: "VENTANILLA_TESORERIA" },
    INGRESO_VARIO: { label: "Ingresos Varios de Ventanilla", icon: "➕", producto: "VENTANILLA_TESORERIA" },
    EGRESO_VARIO: { label: "Egresos Varios de Ventanilla", icon: "➖", producto: "VENTANILLA_TESORERIA" },
    TRASLADO_FONDOS: { label: "Traslado de Fondos a Banco / Bóveda", icon: "🚚", producto: "VENTANILLA_TESORERIA" },
    REPOSICION_FONDO: { label: "Reposición de Fondo Caja Chica", icon: "📥", producto: "CAJA_CHICA" },

    // ☕ Caja Chica
    CAJA_CHICA_SUMINISTROS_OFICINA: { label: "Papelería y Suministros (C.Chica)", icon: "📎", producto: "CAJA_CHICA" },
    CAJA_CHICA_CAFETERIA_LIMPIEZA: { label: "Cafetería y Limpieza (C.Chica)", icon: "☕", producto: "CAJA_CHICA" },
    CAJA_CHICA_COMBUSTIBLES_LUBRICANTES: { label: "Combustibles y Movilización (C.Chica)", icon: "⛽", producto: "CAJA_CHICA" },
    CAJA_CHICA_COMISIONES_GASTOS: { label: "Comisiones y Gastos Bancarios (C.Chica)", icon: "🧾", producto: "CAJA_CHICA" },
    CAJA_CHICA_TELEFONO: { label: "Servicio de Telefonía (C.Chica)", icon: "📞", producto: "CAJA_CHICA" },
    CAJA_CHICA_INTERNET: { label: "Servicio de Internet (C.Chica)", icon: "🌐", producto: "CAJA_CHICA" },
    CAJA_CHICA_ENERGIA_ELECTRICA: { label: "Energía Eléctrica (C.Chica)", icon: "⚡", producto: "CAJA_CHICA" },
    CAJA_CHICA_GASTOS_DIVERSOS: { label: "Gastos Diversos (C.Chica)", icon: "📦", producto: "CAJA_CHICA" },
    CAJA_CHICA_REPARACION_MANTENIMIENTO: { label: "Mantenimiento y Reparación (C.Chica)", icon: "🔧", producto: "CAJA_CHICA" },
    CAJA_CHICA_FLETES_ACARREO: { label: "Fletes y Acarreos (C.Chica)", icon: "🚚", producto: "CAJA_CHICA" },
    CAJA_CHICA_PROYECCION_SOCIAL: { label: "Proyección Social (C.Chica)", icon: "🤝", producto: "CAJA_CHICA" },
    CAJA_CHICA_OTRO: { label: "Otros Gastos Operativos (C.Chica)", icon: "📋", producto: "CAJA_CHICA" },
    CAJA_CHICA_GASTO: { label: "Gastos Generales de Caja Chica", icon: "☕", producto: "CAJA_CHICA" },
  };

  const totalOperaciones = rows.reduce((acc, r) => acc + Number(r.cantidad), 0);
  const volumenTotal = rows.reduce((acc, r) => acc + Number(r.total_monto), 0);

  let totalIngresos = 0;
  let totalEgresos = 0;
  let operacionesIngreso = 0;
  let operacionesEgreso = 0;

  const servicios = rows.map((r) => {
    const info = GRUPOS[r.categoria] ?? { 
      label: r.categoria.replace(/_/g, " "), 
      icon: r.flujo === "INGRESO" ? "📥" : "📤", 
      producto: "VENTANILLA_TESORERIA" 
    };
    const cant = Number(r.cantidad);
    const monto = Number(r.total_monto);
    const flujo = (r.flujo === "INGRESO" ? "INGRESO" : "EGRESO") as "INGRESO" | "EGRESO";

    if (flujo === "INGRESO") {
      totalIngresos += monto;
      operacionesIngreso += cant;
    } else {
      totalEgresos += monto;
      operacionesEgreso += cant;
    }

    const pct = totalOperaciones > 0 ? Math.round((cant / totalOperaciones) * 1000) / 10 : 0;
    return {
      categoria: r.categoria,
      producto: info.producto,
      modulo: info.producto,
      flujo,
      label: info.label,
      icon: info.icon,
      cantidad: cant,
      totalMonto: monto,
      porcentaje: pct,
    };
  });

  const tendenciaTemporal = rowsTendencia.map((t) => ({
    fecha: t.fecha,
    label: t.fecha.slice(5), // MM-DD
    ingresos: Number(t.ingresos),
    egresos: Number(t.egresos),
    neto: Number(t.neto),
    operaciones: Number(t.operaciones),
  }));

  return {
    periodo,
    totalOperaciones,
    volumenTotal,
    totalIngresos,
    totalEgresos,
    flujoNeto: totalIngresos - totalEgresos,
    operacionesIngreso,
    operacionesEgreso,
    servicioTop: servicios[0] ?? null,
    servicios,
    tendenciaTemporal,
  };
}

export async function arqueosMensuales(
  agenciaId: string | null | undefined,
  agenciaVisible: string | null,
  mes?: string,
) {
  let targetAgencia = agenciaVisible || agenciaId;
  if (!targetAgencia) {
    const { rows: ags } = await pool.query("select id from agencias limit 1");
    targetAgencia = ags[0]?.id;
  }
  if (!targetAgencia) throw badRequest("No hay agencias configuradas");
  checarAgencia(targetAgencia, agenciaVisible);

  const mesParam = mes && /^\d{4}-\d{2}$/.test(mes) ? mes : hoyISO().slice(0, 7);

  const { rows } = await pool.query(
    `select d.*,
       u_abrio.nombre as abierto_por_nombre,
       u_cerro.nombre as cerrado_por_nombre,
       (select count(*) from caja_movimientos_auxiliar m where m.caja_dia_id = d.id)::int as total_movimientos,
       coalesce((select sum(monto) from caja_movimientos_auxiliar m where m.caja_dia_id = d.id and m.tipo = 'INGRESO'), 0)::numeric(14,2) as total_ingresos,
       coalesce((select sum(monto) from caja_movimientos_auxiliar m where m.caja_dia_id = d.id and m.tipo = 'EGRESO'), 0)::numeric(14,2) as total_egresos,
       a.total_contado,
       a.diferencia,
       a.detalle as arqueo_detalle
     from caja_dias d
     left join usuarios u_abrio on u_abrio.id = d.abierto_por
     left join usuarios u_cerro on u_cerro.id = d.cerrado_por
     left join caja_arqueos a on a.caja_dia_id = d.id
     where d.agencia_id = $1 and to_char(d.fecha, 'YYYY-MM') = $2
     order by d.fecha desc`,
    [targetAgencia, mesParam],
  );

  let totalDiasOperados = rows.length;
  let diasCuadrados = 0;
  let diasConDiferencia = 0;
  let totalSobrante = 0;
  let totalFaltante = 0;
  let totalMovimientosMes = 0;
  let totalIngresosMes = 0;
  let totalEgresosMes = 0;

  for (const r of rows) {
    totalMovimientosMes += Number(r.total_movimientos || 0);
    totalIngresosMes += Number(r.total_ingresos || 0);
    totalEgresosMes += Number(r.total_egresos || 0);

    const dif = Number(r.diferencia || 0);
    if (dif === 0) {
      diasCuadrados++;
    } else {
      diasConDiferencia++;
      if (dif > 0) totalSobrante += dif;
      else totalFaltante += Math.abs(dif);
    }
  }

  return {
    mes: mesParam,
    resumen: {
      totalDiasOperados,
      diasCuadrados,
      diasConDiferencia,
      totalSobrante,
      totalFaltante,
      totalMovimientosMes,
      totalIngresosMes,
      totalEgresosMes,
    },
    dias: rows,
  };
}



export interface DatosEdicionAuxiliar {
  seccion?: string;
  categoria?: CajaCategoria;
  tipo?: "INGRESO" | "EGRESO";
  monto?: number;
  referencia?: string;
  descripcion?: string;
}

export async function editar(id: string, data: DatosEdicionAuxiliar, usuarioId: string, motivo: string) {
  const { rows: anteriores } = await pool.query(
    "select * from caja_movimientos_auxiliar where id = $1",
    [id]
  );
  if (!anteriores[0]) throw notFound("El movimiento no existe");
  const ant = anteriores[0];

  const { rows } = await pool.query(
    `update caja_movimientos_auxiliar
     set seccion = coalesce($1, seccion),
         categoria = coalesce($2, categoria),
         tipo = coalesce($3, tipo),
         monto = coalesce($4, monto),
         referencia = coalesce($5, referencia),
         descripcion = coalesce($6, descripcion)
     where id = $7
     returning *`,
    [
      data.seccion,
      data.categoria,
      data.tipo,
      data.monto,
      data.referencia,
      data.descripcion,
      id
    ]
  );

  const mov = rows[0];
  await registrarAuditoria({
    entidad: "CajaMovimientoAuxiliar",
    entidadId: id,
    accion: "ACTUALIZAR",
    usuarioId,
    datosAnteriores: ant,
    datosNuevos: mov,
    motivo
  });
  return mov;
}

// ---------------------------------------------------------------------------
// Liquidación de Promotores
// ---------------------------------------------------------------------------

export async function listarLiquidacionesPendientes(agenciaId: string, agenciaVisible: string | null) {
  checarAgencia(agenciaId, agenciaVisible);
  const { rows } = await pool.query(
    `
    select 
      u.id as promotor_id,
      u.nombre as promotor_nombre,
      count(c.id)::int as cantidad_recibos,
      sum(c.monto)::numeric as total_efectivo,
      json_agg(
        json_build_object(
          'id', c.id,
          'socio_nombres', s.nombres,
          'prestamo_codigo', p.codigo,
          'fecha', c.fecha,
          'numero_recibo_fisico', c.numero_recibo_fisico,
          'monto', c.monto,
          'justificacion_edicion', c.justificacion_edicion,
          'veces_editado', c.veces_editado
        ) order by c.created_at asc
      ) as cobros
    from cobros_campo c
    join usuarios u on u.id = c.promotor_id
    join socios s on s.id = c.socio_id
    join prestamos p on p.id = c.prestamo_id
    where c.agencia_id = $1 and c.estado = 'PENDIENTE'
    group by u.id, u.nombre
    `, [agenciaId]
  );
  return rows;
}

export async function aprobarLiquidacion(agenciaId: string, promotorId: string, usuarioId: string) {
  // 1. Get current OPEN caja_dia for this agency
  const { rows: diaRows } = await pool.query(`select id from caja_dias where agencia_id = $1 and estado = 'ABIERTO'`, [agenciaId]);
  if (diaRows.length === 0) throw badRequest("No hay caja abierta para procesar liquidaciones.");
  const diaId = diaRows[0].id;

  // 2. Get pending cobros for this promoter
  const { rows: cobros } = await pool.query(`
    select c.*
    from cobros_campo c
    where c.promotor_id = $1 and c.agencia_id = $2 and c.estado = 'PENDIENTE'
    order by c.created_at asc
  `, [promotorId, agenciaId]);

  if (cobros.length === 0) throw badRequest("Este promotor no tiene cobros pendientes de liquidar.");

  let procesados = 0;
  // 3. Process each cobro sequentially
  for (const cobro of cobros) {
    const { rows: prestamoInfoRows } = await pool.query(`select * from prestamos where id = $1`, [cobro.prestamo_id]);
    const prestamo = prestamoInfoRows[0];
    const { rows: pagosRows } = await pool.query(`select * from prestamo_pagos where prestamo_id = $1 order by fecha desc, created_at desc`, [cobro.prestamo_id]);
    
    const fechaUltimoPago = pagosRows.length > 0 ? pagosRows[0].fecha : prestamo.fecha_desembolso;
    const liquidacion = calcularLiquidacionCredito({
      saldoCapital: Number(prestamo.saldo_capital || prestamo.monto_aprobado),
      tasaInteresMensual: Number(prestamo.tasa_interes_mensual),
      plazoMeses: prestamo.plazo_meses,
      montoOriginal: Number(prestamo.monto_aprobado),
      cuotaMensualEstimada: Number(prestamo.cuota_mensual),
      fechaUltimoPago,
      tipoAmortizacion: prestamo.tipo_amortizacion,
    });

    // Usamos EXACTAMENTE el desglose ingresado por el promotor en campo.
    const mov = await cobrarCuotaCredito(
      diaId,
      {
        prestamoId: cobro.prestamo_id,
        socioId: cobro.socio_id,
        abonoCapital: Number(cobro.pago_capital),
        interes: Number(cobro.pago_interes),
        mora: Number(cobro.pago_mora),
        ahorroSobrePrestamo: Number(cobro.ahorro_prestamo),
        origenFondos: prestamo.origen_fondos || "FONDOS_PROPIOS",
        docNo: cobro.numero_recibo_fisico, // Usar el número de recibo físico que digitó el promotor
      },
      usuarioId,
      agenciaId,
    );

    // Marcar como liquidado, enlazando los IDs
    await pool.query(`
      update cobros_campo 
      set estado = 'LIQUIDADO', liquidado_at = now(), caja_dia_id = $1, caja_movimiento_id = $2
      where id = $3
    `, [diaId, mov.cajaMovimiento.id, cobro.id]);

    procesados++;
  }

  return { ok: true, procesados, mensaje: `Se liquidaron exitosamente ${procesados} cobros.` };
}

export async function reporteMovimientos(
  agenciaId: string,
  agenciaVisible: string | null,
  fechaInicio?: string,
  fechaFin?: string,
) {
  checarAgencia(agenciaId, agenciaVisible);

  const fInicio = fechaInicio || hoyISO();
  const fFin = fechaFin || hoyISO();

  const { rows: agenciaRows } = await pool.query(`select * from agencias where id = $1`, [agenciaId]);
  const agencia = agenciaRows[0];

  const { rows: movimientos } = await pool.query(
    `select m.*, u.nombre as usuario_nombre, u.rol as usuario_rol, d.fecha as dia_fecha, d.saldo_inicial as dia_saldo_inicial
     from caja_movimientos_auxiliar m
     join caja_dias d on d.id = m.caja_dia_id
     join usuarios u on u.id = m.usuario_id
     where m.agencia_id = $1 and d.fecha >= $2 and d.fecha <= $3
     order by d.fecha asc, m.created_at asc`,
    [agenciaId, fInicio, fFin],
  );

  // Obtener saldo inicial del primer día en rango
  const { rows: primerDiaRows } = await pool.query(
    `select saldo_inicial from caja_dias where agencia_id = $1 and fecha >= $2 and fecha <= $3 order by fecha asc limit 1`,
    [agenciaId, fInicio, fFin],
  );
  const saldoInicial = primerDiaRows[0] ? Number(primerDiaRows[0].saldo_inicial) : 0;

  const totalIngreso = movimientos.filter((m) => m.tipo === "INGRESO").reduce((acc, m) => acc + Number(m.monto), 0);
  const totalEgreso = movimientos.filter((m) => m.tipo === "EGRESO").reduce((acc, m) => acc + Number(m.monto), 0);
  const saldoFinal = saldoInicial + totalIngreso - totalEgreso;

  // Desglose por fuente
  const desgloseFuentes: Record<string, { cobros: number; colocacion: number; total: number; ops: number }> = {
    FONDOS_PROPIOS: { cobros: 0, colocacion: 0, total: 0, ops: 0 },
    FEDERURAL: { cobros: 0, colocacion: 0, total: 0, ops: 0 },
    CHN_GUATEMALA: { cobros: 0, colocacion: 0, total: 0, ops: 0 },
  };

  for (const m of movimientos) {
    let f = m.origen_fondos || "FONDOS_PROPIOS";
    if (!desgloseFuentes[f]) f = "FONDOS_PROPIOS";
    const monto = Number(m.monto);
    desgloseFuentes[f].ops += 1;
    if (m.tipo === "INGRESO") {
      desgloseFuentes[f].cobros += monto;
      desgloseFuentes[f].total += monto;
    } else {
      desgloseFuentes[f].colocacion += monto;
      desgloseFuentes[f].total -= monto;
    }
  }

  return {
    agencia,
    fechaInicio: fInicio,
    fechaFin: fFin,
    saldoInicial,
    totalIngreso,
    totalEgreso,
    saldoFinal,
    movimientos,
    desgloseFuentes,
  };
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

const isLocal =
  !process.env.DATABASE_URL ||
  process.env.DATABASE_URL.includes("localhost") ||
  process.env.DATABASE_URL.includes("127.0.0.1");

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: isLocal ? false : { rejectUnauthorized: false },
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
     values ('Administrador MIF', $1, $2, 'GERENCIA', null)
     on conflict (email) do update set password_hash = excluded.password_hash, rol = 'GERENCIA'`,
    [email, passwordHash],
  );

  const promotorEmail = "promotor@mif.coop";
  const promotorHash = await hashPassword(passwordTemporal);

  await pool.query(
    `insert into usuarios (nombre, email, password_hash, rol, agencia_id)
     values ('Carlos Promotor Chajul', $1, $2, 'PROMOTOR', $3)
     on conflict (email) do update set password_hash = excluded.password_hash`,
    [promotorEmail, promotorHash, agencia.id],
  );

  const supervisorEmail = "supervisor@mif.coop";
  const supervisorHash = await hashPassword(passwordTemporal);

  await pool.query(
    `insert into usuarios (nombre, email, password_hash, rol, agencia_id)
     values ('Marta Supervisora Chajul', $1, $2, 'SUPERVISOR', $3)
     on conflict (email) do update set password_hash = excluded.password_hash`,
    [supervisorEmail, supervisorHash, agencia.id],
  );

  const cajeroEmail = "cajero@mif.coop";
  const cajeroHash = await hashPassword(passwordTemporal);

  await pool.query(
    `insert into usuarios (nombre, email, password_hash, rol, agencia_id)
     values ('Ana Cajera Chajul', $1, $2, 'CAJERO', $3)
     on conflict (email) do update set password_hash = excluded.password_hash`,
    [cajeroEmail, cajeroHash, agencia.id],
  );

  const cajaChicaEmail = "cajachica@mif.coop";
  const cajaChicaHash = await hashPassword(passwordTemporal);

  await pool.query(
    `insert into usuarios (nombre, email, password_hash, rol, agencia_id)
     values ('Lucia Caja Chica Chajul', $1, $2, 'CAJA_CHICA', $3)
     on conflict (email) do update set password_hash = excluded.password_hash`,
    [cajaChicaEmail, cajaChicaHash, agencia.id],
  );

  console.log("Usuarios listos:");
  console.log(`  Gerencia:    ${email}`);
  console.log(`  Supervisor:  ${supervisorEmail}`);
  console.log(`  Cajero:      ${cajeroEmail}`);
  console.log(`  Caja Chica:  ${cajaChicaEmail}`);
  console.log(`  Promotor:    ${promotorEmail}`);
  console.log(`  Contraseña para todos: ${passwordTemporal}`);

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

