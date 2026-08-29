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
          <Route index element={<Navigate to="/tablero" replace />} />
          <Route path="/tablero" element={<Tablero />} />
          <Route path="/socios" element={<SociosList />} />
          <Route path="/socios/nuevo" element={<SocioForm />} />
          <Route path="/socios/:id" element={<SocioDetail />} />
          <Route path="/caja-chica" element={<CajaChica />} />
          <Route path="/auxiliar-caja" element={<AuxiliarCaja />} />
          <Route path="/ahorros/:slug" element={<AhorroList />} />
          <Route path="/ahorros/:slug/nueva" element={<AhorroCuentaForm />} />
          <Route path="/ahorros/:slug/:id" element={<AhorroCuentaDetail />} />
          <Route path="/agencias" element={<Agencias />} />
        </Route>
        <Route path="*" element={<Navigate to="/tablero" replace />} />
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
export type RolUsuario = "ADMIN" | "GERENCIA" | "SUPERVISOR" | "CAJERO";

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
  total_cuentas?: number;
  created_at: string;
}

export interface ListaSocios {
  data: Socio[];
  total: number;
  page: number;
  pageSize: number;
}

export const ROL_LABEL: Record<RolUsuario, string> = {
  ADMIN: "Administrador",
  GERENCIA: "Gerencia",
  SUPERVISOR: "Jefe de agencia",
  CAJERO: "Operador",
};

export type TipoCuentaAhorro = "AHORRO_CORRIENTE" | "AHORRO_PROGRAMADO" | "AHORRO_INFANTO_JUVENIL";

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
  usuario_nombre: string;
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
  totalSocios: number;
  movimientosHoy: number;
}

