import { useState } from "react";
import type { EstadoCajaAuxiliar } from "../../types";
import { formatoQ } from "../../types";

export interface AbrirCajaCardProps {
  estadoInfo: Extract<EstadoCajaAuxiliar, { estado: "SIN_ABRIR" }>;
  cargando: boolean;
  onAbrir: (saldoInicial?: number, fecha?: string) => void;
}

export default function AbrirCajaCard({
  estadoInfo,
  cargando,
  onAbrir,
}: AbrirCajaCardProps) {
  const [saldoManual, setSaldoManual] = useState("");
  const [ajustarSaldo, setAjustarSaldo] = useState(false);
  const [fecha, setFecha] = useState(() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  });

  const fechaLegible = (() => {
    if (!fecha) return "";
    const [y, m, d] = fecha.split("-").map(Number);
    const dateObj = new Date(y, m - 1, d);
    return dateObj.toLocaleDateString("es-GT", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  })();

  return (
    <div className="card" style={{ maxWidth: 520, margin: "1rem auto" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
        <span style={{ fontSize: "1.5rem" }}>💵</span>
        <div>
          <h2 style={{ margin: 0, fontSize: "1.2rem" }}>Apertura de Caja Auxiliar</h2>
          <span style={{ fontSize: "0.8rem", color: "var(--ink-soft)" }}>
            Registro de operaciones de ventanilla
          </span>
        </div>
      </div>

      <div style={{ margin: "1rem 0", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        <div className="field">
          <label htmlFor="aux-fecha-apertura" style={{ fontWeight: 600, fontSize: "0.82rem" }}>
            📅 Fecha de Operación de la Caja
          </label>
          <input
            id="aux-fecha-apertura"
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            style={{
              padding: "0.45rem 0.65rem",
              borderRadius: "6px",
              border: "1px solid var(--line)",
              background: "var(--paper)",
              color: "var(--ink)",
              fontSize: "0.88rem",
            }}
          />
          <small style={{ color: "var(--ink-soft)", textTransform: "capitalize", marginTop: "0.2rem" }}>
            {fechaLegible}
          </small>
        </div>

        {estadoInfo.esPrimeraVez ? (
          <div>
            <p style={{ fontSize: "0.85rem", color: "var(--ink-soft)" }}>
              Es la primera vez que se abre la caja de esta agencia. Indica el saldo inicial en efectivo.
            </p>
            <div className="field">
              <label htmlFor="aux-saldo-manual">Saldo inicial (Q)</label>
              <input
                id="aux-saldo-manual"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={saldoManual}
                onChange={(e) => setSaldoManual(e.target.value)}
              />
            </div>
            <button
              type="button"
              className="btn primary"
              disabled={cargando || !saldoManual || !fecha}
              onClick={() => onAbrir(Number(saldoManual), fecha)}
              style={{ width: "100%", marginTop: "0.5rem" }}
            >
              {cargando ? "Abriendo caja…" : `Abrir Caja (${fecha})`}
            </button>
          </div>
        ) : (
          <div>
            <p style={{ fontSize: "0.82rem", color: "var(--ink-soft)", margin: "0.25rem 0 0.5rem 0" }}>
              El saldo inicial se toma automáticamente del cierre del{" "}
              <strong>
                {estadoInfo.fechaUltimoCierre
                  ? new Date(estadoInfo.fechaUltimoCierre).toLocaleDateString("es-GT")
                  : "día anterior"}
              </strong>:
            </p>

            <div className="stat-card accent" style={{ marginBottom: "0.75rem", padding: "0.75rem" }}>
              <span className="label" style={{ fontSize: "0.75rem" }}>SALDO INICIAL SUGERIDO (ARRASTRE)</span>
              <span className="value" style={{ fontSize: "1.2rem", color: "var(--accent)" }}>
                {formatoQ(estadoInfo.saldoSugerido ?? 0)}
              </span>
            </div>

            <div style={{ marginBottom: "0.75rem" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "0.45rem", fontSize: "0.8rem", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={ajustarSaldo}
                  onChange={(e) => {
                    setAjustarSaldo(e.target.checked);
                    if (!e.target.checked) setSaldoManual("");
                  }}
                />
                <span>Ajustar saldo inicial manualmente (Excepción)</span>
              </label>

              {ajustarSaldo && (
                <div className="field" style={{ marginTop: "0.5rem" }}>
                  <label htmlFor="aux-saldo-manual-override" style={{ fontSize: "0.78rem" }}>
                    Nuevo saldo inicial (Q)
                  </label>
                  <input
                    id="aux-saldo-manual-override"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder={(estadoInfo.saldoSugerido ?? 0).toString()}
                    value={saldoManual}
                    onChange={(e) => setSaldoManual(e.target.value)}
                  />
                </div>
              )}
            </div>

            <button
              type="button"
              className="btn primary"
              disabled={cargando || !fecha || (ajustarSaldo && !saldoManual)}
              onClick={() => onAbrir(ajustarSaldo && saldoManual ? Number(saldoManual) : undefined, fecha)}
              style={{ width: "100%", padding: "0.5rem", fontSize: "0.9rem" }}
            >
              {cargando ? "Abriendo caja…" : `Abrir Caja (${fecha})`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
