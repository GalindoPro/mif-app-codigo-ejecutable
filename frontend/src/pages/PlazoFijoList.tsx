import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, mensajeError } from "../lib/api";
import {
  ESTADO_PLAZO_FIJO_LABEL,
  formatoQ,
} from "../types";
import type { PlazoFijoContrato } from "../types";

export default function PlazoFijoList() {
  const [contratos, setContratos] = useState<PlazoFijoContrato[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [estadoFiltro, setEstadoFiltro] = useState<string>("");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  function cargar() {
    api
      .get<PlazoFijoContrato[]>("/plazo-fijo", {
        params: {
          q: q || undefined,
          estado: estadoFiltro || undefined,
        },
      })
      .then(({ data }) => setContratos(data))
      .catch((err) => setError(mensajeError(err)));
  }

  useEffect(() => {
    setPage(1);
    const timer = setTimeout(cargar, 200);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, estadoFiltro]);

  const activos = contratos?.filter((c) => c.estado === "ACTIVO") ?? [];
  const totalInversionActiva = activos.reduce((sum, c) => sum + Number(c.monto_deposito), 0);
  const totalInteresesComprometidos = activos.reduce((sum, c) => sum + Number(c.interes_neto || c.interes_generado), 0);

  const hoy = new Date().toISOString().slice(0, 10);
  const porVencerOyaVencidos = activos.filter((c) => c.fecha_vencimiento <= hoy).length;

  const totalCertificados = contratos?.length ?? 0;
  const totalPaginas = Math.max(1, Math.ceil(totalCertificados / pageSize));
  const contratosPaginados = contratos?.slice((page - 1) * pageSize, page * pageSize) ?? [];

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Kardex de Ahorro a Plazo Fijo</h1>
          <p>Control de certificados de depósito a plazo fijo, cálculo de intereses, retención de ISR y vencimientos.</p>
        </div>
        <div>
          <Link to="/ahorros/plazo-fijo/nuevo" className="btn">
            + Emitir Certificado
          </Link>
        </div>
      </div>

      {error && <div className="alert error">{error}</div>}

      <div className="stat-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", marginBottom: "1.5rem" }}>
        <div className="stat-card accent">
          <span className="label">Capital a Plazo Fijo</span>
          <span className="value">{formatoQ(totalInversionActiva)}</span>
          <span className="sub">En certificados activos</span>
        </div>
        <div className="stat-card">
          <span className="label">Intereses netos a pagar</span>
          <span className="value" style={{ color: "#d97706" }}>
            {formatoQ(totalInteresesComprometidos)}
          </span>
          <span className="sub">Proyectados al vencimiento</span>
        </div>
        <div className="stat-card">
          <span className="label">Certificados vigentes</span>
          <span className="value mono">{activos.length}</span>
          <span className="sub">Contratos activos</span>
        </div>
        <div className="stat-card">
          <span className="label">Vencidos / Por liquidar</span>
          <span className="value mono" style={{ color: porVencerOyaVencidos > 0 ? "#dc2626" : "inherit" }}>
            {porVencerOyaVencidos}
          </span>
          <span className="sub">Listos para pago o renovación</span>
        </div>
      </div>

      <div style={{ display: "flex", gap: "1rem", marginBottom: "1rem", flexWrap: "wrap" }}>
        <div className="searchbar" style={{ flex: 1, minWidth: 260, marginBottom: 0 }}>
          <input
            placeholder="Buscar por socio, DPI, No. Certificado o cuenta…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <div style={{ minWidth: 200 }}>
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
            <option value="ACTIVO">Vigente / Activo</option>
            <option value="LIQUIDADO">Liquidado / Pagado</option>
          </select>
        </div>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Certificado</th>
              <th>No. Cuenta</th>
              <th>Socio inversionista</th>
              <th>Depósito Capital</th>
              <th>Plazo</th>
              <th>Tasa Anual</th>
              <th>Vencimiento</th>
              <th>Interés Neto</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {contratosPaginados.map((c) => {
              const estaVencido = c.estado === "ACTIVO" && c.fecha_vencimiento <= hoy;
              return (
                <tr key={c.id}>
                  <td className="mono">
                    <Link
                      to={`/ahorros/plazo-fijo/${c.id}`}
                      style={{
                        display: "inline-block",
                        padding: "0.2rem 0.5rem",
                        background: "var(--paper-raised)",
                        borderRadius: "6px",
                        fontWeight: 700,
                        textDecoration: "none",
                        color: "var(--accent)",
                      }}
                    >
                      Cert. #{c.numero_certificacion ?? "—"}
                    </Link>
                  </td>
                  <td className="mono">{c.numero_cuenta}</td>
                  <td>
                    <strong>{c.socio_nombres}</strong>
                    {c.socio_dpi && <div style={{ fontSize: "0.78rem", color: "var(--ink-soft)" }}>DPI: {c.socio_dpi}</div>}
                  </td>
                  <td className="mono" style={{ fontWeight: 700 }}>{formatoQ(c.monto_deposito)}</td>
                  <td className="mono">{c.plazo_meses} meses</td>
                  <td className="mono">{c.tasa_anual}%</td>
                  <td className="mono">
                    <span
                      style={{
                        fontWeight: estaVencido ? 700 : 500,
                        color: estaVencido ? "#dc2626" : "inherit",
                      }}
                    >
                      {new Date(c.fecha_vencimiento).toLocaleDateString("es-GT")}
                      {estaVencido && " (Vencido)"}
                    </span>
                  </td>
                  <td className="mono" style={{ color: "#d97706" }}>
                    {formatoQ(c.interes_neto)}
                  </td>
                  <td>
                    <span
                      style={{
                        display: "inline-block",
                        padding: "0.2rem 0.55rem",
                        borderRadius: "6px",
                        fontSize: "0.8rem",
                        fontWeight: 600,
                        background: c.estado === "ACTIVO" ? (estaVencido ? "#fef2f2" : "#ecfdf5") : "#f1f5f9",
                        color: c.estado === "ACTIVO" ? (estaVencido ? "#b91c1c" : "#065f46") : "#475569",
                      }}
                    >
                      {ESTADO_PLAZO_FIJO_LABEL[c.estado]}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {contratos && contratos.length === 0 && (
          <div className="empty">No se encontraron certificados de ahorro a plazo fijo.</div>
        )}
      </div>

      {totalCertificados > pageSize && (
        <div className="pagination" style={{ display: "flex", gap: "1rem", alignItems: "center", justifyContent: "center", marginTop: "1rem" }}>
          <button className="btn secondary" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            Anterior
          </button>
          <span>
            Mostrando {contratosPaginados.length} de {totalCertificados} certificados · Página {page} de {totalPaginas}
          </span>
          <button className="btn secondary" disabled={page >= totalPaginas} onClick={() => setPage((p) => p + 1)}>
            Siguiente
          </button>
        </div>
      )}
    </div>
  );
}
