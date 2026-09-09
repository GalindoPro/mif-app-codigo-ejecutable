import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { api, mensajeError } from "../../lib/api";
import { formatoQ } from "../../types";
import type { PlazoFijoContrato } from "../../types";

export interface LiquidarPlazoFijoFormProps {
  agenciaId: string;
  diaId: string;
  saldoCajaActual: number;
  onLiquidado: () => void;
}

export default function LiquidarPlazoFijoForm({
  agenciaId,
  diaId,
  saldoCajaActual,
  onLiquidado,
}: LiquidarPlazoFijoFormProps) {
  const [contratos, setContratos] = useState<PlazoFijoContrato[]>([]);
  const [contrato, setContrato] = useState<PlazoFijoContrato | null>(null);
  const [cargando, setCargando] = useState(true);
  const [reciboRetiro, setReciboRetiro] = useState("");
  const [incluirIntereses, setIncluirIntereses] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setCargando(true);
    api
      .get<PlazoFijoContrato[]>("/plazo-fijo", { params: { agenciaId, estado: "ACTIVO" } })
      .then(({ data }) => {
        setContratos(data);
        if (data[0]) setContrato(data[0]);
      })
      .catch((err) => setError(mensajeError(err)))
      .finally(() => setCargando(false));
  }, [agenciaId]);

  const montoALiquidar = contrato
    ? (incluirIntereses ? Number(contrato.saldo_liquido_a_pagar) : Number(contrato.monto_deposito))
    : 0;

  const saldoInsuficiente = montoALiquidar > saldoCajaActual;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!contrato) return;
    if (!reciboRetiro.trim()) {
      setError("El número de recibo de egreso (RE. No.) es obligatorio.");
      return;
    }
    if (saldoInsuficiente) {
      setError("No hay suficiente saldo físico en la caja para liquidar este certificado.");
      return;
    }
    setError(null);
    setGuardando(true);
    try {
      await api.post(`/caja-auxiliar/${diaId}/liquidar-plazo-fijo`, {
        contratoId: contrato.id,
        reciboRetiro: reciboRetiro.trim(),
        incluirIntereses,
      });
      onLiquidado();
    } catch (err) {
      setError(mensajeError(err));
      setGuardando(false);
    }
  }

  return (
    <form className="card" onSubmit={onSubmit} style={{ maxWidth: 680, marginBottom: "1.5rem", border: "2px solid #7c3aed" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
        <h2 style={{ margin: 0, fontSize: "1.1rem", color: "#6d28d9" }}>📦 Liquidación de Plazo Fijo en Ventanilla</h2>
        <span className="badge" style={{ background: "#ede9fe", color: "#5b21b6", fontWeight: 700 }}>
          Retiro Plazo Fijo (Egreso)
        </span>
      </div>
      <p style={{ fontSize: "0.85rem", color: "var(--ink-soft)", margin: "0 0 1rem" }}>
        Entrega física de efectivo al socio por cancelación o retiro de Certificado de Plazo Fijo.
      </p>

      {error && <div className="alert error">{error}</div>}

      {cargando && <p style={{ fontSize: "0.85rem", color: "var(--ink-soft)" }}>Buscando certificados activos…</p>}

      {!cargando && contratos.length === 0 && (
        <div className="alert info">
          No hay certificados de <strong>Ahorro a Plazo Fijo</strong> activos en esta agencia.
        </div>
      )}

      {contratos.length > 0 && (
        <>
          <div className="field">
            <label>Selecciona el certificado a liquidar</label>
            <select
              value={contrato?.id ?? ""}
              onChange={(e) => {
                const c = contratos.find((x) => x.id === e.target.value);
                if (c) setContrato(c);
              }}
            >
              {contratos.map((c) => (
                <option key={c.id} value={c.id}>
                  Certificado #{c.numero_certificacion ?? "—"} • {c.socio_nombres} ({c.numero_cuenta}) — {formatoQ(c.monto_deposito)}
                </option>
              ))}
            </select>
          </div>

          {contrato && (
            <>
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
                  <strong>{contrato.socio_nombres}</strong>
                </div>
                <div>
                  <span style={{ color: "var(--ink-soft)" }}>Cuenta:</span>{" "}
                  <strong>{contrato.numero_cuenta}</strong>
                </div>
                <div>
                  <span style={{ color: "var(--ink-soft)" }}>Capital invertido:</span>{" "}
                  <strong>{formatoQ(contrato.monto_deposito)}</strong>
                </div>
                <div>
                  <span style={{ color: "var(--ink-soft)" }}>Interés neto generado:</span>{" "}
                  <strong style={{ color: "#16a34a" }}>{formatoQ(contrato.interes_neto)}</strong>
                </div>
                <div>
                  <span style={{ color: "var(--ink-soft)" }}>Vencimiento:</span>{" "}
                  <strong>{new Date(contrato.fecha_vencimiento).toLocaleDateString("es-GT")}</strong>
                </div>
              </div>

              <div className="field">
                <label>Modalidad de Entrega de Fondos</label>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginTop: "0.25rem" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }}>
                    <input
                      type="radio"
                      name="pf-modalidad"
                      checked={!incluirIntereses}
                      onChange={() => setIncluirIntereses(false)}
                    />
                    <span>
                      <strong>Solo Capital:</strong> {formatoQ(contrato.monto_deposito)}
                    </span>
                  </label>
                  <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }}>
                    <input
                      type="radio"
                      name="pf-modalidad"
                      checked={incluirIntereses}
                      onChange={() => setIncluirIntereses(true)}
                    />
                    <span>
                      <strong>Capital + Interés Neto:</strong> {formatoQ(contrato.saldo_liquido_a_pagar)}
                    </span>
                  </label>
                </div>
              </div>

              <div className="form-grid">
                <div className="field">
                  <label>Monto a entregar en efectivo</label>
                  <input
                    type="text"
                    value={formatoQ(montoALiquidar)}
                    disabled
                    style={{ fontWeight: 700, fontSize: "1.1rem" }}
                  />
                </div>

                <div className="field">
                  <label htmlFor="recibo-pf-egreso">
                    No. Recibo de Retiro (<strong>RE. No.</strong>)
                  </label>
                  <input
                    id="recibo-pf-egreso"
                    placeholder="Ej. 882 o RE-1406"
                    value={reciboRetiro}
                    onChange={(e) => setReciboRetiro(e.target.value)}
                    required
                    style={{ fontWeight: 700 }}
                  />
                  <span className="hint">Número impreso en el recibo de egreso firmado por el socio</span>
                </div>
              </div>

              {saldoInsuficiente ? (
                <div className="alert error" style={{ marginTop: "0.75rem" }}>
                  ⚠️ Saldo insuficiente en caja: Se requieren {formatoQ(montoALiquidar)}, pero la caja solo tiene {formatoQ(saldoCajaActual)}. Ingrese fondos antes de liquidar.
                </div>
              ) : (
                <div
                  style={{
                    background: "#f5f3ff",
                    border: "1px solid #ddd6fe",
                    borderRadius: "8px",
                    padding: "0.8rem",
                    marginTop: "0.5rem",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: "0.5rem",
                  }}
                >
                  <div style={{ fontSize: "0.82rem", color: "#5b21b6" }}>
                    Saldo en caja tras el egreso:{" "}
                    <strong>{formatoQ(saldoCajaActual - montoALiquidar)}</strong>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <span style={{ fontSize: "0.82rem", color: "#5b21b6" }}>Total a pagar: </span>
                    <strong style={{ fontSize: "1.25rem", color: "#5b21b6" }}>{formatoQ(montoALiquidar)}</strong>
                  </div>
                </div>
              )}

              <div style={{ display: "flex", gap: "0.75rem", marginTop: "1rem" }}>
                <button
                  type="submit"
                  className="btn"
                  style={{ background: "#7c3aed", borderColor: "#7c3aed" }}
                  disabled={guardando || saldoInsuficiente}
                >
                  {guardando ? "Liquidando…" : `📦 Entregar ${formatoQ(montoALiquidar)} en efectivo`}
                </button>
              </div>
            </>
          )}
        </>
      )}
    </form>
  );
}
