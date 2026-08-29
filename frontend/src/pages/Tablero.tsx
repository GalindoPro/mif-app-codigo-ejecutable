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
      <div className="page-head">
        <div>
          <h1>Tablero</h1>
          <p>Resumen de todos los módulos{varias ? " — todas las agencias" : ""}, actualizado al momento.</p>
        </div>
        {usuario?.rol === "ADMIN" && (
          <button
            type="button"
            className="btn danger"
            onClick={handleReset}
            disabled={reseteando}
            title="Borrar todos los datos de prueba y comenzar desde cero"
          >
            {reseteando ? "Reiniciando..." : "🔄 Reiniciar sistema a cero"}
          </button>
        )}
      </div>

      {mensajeExito && <div className="alert success">{mensajeExito}</div>}
      {error && <div className="alert error">{error}</div>}

      <div className="stat-grid">
        {usuario?.rol !== "PROMOTOR" && (
          <Link to="/caja-chica" className="stat-card" style={{ textDecoration: "none" }}>
            <span className="label">Caja chica</span>
            <span className="value">{formatoQ(global.cajaChica)}</span>
            <span className="sub">Saldo actual</span>
          </Link>
        )}
        <Link to="/ahorros/corriente" className="stat-card" style={{ textDecoration: "none" }}>
          <span className="label">Ahorro corriente</span>
          <span className="value">{formatoQ(global.ahorroCorriente)}</span>
          <span className="sub">Saldo total</span>
        </Link>
        <Link to="/ahorros/programado" className="stat-card" style={{ textDecoration: "none" }}>
          <span className="label">Ahorro programado</span>
          <span className="value">{formatoQ(global.ahorroProgramado)}</span>
          <span className="sub">Saldo total</span>
        </Link>
        <Link to="/ahorros/infanto-juvenil" className="stat-card" style={{ textDecoration: "none" }}>
          <span className="label">Ahorro infanto juvenil</span>
          <span className="value">{formatoQ(global.ahorroInfantoJuvenil)}</span>
          <span className="sub">Saldo total</span>
        </Link>
        <Link to="/socios" className="stat-card" style={{ textDecoration: "none" }}>
          <span className="label">Socios activos</span>
          <span className="value mono">{global.totalSocios}</span>
          <span className="sub">{global.movimientosHoy} movimiento(s) hoy</span>
        </Link>
        {usuario?.rol !== "CAJERO" && (
          <Link to="/creditos" className="stat-card accent" style={{ textDecoration: "none" }}>
            <span className="label">Créditos y Promotor</span>
            <span className="value">Activo</span>
            <span className="sub">Simulador y préstamos 2%</span>
          </Link>
        )}
      </div>

      {varias && (
        <>
          <h3 style={{ marginBottom: "0.75rem" }}>Por agencia</h3>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Agencia</th>
                  <th>Caja chica</th>
                  <th>Ahorro corriente</th>
                  <th>Ahorro programado</th>
                  <th>Ahorro infanto juvenil</th>
                  <th>Socios</th>
                </tr>
              </thead>
              <tbody>
                {porAgencia.map((a) => (
                  <tr key={a.agenciaId}>
                    <td>{a.agenciaNombre}</td>
                    <td className="mono">{formatoQ(a.cajaChica.saldo)}</td>
                    <td className="mono">{formatoQ(a.ahorroCorriente.saldoTotal)}</td>
                    <td className="mono">{formatoQ(a.ahorroProgramado.saldoTotal)}</td>
                    <td className="mono">{formatoQ(a.ahorroInfantoJuvenil.saldoTotal)}</td>
                    <td className="mono">{a.totalSocios}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
