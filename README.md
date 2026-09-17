# Sistema Integral MIF — Fase 1

Reemplazo del Excel de la COOPERATIVA MAYA INVERSIONES FUTURAS R.L. "COMIF R.L."
por una aplicación web. Esta primera fase entrega:

- El **modelo de datos completo** (agencias, usuarios/roles, auditoría, socios,
  cuentas, movimientos, plazo fijo, caja chica, ingresos COMIF) — ver
  `backend/db/schema.sql`.
- **Autenticación con roles** (Administrador, Gerencia, Supervisor de agencia,
  Cajero), con acceso limitado a la agencia de cada usuario.
- El **módulo de Socios** funcionando de punta a punta: alta, edición, búsqueda,
  activar/inactivar, y ficha con sus cuentas (todavía vacías — se llenan en la
  fase 2).
- Auditoría real: cada alta o cambio de un socio queda registrado con quién y
  cuándo lo hizo.
- El frontend ya está configurado como PWA instalable (fase 1 de la ruta hacia
  el modo sin conexión completo, que se construye en la fase 4 del plan).

Las siguientes fases (caja chica y ahorros, plazo fijo e ingresos COMIF, modo
offline y reportes, migración de datos) se agregan sobre esta misma base sin
rediseñarla — ver la propuesta de arquitectura para el detalle completo.

## Estructura del proyecto

```
mif-app/
  backend/    API en Node.js + TypeScript + PostgreSQL
  frontend/   App web en React + TypeScript (Vite, PWA)
```

## Requisitos

- Node.js 20 o superior
- PostgreSQL 14 o superior

## Puesta en marcha (desarrollo local)

### 1. Base de datos

```bash
createdb mif_dev
```

### 2. Backend

```bash
cd backend
cp .env.example .env      # y ajusta DATABASE_URL / JWT_SECRET
npm install
npm run db:migrate        # aplica backend/db/schema.sql (idempotente)
npm run db:seed           # crea la agencia Chajul y los 4 usuarios iniciales
npm run dev               # http://localhost:4000
```

### 3. Frontend

```bash
cd frontend
cp .env.example .env      # VITE_API_URL debe apuntar al backend
npm install
npm run dev               # http://localhost:5173
```

### 4. Ejecución simplificada (desde la raíz del proyecto)

```bash
npm run dev               # Ejecuta Backend (:4000) y Frontend (:5173) al mismo tiempo
npm run db:reset          # Reinicia los datos transaccionales de prueba a cero
```

### Usuarios iniciales configurados (Contraseña para todos: `CambiaEsto123!`):

| Rol | Correo electrónico | Acceso y funciones |
| :--- | :--- | :--- |
| **Administrador** | `admin@mif.coop` | Acceso global, configuración, agencias, usuarios y reinicio |
| **Jefe de Agencia** | `supervisor@mif.coop` | Supervisión de agencia, aprobación de créditos y arqueos |
| **Cajero (Operador)** | `cajero@mif.coop` | Ventanilla de caja, depósitos, retiros y caja chica |
| **Promotor de crédito** | `promotor@mif.coop` | Campo, prospección de socios, créditos y solicitudes |

## Scripts útiles

| Carpeta  | Comando           | Qué hace                                       |
| -------- | ----------------- | ----------------------------------------------- |
| raíz     | `npm run dev`     | Ejecuta Backend y Frontend simultáneamente      |
| raíz     | `npm run db:reset`| Trunca tablas transaccionales a cero            |
| backend  | `npm run dev`     | Backend con recarga automática                  |
| backend  | `npm run build`   | Compila a `dist/` para producción               |
| backend  | `npm run db:migrate` | Aplica `db/schema.sql`                       |
| backend  | `npm run db:seed` | Crea agencia y usuarios iniciales               |
| frontend | `npm run dev`     | Frontend con recarga automática                 |
| frontend | `npm run build`   | Build de producción PWA                         |

## Decisiones técnicas de esta fase

- **Sin ORM con binario propio:** se evaluó Prisma, pero su motor de consultas
  se descarga desde un servidor externo (`binaries.prisma.sh`) que puede estar
  bloqueado en redes restringidas. Se optó por SQL simple (`db/schema.sql`) +
  el driver `pg`, sin dependencias binarias — funciona igual en cualquier red,
  incluida la de la cooperativa.
- **El saldo nunca se guarda como número fijo:** se calcula sumando los
  movimientos de cada cuenta (ver la vista `saldos_cuenta` en el esquema).
  Esto reemplaza las fórmulas de saldo corrido del Excel actual, que se rompían
  al insertar o borrar una fila.
- **Todas las tablas del dominio ya existen**, aunque solo Socios tiene interfaz
  en esta fase — así la fase 2 (caja chica y ahorros) se construye sobre la
  misma base sin migraciones que reordenen lo ya construido.

## Próximos pasos (fase 2 en adelante)

Ver la propuesta de arquitectura entregada antes de esta fase para el plan
completo: caja chica y ahorros, plazo fijo con cálculo de intereses e ISR,
ingresos COMIF, modo sin conexión con cola de sincronización, reportes
consolidados multiagencia, y migración de los datos históricos de los Excel
actuales.
