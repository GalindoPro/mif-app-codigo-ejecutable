import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api, mensajeError } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import {
  ESTADO_PLAZO_FIJO_LABEL,
} from "../types";
import type { PlazoFijoContrato } from "../types";
import { formatearDPI, formatearQuetzales } from "../lib/formatters";

export default function PlazoFijoDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { usuario } = useAuth();

  const [contrato, setContrato] = useState<PlazoFijoContrato | null>(null);
  const [error, setError] = useState<string | null>(null);

  const puedeLiquidar =
    usuario?.rol === "ADMIN" || usuario?.rol === "GERENCIA" || usuario?.rol === "SUPERVISOR" || usuario?.rol === "CAJERO";

  function cargar() {
    if (!id) return;
    api
      .get<PlazoFijoContrato>(`/plazo-fijo/${id}`)
      .then(({ data }) => setContrato(data))
      .catch((err) => setError(mensajeError(err)));
  }

  useEffect(cargar, [id]);

  if (error && !contrato) return <div className="alert error">{error}</div>;
  if (!contrato) return <p>Cargando detalle del certificado…</p>;

  const hoy = new Date().toISOString().slice(0, 10);
  const estaVencido = contrato.estado === "ACTIVO" && contrato.fecha_vencimiento <= hoy;

  return (
    <div>
      <div className="page-head">
        <div>
          <button className="link-btn" onClick={() => navigate("/ahorros/plazo-fijo")} style={{ marginBottom: "0.5rem" }}>
            ← Volver a Ahorro a Plazo Fijo
          </button>
          <h1>
            Certificado #{contrato.numero_certificacion ?? "—"} · {contrato.socio_nombres}
          </h1>
          <p>
            Cuenta <span className="mono">{contrato.numero_cuenta}</span> · {contrato.agencia_nombre}
          </p>
        </div>

        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
          <span
            className={`badge ${contrato.estado === "ACTIVO" ? (estaVencido ? "danger" : "activo") : "inactivo"}`}
            style={{
              padding: "0.35rem 0.8rem",
              fontSize: "0.9rem",
            }}
          >
            {ESTADO_PLAZO_FIJO_LABEL[contrato.estado]}
            {estaVencido && " (Vencido)"}
          </span>

          {puedeLiquidar && contrato.estado === "ACTIVO" && (
            <Link
              to="/auxiliar-caja"
              className="btn"
              title="La liquidación se registra en Auxiliar de Caja, para que el efectivo entregado quede contabilizado"
            >
              💵 Ir a Auxiliar de Caja para liquidar
            </Link>
          )}

          <button className="btn secondary" onClick={() => window.print()}>
            🖨️ Imprimir
          </button>
        </div>
      </div>

      {error && <div className="alert error">{error}</div>}

      <div className="stat-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", marginBottom: "1.5rem" }}>
        <div className="stat-card accent">
          <span className="label">Saldo Líquido a Pagar</span>
          <span className="value">{formatearQuetzales(contrato.saldo_liquido_a_pagar)}</span>
          <span className="sub">Capital + Interés Neto</span>
        </div>

        <div className="stat-card">
          <span className="label">Capital Invertido</span>
          <span className="value">{formatearQuetzales(contrato.monto_deposito)}</span>
          <span className="sub">Plazo {contrato.plazo_meses} meses</span>
        </div>

        <div className="stat-card">
          <span className="label">Interés Neto</span>
          <span className="value" style={{ color: "#16a34a" }}>
            {formatearQuetzales(contrato.interes_neto)}
          </span>
          <span className="sub">Tasa {contrato.tasa_anual}% anual</span>
        </div>

        <div className="stat-card">
          <span className="label">Fecha Vencimiento</span>
          <span className="value mono" style={{ fontSize: "1.2rem", color: estaVencido ? "#dc2626" : "inherit" }}>
            {new Date(contrato.fecha_vencimiento).toLocaleDateString("es-GT")}
          </span>
          <span className="sub">
            {contrato.estado === "LIQUIDADO" && contrato.fecha_retiro
              ? `Liquidado el ${new Date(contrato.fecha_retiro).toLocaleDateString("es-GT")}${contrato.recibo_retiro ? ` · Recibo No. ${contrato.recibo_retiro}` : ""}`
              : estaVencido
                ? "Cumplió su plazo"
                : "En curso"}
          </span>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1.5rem" }}>
        <div className="card">
          <h2 style={{ marginTop: 0, fontSize: "1.05rem" }}>Datos del Inversionista</h2>
          <dl style={{ margin: 0, display: "grid", gridTemplateColumns: "auto 1fr", rowGap: "0.6rem", columnGap: "1rem" }}>
            <dt style={{ color: "var(--ink-soft)", fontSize: "0.85rem" }}>Socio</dt>
            <dd style={{ margin: 0, fontWeight: 600 }}>
              <Link to={`/socios/${contrato.socio_id}`}>{contrato.socio_nombres}</Link>
            </dd>

            <dt style={{ color: "var(--ink-soft)", fontSize: "0.85rem" }}>No. Asociado</dt>
            <dd className="mono" style={{ margin: 0 }}>{contrato.numero_asociado ?? "—"}</dd>

            <dt style={{ color: "var(--ink-soft)", fontSize: "0.85rem" }}>DPI</dt>
            <dd className="mono" style={{ margin: 0 }}>{contrato.socio_dpi ? formatearDPI(contrato.socio_dpi) : "—"}</dd>

            <dt style={{ color: "var(--ink-soft)", fontSize: "0.85rem" }}>Teléfono</dt>
            <dd style={{ margin: 0 }}>
              {contrato.socio_telefono ? (
                <span style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem" }}>
                  <span className="mono">{contrato.socio_telefono}</span>
                  <a
                    href={`https://wa.me/${contrato.socio_telefono.replace(/\D/g, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn secondary"
                    style={{ padding: "0.15rem 0.45rem", fontSize: "0.75rem", borderRadius: "4px" }}
                    title="Enviar WhatsApp"
                  >
                    💬 WhatsApp
                  </a>
                </span>
              ) : (
                "—"
              )}
            </dd>

            <dt style={{ color: "var(--ink-soft)", fontSize: "0.85rem" }}>Dirección</dt>
            <dd style={{ margin: 0 }}>{contrato.socio_direccion ?? "—"}</dd>
          </dl>
        </div>

        <div className="card">
          <h2 style={{ marginTop: 0, fontSize: "1.05rem" }}>Detalles del Certificado Financiero</h2>
          <dl style={{ margin: 0, display: "grid", gridTemplateColumns: "auto 1fr", rowGap: "0.6rem", columnGap: "1rem" }}>
            <dt style={{ color: "var(--ink-soft)", fontSize: "0.85rem" }}>No. Certificado</dt>
            <dd className="mono" style={{ margin: 0, fontWeight: 700 }}>
              #{contrato.numero_certificacion ?? "—"}
            </dd>

            <dt style={{ color: "var(--ink-soft)", fontSize: "0.85rem" }}>Fecha Apertura</dt>
            <dd className="mono" style={{ margin: 0 }}>
              {new Date(contrato.fecha_inicio).toLocaleDateString("es-GT")}
            </dd>

            <dt style={{ color: "var(--ink-soft)", fontSize: "0.85rem" }}>Interés Bruto</dt>
            <dd className="mono" style={{ margin: 0 }}>
              {formatearQuetzales(contrato.interes_generado)}
            </dd>

            <dt style={{ color: "var(--ink-soft)", fontSize: "0.85rem" }}>Retención ISR ({contrato.isr_porcentaje}%)</dt>
            <dd className="mono" style={{ margin: 0, color: "#dc2626" }}>
              - {formatearQuetzales(Number(contrato.interes_generado) - Number(contrato.interes_neto))}
            </dd>

            <dt style={{ color: "var(--ink-soft)", fontSize: "0.85rem" }}>Interés Neto</dt>
            <dd className="mono" style={{ margin: 0, fontWeight: 600, color: "#16a34a" }}>
              {formatearQuetzales(contrato.interes_neto)}
            </dd>

            <dt style={{ color: "var(--ink-soft)", fontSize: "0.85rem" }}>Fecha Liquidación</dt>
            <dd className="mono" style={{ margin: 0 }}>
              {contrato.fecha_retiro ? new Date(contrato.fecha_retiro).toLocaleDateString("es-GT") : "Pendiente"}
            </dd>
          </dl>
        </div>
      </div>
    </div>
  );
}
