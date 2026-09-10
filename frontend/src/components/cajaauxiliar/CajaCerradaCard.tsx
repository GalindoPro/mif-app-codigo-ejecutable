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
  const [mostrarMovimientos, setMostrarMovimientos] = useState(false);

  const diferencia = Number(detalle.arqueo?.diferencia ?? 0);
  const totalContado = Number(detalle.arqueo?.total_contado ?? (detalle.dia.saldo_final ?? detalle.saldoActual));

  return (
    <div>
      <div className="card" style={{ borderTop: "4px solid #475569", marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <span className="badge inactivo" style={{ fontWeight: 700, padding: "0.3rem 0.75rem" }}>
                🔒 Caja del Día Cerrada
              </span>
              <span className="sub" style={{ margin: 0, fontWeight: 600 }}>
                {new Date(detalle.dia.fecha).toLocaleDateString("es-GT", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
              </span>
            </div>
            <h2 style={{ margin: "0.75rem 0 0.25rem" }}>{agenciaNombre} · Turno Finalizado</h2>
            <p className="sub" style={{ margin: 0 }}>
              El arqueo de cierre y conteo físico de efectivo fue registrado exitosamente.
            </p>
          </div>

          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
            <button className="btn" style={{ background: "#0f766e", borderColor: "#0f766e" }} onClick={() => setMostrarActa(true)}>
              🖨️ Imprimir Acta Oficial de Arqueo
            </button>
            <button className="btn secondary" onClick={() => setMostrarMovimientos((v) => !v)}>
              {mostrarMovimientos ? "Ocultar movimientos" : `📜 Ver movimientos (${detalle.movimientos.length})`}
            </button>
            <button className="btn secondary" onClick={onVerHistorial}>
              📅 Historial de cajas
            </button>
          </div>
        </div>

        <div className="stat-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", marginTop: "1.25rem" }}>
          <div className="stat-card">
            <span className="label">Saldo inicial</span>
            <span className="value">{formatearQuetzales(detalle.dia.saldo_inicial)}</span>
          </div>
          <div className="stat-card">
            <span className="label">Total ingresos</span>
            <span className="value">{formatearQuetzales(detalle.totalIngreso)}</span>
          </div>
          <div className="stat-card">
            <span className="label">Total egresos</span>
            <span className="value">{formatearQuetzales(detalle.totalEgreso)}</span>
          </div>
          <div className="stat-card accent">
            <span className="label">Saldo final según libro</span>
            <span className="value">{formatearQuetzales(detalle.dia.saldo_final ?? detalle.saldoActual)}</span>
          </div>
          <div className="stat-card">
            <span className="label">Efectivo contado</span>
            <span className="value">{formatearQuetzales(totalContado)}</span>
          </div>
          <div className={`stat-card ${diferencia === 0 ? "" : "danger"}`}>
            <span className="label">Diferencia de Arqueo</span>
            <span className="value" style={{ color: diferencia === 0 ? "#16a34a" : "#dc2626" }}>
              {diferencia === 0 ? "Cuadrada (Q 0.00)" : (diferencia > 0 ? `Sobrante ${formatearQuetzales(diferencia)}` : `Faltante ${formatearQuetzales(Math.abs(diferencia))}`)}
            </span>
          </div>
        </div>
      </div>

      {mostrarMovimientos && (
        <div className="card" style={{ marginBottom: "1.5rem" }}>
          <h3 style={{ marginTop: 0 }}>Movimientos del día cerrado ({detalle.movimientos.length})</h3>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Hora</th>
                  <th>Movimiento</th>
                  <th>Referencia</th>
                  <th>Beneficiario</th>
                  <th>Doc.</th>
                  <th>Ingreso</th>
                  <th>Egreso</th>
                  <th>Saldo</th>
                  <th>Usuario</th>
                </tr>
              </thead>
              <tbody>
                {detalle.movimientos.map((m) => (
                  <tr key={m.id}>
                    <td className="mono">{new Date(m.created_at).toLocaleTimeString("es-GT", { hour: "2-digit", minute: "2-digit" })}</td>
                    <td>{m.descripcion}</td>
                    <td className="mono">{m.referencia ?? "—"}</td>
                    <td>{m.beneficiario}</td>
                    <td className="mono">{m.doc_no ?? "—"}</td>
                    <td className="mono movimiento-monto deposito">{m.tipo === "INGRESO" ? formatearQuetzales(m.monto) : ""}</td>
                    <td className="mono movimiento-monto retiro">{m.tipo === "EGRESO" ? formatearQuetzales(m.monto) : ""}</td>
                    <td className="mono">{formatearQuetzales(m.saldo_acumulado)}</td>
                    <td>{m.usuario_nombre}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

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
