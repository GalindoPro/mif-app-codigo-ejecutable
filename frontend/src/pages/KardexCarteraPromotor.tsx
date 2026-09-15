import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, mensajeError } from "../lib/api";
import { formatoQ } from "../types";
import type { KardexCarteraRespuesta, TipoPrestamo } from "../types";
import { useAuth } from "../hooks/useAuth";

export default function KardexCarteraPromotor() {
  const hoyMes = new Date().toISOString().slice(0, 7); // 'YYYY-MM'
  const { usuario } = useAuth();

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
          <button type="button" className="btn secondary" onClick={() => window.print()}>
            🖨️ Imprimir Kardex
          </button>
          <Link to="/creditos/nuevo" className="btn">
            + Nueva Solicitud en Campo
          </Link>
          {usuario?.rol === "ADMIN" && (
            <>
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
            </>
          )}
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
            <span className="value">{formatoQ(kardex.resumen.totalCarteraViva)}</span>
            <span className="hint">{kardex.resumen.totalCreditos} préstamos registrados</span>
          </div>
          <div className="stat-card">
            <span className="label">🏡 Hipotecarios</span>
            <span className="value">{formatoQ(kardex.resumen.totalColocadoHipotecario)}</span>
            <span className="hint">{kardex.resumen.countHipotecarios} créditos colocados</span>
          </div>
          <div className="stat-card">
            <span className="label">🤝 Fiduciarios</span>
            <span className="value">{formatoQ(kardex.resumen.totalColocadoFiduciario)}</span>
            <span className="hint">{kardex.resumen.countFiduciarios} créditos colocados</span>
          </div>
          <div className="stat-card">
            <span className="label">💵 Cobrado en {mes}</span>
            <span className="value" style={{ color: "#16a34a" }}>
              {formatoQ(kardex.resumen.totalCobradoMes)}
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

      {/* Contenido / Tabla */}
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
                          {/* Fila principal en modo expandido */}
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

                          {/* Ficha rápida de colocación */}
                          <div
                            style={{
                              display: "grid",
                              gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
                              gap: "0.75rem",
                              marginBottom: "1rem",
                              fontSize: "0.82rem",
                              background: "var(--paper-raised)",
                              padding: "0.75rem",
                              borderRadius: "6px",
                              border: "1px solid var(--line)",
                            }}
                          >
                            <div>
                              <span style={{ color: "var(--ink-soft)" }}>Comunidad:</span>{" "}
                              <strong>{p.ubicacion_garantia || "Chajul"}</strong>
                            </div>
                            <div>
                              <span style={{ color: "var(--ink-soft)" }}>Fiador:</span>{" "}
                              <strong>{p.nombre_fiador || p.garantia || "Sin fiador"}</strong>
                            </div>
                            <div>
                              <span style={{ color: "var(--ink-soft)" }}>Desembolso:</span>{" "}
                              <strong>{p.fecha_desembolso ? p.fecha_desembolso.slice(0, 10) : "Pendiente"}</strong>
                            </div>
                            <div>
                              <span style={{ color: "var(--ink-soft)" }}>Vencimiento:</span>{" "}
                              <strong>{p.fecha_vencimiento ? p.fecha_vencimiento.slice(0, 10) : "Calculado"}</strong>
                            </div>
                            <div>
                              <span style={{ color: "var(--ink-soft)" }}>Monto inicial:</span>{" "}
                              <strong>{formatoQ(montoOriginal)}</strong>
                            </div>
                            <div>
                              <span style={{ color: "var(--ink-soft)" }}>Saldo vivo:</span>{" "}
                              <strong style={{ color: saldoActual > 0 ? "#b45309" : "#15803d" }}>
                                {formatoQ(saldoActual)}
                              </strong>
                            </div>
                          </div>

                          {/* Historial de pagos del crédito */}
                          <h4 style={{ margin: "0 0 0.5rem", fontSize: "0.88rem" }}>
                            📋 Historial de Cuotas Cobradas en Ventanilla
                          </h4>
                          {p.pagos.length === 0 ? (
                            <div style={{ fontSize: "0.82rem", color: "var(--ink-soft)" }}>
                              No hay pagos registrados aún para este préstamo.
                            </div>
                          ) : (
                            <div style={{ overflowX: "auto" }}>
                              <table style={{ width: "100%", fontSize: "0.78rem", background: "var(--paper-raised)" }}>
                                <thead>
                                  <tr style={{ background: "var(--mono-bg)" }}>
                                    <th>Fecha</th>
                                    <th>Recibo</th>
                                    <th style={{ textAlign: "right" }}>Abono Capital</th>
                                    <th style={{ textAlign: "right" }}>Interés</th>
                                    <th style={{ textAlign: "right" }}>Mora</th>
                                    <th style={{ textAlign: "right" }}>Total Pagado</th>
                                    <th style={{ textAlign: "right" }}>Saldo Restante</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {p.pagos.map((pago) => (
                                    <tr key={pago.id}>
                                      <td>{pago.fecha ? pago.fecha.slice(0, 10) : "—"}</td>
                                      <td className="mono">{pago.numero_recibo || "—"}</td>
                                      <td className="mono" style={{ textAlign: "right", color: "#15803d" }}>
                                        {formatoQ(pago.abono_capital)}
                                      </td>
                                      <td className="mono" style={{ textAlign: "right" }}>
                                        {formatoQ(pago.interes)}
                                      </td>
                                      <td className="mono" style={{ textAlign: "right", color: "#b91c1c" }}>
                                        {formatoQ(pago.mora)}
                                      </td>
                                      <td className="mono" style={{ textAlign: "right", fontWeight: 700 }}>
                                        {formatoQ(pago.total_pagado)}
                                      </td>
                                      <td className="mono" style={{ textAlign: "right", fontWeight: 700 }}>
                                        {formatoQ(pago.saldo_capital_restante)}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      </td>
                    ) : (
                      <>
                          <td style={{ fontWeight: 600 }}>
                            <div className="mono" style={{ color: "var(--accent)" }}>
                              {p.codigo}
                            </div>
                            <div style={{ fontSize: "0.82rem" }}>{p.socio_nombres}</div>
                          </td>
                          <td>
                            <strong>{p.ubicacion_garantia || "Chajul"}</strong>
                            <div style={{ fontSize: "0.72rem", color: "var(--ink-soft)" }}>
                              {p.tipo === "HIPOTECARIO" ? "Inmueble / Terreno" : "Comunidad"}
                            </div>
                          </td>
                          <td>
                            <div>{p.nombre_fiador || p.garantia || "—"}</div>
                            <div style={{ fontSize: "0.72rem", color: "var(--ink-soft)" }}>
                              {p.tipo === "FIDUCIARIO" ? "Fiador solidario" : "Garantía hipotecaria"}
                            </div>
                          </td>
                          <td>
                            <div>{p.plazo_meses} meses</div>
                            <div style={{ fontSize: "0.72rem", color: "var(--ink-soft)" }}>
                              Vence: {p.fecha_vencimiento ? p.fecha_vencimiento.slice(0, 10) : "—"}
                            </div>
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
                          <td>
                            {p.estadoCuotaMes === "CANCELADO" ? (
                              <span className="badge inactivo">
                                ⚪ Liquidado
                              </span>
                            ) : p.estadoCuotaMes === "AL_DIA" ? (
                              <span className="badge activo">
                                🟢 Al día ({formatoQ(p.totalPagadoMes)})
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
  );
}
