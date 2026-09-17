import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, mensajeError } from "../lib/api";

interface AlertaItem {
  id: string;
  tipo: "PELIGRO" | "ADVERTENCIA" | "INFO";
  categoria: "CREDITOS" | "CAJA" | "PLAZO_FIJO" | "CAJA_CHICA" | "SOCIOS";
  titulo: string;
  descripcion: string;
  detalle: string;
  enlace: string;
  fecha: string;
}

const TABS = [
  { id: "TODAS",     label: "Todas",           emoji: "🔔" },
  { id: "CAJA",      label: "Caja Auxiliar",   emoji: "💵" },
  { id: "CREDITOS",  label: "Créditos",         emoji: "📄" },
  { id: "PLAZO_FIJO",label: "Plazo Fijo",       emoji: "📈" },
  { id: "CAJA_CHICA",label: "Caja Chica",       emoji: "📥" },
  { id: "SOCIOS",    label: "Padrón Socios",    emoji: "👥" },
];

export default function Alertas() {
  const [alertas, setAlertas] = useState<AlertaItem[]>([]);
  const [filtroCategoria, setFiltroCategoria] = useState<string>("TODAS");
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  function cargarAlertas() {
    setCargando(true);
    setError(null);
    api
      .get<AlertaItem[]>("/alertas")
      .then(({ data }) => setAlertas(data))
      .catch((err) => setError(mensajeError(err)))
      .finally(() => setCargando(false));
  }

  useEffect(() => {
    cargarAlertas();
    const interval = setInterval(cargarAlertas, 20000);
    return () => clearInterval(interval);
  }, []);

  const totalPeligro     = alertas.filter((a) => a.tipo === "PELIGRO").length;
  const totalAdvertencia = alertas.filter((a) => a.tipo === "ADVERTENCIA").length;
  const totalInfo        = alertas.filter((a) => a.tipo === "INFO").length;

  const alertasFiltradas = alertas.filter((a) =>
    filtroCategoria === "TODAS" ? true : a.categoria === filtroCategoria
  );

  const contarCategoria = (id: string) =>
    id === "TODAS" ? alertas.length : alertas.filter((a) => a.categoria === id).length;

  return (
    <div className="screen-container">
      {/* ── HEADER 1 LÍNEA ── */}
      <div className="screen-header">
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span>🔔</span>
          <h1 style={{ margin: 0, fontSize: "1rem", fontWeight: 700 }}>
            Panel de Alertas del Sistema
          </h1>
          <span style={{ fontSize: "0.75rem", color: "var(--ink-soft)" }}>
            — Monitoreo en tiempo real
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          {cargando && (
            <span style={{ fontSize: "0.72rem", color: "var(--ink-soft)" }}>Actualizando…</span>
          )}
          <span style={{
            fontSize: "0.72rem", color: "#10b981",
            display: "flex", alignItems: "center", gap: "0.25rem"
          }}>
            <span style={{
              width: 7, height: 7, borderRadius: "50%",
              background: "#10b981", display: "inline-block",
              animation: "pulse-dot 2s infinite"
            }} />
            Monitoreo activo
          </span>
          <button
            type="button"
            className="btn secondary"
            style={{ fontSize: "0.78rem", padding: "0.25rem 0.6rem" }}
            onClick={cargarAlertas}
          >
            🔄 Actualizar
          </button>
        </div>
      </div>

      {error && <div className="alert error" style={{ margin: "0 1rem", flexShrink: 0 }}>{error}</div>}

      {/* ── KPI STRIP FINTECH ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.5rem", flexShrink: 0 }}>
        {/* TOTAL ALERTAS */}
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
              TOTAL ALERTAS
            </span>
            <span style={{ fontSize: "0.85rem" }}>🔔</span>
          </div>
          <span style={{ fontSize: "1.08rem", fontWeight: 700, color: "#6366f1", fontFamily: "monospace" }}>
            {alertas.length}
          </span>
          <span style={{ fontSize: "0.65rem", color: "var(--ink-soft)" }}>Eventos activos</span>
        </div>

        {/* ATENCIÓN INMEDIATA */}
        <div
          style={{
            background: totalPeligro > 0 ? "rgba(239, 68, 68, 0.06)" : "var(--paper)",
            border: "1px solid var(--line)",
            borderLeft: "4px solid #ef4444",
            borderRadius: "8px",
            padding: "0.45rem 0.65rem",
            display: "flex",
            flexDirection: "column",
            boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "0.65rem", fontWeight: 700, color: "#ef4444", letterSpacing: "0.03em" }}>
              ATENCIÓN INMEDIATA
            </span>
            <span style={{ fontSize: "0.85rem" }}>⚡</span>
          </div>
          <span style={{ fontSize: "1.08rem", fontWeight: 700, color: "#ef4444", fontFamily: "monospace" }}>
            {totalPeligro}
          </span>
          <span style={{ fontSize: "0.65rem", color: "var(--ink-soft)" }}>Cajas / vencimientos críticos</span>
        </div>

        {/* ADVERTENCIAS */}
        <div
          style={{
            background: totalAdvertencia > 0 ? "rgba(245, 158, 11, 0.06)" : "var(--paper)",
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
              ADVERTENCIAS
            </span>
            <span style={{ fontSize: "0.85rem" }}>⚠️</span>
          </div>
          <span style={{ fontSize: "1.08rem", fontWeight: 700, color: "#d97706", fontFamily: "monospace" }}>
            {totalAdvertencia}
          </span>
          <span style={{ fontSize: "0.65rem", color: "var(--ink-soft)" }}>Próximos vencimientos</span>
        </div>

        {/* INFORMATIVOS */}
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
              INFORMATIVOS
            </span>
            <span style={{ fontSize: "0.85rem" }}>ℹ️</span>
          </div>
          <span style={{ fontSize: "1.08rem", fontWeight: 700, color: "#0284c7", fontFamily: "monospace" }}>
            {totalInfo}
          </span>
          <span style={{ fontSize: "0.65rem", color: "var(--ink-soft)" }}>Desembolsos y solicitudes</span>
        </div>
      </div>

      {/* ── BARRA DE FILTROS POR CATEGORÍA ── */}
      <div className="screen-toolbar" style={{ gap: "0.35rem", flexWrap: "wrap", flexShrink: 0 }}>
        {TABS.map((tab) => {
          const cnt = contarCategoria(tab.id);
          return (
            <button
              key={tab.id}
              type="button"
              className={`btn ${filtroCategoria === tab.id ? "" : "secondary"}`}
              style={{ fontSize: "0.78rem", padding: "0.28rem 0.7rem", borderRadius: "6px" }}
              onClick={() => setFiltroCategoria(tab.id)}
            >
              {tab.emoji} {tab.label} ({cnt})
            </button>
          );
        })}
      </div>

      {/* ── LISTADO CON SCROLL INTERNO ── */}
      <div className="table-scroll-container" style={{ flex: 1, padding: "0.5rem 1rem 0.5rem" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", width: "100%" }}>
          {alertasFiltradas.map((alerta) => {
            const borderColor =
              alerta.tipo === "PELIGRO" ? "#ef4444" :
              alerta.tipo === "ADVERTENCIA" ? "#f59e0b" : "#3b82f6";
            const icon =
              alerta.tipo === "PELIGRO" ? "🚨" :
              alerta.tipo === "ADVERTENCIA" ? "⚠️" : "ℹ️";

            return (
              <div
                key={alerta.id}
                className="card"
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: "1rem",
                  flexWrap: "wrap",
                  borderLeft: `4px solid ${borderColor}`,
                  padding: "0.65rem 1rem",
                  margin: 0,
                }}
              >
                <div style={{ flex: 1, minWidth: 260 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.15rem" }}>
                    <span style={{ fontSize: "0.95rem" }}>{icon}</span>
                    <strong style={{ fontSize: "0.88rem", color: "var(--ink)" }}>{alerta.titulo}</strong>
                    <span
                      className="badge"
                      style={{ fontSize: "0.65rem", borderColor, color: borderColor }}
                    >
                      {alerta.categoria}
                    </span>
                  </div>
                  <div style={{ fontSize: "0.82rem", color: "var(--ink)", marginBottom: "0.1rem" }}>
                    {alerta.descripcion}
                  </div>
                  <div style={{ fontSize: "0.74rem", color: "var(--ink-soft)" }}>
                    {alerta.detalle}
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                  <span className="mono" style={{ fontSize: "0.74rem", color: "var(--ink-soft)" }}>
                    {alerta.fecha}
                  </span>
                  <Link
                    to={alerta.enlace}
                    className="btn"
                    style={{ fontSize: "0.78rem", padding: "0.3rem 0.75rem" }}
                  >
                    Atender →
                  </Link>
                </div>
              </div>
            );
          })}

          {!cargando && alertasFiltradas.length === 0 && (
            <div
              className="card empty"
              style={{ padding: "2rem 1rem", textAlign: "center", margin: 0 }}
            >
              <span style={{ fontSize: "2rem", display: "block", marginBottom: "0.4rem" }}>🎉</span>
              <strong style={{ fontSize: "1rem", display: "block" }}>
                ¡Todo en orden! Sin alertas activas
              </strong>
              <p style={{ color: "var(--ink-soft)", margin: "0.3rem 0 0", fontSize: "0.85rem" }}>
                No se han encontrado irregularidades ni vencimientos pendientes.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── FOOTER ── */}
      <div className="screen-footer" style={{ justifyContent: "space-between" }}>
        <span style={{ fontSize: "0.75rem", color: "var(--ink-soft)" }}>
          Mostrando <strong>{alertasFiltradas.length}</strong> de <strong>{alertas.length}</strong> alertas
          {filtroCategoria !== "TODAS" && ` · Filtro: ${filtroCategoria}`}
        </span>
        <span style={{ fontSize: "0.72rem", color: "var(--ink-soft)" }}>
          Actualización automática cada 20 segundos
        </span>
      </div>
    </div>
  );
}
