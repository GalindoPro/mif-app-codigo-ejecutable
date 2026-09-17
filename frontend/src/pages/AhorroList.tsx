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
        </div>

        <div>
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

      {/* STRIP DE KPIS HORIZONTALES CON ESTILO FINTECH */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "0.5rem" }}>
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
            {resumen?.totalCuentas ?? totalCuentas} cuentas activas
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
          <span style={{ fontSize: "0.65rem", color: "var(--ink-soft)" }}>Ingresos acumulados</span>
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
          <span style={{ fontSize: "0.65rem", color: "var(--ink-soft)" }}>Egresos acumulados</span>
        </div>

        {/* PADRÓN DE CUENTAS */}
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
              PADRÓN DE CUENTAS
            </span>
            <span style={{ fontSize: "0.85rem" }}>👥</span>
          </div>
          <span style={{ fontSize: "1.08rem", fontWeight: 700, color: "#6366f1", fontFamily: "monospace" }}>
            {totalCuentas}
          </span>
          <span style={{ fontSize: "0.65rem", color: "var(--ink-soft)" }}>Pág {page} de {totalPaginas}</span>
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

      {/* TABLA CON SCROLL INTERNO Y CABECERA PEGAJOSA */}
      <div className="table-scroll-container">
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
                <td className="mono" style={{ fontWeight: 700, color: "var(--accent)" }}>
                  <Link to={`/ahorros/${config.slug}/${c.id}`} style={{ color: "inherit", textDecoration: "none" }}>
                    {c.numero_cuenta}
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
                  <span className={`badge ${c.estado === "ACTIVA" ? "activo" : "inactivo"}`} style={{ fontSize: "0.72rem", padding: "0.15rem 0.45rem" }}>
                    {c.estado === "ACTIVA" ? "Activa" : "Cerrada"}
                  </span>
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

      {/* FOOTER FIJO CON PAGINACIÓN */}
      <div className="screen-footer">
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
    </div>
  );
}
