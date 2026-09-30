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
    <div className="screen-container" style={{ width: "100%", maxWidth: "100%" }}>
      {/* ── HEADER INSTITUCIONAL ULTRA COMPACTO ── */}
      <div className="no-print" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.4rem", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span style={{ fontSize: "1.25rem", lineHeight: 1 }}>📊</span>
          <div>
            <h1 style={{ margin: 0, fontSize: "1.1rem", color: "var(--ink)", fontWeight: 800, letterSpacing: "-0.01em" }}>
              Estados Financieros Oficiales
            </h1>
            <p style={{ margin: 0, fontSize: "0.72rem", color: "var(--ink-soft)" }}>
              COOPERATIVA MAYA INVERSIONES FUTURAS R.L. "COMIF-R.L." · {datos?.agencia.nombre || "Agencia Chajul"}
            </p>
          </div>
        </div>

        {/* Acciones y Filtros en barra única */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", flexWrap: "wrap" }}>
          {(usuario?.rol === "ADMIN" || usuario?.rol === "GERENCIA") && (
            <select
              value={agenciaSeleccionada}
              onChange={(e) => setAgenciaSeleccionada(e.target.value)}
              className="input-select"
              style={{
                padding: "0.22rem 0.55rem",
                fontSize: "0.78rem",
                borderRadius: "6px",
                height: "28px",
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

          <div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
            <span style={{ fontSize: "0.72rem", color: "var(--ink-soft)", fontWeight: 600 }}>Corte:</span>
            <input
              type="date"
              value={fechaCorte}
              onChange={(e) => setFechaCorte(e.target.value)}
              className="input-date"
              style={{
                padding: "0.18rem 0.45rem",
                fontSize: "0.78rem",
                borderRadius: "6px",
                height: "28px",
                borderColor: "var(--line)",
                background: "var(--paper)",
                color: "var(--ink)",
                fontWeight: 600,
              }}
            />
          </div>

          {(usuario?.rol === "GERENCIA" || usuario?.rol === "SUPERVISOR") && (
            <button
              onClick={exportarCSV}
              className="btn secondary"
              style={{ display: "flex", alignItems: "center", gap: "0.25rem", fontSize: "0.76rem", padding: "0.22rem 0.55rem", height: "28px" }}
              title="Exportar a Microsoft Excel (CSV)"
            >
              📥 Excel
            </button>
          )}

          <button
            onClick={imprimirReporte}
            className="btn"
            style={{ display: "flex", alignItems: "center", gap: "0.25rem", fontSize: "0.76rem", padding: "0.22rem 0.65rem", height: "28px", background: "#059669", borderColor: "#059669", color: "#ffffff", fontWeight: 700 }}
            title="Imprimir balance y firmas legales en PDF o papel"
          >
            🖨️ Imprimir
          </button>
        </div>
      </div>

      {error && (
        <div className="alert error no-print" style={{ padding: "0.35rem 0.75rem", fontSize: "0.78rem", flexShrink: 0 }}>
          {error}
        </div>
      )}

      {cargando ? (
        <div style={{ padding: "2.5rem", textAlign: "center", color: "var(--ink-soft)", flex: 1 }}>
          <div className="spinner" style={{ margin: "0 auto 0.75rem" }} />
          Calculando estados financieros oficiales de la agencia en tiempo real…
        </div>
      ) : !datos ? (
        <div style={{ padding: "2rem", textAlign: "center", color: "var(--ink-soft)", flex: 1 }}>
          No se encontraron datos para los parámetros seleccionados.
        </div>
      ) : (
        <>
          {/* ── CINTILLO DE 5 KPIS ULTRA-COMPACTO (ALTURA REDUCIDA PARA 100VH) ── */}
          <div
            className="no-print"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(5, 1fr)",
              gap: "0.35rem",
              width: "100%",
              flexShrink: 0,
            }}
          >
            {/* Total Activo */}
            <div style={{ background: "var(--paper)", border: "1px solid var(--line)", borderLeft: "3.5px solid #059669", borderRadius: "6px", padding: "0.28rem 0.55rem", boxShadow: "var(--shadow)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "0.62rem", color: "#059669", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.02em" }}>Total Activo</span>
                <span style={{ fontSize: "0.75rem" }}>🏛️</span>
              </div>
              <div className="mono" style={{ fontSize: "0.98rem", fontWeight: 800, color: "#059669", lineHeight: 1.15, margin: "0.08rem 0 0.05rem" }}>
                {formatoQ(datos.balanceGeneral.activo.totalActivo)}
              </div>
              <div style={{ fontSize: "0.62rem", color: "var(--ink-soft)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                Cartera neta + Efectivo
              </div>
            </div>

            {/* Cartera Bruta */}
            <div style={{ background: "var(--paper)", border: "1px solid var(--line)", borderLeft: "3.5px solid #0284c7", borderRadius: "6px", padding: "0.28rem 0.55rem", boxShadow: "var(--shadow)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "0.62rem", color: "#0284c7", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.02em" }}>Cartera Bruta</span>
                <span style={{ fontSize: "0.75rem" }}>💼</span>
              </div>
              <div className="mono" style={{ fontSize: "0.98rem", fontWeight: 800, color: "#0284c7", lineHeight: 1.15, margin: "0.08rem 0 0.05rem" }}>
                {formatoQ(datos.balanceGeneral.activo.cartera.totalBruto)}
              </div>
              <div style={{ fontSize: "0.62rem", color: "var(--ink-soft)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                Prov. 1%: -{formatoQ(datos.balanceGeneral.activo.cartera.provisionEstimada)}
              </div>
            </div>

            {/* Captaciones */}
            <div style={{ background: "var(--paper)", border: "1px solid var(--line)", borderLeft: "3.5px solid #7c3aed", borderRadius: "6px", padding: "0.28rem 0.55rem", boxShadow: "var(--shadow)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "0.62rem", color: "#7c3aed", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.02em" }}>Captaciones</span>
                <span style={{ fontSize: "0.75rem" }}>🔒</span>
              </div>
              <div className="mono" style={{ fontSize: "0.98rem", fontWeight: 800, color: "#7c3aed", lineHeight: 1.15, margin: "0.08rem 0 0.05rem" }}>
                {formatoQ(datos.balanceGeneral.pasivo.totalPasivo)}
              </div>
              <div style={{ fontSize: "0.62rem", color: "var(--ink-soft)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                Ahorros {formatoQ(datos.balanceGeneral.pasivo.captacionesAhorro.total)}
              </div>
            </div>

            {/* Disponible en Cajas */}
            <div style={{ background: "var(--paper)", border: "1px solid var(--line)", borderLeft: "3.5px solid #d97706", borderRadius: "6px", padding: "0.28rem 0.55rem", boxShadow: "var(--shadow)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "0.62rem", color: "#d97706", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.02em" }}>Disponible Cajas</span>
                <span style={{ fontSize: "0.75rem" }}>💵</span>
              </div>
              <div className="mono" style={{ fontSize: "0.98rem", fontWeight: 800, color: "#d97706", lineHeight: 1.15, margin: "0.08rem 0 0.05rem" }}>
                {formatoQ(datos.balanceGeneral.activo.disponible.total)}
              </div>
              <div style={{ fontSize: "0.62rem", color: "var(--ink-soft)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                Chica Q3,000 | Vent. {formatoQ(datos.balanceGeneral.activo.disponible.rubros[1]?.monto || 0)}
              </div>
            </div>

            {/* Excedente Neto */}
            <div style={{ background: "var(--paper)", border: "1px solid var(--line)", borderLeft: "3.5px solid #0891b2", borderRadius: "6px", padding: "0.28rem 0.55rem", boxShadow: "var(--shadow)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "0.62rem", color: "#0891b2", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.02em" }}>Excedente Neto</span>
                <span style={{ fontSize: "0.75rem" }}>📈</span>
              </div>
              <div className="mono" style={{ fontSize: "0.98rem", fontWeight: 800, color: "#0891b2", lineHeight: 1.15, margin: "0.08rem 0 0.05rem" }}>
                {formatoQ(datos.estadoResultados.excedenteNeto)}
              </div>
              <div style={{ fontSize: "0.62rem", color: "var(--ink-soft)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                Gastos Caja: -{formatoQ(datos.estadoResultados.gastosOperativos.total)}
              </div>
            </div>
          </div>

          {/* ── PESTAÑAS ULTRA-COMPACTAS ── */}
          <div className="no-print" style={{ display: "flex", gap: "0.25rem", borderBottom: "1.5px solid var(--line)", paddingBottom: "0.15rem", flexShrink: 0 }}>
            <button
              onClick={() => setTabActiva("BALANCE")}
              style={{
                padding: "0.25rem 0.75rem",
                background: "transparent",
                border: "none",
                borderBottom: tabActiva === "BALANCE" ? "2.5px solid #059669" : "2.5px solid transparent",
                color: tabActiva === "BALANCE" ? "#059669" : "var(--ink-soft)",
                fontWeight: tabActiva === "BALANCE" ? 800 : 600,
                cursor: "pointer",
                fontSize: "0.82rem",
                transition: "all 0.15s ease",
              }}
            >
              ⚖️ Balance General
            </button>

            <button
              onClick={() => setTabActiva("RESULTADOS")}
              style={{
                padding: "0.25rem 0.75rem",
                background: "transparent",
                border: "none",
                borderBottom: tabActiva === "RESULTADOS" ? "2.5px solid #059669" : "2.5px solid transparent",
                color: tabActiva === "RESULTADOS" ? "#059669" : "var(--ink-soft)",
                fontWeight: tabActiva === "RESULTADOS" ? 800 : 600,
                cursor: "pointer",
                fontSize: "0.82rem",
                transition: "all 0.15s ease",
              }}
            >
              📈 Estado de Resultados
            </button>

            <button
              onClick={() => setTabActiva("RIESGO")}
              style={{
                padding: "0.25rem 0.75rem",
                background: "transparent",
                border: "none",
                borderBottom: tabActiva === "RIESGO" ? "2.5px solid #059669" : "2.5px solid transparent",
                color: tabActiva === "RIESGO" ? "#059669" : "var(--ink-soft)",
                fontWeight: tabActiva === "RIESGO" ? 800 : 600,
                cursor: "pointer",
                fontSize: "0.82rem",
                transition: "all 0.15s ease",
              }}
            >
              ⚠️ Calidad de Cartera y Riesgo
            </button>
          </div>

          {/* ── CUERPO DEL REPORTE ADAPTADO A UNA SOLA PANTALLA (100VH SIN SCROLL DE VENTANA) ── */}
          <div
            className="print-report"
            style={{
              background: "var(--paper)",
              border: "1px solid var(--line)",
              borderRadius: "8px",
              padding: "0.55rem 0.85rem",
              boxShadow: "var(--shadow)",
              color: "var(--ink)",
              flex: 1,
              minHeight: 0,
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
          >
            {/* Membrete Oficial para Impresión */}
            <div className="only-print" style={{ textAlign: "center", borderBottom: "2px solid var(--ink)", paddingBottom: "0.5rem", marginBottom: "0.5rem" }}>
              <div style={{ fontSize: "1.05rem", fontWeight: 800, color: "#065f46" }}>
                COOPERATIVA MAYA INVERSIONES FUTURAS R.L. "COMIF-R.L."
              </div>
              <div style={{ fontSize: "0.78rem", color: "var(--ink-soft)" }}>
                NIT: 6270731-0 · Cantón Ilom, Chajul, El Quiché
              </div>
              <div style={{ fontSize: "0.92rem", fontWeight: 700, color: "var(--ink)", marginTop: "0.2rem" }}>
                {tabActiva === "BALANCE" && "BALANCE GENERAL (ESTADO DE SITUACIÓN FINANCIERA)"}
                {tabActiva === "RESULTADOS" && "ESTADO DE RESULTADOS (PÉRDIDAS Y GANANCIAS)"}
                {tabActiva === "RIESGO" && "INFORME OFICIAL DE CALIDAD DE CARTERA Y RIESGO CREDITICIO"}
              </div>
              <div style={{ fontSize: "0.75rem", color: "var(--ink-soft)" }}>
                {datos.agencia.nombre} · Al {datos.fechaCorte} · (Cifras Expresadas en Quetzales)
              </div>
            </div>

            {/* Subtítulo limpio en pantalla */}
            <div className="no-print" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--line)", paddingBottom: "0.25rem", marginBottom: "0.35rem", flexShrink: 0 }}>
              <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--ink)", letterSpacing: "0.01em" }}>
                {tabActiva === "BALANCE" && "BALANCE GENERAL · ESTADO DE SITUACIÓN FINANCIERA"}
                {tabActiva === "RESULTADOS" && "ESTADO DE RESULTADOS · EJERCICIO OPERATIVO 2026"}
                {tabActiva === "RIESGO" && "MATRIZ DE RIESGO CREDITICIO Y CARTERA EN MORA"}
              </span>
              <span style={{ fontSize: "0.72rem", color: "var(--ink-soft)" }}>
                Al {datos.fechaCorte} · Cuadre: <strong style={{ color: datos.balanceGeneral.cuadre.cuadrado ? "#059669" : "#dc2626" }}>Q {datos.balanceGeneral.cuadre.diferencia.toFixed(2)}</strong>
              </span>
            </div>

            {/* TAB 1: BALANCE GENERAL (ARQUITECTURA EJECUTIVA EN 3 COLUMNAS: ACTIVO | PASIVO | PATRIMONIO) */}
            {tabActiva === "BALANCE" && (
              <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", gap: "0.35rem", overflow: "hidden" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.55rem", flex: 1, minHeight: 0, overflow: "hidden" }}>
                  
                  {/* ── COLUMNA 1: 1. ACTIVO ── */}
                  <div style={{ display: "flex", flexDirection: "column", background: "var(--paper-raised)", border: "1px solid var(--line)", borderRadius: "6px", padding: "0.35rem 0.5rem", minHeight: 0, overflow: "hidden" }}>
                    <div style={{ background: "var(--mono-bg)", border: "1px solid var(--line)", padding: "0.25rem 0.5rem", borderRadius: "4px", fontWeight: 800, color: "#0369a1", fontSize: "0.76rem", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0, marginBottom: "0.3rem" }}>
                      <span>1. ACTIVO (RECURSOS)</span>
                      <span className="mono" style={{ fontSize: "0.72rem", color: "#0284c7" }}>{formatoQ(datos.balanceGeneral.activo.totalActivo)}</span>
                    </div>

                    <div style={{ flex: 1, minHeight: 0, overflowY: "auto", display: "flex", flexDirection: "column", gap: "0.35rem", paddingRight: "0.15rem" }}>
                      {/* 101. Disponibilidades */}
                      <div style={{ border: "1px solid var(--line)", borderRadius: "4px", padding: "0.25rem 0.45rem", background: "var(--paper)" }}>
                        <div style={{ fontWeight: 700, color: "var(--ink)", fontSize: "0.72rem", borderBottom: "1px solid var(--line)", paddingBottom: "0.15rem", marginBottom: "0.2rem", display: "flex", justifyContent: "space-between" }}>
                          <span>101. DISPONIBILIDADES</span>
                          <span className="mono" style={{ color: "#d97706", fontWeight: 700 }}>{formatoQ(datos.balanceGeneral.activo.disponible.total)}</span>
                        </div>
                        <table style={{ width: "100%", fontSize: "0.73rem", borderCollapse: "collapse", tableLayout: "fixed" }}>
                          <tbody>
                            {datos.balanceGeneral.activo.disponible.rubros.map((r, i) => (
                              <tr key={i} style={{ borderBottom: "1px solid var(--line)" }}>
                                <td className="mono" style={{ padding: "0.12rem 0", color: "var(--ink-soft)", width: "48px", flexShrink: 0 }}>{r.codigo}</td>
                                <td style={{ padding: "0.12rem 0.25rem", color: "var(--ink)", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={r.concepto}>{r.concepto}</td>
                                <td className="mono" style={{ padding: "0.12rem 0", textAlign: "right", fontWeight: 700, color: "var(--ink)", width: "82px", flexShrink: 0 }}>{formatoQ(r.monto)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* 103. Cartera de Créditos */}
                      <div style={{ border: "1px solid var(--line)", borderRadius: "4px", padding: "0.25rem 0.45rem", background: "var(--paper)" }}>
                        <div style={{ fontWeight: 700, color: "var(--ink)", fontSize: "0.72rem", borderBottom: "1px solid var(--line)", paddingBottom: "0.15rem", marginBottom: "0.2rem", display: "flex", justifyContent: "space-between" }}>
                          <span>103. CARTERA DE CRÉDITOS</span>
                          <span className="mono" style={{ color: "#0284c7", fontWeight: 700 }}>{formatoQ(datos.balanceGeneral.activo.cartera.totalNeto)}</span>
                        </div>
                        <table style={{ width: "100%", fontSize: "0.73rem", borderCollapse: "collapse", tableLayout: "fixed" }}>
                          <tbody>
                            {datos.balanceGeneral.activo.cartera.rubros.map((r, i) => (
                              <tr key={i} style={{ borderBottom: "1px solid var(--line)" }}>
                                <td className="mono" style={{ padding: "0.12rem 0", color: "var(--ink-soft)", width: "48px", flexShrink: 0 }}>{r.codigo}</td>
                                <td style={{ padding: "0.12rem 0.25rem", color: r.monto < 0 ? "#dc2626" : "var(--ink)", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={r.concepto}>{r.concepto}</td>
                                <td className="mono" style={{ padding: "0.12rem 0", textAlign: "right", fontWeight: 700, color: r.monto < 0 ? "#dc2626" : "var(--ink)", width: "82px", flexShrink: 0 }}>
                                  {r.monto < 0 ? `(${formatoQ(Math.abs(r.monto))})` : formatoQ(r.monto)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* TOTAL ACTIVO RESALTADO EN PIE DE COLUMNA */}
                    <div style={{ background: "#ecfdf5", border: "1.5px solid #059669", padding: "0.32rem 0.6rem", borderRadius: "5px", display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "0.3rem", flexShrink: 0 }}>
                      <span style={{ fontSize: "0.76rem", fontWeight: 800, color: "#065f46" }}>TOTAL ACTIVO</span>
                      <span className="mono" style={{ fontSize: "0.98rem", fontWeight: 900, color: "#047857" }}>{formatoQ(datos.balanceGeneral.activo.totalActivo)}</span>
                    </div>
                  </div>

                  {/* ── COLUMNA 2: 2. PASIVO (CAPTACIONES) ── */}
                  <div style={{ display: "flex", flexDirection: "column", background: "var(--paper-raised)", border: "1px solid var(--line)", borderRadius: "6px", padding: "0.35rem 0.5rem", minHeight: 0, overflow: "hidden" }}>
                    <div style={{ background: "var(--mono-bg)", border: "1px solid var(--line)", padding: "0.25rem 0.5rem", borderRadius: "4px", fontWeight: 800, color: "#7c3aed", fontSize: "0.76rem", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0, marginBottom: "0.3rem" }}>
                      <span>2. PASIVO (CAPTACIONES)</span>
                      <span className="mono" style={{ fontSize: "0.72rem", color: "#7c3aed" }}>{formatoQ(datos.balanceGeneral.pasivo.totalPasivo)}</span>
                    </div>

                    <div style={{ flex: 1, minHeight: 0, overflowY: "auto", display: "flex", flexDirection: "column", gap: "0.35rem", paddingRight: "0.15rem" }}>
                      {/* 201. Captaciones de Ahorro */}
                      <div style={{ border: "1px solid var(--line)", borderRadius: "4px", padding: "0.25rem 0.45rem", background: "var(--paper)" }}>
                        <div style={{ fontWeight: 700, color: "var(--ink)", fontSize: "0.72rem", borderBottom: "1px solid var(--line)", paddingBottom: "0.15rem", marginBottom: "0.2rem", display: "flex", justifyContent: "space-between" }}>
                          <span>201. AHORROS DE ASOCIADOS</span>
                          <span className="mono" style={{ color: "#7c3aed", fontWeight: 700 }}>{formatoQ(datos.balanceGeneral.pasivo.captacionesAhorro.total)}</span>
                        </div>
                        <table style={{ width: "100%", fontSize: "0.73rem", borderCollapse: "collapse", tableLayout: "fixed" }}>
                          <tbody>
                            {datos.balanceGeneral.pasivo.captacionesAhorro.rubros.map((r, i) => (
                              <tr key={i} style={{ borderBottom: "1px solid var(--line)" }}>
                                <td className="mono" style={{ padding: "0.12rem 0", color: "var(--ink-soft)", width: "48px", flexShrink: 0 }}>{r.codigo}</td>
                                <td style={{ padding: "0.12rem 0.25rem", color: "var(--ink)", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={r.concepto}>{r.concepto}</td>
                                <td className="mono" style={{ padding: "0.12rem 0", textAlign: "right", fontWeight: 700, color: "var(--ink)", width: "82px", flexShrink: 0 }}>{formatoQ(r.monto)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* 202. Depósitos a Plazo Fijo */}
                      <div style={{ border: "1px solid var(--line)", borderRadius: "4px", padding: "0.25rem 0.45rem", background: "var(--paper)" }}>
                        <div style={{ fontWeight: 700, color: "var(--ink)", fontSize: "0.72rem", borderBottom: "1px solid var(--line)", paddingBottom: "0.15rem", marginBottom: "0.2rem", display: "flex", justifyContent: "space-between" }}>
                          <span>202. DEPÓSITOS A PLAZO FIJO (DPF)</span>
                          <span className="mono" style={{ color: "#6366f1", fontWeight: 700 }}>{formatoQ(datos.balanceGeneral.pasivo.plazoFijo.capitalVigente + datos.balanceGeneral.pasivo.plazoFijo.interesesPorPagar)}</span>
                        </div>
                        <table style={{ width: "100%", fontSize: "0.73rem", borderCollapse: "collapse", tableLayout: "fixed" }}>
                          <tbody>
                            <tr style={{ borderBottom: "1px solid var(--line)" }}>
                              <td className="mono" style={{ padding: "0.12rem 0", color: "var(--ink-soft)", width: "48px", flexShrink: 0 }}>202-01</td>
                              <td style={{ padding: "0.12rem 0.25rem", color: "var(--ink)", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title="Capital DPF Invertido">Capital DPF Invertido</td>
                              <td className="mono" style={{ padding: "0.12rem 0", textAlign: "right", fontWeight: 700, color: "var(--ink)", width: "82px", flexShrink: 0 }}>{formatoQ(datos.balanceGeneral.pasivo.plazoFijo.capitalVigente)}</td>
                            </tr>
                            <tr style={{ borderBottom: "1px solid var(--line)" }}>
                              <td className="mono" style={{ padding: "0.12rem 0", color: "var(--ink-soft)", width: "48px", flexShrink: 0 }}>202-02</td>
                              <td style={{ padding: "0.12rem 0.25rem", color: "var(--ink)", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title="Intereses DPF por Pagar">Intereses DPF por Pagar</td>
                              <td className="mono" style={{ padding: "0.12rem 0", textAlign: "right", fontWeight: 700, color: "var(--ink)", width: "82px", flexShrink: 0 }}>{formatoQ(datos.balanceGeneral.pasivo.plazoFijo.interesesPorPagar)}</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* TOTAL PASIVO RESALTADO EN PIE DE COLUMNA */}
                    <div style={{ background: "#f5f3ff", border: "1.5px solid #7c3aed", padding: "0.32rem 0.6rem", borderRadius: "5px", display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "0.3rem", flexShrink: 0 }}>
                      <span style={{ fontSize: "0.76rem", fontWeight: 800, color: "#4c1d95" }}>TOTAL PASIVO</span>
                      <span className="mono" style={{ fontSize: "0.98rem", fontWeight: 900, color: "#5b21b6" }}>{formatoQ(datos.balanceGeneral.pasivo.totalPasivo)}</span>
                    </div>
                  </div>

                  {/* ── COLUMNA 3: 3. PATRIMONIO DE ASOCIADOS ── */}
                  <div style={{ display: "flex", flexDirection: "column", background: "var(--paper-raised)", border: "1px solid var(--line)", borderRadius: "6px", padding: "0.35rem 0.5rem", minHeight: 0, overflow: "hidden" }}>
                    <div style={{ background: "var(--mono-bg)", border: "1px solid var(--line)", padding: "0.25rem 0.5rem", borderRadius: "4px", fontWeight: 800, color: "#be185d", fontSize: "0.76rem", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0, marginBottom: "0.3rem" }}>
                      <span>3. PATRIMONIO (CAPITAL)</span>
                      <span className="mono" style={{ fontSize: "0.72rem", color: "#be185d" }}>{formatoQ(datos.balanceGeneral.patrimonio.totalPatrimonio)}</span>
                    </div>

                    <div style={{ flex: 1, minHeight: 0, overflowY: "auto", display: "flex", flexDirection: "column", gap: "0.35rem", paddingRight: "0.15rem" }}>
                      {/* 301. Aportaciones de Capital */}
                      <div style={{ border: "1px solid var(--line)", borderRadius: "4px", padding: "0.25rem 0.45rem", background: "var(--paper)" }}>
                        <div style={{ fontWeight: 700, color: "var(--ink)", fontSize: "0.72rem", borderBottom: "1px solid var(--line)", paddingBottom: "0.15rem", marginBottom: "0.2rem", display: "flex", justifyContent: "space-between" }}>
                          <span>301. APORTACIONES DE CAPITAL</span>
                          <span className="mono" style={{ color: "#be185d", fontWeight: 700 }}>
                            {formatoQ(datos.balanceGeneral.patrimonio.aportacionesCapital.rubros.reduce((acc, curr) => acc + curr.monto, 0))}
                          </span>
                        </div>
                        <table style={{ width: "100%", fontSize: "0.73rem", borderCollapse: "collapse", tableLayout: "fixed" }}>
                          <tbody>
                            {datos.balanceGeneral.patrimonio.aportacionesCapital.rubros.map((r, i) => (
                              <tr key={i} style={{ borderBottom: "1px solid var(--line)" }}>
                                <td className="mono" style={{ padding: "0.12rem 0", color: "var(--ink-soft)", width: "48px", flexShrink: 0 }}>{r.codigo}</td>
                                <td style={{ padding: "0.12rem 0.25rem", color: "var(--ink)", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={r.concepto}>{r.concepto}</td>
                                <td className="mono" style={{ padding: "0.12rem 0", textAlign: "right", fontWeight: 700, color: "var(--ink)", width: "82px", flexShrink: 0 }}>{formatoQ(r.monto)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* 302/303/304. Reservas, Excedente y Fondos */}
                      <div style={{ border: "1px solid var(--line)", borderRadius: "4px", padding: "0.25rem 0.45rem", background: "var(--paper)" }}>
                        <div style={{ fontWeight: 700, color: "var(--ink)", fontSize: "0.72rem", borderBottom: "1px solid var(--line)", paddingBottom: "0.15rem", marginBottom: "0.2rem", display: "flex", justifyContent: "space-between" }}>
                          <span>302/303/304. RESERVAS Y FONDOS</span>
                          <span className="mono" style={{ color: "#059669", fontWeight: 700 }}>
                            {formatoQ(
                              datos.balanceGeneral.patrimonio.reservaInstitucional +
                              datos.balanceGeneral.patrimonio.excedenteNetoPeriodo +
                              Number(datos.balanceGeneral.patrimonio.fondoInstitucionalCartera || 0)
                            )}
                          </span>
                        </div>
                        <table style={{ width: "100%", fontSize: "0.73rem", borderCollapse: "collapse", tableLayout: "fixed" }}>
                          <tbody>
                            <tr style={{ borderBottom: "1px solid var(--line)" }}>
                              <td className="mono" style={{ padding: "0.12rem 0", color: "var(--ink-soft)", width: "48px", flexShrink: 0 }}>302-01</td>
                              <td style={{ padding: "0.12rem 0.25rem", color: "var(--ink)", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title="Reserva Institucional (5%)">Reserva Institucional (5%)</td>
                              <td className="mono" style={{ padding: "0.12rem 0", textAlign: "right", fontWeight: 700, color: "var(--ink)", width: "82px", flexShrink: 0 }}>{formatoQ(datos.balanceGeneral.patrimonio.reservaInstitucional)}</td>
                            </tr>
                            <tr style={{ borderBottom: "1px solid var(--line)" }}>
                              <td className="mono" style={{ padding: "0.12rem 0", color: "var(--ink-soft)", width: "48px", flexShrink: 0 }}>303-01</td>
                              <td style={{ padding: "0.12rem 0.25rem", color: "#0284c7", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title="Excedente Neto Ejercicio 2026">Excedente Neto 2026</td>
                              <td className="mono" style={{ padding: "0.12rem 0", textAlign: "right", fontWeight: 800, color: "#0284c7", width: "82px", flexShrink: 0 }}>{formatoQ(datos.balanceGeneral.patrimonio.excedenteNetoPeriodo)}</td>
                            </tr>
                            {Number(datos.balanceGeneral.patrimonio.fondoInstitucionalCartera || 0) > 0 && (
                              <tr style={{ borderBottom: "1px solid var(--line)" }}>
                                <td className="mono" style={{ padding: "0.12rem 0", color: "var(--ink-soft)", width: "48px", flexShrink: 0 }}>304-01</td>
                                <td style={{ padding: "0.12rem 0.25rem", color: "#059669", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title="Línea de Crédito FEDERURAL / Fondos Propios de Cartera">Línea Fondos FEDERURAL</td>
                                <td className="mono" style={{ padding: "0.12rem 0", textAlign: "right", fontWeight: 800, color: "#059669", width: "82px", flexShrink: 0 }}>{formatoQ(datos.balanceGeneral.patrimonio.fondoInstitucionalCartera || 0)}</td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* TOTAL PATRIMONIO RESALTADO EN PIE DE COLUMNA */}
                    <div style={{ background: "#fdf2f8", border: "1.5px solid #be185d", padding: "0.32rem 0.6rem", borderRadius: "5px", display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "0.3rem", flexShrink: 0 }}>
                      <span style={{ fontSize: "0.76rem", fontWeight: 800, color: "#831843" }}>TOTAL PATRIMONIO</span>
                      <span className="mono" style={{ fontSize: "0.98rem", fontWeight: 900, color: "#9d174d" }}>{formatoQ(datos.balanceGeneral.patrimonio.totalPatrimonio)}</span>
                    </div>
                  </div>

                </div>

                {/* ── BARRA INFERIOR DE CUADRE Y PARTIDA DOBLE OFICIAL (100% VISIBLE SIN SCROLL) ── */}
                <div
                  style={{
                    background: "var(--paper-raised)",
                    border: "1.5px solid #059669",
                    borderRadius: "6px",
                    padding: "0.35rem 0.75rem",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: "0.5rem",
                    flexShrink: 0,
                    boxShadow: "0 2px 6px rgba(5, 150, 105, 0.12)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                    <span style={{ fontSize: "0.78rem", fontWeight: 800, color: "var(--ink)" }}>
                      ECUACIÓN CONTABLE:
                    </span>
                    <span style={{ fontSize: "0.75rem", color: "var(--ink-soft)" }}>
                      ACTIVO = PASIVO + PATRIMONIO
                    </span>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                      <span style={{ fontSize: "0.72rem", color: "#065f46", fontWeight: 700 }}>Total Activo:</span>
                      <span className="mono" style={{ fontSize: "0.9rem", fontWeight: 900, color: "#047857" }}>
                        {formatoQ(datos.balanceGeneral.activo.totalActivo)}
                      </span>
                    </div>

                    <span style={{ color: "var(--ink-soft)", fontWeight: 800 }}>=</span>

                    <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                      <span style={{ fontSize: "0.72rem", color: "#4c1d95", fontWeight: 700 }}>Pasivo + Patrimonio:</span>
                      <span className="mono" style={{ fontSize: "0.9rem", fontWeight: 900, color: "#5b21b6" }}>
                        {formatoQ(datos.balanceGeneral.cuadre.totalPasivoMasPatrimonio)}
                      </span>
                    </div>

                    <div
                      style={{
                        background: datos.balanceGeneral.cuadre.cuadrado ? "#ecfdf5" : "#fef2f2",
                        border: datos.balanceGeneral.cuadre.cuadrado ? "1px solid #10b981" : "1px solid #ef4444",
                        color: datos.balanceGeneral.cuadre.cuadrado ? "#047857" : "#b91c1c",
                        padding: "0.15rem 0.5rem",
                        borderRadius: "4px",
                        fontSize: "0.72rem",
                        fontWeight: 800,
                        display: "flex",
                        alignItems: "center",
                        gap: "0.25rem",
                      }}
                    >
                      {datos.balanceGeneral.cuadre.cuadrado ? "⚖️ CUADRADO EXACTO (Q 0.00)" : `⚠️ DIFERENCIA: Q ${datos.balanceGeneral.cuadre.diferencia.toFixed(2)}`}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: ESTADO DE RESULTADOS COMPACTO Y DE ALTO CONTRASTE */}
            {tabActiva === "RESULTADOS" && (
              <div style={{ flex: 1, minHeight: 0, overflowY: "auto", display: "flex", flexDirection: "column", gap: "0.35rem", paddingRight: "0.2rem" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.55rem" }}>
                  {/* 1. Ingresos Financieros */}
                  <div style={{ background: "var(--paper-raised)", border: "1px solid var(--line)", borderRadius: "6px", padding: "0.35rem 0.55rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, color: "#059669", fontSize: "0.78rem", borderBottom: "1px solid var(--line)", paddingBottom: "0.2rem", marginBottom: "0.2rem" }}>
                      <span>(+) INGRESOS FINANCIEROS</span>
                      <span className="mono">Total: {formatoQ(datos.estadoResultados.ingresosFinancieros.total)}</span>
                    </div>
                    <table style={{ width: "100%", fontSize: "0.73rem", borderCollapse: "collapse", tableLayout: "fixed" }}>
                      <tbody>
                        {datos.estadoResultados.ingresosFinancieros.rubros.map((r, i) => (
                          <tr key={i} style={{ borderBottom: "1px solid var(--line)" }}>
                            <td className="mono" style={{ padding: "0.15rem 0", color: "var(--ink-soft)", width: "48px", flexShrink: 0 }}>{r.codigo}</td>
                            <td style={{ padding: "0.15rem 0.25rem", color: "var(--ink)", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={r.concepto}>{r.concepto}</td>
                            <td className="mono" style={{ padding: "0.15rem 0", textAlign: "right", fontWeight: 700, color: "var(--ink)", width: "82px", flexShrink: 0 }}>{formatoQ(r.monto)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* 2. Costos Financieros */}
                  <div style={{ background: "var(--paper-raised)", border: "1px solid var(--line)", borderRadius: "6px", padding: "0.35rem 0.55rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, color: "#dc2626", fontSize: "0.78rem", borderBottom: "1px solid var(--line)", paddingBottom: "0.2rem", marginBottom: "0.2rem" }}>
                      <span>(-) COSTOS FINANCIEROS</span>
                      <span className="mono">Total: -{formatoQ(datos.estadoResultados.costosFinancieros.total)}</span>
                    </div>
                    <table style={{ width: "100%", fontSize: "0.73rem", borderCollapse: "collapse", tableLayout: "fixed" }}>
                      <tbody>
                        {datos.estadoResultados.costosFinancieros.rubros.map((r, i) => (
                          <tr key={i} style={{ borderBottom: "1px solid var(--line)" }}>
                            <td className="mono" style={{ padding: "0.15rem 0", color: "var(--ink-soft)", width: "48px", flexShrink: 0 }}>{r.codigo}</td>
                            <td style={{ padding: "0.15rem 0.25rem", color: "var(--ink)", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={r.concepto}>{r.concepto}</td>
                            <td className="mono" style={{ padding: "0.15rem 0", textAlign: "right", fontWeight: 700, color: "#dc2626", width: "82px", flexShrink: 0 }}>-{formatoQ(r.monto)}</td>
                          </tr>
                        ))}
                        <tr style={{ fontWeight: 800, color: "#0284c7", background: "rgba(2, 132, 199, 0.06)" }}>
                          <td colSpan={2} style={{ padding: "0.25rem 0.4rem" }}>MARGEN BRUTO</td>
                          <td className="mono" style={{ padding: "0.25rem 0.4rem", textAlign: "right", fontSize: "0.82rem" }}>{formatoQ(datos.estadoResultados.margenFinancieroBruto)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* 3. Gastos Operativos (Caja Chica) */}
                  <div style={{ background: "var(--paper-raised)", border: "1px solid var(--line)", borderRadius: "6px", padding: "0.35rem 0.55rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, color: "#d97706", fontSize: "0.78rem", borderBottom: "1px solid var(--line)", paddingBottom: "0.2rem", marginBottom: "0.2rem" }}>
                      <span>(-) GASTOS CAJA CHICA</span>
                      <span className="mono">Total: -{formatoQ(datos.estadoResultados.gastosOperativos.total)}</span>
                    </div>
                    <table style={{ width: "100%", fontSize: "0.73rem", borderCollapse: "collapse", tableLayout: "fixed" }}>
                      <tbody>
                        {datos.estadoResultados.gastosOperativos.rubros.map((r, i) => (
                          <tr key={i} style={{ borderBottom: "1px solid var(--line)" }}>
                            <td className="mono" style={{ padding: "0.15rem 0", color: "var(--ink-soft)", width: "48px", flexShrink: 0 }}>{r.codigo}</td>
                            <td style={{ padding: "0.15rem 0.25rem", color: "var(--ink)", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={r.concepto}>{r.concepto}</td>
                            <td className="mono" style={{ padding: "0.15rem 0", textAlign: "right", fontWeight: 700, color: "#dc2626", width: "82px", flexShrink: 0 }}>-{formatoQ(r.monto)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* EXCEDENTE NETO AL PIE */}
                <div
                  style={{
                    background: "#ecfdf5",
                    border: "1.5px solid #059669",
                    borderRadius: "6px",
                    padding: "0.45rem 0.85rem",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginTop: "auto",
                  }}
                >
                  <div>
                    <div style={{ fontSize: "0.85rem", fontWeight: 800, color: "#065f46" }}>
                      (=) EXCEDENTE NETO DEL EJERCICIO 2026
                    </div>
                    <div style={{ fontSize: "0.68rem", color: "var(--ink-soft)" }}>
                      Margen Financiero Bruto menos Gastos Operativos de Agencia Chajul
                    </div>
                  </div>
                  <div className="mono" style={{ fontSize: "1.15rem", fontWeight: 900, color: "#047857" }}>
                    {formatoQ(datos.estadoResultados.excedenteNeto)}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: CALIDAD DE CARTERA Y RIESGO COMPACTO */}
            {tabActiva === "RIESGO" && (
              <div style={{ flex: 1, minHeight: 0, overflowY: "auto", display: "flex", flexDirection: "column", gap: "0.45rem", paddingRight: "0.2rem" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.55rem" }}>
                  <div style={{ background: "var(--paper-raised)", border: "1px solid var(--line)", borderRadius: "6px", padding: "0.45rem 0.65rem" }}>
                    <div style={{ fontSize: "0.7rem", color: "var(--ink-soft)", fontWeight: 700 }}>ÍNDICE DE MOROSIDAD (PAR &gt; 30 DÍAS)</div>
                    <div className="mono" style={{ fontSize: "1.3rem", fontWeight: 800, color: datos.calidadCartera.indiceMorosidad > 5 ? "#dc2626" : "#059669", marginTop: "0.1rem" }}>
                      {datos.calidadCartera.indiceMorosidad}%
                    </div>
                    <div style={{ fontSize: "0.65rem", color: "var(--ink-soft)" }}>
                      Límite institucional de tolerancia: 5.0%
                    </div>
                  </div>

                  <div style={{ background: "var(--paper-raised)", border: "1px solid var(--line)", borderRadius: "6px", padding: "0.45rem 0.65rem" }}>
                    <div style={{ fontSize: "0.7rem", color: "var(--ink-soft)", fontWeight: 700 }}>PROVISIÓN PARA CRÉDITOS INCOBRABLES</div>
                    <div className="mono" style={{ fontSize: "1.3rem", fontWeight: 800, color: "#0284c7", marginTop: "0.1rem" }}>
                      {formatoQ(datos.balanceGeneral.activo.cartera.provisionEstimada)}
                    </div>
                    <div style={{ fontSize: "0.65rem", color: "var(--ink-soft)" }}>
                      1% sobre cartera al día + ponderación por días de atraso
                    </div>
                  </div>
                </div>

                <div style={{ background: "var(--paper-raised)", border: "1px solid var(--line)", borderRadius: "6px", padding: "0.4rem 0.6rem" }}>
                  <div style={{ fontWeight: 700, color: "var(--ink)", marginBottom: "0.25rem", fontSize: "0.78rem" }}>
                    ESTRATIFICACIÓN POR TRAMOS DE VENCIMIENTO Y MORA
                  </div>
                  <table style={{ width: "100%", fontSize: "0.73rem", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ background: "var(--mono-bg)", color: "var(--ink)" }}>
                        <th style={{ padding: "0.25rem 0.4rem", textAlign: "left" }}>Tramo de Riesgo</th>
                        <th style={{ padding: "0.25rem 0.4rem", textAlign: "center" }}>Créditos</th>
                        <th style={{ padding: "0.25rem 0.4rem", textAlign: "right" }}>Capital Vivo (Q)</th>
                        <th style={{ padding: "0.25rem 0.4rem", textAlign: "right" }}>% de Cartera</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr style={{ borderBottom: "1px solid var(--line)" }}>
                        <td style={{ padding: "0.25rem 0.4rem", color: "#059669", fontWeight: 700 }}>🟢 Al Día (0 días de atraso)</td>
                        <td className="mono" style={{ padding: "0.25rem 0.4rem", textAlign: "center", color: "var(--ink)" }}>{datos.calidadCartera.tramosMora.alDia.cantidad}</td>
                        <td className="mono" style={{ padding: "0.25rem 0.4rem", textAlign: "right", fontWeight: 700, color: "var(--ink)" }}>{formatoQ(datos.calidadCartera.tramosMora.alDia.monto)}</td>
                        <td className="mono" style={{ padding: "0.25rem 0.4rem", textAlign: "right", fontWeight: 700, color: "#059669" }}>{datos.calidadCartera.tramosMora.alDia.porcentaje}%</td>
                      </tr>
                      <tr style={{ borderBottom: "1px solid var(--line)" }}>
                        <td style={{ padding: "0.25rem 0.4rem", color: "#d97706", fontWeight: 700 }}>🟡 Gracia / Riesgo Leve (1 - 30 días)</td>
                        <td className="mono" style={{ padding: "0.25rem 0.4rem", textAlign: "center", color: "var(--ink)" }}>{datos.calidadCartera.tramosMora.rango1_30.cantidad}</td>
                        <td className="mono" style={{ padding: "0.25rem 0.4rem", textAlign: "right", fontWeight: 700, color: "var(--ink)" }}>{formatoQ(datos.calidadCartera.tramosMora.rango1_30.monto)}</td>
                        <td className="mono" style={{ padding: "0.25rem 0.4rem", textAlign: "right", fontWeight: 700, color: "#d97706" }}>{datos.calidadCartera.tramosMora.rango1_30.porcentaje}%</td>
                      </tr>
                      <tr style={{ borderBottom: "1px solid var(--line)" }}>
                        <td style={{ padding: "0.25rem 0.4rem", color: "#ea580c", fontWeight: 700 }}>🟠 Mora Media (31 - 60 días)</td>
                        <td className="mono" style={{ padding: "0.25rem 0.4rem", textAlign: "center", color: "var(--ink)" }}>{datos.calidadCartera.tramosMora.rango31_60.cantidad}</td>
                        <td className="mono" style={{ padding: "0.25rem 0.4rem", textAlign: "right", fontWeight: 700, color: "var(--ink)" }}>{formatoQ(datos.calidadCartera.tramosMora.rango31_60.monto)}</td>
                        <td className="mono" style={{ padding: "0.25rem 0.4rem", textAlign: "right", fontWeight: 700, color: "#ea580c" }}>{datos.calidadCartera.tramosMora.rango31_60.porcentaje}%</td>
                      </tr>
                      <tr style={{ borderBottom: "1px solid var(--line)" }}>
                        <td style={{ padding: "0.25rem 0.4rem", color: "#dc2626", fontWeight: 700 }}>🔴 Mora Alta (61 - 90 días)</td>
                        <td className="mono" style={{ padding: "0.25rem 0.4rem", textAlign: "center", color: "var(--ink)" }}>{datos.calidadCartera.tramosMora.rango61_90.cantidad}</td>
                        <td className="mono" style={{ padding: "0.25rem 0.4rem", textAlign: "right", fontWeight: 700, color: "var(--ink)" }}>{formatoQ(datos.calidadCartera.tramosMora.rango61_90.monto)}</td>
                        <td className="mono" style={{ padding: "0.25rem 0.4rem", textAlign: "right", fontWeight: 700, color: "#dc2626" }}>{datos.calidadCartera.tramosMora.rango61_90.porcentaje}%</td>
                      </tr>
                      <tr style={{ borderBottom: "1px solid var(--line)" }}>
                        <td style={{ padding: "0.25rem 0.4rem", color: "#991b1b", fontWeight: 800 }}>⛔ Cobro Judicial (&gt; 90 días)</td>
                        <td className="mono" style={{ padding: "0.25rem 0.4rem", textAlign: "center", color: "var(--ink)" }}>{datos.calidadCartera.tramosMora.mas90.cantidad}</td>
                        <td className="mono" style={{ padding: "0.25rem 0.4rem", textAlign: "right", fontWeight: 700, color: "var(--ink)" }}>{formatoQ(datos.calidadCartera.tramosMora.mas90.monto)}</td>
                        <td className="mono" style={{ padding: "0.25rem 0.4rem", textAlign: "right", fontWeight: 800, color: "#991b1b" }}>{datos.calidadCartera.tramosMora.mas90.porcentaje}%</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Firmas Notariales e Institucionales (aparecen en papel o al pie de impresión) */}
            <div className="only-print" style={{ marginTop: "1.5rem", paddingTop: "0.75rem", borderTop: "1px solid var(--line)" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1.5rem", textAlign: "center" }}>
                <div>
                  <div style={{ borderBottom: "1px solid var(--ink)", height: "35px", marginBottom: "0.25rem" }}></div>
                  <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--ink)" }}>Receptor / Cajero</div>
                  <div style={{ fontSize: "0.7rem", color: "var(--ink-soft)" }}>Operaciones de Ventanilla</div>
                </div>

                <div>
                  <div style={{ borderBottom: "1px solid var(--ink)", height: "35px", marginBottom: "0.25rem" }}></div>
                  <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--ink)" }}>Contador General</div>
                  <div style={{ fontSize: "0.7rem", color: "var(--ink-soft)" }}>Registro y Certificación Contable</div>
                </div>

                <div>
                  <div style={{ borderBottom: "1px solid var(--ink)", height: "35px", marginBottom: "0.25rem" }}></div>
                  <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--ink)" }}>Jefe de Agencia / Vigilancia</div>
                  <div style={{ fontSize: "0.7rem", color: "var(--ink-soft)" }}>Supervisión y Dictamen Oficial</div>
                </div>
              </div>
            </div>

          </div>
        </>
      )}
    </div>
  );
}
