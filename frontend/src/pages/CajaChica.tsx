import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { api, mensajeError } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { CATEGORIA_CAJA_CHICA_LABEL, formatoQ } from "../types";
import type { Agencia, CategoriaCajaChica, ListaCajaChica, CajaChicaComprobante } from "../types";
import { CajaChicaReporteView } from "../components/CajaChicaReporteModal";

const CATEGORIAS = Object.entries(CATEGORIA_CAJA_CHICA_LABEL) as [CategoriaCajaChica, string][];

function renderRolBadge(rol?: string) {
  if (!rol) return null;
  switch (rol) {
    case "CAJA_CHICA":
      return (
        <span style={{ fontSize: "0.68rem", padding: "0.1rem 0.35rem", borderRadius: "4px", background: "rgba(16, 185, 129, 0.15)", color: "#059669", fontWeight: 600 }}>
          📥 Caja Chica
        </span>
      );
    case "CAJERO":
      return (
        <span style={{ fontSize: "0.68rem", padding: "0.1rem 0.35rem", borderRadius: "4px", background: "rgba(37, 99, 235, 0.15)", color: "#2563eb", fontWeight: 600 }}>
          💵 Cajero
        </span>
      );
    case "GERENCIA":
      return (
        <span style={{ fontSize: "0.68rem", padding: "0.1rem 0.35rem", borderRadius: "4px", background: "rgba(147, 51, 234, 0.15)", color: "#9333ea", fontWeight: 600 }}>
          🛡️ Admin
        </span>
      );
    case "SUPERVISOR":
      return (
        <span style={{ fontSize: "0.68rem", padding: "0.1rem 0.35rem", borderRadius: "4px", background: "rgba(217, 119, 6, 0.15)", color: "#d97706", fontWeight: 600 }}>
          👁️ Supervisor
        </span>
      );
    case "PROMOTOR":
      return (
        <span style={{ fontSize: "0.68rem", padding: "0.1rem 0.35rem", borderRadius: "4px", background: "rgba(100, 116, 139, 0.15)", color: "#64748b", fontWeight: 600 }}>
          📂 Promotor
        </span>
      );
    default:
      return (
        <span style={{ fontSize: "0.68rem", padding: "0.1rem 0.35rem", borderRadius: "4px", background: "rgba(100, 116, 139, 0.1)", color: "var(--ink-soft)", fontWeight: 500 }}>
          {rol}
        </span>
      );
  }
}

