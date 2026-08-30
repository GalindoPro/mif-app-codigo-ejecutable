import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { api, mensajeError } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import BuscadorSocio from "../components/BuscadorSocio";
import { formatoQ } from "../types";
import type { Agencia, ResultadoSimulacionPF, Socio } from "../types";

export default function PlazoFijoForm() {
  const { usuario } = useAuth();
  const navigate = useNavigate();

  const puedeElegirAgencia = usuario?.rol === "ADMIN" || usuario?.rol === "GERENCIA";
  const [agencias, setAgencias] = useState<Agencia[]>([]);
  const [agenciaId, setAgenciaId] = useState(usuario?.agenciaId ?? "");

  const [socio, setSocio] = useState<Socio | null>(null);
  const [numeroCuenta, setNumeroCuenta] = useState("");
  const [numeroCertificacion, setNumeroCertificacion] = useState("");
  const [montoDeposito, setMontoDeposito] = useState("50000");
  const [plazoMeses, setPlazoMeses] = useState("12");
  const [tasaAnual, setTasaAnual] = useState("6.0");
  const [isrPorcentaje, setIsrPorcentaje] = useState("10.0");
  const [fechaInicio, setFechaInicio] = useState(new Date().toISOString().slice(0, 10));

  const [simulacion, setSimulacion] = useState<ResultadoSimulacionPF | null>(null);
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
      .get<{ codigo: string }>("/plazo-fijo/siguiente-codigo", { params: { agenciaId } })
      .then(({ data }) => setNumeroCuenta(data.codigo))
      .catch(() => {});

    api
      .get<{ numero: string }>("/plazo-fijo/siguiente-certificado", { params: { agenciaId } })
      .then(({ data }) => setNumeroCertificacion(data.numero))
      .catch(() => {});
  }, [agenciaId]);

  // Live calculation
  useEffect(() => {
    const m = Number(montoDeposito);
    const p = Number(plazoMeses);
    const t = Number(tasaAnual);
    const isr = Number(isrPorcentaje);

    if (m <= 0 || p <= 0 || t < 0) return;

    api
      .post<ResultadoSimulacionPF>("/plazo-fijo/simular", {
        montoDeposito: m,
        plazoMeses: p,
        tasaAnual: t,
        isrPorcentaje: isr,
        fechaInicio,
      })
      .then(({ data }) => setSimulacion(data))
      .catch(() => {});
  }, [montoDeposito, plazoMeses, tasaAnual, isrPorcentaje, fechaInicio]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!socio) {
      setError("Selecciona el socio inversionista.");
      return;
    }
    if (!agenciaId) {
      setError("Selecciona una agencia.");
      return;
    }

    setError(null);
    setGuardando(true);

    try {
      const { data } = await api.post("/plazo-fijo", {
        agenciaId,
        socioId: socio.id,
        numeroCuenta: numeroCuenta || undefined,
        numeroCertificacion: numeroCertificacion || undefined,
        montoDeposito: Number(montoDeposito),
        plazoMeses: Number(plazoMeses),
        tasaAnual: Number(tasaAnual),
        isrPorcentaje: Number(isrPorcentaje),
        fechaInicio,
      });
      navigate(`/ahorros/plazo-fijo/${data.id}`);
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
          <h1>Emitir Certificado a Plazo Fijo</h1>
          <p>Registro de nueva inversión a plazo fijo con cálculo de intereses pactados y retención de ISR.</p>
        </div>
      </div>

      {error && <div className="alert error">{error}</div>}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1.5rem" }}>
        <form className="card" onSubmit={onSubmit}>
          <h2 style={{ marginTop: 0, fontSize: "1.1rem" }}>Datos del Certificado</h2>

          {puedeElegirAgencia && (
            <div className="field">
              <label htmlFor="pf-agencia">Agencia</label>
              <select id="pf-agencia" value={agenciaId} onChange={(e) => setAgenciaId(e.target.value)} required>
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
            <label>Socio inversionista</label>
            <BuscadorSocio agenciaId={agenciaId || undefined} seleccionado={socio} onSeleccionar={setSocio} />
          </div>

          <div className="form-grid">
            <div className="field">
              <label htmlFor="pf-cert">No. de Certificación</label>
              <input
                id="pf-cert"
                value={numeroCertificacion}
                onChange={(e) => setNumeroCertificacion(e.target.value)}
                placeholder="Ej. 41"
                required
              />
              <span className="hint">Número impreso en el certificado físico</span>
            </div>

            <div className="field">
              <label htmlFor="pf-cuenta">Número de Cuenta</label>
              <input
                id="pf-cuenta"
                value={numeroCuenta}
                onChange={(e) => setNumeroCuenta(e.target.value)}
                placeholder="CHAJUL-PF-0001"
                required
              />
            </div>
          </div>

          <div className="field">
            <label htmlFor="pf-monto">Monto de Inversión / Depósito (Q)</label>
            <input
              id="pf-monto"
              type="number"
              min="1000"
              step="500"
              value={montoDeposito}
              onChange={(e) => setMontoDeposito(e.target.value)}
              required
            />
          </div>

          <div className="field">
            <label htmlFor="pf-plazo">Plazo del Contrato (meses)</label>
            <input
              id="pf-plazo"
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
                  style={{ fontSize: "0.8rem", padding: "0.2rem 0.6rem" }}
                  onClick={() => setPlazoMeses(String(meses))}
                >
                  {meses} meses
                </button>
              ))}
            </div>
          </div>

          <div className="form-grid">
            <div className="field">
              <label htmlFor="pf-tasa">Tasa de interés anual (%)</label>
              <input
                id="pf-tasa"
                type="number"
                step="0.1"
                min="0.1"
                max="30"
                value={tasaAnual}
                onChange={(e) => setTasaAnual(e.target.value)}
                required
              />
              <span className="hint">Ej. 6.0% anual</span>
            </div>

            <div className="field">
              <label htmlFor="pf-isr">Retención ISR (%)</label>
              <input
                id="pf-isr"
                type="number"
                step="0.1"
                min="0"
                max="20"
                value={isrPorcentaje}
                onChange={(e) => setIsrPorcentaje(e.target.value)}
                required
              />
              <span className="hint">10.0% estándar en Guatemala</span>
            </div>
          </div>

          <div className="field">
            <label htmlFor="pf-fecha">Fecha de inicio</label>
            <input
              id="pf-fecha"
              type="date"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
              required
            />
          </div>

          <div style={{ marginTop: "1.5rem", display: "flex", gap: "0.75rem" }}>
            <button type="submit" className="btn" disabled={guardando || !socio}>
              {guardando ? "Emitiendo certificado…" : "Emitir Certificado a Plazo Fijo"}
            </button>
            <button type="button" className="btn secondary" onClick={() => navigate(-1)}>
              Cancelar
            </button>
          </div>
        </form>

        {simulacion && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div className="stat-grid" style={{ gridTemplateColumns: "1fr 1fr" }}>
              <div className="stat-card accent">
                <span className="label">Saldo Líquido a Pagar</span>
                <span className="value">{formatoQ(simulacion.saldoLiquidoAPagar)}</span>
                <span className="sub">Capital + Interés Neto</span>
              </div>

              <div className="stat-card">
                <span className="label">Fecha de Vencimiento</span>
                <span className="value mono" style={{ fontSize: "1.2rem" }}>
                  {new Date(simulacion.fechaVencimiento).toLocaleDateString("es-GT")}
                </span>
                <span className="sub">A {simulacion.plazoMeses} meses plazo</span>
              </div>

              <div className="stat-card">
                <span className="label">Interés Bruto Generado</span>
                <span className="value">{formatoQ(simulacion.interesGenerado)}</span>
                <span className="sub">Al {simulacion.tasaAnual}% anual</span>
              </div>

              <div className="stat-card">
                <span className="label">Retención ISR (10%)</span>
                <span className="value" style={{ color: "#dc2626" }}>
                  - {formatoQ(simulacion.isrRetencion)}
                </span>
                <span className="sub">Impuesto legal retenido</span>
              </div>

              <div className="stat-card" style={{ gridColumn: "1 / -1" }}>
                <span className="label">Interés Neto que cobrará el socio</span>
                <span className="value" style={{ color: "#16a34a" }}>
                  {formatoQ(simulacion.interesNeto)}
                </span>
                <span className="sub">Ganancia libre de impuestos</span>
              </div>
            </div>

            <div className="card" style={{ background: "var(--paper-raised)" }}>
              <h3 style={{ marginTop: 0, fontSize: "0.95rem" }}>Resumen del Certificado</h3>
              <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--ink-soft)", lineHeight: 1.5 }}>
                El socio <strong>{socio?.nombres ?? "(Seleccionar socio)"}</strong> invertirá un capital de{" "}
                <strong>{formatoQ(simulacion.montoDeposito)}</strong> durante <strong>{simulacion.plazoMeses} meses</strong>. Al vencer el{" "}
                <strong>{new Date(simulacion.fechaVencimiento).toLocaleDateString("es-GT")}</strong>, la cooperativa le pagará un total de{" "}
                <strong>{formatoQ(simulacion.saldoLiquidoAPagar)}</strong> (que incluye{" "}
                <strong>{formatoQ(simulacion.interesNeto)}</strong> de intereses netos).
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
