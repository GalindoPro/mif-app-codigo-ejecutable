import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, mensajeError } from "../lib/api";
import { formatoQ } from "../types";
import type { AportacionSocio } from "../types";
import { formatearDPI } from "../lib/formatters";

export default function AportacionesList() {
  const [aportaciones, setAportaciones] = useState<AportacionSocio[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  function cargar() {
    api
      .get<AportacionSocio[]>("/socios/aportaciones", {
        params: { q: q || undefined },
      })
      .then(({ data }) => setAportaciones(data))
      .catch((err) => setError(mensajeError(err)));
  }

  useEffect(() => {
    setPage(1);
    const timer = setTimeout(cargar, 200);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const totalCapital = aportaciones?.reduce((sum, a) => sum + Number(a.total_aportaciones), 0) ?? 0;
  const totalSocios = aportaciones?.length ?? 0;
  const totalPaginas = Math.max(1, Math.ceil(totalSocios / pageSize));
  const aportacionesPaginadas = aportaciones?.slice((page - 1) * pageSize, page * pageSize) ?? [];
  const promedioAportacion = totalSocios > 0 ? totalCapital / totalSocios : 0;

  function formatearFechaCorta(f: string | null | undefined): string {
    if (!f) return "—";
    const soloFecha = f.includes("T") ? f.split("T")[0] : f;
    const partes = soloFecha.split("-");
    if (partes.length === 3) {
      return `${parseInt(partes[2], 10)}/${parseInt(partes[1], 10)}/${partes[0]}`;
    }
    return soloFecha;
  }

  return (
    <div className="screen-container">
      {/* CABECERA COMPACTA DE 1 LÍNEA */}
      <div className="screen-header">
        <div style={{ display: "flex", alignItems: "center", gap: "0.65rem", flexWrap: "wrap" }}>
          <h1 style={{ display: "flex", alignItems: "center", gap: "0.4rem", margin: 0, fontSize: "1.2rem" }}>
            <span>🏛️</span> Padrón de Aportaciones
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
            Capital Social Oficial
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
            to="/socios/nuevo"
            className="btn"
            style={{ padding: "0.3rem 0.75rem", fontSize: "0.8rem", textDecoration: "none" }}
          >
            + Nuevo socio
          </Link>
        </div>
      </div>

      {error && <div className="alert error" style={{ margin: "0.25rem 0", padding: "0.4rem 0.75rem", fontSize: "0.82rem" }}>{error}</div>}

      {/* STRIP DE KPIS HORIZONTALES CON ESTILO FINTECH */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "0.5rem" }}>
        {/* CAPITAL SOCIAL APORTADO */}
        <div
          style={{
            background: "rgba(5, 150, 105, 0.06)",
            border: "1px solid rgba(5, 150, 105, 0.3)",
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
              CAPITAL SOCIAL OFICIAL
            </span>
            <span style={{ fontSize: "0.85rem" }}>🏛️</span>
          </div>
          <span style={{ fontSize: "1.15rem", fontWeight: 800, color: "#059669", fontFamily: "monospace" }}>
            {formatoQ(totalCapital)}
          </span>
          <span style={{ fontSize: "0.65rem", color: "var(--ink-soft)" }}>Patrimonio cooperativo</span>
        </div>

        {/* ASOCIADOS EN PADRÓN */}
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
            <span style={{ fontSize: "0.65rem", fontWeight: 700, color: "#6366f1", letterSpacing: "0.03em" }}>
              ASOCIADOS EN PADRÓN
            </span>
            <span style={{ fontSize: "0.85rem" }}>👥</span>
          </div>
          <span style={{ fontSize: "1.08rem", fontWeight: 700, color: "#6366f1", fontFamily: "monospace" }}>
            {totalSocios}
          </span>
          <span style={{ fontSize: "0.65rem", color: "var(--ink-soft)" }}>Socios activos inscritos</span>
        </div>

        {/* APORTACIÓN PROMEDIO */}
        <div
          style={{
            background: "var(--paper)",
            border: "1px solid var(--line)",
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
              APORTACIÓN PROMEDIO
            </span>
            <span style={{ fontSize: "0.85rem" }}>📈</span>
          </div>
          <span style={{ fontSize: "1.08rem", fontWeight: 700, color: "#0284c7", fontFamily: "monospace" }}>
            {formatoQ(promedioAportacion)}
          </span>
          <span style={{ fontSize: "0.65rem", color: "var(--ink-soft)" }}>Por asociado activo</span>
        </div>

        {/* CUMPLIMIENTO ESTATUTARIO */}
        <div
          style={{
            background: "var(--paper)",
            border: "1px solid var(--line)",
            borderLeft: "4px solid #10b981",
            borderRadius: "8px",
            padding: "0.45rem 0.65rem",
            display: "flex",
            flexDirection: "column",
            boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "0.65rem", fontWeight: 700, color: "#10b981", letterSpacing: "0.03em" }}>
              CUMPLIMIENTO ESTATUTARIO
            </span>
            <span style={{ fontSize: "0.85rem" }}>✓</span>
          </div>
          <span style={{ fontSize: "1.08rem", fontWeight: 700, color: "#10b981", fontFamily: "monospace" }}>
            Min. Q 100.00
          </span>
          <span style={{ fontSize: "0.65rem", color: "var(--ink-soft)" }}>Norma cooperativa activa</span>
        </div>
      </div>

      {/* BARRA DE BÚSQUEDA COMPACTA */}
      <div className="screen-toolbar">
        <div style={{ position: "relative", flex: 1, maxWidth: 480 }}>
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
            placeholder="Buscar por nombre, DPI o número de asociado..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
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

      {/* TABLA CON SCROLL INTERNO Y CABECERA PEGAJOSA */}
      <div className="table-scroll-container">
        <table className="table-compact">
          <thead>
            <tr>
              <th style={{ minWidth: 110 }}>NO. ASOCIADO</th>
              <th style={{ minWidth: 220 }}>NOMBRES DEL ASOCIADO</th>
              <th style={{ minWidth: 120 }}>DPI</th>
              <th style={{ minWidth: 100 }}>GÉNERO</th>
              <th style={{ minWidth: 120, textAlign: "right" }}>CAPITAL APORTADO</th>
              <th style={{ minWidth: 220 }}>PERSONA BENEFICIARIA</th>
              <th style={{ minWidth: 100 }}>FECHA INGRESO</th>
              <th style={{ minWidth: 80, textAlign: "center" }}>ESTADO</th>
            </tr>
          </thead>
          <tbody>
            {aportacionesPaginadas.map((a) => (
              <tr key={a.socio_id}>
                <td className="mono" style={{ fontWeight: 700, color: "var(--accent)" }}>
                  <Link to={`/socios/${a.socio_id}`} style={{ color: "inherit", textDecoration: "none" }}>
                    {a.numero_asociado}
                  </Link>
                </td>
                <td>
                  <Link
                    to={`/socios/${a.socio_id}`}
                    style={{ color: "inherit", textDecoration: "none", fontWeight: 600 }}
                  >
                    {a.nombres}
                  </Link>
                  {a.telefono && (
                    <div style={{ fontSize: "0.74rem", color: "var(--ink-soft)" }}>Tel: {a.telefono}</div>
                  )}
                </td>
                <td className="mono" style={{ fontSize: "0.8rem" }}>{a.dpi ? formatearDPI(a.dpi) : "—"}</td>
                <td>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                    <span
                      style={{
                        padding: "0.1rem 0.4rem",
                        borderRadius: "4px",
                        fontSize: "0.72rem",
                        fontWeight: 600,
                        background: "var(--mono-bg)",
                        color: a.genero === "F" ? "#f472b6" : a.genero === "M" ? "#60a5fa" : "var(--ink-soft)",
                        border: "1px solid var(--line)",
                      }}
                    >
                      {a.genero === "F" ? "F" : a.genero === "M" ? "M" : "—"}
                    </span>
                  </div>
                </td>
                <td className="mono" style={{ fontWeight: 700, color: "var(--accent)", textAlign: "right" }}>
                  {formatoQ(a.total_aportaciones)}
                </td>
                <td>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", flexWrap: "wrap" }}>
                    <strong style={{ fontSize: "0.82rem" }}>{a.nombre_beneficiario ?? "—"}</strong>
                    {a.parentesco_beneficiario && (
                      <span
                        style={{
                          fontSize: "0.68rem",
                          fontWeight: 700,
                          padding: "0.08rem 0.35rem",
                          borderRadius: "4px",
                          background: "var(--mono-bg)",
                          border: "1px solid var(--line)",
                          color: "var(--accent)",
                        }}
                      >
                        {a.parentesco_beneficiario}
                      </span>
                    )}
                  </div>
                  {(a.dpi_beneficiario || a.telefono_beneficiario) && (
                    <div style={{ fontSize: "0.72rem", color: "var(--ink-soft)", marginTop: "0.1rem" }}>
                      {a.dpi_beneficiario ? `DPI: ${formatearDPI(a.dpi_beneficiario)} ` : ""}
                      {a.telefono_beneficiario ? `· Tel: ${a.telefono_beneficiario}` : ""}
                    </div>
                  )}
                </td>
                <td className="mono" style={{ fontSize: "0.8rem" }}>
                  {formatearFechaCorta(a.fecha_ingreso)}
                </td>
                <td style={{ textAlign: "center" }}>
                  <span className={`badge ${a.estado.toLowerCase()}`} style={{ fontSize: "0.72rem", padding: "0.15rem 0.45rem" }}>
                    {a.estado === "ACTIVO" ? "Activo" : a.estado}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {aportaciones && aportaciones.length === 0 && (
          <div className="empty" style={{ padding: "2rem", textAlign: "center", color: "var(--ink-soft)" }}>
            No se encontraron asociados en el padrón de aportaciones.
          </div>
        )}
      </div>

      {/* FOOTER FIJO CON PAGINACIÓN */}
      <div className="screen-footer">
        <span style={{ fontSize: "0.8rem", color: "var(--ink-soft)" }}>
          Mostrando {aportacionesPaginadas.length} de {totalSocios} asociados · Pág. {page} de {totalPaginas}
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
    </div>
  );
}