export default function CajaChica() {
  const { usuario } = useAuth();
  const puedeElegirAgencia = usuario?.rol === "GERENCIA";

  const [q, setQ] = useState("");
  const [resultado, setResultado] = useState<ListaCajaChica | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [mostrarReporte, setMostrarReporte] = useState(false);
  const [editarRegistro, setEditarRegistro] = useState<CajaChicaComprobante | null>(null);
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
  const [docDuplicado, setDocDuplicado] = useState(false);
  const [infoDocDuplicado, setInfoDocDuplicado] = useState<{
    existe: boolean;
    modulo?: string;
    fecha?: string;
    beneficiario?: string;
    descripcion?: string;
    usuario?: string;
    usuarioRol?: string;
  } | null>(null);
  const [verificandoDoc, setVerificandoDoc] = useState(false);

  // Estados para Reposición de Fondo Fijo
  const [mostrarReposicion, setMostrarReposicion] = useState(false);
  const [repoCheque, setRepoCheque] = useState("");
  const [repoMonto, setRepoMonto] = useState("2000");
  const [repoFecha, setRepoFecha] = useState(() => new Date().toISOString().slice(0, 10));
  const [repoDesc, setRepoDesc] = useState("Reposición mensual de fondo fijo de caja chica");
  const [repoGuardando, setRepoGuardando] = useState(false);

  // Estados para Corrección de Comprobante en Panel Izquierdo
  const [editFecha, setEditFecha] = useState("");
  const [editBeneficiario, setEditBeneficiario] = useState("");
  const [editDescripcion, setEditDescripcion] = useState("");
  const [editMonto, setEditMonto] = useState("");
  const [editNumeroDocumento, setEditNumeroDocumento] = useState("");
  const [editTipo, setEditTipo] = useState<"INGRESO" | "EGRESO">("EGRESO");
  const [editCategoria, setEditCategoria] = useState<CategoriaCajaChica | "">("");
  const [editMotivo, setEditMotivo] = useState("");
  const [editGuardando, setEditGuardando] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

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

  useEffect(() => {
    if (!mostrarForm || !agenciaId) return;
    api
      .get<{ ultimoNumeroDocumento: string | null }>("/caja-chica/ultimo-documento", { params: { agenciaId, fecha } })
      .then(({ data }) => {
        if (data.ultimoNumeroDocumento) {
          setNumeroDocumento((prev) => (!prev || prev.toUpperCase() === "DTE" ? data.ultimoNumeroDocumento! : prev));
        }
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mostrarForm, agenciaId]);

  useEffect(() => {
    if (!mostrarForm || !agenciaId) {
      setDocDuplicado(false);
      setInfoDocDuplicado(null);
      return;
    }
    const doc = numeroDocumento.trim();
    if (!doc || doc.toUpperCase() === "DTE") {
      setDocDuplicado(false);
      setInfoDocDuplicado(null);
      return;
    }
    setVerificandoDoc(true);
    const t = setTimeout(() => {
      api
        .get<{
          existe: boolean;
          modulo?: string;
          fecha?: string;
          beneficiario?: string;
          descripcion?: string;
          usuario?: string;
          usuarioRol?: string;
        }>("/caja-chica/verificar-documento", { params: { agenciaId, fecha, numeroDocumento: doc } })
        .then(({ data }) => {
          setDocDuplicado(data.existe);
          setInfoDocDuplicado(data.existe ? data : null);
        })
        .catch(() => {
          setDocDuplicado(false);
          setInfoDocDuplicado(null);
        })
        .finally(() => setVerificandoDoc(false));
    }, 450);
    return () => clearTimeout(t);
  }, [numeroDocumento, agenciaId, fecha, mostrarForm]);

  async function crear(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (docDuplicado) {
      setError("El número de documento ya fue registrado hoy en Caja Chica. Corrígelo antes de continuar.");
      return;
    }
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

  function iniciarEdicion(c: CajaChicaComprobante) {
    setEditarRegistro(c);
    setMostrarForm(false);
    setMostrarReposicion(false);
    setEditFecha(c.fecha.slice(0, 10));
    setEditBeneficiario(c.beneficiario);
    setEditDescripcion(c.descripcion);
    setEditMonto(c.monto.toString());
    setEditNumeroDocumento(c.numero_documento || "");
    setEditTipo(c.tipo as "INGRESO" | "EGRESO");
    setEditCategoria((c.categoria as CategoriaCajaChica) || "");
    setEditMotivo("");
    setEditError(null);
  }

  function cancelarEdicion() {
    setEditarRegistro(null);
    setEditError(null);
  }

  async function handleGuardarEdicion(e: FormEvent) {
    e.preventDefault();
    if (!editarRegistro) return;
    if (editMotivo.trim().length < 10) {
      setEditError("El motivo de la corrección es obligatorio (mínimo 10 caracteres explicativos).");
      return;
    }
    setEditError(null);
    setEditGuardando(true);
    try {
      await api.patch(`/caja-chica/${editarRegistro.id}`, {
        fecha: editFecha,
        beneficiario: editBeneficiario,
        descripcion: editDescripcion,
        tipo: editTipo,
        categoria: editTipo === "EGRESO" && editCategoria ? editCategoria : undefined,
        monto: Number(editMonto),
        numeroDocumento: editNumeroDocumento || undefined,
        motivo: editMotivo,
      });
      setEditarRegistro(null);
      cargar();
    } catch (err) {
      setEditError(mensajeError(err));
    } finally {
      setEditGuardando(false);
    }
  }

  const totalEgresosCategorias = resultado?.totalesPorCategoria.reduce((acc, c) => acc + Number(c.total), 0) ?? 1;

  if (mostrarReporte) {
    return (
      <div className="screen-container" style={{ overflowY: "auto" }}>
        <CajaChicaReporteView
          agenciaId={agenciaId || agencias[0]?.id || ""}
          agencias={agencias}
          puedeElegirAgencia={puedeElegirAgencia}
          onClose={() => setMostrarReporte(false)}
        />
      </div>
    );
  }

  return (
    <div className="screen-container">
      <div>
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
                setEditarRegistro(null);
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
                setEditarRegistro(null);
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
            {editarRegistro ? (
              <form onSubmit={handleGuardarEdicion} style={{ display: "flex", flexDirection: "column", gap: "0.45rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--line)", paddingBottom: "0.4rem" }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: "0.95rem", color: "var(--accent)" }}>✏️ Corregir Comprobante</h3>
                    <span style={{ fontSize: "0.72rem", color: "var(--ink-soft)" }}>
                      {usuario?.rol === "GERENCIA" ? "Auditoría de Administrador" : "Modificación del día"} · Doc: {editarRegistro.numero_documento || "DTE"}
                    </span>
                  </div>
                  <button type="button" className="link-btn" onClick={cancelarEdicion}>✕ Cancelar</button>
                </div>

                {editError && <div className="alert error" style={{ padding: "0.4rem 0.6rem", fontSize: "0.8rem", margin: "0.2rem 0" }}>{editError}</div>}

                <div className="field" style={{ marginBottom: "0.25rem" }}>
                  <label style={{ fontSize: "0.78rem" }}>Tipo de Comprobante</label>
                  <select value={editTipo} onChange={(e) => setEditTipo(e.target.value as "INGRESO" | "EGRESO")}>
                    <option value="EGRESO">Egreso (Gasto)</option>
                    <option value="INGRESO">Ingreso (Reintegro / Reposición)</option>
                  </select>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.4rem", marginBottom: "0.25rem" }}>
                  <div className="field">
                    <label style={{ fontSize: "0.78rem" }}>Fecha</label>
                    <input type="date" required value={editFecha} onChange={(e) => setEditFecha(e.target.value)} />
                  </div>
                  <div className="field">
                    <label style={{ fontSize: "0.78rem" }}>No. Documento</label>
                    <input type="text" value={editNumeroDocumento} onChange={(e) => setEditNumeroDocumento(e.target.value)} placeholder="Ej. DTE / 1234" />
                  </div>
                </div>

                <div className="field" style={{ marginBottom: "0.25rem" }}>
                  <label style={{ fontSize: "0.78rem" }}>Beneficiario / Proveedor</label>
                  <input type="text" required minLength={2} value={editBeneficiario} onChange={(e) => setEditBeneficiario(e.target.value)} />
                </div>

                <div className="field" style={{ marginBottom: "0.25rem" }}>
                  <label style={{ fontSize: "0.78rem" }}>Concepto / Descripción</label>
                  <input type="text" required minLength={2} value={editDescripcion} onChange={(e) => setEditDescripcion(e.target.value)} />
                </div>

                {editTipo === "EGRESO" && (
                  <div className="field" style={{ marginBottom: "0.25rem" }}>
                    <label style={{ fontSize: "0.78rem" }}>Categoría de Gasto</label>
                    <select required value={editCategoria} onChange={(e) => setEditCategoria(e.target.value as CategoriaCajaChica)}>
                      <option value="" disabled>Seleccione categoría</option>
                      {CATEGORIAS.map(([val, label]) => (
                        <option key={val} value={val}>{label}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="field" style={{ marginBottom: "0.35rem" }}>
                  <label style={{ fontSize: "0.78rem" }}>Monto Exacto (Q)</label>
                  <input type="number" required min="0.01" step="0.01" value={editMonto} onChange={(e) => setEditMonto(e.target.value)} style={{ fontWeight: 700 }} />
                </div>

                <div style={{ padding: "0.5rem 0.65rem", background: "rgba(234, 179, 8, 0.12)", border: "1px solid rgba(234, 179, 8, 0.3)", borderRadius: "6px", marginBottom: "0.4rem" }}>
                  <div className="field" style={{ marginBottom: 0 }}>
                    <label style={{ color: "#a16207", fontWeight: 700, fontSize: "0.76rem" }}>
                      Motivo de la Corrección (Obligatorio, mín. 10 caracteres)
                    </label>
                    <textarea
                      required
                      minLength={10}
                      rows={2}
                      value={editMotivo}
                      onChange={(e) => setEditMotivo(e.target.value)}
                      placeholder="Ej: Se ajustó el monto según factura física autorizada"
                      style={{ fontSize: "0.78rem", marginTop: "0.2rem" }}
                    />
                  </div>
                </div>

                <div style={{ display: "flex", gap: "0.4rem" }}>
                  <button type="submit" className="btn" disabled={editGuardando} style={{ flex: 1, fontSize: "0.82rem", padding: "0.45rem" }}>
                    {editGuardando ? "Guardando..." : "💾 Guardar Corrección"}
                  </button>
                  <button type="button" className="btn secondary" onClick={cancelarEdicion} disabled={editGuardando} style={{ fontSize: "0.82rem", padding: "0.45rem 0.75rem" }}>
                    Cancelar
                  </button>
                </div>
              </form>
            ) : mostrarReposicion ? (
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
                  {verificandoDoc && <span className="sub" style={{ fontSize: "0.72rem" }}>Verificando...</span>}
                  {!verificandoDoc && infoDocDuplicado && (
                    <div style={{ background: "rgba(220, 38, 38, 0.1)", border: "1px solid #ef4444", borderRadius: "6px", padding: "0.4rem 0.6rem", marginTop: "0.3rem", fontSize: "0.76rem", color: "#dc2626" }}>
                      <strong>⚠️ Documento ya registrado:</strong>
                      <div>Registrado en: <strong>{infoDocDuplicado.modulo}</strong> {infoDocDuplicado.fecha ? `el ${new Date(infoDocDuplicado.fecha).toLocaleDateString("es-GT")}` : ""}</div>
                      {infoDocDuplicado.beneficiario && <div>Beneficiario: {infoDocDuplicado.beneficiario}</div>}
                      {infoDocDuplicado.usuario && (
                        <div>Por: <strong>{infoDocDuplicado.usuario}</strong> {infoDocDuplicado.usuarioRol ? `(${infoDocDuplicado.usuarioRol})` : ""}</div>
                      )}
                    </div>
                  )}
                </div>
                <button type="submit" className="btn" disabled={guardando || !agenciaId || docDuplicado} style={{ marginTop: "0.3rem" }}>
                  {guardando ? "Guardando…" : docDuplicado ? "Documento duplicado: corrige el número" : "Guardar Comprobante"}
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
                    <th>Registrado Por</th>
                    <th style={{ textAlign: "center", width: "40px" }}>Acción</th>
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
                      <td style={{ fontSize: "0.76rem", color: "var(--ink-soft)" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", flexWrap: "wrap" }}>
                          <span>{c.usuario_nombre}</span>
                          {renderRolBadge(c.usuario_rol)}
                        </div>
                      </td>
                      <td style={{ textAlign: "center" }}>
                        {(usuario?.rol === "GERENCIA" || (c.usuario_id === usuario?.id && c.created_at.startsWith(new Date().toISOString().slice(0, 10)))) && (
                          <button
                            title="Corregir Registro"
                            className="btn btn-icon"
                            style={{ padding: "0.2rem", fontSize: "0.9rem" }}
                            onClick={() => iniciarEdicion(c)}
                          >
                            ✏️
                          </button>
                        )}
                      </td>
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
    </div>
  );
}
