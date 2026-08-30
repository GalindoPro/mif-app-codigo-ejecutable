import { useEffect, useState } from "react";
import { api, mensajeError } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { formatoQ } from "../types";
import type { Agencia } from "../types";

interface DiaArqueo {
  id: string;
  fecha: string;
  estado: string;
  saldo_inicial: number;
  saldo_final: number | null;
  total_ingresos: number;
  total_egresos: number;
  total_contado: number | null;
  diferencia: number | null;
  abierto_por_nombre: string | null;
  cerrado_por_nombre: string | null;
  total_movimientos: number;
}

interface ArqueoMensualResponse {
  mes: string;
  resumen: {
    totalDiasOperados: number;
    diasCuadrados: number;
    diasConDiferencia: number;
    totalSobrante: number;
    totalFaltante: number;
    totalMovimientosMes: number;
    totalIngresosMes: number;
    totalEgresosMes: number;
  };
  dias: DiaArqueo[];
}

export default function LibroArqueoMensual() {
  const { usuario } = useAuth();
  const puedeElegirAgencia = usuario?.rol === "ADMIN" || usuario?.rol === "GERENCIA";

  const [agencias, setAgencias] = useState<Agencia[]>([]);
  const [agenciaId, setAgenciaId] = useState(usuario?.agenciaId ?? "");
  const [mes, setMes] = useState(() => new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [datos, setDatos] = useState<ArqueoMensualResponse | null>(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.get<Agencia[]>("/agencias").then(({ data }) => setAgencias(data));
  }, []);

  function cargar() {
    if (!agenciaId) return;
    setCargando(true);
    setError(null);
    api
      .get<ArqueoMensualResponse>("/caja-auxiliar/arqueos-mes", {
        params: { agenciaId, mes },
      })
      .then(({ data }) => setDatos(data))
      .catch((err) => setError(mensajeError(err)))
      .finally(() => setCargando(false));
  }

  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agenciaId, mes]);

  const agenciaNombre = agencias.find((a) => a.id === agenciaId)?.nombre ?? "Agencia";

  // Formato bonito del mes: e.g. "Agosto 2026"
  const [añoStr, mesNum] = mes.split("-");
  const fechaMesObj = new Date(Number(añoStr), Number(mesNum) - 1, 1);
  const mesNombreLargo = fechaMesObj.toLocaleDateString("es-GT", { month: "long", year: "numeric" });

  return (
    <div>
      <div className="page-head no-print">
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <h1>📑 Libro Mensual de Arqueos de Caja</h1>
            <span className="badge" style={{ background: "#fef3c7", color: "#92400e", fontWeight: 700 }}>
              Auditoría Comisión de Vigilancia
            </span>
          </div>
          <p>
            Consolidado mensual de cierres y arqueos de caja para revisión y firma de la Comisión de Vigilancia.
          </p>
        </div>

        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <label htmlFor="mes-picker" style={{ fontSize: "0.85rem", fontWeight: 600 }}>
              Mes:
            </label>
            <input
              id="mes-picker"
              type="month"
              value={mes}
              onChange={(e) => setMes(e.target.value)}
              style={{ padding: "0.35rem 0.5rem", borderRadius: "6px" }}
            />
          </div>

          {puedeElegirAgencia && (
            <select value={agenciaId} onChange={(e) => setAgenciaId(e.target.value)} style={{ maxWidth: 200 }}>
              {agencias.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.nombre}
                </option>
              ))}
            </select>
          )}

          <button className="btn" onClick={() => window.print()} disabled={!datos || datos.dias.length === 0}>
            🖨️ Imprimir Acta Mensual Consolidada
          </button>
        </div>
      </div>

      {error && <div className="alert error no-print">{error}</div>}

      {/* Encabezado Oficial Imprimible */}
      <div className="print-container" style={{ display: "none" }}>
        <div style={{ textAlign: "center", borderBottom: "2px solid #0f172a", paddingBottom: "0.75rem", marginBottom: "1rem" }}>
          <h2 style={{ margin: 0, fontSize: "1.1rem", textTransform: "uppercase", letterSpacing: "0.03em" }}>
            COOPERATIVA INTEGRAL DE AHORRO Y CRÉDITO
          </h2>
          <h3 style={{ margin: "0.2rem 0", fontSize: "1.3rem", color: "#047857", fontWeight: 800 }}>
            "MAYA INVERSIONES FUTURAS", R.L.
          </h3>
          <h4 style={{ margin: "0.3rem 0 0.1rem", fontSize: "1rem", textDecoration: "underline" }}>
            LIBRO DE ACTAS DE ARQUEO MENSUAL DE CAJA
          </h4>
          <p style={{ margin: 0, fontSize: "0.88rem", color: "#334155" }}>
            COMISIÓN DE VIGILANCIA · AGENCIA: <strong>{agenciaNombre.toUpperCase()}</strong>
          </p>
          <p style={{ margin: "0.2rem 0 0", fontSize: "0.85rem", color: "#475569" }}>
            Período de Auditoría: <strong style={{ textTransform: "capitalize" }}>{mesNombreLargo}</strong> · Cifras expresadas en Quetzales (Q)
          </p>
        </div>
      </div>

      {/* Métricas del Mes */}
      {datos && (
        <div className="stat-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", marginBottom: "1.5rem" }}>
          <div className="stat-card">
            <span className="label">Días operados en el mes</span>
            <span className="value">{datos.resumen.totalDiasOperados}</span>
            <span className="sub">Cierres diarios registrados</span>
          </div>
          <div className="stat-card accent">
            <span className="label">Días cuadrados exactos</span>
            <span className="value" style={{ color: "#16a34a" }}>
              {datos.resumen.diasCuadrados} / {datos.resumen.totalDiasOperados}
            </span>
            <span className="sub">
              {datos.resumen.totalDiasOperados > 0
                ? `${Math.round((datos.resumen.diasCuadrados / datos.resumen.totalDiasOperados) * 100)}% de efectividad`
                : "Sin movimientos"}
            </span>
          </div>
          <div className="stat-card">
            <span className="label">Total ingresos del mes</span>
            <span className="value" style={{ color: "#16a34a" }}>
              {formatoQ(datos.resumen.totalIngresosMes)}
            </span>
            <span className="sub">Depósitos, cuotas y cobros</span>
          </div>
          <div className="stat-card">
            <span className="label">Total egresos del mes</span>
            <span className="value" style={{ color: "#dc2626" }}>
              {formatoQ(datos.resumen.totalEgresosMes)}
            </span>
            <span className="sub">Retiros y desembolsos</span>
          </div>
          <div className={`stat-card ${datos.resumen.diasConDiferencia > 0 ? "danger" : ""}`}>
            <span className="label">Diferencias de arqueo</span>
            <span className="value" style={{ color: datos.resumen.diasConDiferencia === 0 ? "#16a34a" : "#dc2626" }}>
              {datos.resumen.diasConDiferencia === 0
                ? "Cuadrado (Q 0.00)"
                : `${datos.resumen.diasConDiferencia} día(s) con diferencia`}
            </span>
            <span className="sub">
              {datos.resumen.totalSobrante > 0 ? `Sobrante: ${formatoQ(datos.resumen.totalSobrante)} ` : ""}
              {datos.resumen.totalFaltante > 0 ? `Faltante: ${formatoQ(datos.resumen.totalFaltante)}` : ""}
            </span>
          </div>
        </div>
      )}

      {/* Sábana de Días de Caja */}
      <div className="card" style={{ marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <h2 style={{ margin: 0, fontSize: "1.1rem" }}>
            Sábana de Cierres Diarios · <span style={{ textTransform: "capitalize" }}>{mesNombreLargo}</span>
          </h2>
          <span className="sub" style={{ margin: 0 }}>
            {datos?.dias.length ?? 0} registros encontrados
          </span>
        </div>

        {cargando && <p>Cargando arqueos del mes…</p>}

        {!cargando && (!datos || datos.dias.length === 0) && (
          <div className="alert info">
            No se encontraron cajas registradas para el mes de {mesNombreLargo} en {agenciaNombre}.
          </div>
        )}

        {datos && datos.dias.length > 0 && (
          <div className="table-wrap">
            <table style={{ fontSize: "0.85rem" }}>
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Operador (Cajero)</th>
                  <th style={{ textAlign: "right" }}>Saldo Inicial</th>
                  <th style={{ textAlign: "right" }}>Total Ingresos</th>
                  <th style={{ textAlign: "right" }}>Total Egresos</th>
                  <th style={{ textAlign: "right" }}>Saldo Libro</th>
                  <th style={{ textAlign: "right" }}>Efectivo Contado</th>
                  <th style={{ textAlign: "right" }}>Diferencia</th>
                  <th style={{ textAlign: "center" }}>Resultado</th>
                </tr>
              </thead>
              <tbody>
                {datos.dias.map((d) => {
                  const dif = Number(d.diferencia || 0);
                  const contado = Number(d.total_contado || (d.saldo_final ?? d.saldo_inicial));
                  const esperado = Number(d.saldo_final ?? d.saldo_inicial);
                  return (
                    <tr key={d.id}>
                      <td className="mono" style={{ fontWeight: 600 }}>
                        {new Date(d.fecha).toLocaleDateString("es-GT", { weekday: "short", day: "2-digit", month: "2-digit" })}
                      </td>
                      <td>{d.cerrado_por_nombre || d.abierto_por_nombre || "Cajero de Ventanilla"}</td>
                      <td className="mono" style={{ textAlign: "right" }}>{formatoQ(d.saldo_inicial)}</td>
                      <td className="mono" style={{ textAlign: "right", color: "#16a34a" }}>{formatoQ(d.total_ingresos)}</td>
                      <td className="mono" style={{ textAlign: "right", color: "#dc2626" }}>{formatoQ(d.total_egresos)}</td>
                      <td className="mono" style={{ textAlign: "right", fontWeight: 700 }}>{formatoQ(esperado)}</td>
                      <td className="mono" style={{ textAlign: "right" }}>{formatoQ(contado)}</td>
                      <td
                        className="mono"
                        style={{
                          textAlign: "right",
                          fontWeight: 700,
                          color: dif === 0 ? "#16a34a" : (dif > 0 ? "#2563eb" : "#dc2626"),
                        }}
                      >
                        {dif === 0 ? "Q 0.00" : (dif > 0 ? `+${formatoQ(dif)}` : `-${formatoQ(Math.abs(dif))}`)}
                      </td>
                      <td style={{ textAlign: "center" }}>
                        <span
                          className="badge"
                          style={{
                            background: dif === 0 ? "#ecfdf5" : "#fef2f2",
                            color: dif === 0 ? "#065f46" : "#991b1b",
                            fontSize: "0.75rem",
                            padding: "0.2rem 0.5rem",
                          }}
                        >
                          {dif === 0 ? "✓ Cuadrado" : (dif > 0 ? "Sobrante" : "Faltante")}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr style={{ background: "#f8fafc", fontWeight: 800, borderTop: "2px solid #0f172a" }}>
                  <td colSpan={2}>TOTALES DEL MES:</td>
                  <td>—</td>
                  <td className="mono" style={{ textAlign: "right", color: "#16a34a" }}>
                    {formatoQ(datos.resumen.totalIngresosMes)}
                  </td>
                  <td className="mono" style={{ textAlign: "right", color: "#dc2626" }}>
                    {formatoQ(datos.resumen.totalEgresosMes)}
                  </td>
                  <td colSpan={2}></td>
                  <td
                    className="mono"
                    style={{
                      textAlign: "right",
                      color: datos.resumen.diasConDiferencia === 0 ? "#16a34a" : "#dc2626",
                    }}
                  >
                    {datos.resumen.diasConDiferencia === 0
                      ? "Q 0.00"
                      : (datos.resumen.totalSobrante > 0 ? `+${formatoQ(datos.resumen.totalSobrante)}` : `-${formatoQ(datos.resumen.totalFaltante)}`)}
                  </td>
                  <td style={{ textAlign: "center" }}>
                    {datos.resumen.diasConDiferencia === 0 ? "✓ CONFORME" : "REVISADO"}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        {/* Declaración Legal para la Comisión de Vigilancia */}
        <div style={{ marginTop: "1.75rem", borderTop: "1px solid #cbd5e1", paddingTop: "1rem", fontSize: "0.8rem", color: "#334155", lineHeight: 1.45, textAlign: "justify" }}>
          Los miembros de la <strong>Comisión de Vigilancia</strong> abajo firmantes, en cumplimiento a los estatutos de la <strong>Cooperativa Integral de Ahorro y Crédito "Maya Inversiones Futuras", R.L.</strong>, hacemos constar que hemos procedido a la revisión, cotejo documental y verificación física de los libros auxiliares de caja y actas de arqueo correspondientes al mes de <strong style={{ textTransform: "capitalize" }}>{mesNombreLargo}</strong> de la agencia <strong>{agenciaNombre}</strong>, determinando que los registros de ingresos, egresos y saldos fueron llevados de conformidad.
        </div>

        {/* Firmas de la Comisión de Vigilancia */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "2rem 1.5rem", marginTop: "2.5rem" }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ borderTop: "1px solid #0f172a", paddingTop: "0.3rem", fontSize: "0.82rem", fontWeight: 700 }}>
              Presidente
            </div>
            <div style={{ fontSize: "0.72rem", color: "#64748b" }}>Comisión de Vigilancia</div>
          </div>

          <div style={{ textAlign: "center" }}>
            <div style={{ borderTop: "1px solid #0f172a", paddingTop: "0.3rem", fontSize: "0.82rem", fontWeight: 700 }}>
              Secretaria
            </div>
            <div style={{ fontSize: "0.72rem", color: "#64748b" }}>Comisión de Vigilancia</div>
          </div>

          <div style={{ textAlign: "center" }}>
            <div style={{ borderTop: "1px solid #0f172a", paddingTop: "0.3rem", fontSize: "0.82rem", fontWeight: 700 }}>
              Vocal I
            </div>
            <div style={{ fontSize: "0.72rem", color: "#64748b" }}>Comisión de Vigilancia</div>
          </div>

          <div style={{ textAlign: "center" }}>
            <div style={{ borderTop: "1px solid #0f172a", paddingTop: "0.3rem", fontSize: "0.82rem", fontWeight: 700 }}>
              Receptor Pagador
            </div>
            <div style={{ fontSize: "0.72rem", color: "#64748b" }}>Cajero de Ventanilla</div>
          </div>
        </div>
      </div>
    </div>
  );
}