export interface ResumenDashboard {
  global: {
    cajaChica: number;
    ahorroCorriente: number;
    ahorroProgramado: number;
    ahorroInfantoJuvenil: number;
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
  | { estado: "SIN_ABRIR"; saldoSugerido: number | null; fechaUltimoCierre: string | null; esPrimeraVez: boolean };

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
  usuario_nombre: string;
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
  grid-template-columns: 240px 1fr;
  min-height: 100vh;
}

.sidebar {
  background: var(--paper-raised);
  border-right: 1px solid var(--line);
  padding: 1.5rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.brand {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  padding: 0 0.5rem;
}
.brand .name {
  font-family: "Fraunces", Georgia, serif;
  font-weight: 600;
  font-size: 1.15rem;
}
.brand .sub {
  font-size: 0.72rem;
  color: var(--ink-soft);
  font-family: "IBM Plex Mono", monospace;
  text-transform: uppercase;
  letter-spacing: 0.06em;
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
  font-size: 0.92rem;
  font-weight: 500;
}
.nav a:hover {
  background: var(--mono-bg);
  color: var(--ink);
}
.nav a.active {
  background: var(--accent);
  color: var(--paper-raised);
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
}

.content {
  padding: clamp(1.25rem, 3vw, 2.5rem);
  max-width: 1180px;
}

.page-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 1.5rem;
}
.page-head h1 {
  font-size: 1.6rem;
}
.page-head p {
  color: var(--ink-soft);
  margin: 0.25rem 0 0;
  font-size: 0.92rem;
}

.card {
  background: var(--paper-raised);
  border: 1px solid var(--line);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  padding: 1.4rem;
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
  padding: 0.65rem 0.9rem;
  font-size: 0.88rem;
  border-bottom: 1px solid var(--line);
}
thead th {
  font-family: "IBM Plex Mono", monospace;
  font-size: 0.7rem;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--ink-soft);
  background: var(--mono-bg);
  white-space: nowrap;
}
tbody tr:hover {
  background: var(--mono-bg);
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
  font-size: 0.72rem;
  font-weight: 600;
  padding: 0.15rem 0.55rem;
  border-radius: 999px;
  font-family: "IBM Plex Mono", monospace;
}
.badge.activo {
  background: color-mix(in srgb, var(--accent) 18%, transparent);
  color: var(--accent-strong);
}
.badge.inactivo {
  background: var(--mono-bg);
  color: var(--ink-soft);
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
  font-family: "IBM Plex Mono", monospace;
  font-variant-numeric: tabular-nums;
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--ink);
}
.stat-card .sub {
  font-size: 0.78rem;
  color: var(--ink-soft);
  margin-top: 0.2rem;
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
            <label htmlFor="aux-doc">No. de documento</label>
            <input id="aux-doc" value={docNo} onChange={(e) => setDocNo(e.target.value)} />
          </div>
        )}
        {info.requiereCuenta && (
          <div className="field">
            <label htmlFor="aux-doc-cuenta">No. de recibo</label>
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
import type { Agencia, CategoriaCajaChica, ListaCajaChica } from "../types";

const CATEGORIAS = Object.entries(CATEGORIA_CAJA_CHICA_LABEL) as [CategoriaCajaChica, string][];

export default function CajaChica() {
  const { usuario } = useAuth();
  const puedeElegirAgencia = usuario?.rol === "ADMIN" || usuario?.rol === "GERENCIA";

  const [q, setQ] = useState("");
  const [resultado, setResultado] = useState<ListaCajaChica | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mostrarForm, setMostrarForm] = useState(false);
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
    const timeout = setTimeout(cargar, 250);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  async function crear(e: FormEvent) {
    e.preventDefault();
    setError(null);
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

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Caja chica</h1>
          <p>Comprobantes de ingreso y egreso — reemplaza el libro auxiliar de caja chica.</p>
        </div>
        <button className="btn" onClick={() => setMostrarForm((v) => !v)}>
          {mostrarForm ? "Cancelar" : "+ Nuevo comprobante"}
        </button>
      </div>

      {error && <div className="alert error">{error}</div>}

      {resultado && (
        <div className="stat-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(180px, 220px))" }}>
          <div className="stat-card accent">
            <span className="label">Saldo actual</span>
            <span className="value">{formatoQ(resultado.saldoActual)}</span>
          </div>
          <div className="stat-card">
            <span className="label">Total ingresos</span>
            <span className="value">{formatoQ(resultado.totalIngresos)}</span>
          </div>
          <div className="stat-card">
            <span className="label">Total egresos</span>
            <span className="value">{formatoQ(resultado.totalEgresos)}</span>
          </div>
        </div>
      )}

      {resultado && resultado.totalesPorCategoria.length > 0 && (
        <div className="card" style={{ marginBottom: "1.5rem" }}>
          <h2 style={{ marginTop: 0 }}>Egresos por categoría</h2>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Categoría</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {resultado.totalesPorCategoria.map((c) => (
                  <tr key={c.categoria}>
                    <td>
                      {c.categoria === "SIN_CATEGORIA"
                        ? "Sin categoría"
                        : CATEGORIA_CAJA_CHICA_LABEL[c.categoria as CategoriaCajaChica] ?? c.categoria}
                    </td>
                    <td className="mono">{formatoQ(c.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {mostrarForm && (
        <form className="card" onSubmit={crear} style={{ maxWidth: 640, marginBottom: "1.5rem" }}>
          <div className="form-grid">
            {puedeElegirAgencia && (
              <div className="field">
                <label htmlFor="cc-agencia">Agencia</label>
                <select id="cc-agencia" value={agenciaId} onChange={(e) => setAgenciaId(e.target.value)} required>
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
              <label>Tipo</label>
              <div className="tipo-toggle">
                <button type="button" className={tipo === "INGRESO" ? "on deposito" : ""} onClick={() => setTipo("INGRESO")}>
                  Ingreso
                </button>
                <button type="button" className={tipo === "EGRESO" ? "on retiro" : ""} onClick={() => setTipo("EGRESO")}>
                  Egreso
                </button>
              </div>
            </div>
            {tipo === "EGRESO" && (
              <div className="field">
                <label htmlFor="cc-categoria">Categoría de gasto</label>
                <select
                  id="cc-categoria"
                  value={categoria}
                  onChange={(e) => setCategoria(e.target.value as CategoriaCajaChica)}
                  required
                >
                  <option value="" disabled>
                    Selecciona una categoría
                  </option>
                  {CATEGORIAS.map(([valor, etiqueta]) => (
                    <option key={valor} value={valor}>
                      {etiqueta}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div className="field">
              <label htmlFor="cc-fecha">Fecha</label>
              <input id="cc-fecha" type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} required />
            </div>
            <div className="field">
              <label htmlFor="cc-monto">Monto</label>
              <input
                id="cc-monto"
                type="number"
                min="0.01"
                step="0.01"
                value={monto}
                onChange={(e) => setMonto(e.target.value)}
                required
              />
            </div>
            <div className="field" style={{ gridColumn: "1 / -1" }}>
              <label htmlFor="cc-beneficiario">Beneficiario</label>
              <input id="cc-beneficiario" value={beneficiario} onChange={(e) => setBeneficiario(e.target.value)} required />
            </div>
            <div className="field" style={{ gridColumn: "1 / -1" }}>
              <label htmlFor="cc-descripcion">Descripción</label>
              <input id="cc-descripcion" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} required />
            </div>
            <div className="field">
              <label htmlFor="cc-documento">No. de documento</label>
              <input id="cc-documento" value={numeroDocumento} onChange={(e) => setNumeroDocumento(e.target.value)} />
            </div>
          </div>
          <button type="submit" className="btn" disabled={guardando || !agenciaId}>
            {guardando ? "Guardando…" : "Guardar comprobante"}
          </button>
        </form>
      )}

      <div className="searchbar">
        <input placeholder="Buscar por beneficiario o descripción…" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Beneficiario</th>
              <th>Descripción</th>
              <th>Tipo</th>
              <th>Categoría</th>
              <th>Monto</th>
              <th>Registrado por</th>
            </tr>
          </thead>
          <tbody>
            {resultado?.data.map((c) => (
              <tr key={c.id}>
                <td className="mono">{new Date(c.fecha).toLocaleDateString("es-GT")}</td>
                <td>{c.beneficiario}</td>
                <td>{c.descripcion}</td>
                <td>{c.tipo === "INGRESO" ? "Ingreso" : "Egreso"}</td>
                <td>{c.categoria ? CATEGORIA_CAJA_CHICA_LABEL[c.categoria] : "—"}</td>
                <td className={`mono movimiento-monto ${c.tipo === "EGRESO" ? "retiro" : "deposito"}`}>
                  {c.tipo === "EGRESO" ? "−" : "+"} {formatoQ(c.monto)}
                </td>
                <td>{c.usuario_nombre}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {resultado?.data.length === 0 && <div className="empty">Todavía no hay comprobantes registrados.</div>}
      </div>
    </div>
  );
}
```

## `frontend/src/pages/Layout.tsx` {#frontendsrcpageslayouttsx}

```tsx
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ROL_LABEL, TIPOS_AHORRO } from "../types";

export default function Layout() {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();
  const cls = ({ isActive }: { isActive: boolean }) => (isActive ? "active" : "");

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="name">MIF</span>
          <span className="sub">Sistema integral</span>
        </div>
        <nav className="nav">
          <NavLink to="/tablero" className={cls}>
            Tablero
          </NavLink>
          <NavLink to="/socios" className={cls}>
            Socios
          </NavLink>
          <NavLink to="/auxiliar-caja" className={cls}>
            Auxiliar de caja
          </NavLink>
          <NavLink to="/caja-chica" className={cls}>
            Caja chica
          </NavLink>
          {TIPOS_AHORRO.map((t) => (
            <NavLink key={t.slug} to={`/ahorros/${t.slug}`} className={cls}>
              {t.titulo}
            </NavLink>
          ))}
          {(usuario?.rol === "ADMIN" || usuario?.rol === "GERENCIA") && (
            <NavLink to="/agencias" className={cls}>
              Agencias
            </NavLink>
          )}
        </nav>
        <div className="sidebar-footer">
          <div className="who">{usuario?.nombre}</div>
          <div className="role">{usuario ? ROL_LABEL[usuario.rol] : ""}</div>
          <button
            className="link-btn"
            onClick={() => {
              logout();
              navigate("/login", { replace: true });
            }}
          >
            Cerrar sesión
          </button>
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
        <p className="sub">Cooperativa Integral de Ahorro y Crédito "Maya Inversiones Futuras" R.L.</p>

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
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, mensajeError } from "../lib/api";
import { formatoQ } from "../types";
import type { ResumenDashboard } from "../types";

export default function Tablero() {
  const [resumen, setResumen] = useState<ResumenDashboard | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<ResumenDashboard>("/dashboard/resumen")
      .then(({ data }) => setResumen(data))
      .catch((err) => setError(mensajeError(err)));
  }, []);

  if (error) return <div className="alert error">{error}</div>;
  if (!resumen) return <p>Cargando…</p>;

  const { global, porAgencia } = resumen;
  const varias = porAgencia.length > 1;

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Tablero</h1>
          <p>Resumen de todos los módulos{varias ? " — todas las agencias" : ""}, actualizado al momento.</p>
        </div>
      </div>

      <div className="stat-grid">
        <Link to="/caja-chica" className="stat-card accent" style={{ textDecoration: "none" }}>
          <span className="label">Caja chica</span>
          <span className="value">{formatoQ(global.cajaChica)}</span>
          <span className="sub">Saldo actual</span>
        </Link>
        <Link to="/ahorros/corriente" className="stat-card" style={{ textDecoration: "none" }}>
          <span className="label">Ahorro corriente</span>
          <span className="value">{formatoQ(global.ahorroCorriente)}</span>
          <span className="sub">Saldo total</span>
        </Link>
        <Link to="/ahorros/programado" className="stat-card" style={{ textDecoration: "none" }}>
          <span className="label">Ahorro programado</span>
          <span className="value">{formatoQ(global.ahorroProgramado)}</span>
          <span className="sub">Saldo total</span>
        </Link>
        <Link to="/ahorros/infanto-juvenil" className="stat-card" style={{ textDecoration: "none" }}>
          <span className="label">Ahorro infanto juvenil</span>
          <span className="value">{formatoQ(global.ahorroInfantoJuvenil)}</span>
          <span className="sub">Saldo total</span>
        </Link>
        <Link to="/socios" className="stat-card" style={{ textDecoration: "none" }}>
          <span className="label">Socios activos</span>
          <span className="value mono">{global.totalSocios}</span>
          <span className="sub">{global.movimientosHoy} movimiento(s) hoy</span>
        </Link>
      </div>

      {varias && (
        <>
          <h3 style={{ marginBottom: "0.75rem" }}>Por agencia</h3>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Agencia</th>
                  <th>Caja chica</th>
                  <th>Ahorro corriente</th>
                  <th>Ahorro programado</th>
                  <th>Ahorro infanto juvenil</th>
                  <th>Socios</th>
                </tr>
              </thead>
              <tbody>
                {porAgencia.map((a) => (
                  <tr key={a.agenciaId}>
                    <td>{a.agenciaNombre}</td>
                    <td className="mono">{formatoQ(a.cajaChica.saldo)}</td>
                    <td className="mono">{formatoQ(a.ahorroCorriente.saldoTotal)}</td>
                    <td className="mono">{formatoQ(a.ahorroProgramado.saldoTotal)}</td>
                    <td className="mono">{formatoQ(a.ahorroInfantoJuvenil.saldoTotal)}</td>
                    <td className="mono">{a.totalSocios}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
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

