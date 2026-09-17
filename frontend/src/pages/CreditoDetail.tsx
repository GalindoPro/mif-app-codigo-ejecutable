import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api, mensajeError } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import {
  ESTADO_PRESTAMO_LABEL,
  formatoQ,
  TIPO_PRESTAMO_LABEL,
  ORIGEN_FONDOS_LABEL,
  ORIGEN_FONDOS_BADGE_STYLE,
} from "../types";
import type { EstadoPrestamo, Prestamo, PrestamoPago } from "../types";
import { formatearDPI } from "../lib/formatters";
import type { ResultadoLiquidacion } from "../lib/liquidacionCredito";
import ContratoPagareCreditoModal from "../components/ContratoPagareCreditoModal";

export default function CreditoDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { usuario } = useAuth();

  const [prestamo, setPrestamo] = useState<Prestamo | null>(null);
  const [pagos, setPagos] = useState<PrestamoPago[]>([]);
  const [liquidacion, setLiquidacion] = useState<ResultadoLiquidacion | null>(null);
  const [mostrarContratoModal, setMostrarContratoModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);
  const [procesando, setProcesando] = useState(false);

  const puedeAprobar = usuario?.rol === "GERENCIA" || usuario?.rol === "SUPERVISOR";

  function cargar() {
    if (!id) return;
    api
      .get<Prestamo>(`/prestamos/${id}`)
      .then(({ data }) => setPrestamo(data))
      .catch((err) => setError(mensajeError(err)));

    api
      .get<{ prestamo: Prestamo; liquidacion: ResultadoLiquidacion }>(`/prestamos/${id}/liquidacion`)
      .then(({ data }) => setLiquidacion(data.liquidacion))
      .catch(() => {});

    api
      .get<PrestamoPago[]>(`/prestamos/${id}/pagos`)
      .then(({ data }) => setPagos(data))
      .catch(() => {});
  }

  useEffect(cargar, [id]);

  async function cambiarEstado(nuevoEstado: EstadoPrestamo) {
    if (!id) return;
    setError(null);
    setMensajeExito(null);
    setProcesando(true);

    try {
      await api.patch(`/prestamos/${id}/estado`, { estado: nuevoEstado });
      setMensajeExito(`Estado actualizado a: ${ESTADO_PRESTAMO_LABEL[nuevoEstado]}`);
      cargar();
    } catch (err) {
      setError(mensajeError(err));
    } finally {
      setProcesando(false);
    }
  }

  if (error && !prestamo) return <div className="alert error">{error}</div>;
  if (!prestamo) return <p>Cargando detalle del crédito…</p>;

  const montoMostrar = prestamo.monto_aprobado ?? prestamo.monto_solicitado;

  return (
    <div>
      <div className="page-head">
        <div>
          <button className="link-btn" onClick={() => navigate("/creditos")} style={{ marginBottom: "0.5rem" }}>
            ← Volver al listado de créditos
          </button>
          <h1>
            <span className="mono">{prestamo.codigo}</span> · {prestamo.socio_nombres}
          </h1>
          <p>
            Crédito {TIPO_PRESTAMO_LABEL[prestamo.tipo]} · {prestamo.agencia_nombre} · Promotor:{" "}
            <strong>{prestamo.promotor_nombre ?? "Sin asignar"}</strong>
            {prestamo.numero_credito_anterior && (
              <span style={{ marginLeft: "0.6rem", color: "#b45309", fontWeight: 700 }}>
                · 📋 Ref. Físico: {prestamo.numero_credito_anterior}
              </span>
            )}
          </p>
        </div>

        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
          {prestamo.es_migracion && (
            <span
              style={{
                fontSize: "0.8rem",
                fontWeight: 700,
                padding: "0.3rem 0.65rem",
                borderRadius: "6px",
                background: "rgba(245, 158, 11, 0.12)",
                color: "#b45309",
                border: "1px solid rgba(245, 158, 11, 0.35)",
              }}
            >
              📂 Crédito Migrado
            </span>
          )}

          <span
            className={`badge ${
              prestamo.estado === "DESEMBOLSADO"
                ? "activo"
                : prestamo.estado === "APROBADO"
                  ? "info"
                  : prestamo.estado === "SOLICITUD"
                    ? "warning"
                    : "inactivo"
            }`}
            style={{
              padding: "0.35rem 0.8rem",
              fontSize: "0.9rem",
            }}
          >
            {ESTADO_PRESTAMO_LABEL[prestamo.estado]}
          </span>

          <button
            type="button"
            className="btn secondary"
            onClick={() => setMostrarContratoModal(true)}
            style={{
              padding: "0.35rem 0.8rem",
              fontSize: "0.85rem",
              display: "flex",
              alignItems: "center",
              gap: "0.35rem",
              fontWeight: 700,
            }}
          >
            📜 Pagaré / Contrato
          </button>

          {puedeAprobar && prestamo.estado === "SOLICITUD" && (
            <button
              className="btn"
              onClick={() => cambiarEstado("APROBADO")}
              disabled={procesando}
            >
              ✓ Aprobar crédito
            </button>
          )}

          {puedeAprobar && prestamo.estado === "APROBADO" && (
            <>
              <button
                className="btn"
                style={{ background: "#059669", borderColor: "#059669", fontWeight: 700 }}
                onClick={() => cambiarEstado("DESEMBOLSADO")}
                disabled={procesando}
              >
                💵 Desembolsar crédito
              </button>
              <button
                className="btn danger"
                onClick={() => cambiarEstado("RECHAZADO")}
                disabled={procesando}
                style={{ padding: "0.4rem 0.8rem", fontSize: "0.85rem" }}
              >
                ✕ Anular / Rechazar
              </button>
            </>
          )}

          {puedeAprobar && prestamo.estado === "DESEMBOLSADO" && (
            <>
              <Link
                to="/caja-auxiliar"
                className="btn"
                style={{ background: "#10b981", borderColor: "#10b981", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "0.3rem" }}
              >
                💰 Cobrar Cuota en Caja
              </Link>
              <button
                className="btn secondary"
                onClick={() => cambiarEstado("CANCELADO")}
                disabled={procesando}
              >
                Finalizar / Liquidar
              </button>
            </>
          )}

          {puedeAprobar && prestamo.estado === "SOLICITUD" && (
            <button
              className="btn danger"
              onClick={() => cambiarEstado("RECHAZADO")}
              disabled={procesando}
              style={{ padding: "0.4rem 0.8rem", fontSize: "0.85rem" }}
            >
              Rechazar
            </button>
          )}
        </div>
      </div>

      {error && <div className="alert error">{error}</div>}
      {mensajeExito && <div className="alert success">{mensajeExito}</div>}

      <div className="stat-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", marginBottom: "1.5rem" }}>
        <div className="stat-card accent">
          <span className="label">Cuota mensual</span>
          <span className="value">{formatoQ(prestamo.cuota_mensual)}</span>
          <span className="sub">
            {prestamo.tipo_amortizacion === "CUOTA_NIVELADA" ? "Cuota fija nivelada" : "Sobre saldos"}
          </span>
        </div>

        <div className="stat-card">
          <span className="label">Monto del crédito</span>
          <span className="value">{formatoQ(montoMostrar)}</span>
          <span className="sub">Plazo {prestamo.plazo_meses} meses</span>
        </div>

        <div className="stat-card">
          <span className="label">Tasa de interés</span>
          <span className="value">{prestamo.tasa_interes_mensual}%</span>
          <span className="sub">Interés mensual</span>
        </div>

        <div className="stat-card">
          <span className="label">Total de intereses</span>
          <span className="value" style={{ color: "#d97706" }}>
            {prestamo.amortizacion ? formatoQ(prestamo.amortizacion.totalIntereses) : "—"}
          </span>
          <span className="sub">al finalizar el crédito</span>
        </div>

        <div className="stat-card" style={{ background: "var(--paper-raised)" }}>
          <span className="label">Saldo capital restante</span>
          <span
            className="value"
            style={{
              color: Number(prestamo.saldo_capital ?? montoMostrar) > 0 ? "var(--accent)" : "#16a34a",
            }}
          >
            {formatoQ(prestamo.saldo_capital ?? montoMostrar)}
          </span>
          <span className="sub">
            {prestamo.estado === "CANCELADO" ? "Crédito pagado al 100%" : "Deuda viva en cartera"}
          </span>
        </div>
      </div>

      {/* TARJETA OFICIAL DE LIQUIDACIÓN AL DÍA DE HOY (DÍAS EXACTOS / 365 Y MORA TRAS 4 DÍAS DE GRACIA) */}
      {liquidacion && prestamo.estado !== "CANCELADO" && (
        <div
          className="card"
          style={{
            background: "rgba(16, 185, 129, 0.05)",
            border: "1px solid rgba(16, 185, 129, 0.35)",
            borderRadius: "10px",
            padding: "1rem 1.25rem",
            marginBottom: "1.5rem",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem", flexWrap: "wrap", gap: "0.5rem" }}>
            <div>
              <h3 style={{ margin: 0, fontSize: "1.02rem", color: "#065f46" }}>
                ⚡ Liquidación Financiera en Tiempo Real al Día de Hoy ({liquidacion.fechaLiquidacion})
              </h3>
              <p style={{ margin: "0.15rem 0 0", fontSize: "0.8rem", color: "var(--ink-soft)" }}>
                Cálculo oficial con días exactos transcurridos desde el último pago ({liquidacion.fechaUltimoPago}), base 365 días y mora tras 4 días de gracia.
              </p>
            </div>
            <Link
              to="/caja-auxiliar"
              className="btn"
              style={{ background: "#059669", borderColor: "#059669", fontSize: "0.82rem", padding: "0.3rem 0.75rem", fontWeight: 700 }}
            >
              💵 Cobrar Cuota en Caja
            </Link>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
              gap: "0.75rem",
            }}
          >
            <div style={{ background: "var(--paper)", padding: "0.6rem 0.8rem", borderRadius: "8px", border: "1px solid var(--line)" }}>
              <span style={{ fontSize: "0.74rem", color: "var(--ink-soft)", display: "block" }}>Días transcurridos</span>
              <strong style={{ fontSize: "1.1rem", color: "var(--ink)" }}>{liquidacion.diasTranscurridos} días</strong>
              <span style={{ fontSize: "0.7rem", color: "var(--ink-soft)", display: "block" }}>
                {liquidacion.diasAtraso > 0 ? `${liquidacion.diasAtraso} días de atraso` : "Al día"}
              </span>
            </div>

            <div style={{ background: "var(--paper)", padding: "0.6rem 0.8rem", borderRadius: "8px", border: "1px solid var(--line)" }}>
              <span style={{ fontSize: "0.74rem", color: "var(--ink-soft)", display: "block" }}>Interés diario ({liquidacion.tasaInteresAnual}% anual)</span>
              <strong style={{ fontSize: "1.1rem", color: "#d97706" }}>{formatoQ(liquidacion.interesDiario)} / día</strong>
              <span style={{ fontSize: "0.7rem", color: "var(--ink-soft)", display: "block" }}>
                ({formatoQ(liquidacion.saldoCapital)} × 24% / 365)
              </span>
            </div>

            <div style={{ background: "var(--paper)", padding: "0.6rem 0.8rem", borderRadius: "8px", border: "1px solid var(--line)" }}>
              <span style={{ fontSize: "0.74rem", color: "var(--ink-soft)", display: "block" }}>Interés acumulado hoy ({liquidacion.diasTranscurridos}d)</span>
              <strong style={{ fontSize: "1.1rem", color: "#d97706" }}>{formatoQ(liquidacion.interesDevengado)}</strong>
              <span style={{ fontSize: "0.7rem", color: "var(--ink-soft)", display: "block" }}>
                {formatoQ(liquidacion.interesDiario)} × {liquidacion.diasTranscurridos}d
              </span>
            </div>

            <div
              style={{
                background: liquidacion.estaEnMora ? "rgba(220, 38, 38, 0.08)" : "var(--paper)",
                border: liquidacion.estaEnMora ? "1px solid #ef4444" : "1px solid var(--line)",
                padding: "0.6rem 0.8rem",
                borderRadius: "8px",
              }}
            >
              <span style={{ fontSize: "0.74rem", color: liquidacion.estaEnMora ? "#b91c1c" : "var(--ink-soft)", display: "block" }}>
                Recargo de mora
              </span>
              <strong style={{ fontSize: "1.1rem", color: liquidacion.estaEnMora ? "#b91c1c" : "var(--ink)" }}>
                {formatoQ(liquidacion.moraFijaSugerida)}
              </strong>
              <span style={{ fontSize: "0.7rem", color: liquidacion.estaEnMora ? "#b91c1c" : "var(--ink-soft)", display: "block" }}>
                {liquidacion.estaEnMora ? `> 4 días de gracia (Q25 × ${liquidacion.cuotasVencidas})` : "4 días gracia: Q 0.00"}
              </span>
            </div>

            <div style={{ background: "rgba(16, 185, 129, 0.12)", padding: "0.6rem 0.8rem", borderRadius: "8px", border: "1px solid #10b981" }}>
              <span style={{ fontSize: "0.74rem", color: "#065f46", display: "block", fontWeight: 700 }}>
                Saldo Cancelación Total Hoy
              </span>
              <strong style={{ fontSize: "1.15rem", color: "#047857" }}>{formatoQ(liquidacion.saldoCancelacionTotal)}</strong>
              <span style={{ fontSize: "0.7rem", color: "#065f46", display: "block" }}>
                Capital + Interés {liquidacion.diasTranscurridos}d + Mora
              </span>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1.5rem", marginBottom: "1.5rem" }}>
        <div className="card">
          <h2 style={{ marginTop: 0, fontSize: "1.05rem" }}>Información del socio y solicitud</h2>
          <dl style={{ margin: 0, display: "grid", gridTemplateColumns: "auto 1fr", rowGap: "0.6rem", columnGap: "1rem" }}>
            <dt style={{ color: "var(--ink-soft)", fontSize: "0.85rem" }}>Socio</dt>
            <dd style={{ margin: 0, fontWeight: 600 }}>
              <Link to={`/socios/${prestamo.socio_id}`}>{prestamo.socio_nombres}</Link>
            </dd>

            <dt style={{ color: "var(--ink-soft)", fontSize: "0.85rem" }}>No. Asociado</dt>
            <dd className="mono" style={{ margin: 0 }}>{prestamo.numero_asociado ?? "—"}</dd>

            <dt style={{ color: "var(--ink-soft)", fontSize: "0.85rem" }}>DPI</dt>
            <dd className="mono" style={{ margin: 0 }}>{prestamo.socio_dpi ? formatearDPI(prestamo.socio_dpi) : "—"}</dd>

            <dt style={{ color: "var(--ink-soft)", fontSize: "0.85rem" }}>Teléfono</dt>
            <dd style={{ margin: 0 }}>
              {prestamo.socio_telefono ? (
                <span style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem" }}>
                  <span className="mono">{prestamo.socio_telefono}</span>
                  <a
                    href={`https://wa.me/${prestamo.socio_telefono.replace(/\D/g, "")}`}
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
            <dd style={{ margin: 0 }}>{prestamo.socio_direccion ?? "—"}</dd>

            <dt style={{ color: "var(--ink-soft)", fontSize: "0.85rem" }}>Destino</dt>
            <dd style={{ margin: 0 }}>{prestamo.destino || "Sin especificar"}</dd>
          </dl>
        </div>

        <div className="card">
          <h2 style={{ marginTop: 0, fontSize: "1.05rem" }}>Detalles de la colocación</h2>
          <dl style={{ margin: 0, display: "grid", gridTemplateColumns: "auto 1fr", rowGap: "0.6rem", columnGap: "1rem" }}>
            <dt style={{ color: "var(--ink-soft)", fontSize: "0.85rem" }}>Código</dt>
            <dd className="mono" style={{ margin: 0, fontWeight: 600 }}>{prestamo.codigo}</dd>

            <dt style={{ color: "var(--ink-soft)", fontSize: "0.85rem" }}>Agencia</dt>
            <dd style={{ margin: 0 }}>{prestamo.agencia_nombre}</dd>

            <dt style={{ color: "var(--ink-soft)", fontSize: "0.85rem" }}>Promotor</dt>
            <dd style={{ margin: 0 }}>{prestamo.promotor_nombre ? `${prestamo.promotor_nombre}` : "Sin promotor"}</dd>

            {prestamo.tipo === "FIDUCIARIO" ? (
              <>
                <dt style={{ color: "var(--ink-soft)", fontSize: "0.85rem" }}>Fiador</dt>
                <dd style={{ margin: 0, fontWeight: 600 }}>{prestamo.nombre_fiador || prestamo.garantia || "Sin fiador registrado"}</dd>

                {prestamo.dpi_fiador && (
                  <>
                    <dt style={{ color: "var(--ink-soft)", fontSize: "0.85rem" }}>DPI Fiador</dt>
                    <dd className="mono" style={{ margin: 0 }}>{formatearDPI(prestamo.dpi_fiador)}</dd>
                  </>
                )}

                {prestamo.telefono_fiador && (
                  <>
                    <dt style={{ color: "var(--ink-soft)", fontSize: "0.85rem" }}>Teléfono Fiador</dt>
                    <dd style={{ margin: 0 }}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem" }}>
                        <span className="mono">{prestamo.telefono_fiador}</span>
                        <a
                          href={`https://wa.me/${prestamo.telefono_fiador.replace(/\D/g, "")}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn secondary"
                          style={{ padding: "0.15rem 0.45rem", fontSize: "0.75rem", borderRadius: "4px" }}
                          title="Enviar WhatsApp al fiador"
                        >
                          💬 WhatsApp
                        </a>
                      </span>
                    </dd>
                  </>
                )}

                {prestamo.ubicacion_garantia && (
                  <>
                    <dt style={{ color: "var(--ink-soft)", fontSize: "0.85rem" }}>Lugar / Trabajo</dt>
                    <dd style={{ margin: 0 }}>{prestamo.ubicacion_garantia}</dd>
                  </>
                )}
              </>
            ) : (
              <>
                <dt style={{ color: "var(--ink-soft)", fontSize: "0.85rem" }}>Garantía Inmueble</dt>
                <dd style={{ margin: 0 }}>{prestamo.garantia || "Sin descripción"}</dd>

                {prestamo.documento_desembolso && (
                  <>
                    <dt style={{ color: "var(--ink-soft)", fontSize: "0.85rem" }}>Finca / Folio / Doc.</dt>
                    <dd className="mono" style={{ margin: 0 }}>{prestamo.documento_desembolso}</dd>
                  </>
                )}

                {prestamo.ubicacion_garantia && (
                  <>
                    <dt style={{ color: "var(--ink-soft)", fontSize: "0.85rem" }}>Ubicación</dt>
                    <dd style={{ margin: 0 }}>{prestamo.ubicacion_garantia}</dd>
                  </>
                )}
              </>
            )}

            <dt style={{ color: "var(--ink-soft)", fontSize: "0.85rem" }}>Fecha solicitud</dt>
            <dd className="mono" style={{ margin: 0 }}>
              {new Date(prestamo.fecha_solicitud).toLocaleDateString("es-GT")}
            </dd>

            <dt style={{ color: "var(--ink-soft)", fontSize: "0.85rem" }}>Fecha desembolso</dt>
            <dd className="mono" style={{ margin: 0 }}>
              {prestamo.fecha_desembolso ? new Date(prestamo.fecha_desembolso).toLocaleDateString("es-GT") : "Pendiente"}
            </dd>

            <dt style={{ color: "var(--ink-soft)", fontSize: "0.85rem" }}>Fuente de Fondos</dt>
            <dd style={{ margin: 0 }}>
              {prestamo.origen_fondos ? (
                <span
                  style={{
                    display: "inline-block",
                    padding: "0.15rem 0.5rem",
                    borderRadius: "4px",
                    fontSize: "0.76rem",
                    fontWeight: 700,
                    ...ORIGEN_FONDOS_BADGE_STYLE[prestamo.origen_fondos],
                  }}
                >
                  {ORIGEN_FONDOS_LABEL[prestamo.origen_fondos]}
                </span>
              ) : (
                "Fondos Propios (COOP COMIF R.L.)"
              )}
            </dd>
          </dl>
        </div>
      </div>

      {pagos.length > 0 && (
        <div className="card" style={{ marginBottom: "1.5rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <div>
              <h2 style={{ margin: 0, fontSize: "1.05rem" }}>Historial de Pagos de Cuotas (Ventanilla)</h2>
              <p style={{ margin: "0.2rem 0 0", fontSize: "0.85rem", color: "var(--ink-soft)" }}>
                Cobros registrados en caja según libro de Ingresos COMIF.
              </p>
            </div>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>No. Recibo</th>
                  <th>Abono Capital</th>
                  <th>Interés</th>
                  <th>Mora</th>
                  <th>Total Cobrado</th>
                  <th>Saldo Capital Restante</th>
                  <th>Cajero / Operador</th>
                </tr>
              </thead>
              <tbody>
                {pagos.map((p) => (
                  <tr key={p.id}>
                    <td className="mono">{new Date(p.fecha).toLocaleDateString("es-GT")}</td>
                    <td className="mono">{p.numero_recibo ?? "—"}</td>
                    <td className="mono" style={{ color: "var(--accent)", fontWeight: 600 }}>
                      {formatoQ(p.abono_capital)}
                    </td>
                    <td className="mono" style={{ color: "#d97706" }}>
                      {formatoQ(p.interes)}
                    </td>
                    <td className="mono" style={{ color: Number(p.mora) > 0 ? "#dc2626" : "inherit" }}>
                      {formatoQ(p.mora)}
                    </td>
                    <td className="mono" style={{ fontWeight: 700 }}>
                      {formatoQ(p.total_pagado)}
                    </td>
                    <td className="mono" style={{ fontWeight: 600 }}>
                      {formatoQ(p.saldo_capital_restante)}
                    </td>
                    <td>{p.usuario_nombre ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {prestamo.amortizacion && (
        <div className="card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <div>
              <h2 style={{ margin: 0 }}>Tabla Oficial de Amortización</h2>
              <p style={{ margin: "0.2rem 0 0", fontSize: "0.85rem", color: "var(--ink-soft)" }}>
                Cronograma de {prestamo.plazo_meses} cuotas mensuales calculadas al {prestamo.tasa_interes_mensual}% de interés mensual.
              </p>
            </div>
            <div className="stat-card" style={{ padding: "0.5rem 1rem" }}>
              <span className="label">Total a pagar</span>
              <span className="value" style={{ fontSize: "1.1rem" }}>{formatoQ(prestamo.amortizacion.totalPagar)}</span>
            </div>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>No. Cuota</th>
                  <th>Fecha de pago</th>
                  <th>Cuota mensual</th>
                  <th>Saldo Anterior</th>
                  <th>Abono a Capital</th>
                  <th>Interés (2%)</th>
                  <th>Saldo Actual</th>
                </tr>
              </thead>
              <tbody>
                {prestamo.amortizacion.tabla.map((c, index) => {
                  const estaPagada = index < pagos.length;
                  const saldoAnterior = Number(c.saldoRestante) + Number(c.capital);
                  return (
                    <tr key={c.numero} style={{ opacity: estaPagada ? 0.6 : 1, background: estaPagada ? "rgba(16, 185, 129, 0.05)" : "transparent" }}>
                      <td className="mono" style={{ fontWeight: 600 }}>
                        Cuota {c.numero} {estaPagada && <span title="Cuota pagada" style={{ color: "#10b981", marginLeft: "4px" }}>✔</span>}
                      </td>
                      <td className="mono" style={{ textDecoration: estaPagada ? "line-through" : "none", color: estaPagada ? "var(--ink-soft)" : "inherit" }}>
                        {new Date(c.fechaPago).toLocaleDateString("es-GT")}
                      </td>
                      <td className="mono" style={{ fontWeight: 600 }}>
                        {formatoQ(c.cuota)}
                      </td>
                      <td className="mono" style={{ color: "var(--ink-soft)" }}>
                        {formatoQ(saldoAnterior)}
                      </td>
                      <td className="mono" style={{ color: estaPagada ? "var(--ink-soft)" : "var(--accent)" }}>
                        {formatoQ(c.capital)}
                      </td>
                      <td className="mono" style={{ color: estaPagada ? "var(--ink-soft)" : "#d97706" }}>
                        {formatoQ(c.interes)}
                      </td>
                      <td className="mono" style={{ fontWeight: 700 }}>{formatoQ(c.saldoRestante)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {mostrarContratoModal && (
        <ContratoPagareCreditoModal
          prestamo={prestamo}
          onClose={() => setMostrarContratoModal(false)}
        />
      )}
    </div>
  );
}
