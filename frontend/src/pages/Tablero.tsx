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
      "⚠️ ¿Estás seguro de que deseas reiniciar el sistema desde cero?\n\n" +
      "Esta acción borrará:\n" +
      "• Todos los socios registrados\n" +
      "• Todas las libretas y cuentas de ahorro\n" +
      "• Todos los movimientos y saldos acumulados\n" +
      "• Todos los comprobantes de caja chica\n" +
      "• Todas las aperturas y cierres de auxiliar de caja\n\n" +
      "El sistema volverá a cero para que puedas hacer nuevas pruebas."
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

  if (error && !resumen) return <div className="alert error">{error}</div>;
  if (!resumen) return <p>Cargando…</p>;

  const { global, porAgencia } = resumen;
  const varias = porAgencia.length > 1;

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

        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <button
            type="button"
            className="btn secondary"
            onClick={cargarResumen}
            style={{ fontSize: "0.82rem", padding: "0.35rem 0.75rem" }}
          >
            🔄 Actualizar
          </button>
          {usuario?.rol === "ADMIN" && (
            <button
              type="button"
              className="btn danger"
              onClick={handleReset}
              disabled={reseteando}
              style={{ fontSize: "0.82rem", padding: "0.35rem 0.75rem" }}
              title="Borrar todos los datos de prueba y comenzar desde cero"
            >
              {reseteando ? "Reiniciando..." : "⚠️ Reiniciar a cero"}
            </button>
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
              <span className="value" style={{ fontSize: "1.2rem", color: "#047857" }}>{formatoQ(global.ahorroCorriente)}</span>
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
              <span className="value" style={{ fontSize: "1.2rem", color: "#b45309" }}>Kardex PF</span>
              <span className="sub">692 certificados</span>
            </Link>
            <Link to="/socios" className="stat-card" style={{ textDecoration: "none" }}>
              <span className="label">Socios activos</span>
              <span className="value mono" style={{ fontSize: "1.2rem" }}>{global.totalSocios}</span>
              <span className="sub">{global.movimientosHoy} mov. hoy</span>
            </Link>
            {usuario?.rol !== "CAJERO" && (
              <Link to="/creditos" className="stat-card accent" style={{ textDecoration: "none" }}>
                <span className="label">Cartera de Crédito</span>
                <span className="value" style={{ fontSize: "1.2rem", color: "#1e40af" }}>66 Préstamos</span>
                <span className="sub">Hipotecario y Fiduciario</span>
              </Link>
            )}
          </div>

          {/* Accesos Rápidos de Operación Diaria */}
          <div className="card" style={{ padding: "1rem 1.25rem" }}>
            <h3 style={{ margin: "0 0 0.75rem", fontSize: "0.95rem", fontWeight: 700, color: "var(--ink)" }}>
              ⚡ Accesos Rápidos de Ventanilla y Campo
            </h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "0.6rem" }}>
              <Link to="/auxiliar-caja" className="btn secondary" style={{ justifyContent: "center", fontSize: "0.82rem", padding: "0.45rem" }}>
                💵 Ventanilla Caja
              </Link>
              <Link to="/promotor/cartera" className="btn secondary" style={{ justifyContent: "center", fontSize: "0.82rem", padding: "0.45rem" }}>
                📂 Kardex Cartera
              </Link>
              <Link to="/arqueos/mensual" className="btn secondary" style={{ justifyContent: "center", fontSize: "0.82rem", padding: "0.45rem" }}>
                📑 Libro Arqueos
              </Link>
              <Link to="/socios" className="btn secondary" style={{ justifyContent: "center", fontSize: "0.82rem", padding: "0.45rem" }}>
                👥 Padrón Socios
              </Link>
              <Link to="/ahorros/plazo-fijo" className="btn secondary" style={{ justifyContent: "center", fontSize: "0.82rem", padding: "0.45rem" }}>
                🔒 Plazo Fijo
              </Link>
              <Link to="/aportaciones" className="btn secondary" style={{ justifyContent: "center", fontSize: "0.82rem", padding: "0.45rem" }}>
                🏛️ Aportaciones
              </Link>
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
                      <th style={{ textAlign: "right" }}>Plazo fijo</th>
                      <th style={{ textAlign: "center" }}>Socios</th>
                    </tr>
                  </thead>
                  <tbody>
                    {porAgencia.map((a) => (
                      <tr key={a.agenciaId}>
                        <td style={{ fontWeight: 600 }}>{a.agenciaNombre}</td>
                        <td className="mono" style={{ textAlign: "right" }}>{formatoQ(a.cajaChica.saldo)}</td>
                        <td className="mono" style={{ textAlign: "right" }}>{formatoQ(a.ahorroCorriente.saldoTotal)}</td>
                        <td className="mono" style={{ textAlign: "right" }}>{formatoQ(a.ahorroProgramado.saldoTotal)}</td>
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

  return (
    <div className="card" style={{ marginTop: 0, borderTop: "4px solid #0284c7" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem", marginBottom: "1.25rem" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
            <h2 style={{ margin: 0, fontSize: "1.2rem" }}>📊 Servicios Más Movidos (Monitoreo del Supervisor)</h2>
            <span className="badge" style={{ background: "#e0f2fe", color: "#0369a1", fontWeight: 700 }}>
              Operaciones en Vivo
            </span>
          </div>
          <p className="sub" style={{ margin: "0.25rem 0 0" }}>
            Gráfica y clasificación de servicios con mayor demanda transaccional ({periodoLabel}).
          </p>
        </div>

        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
          {puedeElegirAgencia && agencias.length > 0 && (
            <select value={agenciaId} onChange={(e) => setAgenciaId(e.target.value)} style={{ maxWidth: 220 }}>
              <option value="">🏢 Todas las Agencias (Global)</option>
              {agencias.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.nombre}
                </option>
              ))}
            </select>
          )}

          <div style={{ display: "inline-flex", background: "#f1f5f9", borderRadius: "8px", padding: "0.2rem" }}>
            <button
              type="button"
              className={`btn ${periodo === "semana" ? "" : "secondary"}`}
              style={{ fontSize: "0.8rem", padding: "0.3rem 0.75rem", borderRadius: "6px" }}
              onClick={() => setPeriodo("semana")}
            >
              Semanal
            </button>
            <button
              type="button"
              className={`btn ${periodo === "mes" ? "" : "secondary"}`}
              style={{ fontSize: "0.8rem", padding: "0.3rem 0.75rem", borderRadius: "6px" }}
              onClick={() => setPeriodo("mes")}
            >
              Mensual
            </button>
            <button
              type="button"
              className={`btn ${periodo === "anio" ? "" : "secondary"}`}
              style={{ fontSize: "0.8rem", padding: "0.3rem 0.75rem", borderRadius: "6px" }}
              onClick={() => setPeriodo("anio")}
            >
              Anual
            </button>
          </div>
        </div>
      </div>

      {cargando && <p>Cargando analítica de servicios…</p>}

      {!cargando && (!datos || datos.servicios.length === 0) && (
        <div className="alert info">
          No hay movimientos de ventanilla registrados en este período ({periodoLabel}).
        </div>
      )}

      {datos && datos.servicios.length > 0 && (
        <>
          {/* Métricas destacadas */}
          <div className="stat-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", marginBottom: "1.5rem" }}>
            <div className="stat-card accent">
              <span className="label">🏆 Servicio Más Demandado</span>
              <span className="value" style={{ fontSize: "1.1rem" }}>
                {datos.servicioTop ? `${datos.servicioTop.icon} ${datos.servicioTop.label}` : "—"}
              </span>
              <span className="sub">{datos.servicioTop ? `${datos.servicioTop.cantidad} operaciones (${datos.servicioTop.porcentaje}%)` : ""}</span>
            </div>
            <div className="stat-card">
              <span className="label">Total Operaciones</span>
              <span className="value mono">{datos.totalOperaciones}</span>
              <span className="sub">Transacciones procesadas</span>
            </div>
            <div className="stat-card">
              <span className="label">Volumen Financiero</span>
              <span className="value mono" style={{ color: "#0f766e" }}>{formatoQ(datos.volumenTotal)}</span>
              <span className="sub">Monto total operado</span>
            </div>
          </div>

          {/* Gráfica de Barras Proporcionales */}
          <h3 style={{ margin: "0 0 1rem", fontSize: "1rem" }}>Distribución y Demanda por Tipo de Servicio</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
            {datos.servicios.map((s, idx) => {
              const barColors = [
                "linear-gradient(90deg, #0284c7, #38bdf8)",
                "linear-gradient(90deg, #059669, #34d399)",
                "linear-gradient(90deg, #7c3aed, #a78bfa)",
                "linear-gradient(90deg, #ea580c, #fb923c)",
                "linear-gradient(90deg, #0891b2, #22d3ee)",
                "linear-gradient(90deg, #d97706, #fcd34d)",
              ];
              const bgGradient = barColors[idx % barColors.length];

              return (
                <div key={s.categoria} style={{ background: "#f8fafc", padding: "0.75rem 1rem", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.4rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <span style={{ fontSize: "1.2rem" }}>{s.icon}</span>
                      <strong style={{ fontSize: "0.9rem", color: "#1e293b" }}>{s.label}</strong>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                      <span className="badge" style={{ background: "#e2e8f0", color: "#334155", fontWeight: 700 }}>
                        {s.cantidad} op. ({s.porcentaje}%)
                      </span>
                      <strong className="mono" style={{ fontSize: "0.95rem", color: "#0f766e", minWidth: 100, textAlign: "right" }}>
                        {formatoQ(s.totalMonto)}
                      </strong>
                    </div>
                  </div>

                  {/* Barra Visual */}
                  <div style={{ background: "#e2e8f0", height: "10px", borderRadius: "999px", overflow: "hidden" }}>
                    <div
                      style={{
                        background: bgGradient,
                        height: "100%",
                        width: `${Math.max(s.porcentaje, 4)}%`,
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
