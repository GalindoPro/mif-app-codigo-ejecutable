import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, mensajeError } from "../lib/api";
import { formatoQ } from "../types";
import type { AportacionSocio } from "../types";

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

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Padrón de Aportaciones de Capital</h1>
          <p>Registro oficial del capital social de los asociados, datos generales y personas beneficiarias.</p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button className="btn secondary" onClick={() => window.print()}>
            🖨️ Imprimir
          </button>
          <Link to="/socios/nuevo" className="btn">
            + Nuevo socio
          </Link>
        </div>
      </div>

      {error && <div className="alert error">{error}</div>}

      <div className="stat-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", marginBottom: "1.5rem" }}>
        <div className="stat-card accent">
          <span className="label">Capital Social Aportado</span>
          <span className="value">{formatoQ(totalCapital)}</span>
          <span className="sub">Total en aportaciones</span>
        </div>
        <div className="stat-card">
          <span className="label">Asociados en padrón</span>
          <span className="value mono">{totalSocios}</span>
          <span className="sub">Socios inscritos</span>
        </div>
        <div className="stat-card">
          <span className="label">Aportación promedio</span>
          <span className="value">{formatoQ(promedioAportacion)}</span>
          <span className="sub">Por asociado activo</span>
        </div>
      </div>

      <div className="searchbar">
        <input
          placeholder="Buscar en padrón por nombre, DPI, No. de asociado…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>No. Asociado</th>
              <th>Nombres del asociado</th>
              <th>DPI</th>
              <th>Edad</th>
              <th>Género</th>
              <th>Capital Aportado</th>
              <th>Persona Beneficiaria</th>
              <th>Fecha Ingreso</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {aportacionesPaginadas.map((a) => (
              <tr key={a.socio_id}>
                <td className="mono">
                  <Link to={`/socios/${a.socio_id}`} style={{ fontWeight: 600 }}>
                    {a.numero_asociado}
                  </Link>
                </td>
                <td>
                  <Link to={`/socios/${a.socio_id}`} style={{ color: "inherit", textDecoration: "none", fontWeight: 600 }}>
                    {a.nombres}
                  </Link>
                  {a.telefono && (
                    <div style={{ fontSize: "0.78rem", color: "var(--ink-soft)" }}>Tel: {a.telefono}</div>
                  )}
                </td>
                <td className="mono">{a.dpi ?? "—"}</td>
                <td className="mono">{a.edad ? `${a.edad} años` : "—"}</td>
                <td>
                  <span
                    style={{
                      display: "inline-block",
                      padding: "0.15rem 0.45rem",
                      borderRadius: "4px",
                      fontSize: "0.78rem",
                      fontWeight: 600,
                      background: a.genero === "F" ? "#fdf2f8" : a.genero === "M" ? "#eff6ff" : "transparent",
                      color: a.genero === "F" ? "#9d174d" : a.genero === "M" ? "#1e40af" : "inherit",
                    }}
                  >
                    {a.genero === "F" ? "Femenino" : a.genero === "M" ? "Masculino" : "—"}
                  </span>
                </td>
                <td className="mono" style={{ fontWeight: 700, color: "var(--accent)" }}>
                  {formatoQ(a.total_aportaciones)}
                </td>
                <td>
                  <strong>{a.nombre_beneficiario ?? "—"}</strong>
                  {(a.dpi_beneficiario || a.telefono_beneficiario) && (
                    <div style={{ fontSize: "0.78rem", color: "var(--ink-soft)" }}>
                      {a.dpi_beneficiario ? `DPI: ${a.dpi_beneficiario} ` : ""}
                      {a.telefono_beneficiario ? `· Tel: ${a.telefono_beneficiario}` : ""}
                    </div>
                  )}
                </td>
                <td className="mono">{new Date(a.fecha_ingreso).toLocaleDateString("es-GT")}</td>
                <td>
                  <span className={`badge ${a.estado.toLowerCase()}`}>{a.estado}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {aportaciones && aportaciones.length === 0 && (
          <div className="empty">No se encontraron asociados en el padrón de aportaciones.</div>
        )}
      </div>

      {totalSocios > pageSize && (
        <div className="pagination">
          <button className="btn secondary" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            Anterior
          </button>
          <span>
            Mostrando {aportacionesPaginadas.length} de {totalSocios} asociados · Página {page} de {totalPaginas}
          </span>
          <button className="btn secondary" disabled={page >= totalPaginas} onClick={() => setPage((p) => p + 1)}>
            Siguiente
          </button>
        </div>
      )}
    </div>
  );
}
