import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, mensajeError } from "../lib/api";
import { ROL_LABEL } from "../types";

interface UsuarioSesion {
  id: string;
  nombre: string;
  email: string;
  rol: string;
  agencia_nombre: string | null;
  activo: boolean;
  ultima_accion: string | null;
  ultima_fecha: string | null;
  total_acciones: number;
}

export default function Sesiones() {
  const [usuarios, setUsuarios] = useState<UsuarioSesion[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");

  function cargarSesiones() {
    setCargando(true);
    setError(null);
    api
      .get<UsuarioSesion[]>("/sesiones")
      .then(({ data }) => setUsuarios(data))
      .catch((err) => setError(mensajeError(err)))
      .finally(() => setCargando(false));
  }

  useEffect(() => {
    cargarSesiones();
    const interval = setInterval(cargarSesiones, 30000);
    return () => clearInterval(interval);
  }, []);

  const totalActivos = usuarios.filter((u) => u.activo).length;
  const usuariosConActividadHoy = usuarios.filter((u) => {
    if (!u.ultima_fecha) return false;
    const hoy = new Date().toISOString().slice(0, 10);
    return u.ultima_fecha.slice(0, 10) === hoy;
  }).length;

  const usuariosFiltrados = usuarios.filter((u) => {
    if (!q.trim()) return true;
    const term = q.toLowerCase();
    return (
      u.nombre.toLowerCase().includes(term) ||
      u.email.toLowerCase().includes(term) ||
      (u.agencia_nombre && u.agencia_nombre.toLowerCase().includes(term)) ||
      u.rol.toLowerCase().includes(term)
    );
  });

  return (
    <div className="screen-container">
      <div className="screen-header">
        <div style={{ display: "flex", alignItems: "center", gap: "0.65rem", flexWrap: "wrap" }}>
          <h1 style={{ display: "flex", alignItems: "center", gap: "0.4rem", margin: 0, fontSize: "1.2rem" }}>
            <span>🛡️</span> Control de Sesiones y Accesos
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
            Monitoreo en Vivo
          </span>
        </div>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <Link to="/auditoria" className="btn secondary" style={{ fontSize: "0.78rem", padding: "0.3rem 0.65rem" }}>
            🔍 Ver Auditoría
          </Link>
          <Link to="/usuarios" className="btn" style={{ fontSize: "0.78rem", padding: "0.3rem 0.75rem" }}>
            👤 Usuarios
          </Link>
        </div>
      </div>

      {error && <div className="alert error" style={{ margin: "0.25rem 0", padding: "0.4rem 0.75rem", fontSize: "0.82rem" }}>{error}</div>}

      {/* KPI CARDS FINTECH */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "0.5rem" }}>
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
              USUARIOS HABILITADOS
            </span>
            <span style={{ fontSize: "0.85rem" }}>👥</span>
          </div>
          <span style={{ fontSize: "1.08rem", fontWeight: 700, color: "#6366f1", fontFamily: "monospace" }}>
            {totalActivos}
          </span>
          <span style={{ fontSize: "0.65rem", color: "var(--ink-soft)" }}>De {usuarios.length} cuentas registradas</span>
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
              ACTIVOS HOY
            </span>
            <span style={{ fontSize: "0.85rem" }}>🟢</span>
          </div>
          <span style={{ fontSize: "1.08rem", fontWeight: 700, color: "#059669", fontFamily: "monospace" }}>
            {usuariosConActividadHoy}
          </span>
          <span style={{ fontSize: "0.65rem", color: "var(--ink-soft)" }}>Con actividad en la fecha</span>
        </div>

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
              TRANSACCIONES AUDITADAS
            </span>
            <span style={{ fontSize: "0.85rem" }}>📊</span>
          </div>
          <span style={{ fontSize: "1.08rem", fontWeight: 700, color: "#0284c7", fontFamily: "monospace" }}>
            {usuarios.reduce((acc, u) => acc + Number(u.total_acciones), 0).toLocaleString("es-GT")}
          </span>
          <span style={{ fontSize: "0.65rem", color: "var(--ink-soft)" }}>Eventos registrados</span>
        </div>
      </div>

      {/* SEARCH BAR */}
      <div className="screen-toolbar" style={{ margin: "0.4rem 0" }}>
        <div style={{ flex: 1, maxWidth: 440 }}>
          <input
            placeholder="🔍 Buscar por colaborador, correo, agencia o rol…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            style={{ width: "100%", padding: "0.35rem 0.65rem", fontSize: "0.82rem", borderRadius: "6px", border: "1px solid var(--line)", background: "var(--paper)", color: "var(--ink)" }}
          />
        </div>
      </div>

      {/* TABLA DE SESIONES Y ACTIVIDAD */}
      <div className="table-scroll-container" style={{ flex: 1, minHeight: 0 }}>
        <table className="table-compact" style={{ width: "100%" }}>
          <thead>
            <tr>
              <th>Colaborador / Usuario</th>
              <th>Correo Institucional</th>
              <th>Rol / Cargo</th>
              <th>Agencia</th>
              <th>Última Operación</th>
              <th>Última Conexión</th>
              <th style={{ textAlign: "center" }}>Estado</th>
            </tr>
          </thead>
          <tbody>
            {usuariosFiltrados.map((u) => {
              const fechaUltima = u.ultima_fecha
                ? new Date(u.ultima_fecha).toLocaleString("es-GT", {
                    dateStyle: "short",
                    timeStyle: "short",
                  })
                : "Sin actividad registrada";

              return (
                <tr key={u.id}>
                  <td>
                    <strong style={{ color: "var(--ink)", display: "block" }}>{u.nombre}</strong>
                    <span style={{ fontSize: "0.75rem", color: "var(--ink-soft)" }}>
                      ID: {u.id.slice(0, 8)}…
                    </span>
                  </td>
                  <td className="mono">{u.email}</td>
                  <td>
                    <span
                      style={{
                        display: "inline-block",
                        padding: "0.2rem 0.55rem",
                        borderRadius: "6px",
                        fontSize: "0.8rem",
                        fontWeight: 600,
                        background:
                          u.rol === "PROMOTOR"
                            ? "#ede9fe"
                            : u.rol === "GERENCIA"
                              ? "#fee2e2"
                              : u.rol === "GERENCIA"
                                ? "#e0e7ff"
                                : "#e2e8f0",
                        color:
                          u.rol === "PROMOTOR"
                            ? "#6d28d9"
                            : u.rol === "GERENCIA"
                              ? "#991b1b"
                              : u.rol === "GERENCIA"
                                ? "#3730a3"
                                : "#334155",
                      }}
                    >
                      {ROL_LABEL[u.rol as keyof typeof ROL_LABEL] ?? u.rol}
                    </span>
                  </td>
                  <td>
                    <span style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                      <span>🏢</span>
                      {u.agencia_nombre ?? "Todas (Global)"}
                    </span>
                  </td>
                  <td>
                    <span
                      style={{
                        fontSize: "0.82rem",
                        color: u.ultima_accion ? "var(--ink)" : "var(--ink-soft)",
                      }}
                    >
                      {u.ultima_accion ?? "—"}
                    </span>
                  </td>
                  <td className="mono" style={{ fontSize: "0.82rem" }}>
                    {fechaUltima}
                  </td>
                  <td style={{ textAlign: "center" }}>
                    <span className={`badge ${u.activo ? "activo" : "inactivo"}`}>
                      {u.activo ? "🟢 Habilitado" : "🔴 Inactivo"}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {!cargando && usuariosFiltrados.length === 0 && (
          <div className="empty">No se encontraron usuarios o sesiones para "{q}".</div>
        )}
      </div>
    </div>
  );
}
