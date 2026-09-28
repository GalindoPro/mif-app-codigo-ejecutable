import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, mensajeError } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import {
  ESTADO_PRESTAMO_LABEL,
  formatoQ,
  TIPO_PRESTAMO_LABEL,
  ORIGEN_FONDOS_SHORT_LABEL,
  ORIGEN_FONDOS_BADGE_STYLE,
} from "../types";
import type { EstadoPrestamo, Prestamo, FiadorItem, CobroCampo } from "../types";
import { formatearDPI, formatearTelefono } from "../lib/formatters";
import { CobroCampoModal } from "../components/promotor/CobroCampoModal";
import ContratoPagareCreditoModal from "../components/ContratoPagareCreditoModal";

export default function CreditosList() {
  const { usuario } = useAuth();
  const puedeGestionar =
    usuario?.rol === "GERENCIA" ||
    usuario?.rol === "SUPERVISOR" ||
    usuario?.rol === "CAJERO";

  const [pestanaActiva, setPestanaActiva] = useState<"CREDITOS" | "FIADORES">("CREDITOS");

  const [prestamos, setPrestamos] = useState<Prestamo[] | null>(null);
  const [fiadores, setFiadores] = useState<FiadorItem[] | null>(null);
  const [cargandoFiadores, setCargandoFiadores] = useState(false);
  const [cobrosPendientes, setCobrosPendientes] = useState<CobroCampo[]>([]);
  const [modalCobroPrestamo, setModalCobroPrestamo] = useState<{ id: string; socioId: string; socioNombres: string, cobroExistente?: CobroCampo } | null>(null);
  const [prestamoParaContrato, setPrestamoParaContrato] = useState<Prestamo | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [estadoFiltro, setEstadoFiltro] = useState<string>("");
  const [filtroTipoFiador, setFiltroTipoFiador] = useState<"TODOS" | "EXTERNOS" | "SOCIOS">("TODOS");
  const [page, setPage] = useState(1);
  const [procesandoId, setProcesandoId] = useState<string | null>(null);
  const pageSize = 10;

  // Modal de confirmación de acción rápida
  const [modalAccion, setModalAccion] = useState<{
    prestamo: Prestamo;
    nuevoEstado: EstadoPrestamo;
    titulo: string;
    mensaje: string;
    colorBoton: string;
  } | null>(null);

  function cargar() {
    api
      .get<Prestamo[]>("/prestamos", {
        params: {
          q: q || undefined,
          estado: estadoFiltro || undefined,
        },
      })
      .then(({ data }) => setPrestamos(data))
      .catch((err) => setError(mensajeError(err)));

    if (usuario?.rol === "PROMOTOR") {
      api.get<CobroCampo[]>("/cobros-campo/pendientes")
         .then(({ data }) => setCobrosPendientes(data))
         .catch(err => console.error("Error cargando cobros de campo:", err));
    }
  }

  function cargarFiadores() {
    setCargandoFiadores(true);
    api
      .get<FiadorItem[]>("/prestamos/fiadores", {
        params: {
          q: q || undefined,
          tipoFiltro: filtroTipoFiador,
        },
      })
      .then(({ data }) => setFiadores(data))
      .catch((err) => setError(mensajeError(err)))
      .finally(() => setCargandoFiadores(false));
  }

  useEffect(() => {
    setPage(1);
    const timer = setTimeout(() => {
      if (pestanaActiva === "CREDITOS") {
        cargar();
      } else {
        cargarFiadores();
      }
    }, 200);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, estadoFiltro, filtroTipoFiador, pestanaActiva]);

  async function ejecutarCambioEstado(prestamoId: string, nuevoEstado: EstadoPrestamo, codigo: string) {
    setProcesandoId(prestamoId);
    setError(null);
    setMensajeExito(null);
    try {
      await api.patch(`/prestamos/${prestamoId}/estado`, { estado: nuevoEstado });
      setMensajeExito(`¡Crédito ${codigo} actualizado con éxito a: ${ESTADO_PRESTAMO_LABEL[nuevoEstado]}!`);
      setTimeout(() => setMensajeExito(null), 5000);
      setModalAccion(null);
      cargar();
    } catch (err) {
      setError(mensajeError(err));
    } finally {
      setProcesandoId(null);
    }
  }

  const totalDesembolsado =
    prestamos
      ?.filter((p) => p.estado === "DESEMBOLSADO")
      .reduce((acc, p) => acc + Number(p.monto_aprobado ?? p.monto_solicitado), 0) ?? 0;

  const totalSaldoVivo =
    prestamos
      ?.filter((p) => p.estado === "DESEMBOLSADO")
      .reduce((acc, p) => acc + Number(p.saldo_capital != null ? p.saldo_capital : (p.monto_aprobado ?? p.monto_solicitado)), 0) ?? 0;

  const totalCuotas =
    prestamos
      ?.filter((p) => p.estado === "DESEMBOLSADO")
      .reduce((acc, p) => acc + Number(p.cuota_mensual || 0), 0) ?? 0;

  function exportarExcel() {
    if (!prestamos || prestamos.length === 0) return;
    const encabezados = [
      "Código",
      "No. Crédito Anterior",
      "Socio Solicitante",
      "DPI",
      "Teléfono",
      "Tipo Crédito",
      "Fondo",
      "Monto Original",
      "Saldo Capital Vivo",
      "Plazo Meses",
      "Cuota Mensual",
      "Promotor",
      "Estado",
      "Fecha Desembolso",
    ];
    const filas = prestamos.map((p) => [
      `"${p.codigo}"`,
      `"${p.numero_credito_anterior || ""}"`,
      `"${(p.socio_nombres || "").replace(/"/g, '""')}"`,
      `"${p.socio_dpi || ""}"`,
      `"${p.socio_telefono || ""}"`,
      `"${TIPO_PRESTAMO_LABEL[p.tipo] || p.tipo}"`,
      `"${p.origen_fondos ? ORIGEN_FONDOS_SHORT_LABEL[p.origen_fondos] : ""}"`,
      Number(p.monto_aprobado ?? p.monto_solicitado).toFixed(2),
      Number(p.saldo_capital != null ? p.saldo_capital : (p.monto_aprobado ?? p.monto_solicitado)).toFixed(2),
      p.plazo_meses,
      Number(p.cuota_mensual).toFixed(2),
      `"${(p.promotor_nombre || "").replace(/"/g, '""')}"`,
      `"${ESTADO_PRESTAMO_LABEL[p.estado] || p.estado}"`,
      `"${p.fecha_desembolso ? new Date(p.fecha_desembolso).toLocaleDateString("es-GT") : ""}"`,
    ]);
    const csvContent = "\uFEFF" + [encabezados.join(";"), ...filas.map((f) => f.join(";"))].join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Cartera_Creditos_COMIF_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  const pendientes = prestamos?.filter((p) => p.estado === "SOLICITUD").length ?? 0;
  const aprobados = prestamos?.filter((p) => p.estado === "APROBADO").length ?? 0;
  const desembolsados = prestamos?.filter((p) => p.estado === "DESEMBOLSADO").length ?? 0;
  const cancelados = prestamos?.filter((p) => p.estado === "CANCELADO").length ?? 0;

  const totalCreditos = prestamos?.length ?? 0;
  const totalPaginas = Math.max(1, Math.ceil(totalCreditos / pageSize));
  const prestamosPaginados = prestamos?.slice((page - 1) * pageSize, page * pageSize) ?? [];

  return (
    <div className="screen-container">
      {/* CABECERA COMPACTA DE 1 LÍNEA CON TABS INTEGRADAS */}
      <div className="screen-header">
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
          <h1 style={{ display: "flex", alignItems: "center", gap: "0.4rem", margin: 0, fontSize: "1.2rem" }}>
            <span>📑</span> Créditos
          </h1>
          <div style={{ display: "flex", gap: "0.25rem", background: "var(--paper-raised)", padding: "0.18rem", borderRadius: "8px", border: "1px solid var(--line)" }}>
            <button
              type="button"
              onClick={() => setPestanaActiva("CREDITOS")}
              style={{
                padding: "0.22rem 0.65rem",
                borderRadius: "6px",
                border: "none",
                fontSize: "0.8rem",
                fontWeight: 700,
                cursor: "pointer",
                background: pestanaActiva === "CREDITOS" ? "var(--primary, #0284c7)" : "transparent",
                color: pestanaActiva === "CREDITOS" ? "#fff" : "var(--ink-soft)",
                display: "flex",
                alignItems: "center",
                gap: "0.35rem",
              }}
            >
              <span>Cartera</span>
              <span style={{ fontSize: "0.72rem", opacity: 0.9 }}>({totalCreditos})</span>
            </button>
            <button
              type="button"
              onClick={() => setPestanaActiva("FIADORES")}
              style={{
                padding: "0.22rem 0.65rem",
                borderRadius: "6px",
                border: "none",
                fontSize: "0.8rem",
                fontWeight: 700,
                cursor: "pointer",
                background: pestanaActiva === "FIADORES" ? "var(--accent, #0ea5e9)" : "transparent",
                color: pestanaActiva === "FIADORES" ? "#fff" : "var(--ink-soft)",
                display: "flex",
                alignItems: "center",
                gap: "0.35rem",
              }}
            >
              <span>👥 Fiadores</span>
              {fiadores && <span style={{ fontSize: "0.72rem", opacity: 0.9 }}>({fiadores.length})</span>}
            </button>
          </div>
        </div>

        <div style={{ display: "flex", gap: "0.45rem", alignItems: "center" }}>
          <Link to="/creditos/simulador" className="btn secondary" style={{ fontSize: "0.78rem", padding: "0.3rem 0.65rem" }}>
            📊 Simulador
          </Link>
          <Link to="/creditos/nuevo" className="btn" style={{ fontSize: "0.78rem", padding: "0.3rem 0.75rem", fontWeight: 700 }}>
            + Nueva solicitud
          </Link>
        </div>
      </div>

      {mensajeExito && <div className="alert success" style={{ padding: "0.4rem 0.75rem", fontSize: "0.82rem", margin: 0 }}>{mensajeExito}</div>}
      {error && <div className="alert error" style={{ padding: "0.4rem 0.75rem", fontSize: "0.82rem", margin: 0 }}>{error}</div>}

      {pestanaActiva === "CREDITOS" ? (
        <>
          {/* FRANJA HORIZONTAL DE KPIS COMPACTA (TARJETAS FINTECH CON BORDE DE COLOR) */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "0.5rem" }}>
            {/* CARTERA ACTIVA */}
            <div
              style={{
                background: "var(--paper)",
                border: "1px solid var(--line)",
                borderLeft: "4px solid #059669",
                borderRadius: "8px",
                padding: "0.45rem 0.65rem",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                cursor: "pointer",
                boxShadow: estadoFiltro === "DESEMBOLSADO" ? "0 0 0 2px #059669" : "0 1px 3px rgba(0,0,0,0.04)",
              }}
              onClick={() => setEstadoFiltro(estadoFiltro === "DESEMBOLSADO" ? "" : "DESEMBOLSADO")}
              title="Filtrar por préstamos en cobro activo"
            >
              <div>
                <span style={{ fontSize: "0.65rem", fontWeight: 700, color: "#059669", display: "block", letterSpacing: "0.02em" }}>
                  CARTERA ACTIVA ({desembolsados})
                </span>
                <span style={{ fontSize: "1.08rem", fontWeight: 700, color: "var(--ink)", fontFamily: "monospace" }}>
                  {formatoQ(totalSaldoVivo)}
                </span>
                {totalDesembolsado > totalSaldoVivo && (
                  <span style={{ fontSize: "0.62rem", color: "var(--ink-soft)", display: "block" }}>
                    Desembolsado: {formatoQ(totalDesembolsado)}
                  </span>
                )}
              </div>
              <span style={{ fontSize: "1.2rem" }}>💼</span>
            </div>

            {/* POR DESEMBOLSAR */}
            <div
              style={{
                background: aprobados > 0 ? "rgba(2, 132, 199, 0.06)" : "var(--paper)",
                border: "1px solid var(--line)",
                borderLeft: "4px solid #0284c7",
                borderRadius: "8px",
                padding: "0.45rem 0.65rem",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                cursor: "pointer",
                boxShadow: estadoFiltro === "APROBADO" ? "0 0 0 2px #0284c7" : "0 1px 3px rgba(0,0,0,0.04)",
              }}
              onClick={() => setEstadoFiltro(estadoFiltro === "APROBADO" ? "" : "APROBADO")}
              title="Filtrar créditos aprobados listos para desembolso"
            >
              <div>
                <span style={{ fontSize: "0.65rem", fontWeight: 700, color: "#0284c7", display: "block", letterSpacing: "0.02em" }}>
                  POR DESEMBOLSAR
                </span>
                <span style={{ fontSize: "1.08rem", fontWeight: 700, color: "#0284c7", fontFamily: "monospace" }}>
                  {aprobados}
                </span>
              </div>
              <span style={{ fontSize: "1.2rem" }}>⚡</span>
            </div>

            {/* EN SOLICITUD */}
            <div
              style={{
                background: "var(--paper)",
                border: "1px solid var(--line)",
                borderLeft: "4px solid #f59e0b",
                borderRadius: "8px",
                padding: "0.45rem 0.65rem",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                cursor: "pointer",
                boxShadow: estadoFiltro === "SOLICITUD" ? "0 0 0 2px #f59e0b" : "0 1px 3px rgba(0,0,0,0.04)",
              }}
              onClick={() => setEstadoFiltro(estadoFiltro === "SOLICITUD" ? "" : "SOLICITUD")}
              title="Filtrar solicitudes en evaluación"
            >
              <div>
                <span style={{ fontSize: "0.65rem", fontWeight: 700, color: "#d97706", display: "block", letterSpacing: "0.02em" }}>
                  EN SOLICITUD
                </span>
                <span style={{ fontSize: "1.08rem", fontWeight: 700, color: "#d97706", fontFamily: "monospace" }}>
                  {pendientes}
                </span>
              </div>
              <span style={{ fontSize: "1.2rem" }}>⏳</span>
            </div>

            {/* CANCELADOS / PAGADOS */}
            <div
              style={{
                background: "var(--paper)",
                border: "1px solid var(--line)",
                borderLeft: "4px solid #64748b",
                borderRadius: "8px",
                padding: "0.45rem 0.65rem",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                cursor: "pointer",
                boxShadow: estadoFiltro === "CANCELADO" ? "0 0 0 2px #64748b" : "0 1px 3px rgba(0,0,0,0.04)",
              }}
              onClick={() => setEstadoFiltro(estadoFiltro === "CANCELADO" ? "" : "CANCELADO")}
              title="Filtrar créditos pagados o solventes"
            >
              <div>
                <span style={{ fontSize: "0.65rem", fontWeight: 700, color: "var(--ink-soft)", display: "block", letterSpacing: "0.02em" }}>
                  SOLVENTES / PAGADOS
                </span>
                <span style={{ fontSize: "1.08rem", fontWeight: 700, color: "var(--ink)", fontFamily: "monospace" }}>
                  {cancelados}
                </span>
              </div>
              <span style={{ fontSize: "1.2rem" }}>✅</span>
            </div>

            {/* TOTAL CRÉDITOS */}
            <div
              style={{
                background: "var(--paper)",
                border: "1px solid var(--line)",
                borderLeft: "4px solid #6366f1",
                borderRadius: "8px",
                padding: "0.45rem 0.65rem",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                cursor: "pointer",
                boxShadow: estadoFiltro === "" ? "0 0 0 2px #6366f1" : "0 1px 3px rgba(0,0,0,0.04)",
              }}
              onClick={() => setEstadoFiltro("")}
              title="Ver todos los créditos"
            >
              <div>
                <span style={{ fontSize: "0.65rem", fontWeight: 700, color: "#6366f1", display: "block", letterSpacing: "0.02em" }}>
                  TOTAL CRÉDITOS
                </span>
                <span style={{ fontSize: "1.08rem", fontWeight: 700, color: "#6366f1", fontFamily: "monospace" }}>
                  {prestamos?.length ?? 0}
                </span>
              </div>
              <span style={{ fontSize: "1.2rem" }}>📊</span>
            </div>
          </div>

          {/* FILTROS Y CHIPS RÁPIDOS EN 1 SOLA LÍNEA COMPACTA */}
          <div className="screen-toolbar">
            <div className="searchbar" style={{ flex: 1, minWidth: 240, marginBottom: 0 }}>
              <input
                placeholder="🔍 Buscar por socio, código de crédito o DPI…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                style={{ padding: "0.35rem 0.65rem", fontSize: "0.82rem" }}
              />
            </div>

            <div style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap", alignItems: "center" }}>
              <button
                type="button"
                className={`btn ${estadoFiltro === "" ? "primary" : "secondary"}`}
                style={{ fontSize: "0.75rem", padding: "0.25rem 0.55rem" }}
                onClick={() => setEstadoFiltro("")}
              >
                Todos ({totalCreditos})
              </button>
              <button
                type="button"
                className={`btn ${estadoFiltro === "APROBADO" ? "primary" : "secondary"}`}
                style={{
                  fontSize: "0.75rem",
                  padding: "0.25rem 0.55rem",
                  borderColor: "#3b82f6",
                  color: estadoFiltro === "APROBADO" ? "#fff" : "#3b82f6",
                  fontWeight: aprobados > 0 ? 700 : 400,
                }}
                onClick={() => setEstadoFiltro(estadoFiltro === "APROBADO" ? "" : "APROBADO")}
              >
                ⚡ Desembolso ({aprobados})
              </button>
              <button
                type="button"
                className={`btn ${estadoFiltro === "DESEMBOLSADO" ? "primary" : "secondary"}`}
                style={{ fontSize: "0.75rem", padding: "0.25rem 0.55rem" }}
                onClick={() => setEstadoFiltro(estadoFiltro === "DESEMBOLSADO" ? "" : "DESEMBOLSADO")}
              >
                Cobro ({desembolsados})
              </button>
              <button
                type="button"
                className={`btn ${estadoFiltro === "CANCELADO" ? "primary" : "secondary"}`}
                style={{ fontSize: "0.75rem", padding: "0.25rem 0.55rem" }}
                onClick={() => setEstadoFiltro(estadoFiltro === "CANCELADO" ? "" : "CANCELADO")}
              >
                Pagados ({cancelados})
              </button>

              {/* BOTÓN EXPORTAR EXCEL */}
              <button
                type="button"
                onClick={exportarExcel}
                className="btn secondary"
                title="Descargar listado de créditos filtrados en formato CSV/Excel"
                style={{
                  fontSize: "0.75rem",
                  padding: "0.25rem 0.6rem",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.25rem",
                }}
              >
                📥 Excel
              </button>
            </div>
          </div>

          {/* TABLA PRINCIPAL DE CRÉDITOS CON SCROLL INTERNO Y CABECERA FIJA */}
          <div className="table-scroll-container">
            <table className="table-compact" style={{ width: "100%" }}>
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Socio solicitante</th>
                  <th>Tipo / Fondo</th>
                  <th style={{ textAlign: "right" }}>Monto</th>
                  <th style={{ textAlign: "right", color: "#BF9903" }}>Saldo Vivo</th>
                  <th>Plazo</th>
                  <th style={{ textAlign: "right" }}>Cuota</th>
                  <th>Promotor</th>
                  <th style={{ textAlign: "center" }}>Estado</th>
                  <th style={{ textAlign: "center", minWidth: "140px" }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {prestamosPaginados.map((p) => {
                  const estaProcesando = procesandoId === p.id;
                  return (
                    <tr key={p.id} className={(cobrosPendientes.find(c => c.prestamo_id === p.id) || p.tiene_cobro_campo_pendiente) ? "row-cobrado" : ""}>
                      <td className="mono" style={{ fontWeight: 600, whiteSpace: "nowrap" }}>
                        <Link to={`/creditos/${p.id}`}>{p.codigo}</Link>
                        {p.numero_credito_anterior && (
                          <span
                            style={{
                              display: "block",
                              fontSize: "0.7rem",
                              color: "#b45309",
                              fontWeight: 600,
                            }}
                          >
                            Ref: {p.numero_credito_anterior}
                          </span>
                        )}
                      </td>
                      <td>
                        <Link
                          to={`/creditos/${p.id}`}
                          className={(cobrosPendientes.find(c => c.prestamo_id === p.id) || p.tiene_cobro_campo_pendiente) ? "strikethrough-text" : ""}
                          style={{ color: "inherit", textDecoration: "none", fontWeight: 600 }}
                        >
                          {p.socio_nombres}
                        </Link>
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: "0.3rem", alignItems: "center", flexWrap: "wrap" }}>
                          <span style={{ fontSize: "0.75rem" }}>{TIPO_PRESTAMO_LABEL[p.tipo]}</span>
                          {p.origen_fondos && (
                            <span
                              style={{
                                fontSize: "0.65rem",
                                fontWeight: 700,
                                padding: "0.08rem 0.3rem",
                                borderRadius: "4px",
                                width: "fit-content",
                                ...ORIGEN_FONDOS_BADGE_STYLE[p.origen_fondos],
                              }}
                            >
                              {ORIGEN_FONDOS_SHORT_LABEL[p.origen_fondos]}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="mono" style={{ textAlign: "right", fontWeight: 700 }}>
                        <span className={(cobrosPendientes.find(c => c.prestamo_id === p.id) || p.tiene_cobro_campo_pendiente) ? "strikethrough-text" : ""}>
                          {formatoQ(p.monto_aprobado ?? p.monto_solicitado)}
                        </span>
                      </td>
                      <td className="mono" style={{ textAlign: "right", fontWeight: 700, color: "#BF9903", whiteSpace: "nowrap" }}>
                        <span className={(cobrosPendientes.find(c => c.prestamo_id === p.id) || p.tiene_cobro_campo_pendiente) ? "strikethrough-text" : ""}>
                          {formatoQ(p.saldo_capital != null ? Number(p.saldo_capital) : Number(p.monto_aprobado ?? p.monto_solicitado))}
                        </span>
                      </td>
                      <td className="mono">{p.plazo_meses}m</td>
                      <td className="mono" style={{ textAlign: "right", color: "var(--accent)" }}>
                        <span className={(cobrosPendientes.find(c => c.prestamo_id === p.id) || p.tiene_cobro_campo_pendiente) ? "strikethrough-text" : ""}>
                          {formatoQ(p.cuota_mensual)}
                        </span>
                      </td>
                      <td style={{ fontSize: "0.78rem" }}>
                        {p.promotor_nombre ?? <span style={{ color: "var(--ink-soft)" }}>—</span>}
                      </td>
                      <td style={{ textAlign: "center" }}>
                        <span
                          className={`badge ${
                            p.estado === "DESEMBOLSADO"
                              ? "activo"
                              : p.estado === "APROBADO"
                              ? "info"
                              : p.estado === "SOLICITUD"
                              ? "warning"
                              : "inactivo"
                          }`}
                          style={{ fontSize: "0.72rem", padding: "0.15rem 0.45rem" }}
                        >
                          {ESTADO_PRESTAMO_LABEL[p.estado]}
                        </span>
                      </td>

                      {/* COLUMNA DE ACCIONES RÁPIDAS EN 1 FILA COMPACTA */}
                      <td style={{ textAlign: "center" }}>
                        <div style={{ display: "flex", gap: "0.25rem", justifyContent: "center", alignItems: "center", whiteSpace: "nowrap" }}>
                          {/* ACCIÓN PARA ESTADO APROBADO: DESEMBOLSAR */}
                          {p.estado === "APROBADO" && puedeGestionar && (
                            <button
                              type="button"
                              className="btn"
                              style={{
                                background: "#059669",
                                borderColor: "#059669",
                                fontSize: "0.72rem",
                                padding: "0.18rem 0.45rem",
                                fontWeight: 700,
                              }}
                              disabled={estaProcesando}
                              onClick={() =>
                                setModalAccion({
                                  prestamo: p,
                                  nuevoEstado: "DESEMBOLSADO",
                                  titulo: `💵 Confirmar Desembolso de ${p.codigo}`,
                                  mensaje: `¿Deseas desembolsar y entregar ${formatoQ(p.monto_aprobado ?? p.monto_solicitado)} al socio ${p.socio_nombres}? El crédito entrará inmediatamente a cartera activa.`,
                                  colorBoton: "#059669",
                                })
                              }
                            >
                              {estaProcesando ? "…" : "⚡ Desembolsar"}
                            </button>
                          )}

                          {/* ACCIÓN PARA ESTADO SOLICITUD: APROBAR O RECHAZAR */}
                          {p.estado === "SOLICITUD" && puedeGestionar && (
                            <>
                              <button
                                type="button"
                                className="btn"
                                style={{
                                  background: "#2563eb",
                                  borderColor: "#2563eb",
                                  fontSize: "0.72rem",
                                  padding: "0.18rem 0.4rem",
                                }}
                                disabled={estaProcesando}
                                onClick={() => ejecutarCambioEstado(p.id, "APROBADO", p.codigo)}
                              >
                                ✓ Aprobar
                              </button>
                              <button
                                type="button"
                                className="btn danger"
                                style={{ fontSize: "0.72rem", padding: "0.18rem 0.35rem" }}
                                disabled={estaProcesando}
                                onClick={() =>
                                  setModalAccion({
                                    prestamo: p,
                                    nuevoEstado: "RECHAZADO",
                                    titulo: `✕ Rechazar Solicitud ${p.codigo}`,
                                    mensaje: `¿Confirmas que deseas rechazar la solicitud de crédito de ${p.socio_nombres}?`,
                                    colorBoton: "#dc2626",
                                  })
                                }
                              >
                                ✕
                              </button>
                            </>
                          )}

                          {/* ACCIÓN PARA ESTADO DESEMBOLSADO: COBRAR O CANCELAR/LIQUIDAR */}
                          {p.estado === "DESEMBOLSADO" && (
                            <>
                              {usuario?.rol === "PROMOTOR" ? (
                                (() => {
                                  const cobroPendiente = cobrosPendientes.find(c => c.prestamo_id === p.id) || p.tiene_cobro_campo_pendiente;
                                  if (cobroPendiente) {
                                    return (
                                      <button
                                        type="button"
                                        className="btn secondary"
                                        style={{ fontSize: "0.72rem", padding: "0.18rem 0.45rem", borderColor: "#f59e0b", color: "#d97706" }}
                                        disabled
                                      >
                                        ✓ Cobrado hoy
                                      </button>
                                    );
                                  } else {
                                    return (
                                      <button
                                        type="button"
                                        className="btn secondary"
                                        style={{ fontSize: "0.72rem", padding: "0.18rem 0.45rem", borderColor: "#10b981", color: "#10b981" }}
                                        title="Registrar recibo de campo"
                                        onClick={() => setModalCobroPrestamo({ id: p.id, socioId: p.socio_id, socioNombres: p.socio_nombres || "Socio Desconocido" })}
                                      >
                                        💰 Cobro Campo
                                      </button>
                                    );
                                  }
                                })()
                              ) : (
                                <Link
                                  to={`/auxiliar-caja?socioId=${p.socio_id}&prestamoId=${p.id}&accion=COBRO_CUOTA`}
                                  className="btn secondary"
                                  style={{ fontSize: "0.72rem", padding: "0.18rem 0.45rem", borderColor: "#10b981", color: "#10b981", textDecoration: "none" }}
                                  title="Cobrar cuota en ventanilla con este crédito seleccionado"
                                >
                                  💰 Cobrar
                                </Link>
                              )}
                              {puedeGestionar && (
                                (() => {
                                  const saldoVivo = Number(p.saldo_capital != null ? p.saldo_capital : (p.monto_aprobado ?? p.monto_solicitado));
                                  const tieneDeuda = saldoVivo > 0.01;
                                  return (
                                    <button
                                      type="button"
                                      className="btn secondary"
                                      style={{
                                        fontSize: "0.72rem",
                                        padding: "0.18rem 0.35rem",
                                        borderColor: tieneDeuda ? "rgba(239, 68, 68, 0.4)" : "var(--line)",
                                        color: tieneDeuda ? "#ef4444" : "var(--ink-soft)",
                                      }}
                                      title={tieneDeuda ? `Alerta: Saldo vivo pendiente ${formatoQ(saldoVivo)}. Requiere autorización gerencial.` : "Liquidar crédito solvente"}
                                      disabled={estaProcesando}
                                      onClick={() =>
                                        setModalAccion({
                                          prestamo: p,
                                          nuevoEstado: "CANCELADO",
                                          titulo: tieneDeuda
                                            ? `⚠️ Autorización de Cancelación con Saldo Activo: ${p.codigo}`
                                            : `🏁 Liquidar / Cancelar Crédito ${p.codigo}`,
                                          mensaje: tieneDeuda
                                            ? `ATENCIÓN: Este crédito aún posee un saldo vivo pendiente de ${formatoQ(saldoVivo)}. Si confirmas la cancelación manual, el préstamo saldrá de cartera activa como CANCELADO sin haber registrado el cobro de capital en caja. ¿Deseas autorizar esta baja especial por Gerencia General / Consejo?`
                                            : `¿Confirmas que el crédito de ${p.socio_nombres} ha sido totalmente pagado y liquidado (Saldo: Q 0.00)?`,
                                          colorBoton: tieneDeuda ? "#dc2626" : "#4b5563",
                                        })
                                      }
                                    >
                                      {tieneDeuda ? "Finalizar ⚠️" : "Liquidar"}
                                    </button>
                                  );
                                })()
                              )}
                            </>
                          )}

                          {/* Botón Pagaré Notarial */}
                          <button
                            type="button"
                            className="btn secondary"
                            style={{ fontSize: "0.72rem", padding: "0.15rem 0.4rem", display: "flex", alignItems: "center", gap: "0.2rem" }}
                            title="Emitir Pagaré Libre de Protesto y Contrato de Mutuo"
                            onClick={() => setPrestamoParaContrato(p)}
                          >
                            📜 Pagaré
                          </button>

                          {/* Botón Ver Ficha */}
                          <Link
                            to={`/creditos/${p.id}`}
                            className="link-btn"
                            style={{ fontSize: "0.72rem", padding: "0.15rem 0.35rem", textDecoration: "none" }}
                          >
                            Ficha →
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr style={{ background: "var(--paper-raised)", borderTop: "2px solid var(--line)", fontWeight: 800 }}>
                  <td colSpan={3} style={{ textAlign: "right", color: "var(--ink)", padding: "0.65rem 0.75rem", fontSize: "0.85rem" }}>
                    TOTAL CARTERA ({totalCreditos} créditos):
                  </td>
                  <td className="mono" style={{ textAlign: "right", color: "var(--ink)", padding: "0.65rem 0.75rem", fontSize: "0.88rem", fontWeight: 800 }}>
                    {formatoQ(totalDesembolsado)}
                  </td>
                  <td className="mono" style={{ textAlign: "right", color: "#BF9903", padding: "0.65rem 0.75rem", fontSize: "0.88rem", fontWeight: 800 }}>
                    {formatoQ(totalSaldoVivo)}
                  </td>
                  <td style={{ textAlign: "center", fontSize: "0.75rem", color: "var(--ink-soft)" }}>—</td>
                  <td className="mono" style={{ textAlign: "right", color: "var(--accent)", padding: "0.65rem 0.75rem", fontSize: "0.88rem", fontWeight: 800 }}>
                    {formatoQ(totalCuotas)}
                  </td>
                  <td colSpan={3} style={{ textAlign: "center", fontSize: "0.75rem", color: "var(--ink-soft)", padding: "0.65rem 0.75rem" }}>
                    {desembolsados} en cobro activo · {aprobados} por desembolsar
                  </td>
                </tr>
              </tfoot>
            </table>

            {prestamos && prestamos.length === 0 && (
              <div className="empty" style={{ padding: "1.5rem" }}>No se encontraron créditos registrados con los filtros aplicados.</div>
            )}
          </div>
        </>
      ) : (
        /* VISTA: DIRECTORIO DE FIADORES */
        <>
          {/* FRANJA COMPACTA DE RESUMEN DE FIADORES */}
          <div className="screen-kpis" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
            <div
              className="stat-card"
              style={{
                padding: "0.4rem 0.75rem",
                cursor: "pointer",
                border: filtroTipoFiador === "TODOS" ? "2px solid var(--accent)" : undefined,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
              onClick={() => setFiltroTipoFiador("TODOS")}
            >
              <div>
                <span className="label" style={{ fontSize: "0.66rem", display: "block" }}>Total Fiadores</span>
                <span className="value mono" style={{ fontSize: "1.05rem" }}>{fiadores?.length ?? 0}</span>
              </div>
              <span style={{ fontSize: "1.2rem", opacity: 0.8 }}>👥</span>
            </div>

            <div
              className="stat-card"
              style={{
                padding: "0.4rem 0.75rem",
                cursor: "pointer",
                border: filtroTipoFiador === "EXTERNOS" ? "2px solid #0ea5e9" : undefined,
                background: "rgba(14, 165, 233, 0.08)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
              onClick={() => setFiltroTipoFiador("EXTERNOS")}
            >
              <div>
                <span className="label" style={{ fontSize: "0.66rem", color: "#0ea5e9", fontWeight: 700, display: "block" }}>
                  👤 Externos (Sin cuenta)
                </span>
                <span className="value mono" style={{ fontSize: "1.05rem", color: "#0ea5e9" }}>
                  {fiadores?.filter((f) => !f.es_socio_activo).length ?? 0}
                </span>
              </div>
              <span style={{ fontSize: "1.2rem", color: "#0ea5e9" }}>🎯</span>
            </div>

            <div
              className="stat-card"
              style={{
                padding: "0.4rem 0.75rem",
                cursor: "pointer",
                border: filtroTipoFiador === "SOCIOS" ? "2px solid #10b981" : undefined,
                background: "rgba(16, 185, 129, 0.08)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
              onClick={() => setFiltroTipoFiador("SOCIOS")}
            >
              <div>
                <span className="label" style={{ fontSize: "0.66rem", color: "#10b981", fontWeight: 700, display: "block" }}>
                  🤝 Fiadores Socios
                </span>
                <span className="value mono" style={{ fontSize: "1.05rem", color: "#10b981" }}>
                  {fiadores?.filter((f) => f.es_socio_activo).length ?? 0}
                </span>
              </div>
              <span style={{ fontSize: "1.2rem", color: "#10b981" }}>💳</span>
            </div>
          </div>

          {/* BARRA DE BÚSQUEDA Y FILTROS DE FIADORES */}
          <div className="screen-toolbar">
            <div className="searchbar" style={{ flex: 1, minWidth: 240, marginBottom: 0 }}>
              <input
                placeholder="🔍 Buscar por fiador, DPI, teléfono, socio o crédito…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                style={{ padding: "0.35rem 0.65rem", fontSize: "0.82rem" }}
              />
            </div>

            <div style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap" }}>
              <button
                type="button"
                className={`btn ${filtroTipoFiador === "TODOS" ? "primary" : "secondary"}`}
                style={{ fontSize: "0.75rem", padding: "0.25rem 0.55rem" }}
                onClick={() => setFiltroTipoFiador("TODOS")}
              >
                Todos ({fiadores?.length ?? 0})
              </button>
              <button
                type="button"
                className={`btn ${filtroTipoFiador === "EXTERNOS" ? "primary" : "secondary"}`}
                style={{
                  fontSize: "0.75rem",
                  padding: "0.25rem 0.55rem",
                  borderColor: "#0ea5e9",
                  color: filtroTipoFiador === "EXTERNOS" ? "#fff" : "#0ea5e9",
                  fontWeight: 700,
                }}
                onClick={() => setFiltroTipoFiador("EXTERNOS")}
              >
                👤 Externos ({fiadores?.filter((f) => !f.es_socio_activo).length ?? 0})
              </button>
              <button
                type="button"
                className={`btn ${filtroTipoFiador === "SOCIOS" ? "primary" : "secondary"}`}
                style={{
                  fontSize: "0.75rem",
                  padding: "0.25rem 0.55rem",
                  borderColor: "#10b981",
                  color: filtroTipoFiador === "SOCIOS" ? "#fff" : "#10b981",
                }}
                onClick={() => setFiltroTipoFiador("SOCIOS")}
              >
                🤝 Socios ({fiadores?.filter((f) => f.es_socio_activo).length ?? 0})
              </button>
            </div>
          </div>

          {/* TABLA DEL DIRECTORIO DE FIADORES CON SCROLL INTERNO */}
          <div className="table-scroll-container">
            <table className="table-compact" style={{ width: "100%" }}>
              <thead>
                <tr>
                  <th>Nombre del Fiador</th>
                  <th>DPI / Identificación</th>
                  <th>Contacto / Teléfono</th>
                  <th>Lugar / Trabajo</th>
                  <th style={{ textAlign: "center" }}>Perfil en Cooperativa</th>
                  <th>Crédito que avala</th>
                  <th style={{ textAlign: "center" }}>Acción</th>
                </tr>
              </thead>
              <tbody>
                {fiadores?.map((f, idx) => {
                  return (
                    <tr key={`${f.prestamo_id}-${idx}`}>
                      <td style={{ fontWeight: 600 }}>{f.nombre_fiador}</td>
                      <td className="mono">{f.dpi_fiador ? formatearDPI(f.dpi_fiador) : "—"}</td>
                      <td>
                        {f.telefono_fiador ? (
                          <div style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                            <span className="mono">{formatearTelefono(f.telefono_fiador)}</span>
                          </div>
                        ) : (
                          <span style={{ color: "var(--ink-soft)" }}>—</span>
                        )}
                      </td>
                      <td style={{ fontSize: "0.78rem", color: "var(--ink-soft)" }}>
                        {f.lugar_fiador || "—"}
                      </td>
                      <td style={{ textAlign: "center" }}>
                        {f.es_socio_activo ? (
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "0.25rem",
                              fontSize: "0.72rem",
                              fontWeight: 700,
                              padding: "0.15rem 0.45rem",
                              borderRadius: "6px",
                              background: "rgba(16, 185, 129, 0.15)",
                              color: "#10b981",
                              border: "1px solid rgba(16, 185, 129, 0.3)",
                            }}
                          >
                            🤝 Socio: {f.socio_fiador_numero}
                          </span>
                        ) : (
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "0.25rem",
                              fontSize: "0.72rem",
                              fontWeight: 700,
                              padding: "0.15rem 0.45rem",
                              borderRadius: "6px",
                              background: "rgba(14, 165, 233, 0.12)",
                              color: "#38bdf8",
                              border: "1px solid rgba(14, 165, 233, 0.3)",
                            }}
                          >
                            👤 Fiador Externo
                          </span>
                        )}
                      </td>
                      <td>
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.1rem" }}>
                          <Link
                            to={`/creditos/${f.prestamo_id}`}
                            style={{ fontWeight: 700, color: "var(--accent, #38bdf8)", textDecoration: "none", fontSize: "0.82rem" }}
                          >
                            {f.prestamo_codigo}
                          </Link>
                          <span style={{ fontSize: "0.74rem", color: "var(--ink-soft)" }}>
                            {f.socio_nombre} · {formatoQ(f.monto_aprobado ?? f.monto_solicitado)}
                          </span>
                        </div>
                      </td>
                      <td style={{ textAlign: "center" }}>
                        <div style={{ display: "flex", gap: "0.25rem", justifyContent: "center", alignItems: "center" }}>
                          {!f.es_socio_activo ? (
                            <Link
                              to={`/socios/nuevo?nombres=${encodeURIComponent(f.nombre_fiador)}&dpi=${encodeURIComponent(f.dpi_fiador || "")}&telefono=${encodeURIComponent(f.telefono_fiador || "")}&direccion=${encodeURIComponent(f.lugar_fiador || "")}`}
                              className="btn"
                              style={{
                                background: "#0284c7",
                                borderColor: "#0284c7",
                                fontSize: "0.72rem",
                                padding: "0.18rem 0.45rem",
                                fontWeight: 700,
                                textDecoration: "none",
                              }}
                              title="Afiliar como nuevo socio"
                            >
                              + Afiliar
                            </Link>
                          ) : (
                            <Link
                              to={`/socios/${f.socio_fiador_id}`}
                              className="btn secondary"
                              style={{
                                fontSize: "0.72rem",
                                padding: "0.18rem 0.45rem",
                                textDecoration: "none",
                              }}
                            >
                              Socio →
                            </Link>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {cargandoFiadores && (
              <div style={{ padding: "1.5rem", textAlign: "center", color: "var(--ink-soft)" }}>
                🔍 Cargando directorio de fiadores…
              </div>
            )}

            {!cargandoFiadores && fiadores && fiadores.length === 0 && (
              <div className="empty" style={{ padding: "1.5rem" }}>No se encontraron fiadores registrados con los filtros aplicados.</div>
            )}
          </div>
        </>
      )}

      {/* PAGINACIÓN COMPACTA EN PIE DE PANTALLA */}
      {pestanaActiva === "CREDITOS" && totalCreditos > pageSize && (
        <div className="screen-footer">
          <span style={{ color: "var(--ink-soft)" }}>
            Mostrando {prestamosPaginados.length} de {totalCreditos} créditos · Pág. {page} de {totalPaginas}
          </span>
          <div style={{ display: "flex", gap: "0.4rem" }}>
            <button
              className="btn secondary"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              style={{ fontSize: "0.75rem", padding: "0.22rem 0.6rem" }}
            >
              ← Anterior
            </button>
            <button
              className="btn secondary"
              disabled={page >= totalPaginas}
              onClick={() => setPage((p) => p + 1)}
              style={{ fontSize: "0.75rem", padding: "0.22rem 0.6rem" }}
            >
              Siguiente →
            </button>
          </div>
        </div>
      )}

      {/* MODAL DE CONFIRMACIÓN DE ACCIÓN RÁPIDA */}
      {modalAccion && (
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
            alignItems: "center",
            padding: "1rem",
          }}
        >
          <div
            className="card"
            style={{
              width: "100%",
              maxWidth: "480px",
              background: "var(--paper)",
              borderRadius: "10px",
              boxShadow: "0 20px 40px -10px rgba(0, 0, 0, 0.5)",
              border: "1px solid var(--line)",
              padding: "1.25rem",
            }}
          >
            <h3 style={{ margin: "0 0 0.75rem", fontSize: "1.05rem" }}>{modalAccion.titulo}</h3>
            <p style={{ fontSize: "0.88rem", color: "var(--ink)", lineHeight: 1.5, margin: "0 0 1.25rem" }}>
              {modalAccion.mensaje}
            </p>

            <div style={{ display: "flex", gap: "0.6rem", justifyContent: "flex-end" }}>
              <button
                type="button"
                className="btn secondary"
                onClick={() => setModalAccion(null)}
                disabled={Boolean(procesandoId)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn"
                style={{
                  background: modalAccion.colorBoton,
                  borderColor: modalAccion.colorBoton,
                  fontWeight: 700,
                }}
                disabled={Boolean(procesandoId)}
                onClick={() =>
                  ejecutarCambioEstado(modalAccion.prestamo.id, modalAccion.nuevoEstado, modalAccion.prestamo.codigo)
                }
              >
                {procesandoId ? "Procesando…" : "Confirmar Acción"}
              </button>
            </div>
          </div>
        </div>
      )}

      {modalCobroPrestamo && (
        <CobroCampoModal
          prestamoId={modalCobroPrestamo.id}
          socioId={modalCobroPrestamo.socioId}
          socioNombres={modalCobroPrestamo.socioNombres}
          cobroExistente={modalCobroPrestamo.cobroExistente}
          onClose={() => setModalCobroPrestamo(null)}
          onSuccess={() => {
            setModalCobroPrestamo(null);
            cargar();
          }}
        />
      )}

      {prestamoParaContrato && (
        <ContratoPagareCreditoModal
          prestamo={prestamoParaContrato}
          onClose={() => setPrestamoParaContrato(null)}
        />
      )}
    </div>
  );
}
