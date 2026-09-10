import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { api, mensajeError } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { CATEGORIA_CAJA_CHICA_LABEL } from "../types";
import { formatearQuetzales } from "../lib/formatters";
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

  return (
    <div>
      <div className={mostrarReporte ? "no-print" : ""}>
        <div className="page-head">
        <div>
          <h1>Caja chica</h1>
          <p>Comprobantes de ingreso y egreso — reemplaza el libro auxiliar de caja chica.</p>
        </div>
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          <button
            type="button"
            className="btn secondary"
            style={{ fontWeight: 700, borderColor: "var(--accent)" }}
            onClick={() => setMostrarReporte(true)}
          >
            📄 Informe de Gastos
          </button>
          <button
            className="btn"
            style={{ background: "#059669", borderColor: "#059669" }}
            onClick={() => {
              setMostrarReposicion((v) => !v);
              setMostrarForm(false);
            }}
          >
            {mostrarReposicion ? "Cancelar reposición" : "📥 Reponer Fondo (Cheque)"}
          </button>
          <button
            className="btn"
            onClick={() => {
              setMostrarForm((v) => !v);
              setMostrarReposicion(false);
            }}
          >
            {mostrarForm ? "Cancelar" : "+ Nuevo comprobante"}
          </button>
        </div>
      </div>

      {error && <div className="alert error">{error}</div>}

      {/* Formulario de Reposición de Fondo Fijo de Caja Chica */}
      {mostrarReposicion && (
        <form
          className="card"
          onSubmit={handleReponerFondo}
          style={{ maxWidth: 580, marginBottom: "1.5rem", border: "2px solid #059669", background: "#f0fdf4" }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
            <h3 style={{ margin: 0, color: "#065f46" }}>📥 Reposición de Fondo Fijo de Caja Chica</h3>
            <span className="badge" style={{ background: "#dcfce7", color: "#166534", fontWeight: 700 }}>
              Ingreso Bancario
            </span>
          </div>
          <p style={{ fontSize: "0.85rem", color: "#047857", margin: "0 0 1rem" }}>
            Recarga el saldo de caja chica mediante cheque emitido por la cooperativa (según formato <em>No. CH.</em> del libro).
          </p>

          <div className="form-grid">
            <div className="field">
              <label htmlFor="repo-fecha">Fecha del cheque / reposición</label>
              <input
                id="repo-fecha"
                type="date"
                value={repoFecha}
                onChange={(e) => setRepoFecha(e.target.value)}
                required
              />
            </div>

            <div className="field">
              <label htmlFor="repo-cheque">
                Número de Cheque (<strong>No. CH.</strong>)
              </label>
              <input
                id="repo-cheque"
                placeholder="Ej. 1290 o CH-4501"
                value={repoCheque}
                onChange={(e) => setRepoCheque(e.target.value)}
                required
                style={{ fontWeight: 700 }}
              />
              <span className="hint">Número de cheque emitido para alimentar la caja</span>
            </div>
          </div>

          <div className="form-grid">
            <div className="field">
              <label htmlFor="repo-monto">Monto a ingresar (Q)</label>
              <input
                id="repo-monto"
                type="number"
                min="1"
                step="0.01"
                value={repoMonto}
                onChange={(e) => setRepoMonto(e.target.value)}
                required
                style={{ fontWeight: 700, fontSize: "1.1rem" }}
              />
            </div>

            <div className="field">
              <label htmlFor="repo-desc">Descripción</label>
              <input
                id="repo-desc"
                value={repoDesc}
                onChange={(e) => setRepoDesc(e.target.value)}
              />
            </div>
          </div>

          <div style={{ display: "flex", gap: "0.75rem", marginTop: "1rem" }}>
            <button
              type="submit"
              className="btn"
              style={{ background: "#059669", borderColor: "#059669" }}
              disabled={repoGuardando}
            >
              {repoGuardando ? "Ingresando fondo…" : `Confirmar ingreso de ${formatearQuetzales(Number(repoMonto) || 0)}`}
            </button>
            <button type="button" className="btn secondary" onClick={() => setMostrarReposicion(false)}>
              Cancelar
            </button>
          </div>
        </form>
      )}

      {resultado && (
        <div className="stat-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(180px, 220px))" }}>
          <div className="stat-card accent">
            <span className="label">Saldo actual</span>
            <span className="value">{formatearQuetzales(resultado.saldoActual)}</span>
          </div>
          <div className="stat-card">
            <span className="label">Total ingresos</span>
            <span className="value">{formatearQuetzales(resultado.totalIngresos)}</span>
          </div>
          <div className="stat-card">
            <span className="label">Total egresos</span>
            <span className="value">{formatearQuetzales(resultado.totalEgresos)}</span>
          </div>
        </div>
      )}

      {resultado && resultado.totalesPorCategoria.length > 0 && (
        <div className="card" style={{ marginBottom: "1.5rem" }}>
          <h2 style={{ marginTop: 0 }}>Egresos por categoría</h2>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Categoría</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {resultado.totalesPorCategoria.map((c) => (
                  <tr key={c.categoria}>
                    <td>
                      {c.categoria === "SIN_CATEGORIA"
                        ? "Sin categoría"
                        : CATEGORIA_CAJA_CHICA_LABEL[c.categoria as CategoriaCajaChica] ?? c.categoria}
                    </td>
                    <td className="mono">{formatearQuetzales(c.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {mostrarForm && (
        <form className="card" onSubmit={crear} style={{ maxWidth: 640, marginBottom: "1.5rem" }}>
          <div className="form-grid">
            {puedeElegirAgencia && (
              <div className="field">
                <label htmlFor="cc-agencia">Agencia</label>
                <select id="cc-agencia" value={agenciaId} onChange={(e) => setAgenciaId(e.target.value)} required>
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
            <div className="field">
              <label>Tipo</label>
              <div className="tipo-toggle">
                <button type="button" className={tipo === "INGRESO" ? "on deposito" : ""} onClick={() => setTipo("INGRESO")}>
                  Ingreso
                </button>
                <button type="button" className={tipo === "EGRESO" ? "on retiro" : ""} onClick={() => setTipo("EGRESO")}>
                  Egreso
                </button>
              </div>
            </div>
            {tipo === "EGRESO" && (
              <div className="field">
                <label htmlFor="cc-categoria">Categoría de gasto</label>
                <select
                  id="cc-categoria"
                  value={categoria}
                  onChange={(e) => setCategoria(e.target.value as CategoriaCajaChica)}
                  required
                >
                  <option value="" disabled>
                    Selecciona una categoría
                  </option>
                  {CATEGORIAS.map(([valor, etiqueta]) => (
                    <option key={valor} value={valor}>
                      {etiqueta}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div className="field">
              <label htmlFor="cc-fecha">Fecha</label>
              <input id="cc-fecha" type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} required />
            </div>
            <div className="field">
              <label htmlFor="cc-monto">Monto</label>
              <input
                id="cc-monto"
                type="number"
                min="0.01"
                step="0.01"
                value={monto}
                onChange={(e) => setMonto(e.target.value)}
                required
              />
            </div>
            <div className="field" style={{ gridColumn: "1 / -1" }}>
              <label htmlFor="cc-beneficiario">Beneficiario</label>
              <input id="cc-beneficiario" value={beneficiario} onChange={(e) => setBeneficiario(e.target.value)} required />
            </div>
            <div className="field" style={{ gridColumn: "1 / -1" }}>
              <label htmlFor="cc-descripcion">Descripción</label>
              <input id="cc-descripcion" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} required />
            </div>
            <div className="field">
              <label htmlFor="cc-documento">No. de documento</label>
              <input id="cc-documento" value={numeroDocumento} onChange={(e) => setNumeroDocumento(e.target.value)} />
            </div>
          </div>
          <button type="submit" className="btn" disabled={guardando || !agenciaId}>
            {guardando ? "Guardando…" : "Guardar comprobante"}
          </button>
        </form>
      )}

      <div className="searchbar">
        <input placeholder="Buscar por beneficiario o descripción…" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Beneficiario</th>
              <th>Descripción</th>
              <th>Tipo</th>
              <th>Categoría</th>
              <th>Monto</th>
              <th>Registrado por</th>
            </tr>
          </thead>
          <tbody>
            {resultado?.data.map((c) => (
              <tr key={c.id}>
                <td className="mono">{new Date(c.fecha).toLocaleDateString("es-GT")}</td>
                <td>{c.beneficiario}</td>
                <td>{c.descripcion}</td>
                <td>{c.tipo === "INGRESO" ? "Ingreso" : "Egreso"}</td>
                <td>{c.categoria ? CATEGORIA_CAJA_CHICA_LABEL[c.categoria] : "—"}</td>
                <td className={`mono movimiento-monto ${c.tipo === "EGRESO" ? "retiro" : "deposito"}`}>
                  {c.tipo === "EGRESO" ? "−" : "+"} {formatearQuetzales(c.monto)}
                </td>
                <td>{c.usuario_nombre}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {resultado?.data.length === 0 && <div className="empty">Todavía no hay comprobantes registrados.</div>}
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
