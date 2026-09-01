import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { api, mensajeError } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import type { Agencia } from "../types";
import {
  formatearDPI,
  formatearTelefono,
  limpiarDPI,
  prepararTelefonoParaGuardar,
  capitalizarDescripcion,
} from "../lib/formatters";
import { PARENTESCOS_BENEFICIARIO } from "../types";
import InputNombreAutoCompletar from "../components/InputNombreAutoCompletar";

export default function SocioForm() {
  const { usuario } = useAuth();
  const navigate = useNavigate();
  const puedeElegirAgencia = usuario?.rol === "ADMIN" || usuario?.rol === "GERENCIA";

  const [agencias, setAgencias] = useState<Agencia[]>([]);
  const [agenciaId, setAgenciaId] = useState(usuario?.agenciaId ?? "");
  const [numeroAsociado, setNumeroAsociado] = useState("");
  const [nombres, setNombres] = useState("");
  const [genero, setGenero] = useState<"M" | "F" | "">("");
  const [dpi, setDpi] = useState("");
  const [edad, setEdad] = useState("");
  const [fechaIngreso, setFechaIngreso] = useState(() => new Date().toISOString().slice(0, 10));
  const [telefono, setTelefono] = useState("");
  const [direccion, setDireccion] = useState("");
  const [nombreBeneficiario, setNombreBeneficiario] = useState("");
  const [parentescoBeneficiario, setParentescoBeneficiario] = useState("");
  const [dpiBeneficiario, setDpiBeneficiario] = useState("");
  const [telefonoBeneficiario, setTelefonoBeneficiario] = useState("");

  const [montoAportacion, setMontoAportacion] = useState("100");
  const [reciboAportacion, setReciboAportacion] = useState("");

  const [dpiDuplicado, setDpiDuplicado] = useState<{ nombres: string; numeroAsociado: string } | null>(null);
  const [verificandoDpi, setVerificandoDpi] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (puedeElegirAgencia) {
      api.get<Agencia[]>("/agencias").then(({ data }) => setAgencias(data));
    }
  }, [puedeElegirAgencia]);

  useEffect(() => {
    if (!agenciaId) return;
    api
      .get<{ numeroAsociado: string }>("/socios/siguiente-numero", { params: { agenciaId } })
      .then(({ data }) => setNumeroAsociado(data.numeroAsociado));
  }, [agenciaId]);

  // Verificación en tiempo real de DPI duplicado al completar 13 dígitos
  useEffect(() => {
    const rawDpi = limpiarDPI(dpi);
    if (rawDpi.length === 13) {
      setVerificandoDpi(true);
      const timer = setTimeout(() => {
        api
          .get<{
            valido: boolean;
            disponible?: boolean;
            socio?: { nombres: string; numeroAsociado: string };
          }>("/socios/verificar-dpi", { params: { dpi: rawDpi } })
          .then(({ data }) => {
            if (data.disponible === false && data.socio) {
              setDpiDuplicado(data.socio);
            } else {
              setDpiDuplicado(null);
            }
          })
          .catch(() => setDpiDuplicado(null))
          .finally(() => setVerificandoDpi(false));
      }, 250);
      return () => clearTimeout(timer);
    } else {
      setDpiDuplicado(null);
      setVerificandoDpi(false);
    }
  }, [dpi]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (dpiDuplicado) {
      setError(
        `El DPI ya está registrado para el socio ${dpiDuplicado.nombres} (${dpiDuplicado.numeroAsociado}). Modifícalo antes de guardar.`
      );
      return;
    }
    const montoAporNum = Number(montoAportacion);
    if (isNaN(montoAporNum) || montoAporNum < 100) {
      setError("La regla de la cooperativa exige una aportación inicial mínima de Q 100.00.");
      return;
    }
    setError(null);
    setGuardando(true);
    try {
      const { data } = await api.post("/socios", {
        numeroAsociado,
        agenciaId,
        nombres,
        genero: genero || undefined,
        dpi: dpi ? dpi.trim() : undefined,
        edad: edad ? Number(edad) : undefined,
        fechaIngreso,
        telefono: prepararTelefonoParaGuardar(telefono),
        direccion: direccion || undefined,
        nombreBeneficiario: nombreBeneficiario || undefined,
        parentescoBeneficiario: parentescoBeneficiario || undefined,
        dpiBeneficiario: dpiBeneficiario ? dpiBeneficiario.trim() : undefined,
        telefonoBeneficiario: prepararTelefonoParaGuardar(telefonoBeneficiario),
        montoAportacionInicial: montoAporNum,
        reciboAportacionInicial: reciboAportacion.trim() || undefined,
      });
      navigate(`/socios/${data.id}`);
    } catch (err) {
      setError(mensajeError(err));
      setGuardando(false);
    }
  }

  const rawDpiLength = limpiarDPI(dpi).length;
  const rawTelLength = telefono.replace(/\D/g, "").length;

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Nuevo socio</h1>
          <p>Datos generales del asociado. Después podrás abrirle cuentas de ahorro o aportación.</p>
        </div>
      </div>

      {error && <div className="alert error">{error}</div>}

      <form className="card" onSubmit={onSubmit} style={{ maxWidth: 680 }}>
        <div className="form-grid">
          {puedeElegirAgencia && (
            <div className="field">
              <label htmlFor="agencia">Agencia</label>
              <select id="agencia" value={agenciaId} onChange={(e) => setAgenciaId(e.target.value)} required>
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
            <label htmlFor="numero">No. de asociado</label>
            <input id="numero" value={numeroAsociado} onChange={(e) => setNumeroAsociado(e.target.value)} required />
            <span className="hint">Sugerido automáticamente; puedes ajustarlo.</span>
          </div>

          <div className="field" style={{ gridColumn: "1 / -1" }}>
            <label htmlFor="nombres">Nombres completos</label>
            <InputNombreAutoCompletar
              id="nombres"
              value={nombres}
              onChange={setNombres}
              placeholder="Ej. Tomás Sánchez Pérez"
              required
            />
            <span className="hint">Sugerencias inteligentes con tildes. Toca la sugerencia o presiona Tab para autocompletar.</span>
          </div>

          {/* Fila: Género a la izquierda, DPI del asociado a la derecha */}
          <div className="field">
            <label htmlFor="genero">Género</label>
            <select id="genero" value={genero} onChange={(e) => setGenero(e.target.value as "M" | "F" | "")}>
              <option value="">Sin especificar</option>
              <option value="F">Femenino</option>
              <option value="M">Masculino</option>
            </select>
          </div>

          <div className="field">
            <label htmlFor="dpi">DPI del asociado</label>
            <input
              id="dpi"
              value={dpi}
              onChange={(e) => setDpi(formatearDPI(e.target.value))}
              maxLength={15}
              placeholder="xxxx-xxxxx-xxxx"
              style={{
                fontFamily: "monospace",
                letterSpacing: "0.5px",
                borderColor: dpiDuplicado ? "var(--danger)" : undefined,
              }}
            />
            <div style={{ minHeight: "1.1rem", marginTop: "0.15rem" }}>
              {verificandoDpi && <span className="hint">🔍 Verificando disponibilidad...</span>}
              {dpiDuplicado && (
                <span style={{ color: "#ef4444", fontSize: "0.78rem", fontWeight: 600, display: "block" }}>
                  ⚠️ Ya registrado para: {dpiDuplicado.nombres} ({dpiDuplicado.numeroAsociado})
                </span>
              )}
              {!verificandoDpi && !dpiDuplicado && rawDpiLength === 13 && (
                <span style={{ color: "#10b981", fontSize: "0.78rem", fontWeight: 600, display: "block" }}>
                  ✓ DPI válido y disponible (13 dígitos)
                </span>
              )}
              {rawDpiLength > 0 && rawDpiLength < 13 && (
                <span className="hint">{rawDpiLength}/13 dígitos (solo números)</span>
              )}
            </div>
          </div>

          {/* Fila abajo: Edad a la izquierda, Fecha de ingreso a la derecha */}
          <div className="field">
            <label htmlFor="edad">Edad (años)</label>
            <input
              id="edad"
              type="number"
              min="1"
              max="120"
              value={edad}
              onChange={(e) => setEdad(e.target.value)}
              placeholder="Ej. 35"
            />
            <span className="hint">Ingreso manual (buena práctica en campo)</span>
          </div>

          <div className="field">
            <label htmlFor="fecha">Fecha de ingreso</label>
            <input
              id="fecha"
              type="date"
              value={fechaIngreso}
              onChange={(e) => setFechaIngreso(e.target.value)}
              required
            />
          </div>

          {/* Fila: Teléfono con prefijo +502 */}
          <div className="field">
            <label htmlFor="telefono">Teléfono (WhatsApp)</label>
            <div style={{ display: "flex", alignItems: "stretch" }}>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.3rem",
                  padding: "0 0.75rem",
                  background: "var(--mono-bg, #1e293b)",
                  border: "1px solid var(--line)",
                  borderRight: "none",
                  borderTopLeftRadius: "8px",
                  borderBottomLeftRadius: "8px",
                  fontSize: "0.88rem",
                  fontWeight: 600,
                  color: "var(--ink)",
                  userSelect: "none",
                  whiteSpace: "nowrap",
                }}
              >
                🇬🇹 +502
              </span>
              <input
                id="telefono"
                value={telefono}
                onChange={(e) => setTelefono(formatearTelefono(e.target.value))}
                placeholder="xxxx-xxxx"
                maxLength={9}
                style={{
                  borderTopLeftRadius: 0,
                  borderBottomLeftRadius: 0,
                  fontFamily: "monospace",
                  letterSpacing: "0.5px",
                }}
              />
            </div>
            <div style={{ minHeight: "1.1rem", marginTop: "0.15rem" }}>
              {rawTelLength === 8 ? (
                <span style={{ color: "#10b981", fontSize: "0.78rem", fontWeight: 500 }}>
                  ✓ Listo para WhatsApp (+502 {telefono})
                </span>
              ) : rawTelLength > 0 ? (
                <span className="hint">{rawTelLength}/8 dígitos locales</span>
              ) : (
                <span className="hint">8 dígitos locales (se creará enlace WhatsApp)</span>
              )}
            </div>
          </div>

          <div className="field">
            <label htmlFor="direccion">Dirección / Comunidad</label>
            <input
              id="direccion"
              value={direccion}
              onChange={(e) => setDireccion(capitalizarDescripcion(e.target.value))}
              placeholder="Ej. Cantón Ilom, Chajul"
            />
          </div>

          {/* Sección Beneficiario */}
          <div style={{ gridColumn: "1 / -1", marginTop: "0.5rem", borderTop: "1px solid var(--line)", paddingTop: "1rem" }}>
            <h3 style={{ margin: "0 0 0.5rem", fontSize: "1rem" }}>Datos de la Persona Beneficiaria</h3>
            <p style={{ margin: "0 0 1rem", fontSize: "0.82rem", color: "var(--ink-soft)" }}>
              Persona designada por el asociado según el libro oficial de aportaciones.
            </p>
          </div>

          <div className="field">
            <label htmlFor="beneficiario">Nombre completo del beneficiario</label>
            <InputNombreAutoCompletar
              id="beneficiario"
              value={nombreBeneficiario}
              onChange={setNombreBeneficiario}
              placeholder="Ej. María Elena Pérez Gómez"
            />
          </div>

          <div className="field">
            <label htmlFor="parentesco-ben">Parentesco con el asociado</label>
            <select
              id="parentesco-ben"
              value={parentescoBeneficiario}
              onChange={(e) => setParentescoBeneficiario(e.target.value)}
            >
              <option value="">Selecciona el parentesco…</option>
              {PARENTESCOS_BENEFICIARIO.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
            <span className="hint">Vínculo familiar del beneficiario</span>
          </div>

          <div className="field">
            <label htmlFor="dpi-ben">DPI del beneficiario</label>
            <input
              id="dpi-ben"
              value={dpiBeneficiario}
              onChange={(e) => setDpiBeneficiario(formatearDPI(e.target.value))}
              maxLength={15}
              placeholder="xxxx-xxxxx-xxxx"
              style={{ fontFamily: "monospace", letterSpacing: "0.5px" }}
            />
            <span className="hint">13 dígitos numéricos (opcional)</span>
          </div>

          <div className="field">
            <label htmlFor="tel-ben">Teléfono del beneficiario</label>
            <div style={{ display: "flex", alignItems: "stretch" }}>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.3rem",
                  padding: "0 0.75rem",
                  background: "var(--mono-bg, #1e293b)",
                  border: "1px solid var(--line)",
                  borderRight: "none",
                  borderTopLeftRadius: "8px",
                  borderBottomLeftRadius: "8px",
                  fontSize: "0.88rem",
                  fontWeight: 600,
                  color: "var(--ink)",
                  userSelect: "none",
                  whiteSpace: "nowrap",
                }}
              >
                🇬🇹 +502
              </span>
              <input
                id="tel-ben"
                value={telefonoBeneficiario}
                onChange={(e) => setTelefonoBeneficiario(formatearTelefono(e.target.value))}
                placeholder="xxxx-xxxx"
                maxLength={9}
                style={{
                  borderTopLeftRadius: 0,
                  borderBottomLeftRadius: 0,
                  fontFamily: "monospace",
                  letterSpacing: "0.5px",
                }}
              />
            </div>
            <span className="hint">8 dígitos locales (opcional)</span>
          </div>
        </div>

        {/* Aportación Inicial Estatutaria */}
        <div className="card" style={{ marginTop: "1rem" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.4rem", flexWrap: "wrap", gap: "0.5rem" }}>
            <h2 style={{ fontSize: "1.05rem", margin: 0, display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span>💰</span> Aportación Inicial Estatutaria
            </h2>
            <span
              style={{
                fontSize: "0.75rem",
                fontWeight: 700,
                padding: "0.2rem 0.55rem",
                borderRadius: "6px",
                background: "rgba(16, 185, 129, 0.12)",
                color: "#10b981",
                border: "1px solid rgba(16, 185, 129, 0.3)",
              }}
            >
              Requisito Obligatorio: Mínimo Q 100.00
            </span>
          </div>

          <p style={{ margin: "0 0 1rem", fontSize: "0.82rem", color: "var(--ink-soft)", lineHeight: 1.45 }}>
            <strong>Regla de la cooperativa:</strong> Todo asociado debe aportar como mínimo <strong>Q 100.00</strong> para habilitar su afiliación oficial y tener derecho a abrir cuentas de ahorro infantil, corriente, programado, plazo fijo o solicitar créditos.
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1rem" }}>
            <div className="field">
              <label htmlFor="monto-aportacion">Monto de aportación inicial (Q) *</label>
              <div style={{ display: "flex", alignItems: "stretch" }}>
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    padding: "0 0.85rem",
                    background: "var(--mono-bg, #1e293b)",
                    border: "1px solid var(--line)",
                    borderRight: "none",
                    borderTopLeftRadius: "8px",
                    borderBottomLeftRadius: "8px",
                    fontSize: "0.95rem",
                    fontWeight: 700,
                    color: "var(--accent, #38bdf8)",
                    userSelect: "none",
                  }}
                >
                  Q
                </span>
                <input
                  id="monto-aportacion"
                  type="number"
                  min="100"
                  step="any"
                  value={montoAportacion}
                  onChange={(e) => setMontoAportacion(e.target.value)}
                  required
                  placeholder="100.00"
                  style={{
                    borderTopLeftRadius: 0,
                    borderBottomLeftRadius: 0,
                    fontWeight: 700,
                    fontSize: "1.05rem",
                    color: Number(montoAportacion) < 100 ? "var(--danger, #ef4444)" : undefined,
                  }}
                />
              </div>
              {Number(montoAportacion) < 100 ? (
                <span style={{ fontSize: "0.8rem", color: "var(--danger, #ef4444)", marginTop: "0.3rem", display: "block", fontWeight: 600 }}>
                  ⚠️ El estatuto cooperativo exige un mínimo de Q 100.00
                </span>
              ) : (
                <span className="hint">Mínimo Q 100.00 (el socio puede aportar un monto mayor)</span>
              )}
            </div>

            <div className="field">
              <label htmlFor="recibo-aportacion">No. de boleta o recibo de pago</label>
              <input
                id="recibo-aportacion"
                value={reciboAportacion}
                onChange={(e) => setReciboAportacion(e.target.value)}
                placeholder="Ej. BOL-2026-00412 / REC-1029"
              />
              <span className="hint">Comprobante de ingreso en caja o boleta bancaria (opcional)</span>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.5rem" }}>
          <button
            type="submit"
            className="btn"
            disabled={guardando || !agenciaId || Boolean(dpiDuplicado) || verificandoDpi || Number(montoAportacion) < 100}
          >
            {guardando ? "Guardando…" : "Guardar socio"}
          </button>
          <button type="button" className="btn secondary" onClick={() => navigate(-1)}>
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
