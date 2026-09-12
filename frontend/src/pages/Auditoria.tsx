import { useEffect, useState } from "react";
import { api, mensajeError } from "../lib/api";

interface RegistroAuditoria {
  id: string;
  entidad: string;
  entidad_id: string;
  accion: "CREAR" | "ACTUALIZAR" | "ELIMINAR";
  datos_anteriores: Record<string, unknown> | null;
  datos_nuevos: Record<string, unknown> | null;
  fecha: string;
  motivo?: string;
  usuario_nombre: string;
  usuario_rol: string;
}

interface Pagina {
  data: RegistroAuditoria[];
  total: number;
  page: number;
  pageSize: number;
}

const ACCION_COLOR: Record<string, { bg: string; color: string; label: string }> = {
  CREAR:     { bg: "rgba(22,163,74,0.15)",  color: "#16a34a", label: "Creación"     },
  ACTUALIZAR:{ bg: "rgba(180,83,9,0.15)",   color: "#d97706", label: "Modificación" },
  ELIMINAR:  { bg: "rgba(220,38,38,0.15)",  color: "#ef4444", label: "Eliminación"  },
};

const pageSize = 25;

export default function Auditoria() {
  const [pagina, setPagina]           = useState<Pagina | null>(null);
  const [entidades, setEntidades]     = useState<string[]>([]);
  const [error, setError]             = useState<string | null>(null);
  const [cargando, setCargando]       = useState(false);
  const [page, setPage]               = useState(1);
  const [q, setQ]                     = useState("");
  const [entidadFiltro, setEntidadFiltro] = useState("");
  const [accionFiltro, setAccionFiltro]   = useState("");
  const [desde, setDesde]             = useState("");
  const [hasta, setHasta]             = useState("");
  const [detalle, setDetalle]         = useState<RegistroAuditoria | null>(null);

  useEffect(() => {
    api.get<string[]>("/auditoria/entidades")
      .then(({ data }) => setEntidades(data))
      .catch(() => {});
  }, []);

  useEffect(() => { setPage(1); }, [q, entidadFiltro, accionFiltro, desde, hasta]);

  useEffect(() => {
    setCargando(true);
    setError(null);
    api
      .get<Pagina>("/auditoria", {
        params: {
          page, pageSize,
          q: q || undefined,
          entidad: entidadFiltro || undefined,
          accion:  accionFiltro  || undefined,
          desde:   desde         || undefined,
          hasta:   hasta         || undefined,
        },
      })
      .then(({ data }) => setPagina(data))
      .catch((err) => setError(mensajeError(err)))
      .finally(() => setCargando(false));
  }, [page, q, entidadFiltro, accionFiltro, desde, hasta]);

  const totalPaginas = pagina ? Math.max(1, Math.ceil(pagina.total / pageSize)) : 1;
  const hayFiltros   = !!(q || entidadFiltro || accionFiltro || desde || hasta);

  function limpiarFiltros() {
    setQ(""); setEntidadFiltro(""); setAccionFiltro(""); setDesde(""); setHasta("");
  }

  return (
    <div className="screen-container">
      {/* ── HEADER 1 LÍNEA ── */}
      <div className="screen-header">
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span>🔍</span>
          <h1 style={{ margin: 0, fontSize: "1rem", fontWeight: 700 }}>Bitácora de Auditoría</h1>
          <span style={{ fontSize: "0.75rem", color: "var(--ink-soft)" }}>
            — Registro inmutable de acciones del sistema
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          {cargando && (
            <span style={{ fontSize: "0.72rem", color: "var(--ink-soft)" }}>Cargando…</span>
          )}
          {hayFiltros && (
            <button
              type="button"
              className="btn secondary"
              style={{ fontSize: "0.75rem", padding: "0.25rem 0.6rem" }}
              onClick={limpiarFiltros}
            >
              ✕ Limpiar filtros
            </button>
          )}
        </div>
      </div>

      {error && <div className="alert error" style={{ margin: "0 1rem", flexShrink: 0 }}>{error}</div>}

      {/* ── KPI STRIP ── */}
      <div className="screen-kpis" style={{ gridTemplateColumns: "repeat(3, 1fr)", flexShrink: 0 }}>
        <div className="screen-kpi-tile accent">
          <span className="screen-kpi-label">Total Eventos Auditados</span>
          <span className="screen-kpi-value">{pagina?.total.toLocaleString("es-GT") ?? "0"}</span>
          <span className="screen-kpi-sub">Trazabilidad completa</span>
        </div>
        <div className="screen-kpi-tile">
          <span className="screen-kpi-label">Entidades Monitoreadas</span>
          <span className="screen-kpi-value">{entidades.length}</span>
          <span className="screen-kpi-sub">Módulos bajo supervisión</span>
        </div>
        <div className="screen-kpi-tile">
          <span className="screen-kpi-label">Página Actual</span>
          <span className="screen-kpi-value">{page} / {totalPaginas}</span>
          <span className="screen-kpi-sub">{pageSize} registros por bloque</span>
        </div>
      </div>

      {/* ── BARRA DE FILTROS COMPACTA ── */}
      <div
        className="screen-toolbar"
        style={{ gap: "0.4rem", flexWrap: "wrap", alignItems: "center", flexShrink: 0 }}
      >
        {/* Búsqueda */}
        <div className="searchbar" style={{ flex: "1 1 180px", minWidth: 180, marginBottom: 0 }}>
          <input
            placeholder="Buscar por usuario o entidad…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            style={{ fontSize: "0.8rem" }}
          />
        </div>

        {/* Entidad */}
        <select
          value={entidadFiltro}
          onChange={(e) => setEntidadFiltro(e.target.value)}
          style={{
            padding: "0.3rem 0.55rem", borderRadius: "6px",
            border: "1px solid var(--line)", fontSize: "0.8rem",
            background: "var(--paper)", color: "var(--ink)",
          }}
        >
          <option value="">Todas las entidades</option>
          {entidades.map((e) => <option key={e} value={e}>{e}</option>)}
        </select>

        {/* Acción */}
        <select
          value={accionFiltro}
          onChange={(e) => setAccionFiltro(e.target.value)}
          style={{
            padding: "0.3rem 0.55rem", borderRadius: "6px",
            border: "1px solid var(--line)", fontSize: "0.8rem",
            background: "var(--paper)", color: "var(--ink)",
          }}
        >
          <option value="">Todas las acciones</option>
          <option value="CREAR">✅ Creaciones</option>
          <option value="ACTUALIZAR">✏️ Modificaciones</option>
          <option value="ELIMINAR">🗑️ Eliminaciones</option>
        </select>

        {/* Desde */}
        <div style={{ display: "flex", gap: "0.3rem", alignItems: "center" }}>
          <label style={{ fontSize: "0.75rem", color: "var(--ink-soft)", whiteSpace: "nowrap" }}>Desde</label>
          <input
            type="date" value={desde} onChange={(e) => setDesde(e.target.value)}
            style={{
              padding: "0.28rem 0.45rem", borderRadius: "6px",
              border: "1px solid var(--line)", fontSize: "0.78rem",
              background: "var(--paper)", color: "var(--ink)",
            }}
          />
        </div>

        {/* Hasta */}
        <div style={{ display: "flex", gap: "0.3rem", alignItems: "center" }}>
          <label style={{ fontSize: "0.75rem", color: "var(--ink-soft)", whiteSpace: "nowrap" }}>Hasta</label>
          <input
            type="date" value={hasta} onChange={(e) => setHasta(e.target.value)}
            style={{
              padding: "0.28rem 0.45rem", borderRadius: "6px",
              border: "1px solid var(--line)", fontSize: "0.78rem",
              background: "var(--paper)", color: "var(--ink)",
            }}
          />
        </div>
      </div>

      {/* ── TABLA CON SCROLL INTERNO ── */}
      <div className="table-scroll-container" style={{ flex: 1 }}>
        <table style={{ fontSize: "0.8rem", width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={{ width: "13%" }}>Fecha y Hora</th>
              <th style={{ width: "18%" }}>Usuario</th>
              <th style={{ width: "18%" }}>Entidad</th>
              <th style={{ width: "11%", textAlign: "center" }}>Acción</th>
              <th style={{ width: "17%" }}>ID del Registro</th>
              <th style={{ width: "10%", textAlign: "center" }}>Detalles</th>
            </tr>
          </thead>
          <tbody>
            {cargando && (
              <tr>
                <td colSpan={6} style={{ textAlign: "center", padding: "2rem", color: "var(--ink-soft)" }}>
                  Cargando registros…
                </td>
              </tr>
            )}
            {!cargando && pagina?.data.map((r) => {
              const cfg = ACCION_COLOR[r.accion] ?? { bg: "rgba(100,100,100,0.15)", color: "#6b7280", label: r.accion };
              return (
                <tr key={r.id}>
                  <td className="mono" style={{ whiteSpace: "nowrap", fontSize: "0.75rem" }}>
                    {new Date(r.fecha).toLocaleString("es-GT", { dateStyle: "short", timeStyle: "medium" })}
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, fontSize: "0.8rem" }}>{r.usuario_nombre}</div>
                    <div style={{ fontSize: "0.68rem", color: "var(--ink-soft)" }}>{r.usuario_rol}</div>
                  </td>
                  <td style={{ fontWeight: 600, fontSize: "0.8rem" }}>{r.entidad}</td>
                  <td style={{ textAlign: "center" }}>
                    <span style={{
                      display: "inline-block", fontSize: "0.69rem", fontWeight: 700,
                      padding: "0.12rem 0.4rem", borderRadius: "4px",
                      background: cfg.bg, color: cfg.color,
                      border: `1px solid ${cfg.color}44`,
                    }}>
                      {cfg.label}
                    </span>
                  </td>
                  <td className="mono" style={{ fontSize: "0.69rem", color: "var(--ink-soft)" }}>
                    {r.entidad_id.slice(0, 10)}…
                  </td>
                  <td style={{ textAlign: "center" }}>
                    {(r.datos_anteriores || r.datos_nuevos) && (
                      <button
                        className="link-btn"
                        style={{ fontSize: "0.75rem" }}
                        onClick={() => setDetalle(r)}
                      >
                        Ver cambios
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
            {!cargando && pagina?.data.length === 0 && (
              <tr>
                <td colSpan={6} style={{ textAlign: "center", padding: "2rem", color: "var(--ink-soft)" }}>
                  No se encontraron registros con los filtros aplicados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ── FOOTER / PAGINACIÓN ── */}
      <div className="screen-footer" style={{ justifyContent: "space-between" }}>
        <span style={{ fontSize: "0.75rem", color: "var(--ink-soft)" }}>
          {pagina
            ? `${pagina.data.length} registros mostrados · Total: ${pagina.total.toLocaleString("es-GT")}`
            : "—"}
        </span>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <button
            className="btn secondary"
            style={{ fontSize: "0.75rem", padding: "0.2rem 0.6rem" }}
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            ← Anterior
          </button>
          <span style={{ fontSize: "0.78rem", color: "var(--ink-soft)" }}>
            Página {page} de {totalPaginas}
          </span>
          <button
            className="btn secondary"
            style={{ fontSize: "0.75rem", padding: "0.2rem 0.6rem" }}
            disabled={page >= totalPaginas}
            onClick={() => setPage((p) => p + 1)}
          >
            Siguiente →
          </button>
        </div>
      </div>

      {/* ── MODAL DE DETALLE DE CAMBIOS ── */}
      {detalle && (
        <div
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)",
            display: "flex", alignItems: "center", justifyContent: "center", zIndex: 300,
          }}
          onClick={() => setDetalle(null)}
        >
          <div
            style={{
              background: "var(--paper)", borderRadius: "12px", padding: "1.5rem",
              width: "100%", maxWidth: "700px", maxHeight: "80vh", overflow: "auto",
              margin: "1rem", boxShadow: "0 8px 32px rgba(0,0,0,0.35)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
              <div>
                <h3 style={{ margin: "0 0 0.2rem", fontSize: "1rem" }}>
                  {detalle.entidad} — {ACCION_COLOR[detalle.accion]?.label ?? detalle.accion}
                </h3>
                <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--ink-soft)" }}>
                  Por <strong>{detalle.usuario_nombre}</strong> el{" "}
                  {new Date(detalle.fecha).toLocaleString("es-GT", { dateStyle: "long", timeStyle: "medium" })}
                </p>
              </div>
              <button className="btn secondary" style={{ fontSize: "0.78rem" }} onClick={() => setDetalle(null)}>
                Cerrar
              </button>
            </div>

            {detalle.motivo && (
              <div style={{
                background: "rgba(234, 179, 8, 0.1)",
                border: "1px solid rgba(234, 179, 8, 0.3)",
                padding: "1rem",
                borderRadius: "8px",
                marginBottom: "1.5rem"
              }}>
                <h4 style={{ margin: "0 0 0.4rem", fontSize: "0.85rem", color: "#a16207" }}>
                  Motivo de la Corrección:
                </h4>
                <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--ink)", lineHeight: 1.5 }}>
                  {detalle.motivo}
                </p>
              </div>
            )}

            <div style={{
              display: "grid",
              gridTemplateColumns: detalle.datos_anteriores && detalle.datos_nuevos ? "1fr 1fr" : "1fr",
              gap: "1rem",
            }}>
              {detalle.datos_anteriores && (
                <div>
                  <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "#d97706", marginBottom: "0.4rem", textTransform: "uppercase" }}>
                    Antes
                  </div>
                  <pre style={{
                    margin: 0, fontSize: "0.7rem", background: "rgba(180,83,9,0.1)",
                    borderRadius: "6px", padding: "0.75rem", overflow: "auto",
                    maxHeight: "300px", border: "1px solid rgba(180,83,9,0.3)",
                  }}>
                    {JSON.stringify(detalle.datos_anteriores, null, 2)}
                  </pre>
                </div>
              )}
              {detalle.datos_nuevos && (
                <div>
                  <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "#16a34a", marginBottom: "0.4rem", textTransform: "uppercase" }}>
                    Después
                  </div>
                  <pre style={{
                    margin: 0, fontSize: "0.7rem", background: "rgba(22,163,74,0.1)",
                    borderRadius: "6px", padding: "0.75rem", overflow: "auto",
                    maxHeight: "300px", border: "1px solid rgba(22,163,74,0.3)",
                  }}>
                    {JSON.stringify(detalle.datos_nuevos, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
