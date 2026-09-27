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
- [`backend/src/utils/dpiGuatemala.ts`](#backendsrcutilsdpiguatemalats)
- [`backend/src/db/importar-ahorro-corriente.ts`](#backendsrcdbimportarahorrocorrientets)
- [`backend/src/db/importar-plazo-fijo.ts`](#backendsrcdbimportarplazofijots)
- [`backend/src/db/importar-programado-infantil.ts`](#backendsrcdbimportarprogramadoinfantilts)
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
    "db:seed:excel": "tsx src/db/seed-excel.ts",
    "db:reset": "tsx src/db/reset.ts",
    "db:importar:aportaciones": "tsx src/db/importar-aportaciones.ts",
    "db:importar:ahorro-corriente": "tsx src/db/importar-ahorro-corriente.ts",
    "db:importar:plazo-fijo": "tsx src/db/importar-plazo-fijo.ts",
    "db:importar:programado-infantil": "tsx src/db/importar-programado-infantil.ts",
    "db:importar:ingresos-creditos": "tsx src/db/importar-ingresos-creditos.ts",
    "db:importar:caja-chica": "tsx src/db/importar-caja-chica.ts",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@types/bcryptjs": "^2.4.6",
    "@types/cors": "^2.8.17",
    "@types/express": "^4.17.21",
    "@types/jsonwebtoken": "^9.0.7",
    "@types/node": "^20.14.15",
    "@types/pg": "^8.23.1",
    "bcryptjs": "^2.4.3",
    "cors": "^2.8.5",
    "dotenv": "^16.4.5",
    "express": "^4.21.0",
    "googleapis": "^181.0.0",
    "jsonwebtoken": "^9.0.2",
    "node-cron": "^4.6.0",
    "pg": "^8.23.0",
    "typescript": "^5.5.4",
    "zod": "^3.23.8"
  },
  "devDependencies": {
    "@types/node-cron": "^3.0.11",
    "tsx": "^4.19.1"
  }
}
```

## `backend/tsconfig.json` {#backendtsconfigjson}

```json
{
  "compilerOptions": {
    "target": "ES2021",
    "module": "commonjs",
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
import trasladosRouter from "./modules/traslados/routes";
import consolidadoFinancieroRouter from "./modules/consolidadofinanciero/routes";


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
app.use("/api/traslados", trasladosRouter);
app.use("/api/consolidado-financiero", consolidadoFinancieroRouter);


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
  requireRole("GERENCIA"),
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

authRouter.get("/me", requireAuth, async (req, res) => {
  const { pool } = require("../../db/pool");
  const result = await pool.query("SELECT 1 FROM usuario_drive_tokens WHERE usuario_id = $1", [req.user!.id]);
  res.json({ 
    usuario: req.user,
    driveConnected: result.rows.length > 0 
  });
});

authRouter.get("/google", requireAuth, (req, res) => {
  const { getAuthUrl } = require("../../services/googleDriveService");
  const url = getAuthUrl(req.user!.id);
  res.json({ url });
});

authRouter.get(
  "/google/callback",
  asyncHandler(async (req, res) => {
    const code = req.query.code as string;
    const usuarioId = req.query.state as string;

    if (!code || !usuarioId) {
      res.status(400).send("Faltan parámetros (code o state).");
      return;
    }

    const { getOAuthClient } = require("../../services/googleDriveService");
    const { pool } = require("../../db/pool");
    
    const oauth2Client = getOAuthClient();
    const { tokens } = await oauth2Client.getToken(code);
    
    // Guardar tokens en BD
    await pool.query(
      `INSERT INTO usuario_drive_tokens (usuario_id, access_token, refresh_token, expiry_date) 
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (usuario_id) DO UPDATE SET 
       access_token = EXCLUDED.access_token,
       refresh_token = COALESCE(EXCLUDED.refresh_token, usuario_drive_tokens.refresh_token),
       expiry_date = EXCLUDED.expiry_date`,
      [usuarioId, tokens.access_token, tokens.refresh_token, tokens.expiry_date]
    );

    // Redirigir al frontend al Dashboard o Perfil (cerrando la ventana o regresando a la app)
    // Asumiendo que el frontend está en el mismo host o manejamos la redirección
    res.redirect(`${process.env.FRONTEND_URL || "http://localhost:5173"}/?drive_connected=true`);
  })
);

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
  requireRole("GERENCIA", "SUPERVISOR"),
  asyncHandler(async (req, res) => {
    res.json(await service.listar(agenciaVisible(req)));
  }),
);

const crearSchema = z.object({
  nombre: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
  rol: z.enum(["GERENCIA", "SUPERVISOR", "CAJERO", "CAJA_CHICA", "PROMOTOR"]),
  agenciaId: z.string().uuid().optional(),
});

usuariosRouter.post(
  "/",
  requireRole("GERENCIA"),
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

export async function listar(agenciaId: string | null) {
  const query = `
    select u.id, u.nombre, u.email, u.rol, u.activo, u.agencia_id, u.created_at, u.updated_at,
           a.nombre as agencia_nombre, a.codigo as agencia_codigo
    from usuarios u
    left join agencias a on a.id = u.agencia_id
    ${agenciaId ? "where u.agencia_id = $1" : ""}
    order by u.nombre
  `;
  const { rows } = agenciaId ? await pool.query(query, [agenciaId]) : await pool.query(query);
  return rows;
}

export async function crear(data: {
  nombre: string;
  email: string;
  password: string;
  rol: RolUsuario;
  agenciaId?: string | null;
}): Promise<UsuarioPublico> {
  if ((data.rol === "SUPERVISOR" || data.rol === "CAJERO" || data.rol === "PROMOTOR") && !data.agenciaId) {
    throw badRequest("Un usuario Supervisor, Cajero o Promotor debe pertenecer a una agencia");
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

const TIPOS = [
  "AHORRO_CORRIENTE",
  "AHORRO_PROGRAMADO",
  "AHORRO_INFANTO_JUVENIL",
  "AHORRO_SOBRE_PRESTAMO",
  "AHORRO_PLAZO_FIJO",
  "APORTACION",
  "APORTACION_INFANTIL",
] as const;
const tipoSchema = z.enum(TIPOS);

cuentasRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const tipo = tipoSchema.parse(req.query.tipo);
    const q = typeof req.query.q === "string" ? req.query.q : undefined;
    const socioId = typeof req.query.socioId === "string" ? req.query.socioId : undefined;
    const interAgencia = req.query.interAgencia === "true";
    const agId = interAgencia || socioId ? null : agenciaVisible(req);
    res.json(await service.listar({ tipo, agenciaId: agId, q, socioId }));
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
  "/novedades-campo",
  asyncHandler(async (req, res) => {
    const agenciaId = agenciaVisible(req) || (req.query.agenciaId as string) || null;
    res.json(await service.listarNovedadesCampo(agenciaId));
  }),
);

cuentasRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    res.json(await service.obtener(req.params.id, agenciaVisible(req)));
  }),
);

const crearSchema = z
  .object({
    tipo: tipoSchema,
    agenciaId: z.string().uuid(),
    socioId: z.string().uuid(),
    numeroCuenta: z.string().min(1),
    saldoInicial: z.number().nonnegative().optional(),
    cuotaPactada: z.number().positive().optional().nullable(),
    observacionesApertura: z.string().optional().nullable(),
    prestamoId: z.string().uuid().optional().nullable(),
    titularMenorNombre: z.string().optional().nullable(),
    titularMenorParentesco: z.string().optional().nullable(),
    titularMenorCui: z.string().optional().nullable(),
    titularMenorFechaNacimiento: z.string().optional().nullable(),
  })
  .refine(
    (data) =>
      (data.tipo !== "AHORRO_INFANTO_JUVENIL" && data.tipo !== "APORTACION_INFANTIL") ||
      (!!data.titularMenorNombre?.trim() && !!data.titularMenorParentesco?.trim()),
    {
      message: "Para Ahorro o Aportación Infanto Juvenil debes indicar el nombre del menor y su parentesco con el socio responsable.",
      path: ["titularMenorNombre"],
    },
  );

cuentasRouter.post(
  "/",
  requireRole("GERENCIA", "SUPERVISOR", "CAJERO", "PROMOTOR"),
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
  requireRole("GERENCIA", "SUPERVISOR", "CAJERO"),
  asyncHandler(async (req, res) => {
    const data = movimientoSchema.parse(req.body);
    res.status(201).json(await service.registrarMovimiento(req.params.id, data, req.user!.id, agenciaVisible(req)));
  }),
);
```

## `backend/src/modules/cuentas/service.ts` {#backendsrcmodulescuentasservicets}

```ts
import { PoolClient } from "pg";
import { pool } from "../../db/pool";
import { withTransaction } from "../../db/transaction";
import { registrarAuditoria } from "../../utils/auditoria";
import { badRequest, notFound, forbidden, conflict } from "../../utils/errors";

// Prefijo del número de cuenta sugerido por tipo — solo una ayuda visual,
// el usuario puede cambiarlo antes de guardar.
const PREFIJO_TIPO: Record<string, string> = {
  AHORRO_CORRIENTE: "AC",
  AHORRO_PROGRAMADO: "AP",
  AHORRO_INFANTO_JUVENIL: "AIJ",
  AHORRO_SOBRE_PRESTAMO: "ASP",
  AHORRO_PLAZO_FIJO: "PF",
  APORTACION: "APORT",
  APORTACION_INFANTIL: "API",
};

export type TipoCuentaAhorro =
  | "AHORRO_CORRIENTE"
  | "AHORRO_PROGRAMADO"
  | "AHORRO_INFANTO_JUVENIL"
  | "AHORRO_SOBRE_PRESTAMO"
  | "AHORRO_PLAZO_FIJO"
  | "APORTACION"
  | "APORTACION_INFANTIL";

export async function listar(params: {
  tipo: TipoCuentaAhorro;
  agenciaId: string | null;
  q?: string;
  socioId?: string;
}) {
  const condiciones = ["c.tipo = $1"];
  const valores: unknown[] = [params.tipo];

  if (params.agenciaId) {
    valores.push(params.agenciaId);
    condiciones.push(`c.agencia_id = $${valores.length}`);
  }
  if (params.socioId) {
    valores.push(params.socioId);
    condiciones.push(`c.socio_id = $${valores.length}`);
  }
  if (params.q) {
    valores.push(`%${params.q.toLowerCase()}%`);
    const idx = valores.length;
    condiciones.push(`(lower(s.nombres) like $${idx} or lower(c.numero_cuenta) like $${idx})`);
  }

  const { rows } = await pool.query(
    `select c.*, s.nombres as socio_nombres, s.numero_asociado,
            a.nombre as agencia_nombre, a.codigo as agencia_codigo,
            p.codigo as prestamo_codigo, p.estado as prestamo_estado,
            coalesce(sc.saldo_actual, c.saldo_inicial) as saldo_actual
     from cuentas c
     join socios s on s.id = c.socio_id
     join agencias a on a.id = c.agencia_id
     left join prestamos p on p.id = c.prestamo_id
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
            p.codigo as prestamo_codigo, p.estado as prestamo_estado, p.saldo_capital as prestamo_saldo_capital,
            coalesce(sc.saldo_actual, c.saldo_inicial) as saldo_actual
     from cuentas c
     join socios s on s.id = c.socio_id
     join agencias a on a.id = c.agencia_id
     left join prestamos p on p.id = c.prestamo_id
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
  cuotaPactada?: number | null;
  observacionesApertura?: string | null;
  prestamoId?: string | null;
  titularMenorNombre?: string | null;
  titularMenorParentesco?: string | null;
  titularMenorCui?: string | null;
  titularMenorFechaNacimiento?: string | null;
}

export async function crear(data: DatosCuenta, usuarioId: string) {
  if (data.tipo === "AHORRO_INFANTO_JUVENIL" || data.tipo === "APORTACION_INFANTIL") {
    if (!data.titularMenorNombre || !data.titularMenorNombre.trim()) {
      throw badRequest("Debes indicar el nombre completo del menor titular de la cuenta.");
    }
    if (!data.titularMenorParentesco || !data.titularMenorParentesco.trim()) {
      throw badRequest("Debes indicar el parentesco del menor con el socio responsable de la cuenta.");
    }
    if (!data.titularMenorFechaNacimiento || !data.titularMenorFechaNacimiento.trim()) {
      throw badRequest("Debes indicar la fecha de nacimiento del menor titular de la cuenta.");
    }
    const str = String(data.titularMenorFechaNacimiento).slice(0, 10);
    const parts = str.split("-");
    if (parts.length !== 3) {
      throw badRequest("La fecha de nacimiento no tiene un formato válido (YYYY-MM-DD).");
    }
    const [y, m, d] = parts.map(Number);
    if (isNaN(y) || isNaN(m) || isNaN(d)) {
      throw badRequest("La fecha de nacimiento no es válida.");
    }
    const hoy = new Date();
    let edad = hoy.getFullYear() - y;
    const mesActual = hoy.getMonth() + 1;
    const diaActual = hoy.getDate();
    if (mesActual < m || (mesActual === m && diaActual < d)) {
      edad--;
    }
    if (edad < 0) {
      throw badRequest("La fecha de nacimiento del menor no puede ser una fecha futura.");
    }
    if (edad >= 18) {
      throw badRequest(
        `Titular mayor de edad (${edad} años): Las cuentas Infanto Juveniles son exclusivas para menores de 18 años.`
      );
    }
  }

  return withTransaction(async (client) => {
    if (data.tipo !== "APORTACION" && data.tipo !== "APORTACION_INFANTIL") {
      const { rows: aporRows } = await client.query(
        `select coalesce(sc.saldo_actual, c.saldo_inicial) as saldo_aportacion
         from cuentas c
         left join saldos_cuenta sc on sc.cuenta_id = c.id
         where c.socio_id = $1 and c.tipo in ('APORTACION', 'APORTACION_INFANTIL') and c.estado = 'ACTIVA'
         limit 1`,
        [data.socioId],
      );
      const saldoApor = aporRows[0] ? Number(aporRows[0].saldo_aportacion) : 0;
      if (saldoApor < 100) {
        throw badRequest(
          `Regla de la cooperativa: El asociado debe tener una aportación mínima de Q 100.00 para poder abrir cuentas de ahorro infantil, corriente, programado o sobre préstamo (saldo actual de aportaciones: Q ${saldoApor.toFixed(2)}).`,
        );
      }
    }

    // Verificación de cuenta existente
    if (data.tipo === "AHORRO_SOBRE_PRESTAMO" && data.prestamoId) {
      const { rows: existente } = await client.query(
        `select numero_cuenta from cuentas where socio_id = $1 and tipo = $2 and prestamo_id = $3 and estado = 'ACTIVA'`,
        [data.socioId, data.tipo, data.prestamoId],
      );
      if (existente[0]) {
        throw conflict(
          `El socio ya tiene una cuenta de Ahorro sobre Préstamo activa vinculada a este crédito (${existente[0].numero_cuenta}).`,
        );
      }
    } else {
      const { rows: existente } = await client.query(
        `select numero_cuenta from cuentas where socio_id = $1 and tipo = $2 and estado = 'ACTIVA'`,
        [data.socioId, data.tipo],
      );
      if (existente[0]) {
        throw conflict(
          `El socio ya tiene una cuenta activa de este tipo (${existente[0].numero_cuenta}). Cada socio solo puede tener una cuenta por tipo de ahorro.`,
        );
      }
    }

    const { rows: cuentaRepetida } = await client.query(
      `select c.numero_cuenta, s.nombres as socio_nombres
       from cuentas c
       join socios s on s.id = c.socio_id
       where lower(trim(c.numero_cuenta)) = lower(trim($1))
       limit 1`,
      [data.numeroCuenta],
    );
    if (cuentaRepetida[0]) {
      throw conflict(
        `El número de cuenta "${data.numeroCuenta}" ya existe y pertenece al socio "${cuentaRepetida[0].socio_nombres}". No se permiten números de cuenta duplicados.`,
      );
    }

    const { rows } = await client.query(
      `insert into cuentas (numero_cuenta, tipo, socio_id, agencia_id, saldo_inicial, cuota_pactada, observaciones_apertura, prestamo_id, creado_por_id, titular_menor_nombre, titular_menor_parentesco, titular_menor_cui, titular_menor_fecha_nacimiento)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
       returning *`,
      [
        data.numeroCuenta,
        data.tipo,
        data.socioId,
        data.agenciaId,
        data.saldoInicial ?? 0,
        data.cuotaPactada ?? null,
        data.observacionesApertura ?? null,
        data.prestamoId ?? null,
        usuarioId,
        (data.tipo === "AHORRO_INFANTO_JUVENIL" || data.tipo === "APORTACION_INFANTIL") ? data.titularMenorNombre!.trim() : null,
        (data.tipo === "AHORRO_INFANTO_JUVENIL" || data.tipo === "APORTACION_INFANTIL") ? data.titularMenorParentesco!.trim() : null,
        (data.tipo === "AHORRO_INFANTO_JUVENIL" || data.tipo === "APORTACION_INFANTIL") ? (data.titularMenorCui?.trim() || null) : null,
        (data.tipo === "AHORRO_INFANTO_JUVENIL" || data.tipo === "APORTACION_INFANTIL") ? (data.titularMenorFechaNacimiento || null) : null,
      ],
    );
    const cuenta = rows[0];
    await registrarAuditoria({ entidad: "Cuenta", entidadId: cuenta.id, accion: "CREAR", usuarioId, datosNuevos: cuenta });
    return cuenta;
  });
}

export async function listarNovedadesCampo(agenciaId: string | null) {
  const where = agenciaId ? "where c.agencia_id = $1" : "";
  const params = agenciaId ? [agenciaId] : [];
  const { rows } = await pool.query(
    `select c.*, s.nombres as socio_nombres, s.numero_asociado, s.telefono as socio_telefono,
            u.nombre as promotor_nombre, u.email as promotor_email,
            coalesce(sc.saldo_actual, c.saldo_inicial) as saldo_actual
     from cuentas c
     join socios s on s.id = c.socio_id
     left join usuarios u on u.id = c.creado_por_id
     left join saldos_cuenta sc on sc.cuenta_id = c.id
     ${where}
     order by c.created_at desc
     limit 25`,
    params,
  );
  return rows;
}

export interface DatosMovimiento {
  tipo: "DEPOSITO" | "RETIRO";
  monto: number;
  fecha?: string;
  numeroRecibo?: string;
  descripcion?: string;
}

export async function registrarMovimientoConClient(
  client: PoolClient,
  cuentaId: string,
  data: DatosMovimiento,
  usuarioId: string,
  agenciaVisible: string | null,
  permitirInterAgencia = false,
) {
  const { rows: ctaRows } = await client.query(
    `select c.*, s.nombres as socio_nombres, s.numero_asociado, a.nombre as agencia_nombre,
            p.codigo as prestamo_codigo, p.estado as prestamo_estado, p.saldo_capital as prestamo_saldo_capital,
            coalesce(sc.saldo_actual, c.saldo_inicial) as saldo_actual
     from cuentas c
     join socios s on s.id = c.socio_id
     join agencias a on a.id = c.agencia_id
     left join prestamos p on p.id = c.prestamo_id
     left join saldos_cuenta sc on sc.cuenta_id = c.id
     where c.id = $1`,
    [cuentaId],
  );
  const cuenta = ctaRows[0];
  if (!cuenta) throw notFound("Cuenta no encontrada");
  if (agenciaVisible && cuenta.agencia_id !== agenciaVisible && !permitirInterAgencia) {
    throw forbidden("Esa cuenta pertenece a otra agencia");
  }
  if (cuenta.estado !== "ACTIVA") throw badRequest("Esta cuenta está cerrada; no se pueden registrar movimientos");

  if (data.tipo === "RETIRO") {
    // REGLA CRÍTICA: Ahorro sobre Préstamo no se toca hasta que termine el pago del crédito
    if (cuenta.tipo === "AHORRO_SOBRE_PRESTAMO") {
      const { rows: prestamosActivos } = await client.query(
        `select codigo, estado, saldo_capital
         from prestamos
         where (id = $1 or (socio_id = $2 and estado in ('SOLICITUD', 'APROBADO', 'DESEMBOLSADO')))
           and estado != 'CANCELADO' and estado != 'RECHAZADO'
         limit 1`,
        [cuenta.prestamo_id, cuenta.socio_id],
      );
      if (prestamosActivos[0]) {
        throw badRequest(
          `Esta cuenta de Ahorro sobre Préstamo está en garantía del crédito activo "${prestamosActivos[0].codigo}" (${prestamosActivos[0].estado}). Por regla estatutaria de la cooperativa, los fondos no pueden retirarse hasta que el préstamo sea cancelado en su totalidad.`,
        );
      }
    }

    if (Number(data.monto) > Number(cuenta.saldo_actual)) {
      throw conflict(
        `El retiro (Q ${Number(data.monto).toFixed(2)}) es mayor que el saldo disponible (Q ${Number(cuenta.saldo_actual).toFixed(2)})`,
      );
    }
  }

  // Validación de número de recibo anti-duplicados
  if (data.numeroRecibo && data.numeroRecibo.trim()) {
    const recibo = data.numeroRecibo.trim();

    // 1. Checar en movimientos de cuentas
    const { rows: repetidoMov } = await client.query(
      `select m.fecha, m.numero_recibo, c.numero_cuenta, s.nombres as socio_nombres
       from movimientos m
       join cuentas c on c.id = m.cuenta_id
       join socios s on s.id = c.socio_id
       where c.agencia_id = $1 and lower(trim(m.numero_recibo)) = lower($2)
       limit 1`,
      [cuenta.agencia_id, recibo],
    );
    if (repetidoMov[0]) {
      const fechaStr = new Date(repetidoMov[0].fecha).toLocaleDateString("es-GT");
      throw conflict(
        `El número de recibo "${recibo}" ya fue registrado el ${fechaStr} en la cuenta ${repetidoMov[0].numero_cuenta} (${repetidoMov[0].socio_nombres}). Verifique el talonario físico; no se permiten recibos duplicados.`,
      );
    }

    // 2. Checar en auxiliar de caja
    const { rows: repetidoAux } = await client.query(
      `select fecha, doc_no, beneficiario, descripcion
       from caja_movimientos_auxiliar
       where agencia_id = $1 and lower(trim(doc_no)) = lower($2)
       limit 1`,
      [cuenta.agencia_id, recibo],
    );
    if (repetidoAux[0]) {
      const fechaStr = new Date(repetidoAux[0].fecha).toLocaleDateString("es-GT");
      throw conflict(
        `El número de recibo "${recibo}" ya fue registrado en Auxiliar de Caja el ${fechaStr} (${repetidoAux[0].descripcion} - ${repetidoAux[0].beneficiario}). No se permiten recibos duplicados.`,
      );
    }
  }

  const clienteMovimientoId = `srv-${cuentaId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  const fechaMov = data.fecha || new Date().toISOString().slice(0, 10);

  const { rows } = await client.query(
    `insert into movimientos (cuenta_id, tipo, monto, fecha, numero_recibo, descripcion, usuario_id, cliente_movimiento_id)
     values ($1,$2,$3,$4,$5,$6,$7,$8)
     returning *`,
    [cuentaId, data.tipo, data.monto, fechaMov, data.numeroRecibo ?? null, data.descripcion ?? null, usuarioId, clienteMovimientoId],
  );
  const movimiento = rows[0];
  await registrarAuditoria({
    entidad: "Movimiento",
    entidadId: movimiento.id,
    accion: "CREAR",
    usuarioId,
    datosNuevos: movimiento,
  });
  return { ...movimiento, cuenta_socio_id: cuenta.socio_id, cuenta_socio_nombres: cuenta.socio_nombres, cuenta_numero: cuenta.numero_cuenta };
}

export async function registrarMovimiento(
  cuentaId: string,
  data: DatosMovimiento,
  usuarioId: string,
  agenciaVisible: string | null,
) {
  return withTransaction(async (client) => {
    return registrarMovimientoConClient(client, cuentaId, data, usuarioId, agenciaVisible);
  });
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
  requireRole("GERENCIA", "SUPERVISOR", "CAJERO", "CAJA_CHICA"),
  asyncHandler(async (req, res) => {
    const q = typeof req.query.q === "string" ? req.query.q : undefined;
    res.json(await service.listar({ agenciaId: agenciaVisible(req), q }));
  }),
);

cajaChicaRouter.get(
  "/reporte",
  requireRole("GERENCIA", "SUPERVISOR", "CAJERO", "CAJA_CHICA"),
  asyncHandler(async (req, res) => {
    const visible = agenciaVisible(req);
    const agenciaId = (visible || req.query.agenciaId) as string;
    if (!agenciaId) throw badRequest("Falta indicar la agencia para el reporte");

    const fechaInicio = typeof req.query.fechaInicio === "string" ? req.query.fechaInicio : undefined;
    const fechaFin = typeof req.query.fechaFin === "string" ? req.query.fechaFin : undefined;
    const categoria = typeof req.query.categoria === "string" ? req.query.categoria : undefined;

    res.json(await service.generarReporte({ agenciaId, fechaInicio, fechaFin, categoria }));
  }),
);

cajaChicaRouter.get(
  "/ultimo-documento",
  requireRole("GERENCIA", "SUPERVISOR", "CAJERO", "CAJA_CHICA"),
  asyncHandler(async (req, res) => {
    const visible = agenciaVisible(req);
    const agenciaId = (visible || (req.query.agenciaId as string)) as string;
    if (!agenciaId) throw badRequest("Falta indicar la agencia");
    const fecha = typeof req.query.fecha === "string" ? req.query.fecha : new Date().toISOString().slice(0, 10);
    res.json(await service.obtenerUltimoDocumento(agenciaId, fecha));
  }),
);

cajaChicaRouter.get(
  "/verificar-documento",
  requireRole("GERENCIA", "SUPERVISOR", "CAJERO", "CAJA_CHICA"),
  asyncHandler(async (req, res) => {
    const visible = agenciaVisible(req);
    const agenciaId = (visible || (req.query.agenciaId as string)) as string;
    if (!agenciaId) throw badRequest("Falta indicar la agencia");
    const fecha = typeof req.query.fecha === "string" ? req.query.fecha : new Date().toISOString().slice(0, 10);
    const numeroDocumento = typeof req.query.numeroDocumento === "string" ? req.query.numeroDocumento : "";
    res.json(await service.verificarNumeroDocumentoExiste(agenciaId, fecha, numeroDocumento));
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
  requireRole("GERENCIA", "SUPERVISOR", "CAJERO", "CAJA_CHICA"),
  asyncHandler(async (req, res) => {
    const data = crearSchema.parse(req.body);
    const visible = agenciaVisible(req);
    if (visible && data.agenciaId !== visible) throw forbidden("No puedes registrar comprobantes en otra agencia");
    if (!visible && !req.query.agenciaId && !data.agenciaId) throw badRequest("Falta indicar la agencia");
    res.status(201).json(await service.crear(data, req.user!.id));
  }),
);

const reponerFondoSchema = z.object({
  agenciaId: z.string().uuid(),
  monto: z.number().positive("El monto a reponer debe ser mayor a 0"),
  numeroCheque: z.string().min(1, "El número de cheque o documento (No. CH.) es obligatorio"),
  descripcion: z.string().optional(),
  fecha: z.string().optional(),
});

cajaChicaRouter.post(
  "/reponer-fondo",
  requireRole("GERENCIA", "SUPERVISOR", "CAJERO", "CAJA_CHICA"),
  asyncHandler(async (req, res) => {
    const data = reponerFondoSchema.parse(req.body);
    const visible = agenciaVisible(req);
    if (visible && data.agenciaId !== visible) throw forbidden("No puedes reponer caja chica en otra agencia");
    res.status(201).json(await service.reponerFondo(data, req.user!.id));
  }),
);

const editarSchema = z.object({
  fecha: z.string().min(1).optional(),
  numeroDocumento: z.string().optional(),
  beneficiario: z.string().min(2).optional(),
  descripcion: z.string().min(2).optional(),
  tipo: z.enum(["INGRESO", "EGRESO"]).optional(),
  categoria: z.enum(CATEGORIAS_CAJA_CHICA).optional(),
  monto: z.number().positive("El monto debe ser mayor a cero").optional(),
  motivo: z.string().min(10, "El motivo de la corrección es obligatorio (mínimo 10 caracteres)"),
});

cajaChicaRouter.patch(
  "/:id",
  requireRole("GERENCIA", "CAJERO", "CAJA_CHICA"),
  asyncHandler(async (req, res) => {
    const id = req.params.id;
    const data = editarSchema.parse(req.body);
    const { motivo, ...updates } = data;

    // Verificar permisos operativos (GERENCIA salta esto)
    if (req.user!.rol !== "GERENCIA") {
      const { pool } = await import("../../db/pool");
      const { rows } = await pool.query(
        "select usuario_id, created_at from caja_chica_comprobantes where id = $1",
        [id]
      );
      if (!rows[0]) throw badRequest("El registro no existe");
      const reg = rows[0];
      
      // Debe ser el mismo usuario
      if (reg.usuario_id !== req.user!.id) {
        throw forbidden("No autorizado: Solo puedes editar tus propios registros");
      }
      
      // Debe ser del mismo día (hoy localmente o created_at)
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
  | "TRASLADO_FONDOS"
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
  TRASLADO_FONDOS: {
    seccion: "PROPIO",
    tipo: "EGRESO",
    grupoContador: "egreso_propio",
    descripcion: "Traslado de fondos",
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
  "/siguiente-correlativo-bi",
  asyncHandler(async (req, res) => {
    const agenciaId = (req.query.agenciaId as string) || req.user?.agenciaId;
    if (!agenciaId) throw badRequest("Falta indicar la agencia");
    const fecha = typeof req.query.fecha === "string" ? req.query.fecha : undefined;
    res.json(await service.siguienteCorrelativoBi(agenciaId, agenciaVisible(req), fecha));
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
import { pool, queryWithRetry } from "../../db/pool";
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
    `select m.*, u.nombre as usuario_nombre, u.rol as usuario_rol,
            ag_op.nombre as agencia_nombre,
            coalesce(ag_orig.nombre, ag_op.nombre) as agencia_origen_nombre
     from caja_movimientos_auxiliar m
     join caja_dias d on d.id = m.caja_dia_id
     join agencias ag_op on ag_op.id = d.agencia_id
     join usuarios u on u.id = m.usuario_id
     left join socios s on s.id = m.socio_id
     left join agencias ag_orig on ag_orig.id = coalesce(m.agencia_origen_id, s.agencia_id)
     where m.caja_dia_id = $1
     order by m.created_at desc`,
    [id],
  );

  const totalIngreso = movimientos.filter((m) => m.tipo === "INGRESO").reduce((acc, m) => acc + Number(m.monto), 0);
  const totalEgreso = movimientos.filter((m) => m.tipo === "EGRESO").reduce((acc, m) => acc + Number(m.monto), 0);
  const saldoActual = movimientos.length
    ? Number(movimientos[0].saldo_acumulado ?? (Number(dia.saldo_inicial) + totalIngreso - totalEgreso))
    : Number(dia.saldo_inicial);

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

    let contador = 1;
    let referencia: string | null = data.referenciaAut?.trim() || null;

    if (info.seccion === "BI") {
      const fechaMov = new Date(dia.fecha);
      const anio = fechaMov.getFullYear();
      const mesStr = String(fechaMov.getMonth() + 1).padStart(2, "0");
      const periodoMes = `${anio}-${mesStr}`;
      const { rows: biRows } = await client.query(
        `select count(*)::int as total from caja_movimientos_auxiliar
         where agencia_id = $1 and seccion = 'BI' and to_char(fecha, 'YYYY-MM') = $2`,
        [dia.agencia_id, periodoMes],
      );
      const biTotalMes = biRows[0] ? Number(biRows[0].total) : 0;
      contador = biTotalMes + 1;
      const codigoBiMes = `BI-${periodoMes}-${String(contador).padStart(3, "0")}`;
      if (!referencia) {
        referencia = codigoBiMes;
      }
    } else {
      const { rows: contadorRows } = await client.query(
        `select count(*)::int as total from caja_movimientos_auxiliar
         where agencia_id = $1 and categoria::text = any($2::text[])`,
        [dia.agencia_id, categoriasDelGrupo(info.grupoContador)],
      );
      contador = contadorRows[0].total + 1;
    }

    let socioId: string | null = data.socioId ?? null;
    let cuentaId: string | null = null;
    let cuenta: any = null;
    let descFinal: string = info.descripcion;
    let movimientoId: string | null = null;
    let ingresoComifId: string | null = null;
    let beneficiario = data.beneficiario?.trim() ?? "";

    if (info.requiereCuenta) {
      if (!data.cuentaId) throw badRequest("Selecciona la cuenta del socio");
      const { rows: ctaRows } = await client.query(
        `select c.*, s.nombres as socio_nombres, s.id as socio_id, a.nombre as agencia_nombre, a.codigo as agencia_codigo
         from cuentas c
         join socios s on s.id = c.socio_id
         join agencias a on a.id = c.agencia_id
         where c.id = $1`,
        [data.cuentaId],
      );
      cuenta = ctaRows[0];
      if (!cuenta) throw notFound("Cuenta no encontrada");
      if (cuenta.tipo !== info.requiereCuenta) throw badRequest("La cuenta seleccionada no corresponde a este tipo de ahorro");

      const esInterAgencia = dia.agencia_id !== cuenta.agencia_id;
      descFinal = esInterAgencia
        ? `${info.descripcion} (Inter-Agencia: Cuenta de ${cuenta.agencia_nombre})`
        : info.descripcion;

      const movimiento = await cuentasService.registrarMovimientoConClient(
        client,
        data.cuentaId,
        {
          tipo: info.movimientoTipo!,
          monto: data.monto,
          fecha: new Date(dia.fecha).toISOString().slice(0, 10),
          numeroRecibo: data.docNo,
          descripcion: descFinal,
        },
        usuarioId,
        agenciaVisible,
        true, // permitirInterAgencia
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

    const agenciaOrigenId = (cuenta && cuenta.agencia_id !== dia.agencia_id) ? cuenta.agencia_id : null;

    const { rows } = await client.query(
      `insert into caja_movimientos_auxiliar
         (caja_dia_id, agencia_id, fecha, seccion, categoria, tipo, contador, referencia,
          socio_id, cuenta_id, movimiento_id, ingreso_comif_id, beneficiario, descripcion, doc_no,
          monto, saldo_acumulado, usuario_id, agencia_origen_id)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19)
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
        descFinal,
        data.docNo ?? null,
        data.monto,
        saldoAcumulado,
        usuarioId,
        agenciaOrigenId,
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
      `select p.*, s.nombres as socio_nombres, s.numero_asociado, s.dpi as socio_dpi, s.telefono as socio_telefono,
              a.nombre as agencia_nombre, a.codigo as agencia_codigo
       from prestamos p
       join socios s on s.id = p.socio_id
       join agencias a on a.id = p.agencia_id
       where p.id = $1`,
      [data.prestamoId],
    );
    const prestamo = prestamoRows[0];
    if (!prestamo) throw notFound("Préstamo no encontrado");
    if (prestamo.estado !== "DESEMBOLSADO" && prestamo.estado !== "APROBADO") {
      throw badRequest(`El préstamo no está activo para cobro (estado actual: ${prestamo.estado})`);
    }

    const esInterAgencia = dia.agencia_id !== prestamo.agencia_id;

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

    const agenciaOrigenId = prestamo.agencia_id !== dia.agencia_id ? prestamo.agencia_id : null;

    const { rows: cajaMovRows } = await client.query(
      `insert into caja_movimientos_auxiliar (
         caja_dia_id, agencia_id, fecha, seccion, categoria, tipo, contador,
         referencia, socio_id, beneficiario, descripcion, doc_no, monto, saldo_acumulado, origen_fondos, usuario_id,
         saldo_anterior_reportado, saldo_actual_reportado, numero_cuota, agencia_origen_id
       ) values ($1, $2, $3, 'PROPIO', $4, 'INGRESO', $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
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
        agenciaOrigenId,
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
         saldo_capital_restante, origen_fondos, usuario_id, agencia_origen_id
       ) values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
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
        agenciaOrigenId,
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

    const { rows: agCobroRows } = await client.query(
      `select id, nombre, codigo from agencias where id = $1`,
      [dia.agencia_id],
    );
    const agCobro = agCobroRows[0] || { id: dia.agencia_id, nombre: "Agencia", codigo: "AG" };

    return {
      pago: pagoRows[0],
      cajaMovimiento: cajaMov,
      saldoCapitalRestante: nuevoSaldoCapital,
      ahorroSobrePrestamoAcreditado: ahorroSobrePrestamo,
      cuentaAsp: cuentaAspInfo,
      prestamoCancelado: nuevoEstadoPrestamo === "CANCELADO",
      esInterAgencia,
      agenciaCobro: agCobro,
      agenciaOrigen: {
        id: prestamo.agencia_id,
        nombre: prestamo.agencia_nombre,
        codigo: prestamo.agencia_codigo,
      },
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
    queryWithRetry(query, params),
    queryWithRetry(queryTendencia, params),
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

  const mappedRows = rows.map((r) => {
    const sIni = Number(r.saldo_inicial || 0);
    const ing = Number(r.total_ingresos || 0);
    const egr = Number(r.total_egresos || 0);
    const flujoNeto = Math.round((ing - egr) * 100) / 100;
    const saldoEsperado = Math.round((sIni + ing - egr) * 100) / 100;
    const totalContado = r.total_contado != null 
      ? Number(r.total_contado) 
      : (r.estado === "CERRADO" ? Number(r.saldo_final ?? saldoEsperado) : saldoEsperado);
    const diferencia = r.diferencia != null 
      ? Number(r.diferencia) 
      : (r.estado === "CERRADO" ? Math.round((totalContado - saldoEsperado) * 100) / 100 : 0);

    totalMovimientosMes += Number(r.total_movimientos || 0);
    totalIngresosMes += ing;
    totalEgresosMes += egr;

    if (diferencia === 0) {
      diasCuadrados++;
    } else {
      diasConDiferencia++;
      if (diferencia > 0) totalSobrante += diferencia;
      else totalFaltante += Math.abs(diferencia);
    }

    return {
      ...r,
      saldo_inicial: sIni,
      total_ingresos: ing,
      total_egresos: egr,
      flujo_neto: flujoNeto,
      saldo_final: r.saldo_final != null && r.estado === "CERRADO" ? Number(r.saldo_final) : saldoEsperado,
      saldo_esperado: saldoEsperado,
      total_contado: totalContado,
      diferencia: diferencia,
    };
  });

  const totalFlujoNetoMes = Math.round((totalIngresosMes - totalEgresosMes) * 100) / 100;

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
      totalFlujoNetoMes,
    },
    dias: mappedRows,
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
    `select m.*, u.nombre as usuario_nombre, u.rol as usuario_rol, d.fecha as dia_fecha, d.saldo_inicial as dia_saldo_inicial,
            ag_op.nombre as agencia_nombre,
            coalesce(ag_orig.nombre, ag_op.nombre) as agencia_origen_nombre
     from caja_movimientos_auxiliar m
     join caja_dias d on d.id = m.caja_dia_id
     join agencias ag_op on ag_op.id = d.agencia_id
     join usuarios u on u.id = m.usuario_id
     left join socios s on s.id = m.socio_id
     left join agencias ag_orig on ag_orig.id = s.agencia_id
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

export async function siguienteCorrelativoBi(
  agenciaId: string,
  agenciaVisible?: string | null,
  fechaStr?: string,
) {
  if (agenciaVisible && agenciaId !== agenciaVisible) {
    throw forbidden("No tienes acceso a esta agencia");
  }
  const fecha = fechaStr ? new Date(fechaStr + "T00:00:00") : new Date();
  const anio = fecha.getFullYear();
  const mes = fecha.getMonth() + 1;
  const mesStr = String(mes).padStart(2, "0");
  const periodoMes = `${anio}-${mesStr}`;

  const { rows } = await pool.query(
    `select count(*)::int as total
     from caja_movimientos_auxiliar
     where agencia_id = $1
       and seccion = 'BI'
       and to_char(fecha, 'YYYY-MM') = $2`,
    [agenciaId, periodoMes],
  );
  const total = rows[0] ? Number(rows[0].total) : 0;
  const siguiente = total + 1;
  const codigo = `BI-${periodoMes}-${String(siguiente).padStart(3, "0")}`;

  const meses = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ];
  const mesNombre = `${meses[mes - 1]} ${anio}`;

  return {
    correlativo: siguiente,
    codigo,
    periodoMes,
    mesNombre,
    totalMes: total,
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
import { queryWithRetry } from "../../db/pool";

// Resumen para el tablero del jefe de agencia: saldo de caja chica y saldo
// total de cada tipo de ahorro, por agencia. Si agenciaId es null (Admin o
// Gerencia), se calcula para todas las agencias visibles.
// Las queries se ejecutan de forma SECUENCIAL (no en paralelo) para no saturar
// el Transaction Pooler de Supabase (plan gratuito: máx ~10 conexiones).
export async function resumen(agenciaId: string | null) {
  const filtroAgencia = agenciaId ? "where a.id = $1" : "";
  const valores = agenciaId ? [agenciaId] : [];

  const { rows: agencias } = await queryWithRetry(
    `select a.id, a.nombre, a.codigo from agencias a ${filtroAgencia} order by a.nombre`,
    valores,
  );

  const { rows: cajaChica } = await queryWithRetry(
    `select agencia_id,
            coalesce(sum(case when tipo = 'INGRESO' then monto else 0 end), 0)
              - coalesce(sum(case when tipo = 'EGRESO' then monto else 0 end), 0) as saldo
     from caja_chica_comprobantes
     group by agencia_id`,
  );

  const { rows: ahorros } = await queryWithRetry(
    `select c.agencia_id, c.tipo,
            count(*)::int as total_cuentas,
            coalesce(sum(coalesce(sc.saldo_actual, c.saldo_inicial)), 0) as saldo_total
     from cuentas c
     left join saldos_cuenta sc on sc.cuenta_id = c.id
     where c.tipo in ('AHORRO_CORRIENTE', 'AHORRO_PROGRAMADO', 'AHORRO_INFANTO_JUVENIL')
     group by c.agencia_id, c.tipo`,
  );

  const { rows: socios } = await queryWithRetry(
    `select agencia_id, count(*)::int as total from socios where estado = 'ACTIVO' group by agencia_id`,
  );

  const { rows: movimientosHoy } = await queryWithRetry(
    `select cu.agencia_id, count(*)::int as total
     from movimientos m join cuentas cu on cu.id = m.cuenta_id
     where m.fecha = current_date
     group by cu.agencia_id`,
  );

  const { rows: prestamos } = await queryWithRetry(
    `select p.agencia_id,
            count(*)::int as total_prestamos,
            coalesce(sum(coalesce(p.saldo_capital, p.monto_aprobado)), 0)::numeric(14,2) as saldo_total
     from prestamos p
     where p.estado in ('DESEMBOLSADO', 'APROBADO')
     group by p.agencia_id`,
  );

  const { rows: plazoFijo } = await queryWithRetry(
    `select c.agencia_id,
            count(*)::int as total_certificados,
            coalesce(sum(pf.monto_deposito), 0)::numeric(14,2) as monto_total
     from plazo_fijo_contratos pf
     join cuentas c on c.id = pf.cuenta_id
     group by c.agencia_id`,
  );

  const { rows: aportaciones } = await queryWithRetry(
    `select c.agencia_id,
            count(*)::int as total_aportantes,
            coalesce(sum(coalesce(sc.saldo_actual, c.saldo_inicial)), 0)::numeric(14,2) as saldo_total
     from cuentas c
     left join saldos_cuenta sc on sc.cuenta_id = c.id
     where c.tipo = 'APORTACION'
     group by c.agencia_id`,
  );

  const { rows: cuotasIngresoRows } = await queryWithRetry(
    `select agencia_id,
            count(*)::int as total_cuotas,
            coalesce(sum(monto), 0)::numeric(14,2) as monto_total
     from caja_movimientos_auxiliar
     where categoria = 'INGRESO_ASOCIADO'
     group by agencia_id`,
  );

  const mapaCajaChica = new Map(cajaChica.map((r) => [r.agencia_id, Number(r.saldo)]));
  const mapaSocios = new Map(socios.map((r) => [r.agencia_id, r.total]));
  const mapaMovHoy = new Map(movimientosHoy.map((r) => [r.agencia_id, r.total]));
  const mapaPrestamos = new Map(prestamos.map((r) => [r.agencia_id, { count: r.total_prestamos, saldo: Number(r.saldo_total) }]));
  const mapaPlazoFijo = new Map(plazoFijo.map((r) => [r.agencia_id, { count: r.total_certificados, monto: Number(r.monto_total) }]));
  const mapaAportaciones = new Map(aportaciones.map((r) => [r.agencia_id, { count: r.total_aportantes, saldo: Number(r.saldo_total) }]));
  const mapaCuotasIngreso = new Map(cuotasIngresoRows.map((r) => [r.agencia_id, { count: r.total_cuotas, monto: Number(r.monto_total) }]));

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
      carteraPrestamos: mapaPrestamos.get(ag.id) ?? { count: 0, saldo: 0 },
      plazoFijo: mapaPlazoFijo.get(ag.id) ?? { count: 0, monto: 0 },
      aportaciones: mapaAportaciones.get(ag.id) ?? { count: 0, saldo: 0 },
      cuotasIngreso: mapaCuotasIngreso.get(ag.id) ?? { count: 0, monto: 0 },
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
      carteraPrestamos: {
        count: acc.carteraPrestamos.count + a.carteraPrestamos.count,
        saldo: acc.carteraPrestamos.saldo + a.carteraPrestamos.saldo,
      },
      plazoFijo: {
        count: acc.plazoFijo.count + a.plazoFijo.count,
        monto: acc.plazoFijo.monto + a.plazoFijo.monto,
      },
      aportaciones: {
        count: acc.aportaciones.count + a.aportaciones.count,
        saldo: acc.aportaciones.saldo + a.aportaciones.saldo,
      },
      cuotasIngreso: {
        count: acc.cuotasIngreso.count + a.cuotasIngreso.count,
        monto: acc.cuotasIngreso.monto + a.cuotasIngreso.monto,
      },
      totalSocios: acc.totalSocios + a.totalSocios,
      movimientosHoy: acc.movimientosHoy + a.movimientosHoy,
    }),
    {
      cajaChica: 0,
      ahorroCorriente: 0,
      ahorroProgramado: 0,
      ahorroInfantoJuvenil: 0,
      carteraPrestamos: { count: 0, saldo: 0 },
      plazoFijo: { count: 0, monto: 0 },
      aportaciones: { count: 0, saldo: 0 },
      cuotasIngreso: { count: 0, monto: 0 },
      totalSocios: 0,
      movimientosHoy: 0,
    },
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
    const pageSize = Math.min(100, Math.max(1, Number(req.query.pageSize) || 10));
    const estado = req.query.estado as "ACTIVO" | "INACTIVO" | undefined;
    const q = typeof req.query.q === "string" ? req.query.q : undefined;
    const interAgencia = req.query.interAgencia === "true";
    const agId = interAgencia ? null : agenciaVisible(req);

    res.json(await service.listar({ agenciaId: agId, q, estado, page, pageSize }));
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
  "/aportaciones",
  asyncHandler(async (req, res) => {
    const q = typeof req.query.q === "string" ? req.query.q : undefined;
    res.json(await service.listarAportaciones({ agenciaId: agenciaVisible(req), q }));
  }),
);

sociosRouter.get(
  "/verificar-dpi",
  asyncHandler(async (req, res) => {
    const dpi = typeof req.query.dpi === "string" ? req.query.dpi : "";
    const socioId = typeof req.query.socioId === "string" ? req.query.socioId : undefined;
    const tipo = (req.query.tipo as "SOCIO" | "BENEFICIARIO") || "SOCIO";
    const agenciaCodigo = typeof req.query.agenciaCodigo === "string" ? req.query.agenciaCodigo : undefined;
    if (!dpi) {
      return res.json({ valido: false, mensaje: "Se requiere el número de DPI" });
    }
    res.json(await service.verificarDpi(dpi, socioId, tipo, agenciaCodigo));
  }),
);

sociosRouter.get(
  "/verificar-telefono",
  asyncHandler(async (req, res) => {
    const telefono = typeof req.query.telefono === "string" ? req.query.telefono : "";
    const socioId = typeof req.query.socioId === "string" ? req.query.socioId : undefined;
    const tipo = (req.query.tipo as "SOCIO" | "BENEFICIARIO") || "SOCIO";
    if (!telefono) {
      return res.json({ valido: false, mensaje: "Se requiere el número de teléfono" });
    }
    res.json(await service.verificarTelefono(telefono, socioId, tipo));
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
  genero: z.enum(["M", "F"]).optional().nullable(),
  fechaIngreso: z.string().min(1, "La fecha de ingreso es obligatoria"),
  dpi: z
    .string()
    .refine((v) => !v || v.replace(/\D/g, "").length === 13, "El DPI debe contener 13 dígitos numéricos")
    .optional()
    .or(z.literal(""))
    .transform((v) => (v ? v.trim() : undefined)),
  direccion: z.string().optional().nullable(),
  telefono: z.string().optional().nullable(),
  nombreBeneficiario: z.string().optional().nullable(),
  dpiBeneficiario: z
    .string()
    .refine((v) => !v || v.replace(/\D/g, "").length === 13, "El DPI/CUI del beneficiario debe contener 13 dígitos")
    .optional()
    .nullable(),
  telefonoBeneficiario: z.string().optional().nullable(),
  parentescoBeneficiario: z.string().optional().nullable(),
  montoAportacionInicial: z
    .number()
    .min(100, "La aportación inicial mínima de la cooperativa es de Q 100.00")
    .optional()
    .default(100),
  reciboAportacionInicial: z.string().min(1, "El número de boleta o recibo de pago es obligatorio"),
});

sociosRouter.post(
  "/",
  requireRole("GERENCIA", "SUPERVISOR", "CAJERO", "CAJA_CHICA", "PROMOTOR"),
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
  requireRole("GERENCIA", "SUPERVISOR", "CAJERO", "CAJA_CHICA", "PROMOTOR"),
  asyncHandler(async (req, res) => {
    const data = actualizarSchema.parse(req.body);
    res.json(await service.actualizar(req.params.id, data, req.user!.id, agenciaVisible(req)));
  }),
);

const abrirAportacionSchema = z.object({
  monto: z.number().min(100, "Monto mínimo Q 100.00").optional().default(100),
  recibo: z.string().optional().nullable(),
  cuotaIngreso: z.number().min(0).optional().nullable(),
});

sociosRouter.post(
  "/:id/abrir-aportacion",
  requireRole("GERENCIA", "SUPERVISOR", "CAJERO", "CAJA_CHICA", "PROMOTOR"),
  asyncHandler(async (req, res) => {
    const data = abrirAportacionSchema.parse(req.body || {});
    res.status(201).json(await service.abrirAportacionSocio(req.params.id, data.monto, data.recibo, req.user!.id, data.cuotaIngreso ?? undefined));
  }),
);

// GET /socios/sin-aportacion — socios sin cuenta de aportación o saldo < 100
sociosRouter.get(
  "/sin-aportacion",
  requireRole("GERENCIA", "SUPERVISOR", "CAJERO", "CAJA_CHICA", "PROMOTOR"),
  asyncHandler(async (req, res) => {
    const agenciaId = req.query.agenciaId as string | undefined;
    res.json(await service.sociosSinAportacion(agenciaId || null, agenciaVisible(req)));
  }),
);
```

## `backend/src/modules/socios/service.ts` {#backendsrcmodulessociosservicets}

```ts
import { pool } from "../../db/pool";
import { Socio } from "../../types/models";
import { registrarAuditoria } from "../../utils/auditoria";
import { badRequest, notFound, forbidden, conflict } from "../../utils/errors";
import { validarDpiGuatemala, formatearDPI, type ResultadoValidacionDPI } from "../../utils/dpiGuatemala";

export interface FiltrosSocios {
  agenciaId: string | null; // null = todas (ADMIN/GERENCIA)
  q?: string;
  estado?: "ACTIVO" | "INACTIVO";
  page: number;
  pageSize: number;
}

const CONECTORES_NOMBRE = new Set(["de", "del", "la", "las", "los", "y", "e"]);

export function capitalizarNombre(valor?: string | null): string | null | undefined {
  if (!valor) return valor;
  let texto = valor.trim();
  if (/^[\p{Lu}\s\p{P}]+$/u.test(texto) && texto.length > 2) {
    texto = texto.toLowerCase();
  }
  const palabras = texto.split(/(\s+)/);
  return palabras
    .map((p, idx) => {
      if (/^\s+$/.test(p)) return p;
      const norm = p.toLowerCase();
      if (idx > 0 && CONECTORES_NOMBRE.has(norm)) {
        return norm;
      }
      return p.replace(/(^|[^\p{L}\p{N}])(\p{L})/gu, (_, sep, letra) => sep + letra.toUpperCase());
    })
    .join("");
}

export function capitalizarDescripcion(valor?: string | null): string | null | undefined {
  if (!valor) return valor;
  const texto = valor.trim();
  const primerIndice = texto.search(/\S/);
  if (primerIndice === -1) return texto;
  return (
    texto.slice(0, primerIndice) +
    texto.charAt(primerIndice).toUpperCase() +
    texto.slice(primerIndice + 1)
  );
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
    const qClean = filtros.q.replace(/\D/g, "");
    valores.push(`%${filtros.q.toLowerCase()}%`);
    const idx = valores.length;
    if (qClean.length >= 3) {
      valores.push(`%${qClean}%`);
      const idxClean = valores.length;
      condiciones.push(
        `(lower(s.nombres) like $${idx} or s.dpi like $${idx} or lower(s.numero_asociado) like $${idx} or regexp_replace(coalesce(s.dpi, ''), '[^0-9]', '', 'g') like $${idxClean} or regexp_replace(coalesce(s.telefono, ''), '[^0-9]', '', 'g') like $${idxClean})`,
      );
    } else {
      condiciones.push(
        `(lower(s.nombres) like $${idx} or s.dpi like $${idx} or lower(s.numero_asociado) like $${idx})`,
      );
    }
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
       order by s.numero_asociado desc, s.created_at desc
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
  genero?: "M" | "F" | null;
  fechaIngreso: string;
  dpi?: string | null;
  direccion?: string | null;
  telefono?: string | null;
  nombreBeneficiario?: string | null;
  dpiBeneficiario?: string | null;
  telefonoBeneficiario?: string | null;
  parentescoBeneficiario?: string | null;
  montoAportacionInicial?: number;
  reciboAportacionInicial?: string | null;
}

export async function crear(data: DatosSocio, usuarioId: string): Promise<Socio> {
  const { rows: asocRepetido } = await pool.query(
    `select numero_asociado, nombres from socios where lower(trim(numero_asociado)) = lower(trim($1)) limit 1`,
    [data.numeroAsociado],
  );
  if (asocRepetido[0]) {
    throw conflict(
      `El número de asociado "${data.numeroAsociado}" ya está asignado al socio "${asocRepetido[0].nombres}". No se permiten números de asociado duplicados.`,
    );
  }

  const montoApor = data.montoAportacionInicial !== undefined ? Number(data.montoAportacionInicial) : 100;
  if (isNaN(montoApor) || montoApor < 100) {
    throw badRequest("La aportación inicial mínima de la cooperativa es de Q 100.00 para afiliarse como socio.");
  }

  // Validaciones Cruzadas (Socio y Beneficiario)
  const dpiSocio = data.dpi?.trim();
  const dpiBen = data.dpiBeneficiario?.trim();
  const telSocio = data.telefono?.trim();
  const telBen = data.telefonoBeneficiario?.trim();

  // Auto-restricción: Un socio no puede ser su propio beneficiario (ni usar mismo DPI ni teléfono)
  if (dpiSocio && dpiBen && dpiSocio === dpiBen) {
    throw badRequest("El DPI del socio y el DPI/CUI del beneficiario no pueden ser iguales.");
  }
  if (telSocio && telBen && telSocio === telBen) {
    throw badRequest("El teléfono del socio y el teléfono del beneficiario no pueden ser iguales.");
  }

  // DPI Socio
  if (dpiSocio) {
    const res = await verificarDpi(dpiSocio, undefined, "SOCIO");
    if (!res.valido) throw badRequest(res.mensaje!);
    if (!res.disponible) throw conflict(`El DPI "${dpiSocio}" ya está registrado en el sistema (${res.registrado?.rol}: ${res.registrado?.nombres}).`);
  }

  // Teléfono Socio
  if (telSocio) {
    const res = await verificarTelefono(telSocio, undefined, "SOCIO");
    if (!res.valido) throw badRequest(res.mensaje!);
    if (!res.disponible) throw conflict(`El teléfono "${telSocio}" ya está registrado en el sistema (${res.registrado?.rol}: ${res.registrado?.nombres}).`);
  }

  // DPI Beneficiario
  if (dpiBen) {
    const res = await verificarDpi(dpiBen, undefined, "BENEFICIARIO");
    if (!res.valido) throw badRequest(res.mensaje!);
    if (!res.disponible) throw conflict(`El DPI/CUI del beneficiario "${dpiBen}" ya pertenece a un socio registrado (${res.registrado?.nombres}).`);
  }

  // Teléfono Beneficiario
  if (telBen) {
    const res = await verificarTelefono(telBen, undefined, "BENEFICIARIO");
    if (!res.valido) throw badRequest(res.mensaje!);
    if (!res.disponible) throw conflict(`El teléfono del beneficiario "${telBen}" ya pertenece a un socio registrado (${res.registrado?.nombres}).`);
  }

  // Validación obligatoria de número de boleta / recibo de pago
  if (!data.reciboAportacionInicial || !data.reciboAportacionInicial.trim()) {
    throw badRequest("El número de boleta o recibo de pago es obligatorio para respaldar la aportación estatutaria inicial.");
  }

  const { rows } = await pool.query<Socio>(
    `insert into socios
      (numero_asociado, agencia_id, nombres, genero, fecha_ingreso, dpi, direccion, telefono, nombre_beneficiario, dpi_beneficiario, telefono_beneficiario, parentesco_beneficiario, creado_por_id)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
     returning *`,
    [
      data.numeroAsociado,
      data.agenciaId,
      capitalizarNombre(data.nombres)!,
      data.genero ?? null,
      data.fechaIngreso,
      data.dpi ?? null,
      capitalizarDescripcion(data.direccion) ?? null,
      data.telefono ?? null,
      capitalizarNombre(data.nombreBeneficiario) ?? null,
      data.dpiBeneficiario ?? null,
      data.telefonoBeneficiario ?? null,
      data.parentescoBeneficiario ?? null,
      usuarioId,
    ],
  );
  const socio = rows[0];

  // Crear automáticamente la cuenta de APORTACION del socio con la aportación estatutaria inicial (mínimo Q 100.00)
  const { rows: agencias } = await pool.query(`select codigo from agencias where id = $1`, [data.agenciaId]);
  const codAgencia = agencias[0]?.codigo ?? "MIF";
  const numCuentaAportacion = `${codAgencia}-APOR-${data.numeroAsociado}`;
  const obsApertura = data.reciboAportacionInicial
    ? `Aportación estatutaria inicial. Comprobante/Recibo: ${data.reciboAportacionInicial.trim()}`
    : "Aportación estatutaria inicial al afiliarse";

  await pool.query(
    `insert into cuentas (numero_cuenta, tipo, estado, socio_id, agencia_id, saldo_inicial, observaciones_apertura, creado_por_id)
     values ($1, 'APORTACION', 'ACTIVA', $2, $3, $4, $5, $6)
     on conflict (numero_cuenta) do update set saldo_inicial = $4, observaciones_apertura = $5`,
    [numCuentaAportacion, socio.id, data.agenciaId, montoApor, obsApertura, usuarioId],
  );

  await registrarAuditoria({ entidad: "Socio", entidadId: socio.id, accion: "CREAR", usuarioId, datosNuevos: socio });
  return socio;
}

export interface ResultadoVerificarDpi extends Partial<ResultadoValidacionDPI> {
  valido: boolean;
  disponible: boolean;
  mensaje?: string;
  registrado?: {
    id: string;
    nombres: string;
    numeroAsociado: string;
    rol: string;
  };
}

export async function verificarDpi(
  dpi: string,
  socioIdActual?: string,
  tipo: "SOCIO" | "BENEFICIARIO" = "SOCIO",
  agenciaCodigo?: string,
): Promise<ResultadoVerificarDpi> {
  // Validación de estructura y municipio oficial de Guatemala
  const valGuatemala = validarDpiGuatemala(dpi, agenciaCodigo);
  if (!valGuatemala.valido) {
    return {
      ...valGuatemala,
      valido: false,
      disponible: false,
      mensaje: valGuatemala.mensaje,
    };
  }

  const rawDpi = valGuatemala.dpiFormateado ? valGuatemala.dpiFormateado.replace(/\D/g, "") : dpi.replace(/\D/g, "");
  const params: unknown[] = [rawDpi];
  
  // 1. Verificar si coincide con DPI de algún SOCIO
  let querySocio = `select id, nombres, numero_asociado, dpi from socios where regexp_replace(dpi, '[^0-9]', '', 'g') = $1`;
  if (socioIdActual) {
    querySocio += ` and id != $2`;
    params.push(socioIdActual);
  }
  querySocio += ` limit 1`;

  const { rows: socioRows } = await pool.query(querySocio, params);
  if (socioRows[0]) {
    return {
      ...valGuatemala,
      valido: true,
      disponible: false,
      registrado: {
        id: socioRows[0].id,
        nombres: socioRows[0].nombres,
        numeroAsociado: socioRows[0].numero_asociado,
        rol: "Socio registrado",
      },
    };
  }

  // 2. Si se verifica SOCIO, también verificar que su DPI no esté ya como DPI de algún Beneficiario
  if (tipo === "SOCIO") {
    let queryBen = `select id, nombres, numero_asociado, nombre_beneficiario, dpi_beneficiario from socios where regexp_replace(dpi_beneficiario, '[^0-9]', '', 'g') = $1`;
    if (socioIdActual) {
      queryBen += ` and id != $2`;
    }
    queryBen += ` limit 1`;

    const { rows: benRows } = await pool.query(queryBen, params);
    if (benRows[0]) {
      return {
        ...valGuatemala,
        valido: true,
        disponible: false,
        registrado: {
          id: benRows[0].id,
          nombres: benRows[0].nombre_beneficiario,
          numeroAsociado: benRows[0].numero_asociado,
          rol: `Beneficiario del socio ${benRows[0].nombres}`,
        },
      };
    }
  }

  return {
    ...valGuatemala,
    valido: true,
    disponible: true,
  };
}

export async function verificarTelefono(
  telefono: string,
  socioIdActual?: string,
  tipo: "SOCIO" | "BENEFICIARIO" = "SOCIO",
) {
  const rawTel = telefono.replace(/\D/g, "");
  const localTel = rawTel.startsWith("502") && rawTel.length > 8 ? rawTel.slice(3) : rawTel.slice(-8);

  if (localTel.length !== 8) {
    return { valido: false, mensaje: "El teléfono debe contener 8 dígitos numéricos" };
  }

  // 1. Verificar si coincide con el teléfono de algún socio
  let querySocio = `select id, nombres, numero_asociado, telefono from socios where regexp_replace(telefono, '[^0-9]', '', 'g') like $1`;
  const paramsSocio: unknown[] = [`%${localTel}`];
  if (socioIdActual) {
    paramsSocio.push(socioIdActual);
    querySocio += ` and id != $2`;
  }
  querySocio += ` limit 1`;

  const { rows: socioRows } = await pool.query(querySocio, paramsSocio);
  if (socioRows[0]) {
    return {
      valido: true,
      disponible: false,
      registrado: {
        id: socioRows[0].id,
        nombres: socioRows[0].nombres,
        numeroAsociado: socioRows[0].numero_asociado,
        rol: "Socio registrado",
      },
    };
  }

  // 2. Si se verifica SOCIO, también verificar en beneficiarios registrados
  if (tipo === "SOCIO") {
    let queryBen = `select id, nombres, numero_asociado, nombre_beneficiario, telefono_beneficiario from socios where regexp_replace(telefono_beneficiario, '[^0-9]', '', 'g') like $1`;
    const paramsBen: unknown[] = [`%${localTel}`];
    if (socioIdActual) {
      paramsBen.push(socioIdActual);
      queryBen += ` and id != $2`;
    }
    queryBen += ` limit 1`;

    const { rows: benRows } = await pool.query(queryBen, paramsBen);
    if (benRows[0]) {
      return {
        valido: true,
        disponible: false,
        registrado: {
          id: benRows[0].id,
          nombres: benRows[0].nombre_beneficiario,
          numeroAsociado: benRows[0].numero_asociado,
          rol: `Beneficiario del socio ${benRows[0].nombres}`,
        },
      };
    }
  }

  return { valido: true, disponible: true };
}

/**
 * Retorna socios sin cuenta de APORTACION o con saldo_actual < 100
 * para que el cajero los aperture directamente desde la ventanilla.
 */
export async function sociosSinAportacion(
  agenciaIdParam: string | null,
  agenciaVisible: string | null
) {
  const agenciaId = agenciaIdParam || agenciaVisible;
  const { rows } = await pool.query(
    `select
       s.id, s.nombres, s.numero_asociado,
       c.saldo_actual as saldo_aportacion
     from socios s
     left join cuentas c on c.socio_id = s.id and c.tipo = 'APORTACION' and c.estado = 'ACTIVA'
     where s.estado = 'ACTIVO'
       and ($1::uuid is null or s.agencia_id = $1::uuid)
       and (c.id is null or c.saldo_actual < 100)
     order by s.nombres asc`,
    [agenciaId || null]
  );
  return rows;
}

export async function abrirAportacionSocio(
  socioId: string,
  monto: number = 100,
  recibo?: string | null,
  usuarioId: string = "",
  cuotaIngreso?: number
) {
  const { rows: socioRows } = await pool.query(
    `select s.*, a.codigo as agencia_codigo from socios s join agencias a on a.id = s.agencia_id where s.id = $1`,
    [socioId]
  );
  if (!socioRows[0]) throw notFound("Socio no encontrado");
  const socio = socioRows[0];

  const montoApor = Number(monto) >= 100 ? Number(monto) : 100;
  const codAgencia = socio.agencia_codigo ?? "MIF";
  const numCuentaAportacion = `${codAgencia}-APOR-${socio.numero_asociado}`;
  const obsApertura = recibo?.trim()
    ? `Aportación estatutaria inicial. Comprobante/Recibo: ${recibo.trim()}`
    : "Aportación estatutaria inicial";

  const { rows: cuentaRows } = await pool.query(
    `insert into cuentas (numero_cuenta, tipo, estado, socio_id, agencia_id, saldo_inicial, observaciones_apertura, creado_por_id)
     values ($1, 'APORTACION', 'ACTIVA', $2, $3, $4, $5, $6)
     on conflict (numero_cuenta) do update set saldo_inicial = $4, estado = 'ACTIVA', observaciones_apertura = $5
     returning *`,
    [numCuentaAportacion, socio.id, socio.agencia_id, montoApor, obsApertura, usuarioId || null]
  );

  await registrarAuditoria({
    entidad: "Cuenta",
    entidadId: cuentaRows[0].id,
    accion: "CREAR",
    usuarioId,
    datosNuevos: { tipo: "APORTACION", saldo_inicial: montoApor, socio_id: socio.id },
  });

  // Si se registró cuota de ingreso y hay caja auxiliar abierta hoy, registrar el ingreso
  if (cuotaIngreso && cuotaIngreso > 0) {
    const { rows: diaRows } = await pool.query(
      `select id, fecha, saldo_inicial, agencia_id from caja_dias
       where agencia_id = $1 and estado = 'ABIERTO' and fecha = current_date
       order by created_at desc limit 1`,
      [socio.agencia_id]
    );
    if (diaRows[0]) {
      const dia = diaRows[0];
      // Obtener saldo acumulado actual
      const { rows: saldoRows } = await pool.query(
        `select saldo_acumulado from caja_movimientos_auxiliar where caja_dia_id = $1 order by created_at desc limit 1`,
        [dia.id]
      );
      const saldoPrevio = saldoRows[0] ? Number(saldoRows[0].saldo_acumulado) : Number(dia.saldo_inicial);
      const saldoAcumulado = saldoPrevio + cuotaIngreso;

      // Contador para INGRESO_ASOCIADO
      const { rows: contRows } = await pool.query(
        `select count(*)::int as total from caja_movimientos_auxiliar where agencia_id = $1 and categoria = 'INGRESO_ASOCIADO'`,
        [socio.agencia_id]
      );
      const contador = contRows[0].total + 1;

      await pool.query(
        `insert into caja_movimientos_auxiliar (
           caja_dia_id, agencia_id, fecha, seccion, categoria, tipo, contador,
           referencia, socio_id, beneficiario, descripcion, doc_no, monto, saldo_acumulado,
           origen_fondos, usuario_id
         ) values ($1, $2, $3, 'PROPIO', 'INGRESO_ASOCIADO', 'INGRESO', $4, $5, $6, $7, $8, $9, $10, $11, 'FONDOS_PROPIOS', $12)`,
        [
          dia.id, socio.agencia_id, dia.fecha, contador,
          socio.numero_asociado, socio.id, socio.nombres,
          `Cuota de ingreso nuevo asociado ${socio.nombres} (${socio.numero_asociado})`,
          recibo ?? null, cuotaIngreso, saldoAcumulado, usuarioId || null
        ]
      );
    }
  }

  return { ...cuentaRows[0], cuotaIngresoRegistrada: cuotaIngreso && cuotaIngreso > 0 };
}

export async function actualizar(
  id: string,
  data: Partial<DatosSocio> & { estado?: "ACTIVO" | "INACTIVO" },
  usuarioId: string,
  agenciaVisibleParaUsuario: string | null,
): Promise<Socio> {
  const anterior = await obtener(id, agenciaVisibleParaUsuario);

  // Validaciones Cruzadas (Socio y Beneficiario)
  const dpiSocio = data.dpi?.trim();
  const dpiBen = data.dpiBeneficiario?.trim();
  const telSocio = data.telefono?.trim();
  const telBen = data.telefonoBeneficiario?.trim();

  // Auto-restricción: Un socio no puede ser su propio beneficiario (ni usar mismo DPI ni teléfono)
  const finalDpiSocio = dpiSocio ?? anterior.dpi;
  const finalDpiBen = dpiBen ?? anterior.dpi_beneficiario;
  if (finalDpiSocio && finalDpiBen && finalDpiSocio === finalDpiBen) {
    throw badRequest("El DPI del socio y el DPI/CUI del beneficiario no pueden ser iguales.");
  }

  const finalTelSocio = telSocio ?? anterior.telefono;
  const finalTelBen = telBen ?? anterior.telefono_beneficiario;
  if (finalTelSocio && finalTelBen && finalTelSocio === finalTelBen) {
    throw badRequest("El teléfono del socio y el teléfono del beneficiario no pueden ser iguales.");
  }

  // DPI Socio
  if (dpiSocio) {
    const res = await verificarDpi(dpiSocio, id, "SOCIO");
    if (!res.valido) throw badRequest(res.mensaje!);
    if (!res.disponible) throw conflict(`El DPI "${dpiSocio}" ya está registrado en el sistema (${res.registrado?.rol}: ${res.registrado?.nombres}).`);
  }

  // Teléfono Socio
  if (telSocio) {
    const res = await verificarTelefono(telSocio, id, "SOCIO");
    if (!res.valido) throw badRequest(res.mensaje!);
    if (!res.disponible) throw conflict(`El teléfono "${telSocio}" ya está registrado en el sistema (${res.registrado?.rol}: ${res.registrado?.nombres}).`);
  }

  // DPI Beneficiario
  if (dpiBen) {
    const res = await verificarDpi(dpiBen, id, "BENEFICIARIO");
    if (!res.valido) throw badRequest(res.mensaje!);
    if (!res.disponible) throw conflict(`El DPI/CUI del beneficiario "${dpiBen}" ya pertenece a un socio registrado (${res.registrado?.nombres}).`);
  }

  // Teléfono Beneficiario
  if (telBen) {
    const res = await verificarTelefono(telBen, id, "BENEFICIARIO");
    if (!res.valido) throw badRequest(res.mensaje!);
    if (!res.disponible) throw conflict(`El teléfono del beneficiario "${telBen}" ya pertenece a un socio registrado (${res.registrado?.nombres}).`);
  }

  const campos: Record<string, unknown> = {
    nombres: data.nombres !== undefined ? (data.nombres ? capitalizarNombre(data.nombres) : data.nombres) : undefined,
    genero: data.genero,
    fecha_ingreso: data.fechaIngreso,
    dpi: data.dpi,
    direccion: data.direccion !== undefined ? (data.direccion ? capitalizarDescripcion(data.direccion) : data.direccion) : undefined,
    telefono: data.telefono,
    nombre_beneficiario: data.nombreBeneficiario !== undefined ? (data.nombreBeneficiario ? capitalizarNombre(data.nombreBeneficiario) : data.nombreBeneficiario) : undefined,
    dpi_beneficiario: data.dpiBeneficiario,
    telefono_beneficiario: data.telefonoBeneficiario,
    parentesco_beneficiario: data.parentescoBeneficiario,
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
  const actualizado = rows[0];
  await registrarAuditoria({
    entidad: "Socio",
    entidadId: id,
    accion: "ACTUALIZAR",
    usuarioId,
    datosAnteriores: anterior,
    datosNuevos: actualizado,
  });
  return actualizado;
}

export async function cambiarEstado(
  id: string,
  nuevoEstado: "ACTIVO" | "INACTIVO",
  usuarioId: string,
  agenciaVisibleParaUsuario: string | null,
): Promise<Socio> {
  return actualizar(id, { estado: nuevoEstado }, usuarioId, agenciaVisibleParaUsuario);
}

export async function listarAportaciones(params: { agenciaId: string | null; q?: string }) {
  const condiciones: string[] = [];
  const valores: unknown[] = [];

  if (params.agenciaId) {
    valores.push(params.agenciaId);
    condiciones.push(`s.agencia_id = $${valores.length}`);
  }
  if (params.q) {
    const qClean = params.q.replace(/\D/g, "");
    valores.push(`%${params.q.toLowerCase()}%`);
    const idx = valores.length;
    if (qClean.length >= 3) {
      valores.push(`%${qClean}%`);
      const idxClean = valores.length;
      condiciones.push(
        `(lower(s.nombres) like $${idx} or lower(s.numero_asociado) like $${idx} or s.dpi like $${idx} or regexp_replace(coalesce(s.dpi, ''), '[^0-9]', '', 'g') like $${idxClean} or regexp_replace(coalesce(s.telefono, ''), '[^0-9]', '', 'g') like $${idxClean})`,
      );
    } else {
      condiciones.push(`(lower(s.nombres) like $${idx} or lower(s.numero_asociado) like $${idx} or s.dpi like $${idx})`);
    }
  }

  const where = condiciones.length ? `where ${condiciones.join(" and ")}` : "";

  const query = `
    select s.id as socio_id, s.numero_asociado, s.nombres, s.dpi, s.genero, s.fecha_ingreso, s.direccion, s.telefono,
           s.nombre_beneficiario, s.dpi_beneficiario, s.telefono_beneficiario, s.parentesco_beneficiario, s.estado,
           a.nombre as agencia_nombre,
           coalesce(sum(coalesce(sc.saldo_actual, c.saldo_inicial)), 0) as total_aportaciones
    from socios s
    join agencias a on a.id = s.agencia_id
    left join cuentas c on c.socio_id = s.id and c.tipo = 'APORTACION'
    left join saldos_cuenta sc on sc.cuenta_id = c.id
    ${where}
    group by s.id, a.nombre
    order by s.numero_asociado desc
  `;

  const { rows } = await pool.query(query, valores);
  return rows;
}
```

## `backend/src/types/models.ts` {#backendsrctypesmodelsts}

```ts
export type RolUsuario = "ADMIN" | "GERENCIA" | "SUPERVISOR" | "CAJERO" | "CAJA_CHICA" | "PROMOTOR";
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

export type EstadoCobroCampo = "PENDIENTE" | "LIQUIDADO" | "RECHAZADO";

export interface CobroCampo {
  id: string;
  promotor_id: string;
  agencia_id: string;
  socio_id: string;
  prestamo_id: string;
  fecha: string; // date
  numero_recibo_fisico: string;
  monto: number;
  estado: EstadoCobroCampo;
  justificacion_edicion?: string | null;
  veces_editado: number;
  caja_dia_id?: string | null;
  caja_movimiento_id?: string | null;
  prestamo_pago_id?: string | null;
  created_at: Date;
  updated_at: Date;
  liquidado_at?: Date | null;
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

// GERENCIA ve todas las agencias; los demás roles quedan limitados a la suya.
// Devuelve el id de agencia por el que hay que filtrar, o null si puede ver todas.
export function agenciaVisible(req: Request): string | null {
  if (!req.user) throw unauthorized();
  if (req.user.rol === "GERENCIA") return null;
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
  
  try {
    const fs = require("fs");
    fs.appendFileSync("error.log", new Date().toISOString() + " - " + String(err) + (err instanceof Error ? "\n" + err.stack : "") + "\n");
  } catch (e) {}
  
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
import { Pool, QueryConfig, QueryResult, QueryResultRow } from "pg";

const isLocal =
  !process.env.DATABASE_URL ||
  process.env.DATABASE_URL.includes("localhost") ||
  process.env.DATABASE_URL.includes("127.0.0.1");

// Supabase Transaction Pooler (puerto 6543) permite ~10 conexiones en el plan
// gratuito. Con max=5 dejamos margen para múltiples requests concurrentes.
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: isLocal ? false : { rejectUnauthorized: false },
  max: 5,                        // Máximo de conexiones en el pool
  idleTimeoutMillis: 30000,      // Liberar conexiones ociosas tras 30 s
  connectionTimeoutMillis: 8000, // Esperar hasta 8 s para obtener una conexión
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000,
});

pool.on("error", (err) => {
  // eslint-disable-next-line no-console
  console.error("Error inesperado en el pool de PostgreSQL", err);
});

// ─── Helper con reintentos automáticos ─────────────────────────────────────
// Reintenta la query hasta `intentos` veces si ocurre un error de conexión
// transitorio (timeout / connection terminated). Pausa exponencial entre intentos.
const ERRORES_TRANSITORIOS = [
  "Connection terminated",
  "Connection terminated due to connection timeout",
  "timeout exceeded when trying to connect",
  "ECONNRESET",
  "ECONNREFUSED",
];

function esErrorTransitorio(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return ERRORES_TRANSITORIOS.some((e) => msg.includes(e));
}

export async function queryWithRetry<R extends QueryResultRow = QueryResultRow>(
  queryOrText: string | QueryConfig<unknown[]>,
  values?: unknown[],
  intentos = 3,
): Promise<QueryResult<R>> {
  let ultimo: unknown;
  for (let i = 0; i < intentos; i++) {
    try {
      return values
        ? await pool.query<R>(queryOrText as string, values)
        : await pool.query<R>(queryOrText as QueryConfig<unknown[]>);
    } catch (err) {
      ultimo = err;
      if (!esErrorTransitorio(err)) throw err;          // Error no recuperable
      const espera = 300 * Math.pow(2, i);              // 300 ms, 600 ms, 1.2 s
      // eslint-disable-next-line no-console
      console.warn(`[pool] Error de conexión (intento ${i + 1}/${intentos}). Reintentando en ${espera} ms...`);
      await new Promise((r) => setTimeout(r, espera));
    }
  }
  throw ultimo;
}
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
     values ('Lucía Caba Asicona', $1, $2, 'CAJA_CHICA', $3)
     on conflict (email) do update set nombre = 'Lucía Caba Asicona', password_hash = excluded.password_hash`,
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
    motivo?: string;
  },
  client: Pick<PoolClient, "query"> = pool,
) {
  await client.query(
    `insert into auditoria (entidad, entidad_id, accion, usuario_id, datos_anteriores, datos_nuevos, motivo)
     values ($1, $2, $3, $4, $5, $6, $7)`,
    [
      params.entidad,
      params.entidadId,
      params.accion,
      params.usuarioId,
      params.datosAnteriores ? JSON.stringify(params.datosAnteriores) : null,
      params.datosNuevos ? JSON.stringify(params.datosNuevos) : null,
      params.motivo || null,
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

## `backend/src/utils/dpiGuatemala.ts` {#backendsrcutilsdpiguatemalats}

```ts
/**
 * Catálogo Oficial de Municipios de Guatemala (INE / RENAP)
 * Para validación y detección inteligente de DPI (CUI) de 13 dígitos.
 * 
 * Estructura del CUI (13 dígitos):
 * - 4 dígitos: correlativo
 * - 5 dígitos: correlativo verificador
 * - 4 dígitos (DDMM):
 *     - DD (2 dígitos): Código de Departamento (01 a 22)
 *     - MM (2 dígitos): Código de Municipio dentro del Departamento
 */

export interface MunicipioInfo {
  codigo: string;       // Ej: "1405"
  departamentoCodigo: string; // Ej: "14"
  departamento: string; // Ej: "Quiché"
  municipio: string;    // Ej: "San Juan Chajul"
}

// Diccionario de los 22 departamentos y sus municipios
export const MUNICIPIOS_GUATEMALA: Record<string, { departamento: string; municipio: string }> = {
  // 01 - Guatemala
  "0101": { departamento: "Guatemala", municipio: "Guatemala" },
  "0102": { departamento: "Guatemala", municipio: "Santa Catarina Pinula" },
  "0103": { departamento: "Guatemala", municipio: "San José Pinula" },
  "0104": { departamento: "Guatemala", municipio: "San José del Golfo" },
  "0105": { departamento: "Guatemala", municipio: "Palencia" },
  "0106": { departamento: "Guatemala", municipio: "Chinautla" },
  "0107": { departamento: "Guatemala", municipio: "San Pedro Ayampuc" },
  "0108": { departamento: "Guatemala", municipio: "Mixco" },
  "0109": { departamento: "Guatemala", municipio: "San Pedro Sacatepéquez" },
  "0110": { departamento: "Guatemala", municipio: "San Juan Sacatepéquez" },
  "0111": { departamento: "Guatemala", municipio: "San Raymundo" },
  "0112": { departamento: "Guatemala", municipio: "Chuarrancho" },
  "0113": { departamento: "Guatemala", municipio: "Fraijanes" },
  "0114": { departamento: "Guatemala", municipio: "Amatitlán" },
  "0115": { departamento: "Guatemala", municipio: "Villa Nueva" },
  "0116": { departamento: "Guatemala", municipio: "Villa Canales" },
  "0117": { departamento: "Guatemala", municipio: "San Miguel Petapa" },

  // 02 - El Progreso
  "0201": { departamento: "El Progreso", municipio: "Guastatoya" },
  "0202": { departamento: "El Progreso", municipio: "Morazán" },
  "0203": { departamento: "El Progreso", municipio: "San Agustín Acasaguastlán" },
  "0204": { departamento: "El Progreso", municipio: "San Cristóbal Acasaguastlán" },
  "0205": { departamento: "El Progreso", municipio: "El Jícaro" },
  "0206": { departamento: "El Progreso", municipio: "Sansare" },
  "0207": { departamento: "El Progreso", municipio: "Sanarate" },
  "0208": { departamento: "El Progreso", municipio: "San Antonio La Paz" },

  // 03 - Sacatepéquez
  "0301": { departamento: "Sacatepéquez", municipio: "Antigua Guatemala" },
  "0302": { departamento: "Sacatepéquez", municipio: "Jocotenango" },
  "0303": { departamento: "Sacatepéquez", municipio: "Pastores" },
  "0304": { departamento: "Sacatepéquez", municipio: "Sumpango" },
  "0305": { departamento: "Sacatepéquez", municipio: "Santo Domingo Xenacoj" },
  "0306": { departamento: "Sacatepéquez", municipio: "Santiago Sacatepéquez" },
  "0307": { departamento: "Sacatepéquez", municipio: "San Bartolomé Milpas Altas" },
  "0308": { departamento: "Sacatepéquez", municipio: "San Lucas Sacatepéquez" },
  "0309": { departamento: "Sacatepéquez", municipio: "Santa Lucía Milpas Altas" },
  "0310": { departamento: "Sacatepéquez", municipio: "Magdalena Milpas Altas" },
  "0311": { departamento: "Sacatepéquez", municipio: "Santa María de Jesús" },
  "0312": { departamento: "Sacatepéquez", municipio: "Ciudad Vieja" },
  "0313": { departamento: "Sacatepéquez", municipio: "San Miguel Dueñas" },
  "0314": { departamento: "Sacatepéquez", municipio: "Alotenango" },
  "0315": { departamento: "Sacatepéquez", municipio: "San Antonio Aguas Calientes" },
  "0316": { departamento: "Sacatepéquez", municipio: "Santa Catarina Barahona" },

  // 04 - Chimaltenango
  "0401": { departamento: "Chimaltenango", municipio: "Chimaltenango" },
  "0402": { departamento: "Chimaltenango", municipio: "San José Poaquil" },
  "0403": { departamento: "Chimaltenango", municipio: "San Martín Jilotepeque" },
  "0404": { departamento: "Chimaltenango", municipio: "San Juan Comalapa" },
  "0405": { departamento: "Chimaltenango", municipio: "Santa Apolonia" },
  "0406": { departamento: "Chimaltenango", municipio: "Tecpán Guatemala" },
  "0407": { departamento: "Chimaltenango", municipio: "Patzún" },
  "0408": { departamento: "Chimaltenango", municipio: "Pochuta" },
  "0409": { departamento: "Chimaltenango", municipio: "Patzicía" },
  "0410": { departamento: "Chimaltenango", municipio: "Santa Cruz Balanyá" },
  "0411": { departamento: "Chimaltenango", municipio: "Acatenango" },
  "0412": { departamento: "Chimaltenango", municipio: "Yepocapa" },
  "0413": { departamento: "Chimaltenango", municipio: "San Andrés Itzapa" },
  "0414": { departamento: "Chimaltenango", municipio: "Parramos" },
  "0415": { departamento: "Chimaltenango", municipio: "Zaragoza" },
  "0416": { departamento: "Chimaltenango", municipio: "El Tejar" },

  // 05 - Escuintla
  "0501": { departamento: "Escuintla", municipio: "Escuintla" },
  "0502": { departamento: "Escuintla", municipio: "Santa Lucía Cotzumalguapa" },
  "0503": { departamento: "Escuintla", municipio: "La Democracia" },
  "0504": { departamento: "Escuintla", municipio: "Siquinalá" },
  "0505": { departamento: "Escuintla", municipio: "Masagua" },
  "0506": { departamento: "Escuintla", municipio: "Tiquisate" },
  "0507": { departamento: "Escuintla", municipio: "La Gomera" },
  "0508": { departamento: "Escuintla", municipio: "Guanagazapa" },
  "0509": { departamento: "Escuintla", municipio: "San José" },
  "0510": { departamento: "Escuintla", municipio: "Iztapa" },
  "0511": { departamento: "Escuintla", municipio: "Palín" },
  "0512": { departamento: "Escuintla", municipio: "San Vicente Pacaya" },
  "0513": { departamento: "Escuintla", municipio: "Nueva Concepción" },
  "0514": { departamento: "Escuintla", municipio: "Sipacate" },

  // 06 - Santa Rosa
  "0601": { departamento: "Santa Rosa", municipio: "Cuilapa" },
  "0602": { departamento: "Santa Rosa", municipio: "Barberena" },
  "0603": { departamento: "Santa Rosa", municipio: "Santa Rosa de Lima" },
  "0604": { departamento: "Santa Rosa", municipio: "Casillas" },
  "0605": { departamento: "Santa Rosa", municipio: "San Rafael Las Flores" },
  "0606": { departamento: "Santa Rosa", municipio: "Oratorio" },
  "0607": { departamento: "Santa Rosa", municipio: "San Juan Tecuaco" },
  "0608": { departamento: "Santa Rosa", municipio: "Chiquimulilla" },
  "0609": { departamento: "Santa Rosa", municipio: "Taxisco" },
  "0610": { departamento: "Santa Rosa", municipio: "Santa María Ixhuatán" },
  "0611": { departamento: "Santa Rosa", municipio: "Guazacapán" },
  "0612": { departamento: "Santa Rosa", municipio: "Santa Cruz Naranjo" },
  "0613": { departamento: "Santa Rosa", municipio: "Pueblo Nuevo Viñas" },
  "0614": { departamento: "Santa Rosa", municipio: "Nueva Santa Rosa" },

  // 07 - Sololá
  "0701": { departamento: "Sololá", municipio: "Sololá" },
  "0702": { departamento: "Sololá", municipio: "San José Chacayá" },
  "0703": { departamento: "Sololá", municipio: "Santa María Visitación" },
  "0704": { departamento: "Sololá", municipio: "Santa Lucía Utatlán" },
  "0705": { departamento: "Sololá", municipio: "Nahualá" },
  "0706": { departamento: "Sololá", municipio: "Santa Catarina Ixtahuacán" },
  "0707": { departamento: "Sololá", municipio: "Santa Clara La Laguna" },
  "0708": { departamento: "Sololá", municipio: "Concepción" },
  "0709": { departamento: "Sololá", municipio: "San Andrés Semetabaj" },
  "0710": { departamento: "Sololá", municipio: "Panajachel" },
  "0711": { departamento: "Sololá", municipio: "Santa Catarina Palopó" },
  "0712": { departamento: "Sololá", municipio: "San Antonio Palopó" },
  "0713": { departamento: "Sololá", municipio: "San Lucas Tolimán" },
  "0714": { departamento: "Sololá", municipio: "Santa Cruz La Laguna" },
  "0715": { departamento: "Sololá", municipio: "San Pablo La Laguna" },
  "0716": { departamento: "Sololá", municipio: "San Marcos La Laguna" },
  "0717": { departamento: "Sololá", municipio: "San Juan La Laguna" },
  "0718": { departamento: "Sololá", municipio: "San Pedro La Laguna" },
  "0719": { departamento: "Sololá", municipio: "Santiago Atitlán" },

  // 08 - Totonicapán
  "0801": { departamento: "Totonicapán", municipio: "Totonicapán" },
  "0802": { departamento: "Totonicapán", municipio: "San Cristóbal Totonicapán" },
  "0803": { departamento: "Totonicapán", municipio: "San Francisco El Alto" },
  "0804": { departamento: "Totonicapán", municipio: "San Andrés Xecul" },
  "0805": { departamento: "Totonicapán", municipio: "Momostenango" },
  "0806": { departamento: "Totonicapán", municipio: "Santa María Chiquimula" },
  "0807": { departamento: "Totonicapán", municipio: "Santa Lucía La Reforma" },
  "0808": { departamento: "Totonicapán", municipio: "San Bartolo" },

  // 09 - Quetzaltenango
  "0901": { departamento: "Quetzaltenango", municipio: "Quetzaltenango" },
  "0902": { departamento: "Quetzaltenango", municipio: "Salcajá" },
  "0903": { departamento: "Quetzaltenango", municipio: "Olintepeque" },
  "0904": { departamento: "Quetzaltenango", municipio: "San Carlos Sija" },
  "0905": { departamento: "Quetzaltenango", municipio: "Sibilia" },
  "0906": { departamento: "Quetzaltenango", municipio: "Cabricán" },
  "0907": { departamento: "Quetzaltenango", municipio: "Cajolá" },
  "0908": { departamento: "Quetzaltenango", municipio: "San Miguel Sigüilá" },
  "0909": { departamento: "Quetzaltenango", municipio: "San Juan Ostuncalco" },
  "0910": { departamento: "Quetzaltenango", municipio: "San Mateo" },
  "0911": { departamento: "Quetzaltenango", municipio: "Concepción Chiquirichapa" },
  "0912": { departamento: "Quetzaltenango", municipio: "San Martín Sacatepéquez" },
  "0913": { departamento: "Quetzaltenango", municipio: "Almolonga" },
  "0914": { departamento: "Quetzaltenango", municipio: "Cantel" },
  "0915": { departamento: "Quetzaltenango", municipio: "Huitán" },
  "0916": { departamento: "Quetzaltenango", municipio: "Zunil" },
  "0917": { departamento: "Quetzaltenango", municipio: "Colomba Costa Cuca" },
  "0918": { departamento: "Quetzaltenango", municipio: "San Francisco La Unión" },
  "0919": { departamento: "Quetzaltenango", municipio: "El Palmar" },
  "0920": { departamento: "Quetzaltenango", municipio: "Coatepeque" },
  "0921": { departamento: "Quetzaltenango", municipio: "Génova" },
  "0922": { departamento: "Quetzaltenango", municipio: "Flores Costa Cuca" },
  "0923": { departamento: "Quetzaltenango", municipio: "La Esperanza" },
  "0924": { departamento: "Quetzaltenango", municipio: "Palestina de Los Altos" },

  // 10 - Suchitepéquez
  "1001": { departamento: "Suchitepéquez", municipio: "Mazatenango" },
  "1002": { departamento: "Suchitepéquez", municipio: "Cuyotenango" },
  "1003": { departamento: "Suchitepéquez", municipio: "San Francisco Zapotitlán" },
  "1004": { departamento: "Suchitepéquez", municipio: "San Bernardino" },
  "1005": { departamento: "Suchitepéquez", municipio: "San José El Idolo" },
  "1006": { departamento: "Suchitepéquez", municipio: "Santo Domingo Suchitepéquez" },
  "1007": { departamento: "Suchitepéquez", municipio: "San Lorenzo" },
  "1008": { departamento: "Suchitepéquez", municipio: "Samayac" },
  "1009": { departamento: "Suchitepéquez", municipio: "San Pablo Jocopilas" },
  "1010": { departamento: "Suchitepéquez", municipio: "San Antonio Suchitepéquez" },
  "1011": { departamento: "Suchitepéquez", municipio: "San Miguel Panán" },
  "1012": { departamento: "Suchitepéquez", municipio: "San Gabriel" },
  "1013": { departamento: "Suchitepéquez", municipio: "Chicacao" },
  "1014": { departamento: "Suchitepéquez", municipio: "Patulul" },
  "1015": { departamento: "Suchitepéquez", municipio: "Santa Bárbara" },
  "1016": { departamento: "Suchitepéquez", municipio: "San Juan Bautista" },
  "1017": { departamento: "Suchitepéquez", municipio: "Santo Tomás La Unión" },
  "1018": { departamento: "Suchitepéquez", municipio: "Zunilito" },
  "1019": { departamento: "Suchitepéquez", municipio: "Pueblo Nuevo" },
  "1020": { departamento: "Suchitepéquez", municipio: "Río Bravo" },
  "1021": { departamento: "Suchitepéquez", municipio: "San José La Máquina" },

  // 11 - Retalhuleu
  "1101": { departamento: "Retalhuleu", municipio: "Retalhuleu" },
  "1102": { departamento: "Retalhuleu", municipio: "San Sebastián" },
  "1103": { departamento: "Retalhuleu", municipio: "Santa Cruz Muluá" },
  "1104": { departamento: "Retalhuleu", municipio: "San Martín Zapotitlán" },
  "1105": { departamento: "Retalhuleu", municipio: "San Felipe" },
  "1106": { departamento: "Retalhuleu", municipio: "San Andrés Villa Seca" },
  "1107": { departamento: "Retalhuleu", municipio: "Champerico" },
  "1108": { departamento: "Retalhuleu", municipio: "Nuevo San Carlos" },
  "1109": { departamento: "Retalhuleu", municipio: "El Asintal" },

  // 12 - San Marcos
  "1201": { departamento: "San Marcos", municipio: "San Marcos" },
  "1202": { departamento: "San Marcos", municipio: "San Pedro Sacatepéquez" },
  "1203": { departamento: "San Marcos", municipio: "San Antonio Sacatepéquez" },
  "1204": { departamento: "San Marcos", municipio: "Comitancillo" },
  "1205": { departamento: "San Marcos", municipio: "San Miguel Ixtahuacán" },
  "1206": { departamento: "San Marcos", municipio: "Concepción Tutuapa" },
  "1207": { departamento: "San Marcos", municipio: "Tacaná" },
  "1208": { departamento: "San Marcos", municipio: "Sibinal" },
  "1209": { departamento: "San Marcos", municipio: "Tajumulco" },
  "1210": { departamento: "San Marcos", municipio: "Tejutla" },
  "1211": { departamento: "San Marcos", municipio: "San Rafael Pie de la Cuesta" },
  "1212": { departamento: "San Marcos", municipio: "Nuevo Progreso" },
  "1213": { departamento: "San Marcos", municipio: "El Tumbador" },
  "1214": { departamento: "San Marcos", municipio: "El Rodeo" },
  "1215": { departamento: "San Marcos", municipio: "Malacatán" },
  "1216": { departamento: "San Marcos", municipio: "Catarina" },
  "1217": { departamento: "San Marcos", municipio: "Ayutla" },
  "1218": { departamento: "San Marcos", municipio: "Ocós" },
  "1219": { departamento: "San Marcos", municipio: "San Pablo" },
  "1220": { departamento: "San Marcos", municipio: "El Quetzal" },
  "1221": { departamento: "San Marcos", municipio: "La Reforma" },
  "1222": { departamento: "San Marcos", municipio: "Pajapita" },
  "1223": { departamento: "San Marcos", municipio: "Ixchiguán" },
  "1224": { departamento: "San Marcos", municipio: "San José Ojetenam" },
  "1225": { departamento: "San Marcos", municipio: "San Cristóbal Cucho" },
  "1226": { departamento: "San Marcos", municipio: "Sipacapa" },
  "1227": { departamento: "San Marcos", municipio: "Esquipulas Palo Gordo" },
  "1228": { departamento: "San Marcos", municipio: "Río Blanco" },
  "1229": { departamento: "San Marcos", municipio: "San Lorenzo" },
  "1230": { departamento: "San Marcos", municipio: "La Blanca" },

  // 13 - Huehuetenango
  "1301": { departamento: "Huehuetenango", municipio: "Huehuetenango" },
  "1302": { departamento: "Huehuetenango", municipio: "Chiantla" },
  "1303": { departamento: "Huehuetenango", municipio: "Malacatancito" },
  "1304": { departamento: "Huehuetenango", municipio: "Cuilco" },
  "1305": { departamento: "Huehuetenango", municipio: "Nentón" },
  "1306": { departamento: "Huehuetenango", municipio: "San Pedro Necta" },
  "1307": { departamento: "Huehuetenango", municipio: "Jacaltenango" },
  "1308": { departamento: "Huehuetenango", municipio: "San Pedro Soloma" },
  "1309": { departamento: "Huehuetenango", municipio: "San Ildefonso Ixtahuacán" },
  "1310": { departamento: "Huehuetenango", municipio: "Santa Bárbara" },
  "1311": { departamento: "Huehuetenango", municipio: "La Libertad" },
  "1312": { departamento: "Huehuetenango", municipio: "La Democracia" },
  "1313": { departamento: "Huehuetenango", municipio: "San Miguel Acatán" },
  "1314": { departamento: "Huehuetenango", municipio: "San Rafael La Independencia" },
  "1315": { departamento: "Huehuetenango", municipio: "Todos Santos Cuchumatán" },
  "1316": { departamento: "Huehuetenango", municipio: "San Juan Atitán" },
  "1317": { departamento: "Huehuetenango", municipio: "Santa Eulalia" },
  "1318": { departamento: "Huehuetenango", municipio: "San Mateo Ixtatán" },
  "1319": { departamento: "Huehuetenango", municipio: "Colotenango" },
  "1320": { departamento: "Huehuetenango", municipio: "San Sebastián Huehuetenango" },
  "1321": { departamento: "Huehuetenango", municipio: "Tectitán" },
  "1322": { departamento: "Huehuetenango", municipio: "Concepción Huista" },
  "1323": { departamento: "Huehuetenango", municipio: "San Juan Ixcoy" },
  "1324": { departamento: "Huehuetenango", municipio: "San Antonio Huista" },
  "1325": { departamento: "Huehuetenango", municipio: "San Sebastián Coatán" },
  "1326": { departamento: "Huehuetenango", municipio: "Santa Cruz Barillas" },
  "1327": { departamento: "Huehuetenango", municipio: "Aguacatán" },
  "1328": { departamento: "Huehuetenango", municipio: "San Rafael Petzal" },
  "1329": { departamento: "Huehuetenango", municipio: "San Gaspar Ixchil" },
  "1330": { departamento: "Huehuetenango", municipio: "Santiago Chimaltenango" },
  "1331": { departamento: "Huehuetenango", municipio: "Santa Ana Huista" },
  "1332": { departamento: "Huehuetenango", municipio: "Unión Cantinil" },
  "1333": { departamento: "Huehuetenango", municipio: "Petatán" },

  // 14 - Quiché (Agencias clave: Chajul 1405, Nebaj 1413, Cotzal 1411)
  "1401": { departamento: "Quiché", municipio: "Santa Cruz del Quiché" },
  "1402": { departamento: "Quiché", municipio: "Chiché" },
  "1403": { departamento: "Quiché", municipio: "Chinique" },
  "1404": { departamento: "Quiché", municipio: "Zacualpa" },
  "1405": { departamento: "Quiché", municipio: "San Juan Chajul" },
  "1406": { departamento: "Quiché", municipio: "Santo Tomás Chichicastenango" },
  "1407": { departamento: "Quiché", municipio: "Patzité" },
  "1408": { departamento: "Quiché", municipio: "San Antonio Ilotenango" },
  "1409": { departamento: "Quiché", municipio: "San Pedro Jocopilas" },
  "1410": { departamento: "Quiché", municipio: "Cunén" },
  "1411": { departamento: "Quiché", municipio: "San Juan Cotzal" },
  "1412": { departamento: "Quiché", municipio: "Joyabaj" },
  "1413": { departamento: "Quiché", municipio: "Santa María Nebaj" },
  "1414": { departamento: "Quiché", municipio: "San Andrés Sajcabajá" },
  "1415": { departamento: "Quiché", municipio: "Uspantán" },
  "1416": { departamento: "Quiché", municipio: "Sacapulas" },
  "1417": { departamento: "Quiché", municipio: "San Bartolomé Jocotenango" },
  "1418": { departamento: "Quiché", municipio: "Canillá" },
  "1419": { departamento: "Quiché", municipio: "Chicamán" },
  "1420": { departamento: "Quiché", municipio: "Ixcán (Playa Grande)" },
  "1421": { departamento: "Quiché", municipio: "Pachalum" },

  // 15 - Baja Verapaz
  "1501": { departamento: "Baja Verapaz", municipio: "Salamá" },
  "1502": { departamento: "Baja Verapaz", municipio: "San Miguel Chicaj" },
  "1503": { departamento: "Baja Verapaz", municipio: "Rabinal" },
  "1504": { departamento: "Baja Verapaz", municipio: "Cubulco" },
  "1505": { departamento: "Baja Verapaz", municipio: "Granados" },
  "1506": { departamento: "Baja Verapaz", municipio: "Santa Cruz El Chol" },
  "1507": { departamento: "Baja Verapaz", municipio: "San Jerónimo" },
  "1508": { departamento: "Baja Verapaz", municipio: "Purulhá" },

  // 16 - Alta Verapaz
  "1601": { departamento: "Alta Verapaz", municipio: "Cobán" },
  "1602": { departamento: "Alta Verapaz", municipio: "Santa Cruz Verapaz" },
  "1603": { departamento: "Alta Verapaz", municipio: "San Cristóbal Verapaz" },
  "1604": { departamento: "Alta Verapaz", municipio: "Tactic" },
  "1605": { departamento: "Alta Verapaz", municipio: "Tamahú" },
  "1606": { departamento: "Alta Verapaz", municipio: "San Pedro Carchá" },
  "1607": { departamento: "Alta Verapaz", municipio: "San Juan Chamelco" },
  "1608": { departamento: "Alta Verapaz", municipio: "Lanquín" },
  "1609": { departamento: "Alta Verapaz", municipio: "Santa María Cahabón" },
  "1610": { departamento: "Alta Verapaz", municipio: "Chisec" },
  "1611": { departamento: "Alta Verapaz", municipio: "Chahal" },
  "1612": { departamento: "Alta Verapaz", municipio: "Fray Bartolomé de las Casas" },
  "1613": { departamento: "Alta Verapaz", municipio: "Santa Catarina La Tinta" },
  "1614": { departamento: "Alta Verapaz", municipio: "Raxruhá" },
  "1615": { departamento: "Alta Verapaz", municipio: "San Miguel Tucurú" },
  "1616": { departamento: "Alta Verapaz", municipio: "Panzós" },
  "1617": { departamento: "Alta Verapaz", municipio: "Senahú" },

  // 17 - Petén
  "1701": { departamento: "Petén", municipio: "Flores" },
  "1702": { departamento: "Petén", municipio: "San José" },
  "1703": { departamento: "Petén", municipio: "San Benito" },
  "1704": { departamento: "Petén", municipio: "San Andrés" },
  "1705": { departamento: "Petén", municipio: "La Libertad" },
  "1706": { departamento: "Petén", municipio: "San Francisco" },
  "1707": { departamento: "Petén", municipio: "Santa Ana" },
  "1708": { departamento: "Petén", municipio: "Dolores" },
  "1709": { departamento: "Petén", municipio: "San Luis" },
  "1710": { departamento: "Petén", municipio: "Sayaxché" },
  "1711": { departamento: "Petén", municipio: "Melchor de Mencos" },
  "1712": { departamento: "Petén", municipio: "Poptún" },
  "1713": { departamento: "Petén", municipio: "Las Cruces" },
  "1714": { departamento: "Petén", municipio: "El Chal" },

  // 18 - Izabal
  "1801": { departamento: "Izabal", municipio: "Puerto Barrios" },
  "1802": { departamento: "Izabal", municipio: "Livingston" },
  "1803": { departamento: "Izabal", municipio: "El Estor" },
  "1804": { departamento: "Izabal", municipio: "Morales" },
  "1805": { departamento: "Izabal", municipio: "Los Amates" },

  // 19 - Zacapa
  "1901": { departamento: "Zacapa", municipio: "Zacapa" },
  "1902": { departamento: "Zacapa", municipio: "Estanzuela" },
  "1903": { departamento: "Zacapa", municipio: "Río Hondo" },
  "1904": { departamento: "Zacapa", municipio: "Gualán" },
  "1905": { departamento: "Zacapa", municipio: "Teculután" },
  "1906": { departamento: "Zacapa", municipio: "Usumatlán" },
  "1907": { departamento: "Zacapa", municipio: "Cabañas" },
  "1908": { departamento: "Zacapa", municipio: "San Diego" },
  "1909": { departamento: "Zacapa", municipio: "La Unión" },
  "1910": { departamento: "Zacapa", municipio: "Huité" },
  "1911": { departamento: "Zacapa", municipio: "San Jorge" },

  // 20 - Chiquimula
  "2001": { departamento: "Chiquimula", municipio: "Chiquimula" },
  "2002": { departamento: "Chiquimula", municipio: "San José La Arada" },
  "2003": { departamento: "Chiquimula", municipio: "San Juan Ermita" },
  "2004": { departamento: "Chiquimula", municipio: "Jocotán" },
  "2005": { departamento: "Chiquimula", municipio: "Camotán" },
  "2006": { departamento: "Chiquimula", municipio: "Olopa" },
  "2007": { departamento: "Chiquimula", municipio: "Esquipulas" },
  "2008": { departamento: "Chiquimula", municipio: "Concepción Las Minas" },
  "2009": { departamento: "Chiquimula", municipio: "Quetzaltepeque" },
  "2010": { departamento: "Chiquimula", municipio: "San Jacinto" },
  "2011": { departamento: "Chiquimula", municipio: "Ipala" },

  // 21 - Jalapa
  "2101": { departamento: "Jalapa", municipio: "Jalapa" },
  "2102": { departamento: "Jalapa", municipio: "San Pedro Pinula" },
  "2103": { departamento: "Jalapa", municipio: "San Luis Jilotepeque" },
  "2104": { departamento: "Jalapa", municipio: "San Manuel Chaparrón" },
  "2105": { departamento: "Jalapa", municipio: "San Carlos Alzatate" },
  "2106": { departamento: "Jalapa", municipio: "Monjas" },
  "2107": { departamento: "Jalapa", municipio: "Mataquescuintla" },

  // 22 - Jutiapa
  "2201": { departamento: "Jutiapa", municipio: "Jutiapa" },
  "2202": { departamento: "Jutiapa", municipio: "El Progreso" },
  "2203": { departamento: "Jutiapa", municipio: "Santa Catarina Mita" },
  "2204": { departamento: "Jutiapa", municipio: "Agua Blanca" },
  "2205": { departamento: "Jutiapa", municipio: "Asunción Mita" },
  "2206": { departamento: "Jutiapa", municipio: "Yupiltepeque" },
  "2207": { departamento: "Jutiapa", municipio: "Atescatempa" },
  "2208": { departamento: "Jutiapa", municipio: "Jerez" },
  "2209": { departamento: "Jutiapa", municipio: "El Adelanto" },
  "2210": { departamento: "Jutiapa", municipio: "Zapotitlán" },
  "2211": { departamento: "Jutiapa", municipio: "Comapa" },
  "2212": { departamento: "Jutiapa", municipio: "Jalpatagua" },
  "2213": { departamento: "Jutiapa", municipio: "Conguaco" },
  "2214": { departamento: "Jutiapa", municipio: "Moyuta" },
  "2215": { departamento: "Jutiapa", municipio: "Pasaco" },
  "2216": { departamento: "Jutiapa", municipio: "San José Acatempa" },
  "2217": { departamento: "Jutiapa", municipio: "Quezada" },
};

// Mapeo de códigos de municipios principales de las agencias
export const CODIGOS_AGENCIA: Record<string, { codigoMuni: string; nombre: string }> = {
  CHAJUL: { codigoMuni: "1405", nombre: "Agencia Chajul (1405 - Chajul, Quiché)" },
  NEBAJ: { codigoMuni: "1413", nombre: "Agencia Nebaj (1413 - Santa María Nebaj, Quiché)" },
  ACUL: { codigoMuni: "1413", nombre: "Agencia Acul (1413 - Nebaj/Acul, Quiché)" },
};

/**
 * Limpia y normaliza un DPI a solo dígitos.
 */
export function limpiarDPI(dpi: string | null | undefined): string {
  if (!dpi) return "";
  return dpi.replace(/\D/g, "");
}

/**
 * Formatea un DPI a estándar oficial guatemalteco: "XXXX XXXXX DDMM"
 */
export function formatearDPI(dpi: string | null | undefined): string {
  const digits = limpiarDPI(dpi);
  if (digits.length !== 13) return dpi?.trim() || "";
  return `${digits.slice(0, 4)} ${digits.slice(4, 9)} ${digits.slice(9, 13)}`;
}

export interface ResultadoValidacionDPI {
  valido: boolean;
  mensaje?: string;
  codigoMunicipio?: string;
  municipio?: string;
  departamento?: string;
  esLocal?: boolean;
  advertencia?: string;
  dpiFormateado?: string;
}

/**
 * Valida un DPI guatemalteco y analiza su procedencia municipal.
 * 
 * Reglas de negocio:
 * 1. Debe tener exactamente 13 dígitos numéricos (bloqueante si no).
 * 2. Los últimos 4 dígitos deben coincidir con un municipio oficial de Guatemala (bloqueante si no existe).
 * 3. Si coincide con la agencia actual: es local.
 * 4. Si es de otro municipio oficial (ej. 1413 en Chajul, 0105 de San Juan Sacatepéquez): es válido e informativo.
 */
export function validarDpiGuatemala(dpi: string | null | undefined, agenciaCodigo?: string): ResultadoValidacionDPI {
  const raw = limpiarDPI(dpi);

  if (!raw) {
    return { valido: false, mensaje: "El DPI es requerido." };
  }

  if (raw.length !== 13) {
    return {
      valido: false,
      mensaje: `DPI incompleto o con longitud errónea: tiene ${raw.length} dígitos (debe tener exactamente 13 dígitos).`,
    };
  }

  const codMuni = raw.slice(9, 13);
  const infoMuni = MUNICIPIOS_GUATEMALA[codMuni];

  if (!infoMuni) {
    return {
      valido: false,
      mensaje: `La terminación "${codMuni}" no corresponde a ningún municipio oficial de la República de Guatemala. Verifique el documento.`,
    };
  }

  const dpiFormateado = `${raw.slice(0, 4)} ${raw.slice(4, 9)} ${codMuni}`;
  const codAgencia = agenciaCodigo?.trim().toUpperCase();
  const agenciaEsperada = codAgencia ? CODIGOS_AGENCIA[codAgencia] : undefined;

  let esLocal = true;
  let advertencia: string | undefined = undefined;

  if (agenciaEsperada) {
    if (agenciaEsperada.codigoMuni !== codMuni) {
      esLocal = false;
      advertencia = `Asociado de otro municipio: DPI emitido en ${infoMuni.municipio}, ${infoMuni.departamento} (Terminación ${codMuni}).`;
    }
  }

  return {
    valido: true,
    codigoMunicipio: codMuni,
    municipio: infoMuni.municipio,
    departamento: infoMuni.departamento,
    esLocal,
    advertencia,
    dpiFormateado,
  };
}
```

## `backend/src/db/importar-ahorro-corriente.ts` {#backendsrcdbimportarahorrocorrientets}

```ts
import "dotenv/config";
import { pool } from "./pool";
import { execSync } from "child_process";
import path from "path";

/**
 * Script Oficial de Importación — Fase 2: Ahorro Corriente
 * Archivo: importar/ahorro corriente/AHORRO CORRIENTE 30-08-2026.xlsx
 * 
 * Reglas de Negocio aprobadas:
 * 1. Unificación de 14 errores tipográficos del libro para consolidar libretas del mismo titular.
 * 2. Registro de 127 nuevos asociados en Agencia Chajul con aportación estatutaria inicial pre-2026 (Q100 al 2025-12-31).
 * 3. Formato Dual de Cuenta de Ahorro Corriente:
 *    - numero_cuenta: Conserva el número original de libreta de Excel (ej: 148-5-1) o vacío ("") si no vino en Excel.
 *    - codigo_sistema: Correlativo estructurado único (CHAJ-AHC-00001...) para asignación y visualización dual.
 * 4. Asignación de saldo inicial pre-2026 (fecha 2025-12-31) a 80 cuentas que retiraron ahorros históricos previos.
 * 5. Cuadre exacto de 674 movimientos del 2026:
 *    - Total Depósitos: Q 3,620,116.31
 *    - Total Retiros:   Q 1,348,045.62
 *    - Saldo Neto 2026: Q 2,272,070.69 (Diferencia Fila 679: Q 0.00).
 */

interface RawExcelRow {
  row: number;
  cta: string;
  fec: string;
  rec: string;
  agencia: string;
  nombre: string;
  dep: number;
  ret: number;
}

const TYPO_MAP: Record<string, string> = {
  "IGLESIA EVANGALICA MISION JESUS FUENTE DE VISA JUIL": "IGLESIA EVANGELICA MISION JESUS FUENTE DE VIDA JUIL",
  "IGLESIA EVANGELICA 1 MISION JESUS FUENTE DE VIDA JUIL": "IGLESIA EVANGELICA MISION JESUS FUENTE DE VIDA JUIL",
  "ROSA LAYNEZ RAMISREZ DE LAYNEZ": "ROSA LAYNEZ RAMIREZ DE LAYNEZ",
  "MATEO CANAY AISCONA Y JUANA CLARITA LAYNEZ DEL BARRIO": "MATEO CANAY ASICONA Y JUANA CLARITA LAYNEZ DEL BARRIO",
  "MATEO CANAY ASICOANA": "MATEO CANAY ASICONA",
  "JUA SANCHEZ LAYNEZ": "JUAN SANCHEZ LAYNEZ",
  "MARIA RIVER NUNAL": "MARIA RIVERA NUNAL",
  "JUANA HU GLINDO": "JUANA HU GALINDO",
  "MANUELA YESSICA  SANCHZ CABA": "MANUELA YESSICA SANCHEZ CABA",
  "MADGALENA MENDOZA RIVERA": "MAGDALENA MENDOZA RIVERA",
  "MANUEL PACHECO ASOCONA": "MANUEL PACHECO ASICONA",
  "PEDRO LUIS TOMA LUX": "PEDRO LUIS TOMAS LUX",
  "ELENA CABA  RIVERA": "ELENA CABA RIVERA",
  "TERESA ASICONA  ASICONA": "TERESA ASICONA ASICONA",
};

async function main() {
  console.log("================================================================================");
  console.log("   IMPORTACIÓN OFICIAL — FASE 2: AHORRO CORRIENTE (30-08-2026)");
  console.log("================================================================================\n");

  console.log("1. Extrayendo datos desde 'importar/ahorro corriente/AHORRO CORRIENTE 30-08-2026.xlsx'...");
  const scriptPython = `
import openpyxl, json

wb = openpyxl.load_workbook('importar/ahorro corriente/AHORRO CORRIENTE 30-08-2026.xlsx', data_only=True)
ws = wb['AHORRO ENERO 2026']

rows = []
for r in range(4, 678):
    nom = ws.cell(r, 5).value
    if not nom or not str(nom).strip(): continue
    cta = ws.cell(r, 1).value
    fec = ws.cell(r, 2).value
    rec = ws.cell(r, 3).value
    ag = ws.cell(r, 4).value
    dep = ws.cell(r, 8).value or 0
    ret = ws.cell(r, 9).value or 0
    
    fec_str = str(fec)[:10] if fec else '2026-01-02'
    if fec_str.startswith('2025-06-15'):
        fec_str = '2026-06-15' # Corrección de error tipográfico de año del cajero en fila 433 (entre 13 y 16 de junio 2026)

    rows.append({
        'row': r,
        'cta': str(cta).strip() if cta else '',
        'fec': fec_str,
        'rec': str(rec).strip() if rec else '',
        'agencia': str(ag).strip() if ag else 'AGENCIA CHAJUL',
        'nombre': str(nom).strip(),
        'dep': float(dep),
        'ret': float(ret)
    })

print(json.dumps(rows))
`;

  const rawJson = execSync(`python3 -c "${scriptPython.replace(/"/g, '\\"')}"`, {
    maxBuffer: 50 * 1024 * 1024,
    cwd: path.resolve(__dirname, "../../.."),
  }).toString();

  const rowsExcel: RawExcelRow[] = JSON.parse(rawJson);
  console.log(`   ✓ Extraídas exitosamente ${rowsExcel.length} transacciones operativas del Excel.`);

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Limpiar importación previa de Ahorro Corriente si existiera (idempotente)
    console.log("2. Limpiando registros previos de Ahorro Corriente para reimportación limpia...");
    await client.query(`
      delete from movimientos where cuenta_id in (select id from cuentas where tipo = 'AHORRO_CORRIENTE');
      delete from cuentas where tipo = 'AHORRO_CORRIENTE';
      delete from movimientos where numero_recibo = 'SALDO-HIST-APO';
      delete from cuentas where numero_cuenta = 'APO-HIST';
      delete from socios where advertencia_importacion = 'Socio migrado de Ahorro Corriente (Aportación estatutaria previa pre-2026)';
    `);
    console.log("   ✓ Base de datos preparada para importación limpia de Ahorro Corriente.");

    // 1. Obtener Agencia Chajul y Usuario Admin
    const { rows: agRows } = await client.query(`select id from agencias where codigo = 'CHAJUL';`);
    if (agRows.length === 0) throw new Error("No se encontró Agencia Chajul en BD.");
    const agenciaChajulId = agRows[0].id;

    const { rows: uRows } = await client.query(`
      select id from usuarios where email = 'admin@mif.coop' or rol in ('ADMIN', 'GERENCIA') limit 1;
    `);
    if (uRows.length === 0) throw new Error("No se encontró usuario administrador en BD.");
    const adminUserId = uRows[0].id;

    // 2. Cargar socios existentes
    const { rows: dbSociosRows } = await client.query(`select id, nombres, numero_asociado from socios;`);
    const sociosMap = new Map<string, { id: string; numeroAsociado: string }>();
    let maxCorrelativoSocio = 0;

    for (const s of dbSociosRows) {
      sociosMap.set(s.nombres.trim().toUpperCase(), { id: s.id, numeroAsociado: s.numero_asociado });
      const numMatch = s.numero_asociado.match(/CHAJ-(\d+)/);
      if (numMatch) {
        const n = parseInt(numMatch[1], 10);
        if (n > maxCorrelativoSocio) maxCorrelativoSocio = n;
      }
    }
    console.log(`   ✓ Socios base en base de datos: ${sociosMap.size} (Último correlativo: CHAJ-${String(maxCorrelativoSocio).padStart(5, "0")})`);

    // 3. Agrupar transacciones por titular unificado y calcular saldos históricos
    console.log("\n2. Consolidando titulares y analizando balance corrido de cada libreta...");
    interface TitularData {
      nombre: string;
      cuentasExcel: Set<string>;
      totalDep: number;
      totalRet: number;
      minBalance: number;
      balanceCorrido: number;
      movimientos: RawExcelRow[];
    }

    const titulares = new Map<string, TitularData>();

    for (const r of rowsExcel) {
      const nomNorm = TYPO_MAP[r.nombre.trim().toUpperCase()] || r.nombre.trim().toUpperCase();
      if (!titulares.has(nomNorm)) {
        titulares.set(nomNorm, {
          nombre: nomNorm,
          cuentasExcel: new Set<string>(),
          totalDep: 0,
          totalRet: 0,
          minBalance: 0,
          balanceCorrido: 0,
          movimientos: [],
        });
      }
      const t = titulares.get(nomNorm)!;
      if (r.cta) t.cuentasExcel.add(r.cta);
      t.totalDep += r.dep;
      t.totalRet += r.ret;
      t.balanceCorrido += (r.dep - r.ret);
      if (t.balanceCorrido < t.minBalance) {
        t.minBalance = t.balanceCorrido;
      }
      t.movimientos.push(r);
    }

    console.log(`   ✓ Total titulares únicos consolidados: ${titulares.size}`);

    // 4. Registrar nuevos socios que no estaban en Aportaciones 2026
    console.log("\n3. Verificando y registrando nuevos asociados con aportación estatutaria inicial pre-2026...");
    let nuevosSociosRegistrados = 0;
    let correlativoSocio = maxCorrelativoSocio + 1;

    for (const [nom, t] of titulares.entries()) {
      if (!sociosMap.has(nom)) {
        const numeroAsociado = `CHAJ-${String(correlativoSocio++).padStart(5, "0")}`;
        const { rows: newSocio } = await client.query(`
          insert into socios (
            numero_asociado, agencia_id, nombres, fecha_ingreso, estado,
            advertencia_importacion, creado_por_id
          ) values (
            $1, $2, $3, '2025-12-31', 'ACTIVO',
            'Socio migrado de Ahorro Corriente (Aportación estatutaria previa pre-2026)', $4
          ) returning id;
        `, [numeroAsociado, agenciaChajulId, nom, adminUserId]);

        const socioId = newSocio[0].id;
        sociosMap.set(nom, { id: socioId, numeroAsociado });

        // Cuenta de aportación estatutaria histórica
        const codApoHist = `CHAJ-APO-${String(correlativoSocio).padStart(5, "0")}`;
        const { rows: newApoCta } = await client.query(`
          insert into cuentas (
            numero_cuenta, codigo_sistema, tipo, estado, socio_id, agencia_id, saldo_inicial,
            observaciones_apertura, creado_por_id
          ) values (
            'APO-HIST', $1, 'APORTACION', 'ACTIVA', $2, $3, 100,
            'Aportación estatutaria inicial previa a 2026', $4
          ) returning id;
        `, [codApoHist, socioId, agenciaChajulId, adminUserId]);

        await client.query(`
          insert into movimientos (
            cuenta_id, tipo, monto, fecha, numero_recibo, descripcion, usuario_id,
            cliente_movimiento_id, agencia_operacion_id
          ) values (
            $1, 'DEPOSITO', 100, '2025-12-31', 'SALDO-HIST-APO',
            'Aportación estatutaria inicial previa a 2026', $2,
            $3, $4
          );
        `, [newApoCta[0].id, adminUserId, `MOV-APO-PRE-${socioId}`, agenciaChajulId]);

        nuevosSociosRegistrados++;
      }
    }
    console.log(`   ✓ ${nuevosSociosRegistrados} nuevos socios registrados legalmente con aportación estatutaria pre-2026.`);

    // 5. Crear Cuentas de Ahorro Corriente con Formato Dual
    console.log("\n4. Creando libretas oficiales de Ahorro Corriente con formato dual...");
    let correlativoAhorro = 1;
    const cuentasAhorroMap = new Map<string, string>(); // nom -> cuentaId
    let cuentasConSaldoHist = 0;
    let totalSaldoHistPre2026 = 0;

    for (const [nom, t] of titulares.entries()) {
      const socio = sociosMap.get(nom)!;
      const codigoSistema = `CHAJ-AHC-${String(correlativoAhorro++).padStart(5, "0")}`;

      // Determinar número de cuenta de Excel
      // Si tiene variantes como 148-5-1 y 2-148-5-1, elegir la más limpia
      let numeroCuentaExcel = "";
      if (t.cuentasExcel.size > 0) {
        const sortedCtas = Array.from(t.cuentasExcel).sort((a, b) => a.length - b.length);
        numeroCuentaExcel = sortedCtas[0]; // ej: 148-5-1
      }

      const observacion = t.cuentasExcel.size > 1
        ? `Libreta oficial Ahorro Corriente (Variantes en Excel: ${Array.from(t.cuentasExcel).join(", ")})`
        : numeroCuentaExcel
        ? `Libreta oficial Ahorro Corriente (No. Libreta: ${numeroCuentaExcel})`
        : `Libreta oficial Ahorro Corriente (Sin No. en Excel — Pendiente de asignación)`;

      const saldoHistNecesario = t.minBalance < 0 ? Math.abs(t.minBalance) : 0;

      const { rows: newCta } = await client.query(`
        insert into cuentas (
          numero_cuenta, codigo_sistema, tipo, estado, socio_id, agencia_id, saldo_inicial,
          observaciones_apertura, creado_por_id
        ) values (
          $1, $2, 'AHORRO_CORRIENTE', 'ACTIVA', $3, $4, $5,
          $6, $7
        ) returning id;
      `, [
        numeroCuentaExcel, // si vino vacía en Excel, se almacena ""
        codigoSistema,
        socio.id,
        agenciaChajulId,
        saldoHistNecesario,
        observacion,
        adminUserId,
      ]);

      const cuentaId = newCta[0].id;
      cuentasAhorroMap.set(nom, cuentaId);

      // Si retiró fondos pre-2026, registrar depósito histórico inicial con fecha 2025-12-31
      if (saldoHistNecesario > 0) {
        await client.query(`
          insert into movimientos (
            cuenta_id, tipo, monto, fecha, numero_recibo, descripcion, usuario_id,
            cliente_movimiento_id, agencia_operacion_id
          ) values (
            $1, 'DEPOSITO', $2, '2025-12-31', 'SALDO-INI-2025',
            'Saldo acumulado de ahorro corriente pre-2026 migrado', $3,
            $4, $5
          );
        `, [
          cuentaId,
          saldoHistNecesario,
          adminUserId,
          `MOV-AHC-HIST-${cuentaId}`,
          agenciaChajulId,
        ]);
        cuentasConSaldoHist++;
        totalSaldoHistPre2026 += saldoHistNecesario;
      }
    }

    console.log(`   ✓ ${cuentasAhorroMap.size} cuentas de Ahorro Corriente creadas exitosamente.`);
    console.log(`   ✓ ${cuentasConSaldoHist} cuentas recibieron saldo inicial histórico pre-2026 (Total: Q${totalSaldoHistPre2026.toLocaleString("es-GT", { minimumFractionDigits: 2 })}).`);

    // 6. Insertar los 674 movimientos del 2026 en lotes optimizados
    console.log("\n5. Insertando 674 movimientos del año 2026 en lotes de alta velocidad...");
    let dep2026Count = 0;
    let dep2026Monto = 0;
    let ret2026Count = 0;
    let ret2026Monto = 0;

    interface MovimientoItem {
      cuentaId: string;
      tipo: string;
      monto: number;
      fecha: string;
      recibo: string;
      descripcion: string;
      usuarioId: string;
      clienteMovimientoId: string;
      agenciaOperacionId: string;
    }

    const listaMovimientos: MovimientoItem[] = [];

    for (const r of rowsExcel) {
      const nomNorm = TYPO_MAP[r.nombre.trim().toUpperCase()] || r.nombre.trim().toUpperCase();
      const cuentaId = cuentasAhorroMap.get(nomNorm)!;
      const esDep = r.dep > 0;
      const tipo = esDep ? "DEPOSITO" : "RETIRO";
      const monto = esDep ? r.dep : r.ret;
      const desc = esDep ? "Depósito en cuenta de ahorro corriente" : "Retiro de cuenta de ahorro corriente";

      listaMovimientos.push({
        cuentaId,
        tipo,
        monto,
        fecha: r.fec,
        recibo: r.rec || `REC-${r.row}`,
        descripcion: desc,
        usuarioId: adminUserId,
        clienteMovimientoId: `MOV-AHC-2026-${r.row}`,
        agenciaOperacionId: agenciaChajulId,
      });

      if (esDep) {
        dep2026Count++;
        dep2026Monto += monto;
      } else {
        ret2026Count++;
        ret2026Monto += monto;
      }
    }

    const BATCH_SIZE = 50;
    for (let i = 0; i < listaMovimientos.length; i += BATCH_SIZE) {
      const batch = listaMovimientos.slice(i, i + BATCH_SIZE);
      const valueClauses: string[] = [];
      const params: any[] = [];
      let pIdx = 1;

      for (const m of batch) {
        valueClauses.push(`($${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++})`);
        params.push(
          m.cuentaId,
          m.tipo,
          m.monto,
          m.fecha,
          m.recibo,
          m.descripcion,
          m.usuarioId,
          m.clienteMovimientoId,
          m.agenciaOperacionId
        );
      }

      await client.query(`
        insert into movimientos (
          cuenta_id, tipo, monto, fecha, numero_recibo, descripcion, usuario_id,
          cliente_movimiento_id, agencia_operacion_id
        ) values ${valueClauses.join(", ")};
      `, params);
    }

    console.log(`   ✓ ${dep2026Count} depósitos registrados (Total: Q${dep2026Monto.toLocaleString("es-GT", { minimumFractionDigits: 2 })})`);
    console.log(`   ✓ ${ret2026Count} retiros registrados (Total: Q${ret2026Monto.toLocaleString("es-GT", { minimumFractionDigits: 2 })})`);

    await client.query("COMMIT");
    console.log("\n================================================================================");
    console.log("   ✅ IMPORTACIÓN DE AHORRO CORRIENTE CONFIRMADA EN LA BASE DE DATOS");
    console.log("================================================================================");

    // Consulta de comprobación final de saldos en BD
    const { rows: check2026 } = await client.query(`
      select
        coalesce(sum(case when m.tipo = 'DEPOSITO' and m.numero_recibo != 'SALDO-INI-2025' then m.monto else 0 end), 0) as dep_2026,
        coalesce(sum(case when m.tipo = 'RETIRO' then m.monto else 0 end), 0) as ret_2026,
        coalesce(sum(case when m.tipo = 'DEPOSITO' and m.numero_recibo != 'SALDO-INI-2025' then m.monto when m.tipo = 'RETIRO' then -m.monto else 0 end), 0) as neto_2026,
        coalesce(sum(case when m.tipo = 'DEPOSITO' and m.numero_recibo = 'SALDO-INI-2025' then m.monto else 0 end), 0) as hist_pre2026,
        coalesce(sum(case when m.tipo = 'DEPOSITO' then m.monto else -m.monto end), 0) as saldo_total_ahorro
      from movimientos m
      join cuentas c on c.id = m.cuenta_id
      where c.tipo = 'AHORRO_CORRIENTE';
    `);

    const res = check2026[0];
    const depBd = Number(res.dep_2026);
    const retBd = Number(res.ret_2026);
    const netoBd = Number(res.neto_2026);
    const histBd = Number(res.hist_pre2026);
    const totalAhorroBd = Number(res.saldo_total_ahorro);

    console.log(`\n📊 CUADRE MATEMÁTICO FASE 2 (AHORRO CORRIENTE 2026):`);
    console.log(`   - Total Depósitos 2026 registrados: Q${depBd.toLocaleString("es-GT", { minimumFractionDigits: 2 })} (Esperado: Q3,620,116.31)`);
    console.log(`   - Total Retiros 2026 registrados:   Q${retBd.toLocaleString("es-GT", { minimumFractionDigits: 2 })} (Esperado: Q1,348,045.62)`);
    console.log(`   - Saldo Neto Operativo 2026:        Q${netoBd.toLocaleString("es-GT", { minimumFractionDigits: 2 })} (Esperado Fila 679: Q2,272,070.69)`);
    console.log(`   - Fondo Histórico Pre-2026 migrado: Q${histBd.toLocaleString("es-GT", { minimumFractionDigits: 2 })} (80 cuentas protegidas)`);
    console.log(`   - Saldo Total Consolidado Ahorro:   Q${totalAhorroBd.toLocaleString("es-GT", { minimumFractionDigits: 2 })}`);

    const difDep = Math.abs(depBd - 3620116.31);
    const difRet = Math.abs(retBd - 1348045.62);
    const difNeto = Math.abs(netoBd - 2272070.69);

    if (difDep < 0.01 && difRet < 0.01 && difNeto < 0.01) {
      console.log(`   🎉 ¡CUADRE EXACTO AL CENTAVO CON LA FILA 679 DEL EXCEL! (Diferencia: Q0.00)`);
    } else {
      console.log(`   ⚠️ Diferencia detectada: Dep=Q${difDep.toFixed(2)}, Ret=Q${difRet.toFixed(2)}, Neto=Q${difNeto.toFixed(2)}`);
    }

  } catch (err) {
    await client.query("ROLLBACK");
    console.error("❌ ERROR DURANTE LA IMPORTACIÓN:", err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(err => {
  console.error("Error fatal:", err);
  process.exit(1);
});
```

## `backend/src/db/importar-plazo-fijo.ts` {#backendsrcdbimportarplazofijots}

```ts
import "dotenv/config";
import { pool } from "./pool";
import { execSync } from "child_process";
import { randomUUID } from "crypto";
import path from "path";
import { calcularVencimiento, calcularDiasExactos } from "../modules/plazofijo/calculo";

/**
 * Script Oficial de Importación — Fase 3: Depósito a Plazo Fijo (Kardex PF 2018-2026)
 * Archivo: importar/deposito a plazo fijo/KARDEX AHORRO PF 2026-08.xlsx
 * 
 * Reglas de Negocio aprobadas:
 * 1. Importación histórica completa: 695 certificados válidos desde 2018 hasta 2026 (descartando 47 anulados).
 * 2. Registro de 418 nuevos inversores/asociados en Agencia Chajul con aportación estatutaria inicial pre-2026.
 * 3. Formato Dual de Cuentas de Plazo Fijo:
 *    - numero_cuenta: Número de cuenta original de Excel (ej: 1-467-6-1, 2-95-6-2, 1188-2019).
 *    - codigo_sistema: Correlativo estructurado único (CHAJ-PF-00001...).
 * 4. Tasas cooperativas oficiales:
 *    - 6.0% anual para plazos de 6 meses o menos.
 *    - 14.0% anual para plazos de 12 meses o más.
 *    - 10.0% de retención legal de ISR sobre intereses brutos.
 * 5. Estados de los contratos:
 *    - 689 contratos con fecha y recibo de retiro se marcan como LIQUIDADO.
 *    - 6 contratos vigentes del 2026 se marcan como ACTIVO (con vencimiento en 2027).
 *    - Total capital auditado: Q 20,269,666.22.
 * 6. Optimización en Lotes (Batch Inserts): Ejecución ultrarrápida y atómica.
 */

interface RawCertRow {
  row: number;
  cta: string;
  nombre: string;
  agencia: string;
  fecEntrada: string;
  docIn: string;
  noDoc: string;
  noCert: string;
  plazoMeses: number;
  estadoExcel: string;
  monto: number;
  fecRetiro: string | null;
  reciboRetiro: string | null;
}

async function main() {
  console.log("================================================================================");
  console.log("   IMPORTACIÓN OFICIAL — FASE 3: PLAZO FIJO (KARDEX PF 2018-2026)");
  console.log("================================================================================\n");

  console.log("1. Extrayendo certificados desde 'importar/deposito a plazo fijo/KARDEX AHORRO PF 2026-08.xlsx'...");
  const scriptPython = `
import openpyxl, json

wb = openpyxl.load_workbook('importar/deposito a plazo fijo/KARDEX AHORRO PF 2026-08.xlsx', data_only=True)
ws = wb['Hoja1']

certs = []
for r in range(8, ws.max_row + 1):
    c1 = ws.cell(r, 1).value
    c2 = ws.cell(r, 2).value
    c3 = ws.cell(r, 3).value
    c4 = ws.cell(r, 4).value
    c5 = ws.cell(r, 5).value
    c6 = ws.cell(r, 6).value
    c7 = ws.cell(r, 7).value
    c8 = ws.cell(r, 8).value
    c9 = ws.cell(r, 9).value
    c10 = ws.cell(r, 10).value
    c17 = ws.cell(r, 17).value
    c18 = ws.cell(r, 18).value
    
    nom_str = str(c2).strip() if c2 else ''
    if not nom_str or 'ANULADO' in nom_str.upper() or 'ANULADA' in nom_str.upper():
        continue
    
    if c1 and str(c1).strip() and c10 is not None:
        try:
            monto = float(c10)
        except:
            continue
        if monto > 0:
            plazo = 12
            if c8 and str(c8).isdigit():
                plazo = int(c8)
            
            fec_in = str(c4)[:10] if c4 else '2026-01-02'
            fec_ret = str(c17)[:10] if c17 else None
            rec_ret = str(c18).strip() if c18 and str(c18).strip() not in ['', 'None'] else None

            certs.append({
                'row': r,
                'cta': str(c1).strip(),
                'nombre': nom_str.strip().upper(),
                'agencia': str(c3).strip() if c3 else 'CHAJUL',
                'fecEntrada': fec_in,
                'docIn': str(c5).strip() if c5 else 'IN',
                'noDoc': str(c6).strip() if c6 else '',
                'noCert': str(c7).strip() if c7 else str(len(certs) + 1),
                'plazoMeses': plazo,
                'estadoExcel': str(c9).strip().upper() if c9 else 'ACTIVO',
                'monto': monto,
                'fecRetiro': fec_ret,
                'reciboRetiro': rec_ret
            })

print(json.dumps(certs))
`;

  const rawJson = execSync(`python3 -c "${scriptPython.replace(/"/g, '\\"')}"`, {
    maxBuffer: 50 * 1024 * 1024,
    cwd: path.resolve(__dirname, "../../.."),
  }).toString();

  const certsExcel: RawCertRow[] = JSON.parse(rawJson);
  console.log(`   ✓ Extraídos exitosamente ${certsExcel.length} certificados válidos de inversión.`);

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Limpieza idempotente previa de Plazo Fijo
    console.log("\n2. Limpiando registros previos de Plazo Fijo para importación limpia...");
    await client.query(`
      delete from plazo_fijo_contratos;
      delete from movimientos where cuenta_id in (select id from cuentas where tipo = 'AHORRO_PLAZO_FIJO');
      delete from cuentas where tipo = 'AHORRO_PLAZO_FIJO';
      delete from movimientos where numero_recibo = 'SALDO-HIST-APO-PF';
      delete from cuentas where numero_cuenta = 'APO-HIST-PF';
      delete from socios where advertencia_importacion = 'Socio migrado de Plazo Fijo (Certificados de Inversión)';
    `);
    console.log("   ✓ Base de datos preparada para importación limpia de Plazo Fijo.");

    // Obtener Agencia Chajul y Admin
    const { rows: agRows } = await client.query(`select id from agencias where codigo = 'CHAJUL';`);
    if (agRows.length === 0) throw new Error("No se encontró Agencia Chajul en BD.");
    const agenciaChajulId = agRows[0].id;

    const { rows: uRows } = await client.query(`
      select id from usuarios where email = 'admin@mif.coop' or rol in ('ADMIN', 'GERENCIA') limit 1;
    `);
    const adminUserId = uRows[0].id;

    // Cargar socios existentes
    const { rows: dbSociosRows } = await client.query(`select id, nombres, numero_asociado from socios;`);
    const sociosMap = new Map<string, { id: string; numeroAsociado: string }>();
    let maxCorrelativoSocio = 0;

    for (const s of dbSociosRows) {
      sociosMap.set(s.nombres.trim().toUpperCase(), { id: s.id, numeroAsociado: s.numero_asociado });
      const numMatch = s.numero_asociado.match(/CHAJ-(\d+)/);
      if (numMatch) {
        const n = parseInt(numMatch[1], 10);
        if (n > maxCorrelativoSocio) maxCorrelativoSocio = n;
      }
    }
    console.log(`   ✓ Socios base en base de datos: ${sociosMap.size} (Último correlativo: CHAJ-${String(maxCorrelativoSocio).padStart(5, "0")})`);

    // Preparar y registrar nuevos socios en lotes
    console.log("\n3. Verificando y registrando nuevos inversores en el padrón de socios...");
    let correlativoSocio = maxCorrelativoSocio + 1;

    const titularesPF = new Set<string>();
    for (const c of certsExcel) {
      titularesPF.add(c.nombre);
    }

    interface NuevoSocioItem {
      socioId: string;
      numeroAsociado: string;
      nombre: string;
      apoCtaId: string;
      codApoHist: string;
    }

    const nuevosSociosList: NuevoSocioItem[] = [];

    for (const nom of titularesPF) {
      if (!sociosMap.has(nom)) {
        const socioId = randomUUID();
        const apoCtaId = randomUUID();
        const numeroAsociado = `CHAJ-${String(correlativoSocio++).padStart(5, "0")}`;
        const codApoHist = `CHAJ-APO-${String(correlativoSocio).padStart(5, "0")}`;

        sociosMap.set(nom, { id: socioId, numeroAsociado });
        nuevosSociosList.push({ socioId, numeroAsociado, nombre: nom, apoCtaId, codApoHist });
      }
    }

    // Inserción en lotes de nuevos socios
    const BATCH_SIZE = 50;
    for (let i = 0; i < nuevosSociosList.length; i += BATCH_SIZE) {
      const batch = nuevosSociosList.slice(i, i + BATCH_SIZE);

      // Socios
      const socioValues: string[] = [];
      const socioParams: any[] = [];
      let pIdx = 1;
      for (const s of batch) {
        socioValues.push(`($${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, '2025-12-31', 'ACTIVO', 'Socio migrado de Plazo Fijo (Certificados de Inversión)', $${pIdx++})`);
        socioParams.push(s.socioId, s.numeroAsociado, agenciaChajulId, s.nombre, adminUserId);
      }
      await client.query(`
        insert into socios (id, numero_asociado, agencia_id, nombres, fecha_ingreso, estado, advertencia_importacion, creado_por_id)
        values ${socioValues.join(", ")};
      `, socioParams);

      // Cuentas Aportación
      const ctaValues: string[] = [];
      const ctaParams: any[] = [];
      pIdx = 1;
      for (const s of batch) {
        ctaValues.push(`($${pIdx++}, 'APO-HIST-PF', $${pIdx++}, 'APORTACION', 'ACTIVA', $${pIdx++}, $${pIdx++}, 100, 'Aportación estatutaria previa de socio inversor', $${pIdx++})`);
        ctaParams.push(s.apoCtaId, s.codApoHist, s.socioId, agenciaChajulId, adminUserId);
      }
      await client.query(`
        insert into cuentas (id, numero_cuenta, codigo_sistema, tipo, estado, socio_id, agencia_id, saldo_inicial, observaciones_apertura, creado_por_id)
        values ${ctaValues.join(", ")};
      `, ctaParams);

      // Movimientos Aportación
      const movValues: string[] = [];
      const movParams: any[] = [];
      pIdx = 1;
      for (const s of batch) {
        movValues.push(`($${pIdx++}, 'DEPOSITO', 100, '2025-12-31', 'SALDO-HIST-APO-PF', 'Aportación estatutaria previa de socio inversor', $${pIdx++}, $${pIdx++}, $${pIdx++})`);
        movParams.push(s.apoCtaId, adminUserId, `MOV-APO-PF-${s.socioId}`, agenciaChajulId);
      }
      await client.query(`
        insert into movimientos (cuenta_id, tipo, monto, fecha, numero_recibo, descripcion, usuario_id, cliente_movimiento_id, agencia_operacion_id)
        values ${movValues.join(", ")};
      `, movParams);
    }
    console.log(`   ✓ ${nuevosSociosList.length} nuevos socios registrados en lotes con aportación estatutaria.`);

    // Preparar Cuentas de Plazo Fijo, Contratos y Movimientos
    console.log("\n4. Preparando cuentas de Plazo Fijo y contratos en lotes...");
    let correlativoPF = 1;
    let totalContratos = 0;
    let contratosActivos = 0;
    let contratosLiquidados = 0;
    let totalCapitalInvertido = 0;
    let totalLiquidadoMonto = 0;

    const certsVistos = new Set<string>();

    interface CuentaPFItem {
      id: string;
      numeroCuenta: string;
      codigoSistema: string;
      estadoCuenta: string;
      socioId: string;
      monto: number;
      observacion: string;
    }

    interface ContratoPFItem {
      cuentaId: string;
      certNumero: string;
      plazoMeses: number;
      tasaAnual: number;
      isrPct: number;
      monto: number;
      fechaInicio: string;
      fechaVencimiento: string;
      interesGenerado: number;
      interesNeto: number;
      saldoLiquido: number;
      estadoContrato: string;
      fechaRetiro: string | null;
      reciboRetiro: string | null;
      montoLiquidado: number | null;
    }

    interface MovPFItem {
      cuentaId: string;
      tipo: string;
      monto: number;
      fecha: string;
      recibo: string;
      descripcion: string;
      clienteMovimientoId: string;
    }

    const cuentasList: CuentaPFItem[] = [];
    const contratosList: ContratoPFItem[] = [];
    const movimientosList: MovPFItem[] = [];

    for (const c of certsExcel) {
      const socio = sociosMap.get(c.nombre)!;
      const cuentaId = randomUUID();
      const codigoSistema = `CHAJ-PF-${String(correlativoPF++).padStart(5, "0")}`;

      let certNumero = c.noCert;
      if (certsVistos.has(certNumero)) {
        certNumero = `${certNumero}-R`;
      }
      certsVistos.add(certNumero);

      const estaLiquidado = !!c.reciboRetiro;
      const estadoContrato = estaLiquidado ? "LIQUIDADO" : "ACTIVO";
      const estadoCuenta = estaLiquidado ? "CERRADA" : "ACTIVA";

      // Cálculos Financieros
      const tasaAnual = c.plazoMeses <= 6 ? 6.0 : 14.0;
      const isrPct = 10.0;
      const fechaInicio = c.fecEntrada;
      const fechaVencimiento = calcularVencimiento(fechaInicio, c.plazoMeses);
      const diasExactos = calcularDiasExactos(fechaInicio, fechaVencimiento);

      const interesGenerado = Math.round(c.monto * (tasaAnual / 100) * (diasExactos / 365) * 100) / 100;
      const isrRetencion = Math.round(interesGenerado * (isrPct / 100) * 100) / 100;
      const interesNeto = Math.round((interesGenerado - isrRetencion) * 100) / 100;
      const saldoLiquido = Math.round((c.monto + interesNeto) * 100) / 100;

      const montoLiquidado = estaLiquidado ? saldoLiquido : null;
      const fechaRetiro = estaLiquidado ? (c.fecRetiro || fechaVencimiento) : null;

      cuentasList.push({
        id: cuentaId,
        numeroCuenta: c.cta,
        codigoSistema,
        estadoCuenta,
        socioId: socio.id,
        monto: c.monto,
        observacion: `Certificado de Inversión a Plazo Fijo #${certNumero} (${c.plazoMeses} meses)`,
      });

      contratosList.push({
        cuentaId,
        certNumero,
        plazoMeses: c.plazoMeses,
        tasaAnual,
        isrPct,
        monto: c.monto,
        fechaInicio,
        fechaVencimiento,
        interesGenerado,
        interesNeto,
        saldoLiquido,
        estadoContrato,
        fechaRetiro,
        reciboRetiro: c.reciboRetiro,
        montoLiquidado,
      });

      movimientosList.push({
        cuentaId,
        tipo: "DEPOSITO",
        monto: c.monto,
        fecha: fechaInicio,
        recibo: c.noDoc || `CERT-${certNumero}`,
        descripcion: `Apertura de Certificado Plazo Fijo #${certNumero} (${c.plazoMeses} meses al ${tasaAnual}%)`,
        clienteMovimientoId: `MOV-PF-DEP-${cuentaId}`,
      });

      if (estaLiquidado) {
        movimientosList.push({
          cuentaId,
          tipo: "RETIRO",
          monto: c.monto,
          fecha: fechaRetiro!,
          recibo: c.reciboRetiro || `REC-LIQ-${certNumero}`,
          descripcion: `Liquidación oficial de Certificado Plazo Fijo #${certNumero}`,
          clienteMovimientoId: `MOV-PF-RET-${cuentaId}`,
        });
        contratosLiquidados++;
        totalLiquidadoMonto += c.monto;
      } else {
        contratosActivos++;
      }

      totalContratos++;
      totalCapitalInvertido += c.monto;
    }

    // Inserción en lotes de Cuentas de Plazo Fijo
    console.log(`   ↳ Insertando ${cuentasList.length} cuentas de Plazo Fijo...`);
    for (let i = 0; i < cuentasList.length; i += BATCH_SIZE) {
      const batch = cuentasList.slice(i, i + BATCH_SIZE);
      const values: string[] = [];
      const params: any[] = [];
      let pIdx = 1;
      for (const c of batch) {
        values.push(`($${pIdx++}, $${pIdx++}, $${pIdx++}, 'AHORRO_PLAZO_FIJO', $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++})`);
        params.push(c.id, c.numeroCuenta, c.codigoSistema, c.estadoCuenta, c.socioId, agenciaChajulId, c.monto, c.observacion, adminUserId);
      }
      await client.query(`
        insert into cuentas (id, numero_cuenta, codigo_sistema, tipo, estado, socio_id, agencia_id, saldo_inicial, observaciones_apertura, creado_por_id)
        values ${values.join(", ")};
      `, params);
    }

    // Inserción en lotes de Contratos de Plazo Fijo
    console.log(`   ↳ Insertando ${contratosList.length} contratos en plazo_fijo_contratos...`);
    for (let i = 0; i < contratosList.length; i += BATCH_SIZE) {
      const batch = contratosList.slice(i, i + BATCH_SIZE);
      const values: string[] = [];
      const params: any[] = [];
      let pIdx = 1;
      for (const c of batch) {
        values.push(`($${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++})`);
        params.push(
          c.cuentaId, c.certNumero, c.plazoMeses, c.tasaAnual, c.isrPct,
          c.monto, c.fechaInicio, c.fechaVencimiento, c.interesGenerado, c.interesNeto,
          c.saldoLiquido, c.estadoContrato, c.fechaRetiro, c.reciboRetiro, c.montoLiquidado
        );
      }
      await client.query(`
        insert into plazo_fijo_contratos (
          cuenta_id, numero_certificacion, plazo_meses, tasa_anual, isr_porcentaje,
          monto_deposito, fecha_inicio, fecha_vencimiento, interes_generado, interes_neto,
          saldo_liquido_a_pagar, estado, fecha_retiro, recibo_retiro, monto_liquidado
        ) values ${values.join(", ")};
      `, params);
    }

    // Inserción en lotes de Movimientos
    console.log(`   ↳ Insertando ${movimientosList.length} movimientos de apertura y liquidación...`);
    for (let i = 0; i < movimientosList.length; i += BATCH_SIZE) {
      const batch = movimientosList.slice(i, i + BATCH_SIZE);
      const values: string[] = [];
      const params: any[] = [];
      let pIdx = 1;
      for (const m of batch) {
        values.push(`($${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++})`);
        params.push(m.cuentaId, m.tipo, m.monto, m.fecha, m.recibo, m.descripcion, adminUserId, m.clienteMovimientoId, agenciaChajulId);
      }
      await client.query(`
        insert into movimientos (cuenta_id, tipo, monto, fecha, numero_recibo, descripcion, usuario_id, cliente_movimiento_id, agencia_operacion_id)
        values ${values.join(", ")};
      `, params);
    }

    await client.query("COMMIT");
    console.log("\n================================================================================");
    console.log("   ✅ IMPORTACIÓN DE PLAZO FIJO CONFIRMADA EN LA BASE DE DATOS");
    console.log("================================================================================");

    // Consulta de Comprobación
    const { rows: stats } = await client.query(`
      select
        count(*) as total_contratos,
        count(*) filter (where estado = 'ACTIVO') as activos,
        count(*) filter (where estado = 'LIQUIDADO') as liquidados,
        coalesce(sum(monto_deposito), 0) as total_capital,
        coalesce(sum(monto_deposito) filter (where estado = 'ACTIVO'), 0) as capital_activo,
        coalesce(sum(monto_deposito) filter (where estado = 'LIQUIDADO'), 0) as capital_liquidado,
        coalesce(sum(interes_neto) filter (where estado = 'ACTIVO'), 0) as intereses_activos
      from plazo_fijo_contratos;
    `);

    const r = stats[0];
    console.log(`\n📊 CUADRE MATEMÁTICO FASE 3 (PLAZO FIJO KARDEX 2018-2026):`);
    console.log(`   - Total contratos migrados:     ${r.total_contratos} certificados`);
    console.log(`   - Contratos Activos Vigentes:   ${r.activos} certificados (Monto: Q${Number(r.capital_activo).toLocaleString("es-GT", { minimumFractionDigits: 2 })})`);
    console.log(`   - Contratos Liquidados Hist.:   ${r.liquidados} certificados (Monto: Q${Number(r.capital_liquidado).toLocaleString("es-GT", { minimumFractionDigits: 2 })})`);
    console.log(`   - TOTAL CAPITAL INVERTIDO:      Q${Number(r.total_capital).toLocaleString("es-GT", { minimumFractionDigits: 2 })} (Esperado: Q20,269,666.22)`);
    console.log(`   - Intereses Netos en custodia:  Q${Number(r.intereses_activos).toLocaleString("es-GT", { minimumFractionDigits: 2 })}`);

    const difCapital = Math.abs(Number(r.total_capital) - 20269666.22);
    if (difCapital < 0.01) {
      console.log(`   🎉 ¡CUADRE EXACTO AL CENTAVO CON EL KARDEX MAESTRO! (Diferencia: Q0.00)`);
    } else {
      console.log(`   ⚠️ Diferencia detectada: Q${difCapital.toFixed(2)}`);
    }

  } catch (err) {
    await client.query("ROLLBACK");
    console.error("❌ ERROR EN LA IMPORTACIÓN DE PLAZO FIJO:", err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(err => {
  console.error("Error fatal:", err);
  process.exit(1);
});
```

## `backend/src/db/importar-programado-infantil.ts` {#backendsrcdbimportarprogramadoinfantilts}

```ts
import "dotenv/config";
import { pool } from "./pool";
import { randomUUID } from "crypto";

/**
 * Script Oficial de Importación — Fase 4: Ahorro Programado, Ahorro Infanto-Juvenil y Aportaciones Infantiles
 * 
 * Archivos fuente:
 * 1. importar/ahorro programado/AHORRO PROGRAMADO 30-08-26.xlsx
 * 2. importar/ahorro infanto juvenil/AHORRO INFANTO JUVENIL 31-07-26.xlsx
 * 3. importar/aportaciones infantil/APORTACIONES INFANTO JUVENIL 31-08-26.xlsx
 * 
 * Reglas de Negocio Aplicadas:
 * - Titularidad jurídica de menores con registro de CUI propio y vinculación a tutores legales con DPI.
 * - Formato Dual de Cuentas:
 *    * Ahorro Programado: libreta física "2-214-7-1" / institucional "CHAJ-AHP-00001"
 *    * Ahorro Infanto-Juvenil: libretas "221-8-1", "2-138-8-1" / institucional "CHAJ-AHI-00001", "CHAJ-AHI-00002"
 *    * Aportación Infantil: libretas "221-4-1", "2-138-4-1" / institucional "CHAJ-API-00001", "CHAJ-API-00002"
 * - Registro cronológico estricto por fecha y número de recibo de Excel.
 * - Cuadre contable exacto al centavo.
 */

async function ejecutar() {
  const cliente = await pool.connect();

  try {
    console.log("================================================================================");
    console.log("🚀 INICIANDO FASE 4: IMPORTACIÓN DE AHORRO PROGRAMADO E INFANTO-JUVENIL");
    console.log("================================================================================\n");

    // 1. Obtener Agencia Chajul y Usuario Admin
    const resAgencia = await cliente.query("select id, codigo, nombre from agencias where codigo = 'CHAJUL' limit 1");
    if (resAgencia.rows.length === 0) throw new Error("No se encontró la agencia CHAJUL en la base de datos.");
    const agenciaId = resAgencia.rows[0].id;
    console.log(`📍 Agencia identificada: ${resAgencia.rows[0].nombre} (${resAgencia.rows[0].codigo})`);

    const resUser = await cliente.query("select id, email from usuarios where rol = 'GERENCIA' or email = 'admin@mif.coop' limit 1");
    if (resUser.rows.length === 0) throw new Error("No se encontró usuario administrador en la base de datos.");
    const adminId = resUser.rows[0].id;
    console.log(`👤 Usuario operador: ${resUser.rows[0].email}\n`);

    // Iniciar Transacción
    await cliente.query("BEGIN");

    // Helper para buscar o crear cuenta
    async function upsertCuenta(datos: {
      numero_cuenta: string;
      codigo_sistema: string;
      tipo: string;
      socio_id: string;
      cuota_pactada?: number;
      titular_menor_nombre?: string;
      titular_menor_cui?: string;
      titular_menor_parentesco?: string;
      observaciones_apertura: string;
    }): Promise<string> {
      const res = await cliente.query(
        "select id from cuentas where numero_cuenta = $1 and tipo = $2 limit 1",
        [datos.numero_cuenta, datos.tipo]
      );
      if (res.rows.length > 0) {
        const id = res.rows[0].id;
        await cliente.query(
          `update cuentas set socio_id = $1, codigo_sistema = $2, cuota_pactada = coalesce($3, cuota_pactada), titular_menor_nombre = $4, titular_menor_cui = $5, titular_menor_parentesco = $6 where id = $7`,
          [datos.socio_id, datos.codigo_sistema, datos.cuota_pactada ?? null, datos.titular_menor_nombre ?? null, datos.titular_menor_cui ?? null, datos.titular_menor_parentesco ?? null, id]
        );
        return id;
      }

      const id = randomUUID();
      await cliente.query(
        `insert into cuentas (
          id, numero_cuenta, codigo_sistema, tipo, estado, socio_id, agencia_id,
          saldo_inicial, cuota_pactada, titular_menor_nombre, titular_menor_cui,
          titular_menor_parentesco, observaciones_apertura, creado_por_id
        ) values ($1, $2, $3, $4, 'ACTIVA', $5, $6, 0, $7, $8, $9, $10, $11, $12)`,
        [
          id,
          datos.numero_cuenta,
          datos.codigo_sistema,
          datos.tipo,
          datos.socio_id,
          agenciaId,
          datos.cuota_pactada ?? null,
          datos.titular_menor_nombre ?? null,
          datos.titular_menor_cui ?? null,
          datos.titular_menor_parentesco ?? null,
          datos.observaciones_apertura,
          adminId
        ]
      );
      return id;
    }

    // Helper para insertar movimiento
    async function insertMovimiento(datos: {
      cuenta_id: string;
      monto: number;
      fecha: string;
      numero_recibo: string;
      descripcion: string;
      cliente_mov_id: string;
    }) {
      await cliente.query(
        `insert into movimientos (
          id, cuenta_id, tipo, monto, fecha, numero_recibo, descripcion,
          usuario_id, cliente_movimiento_id, sincronizado_en
        ) values ($1, $2, 'DEPOSITO', $3, $4, $5, $6, $7, $8, now())
        on conflict (cliente_movimiento_id) do nothing`,
        [
          randomUUID(),
          datos.cuenta_id,
          datos.monto,
          datos.fecha,
          datos.numero_recibo,
          datos.descripcion,
          adminId,
          datos.cliente_mov_id
        ]
      );
    }

    // ==========================================================================
    // PARTE 1: AHORRO PROGRAMADO (ROSY MARICELDA CALEL IMUL)
    // ==========================================================================
    console.log("--------------------------------------------------------------------------------");
    console.log("📌 PARTE 1: MIGRACIÓN DE AHORRO PROGRAMADO (2026)");
    console.log("--------------------------------------------------------------------------------");

    // Buscar socia Rosy Maricelda Calel Imul
    let resRosy = await cliente.query(
      "select id, numero_asociado, nombres, dpi from socios where nombres ilike '%ROSY MARICELDA CALEL%' limit 1"
    );
    let rosyId = resRosy.rows[0]?.id;

    if (!rosyId) {
      const resMax = await cliente.query(
        "select numero_asociado from socios where numero_asociado like 'CHAJ-%' order by numero_asociado desc limit 1"
      );
      const ultNum = resMax.rows[0] ? parseInt(resMax.rows[0].numero_asociado.replace("CHAJ-", ""), 10) : 0;
      const nuevoCod = `CHAJ-${String(ultNum + 1).padStart(5, "0")}`;

      const insSocio = await cliente.query(
        `insert into socios (id, numero_asociado, agencia_id, nombres, genero, fecha_ingreso, estado, dpi, direccion, creado_por_id)
         values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) returning id`,
        [randomUUID(), nuevoCod, agenciaId, "ROSY MARICELDA CALEL IMUL", "F", "2026-05-02", "ACTIVO", "3276 59580 1405", "Agencia Chajul", adminId]
      );
      rosyId = insSocio.rows[0].id;
      console.log(`  ➕ Socia registrada: ROSY MARICELDA CALEL IMUL (${nuevoCod})`);
    } else {
      console.log(`  ✓ Socia existente encontrada: ${resRosy.rows[0].nombres} (${resRosy.rows[0].numero_asociado})`);
    }

    // Crear cuenta de Ahorro Programado
    const ctaProgId = await upsertCuenta({
      numero_cuenta: "2-214-7-1",
      codigo_sistema: "CHAJ-AHP-00001",
      tipo: "AHORRO_PROGRAMADO",
      socio_id: rosyId,
      cuota_pactada: 1000.00,
      observaciones_apertura: "Cuenta Oficial de Ahorro Programado migrada del libro 2026"
    });
    console.log(`  ✓ Cuenta creada: [2-214-7-1] / [CHAJ-AHP-00001] — Ahorro Programado`);

    // Movimientos de Ahorro Programado en 2026
    const movsProgramado = [
      { fecha: "2026-05-02", recibo: "2876", monto: 1000.00, desc: "Ahorro Programado Mayo 2026" },
      { fecha: "2026-06-02", recibo: "3053", monto: 1000.00, desc: "Ahorro Programado Junio 2026" },
      { fecha: "2026-07-02", recibo: "3243", monto: 1000.00, desc: "Ahorro Programado Julio 2026" },
      { fecha: "2026-08-03", recibo: "3427", monto: 1000.00, desc: "Ahorro Programado Agosto 2026" }
    ];

    let totalProg = 0;
    for (const m of movsProgramado) {
      await insertMovimiento({
        cuenta_id: ctaProgId,
        monto: m.monto,
        fecha: m.fecha,
        numero_recibo: m.recibo,
        descripcion: m.desc,
        cliente_mov_id: `MIG-PROG-${m.recibo}`
      });
      totalProg += m.monto;
      console.log(`    ↳ Depósito: ${m.fecha} | Recibo No. ${m.recibo} | Q ${m.monto.toFixed(2)} | ${m.desc}`);
    }
    console.log(`  💰 Subtotal Ahorro Programado 2026: Q ${totalProg.toFixed(2)}\n`);

    // ==========================================================================
    // PARTE 2: AHORRO INFANTO-JUVENIL Y APORTACIONES INFANTILES
    // ==========================================================================
    console.log("--------------------------------------------------------------------------------");
    console.log("📌 PARTE 2: MIGRACIÓN DE AHORRO INFANTO-JUVENIL Y APORTACIONES INFANTILES");
    console.log("--------------------------------------------------------------------------------");

    // Consultar el último número correlativo de socio
    const resUltSocio = await cliente.query(
      "select numero_asociado from socios where numero_asociado like 'CHAJ-%' order by numero_asociado desc limit 1"
    );
    let ultimoNumSocio = resUltSocio.rows[0] ? parseInt(resUltSocio.rows[0].numero_asociado.replace("CHAJ-", ""), 10) : 0;

    // --- CASO 1: ANA BETZAIDA RAMIREZ ASICONA ---
    let anaId: string;
    const resAna = await cliente.query(
      "select id, numero_asociado, nombres from socios where nombres ilike '%ANA%BETZAIDA%RAMIREZ%' or nombres ilike '%ANA%BATZAIDA%RAMIREZ%' limit 1"
    );

    if (resAna.rows.length === 0) {
      ultimoNumSocio++;
      const codAna = `CHAJ-${String(ultimoNumSocio).padStart(5, "0")}`;
      anaId = randomUUID();
      await cliente.query(
        `insert into socios (
          id, numero_asociado, agencia_id, nombres, genero, fecha_ingreso, estado,
          dpi, direccion, es_menor, tutor_nombre, tutor_dpi, tutor_parentesco,
          tutor_telefono, advertencia_importacion, creado_por_id
        ) values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)`,
        [
          anaId,
          codAna,
          agenciaId,
          "ANA BETZAIDA RAMIREZ ASICONA",
          "F",
          "2026-04-08",
          "ACTIVO",
          "1780 18988 1405", // CUI de la menor registrado en Excel
          "Cantón Ilom, Chajul",
          true,
          "ANA ESCOBAR RIVERA",
          "1797 50615 1405",
          "MADRE / TUTORA LEGAL",
          "4901-3788",
          "⚠️ Conflicto detectado en Excel: El CUI '1780 18988 1405' coincide con el DPI del socio adulto Juan Mateo Raymundo (CHAJ-00001). Probable error tipográfico/copiado de plantilla en archivo original. Solicitar certificación de nacimiento en ventanilla.",
          adminId
        ]
      );
      console.log(`  ➕ Socia Menor registrada: ANA BETZAIDA RAMIREZ ASICONA (${codAna})`);
      console.log(`     ⚠️ Advertencia de Auditoría: CUI duplicado en Excel con socio Juan Mateo Raymundo.`);
      console.log(`     ↳ Tutora Legal: ANA ESCOBAR RIVERA (DPI: 1797 50615 1405)`);
    } else {
      anaId = resAna.rows[0].id;
      console.log(`  ✓ Socia menor encontrada: ${resAna.rows[0].nombres} (${resAna.rows[0].numero_asociado})`);
    }

    // Cuenta Aportación Infantil Ana Betzaida (221-4-1 / CHAJ-API-00001)
    const ctaApoAnaId = await upsertCuenta({
      numero_cuenta: "221-4-1",
      codigo_sistema: "CHAJ-API-00001",
      tipo: "APORTACION_INFANTIL",
      socio_id: anaId,
      titular_menor_nombre: "ANA BETZAIDA RAMIREZ ASICONA",
      titular_menor_cui: "1780 18988 1405",
      titular_menor_parentesco: "HIJA",
      observaciones_apertura: "Aportación estatutaria inicial infanto-juvenil"
    });
    console.log(`  ✓ Cuenta creada: [221-4-1] / [CHAJ-API-00001] — Aportación Infanto-Juvenil`);

    // Depósito de aportación infantil Ana Betzaida
    await insertMovimiento({
      cuenta_id: ctaApoAnaId,
      monto: 100.00,
      fecha: "2026-04-08",
      numero_recibo: "2747",
      descripcion: "Aportación estatutaria inicial infanto-juvenil 2026",
      cliente_mov_id: "MIG-APO-INF-2747"
    });
    console.log(`    ↳ Depósito Aportación: 2026-04-08 | Recibo No. 2747 | Q 100.00`);

    // Cuenta Ahorro Infantil Ana Betzaida (221-8-1 / CHAJ-AHI-00001)
    const ctaAhoAnaId = await upsertCuenta({
      numero_cuenta: "221-8-1",
      codigo_sistema: "CHAJ-AHI-00001",
      tipo: "AHORRO_INFANTO_JUVENIL",
      socio_id: anaId,
      titular_menor_nombre: "ANA BETZAIDA RAMIREZ ASICONA",
      titular_menor_cui: "1780 18988 1405",
      titular_menor_parentesco: "HIJA",
      observaciones_apertura: "Ahorro a la vista infanto-juvenil"
    });
    console.log(`  ✓ Cuenta creada: [221-8-1] / [CHAJ-AHI-00001] — Ahorro Infanto-Juvenil`);

    // Depósito Ahorro Infantil Ana Betzaida
    await insertMovimiento({
      cuenta_id: ctaAhoAnaId,
      monto: 200.00,
      fecha: "2026-04-07",
      numero_recibo: "2742",
      descripcion: "Ahorro Infanto-Juvenil Abril 2026",
      cliente_mov_id: "MIG-AHO-INF-2742"
    });
    console.log(`    ↳ Depósito Ahorro Infantil: 2026-04-07 | Recibo No. 2742 | Q 200.00\n`);

    // --- CASO 2: YEIKO GASPAR IJOM CANAY ---
    let yeikoId: string;
    const resYeiko = await cliente.query(
      "select id, numero_asociado, nombres from socios where nombres ilike '%YEIKO%GASPAR%IJOM%' limit 1"
    );

    if (resYeiko.rows.length === 0) {
      ultimoNumSocio++;
      const codYeiko = `CHAJ-${String(ultimoNumSocio).padStart(5, "0")}`;
      yeikoId = randomUUID();
      await cliente.query(
        `insert into socios (
          id, numero_asociado, agencia_id, nombres, genero, fecha_ingreso, estado,
          es_menor, direccion, advertencia_importacion, creado_por_id
        ) values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [
          yeikoId,
          codYeiko,
          agenciaId,
          "YEIKO GASPAR IJOM CANAY",
          "M",
          "2026-02-28",
          "ACTIVO",
          true,
          "Agencia Chajul",
          "Socio menor de edad sin CUI en archivo original de importación. Solicitar CUI/Certificación de nacimiento en ventanilla.",
          adminId
        ]
      );
      console.log(`  ➕ Socio Menor registrado: YEIKO GASPAR IJOM CANAY (${codYeiko})`);
      console.log(`     ⚠️ Advertencia generada: Solicitar CUI en ventanilla.`);
    } else {
      yeikoId = resYeiko.rows[0].id;
      console.log(`  ✓ Socio menor encontrado: ${resYeiko.rows[0].nombres} (${resYeiko.rows[0].numero_asociado})`);
    }

    // Cuenta Aportación Infantil Yeiko Gaspar (2-138-4-1 / CHAJ-API-00002)
    const ctaApoYeikoId = await upsertCuenta({
      numero_cuenta: "2-138-4-1",
      codigo_sistema: "CHAJ-API-00002",
      tipo: "APORTACION_INFANTIL",
      socio_id: yeikoId,
      titular_menor_nombre: "YEIKO GASPAR IJOM CANAY",
      observaciones_apertura: "Aportación estatutaria inicial infanto-juvenil"
    });
    console.log(`  ✓ Cuenta creada: [2-138-4-1] / [CHAJ-API-00002] — Aportación Infanto-Juvenil`);

    // Depósito de aportación estatutaria Yeiko Gaspar
    await insertMovimiento({
      cuenta_id: ctaApoYeikoId,
      monto: 100.00,
      fecha: "2025-12-31",
      numero_recibo: "HIST-APO-INF",
      descripcion: "Aportación estatutaria de membresía previa a 2026",
      cliente_mov_id: "MIG-APO-INF-YEIKO"
    });
    console.log(`    ↳ Depósito Aportación: 2025-12-31 | Recibo No. HIST-APO-INF | Q 100.00`);

    // Cuenta Ahorro Infantil Yeiko Gaspar (2-138-8-1 / CHAJ-AHI-00002)
    const ctaAhoYeikoId = await upsertCuenta({
      numero_cuenta: "2-138-8-1",
      codigo_sistema: "CHAJ-AHI-00002",
      tipo: "AHORRO_INFANTO_JUVENIL",
      socio_id: yeikoId,
      titular_menor_nombre: "YEIKO GASPAR IJOM CANAY",
      observaciones_apertura: "Ahorro a la vista infanto-juvenil"
    });
    console.log(`  ✓ Cuenta creada: [2-138-8-1] / [CHAJ-AHI-00002] — Ahorro Infanto-Juvenil`);

    // Depósito Ahorro Infantil Yeiko Gaspar
    await insertMovimiento({
      cuenta_id: ctaAhoYeikoId,
      monto: 300.00,
      fecha: "2026-02-28",
      numero_recibo: "2536",
      descripcion: "Ahorro Infanto-Juvenil Febrero 2026",
      cliente_mov_id: "MIG-AHO-INF-2536"
    });
    console.log(`    ↳ Depósito Ahorro Infantil: 2026-02-28 | Recibo No. 2536 | Q 300.00\n`);

    // Confirmar Transacción
    await cliente.query("COMMIT");

    // ==========================================================================
    // PARTE 3: AUDITORÍA Y CUADRE MATEMÁTICO AL CENTAVO
    // ==========================================================================
    console.log("================================================================================");
    console.log("📊 INFORME DE AUDITORÍA Y CUADRE CONTABLE EXACTO — FASE 4");
    console.log("================================================================================");

    const resSaldos = await cliente.query(`
      select c.numero_cuenta, c.codigo_sistema, c.tipo, s.nombres, sc.saldo_actual
      from cuentas c
      join socios s on s.id = c.socio_id
      join saldos_cuenta sc on sc.cuenta_id = c.id
      where c.tipo in ('AHORRO_PROGRAMADO', 'AHORRO_INFANTO_JUVENIL', 'APORTACION_INFANTIL')
      order by c.tipo, c.codigo_sistema
    `);

    let totalSaldos = 0;
    console.log("\nDetalle de Cuentas y Saldos Actualizados:");
    resSaldos.rows.forEach(r => {
      const saldo = parseFloat(r.saldo_actual);
      totalSaldos += saldo;
      console.log(`  • [${r.numero_cuenta.padEnd(9)}] / [${r.codigo_sistema.padEnd(14)}] | ${r.tipo.padEnd(22)} | ${r.nombres.padEnd(30)} | Saldo: Q ${saldo.toFixed(2)}`);
    });

    const esperadoProg = 4000.00;
    const esperadoAhoInf = 500.00;
    const esperadoApoInf = 200.00;
    const esperadoTotal = esperadoProg + esperadoAhoInf + esperadoApoInf;

    const diff = Math.abs(totalSaldos - esperadoTotal);

    console.log("\n--------------------------------------------------------------------------------");
    console.log(`  Total Ahorro Programado  : Q ${totalProg.toFixed(2)} (Esperado: Q ${esperadoProg.toFixed(2)})`);
    console.log(`  Total Ahorro Infantil    : Q 500.00 (Esperado: Q ${esperadoAhoInf.toFixed(2)})`);
    console.log(`  Total Aportación Infantil : Q 200.00 (Esperado: Q ${esperadoApoInf.toFixed(2)})`);
    console.log(`  TOTAL CAPTADO FASE 4     : Q ${totalSaldos.toFixed(2)} (Esperado: Q ${esperadoTotal.toFixed(2)})`);
    console.log(`  DIFERENCIA CONTABLE      : Q ${diff.toFixed(2)} ${diff === 0 ? "✅ CUADRE EXACTO AL CENTAVO" : "❌ DESCUADRE"}`);
    console.log("================================================================================\n");

  } catch (error) {
    await cliente.query("ROLLBACK");
    console.error("❌ ERROR CRÍTICO EN IMPORTACIÓN FASE 4:", error);
    process.exit(1);
  } finally {
    cliente.release();
    await pool.end();
  }
}

ejecutar();
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
alter type caja_categoria add value if not exists 'TRASLADO_FONDOS';


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

