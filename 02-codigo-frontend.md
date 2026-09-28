# Código del frontend — Sistema Integral MIF

Código real y completo del frontend (React + TypeScript + Vite, configurado como PWA), tal como está construido y probado en la Fase 1: login, listado de socios, alta, edición y agencias.

## Índice de archivos

- [`frontend/.oxlintrc.json`](#frontendoxlintrcjson)
- [`frontend/index.html`](#frontendindexhtml)
- [`frontend/package.json`](#frontendpackagejson)
- [`frontend/tsconfig.app.json`](#frontendtsconfigappjson)
- [`frontend/tsconfig.json`](#frontendtsconfigjson)
- [`frontend/tsconfig.node.json`](#frontendtsconfignodejson)
- [`frontend/vite.config.ts`](#frontendviteconfigts)
- [`frontend/src/App.tsx`](#frontendsrcapptsx)
- [`frontend/src/main.tsx`](#frontendsrcmaintsx)
- [`frontend/src/types.ts`](#frontendsrctypests)
- [`frontend/src/components/BuscadorCuenta.tsx`](#frontendsrccomponentsbuscadorcuentatsx)
- [`frontend/src/components/BuscadorSocio.tsx`](#frontendsrccomponentsbuscadorsociotsx)
- [`frontend/src/components/DualCuentaBadge.tsx`](#frontendsrccomponentsdualcuentabadgetsx)
- [`frontend/src/components/ProtectedRoute.tsx`](#frontendsrccomponentsprotectedroutetsx)
- [`frontend/src/utils/dpiGuatemala.ts`](#frontendsrcutilsdpiguatemalats)
- [`frontend/src/styles/app.css`](#frontendsrcstylesappcss)
- [`frontend/src/styles/tokens.css`](#frontendsrcstylestokenscss)
- [`frontend/src/lib/api.ts`](#frontendsrclibapits)
- [`frontend/src/pages/Agencias.tsx`](#frontendsrcpagesagenciastsx)
- [`frontend/src/pages/AhorroCuentaDetail.tsx`](#frontendsrcpagesahorrocuentadetailtsx)
- [`frontend/src/pages/AhorroCuentaForm.tsx`](#frontendsrcpagesahorrocuentaformtsx)
- [`frontend/src/pages/AhorroList.tsx`](#frontendsrcpagesahorrolisttsx)
- [`frontend/src/pages/AuxiliarCaja.tsx`](#frontendsrcpagesauxiliarcajatsx)
- [`frontend/src/pages/CajaChica.tsx`](#frontendsrcpagescajachicatsx)
- [`frontend/src/pages/Layout.tsx`](#frontendsrcpageslayouttsx)
- [`frontend/src/pages/Login.tsx`](#frontendsrcpageslogintsx)
- [`frontend/src/pages/SocioDetail.tsx`](#frontendsrcpagessociodetailtsx)
- [`frontend/src/pages/SocioForm.tsx`](#frontendsrcpagessocioformtsx)
- [`frontend/src/pages/SociosList.tsx`](#frontendsrcpagessocioslisttsx)
- [`frontend/src/pages/Tablero.tsx`](#frontendsrcpagestablerotsx)
- [`frontend/src/context/AuthContext.tsx`](#frontendsrccontextauthcontexttsx)

---

## `frontend/.oxlintrc.json` {#frontendoxlintrcjson}

```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "plugins": ["react", "typescript", "oxc"],
  "rules": {
    "react/rules-of-hooks": "error",
    "react/only-export-components": ["warn", { "allowConstantExport": true }]
  }
}
```

## `frontend/index.html` {#frontendindexhtml}

```html
<!doctype html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="theme-color" content="#1f6f5c" />
    <meta name="description" content="Sistema Integral COMIF-R.L. — caja chica, ahorros, aportaciones e ingresos de la Cooperativa COMIF-R.L." />
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap" />
    <title>Sistema Integral COMIF-R.L.</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

## `frontend/package.json` {#frontendpackagejson}

```json
{
  "name": "frontend",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "lint": "oxlint",
    "preview": "vite preview"
  },
  "dependencies": {
    "axios": "^1.19.0",
    "react": "^19.2.8",
    "react-dom": "^19.2.8",
    "react-router-dom": "^7.18.2",
    "recharts": "^3.10.1"
  },
  "devDependencies": {
    "@types/node": "^24.13.3",
    "@types/react": "^19.2.18",
    "@types/react-dom": "^19.2.4",
    "@vitejs/plugin-react": "^6.1.0",
    "oxlint": "^1.79.0",
    "typescript": "~6.0.2",
    "vite": "^8.2.2",
    "vite-plugin-pwa": "^1.3.0"
  }
}
```

## `frontend/tsconfig.app.json` {#frontendtsconfigappjson}

```json
{
  "compilerOptions": {
    "tsBuildInfoFile": "./node_modules/.tmp/tsconfig.app.tsbuildinfo",
    "target": "es2023",
    "lib": ["ES2023", "DOM"],
    "module": "esnext",
    "types": ["vite/client"],
    "allowArbitraryExtensions": true,
    "skipLibCheck": true,

    /* Bundler mode */
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "verbatimModuleSyntax": true,
    "moduleDetection": "force",
    "noEmit": true,
    "jsx": "react-jsx",

    /* Linting */
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "erasableSyntaxOnly": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"]
}
```

## `frontend/tsconfig.json` {#frontendtsconfigjson}

```json
{
  "files": [],
  "references": [
    { "path": "./tsconfig.app.json" },
    { "path": "./tsconfig.node.json" }
  ]
}
```

## `frontend/tsconfig.node.json` {#frontendtsconfignodejson}

```json
{
  "compilerOptions": {
    "tsBuildInfoFile": "./node_modules/.tmp/tsconfig.node.tsbuildinfo",
    "target": "es2023",
    "lib": ["ES2023"],
    "types": ["node"],
    "skipLibCheck": true,

    /* Bundler mode */
    "module": "nodenext",
    "allowImportingTsExtensions": true,
    "verbatimModuleSyntax": true,
    "moduleDetection": "force",
    "noEmit": true,

    /* Linting */
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "erasableSyntaxOnly": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["vite.config.ts"]
}
```

## `frontend/vite.config.ts` {#frontendviteconfigts}

```ts
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.svg"],
      manifest: {
        name: "Sistema Integral COMIF-R.L.",
        short_name: "COMIF-R.L.",
        description: "Caja chica, ahorros, aportaciones e ingresos de la Cooperativa COMIF-R.L.",
        theme_color: "#1f6f5c",
        background_color: "#eef1ea",
        display: "standalone",
        start_url: "/",
        icons: [
          { src: "/favicon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
        ],
      },
      workbox: {
        // Fase 1: deja la app instalable y cachea el shell de la interfaz.
        // La cola de sincronización de movimientos sin conexión se construye
        // en la fase 4 del plan (ver la propuesta de arquitectura).
        globPatterns: ["**/*.{js,css,html,svg}"],
        navigateFallbackDenylist: [/^\/api\//],
      },
      devOptions: { enabled: false },
    }),
  ],
});
```

## `frontend/src/App.tsx` {#frontendsrcapptsx}

```tsx
import { Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./pages/Layout";
import Login from "./pages/Login";
import Tablero from "./pages/Tablero";
import SociosList from "./pages/SociosList";
import SocioForm from "./pages/SocioForm";
import SocioDetail from "./pages/SocioDetail";
import Agencias from "./pages/Agencias";
import CajaChica from "./pages/CajaChica";
import AuxiliarCaja from "./pages/AuxiliarCaja";
import AhorroList from "./pages/AhorroList";
import AhorroCuentaForm from "./pages/AhorroCuentaForm";
import AhorroCuentaDetail from "./pages/AhorroCuentaDetail";
import CreditosList from "./pages/CreditosList";
import CreditoSimulador from "./pages/CreditoSimulador";
import CreditoForm from "./pages/CreditoForm";
import CreditoDetail from "./pages/CreditoDetail";
import KardexCarteraPromotor from "./pages/KardexCarteraPromotor";
import PlazoFijoList from "./pages/PlazoFijoList";
import PlazoFijoForm from "./pages/PlazoFijoForm";
import PlazoFijoDetail from "./pages/PlazoFijoDetail";
import AportacionesList from "./pages/AportacionesList";
import Usuarios from "./pages/Usuarios";
import LibroArqueoMensual from "./pages/LibroArqueoMensual";
import Auditoria from "./pages/Auditoria";
import Alertas from "./pages/Alertas";
import Sesiones from "./pages/Sesiones";
import TrasladosInterAgencia from "./pages/TrasladosInterAgencia";
import { ConsolidadoFinanciero } from "./pages/ConsolidadoFinanciero";

import { useAuth } from "./context/AuthContext";

function InicioRedirect() {
  const { usuario } = useAuth();
  if (usuario?.rol === "CAJERO") return <Navigate to="/auxiliar-caja" replace />;
  if (usuario?.rol === "CAJA_CHICA") return <Navigate to="/caja-chica" replace />;
  if (usuario?.rol === "PROMOTOR") return <Navigate to="/promotor/cartera" replace />;
  return <Navigate to="/tablero" replace />;
}

function TableroRouteGuard() {
  const { usuario } = useAuth();
  if (usuario?.rol === "CAJERO") return <Navigate to="/auxiliar-caja" replace />;
  if (usuario?.rol === "CAJA_CHICA") return <Navigate to="/caja-chica" replace />;
  if (usuario?.rol === "PROMOTOR") return <Navigate to="/promotor/cartera" replace />;
  return <Tablero />;
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<InicioRedirect />} />
          <Route path="/tablero" element={<TableroRouteGuard />} />
          <Route path="/arqueos/mensual" element={<LibroArqueoMensual />} />
          <Route path="/socios" element={<SociosList />} />
          <Route path="/socios/nuevo" element={<SocioForm />} />
          <Route path="/socios/:id" element={<SocioDetail />} />
          <Route path="/aportaciones" element={<AportacionesList />} />
          <Route path="/caja-chica" element={<CajaChica />} />
          <Route path="/auxiliar-caja" element={<AuxiliarCaja />} />
          <Route path="/creditos" element={<CreditosList />} />
          <Route path="/creditos/simulador" element={<CreditoSimulador />} />
          <Route path="/creditos/nuevo" element={<CreditoForm />} />
          <Route path="/creditos/:id" element={<CreditoDetail />} />
          <Route path="/promotor/cartera" element={<KardexCarteraPromotor />} />
          <Route path="/ahorros/plazo-fijo" element={<PlazoFijoList />} />
          <Route path="/ahorros/plazo-fijo/nuevo" element={<PlazoFijoForm />} />
          <Route path="/ahorros/plazo-fijo/:id" element={<PlazoFijoDetail />} />
          <Route path="/ahorros/:slug" element={<AhorroList />} />
          <Route path="/ahorros/:slug/nueva" element={<AhorroCuentaForm />} />
          <Route path="/ahorros/:slug/:id" element={<AhorroCuentaDetail />} />
          <Route path="/usuarios" element={<Usuarios />} />
          <Route path="/agencias" element={<Agencias />} />
          <Route path="/auditoria" element={<Auditoria />} />
          <Route path="/alertas" element={<Alertas />} />
          <Route path="/sesiones" element={<Sesiones />} />
          <Route path="/traslados" element={<TrasladosInterAgencia />} />
          <Route path="/consolidado-financiero" element={<ConsolidadoFinanciero />} />

        </Route>
        <Route path="*" element={<InicioRedirect />} />
      </Routes>
    </AuthProvider>
  );
}
```

## `frontend/src/main.tsx` {#frontendsrcmaintsx}

```tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./styles/tokens.css";
import "./styles/app.css";
import App from "./App.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
);
```

## `frontend/src/types.ts` {#frontendsrctypests}

```ts
export type RolUsuario = "ADMIN" | "GERENCIA" | "SUPERVISOR" | "CAJERO" | "CAJA_CHICA" | "PROMOTOR";

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

export interface Traslado {
  id: string;
  socio_id: string;
  socio_nombre: string;
  numero_asociado: string;
  socio_dpi: string | null;
  agencia_origen_id: string;
  agencia_origen_nombre: string;
  agencia_origen_codigo: string;
  agencia_destino_id: string;
  agencia_destino_nombre: string;
  agencia_destino_codigo: string;
  solicitado_por_id: string;
  solicitado_por_nombre: string;
  solicitado_por_rol: string;
  aprobado_por_id: string | null;
  aprobado_por_nombre: string | null;
  estado: "PENDIENTE" | "APROBADO" | "RECHAZADO";
  motivo: string;
  notas_admin: string | null;
  fecha_solicitud: string;
  fecha_resolucion: string | null;
  tiene_credito_activo: boolean;
  tiene_saldo_ahorro: boolean;
  created_at: string;
}

export interface Socio {
  id: string;
  numero_asociado: string;
  agencia_id: string;
  agencia_nombre?: string;
  agencia_codigo?: string;
  nombres: string;
  genero: "M" | "F" | null;
  fecha_ingreso: string;
  estado: "ACTIVO" | "INACTIVO";
  dpi: string | null;
  direccion: string | null;
  telefono: string | null;
  nombre_beneficiario: string | null;
  dpi_beneficiario?: string | null;
  telefono_beneficiario?: string | null;
  parentesco_beneficiario?: string | null;
  advertencia_importacion?: string | null;
  es_menor?: boolean;
  tutor_nombre?: string | null;
  tutor_dpi?: string | null;
  tutor_parentesco?: string | null;
  tutor_telefono?: string | null;
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
  ADMIN: "Administrador de Sistema",
  GERENCIA: "Gerencia General",
  SUPERVISOR: "Supervisor de Agencias",
  CAJERO: "Cajero de Agencia",
  CAJA_CHICA: "Administrador de Caja Chica",
  PROMOTOR: "Promotor de Negocios",
};

export type TipoCuentaAhorro =
  | "AHORRO_CORRIENTE"
  | "AHORRO_PROGRAMADO"
  | "AHORRO_INFANTO_JUVENIL"
  | "AHORRO_SOBRE_PRESTAMO"
  | "AHORRO_PLAZO_FIJO"
  | "APORTACION"
  | "APORTACION_INFANTIL";

export interface Cuenta {
  id: string;
  numero_cuenta: string;
  codigo_sistema?: string | null;
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
  titular_menor_nombre?: string | null;
  titular_menor_parentesco?: string | null;
  titular_menor_cui?: string | null;
  titular_menor_fecha_nacimiento?: string | null;
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
  {
    tipo: "APORTACION",
    slug: "aportacion",
    titulo: "Aportación Estatutaria",
    descripcion: "Capital social institucional del asociado.",
  },
  {
    tipo: "APORTACION_INFANTIL",
    slug: "aportacion-infantil",
    titulo: "Aportación Infanto Juvenil",
    descripcion: "Aportación estatutaria inicial para niñas, niños y jóvenes asociados.",
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
  usuario_rol?: string;
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
  cuotasIngreso?: { count: number; monto: number };
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
    cuotasIngreso?: { count: number; monto: number };
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
  | "TRASLADO_FONDOS"
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
  TRASLADO_FONDOS: { seccion: "PROPIO", tipo: "EGRESO", descripcion: "Traslado de fondos" },
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
  usuario_rol?: string;
  agencia_nombre?: string;
  agencia_origen_nombre?: string;
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
  FONDOS_PROPIOS: "Fondos Propios (COOP COMIF-R.L.)",
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
  cuota_mensual: string;
  cuotas_pagadas?: number;
  destino: string | null;
  garantia: string | null;
  ubicacion_garantia?: string | null;
  nombre_fiador?: string | null;
  dpi_fiador?: string | null;
  telefono_fiador?: string | null;
  direccion_fiador?: string | null;
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
  tiene_cobro_campo_pendiente?: boolean;
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
  codigo_sistema?: string | null;
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
  pago_capital: number;
  pago_interes: number;
  pago_mora: number;
  ahorro_prestamo: number;
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

// ---------------------------------------------------------------------------
// Estados Financieros y Balance General (Fase 10)
// ---------------------------------------------------------------------------
export interface DetalleRubroFinanciero {
  concepto: string;
  codigo?: string;
  monto: number;
  subcuenta?: string;
  porcentaje?: number;
}

export interface ConsolidadoFinancieroData {
  fechaGeneracion: string;
  fechaCorte: string;
  agencia: {
    id: string | null;
    nombre: string;
    codigo: string;
  };
  balanceGeneral: {
    activo: {
      disponible: {
        total: number;
        rubros: DetalleRubroFinanciero[];
      };
      cartera: {
        totalBruto: number;
        provisionEstimada: number;
        totalNeto: number;
        rubros: DetalleRubroFinanciero[];
      };
      totalActivo: number;
    };
    pasivo: {
      captacionesAhorro: {
        total: number;
        rubros: DetalleRubroFinanciero[];
      };
      plazoFijo: {
        capitalVigente: number;
        interesesPorPagar: number;
        total: number;
      };
      totalPasivo: number;
    };
    patrimonio: {
      aportacionesCapital: {
        total: number;
        rubros: DetalleRubroFinanciero[];
      };
      reservaInstitucional: number;
      excedenteNetoPeriodo: number;
      totalPatrimonio: number;
    };
    cuadre: {
      totalActivo: number;
      totalPasivoMasPatrimonio: number;
      diferencia: number;
      cuadrado: boolean;
    };
  };
  estadoResultados: {
    ingresosFinancieros: {
      total: number;
      rubros: DetalleRubroFinanciero[];
    };
    costosFinancieros: {
      total: number;
      rubros: DetalleRubroFinanciero[];
    };
    margenFinancieroBruto: number;
    gastosOperativos: {
      total: number;
      rubros: DetalleRubroFinanciero[];
    };
    excedenteNeto: number;
  };
  calidadCartera: {
    carteraTotal: number;
    creditosVigentes: number;
    creditosMora: number;
    indiceMorosidad: number;
    tramosMora: {
      alDia: { monto: number; cantidad: number; porcentaje: number };
      rango1_30: { monto: number; cantidad: number; porcentaje: number };
      rango31_60: { monto: number; cantidad: number; porcentaje: number };
      rango61_90: { monto: number; cantidad: number; porcentaje: number };
      mas90: { monto: number; cantidad: number; porcentaje: number };
    };
  };
  desgloseAgencias: Array<{
    agenciaId: string;
    nombre: string;
    codigo: string;
    activoTotal: number;
    carteraTotal: number;
    captacionesTotal: number;
    aportacionesTotal: number;
    excedenteNeto: number;
    morosidadPorcentaje: number;
    sociosActivos: number;
  }>;
}
```

## `frontend/src/components/BuscadorCuenta.tsx` {#frontendsrccomponentsbuscadorcuentatsx}

```tsx
import { useEffect, useRef, useState } from "react";
import { api } from "../lib/api";
import { formatoQ } from "../types";
import type { Cuenta, TipoCuentaAhorro } from "../types";

export default function BuscadorCuenta({
  tipo,
  agenciaId,
  permitirInterAgencia = false,
  seleccionada,
  onSeleccionar,
}: {
  tipo: TipoCuentaAhorro;
  agenciaId?: string;
  permitirInterAgencia?: boolean;
  seleccionada: Cuenta | null;
  onSeleccionar: (cuenta: Cuenta | null) => void;
}) {
  const [q, setQ] = useState("");
  const [resultados, setResultados] = useState<Cuenta[]>([]);
  const [abierto, setAbierto] = useState(false);
  const cajaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!q || q.length < 2) {
      setResultados([]);
      return;
    }
    const timeout = setTimeout(() => {
      api
        .get<Cuenta[]>("/cuentas", {
          params: {
            tipo,
            q,
            interAgencia: permitirInterAgencia ? "true" : undefined,
          },
        })
        .then(({ data }) => {
          if (permitirInterAgencia) {
            setResultados(data);
          } else {
            setResultados(data.filter((c) => !agenciaId || c.agencia_id === agenciaId));
          }
        });
    }, 250);
    return () => clearTimeout(timeout);
  }, [q, tipo, agenciaId, permitirInterAgencia]);

  useEffect(() => {
    function onClickFuera(e: MouseEvent) {
      if (cajaRef.current && !cajaRef.current.contains(e.target as Node)) setAbierto(false);
    }
    document.addEventListener("mousedown", onClickFuera);
    return () => document.removeEventListener("mousedown", onClickFuera);
  }, []);

  if (seleccionada) {
    const esInterAgencia = Boolean(agenciaId && seleccionada.agencia_id && seleccionada.agencia_id !== agenciaId);
    return (
      <div className="socio-chip">
        <div style={{ display: "flex", alignItems: "center", gap: "0.45rem", flexWrap: "wrap" }}>
          <strong>{seleccionada.socio_nombres}</strong>
          <span className="mono"> · {seleccionada.numero_cuenta}</span>
          <span> · saldo {formatoQ(seleccionada.saldo_actual)}</span>
          {esInterAgencia && (
            <span
              className="badge"
              style={{
                background: "rgba(147, 51, 234, 0.15)",
                color: "#c084fc",
                border: "1px solid rgba(147, 51, 234, 0.4)",
                fontSize: "0.72rem",
                fontWeight: 700,
                padding: "0.15rem 0.5rem",
              }}
            >
              🔄 Inter-Agencia: {seleccionada.agencia_nombre || "Otra Agencia"}
            </span>
          )}
        </div>
        <button type="button" className="link-btn" onClick={() => onSeleccionar(null)}>
          Cambiar
        </button>
      </div>
    );
  }

  return (
    <div className="buscador-socio" ref={cajaRef}>
      <input
        placeholder={permitirInterAgencia ? "Escribe el nombre del socio o número de cuenta (búsqueda inter-agencia)…" : "Escribe el nombre del socio o número de cuenta…"}
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          setAbierto(true);
        }}
        onFocus={() => setAbierto(true)}
      />
      {abierto && resultados.length > 0 && (
        <ul className="buscador-dropdown">
          {resultados.map((c) => {
            const esOtraAgencia = Boolean(agenciaId && c.agencia_id && c.agencia_id !== agenciaId);
            return (
              <li key={c.id}>
                <button
                  type="button"
                  onClick={() => {
                    onSeleccionar(c);
                    setAbierto(false);
                    setQ("");
                  }}
                  style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.5rem" }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                    <span>{c.socio_nombres}</span>
                    {esOtraAgencia && (
                      <span
                        style={{
                          fontSize: "0.68rem",
                          background: "rgba(147, 51, 234, 0.12)",
                          color: "#c084fc",
                          border: "1px solid rgba(147, 51, 234, 0.35)",
                          padding: "0.1rem 0.4rem",
                          borderRadius: "4px",
                          fontWeight: 700,
                        }}
                      >
                        🔄 {c.agencia_nombre || "Inter-Agencia"}
                      </span>
                    )}
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <span className="mono" style={{ display: "block" }}>{c.numero_cuenta}</span>
                    <span style={{ fontSize: "0.74rem", color: "var(--accent)" }}>{formatoQ(c.saldo_actual)}</span>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      )}
      {abierto && q.length >= 2 && resultados.length === 0 && (
        <div className="buscador-dropdown empty-msg">Sin resultados para "{q}"</div>
      )}
    </div>
  );
}
```

## `frontend/src/components/BuscadorSocio.tsx` {#frontendsrccomponentsbuscadorsociotsx}

```tsx
import { useEffect, useRef, useState } from "react";
import { api } from "../lib/api";
import type { Socio } from "../types";

export default function BuscadorSocio({
  agenciaId,
  permitirInterAgencia = false,
  seleccionado,
  onSeleccionar,
}: {
  agenciaId?: string;
  permitirInterAgencia?: boolean;
  seleccionado: Socio | null;
  onSeleccionar: (socio: Socio | null) => void;
}) {
  const [q, setQ] = useState("");
  const [resultados, setResultados] = useState<Socio[]>([]);
  const [abierto, setAbierto] = useState(false);
  const cajaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!q || q.length < 2) {
      setResultados([]);
      return;
    }
    const timeout = setTimeout(() => {
      api
        .get<{ data: Socio[] }>("/socios", {
          params: {
            q,
            pageSize: 8,
            estado: "ACTIVO",
            interAgencia: permitirInterAgencia ? "true" : undefined,
          },
        })
        .then(({ data }) => {
          if (permitirInterAgencia) {
            setResultados(data.data);
          } else {
            setResultados(data.data.filter((s) => !agenciaId || s.agencia_id === agenciaId));
          }
        });
    }, 250);
    return () => clearTimeout(timeout);
  }, [q, agenciaId, permitirInterAgencia]);

  useEffect(() => {
    function onClickFuera(e: MouseEvent) {
      if (cajaRef.current && !cajaRef.current.contains(e.target as Node)) setAbierto(false);
    }
    document.addEventListener("mousedown", onClickFuera);
    return () => document.removeEventListener("mousedown", onClickFuera);
  }, []);

  if (seleccionado) {
    const esInterAgencia = Boolean(agenciaId && seleccionado.agencia_id && seleccionado.agencia_id !== agenciaId);
    return (
      <div className="socio-chip">
        <div style={{ display: "flex", alignItems: "center", gap: "0.45rem", flexWrap: "wrap" }}>
          <strong>{seleccionado.nombres}</strong>
          <span className="mono"> · {seleccionado.numero_asociado}</span>
          {esInterAgencia && (
            <span
              className="badge"
              style={{
                background: "rgba(147, 51, 234, 0.15)",
                color: "#c084fc",
                border: "1px solid rgba(147, 51, 234, 0.4)",
                fontSize: "0.72rem",
                fontWeight: 700,
                padding: "0.15rem 0.5rem",
              }}
            >
              🔄 Inter-Agencia: {seleccionado.agencia_nombre || seleccionado.agencia_codigo}
            </span>
          )}
        </div>
        <button type="button" className="link-btn" onClick={() => onSeleccionar(null)}>
          Cambiar
        </button>
      </div>
    );
  }

  return (
    <div className="buscador-socio" ref={cajaRef}>
      <input
        placeholder={permitirInterAgencia ? "Escribe el nombre, DPI o número de asociado (búsqueda inter-agencia)…" : "Escribe el nombre o número de asociado…"}
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          setAbierto(true);
        }}
        onFocus={() => setAbierto(true)}
      />
      {abierto && resultados.length > 0 && (
        <ul className="buscador-dropdown">
          {resultados.map((s) => {
            const esOtraAgencia = Boolean(agenciaId && s.agencia_id && s.agencia_id !== agenciaId);
            return (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => {
                    onSeleccionar(s);
                    setAbierto(false);
                    setQ("");
                  }}
                  style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.5rem" }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                    <span>{s.nombres}</span>
                    {esOtraAgencia && (
                      <span
                        style={{
                          fontSize: "0.68rem",
                          background: "rgba(147, 51, 234, 0.12)",
                          color: "#c084fc",
                          border: "1px solid rgba(147, 51, 234, 0.35)",
                          padding: "0.1rem 0.4rem",
                          borderRadius: "4px",
                          fontWeight: 700,
                        }}
                      >
                        🔄 {s.agencia_nombre || s.agencia_codigo}
                      </span>
                    )}
                  </div>
                  <span className="mono">{s.numero_asociado}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
      {abierto && q.length >= 2 && resultados.length === 0 && (
        <div className="buscador-dropdown empty-msg">Sin resultados para "{q}"</div>
      )}
    </div>
  );
}
```

## `frontend/src/components/DualCuentaBadge.tsx` {#frontendsrccomponentsdualcuentabadgetsx}

```tsx
import React from "react";

interface DualCuentaBadgeProps {
  numeroCuenta: string;
  codigoSistema?: string | null;
  className?: string;
}

/**
 * Componente oficial de visualización dual de cuenta:
 * Muestra arriba el número de cuenta original del libro oficial (ej. 165-1-1)
 * y abajo el código interno estructurado del sistema (ej. CHAJ-APO-00001).
 */
export const DualCuentaBadge: React.FC<DualCuentaBadgeProps> = ({
  numeroCuenta,
  codigoSistema,
  className = "",
}) => {
  return (
    <div
      className={`dual-cuenta-badge ${className}`}
      style={{
        display: "inline-flex",
        flexDirection: "column",
        alignItems: "flex-start",
        lineHeight: 1.25,
      }}
    >
      <span
        className="mono"
        style={{
          fontWeight: 700,
          color: "var(--ink, #0f172a)",
          fontSize: "0.88rem",
          letterSpacing: "0.02em",
        }}
      >
        {numeroCuenta}
      </span>
      {codigoSistema && codigoSistema !== numeroCuenta && (
        <span
          className="mono"
          style={{
            fontSize: "0.72rem",
            color: "var(--accent, #0284c7)",
            background: "rgba(2, 132, 199, 0.08)",
            padding: "0.08rem 0.35rem",
            borderRadius: "4px",
            marginTop: "0.15rem",
            fontWeight: 600,
            border: "1px solid rgba(2, 132, 199, 0.2)",
          }}
          title="Código correlativo estructurado del sistema"
        >
          {codigoSistema}
        </span>
      )}
    </div>
  );
};
```

## `frontend/src/components/ProtectedRoute.tsx` {#frontendsrccomponentsprotectedroutetsx}

```tsx
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { usuario } = useAuth();
  const location = useLocation();

  if (!usuario) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }
  return <>{children}</>;
}
```

## `frontend/src/styles/app.css` {#frontendsrcstylesappcss}

```css
:root {
  --sidebar-w: 240px;
  --sidebar-collapsed-w: 56px;
  --sidebar-transition: 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.shell {
  display: grid;
  grid-template-columns: var(--sidebar-w) 1fr;
  min-height: 100vh;
  width: 100%;
  transition: grid-template-columns var(--sidebar-transition);
}
.shell.sidebar-collapsed {
  grid-template-columns: var(--sidebar-collapsed-w) 1fr;
}

/* ═══════════════════════════════════════════════════
   SIDEBAR — COLLAPSIBLE ICON RAIL
═══════════════════════════════════════════════════ */
.sidebar {
  background: #070738;
  border-right: 1px solid rgba(0, 0, 0, 0.06);
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0;
  transition: width var(--sidebar-transition), transform 0.3s ease;
  overflow: hidden;
  position: relative;
  width: var(--sidebar-w);
  /* Fix height to viewport */
  height: 100vh;
  position: sticky;
  top: 0;
  align-self: start;
  z-index: 20;
}
/* Collapsed state */
.shell.sidebar-collapsed .sidebar {
  width: var(--sidebar-collapsed-w);
}
/* Shimmer top line */
.sidebar::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 2px;
  background: linear-gradient(90deg, #BF9903, #eab308, #BF9903);
  background-size: 200% 100%;
  animation: shimmer-bar 3s linear infinite;
  z-index: 1;
}
@keyframes shimmer-bar {
  0%   { background-position: 0% 0%; }
  100% { background-position: 200% 0%; }
}

.mobile-header {
  display: none;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1.25rem;
  background: var(--paper-raised);
  border-bottom: 1px solid var(--line);
  position: sticky;
  top: 0;
  z-index: 40;
}

.hamburger-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: var(--ink);
  padding: 0.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.sidebar-backdrop {
  display: none;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 45;
  opacity: 0;
  transition: opacity 0.3s ease;
  pointer-events: none;
}
.sidebar-backdrop.show {
  display: block;
  opacity: 1;
  pointer-events: auto;
}

/* ── BRAND AREA ── */
.brand {
  display: flex;
  flex-direction: column;
  gap: 0;
  padding: 0;
  background: rgba(5, 150, 105, 0.07);
  border-bottom: 1px solid rgba(255,255,255,0.05);
  flex-shrink: 0;
  overflow: hidden;
}
/* Toggle button at top of brand */
.sidebar-toggle {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.85rem 0.85rem 0.75rem;
  cursor: pointer;
  background: none;
  border: none;
  width: 100%;
  text-align: left;
  position: relative;
}
.sidebar-toggle-logo {
  width: 34px;
  height: 34px;
  background: linear-gradient(135deg, #BF9903 0%, #997b02 100%);
  color: #fff;
  border-radius: 9px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 900;
  font-size: 1rem;
  flex-shrink: 0;
  box-shadow: 0 3px 10px rgba(191,153,3,0.4), 0 0 0 1px rgba(234,179,8,0.2);
  transition: box-shadow 0.2s;
}
.sidebar-toggle:hover .sidebar-toggle-logo {
  box-shadow: 0 4px 14px rgba(191,153,3,0.55), 0 0 0 2px rgba(234,179,8,0.35);
}
.sidebar-toggle-text {
  overflow: hidden;
  transition: opacity var(--sidebar-transition), width var(--sidebar-transition);
  white-space: nowrap;
}
.shell.sidebar-collapsed .sidebar-toggle-text {
  opacity: 0;
  width: 0;
}
.brand .name {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  font-weight: 800;
  font-size: 0.95rem;
  letter-spacing: 0.04em;
  color: #ffffff;
  text-transform: uppercase;
  display: block;
}
.brand .sub {
  font-size: 0.55rem;
  color: #BF9903;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  font-weight: 600;
  display: block;
}
/* Chevron toggle icon */
.sidebar-chevron {
  position: absolute;
  right: 0.7rem;
  top: 50%;
  transform: translateY(-50%) rotate(0deg);
  color: rgba(255,255,255,0.3);
  font-size: 0.7rem;
  transition: transform var(--sidebar-transition), color 0.2s;
  font-style: normal;
}
.shell.sidebar-collapsed .sidebar-chevron {
  transform: translateY(-50%) rotate(180deg);
}
/* Agency badge */
.agency-badge {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  background: rgba(191,153,3,0.15);
  border-top: 1px solid rgba(191,153,3,0.2);
  padding: 0.38rem 0.85rem;
  font-size: 0.65rem;
  font-weight: 700;
  color: #BF9903;
  white-space: nowrap;
  overflow: hidden;
  transition: padding var(--sidebar-transition);
}
.shell.sidebar-collapsed .agency-badge {
  justify-content: center;
  padding: 0.38rem 0;
}
.agency-badge-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #BF9903;
  box-shadow: 0 0 6px #BF9903;
  flex-shrink: 0;
  animation: pulse-dot 2s infinite;
}
.agency-badge-text {
  overflow: hidden;
  transition: opacity var(--sidebar-transition), width var(--sidebar-transition);
  white-space: nowrap;
}
.shell.sidebar-collapsed .agency-badge-text {
  opacity: 0;
  width: 0;
}

/* ── NAV ── */
.nav {
  display: flex;
  flex-direction: column;
  gap: 0.05rem;
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 0.5rem 0.55rem;
  scrollbar-width: thin;
  scrollbar-color: rgba(255,255,255,0.08) transparent;
}
.nav::-webkit-scrollbar { width: 2px; }
.nav::-webkit-scrollbar-track { background: transparent; }
.nav::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }

/* Section labels */
.nav-section {
  font-size: 0.58rem;
  font-weight: 800;
  color: rgba(255,255,255,0.22);
  text-transform: uppercase;
  letter-spacing: 0.12em;
  padding: 0.65rem 0.55rem 0.2rem;
  white-space: nowrap;
  overflow: hidden;
  transition: opacity var(--sidebar-transition), height var(--sidebar-transition), padding var(--sidebar-transition);
}
.shell.sidebar-collapsed .nav-section {
  opacity: 0;
  height: 0;
  padding: 0;
  overflow: hidden;
}

/* Nav links */
.nav a {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.5rem 0.6rem;
  border-radius: 8px;
  color: rgba(255,255,255,0.48);
  text-decoration: none;
  font-size: 0.81rem;
  font-weight: 500;
  transition: all 0.18s ease;
  position: relative;
  white-space: nowrap;
  overflow: hidden;
}
.nav a .nav-icon {
  font-size: 1rem;
  flex-shrink: 0;
  width: 22px;
  text-align: center;
  opacity: 0.75;
  transition: opacity 0.15s, transform 0.15s;
}
.nav a .nav-label {
  transition: opacity var(--sidebar-transition), width var(--sidebar-transition);
  white-space: nowrap;
  overflow: hidden;
}
.shell.sidebar-collapsed .nav a .nav-label {
  opacity: 0;
  width: 0;
}
/* ─────────────────────────────────────────────────────────────
   UNIVERSAL TOOLTIP — aparece en AMBOS modos (colapsado + expandido)
   Pill oscuro flotante a la derecha con flechita — estilo VS Code / Linear
───────────────────────────────────────────────────────────── */

/* Collapsed: centrar ícono */
.shell.sidebar-collapsed .nav a {
  justify-content: center;
  padding: 0.5rem;
}

/* Allow the tooltip to overflow the nav container */
.nav {
  overflow-x: visible;
}
.nav a[data-tooltip] {
  overflow: visible;
}

/* ── Tooltip pill (::before) ── */
.nav a[data-tooltip]::before {
  content: attr(data-tooltip);
  position: absolute;
  /* Horizontally: start right after the sidebar */
  left: 100%;
  margin-left: 10px;
  /* Vertically: center on the link */
  top: 50%;
  transform: translateY(-50%) translateX(-6px);
  /* Pill style */
  background: #162033;
  color: #e2e8f0;
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.3rem 0.72rem;
  border-radius: 7px;
  white-space: nowrap;
  /* Hidden by default */
  opacity: 0;
  pointer-events: none;
  /* Border + shadow */
  border: 1px solid rgba(52, 211, 153, 0.18);
  box-shadow: 0 4px 18px rgba(0,0,0,0.5), 0 0 0 1px rgba(0,0,0,0.2);
  /* z-index to float above content */
  z-index: 9999;
  letter-spacing: 0.01em;
  /* Animate in: 0.3s delay, slide in from left */
  transition: opacity 0.15s ease 0.3s, transform 0.15s ease 0.3s;
}

/* ── Left arrow (::after on the link, only when tooltip is visible) ── */
/* We use a second pseudo trick: since ::after is for the active bar,
   we embed the arrow as a box-shadow notch on ::before itself */
/* Arrow via left border on ::before */
.nav a[data-tooltip]::before {
  /* Add left pointing arrow using box-shadow trick */
  filter: drop-shadow(0 2px 6px rgba(0,0,0,0.4));
}

/* ── Show on hover ── */
.nav a[data-tooltip]:hover::before {
  opacity: 1;
  transform: translateY(-50%) translateX(0);
}

/* ── In collapsed mode: anchor from collapsed width ── */
.shell.sidebar-collapsed .nav a[data-tooltip]::before {
  left: 100%;
  margin-left: 8px;
}


.nav a:hover {
  background: rgba(255,255,255,0.07);
  color: rgba(255,255,255,0.9);
}
.nav a:hover .nav-icon {
  opacity: 1;
  transform: scale(1.1);
}
.nav a.active {
  background: linear-gradient(135deg, rgba(5,150,105,0.3) 0%, rgba(16,185,129,0.15) 100%);
  color: #ffffff;
  font-weight: 600;
  box-shadow: 0 0 0 1px rgba(52,211,153,0.2), inset 0 0 10px rgba(52,211,153,0.06);
}
.nav a.active .nav-icon {
  opacity: 1;
}
.nav a.active::after {
  content: '';
  position: absolute;
  right: 0;
  top: 20%;
  bottom: 20%;
  width: 3px;
  background: linear-gradient(180deg, #BF9903, #997b02);
  border-radius: 3px 0 0 3px;
}
.shell.sidebar-collapsed .nav a.active::after {
  right: auto;
  left: 0;
  border-radius: 0 3px 3px 0;
}

/* ── SIDEBAR FOOTER ── */
.sidebar-footer {
  margin-top: 0;
  border-top: 1px solid rgba(255,255,255,0.06);
  padding: 0.6rem 0.7rem;
  font-size: 0.85rem;
  flex-shrink: 0;
  background: rgba(0,0,0,0.2);
  overflow: hidden;
}
.sidebar-footer-inner {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  white-space: nowrap;
}
.sidebar-footer .who {
  font-weight: 600;
  color: #ffffff;
  font-size: 0.8rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  transition: opacity var(--sidebar-transition), width var(--sidebar-transition);
}
.sidebar-footer .role {
  color: rgba(255,255,255,0.38);
  font-size: 0.68rem;
  transition: opacity var(--sidebar-transition);
}
.sidebar-footer-text {
  flex: 1;
  overflow: hidden;
  transition: opacity var(--sidebar-transition), width var(--sidebar-transition);
}
.shell.sidebar-collapsed .sidebar-footer-text {
  opacity: 0;
  width: 0;
}
.shell.sidebar-collapsed .sidebar-footer-inner {
  justify-content: center;
}
.shell.sidebar-collapsed .sidebar-footer-logout {
  display: none;
}
.link-btn {
  background: none;
  border: none;
  color: var(--accent-strong);
  cursor: pointer;
  padding: 0;
  font-size: 0.82rem;
  margin-top: 0.4rem;
  font-weight: 600;
}

.content {
  padding: 1rem 1.5rem;
  max-width: none;
  width: 100%;
  box-sizing: border-box;
}

.dashboard-grid {
  display: grid;
  grid-template-columns: 1.15fr 1fr;
  gap: 1.5rem;
  align-items: start;
  width: 100%;
}
@media (max-width: 1100px) {
  .dashboard-grid {
    grid-template-columns: 1fr;
  }
}

/* ==========================================================================
   DASHBOARD / TABLERO - PANTALLA COMPLETA & TIEMPO REAL
   ========================================================================== */
.dashboard-container {
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
  width: 100%;
}

@media (min-width: 1024px) {
  .content:has(.dashboard-container) {
    padding: 0.75rem 1.25rem;
  }
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.6rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid var(--line);
}

.dashboard-title-area h1 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 800;
  letter-spacing: -0.02em;
}

.dashboard-title-area p {
  margin: 0.1rem 0 0;
  font-size: 0.78rem;
  color: var(--ink-soft);
}

.live-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  background: rgba(16, 185, 129, 0.12);
  color: #10b981;
  border: 1px solid rgba(16, 185, 129, 0.3);
  font-size: 0.72rem;
  font-weight: 700;
  padding: 0.2rem 0.55rem;
  border-radius: 999px;
  user-select: none;
}

@keyframes pulse-dot {
  0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); }
  70% { transform: scale(1.15); box-shadow: 0 0 0 5px rgba(16, 185, 129, 0); }
  100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
}

@keyframes tooltip-in {
  from { opacity: 0; transform: translateY(-50%) translateX(-4px); }
  to   { opacity: 1; transform: translateY(-50%) translateX(0); }
}

.live-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background-color: #10b981;
  animation: pulse-dot 2s infinite;
}

/* Menú desplegable de opciones administrativas */
.dashboard-options-dropdown {
  position: relative;
  display: inline-block;
}

.dashboard-dropdown-menu {
  position: absolute;
  right: 0;
  top: calc(100% + 6px);
  background: var(--paper-raised);
  border: 1px solid var(--line);
  border-radius: 8px;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.4);
  padding: 0.4rem;
  min-width: 270px;
  z-index: 60;
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.dashboard-dropdown-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
  padding: 0.5rem 0.75rem;
  border-radius: 6px;
  border: none;
  background: transparent;
  color: var(--ink);
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  text-align: left;
  transition: all 0.15s ease;
}

.dashboard-dropdown-item:hover {
  background: var(--mono-bg);
}

.dashboard-dropdown-item.danger {
  color: #ef4444;
}
.dashboard-dropdown-item.danger:hover {
  background: rgba(239, 68, 68, 0.12);
}

/* Banda superior de KPIs Financieros */
.dashboard-kpi-band {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.5rem;
  width: 100%;
}

@media (max-width: 900px) {
  .dashboard-kpi-band {
    grid-template-columns: repeat(2, 1fr);
  }
}

.kpi-tile {
  background: var(--paper-raised);
  border: 1px solid var(--line);
  border-radius: 8px;
  padding: 0.5rem 0.7rem;
  text-decoration: none;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-height: 60px;
  box-shadow: var(--shadow);
  transition: transform 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease;
}

.kpi-tile:hover {
  transform: translateY(-2px);
  border-color: var(--accent);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.kpi-tile.accent {
  border-color: rgba(2, 132, 199, 0.45);
  background: linear-gradient(145deg, var(--paper-raised), rgba(2, 132, 199, 0.05));
}

.kpi-tile-label {
  font-family: "IBM Plex Mono", monospace;
  font-size: 0.62rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--ink-soft);
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: block;
}

.kpi-tile-value {
  font-family: "IBM Plex Mono", monospace;
  font-size: clamp(0.92rem, 1.1vw, 1.15rem);
  font-weight: 700;
  color: var(--ink);
  line-height: 1.2;
  margin: 0.12rem 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: block;
}

.kpi-tile-sub {
  font-size: 0.68rem;
  color: var(--ink-soft);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: block;
}

/* Contenedor inferior de 2 columnas balanceadas */
/* Contenedor inferior de analítica panorámica */
.dashboard-lower-grid {
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
  width: 100%;
}

.dashboard-charts-grid {
  display: grid;
  grid-template-columns: 1fr 1fr 1.15fr;
  gap: 0.65rem;
  margin-top: 0.45rem;
  width: 100%;
}

@media (max-width: 1100px) {
  .dashboard-charts-grid {
    grid-template-columns: 1fr 1fr;
  }
}

@media (max-width: 768px) {
  .dashboard-charts-grid {
    grid-template-columns: 1fr;
  }
}

.dashboard-panel-card {
  background: var(--paper-raised);
  border: 1px solid var(--line);
  border-radius: var(--radius);
  padding: 0.8rem 1rem;
  box-shadow: var(--shadow);
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
}

/* ==========================================================================
   ARQUITECTURA DE UNA SOLA PANTALLA (100VH SIN SCROLL DE PÁGINA)
   ========================================================================== */
.screen-container {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 2.2rem);
  max-height: calc(100vh - 2.2rem);
  overflow: hidden;
  gap: 0.65rem;
  width: 100%;
}
@media (max-width: 1024px) {
  .screen-container {
    height: auto;
    max-height: none;
    overflow: visible;
  }
}

.screen-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem;
  padding-bottom: 0.4rem;
  border-bottom: 1px solid var(--line);
  flex-shrink: 0;
}
.screen-header h1 {
  font-size: 1.25rem;
  margin: 0;
  letter-spacing: -0.02em;
}
.screen-header p {
  font-size: 0.8rem;
  color: var(--ink-soft);
  margin: 0.1rem 0 0;
}

.screen-kpis {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 0.5rem;
  flex-shrink: 0;
}

.screen-kpi-tile {
  background: var(--paper-raised);
  border: 1px solid var(--line);
  border-radius: var(--radius);
  padding: 0.4rem 0.65rem;
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-width: 0;
  gap: 0.15rem;
}
.screen-kpi-tile.accent {
  border-left: 3px solid var(--accent);
}
.screen-kpi-label {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--ink-soft);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: block;
}
.screen-kpi-value {
  font-size: 1.15rem;
  font-weight: 700;
  color: var(--ink);
  line-height: 1.2;
  white-space: nowrap;
  display: block;
}
.screen-kpi-tile.accent .screen-kpi-value {
  color: var(--accent);
}
.screen-kpi-sub {
  font-size: 0.68rem;
  color: var(--ink-soft);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: block;
}

.screen-split-layout {
  display: grid;
  grid-template-columns: 360px 1fr;
  gap: 0.75rem;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}
@media (max-width: 1100px) {
  .screen-split-layout {
    grid-template-columns: 1fr;
    overflow: visible;
  }
}

.screen-panel {
  background: var(--paper-raised);
  border: 1px solid var(--line);
  border-radius: var(--radius);
  padding: 0.85rem 1rem;
  box-shadow: var(--shadow);
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
}
.screen-panel.scrollable {
  overflow-y: auto;
}

.table-scroll-container {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overflow-x: auto;
  border: 1px solid var(--line);
  border-radius: var(--radius);
  background: var(--paper-raised);
}
.table-scroll-container table thead th {
  position: sticky;
  top: 0;
  z-index: 10;
  background: var(--mono-bg);
}

.table-compact th,
.table-compact td {
  padding: 0.35rem 0.55rem;
  font-size: 0.82rem;
  line-height: 1.25;
}

.screen-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
  flex-shrink: 0;
}

.screen-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.75rem;
  padding-top: 0.35rem;
  border-top: 1px solid var(--line);
  flex-shrink: 0;
  font-size: 0.82rem;
}

.page-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 1.25rem;
  border-bottom: 1px solid var(--line);
  padding-bottom: 0.85rem;
}
.page-head h1 {
  font-size: 1.5rem;
  letter-spacing: -0.02em;
}
.page-head p {
  color: var(--ink-soft);
  margin: 0.2rem 0 0;
  font-size: 0.9rem;
}

.card {
  background: var(--paper-raised);
  border: 1px solid var(--line);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  padding: 1.25rem 1.4rem;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.45rem;
  border: 1px solid rgba(5, 150, 105, 0.4);
  border-radius: 8px;
  padding: 0.52rem 1.05rem;
  font-size: 0.86rem;
  font-weight: 600;
  cursor: pointer;
  background: linear-gradient(135deg, #059669 0%, #047857 100%);
  color: #ffffff;
  text-decoration: none;
  box-shadow: 0 2px 6px rgba(5, 150, 105, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.18);
  transition: all 0.18s cubic-bezier(0.4, 0, 0.2, 1);
  user-select: none;
  white-space: nowrap;
}
.btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(5, 150, 105, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.25);
  color: #ffffff;
}
.btn:active:not(:disabled) {
  transform: translateY(0) scale(0.98);
  box-shadow: 0 1px 3px rgba(5, 150, 105, 0.3);
}
.btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
  filter: grayscale(0.2);
  transform: none !important;
  box-shadow: none !important;
}

.btn.secondary {
  background: rgba(255, 255, 255, 0.9);
  border-color: var(--line);
  color: var(--ink);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}
.btn.secondary:hover:not(:disabled) {
  background: #ffffff;
  border-color: #94a3b8;
  color: #0f172a;
  transform: translateY(-1px);
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.08);
}
.btn.secondary:active:not(:disabled) {
  transform: translateY(0) scale(0.98);
  background: var(--mono-bg);
}

.btn.danger {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  color: #ffffff;
  border: 1px solid rgba(220, 38, 38, 0.4);
  box-shadow: 0 2px 6px rgba(220, 38, 38, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.18);
}
.btn.danger:hover:not(:disabled) {
  background: linear-gradient(135deg, #f87171 0%, #ef4444 100%);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(220, 38, 38, 0.35);
  color: #ffffff;
}
.btn.danger:active:not(:disabled) {
  transform: translateY(0) scale(0.98);
}

.btn-sm, .btn.btn-sm {
  padding: 0.35rem 0.65rem;
  font-size: 0.78rem;
  border-radius: 6px;
  gap: 0.3rem;
}
.btn-xs, .btn.btn-xs {
  padding: 0.22rem 0.5rem;
  font-size: 0.72rem;
  border-radius: 5px;
  gap: 0.25rem;
}
.btn-icon {
  padding: 0.45rem;
  border-radius: 8px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  margin-bottom: 1rem;
}
.field label {
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--ink-soft);
}
.field input,
.field select {
  border: 1px solid var(--line);
  border-radius: 8px;
  padding: 0.55rem 0.7rem;
  font-size: 0.94rem;
  background: var(--paper);
  color: var(--ink);
  font-family: inherit;
}
.field input:focus,
.field select:focus {
  outline: 2px solid var(--accent);
  outline-offset: 1px;
}
.field .hint {
  font-size: 0.76rem;
  color: var(--ink-soft);
}
.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0 1.25rem;
}
@media (max-width: 640px) {
  .form-grid {
    grid-template-columns: 1fr;
  }
  .shell {
    grid-template-columns: 1fr;
  }
}

.alert {
  border-radius: 8px;
  padding: 0.7rem 1rem;
  font-size: 0.88rem;
  margin-bottom: 1rem;
}
.alert.error {
  background: var(--danger-bg);
  color: var(--danger);
  border: 1px solid var(--danger);
}
.alert.success {
  background: #ecfdf5;
  color: #065f46;
  border: 1px solid #10b981;
}

.table-wrap {
  overflow-x: auto;
  border: 1px solid var(--line);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
}
table {
  width: 100%;
  border-collapse: collapse;
  background: var(--paper-raised);
  min-width: 640px;
}
th,
td {
  text-align: left;
  padding: 0.7rem 0.95rem;
  font-size: 0.88rem;
  border-bottom: 1px solid var(--line);
  color: var(--ink);
}
thead th {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  font-size: 0.74rem;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  font-weight: 700;
  color: var(--ink-soft);
  background: var(--mono-bg);
  border-bottom: 1px solid var(--line);
  white-space: nowrap;
}
tbody tr:nth-child(even) {
  background: transparent;
}
/* NO CAMBIAR COLOR AL PASAR EL CURSOR */
tbody tr:hover {
  background: inherit !important;
}
tbody tr:last-child td {
  border-bottom: none;
}
td a {
  font-weight: 600;
  text-decoration: none;
}

.badge {
  display: inline-block;
  font-size: 0.74rem;
  font-weight: 600;
  padding: 0.2rem 0.6rem;
  border-radius: 6px;
  border: 1px solid var(--line);
  font-family: inherit;
  line-height: 1.2;
}
.badge.activo, .badge.activa, .badge.desembolsado {
  background: rgba(16, 185, 129, 0.15);
  color: #10b981;
  border-color: rgba(16, 185, 129, 0.3);
}
.badge.inactivo, .badge.cerrada, .badge.liquidado, .badge.cancelado {
  background: var(--mono-bg);
  color: var(--ink-soft);
  border-color: var(--line);
}
.badge.danger, .badge.rechazado {
  background: rgba(239, 68, 68, 0.15);
  color: #f87171;
  border-color: rgba(239, 68, 68, 0.3);
}
.badge.warning, .badge.solicitud {
  background: rgba(245, 158, 11, 0.15);
  color: #fbbf24;
  border-color: rgba(245, 158, 11, 0.3);
}
.badge.info, .badge.aprobado {
  background: rgba(59, 130, 246, 0.15);
  color: #60a5fa;
  border-color: rgba(59, 130, 246, 0.3);
}

.searchbar {
  display: flex;
  gap: 0.6rem;
  margin-bottom: 1.1rem;
  flex-wrap: wrap;
}
.searchbar input {
  flex: 1;
  min-width: 220px;
  border: 1px solid var(--line);
  border-radius: 8px;
  padding: 0.55rem 0.8rem;
  background: var(--paper-raised);
  color: var(--ink);
}

.login-wrap {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 1.5rem;
}
.login-card {
  width: 100%;
  max-width: 380px;
}
.login-card h1 {
  font-size: 1.6rem;
  margin-bottom: 0.35rem;
}
.login-card .sub {
  color: var(--ink-soft);
  font-size: 0.9rem;
  margin-bottom: 1.5rem;
}

.empty {
  text-align: center;
  padding: 2.5rem 1rem;
  color: var(--ink-soft);
}

.buscador-socio {
  position: relative;
}
.buscador-socio > input {
  width: 100%;
  border: 1px solid var(--line);
  border-radius: 8px;
  padding: 0.55rem 0.7rem;
  background: var(--paper);
  color: var(--ink);
  font-family: inherit;
  font-size: 0.94rem;
}
.buscador-dropdown {
  position: absolute;
  z-index: 20;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  background: var(--paper-raised);
  border: 1px solid var(--line);
  border-radius: 8px;
  box-shadow: var(--shadow);
  list-style: none;
  margin: 0;
  padding: 0.25rem;
  max-height: 220px;
  overflow-y: auto;
}
.buscador-dropdown li button {
  width: 100%;
  display: flex;
  justify-content: space-between;
  gap: 0.5rem;
  background: none;
  border: none;
  text-align: left;
  padding: 0.5rem 0.6rem;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.88rem;
  color: var(--ink);
}
.buscador-dropdown li button:hover {
  background: var(--mono-bg);
}
.buscador-dropdown.empty-msg {
  padding: 0.6rem 0.75rem;
  font-size: 0.85rem;
  color: var(--ink-soft);
}
.socio-chip {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  border: 1px solid var(--line);
  border-radius: 8px;
  padding: 0.55rem 0.8rem;
  background: var(--mono-bg);
  font-size: 0.9rem;
}

.stat-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 1.75rem;
}
.stat-card {
  background: var(--paper-raised);
  border: 1px solid var(--line);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  padding: 1.1rem 1.25rem;
}
.stat-card .label {
  font-family: "IBM Plex Mono", monospace;
  font-size: 0.68rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--ink-soft);
  display: block;
  margin-bottom: 0.4rem;
}
.stat-card .value {
  display: block;
  font-family: "IBM Plex Mono", monospace;
  font-variant-numeric: tabular-nums;
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--ink);
  margin-bottom: 0.25rem;
  line-height: 1.25;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.stat-card .sub {
  display: block;
  font-size: 0.78rem;
  color: var(--ink-soft);
  line-height: 1.3;
}
.stat-card.accent {
  border-color: var(--accent);
}
.stat-card.accent .value {
  color: var(--accent-strong);
}

.movs-form {
  display: flex;
  gap: 0.6rem;
  flex-wrap: wrap;
  align-items: flex-end;
  background: var(--mono-bg);
  border: 1px solid var(--line);
  border-radius: 10px;
  padding: 1rem;
  margin-bottom: 1.25rem;
}
.movs-form .field {
  margin-bottom: 0;
  min-width: 130px;
}
.movs-form .field.grow {
  flex: 1;
  min-width: 180px;
}
.tipo-toggle {
  display: flex;
  border: 1px solid var(--line);
  border-radius: 8px;
  overflow: hidden;
}
.tipo-toggle button {
  border: none;
  background: var(--paper-raised);
  color: var(--ink-soft);
  padding: 0.55rem 0.9rem;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
}
.tipo-toggle button.on.deposito {
  background: var(--accent);
  color: var(--paper-raised);
}
.tipo-toggle button.on.retiro {
  background: var(--danger);
  color: var(--paper-raised);
}

.movimiento-monto.deposito {
  color: var(--accent-strong);
}
.movimiento-monto.retiro {
  color: var(--danger);
}

.tabs {
  display: flex;
  gap: 0.4rem;
  border-bottom: 1px solid var(--line);
  margin-bottom: 1.25rem;
}
.tabs a {
  padding: 0.6rem 1rem;
  font-size: 0.88rem;
  font-weight: 600;
  color: var(--ink-soft);
  text-decoration: none;
  border-bottom: 2px solid transparent;
  margin-bottom: -1px;
}
.tabs a.active {
  color: var(--accent-strong);
  border-bottom-color: var(--accent);
}
.tabs button {
  padding: 0.6rem 1rem;
  font-size: 0.88rem;
  font-weight: 600;
  color: var(--ink-soft);
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  margin-bottom: -1px;
  cursor: pointer;
}
.tabs button.on {
  color: var(--accent-strong);
  border-bottom-color: var(--accent);
}

.pagination {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-top: 1rem;
  font-size: 0.85rem;
  color: var(--ink-soft);
}

/* ==========================================================================
   DISEÑO RESPONSIVO (PC, TABLET Y TELÉFONOS MÓVILES)
   ========================================================================== */

/* Tablets y pantallas medianas (≤ 1024px) */
@media (max-width: 1024px) {
  .shell {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
    height: 100vh;
    overflow: hidden;
  }
  .mobile-header {
    display: flex;
    background: #070738;
    color: #ffffff;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  }
  .hamburger-btn {
    color: #ffffff;
  }
  .sidebar {
    position: fixed;
    top: 0;
    left: 0;
    bottom: 0;
    width: 290px;
    z-index: 50;
    background: #070738;
    transform: translateX(-100%);
    box-shadow: 8px 0 24px rgba(0, 0, 0, 0.4);
    border-right: 1px solid rgba(255, 255, 255, 0.08);
    padding: 0;
    transition: transform 0.28s cubic-bezier(0.4, 0, 0.2, 1);
  }
  .sidebar.open {
    transform: translateX(0);
  }
  .content {
    padding: 0.75rem 1rem;
    max-width: 100%;
    width: 100%;
    box-sizing: border-box;
    overflow-x: hidden;
    overflow-y: auto;
    flex: 1;
    height: calc(100vh - 56px);
  }
  .stat-grid {
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)) !important;
    gap: 0.65rem !important;
  }
  .page-head h1 {
    font-size: 1.3rem;
  }
}

/* Teléfonos móviles y pantallas compactas (≤ 640px) */
@media (max-width: 640px) {
  .sidebar {
    width: 86%;
    max-width: 320px;
  }
  .content {
    padding: 0.6rem 0.6rem;
    height: calc(100vh - 52px);
  }
  .stat-grid {
    grid-template-columns: repeat(2, 1fr) !important;
    gap: 0.5rem !important;
  }
  .stat-card .value {
    font-size: 1.15rem !important;
  }
  .page-head h1 {
    font-size: 1.15rem;
  }
  .table-wrap {
    margin: 0 -0.5rem;
    border-radius: 0;
    border-left: none;
    border-right: none;
  }
}


/* ==========================================================================
   ESTILOS OFICIALES DE IMPRESIÓN (AJUSTE PERFECTO EN PAPEL CARTA)
   ========================================================================== */
.print-only {
  display: none !important;
}

/* ═══════════════════════════════════════════════════
   ESTÁNDAR GLOBAL DE IMPRESIÓN OFICIAL DE DOCUMENTOS
   ═══════════════════════════════════════════════════ */
@media print {
  @page {
    size: letter portrait;
    margin: 8mm 10mm;
  }

  /* Reset global para papel limpio */
  html, body {
    background: #ffffff !important;
    color: #000000 !important;
    font-size: 8pt !important;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif !important;
    margin: 0 !important;
    padding: 0 !important;
    height: auto !important;
    min-height: auto !important;
    overflow: visible !important;
  }

  /* Elementos de interfaz y navegación que NUNCA se imprimen */
  .sidebar,
  .mobile-header,
  .app-header,
  .no-print,
  button,
  .btn,
  .searchbar,
  .pagination,
  .screen-toolbar,
  .screen-footer,
  select,
  input,
  .live-badge,
  .link-btn,
  .sidebar-backdrop {
    display: none !important;
  }

  /* Si se imprime desde un MODAL renderizado en document.body (createPortal),
     ocultamos el árbol completo de la aplicación #root para evitar pantallas en blanco y solapamientos */
  body:has(.libro-caja-modal-overlay, .libro-caja-modal-card, .contrato-modal-overlay, .contrato-modal-card, .caja-chica-modal-overlay, .caja-chica-modal-card, .arqueo-modal-overlay, .recibo-modal-overlay) #root {
    display: none !important;
  }

  /* Estructura base de la aplicación cuando se imprime una pantalla estándar sin modal */
  #root,
  .shell,
  .content {
    display: block !important;
    position: static !important;
    width: 100% !important;
    max-width: 100% !important;
    margin: 0 !important;
    padding: 0 !important;
    overflow: visible !important;
    height: auto !important;
    min-height: auto !important;
    box-shadow: none !important;
    border: none !important;
    background: transparent !important;
  }

  /* Modales contenedores de reportes imprimibles (directos en document.body o en root) */
  .modal,
  .modal-overlay,
  .libro-caja-modal-overlay,
  .contrato-modal-overlay,
  .caja-chica-modal-overlay,
  .arqueo-modal-overlay,
  .recibo-modal-overlay,
  .modal-backdrop {
    display: block !important;
    position: static !important;
    width: 100% !important;
    max-width: 100% !important;
    margin: 0 !important;
    padding: 0 !important;
    background: #ffffff !important;
    box-shadow: none !important;
    border: none !important;
    overflow: visible !important;
    height: auto !important;
    max-height: none !important;
    visibility: visible !important;
    opacity: 1 !important;
    pointer-events: auto !important;
    backdrop-filter: none !important;
    -webkit-backdrop-filter: none !important;
    inset: auto !important;
    transform: none !important;
  }

  .modal-content,
  .modal-card,
  .libro-caja-modal-card,
  .contrato-modal-card,
  .caja-chica-modal-card,
  .arqueo-modal-card,
  .recibo-modal-card {
    display: block !important;
    position: static !important;
    width: 100% !important;
    max-width: 100% !important;
    margin: 0 !important;
    padding: 0 !important;
    background: #ffffff !important;
    color: #000000 !important;
    box-shadow: none !important;
    border: none !important;
    overflow: visible !important;
    height: auto !important;
    max-height: none !important;
    visibility: visible !important;
    opacity: 1 !important;
    border-radius: 0 !important;
    animation: none !important;
    transform: none !important;
  }

  .modal-body,
  .print-container {
    display: block !important;
    overflow: visible !important;
    height: auto !important;
    max-height: none !important;
    padding: 0 !important;
    margin: 0 !important;
    visibility: visible !important;
    opacity: 1 !important;
  }

  /* Mostrar elementos marcados como print-only */
  .print-only {
    display: block !important;
    visibility: visible !important;
  }

  /* Tablas de impresión oficiales */
  .table-wrap,
  .table-scroll-container {
    overflow: visible !important;
    height: auto !important;
    max-height: none !important;
    box-shadow: none !important;
    border: 1px solid #334155 !important;
    margin: 0 !important;
  }

  table {
    width: 100% !important;
    min-width: 100% !important;
    border-collapse: collapse !important;
    font-size: 7.5pt !important;
  }

  th, td {
    border: 1px solid #cbd5e1 !important;
    padding: 2.5px 4px !important;
    color: #000000 !important;
  }

  th {
    background: #f8fafc !important;
    color: #0f172a !important;
    font-weight: 700 !important;
  }

  tfoot {
    display: table-row-group !important;
  }

  tfoot tr {
    border-top: 2px solid #000000 !important;
    font-weight: bold !important;
  }

  /* Evitar saltos de página indebidos en firmas, tarjetas y filas */
  tr,
  .card,
  .stat-card,
  .stat-grid,
  .firmas-block,
  .firmas-container {
    page-break-inside: avoid !important;
    break-inside: avoid !important;
  }
}

/* ═══════════════════════════════════════════════════
   MODALES EJECUTIVOS FINTECH Y PANTALLAS EMERGENTES
   ═══════════════════════════════════════════════════ */
.modal,
.modal-overlay,
.recibo-modal-overlay,
.caja-chica-modal-overlay,
.modal-backdrop {
  position: fixed;
  inset: 0;
  background-color: rgba(15, 23, 42, 0.72);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  z-index: 9999;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 1.25rem;
  overflow-y: auto;
  animation: modal-fade-in 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

@keyframes modal-fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

.modal-content,
.modal-card,
.caja-chica-modal-card,
.recibo-modal-card {
  background: var(--paper-raised, #ffffff);
  border: 1px solid rgba(226, 232, 240, 0.8);
  border-radius: 14px;
  box-shadow: 0 25px 50px -12px rgba(15, 23, 42, 0.35), 0 0 0 1px rgba(0, 0, 0, 0.04);
  padding: 1.35rem 1.5rem;
  width: 100%;
  max-width: 580px;
  max-height: 88vh;
  display: flex;
  flex-direction: column;
  color: var(--ink);
  position: relative;
  animation: modal-scale-in 0.22s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  overflow: hidden;
  box-sizing: border-box;
}

@keyframes modal-scale-in {
  from { opacity: 0; transform: scale(0.96) translateY(6px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid var(--line);
  margin-bottom: 0.85rem;
  flex-shrink: 0;
}
.modal-header h2,
.modal-header h3,
.modal-title {
  margin: 0;
  font-size: 1.08rem;
  font-weight: 700;
  color: var(--ink);
  display: flex;
  align-items: center;
  gap: 0.45rem;
}
.modal-close-btn {
  background: transparent;
  border: none;
  color: var(--ink-soft);
  font-size: 1.25rem;
  cursor: pointer;
  padding: 0.2rem 0.4rem;
  border-radius: 6px;
  line-height: 1;
  transition: all 0.15s;
}
.modal-close-btn:hover {
  background: var(--mono-bg);
  color: var(--ink);
}

.modal-body {
  flex: 1;
  overflow-y: auto;
  padding-right: 0.4rem;
  margin-right: -0.4rem;
  scrollbar-width: thin;
  scrollbar-color: rgba(148, 163, 184, 0.4) transparent;
}
.modal-body::-webkit-scrollbar {
  width: 4px;
}
.modal-body::-webkit-scrollbar-thumb {
  background: rgba(148, 163, 184, 0.4);
  border-radius: 4px;
}

.modal-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.6rem;
  padding-top: 0.85rem;
  border-top: 1px solid var(--line);
  margin-top: 0.85rem;
  flex-shrink: 0;
}

/* Modales Adaptativos en Tablets y Teléfonos Móviles */
@media (max-width: 768px) {
  .modal,
  .modal-overlay,
  .recibo-modal-overlay,
  .caja-chica-modal-overlay {
    align-items: flex-end;
    padding: 0;
  }
  .modal-content,
  .modal-card,
  .caja-chica-modal-card,
  .recibo-modal-card {
    max-width: 100%;
    width: 100%;
    max-height: 94vh;
    border-radius: 18px 18px 0 0;
    padding: 1.15rem 1rem 1.35rem;
    border-bottom: none;
    animation: modal-slide-up 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  }
}

@keyframes modal-slide-up {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}


/* Estilos para créditos con cobro pendiente de aprobación */
.row-cobrado {
  background-color: var(--paper-soft) !important;
  opacity: 0.8;
}
.row-cobrado td {
  color: var(--ink-soft) !important;
}
.row-cobrado .strikethrough-text {
  text-decoration: line-through;
}

```

## `frontend/src/styles/tokens.css` {#frontendsrcstylestokenscss}

```css
:root {
  --paper: #ffffff;
  --paper-raised: #f8fafc;
  --ink: #0f172a;
  --ink-soft: #475569;
  --line: #e2e8f0;
  --accent: #BF9903;
  --accent-strong: #997b02;
  --gold: #BF9903;
  --danger: #ef4444;
  --danger-bg: rgba(239, 68, 68, 0.1);
  --mono-bg: #f1f5f9;
  --shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);
  --radius: 10px;
}

* {
  box-sizing: border-box;
}

html,
body,
#root {
  height: 100%;
}

body {
  margin: 0;
  background: var(--paper);
  color: var(--ink);
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  line-height: 1.5;
  -webkit-font-smoothing: antialiased;
}

h1,
h2,
h3,
h4 {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif;
  font-weight: 700;
  letter-spacing: -0.02em;
  margin: 0;
}

.mono {
  font-family: "IBM Plex Mono", monospace;
  font-variant-numeric: tabular-nums;
}

button {
  font-family: inherit;
}

a {
  color: var(--accent-strong);
}
```

## `frontend/src/lib/api.ts` {#frontendsrclibapits}

```ts
import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:4000/api",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("mif_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("mif_token");
      localStorage.removeItem("mif_usuario");
      if (!location.pathname.startsWith("/login")) {
        location.href = "/login";
      }
    }
    return Promise.reject(err);
  },
);

export function mensajeError(err: unknown): string {
  if (axios.isCancel(err) || (err as { code?: string })?.code === "ERR_CANCELED") {
    return "";
  }
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as { error?: string; detalles?: { mensaje: string }[] } | undefined;
    if (data?.detalles?.length) return data.detalles.map((d) => d.mensaje).join(" · ");
    if (data?.error) return data.error;
    if (err.message === "Network Error" || err.code === "ERR_NETWORK") {
      return "No se pudo conectar con el servidor (Error de Red). Verifica que el servicio esté activo.";
    }
    if (err.message && err.message !== "canceled") return err.message;
  }
  return "Ocurrió un error inesperado. Intenta de nuevo.";
}
```

## `frontend/src/pages/Agencias.tsx` {#frontendsrcpagesagenciastsx}

```tsx
import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { api, mensajeError } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import type { Agencia } from "../types";

export default function Agencias() {
  const { usuario } = useAuth();
  const [agencias, setAgencias] = useState<Agencia[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [codigo, setCodigo] = useState("");
  const [nombre, setNombre] = useState("");
  const [direccion, setDireccion] = useState("");
  const [guardando, setGuardando] = useState(false);

  function cargar() {
    api
      .get<Agencia[]>("/agencias")
      .then(({ data }) => setAgencias(data))
      .catch((err) => setError(mensajeError(err)));
  }

  useEffect(cargar, []);

  async function crear(e: FormEvent) {
    e.preventDefault();
    setGuardando(true);
    setError(null);
    try {
      await api.post("/agencias", { codigo, nombre, direccion: direccion || undefined });
      setCodigo("");
      setNombre("");
      setDireccion("");
      setMostrarForm(false);
      cargar();
    } catch (err) {
      setError(mensajeError(err));
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="screen-container">
      <div className="screen-header">
        <div style={{ display: "flex", alignItems: "center", gap: "0.65rem", flexWrap: "wrap" }}>
          <h1 style={{ display: "flex", alignItems: "center", gap: "0.4rem", margin: 0, fontSize: "1.2rem" }}>
            <span>🏢</span> Agencias y Puntos de Atención
          </h1>
          <span
            style={{
              fontSize: "0.72rem",
              fontWeight: 700,
              padding: "0.15rem 0.5rem",
              borderRadius: "4px",
              background: "rgba(2, 132, 199, 0.15)",
              color: "#0284c7",
              border: "1px solid rgba(2, 132, 199, 0.3)",
            }}
          >
            Red Cooperativa
          </span>
        </div>
        {usuario?.rol === "GERENCIA" && (
          <button
            className="btn"
            style={{ padding: "0.3rem 0.75rem", fontSize: "0.8rem" }}
            onClick={() => setMostrarForm((v) => !v)}
          >
            {mostrarForm ? "Cancelar" : "+ Nueva agencia"}
          </button>
        )}
      </div>

      {error && <div className="alert error" style={{ margin: "0.25rem 0", padding: "0.4rem 0.75rem", fontSize: "0.82rem" }}>{error}</div>}

      {/* KPI METRICS STRIP FINTECH */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "0.5rem" }}>
        <div
          style={{
            background: "var(--paper)",
            border: "1px solid var(--line)",
            borderLeft: "4px solid #0284c7",
            borderRadius: "8px",
            padding: "0.45rem 0.65rem",
            display: "flex",
            flexDirection: "column",
            boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "0.65rem", fontWeight: 700, color: "#0284c7", letterSpacing: "0.03em" }}>
              TOTAL AGENCIAS
            </span>
            <span style={{ fontSize: "0.85rem" }}>🏢</span>
          </div>
          <span style={{ fontSize: "1.08rem", fontWeight: 700, color: "#0284c7", fontFamily: "monospace" }}>
            {agencias.length}
          </span>
          <span style={{ fontSize: "0.65rem", color: "var(--ink-soft)" }}>Puntos de atención registrados</span>
        </div>

        <div
          style={{
            background: "var(--paper)",
            border: "1px solid var(--line)",
            borderLeft: "4px solid #059669",
            borderRadius: "8px",
            padding: "0.45rem 0.65rem",
            display: "flex",
            flexDirection: "column",
            boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "0.65rem", fontWeight: 700, color: "#059669", letterSpacing: "0.03em" }}>
              AGENCIAS OPERATIVAS
            </span>
            <span style={{ fontSize: "0.85rem" }}>✅</span>
          </div>
          <span style={{ fontSize: "1.08rem", fontWeight: 700, color: "#059669", fontFamily: "monospace" }}>
            {agencias.filter((a) => a.activa).length}
          </span>
          <span style={{ fontSize: "0.65rem", color: "var(--ink-soft)" }}>Activas para ventanilla y campo</span>
        </div>
      </div>

      {mostrarForm && (
        <form className="card" onSubmit={crear} style={{ width: "100%", maxWidth: "100%", margin: "0.5rem 0" }}>
          <div className="form-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))" }}>
            <div className="field">
              <label>Código</label>
              <input value={codigo} onChange={(e) => setCodigo(e.target.value.toUpperCase())} required maxLength={30} />
              <span className="hint">Corto y sin espacios, p. ej. CHAJUL.</span>
            </div>
            <div className="field">
              <label>Nombre</label>
              <input value={nombre} onChange={(e) => setNombre(e.target.value)} required />
            </div>
            <div className="field">
              <label>Dirección</label>
              <input value={direccion} onChange={(e) => setDireccion(e.target.value)} />
            </div>
          </div>
          <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.5rem" }}>
            <button className="btn" type="submit" disabled={guardando}>
              {guardando ? "Guardando…" : "Guardar agencia"}
            </button>
            <button type="button" className="btn secondary" onClick={() => setMostrarForm(false)}>
              Cancelar
            </button>
          </div>
        </form>
      )}

      <div className="table-scroll-container" style={{ flex: 1, minHeight: 0, marginTop: "0.5rem" }}>
        <table className="table-compact" style={{ width: "100%" }}>
          <thead>
            <tr>
              <th>Código</th>
              <th>Nombre de Agencia</th>
              <th>Dirección</th>
              <th style={{ textAlign: "center" }}>Estado</th>
            </tr>
          </thead>
          <tbody>
            {agencias.map((a) => (
              <tr key={a.id}>
                <td className="mono" style={{ fontWeight: 700, color: "var(--accent)" }}>{a.codigo}</td>
                <td style={{ fontWeight: 600 }}>{a.nombre}</td>
                <td style={{ fontSize: "0.8rem" }}>{a.direccion ?? "—"}</td>
                <td style={{ textAlign: "center" }}>
                  <span className={`badge ${a.activa ? "activo" : "inactivo"}`} style={{ fontSize: "0.7rem", padding: "0.12rem 0.4rem" }}>
                    {a.activa ? "Activa" : "Inactiva"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

## `frontend/src/pages/AhorroCuentaDetail.tsx` {#frontendsrcpagesahorrocuentadetailtsx}

```tsx
import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api, mensajeError } from "../lib/api";
import { formatoQ, TIPOS_AHORRO } from "../types";
import type { CuentaConMovimientos } from "../types";
import { calcularEdad } from "../lib/formatters";

export default function AhorroCuentaDetail() {
  const { slug, id } = useParams<{ slug: string; id: string }>();
  const config = TIPOS_AHORRO.find((t) => t.slug === slug);
  const navigate = useNavigate();

  const [cuenta, setCuenta] = useState<CuentaConMovimientos | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tipoMov, setTipoMov] = useState<"DEPOSITO" | "RETIRO">("DEPOSITO");
  const [monto, setMonto] = useState("");
  const [fecha, setFecha] = useState(() => new Date().toISOString().slice(0, 10));
  const [numeroRecibo, setNumeroRecibo] = useState("");
  const [guardando, setGuardando] = useState(false);

  function cargar() {
    if (!id) return;
    api
      .get<CuentaConMovimientos>(`/cuentas/${id}`)
      .then(({ data }) => setCuenta(data))
      .catch((err) => setError(mensajeError(err)));
  }

  useEffect(cargar, [id]);

  async function registrarMovimiento(e: FormEvent) {
    e.preventDefault();
    if (!id) return;
    setError(null);
    setGuardando(true);
    try {
      await api.post(`/cuentas/${id}/movimientos`, {
        tipo: tipoMov,
        monto: Number(monto),
        fecha,
        numeroRecibo: numeroRecibo || undefined,
      });
      setMonto("");
      setNumeroRecibo("");
      cargar();
    } catch (err) {
      setError(mensajeError(err));
    } finally {
      setGuardando(false);
    }
  }

  if (!config) return <div className="alert error">Tipo de ahorro no reconocido.</div>;
  if (error && !cuenta) return <div className="alert error">{error}</div>;
  if (!cuenta) return <p>Cargando…</p>;

  return (
    <div>
      <div className="page-head">
        <div>
          <button
            className="link-btn"
            onClick={() => navigate(config.tipo === "APORTACION" ? "/aportaciones" : `/ahorros/${config.slug}`)}
            style={{ marginBottom: "0.5rem" }}
          >
            ← Volver a {config.titulo}
          </button>
          <h1>{cuenta.socio_nombres}</h1>
          <p>
            <span className="mono">{cuenta.numero_cuenta}</span> · {config.titulo}
          </p>
        </div>
        <div className="stat-card accent" style={{ minWidth: 180 }}>
          <span className="label">Saldo actual</span>
          <span className="value">{formatoQ(cuenta.saldo_actual)}</span>
        </div>
      </div>

      {(cuenta.tipo === "AHORRO_INFANTO_JUVENIL" || cuenta.tipo === "APORTACION_INFANTIL") && (
        <div
          style={{
            background: "rgba(14, 165, 233, 0.08)",
            border: "1px solid rgba(14, 165, 233, 0.3)",
            borderRadius: "8px",
            padding: "0.85rem 1rem",
            marginBottom: "1.25rem",
            color: "#075985",
          }}
        >
          <div style={{ fontWeight: 700, display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span>🧒</span> Menor titular de la cuenta
          </div>
          {cuenta.titular_menor_nombre ? (
            <p style={{ fontSize: "0.84rem", margin: "0.35rem 0 0", lineHeight: 1.4 }}>
              <strong>{cuenta.titular_menor_nombre}</strong>
              {cuenta.titular_menor_parentesco ? ` · ${cuenta.titular_menor_parentesco} de ${cuenta.socio_nombres}` : ""}
              {cuenta.titular_menor_fecha_nacimiento ? (
                <>
                  {` · Nacimiento: ${new Date(
                    cuenta.titular_menor_fecha_nacimiento + "T00:00:00"
                  ).toLocaleDateString("es-GT")}`}
                  {calcularEdad(cuenta.titular_menor_fecha_nacimiento) !== null && (
                    <span style={{ marginLeft: "4px", color: "#0369a1", fontWeight: 600 }}>
                      ({calcularEdad(cuenta.titular_menor_fecha_nacimiento)} años)
                    </span>
                  )}
                </>
              ) : ""}
              {cuenta.titular_menor_cui ? ` · CUI: ${cuenta.titular_menor_cui}` : ""}
            </p>
          ) : (
            <p style={{ fontSize: "0.84rem", margin: "0.35rem 0 0", lineHeight: 1.4 }}>
              Esta cuenta no tiene registrados los datos del menor. {cuenta.socio_nombres} figura solo como responsable/tutor.
            </p>
          )}
        </div>
      )}

      {cuenta.tipo === "AHORRO_SOBRE_PRESTAMO" && (
        <div
          style={{
            background: cuenta.prestamo_estado === "CANCELADO" ? "#ecfdf5" : "rgba(245, 158, 11, 0.1)",
            border: `1px solid ${cuenta.prestamo_estado === "CANCELADO" ? "#10b981" : "#f59e0b"}`,
            borderRadius: "8px",
            padding: "0.85rem 1rem",
            marginBottom: "1.25rem",
            color: cuenta.prestamo_estado === "CANCELADO" ? "#065f46" : "#92400e",
          }}
        >
          <div style={{ fontWeight: 700, display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span>🛡️</span> Cuenta de Ahorro sobre Préstamo (Fondo en Garantía)
            {cuenta.prestamo_codigo && (
              <span className="mono" style={{ background: "rgba(0,0,0,0.06)", padding: "0.15rem 0.4rem", borderRadius: "4px" }}>
                Crédito: {cuenta.prestamo_codigo} ({cuenta.prestamo_estado})
              </span>
            )}
          </div>
          <p style={{ fontSize: "0.84rem", margin: "0.35rem 0 0", lineHeight: 1.4 }}>
            {cuenta.prestamo_estado === "CANCELADO"
              ? "✓ El crédito vinculado ha sido cancelado en su totalidad. Los retiros y liquidaciones de esta cuenta han sido habilitados."
              : "🔒 Por política estatutaria, los fondos de esta cuenta están en garantía de crédito activo y NO se pueden retirar hasta su liquidación total. Ante mora o atraso, la cooperativa puede aplicar débitos para cubrir cuotas."}
          </p>
        </div>
      )}

      {error && <div className="alert error">{error}</div>}

      {(() => {
        const retiroBloqueado = Boolean(
          cuenta.tipo === "AHORRO_SOBRE_PRESTAMO" &&
          cuenta.prestamo_estado &&
          cuenta.prestamo_estado !== "CANCELADO" &&
          cuenta.prestamo_estado !== "RECHAZADO" &&
          tipoMov === "RETIRO"
        );
        return (
          <form className="movs-form" onSubmit={registrarMovimiento}>
            <div className="tipo-toggle">
              <button
                type="button"
                className={tipoMov === "DEPOSITO" ? "on deposito" : ""}
                onClick={() => setTipoMov("DEPOSITO")}
              >
                Depósito
              </button>
              <button
                type="button"
                className={tipoMov === "RETIRO" ? "on retiro" : ""}
                onClick={() => setTipoMov("RETIRO")}
              >
                Retiro
              </button>
            </div>
            <div className="field">
              <label htmlFor="mov-monto">Monto</label>
              <input
                id="mov-monto"
                type="number"
                min="0.01"
                step="0.01"
                value={monto}
                onChange={(e) => setMonto(e.target.value)}
                required
              />
            </div>
            <div className="field">
              <label htmlFor="mov-fecha">Fecha</label>
              <input id="mov-fecha" type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} required />
            </div>
            <div className="field grow">
              <label htmlFor="mov-recibo">No. de recibo</label>
              <input id="mov-recibo" value={numeroRecibo} onChange={(e) => setNumeroRecibo(e.target.value)} />
            </div>
            <button type="submit" className="btn" disabled={guardando || retiroBloqueado}>
              {guardando ? "Guardando…" : retiroBloqueado ? "Retiro bloqueado (crédito activo)" : "Registrar"}
            </button>
          </form>
        );
      })()}

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Tipo</th>
              <th>Monto</th>
              <th>Recibo</th>
              <th>Registrado por</th>
            </tr>
          </thead>
          <tbody>
            {cuenta.movimientos.map((m) => (
              <tr key={m.id}>
                <td className="mono">{new Date(m.fecha).toLocaleDateString("es-GT")}</td>
                <td>{m.tipo === "DEPOSITO" ? "Depósito" : m.tipo === "RETIRO" ? "Retiro" : "Ajuste"}</td>
                <td className={`mono movimiento-monto ${m.tipo === "RETIRO" ? "retiro" : "deposito"}`}>
                  {m.tipo === "RETIRO" ? "−" : "+"} {formatoQ(m.monto)}
                </td>
                <td className="mono">{m.numero_recibo ?? "—"}</td>
                <td>{m.usuario_nombre}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {cuenta.movimientos.length === 0 && <div className="empty">Todavía no hay movimientos en esta cuenta.</div>}
      </div>

      <p style={{ marginTop: "1.5rem" }}>
        <Link to={`/socios/${cuenta.socio_id}`}>Ver ficha completa del socio →</Link>
      </p>
    </div>
  );
}
```

## `frontend/src/pages/AhorroCuentaForm.tsx` {#frontendsrcpagesahorrocuentaformtsx}

```tsx
import { useEffect, useState, useMemo } from "react";
import type { FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api, mensajeError } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { TIPOS_AHORRO, PARENTESCOS_BENEFICIARIO_MENOR } from "../types";
import type { Agencia, Socio, Prestamo } from "../types";
import { formatearDPI, calcularEdad } from "../lib/formatters";
import BuscadorSocio from "../components/BuscadorSocio";
import InputNombreAutoCompletar from "../components/InputNombreAutoCompletar";

export default function AhorroCuentaForm() {
  const { slug } = useParams<{ slug: string }>();
  const config = TIPOS_AHORRO.find((t) => t.slug === slug);
  const { usuario } = useAuth();
  const navigate = useNavigate();
  const puedeElegirAgencia = usuario?.rol === "GERENCIA";

  const [agencias, setAgencias] = useState<Agencia[]>([]);
  const [agenciaId, setAgenciaId] = useState(usuario?.agenciaId ?? "");
  const [socio, setSocio] = useState<Socio | null>(null);
  const [numeroCuenta, setNumeroCuenta] = useState("");
  const [saldoInicial, setSaldoInicial] = useState("0");
  const [cuotaPactada, setCuotaPactada] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [cuentaExistente, setCuentaExistente] = useState<{ id: string; numero_cuenta: string } | null>(null);
  const [saldoAportacion, setSaldoAportacion] = useState<number | null>(null);
  const [creandoAportacionRapida, setCreandoAportacionRapida] = useState(false);
  const [prestamosSocio, setPrestamosSocio] = useState<Prestamo[]>([]);
  const [prestamoSeleccionadoId, setPrestamoSeleccionadoId] = useState<string>("");

  const [titularMenorNombre, setTitularMenorNombre] = useState("");
  const [titularMenorParentesco, setTitularMenorParentesco] = useState("Hijo(a)");
  const [titularMenorCui, setTitularMenorCui] = useState("");
  const [titularMenorFechaNacimiento, setTitularMenorFechaNacimiento] = useState("");

  const esProgramadoOInfanto =
    config?.tipo === "AHORRO_PROGRAMADO" || config?.tipo === "AHORRO_INFANTO_JUVENIL";
  const esInfanto =
    config?.tipo === "AHORRO_INFANTO_JUVENIL" || config?.tipo === "APORTACION_INFANTIL";

  const edadMenor = useMemo(() => {
    if (!esInfanto || !titularMenorFechaNacimiento) return null;
    return calcularEdad(titularMenorFechaNacimiento);
  }, [esInfanto, titularMenorFechaNacimiento]);

  const esMayorDeEdad = edadMenor !== null && edadMenor >= 18;
  const esFechaFutura = edadMenor !== null && edadMenor < 0;

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sId = params.get("socioId");
    if (sId && !socio) {
      api
        .get<Socio>(`/socios/${sId}`)
        .then(({ data }) => {
          setSocio(data);
          if (data.agencia_id) setAgenciaId(data.agencia_id);
        })
        .catch(() => {});
    }
  }, []);

  useEffect(() => {
    if (puedeElegirAgencia) api.get<Agencia[]>("/agencias").then(({ data }) => setAgencias(data));
  }, [puedeElegirAgencia]);

  useEffect(() => {
    if (!agenciaId || !config) return;
    api
      .get<{ numeroCuenta: string }>("/cuentas/siguiente-numero", { params: { agenciaId, tipo: config.tipo } })
      .then(({ data }) => setNumeroCuenta(data.numeroCuenta));
  }, [agenciaId, config]);

  useEffect(() => {
    if (!socio || !config) {
      setCuentaExistente(null);
      setSaldoAportacion(null);
      setPrestamosSocio([]);
      setPrestamoSeleccionadoId("");
      return;
    }
    api
      .get<{ cuentas: Array<{ id: string; numero_cuenta: string; tipo: string; estado: string; saldo_actual?: string }> }>(`/socios/${socio.id}`)
      .then(({ data }) => {
        const apor = data.cuentas?.find((c) => (c.tipo === "APORTACION" || c.tipo === "APORTACION_INFANTIL") && c.estado === "ACTIVA");
        const saldo = apor ? Number(apor.saldo_actual ?? 0) : 0;
        setSaldoAportacion(saldo);

        const encontrada = data.cuentas?.find((c) => c.tipo === config.tipo && c.estado === "ACTIVA");
        setCuentaExistente(encontrada ? { id: encontrada.id, numero_cuenta: encontrada.numero_cuenta } : null);
      })
      .catch(() => {
        setCuentaExistente(null);
        setSaldoAportacion(null);
      });

    if (config.tipo === "AHORRO_SOBRE_PRESTAMO") {
      api
        .get<Prestamo[]>("/prestamos", { params: { socioId: socio.id } })
        .then(({ data }) => {
          const activos = data.filter((p) => p.estado !== "CANCELADO" && p.estado !== "RECHAZADO");
          setPrestamosSocio(activos);
          if (activos[0]) setPrestamoSeleccionadoId(activos[0].id);
        })
        .catch(() => setPrestamosSocio([]));
    }
  }, [socio, config]);

  async function handleAperturarAportacionRapida() {
    if (!socio) return;
    setCreandoAportacionRapida(true);
    setError(null);
    try {
      await api.post(`/socios/${socio.id}/abrir-aportacion`, { monto: 100 });
      setSaldoAportacion(100);
    } catch (err) {
      setError(mensajeError(err));
    } finally {
      setCreandoAportacionRapida(false);
    }
  }

  if (!config) return <div className="alert error">Tipo de ahorro no reconocido.</div>;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!socio) {
      setError("Selecciona primero el socio dueño de la cuenta.");
      return;
    }
    if (cuentaExistente) {
      setError(`Este socio ya tiene la cuenta ${cuentaExistente.numero_cuenta} de ${config!.titulo}.`);
      return;
    }
    if (
      config?.tipo !== "APORTACION" &&
      config?.tipo !== "APORTACION_INFANTIL" &&
      saldoAportacion !== null &&
      saldoAportacion < 100
    ) {
      setError(
        `Regla de la cooperativa: El socio debe tener un saldo de aportaciones de al menos Q 100.00 para poder abrir cuentas de ahorro infantil, corriente o programado (saldo actual: Q ${saldoAportacion.toFixed(2)}).`
      );
      return;
    }
    if (esInfanto) {
      if (!titularMenorNombre.trim()) {
        setError("Indica el nombre completo del menor titular de la cuenta.");
        return;
      }
      if (!titularMenorParentesco.trim()) {
        setError("Indica el parentesco del menor con el socio responsable.");
        return;
      }
      if (!titularMenorFechaNacimiento) {
        setError("Indica la fecha de nacimiento del menor titular.");
        return;
      }
      if (esFechaFutura) {
        setError("La fecha de nacimiento no puede ser una fecha futura.");
        return;
      }
      if (esMayorDeEdad) {
        setError(
          `Titular mayor de edad (${edadMenor} años): Las cuentas Infanto Juveniles son exclusivas para menores de 18 años.`
        );
        return;
      }
    }
    setError(null);
    setGuardando(true);
    try {
      const { data } = await api.post("/cuentas", {
        tipo: config!.tipo,
        agenciaId,
        socioId: socio.id,
        numeroCuenta,
        saldoInicial: Number(saldoInicial) || 0,
        cuotaPactada: cuotaPactada ? Number(cuotaPactada) : undefined,
        prestamoId: prestamoSeleccionadoId || undefined,
        titularMenorNombre: esInfanto ? titularMenorNombre.trim() : undefined,
        titularMenorParentesco: esInfanto ? titularMenorParentesco.trim() : undefined,
        titularMenorCui: esInfanto ? titularMenorCui.replace(/[^0-9-]/g, "") || undefined : undefined,
        titularMenorFechaNacimiento: esInfanto ? titularMenorFechaNacimiento || undefined : undefined,
      });
      navigate(`/ahorros/${config!.slug}/${data.id}`);
    } catch (err) {
      setError(mensajeError(err));
      setGuardando(false);
    }
  }

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Nueva cuenta — {config.titulo}</h1>
          <p>Abre la cuenta a nombre de un socio ya registrado; los depósitos se agregan después.</p>
        </div>
      </div>

      {error && <div className="alert error">{error}</div>}

      {socio && saldoAportacion !== null && saldoAportacion < 100 && (
        <div
          className="alert warning"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "0.75rem",
            marginBottom: "1rem",
            borderLeft: "4px solid #f59e0b",
          }}
        >
          <div>
            <strong>⚠️ Este asociado no cuenta con Aportación Inicial estatutaria (Q {saldoAportacion.toFixed(2)})</strong>
            <p style={{ margin: "0.2rem 0 0", fontSize: "0.85rem", color: "var(--ink-soft)" }}>
              Para habilitar la apertura de su {config.titulo}, es obligatorio registrar su Aportación Estatutaria mínima de Q 100.00.
            </p>
          </div>
          <button
            type="button"
            className="btn"
            style={{ background: "#059669", borderColor: "#059669", fontWeight: 700, fontSize: "0.85rem" }}
            onClick={handleAperturarAportacionRapida}
            disabled={creandoAportacionRapida}
          >
            {creandoAportacionRapida ? "Aperturando…" : "➕ Aperturar Aportación (Q 100) Ahora"}
          </button>
        </div>
      )}

      <form className="card" onSubmit={onSubmit} style={{ maxWidth: 560 }}>
        {puedeElegirAgencia && (
          <div className="field">
            <label htmlFor="agencia">Agencia</label>
            <select id="agencia" value={agenciaId} onChange={(e) => setAgenciaId(e.target.value)} required>
              <option value="" disabled>
                Selecciona una agencia
              </option>
              {agencias.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.nombre}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="field">
          <label>Socio</label>
          <BuscadorSocio agenciaId={agenciaId || undefined} seleccionado={socio} onSeleccionar={setSocio} />
          {cuentaExistente && (
            <div
              style={{
                marginTop: "0.5rem",
                padding: "0.75rem",
                borderRadius: "8px",
                background: "#fef3c7",
                color: "#92400e",
                border: "1px solid #f59e0b",
                fontSize: "0.88rem",
              }}
            >
              ⚠️ <strong>{socio?.nombres}</strong> ya tiene una cuenta de {config.titulo}:{" "}
              <strong>{cuentaExistente.numero_cuenta}</strong>. Cada socio solo puede tener una cuenta por tipo de ahorro.
              <div style={{ marginTop: "0.5rem" }}>
                <button
                  type="button"
                  className="btn secondary"
                  style={{ fontSize: "0.85rem", padding: "0.35rem 0.75rem" }}
                  onClick={() => navigate(`/ahorros/${config.slug}/${cuentaExistente.id}`)}
                >
                  Ver cuenta y movimientos →
                </button>
              </div>
            </div>
          )}

          {socio && saldoAportacion !== null && (
            saldoAportacion < 100 ? (
              <div
                style={{
                  marginTop: "0.6rem",
                  padding: "0.75rem 0.9rem",
                  borderRadius: "8px",
                  background: "rgba(239, 68, 68, 0.1)",
                  color: "#ef4444",
                  border: "1px solid rgba(239, 68, 68, 0.3)",
                  fontSize: "0.86rem",
                  lineHeight: 1.45,
                }}
              >
                ⚠️ <strong>Aportación estatutaria insuficiente:</strong> El socio tiene un saldo de aportaciones de{" "}
                <strong>Q {saldoAportacion.toFixed(2)}</strong>. La regla de la cooperativa exige contar con al menos{" "}
                <strong>Q 100.00</strong> en aportaciones para habilitar la apertura de cuentas de {config.titulo.toLowerCase()}.
              </div>
            ) : (
              <div
                style={{
                  marginTop: "0.6rem",
                  padding: "0.5rem 0.8rem",
                  borderRadius: "8px",
                  background: "rgba(16, 185, 129, 0.1)",
                  color: "#10b981",
                  border: "1px solid rgba(16, 185, 129, 0.25)",
                  fontSize: "0.82rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.4rem",
                }}
              >
                <span>✓</span> Aportación estatutaria activa: <strong>Q {saldoAportacion.toFixed(2)}</strong> (Cumple con el requisito mínimo de Q 100.00)
              </div>
            )
          )}
        </div>

        {esInfanto && (
          <div
            style={{
              background: "rgba(14, 165, 233, 0.08)",
              border: "1px solid rgba(14, 165, 233, 0.3)",
              borderRadius: "8px",
              padding: "0.85rem 1rem",
              marginBottom: "1rem",
            }}
          >
            <div style={{ fontWeight: 700, color: "#0284c7", marginBottom: "0.6rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <span>🧒</span> Datos del menor titular de la cuenta
            </div>
            <p style={{ fontSize: "0.82rem", color: "var(--ink-soft)", margin: "0 0 0.75rem" }}>
              {socio ? <strong>{socio.nombres}</strong> : "El socio"} figura como responsable/tutor de la cuenta, pero el ahorro pertenece al menor. Indica sus datos.
            </p>

            <div className="field" style={{ marginBottom: "0.6rem" }}>
              <label htmlFor="menor-nombre">
                Nombre completo del menor <span style={{ color: "var(--danger, #dc2626)" }}>*</span>
              </label>
              <InputNombreAutoCompletar
                id="menor-nombre"
                value={titularMenorNombre}
                onChange={setTitularMenorNombre}
                placeholder="Ej. Juanito Tomás Sánchez Pérez"
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
              <div className="field" style={{ marginBottom: "0.6rem" }}>
                <label htmlFor="menor-parentesco">
                  Parentesco con el tutor <span style={{ color: "var(--danger, #dc2626)" }}>*</span>
                </label>
                <select
                  id="menor-parentesco"
                  value={titularMenorParentesco}
                  onChange={(e) => setTitularMenorParentesco(e.target.value)}
                >
                  <option value="">Selecciona el parentesco…</option>
                  {PARENTESCOS_BENEFICIARIO_MENOR.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field" style={{ marginBottom: "0.6rem" }}>
                <label htmlFor="menor-fecha-nac">
                  Fecha de nacimiento <span style={{ color: "var(--danger, #dc2626)" }}>*</span>
                </label>
                <input
                  id="menor-fecha-nac"
                  type="date"
                  value={titularMenorFechaNacimiento}
                  onChange={(e) => setTitularMenorFechaNacimiento(e.target.value)}
                  max={new Date().toISOString().split("T")[0]}
                  required
                />
              </div>
            </div>

            {edadMenor !== null && (
              <div
                style={{
                  marginTop: "0.25rem",
                  marginBottom: "0.75rem",
                  padding: "0.6rem 0.85rem",
                  borderRadius: "6px",
                  fontSize: "0.85rem",
                  fontWeight: 500,
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  backgroundColor:
                    esMayorDeEdad || esFechaFutura
                      ? "rgba(220, 38, 38, 0.1)"
                      : "rgba(16, 185, 129, 0.12)",
                  color: esMayorDeEdad || esFechaFutura ? "#b91c1c" : "#047857",
                  border: `1px solid ${
                    esMayorDeEdad || esFechaFutura ? "#fca5a5" : "#a7f3d0"
                  }`,
                }}
              >
                {esFechaFutura ? (
                  <span>⚠️ <strong>Fecha inválida:</strong> La fecha de nacimiento no puede ser una fecha futura.</span>
                ) : esMayorDeEdad ? (
                  <span>
                    🚫 <strong>Titular mayor de edad ({edadMenor} años):</strong> No es apto para crear esta cuenta. Las cuentas Infanto Juvenil son exclusivas para menores de 18 años.
                  </span>
                ) : (
                  <span>
                    🎂 <strong>Edad calculada:</strong> {edadMenor} {edadMenor === 1 ? "año" : "años"} (Menor de edad apto para Cuenta Juvenil).
                  </span>
                )}
              </div>
            )}

            <div className="field" style={{ marginBottom: 0 }}>
              <label htmlFor="menor-cui">CUI del menor (RENAP) — opcional</label>
              <input
                id="menor-cui"
                inputMode="numeric"
                value={titularMenorCui}
                onChange={(e) => setTitularMenorCui(formatearDPI(e.target.value.replace(/[^0-9-]/g, "")))}
                maxLength={15}
                placeholder="xxxx-xxxxx-xxxx (CUI de partida)"
                style={{ fontFamily: "monospace", letterSpacing: "0.5px" }}
              />
              <span className="hint">Si aún no tiene CUI emitido, puedes dejarlo en blanco.</span>
            </div>
          </div>
        )}

        <div className="field">
          <label htmlFor="numero">Número de cuenta</label>
          <input id="numero" value={numeroCuenta} onChange={(e) => setNumeroCuenta(e.target.value)} required />
          <span className="hint">Sugerido automáticamente; puedes ajustarlo.</span>
        </div>

        {config.tipo === "AHORRO_SOBRE_PRESTAMO" && (
          <div
            className="field"
            style={{
              background: "rgba(59, 130, 246, 0.08)",
              border: "1px solid rgba(59, 130, 246, 0.25)",
              borderRadius: "8px",
              padding: "0.85rem 1rem",
            }}
          >
            <label htmlFor="prestamo-vinculado" style={{ fontWeight: 700, color: "var(--accent)" }}>
              🛡️ Préstamo vinculado en garantía
            </label>
            {prestamosSocio.length > 0 ? (
              <select
                id="prestamo-vinculado"
                value={prestamoSeleccionadoId}
                onChange={(e) => setPrestamoSeleccionadoId(e.target.value)}
                style={{ width: "100%", padding: "0.5rem", marginTop: "0.4rem" }}
              >
                {prestamosSocio.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.codigo} — {p.tipo} ({p.estado}) · Saldo/Monto: Q{Number(p.saldo_capital || p.monto_aprobado || p.monto_solicitado).toFixed(2)}
                  </option>
                ))}
              </select>
            ) : (
              <p style={{ fontSize: "0.85rem", color: "var(--ink-soft)", margin: "0.4rem 0 0" }}>
                El socio no tiene créditos activos registrados. Esta cuenta actuará como fondo de garantía de crédito general.
              </p>
            )}
            <span className="hint" style={{ marginTop: "0.5rem", display: "block" }}>
              🔒 <strong>Regla estatutaria:</strong> Esta cuenta no permite retiros en ventanilla mientras el crédito esté activo.
              Si el asociado cae en mora o deja de pagar su cuota, la cooperativa podrá debitar de este ahorro para cubrir el saldo adeudado.
            </span>
          </div>
        )}

        {esProgramadoOInfanto && (
          <div className="field">
            <label htmlFor="cuota-pactada">Cuota mensual acordada (Q)</label>
            <input
              id="cuota-pactada"
              type="number"
              min="0"
              step="0.01"
              placeholder="Ej. 100.00"
              value={cuotaPactada}
              onChange={(e) => setCuotaPactada(e.target.value)}
            />
            <span className="hint">
              Monto mensual comprometido por el socio (se reflejará en tiempo real en Auxiliar de Caja).
            </span>
          </div>
        )}

        <div className="field">
          <label htmlFor="saldo">Saldo inicial (si viene de otro registro)</label>
          <input
            id="saldo"
            type="number"
            min="0"
            step="0.01"
            value={saldoInicial}
            onChange={(e) => setSaldoInicial(e.target.value)}
          />
        </div>

        <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.5rem" }}>
          <button
            type="submit"
            className="btn"
            disabled={
              guardando ||
              !agenciaId ||
              Boolean(cuentaExistente) ||
              (saldoAportacion !== null && saldoAportacion < 100) ||
              (config.tipo === "AHORRO_SOBRE_PRESTAMO" && !prestamoSeleccionadoId) ||
              (esInfanto && (
                !titularMenorNombre.trim() ||
                !titularMenorParentesco.trim() ||
                !titularMenorFechaNacimiento ||
                esMayorDeEdad ||
                esFechaFutura
              ))
            }
          >
            {guardando ? "Guardando…" : "Abrir cuenta"}
          </button>
          <button type="button" className="btn secondary" onClick={() => navigate(-1)}>
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
```

## `frontend/src/pages/AhorroList.tsx` {#frontendsrcpagesahorrolisttsx}

```tsx
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api, mensajeError } from "../lib/api";
import { formatoQ, TIPOS_AHORRO } from "../types";
import type { Cuenta, ResumenCuentas } from "../types";
import { DualCuentaBadge } from "../components/DualCuentaBadge";

export default function AhorroList() {
  const { slug } = useParams<{ slug: string }>();
  const config = TIPOS_AHORRO.find((t) => t.slug === slug);

  const [q, setQ] = useState("");
  const [cuentas, setCuentas] = useState<Cuenta[] | null>(null);
  const [resumen, setResumen] = useState<ResumenCuentas | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    if (!config) return;
    setCuentas(null);
    setResumen(null);
    setError(null);
    setPage(1);
    const timeout = setTimeout(() => {
      api
        .get<Cuenta[]>("/cuentas", { params: { tipo: config.tipo, q: q || undefined } })
        .then(({ data }) => setCuentas(data))
        .catch((err) => setError(mensajeError(err)));
    }, 250);
    return () => clearTimeout(timeout);
  }, [config, q]);

  useEffect(() => {
    if (!config) return;
    api
      .get<ResumenCuentas>("/cuentas/resumen", { params: { tipo: config.tipo } })
      .then(({ data }) => setResumen(data))
      .catch((err) => setError(mensajeError(err)));
  }, [config]);

  if (!config) return <div className="alert error">Tipo de ahorro no reconocido.</div>;

  const saldoTotal = resumen?.saldoTotal ?? cuentas?.reduce((acc, c) => acc + Number(c.saldo_actual), 0) ?? 0;
  const totalCuentas = cuentas?.length ?? 0;
  const totalPaginas = Math.max(1, Math.ceil(totalCuentas / pageSize));
  const cuentasPaginadas = cuentas?.slice((page - 1) * pageSize, page * pageSize) ?? [];

  return (
    <div className="screen-container">
      {/* CABECERA COMPACTA DE 1 LÍNEA */}
      <div className="screen-header">
        <div style={{ display: "flex", alignItems: "center", gap: "0.65rem", flexWrap: "wrap" }}>
          <h1 style={{ display: "flex", alignItems: "center", gap: "0.4rem", margin: 0, fontSize: "1.2rem" }}>
            <span>🏦</span> {config.titulo}
          </h1>
          <span
            style={{
              fontSize: "0.72rem",
              fontWeight: 700,
              padding: "0.15rem 0.5rem",
              borderRadius: "4px",
              background: "rgba(16, 185, 129, 0.15)",
              color: "#10b981",
              border: "1px solid rgba(16, 185, 129, 0.3)",
            }}
          >
            {config.descripcion}
          </span>
        </div>

        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <button
            type="button"
            className="btn secondary"
            onClick={() => window.print()}
            style={{ padding: "0.3rem 0.65rem", fontSize: "0.8rem", display: "flex", alignItems: "center", gap: "0.3rem" }}
          >
            <span>🖨️</span> Imprimir Padrón
          </button>
          <Link
            to={`/ahorros/${config.slug}/nueva`}
            className="btn"
            style={{ padding: "0.3rem 0.75rem", fontSize: "0.8rem", textDecoration: "none" }}
          >
            + Nueva cuenta
          </Link>
        </div>
      </div>

      {error && (
        <div className="alert error" style={{ margin: "0.25rem 0", padding: "0.4rem 0.75rem", fontSize: "0.82rem" }}>
          {error}
        </div>
      )}

      {/* STRIP DE KPIS HORIZONTALES CON ESTILO FINTECH */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "0.5rem" }}>
        {/* SALDO TOTAL */}
        <div
          style={{
            background: "rgba(2, 132, 199, 0.06)",
            border: "1px solid rgba(2, 132, 199, 0.3)",
            borderLeft: "4px solid #0284c7",
            borderRadius: "8px",
            padding: "0.45rem 0.65rem",
            display: "flex",
            flexDirection: "column",
            boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "0.65rem", fontWeight: 700, color: "#0284c7", letterSpacing: "0.03em" }}>
              SALDO TOTAL CAPTADO
            </span>
            <span style={{ fontSize: "0.85rem" }}>🏦</span>
          </div>
          <span style={{ fontSize: "1.15rem", fontWeight: 800, color: "#0284c7", fontFamily: "monospace" }}>
            {formatoQ(saldoTotal)}
          </span>
          <span style={{ fontSize: "0.65rem", color: "var(--ink-soft)" }}>
            {resumen?.totalCuentas ?? totalCuentas} cuentas activas
          </span>
        </div>

        {/* TOTAL DEPÓSITOS */}
        <div
          style={{
            background: "var(--paper)",
            border: "1px solid var(--line)",
            borderLeft: "4px solid #059669",
            borderRadius: "8px",
            padding: "0.45rem 0.65rem",
            display: "flex",
            flexDirection: "column",
            boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "0.65rem", fontWeight: 700, color: "#059669", letterSpacing: "0.03em" }}>
              TOTAL DEPÓSITOS
            </span>
            <span style={{ fontSize: "0.85rem" }}>📥</span>
          </div>
          <span style={{ fontSize: "1.08rem", fontWeight: 700, color: "#059669", fontFamily: "monospace" }}>
            {formatoQ(resumen?.totalDepositos ?? 0)}
          </span>
          <span style={{ fontSize: "0.65rem", color: "var(--ink-soft)" }}>Ingresos acumulados</span>
        </div>

        {/* TOTAL RETIROS */}
        <div
          style={{
            background: "var(--paper)",
            border: "1px solid var(--line)",
            borderLeft: "4px solid #f59e0b",
            borderRadius: "8px",
            padding: "0.45rem 0.65rem",
            display: "flex",
            flexDirection: "column",
            boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "0.65rem", fontWeight: 700, color: "#d97706", letterSpacing: "0.03em" }}>
              TOTAL RETIROS
            </span>
            <span style={{ fontSize: "0.85rem" }}>📤</span>
          </div>
          <span style={{ fontSize: "1.08rem", fontWeight: 700, color: "#d97706", fontFamily: "monospace" }}>
            {formatoQ(resumen?.totalRetiros ?? 0)}
          </span>
          <span style={{ fontSize: "0.65rem", color: "var(--ink-soft)" }}>Egresos acumulados</span>
        </div>

        {/* PADRÓN DE CUENTAS */}
        <div
          style={{
            background: "var(--paper)",
            border: "1px solid var(--line)",
            borderLeft: "4px solid #6366f1",
            borderRadius: "8px",
            padding: "0.45rem 0.65rem",
            display: "flex",
            flexDirection: "column",
            boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "0.65rem", fontWeight: 700, color: "#6366f1", letterSpacing: "0.03em" }}>
              PADRÓN DE CUENTAS
            </span>
            <span style={{ fontSize: "0.85rem" }}>👥</span>
          </div>
          <span style={{ fontSize: "1.08rem", fontWeight: 700, color: "#6366f1", fontFamily: "monospace" }}>
            {totalCuentas}
          </span>
          <span style={{ fontSize: "0.65rem", color: "var(--ink-soft)" }}>Pág {page} de {totalPaginas}</span>
        </div>
      </div>

      {/* BARRA DE BÚSQUEDA COMPACTA */}
      <div className="screen-toolbar">
        <div style={{ position: "relative", flex: 1, maxWidth: 480 }}>
          <span
            style={{
              position: "absolute",
              left: "0.65rem",
              top: "50%",
              transform: "translateY(-50%)",
              fontSize: "0.85rem",
              color: "var(--ink-soft)",
              pointerEvents: "none",
            }}
          >
            🔍
          </span>
          <input
            type="text"
            placeholder="Buscar por socio o número de cuenta..."
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(1);
            }}
            style={{
              width: "100%",
              padding: "0.38rem 0.65rem 0.38rem 2rem",
              fontSize: "0.82rem",
              borderRadius: "6px",
              border: "1px solid var(--line)",
              background: "var(--paper)",
              color: "var(--ink)",
            }}
          />
        </div>
      </div>

      {/* TABLA CON SCROLL INTERNO Y CABECERA PEGAJOSA (SÓLO PANTALLA) */}
      <div className="table-scroll-container no-print">
        <table className="table-compact">
          <thead>
            <tr>
              <th style={{ minWidth: 140 }}>NO. CUENTA</th>
              <th style={{ minWidth: 260 }}>ASOCIADO / TITULAR</th>
              <th style={{ minWidth: 140, textAlign: "right" }}>SALDO ACTUAL</th>
              <th style={{ minWidth: 90, textAlign: "center" }}>ESTADO</th>
              <th style={{ minWidth: 110, textAlign: "right" }}>ACCIONES</th>
            </tr>
          </thead>
          <tbody>
            {cuentasPaginadas.map((c) => (
              <tr key={c.id}>
                <td style={{ verticalAlign: "middle" }}>
                  <Link to={`/ahorros/${config.slug}/${c.id}`} style={{ color: "inherit", textDecoration: "none" }}>
                    <DualCuentaBadge numeroCuenta={c.numero_cuenta} codigoSistema={c.codigo_sistema} />
                  </Link>
                </td>
                <td>
                  <Link
                    to={`/ahorros/${config.slug}/${c.id}`}
                    style={{ color: "inherit", textDecoration: "none", fontWeight: 600 }}
                  >
                    {c.socio_nombres}
                  </Link>
                </td>
                <td className="mono" style={{ fontWeight: 700, color: "var(--accent)", textAlign: "right" }}>
                  {formatoQ(c.saldo_actual)}
                </td>
                <td style={{ textAlign: "center" }}>
                  <span className={`badge ${c.estado === "ACTIVA" ? "activo" : "inactivo"}`} style={{ fontSize: "0.72rem", padding: "0.15rem 0.45rem" }}>
                    {c.estado === "ACTIVA" ? "Activa" : "Cerrada"}
                  </span>
                </td>
                <td style={{ textAlign: "right" }}>
                  <Link
                    to={`/ahorros/${config.slug}/${c.id}`}
                    className="btn secondary"
                    style={{ padding: "0.18rem 0.5rem", fontSize: "0.74rem", textDecoration: "none" }}
                  >
                    Ver cuenta →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {cuentas && cuentas.length === 0 && (
          <div className="empty" style={{ padding: "2rem", textAlign: "center", color: "var(--ink-soft)" }}>
            {q ? `No hay cuentas que coincidan con "${q}".` : "Todavía no hay cuentas de este tipo."}
          </div>
        )}
      </div>

      {/* FOOTER FIJO CON PAGINACIÓN (SÓLO PANTALLA) */}
      <div className="screen-footer no-print">
        <span style={{ fontSize: "0.8rem", color: "var(--ink-soft)" }}>
          Mostrando {cuentasPaginadas.length} de {totalCuentas} cuentas · Pág. {page} de {totalPaginas}
        </span>
        <div style={{ display: "flex", gap: "0.4rem" }}>
          <button
            type="button"
            className="btn secondary"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            style={{ padding: "0.22rem 0.6rem", fontSize: "0.78rem" }}
          >
            ← Anterior
          </button>
          <button
            type="button"
            className="btn secondary"
            disabled={page >= totalPaginas}
            onClick={() => setPage((p) => p + 1)}
            style={{ padding: "0.22rem 0.6rem", fontSize: "0.78rem" }}
          >
            Siguiente →
          </button>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          REPORTE OFICIAL DE IMPRESIÓN COMPLETO (TODAS LAS CUENTAS SIN CORTES)
          ══════════════════════════════════════════════════════════════════════ */}
      <div className="print-only" style={{ width: "100%", margin: "0", padding: "0" }}>
        {/* MEMBRETE INSTITUCIONAL OFICIAL */}
        <div style={{ borderBottom: "2px solid #0f172a", paddingBottom: "6px", marginBottom: "10px", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ fontSize: "11pt", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.5px", color: "#0f172a" }}>
              COOPERATIVA MAYA INVERSIONES FUTURAS R.L. "COMIF-R.L."
            </div>
            <div style={{ fontSize: "9.5pt", fontWeight: 700, color: "#0284c7", marginTop: "2px" }}>
              PADRÓN GENERAL OFICIAL DE CUENTAS — {config.titulo.toUpperCase()}
            </div>
            <div style={{ fontSize: "7.5pt", color: "#475569", marginTop: "2px" }}>
              San Gaspar Chajul, El Quiché, Guatemala · Sistema Contable y Financiero COMIF-R.L.
            </div>
          </div>
          <div style={{ textAlign: "right", fontSize: "7.5pt", color: "#334155" }}>
            <div><strong>Emisión:</strong> {new Date().toLocaleDateString("es-GT", { day: "2-digit", month: "2-digit", year: "numeric" })} {new Date().toLocaleTimeString("es-GT", { hour: "2-digit", minute: "2-digit" })}</div>
            <div><strong>Total Cuentas:</strong> {totalCuentas} ({cuentas?.filter(c => c.estado === "ACTIVA").length ?? 0} activas)</div>
            {q && <div><strong>Filtro aplicado:</strong> "{q}"</div>}
          </div>
        </div>

        {/* RESUMEN FINANCIERO OFICIAL */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "8px", marginBottom: "10px" }}>
          <div style={{ border: "1px solid #cbd5e1", padding: "4px 8px", background: "#f8fafc", borderRadius: "4px" }}>
            <div style={{ fontSize: "6.5pt", color: "#64748b", fontWeight: 700 }}>SALDO TOTAL CAPTADO</div>
            <div style={{ fontSize: "10pt", fontWeight: 800, color: "#0284c7", fontFamily: "monospace" }}>{formatoQ(saldoTotal)}</div>
          </div>
          <div style={{ border: "1px solid #cbd5e1", padding: "4px 8px", background: "#f8fafc", borderRadius: "4px" }}>
            <div style={{ fontSize: "6.5pt", color: "#64748b", fontWeight: 700 }}>TOTAL CUENTAS</div>
            <div style={{ fontSize: "10pt", fontWeight: 800, color: "#1e293b", fontFamily: "monospace" }}>{totalCuentas}</div>
          </div>
          <div style={{ border: "1px solid #cbd5e1", padding: "4px 8px", background: "#f8fafc", borderRadius: "4px" }}>
            <div style={{ fontSize: "6.5pt", color: "#64748b", fontWeight: 700 }}>INGRESOS / DEPÓSITOS</div>
            <div style={{ fontSize: "10pt", fontWeight: 800, color: "#059669", fontFamily: "monospace" }}>{formatoQ(resumen?.totalDepositos ?? 0)}</div>
          </div>
          <div style={{ border: "1px solid #cbd5e1", padding: "4px 8px", background: "#f8fafc", borderRadius: "4px" }}>
            <div style={{ fontSize: "6.5pt", color: "#64748b", fontWeight: 700 }}>EGRESOS / RETIROS</div>
            <div style={{ fontSize: "10pt", fontWeight: 800, color: "#d97706", fontFamily: "monospace" }}>{formatoQ(resumen?.totalRetiros ?? 0)}</div>
          </div>
        </div>

        {/* TABLA COMPLETA CON TODAS LAS CUENTAS REGISTRADAS */}
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "7.5pt", marginBottom: "15px" }}>
          <thead>
            <tr style={{ background: "#0f172a", color: "#ffffff" }}>
              <th style={{ width: "3%", textAlign: "center", padding: "4px 2px", color: "#ffffff" }}>#</th>
              <th style={{ width: "18%", textAlign: "left", padding: "4px 4px", color: "#ffffff" }}>NO. DE CUENTA</th>
              <th style={{ width: "45%", textAlign: "left", padding: "4px 4px", color: "#ffffff" }}>ASOCIADO / TITULAR</th>
              <th style={{ width: "20%", textAlign: "right", padding: "4px 4px", color: "#ffffff" }}>SALDO ACTUAL (Q)</th>
              <th style={{ width: "14%", textAlign: "center", padding: "4px 4px", color: "#ffffff" }}>ESTADO</th>
            </tr>
          </thead>
          <tbody>
            {(cuentas ?? []).map((c, index) => (
              <tr key={c.id} style={{ background: index % 2 === 0 ? "#ffffff" : "#f8fafc" }}>
                <td style={{ textAlign: "center", border: "1px solid #cbd5e1", padding: "3px 2px" }}>
                  {index + 1}
                </td>
                <td style={{ border: "1px solid #cbd5e1", padding: "3px 4px", fontFamily: "monospace", fontWeight: 700 }}>
                  {c.numero_cuenta}
                </td>
                <td style={{ border: "1px solid #cbd5e1", padding: "3px 4px", fontWeight: 600 }}>
                  {c.socio_nombres}
                </td>
                <td style={{ textAlign: "right", border: "1px solid #cbd5e1", padding: "3px 4px", fontFamily: "monospace", fontWeight: 700, color: "#0284c7" }}>
                  {formatoQ(c.saldo_actual)}
                </td>
                <td style={{ textAlign: "center", border: "1px solid #cbd5e1", padding: "3px 4px", fontWeight: 700, fontSize: "7pt" }}>
                  {c.estado === "ACTIVA" ? "ACTIVA" : "CERRADA"}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr style={{ background: "#e2e8f0", fontWeight: "bold" }}>
              <td colSpan={3} style={{ border: "1px solid #94a3b8", padding: "5px", textAlign: "right", fontWeight: 800 }}>
                TOTAL GENERAL CAPTADO ({totalCuentas} CUENTAS):
              </td>
              <td style={{ border: "1px solid #94a3b8", padding: "5px", textAlign: "right", fontFamily: "monospace", fontWeight: 800, color: "#0284c7", fontSize: "8.5pt" }}>
                {formatoQ(saldoTotal)}
              </td>
              <td style={{ border: "1px solid #94a3b8", padding: "5px", textAlign: "center", color: "#475569", fontSize: "7pt" }}>
                Verificado COMIF-R.L.
              </td>
            </tr>
          </tfoot>
        </table>

        {/* BLOQUE DE FIRMAS OFICIALES DE LEGALIZACIÓN */}
        <div style={{ pageBreakInside: "avoid", breakInside: "avoid", marginTop: "24px", paddingTop: "8px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "25px", textAlign: "center" }}>
            <div>
              <div style={{ borderTop: "1px solid #000", margin: "0 10px", paddingTop: "4px", fontSize: "7.5pt", fontWeight: 700 }}>
                Encargado de Captaciones / Cajero
              </div>
              <div style={{ fontSize: "6.5pt", color: "#475569" }}>Operaciones y Ventanilla</div>
            </div>
            <div>
              <div style={{ borderTop: "1px solid #000", margin: "0 10px", paddingTop: "4px", fontSize: "7.5pt", fontWeight: 700 }}>
                Comisión de Vigilancia
              </div>
              <div style={{ fontSize: "6.5pt", color: "#475569" }}>Fiscalización Interna</div>
            </div>
            <div>
              <div style={{ borderTop: "1px solid #000", margin: "0 10px", paddingTop: "4px", fontSize: "7.5pt", fontWeight: 700 }}>
                Contador General / Gerencia
              </div>
              <div style={{ fontSize: "6.5pt", color: "#475569" }}>Certificación Contable COMIF-R.L.</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
```

## `frontend/src/pages/AuxiliarCaja.tsx` {#frontendsrcpagesauxiliarcajatsx}

```tsx
import { useEffect, useState } from "react";
import { api, mensajeError } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import type {
  Agencia,
  DetalleCajaAuxiliar,
  EstadoCajaAuxiliar,
} from "../types";
import AbrirCajaCard from "../components/cajaauxiliar/AbrirCajaCard";
import CajaAbierta from "../components/cajaauxiliar/CajaAbierta";
import CajaCerradaCard from "../components/cajaauxiliar/CajaCerradaCard";
import HistorialCajasModal from "../components/cajaauxiliar/HistorialCajasModal";
import LibroCajaReporteModal from "../components/cajaauxiliar/LibroCajaReporteModal";

export default function AuxiliarCaja() {
  const { usuario } = useAuth();
  const puedeElegirAgencia = usuario?.rol === "GERENCIA";

  const [agencias, setAgencias] = useState<Agencia[]>([]);
  const [agenciaId, setAgenciaId] = useState(usuario?.agenciaId ?? "");
  const [estadoInfo, setEstadoInfo] = useState<EstadoCajaAuxiliar | null>(null);
  const [detalle, setDetalle] = useState<DetalleCajaAuxiliar | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);
  const [mostrarHistorial, setMostrarHistorial] = useState(false);
  const [mostrarReporteGlobal, setMostrarReporteGlobal] = useState(false);

  useEffect(() => {
    api.get<Agencia[]>("/agencias").then(({ data }) => {
      setAgencias(data);
      // Si el usuario es ADMIN/GERENCIA y no tiene agencia asignada,
      // seleccionar automáticamente la primera agencia disponible
      if (!usuario?.agenciaId && data.length > 0) {
        setAgenciaId(data[0].id);
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function cargarEstado() {
    if (!agenciaId) return;
    api
      .get<EstadoCajaAuxiliar>("/caja-auxiliar/estado", { params: { agenciaId } })
      .then(({ data }) => setEstadoInfo(data))
      .catch((err) => setError(mensajeError(err)));
  }

  useEffect(() => {
    setDetalle(null);
    setEstadoInfo(null);
    cargarEstado();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agenciaId]);

  function cargarDetalle(diaId: string) {
    api
      .get<DetalleCajaAuxiliar>(`/caja-auxiliar/${diaId}`)
      .then(({ data }) => setDetalle(data))
      .catch((err) => setError(mensajeError(err)));
  }

  useEffect(() => {
    if (estadoInfo?.estado === "ABIERTO") cargarDetalle(estadoInfo.dia.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [estadoInfo]);

  async function abrirCaja(saldoInicial?: number) {
    setError(null);
    setCargando(true);
    try {
      await api.post("/caja-auxiliar/abrir", { agenciaId, saldoInicial });
      cargarEstado();
    } catch (err) {
      setError(mensajeError(err));
    } finally {
      setCargando(false);
    }
  }

  if (!agenciaId) {
    return (
      <div className="screen-container">
        <div className="screen-header">
          <h1 style={{ display: "flex", alignItems: "center", gap: "0.4rem", margin: 0, fontSize: "1.2rem" }}>
            <span>💵</span> Auxiliar de Caja
          </h1>
        </div>
        <div className="alert error">Debes tener una agencia asignada o seleccionar una.</div>
      </div>
    );
  }

  const agenciaActualNombre = agencias.find((a) => a.id === agenciaId)?.nombre ?? "Agencia";

  return (
    <div className="screen-container">
      {/* CABECERA COMPACTA DE 1 LÍNEA */}
      <div className="screen-header">
        <div style={{ display: "flex", alignItems: "center", gap: "0.65rem", flexWrap: "wrap" }}>
          <h1 style={{ display: "flex", alignItems: "center", gap: "0.4rem", margin: 0, fontSize: "1.2rem" }}>
            <span>💵</span> Auxiliar de Caja
          </h1>
          <span
            style={{
              fontSize: "0.72rem",
              fontWeight: 700,
              padding: "0.15rem 0.5rem",
              borderRadius: "4px",
              background: "rgba(16, 185, 129, 0.15)",
              color: "#10b981",
              border: "1px solid rgba(16, 185, 129, 0.3)",
            }}
          >
            Libro de Operaciones Diarias
          </span>
        </div>

        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
          <button
            type="button"
            className="btn secondary"
            onClick={() => setMostrarReporteGlobal(true)}
            style={{ padding: "0.3rem 0.65rem", fontSize: "0.8rem", display: "flex", alignItems: "center", gap: "0.3rem" }}
            title="Imprimir Libro de Movimientos y Cuadre de Caja"
          >
            <span>🖨️</span> Imprimir Libro de Caja
          </button>
          {usuario?.rol !== "CAJERO" && (
            <button
              type="button"
              className="btn secondary"
              onClick={() => setMostrarHistorial(true)}
              style={{ padding: "0.3rem 0.65rem", fontSize: "0.8rem", display: "flex", alignItems: "center", gap: "0.3rem" }}
            >
              <span>📅</span> Historial de Cajas
            </button>
          )}
          {puedeElegirAgencia && (
            <select
              value={agenciaId}
              onChange={(e) => setAgenciaId(e.target.value)}
              style={{
                padding: "0.3rem 0.65rem",
                borderRadius: "6px",
                border: "1px solid var(--line)",
                background: "var(--paper)",
                color: "var(--ink)",
                fontSize: "0.8rem",
              }}
            >
              {agencias.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.nombre}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {error && (
        <div className="alert error" style={{ margin: "0.25rem 0", padding: "0.4rem 0.75rem", fontSize: "0.82rem" }}>
          {error}
        </div>
      )}

      {estadoInfo?.estado === "SIN_ABRIR" && (
        <AbrirCajaCard estadoInfo={estadoInfo} cargando={cargando} onAbrir={abrirCaja} />
      )}

      {estadoInfo?.estado === "ABIERTO" && detalle && (
        <CajaAbierta
          agenciaId={agenciaId}
          detalle={detalle}
          onRecargar={() => cargarDetalle(detalle.dia.id)}
          onCerrada={() => {
            setDetalle(null);
            cargarEstado();
          }}
        />
      )}

      {estadoInfo?.estado === "CERRADO" && (
        <CajaCerradaCard
          agenciaNombre={agenciaActualNombre}
          detalle={estadoInfo.detalle}
          usuarioRol={usuario?.rol}
          cargando={cargando}
          onVerHistorial={() => setMostrarHistorial(true)}
          onReabrir={() => reabrirCaja(estadoInfo.dia.id)}
          onAbrirNuevaFecha={(saldo, fecha) => abrirCaja(saldo, fecha)}
        />
      )}

      {mostrarHistorial && (
        <HistorialCajasModal
          agenciaId={agenciaId}
          agenciaNombre={agenciaActualNombre}
          onCerrar={() => setMostrarHistorial(false)}
        />
      )}

      {mostrarReporteGlobal && (
        <LibroCajaReporteModal
          agenciaId={agenciaId}
          agenciaNombre={agenciaActualNombre}
          detalleActual={detalle}
          onClose={() => setMostrarReporteGlobal(false)}
        />
      )}
    </div>
  );
}
```

## `frontend/src/pages/CajaChica.tsx` {#frontendsrcpagescajachicatsx}

```tsx
import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { api, mensajeError } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { CATEGORIA_CAJA_CHICA_LABEL, formatoQ } from "../types";
import type { Agencia, CategoriaCajaChica, ListaCajaChica, CajaChicaComprobante } from "../types";
import { CajaChicaReporteView } from "../components/CajaChicaReporteModal";

const CATEGORIAS = Object.entries(CATEGORIA_CAJA_CHICA_LABEL) as [CategoriaCajaChica, string][];

function renderRolBadge(rol?: string) {
  if (!rol) return null;
  switch (rol) {
    case "CAJA_CHICA":
      return (
        <span style={{ fontSize: "0.68rem", padding: "0.1rem 0.35rem", borderRadius: "4px", background: "rgba(16, 185, 129, 0.15)", color: "#059669", fontWeight: 600 }}>
          📥 Caja Chica
        </span>
      );
    case "CAJERO":
      return (
        <span style={{ fontSize: "0.68rem", padding: "0.1rem 0.35rem", borderRadius: "4px", background: "rgba(37, 99, 235, 0.15)", color: "#2563eb", fontWeight: 600 }}>
          💵 Cajero
        </span>
      );
    case "GERENCIA":
      return (
        <span style={{ fontSize: "0.68rem", padding: "0.1rem 0.35rem", borderRadius: "4px", background: "rgba(147, 51, 234, 0.15)", color: "#9333ea", fontWeight: 600 }}>
          🛡️ Admin
        </span>
      );
    case "SUPERVISOR":
      return (
        <span style={{ fontSize: "0.68rem", padding: "0.1rem 0.35rem", borderRadius: "4px", background: "rgba(217, 119, 6, 0.15)", color: "#d97706", fontWeight: 600 }}>
          👁️ Supervisor
        </span>
      );
    case "PROMOTOR":
      return (
        <span style={{ fontSize: "0.68rem", padding: "0.1rem 0.35rem", borderRadius: "4px", background: "rgba(100, 116, 139, 0.15)", color: "#64748b", fontWeight: 600 }}>
          📂 Promotor
        </span>
      );
    default:
      return (
        <span style={{ fontSize: "0.68rem", padding: "0.1rem 0.35rem", borderRadius: "4px", background: "rgba(100, 116, 139, 0.1)", color: "var(--ink-soft)", fontWeight: 500 }}>
          {rol}
        </span>
      );
  }
}

export default function CajaChica() {
  const { usuario } = useAuth();
  const puedeElegirAgencia = usuario?.rol === "GERENCIA";

  const [q, setQ] = useState("");
  const [resultado, setResultado] = useState<ListaCajaChica | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [mostrarReporte, setMostrarReporte] = useState(false);
  const [editarRegistro, setEditarRegistro] = useState<CajaChicaComprobante | null>(null);
  const [agencias, setAgencias] = useState<Agencia[]>([]);

  const [agenciaId, setAgenciaId] = useState(usuario?.agenciaId ?? "");
  const [tipo, setTipo] = useState<"INGRESO" | "EGRESO">("EGRESO");
  const [categoria, setCategoria] = useState<CategoriaCajaChica | "">("");
  const [fecha, setFecha] = useState(() => new Date().toISOString().slice(0, 10));
  const [beneficiario, setBeneficiario] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [monto, setMonto] = useState("");
  const [numeroDocumento, setNumeroDocumento] = useState("DTE");
  const [guardando, setGuardando] = useState(false);
  const [docDuplicado, setDocDuplicado] = useState(false);
  const [infoDocDuplicado, setInfoDocDuplicado] = useState<{
    existe: boolean;
    modulo?: string;
    fecha?: string;
    beneficiario?: string;
    descripcion?: string;
    usuario?: string;
    usuarioRol?: string;
  } | null>(null);
  const [verificandoDoc, setVerificandoDoc] = useState(false);

  // Estados para Reposición de Fondo Fijo
  const [mostrarReposicion, setMostrarReposicion] = useState(false);
  const [repoCheque, setRepoCheque] = useState("");
  const [repoMonto, setRepoMonto] = useState("2000");
  const [repoFecha, setRepoFecha] = useState(() => new Date().toISOString().slice(0, 10));
  const [repoDesc, setRepoDesc] = useState("Reposición mensual de fondo fijo de caja chica");
  const [repoGuardando, setRepoGuardando] = useState(false);

  // Estados para Corrección de Comprobante en Panel Izquierdo
  const [editFecha, setEditFecha] = useState("");
  const [editBeneficiario, setEditBeneficiario] = useState("");
  const [editDescripcion, setEditDescripcion] = useState("");
  const [editMonto, setEditMonto] = useState("");
  const [editNumeroDocumento, setEditNumeroDocumento] = useState("");
  const [editTipo, setEditTipo] = useState<"INGRESO" | "EGRESO">("EGRESO");
  const [editCategoria, setEditCategoria] = useState<CategoriaCajaChica | "">("");
  const [editMotivo, setEditMotivo] = useState("");
  const [editGuardando, setEditGuardando] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  useEffect(() => {
    if (puedeElegirAgencia) api.get<Agencia[]>("/agencias").then(({ data }) => setAgencias(data));
  }, [puedeElegirAgencia]);

  function cargar() {
    api
      .get<ListaCajaChica>("/caja-chica", { params: { q: q || undefined } })
      .then(({ data }) => setResultado(data))
      .catch((err) => setError(mensajeError(err)));
  }

  useEffect(() => {
    if (!q) {
      cargar();
      return;
    }
    const timeout = setTimeout(cargar, 250);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  useEffect(() => {
    if (!mostrarForm || !agenciaId) return;
    api
      .get<{ ultimoNumeroDocumento: string | null }>("/caja-chica/ultimo-documento", { params: { agenciaId, fecha } })
      .then(({ data }) => {
        if (data.ultimoNumeroDocumento) {
          setNumeroDocumento((prev) => (!prev || prev.toUpperCase() === "DTE" ? data.ultimoNumeroDocumento! : prev));
        }
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mostrarForm, agenciaId]);

  useEffect(() => {
    if (!mostrarForm || !agenciaId) {
      setDocDuplicado(false);
      setInfoDocDuplicado(null);
      return;
    }
    const doc = numeroDocumento.trim();
    if (!doc || doc.toUpperCase() === "DTE") {
      setDocDuplicado(false);
      setInfoDocDuplicado(null);
      return;
    }
    setVerificandoDoc(true);
    const t = setTimeout(() => {
      api
        .get<{
          existe: boolean;
          modulo?: string;
          fecha?: string;
          beneficiario?: string;
          descripcion?: string;
          usuario?: string;
          usuarioRol?: string;
        }>("/caja-chica/verificar-documento", { params: { agenciaId, fecha, numeroDocumento: doc } })
        .then(({ data }) => {
          setDocDuplicado(data.existe);
          setInfoDocDuplicado(data.existe ? data : null);
        })
        .catch(() => {
          setDocDuplicado(false);
          setInfoDocDuplicado(null);
        })
        .finally(() => setVerificandoDoc(false));
    }, 450);
    return () => clearTimeout(t);
  }, [numeroDocumento, agenciaId, fecha, mostrarForm]);

  async function crear(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (docDuplicado) {
      setError("El número de documento ya fue registrado hoy en Caja Chica. Corrígelo antes de continuar.");
      return;
    }
    setGuardando(true);
    try {
      await api.post("/caja-chica", {
        agenciaId,
        fecha,
        beneficiario,
        descripcion,
        tipo,
        categoria: tipo === "EGRESO" && categoria ? categoria : undefined,
        monto: Number(monto),
        numeroDocumento: numeroDocumento || undefined,
      });
      setBeneficiario("");
      setDescripcion("");
      setMonto("");
      setNumeroDocumento("DTE");
      setCategoria("");
      setMostrarForm(false);
      cargar();
    } catch (err) {
      setError(mensajeError(err));
    } finally {
      setGuardando(false);
    }
  }

  async function handleReponerFondo(e: FormEvent) {
    e.preventDefault();
    if (!repoCheque.trim()) {
      setError("El número de cheque o comprobante (No. CH.) es obligatorio.");
      return;
    }
    setError(null);
    setRepoGuardando(true);
    try {
      await api.post("/caja-chica/reponer-fondo", {
        agenciaId,
        monto: Number(repoMonto),
        numeroCheque: repoCheque.trim(),
        descripcion: repoDesc,
        fecha: repoFecha,
      });
      setRepoCheque("");
      setMostrarReposicion(false);
      cargar();
    } catch (err) {
      setError(mensajeError(err));
    } finally {
      setRepoGuardando(false);
    }
  }

  function iniciarEdicion(c: CajaChicaComprobante) {
    setEditarRegistro(c);
    setMostrarForm(false);
    setMostrarReposicion(false);
    setEditFecha(c.fecha.slice(0, 10));
    setEditBeneficiario(c.beneficiario);
    setEditDescripcion(c.descripcion);
    setEditMonto(c.monto.toString());
    setEditNumeroDocumento(c.numero_documento || "");
    setEditTipo(c.tipo as "INGRESO" | "EGRESO");
    setEditCategoria((c.categoria as CategoriaCajaChica) || "");
    setEditMotivo("");
    setEditError(null);
  }

  function cancelarEdicion() {
    setEditarRegistro(null);
    setEditError(null);
  }

  async function handleGuardarEdicion(e: FormEvent) {
    e.preventDefault();
    if (!editarRegistro) return;
    if (editMotivo.trim().length < 10) {
      setEditError("El motivo de la corrección es obligatorio (mínimo 10 caracteres explicativos).");
      return;
    }
    setEditError(null);
    setEditGuardando(true);
    try {
      await api.patch(`/caja-chica/${editarRegistro.id}`, {
        fecha: editFecha,
        beneficiario: editBeneficiario,
        descripcion: editDescripcion,
        tipo: editTipo,
        categoria: editTipo === "EGRESO" && editCategoria ? editCategoria : undefined,
        monto: Number(editMonto),
        numeroDocumento: editNumeroDocumento || undefined,
        motivo: editMotivo,
      });
      setEditarRegistro(null);
      cargar();
    } catch (err) {
      setEditError(mensajeError(err));
    } finally {
      setEditGuardando(false);
    }
  }

  const totalEgresosCategorias = resultado?.totalesPorCategoria.reduce((acc, c) => acc + Number(c.total), 0) ?? 1;

  if (mostrarReporte) {
    return (
      <div className="screen-container" style={{ overflowY: "auto", overflowX: "hidden", height: "auto", maxHeight: "none", width: "100%" }}>
        <CajaChicaReporteView
          agenciaId={agenciaId || agencias[0]?.id || ""}
          agencias={agencias}
          puedeElegirAgencia={puedeElegirAgencia}
          onClose={() => setMostrarReporte(false)}
        />
      </div>
    );
  }

  return (
    <div className="screen-container">
      <div>
        {/* CABECERA COMPACTA DE 1 LÍNEA */}
        <div className="screen-header">
          <div>
            <h1 style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <span>📥</span> Caja Chica
            </h1>
            <p>Comprobantes de ingreso y egreso — libro auxiliar operativo en vivo.</p>
          </div>
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            <button
              type="button"
              className="btn secondary"
              style={{ fontSize: "0.82rem", padding: "0.4rem 0.75rem", fontWeight: 700, borderColor: "var(--accent)" }}
              onClick={() => setMostrarReporte(true)}
            >
              📄 Informe de Gastos
            </button>
            <button
              className="btn"
              style={{ fontSize: "0.82rem", padding: "0.4rem 0.75rem", background: "#059669", borderColor: "#059669" }}
              onClick={() => {
                setMostrarReposicion((v) => !v);
                setMostrarForm(false);
                setEditarRegistro(null);
              }}
            >
              {mostrarReposicion ? "Cancelar reposición" : "📥 Reponer Fondo (Cheque)"}
            </button>
            <button
              className="btn"
              style={{ fontSize: "0.82rem", padding: "0.4rem 0.75rem" }}
              onClick={() => {
                setMostrarForm((v) => !v);
                setMostrarReposicion(false);
                setEditarRegistro(null);
              }}
            >
              {mostrarForm ? "Cancelar" : "+ Nuevo comprobante"}
            </button>
          </div>
        </div>

        {error && <div className="alert error" style={{ margin: "0.4rem 0", padding: "0.5rem 0.8rem", fontSize: "0.85rem" }}>{error}</div>}

        {/* CINTILLO SUPERIOR DE KPIS COMPACTOS FINTECH */}
        {resultado && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "0.5rem", margin: "0.4rem 0" }}>
            {/* SALDO ACTUAL */}
            <div
              style={{
                background: "rgba(5, 150, 105, 0.06)",
                border: "1px solid rgba(5, 150, 105, 0.3)",
                borderLeft: "4px solid #059669",
                borderRadius: "8px",
                padding: "0.45rem 0.65rem",
                display: "flex",
                flexDirection: "column",
                boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "0.65rem", fontWeight: 700, color: "#059669", letterSpacing: "0.03em" }}>
                  SALDO DISPONIBLE
                </span>
                <span style={{ fontSize: "0.85rem" }}>💵</span>
              </div>
              <span style={{ fontSize: "1.15rem", fontWeight: 800, color: "#059669", fontFamily: "monospace" }}>
                {formatoQ(resultado.saldoActual)}
              </span>
              <span style={{ fontSize: "0.65rem", color: "var(--ink-soft)" }}>Fondo disponible en caja</span>
            </div>

            {/* TOTAL INGRESOS */}
            <div
              style={{
                background: "var(--paper)",
                border: "1px solid var(--line)",
                borderLeft: "4px solid #0284c7",
                borderRadius: "8px",
                padding: "0.45rem 0.65rem",
                display: "flex",
                flexDirection: "column",
                boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "0.65rem", fontWeight: 700, color: "#0284c7", letterSpacing: "0.03em" }}>
                  TOTAL INGRESOS
                </span>
                <span style={{ fontSize: "0.85rem" }}>📥</span>
              </div>
              <span style={{ fontSize: "1.08rem", fontWeight: 700, color: "#0284c7", fontFamily: "monospace" }}>
                {formatoQ(resultado.totalIngresos)}
              </span>
              <span style={{ fontSize: "0.65rem", color: "var(--ink-soft)" }}>Reposiciones registradas</span>
            </div>

            {/* TOTAL EGRESOS */}
            <div
              style={{
                background: "var(--paper)",
                border: "1px solid var(--line)",
                borderLeft: "4px solid #f59e0b",
                borderRadius: "8px",
                padding: "0.45rem 0.65rem",
                display: "flex",
                flexDirection: "column",
                boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "0.65rem", fontWeight: 700, color: "#d97706", letterSpacing: "0.03em" }}>
                  TOTAL EGRESOS
                </span>
                <span style={{ fontSize: "0.85rem" }}>📤</span>
              </div>
              <span style={{ fontSize: "1.08rem", fontWeight: 700, color: "#d97706", fontFamily: "monospace" }}>
                {formatoQ(resultado.totalEgresos)}
              </span>
              <span style={{ fontSize: "0.65rem", color: "var(--ink-soft)" }}>Gastos comprobados</span>
            </div>

            {/* COMPROBANTES */}
            <div
              style={{
                background: "var(--paper)",
                border: "1px solid var(--line)",
                borderLeft: "4px solid #6366f1",
                borderRadius: "8px",
                padding: "0.45rem 0.65rem",
                display: "flex",
                flexDirection: "column",
                boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "0.65rem", fontWeight: 700, color: "#6366f1", letterSpacing: "0.03em" }}>
                  COMPROBANTES
                </span>
                <span style={{ fontSize: "0.85rem" }}>📄</span>
              </div>
              <span style={{ fontSize: "1.08rem", fontWeight: 700, color: "#6366f1", fontFamily: "monospace" }}>
                {resultado.data.length}
              </span>
              <span style={{ fontSize: "0.65rem", color: "var(--ink-soft)" }}>Movimientos en libro</span>
            </div>
          </div>
        )}

        {/* DISTRIBUCIÓN DE 2 COLUMNAS BALANCEADAS (PANTALLA COMPLETA 100VH) */}
        <div className="screen-split-layout">
          {/* PANEL IZQUIERDO: EGRESOS POR CATEGORÍA O FORMULARIOS DE ACCIÓN */}
          <div className="screen-panel scrollable">
            {editarRegistro ? (
              <form onSubmit={handleGuardarEdicion} style={{ display: "flex", flexDirection: "column", gap: "0.45rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--line)", paddingBottom: "0.4rem" }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: "0.95rem", color: "var(--accent)" }}>✏️ Corregir Comprobante</h3>
                    <span style={{ fontSize: "0.72rem", color: "var(--ink-soft)" }}>
                      {usuario?.rol === "GERENCIA" ? "Auditoría de Administrador" : "Modificación del día"} · Doc: {editarRegistro.numero_documento || "DTE"}
                    </span>
                  </div>
                  <button type="button" className="link-btn" onClick={cancelarEdicion}>✕ Cancelar</button>
                </div>

                {editError && <div className="alert error" style={{ padding: "0.4rem 0.6rem", fontSize: "0.8rem", margin: "0.2rem 0" }}>{editError}</div>}

                <div className="field" style={{ marginBottom: "0.25rem" }}>
                  <label style={{ fontSize: "0.78rem" }}>Tipo de Comprobante</label>
                  <select value={editTipo} onChange={(e) => setEditTipo(e.target.value as "INGRESO" | "EGRESO")}>
                    <option value="EGRESO">Egreso (Gasto)</option>
                    <option value="INGRESO">Ingreso (Reintegro / Reposición)</option>
                  </select>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.4rem", marginBottom: "0.25rem" }}>
                  <div className="field">
                    <label style={{ fontSize: "0.78rem" }}>Fecha</label>
                    <input type="date" required value={editFecha} onChange={(e) => setEditFecha(e.target.value)} />
                  </div>
                  <div className="field">
                    <label style={{ fontSize: "0.78rem" }}>No. Documento</label>
                    <input type="text" value={editNumeroDocumento} onChange={(e) => setEditNumeroDocumento(e.target.value)} placeholder="Ej. DTE / 1234" />
                  </div>
                </div>

                <div className="field" style={{ marginBottom: "0.25rem" }}>
                  <label style={{ fontSize: "0.78rem" }}>Beneficiario / Proveedor</label>
                  <input type="text" required minLength={2} value={editBeneficiario} onChange={(e) => setEditBeneficiario(e.target.value)} />
                </div>

                <div className="field" style={{ marginBottom: "0.25rem" }}>
                  <label style={{ fontSize: "0.78rem" }}>Concepto / Descripción</label>
                  <input type="text" required minLength={2} value={editDescripcion} onChange={(e) => setEditDescripcion(e.target.value)} />
                </div>

                {editTipo === "EGRESO" && (
                  <div className="field" style={{ marginBottom: "0.25rem" }}>
                    <label style={{ fontSize: "0.78rem" }}>Categoría de Gasto</label>
                    <select required value={editCategoria} onChange={(e) => setEditCategoria(e.target.value as CategoriaCajaChica)}>
                      <option value="" disabled>Seleccione categoría</option>
                      {CATEGORIAS.map(([val, label]) => (
                        <option key={val} value={val}>{label}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="field" style={{ marginBottom: "0.35rem" }}>
                  <label style={{ fontSize: "0.78rem" }}>Monto Exacto (Q)</label>
                  <input type="number" required min="0.01" step="0.01" value={editMonto} onChange={(e) => setEditMonto(e.target.value)} style={{ fontWeight: 700 }} />
                </div>

                <div style={{ padding: "0.5rem 0.65rem", background: "rgba(234, 179, 8, 0.12)", border: "1px solid rgba(234, 179, 8, 0.3)", borderRadius: "6px", marginBottom: "0.4rem" }}>
                  <div className="field" style={{ marginBottom: 0 }}>
                    <label style={{ color: "#a16207", fontWeight: 700, fontSize: "0.76rem" }}>
                      Motivo de la Corrección (Obligatorio, mín. 10 caracteres)
                    </label>
                    <textarea
                      required
                      minLength={10}
                      rows={2}
                      value={editMotivo}
                      onChange={(e) => setEditMotivo(e.target.value)}
                      placeholder="Ej: Se ajustó el monto según factura física autorizada"
                      style={{ fontSize: "0.78rem", marginTop: "0.2rem" }}
                    />
                  </div>
                </div>

                <div style={{ display: "flex", gap: "0.4rem" }}>
                  <button type="submit" className="btn" disabled={editGuardando} style={{ flex: 1, fontSize: "0.82rem", padding: "0.45rem" }}>
                    {editGuardando ? "Guardando..." : "💾 Guardar Corrección"}
                  </button>
                  <button type="button" className="btn secondary" onClick={cancelarEdicion} disabled={editGuardando} style={{ fontSize: "0.82rem", padding: "0.45rem 0.75rem" }}>
                    Cancelar
                  </button>
                </div>
              </form>
            ) : mostrarReposicion ? (
              <form onSubmit={handleReponerFondo} style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <h3 style={{ margin: 0, fontSize: "0.95rem", color: "#10b981" }}>📥 Reposición Fondo Fijo</h3>
                  <button type="button" className="link-btn" onClick={() => setMostrarReposicion(false)}>Cerrar</button>
                </div>
                <div className="field" style={{ marginBottom: "0.4rem" }}>
                  <label htmlFor="repo-fecha">Fecha del cheque</label>
                  <input id="repo-fecha" type="date" value={repoFecha} onChange={(e) => setRepoFecha(e.target.value)} required />
                </div>
                <div className="field" style={{ marginBottom: "0.4rem" }}>
                  <label htmlFor="repo-cheque">No. de Cheque (No. CH.)</label>
                  <input id="repo-cheque" placeholder="Ej. 1290" value={repoCheque} onChange={(e) => setRepoCheque(e.target.value)} required style={{ fontWeight: 700 }} />
                </div>
                <div className="field" style={{ marginBottom: "0.4rem" }}>
                  <label htmlFor="repo-monto">Monto (Q)</label>
                  <input id="repo-monto" type="number" min="1" step="0.01" value={repoMonto} onChange={(e) => setRepoMonto(e.target.value)} required style={{ fontWeight: 700 }} />
                </div>
                <div className="field" style={{ marginBottom: "0.4rem" }}>
                  <label htmlFor="repo-desc">Descripción</label>
                  <input id="repo-desc" value={repoDesc} onChange={(e) => setRepoDesc(e.target.value)} />
                </div>
                <button type="submit" className="btn" style={{ background: "#059669", marginTop: "0.3rem" }} disabled={repoGuardando}>
                  {repoGuardando ? "Ingresando…" : `Confirmar ${formatoQ(Number(repoMonto) || 0)}`}
                </button>
              </form>
            ) : mostrarForm ? (
              <form onSubmit={crear} style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <h3 style={{ margin: 0, fontSize: "0.95rem" }}>+ Nuevo Comprobante</h3>
                  <button type="button" className="link-btn" onClick={() => setMostrarForm(false)}>Cerrar</button>
                </div>
                {puedeElegirAgencia && (
                  <div className="field" style={{ marginBottom: "0.3rem" }}>
                    <label htmlFor="cc-agencia">Agencia</label>
                    <select id="cc-agencia" value={agenciaId} onChange={(e) => setAgenciaId(e.target.value)} required>
                      <option value="" disabled>Selecciona agencia</option>
                      {agencias.map((a) => <option key={a.id} value={a.id}>{a.nombre}</option>)}
                    </select>
                  </div>
                )}
                <div className="field" style={{ marginBottom: "0.3rem" }}>
                  <label>Tipo</label>
                  <div className="tipo-toggle">
                    <button type="button" className={tipo === "INGRESO" ? "on deposito" : ""} onClick={() => setTipo("INGRESO")}>Ingreso</button>
                    <button type="button" className={tipo === "EGRESO" ? "on retiro" : ""} onClick={() => setTipo("EGRESO")}>Egreso</button>
                  </div>
                </div>
                {tipo === "EGRESO" && (
                  <div className="field" style={{ marginBottom: "0.3rem" }}>
                    <label htmlFor="cc-categoria">Categoría</label>
                    <select id="cc-categoria" value={categoria} onChange={(e) => setCategoria(e.target.value as CategoriaCajaChica)} required>
                      <option value="" disabled>Selecciona categoría</option>
                      {CATEGORIAS.map(([valor, etiqueta]) => <option key={valor} value={valor}>{etiqueta}</option>)}
                    </select>
                  </div>
                )}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.4rem" }}>
                  <div className="field" style={{ marginBottom: "0.3rem" }}>
                    <label htmlFor="cc-fecha">Fecha</label>
                    <input id="cc-fecha" type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} required />
                  </div>
                  <div className="field" style={{ marginBottom: "0.3rem" }}>
                    <label htmlFor="cc-monto">Monto (Q)</label>
                    <input id="cc-monto" type="number" min="0.01" step="0.01" value={monto} onChange={(e) => setMonto(e.target.value)} required />
                  </div>
                </div>
                <div className="field" style={{ marginBottom: "0.3rem" }}>
                  <label htmlFor="cc-beneficiario">Beneficiario</label>
                  <input id="cc-beneficiario" value={beneficiario} onChange={(e) => setBeneficiario(e.target.value)} required />
                </div>
                <div className="field" style={{ marginBottom: "0.3rem" }}>
                  <label htmlFor="cc-descripcion">Descripción</label>
                  <input id="cc-descripcion" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} required />
                </div>
                <div className="field" style={{ marginBottom: "0.3rem" }}>
                  <label htmlFor="cc-documento">No. de documento</label>
                  <input id="cc-documento" value={numeroDocumento} onChange={(e) => setNumeroDocumento(e.target.value)} />
                  {verificandoDoc && <span className="sub" style={{ fontSize: "0.72rem" }}>Verificando...</span>}
                  {!verificandoDoc && infoDocDuplicado && (
                    <div style={{ background: "rgba(220, 38, 38, 0.1)", border: "1px solid #ef4444", borderRadius: "6px", padding: "0.4rem 0.6rem", marginTop: "0.3rem", fontSize: "0.76rem", color: "#dc2626" }}>
                      <strong>⚠️ Documento ya registrado:</strong>
                      <div>Registrado en: <strong>{infoDocDuplicado.modulo}</strong> {infoDocDuplicado.fecha ? `el ${new Date(infoDocDuplicado.fecha).toLocaleDateString("es-GT")}` : ""}</div>
                      {infoDocDuplicado.beneficiario && <div>Beneficiario: {infoDocDuplicado.beneficiario}</div>}
                      {infoDocDuplicado.usuario && (
                        <div>Por: <strong>{infoDocDuplicado.usuario}</strong> {infoDocDuplicado.usuarioRol ? `(${infoDocDuplicado.usuarioRol})` : ""}</div>
                      )}
                    </div>
                  )}
                </div>
                <button type="submit" className="btn" disabled={guardando || !agenciaId || docDuplicado} style={{ marginTop: "0.3rem" }}>
                  {guardando ? "Guardando…" : docDuplicado ? "Documento duplicado: corrige el número" : "Guardar Comprobante"}
                </button>
              </form>
            ) : (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.6rem" }}>
                  <h3 style={{ margin: 0, fontSize: "0.92rem", color: "var(--ink)", display: "flex", alignItems: "center", gap: "0.35rem" }}>
                    <span>📊</span> Egresos por Categoría
                  </h3>
                  <span style={{ fontSize: "0.74rem", color: "var(--ink-soft)" }}>
                    {resultado?.totalesPorCategoria.length ?? 0} rubros
                  </span>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "0.45rem" }}>
                  {resultado?.totalesPorCategoria.map((c) => {
                    const pct = Math.min(100, Math.round((Number(c.total) / totalEgresosCategorias) * 100));
                    const label =
                      c.categoria === "SIN_CATEGORIA"
                        ? "Sin categoría"
                        : CATEGORIA_CAJA_CHICA_LABEL[c.categoria as CategoriaCajaChica] ?? c.categoria;

                    return (
                      <div
                        key={c.categoria}
                        style={{
                          background: "var(--paper)",
                          border: "1px solid var(--line)",
                          borderRadius: "6px",
                          padding: "0.45rem 0.6rem",
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.8rem", marginBottom: "0.2rem" }}>
                          <span style={{ fontWeight: 600, color: "var(--ink)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 190 }} title={label}>
                            {label}
                          </span>
                          <span className="mono" style={{ fontWeight: 700, color: "var(--ink)" }}>
                            {formatoQ(c.total)}
                          </span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                          <div style={{ flex: 1, height: "5px", background: "var(--mono-bg)", borderRadius: "3px", overflow: "hidden" }}>
                            <div style={{ width: `${pct}%`, height: "100%", background: "var(--accent)" }} />
                          </div>
                          <span style={{ fontSize: "0.68rem", color: "var(--ink-soft)", minWidth: "30px", textAlign: "right" }}>{pct}%</span>
                        </div>
                      </div>
                    );
                  })}
                  {(!resultado?.totalesPorCategoria || resultado.totalesPorCategoria.length === 0) && (
                    <div style={{ fontSize: "0.8rem", color: "var(--ink-soft)", textAlign: "center", padding: "1rem" }}>
                      Sin egresos categorizados aún.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* PANEL DERECHO: BUSCADOR + TABLA DE COMPROBANTES CON SCROLL INTERNO */}
          <div className="screen-panel" style={{ padding: 0 }}>
            {/* BARRA DE HERRAMIENTAS Y BÚSQUEDA INTEGRADA */}
            <div style={{ padding: "0.6rem 0.85rem", borderBottom: "1px solid var(--line)", display: "flex", gap: "0.6rem", alignItems: "center", flexShrink: 0 }}>
              <div style={{ flex: 1 }}>
                <input
                  placeholder="🔍 Buscar por beneficiario, descripción o documento…"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "0.42rem 0.75rem",
                    fontSize: "0.85rem",
                    borderRadius: "6px",
                    border: "1px solid var(--line)",
                    background: "var(--paper)",
                    color: "var(--ink)",
                  }}
                />
              </div>
              <span style={{ fontSize: "0.78rem", color: "var(--ink-soft)", whiteSpace: "nowrap" }}>
                {resultado?.data.length ?? 0} comprobantes
              </span>
            </div>

            {/* TABLA CON SCROLL INTERNO Y CABECERA PEGAJOSA (STICKY) */}
            <div className="table-scroll-container">
              <table style={{ width: "100%", margin: 0, fontSize: "0.82rem" }}>
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Beneficiario</th>
                    <th>Descripción</th>
                    <th>Tipo</th>
                    <th>Categoría</th>
                    <th style={{ textAlign: "right" }}>Monto</th>
                    <th>Registrado Por</th>
                    <th style={{ textAlign: "center", width: "40px" }}>Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {resultado?.data.map((c) => (
                    <tr key={c.id}>
                      <td className="mono" style={{ whiteSpace: "nowrap" }}>
                        {new Date(c.fecha).toLocaleDateString("es-GT")}
                      </td>
                      <td style={{ fontWeight: 600 }}>{c.beneficiario}</td>
                      <td>
                        <div>{c.descripcion}</div>
                        {c.numero_documento && (
                          <span style={{ fontSize: "0.7rem", color: "var(--ink-soft)" }}>Doc: {c.numero_documento}</span>
                        )}
                      </td>
                      <td>
                        <span
                          className="badge"
                          style={{
                            fontSize: "0.7rem",
                            background: c.tipo === "INGRESO" ? "rgba(16, 185, 129, 0.15)" : "rgba(239, 68, 68, 0.12)",
                            color: c.tipo === "INGRESO" ? "#10b981" : "#ef4444",
                            borderColor: c.tipo === "INGRESO" ? "rgba(16, 185, 129, 0.3)" : "rgba(239, 68, 68, 0.3)",
                          }}
                        >
                          {c.tipo === "INGRESO" ? "Ingreso" : "Egreso"}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontSize: "0.75rem", color: "var(--ink-soft)" }}>
                          {c.categoria ? CATEGORIA_CAJA_CHICA_LABEL[c.categoria] : "—"}
                        </span>
                      </td>
                      <td
                        className="mono"
                        style={{
                          textAlign: "right",
                          fontWeight: 700,
                          color: c.tipo === "EGRESO" ? "#ef4444" : "#10b981",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {c.tipo === "EGRESO" ? "−" : "+"} {formatoQ(c.monto)}
                      </td>
                      <td style={{ fontSize: "0.76rem", color: "var(--ink-soft)" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", flexWrap: "wrap" }}>
                          <span>{c.usuario_nombre}</span>
                          {renderRolBadge(c.usuario_rol)}
                        </div>
                      </td>
                      <td style={{ textAlign: "center" }}>
                        {(usuario?.rol === "GERENCIA" || (c.usuario_id === usuario?.id && c.created_at.startsWith(new Date().toISOString().slice(0, 10)))) && (
                          <button
                            title="Corregir Registro"
                            className="btn btn-icon"
                            style={{ padding: "0.2rem", fontSize: "0.9rem" }}
                            onClick={() => iniciarEdicion(c)}
                          >
                            ✏️
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {resultado?.data.length === 0 && (
                <div className="empty" style={{ padding: "2rem 1rem" }}>
                  Todavía no hay comprobantes registrados.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
```

## `frontend/src/pages/Layout.tsx` {#frontendsrcpageslayouttsx}

```tsx
import { useState, useRef, useCallback } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ROL_LABEL, TIPOS_AHORRO } from "../types";
import { api, mensajeError } from "../lib/api";

// ── TOOLTIP GLOBAL (portal-style via fixed position) ──
interface TooltipState {
  text: string;
  x: number;
  y: number;
}

export default function Layout() {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();
  const [reseteando, setReseteando] = useState(false);
  const [recargando, setRecargando] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const tooltipTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const closeSidebar = () => setSidebarOpen(false);

  // Show tooltip after 300ms delay
  const showTooltip = useCallback((e: React.MouseEvent<HTMLAnchorElement>, label: string) => {
    const rect = e.currentTarget.getBoundingClientRect();
    if (tooltipTimer.current) clearTimeout(tooltipTimer.current);
    tooltipTimer.current = setTimeout(() => {
      setTooltip({
        text: label,
        x: rect.right + 10,
        y: rect.top + rect.height / 2,
      });
    }, 300);
  }, []);

  const hideTooltip = useCallback(() => {
    if (tooltipTimer.current) clearTimeout(tooltipTimer.current);
    setTooltip(null);
  }, []);

  async function handleResetGlobal() {
    const confirmado = window.confirm(
      "⚠️ ¿Estás seguro de que deseas REINICIAR EL SISTEMA DESDE CERO?\n\n" +
      "Esta acción vaciará todas las tablas (socios, créditos, ahorros, movimientos, cajas) para empezar limpio."
    );
    if (!confirmado) return;
    setReseteando(true);
    try {
      const { data } = await api.post<{ ok: boolean; mensaje: string }>("/sistema/reset");
      alert(data.mensaje);
      window.location.reload();
    } catch (err) {
      alert(mensajeError(err));
    } finally {
      setReseteando(false);
    }
  }

  async function handleRecargarGlobal() {
    const confirmado = window.confirm(
      "📥 ¿Deseas RECARGAR TODOS LOS DATOS EXISTENTES de los libros Excel?\n\n" +
      "Esta acción restaurará la base de datos oficial:\n" +
      "• 568 asociados con sus aportaciones\n" +
      "• 65 préstamos de cartera viva\n" +
      "• 692 certificados de plazo fijo"
    );
    if (!confirmado) return;
    setRecargando(true);
    try {
      const { data } = await api.post<{ ok: boolean; mensaje: string }>("/sistema/recargar-datos");
      alert(data.mensaje);
      window.location.reload();
    } catch (err) {
      alert(mensajeError(err));
    } finally {
      setRecargando(false);
    }
  }

  const cls = ({ isActive }: { isActive: boolean }) => (isActive ? "active" : "");

  const iniciales = usuario?.nombre
    ? usuario.nombre.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase()
    : "U";

  // NavItem with universal tooltip
  function NavItem({ to, icon, label, onClick }: { to: string; icon: string; label: string; onClick?: () => void }) {
    return (
      <NavLink
        to={to}
        className={cls}
        onClick={onClick}
        onMouseEnter={(e) => showTooltip(e, label)}
        onMouseLeave={hideTooltip}
      >
        <span className="nav-icon">{icon}</span>
        <span className="nav-label">{label}</span>
      </NavLink>
    );
  }

  function Section({ label }: { label: string }) {
    return <div className="nav-section">{label}</div>;
  }

  return (
    <div className={`shell${collapsed ? " sidebar-collapsed" : ""}`}>

      {/* ── GLOBAL TOOLTIP (floating pill) ── */}
      {tooltip && (
        <div
          style={{
            position: "fixed",
            left: tooltip.x,
            top: tooltip.y,
            transform: "translateY(-50%)",
            zIndex: 9999,
            pointerEvents: "none",
            animation: "tooltip-in 0.12s ease forwards",
          }}
        >
          {/* Arrow */}
          <div style={{
            position: "absolute",
            left: -6,
            top: "50%",
            transform: "translateY(-50%)",
            width: 0, height: 0,
            borderTop: "5px solid transparent",
            borderBottom: "5px solid transparent",
            borderRight: "6px solid #162033",
          }} />
          {/* Pill */}
          <div style={{
            background: "#162033",
            color: "#e2e8f0",
            fontSize: "0.76rem",
            fontWeight: 600,
            padding: "0.3rem 0.75rem",
            borderRadius: "8px",
            whiteSpace: "nowrap",
            border: "1px solid rgba(52,211,153,0.22)",
            boxShadow: "0 6px 20px rgba(0,0,0,0.5), 0 1px 3px rgba(0,0,0,0.3)",
            letterSpacing: "0.01em",
          }}>
            {tooltip.text}
          </div>
        </div>
      )}

      {/* ── MOBILE TOP BAR ── */}
      <div className="mobile-header">
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <div style={{
            width: 28, height: 28,
            background: "linear-gradient(135deg, #047857 0%, #065f46 100%)",
            color: "#fff", borderRadius: "7px",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontWeight: 900, fontSize: "0.9rem",
          }}>M</div>
          <span style={{ fontSize: "0.9rem", fontWeight: 800, color: "#ffffff", letterSpacing: "0.02em" }}>COOP COMIF-R.L.</span>
        </div>
        <button className="hamburger-btn" onClick={() => setSidebarOpen(true)} title="Abrir Menú">☰</button>
      </div>

      <div className={`sidebar-backdrop ${sidebarOpen ? "show" : ""}`} onClick={closeSidebar} />

      {/* ══════════════════════════════════════════════
           SIDEBAR COLLAPSIBLE ICON-RAIL
      ══════════════════════════════════════════════ */}
      <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>

        {/* ── BRAND + TOGGLE ── */}
        <div className="brand">
          <button
            className="sidebar-toggle"
            onClick={() => setCollapsed((c) => !c)}
            title={collapsed ? "Expandir menú" : "Colapsar menú"}
          >
            <div className="sidebar-toggle-logo">M</div>
            <div className="sidebar-toggle-text">
              <span className="name">COOP COMIF-R.L.</span>
              <span className="sub">Maya Inversiones Futuras</span>
            </div>
            <i className="sidebar-chevron">‹</i>
          </button>
          <div className="agency-badge">
            <span className="agency-badge-dot" />
            <span className="agency-badge-text">Agencia Chajul · Activa</span>
          </div>
        </div>

        {/* ── NAV ── */}
        <nav className="nav">

          {/* ── CAJERO (Auxiliar de Caja) ── */}
          {usuario?.rol === "CAJERO" && (<>
            <Section label="Ventanilla y Caja" />
            <NavItem to="/auxiliar-caja" icon="💵" label="Auxiliar de Caja"   onClick={closeSidebar} />
            <Section label="Consultas y Cobros" />
            <NavItem to="/socios"   icon="👥" label="Consultar Socios"  onClick={closeSidebar} />
            <NavItem to="/creditos" icon="📄" label="Cobro de Créditos" onClick={closeSidebar} />
          </>)}

          {/* ── CAJA CHICA ── */}
          {usuario?.rol === "CAJA_CHICA" && (<>
            <Section label="Caja y Ventanilla" />
            <NavItem to="/auxiliar-caja" icon="💵" label="Auxiliar de Caja" onClick={closeSidebar} />
            <NavItem to="/caja-chica"    icon="📥" label="Caja Chica"       onClick={closeSidebar} />
            <Section label="Socios" />
            <NavItem to="/socios"        icon="👥" label="Consultar Socios" onClick={closeSidebar} />
          </>)}

          {/* ── PROMOTOR ── */}
          {usuario?.rol === "PROMOTOR" && (<>
            <Section label="Gestión de Campo" />
            <NavItem to="/promotor/cartera"  icon="📂" label="Kardex Cartera"       onClick={closeSidebar} />
            <NavItem to="/socios"            icon="👥" label="Socios en Campo"      onClick={closeSidebar} />
            <NavItem to="/creditos"          icon="📄" label="Créditos y Simulador" onClick={closeSidebar} />
          </>)}

          {/* ── SUPERVISOR ── */}
          {usuario?.rol === "SUPERVISOR" && (<>
            <Section label="Supervisión y Control" />
            <NavItem to="/tablero"         icon="📊" label="Tablero y Analítica"    onClick={closeSidebar} />
            <NavItem to="/consolidado-financiero" icon="⚖️" label="Estados Financieros" onClick={closeSidebar} />
            <NavItem to="/arqueos/mensual" icon="📑" label="Libro Mensual Arqueos"  onClick={closeSidebar} />
            <Section label="Cartera y Créditos" />
            <NavItem to="/creditos"         icon="📄" label="Bandeja de Créditos"   onClick={closeSidebar} />
            <NavItem to="/promotor/cartera" icon="📂" label="Kardex Cartera"        onClick={closeSidebar} />
            <NavItem to="/auxiliar-caja"    icon="💵" label="Arqueos e Hist. Caja"  onClick={closeSidebar} />
            <Section label="Padrón y Captaciones" />
            <NavItem to="/socios"             icon="👥" label="Padrón de Socios"     onClick={closeSidebar} />
            <NavItem to="/aportaciones"       icon="🏛️" label="Aportaciones Capital" onClick={closeSidebar} />
            <NavItem to="/ahorros/corriente"  icon="💰" label="Cuentas de Ahorro"    onClick={closeSidebar} />
            <NavItem to="/ahorros/plazo-fijo" icon="📈" label="Plazo Fijo"           onClick={closeSidebar} />
          </>)}

          {/* ── GERENCIA (control total) ── */}
          {usuario?.rol === "GERENCIA" && (<>
            <Section label="Control General" />
            <NavItem to="/tablero"         icon="📊" label="Tablero Global"        onClick={closeSidebar} />
            <NavItem to="/consolidado-financiero" icon="⚖️" label="Estados Financieros" onClick={closeSidebar} />
            <NavItem to="/arqueos/mensual" icon="📑" label="Libro Mensual Arqueos" onClick={closeSidebar} />

            <Section label="Operaciones" />
            <NavItem to="/auxiliar-caja"    icon="💵" label="Auxiliar de Caja" onClick={closeSidebar} />
            <NavItem to="/caja-chica"       icon="📥" label="Caja Chica"       onClick={closeSidebar} />
            <NavItem to="/creditos"         icon="📄" label="Créditos"         onClick={closeSidebar} />
            <NavItem to="/promotor/cartera" icon="📂" label="Kardex Cartera"   onClick={closeSidebar} />

            <Section label="Socios y Captaciones" />
            <NavItem to="/socios"       icon="👥" label="Socios"       onClick={closeSidebar} />
            <NavItem to="/aportaciones" icon="🏛️" label="Aportaciones" onClick={closeSidebar} />
            {TIPOS_AHORRO.map((t) => (
              <NavItem key={t.slug} to={`/ahorros/${t.slug}`} icon="🏦" label={t.titulo} onClick={closeSidebar} />
            ))}

            <Section label="Administración" />
            <NavItem to="/alertas"   icon="🔔" label="Panel de Alertas"      onClick={closeSidebar} />
            <NavItem to="/usuarios"  icon="👤" label="Usuarios"              onClick={closeSidebar} />
            <NavItem to="/agencias"  icon="🏢" label="Agencias"              onClick={closeSidebar} />
            <NavItem to="/traslados" icon="🔀" label="Traslados Inter-Agencia" onClick={closeSidebar} />
            <NavItem to="/auditoria" icon="🔍" label="Bitácora de Auditoría" onClick={closeSidebar} />
            <NavItem to="/sesiones"  icon="🛡️" label="Sesiones Activas"      onClick={closeSidebar} />
          </>)}
        </nav>

        {/* ── CONTROL DE DATOS (solo ADMIN) ── */}
        {usuario?.rol === "GERENCIA" && !collapsed && (
          <div style={{
            padding: "0.5rem 0.75rem",
            background: "rgba(2,132,199,0.07)",
            borderTop: "1px solid rgba(255,255,255,0.04)",
            borderBottom: "1px solid rgba(255,255,255,0.04)",
            flexShrink: 0,
          }}>
            <div style={{
              fontSize: "0.56rem", fontWeight: 800, color: "rgba(56,189,248,0.6)",
              textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.35rem",
            }}>
              ⚙️ Control de Datos
            </div>
            <div style={{ display: "flex", gap: "0.3rem" }}>
              <button
                type="button" onClick={handleRecargarGlobal}
                disabled={recargando || reseteando}
                style={{
                  flex: 1, fontSize: "0.66rem", padding: "0.3rem 0.35rem",
                  background: "rgba(2,132,199,0.15)", color: "#38bdf8",
                  border: "1px solid rgba(56,189,248,0.2)", borderRadius: "6px",
                  cursor: "pointer", fontWeight: 600,
                  opacity: recargando || reseteando ? 0.5 : 1,
                }}
                title="Restaurar datos de Excel"
              >{recargando ? "⏳ …" : "📥 Excel"}</button>
              <button
                type="button" onClick={handleResetGlobal}
                disabled={reseteando || recargando}
                style={{
                  flex: 1, fontSize: "0.66rem", padding: "0.3rem 0.35rem",
                  background: "rgba(220,38,38,0.15)", color: "#f87171",
                  border: "1px solid rgba(248,113,113,0.2)", borderRadius: "6px",
                  cursor: "pointer", fontWeight: 600,
                  opacity: reseteando || recargando ? 0.5 : 1,
                }}
                title="Reiniciar sistema a cero"
              >{reseteando ? "⏳ …" : "⚠️ Reset"}</button>
            </div>
          </div>
        )}

        {/* ── FOOTER / USUARIO ── */}
        <div className="sidebar-footer">
          <div className="sidebar-footer-inner">
            <div
              title={usuario?.nombre}
              style={{
                width: 30, height: 30, borderRadius: "50%",
                background: "linear-gradient(135deg, #059669, #047857)",
                color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
                fontWeight: 700, fontSize: "0.75rem", flexShrink: 0,
                boxShadow: "0 2px 8px rgba(5,150,105,0.4)", cursor: "default",
              }}
            >{iniciales}</div>

            <div className="sidebar-footer-text">
              <div className="who">{usuario?.nombre}</div>
              <div className="role">{usuario ? ROL_LABEL[usuario.rol] : ""}</div>
            </div>

            <button
              className="sidebar-footer-logout"
              title="Cerrar sesión"
              onClick={() => { logout(); navigate("/login", { replace: true }); }}
              style={{
                background: "rgba(239,68,68,0.12)",
                border: "1px solid rgba(239,68,68,0.22)",
                borderRadius: "6px", color: "#f87171", cursor: "pointer",
                padding: "0.28rem 0.38rem", fontSize: "0.75rem",
                flexShrink: 0, transition: "background 0.15s",
              }}
              onMouseEnter={(e) => { (e.currentTarget.style.background = "rgba(239,68,68,0.28)"); }}
              onMouseLeave={(e) => { (e.currentTarget.style.background = "rgba(239,68,68,0.12)"); }}
            >⏏️</button>
          </div>
        </div>
      </aside>

      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}
```

## `frontend/src/pages/Login.tsx` {#frontendsrcpageslogintsx}

```tsx
import { useState } from "react";
import type { FormEvent } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { usuario, login, cargando } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  if (usuario) {
    const destino = (location.state as { from?: string })?.from ?? "/tablero";
    return <Navigate to={destino} replace />;
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await login(email, password);
      navigate("/tablero", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo iniciar sesión");
    }
  }

  return (
    <div className="login-wrap">
      <div className="card login-card">
        <h1>Sistema Integral COMIF-R.L.</h1>
        <p className="sub">COOPERATIVA MAYA INVERSIONES FUTURAS R.L. "COMIF-R.L."</p>

        {error && <div className="alert error">{error}</div>}

        <form onSubmit={onSubmit}>
          <div className="field">
            <label htmlFor="email">Correo</label>
            <input
              id="email"
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="field">
            <label htmlFor="password">Contraseña</label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn" disabled={cargando} style={{ width: "100%", justifyContent: "center" }}>
            {cargando ? "Ingresando…" : "Ingresar"}
          </button>
        </form>
      </div>
    </div>
  );
}
```

## `frontend/src/pages/SocioDetail.tsx` {#frontendsrcpagessociodetailtsx}

```tsx
import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api, mensajeError } from "../lib/api";
import type { Socio, EstadoPrestamo, TipoPrestamo } from "../types";
import {
  PARENTESCOS_BENEFICIARIO,
  PARENTESCOS_BENEFICIARIO_MENOR,
  formatoQ,
} from "../types";
import {
  formatearDPI,
  formatearTelefono,
  prepararTelefonoParaGuardar,
  capitalizarDescripcion,
} from "../lib/formatters";
import InputNombreAutoCompletar from "../components/InputNombreAutoCompletar";
import { DualCuentaBadge } from "../components/DualCuentaBadge";

interface Cuenta {
  id: string;
  numero_cuenta: string;
  codigo_sistema?: string | null;
  tipo: string;
  estado: string;
  saldo_actual: string;
}

interface PrestamoBrief {
  id: string;
  codigo: string;
  tipo: TipoPrestamo;
  estado: EstadoPrestamo;
  monto_aprobado: string | number | null;
  monto_solicitado: string | number;
  saldo_capital: string | number | null;
  cuota_mensual: string | number;
  plazo_meses: number;
  tasa_interes_mensual: string | number;
  fecha_solicitud: string;
  fecha_desembolso: string | null;
  promotor_nombre: string | null;
  ultimo_pago_fecha: string | null;
  es_migracion: boolean;
  numero_credito_anterior: string | null;
}

type SocioConCuentas = Socio & { cuentas: Cuenta[]; prestamos: PrestamoBrief[] };

const TIPO_CUENTA_LABEL: Record<string, string> = {
  APORTACION: "Aportación Estatutaria",
  APORTACION_INFANTIL: "Aportación Infanto Juvenil",
  AHORRO_CORRIENTE: "Ahorro Corriente",
  AHORRO_PROGRAMADO: "Ahorro Programado",
  AHORRO_INFANTO_JUVENIL: "Ahorro Infanto Juvenil",
  AHORRO_SOBRE_PRESTAMO: "Ahorro sobre Préstamo",
  AHORRO_PLAZO_FIJO: "Ahorro a Plazo Fijo",
};

const TIPO_SLUG: Record<string, string> = {
  APORTACION: "aportacion",
  APORTACION_INFANTIL: "aportacion-infantil",
  AHORRO_CORRIENTE: "corriente",
  AHORRO_PROGRAMADO: "programado",
  AHORRO_INFANTO_JUVENIL: "infanto-juvenil",
  AHORRO_SOBRE_PRESTAMO: "sobre-prestamo",
  AHORRO_PLAZO_FIJO: "plazo-fijo",
};

export default function SocioDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [socio, setSocio] = useState<SocioConCuentas | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);
  const [editando, setEditando] = useState(false);
  const [guardando, setGuardando] = useState(false);

  // Modal de Apertura de Aportación Inicial
  const [mostrarModalAportacion, setMostrarModalAportacion] = useState(false);
  const [montoApor, setMontoApor] = useState("100");
  const [reciboApor, setReciboApor] = useState("");
  const [cuotaIngresoApor, setCuotaIngresoApor] = useState("");
  const [abriendoApor, setAbriendoApor] = useState(false);

  const [form, setForm] = useState({
    nombres: "",
    genero: "" as "M" | "F" | "",
    dpi: "",
    direccion: "",
    telefono: "",
    nombreBeneficiario: "",
    parentescoBeneficiario: "",
    dpiBeneficiario: "",
    telefonoBeneficiario: "",
  });

  const [dpiDuplicado, setDpiDuplicado] = useState<{ nombres: string; numeroAsociado: string; rol?: string } | null>(null);
  const [verificandoDpi, setVerificandoDpi] = useState(false);

  const [telefonoDuplicado, setTelefonoDuplicado] = useState<{ nombres: string; numeroAsociado: string; rol?: string } | null>(null);
  const [verificandoTelefono, setVerificandoTelefono] = useState(false);

  const [dpiDuplicadoBen, setDpiDuplicadoBen] = useState<{ nombres: string; numeroAsociado: string; rol?: string } | null>(null);
  const [verificandoDpiBen, setVerificandoDpiBen] = useState(false);

  const [telefonoDuplicadoBen, setTelefonoDuplicadoBen] = useState<{ nombres: string; numeroAsociado: string; rol?: string } | null>(null);
  const [verificandoTelefonoBen, setVerificandoTelefonoBen] = useState(false);

  const esMenorBeneficiario = form.parentescoBeneficiario && PARENTESCOS_BENEFICIARIO_MENOR.includes(form.parentescoBeneficiario as any);

  function cargar() {
    if (!id) return;
    api
      .get<SocioConCuentas>(`/socios/${id}`)
      .then(({ data }) => {
        setSocio(data);
        setForm({
          nombres: data.nombres,
          genero: (data.genero as "M" | "F" | "") ?? "",
          dpi: data.dpi ? formatearDPI(data.dpi) : "",
          direccion: data.direccion ?? "",
          telefono: data.telefono ? formatearTelefono(data.telefono) : "",
          nombreBeneficiario: data.nombre_beneficiario ?? "",
          parentescoBeneficiario: data.parentesco_beneficiario ?? "",
          dpiBeneficiario: data.dpi_beneficiario ? formatearDPI(data.dpi_beneficiario) : "",
          telefonoBeneficiario: data.telefono_beneficiario ? formatearTelefono(data.telefono_beneficiario) : "",
        });
      })
      .catch((err) => setError(mensajeError(err)));
  }

  useEffect(cargar, [id]);

  // Verificación en vivo de DPI duplicado en edición (excluyendo este socio)
  useEffect(() => {
    if (!editando) {
      setDpiDuplicado(null);
      setVerificandoDpi(false);
      return;
    }
    const rawDpi = form.dpi.replace(/\D/g, "");
    if (rawDpi.length === 13) {
      setVerificandoDpi(true);
      const timer = setTimeout(() => {
        api
          .get<{
            valido: boolean;
            disponible?: boolean;
            registrado?: { nombres: string; numeroAsociado: string; rol?: string };
            socio?: { nombres: string; numeroAsociado: string };
          }>("/socios/verificar-dpi", { params: { dpi: rawDpi, socioId: id } })
          .then(({ data }) => {
            if (data.disponible === false && data.registrado) {
              setDpiDuplicado(data.registrado);
            } else if (data.disponible === false && data.socio) {
              setDpiDuplicado(data.socio);
            } else {
              setDpiDuplicado(null);
            }
          })
          .catch(() => setDpiDuplicado(null))
          .finally(() => setVerificandoDpi(false));
      }, 250);
      return () => clearTimeout(timer);
    } else {
      setDpiDuplicado(null);
      setVerificandoDpi(false);
    }
  }, [form.dpi, editando, id]);

  // Verificación Teléfono Socio
  useEffect(() => {
    if (!editando) {
      setTelefonoDuplicado(null);
      setVerificandoTelefono(false);
      return;
    }
    const rawTel = form.telefono.replace(/\D/g, "");
    const localTel = rawTel.startsWith("502") && rawTel.length > 8 ? rawTel.slice(3) : rawTel.slice(-8);
    if (localTel.length === 8) {
      setVerificandoTelefono(true);
      const timer = setTimeout(() => {
        api
          .get<{
            valido: boolean;
            disponible?: boolean;
            registrado?: { nombres: string; numeroAsociado: string; rol: string };
          }>("/socios/verificar-telefono", { params: { telefono: localTel, socioId: id, tipo: "SOCIO" } })
          .then(({ data }) => {
            if (data.disponible === false && data.registrado) {
              setTelefonoDuplicado(data.registrado);
            } else {
              setTelefonoDuplicado(null);
            }
          })
          .catch(() => setTelefonoDuplicado(null))
          .finally(() => setVerificandoTelefono(false));
      }, 250);
      return () => clearTimeout(timer);
    } else {
      setTelefonoDuplicado(null);
      setVerificandoTelefono(false);
    }
  }, [form.telefono, editando, id]);

  // Verificación DPI Beneficiario
  useEffect(() => {
    if (!editando || esMenorBeneficiario) {
      setDpiDuplicadoBen(null);
      setVerificandoDpiBen(false);
      return;
    }
    const rawDpi = form.dpiBeneficiario.replace(/\D/g, "");
    if (rawDpi.length === 13) {
      setVerificandoDpiBen(true);
      const timer = setTimeout(() => {
        api
          .get<{
            valido: boolean;
            disponible?: boolean;
            registrado?: { nombres: string; numeroAsociado: string; rol: string };
            socio?: { nombres: string; numeroAsociado: string };
          }>("/socios/verificar-dpi", { params: { dpi: rawDpi, socioId: id, tipo: "BENEFICIARIO" } })
          .then(({ data }) => {
            if (data.disponible === false && data.registrado) {
              setDpiDuplicadoBen(data.registrado);
            } else if (data.disponible === false && data.socio) {
              setDpiDuplicadoBen({ ...data.socio, rol: "Socio registrado" });
            } else {
              setDpiDuplicadoBen(null);
            }
          })
          .catch(() => setDpiDuplicadoBen(null))
          .finally(() => setVerificandoDpiBen(false));
      }, 250);
      return () => clearTimeout(timer);
    } else {
      setDpiDuplicadoBen(null);
      setVerificandoDpiBen(false);
    }
  }, [form.dpiBeneficiario, editando, id, esMenorBeneficiario]);

  // Verificación Teléfono Beneficiario
  useEffect(() => {
    if (!editando || esMenorBeneficiario) {
      setTelefonoDuplicadoBen(null);
      setVerificandoTelefonoBen(false);
      return;
    }
    const rawTel = form.telefonoBeneficiario.replace(/\D/g, "");
    const localTel = rawTel.startsWith("502") && rawTel.length > 8 ? rawTel.slice(3) : rawTel.slice(-8);
    if (localTel.length === 8) {
      setVerificandoTelefonoBen(true);
      const timer = setTimeout(() => {
        api
          .get<{
            valido: boolean;
            disponible?: boolean;
            registrado?: { nombres: string; numeroAsociado: string; rol: string };
          }>("/socios/verificar-telefono", { params: { telefono: localTel, socioId: id, tipo: "BENEFICIARIO" } })
          .then(({ data }) => {
            if (data.disponible === false && data.registrado) {
              setTelefonoDuplicadoBen(data.registrado);
            } else {
              setTelefonoDuplicadoBen(null);
            }
          })
          .catch(() => setTelefonoDuplicadoBen(null))
          .finally(() => setVerificandoTelefonoBen(false));
      }, 250);
      return () => clearTimeout(timer);
    } else {
      setTelefonoDuplicadoBen(null);
      setVerificandoTelefonoBen(false);
    }
  }, [form.telefonoBeneficiario, editando, id, esMenorBeneficiario]);

  async function guardar(e: FormEvent) {
    e.preventDefault();
    if (!id) return;
    if (dpiDuplicado) {
      setError(
        `El DPI ya está registrado (${dpiDuplicado.rol || "Socio"}: ${dpiDuplicado.nombres}, Asociado: ${dpiDuplicado.numeroAsociado}). Modifícalo antes de guardar.`
      );
      return;
    }
    if (telefonoDuplicado) {
      setError(
        `El teléfono ya está registrado (${telefonoDuplicado.rol || "Socio"}: ${telefonoDuplicado.nombres}, Asociado: ${telefonoDuplicado.numeroAsociado}). Modifícalo antes de guardar.`
      );
      return;
    }
    if (!esMenorBeneficiario && dpiDuplicadoBen) {
      setError(
        `El DPI/CUI del beneficiario ya pertenece a un registro (${dpiDuplicadoBen.rol || "Socio"}: ${dpiDuplicadoBen.nombres}, Asociado: ${dpiDuplicadoBen.numeroAsociado}). Modifícalo antes de guardar.`
      );
      return;
    }
    if (!esMenorBeneficiario && telefonoDuplicadoBen) {
      setError(
        `El teléfono del beneficiario ya pertenece a un registro (${telefonoDuplicadoBen.rol || "Socio"}: ${telefonoDuplicadoBen.nombres}, Asociado: ${telefonoDuplicadoBen.numeroAsociado}). Modifícalo antes de guardar.`
      );
      return;
    }

    const cleanDpi = form.dpi ? form.dpi.replace(/\D/g, "") : "";
    const cleanDpiBen = form.dpiBeneficiario ? form.dpiBeneficiario.replace(/\D/g, "") : "";
    if (cleanDpi && cleanDpiBen && cleanDpi === cleanDpiBen) {
      setError("El DPI del socio y el DPI/CUI del beneficiario no pueden ser iguales.");
      return;
    }

    const cleanTel = form.telefono ? form.telefono.replace(/\D/g, "") : "";
    const cleanTelBen = form.telefonoBeneficiario ? form.telefonoBeneficiario.replace(/\D/g, "") : "";
    if (cleanTel && cleanTelBen && cleanTel === cleanTelBen) {
      setError("El teléfono del socio y el teléfono del beneficiario no pueden ser iguales.");
      return;
    }
    setGuardando(true);
    setError(null);
    try {
      await api.patch(`/socios/${id}`, {
        nombres: form.nombres,
        genero: form.genero || undefined,
        dpi: form.dpi ? form.dpi.trim() : undefined,
        direccion: form.direccion || undefined,
        telefono: prepararTelefonoParaGuardar(form.telefono),
        nombreBeneficiario: form.nombreBeneficiario || undefined,
        parentescoBeneficiario: form.parentescoBeneficiario || undefined,
        dpiBeneficiario: form.dpiBeneficiario ? form.dpiBeneficiario.trim() : undefined,
        telefonoBeneficiario: prepararTelefonoParaGuardar(form.telefonoBeneficiario),
      });
      setEditando(false);
      setMensajeExito("Datos del socio actualizados correctamente.");
      setTimeout(() => setMensajeExito(null), 4000);
      cargar();
    } catch (err) {
      setError(mensajeError(err));
    } finally {
      setGuardando(false);
    }
  }

  async function cambiarEstado(nuevoEstado: "ACTIVO" | "INACTIVO") {
    if (!id) return;
    try {
      await api.patch(`/socios/${id}`, { estado: nuevoEstado });
      cargar();
    } catch (err) {
      setError(mensajeError(err));
    }
  }

  async function handleAbrirAportacion(e: FormEvent) {
    e.preventDefault();
    if (!id) return;
    const monto = Number(montoApor);
    if (isNaN(monto) || monto < 100) {
      setError("La aportación estatutaria mínima es de Q 100.00.");
      return;
    }
    const cuotaIngreso = cuotaIngresoApor.trim() ? Number(cuotaIngresoApor) : undefined;
    if (cuotaIngreso !== undefined && (isNaN(cuotaIngreso) || cuotaIngreso < 0)) {
      setError("La cuota de ingreso debe ser mayor a 0.");
      return;
    }
    setAbriendoApor(true);
    setError(null);
    try {
      const { data } = await api.post(`/socios/${id}/abrir-aportacion`, {
        monto,
        recibo: reciboApor.trim() || undefined,
        cuotaIngreso: cuotaIngreso,
      });
      setMostrarModalAportacion(false);
      setCuotaIngresoApor("");
      setReciboApor("");
      const msgCuota = data.cuotaIngresoRegistrada
        ? ` La cuota de ingreso de Q ${cuotaIngreso?.toFixed(2)} fue registrada en la caja del día.`
        : cuotaIngreso && cuotaIngreso > 0 ? " (No hay caja abierta hoy: la cuota de ingreso no pudo registrarse en caja)" : "";
      setMensajeExito(`¡Cuenta de Aportación ${data.numero_cuenta} creada con éxito con saldo de ${formatoQ(monto)}!${msgCuota} El socio ya puede aperturar cuentas de ahorro y créditos.`);
      setTimeout(() => setMensajeExito(null), 6000);
      cargar();
    } catch (err) {
      setError(mensajeError(err));
    } finally {
      setAbriendoApor(false);
    }
  }

  if (error && !socio) return <div className="alert error">{error}</div>;
  if (!socio) return <p>Cargando…</p>;

  const cuentaAportacion = socio.cuentas.find((c) => c.tipo === "APORTACION" || c.tipo === "APORTACION_INFANTIL");
  const tieneAportacion = Boolean(cuentaAportacion);
  const saldoAportacion = cuentaAportacion ? Number(cuentaAportacion.saldo_actual) : 0;
  const tieneAportacionMinima = saldoAportacion >= 100;

  // Cálculos de portafolio financiero del socio
  const totalAhorroLiquido = socio.cuentas
    .filter((c) => ["AHORRO_CORRIENTE", "AHORRO_PROGRAMADO", "AHORRO_INFANTO_JUVENIL", "AHORRO_SOBRE_PRESTAMO"].includes(c.tipo))
    .reduce((acc, c) => acc + Number(c.saldo_actual || 0), 0);

  const totalPlazoFijo = socio.cuentas
    .filter((c) => c.tipo === "AHORRO_PLAZO_FIJO")
    .reduce((acc, c) => acc + Number(c.saldo_actual || 0), 0);

  const totalCreditosActivos = (socio.prestamos || [])
    .filter((p) => ["APROBADO", "DESEMBOLSADO", "MIGRADO_ACTIVO"].includes(p.estado))
    .reduce((acc, p) => acc + Number(p.saldo_capital ?? p.monto_aprobado ?? p.monto_solicitado ?? 0), 0);

  const iniciales = socio.nombres
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", paddingBottom: "2rem" }}>
      {/* NAVEGACIÓN Y ENLACE DE RETORNO */}
      <div style={{ marginBottom: "0.75rem" }}>
        <button
          className="link-btn"
          onClick={() => navigate("/socios")}
          style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem", fontSize: "0.82rem", fontWeight: 700 }}
        >
          ← Volver a listado de asociados
        </button>
      </div>

      {/* TARJETA DE PERFIL HERO / CABECERA EJECUTIVA */}
      <div
        className="card"
        style={{
          background: "linear-gradient(135deg, var(--paper) 0%, var(--paper-raised) 100%)",
          border: "1px solid var(--line)",
          borderRadius: "12px",
          padding: "1.2rem 1.4rem",
          marginBottom: "1rem",
          boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "1rem",
        }}
      >
        {/* Lado Izquierdo: Avatar + Nombres + Badges */}
        <div style={{ display: "flex", alignItems: "center", gap: "1rem", minWidth: 0 }}>
          <div
            style={{
              width: "56px",
              height: "56px",
              borderRadius: "50%",
              background: "linear-gradient(135deg, #059669 0%, #047857 100%)",
              color: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 800,
              fontSize: "1.35rem",
              letterSpacing: "1px",
              boxShadow: "0 4px 12px rgba(5, 150, 105, 0.35)",
              flexShrink: 0,
            }}
          >
            {iniciales || "S"}
          </div>

          <div style={{ minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
              <h1 style={{ margin: 0, fontSize: "1.35rem", fontWeight: 800, letterSpacing: "-0.02em" }}>
                {socio.nombres}
              </h1>
              <span
                className={`badge ${socio.estado === "ACTIVO" ? "activo" : "inactivo"}`}
                style={{ fontSize: "0.75rem", padding: "0.15rem 0.5rem", fontWeight: 700 }}
              >
                {socio.estado === "ACTIVO" ? "● Activo" : "○ Inactivo"}
              </span>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.35rem", flexWrap: "wrap", fontSize: "0.82rem", color: "var(--ink-soft)" }}>
              <span className="mono" style={{ background: "rgba(0,0,0,0.05)", padding: "0.1rem 0.45rem", borderRadius: "4px", fontWeight: 700, color: "var(--ink)" }}>
                💳 No. {socio.numero_asociado}
              </span>
              <span>·</span>
              <span>🏢 {socio.agencia_nombre}</span>
              <span>·</span>
              <span>📁 {socio.cuentas.length} cuenta(s)</span>
              {socio.genero && (
                <>
                  <span>·</span>
                  <span>{socio.genero === "F" ? "👩 Femenino" : "👨 Masculino"}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Lado Derecho: Acciones Principales */}
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
          {!tieneAportacion && (
            <button
              type="button"
              className="btn"
              style={{ background: "#059669", borderColor: "#059669", fontWeight: 700, fontSize: "0.84rem" }}
              onClick={() => setMostrarModalAportacion(true)}
            >
              ➕ Aperturar Aportación (Q 100)
            </button>
          )}

          {!editando && (
            <button
              type="button"
              className="btn secondary"
              style={{ fontSize: "0.84rem", fontWeight: 600, display: "flex", alignItems: "center", gap: "0.3rem" }}
              onClick={() => setEditando(true)}
            >
              ✏️ Editar Expediente
            </button>
          )}

          {socio.estado === "ACTIVO" ? (
            <button className="btn secondary" style={{ fontSize: "0.84rem" }} onClick={() => cambiarEstado("INACTIVO")}>
              Marcar Inactivo
            </button>
          ) : (
            <button className="btn secondary" style={{ fontSize: "0.84rem" }} onClick={() => cambiarEstado("ACTIVO")}>
              Reactivar Socio
            </button>
          )}
        </div>
      </div>

      {mensajeExito && <div className="alert success" style={{ marginBottom: "1rem" }}>{mensajeExito}</div>}
      {error && <div className="alert error" style={{ marginBottom: "1rem" }}>{error}</div>}

      {socio.advertencia_importacion && (
        <div
          style={{
            marginBottom: "1rem",
            padding: "0.75rem 1rem",
            background: "rgba(245, 158, 11, 0.12)",
            border: "1px solid rgba(245, 158, 11, 0.4)",
            borderRadius: "8px",
            color: "var(--ink)",
            display: "flex",
            alignItems: "flex-start",
            gap: "0.6rem",
          }}
        >
          <span style={{ fontSize: "1.1rem" }}>⚠️</span>
          <div>
            <div style={{ fontWeight: 700, fontSize: "0.88rem", color: "#b45309" }}>
              Observación detectada en la importación oficial:
            </div>
            <div style={{ fontSize: "0.82rem", marginTop: "0.2rem" }}>
              {socio.advertencia_importacion}
            </div>
            <div style={{ fontSize: "0.76rem", color: "var(--ink-soft)", marginTop: "0.25rem" }}>
              Puede actualizar o corregir el expediente del asociado haciendo clic en <strong>✏️ Editar Expediente</strong> arriba.
            </div>
          </div>
        </div>
      )}

      {/* CINTILLO EJECUTIVO DE KPIS FINANCIEROS DEL SOCIO */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "0.75rem",
          marginBottom: "1rem",
        }}
      >
        {/* KPI 1: Aportaciones */}
        <div
          className="card"
          style={{
            padding: "0.85rem 1rem",
            background: "var(--paper)",
            border: "1px solid var(--line)",
            borderRadius: "10px",
            borderLeft: "4px solid #059669",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.2rem" }}>
            <span style={{ fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", color: "var(--ink-soft)", letterSpacing: "0.03em" }}>
              Aportación Estatutaria
            </span>
            <span style={{ fontSize: "1rem" }}>🏛️</span>
          </div>
          <strong className="mono" style={{ fontSize: "1.25rem", color: tieneAportacionMinima ? "#059669" : "#d97706", display: "block" }}>
            {formatoQ(saldoAportacion)}
          </strong>
          <span style={{ fontSize: "0.72rem", color: tieneAportacionMinima ? "var(--ink-soft)" : "#d97706", fontWeight: 600 }}>
            {tieneAportacionMinima ? "✓ Al día con estatutos" : "⚠️ Mínimo Q 100.00 requerido"}
          </span>
        </div>

        {/* KPI 2: Ahorros Líquidos */}
        <div
          className="card"
          style={{
            padding: "0.85rem 1rem",
            background: "var(--paper)",
            border: "1px solid var(--line)",
            borderRadius: "10px",
            borderLeft: "4px solid #0284c7",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.2rem" }}>
            <span style={{ fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", color: "var(--ink-soft)", letterSpacing: "0.03em" }}>
              Ahorro Disponible
            </span>
            <span style={{ fontSize: "1rem" }}>💰</span>
          </div>
          <strong className="mono" style={{ fontSize: "1.25rem", color: "var(--ink)", display: "block" }}>
            {formatoQ(totalAhorroLiquido)}
          </strong>
          <span style={{ fontSize: "0.72rem", color: "var(--ink-soft)" }}>
            Corriente · Programado · Infanto
          </span>
        </div>

        {/* KPI 3: Plazo Fijo */}
        <div
          className="card"
          style={{
            padding: "0.85rem 1rem",
            background: "var(--paper)",
            border: "1px solid var(--line)",
            borderRadius: "10px",
            borderLeft: "4px solid #7c3aed",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.2rem" }}>
            <span style={{ fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", color: "var(--ink-soft)", letterSpacing: "0.03em" }}>
              Inversiones a Plazo
            </span>
            <span style={{ fontSize: "1rem" }}>📈</span>
          </div>
          <strong className="mono" style={{ fontSize: "1.25rem", color: "#7c3aed", display: "block" }}>
            {formatoQ(totalPlazoFijo)}
          </strong>
          <span style={{ fontSize: "0.72rem", color: "var(--ink-soft)" }}>
            Certificados a término fijo
          </span>
        </div>

        {/* KPI 4: Créditos / Saldo Deudor */}
        <div
          className="card"
          style={{
            padding: "0.85rem 1rem",
            background: "var(--paper)",
            border: "1px solid var(--line)",
            borderRadius: "10px",
            borderLeft: "4px solid #dc2626",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.2rem" }}>
            <span style={{ fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", color: "var(--ink-soft)", letterSpacing: "0.03em" }}>
              Cartera de Créditos
            </span>
            <span style={{ fontSize: "1rem" }}>📋</span>
          </div>
          <strong className="mono" style={{ fontSize: "1.25rem", color: totalCreditosActivos > 0 ? "#dc2626" : "var(--ink)", display: "block" }}>
            {formatoQ(totalCreditosActivos)}
          </strong>
          <span style={{ fontSize: "0.72rem", color: "var(--ink-soft)" }}>
            {totalCreditosActivos > 0 ? "Saldo deudor vigente" : "Sin créditos pendientes"}
          </span>
        </div>
      </div>

      {/* ALERTA ESTATUTARIA SI NO TIENE APORTACIÓN */}
      {!tieneAportacionMinima && (
        <div
          className="alert warning"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "1rem",
            marginBottom: "1rem",
            borderLeft: "4px solid #f59e0b",
            borderRadius: "8px",
          }}
        >
          <div>
            <strong style={{ fontSize: "0.92rem" }}>
              ⚠️ Asociado sin Cuenta de Aportaciones Estatutaria ({socio.cuentas.length} cuentas registradas)
            </strong>
            <p style={{ margin: "0.25rem 0 0", fontSize: "0.82rem", color: "var(--ink-soft)" }}>
              Por estatuto cooperativo de COMIF-R.L., todo asociado debe contar con su <strong>Cuenta de Aportación Inicial (Mínimo Q 100.00)</strong> para aperturar cuentas de ahorro o solicitar créditos.
            </p>
          </div>
          <button
            type="button"
            className="btn"
            style={{ background: "#059669", borderColor: "#059669", fontWeight: 700, fontSize: "0.84rem" }}
            onClick={() => setMostrarModalAportacion(true)}
          >
            ➕ Aperturar Aportación Inicial (Q 100)
          </button>
        </div>
      )}

      {/* PANEL DE ACCIONES RÁPIDAS MODERNO */}
      <div
        className="card"
        style={{
          marginBottom: "1.25rem",
          background: "var(--paper-raised)",
          border: "1px solid var(--line)",
          borderRadius: "10px",
          padding: "0.75rem 1rem",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.6rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <span style={{ fontSize: "1rem" }}>⚡</span>
            <strong style={{ fontSize: "0.86rem" }}>Operaciones Rápidas:</strong>
            <span style={{ fontSize: "0.78rem", color: "var(--ink-soft)" }}>
              Aperturar productos vinculados automáticamente a este asociado
            </span>
          </div>

          <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
            {!tieneAportacion && (
              <button
                type="button"
                className="btn"
                style={{ background: "#059669", borderColor: "#059669", fontSize: "0.76rem", padding: "0.25rem 0.6rem", fontWeight: 700 }}
                onClick={() => setMostrarModalAportacion(true)}
              >
                + Aportación
              </button>
            )}
            <Link
              to={`/ahorros/corriente/nueva?socioId=${socio.id}`}
              className="btn secondary"
              style={{ fontSize: "0.76rem", padding: "0.25rem 0.6rem", fontWeight: 600 }}
            >
              + Ahorro Corriente
            </Link>
            <Link
              to={`/ahorros/programado/nueva?socioId=${socio.id}`}
              className="btn secondary"
              style={{ fontSize: "0.76rem", padding: "0.25rem 0.6rem", fontWeight: 600 }}
            >
              + Ahorro Programado
            </Link>
            <Link
              to={`/ahorros/infanto-juvenil/nueva?socioId=${socio.id}`}
              className="btn secondary"
              style={{ fontSize: "0.76rem", padding: "0.25rem 0.6rem", fontWeight: 600 }}
            >
              + Infanto Juvenil
            </Link>
            <Link
              to={`/ahorros/plazo-fijo/nuevo?socioId=${socio.id}`}
              className="btn secondary"
              style={{ fontSize: "0.76rem", padding: "0.25rem 0.6rem", fontWeight: 600 }}
            >
              + Plazo Fijo
            </Link>
            <Link
              to={`/creditos/nuevo?socioId=${socio.id}`}
              className="btn"
              style={{ fontSize: "0.76rem", padding: "0.25rem 0.65rem", fontWeight: 700 }}
            >
              + Solicitar Crédito
            </Link>
          </div>
        </div>
      </div>

      {/* CUADRÍCULA PRINCIPAL: EXPEDIENTE (IZQUIERDA) Y PORTAFOLIO DE CUENTAS (DERECHA) */}
      <div style={{ display: "grid", gridTemplateColumns: "1.05fr 1.15fr", gap: "1.25rem", alignItems: "start" }}>
        {/* EXPEDIENTE Y DATOS GENERALES DEL ASOCIADO */}
        <div
          className="card"
          style={{
            background: "var(--paper)",
            border: "1px solid var(--line)",
            borderRadius: "10px",
            padding: "1rem 1.15rem",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.85rem", borderBottom: "1px solid var(--line)", paddingBottom: "0.45rem" }}>
            <h3 style={{ fontFamily: "inherit", fontSize: "0.95rem", fontWeight: 800, margin: 0, display: "flex", alignItems: "center", gap: "0.35rem" }}>
              <span>📋</span> Expediente del Asociado
            </h3>
            {!editando && (
              <button
                type="button"
                className="btn secondary"
                style={{ padding: "0.2rem 0.5rem", fontSize: "0.76rem", fontWeight: 600 }}
                onClick={() => setEditando(true)}
              >
                ✏️ Modificar
              </button>
            )}
          </div>

          {editando ? (
            <form onSubmit={guardar}>
              <div className="field">
                <label htmlFor="edit-nombres">Nombres completos</label>
                <InputNombreAutoCompletar
                  id="edit-nombres"
                  value={form.nombres}
                  onChange={(val) => setForm({ ...form, nombres: val })}
                  required
                />
              </div>
              <div className="field">
                <label htmlFor="edit-genero">Género</label>
                <select
                  id="edit-genero"
                  value={form.genero}
                  onChange={(e) => setForm({ ...form, genero: e.target.value as "M" | "F" | "" })}
                >
                  <option value="">Sin especificar</option>
                  <option value="F">Femenino</option>
                  <option value="M">Masculino</option>
                </select>
              </div>
              <div className="field">
                <label htmlFor="edit-dpi">DPI (13 dígitos)</label>
                <input
                  id="edit-dpi"
                  value={form.dpi}
                  onChange={(e) => setForm({ ...form, dpi: formatearDPI(e.target.value) })}
                  maxLength={15}
                  placeholder="xxxx-xxxxx-xxxx"
                  style={{
                    fontFamily: "monospace",
                    letterSpacing: "0.5px",
                    borderColor: dpiDuplicado ? "var(--danger)" : undefined,
                  }}
                />
                <div style={{ minHeight: "1.1rem", marginTop: "0.15rem" }}>
                  {verificandoDpi && <span className="hint">🔍 Verificando disponibilidad...</span>}
                  {dpiDuplicado && (
                    <span style={{ color: "#ef4444", fontSize: "0.78rem", fontWeight: 600, display: "block" }}>
                      🔴 Registrado ({dpiDuplicado.rol || "Socio"}: {dpiDuplicado.nombres})
                    </span>
                  )}
                  {!verificandoDpi && !dpiDuplicado && form.dpi.replace(/\D/g, "").length === 13 && (
                    <span style={{ color: "#10b981", fontSize: "0.78rem", fontWeight: 600, display: "block" }}>
                      ✓ DPI válido y disponible (13 dígitos)
                    </span>
                  )}
                </div>
              </div>
              <div className="field">
                <label htmlFor="edit-telefono">Teléfono (WhatsApp)</label>
                <div style={{ display: "flex", alignItems: "stretch" }}>
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.25rem",
                      padding: "0 0.65rem",
                      background: "var(--mono-bg, #1e293b)",
                      border: "1px solid var(--line)",
                      borderRight: "none",
                      borderTopLeftRadius: "8px",
                      borderBottomLeftRadius: "8px",
                      fontSize: "0.85rem",
                      fontWeight: 600,
                      color: "var(--ink)",
                      userSelect: "none",
                    }}
                  >
                    🇬🇹 +502
                  </span>
                  <input
                    id="edit-telefono"
                    value={form.telefono}
                    onChange={(e) => setForm({ ...form, telefono: formatearTelefono(e.target.value) })}
                    placeholder="xxxx-xxxx"
                    maxLength={9}
                    style={{
                      borderTopLeftRadius: 0,
                      borderBottomLeftRadius: 0,
                      fontFamily: "monospace",
                      letterSpacing: "0.5px",
                    }}
                  />
                </div>
                <div style={{ minHeight: "1.1rem", marginTop: "0.15rem" }}>
                  {verificandoTelefono && <span className="hint">🔍 Verificando teléfono...</span>}
                  {telefonoDuplicado && (
                    <span style={{ color: "#ef4444", fontSize: "0.78rem", fontWeight: 600, display: "block" }}>
                      🔴 Registrado ({telefonoDuplicado.rol || "Socio"}: {telefonoDuplicado.nombres})
                    </span>
                  )}
                  {!verificandoTelefono && !telefonoDuplicado && form.telefono.replace(/\D/g, "").length === 8 && (
                    <span style={{ color: "#10b981", fontSize: "0.78rem", fontWeight: 600, display: "block" }}>
                      ✓ Teléfono válido
                    </span>
                  )}
                </div>
              </div>
              <div className="field">
                <label htmlFor="edit-direccion">Dirección / Comunidad</label>
                <input
                  id="edit-direccion"
                  value={form.direccion}
                  onChange={(e) => setForm({ ...form, direccion: capitalizarDescripcion(e.target.value) })}
                />
              </div>
              <div className="field">
                <label htmlFor="edit-beneficiario">Persona beneficiaria</label>
                <InputNombreAutoCompletar
                  id="edit-beneficiario"
                  value={form.nombreBeneficiario}
                  onChange={(val) => setForm({ ...form, nombreBeneficiario: val })}
                />
              </div>
              <div className="field">
                <label htmlFor="edit-parentesco-ben">Parentesco con el asociado</label>
                <select
                  id="edit-parentesco-ben"
                  value={form.parentescoBeneficiario}
                  onChange={(e) => setForm({ ...form, parentescoBeneficiario: e.target.value })}
                >
                  <option value="">Selecciona el parentesco…</option>
                  {PARENTESCOS_BENEFICIARIO.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
                <span className="hint">Vínculo familiar del beneficiario</span>
              </div>
              <div className="field">
                <label htmlFor="edit-dpi-ben">DPI Beneficiario</label>
                <input
                  id="edit-dpi-ben"
                  value={form.dpiBeneficiario}
                  onChange={(e) => setForm({ ...form, dpiBeneficiario: formatearDPI(e.target.value) })}
                  maxLength={15}
                  placeholder="xxxx-xxxxx-xxxx"
                  style={{ borderColor: dpiDuplicadoBen && !esMenorBeneficiario ? "var(--danger)" : undefined }}
                />
                <div style={{ minHeight: "1.1rem", marginTop: "0.15rem" }}>
                  {verificandoDpiBen && !esMenorBeneficiario && <span className="hint">🔍 Verificando...</span>}
                  {dpiDuplicadoBen && !esMenorBeneficiario && (
                    <span style={{ color: "#ef4444", fontSize: "0.78rem", fontWeight: 600, display: "block" }}>
                      🔴 Registrado ({dpiDuplicadoBen.rol || "Socio"}: {dpiDuplicadoBen.nombres})
                    </span>
                  )}
                  {!verificandoDpiBen && !dpiDuplicadoBen && !esMenorBeneficiario && form.dpiBeneficiario.replace(/\D/g, "").length === 13 && (
                    <span style={{ color: "#10b981", fontSize: "0.78rem", fontWeight: 600, display: "block" }}>
                      ✓ DPI válido
                    </span>
                  )}
                </div>
              </div>
              <div className="field">
                <label htmlFor="edit-tel-ben">Teléfono Beneficiario</label>
                <div style={{ display: "flex", alignItems: "stretch" }}>
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.25rem",
                      padding: "0 0.65rem",
                      background: "var(--mono-bg, #1e293b)",
                      border: "1px solid var(--line)",
                      borderRight: "none",
                      borderTopLeftRadius: "8px",
                      borderBottomLeftRadius: "8px",
                      fontSize: "0.85rem",
                      fontWeight: 600,
                      color: "var(--ink)",
                      userSelect: "none",
                    }}
                  >
                    🇬🇹 +502
                  </span>
                  <input
                    id="edit-tel-ben"
                    value={form.telefonoBeneficiario}
                    onChange={(e) => setForm({ ...form, telefonoBeneficiario: formatearTelefono(e.target.value) })}
                    placeholder="xxxx-xxxx"
                    maxLength={9}
                    style={{
                      borderTopLeftRadius: 0,
                      borderBottomLeftRadius: 0,
                      fontFamily: "monospace",
                      letterSpacing: "0.5px",
                    }}
                  />
                </div>
                <div style={{ minHeight: "1.1rem", marginTop: "0.15rem" }}>
                  {verificandoTelefonoBen && !esMenorBeneficiario && <span className="hint">🔍 Verificando...</span>}
                  {telefonoDuplicadoBen && !esMenorBeneficiario && (
                    <span style={{ color: "#ef4444", fontSize: "0.78rem", fontWeight: 600, display: "block" }}>
                      🔴 Registrado ({telefonoDuplicadoBen.rol || "Socio"}: {telefonoDuplicadoBen.nombres})
                    </span>
                  )}
                  {!verificandoTelefonoBen && !telefonoDuplicadoBen && !esMenorBeneficiario && form.telefonoBeneficiario.replace(/\D/g, "").length === 8 && (
                    <span style={{ color: "#10b981", fontSize: "0.78rem", fontWeight: 600, display: "block" }}>
                      ✓ Teléfono válido
                    </span>
                  )}
                </div>
              </div>
              <div style={{ display: "flex", gap: "0.5rem", marginTop: "1rem" }}>
                <button type="submit" className="btn" disabled={guardando}>
                  {guardando ? "Guardando…" : "Guardar cambios"}
                </button>
                <button type="button" className="btn secondary" onClick={() => setEditando(false)}>
                  Cancelar
                </button>
              </div>
            </form>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {/* Fila 1: Fecha Ingreso y Género */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
                <div style={{ background: "var(--paper-raised)", padding: "0.55rem 0.75rem", borderRadius: "8px", border: "1px solid var(--line)" }}>
                  <span style={{ fontSize: "0.72rem", color: "var(--ink-soft)", fontWeight: 600, display: "block" }}>Fecha de Ingreso</span>
                  <strong className="mono" style={{ fontSize: "0.85rem", color: "var(--ink)", display: "block", marginTop: "2px" }}>
                    {new Date(socio.fecha_ingreso).toLocaleDateString("es-GT")}
                  </strong>
                </div>

                <div style={{ background: "var(--paper-raised)", padding: "0.55rem 0.75rem", borderRadius: "8px", border: "1px solid var(--line)" }}>
                  <span style={{ fontSize: "0.72rem", color: "var(--ink-soft)", fontWeight: 600, display: "block" }}>Género</span>
                  <strong style={{ fontSize: "0.85rem", color: "var(--ink)", display: "block", marginTop: "2px" }}>
                    {socio.genero === "F" ? "👩 Femenino" : socio.genero === "M" ? "👨 Masculino" : "—"}
                  </strong>
                </div>
              </div>

              {/* Fila 2: DPI */}
              <div style={{ background: "var(--paper-raised)", padding: "0.55rem 0.75rem", borderRadius: "8px", border: "1px solid var(--line)" }}>
                <span style={{ fontSize: "0.72rem", color: "var(--ink-soft)", fontWeight: 600, display: "block" }}>Documento Personal de Identificación (DPI)</span>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "2px" }}>
                  <strong className="mono" style={{ fontSize: "0.95rem", letterSpacing: "0.5px", color: "var(--ink)" }}>
                    {socio.dpi ? formatearDPI(socio.dpi) : "—"}
                  </strong>
                  {socio.dpi && (
                    <button
                      type="button"
                      className="btn secondary"
                      style={{ padding: "0.15rem 0.45rem", fontSize: "0.72rem" }}
                      onClick={() => navigator.clipboard.writeText((socio.dpi || "").replace(/\D/g, ""))}
                      title="Copiar DPI"
                    >
                      Copiar
                    </button>
                  )}
                </div>
              </div>

              {/* Fila 3: Teléfono con WhatsApp */}
              <div style={{ background: "var(--paper-raised)", padding: "0.55rem 0.75rem", borderRadius: "8px", border: "1px solid var(--line)" }}>
                <span style={{ fontSize: "0.72rem", color: "var(--ink-soft)", fontWeight: 600, display: "block" }}>Teléfono Principal</span>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "2px", flexWrap: "wrap", gap: "0.4rem" }}>
                  <strong className="mono" style={{ fontSize: "0.95rem", color: "var(--ink)" }}>
                    {socio.telefono ? socio.telefono : "—"}
                  </strong>
                  {socio.telefono && (
                    <a
                      href={`https://wa.me/${socio.telefono.replace(/\D/g, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn"
                      style={{
                        padding: "0.2rem 0.6rem",
                        fontSize: "0.75rem",
                        borderRadius: "20px",
                        background: "#25D366",
                        color: "#ffffff",
                        borderColor: "#25D366",
                        fontWeight: 700,
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.25rem",
                      }}
                      title="Contactar vía WhatsApp"
                    >
                      💬 WhatsApp
                    </a>
                  )}
                </div>
              </div>

              {/* Fila 4: Dirección */}
              <div style={{ background: "var(--paper-raised)", padding: "0.55rem 0.75rem", borderRadius: "8px", border: "1px solid var(--line)" }}>
                <span style={{ fontSize: "0.72rem", color: "var(--ink-soft)", fontWeight: 600, display: "block" }}>Dirección y Residencia</span>
                <strong style={{ fontSize: "0.85rem", color: "var(--ink)", display: "block", marginTop: "2px" }}>
                  {socio.direccion ?? "—"}
                </strong>
              </div>

              {/* Fila 5: Beneficiario Registrado */}
              <div style={{ background: "rgba(2, 132, 199, 0.05)", padding: "0.65rem 0.8rem", borderRadius: "8px", border: "1px solid rgba(2, 132, 199, 0.2)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "0.72rem", color: "#0284c7", fontWeight: 700, textTransform: "uppercase" }}>
                    Persona Beneficiaria
                  </span>
                  {socio.parentesco_beneficiario && (
                    <span style={{ fontSize: "0.72rem", fontWeight: 700, padding: "0.1rem 0.45rem", borderRadius: "4px", background: "rgba(2, 132, 199, 0.15)", color: "#0284c7" }}>
                      {socio.parentesco_beneficiario}
                    </span>
                  )}
                </div>
                <strong style={{ fontSize: "0.9rem", color: "var(--ink)", display: "block", marginTop: "3px" }}>
                  {socio.nombre_beneficiario ?? "Sin beneficiario asignado"}
                </strong>
                {(socio.dpi_beneficiario || socio.telefono_beneficiario) && (
                  <div style={{ fontSize: "0.78rem", color: "var(--ink-soft)", marginTop: "0.25rem" }}>
                    {socio.dpi_beneficiario ? `DPI: ${formatearDPI(socio.dpi_beneficiario)} ` : ""}
                    {socio.telefono_beneficiario ? `· Tel: ${socio.telefono_beneficiario}` : ""}
                  </div>
                )}
              </div>

              {/* Fila 6: Tutor(a) Legal si el asociado es menor de edad */}
              {socio.es_menor && (
                <div style={{ background: "rgba(124, 58, 237, 0.05)", padding: "0.65rem 0.8rem", borderRadius: "8px", border: "1px solid rgba(124, 58, 237, 0.25)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "0.72rem", color: "#7c3aed", fontWeight: 700, textTransform: "uppercase" }}>
                      🧒 Tutor(a) Legal / Representante
                    </span>
                    {socio.tutor_parentesco && (
                      <span style={{ fontSize: "0.72rem", fontWeight: 700, padding: "0.1rem 0.45rem", borderRadius: "4px", background: "rgba(124, 58, 237, 0.15)", color: "#7c3aed" }}>
                        {socio.tutor_parentesco}
                      </span>
                    )}
                  </div>
                  <strong style={{ fontSize: "0.9rem", color: "var(--ink)", display: "block", marginTop: "3px" }}>
                    {socio.tutor_nombre ?? "Pendiente de asignar tutor en ventanilla"}
                  </strong>
                  {(socio.tutor_dpi || socio.tutor_telefono) && (
                    <div style={{ fontSize: "0.78rem", color: "var(--ink-soft)", marginTop: "0.25rem" }}>
                      {socio.tutor_dpi ? `DPI: ${formatearDPI(socio.tutor_dpi)} ` : ""}
                      {socio.tutor_telefono ? `· Tel: ${socio.tutor_telefono}` : ""}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* PORTAFOLIO DE CUENTAS DEL ASOCIADO */}
        <div
          className="card"
          style={{
            background: "var(--paper)",
            border: "1px solid var(--line)",
            borderRadius: "10px",
            padding: "1rem 1.15rem",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.85rem", borderBottom: "1px solid var(--line)", paddingBottom: "0.45rem" }}>
            <h3 style={{ fontFamily: "inherit", fontSize: "0.95rem", fontWeight: 800, margin: 0, display: "flex", alignItems: "center", gap: "0.35rem" }}>
              <span>🏦</span> Cuentas y Portafolio ({socio.cuentas.length})
            </h3>
            {!tieneAportacion && (
              <button
                type="button"
                className="btn"
                style={{ fontSize: "0.75rem", padding: "0.2rem 0.55rem", background: "#059669", borderColor: "#059669", fontWeight: 700 }}
                onClick={() => setMostrarModalAportacion(true)}
              >
                + Aportación
              </button>
            )}
          </div>

          {socio.cuentas.length === 0 ? (
            <div style={{ textAlign: "center", padding: "2rem 1rem", color: "var(--ink-soft)" }}>
              <div style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>📂</div>
              <p style={{ margin: "0 0 0.75rem", fontSize: "0.9rem", fontWeight: 600 }}>
                Este asociado todavía no tiene cuentas activas en el sistema.
              </p>
              <button
                type="button"
                className="btn"
                style={{ background: "#059669", borderColor: "#059669", fontWeight: 700, fontSize: "0.84rem" }}
                onClick={() => setMostrarModalAportacion(true)}
              >
                ➕ Aperturar Cuenta de Aportaciones (Q 100)
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
              {socio.cuentas.map((c) => {
                const slug = TIPO_SLUG[c.tipo];
                const esApor = c.tipo === "APORTACION";
                const esPF = c.tipo === "AHORRO_PLAZO_FIJO";
                const esASP = c.tipo === "AHORRO_SOBRE_PRESTAMO";
                const saldoNum = Number(c.saldo_actual || 0);

                return (
                  <div
                    key={c.id}
                    style={{
                      background: esApor ? "rgba(5, 150, 105, 0.04)" : "var(--paper-raised)",
                      border: `1px solid ${esApor ? "rgba(5, 150, 105, 0.25)" : "var(--line)"}`,
                      borderRadius: "8px",
                      padding: "0.65rem 0.85rem",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: "0.6rem",
                    }}
                  >
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                        <span
                          className="badge"
                          style={{
                            background: esApor ? "rgba(5, 150, 105, 0.15)" : esPF ? "rgba(124, 58, 237, 0.15)" : esASP ? "rgba(217, 119, 6, 0.15)" : "rgba(2, 132, 199, 0.15)",
                            color: esApor ? "#059669" : esPF ? "#7c3aed" : esASP ? "#d97706" : "#0284c7",
                            fontWeight: 700,
                            fontSize: "0.72rem",
                            padding: "0.1rem 0.45rem",
                          }}
                        >
                          {TIPO_CUENTA_LABEL[c.tipo] ?? c.tipo}
                        </span>
                      </div>
                      <div style={{ marginTop: "3px" }}>
                        <DualCuentaBadge numeroCuenta={c.numero_cuenta} codigoSistema={c.codigo_sistema} />
                      </div>
                    </div>

                    <div style={{ textAlign: "right" }}>
                      <span style={{ fontSize: "0.68rem", color: "var(--ink-soft)", display: "block", textTransform: "uppercase", fontWeight: 600 }}>
                        Saldo Actual
                      </span>
                      <strong className="mono" style={{ fontSize: "1.05rem", color: esApor ? "#059669" : "var(--ink)", display: "block" }}>
                        {formatoQ(saldoNum)}
                      </strong>
                      <div style={{ marginTop: "2px" }}>
                        {slug ? (
                          <Link to={`/ahorros/${slug}/${c.id}`} style={{ fontSize: "0.74rem", fontWeight: 700, textDecoration: "none" }}>
                            Ver Cuenta →
                          </Link>
                        ) : (
                          <Link to="/aportaciones" style={{ fontSize: "0.74rem", fontWeight: 700, textDecoration: "none" }}>
                            Ver Aportación →
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* MODAL RÁPIDO DE APERTURA DE CUENTA DE APORTACIÓN */}
      {mostrarModalAportacion && (
        <div
          className="caja-chica-modal-overlay"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.75)",
            zIndex: 9999,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            padding: "1rem",
          }}
        >
          <div
            className="card"
            style={{
              width: "100%",
              maxWidth: "500px",
              background: "var(--paper)",
              borderRadius: "10px",
              boxShadow: "0 20px 40px -10px rgba(0, 0, 0, 0.5)",
              border: "1px solid var(--line)",
              padding: "1.25rem",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem", borderBottom: "1px solid var(--line)", paddingBottom: "0.5rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                <span style={{ fontSize: "1.25rem" }}>🏛️</span>
                <h3 style={{ margin: 0, fontSize: "1.1rem" }}>Aperturar Cuenta de Aportaciones</h3>
              </div>
              <button
                type="button"
                className="btn secondary"
                style={{ padding: "0.2rem 0.5rem", fontSize: "0.85rem" }}
                onClick={() => setMostrarModalAportacion(false)}
              >
                ✕
              </button>
            </div>

            <p style={{ fontSize: "0.85rem", color: "var(--ink-soft)", margin: "0 0 1rem" }}>
              Asociado: <strong>{socio.nombres}</strong> (<span className="mono">{socio.numero_asociado}</span>) · Agencia: {socio.agencia_nombre}
            </p>

            <form onSubmit={handleAbrirAportacion}>
              <div className="field">
                <label htmlFor="modal-monto-apor">
                  Monto de Aportación Inicial (Q) <span style={{ color: "#059669", fontWeight: 700 }}>* Mínimo Q 100.00</span>
                </label>
                <input
                  id="modal-monto-apor"
                  type="number"
                  min="100"
                  step="0.01"
                  value={montoApor}
                  onChange={(e) => setMontoApor(e.target.value)}
                  required
                  style={{ fontSize: "1rem", fontWeight: 700 }}
                />
                <span className="hint">Monto estatutario obligatorio para operar en la cooperativa.</span>
              </div>

              <div className="field">
                <label htmlFor="modal-recibo-apor">No. de Recibo o Comprobante (Opcional)</label>
                <input
                  id="modal-recibo-apor"
                  type="text"
                  value={reciboApor}
                  onChange={(e) => setReciboApor(e.target.value)}
                  placeholder="Ej. REC-009842"
                />
              </div>

              {/* CUOTA DE INGRESO */}
              <div
                style={{
                  background: "rgba(191, 153, 3, 0.07)",
                  border: "1px solid rgba(191, 153, 3, 0.3)",
                  borderRadius: "8px",
                  padding: "0.85rem",
                  marginTop: "0.25rem",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", marginBottom: "0.5rem" }}>
                  <span style={{ fontSize: "1rem" }}>🎫</span>
                  <strong style={{ fontSize: "0.88rem", color: "var(--ink)" }}>Cuota de Ingreso (Opcional)</strong>
                </div>
                <div className="field" style={{ margin: 0 }}>
                  <label htmlFor="modal-cuota-ingreso" style={{ fontSize: "0.82rem" }}>
                    Monto de la cuota de membresía (Q)
                  </label>
                  <input
                    id="modal-cuota-ingreso"
                    type="number"
                    min="0"
                    step="0.01"
                    value={cuotaIngresoApor}
                    onChange={(e) => setCuotaIngresoApor(e.target.value)}
                    placeholder="Ej. 25.00 ó 50.00"
                    style={{ fontSize: "1rem", fontWeight: 600 }}
                  />
                  <span className="hint" style={{ color: "var(--ink-soft)" }}>
                    Pago único por inscripción al ingresar como socio. Se registrará automáticamente en la caja del día si hay turno abierto.
                  </span>
                </div>
              </div>

              <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end", marginTop: "1.25rem" }}>
                <button
                  type="button"
                  className="btn secondary"
                  onClick={() => setMostrarModalAportacion(false)}
                  disabled={abriendoApor}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn"
                  style={{ background: "#059669", borderColor: "#059669", fontWeight: 700 }}
                  disabled={abriendoApor}
                >
                  {abriendoApor ? "Creando cuenta…" : "✓ Confirmar y Crear Aportación"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <p style={{ marginTop: "1.5rem" }}>
        <Link to="/socios">← Volver al listado</Link>
      </p>
    </div>
  );
}
```

## `frontend/src/pages/SocioForm.tsx` {#frontendsrcpagessocioformtsx}

```tsx
import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { api, mensajeError } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import type { Agencia } from "../types";
import {
  formatearDPI,
  formatearTelefono,
  limpiarDPI,
  prepararTelefonoParaGuardar,
  capitalizarDescripcion,
} from "../lib/formatters";
import { PARENTESCOS_BENEFICIARIO, PARENTESCOS_BENEFICIARIO_MENOR } from "../types";
import InputNombreAutoCompletar from "../components/InputNombreAutoCompletar";

export default function SocioForm() {
  const { usuario } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const puedeElegirAgencia = usuario?.rol === "GERENCIA";

  const [agencias, setAgencias] = useState<Agencia[]>([]);
  const [agenciaId, setAgenciaId] = useState(() => searchParams.get("agenciaId") || usuario?.agenciaId || "");
  const [numeroAsociado, setNumeroAsociado] = useState("");
  const [nombres, setNombres] = useState(() => searchParams.get("nombres") || "");
  const [genero, setGenero] = useState<"M" | "F" | "">("");
  const [dpi, setDpi] = useState(() => (searchParams.get("dpi") ? formatearDPI(searchParams.get("dpi")!) : ""));
  const [fechaIngreso, setFechaIngreso] = useState(() => new Date().toISOString().slice(0, 10));
  const [telefono, setTelefono] = useState(() => (searchParams.get("telefono") ? formatearTelefono(searchParams.get("telefono")!) : ""));
  const [direccion, setDireccion] = useState(() => searchParams.get("direccion") || "");

  // Beneficiario
  const [esMenorBeneficiario, setEsMenorBeneficiario] = useState(false);
  const [nombreBeneficiario, setNombreBeneficiario] = useState("");
  const [parentescoBeneficiario, setParentescoBeneficiario] = useState("");
  const [dpiBeneficiario, setDpiBeneficiario] = useState("");
  const [telefonoBeneficiario, setTelefonoBeneficiario] = useState("");

  // Aportación inicial
  const [montoAportacion, setMontoAportacion] = useState("100");
  const [reciboAportacion, setReciboAportacion] = useState("");

  // Validaciones en tiempo real
  const [dpiDuplicado, setDpiDuplicado] = useState<{ nombres: string; numeroAsociado: string } | null>(null);
  const [dpiMuniInfo, setDpiMuniInfo] = useState<{
    valido: boolean;
    mensaje?: string;
    codigoMunicipio?: string;
    municipio?: string;
    departamento?: string;
    esLocal?: boolean;
    advertencia?: string;
  } | null>(null);
  const [verificandoDpi, setVerificandoDpi] = useState(false);

  const [telefonoDuplicado, setTelefonoDuplicado] = useState<{
    nombres: string;
    numeroAsociado: string;
    rol?: string;
  } | null>(null);
  const [verificandoTelefono, setVerificandoTelefono] = useState(false);

  const [telefonoDuplicadoBen, setTelefonoDuplicadoBen] = useState<{
    nombres: string;
    numeroAsociado: string;
    rol?: string;
  } | null>(null);
  const [verificandoTelefonoBen, setVerificandoTelefonoBen] = useState(false);

  const [dpiDuplicadoBen, setDpiDuplicadoBen] = useState<{
    nombres: string;
    numeroAsociado: string;
    rol?: string;
  } | null>(null);
  const [verificandoDpiBen, setVerificandoDpiBen] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (puedeElegirAgencia) {
      api.get<Agencia[]>("/agencias").then(({ data }) => setAgencias(data));
    }
  }, [puedeElegirAgencia]);

  useEffect(() => {
    if (!agenciaId) return;
    api
      .get<{ numeroAsociado: string }>("/socios/siguiente-numero", { params: { agenciaId } })
      .then(({ data }) => setNumeroAsociado(data.numeroAsociado));
  }, [agenciaId]);

  // Verificación en tiempo real de DPI duplicado y municipio al completar 13 dígitos
  useEffect(() => {
    const rawDpi = limpiarDPI(dpi);
    if (rawDpi.length === 13) {
      setVerificandoDpi(true);
      const timer = setTimeout(() => {
        const agSel = agencias?.find((a) => a.id === agenciaId);
        api
          .get<{
            valido: boolean;
            mensaje?: string;
            disponible?: boolean;
            codigoMunicipio?: string;
            municipio?: string;
            departamento?: string;
            esLocal?: boolean;
            advertencia?: string;
            registrado?: { nombres: string; numeroAsociado: string; rol?: string };
            socio?: { nombres: string; numeroAsociado: string };
          }>("/socios/verificar-dpi", { params: { dpi: rawDpi, agenciaCodigo: agSel?.codigo } })
          .then(({ data }) => {
            setDpiMuniInfo(data);
            if (data.disponible === false && data.registrado) {
              setDpiDuplicado(data.registrado);
            } else if (data.disponible === false && data.socio) {
              setDpiDuplicado(data.socio);
            } else {
              setDpiDuplicado(null);
            }
          })
          .catch(() => {
            setDpiDuplicado(null);
            setDpiMuniInfo(null);
          })
          .finally(() => setVerificandoDpi(false));
      }, 250);
      return () => clearTimeout(timer);
    } else {
      setDpiDuplicado(null);
      setDpiMuniInfo(null);
      setVerificandoDpi(false);
    }
  }, [dpi, agenciaId, agencias]);

  // Verificación en tiempo real de Teléfono del socio (8 dígitos)
  useEffect(() => {
    const rawTel = telefono.replace(/\D/g, "");
    const localTel = rawTel.startsWith("502") && rawTel.length > 8 ? rawTel.slice(3) : rawTel.slice(-8);
    if (localTel.length === 8) {
      setVerificandoTelefono(true);
      const timer = setTimeout(() => {
        api
          .get<{
            valido: boolean;
            disponible?: boolean;
            registrado?: { nombres: string; numeroAsociado: string; rol: string };
          }>("/socios/verificar-telefono", { params: { telefono: localTel, tipo: "SOCIO" } })
          .then(({ data }) => {
            if (data.disponible === false && data.registrado) {
              setTelefonoDuplicado(data.registrado);
            } else {
              setTelefonoDuplicado(null);
            }
          })
          .catch(() => setTelefonoDuplicado(null))
          .finally(() => setVerificandoTelefono(false));
      }, 250);
      return () => clearTimeout(timer);
    } else {
      setTelefonoDuplicado(null);
      setVerificandoTelefono(false);
    }
  }, [telefono]);

  // Verificación en tiempo real de Teléfono del beneficiario (si NO es menor)
  useEffect(() => {
    if (esMenorBeneficiario) {
      setTelefonoDuplicadoBen(null);
      setVerificandoTelefonoBen(false);
      return;
    }
    const rawTel = telefonoBeneficiario.replace(/\D/g, "");
    const localTel = rawTel.startsWith("502") && rawTel.length > 8 ? rawTel.slice(3) : rawTel.slice(-8);
    if (localTel.length === 8) {
      setVerificandoTelefonoBen(true);
      const timer = setTimeout(() => {
        api
          .get<{
            valido: boolean;
            disponible?: boolean;
            registrado?: { nombres: string; numeroAsociado: string; rol: string };
          }>("/socios/verificar-telefono", { params: { telefono: localTel, tipo: "BENEFICIARIO" } })
          .then(({ data }) => {
            if (data.disponible === false && data.registrado) {
              setTelefonoDuplicadoBen(data.registrado);
            } else {
              setTelefonoDuplicadoBen(null);
            }
          })
          .catch(() => setTelefonoDuplicadoBen(null))
          .finally(() => setVerificandoTelefonoBen(false));
      }, 250);
      return () => clearTimeout(timer);
    } else {
      setTelefonoDuplicadoBen(null);
      setVerificandoTelefonoBen(false);
    }
  }, [telefonoBeneficiario, esMenorBeneficiario]);

  // Verificación en tiempo real de DPI del beneficiario (si NO es menor)
  useEffect(() => {
    if (esMenorBeneficiario) {
      setDpiDuplicadoBen(null);
      setVerificandoDpiBen(false);
      return;
    }
    const rawDpi = limpiarDPI(dpiBeneficiario);
    if (rawDpi.length === 13) {
      setVerificandoDpiBen(true);
      const timer = setTimeout(() => {
        api
          .get<{
            valido: boolean;
            disponible?: boolean;
            registrado?: { nombres: string; numeroAsociado: string; rol: string };
            socio?: { nombres: string; numeroAsociado: string };
          }>("/socios/verificar-dpi", { params: { dpi: rawDpi, tipo: "BENEFICIARIO" } })
          .then(({ data }) => {
            if (data.disponible === false && data.registrado) {
              setDpiDuplicadoBen(data.registrado);
            } else if (data.disponible === false && data.socio) {
              setDpiDuplicadoBen({ ...data.socio, rol: "Socio registrado" });
            } else {
              setDpiDuplicadoBen(null);
            }
          })
          .catch(() => setDpiDuplicadoBen(null))
          .finally(() => setVerificandoDpiBen(false));
      }, 250);
      return () => clearTimeout(timer);
    } else {
      setDpiDuplicadoBen(null);
      setVerificandoDpiBen(false);
    }
  }, [dpiBeneficiario, esMenorBeneficiario]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (dpiMuniInfo && !dpiMuniInfo.valido) {
      setError(dpiMuniInfo.mensaje || "El DPI ingresado no es válido.");
      return;
    }
    if (dpiDuplicado) {
      setError(
        `El DPI ya está registrado para el socio ${dpiDuplicado.nombres} (${dpiDuplicado.numeroAsociado}). Modifícalo antes de guardar.`
      );
      return;
    }
    if (telefonoDuplicado) {
      setError(
        `El teléfono ya está registrado para el socio ${telefonoDuplicado.nombres} (${telefonoDuplicado.numeroAsociado}). No se permiten números duplicados.`
      );
      return;
    }
    if (!esMenorBeneficiario && telefonoDuplicadoBen) {
      setError(
        `El teléfono del beneficiario ya pertenece a un registro (${telefonoDuplicadoBen.rol || "Socio"}: ${telefonoDuplicadoBen.nombres}, Asociado: ${telefonoDuplicadoBen.numeroAsociado}). Modifícalo antes de guardar.`
      );
      return;
    }
    if (!esMenorBeneficiario && dpiDuplicadoBen) {
      setError(
        `El DPI/CUI del beneficiario ya pertenece a un registro (${dpiDuplicadoBen.rol || "Socio"}: ${dpiDuplicadoBen.nombres}, Asociado: ${dpiDuplicadoBen.numeroAsociado}). Modifícalo antes de guardar.`
      );
      return;
    }
    const cleanDpi = dpi ? dpi.replace(/\D/g, "") : "";
    const cleanDpiBen = dpiBeneficiario ? dpiBeneficiario.replace(/\D/g, "") : "";
    if (cleanDpi && cleanDpiBen && cleanDpi === cleanDpiBen) {
      setError("El DPI del socio y el DPI/CUI del beneficiario no pueden ser iguales.");
      return;
    }
    const cleanTel = telefono ? telefono.replace(/\D/g, "") : "";
    const cleanTelBen = telefonoBeneficiario ? telefonoBeneficiario.replace(/\D/g, "") : "";
    if (cleanTel && cleanTelBen && cleanTel === cleanTelBen) {
      setError("El teléfono del socio y el teléfono del beneficiario no pueden ser iguales.");
      return;
    }
    if (!reciboAportacion.trim()) {
      setError("El número de boleta o recibo de pago es obligatorio para respaldar la aportación estatutaria inicial.");
      return;
    }
    const montoAporNum = Number(montoAportacion);
    if (isNaN(montoAporNum) || montoAporNum < 100) {
      setError("La regla de la cooperativa exige una aportación inicial mínima de Q 100.00.");
      return;
    }

    setError(null);
    setGuardando(true);
    try {
      const { data } = await api.post("/socios", {
        numeroAsociado,
        agenciaId,
        nombres,
        genero: genero || undefined,
        dpi: dpi ? dpi.trim() : undefined,
        fechaIngreso,
        telefono: prepararTelefonoParaGuardar(telefono),
        direccion: direccion || undefined,
        nombreBeneficiario: nombreBeneficiario || undefined,
        parentescoBeneficiario: parentescoBeneficiario || undefined,
        dpiBeneficiario: dpiBeneficiario ? dpiBeneficiario.trim() : undefined,
        telefonoBeneficiario: prepararTelefonoParaGuardar(telefonoBeneficiario),
        montoAportacionInicial: montoAporNum,
        reciboAportacionInicial: reciboAportacion.trim(),
      });
      navigate(`/socios/${data.id}`);
    } catch (err) {
      setError(mensajeError(err));
      setGuardando(false);
    }
  }

  const rawDpiLength = limpiarDPI(dpi).length;
  const rawTelLength = telefono.replace(/\D/g, "").length;
  const rawDpiBenLength = limpiarDPI(dpiBeneficiario).length;
  const rawTelBenLength = telefonoBeneficiario.replace(/\D/g, "").length;

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Nuevo socio</h1>
          <p>Datos generales del asociado. Después podrás abrirle cuentas de ahorro o aportación.</p>
        </div>
      </div>

      {error && <div className="alert error">{error}</div>}

      <form className="card" onSubmit={onSubmit} style={{ maxWidth: 680 }}>
        <div className="form-grid">
          {puedeElegirAgencia && (
            <div className="field">
              <label htmlFor="agencia">Agencia</label>
              <select id="agencia" value={agenciaId} onChange={(e) => setAgenciaId(e.target.value)} required>
                <option value="" disabled>
                  Selecciona una agencia
                </option>
                {agencias.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.nombre}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="field">
            <label htmlFor="numero">No. de asociado</label>
            <input id="numero" value={numeroAsociado} onChange={(e) => setNumeroAsociado(e.target.value)} required />
            <span className="hint">Sugerido automáticamente; puedes ajustarlo.</span>
          </div>

          <div className="field" style={{ gridColumn: "1 / -1" }}>
            <label htmlFor="nombres">Nombres completos</label>
            <InputNombreAutoCompletar
              id="nombres"
              value={nombres}
              onChange={setNombres}
              placeholder="Ej. Tomás Sánchez Pérez"
              required
            />
            <span className="hint">Sugerencias inteligentes con tildes. Toca la sugerencia o presiona Tab para autocompletar.</span>
          </div>

          {/* Fila: Género a la izquierda, DPI del asociado a la derecha */}
          <div className="field">
            <label htmlFor="genero">Género</label>
            <select id="genero" value={genero} onChange={(e) => setGenero(e.target.value as "M" | "F" | "")}>
              <option value="">Sin especificar</option>
              <option value="F">Femenino</option>
              <option value="M">Masculino</option>
            </select>
          </div>

          <div className="field">
            <label htmlFor="dpi">DPI del asociado</label>
            <input
              id="dpi"
              inputMode="numeric"
              value={dpi}
              onChange={(e) => setDpi(formatearDPI(e.target.value.replace(/[^0-9-]/g, "")))}
              maxLength={15}
              placeholder="xxxx-xxxxx-xxxx"
              style={{
                fontFamily: "monospace",
                letterSpacing: "0.5px",
                borderColor: dpiDuplicado ? "var(--danger)" : undefined,
              }}
            />
            <div style={{ minHeight: "1.1rem", marginTop: "0.15rem" }}>
              {verificandoDpi && <span className="hint">🔍 Verificando DPI y procedencia municipal...</span>}
              {dpiMuniInfo && !dpiMuniInfo.valido && (
                <span style={{ color: "#ef4444", fontSize: "0.78rem", fontWeight: 600, display: "block" }}>
                  ⛔ {dpiMuniInfo.mensaje}
                </span>
              )}
              {dpiDuplicado && (
                <span style={{ color: "#ef4444", fontSize: "0.78rem", fontWeight: 600, display: "block" }}>
                  ⚠️ Ya registrado para: {dpiDuplicado.nombres} ({dpiDuplicado.numeroAsociado})
                </span>
              )}
              {!verificandoDpi && !dpiDuplicado && dpiMuniInfo?.valido && (
                <span
                  style={{
                    color: dpiMuniInfo.esLocal ? "#10b981" : "#0284c7",
                    fontSize: "0.78rem",
                    fontWeight: 600,
                    display: "block",
                  }}
                >
                  {dpiMuniInfo.esLocal
                    ? `✓ ${dpiMuniInfo.codigoMunicipio} — ${dpiMuniInfo.municipio}, ${dpiMuniInfo.departamento} (Agencia Local)`
                    : `🔵 ${dpiMuniInfo.codigoMunicipio} — ${dpiMuniInfo.municipio}, ${dpiMuniInfo.departamento} (Válido: Asociado procedente de otro municipio)`}
                </span>
              )}
              {rawDpiLength > 0 && rawDpiLength < 13 && (
                <span className="hint">{rawDpiLength}/13 dígitos (solo números)</span>
              )}
            </div>
          </div>

          {/* Fila abajo: Fecha de ingreso y Teléfono */}
          <div className="field">
            <label htmlFor="fecha">Fecha de ingreso</label>
            <input
              id="fecha"
              type="date"
              value={fechaIngreso}
              onChange={(e) => setFechaIngreso(e.target.value)}
              required
            />
          </div>

          {/* Fila: Teléfono con prefijo +502 */}
          <div className="field">
            <label htmlFor="telefono">Teléfono (WhatsApp)</label>
            <div style={{ display: "flex", alignItems: "stretch" }}>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.3rem",
                  padding: "0 0.75rem",
                  background: "var(--mono-bg, #1e293b)",
                  border: "1px solid var(--line)",
                  borderRight: "none",
                  borderTopLeftRadius: "8px",
                  borderBottomLeftRadius: "8px",
                  fontSize: "0.88rem",
                  fontWeight: 600,
                  color: "var(--ink)",
                  userSelect: "none",
                  whiteSpace: "nowrap",
                }}
              >
                🇬🇹 +502
              </span>
              <input
                id="telefono"
                inputMode="numeric"
                value={telefono}
                onChange={(e) => setTelefono(formatearTelefono(e.target.value.replace(/[^0-9-]/g, "")))}
                placeholder="xxxx-xxxx"
                maxLength={9}
                style={{
                  borderTopLeftRadius: 0,
                  borderBottomLeftRadius: 0,
                  fontFamily: "monospace",
                  letterSpacing: "0.5px",
                  borderColor: telefonoDuplicado ? "var(--danger)" : undefined,
                }}
              />
            </div>
            <div style={{ minHeight: "1.1rem", marginTop: "0.15rem" }}>
              {verificandoTelefono && <span className="hint">🔍 Verificando número...</span>}
              {telefonoDuplicado && (
                <span style={{ color: "#ef4444", fontSize: "0.78rem", fontWeight: 600, display: "block" }}>
                  ⚠️ Teléfono ya registrado para: {telefonoDuplicado.nombres} ({telefonoDuplicado.numeroAsociado})
                </span>
              )}
              {!verificandoTelefono && !telefonoDuplicado && rawTelLength === 8 && (
                <span style={{ color: "#10b981", fontSize: "0.78rem", fontWeight: 500 }}>
                  ✓ Disponible para WhatsApp (+502 {telefono})
                </span>
              )}
              {rawTelLength > 0 && rawTelLength < 8 && (
                <span className="hint">{rawTelLength}/8 dígitos locales (solo números)</span>
              )}
              {rawTelLength === 0 && (
                <span className="hint">8 dígitos numéricos (número único por socio)</span>
              )}
            </div>
          </div>

          <div className="field">
            <label htmlFor="direccion">Dirección / Comunidad</label>
            <input
              id="direccion"
              value={direccion}
              onChange={(e) => setDireccion(capitalizarDescripcion(e.target.value))}
              placeholder="Ej. Cantón Ilom, Chajul"
            />
          </div>

          {/* Sección Beneficiario */}
          <div style={{ gridColumn: "1 / -1", marginTop: "0.75rem", borderTop: "1px solid var(--line)", paddingTop: "1.25rem" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.75rem", marginBottom: "0.75rem" }}>
              <div>
                <h3 style={{ margin: 0, fontSize: "1.05rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                  <span>👥</span> Datos de la Persona Beneficiaria
                </h3>
                <p style={{ margin: "0.25rem 0 0", fontSize: "0.82rem", color: "var(--ink-soft)" }}>
                  Designada por el asociado según el libro oficial de aportaciones.
                </p>
              </div>

              {/* Selector segmentado: Adulto vs Menor de Edad */}
              <div
                style={{
                  display: "inline-flex",
                  background: "var(--mono-bg, #0f172a)",
                  padding: "0.25rem",
                  borderRadius: "8px",
                  border: "1px solid var(--line)",
                  gap: "0.25rem",
                }}
              >
                <button
                  type="button"
                  onClick={() => {
                    setEsMenorBeneficiario(false);
                  }}
                  style={{
                    padding: "0.35rem 0.75rem",
                    borderRadius: "6px",
                    border: "none",
                    fontSize: "0.82rem",
                    fontWeight: 600,
                    cursor: "pointer",
                    background: !esMenorBeneficiario ? "var(--primary, #0284c7)" : "transparent",
                    color: !esMenorBeneficiario ? "#ffffff" : "var(--ink-soft)",
                    transition: "all 0.15s ease",
                  }}
                >
                  👤 Adulto (DPI)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEsMenorBeneficiario(true);
                    setParentescoBeneficiario("Hijo(a)");
                    setTelefonoDuplicadoBen(null);
                  }}
                  style={{
                    padding: "0.35rem 0.75rem",
                    borderRadius: "6px",
                    border: "none",
                    fontSize: "0.82rem",
                    fontWeight: 600,
                    cursor: "pointer",
                    background: esMenorBeneficiario ? "#0ea5e9" : "transparent",
                    color: esMenorBeneficiario ? "#ffffff" : "var(--ink-soft)",
                    transition: "all 0.15s ease",
                  }}
                >
                  🧒 Menor de edad (CUI)
                </button>
              </div>
            </div>

            {esMenorBeneficiario && (
              <div
                style={{
                  padding: "0.6rem 0.85rem",
                  borderRadius: "8px",
                  background: "rgba(14, 165, 233, 0.12)",
                  border: "1px solid rgba(14, 165, 233, 0.35)",
                  color: "#38bdf8",
                  fontSize: "0.82rem",
                  marginBottom: "1rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                }}
              >
                <span>ℹ️</span>
                <span>
                  <strong>Beneficiario menor de edad:</strong> Ingrese el <strong>CUI de 13 dígitos</strong> que aparece en su partida de nacimiento de RENAP. El parentesco se ajusta a menores de edad y el teléfono es opcional.
                </span>
              </div>
            )}
          </div>

          <div className="field">
            <label htmlFor="beneficiario">Nombre completo del beneficiario</label>
            <InputNombreAutoCompletar
              id="beneficiario"
              value={nombreBeneficiario}
              onChange={setNombreBeneficiario}
              placeholder={esMenorBeneficiario ? "Ej. Juanito Tomás Sánchez Pérez" : "Ej. María Elena Pérez Gómez"}
            />
          </div>

          <div className="field">
            <label htmlFor="parentesco-ben">Parentesco con el asociado</label>
            <select
              id="parentesco-ben"
              value={parentescoBeneficiario}
              onChange={(e) => setParentescoBeneficiario(e.target.value)}
            >
              <option value="">Selecciona el parentesco…</option>
              {(esMenorBeneficiario ? PARENTESCOS_BENEFICIARIO_MENOR : PARENTESCOS_BENEFICIARIO).map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
            <span className="hint">
              {esMenorBeneficiario ? "Opciones válidas para menores (sugerido Hijo/a)" : "Vínculo familiar del beneficiario"}
            </span>
          </div>

          <div className="field">
            <label htmlFor="dpi-ben" style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <span>{esMenorBeneficiario ? "CUI del menor (RENAP)" : "DPI del beneficiario"}</span>
              {esMenorBeneficiario && (
                <span
                  style={{
                    fontSize: "0.7rem",
                    padding: "0.1rem 0.4rem",
                    borderRadius: "4px",
                    background: "#0ea5e9",
                    color: "#fff",
                    fontWeight: 700,
                  }}
                >
                  CUI RENAP
                </span>
              )}
            </label>
            <input
              id="dpi-ben"
              inputMode="numeric"
              value={dpiBeneficiario}
              onChange={(e) => setDpiBeneficiario(formatearDPI(e.target.value.replace(/[^0-9-]/g, "")))}
              maxLength={15}
              placeholder={esMenorBeneficiario ? "xxxx-xxxxx-xxxx (CUI de partida)" : "xxxx-xxxxx-xxxx (DPI adulto)"}
              style={{
                fontFamily: "monospace",
                letterSpacing: "0.5px",
                borderColor: esMenorBeneficiario ? "#38bdf8" : undefined,
              }}
            />
            <div style={{ minHeight: "1.1rem", marginTop: "0.15rem" }}>
              {verificandoDpiBen && !esMenorBeneficiario ? (
                <span className="hint">🔍 Verificando...</span>
              ) : dpiDuplicadoBen && !esMenorBeneficiario ? (
                <span style={{ color: "#ef4444", fontSize: "0.78rem", fontWeight: 600, display: "block" }}>
                  🔴 DPI/CUI registrado ({dpiDuplicadoBen.nombres})
                </span>
              ) : esMenorBeneficiario ? (
                <span className="hint" style={{ color: "#38bdf8" }}>
                  {rawDpiBenLength === 13 ? "✓ CUI válido (13 dígitos de partida)" : `${rawDpiBenLength}/13 dígitos numéricos del CUI`}
                </span>
              ) : rawDpiBenLength === 13 ? (
                <span style={{ color: "#10b981", fontSize: "0.78rem", fontWeight: 500 }}>
                  ✓ DPI válido (13 dígitos)
                </span>
              ) : (
                <span className="hint">13 dígitos numéricos (opcional)</span>
              )}
            </div>
          </div>

          <div className="field">
            <label htmlFor="tel-ben">
              Teléfono del beneficiario {esMenorBeneficiario ? "(Opcional)" : ""}
            </label>
            <div style={{ display: "flex", alignItems: "stretch" }}>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.3rem",
                  padding: "0 0.75rem",
                  background: "var(--mono-bg, #1e293b)",
                  border: "1px solid var(--line)",
                  borderRight: "none",
                  borderTopLeftRadius: "8px",
                  borderBottomLeftRadius: "8px",
                  fontSize: "0.88rem",
                  fontWeight: 600,
                  color: "var(--ink)",
                  userSelect: "none",
                  whiteSpace: "nowrap",
                }}
              >
                🇬🇹 +502
              </span>
              <input
                id="tel-ben"
                inputMode="numeric"
                value={telefonoBeneficiario}
                onChange={(e) => setTelefonoBeneficiario(formatearTelefono(e.target.value.replace(/[^0-9-]/g, "")))}
                placeholder="xxxx-xxxx"
                maxLength={9}
                style={{
                  borderTopLeftRadius: 0,
                  borderBottomLeftRadius: 0,
                  fontFamily: "monospace",
                  letterSpacing: "0.5px",
                  borderColor: !esMenorBeneficiario && telefonoDuplicadoBen ? "var(--danger)" : undefined,
                }}
              />
            </div>
            <div style={{ minHeight: "1.1rem", marginTop: "0.15rem" }}>
              {!esMenorBeneficiario && verificandoTelefonoBen && (
                <span className="hint">🔍 Verificando teléfono...</span>
              )}
              {!esMenorBeneficiario && telefonoDuplicadoBen && (
                <span style={{ color: "#ef4444", fontSize: "0.78rem", fontWeight: 600, display: "block" }}>
                  🔴 Teléfono ya registrado ({telefonoDuplicadoBen.rol || "Socio"}: {telefonoDuplicadoBen.nombres})
                </span>
              )}
              {esMenorBeneficiario && (
                <span className="hint">
                  Opcional (al ser menor de edad, puede usar el del padre o tutor sin validación de duplicado)
                </span>
              )}
              {!esMenorBeneficiario && !telefonoDuplicadoBen && !verificandoTelefonoBen && rawTelBenLength === 8 && (
                <span style={{ color: "#10b981", fontSize: "0.78rem", fontWeight: 500 }}>
                  ✓ Teléfono válido (+502 {telefonoBeneficiario})
                </span>
              )}
              {!esMenorBeneficiario && !telefonoDuplicadoBen && rawTelBenLength > 0 && rawTelBenLength < 8 && (
                <span className="hint">{rawTelBenLength}/8 dígitos numéricos</span>
              )}
              {!esMenorBeneficiario && rawTelBenLength === 0 && (
                <span className="hint">8 dígitos numéricos (opcional, no repetible)</span>
              )}
            </div>
          </div>
        </div>

        {/* Aportación Inicial Estatutaria */}
        <div className="card" style={{ marginTop: "1rem" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.4rem", flexWrap: "wrap", gap: "0.5rem" }}>
            <h2 style={{ fontSize: "1.05rem", margin: 0, display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span>💰</span> Aportación Inicial Estatutaria
            </h2>
            <span
              style={{
                fontSize: "0.75rem",
                fontWeight: 700,
                padding: "0.2rem 0.55rem",
                borderRadius: "6px",
                background: "rgba(16, 185, 129, 0.12)",
                color: "#10b981",
                border: "1px solid rgba(16, 185, 129, 0.3)",
              }}
            >
              Requisito Obligatorio: Mínimo Q 100.00
            </span>
          </div>

          <p style={{ margin: "0 0 1rem", fontSize: "0.82rem", color: "var(--ink-soft)", lineHeight: 1.45 }}>
            <strong>Regla de la cooperativa:</strong> Todo asociado debe aportar como mínimo <strong>Q 100.00</strong> para habilitar su afiliación oficial y tener derecho a abrir cuentas de ahorro infantil, corriente, programado, plazo fijo o solicitar créditos.
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1rem" }}>
            <div className="field">
              <label htmlFor="monto-aportacion">Monto de aportación inicial (Q) *</label>
              <div style={{ display: "flex", alignItems: "stretch" }}>
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    padding: "0 0.85rem",
                    background: "var(--mono-bg, #1e293b)",
                    border: "1px solid var(--line)",
                    borderRight: "none",
                    borderTopLeftRadius: "8px",
                    borderBottomLeftRadius: "8px",
                    fontSize: "0.95rem",
                    fontWeight: 700,
                    color: "var(--accent, #38bdf8)",
                    userSelect: "none",
                  }}
                >
                  Q
                </span>
                <input
                  id="monto-aportacion"
                  type="number"
                  min="100"
                  step="any"
                  value={montoAportacion}
                  onChange={(e) => setMontoAportacion(e.target.value)}
                  required
                  placeholder="100.00"
                  style={{
                    borderTopLeftRadius: 0,
                    borderBottomLeftRadius: 0,
                    fontWeight: 700,
                    fontSize: "1.05rem",
                    color: Number(montoAportacion) < 100 ? "var(--danger, #ef4444)" : undefined,
                  }}
                />
              </div>
              {Number(montoAportacion) < 100 ? (
                <span style={{ fontSize: "0.8rem", color: "var(--danger, #ef4444)", marginTop: "0.3rem", display: "block", fontWeight: 600 }}>
                  ⚠️ El estatuto cooperativo exige un mínimo de Q 100.00
                </span>
              ) : (
                <span className="hint">Mínimo Q 100.00 (el socio puede aportar un monto mayor)</span>
              )}
            </div>

            <div className="field">
              <label htmlFor="recibo-aportacion">No. de boleta o recibo de pago *</label>
              <input
                id="recibo-aportacion"
                value={reciboAportacion}
                onChange={(e) => setReciboAportacion(e.target.value)}
                placeholder="Ej. BOL-2026-00412 / REC-1029"
                required
                style={{
                  borderColor: !reciboAportacion.trim() ? "var(--accent, #38bdf8)" : undefined,
                }}
              />
              <span className="hint">
                Comprobante oficial de ingreso en caja o boleta bancaria (Requerido para respaldo de la aportación).
              </span>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.5rem" }}>
          <button
            type="submit"
            className="btn"
            disabled={
              guardando ||
              !agenciaId ||
              Boolean(dpiDuplicado) ||
              verificandoDpi ||
              Boolean(telefonoDuplicado) ||
              verificandoTelefono ||
              (!esMenorBeneficiario && Boolean(telefonoDuplicadoBen)) ||
              verificandoTelefonoBen ||
              !reciboAportacion.trim() ||
              Number(montoAportacion) < 100
            }
          >
            {guardando ? "Guardando…" : "Guardar socio"}
          </button>
          <button type="button" className="btn secondary" onClick={() => navigate(-1)}>
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
```

## `frontend/src/pages/SociosList.tsx` {#frontendsrcpagessocioslisttsx}

```tsx
import axios from "axios";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, mensajeError } from "../lib/api";
import type { ListaSocios, FiadorItem } from "../types";
import { formatearDPI, formatearQuetzales } from "../lib/formatters";

export default function SociosList() {
  const [tab, setTab] = useState<"socios" | "prospectos">("socios");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [resultado, setResultado] = useState<ListaSocios | null>(null);
  const [fiadores, setFiadores] = useState<FiadorItem[]>([]);
  const [cargandoFiadores, setCargandoFiadores] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(true);

  const [recargar, setRecargar] = useState(0);

  // Cargar lista de socios
  useEffect(() => {
    if (tab !== "socios") return;
    const controller = new AbortController();
    setCargando(true);
    setError(null);
    const timeout = setTimeout(() => {
      api
        .get<ListaSocios>("/socios", {
          params: { q: q || undefined, page, pageSize: 10 },
          signal: controller.signal,
        })
        .then(({ data }) => {
          setResultado(data);
          setError(null);
        })
        .catch((err) => {
          if (!axios.isCancel(err) && err?.name !== "CanceledError" && (err as { code?: string })?.code !== "ERR_CANCELED") {
            const msg = mensajeError(err);
            if (msg) setError(msg);
          }
        })
        .finally(() => setCargando(false));
    }, 250);
    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [q, page, tab, recargar]);

  // Cargar lista de fiadores / prospectos
  useEffect(() => {
    if (tab !== "prospectos") return;
    setCargandoFiadores(true);
    setError(null);
    api
      .get<FiadorItem[]>("/prestamos/fiadores", {
        params: { q: q || undefined, tipoFiltro: "EXTERNOS" },
      })
      .then(({ data }) => {
        setFiadores(data);
        setError(null);
      })
      .catch((err) => setError(mensajeError(err)))
      .finally(() => setCargandoFiadores(false));
  }, [q, tab, recargar]);

  const totalPaginas = resultado ? Math.max(1, Math.ceil(resultado.total / resultado.pageSize)) : 1;

  return (
    <div className="screen-container">
      {/* CABECERA COMPACTA DE 1 LÍNEA CON TABS INTEGRADAS */}
      <div className="screen-header">
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
          <h1 style={{ display: "flex", alignItems: "center", gap: "0.4rem", margin: 0, fontSize: "1.2rem" }}>
            <span>👥</span> Socios y Asociados
          </h1>
          <div style={{ display: "flex", gap: "0.25rem", background: "var(--paper-raised)", padding: "0.18rem", borderRadius: "8px", border: "1px solid var(--line)" }}>
            <button
              type="button"
              onClick={() => {
                setTab("socios");
                setQ("");
                setPage(1);
              }}
              style={{
                padding: "0.22rem 0.65rem",
                borderRadius: "6px",
                border: "none",
                fontSize: "0.8rem",
                fontWeight: 700,
                cursor: "pointer",
                background: tab === "socios" ? "var(--primary, #0284c7)" : "transparent",
                color: tab === "socios" ? "#fff" : "var(--ink-soft)",
                display: "flex",
                alignItems: "center",
                gap: "0.35rem",
              }}
            >
              <span>Padrón</span>
              <span style={{ fontSize: "0.72rem", opacity: 0.9 }}>({resultado?.total ?? "—"})</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setTab("prospectos");
                setQ("");
              }}
              style={{
                padding: "0.22rem 0.65rem",
                borderRadius: "6px",
                border: "none",
                fontSize: "0.8rem",
                fontWeight: 700,
                cursor: "pointer",
                background: tab === "prospectos" ? "#d97706" : "transparent",
                color: tab === "prospectos" ? "#fff" : "var(--ink-soft)",
                display: "flex",
                alignItems: "center",
                gap: "0.35rem",
              }}
            >
              <span>🎯 Prospectos</span>
              <span style={{ fontSize: "0.72rem", opacity: 0.9 }}>({fiadores.length})</span>
            </button>
          </div>
        </div>

        <Link to="/socios/nuevo" className="btn" style={{ fontSize: "0.78rem", padding: "0.3rem 0.75rem", fontWeight: 700 }}>
          + Nuevo socio
        </Link>
      </div>

      {error && (
        <div
          className="alert error"
          style={{
            padding: "0.35rem 0.75rem",
            fontSize: "0.82rem",
            margin: 0,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span>{error}</span>
          <button
            type="button"
            className="btn secondary"
            style={{
              padding: "0.15rem 0.5rem",
              fontSize: "0.75rem",
              fontWeight: 700,
            }}
            onClick={() => setRecargar((v) => v + 1)}
          >
            🔄 Reintentar
          </button>
        </div>
      )}

      {/* FRANJA DE KPIS COMPACTA FINTECH */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "0.5rem" }}>
        {/* TOTAL ASOCIADOS */}
        <div
          style={{
            background: tab === "socios" ? "rgba(99, 102, 241, 0.06)" : "var(--paper)",
            border: "1px solid var(--line)",
            borderLeft: "4px solid #6366f1",
            borderRadius: "8px",
            padding: "0.45rem 0.65rem",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            cursor: "pointer",
            boxShadow: tab === "socios" ? "0 0 0 2px #6366f1" : "0 1px 3px rgba(0,0,0,0.04)",
          }}
          onClick={() => {
            setTab("socios");
            setQ("");
          }}
        >
          <div>
            <span style={{ fontSize: "0.65rem", fontWeight: 700, color: "#6366f1", display: "block", letterSpacing: "0.02em" }}>
              TOTAL ASOCIADOS
            </span>
            <span style={{ fontSize: "1.08rem", fontWeight: 700, color: "var(--ink)", fontFamily: "monospace" }}>
              {resultado?.total ?? "—"}
            </span>
          </div>
          <span style={{ fontSize: "1.2rem" }}>👥</span>
        </div>

        {/* PROSPECTOS / FIADORES */}
        <div
          style={{
            background: tab === "prospectos" ? "rgba(245, 158, 11, 0.06)" : "var(--paper)",
            border: "1px solid var(--line)",
            borderLeft: "4px solid #f59e0b",
            borderRadius: "8px",
            padding: "0.45rem 0.65rem",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            cursor: "pointer",
            boxShadow: tab === "prospectos" ? "0 0 0 2px #f59e0b" : "0 1px 3px rgba(0,0,0,0.04)",
          }}
          onClick={() => {
            setTab("prospectos");
            setQ("");
          }}
        >
          <div>
            <span style={{ fontSize: "0.65rem", fontWeight: 700, color: "#d97706", display: "block", letterSpacing: "0.02em" }}>
              PROSPECTOS / FIADORES
            </span>
            <span style={{ fontSize: "1.08rem", fontWeight: 700, color: "#d97706", fontFamily: "monospace" }}>
              {fiadores.length}
            </span>
          </div>
          <span style={{ fontSize: "1.2rem" }}>🎯</span>
        </div>

        {/* BLOQUE DE PADRÓN */}
        <div
          style={{
            background: "var(--paper)",
            border: "1px solid var(--line)",
            borderLeft: "4px solid #0284c7",
            borderRadius: "8px",
            padding: "0.45rem 0.65rem",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
          }}
        >
          <div>
            <span style={{ fontSize: "0.65rem", fontWeight: 700, color: "#0284c7", display: "block", letterSpacing: "0.02em" }}>
              VISTA ACTUAL
            </span>
            <span style={{ fontSize: "1.08rem", fontWeight: 700, color: "var(--ink)", fontFamily: "monospace" }}>
              Pág {page} de {totalPaginas}
            </span>
          </div>
          <span style={{ fontSize: "1.2rem" }}>📄</span>
        </div>
      </div>

      {/* BARRA DE BÚSQUEDA COMPACTA */}
      <div className="screen-toolbar">
        <div style={{ flex: 1, minWidth: 260 }}>
          <input
            placeholder={tab === "socios" ? "🔍 Buscar por nombre, DPI o número de asociado…" : "🔍 Buscar fiador por nombre, DPI o crédito…"}
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(1);
            }}
            style={{ width: "100%", padding: "0.32rem 0.65rem", fontSize: "0.82rem", borderRadius: "6px", border: "1px solid var(--line)", background: "var(--paper-raised)", color: "var(--ink)" }}
          />
        </div>
      </div>

      {/* TABLA DE PADRÓN CON SCROLL INTERNO Y CABECERA STICKY */}
      {tab === "socios" ? (
        <>
          <div className="table-scroll-container">
            <table className="table-compact" style={{ width: "100%" }}>
              <thead>
                <tr>
                  <th style={{ width: "14%" }}>No. asociado</th>
                  <th style={{ width: "32%" }}>Nombre y Contacto</th>
                  <th style={{ width: "18%" }}>Agencia</th>
                  <th style={{ width: "14%" }}>Fecha Ingreso</th>
                  <th style={{ width: "10%", textAlign: "center" }}>Cuentas</th>
                  <th style={{ width: "12%", textAlign: "center" }}>Estado</th>
                </tr>
              </thead>
              <tbody>
                {resultado?.data.map((s) => (
                  <tr key={s.id}>
                    <td className="mono" style={{ fontWeight: 700 }}>
                      <Link to={`/socios/${s.id}`}>{s.numero_asociado}</Link>
                    </td>
                    <td>
                      <Link to={`/socios/${s.id}`} style={{ fontWeight: 600, color: "inherit", textDecoration: "none" }}>
                        {s.nombres}
                      </Link>
                      {(s.dpi || s.telefono) && (
                        <div style={{ fontSize: "0.72rem", color: "var(--ink-soft)", marginTop: "0.1rem" }}>
                          {s.dpi && <span>DPI: <span className="mono">{formatearDPI(s.dpi)}</span></span>}
                          {s.dpi && s.telefono && <span> · </span>}
                          {s.telefono && <span>Tel: <span className="mono">{s.telefono}</span></span>}
                        </div>
                      )}
                    </td>
                    <td style={{ fontSize: "0.8rem" }}>{s.agencia_nombre}</td>
                    <td className="mono" style={{ fontSize: "0.78rem" }}>{new Date(s.fecha_ingreso).toLocaleDateString("es-GT")}</td>
                    <td className="mono" style={{ textAlign: "center", fontWeight: 700 }}>{s.total_cuentas ?? 0}</td>
                    <td style={{ textAlign: "center" }}>
                      <span className={`badge ${s.estado === "ACTIVO" ? "activo" : "inactivo"}`} style={{ fontSize: "0.7rem", padding: "0.12rem 0.4rem" }}>
                        {s.estado === "ACTIVO" ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!cargando && resultado?.data.length === 0 && (
              <div className="empty" style={{ padding: "1.5rem" }}>
                {q ? `No hay socios que coincidan con "${q}".` : "Todavía no hay socios registrados."}
              </div>
            )}
          </div>

          {/* PAGINACIÓN FIJA EN PIE */}
          {resultado && resultado.total > resultado.pageSize && (
            <div className="screen-footer">
              <span style={{ color: "var(--ink-soft)" }}>
                Mostrando {resultado.data.length} de {resultado.total} socios · Pág. {page} de {totalPaginas}
              </span>
              <div style={{ display: "flex", gap: "0.4rem" }}>
                <button
                  className="btn secondary"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                  style={{ fontSize: "0.75rem", padding: "0.22rem 0.6rem" }}
                >
                  ← Anterior
                </button>
                <button
                  className="btn secondary"
                  disabled={page >= totalPaginas}
                  onClick={() => setPage((p) => p + 1)}
                  style={{ fontSize: "0.75rem", padding: "0.22rem 0.6rem" }}
                >
                  Siguiente →
                </button>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="table-scroll-container">
          <table className="table-compact" style={{ width: "100%" }}>
            <thead>
              <tr>
                <th>Fiador (Prospecto)</th>
                <th>DPI / Teléfono</th>
                <th>Dirección / Lugar</th>
                <th>Crédito que Respalda</th>
                <th>Socio Titular</th>
                <th style={{ textAlign: "center" }}>Acción</th>
              </tr>
            </thead>
            <tbody>
              {fiadores.map((f, idx) => (
                <tr key={`${f.prestamo_id}-${idx}`}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{f.nombre_fiador}</div>
                    <span className="badge" style={{ background: "#fef3c7", color: "#92400e", fontSize: "0.68rem", padding: "0.1rem 0.35rem" }}>
                      👤 Prospecto
                    </span>
                  </td>
                  <td>
                    <div className="mono" style={{ fontSize: "0.8rem" }}>
                      {formatearDPI(f.dpi_fiador || "")}
                    </div>
                    {f.telefono_fiador && (
                      <div style={{ fontSize: "0.72rem", color: "var(--ink-soft)" }}>
                        📞 {f.telefono_fiador}
                      </div>
                    )}
                  </td>
                  <td style={{ fontSize: "0.78rem", color: "var(--ink-soft)" }}>
                    {f.lugar_fiador || "—"}
                  </td>
                  <td>
                    <Link to={`/creditos/${f.prestamo_id}`} style={{ fontWeight: 600, fontSize: "0.8rem" }} className="mono">
                      {f.prestamo_codigo}
                    </Link>
                    <div style={{ fontSize: "0.72rem", color: "var(--ink-soft)" }}>
                      {formatearQuetzales(f.monto_aprobado || f.monto_solicitado)}
                    </div>
                  </td>
                  <td>
                    <Link to={`/socios/${f.socio_id}`} style={{ fontWeight: 500, fontSize: "0.8rem" }}>
                      {f.socio_nombre}
                    </Link>
                    <div style={{ fontSize: "0.72rem", color: "var(--ink-soft)" }}>
                      Asoc. <span className="mono">{f.socio_numero}</span>
                    </div>
                  </td>
                  <td style={{ textAlign: "center" }}>
                    <Link
                      to={`/socios/nuevo?nombres=${encodeURIComponent(f.nombre_fiador)}&dpi=${encodeURIComponent(f.dpi_fiador || "")}&telefono=${encodeURIComponent(f.telefono_fiador || "")}&direccion=${encodeURIComponent(f.lugar_fiador || "")}`}
                      className="btn secondary"
                      style={{
                        padding: "0.2rem 0.5rem",
                        fontSize: "0.72rem",
                        background: "#10b981",
                        color: "#fff",
                        borderColor: "#059669",
                        textDecoration: "none",
                        fontWeight: 700,
                      }}
                    >
                      + Afiliar
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!cargandoFiadores && fiadores.length === 0 && (
            <div className="empty" style={{ padding: "1.5rem" }}>
              {q ? `No hay fiadores externos que coincidan con "${q}".` : "No hay fiadores externos registrados en créditos fiduciarios."}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
```

## `frontend/src/pages/Tablero.tsx` {#frontendsrcpagestablerotsx}

```tsx
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { api, mensajeError } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { formatoQ } from "../types";
import type { ResumenDashboard } from "../types";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  Legend,
} from "recharts";

export default function Tablero() {
  const { usuario } = useAuth();
  const [resumen, setResumen] = useState<ResumenDashboard | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);
  const [reseteando, setReseteando] = useState(false);
  const [recargando, setRecargando] = useState(false);
  const [mostrarOpciones, setMostrarOpciones] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [driveConnected, setDriveConnected] = useState(false);

  const cargandoRef = useRef(false);

  function cargarResumen(silencioso = false) {
    if (cargandoRef.current) return;
    cargandoRef.current = true;
    api
      .get<ResumenDashboard>("/dashboard/resumen")
      .then(({ data }) => setResumen(data))
      .catch((err) => {
        if (!silencioso) setError(mensajeError(err));
      })
      .finally(() => {
        cargandoRef.current = false;
      });
  }

  async function verificarDrive() {
    try {
      const { data } = await api.get("/auth/me");
      setDriveConnected(!!data.driveConnected);
    } catch (e) {
      console.error("Error al verificar estado de Google Drive", e);
    }
  }

  async function handleConectarDrive() {
    try {
      const { data } = await api.get("/auth/google");
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (e) {
      alert("Error al intentar conectar con Google Drive.");
    }
  }

  // Si regresa de Google Drive con un query param, mostrar éxito
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("drive_connected") === "true") {
      alert("¡Cuenta de Google Drive vinculada exitosamente! Los respaldos en PDF se guardarán en tu nube automáticamente.");
      window.history.replaceState({}, document.title, "/");
      setDriveConnected(true);
    }
  }, []);

  // Actualización automática en tiempo real cada 30s y al recuperar foco
  useEffect(() => {
    cargarResumen();
    verificarDrive();
    const interval = setInterval(() => {
      cargarResumen(true);
    }, 30000);

    const onFocus = () => {
      if (!document.hidden) {
        cargarResumen(true);
      }
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onFocus);
    };
  }, []);

  // Cerrar menú de opciones al hacer clic afuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setMostrarOpciones(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleReset() {
    const confirmado = window.confirm(
      "⚠️ ¿Estás seguro de que deseas REINICIAR EL SISTEMA DESDE CERO?\n\n" +
      "Esta acción borrará:\n" +
      "• Todos los socios y asociados registrados\n" +
      "• Todas las cuentas de ahorro y aportaciones\n" +
      "• Toda la cartera de préstamos y contratos de plazo fijo\n" +
      "• Todos los movimientos y saldos de ventanilla y caja chica\n" +
      "• Todos los cierres y arqueos de caja\n\n" +
      "El sistema quedará completamente limpio para arrancar de nuevo."
    );
    if (!confirmado) return;

    setReseteando(true);
    setError(null);
    setMensajeExito(null);

    try {
      const { data } = await api.post<{ ok: boolean; mensaje: string }>("/sistema/reset");
      setMensajeExito(data.mensaje);
      cargarResumen(false);
    } catch (err) {
      setError(mensajeError(err));
    } finally {
      setReseteando(false);
    }
  }

  async function handleRecargarDatos() {
    const confirmado = window.confirm(
      "📥 ¿Deseas RECARGAR TODOS LOS DATOS EXISTENTES de los libros Excel?\n\n" +
      "Esta acción restaurará la base de datos oficial:\n" +
      "• 568 asociados con sus cuentas de aportaciones\n" +
      "• 65 préstamos de cartera viva con garantías y fiadores\n" +
      "• 692 certificados de ahorro a plazo fijo\n\n" +
      "Se cargarán los datos originales de los archivos Excel para continuar operando."
    );
    if (!confirmado) return;

    setRecargando(true);
    setError(null);
    setMensajeExito(null);

    try {
      const { data } = await api.post<{ ok: boolean; mensaje: string }>("/sistema/recargar-datos");
      setMensajeExito(data.mensaje);
      cargarResumen();
    } catch (err) {
      setError(mensajeError(err));
    } finally {
      setRecargando(false);
    }
  }

  if (error && !resumen) return <div className="alert error">{error}</div>;
  if (!resumen) return <p>Cargando…</p>;

  const { global, porAgencia } = resumen;
  const varias = porAgencia.length > 1;
  const puedeGestionarDatos = usuario?.rol === "ADMIN";

  return (
    <div className="dashboard-container">
      {/* Cabecera Compacta del Tablero */}
      <div className="dashboard-header">
        <div className="dashboard-title-area">
          <div style={{ display: "flex", alignItems: "center", gap: "0.55rem", flexWrap: "wrap" }}>
            <h1>Panel de Control y Operaciones</h1>
            <span className="live-badge" title="Actualización continua en tiempo real cada 10s">
              <span className="live-dot" />
              En Vivo · En Tiempo Real
            </span>
          </div>
          <p style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
            <span>COOPERATIVA MAYA INVERSIONES FUTURAS R.L. "COMIF-R.L."{varias ? " · Todas las Agencias" : ""}</span>
            {driveConnected ? (
              <span style={{ fontSize: "0.75rem", background: "rgba(16, 185, 129, 0.15)", color: "#10b981", padding: "0.2rem 0.6rem", borderRadius: "20px", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                ✅ Google Drive Conectado
              </span>
            ) : (
              <button 
                onClick={handleConectarDrive}
                style={{ fontSize: "0.75rem", background: "#4285F4", color: "#fff", border: "none", padding: "0.2rem 0.6rem", borderRadius: "20px", display: "flex", alignItems: "center", gap: "0.3rem", cursor: "pointer", fontWeight: "bold" }}
              >
                ☁️ Conectar Google Drive para Respaldos
              </button>
            )}
          </p>
        </div>

        {puedeGestionarDatos && (
          <div className="dashboard-options-dropdown" ref={dropdownRef}>
            <button
              type="button"
              className="btn secondary"
              onClick={() => setMostrarOpciones(!mostrarOpciones)}
              style={{ fontSize: "0.78rem", padding: "0.3rem 0.65rem", display: "inline-flex", alignItems: "center", gap: "0.35rem" }}
              title="Herramientas y opciones avanzadas"
            >
              ⚙️ Opciones del Sistema ▾
            </button>

            {mostrarOpciones && (
              <div className="dashboard-dropdown-menu">
                <button
                  type="button"
                  className="dashboard-dropdown-item"
                  onClick={() => {
                    setMostrarOpciones(false);
                    handleRecargarDatos();
                  }}
                  disabled={recargando || reseteando}
                >
                  <span style={{ fontSize: "1.1rem" }}>📥</span>
                  <div>
                    <div style={{ color: "#38bdf8" }}>{recargando ? "Recargando datos..." : "Recargar Datos Existentes (Excel)"}</div>
                    <div style={{ fontSize: "0.68rem", color: "var(--ink-soft)", fontWeight: 400 }}>Restaura los 568 socios, 65 préstamos y 692 PF</div>
                  </div>
                </button>

                <button
                  type="button"
                  className="dashboard-dropdown-item danger"
                  onClick={() => {
                    setMostrarOpciones(false);
                    handleReset();
                  }}
                  disabled={reseteando || recargando}
                >
                  <span style={{ fontSize: "1.1rem" }}>⚠️</span>
                  <div>
                    <div>{reseteando ? "Reiniciando..." : "Reiniciar Sistema a Cero"}</div>
                    <div style={{ fontSize: "0.68rem", opacity: 0.8, fontWeight: 400 }}>Borra registros y limpia la base de datos</div>
                  </div>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {mensajeExito && <div className="alert success" style={{ margin: "0.25rem 0", padding: "0.5rem 0.8rem", fontSize: "0.82rem" }}>{mensajeExito}</div>}
      {error && <div className="alert error" style={{ margin: "0.25rem 0", padding: "0.5rem 0.8rem", fontSize: "0.82rem" }}>{error}</div>}

      {/* Banda Superior: 8 Tarjetas KPI Financieras con Iconos y Acentos de Color */}
      <div className="dashboard-kpi-band">
        <Link to="/aportaciones" className="kpi-tile" style={{ borderLeft: "3px solid #059669" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span className="kpi-tile-label">Aportaciones Capital</span>
            <span style={{ fontSize: "0.85rem" }}>🏛️</span>
          </div>
          <span className="kpi-tile-value" style={{ color: "#059669" }}>
            {formatoQ(global.aportaciones?.saldo ?? 11600)}
          </span>
          <span className="kpi-tile-sub">{global.aportaciones?.count ?? 117} socios aportantes</span>
        </Link>

        <Link to="/ahorros/corriente" className="kpi-tile" style={{ borderLeft: "3px solid #0284c7" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span className="kpi-tile-label">Ahorro Corriente</span>
            <span style={{ fontSize: "0.85rem" }}>💰</span>
          </div>
          <span className="kpi-tile-value" style={{ color: "var(--accent)" }}>{formatoQ(global.ahorroCorriente)}</span>
          <span className="kpi-tile-sub">Disponible a la vista</span>
        </Link>

        <Link to="/ahorros/plazo-fijo" className="kpi-tile" style={{ borderLeft: "3px solid #7c3aed" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span className="kpi-tile-label">Plazo Fijo (DPF)</span>
            <span style={{ fontSize: "0.85rem" }}>🔒</span>
          </div>
          <span className="kpi-tile-value" style={{ color: "#7c3aed" }}>
            {global.plazoFijo && global.plazoFijo.monto > 0 ? formatoQ(global.plazoFijo.monto) : "Kardex PF"}
          </span>
          <span className="kpi-tile-sub">{global.plazoFijo?.count ?? 692} certificados activos</span>
        </Link>

        {usuario?.rol !== "CAJERO" ? (
          <Link to="/creditos" className="kpi-tile" style={{ borderLeft: "3px solid #38bdf8" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span className="kpi-tile-label">Cartera de Crédito</span>
              <span style={{ fontSize: "0.85rem" }}>💼</span>
            </div>
            <span className="kpi-tile-value" style={{ color: "#0284c7" }}>
              {formatoQ(global.carteraPrestamos?.saldo ?? 15210193.13)}
            </span>
            <span className="kpi-tile-sub">{global.carteraPrestamos?.count ?? 65} préstamos activos</span>
          </Link>
        ) : (
          <Link to="/ahorros/programado" className="kpi-tile" style={{ borderLeft: "3px solid #0891b2" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span className="kpi-tile-label">Ahorro Programado</span>
              <span style={{ fontSize: "0.85rem" }}>📅</span>
            </div>
            <span className="kpi-tile-value">{formatoQ(global.ahorroProgramado)}</span>
            <span className="kpi-tile-sub">Cuotas pactadas</span>
          </Link>
        )}

        {usuario?.rol !== "PROMOTOR" && (
          <Link to="/caja-chica" className="kpi-tile" style={{ borderLeft: "3px solid #f59e0b" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span className="kpi-tile-label">Caja Chica</span>
              <span style={{ fontSize: "0.85rem" }}>☕</span>
            </div>
            <span className="kpi-tile-value" style={{ color: "#d97706" }}>{formatoQ(global.cajaChica)}</span>
            <span className="kpi-tile-sub">Fondo disponible</span>
          </Link>
        )}

        <Link to="/auxiliar-caja" className="kpi-tile" style={{ borderLeft: "3px solid #10b981" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span className="kpi-tile-label">Cuotas de Ingreso</span>
            <span style={{ fontSize: "0.85rem" }}>🎫</span>
          </div>
          <span className="kpi-tile-value" style={{ color: "#10b981" }}>
            {formatoQ(global.cuotasIngreso?.monto ?? 0)}
          </span>
          <span className="kpi-tile-sub">{global.cuotasIngreso?.count ?? 0} registradas en caja</span>
        </Link>

        <Link to="/ahorros/infanto-juvenil" className="kpi-tile" style={{ borderLeft: "3px solid #ec4899" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span className="kpi-tile-label">Ahorro Infantil</span>
            <span style={{ fontSize: "0.85rem" }}>👶</span>
          </div>
          <span className="kpi-tile-value" style={{ color: "#ec4899" }}>{formatoQ(global.ahorroInfantoJuvenil)}</span>
          <span className="kpi-tile-sub">Infanto juvenil</span>
        </Link>

        <Link to="/socios" className="kpi-tile" style={{ borderLeft: "3px solid #6366f1" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span className="kpi-tile-label">Membresía / Socios</span>
            <span style={{ fontSize: "0.85rem" }}>👥</span>
          </div>
          <span className="kpi-tile-value mono" style={{ color: "#6366f1" }}>{global.totalSocios}</span>
          <span className="kpi-tile-sub">{global.movimientosHoy} mov. registrados hoy</span>
        </Link>
      </div>

      {/* Panel Panorámico de Monitoreo Estratégico & Analítica Financiera */}
      <div className="dashboard-lower-grid">
        {(usuario?.rol === "SUPERVISOR" || usuario?.rol === "GERENCIA" || usuario?.rol === "ADMIN") && (
          <PanelGraficaServicios agenciaIdInicial={usuario?.agenciaId ?? undefined} />
        )}

        {/* Desglose por Agencia (si aplica más de 1 agencia) */}
        {varias && (
          <div className="dashboard-panel-card" style={{ padding: "0.65rem 0.85rem", marginTop: "0.25rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.35rem" }}>
              <h3 style={{ margin: 0, fontSize: "0.84rem", fontWeight: 700 }}>🏢 Estado en Vivo por Agencia</h3>
              <span style={{ fontSize: "0.68rem", color: "var(--ink-soft)" }}>{porAgencia.length} agencias</span>
            </div>
            <div className="table-wrap" style={{ maxHeight: "140px", overflowY: "auto", border: "1px solid var(--line)", borderRadius: "6px" }}>
              <table style={{ fontSize: "0.76rem", width: "100%", margin: 0 }}>
                <thead>
                  <tr style={{ background: "var(--paper-raised)" }}>
                    <th style={{ padding: "3px 6px" }}>Agencia</th>
                    <th style={{ padding: "3px 6px", textAlign: "right" }}>Caja chica</th>
                    <th style={{ padding: "3px 6px", textAlign: "right" }}>Ahorro corriente</th>
                    <th style={{ padding: "3px 6px", textAlign: "right" }}>Cartera Crédito</th>
                    <th style={{ padding: "3px 6px", textAlign: "center" }}>Socios</th>
                  </tr>
                </thead>
                <tbody>
                  {porAgencia.map((a) => (
                    <tr key={a.agenciaId}>
                      <td style={{ padding: "3px 6px", fontWeight: 600 }}>{a.agenciaNombre}</td>
                      <td className="mono" style={{ padding: "3px 6px", textAlign: "right" }}>{formatoQ(a.cajaChica.saldo)}</td>
                      <td className="mono" style={{ padding: "3px 6px", textAlign: "right", color: "var(--accent)" }}>{formatoQ(a.ahorroCorriente.saldoTotal)}</td>
                      <td className="mono" style={{ padding: "3px 6px", textAlign: "right", color: "#0284c7" }}>{formatoQ(a.carteraPrestamos?.saldo ?? 0)}</td>
                      <td className="mono" style={{ padding: "3px 6px", textAlign: "center" }}>{a.totalSocios}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

interface ServicioItem {
  categoria: string;
  producto: string;
  modulo?: string;
  flujo: "INGRESO" | "EGRESO";
  label: string;
  icon: string;
  cantidad: number;
  totalMonto: number;
  porcentaje: number;
}

interface PuntoTendencia {
  fecha: string;
  label: string;
  ingresos: number;
  egresos: number;
  neto: number;
  operaciones: number;
}

interface AnaliticaResponse {
  periodo: "dia" | "semana" | "mes" | "anio";
  totalOperaciones: number;
  volumenTotal: number;
  totalIngresos: number;
  totalEgresos: number;
  flujoNeto: number;
  operacionesIngreso: number;
  operacionesEgreso: number;
  servicioTop: ServicioItem | null;
  servicios: ServicioItem[];
  tendenciaTemporal: PuntoTendencia[];
}

function PanelGraficaServicios({ agenciaIdInicial }: { agenciaIdInicial?: string }) {
  const { usuario } = useAuth();
  const puedeElegirAgencia = usuario?.rol === "GERENCIA";
  const [agencias, setAgencias] = useState<any[]>([]);
  const [agenciaId, setAgenciaId] = useState(agenciaIdInicial || usuario?.agenciaId || "");
  const [periodo, setPeriodo] = useState<"dia" | "semana" | "mes" | "anio">("mes");
  const [filtroCuenta, setFiltroCuenta] = useState<string>("TODOS");
  const [modoVista, setModoVista] = useState<"BALANCE" | "TENDENCIA">("BALANCE");
  const [datos, setDatos] = useState<AnaliticaResponse | null>(null);
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    if (puedeElegirAgencia) {
      api.get("/agencias").then(({ data }) => {
        setAgencias(data);
      });
    }
  }, [puedeElegirAgencia]);

  function cargarAnalitica(silencioso = false) {
    if (!silencioso) setCargando(true);
    api
      .get<AnaliticaResponse>("/caja-auxiliar/analitica-servicios", {
        params: { agenciaId: agenciaId || undefined, periodo },
      })
      .then(({ data }) => setDatos(data))
      .catch(() => {})
      .finally(() => {
        if (!silencioso) setCargando(false);
      });
  }

  useEffect(() => {
    cargarAnalitica(false);
    const interval = setInterval(() => {
      cargarAnalitica(true);
    }, 10000);

    const onFocus = () => {
      if (!document.hidden) {
        cargarAnalitica(true);
      }
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onFocus);
    };
  }, [agenciaId, periodo]);

  const periodoLabel = periodo === "dia" ? "Día actual" : periodo === "semana" ? "Últimos 7 días" : periodo === "mes" ? "Últimos 30 días" : "Año actual";

  // Filtrado específico por producto / cuenta
  const serviciosFiltrados = !datos
    ? []
    : filtroCuenta === "TODOS"
      ? datos.servicios
      : datos.servicios.filter((s) => s.producto === filtroCuenta);

  const totalOperacionesFiltro = serviciosFiltrados.reduce((acc, s) => acc + s.cantidad, 0);
  const volumenTotalFiltro = serviciosFiltrados.reduce((acc, s) => acc + s.totalMonto, 0);
  const totalIngresosFiltro = serviciosFiltrados.filter((s) => s.flujo === "INGRESO").reduce((acc, s) => acc + s.totalMonto, 0);
  const totalEgresosFiltro = serviciosFiltrados.filter((s) => s.flujo === "EGRESO").reduce((acc, s) => acc + s.totalMonto, 0);
  const opIngresosFiltro = serviciosFiltrados.filter((s) => s.flujo === "INGRESO").reduce((acc, s) => acc + s.cantidad, 0);
  const opEgresosFiltro = serviciosFiltrados.filter((s) => s.flujo === "EGRESO").reduce((acc, s) => acc + s.cantidad, 0);
  const flujoNetoFiltro = totalIngresosFiltro - totalEgresosFiltro;
  const servicioTopFiltro = serviciosFiltrados[0] ?? null;

  // Cuentas disponibles con sus conteos
  const CUENTAS_OPCIONES = [
    { id: "TODOS", label: "Consolidado General", icon: "🌐" },
    { id: "AHORRO_CORRIENTE", label: "Ahorro Corriente", icon: "💰" },
    { id: "AHORRO_PROGRAMADO", label: "Ahorro Programado", icon: "📅" },
    { id: "AHORRO_INFANTIL", label: "Ahorro Infantil", icon: "🧒" },
    { id: "AHORRO_SOBRE_PRESTAMO", label: "Ahorro s/Préstamo", icon: "🛡️" },
    { id: "PLAZO_FIJO", label: "Plazo Fijo (DPF)", icon: "🔒" },
    { id: "APORTACIONES", label: "Aportaciones", icon: "🏛️" },
    { id: "CREDITOS", label: "Cartera Créditos", icon: "💼" },
    { id: "AGENTE_BI", label: "Agente BI & Servicios", icon: "🏦" },
    { id: "CAJA_CHICA", label: "Caja Chica", icon: "☕" },
    { id: "VENTANILLA_TESORERIA", label: "Tesorería & Ventanilla", icon: "💵" },
  ];

  return (
    <div className="dashboard-panel-card" style={{ borderTop: "3px solid #0284c7" }}>
      {/* Encabezado Superior: Título, Filtros Temporales y Selector de Modo */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.5rem" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", flexWrap: "wrap" }}>
            <h2 style={{ margin: 0, fontSize: "0.98rem", fontWeight: 700 }}>📊 Inteligencia y Analítica Financiera por Cuenta</h2>
            <span className="live-badge" style={{ fontSize: "0.68rem", padding: "0.15rem 0.45rem" }}>
              <span className="live-dot" /> En Vivo
            </span>
          </div>
          <p style={{ margin: "0.15rem 0 0", fontSize: "0.74rem", color: "var(--ink-soft)" }}>
            Desglose específico de entradas, salidas y flujo monetario ({periodoLabel})
          </p>
        </div>

        <div style={{ display: "flex", gap: "0.4rem", alignItems: "center", flexWrap: "wrap" }}>
          {puedeElegirAgencia && agencias.length > 0 && (
            <select value={agenciaId} onChange={(e) => setAgenciaId(e.target.value)} style={{ maxWidth: 170, fontSize: "0.76rem", padding: "0.25rem 0.45rem" }}>
              <option value="">🏢 Todas las Agencias</option>
              {agencias.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.nombre}
                </option>
              ))}
            </select>
          )}

          {/* Conmutador de Modo Dual */}
          <div style={{ display: "inline-flex", background: "var(--mono-bg)", borderRadius: "6px", padding: "0.15rem", border: "1px solid var(--line)" }}>
            <button
              type="button"
              className={`btn btn-xs ${modoVista === "BALANCE" ? "" : "secondary"}`}
              style={{ fontSize: "0.74rem", padding: "0.2rem 0.5rem", borderRadius: "4px" }}
              onClick={() => setModoVista("BALANCE")}
              title="Ver balance de entradas vs salidas y ranking de movimientos"
            >
              📊 Balance & Distribución
            </button>
            <button
              type="button"
              className={`btn btn-xs ${modoVista === "TENDENCIA" ? "" : "secondary"}`}
              style={{ fontSize: "0.74rem", padding: "0.2rem 0.5rem", borderRadius: "4px" }}
              onClick={() => setModoVista("TENDENCIA")}
              title="Ver evolución cronológica de captaciones y retiros"
            >
              📈 Tendencia Temporal
            </button>
          </div>

          {/* Filtros de Período */}
          <div style={{ display: "inline-flex", background: "var(--mono-bg)", borderRadius: "6px", padding: "0.15rem", border: "1px solid var(--line)" }}>
            <button
              type="button"
              className={`btn btn-xs ${periodo === "dia" ? "" : "secondary"}`}
              style={{ fontSize: "0.74rem", padding: "0.2rem 0.45rem", borderRadius: "4px" }}
              onClick={() => setPeriodo("dia")}
            >
              Día
            </button>
            <button
              type="button"
              className={`btn btn-xs ${periodo === "semana" ? "" : "secondary"}`}
              style={{ fontSize: "0.74rem", padding: "0.2rem 0.45rem", borderRadius: "4px" }}
              onClick={() => setPeriodo("semana")}
            >
              Semana
            </button>
            <button
              type="button"
              className={`btn btn-xs ${periodo === "mes" ? "" : "secondary"}`}
              style={{ fontSize: "0.74rem", padding: "0.2rem 0.45rem", borderRadius: "4px" }}
              onClick={() => setPeriodo("mes")}
            >
              Mes
            </button>
            <button
              type="button"
              className={`btn btn-xs ${periodo === "anio" ? "" : "secondary"}`}
              style={{ fontSize: "0.74rem", padding: "0.2rem 0.45rem", borderRadius: "4px" }}
              onClick={() => setPeriodo("anio")}
            >
              Año
            </button>
          </div>
        </div>
      </div>

      {/* Pestañas de Selección Específica por Cuenta y Producto */}
      <div style={{ display: "flex", gap: "0.3rem", flexWrap: "wrap", borderBottom: "1px solid var(--line)", paddingBottom: "0.4rem" }}>
        {CUENTAS_OPCIONES.map((cta) => {
          const isSelected = filtroCuenta === cta.id;
          const count = !datos
            ? 0
            : cta.id === "TODOS"
              ? datos.totalOperaciones
              : datos.servicios.filter((s) => s.producto === cta.id).reduce((acc, s) => acc + s.cantidad, 0);

          return (
            <button
              key={cta.id}
              type="button"
              className={`btn btn-xs ${isSelected ? "" : "secondary"}`}
              style={{
                fontSize: "0.72rem",
                padding: "0.2rem 0.5rem",
                display: "inline-flex",
                alignItems: "center",
                gap: "0.3rem",
                borderRadius: "5px",
                borderColor: isSelected ? "#0284c7" : undefined,
              }}
              onClick={() => setFiltroCuenta(cta.id)}
            >
              <span>{cta.icon}</span>
              <span>{cta.label}</span>
              {count > 0 && (
                <span
                  style={{
                    background: isSelected ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.06)",
                    borderRadius: "10px",
                    padding: "0.05rem 0.35rem",
                    fontSize: "0.64rem",
                    fontWeight: 700,
                  }}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {cargando && <div style={{ fontSize: "0.78rem", color: "var(--ink-soft)", padding: "0.5rem" }}>Cargando analítica en vivo...</div>}

      {!cargando && (!datos || serviciosFiltrados.length === 0) && (
        <div className="alert info" style={{ margin: "0.5rem 0", padding: "0.5rem 0.75rem", fontSize: "0.78rem" }}>
          No hay movimientos registrados para esta cuenta durante el período seleccionado ({periodoLabel}).
        </div>
      )}

      {datos && serviciosFiltrados.length > 0 && (
        <>
          {/* Cintillo Superior de 4 KPIs: Entradas, Salidas, Flujo Neto y Mayor Demanda */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "0.55rem" }}>
            <div className="kpi-tile" style={{ minHeight: 50, padding: "0.4rem 0.65rem", borderLeft: "4px solid #10b981" }}>
              <span className="kpi-tile-label" style={{ color: "#059669" }}>🟢 Entradas / Depósitos</span>
              <span className="kpi-tile-value mono" style={{ color: "#059669", fontSize: "0.98rem", margin: "0.1rem 0" }}>
                {formatoQ(totalIngresosFiltro)}
              </span>
              <span className="kpi-tile-sub" style={{ fontSize: "0.68rem" }}>{opIngresosFiltro} transacciones</span>
            </div>

            <div className="kpi-tile" style={{ minHeight: 50, padding: "0.4rem 0.65rem", borderLeft: "4px solid #ef4444" }}>
              <span className="kpi-tile-label" style={{ color: "#dc2626" }}>🔴 Salidas / Retiros</span>
              <span className="kpi-tile-value mono" style={{ color: "#dc2626", fontSize: "0.98rem", margin: "0.1rem 0" }}>
                {formatoQ(totalEgresosFiltro)}
              </span>
              <span className="kpi-tile-sub" style={{ fontSize: "0.68rem" }}>{opEgresosFiltro} transacciones</span>
            </div>

            <div className="kpi-tile" style={{ minHeight: 50, padding: "0.4rem 0.65rem", borderLeft: `4px solid ${flujoNetoFiltro >= 0 ? "#0284c7" : "#f59e0b"}` }}>
              <span className="kpi-tile-label">⚖️ Flujo Neto del Período</span>
              <span className="kpi-tile-value mono" style={{ color: flujoNetoFiltro >= 0 ? "#0284c7" : "#d97706", fontSize: "0.98rem", margin: "0.1rem 0" }}>
                {flujoNetoFiltro >= 0 ? "+" : ""}{formatoQ(flujoNetoFiltro)}
              </span>
              <span className="kpi-tile-sub" style={{ fontSize: "0.68rem" }}>
                {flujoNetoFiltro >= 0 ? "Superávit neto de captación" : "Déficit / Colocación neta"}
              </span>
            </div>

            <div className="kpi-tile accent" style={{ minHeight: 50, padding: "0.4rem 0.65rem", borderLeft: "4px solid #f59e0b" }}>
              <span className="kpi-tile-label">🏆 Mayor Operación</span>
              <span className="kpi-tile-value" style={{ fontSize: "0.85rem", margin: "0.1rem 0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {servicioTopFiltro ? `${servicioTopFiltro.icon} ${servicioTopFiltro.label}` : "—"}
              </span>
              <span className="kpi-tile-sub" style={{ fontSize: "0.68rem" }}>
                {servicioTopFiltro
                  ? `${servicioTopFiltro.cantidad} op. (${totalOperacionesFiltro > 0 ? Math.round((servicioTopFiltro.cantidad / totalOperacionesFiltro) * 1000) / 10 : 0}%)`
                  : ""}
              </span>
            </div>
          </div>

          {/* MODO 1: BALANCE & DISTRIBUCIÓN (3 Columnas Panorámicas) */}
          {modoVista === "BALANCE" && (
            <div className="dashboard-charts-grid">
              {/* Card 1: Dona de Distribución con Tooltip Enriquecido */}
              <div style={{ background: "var(--mono-bg)", borderRadius: "8px", border: "1px solid var(--line)", padding: "0.6rem 0.75rem", display: "flex", flexDirection: "column" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.35rem" }}>
                  <h4 style={{ margin: 0, fontSize: "0.78rem", color: "var(--ink)", fontWeight: 700 }}>
                    🍩 Distribución de Operaciones
                  </h4>
                  <span style={{ fontSize: "0.68rem", color: "var(--ink-soft)" }}>{totalOperacionesFiltro} ops.</span>
                </div>
                <div style={{ width: "100%", height: 185, position: "relative" }}>
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie
                        data={serviciosFiltrados.map((s) => ({
                          ...s,
                          pctMonto: volumenTotalFiltro > 0 ? Math.round((s.totalMonto / volumenTotalFiltro) * 1000) / 10 : 0,
                        }))}
                        dataKey="cantidad"
                        nameKey="label"
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={75}
                        paddingAngle={3}
                      >
                        {serviciosFiltrados.map((s, index) => {
                          const isIngreso = s.flujo === "INGRESO";
                          const baseColors = isIngreso
                            ? ["#10b981", "#059669", "#047857", "#065f46", "#34d399"]
                            : ["#ef4444", "#dc2626", "#b91c1c", "#f97316", "#ea580c"];
                          return <Cell key={`cell-${index}`} fill={baseColors[index % baseColors.length]} />;
                        })}
                      </Pie>
                      <RechartsTooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const d = payload[0].payload as ServicioItem & { pctMonto: number };
                            const isIngreso = d.flujo === "INGRESO";
                            return (
                              <div style={{ background: "rgba(15, 23, 42, 0.94)", color: "#fff", padding: "0.45rem 0.65rem", borderRadius: "6px", fontSize: "0.74rem", boxShadow: "0 4px 12px rgba(0,0,0,0.3)" }}>
                                <div style={{ fontWeight: 700, marginBottom: "0.2rem", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                                  <span>{d.icon}</span> <span>{d.label}</span>
                                </div>
                                <div style={{ color: isIngreso ? "#34d399" : "#f87171", fontSize: "0.7rem", fontWeight: 700 }}>
                                  {isIngreso ? "🟢 Entrada / Depósito" : "🔴 Salida / Retiro"}
                                </div>
                                <div style={{ marginTop: "0.2rem" }}>
                                  💵 <strong>{formatoQ(d.totalMonto)}</strong> ({d.pctMonto}% del volumen)
                                </div>
                                <div style={{ color: "#94a3b8", fontSize: "0.68rem" }}>
                                  ⚡ {d.cantidad} operaciones ({d.porcentaje}% de demanda)
                                </div>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Card 2: Participación Proporcional en Volumen (%) con Tooltip en Quetzales */}
              <div style={{ background: "var(--mono-bg)", borderRadius: "8px", border: "1px solid var(--line)", padding: "0.6rem 0.75rem", display: "flex", flexDirection: "column" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.35rem" }}>
                  <h4 style={{ margin: 0, fontSize: "0.78rem", color: "var(--ink)", fontWeight: 700 }}>
                    📊 Participación por Volumen (%)
                  </h4>
                  <span className="mono" style={{ fontSize: "0.68rem", color: "#0284c7", fontWeight: 700 }}>
                    Total: {formatoQ(volumenTotalFiltro)}
                  </span>
                </div>
                <div style={{ width: "100%", height: 185 }}>
                  <ResponsiveContainer>
                    <BarChart
                      data={serviciosFiltrados.map((s) => ({
                        ...s,
                        pctMonto: volumenTotalFiltro > 0 ? Math.round((s.totalMonto / volumenTotalFiltro) * 1000) / 10 : 0,
                      }))}
                      layout="vertical"
                      margin={{ left: 10, right: 25, top: 5, bottom: 5 }}
                    >
                      <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 9 }} tickFormatter={(val) => `${val}%`} />
                      <YAxis dataKey="label" type="category" width={115} tick={{ fontSize: 9 }} />
                      <RechartsTooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const d = payload[0].payload as ServicioItem & { pctMonto: number };
                            const isIngreso = d.flujo === "INGRESO";
                            return (
                              <div style={{ background: "rgba(15, 23, 42, 0.94)", color: "#fff", padding: "0.45rem 0.65rem", borderRadius: "6px", fontSize: "0.74rem", boxShadow: "0 4px 12px rgba(0,0,0,0.3)" }}>
                                <div style={{ fontWeight: 700, marginBottom: "0.2rem", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                                  <span>{d.icon}</span> <span>{d.label}</span>
                                </div>
                                <div style={{ color: isIngreso ? "#34d399" : "#f87171", fontSize: "0.7rem", fontWeight: 700 }}>
                                  {isIngreso ? "🟢 Entrada / Depósito" : "🔴 Salida / Retiro"}
                                </div>
                                <div style={{ marginTop: "0.2rem" }}>
                                  💵 Monto exacto: <strong>{formatoQ(d.totalMonto)}</strong>
                                </div>
                                <div style={{ color: "#38bdf8", fontSize: "0.7rem" }}>
                                  📊 Participación: <strong>{d.pctMonto}%</strong>
                                </div>
                                <div style={{ color: "#94a3b8", fontSize: "0.68rem" }}>
                                  ⚡ Transacciones: {d.cantidad} op. ({d.porcentaje}%)
                                </div>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Bar dataKey="pctMonto" radius={[0, 4, 4, 0]}>
                        {serviciosFiltrados.map((s, index) => {
                          const fill = s.flujo === "INGRESO" ? "#10b981" : "#ef4444";
                          return <Cell key={`cell-bar-${index}`} fill={fill} />;
                        })}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Card 3: Ranking y Desglose Detallado con Porcentajes y Quetzales */}
              <div style={{ background: "var(--mono-bg)", borderRadius: "8px", border: "1px solid var(--line)", padding: "0.6rem 0.75rem", display: "flex", flexDirection: "column" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.4rem" }}>
                  <h4 style={{ margin: 0, fontSize: "0.78rem", color: "var(--ink)", fontWeight: 700 }}>
                    📋 Desglose de Movimientos
                  </h4>
                  <span style={{ fontSize: "0.68rem", color: "var(--ink-soft)" }}>Porcentaje & Monto</span>
                </div>
                <div style={{ maxHeight: 185, overflowY: "auto", display: "flex", flexDirection: "column", gap: "0.35rem", paddingRight: "0.2rem" }}>
                  {serviciosFiltrados.map((s, idx) => {
                    const pctOp = totalOperacionesFiltro > 0 ? Math.round((s.cantidad / totalOperacionesFiltro) * 1000) / 10 : 0;
                    const pctVol = volumenTotalFiltro > 0 ? Math.round((s.totalMonto / volumenTotalFiltro) * 1000) / 10 : 0;
                    const isIngreso = s.flujo === "INGRESO";
                    const color = isIngreso ? "#10b981" : "#ef4444";

                    return (
                      <div
                        key={s.categoria || idx}
                        style={{
                          background: "var(--paper-raised)",
                          border: "1px solid var(--line)",
                          borderRadius: "6px",
                          padding: "0.3rem 0.45rem",
                          display: "flex",
                          flexDirection: "column",
                          gap: "0.15rem",
                        }}
                        title={`${s.label}: ${formatoQ(s.totalMonto)} (${pctVol}% volumen / ${s.cantidad} transacciones - ${pctOp}% de demanda)`}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.72rem" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.3rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            <span
                              style={{
                                fontSize: "0.62rem",
                                padding: "0.05rem 0.25rem",
                                borderRadius: "3px",
                                fontWeight: 700,
                                background: isIngreso ? "rgba(16, 185, 129, 0.12)" : "rgba(239, 68, 68, 0.12)",
                                color: color,
                              }}
                            >
                              {isIngreso ? "🟢 ENT" : "🔴 SAL"}
                            </span>
                            <span>{s.icon}</span>
                            <span style={{ fontWeight: 600, color: "var(--ink)" }}>{s.label}</span>
                          </div>
                          <span className="mono" style={{ fontWeight: 700, color: color }}>
                            {formatoQ(s.totalMonto)}
                          </span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                          <div style={{ flex: 1, background: "rgba(0,0,0,0.06)", height: 4, borderRadius: 2, overflow: "hidden" }}>
                            <div style={{ width: `${Math.min(pctVol, 100)}%`, background: color, height: "100%", borderRadius: 2 }} />
                          </div>
                          <span style={{ fontSize: "0.64rem", color: "var(--ink-soft)", minWidth: "75px", textAlign: "right" }}>
                            {pctVol}% vol. ({s.cantidad} op.)
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* MODO 2: TENDENCIA TEMPORAL (Evolución por Días/Semanas/Meses) */}
          {modoVista === "TENDENCIA" && (
            <div style={{ display: "grid", gridTemplateColumns: "2.1fr 1fr", gap: "0.65rem", marginTop: "0.45rem" }}>
              {/* Gráfica de Área de Tendencia Temporal */}
              <div style={{ background: "var(--mono-bg)", borderRadius: "8px", border: "1px solid var(--line)", padding: "0.6rem 0.75rem", display: "flex", flexDirection: "column" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.35rem" }}>
                  <h4 style={{ margin: 0, fontSize: "0.78rem", color: "var(--ink)", fontWeight: 700 }}>
                    📈 Evolución Cronológica: Entradas (Verde) vs Salidas (Rojo)
                  </h4>
                  <span style={{ fontSize: "0.68rem", color: "var(--ink-soft)" }}>Curva de actividad diaria</span>
                </div>
                <div style={{ width: "100%", height: 185 }}>
                  <ResponsiveContainer>
                    <AreaChart data={datos.tendenciaTemporal} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
                      <defs>
                        <linearGradient id="gradIngresos" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                        </linearGradient>
                        <linearGradient id="gradEgresos" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#ef4444" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                      <XAxis dataKey="label" tick={{ fontSize: 9.5 }} />
                      <YAxis tick={{ fontSize: 9.5 }} tickFormatter={(val) => `Q${val >= 1000 ? `${Math.round(val / 1000)}k` : val}`} />
                      <RechartsTooltip formatter={(val: any) => [formatoQ(Number(val) || 0)]} labelFormatter={(l) => `Fecha: ${l}`} />
                      <Legend wrapperStyle={{ fontSize: "0.7rem", paddingTop: "0.2rem" }} />
                      <Area type="monotone" dataKey="ingresos" name="🟢 Entradas / Depósitos" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#gradIngresos)" />
                      <Area type="monotone" dataKey="egresos" name="🔴 Salidas / Retiros" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#gradEgresos)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Panel de Resumen de Tendencia Temporal */}
              <div style={{ background: "var(--mono-bg)", borderRadius: "8px", border: "1px solid var(--line)", padding: "0.6rem 0.75rem", display: "flex", flexDirection: "column" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.4rem" }}>
                  <h4 style={{ margin: 0, fontSize: "0.78rem", color: "var(--ink)", fontWeight: 700 }}>
                    🎯 Radiografía de Flujo
                  </h4>
                  <span style={{ fontSize: "0.68rem", color: "var(--ink-soft)" }}>Por fecha</span>
                </div>
                <div style={{ maxHeight: 185, overflowY: "auto", display: "flex", flexDirection: "column", gap: "0.35rem", paddingRight: "0.2rem" }}>
                  {datos.tendenciaTemporal.slice(-6).reverse().map((t) => (
                    <div
                      key={t.fecha}
                      style={{
                        background: "var(--paper-raised)",
                        border: "1px solid var(--line)",
                        borderRadius: "6px",
                        padding: "0.3rem 0.45rem",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        fontSize: "0.72rem",
                      }}
                    >
                      <div>
                        <span style={{ fontWeight: 700, color: "var(--ink)" }}>📅 {t.fecha}</span>
                        <div style={{ fontSize: "0.64rem", color: "var(--ink-soft)" }}>{t.operaciones} transacciones</div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: "0.68rem", color: "#059669", fontWeight: 700 }}>+{formatoQ(t.ingresos)}</div>
                        <div style={{ fontSize: "0.68rem", color: "#dc2626", fontWeight: 700 }}>-{formatoQ(t.egresos)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

```

## `frontend/src/pages/LibroArqueoMensual.tsx` {#frontendsrcpageslibroarqueomensualtsx}

```tsx
import { useEffect, useState } from "react";
import { api, mensajeError } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { formatoQ } from "../types";
import type { Agencia } from "../types";

interface DiaArqueo {
  id: string;
  fecha: string;
  estado: string;
  saldo_inicial: number;
  saldo_final: number | null;
  saldo_esperado?: number;
  flujo_neto?: number;
  total_ingresos: number;
  total_egresos: number;
  total_contado: number | null;
  diferencia: number | null;
  abierto_por_nombre: string | null;
  cerrado_por_nombre: string | null;
  total_movimientos: number;
}

interface ArqueoMensualResponse {
  mes: string;
  resumen: {
    totalDiasOperados: number;
    diasCuadrados: number;
    diasConDiferencia: number;
    totalSobrante: number;
    totalFaltante: number;
    totalMovimientosMes: number;
    totalIngresosMes: number;
    totalEgresosMes: number;
    totalFlujoNetoMes?: number;
  };
  dias: DiaArqueo[];
}

export default function LibroArqueoMensual() {
  const { usuario } = useAuth();
  const puedeElegirAgencia = usuario?.rol === "GERENCIA";

  const [agencias, setAgencias] = useState<Agencia[]>([]);
  const [agenciaId, setAgenciaId] = useState(usuario?.agenciaId ?? "");
  const [mes, setMes] = useState(() => new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [datos, setDatos] = useState<ArqueoMensualResponse | null>(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Campos Notariales / Estatutarios del Acta
  const [añoStr, mesNum] = mes.split("-");
  const [numeroActa, setNumeroActa] = useState(`CV-${mesNum}-${añoStr}`);
  const [horaInicio, setHoraInicio] = useState("17:00");
  const [horaFin, setHoraFin] = useState("18:15");
  const [lugarMunicipio, setLugarMunicipio] = useState("San Gaspar Chajul");
  const [nombrePresidente, setNombrePresidente] = useState("Jacinto Asicona Brito");
  const [nombreSecretaria, setNombreSecretaria] = useState("Elena Matom Caba");
  const [nombreVocal, setNombreVocal] = useState("Mateo Caba Laynez");
  const [nombreCajero, setNombreCajero] = useState("Ana Elizabeth Pérez");
  const [observaciones, setObservaciones] = useState(
    "Durante la revisión y cotejo documental del presente período, las operaciones de caja se encontraron debidamente soportadas con sus comprobantes y boletas autorizadas. Los saldos en libros coincidieron con el efectivo contado, determinando que los registros de ingresos y egresos fueron llevados con exactitud y estricto apego a los estatutos cooperativos.",
  );
  const [mostrarConfiguracion, setMostrarConfiguracion] = useState(false);

  useEffect(() => {
    setNumeroActa(`CV-${mesNum}-${añoStr}`);
  }, [mes, mesNum, añoStr]);

  useEffect(() => {
    api.get<Agencia[]>("/agencias").then(({ data }) => {
      setAgencias(data);
      if (!agenciaId && data.length > 0) {
        setAgenciaId(data[0].id);
      }
    });
  }, [agenciaId]);

  function cargar() {
    if (!agenciaId) return;
    setCargando(true);
    setError(null);
    api
      .get<ArqueoMensualResponse>("/caja-auxiliar/arqueos-mes", {
        params: { agenciaId, mes },
      })
      .then(({ data }) => {
        setDatos(data);
        if (data.dias.length > 0) {
          const primerCajero = data.dias[0]?.cerrado_por_nombre || data.dias[0]?.abierto_por_nombre;
          if (primerCajero && nombreCajero === "Ana Elizabeth Pérez") {
            setNombreCajero(primerCajero);
          }
        }
      })
      .catch((err) => setError(mensajeError(err)))
      .finally(() => setCargando(false));
  }

  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agenciaId, mes]);

  const agenciaNombre = agencias.find((a) => a.id === agenciaId)?.nombre ?? "Agencia Chajul";

  const fechaMesObj = new Date(Number(añoStr), Number(mesNum) - 1, 1);
  const mesNombreLargo = fechaMesObj.toLocaleDateString("es-GT", { month: "long", year: "numeric" });
  const ultimoDiaMes = new Date(Number(añoStr), Number(mesNum), 0).getDate();

  function exportarCSV() {
    const lineas: string[] = [];
    lineas.push(`LIBRO DE ACTAS DE ARQUEO MENSUAL DE CAJA - COMISION DE VIGILANCIA`);
    lineas.push(`COOPERATIVA MAYA INVERSIONES FUTURAS R.L. "COMIF-R.L."`);
    lineas.push(`Acta No.: ${numeroActa}`);
    lineas.push(`Agencia: ${agenciaNombre}`);
    lineas.push(`Periodo: ${mesNombreLargo}`);
    lineas.push("");
    lineas.push("RESUMEN GENERAL DEL MES");
    lineas.push(`Dias Operados,${datos?.resumen?.totalDiasOperados ?? 0}`);
    lineas.push(`Dias Cuadrados Exactos,${datos?.resumen?.diasCuadrados ?? 0}`);
    lineas.push(`Dias con Diferencia,${datos?.resumen?.diasConDiferencia ?? 0}`);
    lineas.push(`Total Ingresos del Mes (Q),${(datos?.resumen?.totalIngresosMes ?? 0).toFixed(2)}`);
    lineas.push(`Total Egresos del Mes (Q),${(datos?.resumen?.totalEgresosMes ?? 0).toFixed(2)}`);
    lineas.push(`Flujo Neto del Mes (Q),${((datos?.resumen?.totalIngresosMes ?? 0) - (datos?.resumen?.totalEgresosMes ?? 0)).toFixed(2)}`);
    lineas.push(`Diferencia Neta (Q),${((datos?.resumen?.totalSobrante ?? 0) - (datos?.resumen?.totalFaltante ?? 0)).toFixed(2)}`);
    lineas.push("");
    lineas.push("SABANA DE CIERRES DIARIOS");
    lineas.push("Fecha,Cajero / Operador,Saldo Inicial (Q),Ingresos (Q),Egresos (Q),Flujo Neto (Q),Saldo Libro (Q),Efectivo Contado (Q),Diferencia (Q),Resultado");
    if (datos && datos.dias.length > 0) {
      datos.dias.forEach((d) => {
        const fechaStr = new Date(d.fecha).toLocaleDateString("es-GT");
        const cajero = `"${(d.cerrado_por_nombre || d.abierto_por_nombre || "").replace(/"/g, '""')}"`;
        const sIni = Number(d.saldo_inicial || 0);
        const ing = Number(d.total_ingresos || 0);
        const egr = Number(d.total_egresos || 0);
        const flujo = Number(d.flujo_neto ?? (ing - egr));
        const esperado = Number(d.saldo_esperado ?? (sIni + ing - egr));
        const contado = Number(d.total_contado ?? (d.estado === "CERRADO" ? (d.saldo_final ?? esperado) : esperado));
        const dif = Number(d.diferencia ?? (d.estado === "CERRADO" ? contado - esperado : 0));
        const res = d.estado === "ABIERTO" ? "EN TURNO ACTIVO" : dif === 0 ? "CUADRADO" : dif > 0 ? "SOBRANTE" : "FALTANTE";
        lineas.push(
          `${fechaStr},${cajero},${sIni.toFixed(2)},${ing.toFixed(2)},${egr.toFixed(2)},${flujo.toFixed(2)},${esperado.toFixed(2)},${contado.toFixed(2)},${dif.toFixed(2)},${res}`,
        );
      });
    } else {
      lineas.push(`"Sin operaciones registradas en el mes de ${mesNombreLargo}",,,,,,,,,`);
    }
    lineas.push("");
    lineas.push(`Observaciones: "${observaciones.replace(/"/g, '""')}"`);

    const blob = new Blob(["\uFEFF" + lineas.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `acta_arqueo_mensual_${numeroActa}_${agenciaNombre}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      {/* ========================================================================= */}
      {/* PANEL DE CONFIGURACIÓN Y CONTROLES (NO PRINT)                             */}
      {/* ========================================================================= */}
      <div className="no-print">
        <div className="page-head" style={{ marginBottom: "0.75rem", paddingBottom: "0.5rem" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
              <span style={{ fontSize: "1.3rem" }}>📑</span>
              <h1 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 800 }}>Libro de Actas de Arqueo Mensual de Caja</h1>
              <span className="badge" style={{ background: "#fef3c7", color: "#92400e", fontWeight: 700, fontSize: "0.72rem" }}>
                Comisión de Vigilancia
              </span>
            </div>
            <p style={{ margin: "0.15rem 0 0", fontSize: "0.78rem" }}>
              Emisión de actas oficiales con formato estatutario notarial para la Comisión de Vigilancia y Auditoría Interna.
            </p>
          </div>

          <div style={{ display: "flex", gap: "0.45rem", alignItems: "center", flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
              <label htmlFor="mes-picker" style={{ fontSize: "0.8rem", fontWeight: 600 }}>
                Mes:
              </label>
              <input
                id="mes-picker"
                type="month"
                value={mes}
                onChange={(e) => setMes(e.target.value)}
                style={{ padding: "0.3rem 0.45rem", borderRadius: "6px", fontSize: "0.82rem" }}
              />
            </div>

            {puedeElegirAgencia && (
              <select value={agenciaId} onChange={(e) => setAgenciaId(e.target.value)} style={{ maxWidth: 170, fontSize: "0.82rem", padding: "0.3rem 0.45rem" }}>
                {agencias.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.nombre}
                  </option>
                ))}
              </select>
            )}

            <button
              type="button"
              className="btn secondary"
              onClick={exportarCSV}
              disabled={cargando}
              style={{ fontSize: "0.8rem", padding: "0.35rem 0.65rem" }}
            >
              📥 Excel (CSV)
            </button>
            <button
              type="button"
              className="btn"
              onClick={() => window.print()}
              disabled={cargando}
              style={{ fontSize: "0.8rem", padding: "0.35rem 0.65rem" }}
            >
              🖨️ Imprimir Acta Oficial
            </button>
          </div>
        </div>

        {error && <div className="alert error" style={{ margin: "0.4rem 0", padding: "0.5rem 0.75rem", fontSize: "0.82rem" }}>{error}</div>}

        {/* Panel Desplegable de Parámetros Notariales */}
        <div className="card" style={{ marginBottom: "0.75rem", background: "var(--paper-raised)", padding: "0.55rem 0.85rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.5rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
              <span style={{ fontSize: "0.84rem", fontWeight: 700, color: "var(--accent)" }}>
                ⚙️ Datos Oficiales del Acta:
              </span>
              <span className="badge" style={{ fontSize: "0.72rem", padding: "0.15rem 0.45rem" }}>
                Acta: <strong>{numeroActa}</strong>
              </span>
              <span className="badge" style={{ fontSize: "0.72rem", padding: "0.15rem 0.45rem" }}>
                📍 {lugarMunicipio}
              </span>
              <span className="badge" style={{ fontSize: "0.72rem", padding: "0.15rem 0.45rem" }}>
                ⏰ {horaInicio} – {horaFin}
              </span>
              <span className="badge" style={{ fontSize: "0.72rem", padding: "0.15rem 0.45rem" }}>
                👤 Pres.: {nombrePresidente}
              </span>
            </div>

            <button
              type="button"
              className="btn secondary"
              onClick={() => setMostrarConfiguracion(!mostrarConfiguracion)}
              style={{ fontSize: "0.75rem", padding: "0.25rem 0.6rem" }}
              title="Ajustar nombres de la comisión, horario y observaciones"
            >
              {mostrarConfiguracion ? "▲ Ocultar Parámetros" : "▼ Modificar Datos y Firmantes"}
            </button>
          </div>

          {mostrarConfiguracion && (
            <div style={{ marginTop: "0.65rem", paddingTop: "0.65rem", borderTop: "1px solid var(--line)" }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: "0.6rem" }}>
                <div className="field" style={{ marginBottom: 0 }}>
                  <label style={{ fontSize: "0.72rem" }}>No. de Acta</label>
                  <input
                    type="text"
                    value={numeroActa}
                    onChange={(e) => setNumeroActa(e.target.value)}
                    placeholder="CV-09-2026"
                    style={{ fontSize: "0.82rem", padding: "0.3rem 0.45rem" }}
                  />
                </div>
                <div className="field" style={{ marginBottom: 0 }}>
                  <label style={{ fontSize: "0.72rem" }}>Municipio / Lugar</label>
                  <input
                    type="text"
                    value={lugarMunicipio}
                    onChange={(e) => setLugarMunicipio(e.target.value)}
                    placeholder="San Gaspar Chajul, Quiché"
                    style={{ fontSize: "0.82rem", padding: "0.3rem 0.45rem" }}
                  />
                </div>
                <div className="field" style={{ marginBottom: 0 }}>
                  <label style={{ fontSize: "0.72rem" }}>Hora Inicio</label>
                  <input
                    type="time"
                    value={horaInicio}
                    onChange={(e) => setHoraInicio(e.target.value)}
                    style={{ fontSize: "0.82rem", padding: "0.3rem 0.45rem" }}
                  />
                </div>
                <div className="field" style={{ marginBottom: 0 }}>
                  <label style={{ fontSize: "0.72rem" }}>Hora Cierre</label>
                  <input
                    type="time"
                    value={horaFin}
                    onChange={(e) => setHoraFin(e.target.value)}
                    style={{ fontSize: "0.82rem", padding: "0.3rem 0.45rem" }}
                  />
                </div>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
                  gap: "0.6rem",
                  marginTop: "0.6rem",
                }}
              >
                <div className="field" style={{ marginBottom: 0 }}>
                  <label style={{ fontSize: "0.72rem" }}>Presidente (Comisión Vigilancia)</label>
                  <input
                    type="text"
                    value={nombrePresidente}
                    onChange={(e) => setNombrePresidente(e.target.value)}
                    style={{ fontSize: "0.82rem", padding: "0.3rem 0.45rem" }}
                  />
                </div>
                <div className="field" style={{ marginBottom: 0 }}>
                  <label style={{ fontSize: "0.72rem" }}>Secretaria (Comisión Vigilancia)</label>
                  <input
                    type="text"
                    value={nombreSecretaria}
                    onChange={(e) => setNombreSecretaria(e.target.value)}
                    style={{ fontSize: "0.82rem", padding: "0.3rem 0.45rem" }}
                  />
                </div>
                <div className="field" style={{ marginBottom: 0 }}>
                  <label style={{ fontSize: "0.72rem" }}>Vocal I (Comisión Vigilancia)</label>
                  <input
                    type="text"
                    value={nombreVocal}
                    onChange={(e) => setNombreVocal(e.target.value)}
                    style={{ fontSize: "0.82rem", padding: "0.3rem 0.45rem" }}
                  />
                </div>
                <div className="field" style={{ marginBottom: 0 }}>
                  <label style={{ fontSize: "0.72rem" }}>Receptor Pagador (Cajero)</label>
                  <input
                    type="text"
                    value={nombreCajero}
                    onChange={(e) => setNombreCajero(e.target.value)}
                    style={{ fontSize: "0.82rem", padding: "0.3rem 0.45rem" }}
                  />
                </div>
              </div>

              <div className="field" style={{ marginTop: "0.6rem", marginBottom: 0 }}>
                <label style={{ fontSize: "0.72rem" }}>
                  <strong>Observaciones / Hallazgos de Auditoría</strong> (Se imprime en el Punto Tercero del Acta)
                </label>
                <textarea
                  rows={2}
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  style={{ fontSize: "0.8rem", width: "100%", padding: "0.35rem 0.45rem" }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* ACTA OFICIAL NOTARIAL / ESTATUTARIA (PANTALLA E IMPRESIÓN)                */}
      {/* ========================================================================= */}
      <div
        className="card"
        style={{
          background: "var(--paper)",
          border: "1px solid var(--line)",
          padding: "1.1rem 1.4rem",
          width: "100%",
          boxSizing: "border-box",
        }}
      >
        {/* Encabezado Institucional */}
        <div
          style={{
            textAlign: "center",
            borderBottom: "2px solid #0f172a",
            paddingBottom: "0.6rem",
            marginBottom: "0.8rem",
          }}
        >
          <div style={{ fontSize: "1rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.03em" }}>
            COOPERATIVA MAYA INVERSIONES FUTURAS R.L. &quot;COMIF-R.L.&quot;
          </div>
          <div style={{ fontSize: "1.15rem", color: "#047857", fontWeight: 800, margin: "0.15rem 0" }}>
            COMISIÓN DE VIGILANCIA · LIBRO DE ACTAS DE ARQUEO MENSUAL
          </div>
          <div style={{ fontSize: "0.92rem", fontWeight: 700, textDecoration: "underline", color: "#0f172a" }}>
            ACTA NÚMERO: {numeroActa}
          </div>
          <div style={{ fontSize: "0.78rem", color: "var(--ink-soft)", marginTop: "2px" }}>
            Agencia: <strong>{agenciaNombre.toUpperCase()}</strong> · Período de Auditoría:{" "}
            <strong style={{ textTransform: "capitalize" }}>{mesNombreLargo}</strong> · Cifras en Quetzales (Q)
          </div>
        </div>

        {cargando && <p style={{ textAlign: "center", padding: "1rem" }}>Cargando arqueos del mes…</p>}

        {!cargando && (!datos || datos.dias.length === 0) && (
          <div className="alert info no-print" style={{ margin: "0.5rem 0" }}>
            ℹ️ No se encontraron cajas operadas para el mes de {mesNombreLargo} en {agenciaNombre}. Se muestra el formato notarial oficial con saldo Q 0.00 para efectos de acta y dictamen.
          </div>
        )}

        <div style={{ fontSize: "0.82rem", lineHeight: 1.5, color: "var(--ink)" }}>
          {/* PUNTO PRIMERO */}
          <div style={{ marginBottom: "0.75rem", textAlign: "justify" }}>
            <strong style={{ textDecoration: "underline" }}>PUNTO PRIMERO (APERTURA Y QUÓRUM):</strong> En el municipio
            de {lugarMunicipio}, departamento de Quiché, siendo las {horaInicio} horas del día {ultimoDiaMes} del mes
            de {mesNombreLargo}, reunidos en las oficinas de la Agencia <strong>{agenciaNombre}</strong> de la{" "}
            <strong>COOPERATIVA MAYA INVERSIONES FUTURAS R.L. &quot;COMIF-R.L.&quot;</strong>, se
            constituyen los miembros de la Comisión de Vigilancia: <strong>{nombrePresidente}</strong> (Presidente),{" "}
            <strong>{nombreSecretaria}</strong> (Secretaria) y <strong>{nombreVocal}</strong> (Vocal I), en presencia del
            Receptor Pagador <strong>{nombreCajero}</strong>, con el propósito de celebrar la sesión ordinaria de
            verificación, cotejo y cierre mensual del libro auxiliar de caja.
          </div>

          {/* PUNTO SEGUNDO */}
          <div style={{ marginBottom: "0.5rem" }}>
            <div style={{ textAlign: "justify", marginBottom: "0.4rem" }}>
              <strong style={{ textDecoration: "underline" }}>PUNTO SEGUNDO (REVISIÓN DE OPERACIONES Y SÁBANA DE CIERRES):</strong>{" "}
              La Comisión de Vigilancia procedió a la revisión minuciosa y cotejo diario de los comprobantes de ingreso y egreso
              generados durante el mes, arrojando el siguiente resumen consolidado:
            </div>

            {/* Cintillo de Cifras Clave */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
                gap: "0.45rem",
                marginBottom: "0.5rem",
                background: "var(--paper-raised)",
                padding: "0.4rem 0.6rem",
                borderRadius: "6px",
                border: "1px solid var(--line)",
                fontSize: "0.72rem",
              }}
            >
              <div>
                <span style={{ color: "var(--ink-soft)", display: "block", fontSize: "0.65rem", textTransform: "uppercase" }}>
                  Días Operados
                </span>
                <strong className="mono" style={{ fontSize: "0.9rem" }}>
                  {datos?.resumen?.totalDiasOperados ?? 0} días
                </strong>
              </div>

              <div>
                <span style={{ color: "var(--ink-soft)", display: "block", fontSize: "0.65rem", textTransform: "uppercase" }}>
                  Efectividad de Cuadre
                </span>
                <strong className="mono" style={{ fontSize: "0.9rem", color: "#16a34a" }}>
                  {datos?.resumen ? `${datos.resumen.diasCuadrados} / ${datos.resumen.totalDiasOperados}` : "0 / 0"} (
                  {datos?.resumen && datos.resumen.totalDiasOperados > 0
                    ? Math.round((datos.resumen.diasCuadrados / datos.resumen.totalDiasOperados) * 100)
                    : 100}
                  %)
                </strong>
              </div>

              <div>
                <span style={{ color: "var(--ink-soft)", display: "block", fontSize: "0.65rem", textTransform: "uppercase" }}>
                  Total Ingresos del Mes
                </span>
                <strong className="mono" style={{ fontSize: "0.9rem", color: "#16a34a" }}>
                  + {formatoQ(datos?.resumen?.totalIngresosMes ?? 0)}
                </strong>
              </div>

              <div>
                <span style={{ color: "var(--ink-soft)", display: "block", fontSize: "0.65rem", textTransform: "uppercase" }}>
                  Total Egresos del Mes
                </span>
                <strong className="mono" style={{ fontSize: "0.9rem", color: "#dc2626" }}>
                  − {formatoQ(datos?.resumen?.totalEgresosMes ?? 0)}
                </strong>
              </div>

              <div
                style={{
                  background: (datos?.resumen?.diasConDiferencia ?? 0) === 0 ? "rgba(22, 163, 74, 0.1)" : "rgba(220, 38, 38, 0.1)",
                  padding: "2px 4px",
                  borderRadius: "4px",
                }}
              >
                <span style={{ color: "var(--ink-soft)", display: "block", fontSize: "0.65rem", textTransform: "uppercase" }}>
                  Diferencia de Caja
                </span>
                <strong
                  className="mono"
                  style={{
                    fontSize: "0.9rem",
                    color: (datos?.resumen?.diasConDiferencia ?? 0) === 0 ? "#16a34a" : "#dc2626",
                  }}
                >
                  {(datos?.resumen?.diasConDiferencia ?? 0) === 0
                    ? "Cuadrado (Q 0.00)"
                    : `${datos?.resumen?.diasConDiferencia} día(s)`}
                </strong>
              </div>
            </div>

            {/* Sábana de Cierres Diarios */}
            <div className="table-wrap" style={{ border: "1px solid var(--line)" }}>
              <table style={{ fontSize: "0.74rem", width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "var(--paper-raised)" }}>
                    <th style={{ width: "65px", padding: "2px 4px" }}>Fecha</th>
                    <th style={{ padding: "2px 4px" }}>Cajero / Operador</th>
                    <th style={{ width: "80px", textAlign: "right", padding: "2px 4px" }}>Saldo Inicial</th>
                    <th style={{ width: "80px", textAlign: "right", padding: "2px 4px" }}>Ingresos (+)</th>
                    <th style={{ width: "80px", textAlign: "right", padding: "2px 4px" }}>Egresos (−)</th>
                    <th style={{ width: "80px", textAlign: "right", padding: "2px 4px" }}>Flujo Neto (±)</th>
                    <th style={{ width: "85px", textAlign: "right", padding: "2px 4px" }}>Saldo Libro</th>
                    <th style={{ width: "85px", textAlign: "right", padding: "2px 4px" }}>Contado</th>
                    <th style={{ width: "70px", textAlign: "right", padding: "2px 4px" }}>Diferencia</th>
                    <th style={{ width: "85px", textAlign: "center", padding: "2px 4px" }}>Resultado</th>
                  </tr>
                </thead>
                <tbody>
                  {datos && datos.dias.length > 0 ? (
                    datos.dias.map((d) => {
                      const sIni = Number(d.saldo_inicial || 0);
                      const ing = Number(d.total_ingresos || 0);
                      const egr = Number(d.total_egresos || 0);
                      const flujo = Number(d.flujo_neto ?? (ing - egr));
                      const esperado = Number(d.saldo_esperado ?? (sIni + ing - egr));
                      const contado = Number(d.total_contado ?? (d.estado === "CERRADO" ? (d.saldo_final ?? esperado) : esperado));
                      const dif = Number(d.diferencia ?? (d.estado === "CERRADO" ? contado - esperado : 0));
                      return (
                        <tr key={d.id}>
                          <td className="mono" style={{ fontWeight: 600, padding: "2px 4px" }}>
                            {new Date(d.fecha).toLocaleDateString("es-GT", {
                              weekday: "short",
                              day: "2-digit",
                              month: "2-digit",
                            })}
                          </td>
                          <td style={{ padding: "2px 4px" }}>
                            {d.cerrado_por_nombre || d.abierto_por_nombre || nombreCajero}
                          </td>
                          <td className="mono" style={{ textAlign: "right", padding: "2px 4px" }}>
                            {formatoQ(sIni)}
                          </td>
                          <td className="mono" style={{ textAlign: "right", color: "#16a34a", padding: "2px 4px" }}>
                            {formatoQ(ing)}
                          </td>
                          <td className="mono" style={{ textAlign: "right", color: "#dc2626", padding: "2px 4px" }}>
                            {formatoQ(egr)}
                          </td>
                          <td
                            className="mono"
                            style={{
                              textAlign: "right",
                              fontWeight: 700,
                              color: flujo >= 0 ? "#16a34a" : "#dc2626",
                              padding: "2px 4px",
                            }}
                          >
                            {flujo >= 0 ? `+${formatoQ(flujo)}` : `-${formatoQ(Math.abs(flujo))}`}
                          </td>
                          <td className="mono" style={{ textAlign: "right", fontWeight: 800, color: "var(--ink)", padding: "2px 4px" }}>
                            {formatoQ(esperado)}
                          </td>
                          <td className="mono" style={{ textAlign: "right", padding: "2px 4px" }}>
                            {formatoQ(contado)}
                          </td>
                          <td
                            className="mono"
                            style={{
                              textAlign: "right",
                              fontWeight: 700,
                              color: dif === 0 ? "#16a34a" : dif > 0 ? "#2563eb" : "#dc2626",
                              padding: "2px 4px",
                            }}
                          >
                            {dif === 0 ? "Q 0.00" : dif > 0 ? `+${formatoQ(dif)}` : `-${formatoQ(Math.abs(dif))}`}
                          </td>
                          <td style={{ textAlign: "center", padding: "2px 4px" }}>
                            <span
                              style={{
                                color: d.estado === "ABIERTO" ? "#2563eb" : dif === 0 ? "#16a34a" : "#dc2626",
                                fontWeight: 700,
                                fontSize: "0.72rem",
                              }}
                            >
                              {d.estado === "ABIERTO" ? "⏳ En Turno" : dif === 0 ? "✓ Cuadrado" : dif > 0 ? "Sobrante" : "Faltante"}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={10} style={{ textAlign: "center", padding: "14px 8px", color: "var(--ink-soft)", fontStyle: "italic" }}>
                        Sin movimientos de caja registrados en este período mensual (0 operaciones registradas)
                      </td>
                    </tr>
                  )}
                </tbody>
                <tfoot>
                  <tr style={{ background: "rgba(0,0,0,0.04)", fontWeight: 800, borderTop: "2px solid #0f172a" }}>
                    <td colSpan={2} style={{ padding: "3px 4px" }}>
                      TOTALES DEL MES:
                    </td>
                    <td style={{ padding: "3px 4px" }}>—</td>
                    <td className="mono" style={{ textAlign: "right", color: "#16a34a", padding: "3px 4px" }}>
                      {formatoQ(datos?.resumen?.totalIngresosMes ?? 0)}
                    </td>
                    <td className="mono" style={{ textAlign: "right", color: "#dc2626", padding: "3px 4px" }}>
                      {formatoQ(datos?.resumen?.totalEgresosMes ?? 0)}
                    </td>
                    <td
                      className="mono"
                      style={{
                        textAlign: "right",
                        color: (datos?.resumen ? (datos.resumen.totalIngresosMes - datos.resumen.totalEgresosMes) : 0) >= 0 ? "#16a34a" : "#dc2626",
                        padding: "3px 4px",
                      }}
                    >
                      {datos?.resumen && (datos.resumen.totalIngresosMes - datos.resumen.totalEgresosMes) >= 0
                        ? `+${formatoQ(datos.resumen.totalIngresosMes - datos.resumen.totalEgresosMes)}`
                        : `-${formatoQ(Math.abs((datos?.resumen?.totalIngresosMes ?? 0) - (datos?.resumen?.totalEgresosMes ?? 0)))}`}
                    </td>
                    <td colSpan={2} style={{ padding: "3px 4px" }}></td>
                    <td
                      className="mono"
                      style={{
                        textAlign: "right",
                        color: (datos?.resumen?.diasConDiferencia ?? 0) === 0 ? "#16a34a" : "#dc2626",
                        padding: "3px 4px",
                      }}
                    >
                      {(datos?.resumen?.diasConDiferencia ?? 0) === 0
                        ? "Q 0.00"
                        : (datos?.resumen?.totalSobrante ?? 0) > 0
                        ? `+${formatoQ(datos?.resumen?.totalSobrante ?? 0)}`
                        : `-${formatoQ(datos?.resumen?.totalFaltante ?? 0)}`}
                    </td>
                    <td style={{ textAlign: "center", padding: "3px 4px" }}>
                      {(datos?.resumen?.diasConDiferencia ?? 0) === 0 ? "✓ CONFORME" : "REVISADO"}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

            {/* PUNTO TERCERO */}
            <div style={{ marginTop: "0.6rem", marginBottom: "0.6rem", textAlign: "justify" }}>
              <strong style={{ textDecoration: "underline" }}>PUNTO TERCERO (HALLAZGOS Y DICTAMEN DE AUDITORÍA):</strong>{" "}
              {observaciones}
            </div>

            {/* PUNTO CUARTO */}
            <div style={{ marginBottom: "1rem", textAlign: "justify" }}>
              <strong style={{ textDecoration: "underline" }}>PUNTO CUARTO (CIERRE Y RATIFICACIÓN):</strong> No habiendo
              más que hacer constar, se da por finalizada la presente sesión de arqueo mensual a las {horaFin} horas en el
              mismo lugar y fecha de su inicio, leída íntegramente la presente acta y enterados de su contenido, objeto y
              validez legal, la aceptamos, ratificamos y firmamos de entera conformidad.
            </div>

            {/* BLOQUE DE FIRMAS OFICIALES (4 FIRMAS CON NOMBRES REALES) */}
            <div
              style={{
                marginTop: "1.25rem",
                paddingTop: "0.6rem",
                borderTop: "1px dashed var(--line)",
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
                gap: "1.25rem 1rem",
                textAlign: "center",
                pageBreakInside: "avoid",
              }}
            >
              <div>
                <div style={{ borderBottom: "1px solid #000", height: "28px", marginBottom: "0.2rem" }} />
                <div style={{ fontWeight: 700, fontSize: "0.78rem" }}>{nombrePresidente}</div>
                <div style={{ fontSize: "0.7rem", color: "var(--ink-soft)" }}>Presidente</div>
                <div style={{ fontSize: "0.65rem", color: "var(--ink-soft)" }}>Comisión de Vigilancia</div>
              </div>

              <div>
                <div style={{ borderBottom: "1px solid #000", height: "28px", marginBottom: "0.2rem" }} />
                <div style={{ fontWeight: 700, fontSize: "0.78rem" }}>{nombreSecretaria}</div>
                <div style={{ fontSize: "0.7rem", color: "var(--ink-soft)" }}>Secretaria</div>
                <div style={{ fontSize: "0.65rem", color: "var(--ink-soft)" }}>Comisión de Vigilancia</div>
              </div>

              <div>
                <div style={{ borderBottom: "1px solid #000", height: "28px", marginBottom: "0.2rem" }} />
                <div style={{ fontWeight: 700, fontSize: "0.78rem" }}>{nombreVocal}</div>
                <div style={{ fontSize: "0.7rem", color: "var(--ink-soft)" }}>Vocal I</div>
                <div style={{ fontSize: "0.65rem", color: "var(--ink-soft)" }}>Comisión de Vigilancia</div>
              </div>

              <div>
                <div style={{ borderBottom: "1px solid #000", height: "28px", marginBottom: "0.2rem" }} />
                <div style={{ fontWeight: 700, fontSize: "0.78rem" }}>{nombreCajero}</div>
                <div style={{ fontSize: "0.7rem", color: "var(--ink-soft)" }}>Receptor Pagador</div>
                <div style={{ fontSize: "0.65rem", color: "var(--ink-soft)" }}>Cajero de Ventanilla</div>
              </div>
            </div>
          </div>
      </div>
    </div>
  );
}
```

## `frontend/src/context/AuthContext.tsx` {#frontendsrccontextauthcontexttsx}

```tsx
import { createContext, useContext, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { api, mensajeError } from "../lib/api";
import type { UsuarioAutenticado } from "../types";

interface AuthContextValue {
  usuario: UsuarioAutenticado | null;
  cargando: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function leerUsuarioGuardado(): UsuarioAutenticado | null {
  const raw = localStorage.getItem("mif_usuario");
  if (!raw) return null;
  try {
    return JSON.parse(raw) as UsuarioAutenticado;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<UsuarioAutenticado | null>(leerUsuarioGuardado);
  const [cargando, setCargando] = useState(false);

  const login = async (email: string, password: string) => {
    setCargando(true);
    try {
      const { data } = await api.post("/auth/login", { email, password });
      localStorage.setItem("mif_token", data.token);
      localStorage.setItem("mif_usuario", JSON.stringify(data.usuario));
      setUsuario(data.usuario);
    } catch (err) {
      throw new Error(mensajeError(err));
    } finally {
      setCargando(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("mif_token");
    localStorage.removeItem("mif_usuario");
    setUsuario(null);
  };

  const value = useMemo(() => ({ usuario, cargando, login, logout }), [usuario, cargando]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  return ctx;
}
```

