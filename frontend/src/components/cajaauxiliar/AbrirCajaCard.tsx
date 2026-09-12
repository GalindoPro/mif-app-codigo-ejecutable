import { useState } from "react";
import type { EstadoCajaAuxiliar } from "../../types";
import { formatoQ } from "../../types";

export interface AbrirCajaCardProps {
  estadoInfo: Extract<EstadoCajaAuxiliar, { estado: "SIN_ABRIR" }>;
  cargando: boolean;
  onAbrir: (saldoInicial?: number) => void;
}

export default function AbrirCajaCard({
  estadoInfo,
  cargando,
  onAbrir,
}: AbrirCajaCardProps) {
  const [saldoManual, setSaldoManual] = useState("");
  const hoy = new Date().toLocaleDateString("es-GT", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="card" style={{ maxWidth: 480 }}>
      <h2 style={{ marginTop: 0 }}>Abrir caja de hoy</h2>
      <p className="sub" style={{ textTransform: "capitalize" }}>
        {hoy}
      </p>
      {estadoInfo.esPrimeraVez ? (
        <>
          <p>Es la primera vez que se abre la caja de esta agencia. Indica el saldo inicial de hoy.</p>
          <div className="field">
            <label htmlFor="aux-saldo-manual">Saldo inicial</label>
            <input
              id="aux-saldo-manual"
              type="number"
              min="0"
              step="0.01"
              value={saldoManual}
              onChange={(e) => setSaldoManual(e.target.value)}
            />
          </div>
          <button className="btn" disabled={cargando || !saldoManual} onClick={() => onAbrir(Number(saldoManual))}>
            {cargando ? "Abriendo…" : "Abrir caja"}
          </button>
        </>
      ) : (
        <>
          <p>
            El saldo inicial de hoy se toma automáticamente del cierre del{" "}
            {estadoInfo.fechaUltimoCierre ? new Date(estadoInfo.fechaUltimoCierre).toLocaleDateString("es-GT") : "día anterior"}:
          </p>
          <div className="stat-card accent" style={{ marginBottom: "1rem" }}>
            <span className="label">Saldo inicial de hoy</span>
            <span className="value">{formatoQ(estadoInfo.saldoSugerido ?? 0)}</span>
          </div>
          <button className="btn" disabled={cargando} onClick={() => onAbrir()}>
            {cargando ? "Abriendo…" : "Abrir caja de hoy"}
          </button>
        </>
      )}
    </div>
  );
}
