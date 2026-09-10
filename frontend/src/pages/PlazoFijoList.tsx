import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, mensajeError } from "../lib/api";
import {
  ESTADO_PLAZO_FIJO_LABEL,
} from "../types";
import type { PlazoFijoContrato } from "../types";
import { formatearDPI, formatearQuetzales } from "../lib/formatters";

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
            <span>📦</span> Ahorro a Plazo Fijo
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
            Certificados de Depósito
          </span>
        </div>

        <div>
          <Link
            to="/ahorros/plazo-fijo/nuevo"
            className="btn"
            style={{ padding: "0.3rem 0.75rem", fontSize: "0.8rem", textDecoration: "none" }}
          >
            + Emitir Certificado
          </Link>
        </div>
      </div>

      {error && (
        <div className="alert error" style={{ margin: "0.25rem 0", padding: "0.4rem 0.75rem", fontSize: "0.82rem" }}>
          {error}
        </div>
      )}

      {/* STRIP DE KPIS HORIZONTALES */}
      <div className="screen-kpis" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
        <div className="screen-kpi-tile accent">
          <span className="screen-kpi-label">CAPITAL A PLAZO FIJO</span>
          <span className="screen-kpi-value">{formatearQuetzales(totalInversionActiva)}</span>
          <span className="screen-kpi-sub">En certificados activos</span>
        </div>
        <div className="screen-kpi-tile">
          <span className="screen-kpi-label">INTERESES NETOS POR PAGAR</span>
          <span className="screen-kpi-value" style={{ color: "#d97706" }}>
            {formatearQuetzales(totalInteresesComprometidos)}
          </span>
          <span className="screen-kpi-sub">Proyectados al vencimiento</span>
        </div>
        <div className="screen-kpi-tile">
          <span className="screen-kpi-label">CERTIFICADOS VIGENTES</span>
          <span className="screen-kpi-value">{activos.length}</span>
          <span className="screen-kpi-sub">Contratos activos</span>
        </div>
        <div className="screen-kpi-tile">
          <span className="screen-kpi-label">VENCIDOS / POR LIQUIDAR</span>
          <span className="screen-kpi-value" style={{ color: porVencerOyaVencidos > 0 ? "#ef4444" : "var(--ink)" }}>
            {porVencerOyaVencidos}
          </span>
          <span className="screen-kpi-sub">Listos para pago o renovación</span>
        </div>
      </div>

      {/* BARRA DE FILTROS COMPACTA */}
      <div className="screen-toolbar">
        <div style={{ position: "relative", flex: 1, maxWidth: 440 }}>
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
            placeholder="Buscar por socio, DPI, No. Certificado o cuenta..."
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

        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <select
            value={estadoFiltro}
            onChange={(e) => setEstadoFiltro(e.target.value)}
            style={{
              padding: "0.35rem 0.65rem",
              borderRadius: "6px",
              border: "1px solid var(--line)",
              background: "var(--paper)",
              color: "var(--ink)",
              fontSize: "0.8rem",
            }}
          >
            <option value="">Todos los estados</option>
            <option value="ACTIVO">Vigente / Activo</option>
            <option value="LIQUIDADO">Liquidado / Pagado</option>
          </select>
        </div>
      </div>

      {/* TABLA CON SCROLL INTERNO Y CABECERA PEGAJOSA */}
      <div className="table-scroll-container">
        <table className="table-compact">
          <thead>
            <tr>
              <th style={{ minWidth: 120 }}>CERTIFICADO</th>
              <th style={{ minWidth: 120 }}>NO. CUENTA</th>
              <th style={{ minWidth: 200 }}>SOCIO INVERSIONISTA</th>
              <th style={{ minWidth: 130, textAlign: "right" }}>DEPÓSITO CAPITAL</th>
              <th style={{ minWidth: 100 }}>PLAZO / TASA</th>
              <th style={{ minWidth: 120 }}>VENCIMIENTO</th>
              <th style={{ minWidth: 120, textAlign: "right" }}>INTERÉS NETO</th>
              <th style={{ minWidth: 90, textAlign: "center" }}>ESTADO</th>
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
                        padding: "0.15rem 0.45rem",
                        background: "var(--mono-bg)",
                        borderRadius: "4px",
                        fontWeight: 700,
                        textDecoration: "none",
                        color: "var(--accent)",
                        border: "1px solid var(--line)",
                        fontSize: "0.78rem",
                      }}
                    >
                      Cert. #{c.numero_certificacion ?? "—"}
                    </Link>
                  </td>
                  <td className="mono" style={{ fontSize: "0.8rem" }}>{c.numero_cuenta}</td>
                  <td>
                    <Link
                      to={`/ahorros/plazo-fijo/${c.id}`}
                      style={{ color: "inherit", textDecoration: "none", fontWeight: 600 }}
                    >
                      {c.socio_nombres}
                    </Link>
                    {c.socio_dpi && (
                      <div style={{ fontSize: "0.72rem", color: "var(--ink-soft)" }}>
                        DPI: {formatearDPI(c.socio_dpi)}
                      </div>
                    )}
                  </td>
                  <td className="mono" style={{ fontWeight: 700, color: "var(--accent)", textAlign: "right" }}>
                    {formatearQuetzales(c.monto_deposito)}
                  </td>
                  <td className="mono" style={{ fontSize: "0.8rem" }}>
                    {c.plazo_meses}m · {c.tasa_anual}%
                  </td>
                  <td className="mono" style={{ fontSize: "0.8rem" }}>
                    <span
                      style={{
                        fontWeight: estaVencido ? 700 : 500,
                        color: estaVencido ? "#ef4444" : "inherit",
                      }}
                    >
                      {formatearFechaCorta(c.fecha_vencimiento)}
                      {estaVencido && " (Vencido)"}
                    </span>
                  </td>
                  <td className="mono" style={{ color: "#d97706", fontWeight: 600, textAlign: "right" }}>
                    {formatearQuetzales(c.interes_neto)}
                  </td>
                  <td style={{ textAlign: "center" }}>
                    <span
                      className={`badge ${c.estado === "ACTIVO" ? (estaVencido ? "danger" : "activo") : "inactivo"}`}
                      style={{ fontSize: "0.72rem", padding: "0.15rem 0.45rem" }}
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
          <div className="empty" style={{ padding: "2rem", textAlign: "center", color: "var(--ink-soft)" }}>
            No se encontraron certificados de ahorro a plazo fijo.
          </div>
        )}
      </div>

      {/* FOOTER FIJO CON PAGINACIÓN */}
      <div className="screen-footer">
        <span style={{ fontSize: "0.8rem", color: "var(--ink-soft)" }}>
          Mostrando {contratosPaginados.length} de {totalCertificados} certificados · Pág. {page} de {totalPaginas}
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
