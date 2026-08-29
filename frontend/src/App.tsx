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
import Usuarios from "./pages/Usuarios";

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
          <Route path="/creditos" element={<CreditosList />} />
          <Route path="/creditos/simulador" element={<CreditoSimulador />} />
          <Route path="/creditos/nuevo" element={<CreditoForm />} />
          <Route path="/creditos/:id" element={<CreditoDetail />} />
          <Route path="/ahorros/:slug" element={<AhorroList />} />
          <Route path="/ahorros/:slug/nueva" element={<AhorroCuentaForm />} />
          <Route path="/ahorros/:slug/:id" element={<AhorroCuentaDetail />} />
          <Route path="/usuarios" element={<Usuarios />} />
          <Route path="/agencias" element={<Agencias />} />
        </Route>
        <Route path="*" element={<Navigate to="/tablero" replace />} />
      </Routes>
    </AuthProvider>
  );
}
