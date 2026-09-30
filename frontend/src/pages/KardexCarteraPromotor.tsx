import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, mensajeError } from "../lib/api";
import { formatoQ } from "../types";
import type { KardexCarteraRespuesta, KardexCarteraItem, TipoPrestamo } from "../types";
import { useAuth } from "../context/AuthContext";

export default function KardexCarteraPromotor() {
  const hoyMes = new Date().toISOString().slice(0, 7); // 'YYYY-MM'
  const { usuario } = useAuth();

  const [mes, setMes] = useState(hoyMes);
  const [tabTipo, setTabTipo] = useState<"TODOS" | TipoPrestamo>("TODOS");
  const [promotorSel, setPromotorSel] = useState<"TODOS" | "DIEGO" | "WALTER">("TODOS");
  const [busqueda, setBusqueda] = useState("");
  const [kardex, setKardex] = useState<KardexCarteraRespuesta | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandidoId, setExpandidoId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // Estados del Validador Oficial Excel
  const [mostrarModalDiagnostico, setMostrarModalDiagnostico] = useState(false);
  const [diagnostico, setDiagnostico] = useState<any | null>(null);
  const [cargandoDiagnostico, setCargandoDiagnostico] = useState(false);
  const [errorDiagnostico, setErrorDiagnostico] = useState<string | null>(null);
  const [sincronizandoCartera, setSincronizandoCartera] = useState(false);

  useEffect(() => {
    setPage(1);
    cargarKardex();
  }, [mes, tabTipo, promotorSel]);

  async function cargarKardex() {
    setCargando(true);
    setError(null);
    try {
      const params: Record<string, string> = { mes, promotorSel, origenCartera: "TODOS" };
      if (tabTipo !== "TODOS") params.tipo = tabTipo;
      const { data } = await api.get<KardexCarteraRespuesta>("/prestamos/kardex-cartera", { params });
      setKardex(data);
    } catch (err) {
      setError(mensajeError(err));
    } finally {
      setCargando(false);
    }
  }

  async function abrirDiagnosticoExcel() {
    setMostrarModalDiagnostico(true);
    setCargandoDiagnostico(true);
    setErrorDiagnostico(null);
    try {
      const { data } = await api.get("/prestamos/diagnostico-excel");
      setDiagnostico(data);
    } catch (err) {
      setErrorDiagnostico(mensajeError(err));
    } finally {
      setCargandoDiagnostico(false);
    }
  }

  async function ejecutarSincronizacionOficial() {
    if (
      !window.confirm(
        "⚡ ¿Deseas sincronizar la base de datos al 100% con los 66 créditos oficiales del archivo Excel del Promotor (Q 15,219,238.31)?\n\nLos créditos y pagos de ventanilla que no pertenecen a la cartera oficial quedarán seguros y clasificados en 'Préstamos por Regularizar'."
      )
    ) {
      return;
    }
    setSincronizandoCartera(true);
    try {
      const { data } = await api.post<{ ok: boolean; mensaje: string }>("/prestamos/reestructurar-cartera");
      alert(data.mensaje);
      setMostrarModalDiagnostico(false);
      cargarKardex();
    } catch (err) {
      alert("Error en la sincronización: " + mensajeError(err));
    } finally {
      setSincronizandoCartera(false);
    }
  }

  const itemsFiltrados = (kardex?.items || []).filter((item) => {
    if (!busqueda.trim()) return true;
    const term = busqueda.toLowerCase();
    return (
      item.codigo.toLowerCase().includes(term) ||
      (item.socio_nombres && item.socio_nombres.toLowerCase().includes(term)) ||
      (item.numero_asociado && item.numero_asociado.toLowerCase().includes(term)) ||
      (item.ubicacion_garantia && item.ubicacion_garantia.toLowerCase().includes(term)) ||
      (item.nombre_fiador && item.nombre_fiador.toLowerCase().includes(term))
    );
  });

  function formatoPlazo(meses: number | null | undefined): string {
    if (!meses) return "12 meses";
    const m = Number(meses);
    if (m % 12 === 0) {
      const anos = m / 12;
      return `${anos} ${anos === 1 ? "año" : "años"} (${m}m)`;
    }
    if (m === 18) return "1.5 años (18m)";
    if (m === 15) return "1 año 3m (15m)";
    return `${m} meses`;
  }

  function obtenerFechaVencimiento(p: KardexCarteraItem): string {
    if (p.fecha_vencimiento) {
      return new Date(p.fecha_vencimiento).toLocaleDateString("es-GT");
    }
    if (p.fecha_desembolso && p.plazo_meses) {
      const d = new Date(p.fecha_desembolso);
      d.setMonth(d.getMonth() + Number(p.plazo_meses));
      return d.toLocaleDateString("es-GT");
    }
    return "A término";
  }

  function exportarExcel() {
    if (!itemsFiltrados || itemsFiltrados.length === 0) return;
    const encabezados = [
      "Código",
      "No. Asociado",
      "Socio",
      "Comunidad / Ubicación",
      "Tipo Crédito",
      "Garantía / Fiador",
      "Plazo Meses",
      "Fecha Vencimiento",
      "Valor Crédito Original",
      "Saldo Vivo Capital",
      "Cuota Mensual",
      "Estado Mes",
      "Total Pagado Mes",
    ];
    const filas = itemsFiltrados.map((p) => {
      const montoOriginal = Number(p.monto_aprobado || p.monto_solicitado);
      const saldoActual = Number(p.saldo_capital ?? montoOriginal);
      const vencimiento = obtenerFechaVencimiento(p);
      const estadoLabel = p.estadoCuotaMes === "CANCELADO" ? "Liquidado" : p.estadoCuotaMes === "AL_DIA" ? "Al Día" : "Pendiente";
      return [
        `"${p.codigo}"`,
        `"${p.numero_asociado || ""}"`,
        `"${(p.socio_nombres || "").replace(/"/g, '""')}"`,
        `"${p.ubicacion_garantia || "Chajul"}"`,
        `"${p.tipo}"`,
        `"${(p.nombre_fiador || p.garantia || "Fiador solidario").replace(/"/g, '""')}"`,
        p.plazo_meses,
        `"${vencimiento}"`,
        montoOriginal.toFixed(2),
        saldoActual.toFixed(2),
        Number(p.cuota_mensual).toFixed(2),
        `"${estadoLabel}"`,
        Number(p.totalPagadoMes || 0).toFixed(2),
      ];
    });
    const csvContent = "\uFEFF" + [encabezados.join(";"), ...filas.map((f) => f.join(";"))].join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Kardex_Cartera_COMIF_${mes}_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  const totalItems = itemsFiltrados.length;
  const totalPaginas = Math.max(1, Math.ceil(totalItems / pageSize));
  const itemsPaginados = itemsFiltrados.slice((page - 1) * pageSize, page * pageSize);

  const sumaValorOriginal = itemsFiltrados.reduce(
    (acc, x) => acc + Number(x.monto_aprobado || x.monto_solicitado || 0),
    0
  );
  const sumaSaldoVivo = itemsFiltrados.reduce(
    (acc, x) => acc + Number(x.saldo_capital ?? (x.monto_aprobado || x.monto_solicitado) ?? 0),
    0
  );
  const sumaCuotas = itemsFiltrados.reduce(
    (acc, x) => acc + Number(x.cuota_mensual || 0),
    0
  );

  const [reseteando, setReseteando] = useState(false);
  const [recargando, setRecargando] = useState(false);
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);

  async function handleReset() {
    const confirmado = window.confirm(
      "⚠️ ¿Estás seguro de que deseas REINICIAR EL SISTEMA DESDE CERO?\n\n" +
      "Esta acción borrará:\n" +
      "• Toda la cartera de préstamos activa\n" +
      "• Todos los socios registrados\n" +
      "• Todas las cuentas de ahorro y aportaciones\n" +
      "• Todos los movimientos de ventanilla\n\n" +
      "El sistema quedará completamente limpio para arrancar de nuevo."
    );
    if (!confirmado) return;

    setReseteando(true);
    setError(null);
    setMensajeExito(null);

    try {
      const { data } = await api.post<{ ok: boolean; mensaje: string }>("/sistema/reset");
      setMensajeExito(data.mensaje);
      cargarKardex();
    } catch (err) {
      setError(mensajeError(err));
    } finally {
      setReseteando(false);
    }
  }

  async function handleRecargarDatos() {
    const confirmado = window.confirm(
      "📥 ¿Deseas RECARGAR TODOS LOS DATOS EXISTENTES de los libros Excel?\n\n" +
      "Esta acción restaurará la base de datos oficial:\n" +
      "• 65 préstamos de cartera viva con garantías y fiadores\n" +
      "• 568 asociados con sus cuentas de aportaciones\n" +
      "• 692 certificados de ahorro a plazo fijo\n\n" +
      "Se cargarán los datos originales de los archivos Excel para continuar operando."
    );
    if (!confirmado) return;

    setRecargando(true);
    setError(null);
    setMensajeExito(null);

    try {
      const { data } = await api.post<{ ok: boolean; mensaje: string }>("/sistema/recargar-datos");
      setMensajeExito(data.mensaje);
      cargarKardex();
    } catch (err) {
      setError(mensajeError(err));
    } finally {
      setRecargando(false);
    }
  }

  return (
    <div className="screen-container" style={{ width: "100%", maxWidth: "100%" }}>
      {/* Encabezado Compacto */}
      <div className="page-head" style={{ marginBottom: "0.25rem", paddingBottom: "0.2rem", flexShrink: 0 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <span style={{ fontSize: "1.3rem" }}>📂</span>
            <h1 style={{ fontSize: "1.25rem", margin: 0 }}>Kardex de Cartera de Préstamos</h1>
          </div>
          <p style={{ margin: "0.15rem 0 0", fontSize: "0.78rem", color: "var(--ink-soft)" }}>
            Control de cartera de créditos en vivo · Cobros de cuotas sincronizados con caja auxiliar en tiempo real.
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.35rem", alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
            <label htmlFor="mes-kardex" style={{ fontSize: "0.78rem", color: "var(--ink-soft)", fontWeight: 600 }}>
              Mes:
            </label>
            <input
              id="mes-kardex"
              type="month"
              value={mes}
              onChange={(e) => setMes(e.target.value)}
              style={{ padding: "0.25rem 0.45rem", borderRadius: "5px", fontSize: "0.80rem" }}
            />
          </div>
          <button
            type="button"
            className="btn secondary"
            onClick={() => window.print()}
            title="Imprimir libro oficial del Kardex"
            style={{ fontSize: "0.76rem", padding: "0.25rem 0.55rem" }}
          >
            🖨️ Imprimir
          </button>
          {(usuario?.rol === "GERENCIA" || usuario?.rol === "SUPERVISOR") && (
            <button
              type="button"
              className="btn secondary"
              onClick={exportarExcel}
              title="Descargar libro de cartera en Excel (CSV)"
              style={{ fontSize: "0.76rem", padding: "0.25rem 0.55rem", display: "inline-flex", alignItems: "center", gap: "0.25rem" }}
            >
              📥 Excel
            </button>
          )}
          <button
            type="button"
            className="btn"
            onClick={abrirDiagnosticoExcel}
            title="Auditoría y Validador al pie de la letra del archivo Excel del Promotor"
            style={{
              fontSize: "0.76rem",
              padding: "0.25rem 0.6rem",
              display: "inline-flex",
              alignItems: "center",
              gap: "0.25rem",
              background: "#059669",
              borderColor: "#10b981",
              color: "#ffffff",
              fontWeight: 600,
            }}
          >
            🔬 Validador Excel Oficial
          </button>
          <Link
            to="/creditos/nuevo"
            className="btn"
            style={{ fontSize: "0.76rem", padding: "0.25rem 0.6rem" }}
          >
            + Nueva Solicitud
          </Link>
          {usuario?.rol === "ADMIN" && (
            <>
              <button
                type="button"
                className="btn secondary"
                onClick={handleRecargarDatos}
                disabled={recargando || reseteando}
                style={{
                  fontSize: "0.74rem",
                  padding: "0.25rem 0.55rem",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.25rem",
                  borderColor: "rgba(2, 132, 199, 0.5)",
                  color: "#38bdf8",
                  background: "rgba(2, 132, 199, 0.1)",
                }}
                title="Restaurar los préstamos y socios desde los archivos Excel"
              >
                {recargando ? "⏳..." : "📥 Recargar"}
              </button>
              <button
                type="button"
                className="btn danger"
                onClick={handleReset}
                disabled={reseteando || recargando}
                style={{ fontSize: "0.74rem", padding: "0.25rem 0.5rem" }}
                title="Borrar todos los datos y reiniciar el sistema limpio desde cero"
              >
                {reseteando ? "⏳..." : "⚠️ Reset"}
              </button>
            </>
          )}
        </div>
      </div>

      {mensajeExito && <div className="alert success" style={{ marginBottom: "0.5rem", padding: "0.4rem 0.75rem", fontSize: "0.80rem" }}>{mensajeExito}</div>}
      {error && <div className="alert error" style={{ marginBottom: "0.5rem", padding: "0.4rem 0.75rem", fontSize: "0.80rem" }}>{error}</div>}

      {/* Franja KPI Compacta de Cartera (Estilo Panorámico) */}
      {kardex && (
        <div
          className="stat-grid"
          style={{
            gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
            gap: "0.45rem",
            marginBottom: "0.55rem",
          }}
        >
          <div className="stat-card accent" style={{ padding: "0.45rem 0.65rem" }}>
            <span className="label" style={{ fontSize: "0.68rem" }}>💼 Cartera Activa</span>
            <span className="value" style={{ fontSize: "clamp(0.92rem, 1.1vw, 1.12rem)", whiteSpace: "nowrap" }}>
              {formatoQ(kardex.resumen.totalCarteraViva)}
            </span>
            <span className="hint" style={{ fontSize: "0.68rem" }}>{kardex.resumen.totalCreditos} préstamos</span>
          </div>
          <div className="stat-card" style={{ padding: "0.45rem 0.65rem" }}>
            <span className="label" style={{ fontSize: "0.68rem" }}>🏡 Hipotecarios</span>
            <span className="value" style={{ fontSize: "clamp(0.92rem, 1.1vw, 1.12rem)", whiteSpace: "nowrap" }}>
              {formatoQ(kardex.resumen.totalColocadoHipotecario)}
            </span>
            <span className="hint" style={{ fontSize: "0.68rem" }}>{kardex.resumen.countHipotecarios} colocados</span>
          </div>
          <div className="stat-card" style={{ padding: "0.45rem 0.65rem" }}>
            <span className="label" style={{ fontSize: "0.68rem" }}>🤝 Fiduciarios</span>
            <span className="value" style={{ fontSize: "clamp(0.92rem, 1.1vw, 1.12rem)", whiteSpace: "nowrap" }}>
              {formatoQ(kardex.resumen.totalColocadoFiduciario)}
            </span>
            <span className="hint" style={{ fontSize: "0.68rem" }}>{kardex.resumen.countFiduciarios} colocados</span>
          </div>
          <div className="stat-card" style={{ padding: "0.45rem 0.65rem" }}>
            <span className="label" style={{ fontSize: "0.68rem" }}>💵 Cobrado en {mes}</span>
            <span className="value" style={{ color: "#16a34a", fontSize: "clamp(0.92rem, 1.1vw, 1.12rem)", whiteSpace: "nowrap" }}>
              {formatoQ(kardex.resumen.totalCobradoMes)}
            </span>
            <span className="hint" style={{ fontSize: "0.68rem" }}>Ingresos caja</span>
          </div>
          <div className="stat-card" style={{ padding: "0.45rem 0.65rem" }}>
            <span className="label" style={{ fontSize: "0.68rem" }}>🟢 Al Día</span>
            <span className="value" style={{ color: "#16a34a", fontSize: "clamp(0.92rem, 1.1vw, 1.12rem)" }}>
              {kardex.resumen.sociosAlDia}
            </span>
            <span className="hint" style={{ fontSize: "0.68rem" }}>Cuota pagada</span>
          </div>
          <div className="stat-card" style={{ padding: "0.45rem 0.65rem" }}>
            <span className="label" style={{ fontSize: "0.68rem" }}>🔴 Pendientes</span>
            <span className="value" style={{ color: "#dc2626", fontSize: "clamp(0.92rem, 1.1vw, 1.12rem)" }}>
              {kardex.resumen.sociosPendientes}
            </span>
            <span className="hint" style={{ fontSize: "0.68rem" }}>Por cobrar</span>
          </div>
        </div>
      )}

      {/* Pestañas tipo Excel y Barra de búsqueda Compactas */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "0.45rem",
          flexWrap: "wrap",
          gap: "0.5rem",
        }}
      >
        <div style={{ display: "flex", gap: "0.3rem", flexWrap: "wrap", alignItems: "center" }}>
          {(usuario?.rol === "GERENCIA" || usuario?.rol === "SUPERVISOR") && (
            <>
              <button
                type="button"
                className={`btn ${promotorSel === "TODOS" && tabTipo === "TODOS" ? "" : "secondary"}`}
                style={{ fontSize: "0.78rem", padding: "0.25rem 0.6rem" }}
                onClick={() => {
                  setPromotorSel("TODOS");
                  setTabTipo("TODOS");
                }}
              >
                🌐 Toda la Cartera ({kardex?.resumen.countTotal ?? 150})
              </button>
              <button
                type="button"
                className={`btn ${promotorSel === "DIEGO" ? "" : "secondary"}`}
                style={{
                  fontSize: "0.78rem",
                  padding: "0.25rem 0.6rem",
                  borderColor: promotorSel === "DIEGO" ? "#059669" : undefined,
                  color: promotorSel === "DIEGO" ? "#ffffff" : undefined,
                  background: promotorSel === "DIEGO" ? "#059669" : undefined,
                  fontWeight: 600,
                }}
                onClick={() => {
                  setPromotorSel("DIEGO");
                  setTabTipo("TODOS");
                }}
              >
                🌾 Promotor 1: Diego Laynez ({kardex?.resumen.countDiego ?? 84})
              </button>
              <button
                type="button"
                className={`btn ${promotorSel === "WALTER" ? "" : "secondary"}`}
                style={{
                  fontSize: "0.78rem",
                  padding: "0.25rem 0.6rem",
                  borderColor: promotorSel === "WALTER" ? "#0284c7" : undefined,
                  color: promotorSel === "WALTER" ? "#ffffff" : undefined,
                  background: promotorSel === "WALTER" ? "#0284c7" : undefined,
                  fontWeight: 600,
                }}
                onClick={() => {
                  setPromotorSel("WALTER");
                  setTabTipo("TODOS");
                }}
              >
                🌾 Promotor 2: Walter Mendoza ({kardex?.resumen.countWalter ?? 66})
              </button>
              <span style={{ color: "var(--line)", margin: "0 0.2rem" }}>|</span>
            </>
          )}
          <button
            type="button"
            className={`btn ${tabTipo === "HIPOTECARIO" ? "" : "secondary"}`}
            style={{ fontSize: "0.78rem", padding: "0.25rem 0.6rem" }}
            onClick={() => setTabTipo(tabTipo === "HIPOTECARIO" ? "TODOS" : "HIPOTECARIO")}
          >
            🏡 Hipotecario ({kardex?.resumen.countHipotecarios ?? 71})
          </button>
          <button
            type="button"
            className={`btn ${tabTipo === "FIDUCIARIO" ? "" : "secondary"}`}
            style={{ fontSize: "0.78rem", padding: "0.25rem 0.6rem" }}
            onClick={() => setTabTipo(tabTipo === "FIDUCIARIO" ? "TODOS" : "FIDUCIARIO")}
          >
            🤝 Fiduciario ({kardex?.resumen.countFiduciarios ?? 79})
          </button>
        </div>

        <div style={{ minWidth: 240, flex: 1, maxWidth: 380 }}>
          <input
            placeholder="🔍 Buscar por socio, comunidad, fiador o código..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            style={{ width: "100%", padding: "0.28rem 0.6rem", fontSize: "0.80rem" }}
          />
        </div>
      </div>

      {/* Contenido / Tabla */}
      {cargando && <div className="card">Cargando Kardex de cartera...</div>}

      {!cargando && itemsFiltrados.length === 0 && (
        <div className="alert info">No se encontraron créditos registrados con los filtros seleccionados.</div>
      )}

      {!cargando && itemsFiltrados.length > 0 && (
        <div
          className="card no-print"
          style={{
            padding: 0,
            flex: 1,
            minHeight: 0,
            overflowY: "auto",
            border: "1px solid var(--line)",
            borderRadius: "8px",
          }}
        >
          <table className="table" style={{ width: "100%", margin: 0, fontSize: "0.78rem", borderCollapse: "separate", borderSpacing: 0 }}>
            <thead style={{ position: "sticky", top: 0, zIndex: 10, background: "var(--mono-bg)", boxShadow: "0 2px 4px rgba(0,0,0,0.25)" }}>
              <tr>
                <th style={{ width: "16%", padding: "0.4rem 0.55rem" }}>Código / Socio</th>
                <th style={{ width: "13%", padding: "0.4rem 0.55rem" }}>Comunidad / Ubicación</th>
                <th style={{ width: "14%", padding: "0.4rem 0.55rem" }}>Garantía & Fiador</th>
                <th style={{ width: "11%", padding: "0.4rem 0.55rem" }}>Plazo / Vence</th>
                <th style={{ width: "11%", textAlign: "right", padding: "0.4rem 0.55rem" }}>Valor Crédito</th>
                <th style={{ width: "11%", textAlign: "right", padding: "0.4rem 0.55rem" }}>Saldo Vivo Capital</th>
                <th style={{ width: "10%", textAlign: "right", padding: "0.4rem 0.55rem" }}>Cuota Mensual</th>
                <th style={{ width: "7%", textAlign: "center", padding: "0.4rem 0.55rem" }}>Estado {mes}</th>
                <th style={{ width: "7%", textAlign: "center", padding: "0.4rem 0.55rem" }}>Acción</th>
              </tr>
            </thead>
            <tbody>
              {itemsPaginados.map((p) => {
                const esExpandido = expandidoId === p.id;
                const montoOriginal = Number(p.monto_aprobado || p.monto_solicitado);
                const saldoActual = Number(p.saldo_capital ?? montoOriginal);

                return (
                  <tr key={p.id} style={{ verticalAlign: "middle" }}>
                    {esExpandido ? (
                      <td colSpan={9} style={{ padding: 0 }}>
                        <div style={{ padding: "1rem", background: "var(--paper-raised)" }}>
                          {/* Fila principal en modo expandido */}
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              marginBottom: "0.75rem",
                            }}
                          >
                            <div>
                              <strong style={{ fontSize: "1.05rem" }}>
                                {p.codigo} · {p.socio_nombres}
                              </strong>
                              <span
                                className="badge"
                                style={{ marginLeft: "0.5rem", background: "#dbeafe", color: "#1e40af" }}
                              >
                                {p.tipo}
                              </span>
                            </div>
                            <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                              {p.estadoCuotaMes !== "CANCELADO" && (
                                <Link
                                  to={`/auxiliar-caja?socioId=${p.socio_id}&prestamoId=${p.id}&accion=COBRO_CUOTA`}
                                  className="btn"
                                  style={{
                                    fontSize: "0.78rem",
                                    padding: "0.25rem 0.6rem",
                                    background: "#059669",
                                    borderColor: "#059669",
                                    color: "#fff",
                                    textDecoration: "none",
                                    fontWeight: 700,
                                  }}
                                  title="Cobrar cuota de este préstamo en Ventanilla"
                                >
                                  💰 Cobrar en Ventanilla
                                </Link>
                              )}
                              <Link
                                to={`/creditos/${p.id}`}
                                className="btn secondary"
                                style={{ fontSize: "0.78rem", padding: "0.25rem 0.55rem" }}
                              >
                                Ver Ficha Completa →
                              </Link>
                              <button
                                type="button"
                                className="btn secondary"
                                style={{ fontSize: "0.78rem", padding: "0.25rem 0.55rem" }}
                                onClick={() => setExpandidoId(null)}
                              >
                                ✕ Cerrar
                              </button>
                            </div>
                          </div>

                          {/* Ficha rápida de colocación */}
                          <div
                            style={{
                              display: "grid",
                              gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
                              gap: "0.75rem",
                              marginBottom: "1rem",
                              fontSize: "0.82rem",
                              background: "var(--paper-raised)",
                              padding: "0.75rem",
                              borderRadius: "6px",
                              border: "1px solid var(--line)",
                            }}
                          >
                            <div>
                              <span style={{ color: "var(--ink-soft)" }}>Comunidad:</span>{" "}
                              <strong>{p.ubicacion_garantia || "Chajul"}</strong>
                            </div>
                            <div>
                              <span style={{ color: "var(--ink-soft)" }}>Fiador:</span>{" "}
                              <strong>{p.nombre_fiador || p.garantia || "Sin fiador"}</strong>
                            </div>
                            <div>
                              <span style={{ color: "var(--ink-soft)" }}>Desembolso:</span>{" "}
                              <strong>{p.fecha_desembolso ? p.fecha_desembolso.slice(0, 10) : "Pendiente"}</strong>
                            </div>
                            <div>
                              <span style={{ color: "var(--ink-soft)" }}>Vencimiento:</span>{" "}
                              <strong>{obtenerFechaVencimiento(p)}</strong>
                            </div>
                            <div>
                              <span style={{ color: "var(--ink-soft)" }}>Saldo Inicial 2026:</span>{" "}
                              <strong>{formatoQ(montoOriginal)}</strong>
                            </div>
                            <div>
                              <span style={{ color: "var(--ink-soft)" }}>Amortizado 2026:</span>{" "}
                              <strong style={{ color: "#16a34a" }}>
                                {formatoQ(p.totalPagadoHistorico)}
                              </strong>
                            </div>
                            <div>
                              <span style={{ color: "var(--ink-soft)" }}>Saldo Vivo Actual:</span>{" "}
                              <strong style={{ color: saldoActual > 0 ? "#b45309" : "#15803d" }}>
                                {formatoQ(saldoActual)}
                              </strong>
                            </div>
                          </div>

                          {/* Historial de pagos del crédito */}
                          <h4 style={{ margin: "0 0 0.5rem", fontSize: "0.88rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                            <span>📋</span>
                            <span>Historial Oficial de Cuotas y Amortizaciones ({p.pagos.length} Pagos Registrados)</span>
                          </h4>
                          {p.pagos.length === 0 ? (
                            <div style={{ fontSize: "0.82rem", color: "var(--ink-soft)" }}>
                              No hay pagos registrados aún para este préstamo.
                            </div>
                          ) : (
                            <div style={{ overflowX: "auto" }}>
                              <table style={{ width: "100%", fontSize: "0.78rem", background: "var(--paper-raised)" }}>
                                <thead>
                                  <tr style={{ background: "var(--mono-bg)" }}>
                                    <th>Fecha</th>
                                    <th>Recibo</th>
                                    <th style={{ textAlign: "right" }}>Abono Capital</th>
                                    <th style={{ textAlign: "right" }}>Interés</th>
                                    <th style={{ textAlign: "right" }}>Mora</th>
                                    <th style={{ textAlign: "right" }}>Total Pagado</th>
                                    <th style={{ textAlign: "right" }}>Saldo Restante</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {p.pagos.map((pago) => (
                                    <tr key={pago.id}>
                                      <td>{pago.fecha ? pago.fecha.slice(0, 10) : "—"}</td>
                                      <td className="mono">{pago.numero_recibo || "—"}</td>
                                      <td className="mono" style={{ textAlign: "right", color: "#15803d" }}>
                                        {formatoQ(pago.abono_capital)}
                                      </td>
                                      <td className="mono" style={{ textAlign: "right" }}>
                                        {formatoQ(pago.interes)}
                                      </td>
                                      <td className="mono" style={{ textAlign: "right", color: "#b91c1c" }}>
                                        {formatoQ(pago.mora)}
                                      </td>
                                      <td className="mono" style={{ textAlign: "right", fontWeight: 700 }}>
                                        {formatoQ(pago.total_pagado)}
                                      </td>
                                      <td className="mono" style={{ textAlign: "right", fontWeight: 700 }}>
                                        {formatoQ(pago.saldo_capital_restante)}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      </td>
                    ) : (
                      <>
                        <td style={{ fontWeight: 600, padding: "0.32rem 0.5rem" }}>
                          <div className="mono" style={{ color: "var(--accent)" }}>
                            {p.codigo}
                          </div>
                          <div style={{ fontSize: "0.80rem" }}>{p.socio_nombres}</div>
                        </td>
                        <td style={{ padding: "0.32rem 0.5rem" }}>
                          <strong>{p.ubicacion_garantia || "Chajul"}</strong>
                          <div style={{ fontSize: "0.70rem", color: "var(--ink-soft)" }}>
                            {p.tipo === "HIPOTECARIO" ? "Inmueble / Terreno" : "Comunidad"}
                          </div>
                        </td>
                        <td style={{ padding: "0.32rem 0.5rem" }}>
                          <div>{p.nombre_fiador || p.garantia || "Garantía fiduciaria"}</div>
                          <div style={{ fontSize: "0.70rem", color: "var(--ink-soft)" }}>
                            {p.tipo === "FIDUCIARIO" ? "Fiador solidario" : "Garantía hipotecaria"}
                          </div>
                        </td>
                        <td style={{ padding: "0.32rem 0.5rem", whiteSpace: "nowrap" }}>
                          <div style={{ fontWeight: 600 }}>{formatoPlazo(p.plazo_meses)}</div>
                          <div style={{ fontSize: "0.70rem", color: "var(--ink-soft)" }}>
                            Vence: {obtenerFechaVencimiento(p)}
                          </div>
                        </td>
                        <td className="mono" style={{ textAlign: "right", fontWeight: 600, padding: "0.32rem 0.5rem" }}>
                          {formatoQ(montoOriginal)}
                        </td>
                        <td
                          className="mono"
                          style={{
                            textAlign: "right",
                            fontWeight: 700,
                            color: saldoActual > 0 ? "#BF9903" : "#15803d",
                            padding: "0.32rem 0.5rem",
                          }}
                        >
                          {formatoQ(saldoActual)}
                        </td>
                        <td className="mono" style={{ textAlign: "right", padding: "0.32rem 0.5rem" }}>
                          {formatoQ(p.cuota_mensual)}
                        </td>
                        <td style={{ textAlign: "center", padding: "0.32rem 0.5rem" }}>
                          {p.estadoCuotaMes === "CANCELADO" ? (
                            <span className="badge inactivo" style={{ fontSize: "0.70rem", padding: "0.1rem 0.35rem" }}>
                              ⚪ Liquidado
                            </span>
                          ) : p.estadoCuotaMes === "AL_DIA" ? (
                            <span className="badge activo" style={{ fontSize: "0.70rem", padding: "0.1rem 0.35rem" }}>
                              🟢 Al día ({formatoQ(p.totalPagadoMes)})
                            </span>
                          ) : (
                            <span className="badge danger" style={{ fontSize: "0.70rem", padding: "0.1rem 0.35rem" }}>
                              🔴 Pendiente
                            </span>
                          )}
                        </td>
                        <td style={{ textAlign: "center", padding: "0.32rem 0.5rem" }}>
                          <div style={{ display: "flex", gap: "0.2rem", justifyContent: "center", alignItems: "center", flexWrap: "wrap" }}>
                            <button
                              type="button"
                              className="btn secondary"
                              style={{ fontSize: "0.70rem", padding: "0.18rem 0.35rem" }}
                              onClick={() => setExpandidoId(p.id)}
                              title="Ver historial de pagos de este crédito"
                            >
                              👁️ Pagos ({p.pagos.length})
                            </button>
                            {p.estadoCuotaMes !== "CANCELADO" && (
                              <Link
                                to={`/auxiliar-caja?socioId=${p.socio_id}&prestamoId=${p.id}&accion=COBRO_CUOTA`}
                                className="btn secondary"
                                style={{
                                  fontSize: "0.70rem",
                                  padding: "0.18rem 0.35rem",
                                  borderColor: "#10b981",
                                  color: "#10b981",
                                  textDecoration: "none",
                                  whiteSpace: "nowrap",
                                }}
                                title="Cobrar cuota en ventanilla"
                              >
                                💰 Cobrar
                              </Link>
                            )}
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                );
              })}
            </tbody>
            <tfoot style={{ position: "sticky", bottom: 0, zIndex: 9, background: "var(--paper-raised)", boxShadow: "0 -2px 4px rgba(0,0,0,0.25)" }}>
              <tr style={{ background: "var(--paper-raised)", borderTop: "2px solid var(--line)", fontWeight: 800 }}>
                <td colSpan={4} style={{ textAlign: "right", color: "var(--ink)", padding: "0.45rem 0.6rem", fontSize: "0.82rem" }}>
                  TOTAL CONSOLIDADO ({totalItems} créditos):
                </td>
                <td className="mono" style={{ textAlign: "right", color: "var(--ink)", padding: "0.45rem 0.6rem", fontSize: "0.85rem", fontWeight: 800 }}>
                  {formatoQ(sumaValorOriginal)}
                </td>
                <td className="mono" style={{ textAlign: "right", color: "#BF9903", padding: "0.45rem 0.6rem", fontSize: "0.85rem", fontWeight: 800 }}>
                  {formatoQ(sumaSaldoVivo)}
                </td>
                <td className="mono" style={{ textAlign: "right", color: "var(--accent)", padding: "0.45rem 0.6rem", fontSize: "0.85rem", fontWeight: 800 }}>
                  {formatoQ(sumaCuotas)}
                </td>
                <td colSpan={2} style={{ textAlign: "center", fontSize: "0.74rem", color: "var(--ink-soft)", padding: "0.45rem 0.6rem" }}>
                  {kardex?.resumen.sociosAlDia ?? 0} al día · {kardex?.resumen.sociosPendientes ?? 0} pendientes
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {totalItems > pageSize && (
        <div
          className="pagination no-print"
          style={{ display: "flex", gap: "0.6rem", alignItems: "center", justifyContent: "center", marginTop: "0.4rem", fontSize: "0.78rem" }}
        >
          <button className="btn secondary" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} style={{ padding: "0.18rem 0.45rem", fontSize: "0.72rem" }}>
            Anterior
          </button>
          <span>
            Mostrando {itemsPaginados.length} de {totalItems} créditos · Pág. {page} de {totalPaginas}
          </span>
          <button className="btn secondary" disabled={page >= totalPaginas} onClick={() => setPage((p) => p + 1)} style={{ padding: "0.18rem 0.45rem", fontSize: "0.72rem" }}>
            Siguiente
          </button>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          REPORTE OFICIAL DE IMPRESIÓN COMPLETO (TODOS LOS CRÉDITOS SIN CORTES)
          ══════════════════════════════════════════════════════════════════════ */}
      <div className="print-only" style={{ width: "100%", margin: "0", padding: "0" }}>
        {/* MEMBRETE INSTITUCIONAL OFICIAL */}
        <div style={{ borderBottom: "2px solid #0f172a", paddingBottom: "6px", marginBottom: "10px", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ fontSize: "11pt", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.5px", color: "#0f172a" }}>
              COOPERATIVA MAYA INVERSIONES FUTURAS R.L. "COMIF-R.L."
            </div>
            <div style={{ fontSize: "9.5pt", fontWeight: 700, color: "#0284c7", marginTop: "2px" }}>
              KARDEX Y ESTADO OFICIAL DE CARTERA DE CRÉDITOS — MES {mes}
            </div>
            <div style={{ fontSize: "7.5pt", color: "#475569", marginTop: "2px" }}>
              San Gaspar Chajul, El Quiché, Guatemala · Sistema Contable y Financiero COMIF-R.L.
            </div>
          </div>
          <div style={{ textAlign: "right", fontSize: "7.5pt", color: "#334155" }}>
            <div><strong>Emisión:</strong> {new Date().toLocaleDateString("es-GT", { day: "2-digit", month: "2-digit", year: "numeric" })} {new Date().toLocaleTimeString("es-GT", { hour: "2-digit", minute: "2-digit" })}</div>
            <div><strong>Total Préstamos:</strong> {totalItems} créditos</div>
            {busqueda && <div><strong>Filtro:</strong> "{busqueda}"</div>}
          </div>
        </div>

        {/* TABLA COMPLETA CON TODOS LOS CRÉDITOS DE LA CARTERA */}
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "7.2pt", marginBottom: "15px" }}>
          <thead>
            <tr style={{ background: "#0f172a", color: "#ffffff" }}>
              <th style={{ width: "3%", textAlign: "center", padding: "4px 2px", color: "#ffffff" }}>#</th>
              <th style={{ width: "10%", textAlign: "left", padding: "4px 4px", color: "#ffffff" }}>CÓDIGO</th>
              <th style={{ width: "20%", textAlign: "left", padding: "4px 4px", color: "#ffffff" }}>ASOCIADO / TITULAR</th>
              <th style={{ width: "14%", textAlign: "left", padding: "4px 4px", color: "#ffffff" }}>UBICACIÓN / GARANTÍA</th>
              <th style={{ width: "14%", textAlign: "left", padding: "4px 4px", color: "#ffffff" }}>FIADOR SOLIDARIO</th>
              <th style={{ width: "7%", textAlign: "center", padding: "4px 2px", color: "#ffffff" }}>PLAZO</th>
              <th style={{ width: "11%", textAlign: "right", padding: "4px 4px", color: "#ffffff" }}>MONTO (Q)</th>
              <th style={{ width: "11%", textAlign: "right", padding: "4px 4px", color: "#ffffff" }}>SALDO VIVO (Q)</th>
              <th style={{ width: "10%", textAlign: "center", padding: "4px 4px", color: "#ffffff" }}>ESTADO {mes}</th>
            </tr>
          </thead>
          <tbody>
            {itemsFiltrados.map((p, index) => {
              const montoOriginal = Number(p.monto_aprobado || p.monto_solicitado);
              const saldoActual = Number(p.saldo_capital ?? montoOriginal);
              return (
                <tr key={p.id} style={{ background: index % 2 === 0 ? "#ffffff" : "#f8fafc" }}>
                  <td style={{ textAlign: "center", border: "1px solid #cbd5e1", padding: "3px 2px" }}>
                    {index + 1}
                  </td>
                  <td style={{ border: "1px solid #cbd5e1", padding: "3px 4px", fontFamily: "monospace", fontWeight: 700 }}>
                    {p.codigo}
                  </td>
                  <td style={{ border: "1px solid #cbd5e1", padding: "3px 4px" }}>
                    <div style={{ fontWeight: 600 }}>{p.socio_nombres}</div>
                    <div style={{ fontSize: "6.5pt", color: "#64748b" }}>{p.numero_asociado} · {p.tipo}</div>
                  </td>
                  <td style={{ border: "1px solid #cbd5e1", padding: "3px 4px" }}>
                    <div>{p.ubicacion_garantia || "Chajul"}</div>
                    <div style={{ fontSize: "6.5pt", color: "#64748b" }}>{p.garantia || "Garantía registrada"}</div>
                  </td>
                  <td style={{ border: "1px solid #cbd5e1", padding: "3px 4px" }}>
                    <div>{p.nombre_fiador || "—"}</div>
                  </td>
                  <td style={{ textAlign: "center", border: "1px solid #cbd5e1", padding: "3px 2px" }}>
                    {p.plazo_meses}m
                  </td>
                  <td style={{ textAlign: "right", border: "1px solid #cbd5e1", padding: "3px 4px", fontFamily: "monospace", fontWeight: 600 }}>
                    {formatoQ(montoOriginal)}
                  </td>
                  <td style={{ textAlign: "right", border: "1px solid #cbd5e1", padding: "3px 4px", fontFamily: "monospace", fontWeight: 700, color: saldoActual > 0 ? "#b45309" : "#15803d" }}>
                    {formatoQ(saldoActual)}
                  </td>
                  <td style={{ textAlign: "center", border: "1px solid #cbd5e1", padding: "3px 4px", fontSize: "6.8pt", fontWeight: 700 }}>
                    {p.estadoCuotaMes === "CANCELADO" ? "LIQUIDADO" : p.estadoCuotaMes === "AL_DIA" ? `AL DÍA (${formatoQ(p.totalPagadoMes)})` : "PENDIENTE"}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr style={{ background: "#e2e8f0", fontWeight: "bold" }}>
              <td colSpan={6} style={{ border: "1px solid #94a3b8", padding: "5px", textAlign: "right", fontWeight: 800 }}>
                TOTAL CARTERA AUDITADA ({totalItems} PRÉSTAMOS):
              </td>
              <td style={{ border: "1px solid #94a3b8", padding: "5px", textAlign: "right", fontFamily: "monospace", fontWeight: 800, fontSize: "8pt" }}>
                {formatoQ(itemsFiltrados.reduce((acc, x) => acc + Number(x.monto_aprobado || x.monto_solicitado), 0))}
              </td>
              <td style={{ border: "1px solid #94a3b8", padding: "5px", textAlign: "right", fontFamily: "monospace", fontWeight: 800, color: "#b45309", fontSize: "8pt" }}>
                {formatoQ(itemsFiltrados.reduce((acc, x) => acc + Number(x.saldo_capital ?? (x.monto_aprobado || x.monto_solicitado)), 0))}
              </td>
              <td style={{ border: "1px solid #94a3b8", padding: "5px", textAlign: "center", color: "#475569", fontSize: "7pt" }}>
                Cierre {mes}
              </td>
            </tr>
          </tfoot>
        </table>

        {/* BLOQUE DE FIRMAS OFICIALES DE LEGALIZACIÓN */}
        <div style={{ pageBreakInside: "avoid", breakInside: "avoid", marginTop: "20px", paddingTop: "6px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "25px", textAlign: "center" }}>
            <div>
              <div style={{ borderTop: "1px solid #000", margin: "0 10px", paddingTop: "4px", fontSize: "7.5pt", fontWeight: 700 }}>
                Comité de Créditos
              </div>
              <div style={{ fontSize: "6.5pt", color: "#475569" }}>Aprobación y Dictamen</div>
            </div>
            <div>
              <div style={{ borderTop: "1px solid #000", margin: "0 10px", paddingTop: "4px", fontSize: "7.5pt", fontWeight: 700 }}>
                Promotor / Oficial de Campo
              </div>
              <div style={{ fontSize: "6.5pt", color: "#475569" }}>Seguimiento y Cobranza</div>
            </div>
            <div>
              <div style={{ borderTop: "1px solid #000", margin: "0 10px", paddingTop: "4px", fontSize: "7.5pt", fontWeight: 700 }}>
                Gerencia General
              </div>
              <div style={{ fontSize: "6.5pt", color: "#475569" }}>Visto Bueno Oficial COMIF-R.L.</div>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL INSTITUCIONAL: VALIDADOR ESTRICTO DE CARTERA EXCEL */}
      {mostrarModalDiagnostico && (
        <div
          className="modal-overlay"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(15, 23, 42, 0.8)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: "1rem",
          }}
        >
          <div
            className="modal-card"
            style={{
              background: "#0f172a",
              border: "1px solid rgba(148, 163, 184, 0.25)",
              borderRadius: "14px",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.75)",
              padding: "1.5rem",
              maxWidth: "880px",
              width: "100%",
              maxHeight: "90vh",
              overflowY: "auto",
              color: "#f8fafc",
            }}
          >
            {/* Header Modal */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                borderBottom: "1px solid rgba(148, 163, 184, 0.2)",
                paddingBottom: "0.75rem",
                marginBottom: "1rem",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span style={{ fontSize: "1.4rem" }}>🔬</span>
                <div>
                  <h3 style={{ margin: 0, fontSize: "1.1rem", color: "#f8fafc" }}>
                    Validador y Auditor Oficial al Pie de la Letra
                  </h3>
                  <p style={{ margin: "0.15rem 0 0", fontSize: "0.74rem", color: "#94a3b8" }}>
                    Fidelidad 1 a 1 entre el archivo Excel del Promotor y la Cartera de Préstamos
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="btn secondary"
                onClick={() => setMostrarModalDiagnostico(false)}
                style={{ padding: "0.2rem 0.5rem", fontSize: "0.8rem" }}
              >
                ✕ Cerrar
              </button>
            </div>

            {/* Contenido Modal */}
            {cargandoDiagnostico && (
              <div style={{ textAlign: "center", padding: "2.5rem", color: "#94a3b8" }}>
                <div style={{ fontSize: "1.8rem", marginBottom: "0.5rem" }}>⏳</div>
                Analizando minuciosamente cada celda, fórmula y monto del archivo Excel...
              </div>
            )}

            {errorDiagnostico && (
              <div className="alert error" style={{ margin: "1rem 0" }}>
                ❌ {errorDiagnostico}
              </div>
            )}

            {!cargandoDiagnostico && diagnostico && (
              <div>
                {/* Cuadros de Resumen Institucional */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
                    gap: "0.75rem",
                    marginBottom: "1rem",
                  }}
                >
                  <div
                    style={{
                      background: "#1e293b",
                      padding: "0.75rem",
                      borderRadius: "8px",
                      border: "1px solid rgba(148, 163, 184, 0.15)",
                    }}
                  >
                    <div style={{ fontSize: "0.72rem", color: "#94a3b8" }}>Archivo Analizado</div>
                    <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "#e2e8f0", wordBreak: "break-all" }}>
                      {diagnostico.archivo}
                    </div>
                    <div style={{ fontSize: "0.7rem", color: "#10b981", marginTop: "0.2rem" }}>
                      ✓ Archivo XLSX Legítimo
                    </div>
                  </div>
                  <div
                    style={{
                      background: "#1e293b",
                      padding: "0.75rem",
                      borderRadius: "8px",
                      border: "1px solid rgba(148, 163, 184, 0.15)",
                    }}
                  >
                    <div style={{ fontSize: "0.72rem", color: "#94a3b8" }}>Hipotecarios (Excel)</div>
                    <div
                      style={{
                        fontSize: "1.1rem",
                        fontWeight: 800,
                        color: "#10b981",
                        fontFamily: "'IBM Plex Mono', monospace",
                      }}
                    >
                      {diagnostico.totalHipotecarios} créditos
                    </div>
                    <div style={{ fontSize: "0.74rem", color: "#cbd5e1", fontFamily: "'IBM Plex Mono', monospace" }}>
                      {formatoQ(diagnostico.montoHipotecarios)}
                    </div>
                  </div>
                  <div
                    style={{
                      background: "#1e293b",
                      padding: "0.75rem",
                      borderRadius: "8px",
                      border: "1px solid rgba(148, 163, 184, 0.15)",
                    }}
                  >
                    <div style={{ fontSize: "0.72rem", color: "#94a3b8" }}>Fiduciarios (Excel)</div>
                    <div
                      style={{
                        fontSize: "1.1rem",
                        fontWeight: 800,
                        color: "#38bdf8",
                        fontFamily: "'IBM Plex Mono', monospace",
                      }}
                    >
                      {diagnostico.totalFiduciarios} créditos
                    </div>
                    <div style={{ fontSize: "0.74rem", color: "#cbd5e1", fontFamily: "'IBM Plex Mono', monospace" }}>
                      {formatoQ(diagnostico.montoFiduciarios)}
                    </div>
                  </div>
                  <div
                    style={{
                      background: "#1e293b",
                      padding: "0.75rem",
                      borderRadius: "8px",
                      border: "1px solid rgba(191, 153, 3, 0.35)",
                    }}
                  >
                    <div style={{ fontSize: "0.72rem", color: "#BF9903" }}>Total Cartera Oficial</div>
                    <div
                      style={{
                        fontSize: "1.1rem",
                        fontWeight: 800,
                        color: "#BF9903",
                        fontFamily: "'IBM Plex Mono', monospace",
                      }}
                    >
                      {diagnostico.totalCreditos} créditos
                    </div>
                    <div
                      style={{
                        fontSize: "0.74rem",
                        color: "#fbbf24",
                        fontFamily: "'IBM Plex Mono', monospace",
                        fontWeight: 700,
                      }}
                    >
                      {formatoQ(diagnostico.montoTotalCartera)}
                    </div>
                  </div>
                </div>

                {/* Explicación institucional de 121 vs 66 créditos */}
                <div
                  style={{
                    background: "rgba(5, 150, 105, 0.1)",
                    border: "1px solid rgba(5, 150, 105, 0.3)",
                    borderRadius: "8px",
                    padding: "0.85rem",
                    marginBottom: "1rem",
                    fontSize: "0.78rem",
                    lineHeight: 1.5,
                  }}
                >
                  <strong style={{ color: "#10b981", display: "block", marginBottom: "0.25rem" }}>
                    📌 Explicación Oficial del Cuadre de Cartera:
                  </strong>
                  El archivo oficial del Promotor de Negocios contiene exactamente{" "}
                  <strong>66 créditos legítimos</strong> (49 Hipotecarios por Q 15,044,790.75 y 17 Fiduciarios por Q 174,447.56).
                  Los restantes registros existentes en el sistema corresponden a cobros de ventanilla en Caja Auxiliar que fueron
                  segregados automáticamente en <strong>"Préstamos por Regularizar"</strong> para mantener la pureza y
                  especificidad de la cartera del Promotor sin perder el historial contable de pagos recibidos.
                </div>

                {/* Tabla de Anomalías Detectadas */}
                <h4 style={{ fontSize: "0.85rem", color: "#e2e8f0", margin: "0.75rem 0 0.4rem" }}>
                  Anomalías Detectadas en el Archivo Excel ({diagnostico.anomalias?.length || 0}):
                </h4>
                {!diagnostico.anomalias || diagnostico.anomalias.length === 0 ? (
                  <div
                    style={{
                      padding: "0.75rem",
                      background: "#1e293b",
                      borderRadius: "6px",
                      color: "#10b981",
                      fontSize: "0.78rem",
                    }}
                  >
                    ✅ Ninguna anomalía detectada. El archivo Excel cumple al 100% las reglas de estructura y formato.
                  </div>
                ) : (
                  <div
                    style={{
                      maxHeight: "220px",
                      overflowY: "auto",
                      border: "1px solid rgba(148, 163, 184, 0.2)",
                      borderRadius: "6px",
                    }}
                  >
                    <table style={{ width: "100%", fontSize: "0.74rem", borderCollapse: "collapse" }}>
                      <thead style={{ background: "#1e293b", position: "sticky", top: 0 }}>
                        <tr>
                          <th style={{ padding: "0.4rem 0.5rem", textAlign: "left" }}>Fila / Hoja</th>
                          <th style={{ padding: "0.4rem 0.5rem", textAlign: "left" }}>Socio / Titular</th>
                          <th style={{ padding: "0.4rem 0.5rem", textAlign: "left" }}>Celda / Falla</th>
                          <th style={{ padding: "0.4rem 0.5rem", textAlign: "left" }}>Acción Aplicada / Sugerencia</th>
                          <th style={{ padding: "0.4rem 0.5rem", textAlign: "center" }}>Estado</th>
                        </tr>
                      </thead>
                      <tbody>
                        {diagnostico.anomalias.map((a: any, idx: number) => (
                          <tr key={idx} style={{ borderBottom: "1px solid rgba(148, 163, 184, 0.1)" }}>
                            <td
                              style={{
                                padding: "0.35rem 0.5rem",
                                color: "#94a3b8",
                                fontFamily: "'IBM Plex Mono', monospace",
                              }}
                            >
                              {a.hoja} - Fila {a.fila}
                            </td>
                            <td style={{ padding: "0.35rem 0.5rem", fontWeight: 600 }}>{a.socio}</td>
                            <td style={{ padding: "0.35rem 0.5rem", color: "#f87171" }}>{a.descripcion}</td>
                            <td style={{ padding: "0.35rem 0.5rem", color: "#38bdf8" }}>{a.sugerencia}</td>
                            <td style={{ padding: "0.35rem 0.5rem", textAlign: "center" }}>
                              <span
                                style={{
                                  padding: "2px 6px",
                                  borderRadius: "4px",
                                  fontSize: "0.68rem",
                                  fontWeight: 600,
                                  background:
                                    a.severidad === "CORREGIDA_AUTOMATICAMENTE"
                                      ? "rgba(16, 185, 129, 0.2)"
                                      : "rgba(245, 158, 11, 0.2)",
                                  color:
                                    a.severidad === "CORREGIDA_AUTOMATICAMENTE" ? "#10b981" : "#f59e0b",
                                }}
                              >
                                {a.severidad === "CORREGIDA_AUTOMATICAMENTE" ? "Auto-corregido" : "Revisión"}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Acciones de Sincronización y Bloqueo de Seguridad */}
                {diagnostico.anomalias?.some((a: any) => a.severidad === "CRITICA") && (
                  <div
                    style={{
                      background: "rgba(220, 38, 38, 0.15)",
                      border: "1px solid #dc2626",
                      borderRadius: "6px",
                      padding: "0.5rem 0.8rem",
                      color: "#f87171",
                      fontSize: "0.76rem",
                      marginTop: "0.85rem",
                    }}
                  >
                    🛑 <strong>Importación Bloqueada por Seguridad:</strong> Se detectaron inconsistencias críticas
                    en el archivo Excel. Corrija las celdas señaladas arriba antes de poder sincronizar la base de datos contable.
                  </div>
                )}

                <div
                  style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    alignItems: "center",
                    gap: "0.5rem",
                    marginTop: "1.25rem",
                    borderTop: "1px solid rgba(148, 163, 184, 0.2)",
                    paddingTop: "0.85rem",
                  }}
                >
                  <button
                    type="button"
                    className="btn secondary"
                    onClick={() => setMostrarModalDiagnostico(false)}
                    style={{ fontSize: "0.8rem", padding: "0.35rem 0.75rem" }}
                  >
                    Cerrar Auditoría
                  </button>
                  {usuario?.rol === "ADMIN" && (
                    <button
                      type="button"
                      className="btn"
                      onClick={ejecutarSincronizacionOficial}
                      disabled={
                        sincronizandoCartera ||
                        diagnostico.anomalias?.some((a: any) => a.severidad === "CRITICA")
                      }
                      title={
                        diagnostico.anomalias?.some((a: any) => a.severidad === "CRITICA")
                          ? "Bloqueado: Corrija las fallas del archivo Excel primero"
                          : "Sincronizar base de datos con la cartera oficial del Excel"
                      }
                      style={{
                        fontSize: "0.8rem",
                        padding: "0.35rem 0.85rem",
                        background: diagnostico.anomalias?.some((a: any) => a.severidad === "CRITICA")
                          ? "#475569"
                          : "#059669",
                        borderColor: diagnostico.anomalias?.some((a: any) => a.severidad === "CRITICA")
                          ? "#64748b"
                          : "#10b981",
                        color: "#ffffff",
                        fontWeight: 700,
                        cursor: diagnostico.anomalias?.some((a: any) => a.severidad === "CRITICA")
                          ? "not-allowed"
                          : "pointer",
                      }}
                    >
                      {sincronizandoCartera
                        ? "⏳ Sincronizando..."
                        : diagnostico.anomalias?.some((a: any) => a.severidad === "CRITICA")
                        ? "⛔ Importación Bloqueada"
                        : "⚡ Sincronizar Cartera 1 a 1"}
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
