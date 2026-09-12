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
    <div style={{ width: "100%" }}>
      <div className="page-head">
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span style={{ fontSize: "1.5rem" }}>🛡️</span>
            <h1>Control de Sesiones y Accesos Activos</h1>
          </div>
          <p>
            Monitoreo de actividad de colaboradores, trazabilidad de operaciones en tiempo real y asignación de agencias.
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <Link to="/auditoria" className="btn secondary">
            🔍 Ver Bitácora Completa
          </Link>
          <Link to="/usuarios" className="btn">
            👤 Gestionar Usuarios
          </Link>
        </div>
      </div>

      {error && <div className="alert error">{error}</div>}

      {/* KPI CARDS - 100% FLUID WIDTH */}
      <div
        className="stat-grid"
        style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", marginBottom: "1.5rem" }}
      >
        <div className="stat-card accent">
          <span className="label">Usuarios Habilitados</span>
          <span className="value mono">{totalActivos}</span>
          <span className="sub">De {usuarios.length} cuentas registradas</span>
        </div>
        <div className="stat-card">
          <span className="label">Activos en el Sistema Hoy</span>
          <span className="value mono" style={{ color: "#10b981" }}>{usuariosConActividadHoy}</span>
          <span className="sub">Con operaciones registradas hoy</span>
        </div>
        <div className="stat-card">
          <span className="label">Transacciones Monitoreadas</span>
          <span className="value mono">
            {usuarios.reduce((acc, u) => acc + Number(u.total_acciones), 0).toLocaleString("es-GT")}
          </span>
          <span className="sub">Eventos auditados en bitácora</span>
        </div>
      </div>

      {/* SEARCH BAR */}
      <div className="searchbar">
        <input
          placeholder="Buscar por colaborador, correo, agencia o rol…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      {/* TABLA DE SESIONES Y ACTIVIDAD AL 100% DE ANCHO */}
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Colaborador / Usuario</th>
              <th>Correo Institucional</th>
              <th>Rol / Cargo</th>
              <th>Agencia</th>
              <th>Última Operación</th>
              <th>Última Conexión / Registro</th>
              <th style={{ textAlign: "center" }}>Estado Cuenta</th>
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
