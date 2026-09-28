import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import type { ConsolidadoFinancieroData } from "../types";
import { formatoQ } from "../types";

type TabFinanciero = "BALANCE" | "RESULTADOS" | "RIESGO";

export function ConsolidadoFinanciero() {
  const { usuario } = useAuth();
  const [datos, setDatos] = useState<ConsolidadoFinancieroData | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tabActiva, setTabActiva] = useState<TabFinanciero>("BALANCE");

  // Filtros
  const [agenciaSeleccionada, setAgenciaSeleccionada] = useState<string>(
    usuario?.agenciaId || "4eb670fd-af21-49e1-b6d4-76fa94a325aa"
  );
  const [fechaCorte, setFechaCorte] = useState<string>(
    new Date().toISOString().slice(0, 10)
  );

  const cargarDatos = async () => {
    setCargando(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (agenciaSeleccionada && agenciaSeleccionada !== "all") {
        params.append("agenciaId", agenciaSeleccionada);
      }
      if (fechaCorte) {
        params.append("fechaCorte", fechaCorte);
      }

      const res = await api.get<any>(
        `/consolidado-financiero?${params.toString()}`
      );
      const resultado: ConsolidadoFinancieroData = res.data?.data || res.data;
      if (resultado && resultado.balanceGeneral) {
        setDatos(resultado);
      } else {
        setError("No se pudieron cargar los estados financieros");
      }
    } catch (err: any) {
      console.error("Error al cargar estados financieros:", err);
      setError(err?.response?.data?.mensaje || "Error al conectar con el servidor contable");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, [agenciaSeleccionada, fechaCorte]);

  const imprimirReporte = () => {
    window.print();
  };

  const exportarCSV = () => {
    if (!datos) return;
    const lineas: string[] = [];
    lineas.push("COOPERATIVA MAYA INVERSIONES FUTURAS R.L. (COMIF-R.L.)");
    lineas.push(`ESTADOS FINANCIEROS OFICIALES - ${datos.agencia.nombre.toUpperCase()}`);
    lineas.push(`Fecha de Corte: ${datos.fechaCorte}`);
    lineas.push("");

    if (tabActiva === "BALANCE") {
      lineas.push("BALANCE GENERAL (ESTADO DE SITUACIÓN FINANCIERA)");
      lineas.push("CÓDIGO,CONCEPTO,MONTO (Q)");
      lineas.push("1. ACTIVO,,");
      lineas.push("101. DISPONIBILIDADES,,");
      datos.balanceGeneral.activo.disponible.rubros.forEach((r) => {
        lineas.push(`"${r.codigo}","${r.concepto}",${r.monto.toFixed(2)}`);
      });
      lineas.push(`"TOTAL DISPONIBILIDADES","",${datos.balanceGeneral.activo.disponible.total.toFixed(2)}`);
      lineas.push("103. CARTERA DE CRÉDITOS,,");
      datos.balanceGeneral.activo.cartera.rubros.forEach((r) => {
        lineas.push(`"${r.codigo}","${r.concepto}",${r.monto.toFixed(2)}`);
      });
      lineas.push(`"TOTAL CARTERA NETA","",${datos.balanceGeneral.activo.cartera.totalNeto.toFixed(2)}`);
      lineas.push(`"TOTAL ACTIVO","",${datos.balanceGeneral.activo.totalActivo.toFixed(2)}`);
      lineas.push("");
      lineas.push("2. PASIVO,,");
      lineas.push("201. CAPTACIONES DE AHORRO,,");
      datos.balanceGeneral.pasivo.captacionesAhorro.rubros.forEach((r) => {
        lineas.push(`"${r.codigo}","${r.concepto}",${r.monto.toFixed(2)}`);
      });
      lineas.push(`"TOTAL AHORROS","",${datos.balanceGeneral.pasivo.captacionesAhorro.total.toFixed(2)}`);
      lineas.push("202. DEPÓSITOS A PLAZO FIJO,,");
      lineas.push(`"202-01","Capital Invertido Activo",${datos.balanceGeneral.pasivo.plazoFijo.capitalVigente.toFixed(2)}`);
      lineas.push(`"202-02","Intereses por Pagar",${datos.balanceGeneral.pasivo.plazoFijo.interesesPorPagar.toFixed(2)}`);
      lineas.push(`"TOTAL PASIVO","",${datos.balanceGeneral.pasivo.totalPasivo.toFixed(2)}`);
      lineas.push("");
      lineas.push("3. PATRIMONIO,,");
      datos.balanceGeneral.patrimonio.aportacionesCapital.rubros.forEach((r) => {
        lineas.push(`"${r.codigo}","${r.concepto}",${r.monto.toFixed(2)}`);
      });
      lineas.push(`"302-01","Reserva Institucional (5%)",${datos.balanceGeneral.patrimonio.reservaInstitucional.toFixed(2)}`);
      lineas.push(`"303-01","Excedente del Ejercicio",${datos.balanceGeneral.patrimonio.excedenteNetoPeriodo.toFixed(2)}`);
      if (Number(datos.balanceGeneral.patrimonio.fondoInstitucionalCartera || 0) > 0) {
        lineas.push(`"304-01","Línea de Crédito FEDERURAL / Fondos Propios de Cartera",${Number(datos.balanceGeneral.patrimonio.fondoInstitucionalCartera).toFixed(2)}`);
      }
      lineas.push(`"TOTAL PATRIMONIO","",${datos.balanceGeneral.patrimonio.totalPatrimonio.toFixed(2)}`);
      lineas.push(`"TOTAL PASIVO + PATRIMONIO","",${datos.balanceGeneral.cuadre.totalPasivoMasPatrimonio.toFixed(2)}`);
      lineas.push(`"DIFERENCIA DE CUADRE","",${datos.balanceGeneral.cuadre.diferencia.toFixed(2)}`);
    } else if (tabActiva === "RESULTADOS") {
      lineas.push("ESTADO DE RESULTADOS (PÉRDIDAS Y GANANCIAS)");
      lineas.push("CÓDIGO,CONCEPTO,MONTO (Q)");
      lineas.push("INGRESOS FINANCIEROS,,");
      datos.estadoResultados.ingresosFinancieros.rubros.forEach((r) => {
        lineas.push(`"${r.codigo}","${r.concepto}",${r.monto.toFixed(2)}`);
      });
      lineas.push(`"TOTAL INGRESOS","",${datos.estadoResultados.ingresosFinancieros.total.toFixed(2)}`);
      lineas.push("COSTOS FINANCIEROS,,");
      datos.estadoResultados.costosFinancieros.rubros.forEach((r) => {
        lineas.push(`"${r.codigo}","${r.concepto}",${r.monto.toFixed(2)}`);
      });
      lineas.push(`"TOTAL COSTOS FINANCIEROS","",${datos.estadoResultados.costosFinancieros.total.toFixed(2)}`);
      lineas.push(`"MARGEN FINANCIERO BRUTO","",${datos.estadoResultados.margenFinancieroBruto.toFixed(2)}`);
      lineas.push("GASTOS OPERATIVOS (CAJA CHICA),,");
      datos.estadoResultados.gastosOperativos.rubros.forEach((r) => {
        lineas.push(`"${r.codigo}","${r.concepto}",${r.monto.toFixed(2)}`);
      });
      lineas.push(`"TOTAL GASTOS OPERATIVOS","",${datos.estadoResultados.gastosOperativos.total.toFixed(2)}`);
      lineas.push(`"EXCEDENTE NETO DEL EJERCICIO","",${datos.estadoResultados.excedenteNeto.toFixed(2)}`);
    } else {
      lineas.push("CALIDAD DE CARTERA Y RIESGO CREDITICIO");
      lineas.push(`"Índice de Morosidad (PAR > 30)","${datos.calidadCartera.indiceMorosidad}%"`);
      lineas.push(`"Provisión Cartera","${datos.balanceGeneral.activo.cartera.provisionEstimada.toFixed(2)}"`);
      lineas.push("");
      lineas.push("TRAMO DE MORA,CRÉDITOS,CAPITAL (Q),PORCENTAJE (%)");
      lineas.push(`"Al Día (0 días)",${datos.calidadCartera.tramosMora.alDia.cantidad},${datos.calidadCartera.tramosMora.alDia.monto.toFixed(2)},${datos.calidadCartera.tramosMora.alDia.porcentaje}%`);
      lineas.push(`"Riesgo Leve (1-30 días)",${datos.calidadCartera.tramosMora.rango1_30.cantidad},${datos.calidadCartera.tramosMora.rango1_30.monto.toFixed(2)},${datos.calidadCartera.tramosMora.rango1_30.porcentaje}%`);
      lineas.push(`"Mora Media (31-60 días)",${datos.calidadCartera.tramosMora.rango31_60.cantidad},${datos.calidadCartera.tramosMora.rango31_60.monto.toFixed(2)},${datos.calidadCartera.tramosMora.rango31_60.porcentaje}%`);
      lineas.push(`"Mora Alta (61-90 días)",${datos.calidadCartera.tramosMora.rango61_90.cantidad},${datos.calidadCartera.tramosMora.rango61_90.monto.toFixed(2)},${datos.calidadCartera.tramosMora.rango61_90.porcentaje}%`);
      lineas.push(`"Cobro Judicial (> 90 días)",${datos.calidadCartera.tramosMora.mas90.cantidad},${datos.calidadCartera.tramosMora.mas90.monto.toFixed(2)},${datos.calidadCartera.tramosMora.mas90.porcentaje}%`);
    }

    const blob = new Blob(["\uFEFF" + lineas.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Estados_Financieros_${datos.agencia.codigo}_${datos.fechaCorte}.csv`;
    link.click();
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.55rem", width: "100%", maxWidth: "100%" }}>
      {/* ── HEADER INSTITUCIONAL CON ESTILO GLOBAL ── */}
      <div className="no-print" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.6rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
          <span style={{ fontSize: "1.45rem", lineHeight: 1 }}>📊</span>
          <div>
            <h1 style={{ margin: 0, fontSize: "1.2rem", color: "var(--ink)", fontWeight: 800, letterSpacing: "-0.01em" }}>
              Estados Financieros Oficiales
            </h1>
            <p style={{ margin: 0, fontSize: "0.78rem", color: "var(--ink-soft)" }}>
              COOPERATIVA MAYA INVERSIONES FUTURAS R.L. "COMIF-R.L." · {datos?.agencia.nombre || "Agencia Chajul"}
            </p>
          </div>
        </div>

        {/* Acciones y Filtros en barra única */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
          {(usuario?.rol === "ADMIN" || usuario?.rol === "GERENCIA") && (
            <select
              value={agenciaSeleccionada}
              onChange={(e) => setAgenciaSeleccionada(e.target.value)}
              className="input-select"
              style={{
                padding: "0.32rem 0.65rem",
                fontSize: "0.82rem",
                borderRadius: "6px",
                height: "32px",
                borderColor: "var(--line)",
                background: "var(--paper)",
                color: "var(--ink)",
                fontWeight: 600,
              }}
            >
              <option value="4eb670fd-af21-49e1-b6d4-76fa94a325aa">🏛️ Agencia Chajul</option>
              <option value="all">🌐 Todas las Agencias (Consolidado)</option>
              <option value="f7b0f06e-1962-4607-9402-ad7c8cb8e1da">🏔️ Agencia Nebaj</option>
              <option value="48948093-b1fa-4f67-9056-fbd56a6cb5bb">🌲 Agencia Acul</option>
            </select>
          )}

          <div style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
            <span style={{ fontSize: "0.78rem", color: "var(--ink-soft)", fontWeight: 600 }}>Corte:</span>
            <input
              type="date"
              value={fechaCorte}
              onChange={(e) => setFechaCorte(e.target.value)}
              className="input-date"
              style={{
                padding: "0.25rem 0.5rem",
                fontSize: "0.82rem",
                borderRadius: "6px",
                height: "32px",
                borderColor: "var(--line)",
                background: "var(--paper)",
                color: "var(--ink)",
                fontWeight: 600,
              }}
            />
          </div>

          <button
            onClick={exportarCSV}
            className="btn secondary"
            style={{ display: "flex", alignItems: "center", gap: "0.3rem", fontSize: "0.8rem", padding: "0.32rem 0.65rem", height: "32px" }}
            title="Exportar a Microsoft Excel (CSV)"
          >
            📥 Excel
          </button>

          <button
            onClick={imprimirReporte}
            className="btn"
            style={{ display: "flex", alignItems: "center", gap: "0.3rem", fontSize: "0.8rem", padding: "0.32rem 0.75rem", height: "32px", background: "#059669", borderColor: "#059669", color: "#ffffff", fontWeight: 700 }}
            title="Imprimir balance y firmas legales en PDF o papel"
          >
            🖨️ Imprimir
          </button>
        </div>
      </div>

      {error && (
        <div className="alert error no-print" style={{ padding: "0.5rem 0.85rem", fontSize: "0.82rem" }}>
          {error}
        </div>
      )}

      {cargando ? (
        <div style={{ padding: "2.5rem", textAlign: "center", color: "var(--ink-soft)" }}>
          <div className="spinner" style={{ margin: "0 auto 0.75rem" }} />
          Calculando estados financieros oficiales de la agencia en tiempo real…
        </div>
      ) : !datos ? (
        <div style={{ padding: "2rem", textAlign: "center", color: "var(--ink-soft)" }}>
          No se encontraron datos para los parámetros seleccionados.
        </div>
      ) : (
        <>
          {/* ── CINTILLO DE 5 KPIS ESTILO GLOBAL (FONDO CLARO, BORDES DE COLOR Y LETRAS VIBRANTES) ── */}
          <div
            className="no-print"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(5, 1fr)",
              gap: "0.5rem",
              width: "100%",
            }}
          >
            {/* Total Activo */}
            <div style={{ background: "var(--paper)", border: "1px solid var(--line)", borderLeft: "4px solid #059669", borderRadius: "8px", padding: "0.5rem 0.75rem", boxShadow: "var(--shadow)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "0.68rem", color: "#059669", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.03em" }}>Total Activo</span>
                <span style={{ fontSize: "0.85rem" }}>🏛️</span>
              </div>
              <div className="mono" style={{ fontSize: "1.18rem", fontWeight: 800, color: "#059669", lineHeight: 1.2, margin: "0.15rem 0 0.1rem" }}>
                {formatoQ(datos.balanceGeneral.activo.totalActivo)}
              </div>
              <div style={{ fontSize: "0.68rem", color: "var(--ink-soft)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                Cartera neta + Efectivo disponible
              </div>
            </div>

            {/* Cartera Bruta */}
            <div style={{ background: "var(--paper)", border: "1px solid var(--line)", borderLeft: "4px solid #0284c7", borderRadius: "8px", padding: "0.5rem 0.75rem", boxShadow: "var(--shadow)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "0.68rem", color: "#0284c7", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.03em" }}>Cartera Bruta</span>
                <span style={{ fontSize: "0.85rem" }}>💼</span>
              </div>
              <div className="mono" style={{ fontSize: "1.18rem", fontWeight: 800, color: "#0284c7", lineHeight: 1.2, margin: "0.15rem 0 0.1rem" }}>
                {formatoQ(datos.balanceGeneral.activo.cartera.totalBruto)}
              </div>
              <div style={{ fontSize: "0.68rem", color: "var(--ink-soft)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                Provisión 1%: -{formatoQ(datos.balanceGeneral.activo.cartera.provisionEstimada)}
              </div>
            </div>

            {/* Captaciones */}
            <div style={{ background: "var(--paper)", border: "1px solid var(--line)", borderLeft: "4px solid #7c3aed", borderRadius: "8px", padding: "0.5rem 0.75rem", boxShadow: "var(--shadow)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "0.68rem", color: "#7c3aed", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.03em" }}>Captaciones</span>
                <span style={{ fontSize: "0.85rem" }}>🔒</span>
              </div>
              <div className="mono" style={{ fontSize: "1.18rem", fontWeight: 800, color: "#7c3aed", lineHeight: 1.2, margin: "0.15rem 0 0.1rem" }}>
                {formatoQ(datos.balanceGeneral.pasivo.totalPasivo)}
              </div>
              <div style={{ fontSize: "0.68rem", color: "var(--ink-soft)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                Ahorros {formatoQ(datos.balanceGeneral.pasivo.captacionesAhorro.total)}
              </div>
            </div>

            {/* Disponible en Cajas */}
            <div style={{ background: "var(--paper)", border: "1px solid var(--line)", borderLeft: "4px solid #d97706", borderRadius: "8px", padding: "0.5rem 0.75rem", boxShadow: "var(--shadow)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "0.68rem", color: "#d97706", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.03em" }}>Disponible en Cajas</span>
                <span style={{ fontSize: "0.85rem" }}>💵</span>
              </div>
              <div className="mono" style={{ fontSize: "1.18rem", fontWeight: 800, color: "#d97706", lineHeight: 1.2, margin: "0.15rem 0 0.1rem" }}>
                {formatoQ(datos.balanceGeneral.activo.disponible.total)}
              </div>
              <div style={{ fontSize: "0.68rem", color: "var(--ink-soft)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                Chica: Q 3,000 | Vent.: {formatoQ(datos.balanceGeneral.activo.disponible.rubros[1]?.monto || 0)}
              </div>
            </div>

            {/* Excedente Neto */}
            <div style={{ background: "var(--paper)", border: "1px solid var(--line)", borderLeft: "4px solid #0891b2", borderRadius: "8px", padding: "0.5rem 0.75rem", boxShadow: "var(--shadow)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "0.68rem", color: "#0891b2", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.03em" }}>Excedente Neto</span>
                <span style={{ fontSize: "0.85rem" }}>📈</span>
              </div>
              <div className="mono" style={{ fontSize: "1.18rem", fontWeight: 800, color: "#0891b2", lineHeight: 1.2, margin: "0.15rem 0 0.1rem" }}>
                {formatoQ(datos.estadoResultados.excedenteNeto)}
              </div>
              <div style={{ fontSize: "0.68rem", color: "var(--ink-soft)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                Gastos Caja Chica: -{formatoQ(datos.estadoResultados.gastosOperativos.total)}
              </div>
            </div>
          </div>

          {/* ── PESTAÑAS CON ALTO CONTRASTE ── */}
          <div className="no-print" style={{ display: "flex", gap: "0.35rem", borderBottom: "1.5px solid var(--line)", paddingBottom: "0.2rem" }}>
            <button
              onClick={() => setTabActiva("BALANCE")}
              style={{
                padding: "0.35rem 0.85rem",
                background: "transparent",
                border: "none",
                borderBottom: tabActiva === "BALANCE" ? "3px solid #059669" : "3px solid transparent",
                color: tabActiva === "BALANCE" ? "#059669" : "var(--ink-soft)",
                fontWeight: tabActiva === "BALANCE" ? 800 : 600,
                cursor: "pointer",
                fontSize: "0.86rem",
                transition: "all 0.15s ease",
              }}
            >
              ⚖️ Balance General
            </button>

            <button
              onClick={() => setTabActiva("RESULTADOS")}
              style={{
                padding: "0.35rem 0.85rem",
                background: "transparent",
                border: "none",
                borderBottom: tabActiva === "RESULTADOS" ? "3px solid #059669" : "3px solid transparent",
                color: tabActiva === "RESULTADOS" ? "#059669" : "var(--ink-soft)",
                fontWeight: tabActiva === "RESULTADOS" ? 800 : 600,
                cursor: "pointer",
                fontSize: "0.86rem",
                transition: "all 0.15s ease",
              }}
            >
              📈 Estado de Resultados
            </button>

            <button
              onClick={() => setTabActiva("RIESGO")}
              style={{
                padding: "0.35rem 0.85rem",
                background: "transparent",
                border: "none",
                borderBottom: tabActiva === "RIESGO" ? "3px solid #059669" : "3px solid transparent",
                color: tabActiva === "RIESGO" ? "#059669" : "var(--ink-soft)",
                fontWeight: tabActiva === "RIESGO" ? 800 : 600,
                cursor: "pointer",
                fontSize: "0.86rem",
                transition: "all 0.15s ease",
              }}
            >
              ⚠️ Calidad de Cartera y Riesgo
            </button>
          </div>

          {/* ── CUERPO DEL REPORTE CON ESTILO GLOBAL (FONDO PAPER, BORDES LINE, TEXTO INK OSCURO Y NÍTIDO) ── */}
          <div
            className="print-report"
            style={{
              background: "var(--paper)",
              border: "1px solid var(--line)",
              borderRadius: "8px",
              padding: "0.85rem 1.15rem",
              boxShadow: "var(--shadow)",
              color: "var(--ink)",
            }}
          >
            {/* Membrete Oficial para Impresión (en pantalla muestra un cintillo minimalista) */}
            <div className="only-print" style={{ textAlign: "center", borderBottom: "2px solid var(--ink)", paddingBottom: "0.75rem", marginBottom: "0.75rem" }}>
              <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "#065f46" }}>
                COOPERATIVA MAYA INVERSIONES FUTURAS R.L. "COMIF-R.L."
              </div>
              <div style={{ fontSize: "0.82rem", color: "var(--ink-soft)" }}>
                NIT: 6270731-0 · Cantón Ilom, Chajul, El Quiché
              </div>
              <div style={{ fontSize: "1rem", fontWeight: 700, color: "var(--ink)", marginTop: "0.3rem" }}>
                {tabActiva === "BALANCE" && "BALANCE GENERAL (ESTADO DE SITUACIÓN FINANCIERA)"}
                {tabActiva === "RESULTADOS" && "ESTADO DE RESULTADOS (PÉRDIDAS Y GANANCIAS)"}
                {tabActiva === "RIESGO" && "INFORME OFICIAL DE CALIDAD DE CARTERA Y RIESGO CREDITICIO"}
              </div>
              <div style={{ fontSize: "0.8rem", color: "var(--ink-soft)" }}>
                {datos.agencia.nombre} · Al {datos.fechaCorte} · (Cifras Expresadas en Quetzales)
              </div>
            </div>

            {/* Subtítulo limpio en pantalla */}
            <div className="no-print" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--line)", paddingBottom: "0.35rem", marginBottom: "0.6rem" }}>
              <span style={{ fontSize: "0.84rem", fontWeight: 700, color: "var(--ink)", letterSpacing: "0.01em" }}>
                {tabActiva === "BALANCE" && "BALANCE GENERAL · ESTADO DE SITUACIÓN FINANCIERA"}
                {tabActiva === "RESULTADOS" && "ESTADO DE RESULTADOS · EJERCICIO OPERATIVO 2026"}
                {tabActiva === "RIESGO" && "MATRIZ DE RIESGO CREDITICIO Y CARTERA EN MORA"}
              </span>
              <span style={{ fontSize: "0.75rem", color: "var(--ink-soft)" }}>
                Al {datos.fechaCorte} · Cuadre: <strong style={{ color: datos.balanceGeneral.cuadre.cuadrado ? "#059669" : "#dc2626" }}>Q {datos.balanceGeneral.cuadre.diferencia.toFixed(2)}</strong>
              </span>
            </div>

            {/* TAB 1: BALANCE GENERAL (DISTRIBUCIÓN 2 COLUMNAS ULTRA-COMPACTA Y DE ALTO CONTRASTE) */}
            {tabActiva === "BALANCE" && (
              <div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                  {/* COLUMNA IZQUIERDA: ACTIVO */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    <div style={{ background: "var(--mono-bg)", border: "1px solid var(--line)", padding: "0.35rem 0.65rem", borderRadius: "5px", fontWeight: 700, color: "#0369a1", fontSize: "0.85rem", display: "flex", justifyContent: "space-between" }}>
                      <span>1. ACTIVO</span>
                      <span style={{ color: "var(--ink-soft)", fontSize: "0.75rem" }}>Recursos Disponibles y Colocados</span>
                    </div>

                    {/* Activo Disponible */}
                    <div style={{ background: "var(--paper-raised)", border: "1px solid var(--line)", borderRadius: "6px", padding: "0.35rem 0.65rem" }}>
                      <div style={{ fontWeight: 700, color: "var(--ink)", fontSize: "0.78rem", borderBottom: "1px solid var(--line)", paddingBottom: "0.2rem", marginBottom: "0.25rem", display: "flex", justifyContent: "space-between" }}>
                        <span>101. DISPONIBILIDADES (EFECTIVO)</span>
                        <span className="mono" style={{ color: "#d97706", fontWeight: 700 }}>{formatoQ(datos.balanceGeneral.activo.disponible.total)}</span>
                      </div>
                      <table style={{ width: "100%", fontSize: "0.78rem", borderCollapse: "collapse" }}>
                        <tbody>
                          {datos.balanceGeneral.activo.disponible.rubros.map((r, i) => (
                            <tr key={i} style={{ borderBottom: "1px solid var(--line)" }}>
                              <td className="mono" style={{ padding: "0.18rem 0", color: "var(--ink-soft)", width: "65px" }}>{r.codigo}</td>
                              <td style={{ padding: "0.18rem 0", color: "var(--ink)", fontWeight: 500 }}>{r.concepto}</td>
                              <td className="mono" style={{ padding: "0.18rem 0", textAlign: "right", fontWeight: 700, color: "var(--ink)" }}>{formatoQ(r.monto)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Cartera de Créditos */}
                    <div style={{ background: "var(--paper-raised)", border: "1px solid var(--line)", borderRadius: "6px", padding: "0.35rem 0.65rem" }}>
                      <div style={{ fontWeight: 700, color: "var(--ink)", fontSize: "0.78rem", borderBottom: "1px solid var(--line)", paddingBottom: "0.2rem", marginBottom: "0.25rem", display: "flex", justifyContent: "space-between" }}>
                        <span>103. CARTERA DE CRÉDITOS (COLOCACIONES)</span>
                        <span className="mono" style={{ color: "#0284c7", fontWeight: 700 }}>{formatoQ(datos.balanceGeneral.activo.cartera.totalNeto)}</span>
                      </div>
                      <table style={{ width: "100%", fontSize: "0.78rem", borderCollapse: "collapse" }}>
                        <tbody>
                          {datos.balanceGeneral.activo.cartera.rubros.map((r, i) => (
                            <tr key={i} style={{ borderBottom: "1px solid var(--line)" }}>
                              <td className="mono" style={{ padding: "0.18rem 0", color: "var(--ink-soft)", width: "65px" }}>{r.codigo}</td>
                              <td style={{ padding: "0.18rem 0", color: r.monto < 0 ? "#dc2626" : "var(--ink)", fontWeight: 500 }}>{r.concepto}</td>
                              <td className="mono" style={{ padding: "0.18rem 0", textAlign: "right", fontWeight: 700, color: r.monto < 0 ? "#dc2626" : "var(--ink)" }}>
                                {r.monto < 0 ? `(${formatoQ(Math.abs(r.monto))})` : formatoQ(r.monto)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* TOTAL ACTIVO RESALTADO */}
                    <div style={{ background: "#ecfdf5", border: "1.5px solid #059669", padding: "0.45rem 0.75rem", borderRadius: "6px", display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "auto" }}>
                      <span style={{ fontSize: "0.88rem", fontWeight: 800, color: "#065f46" }}>TOTAL ACTIVO</span>
                      <span className="mono" style={{ fontSize: "1.2rem", fontWeight: 900, color: "#047857" }}>{formatoQ(datos.balanceGeneral.activo.totalActivo)}</span>
                    </div>
                  </div>

                  {/* COLUMNA DERECHA: PASIVO Y PATRIMONIO */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    {/* PASIVO */}
                    <div style={{ background: "var(--mono-bg)", border: "1px solid var(--line)", padding: "0.35rem 0.65rem", borderRadius: "5px", fontWeight: 700, color: "#7c3aed", fontSize: "0.85rem", display: "flex", justifyContent: "space-between" }}>
                      <span>2. PASIVO (CAPTACIONES)</span>
                      <span className="mono" style={{ color: "#7c3aed", fontWeight: 700 }}>Total: {formatoQ(datos.balanceGeneral.pasivo.totalPasivo)}</span>
                    </div>

                    {/* Ahorros + Plazo Fijo */}
                    <div style={{ background: "var(--paper-raised)", border: "1px solid var(--line)", borderRadius: "6px", padding: "0.35rem 0.65rem" }}>
                      <table style={{ width: "100%", fontSize: "0.78rem", borderCollapse: "collapse" }}>
                        <tbody>
                          {datos.balanceGeneral.pasivo.captacionesAhorro.rubros.map((r, i) => (
                            <tr key={i} style={{ borderBottom: "1px solid var(--line)" }}>
                              <td className="mono" style={{ padding: "0.15rem 0", color: "var(--ink-soft)", width: "65px" }}>{r.codigo}</td>
                              <td style={{ padding: "0.15rem 0", color: "var(--ink)", fontWeight: 500 }}>{r.concepto}</td>
                              <td className="mono" style={{ padding: "0.15rem 0", textAlign: "right", fontWeight: 700, color: "var(--ink)" }}>{formatoQ(r.monto)}</td>
                            </tr>
                          ))}
                          <tr style={{ borderBottom: "1px solid var(--line)" }}>
                            <td className="mono" style={{ padding: "0.15rem 0", color: "var(--ink-soft)" }}>202-01</td>
                            <td style={{ padding: "0.15rem 0", color: "var(--ink)", fontWeight: 500 }}>Depósitos a Plazo Fijo (DPF)</td>
                            <td className="mono" style={{ padding: "0.15rem 0", textAlign: "right", fontWeight: 700, color: "var(--ink)" }}>{formatoQ(datos.balanceGeneral.pasivo.plazoFijo.capitalVigente)}</td>
                          </tr>
                          <tr style={{ borderBottom: "1px solid var(--line)" }}>
                            <td className="mono" style={{ padding: "0.15rem 0", color: "var(--ink-soft)" }}>202-02</td>
                            <td style={{ padding: "0.15rem 0", color: "var(--ink)", fontWeight: 500 }}>Intereses DPF por Pagar</td>
                            <td className="mono" style={{ padding: "0.15rem 0", textAlign: "right", fontWeight: 700, color: "var(--ink)" }}>{formatoQ(datos.balanceGeneral.pasivo.plazoFijo.interesesPorPagar)}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {/* PATRIMONIO */}
                    <div style={{ background: "var(--mono-bg)", border: "1px solid var(--line)", padding: "0.35rem 0.65rem", borderRadius: "5px", fontWeight: 700, color: "#be185d", fontSize: "0.85rem", display: "flex", justifyContent: "space-between" }}>
                      <span>3. PATRIMONIO DE ASOCIADOS</span>
                      <span className="mono" style={{ color: "#be185d", fontWeight: 700 }}>Total: {formatoQ(datos.balanceGeneral.patrimonio.totalPatrimonio)}</span>
                    </div>

                    <div style={{ background: "var(--paper-raised)", border: "1px solid var(--line)", borderRadius: "6px", padding: "0.35rem 0.65rem" }}>
                      <table style={{ width: "100%", fontSize: "0.78rem", borderCollapse: "collapse" }}>
                        <tbody>
                          {datos.balanceGeneral.patrimonio.aportacionesCapital.rubros.map((r, i) => (
                            <tr key={i} style={{ borderBottom: "1px solid var(--line)" }}>
                              <td className="mono" style={{ padding: "0.15rem 0", color: "var(--ink-soft)", width: "65px" }}>{r.codigo}</td>
                              <td style={{ padding: "0.15rem 0", color: "var(--ink)", fontWeight: 500 }}>{r.concepto}</td>
                              <td className="mono" style={{ padding: "0.15rem 0", textAlign: "right", fontWeight: 700, color: "var(--ink)" }}>{formatoQ(r.monto)}</td>
                            </tr>
                          ))}
                          <tr style={{ borderBottom: "1px solid var(--line)" }}>
                            <td className="mono" style={{ padding: "0.15rem 0", color: "var(--ink-soft)" }}>302-01</td>
                            <td style={{ padding: "0.15rem 0", color: "var(--ink)", fontWeight: 500 }}>Reserva Institucional (5%)</td>
                            <td className="mono" style={{ padding: "0.15rem 0", textAlign: "right", fontWeight: 700, color: "var(--ink)" }}>{formatoQ(datos.balanceGeneral.patrimonio.reservaInstitucional)}</td>
                          </tr>
                          <tr style={{ borderBottom: "1px solid var(--line)" }}>
                            <td className="mono" style={{ padding: "0.15rem 0", color: "var(--ink-soft)" }}>303-01</td>
                            <td style={{ padding: "0.15rem 0", color: "#0284c7", fontWeight: 600 }}>Excedente Neto del Ejercicio 2026</td>
                            <td className="mono" style={{ padding: "0.15rem 0", textAlign: "right", fontWeight: 800, color: "#0284c7" }}>{formatoQ(datos.balanceGeneral.patrimonio.excedenteNetoPeriodo)}</td>
                          </tr>
                          {Number(datos.balanceGeneral.patrimonio.fondoInstitucionalCartera || 0) > 0 && (
                            <tr style={{ borderBottom: "1px solid var(--line)" }}>
                              <td className="mono" style={{ padding: "0.15rem 0", color: "var(--ink-soft)" }}>304-01</td>
                              <td style={{ padding: "0.15rem 0", color: "#059669", fontWeight: 600 }}>Línea de Crédito FEDERURAL / Fondos Propios de Cartera</td>
                              <td className="mono" style={{ padding: "0.15rem 0", textAlign: "right", fontWeight: 800, color: "#059669" }}>{formatoQ(datos.balanceGeneral.patrimonio.fondoInstitucionalCartera || 0)}</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* TOTAL PASIVO + PATRIMONIO RESALTADO */}
                    <div style={{ background: "#f5f3ff", border: "1.5px solid #7c3aed", padding: "0.45rem 0.75rem", borderRadius: "6px", display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "auto" }}>
                      <span style={{ fontSize: "0.88rem", fontWeight: 800, color: "#4c1d95" }}>TOTAL PASIVO + PATRIMONIO</span>
                      <span className="mono" style={{ fontSize: "1.2rem", fontWeight: 900, color: "#5b21b6" }}>{formatoQ(datos.balanceGeneral.cuadre.totalPasivoMasPatrimonio)}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: ESTADO DE RESULTADOS COMPACTO Y DE ALTO CONTRASTE */}
            {tabActiva === "RESULTADOS" && (
              <div style={{ maxWidth: 900, margin: "0 auto", display: "flex", flexDirection: "column", gap: "0.45rem" }}>
                {/* 1. Ingresos Financieros */}
                <div style={{ background: "var(--paper-raised)", border: "1px solid var(--line)", borderRadius: "6px", padding: "0.45rem 0.75rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, color: "#059669", fontSize: "0.85rem", borderBottom: "1px solid var(--line)", paddingBottom: "0.25rem", marginBottom: "0.25rem" }}>
                    <span>(+) INGRESOS FINANCIEROS Y OPERATIVOS</span>
                    <span className="mono">Total: {formatoQ(datos.estadoResultados.ingresosFinancieros.total)}</span>
                  </div>
                  <table style={{ width: "100%", fontSize: "0.78rem", borderCollapse: "collapse" }}>
                    <tbody>
                      {datos.estadoResultados.ingresosFinancieros.rubros.map((r, i) => (
                        <tr key={i} style={{ borderBottom: "1px solid var(--line)" }}>
                          <td className="mono" style={{ padding: "0.2rem 0", color: "var(--ink-soft)", width: "70px" }}>{r.codigo}</td>
                          <td style={{ padding: "0.2rem 0", color: "var(--ink)", fontWeight: 500 }}>{r.concepto}</td>
                          <td className="mono" style={{ padding: "0.2rem 0", textAlign: "right", fontWeight: 700, color: "var(--ink)" }}>{formatoQ(r.monto)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* 2. Costos Financieros */}
                <div style={{ background: "var(--paper-raised)", border: "1px solid var(--line)", borderRadius: "6px", padding: "0.45rem 0.75rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, color: "#dc2626", fontSize: "0.85rem", borderBottom: "1px solid var(--line)", paddingBottom: "0.25rem", marginBottom: "0.25rem" }}>
                    <span>(-) COSTOS FINANCIEROS (INTERESES PAGADOS SOBRE DPF)</span>
                    <span className="mono">Total: -{formatoQ(datos.estadoResultados.costosFinancieros.total)}</span>
                  </div>
                  <table style={{ width: "100%", fontSize: "0.78rem", borderCollapse: "collapse" }}>
                    <tbody>
                      {datos.estadoResultados.costosFinancieros.rubros.map((r, i) => (
                        <tr key={i} style={{ borderBottom: "1px solid var(--line)" }}>
                          <td className="mono" style={{ padding: "0.2rem 0", color: "var(--ink-soft)", width: "70px" }}>{r.codigo}</td>
                          <td style={{ padding: "0.2rem 0", color: "var(--ink)", fontWeight: 500 }}>{r.concepto}</td>
                          <td className="mono" style={{ padding: "0.2rem 0", textAlign: "right", fontWeight: 700, color: "#dc2626" }}>-{formatoQ(r.monto)}</td>
                        </tr>
                      ))}
                      <tr style={{ fontWeight: 800, color: "#0284c7", background: "rgba(2, 132, 199, 0.06)" }}>
                        <td colSpan={2} style={{ padding: "0.35rem 0.5rem" }}>(=) MARGEN FINANCIERO BRUTO</td>
                        <td className="mono" style={{ padding: "0.35rem 0.5rem", textAlign: "right", fontSize: "0.95rem" }}>{formatoQ(datos.estadoResultados.margenFinancieroBruto)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* 3. Gastos Operativos (Caja Chica) */}
                <div style={{ background: "var(--paper-raised)", border: "1px solid var(--line)", borderRadius: "6px", padding: "0.45rem 0.75rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, color: "#d97706", fontSize: "0.85rem", borderBottom: "1px solid var(--line)", paddingBottom: "0.25rem", marginBottom: "0.25rem" }}>
                    <span>(-) GASTOS OPERATIVOS Y ADMINISTRATIVOS (CAJA CHICA CHAJUL)</span>
                    <span className="mono">Total: -{formatoQ(datos.estadoResultados.gastosOperativos.total)}</span>
                  </div>
                  <table style={{ width: "100%", fontSize: "0.78rem", borderCollapse: "collapse" }}>
                    <tbody>
                      {datos.estadoResultados.gastosOperativos.rubros.map((r, i) => (
                        <tr key={i} style={{ borderBottom: "1px solid var(--line)" }}>
                          <td className="mono" style={{ padding: "0.18rem 0", color: "var(--ink-soft)", width: "70px" }}>{r.codigo}</td>
                          <td style={{ padding: "0.18rem 0", color: "var(--ink)", fontWeight: 500 }}>{r.concepto}</td>
                          <td className="mono" style={{ padding: "0.18rem 0", textAlign: "right", fontWeight: 700, color: "#dc2626" }}>-{formatoQ(r.monto)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* EXCEDENTE NETO */}
                <div
                  style={{
                    background: "#ecfdf5",
                    border: "1.5px solid #059669",
                    borderRadius: "6px",
                    padding: "0.6rem 1rem",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <div style={{ fontSize: "0.95rem", fontWeight: 800, color: "#065f46" }}>
                      (=) EXCEDENTE NETO DEL EJERCICIO 2026
                    </div>
                    <div style={{ fontSize: "0.72rem", color: "var(--ink-soft)" }}>
                      Margen Financiero Bruto menos Gastos Operativos de Agencia Chajul
                    </div>
                  </div>
                  <div className="mono" style={{ fontSize: "1.35rem", fontWeight: 900, color: "#047857" }}>
                    {formatoQ(datos.estadoResultados.excedenteNeto)}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: CALIDAD DE CARTERA Y RIESGO COMPACTO */}
            {tabActiva === "RIESGO" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                  <div style={{ background: "var(--paper-raised)", border: "1px solid var(--line)", borderRadius: "6px", padding: "0.65rem 0.85rem" }}>
                    <div style={{ fontSize: "0.75rem", color: "var(--ink-soft)", fontWeight: 700 }}>ÍNDICE DE MOROSIDAD (PAR &gt; 30 DÍAS)</div>
                    <div className="mono" style={{ fontSize: "1.6rem", fontWeight: 800, color: datos.calidadCartera.indiceMorosidad > 5 ? "#dc2626" : "#059669", marginTop: "0.15rem" }}>
                      {datos.calidadCartera.indiceMorosidad}%
                    </div>
                    <div style={{ fontSize: "0.7rem", color: "var(--ink-soft)" }}>
                      Límite institucional de tolerancia: 5.0%
                    </div>
                  </div>

                  <div style={{ background: "var(--paper-raised)", border: "1px solid var(--line)", borderRadius: "6px", padding: "0.65rem 0.85rem" }}>
                    <div style={{ fontSize: "0.75rem", color: "var(--ink-soft)", fontWeight: 700 }}>PROVISIÓN PARA CRÉDITOS INCOBRABLES</div>
                    <div className="mono" style={{ fontSize: "1.6rem", fontWeight: 800, color: "#0284c7", marginTop: "0.15rem" }}>
                      {formatoQ(datos.balanceGeneral.activo.cartera.provisionEstimada)}
                    </div>
                    <div style={{ fontSize: "0.7rem", color: "var(--ink-soft)" }}>
                      1% sobre cartera al día + ponderación por días de atraso
                    </div>
                  </div>
                </div>

                <div style={{ background: "var(--paper-raised)", border: "1px solid var(--line)", borderRadius: "6px", padding: "0.5rem 0.75rem" }}>
                  <div style={{ fontWeight: 700, color: "var(--ink)", marginBottom: "0.4rem", fontSize: "0.85rem" }}>
                    ESTRATIFICACIÓN POR TRAMOS DE VENCIMIENTO Y MORA
                  </div>
                  <table style={{ width: "100%", fontSize: "0.78rem", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ background: "var(--mono-bg)", color: "var(--ink)" }}>
                        <th style={{ padding: "0.35rem 0.5rem", textAlign: "left" }}>Tramo de Riesgo</th>
                        <th style={{ padding: "0.35rem 0.5rem", textAlign: "center" }}>Créditos</th>
                        <th style={{ padding: "0.35rem 0.5rem", textAlign: "right" }}>Capital Vivo (Q)</th>
                        <th style={{ padding: "0.35rem 0.5rem", textAlign: "right" }}>% de Cartera</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr style={{ borderBottom: "1px solid var(--line)" }}>
                        <td style={{ padding: "0.35rem 0.5rem", color: "#059669", fontWeight: 700 }}>🟢 Al Día (0 días de atraso)</td>
                        <td className="mono" style={{ padding: "0.35rem 0.5rem", textAlign: "center", color: "var(--ink)" }}>{datos.calidadCartera.tramosMora.alDia.cantidad}</td>
                        <td className="mono" style={{ padding: "0.35rem 0.5rem", textAlign: "right", fontWeight: 700, color: "var(--ink)" }}>{formatoQ(datos.calidadCartera.tramosMora.alDia.monto)}</td>
                        <td className="mono" style={{ padding: "0.35rem 0.5rem", textAlign: "right", fontWeight: 700, color: "#059669" }}>{datos.calidadCartera.tramosMora.alDia.porcentaje}%</td>
                      </tr>
                      <tr style={{ borderBottom: "1px solid var(--line)" }}>
                        <td style={{ padding: "0.35rem 0.5rem", color: "#d97706", fontWeight: 700 }}>🟡 Gracia / Riesgo Leve (1 - 30 días)</td>
                        <td className="mono" style={{ padding: "0.35rem 0.5rem", textAlign: "center", color: "var(--ink)" }}>{datos.calidadCartera.tramosMora.rango1_30.cantidad}</td>
                        <td className="mono" style={{ padding: "0.35rem 0.5rem", textAlign: "right", fontWeight: 700, color: "var(--ink)" }}>{formatoQ(datos.calidadCartera.tramosMora.rango1_30.monto)}</td>
                        <td className="mono" style={{ padding: "0.35rem 0.5rem", textAlign: "right", fontWeight: 700, color: "#d97706" }}>{datos.calidadCartera.tramosMora.rango1_30.porcentaje}%</td>
                      </tr>
                      <tr style={{ borderBottom: "1px solid var(--line)" }}>
                        <td style={{ padding: "0.35rem 0.5rem", color: "#ea580c", fontWeight: 700 }}>🟠 Mora Media (31 - 60 días)</td>
                        <td className="mono" style={{ padding: "0.35rem 0.5rem", textAlign: "center", color: "var(--ink)" }}>{datos.calidadCartera.tramosMora.rango31_60.cantidad}</td>
                        <td className="mono" style={{ padding: "0.35rem 0.5rem", textAlign: "right", fontWeight: 700, color: "var(--ink)" }}>{formatoQ(datos.calidadCartera.tramosMora.rango31_60.monto)}</td>
                        <td className="mono" style={{ padding: "0.35rem 0.5rem", textAlign: "right", fontWeight: 700, color: "#ea580c" }}>{datos.calidadCartera.tramosMora.rango31_60.porcentaje}%</td>
                      </tr>
                      <tr style={{ borderBottom: "1px solid var(--line)" }}>
                        <td style={{ padding: "0.35rem 0.5rem", color: "#dc2626", fontWeight: 700 }}>🔴 Mora Alta (61 - 90 días)</td>
                        <td className="mono" style={{ padding: "0.35rem 0.5rem", textAlign: "center", color: "var(--ink)" }}>{datos.calidadCartera.tramosMora.rango61_90.cantidad}</td>
                        <td className="mono" style={{ padding: "0.35rem 0.5rem", textAlign: "right", fontWeight: 700, color: "var(--ink)" }}>{formatoQ(datos.calidadCartera.tramosMora.rango61_90.monto)}</td>
                        <td className="mono" style={{ padding: "0.35rem 0.5rem", textAlign: "right", fontWeight: 700, color: "#dc2626" }}>{datos.calidadCartera.tramosMora.rango61_90.porcentaje}%</td>
                      </tr>
                      <tr style={{ borderBottom: "1px solid var(--line)" }}>
                        <td style={{ padding: "0.35rem 0.5rem", color: "#991b1b", fontWeight: 800 }}>⛔ Cobro Judicial (&gt; 90 días)</td>
                        <td className="mono" style={{ padding: "0.35rem 0.5rem", textAlign: "center", color: "var(--ink)" }}>{datos.calidadCartera.tramosMora.mas90.cantidad}</td>
                        <td className="mono" style={{ padding: "0.35rem 0.5rem", textAlign: "right", fontWeight: 700, color: "var(--ink)" }}>{formatoQ(datos.calidadCartera.tramosMora.mas90.monto)}</td>
                        <td className="mono" style={{ padding: "0.35rem 0.5rem", textAlign: "right", fontWeight: 800, color: "#991b1b" }}>{datos.calidadCartera.tramosMora.mas90.porcentaje}%</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Firmas Notariales e Institucionales (aparecen en papel o al pie de impresión) */}
            <div className="only-print" style={{ marginTop: "2rem", paddingTop: "1rem", borderTop: "1px solid var(--line)" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1.5rem", textAlign: "center" }}>
                <div>
                  <div style={{ borderBottom: "1px solid var(--ink)", height: "40px", marginBottom: "0.35rem" }}></div>
                  <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--ink)" }}>Receptor / Cajero</div>
                  <div style={{ fontSize: "0.72rem", color: "var(--ink-soft)" }}>Operaciones de Ventanilla</div>
                </div>

                <div>
                  <div style={{ borderBottom: "1px solid var(--ink)", height: "40px", marginBottom: "0.35rem" }}></div>
                  <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--ink)" }}>Contador General</div>
                  <div style={{ fontSize: "0.72rem", color: "var(--ink-soft)" }}>Registro y Certificación Contable</div>
                </div>

                <div>
                  <div style={{ borderBottom: "1px solid var(--ink)", height: "40px", marginBottom: "0.35rem" }}></div>
                  <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--ink)" }}>Jefe de Agencia / Vigilancia</div>
                  <div style={{ fontSize: "0.72rem", color: "var(--ink-soft)" }}>Supervisión y Dictamen Oficial</div>
                </div>
              </div>
            </div>

          </div>
        </>
      )}
    </div>
  );
}
