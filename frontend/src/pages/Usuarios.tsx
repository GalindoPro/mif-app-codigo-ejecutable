import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { api, mensajeError } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { ROL_LABEL } from "../types";
import type { Agencia, RolUsuario, UsuarioItem } from "../types";

const ROLES_DISPONIBLES: RolUsuario[] = ["GERENCIA", "SUPERVISOR", "CAJERO", "CAJA_CHICA", "PROMOTOR"];

export default function Usuarios() {
  const { usuario } = useAuth();
  const [usuarios, setUsuarios] = useState<UsuarioItem[] | null>(null);
  const [agencias, setAgencias] = useState<Agencia[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [guardando, setGuardando] = useState(false);

  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rol, setRol] = useState<RolUsuario>("PROMOTOR");
  const [agenciaId, setAgenciaId] = useState("");

  const esAdmin = usuario?.rol === "GERENCIA";

  function cargar() {
    api
      .get<UsuarioItem[]>("/usuarios")
      .then(({ data }) => setUsuarios(data))
      .catch((err) => setError(mensajeError(err)));
  }

  useEffect(() => {
    cargar();
    api.get<Agencia[]>("/agencias").then(({ data }) => setAgencias(data));
  }, []);

  const requiereAgencia = rol === "SUPERVISOR" || rol === "CAJERO" || rol === "PROMOTOR";

  async function crearUsuario(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setMensajeExito(null);

    if (requiereAgencia && !agenciaId) {
      setError("Debes asignar una agencia para este rol.");
      return;
    }

    setGuardando(true);
    try {
      await api.post("/usuarios", {
        nombre,
        email,
        password,
        rol,
        agenciaId: requiereAgencia ? agenciaId : undefined,
      });
      setMensajeExito(`Usuario "${nombre}" creado exitosamente con rol ${ROL_LABEL[rol]}.`);
      setNombre("");
      setEmail("");
      setPassword("");
      setRol("PROMOTOR");
      setAgenciaId("");
      setMostrarForm(false);
      cargar();
    } catch (err) {
      setError(mensajeError(err));
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="screen-container">
      <div className="screen-header">
        <div style={{ display: "flex", alignItems: "center", gap: "0.65rem", flexWrap: "wrap" }}>
          <h1 style={{ display: "flex", alignItems: "center", gap: "0.4rem", margin: 0, fontSize: "1.2rem" }}>
            <span>👤</span> Gestión de Usuarios
          </h1>
          <span
            style={{
              fontSize: "0.72rem",
              fontWeight: 700,
              padding: "0.15rem 0.5rem",
              borderRadius: "4px",
              background: "rgba(99, 102, 241, 0.15)",
              color: "#6366f1",
              border: "1px solid rgba(99, 102, 241, 0.3)",
            }}
          >
            Personal & Roles
          </span>
        </div>
        {esAdmin && (
          <button
            className="btn"
            style={{ padding: "0.3rem 0.75rem", fontSize: "0.8rem" }}
            onClick={() => setMostrarForm((v) => !v)}
          >
            {mostrarForm ? "Cancelar" : "+ Nuevo usuario"}
          </button>
        )}
      </div>

      {error && <div className="alert error" style={{ margin: "0.25rem 0", padding: "0.4rem 0.75rem", fontSize: "0.82rem" }}>{error}</div>}
      {mensajeExito && <div className="alert success" style={{ margin: "0.25rem 0", padding: "0.4rem 0.75rem", fontSize: "0.82rem" }}>{mensajeExito}</div>}

      {/* KPI METRICS STRIP FINTECH */}
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
              TOTAL USUARIOS
            </span>
            <span style={{ fontSize: "0.85rem" }}>👥</span>
          </div>
          <span style={{ fontSize: "1.08rem", fontWeight: 700, color: "#6366f1", fontFamily: "monospace" }}>
            {usuarios?.length ?? 0}
          </span>
          <span style={{ fontSize: "0.65rem", color: "var(--ink-soft)" }}>Cuentas creadas</span>
        </div>

        <div
          style={{
            background: "var(--paper)",
            border: "1px solid var(--line)",
            borderLeft: "4px solid #9333ea",
            borderRadius: "8px",
            padding: "0.45rem 0.65rem",
            display: "flex",
            flexDirection: "column",
            boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "0.65rem", fontWeight: 700, color: "#9333ea", letterSpacing: "0.03em" }}>
              ADMIN & CONTROL
            </span>
            <span style={{ fontSize: "0.85rem" }}>🛡️</span>
          </div>
          <span style={{ fontSize: "1.08rem", fontWeight: 700, color: "#9333ea", fontFamily: "monospace" }}>
            {usuarios?.filter((u) => u.rol === "GERENCIA" || u.rol === "SUPERVISOR").length ?? 0}
          </span>
          <span style={{ fontSize: "0.65rem", color: "var(--ink-soft)" }}>Gerencia y Supervisión</span>
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
              OPERACIÓN & CAMPO
            </span>
            <span style={{ fontSize: "0.85rem" }}>💼</span>
          </div>
          <span style={{ fontSize: "1.08rem", fontWeight: 700, color: "#0284c7", fontFamily: "monospace" }}>
            {usuarios?.filter((u) => u.rol === "CAJERO" || u.rol === "PROMOTOR" || u.rol === "CAJA_CHICA").length ?? 0}
          </span>
          <span style={{ fontSize: "0.65rem", color: "var(--ink-soft)" }}>Caja y Promotores</span>
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
              CUENTAS ACTIVAS
            </span>
            <span style={{ fontSize: "0.85rem" }}>✅</span>
          </div>
          <span style={{ fontSize: "1.08rem", fontWeight: 700, color: "#059669", fontFamily: "monospace" }}>
            {usuarios?.filter((u) => u.activo).length ?? 0}
          </span>
          <span style={{ fontSize: "0.65rem", color: "var(--ink-soft)" }}>Habilitados para acceso</span>
        </div>
      </div>

      {mostrarForm && (
        <form className="card" onSubmit={crearUsuario} style={{ width: "100%", maxWidth: "100%", marginBottom: "1.5rem" }}>
          <h2 style={{ marginTop: 0, fontSize: "1.1rem" }}>Registrar nuevo usuario</h2>

          <div className="form-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))" }}>
            <div className="field">
              <label htmlFor="usr-nombre">Nombre y apellido</label>
              <input
                id="usr-nombre"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej. Pedro Morales López"
                required
              />
            </div>

            <div className="field">
              <label htmlFor="usr-email">Correo electrónico</label>
              <input
                id="usr-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ejemplo@mif.coop"
                required
              />
            </div>

            <div className="field">
              <label htmlFor="usr-password">Contraseña inicial</label>
              <input
                id="usr-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={8}
                placeholder="Mínimo 8 caracteres"
                required
              />
            </div>

            <div className="field">
              <label htmlFor="usr-rol">Rol del usuario</label>
              <select id="usr-rol" value={rol} onChange={(e) => setRol(e.target.value as RolUsuario)} required>
                {ROLES_DISPONIBLES.map((r) => (
                  <option key={r} value={r}>
                    {ROL_LABEL[r]}
                  </option>
                ))}
              </select>
            </div>

            {requiereAgencia && (
              <div className="field">
                <label htmlFor="usr-agencia">Agencia asignada</label>
                <select id="usr-agencia" value={agenciaId} onChange={(e) => setAgenciaId(e.target.value)} required>
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
          </div>

          <div style={{ marginTop: "1rem", display: "flex", gap: "0.75rem" }}>
            <button type="submit" className="btn" disabled={guardando}>
              {guardando ? "Creando usuario…" : "Crear usuario"}
            </button>
            <button type="button" className="btn secondary" onClick={() => setMostrarForm(false)}>
              Cancelar
            </button>
          </div>
        </form>
      )}

      <div className="table-scroll-container" style={{ flex: 1, minHeight: 0, marginTop: "0.5rem" }}>
        <table className="table-compact" style={{ width: "100%" }}>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Correo Institucional</th>
              <th>Rol / Cargo</th>
              <th>Agencia Asignada</th>
              <th style={{ textAlign: "center" }}>Estado</th>
            </tr>
          </thead>
          <tbody>
            {usuarios?.map((u) => (
              <tr key={u.id}>
                <td style={{ fontWeight: 600 }}>{u.nombre}</td>
                <td className="mono" style={{ fontSize: "0.8rem" }}>{u.email}</td>
                <td>
                  <span
                    style={{
                      display: "inline-block",
                      padding: "0.15rem 0.45rem",
                      borderRadius: "4px",
                      fontSize: "0.74rem",
                      fontWeight: 600,
                      background:
                         u.rol === "PROMOTOR"
                          ? "rgba(109, 40, 217, 0.12)"
                          : u.rol === "GERENCIA"
                            ? "rgba(153, 27, 27, 0.12)"
                            : u.rol === "SUPERVISOR"
                              ? "rgba(55, 48, 163, 0.12)"
                              : u.rol === "CAJA_CHICA"
                                ? "rgba(146, 64, 14, 0.12)"
                                : "rgba(100, 116, 139, 0.12)",
                      color:
                        u.rol === "PROMOTOR"
                          ? "#7c3aed"
                          : u.rol === "GERENCIA"
                            ? "#dc2626"
                            : u.rol === "SUPERVISOR"
                              ? "#4f46e5"
                              : u.rol === "CAJA_CHICA"
                                ? "#d97706"
                                : "#64748b",
                      border: "1px solid var(--line)",
                    }}
                  >
                    {ROL_LABEL[u.rol] ?? u.rol}
                  </span>
                </td>
                <td style={{ fontSize: "0.8rem" }}>{u.agencia_nombre ?? "Todas (Global)"}</td>
                <td style={{ textAlign: "center" }}>
                  <span className={`badge ${u.activo ? "activo" : "inactivo"}`} style={{ fontSize: "0.7rem", padding: "0.12rem 0.4rem" }}>
                    {u.activo ? "Activo" : "Inactivo"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {usuarios && usuarios.length === 0 && <div className="empty" style={{ padding: "1.5rem" }}>No hay usuarios registrados.</div>}
      </div>
    </div>
  );
}
