import { useEffect, useState } from "react";
import { api, mensajeError } from "../lib/api";
import { CATEGORIA_CAJA_CHICA_LABEL, formatoQ } from "../types";
import type { Agencia, CategoriaCajaChica, ReporteCajaChica } from "../types";

interface Props {
  agenciaId: string;
  agencias?: Agencia[];
  puedeElegirAgencia?: boolean;
  onClose: () => void;
}

type PeriodoRapido = "HOY" | "SEMANA" | "MES" | "ULTIMA_REPO" | "PERSONALIZADO";

const CATEGORIAS = Object.entries(CATEGORIA_CAJA_CHICA_LABEL) as [CategoriaCajaChica, string][];

export default function CajaChicaReporteModal({
  agenciaId: agenciaInicial,
  agencias = [],
  puedeElegirAgencia = false,
  onClose,
}: Props) {
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

  const [agenciaSel, setAgenciaSel] = useState(agenciaInicial);
  const [periodo, setPeriodo] = useState<PeriodoRapido>("SEMANA");
  const [fechaInicio, setFechaInicio] = useState(getLunesEstaSemana());
  const [fechaFin, setFechaFin] = useState(hoyStr);
  const [categoria, setCategoria] = useState<string>("");

  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reporte, setReporte] = useState<ReporteCajaChica | null>(null);

  function cargarReporte(fInicio = fechaInicio, fFin = fechaFin, cat = categoria, agId = agenciaSel) {
    setCargando(true);
    setError(null);
    api
      .get<ReporteCajaChica>("/caja-chica/reporte", {
        params: {
          agenciaId: agId,
          fechaInicio: fInicio || undefined,
          fechaFin: fFin || undefined,
          categoria: cat || undefined,
        },
      })
      .then(({ data }) => {
        setReporte(data);
      })
      .catch((err) => setError(mensajeError(err)))
      .finally(() => setCargando(false));
  }

  useEffect(() => {
    cargarReporte(fechaInicio, fechaFin, categoria, agenciaSel);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agenciaSel]);

  function aplicarPeriodo(tipo: PeriodoRapido) {
    setPeriodo(tipo);
    let nuevaInicio = fechaInicio;
    let nuevaFin = hoyStr;

    if (tipo === "HOY") {
      nuevaInicio = hoyStr;
      nuevaFin = hoyStr;
    } else if (tipo === "SEMANA") {
      nuevaInicio = getLunesEstaSemana();
      nuevaFin = hoyStr;
    } else if (tipo === "MES") {
      nuevaInicio = getInicioEsteMes();
      nuevaFin = hoyStr;
    } else if (tipo === "ULTIMA_REPO") {
      if (reporte?.ultimaReposicion?.fecha) {
        nuevaInicio = reporte.ultimaReposicion.fecha.slice(0, 10);
      } else {
        nuevaInicio = getInicioEsteMes();
      }
      nuevaFin = hoyStr;
    }

    setFechaInicio(nuevaInicio);
    setFechaFin(nuevaFin);
    cargarReporte(nuevaInicio, nuevaFin, categoria, agenciaSel);
  }

  function handleFiltrarManual(e: React.FormEvent) {
    e.preventDefault();
    setPeriodo("PERSONALIZADO");
    cargarReporte(fechaInicio, fechaFin, categoria, agenciaSel);
  }

  function exportarCSV() {
    if (!reporte) return;
    const lineas: string[] = [];
    lineas.push(`INFORME DE RENDICION DE GASTOS DE CAJA CHICA - COOP COMIF-R.L.`);
    lineas.push(`Agencia: ${reporte.agencia.nombre}`);
    lineas.push(
      `Periodo: ${fechaInicio ? new Date(fechaInicio + "T00:00:00").toLocaleDateString("es-GT") : "Inicio"} al ${
        fechaFin ? new Date(fechaFin + "T00:00:00").toLocaleDateString("es-GT") : "Hoy"
      }`,
    );
    lineas.push(`Fecha de emision: ${new Date().toLocaleString("es-GT")}`);
    lineas.push("");
    lineas.push("RESUMEN DE LIQUIDACION");
    lineas.push(`Saldo Anterior,${reporte.saldoAnterior.toFixed(2)}`);
    lineas.push(`Total Reposiciones Recibidas (+),${reporte.totalIngresosPeriodo.toFixed(2)}`);
    lineas.push(`Total Gastos Realizados (-),${reporte.totalEgresosPeriodo.toFixed(2)}`);
    lineas.push(`Saldo Remanente en Caja (=),${reporte.saldoFinalPeriodo.toFixed(2)}`);
    lineas.push("");

    lineas.push("DETALLE DE GASTOS (EGRESOS)");
    lineas.push("Fecha,No. Documento,Proveedor / Beneficiario,Categoria,Descripcion,Monto (Q),Registrado Por");
    reporte.egresos.forEach((c) => {
      const fechaStr = new Date(c.fecha).toLocaleDateString("es-GT");
      const catStr = c.categoria ? CATEGORIA_CAJA_CHICA_LABEL[c.categoria] ?? c.categoria : "Sin categoria";
      const doc = c.numero_documento || "DTE";
      const ben = `"${(c.beneficiario || "").replace(/"/g, '""')}"`;
      const desc = `"${(c.descripcion || "").replace(/"/g, '""')}"`;
      const usu = `"${(c.usuario_nombre || "").replace(/"/g, '""')}"`;
      lineas.push(`${fechaStr},${doc},${ben},${catStr},${desc},${Number(c.monto).toFixed(2)},${usu}`);
    });
    lineas.push("");

    if (reporte.ingresos.length > 0) {
      lineas.push("REPOSICIONES DE FONDO (INGRESOS BANCARIOS)");
      lineas.push("Fecha,No. Cheque / Doc,Origen,Descripcion,Monto (Q),Registrado Por");
      reporte.ingresos.forEach((c) => {
        const fechaStr = new Date(c.fecha).toLocaleDateString("es-GT");
        const doc = c.numero_documento || "CH";
        const ben = `"${(c.beneficiario || "").replace(/"/g, '""')}"`;
        const desc = `"${(c.descripcion || "").replace(/"/g, '""')}"`;
        const usu = `"${(c.usuario_nombre || "").replace(/"/g, '""')}"`;
        lineas.push(`${fechaStr},${doc},${ben},${desc},${Number(c.monto).toFixed(2)},${usu}`);
      });
      lineas.push("");
    }

    lineas.push("RESUMEN POR CATEGORIA DE GASTO");
    lineas.push("Categoria,Cantidad Comprobantes,Total Gastado (Q),Porcentaje");
    reporte.totalesPorCategoria.forEach((t) => {
      const cat =
        t.categoria === "SIN_CATEGORIA"
          ? "Sin categoria"
          : CATEGORIA_CAJA_CHICA_LABEL[t.categoria as CategoriaCajaChica] ?? t.categoria;
      lineas.push(`${cat},${t.cantidad},${t.total.toFixed(2)},${t.porcentaje.toFixed(1)}%`);
    });

    const blob = new Blob(["\uFEFF" + lineas.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `informe_gastos_caja_chica_${reporte.agencia.codigo}_${fechaInicio}_al_${fechaFin}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div
      className="caja-chica-reporte-container"
      style={{
        width: "100%",
        padding: "0.25rem 0.5rem 1.5rem",
        boxSizing: "border-box",
      }}
    >
      <div
        className="card caja-chica-reporte-card"
        style={{
          width: "100%",
          maxWidth: "1060px",
          boxSizing: "border-box",
          background: "var(--paper)",
          borderRadius: "10px",
          border: "1px solid var(--line)",
          padding: "0.85rem 1.15rem",
          margin: "0 auto",
          boxShadow: "0 4px 16px rgba(0,0,0,0.06)",
        }}
      >
        {/* Cabecera del Informe (no-print) */}
        <div
          className="no-print"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderBottom: "1px solid var(--line)",
            paddingBottom: "0.45rem",
            marginBottom: "0.5rem",
            gap: "0.5rem",
            flexWrap: "wrap",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", minWidth: 0, flexWrap: "wrap" }}>
            <button
              type="button"
              className="btn secondary"
              style={{
                padding: "0.3rem 0.65rem",
                fontSize: "0.8rem",
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                gap: "0.25rem",
                cursor: "pointer",
                borderColor: "var(--line)",
                flexShrink: 0,
              }}
              onClick={onClose}
              title="Volver al libro de caja chica"
            >
              ← Volver al Libro
            </button>
            <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", minWidth: 0, flexWrap: "wrap" }}>
              <span style={{ fontSize: "1rem" }}>📄</span>
              <h2 style={{ margin: 0, fontSize: "0.98rem", fontWeight: 800, whiteSpace: "nowrap" }}>
                Informe de Rendición de Gastos
              </h2>
              <span style={{ fontSize: "0.7rem", background: "rgba(2, 132, 199, 0.12)", color: "#0284c7", border: "1px solid rgba(2, 132, 199, 0.3)", borderRadius: "12px", padding: "0.1rem 0.45rem", fontWeight: 700 }}>
                1 Página Carta
              </span>
            </div>
          </div>

          <div style={{ display: "flex", gap: "0.4rem", alignItems: "center", flexShrink: 0, flexWrap: "wrap" }}>
            <button
              type="button"
              className="btn secondary"
              style={{ padding: "0.32rem 0.65rem", fontSize: "0.78rem", fontWeight: 600 }}
              onClick={exportarCSV}
              disabled={!reporte || reporte.egresos.length === 0}
              title="Descargar datos en Excel CSV"
            >
              📥 Excel (CSV)
            </button>
            <button
              type="button"
              className="btn"
              style={{
                padding: "0.35rem 0.85rem",
                fontSize: "0.82rem",
                background: "#059669",
                color: "#ffffff",
                borderColor: "#047857",
                fontWeight: 800,
                boxShadow: "0 2px 6px rgba(5,150,105,0.3)",
                display: "flex",
                alignItems: "center",
                gap: "0.3rem",
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
              onClick={() => window.print()}
              disabled={!reporte}
              title="Imprimir informe en 1 hoja o guardar en PDF"
            >
              🖨️ Imprimir / Guardar PDF
            </button>
          </div>
        </div>

        {/* Barra de Filtros Compacta Organizada (no-print) */}
        <div
          className="no-print"
          style={{
            background: "var(--paper-raised)",
            padding: "0.45rem 0.65rem",
            marginBottom: "0.6rem",
            borderRadius: "6px",
            border: "1px solid var(--line)",
            display: "flex",
            flexDirection: "column",
            gap: "0.4rem",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "0.4rem",
            }}
          >
            {/* Períodos Rápidos */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.3rem", flexWrap: "wrap" }}>
              <span style={{ fontSize: "0.74rem", fontWeight: 700, color: "var(--ink-soft)", marginRight: "0.15rem" }}>Período:</span>
              <button
                type="button"
                className={`btn ${periodo === "HOY" ? "" : "secondary"}`}
                style={{ fontSize: "0.72rem", padding: "0.18rem 0.45rem", borderRadius: "4px" }}
                onClick={() => aplicarPeriodo("HOY")}
              >
                Hoy
              </button>
              <button
                type="button"
                className={`btn ${periodo === "SEMANA" ? "" : "secondary"}`}
                style={{ fontSize: "0.72rem", padding: "0.18rem 0.45rem", borderRadius: "4px" }}
                onClick={() => aplicarPeriodo("SEMANA")}
              >
                Esta Semana
              </button>
              <button
                type="button"
                className={`btn ${periodo === "MES" ? "" : "secondary"}`}
                style={{ fontSize: "0.72rem", padding: "0.18rem 0.45rem", borderRadius: "4px" }}
                onClick={() => aplicarPeriodo("MES")}
              >
                Este Mes
              </button>
              <button
                type="button"
                className={`btn ${periodo === "ULTIMA_REPO" ? "" : "secondary"}`}
                style={{
                  fontSize: "0.72rem",
                  padding: "0.18rem 0.45rem",
                  borderRadius: "4px",
                  borderColor: periodo === "ULTIMA_REPO" ? "var(--accent)" : undefined,
                }}
                onClick={() => aplicarPeriodo("ULTIMA_REPO")}
                title={
                  reporte?.ultimaReposicion
                    ? `Filtra desde el ${new Date(reporte.ultimaReposicion.fecha + "T00:00:00").toLocaleDateString("es-GT")} (Cheque No. ${reporte.ultimaReposicion.numeroDocumento})`
                    : "Desde la última reposición registrada"
                }
              >
                🔄 Última Reposición {reporte?.ultimaReposicion ? `(${reporte.ultimaReposicion.numeroDocumento})` : ""}
              </button>
            </div>

            {/* Formulario Manual Compacto */}
            <form
              onSubmit={handleFiltrarManual}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.35rem",
                flexWrap: "wrap",
              }}
            >
              {puedeElegirAgencia && agencias.length > 0 && (
                <select
                  value={agenciaSel}
                  onChange={(e) => setAgenciaSel(e.target.value)}
                  style={{ fontSize: "0.74rem", padding: "0.18rem 0.35rem", borderRadius: "4px" }}
                  title="Seleccionar Agencia"
                >
                  {agencias.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.nombre}
                    </option>
                  ))}
                </select>
              )}

              <div style={{ display: "flex", alignItems: "center", gap: "0.2rem" }}>
                <span style={{ fontSize: "0.72rem", color: "var(--ink-soft)" }}>Desde:</span>
                <input
                  type="date"
                  value={fechaInicio}
                  onChange={(e) => setFechaInicio(e.target.value)}
                  style={{ fontSize: "0.74rem", padding: "0.15rem 0.3rem", width: "110px" }}
                  required
                />
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "0.2rem" }}>
                <span style={{ fontSize: "0.72rem", color: "var(--ink-soft)" }}>Hasta:</span>
                <input
                  type="date"
                  value={fechaFin}
                  onChange={(e) => setFechaFin(e.target.value)}
                  style={{ fontSize: "0.74rem", padding: "0.15rem 0.3rem", width: "110px" }}
                  required
                />
              </div>

              <select
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
                style={{ fontSize: "0.74rem", padding: "0.18rem 0.35rem", maxWidth: "135px" }}
              >
                <option value="">(Todas)</option>
                {CATEGORIAS.map(([valor, etiqueta]) => (
                  <option key={valor} value={valor}>
                    {etiqueta}
                  </option>
                ))}
              </select>

              <button type="submit" className="btn primary" style={{ fontSize: "0.74rem", padding: "0.2rem 0.55rem" }}>
                Filtrar
              </button>
            </form>
          </div>
        </div>

        {error && <div className="alert error">{error}</div>}

        {cargando && (
          <div style={{ textAlign: "center", padding: "1.5rem", color: "var(--ink-soft)" }}>
            Cargando informe y consolidando comprobantes…
          </div>
        )}

        {/* CONTENIDO DEL INFORME (DISEÑO PROFESIONAL DISTRIBUIDO PARA 1 PÁGINA) */}
        {reporte && !cargando && (
          <div id="caja-chica-reporte-imprimible" className="print-area">
            {/* Encabezado Oficial Imprimible */}
            <div
              style={{
                borderBottom: "2px solid #0f172a",
                paddingBottom: "0.5rem",
                marginBottom: "0.65rem",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                flexWrap: "wrap",
                gap: "0.4rem",
              }}
            >
              <div>
                <div style={{ fontSize: "1.05rem", fontWeight: 800, color: "#065f46", letterSpacing: "0.02em" }}>
                  COOPERATIVA MAYA INVERSIONES FUTURAS R.L. &quot;COMIF-R.L.&quot;
                </div>
                <div style={{ fontSize: "0.92rem", fontWeight: 700, color: "#0284c7", marginTop: "2px" }}>
                  INFORME DE RENDICIÓN Y LIQUIDACIÓN DE GASTOS DE CAJA CHICA
                </div>
                <div style={{ fontSize: "0.78rem", color: "var(--ink-soft)", marginTop: "2px" }}>
                  <strong>Agencia:</strong> {reporte.agencia.nombre} ({reporte.agencia.codigo}) &nbsp;|&nbsp;
                  <strong> Período Auditado:</strong>{" "}
                  {fechaInicio ? new Date(fechaInicio + "T00:00:00").toLocaleDateString("es-GT") : "Inicio"} al{" "}
                  {fechaFin ? new Date(fechaFin + "T00:00:00").toLocaleDateString("es-GT") : "Hoy"}
                  {categoria && ` | Filtrado: ${CATEGORIA_CAJA_CHICA_LABEL[categoria as CategoriaCajaChica] ?? categoria}`}
                </div>
              </div>

              <div style={{ textAlign: "right", fontSize: "0.75rem", color: "var(--ink-soft)" }}>
                <div>
                  <strong>Emisión:</strong> {new Date().toLocaleDateString("es-GT")} {new Date().toLocaleTimeString("es-GT", { hour: "2-digit", minute: "2-digit" })}
                </div>
                <div className="badge" style={{ marginTop: "3px", fontSize: "0.7rem", padding: "0.12rem 0.45rem", background: "rgba(0,0,0,0.06)", fontWeight: 700 }}>
                  Auditoría Interna
                </div>
              </div>
            </div>

            {/* Cintillo Ejecutivo de Cuadre de Caja */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
                gap: "0.45rem",
                marginBottom: "0.65rem",
                background: "var(--paper-raised)",
                padding: "0.5rem 0.65rem",
                borderRadius: "6px",
                border: "1px solid var(--line)",
              }}
            >
              <div style={{ padding: "0.25rem 0.45rem", borderRight: "1px solid var(--line)" }}>
                <span style={{ fontSize: "0.68rem", color: "var(--ink-soft)", display: "block", textTransform: "uppercase", fontWeight: 600 }}>
                  Gastos Justificados ({reporte.egresos.length})
                </span>
                <strong className="mono" style={{ color: "#dc2626", fontSize: "1.1rem", display: "block", marginTop: "2px" }}>
                  − {formatoQ(reporte.totalEgresosPeriodo)}
                </strong>
              </div>

              <div style={{ padding: "0.25rem 0.45rem", borderRight: "1px solid var(--line)" }}>
                <span style={{ fontSize: "0.68rem", color: "var(--ink-soft)", display: "block", textTransform: "uppercase", fontWeight: 600 }}>
                  Reposiciones Recibidas ({reporte.ingresos.length})
                </span>
                <strong className="mono" style={{ color: "#16a34a", fontSize: "1.1rem", display: "block", marginTop: "2px" }}>
                  + {formatoQ(reporte.totalIngresosPeriodo)}
                </strong>
              </div>

              <div style={{ padding: "0.25rem 0.45rem", borderRight: "1px solid var(--line)" }}>
                <span style={{ fontSize: "0.68rem", color: "var(--ink-soft)", display: "block", textTransform: "uppercase", fontWeight: 600 }}>
                  Efectivo Físico en Caja
                </span>
                <strong className="mono" style={{ color: "var(--ink)", fontSize: "1.1rem", display: "block", marginTop: "2px" }}>
                  {formatoQ(reporte.saldoDisponibleActual)}
                </strong>
              </div>

              <div style={{ padding: "0.25rem 0.45rem", background: "#fef2f2", borderRadius: "6px", border: "1px solid #fca5a5" }}>
                <span style={{ fontSize: "0.68rem", color: "#991b1b", display: "block", textTransform: "uppercase", fontWeight: 700 }}>
                  Monto a Reponer
                </span>
                <strong className="mono" style={{ color: "#b91c1c", fontSize: "1.1rem", display: "block", marginTop: "2px" }}>
                  {formatoQ(reporte.totalEgresosPeriodo)}
                </strong>
              </div>
            </div>

            {/* SECCIÓN 1: Detalle Cronológico de Comprobantes de Gasto (Egresos) */}
            <div style={{ marginBottom: "0.65rem" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  borderBottom: "1.5px solid var(--line)",
                  paddingBottom: "0.25rem",
                  marginBottom: "0.35rem",
                }}
              >
                <strong style={{ fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "0.3rem", color: "var(--ink)" }}>
                  <span>🛒</span> 1. Detalle de Comprobantes de Gasto (Egresos)
                </strong>
                <span style={{ fontSize: "0.75rem", color: "var(--ink-soft)", fontWeight: 600 }}>
                  {reporte.egresos.length} comprobante(s)
                </span>
              </div>

              <div className="table-wrap" style={{ border: "1px solid var(--line)", borderRadius: "6px", overflowX: "auto", width: "100%" }}>
                <table style={{ fontSize: "0.78rem", width: "100%", borderCollapse: "collapse", tableLayout: "auto" }}>
                  <thead>
                    <tr style={{ background: "var(--paper-raised)" }}>
                      <th style={{ width: "30px", textAlign: "center", padding: "5px 6px" }}>#</th>
                      <th style={{ width: "85px", padding: "5px 6px" }}>Fecha</th>
                      <th style={{ width: "110px", padding: "5px 6px" }}>No. Doc.</th>
                      <th style={{ width: "190px", padding: "5px 6px" }}>Proveedor / Beneficiario</th>
                      <th style={{ width: "150px", padding: "5px 6px" }}>Categoría</th>
                      <th style={{ padding: "5px 6px" }}>Descripción</th>
                      <th style={{ width: "110px", textAlign: "right", padding: "5px 6px" }}>Monto (Q)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reporte.egresos.map((c, index) => (
                      <tr key={c.id}>
                        <td style={{ textAlign: "center", color: "var(--ink-soft)", padding: "5px 6px" }}>{index + 1}</td>
                        <td className="mono" style={{ padding: "5px 6px" }}>{new Date(c.fecha).toLocaleDateString("es-GT")}</td>
                        <td style={{ fontWeight: 600, padding: "5px 6px" }}>{c.numero_documento || "DTE"}</td>
                        <td style={{ padding: "5px 6px" }}>{c.beneficiario}</td>
                        <td style={{ padding: "5px 6px" }}>
                          <span style={{ fontSize: "0.74rem", fontWeight: 600 }}>
                            {c.categoria ? CATEGORIA_CAJA_CHICA_LABEL[c.categoria] ?? c.categoria : "Sin categoría"}
                          </span>
                        </td>
                        <td style={{ padding: "5px 6px" }}>{c.descripcion}</td>
                        <td className="mono" style={{ textAlign: "right", color: "#dc2626", fontWeight: 700, padding: "5px 6px" }}>
                          − {formatoQ(c.monto)}
                        </td>
                      </tr>
                    ))}
                    {reporte.egresos.length === 0 && (
                      <tr>
                        <td colSpan={7} style={{ textAlign: "center", padding: "0.85rem", color: "var(--ink-soft)" }}>
                          No hay egresos registrados en el período seleccionado.
                        </td>
                      </tr>
                    )}
                  </tbody>
                  {reporte.egresos.length > 0 && (
                    <tfoot>
                      <tr style={{ fontWeight: 800, background: "rgba(0,0,0,0.04)", borderTop: "2px solid #0f172a" }}>
                        <td colSpan={6} style={{ textAlign: "right", padding: "6px 8px" }}>
                          TOTAL GASTOS EJECUTADOS:
                        </td>
                        <td className="mono" style={{ textAlign: "right", color: "#dc2626", fontSize: "0.92rem", padding: "6px 8px" }}>
                          {formatoQ(reporte.totalEgresosPeriodo)}
                        </td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>

            {/* SECCIÓN LADO A LADO (2 Columnas: Categorías a la Izquierda | Reposiciones y Cuadre a la Derecha) */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "0.65rem",
                marginBottom: "0.65rem",
                alignItems: "start",
              }}
            >
              {/* Columna Izquierda: 2. Subtotales por Categoría */}
              <div>
                <div
                  style={{
                    borderBottom: "1.5px solid var(--line)",
                    paddingBottom: "0.25rem",
                    marginBottom: "0.35rem",
                  }}
                >
                  <strong style={{ fontSize: "0.84rem", display: "flex", alignItems: "center", gap: "0.3rem", color: "var(--ink)" }}>
                    <span>📊</span> 2. Resumen por Categoría
                  </strong>
                </div>

                <div className="table-wrap" style={{ border: "1px solid var(--line)", borderRadius: "6px", overflowX: "auto", width: "100%" }}>
                  <table style={{ fontSize: "0.75rem", width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ background: "var(--paper-raised)" }}>
                        <th style={{ padding: "4px 5px" }}>Categoría Contable</th>
                        <th style={{ width: "40px", textAlign: "center", padding: "4px 5px" }}>Cant.</th>
                        <th style={{ width: "85px", textAlign: "right", padding: "4px 5px" }}>Subtotal</th>
                        <th style={{ width: "65px", textAlign: "right", padding: "4px 5px" }}>% Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reporte.totalesPorCategoria.map((t) => {
                        const nombre =
                          t.categoria === "SIN_CATEGORIA"
                            ? "Sin categoría"
                            : CATEGORIA_CAJA_CHICA_LABEL[t.categoria as CategoriaCajaChica] ?? t.categoria;
                        return (
                          <tr key={t.categoria}>
                            <td style={{ fontWeight: 600, padding: "4px 5px" }}>{nombre}</td>
                            <td style={{ textAlign: "center", padding: "4px 5px" }}>{t.cantidad}</td>
                            <td className="mono" style={{ textAlign: "right", fontWeight: 700, padding: "4px 5px" }}>
                              {formatoQ(t.total)}
                            </td>
                            <td style={{ textAlign: "right", fontWeight: 600, padding: "4px 5px" }}>
                              {t.porcentaje.toFixed(1)}%
                            </td>
                          </tr>
                        );
                      })}
                      {reporte.totalesPorCategoria.length === 0 && (
                        <tr>
                          <td colSpan={4} style={{ textAlign: "center", padding: "0.6rem", color: "var(--ink-soft)" }}>
                            Sin movimientos.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Columna Derecha: 3. Reposiciones + 4. Cuadre */}
              <div>
                {/* 3. Reposiciones de Fondo */}
                <div
                  style={{
                    borderBottom: "1.5px solid var(--line)",
                    paddingBottom: "0.25rem",
                    marginBottom: "0.35rem",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <strong style={{ fontSize: "0.84rem", color: "#166534", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                    <span>📥</span> 3. Reposiciones Recibidas (Cheques)
                  </strong>
                  <span style={{ fontSize: "0.72rem", color: "#166534", fontWeight: 700 }}>Ingresos</span>
                </div>

                <div className="table-wrap" style={{ border: "1px solid #86efac", borderRadius: "6px", marginBottom: "0.5rem", overflowX: "auto", width: "100%" }}>
                  <table style={{ fontSize: "0.75rem", width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ background: "#f0fdf4" }}>
                        <th style={{ width: "70px", padding: "4px 5px" }}>Fecha</th>
                        <th style={{ padding: "4px 5px" }}>No. Cheque / Origen</th>
                        <th style={{ width: "85px", textAlign: "right", padding: "4px 5px" }}>Monto</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reporte.ingresos.map((c) => (
                        <tr key={c.id}>
                          <td className="mono" style={{ padding: "4px 5px" }}>{new Date(c.fecha).toLocaleDateString("es-GT")}</td>
                          <td style={{ padding: "4px 5px" }}>
                            <strong>No. CH. {c.numero_documento}</strong> ({c.beneficiario})
                          </td>
                          <td className="mono" style={{ textAlign: "right", color: "#16a34a", fontWeight: 700, padding: "4px 5px" }}>
                            + {formatoQ(c.monto)}
                          </td>
                        </tr>
                      ))}
                      {reporte.ingresos.length === 0 && (
                        <tr>
                          <td colSpan={3} style={{ textAlign: "center", padding: "0.5rem", color: "var(--ink-soft)" }}>
                            Sin reposiciones en este período.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* 4. Cuadre y Conciliación Matemático */}
                <div
                  style={{
                    background: "var(--paper-raised)",
                    padding: "0.5rem 0.65rem",
                    borderRadius: "6px",
                    border: "1px solid var(--line)",
                    fontSize: "0.76rem",
                  }}
                >
                  <strong style={{ fontSize: "0.78rem", display: "block", marginBottom: "0.25rem", color: "var(--ink)" }}>
                    ⚖️ 4. Cuadre de Caja Chica
                  </strong>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.35rem" }}>
                    <div>
                      <span style={{ color: "var(--ink-soft)" }}>(+) Saldo Inicial:</span>{" "}
                      <strong>{formatoQ(reporte.saldoAnterior)}</strong>
                    </div>
                    <div>
                      <span style={{ color: "#166534" }}>(+) Reposiciones:</span>{" "}
                      <strong style={{ color: "#166534" }}>+ {formatoQ(reporte.totalIngresosPeriodo)}</strong>
                    </div>
                    <div>
                      <span style={{ color: "#991b1b" }}>(−) Gastos:</span>{" "}
                      <strong style={{ color: "#dc2626" }}>− {formatoQ(reporte.totalEgresosPeriodo)}</strong>
                    </div>
                    <div style={{ background: "#dcfce7", padding: "2px 5px", borderRadius: "4px" }}>
                      <span style={{ color: "#166534", fontWeight: 700 }}>(=) Efectivo:</span>{" "}
                      <strong style={{ color: "#166534" }}>{formatoQ(reporte.saldoFinalPeriodo)}</strong>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* SECCIÓN 5: Bloque de Firmas Oficiales */}
            <div
              className="firmas-section"
              style={{
                marginTop: "1.1rem",
                paddingTop: "0.65rem",
                borderTop: "1.5px dashed #94a3b8",
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: "1.2rem",
                textAlign: "center",
                pageBreakInside: "avoid",
              }}
            >
              <div>
                <div style={{ borderBottom: "1.5px solid #000", height: "42px", marginBottom: "0.3rem" }} />
                <div style={{ fontWeight: 700, fontSize: "0.78rem", color: "var(--ink)" }}>Elaborado por</div>
                <div style={{ fontSize: "0.72rem", color: "var(--ink-soft)" }}>Cajero / Custodio</div>
              </div>

              <div>
                <div style={{ borderBottom: "1.5px solid #000", height: "42px", marginBottom: "0.3rem" }} />
                <div style={{ fontWeight: 700, fontSize: "0.78rem", color: "var(--ink)" }}>Revisado por</div>
                <div style={{ fontSize: "0.72rem", color: "var(--ink-soft)" }}>Jefe de Agencia / Supervisor</div>
              </div>

              <div>
                <div style={{ borderBottom: "1.5px solid #000", height: "42px", marginBottom: "0.3rem" }} />
                <div style={{ fontWeight: 700, fontSize: "0.78rem", color: "var(--ink)" }}>Aprobado por</div>
                <div style={{ fontSize: "0.72rem", color: "var(--ink-soft)" }}>Gerencia General / Auditoría</div>
              </div>
            </div>

            <div style={{ textAlign: "center", marginTop: "0.65rem", fontSize: "0.68rem", color: "#94a3b8" }}>
              Sistema Integral COOP COMIF-R.L. · Documento Oficial de Control y Liquidación de Caja Chica
            </div>

            {/* ESTILOS ESPECÍFICOS DE IMPRESIÓN PARA 1 SOLA PÁGINA EXACTA SIN PÁGINAS EN BLANCO */}
            <style>{`
              @media print {
                @page {
                  size: letter portrait;
                  margin: 6mm 10mm;
                }
                body {
                  background: #ffffff !important;
                  color: #0f172a !important;
                  -webkit-print-color-adjust: exact !important;
                  print-color-adjust: exact !important;
                }
                body * {
                  visibility: hidden;
                }
                #caja-chica-reporte-imprimible,
                #caja-chica-reporte-imprimible * {
                  visibility: visible !important;
                }
                #caja-chica-reporte-imprimible {
                  position: absolute !important;
                  left: 0 !important;
                  top: 0 !important;
                  width: 100% !important;
                  max-width: 100% !important;
                  margin: 0 !important;
                  padding: 0 !important;
                  background: #ffffff !important;
                  display: flex !important;
                  flex-direction: column !important;
                  box-sizing: border-box !important;
                }
                .no-print {
                  display: none !important;
                  visibility: hidden !important;
                }
                .table-wrap {
                  box-shadow: none !important;
                  overflow: visible !important;
                }
                table {
                  width: 100% !important;
                  border-collapse: collapse !important;
                }
                th, td {
                  border: 1px solid #cbd5e1 !important;
                }
                .firmas-section {
                  page-break-inside: avoid !important;
                  break-inside: avoid !important;
                }
              }
            `}</style>
          </div>
        )}

        {/* Botón flotante siempre accesible en pantalla */}
        {reporte && !cargando && (
          <div className="no-print" style={{ position: "fixed", bottom: "1.5rem", right: "1.5rem", zIndex: 999 }}>
            <button
              type="button"
              className="btn"
              style={{
                background: "linear-gradient(135deg, #059669 0%, #047857 100%)",
                color: "#ffffff",
                fontWeight: 800,
                fontSize: "0.85rem",
                padding: "0.5rem 1.1rem",
                borderRadius: "30px",
                boxShadow: "0 4px 14px rgba(0,0,0,0.3)",
                display: "flex",
                alignItems: "center",
                gap: "0.4rem",
                cursor: "pointer",
                border: "1px solid #34d399",
              }}
              onClick={() => window.print()}
              title="Imprimir / Guardar PDF en 1 hoja"
            >
              🖨️ Imprimir / Guardar PDF
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export { CajaChicaReporteModal as CajaChicaReporteView };
