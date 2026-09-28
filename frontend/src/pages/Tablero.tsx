import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { api, mensajeError } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { formatoQ } from "../types";
import type { ResumenDashboard } from "../types";
import DiagnosticoGerencialReporteModal from "../components/DiagnosticoGerencialReporteModal";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  Legend,
} from "recharts";

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

  const cargandoRef = useRef(false);

  function cargarResumen(silencioso = false) {
    if (cargandoRef.current) return;
    cargandoRef.current = true;
    api
      .get<ResumenDashboard>("/dashboard/resumen")
      .then(({ data }) => setResumen(data))
      .catch((err) => {
        if (!silencioso) setError(mensajeError(err));
      })
      .finally(() => {
        cargandoRef.current = false;
      });
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

  // Actualización automática en tiempo real cada 30s y al recuperar foco
  useEffect(() => {
    cargarResumen();
    verificarDrive();
    const interval = setInterval(() => {
      cargarResumen(true);
    }, 30000);

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
  }, []);

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
            <span>COOPERATIVA MAYA INVERSIONES FUTURAS R.L. "COMIF-R.L."{varias ? " · Todas las Agencias" : ""}</span>
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

      {/* Banda Superior: 8 Tarjetas KPI Financieras con Iconos y Acentos de Color */}
      <div className="dashboard-kpi-band">
        <Link to="/aportaciones" className="kpi-tile" style={{ borderLeft: "3px solid #059669" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span className="kpi-tile-label">Aportaciones Capital</span>
            <span style={{ fontSize: "0.85rem" }}>🏛️</span>
          </div>
          <span className="kpi-tile-value" style={{ color: "#059669" }}>
            {formatoQ(global.aportaciones?.saldo ?? 11600)}
          </span>
          <span className="kpi-tile-sub">{global.aportaciones?.count ?? 117} socios aportantes</span>
        </Link>

        <Link to="/ahorros/corriente" className="kpi-tile" style={{ borderLeft: "3px solid #0284c7" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span className="kpi-tile-label">Ahorro Corriente</span>
            <span style={{ fontSize: "0.85rem" }}>💰</span>
          </div>
          <span className="kpi-tile-value" style={{ color: "var(--accent)" }}>{formatoQ(global.ahorroCorriente)}</span>
          <span className="kpi-tile-sub">Disponible a la vista</span>
        </Link>

        <Link to="/ahorros/plazo-fijo" className="kpi-tile" style={{ borderLeft: "3px solid #7c3aed" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span className="kpi-tile-label">Plazo Fijo (DPF)</span>
            <span style={{ fontSize: "0.85rem" }}>🔒</span>
          </div>
          <span className="kpi-tile-value" style={{ color: "#7c3aed" }}>
            {global.plazoFijo && global.plazoFijo.monto > 0 ? formatoQ(global.plazoFijo.monto) : "Kardex PF"}
          </span>
          <span className="kpi-tile-sub">{global.plazoFijo?.count ?? 692} certificados activos</span>
        </Link>

        {usuario?.rol !== "CAJERO" ? (
          <Link to="/creditos" className="kpi-tile" style={{ borderLeft: "3px solid #38bdf8" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span className="kpi-tile-label">Cartera de Crédito</span>
              <span style={{ fontSize: "0.85rem" }}>💼</span>
            </div>
            <span className="kpi-tile-value" style={{ color: "#0284c7" }}>
              {formatoQ(global.carteraPrestamos?.saldo ?? 15210193.13)}
            </span>
            <span className="kpi-tile-sub">{global.carteraPrestamos?.count ?? 65} préstamos activos</span>
          </Link>
        ) : (
          <Link to="/ahorros/programado" className="kpi-tile" style={{ borderLeft: "3px solid #0891b2" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span className="kpi-tile-label">Ahorro Programado</span>
              <span style={{ fontSize: "0.85rem" }}>📅</span>
            </div>
            <span className="kpi-tile-value">{formatoQ(global.ahorroProgramado)}</span>
            <span className="kpi-tile-sub">Cuotas pactadas</span>
          </Link>
        )}

        {usuario?.rol !== "PROMOTOR" && (
          <Link to="/caja-chica" className="kpi-tile" style={{ borderLeft: "3px solid #f59e0b" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span className="kpi-tile-label">Caja Chica</span>
              <span style={{ fontSize: "0.85rem" }}>☕</span>
            </div>
            <span className="kpi-tile-value" style={{ color: "#d97706" }}>{formatoQ(global.cajaChica)}</span>
            <span className="kpi-tile-sub">Fondo disponible</span>
          </Link>
        )}

        <Link to="/auxiliar-caja" className="kpi-tile" style={{ borderLeft: "3px solid #10b981" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span className="kpi-tile-label">Cuotas de Ingreso</span>
            <span style={{ fontSize: "0.85rem" }}>🎫</span>
          </div>
          <span className="kpi-tile-value" style={{ color: "#10b981" }}>
            {formatoQ(global.cuotasIngreso?.monto ?? 0)}
          </span>
          <span className="kpi-tile-sub">{global.cuotasIngreso?.count ?? 0} registradas en caja</span>
        </Link>

        <Link to="/ahorros/infanto-juvenil" className="kpi-tile" style={{ borderLeft: "3px solid #ec4899" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span className="kpi-tile-label">Ahorro Infantil</span>
            <span style={{ fontSize: "0.85rem" }}>👶</span>
          </div>
          <span className="kpi-tile-value" style={{ color: "#ec4899" }}>{formatoQ(global.ahorroInfantoJuvenil)}</span>
          <span className="kpi-tile-sub">Infanto juvenil</span>
        </Link>

        <Link to="/socios" className="kpi-tile" style={{ borderLeft: "3px solid #6366f1" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span className="kpi-tile-label">Membresía / Socios</span>
            <span style={{ fontSize: "0.85rem" }}>👥</span>
          </div>
          <span className="kpi-tile-value mono" style={{ color: "#6366f1" }}>{global.totalSocios}</span>
          <span className="kpi-tile-sub">{global.movimientosHoy} mov. registrados hoy</span>
        </Link>
      </div>

      {/* Panel Panorámico de Monitoreo Estratégico & Analítica Financiera */}
      <div className="dashboard-lower-grid">
        {(usuario?.rol === "SUPERVISOR" || usuario?.rol === "GERENCIA" || usuario?.rol === "ADMIN") && (
          <PanelGraficaServicios agenciaIdInicial={usuario?.agenciaId ?? undefined} />
        )}

        {/* Desglose por Agencia (si aplica más de 1 agencia) */}
        {varias && (
          <div className="dashboard-panel-card" style={{ padding: "0.65rem 0.85rem", marginTop: "0.25rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.35rem" }}>
              <h3 style={{ margin: 0, fontSize: "0.84rem", fontWeight: 700 }}>🏢 Estado en Vivo por Agencia</h3>
              <span style={{ fontSize: "0.68rem", color: "var(--ink-soft)" }}>{porAgencia.length} agencias</span>
            </div>
            <div className="table-wrap" style={{ maxHeight: "140px", overflowY: "auto", border: "1px solid var(--line)", borderRadius: "6px" }}>
              <table style={{ fontSize: "0.76rem", width: "100%", margin: 0 }}>
                <thead>
                  <tr style={{ background: "var(--paper-raised)" }}>
                    <th style={{ padding: "3px 6px" }}>Agencia</th>
                    <th style={{ padding: "3px 6px", textAlign: "right" }}>Caja chica</th>
                    <th style={{ padding: "3px 6px", textAlign: "right" }}>Ahorro corriente</th>
                    <th style={{ padding: "3px 6px", textAlign: "right" }}>Cartera Crédito</th>
                    <th style={{ padding: "3px 6px", textAlign: "center" }}>Socios</th>
                  </tr>
                </thead>
                <tbody>
                  {porAgencia.map((a) => (
                    <tr key={a.agenciaId}>
                      <td style={{ padding: "3px 6px", fontWeight: 600 }}>{a.agenciaNombre}</td>
                      <td className="mono" style={{ padding: "3px 6px", textAlign: "right" }}>{formatoQ(a.cajaChica.saldo)}</td>
                      <td className="mono" style={{ padding: "3px 6px", textAlign: "right", color: "var(--accent)" }}>{formatoQ(a.ahorroCorriente.saldoTotal)}</td>
                      <td className="mono" style={{ padding: "3px 6px", textAlign: "right", color: "#0284c7" }}>{formatoQ(a.carteraPrestamos?.saldo ?? 0)}</td>
                      <td className="mono" style={{ padding: "3px 6px", textAlign: "center" }}>{a.totalSocios}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

interface ServicioItem {
  categoria: string;
  producto: string;
  modulo?: string;
  flujo: "INGRESO" | "EGRESO";
  label: string;
  icon: string;
  cantidad: number;
  totalMonto: number;
  porcentaje: number;
}

interface PuntoTendencia {
  fecha: string;
  label: string;
  ingresos: number;
  egresos: number;
  neto: number;
  operaciones: number;
}

interface AnaliticaResponse {
  periodo: "dia" | "semana" | "mes" | "anio";
  totalOperaciones: number;
  volumenTotal: number;
  totalIngresos: number;
  totalEgresos: number;
  flujoNeto: number;
  operacionesIngreso: number;
  operacionesEgreso: number;
  servicioTop: ServicioItem | null;
  servicios: ServicioItem[];
  tendenciaTemporal: PuntoTendencia[];
}

function PanelGraficaServicios({ agenciaIdInicial }: { agenciaIdInicial?: string }) {
  const { usuario } = useAuth();
  const puedeElegirAgencia = usuario?.rol === "GERENCIA";
  const [agencias, setAgencias] = useState<any[]>([]);
  const [agenciaId, setAgenciaId] = useState(agenciaIdInicial || usuario?.agenciaId || "");
  const [modoTemporal, setModoTemporal] = useState<"RAPIDO" | "MES" | "RANGO">("MES");
  const [periodo, setPeriodo] = useState<"dia" | "semana" | "mes" | "anio">("mes");
  const [mesSeleccionado, setMesSeleccionado] = useState<string>("2026-07");
  const [rangoInicio, setRangoInicio] = useState<string>("2026-07-01");
  const [rangoFin, setRangoFin] = useState<string>("2026-07-31");
  const [filtroCuenta, setFiltroCuenta] = useState<string>("TODOS");
  const [modoVista, setModoVista] = useState<"BALANCE" | "TENDENCIA">("BALANCE");
  const [datos, setDatos] = useState<AnaliticaResponse | null>(null);
  const [cargando, setCargando] = useState(false);
  const [mostrarReporteModal, setMostrarReporteModal] = useState(false);
  const [mostrarInputOtroMes, setMostrarInputOtroMes] = useState(false);

  const MESES_HISTORICOS = [
    { id: "2026-09", label: "Septiembre 2026" },
    { id: "2026-08", label: "Agosto 2026" },
    { id: "2026-07", label: "Julio 2026" },
    { id: "2026-06", label: "Junio 2026" },
    { id: "2026-05", label: "Mayo 2026" },
    { id: "2026-04", label: "Abril 2026" },
    { id: "2026-03", label: "Marzo 2026" },
    { id: "2026-02", label: "Febrero 2026" },
    { id: "2026-01", label: "Enero 2026" },
  ];

  useEffect(() => {
    if (puedeElegirAgencia) {
      api.get("/agencias").then(({ data }) => {
        setAgencias(data);
      });
    }
  }, [puedeElegirAgencia]);

  function cargarAnalitica(silencioso = false) {
    if (!silencioso) setCargando(true);
    const queryParams: any = { agenciaId: agenciaId || undefined };
    if (modoTemporal === "RAPIDO") {
      queryParams.periodo = periodo;
    } else if (modoTemporal === "MES") {
      queryParams.periodo = "mes";
      queryParams.mes = mesSeleccionado;
    } else if (modoTemporal === "RANGO") {
      queryParams.periodo = "personalizado";
      queryParams.fechaInicio = rangoInicio;
      queryParams.fechaFin = rangoFin;
    }

    api
      .get<AnaliticaResponse>("/caja-auxiliar/analitica-servicios", {
        params: queryParams,
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
  }, [agenciaId, periodo, modoTemporal, mesSeleccionado, rangoInicio, rangoFin]);

  const periodoLabel =
    modoTemporal === "MES"
      ? (() => {
          const m = MESES_HISTORICOS.find((x) => x.id === mesSeleccionado);
          return m ? m.label : `Mes ${mesSeleccionado}`;
        })()
      : modoTemporal === "RANGO"
        ? `Del ${rangoInicio || "..."} al ${rangoFin || "..."}`
        : periodo === "dia"
          ? "Día actual"
          : periodo === "semana"
            ? "Últimos 7 días"
            : periodo === "mes"
              ? "Últimos 30 días"
              : "Año actual";

  // Fecha de corte recomendada para auditar estados financieros
  const fechaCorteAuditoria =
    modoTemporal === "MES"
      ? (() => {
          const [y, m] = mesSeleccionado.split("-").map(Number);
          const lastDay = new Date(y, m, 0).getDate();
          return `${mesSeleccionado}-${String(lastDay).padStart(2, "0")}`;
        })()
      : modoTemporal === "RANGO"
        ? rangoFin || new Date().toISOString().split("T")[0]
        : new Date().toISOString().split("T")[0];

  // Filtrado específico por producto / cuenta
  const serviciosFiltrados = !datos
    ? []
    : filtroCuenta === "TODOS"
      ? datos.servicios
      : datos.servicios.filter((s) => s.producto === filtroCuenta);

  const totalOperacionesFiltro = serviciosFiltrados.reduce((acc, s) => acc + s.cantidad, 0);
  const volumenTotalFiltro = serviciosFiltrados.reduce((acc, s) => acc + s.totalMonto, 0);
  const totalIngresosFiltro = serviciosFiltrados.filter((s) => s.flujo === "INGRESO").reduce((acc, s) => acc + s.totalMonto, 0);
  const totalEgresosFiltro = serviciosFiltrados.filter((s) => s.flujo === "EGRESO").reduce((acc, s) => acc + s.totalMonto, 0);
  const opIngresosFiltro = serviciosFiltrados.filter((s) => s.flujo === "INGRESO").reduce((acc, s) => acc + s.cantidad, 0);
  const opEgresosFiltro = serviciosFiltrados.filter((s) => s.flujo === "EGRESO").reduce((acc, s) => acc + s.cantidad, 0);
  const flujoNetoFiltro = totalIngresosFiltro - totalEgresosFiltro;
  const servicioTopFiltro = serviciosFiltrados[0] ?? null;

  // Diagnóstico financiero para toma de decisiones de Gerencia
  const ratioSalida = totalIngresosFiltro > 0 ? (totalEgresosFiltro / totalIngresosFiltro) * 100 : totalEgresosFiltro > 0 ? 999 : 0;
  const depositosAhorro = serviciosFiltrados
    .filter((s) => s.producto.startsWith("AHORRO") && s.flujo === "INGRESO")
    .reduce((acc, s) => acc + s.totalMonto, 0);
  const retirosAhorro = serviciosFiltrados
    .filter((s) => s.producto.startsWith("AHORRO") && s.flujo === "EGRESO")
    .reduce((acc, s) => acc + s.totalMonto, 0);
  const cobroCreditos = serviciosFiltrados
    .filter((s) => s.flujo === "INGRESO" && (s.producto === "CREDITOS" || s.categoria?.includes("PRESTAMO") || s.label?.toLowerCase().includes("abono") || s.label?.toLowerCase().includes("prestamo")))
    .reduce((acc, s) => acc + s.totalMonto, 0);
  const desembolsoCreditos = serviciosFiltrados
    .filter((s) => s.flujo === "EGRESO" && (s.producto === "CREDITOS" || s.categoria?.includes("PRESTAMO") || s.label?.toLowerCase().includes("desembolso")))
    .reduce((acc, s) => acc + s.totalMonto, 0);
  const gastoCajaChica = serviciosFiltrados
    .filter((s) => s.producto === "CAJA_CHICA" || s.categoria?.includes("CHICA") || s.label?.toLowerCase().includes("chica"))
    .reduce((acc, s) => acc + s.totalMonto, 0);

  // Cuentas disponibles con sus conteos
  const CUENTAS_OPCIONES = [
    { id: "TODOS", label: "Consolidado General", icon: "🌐" },
    { id: "AHORRO_CORRIENTE", label: "Ahorro Corriente", icon: "💰" },
    { id: "AHORRO_PROGRAMADO", label: "Ahorro Programado", icon: "📅" },
    { id: "AHORRO_INFANTIL", label: "Ahorro Infantil", icon: "🧒" },
    { id: "AHORRO_SOBRE_PRESTAMO", label: "Ahorro s/Préstamo", icon: "🛡️" },
    { id: "PLAZO_FIJO", label: "Plazo Fijo (DPF)", icon: "🔒" },
    { id: "APORTACIONES", label: "Aportaciones", icon: "🏛️" },
    { id: "CREDITOS", label: "Cartera Créditos", icon: "💼" },
    { id: "AGENTE_BI", label: "Agente BI & Servicios", icon: "🏦" },
    { id: "CAJA_CHICA", label: "Caja Chica", icon: "☕" },
    { id: "VENTANILLA_TESORERIA", label: "Tesorería & Ventanilla", icon: "💵" },
  ];

  return (
    <div className="dashboard-panel-card" style={{ borderTop: "3px solid #0284c7" }}>
      {/* Encabezado Superior: Título, Filtros Temporales y Selector de Modo */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.5rem" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", flexWrap: "wrap" }}>
            <h2 style={{ margin: 0, fontSize: "0.98rem", fontWeight: 700 }}>📊 Inteligencia y Analítica Financiera por Cuenta</h2>
            <span className="live-badge" style={{ fontSize: "0.68rem", padding: "0.15rem 0.45rem" }}>
              <span className="live-dot" /> En Vivo
            </span>
          </div>
          <p style={{ margin: "0.15rem 0 0", fontSize: "0.74rem", color: "var(--ink-soft)" }}>
            Auditoría de movimientos, debilidades y flujo de caja (<strong>{periodoLabel}</strong>)
          </p>
        </div>

        <div style={{ display: "flex", gap: "0.4rem", alignItems: "center", flexWrap: "wrap" }}>
          {puedeElegirAgencia && agencias.length > 0 && (
            <select value={agenciaId} onChange={(e) => setAgenciaId(e.target.value)} style={{ maxWidth: 160, fontSize: "0.75rem", padding: "0.22rem 0.45rem" }}>
              <option value="">🏢 Todas las Agencias</option>
              {agencias.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.nombre}
                </option>
              ))}
            </select>
          )}

          {/* Conmutador de Modo Temporal: Rápido vs Por Mes vs Rango Libre */}
          <div style={{ display: "inline-flex", background: "var(--mono-bg)", borderRadius: "6px", padding: "0.15rem", border: "1px solid var(--line)" }}>
            <button
              type="button"
              className={`btn btn-xs ${modoTemporal === "MES" ? "" : "secondary"}`}
              style={{ fontSize: "0.73rem", padding: "0.2rem 0.45rem", borderRadius: "4px" }}
              onClick={() => setModoTemporal("MES")}
              title="Analizar un mes histórico completo (Enero a Julio 2026 o posterior)"
            >
              📅 Por Mes
            </button>
            <button
              type="button"
              className={`btn btn-xs ${modoTemporal === "RANGO" ? "" : "secondary"}`}
              style={{ fontSize: "0.73rem", padding: "0.2rem 0.45rem", borderRadius: "4px" }}
              onClick={() => setModoTemporal("RANGO")}
              title="Filtro libre desde fecha inicio hasta fecha fin"
            >
              📆 Rango Libre
            </button>
            <button
              type="button"
              className={`btn btn-xs ${modoTemporal === "RAPIDO" ? "" : "secondary"}`}
              style={{ fontSize: "0.73rem", padding: "0.2rem 0.45rem", borderRadius: "4px" }}
              onClick={() => setModoTemporal("RAPIDO")}
              title="Filtros relativos (Día, Semana, 30 días, Año)"
            >
              ⚡ Rápido
            </button>
          </div>

          {/* Controles según Modo Temporal */}
          {modoTemporal === "MES" && (
            <div style={{ display: "inline-flex", gap: "0.3rem", alignItems: "center" }}>
              <select
                value={mostrarInputOtroMes ? "OTRO" : mesSeleccionado}
                onChange={(e) => {
                  if (e.target.value === "OTRO") {
                    setMostrarInputOtroMes(true);
                  } else {
                    setMostrarInputOtroMes(false);
                    setMesSeleccionado(e.target.value);
                  }
                }}
                style={{
                  fontSize: "0.75rem",
                  padding: "0.22rem 0.45rem",
                  fontWeight: 600,
                  background: "var(--paper-raised)",
                  color: "var(--ink)",
                  borderRadius: "6px",
                  border: "1px solid var(--line)",
                }}
              >
                {MESES_HISTORICOS.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label}
                  </option>
                ))}
                <option value="OTRO">🗓️ Otro mes...</option>
              </select>

              {mostrarInputOtroMes && (
                <input
                  type="month"
                  value={mesSeleccionado}
                  onChange={(e) => e.target.value && setMesSeleccionado(e.target.value)}
                  style={{
                    fontSize: "0.74rem",
                    padding: "0.2rem 0.35rem",
                    width: 125,
                    borderRadius: "6px",
                    border: "1px solid var(--line)",
                    background: "var(--paper)",
                    color: "var(--ink)",
                  }}
                  title="Seleccionar cualquier otro mes"
                  autoFocus
                />
              )}
            </div>
          )}

          {modoTemporal === "RANGO" && (
            <div style={{ display: "inline-flex", gap: "0.25rem", alignItems: "center" }}>
              <input
                type="date"
                value={rangoInicio}
                onChange={(e) => setRangoInicio(e.target.value)}
                style={{ fontSize: "0.73rem", padding: "0.2rem 0.35rem", width: 115 }}
                title="Fecha inicio"
              />
              <span style={{ fontSize: "0.7rem", color: "var(--ink-soft)" }}>al</span>
              <input
                type="date"
                value={rangoFin}
                onChange={(e) => setRangoFin(e.target.value)}
                style={{ fontSize: "0.73rem", padding: "0.2rem 0.35rem", width: 115 }}
                title="Fecha fin"
              />
            </div>
          )}

          {modoTemporal === "RAPIDO" && (
            <div style={{ display: "inline-flex", background: "var(--mono-bg)", borderRadius: "6px", padding: "0.15rem", border: "1px solid var(--line)" }}>
              <button
                type="button"
                className={`btn btn-xs ${periodo === "dia" ? "" : "secondary"}`}
                style={{ fontSize: "0.72rem", padding: "0.2rem 0.4rem", borderRadius: "4px" }}
                onClick={() => setPeriodo("dia")}
              >
                Día
              </button>
              <button
                type="button"
                className={`btn btn-xs ${periodo === "semana" ? "" : "secondary"}`}
                style={{ fontSize: "0.72rem", padding: "0.2rem 0.4rem", borderRadius: "4px" }}
                onClick={() => setPeriodo("semana")}
              >
                Semana
              </button>
              <button
                type="button"
                className={`btn btn-xs ${periodo === "mes" ? "" : "secondary"}`}
                style={{ fontSize: "0.72rem", padding: "0.2rem 0.4rem", borderRadius: "4px" }}
                onClick={() => setPeriodo("mes")}
              >
                30d
              </button>
              <button
                type="button"
                className={`btn btn-xs ${periodo === "anio" ? "" : "secondary"}`}
                style={{ fontSize: "0.72rem", padding: "0.2rem 0.4rem", borderRadius: "4px" }}
                onClick={() => setPeriodo("anio")}
              >
                Año
              </button>
            </div>
          )}

          {/* Conmutador de Visualización: Balance vs Tendencia */}
          <div style={{ display: "inline-flex", background: "var(--mono-bg)", borderRadius: "6px", padding: "0.15rem", border: "1px solid var(--line)" }}>
            <button
              type="button"
              className={`btn btn-xs ${modoVista === "BALANCE" ? "" : "secondary"}`}
              style={{ fontSize: "0.73rem", padding: "0.2rem 0.45rem", borderRadius: "4px" }}
              onClick={() => setModoVista("BALANCE")}
              title="Ver balance de entradas vs salidas y ranking de movimientos"
            >
              📊 Balance
            </button>
            <button
              type="button"
              className={`btn btn-xs ${modoVista === "TENDENCIA" ? "" : "secondary"}`}
              style={{ fontSize: "0.73rem", padding: "0.2rem 0.45rem", borderRadius: "4px" }}
              onClick={() => setModoVista("TENDENCIA")}
              title="Ver evolución cronológica de captaciones y retiros"
            >
              📈 Curva
            </button>
          </div>
        </div>
      </div>

      {/* Pestañas de Selección Específica por Cuenta y Producto (Grid Adaptable Auto-Fit Fintech) */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
          gap: "0.3rem",
          borderBottom: "1px solid var(--line)",
          paddingBottom: "0.45rem",
        }}
      >
        {CUENTAS_OPCIONES.map((cta) => {
          const isSelected = filtroCuenta === cta.id;
          const count = !datos
            ? 0
            : cta.id === "TODOS"
              ? datos.totalOperaciones
              : datos.servicios.filter((s) => s.producto === cta.id).reduce((acc, s) => acc + s.cantidad, 0);

          return (
            <button
              key={cta.id}
              type="button"
              className={`btn btn-xs ${isSelected ? "" : "secondary"}`}
              style={{
                fontSize: "0.72rem",
                padding: "0.22rem 0.45rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "0.25rem",
                borderRadius: "6px",
                borderColor: isSelected ? "#0284c7" : "var(--line)",
                background: isSelected ? "#0284c7" : "var(--paper)",
                color: isSelected ? "#ffffff" : "var(--ink)",
                boxShadow: isSelected ? "0 2px 4px rgba(2, 132, 199, 0.2)" : "none",
                cursor: "pointer",
                transition: "all 0.15s ease",
                minWidth: 0,
              }}
              onClick={() => setFiltroCuenta(cta.id)}
            >
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.28rem",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                <span style={{ flexShrink: 0 }}>{cta.icon}</span>
                <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{cta.label}</span>
              </span>
              {count > 0 && (
                <span
                  style={{
                    background: isSelected ? "rgba(255,255,255,0.25)" : "rgba(148, 163, 184, 0.18)",
                    borderRadius: "10px",
                    padding: "0.05rem 0.35rem",
                    fontSize: "0.64rem",
                    fontWeight: 700,
                    flexShrink: 0,
                  }}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {cargando && <div style={{ fontSize: "0.78rem", color: "var(--ink-soft)", padding: "0.5rem" }}>Cargando analítica en vivo para {periodoLabel}...</div>}

      {!cargando && (!datos || serviciosFiltrados.length === 0) && (
        <div className="alert info" style={{ margin: "0.5rem 0", padding: "0.5rem 0.75rem", fontSize: "0.78rem" }}>
          No hay movimientos registrados para esta cuenta durante el período seleccionado ({periodoLabel}).
        </div>
      )}

      {datos && serviciosFiltrados.length > 0 && (
        <>
          {/* Cintillo Superior de 4 KPIs: Entradas, Salidas, Flujo Neto y Mayor Demanda */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "0.55rem" }}>
            <div className="kpi-tile" style={{ minHeight: 50, padding: "0.4rem 0.65rem", borderLeft: "4px solid #10b981" }}>
              <span className="kpi-tile-label" style={{ color: "#059669" }}>🟢 Entradas / Depósitos</span>
              <span className="kpi-tile-value mono" style={{ color: "#059669", fontSize: "0.98rem", margin: "0.1rem 0" }}>
                {formatoQ(totalIngresosFiltro)}
              </span>
              <span className="kpi-tile-sub" style={{ fontSize: "0.68rem" }}>{opIngresosFiltro} transacciones</span>
            </div>

            <div className="kpi-tile" style={{ minHeight: 50, padding: "0.4rem 0.65rem", borderLeft: "4px solid #ef4444" }}>
              <span className="kpi-tile-label" style={{ color: "#dc2626" }}>🔴 Salidas / Retiros</span>
              <span className="kpi-tile-value mono" style={{ color: "#dc2626", fontSize: "0.98rem", margin: "0.1rem 0" }}>
                {formatoQ(totalEgresosFiltro)}
              </span>
              <span className="kpi-tile-sub" style={{ fontSize: "0.68rem" }}>{opEgresosFiltro} transacciones</span>
            </div>

            <div className="kpi-tile" style={{ minHeight: 50, padding: "0.4rem 0.65rem", borderLeft: `4px solid ${flujoNetoFiltro >= 0 ? "#0284c7" : "#f59e0b"}` }}>
              <span className="kpi-tile-label">⚖️ Flujo Neto ({periodoLabel})</span>
              <span className="kpi-tile-value mono" style={{ color: flujoNetoFiltro >= 0 ? "#0284c7" : "#d97706", fontSize: "0.98rem", margin: "0.1rem 0" }}>
                {flujoNetoFiltro >= 0 ? "+" : ""}{formatoQ(flujoNetoFiltro)}
              </span>
              <span className="kpi-tile-sub" style={{ fontSize: "0.68rem" }}>
                {flujoNetoFiltro >= 0 ? "Superávit neto de captación" : "Déficit / Drenaje de liquidez"}
              </span>
            </div>

            <div className="kpi-tile accent" style={{ minHeight: 50, padding: "0.4rem 0.65rem", borderLeft: "4px solid #f59e0b" }}>
              <span className="kpi-tile-label">🏆 Mayor Operación</span>
              <span className="kpi-tile-value" style={{ fontSize: "0.85rem", margin: "0.1rem 0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {servicioTopFiltro ? `${servicioTopFiltro.icon} ${servicioTopFiltro.label}` : "—"}
              </span>
              <span className="kpi-tile-sub" style={{ fontSize: "0.68rem" }}>
                {servicioTopFiltro
                  ? `${servicioTopFiltro.cantidad} op. (${totalOperacionesFiltro > 0 ? Math.round((servicioTopFiltro.cantidad / totalOperacionesFiltro) * 1000) / 10 : 0}%)`
                  : ""}
              </span>
            </div>
          </div>

          {/* Card de Diagnóstico Estratégico de Gerencia: Detección Inteligente de Debilidades y Fortalezas */}
          <div
            style={{
              background: "var(--paper-raised)",
              border: `1px solid ${flujoNetoFiltro >= 0 ? "rgba(16, 185, 129, 0.35)" : "rgba(239, 68, 68, 0.35)"}`,
              borderLeft: `4px solid ${flujoNetoFiltro >= 0 ? "#10b981" : "#ef4444"}`,
              borderRadius: "8px",
              padding: "0.6rem 0.85rem",
              display: "flex",
              flexDirection: "column",
              gap: "0.45rem",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.4rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                <span style={{ fontSize: "1rem" }}>{flujoNetoFiltro >= 0 ? "🛡️" : "⚠️"}</span>
                <span style={{ fontWeight: 700, fontSize: "0.82rem", color: "var(--ink)" }}>
                  Diagnóstico Estratégico de Gerencia ({periodoLabel})
                </span>
                <span
                  style={{
                    fontSize: "0.68rem",
                    padding: "0.1rem 0.4rem",
                    borderRadius: "4px",
                    fontWeight: 700,
                    background: flujoNetoFiltro >= 0 ? "rgba(16, 185, 129, 0.15)" : "rgba(239, 68, 68, 0.15)",
                    color: flujoNetoFiltro >= 0 ? "#059669" : "#dc2626",
                  }}
                >
                  {flujoNetoFiltro >= 0 ? "SUPERÁVIT DE LIQUIDEZ" : "DÉFICIT DE CAJA / ALTA COLOCACIÓN"}
                </span>
              </div>

              <div style={{ display: "flex", gap: "0.4rem", alignItems: "center", flexWrap: "wrap" }}>
                <button
                  type="button"
                  onClick={() => setMostrarReporteModal(true)}
                  className="btn btn-xs"
                  style={{
                    fontSize: "0.72rem",
                    padding: "0.22rem 0.55rem",
                    background: "#0284c7",
                    color: "#ffffff",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.3rem",
                  }}
                  title="Emitir dictamen oficial para Gerencia con firmas y descarga en PDF o Excel"
                >
                  <span>🖨️</span> Reporte Oficial PDF / Excel
                </button>

                <Link
                  to={`/consolidado-financiero?fechaCorte=${fechaCorteAuditoria}`}
                  className="btn btn-xs secondary"
                  style={{ fontSize: "0.72rem", padding: "0.22rem 0.5rem", display: "inline-flex", alignItems: "center", gap: "0.3rem" }}
                  title={`Auditar Balance General y Estado de Resultados al corte ${fechaCorteAuditoria}`}
                >
                  <span>📑</span> Estados Financieros al {fechaCorteAuditoria}
                </Link>
              </div>
            </div>

            {/* Parrilla de Diagnóstico en 3 Columnas Clave */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "0.5rem", fontSize: "0.74rem" }}>
              {/* Factor 1: Presión de Salidas sobre Entradas */}
              <div style={{ background: "var(--mono-bg)", padding: "0.45rem 0.6rem", borderRadius: "6px", border: "1px solid var(--line)" }}>
                <div style={{ fontWeight: 600, color: "var(--ink)", marginBottom: "0.2rem", display: "flex", justifyContent: "space-between" }}>
                  <span>🌊 Tasa de Salida de Efectivo</span>
                  <span className="mono" style={{ color: ratioSalida > 100 ? "#dc2626" : "#059669", fontWeight: 700 }}>
                    {ratioSalida.toFixed(1)}%
                  </span>
                </div>
                <p style={{ margin: 0, color: "var(--ink-soft)", lineHeight: 1.35 }}>
                  {ratioSalida > 100
                    ? `⚠️ Alerta: Por cada Q100 que ingresaron, salieron Q${ratioSalida.toFixed(1)}. Salidas superan los ingresos en Q${formatoQ(Math.abs(flujoNetoFiltro))}.`
                    : `✅ Liquidez Óptima: Por cada Q100 que ingresaron, únicamente salieron Q${ratioSalida.toFixed(1)}. Excelente capacidad de retención de fondos.`}
                </p>
              </div>

              {/* Factor 2: Comportamiento Ahorro vs Retiros */}
              <div style={{ background: "var(--mono-bg)", padding: "0.45rem 0.6rem", borderRadius: "6px", border: "1px solid var(--line)" }}>
                <div style={{ fontWeight: 600, color: "var(--ink)", marginBottom: "0.2rem", display: "flex", justifyContent: "space-between" }}>
                  <span>💰 Captación vs Fuga de Ahorros</span>
                  <span className="mono" style={{ color: depositosAhorro >= retirosAhorro ? "#059669" : "#dc2626", fontWeight: 700 }}>
                    Dep: {formatoQ(depositosAhorro)} | Ret: {formatoQ(retirosAhorro)}
                  </span>
                </div>
                <p style={{ margin: 0, color: "var(--ink-soft)", lineHeight: 1.35 }}>
                  {retirosAhorro > depositosAhorro
                    ? `⚠️ Debilidad en Ahorros: Los retiros superaron a los nuevos depósitos en Q${formatoQ(retirosAhorro - depositosAhorro)}. Se aconseja fidelización o tasa escalonada.`
                    : depositosAhorro > 0
                      ? `✅ Fortaleza: Captaciones netas de ahorro positivas (+Q${formatoQ(depositosAhorro - retirosAhorro)}). Confianza sólida de los asociados.`
                      : `ℹ️ Sin variación sustancial en cuentas de ahorros en este corte.`}
                </p>
              </div>

              {/* Factor 3: Colocación y Recuperación de Cartera */}
              <div style={{ background: "var(--mono-bg)", padding: "0.45rem 0.6rem", borderRadius: "6px", border: "1px solid var(--line)" }}>
                <div style={{ fontWeight: 600, color: "var(--ink)", marginBottom: "0.2rem", display: "flex", justifyContent: "space-between" }}>
                  <span>💼 Dinámica de Créditos y Gastos</span>
                  <span className="mono" style={{ color: "#0284c7", fontWeight: 700 }}>
                    Cobro: {formatoQ(cobroCreditos)}
                  </span>
                </div>
                <p style={{ margin: 0, color: "var(--ink-soft)", lineHeight: 1.35 }}>
                  {cobroCreditos > 0
                    ? `✅ Cobranza Activa: Se recuperaron ${formatoQ(cobroCreditos)} en amortizaciones e intereses. ${desembolsoCreditos > 0 ? `Desembolsos del mes: ${formatoQ(desembolsoCreditos)}.` : ""} ${gastoCajaChica > 0 ? `Gastos menores: ${formatoQ(gastoCajaChica)}.` : ""}`
                    : `⚠️ Atención: Nula o baja recuperación de cuotas de crédito registrada en este período. Verificar gestión de cobro.`}
                </p>
              </div>
            </div>
          </div>

          {/* MODO 1: BALANCE & DISTRIBUCIÓN (3 Columnas Panorámicas) */}
          {modoVista === "BALANCE" && (
            <div className="dashboard-charts-grid">
              {/* Card 1: Dona de Distribución con Tooltip Enriquecido */}
              <div style={{ background: "var(--mono-bg)", borderRadius: "8px", border: "1px solid var(--line)", padding: "0.6rem 0.75rem", display: "flex", flexDirection: "column" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.35rem" }}>
                  <h4 style={{ margin: 0, fontSize: "0.78rem", color: "var(--ink)", fontWeight: 700 }}>
                    🍩 Distribución de Operaciones
                  </h4>
                  <span style={{ fontSize: "0.68rem", color: "var(--ink-soft)" }}>{totalOperacionesFiltro} ops.</span>
                </div>
                <div style={{ width: "100%", height: 185, position: "relative" }}>
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie
                        data={serviciosFiltrados.map((s) => ({
                          ...s,
                          pctMonto: volumenTotalFiltro > 0 ? Math.round((s.totalMonto / volumenTotalFiltro) * 1000) / 10 : 0,
                        }))}
                        dataKey="cantidad"
                        nameKey="label"
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={75}
                        paddingAngle={3}
                      >
                        {serviciosFiltrados.map((s, index) => {
                          const isIngreso = s.flujo === "INGRESO";
                          const baseColors = isIngreso
                            ? ["#10b981", "#059669", "#047857", "#065f46", "#34d399"]
                            : ["#ef4444", "#dc2626", "#b91c1c", "#f97316", "#ea580c"];
                          return <Cell key={`cell-${index}`} fill={baseColors[index % baseColors.length]} />;
                        })}
                      </Pie>
                      <RechartsTooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const d = payload[0].payload as ServicioItem & { pctMonto: number };
                            const isIngreso = d.flujo === "INGRESO";
                            return (
                              <div style={{ background: "rgba(15, 23, 42, 0.94)", color: "#fff", padding: "0.45rem 0.65rem", borderRadius: "6px", fontSize: "0.74rem", boxShadow: "0 4px 12px rgba(0,0,0,0.3)" }}>
                                <div style={{ fontWeight: 700, marginBottom: "0.2rem", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                                  <span>{d.icon}</span> <span>{d.label}</span>
                                </div>
                                <div style={{ color: isIngreso ? "#34d399" : "#f87171", fontSize: "0.7rem", fontWeight: 700 }}>
                                  {isIngreso ? "🟢 Entrada / Depósito" : "🔴 Salida / Retiro"}
                                </div>
                                <div style={{ marginTop: "0.2rem" }}>
                                  💵 <strong>{formatoQ(d.totalMonto)}</strong> ({d.pctMonto}% del volumen)
                                </div>
                                <div style={{ color: "#94a3b8", fontSize: "0.68rem" }}>
                                  ⚡ {d.cantidad} operaciones ({d.porcentaje}% de demanda)
                                </div>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Card 2: Participación Proporcional en Volumen (%) con Tooltip en Quetzales */}
              <div style={{ background: "var(--mono-bg)", borderRadius: "8px", border: "1px solid var(--line)", padding: "0.6rem 0.75rem", display: "flex", flexDirection: "column" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.35rem" }}>
                  <h4 style={{ margin: 0, fontSize: "0.78rem", color: "var(--ink)", fontWeight: 700 }}>
                    📊 Participación por Volumen (%)
                  </h4>
                  <span className="mono" style={{ fontSize: "0.68rem", color: "#0284c7", fontWeight: 700 }}>
                    Total: {formatoQ(volumenTotalFiltro)}
                  </span>
                </div>
                <div style={{ width: "100%", height: 185 }}>
                  <ResponsiveContainer>
                    <BarChart
                      data={serviciosFiltrados.map((s) => ({
                        ...s,
                        pctMonto: volumenTotalFiltro > 0 ? Math.round((s.totalMonto / volumenTotalFiltro) * 1000) / 10 : 0,
                      }))}
                      layout="vertical"
                      margin={{ left: 10, right: 25, top: 5, bottom: 5 }}
                    >
                      <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 9 }} tickFormatter={(val) => `${val}%`} />
                      <YAxis dataKey="label" type="category" width={115} tick={{ fontSize: 9 }} />
                      <RechartsTooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const d = payload[0].payload as ServicioItem & { pctMonto: number };
                            const isIngreso = d.flujo === "INGRESO";
                            return (
                              <div style={{ background: "rgba(15, 23, 42, 0.94)", color: "#fff", padding: "0.45rem 0.65rem", borderRadius: "6px", fontSize: "0.74rem", boxShadow: "0 4px 12px rgba(0,0,0,0.3)" }}>
                                <div style={{ fontWeight: 700, marginBottom: "0.2rem", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                                  <span>{d.icon}</span> <span>{d.label}</span>
                                </div>
                                <div style={{ color: isIngreso ? "#34d399" : "#f87171", fontSize: "0.7rem", fontWeight: 700 }}>
                                  {isIngreso ? "🟢 Entrada / Depósito" : "🔴 Salida / Retiro"}
                                </div>
                                <div style={{ marginTop: "0.2rem" }}>
                                  💵 Monto exacto: <strong>{formatoQ(d.totalMonto)}</strong>
                                </div>
                                <div style={{ color: "#38bdf8", fontSize: "0.7rem" }}>
                                  📊 Participación: <strong>{d.pctMonto}%</strong>
                                </div>
                                <div style={{ color: "#94a3b8", fontSize: "0.68rem" }}>
                                  ⚡ Transacciones: {d.cantidad} op. ({d.porcentaje}%)
                                </div>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Bar dataKey="pctMonto" radius={[0, 4, 4, 0]}>
                        {serviciosFiltrados.map((s, index) => {
                          const fill = s.flujo === "INGRESO" ? "#10b981" : "#ef4444";
                          return <Cell key={`cell-bar-${index}`} fill={fill} />;
                        })}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Card 3: Ranking y Desglose Detallado con Porcentajes y Quetzales */}
              <div style={{ background: "var(--mono-bg)", borderRadius: "8px", border: "1px solid var(--line)", padding: "0.6rem 0.75rem", display: "flex", flexDirection: "column" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.4rem" }}>
                  <h4 style={{ margin: 0, fontSize: "0.78rem", color: "var(--ink)", fontWeight: 700 }}>
                    📋 Desglose de Movimientos
                  </h4>
                  <span style={{ fontSize: "0.68rem", color: "var(--ink-soft)" }}>Porcentaje & Monto</span>
                </div>
                <div style={{ maxHeight: 185, overflowY: "auto", display: "flex", flexDirection: "column", gap: "0.35rem", paddingRight: "0.2rem" }}>
                  {serviciosFiltrados.map((s, idx) => {
                    const pctOp = totalOperacionesFiltro > 0 ? Math.round((s.cantidad / totalOperacionesFiltro) * 1000) / 10 : 0;
                    const pctVol = volumenTotalFiltro > 0 ? Math.round((s.totalMonto / volumenTotalFiltro) * 1000) / 10 : 0;
                    const isIngreso = s.flujo === "INGRESO";
                    const color = isIngreso ? "#10b981" : "#ef4444";

                    return (
                      <div
                        key={s.categoria || idx}
                        style={{
                          background: "var(--paper-raised)",
                          border: "1px solid var(--line)",
                          borderRadius: "6px",
                          padding: "0.3rem 0.45rem",
                          display: "flex",
                          flexDirection: "column",
                          gap: "0.15rem",
                        }}
                        title={`${s.label}: ${formatoQ(s.totalMonto)} (${pctVol}% volumen / ${s.cantidad} transacciones - ${pctOp}% de demanda)`}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.72rem" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.3rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            <span
                              style={{
                                fontSize: "0.62rem",
                                padding: "0.05rem 0.25rem",
                                borderRadius: "3px",
                                fontWeight: 700,
                                background: isIngreso ? "rgba(16, 185, 129, 0.12)" : "rgba(239, 68, 68, 0.12)",
                                color: color,
                              }}
                            >
                              {isIngreso ? "🟢 ENT" : "🔴 SAL"}
                            </span>
                            <span>{s.icon}</span>
                            <span style={{ fontWeight: 600, color: "var(--ink)" }}>{s.label}</span>
                          </div>
                          <span className="mono" style={{ fontWeight: 700, color: color }}>
                            {formatoQ(s.totalMonto)}
                          </span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                          <div style={{ flex: 1, background: "rgba(0,0,0,0.06)", height: 4, borderRadius: 2, overflow: "hidden" }}>
                            <div style={{ width: `${Math.min(pctVol, 100)}%`, background: color, height: "100%", borderRadius: 2 }} />
                          </div>
                          <span style={{ fontSize: "0.64rem", color: "var(--ink-soft)", minWidth: "75px", textAlign: "right" }}>
                            {pctVol}% vol. ({s.cantidad} op.)
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* MODO 2: TENDENCIA TEMPORAL (Evolución por Días/Semanas/Meses) */}
          {modoVista === "TENDENCIA" && (
            <div style={{ display: "grid", gridTemplateColumns: "2.1fr 1fr", gap: "0.65rem", marginTop: "0.45rem" }}>
              {/* Gráfica de Área de Tendencia Temporal */}
              <div style={{ background: "var(--mono-bg)", borderRadius: "8px", border: "1px solid var(--line)", padding: "0.6rem 0.75rem", display: "flex", flexDirection: "column" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.35rem" }}>
                  <h4 style={{ margin: 0, fontSize: "0.78rem", color: "var(--ink)", fontWeight: 700 }}>
                    📈 Evolución Cronológica: Entradas (Verde) vs Salidas (Rojo)
                  </h4>
                  <span style={{ fontSize: "0.68rem", color: "var(--ink-soft)" }}>Curva de actividad diaria</span>
                </div>
                <div style={{ width: "100%", height: 185 }}>
                  <ResponsiveContainer>
                    <AreaChart data={datos.tendenciaTemporal} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
                      <defs>
                        <linearGradient id="gradIngresos" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                        </linearGradient>
                        <linearGradient id="gradEgresos" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#ef4444" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                      <XAxis dataKey="label" tick={{ fontSize: 9.5 }} />
                      <YAxis tick={{ fontSize: 9.5 }} tickFormatter={(val) => `Q${val >= 1000 ? `${Math.round(val / 1000)}k` : val}`} />
                      <RechartsTooltip formatter={(val: any) => [formatoQ(Number(val) || 0)]} labelFormatter={(l) => `Fecha: ${l}`} />
                      <Legend wrapperStyle={{ fontSize: "0.7rem", paddingTop: "0.2rem" }} />
                      <Area type="monotone" dataKey="ingresos" name="🟢 Entradas / Depósitos" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#gradIngresos)" />
                      <Area type="monotone" dataKey="egresos" name="🔴 Salidas / Retiros" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#gradEgresos)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Panel de Resumen de Tendencia Temporal */}
              <div style={{ background: "var(--mono-bg)", borderRadius: "8px", border: "1px solid var(--line)", padding: "0.6rem 0.75rem", display: "flex", flexDirection: "column" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.4rem" }}>
                  <h4 style={{ margin: 0, fontSize: "0.78rem", color: "var(--ink)", fontWeight: 700 }}>
                    🎯 Radiografía de Flujo
                  </h4>
                  <span style={{ fontSize: "0.68rem", color: "var(--ink-soft)" }}>Por fecha</span>
                </div>
                <div style={{ maxHeight: 185, overflowY: "auto", display: "flex", flexDirection: "column", gap: "0.35rem", paddingRight: "0.2rem" }}>
                  {datos.tendenciaTemporal.slice(-6).reverse().map((t) => (
                    <div
                      key={t.fecha}
                      style={{
                        background: "var(--paper-raised)",
                        border: "1px solid var(--line)",
                        borderRadius: "6px",
                        padding: "0.3rem 0.45rem",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        fontSize: "0.72rem",
                      }}
                    >
                      <div>
                        <span style={{ fontWeight: 700, color: "var(--ink)" }}>📅 {t.fecha}</span>
                        <div style={{ fontSize: "0.64rem", color: "var(--ink-soft)" }}>{t.operaciones} transacciones</div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: "0.68rem", color: "#059669", fontWeight: 700 }}>+{formatoQ(t.ingresos)}</div>
                        <div style={{ fontSize: "0.68rem", color: "#dc2626", fontWeight: 700 }}>-{formatoQ(t.egresos)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {mostrarReporteModal && datos && (
        <DiagnosticoGerencialReporteModal
          isOpen={mostrarReporteModal}
          onClose={() => setMostrarReporteModal(false)}
          periodoLabel={periodoLabel}
          agenciaNombre={agencias.find((a) => a.id === agenciaId)?.nombre || "Agencia Chajul"}
          fechaCorte={fechaCorteAuditoria}
          servicios={serviciosFiltrados}
          totalIngresos={totalIngresosFiltro}
          totalEgresos={totalEgresosFiltro}
          flujoNeto={flujoNetoFiltro}
          ratioSalida={ratioSalida}
          depositosAhorro={depositosAhorro}
          retirosAhorro={retirosAhorro}
          cobroCreditos={cobroCreditos}
          desembolsoCreditos={desembolsoCreditos}
          gastoCajaChica={gastoCajaChica}
          usuarioNombre={usuario?.nombre}
        />
      )}
    </div>
  );
}

