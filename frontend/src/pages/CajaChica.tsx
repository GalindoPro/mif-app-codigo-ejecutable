import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { api, mensajeError } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { CATEGORIA_CAJA_CHICA_LABEL, formatoQ } from "../types";
import type { Agencia, CategoriaCajaChica, ListaCajaChica } from "../types";
import CajaChicaReporteModal from "../components/CajaChicaReporteModal";

const CATEGORIAS = Object.entries(CATEGORIA_CAJA_CHICA_LABEL) as [CategoriaCajaChica, string][];

export default function CajaChica() {
  const { usuario } = useAuth();
  const puedeElegirAgencia = usuario?.rol === "ADMIN" || usuario?.rol === "GERENCIA";

  const [q, setQ] = useState("");
  const [resultado, setResultado] = useState<ListaCajaChica | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [mostrarReporte, setMostrarReporte] = useState(false);
  const [agencias, setAgencias] = useState<Agencia[]>([]);

  const [agenciaId, setAgenciaId] = useState(usuario?.agenciaId ?? "");
  const [tipo, setTipo] = useState<"INGRESO" | "EGRESO">("EGRESO");
  const [categoria, setCategoria] = useState<CategoriaCajaChica | "">("");
  const [fecha, setFecha] = useState(() => new Date().toISOString().slice(0, 10));
  const [beneficiario, setBeneficiario] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [monto, setMonto] = useState("");
  const [numeroDocumento, setNumeroDocumento] = useState("DTE");
  const [guardando, setGuardando] = useState(false);

  // Estados para Reposición de Fondo Fijo
  const [mostrarReposicion, setMostrarReposicion] = useState(false);
  const [repoCheque, setRepoCheque] = useState("");
  const [repoMonto, setRepoMonto] = useState("2000");
  const [repoFecha, setRepoFecha] = useState(() => new Date().toISOString().slice(0, 10));
  const [repoDesc, setRepoDesc] = useState("Reposición mensual de fondo fijo de caja chica");
  const [repoGuardando, setRepoGuardando] = useState(false);

  useEffect(() => {
    if (puedeElegirAgencia) api.get<Agencia[]>("/agencias").then(({ data }) => setAgencias(data));
  }, [puedeElegirAgencia]);

  function cargar() {
    api
      .get<ListaCajaChica>("/caja-chica", { params: { q: q || undefined } })
      .then(({ data }) => setResultado(data))
      .catch((err) => setError(mensajeError(err)));
  }

  useEffect(() => {
    if (!q) {
      cargar();
      return;
    }
    const timeout = setTimeout(cargar, 250);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  async function crear(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setGuardando(true);
    try {
      await api.post("/caja-chica", {
        agenciaId,
        fecha,
        beneficiario,
        descripcion,
        tipo,
        categoria: tipo === "EGRESO" && categoria ? categoria : undefined,
        monto: Number(monto),
        numeroDocumento: numeroDocumento || undefined,
      });
      setBeneficiario("");
      setDescripcion("");
      setMonto("");
      setNumeroDocumento("DTE");
      setCategoria("");
      setMostrarForm(false);
      cargar();
    } catch (err) {
      setError(mensajeError(err));
    } finally {
      setGuardando(false);
    }
  }

  async function handleReponerFondo(e: FormEvent) {
    e.preventDefault();
    if (!repoCheque.trim()) {
      setError("El número de cheque o comprobante (No. CH.) es obligatorio.");
      return;
    }
    setError(null);
    setRepoGuardando(true);
    try {
      await api.post("/caja-chica/reponer-fondo", {
        agenciaId,
        monto: Number(repoMonto),
        numeroCheque: repoCheque.trim(),
        descripcion: repoDesc,
        fecha: repoFecha,
      });
      setRepoCheque("");
      setMostrarReposicion(false);
      cargar();
    } catch (err) {
      setError(mensajeError(err));
    } finally {
      setRepoGuardando(false);
    }
  }

  const totalEgresosCategorias = resultado?.totalesPorCategoria.reduce((acc, c) => acc + Number(c.total), 0) ?? 1;

  return (
    <div className="screen-container">
      <div className={mostrarReporte ? "no-print" : ""}>
        {/* CABECERA COMPACTA DE 1 LÍNEA */}
        <div className="screen-header">
          <div>
            <h1 style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <span>📥</span> Caja Chica
            </h1>
            <p>Comprobantes de ingreso y egreso — libro auxiliar operativo en vivo.</p>
          </div>
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            <button
              type="button"
              className="btn secondary"
              style={{ fontSize: "0.82rem", padding: "0.4rem 0.75rem", fontWeight: 700, borderColor: "var(--accent)" }}
              onClick={() => setMostrarReporte(true)}
            >
              📄 Informe de Gastos
            </button>
            <button
              className="btn"
              style={{ fontSize: "0.82rem", padding: "0.4rem 0.75rem", background: "#059669", borderColor: "#059669" }}
              onClick={() => {
                setMostrarReposicion((v) => !v);
                setMostrarForm(false);
              }}
            >
              {mostrarReposicion ? "Cancelar reposición" : "📥 Reponer Fondo (Cheque)"}
            </button>
            <button
              className="btn"
              style={{ fontSize: "0.82rem", padding: "0.4rem 0.75rem" }}
              onClick={() => {
                setMostrarForm((v) => !v);
                setMostrarReposicion(false);
              }}
            >
              {mostrarForm ? "Cancelar" : "+ Nuevo comprobante"}
            </button>
          </div>
        </div>

        {error && <div className="alert error" style={{ margin: "0.4rem 0", padding: "0.5rem 0.8rem", fontSize: "0.85rem" }}>{error}</div>}

        {/* CINTILLO SUPERIOR DE KPIS COMPACTOS */}
        {resultado && (
          <div className="screen-kpis" style={{ margin: "0.4rem 0" }}>
            <div className="kpi-tile accent" style={{ padding: "0.5rem 0.85rem" }}>
              <span className="kpi-tile-label">Saldo Actual</span>
              <span className="kpi-tile-value" style={{ color: "#10b981" }}>{formatoQ(resultado.saldoActual)}</span>
              <span className="kpi-tile-sub">Fondo disponible</span>
            </div>
            <div className="kpi-tile" style={{ padding: "0.5rem 0.85rem" }}>
              <span className="kpi-tile-label">Total Ingresos</span>
              <span className="kpi-tile-value">{formatoQ(resultado.totalIngresos)}</span>
              <span className="kpi-tile-sub">Reposiciones registradas</span>
            </div>
            <div className="kpi-tile" style={{ padding: "0.5rem 0.85rem" }}>
              <span className="kpi-tile-label">Total Egresos</span>
              <span className="kpi-tile-value" style={{ color: "#ef4444" }}>{formatoQ(resultado.totalEgresos)}</span>
              <span className="kpi-tile-sub">Gastos comprobados</span>
            </div>
            <div className="kpi-tile" style={{ padding: "0.5rem 0.85rem" }}>
              <span className="kpi-tile-label">Comprobantes</span>
              <span className="kpi-tile-value">{resultado.data.length}</span>
              <span className="kpi-tile-sub">Movimientos en libro</span>
            </div>
          </div>
        )}

        {/* DISTRIBUCIÓN DE 2 COLUMNAS BALANCEADAS (PANTALLA COMPLETA 100VH) */}
        <div className="screen-split-layout">
          {/* PANEL IZQUIERDO: EGRESOS POR CATEGORÍA O FORMULARIOS DE ACCIÓN */}
          <div className="screen-panel scrollable">
            {mostrarReposicion ? (
              <form onSubmit={handleReponerFondo} style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <h3 style={{ margin: 0, fontSize: "0.95rem", color: "#10b981" }}>📥 Reposición Fondo Fijo</h3>
                  <button type="button" className="link-btn" onClick={() => setMostrarReposicion(false)}>Cerrar</button>
                </div>
                <div className="field" style={{ marginBottom: "0.4rem" }}>
                  <label htmlFor="repo-fecha">Fecha del cheque</label>
                  <input id="repo-fecha" type="date" value={repoFecha} onChange={(e) => setRepoFecha(e.target.value)} required />
                </div>
                <div className="field" style={{ marginBottom: "0.4rem" }}>
                  <label htmlFor="repo-cheque">No. de Cheque (No. CH.)</label>
                  <input id="repo-cheque" placeholder="Ej. 1290" value={repoCheque} onChange={(e) => setRepoCheque(e.target.value)} required style={{ fontWeight: 700 }} />
                </div>
                <div className="field" style={{ marginBottom: "0.4rem" }}>
                  <label htmlFor="repo-monto">Monto (Q)</label>
                  <input id="repo-monto" type="number" min="1" step="0.01" value={repoMonto} onChange={(e) => setRepoMonto(e.target.value)} required style={{ fontWeight: 700 }} />
                </div>
                <div className="field" style={{ marginBottom: "0.4rem" }}>
                  <label htmlFor="repo-desc">Descripción</label>
                  <input id="repo-desc" value={repoDesc} onChange={(e) => setRepoDesc(e.target.value)} />
                </div>
                <button type="submit" className="btn" style={{ background: "#059669", marginTop: "0.3rem" }} disabled={repoGuardando}>
                  {repoGuardando ? "Ingresando…" : `Confirmar ${formatoQ(Number(repoMonto) || 0)}`}
                </button>
              </form>
            ) : mostrarForm ? (
              <form onSubmit={crear} style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <h3 style={{ margin: 0, fontSize: "0.95rem" }}>+ Nuevo Comprobante</h3>
                  <button type="button" className="link-btn" onClick={() => setMostrarForm(false)}>Cerrar</button>
                </div>
                {puedeElegirAgencia && (
                  <div className="field" style={{ marginBottom: "0.3rem" }}>
                    <label htmlFor="cc-agencia">Agencia</label>
                    <select id="cc-agencia" value={agenciaId} onChange={(e) => setAgenciaId(e.target.value)} required>
                      <option value="" disabled>Selecciona agencia</option>
                      {agencias.map((a) => <option key={a.id} value={a.id}>{a.nombre}</option>)}
                    </select>
                  </div>
                )}
                <div className="field" style={{ marginBottom: "0.3rem" }}>
                  <label>Tipo</label>
                  <div className="tipo-toggle">
                    <button type="button" className={tipo === "INGRESO" ? "on deposito" : ""} onClick={() => setTipo("INGRESO")}>Ingreso</button>
                    <button type="button" className={tipo === "EGRESO" ? "on retiro" : ""} onClick={() => setTipo("EGRESO")}>Egreso</button>
                  </div>
                </div>
                {tipo === "EGRESO" && (
                  <div className="field" style={{ marginBottom: "0.3rem" }}>
                    <label htmlFor="cc-categoria">Categoría</label>
                    <select id="cc-categoria" value={categoria} onChange={(e) => setCategoria(e.target.value as CategoriaCajaChica)} required>
                      <option value="" disabled>Selecciona categoría</option>
                      {CATEGORIAS.map(([valor, etiqueta]) => <option key={valor} value={valor}>{etiqueta}</option>)}
                    </select>
                  </div>
                )}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.4rem" }}>
                  <div className="field" style={{ marginBottom: "0.3rem" }}>
                    <label htmlFor="cc-fecha">Fecha</label>
                    <input id="cc-fecha" type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} required />
                  </div>
                  <div className="field" style={{ marginBottom: "0.3rem" }}>
                    <label htmlFor="cc-monto">Monto (Q)</label>
                    <input id="cc-monto" type="number" min="0.01" step="0.01" value={monto} onChange={(e) => setMonto(e.target.value)} required />
                  </div>
                </div>
                <div className="field" style={{ marginBottom: "0.3rem" }}>
                  <label htmlFor="cc-beneficiario">Beneficiario</label>
                  <input id="cc-beneficiario" value={beneficiario} onChange={(e) => setBeneficiario(e.target.value)} required />
                </div>
                <div className="field" style={{ marginBottom: "0.3rem" }}>
                  <label htmlFor="cc-descripcion">Descripción</label>
                  <input id="cc-descripcion" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} required />
                </div>
                <div className="field" style={{ marginBottom: "0.3rem" }}>
                  <label htmlFor="cc-documento">No. de documento</label>
                  <input id="cc-documento" value={numeroDocumento} onChange={(e) => setNumeroDocumento(e.target.value)} />
                </div>
                <button type="submit" className="btn" disabled={guardando || !agenciaId} style={{ marginTop: "0.3rem" }}>
                  {guardando ? "Guardando…" : "Guardar Comprobante"}
                </button>
              </form>
            ) : (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.6rem" }}>
                  <h3 style={{ margin: 0, fontSize: "0.92rem", color: "var(--ink)", display: "flex", alignItems: "center", gap: "0.35rem" }}>
                    <span>📊</span> Egresos por Categoría
                  </h3>
                  <span style={{ fontSize: "0.74rem", color: "var(--ink-soft)" }}>
                    {resultado?.totalesPorCategoria.length ?? 0} rubros
                  </span>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "0.45rem" }}>
                  {resultado?.totalesPorCategoria.map((c) => {
                    const pct = Math.min(100, Math.round((Number(c.total) / totalEgresosCategorias) * 100));
                    const label =
                      c.categoria === "SIN_CATEGORIA"
                        ? "Sin categoría"
                        : CATEGORIA_CAJA_CHICA_LABEL[c.categoria as CategoriaCajaChica] ?? c.categoria;

                    return (
                      <div
                        key={c.categoria}
                        style={{
                          background: "var(--paper)",
                          border: "1px solid var(--line)",
                          borderRadius: "6px",
                          padding: "0.45rem 0.6rem",
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.8rem", marginBottom: "0.2rem" }}>
                          <span style={{ fontWeight: 600, color: "var(--ink)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 190 }} title={label}>
                            {label}
                          </span>
                          <span className="mono" style={{ fontWeight: 700, color: "var(--ink)" }}>
                            {formatoQ(c.total)}
                          </span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                          <div style={{ flex: 1, height: "5px", background: "var(--mono-bg)", borderRadius: "3px", overflow: "hidden" }}>
                            <div style={{ width: `${pct}%`, height: "100%", background: "var(--accent)" }} />
                          </div>
                          <span style={{ fontSize: "0.68rem", color: "var(--ink-soft)", minWidth: "30px", textAlign: "right" }}>{pct}%</span>
                        </div>
                      </div>
                    );
                  })}
                  {(!resultado?.totalesPorCategoria || resultado.totalesPorCategoria.length === 0) && (
                    <div style={{ fontSize: "0.8rem", color: "var(--ink-soft)", textAlign: "center", padding: "1rem" }}>
                      Sin egresos categorizados aún.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* PANEL DERECHO: BUSCADOR + TABLA DE COMPROBANTES CON SCROLL INTERNO */}
          <div className="screen-panel" style={{ padding: 0 }}>
            {/* BARRA DE HERRAMIENTAS Y BÚSQUEDA INTEGRADA */}
            <div style={{ padding: "0.6rem 0.85rem", borderBottom: "1px solid var(--line)", display: "flex", gap: "0.6rem", alignItems: "center", flexShrink: 0 }}>
              <div style={{ flex: 1 }}>
                <input
                  placeholder="🔍 Buscar por beneficiario, descripción o documento…"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "0.42rem 0.75rem",
                    fontSize: "0.85rem",
                    borderRadius: "6px",
                    border: "1px solid var(--line)",
                    background: "var(--paper)",
                    color: "var(--ink)",
                  }}
                />
              </div>
              <span style={{ fontSize: "0.78rem", color: "var(--ink-soft)", whiteSpace: "nowrap" }}>
                {resultado?.data.length ?? 0} comprobantes
              </span>
            </div>

            {/* TABLA CON SCROLL INTERNO Y CABECERA PEGAJOSA (STICKY) */}
            <div className="table-scroll-container">
              <table style={{ width: "100%", margin: 0, fontSize: "0.82rem" }}>
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Beneficiario</th>
                    <th>Descripción</th>
                    <th>Tipo</th>
                    <th>Categoría</th>
                    <th style={{ textAlign: "right" }}>Monto</th>
                    <th>Usuario</th>
                  </tr>
                </thead>
                <tbody>
                  {resultado?.data.map((c) => (
                    <tr key={c.id}>
                      <td className="mono" style={{ whiteSpace: "nowrap" }}>
                        {new Date(c.fecha).toLocaleDateString("es-GT")}
                      </td>
                      <td style={{ fontWeight: 600 }}>{c.beneficiario}</td>
                      <td>
                        <div>{c.descripcion}</div>
                        {c.numero_documento && (
                          <span style={{ fontSize: "0.7rem", color: "var(--ink-soft)" }}>Doc: {c.numero_documento}</span>
                        )}
                      </td>
                      <td>
                        <span
                          className="badge"
                          style={{
                            fontSize: "0.7rem",
                            background: c.tipo === "INGRESO" ? "rgba(16, 185, 129, 0.15)" : "rgba(239, 68, 68, 0.12)",
                            color: c.tipo === "INGRESO" ? "#10b981" : "#ef4444",
                            borderColor: c.tipo === "INGRESO" ? "rgba(16, 185, 129, 0.3)" : "rgba(239, 68, 68, 0.3)",
                          }}
                        >
                          {c.tipo === "INGRESO" ? "Ingreso" : "Egreso"}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontSize: "0.75rem", color: "var(--ink-soft)" }}>
                          {c.categoria ? CATEGORIA_CAJA_CHICA_LABEL[c.categoria] : "—"}
                        </span>
                      </td>
                      <td
                        className="mono"
                        style={{
                          textAlign: "right",
                          fontWeight: 700,
                          color: c.tipo === "EGRESO" ? "#ef4444" : "#10b981",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {c.tipo === "EGRESO" ? "−" : "+"} {formatoQ(c.monto)}
                      </td>
                      <td style={{ fontSize: "0.76rem", color: "var(--ink-soft)" }}>{c.usuario_nombre}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {resultado?.data.length === 0 && (
                <div className="empty" style={{ padding: "2rem 1rem" }}>
                  Todavía no hay comprobantes registrados.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {mostrarReporte && (
        <CajaChicaReporteModal
          agenciaId={agenciaId || agencias[0]?.id || ""}
          agencias={agencias}
          puedeElegirAgencia={puedeElegirAgencia}
          onClose={() => setMostrarReporte(false)}
        />
      )}
    </div>
  );
}
