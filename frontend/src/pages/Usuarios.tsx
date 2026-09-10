import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { api, mensajeError } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { ROL_LABEL } from "../types";
import type { Agencia, RolUsuario, UsuarioItem } from "../types";

const ROLES_DISPONIBLES: RolUsuario[] = ["ADMIN", "GERENCIA", "SUPERVISOR", "CAJERO", "PROMOTOR"];

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

  const esAdmin = usuario?.rol === "ADMIN";

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
    <div>
      <div className="page-head">
        <div>
          <h1>Gestión de Usuarios</h1>
          <p>Administra el personal de la cooperativa: administradores, gerencia, jefes, cajeros y promotores.</p>
        </div>
        {esAdmin && (
          <button className="btn" onClick={() => setMostrarForm((v) => !v)}>
            {mostrarForm ? "Cancelar" : "+ Nuevo usuario"}
          </button>
        )}
      </div>

      {error && <div className="alert error">{error}</div>}
      {mensajeExito && <div className="alert success">{mensajeExito}</div>}

      {/* KPI METRICS STRIP - 100% FLUID */}
      <div className="stat-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", marginBottom: "1.5rem" }}>
        <div className="stat-card accent">
          <span className="label">Total Usuarios</span>
          <span className="value mono">{usuarios?.length ?? 0}</span>
          <span className="sub">Cuentas creadas</span>
        </div>
        <div className="stat-card">
          <span className="label">Administración y Control</span>
          <span className="value mono">
            {usuarios?.filter((u) => u.rol === "ADMIN" || u.rol === "GERENCIA" || u.rol === "SUPERVISOR").length ?? 0}
          </span>
          <span className="sub">Admin, Gerencia y Jefes</span>
        </div>
        <div className="stat-card">
          <span className="label">Operaciones y Campo</span>
          <span className="value mono">
            {usuarios?.filter((u) => u.rol === "CAJERO" || u.rol === "PROMOTOR").length ?? 0}
          </span>
          <span className="sub">Caja y Promoción</span>
        </div>
        <div className="stat-card">
          <span className="label">Cuentas Activas</span>
          <span className="value mono" style={{ color: "#10b981" }}>
            {usuarios?.filter((u) => u.activo).length ?? 0}
          </span>
          <span className="sub">Habilitados para acceso</span>
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

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Correo</th>
              <th>Rol</th>
              <th>Agencia</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {usuarios?.map((u) => (
              <tr key={u.id}>
                <td style={{ fontWeight: 600 }}>{u.nombre}</td>
                <td className="mono">{u.email}</td>
                <td>
                  <span
                    style={{
                      display: "inline-block",
                      padding: "0.2rem 0.55rem",
                      borderRadius: "6px",
                      fontSize: "0.82rem",
                      fontWeight: 600,
                      background:
                        u.rol === "PROMOTOR"
                          ? "#ede9fe"
                          : u.rol === "ADMIN"
                            ? "#fee2e2"
                            : u.rol === "GERENCIA"
                              ? "#e0e7ff"
                              : "#e2e8f0",
                      color:
                        u.rol === "PROMOTOR"
                          ? "#6d28d9"
                          : u.rol === "ADMIN"
                            ? "#991b1b"
                            : u.rol === "GERENCIA"
                              ? "#3730a3"
                              : "#334155",
                    }}
                  >
                    {ROL_LABEL[u.rol] ?? u.rol}
                  </span>
                </td>
                <td>{u.agencia_nombre ?? "Todas (Global)"}</td>
                <td>
                  <span className={`badge ${u.activo ? "activo" : "inactivo"}`}>
                    {u.activo ? "Activo" : "Inactivo"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {usuarios && usuarios.length === 0 && <div className="empty">No hay usuarios registrados.</div>}
      </div>
    </div>
  );
}
