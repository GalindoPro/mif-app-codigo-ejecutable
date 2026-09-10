import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, mensajeError } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import {
  ESTADO_PRESTAMO_LABEL,
  TIPO_PRESTAMO_LABEL,
  ORIGEN_FONDOS_SHORT_LABEL,
  ORIGEN_FONDOS_BADGE_STYLE,
} from "../types";
import { formatearQuetzales } from "../lib/formatters";
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

  // Saldo vivo real (lo que los socios deben hoy), no el monto original
  // colocado — mismo criterio que el Tablero y el Kardex de Cartera.
  const totalDesembolsado =
    prestamos
      ?.filter((p) => p.estado === "DESEMBOLSADO")
      .reduce((acc, p) => acc + Number(p.saldo_capital ?? p.monto_aprobado ?? p.monto_solicitado), 0) ?? 0;

  const pendientes = prestamos?.filter((p) => p.estado === "SOLICITUD").length ?? 0;
  const aprobados = prestamos?.filter((p) => p.estado === "APROBADO").length ?? 0;
  const desembolsados = prestamos?.filter((p) => p.estado === "DESEMBOLSADO").length ?? 0;
  const cancelados = prestamos?.filter((p) => p.estado === "CANCELADO").length ?? 0;

  const totalCreditos = prestamos?.length ?? 0;
  const totalPaginas = Math.max(1, Math.ceil(totalCreditos / pageSize));
  const prestamosPaginados = prestamos?.slice((page - 1) * pageSize, page * pageSize) ?? [];

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Módulo de Créditos</h1>
          <p>
            Gestión integral de cartera, colocación fiduciaria/hipotecaria y desembolso inmediato para el Jefe de Agencia.
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
          <Link to="/creditos/simulador" className="btn secondary">
            📊 Simulador de crédito
          </Link>
          <Link to="/creditos/nuevo" className="btn">
            + Nueva solicitud
          </Link>
        </div>
      </div>

      {mensajeExito && <div className="alert success" style={{ marginBottom: "1rem" }}>{mensajeExito}</div>}
      {error && <div className="alert error" style={{ marginBottom: "1rem" }}>{error}</div>}

      {/* PESTAÑAS PRINCIPALES: CARTERA DE CRÉDITOS VS DIRECTORIO DE FIADORES */}
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.25rem", borderBottom: "1px solid var(--line)", paddingBottom: "0.5rem" }}>
        <button
          type="button"
          onClick={() => setPestanaActiva("CREDITOS")}
          style={{
            padding: "0.5rem 1rem",
            borderRadius: "8px",
            border: "none",
            fontSize: "0.92rem",
            fontWeight: 700,
            cursor: "pointer",
            background: pestanaActiva === "CREDITOS" ? "var(--primary, #0284c7)" : "transparent",
            color: pestanaActiva === "CREDITOS" ? "#ffffff" : "var(--ink-soft)",
            display: "flex",
            alignItems: "center",
            gap: "0.45rem",
            transition: "all 0.15s ease",
          }}
        >
          <span>📑</span>
          <span>Cartera de Créditos</span>
          <span
            style={{
              fontSize: "0.75rem",
              padding: "0.1rem 0.45rem",
              borderRadius: "10px",
              background: pestanaActiva === "CREDITOS" ? "rgba(255,255,255,0.25)" : "var(--mono-bg, #1e293b)",
              color: pestanaActiva === "CREDITOS" ? "#fff" : "var(--ink-soft)",
            }}
          >
            {totalCreditos}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setPestanaActiva("FIADORES")}
          style={{
            padding: "0.5rem 1rem",
            borderRadius: "8px",
            border: "none",
            fontSize: "0.92rem",
            fontWeight: 700,
            cursor: "pointer",
            background: pestanaActiva === "FIADORES" ? "#0ea5e9" : "transparent",
            color: pestanaActiva === "FIADORES" ? "#ffffff" : "var(--ink-soft)",
            display: "flex",
            alignItems: "center",
            gap: "0.45rem",
            transition: "all 0.15s ease",
          }}
        >
          <span>👥</span>
          <span>Directorio de Fiadores</span>
          {fiadores && (
            <span
              style={{
                fontSize: "0.75rem",
                padding: "0.1rem 0.45rem",
                borderRadius: "10px",
                background: pestanaActiva === "FIADORES" ? "rgba(255,255,255,0.25)" : "rgba(14, 165, 233, 0.2)",
                color: pestanaActiva === "FIADORES" ? "#fff" : "#38bdf8",
                fontWeight: 700,
              }}
            >
              {fiadores.length}
            </span>
          )}
        </button>
      </div>

      {pestanaActiva === "CREDITOS" ? (
        <>
          {/* TARJETAS DE RESUMEN EJECUTIVO */}
          <div className="stat-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", marginBottom: "1.25rem" }}>
            <div
              className="stat-card accent"
              style={{ cursor: "pointer", border: estadoFiltro === "DESEMBOLSADO" ? "2px solid #10b981" : undefined }}
              onClick={() => setEstadoFiltro(estadoFiltro === "DESEMBOLSADO" ? "" : "DESEMBOLSADO")}
            >
              <span className="label">Cartera Activa ({desembolsados})</span>
              <span className="value">{formatearQuetzales(totalDesembolsado)}</span>
              <span className="sub">Préstamos desembolsados en cobro</span>
            </div>

            <div
              className="stat-card"
              style={{
                cursor: "pointer",
                border: estadoFiltro === "APROBADO" ? "2px solid #3b82f6" : undefined,
                background: aprobados > 0 ? "rgba(59, 130, 246, 0.08)" : undefined,
              }}
              onClick={() => setEstadoFiltro(estadoFiltro === "APROBADO" ? "" : "APROBADO")}
            >
              <span className="label" style={{ color: aprobados > 0 ? "#3b82f6" : undefined, fontWeight: 700 }}>
                Listos para Desembolso
              </span>
              <span className="value mono" style={{ color: aprobados > 0 ? "#3b82f6" : undefined }}>
                {aprobados}
              </span>
              <span className="sub">{aprobados > 0 ? "⚡ Requieren entrega de fondos" : "Aprobados"}</span>
            </div>

            <div
              className="stat-card"
              style={{ cursor: "pointer", border: estadoFiltro === "SOLICITUD" ? "2px solid #f59e0b" : undefined }}
              onClick={() => setEstadoFiltro(estadoFiltro === "SOLICITUD" ? "" : "SOLICITUD")}
            >
              <span className="label">Solicitudes Pendientes</span>
              <span className="value mono">{pendientes}</span>
              <span className="sub">En evaluación de comité</span>
            </div>

            <div
              className="stat-card"
              style={{ cursor: "pointer", border: estadoFiltro === "" ? "2px solid var(--accent)" : undefined }}
              onClick={() => setEstadoFiltro("")}
            >
              <span className="label">Total Solicitudes</span>
              <span className="value mono">{prestamos?.length ?? 0}</span>
              <span className="sub">Historial consolidado</span>
            </div>
          </div>

          {/* FILTROS Y CHIPS RÁPIDOS */}
          <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1rem", flexWrap: "wrap", alignItems: "center" }}>
            <div className="searchbar" style={{ flex: 1, minWidth: 260, marginBottom: 0 }}>
              <input
                placeholder="Buscar por socio, código de crédito o DPI…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>

            {/* Chips de estado rápido */}
            <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
              <button
                type="button"
                className={`btn ${estadoFiltro === "" ? "primary" : "secondary"}`}
                style={{ fontSize: "0.78rem", padding: "0.35rem 0.65rem" }}
                onClick={() => setEstadoFiltro("")}
              >
                Todos ({totalCreditos})
              </button>
              <button
                type="button"
                className={`btn ${estadoFiltro === "APROBADO" ? "primary" : "secondary"}`}
                style={{
                  fontSize: "0.78rem",
                  padding: "0.35rem 0.65rem",
                  borderColor: "#3b82f6",
                  color: estadoFiltro === "APROBADO" ? "#fff" : "#3b82f6",
                  fontWeight: aprobados > 0 ? 700 : 400,
                }}
                onClick={() => setEstadoFiltro(estadoFiltro === "APROBADO" ? "" : "APROBADO")}
              >
                Listos para Desembolso ({aprobados})
              </button>
              <button
                type="button"
                className={`btn ${estadoFiltro === "DESEMBOLSADO" ? "primary" : "secondary"}`}
                style={{ fontSize: "0.78rem", padding: "0.35rem 0.65rem" }}
                onClick={() => setEstadoFiltro(estadoFiltro === "DESEMBOLSADO" ? "" : "DESEMBOLSADO")}
              >
                Desembolsados ({desembolsados})
              </button>
              <button
                type="button"
                className={`btn ${estadoFiltro === "CANCELADO" ? "primary" : "secondary"}`}
                style={{ fontSize: "0.78rem", padding: "0.35rem 0.65rem" }}
                onClick={() => setEstadoFiltro(estadoFiltro === "CANCELADO" ? "" : "CANCELADO")}
              >
                Cancelados / Pagados ({cancelados})
              </button>
            </div>
          </div>

          {/* TABLA PRINCIPAL DE CRÉDITOS CON ACCIONES RÁPIDAS PARA EL JEFE DE AGENCIA */}
          <div className="table-wrap">
            <table style={{ fontSize: "0.85rem" }}>
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Socio solicitante</th>
                  <th>Tipo</th>
                  <th style={{ textAlign: "right" }}>Monto</th>
                  <th>Plazo</th>
                  <th style={{ textAlign: "right" }}>Cuota</th>
                  <th>Promotor</th>
                  <th style={{ textAlign: "center" }}>Estado</th>
                  <th style={{ textAlign: "center", minWidth: "160px" }}>Acciones Rápidas</th>
                </tr>
              </thead>
              <tbody>
                {prestamosPaginados.map((p) => {
                  const estaProcesando = procesandoId === p.id;
                  return (
                    <tr key={p.id}>
                      <td className="mono" style={{ fontWeight: 600 }}>
                        <Link to={`/creditos/${p.id}`}>{p.codigo}</Link>
                        {p.numero_credito_anterior && (
                          <span
                            style={{
                              display: "block",
                              fontSize: "0.72rem",
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
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem", alignItems: "flex-start" }}>
                          <span style={{ fontSize: "0.78rem" }}>{TIPO_PRESTAMO_LABEL[p.tipo]}</span>
                          {p.origen_fondos && (
                            <span
                              style={{
                                fontSize: "0.68rem",
                                fontWeight: 700,
                                padding: "0.1rem 0.35rem",
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
                        {formatearQuetzales(p.monto_aprobado ?? p.monto_solicitado)}
                      </td>
                      <td className="mono">{p.plazo_meses}m</td>
                      <td className="mono" style={{ textAlign: "right", color: "var(--accent)" }}>
                        {formatearQuetzales(p.cuota_mensual)}
                      </td>
                      <td style={{ fontSize: "0.8rem" }}>
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
                          style={{ fontSize: "0.75rem", padding: "0.2rem 0.5rem" }}
                        >
                          {ESTADO_PRESTAMO_LABEL[p.estado]}
                        </span>
                      </td>

                      {/* COLUMNA DE ACCIONES RÁPIDAS PARA EL JEFE DE AGENCIA */}
                      <td style={{ textAlign: "center" }}>
                        <div style={{ display: "flex", gap: "0.35rem", justifyContent: "center", alignItems: "center", flexWrap: "wrap" }}>
                          {/* ACCIÓN PARA ESTADO APROBADO: DESEMBOLSAR */}
                          {p.estado === "APROBADO" && puedeGestionar && (
                            <button
                              type="button"
                              className="btn"
                              style={{
                                background: "#059669",
                                borderColor: "#059669",
                                fontSize: "0.75rem",
                                padding: "0.22rem 0.55rem",
                                fontWeight: 700,
                              }}
                              disabled={estaProcesando}
                              onClick={() =>
                                setModalAccion({
                                  prestamo: p,
                                  nuevoEstado: "DESEMBOLSADO",
                                  titulo: `💵 Confirmar Desembolso de ${p.codigo}`,
                                  mensaje: `¿Deseas desembolsar y entregar ${formatearQuetzales(p.monto_aprobado ?? p.monto_solicitado)} al socio ${p.socio_nombres}? El crédito entrará inmediatamente a cartera activa.`,
                                  colorBoton: "#059669",
                                })
                              }
                            >
                              {estaProcesando ? "…" : "💵 Desembolsar"}
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
                                  fontSize: "0.75rem",
                                  padding: "0.22rem 0.5rem",
                                }}
                                disabled={estaProcesando}
                                onClick={() => ejecutarCambioEstado(p.id, "APROBADO", p.codigo)}
                              >
                                ✓ Aprobar
                              </button>
                              <button
                                type="button"
                                className="btn danger"
                                style={{ fontSize: "0.75rem", padding: "0.22rem 0.45rem" }}
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
                                style={{ fontSize: "0.75rem", padding: "0.22rem 0.5rem", borderColor: "#10b981", color: "#10b981" }}
                                title="Ir a Caja Auxiliar a registrar cobro de cuota"
                              >
                                💰 Cobrar
                              </Link>
                              {puedeGestionar && (
                                <button
                                  type="button"
                                  className="btn secondary"
                                  style={{ fontSize: "0.75rem", padding: "0.22rem 0.45rem" }}
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
                            style={{ fontSize: "0.78rem", padding: "0.2rem 0.4rem", textDecoration: "none" }}
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
              <div className="empty">No se encontraron créditos registrados con los filtros aplicados.</div>
            )}
          </div>
        </>
      ) : (
        /* VISTA: DIRECTORIO DE FIADORES */
        <div>
          {/* TARJETAS RESUMEN DE FIADORES */}
          <div className="stat-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", marginBottom: "1.25rem" }}>
            <div
              className="stat-card"
              style={{ cursor: "pointer", border: filtroTipoFiador === "TODOS" ? "2px solid var(--accent)" : undefined }}
              onClick={() => setFiltroTipoFiador("TODOS")}
            >
              <span className="label">Total Fiadores Registrados</span>
              <span className="value mono">{fiadores?.length ?? 0}</span>
              <span className="sub">Directorio consolidado de garantías</span>
            </div>

            <div
              className="stat-card"
              style={{
                cursor: "pointer",
                border: filtroTipoFiador === "EXTERNOS" ? "2px solid #0ea5e9" : undefined,
                background: "rgba(14, 165, 233, 0.08)",
              }}
              onClick={() => setFiltroTipoFiador("EXTERNOS")}
            >
              <span className="label" style={{ color: "#0ea5e9", fontWeight: 700 }}>
                👤 Fiadores Externos (Sin cuenta)
              </span>
              <span className="value mono" style={{ color: "#0ea5e9" }}>
                {fiadores?.filter((f) => !f.es_socio_activo).length ?? 0}
              </span>
              <span className="sub">🎯 Prospectos listos para afiliar</span>
            </div>

            <div
              className="stat-card"
              style={{
                cursor: "pointer",
                border: filtroTipoFiador === "SOCIOS" ? "2px solid #10b981" : undefined,
                background: "rgba(16, 185, 129, 0.08)",
              }}
              onClick={() => setFiltroTipoFiador("SOCIOS")}
            >
              <span className="label" style={{ color: "#10b981", fontWeight: 700 }}>
                🤝 Fiadores que son Socios
              </span>
              <span className="value mono" style={{ color: "#10b981" }}>
                {fiadores?.filter((f) => f.es_socio_activo).length ?? 0}
              </span>
              <span className="sub">Asociados activos con cuenta</span>
            </div>
          </div>

          {/* BARRA DE BÚSQUEDA Y FILTROS DE FIADORES */}
          <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1rem", flexWrap: "wrap", alignItems: "center" }}>
            <div className="searchbar" style={{ flex: 1, minWidth: 260, marginBottom: 0 }}>
              <input
                placeholder="Buscar por nombre del fiador, DPI, teléfono, socio o código de crédito…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>

            <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
              <button
                type="button"
                className={`btn ${filtroTipoFiador === "TODOS" ? "primary" : "secondary"}`}
                style={{ fontSize: "0.78rem", padding: "0.35rem 0.65rem" }}
                onClick={() => setFiltroTipoFiador("TODOS")}
              >
                Todos ({fiadores?.length ?? 0})
              </button>
              <button
                type="button"
                className={`btn ${filtroTipoFiador === "EXTERNOS" ? "primary" : "secondary"}`}
                style={{
                  fontSize: "0.78rem",
                  padding: "0.35rem 0.65rem",
                  borderColor: "#0ea5e9",
                  color: filtroTipoFiador === "EXTERNOS" ? "#fff" : "#0ea5e9",
                  fontWeight: 700,
                }}
                onClick={() => setFiltroTipoFiador("EXTERNOS")}
              >
                👤 Solo Externos (Sin cuenta)
              </button>
              <button
                type="button"
                className={`btn ${filtroTipoFiador === "SOCIOS" ? "primary" : "secondary"}`}
                style={{
                  fontSize: "0.78rem",
                  padding: "0.35rem 0.65rem",
                  borderColor: "#10b981",
                  color: filtroTipoFiador === "SOCIOS" ? "#fff" : "#10b981",
                }}
                onClick={() => setFiltroTipoFiador("SOCIOS")}
              >
                🤝 Solo Socios Activos
              </button>
            </div>
          </div>

          {/* TABLA DEL DIRECTORIO DE FIADORES */}
          <div className="table-wrap">
            <table style={{ fontSize: "0.85rem" }}>
              <thead>
                <tr>
                  <th>Nombre del Fiador</th>
                  <th>DPI / Identificación</th>
                  <th>Contacto / Teléfono</th>
                  <th>Lugar / Trabajo</th>
                  <th style={{ textAlign: "center" }}>Perfil en Cooperativa</th>
                  <th>Crédito que avala</th>
                  <th style={{ textAlign: "center", minWidth: "150px" }}>Acción Recomendada</th>
                </tr>
              </thead>
              <tbody>
                {fiadores?.map((f) => {
                  const telDigits = (f.telefono_fiador || "").replace(/\D/g, "");
                  const whatsappUrl = telDigits.length >= 8 ? `https://wa.me/502${telDigits.slice(-8)}` : null;

                  return (
                    <tr key={f.prestamo_id}>
                      <td style={{ fontWeight: 700, color: "var(--ink)" }}>
                        <span>👤 {f.nombre_fiador}</span>
                      </td>
                      <td className="mono" style={{ fontSize: "0.82rem" }}>
                        {f.dpi_fiador ? formatearDPI(f.dpi_fiador) : <span style={{ color: "var(--ink-soft)" }}>—</span>}
                      </td>
                      <td>
                        {f.telefono_fiador ? (
                          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                            <span className="mono" style={{ fontSize: "0.82rem" }}>{formatearTelefono(f.telefono_fiador)}</span>
                            {whatsappUrl && (
                              <a
                                href={whatsappUrl}
                                target="_blank"
                                rel="noreferrer"
                                style={{
                                  textDecoration: "none",
                                  fontSize: "0.75rem",
                                  background: "rgba(37, 211, 102, 0.15)",
                                  color: "#25d366",
                                  padding: "0.1rem 0.35rem",
                                  borderRadius: "4px",
                                  fontWeight: 700,
                                }}
                                title="Abrir WhatsApp"
                              >
                                WA 💬
                              </a>
                            )}
                          </div>
                        ) : (
                          <span style={{ color: "var(--ink-soft)" }}>—</span>
                        )}
                      </td>
                      <td style={{ fontSize: "0.82rem", color: "var(--ink-soft)" }}>
                        {f.lugar_fiador || "—"}
                      </td>
                      <td style={{ textAlign: "center" }}>
                        {f.es_socio_activo ? (
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "0.3rem",
                              fontSize: "0.75rem",
                              fontWeight: 700,
                              padding: "0.2rem 0.55rem",
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
                              gap: "0.3rem",
                              fontSize: "0.75rem",
                              fontWeight: 700,
                              padding: "0.2rem 0.55rem",
                              borderRadius: "6px",
                              background: "rgba(14, 165, 233, 0.12)",
                              color: "#38bdf8",
                              border: "1px solid rgba(14, 165, 233, 0.3)",
                            }}
                          >
                            👤 Fiador Externo (Sin cuenta)
                          </span>
                        )}
                      </td>
                      <td>
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.15rem" }}>
                          <Link
                            to={`/creditos/${f.prestamo_id}`}
                            style={{ fontWeight: 700, color: "var(--accent, #38bdf8)", textDecoration: "none", fontSize: "0.85rem" }}
                          >
                            {f.prestamo_codigo} ({ESTADO_PRESTAMO_LABEL[f.prestamo_estado as EstadoPrestamo] || f.prestamo_estado})
                          </Link>
                          <span style={{ fontSize: "0.78rem", color: "var(--ink-soft)" }}>
                            Socio: <strong>{f.socio_nombre}</strong> ({f.socio_numero})
                          </span>
                          <span className="mono" style={{ fontSize: "0.78rem", color: "var(--ink)" }}>
                            Monto: {formatearQuetzales(f.monto_aprobado ?? f.monto_solicitado)}
                          </span>
                        </div>
                      </td>
                      <td style={{ textAlign: "center" }}>
                        <div style={{ display: "flex", gap: "0.4rem", justifyContent: "center", alignItems: "center", flexWrap: "wrap" }}>
                          {!f.es_socio_activo ? (
                            <Link
                              to={`/socios/nuevo?nombres=${encodeURIComponent(f.nombre_fiador)}&dpi=${encodeURIComponent(f.dpi_fiador || "")}&telefono=${encodeURIComponent(f.telefono_fiador || "")}&direccion=${encodeURIComponent(f.lugar_fiador || "")}`}
                              className="btn"
                              style={{
                                background: "#0284c7",
                                borderColor: "#0284c7",
                                fontSize: "0.75rem",
                                padding: "0.25rem 0.6rem",
                                fontWeight: 700,
                                textDecoration: "none",
                              }}
                              title="Afiliar a este fiador como nuevo socio y abrir su cuenta"
                            >
                              + Afiliar como Socio
                            </Link>
                          ) : (
                            <Link
                              to={`/socios/${f.socio_fiador_id}`}
                              className="btn secondary"
                              style={{
                                fontSize: "0.75rem",
                                padding: "0.25rem 0.55rem",
                                textDecoration: "none",
                              }}
                            >
                              Ver Socio →
                            </Link>
                          )}
                          <Link
                            to={`/creditos/${f.prestamo_id}`}
                            className="link-btn"
                            style={{ fontSize: "0.75rem", padding: "0.2rem 0.4rem", textDecoration: "none" }}
                          >
                            Crédito →
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {cargandoFiadores && (
              <div style={{ padding: "2rem", textAlign: "center", color: "var(--ink-soft)" }}>
                🔍 Cargando directorio de fiadores…
              </div>
            )}

            {!cargandoFiadores && fiadores && fiadores.length === 0 && (
              <div className="empty">No se encontraron fiadores registrados con los filtros aplicados.</div>
            )}
          </div>
        </div>
      )}

      {/* PAGINACIÓN */}
      {totalCreditos > pageSize && (
        <div
          className="pagination"
          style={{ display: "flex", gap: "1rem", alignItems: "center", justifyContent: "center", marginTop: "1rem" }}
        >
          <button className="btn secondary" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            Anterior
          </button>
          <span style={{ fontSize: "0.85rem" }}>
            Mostrando {prestamosPaginados.length} de {totalCreditos} créditos · Página {page} de {totalPaginas}
          </span>
          <button className="btn secondary" disabled={page >= totalPaginas} onClick={() => setPage((p) => p + 1)}>
            Siguiente
          </button>
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
