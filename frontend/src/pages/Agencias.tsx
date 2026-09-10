import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { api, mensajeError } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import type { Agencia } from "../types";

export default function Agencias() {
  const { usuario } = useAuth();
  const [agencias, setAgencias] = useState<Agencia[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [codigo, setCodigo] = useState("");
  const [nombre, setNombre] = useState("");
  const [direccion, setDireccion] = useState("");
  const [guardando, setGuardando] = useState(false);

  function cargar() {
    api
      .get<Agencia[]>("/agencias")
      .then(({ data }) => setAgencias(data))
      .catch((err) => setError(mensajeError(err)));
  }

  useEffect(cargar, []);

  async function crear(e: FormEvent) {
    e.preventDefault();
    setGuardando(true);
    setError(null);
    try {
      await api.post("/agencias", { codigo, nombre, direccion: direccion || undefined });
      setCodigo("");
      setNombre("");
      setDireccion("");
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
          <h1>Agencias</h1>
          <p>Cada agencia captura sus propios movimientos; este consolidado une todas en un solo sistema.</p>
        </div>
        {usuario?.rol === "ADMIN" && (
          <button className="btn" onClick={() => setMostrarForm((v) => !v)}>
            {mostrarForm ? "Cancelar" : "+ Nueva agencia"}
          </button>
        )}
      </div>

      {error && <div className="alert error">{error}</div>}

      {/* KPI METRICS - 100% FLUID */}
      <div className="stat-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", marginBottom: "1.5rem" }}>
        <div className="stat-card accent">
          <span className="label">Total Agencias</span>
          <span className="value mono">{agencias.length}</span>
          <span className="sub">Puntos de atención registrados</span>
        </div>
        <div className="stat-card">
          <span className="label">Agencias Operativas</span>
          <span className="value mono" style={{ color: "#10b981" }}>
            {agencias.filter((a) => a.activa).length}
          </span>
          <span className="sub">Activas para ventanilla y campo</span>
        </div>
      </div>

      {mostrarForm && (
        <form className="card" onSubmit={crear} style={{ width: "100%", maxWidth: "100%", marginBottom: "1.5rem" }}>
          <div className="form-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))" }}>
            <div className="field">
              <label>Código</label>
              <input value={codigo} onChange={(e) => setCodigo(e.target.value.toUpperCase())} required maxLength={30} />
              <span className="hint">Corto y sin espacios, p. ej. CHAJUL.</span>
            </div>
            <div className="field">
              <label>Nombre</label>
              <input value={nombre} onChange={(e) => setNombre(e.target.value)} required />
            </div>
            <div className="field">
              <label>Dirección</label>
              <input value={direccion} onChange={(e) => setDireccion(e.target.value)} />
            </div>
          </div>
          <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.5rem" }}>
            <button className="btn" type="submit" disabled={guardando}>
              {guardando ? "Guardando…" : "Guardar agencia"}
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
              <th>Código</th>
              <th>Nombre</th>
              <th>Dirección</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {agencias.map((a) => (
              <tr key={a.id}>
                <td className="mono">{a.codigo}</td>
                <td>{a.nombre}</td>
                <td>{a.direccion ?? "—"}</td>
                <td>
                  <span className={`badge ${a.activa ? "activo" : "inactivo"}`}>{a.activa ? "Activa" : "Inactiva"}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
