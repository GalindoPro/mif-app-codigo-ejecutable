import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api, mensajeError } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import {
  ESTADO_PRESTAMO_LABEL,
  formatoQ,
  TIPO_PRESTAMO_LABEL,
} from "../types";
import type { EstadoPrestamo, Prestamo, PrestamoPago } from "../types";

export default function CreditoDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { usuario } = useAuth();

  const [prestamo, setPrestamo] = useState<Prestamo | null>(null);
  const [pagos, setPagos] = useState<PrestamoPago[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);
  const [procesando, setProcesando] = useState(false);

  const puedeAprobar = usuario?.rol === "ADMIN" || usuario?.rol === "GERENCIA" || usuario?.rol === "SUPERVISOR";

  function cargar() {
    if (!id) return;
    api
      .get<Prestamo>(`/prestamos/${id}`)
      .then(({ data }) => setPrestamo(data))
      .catch((err) => setError(mensajeError(err)));

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
          </p>
        </div>

        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <span
            style={{
              padding: "0.35rem 0.8rem",
              borderRadius: "8px",
              fontWeight: 700,
              fontSize: "0.9rem",
              background:
                prestamo.estado === "DESEMBOLSADO"
                  ? "#ecfdf5"
                  : prestamo.estado === "APROBADO"
                    ? "#eff6ff"
                    : prestamo.estado === "SOLICITUD"
                      ? "#fef3c7"
                      : "#f1f5f9",
              color:
                prestamo.estado === "DESEMBOLSADO"
                  ? "#065f46"
                  : prestamo.estado === "APROBADO"
                    ? "#1e40af"
                    : prestamo.estado === "SOLICITUD"
                      ? "#92400e"
                      : "#475569",
            }}
          >
            {ESTADO_PRESTAMO_LABEL[prestamo.estado]}
          </span>

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
            <button
              className="btn"
              onClick={() => cambiarEstado("DESEMBOLSADO")}
              disabled={procesando}
            >
              💵 Desembolsar crédito
            </button>
          )}

          {puedeAprobar && prestamo.estado === "DESEMBOLSADO" && (
            <button
              className="btn secondary"
              onClick={() => cambiarEstado("CANCELADO")}
              disabled={procesando}
            >
              Finalizar / Pagado
            </button>
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
            <dd className="mono" style={{ margin: 0 }}>{prestamo.socio_dpi ?? "—"}</dd>

            <dt style={{ color: "var(--ink-soft)", fontSize: "0.85rem" }}>Teléfono</dt>
            <dd style={{ margin: 0 }}>{prestamo.socio_telefono ?? "—"}</dd>

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

            <dt style={{ color: "var(--ink-soft)", fontSize: "0.85rem" }}>Garantía / Fiador</dt>
            <dd style={{ margin: 0 }}>{prestamo.garantia || "Sin garantía registrada"}</dd>

            <dt style={{ color: "var(--ink-soft)", fontSize: "0.85rem" }}>Fecha solicitud</dt>
            <dd className="mono" style={{ margin: 0 }}>
              {new Date(prestamo.fecha_solicitud).toLocaleDateString("es-GT")}
            </dd>

            <dt style={{ color: "var(--ink-soft)", fontSize: "0.85rem" }}>Fecha desembolso</dt>
            <dd className="mono" style={{ margin: 0 }}>
              {prestamo.fecha_desembolso ? new Date(prestamo.fecha_desembolso).toLocaleDateString("es-GT") : "Pendiente"}
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
                  <th>Abono a Capital</th>
                  <th>Interés (2%)</th>
                  <th>Saldo deudor</th>
                </tr>
              </thead>
              <tbody>
                {prestamo.amortizacion.tabla.map((c) => (
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
