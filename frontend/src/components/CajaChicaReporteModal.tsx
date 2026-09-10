import { useEffect, useState } from "react";
import { api, mensajeError } from "../lib/api";
import { CATEGORIA_CAJA_CHICA_LABEL } from "../types";
import { formatearQuetzales } from "../lib/formatters";
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
    lineas.push(`INFORME DE RENDICION DE GASTOS DE CAJA CHICA - MIF COOP`);
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
      className="caja-chica-modal-overlay"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.75)",
        zIndex: 9999,
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start",
        overflowY: "auto",
        padding: "1rem 0.5rem",
      }}
    >
      <div
        className="card caja-chica-modal-card"
        style={{
          width: "100%",
          maxWidth: "1050px",
          background: "var(--paper)",
          borderRadius: "10px",
          boxShadow: "0 20px 40px -10px rgba(0, 0, 0, 0.5)",
          border: "1px solid var(--line)",
          padding: "1.2rem",
          margin: "auto",
        }}
      >
        {/* Cabecera del Modal (no-print) */}
        <div
          className="no-print"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderBottom: "1px solid var(--line)",
            paddingBottom: "0.75rem",
            marginBottom: "0.85rem",
            gap: "0.75rem",
            flexWrap: "wrap",
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <span style={{ fontSize: "1.3rem" }}>📄</span>
              <h2 style={{ margin: 0, fontSize: "1.2rem" }}>Informe de Rendición de Gastos de Caja Chica</h2>
            </div>
            <p style={{ margin: "0.15rem 0 0", fontSize: "0.8rem", color: "var(--ink-soft)" }}>
              Liquidación y cuadre optimizado para 1 página carta.
            </p>
          </div>

          <div style={{ display: "flex", gap: "0.4rem", alignItems: "center" }}>
            <button
              type="button"
              className="btn secondary"
              style={{ padding: "0.35rem 0.75rem", fontSize: "0.82rem" }}
              onClick={exportarCSV}
              disabled={!reporte || reporte.egresos.length === 0}
              title="Descargar datos en Excel CSV"
            >
              📥 Excel (CSV)
            </button>
            <button
              type="button"
              className="btn"
              style={{ padding: "0.35rem 0.85rem", fontSize: "0.82rem" }}
              onClick={() => window.print()}
              disabled={!reporte}
              title="Imprimir informe en 1 hoja o guardar en PDF"
            >
              🖨️ Imprimir / Guardar PDF
            </button>
            <button
              type="button"
              className="btn secondary"
              style={{ padding: "0.35rem 0.65rem", fontSize: "0.9rem" }}
              onClick={onClose}
              title="Cerrar ventana"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Barra de Filtros de Período (no-print) */}
        <div
          className="no-print card"
          style={{
            background: "var(--paper-raised)",
            padding: "0.75rem",
            marginBottom: "1rem",
            border: "1px solid var(--line)",
          }}
        >
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", alignItems: "center", marginBottom: "0.5rem" }}>
            <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--ink)" }}>Período rápido:</span>
            <div style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap" }}>
              <button
                type="button"
                className={`btn ${periodo === "HOY" ? "" : "secondary"}`}
                style={{ fontSize: "0.75rem", padding: "0.2rem 0.55rem", borderRadius: "5px" }}
                onClick={() => aplicarPeriodo("HOY")}
              >
                📅 Hoy
              </button>
              <button
                type="button"
                className={`btn ${periodo === "SEMANA" ? "" : "secondary"}`}
                style={{ fontSize: "0.75rem", padding: "0.2rem 0.55rem", borderRadius: "5px" }}
                onClick={() => aplicarPeriodo("SEMANA")}
              >
                📆 Esta Semana
              </button>
              <button
                type="button"
                className={`btn ${periodo === "MES" ? "" : "secondary"}`}
                style={{ fontSize: "0.75rem", padding: "0.2rem 0.55rem", borderRadius: "5px" }}
                onClick={() => aplicarPeriodo("MES")}
              >
                📊 Este Mes
              </button>
              <button
                type="button"
                className={`btn ${periodo === "ULTIMA_REPO" ? "" : "secondary"}`}
                style={{
                  fontSize: "0.75rem",
                  padding: "0.2rem 0.55rem",
                  borderRadius: "5px",
                  borderColor: periodo === "ULTIMA_REPO" ? "var(--accent)" : undefined,
                }}
                onClick={() => aplicarPeriodo("ULTIMA_REPO")}
                title={
                  reporte?.ultimaReposicion
                    ? `Filtra desde el ${new Date(reporte.ultimaReposicion.fecha + "T00:00:00").toLocaleDateString("es-GT")} (Cheque No. ${reporte.ultimaReposicion.numeroDocumento})`
                    : "Desde la última reposición registrada"
                }
              >
                🔄 Desde última reposición {reporte?.ultimaReposicion ? `(${reporte.ultimaReposicion.numeroDocumento})` : ""}
              </button>
            </div>
          </div>

          <form
            onSubmit={handleFiltrarManual}
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "0.5rem",
              alignItems: "flex-end",
            }}
          >
            {puedeElegirAgencia && agencias.length > 0 && (
              <div className="field" style={{ minWidth: "140px", marginBottom: 0 }}>
                <label style={{ fontSize: "0.72rem" }}>Agencia</label>
                <select
                  value={agenciaSel}
                  onChange={(e) => setAgenciaSel(e.target.value)}
                  style={{ fontSize: "0.8rem", padding: "0.25rem 0.4rem" }}
                >
                  {agencias.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.nombre}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="field" style={{ minWidth: "125px", marginBottom: 0 }}>
              <label style={{ fontSize: "0.72rem" }}>Fecha Desde</label>
              <input
                type="date"
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
                style={{ fontSize: "0.8rem", padding: "0.25rem 0.4rem" }}
                required
              />
            </div>

            <div className="field" style={{ minWidth: "125px", marginBottom: 0 }}>
              <label style={{ fontSize: "0.72rem" }}>Fecha Hasta</label>
              <input
                type="date"
                value={fechaFin}
                onChange={(e) => setFechaFin(e.target.value)}
                style={{ fontSize: "0.8rem", padding: "0.25rem 0.4rem" }}
                required
              />
            </div>

            <div className="field" style={{ minWidth: "160px", marginBottom: 0 }}>
              <label style={{ fontSize: "0.72rem" }}>Categoría de gasto</label>
              <select
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
                style={{ fontSize: "0.8rem", padding: "0.25rem 0.4rem" }}
              >
                <option value="">(Todas las categorías)</option>
                {CATEGORIAS.map(([valor, etiqueta]) => (
                  <option key={valor} value={valor}>
                    {etiqueta}
                  </option>
                ))}
              </select>
            </div>

            <button type="submit" className="btn" style={{ fontSize: "0.8rem", padding: "0.35rem 0.75rem" }}>
              Filtrar
            </button>
          </form>
        </div>

        {error && <div className="alert error">{error}</div>}

        {cargando && (
          <div style={{ textAlign: "center", padding: "1.5rem", color: "var(--ink-soft)" }}>
            Cargando informe y consolidando comprobantes…
          </div>
        )}

        {/* CONTENIDO DEL INFORME (DISEÑO ULTRACOMPACTO PARA 1 PÁGINA) */}
        {reporte && !cargando && (
          <div className="print-area">
            {/* Encabezado Oficial Imprimible */}
            <div
              style={{
                borderBottom: "1.5px solid #0f172a",
                paddingBottom: "0.4rem",
                marginBottom: "0.5rem",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
              }}
            >
              <div>
                <div style={{ fontSize: "0.95rem", fontWeight: 800, color: "var(--ink)", letterSpacing: "-0.01em" }}>
                  COOPERATIVA INTEGRAL DE AHORRO Y CRÉDITO &quot;MAYA INVERSIONES FUTURAS&quot; R.L. (MIF)
                </div>
                <div style={{ fontSize: "0.88rem", fontWeight: 700, color: "#0284c7" }}>
                  INFORME DE RENDICIÓN Y LIQUIDACIÓN DE GASTOS DE CAJA CHICA
                </div>
                <div style={{ fontSize: "0.75rem", color: "var(--ink-soft)", marginTop: "1px" }}>
                  <strong>Agencia:</strong> {reporte.agencia.nombre} ({reporte.agencia.codigo}) &nbsp;|&nbsp;
                  <strong> Período Auditado:</strong>{" "}
                  {fechaInicio ? new Date(fechaInicio + "T00:00:00").toLocaleDateString("es-GT") : "Inicio"} al{" "}
                  {fechaFin ? new Date(fechaFin + "T00:00:00").toLocaleDateString("es-GT") : "Hoy"}
                  {categoria && ` | Filtrado: ${CATEGORIA_CAJA_CHICA_LABEL[categoria as CategoriaCajaChica] ?? categoria}`}
                </div>
              </div>

              <div style={{ textAlign: "right", fontSize: "0.72rem", color: "var(--ink-soft)" }}>
                <div>
                  <strong>Emisión:</strong> {new Date().toLocaleDateString("es-GT")} {new Date().toLocaleTimeString("es-GT", { hour: "2-digit", minute: "2-digit" })}
                </div>
                <div className="badge" style={{ marginTop: "2px", fontSize: "0.68rem", padding: "0.1rem 0.35rem", background: "rgba(0,0,0,0.06)" }}>
                  Auditoría Interna
                </div>
              </div>
            </div>

            {/* Cintillo Ejecutivo de Cuadre de Caja (1 Sola Fila Horizontal Compacta) */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4, 1fr)",
                gap: "0.4rem",
                marginBottom: "0.6rem",
                background: "var(--paper-raised)",
                padding: "0.4rem",
                borderRadius: "6px",
                border: "1px solid var(--line)",
              }}
            >
              <div style={{ padding: "0.25rem 0.5rem", borderRight: "1px solid var(--line)" }}>
                <span style={{ fontSize: "0.68rem", color: "var(--ink-soft)", display: "block", textTransform: "uppercase" }}>
                  Gastos Justificados ({reporte.egresos.length})
                </span>
                <strong className="mono" style={{ color: "#dc2626", fontSize: "1.05rem" }}>
                  − {formatearQuetzales(reporte.totalEgresosPeriodo)}
                </strong>
              </div>

              <div style={{ padding: "0.25rem 0.5rem", borderRight: "1px solid var(--line)" }}>
                <span style={{ fontSize: "0.68rem", color: "var(--ink-soft)", display: "block", textTransform: "uppercase" }}>
                  Reposiciones Recibidas ({reporte.ingresos.length})
                </span>
                <strong className="mono" style={{ color: "#16a34a", fontSize: "1.05rem" }}>
                  + {formatearQuetzales(reporte.totalIngresosPeriodo)}
                </strong>
              </div>

              <div style={{ padding: "0.25rem 0.5rem", borderRight: "1px solid var(--line)" }}>
                <span style={{ fontSize: "0.68rem", color: "var(--ink-soft)", display: "block", textTransform: "uppercase" }}>
                  Efectivo Físico en Caja
                </span>
                <strong className="mono" style={{ color: "var(--ink)", fontSize: "1.05rem" }}>
                  {formatearQuetzales(reporte.saldoDisponibleActual)}
                </strong>
              </div>

              <div style={{ padding: "0.25rem 0.5rem", background: "#fef2f2", borderRadius: "4px" }}>
                <span style={{ fontSize: "0.68rem", color: "#991b1b", display: "block", textTransform: "uppercase", fontWeight: 700 }}>
                  Monto a Reponer
                </span>
                <strong className="mono" style={{ color: "#b91c1c", fontSize: "1.05rem" }}>
                  {formatearQuetzales(reporte.totalEgresosPeriodo)}
                </strong>
              </div>
            </div>

            {/* SECCIÓN 1: Detalle Cronológico de Comprobantes de Gasto (Egresos) */}
            <div style={{ marginBottom: "0.6rem" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  borderBottom: "1px solid var(--line)",
                  paddingBottom: "0.2rem",
                  marginBottom: "0.35rem",
                }}
              >
                <strong style={{ fontSize: "0.82rem", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                  <span>🛒</span> 1. Detalle de Comprobantes de Gasto (Egresos)
                </strong>
                <span style={{ fontSize: "0.72rem", color: "var(--ink-soft)" }}>
                  {reporte.egresos.length} comprobante(s)
                </span>
              </div>

              <div className="table-wrap" style={{ border: "1px solid var(--line)" }}>
                <table style={{ fontSize: "0.75rem", width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "var(--paper-raised)" }}>
                      <th style={{ width: "25px", textAlign: "center", padding: "2px 4px" }}>#</th>
                      <th style={{ width: "70px", padding: "2px 4px" }}>Fecha</th>
                      <th style={{ width: "75px", padding: "2px 4px" }}>No. Doc.</th>
                      <th style={{ width: "140px", padding: "2px 4px" }}>Proveedor / Beneficiario</th>
                      <th style={{ width: "135px", padding: "2px 4px" }}>Categoría</th>
                      <th style={{ padding: "2px 4px" }}>Descripción</th>
                      <th style={{ width: "95px", textAlign: "right", padding: "2px 4px" }}>Monto (Q)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reporte.egresos.map((c, index) => (
                      <tr key={c.id}>
                        <td style={{ textAlign: "center", color: "var(--ink-soft)", padding: "2px 4px" }}>{index + 1}</td>
                        <td className="mono" style={{ padding: "2px 4px" }}>{new Date(c.fecha).toLocaleDateString("es-GT")}</td>
                        <td style={{ fontWeight: 600, padding: "2px 4px" }}>{c.numero_documento || "DTE"}</td>
                        <td style={{ padding: "2px 4px" }}>{c.beneficiario}</td>
                        <td style={{ padding: "2px 4px" }}>
                          <span style={{ fontSize: "0.7rem", fontWeight: 600 }}>
                            {c.categoria ? CATEGORIA_CAJA_CHICA_LABEL[c.categoria] ?? c.categoria : "Sin categoría"}
                          </span>
                        </td>
                        <td style={{ padding: "2px 4px" }}>{c.descripcion}</td>
                        <td className="mono" style={{ textAlign: "right", color: "#dc2626", fontWeight: 700, padding: "2px 4px" }}>
                          − {formatearQuetzales(c.monto)}
                        </td>
                      </tr>
                    ))}
                    {reporte.egresos.length === 0 && (
                      <tr>
                        <td colSpan={7} style={{ textAlign: "center", padding: "0.75rem", color: "var(--ink-soft)" }}>
                          No hay egresos registrados en el período seleccionado.
                        </td>
                      </tr>
                    )}
                  </tbody>
                  {reporte.egresos.length > 0 && (
                    <tfoot>
                      <tr style={{ fontWeight: 800, background: "rgba(0,0,0,0.04)", borderTop: "1.5px solid var(--line)" }}>
                        <td colSpan={6} style={{ textAlign: "right", padding: "3px 6px" }}>
                          TOTAL GASTOS EJECUTADOS:
                        </td>
                        <td className="mono" style={{ textAlign: "right", color: "#dc2626", fontSize: "0.85rem", padding: "3px 6px" }}>
                          {formatearQuetzales(reporte.totalEgresosPeriodo)}
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
                gridTemplateColumns: "1.05fr 0.95fr",
                gap: "0.6rem",
                marginBottom: "0.6rem",
                alignItems: "start",
              }}
            >
              {/* Columna Izquierda: 2. Subtotales por Categoría */}
              <div>
                <div
                  style={{
                    borderBottom: "1px solid var(--line)",
                    paddingBottom: "0.2rem",
                    marginBottom: "0.3rem",
                  }}
                >
                  <strong style={{ fontSize: "0.8rem", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                    <span>📊</span> 2. Resumen por Categoría
                  </strong>
                </div>

                <div className="table-wrap" style={{ border: "1px solid var(--line)" }}>
                  <table style={{ fontSize: "0.72rem", width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ background: "var(--paper-raised)" }}>
                        <th style={{ padding: "2px 4px" }}>Categoría Contable</th>
                        <th style={{ width: "40px", textAlign: "center", padding: "2px 4px" }}>Cant.</th>
                        <th style={{ width: "90px", textAlign: "right", padding: "2px 4px" }}>Subtotal</th>
                        <th style={{ width: "70px", textAlign: "right", padding: "2px 4px" }}>% Total</th>
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
                            <td style={{ fontWeight: 600, padding: "2px 4px" }}>{nombre}</td>
                            <td style={{ textAlign: "center", padding: "2px 4px" }}>{t.cantidad}</td>
                            <td className="mono" style={{ textAlign: "right", fontWeight: 700, padding: "2px 4px" }}>
                              {formatearQuetzales(t.total)}
                            </td>
                            <td style={{ textAlign: "right", fontWeight: 600, padding: "2px 4px" }}>
                              {t.porcentaje.toFixed(1)}%
                            </td>
                          </tr>
                        );
                      })}
                      {reporte.totalesPorCategoria.length === 0 && (
                        <tr>
                          <td colSpan={4} style={{ textAlign: "center", padding: "0.5rem", color: "var(--ink-soft)" }}>
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
                    borderBottom: "1px solid var(--line)",
                    paddingBottom: "0.2rem",
                    marginBottom: "0.3rem",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <strong style={{ fontSize: "0.8rem", color: "#166534", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                    <span>📥</span> 3. Reposiciones Recibidas (Cheques)
                  </strong>
                  <span style={{ fontSize: "0.68rem", color: "#166534", fontWeight: 700 }}>Ingresos</span>
                </div>

                <div className="table-wrap" style={{ border: "1px solid #86efac", marginBottom: "0.45rem" }}>
                  <table style={{ fontSize: "0.72rem", width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ background: "#f0fdf4" }}>
                        <th style={{ width: "65px", padding: "2px 4px" }}>Fecha</th>
                        <th style={{ padding: "2px 4px" }}>No. Cheque / Origen</th>
                        <th style={{ width: "85px", textAlign: "right", padding: "2px 4px" }}>Monto</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reporte.ingresos.map((c) => (
                        <tr key={c.id}>
                          <td className="mono" style={{ padding: "2px 4px" }}>{new Date(c.fecha).toLocaleDateString("es-GT")}</td>
                          <td style={{ padding: "2px 4px" }}>
                            <strong>No. CH. {c.numero_documento}</strong> ({c.beneficiario})
                          </td>
                          <td className="mono" style={{ textAlign: "right", color: "#16a34a", fontWeight: 700, padding: "2px 4px" }}>
                            + {formatearQuetzales(c.monto)}
                          </td>
                        </tr>
                      ))}
                      {reporte.ingresos.length === 0 && (
                        <tr>
                          <td colSpan={3} style={{ textAlign: "center", padding: "0.4rem", color: "var(--ink-soft)" }}>
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
                    padding: "0.35rem 0.5rem",
                    borderRadius: "5px",
                    border: "1px solid var(--line)",
                    fontSize: "0.72rem",
                  }}
                >
                  <strong style={{ fontSize: "0.75rem", display: "block", marginBottom: "0.2rem" }}>
                    ⚖️ 4. Cuadre de Caja Chica
                  </strong>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.25rem" }}>
                    <div>
                      <span style={{ color: "var(--ink-soft)" }}>(+) Saldo Inicial:</span>{" "}
                      <strong>{formatearQuetzales(reporte.saldoAnterior)}</strong>
                    </div>
                    <div>
                      <span style={{ color: "#166534" }}>(+) Reposiciones:</span>{" "}
                      <strong style={{ color: "#166534" }}>+ {formatearQuetzales(reporte.totalIngresosPeriodo)}</strong>
                    </div>
                    <div>
                      <span style={{ color: "#991b1b" }}>(−) Gastos:</span>{" "}
                      <strong style={{ color: "#dc2626" }}>− {formatearQuetzales(reporte.totalEgresosPeriodo)}</strong>
                    </div>
                    <div style={{ background: "#dcfce7", padding: "1px 4px", borderRadius: "3px" }}>
                      <span style={{ color: "#166534", fontWeight: 700 }}>(=) Efectivo:</span>{" "}
                      <strong style={{ color: "#166534" }}>{formatearQuetzales(reporte.saldoFinalPeriodo)}</strong>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* SECCIÓN 5: Bloque de Firmas Oficiales Ultracompacto */}
            <div
              style={{
                marginTop: "1rem",
                paddingTop: "0.5rem",
                borderTop: "1px dashed var(--line)",
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: "1rem",
                textAlign: "center",
                pageBreakInside: "avoid",
              }}
            >
              <div>
                <div style={{ borderBottom: "1px solid #000", height: "26px", marginBottom: "0.2rem" }} />
                <div style={{ fontWeight: 700, fontSize: "0.75rem" }}>Elaborado por</div>
                <div style={{ fontSize: "0.68rem", color: "var(--ink-soft)" }}>Cajero / Custodio</div>
              </div>

              <div>
                <div style={{ borderBottom: "1px solid #000", height: "26px", marginBottom: "0.2rem" }} />
                <div style={{ fontWeight: 700, fontSize: "0.75rem" }}>Revisado por</div>
                <div style={{ fontSize: "0.68rem", color: "var(--ink-soft)" }}>Jefe de Agencia / Supervisor</div>
              </div>

              <div>
                <div style={{ borderBottom: "1px solid #000", height: "26px", marginBottom: "0.2rem" }} />
                <div style={{ fontWeight: 700, fontSize: "0.75rem" }}>Aprobado por</div>
                <div style={{ fontSize: "0.68rem", color: "var(--ink-soft)" }}>Gerencia General / Auditoría</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
