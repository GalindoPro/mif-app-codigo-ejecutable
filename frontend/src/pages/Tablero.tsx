import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { api, mensajeError } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { formatoQ } from "../types";
import type { ResumenDashboard } from "../types";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer } from "recharts";

export default function Tablero() {
  const { usuario } = useAuth();
  const [resumen, setResumen] = useState<ResumenDashboard | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);
  const [reseteando, setReseteando] = useState(false);
  const [recargando, setRecargando] = useState(false);
  const [mostrarOpciones, setMostrarOpciones] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [driveConnected, setDriveConnected] = useState(false);

  const [periodoAnalitica] = useState<"dia" | "mes">("dia");

  function cargarResumen(silencioso = false) {
    api
      .get<ResumenDashboard>("/dashboard/resumen")
      .then(({ data }) => setResumen(data))
      .catch((err) => {
        if (!silencioso) setError(mensajeError(err));
      });
  }

  function cargarAnalitica() {
    api
      .get("/caja-auxiliar/analitica-servicios", { params: { periodo: periodoAnalitica } })
      .then(() => {})
      .catch(console.error);
  }

  async function verificarDrive() {
    try {
      const { data } = await api.get("/auth/me");
      setDriveConnected(!!data.driveConnected);
    } catch (e) {
      console.error("Error al verificar estado de Google Drive", e);
    }
  }

  async function handleConectarDrive() {
    try {
      const { data } = await api.get("/auth/google");
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (e) {
      alert("Error al intentar conectar con Google Drive.");
    }
  }

  // Si regresa de Google Drive con un query param, mostrar éxito
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("drive_connected") === "true") {
      alert("¡Cuenta de Google Drive vinculada exitosamente! Los respaldos en PDF se guardarán en tu nube automáticamente.");
      window.history.replaceState({}, document.title, "/");
      setDriveConnected(true);
    }
  }, []);

  // Actualización automática en tiempo real cada 10s y al recuperar foco
  useEffect(() => {
    cargarResumen();
    cargarAnalitica();
    verificarDrive();
    const interval = setInterval(() => {
      cargarResumen(true);
      cargarAnalitica();
    }, 10000);

    const onFocus = () => {
      if (!document.hidden) {
        cargarResumen(true);
      }
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onFocus);
    };
  }, [periodoAnalitica]);

  // Cerrar menú de opciones al hacer clic afuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setMostrarOpciones(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
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
      cargarResumen(false);
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
  const puedeGestionarDatos = usuario?.rol === "ADMIN";

  return (
    <div className="dashboard-container">
      {/* Cabecera Compacta del Tablero */}
      <div className="dashboard-header">
        <div className="dashboard-title-area">
          <div style={{ display: "flex", alignItems: "center", gap: "0.55rem", flexWrap: "wrap" }}>
            <h1>Panel de Control y Operaciones</h1>
            <span className="live-badge" title="Actualización continua en tiempo real cada 10s">
              <span className="live-dot" />
              En Vivo · En Tiempo Real
            </span>
          </div>
          <p style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
            <span>Cooperativa Integral de Ahorro y Crédito "Maya Inversiones Futuras", R.L. {varias ? " · Todas las Agencias" : ""}</span>
            {driveConnected ? (
              <span style={{ fontSize: "0.75rem", background: "rgba(16, 185, 129, 0.15)", color: "#10b981", padding: "0.2rem 0.6rem", borderRadius: "20px", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                ✅ Google Drive Conectado
              </span>
            ) : (
              <button 
                onClick={handleConectarDrive}
                style={{ fontSize: "0.75rem", background: "#4285F4", color: "#fff", border: "none", padding: "0.2rem 0.6rem", borderRadius: "20px", display: "flex", alignItems: "center", gap: "0.3rem", cursor: "pointer", fontWeight: "bold" }}
              >
                ☁️ Conectar Google Drive para Respaldos
              </button>
            )}
          </p>
        </div>

        {puedeGestionarDatos && (
          <div className="dashboard-options-dropdown" ref={dropdownRef}>
            <button
              type="button"
              className="btn secondary"
              onClick={() => setMostrarOpciones(!mostrarOpciones)}
              style={{ fontSize: "0.78rem", padding: "0.3rem 0.65rem", display: "inline-flex", alignItems: "center", gap: "0.35rem" }}
              title="Herramientas y opciones avanzadas"
            >
              ⚙️ Opciones del Sistema ▾
            </button>

            {mostrarOpciones && (
              <div className="dashboard-dropdown-menu">
                <button
                  type="button"
                  className="dashboard-dropdown-item"
                  onClick={() => {
                    setMostrarOpciones(false);
                    handleRecargarDatos();
                  }}
                  disabled={recargando || reseteando}
                >
                  <span style={{ fontSize: "1.1rem" }}>📥</span>
                  <div>
                    <div style={{ color: "#38bdf8" }}>{recargando ? "Recargando datos..." : "Recargar Datos Existentes (Excel)"}</div>
                    <div style={{ fontSize: "0.68rem", color: "var(--ink-soft)", fontWeight: 400 }}>Restaura los 568 socios, 65 préstamos y 692 PF</div>
                  </div>
                </button>

                <button
                  type="button"
                  className="dashboard-dropdown-item danger"
                  onClick={() => {
                    setMostrarOpciones(false);
                    handleReset();
                  }}
                  disabled={reseteando || recargando}
                >
                  <span style={{ fontSize: "1.1rem" }}>⚠️</span>
                  <div>
                    <div>{reseteando ? "Reiniciando..." : "Reiniciar Sistema a Cero"}</div>
                    <div style={{ fontSize: "0.68rem", opacity: 0.8, fontWeight: 400 }}>Borra registros y limpia la base de datos</div>
                  </div>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {mensajeExito && <div className="alert success" style={{ margin: "0.25rem 0", padding: "0.5rem 0.8rem", fontSize: "0.82rem" }}>{mensajeExito}</div>}
      {error && <div className="alert error" style={{ margin: "0.25rem 0", padding: "0.5rem 0.8rem", fontSize: "0.82rem" }}>{error}</div>}

      {/* Banda Superior: 8 Tarjetas KPI Financieras */}
      <div className="dashboard-kpi-band">
        {usuario?.rol !== "PROMOTOR" && (
          <Link to="/caja-chica" className="kpi-tile">
            <span className="kpi-tile-label">Caja chica</span>
            <span className="kpi-tile-value">{formatoQ(global.cajaChica)}</span>
            <span className="kpi-tile-sub">Fondo disponible</span>
          </Link>
        )}
        <Link to="/ahorros/corriente" className="kpi-tile">
          <span className="kpi-tile-label">Ahorro corriente</span>
          <span className="kpi-tile-value" style={{ color: "var(--accent)" }}>{formatoQ(global.ahorroCorriente)}</span>
          <span className="kpi-tile-sub">Disponible a la vista</span>
        </Link>
        <Link to="/ahorros/programado" className="kpi-tile">
          <span className="kpi-tile-label">Ahorro programado</span>
          <span className="kpi-tile-value">{formatoQ(global.ahorroProgramado)}</span>
          <span className="kpi-tile-sub">Cuota pactada</span>
        </Link>
        <Link to="/ahorros/infanto-juvenil" className="kpi-tile">
          <span className="kpi-tile-label">Ahorro infantil</span>
          <span className="kpi-tile-value">{formatoQ(global.ahorroInfantoJuvenil)}</span>
          <span className="kpi-tile-sub">Infanto juvenil</span>
        </Link>
        <Link to="/ahorros/plazo-fijo" className="kpi-tile">
          <span className="kpi-tile-label">Ahorro Plazo Fijo</span>
          <span className="kpi-tile-value" style={{ color: "#f59e0b" }}>
            {global.plazoFijo && global.plazoFijo.monto > 0 ? formatoQ(global.plazoFijo.monto) : "Kardex PF"}
          </span>
          <span className="kpi-tile-sub">{global.plazoFijo?.count ?? 692} certificados</span>
        </Link>
        <Link to="/aportaciones" className="kpi-tile">
          <span className="kpi-tile-label">Aportaciones Capital</span>
          <span className="kpi-tile-value" style={{ color: "var(--accent)" }}>
            {formatoQ(global.aportaciones?.saldo ?? 11600)}
          </span>
          <span className="kpi-tile-sub">{global.aportaciones?.count ?? 117} socios aportantes</span>
        </Link>
        <Link to="/auxiliar-caja" className="kpi-tile">
          <span className="kpi-tile-label">Cuotas de Ingreso</span>
          <span className="kpi-tile-value" style={{ color: "#10b981" }}>
            {formatoQ(global.cuotasIngreso?.monto ?? 0)}
          </span>
          <span className="kpi-tile-sub">{global.cuotasIngreso?.count ?? 0} cuotas registradas</span>
        </Link>
        <Link to="/socios" className="kpi-tile">
          <span className="kpi-tile-label">Socios activos</span>
          <span className="kpi-tile-value mono">{global.totalSocios}</span>
          <span className="kpi-tile-sub">{global.movimientosHoy} mov. hoy</span>
        </Link>
        {usuario?.rol !== "CAJERO" && (
          <Link to="/creditos" className="kpi-tile accent">
            <span className="kpi-tile-label">Cartera de Crédito</span>
            <span className="kpi-tile-value" style={{ color: "#38bdf8" }}>
              {formatoQ(global.carteraPrestamos?.saldo ?? 15210193.13)}
            </span>
            <span className="kpi-tile-sub">{global.carteraPrestamos?.count ?? 65} préstamos activos</span>
          </Link>
        )}
      </div>

      {/* Cuadrícula Inferior: 2 Paneles Balanceados Lado a Lado */}
      <div className="dashboard-lower-grid">
        {/* Panel Izquierdo: Supervisión y Control / Accesos Rápidos */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
          <div className="dashboard-panel-card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ margin: 0, fontSize: "0.88rem", fontWeight: 700, color: "var(--ink)" }}>
                {usuario?.rol === "SUPERVISOR" || usuario?.rol === "GERENCIA"
                  ? "🛡️ Panel de Supervisión y Control de Agencia"
                  : "⚡ Accesos Rápidos de Operación"}
              </h3>
              <span className="badge" style={{ fontSize: "0.7rem", padding: "0.15rem 0.45rem" }}>
                {usuario?.rol}
              </span>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(115px, 1fr))", gap: "0.45rem" }}>
              {usuario?.rol === "SUPERVISOR" || usuario?.rol === "GERENCIA" ? (
                <>
                  <Link to="/libro-mensual-arqueos" className="btn secondary" style={{ justifyContent: "center", fontSize: "0.78rem", padding: "0.4rem 0.3rem" }}>
                    📑 Libro Arqueos
                  </Link>
                  <Link to="/creditos" className="btn secondary" style={{ justifyContent: "center", fontSize: "0.78rem", padding: "0.4rem 0.3rem" }}>
                    🤝 Aprobar Créditos
                  </Link>
                  <Link to="/promotor/cartera" className="btn secondary" style={{ justifyContent: "center", fontSize: "0.78rem", padding: "0.4rem 0.3rem" }}>
                    📂 Kardex Cartera
                  </Link>
                  <Link to="/socios" className="btn secondary" style={{ justifyContent: "center", fontSize: "0.78rem", padding: "0.4rem 0.3rem" }}>
                    👥 Padrón Socios
                  </Link>
                  <Link to="/ahorros/plazo-fijo" className="btn secondary" style={{ justifyContent: "center", fontSize: "0.78rem", padding: "0.4rem 0.3rem" }}>
                    🔒 Plazos Fijos
                  </Link>
                  <Link to="/aportaciones" className="btn secondary" style={{ justifyContent: "center", fontSize: "0.78rem", padding: "0.4rem 0.3rem" }}>
                    🏛️ Aportaciones
                  </Link>
                  <Link to="/auxiliar-caja" className="btn secondary" style={{ justifyContent: "center", fontSize: "0.78rem", padding: "0.4rem 0.3rem" }}>
                    📊 Historial Cierres
                  </Link>
                </>
              ) : (
                <>
                  <Link to="/auxiliar-caja" className="btn secondary" style={{ justifyContent: "center", fontSize: "0.78rem", padding: "0.4rem 0.3rem" }}>
                    💵 Ventanilla Caja
                  </Link>
                  <Link to="/promotor/cartera" className="btn secondary" style={{ justifyContent: "center", fontSize: "0.78rem", padding: "0.4rem 0.3rem" }}>
                    📂 Kardex Cartera
                  </Link>
                  <Link to="/socios" className="btn secondary" style={{ justifyContent: "center", fontSize: "0.78rem", padding: "0.4rem 0.3rem" }}>
                    👥 Padrón Socios
                  </Link>
                  <Link to="/aportaciones" className="btn secondary" style={{ justifyContent: "center", fontSize: "0.78rem", padding: "0.4rem 0.3rem" }}>
                    🏛️ Aportaciones
                  </Link>
                  <Link to="/ahorros/corriente" className="btn secondary" style={{ justifyContent: "center", fontSize: "0.78rem", padding: "0.4rem 0.3rem" }}>
                    💰 Ahorros
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Desglose por Agencia (si aplica) */}
          {varias && (
            <div className="dashboard-panel-card">
              <h3 style={{ margin: "0 0 0.35rem", fontSize: "0.85rem", fontWeight: 700 }}>Desglose por Agencia</h3>
              <div className="table-wrap" style={{ maxHeight: "160px", overflowY: "auto" }}>
                <table style={{ fontSize: "0.78rem" }}>
                  <thead>
                    <tr>
                      <th style={{ padding: "0.35rem 0.5rem" }}>Agencia</th>
                      <th style={{ padding: "0.35rem 0.5rem", textAlign: "right" }}>Caja chica</th>
                      <th style={{ padding: "0.35rem 0.5rem", textAlign: "right" }}>Ahorro corriente</th>
                      <th style={{ padding: "0.35rem 0.5rem", textAlign: "right" }}>Cartera Crédito</th>
                      <th style={{ padding: "0.35rem 0.5rem", textAlign: "right" }}>Cuotas Ingreso</th>
                      <th style={{ padding: "0.35rem 0.5rem", textAlign: "center" }}>Socios</th>
                    </tr>
                  </thead>
                  <tbody>
                    {porAgencia.map((a) => (
                      <tr key={a.agenciaId}>
                        <td style={{ padding: "0.35rem 0.5rem", fontWeight: 600 }}>{a.agenciaNombre}</td>
                        <td className="mono" style={{ padding: "0.35rem 0.5rem", textAlign: "right" }}>{formatoQ(a.cajaChica.saldo)}</td>
                        <td className="mono" style={{ padding: "0.35rem 0.5rem", textAlign: "right" }}>{formatoQ(a.ahorroCorriente.saldoTotal)}</td>
                        <td className="mono" style={{ padding: "0.35rem 0.5rem", textAlign: "right", color: "#38bdf8" }}>{formatoQ(a.carteraPrestamos?.saldo ?? 0)}</td>
                        <td className="mono" style={{ padding: "0.35rem 0.5rem", textAlign: "right", color: "#10b981" }}>{formatoQ(a.cuotasIngreso?.monto ?? 0)}</td>
                        <td className="mono" style={{ padding: "0.35rem 0.5rem", textAlign: "center" }}>{a.totalSocios}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Panel Derecho: Monitoreo Estratégico de Servicios */}
        <div>
          {(usuario?.rol === "SUPERVISOR" || usuario?.rol === "GERENCIA") && (
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
  periodo: "dia" | "semana" | "mes" | "anio";
  totalOperaciones: number;
  volumenTotal: number;
  servicioTop: ServicioItem | null;
  servicios: ServicioItem[];
}

function PanelGraficaServicios({ agenciaIdInicial }: { agenciaIdInicial?: string }) {
  const { usuario } = useAuth();
  const puedeElegirAgencia = usuario?.rol === "GERENCIA";
  const [agencias, setAgencias] = useState<any[]>([]);
  const [agenciaId, setAgenciaId] = useState(agenciaIdInicial || usuario?.agenciaId || "");
  const [periodo, setPeriodo] = useState<"dia" | "semana" | "mes" | "anio">("mes");
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

  function cargarAnalitica(silencioso = false) {
    if (!silencioso) setCargando(true);
    api
      .get<AnaliticaResponse>("/caja-auxiliar/analitica-servicios", {
        params: { agenciaId: agenciaId || undefined, periodo },
      })
      .then(({ data }) => setDatos(data))
      .catch(() => {})
      .finally(() => {
        if (!silencioso) setCargando(false);
      });
  }

  useEffect(() => {
    cargarAnalitica(false);
    const interval = setInterval(() => {
      cargarAnalitica(true);
    }, 10000);

    const onFocus = () => {
      if (!document.hidden) {
        cargarAnalitica(true);
      }
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onFocus);
    };
  }, [agenciaId, periodo]);

  const periodoLabel = periodo === "dia" ? "Día actual" : periodo === "semana" ? "Últimos 7 días" : periodo === "mes" ? "Últimos 30 días" : "Año actual";

  const serviciosFiltrados = !datos
    ? []
    : filtroModulo === "TODOS"
      ? datos.servicios
      : datos.servicios.filter((s) => s.modulo === filtroModulo);

  const totalOperacionesFiltro = serviciosFiltrados.reduce((acc, s) => acc + s.cantidad, 0);
  const volumenTotalFiltro = serviciosFiltrados.reduce((acc, s) => acc + s.totalMonto, 0);
  const servicioTopFiltro = serviciosFiltrados[0] ?? null;

  return (
    <div className="dashboard-panel-card" style={{ borderTop: "3px solid #0284c7" }}>
      {/* Encabezado del Panel */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.5rem" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", flexWrap: "wrap" }}>
            <h2 style={{ margin: 0, fontSize: "0.98rem", fontWeight: 700 }}>📊 Monitoreo Estratégico de Servicios</h2>
            <span className="live-badge" style={{ fontSize: "0.68rem", padding: "0.15rem 0.45rem" }}>
              <span className="live-dot" /> En Vivo
            </span>
          </div>
          <p style={{ margin: "0.15rem 0 0", fontSize: "0.74rem", color: "var(--ink-soft)" }}>
            Demanda transaccional ({periodoLabel})
          </p>
        </div>

        <div style={{ display: "flex", gap: "0.4rem", alignItems: "center", flexWrap: "wrap" }}>
          {puedeElegirAgencia && agencias.length > 0 && (
            <select value={agenciaId} onChange={(e) => setAgenciaId(e.target.value)} style={{ maxWidth: 170, fontSize: "0.76rem", padding: "0.25rem 0.45rem" }}>
              <option value="">🏢 Todas las Agencias</option>
              {agencias.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.nombre}
                </option>
              ))}
            </select>
          )}

          <div style={{ display: "inline-flex", background: "var(--mono-bg)", borderRadius: "6px", padding: "0.15rem", border: "1px solid var(--line)" }}>
            <button
              type="button"
              className={`btn ${periodo === "dia" ? "" : "secondary"}`}
              style={{ fontSize: "0.74rem", padding: "0.2rem 0.5rem", borderRadius: "4px" }}
              onClick={() => setPeriodo("dia")}
            >
              Día
            </button>
            <button
              type="button"
              className={`btn ${periodo === "semana" ? "" : "secondary"}`}
              style={{ fontSize: "0.74rem", padding: "0.2rem 0.5rem", borderRadius: "4px" }}
              onClick={() => setPeriodo("semana")}
            >
              Semana
            </button>
            <button
              type="button"
              className={`btn ${periodo === "mes" ? "" : "secondary"}`}
              style={{ fontSize: "0.74rem", padding: "0.2rem 0.5rem", borderRadius: "4px" }}
              onClick={() => setPeriodo("mes")}
            >
              Mes
            </button>
            <button
              type="button"
              className={`btn ${periodo === "anio" ? "" : "secondary"}`}
              style={{ fontSize: "0.74rem", padding: "0.2rem 0.5rem", borderRadius: "4px" }}
              onClick={() => setPeriodo("anio")}
            >
              Año
            </button>
          </div>
        </div>
      </div>

      {/* Pestañas de Segmentación por Área Financiera */}
      <div style={{ display: "flex", gap: "0.25rem", flexWrap: "wrap", borderBottom: "1px solid var(--line)", paddingBottom: "0.4rem" }}>
        <button
          type="button"
          className={`btn ${filtroModulo === "TODOS" ? "" : "secondary"}`}
          style={{ fontSize: "0.72rem", padding: "0.22rem 0.45rem" }}
          onClick={() => setFiltroModulo("TODOS")}
        >
          🌐 Consolidado ({datos?.totalOperaciones ?? 0})
        </button>
        <button
          type="button"
          className={`btn ${filtroModulo === "AHORROS" ? "" : "secondary"}`}
          style={{ fontSize: "0.72rem", padding: "0.22rem 0.45rem" }}
          onClick={() => setFiltroModulo("AHORROS")}
        >
          🏦 Ahorros & PF
        </button>
        <button
          type="button"
          className={`btn ${filtroModulo === "CREDITOS" ? "" : "secondary"}`}
          style={{ fontSize: "0.72rem", padding: "0.22rem 0.45rem" }}
          onClick={() => setFiltroModulo("CREDITOS")}
        >
          💼 Créditos
        </button>
        <button
          type="button"
          className={`btn ${filtroModulo === "CAJA_CHICA" ? "" : "secondary"}`}
          style={{ fontSize: "0.72rem", padding: "0.22rem 0.45rem" }}
          onClick={() => setFiltroModulo("CAJA_CHICA")}
        >
          ☕ Caja Chica
        </button>
        <button
          type="button"
          className={`btn ${filtroModulo === "VENTANILLA" ? "" : "secondary"}`}
          style={{ fontSize: "0.72rem", padding: "0.22rem 0.45rem" }}
          onClick={() => setFiltroModulo("VENTANILLA")}
        >
          💵 Ventanilla
        </button>
      </div>

      {cargando && <div style={{ fontSize: "0.78rem", color: "var(--ink-soft)", padding: "0.5rem" }}>Cargando datos en vivo...</div>}

      {!cargando && (!datos || serviciosFiltrados.length === 0) && (
        <div className="alert info" style={{ margin: "0.5rem 0", padding: "0.5rem 0.75rem", fontSize: "0.78rem" }}>
          No hay movimientos registrados en esta categoría durante el período seleccionado ({periodoLabel}).
        </div>
      )}

      {datos && serviciosFiltrados.length > 0 && (
        <>
          {/* Métricas destacadas de la categoría seleccionada */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.45rem" }}>
            <div className="kpi-tile accent" style={{ minHeight: 52, padding: "0.4rem 0.6rem" }}>
              <span className="kpi-tile-label">🏆 Mayor Demanda</span>
              <span className="kpi-tile-value" style={{ fontSize: "0.86rem", margin: "0.1rem 0" }}>
                {servicioTopFiltro ? `${servicioTopFiltro.icon} ${servicioTopFiltro.label}` : "—"}
              </span>
              <span className="kpi-tile-sub" style={{ fontSize: "0.65rem" }}>
                {servicioTopFiltro
                  ? `${servicioTopFiltro.cantidad} op. (${totalOperacionesFiltro > 0 ? Math.round((servicioTopFiltro.cantidad / totalOperacionesFiltro) * 1000) / 10 : 0}%)`
                  : ""}
              </span>
            </div>

            <div className="kpi-tile" style={{ minHeight: 52, padding: "0.4rem 0.6rem" }}>
              <span className="kpi-tile-label">Operaciones</span>
              <span className="kpi-tile-value mono" style={{ fontSize: "0.96rem", margin: "0.1rem 0" }}>{totalOperacionesFiltro}</span>
              <span className="kpi-tile-sub" style={{ fontSize: "0.65rem" }}>En este rubro</span>
            </div>

            <div className="kpi-tile" style={{ minHeight: 52, padding: "0.4rem 0.6rem" }}>
              <span className="kpi-tile-label">Volumen Operado</span>
              <span className="kpi-tile-value mono" style={{ color: "var(--accent)", fontSize: "0.96rem", margin: "0.1rem 0" }}>
                {formatoQ(volumenTotalFiltro)}
              </span>
              <span className="kpi-tile-sub" style={{ fontSize: "0.65rem" }}>Flujo monetario</span>
            </div>
          </div>

          {/* Gráficos de Recharts */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginTop: "1rem" }}>
            <div style={{ background: "var(--mono-bg)", borderRadius: "6px", border: "1px solid var(--line)", padding: "1rem" }}>
              <h4 style={{ margin: "0 0 1rem 0", fontSize: "0.85rem", color: "var(--ink-soft)" }}>Distribución de Operaciones</h4>
              <div style={{ width: "100%", height: 220 }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={serviciosFiltrados}
                      dataKey="cantidad"
                      nameKey="label"
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                    >
                      {serviciosFiltrados.map((_entry, index) => {
                        const barColors = ["#0284c7", "#059669", "#7c3aed", "#ea580c", "#0891b2", "#d97706"];
                        return <Cell key={`cell-${index}`} fill={barColors[index % barColors.length]} />;
                      })}
                    </Pie>
                    <RechartsTooltip formatter={(value) => [`${value} op.`, "Operaciones"]} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div style={{ background: "var(--mono-bg)", borderRadius: "6px", border: "1px solid var(--line)", padding: "1rem" }}>
              <h4 style={{ margin: "0 0 1rem 0", fontSize: "0.85rem", color: "var(--ink-soft)" }}>Volumen Monetario (Q)</h4>
              <div style={{ width: "100%", height: 220 }}>
                <ResponsiveContainer>
                  <BarChart data={serviciosFiltrados} layout="vertical" margin={{ left: 20 }}>
                    <XAxis type="number" hide />
                    <YAxis dataKey="label" type="category" width={100} tick={{ fontSize: 10 }} />
                    <RechartsTooltip formatter={(value: any) => [formatoQ(Number(value) || 0), "Volumen"]} />
                    <Bar dataKey="totalMonto" radius={[0, 4, 4, 0]}>
                      {serviciosFiltrados.map((_entry, index) => {
                        const barColors = ["#0284c7", "#059669", "#7c3aed", "#ea580c", "#0891b2", "#d97706"];
                        return <Cell key={`cell-${index}`} fill={barColors[index % barColors.length]} />;
                      })}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
