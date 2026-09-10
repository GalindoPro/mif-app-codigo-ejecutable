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

  const totalPeligro = alertas.filter((a) => a.tipo === "PELIGRO").length;
  const totalAdvertencia = alertas.filter((a) => a.tipo === "ADVERTENCIA").length;
  const totalInfo = alertas.filter((a) => a.tipo === "INFO").length;

  const alertasFiltradas = alertas.filter((a) => {
    if (filtroCategoria === "TODAS") return true;
    return a.categoria === filtroCategoria;
  });

  return (
    <div style={{ width: "100%" }}>
      <div className="page-head">
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span style={{ fontSize: "1.5rem" }}>🔔</span>
            <h1>Panel de Alertas del Sistema</h1>
          </div>
          <p>
            Monitoreo en tiempo real de operaciones pendientes, vencimientos de cartera, cajas abiertas y controles de auditoría.
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span style={{ fontSize: "0.78rem", color: "var(--ink-soft)", display: "flex", alignItems: "center", gap: "0.3rem" }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#10b981", display: "inline-block" }} />
            Monitoreo activo
          </span>
        </div>
      </div>

      {error && <div className="alert error">{error}</div>}

      {/* KPI CARDS - 100% WIDTH FLUID GRID */}
      <div
        className="stat-grid"
        style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", marginBottom: "1.5rem" }}
      >
        <div className="stat-card accent">
          <span className="label">Total Alertas Activas</span>
          <span className="value mono">{alertas.length}</span>
          <span className="sub">Eventos detectados por el motor</span>
        </div>
        <div className="stat-card" style={{ borderLeft: "4px solid #ef4444" }}>
          <span className="label" style={{ color: "#ef4444" }}>Requiere Atención Inmediata</span>
          <span className="value mono" style={{ color: "#ef4444" }}>{totalPeligro}</span>
          <span className="sub">Cajas desfasadas o vencimientos</span>
        </div>
        <div className="stat-card" style={{ borderLeft: "4px solid #f59e0b" }}>
          <span className="label" style={{ color: "#f59e0b" }}>Advertencias de Control</span>
          <span className="value mono" style={{ color: "#f59e0b" }}>{totalAdvertencia}</span>
          <span className="sub">Próximos vencimientos o saldos</span>
        </div>
        <div className="stat-card" style={{ borderLeft: "4px solid #3b82f6" }}>
          <span className="label" style={{ color: "#3b82f6" }}>Avisos Informativos</span>
          <span className="value mono" style={{ color: "#3b82f6" }}>{totalInfo}</span>
          <span className="sub">Desembolsos y expedientes</span>
        </div>
      </div>

      {/* PESTAÑAS DE FILTRO POR CATEGORÍA */}
      <div
        style={{
          display: "flex",
          gap: "0.4rem",
          marginBottom: "1.25rem",
          flexWrap: "wrap",
          borderBottom: "1px solid var(--line)",
          paddingBottom: "0.5rem",
        }}
      >
        {[
          { id: "TODAS", label: "Todas las alertas", count: alertas.length },
          { id: "CAJA", label: "💵 Caja Auxiliar", count: alertas.filter((a) => a.categoria === "CAJA").length },
          { id: "CREDITOS", label: "📄 Créditos", count: alertas.filter((a) => a.categoria === "CREDITOS").length },
          { id: "PLAZO_FIJO", label: "📈 Plazo Fijo", count: alertas.filter((a) => a.categoria === "PLAZO_FIJO").length },
          { id: "CAJA_CHICA", label: "📥 Caja Chica", count: alertas.filter((a) => a.categoria === "CAJA_CHICA").length },
          { id: "SOCIOS", label: "👥 Padrón Socios", count: alertas.filter((a) => a.categoria === "SOCIOS").length },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`btn ${filtroCategoria === tab.id ? "" : "secondary"}`}
            style={{ fontSize: "0.82rem", padding: "0.35rem 0.75rem", borderRadius: "6px" }}
            onClick={() => setFiltroCategoria(tab.id)}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {/* LISTADO DE ALERTAS EN TARJETAS RESPONSIVAS AL 100% */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", width: "100%" }}>
        {alertasFiltradas.map((alerta) => {
          const borderColor =
            alerta.tipo === "PELIGRO" ? "#ef4444" : alerta.tipo === "ADVERTENCIA" ? "#f59e0b" : "#3b82f6";
          const icon =
            alerta.tipo === "PELIGRO" ? "🚨" : alerta.tipo === "ADVERTENCIA" ? "⚠️" : "ℹ️";

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
                borderLeft: `5px solid ${borderColor}`,
                padding: "1rem 1.25rem",
              }}
            >
              <div style={{ flex: 1, minWidth: 260 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
                  <span style={{ fontSize: "1.1rem" }}>{icon}</span>
                  <strong style={{ fontSize: "0.98rem", color: "var(--ink)" }}>{alerta.titulo}</strong>
                  <span
                    className="badge"
                    style={{
                      fontSize: "0.7rem",
                      borderColor,
                      color: borderColor,
                    }}
                  >
                    {alerta.categoria}
                  </span>
                </div>
                <div style={{ fontSize: "0.88rem", color: "var(--ink)", marginBottom: "0.3rem" }}>
                  {alerta.descripcion}
                </div>
                <div style={{ fontSize: "0.78rem", color: "var(--ink-soft)" }}>
                  {alerta.detalle}
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <span className="mono" style={{ fontSize: "0.78rem", color: "var(--ink-soft)" }}>
                  {alerta.fecha}
                </span>
                <Link to={alerta.enlace} className="btn" style={{ fontSize: "0.82rem", padding: "0.45rem 0.9rem" }}>
                  Atender en módulo →
                </Link>
              </div>
            </div>
          );
        })}

        {!cargando && alertasFiltradas.length === 0 && (
          <div className="card empty" style={{ padding: "3rem 1rem", textAlign: "center" }}>
            <span style={{ fontSize: "2.5rem", display: "block", marginBottom: "0.5rem" }}>🎉</span>
            <strong style={{ fontSize: "1.1rem", display: "block" }}>
              ¡Todo en orden! Sin alertas activas
            </strong>
            <p style={{ color: "var(--ink-soft)", margin: "0.35rem 0 0" }}>
              No se han encontrado irregularidades ni vencimientos pendientes en este momento.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
