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
