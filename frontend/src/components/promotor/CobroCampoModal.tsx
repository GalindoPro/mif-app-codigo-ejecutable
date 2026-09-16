import { useState, useEffect } from "react";
import { api, mensajeError } from "../../lib/api";
import type { CobroCampo, Prestamo } from "../../types";
import { formatoQ } from "../../types";
import type { ResultadoLiquidacion } from "../../lib/liquidacionCredito";

interface Props {
  prestamoId: string;
  socioId: string;
  socioNombres: string;
  onClose: () => void;
  onSuccess: () => void;
  cobroExistente?: CobroCampo;
}

export function CobroCampoModal({ prestamoId, socioId, socioNombres, onClose, onSuccess, cobroExistente }: Props) {
  const [numeroReciboFisico, setNumeroReciboFisico] = useState(cobroExistente?.numero_recibo_fisico || "");
  const [abonoCapital, setAbonoCapital] = useState(cobroExistente?.pago_capital !== undefined ? String(cobroExistente.pago_capital) : "");
  const [interes, setInteres] = useState(cobroExistente?.pago_interes !== undefined ? String(cobroExistente.pago_interes) : "");
  const [mora, setMora] = useState(cobroExistente?.pago_mora !== undefined ? String(cobroExistente.pago_mora) : "");

  const [justificacion, setJustificacion] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [prestamo, setPrestamo] = useState<Prestamo | null>(null);
  const [liquidacion, setLiquidacion] = useState<ResultadoLiquidacion | null>(null);
  const [cargandoLiquidacion, setCargandoLiquidacion] = useState(true);

  const esEdicion = !!cobroExistente;
  const yaEditado = esEdicion && cobroExistente.veces_editado >= 1;

  useEffect(() => {
    cargarDatos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function cargarDatos() {
    setCargandoLiquidacion(true);
    try {
      const { data: prestamoData } = await api.get<Prestamo>(`/prestamos/${prestamoId}`);
      setPrestamo(prestamoData);
      
      const { data } = await api.get<{ prestamo: Prestamo; liquidacion: ResultadoLiquidacion }>(`/prestamos/${prestamoId}/liquidacion`);
      setLiquidacion(data.liquidacion);

      if (!esEdicion) {
        const capSugerido = data.liquidacion.cuotaCapitalBase || data.liquidacion.cuotaCapitalSugerida;
        const intSugerido = data.liquidacion.estaEnMora || data.liquidacion.cuotasVencidas > 0
          ? data.liquidacion.interesDevengado
          : (data.liquidacion.interesMesCompleto || data.liquidacion.interesDevengado);
        
        setAbonoCapital(String(capSugerido));
        setInteres(String(intSugerido));
        setMora(String(data.liquidacion.moraFijaSugerida));
      }
    } catch (err) {
      setError("No se pudo cargar la información del crédito.");
    } finally {
      setCargandoLiquidacion(false);
    }
  }

  function handleRestablecer() {
    if (liquidacion && !esEdicion) {
      const capSugerido = liquidacion.cuotaCapitalBase || liquidacion.cuotaCapitalSugerida;
      const intSugerido = liquidacion.estaEnMora || liquidacion.cuotasVencidas > 0
        ? liquidacion.interesDevengado
        : (liquidacion.interesMesCompleto || liquidacion.interesDevengado);
        
      setAbonoCapital(String(capSugerido));
      setInteres(String(intSugerido));
      setMora(String(liquidacion.moraFijaSugerida));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const capNum = Number(abonoCapital) || 0;
    const intNum = Number(interes) || 0;
    const morNum = Number(mora) || 0;
    const sumaReal = Math.round((capNum + intNum + morNum) * 100) / 100;

    if (sumaReal <= 0) {
      setError("El monto total a cobrar debe ser mayor a 0.");
      return;
    }

    setGuardando(true);

    try {
      if (esEdicion) {
        if (!justificacion || justificacion.trim().length < 5) {
          throw new Error("Debe proveer una justificación válida de por qué edita este cobro.");
        }
        await api.patch(`/cobros-campo/${cobroExistente.id}`, {
          monto: sumaReal,
          pago_capital: capNum,
          pago_interes: intNum,
          pago_mora: morNum,
          ahorro_prestamo: 0,
          justificacion_edicion: justificacion,
        });
      } else {
        await api.post("/cobros-campo", {
          prestamo_id: prestamoId,
          socio_id: socioId,
          numero_recibo_fisico: numeroReciboFisico,
          monto: sumaReal,
          pago_capital: capNum,
          pago_interes: intNum,
          pago_mora: morNum,
          ahorro_prestamo: 0,
        });
      }
      onSuccess();
    } catch (err) {
      setError(mensajeError(err));
      setGuardando(false);
    }
  }

  const saldoActual = prestamo
    ? Number(prestamo.saldo_capital !== null && prestamo.saldo_capital !== undefined ? prestamo.saldo_capital : prestamo.monto_aprobado || prestamo.monto_solicitado)
    : 0;
  
  const capNumState = Number(abonoCapital) || 0;
  const intNumState = Number(interes) || 0;
  const morNumState = Number(mora) || 0;
  const sumaRealState = capNumState + intNumState + morNumState;
  const saldoNuevo = Math.max(0, Math.round((saldoActual - capNumState) * 100) / 100);

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: 500, padding: "1.2rem", display: "flex", flexDirection: "column", maxHeight: "95vh" }}>
        <h2 style={{ margin: "0 0 0.5rem 0", color: "var(--accent)", fontSize: "1.1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          {esEdicion ? "✏️ Editar Cobro de Campo" : "💰 Registrar Cobro de Campo"}
        </h2>

        <p style={{ margin: "0 0 0.5rem 0", fontSize: "0.85rem", color: "var(--ink-soft)" }}>
          <strong>Socio:</strong> {socioNombres}
        </p>

        {yaEditado && (
          <div className="alert error" style={{ fontSize: "0.8rem", padding: "0.5rem" }}>
            ⛔ Este cobro ya fue editado una vez. No se permiten más modificaciones.
          </div>
        )}

        {esEdicion && !yaEditado && (
          <div className="alert warning" style={{ fontSize: "0.8rem", padding: "0.5rem" }}>
            ⚠️ <strong>Advertencia:</strong> Solo tienes UNA oportunidad para corregir este cobro. El cajero verá tu justificación.
          </div>
        )}

        {cargandoLiquidacion ? (
          <div style={{ textAlign: "center", padding: "2rem", color: "var(--ink-soft)" }}>Calculando saldos y moras...</div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "0.75rem", overflowY: "auto", paddingRight: "0.2rem" }}>
            
            <div style={{ background: "var(--paper-raised)", border: "1px solid var(--line)", padding: "0.75rem", borderRadius: "8px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <label htmlFor="cobro-total" style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "1rem", fontWeight: 700, margin: 0 }}>
                💵 Monto Total
              </label>
              <div style={{ display: "flex", alignItems: "center", gap: "0.2rem" }}>
                <span style={{ fontSize: "1.2rem", fontWeight: 700, color: "var(--primary)" }}>Q</span>
                <input
                  id="cobro-total"
                  type="number"
                  step="any"
                  min="0"
                  disabled={yaEditado}
                  value={sumaRealState === 0 ? "" : sumaRealState}
                  onChange={(e) => {
                    const total = Number(e.target.value) || 0;
                    if (liquidacion && !esEdicion) {
                      const bMora = liquidacion.moraFijaSugerida || 0;
                      const bInt = (liquidacion.estaEnMora || liquidacion.cuotasVencidas > 0)
                        ? liquidacion.interesDevengado
                        : (liquidacion.interesMesCompleto || liquidacion.interesDevengado) || 0;
                      
                      const m = Math.min(total, bMora);
                      const r1 = Math.max(0, total - m);
                      const i = Math.min(r1, bInt);
                      const c = Math.max(0, Math.round((r1 - i) * 100) / 100);
                      
                      setMora(String(m));
                      setInteres(String(i));
                      setAbonoCapital(String(c));
                    }
                  }}
                  style={{
                    fontSize: "1.2rem",
                    fontWeight: 700,
                    color: "var(--primary)",
                    width: "120px",
                    textAlign: "right",
                    border: "1px solid var(--line)",
                    borderRadius: "4px",
                    padding: "0.2rem 0.4rem"
                  }}
                />
              </div>
            </div>

            <div style={{ padding: "0.6rem", border: "1px solid var(--line)", borderRadius: "8px", background: "var(--paper)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                <span style={{ fontWeight: 700, fontSize: "0.8rem" }}>Ingresa lo cobrado (Editable)</span>
                {!esEdicion && (
                  <button
                    type="button"
                    onClick={handleRestablecer}
                    className="btn secondary"
                    style={{ fontSize: "0.65rem", padding: "0.15rem 0.4rem" }}
                    disabled={yaEditado}
                  >
                    ↺ Restablecer Cuota
                  </button>
                )}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.5rem" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.75rem", color: "var(--ink-soft)", marginBottom: "0.1rem" }}>Capital</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    disabled={yaEditado}
                    value={abonoCapital}
                    onChange={(e) => setAbonoCapital(e.target.value)}
                    style={{ width: "100%", padding: "0.3rem", fontSize: "0.8rem", borderRadius: "4px", border: "1px solid var(--line)" }}
                  />
                  <span style={{ fontSize: "0.6rem", color: "var(--ink-soft)" }}>Saldo: {formatoQ(saldoNuevo)}</span>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.75rem", color: "var(--ink-soft)", marginBottom: "0.1rem" }}>Interés</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    disabled={yaEditado}
                    value={interes}
                    onChange={(e) => setInteres(e.target.value)}
                    style={{ width: "100%", padding: "0.3rem", fontSize: "0.8rem", borderRadius: "4px", border: "1px solid var(--line)" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.75rem", color: "var(--ink-soft)", marginBottom: "0.1rem" }}>Mora</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    disabled={yaEditado}
                    value={mora}
                    onChange={(e) => setMora(e.target.value)}
                    style={{ width: "100%", padding: "0.3rem", fontSize: "0.8rem", borderRadius: "4px", border: "1px solid var(--line)" }}
                  />
                </div>
              </div>
            </div>

            <div>
              <label style={{ display: "block", marginBottom: "0.25rem", fontSize: "0.85rem", fontWeight: 600 }}>No. de Recibo Físico (Opcional en Campo)</label>
              <input
                type="text"
                disabled={esEdicion}
                value={numeroReciboFisico}
                onChange={(e) => setNumeroReciboFisico(e.target.value)}
                placeholder="Ej. 10245 (dejar en blanco si no tienes recibo)"
                style={{ width: "100%", padding: "0.4rem", borderRadius: "4px", border: "1px solid var(--line)" }}
              />
            </div>

            {esEdicion && !yaEditado && (
              <div>
                <label style={{ display: "block", marginBottom: "0.25rem", fontSize: "0.85rem", fontWeight: 600, color: "#d97706" }}>Justificación de Edición</label>
                <input
                  type="text"
                  required
                  value={justificacion}
                  onChange={(e) => setJustificacion(e.target.value)}
                  placeholder="Ej. El socio entregó más efectivo del anotado inicialmente"
                  style={{ width: "100%", padding: "0.4rem", borderRadius: "4px", border: "1px solid #f59e0b" }}
                />
              </div>
            )}

            {error && <div className="alert error" style={{ margin: 0 }}>{error}</div>}

            <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end", marginTop: "0.5rem" }}>
              <button type="button" className="btn secondary" onClick={onClose} disabled={guardando}>
                Cancelar
              </button>
              {!yaEditado && (
                <button type="submit" className="btn primary" disabled={guardando}>
                  {guardando ? "Guardando..." : "Guardar Cobro"}
                </button>
              )}
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
