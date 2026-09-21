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
  const puedeElegirAgencia = usuario?.rol === "GERENCIA";

  const [agencias, setAgencias] = useState<Agencia[]>([]);
  const [agenciaId, setAgenciaId] = useState(usuario?.agenciaId ?? "");
  const [mes, setMes] = useState(() => new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [datos, setDatos] = useState<ArqueoMensualResponse | null>(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Campos Notariales / Estatutarios del Acta
  const [añoStr, mesNum] = mes.split("-");
  const [numeroActa, setNumeroActa] = useState(`CV-${mesNum}-${añoStr}`);
  const [horaInicio, setHoraInicio] = useState("17:00");
  const [horaFin, setHoraFin] = useState("18:15");
  const [lugarMunicipio, setLugarMunicipio] = useState("San Gaspar Chajul");
  const [nombrePresidente, setNombrePresidente] = useState("Jacinto Asicona Brito");
  const [nombreSecretaria, setNombreSecretaria] = useState("Elena Matom Caba");
  const [nombreVocal, setNombreVocal] = useState("Mateo Caba Laynez");
  const [nombreCajero, setNombreCajero] = useState("Ana Elizabeth Pérez");
  const [observaciones, setObservaciones] = useState(
    "Durante la revisión y cotejo documental del presente período, las operaciones de caja se encontraron debidamente soportadas con sus comprobantes y boletas autorizadas. Los saldos en libros coincidieron con el efectivo contado, determinando que los registros de ingresos y egresos fueron llevados con exactitud y estricto apego a los estatutos cooperativos.",
  );
  const [mostrarConfiguracion, setMostrarConfiguracion] = useState(false);

  useEffect(() => {
    setNumeroActa(`CV-${mesNum}-${añoStr}`);
  }, [mes, mesNum, añoStr]);

  useEffect(() => {
    api.get<Agencia[]>("/agencias").then(({ data }) => {
      setAgencias(data);
      if (!agenciaId && data.length > 0) {
        setAgenciaId(data[0].id);
      }
    });
  }, [agenciaId]);

  function cargar() {
    if (!agenciaId) return;
    setCargando(true);
    setError(null);
    api
      .get<ArqueoMensualResponse>("/caja-auxiliar/arqueos-mes", {
        params: { agenciaId, mes },
      })
      .then(({ data }) => {
        setDatos(data);
        if (data.dias.length > 0) {
          const primerCajero = data.dias[0]?.cerrado_por_nombre || data.dias[0]?.abierto_por_nombre;
          if (primerCajero && nombreCajero === "Ana Elizabeth Pérez") {
            setNombreCajero(primerCajero);
          }
        }
      })
      .catch((err) => setError(mensajeError(err)))
      .finally(() => setCargando(false));
  }

  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agenciaId, mes]);

  const agenciaNombre = agencias.find((a) => a.id === agenciaId)?.nombre ?? "Agencia Chajul";

  const fechaMesObj = new Date(Number(añoStr), Number(mesNum) - 1, 1);
  const mesNombreLargo = fechaMesObj.toLocaleDateString("es-GT", { month: "long", year: "numeric" });
  const ultimoDiaMes = new Date(Number(añoStr), Number(mesNum), 0).getDate();

  function exportarCSV() {
    const lineas: string[] = [];
    lineas.push(`LIBRO DE ACTAS DE ARQUEO MENSUAL DE CAJA - COMISION DE VIGILANCIA`);
    lineas.push(`COOPERATIVA MAYA INVERSIONES FUTURAS R.L. "COMIF R.L."`);
    lineas.push(`Acta No.: ${numeroActa}`);
    lineas.push(`Agencia: ${agenciaNombre}`);
    lineas.push(`Periodo: ${mesNombreLargo}`);
    lineas.push("");
    lineas.push("RESUMEN GENERAL DEL MES");
    lineas.push(`Dias Operados,${datos?.resumen?.totalDiasOperados ?? 0}`);
    lineas.push(`Dias Cuadrados Exactos,${datos?.resumen?.diasCuadrados ?? 0}`);
    lineas.push(`Dias con Diferencia,${datos?.resumen?.diasConDiferencia ?? 0}`);
    lineas.push(`Total Ingresos del Mes (Q),${(datos?.resumen?.totalIngresosMes ?? 0).toFixed(2)}`);
    lineas.push(`Total Egresos del Mes (Q),${(datos?.resumen?.totalEgresosMes ?? 0).toFixed(2)}`);
    lineas.push(`Diferencia Neta (Q),${((datos?.resumen?.totalSobrante ?? 0) - (datos?.resumen?.totalFaltante ?? 0)).toFixed(2)}`);
    lineas.push("");
    lineas.push("SABANA DE CIERRES DIARIOS");
    lineas.push("Fecha,Cajero / Operador,Saldo Inicial (Q),Ingresos (Q),Egresos (Q),Saldo Libro (Q),Efectivo Contado (Q),Diferencia (Q),Resultado");
    if (datos && datos.dias.length > 0) {
      datos.dias.forEach((d) => {
        const fechaStr = new Date(d.fecha).toLocaleDateString("es-GT");
        const cajero = `"${(d.cerrado_por_nombre || d.abierto_por_nombre || "").replace(/"/g, '""')}"`;
        const esperado = Number(d.saldo_final ?? d.saldo_inicial);
        const contado = Number(d.total_contado || esperado);
        const dif = Number(d.diferencia || 0);
        const res = dif === 0 ? "CUADRADO" : dif > 0 ? "SOBRANTE" : "FALTANTE";
        lineas.push(
          `${fechaStr},${cajero},${d.saldo_inicial.toFixed(2)},${d.total_ingresos.toFixed(2)},${d.total_egresos.toFixed(2)},${esperado.toFixed(2)},${contado.toFixed(2)},${dif.toFixed(2)},${res}`,
        );
      });
    } else {
      lineas.push(`"Sin operaciones registradas en el mes de ${mesNombreLargo}",,,,,,,,`);
    }
    lineas.push("");
    lineas.push(`Observaciones: "${observaciones.replace(/"/g, '""')}"`);

    const blob = new Blob(["\uFEFF" + lineas.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `acta_arqueo_mensual_${numeroActa}_${agenciaNombre}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      {/* ========================================================================= */}
      {/* PANEL DE CONFIGURACIÓN Y CONTROLES (NO PRINT)                             */}
      {/* ========================================================================= */}
      <div className="no-print">
        <div className="page-head" style={{ marginBottom: "0.75rem", paddingBottom: "0.5rem" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
              <span style={{ fontSize: "1.3rem" }}>📑</span>
              <h1 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 800 }}>Libro de Actas de Arqueo Mensual de Caja</h1>
              <span className="badge" style={{ background: "#fef3c7", color: "#92400e", fontWeight: 700, fontSize: "0.72rem" }}>
                Comisión de Vigilancia
              </span>
            </div>
            <p style={{ margin: "0.15rem 0 0", fontSize: "0.78rem" }}>
              Emisión de actas oficiales con formato estatutario notarial para la Comisión de Vigilancia y Auditoría Interna.
            </p>
          </div>

          <div style={{ display: "flex", gap: "0.45rem", alignItems: "center", flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
              <label htmlFor="mes-picker" style={{ fontSize: "0.8rem", fontWeight: 600 }}>
                Mes:
              </label>
              <input
                id="mes-picker"
                type="month"
                value={mes}
                onChange={(e) => setMes(e.target.value)}
                style={{ padding: "0.3rem 0.45rem", borderRadius: "6px", fontSize: "0.82rem" }}
              />
            </div>

            {puedeElegirAgencia && (
              <select value={agenciaId} onChange={(e) => setAgenciaId(e.target.value)} style={{ maxWidth: 170, fontSize: "0.82rem", padding: "0.3rem 0.45rem" }}>
                {agencias.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.nombre}
                  </option>
                ))}
              </select>
            )}

            <button
              type="button"
              className="btn secondary"
              onClick={exportarCSV}
              disabled={cargando}
              style={{ fontSize: "0.8rem", padding: "0.35rem 0.65rem" }}
            >
              📥 Excel (CSV)
            </button>
            <button
              type="button"
              className="btn"
              onClick={() => window.print()}
              disabled={cargando}
              style={{ fontSize: "0.8rem", padding: "0.35rem 0.65rem" }}
            >
              🖨️ Imprimir Acta Oficial
            </button>
          </div>
        </div>

        {error && <div className="alert error" style={{ margin: "0.4rem 0", padding: "0.5rem 0.75rem", fontSize: "0.82rem" }}>{error}</div>}

        {/* Panel Desplegable de Parámetros Notariales */}
        <div className="card" style={{ marginBottom: "0.75rem", background: "var(--paper-raised)", padding: "0.55rem 0.85rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.5rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
              <span style={{ fontSize: "0.84rem", fontWeight: 700, color: "var(--accent)" }}>
                ⚙️ Datos Oficiales del Acta:
              </span>
              <span className="badge" style={{ fontSize: "0.72rem", padding: "0.15rem 0.45rem" }}>
                Acta: <strong>{numeroActa}</strong>
              </span>
              <span className="badge" style={{ fontSize: "0.72rem", padding: "0.15rem 0.45rem" }}>
                📍 {lugarMunicipio}
              </span>
              <span className="badge" style={{ fontSize: "0.72rem", padding: "0.15rem 0.45rem" }}>
                ⏰ {horaInicio} – {horaFin}
              </span>
              <span className="badge" style={{ fontSize: "0.72rem", padding: "0.15rem 0.45rem" }}>
                👤 Pres.: {nombrePresidente}
              </span>
            </div>

            <button
              type="button"
              className="btn secondary"
              onClick={() => setMostrarConfiguracion(!mostrarConfiguracion)}
              style={{ fontSize: "0.75rem", padding: "0.25rem 0.6rem" }}
              title="Ajustar nombres de la comisión, horario y observaciones"
            >
              {mostrarConfiguracion ? "▲ Ocultar Parámetros" : "▼ Modificar Datos y Firmantes"}
            </button>
          </div>

          {mostrarConfiguracion && (
            <div style={{ marginTop: "0.65rem", paddingTop: "0.65rem", borderTop: "1px solid var(--line)" }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: "0.6rem" }}>
                <div className="field" style={{ marginBottom: 0 }}>
                  <label style={{ fontSize: "0.72rem" }}>No. de Acta</label>
                  <input
                    type="text"
                    value={numeroActa}
                    onChange={(e) => setNumeroActa(e.target.value)}
                    placeholder="CV-09-2026"
                    style={{ fontSize: "0.82rem", padding: "0.3rem 0.45rem" }}
                  />
                </div>
                <div className="field" style={{ marginBottom: 0 }}>
                  <label style={{ fontSize: "0.72rem" }}>Municipio / Lugar</label>
                  <input
                    type="text"
                    value={lugarMunicipio}
                    onChange={(e) => setLugarMunicipio(e.target.value)}
                    placeholder="San Gaspar Chajul, Quiché"
                    style={{ fontSize: "0.82rem", padding: "0.3rem 0.45rem" }}
                  />
                </div>
                <div className="field" style={{ marginBottom: 0 }}>
                  <label style={{ fontSize: "0.72rem" }}>Hora Inicio</label>
                  <input
                    type="time"
                    value={horaInicio}
                    onChange={(e) => setHoraInicio(e.target.value)}
                    style={{ fontSize: "0.82rem", padding: "0.3rem 0.45rem" }}
                  />
                </div>
                <div className="field" style={{ marginBottom: 0 }}>
                  <label style={{ fontSize: "0.72rem" }}>Hora Cierre</label>
                  <input
                    type="time"
                    value={horaFin}
                    onChange={(e) => setHoraFin(e.target.value)}
                    style={{ fontSize: "0.82rem", padding: "0.3rem 0.45rem" }}
                  />
                </div>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
                  gap: "0.6rem",
                  marginTop: "0.6rem",
                }}
              >
                <div className="field" style={{ marginBottom: 0 }}>
                  <label style={{ fontSize: "0.72rem" }}>Presidente (Comisión Vigilancia)</label>
                  <input
                    type="text"
                    value={nombrePresidente}
                    onChange={(e) => setNombrePresidente(e.target.value)}
                    style={{ fontSize: "0.82rem", padding: "0.3rem 0.45rem" }}
                  />
                </div>
                <div className="field" style={{ marginBottom: 0 }}>
                  <label style={{ fontSize: "0.72rem" }}>Secretaria (Comisión Vigilancia)</label>
                  <input
                    type="text"
                    value={nombreSecretaria}
                    onChange={(e) => setNombreSecretaria(e.target.value)}
                    style={{ fontSize: "0.82rem", padding: "0.3rem 0.45rem" }}
                  />
                </div>
                <div className="field" style={{ marginBottom: 0 }}>
                  <label style={{ fontSize: "0.72rem" }}>Vocal I (Comisión Vigilancia)</label>
                  <input
                    type="text"
                    value={nombreVocal}
                    onChange={(e) => setNombreVocal(e.target.value)}
                    style={{ fontSize: "0.82rem", padding: "0.3rem 0.45rem" }}
                  />
                </div>
                <div className="field" style={{ marginBottom: 0 }}>
                  <label style={{ fontSize: "0.72rem" }}>Receptor Pagador (Cajero)</label>
                  <input
                    type="text"
                    value={nombreCajero}
                    onChange={(e) => setNombreCajero(e.target.value)}
                    style={{ fontSize: "0.82rem", padding: "0.3rem 0.45rem" }}
                  />
                </div>
              </div>

              <div className="field" style={{ marginTop: "0.6rem", marginBottom: 0 }}>
                <label style={{ fontSize: "0.72rem" }}>
                  <strong>Observaciones / Hallazgos de Auditoría</strong> (Se imprime en el Punto Tercero del Acta)
                </label>
                <textarea
                  rows={2}
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  style={{ fontSize: "0.8rem", width: "100%", padding: "0.35rem 0.45rem" }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* ACTA OFICIAL NOTARIAL / ESTATUTARIA (PANTALLA E IMPRESIÓN)                */}
      {/* ========================================================================= */}
      <div
        className="card"
        style={{
          background: "var(--paper)",
          border: "1px solid var(--line)",
          padding: "1.1rem 1.4rem",
          width: "100%",
          boxSizing: "border-box",
        }}
      >
        {/* Encabezado Institucional */}
        <div
          style={{
            textAlign: "center",
            borderBottom: "2px solid #0f172a",
            paddingBottom: "0.6rem",
            marginBottom: "0.8rem",
          }}
        >
          <div style={{ fontSize: "1rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.03em" }}>
            COOPERATIVA MAYA INVERSIONES FUTURAS R.L. &quot;COMIF R.L.&quot;
          </div>
          <div style={{ fontSize: "1.15rem", color: "#047857", fontWeight: 800, margin: "0.15rem 0" }}>
            COMISIÓN DE VIGILANCIA · LIBRO DE ACTAS DE ARQUEO MENSUAL
          </div>
          <div style={{ fontSize: "0.92rem", fontWeight: 700, textDecoration: "underline", color: "#0f172a" }}>
            ACTA NÚMERO: {numeroActa}
          </div>
          <div style={{ fontSize: "0.78rem", color: "var(--ink-soft)", marginTop: "2px" }}>
            Agencia: <strong>{agenciaNombre.toUpperCase()}</strong> · Período de Auditoría:{" "}
            <strong style={{ textTransform: "capitalize" }}>{mesNombreLargo}</strong> · Cifras en Quetzales (Q)
          </div>
        </div>

        {cargando && <p style={{ textAlign: "center", padding: "1rem" }}>Cargando arqueos del mes…</p>}

        {!cargando && (!datos || datos.dias.length === 0) && (
          <div className="alert info no-print" style={{ margin: "0.5rem 0" }}>
            ℹ️ No se encontraron cajas operadas para el mes de {mesNombreLargo} en {agenciaNombre}. Se muestra el formato notarial oficial con saldo Q 0.00 para efectos de acta y dictamen.
          </div>
        )}

        <div style={{ fontSize: "0.82rem", lineHeight: 1.5, color: "var(--ink)" }}>
          {/* PUNTO PRIMERO */}
          <div style={{ marginBottom: "0.75rem", textAlign: "justify" }}>
            <strong style={{ textDecoration: "underline" }}>PUNTO PRIMERO (APERTURA Y QUÓRUM):</strong> En el municipio
            de {lugarMunicipio}, departamento de Quiché, siendo las {horaInicio} horas del día {ultimoDiaMes} del mes
            de {mesNombreLargo}, reunidos en las oficinas de la Agencia <strong>{agenciaNombre}</strong> de la{" "}
            <strong>COOPERATIVA MAYA INVERSIONES FUTURAS R.L. &quot;COMIF R.L.&quot;</strong>, se
            constituyen los miembros de la Comisión de Vigilancia: <strong>{nombrePresidente}</strong> (Presidente),{" "}
            <strong>{nombreSecretaria}</strong> (Secretaria) y <strong>{nombreVocal}</strong> (Vocal I), en presencia del
            Receptor Pagador <strong>{nombreCajero}</strong>, con el propósito de celebrar la sesión ordinaria de
            verificación, cotejo y cierre mensual del libro auxiliar de caja.
          </div>

          {/* PUNTO SEGUNDO */}
          <div style={{ marginBottom: "0.5rem" }}>
            <div style={{ textAlign: "justify", marginBottom: "0.4rem" }}>
              <strong style={{ textDecoration: "underline" }}>PUNTO SEGUNDO (REVISIÓN DE OPERACIONES Y SÁBANA DE CIERRES):</strong>{" "}
              La Comisión de Vigilancia procedió a la revisión minuciosa y cotejo diario de los comprobantes de ingreso y egreso
              generados durante el mes, arrojando el siguiente resumen consolidado:
            </div>

            {/* Cintillo de Cifras Clave */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
                gap: "0.45rem",
                marginBottom: "0.5rem",
                background: "var(--paper-raised)",
                padding: "0.4rem 0.6rem",
                borderRadius: "6px",
                border: "1px solid var(--line)",
                fontSize: "0.72rem",
              }}
            >
              <div>
                <span style={{ color: "var(--ink-soft)", display: "block", fontSize: "0.65rem", textTransform: "uppercase" }}>
                  Días Operados
                </span>
                <strong className="mono" style={{ fontSize: "0.9rem" }}>
                  {datos?.resumen?.totalDiasOperados ?? 0} días
                </strong>
              </div>

              <div>
                <span style={{ color: "var(--ink-soft)", display: "block", fontSize: "0.65rem", textTransform: "uppercase" }}>
                  Efectividad de Cuadre
                </span>
                <strong className="mono" style={{ fontSize: "0.9rem", color: "#16a34a" }}>
                  {datos?.resumen ? `${datos.resumen.diasCuadrados} / ${datos.resumen.totalDiasOperados}` : "0 / 0"} (
                  {datos?.resumen && datos.resumen.totalDiasOperados > 0
                    ? Math.round((datos.resumen.diasCuadrados / datos.resumen.totalDiasOperados) * 100)
                    : 100}
                  %)
                </strong>
              </div>

              <div>
                <span style={{ color: "var(--ink-soft)", display: "block", fontSize: "0.65rem", textTransform: "uppercase" }}>
                  Total Ingresos del Mes
                </span>
                <strong className="mono" style={{ fontSize: "0.9rem", color: "#16a34a" }}>
                  + {formatoQ(datos?.resumen?.totalIngresosMes ?? 0)}
                </strong>
              </div>

              <div>
                <span style={{ color: "var(--ink-soft)", display: "block", fontSize: "0.65rem", textTransform: "uppercase" }}>
                  Total Egresos del Mes
                </span>
                <strong className="mono" style={{ fontSize: "0.9rem", color: "#dc2626" }}>
                  − {formatoQ(datos?.resumen?.totalEgresosMes ?? 0)}
                </strong>
              </div>

              <div
                style={{
                  background: (datos?.resumen?.diasConDiferencia ?? 0) === 0 ? "rgba(22, 163, 74, 0.1)" : "rgba(220, 38, 38, 0.1)",
                  padding: "2px 4px",
                  borderRadius: "4px",
                }}
              >
                <span style={{ color: "var(--ink-soft)", display: "block", fontSize: "0.65rem", textTransform: "uppercase" }}>
                  Diferencia de Caja
                </span>
                <strong
                  className="mono"
                  style={{
                    fontSize: "0.9rem",
                    color: (datos?.resumen?.diasConDiferencia ?? 0) === 0 ? "#16a34a" : "#dc2626",
                  }}
                >
                  {(datos?.resumen?.diasConDiferencia ?? 0) === 0
                    ? "Cuadrado (Q 0.00)"
                    : `${datos?.resumen?.diasConDiferencia} día(s)`}
                </strong>
              </div>
            </div>

            {/* Sábana de Cierres Diarios */}
            <div className="table-wrap" style={{ border: "1px solid var(--line)" }}>
              <table style={{ fontSize: "0.75rem", width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "var(--paper-raised)" }}>
                    <th style={{ width: "70px", padding: "2px 4px" }}>Fecha</th>
                    <th style={{ padding: "2px 4px" }}>Cajero / Operador</th>
                    <th style={{ width: "85px", textAlign: "right", padding: "2px 4px" }}>Saldo Inicial</th>
                    <th style={{ width: "85px", textAlign: "right", padding: "2px 4px" }}>Ingresos (+)</th>
                    <th style={{ width: "85px", textAlign: "right", padding: "2px 4px" }}>Egresos (−)</th>
                    <th style={{ width: "85px", textAlign: "right", padding: "2px 4px" }}>Saldo Libro</th>
                    <th style={{ width: "85px", textAlign: "right", padding: "2px 4px" }}>Contado</th>
                    <th style={{ width: "75px", textAlign: "right", padding: "2px 4px" }}>Diferencia</th>
                    <th style={{ width: "75px", textAlign: "center", padding: "2px 4px" }}>Resultado</th>
                  </tr>
                </thead>
                <tbody>
                  {datos && datos.dias.length > 0 ? (
                    datos.dias.map((d) => {
                      const dif = Number(d.diferencia || 0);
                      const esperado = Number(d.saldo_final ?? d.saldo_inicial);
                      const contado = Number(d.total_contado || esperado);
                      return (
                        <tr key={d.id}>
                          <td className="mono" style={{ fontWeight: 600, padding: "2px 4px" }}>
                            {new Date(d.fecha).toLocaleDateString("es-GT", {
                              weekday: "short",
                              day: "2-digit",
                              month: "2-digit",
                            })}
                          </td>
                          <td style={{ padding: "2px 4px" }}>
                            {d.cerrado_por_nombre || d.abierto_por_nombre || nombreCajero}
                          </td>
                          <td className="mono" style={{ textAlign: "right", padding: "2px 4px" }}>
                            {formatoQ(d.saldo_inicial)}
                          </td>
                          <td className="mono" style={{ textAlign: "right", color: "#16a34a", padding: "2px 4px" }}>
                            {formatoQ(d.total_ingresos)}
                          </td>
                          <td className="mono" style={{ textAlign: "right", color: "#dc2626", padding: "2px 4px" }}>
                            {formatoQ(d.total_egresos)}
                          </td>
                          <td className="mono" style={{ textAlign: "right", fontWeight: 700, padding: "2px 4px" }}>
                            {formatoQ(esperado)}
                          </td>
                          <td className="mono" style={{ textAlign: "right", padding: "2px 4px" }}>
                            {formatoQ(contado)}
                          </td>
                          <td
                            className="mono"
                            style={{
                              textAlign: "right",
                              fontWeight: 700,
                              color: dif === 0 ? "#16a34a" : dif > 0 ? "#2563eb" : "#dc2626",
                              padding: "2px 4px",
                            }}
                          >
                            {dif === 0 ? "Q 0.00" : dif > 0 ? `+${formatoQ(dif)}` : `-${formatoQ(Math.abs(dif))}`}
                          </td>
                          <td style={{ textAlign: "center", padding: "2px 4px" }}>
                            <span
                              style={{
                                color: dif === 0 ? "#16a34a" : "#dc2626",
                                fontWeight: 700,
                                fontSize: "0.72rem",
                              }}
                            >
                              {dif === 0 ? "✓ Cuadrado" : dif > 0 ? "Sobrante" : "Faltante"}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={9} style={{ textAlign: "center", padding: "14px 8px", color: "var(--ink-soft)", fontStyle: "italic" }}>
                        Sin movimientos de caja registrados en este período mensual (0 operaciones registradas)
                      </td>
                    </tr>
                  )}
                </tbody>
                <tfoot>
                  <tr style={{ background: "rgba(0,0,0,0.04)", fontWeight: 800, borderTop: "2px solid #0f172a" }}>
                    <td colSpan={2} style={{ padding: "3px 4px" }}>
                      TOTALES DEL MES:
                    </td>
                    <td style={{ padding: "3px 4px" }}>—</td>
                    <td className="mono" style={{ textAlign: "right", color: "#16a34a", padding: "3px 4px" }}>
                      {formatoQ(datos?.resumen?.totalIngresosMes ?? 0)}
                    </td>
                    <td className="mono" style={{ textAlign: "right", color: "#dc2626", padding: "3px 4px" }}>
                      {formatoQ(datos?.resumen?.totalEgresosMes ?? 0)}
                    </td>
                    <td colSpan={2} style={{ padding: "3px 4px" }}></td>
                    <td
                      className="mono"
                      style={{
                        textAlign: "right",
                        color: (datos?.resumen?.diasConDiferencia ?? 0) === 0 ? "#16a34a" : "#dc2626",
                        padding: "3px 4px",
                      }}
                    >
                      {(datos?.resumen?.diasConDiferencia ?? 0) === 0
                        ? "Q 0.00"
                        : (datos?.resumen?.totalSobrante ?? 0) > 0
                        ? `+${formatoQ(datos?.resumen?.totalSobrante ?? 0)}`
                        : `-${formatoQ(datos?.resumen?.totalFaltante ?? 0)}`}
                    </td>
                    <td style={{ textAlign: "center", padding: "3px 4px" }}>
                      {(datos?.resumen?.diasConDiferencia ?? 0) === 0 ? "✓ CONFORME" : "REVISADO"}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

            {/* PUNTO TERCERO */}
            <div style={{ marginTop: "0.6rem", marginBottom: "0.6rem", textAlign: "justify" }}>
              <strong style={{ textDecoration: "underline" }}>PUNTO TERCERO (HALLAZGOS Y DICTAMEN DE AUDITORÍA):</strong>{" "}
              {observaciones}
            </div>

            {/* PUNTO CUARTO */}
            <div style={{ marginBottom: "1rem", textAlign: "justify" }}>
              <strong style={{ textDecoration: "underline" }}>PUNTO CUARTO (CIERRE Y RATIFICACIÓN):</strong> No habiendo
              más que hacer constar, se da por finalizada la presente sesión de arqueo mensual a las {horaFin} horas en el
              mismo lugar y fecha de su inicio, leída íntegramente la presente acta y enterados de su contenido, objeto y
              validez legal, la aceptamos, ratificamos y firmamos de entera conformidad.
            </div>

            {/* BLOQUE DE FIRMAS OFICIALES (4 FIRMAS CON NOMBRES REALES) */}
            <div
              style={{
                marginTop: "1.25rem",
                paddingTop: "0.6rem",
                borderTop: "1px dashed var(--line)",
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
                gap: "1.25rem 1rem",
                textAlign: "center",
                pageBreakInside: "avoid",
              }}
            >
              <div>
                <div style={{ borderBottom: "1px solid #000", height: "28px", marginBottom: "0.2rem" }} />
                <div style={{ fontWeight: 700, fontSize: "0.78rem" }}>{nombrePresidente}</div>
                <div style={{ fontSize: "0.7rem", color: "var(--ink-soft)" }}>Presidente</div>
                <div style={{ fontSize: "0.65rem", color: "var(--ink-soft)" }}>Comisión de Vigilancia</div>
              </div>

              <div>
                <div style={{ borderBottom: "1px solid #000", height: "28px", marginBottom: "0.2rem" }} />
                <div style={{ fontWeight: 700, fontSize: "0.78rem" }}>{nombreSecretaria}</div>
                <div style={{ fontSize: "0.7rem", color: "var(--ink-soft)" }}>Secretaria</div>
                <div style={{ fontSize: "0.65rem", color: "var(--ink-soft)" }}>Comisión de Vigilancia</div>
              </div>

              <div>
                <div style={{ borderBottom: "1px solid #000", height: "28px", marginBottom: "0.2rem" }} />
                <div style={{ fontWeight: 700, fontSize: "0.78rem" }}>{nombreVocal}</div>
                <div style={{ fontSize: "0.7rem", color: "var(--ink-soft)" }}>Vocal I</div>
                <div style={{ fontSize: "0.65rem", color: "var(--ink-soft)" }}>Comisión de Vigilancia</div>
              </div>

              <div>
                <div style={{ borderBottom: "1px solid #000", height: "28px", marginBottom: "0.2rem" }} />
                <div style={{ fontWeight: 700, fontSize: "0.78rem" }}>{nombreCajero}</div>
                <div style={{ fontSize: "0.7rem", color: "var(--ink-soft)" }}>Receptor Pagador</div>
                <div style={{ fontSize: "0.65rem", color: "var(--ink-soft)" }}>Cajero de Ventanilla</div>
              </div>
            </div>
          </div>
      </div>
    </div>
  );
}
