import { useMemo, useState } from "react";
import type {
  DetalleCajaAuxiliar,
  OrigenFondos,
} from "../../types";
import {
  formatoQ,
  ORIGEN_FONDOS_BADGE_STYLE,
  ORIGEN_FONDOS_SHORT_LABEL,
} from "../../types";
import PanelNovedadesCampo from "./PanelNovedadesCampo";
import NuevoMovimientoForm from "./NuevoMovimientoForm";
import CobroCreditoVentanilla from "./CobroCreditoVentanilla";
import DesembolsoCreditoForm from "./DesembolsoCreditoForm";
import LiquidarPlazoFijoForm from "./LiquidarPlazoFijoForm";
import CierreCajaForm from "./CierreCajaForm";

export interface CajaAbiertaProps {
  agenciaId: string;
  detalle: DetalleCajaAuxiliar;
  onRecargar: () => void;
  onCerrada: () => void;
}

export default function CajaAbierta({
  agenciaId,
  detalle,
  onRecargar,
  onCerrada,
}: CajaAbiertaProps) {
  const [mostrarForm, setMostrarForm] = useState(false);
  const [mostrarCobroCredito, setMostrarCobroCredito] = useState(false);
  const [mostrarDesembolso, setMostrarDesembolso] = useState(false);
  const [mostrarLiquidarPF, setMostrarLiquidarPF] = useState(false);
  const [mostrarCierre, setMostrarCierre] = useState(false);

  const resumenFondos = useMemo(() => {
    const r: Record<
      OrigenFondos,
      { cobros: number; colocacion: number; countCobros: number; countColocacion: number }
    > = {
      FONDOS_PROPIOS: { cobros: 0, colocacion: 0, countCobros: 0, countColocacion: 0 },
      FEDERURAL: { cobros: 0, colocacion: 0, countCobros: 0, countColocacion: 0 },
      CHN_GUATEMALA: { cobros: 0, colocacion: 0, countCobros: 0, countColocacion: 0 },
    };

    detalle.movimientos.forEach((m) => {
      let origen: OrigenFondos | null = (m.origen_fondos as OrigenFondos) || null;
      if (!origen) {
        if (
          m.categoria === "COLOCACION_PRESTAMO" ||
          (m.referencia && m.referencia.includes("CUOTA"))
        ) {
          origen = "FONDOS_PROPIOS";
        }
      }
      if (!origen || !r[origen]) return;

      if (m.tipo === "INGRESO") {
        r[origen].cobros += Number(m.monto);
        r[origen].countCobros += 1;
      } else if (m.tipo === "EGRESO") {
        r[origen].colocacion += Number(m.monto);
        r[origen].countColocacion += 1;
      }
    });

    return r;
  }, [detalle.movimientos]);

  const tieneMovimientosCredito =
    resumenFondos.FONDOS_PROPIOS.countCobros > 0 ||
    resumenFondos.FONDOS_PROPIOS.countColocacion > 0 ||
    resumenFondos.FEDERURAL.countCobros > 0 ||
    resumenFondos.FEDERURAL.countColocacion > 0 ||
    resumenFondos.CHN_GUATEMALA.countCobros > 0 ||
    resumenFondos.CHN_GUATEMALA.countColocacion > 0;

  return (
    <div>
      <div className="stat-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(170px, 210px))" }}>
        <div className="stat-card">
          <span className="label">Saldo inicial</span>
          <span className="value">{formatoQ(detalle.dia.saldo_inicial)}</span>
        </div>
        <div className="stat-card">
          <span className="label">Total ingresos</span>
          <span className="value">{formatoQ(detalle.totalIngreso)}</span>
        </div>
        <div className="stat-card">
          <span className="label">Total egresos</span>
          <span className="value">{formatoQ(detalle.totalEgreso)}</span>
        </div>
        <div className="stat-card accent">
          <span className="label">Saldo actual</span>
          <span className="value">{formatoQ(detalle.saldoActual)}</span>
        </div>
      </div>

      {/* CONSOLIDADO DE FONDOS INSTITUCIONALES (FONDOS PROPIOS, FEDERURAL, CHN) */}
      <div
        className="card"
        style={{
          background: "var(--paper-raised)",
          border: "1px solid var(--line)",
          borderRadius: "10px",
          padding: "0.85rem 1rem",
          marginBottom: "1.25rem",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.6rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.45rem" }}>
            <span style={{ fontSize: "1.1rem" }}>🏛️</span>
            <span style={{ fontWeight: 700, fontSize: "0.9rem", color: "var(--ink)" }}>
              Consolidado de Cartera por Fuente de Fondos (Hoy)
            </span>
          </div>
          <span style={{ fontSize: "0.75rem", color: "var(--ink-soft)" }}>
            {tieneMovimientosCredito ? "Movimientos registrados hoy" : "Sin colocación/cobro aún"}
          </span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "0.65rem" }}>
          {(
            [
              { id: "FONDOS_PROPIOS", icon: "🏦", label: "Fondos Propios (MIF)", data: resumenFondos.FONDOS_PROPIOS, color: "#059669" },
              { id: "FEDERURAL", icon: "🌾", label: "FEDERURAL", data: resumenFondos.FEDERURAL, color: "#d97706" },
              { id: "CHN_GUATEMALA", icon: "🏛️", label: "CHN-GUATEMALA", data: resumenFondos.CHN_GUATEMALA, color: "#2563eb" },
            ] as const
          ).map((f) => {
            const neto = f.data.cobros - f.data.colocacion;
            return (
              <div
                key={f.id}
                style={{
                  background: "var(--paper)",
                  border: "1px solid var(--line)",
                  borderRadius: "8px",
                  padding: "0.65rem 0.8rem",
                  fontSize: "0.82rem",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.35rem" }}>
                  <span style={{ fontWeight: 700, color: f.color, display: "flex", alignItems: "center", gap: "0.3rem" }}>
                    <span>{f.icon}</span> {f.label}
                  </span>
                  <span
                    style={{
                      fontSize: "0.68rem",
                      fontWeight: 700,
                      padding: "0.1rem 0.35rem",
                      borderRadius: "4px",
                      ...ORIGEN_FONDOS_BADGE_STYLE[f.id],
                    }}
                  >
                    {f.data.countCobros + f.data.countColocacion} ops
                  </span>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.3rem", fontSize: "0.76rem" }}>
                  <div>
                    <span style={{ color: "var(--ink-soft)", display: "block" }}>Cobrado:</span>
                    <strong style={{ color: "#059669" }} className="mono">{formatoQ(f.data.cobros)}</strong>
                  </div>
                  <div>
                    <span style={{ color: "var(--ink-soft)", display: "block" }}>Colocado:</span>
                    <strong style={{ color: "#2563eb" }} className="mono">{formatoQ(f.data.colocacion)}</strong>
                  </div>
                </div>

                <div style={{ marginTop: "0.4rem", paddingTop: "0.3rem", borderTop: "1px dashed var(--line)", fontSize: "0.74rem", display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--ink-soft)" }}>Flujo Neto:</span>
                  <strong className="mono" style={{ color: neto >= 0 ? "#059669" : "#dc2626" }}>
                    {formatoQ(neto)}
                  </strong>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <PanelNovedadesCampo
        agenciaId={agenciaId}
        onSeleccionarCuenta={() => {
          setMostrarForm(true);
          setMostrarCobroCredito(false);
          setMostrarDesembolso(false);
          setMostrarLiquidarPF(false);
          setMostrarCierre(false);
        }}
      />

      <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
        <button
          className="btn"
          onClick={() => {
            setMostrarForm((v) => !v);
            setMostrarCobroCredito(false);
            setMostrarDesembolso(false);
            setMostrarLiquidarPF(false);
            setMostrarCierre(false);
          }}
        >
          {mostrarForm ? "Cancelar" : "+ Nuevo movimiento"}
        </button>
        <button
          className="btn"
          style={{ background: "#059669", borderColor: "#059669" }}
          onClick={() => {
            setMostrarCobroCredito((v) => !v);
            setMostrarForm(false);
            setMostrarDesembolso(false);
            setMostrarLiquidarPF(false);
            setMostrarCierre(false);
          }}
        >
          {mostrarCobroCredito ? "Cancelar cobro" : "💵 Cobro cuota de crédito"}
        </button>
        <button
          className="btn"
          style={{ background: "#2563eb", borderColor: "#2563eb" }}
          onClick={() => {
            setMostrarDesembolso((v) => !v);
            setMostrarForm(false);
            setMostrarCobroCredito(false);
            setMostrarLiquidarPF(false);
            setMostrarCierre(false);
          }}
        >
          {mostrarDesembolso ? "Cancelar desembolso" : "📤 Desembolso de crédito"}
        </button>
        <button
          className="btn"
          style={{ background: "#7c3aed", borderColor: "#7c3aed" }}
          onClick={() => {
            setMostrarLiquidarPF((v) => !v);
            setMostrarForm(false);
            setMostrarCobroCredito(false);
            setMostrarDesembolso(false);
            setMostrarCierre(false);
          }}
        >
          {mostrarLiquidarPF ? "Cancelar liquidación" : "📦 Liquidar Plazo Fijo"}
        </button>
        <button
          className="btn secondary"
          onClick={() => {
            setMostrarCierre((v) => !v);
            setMostrarForm(false);
            setMostrarCobroCredito(false);
            setMostrarDesembolso(false);
            setMostrarLiquidarPF(false);
          }}
        >
          {mostrarCierre ? "Cancelar cierre" : "Cerrar caja del día"}
        </button>
      </div>

      {mostrarDesembolso && (
        <DesembolsoCreditoForm
          agenciaId={agenciaId}
          diaId={detalle.dia.id}
          saldoCajaActual={detalle.saldoActual}
          onDesembolsado={() => {
            setMostrarDesembolso(false);
            onRecargar();
          }}
        />
      )}

      {mostrarLiquidarPF && (
        <LiquidarPlazoFijoForm
          agenciaId={agenciaId}
          diaId={detalle.dia.id}
          saldoCajaActual={detalle.saldoActual}
          onLiquidado={() => {
            setMostrarLiquidarPF(false);
            onRecargar();
          }}
        />
      )}

      {mostrarForm && (
        <NuevoMovimientoForm
          agenciaId={agenciaId}
          diaId={detalle.dia.id}
          onCreado={() => {
            setMostrarForm(false);
            onRecargar();
          }}
        />
      )}

      {mostrarCobroCredito && (
        <CobroCreditoVentanilla
          agenciaId={agenciaId}
          diaId={detalle.dia.id}
          onCobrado={() => {
            setMostrarCobroCredito(false);
            onRecargar();
          }}
        />
      )}

      {mostrarCierre && (
        <CierreCajaForm
          diaId={detalle.dia.id}
          saldoEsperado={detalle.saldoActual}
          onCerrada={() => {
            setMostrarCierre(false);
            onCerrada();
          }}
        />
      )}

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
                <td className="mono">
                  {new Date(m.created_at).toLocaleTimeString("es-GT", { hour: "2-digit", minute: "2-digit" })}
                </td>
                <td>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem", alignItems: "flex-start" }}>
                    <span>{m.descripcion}</span>
                    {m.origen_fondos && (
                      <span
                        style={{
                          fontSize: "0.68rem",
                          fontWeight: 700,
                          padding: "0.1rem 0.35rem",
                          borderRadius: "4px",
                          width: "fit-content",
                          ...ORIGEN_FONDOS_BADGE_STYLE[m.origen_fondos as OrigenFondos],
                        }}
                      >
                        {ORIGEN_FONDOS_SHORT_LABEL[m.origen_fondos as OrigenFondos]}
                      </span>
                    )}
                  </div>
                </td>
                <td className="mono">{m.referencia ?? "—"}</td>
                <td>{m.beneficiario}</td>
                <td className="mono">{m.doc_no ?? "—"}</td>
                <td className="mono movimiento-monto deposito">{m.tipo === "INGRESO" ? formatoQ(m.monto) : ""}</td>
                <td className="mono movimiento-monto retiro">{m.tipo === "EGRESO" ? formatoQ(m.monto) : ""}</td>
                <td className="mono">{formatoQ(m.saldo_acumulado)}</td>
                <td>{m.usuario_nombre}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {detalle.movimientos.length === 0 && <div className="empty">Todavía no hay movimientos registrados hoy.</div>}
      </div>
    </div>
  );
}
