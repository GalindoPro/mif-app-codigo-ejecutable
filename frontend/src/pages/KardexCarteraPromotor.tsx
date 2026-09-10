import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, mensajeError } from "../lib/api";
import { formatearQuetzales, formatearFechaLocal } from "../lib/formatters";
import type { KardexCarteraRespuesta, TipoPrestamo } from "../types";

export default function KardexCarteraPromotor() {
  const hoyMes = new Date().toISOString().slice(0, 7); // 'YYYY-MM'

  const [mes, setMes] = useState(hoyMes);
  const [tabTipo, setTabTipo] = useState<"TODOS" | TipoPrestamo>("TODOS");
  const [busqueda, setBusqueda] = useState("");
  const [kardex, setKardex] = useState<KardexCarteraRespuesta | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandidoId, setExpandidoId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    setPage(1);
    cargarKardex();
  }, [mes, tabTipo]);

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

  return (
    <div>
      {/* ========================================================================= */}
      {/* VISTA EN PANTALLA (INTERACTIVA - NO PRINT)                                */}
      {/* ========================================================================= */}
      <div className="no-print">
        {/* Encabezado */}
        <div className="page-head">
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span style={{ fontSize: "1.5rem" }}>📂</span>
              <h1>Kardex de Cartera de Préstamos</h1>
            </div>
            <p>
              Control de cartera de créditos en vivo. Los cobros de cuotas en ventanilla se reflejan aquí al instante sin
              necesidad de transcribir en Excel.
            </p>
          </div>
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <label htmlFor="mes-kardex" style={{ fontSize: "0.85rem", color: "var(--ink-soft)", fontWeight: 600 }}>
                Mes:
              </label>
              <input
                id="mes-kardex"
                type="month"
                value={mes}
                onChange={(e) => setMes(e.target.value)}
                style={{ padding: "0.4rem 0.6rem", borderRadius: "6px", fontSize: "0.88rem" }}
              />
            </div>
            <button
              type="button"
              className="btn secondary"
              style={{ fontWeight: 700, borderColor: "var(--accent)" }}
              onClick={() => window.print()}
            >
              🖨️ Imprimir Kardex (Horizontal)
            </button>
            <Link to="/creditos/nuevo" className="btn">
              + Nueva Solicitud en Campo
            </Link>
            <button
              type="button"
              className="btn secondary"
              onClick={handleRecargarDatos}
              disabled={recargando || reseteando}
              style={{
                fontSize: "0.82rem",
                padding: "0.35rem 0.75rem",
                display: "inline-flex",
                alignItems: "center",
                gap: "0.35rem",
                borderColor: "rgba(2, 132, 199, 0.5)",
                color: "#38bdf8",
                background: "rgba(2, 132, 199, 0.1)",
              }}
              title="Restaurar los 65 préstamos y socios desde los archivos Excel"
            >
              {recargando ? "⏳ Recargando..." : "📥 Recargar Datos (Excel)"}
            </button>
            <button
              type="button"
              className="btn danger"
              onClick={handleReset}
              disabled={reseteando || recargando}
              style={{ fontSize: "0.82rem", padding: "0.35rem 0.75rem", display: "inline-flex", alignItems: "center", gap: "0.35rem" }}
              title="Borrar todos los datos y reiniciar el sistema limpio desde cero"
            >
              {reseteando ? "⏳ Reiniciando..." : "⚠️ Reiniciar a Cero"}
            </button>
          </div>
        </div>

        {mensajeExito && <div className="alert success" style={{ marginBottom: "1rem" }}>{mensajeExito}</div>}
        {error && <div className="alert error">{error}</div>}

        {/* Tarjetas KPI de Cartera */}
        {kardex && (
          <div
            className="stat-grid"
            style={{ gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", marginBottom: "1.5rem" }}
          >
            <div className="stat-card accent">
              <span className="label">💼 Cartera Activa Viva</span>
              <span className="value">{formatearQuetzales(kardex.resumen.totalCarteraViva)}</span>
              <span className="hint">{kardex.resumen.totalCreditos} préstamos registrados</span>
            </div>
            <div className="stat-card">
              <span className="label">🏡 Hipotecarios</span>
              <span className="value">{formatearQuetzales(kardex.resumen.totalColocadoHipotecario)}</span>
              <span className="hint">{kardex.resumen.countHipotecarios} créditos colocados</span>
            </div>
            <div className="stat-card">
              <span className="label">🤝 Fiduciarios</span>
              <span className="value">{formatearQuetzales(kardex.resumen.totalColocadoFiduciario)}</span>
              <span className="hint">{kardex.resumen.countFiduciarios} créditos colocados</span>
            </div>
            <div className="stat-card">
              <span className="label">💵 Cobrado en {mes}</span>
              <span className="value" style={{ color: "#16a34a" }}>
                {formatearQuetzales(kardex.resumen.totalCobradoMes)}
              </span>
              <span className="hint">Ingresos recibidos en caja</span>
            </div>
            <div className="stat-card">
              <span className="label">🟢 Socios al Día</span>
              <span className="value" style={{ color: "#16a34a" }}>
                {kardex.resumen.sociosAlDia}
              </span>
              <span className="hint">Cuota del mes pagada</span>
            </div>
            <div className="stat-card">
              <span className="label">🔴 Pendientes de Pago</span>
              <span className="value" style={{ color: "#dc2626" }}>
                {kardex.resumen.sociosPendientes}
              </span>
              <span className="hint">Requieren visita o recordatorio</span>
            </div>
          </div>
        )}

        {/* Pestañas tipo Excel y Barra de búsqueda */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "1rem",
            flexWrap: "wrap",
            gap: "1rem",
          }}
        >
          <div style={{ display: "flex", gap: "0.4rem" }}>
            <button
              type="button"
              className={`btn ${tabTipo === "TODOS" ? "" : "secondary"}`}
              style={{ fontSize: "0.85rem", padding: "0.4rem 0.8rem" }}
              onClick={() => setTabTipo("TODOS")}
            >
              📋 Todos ({kardex?.resumen.totalCreditos ?? 0})
            </button>
            <button
              type="button"
              className={`btn ${tabTipo === "HIPOTECARIO" ? "" : "secondary"}`}
              style={{ fontSize: "0.85rem", padding: "0.4rem 0.8rem" }}
              onClick={() => setTabTipo("HIPOTECARIO")}
            >
              🏡 Hipotecario ({kardex?.resumen.countHipotecarios ?? 0})
            </button>
            <button
              type="button"
              className={`btn ${tabTipo === "FIDUCIARIO" ? "" : "secondary"}`}
              style={{ fontSize: "0.85rem", padding: "0.4rem 0.8rem" }}
              onClick={() => setTabTipo("FIDUCIARIO")}
            >
              🤝 Fiduciario ({kardex?.resumen.countFiduciarios ?? 0})
            </button>
          </div>

          <div style={{ minWidth: 260 }}>
            <input
              placeholder="🔍 Buscar por socio, comunidad, fiador o código..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              style={{ width: "100%", padding: "0.45rem 0.75rem", fontSize: "0.88rem" }}
            />
          </div>
        </div>

        {/* Contenido / Tabla Interactiva */}
        {cargando && <div className="card">Cargando Kardex de cartera...</div>}

        {!cargando && itemsFiltrados.length === 0 && (
          <div className="alert info">No se encontraron créditos registrados con los filtros seleccionados.</div>
        )}

        {!cargando && itemsFiltrados.length > 0 && (
          <div className="card" style={{ padding: 0, overflowX: "auto" }}>
            <table className="table" style={{ width: "100%", margin: 0, fontSize: "0.85rem" }}>
              <thead>
                <tr style={{ background: "var(--mono-bg)" }}>
                  <th style={{ width: "16%" }}>Código / Socio</th>
                  <th style={{ width: "13%" }}>Comunidad / Ubicación</th>
                  <th style={{ width: "14%" }}>Garantía & Fiador</th>
                  <th style={{ width: "10%" }}>Plazo / Vence</th>
                  <th style={{ width: "11%", textAlign: "right" }}>Valor Crédito</th>
                  <th style={{ width: "11%", textAlign: "right" }}>Saldo Vivo Capital</th>
                  <th style={{ width: "10%", textAlign: "right" }}>Cuota Mensual</th>
                  <th style={{ width: "8%", textAlign: "center" }}>Estado {mes}</th>
                  <th style={{ width: "7%", textAlign: "center" }}>Acción</th>
                </tr>
              </thead>
              <tbody>
                {itemsPaginados.map((p) => {
                  const esExpandido = expandidoId === p.id;
                  const montoOriginal = Number(p.monto_aprobado || p.monto_solicitado);
                  const saldoActual = Number(p.saldo_capital ?? montoOriginal);

                  return (
                    <tr key={p.id} style={{ verticalAlign: "middle" }}>
                      {esExpandido ? (
                        <td colSpan={9} style={{ padding: 0 }}>
                          <div style={{ padding: "1rem", background: "var(--paper-raised)" }}>
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                marginBottom: "0.75rem",
                              }}
                            >
                              <div>
                                <strong style={{ fontSize: "1.05rem" }}>
                                  {p.codigo} · {p.socio_nombres}
                                </strong>
                                <span
                                  className="badge"
                                  style={{ marginLeft: "0.5rem", background: "#dbeafe", color: "#1e40af" }}
                                >
                                  {p.tipo}
                                </span>
                              </div>
                              <div style={{ display: "flex", gap: "0.5rem" }}>
                                <Link
                                  to={`/creditos/${p.id}`}
                                  className="btn secondary"
                                  style={{ fontSize: "0.78rem", padding: "0.25rem 0.55rem" }}
                                >
                                  Ver Ficha Completa →
                                </Link>
                                <button
                                  type="button"
                                  className="btn secondary"
                                  style={{ fontSize: "0.78rem", padding: "0.25rem 0.55rem" }}
                                  onClick={() => setExpandidoId(null)}
                                >
                                  ✕ Cerrar
                                </button>
                              </div>
                            </div>

                            <div
                              style={{
                                display: "grid",
                                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                                gap: "0.75rem",
                                fontSize: "0.85rem",
                                marginBottom: "1rem",
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
                                <strong>{formatearFechaLocal(p.fecha_vencimiento)}</strong>
                              </div>
                            </div>

                            <div style={{ marginTop: "0.5rem" }}>
                              <h4 style={{ margin: "0 0 0.5rem", fontSize: "0.95rem" }}>
                                Historial de Pagos y Cobros ({p.pagos.length})
                              </h4>
                              {p.pagos.length === 0 ? (
                                <p style={{ margin: 0, color: "var(--ink-soft)", fontSize: "0.85rem" }}>
                                  No hay pagos registrados en el sistema para este crédito.
                                </p>
                              ) : (
                                <table className="table" style={{ width: "100%", fontSize: "0.8rem" }}>
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
                                          {formatearQuetzales(pg.abono_capital)}
                                        </td>
                                        <td className="mono" style={{ textAlign: "right" }}>
                                          {formatearQuetzales(pg.interes)}
                                        </td>
                                        <td className="mono" style={{ textAlign: "right" }}>
                                          {formatearQuetzales(pg.mora)}
                                        </td>
                                        <td
                                          className="mono"
                                          style={{ textAlign: "right", fontWeight: 700, color: "#16a34a" }}
                                        >
                                          {formatearQuetzales(pg.total_pagado)}
                                        </td>
                                        <td className="mono" style={{ textAlign: "right", fontWeight: 700 }}>
                                          {formatearQuetzales(pg.saldo_capital_restante)}
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
                            <strong className="mono" style={{ color: "var(--accent)" }}>
                              {p.codigo}
                            </strong>
                            <div style={{ fontWeight: 600, fontSize: "0.82rem" }}>{p.socio_nombres}</div>
                          </td>
                          <td>
                            <div>{p.ubicacion_garantia || "Chajul"}</div>
                            <span style={{ fontSize: "0.75rem", color: "var(--ink-soft)" }}>Comunidad</span>
                          </td>
                          <td>
                            <div>{p.nombre_fiador || "—"}</div>
                            <span style={{ fontSize: "0.75rem", color: "var(--ink-soft)" }}>Fiador solidario</span>
                          </td>
                          <td>
                            <div>{p.plazo_meses} meses</div>
                            <span style={{ fontSize: "0.75rem", color: "var(--ink-soft)" }}>
                              Vence: {formatearFechaLocal(p.fecha_vencimiento)}
                            </span>
                          </td>
                          <td className="mono" style={{ textAlign: "right", fontWeight: 600 }}>
                            {formatearQuetzales(montoOriginal)}
                          </td>
                          <td
                            className="mono"
                            style={{
                              textAlign: "right",
                              fontWeight: 700,
                              color: saldoActual > 0 ? "#b45309" : "#15803d",
                            }}
                          >
                            {formatearQuetzales(saldoActual)}
                          </td>
                          <td className="mono" style={{ textAlign: "right" }}>
                            {formatearQuetzales(p.cuota_mensual)}
                          </td>
                          <td>
                            {p.estadoCuotaMes === "CANCELADO" ? (
                              <span className="badge inactivo">
                                ⚪ Liquidado
                              </span>
                            ) : p.estadoCuotaMes === "AL_DIA" ? (
                              <span className="badge activo">
                                🟢 Al día ({formatearQuetzales(p.totalPagadoMes)})
                              </span>
                            ) : (
                              <span className="badge danger">
                                🔴 Pendiente
                              </span>
                            )}
                          </td>
                          <td style={{ textAlign: "center" }}>
                            <button
                              type="button"
                              className="btn secondary"
                              style={{ fontSize: "0.75rem", padding: "0.25rem 0.5rem" }}
                              onClick={() => setExpandidoId(p.id)}
                            >
                              👁️ Ver pagos ({p.pagos.length})
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

        {totalItems > pageSize && (
          <div
            className="pagination"
            style={{ display: "flex", gap: "1rem", alignItems: "center", justifyContent: "center", marginTop: "1rem" }}
          >
            <button className="btn secondary" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              Anterior
            </button>
            <span>
              Mostrando {itemsPaginados.length} de {totalItems} créditos · Página {page} de {totalPaginas}
            </span>
            <button className="btn secondary" disabled={page >= totalPaginas} onClick={() => setPage((p) => p + 1)}>
              Siguiente
            </button>
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
                {formatearQuetzales(kardex.resumen.totalCarteraViva)}
              </strong>
            </div>

            <div>
              <span style={{ color: "#64748b", display: "block", fontSize: "0.65rem", textTransform: "uppercase" }}>
                Hipotecarios ({kardex.resumen.countHipotecarios})
              </span>
              <strong className="mono" style={{ fontSize: "0.88rem", color: "#0f172a" }}>
                {formatearQuetzales(kardex.resumen.totalColocadoHipotecario)}
              </strong>
            </div>

            <div>
              <span style={{ color: "#64748b", display: "block", fontSize: "0.65rem", textTransform: "uppercase" }}>
                Fiduciarios ({kardex.resumen.countFiduciarios})
              </span>
              <strong className="mono" style={{ fontSize: "0.88rem", color: "#0f172a" }}>
                {formatearQuetzales(kardex.resumen.totalColocadoFiduciario)}
              </strong>
            </div>

            <div>
              <span style={{ color: "#64748b", display: "block", fontSize: "0.65rem", textTransform: "uppercase" }}>
                Cobrado en {mes}
              </span>
              <strong className="mono" style={{ fontSize: "0.88rem", color: "#16a34a" }}>
                {formatearQuetzales(kardex.resumen.totalCobradoMes)}
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
                    <td className="mono" style={{ padding: "2px 3px" }}>{formatearFechaLocal(p.fecha_vencimiento)}</td>
                    <td className="mono" style={{ textAlign: "right", padding: "2px 3px" }}>
                      {formatearQuetzales(montoOriginal)}
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
                      {formatearQuetzales(saldoActual)}
                    </td>
                    <td className="mono" style={{ textAlign: "right", padding: "2px 3px" }}>
                      {formatearQuetzales(p.cuota_mensual)}
                    </td>
                    <td className="mono" style={{ textAlign: "right", color: "#16a34a", fontWeight: 700, padding: "2px 3px" }}>
                      {p.totalPagadoMes > 0 ? formatearQuetzales(p.totalPagadoMes) : "—"}
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
                    {formatearQuetzales(totalMontoOriginal)}
                  </td>
                  <td className="mono" style={{ textAlign: "right", padding: "3px 4px" }}>
                    {formatearQuetzales(totalSaldoCapital)}
                  </td>
                  <td style={{ padding: "3px 4px" }}>—</td>
                  <td className="mono" style={{ textAlign: "right", color: "#16a34a", padding: "3px 4px" }}>
                    {formatearQuetzales(totalCobrado)}
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
    </div>
  );
}
