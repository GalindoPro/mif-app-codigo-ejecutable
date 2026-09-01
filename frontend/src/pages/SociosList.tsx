import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, mensajeError } from "../lib/api";
import type { ListaSocios } from "../types";
import { formatearDPI } from "../lib/formatters";

export default function SociosList() {
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [resultado, setResultado] = useState<ListaSocios | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    setCargando(true);
    const timeout = setTimeout(() => {
      api
        .get<ListaSocios>("/socios", {
          params: { q: q || undefined, page, pageSize: 10 },
          signal: controller.signal,
        })
        .then(({ data }) => setResultado(data))
        .catch((err) => {
          if (err.name !== "CanceledError") setError(mensajeError(err));
        })
        .finally(() => setCargando(false));
    }, 250);
    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [q, page]);

  const totalPaginas = resultado ? Math.max(1, Math.ceil(resultado.total / resultado.pageSize)) : 1;

  return (
    <div>
      <div className="page-head">
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
            <h1>Socios y Asociados</h1>
            <span className="badge" style={{ background: "#ecfdf5", color: "#065f46", fontWeight: 700 }}>
              Orden Ascendente (Primeros 10)
            </span>
          </div>
          <p>
            Padrón oficial de la cooperativa · Mostrando de 10 en 10 en orden correlativo ascendente.
          </p>
        </div>
        <Link to="/socios/nuevo" className="btn">
          + Nuevo socio
        </Link>
      </div>

      {error && <div className="alert error">{error}</div>}

      <div className="searchbar">
        <input
          placeholder="Buscar por nombre, DPI o número de asociado…"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setPage(1);
          }}
        />
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>No. asociado</th>
              <th>Nombre</th>
              <th>Agencia</th>
              <th>Fecha de ingreso</th>
              <th>Cuentas</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {resultado?.data.map((s) => (
              <tr key={s.id}>
                <td className="mono">{s.numero_asociado}</td>
                <td>
                  <Link to={`/socios/${s.id}`} style={{ fontWeight: 600 }}>
                    {s.nombres}
                  </Link>
                  {(s.dpi || s.telefono) && (
                    <div style={{ fontSize: "0.78rem", color: "var(--ink-soft)", marginTop: "0.15rem" }}>
                      {s.dpi && <span>DPI: <span className="mono">{formatearDPI(s.dpi)}</span></span>}
                      {s.dpi && s.telefono && <span> · </span>}
                      {s.telefono && <span>Tel: <span className="mono">{s.telefono}</span></span>}
                    </div>
                  )}
                </td>
                <td>{s.agencia_nombre}</td>
                <td className="mono">{new Date(s.fecha_ingreso).toLocaleDateString("es-GT")}</td>
                <td className="mono">{s.total_cuentas ?? 0}</td>
                <td>
                  <span className={`badge ${s.estado === "ACTIVO" ? "activo" : "inactivo"}`}>
                    {s.estado === "ACTIVO" ? "Activo" : "Inactivo"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!cargando && resultado?.data.length === 0 && (
          <div className="empty">
            {q ? `No hay socios que coincidan con "${q}".` : "Todavía no hay socios registrados."}
          </div>
        )}
      </div>

      {resultado && resultado.total > resultado.pageSize && (
        <div className="pagination">
          <button className="btn secondary" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            Anterior
          </button>
          <span>
            Página {page} de {totalPaginas} · {resultado.total} socios
          </span>
          <button className="btn secondary" disabled={page >= totalPaginas} onClick={() => setPage((p) => p + 1)}>
            Siguiente
          </button>
        </div>
      )}
    </div>
  );
}
