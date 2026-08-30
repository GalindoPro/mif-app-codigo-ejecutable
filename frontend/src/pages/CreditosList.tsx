import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, mensajeError } from "../lib/api";
import {
  ESTADO_PRESTAMO_LABEL,
  formatoQ,
  TIPO_PRESTAMO_LABEL,
} from "../types";
import type { Prestamo } from "../types";

export default function CreditosList() {
  const [prestamos, setPrestamos] = useState<Prestamo[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [estadoFiltro, setEstadoFiltro] = useState<string>("");
  const [page, setPage] = useState(1);
  const pageSize = 10;

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

  useEffect(() => {
    setPage(1);
    const timer = setTimeout(cargar, 200);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, estadoFiltro]);

  const totalDesembolsado =
    prestamos
      ?.filter((p) => p.estado === "DESEMBOLSADO")
      .reduce((acc, p) => acc + Number(p.monto_aprobado ?? p.monto_solicitado), 0) ?? 0;

  const pendientes = prestamos?.filter((p) => p.estado === "SOLICITUD").length ?? 0;
  const aprobados = prestamos?.filter((p) => p.estado === "APROBADO").length ?? 0;

  const totalCreditos = prestamos?.length ?? 0;
  const totalPaginas = Math.max(1, Math.ceil(totalCreditos / pageSize));
  const prestamosPaginados = prestamos?.slice((page - 1) * pageSize, page * pageSize) ?? [];

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Módulo de Créditos</h1>
          <p>Solicitudes, colocación de préstamos fiduciarios/hipotecarios y seguimiento por promotor.</p>
        </div>
        <div style={{ display: "flex", gap: "0.6rem" }}>
          <Link to="/creditos/simulador" className="btn secondary">
            📊 Simulador de crédito
          </Link>
          <Link to="/creditos/nuevo" className="btn">
            + Nueva solicitud
          </Link>
        </div>
      </div>

      {error && <div className="alert error">{error}</div>}

      <div className="stat-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(180px, 220px))", marginBottom: "1.5rem" }}>
        <div className="stat-card accent">
          <span className="label">Cartera activa</span>
          <span className="value">{formatoQ(totalDesembolsado)}</span>
          <span className="sub">Préstamos desembolsados</span>
        </div>
        <div className="stat-card">
          <span className="label">Solicitudes pendientes</span>
          <span className="value mono">{pendientes}</span>
          <span className="sub">En evaluación</span>
        </div>
        <div className="stat-card">
          <span className="label">Listos para desembolso</span>
          <span className="value mono">{aprobados}</span>
          <span className="sub">Aprobados</span>
        </div>
        <div className="stat-card">
          <span className="label">Total solicitudes</span>
          <span className="value mono">{prestamos?.length ?? 0}</span>
          <span className="sub">Historial total</span>
        </div>
      </div>

      <div style={{ display: "flex", gap: "1rem", marginBottom: "1rem", flexWrap: "wrap" }}>
        <div className="searchbar" style={{ flex: 1, minWidth: 260, marginBottom: 0 }}>
          <input
            placeholder="Buscar por socio, código de crédito o DPI…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <div style={{ minWidth: 180 }}>
          <select
            value={estadoFiltro}
            onChange={(e) => setEstadoFiltro(e.target.value)}
            style={{
              width: "100%",
              padding: "0.6rem 0.8rem",
              borderRadius: "8px",
              border: "1px solid var(--line)",
              background: "var(--paper)",
              color: "var(--ink)",
            }}
          >
            <option value="">Todos los estados</option>
            <option value="SOLICITUD">En solicitud</option>
            <option value="APROBADO">Aprobados</option>
            <option value="DESEMBOLSADO">Desembolsados</option>
            <option value="CANCELADO">Cancelados / Pagados</option>
            <option value="RECHAZADO">Rechazados</option>
          </select>
        </div>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Código</th>
              <th>Socio solicitante</th>
              <th>Tipo</th>
              <th>Monto</th>
              <th>Plazo</th>
              <th>Cuota mensual</th>
              <th>Promotor</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {prestamosPaginados.map((p) => (
              <tr key={p.id}>
                <td className="mono">
                  <Link to={`/creditos/${p.id}`}>{p.codigo}</Link>
                </td>
                <td>
                  <Link to={`/creditos/${p.id}`} style={{ color: "inherit", textDecoration: "none", fontWeight: 600 }}>
                    {p.socio_nombres}
                  </Link>
                </td>
                <td>{TIPO_PRESTAMO_LABEL[p.tipo]}</td>
                <td className="mono" style={{ fontWeight: 600 }}>
                  {formatoQ(p.monto_aprobado ?? p.monto_solicitado)}
                </td>
                <td className="mono">{p.plazo_meses} meses</td>
                <td className="mono">{formatoQ(p.cuota_mensual)}</td>
                <td>{p.promotor_nombre ?? <span style={{ color: "var(--ink-soft)" }}>—</span>}</td>
                <td>
                  <span
                    style={{
                      display: "inline-block",
                      padding: "0.2rem 0.55rem",
                      borderRadius: "6px",
                      fontSize: "0.8rem",
                      fontWeight: 600,
                      background:
                        p.estado === "DESEMBOLSADO"
                          ? "#ecfdf5"
                          : p.estado === "APROBADO"
                            ? "#eff6ff"
                            : p.estado === "SOLICITUD"
                              ? "#fef3c7"
                              : "#f1f5f9",
                      color:
                        p.estado === "DESEMBOLSADO"
                          ? "#065f46"
                          : p.estado === "APROBADO"
                            ? "#1e40af"
                            : p.estado === "SOLICITUD"
                              ? "#92400e"
                              : "#475569",
                    }}
                  >
                    {ESTADO_PRESTAMO_LABEL[p.estado]}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {prestamos && prestamos.length === 0 && (
          <div className="empty">No se encontraron créditos registrados con los filtros aplicados.</div>
        )}
      </div>

      {totalCreditos > pageSize && (
        <div className="pagination" style={{ display: "flex", gap: "1rem", alignItems: "center", justifyContent: "center", marginTop: "1rem" }}>
          <button className="btn secondary" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            Anterior
          </button>
          <span>
            Mostrando {prestamosPaginados.length} de {totalCreditos} créditos · Página {page} de {totalPaginas}
          </span>
          <button className="btn secondary" disabled={page >= totalPaginas} onClick={() => setPage((p) => p + 1)}>
            Siguiente
          </button>
        </div>
      )}
    </div>
  );
}
