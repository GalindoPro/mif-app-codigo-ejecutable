import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { api, mensajeError } from "../lib/api";
import { formatoQ } from "../types";
import type { AportacionSocio } from "../types";
import { formatearDPI } from "../lib/formatters";

export default function AportacionesList() {
  const [aportaciones, setAportaciones] = useState<AportacionSocio[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const filtroPeriodo = "ACTUAL_2026";
  const [filtroAno, setFiltroAno] = useState<string>("");
  const [fechaDesde, setFechaDesde] = useState<string>("");
  const [fechaHasta, setFechaHasta] = useState<string>("");
  const [filtroEstadoAportacion, setFiltroEstadoAportacion] = useState<"CUBIERTOS" | "PENDIENTES" | "TODOS">("CUBIERTOS");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  function cargar() {
    api
      .get<AportacionSocio[]>("/socios/aportaciones", {
        params: { q: q || undefined },
      })
      .then(({ data }) => setAportaciones(data))
      .catch((err) => setError(mensajeError(err)));
  }

  useEffect(() => {
    setPage(1);
    const timer = setTimeout(cargar, 200);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const esAportacion2026 = (a: AportacionSocio) => {
    if (!a.fecha_ingreso) return false;
    const f = a.fecha_ingreso.includes("T") ? a.fecha_ingreso.split("T")[0] : a.fecha_ingreso;
    return f.startsWith("2026") || f >= "2026-01-01";
  };

  const aportacionesActuales = useMemo(() => aportaciones?.filter(esAportacion2026) ?? [], [aportaciones]);
  const aportacionesHistoricas = useMemo(() => aportaciones?.filter((a) => !esAportacion2026(a)) ?? [], [aportaciones]);

  const anosDisponibles = useMemo(() => {
    if (!aportacionesActuales) return [];
    const setAnos = new Set<string>();
    aportacionesActuales.forEach((a) => {
      if (a.fecha_ingreso) {
        const ano = a.fecha_ingreso.slice(0, 4);
        if (ano && ano.length === 4) setAnos.add(ano);
      }
    });
    return Array.from(setAnos).sort().reverse();
  }, [aportacionesActuales]);

  const socioFondoHistorico = useMemo(() => aportaciones?.find((a) => a.numero_asociado === "CHAJ-00000"), [aportaciones]);
  const montoFondoHistorico = Number(socioFondoHistorico?.total_aportaciones || 0);
  const sociosHistoricosIndiv = useMemo(() => aportacionesHistoricas.filter((a) => a.numero_asociado !== "CHAJ-00000"), [aportacionesHistoricas]);
  const montoHistoricoIndiv = useMemo(() => sociosHistoricosIndiv.reduce((s, a) => s + Number(a.total_aportaciones), 0), [sociosHistoricosIndiv]);
  const monto2026 = useMemo(() => aportacionesActuales.reduce((s, a) => s + Number(a.total_aportaciones), 0), [aportacionesActuales]);

  const sociosConAportacion = useMemo(() => aportacionesActuales.filter((a) => Number(a.total_aportaciones) > 0), [aportacionesActuales]);
  const sociosPendientes = useMemo(() => aportacionesActuales.filter((a) => Number(a.total_aportaciones) <= 0), [aportacionesActuales]);

  const aportacionesFiltradas = useMemo(() => {
    if (!aportaciones) return [];
    let lista = aportaciones;

    // Filtro temporal rápido (aplica cuando no hay fechas específicas o año manual)
    if (!fechaDesde && !fechaHasta && !filtroAno) {
      if (filtroPeriodo === "ACTUAL_2026") {
        lista = lista.filter(esAportacion2026);
      } else if (filtroPeriodo === "HISTORICO") {
        lista = lista.filter((a) => !esAportacion2026(a));
      }
    }

    // Filtro por año específico
    if (filtroAno) {
      lista = lista.filter((a) => a.fecha_ingreso && a.fecha_ingreso.startsWith(filtroAno));
    }

    // Filtro por rango exacto de fechas (Desde / Hasta)
    if (fechaDesde) {
      lista = lista.filter((a) => {
        if (!a.fecha_ingreso) return false;
        const f = a.fecha_ingreso.slice(0, 10);
        return f >= fechaDesde;
      });
    }
    if (fechaHasta) {
      lista = lista.filter((a) => {
        if (!a.fecha_ingreso) return false;
        const f = a.fecha_ingreso.slice(0, 10);
        return f <= fechaHasta;
      });
    }

    // Filtro por estado de aportación
    if (filtroEstadoAportacion === "CUBIERTOS") {
      lista = lista.filter((a) => Number(a.total_aportaciones) > 0);
    } else if (filtroEstadoAportacion === "PENDIENTES") {
      lista = lista.filter((a) => Number(a.total_aportaciones) <= 0);
    }

    return lista;
  }, [aportaciones, filtroPeriodo, filtroAno, fechaDesde, fechaHasta, filtroEstadoAportacion]);

  const totalCapital = aportacionesFiltradas.reduce((sum, a) => sum + Number(a.total_aportaciones), 0);
  const totalSocios = aportacionesFiltradas.length;
  const totalPaginas = Math.max(1, Math.ceil(totalSocios / pageSize));
  const aportacionesPaginadas = aportacionesFiltradas.slice((page - 1) * pageSize, page * pageSize);
  const promedioAportacion = totalSocios > 0 ? totalCapital / totalSocios : 0;

  function formatearFechaCorta(f: string | null | undefined): string {
    if (!f) return "—";
    const soloFecha = f.includes("T") ? f.split("T")[0] : f;
    const partes = soloFecha.split("-");
    if (partes.length === 3) {
      return `${parseInt(partes[2], 10)}/${parseInt(partes[1], 10)}/${partes[0]}`;
    }
    return soloFecha;
  }

  return (
    <div className="screen-container">
      {/* CABECERA COMPACTA DE 1 LÍNEA */}
      <div className="screen-header" style={{ paddingBottom: "0.25rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", flexWrap: "wrap" }}>
          <h1 style={{ display: "flex", alignItems: "center", gap: "0.4rem", margin: 0, fontSize: "1.15rem" }}>
            <span>🏛️</span> Padrón de Aportaciones
          </h1>
          <span
            style={{
              fontSize: "0.72rem",
              fontWeight: 700,
              padding: "0.12rem 0.45rem",
              borderRadius: "4px",
              background: "rgba(16, 185, 129, 0.15)",
              color: "#10b981",
              border: "1px solid rgba(16, 185, 129, 0.3)",
            }}
          >
            Capital Social Oficial
          </span>
        </div>

        <div style={{ display: "flex", gap: "0.4rem", alignItems: "center" }}>
          <button
            type="button"
            className="btn secondary"
            onClick={() => window.print()}
            style={{ padding: "0.22rem 0.55rem", fontSize: "0.76rem", display: "flex", alignItems: "center", gap: "0.3rem" }}
          >
            <span>🖨️</span> Imprimir Padrón
          </button>
          <Link
            to="/socios/nuevo"
            className="btn"
            style={{ padding: "0.22rem 0.65rem", fontSize: "0.76rem", textDecoration: "none", fontWeight: 700 }}
          >
            + Nuevo socio
          </Link>
        </div>
      </div>

      {error && <div className="alert error" style={{ margin: "0.2rem 0", padding: "0.3rem 0.6rem", fontSize: "0.78rem" }}>{error}</div>}

      {/* STRIP DE KPIS HORIZONTALES EN 1 SOLA FILA ULTRA-COMPACTA */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.35rem", flexShrink: 0 }}>
        {/* CAPITAL SOCIAL APORTADO */}
        <div
          style={{
            background: "rgba(5, 150, 105, 0.06)",
            border: "1px solid rgba(5, 150, 105, 0.3)",
            borderLeft: "4px solid #059669",
            borderRadius: "6px",
            padding: "0.25rem 0.5rem",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "0.62rem", fontWeight: 700, color: "#059669", letterSpacing: "0.03em" }}>
              CAPITAL SOCIAL FILTRADO
            </span>
            <span style={{ fontSize: "0.75rem" }}>🏛️</span>
          </div>
          <span style={{ fontSize: "1.05rem", fontWeight: 800, color: "#059669", fontFamily: "monospace", lineHeight: 1.2 }}>
            {formatoQ(totalCapital)}
          </span>
          <span style={{ fontSize: "0.6rem", color: "var(--ink-soft)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={filtroPeriodo === "HISTORICO" ? `Fondo Global: ${formatoQ(montoFondoHistorico)} | ${sociosHistoricosIndiv.length} Socios: ${formatoQ(montoHistoricoIndiv)}` : undefined}>
            {filtroPeriodo === "HISTORICO"
              ? `Fondo: ${formatoQ(montoFondoHistorico)} + Socios: ${formatoQ(montoHistoricoIndiv)}`
              : filtroPeriodo === "ACTUAL_2026"
              ? `Ejercicio 2026 (${aportacionesActuales.length} asociados)`
              : `Histórico: ${formatoQ(montoFondoHistorico + montoHistoricoIndiv)} + 2026: ${formatoQ(monto2026)}`}
          </span>
        </div>

        {/* ASOCIADOS EN PADRÓN */}
        <div
          style={{
            background: "var(--paper)",
            border: "1px solid var(--line)",
            borderLeft: "4px solid #6366f1",
            borderRadius: "6px",
            padding: "0.25rem 0.5rem",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "0.62rem", fontWeight: 700, color: "#6366f1", letterSpacing: "0.03em" }}>
              ASOCIADOS FILTRADOS
            </span>
            <span style={{ fontSize: "0.75rem" }}>👥</span>
          </div>
          <span style={{ fontSize: "1.05rem", fontWeight: 800, color: "#6366f1", fontFamily: "monospace", lineHeight: 1.2 }}>
            {totalSocios}
          </span>
          <span style={{ fontSize: "0.6rem", color: "var(--ink-soft)" }}>
            {filtroPeriodo === "HISTORICO"
              ? `1 Fondo Global + ${sociosHistoricosIndiv.length} Socios`
              : "Socios mostrados"}
          </span>
        </div>

        {/* APORTACIÓN PROMEDIO */}
        <div
          style={{
            background: "var(--paper)",
            border: "1px solid var(--line)",
            borderLeft: "4px solid #0284c7",
            borderRadius: "6px",
            padding: "0.25rem 0.5rem",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "0.62rem", fontWeight: 700, color: "#0284c7", letterSpacing: "0.03em" }}>
              APORTACIÓN PROMEDIO
            </span>
            <span style={{ fontSize: "0.75rem" }}>📈</span>
          </div>
          <span style={{ fontSize: "1.05rem", fontWeight: 800, color: "#0284c7", fontFamily: "monospace", lineHeight: 1.2 }}>
            {formatoQ(promedioAportacion)}
          </span>
          <span style={{ fontSize: "0.6rem", color: "var(--ink-soft)" }}>Por asociado activo</span>
        </div>

        {/* CUMPLIMIENTO ESTATUTARIO */}
        <div
          style={{
            background: "var(--paper)",
            border: "1px solid var(--line)",
            borderLeft: "4px solid #10b981",
            borderRadius: "6px",
            padding: "0.25rem 0.5rem",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "0.62rem", fontWeight: 700, color: "#10b981", letterSpacing: "0.03em" }}>
              CUMPLIMIENTO ESTATUTO
            </span>
            <span style={{ fontSize: "0.75rem" }}>✓</span>
          </div>
          <span style={{ fontSize: "1.05rem", fontWeight: 800, color: "#10b981", fontFamily: "monospace", lineHeight: 1.2 }}>
            Min. Q 100.00
          </span>
          <span style={{ fontSize: "0.6rem", color: "var(--ink-soft)" }}>Norma cooperativa activa</span>
        </div>
      </div>

      {/* BARRA DE HERRAMIENTAS CON SEGMENTACIÓN TEMPORAL Y RANGO DE FECHAS */}
      <div className="screen-toolbar" style={{ flexWrap: "wrap", gap: "0.35rem", padding: "0.25rem 0.4rem", flexShrink: 0 }}>
        {/* PILL TOGGLES REMOVIDOS POR DECISION GERENCIAL (SOLO 2026) */}

        {/* SELECTOR DE ESTADO DE APORTACIÓN */}
        <div style={{ display: "inline-flex", background: "var(--paper-raised, rgba(15,23,42,0.6))", padding: "2px", borderRadius: "8px", border: "1px solid var(--line)" }}>
          <button
            type="button"
            onClick={() => {
              setFiltroEstadoAportacion("CUBIERTOS");
              setPage(1);
            }}
            style={{
              padding: "0.22rem 0.5rem",
              fontSize: "0.74rem",
              fontWeight: filtroEstadoAportacion === "CUBIERTOS" ? 700 : 500,
              background: filtroEstadoAportacion === "CUBIERTOS" ? "#10b981" : "transparent",
              color: filtroEstadoAportacion === "CUBIERTOS" ? "#0f172a" : "var(--ink-soft)",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "3px",
            }}
          >
            ✓ Cubiertos ({sociosConAportacion.length})
          </button>
          <button
            type="button"
            onClick={() => {
              setFiltroEstadoAportacion("PENDIENTES");
              setPage(1);
            }}
            style={{
              padding: "0.22rem 0.5rem",
              fontSize: "0.74rem",
              fontWeight: filtroEstadoAportacion === "PENDIENTES" ? 700 : 500,
              background: filtroEstadoAportacion === "PENDIENTES" ? "#d97706" : "transparent",
              color: filtroEstadoAportacion === "PENDIENTES" ? "#fff" : "var(--ink-soft)",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "3px",
            }}
          >
            ⚠️ Pendientes ({sociosPendientes.length})
          </button>
          <button
            type="button"
            onClick={() => {
              setFiltroEstadoAportacion("TODOS");
              setPage(1);
            }}
            style={{
              padding: "0.22rem 0.5rem",
              fontSize: "0.74rem",
              fontWeight: filtroEstadoAportacion === "TODOS" ? 700 : 500,
              background: filtroEstadoAportacion === "TODOS" ? "#64748b" : "transparent",
              color: filtroEstadoAportacion === "TODOS" ? "#fff" : "var(--ink-soft)",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
            }}
          >
            Todos
          </button>
        </div>

        {/* SELECTOR ESPECÍFICO DE AÑO */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
          <span style={{ fontSize: "0.74rem", color: "var(--ink-soft)", fontWeight: 600 }}>📅 Año:</span>
          <select
            value={filtroAno}
            onChange={(e) => {
              setFiltroAno(e.target.value);
              setFechaDesde("");
              setFechaHasta("");
              setFiltroPeriodo("TODOS");
              setPage(1);
            }}
            style={{
              padding: "0.22rem 0.45rem",
              borderRadius: "6px",
              border: "1px solid var(--line)",
              background: "var(--paper)",
              color: "var(--ink)",
              fontSize: "0.76rem",
              fontWeight: 600,
            }}
          >
            <option value="">Todos</option>
            {anosDisponibles.map((ano) => (
              <option key={ano} value={ano}>
                Año {ano} {ano === "2026" ? "(Actual)" : "(Histórico)"}
              </option>
            ))}
          </select>
        </div>

        {/* FILTRO DE RANGO DE FECHAS */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
          <span style={{ fontSize: "0.72rem", color: "var(--ink-soft)" }}>Desde:</span>
          <input
            type="date"
            value={fechaDesde}
            onChange={(e) => {
              setFechaDesde(e.target.value);
              setFiltroAno("");
              setFiltroPeriodo("TODOS");
              setPage(1);
            }}
            style={{
              padding: "0.18rem 0.4rem",
              borderRadius: "6px",
              border: "1px solid var(--line)",
              background: "var(--paper)",
              color: "var(--ink)",
              fontSize: "0.74rem",
            }}
          />
          <span style={{ fontSize: "0.72rem", color: "var(--ink-soft)" }}>Hasta:</span>
          <input
            type="date"
            value={fechaHasta}
            onChange={(e) => {
              setFechaHasta(e.target.value);
              setFiltroAno("");
              setFiltroPeriodo("TODOS");
              setPage(1);
            }}
            style={{
              padding: "0.18rem 0.4rem",
              borderRadius: "6px",
              border: "1px solid var(--line)",
              background: "var(--paper)",
              color: "var(--ink)",
              fontSize: "0.74rem",
            }}
          />
          {(fechaDesde || fechaHasta || filtroAno) && (
            <button
              type="button"
              onClick={() => {
                setFechaDesde("");
                setFechaHasta("");
                setFiltroAno("");
                setPage(1);
              }}
              style={{
                padding: "0.18rem 0.5rem",
                borderRadius: "5px",
                border: "1px solid rgba(191, 153, 3, 0.4)",
                background: "rgba(191, 153, 3, 0.15)",
                color: "#f59e0b",
                fontSize: "0.72rem",
                fontWeight: 700,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "3px",
              }}
              title="Limpiar fechas y filtros manuales"
            >
              ✕ Limpiar
            </button>
          )}
        </div>

        {/* BUSCADOR */}
        <div style={{ position: "relative", flex: 1, minWidth: 160, maxWidth: 260 }}>
          <span
            style={{
              position: "absolute",
              left: "0.6rem",
              top: "50%",
              transform: "translateY(-50%)",
              fontSize: "0.8rem",
              color: "var(--ink-soft)",
              pointerEvents: "none",
            }}
          >
            🔍
          </span>
          <input
            type="text"
            placeholder="Buscar socio, DPI o código…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            style={{
              width: "100%",
              padding: "0.24rem 0.55rem 0.24rem 1.8rem",
              fontSize: "0.78rem",
              borderRadius: "6px",
              border: "1px solid var(--line)",
              background: "var(--paper)",
              color: "var(--ink)",
            }}
          />
        </div>
      </div>

      {/* TABLA DE PANTALLA CON SCROLL INTERNO Y PAGINACIÓN (SÓLO PANTALLA) */}
      <div className="table-scroll-container no-print">
        <table className="table-compact">
          <thead>
            <tr>
              <th style={{ minWidth: 95 }}>NO. ASOCIADO</th>
              <th style={{ minWidth: 180 }}>NOMBRES DEL ASOCIADO</th>
              <th style={{ minWidth: 105 }}>DPI</th>
              <th style={{ minWidth: 60, textAlign: "center" }}>GÉNERO</th>
              <th style={{ minWidth: 115, textAlign: "right" }}>CAPITAL APORTADO</th>
              <th style={{ minWidth: 170 }}>PERSONA BENEFICIARIA</th>
              <th style={{ minWidth: 95, textAlign: "center" }}>FECHA INGRESO</th>
              <th style={{ minWidth: 70, textAlign: "center" }}>ESTADO</th>
            </tr>
          </thead>
          <tbody>
            {aportacionesPaginadas.map((a) => (
              <tr key={a.socio_id}>
                <td className="mono" style={{ fontWeight: 700, color: "var(--accent)" }}>
                  <Link to={`/socios/${a.socio_id}`} style={{ color: "inherit", textDecoration: "none" }}>
                    {a.numero_asociado}
                  </Link>
                </td>
                <td>
                  <Link
                    to={`/socios/${a.socio_id}`}
                    style={{ color: "inherit", textDecoration: "none", fontWeight: 600 }}
                  >
                    {a.nombres}
                  </Link>
                  {a.numero_asociado === "CHAJ-00000" && (
                    <span style={{ fontSize: "0.62rem", color: "#BF9903", background: "rgba(191,153,3,0.15)", padding: "1px 5px", borderRadius: "3px", fontWeight: 700, marginLeft: "6px", border: "1px solid rgba(191,153,3,0.3)" }}>
                      Fondo Global Histórico
                    </span>
                  )}
                  {a.telefono && (
                    <div style={{ fontSize: "0.74rem", color: "var(--ink-soft)" }}>Tel: {a.telefono}</div>
                  )}
                </td>
                <td className="mono" style={{ fontSize: "0.8rem" }}>{a.dpi ? formatearDPI(a.dpi) : "—"}</td>
                <td style={{ textAlign: "center" }}>
                  <span
                    style={{
                      padding: "0.1rem 0.35rem",
                      borderRadius: "4px",
                      fontSize: "0.72rem",
                      fontWeight: 700,
                      background: "var(--mono-bg)",
                      color: a.genero === "F" ? "#f472b6" : a.genero === "M" ? "#60a5fa" : "var(--ink-soft)",
                      border: "1px solid var(--line)",
                    }}
                  >
                    {a.genero === "F" ? "F" : a.genero === "M" ? "M" : "—"}
                  </span>
                </td>
                <td className="mono" style={{ textAlign: "right" }}>
                  {Number(a.total_aportaciones) > 0 ? (
                    <span style={{ fontWeight: 700, color: "#10b981" }}>
                      {formatoQ(a.total_aportaciones)}
                    </span>
                  ) : (
                    <div style={{ display: "inline-flex", flexDirection: "column", alignItems: "flex-end" }}>
                      <span style={{ color: "var(--ink-soft)", fontSize: "0.78rem" }}>Q 0.00</span>
                      <span style={{ fontSize: "0.62rem", color: "#f59e0b", background: "rgba(245, 158, 11, 0.15)", padding: "0.05rem 0.3rem", borderRadius: "3px", fontWeight: 600 }}>
                        Pendiente
                      </span>
                    </div>
                  )}
                </td>
                <td>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", flexWrap: "wrap" }}>
                    <strong style={{ fontSize: "0.82rem" }}>{a.nombre_beneficiario ?? "—"}</strong>
                    {a.parentesco_beneficiario && (
                      <span
                        style={{
                          fontSize: "0.68rem",
                          fontWeight: 700,
                          padding: "0.08rem 0.35rem",
                          borderRadius: "4px",
                          background: "var(--mono-bg)",
                          border: "1px solid var(--line)",
                          color: "var(--accent)",
                        }}
                      >
                        {a.parentesco_beneficiario}
                      </span>
                    )}
                  </div>
                  {(a.dpi_beneficiario || a.telefono_beneficiario) && (
                    <div style={{ fontSize: "0.72rem", color: "var(--ink-soft)", marginTop: "0.1rem" }}>
                      {a.dpi_beneficiario ? `DPI: ${formatearDPI(a.dpi_beneficiario)} ` : ""}
                      {a.telefono_beneficiario ? `· Tel: ${a.telefono_beneficiario}` : ""}
                    </div>
                  )}
                </td>
                <td className="mono" style={{ fontSize: "0.8rem" }}>
                  <div style={{ fontWeight: 600 }}>{formatearFechaCorta(a.fecha_ingreso)}</div>
                  {esAportacion2026(a) ? (
                    <span
                      style={{
                        display: "inline-block",
                        fontSize: "0.62rem",
                        color: "#10b981",
                        background: "rgba(16, 185, 129, 0.12)",
                        padding: "0.05rem 0.3rem",
                        borderRadius: "3px",
                        fontWeight: 700,
                        border: "1px solid rgba(16, 185, 129, 0.25)",
                        marginTop: "2px",
                      }}
                    >
                      🌱 2026
                    </span>
                  ) : (
                    <span
                      style={{
                        display: "inline-block",
                        fontSize: "0.62rem",
                        color: "#BF9903",
                        background: "rgba(191, 153, 3, 0.12)",
                        padding: "0.05rem 0.3rem",
                        borderRadius: "3px",
                        fontWeight: 700,
                        border: "1px solid rgba(191, 153, 3, 0.25)",
                        marginTop: "2px",
                      }}
                    >
                      📜 Histórico
                    </span>
                  )}
                </td>
                <td style={{ textAlign: "center" }}>
                  <span className={`badge ${a.estado.toLowerCase()}`} style={{ fontSize: "0.72rem", padding: "0.15rem 0.45rem" }}>
                    {a.estado === "ACTIVO" ? "Activo" : a.estado}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {aportaciones && aportaciones.length === 0 && (
          <div className="empty" style={{ padding: "2rem", textAlign: "center", color: "var(--ink-soft)" }}>
            No se encontraron asociados en el padrón de aportaciones.
          </div>
        )}
      </div>

      {/* FOOTER FIJO CON PAGINACIÓN (SÓLO PANTALLA) */}
      <div className="screen-footer no-print">
        <span style={{ fontSize: "0.8rem", color: "var(--ink-soft)" }}>
          Mostrando {aportacionesPaginadas.length} de {totalSocios} asociados · Pág. {page} de {totalPaginas}
        </span>
        <div style={{ display: "flex", gap: "0.4rem" }}>
          <button
            type="button"
            className="btn secondary"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            style={{ padding: "0.22rem 0.6rem", fontSize: "0.78rem" }}
          >
            ← Anterior
          </button>
          <button
            type="button"
            className="btn secondary"
            disabled={page >= totalPaginas}
            onClick={() => setPage((p) => p + 1)}
            style={{ padding: "0.22rem 0.6rem", fontSize: "0.78rem" }}
          >
            Siguiente →
          </button>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          REPORTE OFICIAL DE IMPRESIÓN COMPLETO (TODOS LOS ASOCIADOS SIN CORTES)
          ══════════════════════════════════════════════════════════════════════ */}
      <div className="print-only" style={{ width: "100%", margin: "0", padding: "0" }}>
        {/* MEMBRETE INSTITUCIONAL OFICIAL */}
        <div style={{ borderBottom: "2px solid #0f172a", paddingBottom: "6px", marginBottom: "10px", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ fontSize: "11pt", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.5px", color: "#0f172a" }}>
              COOPERATIVA MAYA INVERSIONES FUTURAS R.L. "COMIF-R.L."
            </div>
            <div style={{ fontSize: "9.5pt", fontWeight: 700, color: "#059669", marginTop: "2px" }}>
              {filtroPeriodo === "ACTUAL_2026"
                ? "PADRÓN OFICIAL DE ASOCIADOS — EJERCICIO 2026"
                : filtroPeriodo === "HISTORICO"
                ? "PADRÓN OFICIAL DE ASOCIADOS — HISTÓRICO ANTERIOR (PREVIO 2026)"
                : "PADRÓN GENERAL OFICIAL DE ASOCIADOS Y CAPITAL SOCIAL APORTADO"}
            </div>
            <div style={{ fontSize: "7.5pt", color: "#475569", marginTop: "2px" }}>
              San Gaspar Chajul, El Quiché, Guatemala · Sistema Contable y Financiero COMIF-R.L.
              {filtroAno && ` · Año: ${filtroAno}`}
              {(fechaDesde || fechaHasta) && ` · Período: ${fechaDesde || "Inicio"} al ${fechaHasta || "Actual"}`}
            </div>
          </div>
          <div style={{ textAlign: "right", fontSize: "7.5pt", color: "#334155" }}>
            <div><strong>Emisión:</strong> {new Date().toLocaleDateString("es-GT", { day: "2-digit", month: "2-digit", year: "numeric" })} {new Date().toLocaleTimeString("es-GT", { hour: "2-digit", minute: "2-digit" })}</div>
            <div><strong>Segmento:</strong> {filtroPeriodo === "ACTUAL_2026" ? "Ejercicio 2026" : filtroPeriodo === "HISTORICO" ? "Histórico Anterior (Pre-2026)" : "Consolidado Completo"}</div>
            <div><strong>Filtro Aportación:</strong> {filtroEstadoAportacion === "CUBIERTOS" ? "Aportación Cubierta (Min Q 100)" : filtroEstadoAportacion === "PENDIENTES" ? "Pendientes de Aportación" : "Todos"}</div>
            <div><strong>Total Asociados:</strong> {totalSocios} en padrón</div>
            {q && <div><strong>Búsqueda:</strong> "{q}"</div>}
          </div>
        </div>

        {/* RESUMEN FINANCIERO OFICIAL */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "8px", marginBottom: "10px" }}>
          <div style={{ border: "1px solid #cbd5e1", padding: "4px 8px", background: "#f8fafc", borderRadius: "4px" }}>
            <div style={{ fontSize: "6.5pt", color: "#64748b", fontWeight: 700 }}>CAPITAL SOCIAL FILTRADO</div>
            <div style={{ fontSize: "10pt", fontWeight: 800, color: "#059669", fontFamily: "monospace" }}>{formatoQ(totalCapital)}</div>
          </div>
          <div style={{ border: "1px solid #cbd5e1", padding: "4px 8px", background: "#f8fafc", borderRadius: "4px" }}>
            <div style={{ fontSize: "6.5pt", color: "#64748b", fontWeight: 700 }}>TOTAL ASOCIADOS</div>
            <div style={{ fontSize: "10pt", fontWeight: 800, color: "#1e293b", fontFamily: "monospace" }}>{totalSocios}</div>
          </div>
          <div style={{ border: "1px solid #cbd5e1", padding: "4px 8px", background: "#f8fafc", borderRadius: "4px" }}>
            <div style={{ fontSize: "6.5pt", color: "#64748b", fontWeight: 700 }}>APORTACIÓN PROMEDIO</div>
            <div style={{ fontSize: "10pt", fontWeight: 800, color: "#0284c7", fontFamily: "monospace" }}>{formatoQ(promedioAportacion)}</div>
          </div>
          <div style={{ border: "1px solid #cbd5e1", padding: "4px 8px", background: "#f8fafc", borderRadius: "4px" }}>
            <div style={{ fontSize: "6.5pt", color: "#64748b", fontWeight: 700 }}>ESTATUTO MIN. REQUERIDO</div>
            <div style={{ fontSize: "10pt", fontWeight: 800, color: "#10b981", fontFamily: "monospace" }}>Min. Q 100.00</div>
          </div>
        </div>

        {/* TABLA COMPLETA CON TODOS LOS ASOCIADOS REGISTRADOS */}
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "7.5pt", marginBottom: "15px" }}>
          <thead>
            <tr style={{ background: "#0f172a", color: "#ffffff" }}>
              <th style={{ width: "3%", textAlign: "center", padding: "4px 2px", color: "#ffffff" }}>#</th>
              <th style={{ width: "12%", textAlign: "left", padding: "4px 4px", color: "#ffffff" }}>NO. ASOCIADO</th>
              <th style={{ width: "22%", textAlign: "left", padding: "4px 4px", color: "#ffffff" }}>NOMBRES Y APELLIDOS</th>
              <th style={{ width: "14%", textAlign: "left", padding: "4px 4px", color: "#ffffff" }}>DPI</th>
              <th style={{ width: "5%", textAlign: "center", padding: "4px 2px", color: "#ffffff" }}>GÉN</th>
              <th style={{ width: "12%", textAlign: "right", padding: "4px 4px", color: "#ffffff" }}>CAPITAL (Q)</th>
              <th style={{ width: "20%", textAlign: "left", padding: "4px 4px", color: "#ffffff" }}>BENEFICIARIO</th>
              <th style={{ width: "12%", textAlign: "center", padding: "4px 4px", color: "#ffffff" }}>INGRESO</th>
            </tr>
          </thead>
          <tbody>
            {aportacionesFiltradas.map((a, index) => (
              <tr key={a.socio_id} style={{ background: index % 2 === 0 ? "#ffffff" : "#f8fafc" }}>
                <td style={{ textAlign: "center", border: "1px solid #cbd5e1", padding: "3px 2px" }}>
                  {index + 1}
                </td>
                <td style={{ border: "1px solid #cbd5e1", padding: "3px 4px", fontFamily: "monospace", fontWeight: 700 }}>
                  {a.numero_asociado}
                </td>
                <td style={{ border: "1px solid #cbd5e1", padding: "3px 4px" }}>
                  <div style={{ fontWeight: 600 }}>{a.nombres}</div>
                  {a.telefono && <div style={{ fontSize: "6.5pt", color: "#64748b" }}>Tel: {a.telefono}</div>}
                </td>
                <td style={{ border: "1px solid #cbd5e1", padding: "3px 4px", fontFamily: "monospace" }}>
                  {a.dpi ? formatearDPI(a.dpi) : "—"}
                </td>
                <td style={{ textAlign: "center", border: "1px solid #cbd5e1", padding: "3px 2px", fontWeight: 700 }}>
                  {a.genero || "—"}
                </td>
                <td style={{ textAlign: "right", border: "1px solid #cbd5e1", padding: "3px 4px", fontFamily: "monospace", fontWeight: 700, color: "#059669" }}>
                  {formatoQ(a.total_aportaciones)}
                </td>
                <td style={{ border: "1px solid #cbd5e1", padding: "3px 4px" }}>
                  <div style={{ fontWeight: 600 }}>{a.nombre_beneficiario || "—"}</div>
                  {a.parentesco_beneficiario && (
                    <div style={{ fontSize: "6.5pt", color: "#64748b" }}>
                      Parentesco: {a.parentesco_beneficiario}
                      {a.telefono_beneficiario ? ` · Tel: ${a.telefono_beneficiario}` : ""}
                    </div>
                  )}
                </td>
                <td style={{ textAlign: "center", border: "1px solid #cbd5e1", padding: "3px 4px", fontFamily: "monospace" }}>
                  {formatearFechaCorta(a.fecha_ingreso)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr style={{ background: "#e2e8f0", fontWeight: "bold" }}>
              <td colSpan={5} style={{ border: "1px solid #94a3b8", padding: "5px", textAlign: "right", fontWeight: 800 }}>
                TOTAL GENERAL CAPITAL SOCIAL APORTADO ({totalSocios} ASOCIADOS):
              </td>
              <td style={{ border: "1px solid #94a3b8", padding: "5px", textAlign: "right", fontFamily: "monospace", fontWeight: 800, color: "#059669", fontSize: "8.5pt" }}>
                {formatoQ(totalCapital)}
              </td>
              <td colSpan={2} style={{ border: "1px solid #94a3b8", padding: "5px", textAlign: "center", color: "#475569", fontSize: "7pt" }}>
                100% Verificado Conforme Estatuto
              </td>
            </tr>
          </tfoot>
        </table>

        {/* BLOQUE DE FIRMAS OFICIALES DE LEGALIZACIÓN */}
        <div style={{ pageBreakInside: "avoid", breakInside: "avoid", marginTop: "24px", paddingTop: "8px" }}>
          <div style={{ fontSize: "7pt", fontStyle: "italic", textAlign: "center", color: "#64748b", marginBottom: "20px" }}>
            El suscrito certifica que el presente Padrón de Asociados y Capital Social refleja fielmente los registros contables y estatutarios de la institución al día de hoy.
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "25px", textAlign: "center" }}>
            <div>
              <div style={{ borderTop: "1px solid #000", margin: "0 10px", paddingTop: "4px", fontSize: "7.5pt", fontWeight: 700 }}>
                Presidente
              </div>
              <div style={{ fontSize: "6.5pt", color: "#475569" }}>Consejo de Administración</div>
            </div>
            <div>
              <div style={{ borderTop: "1px solid #000", margin: "0 10px", paddingTop: "4px", fontSize: "7.5pt", fontWeight: 700 }}>
                Comisión de Vigilancia
              </div>
              <div style={{ fontSize: "6.5pt", color: "#475569" }}>Fiscalización Interna</div>
            </div>
            <div>
              <div style={{ borderTop: "1px solid #000", margin: "0 10px", paddingTop: "4px", fontSize: "7.5pt", fontWeight: 700 }}>
                Contador General / Gerencia
              </div>
              <div style={{ fontSize: "6.5pt", color: "#475569" }}>Certificación Contable COMIF-R.L.</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
