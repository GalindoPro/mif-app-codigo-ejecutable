import { formatoQ } from "../types";

export interface ServicioItem {
  producto: string;
  categoria: string;
  label: string;
  icon: string;
  flujo: "INGRESO" | "EGRESO";
  cantidad: number;
  totalMonto: number;
  porcentaje: number;
}

export interface DiagnosticoGerencialReporteModalProps {
  isOpen: boolean;
  onClose: () => void;
  periodoLabel: string;
  agenciaNombre: string;
  fechaCorte: string;
  servicios: ServicioItem[];
  totalIngresos: number;
  totalEgresos: number;
  flujoNeto: number;
  ratioSalida: number;
  depositosAhorro: number;
  retirosAhorro: number;
  cobroCreditos: number;
  desembolsoCreditos: number;
  gastoCajaChica: number;
  usuarioNombre?: string;
}

export default function DiagnosticoGerencialReporteModal({
  isOpen,
  onClose,
  periodoLabel,
  agenciaNombre,
  fechaCorte,
  servicios,
  totalIngresos,
  totalEgresos,
  flujoNeto,
  ratioSalida,
  depositosAhorro,
  retirosAhorro,
  cobroCreditos,
  desembolsoCreditos,
  gastoCajaChica,
  usuarioNombre,
}: DiagnosticoGerencialReporteModalProps) {
  if (!isOpen) return null;

  const esSuperavit = flujoNeto >= 0;
  const fechaEmision = new Date().toLocaleString("es-GT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  // Exportar a Excel (CSV con formato formal)
  function handleExportarCSV() {
    const lineas: string[] = [];
    lineas.push("COOPERATIVA MAYA INVERSIONES FUTURAS R.L. (COMIF-R.L.)");
    lineas.push("DIAGNÓSTICO ESTRATÉGICO DE GERENCIA - DETECCIÓN DE DEBILIDADES FINANCIERAS");
    lineas.push(`Agencia: "${agenciaNombre}"`);
    lineas.push(`Período Auditado: "${periodoLabel}"`);
    lineas.push(`Fecha de Corte Contable: "${fechaCorte}"`);
    lineas.push(`Fecha de Emisión: "${fechaEmision}"`);
    lineas.push(`Emitido Por: "${usuarioNombre || "Gerencia General"}"`);
    lineas.push("");

    // Resumen Ejecutivo
    lineas.push("--- RESUMEN EJECUTIVO DE LIQUIDEZ ---");
    lineas.push("INDICADOR,VALOR EN QUETZALES (Q),INTERPRETACIÓN");
    lineas.push(`"Total Entradas / Depósitos",${totalIngresos.toFixed(2)},"Fondos captados y cobros de cartera"`);
    lineas.push(`"Total Salidas / Retiros",${totalEgresos.toFixed(2)},"Egresos de caja retiros y colocaciones"`);
    lineas.push(`"Flujo Neto del Período",${flujoNeto.toFixed(2)},"${esSuperavit ? "SUPERÁVIT DE LIQUIDEZ" : "DÉFICIT / ALTA COLOCACIÓN"}"`);
    lineas.push(`"Tasa de Salida de Efectivo",${ratioSalida.toFixed(1)}%,"${ratioSalida > 100 ? "Alerta: Salidas superan ingresos" : "Liquidez controlada y autosuficiente"}"`);
    lineas.push("");

    // Factores Clave de Debilidad / Fortaleza
    lineas.push("--- FACTORES CLAVE Y DETECCIÓN DE DEBILIDADES ---");
    lineas.push("FACTOR,MONTO (Q),EVALUACIÓN ESTRATÉGICA");
    lineas.push(
      `"Depósitos de Ahorro",${depositosAhorro.toFixed(2)},"${depositosAhorro >= retirosAhorro ? "Fortaleza: Captación positiva" : "Atención: Menor que los retiros"}"`,
    );
    lineas.push(
      `"Retiros de Ahorro",${retirosAhorro.toFixed(2)},"${retirosAhorro > depositosAhorro ? "Debilidad: Fuga neta de depósitos" : "Retiros normales bajo control"}"`,
    );
    lineas.push(
      `"Brecha Neta de Ahorro",${(depositosAhorro - retirosAhorro).toFixed(2)},"${depositosAhorro >= retirosAhorro ? "Superávit neto en captaciones" : "Déficit neto en cuentas de ahorros"}"`,
    );
    lineas.push(
      `"Cobro y Recuperación de Créditos",${cobroCreditos.toFixed(2)},"${cobroCreditos > 0 ? "Cobranza activa y amortización de cartera" : "Alerta: Nula amortización registrada"}"`,
    );
    lineas.push(
      `"Desembolso de Nuevos Préstamos",${desembolsoCreditos.toFixed(2)},"${desembolsoCreditos > 0 ? "Colocación de cartera para rentabilidad futura" : "Sin colocaciones en este período"}"`,
    );
    lineas.push(
      `"Gastos Menores de Caja Chica",${gastoCajaChica.toFixed(2)},"${totalIngresos > 0 && (gastoCajaChica / totalIngresos) * 100 < 5 ? "Disciplina operativa (< 5% del flujo)" : "Requiere auditoría de comprobantes"}"`,
    );
    lineas.push("");

    // Desglose por Operación
    lineas.push("--- DESGLOSE DETALLADO DE MOVIMIENTOS POR PRODUCTO ---");
    lineas.push("N°,PRODUCTO / CUENTA,OPERACIÓN,FLUJO,TRANSACCIONES,MONTO (Q),% DEL VOLUMEN");

    const volumenTotal = servicios.reduce((acc, s) => acc + s.totalMonto, 0);
    servicios.forEach((s, idx) => {
      const pct = volumenTotal > 0 ? ((s.totalMonto / volumenTotal) * 100).toFixed(1) : "0.0";
      lineas.push(
        `${idx + 1},"${s.producto}","${s.label}","${s.flujo}",${s.cantidad},${s.totalMonto.toFixed(2)},${pct}%`,
      );
    });

    lineas.push("");
    lineas.push("--- FIRMAS INSTITUCIONALES DE AUTORIZACIÓN ---");
    lineas.push('"Gerente General","Presidente del Consejo de Administración","Comisión de Vigilancia"');

    const contenido = "\uFEFF" + lineas.join("\n");
    const blob = new Blob([contenido], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Diagnostico_Gerencial_${periodoLabel.replace(/\s+/g, "_")}_${fechaCorte}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleImprimir() {
    window.print();
  }

  const volumenTotal = servicios.reduce((acc, s) => acc + s.totalMonto, 0);

  return (
    <div
      className="modal"
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(15, 23, 42, 0.75)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        padding: "1rem",
      }}
      onClick={onClose}
    >
      <div
        className="modal-content"
        style={{
          background: "#ffffff",
          color: "#0f172a",
          maxWidth: "880px",
          width: "100%",
          maxHeight: "92vh",
          display: "flex",
          flexDirection: "column",
          borderRadius: "10px",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.35)",
          border: "1px solid #cbd5e1",
          overflow: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Barra Superior con Acciones (Oculta al Imprimir) */}
        <div
          className="no-print"
          style={{
            padding: "0.65rem 1rem",
            background: "#f8fafc",
            borderBottom: "1px solid #e2e8f0",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span style={{ fontSize: "1.1rem" }}>📑</span>
            <div>
              <h3 style={{ margin: 0, fontSize: "0.88rem", fontWeight: 700, color: "#0f172a" }}>
                Reporte Ejecutivo de Diagnóstico Financiero
              </h3>
              <span style={{ fontSize: "0.7rem", color: "#64748b" }}>
                COOP COMIF R.L. — {periodoLabel}
              </span>
            </div>
          </div>

          <div style={{ display: "flex", gap: "0.4rem" }}>
            <button
              type="button"
              onClick={handleExportarCSV}
              className="btn btn-xs secondary"
              style={{ fontSize: "0.74rem", padding: "0.3rem 0.6rem", display: "inline-flex", alignItems: "center", gap: "0.3rem" }}
              title="Descargar datos en formato Excel (CSV)"
            >
              <span>📥</span> Descargar Excel
            </button>
            <button
              type="button"
              onClick={handleImprimir}
              className="btn btn-xs"
              style={{ fontSize: "0.74rem", padding: "0.3rem 0.65rem", background: "#0284c7", color: "#ffffff", display: "inline-flex", alignItems: "center", gap: "0.3rem" }}
              title="Imprimir documento oficial o guardar en PDF"
            >
              <span>🖨️</span> Imprimir / Guardar PDF
            </button>
            <button
              type="button"
              onClick={onClose}
              className="btn btn-xs secondary"
              style={{ fontSize: "0.74rem", padding: "0.3rem 0.5rem" }}
              title="Cerrar modal"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Contenedor del Documento Oficial Imprimible */}
        <div
          id="reporte-imprimible"
          style={{
            padding: "1.2rem 1.5rem",
            overflowY: "auto",
            flex: 1,
            backgroundColor: "#ffffff",
            color: "#0f172a",
            fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          }}
        >
          {/* Encabezado Oficial con Membrete */}
          <div style={{ borderBottom: "2px solid #0f172a", paddingBottom: "0.75rem", marginBottom: "1rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <h1 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 800, color: "#0f172a", letterSpacing: "-0.01em" }}>
                  COOPERATIVA MAYA INVERSIONES FUTURAS R.L.
                </h1>
                <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "#0284c7", marginTop: "0.1rem" }}>
                  "COMIF-R.L." — CONSEJO DIRECTIVO Y GERENCIA GENERAL
                </div>
                <div style={{ fontSize: "0.74rem", color: "#475569", marginTop: "0.2rem" }}>
                  Agencia: <strong>{agenciaNombre}</strong> | Período Auditado: <strong>{periodoLabel}</strong>
                </div>
              </div>

              <div style={{ textAlign: "right", fontSize: "0.72rem", color: "#64748b" }}>
                <div><strong>Fecha de Corte:</strong> {fechaCorte}</div>
                <div><strong>Emisión:</strong> {fechaEmision}</div>
                <div style={{ marginTop: "0.2rem" }}>
                  <span
                    style={{
                      display: "inline-block",
                      padding: "0.15rem 0.5rem",
                      borderRadius: "4px",
                      fontSize: "0.7rem",
                      fontWeight: 700,
                      backgroundColor: esSuperavit ? "#dcfce7" : "#fee2e2",
                      color: esSuperavit ? "#15803d" : "#b91c1c",
                      border: `1px solid ${esSuperavit ? "#86efac" : "#fca5a5"}`,
                    }}
                  >
                    {esSuperavit ? "✓ SUPERÁVIT DE LIQUIDEZ" : "⚠️ DÉFICIT DE CAJA / ALTA COLOCACIÓN"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 4 KPIs de Flujo en Formato Documento */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.6rem", marginBottom: "1rem" }}>
            <div style={{ border: "1px solid #cbd5e1", borderRadius: "6px", padding: "0.5rem 0.65rem", backgroundColor: "#f8fafc" }}>
              <div style={{ fontSize: "0.68rem", color: "#166534", fontWeight: 700, textTransform: "uppercase" }}>
                🟢 Total Ingresos
              </div>
              <div style={{ fontSize: "1.05rem", fontWeight: 800, color: "#15803d", fontFamily: "'IBM Plex Mono', monospace", margin: "0.2rem 0 0.1rem" }}>
                {formatoQ(totalIngresos)}
              </div>
              <div style={{ fontSize: "0.65rem", color: "#64748b" }}>Captaciones y cobros</div>
            </div>

            <div style={{ border: "1px solid #cbd5e1", borderRadius: "6px", padding: "0.5rem 0.65rem", backgroundColor: "#f8fafc" }}>
              <div style={{ fontSize: "0.68rem", color: "#991b1b", fontWeight: 700, textTransform: "uppercase" }}>
                🔴 Total Salidas
              </div>
              <div style={{ fontSize: "1.05rem", fontWeight: 800, color: "#b91c1c", fontFamily: "'IBM Plex Mono', monospace", margin: "0.2rem 0 0.1rem" }}>
                {formatoQ(totalEgresos)}
              </div>
              <div style={{ fontSize: "0.65rem", color: "#64748b" }}>Retiros y colocación</div>
            </div>

            <div style={{ border: "1px solid #cbd5e1", borderRadius: "6px", padding: "0.5rem 0.65rem", backgroundColor: "#f8fafc" }}>
              <div style={{ fontSize: "0.68rem", color: "#0369a1", fontWeight: 700, textTransform: "uppercase" }}>
                ⚖️ Flujo Neto
              </div>
              <div
                style={{
                  fontSize: "1.05rem",
                  fontWeight: 800,
                  color: esSuperavit ? "#0284c7" : "#d97706",
                  fontFamily: "'IBM Plex Mono', monospace",
                  margin: "0.2rem 0 0.1rem",
                }}
              >
                {esSuperavit ? "+" : ""}{formatoQ(flujoNeto)}
              </div>
              <div style={{ fontSize: "0.65rem", color: "#64748b" }}>
                {esSuperavit ? "Capacidad positiva" : "Drenaje de gaveta"}
              </div>
            </div>

            <div style={{ border: "1px solid #cbd5e1", borderRadius: "6px", padding: "0.5rem 0.65rem", backgroundColor: "#f8fafc" }}>
              <div style={{ fontSize: "0.68rem", color: "#475569", fontWeight: 700, textTransform: "uppercase" }}>
                🌊 Tasa de Salida
              </div>
              <div
                style={{
                  fontSize: "1.05rem",
                  fontWeight: 800,
                  color: ratioSalida > 100 ? "#b91c1c" : "#15803d",
                  fontFamily: "'IBM Plex Mono', monospace",
                  margin: "0.2rem 0 0.1rem",
                }}
              >
                {ratioSalida.toFixed(1)}%
              </div>
              <div style={{ fontSize: "0.65rem", color: "#64748b" }}>
                Salidas / Ingresos
              </div>
            </div>
          </div>

          {/* Matriz Estratégica de Diagnóstico: Detección de Debilidades y Recomendaciones */}
          <div style={{ border: "1px solid #cbd5e1", borderRadius: "8px", padding: "0.75rem", backgroundColor: "#f1f5f9", marginBottom: "1rem" }}>
            <h4 style={{ margin: "0 0 0.5rem 0", fontSize: "0.82rem", fontWeight: 700, color: "#0f172a", display: "flex", alignItems: "center", gap: "0.35rem" }}>
              <span>🧭</span> DICTAMEN FINANCIERO Y EVALUACIÓN DE DEBILIDADES OPERATIVAS
            </h4>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.6rem", fontSize: "0.73rem" }}>
              {/* Factor 1: Presión de Liquidez */}
              <div style={{ background: "#ffffff", padding: "0.5rem 0.65rem", borderRadius: "6px", border: "1px solid #e2e8f0" }}>
                <strong style={{ color: "#0f172a" }}>1. Presión y Drenaje de Liquidez:</strong>
                <p style={{ margin: "0.2rem 0 0", color: "#334155", lineHeight: 1.4 }}>
                  {ratioSalida > 100
                    ? `⚠️ DEBILIDAD DETECTADA: Por cada Q100 ingresados salieron Q${ratioSalida.toFixed(1)}. Déficit de caja de ${formatoQ(Math.abs(flujoNeto))}. Se recomienda no realizar traslados no esenciales a otras agencias y verificar si responde a colocación productiva de créditos.`
                    : `✅ LIQUIDEZ SÓLIDA: Por cada Q100 ingresados únicamente salieron Q${ratioSalida.toFixed(1)}. La agencia no requirió asistencia de liquidez de tesorería central.`}
                </p>
              </div>

              {/* Factor 2: Comportamiento de Ahorros */}
              <div style={{ background: "#ffffff", padding: "0.5rem 0.65rem", borderRadius: "6px", border: "1px solid #e2e8f0" }}>
                <strong style={{ color: "#0f172a" }}>2. Captación vs Retiros de Ahorros:</strong>
                <p style={{ margin: "0.2rem 0 0", color: "#334155", lineHeight: 1.4 }}>
                  {retirosAhorro > depositosAhorro
                    ? `⚠️ ALERTA DE FUGA DE FONDOS: Retiros de ahorro (${formatoQ(retirosAhorro)}) superaron los nuevos depósitos (${formatoQ(depositosAhorro)}) con una brecha negativa de Q${formatoQ(retirosAhorro - depositosAhorro)}. Se aconseja incentivar plazos fijos con tasas atractivas.`
                    : depositosAhorro > 0
                      ? `✅ FORTALEZA: Nuevos depósitos (${formatoQ(depositosAhorro)}) superaron los retiros (${formatoQ(retirosAhorro)}), generando captación neta positiva de +Q${formatoQ(depositosAhorro - retirosAhorro)}.`
                      : `ℹ️ Movimiento neutral o sin variaciones significativas en captaciones de ahorro en el período.`}
                </p>
              </div>

              {/* Factor 3: Cobro y Cartera de Créditos */}
              <div style={{ background: "#ffffff", padding: "0.5rem 0.65rem", borderRadius: "6px", border: "1px solid #e2e8f0" }}>
                <strong style={{ color: "#0f172a" }}>3. Cobranza y Colocación de Cartera:</strong>
                <p style={{ margin: "0.2rem 0 0", color: "#334155", lineHeight: 1.4 }}>
                  {cobroCreditos > 0
                    ? `✅ COBRANZA ACTIVA: Se amortizaron y recaudaron ${formatoQ(cobroCreditos)} en cuotas e intereses de créditos. ${desembolsoCreditos > 0 ? `Desembolsos de nuevos créditos: ${formatoQ(desembolsoCreditos)}.` : ""}`
                    : `⚠️ ATENCIÓN: Nula o baja amortización de cuotas de créditos registrada en este período. Exige revisión inmediata de la cartera en mora.`}
                </p>
              </div>

              {/* Factor 4: Disciplina en Gastos Menores */}
              <div style={{ background: "#ffffff", padding: "0.5rem 0.65rem", borderRadius: "6px", border: "1px solid #e2e8f0" }}>
                <strong style={{ color: "#0f172a" }}>4. Disciplina de Gastos Operativos:</strong>
                <p style={{ margin: "0.2rem 0 0", color: "#334155", lineHeight: 1.4 }}>
                  {gastoCajaChica > 0
                    ? `Gastos menores registrados: ${formatoQ(gastoCajaChica)}. Representa el ${totalIngresos > 0 ? ((gastoCajaChica / totalIngresos) * 100).toFixed(1) : 0}% de los ingresos del período. Operaciones dentro de los parámetros de Caja Chica.`
                    : `Sin egresos operativos menores reportados en este corte.`}
                </p>
              </div>
            </div>
          </div>

          {/* Tabla de Desglose de Operaciones */}
          <div style={{ marginBottom: "1.2rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.4rem" }}>
              <h4 style={{ margin: 0, fontSize: "0.78rem", fontWeight: 700, color: "#0f172a", textTransform: "uppercase" }}>
                Desglose Específico de Movimientos por Producto
              </h4>
              <span style={{ fontSize: "0.7rem", color: "#64748b" }}>
                Total Operaciones: <strong>{servicios.reduce((acc, s) => acc + s.cantidad, 0)}</strong>
              </span>
            </div>

            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: "0.72rem",
                border: "1px solid #e2e8f0",
              }}
            >
              <thead>
                <tr style={{ backgroundColor: "#f8fafc", borderBottom: "2px solid #cbd5e1", textAlign: "left" }}>
                  <th style={{ padding: "0.35rem 0.5rem", width: "30px" }}>N°</th>
                  <th style={{ padding: "0.35rem 0.5rem" }}>Operación / Producto</th>
                  <th style={{ padding: "0.35rem 0.5rem", textAlign: "center", width: "90px" }}>Flujo</th>
                  <th style={{ padding: "0.35rem 0.5rem", textAlign: "right", width: "80px" }}>Transacciones</th>
                  <th style={{ padding: "0.35rem 0.5rem", textAlign: "right", width: "120px" }}>Monto Total (Q)</th>
                  <th style={{ padding: "0.35rem 0.5rem", textAlign: "right", width: "85px" }}>% Volumen</th>
                </tr>
              </thead>
              <tbody>
                {servicios.map((s, idx) => {
                  const pct = volumenTotal > 0 ? ((s.totalMonto / volumenTotal) * 100).toFixed(1) : "0.0";
                  const isIngreso = s.flujo === "INGRESO";

                  return (
                    <tr
                      key={s.categoria || idx}
                      style={{
                        borderBottom: "1px solid #e2e8f0",
                        backgroundColor: idx % 2 === 0 ? "#ffffff" : "#fbfcfe",
                      }}
                    >
                      <td style={{ padding: "0.35rem 0.5rem", color: "#64748b" }}>{idx + 1}</td>
                      <td style={{ padding: "0.35rem 0.5rem", fontWeight: 600 }}>
                        <span style={{ marginRight: "0.3rem" }}>{s.icon}</span>
                        {s.label}
                      </td>
                      <td style={{ padding: "0.35rem 0.5rem", textAlign: "center" }}>
                        <span
                          style={{
                            display: "inline-block",
                            padding: "0.05rem 0.35rem",
                            borderRadius: "3px",
                            fontSize: "0.64rem",
                            fontWeight: 700,
                            backgroundColor: isIngreso ? "#dcfce7" : "#fee2e2",
                            color: isIngreso ? "#15803d" : "#b91c1c",
                          }}
                        >
                          {isIngreso ? "🟢 ENTRADA" : "🔴 SALIDA"}
                        </span>
                      </td>
                      <td style={{ padding: "0.35rem 0.5rem", textAlign: "right", fontFamily: "'IBM Plex Mono', monospace" }}>
                        {s.cantidad}
                      </td>
                      <td
                        style={{
                          padding: "0.35rem 0.5rem",
                          textAlign: "right",
                          fontWeight: 700,
                          fontFamily: "'IBM Plex Mono', monospace",
                          color: isIngreso ? "#15803d" : "#b91c1c",
                        }}
                      >
                        {formatoQ(s.totalMonto)}
                      </td>
                      <td style={{ padding: "0.35rem 0.5rem", textAlign: "right", color: "#475569" }}>
                        {pct}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr style={{ backgroundColor: "#f8fafc", borderTop: "2px solid #cbd5e1", fontWeight: 700 }}>
                  <td colSpan={3} style={{ padding: "0.4rem 0.5rem", textAlign: "right" }}>
                    TOTALES CONSOLIDADOS:
                  </td>
                  <td style={{ padding: "0.4rem 0.5rem", textAlign: "right", fontFamily: "'IBM Plex Mono', monospace" }}>
                    {servicios.reduce((acc, s) => acc + s.cantidad, 0)}
                  </td>
                  <td style={{ padding: "0.4rem 0.5rem", textAlign: "right", fontFamily: "'IBM Plex Mono', monospace", color: "#0f172a" }}>
                    {formatoQ(volumenTotal)}
                  </td>
                  <td style={{ padding: "0.4rem 0.5rem", textAlign: "right" }}>100.0%</td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Bloque de Firmas Institucionales */}
          <div
            style={{
              marginTop: "2.5rem",
              paddingTop: "1rem",
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              gap: "2rem",
              textAlign: "center",
              pageBreakInside: "avoid",
            }}
          >
            <div>
              <div style={{ borderBottom: "1px solid #0f172a", height: "38px", marginBottom: "0.35rem" }} />
              <div style={{ fontSize: "0.74rem", fontWeight: 700, color: "#0f172a" }}>
                Lic. Gerente General
              </div>
              <div style={{ fontSize: "0.68rem", color: "#64748b" }}>
                COOP COMIF R.L.
              </div>
            </div>

            <div>
              <div style={{ borderBottom: "1px solid #0f172a", height: "38px", marginBottom: "0.35rem" }} />
              <div style={{ fontSize: "0.74rem", fontWeight: 700, color: "#0f172a" }}>
                Presidente Consejo Administración
              </div>
              <div style={{ fontSize: "0.68rem", color: "#64748b" }}>
                Visto Bueno Ejecutivo
              </div>
            </div>

            <div>
              <div style={{ borderBottom: "1px solid #0f172a", height: "38px", marginBottom: "0.35rem" }} />
              <div style={{ fontSize: "0.74rem", fontWeight: 700, color: "#0f172a" }}>
                Comisión de Vigilancia / Auditor
              </div>
              <div style={{ fontSize: "0.68rem", color: "#64748b" }}>
                Fiscalización y Control
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
