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
import type { EstadoPrestamo, Prestamo, FiadorItem } from "../types";
import { formatearDPI, formatearTelefono } from "../lib/formatters";

export default function CreditosList() {
  const { usuario } = useAuth();
  const puedeGestionar =
    usuario?.rol === "ADMIN" ||
    usuario?.rol === "GERENCIA" ||
    usuario?.rol === "SUPERVISOR" ||
    usuario?.rol === "CAJERO";

  const [pestanaActiva, setPestanaActiva] = useState<"CREDITOS" | "FIADORES">("CREDITOS");

  const [prestamos, setPrestamos] = useState<Prestamo[] | null>(null);
  const [fiadores, setFiadores] = useState<FiadorItem[] | null>(null);
  const [cargandoFiadores, setCargandoFiadores] = useState(false);

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
          {/* FRANJA HORIZONTAL DE KPIS COMPACTA (1 FILA DELGADA) */}
          <div className="screen-kpis" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
            <div
              className="stat-card accent"
              style={{
                padding: "0.4rem 0.75rem",
                cursor: "pointer",
                border: estadoFiltro === "DESEMBOLSADO" ? "2px solid #10b981" : undefined,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
              onClick={() => setEstadoFiltro(estadoFiltro === "DESEMBOLSADO" ? "" : "DESEMBOLSADO")}
              title="Filtrar por préstamos en cobro activo"
            >
              <div>
                <span className="label" style={{ fontSize: "0.66rem", display: "block" }}>Cartera Activa ({desembolsados})</span>
                <span className="value mono" style={{ fontSize: "1.05rem" }}>{formatoQ(totalDesembolsado)}</span>
              </div>
              <span style={{ fontSize: "1.2rem", opacity: 0.8 }}>💼</span>
            </div>

            <div
              className="stat-card"
              style={{
                padding: "0.4rem 0.75rem",
                cursor: "pointer",
                border: estadoFiltro === "APROBADO" ? "2px solid #3b82f6" : undefined,
                background: aprobados > 0 ? "rgba(59, 130, 246, 0.08)" : undefined,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
              onClick={() => setEstadoFiltro(estadoFiltro === "APROBADO" ? "" : "APROBADO")}
              title="Filtrar créditos aprobados listos para desembolso"
            >
              <div>
                <span className="label" style={{ fontSize: "0.66rem", color: aprobados > 0 ? "#3b82f6" : undefined, fontWeight: 700, display: "block" }}>
                  Por Desembolsar
                </span>
                <span className="value mono" style={{ fontSize: "1.05rem", color: aprobados > 0 ? "#3b82f6" : undefined }}>
                  {aprobados}
                </span>
              </div>
              <span style={{ fontSize: "1.2rem", color: "#3b82f6" }}>⚡</span>
            </div>

            <div
              className="stat-card"
              style={{
                padding: "0.4rem 0.75rem",
                cursor: "pointer",
                border: estadoFiltro === "SOLICITUD" ? "2px solid #f59e0b" : undefined,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
              onClick={() => setEstadoFiltro(estadoFiltro === "SOLICITUD" ? "" : "SOLICITUD")}
              title="Filtrar solicitudes en evaluación"
            >
              <div>
                <span className="label" style={{ fontSize: "0.66rem", display: "block" }}>En Solicitud</span>
                <span className="value mono" style={{ fontSize: "1.05rem", color: "#f59e0b" }}>{pendientes}</span>
              </div>
              <span style={{ fontSize: "1.2rem", opacity: 0.8 }}>⏳</span>
            </div>

            <div
              className="stat-card"
              style={{
                padding: "0.4rem 0.75rem",
                cursor: "pointer",
                border: estadoFiltro === "" ? "2px solid var(--accent)" : undefined,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
              onClick={() => setEstadoFiltro("")}
              title="Ver todos los créditos"
            >
              <div>
                <span className="label" style={{ fontSize: "0.66rem", display: "block" }}>Total Créditos</span>
                <span className="value mono" style={{ fontSize: "1.05rem" }}>{prestamos?.length ?? 0}</span>
              </div>
              <span style={{ fontSize: "1.2rem", opacity: 0.8 }}>📊</span>
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
                    <tr key={p.id}>
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
                        {formatoQ(p.monto_aprobado ?? p.monto_solicitado)}
                      </td>
                      <td className="mono">{p.plazo_meses}m</td>
                      <td className="mono" style={{ textAlign: "right", color: "var(--accent)" }}>
                        {formatoQ(p.cuota_mensual)}
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
                              <Link
                                to="/caja-auxiliar"
                                className="btn secondary"
                                style={{ fontSize: "0.72rem", padding: "0.18rem 0.45rem", borderColor: "#10b981", color: "#10b981" }}
                                title="Ir a Caja Auxiliar a registrar cobro de cuota"
                              >
                                💰 Cobrar
                              </Link>
                              {puedeGestionar && (
                                <button
                                  type="button"
                                  className="btn secondary"
                                  style={{ fontSize: "0.72rem", padding: "0.18rem 0.35rem" }}
                                  title="Liquidar o Cancelar préstamo"
                                  disabled={estaProcesando}
                                  onClick={() =>
                                    setModalAccion({
                                      prestamo: p,
                                      nuevoEstado: "CANCELADO",
                                      titulo: `🏁 Liquidar / Cancelar Crédito ${p.codigo}`,
                                      mensaje: `¿Confirmas que el crédito de ${p.socio_nombres} ha sido totalmente pagado y liquidado?`,
                                      colorBoton: "#4b5563",
                                    })
                                  }
                                >
                                  Finalizar
                                </button>
                              )}
                            </>
                          )}

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
    </div>
  );
}
