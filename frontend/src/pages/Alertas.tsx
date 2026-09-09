import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, mensajeError } from "../lib/api";
import { formatoQ } from "../types";
import { formatearFechaLocal } from "../lib/formatters";

interface PlazoFijoAlerta {
  contrato_id: string;
  numero_cuenta: string;
  socio_nombres: string;
  numero_asociado: string;
  socio_telefono: string | null;
  agencia_nombre: string;
  monto_deposito: number;
  saldo_liquido_a_pagar: number;
  fecha_vencimiento: string;
  dias_para_vencimiento: number;
}

interface CreditoAlerta {
  id: string;
  codigo: string;
  tipo: string;
  socio_nombres: string;
  numero_asociado: string;
  socio_telefono: string | null;
  promotor_nombre: string | null;
  agencia_nombre: string;
  saldo_capital: number;
  cuota_mensual: number;
  fecha_referencia: string;
  dias_sin_pago?: number;
  dias_para_vencimiento?: number;
}

interface Alertas {
  total: number;
  plazoFijoVenciendo: PlazoFijoAlerta[];
  creditosMora: CreditoAlerta[];
  creditosVencimiento: CreditoAlerta[];
}

export default function Alertas() {
  const [alertas, setAlertas] = useState<Alertas | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(true);
  const [pestana, setPestana] = useState<"mora" | "plazo_fijo" | "vencimiento">("mora");

  useEffect(() => {
    setCargando(true);
    api.get<Alertas>("/alertas")
      .then(({ data }) => setAlertas(data))
      .catch((err) => setError(mensajeError(err)))
      .finally(() => setCargando(false));
  }, []);

  const waLink = (tel: string | null) => {
    if (!tel) return null;
    const d = tel.replace(/\D/g, "");
    return d.length >= 8 ? `https://wa.me/502${d.slice(-8)}` : null;
  };

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Panel de Alertas</h1>
          <p>Vencimientos próximos, créditos en mora y contratos por renovar.</p>
        </div>
        {alertas && (
          <div className="stat-card accent" style={{ minWidth: 150 }}>
            <span className="label">Total alertas</span>
            <span className="value mono" style={{ color: alertas.total > 0 ? "#dc2626" : "#10b981" }}>
              {alertas.total}
            </span>
          </div>
        )}
      </div>

      {error && <div className="alert error">{error}</div>}
      {cargando && <p style={{ color: "var(--ink-soft)" }}>Calculando alertas…</p>}

      {alertas && (
        <>
          {/* Resumen */}
          <div className="stat-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", marginBottom: "1.25rem" }}>
            <div
              className="stat-card"
              style={{ borderLeft: `4px solid #dc2626`, cursor: "pointer", border: pestana === "mora" ? "2px solid #dc2626" : undefined }}
              onClick={() => setPestana("mora")}
            >
              <span className="label" style={{ color: "#dc2626", fontWeight: 700 }}>Créditos en Mora</span>
              <span className="value mono" style={{ color: "#dc2626" }}>{alertas.creditosMora.length}</span>
              <span className="sub">Más de 34 días sin pago</span>
            </div>
            <div
              className="stat-card"
              style={{ cursor: "pointer", border: pestana === "plazo_fijo" ? "2px solid #f59e0b" : undefined }}
              onClick={() => setPestana("plazo_fijo")}
            >
              <span className="label" style={{ color: "#d97706", fontWeight: 700 }}>Plazo Fijo por Vencer</span>
              <span className="value mono" style={{ color: "#d97706" }}>{alertas.plazoFijoVenciendo.length}</span>
              <span className="sub">Próximos 30 días</span>
            </div>
            <div
              className="stat-card"
              style={{ cursor: "pointer", border: pestana === "vencimiento" ? "2px solid #3b82f6" : undefined }}
              onClick={() => setPestana("vencimiento")}
            >
              <span className="label" style={{ color: "#2563eb", fontWeight: 700 }}>Créditos por Vencer</span>
              <span className="value mono" style={{ color: "#2563eb" }}>{alertas.creditosVencimiento.length}</span>
              <span className="sub">Fecha límite en 30 días</span>
            </div>
          </div>

          {/* Tabla de Créditos en Mora */}
          {pestana === "mora" && (
            <div className="table-wrap">
              <table style={{ fontSize: "0.84rem" }}>
                <thead>
                  <tr>
                    <th>Crédito</th>
                    <th>Socio</th>
                    <th>Promotor</th>
                    <th style={{ textAlign: "right" }}>Saldo Capital</th>
                    <th style={{ textAlign: "center" }}>Días sin pago</th>
                    <th>Último pago ref.</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {alertas.creditosMora.map((c) => {
                    const wa = waLink(c.socio_telefono);
                    return (
                      <tr key={c.id} style={{ background: c.dias_sin_pago! > 90 ? "rgba(220,38,38,0.05)" : undefined }}>
                        <td className="mono" style={{ fontWeight: 700 }}>
                          <Link to={`/creditos/${c.id}`}>{c.codigo}</Link>
                          <div style={{ fontSize: "0.72rem", color: "var(--ink-soft)" }}>{c.tipo}</div>
                        </td>
                        <td>
                          <div style={{ fontWeight: 600 }}>{c.socio_nombres}</div>
                          <div style={{ fontSize: "0.75rem", display: "flex", gap: "0.4rem", alignItems: "center" }}>
                            <span className="mono">{c.numero_asociado}</span>
                            {wa && <a href={wa} target="_blank" rel="noreferrer" style={{ color: "#25d366", fontSize: "0.72rem", fontWeight: 700, textDecoration: "none" }}>WA💬</a>}
                          </div>
                        </td>
                        <td style={{ fontSize: "0.82rem" }}>{c.promotor_nombre ?? "—"}</td>
                        <td className="mono" style={{ textAlign: "right", fontWeight: 700 }}>{formatoQ(c.saldo_capital)}</td>
                        <td style={{ textAlign: "center" }}>
                          <span style={{
                            fontWeight: 700, fontFamily: "monospace",
                            color: c.dias_sin_pago! > 90 ? "#dc2626" : c.dias_sin_pago! > 60 ? "#f59e0b" : "#6b7280",
                          }}>
                            {c.dias_sin_pago}d
                          </span>
                        </td>
                        <td className="mono" style={{ fontSize: "0.79rem" }}>{formatearFechaLocal(c.fecha_referencia)}</td>
                        <td>
                          <Link to={`/creditos/${c.id}`} className="link-btn" style={{ fontSize: "0.78rem" }}>Ver →</Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {alertas.creditosMora.length === 0 && <div className="empty">No hay créditos en mora en este momento.</div>}
            </div>
          )}

          {/* Tabla de Plazo Fijo por Vencer */}
          {pestana === "plazo_fijo" && (
            <div className="table-wrap">
              <table style={{ fontSize: "0.84rem" }}>
                <thead>
                  <tr>
                    <th>No. Cuenta</th>
                    <th>Socio</th>
                    <th style={{ textAlign: "right" }}>Monto Depósito</th>
                    <th style={{ textAlign: "right" }}>A Pagar (con intereses)</th>
                    <th>Vence</th>
                    <th style={{ textAlign: "center" }}>Días restantes</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {alertas.plazoFijoVenciendo.map((pf) => {
                    const wa = waLink(pf.socio_telefono);
                    return (
                      <tr key={pf.contrato_id} style={{ background: pf.dias_para_vencimiento <= 7 ? "rgba(220,38,38,0.05)" : undefined }}>
                        <td className="mono" style={{ fontWeight: 600 }}>{pf.numero_cuenta}</td>
                        <td>
                          <div style={{ fontWeight: 600 }}>{pf.socio_nombres}</div>
                          <div style={{ fontSize: "0.75rem", display: "flex", gap: "0.4rem", alignItems: "center" }}>
                            <span className="mono">{pf.numero_asociado}</span>
                            {wa && <a href={wa} target="_blank" rel="noreferrer" style={{ color: "#25d366", fontSize: "0.72rem", fontWeight: 700, textDecoration: "none" }}>WA💬</a>}
                          </div>
                        </td>
                        <td className="mono" style={{ textAlign: "right" }}>{formatoQ(pf.monto_deposito)}</td>
                        <td className="mono" style={{ textAlign: "right", fontWeight: 700, color: "var(--accent)" }}>{formatoQ(pf.saldo_liquido_a_pagar)}</td>
                        <td className="mono">{formatearFechaLocal(pf.fecha_vencimiento)}</td>
                        <td style={{ textAlign: "center" }}>
                          <span style={{
                            fontWeight: 700, fontFamily: "monospace",
                            color: pf.dias_para_vencimiento <= 7 ? "#dc2626" : pf.dias_para_vencimiento <= 15 ? "#f59e0b" : "#16a34a",
                          }}>
                            {pf.dias_para_vencimiento}d
                          </span>
                        </td>
                        <td>
                          <Link to="/ahorros/plazo-fijo" className="link-btn" style={{ fontSize: "0.78rem" }}>Ver →</Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {alertas.plazoFijoVenciendo.length === 0 && <div className="empty">No hay contratos de plazo fijo venciendo en los próximos 30 días.</div>}
            </div>
          )}

          {/* Tabla de Créditos por Vencer */}
          {pestana === "vencimiento" && (
            <div className="table-wrap">
              <table style={{ fontSize: "0.84rem" }}>
                <thead>
                  <tr>
                    <th>Crédito</th>
                    <th>Socio</th>
                    <th style={{ textAlign: "right" }}>Saldo Capital</th>
                    <th>Vence</th>
                    <th style={{ textAlign: "center" }}>Días restantes</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {alertas.creditosVencimiento.map((c) => {
                    const wa = waLink(c.socio_telefono);
                    return (
                      <tr key={c.id}>
                        <td className="mono" style={{ fontWeight: 700 }}>
                          <Link to={`/creditos/${c.id}`}>{c.codigo}</Link>
                        </td>
                        <td>
                          <div style={{ fontWeight: 600 }}>{c.socio_nombres}</div>
                          <div style={{ fontSize: "0.75rem", display: "flex", gap: "0.4rem", alignItems: "center" }}>
                            <span className="mono">{c.numero_asociado}</span>
                            {wa && <a href={wa} target="_blank" rel="noreferrer" style={{ color: "#25d366", fontSize: "0.72rem", fontWeight: 700, textDecoration: "none" }}>WA💬</a>}
                          </div>
                        </td>
                        <td className="mono" style={{ textAlign: "right", fontWeight: 700 }}>{formatoQ(c.saldo_capital)}</td>
                        <td className="mono">{formatearFechaLocal(c.dias_para_vencimiento !== undefined ? String(c.fecha_referencia) : null)}</td>
                        <td style={{ textAlign: "center" }}>
                          <span style={{
                            fontWeight: 700, fontFamily: "monospace",
                            color: (c.dias_para_vencimiento ?? 30) <= 7 ? "#dc2626" : "#f59e0b",
                          }}>
                            {c.dias_para_vencimiento}d
                          </span>
                        </td>
                        <td>
                          <Link to={`/creditos/${c.id}`} className="link-btn" style={{ fontSize: "0.78rem" }}>Ver →</Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {alertas.creditosVencimiento.length === 0 && <div className="empty">No hay créditos con fecha de vencimiento en los próximos 30 días.</div>}
            </div>
          )}
        </>
      )}
    </div>
  );
}
