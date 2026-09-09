import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { api, mensajeError } from "../../lib/api";
import {
  formatoQ,
} from "../../types";
import type {
  OrigenFondos,
  Prestamo,
} from "../../types";
import {
  ORIGEN_FONDOS_LABEL,
} from "../../types";

export interface DesembolsoCreditoFormProps {
  agenciaId: string;
  diaId: string;
  saldoCajaActual: number;
  onDesembolsado: () => void;
}

export default function DesembolsoCreditoForm({
  agenciaId,
  diaId,
  saldoCajaActual,
  onDesembolsado,
}: DesembolsoCreditoFormProps) {
  const [prestamos, setPrestamos] = useState<Prestamo[]>([]);
  const [prestamo, setPrestamo] = useState<Prestamo | null>(null);
  const [origenFondos, setOrigenFondos] = useState<OrigenFondos>("FONDOS_PROPIOS");
  const [cargando, setCargando] = useState(true);
  const [docNo, setDocNo] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setCargando(true);
    api
      .get<Prestamo[]>("/prestamos", { params: { agenciaId, estado: "APROBADO" } })
      .then(({ data }) => {
        setPrestamos(data);
        if (data[0]) {
          setPrestamo(data[0]);
          setOrigenFondos(data[0].origen_fondos || "FONDOS_PROPIOS");
        }
      })
      .catch((err) => setError(mensajeError(err)))
      .finally(() => setCargando(false));
  }, [agenciaId]);

  const [retencionAspOpcion, setRetencionAspOpcion] = useState<"0" | "5" | "10" | "custom">("5");
  const [retencionAspMontoInput, setRetencionAspMontoInput] = useState<string>("");

  const montoAprobado = prestamo ? Number(prestamo.monto_aprobado || prestamo.monto_solicitado) : 0;
  
  let montoAspRetenido = 0;
  if (retencionAspOpcion === "5") montoAspRetenido = Math.round(montoAprobado * 0.05 * 100) / 100;
  else if (retencionAspOpcion === "10") montoAspRetenido = Math.round(montoAprobado * 0.10 * 100) / 100;
  else if (retencionAspOpcion === "custom") montoAspRetenido = Math.max(0, Math.min(montoAprobado, Number(retencionAspMontoInput) || 0));

  const efectivoNetoAEntregar = Math.max(0, Math.round((montoAprobado - montoAspRetenido) * 100) / 100);
  const saldoInsuficiente = efectivoNetoAEntregar > saldoCajaActual;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!prestamo) return;
    if (saldoInsuficiente) {
      setError("No hay suficiente saldo físico en la caja para desembolsar este crédito.");
      return;
    }
    setError(null);
    setGuardando(true);
    try {
      await api.post(`/caja-auxiliar/${diaId}/desembolso-credito`, {
        prestamoId: prestamo.id,
        docNo: docNo || undefined,
        origenFondos,
        montoAhorroSobrePrestamo: montoAspRetenido,
      });
      onDesembolsado();
    } catch (err) {
      setError(mensajeError(err));
      setGuardando(false);
    }
  }

  return (
    <form className="card" onSubmit={onSubmit} style={{ maxWidth: 680, marginBottom: "1.5rem", border: "2px solid #2563eb" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
        <h2 style={{ margin: 0, fontSize: "1.1rem", color: "#1d4ed8" }}>📤 Desembolso de Crédito en Ventanilla</h2>
        <span className="badge" style={{ background: "#dbeafe", color: "#1e40af", fontWeight: 700 }}>
          Colocación (Egreso)
        </span>
      </div>
      <p style={{ fontSize: "0.85rem", color: "var(--ink-soft)", margin: "0 0 1rem" }}>
        Entrega física de efectivo al socio por crédito aprobado. Reduce el efectivo de caja, acredita el Ahorro sobre Préstamo y activa el préstamo.
      </p>

      {error && <div className="alert error">{error}</div>}

      {cargando && <p style={{ fontSize: "0.85rem", color: "var(--ink-soft)" }}>Buscando créditos aprobados…</p>}

      {!cargando && prestamos.length === 0 && (
        <div className="alert info">
          No hay créditos en estado <strong>APROBADO</strong> pendientes de desembolsar en esta agencia.
        </div>
      )}

      {prestamos.length > 0 && (
        <>
          <div className="field">
            <label>Selecciona el crédito aprobado a desembolsar</label>
            <select
              value={prestamo?.id ?? ""}
              onChange={(e) => {
                const p = prestamos.find((x) => x.id === e.target.value);
                if (p) {
                  setPrestamo(p);
                  setOrigenFondos(p.origen_fondos || "FONDOS_PROPIOS");
                }
              }}
            >
              {prestamos.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.codigo} — {p.socio_nombres} ({p.tipo}) - {formatoQ(p.monto_aprobado || p.monto_solicitado)}
                </option>
              ))}
            </select>
          </div>

          {prestamo && (
            <>
              {/* SELECCIÓN DE ORIGEN DE FONDOS EN DESEMBOLSO */}
              <div
                style={{
                  background: "var(--paper-raised)",
                  border: "1px solid var(--line)",
                  borderRadius: "8px",
                  padding: "0.85rem",
                  marginBottom: "1rem",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                  <span style={{ fontWeight: 700, fontSize: "0.86rem", color: "var(--ink)" }}>
                    🏛️ Fuente / Origen de Fondos a Desembolsar:
                  </span>
                  <span style={{ fontSize: "0.74rem", color: "var(--ink-soft)" }}>
                    {prestamo.origen_fondos ? `Asignado: ${ORIGEN_FONDOS_LABEL[prestamo.origen_fondos]}` : "Predeterminado: Fondos Propios"}
                  </span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "0.5rem" }}>
                  {(
                    [
                      { id: "FONDOS_PROPIOS", num: "1", label: "Fondos Propios", icon: "🏦", desc: "MIF COOP" },
                      { id: "FEDERURAL", num: "2", label: "FEDERURAL", icon: "🌾", desc: "Línea Federural" },
                      { id: "CHN_GUATEMALA", num: "3", label: "CHN-GUATEMALA", icon: "🏛️", desc: "Crédito Hipotecario Nal." },
                    ] as const
                  ).map((opt) => {
                    const activo = origenFondos === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setOrigenFondos(opt.id)}
                        style={{
                          padding: "0.6rem 0.75rem",
                          borderRadius: "8px",
                          border: activo ? "2px solid #2563eb" : "1px solid var(--line)",
                          background: activo ? "rgba(37, 99, 235, 0.1)" : "var(--paper)",
                          color: activo ? "#1d4ed8" : "var(--ink)",
                          fontWeight: activo ? 700 : 500,
                          cursor: "pointer",
                          textAlign: "left",
                          display: "flex",
                          alignItems: "center",
                          gap: "0.55rem",
                          transition: "all 0.15s ease",
                        }}
                      >
                        <span style={{ fontSize: "1.25rem" }}>{opt.icon}</span>
                        <div style={{ display: "flex", flexDirection: "column" }}>
                          <span style={{ fontSize: "0.86rem", fontWeight: activo ? 800 : 600 }}>
                            <span style={{ opacity: 0.65, marginRight: "0.25rem" }}>{opt.num}.</span>
                            {opt.label}
                          </span>
                          <span style={{ fontSize: "0.7rem", color: activo ? "#1d4ed8" : "var(--ink-soft)" }}>
                            {opt.desc}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
                  gap: "0.5rem",
                  background: "var(--paper-raised)",
                  padding: "0.75rem",
                  borderRadius: "8px",
                  marginBottom: "1rem",
                  fontSize: "0.85rem",
                }}
              >
                <div>
                  <span style={{ color: "var(--ink-soft)" }}>Socio:</span>{" "}
                  <strong>{prestamo.socio_nombres}</strong>
                </div>
                <div>
                  <span style={{ color: "var(--ink-soft)" }}>Tipo:</span> <strong>{prestamo.tipo}</strong>
                </div>
                <div>
                  <span style={{ color: "var(--ink-soft)" }}>Plazo:</span>{" "}
                  <strong>{prestamo.plazo_meses} meses</strong>
                </div>
                <div>
                  <span style={{ color: "var(--ink-soft)" }}>Cuota mensual pactada:</span>{" "}
                  <strong>{formatoQ(prestamo.cuota_mensual)}</strong>
                </div>
              </div>

              {/* SECCIÓN DE RETENCIÓN DE AHORRO SOBRE PRÉSTAMO */}
              <div
                style={{
                  background: "rgba(14, 165, 233, 0.08)",
                  border: "1px solid rgba(14, 165, 233, 0.35)",
                  borderRadius: "8px",
                  padding: "0.85rem 1rem",
                  marginBottom: "1rem",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                  <label style={{ fontWeight: 700, color: "var(--ink)", margin: 0, fontSize: "0.9rem" }}>
                    🛡️ Retención de Ahorro sobre Préstamo (Garantía Institucional)
                  </label>
                  <span className="badge" style={{ background: "#e0f2fe", color: "#0369a1", fontWeight: 700, fontSize: "0.75rem" }}>
                    {montoAspRetenido > 0 ? `+ ${formatoQ(montoAspRetenido)} a su cuenta` : "Sin retención"}
                  </span>
                </div>
                <p style={{ fontSize: "0.8rem", color: "var(--ink-soft)", margin: "0 0 0.6rem" }}>
                  Se acreditará automáticamente a la cuenta de <strong>Ahorro sobre Préstamo</strong> del socio como respaldo de garantía.
                </p>

                <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center" }}>
                  {[
                    { id: "5", label: `5% (${formatoQ(montoAprobado * 0.05)})` },
                    { id: "10", label: `10% (${formatoQ(montoAprobado * 0.10)})` },
                    { id: "custom", label: "Monto personalizado (Q)" },
                    { id: "0", label: "0% (Sin retención)" },
                  ].map((op) => (
                    <button
                      key={op.id}
                      type="button"
                      className={`btn ${retencionAspOpcion === op.id ? "" : "secondary"}`}
                      style={{
                        padding: "0.3rem 0.65rem",
                        fontSize: "0.8rem",
                        fontWeight: retencionAspOpcion === op.id ? 700 : 500,
                        background: retencionAspOpcion === op.id ? "#0284c7" : undefined,
                        borderColor: retencionAspOpcion === op.id ? "#0284c7" : undefined,
                      }}
                      onClick={() => setRetencionAspOpcion(op.id as any)}
                    >
                      {op.label}
                    </button>
                  ))}
                </div>

                {retencionAspOpcion === "custom" && (
                  <div style={{ marginTop: "0.6rem", maxWidth: "250px" }}>
                    <label style={{ fontSize: "0.78rem", color: "var(--ink-soft)" }}>Monto en Quetzales a retener:</label>
                    <input
                      type="number"
                      min="0"
                      max={montoAprobado}
                      step="0.01"
                      placeholder="Ej. 250.00"
                      value={retencionAspMontoInput}
                      onChange={(e) => setRetencionAspMontoInput(e.target.value)}
                      style={{ padding: "0.4rem", borderRadius: "6px" }}
                    />
                  </div>
                )}
              </div>

              <div className="form-grid">
                <div className="field">
                  <label>Monto total del préstamo aprobado</label>
                  <input
                    type="text"
                    value={formatoQ(montoAprobado)}
                    disabled
                    style={{ fontWeight: 700, fontSize: "1.05rem" }}
                  />
                </div>

                <div className="field">
                  <label htmlFor="doc-desembolso">No. Comprobante / Cheque de Egreso</label>
                  <input
                    id="doc-desembolso"
                    placeholder="Ej. 003512 o CHQ-4451"
                    value={docNo}
                    onChange={(e) => setDocNo(e.target.value)}
                    required
                  />
                  <span className="hint">Número impreso en el documento de entrega firmado</span>
                </div>
              </div>

              {saldoInsuficiente ? (
                <div className="alert error" style={{ marginTop: "0.75rem" }}>
                  ⚠️ Saldo insuficiente en caja: Se requieren {formatoQ(efectivoNetoAEntregar)} en efectivo neto, pero la caja física solo tiene {formatoQ(saldoCajaActual)}. Ingrese fondos antes de desembolsar.
                </div>
              ) : (
                <div
                  style={{
                    background: "#eff6ff",
                    border: "1px solid #bfdbfe",
                    borderRadius: "8px",
                    padding: "0.85rem",
                    marginTop: "0.5rem",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: "0.5rem",
                  }}
                >
                  <div style={{ fontSize: "0.82rem", color: "#1e40af" }}>
                    <div>Monto Aprobado: <strong>{formatoQ(montoAprobado)}</strong></div>
                    {montoAspRetenido > 0 && (
                      <div style={{ color: "#0369a1" }}>
                        🛡️ Ahorro Retenido: <strong>- {formatoQ(montoAspRetenido)}</strong>
                      </div>
                    )}
                    <div>Saldo en caja tras entrega: <strong>{formatoQ(saldoCajaActual - efectivoNetoAEntregar)}</strong></div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <span style={{ fontSize: "0.82rem", color: "#1e40af" }}>Efectivo neto a entregar al socio: </span>
                    <div style={{ fontSize: "1.35rem", fontWeight: 800, color: "#1e40af" }}>
                      {formatoQ(efectivoNetoAEntregar)}
                    </div>
                  </div>
                </div>
              )}

              <div style={{ display: "flex", gap: "0.75rem", marginTop: "1rem" }}>
                <button
                  type="submit"
                  className="btn"
                  style={{ background: "#2563eb", borderColor: "#2563eb", fontWeight: 700 }}
                  disabled={guardando || saldoInsuficiente}
                >
                  {guardando ? "Desembolsando…" : `📤 Desembolsar y Entregar ${formatoQ(efectivoNetoAEntregar)}`}
                </button>
              </div>
            </>
          )}
        </>
      )}
    </form>
  );
}
