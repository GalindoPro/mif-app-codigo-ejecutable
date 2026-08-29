import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api, mensajeError } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import {
  ESTADO_PRESTAMO_LABEL,
  formatoQ,
  TIPO_PRESTAMO_LABEL,
} from "../types";
import type { EstadoPrestamo, Prestamo } from "../types";

export default function CreditoDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { usuario } = useAuth();

  const [prestamo, setPrestamo] = useState<Prestamo | null>(null);
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

            <dt style={{ color: "var(--ink-soft)", fontSize: "0.85rem" }}>Fecha solicitud</dt>
            <dd className="mono" style={{ margin: 0 }}>
              {new Date(prestamo.fecha_solicitud).toLocaleDateString("es-GT")}
            </dd>

            <dt style={{ color: "var(--ink-soft)", fontSize: "0.85rem" }}>Desembolsado el</dt>
            <dd className="mono" style={{ margin: 0 }}>
              {prestamo.fecha_desembolso ? new Date(prestamo.fecha_desembolso).toLocaleDateString("es-GT") : "Pendiente"}
            </dd>
          </dl>
        </div>

        <div className="card">
          <h2 style={{ marginTop: 0, fontSize: "1.05rem" }}>Garantía y Promotor</h2>
          <dl style={{ margin: 0, display: "grid", gridTemplateColumns: "auto 1fr", rowGap: "0.6rem", columnGap: "1rem" }}>
            <dt style={{ color: "var(--ink-soft)", fontSize: "0.85rem" }}>Promotor asignado</dt>
            <dd style={{ margin: 0, fontWeight: 600 }}>{prestamo.promotor_nombre ?? "Sin asignar"}</dd>

            <dt style={{ color: "var(--ink-soft)", fontSize: "0.85rem" }}>Destino</dt>
            <dd style={{ margin: 0 }}>{prestamo.destino ?? "—"}</dd>

            <dt style={{ color: "var(--ink-soft)", fontSize: "0.85rem" }}>Garantía / Fiador</dt>
            <dd style={{ margin: 0, whiteSpace: "pre-wrap" }}>{prestamo.garantia ?? "Sin garantía especificada"}</dd>

            <dt style={{ color: "var(--ink-soft)", fontSize: "0.85rem" }}>Observaciones</dt>
            <dd style={{ margin: 0 }}>{prestamo.observaciones ?? "Ninguna"}</dd>
          </dl>
        </div>
      </div>

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
