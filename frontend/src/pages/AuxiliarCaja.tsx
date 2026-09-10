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

export default function AuxiliarCaja() {
  const { usuario } = useAuth();
  const puedeElegirAgencia = usuario?.rol === "ADMIN" || usuario?.rol === "GERENCIA";

  const [agencias, setAgencias] = useState<Agencia[]>([]);
  const [agenciaId, setAgenciaId] = useState(usuario?.agenciaId ?? "");
  const [estadoInfo, setEstadoInfo] = useState<EstadoCajaAuxiliar | null>(null);
  const [detalle, setDetalle] = useState<DetalleCajaAuxiliar | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);
  const [mostrarHistorial, setMostrarHistorial] = useState(false);

  useEffect(() => {
    api.get<Agencia[]>("/agencias").then(({ data }) => {
      setAgencias(data);
      // ADMIN/GERENCIA no tienen agencia propia (ven todas): sin esto, la
      // pantalla se queda bloqueada en "Debes tener una agencia asignada"
      // para siempre, porque el selector de abajo nunca llega a mostrarse.
      setAgenciaId((actual) => actual || data[0]?.id || "");
    });
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
      <div>
        <h1>Auxiliar de caja</h1>
        <div className="alert error">Debes tener una agencia asignada o seleccionar una.</div>
      </div>
    );
  }

  const agenciaActualNombre = agencias.find((a) => a.id === agenciaId)?.nombre ?? "Agencia";

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Auxiliar de caja</h1>
          <p>Libro de caja del día: transacciones agente Banco Industrial e ingresos/egresos propios.</p>
        </div>
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", flexWrap: "wrap" }}>
          <button className="btn secondary" onClick={() => setMostrarHistorial(true)}>
            📅 Historial de Cajas
          </button>
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

      {estadoInfo?.estado === "CERRADO" && (
        <CajaCerradaCard
          agenciaNombre={agenciaActualNombre}
          detalle={estadoInfo.detalle}
          onVerHistorial={() => setMostrarHistorial(true)}
        />
      )}

      {mostrarHistorial && (
        <HistorialCajasModal
          agenciaId={agenciaId}
          agenciaNombre={agenciaActualNombre}
          onCerrar={() => setMostrarHistorial(false)}
        />
      )}
    </div>
  );
}
