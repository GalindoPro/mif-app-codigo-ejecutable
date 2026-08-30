import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api, mensajeError } from "../lib/api";
import { formatoQ, TIPOS_AHORRO } from "../types";
import type { Cuenta, ResumenCuentas } from "../types";

export default function AhorroList() {
  const { slug } = useParams<{ slug: string }>();
  const config = TIPOS_AHORRO.find((t) => t.slug === slug);

  const [q, setQ] = useState("");
  const [cuentas, setCuentas] = useState<Cuenta[] | null>(null);
  const [resumen, setResumen] = useState<ResumenCuentas | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    if (!config) return;
    setCuentas(null);
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

  if (!config) return <div className="alert error">Tipo de ahorro no reconocido.</div>;

  const saldoTotal = resumen?.saldoTotal ?? cuentas?.reduce((acc, c) => acc + Number(c.saldo_actual), 0) ?? 0;
  const totalCuentas = cuentas?.length ?? 0;
  const totalPaginas = Math.max(1, Math.ceil(totalCuentas / pageSize));
  const cuentasPaginadas = cuentas?.slice((page - 1) * pageSize, page * pageSize) ?? [];

  return (
    <div>
      <div className="page-head">
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
            <h1>{config.titulo}</h1>
            <span className="badge" style={{ background: "#ecfdf5", color: "#065f46", fontWeight: 700 }}>
              10 por página
            </span>
          </div>
          <p>{config.descripcion}</p>
        </div>
        <Link to={`/ahorros/${config.slug}/nueva`} className="btn">
          + Nueva cuenta
        </Link>
      </div>

      {error && <div className="alert error">{error}</div>}

      <div className="stat-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(180px, 220px))" }}>
        <div className="stat-card accent">
          <span className="label">Saldo total</span>
          <span className="value">{formatoQ(saldoTotal)}</span>
          <span className="sub">{resumen?.totalCuentas ?? cuentas?.length ?? 0} cuenta(s)</span>
        </div>
        <div className="stat-card">
          <span className="label">Total depósitos</span>
          <span className="value">{formatoQ(resumen?.totalDepositos ?? 0)}</span>
        </div>
        <div className="stat-card">
          <span className="label">Total retiros</span>
          <span className="value">{formatoQ(resumen?.totalRetiros ?? 0)}</span>
        </div>
      </div>

      <div className="searchbar">
        <input
          placeholder="Buscar por socio o número de cuenta…"
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
              <th>Cuenta</th>
              <th>Socio</th>
              <th>Saldo actual</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {cuentasPaginadas.map((c) => (
              <tr key={c.id}>
                <td className="mono">
                  <Link to={`/ahorros/${config.slug}/${c.id}`}>{c.numero_cuenta}</Link>
                </td>
                <td>
                  <Link to={`/ahorros/${config.slug}/${c.id}`} style={{ color: "inherit", textDecoration: "none", fontWeight: 500 }}>
                    {c.socio_nombres}
                  </Link>
                </td>
                <td className="mono">{formatoQ(c.saldo_actual)}</td>
                <td>
                  <span className={`badge ${c.estado === "ACTIVA" ? "activo" : "inactivo"}`}>
                    {c.estado === "ACTIVA" ? "Activa" : "Cerrada"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {cuentas && cuentas.length === 0 && (
          <div className="empty">
            {q ? `No hay cuentas que coincidan con "${q}".` : "Todavía no hay cuentas de este tipo."}
          </div>
        )}
      </div>

      {totalCuentas > pageSize && (
        <div className="pagination">
          <button className="btn secondary" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            Anterior
          </button>
          <span>
            Mostrando {cuentasPaginadas.length} de {totalCuentas} cuentas · Página {page} de {totalPaginas}
          </span>
          <button className="btn secondary" disabled={page >= totalPaginas} onClick={() => setPage((p) => p + 1)}>
            Siguiente
          </button>
        </div>
      )}
    </div>
  );
}
