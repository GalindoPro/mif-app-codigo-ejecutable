import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, mensajeError } from "../lib/api";

interface SocioSinDpi {
  id: string;
  numero_asociado: string;
  nombres: string;
  estado: string;
  dpi: string | null;
  advertencia_importacion: string | null;
  created_at: string;
  agencia: string;
  total_cuentas: number;
  total_movimientos: number;
  se_puede_eliminar: boolean;
}

interface Duplicado {
  id1: string; codigo1: string; nombre1: string; dpi1: string | null;
  id2: string; codigo2: string; nombre2: string; dpi2: string | null;
}

interface Estadisticas {
  totalSocios: number;
  conDpi: number;
  sinDpi: number;
  conAdvertencia: number;
}

interface AuditoriaData {
  sinDpi: SocioSinDpi[];
  duplicados: Duplicado[];
  estadisticas: Estadisticas;
}

function KpiCard({ label, value, color, icon, sub }: { label: string; value: string | number; color: string; icon: string; sub?: string }) {
  return (
    <div style={{
      background: "var(--paper)", border: `1px solid var(--line)`,
      borderLeft: `4px solid ${color}`, borderRadius: 8,
      padding: "0.5rem 0.75rem", display: "flex", flexDirection: "column", gap: 2,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: "0.65rem", fontWeight: 700, color, letterSpacing: "0.04em" }}>{label}</span>
        <span style={{ fontSize: "0.9rem" }}>{icon}</span>
      </div>
      <span style={{ fontSize: "1.3rem", fontWeight: 800, color, fontFamily: "IBM Plex Mono, monospace" }}>{value}</span>
      {sub && <span style={{ fontSize: "0.65rem", color: "var(--ink-soft)" }}>{sub}</span>}
    </div>
  );
}

