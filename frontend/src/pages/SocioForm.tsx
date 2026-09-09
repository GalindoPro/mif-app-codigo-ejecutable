import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
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
import { PARENTESCOS_BENEFICIARIO, PARENTESCOS_BENEFICIARIO_MENOR } from "../types";
import InputNombreAutoCompletar from "../components/InputNombreAutoCompletar";

export default function SocioForm() {
  const { usuario } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const puedeElegirAgencia = usuario?.rol === "ADMIN" || usuario?.rol === "GERENCIA";

  const [agencias, setAgencias] = useState<Agencia[]>([]);
  const [agenciaId, setAgenciaId] = useState(() => searchParams.get("agenciaId") || usuario?.agenciaId || "");
  const [numeroAsociado, setNumeroAsociado] = useState("");
  const [nombres, setNombres] = useState(() => searchParams.get("nombres") || "");
  const [genero, setGenero] = useState<"M" | "F" | "">("");
  const [dpi, setDpi] = useState(() => (searchParams.get("dpi") ? formatearDPI(searchParams.get("dpi")!) : ""));
  const [fechaIngreso, setFechaIngreso] = useState(() => new Date().toISOString().slice(0, 10));
  const [telefono, setTelefono] = useState(() => (searchParams.get("telefono") ? formatearTelefono(searchParams.get("telefono")!) : ""));
  const [direccion, setDireccion] = useState(() => searchParams.get("direccion") || "");

  // Beneficiario
  const [esMenorBeneficiario, setEsMenorBeneficiario] = useState(false);
  const [nombreBeneficiario, setNombreBeneficiario] = useState("");
  const [parentescoBeneficiario, setParentescoBeneficiario] = useState("");
  const [dpiBeneficiario, setDpiBeneficiario] = useState("");
  const [telefonoBeneficiario, setTelefonoBeneficiario] = useState("");

  // Aportación inicial
  const [montoAportacion, setMontoAportacion] = useState("100");
  const [reciboAportacion, setReciboAportacion] = useState("");

  // Validaciones en tiempo real
  const [dpiDuplicado, setDpiDuplicado] = useState<{ nombres: string; numeroAsociado: string } | null>(null);
  const [verificandoDpi, setVerificandoDpi] = useState(false);

  const [telefonoDuplicado, setTelefonoDuplicado] = useState<{
    nombres: string;
    numeroAsociado: string;
    rol?: string;
  } | null>(null);
  const [verificandoTelefono, setVerificandoTelefono] = useState(false);

  const [telefonoDuplicadoBen, setTelefonoDuplicadoBen] = useState<{
    nombres: string;
    numeroAsociado: string;
    rol?: string;
  } | null>(null);
  const [verificandoTelefonoBen, setVerificandoTelefonoBen] = useState(false);

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

  // Verificación en tiempo real de Teléfono del socio (8 dígitos)
  useEffect(() => {
    const rawTel = telefono.replace(/\D/g, "");
    const localTel = rawTel.startsWith("502") && rawTel.length > 8 ? rawTel.slice(3) : rawTel.slice(-8);
    if (localTel.length === 8) {
      setVerificandoTelefono(true);
      const timer = setTimeout(() => {
        api
          .get<{
            valido: boolean;
            disponible?: boolean;
            registrado?: { nombres: string; numeroAsociado: string; rol: string };
          }>("/socios/verificar-telefono", { params: { telefono: localTel, tipo: "SOCIO" } })
          .then(({ data }) => {
            if (data.disponible === false && data.registrado) {
              setTelefonoDuplicado(data.registrado);
            } else {
              setTelefonoDuplicado(null);
            }
          })
          .catch(() => setTelefonoDuplicado(null))
          .finally(() => setVerificandoTelefono(false));
      }, 250);
      return () => clearTimeout(timer);
    } else {
      setTelefonoDuplicado(null);
      setVerificandoTelefono(false);
    }
  }, [telefono]);

  // Verificación en tiempo real de Teléfono del beneficiario (si NO es menor)
  useEffect(() => {
    if (esMenorBeneficiario) {
      setTelefonoDuplicadoBen(null);
      setVerificandoTelefonoBen(false);
      return;
    }
    const rawTel = telefonoBeneficiario.replace(/\D/g, "");
    const localTel = rawTel.startsWith("502") && rawTel.length > 8 ? rawTel.slice(3) : rawTel.slice(-8);
    if (localTel.length === 8) {
      setVerificandoTelefonoBen(true);
      const timer = setTimeout(() => {
        api
          .get<{
            valido: boolean;
            disponible?: boolean;
            registrado?: { nombres: string; numeroAsociado: string; rol: string };
          }>("/socios/verificar-telefono", { params: { telefono: localTel, tipo: "BENEFICIARIO" } })
          .then(({ data }) => {
            if (data.disponible === false && data.registrado) {
              setTelefonoDuplicadoBen(data.registrado);
            } else {
              setTelefonoDuplicadoBen(null);
            }
          })
          .catch(() => setTelefonoDuplicadoBen(null))
          .finally(() => setVerificandoTelefonoBen(false));
      }, 250);
      return () => clearTimeout(timer);
    } else {
      setTelefonoDuplicadoBen(null);
      setVerificandoTelefonoBen(false);
    }
  }, [telefonoBeneficiario, esMenorBeneficiario]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (dpiDuplicado) {
      setError(
        `El DPI ya está registrado para el socio ${dpiDuplicado.nombres} (${dpiDuplicado.numeroAsociado}). Modifícalo antes de guardar.`
      );
      return;
    }
    if (telefonoDuplicado) {
      setError(
        `El teléfono ya está registrado para el socio ${telefonoDuplicado.nombres} (${telefonoDuplicado.numeroAsociado}). No se permiten números duplicados.`
      );
      return;
    }
    if (!esMenorBeneficiario && telefonoDuplicadoBen) {
      setError(
        `El teléfono del beneficiario ya está registrado en el sistema (${telefonoDuplicadoBen.rol}: ${telefonoDuplicadoBen.nombres}, Asociado: ${telefonoDuplicadoBen.numeroAsociado}). Modifícalo antes de guardar.`
      );
      return;
    }
    if (!reciboAportacion.trim()) {
      setError("El número de boleta o recibo de pago es obligatorio para respaldar la aportación estatutaria inicial.");
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
        fechaIngreso,
        telefono: prepararTelefonoParaGuardar(telefono),
        direccion: direccion || undefined,
        nombreBeneficiario: nombreBeneficiario || undefined,
        parentescoBeneficiario: parentescoBeneficiario || undefined,
        dpiBeneficiario: dpiBeneficiario ? dpiBeneficiario.trim() : undefined,
        telefonoBeneficiario: prepararTelefonoParaGuardar(telefonoBeneficiario),
        montoAportacionInicial: montoAporNum,
        reciboAportacionInicial: reciboAportacion.trim(),
      });
      navigate(`/socios/${data.id}`);
    } catch (err) {
      setError(mensajeError(err));
      setGuardando(false);
    }
  }

  const rawDpiLength = limpiarDPI(dpi).length;
  const rawTelLength = telefono.replace(/\D/g, "").length;
  const rawDpiBenLength = limpiarDPI(dpiBeneficiario).length;
  const rawTelBenLength = telefonoBeneficiario.replace(/\D/g, "").length;

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
              inputMode="numeric"
              value={dpi}
              onChange={(e) => setDpi(formatearDPI(e.target.value.replace(/[^0-9-]/g, "")))}
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

          {/* Fecha de ingreso */}
          <div className="field" style={{ gridColumn: "1 / -1" }}>
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
                inputMode="numeric"
                value={telefono}
                onChange={(e) => setTelefono(formatearTelefono(e.target.value.replace(/[^0-9-]/g, "")))}
                placeholder="xxxx-xxxx"
                maxLength={9}
                style={{
                  borderTopLeftRadius: 0,
                  borderBottomLeftRadius: 0,
                  fontFamily: "monospace",
                  letterSpacing: "0.5px",
                  borderColor: telefonoDuplicado ? "var(--danger)" : undefined,
                }}
              />
            </div>
            <div style={{ minHeight: "1.1rem", marginTop: "0.15rem" }}>
              {verificandoTelefono && <span className="hint">🔍 Verificando número...</span>}
              {telefonoDuplicado && (
                <span style={{ color: "#ef4444", fontSize: "0.78rem", fontWeight: 600, display: "block" }}>
                  ⚠️ Teléfono ya registrado para: {telefonoDuplicado.nombres} ({telefonoDuplicado.numeroAsociado})
                </span>
              )}
              {!verificandoTelefono && !telefonoDuplicado && rawTelLength === 8 && (
                <span style={{ color: "#10b981", fontSize: "0.78rem", fontWeight: 500 }}>
                  ✓ Disponible para WhatsApp (+502 {telefono})
                </span>
              )}
              {rawTelLength > 0 && rawTelLength < 8 && (
                <span className="hint">{rawTelLength}/8 dígitos locales (solo números)</span>
              )}
              {rawTelLength === 0 && (
                <span className="hint">8 dígitos numéricos (número único por socio)</span>
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
          <div style={{ gridColumn: "1 / -1", marginTop: "0.75rem", borderTop: "1px solid var(--line)", paddingTop: "1.25rem" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.75rem", marginBottom: "0.75rem" }}>
              <div>
                <h3 style={{ margin: 0, fontSize: "1.05rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                  <span>👥</span> Datos de la Persona Beneficiaria
                </h3>
                <p style={{ margin: "0.25rem 0 0", fontSize: "0.82rem", color: "var(--ink-soft)" }}>
                  Designada por el asociado según el libro oficial de aportaciones.
                </p>
              </div>

              {/* Selector segmentado: Adulto vs Menor de Edad */}
              <div
                style={{
                  display: "inline-flex",
                  background: "var(--mono-bg, #0f172a)",
                  padding: "0.25rem",
                  borderRadius: "8px",
                  border: "1px solid var(--line)",
                  gap: "0.25rem",
                }}
              >
                <button
                  type="button"
                  onClick={() => {
                    setEsMenorBeneficiario(false);
                  }}
                  style={{
                    padding: "0.35rem 0.75rem",
                    borderRadius: "6px",
                    border: "none",
                    fontSize: "0.82rem",
                    fontWeight: 600,
                    cursor: "pointer",
                    background: !esMenorBeneficiario ? "var(--primary, #0284c7)" : "transparent",
                    color: !esMenorBeneficiario ? "#ffffff" : "var(--ink-soft)",
                    transition: "all 0.15s ease",
                  }}
                >
                  👤 Adulto (DPI)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEsMenorBeneficiario(true);
                    setParentescoBeneficiario("Hijo(a)");
                    setTelefonoDuplicadoBen(null);
                  }}
                  style={{
                    padding: "0.35rem 0.75rem",
                    borderRadius: "6px",
                    border: "none",
                    fontSize: "0.82rem",
                    fontWeight: 600,
                    cursor: "pointer",
                    background: esMenorBeneficiario ? "#0ea5e9" : "transparent",
                    color: esMenorBeneficiario ? "#ffffff" : "var(--ink-soft)",
                    transition: "all 0.15s ease",
                  }}
                >
                  🧒 Menor de edad (CUI)
                </button>
              </div>
            </div>

            {esMenorBeneficiario && (
              <div
                style={{
                  padding: "0.6rem 0.85rem",
                  borderRadius: "8px",
                  background: "rgba(14, 165, 233, 0.12)",
                  border: "1px solid rgba(14, 165, 233, 0.35)",
                  color: "#38bdf8",
                  fontSize: "0.82rem",
                  marginBottom: "1rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                }}
              >
                <span>ℹ️</span>
                <span>
                  <strong>Beneficiario menor de edad:</strong> Ingrese el <strong>CUI de 13 dígitos</strong> que aparece en su partida de nacimiento de RENAP. El parentesco se ajusta a menores de edad y el teléfono es opcional.
                </span>
              </div>
            )}
          </div>

          <div className="field">
            <label htmlFor="beneficiario">Nombre completo del beneficiario</label>
            <InputNombreAutoCompletar
              id="beneficiario"
              value={nombreBeneficiario}
              onChange={setNombreBeneficiario}
              placeholder={esMenorBeneficiario ? "Ej. Juanito Tomás Sánchez Pérez" : "Ej. María Elena Pérez Gómez"}
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
              {(esMenorBeneficiario ? PARENTESCOS_BENEFICIARIO_MENOR : PARENTESCOS_BENEFICIARIO).map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
            <span className="hint">
              {esMenorBeneficiario ? "Opciones válidas para menores (sugerido Hijo/a)" : "Vínculo familiar del beneficiario"}
            </span>
          </div>

          <div className="field">
            <label htmlFor="dpi-ben" style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <span>{esMenorBeneficiario ? "CUI del menor (RENAP)" : "DPI del beneficiario"}</span>
              {esMenorBeneficiario && (
                <span
                  style={{
                    fontSize: "0.7rem",
                    padding: "0.1rem 0.4rem",
                    borderRadius: "4px",
                    background: "#0ea5e9",
                    color: "#fff",
                    fontWeight: 700,
                  }}
                >
                  CUI RENAP
                </span>
              )}
            </label>
            <input
              id="dpi-ben"
              inputMode="numeric"
              value={dpiBeneficiario}
              onChange={(e) => setDpiBeneficiario(formatearDPI(e.target.value.replace(/[^0-9-]/g, "")))}
              maxLength={15}
              placeholder={esMenorBeneficiario ? "xxxx-xxxxx-xxxx (CUI de partida)" : "xxxx-xxxxx-xxxx (DPI adulto)"}
              style={{
                fontFamily: "monospace",
                letterSpacing: "0.5px",
                borderColor: esMenorBeneficiario ? "#38bdf8" : undefined,
              }}
            />
            <div style={{ minHeight: "1.1rem", marginTop: "0.15rem" }}>
              {esMenorBeneficiario ? (
                <span className="hint" style={{ color: "#38bdf8" }}>
                  {rawDpiBenLength === 13 ? "✓ CUI válido (13 dígitos de partida)" : `${rawDpiBenLength}/13 dígitos numéricos del CUI`}
                </span>
              ) : rawDpiBenLength === 13 ? (
                <span style={{ color: "#10b981", fontSize: "0.78rem", fontWeight: 500 }}>
                  ✓ DPI válido (13 dígitos)
                </span>
              ) : (
                <span className="hint">13 dígitos numéricos (opcional)</span>
              )}
            </div>
          </div>

          <div className="field">
            <label htmlFor="tel-ben">
              Teléfono del beneficiario {esMenorBeneficiario ? "(Opcional)" : ""}
            </label>
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
                inputMode="numeric"
                value={telefonoBeneficiario}
                onChange={(e) => setTelefonoBeneficiario(formatearTelefono(e.target.value.replace(/[^0-9-]/g, "")))}
                placeholder="xxxx-xxxx"
                maxLength={9}
                style={{
                  borderTopLeftRadius: 0,
                  borderBottomLeftRadius: 0,
                  fontFamily: "monospace",
                  letterSpacing: "0.5px",
                  borderColor: !esMenorBeneficiario && telefonoDuplicadoBen ? "var(--danger)" : undefined,
                }}
              />
            </div>
            <div style={{ minHeight: "1.1rem", marginTop: "0.15rem" }}>
              {!esMenorBeneficiario && verificandoTelefonoBen && (
                <span className="hint">🔍 Verificando teléfono...</span>
              )}
              {!esMenorBeneficiario && telefonoDuplicadoBen && (
                <span style={{ color: "#ef4444", fontSize: "0.78rem", fontWeight: 600, display: "block" }}>
                  ⚠️ Teléfono ya registrado ({telefonoDuplicadoBen.rol}: {telefonoDuplicadoBen.nombres})
                </span>
              )}
              {esMenorBeneficiario && (
                <span className="hint">
                  Opcional (al ser menor de edad, puede usar el del padre o tutor sin validación de duplicado)
                </span>
              )}
              {!esMenorBeneficiario && !telefonoDuplicadoBen && !verificandoTelefonoBen && rawTelBenLength === 8 && (
                <span style={{ color: "#10b981", fontSize: "0.78rem", fontWeight: 500 }}>
                  ✓ Teléfono válido (+502 {telefonoBeneficiario})
                </span>
              )}
              {!esMenorBeneficiario && !telefonoDuplicadoBen && rawTelBenLength > 0 && rawTelBenLength < 8 && (
                <span className="hint">{rawTelBenLength}/8 dígitos numéricos</span>
              )}
              {!esMenorBeneficiario && rawTelBenLength === 0 && (
                <span className="hint">8 dígitos numéricos (opcional, no repetible)</span>
              )}
            </div>
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
              <label htmlFor="recibo-aportacion">No. de boleta o recibo de pago *</label>
              <input
                id="recibo-aportacion"
                value={reciboAportacion}
                onChange={(e) => setReciboAportacion(e.target.value)}
                placeholder="Ej. BOL-2026-00412 / REC-1029"
                required
                style={{
                  borderColor: !reciboAportacion.trim() ? "var(--accent, #38bdf8)" : undefined,
                }}
              />
              <span className="hint">
                Comprobante oficial de ingreso en caja o boleta bancaria (Requerido para respaldo de la aportación).
              </span>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.5rem" }}>
          <button
            type="submit"
            className="btn"
            disabled={
              guardando ||
              !agenciaId ||
              Boolean(dpiDuplicado) ||
              verificandoDpi ||
              Boolean(telefonoDuplicado) ||
              verificandoTelefono ||
              (!esMenorBeneficiario && Boolean(telefonoDuplicadoBen)) ||
              verificandoTelefonoBen ||
              !reciboAportacion.trim() ||
              Number(montoAportacion) < 100
            }
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
