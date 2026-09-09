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
    <div>
      <div className="page-head">
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
            <h1>{tab === "socios" ? "Socios y Asociados" : "Prospectos / Fiadores Externos"}</h1>
            {tab === "socios" ? (
              <span className="badge" style={{ background: "#ecfdf5", color: "#065f46", fontWeight: 700 }}>
                Padrón Oficial
              </span>
            ) : (
              <span className="badge" style={{ background: "#fef3c7", color: "#92400e", fontWeight: 700 }}>
                🎯 {fiadores.length} Fiadores sin cuenta (Prospectos de Afiliación)
              </span>
            )}
          </div>
          <p>
            {tab === "socios"
              ? "Padrón oficial de la cooperativa · Mostrando de 10 en 10 en orden correlativo ascendente."
              : "Personas que respaldan créditos fiduciarios pero aún no tienen cuenta. Ideales para que promotores y cajeros los afilien como socios."}
          </p>
        </div>
        <Link to="/socios/nuevo" className="btn">
          + Nuevo socio
        </Link>
      </div>

      {error && (
        <div
          className="alert error"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          <span>{error}</span>
          <button
            type="button"
            className="btn secondary"
            style={{
              padding: "0.25rem 0.65rem",
              fontSize: "0.82rem",
              cursor: "pointer",
              fontWeight: 700,
              background: "#ffffff",
              color: "#dc2626",
              border: "1px solid #fca5a5",
            }}
            onClick={() => setRecargar((v) => v + 1)}
          >
            🔄 Reintentar
          </button>
        </div>
      )}

      {/* Tabs Selector */}
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem", borderBottom: "1px solid var(--border)", paddingBottom: "0.5rem" }}>
        <button
          className={`btn ${tab === "socios" ? "" : "secondary"}`}
          onClick={() => {
            setTab("socios");
            setQ("");
            setPage(1);
          }}
          style={{ fontWeight: tab === "socios" ? 700 : 500 }}
        >
          👥 Socios Registrados
        </button>
        <button
          className={`btn ${tab === "prospectos" ? "" : "secondary"}`}
          onClick={() => {
            setTab("prospectos");
            setQ("");
          }}
          style={{ fontWeight: tab === "prospectos" ? 700 : 500 }}
        >
          🎯 Prospectos / Fiadores Externos
        </button>
      </div>

      <div className="searchbar">
        <input
          placeholder={tab === "socios" ? "Buscar por nombre, DPI o número de asociado…" : "Buscar fiador por nombre, DPI o crédito…"}
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setPage(1);
          }}
        />
      </div>

      {tab === "socios" ? (
        <>
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
        </>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Fiador (Prospecto)</th>
                <th>DPI / Teléfono</th>
                <th>Dirección / Lugar</th>
                <th>Crédito que Respalda</th>
                <th>Socio Titular</th>
                <th>Acción de Afiliación</th>
              </tr>
            </thead>
            <tbody>
              {fiadores.map((f, idx) => (
                <tr key={`${f.prestamo_id}-${idx}`}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{f.nombre_fiador}</div>
                    <span className="badge" style={{ background: "#fef3c7", color: "#92400e", fontSize: "0.72rem" }}>
                      👤 Sin cuenta en cooperativa
                    </span>
                  </td>
                  <td>
                    <div className="mono" style={{ fontSize: "0.85rem" }}>
                      {formatearDPI(f.dpi_fiador || "")}
                    </div>
                    {f.telefono_fiador && (
                      <div style={{ fontSize: "0.78rem", color: "var(--ink-soft)" }}>
                        📞 {f.telefono_fiador}
                      </div>
                    )}
                  </td>
                  <td style={{ fontSize: "0.85rem", color: "var(--ink-soft)" }}>
                    {f.lugar_fiador || "—"}
                  </td>
                  <td>
                    <Link to={`/creditos/${f.prestamo_id}`} style={{ fontWeight: 600 }} className="mono">
                      {f.prestamo_codigo}
                    </Link>
                    <div style={{ fontSize: "0.78rem", color: "var(--ink-soft)" }}>
                      Monto: {formatearQuetzales(f.monto_aprobado || f.monto_solicitado)}
                    </div>
                  </td>
                  <td>
                    <Link to={`/socios/${f.socio_id}`} style={{ fontWeight: 500 }}>
                      {f.socio_nombre}
                    </Link>
                    <div style={{ fontSize: "0.78rem", color: "var(--ink-soft)" }}>
                      Asoc. <span className="mono">{f.socio_numero}</span>
                    </div>
                  </td>
                  <td>
                    <Link
                      to={`/socios/nuevo?nombres=${encodeURIComponent(f.nombre_fiador)}&dpi=${encodeURIComponent(f.dpi_fiador || "")}&telefono=${encodeURIComponent(f.telefono_fiador || "")}&direccion=${encodeURIComponent(f.lugar_fiador || "")}`}
                      className="btn secondary"
                      style={{
                        padding: "0.35rem 0.65rem",
                        fontSize: "0.78rem",
                        background: "#10b981",
                        color: "#fff",
                        borderColor: "#059669",
                      }}
                    >
                      + Afiliar como Socio
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!cargandoFiadores && fiadores.length === 0 && (
            <div className="empty">
              {q ? `No hay fiadores externos que coincidan con "${q}".` : "No hay fiadores externos registrados en créditos fiduciarios."}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

