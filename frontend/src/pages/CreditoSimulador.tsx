import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api, mensajeError } from "../lib/api";
import { formatoQ } from "../types";
import type { ResultadoSimulacion, TipoAmortizacion } from "../types";

export default function CreditoSimulador() {
  const navigate = useNavigate();
  const [monto, setMonto] = useState("10000");
  const [plazoMeses, setPlazoMeses] = useState("12");
  const [tasaMensual, setTasaMensual] = useState("2.0");
  const [tipoAmortizacion, setTipoAmortizacion] = useState<TipoAmortizacion>("CUOTA_NIVELADA");

  const [resultado, setResultado] = useState<ResultadoSimulacion | null>(null);
  const [error, setError] = useState<string | null>(null);

  function simular() {
    const m = Number(monto);
    const p = Number(plazoMeses);
    const t = Number(tasaMensual);

    if (m <= 0 || p <= 0 || t < 0) return;

    api
      .post<ResultadoSimulacion>("/prestamos/simular", {
        monto: m,
        plazoMeses: p,
        tasaInteresMensual: t,
        tipoAmortizacion,
      })
      .then(({ data }) => {
        setResultado(data);
        setError(null);
      })
      .catch((err) => setError(mensajeError(err)));
  }

  useEffect(() => {
    const timer = setTimeout(simular, 200);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [monto, plazoMeses, tasaMensual, tipoAmortizacion]);

  function aplicarCredito() {
    navigate(`/creditos/nuevo?monto=${monto}&plazo=${plazoMeses}&tasa=${tasaMensual}&tipoAmort=${tipoAmortizacion}`);
  }

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Simulador de Crédito</h1>
          <p>Calculadora oficial de cuotas con tasa de interés del 2% mensual y tabla de amortización.</p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <Link to="/creditos" className="btn secondary">
            ← Ver créditos
          </Link>
          <button type="button" className="btn" onClick={aplicarCredito}>
            Solicitar crédito con este plan →
          </button>
        </div>
      </div>

      {error && <div className="alert error">{error}</div>}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.5rem", marginBottom: "1.5rem" }}>
        <div className="card">
          <h2 style={{ marginTop: 0, fontSize: "1.1rem" }}>Parámetros del crédito</h2>

          <div className="field">
            <label htmlFor="sim-monto">Monto del préstamo (Capital en Quetzales)</label>
            <input
              id="sim-monto"
              type="number"
              min="500"
              step="500"
              value={monto}
              onChange={(e) => setMonto(e.target.value)}
              required
            />
          </div>

          <div className="field">
            <label htmlFor="sim-plazo">Plazo en meses</label>
            <input
              id="sim-plazo"
              type="number"
              min="1"
              max="120"
              value={plazoMeses}
              onChange={(e) => setPlazoMeses(e.target.value)}
              required
            />
            <div style={{ display: "flex", gap: "0.4rem", marginTop: "0.3rem" }}>
              {[6, 12, 18, 24, 36].map((meses) => (
                <button
                  key={meses}
                  type="button"
                  className={`btn secondary ${plazoMeses === String(meses) ? "active" : ""}`}
                  style={{ fontSize: "0.78rem", padding: "0.2rem 0.5rem" }}
                  onClick={() => setPlazoMeses(String(meses))}
                >
                  {meses}m
                </button>
              ))}
            </div>
          </div>

          <div className="field">
            <label htmlFor="sim-tasa">Tasa de interés mensual (%)</label>
            <input
              id="sim-tasa"
              type="number"
              step="0.1"
              min="0.1"
              max="10"
              value={tasaMensual}
              onChange={(e) => setTasaMensual(e.target.value)}
              required
            />
            <span className="hint">Tasa estándar MIF: 2.0% mensual (24% anual)</span>
          </div>

          <div className="field">
            <label>Sistema de amortización</label>
            <div className="tipo-toggle">
              <button
                type="button"
                className={tipoAmortizacion === "CUOTA_NIVELADA" ? "on deposito" : ""}
                onClick={() => setTipoAmortizacion("CUOTA_NIVELADA")}
              >
                Cuota Nivelada (Fija)
              </button>
              <button
                type="button"
                className={tipoAmortizacion === "SOBRE_SALDOS" ? "on retiro" : ""}
                onClick={() => setTipoAmortizacion("SOBRE_SALDOS")}
              >
                Sobre Saldos
              </button>
            </div>
          </div>
        </div>

        {resultado && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div className="stat-grid" style={{ gridTemplateColumns: "1fr 1fr" }}>
              <div className="stat-card accent">
                <span className="label">
                  {tipoAmortizacion === "CUOTA_NIVELADA" ? "Cuota mensual fija" : "Primera cuota mensual"}
                </span>
                <span className="value">{formatoQ(resultado.cuotaMensualEstimada)}</span>
                <span className="sub">a {resultado.plazoMeses} meses</span>
              </div>
              <div className="stat-card">
                <span className="label">Capital solicitado</span>
                <span className="value">{formatoQ(resultado.monto)}</span>
                <span className="sub">Tasa {resultado.tasaInteresMensual}% mensual</span>
              </div>
              <div className="stat-card">
                <span className="label">Total de intereses</span>
                <span className="value" style={{ color: "#d97706" }}>
                  {formatoQ(resultado.totalIntereses)}
                </span>
                <span className="sub">a lo largo del plazo</span>
              </div>
              <div className="stat-card">
                <span className="label">Monto total a pagar</span>
                <span className="value">{formatoQ(resultado.totalPagar)}</span>
                <span className="sub">Capital + Intereses</span>
              </div>
            </div>

            <div className="card" style={{ background: "var(--paper-raised)" }}>
              <p style={{ margin: 0, fontSize: "0.9rem", color: "var(--ink-soft)" }}>
                💡 <strong>Información para el Promotor:</strong> Este plan genera una cuota de{" "}
                <strong>{formatoQ(resultado.cuotaMensualEstimada)}</strong> al mes. El socio pagará un total de{" "}
                <strong>{formatoQ(resultado.totalIntereses)}</strong> por concepto de intereses.
              </p>
            </div>
          </div>
        )}
      </div>

      {resultado && (
        <div className="card">
          <h2 style={{ marginTop: 0 }}>Tabla de Amortización Mensual</h2>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>No. Cuota</th>
                  <th>Fecha estimada</th>
                  <th>Cuota mensual</th>
                  <th>Abono a Capital</th>
                  <th>Interés (2%)</th>
                  <th>Saldo restante</th>
                </tr>
              </thead>
              <tbody>
                {resultado.tabla.map((c) => (
                  <tr key={c.numero}>
                    <td className="mono" style={{ fontWeight: 600 }}>
                      Cuota {c.numero}
                    </td>
                    <td className="mono">{new Date(c.fechaPago).toLocaleDateString("es-GT")}</td>
                    <td className="mono" style={{ fontWeight: 600 }}>
                      {formatoQ(c.cuota)}
                    </td>
                    <td className="mono" style={{ color: "var(--accent)" }}>
                      {formatoQ(c.capital)}
                    </td>
                    <td className="mono" style={{ color: "#d97706" }}>
                      {formatoQ(c.interes)}
                    </td>
                    <td className="mono">{formatoQ(c.saldoRestante)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
