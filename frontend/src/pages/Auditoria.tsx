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
  CREAR: { bg: "#dcfce7", color: "#16a34a", label: "Creación" },
  ACTUALIZAR: { bg: "#fef9c3", color: "#b45309", label: "Modificación" },
  ELIMINAR: { bg: "#fee2e2", color: "#dc2626", label: "Eliminación" },
};

export default function Auditoria() {
  const [pagina, setPagina] = useState<Pagina | null>(null);
  const [entidades, setEntidades] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [entidadFiltro, setEntidadFiltro] = useState("");
  const [accionFiltro, setAccionFiltro] = useState("");
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const [detalle, setDetalle] = useState<RegistroAuditoria | null>(null);

  const pageSize = 25;

  useEffect(() => {
    api.get<string[]>("/auditoria/entidades")
      .then(({ data }) => setEntidades(data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    setPage(1);
  }, [q, entidadFiltro, accionFiltro, desde, hasta]);

  useEffect(() => {
    setCargando(true);
    setError(null);
    api
      .get<Pagina>("/auditoria", {
        params: {
          page,
          pageSize,
          q: q || undefined,
          entidad: entidadFiltro || undefined,
          accion: accionFiltro || undefined,
          desde: desde || undefined,
          hasta: hasta || undefined,
        },
      })
      .then(({ data }) => setPagina(data))
      .catch((err) => setError(mensajeError(err)))
      .finally(() => setCargando(false));
  }, [page, q, entidadFiltro, accionFiltro, desde, hasta]);

  const totalPaginas = pagina ? Math.max(1, Math.ceil(pagina.total / pageSize)) : 1;

  return (
    <div style={{ width: "100%" }}>
      <div className="page-head">
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span style={{ fontSize: "1.5rem" }}>🔍</span>
            <h1>Bitácora de Auditoría</h1>
          </div>
          <p>Registro completo e inmutable de todas las acciones realizadas en el sistema, con quién, cuándo y datos modificados.</p>
        </div>
      </div>

      {error && <div className="alert error">{error}</div>}

      {/* KPI STRIP - 100% FLUID */}
      <div className="stat-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", marginBottom: "1.5rem" }}>
        <div className="stat-card accent">
          <span className="label">Total Eventos Auditados</span>
          <span className="value mono">{pagina?.total.toLocaleString("es-GT") ?? "0"}</span>
          <span className="sub">Trazabilidad completa</span>
        </div>
        <div className="stat-card">
          <span className="label">Entidades Monitoreadas</span>
          <span className="value mono">{entidades.length}</span>
          <span className="sub">Módulos bajo supervisión</span>
        </div>
        <div className="stat-card">
          <span className="label">Página Actual</span>
          <span className="value mono">{page} de {totalPaginas}</span>
          <span className="sub">25 registros por bloque</span>
        </div>
      </div>

      {/* FILTROS */}
      <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap", marginBottom: "1rem", alignItems: "center" }}>
        <div className="searchbar" style={{ flex: 1, minWidth: 220, marginBottom: 0 }}>
          <input
            placeholder="Buscar por usuario o entidad…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>

        <select
          value={entidadFiltro}
          onChange={(e) => setEntidadFiltro(e.target.value)}
          style={{ padding: "0.45rem 0.65rem", borderRadius: "6px", border: "1px solid var(--line)", fontSize: "0.85rem", background: "var(--paper)" }}
        >
          <option value="">Todas las entidades</option>
          {entidades.map((e) => (
            <option key={e} value={e}>{e}</option>
          ))}
        </select>

        <select
          value={accionFiltro}
          onChange={(e) => setAccionFiltro(e.target.value)}
          style={{ padding: "0.45rem 0.65rem", borderRadius: "6px", border: "1px solid var(--line)", fontSize: "0.85rem", background: "var(--paper)" }}
        >
          <option value="">Todas las acciones</option>
          <option value="CREAR">Creaciones</option>
          <option value="ACTUALIZAR">Modificaciones</option>
          <option value="ELIMINAR">Eliminaciones</option>
        </select>

        <div style={{ display: "flex", gap: "0.4rem", alignItems: "center" }}>
          <label style={{ fontSize: "0.8rem", color: "var(--ink-soft)" }}>Desde</label>
          <input type="date" value={desde} onChange={(e) => setDesde(e.target.value)}
            style={{ padding: "0.4rem", borderRadius: "6px", border: "1px solid var(--line)", fontSize: "0.82rem" }} />
        </div>
        <div style={{ display: "flex", gap: "0.4rem", alignItems: "center" }}>
          <label style={{ fontSize: "0.8rem", color: "var(--ink-soft)" }}>Hasta</label>
          <input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)}
            style={{ padding: "0.4rem", borderRadius: "6px", border: "1px solid var(--line)", fontSize: "0.82rem" }} />
        </div>

        {(q || entidadFiltro || accionFiltro || desde || hasta) && (
          <button className="btn secondary" style={{ fontSize: "0.8rem" }}
            onClick={() => { setQ(""); setEntidadFiltro(""); setAccionFiltro(""); setDesde(""); setHasta(""); }}>
            Limpiar filtros
          </button>
        )}
      </div>

      {/* TABLA */}
      <div className="table-wrap">
        <table style={{ fontSize: "0.83rem" }}>
          <thead>
            <tr>
              <th>Fecha y hora</th>
              <th>Usuario</th>
              <th>Entidad</th>
              <th style={{ textAlign: "center" }}>Acción</th>
              <th>ID del registro</th>
              <th style={{ textAlign: "center" }}>Detalles</th>
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
              const cfg = ACCION_COLOR[r.accion] ?? { bg: "#f3f4f6", color: "#6b7280", label: r.accion };
              return (
                <tr key={r.id}>
                  <td className="mono" style={{ whiteSpace: "nowrap", fontSize: "0.79rem" }}>
                    {new Date(r.fecha).toLocaleString("es-GT", { dateStyle: "short", timeStyle: "medium" })}
                  </td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{r.usuario_nombre}</div>
                    <div style={{ fontSize: "0.72rem", color: "var(--ink-soft)" }}>{r.usuario_rol}</div>
                  </td>
                  <td style={{ fontWeight: 600 }}>{r.entidad}</td>
                  <td style={{ textAlign: "center" }}>
                    <span style={{
                      display: "inline-block", fontSize: "0.72rem", fontWeight: 700,
                      padding: "0.15rem 0.45rem", borderRadius: "4px",
                      background: cfg.bg, color: cfg.color,
                    }}>
                      {cfg.label}
                    </span>
                  </td>
                  <td className="mono" style={{ fontSize: "0.72rem", color: "var(--ink-soft)" }}>
                    {r.entidad_id.slice(0, 8)}…
                  </td>
                  <td style={{ textAlign: "center" }}>
                    {(r.datos_anteriores || r.datos_nuevos) && (
                      <button
                        className="link-btn"
                        style={{ fontSize: "0.78rem" }}
                        onClick={() => setDetalle(r)}
                      >
                        Ver cambios
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {!cargando && pagina?.data.length === 0 && (
          <div className="empty">No se encontraron registros con los filtros aplicados.</div>
        )}
      </div>

      {/* PAGINACIÓN */}
      {pagina && pagina.total > pageSize && (
        <div style={{ display: "flex", gap: "1rem", alignItems: "center", justifyContent: "center", marginTop: "1rem" }}>
          <button className="btn secondary" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            Anterior
          </button>
          <span style={{ fontSize: "0.85rem" }}>
            {pagina.data.length} de {pagina.total} registros · Página {page} de {totalPaginas}
          </span>
          <button className="btn secondary" disabled={page >= totalPaginas} onClick={() => setPage((p) => p + 1)}>
            Siguiente
          </button>
        </div>
      )}

      {/* MODAL DE DETALLE DE CAMBIOS */}
      {detalle && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 300 }}
          onClick={() => setDetalle(null)}
        >
          <div
            style={{ background: "var(--paper)", borderRadius: "12px", padding: "1.5rem", width: "100%", maxWidth: "680px", maxHeight: "80vh", overflow: "auto", margin: "1rem", boxShadow: "0 8px 32px rgba(0,0,0,0.3)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
              <div>
                <h3 style={{ margin: "0 0 0.25rem" }}>{detalle.entidad} — {ACCION_COLOR[detalle.accion]?.label ?? detalle.accion}</h3>
                <p style={{ margin: 0, fontSize: "0.82rem", color: "var(--ink-soft)" }}>
                  Por <strong>{detalle.usuario_nombre}</strong> el {new Date(detalle.fecha).toLocaleString("es-GT", { dateStyle: "long", timeStyle: "medium" })}
                </p>
              </div>
              <button className="btn secondary" style={{ fontSize: "0.78rem" }} onClick={() => setDetalle(null)}>
                Cerrar
              </button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: detalle.datos_anteriores && detalle.datos_nuevos ? "1fr 1fr" : "1fr", gap: "1rem" }}>
              {detalle.datos_anteriores && (
                <div>
                  <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#b45309", marginBottom: "0.5rem", textTransform: "uppercase" }}>
                    Antes
                  </div>
                  <pre style={{ margin: 0, fontSize: "0.72rem", background: "#fef9c3", borderRadius: "6px", padding: "0.75rem", overflow: "auto", maxHeight: "300px", border: "1px solid #fde68a" }}>
                    {JSON.stringify(detalle.datos_anteriores, null, 2)}
                  </pre>
                </div>
              )}
              {detalle.datos_nuevos && (
                <div>
                  <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#16a34a", marginBottom: "0.5rem", textTransform: "uppercase" }}>
                    Después
                  </div>
                  <pre style={{ margin: 0, fontSize: "0.72rem", background: "#dcfce7", borderRadius: "6px", padding: "0.75rem", overflow: "auto", maxHeight: "300px", border: "1px solid #bbf7d0" }}>
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
