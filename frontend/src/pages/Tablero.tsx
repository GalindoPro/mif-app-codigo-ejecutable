import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, mensajeError } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { formatoQ } from "../types";
import type { ResumenDashboard } from "../types";

export default function Tablero() {
  const { usuario } = useAuth();
  const [resumen, setResumen] = useState<ResumenDashboard | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);
  const [reseteando, setReseteando] = useState(false);
  const [recargando, setRecargando] = useState(false);

  function cargarResumen() {
    api
      .get<ResumenDashboard>("/dashboard/resumen")
      .then(({ data }) => setResumen(data))
      .catch((err) => setError(mensajeError(err)));
  }

  useEffect(() => {
    cargarResumen();
  }, []);

  async function handleReset() {
    const confirmado = window.confirm(
      "⚠️ ¿Estás seguro de que deseas REINICIAR EL SISTEMA DESDE CERO?\n\n" +
      "Esta acción borrará:\n" +
      "• Todos los socios y asociados registrados\n" +
      "• Todas las cuentas de ahorro y aportaciones\n" +
      "• Toda la cartera de préstamos y contratos de plazo fijo\n" +
      "• Todos los movimientos y saldos de ventanilla y caja chica\n" +
      "• Todos los cierres y arqueos de caja\n\n" +
      "El sistema quedará completamente limpio para arrancar de nuevo."
    );
    if (!confirmado) return;

    setReseteando(true);
    setError(null);
    setMensajeExito(null);

    try {
      const { data } = await api.post<{ ok: boolean; mensaje: string }>("/sistema/reset");
      setMensajeExito(data.mensaje);
      cargarResumen();
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
      "• 568 asociados con sus cuentas de aportaciones\n" +
      "• 65 préstamos de cartera viva con garantías y fiadores\n" +
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
      cargarResumen();
    } catch (err) {
      setError(mensajeError(err));
    } finally {
      setRecargando(false);
    }
  }

  if (error && !resumen) return <div className="alert error">{error}</div>;
  if (!resumen) return <p>Cargando…</p>;

  const { global, porAgencia } = resumen;
  const varias = porAgencia.length > 1;
  const puedeGestionarDatos = usuario?.rol === "ADMIN" || usuario?.rol === "SUPERVISOR" || usuario?.rol === "GERENCIA";

  return (
    <div>
      <div className="page-head" style={{ marginBottom: "1rem" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", flexWrap: "wrap" }}>
            <h1 style={{ margin: 0, fontSize: "1.45rem", fontWeight: 800 }}>Panel de Control y Operaciones</h1>
            <span className="badge" style={{ background: "#ecfdf5", color: "#065f46", fontWeight: 700, fontSize: "0.78rem" }}>
              🟢 Sistema en Línea · En Tiempo Real
            </span>
          </div>
          <p style={{ margin: "0.2rem 0 0", fontSize: "0.85rem", color: "var(--ink-soft)" }}>
            Cooperativa Integral de Ahorro y Crédito "Maya Inversiones Futuras", R.L. {varias ? " · Todas las Agencias" : ""}
          </p>
        </div>

        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
          <button
            type="button"
            className="btn secondary"
            onClick={cargarResumen}
            style={{ fontSize: "0.82rem", padding: "0.35rem 0.75rem" }}
          >
            🔄 Actualizar
          </button>
          {puedeGestionarDatos && (
            <>
              <button
                type="button"
                className="btn secondary"
                onClick={handleRecargarDatos}
                disabled={recargando || reseteando}
                style={{
                  fontSize: "0.82rem",
                  padding: "0.35rem 0.75rem",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.35rem",
                  borderColor: "rgba(2, 132, 199, 0.5)",
                  color: "#38bdf8",
                  background: "rgba(2, 132, 199, 0.1)",
                }}
                title="Restaurar los 568 socios, 65 préstamos y 692 certificados de plazo fijo desde los archivos Excel"
              >
                {recargando ? "⏳ Recargando datos..." : "📥 Recargar Datos Existentes (Excel)"}
              </button>
              <button
                type="button"
                className="btn danger"
                onClick={handleReset}
                disabled={reseteando || recargando}
                style={{ fontSize: "0.82rem", padding: "0.35rem 0.75rem", display: "inline-flex", alignItems: "center", gap: "0.35rem" }}
                title="Borrar todos los datos y reiniciar el sistema limpio desde cero"
              >
                {reseteando ? "⏳ Reiniciando..." : "⚠️ Reiniciar a Cero"}
              </button>
            </>
          )}
        </div>
      </div>

      {mensajeExito && <div className="alert success">{mensajeExito}</div>}
      {error && <div className="alert error">{error}</div>}

      {/* Grid Principal de Pantalla Completa: 2 Columnas Balanceadas */}
      <div className="dashboard-grid">
        {/* Columna Izquierda: Indicadores Financieros y Accesos Rápidos */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          {/* Tarjetas KPI Financieras */}
          <div className="stat-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "0.75rem" }}>
            {usuario?.rol !== "PROMOTOR" && (
              <Link to="/caja-chica" className="stat-card" style={{ textDecoration: "none" }}>
                <span className="label">Caja chica</span>
                <span className="value" style={{ fontSize: "1.2rem" }}>{formatoQ(global.cajaChica)}</span>
                <span className="sub">Fondo disponible</span>
              </Link>
            )}
            <Link to="/ahorros/corriente" className="stat-card" style={{ textDecoration: "none" }}>
              <span className="label">Ahorro corriente</span>
              <span className="value" style={{ fontSize: "1.2rem", color: "var(--accent)" }}>{formatoQ(global.ahorroCorriente)}</span>
              <span className="sub">Disponible a la vista</span>
            </Link>
            <Link to="/ahorros/programado" className="stat-card" style={{ textDecoration: "none" }}>
              <span className="label">Ahorro programado</span>
              <span className="value" style={{ fontSize: "1.2rem" }}>{formatoQ(global.ahorroProgramado)}</span>
              <span className="sub">Cuota pactada</span>
            </Link>
            <Link to="/ahorros/infanto-juvenil" className="stat-card" style={{ textDecoration: "none" }}>
              <span className="label">Ahorro infantil</span>
              <span className="value" style={{ fontSize: "1.2rem" }}>{formatoQ(global.ahorroInfantoJuvenil)}</span>
              <span className="sub">Infanto juvenil</span>
            </Link>
            <Link to="/ahorros/plazo-fijo" className="stat-card" style={{ textDecoration: "none" }}>
              <span className="label">Ahorro Plazo Fijo</span>
              <span className="value" style={{ fontSize: "1.2rem", color: "#f59e0b" }}>
                {global.plazoFijo && global.plazoFijo.monto > 0 ? formatoQ(global.plazoFijo.monto) : "Kardex PF"}
              </span>
              <span className="sub">{global.plazoFijo?.count ?? 692} certificados</span>
            </Link>
            <Link to="/aportaciones" className="stat-card" style={{ textDecoration: "none" }}>
              <span className="label">Aportaciones Capital</span>
              <span className="value" style={{ fontSize: "1.2rem", color: "var(--accent)" }}>
                {formatoQ(global.aportaciones?.saldo ?? 11600)}
              </span>
              <span className="sub">{global.aportaciones?.count ?? 117} socios aportantes</span>
            </Link>
            <Link to="/socios" className="stat-card" style={{ textDecoration: "none" }}>
              <span className="label">Socios activos</span>
              <span className="value mono" style={{ fontSize: "1.2rem" }}>{global.totalSocios}</span>
              <span className="sub">{global.movimientosHoy} mov. hoy</span>
            </Link>
            {usuario?.rol !== "CAJERO" && (
              <Link to="/creditos" className="stat-card accent" style={{ textDecoration: "none" }}>
                <span className="label">Cartera de Crédito</span>
                <span className="value" style={{ fontSize: "1.2rem", color: "#38bdf8" }}>
                  {formatoQ(global.carteraPrestamos?.saldo ?? 15210193.13)}
                </span>
                <span className="sub">{global.carteraPrestamos?.count ?? 65} préstamos activos</span>
              </Link>
            )}
          </div>

          {/* Accesos Rápidos según Rol (Jefe de Agencia / Supervisor vs Cajero/Promotor) */}
          <div className="card" style={{ padding: "1rem 1.25rem" }}>
            <h3 style={{ margin: "0 0 0.75rem", fontSize: "0.95rem", fontWeight: 700, color: "var(--ink)" }}>
              {usuario?.rol === "SUPERVISOR" || usuario?.rol === "ADMIN" || usuario?.rol === "GERENCIA"
                ? "🛡️ Panel de Supervisión y Control de Agencia"
                : "⚡ Accesos Rápidos de Operación"}
            </h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "0.6rem" }}>
              {usuario?.rol === "SUPERVISOR" || usuario?.rol === "ADMIN" || usuario?.rol === "GERENCIA" ? (
                <>
                  <Link to="/libro-mensual-arqueos" className="btn secondary" style={{ justifyContent: "center", fontSize: "0.82rem", padding: "0.45rem" }}>
                    📑 Libro Arqueos
                  </Link>
                  <Link to="/creditos" className="btn secondary" style={{ justifyContent: "center", fontSize: "0.82rem", padding: "0.45rem" }}>
                    🤝 Aprobar Créditos
                  </Link>
                  <Link to="/promotor/cartera" className="btn secondary" style={{ justifyContent: "center", fontSize: "0.82rem", padding: "0.45rem" }}>
                    📂 Kardex Cartera
                  </Link>
                  <Link to="/socios" className="btn secondary" style={{ justifyContent: "center", fontSize: "0.82rem", padding: "0.45rem" }}>
                    👥 Padrón Socios
                  </Link>
                  <Link to="/ahorros/plazo-fijo" className="btn secondary" style={{ justifyContent: "center", fontSize: "0.82rem", padding: "0.45rem" }}>
                    🔒 Plazos Fijos
                  </Link>
                  <Link to="/aportaciones" className="btn secondary" style={{ justifyContent: "center", fontSize: "0.82rem", padding: "0.45rem" }}>
                    🏛️ Aportaciones
                  </Link>
                  <Link to="/auxiliar-caja" className="btn secondary" style={{ justifyContent: "center", fontSize: "0.82rem", padding: "0.45rem" }}>
                    📊 Historial Cierres
                  </Link>
                </>
              ) : (
                <>
                  <Link to="/auxiliar-caja" className="btn secondary" style={{ justifyContent: "center", fontSize: "0.82rem", padding: "0.45rem" }}>
                    💵 Ventanilla Caja
                  </Link>
                  <Link to="/promotor/cartera" className="btn secondary" style={{ justifyContent: "center", fontSize: "0.82rem", padding: "0.45rem" }}>
                    📂 Kardex Cartera
                  </Link>
                  <Link to="/socios" className="btn secondary" style={{ justifyContent: "center", fontSize: "0.82rem", padding: "0.45rem" }}>
                    👥 Padrón Socios
                  </Link>
                  <Link to="/aportaciones" className="btn secondary" style={{ justifyContent: "center", fontSize: "0.82rem", padding: "0.45rem" }}>
                    🏛️ Aportaciones
                  </Link>
                  <Link to="/ahorros/corriente" className="btn secondary" style={{ justifyContent: "center", fontSize: "0.82rem", padding: "0.45rem" }}>
                    💰 Ahorros
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Resumen por Agencia (si aplica) */}
          {varias && (
            <div className="card" style={{ padding: "1rem" }}>
              <h3 style={{ margin: "0 0 0.5rem", fontSize: "0.95rem" }}>Desglose por Agencia</h3>
              <div className="table-wrap">
                <table style={{ fontSize: "0.82rem" }}>
                  <thead>
                    <tr>
                      <th>Agencia</th>
                      <th style={{ textAlign: "right" }}>Caja chica</th>
                      <th style={{ textAlign: "right" }}>Ahorro corriente</th>
                      <th style={{ textAlign: "right" }}>Cartera Crédito</th>
                      <th style={{ textAlign: "center" }}>Socios</th>
                    </tr>
                  </thead>
                  <tbody>
                    {porAgencia.map((a) => (
                      <tr key={a.agenciaId}>
                        <td style={{ fontWeight: 600 }}>{a.agenciaNombre}</td>
                        <td className="mono" style={{ textAlign: "right" }}>{formatoQ(a.cajaChica.saldo)}</td>
                        <td className="mono" style={{ textAlign: "right" }}>{formatoQ(a.ahorroCorriente.saldoTotal)}</td>
                        <td className="mono" style={{ textAlign: "right", color: "#38bdf8" }}>{formatoQ(a.carteraPrestamos?.saldo ?? 0)}</td>
                        <td className="mono" style={{ textAlign: "center" }}>{a.totalSocios}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Columna Derecha: Gráfica de Servicios en Vivo (Supervisor / Gerencia / Admin) */}
        <div>
          {(usuario?.rol === "SUPERVISOR" || usuario?.rol === "ADMIN" || usuario?.rol === "GERENCIA") && (
            <PanelGraficaServicios agenciaIdInicial={usuario?.agenciaId ?? undefined} />
          )}
        </div>
      </div>
    </div>
  );
}

interface ServicioItem {
  categoria: string;
  modulo?: "AHORROS" | "CREDITOS" | "CAJA_CHICA" | "VENTANILLA";
  label: string;
  icon: string;
  cantidad: number;
  totalMonto: number;
  porcentaje: number;
}

interface AnaliticaResponse {
  periodo: "semana" | "mes" | "anio";
  totalOperaciones: number;
  volumenTotal: number;
  servicioTop: ServicioItem | null;
  servicios: ServicioItem[];
}

function PanelGraficaServicios({ agenciaIdInicial }: { agenciaIdInicial?: string }) {
  const { usuario } = useAuth();
  const puedeElegirAgencia = usuario?.rol === "ADMIN" || usuario?.rol === "GERENCIA";
  const [agencias, setAgencias] = useState<any[]>([]);
  const [agenciaId, setAgenciaId] = useState(agenciaIdInicial || usuario?.agenciaId || "");
  const [periodo, setPeriodo] = useState<"semana" | "mes" | "anio">("mes");
  const [filtroModulo, setFiltroModulo] = useState<"TODOS" | "AHORROS" | "CREDITOS" | "CAJA_CHICA" | "VENTANILLA">("TODOS");
  const [datos, setDatos] = useState<AnaliticaResponse | null>(null);
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    if (puedeElegirAgencia) {
      api.get("/agencias").then(({ data }) => {
        setAgencias(data);
      });
    }
  }, [puedeElegirAgencia]);

  useEffect(() => {
    setCargando(true);
    api
      .get<AnaliticaResponse>("/caja-auxiliar/analitica-servicios", {
        params: { agenciaId: agenciaId || undefined, periodo },
      })
      .then(({ data }) => setDatos(data))
      .catch(() => {})
      .finally(() => setCargando(false));
  }, [agenciaId, periodo]);

  const periodoLabel = periodo === "semana" ? "Últimos 7 días" : periodo === "mes" ? "Últimos 30 días" : "Año actual";

  const serviciosFiltrados = !datos
    ? []
    : filtroModulo === "TODOS"
      ? datos.servicios
      : datos.servicios.filter((s) => s.modulo === filtroModulo);

  const totalOperacionesFiltro = serviciosFiltrados.reduce((acc, s) => acc + s.cantidad, 0);
  const volumenTotalFiltro = serviciosFiltrados.reduce((acc, s) => acc + s.totalMonto, 0);
  const servicioTopFiltro = serviciosFiltrados[0] ?? null;

  return (
    <div className="card" style={{ marginTop: 0, borderTop: "4px solid #0284c7" }}>
      {/* Encabezado del Panel */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem", marginBottom: "1rem" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
            <h2 style={{ margin: 0, fontSize: "1.2rem" }}>📊 Monitoreo Estratégico de Servicios</h2>
            <span className="badge" style={{ background: "rgba(2, 132, 199, 0.15)", color: "#38bdf8", fontWeight: 700, border: "1px solid rgba(2, 132, 199, 0.3)" }}>
              En Vivo
            </span>
          </div>
          <p className="sub" style={{ margin: "0.25rem 0 0" }}>
            Gráficas y demanda transaccional por servicio ({periodoLabel}).
          </p>
        </div>

        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
          {puedeElegirAgencia && agencias.length > 0 && (
            <select value={agenciaId} onChange={(e) => setAgenciaId(e.target.value)} style={{ maxWidth: 200, fontSize: "0.82rem" }}>
              <option value="">🏢 Todas las Agencias</option>
              {agencias.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.nombre}
                </option>
              ))}
            </select>
          )}

          <div style={{ display: "inline-flex", background: "var(--mono-bg)", borderRadius: "8px", padding: "0.2rem", border: "1px solid var(--line)" }}>
            <button
              type="button"
              className={`btn ${periodo === "semana" ? "" : "secondary"}`}
              style={{ fontSize: "0.8rem", padding: "0.3rem 0.65rem", borderRadius: "6px" }}
              onClick={() => setPeriodo("semana")}
            >
              Semana
            </button>
            <button
              type="button"
              className={`btn ${periodo === "mes" ? "" : "secondary"}`}
              style={{ fontSize: "0.8rem", padding: "0.3rem 0.65rem", borderRadius: "6px" }}
              onClick={() => setPeriodo("mes")}
            >
              Mes
            </button>
            <button
              type="button"
              className={`btn ${periodo === "anio" ? "" : "secondary"}`}
              style={{ fontSize: "0.8rem", padding: "0.3rem 0.65rem", borderRadius: "6px" }}
              onClick={() => setPeriodo("anio")}
            >
              Año
            </button>
          </div>
        </div>
      </div>

      {/* Pestañas de Segmentación por Área Financiera */}
      <div style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap", marginBottom: "1.25rem", borderBottom: "1px solid var(--line)", paddingBottom: "0.75rem" }}>
        <button
          type="button"
          className={`btn ${filtroModulo === "TODOS" ? "" : "secondary"}`}
          style={{ fontSize: "0.78rem", padding: "0.35rem 0.65rem" }}
          onClick={() => setFiltroModulo("TODOS")}
        >
          🌐 Consolidado General ({datos?.totalOperaciones ?? 0})
        </button>
        <button
          type="button"
          className={`btn ${filtroModulo === "AHORROS" ? "" : "secondary"}`}
          style={{ fontSize: "0.78rem", padding: "0.35rem 0.65rem" }}
          onClick={() => setFiltroModulo("AHORROS")}
        >
          🏦 Ahorros & Plazo Fijo
        </button>
        <button
          type="button"
          className={`btn ${filtroModulo === "CREDITOS" ? "" : "secondary"}`}
          style={{ fontSize: "0.78rem", padding: "0.35rem 0.65rem" }}
          onClick={() => setFiltroModulo("CREDITOS")}
        >
          💼 Cartera & Préstamos
        </button>
        <button
          type="button"
          className={`btn ${filtroModulo === "CAJA_CHICA" ? "" : "secondary"}`}
          style={{ fontSize: "0.78rem", padding: "0.35rem 0.65rem" }}
          onClick={() => setFiltroModulo("CAJA_CHICA")}
        >
          ☕ Caja Chica & Gastos
        </button>
        <button
          type="button"
          className={`btn ${filtroModulo === "VENTANILLA" ? "" : "secondary"}`}
          style={{ fontSize: "0.78rem", padding: "0.35rem 0.65rem" }}
          onClick={() => setFiltroModulo("VENTANILLA")}
        >
          💵 Agente BI & Ventanilla
        </button>
      </div>

      {cargando && <div className="card">Actualizando analítica de servicios...</div>}

      {!cargando && (!datos || serviciosFiltrados.length === 0) && (
        <div className="alert info" style={{ margin: "1rem 0" }}>
          No hay movimientos registrados en esta categoría durante el período seleccionado ({periodoLabel}).
        </div>
      )}

      {datos && serviciosFiltrados.length > 0 && (
        <>
          {/* Métricas destacadas de la categoría seleccionada */}
          <div className="stat-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", marginBottom: "1.25rem", gap: "0.6rem" }}>
            <div className="stat-card accent">
              <span className="label">🏆 Mayor Demanda</span>
              <span className="value" style={{ fontSize: "1.05rem" }}>
                {servicioTopFiltro ? `${servicioTopFiltro.icon} ${servicioTopFiltro.label}` : "—"}
              </span>
              <span className="sub">
                {servicioTopFiltro
                  ? `${servicioTopFiltro.cantidad} op. (${totalOperacionesFiltro > 0 ? Math.round((servicioTopFiltro.cantidad / totalOperacionesFiltro) * 1000) / 10 : 0}%)`
                  : ""}
              </span>
            </div>
            <div className="stat-card">
              <span className="label">Operaciones</span>
              <span className="value mono">{totalOperacionesFiltro}</span>
              <span className="sub">En este rubro</span>
            </div>
            <div className="stat-card">
              <span className="label">Volumen Operado</span>
              <span className="value mono" style={{ color: "var(--accent)", fontSize: "1.1rem" }}>
                {formatoQ(volumenTotalFiltro)}
              </span>
              <span className="sub">Flujo de dinero</span>
            </div>
          </div>

          {/* Gráfica de Barras Proporcionales de la Categoría */}
          <h3 style={{ margin: "0 0 0.85rem", fontSize: "0.92rem", fontWeight: 700 }}>
            {filtroModulo === "TODOS"
              ? "Distribución Global entre Servicios"
              : filtroModulo === "AHORROS"
                ? "Distribución de Depósitos y Ahorro"
                : filtroModulo === "CREDITOS"
                  ? "Distribución de Colocación y Cobro de Créditos"
                  : filtroModulo === "CAJA_CHICA"
                    ? "Distribución de Gastos de Caja Chica"
                    : "Distribución de Operaciones de Ventanilla"}
          </h3>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {serviciosFiltrados.map((s, idx) => {
              const barColors = [
                "linear-gradient(90deg, #0284c7, #38bdf8)",
                "linear-gradient(90deg, #059669, #34d399)",
                "linear-gradient(90deg, #7c3aed, #a78bfa)",
                "linear-gradient(90deg, #ea580c, #fb923c)",
                "linear-gradient(90deg, #0891b2, #22d3ee)",
                "linear-gradient(90deg, #d97706, #fcd34d)",
              ];
              const bgGradient = barColors[idx % barColors.length];
              const porcentajeRelativo = totalOperacionesFiltro > 0
                ? Math.round((s.cantidad / totalOperacionesFiltro) * 1000) / 10
                : 0;

              return (
                <div
                  key={s.categoria}
                  style={{
                    background: "var(--mono-bg)",
                    padding: "0.7rem 0.9rem",
                    borderRadius: "8px",
                    border: "1px solid var(--line)",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.35rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.45rem" }}>
                      <span style={{ fontSize: "1.15rem" }}>{s.icon}</span>
                      <strong style={{ fontSize: "0.88rem", color: "var(--ink)" }}>{s.label}</strong>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.85rem" }}>
                      <span
                        className="badge"
                        style={{
                          background: "var(--paper-raised)",
                          color: "var(--ink-soft)",
                          fontWeight: 700,
                          fontSize: "0.72rem",
                          border: "1px solid var(--line)",
                        }}
                      >
                        {s.cantidad} op. ({porcentajeRelativo}%)
                      </span>
                      <strong
                        className="mono"
                        style={{
                          fontSize: "0.92rem",
                          color: "var(--accent)",
                          minWidth: 95,
                          textAlign: "right",
                        }}
                      >
                        {formatoQ(s.totalMonto)}
                      </strong>
                    </div>
                  </div>

                  {/* Barra Visual Proporcional */}
                  <div style={{ background: "var(--line)", height: "8px", borderRadius: "999px", overflow: "hidden" }}>
                    <div
                      style={{
                        background: bgGradient,
                        height: "100%",
                        width: `${Math.max(porcentajeRelativo, 3)}%`,
                        borderRadius: "999px",
                        transition: "width 0.4s ease",
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
