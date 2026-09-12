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
  const puedeElegirAgencia = usuario?.rol === "GERENCIA";

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
