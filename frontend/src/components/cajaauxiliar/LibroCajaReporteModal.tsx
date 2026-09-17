import { useEffect, useState, useMemo } from "react";
import { api, mensajeError } from "../../lib/api";
import { formatoQ } from "../../types";
import type { DetalleCajaAuxiliar, CajaMovimientoAuxiliar, OrigenFondos } from "../../types";

export interface LibroCajaReporteModalProps {
  agenciaId: string;
  agenciaNombre: string;
  detalleActual?: DetalleCajaAuxiliar | null;
  onClose: () => void;
}

type PeriodoFiltro = "TURNO_ACTUAL" | "HOY" | "SEMANA" | "MES" | "PERSONALIZADO";

export default function LibroCajaReporteModal({
  agenciaId,
  agenciaNombre,
  detalleActual,
  onClose,
}: LibroCajaReporteModalProps) {
  const hoyStr = new Date().toISOString().slice(0, 10);

  function getLunesEstaSemana(): string {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const lunes = new Date(d.setDate(diff));
    return lunes.toISOString().slice(0, 10);
  }

  function getInicioEsteMes(): string {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
  }

  const [periodo, setPeriodo] = useState<PeriodoFiltro>(detalleActual ? "TURNO_ACTUAL" : "HOY");
  const [fechaInicio, setFechaInicio] = useState(hoyStr);
  const [fechaFin, setFechaFin] = useState(hoyStr);

  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [datosReporte, setDatosReporte] = useState<{
    saldoInicial: number;
    totalIngreso: number;
    totalEgreso: number;
    saldoFinal: number;
    movimientos: CajaMovimientoAuxiliar[];
    desgloseFuentes?: Record<string, { cobros: number; colocacion: number; total: number; ops: number }>;
  } | null>(() => {
    if (detalleActual) {
      return {
        saldoInicial: Number(detalleActual.dia.saldo_inicial),
        totalIngreso: Number(detalleActual.totalIngreso),
        totalEgreso: Number(detalleActual.totalEgreso),
        saldoFinal: Number(detalleActual.saldoActual),
        movimientos: detalleActual.movimientos,
      };
    }
    return null;
  });

  function cargarReporte(fInicio = fechaInicio, fFin = fechaFin) {
    setCargando(true);
    setError(null);
    api
      .get<{
        saldoInicial: number;
        totalIngreso: number;
        totalEgreso: number;
        saldoFinal: number;
        movimientos: CajaMovimientoAuxiliar[];
        desgloseFuentes: Record<string, { cobros: number; colocacion: number; total: number; ops: number }>;
      }>("/caja-auxiliar/reporte", {
        params: {
          agenciaId,
          fechaInicio: fInicio,
          fechaFin: fFin,
        },
      })
      .then(({ data }) => {
        setDatosReporte({
          saldoInicial: data.saldoInicial,
          totalIngreso: data.totalIngreso,
          totalEgreso: data.totalEgreso,
          saldoFinal: data.saldoFinal,
          movimientos: data.movimientos,
          desgloseFuentes: data.desgloseFuentes,
        });
      })
      .catch((err) => setError(mensajeError(err)))
      .finally(() => setCargando(false));
  }

  function handleCambiarPeriodo(p: PeriodoFiltro) {
    setPeriodo(p);
    if (p === "TURNO_ACTUAL" && detalleActual) {
      setDatosReporte({
        saldoInicial: Number(detalleActual.dia.saldo_inicial),
        totalIngreso: Number(detalleActual.totalIngreso),
        totalEgreso: Number(detalleActual.totalEgreso),
        saldoFinal: Number(detalleActual.saldoActual),
        movimientos: detalleActual.movimientos,
      });
      return;
    }

    let fIni = hoyStr;
    let fFin = hoyStr;
    if (p === "HOY") {
      fIni = hoyStr;
      fFin = hoyStr;
    } else if (p === "SEMANA") {
      fIni = getLunesEstaSemana();
      fFin = hoyStr;
    } else if (p === "MES") {
      fIni = getInicioEsteMes();
      fFin = hoyStr;
    }
    setFechaInicio(fIni);
    setFechaFin(fFin);
    cargarReporte(fIni, fFin);
  }

  useEffect(() => {
    if (!detalleActual) {
      cargarReporte(fechaInicio, fechaFin);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const movimientosOrdenados = useMemo(() => {
    if (!datosReporte?.movimientos) return [];
    // Orden cronológico ascendente para el libro contable de movimientos
    return [...datosReporte.movimientos].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
  }, [datosReporte?.movimientos]);

  const resumenFuentes = useMemo(() => {
    if (datosReporte?.desgloseFuentes) return datosReporte.desgloseFuentes;
    const r: Record<
      OrigenFondos,
      { cobros: number; colocacion: number; countCobros: number; countColocacion: number }
    > = {
      FONDOS_PROPIOS: { cobros: 0, colocacion: 0, countCobros: 0, countColocacion: 0 },
      FEDERURAL: { cobros: 0, colocacion: 0, countCobros: 0, countColocacion: 0 },
      CHN_GUATEMALA: { cobros: 0, colocacion: 0, countCobros: 0, countColocacion: 0 },
    };

    movimientosOrdenados.forEach((m) => {
      let origen: OrigenFondos = (m.origen_fondos as OrigenFondos) || "FONDOS_PROPIOS";
      if (!r[origen]) origen = "FONDOS_PROPIOS";
      const monto = Number(m.monto);
      if (m.tipo === "INGRESO") {
        r[origen].cobros += monto;
        r[origen].countCobros += 1;
      } else {
        r[origen].colocacion += monto;
        r[origen].countColocacion += 1;
      }
    });

    return {
      FONDOS_PROPIOS: { ...r.FONDOS_PROPIOS, total: r.FONDOS_PROPIOS.cobros - r.FONDOS_PROPIOS.colocacion, ops: r.FONDOS_PROPIOS.countCobros + r.FONDOS_PROPIOS.countColocacion },
      FEDERURAL: { ...r.FEDERURAL, total: r.FEDERURAL.cobros - r.FEDERURAL.colocacion, ops: r.FEDERURAL.countCobros + r.FEDERURAL.countColocacion },
      CHN_GUATEMALA: { ...r.CHN_GUATEMALA, total: r.CHN_GUATEMALA.cobros - r.CHN_GUATEMALA.colocacion, ops: r.CHN_GUATEMALA.countCobros + r.CHN_GUATEMALA.countColocacion },
    };
  }, [datosReporte?.desgloseFuentes, movimientosOrdenados]);

  function handleImprimir() {
    window.print();
  }

  function handleExportarCSV() {
    if (!datosReporte) return;
    const rows = [
      ["COOPERATIVA MAYA INVERSIONES FUTURAS R.L \"COMIF R.L.\""],
      ["LIBRO DE MOVIMIENTOS Y CUADRE DE CAJA AUXILIAR"],
      [`Agencia: ${agenciaNombre}`, `Periodo: ${fechaInicio} al ${fechaFin}`],
      [""],
      ["RESUMEN DE CAJA"],
      ["Saldo Inicial", Number(datosReporte.saldoInicial).toFixed(2)],
      ["Total Ingresos", Number(datosReporte.totalIngreso).toFixed(2)],
      ["Total Egresos", Number(datosReporte.totalEgreso).toFixed(2)],
      ["Saldo Final", Number(datosReporte.saldoFinal).toFixed(2)],
      [""],
      ["No.", "Fecha", "Hora", "No. Doc / Recibo", "Tipo", "Concepto", "Beneficiario / Socio", "Ingreso (Q)", "Egreso (Q)", "Saldo Acumulado (Q)", "Operador / Responsable"],
      ...movimientosOrdenados.map((m, idx) => [
        idx + 1,
        new Date(m.created_at).toLocaleDateString("es-GT"),
        new Date(m.created_at).toLocaleTimeString("es-GT", { hour: "2-digit", minute: "2-digit" }),
        m.doc_no || "—",
        m.tipo,
        m.descripcion || m.categoria,
        m.beneficiario || "—",
        m.tipo === "INGRESO" ? Number(m.monto).toFixed(2) : "",
        m.tipo === "EGRESO" ? Number(m.monto).toFixed(2) : "",
        m.saldo_acumulado ? Number(m.saldo_acumulado).toFixed(2) : "",
        m.usuario_nombre || "—",
      ]),
    ];

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + rows.map((e) => e.map((c) => `"${c}"`).join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Libro_Caja_${agenciaNombre.replace(/\s+/g, "_")}_${fechaInicio}_${fechaFin}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  const saldoIni = datosReporte?.saldoInicial ?? 0;
  const totIng = datosReporte?.totalIngreso ?? 0;
  const totEgr = datosReporte?.totalEgreso ?? 0;
  const saldoFin = datosReporte?.saldoFinal ?? (saldoIni + totIng - totEgr);

  return (
    <div className="modal libro-caja-modal-overlay">
      <div
        className="modal-content libro-caja-modal-card"
        style={{
          maxWidth: 960,
          width: "95vw",
          maxHeight: "92vh",
          display: "flex",
          flexDirection: "column",
          padding: "1.2rem 1.4rem",
        }}
      >
        {/* ── BARRA SUPERIOR DE ACCIONES (NO IMPRIMIBLE) ── */}
        <div className="no-print" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.85rem", borderBottom: "1px solid var(--line)", paddingBottom: "0.75rem", flexWrap: "wrap", gap: "0.5rem" }}>
          <div>
            <h2 style={{ margin: 0, fontSize: "1.1rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <span>🖨️</span> Comprobante del Libro de Caja Auxiliar
            </h2>
            <p className="sub" style={{ margin: 0, fontSize: "0.76rem" }}>
              Reporte oficial para cuadre diario, arqueos y auditoría de ventanilla
            </p>
          </div>

          <div style={{ display: "flex", gap: "0.4rem", alignItems: "center" }}>
            <button
              type="button"
              className="btn secondary"
              onClick={handleExportarCSV}
              style={{ fontSize: "0.78rem", padding: "0.35rem 0.65rem" }}
              title="Descargar archivo Excel CSV"
            >
              <span>📥</span> Excel
            </button>
            <button
              type="button"
              className="btn"
              onClick={handleImprimir}
              style={{ fontSize: "0.8rem", padding: "0.38rem 0.85rem" }}
            >
              <span>🖨️</span> Imprimir Comprobante (1-2 Hojas)
            </button>
            <button
              type="button"
              className="btn secondary"
              onClick={onClose}
              style={{ fontSize: "0.78rem", padding: "0.35rem 0.6rem" }}
            >
              ✕ Cerrar
            </button>
          </div>
        </div>

        {/* ── SELECTOR DE PERÍODOS RÁPIDOS (NO IMPRIMIBLE) ── */}
        <div
          className="no-print"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.4rem",
            marginBottom: "0.85rem",
            background: "rgba(15, 23, 42, 0.03)",
            padding: "0.45rem 0.65rem",
            borderRadius: "8px",
            border: "1px solid var(--line)",
            flexWrap: "wrap",
          }}
        >
          <span style={{ fontSize: "0.76rem", fontWeight: 700, color: "var(--ink-soft)" }}>Período:</span>
          {detalleActual && (
            <button
              type="button"
              className={`btn btn-xs ${periodo === "TURNO_ACTUAL" ? "" : "secondary"}`}
              onClick={() => handleCambiarPeriodo("TURNO_ACTUAL")}
            >
              🟢 Turno Actual
            </button>
          )}
          <button
            type="button"
            className={`btn btn-xs ${periodo === "HOY" ? "" : "secondary"}`}
            onClick={() => handleCambiarPeriodo("HOY")}
          >
            Hoy
          </button>
          <button
            type="button"
            className={`btn btn-xs ${periodo === "SEMANA" ? "" : "secondary"}`}
            onClick={() => handleCambiarPeriodo("SEMANA")}
          >
            Esta Semana
          </button>
          <button
            type="button"
            className={`btn btn-xs ${periodo === "MES" ? "" : "secondary"}`}
            onClick={() => handleCambiarPeriodo("MES")}
          >
            Este Mes
          </button>
          <button
            type="button"
            className={`btn btn-xs ${periodo === "PERSONALIZADO" ? "" : "secondary"}`}
            onClick={() => setPeriodo("PERSONALIZADO")}
          >
            Personalizado
          </button>

          {periodo === "PERSONALIZADO" && (
            <div style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem", marginLeft: "0.4rem" }}>
              <input
                type="date"
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
                style={{ fontSize: "0.74rem", padding: "0.2rem 0.35rem", borderRadius: "5px", border: "1px solid var(--line)" }}
              />
              <span style={{ fontSize: "0.74rem" }}>al</span>
              <input
                type="date"
                value={fechaFin}
                onChange={(e) => setFechaFin(e.target.value)}
                style={{ fontSize: "0.74rem", padding: "0.2rem 0.35rem", borderRadius: "5px", border: "1px solid var(--line)" }}
              />
              <button
                type="button"
                className="btn btn-xs"
                onClick={() => cargarReporte(fechaInicio, fechaFin)}
              >
                Buscar
              </button>
            </div>
          )}

          {cargando && <span style={{ fontSize: "0.75rem", color: "var(--ink-soft)" }}>⏳ Consultando…</span>}
        </div>

        {error && <div className="alert error no-print" style={{ margin: "0.25rem 0", fontSize: "0.8rem" }}>{error}</div>}

        {/* ═══════════════════════════════════════════════════════════
            DOCUMENTO OFICIAL IMPRIMIBLE (FORMATO CARTA 1-2 HOJAS)
            ═══════════════════════════════════════════════════════════ */}
        <div
          className="modal-body print-container"
          style={{
            flex: 1,
            overflowY: "auto",
            paddingRight: "0.35rem",
            color: "#0f172a",
          }}
        >
          {/* ── MEMBRETE INSTITUCIONAL OFICIAL ── */}
          <div
            style={{
              textAlign: "center",
              borderBottom: "2px solid #0f172a",
              paddingBottom: "0.5rem",
              marginBottom: "0.75rem",
            }}
          >
            <div style={{ fontSize: "1.1rem", fontWeight: 900, letterSpacing: "0.04em", textTransform: "uppercase", color: "#047857" }}>
              COOPERATIVA MAYA INVERSIONES FUTURAS R.L. "COMIF R.L."
            </div>
            <div style={{ fontSize: "0.92rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.02em", marginTop: "2px" }}>
              LIBRO DIARIO DE MOVIMIENTOS Y CUADRE DE CAJA AUXILIAR
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.74rem", fontWeight: 600, color: "#334155", marginTop: "4px" }}>
              <span>🏢 <strong>Agencia:</strong> {agenciaNombre}</span>
              <span>📅 <strong>Período:</strong> {periodo === "TURNO_ACTUAL" ? `Turno Activo (${hoyStr})` : `${fechaInicio} al ${fechaFin}`}</span>
              <span>💵 <strong>Moneda:</strong> Quetzales (Q)</span>
              <span>⏱️ <strong>Emisión:</strong> {new Date().toLocaleDateString("es-GT")} {new Date().toLocaleTimeString("es-GT", { hour: "2-digit", minute: "2-digit" })}</span>
            </div>
          </div>

          {/* ── CUADRE FINANCIERO EJECUTIVO ── */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: "0.5rem",
              marginBottom: "0.75rem",
            }}
          >
            <div style={{ background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: "6px", padding: "0.45rem 0.6rem" }}>
              <div style={{ fontSize: "0.65rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>1. Saldo Inicial</div>
              <div className="mono" style={{ fontSize: "0.95rem", fontWeight: 800, color: "#0f172a", marginTop: "2px" }}>
                {formatoQ(saldoIni)}
              </div>
            </div>

            <div style={{ background: "rgba(16, 185, 129, 0.08)", border: "1px solid rgba(16, 185, 129, 0.3)", borderRadius: "6px", padding: "0.45rem 0.6rem" }}>
              <div style={{ fontSize: "0.65rem", fontWeight: 700, color: "#059669", textTransform: "uppercase" }}>2. (+) Total Ingresos</div>
              <div className="mono" style={{ fontSize: "0.95rem", fontWeight: 800, color: "#059669", marginTop: "2px" }}>
                {formatoQ(totIng)}
              </div>
            </div>

            <div style={{ background: "rgba(239, 68, 68, 0.08)", border: "1px solid rgba(239, 68, 68, 0.3)", borderRadius: "6px", padding: "0.45rem 0.6rem" }}>
              <div style={{ fontSize: "0.65rem", fontWeight: 700, color: "#dc2626", textTransform: "uppercase" }}>3. (-) Total Egresos</div>
              <div className="mono" style={{ fontSize: "0.95rem", fontWeight: 800, color: "#dc2626", marginTop: "2px" }}>
                {formatoQ(totEgr)}
              </div>
            </div>

            <div style={{ background: "rgba(2, 132, 199, 0.08)", border: "1px solid rgba(2, 132, 199, 0.4)", borderRadius: "6px", padding: "0.45rem 0.6rem" }}>
              <div style={{ fontSize: "0.65rem", fontWeight: 700, color: "#0284c7", textTransform: "uppercase" }}>4. (=) Saldo Final en Caja</div>
              <div className="mono" style={{ fontSize: "1rem", fontWeight: 900, color: "#0284c7", marginTop: "2px" }}>
                {formatoQ(saldoFin)}
              </div>
            </div>
          </div>

          {/* ── RESUMEN POR FUENTES DE FONDOS ── */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.5rem", marginBottom: "0.75rem" }}>
            <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "6px", padding: "0.35rem 0.55rem", fontSize: "0.72rem" }}>
              <strong style={{ color: "#047857" }}>🏛️ COMIF Propios:</strong>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: "2px" }}>
                <span>Cobros: {formatoQ(resumenFuentes.FONDOS_PROPIOS?.cobros ?? 0)}</span>
                <span>Coloc: {formatoQ(resumenFuentes.FONDOS_PROPIOS?.colocacion ?? 0)}</span>
              </div>
            </div>
            <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "6px", padding: "0.35rem 0.55rem", fontSize: "0.72rem" }}>
              <strong style={{ color: "#d97706" }}>🌾 FEDERURAL:</strong>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: "2px" }}>
                <span>Cobros: {formatoQ(resumenFuentes.FEDERURAL?.cobros ?? 0)}</span>
                <span>Coloc: {formatoQ(resumenFuentes.FEDERURAL?.colocacion ?? 0)}</span>
              </div>
            </div>
            <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "6px", padding: "0.35rem 0.55rem", fontSize: "0.72rem" }}>
              <strong style={{ color: "#2563eb" }}>🏦 CHN-Guatemala:</strong>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: "2px" }}>
                <span>Cobros: {formatoQ(resumenFuentes.CHN_GUATEMALA?.cobros ?? 0)}</span>
                <span>Coloc: {formatoQ(resumenFuentes.CHN_GUATEMALA?.colocacion ?? 0)}</span>
              </div>
            </div>
          </div>

          {/* ── TABLA CRONOLÓGICA DE MOVIMIENTOS ── */}
          <div className="table-wrap" style={{ marginBottom: "1rem" }}>
            <table style={{ width: "100%", fontSize: "0.73rem", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#f1f5f9", borderBottom: "1.5px solid #0f172a" }}>
                  <th style={{ padding: "4px 6px", textAlign: "center", width: "26px" }}>#</th>
                  <th style={{ padding: "4px 6px", textAlign: "left", width: "55px" }}>Hora</th>
                  <th style={{ padding: "4px 6px", textAlign: "left", width: "75px" }}>No. Doc</th>
                  <th style={{ padding: "4px 6px", textAlign: "left" }}>Concepto / Operación</th>
                  <th style={{ padding: "4px 6px", textAlign: "left" }}>Socio / Beneficiario</th>
                  <th style={{ padding: "4px 6px", textAlign: "right", width: "85px" }}>Ingreso (Q)</th>
                  <th style={{ padding: "4px 6px", textAlign: "right", width: "85px" }}>Egreso (Q)</th>
                  <th style={{ padding: "4px 6px", textAlign: "right", width: "90px" }}>Saldo en Línea</th>
                  <th style={{ padding: "4px 6px", textAlign: "left", width: "80px" }}>Operador</th>
                </tr>
              </thead>
              <tbody>
                {movimientosOrdenados.length === 0 && (
                  <tr>
                    <td colSpan={9} style={{ textAlign: "center", padding: "1rem", color: "#64748b" }}>
                      No se registraron movimientos en este período.
                    </td>
                  </tr>
                )}
                {movimientosOrdenados.map((m, idx) => {
                  const horaStr = new Date(m.created_at).toLocaleTimeString("es-GT", { hour: "2-digit", minute: "2-digit" });
                  const esIngreso = m.tipo === "INGRESO";
                  const montoNum = Number(m.monto);

                  return (
                    <tr key={m.id} style={{ borderBottom: "1px solid #e2e8f0" }}>
                      <td style={{ textAlign: "center", color: "#64748b", padding: "3px 5px" }}>{idx + 1}</td>
                      <td className="mono" style={{ padding: "3px 5px" }}>{horaStr}</td>
                      <td className="mono" style={{ padding: "3px 5px", fontWeight: 600 }}>{m.doc_no || "—"}</td>
                      <td style={{ padding: "3px 5px" }}>
                        <div style={{ fontWeight: 600, color: "#0f172a" }}>{m.descripcion || m.categoria}</div>
                        {m.referencia && <div style={{ fontSize: "0.65rem", color: "#64748b" }}>Ref: {m.referencia}</div>}
                      </td>
                      <td style={{ padding: "3px 5px" }}>{m.beneficiario || "—"}</td>
                      <td className="mono" style={{ textAlign: "right", padding: "3px 5px", color: esIngreso ? "#059669" : "#94a3b8", fontWeight: esIngreso ? 700 : 400 }}>
                        {esIngreso ? formatoQ(montoNum) : "—"}
                      </td>
                      <td className="mono" style={{ textAlign: "right", padding: "3px 5px", color: !esIngreso ? "#dc2626" : "#94a3b8", fontWeight: !esIngreso ? 700 : 400 }}>
                        {!esIngreso ? formatoQ(montoNum) : "—"}
                      </td>
                      <td className="mono" style={{ textAlign: "right", padding: "3px 5px", fontWeight: 700 }}>
                        {m.saldo_acumulado ? formatoQ(Number(m.saldo_acumulado)) : "—"}
                      </td>
                      <td style={{ padding: "3px 5px", fontSize: "0.72rem", fontWeight: 500, color: "#1e293b", whiteSpace: "nowrap" }}>
                        {m.usuario_nombre || "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr style={{ background: "#f8fafc", borderTop: "2px solid #0f172a", fontWeight: 800 }}>
                  <td colSpan={5} style={{ padding: "6px 8px", textAlign: "right", textTransform: "uppercase" }}>
                    TOTALES CONSOLIDADOS DEL PERÍODO:
                  </td>
                  <td className="mono" style={{ textAlign: "right", padding: "6px 8px", color: "#059669", fontSize: "0.82rem" }}>
                    {formatoQ(totIng)}
                  </td>
                  <td className="mono" style={{ textAlign: "right", padding: "6px 8px", color: "#dc2626", fontSize: "0.82rem" }}>
                    {formatoQ(totEgr)}
                  </td>
                  <td className="mono" style={{ textAlign: "right", padding: "6px 8px", color: "#0284c7", fontSize: "0.85rem" }}>
                    {formatoQ(saldoFin)}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* ── BLOQUE OFICIAL DE FIRMAS Y CONFORMIDAD ── */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "2.5rem",
              marginTop: "1.5rem",
              paddingTop: "1rem",
              pageBreakInside: "avoid",
              breakInside: "avoid",
            }}
          >
            <div style={{ textAlign: "center" }}>
              <div style={{ borderBottom: "1.5px solid #0f172a", width: "80%", margin: "0 auto 0.4rem" }} />
              <div style={{ fontSize: "0.8rem", fontWeight: 800, textTransform: "uppercase" }}>
                Firma y Sello: Cajero(a) Responsable
              </div>
              <div style={{ fontSize: "0.68rem", color: "#64748b" }}>
                Entrega Conforme de Operaciones de Ventanilla
              </div>
            </div>

            <div style={{ textAlign: "center" }}>
              <div style={{ borderBottom: "1.5px solid #0f172a", width: "80%", margin: "0 auto 0.4rem" }} />
              <div style={{ fontSize: "0.8rem", fontWeight: 800, textTransform: "uppercase" }}>
                Firma y Sello: Supervisor(a) / Auditor(a)
              </div>
              <div style={{ fontSize: "0.68rem", color: "#64748b" }}>
                Revisión, Arqueo Físico y Conformidad Contable
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
