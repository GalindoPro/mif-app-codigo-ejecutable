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

  // Formulario nuevo usuario
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rol, setRol] = useState<RolUsuario>("PROMOTOR");
  const [agenciaId, setAgenciaId] = useState("");

  // Modal Edición de Datos
  const [usuarioEditando, setUsuarioEditando] = useState<UsuarioItem | null>(null);
  const [nombreEdit, setNombreEdit] = useState("");
  const [emailEdit, setEmailEdit] = useState("");
  const [rolEdit, setRolEdit] = useState<RolUsuario>("PROMOTOR");
  const [agenciaIdEdit, setAgenciaIdEdit] = useState<string>("");
  const [activoEdit, setActivoEdit] = useState<boolean>(true);

  // Modal Cambio / Restablecimiento de Contraseña
  const [usuarioPassword, setUsuarioPassword] = useState<UsuarioItem | null>(null);
  const [nuevaPassword, setNuevaPassword] = useState("");
  const [confirmarPassword, setConfirmarPassword] = useState("");
  const [mostrarPwd, setMostrarPwd] = useState(false);

  const esAdmin = usuario?.rol === "GERENCIA" || usuario?.rol === "SUPERVISOR";

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
  const requiereAgenciaEdit = rolEdit === "SUPERVISOR" || rolEdit === "CAJERO" || rolEdit === "PROMOTOR";

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

  function abrirModalEditar(u: UsuarioItem) {
    setError(null);
    setMensajeExito(null);
    setUsuarioEditando(u);
    setNombreEdit(u.nombre);
    setEmailEdit(u.email);
    setRolEdit(u.rol);
    setAgenciaIdEdit(u.agencia_id || "");
    setActivoEdit(u.activo);
  }

  async function guardarEdicion(e: FormEvent) {
    e.preventDefault();
    if (!usuarioEditando) return;
    setError(null);
    setMensajeExito(null);

    if (requiereAgenciaEdit && !agenciaIdEdit) {
      setError("Debes asignar una agencia para este rol.");
      return;
    }

    setGuardando(true);
    try {
      await api.put(`/usuarios/${usuarioEditando.id}`, {
        nombre: nombreEdit,
        email: emailEdit,
        rol: rolEdit,
        agenciaId: requiereAgenciaEdit ? agenciaIdEdit : null,
        activo: activoEdit,
      });
      setMensajeExito(`Datos del usuario "${nombreEdit}" actualizados exitosamente.`);
      setUsuarioEditando(null);
      cargar();
    } catch (err) {
      setError(mensajeError(err));
    } finally {
      setGuardando(false);
    }
  }

  function abrirModalPassword(u: UsuarioItem) {
    setError(null);
    setMensajeExito(null);
    setUsuarioPassword(u);
    setNuevaPassword("");
    setConfirmarPassword("");
    setMostrarPwd(false);
  }

  async function guardarPassword(e: FormEvent) {
    e.preventDefault();
    if (!usuarioPassword) return;
    setError(null);
    setMensajeExito(null);

    if (nuevaPassword.length < 6) {
      setError("La nueva contraseña debe tener al menos 6 caracteres.");
      return;
    }
    if (nuevaPassword !== confirmarPassword) {
      setError("Las contraseñas no coinciden. Por favor verifica.");
      return;
    }

    setGuardando(true);
    try {
      await api.patch(`/usuarios/${usuarioPassword.id}/password`, {
        password: nuevaPassword,
      });
      setMensajeExito(`Contraseña restablecida correctamente para ${usuarioPassword.nombre}.`);
      setUsuarioPassword(null);
    } catch (err) {
      setError(mensajeError(err));
    } finally {
      setGuardando(false);
    }
  }

  async function toggleActivo(u: UsuarioItem) {
    if (!confirm(`¿Estás seguro de ${u.activo ? "inhabilitar" : "activar"} el acceso a ${u.nombre}?`)) {
      return;
    }
    setError(null);
    setMensajeExito(null);
    try {
      await api.patch(`/usuarios/${u.id}/toggle-activo`);
      setMensajeExito(`Estado de acceso actualizado para ${u.nombre}.`);
      cargar();
    } catch (err) {
      setError(mensajeError(err));
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
            Personal & Roles Oficiales
          </span>
        </div>
        {esAdmin && (
          <button
            className="btn"
            style={{ padding: "0.3rem 0.75rem", fontSize: "0.8rem", background: "#059669", color: "#fff", borderColor: "#059669" }}
            onClick={() => setMostrarForm((v) => !v)}
          >
            {mostrarForm ? "✖ Cancelar" : "➕ Nuevo usuario"}
          </button>
        )}
      </div>

      {error && <div className="alert error" style={{ margin: "0.25rem 0", padding: "0.4rem 0.75rem", fontSize: "0.82rem" }}>{error}</div>}
      {mensajeExito && <div className="alert success" style={{ margin: "0.25rem 0", padding: "0.4rem 0.75rem", fontSize: "0.82rem" }}>{mensajeExito}</div>}

      {/* KPI METRICS STRIP */}
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
            borderLeft: "4px solid #d97706",
            borderRadius: "8px",
            padding: "0.45rem 0.65rem",
            display: "flex",
            flexDirection: "column",
            boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "0.65rem", fontWeight: 700, color: "#d97706", letterSpacing: "0.03em" }}>
              OPERACIÓN & CAMPO
            </span>
            <span style={{ fontSize: "0.85rem" }}>💼</span>
          </div>
          <span style={{ fontSize: "1.08rem", fontWeight: 700, color: "#d97706", fontFamily: "monospace" }}>
            {usuarios?.filter((u) => u.rol === "CAJERO" || u.rol === "PROMOTOR" || u.rol === "CAJA_CHICA").length ?? 0}
          </span>
          <span style={{ fontSize: "0.65rem", color: "var(--ink-soft)" }}>Caja y Promotores</span>
        </div>

        <div
          style={{
            background: "var(--paper)",
            border: "1px solid var(--line)",
            borderLeft: "4px solid #10b981",
            borderRadius: "8px",
            padding: "0.45rem 0.65rem",
            display: "flex",
            flexDirection: "column",
            boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "0.65rem", fontWeight: 700, color: "#10b981", letterSpacing: "0.03em" }}>
              CUENTAS ACTIVAS
            </span>
            <span style={{ fontSize: "0.85rem" }}>✅</span>
          </div>
          <span style={{ fontSize: "1.08rem", fontWeight: 700, color: "#10b981", fontFamily: "monospace" }}>
            {usuarios?.filter((u) => u.activo).length ?? 0}
          </span>
          <span style={{ fontSize: "0.65rem", color: "var(--ink-soft)" }}>Habilitados para acceso</span>
        </div>
      </div>

      {/* FORMULARIO DE NUEVO USUARIO */}
      {mostrarForm && (
        <form
          onSubmit={crearUsuario}
          style={{
            background: "var(--paper)",
            border: "1px solid var(--line)",
            borderRadius: "8px",
            padding: "1rem",
            marginTop: "0.5rem",
          }}
        >
          <h2 style={{ fontSize: "1rem", marginTop: 0, marginBottom: "0.75rem", color: "#10b981" }}>
            Crear nuevo colaborador institucional
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "0.75rem" }}>
            <div className="field">
              <label htmlFor="usr-nombre">Nombre completo</label>
              <input
                id="usr-nombre"
                placeholder="Ej. Diego Rivera (Promotor)"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                required
              />
            </div>

            <div className="field">
              <label htmlFor="usr-email">Correo institucional</label>
              <input
                id="usr-email"
                type="email"
                placeholder="diego.promotor@mif.coop"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="field">
              <label htmlFor="usr-password">Contraseña inicial</label>
              <input
                id="usr-password"
                type="password"
                placeholder="Mínimo 6 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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
            <button type="submit" className="btn primary" disabled={guardando} style={{ background: "#059669" }}>
              {guardando ? "Creando usuario…" : "Guardar Colaborador"}
            </button>
            <button type="button" className="btn secondary" onClick={() => setMostrarForm(false)}>
              Cancelar
            </button>
          </div>
        </form>
      )}

      {/* TABLA DE USUARIOS CON ACCIONES */}
      <div className="table-scroll-container" style={{ flex: 1, minHeight: 0, marginTop: "0.5rem" }}>
        <table className="table-compact" style={{ width: "100%" }}>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Correo Institucional</th>
              <th>Rol / Cargo</th>
              <th>Agencia Asignada</th>
              <th style={{ textAlign: "center" }}>Estado</th>
              <th style={{ textAlign: "center", minWidth: 180 }}>Acciones</th>
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
                <td style={{ textAlign: "center" }}>
                  <div style={{ display: "flex", gap: "0.3rem", justifyContent: "center" }}>
                    <button
                      type="button"
                      className="btn secondary"
                      style={{ fontSize: "0.72rem", padding: "0.2rem 0.45rem" }}
                      onClick={() => abrirModalEditar(u)}
                      title="Editar datos del usuario"
                    >
                      ✏️ Editar
                    </button>
                    <button
                      type="button"
                      className="btn secondary"
                      style={{
                        fontSize: "0.72rem",
                        padding: "0.2rem 0.45rem",
                        borderColor: "#BF9903",
                        color: "#BF9903",
                      }}
                      onClick={() => abrirModalPassword(u)}
                      title="Restablecer contraseña"
                    >
                      🔑 Clave
                    </button>
                    {esAdmin && (
                      <button
                        type="button"
                        className="btn secondary"
                        style={{
                          fontSize: "0.72rem",
                          padding: "0.2rem 0.45rem",
                          color: u.activo ? "#ef4444" : "#10b981",
                        }}
                        onClick={() => toggleActivo(u)}
                        title={u.activo ? "Inhabilitar acceso" : "Reactivar acceso"}
                      >
                        {u.activo ? "⛔" : "✅"}
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {usuarios && usuarios.length === 0 && <div className="empty" style={{ padding: "1.5rem" }}>No hay usuarios registrados.</div>}
      </div>

      {/* MODAL EDITAR USUARIO (CONFORME A REGLA INSTITUCIONAL) */}
      {usuarioEditando && (
        <div
          className="modal-overlay"
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0, 0, 0, 0.75)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "1rem",
          }}
        >
          <div
            className="modal-card"
            style={{
              background: "#0f172a",
              border: "1px solid rgba(148, 163, 184, 0.25)",
              borderRadius: "14px",
              width: "100%",
              maxWidth: "520px",
              padding: "1.5rem",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.75)",
              color: "#f8fafc",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <h3 style={{ margin: 0, fontSize: "1.1rem", display: "flex", alignItems: "center", gap: "0.5rem", color: "#10b981" }}>
                <span>✏️</span> Editar Colaborador
              </h3>
              <button
                type="button"
                onClick={() => setUsuarioEditando(null)}
                style={{ background: "transparent", border: "none", color: "#94a3b8", fontSize: "1.2rem", cursor: "pointer" }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={guardarEdicion}>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
                <div className="field">
                  <label style={{ fontSize: "0.8rem", color: "#cbd5e1" }}>Nombre Completo</label>
                  <input
                    value={nombreEdit}
                    onChange={(e) => setNombreEdit(e.target.value)}
                    required
                    style={{ background: "#1e293b", color: "#f8fafc", border: "1px solid #334155" }}
                  />
                </div>

                <div className="field">
                  <label style={{ fontSize: "0.8rem", color: "#cbd5e1" }}>Correo Electrónico Institucional</label>
                  <input
                    type="email"
                    value={emailEdit}
                    onChange={(e) => setEmailEdit(e.target.value)}
                    required
                    style={{ background: "#1e293b", color: "#f8fafc", border: "1px solid #334155" }}
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                  <div className="field">
                    <label style={{ fontSize: "0.8rem", color: "#cbd5e1" }}>Rol / Cargo</label>
                    <select
                      value={rolEdit}
                      onChange={(e) => setRolEdit(e.target.value as RolUsuario)}
                      required
                      style={{ background: "#1e293b", color: "#f8fafc", border: "1px solid #334155" }}
                    >
                      {ROLES_DISPONIBLES.map((r) => (
                        <option key={r} value={r}>
                          {ROL_LABEL[r]}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="field">
                    <label style={{ fontSize: "0.8rem", color: "#cbd5e1" }}>Estado de Acceso</label>
                    <select
                      value={activoEdit ? "ACTIVO" : "INACTIVO"}
                      onChange={(e) => setActivoEdit(e.target.value === "ACTIVO")}
                      style={{ background: "#1e293b", color: "#f8fafc", border: "1px solid #334155" }}
                    >
                      <option value="ACTIVO">Activo (Habilitado)</option>
                      <option value="INACTIVO">Inactivo (Suspendido)</option>
                    </select>
                  </div>
                </div>

                {requiereAgenciaEdit && (
                  <div className="field">
                    <label style={{ fontSize: "0.8rem", color: "#cbd5e1" }}>Agencia Asignada</label>
                    <select
                      value={agenciaIdEdit}
                      onChange={(e) => setAgenciaIdEdit(e.target.value)}
                      required
                      style={{ background: "#1e293b", color: "#f8fafc", border: "1px solid #334155" }}
                    >
                      <option value="" disabled>Selecciona una agencia</option>
                      {agencias.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.nombre} ({a.codigo})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div style={{ marginTop: "1.25rem", display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
                <button
                  type="button"
                  className="btn secondary"
                  onClick={() => setUsuarioEditando(null)}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn primary"
                  disabled={guardando}
                  style={{ background: "#059669", borderColor: "#059669", color: "#fff" }}
                >
                  {guardando ? "Guardando…" : "Actualizar Colaborador"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL RESTABLECER / CAMBIAR CONTRASEÑA */}
      {usuarioPassword && (
        <div
          className="modal-overlay"
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0, 0, 0, 0.75)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "1rem",
          }}
        >
          <div
            className="modal-card"
            style={{
              background: "#0f172a",
              border: "1px solid rgba(148, 163, 184, 0.25)",
              borderRadius: "14px",
              width: "100%",
              maxWidth: "460px",
              padding: "1.5rem",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.75)",
              color: "#f8fafc",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <div>
                <h3 style={{ margin: 0, fontSize: "1.1rem", display: "flex", alignItems: "center", gap: "0.5rem", color: "#BF9903" }}>
                  <span>🔑</span> Restablecer Contraseña
                </h3>
                <span style={{ fontSize: "0.75rem", color: "#94a3b8" }}>
                  Usuario: <strong>{usuarioPassword.nombre}</strong> ({usuarioPassword.email})
                </span>
              </div>
              <button
                type="button"
                onClick={() => setUsuarioPassword(null)}
                style={{ background: "transparent", border: "none", color: "#94a3b8", fontSize: "1.2rem", cursor: "pointer" }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={guardarPassword}>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
                <div className="field">
                  <label style={{ fontSize: "0.8rem", color: "#cbd5e1" }}>Nueva Contraseña</label>
                  <div style={{ position: "relative" }}>
                    <input
                      type={mostrarPwd ? "text" : "password"}
                      value={nuevaPassword}
                      onChange={(e) => setNuevaPassword(e.target.value)}
                      placeholder="Mínimo 6 caracteres"
                      required
                      style={{ background: "#1e293b", color: "#f8fafc", border: "1px solid #334155", width: "100%", paddingRight: "2.5rem" }}
                    />
                    <button
                      type="button"
                      onClick={() => setMostrarPwd(!mostrarPwd)}
                      style={{
                        position: "absolute",
                        right: "0.5rem",
                        top: "50%",
                        transform: "translateY(-50%)",
                        background: "transparent",
                        border: "none",
                        color: "#94a3b8",
                        cursor: "pointer",
                      }}
                    >
                      {mostrarPwd ? "👁️" : "🙈"}
                    </button>
                  </div>
                </div>

                <div className="field">
                  <label style={{ fontSize: "0.8rem", color: "#cbd5e1" }}>Confirmar Nueva Contraseña</label>
                  <input
                    type={mostrarPwd ? "text" : "password"}
                    value={confirmarPassword}
                    onChange={(e) => setConfirmarPassword(e.target.value)}
                    placeholder="Repita la contraseña"
                    required
                    style={{ background: "#1e293b", color: "#f8fafc", border: "1px solid #334155" }}
                  />
                </div>

                <div style={{ fontSize: "0.75rem", color: "#94a3b8", background: "rgba(191, 153, 3, 0.1)", padding: "0.5rem 0.75rem", borderRadius: "6px", border: "1px solid rgba(191, 153, 3, 0.25)" }}>
                  💡 <strong>Políticas COOP COMIF R.L.:</strong> Como administrador/gerencia, entrega esta contraseña inicial al colaborador por un medio seguro. El usuario podrá acceder inmediatamente a su panel.
                </div>
              </div>

              <div style={{ marginTop: "1.25rem", display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
                <button
                  type="button"
                  className="btn secondary"
                  onClick={() => setUsuarioPassword(null)}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn primary"
                  disabled={guardando}
                  style={{ background: "#BF9903", borderColor: "#BF9903", color: "#000", fontWeight: 700 }}
                >
                  {guardando ? "Actualizando…" : "Asignar Contraseña"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
