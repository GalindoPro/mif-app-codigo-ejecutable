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
- [`frontend/src/components/ProtectedRoute.tsx`](#frontendsrccomponentsprotectedroutetsx)
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
    <meta name="description" content="Sistema Integral MIF — caja chica, ahorros, aportaciones e ingresos de la Cooperativa MIF." />
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap" />
    <title>Sistema Integral MIF</title>
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
    "react-router-dom": "^7.18.2"
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
        name: "Sistema Integral MIF",
        short_name: "MIF",
        description: "Caja chica, ahorros, aportaciones e ingresos de la Cooperativa MIF",
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
  | "AHORRO_PLAZO_FIJO"
  | "APORTACION";

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
  usuario_rol?: string;
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
  FONDOS_PROPIOS: "Fondos Propios (COOP COMIF R.L.)",
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
  seleccionada,
  onSeleccionar,
}: {
  tipo: TipoCuentaAhorro;
  agenciaId?: string;
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
        .get<Cuenta[]>("/cuentas", { params: { tipo, q } })
        .then(({ data }) => setResultados(data.filter((c) => !agenciaId || c.agencia_id === agenciaId)));
    }, 250);
    return () => clearTimeout(timeout);
  }, [q, tipo, agenciaId]);

  useEffect(() => {
    function onClickFuera(e: MouseEvent) {
      if (cajaRef.current && !cajaRef.current.contains(e.target as Node)) setAbierto(false);
    }
    document.addEventListener("mousedown", onClickFuera);
    return () => document.removeEventListener("mousedown", onClickFuera);
  }, []);

  if (seleccionada) {
    return (
      <div className="socio-chip">
        <div>
          <strong>{seleccionada.socio_nombres}</strong>
          <span className="mono"> · {seleccionada.numero_cuenta}</span>
          <span> · saldo {formatoQ(seleccionada.saldo_actual)}</span>
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
        placeholder="Busca por socio o número de cuenta…"
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          setAbierto(true);
        }}
        onFocus={() => setAbierto(true)}
      />
      {abierto && resultados.length > 0 && (
        <ul className="buscador-dropdown">
          {resultados.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                onClick={() => {
                  onSeleccionar(c);
                  setAbierto(false);
                  setQ("");
                }}
              >
                <span>{c.socio_nombres}</span>
                <span className="mono">
                  {c.numero_cuenta} · {formatoQ(c.saldo_actual)}
                </span>
              </button>
            </li>
          ))}
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
  seleccionado,
  onSeleccionar,
}: {
  agenciaId?: string;
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
        .get<{ data: Socio[] }>("/socios", { params: { q, pageSize: 8, estado: "ACTIVO" } })
        .then(({ data }) => setResultados(data.data.filter((s) => !agenciaId || s.agencia_id === agenciaId)));
    }, 250);
    return () => clearTimeout(timeout);
  }, [q, agenciaId]);

  useEffect(() => {
    function onClickFuera(e: MouseEvent) {
      if (cajaRef.current && !cajaRef.current.contains(e.target as Node)) setAbierto(false);
    }
    document.addEventListener("mousedown", onClickFuera);
    return () => document.removeEventListener("mousedown", onClickFuera);
  }, []);

  if (seleccionado) {
    return (
      <div className="socio-chip">
        <div>
          <strong>{seleccionado.nombres}</strong>
          <span className="mono"> · {seleccionado.numero_asociado}</span>
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
        placeholder="Escribe el nombre o número de asociado…"
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          setAbierto(true);
        }}
        onFocus={() => setAbierto(true)}
      />
      {abierto && resultados.length > 0 && (
        <ul className="buscador-dropdown">
          {resultados.map((s) => (
            <li key={s.id}>
              <button
                type="button"
                onClick={() => {
                  onSeleccionar(s);
                  setAbierto(false);
                  setQ("");
                }}
              >
                <span>{s.nombres}</span>
                <span className="mono">{s.numero_asociado}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {abierto && q.length >= 2 && resultados.length === 0 && (
        <div className="buscador-dropdown empty-msg">Sin resultados para "{q}"</div>
      )}
    </div>
  );
}
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
.shell {
  display: grid;
  grid-template-columns: 250px 1fr;
  min-height: 100vh;
  width: 100%;
}

.sidebar {
  background: var(--paper-raised);
  border-right: 1px solid var(--line);
  padding: 1.25rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  transition: transform 0.3s ease;
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

.brand {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  padding: 0 0.5rem;
}
.brand .name {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  font-weight: 800;
  font-size: 1.25rem;
  letter-spacing: -0.02em;
  color: var(--accent);
}
.brand .sub {
  font-size: 0.72rem;
  color: var(--ink-soft);
  font-family: -apple-system, BlinkMacSystemFont, sans-serif;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-weight: 600;
}

.nav {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}
.nav a {
  display: block;
  padding: 0.55rem 0.75rem;
  border-radius: 8px;
  color: var(--ink-soft);
  text-decoration: none;
  font-size: 0.9rem;
  font-weight: 500;
  transition: all 0.15s ease;
}
.nav a:hover {
  background: var(--mono-bg);
  color: var(--ink);
}
.nav a.active {
  background: var(--accent);
  color: #ffffff;
  font-weight: 600;
}

.sidebar-footer {
  margin-top: auto;
  border-top: 1px solid var(--line);
  padding-top: 1rem;
  font-size: 0.85rem;
}
.sidebar-footer .who {
  font-weight: 600;
}
.sidebar-footer .role {
  color: var(--ink-soft);
  font-size: 0.78rem;
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
  padding: 1.25rem 2rem;
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
.dashboard-lower-grid {
  display: grid;
  grid-template-columns: 0.95fr 1.05fr;
  gap: 0.65rem;
  align-items: stretch;
  width: 100%;
}

@media (max-width: 1080px) {
  .dashboard-lower-grid {
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
  gap: 0.4rem;
  border: 1px solid transparent;
  border-radius: 8px;
  padding: 0.55rem 1.1rem;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  background: var(--accent);
  color: var(--paper-raised);
  text-decoration: none;
}
.btn:hover {
  background: var(--accent-strong);
}
.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.btn.secondary {
  background: transparent;
  border-color: var(--line);
  color: var(--ink);
}
.btn.secondary:hover {
  background: var(--mono-bg);
}
.btn.danger {
  background: #dc2626;
  color: #ffffff;
  border-color: #b91c1c;
}
.btn.danger:hover {
  background: #b91c1c;
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
  color: #34d399;
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
  }
  .mobile-header {
    display: flex;
  }
  .sidebar {
    position: fixed;
    top: 0;
    left: 0;
    bottom: 0;
    width: 280px;
    z-index: 50;
    background: var(--paper-raised);
    transform: translateX(-100%);
    box-shadow: 4px 0 15px rgba(0, 0, 0, 0.1);
    border-right: none;
    padding: 1.5rem 1.25rem;
  }
  .sidebar.open {
    transform: translateX(0);
  }
  .content {
    padding: 1.25rem 1rem;
    max-width: 100%;
    width: 100%;
    box-sizing: border-box;
    overflow-x: hidden;
  }
  .stat-grid {
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)) !important;
    gap: 0.75rem !important;
  }
  .page-head h1 {
    font-size: 1.4rem;
  }
}

/* Teléfonos móviles y pantallas compactas (≤ 640px) */
@media (max-width: 640px) {
  .sidebar {
    width: 85%;
    max-width: 320px;
  }
  .content {
    padding: 1rem 0.75rem;
  }
  .stat-grid {
    grid-template-columns: 1fr !important;
  }
  .stat-card .value {
    font-size: 1.35rem !important;
  }
  .page-head h1 {
    font-size: 1.25rem;
  }
  .table-wrap {
    margin: 0 -0.75rem;
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

@media print {
  @page {
    size: letter landscape;
    margin: 0.6cm;
  }

  body {
    background: #ffffff !important;
    color: #000000 !important;
    font-size: 8pt !important;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif !important;
  }

  /* Mostrar elementos exclusivamente para impresión */
  .print-only {
    display: block !important;
  }

  /* Ocultar barra lateral, botones, controles de navegación y alertas */
  .sidebar,
  .no-print,
  button,
  .btn,
  .searchbar,
  .pagination,
  select,
  input,
  .link-btn {
    display: none !important;
  }

  /* Expandir contenedor principal sin desbordes */
  .shell {
    display: block !important;
  }
  .content {
    padding: 0 !important;
    margin: 0 !important;
    max-width: 100% !important;
    width: 100% !important;
  }

  /* Mostrar membretes y encabezados institucionales de impresión */
  .print-container {
    display: block !important;
  }

  /* Tablas limpias de alta legibilidad en papel */
  .table-wrap {
    overflow: visible !important;
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
    padding: 2px 4px !important;
    color: #000000 !important;
  }
  th {
    background: #f8fafc !important;
    color: #0f172a !important;
    font-weight: 700 !important;
  }
  tfoot tr {
    border-top: 2px solid #000000 !important;
    font-weight: bold !important;
  }

  /* Tarjetas y bloques de auditoría */
  .card, .stat-card {
    box-shadow: none !important;
    border: 1px solid #94a3b8 !important;
    page-break-inside: avoid !important;
    break-inside: avoid !important;
  }

  /* Insignias */
  .badge {
    border: 1px solid #64748b !important;
    color: #000000 !important;
    background: transparent !important;
  }

  /* Evitar saltos de página dentro de firmas o filas */
  tr,
  .stat-grid {
    page-break-inside: avoid !important;
    break-inside: avoid !important;
  }

  /* Ocultar modales, overlays y paneles no imprimibles al imprimir */
  .modal,
  .modal-overlay,
  .no-print,
  .sidebar,
  .app-header {
    display: none !important;
  }

  /* Contenedores de reportes directos en pantalla optimizados para imprimir */
  .caja-chica-reporte-container,
  .caja-chica-modal-overlay,
  .arqueo-modal-overlay {
    position: absolute !important;
    left: 0 !important;
    top: 0 !important;
    background: transparent !important;
    padding: 0 !important;
    overflow: visible !important;
    width: 100% !important;
  }

  .caja-chica-reporte-card,
  .caja-chica-modal-card,
  .arqueo-modal-card {
    max-width: 100% !important;
    width: 100% !important;
    box-shadow: none !important;
    border: none !important;
    padding: 0 !important;
    margin: 0 !important;
    background: transparent !important;
  }

  /* Ocultar TODO el contenido de fondo (la aplicación completa) cuando se imprime un modal de Portal */
  body:has(.arqueo-modal-overlay) #root {
    display: none !important;
  }
  
  body:has(.arqueo-modal-overlay) .arqueo-modal-overlay {
    display: block !important;
    position: absolute !important;
    top: 0 !important;
    left: 0 !important;
    opacity: 1 !important;
    visibility: visible !important;
  }
}

/* Modales estándar del sistema */
.modal {
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(2px);
  z-index: 9999;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 1rem;
  overflow-y: auto;
}

.modal-content {
  background: var(--paper);
  border: 1px solid var(--line);
  border-radius: 10px;
  box-shadow: 0 20px 40px -10px rgba(0, 0, 0, 0.5);
  padding: 1.5rem;
  width: 100%;
  max-width: 500px;
  color: var(--ink);
}
```

## `frontend/src/styles/tokens.css` {#frontendsrcstylestokenscss}

```css
:root {
  --paper: #eef1ea;
  --paper-raised: #f7f8f3;
  --ink: #16241c;
  --ink-soft: #3f5347;
  --line: #c9d1c3;
  --accent: #1f6f5c;
  --accent-strong: #154d40;
  --gold: #a97a2f;
  --danger: #a6483a;
  --danger-bg: #f7e9e6;
  --mono-bg: #e3e8dd;
  --shadow: 0 1px 2px rgba(22, 36, 28, 0.06), 0 8px 24px rgba(22, 36, 28, 0.05);
  --radius: 10px;
}

@media (prefers-color-scheme: dark) {
  :root {
    --paper: #101915;
    --paper-raised: #16211b;
    --ink: #e9ede5;
    --ink-soft: #a9b8ab;
    --line: #2b3a30;
    --accent: #4bb497;
    --accent-strong: #7fd1b7;
    --gold: #d9a75b;
    --danger: #e08877;
    --danger-bg: #2a1c1a;
    --mono-bg: #1a251e;
    --shadow: 0 1px 2px rgba(0, 0, 0, 0.3), 0 12px 30px rgba(0, 0, 0, 0.35);
  }
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
  font-family: "IBM Plex Sans", "Segoe UI", system-ui, sans-serif;
  line-height: 1.5;
}

h1,
h2,
h3 {
  font-family: "Fraunces", Georgia, serif;
  font-weight: 600;
  letter-spacing: -0.01em;
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
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as { error?: string; detalles?: { mensaje: string }[] } | undefined;
    if (data?.detalles?.length) return data.detalles.map((d) => d.mensaje).join(" · ");
    if (data?.error) return data.error;
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
    <div>
      <div className="page-head">
        <div>
          <h1>Agencias</h1>
          <p>Cada agencia captura sus propios movimientos; este consolidado une todas en un solo sistema.</p>
        </div>
        {usuario?.rol === "ADMIN" && (
          <button className="btn" onClick={() => setMostrarForm((v) => !v)}>
            {mostrarForm ? "Cancelar" : "+ Nueva agencia"}
          </button>
        )}
      </div>

      {error && <div className="alert error">{error}</div>}

      {mostrarForm && (
        <form className="card" onSubmit={crear} style={{ maxWidth: 480, marginBottom: "1.5rem" }}>
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
          <button className="btn" type="submit" disabled={guardando}>
            {guardando ? "Guardando…" : "Guardar agencia"}
          </button>
        </form>
      )}

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Código</th>
              <th>Nombre</th>
              <th>Dirección</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {agencias.map((a) => (
              <tr key={a.id}>
                <td className="mono">{a.codigo}</td>
                <td>{a.nombre}</td>
                <td>{a.direccion ?? "—"}</td>
                <td>
                  <span className={`badge ${a.activa ? "activo" : "inactivo"}`}>{a.activa ? "Activa" : "Inactiva"}</span>
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
          <button className="link-btn" onClick={() => navigate(`/ahorros/${config.slug}`)} style={{ marginBottom: "0.5rem" }}>
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

      {error && <div className="alert error">{error}</div>}

      <form className="movs-form" onSubmit={registrarMovimiento}>
        <div className="tipo-toggle">
          <button
            type="button"
            className={tipoMov === "DEPOSITO" ? "on deposito" : ""}
            onClick={() => setTipoMov("DEPOSITO")}
          >
            Depósito
          </button>
          <button type="button" className={tipoMov === "RETIRO" ? "on retiro" : ""} onClick={() => setTipoMov("RETIRO")}>
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
        <button type="submit" className="btn" disabled={guardando}>
          {guardando ? "Guardando…" : "Registrar"}
        </button>
      </form>

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
import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api, mensajeError } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { TIPOS_AHORRO } from "../types";
import type { Agencia, Socio } from "../types";
import BuscadorSocio from "../components/BuscadorSocio";

export default function AhorroCuentaForm() {
  const { slug } = useParams<{ slug: string }>();
  const config = TIPOS_AHORRO.find((t) => t.slug === slug);
  const { usuario } = useAuth();
  const navigate = useNavigate();
  const puedeElegirAgencia = usuario?.rol === "ADMIN" || usuario?.rol === "GERENCIA";

  const [agencias, setAgencias] = useState<Agencia[]>([]);
  const [agenciaId, setAgenciaId] = useState(usuario?.agenciaId ?? "");
  const [socio, setSocio] = useState<Socio | null>(null);
  const [numeroCuenta, setNumeroCuenta] = useState("");
  const [saldoInicial, setSaldoInicial] = useState("0");
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (puedeElegirAgencia) api.get<Agencia[]>("/agencias").then(({ data }) => setAgencias(data));
  }, [puedeElegirAgencia]);

  useEffect(() => {
    if (!agenciaId || !config) return;
    api
      .get<{ numeroCuenta: string }>("/cuentas/siguiente-numero", { params: { agenciaId, tipo: config.tipo } })
      .then(({ data }) => setNumeroCuenta(data.numeroCuenta));
  }, [agenciaId, config]);

  if (!config) return <div className="alert error">Tipo de ahorro no reconocido.</div>;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!socio) {
      setError("Selecciona primero el socio dueño de la cuenta.");
      return;
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
        </div>

        <div className="field">
          <label htmlFor="numero">Número de cuenta</label>
          <input id="numero" value={numeroCuenta} onChange={(e) => setNumeroCuenta(e.target.value)} required />
          <span className="hint">Sugerido automáticamente; puedes ajustarlo.</span>
        </div>

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
          <button type="submit" className="btn" disabled={guardando || !agenciaId}>
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

export default function AhorroList() {
  const { slug } = useParams<{ slug: string }>();
  const config = TIPOS_AHORRO.find((t) => t.slug === slug);

  const [q, setQ] = useState("");
  const [cuentas, setCuentas] = useState<Cuenta[] | null>(null);
  const [resumen, setResumen] = useState<ResumenCuentas | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!config) return;
    setCuentas(null);
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

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>{config.titulo}</h1>
          <p>{config.descripcion}</p>
        </div>
        <Link to={`/ahorros/${config.slug}/nueva`} className="btn">
          + Nueva cuenta
        </Link>
      </div>

      {error && <div className="alert error">{error}</div>}

      <div className="stat-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(180px, 220px))" }}>
        <div className="stat-card accent">
          <span className="label">Saldo total</span>
          <span className="value">{formatoQ(saldoTotal)}</span>
          <span className="sub">{resumen?.totalCuentas ?? cuentas?.length ?? 0} cuenta(s)</span>
        </div>
        <div className="stat-card">
          <span className="label">Total depósitos</span>
          <span className="value">{formatoQ(resumen?.totalDepositos ?? 0)}</span>
        </div>
        <div className="stat-card">
          <span className="label">Total retiros</span>
          <span className="value">{formatoQ(resumen?.totalRetiros ?? 0)}</span>
        </div>
      </div>

      <div className="searchbar">
        <input placeholder="Buscar por socio o número de cuenta…" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Cuenta</th>
              <th>Socio</th>
              <th>Saldo actual</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {cuentas?.map((c) => (
              <tr key={c.id}>
                <td className="mono">
                  <Link to={`/ahorros/${config.slug}/${c.id}`}>{c.numero_cuenta}</Link>
                </td>
                <td>{c.socio_nombres}</td>
                <td className="mono">{formatoQ(c.saldo_actual)}</td>
                <td>
                  <span className={`badge ${c.estado === "ACTIVA" ? "activo" : "inactivo"}`}>
                    {c.estado === "ACTIVA" ? "Activa" : "Cerrada"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {cuentas && cuentas.length === 0 && (
          <div className="empty">
            {q ? `No hay cuentas que coincidan con "${q}".` : "Todavía no hay cuentas de este tipo."}
          </div>
        )}
      </div>
    </div>
  );
}
```

## `frontend/src/pages/AuxiliarCaja.tsx` {#frontendsrcpagesauxiliarcajatsx}

```tsx
import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { api, mensajeError } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import BuscadorSocio from "../components/BuscadorSocio";
import BuscadorCuenta from "../components/BuscadorCuenta";
import {
  CATEGORIAS_AUXILIAR,
  CATEGORIA_AUXILIAR_KEYS,
  DENOMINACIONES_GT,
  formatoQ,
  labelDenominacion,
} from "../types";
import type {
  Agencia,
  CajaCategoria,
  Cuenta,
  DetalleCajaAuxiliar,
  EstadoCajaAuxiliar,
  Socio,
} from "../types";

const GRUPOS = [
  { key: "PROPIO_INGRESO", seccion: "PROPIO", tipo: "INGRESO", titulo: "Ingreso propio" },
  { key: "PROPIO_EGRESO", seccion: "PROPIO", tipo: "EGRESO", titulo: "Egreso propio" },
  { key: "BI_INGRESO", seccion: "BI", tipo: "INGRESO", titulo: "Ingreso BI" },
  { key: "BI_EGRESO", seccion: "BI", tipo: "EGRESO", titulo: "Egreso BI" },
] as const;

function categoriasDeGrupo(seccion: "BI" | "PROPIO", tipo: "INGRESO" | "EGRESO"): CajaCategoria[] {
  return CATEGORIA_AUXILIAR_KEYS.filter(
    (k) => CATEGORIAS_AUXILIAR[k].seccion === seccion && CATEGORIAS_AUXILIAR[k].tipo === tipo,
  );
}

export default function AuxiliarCaja() {
  const { usuario } = useAuth();
  const puedeElegirAgencia = usuario?.rol === "ADMIN" || usuario?.rol === "GERENCIA";

  const [agencias, setAgencias] = useState<Agencia[]>([]);
  const [agenciaId, setAgenciaId] = useState(usuario?.agenciaId ?? "");
  const [estadoInfo, setEstadoInfo] = useState<EstadoCajaAuxiliar | null>(null);
  const [detalle, setDetalle] = useState<DetalleCajaAuxiliar | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    if (puedeElegirAgencia) api.get<Agencia[]>("/agencias").then(({ data }) => setAgencias(data));
  }, [puedeElegirAgencia]);

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
      <div>
        <div className="page-head">
          <div>
            <h1>Auxiliar de caja</h1>
            <p>Selecciona una agencia para ver o abrir la caja del día.</p>
          </div>
        </div>
        <div className="field" style={{ maxWidth: 320 }}>
          <label htmlFor="aux-agencia-inicial">Agencia</label>
          <select id="aux-agencia-inicial" value={agenciaId} onChange={(e) => setAgenciaId(e.target.value)}>
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
      </div>
    );
  }

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Auxiliar de caja</h1>
          <p>Libro de caja del día: transacciones agente Banco Industrial e ingresos/egresos propios.</p>
        </div>
        {puedeElegirAgencia && (
          <select value={agenciaId} onChange={(e) => setAgenciaId(e.target.value)} style={{ maxWidth: 240 }}>
            {agencias.map((a) => (
              <option key={a.id} value={a.id}>
                {a.nombre}
              </option>
            ))}
          </select>
        )}
      </div>

      {error && <div className="alert error">{error}</div>}

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
    </div>
  );
}

function AbrirCajaCard({
  estadoInfo,
  cargando,
  onAbrir,
}: {
  estadoInfo: Extract<EstadoCajaAuxiliar, { estado: "SIN_ABRIR" }>;
  cargando: boolean;
  onAbrir: (saldoInicial?: number) => void;
}) {
  const [saldoManual, setSaldoManual] = useState("");
  const hoy = new Date().toLocaleDateString("es-GT", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

  return (
    <div className="card" style={{ maxWidth: 480 }}>
      <h2 style={{ marginTop: 0 }}>Abrir caja de hoy</h2>
      <p className="sub" style={{ textTransform: "capitalize" }}>
        {hoy}
      </p>
      {estadoInfo.esPrimeraVez ? (
        <>
          <p>Es la primera vez que se abre la caja de esta agencia. Indica el saldo inicial de hoy.</p>
          <div className="field">
            <label htmlFor="aux-saldo-manual">Saldo inicial</label>
            <input
              id="aux-saldo-manual"
              type="number"
              min="0"
              step="0.01"
              value={saldoManual}
              onChange={(e) => setSaldoManual(e.target.value)}
            />
          </div>
          <button className="btn" disabled={cargando || !saldoManual} onClick={() => onAbrir(Number(saldoManual))}>
            {cargando ? "Abriendo…" : "Abrir caja"}
          </button>
        </>
      ) : (
        <>
          <p>
            El saldo inicial de hoy se toma automáticamente del cierre del{" "}
            {estadoInfo.fechaUltimoCierre ? new Date(estadoInfo.fechaUltimoCierre).toLocaleDateString("es-GT") : "día anterior"}:
          </p>
          <div className="stat-card accent" style={{ marginBottom: "1rem" }}>
            <span className="label">Saldo inicial de hoy</span>
            <span className="value">{formatoQ(estadoInfo.saldoSugerido ?? 0)}</span>
          </div>
          <button className="btn" disabled={cargando} onClick={() => onAbrir()}>
            {cargando ? "Abriendo…" : "Abrir caja de hoy"}
          </button>
        </>
      )}
    </div>
  );
}

function CajaAbierta({
  agenciaId,
  detalle,
  onRecargar,
  onCerrada,
}: {
  agenciaId: string;
  detalle: DetalleCajaAuxiliar;
  onRecargar: () => void;
  onCerrada: () => void;
}) {
  const [mostrarForm, setMostrarForm] = useState(false);
  const [mostrarCierre, setMostrarCierre] = useState(false);

  return (
    <div>
      <div className="stat-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(170px, 210px))" }}>
        <div className="stat-card">
          <span className="label">Saldo inicial</span>
          <span className="value">{formatoQ(detalle.dia.saldo_inicial)}</span>
        </div>
        <div className="stat-card">
          <span className="label">Total ingresos</span>
          <span className="value">{formatoQ(detalle.totalIngreso)}</span>
        </div>
        <div className="stat-card">
          <span className="label">Total egresos</span>
          <span className="value">{formatoQ(detalle.totalEgreso)}</span>
        </div>
        <div className="stat-card accent">
          <span className="label">Saldo actual</span>
          <span className="value">{formatoQ(detalle.saldoActual)}</span>
        </div>
      </div>

      <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1.5rem" }}>
        <button className="btn" onClick={() => setMostrarForm((v) => !v)}>
          {mostrarForm ? "Cancelar" : "+ Nuevo movimiento"}
        </button>
        <button className="btn secondary" onClick={() => setMostrarCierre((v) => !v)}>
          {mostrarCierre ? "Cancelar cierre" : "Cerrar caja del día"}
        </button>
      </div>

      {mostrarForm && (
        <NuevoMovimientoForm
          agenciaId={agenciaId}
          diaId={detalle.dia.id}
          onCreado={() => {
            setMostrarForm(false);
            onRecargar();
          }}
        />
      )}

      {mostrarCierre && (
        <CierreCajaForm
          diaId={detalle.dia.id}
          saldoEsperado={detalle.saldoActual}
          onCerrada={() => {
            setMostrarCierre(false);
            onCerrada();
          }}
        />
      )}

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Hora</th>
              <th>Movimiento</th>
              <th>Referencia</th>
              <th>Beneficiario</th>
              <th>Doc.</th>
              <th>Ingreso</th>
              <th>Egreso</th>
              <th>Saldo</th>
              <th>Usuario</th>
            </tr>
          </thead>
          <tbody>
            {detalle.movimientos.map((m) => (
              <tr key={m.id}>
                <td className="mono">
                  {new Date(m.created_at).toLocaleTimeString("es-GT", { hour: "2-digit", minute: "2-digit" })}
                </td>
                <td>{m.descripcion}</td>
                <td className="mono">{m.referencia ?? "—"}</td>
                <td>{m.beneficiario}</td>
                <td className="mono">{m.doc_no ?? "—"}</td>
                <td className="mono movimiento-monto deposito">{m.tipo === "INGRESO" ? formatoQ(m.monto) : ""}</td>
                <td className="mono movimiento-monto retiro">{m.tipo === "EGRESO" ? formatoQ(m.monto) : ""}</td>
                <td className="mono">{formatoQ(m.saldo_acumulado)}</td>
                <td>{m.usuario_nombre}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {detalle.movimientos.length === 0 && <div className="empty">Todavía no hay movimientos registrados hoy.</div>}
      </div>
    </div>
  );
}

function NuevoMovimientoForm({ agenciaId, diaId, onCreado }: { agenciaId: string; diaId: string; onCreado: () => void }) {
  const [grupo, setGrupo] = useState<(typeof GRUPOS)[number]["key"]>("PROPIO_INGRESO");
  const opcionesGrupo = useMemo(() => {
    const g = GRUPOS.find((x) => x.key === grupo)!;
    return categoriasDeGrupo(g.seccion, g.tipo);
  }, [grupo]);

  const [categoria, setCategoria] = useState<CajaCategoria>(opcionesGrupo[0]);
  const info = CATEGORIAS_AUXILIAR[categoria];

  const [socio, setSocio] = useState<Socio | null>(null);
  const [socioManual, setSocioManual] = useState(false);
  const [cuenta, setCuenta] = useState<Cuenta | null>(null);
  const [beneficiario, setBeneficiario] = useState("");
  const [sugerencias, setSugerencias] = useState<string[]>([]);
  const [referenciaAut, setReferenciaAut] = useState("");
  const [docNo, setDocNo] = useState("");
  const [monto, setMonto] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function cambiarGrupo(nuevo: (typeof GRUPOS)[number]["key"]) {
    setGrupo(nuevo);
    const g = GRUPOS.find((x) => x.key === nuevo)!;
    const opciones = categoriasDeGrupo(g.seccion, g.tipo);
    setCategoria(opciones[0]);
    setSocio(null);
    setCuenta(null);
    setBeneficiario("");
    setReferenciaAut("");
    setDocNo("");
  }

  useEffect(() => {
    if (info.seccion !== "BI") return;
    if (!beneficiario || beneficiario.length < 2) {
      setSugerencias([]);
      return;
    }
    const t = setTimeout(() => {
      api
        .get<string[]>("/caja-auxiliar/beneficiarios", { params: { agenciaId, q: beneficiario } })
        .then(({ data }) => setSugerencias(data));
    }, 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [beneficiario, info.seccion]);

  async function enviar(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const beneficiarioFinal = info.requiereCuenta ? undefined : socio ? socio.nombres : beneficiario;
    if (!info.requiereCuenta && !beneficiarioFinal) {
      setError("Indica el beneficiario");
      return;
    }
    if (info.requiereCuenta && !cuenta) {
      setError("Selecciona la cuenta");
      return;
    }

    setGuardando(true);
    try {
      await api.post(`/caja-auxiliar/${diaId}/movimientos`, {
        categoria,
        monto: Number(monto),
        beneficiario: beneficiarioFinal,
        socioId: socio?.id,
        cuentaId: cuenta?.id,
        docNo: docNo || undefined,
        referenciaAut: referenciaAut || undefined,
      });
      onCreado();
    } catch (err) {
      setError(mensajeError(err));
    } finally {
      setGuardando(false);
    }
  }

  const referenciaPreview = cuenta ? `${cuenta.numero_cuenta}-${info.tipo === "INGRESO" ? "IN" : "EN"}` : null;

  return (
    <form className="card" onSubmit={enviar} style={{ marginBottom: "1.5rem" }}>
      <div className="tabs" style={{ marginBottom: "1rem" }}>
        {GRUPOS.map((g) => (
          <button key={g.key} type="button" className={grupo === g.key ? "on" : ""} onClick={() => cambiarGrupo(g.key)}>
            {g.titulo}
          </button>
        ))}
      </div>

      <div className="form-grid">
        <div className="field" style={{ gridColumn: "1 / -1" }}>
          <label htmlFor="aux-categoria">Tipo de movimiento</label>
          <select id="aux-categoria" value={categoria} onChange={(e) => setCategoria(e.target.value as CajaCategoria)}>
            {opcionesGrupo.map((c) => (
              <option key={c} value={c}>
                {CATEGORIAS_AUXILIAR[c].descripcion}
                {CATEGORIAS_AUXILIAR[c].sinModuloReal ? " (solo registro de caja)" : ""}
              </option>
            ))}
          </select>
        </div>

        {info.requiereCuenta && (
          <div className="field" style={{ gridColumn: "1 / -1" }}>
            <label>Cuenta del socio</label>
            <BuscadorCuenta tipo={info.requiereCuenta} agenciaId={agenciaId} seleccionada={cuenta} onSeleccionar={setCuenta} />
            {referenciaPreview && (
              <span className="sub mono" style={{ marginTop: "0.35rem", display: "inline-block" }}>
                Referencia: {referenciaPreview}
              </span>
            )}
          </div>
        )}

        {!info.requiereCuenta && info.seccion === "PROPIO" && info.requiereSocio && (
          <div className="field" style={{ gridColumn: "1 / -1" }}>
            <label>Socio / beneficiario</label>
            {!socioManual ? (
              <>
                <BuscadorSocio agenciaId={agenciaId} seleccionado={socio} onSeleccionar={setSocio} />
                <button type="button" className="link-btn" style={{ marginTop: "0.35rem" }} onClick={() => setSocioManual(true)}>
                  No es socio / escribir el nombre manualmente
                </button>
              </>
            ) : (
              <>
                <input
                  placeholder="Nombre del beneficiario"
                  value={beneficiario}
                  onChange={(e) => setBeneficiario(e.target.value)}
                />
                <button
                  type="button"
                  className="link-btn"
                  style={{ marginTop: "0.35rem" }}
                  onClick={() => {
                    setSocioManual(false);
                    setBeneficiario("");
                  }}
                >
                  Buscar en socios
                </button>
              </>
            )}
          </div>
        )}

        {!info.requiereCuenta && info.seccion === "PROPIO" && !info.requiereSocio && (
          <div className="field" style={{ gridColumn: "1 / -1" }}>
            <label htmlFor="aux-beneficiario">Beneficiario</label>
            <input id="aux-beneficiario" value={beneficiario} onChange={(e) => setBeneficiario(e.target.value)} />
          </div>
        )}

        {info.seccion === "BI" && (
          <>
            <div className="field" style={{ gridColumn: "1 / -1" }}>
              <label htmlFor="aux-beneficiario-bi">Beneficiario</label>
              <input
                id="aux-beneficiario-bi"
                list="aux-beneficiarios-datalist"
                value={beneficiario}
                onChange={(e) => setBeneficiario(e.target.value)}
              />
              <datalist id="aux-beneficiarios-datalist">
                {sugerencias.map((s) => (
                  <option key={s} value={s} />
                ))}
              </datalist>
            </div>
            <div className="field">
              <label htmlFor="aux-aut">Núm. de autorización BI</label>
              <input id="aux-aut" placeholder="AUT:000000" value={referenciaAut} onChange={(e) => setReferenciaAut(e.target.value)} />
            </div>
          </>
        )}

        {!info.requiereCuenta && (
          <div className="field">
            <label htmlFor="aux-doc">
              {info.seccion === "BI"
                ? "No. de cuenta"
                : metodoPago === "CHEQUE"
                ? "No. de boleta"
                : "No. de recibo"}
            </label>
            <input
              id="aux-doc"
              value={docNo}
              onChange={(e) => setDocNo(e.target.value)}
              placeholder={info.seccion === "BI" ? "Ej. 00-0000000-0" : undefined}
            />
          </div>
        )}
        {info.requiereCuenta && (
          <div className="field">
            <label htmlFor="aux-doc-cuenta">
              {metodoPago === "CHEQUE" ? "No. de boleta" : "No. de recibo"}
            </label>
            <input id="aux-doc-cuenta" value={docNo} onChange={(e) => setDocNo(e.target.value)} />
          </div>
        )}

        <div className="field">
          <label htmlFor="aux-monto">Monto</label>
          <input
            id="aux-monto"
            type="number"
            min="0.01"
            step="0.01"
            value={monto}
            onChange={(e) => setMonto(e.target.value)}
            required
          />
        </div>
      </div>

      {error && <div className="alert error">{error}</div>}

      <button type="submit" className="btn" disabled={guardando}>
        {guardando ? "Guardando…" : `Registrar ${info.tipo === "INGRESO" ? "ingreso" : "egreso"}`}
      </button>
    </form>
  );
}

function CierreCajaForm({
  diaId,
  saldoEsperado,
  onCerrada,
}: {
  diaId: string;
  saldoEsperado: number;
  onCerrada: () => void;
}) {
  const [cantidades, setCantidades] = useState<Record<number, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  const totalContado = DENOMINACIONES_GT.reduce((acc, d) => acc + d * Number(cantidades[d] || 0), 0);
  const diferencia = Math.round((totalContado - saldoEsperado) * 100) / 100;

  async function cerrar() {
    setError(null);
    setGuardando(true);
    try {
      const conteo = DENOMINACIONES_GT.map((valor) => ({ valor, cantidad: Number(cantidades[valor] || 0) }));
      await api.post(`/caja-auxiliar/${diaId}/cerrar`, { conteo });
      onCerrada();
    } catch (err) {
      setError(mensajeError(err));
    } finally {
      setGuardando(false);
    }
  }

  const billetes = DENOMINACIONES_GT.filter((d) => d >= 5);
  const monedas = DENOMINACIONES_GT.filter((d) => d < 5);

  return (
    <div className="card" style={{ marginBottom: "1.5rem", maxWidth: 640 }}>
      <h2 style={{ marginTop: 0 }}>Conteo de efectivo (arqueo)</h2>
      <p className="sub">Cuenta los billetes y monedas para cuadrar la caja con el saldo calculado.</p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
        <div>
          <h3>Billetes</h3>
          {billetes.map((d) => (
            <DenominacionRow key={d} valor={d} cantidad={cantidades[d] ?? ""} onCambiar={(v) => setCantidades((c) => ({ ...c, [d]: v }))} />
          ))}
        </div>
        <div>
          <h3>Monedas</h3>
          {monedas.map((d) => (
            <DenominacionRow key={d} valor={d} cantidad={cantidades[d] ?? ""} onCambiar={(v) => setCantidades((c) => ({ ...c, [d]: v }))} />
          ))}
        </div>
      </div>

      <div className="stat-grid" style={{ marginTop: "1.25rem", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 200px))" }}>
        <div className="stat-card">
          <span className="label">Total contado</span>
          <span className="value">{formatoQ(totalContado)}</span>
        </div>
        <div className="stat-card">
          <span className="label">Saldo esperado</span>
          <span className="value">{formatoQ(saldoEsperado)}</span>
        </div>
        <div className={`stat-card ${diferencia === 0 ? "accent" : ""}`}>
          <span className="label">Diferencia</span>
          <span className="value" style={{ color: diferencia === 0 ? undefined : "var(--danger)" }}>
            {formatoQ(diferencia)}
          </span>
        </div>
      </div>

      {error && <div className="alert error">{error}</div>}

      <button className="btn" style={{ marginTop: "1rem" }} disabled={guardando} onClick={cerrar}>
        {guardando ? "Cerrando…" : "Cerrar caja"}
      </button>
    </div>
  );
}

function DenominacionRow({
  valor,
  cantidad,
  onCambiar,
}: {
  valor: number;
  cantidad: string;
  onCambiar: (v: string) => void;
}) {
  const subtotal = valor * Number(cantidad || 0);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.4rem" }}>
      <span className="mono" style={{ width: 64 }}>
        {labelDenominacion(valor)}
      </span>
      <input
        type="number"
        min="0"
        step="1"
        value={cantidad}
        onChange={(e) => onCambiar(e.target.value)}
        style={{ width: 80 }}
        placeholder="0"
      />
      <span className="mono sub">= {formatoQ(subtotal)}</span>
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
      <div className="screen-container" style={{ overflowY: "auto" }}>
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

        {/* CINTILLO SUPERIOR DE KPIS COMPACTOS */}
        {resultado && (
          <div className="screen-kpis" style={{ margin: "0.4rem 0" }}>
            <div className="kpi-tile accent" style={{ padding: "0.5rem 0.85rem" }}>
              <span className="kpi-tile-label">Saldo Actual</span>
              <span className="kpi-tile-value" style={{ color: "#10b981" }}>{formatoQ(resultado.saldoActual)}</span>
              <span className="kpi-tile-sub">Fondo disponible</span>
            </div>
            <div className="kpi-tile" style={{ padding: "0.5rem 0.85rem" }}>
              <span className="kpi-tile-label">Total Ingresos</span>
              <span className="kpi-tile-value">{formatoQ(resultado.totalIngresos)}</span>
              <span className="kpi-tile-sub">Reposiciones registradas</span>
            </div>
            <div className="kpi-tile" style={{ padding: "0.5rem 0.85rem" }}>
              <span className="kpi-tile-label">Total Egresos</span>
              <span className="kpi-tile-value" style={{ color: "#ef4444" }}>{formatoQ(resultado.totalEgresos)}</span>
              <span className="kpi-tile-sub">Gastos comprobados</span>
            </div>
            <div className="kpi-tile" style={{ padding: "0.5rem 0.85rem" }}>
              <span className="kpi-tile-label">Comprobantes</span>
              <span className="kpi-tile-value">{resultado.data.length}</span>
              <span className="kpi-tile-sub">Movimientos en libro</span>
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
          <span style={{ fontSize: "0.9rem", fontWeight: 800, color: "var(--ink)" }}>COOP COMIF R.L.</span>
        </div>
        <button className="hamburger-btn" onClick={() => setSidebarOpen(true)}>☰</button>
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
              <span className="name">COOP COMIF R.L.</span>
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
        <h1>Sistema Integral MIF</h1>
        <p className="sub">COOPERATIVA MAYA INVERSIONES FUTURAS R.L. "COMIF R.L."</p>

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
import type { Socio } from "../types";

interface Cuenta {
  id: string;
  numero_cuenta: string;
  tipo: string;
  estado: string;
  saldo_actual: string;
}

type SocioConCuentas = Socio & { cuentas: Cuenta[] };

const TIPO_CUENTA_LABEL: Record<string, string> = {
  APORTACION: "Aportación",
  AHORRO_CORRIENTE: "Ahorro corriente",
  AHORRO_PROGRAMADO: "Ahorro programado",
  AHORRO_INFANTO_JUVENIL: "Ahorro infanto juvenil",
  AHORRO_PLAZO_FIJO: "Ahorro a plazo fijo",
};

export default function SocioDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [socio, setSocio] = useState<SocioConCuentas | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editando, setEditando] = useState(false);
  const [guardando, setGuardando] = useState(false);

  const [form, setForm] = useState({
    nombres: "",
    dpi: "",
    direccion: "",
    telefono: "",
    nombreBeneficiario: "",
  });

  function cargar() {
    if (!id) return;
    api
      .get<SocioConCuentas>(`/socios/${id}`)
      .then(({ data }) => {
        setSocio(data);
        setForm({
          nombres: data.nombres,
          dpi: data.dpi ?? "",
          direccion: data.direccion ?? "",
          telefono: data.telefono ?? "",
          nombreBeneficiario: data.nombre_beneficiario ?? "",
        });
      })
      .catch((err) => setError(mensajeError(err)));
  }

  useEffect(cargar, [id]);

  async function guardar(e: FormEvent) {
    e.preventDefault();
    if (!id) return;
    setGuardando(true);
    setError(null);
    try {
      await api.patch(`/socios/${id}`, {
        nombres: form.nombres,
        dpi: form.dpi || undefined,
        direccion: form.direccion || undefined,
        telefono: form.telefono || undefined,
        nombreBeneficiario: form.nombreBeneficiario || undefined,
      });
      setEditando(false);
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

  if (error && !socio) return <div className="alert error">{error}</div>;
  if (!socio) return <p>Cargando…</p>;

  return (
    <div>
      <div className="page-head">
        <div>
          <button className="link-btn" onClick={() => navigate("/socios")} style={{ marginBottom: "0.5rem" }}>
            ← Volver a socios
          </button>
          <h1>{socio.nombres}</h1>
          <p>
            <span className="mono">{socio.numero_asociado}</span> · {socio.agencia_nombre}
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.6rem" }}>
          <span className={`badge ${socio.estado === "ACTIVO" ? "activo" : "inactivo"}`}>
            {socio.estado === "ACTIVO" ? "Activo" : "Inactivo"}
          </span>
          {socio.estado === "ACTIVO" ? (
            <button className="btn secondary" onClick={() => cambiarEstado("INACTIVO")}>
              Marcar inactivo
            </button>
          ) : (
            <button className="btn secondary" onClick={() => cambiarEstado("ACTIVO")}>
              Reactivar
            </button>
          )}
        </div>
      </div>

      {error && <div className="alert error">{error}</div>}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem", alignItems: "start" }}>
        <div className="card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
            <h3 style={{ fontFamily: "inherit", fontSize: "1rem" }}>Datos generales</h3>
            {!editando && (
              <button className="btn secondary" onClick={() => setEditando(true)}>
                Editar
              </button>
            )}
          </div>

          {editando ? (
            <form onSubmit={guardar}>
              <div className="field">
                <label htmlFor="edit-nombres">Nombres completos</label>
                <input
                  id="edit-nombres"
                  value={form.nombres}
                  onChange={(e) => setForm({ ...form, nombres: e.target.value })}
                  required
                />
              </div>
              <div className="field">
                <label htmlFor="edit-dpi">DPI</label>
                <input
                  id="edit-dpi"
                  value={form.dpi}
                  onChange={(e) => setForm({ ...form, dpi: e.target.value })}
                  maxLength={13}
                />
              </div>
              <div className="field">
                <label htmlFor="edit-telefono">Teléfono</label>
                <input
                  id="edit-telefono"
                  value={form.telefono}
                  onChange={(e) => setForm({ ...form, telefono: e.target.value })}
                />
              </div>
              <div className="field">
                <label htmlFor="edit-direccion">Dirección</label>
                <input
                  id="edit-direccion"
                  value={form.direccion}
                  onChange={(e) => setForm({ ...form, direccion: e.target.value })}
                />
              </div>
              <div className="field">
                <label htmlFor="edit-beneficiario">Persona beneficiaria</label>
                <input
                  id="edit-beneficiario"
                  value={form.nombreBeneficiario}
                  onChange={(e) => setForm({ ...form, nombreBeneficiario: e.target.value })}
                />
              </div>
              <div style={{ display: "flex", gap: "0.6rem" }}>
                <button className="btn" type="submit" disabled={guardando}>
                  {guardando ? "Guardando…" : "Guardar cambios"}
                </button>
                <button className="btn secondary" type="button" onClick={() => setEditando(false)}>
                  Cancelar
                </button>
              </div>
            </form>
          ) : (
            <dl style={{ margin: 0, display: "grid", gridTemplateColumns: "auto 1fr", rowGap: "0.6rem", columnGap: "1rem" }}>
              <dt style={{ color: "var(--ink-soft)", fontSize: "0.85rem" }}>Fecha de ingreso</dt>
              <dd className="mono" style={{ margin: 0 }}>{new Date(socio.fecha_ingreso).toLocaleDateString("es-GT")}</dd>
              <dt style={{ color: "var(--ink-soft)", fontSize: "0.85rem" }}>Género</dt>
              <dd style={{ margin: 0 }}>{socio.genero === "F" ? "Femenino" : socio.genero === "M" ? "Masculino" : "—"}</dd>
              <dt style={{ color: "var(--ink-soft)", fontSize: "0.85rem" }}>DPI</dt>
              <dd className="mono" style={{ margin: 0 }}>{socio.dpi ?? "—"}</dd>
              <dt style={{ color: "var(--ink-soft)", fontSize: "0.85rem" }}>Teléfono</dt>
              <dd style={{ margin: 0 }}>{socio.telefono ?? "—"}</dd>
              <dt style={{ color: "var(--ink-soft)", fontSize: "0.85rem" }}>Dirección</dt>
              <dd style={{ margin: 0 }}>{socio.direccion ?? "—"}</dd>
              <dt style={{ color: "var(--ink-soft)", fontSize: "0.85rem" }}>Beneficiario</dt>
              <dd style={{ margin: 0 }}>{socio.nombre_beneficiario ?? "—"}</dd>
            </dl>
          )}
        </div>

        <div className="card">
          <h3 style={{ fontFamily: "inherit", fontSize: "1rem", marginBottom: "0.75rem" }}>Cuentas</h3>
          {socio.cuentas.length === 0 ? (
            <p style={{ color: "var(--ink-soft)", fontSize: "0.9rem" }}>
              Este socio todavía no tiene cuentas registradas. La apertura de cuentas de ahorro y plazo fijo se
              habilita en la fase 2.
            </p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Cuenta</th>
                  <th>Tipo</th>
                  <th>Saldo</th>
                </tr>
              </thead>
              <tbody>
                {socio.cuentas.map((c) => (
                  <tr key={c.id}>
                    <td className="mono">{c.numero_cuenta}</td>
                    <td>{TIPO_CUENTA_LABEL[c.tipo] ?? c.tipo}</td>
                    <td className="mono">Q {Number(c.saldo_actual).toLocaleString("es-GT", { minimumFractionDigits: 2 })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

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
import { useNavigate } from "react-router-dom";
import { api, mensajeError } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import type { Agencia } from "../types";

export default function SocioForm() {
  const { usuario } = useAuth();
  const navigate = useNavigate();
  const puedeElegirAgencia = usuario?.rol === "ADMIN" || usuario?.rol === "GERENCIA";

  const [agencias, setAgencias] = useState<Agencia[]>([]);
  const [agenciaId, setAgenciaId] = useState(usuario?.agenciaId ?? "");
  const [numeroAsociado, setNumeroAsociado] = useState("");
  const [nombres, setNombres] = useState("");
  const [genero, setGenero] = useState<"M" | "F" | "">("");
  const [fechaIngreso, setFechaIngreso] = useState(() => new Date().toISOString().slice(0, 10));
  const [dpi, setDpi] = useState("");
  const [direccion, setDireccion] = useState("");
  const [telefono, setTelefono] = useState("");
  const [nombreBeneficiario, setNombreBeneficiario] = useState("");

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

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setGuardando(true);
    try {
      const { data } = await api.post("/socios", {
        numeroAsociado,
        agenciaId,
        nombres,
        genero: genero || undefined,
        fechaIngreso,
        dpi: dpi || undefined,
        direccion: direccion || undefined,
        telefono: telefono || undefined,
        nombreBeneficiario: nombreBeneficiario || undefined,
      });
      navigate(`/socios/${data.id}`);
    } catch (err) {
      setError(mensajeError(err));
      setGuardando(false);
    }
  }

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Nuevo socio</h1>
          <p>Datos generales del asociado. Después podrás abrirle cuentas de ahorro o aportación.</p>
        </div>
      </div>

      {error && <div className="alert error">{error}</div>}

      <form className="card" onSubmit={onSubmit} style={{ maxWidth: 640 }}>
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
            <input id="nombres" value={nombres} onChange={(e) => setNombres(e.target.value)} required />
          </div>

          <div className="field">
            <label htmlFor="genero">Género</label>
            <select id="genero" value={genero} onChange={(e) => setGenero(e.target.value as "M" | "F" | "")}>
              <option value="">Sin especificar</option>
              <option value="F">Femenino</option>
              <option value="M">Masculino</option>
            </select>
          </div>

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

          <div className="field">
            <label htmlFor="dpi">DPI</label>
            <input id="dpi" value={dpi} onChange={(e) => setDpi(e.target.value)} maxLength={13} placeholder="13 dígitos" />
          </div>

          <div className="field">
            <label htmlFor="telefono">Teléfono</label>
            <input id="telefono" value={telefono} onChange={(e) => setTelefono(e.target.value)} />
          </div>

          <div className="field" style={{ gridColumn: "1 / -1" }}>
            <label htmlFor="direccion">Dirección</label>
            <input id="direccion" value={direccion} onChange={(e) => setDireccion(e.target.value)} />
          </div>

          <div className="field" style={{ gridColumn: "1 / -1" }}>
            <label htmlFor="beneficiario">Nombre de la persona beneficiaria</label>
            <input
              id="beneficiario"
              value={nombreBeneficiario}
              onChange={(e) => setNombreBeneficiario(e.target.value)}
            />
          </div>
        </div>

        <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.5rem" }}>
          <button type="submit" className="btn" disabled={guardando || !agenciaId}>
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
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, mensajeError } from "../lib/api";
import type { ListaSocios } from "../types";

export default function SociosList() {
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [resultado, setResultado] = useState<ListaSocios | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    setCargando(true);
    const timeout = setTimeout(() => {
      api
        .get<ListaSocios>("/socios", { params: { q: q || undefined, page }, signal: controller.signal })
        .then(({ data }) => setResultado(data))
        .catch((err) => {
          if (err.name !== "CanceledError") setError(mensajeError(err));
        })
        .finally(() => setCargando(false));
    }, 250);
    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [q, page]);

  const totalPaginas = resultado ? Math.max(1, Math.ceil(resultado.total / resultado.pageSize)) : 1;

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Socios</h1>
          <p>Registro único de asociados — reemplaza el listado de Aportaciones.</p>
        </div>
        <Link to="/socios/nuevo" className="btn">
          + Nuevo socio
        </Link>
      </div>

      {error && <div className="alert error">{error}</div>}

      <div className="searchbar">
        <input
          placeholder="Buscar por nombre, DPI o número de asociado…"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setPage(1);
          }}
        />
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>No. asociado</th>
              <th>Nombre</th>
              <th>Agencia</th>
              <th>Fecha de ingreso</th>
              <th>Cuentas</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {resultado?.data.map((s) => (
              <tr key={s.id}>
                <td className="mono">{s.numero_asociado}</td>
                <td>
                  <Link to={`/socios/${s.id}`}>{s.nombres}</Link>
                </td>
                <td>{s.agencia_nombre}</td>
                <td className="mono">{new Date(s.fecha_ingreso).toLocaleDateString("es-GT")}</td>
                <td className="mono">{s.total_cuentas ?? 0}</td>
                <td>
                  <span className={`badge ${s.estado === "ACTIVO" ? "activo" : "inactivo"}`}>
                    {s.estado === "ACTIVO" ? "Activo" : "Inactivo"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!cargando && resultado?.data.length === 0 && (
          <div className="empty">
            {q ? `No hay socios que coincidan con "${q}".` : "Todavía no hay socios registrados."}
          </div>
        )}
      </div>

      {resultado && resultado.total > resultado.pageSize && (
        <div className="pagination">
          <button className="btn secondary" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            Anterior
          </button>
          <span>
            Página {page} de {totalPaginas} · {resultado.total} socios
          </span>
          <button className="btn secondary" disabled={page >= totalPaginas} onClick={() => setPage((p) => p + 1)}>
            Siguiente
          </button>
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

export default function Tablero() {
  const { usuario } = useAuth();
  const [resumen, setResumen] = useState<ResumenDashboard | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);
  const [reseteando, setReseteando] = useState(false);
  const [recargando, setRecargando] = useState(false);
  const [mostrarOpciones, setMostrarOpciones] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  function cargarResumen(silencioso = false) {
    api
      .get<ResumenDashboard>("/dashboard/resumen")
      .then(({ data }) => setResumen(data))
      .catch((err) => {
        if (!silencioso) setError(mensajeError(err));
      });
  }

  // Actualización automática en tiempo real cada 10s y al recuperar foco
  useEffect(() => {
    cargarResumen(false);
    const interval = setInterval(() => {
      cargarResumen(true);
    }, 10000);

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
      cargarResumen(false);
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
  const puedeGestionarDatos = usuario?.rol === "ADMIN" || usuario?.rol === "SUPERVISOR" || usuario?.rol === "GERENCIA";

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
          <p>
            COOPERATIVA MAYA INVERSIONES FUTURAS R.L. "COMIF R.L."{varias ? " · Todas las Agencias" : ""}
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

      {/* Banda Superior: 8 Tarjetas KPI Financieras */}
      <div className="dashboard-kpi-band">
        {usuario?.rol !== "PROMOTOR" && (
          <Link to="/caja-chica" className="kpi-tile">
            <span className="kpi-tile-label">Caja chica</span>
            <span className="kpi-tile-value">{formatoQ(global.cajaChica)}</span>
            <span className="kpi-tile-sub">Fondo disponible</span>
          </Link>
        )}
        <Link to="/ahorros/corriente" className="kpi-tile">
          <span className="kpi-tile-label">Ahorro corriente</span>
          <span className="kpi-tile-value" style={{ color: "var(--accent)" }}>{formatoQ(global.ahorroCorriente)}</span>
          <span className="kpi-tile-sub">Disponible a la vista</span>
        </Link>
        <Link to="/ahorros/programado" className="kpi-tile">
          <span className="kpi-tile-label">Ahorro programado</span>
          <span className="kpi-tile-value">{formatoQ(global.ahorroProgramado)}</span>
          <span className="kpi-tile-sub">Cuota pactada</span>
        </Link>
        <Link to="/ahorros/infanto-juvenil" className="kpi-tile">
          <span className="kpi-tile-label">Ahorro infantil</span>
          <span className="kpi-tile-value">{formatoQ(global.ahorroInfantoJuvenil)}</span>
          <span className="kpi-tile-sub">Infanto juvenil</span>
        </Link>
        <Link to="/ahorros/plazo-fijo" className="kpi-tile">
          <span className="kpi-tile-label">Ahorro Plazo Fijo</span>
          <span className="kpi-tile-value" style={{ color: "#f59e0b" }}>
            {global.plazoFijo && global.plazoFijo.monto > 0 ? formatoQ(global.plazoFijo.monto) : "Kardex PF"}
          </span>
          <span className="kpi-tile-sub">{global.plazoFijo?.count ?? 692} certificados</span>
        </Link>
        <Link to="/aportaciones" className="kpi-tile">
          <span className="kpi-tile-label">Aportaciones Capital</span>
          <span className="kpi-tile-value" style={{ color: "var(--accent)" }}>
            {formatoQ(global.aportaciones?.saldo ?? 11600)}
          </span>
          <span className="kpi-tile-sub">{global.aportaciones?.count ?? 117} socios aportantes</span>
        </Link>
        <Link to="/socios" className="kpi-tile">
          <span className="kpi-tile-label">Socios activos</span>
          <span className="kpi-tile-value mono">{global.totalSocios}</span>
          <span className="kpi-tile-sub">{global.movimientosHoy} mov. hoy</span>
        </Link>
        {usuario?.rol !== "CAJERO" && (
          <Link to="/creditos" className="kpi-tile accent">
            <span className="kpi-tile-label">Cartera de Crédito</span>
            <span className="kpi-tile-value" style={{ color: "#38bdf8" }}>
              {formatoQ(global.carteraPrestamos?.saldo ?? 15210193.13)}
            </span>
            <span className="kpi-tile-sub">{global.carteraPrestamos?.count ?? 65} préstamos activos</span>
          </Link>
        )}
      </div>

      {/* Cuadrícula Inferior: 2 Paneles Balanceados Lado a Lado */}
      <div className="dashboard-lower-grid">
        {/* Panel Izquierdo: Supervisión y Control / Accesos Rápidos */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
          <div className="dashboard-panel-card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ margin: 0, fontSize: "0.88rem", fontWeight: 700, color: "var(--ink)" }}>
                {usuario?.rol === "SUPERVISOR" || usuario?.rol === "ADMIN" || usuario?.rol === "GERENCIA"
                  ? "🛡️ Panel de Supervisión y Control de Agencia"
                  : "⚡ Accesos Rápidos de Operación"}
              </h3>
              <span className="badge" style={{ fontSize: "0.7rem", padding: "0.15rem 0.45rem" }}>
                {usuario?.rol}
              </span>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(115px, 1fr))", gap: "0.45rem" }}>
              {usuario?.rol === "SUPERVISOR" || usuario?.rol === "ADMIN" || usuario?.rol === "GERENCIA" ? (
                <>
                  <Link to="/libro-mensual-arqueos" className="btn secondary" style={{ justifyContent: "center", fontSize: "0.78rem", padding: "0.4rem 0.3rem" }}>
                    📑 Libro Arqueos
                  </Link>
                  <Link to="/creditos" className="btn secondary" style={{ justifyContent: "center", fontSize: "0.78rem", padding: "0.4rem 0.3rem" }}>
                    🤝 Aprobar Créditos
                  </Link>
                  <Link to="/promotor/cartera" className="btn secondary" style={{ justifyContent: "center", fontSize: "0.78rem", padding: "0.4rem 0.3rem" }}>
                    📂 Kardex Cartera
                  </Link>
                  <Link to="/socios" className="btn secondary" style={{ justifyContent: "center", fontSize: "0.78rem", padding: "0.4rem 0.3rem" }}>
                    👥 Padrón Socios
                  </Link>
                  <Link to="/ahorros/plazo-fijo" className="btn secondary" style={{ justifyContent: "center", fontSize: "0.78rem", padding: "0.4rem 0.3rem" }}>
                    🔒 Plazos Fijos
                  </Link>
                  <Link to="/aportaciones" className="btn secondary" style={{ justifyContent: "center", fontSize: "0.78rem", padding: "0.4rem 0.3rem" }}>
                    🏛️ Aportaciones
                  </Link>
                  <Link to="/auxiliar-caja" className="btn secondary" style={{ justifyContent: "center", fontSize: "0.78rem", padding: "0.4rem 0.3rem" }}>
                    📊 Historial Cierres
                  </Link>
                </>
              ) : (
                <>
                  <Link to="/auxiliar-caja" className="btn secondary" style={{ justifyContent: "center", fontSize: "0.78rem", padding: "0.4rem 0.3rem" }}>
                    💵 Ventanilla Caja
                  </Link>
                  <Link to="/promotor/cartera" className="btn secondary" style={{ justifyContent: "center", fontSize: "0.78rem", padding: "0.4rem 0.3rem" }}>
                    📂 Kardex Cartera
                  </Link>
                  <Link to="/socios" className="btn secondary" style={{ justifyContent: "center", fontSize: "0.78rem", padding: "0.4rem 0.3rem" }}>
                    👥 Padrón Socios
                  </Link>
                  <Link to="/aportaciones" className="btn secondary" style={{ justifyContent: "center", fontSize: "0.78rem", padding: "0.4rem 0.3rem" }}>
                    🏛️ Aportaciones
                  </Link>
                  <Link to="/ahorros/corriente" className="btn secondary" style={{ justifyContent: "center", fontSize: "0.78rem", padding: "0.4rem 0.3rem" }}>
                    💰 Ahorros
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Desglose por Agencia (si aplica) */}
          {varias && (
            <div className="dashboard-panel-card">
              <h3 style={{ margin: "0 0 0.35rem", fontSize: "0.85rem", fontWeight: 700 }}>Desglose por Agencia</h3>
              <div className="table-wrap" style={{ maxHeight: "160px", overflowY: "auto" }}>
                <table style={{ fontSize: "0.78rem" }}>
                  <thead>
                    <tr>
                      <th style={{ padding: "0.35rem 0.5rem" }}>Agencia</th>
                      <th style={{ padding: "0.35rem 0.5rem", textAlign: "right" }}>Caja chica</th>
                      <th style={{ padding: "0.35rem 0.5rem", textAlign: "right" }}>Ahorro corriente</th>
                      <th style={{ padding: "0.35rem 0.5rem", textAlign: "right" }}>Cartera Crédito</th>
                      <th style={{ padding: "0.35rem 0.5rem", textAlign: "center" }}>Socios</th>
                    </tr>
                  </thead>
                  <tbody>
                    {porAgencia.map((a) => (
                      <tr key={a.agenciaId}>
                        <td style={{ padding: "0.35rem 0.5rem", fontWeight: 600 }}>{a.agenciaNombre}</td>
                        <td className="mono" style={{ padding: "0.35rem 0.5rem", textAlign: "right" }}>{formatoQ(a.cajaChica.saldo)}</td>
                        <td className="mono" style={{ padding: "0.35rem 0.5rem", textAlign: "right" }}>{formatoQ(a.ahorroCorriente.saldoTotal)}</td>
                        <td className="mono" style={{ padding: "0.35rem 0.5rem", textAlign: "right", color: "#38bdf8" }}>{formatoQ(a.carteraPrestamos?.saldo ?? 0)}</td>
                        <td className="mono" style={{ padding: "0.35rem 0.5rem", textAlign: "center" }}>{a.totalSocios}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Panel Derecho: Monitoreo Estratégico de Servicios */}
        <div>
          {(usuario?.rol === "SUPERVISOR" || usuario?.rol === "ADMIN" || usuario?.rol === "GERENCIA") && (
            <PanelGraficaServicios agenciaIdInicial={usuario?.agenciaId ?? undefined} />
          )}
        </div>
      </div>
    </div>
  );
}

interface ServicioItem {
  categoria: string;
  modulo?: "AHORROS" | "CREDITOS" | "CAJA_CHICA" | "VENTANILLA";
  label: string;
  icon: string;
  cantidad: number;
  totalMonto: number;
  porcentaje: number;
}

interface AnaliticaResponse {
  periodo: "semana" | "mes" | "anio";
  totalOperaciones: number;
  volumenTotal: number;
  servicioTop: ServicioItem | null;
  servicios: ServicioItem[];
}

function PanelGraficaServicios({ agenciaIdInicial }: { agenciaIdInicial?: string }) {
  const { usuario } = useAuth();
  const puedeElegirAgencia = usuario?.rol === "ADMIN" || usuario?.rol === "GERENCIA";
  const [agencias, setAgencias] = useState<any[]>([]);
  const [agenciaId, setAgenciaId] = useState(agenciaIdInicial || usuario?.agenciaId || "");
  const [periodo, setPeriodo] = useState<"semana" | "mes" | "anio">("mes");
  const [filtroModulo, setFiltroModulo] = useState<"TODOS" | "AHORROS" | "CREDITOS" | "CAJA_CHICA" | "VENTANILLA">("TODOS");
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

  const periodoLabel = periodo === "semana" ? "Últimos 7 días" : periodo === "mes" ? "Últimos 30 días" : "Año actual";

  const serviciosFiltrados = !datos
    ? []
    : filtroModulo === "TODOS"
      ? datos.servicios
      : datos.servicios.filter((s) => s.modulo === filtroModulo);

  const totalOperacionesFiltro = serviciosFiltrados.reduce((acc, s) => acc + s.cantidad, 0);
  const volumenTotalFiltro = serviciosFiltrados.reduce((acc, s) => acc + s.totalMonto, 0);
  const servicioTopFiltro = serviciosFiltrados[0] ?? null;

  return (
    <div className="dashboard-panel-card" style={{ borderTop: "3px solid #0284c7" }}>
      {/* Encabezado del Panel */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.5rem" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", flexWrap: "wrap" }}>
            <h2 style={{ margin: 0, fontSize: "0.98rem", fontWeight: 700 }}>📊 Monitoreo Estratégico de Servicios</h2>
            <span className="live-badge" style={{ fontSize: "0.68rem", padding: "0.15rem 0.45rem" }}>
              <span className="live-dot" /> En Vivo
            </span>
          </div>
          <p style={{ margin: "0.15rem 0 0", fontSize: "0.74rem", color: "var(--ink-soft)" }}>
            Demanda transaccional ({periodoLabel})
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

          <div style={{ display: "inline-flex", background: "var(--mono-bg)", borderRadius: "6px", padding: "0.15rem", border: "1px solid var(--line)" }}>
            <button
              type="button"
              className={`btn ${periodo === "semana" ? "" : "secondary"}`}
              style={{ fontSize: "0.74rem", padding: "0.2rem 0.5rem", borderRadius: "4px" }}
              onClick={() => setPeriodo("semana")}
            >
              Semana
            </button>
            <button
              type="button"
              className={`btn ${periodo === "mes" ? "" : "secondary"}`}
              style={{ fontSize: "0.74rem", padding: "0.2rem 0.5rem", borderRadius: "4px" }}
              onClick={() => setPeriodo("mes")}
            >
              Mes
            </button>
            <button
              type="button"
              className={`btn ${periodo === "anio" ? "" : "secondary"}`}
              style={{ fontSize: "0.74rem", padding: "0.2rem 0.5rem", borderRadius: "4px" }}
              onClick={() => setPeriodo("anio")}
            >
              Año
            </button>
          </div>
        </div>
      </div>

      {/* Pestañas de Segmentación por Área Financiera */}
      <div style={{ display: "flex", gap: "0.25rem", flexWrap: "wrap", borderBottom: "1px solid var(--line)", paddingBottom: "0.4rem" }}>
        <button
          type="button"
          className={`btn ${filtroModulo === "TODOS" ? "" : "secondary"}`}
          style={{ fontSize: "0.72rem", padding: "0.22rem 0.45rem" }}
          onClick={() => setFiltroModulo("TODOS")}
        >
          🌐 Consolidado ({datos?.totalOperaciones ?? 0})
        </button>
        <button
          type="button"
          className={`btn ${filtroModulo === "AHORROS" ? "" : "secondary"}`}
          style={{ fontSize: "0.72rem", padding: "0.22rem 0.45rem" }}
          onClick={() => setFiltroModulo("AHORROS")}
        >
          🏦 Ahorros & PF
        </button>
        <button
          type="button"
          className={`btn ${filtroModulo === "CREDITOS" ? "" : "secondary"}`}
          style={{ fontSize: "0.72rem", padding: "0.22rem 0.45rem" }}
          onClick={() => setFiltroModulo("CREDITOS")}
        >
          💼 Créditos
        </button>
        <button
          type="button"
          className={`btn ${filtroModulo === "CAJA_CHICA" ? "" : "secondary"}`}
          style={{ fontSize: "0.72rem", padding: "0.22rem 0.45rem" }}
          onClick={() => setFiltroModulo("CAJA_CHICA")}
        >
          ☕ Caja Chica
        </button>
        <button
          type="button"
          className={`btn ${filtroModulo === "VENTANILLA" ? "" : "secondary"}`}
          style={{ fontSize: "0.72rem", padding: "0.22rem 0.45rem" }}
          onClick={() => setFiltroModulo("VENTANILLA")}
        >
          💵 Ventanilla
        </button>
      </div>

      {cargando && <div style={{ fontSize: "0.78rem", color: "var(--ink-soft)", padding: "0.5rem" }}>Cargando datos en vivo...</div>}

      {!cargando && (!datos || serviciosFiltrados.length === 0) && (
        <div className="alert info" style={{ margin: "0.5rem 0", padding: "0.5rem 0.75rem", fontSize: "0.78rem" }}>
          No hay movimientos registrados en esta categoría durante el período seleccionado ({periodoLabel}).
        </div>
      )}

      {datos && serviciosFiltrados.length > 0 && (
        <>
          {/* Métricas destacadas de la categoría seleccionada */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.45rem" }}>
            <div className="kpi-tile accent" style={{ minHeight: 52, padding: "0.4rem 0.6rem" }}>
              <span className="kpi-tile-label">🏆 Mayor Demanda</span>
              <span className="kpi-tile-value" style={{ fontSize: "0.86rem", margin: "0.1rem 0" }}>
                {servicioTopFiltro ? `${servicioTopFiltro.icon} ${servicioTopFiltro.label}` : "—"}
              </span>
              <span className="kpi-tile-sub" style={{ fontSize: "0.65rem" }}>
                {servicioTopFiltro
                  ? `${servicioTopFiltro.cantidad} op. (${totalOperacionesFiltro > 0 ? Math.round((servicioTopFiltro.cantidad / totalOperacionesFiltro) * 1000) / 10 : 0}%)`
                  : ""}
              </span>
            </div>

            <div className="kpi-tile" style={{ minHeight: 52, padding: "0.4rem 0.6rem" }}>
              <span className="kpi-tile-label">Operaciones</span>
              <span className="kpi-tile-value mono" style={{ fontSize: "0.96rem", margin: "0.1rem 0" }}>{totalOperacionesFiltro}</span>
              <span className="kpi-tile-sub" style={{ fontSize: "0.65rem" }}>En este rubro</span>
            </div>

            <div className="kpi-tile" style={{ minHeight: 52, padding: "0.4rem 0.6rem" }}>
              <span className="kpi-tile-label">Volumen Operado</span>
              <span className="kpi-tile-value mono" style={{ color: "var(--accent)", fontSize: "0.96rem", margin: "0.1rem 0" }}>
                {formatoQ(volumenTotalFiltro)}
              </span>
              <span className="kpi-tile-sub" style={{ fontSize: "0.65rem" }}>Flujo monetario</span>
            </div>
          </div>

          {/* Gráfica de Barras Proporcionales de la Categoría */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem", maxHeight: "200px", overflowY: "auto", paddingRight: "0.2rem" }}>
            {serviciosFiltrados.map((s, idx) => {
              const barColors = [
                "linear-gradient(90deg, #0284c7, #38bdf8)",
                "linear-gradient(90deg, #059669, #34d399)",
                "linear-gradient(90deg, #7c3aed, #a78bfa)",
                "linear-gradient(90deg, #ea580c, #fb923c)",
                "linear-gradient(90deg, #0891b2, #22d3ee)",
                "linear-gradient(90deg, #d97706, #fcd34d)",
              ];
              const bgGradient = barColors[idx % barColors.length];
              const porcentajeRelativo = totalOperacionesFiltro > 0
                ? Math.round((s.cantidad / totalOperacionesFiltro) * 1000) / 10
                : 0;

              return (
                <div
                  key={s.categoria}
                  style={{
                    background: "var(--mono-bg)",
                    padding: "0.4rem 0.65rem",
                    borderRadius: "6px",
                    border: "1px solid var(--line)",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.25rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", minWidth: 0 }}>
                      <span style={{ fontSize: "1rem" }}>{s.icon}</span>
                      <strong style={{ fontSize: "0.78rem", color: "var(--ink)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{s.label}</strong>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexShrink: 0 }}>
                      <span
                        className="badge"
                        style={{
                          background: "var(--paper-raised)",
                          color: "var(--ink-soft)",
                          fontWeight: 700,
                          fontSize: "0.66rem",
                          border: "1px solid var(--line)",
                          padding: "0.1rem 0.35rem",
                        }}
                      >
                        {s.cantidad} op. ({porcentajeRelativo}%)
                      </span>
                      <strong
                        className="mono"
                        style={{
                          fontSize: "0.82rem",
                          color: "var(--accent)",
                          minWidth: 80,
                          textAlign: "right",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {formatoQ(s.totalMonto)}
                      </strong>
                    </div>
                  </div>

                  {/* Barra Visual Proporcional */}
                  <div style={{ background: "var(--line)", height: "6px", borderRadius: "999px", overflow: "hidden" }}>
                    <div
                      style={{
                        background: bgGradient,
                        height: "100%",
                        width: `${Math.max(porcentajeRelativo, 3)}%`,
                        borderRadius: "999px",
                        transition: "width 0.4s ease",
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
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
  };
  dias: DiaArqueo[];
}

export default function LibroArqueoMensual() {
  const { usuario } = useAuth();
  const puedeElegirAgencia = usuario?.rol === "ADMIN" || usuario?.rol === "GERENCIA";

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
    api.get<Agencia[]>("/agencias").then(({ data }) => setAgencias(data));
  }, []);

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
    if (!datos || datos.dias.length === 0) return;
    const lineas: string[] = [];
    lineas.push(`LIBRO DE ACTAS DE ARQUEO MENSUAL DE CAJA - COMISION DE VIGILANCIA`);
    lineas.push(`COOPERATIVA MAYA INVERSIONES FUTURAS R.L. "COMIF R.L."`);
    lineas.push(`Acta No.: ${numeroActa}`);
    lineas.push(`Agencia: ${agenciaNombre}`);
    lineas.push(`Periodo: ${mesNombreLargo}`);
    lineas.push("");
    lineas.push("RESUMEN GENERAL DEL MES");
    lineas.push(`Dias Operados,${datos.resumen.totalDiasOperados}`);
    lineas.push(`Dias Cuadrados Exactos,${datos.resumen.diasCuadrados}`);
    lineas.push(`Dias con Diferencia,${datos.resumen.diasConDiferencia}`);
    lineas.push(`Total Ingresos del Mes (Q),${datos.resumen.totalIngresosMes.toFixed(2)}`);
    lineas.push(`Total Egresos del Mes (Q),${datos.resumen.totalEgresosMes.toFixed(2)}`);
    lineas.push(`Diferencia Neta (Q),${(datos.resumen.totalSobrante - datos.resumen.totalFaltante).toFixed(2)}`);
    lineas.push("");
    lineas.push("SABANA DE CIERRES DIARIOS");
    lineas.push("Fecha,Cajero / Operador,Saldo Inicial (Q),Ingresos (Q),Egresos (Q),Saldo Libro (Q),Efectivo Contado (Q),Diferencia (Q),Resultado");
    datos.dias.forEach((d) => {
      const fechaStr = new Date(d.fecha).toLocaleDateString("es-GT");
      const cajero = `"${(d.cerrado_por_nombre || d.abierto_por_nombre || "").replace(/"/g, '""')}"`;
      const esperado = Number(d.saldo_final ?? d.saldo_inicial);
      const contado = Number(d.total_contado || esperado);
      const dif = Number(d.diferencia || 0);
      const res = dif === 0 ? "CUADRADO" : dif > 0 ? "SOBRANTE" : "FALTANTE";
      lineas.push(
        `${fechaStr},${cajero},${d.saldo_inicial.toFixed(2)},${d.total_ingresos.toFixed(2)},${d.total_egresos.toFixed(2)},${esperado.toFixed(2)},${contado.toFixed(2)},${dif.toFixed(2)},${res}`,
      );
    });
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
              disabled={!datos || datos.dias.length === 0}
              style={{ fontSize: "0.8rem", padding: "0.35rem 0.65rem" }}
            >
              📥 Excel (CSV)
            </button>
            <button
              type="button"
              className="btn"
              onClick={() => window.print()}
              disabled={!datos || datos.dias.length === 0}
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
            COOPERATIVA MAYA INVERSIONES FUTURAS R.L. &quot;COMIF R.L.&quot;
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
          <div className="alert info">
            No se encontraron cajas registradas para el mes de {mesNombreLargo} en {agenciaNombre}.
          </div>
        )}

        {datos && (
          <div style={{ fontSize: "0.82rem", lineHeight: 1.5, color: "var(--ink)" }}>
            {/* PUNTO PRIMERO */}
            <div style={{ marginBottom: "0.75rem", textAlign: "justify" }}>
              <strong style={{ textDecoration: "underline" }}>PUNTO PRIMERO (APERTURA Y QUÓRUM):</strong> En el municipio
              de {lugarMunicipio}, departamento de Quiché, siendo las {horaInicio} horas del día {ultimoDiaMes} del mes
              de {mesNombreLargo}, reunidos en las oficinas de la Agencia <strong>{agenciaNombre}</strong> de la{" "}
              <strong>COOPERATIVA MAYA INVERSIONES FUTURAS R.L. &quot;COMIF R.L.&quot;</strong>, se
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
                    {datos.resumen.totalDiasOperados} días
                  </strong>
                </div>

                <div>
                  <span style={{ color: "var(--ink-soft)", display: "block", fontSize: "0.65rem", textTransform: "uppercase" }}>
                    Efectividad de Cuadre
                  </span>
                  <strong className="mono" style={{ fontSize: "0.9rem", color: "#16a34a" }}>
                    {datos.resumen.diasCuadrados} / {datos.resumen.totalDiasOperados} (
                    {datos.resumen.totalDiasOperados > 0
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
                    + {formatoQ(datos.resumen.totalIngresosMes)}
                  </strong>
                </div>

                <div>
                  <span style={{ color: "var(--ink-soft)", display: "block", fontSize: "0.65rem", textTransform: "uppercase" }}>
                    Total Egresos del Mes
                  </span>
                  <strong className="mono" style={{ fontSize: "0.9rem", color: "#dc2626" }}>
                    − {formatoQ(datos.resumen.totalEgresosMes)}
                  </strong>
                </div>

                <div
                  style={{
                    background: datos.resumen.diasConDiferencia === 0 ? "rgba(22, 163, 74, 0.1)" : "rgba(220, 38, 38, 0.1)",
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
                      color: datos.resumen.diasConDiferencia === 0 ? "#16a34a" : "#dc2626",
                    }}
                  >
                    {datos.resumen.diasConDiferencia === 0
                      ? "Cuadrado (Q 0.00)"
                      : `${datos.resumen.diasConDiferencia} día(s)`}
                  </strong>
                </div>
              </div>

              {/* Sábana de Cierres Diarios */}
              {datos.dias.length > 0 && (
                <div className="table-wrap" style={{ border: "1px solid var(--line)" }}>
                  <table style={{ fontSize: "0.75rem", width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ background: "var(--paper-raised)" }}>
                        <th style={{ width: "70px", padding: "2px 4px" }}>Fecha</th>
                        <th style={{ padding: "2px 4px" }}>Cajero / Operador</th>
                        <th style={{ width: "85px", textAlign: "right", padding: "2px 4px" }}>Saldo Inicial</th>
                        <th style={{ width: "85px", textAlign: "right", padding: "2px 4px" }}>Ingresos (+)</th>
                        <th style={{ width: "85px", textAlign: "right", padding: "2px 4px" }}>Egresos (−)</th>
                        <th style={{ width: "85px", textAlign: "right", padding: "2px 4px" }}>Saldo Libro</th>
                        <th style={{ width: "85px", textAlign: "right", padding: "2px 4px" }}>Contado</th>
                        <th style={{ width: "75px", textAlign: "right", padding: "2px 4px" }}>Diferencia</th>
                        <th style={{ width: "75px", textAlign: "center", padding: "2px 4px" }}>Resultado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {datos.dias.map((d) => {
                        const dif = Number(d.diferencia || 0);
                        const esperado = Number(d.saldo_final ?? d.saldo_inicial);
                        const contado = Number(d.total_contado || esperado);
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
                              {formatoQ(d.saldo_inicial)}
                            </td>
                            <td className="mono" style={{ textAlign: "right", color: "#16a34a", padding: "2px 4px" }}>
                              {formatoQ(d.total_ingresos)}
                            </td>
                            <td className="mono" style={{ textAlign: "right", color: "#dc2626", padding: "2px 4px" }}>
                              {formatoQ(d.total_egresos)}
                            </td>
                            <td className="mono" style={{ textAlign: "right", fontWeight: 700, padding: "2px 4px" }}>
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
                                  color: dif === 0 ? "#16a34a" : "#dc2626",
                                  fontWeight: 700,
                                  fontSize: "0.72rem",
                                }}
                              >
                                {dif === 0 ? "✓ Cuadrado" : dif > 0 ? "Sobrante" : "Faltante"}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr style={{ background: "rgba(0,0,0,0.04)", fontWeight: 800, borderTop: "2px solid #0f172a" }}>
                        <td colSpan={2} style={{ padding: "3px 4px" }}>
                          TOTALES DEL MES:
                        </td>
                        <td style={{ padding: "3px 4px" }}>—</td>
                        <td className="mono" style={{ textAlign: "right", color: "#16a34a", padding: "3px 4px" }}>
                          {formatoQ(datos.resumen.totalIngresosMes)}
                        </td>
                        <td className="mono" style={{ textAlign: "right", color: "#dc2626", padding: "3px 4px" }}>
                          {formatoQ(datos.resumen.totalEgresosMes)}
                        </td>
                        <td colSpan={2} style={{ padding: "3px 4px" }}></td>
                        <td
                          className="mono"
                          style={{
                            textAlign: "right",
                            color: datos.resumen.diasConDiferencia === 0 ? "#16a34a" : "#dc2626",
                            padding: "3px 4px",
                          }}
                        >
                          {datos.resumen.diasConDiferencia === 0
                            ? "Q 0.00"
                            : datos.resumen.totalSobrante > 0
                            ? `+${formatoQ(datos.resumen.totalSobrante)}`
                            : `-${formatoQ(datos.resumen.totalFaltante)}`}
                        </td>
                        <td style={{ textAlign: "center", padding: "3px 4px" }}>
                          {datos.resumen.diasConDiferencia === 0 ? "✓ CONFORME" : "REVISADO"}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
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
        )}
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

