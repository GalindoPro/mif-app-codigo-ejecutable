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

  const algunFormularioAbierto =
    mostrarForm || mostrarCobroCredito || mostrarDesembolso || mostrarLiquidarPF || mostrarCierre;

  function cerrarTodosFormularios() {
    setMostrarForm(false);
    setMostrarCobroCredito(false);
    setMostrarDesembolso(false);
    setMostrarLiquidarPF(false);
    setMostrarCierre(false);
  }

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
    <div className="screen-split-layout" style={{ gridTemplateColumns: "340px 1fr", height: "100%", minHeight: 0 }}>
      {/* PANEL IZQUIERDO: ACCIONES RÁPIDAS + CONSOLIDADO + NOVEDADES */}
      <div className="screen-panel scrollable" style={{ gap: "0.65rem", padding: "0.65rem" }}>
        {/* BOTONERA DE OPERACIONES DE VENTANILLA */}
        <div style={{ background: "var(--paper)", border: "1px solid var(--line)", borderRadius: "8px", padding: "0.6rem" }}>
          <div style={{ fontSize: "0.74rem", fontWeight: 700, color: "var(--ink-soft)", textTransform: "uppercase", marginBottom: "0.45rem", letterSpacing: "0.03em" }}>
            Operaciones de Ventanilla
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.35rem" }}>
            <button
              type="button"
              className="btn"
              style={{
                background: mostrarCobroCredito ? "#047857" : "#059669",
                borderColor: "#059669",
                padding: "0.35rem 0.5rem",
                fontSize: "0.76rem",
                justifyContent: "center",
              }}
              onClick={() => {
                cerrarTodosFormularios();
                setMostrarCobroCredito(!mostrarCobroCredito);
              }}
            >
              💵 Cobro Cuota
            </button>
            <button
              type="button"
              className="btn"
              style={{
                background: mostrarDesembolso ? "#1d4ed8" : "#2563eb",
                borderColor: "#2563eb",
                padding: "0.35rem 0.5rem",
                fontSize: "0.76rem",
                justifyContent: "center",
              }}
              onClick={() => {
                cerrarTodosFormularios();
                setMostrarDesembolso(!mostrarDesembolso);
              }}
            >
              📤 Desembolso
            </button>
            <button
              type="button"
              className="btn"
              style={{
                background: mostrarLiquidarPF ? "#6d28d9" : "#7c3aed",
                borderColor: "#7c3aed",
                padding: "0.35rem 0.5rem",
                fontSize: "0.76rem",
                justifyContent: "center",
              }}
              onClick={() => {
                cerrarTodosFormularios();
                setMostrarLiquidarPF(!mostrarLiquidarPF);
              }}
            >
              📦 Liquidar PF
            </button>
            <button
              type="button"
              className="btn secondary"
              style={{
                padding: "0.35rem 0.5rem",
                fontSize: "0.76rem",
                justifyContent: "center",
              }}
              onClick={() => {
                cerrarTodosFormularios();
                setMostrarForm(!mostrarForm);
              }}
            >
              + Nuevo Mov.
            </button>
          </div>
          <button
            type="button"
            className="btn secondary"
            style={{
              width: "100%",
              marginTop: "0.4rem",
              padding: "0.35rem 0.5rem",
              fontSize: "0.76rem",
              justifyContent: "center",
              borderColor: "rgba(220, 38, 38, 0.4)",
              color: "#ef4444",
            }}
            onClick={() => {
              cerrarTodosFormularios();
              setMostrarCierre(!mostrarCierre);
            }}
          >
            🔒 Cerrar Caja del Día
          </button>
        </div>

        {/* CONSOLIDADO DE FONDOS INSTITUCIONALES */}
        <div style={{ background: "var(--paper)", border: "1px solid var(--line)", borderRadius: "8px", padding: "0.6rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.4rem" }}>
            <span style={{ fontSize: "0.74rem", fontWeight: 700, color: "var(--ink-soft)", textTransform: "uppercase" }}>
              🏛️ Fuentes de Fondos
            </span>
            <span style={{ fontSize: "0.68rem", color: "var(--ink-soft)" }}>
              {tieneMovimientosCredito ? "Activo hoy" : "Sin movs."}
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
            {(
              [
                { id: "FONDOS_PROPIOS", icon: "🏦", label: "MIF Propios", data: resumenFondos.FONDOS_PROPIOS, color: "#059669" },
                { id: "FEDERURAL", icon: "🌾", label: "FEDERURAL", data: resumenFondos.FEDERURAL, color: "#d97706" },
                { id: "CHN_GUATEMALA", icon: "🏛️", label: "CHN-GUATEMALA", data: resumenFondos.CHN_GUATEMALA, color: "#2563eb" },
              ] as const
            ).map((f) => {
              const neto = f.data.cobros - f.data.colocacion;
              return (
                <div
                  key={f.id}
                  style={{
                    background: "var(--paper-raised)",
                    border: "1px solid var(--line)",
                    borderRadius: "6px",
                    padding: "0.4rem 0.55rem",
                    fontSize: "0.76rem",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.2rem" }}>
                    <span style={{ fontWeight: 700, color: f.color }}>
                      {f.icon} {f.label}
                    </span>
                    <span style={{ fontSize: "0.66rem", fontWeight: 700, padding: "0.05rem 0.3rem", borderRadius: "3px", ...ORIGEN_FONDOS_BADGE_STYLE[f.id] }}>
                      {f.data.countCobros + f.data.countColocacion} ops
                    </span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.72rem" }}>
                    <span>Cob: <strong style={{ color: "#059669" }}>{formatoQ(f.data.cobros)}</strong></span>
                    <span>Col: <strong style={{ color: "#2563eb" }}>{formatoQ(f.data.colocacion)}</strong></span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.7rem", marginTop: "0.15rem", borderTop: "1px dashed var(--line)", paddingTop: "0.15rem" }}>
                    <span style={{ color: "var(--ink-soft)" }}>Neto:</span>
                    <strong style={{ color: neto >= 0 ? "#059669" : "#dc2626" }}>{formatoQ(neto)}</strong>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* PANEL DE NOVEDADES DE CAMPO */}
        <PanelNovedadesCampo
          agenciaId={agenciaId}
          onSeleccionarCuenta={() => {
            cerrarTodosFormularios();
            setMostrarForm(true);
          }}
        />
      </div>

      {/* PANEL DERECHO: 4 KPIS + FORMULARIO ACTIVO O TABLA DE MOVIMIENTOS */}
      <div className="screen-panel" style={{ padding: "0.65rem", gap: "0.5rem", minHeight: 0 }}>
        {/* 4 KPIS HORIZONTALES */}
        <div className="screen-kpis" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
          <div className="screen-kpi-tile">
            <span className="screen-kpi-label">SALDO INICIAL</span>
            <span className="screen-kpi-value" style={{ fontSize: "1.05rem" }}>{formatoQ(detalle.dia.saldo_inicial)}</span>
            <span className="screen-kpi-sub">Apertura</span>
          </div>
          <div className="screen-kpi-tile">
            <span className="screen-kpi-label">TOTAL INGRESOS</span>
            <span className="screen-kpi-value" style={{ color: "#059669", fontSize: "1.05rem" }}>{formatoQ(detalle.totalIngreso)}</span>
            <span className="screen-kpi-sub">Cobros</span>
          </div>
          <div className="screen-kpi-tile">
            <span className="screen-kpi-label">TOTAL EGRESOS</span>
            <span className="screen-kpi-value" style={{ color: "#d97706", fontSize: "1.05rem" }}>{formatoQ(detalle.totalEgreso)}</span>
            <span className="screen-kpi-sub">Colocación</span>
          </div>
          <div className="screen-kpi-tile accent">
            <span className="screen-kpi-label">SALDO ACTUAL</span>
            <span className="screen-kpi-value" style={{ fontSize: "1.05rem" }}>{formatoQ(detalle.saldoActual)}</span>
            <span className="screen-kpi-sub">En caja hoy</span>
          </div>
        </div>

        {/* SI HAY UN FORMULARIO ABIERTO, SE MUESTRA EN LUGAR DE LA TABLA O SOBRE ELLA */}
        {algunFormularioAbierto ? (
          <div style={{ flex: 1, overflowY: "auto", background: "var(--paper)", border: "1px solid var(--line)", borderRadius: "8px", padding: "0.85rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem", borderBottom: "1px solid var(--line)", paddingBottom: "0.5rem" }}>
              <span style={{ fontWeight: 700, fontSize: "0.9rem" }}>
                {mostrarCobroCredito && "💵 Cobro de Cuota de Crédito en Ventanilla"}
                {mostrarDesembolso && "📤 Desembolso de Crédito"}
                {mostrarLiquidarPF && "📦 Liquidación de Certificado de Plazo Fijo"}
                {mostrarForm && "📝 Registro de Nuevo Movimiento Manual"}
                {mostrarCierre && "🔒 Arqueo Físico y Cierre de Caja del Día"}
              </span>
              <button
                type="button"
                className="btn secondary"
                onClick={cerrarTodosFormularios}
                style={{ padding: "0.2rem 0.5rem", fontSize: "0.75rem" }}
              >
                ✕ Cancelar / Volver a Movimientos
              </button>
            </div>

            {mostrarDesembolso && (
              <DesembolsoCreditoForm
                agenciaId={agenciaId}
                diaId={detalle.dia.id}
                saldoCajaActual={detalle.saldoActual}
                onDesembolsado={() => {
                  cerrarTodosFormularios();
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
                  cerrarTodosFormularios();
                  onRecargar();
                }}
              />
            )}

            {mostrarForm && (
              <NuevoMovimientoForm
                agenciaId={agenciaId}
                diaId={detalle.dia.id}
                onCreado={() => {
                  cerrarTodosFormularios();
                  onRecargar();
                }}
              />
            )}

            {mostrarCobroCredito && (
              <CobroCreditoVentanilla
                agenciaId={agenciaId}
                diaId={detalle.dia.id}
                onCobrado={() => {
                  cerrarTodosFormularios();
                  onRecargar();
                }}
              />
            )}

            {mostrarCierre && (
              <CierreCajaForm
                diaId={detalle.dia.id}
                saldoEsperado={detalle.saldoActual}
                onCerrada={() => {
                  cerrarTodosFormularios();
                  onCerrada();
                }}
              />
            )}
          </div>
        ) : (
          /* TABLA CON SCROLL INTERNO Y CABECERA PEGAJOSA */
          <div className="table-scroll-container">
            <table className="table-compact">
              <thead>
                <tr>
                  <th style={{ minWidth: 60 }}>HORA</th>
                  <th style={{ minWidth: 160 }}>MOVIMIENTO</th>
                  <th style={{ minWidth: 100 }}>REFERENCIA</th>
                  <th style={{ minWidth: 150 }}>BENEFICIARIO</th>
                  <th style={{ minWidth: 70 }}>DOC.</th>
                  <th style={{ minWidth: 85, textAlign: "right" }}>INGRESO</th>
                  <th style={{ minWidth: 85, textAlign: "right" }}>EGRESO</th>
                  <th style={{ minWidth: 95, textAlign: "right" }}>SALDO</th>
                  <th style={{ minWidth: 90 }}>USUARIO</th>
                </tr>
              </thead>
              <tbody>
                {detalle.movimientos.map((m) => (
                  <tr key={m.id}>
                    <td className="mono" style={{ fontSize: "0.76rem" }}>
                      {new Date(m.created_at).toLocaleTimeString("es-GT", { hour: "2-digit", minute: "2-digit" })}
                    </td>
                    <td>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.15rem", alignItems: "flex-start" }}>
                        <span style={{ fontSize: "0.8rem", fontWeight: 600 }}>{m.descripcion}</span>
                        {m.origen_fondos && (
                          <span
                            style={{
                              fontSize: "0.64rem",
                              fontWeight: 700,
                              padding: "0.06rem 0.28rem",
                              borderRadius: "3px",
                              width: "fit-content",
                              ...ORIGEN_FONDOS_BADGE_STYLE[m.origen_fondos as OrigenFondos],
                            }}
                          >
                            {ORIGEN_FONDOS_SHORT_LABEL[m.origen_fondos as OrigenFondos]}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="mono" style={{ fontSize: "0.76rem", color: "var(--accent)" }}>{m.referencia ?? "—"}</td>
                    <td style={{ fontSize: "0.78rem" }}>{m.beneficiario}</td>
                    <td className="mono" style={{ fontSize: "0.76rem" }}>{m.doc_no ?? "—"}</td>
                    <td className="mono" style={{ color: "#059669", fontWeight: 700, textAlign: "right", fontSize: "0.8rem" }}>
                      {m.tipo === "INGRESO" ? formatoQ(m.monto) : ""}
                    </td>
                    <td className="mono" style={{ color: "#d97706", fontWeight: 700, textAlign: "right", fontSize: "0.8rem" }}>
                      {m.tipo === "EGRESO" ? formatoQ(m.monto) : ""}
                    </td>
                    <td className="mono" style={{ fontWeight: 700, textAlign: "right", fontSize: "0.8rem" }}>{formatoQ(m.saldo_acumulado)}</td>
                    <td style={{ fontSize: "0.74rem", color: "var(--ink-soft)" }}>{m.usuario_nombre}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {detalle.movimientos.length === 0 && (
              <div className="empty" style={{ padding: "2rem", textAlign: "center", color: "var(--ink-soft)" }}>
                Todavía no hay movimientos registrados hoy.
              </div>
            )}
          </div>
        )}

        {/* FOOTER FIJO */}
        <div className="screen-footer">
          <span style={{ fontSize: "0.78rem", color: "var(--ink-soft)" }}>
            Turno activo · {detalle.movimientos.length} movimiento(s) registrado(s) hoy
          </span>
          <span className="badge activo" style={{ fontSize: "0.72rem", padding: "0.12rem 0.45rem" }}>
            🟢 En línea
          </span>
        </div>
      </div>
    </div>
  );
}
