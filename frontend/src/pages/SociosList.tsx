import axios from "axios";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, mensajeError } from "../lib/api";
import type { ListaSocios, FiadorItem } from "../types";
import { formatearDPI, formatearQuetzales } from "../lib/formatters";

export default function SociosList() {
  const [tab, setTab] = useState<"socios" | "prospectos">("socios");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [resultado, setResultado] = useState<ListaSocios | null>(null);
  const [fiadores, setFiadores] = useState<FiadorItem[]>([]);
  const [cargandoFiadores, setCargandoFiadores] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(true);

  const [recargar, setRecargar] = useState(0);

  // Cargar lista de socios
  useEffect(() => {
    if (tab !== "socios") return;
    const controller = new AbortController();
    setCargando(true);
    setError(null);
    const timeout = setTimeout(() => {
      api
        .get<ListaSocios>("/socios", {
          params: { q: q || undefined, page, pageSize: 10 },
          signal: controller.signal,
        })
        .then(({ data }) => {
          setResultado(data);
          setError(null);
        })
        .catch((err) => {
          if (!axios.isCancel(err) && err?.name !== "CanceledError" && (err as { code?: string })?.code !== "ERR_CANCELED") {
            const msg = mensajeError(err);
            if (msg) setError(msg);
          }
        })
        .finally(() => setCargando(false));
    }, 250);
    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [q, page, tab, recargar]);

  // Cargar lista de fiadores / prospectos
  useEffect(() => {
    if (tab !== "prospectos") return;
    setCargandoFiadores(true);
    setError(null);
    api
      .get<FiadorItem[]>("/prestamos/fiadores", {
        params: { q: q || undefined, tipoFiltro: "EXTERNOS" },
      })
      .then(({ data }) => {
        setFiadores(data);
        setError(null);
      })
      .catch((err) => setError(mensajeError(err)))
      .finally(() => setCargandoFiadores(false));
  }, [q, tab, recargar]);

  const totalPaginas = resultado ? Math.max(1, Math.ceil(resultado.total / resultado.pageSize)) : 1;

  return (
    <div className="screen-container">
      {/* CABECERA COMPACTA DE 1 LÍNEA CON TABS INTEGRADAS */}
      <div className="screen-header">
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
          <h1 style={{ display: "flex", alignItems: "center", gap: "0.4rem", margin: 0, fontSize: "1.2rem" }}>
            <span>👥</span> Socios y Asociados
          </h1>
          <div style={{ display: "flex", gap: "0.25rem", background: "var(--paper-raised)", padding: "0.18rem", borderRadius: "8px", border: "1px solid var(--line)" }}>
            <button
              type="button"
              onClick={() => {
                setTab("socios");
                setQ("");
                setPage(1);
              }}
              style={{
                padding: "0.22rem 0.65rem",
                borderRadius: "6px",
                border: "none",
                fontSize: "0.8rem",
                fontWeight: 700,
                cursor: "pointer",
                background: tab === "socios" ? "var(--primary, #0284c7)" : "transparent",
                color: tab === "socios" ? "#fff" : "var(--ink-soft)",
                display: "flex",
                alignItems: "center",
                gap: "0.35rem",
              }}
            >
              <span>Padrón</span>
              <span style={{ fontSize: "0.72rem", opacity: 0.9 }}>({resultado?.total ?? "—"})</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setTab("prospectos");
                setQ("");
              }}
              style={{
                padding: "0.22rem 0.65rem",
                borderRadius: "6px",
                border: "none",
                fontSize: "0.8rem",
                fontWeight: 700,
                cursor: "pointer",
                background: tab === "prospectos" ? "#d97706" : "transparent",
                color: tab === "prospectos" ? "#fff" : "var(--ink-soft)",
                display: "flex",
                alignItems: "center",
                gap: "0.35rem",
              }}
            >
              <span>🎯 Prospectos</span>
              <span style={{ fontSize: "0.72rem", opacity: 0.9 }}>({fiadores.length})</span>
            </button>
          </div>
        </div>

        <Link to="/socios/nuevo" className="btn" style={{ fontSize: "0.78rem", padding: "0.3rem 0.75rem", fontWeight: 700 }}>
          + Nuevo socio
        </Link>
      </div>

      {error && (
        <div
          className="alert error"
          style={{
            padding: "0.35rem 0.75rem",
            fontSize: "0.82rem",
            margin: 0,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span>{error}</span>
          <button
            type="button"
            className="btn secondary"
            style={{
              padding: "0.15rem 0.5rem",
              fontSize: "0.75rem",
              fontWeight: 700,
            }}
            onClick={() => setRecargar((v) => v + 1)}
          >
            🔄 Reintentar
          </button>
        </div>
      )}

      {/* FRANJA DE KPIS COMPACTA (1 FILA) */}
      <div className="screen-kpis" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
        <div
          className="stat-card accent"
          style={{ padding: "0.35rem 0.65rem", cursor: "pointer" }}
          onClick={() => {
            setTab("socios");
            setQ("");
          }}
        >
          <span className="label" style={{ fontSize: "0.64rem", display: "block" }}>Total Asociados</span>
          <span className="value mono" style={{ fontSize: "1.05rem" }}>{resultado?.total ?? "—"}</span>
        </div>

        <div
          className="stat-card"
          style={{ padding: "0.35rem 0.65rem", cursor: "pointer", border: tab === "prospectos" ? "1.5px solid #d97706" : undefined }}
          onClick={() => {
            setTab("prospectos");
            setQ("");
          }}
        >
          <span className="label" style={{ fontSize: "0.64rem", color: "#d97706", fontWeight: 700, display: "block" }}>
            🎯 Prospectos / Fiadores
          </span>
          <span className="value mono" style={{ fontSize: "1.05rem", color: "#d97706" }}>{fiadores.length}</span>
        </div>

        <div className="stat-card" style={{ padding: "0.35rem 0.65rem" }}>
          <span className="label" style={{ fontSize: "0.64rem", display: "block" }}>Bloque de Padrón</span>
          <span className="value mono" style={{ fontSize: "1.05rem" }}>Pág {page} de {totalPaginas}</span>
        </div>
      </div>

      {/* BARRA DE BÚSQUEDA COMPACTA */}
      <div className="screen-toolbar">
        <div style={{ flex: 1, minWidth: 260 }}>
          <input
            placeholder={tab === "socios" ? "🔍 Buscar por nombre, DPI o número de asociado…" : "🔍 Buscar fiador por nombre, DPI o crédito…"}
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(1);
            }}
            style={{ width: "100%", padding: "0.32rem 0.65rem", fontSize: "0.82rem", borderRadius: "6px", border: "1px solid var(--line)", background: "var(--paper-raised)", color: "var(--ink)" }}
          />
        </div>
      </div>

      {/* TABLA DE PADRÓN CON SCROLL INTERNO Y CABECERA STICKY */}
      {tab === "socios" ? (
        <>
          <div className="table-scroll-container">
            <table className="table-compact" style={{ width: "100%" }}>
              <thead>
                <tr>
                  <th style={{ width: "14%" }}>No. asociado</th>
                  <th style={{ width: "32%" }}>Nombre y Contacto</th>
                  <th style={{ width: "18%" }}>Agencia</th>
                  <th style={{ width: "14%" }}>Fecha Ingreso</th>
                  <th style={{ width: "10%", textAlign: "center" }}>Cuentas</th>
                  <th style={{ width: "12%", textAlign: "center" }}>Estado</th>
                </tr>
              </thead>
              <tbody>
                {resultado?.data.map((s) => (
                  <tr key={s.id}>
                    <td className="mono" style={{ fontWeight: 700 }}>
                      <Link to={`/socios/${s.id}`}>{s.numero_asociado}</Link>
                    </td>
                    <td>
                      <Link to={`/socios/${s.id}`} style={{ fontWeight: 600, color: "inherit", textDecoration: "none" }}>
                        {s.nombres}
                      </Link>
                      {(s.dpi || s.telefono) && (
                        <div style={{ fontSize: "0.72rem", color: "var(--ink-soft)", marginTop: "0.1rem" }}>
                          {s.dpi && <span>DPI: <span className="mono">{formatearDPI(s.dpi)}</span></span>}
                          {s.dpi && s.telefono && <span> · </span>}
                          {s.telefono && <span>Tel: <span className="mono">{s.telefono}</span></span>}
                        </div>
                      )}
                    </td>
                    <td style={{ fontSize: "0.8rem" }}>{s.agencia_nombre}</td>
                    <td className="mono" style={{ fontSize: "0.78rem" }}>{new Date(s.fecha_ingreso).toLocaleDateString("es-GT")}</td>
                    <td className="mono" style={{ textAlign: "center", fontWeight: 700 }}>{s.total_cuentas ?? 0}</td>
                    <td style={{ textAlign: "center" }}>
                      <span className={`badge ${s.estado === "ACTIVO" ? "activo" : "inactivo"}`} style={{ fontSize: "0.7rem", padding: "0.12rem 0.4rem" }}>
                        {s.estado === "ACTIVO" ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!cargando && resultado?.data.length === 0 && (
              <div className="empty" style={{ padding: "1.5rem" }}>
                {q ? `No hay socios que coincidan con "${q}".` : "Todavía no hay socios registrados."}
              </div>
            )}
          </div>

          {/* PAGINACIÓN FIJA EN PIE */}
          {resultado && resultado.total > resultado.pageSize && (
            <div className="screen-footer">
              <span style={{ color: "var(--ink-soft)" }}>
                Mostrando {resultado.data.length} de {resultado.total} socios · Pág. {page} de {totalPaginas}
              </span>
              <div style={{ display: "flex", gap: "0.4rem" }}>
                <button
                  className="btn secondary"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                  style={{ fontSize: "0.75rem", padding: "0.22rem 0.6rem" }}
                >
                  ← Anterior
                </button>
                <button
                  className="btn secondary"
                  disabled={page >= totalPaginas}
                  onClick={() => setPage((p) => p + 1)}
                  style={{ fontSize: "0.75rem", padding: "0.22rem 0.6rem" }}
                >
                  Siguiente →
                </button>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="table-scroll-container">
          <table className="table-compact" style={{ width: "100%" }}>
            <thead>
              <tr>
                <th>Fiador (Prospecto)</th>
                <th>DPI / Teléfono</th>
                <th>Dirección / Lugar</th>
                <th>Crédito que Respalda</th>
                <th>Socio Titular</th>
                <th style={{ textAlign: "center" }}>Acción</th>
              </tr>
            </thead>
            <tbody>
              {fiadores.map((f, idx) => (
                <tr key={`${f.prestamo_id}-${idx}`}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{f.nombre_fiador}</div>
                    <span className="badge" style={{ background: "#fef3c7", color: "#92400e", fontSize: "0.68rem", padding: "0.1rem 0.35rem" }}>
                      👤 Prospecto
                    </span>
                  </td>
                  <td>
                    <div className="mono" style={{ fontSize: "0.8rem" }}>
                      {formatearDPI(f.dpi_fiador || "")}
                    </div>
                    {f.telefono_fiador && (
                      <div style={{ fontSize: "0.72rem", color: "var(--ink-soft)" }}>
                        📞 {f.telefono_fiador}
                      </div>
                    )}
                  </td>
                  <td style={{ fontSize: "0.78rem", color: "var(--ink-soft)" }}>
                    {f.lugar_fiador || "—"}
                  </td>
                  <td>
                    <Link to={`/creditos/${f.prestamo_id}`} style={{ fontWeight: 600, fontSize: "0.8rem" }} className="mono">
                      {f.prestamo_codigo}
                    </Link>
                    <div style={{ fontSize: "0.72rem", color: "var(--ink-soft)" }}>
                      {formatearQuetzales(f.monto_aprobado || f.monto_solicitado)}
                    </div>
                  </td>
                  <td>
                    <Link to={`/socios/${f.socio_id}`} style={{ fontWeight: 500, fontSize: "0.8rem" }}>
                      {f.socio_nombre}
                    </Link>
                    <div style={{ fontSize: "0.72rem", color: "var(--ink-soft)" }}>
                      Asoc. <span className="mono">{f.socio_numero}</span>
                    </div>
                  </td>
                  <td style={{ textAlign: "center" }}>
                    <Link
                      to={`/socios/nuevo?nombres=${encodeURIComponent(f.nombre_fiador)}&dpi=${encodeURIComponent(f.dpi_fiador || "")}&telefono=${encodeURIComponent(f.telefono_fiador || "")}&direccion=${encodeURIComponent(f.lugar_fiador || "")}`}
                      className="btn secondary"
                      style={{
                        padding: "0.2rem 0.5rem",
                        fontSize: "0.72rem",
                        background: "#10b981",
                        color: "#fff",
                        borderColor: "#059669",
                        textDecoration: "none",
                        fontWeight: 700,
                      }}
                    >
                      + Afiliar
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!cargandoFiadores && fiadores.length === 0 && (
            <div className="empty" style={{ padding: "1.5rem" }}>
              {q ? `No hay fiadores externos que coincidan con "${q}".` : "No hay fiadores externos registrados en créditos fiduciarios."}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
