import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { api, mensajeError } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { CATEGORIA_CAJA_CHICA_LABEL, formatoQ } from "../types";
import type { Agencia, CategoriaCajaChica, ListaCajaChica } from "../types";

const CATEGORIAS = Object.entries(CATEGORIA_CAJA_CHICA_LABEL) as [CategoriaCajaChica, string][];

export default function CajaChica() {
  const { usuario } = useAuth();
  const puedeElegirAgencia = usuario?.rol === "ADMIN" || usuario?.rol === "GERENCIA";

  const [q, setQ] = useState("");
  const [resultado, setResultado] = useState<ListaCajaChica | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mostrarForm, setMostrarForm] = useState(false);
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

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Caja chica</h1>
          <p>Comprobantes de ingreso y egreso — reemplaza el libro auxiliar de caja chica.</p>
        </div>
        <button className="btn" onClick={() => setMostrarForm((v) => !v)}>
          {mostrarForm ? "Cancelar" : "+ Nuevo comprobante"}
        </button>
      </div>

      {error && <div className="alert error">{error}</div>}

      {resultado && (
        <div className="stat-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(180px, 220px))" }}>
          <div className="stat-card accent">
            <span className="label">Saldo actual</span>
            <span className="value">{formatoQ(resultado.saldoActual)}</span>
          </div>
          <div className="stat-card">
            <span className="label">Total ingresos</span>
            <span className="value">{formatoQ(resultado.totalIngresos)}</span>
          </div>
          <div className="stat-card">
            <span className="label">Total egresos</span>
            <span className="value">{formatoQ(resultado.totalEgresos)}</span>
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
                    <td className="mono">{formatoQ(c.total)}</td>
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
                  {c.tipo === "EGRESO" ? "−" : "+"} {formatoQ(c.monto)}
                </td>
                <td>{c.usuario_nombre}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {resultado?.data.length === 0 && <div className="empty">Todavía no hay comprobantes registrados.</div>}
      </div>
    </div>
  );
}
