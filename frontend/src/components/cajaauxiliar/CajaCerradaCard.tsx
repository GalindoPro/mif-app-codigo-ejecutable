import { useState } from "react";
import type { DetalleCajaAuxiliar } from "../../types";
import { formatoQ } from "../../types";
import { mensajeError } from "../../lib/api";
import ActaArqueoModal from "./ActaArqueoModal";

export interface CajaCerradaCardProps {
  agenciaNombre: string;
  detalle: DetalleCajaAuxiliar;
  onVerHistorial: () => void;
  usuarioRol?: string;
  cargando?: boolean;
  onReabrir?: () => Promise<void>;
  onAbrirNuevaFecha?: (saldoInicial?: number, fecha?: string) => Promise<void>;
}

export default function CajaCerradaCard({
  agenciaNombre,
  detalle,
  onVerHistorial,
  usuarioRol,
  cargando = false,
  onReabrir,
  onAbrirNuevaFecha,
}: CajaCerradaCardProps) {
  const [mostrarActa, setMostrarActa] = useState(false);
  const [mostrarReabrirModal, setMostrarReabrirModal] = useState(false);
  const [mostrarNuevaFechaModal, setMostrarNuevaFechaModal] = useState(false);
  const [nuevaFecha, setNuevaFecha] = useState(() => {
    try {
      const d = new Date(detalle.dia.fecha);
      d.setDate(d.getDate() + 1);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${y}-${m}-${day}`;
    } catch {
      return new Date().toISOString().slice(0, 10);
    }
  });
  const [ajustarSaldo, setAjustarSaldo] = useState(false);
  const [saldoManual, setSaldoManual] = useState("");
  const [errorLocal, setErrorLocal] = useState<string | null>(null);

  const diferencia = Number(detalle.arqueo?.diferencia ?? 0);
  const totalContado = Number(detalle.arqueo?.total_contado ?? (detalle.dia.saldo_final ?? detalle.saldoActual));
  const puedeReabrir = ["ADMIN", "GERENCIA", "SUPERVISOR"].includes(usuarioRol ?? "");

  const fechaLegible = (() => {
    try {
      return new Date(detalle.dia.fecha).toLocaleDateString("es-GT", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return detalle.dia.fecha;
    }
  })();

  const nuevaFechaLegible = (() => {
    if (!nuevaFecha) return "";
    try {
      const [y, m, d] = nuevaFecha.split("-").map(Number);
      return new Date(y, m - 1, d).toLocaleDateString("es-GT", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return nuevaFecha;
    }
  })();

  async function handleConfirmarReabrir() {
    if (!onReabrir) return;
    setErrorLocal(null);
    try {
      await onReabrir();
      setMostrarReabrirModal(false);
    } catch (err: unknown) {
      setErrorLocal(mensajeError(err));
    }
  }

  async function handleConfirmarNuevaFecha() {
    if (!onAbrirNuevaFecha || !nuevaFecha) return;
    setErrorLocal(null);
    try {
      await onAbrirNuevaFecha(
        ajustarSaldo && saldoManual ? Number(saldoManual) : undefined,
        nuevaFecha
      );
      setMostrarNuevaFechaModal(false);
    } catch (err: unknown) {
      setErrorLocal(mensajeError(err));
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0, gap: "0.5rem" }}>
      {/* BARRA DE ESTADO DE CIERRE */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "0.5rem",
          padding: "0.45rem 0.75rem",
          background: "var(--paper-raised)",
          border: "1px solid var(--line)",
          borderRadius: "8px",
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", flexWrap: "wrap" }}>
          <span
            style={{
              fontSize: "0.74rem",
              fontWeight: 700,
              padding: "0.2rem 0.6rem",
              borderRadius: "4px",
              background: "rgba(100, 116, 139, 0.2)",
              color: "#94a3b8",
              border: "1px solid rgba(148, 163, 184, 0.3)",
              display: "flex",
              alignItems: "center",
              gap: "0.3rem",
            }}
          >
            <span>🔒</span> Turno Finalizado
          </span>
          <span style={{ fontWeight: 600, fontSize: "0.86rem", color: "var(--ink)" }}>
            {agenciaNombre}
          </span>
          <span style={{ fontSize: "0.78rem", color: "var(--ink-soft)" }}>
            · {fechaLegible}
          </span>
        </div>

        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
          <button
            type="button"
            className="btn"
            style={{
              background: "#0f766e",
              borderColor: "#0f766e",
              padding: "0.3rem 0.75rem",
              fontSize: "0.8rem",
              display: "flex",
              alignItems: "center",
              gap: "0.35rem",
            }}
            onClick={() => setMostrarActa(true)}
          >
            <span>🖨️</span> Imprimir Acta Oficial
          </button>

          {onAbrirNuevaFecha && (
            <button
              type="button"
              className="btn primary"
              style={{
                padding: "0.3rem 0.75rem",
                fontSize: "0.8rem",
                display: "flex",
                alignItems: "center",
                gap: "0.35rem",
              }}
              onClick={() => {
                setErrorLocal(null);
                setMostrarNuevaFechaModal(true);
              }}
            >
              <span>➕</span> Abrir Siguiente Día / Nueva Fecha
            </button>
          )}

          {puedeReabrir && onReabrir && (
            <button
              type="button"
              className="btn secondary"
              style={{
                padding: "0.3rem 0.75rem",
                fontSize: "0.8rem",
                display: "flex",
                alignItems: "center",
                gap: "0.35rem",
                borderColor: "rgba(234, 179, 8, 0.5)",
                color: "#eab308",
              }}
              onClick={() => {
                setErrorLocal(null);
                setMostrarReabrirModal(true);
              }}
            >
              <span>🔓</span> Reabrir Turno
            </button>
          )}
        </div>
      </div>

      {errorLocal && (
        <div className="alert error" style={{ margin: "0.2rem 0", padding: "0.4rem 0.75rem", fontSize: "0.82rem" }}>
          {errorLocal}
        </div>
      )}

      {/* 6 KPIS HORIZONTALES SIN TRUNCAMIENTO */}
      <div className="screen-kpis" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))" }}>
        <div className="screen-kpi-tile">
          <span className="screen-kpi-label">SALDO INICIAL</span>
          <span className="screen-kpi-value" style={{ fontSize: "1.05rem" }}>
            {formatoQ(detalle.dia.saldo_inicial)}
          </span>
          <span className="screen-kpi-sub">Apertura del turno</span>
        </div>
        <div className="screen-kpi-tile">
          <span className="screen-kpi-label">TOTAL INGRESOS</span>
          <span className="screen-kpi-value" style={{ color: "#059669", fontSize: "1.05rem" }}>
            {formatoQ(detalle.totalIngreso)}
          </span>
          <span className="screen-kpi-sub">Cobros y depósitos</span>
        </div>
        <div className="screen-kpi-tile">
          <span className="screen-kpi-label">TOTAL EGRESOS</span>
          <span className="screen-kpi-value" style={{ color: "#d97706", fontSize: "1.05rem" }}>
            {formatoQ(detalle.totalEgreso)}
          </span>
          <span className="screen-kpi-sub">Desembolsos y retiros</span>
        </div>
        <div className="screen-kpi-tile accent">
          <span className="screen-kpi-label">SALDO SEGÚN LIBRO</span>
          <span className="screen-kpi-value" style={{ fontSize: "1.05rem" }}>
            {formatoQ(detalle.dia.saldo_final ?? detalle.saldoActual)}
          </span>
          <span className="screen-kpi-sub">Libro de caja auxiliar</span>
        </div>
        <div className="screen-kpi-tile">
          <span className="screen-kpi-label">EFECTIVO CONTADO</span>
          <span className="screen-kpi-value" style={{ fontSize: "1.05rem" }}>
            {formatoQ(totalContado)}
          </span>
          <span className="screen-kpi-sub">Arqueo físico</span>
        </div>
        <div
          className="screen-kpi-tile"
          style={{
            borderLeft: diferencia === 0 ? "3px solid #16a34a" : "3px solid #dc2626",
          }}
        >
          <span className="screen-kpi-label">DIFERENCIA ARQUEO</span>
          <span
            className="screen-kpi-value"
            style={{
              color: diferencia === 0 ? "#16a34a" : "#dc2626",
              fontSize: "1.05rem",
            }}
          >
            {diferencia === 0
              ? "Cuadrada (Q 0.00)"
              : diferencia > 0
              ? `Sobrante ${formatoQ(diferencia)}`
              : `Faltante ${formatoQ(Math.abs(diferencia))}`}
          </span>
          <span className="screen-kpi-sub">
            {diferencia === 0 ? "Sin descuadre" : "Auditoría requerida"}
          </span>
        </div>
      </div>

      {/* TABLA DE MOVIMIENTOS CON SCROLL INTERNO Y CABECERA PEGAJOSA */}
      <div className="table-scroll-container">
        <table className="table-compact">
          <thead>
            <tr>
              <th style={{ minWidth: 65 }}>HORA</th>
              <th style={{ minWidth: 160 }}>DESCRIPCIÓN</th>
              <th style={{ minWidth: 110 }}>REFERENCIA</th>
              <th style={{ minWidth: 160 }}>BENEFICIARIO / SOCIO</th>
              <th style={{ minWidth: 80 }}>DOC.</th>
              <th style={{ minWidth: 95, textAlign: "right" }}>INGRESO</th>
              <th style={{ minWidth: 95, textAlign: "right" }}>EGRESO</th>
              <th style={{ minWidth: 100, textAlign: "right" }}>SALDO</th>
              <th style={{ minWidth: 100 }}>USUARIO</th>
            </tr>
          </thead>
          <tbody>
            {detalle.movimientos.map((m) => (
              <tr key={m.id}>
                <td className="mono" style={{ fontSize: "0.78rem" }}>
                  {new Date(m.created_at).toLocaleTimeString("es-GT", { hour: "2-digit", minute: "2-digit" })}
                </td>
                <td style={{ fontWeight: 600, fontSize: "0.8rem" }}>{m.descripcion}</td>
                <td className="mono" style={{ fontSize: "0.78rem", color: "var(--accent)" }}>{m.referencia ?? "—"}</td>
                <td style={{ fontSize: "0.8rem" }}>{m.beneficiario || "—"}</td>
                <td className="mono" style={{ fontSize: "0.78rem" }}>{m.doc_no ?? "—"}</td>
                <td className="mono" style={{ color: "#059669", fontWeight: 700, textAlign: "right", fontSize: "0.8rem" }}>
                  {m.tipo === "INGRESO" ? formatoQ(m.monto) : ""}
                </td>
                <td className="mono" style={{ color: "#d97706", fontWeight: 700, textAlign: "right", fontSize: "0.8rem" }}>
                  {m.tipo === "EGRESO" ? formatoQ(m.monto) : ""}
                </td>
                <td className="mono" style={{ fontWeight: 700, textAlign: "right", fontSize: "0.8rem" }}>
                  {formatoQ(m.saldo_acumulado)}
                </td>
                <td style={{ fontSize: "0.76rem", color: "var(--ink-soft)" }}>{m.usuario_nombre}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {detalle.movimientos.length === 0 && (
          <div className="empty" style={{ padding: "2rem", textAlign: "center", color: "var(--ink-soft)" }}>
            No se registraron movimientos en este turno.
          </div>
        )}
      </div>

      {/* FOOTER FIJO */}
      <div className="screen-footer">
        <span style={{ fontSize: "0.8rem", color: "var(--ink-soft)" }}>
          Registro de auditoría · Mostrando los {detalle.movimientos.length} movimientos del turno cerrado
        </span>
        <button
          type="button"
          className="btn secondary"
          onClick={onVerHistorial}
          style={{ padding: "0.22rem 0.65rem", fontSize: "0.78rem" }}
        >
          📅 Ver otras fechas en Historial
        </button>
      </div>

      {mostrarActa && (
        <ActaArqueoModal
          agenciaNombre={agenciaNombre}
          detalle={detalle}
          onCerrar={() => setMostrarActa(false)}
        />
      )}

      {/* MODAL DE CONFIRMACIÓN DE REAPERTURA */}
      {mostrarReabrirModal && (
        <div className="modal-overlay">
          <div
            className="modal-card"
            style={{
              maxWidth: 480,
              background: "#0f172a",
              border: "1px solid rgba(148, 163, 184, 0.25)",
              color: "#f8fafc",
              padding: "1.5rem",
              borderRadius: "14px",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.75)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.65rem", marginBottom: "0.85rem" }}>
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: "8px",
                  background: "rgba(234, 179, 8, 0.18)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "1.2rem",
                  border: "1px solid rgba(234, 179, 8, 0.35)",
                }}
              >
                🔓
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: "1.15rem", color: "#f8fafc" }}>Confirmar Reapertura de Caja</h2>
                <span style={{ fontSize: "0.78rem", color: "#94a3b8" }}>{agenciaNombre}</span>
              </div>
            </div>

            <p style={{ fontSize: "0.86rem", color: "#cbd5e1", lineHeight: 1.5, margin: "0.5rem 0" }}>
              ¿Estás seguro de reabrir la caja del <strong>{fechaLegible}</strong>?
            </p>

            <div
              style={{
                background: "rgba(234, 179, 8, 0.1)",
                border: "1px solid rgba(234, 179, 8, 0.3)",
                borderRadius: "8px",
                padding: "0.75rem 0.9rem",
                fontSize: "0.8rem",
                color: "#fef08a",
                margin: "0.75rem 0",
                lineHeight: 1.45,
              }}
            >
              ⚠️ <strong>Aviso de Auditoría:</strong> El acta de arqueo físico firmada anteriormente quedará anulada para permitir el registro o rectificación de operaciones. Al finalizar la jornada deberás volver a realizar el arqueo físico y generar el acta correspondiente.
            </div>

            {errorLocal && (
              <div className="alert error" style={{ margin: "0.5rem 0", padding: "0.4rem 0.75rem", fontSize: "0.82rem" }}>
                {errorLocal}
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.6rem", marginTop: "1.25rem" }}>
              <button
                type="button"
                className="btn secondary"
                disabled={cargando}
                onClick={() => setMostrarReabrirModal(false)}
                style={{
                  background: "transparent",
                  borderColor: "rgba(148, 163, 184, 0.3)",
                  color: "#cbd5e1",
                  padding: "0.4rem 0.9rem",
                }}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn primary"
                disabled={cargando}
                style={{
                  background: "#d97706",
                  borderColor: "#d97706",
                  color: "#ffffff",
                  fontWeight: 600,
                  padding: "0.4rem 1rem",
                }}
                onClick={handleConfirmarReabrir}
              >
                {cargando ? "Reabriendo…" : "Sí, Reabrir Turno"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE APERTURA DE NUEVA FECHA */}
      {mostrarNuevaFechaModal && (
        <div className="modal-overlay">
          <div
            className="modal-card"
            style={{
              maxWidth: 500,
              background: "#0f172a",
              border: "1px solid rgba(148, 163, 184, 0.25)",
              color: "#f8fafc",
              padding: "1.5rem",
              borderRadius: "14px",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.75)",
            }}
          >
            {/* CABECERA INSTITUCIONAL */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.65rem", marginBottom: "0.85rem" }}>
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: "8px",
                  background: "rgba(5, 150, 105, 0.18)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "1.25rem",
                  border: "1px solid rgba(5, 150, 105, 0.35)",
                }}
              >
                ➕
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: "1.15rem", color: "#f8fafc", fontWeight: 700 }}>
                  Apertura de Caja para Nueva Fecha
                </h2>
                <span style={{ fontSize: "0.78rem", color: "#94a3b8" }}>
                  COOP COMIF R.L. · {agenciaNombre}
                </span>
              </div>
            </div>

            <div style={{ margin: "1rem 0", display: "flex", flexDirection: "column", gap: "0.9rem" }}>
              {/* SELECTOR DE FECHA */}
              <div className="field">
                <label htmlFor="modal-fecha-nueva" style={{ fontWeight: 600, fontSize: "0.82rem", color: "#e2e8f0" }}>
                  📅 Fecha de Operación a Abrir
                </label>
                <input
                  id="modal-fecha-nueva"
                  type="date"
                  value={nuevaFecha}
                  onChange={(e) => setNuevaFecha(e.target.value)}
                  style={{
                    padding: "0.5rem 0.75rem",
                    borderRadius: "6px",
                    border: "1px solid #334155",
                    background: "#1e293b",
                    color: "#f8fafc",
                    fontSize: "0.9rem",
                    fontFamily: "inherit",
                    width: "100%",
                    boxSizing: "border-box",
                  }}
                />
                <small style={{ color: "#10b981", textTransform: "capitalize", marginTop: "0.3rem", fontWeight: 500, display: "block" }}>
                  ✓ {nuevaFechaLegible}
                </small>
              </div>

              {/* CARD DE ARRASTRE DE SALDO */}
              <div
                style={{
                  padding: "0.85rem 1rem",
                  borderRadius: "8px",
                  background: "linear-gradient(135deg, rgba(191, 153, 3, 0.12), rgba(5, 150, 105, 0.1))",
                  border: "1px solid rgba(191, 153, 3, 0.35)",
                }}
              >
                <span style={{ fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.05em", color: "#cbd5e1", display: "block" }}>
                  SALDO INICIAL ARRASTRADO DEL ÚLTIMO CIERRE
                </span>
                <span
                  className="mono"
                  style={{
                    fontSize: "1.4rem",
                    fontWeight: 700,
                    color: "#f59e0b",
                    display: "block",
                    margin: "0.2rem 0",
                  }}
                >
                  {formatoQ(detalle.dia.saldo_final ?? detalle.saldoActual)}
                </span>
                <span style={{ fontSize: "0.74rem", color: "#94a3b8" }}>
                  Continuidad inmutable de saldos desde el {fechaLegible}
                </span>
              </div>

              {/* AJUSTE MANUAL */}
              <div>
                <label style={{ display: "flex", alignItems: "center", gap: "0.45rem", fontSize: "0.8rem", cursor: "pointer", color: "#cbd5e1" }}>
                  <input
                    type="checkbox"
                    checked={ajustarSaldo}
                    onChange={(e) => {
                      setAjustarSaldo(e.target.checked);
                      if (!e.target.checked) setSaldoManual("");
                    }}
                  />
                  <span>Ajustar saldo inicial manualmente (Excepción autorizada)</span>
                </label>

                {ajustarSaldo && (
                  <div className="field" style={{ marginTop: "0.5rem" }}>
                    <label htmlFor="modal-saldo-manual" style={{ fontSize: "0.78rem", color: "#94a3b8" }}>
                      Nuevo saldo inicial en efectivo (Q)
                    </label>
                    <input
                      id="modal-saldo-manual"
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder={Number(detalle.dia.saldo_final ?? detalle.saldoActual).toString()}
                      value={saldoManual}
                      onChange={(e) => setSaldoManual(e.target.value)}
                      style={{
                        padding: "0.45rem 0.65rem",
                        borderRadius: "6px",
                        border: "1px solid #334155",
                        background: "#1e293b",
                        color: "#f8fafc",
                        fontSize: "0.88rem",
                        width: "100%",
                        boxSizing: "border-box",
                      }}
                    />
                  </div>
                )}
              </div>
            </div>

            {errorLocal && (
              <div className="alert error" style={{ margin: "0.5rem 0", padding: "0.4rem 0.75rem", fontSize: "0.82rem" }}>
                {errorLocal}
              </div>
            )}

            {/* BOTONES DE ACCIÓN */}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.6rem", marginTop: "1.25rem" }}>
              <button
                type="button"
                className="btn secondary"
                disabled={cargando}
                onClick={() => setMostrarNuevaFechaModal(false)}
                style={{
                  background: "transparent",
                  borderColor: "rgba(148, 163, 184, 0.3)",
                  color: "#cbd5e1",
                  padding: "0.45rem 0.95rem",
                }}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn primary"
                disabled={cargando || !nuevaFecha || (ajustarSaldo && !saldoManual)}
                onClick={handleConfirmarNuevaFecha}
                style={{
                  background: "#059669",
                  borderColor: "#059669",
                  color: "#ffffff",
                  fontWeight: 600,
                  padding: "0.45rem 1.1rem",
                }}
              >
                {cargando ? "Abriendo caja…" : `Abrir Caja (${nuevaFecha})`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