export default function AuditoriaImportacion() {
  const [data, setData] = useState<AuditoriaData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(true);
  const [tab, setTab] = useState<"sin-dpi" | "duplicados">("sin-dpi");
  const [eliminando, setEliminando] = useState<string | null>(null);
  const [confirmEliminar, setConfirmEliminar] = useState<SocioSinDpi | null>(null);

  function cargar() {
    setCargando(true); setError(null);
    api.get<AuditoriaData>("/socios/auditoria-importacion")
      .then(({ data: d }) => { setData(d); setCargando(false); })
      .catch((err) => { setError(mensajeError(err)); setCargando(false); });
  }

  useEffect(() => { cargar(); }, []);

  async function handleEliminar(socio: SocioSinDpi) {
    setEliminando(socio.id);
    try {
      await api.delete(`/socios/${socio.id}/eliminar-sin-vinculos`);
      setConfirmEliminar(null);
      cargar();
    } catch (err) {
      alert("Error: " + mensajeError(err));
    } finally {
      setEliminando(null);
    }
  }

  const pctIntegridad = data ? Math.round((data.estadisticas.conDpi / Math.max(data.estadisticas.totalSocios, 1)) * 100) : 0;

  return (
    <div className="screen-container">
      <div className="screen-header">
        <div style={{ display: "flex", alignItems: "center", gap: "0.65rem", flexWrap: "wrap" }}>
          <h1 style={{ margin: 0, fontSize: "1.2rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
            🔍 Auditoría de Importación
          </h1>
          <span style={{ fontSize: "0.72rem", fontWeight: 700, padding: "0.15rem 0.5rem", borderRadius: 4, background: "rgba(239,68,68,0.12)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.3)" }}>
            Solo Gerencia / Admin
          </span>
        </div>
        <button type="button" className="btn secondary" onClick={cargar} style={{ padding: "0.3rem 0.65rem", fontSize: "0.8rem" }}>
          🔄 Recargar
        </button>
      </div>

      {error && <div className="alert error" style={{ margin: "0.25rem 0", padding: "0.4rem 0.75rem", fontSize: "0.82rem" }}>{error}</div>}

      {cargando || !data ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px,1fr))", gap: "0.5rem" }}>
          {[...Array(4)].map((_, i) => <div key={i} style={{ height: 72, borderRadius: 8, background: "rgba(148,163,184,0.08)", border: "1px solid var(--line)", animation: "pulse 1.5s ease-in-out infinite" }} />)}
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px,1fr))", gap: "0.5rem" }}>
          <KpiCard label="TOTAL SOCIOS" value={data.estadisticas.totalSocios} color="#0284c7" icon="👥" sub="En el padrón completo" />
          <KpiCard label="CON DPI ✅" value={data.estadisticas.conDpi} color="#059669" icon="🪪" sub={`${pctIntegridad}% de integridad`} />
          <KpiCard label="SIN DPI ⚠️" value={data.estadisticas.sinDpi} color="#ef4444" icon="🚫" sub="Requieren actualización" />
          <KpiCard label="CON ADVERTENCIA" value={data.estadisticas.conAdvertencia} color="#d97706" icon="⚠️" sub="Importados con notas" />
        </div>
      )}

      {data && (
        <div style={{ margin: "0.15rem 0" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.2rem" }}>
            <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--ink-soft)" }}>Integridad DPI del Padrón</span>
            <span style={{ fontSize: "0.72rem", fontWeight: 800, color: pctIntegridad >= 90 ? "#059669" : pctIntegridad >= 70 ? "#d97706" : "#ef4444" }}>{pctIntegridad}%</span>
          </div>
          <div style={{ height: 6, borderRadius: 6, background: "var(--paper-raised)", overflow: "hidden", border: "1px solid var(--line)" }}>
            <div style={{ height: "100%", width: `${pctIntegridad}%`, borderRadius: 6, background: pctIntegridad >= 90 ? "#059669" : pctIntegridad >= 70 ? "#d97706" : "#ef4444", transition: "width 0.5s ease" }} />
          </div>
        </div>
      )}

      <div className="screen-toolbar" style={{ flexWrap: "wrap", gap: "0.4rem" }}>
        <div style={{ display: "inline-flex", background: "var(--paper-raised)", padding: 2, borderRadius: 8, border: "1px solid var(--line)" }}>
          <button type="button" onClick={() => setTab("sin-dpi")} style={{ padding: "0.3rem 0.75rem", fontSize: "0.8rem", fontWeight: tab === "sin-dpi" ? 700 : 500, background: tab === "sin-dpi" ? "#ef4444" : "transparent", color: tab === "sin-dpi" ? "#fff" : "var(--ink-soft)", border: "none", borderRadius: 6, cursor: "pointer", display: "flex", alignItems: "center", gap: 4, transition: "all 0.15s" }}>
            🚫 Sin DPI <span style={{ fontSize: "0.7rem", background: "rgba(0,0,0,0.2)", padding: "1px 5px", borderRadius: 10 }}>{data?.estadisticas.sinDpi ?? "…"}</span>
          </button>
          <button type="button" onClick={() => setTab("duplicados")} style={{ padding: "0.3rem 0.75rem", fontSize: "0.8rem", fontWeight: tab === "duplicados" ? 700 : 500, background: tab === "duplicados" ? "#d97706" : "transparent", color: tab === "duplicados" ? "#0f172a" : "var(--ink-soft)", border: "none", borderRadius: 6, cursor: "pointer", display: "flex", alignItems: "center", gap: 4, transition: "all 0.15s" }}>
            👯 Posibles Duplicados <span style={{ fontSize: "0.7rem", background: "rgba(0,0,0,0.15)", padding: "1px 5px", borderRadius: 10 }}>{data?.duplicados.length ?? "…"}</span>
          </button>
        </div>
        <span style={{ fontSize: "0.75rem", color: "var(--ink-soft)", marginLeft: "auto" }}>
          {tab === "sin-dpi" ? "💡 Solo se puede eliminar si el socio no tiene cuentas ni movimientos." : "💡 Verifique en el Excel si son la misma persona o personas distintas."}
        </span>
      </div>

      {tab === "sin-dpi" && (
        <div className="table-scroll-container">
          <table className="table-compact">
            <thead>
              <tr>
                <th style={{ minWidth: 110 }}>CÓDIGO</th>
                <th style={{ minWidth: 220 }}>NOMBRE COMPLETO</th>
                <th style={{ minWidth: 80, textAlign: "center" }}>CUENTAS</th>
                <th style={{ minWidth: 80, textAlign: "center" }}>MOVIM.</th>
                <th style={{ minWidth: 200 }}>ADVERTENCIA IMPORTACIÓN</th>
                <th style={{ minWidth: 120, textAlign: "center" }}>PUEDE ELIMINAR</th>
                <th style={{ minWidth: 130, textAlign: "right" }}>ACCIONES</th>
              </tr>
            </thead>
            <tbody>
              {data?.sinDpi.map((s) => (
                <tr key={s.id}>
                  <td><span style={{ fontFamily: "IBM Plex Mono, monospace", fontWeight: 700, fontSize: "0.8rem", color: "var(--accent)" }}>{s.numero_asociado}</span></td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{s.nombres}</div>
                    <div style={{ fontSize: "0.7rem", color: "var(--ink-soft)" }}>Estado: {s.estado}</div>
                  </td>
                  <td style={{ textAlign: "center" }}>
                    <span style={{ fontFamily: "IBM Plex Mono, monospace", fontWeight: 700, fontSize: "0.85rem", color: s.total_cuentas > 0 ? "#0284c7" : "var(--ink-soft)" }}>{s.total_cuentas}</span>
                  </td>
                  <td style={{ textAlign: "center" }}>
                    <span style={{ fontFamily: "IBM Plex Mono, monospace", fontWeight: 700, fontSize: "0.85rem", color: s.total_movimientos > 0 ? "#059669" : "var(--ink-soft)" }}>{s.total_movimientos}</span>
                  </td>
                  <td>
                    {s.advertencia_importacion
                      ? <span style={{ fontSize: "0.72rem", color: "#d97706", fontStyle: "italic" }}>⚠️ {s.advertencia_importacion}</span>
                      : <span style={{ fontSize: "0.72rem", color: "var(--ink-soft)" }}>—</span>}
                  </td>
                  <td style={{ textAlign: "center" }}>
                    {s.se_puede_eliminar
                      ? <span className="badge danger" style={{ fontSize: "0.7rem" }}>🗑️ Sí, sin vínculos</span>
                      : <span className="badge activo" style={{ fontSize: "0.7rem" }}>🔒 No (tiene datos)</span>}
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <div style={{ display: "flex", gap: "0.3rem", justifyContent: "flex-end" }}>
                      <Link to={`/socios/${s.id}`} className="btn secondary" style={{ padding: "0.18rem 0.5rem", fontSize: "0.74rem", textDecoration: "none" }}>✏️ Editar DPI</Link>
                      {s.se_puede_eliminar && (
                        <button type="button" onClick={() => setConfirmEliminar(s)} style={{ padding: "0.18rem 0.5rem", fontSize: "0.74rem", background: "rgba(239,68,68,0.12)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 4, cursor: "pointer" }}>
                          🗑️ Eliminar
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {data?.sinDpi.length === 0 && (
                <tr><td colSpan={7} style={{ textAlign: "center", padding: "2rem", color: "var(--ink-soft)" }}>✅ Todos los socios tienen DPI registrado.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {tab === "duplicados" && (
        <div className="table-scroll-container">
          <table className="table-compact">
            <thead>
              <tr>
                <th style={{ minWidth: 110 }}>CÓDIGO A</th>
                <th style={{ minWidth: 120 }}>DPI A</th>
                <th style={{ minWidth: 220 }}>NOMBRE IGUAL</th>
                <th style={{ minWidth: 110 }}>CÓDIGO B</th>
                <th style={{ minWidth: 120 }}>DPI B</th>
              </tr>
            </thead>
            <tbody>
              {data?.duplicados.map((d, i) => (
                <tr key={i}>
                  <td><Link to={`/socios/${d.id1}`} style={{ color: "#059669", fontFamily: "IBM Plex Mono, monospace", fontWeight: 700, fontSize: "0.8rem", textDecoration: "none" }}>{d.codigo1}</Link></td>
                  <td style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: "0.78rem" }}>{d.dpi1 || <span style={{ color: "#ef4444" }}>Sin DPI</span>}</td>
                  <td style={{ fontWeight: 600 }}>{d.nombre1}</td>
                  <td><Link to={`/socios/${d.id2}`} style={{ color: "#d97706", fontFamily: "IBM Plex Mono, monospace", fontWeight: 700, fontSize: "0.8rem", textDecoration: "none" }}>{d.codigo2}</Link></td>
                  <td style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: "0.78rem" }}>{d.dpi2 || <span style={{ color: "#ef4444" }}>Sin DPI</span>}</td>
                </tr>
              ))}
              {data?.duplicados.length === 0 && (
                <tr><td colSpan={5} style={{ textAlign: "center", padding: "2rem", color: "var(--ink-soft)" }}>✅ No se detectaron duplicados por nombre exacto.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <div className="screen-footer no-print">
        <span style={{ fontSize: "0.78rem", color: "var(--ink-soft)" }}>
          {tab === "sin-dpi"
            ? `${data?.sinDpi.length ?? 0} socios sin DPI · ${data?.sinDpi.filter(s => s.se_puede_eliminar).length ?? 0} se pueden eliminar`
            : `${data?.duplicados.length ?? 0} posibles pares duplicados`}
        </span>
        <Link to="/socios" className="btn secondary" style={{ padding: "0.22rem 0.6rem", fontSize: "0.78rem", textDecoration: "none" }}>← Volver al Padrón</Link>
      </div>

      {confirmEliminar && (
        <div className="modal-overlay" onClick={() => setConfirmEliminar(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 440 }}>
            <div style={{ borderBottom: "1px solid var(--line)", paddingBottom: "0.75rem", marginBottom: "1rem" }}>
              <h3 style={{ margin: 0, color: "#ef4444", fontSize: "1rem" }}>⚠️ Confirmar Eliminación</h3>
            </div>
            <p style={{ fontSize: "0.85rem", lineHeight: 1.5 }}>¿Eliminar permanentemente al socio:</p>
            <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: 8, padding: "0.65rem 0.85rem", margin: "0.75rem 0" }}>
              <div style={{ fontWeight: 700, color: "#ef4444" }}>{confirmEliminar.numero_asociado}</div>
              <div style={{ fontWeight: 600 }}>{confirmEliminar.nombres}</div>
              <div style={{ fontSize: "0.75rem", color: "var(--ink-soft)", marginTop: 4 }}>Sin DPI · Sin cuentas ni movimientos vinculados</div>
            </div>
            <p style={{ fontSize: "0.8rem", color: "#94a3b8", fontStyle: "italic" }}>Esta acción quedará registrada en la Bitácora de Auditoría.</p>
            <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end", marginTop: "1rem" }}>
              <button type="button" className="btn secondary" onClick={() => setConfirmEliminar(null)} style={{ padding: "0.35rem 0.85rem", fontSize: "0.82rem" }}>Cancelar</button>
              <button type="button" onClick={() => handleEliminar(confirmEliminar)} disabled={eliminando === confirmEliminar.id} style={{ padding: "0.35rem 0.85rem", fontSize: "0.82rem", background: "#ef4444", border: "1px solid rgba(239,68,68,0.5)", borderRadius: 6, color: "#fff", cursor: "pointer", opacity: eliminando === confirmEliminar.id ? 0.6 : 1 }}>
                {eliminando === confirmEliminar.id ? "Eliminando…" : "🗑️ Sí, eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
