import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { api, mensajeError } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import BuscadorSocio from "../components/BuscadorSocio";
import { formatearQuetzales } from "../lib/formatters";
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
  const [plazoMeses, setPlazoMeses] = useState("6");
  const [tasaAnual, setTasaAnual] = useState("6.0");
  const isrPorcentaje = "10.0";
  const [fechaInicio, setFechaInicio] = useState(new Date().toISOString().slice(0, 10));

  function handleCambioPlazo(valor: string) {
    setPlazoMeses(valor);
    const num = Number(valor);
    if (!isNaN(num) && num > 0) {
      if (num >= 12) {
        setTasaAnual("14.0");
      } else {
        setTasaAnual("6.0");
      }
    }
  }

  function seleccionarPlazo(meses: "6" | "12") {
    setPlazoMeses(meses);
    if (meses === "6") {
      setTasaAnual("6.0");
    } else {
      setTasaAnual("14.0");
    }
  }

  const [simulacion, setSimulacion] = useState<ResultadoSimulacionPF | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [saldoAportacion, setSaldoAportacion] = useState<number | null>(null);
  const [creandoAportacionRapida, setCreandoAportacionRapida] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sId = params.get("socioId");
    if (sId && !socio) {
      api
        .get<Socio>(`/socios/${sId}`)
        .then(({ data }) => {
          setSocio(data);
          if (data.agencia_id) setAgenciaId(data.agencia_id);
        })
        .catch(() => {});
    }
  }, []);

  useEffect(() => {
    if (puedeElegirAgencia) {
      api.get<Agencia[]>("/agencias").then(({ data }) => setAgencias(data));
    }
  }, [puedeElegirAgencia]);

  useEffect(() => {
    if (!socio) {
      setSaldoAportacion(null);
      return;
    }
    api
      .get<{ cuentas: Array<{ id: string; numero_cuenta: string; tipo: string; estado: string; saldo_actual?: string }> }>(`/socios/${socio.id}`)
      .then(({ data }) => {
        const apor = data.cuentas?.find((c) => c.tipo === "APORTACION" && c.estado === "ACTIVA");
        setSaldoAportacion(apor ? Number(apor.saldo_actual ?? 0) : 0);
      })
      .catch(() => setSaldoAportacion(null));
  }, [socio]);

  async function handleAperturarAportacionRapida() {
    if (!socio) return;
    setCreandoAportacionRapida(true);
    setError(null);
    try {
      await api.post(`/socios/${socio.id}/abrir-aportacion`, { monto: 100 });
      setSaldoAportacion(100);
    } catch (err) {
      setError(mensajeError(err));
    } finally {
      setCreandoAportacionRapida(false);
    }
  }

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
    if (saldoAportacion !== null && saldoAportacion < 100) {
      setError(
        `Regla de la cooperativa: El socio debe tener un saldo de aportaciones de al menos Q 100.00 para poder abrir un certificado a plazo fijo (saldo actual: Q ${saldoAportacion.toFixed(2)}).`
      );
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
            {socio && saldoAportacion !== null && (
              saldoAportacion < 100 ? (
                <div
                  style={{
                    marginTop: "0.6rem",
                    padding: "0.75rem 0.9rem",
                    borderRadius: "8px",
                    background: "rgba(239, 68, 68, 0.1)",
                    color: "#ef4444",
                    border: "1px solid rgba(239, 68, 68, 0.3)",
                    fontSize: "0.86rem",
                    lineHeight: 1.45,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: "0.5rem",
                  }}
                >
                  <div>
                    ⚠️ <strong>Aportación estatutaria insuficiente:</strong> Saldo de aportaciones:{" "}
                    <strong>Q {saldoAportacion.toFixed(2)}</strong> (Mínimo estatutario: Q 100.00).
                  </div>
                  <button
                    type="button"
                    className="btn"
                    style={{ background: "#059669", borderColor: "#059669", fontWeight: 700, fontSize: "0.8rem", padding: "0.25rem 0.6rem" }}
                    onClick={handleAperturarAportacionRapida}
                    disabled={creandoAportacionRapida}
                  >
                    {creandoAportacionRapida ? "Aperturando…" : "➕ Aperturar Aportación (Q 100) Ahora"}
                  </button>
                </div>
              ) : (
                <div
                  style={{
                    marginTop: "0.6rem",
                    padding: "0.5rem 0.8rem",
                    borderRadius: "8px",
                    background: "rgba(16, 185, 129, 0.1)",
                    color: "#10b981",
                    border: "1px solid rgba(16, 185, 129, 0.25)",
                    fontSize: "0.82rem",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.4rem",
                  }}
                >
                  <span>✓</span> Aportación estatutaria activa: <strong>Q {saldoAportacion.toFixed(2)}</strong> (Cumple con el requisito mínimo de Q 100.00)
                </div>
              )
            )}
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
              onChange={(e) => handleCambioPlazo(e.target.value)}
              placeholder="Ej. 6, 12, 14, 20..."
              required
            />
            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginTop: "0.35rem" }}>
              <span style={{ fontSize: "0.78rem", color: "var(--ink-soft)" }}>Tasas oficiales:</span>
              <button
                type="button"
                className={`btn ${plazoMeses === "6" ? "" : "secondary"}`}
                style={{
                  fontSize: "0.82rem",
                  padding: "0.22rem 0.75rem",
                  fontWeight: 700,
                  borderRadius: "6px",
                  border: plazoMeses === "6" ? "2px solid var(--accent)" : "1px solid var(--line)",
                }}
                onClick={() => seleccionarPlazo("6")}
                title="Aplica 6 meses con tasa del 6.0%"
              >
                6%
              </button>
              <button
                type="button"
                className={`btn ${plazoMeses === "12" ? "" : "secondary"}`}
                style={{
                  fontSize: "0.82rem",
                  padding: "0.22rem 0.75rem",
                  fontWeight: 700,
                  borderRadius: "6px",
                  border: plazoMeses === "12" ? "2px solid var(--accent)" : "1px solid var(--line)",
                }}
                onClick={() => seleccionarPlazo("12")}
                title="Aplica 12 meses con tasa del 14.0%"
              >
                14%
              </button>
            </div>
            <span className="hint">
              {Number(plazoMeses) >= 12
                ? `🔒 Tasa oficial del 14.0% aplicada automáticamente para ${plazoMeses} meses (12 meses en adelante).`
                : `🔒 Tasa oficial del 6.0% aplicada automáticamente para ${plazoMeses} meses (calculada día a día según meses reales).`}
            </span>
          </div>

          <div className="form-grid">
            <div className="field">
              <label htmlFor="pf-tasa">Tasa de interés</label>
              <input
                id="pf-tasa"
                value={`${tasaAnual}%`}
                readOnly
                disabled
                style={{
                  background: "rgba(0,0,0,0.06)",
                  cursor: "not-allowed",
                  fontWeight: 700,
                  color: "var(--ink)",
                }}
              />
              <span className="hint">
                {plazoMeses === "6"
                  ? "🔒 6.0% fija (calculado por días exactos de mes)"
                  : "🔒 14.0% fija (contrato oficial a partir de 12 meses)"}
              </span>
            </div>

            <div className="field">
              <label htmlFor="pf-isr">Retención ISR</label>
              <input
                id="pf-isr"
                value="10.0%"
                readOnly
                disabled
                style={{
                  background: "rgba(0,0,0,0.06)",
                  cursor: "not-allowed",
                  fontWeight: 700,
                  color: "var(--ink)",
                }}
              />
              <span className="hint">🔒 10.0% retención legal fija en Guatemala</span>
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
            <button
              type="submit"
              className="btn"
              disabled={guardando || !socio || (saldoAportacion !== null && saldoAportacion < 100)}
            >
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
              <div className="stat-card accent" style={{ gridColumn: "1 / -1" }}>
                <span className="label">SALDO LÍQUIDO TOTAL A PAGAR</span>
                <span className="value" style={{ fontSize: "1.85rem" }}>{formatearQuetzales(simulacion.saldoLiquidoAPagar)}</span>
                <span className="sub">Capital invertido + Interés Neto ganado</span>
              </div>

              <div className="stat-card" style={{ background: "rgba(59, 130, 246, 0.08)", border: "1px solid rgba(59, 130, 246, 0.25)" }}>
                <span className="label" style={{ color: "var(--accent)" }}>DÍAS EXACTOS DE INVERSIÓN</span>
                <span className="value mono" style={{ fontSize: "1.35rem", color: "var(--accent)" }}>
                  {simulacion.diasExactos} días
                </span>
                <span className="sub">Cálculo día a día según meses reales</span>
              </div>

              <div className="stat-card">
                <span className="label">FECHA DE VENCIMIENTO</span>
                <span className="value mono" style={{ fontSize: "1.25rem" }}>
                  {new Date(simulacion.fechaVencimiento + "T00:00:00").toLocaleDateString("es-GT")}
                </span>
                <span className="sub">Plazo de {simulacion.plazoMeses} meses</span>
              </div>

              <div className="stat-card">
                <span className="label">INTERÉS BRUTO GENERADO</span>
                <span className="value">{formatearQuetzales(simulacion.interesGenerado)}</span>
                <span className="sub">Tasa pactada: {simulacion.tasaAnual}%</span>
              </div>

              <div className="stat-card">
                <span className="label">RETENCIÓN ISR (10%)</span>
                <span className="value" style={{ color: "#dc2626" }}>
                  - {formatearQuetzales(simulacion.isrRetencion)}
                </span>
                <span className="sub">Impuesto legal retenido</span>
              </div>

              <div className="stat-card" style={{ gridColumn: "1 / -1" }}>
                <span className="label">INTERÉS NETO QUE COBRARÁ EL ASOCIADO</span>
                <span className="value" style={{ color: "#16a34a", fontSize: "1.5rem" }}>
                  {formatearQuetzales(simulacion.interesNeto)}
                </span>
                <span className="sub">Ganancia líquida libre de impuestos</span>
              </div>
            </div>

            <div className="card" style={{ background: "var(--paper-raised)" }}>
              <h3 style={{ marginTop: 0, fontSize: "0.95rem" }}>Resumen del Certificado</h3>
              <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--ink-soft)", lineHeight: 1.5 }}>
                El socio <strong>{socio?.nombres ?? "(Seleccionar socio)"}</strong> invertirá un capital de{" "}
                <strong>{formatearQuetzales(simulacion.montoDeposito)}</strong> durante <strong>{simulacion.plazoMeses} meses</strong> (
                <strong>{simulacion.diasExactos} días calendario exactos</strong>). Del{" "}
                <strong>{new Date(simulacion.fechaInicio + "T00:00:00").toLocaleDateString("es-GT")}</strong> al{" "}
                <strong>{new Date(simulacion.fechaVencimiento + "T00:00:00").toLocaleDateString("es-GT")}</strong>, la cooperativa calculará el{" "}
                <strong>{simulacion.tasaAnual}%</strong> por cada día transcurrido. Al vencer el contrato, el asociado cobrará un total de{" "}
                <strong>{formatearQuetzales(simulacion.saldoLiquidoAPagar)}</strong> (que incluye{" "}
                <strong>{formatearQuetzales(simulacion.interesNeto)}</strong> de ganancia neta tras descontar el 10% de ISR).
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
