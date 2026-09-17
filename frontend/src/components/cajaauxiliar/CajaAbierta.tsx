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
import LiquidacionesCampo from "./LiquidacionesCampo";
import NuevoMovimientoForm from "./NuevoMovimientoForm";
import CobroCreditoVentanilla from "./CobroCreditoVentanilla";
import DesembolsoCreditoForm from "./DesembolsoCreditoForm";
import LiquidarPlazoFijoForm from "./LiquidarPlazoFijoForm";
import CierreCajaForm from "./CierreCajaForm";
import AuxiliarCajaEditModal from "./AuxiliarCajaEditModal";
import ReciboMovimientoModal from "./ReciboMovimientoModal";
import LibroCajaReporteModal from "./LibroCajaReporteModal";
import type { CajaMovimientoAuxiliar } from "../../types";
import { useAuth } from "../../context/AuthContext";

function renderRolBadge(rol?: string) {
  if (!rol) return null;
  switch (rol) {
    case "CAJA_CHICA":
      return (
        <span style={{ fontSize: "0.68rem", padding: "0.1rem 0.35rem", borderRadius: "4px", background: "rgba(16, 185, 129, 0.15)", color: "#059669", fontWeight: 600 }}>
          📥 Caja Chica
        </span>
      );
    case "CAJERO":
      return (
        <span style={{ fontSize: "0.68rem", padding: "0.1rem 0.35rem", borderRadius: "4px", background: "rgba(37, 99, 235, 0.15)", color: "#2563eb", fontWeight: 600 }}>
          💵 Cajero
        </span>
      );
    case "GERENCIA":
      return (
        <span style={{ fontSize: "0.68rem", padding: "0.1rem 0.35rem", borderRadius: "4px", background: "rgba(147, 51, 234, 0.15)", color: "#9333ea", fontWeight: 600 }}>
          🛡️ Admin
        </span>
      );
    case "SUPERVISOR":
      return (
        <span style={{ fontSize: "0.68rem", padding: "0.1rem 0.35rem", borderRadius: "4px", background: "rgba(217, 119, 6, 0.15)", color: "#d97706", fontWeight: 600 }}>
          👁️ Supervisor
        </span>
      );
    case "PROMOTOR":
      return (
        <span style={{ fontSize: "0.68rem", padding: "0.1rem 0.35rem", borderRadius: "4px", background: "rgba(100, 116, 139, 0.15)", color: "#64748b", fontWeight: 600 }}>
          📂 Promotor
        </span>
      );
    default:
      return (
        <span style={{ fontSize: "0.68rem", padding: "0.1rem 0.35rem", borderRadius: "4px", background: "rgba(100, 116, 139, 0.1)", color: "var(--ink-soft)", fontWeight: 500 }}>
          {rol}
        </span>
      );
  }
}

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
  const [mostrarReporteLibro, setMostrarReporteLibro] = useState(false);
  const [editarRegistro, setEditarRegistro] = useState<CajaMovimientoAuxiliar | null>(null);
  const [imprimirRegistro, setImprimirRegistro] = useState<CajaMovimientoAuxiliar | null>(null);
  const [filtroTexto, setFiltroTexto] = useState("");

  const { usuario } = useAuth();

  const algunFormularioAbierto =
    mostrarForm || mostrarCobroCredito || mostrarDesembolso || mostrarLiquidarPF || mostrarCierre;

  function cerrarTodosFormularios() {
    setMostrarForm(false);
    setMostrarCobroCredito(false);
    setMostrarDesembolso(false);
    setMostrarLiquidarPF(false);
    setMostrarCierre(false);
    setEditarRegistro(null);
  }

  const movimientosFiltrados = useMemo(() => {
    if (!filtroTexto.trim()) return detalle.movimientos;
    const q = filtroTexto.toLowerCase().trim();
    return detalle.movimientos.filter(
      (m) =>
        m.descripcion?.toLowerCase().includes(q) ||
        m.beneficiario?.toLowerCase().includes(q) ||
        m.referencia?.toLowerCase().includes(q) ||
        m.doc_no?.toLowerCase().includes(q) ||
        m.usuario_nombre?.toLowerCase().includes(q)
    );
  }, [detalle.movimientos, filtroTexto]);

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
          {usuario?.rol !== "CAJA_CHICA" && (
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
          )}
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
                { id: "FONDOS_PROPIOS", icon: "🏦", label: "COMIF Propios", data: resumenFondos.FONDOS_PROPIOS, color: "#059669" },
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

        {/* LIQUIDACIONES DE CAMPO (PROMOTORES) */}
        <LiquidacionesCampo
          agenciaId={agenciaId}
          onLiquidado={() => {
            onRecargar(); // Recargar la caja para ver los nuevos movimientos
          }}
        />
      </div>

      {/* PANEL DERECHO: 4 KPIS + FORMULARIO ACTIVO O TABLA DE MOVIMIENTOS */}
      <div className="screen-panel" style={{ padding: "0.65rem", gap: "0.5rem", minHeight: 0 }}>
        {/* 4 KPIS HORIZONTALES CON ESTILO FINTECH */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.5rem" }}>
          {/* SALDO INICIAL */}
          <div
            style={{
              background: "var(--paper)",
              border: "1px solid var(--line)",
              borderLeft: "4px solid #64748b",
              borderRadius: "8px",
              padding: "0.45rem 0.65rem",
              display: "flex",
              flexDirection: "column",
              boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "0.65rem", fontWeight: 700, color: "var(--ink-soft)", letterSpacing: "0.03em" }}>
                SALDO INICIAL
              </span>
              <span style={{ fontSize: "0.85rem" }}>🪙</span>
            </div>
            <span style={{ fontSize: "1.08rem", fontWeight: 700, color: "var(--ink)", fontFamily: "monospace" }}>
              {formatoQ(detalle.dia.saldo_inicial)}
            </span>
            <span style={{ fontSize: "0.65rem", color: "var(--ink-soft)" }}>Apertura de turno</span>
          </div>

          {/* TOTAL INGRESOS */}
          <div
            style={{
              background: "var(--paper)",
              border: "1px solid var(--line)",
              borderLeft: "4px solid #059669",
              borderRadius: "8px",
              padding: "0.45rem 0.65rem",
              display: "flex",
              flexDirection: "column",
              boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "0.65rem", fontWeight: 700, color: "#059669", letterSpacing: "0.03em" }}>
                TOTAL INGRESOS
              </span>
              <span style={{ fontSize: "0.85rem" }}>📥</span>
            </div>
            <span style={{ fontSize: "1.08rem", fontWeight: 700, color: "#059669", fontFamily: "monospace" }}>
              {formatoQ(detalle.totalIngreso)}
            </span>
            <span style={{ fontSize: "0.65rem", color: "var(--ink-soft)" }}>Cobros & depósitos</span>
          </div>

          {/* TOTAL EGRESOS */}
          <div
            style={{
              background: "var(--paper)",
              border: "1px solid var(--line)",
              borderLeft: "4px solid #f59e0b",
              borderRadius: "8px",
              padding: "0.45rem 0.65rem",
              display: "flex",
              flexDirection: "column",
              boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "0.65rem", fontWeight: 700, color: "#d97706", letterSpacing: "0.03em" }}>
                TOTAL EGRESOS
              </span>
              <span style={{ fontSize: "0.85rem" }}>📤</span>
            </div>
            <span style={{ fontSize: "1.08rem", fontWeight: 700, color: "#d97706", fontFamily: "monospace" }}>
              {formatoQ(detalle.totalEgreso)}
            </span>
            <span style={{ fontSize: "0.65rem", color: "var(--ink-soft)" }}>Colocación & retiros</span>
          </div>

          {/* SALDO ACTUAL */}
          <div
            style={{
              background: "rgba(2, 132, 199, 0.06)",
              border: "1px solid rgba(2, 132, 199, 0.3)",
              borderLeft: "4px solid #0284c7",
              borderRadius: "8px",
              padding: "0.45rem 0.65rem",
              display: "flex",
              flexDirection: "column",
              boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "0.65rem", fontWeight: 700, color: "#0284c7", letterSpacing: "0.03em" }}>
                SALDO ACTUAL EN CAJA
              </span>
              <span style={{ fontSize: "0.85rem" }}>💵</span>
            </div>
            <span style={{ fontSize: "1.15rem", fontWeight: 800, color: "#0284c7", fontFamily: "monospace" }}>
              {formatoQ(detalle.saldoActual)}
            </span>
            <span style={{ fontSize: "0.65rem", color: "var(--ink-soft)" }}>Disponible en ventanilla</span>
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

            {mostrarCierre && usuario?.rol !== "CAJA_CHICA" && (
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
          /* TABLA CON BUSCADOR RÁPIDO, SCROLL INTERNO Y CABECERA PEGAJOSA */
          <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0, gap: "0.4rem" }}>
            {/* BARRA DE BÚSQUEDA RÁPIDA DE OPERACIONES */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.5rem", background: "var(--paper)", border: "1px solid var(--line)", borderRadius: "6px", padding: "0.3rem 0.55rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", flex: 1 }}>
                <span style={{ fontSize: "0.85rem", opacity: 0.7 }}>🔍</span>
                <input
                  type="text"
                  placeholder="Buscar por beneficiario, doc, referencia o descripción..."
                  value={filtroTexto}
                  onChange={(e) => setFiltroTexto(e.target.value)}
                  style={{
                    flex: 1,
                    border: "none",
                    background: "transparent",
                    color: "var(--ink)",
                    fontSize: "0.78rem",
                    outline: "none",
                  }}
                />
                {filtroTexto && (
                  <button
                    type="button"
                    onClick={() => setFiltroTexto("")}
                    style={{
                      background: "none",
                      border: "none",
                      color: "var(--ink-soft)",
                      cursor: "pointer",
                      fontSize: "0.75rem",
                      padding: "0.1rem 0.3rem",
                    }}
                    title="Limpiar búsqueda"
                  >
                    ✕
                  </button>
                )}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span style={{ fontSize: "0.7rem", color: "var(--ink-soft)", whiteSpace: "nowrap" }}>
                  {movimientosFiltrados.length} de {detalle.movimientos.length} movs.
                </span>
                <button
                  type="button"
                  className="btn btn-xs"
                  onClick={() => setMostrarReporteLibro(true)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.3rem",
                    padding: "0.22rem 0.6rem",
                    fontSize: "0.74rem",
                    fontWeight: 700,
                  }}
                  title="Imprimir Comprobante Oficial del Libro de Caja"
                >
                  <span>🖨️</span> Imprimir Libro
                </button>
              </div>
            </div>

            <div className="table-scroll-container" style={{ flex: 1 }}>
              <table className="table-compact">
                <thead>
                  <tr>
                    <th style={{ minWidth: 55 }}>HORA</th>
                    <th style={{ minWidth: 160 }}>MOVIMIENTO</th>
                    <th style={{ minWidth: 90 }}>REFERENCIA</th>
                    <th style={{ minWidth: 140 }}>BENEFICIARIO</th>
                    <th style={{ minWidth: 65 }}>DOC.</th>
                    <th style={{ minWidth: 85, textAlign: "right" }}>INGRESO</th>
                    <th style={{ minWidth: 85, textAlign: "right" }}>EGRESO</th>
                    <th style={{ minWidth: 95, textAlign: "right" }}>SALDO</th>
                    <th style={{ minWidth: 85 }}>USUARIO</th>
                    <th style={{ minWidth: 40, textAlign: "center" }}>ACCIÓN</th>
                  </tr>
                </thead>
                <tbody>
                  {movimientosFiltrados.map((m) => (
                    <tr key={m.id}>
                      <td className="mono" style={{ fontSize: "0.74rem" }}>
                        {new Date(m.created_at).toLocaleTimeString("es-GT", { hour: "2-digit", minute: "2-digit" })}
                      </td>
                      <td>
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.15rem", alignItems: "flex-start" }}>
                          <span style={{ fontSize: "0.78rem", fontWeight: 600 }}>{m.descripcion}</span>
                          {m.origen_fondos && (
                            <span
                              style={{
                                fontSize: "0.62rem",
                                fontWeight: 700,
                                padding: "0.05rem 0.25rem",
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
                      <td className="mono" style={{ fontSize: "0.74rem", color: "var(--accent)" }}>{m.referencia ?? "—"}</td>
                      <td style={{ fontSize: "0.76rem" }}>{m.beneficiario}</td>
                      <td className="mono" style={{ fontSize: "0.74rem" }}>{m.doc_no ?? "—"}</td>
                      <td className="mono" style={{ color: "#059669", fontWeight: 700, textAlign: "right", fontSize: "0.78rem" }}>
                        {m.tipo === "INGRESO" ? formatoQ(m.monto) : ""}
                      </td>
                      <td className="mono" style={{ color: "#d97706", fontWeight: 700, textAlign: "right", fontSize: "0.78rem" }}>
                        {m.tipo === "EGRESO" ? formatoQ(m.monto) : ""}
                      </td>
                      <td className="mono" style={{ fontWeight: 700, textAlign: "right", fontSize: "0.78rem" }}>{formatoQ(m.saldo_acumulado)}</td>
                      <td style={{ fontSize: "0.72rem", color: "var(--ink-soft)" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.3rem", flexWrap: "wrap" }}>
                          <span>{m.usuario_nombre}</span>
                          {renderRolBadge(m.usuario_rol)}
                        </div>
                      </td>
                      <td style={{ textAlign: "center" }}>
                        <div style={{ display: "flex", gap: "0.2rem", justifyContent: "center" }}>
                          <button
                            title="Imprimir Recibo"
                            className="btn btn-icon"
                            style={{ padding: "0.2rem", fontSize: "0.85rem" }}
                            onClick={() => setImprimirRegistro(m)}
                          >
                            🖨️
                          </button>
                          {(usuario?.rol === "GERENCIA" || (m.usuario_id === usuario?.id && m.created_at.startsWith(new Date().toISOString().slice(0, 10)))) && (
                            <button
                              title="Corregir Movimiento"
                              className="btn btn-icon"
                              style={{ padding: "0.2rem", fontSize: "0.85rem" }}
                              onClick={() => setEditarRegistro(m)}
                            >
                              ✏️
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {movimientosFiltrados.length === 0 && (
                <div className="empty" style={{ padding: "1.5rem", textAlign: "center", color: "var(--ink-soft)", fontSize: "0.82rem" }}>
                  {filtroTexto ? `No se encontraron movimientos que coincidan con "${filtroTexto}".` : "Todavía no hay movimientos registrados hoy."}
                </div>
              )}
            </div>
          </div>
        )}

        {/* FOOTER FIJO */}
        <div className="screen-footer" style={{ padding: "0.25rem 0.5rem" }}>
          <span style={{ fontSize: "0.75rem", color: "var(--ink-soft)" }}>
            Turno activo · {detalle.movimientos.length} movimiento(s) registrado(s) hoy
          </span>
          <span className="badge activo" style={{ fontSize: "0.7rem", padding: "0.1rem 0.4rem" }}>
            🟢 En línea
          </span>
        </div>
      </div>

      {editarRegistro && (
        <AuxiliarCajaEditModal
          registro={editarRegistro}
          onClose={() => setEditarRegistro(null)}
          onSuccess={() => {
            setEditarRegistro(null);
            onRecargar();
          }}
        />
      )}

      {imprimirRegistro && (
        <ReciboMovimientoModal
          movimiento={imprimirRegistro}
          onClose={() => setImprimirRegistro(null)}
        />
      )}

      {mostrarReporteLibro && (
        <LibroCajaReporteModal
          agenciaId={agenciaId}
          agenciaNombre="Agencia Chajul"
          detalleActual={detalle}
          onClose={() => setMostrarReporteLibro(false)}
        />
      )}
    </div>
  );
}
