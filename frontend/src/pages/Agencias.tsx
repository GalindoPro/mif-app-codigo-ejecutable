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
    <div className="screen-container">
      <div className="screen-header">
        <div style={{ display: "flex", alignItems: "center", gap: "0.65rem", flexWrap: "wrap" }}>
          <h1 style={{ display: "flex", alignItems: "center", gap: "0.4rem", margin: 0, fontSize: "1.2rem" }}>
            <span>🏢</span> Agencias y Puntos de Atención
          </h1>
          <span
            style={{
              fontSize: "0.72rem",
              fontWeight: 700,
              padding: "0.15rem 0.5rem",
              borderRadius: "4px",
              background: "rgba(2, 132, 199, 0.15)",
              color: "#0284c7",
              border: "1px solid rgba(2, 132, 199, 0.3)",
            }}
          >
            Red Cooperativa
          </span>
        </div>
        {usuario?.rol === "GERENCIA" && (
          <button
            className="btn"
            style={{ padding: "0.3rem 0.75rem", fontSize: "0.8rem" }}
            onClick={() => setMostrarForm((v) => !v)}
          >
            {mostrarForm ? "Cancelar" : "+ Nueva agencia"}
          </button>
        )}
      </div>

      {error && <div className="alert error" style={{ margin: "0.25rem 0", padding: "0.4rem 0.75rem", fontSize: "0.82rem" }}>{error}</div>}

      {/* KPI METRICS STRIP FINTECH */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "0.5rem" }}>
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
              TOTAL AGENCIAS
            </span>
            <span style={{ fontSize: "0.85rem" }}>🏢</span>
          </div>
          <span style={{ fontSize: "1.08rem", fontWeight: 700, color: "#0284c7", fontFamily: "monospace" }}>
            {agencias.length}
          </span>
          <span style={{ fontSize: "0.65rem", color: "var(--ink-soft)" }}>Puntos de atención registrados</span>
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
              AGENCIAS OPERATIVAS
            </span>
            <span style={{ fontSize: "0.85rem" }}>✅</span>
          </div>
          <span style={{ fontSize: "1.08rem", fontWeight: 700, color: "#059669", fontFamily: "monospace" }}>
            {agencias.filter((a) => a.activa).length}
          </span>
          <span style={{ fontSize: "0.65rem", color: "var(--ink-soft)" }}>Activas para ventanilla y campo</span>
        </div>
      </div>

      {mostrarForm && (
        <form className="card" onSubmit={crear} style={{ width: "100%", maxWidth: "100%", margin: "0.5rem 0" }}>
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

      <div className="table-scroll-container" style={{ flex: 1, minHeight: 0, marginTop: "0.5rem" }}>
        <table className="table-compact" style={{ width: "100%" }}>
          <thead>
            <tr>
              <th>Código</th>
              <th>Nombre de Agencia</th>
              <th>Dirección</th>
              <th style={{ textAlign: "center" }}>Estado</th>
            </tr>
          </thead>
          <tbody>
            {agencias.map((a) => (
              <tr key={a.id}>
                <td className="mono" style={{ fontWeight: 700, color: "var(--accent)" }}>{a.codigo}</td>
                <td style={{ fontWeight: 600 }}>{a.nombre}</td>
                <td style={{ fontSize: "0.8rem" }}>{a.direccion ?? "—"}</td>
                <td style={{ textAlign: "center" }}>
                  <span className={`badge ${a.activa ? "activo" : "inactivo"}`} style={{ fontSize: "0.7rem", padding: "0.12rem 0.4rem" }}>
                    {a.activa ? "Activa" : "Inactiva"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
