import { useEffect, useState, useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { api, mensajeError } from "../lib/api";
import { formatoQ, TIPOS_AHORRO } from "../types";
import type { Cuenta, ResumenCuentas } from "../types";
import { DualCuentaBadge } from "../components/DualCuentaBadge";

// ─── Esqueleto de carga para KPIs ─────────────────────────────────────────────
function KpiSkeleton() {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "0.5rem" }}>
      {[...Array(6)].map((_, i) => (
        <div key={i} style={{ height: 72, borderRadius: 8, background: "rgba(148,163,184,0.08)", border: "1px solid var(--line)", animation: "pulse 1.5s ease-in-out infinite" }} />
      ))}
    </div>
  );
}

export default function AhorroList() {
  const { slug } = useParams<{ slug: string }>();
  const config = TIPOS_AHORRO.find((t) => t.slug === slug);

  const [q, setQ] = useState("");
  const [cuentas, setCuentas] = useState<Cuenta[] | null>(null);
  const [resumen, setResumen] = useState<ResumenCuentas | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filtroPeriodo] = useState<"ACTUAL_2026" | "HISTORICO" | "TODOS">("ACTUAL_2026");
  const [filtroAno, setFiltroAno] = useState<string>("");

  const [page, setPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    if (!config) return;
    setCuentas(null);
    setResumen(null);
    setError(null);
    setPage(1);
    const timeout = setTimeout(() => {
      api
        .get<Cuenta[]>("/cuentas", { params: { tipo: config.tipo, q: q || undefined } })
        .then(({ data }) => setCuentas(data))
        .catch((err) => setError(mensajeError(err)));
    }, 250);
    return () => clearTimeout(timeout);
  }, [config, q]);

  useEffect(() => {
    if (!config) return;
    api
      .get<ResumenCuentas>("/cuentas/resumen", { params: { tipo: config.tipo } })
      .then(({ data }) => setResumen(data))
      .catch((err) => setError(mensajeError(err)));
  }, [config]);

  const cuentasActuales = useMemo(() => cuentas?.filter((c) => {
    // Si viene del backend y su fecha de ingreso del socio es >= 2026
    return c.socio_fecha_ingreso ? c.socio_fecha_ingreso >= "2026-01-01" : c.tiene_movimiento_2026;
  }) ?? [], [cuentas]);
  
  const cuentasHistoricas = useMemo(() => cuentas?.filter((c) => {
    return c.socio_fecha_ingreso ? c.socio_fecha_ingreso < "2026-01-01" : !c.tiene_movimiento_2026;
  }) ?? [], [cuentas]);

  const anosDisponibles = useMemo(() => {
    if (!cuentasActuales) return [];
    const setAnos = new Set<string>();
    cuentasActuales.forEach((c) => {
      if (c.ultima_fecha_movimiento) setAnos.add(c.ultima_fecha_movimiento.slice(0, 4));
      if (c.created_at) setAnos.add(c.created_at.slice(0, 4));
    });
    return Array.from(setAnos).filter((a) => a && a.length === 4).sort().reverse();
  }, [cuentasActuales]);

  const cuentasFiltradas = useMemo(() => {
    if (!cuentas) return [];
    let lista = cuentas;
    if (filtroPeriodo === "ACTUAL_2026") lista = cuentasActuales;
    else if (filtroPeriodo === "HISTORICO") lista = cuentasHistoricas;

    if (filtroAno) {
      lista = lista.filter(
        (c) =>
          (c.ultima_fecha_movimiento && c.ultima_fecha_movimiento.startsWith(filtroAno)) ||
          (c.created_at && c.created_at.startsWith(filtroAno))
      );
    }
    return lista;
  }, [cuentas, filtroPeriodo, filtroAno, cuentasActuales, cuentasHistoricas]);

  if (!config) return <div className="alert error">Tipo de ahorro no reconocido.</div>;

  const totalCuentas = cuentasFiltradas.length;
  const cuentasActivas = cuentasFiltradas.filter((c) => c.estado === "ACTIVA").length;
  const saldoTotal =
    filtroPeriodo !== "TODOS"
      ? cuentasFiltradas.reduce((acc, c) => acc + Number(c.saldo_actual), 0)
      : resumen?.saldoTotal ?? cuentasFiltradas.reduce((acc, c) => acc + Number(c.saldo_actual), 0);
  const totalDepositos = resumen?.totalDepositos ?? 0;
  const totalRetiros = resumen?.totalRetiros ?? 0;
  const flujoNeto = totalDepositos - totalRetiros;
  const promedioPorCuenta = cuentasActivas > 0 ? saldoTotal / cuentasActivas : 0;

  const totalPaginas = Math.max(1, Math.ceil(totalCuentas / pageSize));
  const cuentasPaginadas = cuentasFiltradas.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="screen-container">
      {/* CABECERA COMPACTA DE 1 LÍNEA */}
      <div className="screen-header">
        <div style={{ display: "flex", alignItems: "center", gap: "0.65rem", flexWrap: "wrap" }}>
          <h1 style={{ display: "flex", alignItems: "center", gap: "0.4rem", margin: 0, fontSize: "1.2rem" }}>
            <span>🏦</span> {config.titulo}
          </h1>
          <span
            style={{
              fontSize: "0.72rem",
              fontWeight: 700,
              padding: "0.15rem 0.5rem",
              borderRadius: "4px",
              background: "rgba(16, 185, 129, 0.15)",
              color: "#10b981",
              border: "1px solid rgba(16, 185, 129, 0.3)",
            }}
          >
            {config.descripcion}
          </span>
          <span
            style={{
              fontSize: "0.72rem",
              fontWeight: 700,
              padding: "0.15rem 0.5rem",
              borderRadius: "4px",
              background: "rgba(59, 130, 246, 0.12)",
              color: "#3b82f6",
              border: "1px solid rgba(59, 130, 246, 0.25)",
              display: "flex",
              alignItems: "center",
              gap: "0.25rem",
            }}
          >
            <span>📍</span> Agencia Chajul
          </span>
        </div>

        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <button
            type="button"
            className="btn secondary"
            onClick={() => window.print()}
            style={{ padding: "0.3rem 0.65rem", fontSize: "0.8rem", display: "flex", alignItems: "center", gap: "0.3rem" }}
          >
            <span>🖨️</span> Imprimir Padrón
          </button>
          <Link
            to={`/ahorros/${config.slug}/nueva`}
            className="btn"
            style={{ padding: "0.3rem 0.75rem", fontSize: "0.8rem", textDecoration: "none" }}
          >
            + Nueva cuenta
          </Link>
        </div>
      </div>

      {error && (
        <div className="alert error" style={{ margin: "0.25rem 0", padding: "0.4rem 0.75rem", fontSize: "0.82rem" }}>
          {error}
        </div>
      )}

      {/* STRIP DE 6 KPIS HORIZONTALES — FINTECH INSTITUCIONAL */}
      {!resumen && cuentas === null ? <KpiSkeleton /> : (
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "0.5rem" }}>
        {/* SALDO TOTAL */}
        <div
          style={{
            background: "rgba(2, 132, 199, 0.06)",
            border: "1px solid rgba(2, 132, 199, 0.3)",
            borderLeft: "4px solid #0284c7",
            borderRadius: "8px",
            padding: "0.45rem 0.65rem",
            display: "flex",
            flexDirection: "column",
            boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "0.65rem", fontWeight: 700, color: "#0284c7", letterSpacing: "0.03em" }}>
              SALDO TOTAL CAPTADO
            </span>
            <span style={{ fontSize: "0.85rem" }}>🏦</span>
          </div>
          <span style={{ fontSize: "1.15rem", fontWeight: 800, color: "#0284c7", fontFamily: "monospace" }}>
            {formatoQ(saldoTotal)}
          </span>
          <span style={{ fontSize: "0.65rem", color: "var(--ink-soft)" }}>
            {resumen?.totalCuentas ?? totalCuentas} cuentas en total
          </span>
        </div>

        {/* TOTAL DEPÓSITOS */}
        <div
          style={{
            background: "var(--paper)",
            border: "1px solid var(--line)",
            borderLeft: "4px solid #059669",
            borderRadius: "8px",
            padding: "0.45rem 0.65rem",
            display: "flex",
            flexDirection: "column",
            boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "0.65rem", fontWeight: 700, color: "#059669", letterSpacing: "0.03em" }}>
              TOTAL DEPÓSITOS
            </span>
            <span style={{ fontSize: "0.85rem" }}>📥</span>
          </div>
          <span style={{ fontSize: "1.08rem", fontWeight: 700, color: "#059669", fontFamily: "monospace" }}>
            {formatoQ(resumen?.totalDepositos ?? 0)}
          </span>
          <span style={{ fontSize: "0.65rem", color: "var(--ink-soft)" }}>Ingresos (Acumulado a la fecha)</span>
        </div>

        {/* TOTAL RETIROS */}
        <div
          style={{
            background: "var(--paper)",
            border: "1px solid var(--line)",
            borderLeft: "4px solid #f59e0b",
            borderRadius: "8px",
            padding: "0.45rem 0.65rem",
            display: "flex",
            flexDirection: "column",
            boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "0.65rem", fontWeight: 700, color: "#d97706", letterSpacing: "0.03em" }}>
              TOTAL RETIROS
            </span>
            <span style={{ fontSize: "0.85rem" }}>📤</span>
          </div>
          <span style={{ fontSize: "1.08rem", fontWeight: 700, color: "#d97706", fontFamily: "monospace" }}>
            {formatoQ(resumen?.totalRetiros ?? 0)}
          </span>
          <span style={{ fontSize: "0.65rem", color: "var(--ink-soft)" }}>Egresos (Acumulado a la fecha) (incl. {(resumen?.totalCuentas ?? totalCuentas) - cuentasActivas} cuentas canceladas)</span>
        </div>

        {/* CUENTAS ACTIVAS */}
        <div
          style={{
            background: "var(--paper)",
            border: "1px solid var(--line)",
            borderLeft: "4px solid #6366f1",
            borderRadius: "8px",
            padding: "0.45rem 0.65rem",
            display: "flex",
            flexDirection: "column",
            boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "0.65rem", fontWeight: 700, color: "#6366f1", letterSpacing: "0.03em" }}>CUENTAS ACTIVAS</span>
            <span style={{ fontSize: "0.85rem" }}>👥</span>
          </div>
          <span style={{ fontSize: "1.08rem", fontWeight: 700, color: "#6366f1", fontFamily: "monospace" }}>{cuentasActivas}</span>
          <span style={{ fontSize: "0.65rem", color: "var(--ink-soft)" }}>{cuentasActivas} activas / {(resumen?.totalCuentas ?? totalCuentas) - cuentasActivas} inactivas</span>
        </div>

        {/* FLUJO NETO */}
        <div
          style={{
            background: flujoNeto >= 0 ? "rgba(5, 150, 105, 0.06)" : "rgba(239, 68, 68, 0.06)",
            border: "1px solid var(--line)",
            borderLeft: `4px solid ${flujoNeto >= 0 ? "#059669" : "#ef4444"}`,
            borderRadius: "8px",
            padding: "0.45rem 0.65rem",
            display: "flex",
            flexDirection: "column",
            boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "0.65rem", fontWeight: 700, color: flujoNeto >= 0 ? "#059669" : "#ef4444", letterSpacing: "0.03em" }}>FLUJO NETO</span>
            <span style={{ fontSize: "0.85rem" }}>{flujoNeto >= 0 ? "📈" : "📉"}</span>
          </div>
          <span style={{ fontSize: "1.08rem", fontWeight: 700, color: flujoNeto >= 0 ? "#10b981" : "#ef4444", fontFamily: "monospace" }}>
            {flujoNeto >= 0 ? "+" : ""}{formatoQ(flujoNeto)}
          </span>
          <span style={{ fontSize: "0.65rem", color: "var(--ink-soft)" }}>Depósitos menos retiros (Acumulado a la fecha)</span>
        </div>

        {/* PROMEDIO POR CUENTA */}
        <div
          style={{
            background: "var(--paper)",
            border: "1px solid var(--line)",
            borderLeft: "4px solid #BF9903",
            borderRadius: "8px",
            padding: "0.45rem 0.65rem",
            display: "flex",
            flexDirection: "column",
            boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "0.65rem", fontWeight: 700, color: "#BF9903", letterSpacing: "0.03em" }}>PROMEDIO / CUENTA</span>
            <span style={{ fontSize: "0.85rem" }}>📊</span>
          </div>
          <span style={{ fontSize: "1.08rem", fontWeight: 700, color: "#d97706", fontFamily: "monospace" }}>{formatoQ(promedioPorCuenta)}</span>
          <span style={{ fontSize: "0.65rem", color: "var(--ink-soft)" }}>Saldo promedio por socio</span>
        </div>
      </div>
      )}

      <div className="screen-toolbar" style={{ flexWrap: "wrap", gap: "0.5rem" }}>
        {/* PILL TOGGLES REMOVIDOS POR DECISION GERENCIAL (SOLO 2026) */}

        {/* SELECTOR ESPECÍFICO DE AÑO */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
          <span style={{ fontSize: "0.78rem", color: "var(--ink-soft)", fontWeight: 600 }}>📅 Año:</span>
          <select
            value={filtroAno}
            onChange={(e) => {
              setFiltroAno(e.target.value);
              setPage(1);
            }}
            style={{
              padding: "0.32rem 0.55rem",
              borderRadius: "6px",
              border: "1px solid var(--line)",
              background: "var(--paper)",
              color: "var(--ink)",
              fontSize: "0.8rem",
              fontWeight: 600,
            }}
          >
            <option value="">Todos los años</option>
            {anosDisponibles.map((ano) => (
              <option key={ano} value={ano}>
                Año {ano} {ano === "2026" ? "(Actual)" : "(Histórico)"}
              </option>
            ))}
          </select>
        </div>

        <div style={{ position: "relative", flex: 1, maxWidth: 420 }}>
          <span
            style={{
              position: "absolute",
              left: "0.65rem",
              top: "50%",
              transform: "translateY(-50%)",
              fontSize: "0.85rem",
              color: "var(--ink-soft)",
              pointerEvents: "none",
            }}
          >
            🔍
          </span>
          <input
            type="text"
            placeholder="Buscar por socio o número de cuenta..."
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(1);
            }}
            style={{
              width: "100%",
              padding: "0.38rem 0.65rem 0.38rem 2rem",
              fontSize: "0.82rem",
              borderRadius: "6px",
              border: "1px solid var(--line)",
              background: "var(--paper)",
              color: "var(--ink)",
            }}
          />
        </div>
      </div>

      {/* TABLA CON SCROLL INTERNO Y CABECERA PEGAJOSA (SÓLO PANTALLA) */}
      <div className="table-scroll-container no-print">
        <table className="table-compact">
          <thead>
            <tr>
              <th style={{ minWidth: 140 }}>NO. CUENTA</th>
              <th style={{ minWidth: 260 }}>ASOCIADO / TITULAR</th>
              <th style={{ minWidth: 140, textAlign: "right" }}>SALDO ACTUAL</th>
              <th style={{ minWidth: 90, textAlign: "center" }}>ESTADO</th>
              <th style={{ minWidth: 110, textAlign: "right" }}>ACCIONES</th>
            </tr>
          </thead>
          <tbody>
            {cuentasPaginadas.map((c) => (
              <tr key={c.id}>
                <td style={{ verticalAlign: "middle" }}>
                  <Link to={`/ahorros/${config.slug}/${c.id}`} style={{ color: "inherit", textDecoration: "none" }}>
                    <DualCuentaBadge numeroCuenta={c.numero_cuenta} codigoSistema={c.codigo_sistema} />
                  </Link>
                </td>
                <td>
                  <Link
                    to={`/ahorros/${config.slug}/${c.id}`}
                    style={{ color: "inherit", textDecoration: "none", fontWeight: 600 }}
                  >
                    {c.socio_nombres}
                  </Link>
                </td>
                <td className="mono" style={{ fontWeight: 700, color: "var(--accent)", textAlign: "right" }}>
                  {formatoQ(c.saldo_actual)}
                </td>
                <td style={{ textAlign: "center" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.2rem", alignItems: "center" }}>
                    <span className={`badge ${c.estado === "ACTIVA" ? "activo" : "inactivo"}`} style={{ fontSize: "0.72rem", padding: "0.15rem 0.45rem" }}>
                      {c.estado === "ACTIVA" ? "Activa" : "Cerrada"}
                    </span>
                    <span
                      style={{
                        fontSize: "0.64rem",
                        fontWeight: 700,
                        padding: "0.08rem 0.35rem",
                        borderRadius: "4px",
                        background: c.tiene_movimiento_2026 ? "rgba(16, 185, 129, 0.12)" : "rgba(100, 116, 139, 0.12)",
                        color: c.tiene_movimiento_2026 ? "#059669" : "#94a3b8",
                        border: c.tiene_movimiento_2026 ? "1px solid rgba(16, 185, 129, 0.25)" : "1px solid rgba(100, 116, 139, 0.2)",
                      }}
                    >
                      {c.tiene_movimiento_2026 ? "🌱 2026" : "📜 Histórico"}
                    </span>
                  </div>
                </td>
                <td style={{ textAlign: "right" }}>
                  <Link
                    to={`/ahorros/${config.slug}/${c.id}`}
                    className="btn secondary"
                    style={{ padding: "0.18rem 0.5rem", fontSize: "0.74rem", textDecoration: "none" }}
                  >
                    Ver cuenta →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {cuentas && cuentas.length === 0 && (
          <div className="empty" style={{ padding: "2rem", textAlign: "center", color: "var(--ink-soft)" }}>
            {q ? `No hay cuentas que coincidan con "${q}".` : "Todavía no hay cuentas de este tipo."}
          </div>
        )}
      </div>

      {/* FOOTER FIJO CON PAGINACIÓN (SÓLO PANTALLA) */}
      <div className="screen-footer no-print">
        <span style={{ fontSize: "0.8rem", color: "var(--ink-soft)" }}>
          Mostrando {cuentasPaginadas.length} de {totalCuentas} cuentas · Pág. {page} de {totalPaginas}
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
          REPORTE OFICIAL DE IMPRESIÓN COMPLETO (TODAS LAS CUENTAS SIN CORTES)
          ══════════════════════════════════════════════════════════════════════ */}
      <div className="print-only" style={{ width: "100%", margin: "0", padding: "0" }}>
        {/* MEMBRETE INSTITUCIONAL OFICIAL */}
        <div style={{ borderBottom: "2px solid #0f172a", paddingBottom: "6px", marginBottom: "10px", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ fontSize: "11pt", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.5px", color: "#0f172a" }}>
              COOPERATIVA MAYA INVERSIONES FUTURAS R.L. "COMIF-R.L."
            </div>
            <div style={{ fontSize: "9.5pt", fontWeight: 700, color: "#0284c7", marginTop: "2px" }}>
              PADRÓN GENERAL OFICIAL DE CUENTAS — {config.titulo.toUpperCase()}
            </div>
            <div style={{ fontSize: "7.5pt", color: "#475569", marginTop: "2px" }}>
              San Gaspar Chajul, El Quiché, Guatemala · Sistema Contable y Financiero COMIF-R.L.
            </div>
          </div>
          <div style={{ textAlign: "right", fontSize: "7.5pt", color: "#334155" }}>
            <div><strong>Emisión:</strong> {new Date().toLocaleDateString("es-GT", { day: "2-digit", month: "2-digit", year: "numeric" })} {new Date().toLocaleTimeString("es-GT", { hour: "2-digit", minute: "2-digit" })}</div>
            <div><strong>Período Auditado:</strong> {filtroAno ? `Año Fiscal ${filtroAno}` : filtroPeriodo === "ACTUAL_2026" ? "Ejercicio Actual 2026" : filtroPeriodo === "HISTORICO" ? "Histórico Anterior" : "Consolidado Total"}</div>
            <div><strong>Total Cuentas Filtradas:</strong> {totalCuentas} ({cuentasFiltradas.filter(c => c.estado === "ACTIVA").length} activas)</div>
            {q && <div><strong>Filtro búsqueda:</strong> "{q}"</div>}
          </div>
        </div>

        {/* RESUMEN FINANCIERO OFICIAL */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "8px", marginBottom: "10px" }}>
          <div style={{ border: "1px solid #cbd5e1", padding: "4px 8px", background: "#f8fafc", borderRadius: "4px" }}>
            <div style={{ fontSize: "6.5pt", color: "#64748b", fontWeight: 700 }}>SALDO CAPTADO FILTRADO</div>
            <div style={{ fontSize: "10pt", fontWeight: 800, color: "#0284c7", fontFamily: "monospace" }}>{formatoQ(saldoTotal)}</div>
          </div>
          <div style={{ border: "1px solid #cbd5e1", padding: "4px 8px", background: "#f8fafc", borderRadius: "4px" }}>
            <div style={{ fontSize: "6.5pt", color: "#64748b", fontWeight: 700 }}>PADRÓN DE CUENTAS</div>
            <div style={{ fontSize: "10pt", fontWeight: 800, color: "#1e293b", fontFamily: "monospace" }}>{totalCuentas}</div>
          </div>
          <div style={{ border: "1px solid #cbd5e1", padding: "4px 8px", background: "#f8fafc", borderRadius: "4px" }}>
            <div style={{ fontSize: "6.5pt", color: "#64748b", fontWeight: 700 }}>INGRESOS / DEPÓSITOS</div>
            <div style={{ fontSize: "10pt", fontWeight: 800, color: "#059669", fontFamily: "monospace" }}>{formatoQ(resumen?.totalDepositos ?? 0)}</div>
          </div>
          <div style={{ border: "1px solid #cbd5e1", padding: "4px 8px", background: "#f8fafc", borderRadius: "4px" }}>
            <div style={{ fontSize: "6.5pt", color: "#64748b", fontWeight: 700 }}>EGRESOS / RETIROS</div>
            <div style={{ fontSize: "10pt", fontWeight: 800, color: "#d97706", fontFamily: "monospace" }}>{formatoQ(resumen?.totalRetiros ?? 0)}</div>
          </div>
        </div>

        {/* TABLA COMPLETA CON TODAS LAS CUENTAS REGISTRADAS */}
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "7.5pt", marginBottom: "15px" }}>
          <thead>
            <tr style={{ background: "#0f172a", color: "#ffffff" }}>
              <th style={{ width: "3%", textAlign: "center", padding: "4px 2px", color: "#ffffff" }}>#</th>
              <th style={{ width: "18%", textAlign: "left", padding: "4px 4px", color: "#ffffff" }}>NO. DE CUENTA</th>
              <th style={{ width: "45%", textAlign: "left", padding: "4px 4px", color: "#ffffff" }}>ASOCIADO / TITULAR</th>
              <th style={{ width: "20%", textAlign: "right", padding: "4px 4px", color: "#ffffff" }}>SALDO ACTUAL (Q)</th>
              <th style={{ width: "14%", textAlign: "center", padding: "4px 4px", color: "#ffffff" }}>ESTADO / EJERCICIO</th>
            </tr>
          </thead>
          <tbody>
            {cuentasFiltradas.map((c, index) => (
              <tr key={c.id} style={{ background: index % 2 === 0 ? "#ffffff" : "#f8fafc" }}>
                <td style={{ textAlign: "center", border: "1px solid #cbd5e1", padding: "3px 2px" }}>
                  {index + 1}
                </td>
                <td style={{ border: "1px solid #cbd5e1", padding: "3px 4px", fontFamily: "monospace", fontWeight: 700 }}>
                  {c.numero_cuenta}
                </td>
                <td style={{ border: "1px solid #cbd5e1", padding: "3px 4px", fontWeight: 600 }}>
                  {c.socio_nombres}
                </td>
                <td style={{ textAlign: "right", border: "1px solid #cbd5e1", padding: "3px 4px", fontFamily: "monospace", fontWeight: 700, color: "#0284c7" }}>
                  {formatoQ(c.saldo_actual)}
                </td>
                <td style={{ textAlign: "center", border: "1px solid #cbd5e1", padding: "3px 4px", fontWeight: 700, fontSize: "7pt" }}>
                  {c.estado === "ACTIVA" ? "ACTIVA" : "CERRADA"}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr style={{ background: "#e2e8f0", fontWeight: "bold" }}>
              <td colSpan={3} style={{ border: "1px solid #94a3b8", padding: "5px", textAlign: "right", fontWeight: 800 }}>
                TOTAL GENERAL CAPTADO ({totalCuentas} CUENTAS):
              </td>
              <td style={{ border: "1px solid #94a3b8", padding: "5px", textAlign: "right", fontFamily: "monospace", fontWeight: 800, color: "#0284c7", fontSize: "8.5pt" }}>
                {formatoQ(saldoTotal)}
              </td>
              <td style={{ border: "1px solid #94a3b8", padding: "5px", textAlign: "center", color: "#475569", fontSize: "7pt" }}>
                Verificado COMIF-R.L.
              </td>
            </tr>
          </tfoot>
        </table>

        {/* BLOQUE DE FIRMAS OFICIALES DE LEGALIZACIÓN */}
        <div style={{ pageBreakInside: "avoid", breakInside: "avoid", marginTop: "24px", paddingTop: "8px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "25px", textAlign: "center" }}>
            <div>
              <div style={{ borderTop: "1px solid #000", margin: "0 10px", paddingTop: "4px", fontSize: "7.5pt", fontWeight: 700 }}>
                Encargado de Captaciones / Cajero
              </div>
              <div style={{ fontSize: "6.5pt", color: "#475569" }}>Operaciones y Ventanilla</div>
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
