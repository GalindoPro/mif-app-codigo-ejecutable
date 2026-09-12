import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, mensajeError } from "../lib/api";
import { formatoQ } from "../types";
import type { KardexCarteraRespuesta, TipoPrestamo, CobroCampo } from "../types";
import { CobroCampoModal } from "../components/promotor/CobroCampoModal";

export default function KardexCarteraPromotor() {
  const hoyMes = new Date().toISOString().slice(0, 7); // 'YYYY-MM'

  const [mes, setMes] = useState(hoyMes);
  const [tabTipo, setTabTipo] = useState<"TODOS" | TipoPrestamo>("TODOS");
  const [busqueda, setBusqueda] = useState("");
  const [kardex, setKardex] = useState<KardexCarteraRespuesta | null>(null);
  const [cobrosPendientes, setCobrosPendientes] = useState<CobroCampo[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandidoId, setExpandidoId] = useState<string | null>(null);
  
  const [modalCobroPrestamo, setModalCobroPrestamo] = useState<{
    id: string;
    socioId: string;
    socioNombres: string;
    cobroExistente?: CobroCampo;
  } | null>(null);

  const [page, setPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    setPage(1);
    cargarKardex();
    cargarCobrosPendientes();
  }, [mes, tabTipo]);

  async function cargarCobrosPendientes() {
    try {
      const { data } = await api.get<CobroCampo[]>("/cobros-campo/pendientes");
      setCobrosPendientes(data);
    } catch (err) {
      console.error("Error cargando cobros de campo:", err);
    }
  }

  async function cargarKardex() {
    setCargando(true);
    setError(null);
    try {
      const params: Record<string, string> = { mes };
      if (tabTipo !== "TODOS") params.tipo = tabTipo;
      const { data } = await api.get<KardexCarteraRespuesta>("/prestamos/kardex-cartera", { params });
      setKardex(data);
    } catch (err) {
      setError(mensajeError(err));
    } finally {
      setCargando(false);
    }
  }

  const itemsFiltrados = (kardex?.items || []).filter((item) => {
    if (!busqueda.trim()) return true;
    const term = busqueda.toLowerCase();
    return (
      item.codigo.toLowerCase().includes(term) ||
      (item.socio_nombres && item.socio_nombres.toLowerCase().includes(term)) ||
      (item.numero_asociado && item.numero_asociado.toLowerCase().includes(term)) ||
      (item.ubicacion_garantia && item.ubicacion_garantia.toLowerCase().includes(term)) ||
      (item.nombre_fiador && item.nombre_fiador.toLowerCase().includes(term))
    );
  });

  const totalItems = itemsFiltrados.length;
  const totalPaginas = Math.max(1, Math.ceil(totalItems / pageSize));
  const itemsPaginados = itemsFiltrados.slice((page - 1) * pageSize, page * pageSize);

  // Cálculos de sumatorias para el pie de impresión
  const totalMontoOriginal = itemsFiltrados.reduce((acc, p) => acc + Number(p.monto_aprobado || p.monto_solicitado || 0), 0);
  const totalSaldoCapital = itemsFiltrados.reduce((acc, p) => acc + Number(p.saldo_capital ?? p.monto_aprobado ?? p.monto_solicitado ?? 0), 0);
  const totalCobrado = itemsFiltrados.reduce((acc, p) => acc + Number(p.totalPagadoMes || 0), 0);

  const [reseteando, setReseteando] = useState(false);
  const [recargando, setRecargando] = useState(false);
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);

  async function handleReset() {
    const confirmado = window.confirm(
      "⚠️ ¿Estás seguro de que deseas REINICIAR EL SISTEMA DESDE CERO?\n\n" +
      "Esta acción borrará:\n" +
      "• Toda la cartera de préstamos activa\n" +
      "• Todos los socios registrados\n" +
      "• Todas las cuentas de ahorro y aportaciones\n" +
      "• Todos los movimientos de ventanilla\n\n" +
      "El sistema quedará completamente limpio para arrancar de nuevo."
    );
    if (!confirmado) return;

    setReseteando(true);
    setError(null);
    setMensajeExito(null);

    try {
      const { data } = await api.post<{ ok: boolean; mensaje: string }>("/sistema/reset");
      setMensajeExito(data.mensaje);
      cargarKardex();
    } catch (err) {
      setError(mensajeError(err));
    } finally {
      setReseteando(false);
    }
  }

  async function handleRecargarDatos() {
    const confirmado = window.confirm(
      "📥 ¿Deseas RECARGAR TODOS LOS DATOS EXISTENTES de los libros Excel?\n\n" +
      "Esta acción restaurará la base de datos oficial:\n" +
      "• 65 préstamos de cartera viva con garantías y fiadores\n" +
      "• 568 asociados con sus cuentas de aportaciones\n" +
      "• 692 certificados de ahorro a plazo fijo\n\n" +
      "Se cargarán los datos originales de los archivos Excel para continuar operando."
    );
    if (!confirmado) return;

    setRecargando(true);
    setError(null);
    setMensajeExito(null);

    try {
      const { data } = await api.post<{ ok: boolean; mensaje: string }>("/sistema/recargar-datos");
      setMensajeExito(data.mensaje);
      cargarKardex();
    } catch (err) {
      setError(mensajeError(err));
    } finally {
      setRecargando(false);
    }
  }

  function formatearFechaCorta(f: string | null | undefined) {
    if (!f) return "—";
    const fechaLimpia = f.includes("T") ? f.split("T")[0] : f;
    const partes = fechaLimpia.split("-");
    if (partes.length === 3) {
      return `${partes[2]}/${partes[1]}/${partes[0]}`;
    }
    return f;
  }

  return (
    <div className="screen-container">
      {/* ========================================================================= */}
      {/* VISTA EN PANTALLA (INTERACTIVA - NO PRINT)                                */}
      {/* ========================================================================= */}
      <div className="no-print" style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden", gap: "0.5rem" }}>
        {/* Encabezado compacto de 1 línea */}
        <div className="screen-header">
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
            <h1 style={{ display: "flex", alignItems: "center", gap: "0.4rem", margin: 0, fontSize: "1.2rem" }}>
              <span>📂</span> Kardex de Cartera
            </h1>
            <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", background: "var(--paper-raised)", padding: "0.15rem 0.5rem", borderRadius: "6px", border: "1px solid var(--line)" }}>
              <label htmlFor="mes-kardex" style={{ fontSize: "0.75rem", color: "var(--ink-soft)", fontWeight: 700 }}>
                Mes:
              </label>
              <input
                id="mes-kardex"
                type="month"
                value={mes}
                onChange={(e) => setMes(e.target.value)}
                style={{ padding: "0.18rem 0.4rem", borderRadius: "4px", fontSize: "0.8rem", border: "none", background: "transparent", color: "var(--ink)", fontWeight: 600 }}
              />
            </div>
          </div>

          <div style={{ display: "flex", gap: "0.4rem", alignItems: "center", flexWrap: "wrap" }}>
            <button
              type="button"
              className="btn secondary"
              style={{ fontWeight: 700, borderColor: "var(--accent)", fontSize: "0.76rem", padding: "0.28rem 0.6rem" }}
              onClick={() => window.print()}
            >
              🖨️ Imprimir
            </button>
            <Link to="/creditos/nuevo" className="btn" style={{ fontSize: "0.76rem", padding: "0.28rem 0.65rem", fontWeight: 700 }}>
              + Nueva Solicitud
            </Link>
            <button
              type="button"
              className="btn secondary"
              onClick={handleRecargarDatos}
              disabled={recargando || reseteando}
              style={{
                fontSize: "0.74rem",
                padding: "0.26rem 0.55rem",
                borderColor: "rgba(2, 132, 199, 0.4)",
                color: "#38bdf8",
                background: "rgba(2, 132, 199, 0.08)",
              }}
              title="Restaurar base de datos oficial de Excel"
            >
              {recargando ? "⏳..." : "📥 Excel"}
            </button>
            <button
              type="button"
              className="btn danger"
              onClick={handleReset}
              disabled={reseteando || recargando}
              style={{ fontSize: "0.74rem", padding: "0.26rem 0.5rem" }}
              title="Reiniciar el sistema desde cero"
            >
              {reseteando ? "⏳..." : "⚠️ Reset"}
            </button>
          </div>
        </div>

        {mensajeExito && <div className="alert success" style={{ padding: "0.35rem 0.75rem", fontSize: "0.82rem", margin: 0 }}>{mensajeExito}</div>}
        {error && <div className="alert error" style={{ padding: "0.35rem 0.75rem", fontSize: "0.82rem", margin: 0 }}>{error}</div>}

        {/* Tarjetas KPI de Cartera compactas (Franja delgada de 6 mini-cards) */}
        {kardex && (
          <div
            className="screen-kpis"
            style={{ gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "0.4rem" }}
          >
            <div
              className="stat-card accent"
              style={{ padding: "0.35rem 0.65rem", cursor: "pointer" }}
              onClick={() => setTabTipo("TODOS")}
              title="Total Cartera Activa Viva"
            >
              <span className="label" style={{ fontSize: "0.64rem", display: "block" }}>💼 Cartera Viva ({kardex.resumen.totalCreditos})</span>
              <span className="value mono" style={{ fontSize: "0.98rem", whiteSpace: "nowrap" }}>{formatoQ(kardex.resumen.totalCarteraViva)}</span>
            </div>

            <div
              className="stat-card"
              style={{ padding: "0.35rem 0.65rem", cursor: "pointer", border: tabTipo === "HIPOTECARIO" ? "1.5px solid #0ea5e9" : undefined }}
              onClick={() => setTabTipo(tabTipo === "HIPOTECARIO" ? "TODOS" : "HIPOTECARIO")}
              title="Filtrar créditos hipotecarios"
            >
              <span className="label" style={{ fontSize: "0.64rem", display: "block" }}>🏡 Hipotecarios ({kardex.resumen.countHipotecarios})</span>
              <span className="value mono" style={{ fontSize: "0.98rem", whiteSpace: "nowrap" }}>{formatoQ(kardex.resumen.totalColocadoHipotecario)}</span>
            </div>

            <div
              className="stat-card"
              style={{ padding: "0.35rem 0.65rem", cursor: "pointer", border: tabTipo === "FIDUCIARIO" ? "1.5px solid #0ea5e9" : undefined }}
              onClick={() => setTabTipo(tabTipo === "FIDUCIARIO" ? "TODOS" : "FIDUCIARIO")}
              title="Filtrar créditos fiduciarios"
            >
              <span className="label" style={{ fontSize: "0.64rem", display: "block" }}>🤝 Fiduciarios ({kardex.resumen.countFiduciarios})</span>
              <span className="value mono" style={{ fontSize: "0.98rem", whiteSpace: "nowrap" }}>{formatoQ(kardex.resumen.totalColocadoFiduciario)}</span>
            </div>

            <div className="stat-card" style={{ padding: "0.35rem 0.65rem" }}>
              <span className="label" style={{ fontSize: "0.64rem", display: "block" }}>💵 Cobrado en {mes}</span>
              <span className="value mono" style={{ fontSize: "0.98rem", color: "#16a34a", whiteSpace: "nowrap" }}>
                {formatoQ(kardex.resumen.totalCobradoMes)}
              </span>
            </div>

            <div className="stat-card" style={{ padding: "0.35rem 0.65rem" }}>
              <span className="label" style={{ fontSize: "0.64rem", display: "block" }}>🟢 Al Día</span>
              <span className="value mono" style={{ fontSize: "0.98rem", color: "#16a34a" }}>
                {kardex.resumen.sociosAlDia}
              </span>
            </div>

            <div className="stat-card" style={{ padding: "0.35rem 0.65rem" }}>
              <span className="label" style={{ fontSize: "0.64rem", display: "block" }}>🔴 Pendientes</span>
              <span className="value mono" style={{ fontSize: "0.98rem", color: "#dc2626" }}>
                {kardex.resumen.sociosPendientes}
              </span>
            </div>
          </div>
        )}

        {/* Pestañas tipo Excel y Barra de búsqueda en 1 sola línea */}
        <div className="screen-toolbar">
          <div style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap" }}>
            <button
              type="button"
              className={`btn ${tabTipo === "TODOS" ? "primary" : "secondary"}`}
              style={{ fontSize: "0.75rem", padding: "0.22rem 0.6rem" }}
              onClick={() => setTabTipo("TODOS")}
            >
              📋 Todos ({kardex?.resumen.totalCreditos ?? 0})
            </button>
            <button
              type="button"
              className={`btn ${tabTipo === "HIPOTECARIO" ? "primary" : "secondary"}`}
              style={{ fontSize: "0.75rem", padding: "0.22rem 0.6rem" }}
              onClick={() => setTabTipo("HIPOTECARIO")}
            >
              🏡 Hipotecario ({kardex?.resumen.countHipotecarios ?? 0})
            </button>
            <button
              type="button"
              className={`btn ${tabTipo === "FIDUCIARIO" ? "primary" : "secondary"}`}
              style={{ fontSize: "0.75rem", padding: "0.22rem 0.6rem" }}
              onClick={() => setTabTipo("FIDUCIARIO")}
            >
              🤝 Fiduciario ({kardex?.resumen.countFiduciarios ?? 0})
            </button>
          </div>

          <div style={{ flex: 1, minWidth: 220 }}>
            <input
              placeholder="🔍 Buscar por socio, comunidad, fiador o código..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              style={{ width: "100%", padding: "0.3rem 0.65rem", fontSize: "0.8rem", borderRadius: "6px", border: "1px solid var(--line)", background: "var(--paper-raised)", color: "var(--ink)" }}
            />
          </div>
        </div>

        {/* Contenido / Tabla Interactiva con Scroll Interno */}
        {cargando && <div className="card" style={{ padding: "1rem", textAlign: "center" }}>Cargando Kardex de cartera...</div>}

        {!cargando && itemsFiltrados.length === 0 && (
          <div className="alert info" style={{ padding: "0.75rem", fontSize: "0.85rem" }}>No se encontraron créditos registrados con los filtros seleccionados.</div>
        )}

        {!cargando && itemsFiltrados.length > 0 && (
          <div className="table-scroll-container">
            <table className="table-compact" style={{ width: "100%" }}>
              <thead>
                <tr>
                  <th style={{ width: "18%" }}>Código / Socio</th>
                  <th style={{ width: "14%" }}>Comunidad</th>
                  <th style={{ width: "13%" }}>Garantía & Fiador</th>
                  <th style={{ width: "12%" }}>Plazo / Vence</th>
                  <th style={{ width: "10%", textAlign: "right" }}>Valor Crédito</th>
                  <th style={{ width: "11%", textAlign: "right" }}>Saldo Vivo</th>
                  <th style={{ width: "9%", textAlign: "right" }}>Cuota</th>
                  <th style={{ width: "8%", textAlign: "center" }}>Estado</th>
                  <th style={{ width: "5%", textAlign: "center" }}>Acción</th>
                </tr>
              </thead>
              <tbody>
                {itemsPaginados.map((p) => {
                  const esExpandido = expandidoId === p.id;
                  const montoOriginal = Number(p.monto_aprobado || p.monto_solicitado);
                  const saldoActual = Number(p.saldo_capital ?? montoOriginal);

                  return (
                    <tr key={p.id}>
                      {esExpandido ? (
                        <td colSpan={9} style={{ padding: 0 }}>
                          <div style={{ padding: "0.8rem", background: "var(--paper-raised)" }}>
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                marginBottom: "0.5rem",
                              }}
                            >
                              <div>
                                <strong style={{ fontSize: "0.95rem" }}>
                                  {p.codigo} · {p.socio_nombres}
                                </strong>
                                <span
                                  className="badge"
                                  style={{ marginLeft: "0.4rem", background: "#dbeafe", color: "#1e40af", fontSize: "0.72rem" }}
                                >
                                  {p.tipo}
                                </span>
                              </div>
                              <div style={{ display: "flex", gap: "0.4rem" }}>
                                <Link
                                  to={`/creditos/${p.id}`}
                                  className="btn secondary"
                                  style={{ fontSize: "0.72rem", padding: "0.18rem 0.45rem" }}
                                >
                                  Ver Ficha Completa →
                                </Link>
                                <button
                                  type="button"
                                  className="btn secondary"
                                  style={{ fontSize: "0.72rem", padding: "0.18rem 0.45rem" }}
                                  onClick={() => setExpandidoId(null)}
                                >
                                  ✕ Cerrar
                                </button>
                              </div>
                            </div>

                            <div
                              style={{
                                display: "grid",
                                gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                                gap: "0.5rem",
                                fontSize: "0.78rem",
                                marginBottom: "0.75rem",
                              }}
                            >
                              <div>
                                <span style={{ color: "var(--ink-soft)" }}>No. Asociado:</span>{" "}
                                <strong>{p.numero_asociado}</strong>
                              </div>
                              <div>
                                <span style={{ color: "var(--ink-soft)" }}>Comunidad:</span>{" "}
                                <strong>{p.ubicacion_garantia || "Chajul"}</strong>
                              </div>
                              <div>
                                <span style={{ color: "var(--ink-soft)" }}>Fiador solidario:</span>{" "}
                                <strong>{p.nombre_fiador || "—"}</strong>
                              </div>
                              <div>
                                <span style={{ color: "var(--ink-soft)" }}>Tasa mensual:</span>{" "}
                                <strong>{p.tasa_interes_mensual}%</strong>
                              </div>
                              <div>
                                <span style={{ color: "var(--ink-soft)" }}>Plazo acordado:</span>{" "}
                                <strong>{p.plazo_meses} meses</strong>
                              </div>
                              <div>
                                <span style={{ color: "var(--ink-soft)" }}>Vencimiento:</span>{" "}
                                <strong>{formatearFechaCorta(p.fecha_vencimiento)}</strong>
                              </div>
                            </div>

                            <div>
                              <h4 style={{ margin: "0 0 0.35rem", fontSize: "0.85rem" }}>
                                Historial de Pagos y Cobros ({p.pagos.length})
                              </h4>
                              {p.pagos.length === 0 ? (
                                <p style={{ margin: 0, color: "var(--ink-soft)", fontSize: "0.78rem" }}>
                                  No hay pagos registrados en el sistema para este crédito.
                                </p>
                              ) : (
                                <table className="table-compact" style={{ width: "100%", fontSize: "0.75rem" }}>
                                  <thead>
                                    <tr>
                                      <th>Fecha</th>
                                      <th>No. Recibo</th>
                                      <th style={{ textAlign: "right" }}>Capital</th>
                                      <th style={{ textAlign: "right" }}>Interés</th>
                                      <th style={{ textAlign: "right" }}>Mora</th>
                                      <th style={{ textAlign: "right" }}>Total Cuota</th>
                                      <th style={{ textAlign: "right" }}>Saldo Restante</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {p.pagos.map((pg) => (
                                      <tr key={pg.id}>
                                        <td className="mono">{pg.fecha}</td>
                                        <td className="mono">{pg.numero_recibo || "—"}</td>
                                        <td className="mono" style={{ textAlign: "right" }}>
                                          {formatoQ(pg.abono_capital)}
                                        </td>
                                        <td className="mono" style={{ textAlign: "right" }}>
                                          {formatoQ(pg.interes)}
                                        </td>
                                        <td className="mono" style={{ textAlign: "right" }}>
                                          {formatoQ(pg.mora)}
                                        </td>
                                        <td
                                          className="mono"
                                          style={{ textAlign: "right", fontWeight: 700, color: "#16a34a" }}
                                        >
                                          {formatoQ(pg.total_pagado)}
                                        </td>
                                        <td className="mono" style={{ textAlign: "right", fontWeight: 700 }}>
                                          {formatoQ(pg.saldo_capital_restante)}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              )}
                            </div>
                          </div>
                        </td>
                      ) : (
                        <>
                          <td>
                            <strong className="mono" style={{ color: "var(--accent)", fontSize: "0.78rem" }}>
                              {p.codigo}
                            </strong>
                            <div style={{ fontWeight: 600, fontSize: "0.8rem" }}>{p.socio_nombres}</div>
                          </td>
                          <td style={{ fontSize: "0.78rem" }}>
                            {p.ubicacion_garantia || "Chajul"}
                          </td>
                          <td style={{ fontSize: "0.78rem" }}>
                            {p.nombre_fiador || <span style={{ color: "var(--ink-soft)" }}>—</span>}
                          </td>
                          <td>
                            <div className="mono" style={{ fontSize: "0.78rem" }}>{p.plazo_meses}m</div>
                            <span style={{ fontSize: "0.7rem", color: "var(--ink-soft)" }}>
                              Vence: {formatearFechaCorta(p.fecha_vencimiento)}
                            </span>
                          </td>
                          <td className="mono" style={{ textAlign: "right", fontWeight: 600 }}>
                            {formatoQ(montoOriginal)}
                          </td>
                          <td
                            className="mono"
                            style={{
                              textAlign: "right",
                              fontWeight: 700,
                              color: saldoActual > 0 ? "#b45309" : "#15803d",
                            }}
                          >
                            {formatoQ(saldoActual)}
                          </td>
                          <td className="mono" style={{ textAlign: "right" }}>
                            {formatoQ(p.cuota_mensual)}
                          </td>
                          <td style={{ textAlign: "center" }}>
                            {p.estadoCuotaMes === "CANCELADO" ? (
                              <span className="badge inactivo" style={{ fontSize: "0.68rem", padding: "0.12rem 0.35rem" }}>
                                ⚪ Liquidado
                              </span>
                            ) : p.estadoCuotaMes === "AL_DIA" ? (
                              <span className="badge activo" style={{ fontSize: "0.68rem", padding: "0.12rem 0.35rem" }}>
                                🟢 Al día ({formatoQ(p.totalPagadoMes)})
                              </span>
                            ) : (
                              <span className="badge danger" style={{ fontSize: "0.68rem", padding: "0.12rem 0.35rem" }}>
                                🔴 Pendiente
                              </span>
                            )}
                          </td>
                          <td style={{ textAlign: "center", display: "flex", flexDirection: "column", gap: "0.2rem", alignItems: "center" }}>
                            {(() => {
                              const cobroPendiente = cobrosPendientes.find(c => c.prestamo_id === p.id);
                              if (cobroPendiente) {
                                return (
                                  <>
                                    <span className="badge warning" style={{ fontSize: "0.6rem", padding: "0.1rem 0.2rem", background: "var(--accent-light)", color: "var(--accent)" }}>
                                      ⏳ En tránsito
                                    </span>
                                    <button
                                      type="button"
                                      className="btn secondary"
                                      style={{ fontSize: "0.65rem", padding: "0.15rem 0.25rem", whiteSpace: "nowrap" }}
                                      onClick={() => setModalCobroPrestamo({ id: p.id, socioId: p.socio_id, socioNombres: p.socio_nombres || "Socio Desconocido", cobroExistente: cobroPendiente })}
                                    >
                                      ✏️ Editar
                                    </button>
                                  </>
                                );
                              } else if (p.estadoCuotaMes !== "CANCELADO") {
                                return (
                                  <button
                                    type="button"
                                    className="btn primary"
                                    style={{ fontSize: "0.65rem", padding: "0.15rem 0.25rem", whiteSpace: "nowrap" }}
                                    onClick={() => setModalCobroPrestamo({ id: p.id, socioId: p.socio_id, socioNombres: p.socio_nombres || "Socio Desconocido" })}
                                  >
                                    💰 Cobro Campo
                                  </button>
                                );
                              }
                              return null;
                            })()}
                            <button
                              type="button"
                              className="btn secondary"
                              style={{ fontSize: "0.7rem", padding: "0.18rem 0.35rem", whiteSpace: "nowrap", marginTop: "0.2rem" }}
                              onClick={() => setExpandidoId(p.id)}
                            >
                              👁️ Pagos ({p.pagos.length})
                            </button>
                          </td>
                        </>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Paginación integrada en pie de pantalla */}
        {totalItems > pageSize && (
          <div className="screen-footer">
            <span style={{ color: "var(--ink-soft)" }}>
              Mostrando {itemsPaginados.length} de {totalItems} créditos · Pág. {page} de {totalPaginas}
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
      </div>

      {/* ========================================================================= */}
      {/* VISTA OFICIAL DE IMPRESIÓN (HORIZONTAL - LANDSCAPE EJECUTIVO)             */}
      {/* ========================================================================= */}
      <div className="print-only">
        {/* Encabezado Institucional Oficial */}
        <div
          style={{
            borderBottom: "1.5px solid #0f172a",
            paddingBottom: "0.3rem",
            marginBottom: "0.4rem",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
          }}
        >
          <div>
            <div style={{ fontSize: "0.95rem", fontWeight: 800, color: "#000", letterSpacing: "-0.01em" }}>
              COOPERATIVA INTEGRAL DE AHORRO Y CRÉDITO &quot;MAYA INVERSIONES FUTURAS&quot; R.L. (MIF)
            </div>
            <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#0284c7" }}>
              KARDEX GENERAL DE CARTERA DE PRÉSTAMOS — ESTADO AL MES DE {mes}
            </div>
            <div style={{ fontSize: "0.72rem", color: "#475569", marginTop: "1px" }}>
              <strong>Línea:</strong> {tabTipo === "TODOS" ? "Cartera General (Hipotecario y Fiduciario)" : tabTipo} &nbsp;|&nbsp;
              <strong> Total Créditos Listados:</strong> {itemsFiltrados.length} &nbsp;|&nbsp;
              {busqueda && <span><strong>Filtro:</strong> &quot;{busqueda}&quot; &nbsp;|&nbsp;</span>}
              <strong>Fecha y Hora de Emisión:</strong> {new Date().toLocaleDateString("es-GT")} {new Date().toLocaleTimeString("es-GT", { hour: "2-digit", minute: "2-digit" })}
            </div>
          </div>

          <div style={{ textAlign: "right", fontSize: "0.7rem", color: "#475569" }}>
            <div style={{ border: "1px solid #334155", padding: "0.15rem 0.4rem", borderRadius: "4px", fontWeight: 700 }}>
              Reporte Oficial de Promotoría
            </div>
          </div>
        </div>

        {/* Cintillo Ejecutivo de 1 Sola Línea con Cifras Clave */}
        {kardex && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(6, 1fr)",
              gap: "0.35rem",
              marginBottom: "0.5rem",
              background: "#f8fafc",
              padding: "0.35rem 0.5rem",
              borderRadius: "5px",
              border: "1px solid #cbd5e1",
              fontSize: "0.72rem",
            }}
          >
            <div>
              <span style={{ color: "#64748b", display: "block", fontSize: "0.65rem", textTransform: "uppercase" }}>
                Cartera Activa Viva
              </span>
              <strong className="mono" style={{ fontSize: "0.88rem", color: "#0f172a" }}>
                {formatoQ(kardex.resumen.totalCarteraViva)}
              </strong>
            </div>

            <div>
              <span style={{ color: "#64748b", display: "block", fontSize: "0.65rem", textTransform: "uppercase" }}>
                Hipotecarios ({kardex.resumen.countHipotecarios})
              </span>
              <strong className="mono" style={{ fontSize: "0.88rem", color: "#0f172a" }}>
                {formatoQ(kardex.resumen.totalColocadoHipotecario)}
              </strong>
            </div>

            <div>
              <span style={{ color: "#64748b", display: "block", fontSize: "0.65rem", textTransform: "uppercase" }}>
                Fiduciarios ({kardex.resumen.countFiduciarios})
              </span>
              <strong className="mono" style={{ fontSize: "0.88rem", color: "#0f172a" }}>
                {formatoQ(kardex.resumen.totalColocadoFiduciario)}
              </strong>
            </div>

            <div>
              <span style={{ color: "#64748b", display: "block", fontSize: "0.65rem", textTransform: "uppercase" }}>
                Cobrado en {mes}
              </span>
              <strong className="mono" style={{ fontSize: "0.88rem", color: "#16a34a" }}>
                {formatoQ(kardex.resumen.totalCobradoMes)}
              </strong>
            </div>

            <div>
              <span style={{ color: "#64748b", display: "block", fontSize: "0.65rem", textTransform: "uppercase" }}>
                🟢 Socios al Día
              </span>
              <strong className="mono" style={{ fontSize: "0.88rem", color: "#16a34a" }}>
                {kardex.resumen.sociosAlDia}
              </strong>
            </div>

            <div>
              <span style={{ color: "#64748b", display: "block", fontSize: "0.65rem", textTransform: "uppercase" }}>
                🔴 Pendientes
              </span>
              <strong className="mono" style={{ fontSize: "0.88rem", color: "#dc2626" }}>
                {kardex.resumen.sociosPendientes}
              </strong>
            </div>
          </div>
        )}

        {/* Tabla de Créditos Completa (Sin Paginación en Impresión) */}
        <div className="table-wrap" style={{ border: "1px solid #334155" }}>
          <table style={{ fontSize: "7pt", width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f1f5f9" }}>
                <th style={{ width: "20px", textAlign: "center", padding: "2px 3px" }}>#</th>
                <th style={{ width: "70px", padding: "2px 3px" }}>Código</th>
                <th style={{ width: "150px", padding: "2px 3px" }}>Asociado / Titular</th>
                <th style={{ width: "95px", padding: "2px 3px" }}>Comunidad</th>
                <th style={{ width: "125px", padding: "2px 3px" }}>Tipo / Fiador</th>
                <th style={{ width: "65px", padding: "2px 3px" }}>Plazo</th>
                <th style={{ width: "70px", padding: "2px 3px" }}>Vence</th>
                <th style={{ width: "80px", textAlign: "right", padding: "2px 3px" }}>Monto Inicial (Q)</th>
                <th style={{ width: "80px", textAlign: "right", padding: "2px 3px" }}>Saldo Capital (Q)</th>
                <th style={{ width: "75px", textAlign: "right", padding: "2px 3px" }}>Cuota Mes (Q)</th>
                <th style={{ width: "80px", textAlign: "right", padding: "2px 3px" }}>Cobrado Mes (Q)</th>
                <th style={{ width: "70px", textAlign: "center", padding: "2px 3px" }}>Estado</th>
              </tr>
            </thead>
            <tbody>
              {itemsFiltrados.map((p, index) => {
                const montoOriginal = Number(p.monto_aprobado || p.monto_solicitado);
                const saldoActual = Number(p.saldo_capital ?? montoOriginal);

                return (
                  <tr key={p.id}>
                    <td style={{ textAlign: "center", color: "#64748b", padding: "2px 3px" }}>{index + 1}</td>
                    <td className="mono" style={{ fontWeight: 700, padding: "2px 3px" }}>
                      {p.codigo}
                    </td>
                    <td style={{ fontWeight: 600, padding: "2px 3px" }}>
                      {p.socio_nombres}
                      <span style={{ fontSize: "6.5pt", color: "#64748b", display: "block" }}>No. {p.numero_asociado}</span>
                    </td>
                    <td style={{ padding: "2px 3px" }}>{p.ubicacion_garantia || "Chajul"}</td>
                    <td style={{ padding: "2px 3px" }}>
                      <span style={{ fontWeight: 600 }}>{p.tipo}</span>
                      {p.nombre_fiador && (
                        <span style={{ fontSize: "6.5pt", color: "#64748b", display: "block" }}>F: {p.nombre_fiador}</span>
                      )}
                    </td>
                    <td style={{ padding: "2px 3px" }}>{p.plazo_meses} m</td>
                    <td className="mono" style={{ padding: "2px 3px" }}>{p.fecha_vencimiento || "—"}</td>
                    <td className="mono" style={{ textAlign: "right", padding: "2px 3px" }}>
                      {formatoQ(montoOriginal)}
                    </td>
                    <td
                      className="mono"
                      style={{
                        textAlign: "right",
                        fontWeight: 700,
                        color: saldoActual > 0 ? "#000" : "#16a34a",
                        padding: "2px 3px",
                      }}
                    >
                      {formatoQ(saldoActual)}
                    </td>
                    <td className="mono" style={{ textAlign: "right", padding: "2px 3px" }}>
                      {formatoQ(p.cuota_mensual)}
                    </td>
                    <td className="mono" style={{ textAlign: "right", color: "#16a34a", fontWeight: 700, padding: "2px 3px" }}>
                      {p.totalPagadoMes > 0 ? formatoQ(p.totalPagadoMes) : "—"}
                    </td>
                    <td style={{ textAlign: "center", padding: "2px 3px" }}>
                      {p.estadoCuotaMes === "CANCELADO" ? (
                        <span style={{ color: "#64748b", fontWeight: 600 }}>Liquidado</span>
                      ) : p.estadoCuotaMes === "AL_DIA" ? (
                        <span style={{ color: "#16a34a", fontWeight: 700 }}>Al día</span>
                      ) : (
                        <span style={{ color: "#dc2626", fontWeight: 700 }}>Pendiente</span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {itemsFiltrados.length === 0 && (
                <tr>
                  <td colSpan={12} style={{ textAlign: "center", padding: "1rem", color: "#64748b" }}>
                    No se encontraron créditos registrados con los filtros seleccionados.
                  </td>
                </tr>
              )}
            </tbody>
            {itemsFiltrados.length > 0 && (
              <tfoot>
                <tr style={{ background: "#f1f5f9", fontWeight: 800, borderTop: "2px solid #000" }}>
                  <td colSpan={7} style={{ textAlign: "right", padding: "3px 4px" }}>
                    TOTALES CARTERA LISTADA ({itemsFiltrados.length} créditos):
                  </td>
                  <td className="mono" style={{ textAlign: "right", padding: "3px 4px" }}>
                    {formatoQ(totalMontoOriginal)}
                  </td>
                  <td className="mono" style={{ textAlign: "right", padding: "3px 4px" }}>
                    {formatoQ(totalSaldoCapital)}
                  </td>
                  <td style={{ padding: "3px 4px" }}>—</td>
                  <td className="mono" style={{ textAlign: "right", color: "#16a34a", padding: "3px 4px" }}>
                    {formatoQ(totalCobrado)}
                  </td>
                  <td style={{ padding: "3px 4px" }}>—</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>

        {/* Bloque de Firmas Oficiales */}
        <div
          style={{
            marginTop: "1.2rem",
            paddingTop: "0.6rem",
            borderTop: "1px dashed #94a3b8",
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "2rem",
            textAlign: "center",
            pageBreakInside: "avoid",
          }}
        >
          <div>
            <div style={{ borderBottom: "1px solid #000", height: "28px", marginBottom: "0.2rem" }} />
            <div style={{ fontWeight: 700, fontSize: "0.75rem" }}>Elaborado por</div>
            <div style={{ fontSize: "0.68rem", color: "#64748b" }}>Oficial de Cartera / Promotor</div>
          </div>

          <div>
            <div style={{ borderBottom: "1px solid #000", height: "28px", marginBottom: "0.2rem" }} />
            <div style={{ fontWeight: 700, fontSize: "0.75rem" }}>Revisado por</div>
            <div style={{ fontSize: "0.68rem", color: "#64748b" }}>Jefe de Agencia / Supervisor</div>
          </div>

          <div>
            <div style={{ borderBottom: "1px solid #000", height: "28px", marginBottom: "0.2rem" }} />
            <div style={{ fontWeight: 700, fontSize: "0.75rem" }}>Aprobado por</div>
            <div style={{ fontSize: "0.68rem", color: "#64748b" }}>Gerencia General / Consejo</div>
          </div>
        </div>
      </div>

      {modalCobroPrestamo && (
        <CobroCampoModal
          prestamoId={modalCobroPrestamo.id}
          socioId={modalCobroPrestamo.socioId}
          socioNombres={modalCobroPrestamo.socioNombres}
          cobroExistente={modalCobroPrestamo.cobroExistente}
          onClose={() => setModalCobroPrestamo(null)}
          onSuccess={() => {
            setModalCobroPrestamo(null);
            cargarCobrosPendientes();
          }}
        />
      )}
    </div>
  );
}
