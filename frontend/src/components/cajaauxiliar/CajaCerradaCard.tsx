import { useState } from "react";
import type { DetalleCajaAuxiliar } from "../../types";
import { formatearQuetzales } from "../../lib/formatters";
import ActaArqueoModal from "./ActaArqueoModal";

export interface CajaCerradaCardProps {
  agenciaNombre: string;
  detalle: DetalleCajaAuxiliar;
  onVerHistorial: () => void;
}

export default function CajaCerradaCard({
  agenciaNombre,
  detalle,
  onVerHistorial,
}: CajaCerradaCardProps) {
  const [mostrarActa, setMostrarActa] = useState(false);

  const diferencia = Number(detalle.arqueo?.diferencia ?? 0);
  const totalContado = Number(detalle.arqueo?.total_contado ?? (detalle.dia.saldo_final ?? detalle.saldoActual));

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
            · {new Date(detalle.dia.fecha).toLocaleDateString("es-GT", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </span>
        </div>

        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
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
        </div>
      </div>

      {/* 6 KPIS HORIZONTALES SIN TRUNCAMIENTO */}
      <div className="screen-kpis" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))" }}>
        <div className="screen-kpi-tile">
          <span className="screen-kpi-label">SALDO INICIAL</span>
          <span className="screen-kpi-value" style={{ fontSize: "1.05rem" }}>
            {formatearQuetzales(detalle.dia.saldo_inicial)}
          </span>
          <span className="screen-kpi-sub">Apertura del turno</span>
        </div>
        <div className="screen-kpi-tile">
          <span className="screen-kpi-label">TOTAL INGRESOS</span>
          <span className="screen-kpi-value" style={{ color: "#059669", fontSize: "1.05rem" }}>
            {formatearQuetzales(detalle.totalIngreso)}
          </span>
          <span className="screen-kpi-sub">Cobros y depósitos</span>
        </div>
        <div className="screen-kpi-tile">
          <span className="screen-kpi-label">TOTAL EGRESOS</span>
          <span className="screen-kpi-value" style={{ color: "#d97706", fontSize: "1.05rem" }}>
            {formatearQuetzales(detalle.totalEgreso)}
          </span>
          <span className="screen-kpi-sub">Desembolsos y retiros</span>
        </div>
        <div className="screen-kpi-tile accent">
          <span className="screen-kpi-label">SALDO SEGÚN LIBRO</span>
          <span className="screen-kpi-value" style={{ fontSize: "1.05rem" }}>
            {formatearQuetzales(detalle.dia.saldo_final ?? detalle.saldoActual)}
          </span>
          <span className="screen-kpi-sub">Libro de caja auxiliar</span>
        </div>
        <div className="screen-kpi-tile">
          <span className="screen-kpi-label">EFECTIVO CONTADO</span>
          <span className="screen-kpi-value" style={{ fontSize: "1.05rem" }}>
            {formatearQuetzales(totalContado)}
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
              ? `Sobrante ${formatearQuetzales(diferencia)}`
              : `Faltante ${formatearQuetzales(Math.abs(diferencia))}`}
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
                  {m.tipo === "INGRESO" ? formatearQuetzales(m.monto) : ""}
                </td>
                <td className="mono" style={{ color: "#d97706", fontWeight: 700, textAlign: "right", fontSize: "0.8rem" }}>
                  {m.tipo === "EGRESO" ? formatearQuetzales(m.monto) : ""}
                </td>
                <td className="mono" style={{ fontWeight: 700, textAlign: "right", fontSize: "0.8rem" }}>
                  {formatearQuetzales(m.saldo_acumulado)}
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
    </div>
  );
}
