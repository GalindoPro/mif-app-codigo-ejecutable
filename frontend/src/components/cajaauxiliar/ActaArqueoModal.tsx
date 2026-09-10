import { createPortal } from "react-dom";
import { useEffect } from "react";
import type { DetalleCajaAuxiliar } from "../../types";
import { formatearQuetzales } from "../../lib/formatters";

export interface ActaArqueoModalProps {
  agenciaNombre: string;
  detalle: DetalleCajaAuxiliar;
  onCerrar: () => void;
}

export default function ActaArqueoModal({
  agenciaNombre,
  detalle,
  onCerrar,
}: ActaArqueoModalProps) {
  useEffect(() => {
    // Al montar, esperamos un momento para que el DOM se dibuje y lanzamos print()
    const timer = setTimeout(() => {
      window.print();
    }, 150);

    const handleAfterPrint = () => {
      onCerrar(); // Cierra el componente oculto cuando termina de imprimir o cancela
    };

    window.addEventListener("afterprint", handleAfterPrint);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("afterprint", handleAfterPrint);
    };
  }, [onCerrar]);

  const dia = detalle.dia;
  const arqueo = detalle.arqueo;
  const fechaStr = new Date(dia.fecha).toLocaleDateString("es-GT", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const conteoMap: Record<number, number> = {};
  if (arqueo && Array.isArray(arqueo.detalle)) {
    for (const item of arqueo.detalle) {
      conteoMap[Number(item.valor)] = Number(item.cantidad);
    }
  }

  const billetes = [200, 100, 50, 20, 10, 5, 1];
  const monedas = [1.0, 0.5, 0.25, 0.1, 0.05, 0.01];

  const totalBilletes = billetes.reduce((sum, d) => sum + d * (conteoMap[d] || 0), 0);
  const totalMonedas = monedas.reduce((sum, d) => sum + d * (conteoMap[d] || 0), 0);
  const totalContado = Number(arqueo?.total_contado ?? (totalBilletes + totalMonedas));
  const saldoEsperado = Number(dia.saldo_final ?? detalle.saldoActual);
  const diferencia = Number(arqueo?.diferencia ?? (totalContado - saldoEsperado));

  // Renderizamos el portal pero con opacidad 0 y sin eventos de puntero (invisible en pantalla)
  // El CSS de impresión (@media print) en app.css se encarga de hacerlo visible y 100% de la hoja.
  return createPortal(
    <div
      className="arqueo-modal-overlay"
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "transparent",
        opacity: 0, // Oculto en pantalla
        pointerEvents: "none", // No interactivo en pantalla
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: -1,
      }}
    >
      <div
        className="card print-container arqueo-modal-card"
        style={{
          width: "100%",
          background: "#fff",
          color: "#0f172a",
          padding: "2rem",
        }}
      >

        {/* Encabezado Institucional */}
        <div style={{ textAlign: "center", borderBottom: "2px solid #0f172a", paddingBottom: "0.75rem", marginBottom: "1rem" }}>
          <h2 style={{ margin: 0, fontSize: "1.05rem", textTransform: "uppercase", letterSpacing: "0.03em" }}>
            COOPERATIVA INTEGRAL DE AHORRO Y CRÉDITO
          </h2>
          <h3 style={{ margin: "0.2rem 0", fontSize: "1.2rem", color: "#047857", fontWeight: 800 }}>
            "MAYA INVERSIONES FUTURAS", R.L.
          </h3>
          <h4 style={{ margin: "0.4rem 0 0.2rem", fontSize: "0.95rem", textDecoration: "underline" }}>
            ACTA DE ARQUEO DE CAJA
          </h4>
          <p style={{ margin: 0, fontSize: "0.85rem", color: "#475569" }}>
            Agencia: <strong>{agenciaNombre}</strong> · Cifras expresadas en Quetzales (Q)
          </p>
          <p style={{ margin: "0.25rem 0 0", fontSize: "0.82rem", color: "#64748b" }}>
            Fecha de Arqueo: <strong style={{ textTransform: "capitalize" }}>{fechaStr}</strong>
          </p>
        </div>

        {/* Resumen del Libro de Caja */}
        <div style={{ marginBottom: "1.25rem" }}>
          <h4 style={{ margin: "0 0 0.5rem", fontSize: "0.88rem", color: "var(--ink)", textTransform: "uppercase", borderBottom: "1px solid var(--line)", paddingBottom: "0.25rem" }}>
            1. Movimientos según Libro Auxiliar de Caja
          </h4>
          <table style={{ width: "100%", fontSize: "0.85rem", borderCollapse: "collapse" }}>
            <tbody>
              <tr style={{ borderBottom: "1px solid var(--line)" }}>
                <td style={{ padding: "0.35rem 0" }}>Saldo Inicial Según Auxiliar:</td>
                <td style={{ textAlign: "right", fontWeight: 600 }} className="mono">{formatearQuetzales(dia.saldo_inicial)}</td>
              </tr>
              <tr style={{ borderBottom: "1px solid var(--line)" }}>
                <td style={{ padding: "0.35rem 0", color: "#34d399" }}>(+) Total Ingresos del Día:</td>
                <td style={{ textAlign: "right", fontWeight: 600, color: "#34d399" }} className="mono">{formatearQuetzales(detalle.totalIngreso)}</td>
              </tr>
              <tr style={{ borderBottom: "1px solid var(--line)" }}>
                <td style={{ padding: "0.35rem 0", color: "#f87171" }}>(-) Total Egresos del Día:</td>
                <td style={{ textAlign: "right", fontWeight: 600, color: "#f87171" }} className="mono">{formatearQuetzales(detalle.totalEgreso)}</td>
              </tr>
              <tr style={{ borderTop: "2px solid var(--line)", background: "var(--mono-bg)" }}>
                <td style={{ padding: "0.5rem 0", fontWeight: 700 }}>(=) Saldo Final según Auxiliar de Caja:</td>
                <td style={{ textAlign: "right", fontWeight: 800, fontSize: "0.95rem" }} className="mono">{formatearQuetzales(saldoEsperado)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Conteo Físico del Efectivo (Billetes y Monedas) */}
        <div style={{ marginBottom: "1.25rem" }}>
          <h4 style={{ margin: "0 0 0.5rem", fontSize: "0.88rem", color: "#1e293b", textTransform: "uppercase", borderBottom: "1px solid #cbd5e1", paddingBottom: "0.25rem" }}>
            2. Arqueo del Efectivo Físico
          </h4>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "1rem", fontSize: "0.82rem" }}>
            {/* Tabla Billetes */}
            <div>
              <strong style={{ display: "block", marginBottom: "0.25rem", color: "#334155" }}>Billetes</strong>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #cbd5e1", fontSize: "0.75rem", color: "#64748b" }}>
                    <th style={{ textAlign: "left", padding: "0.2rem 0" }}>Denom.</th>
                    <th style={{ textAlign: "center", padding: "0.2rem 0" }}>Cant.</th>
                    <th style={{ textAlign: "right", padding: "0.2rem 0" }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {billetes.map((b) => {
                    const c = conteoMap[b] || 0;
                    return (
                      <tr key={b} style={{ borderBottom: "1px solid #f8fafc" }}>
                        <td style={{ padding: "0.2rem 0" }}>Q {b.toFixed(2)}</td>
                        <td style={{ textAlign: "center", padding: "0.2rem 0" }} className="mono">{c}</td>
                        <td style={{ textAlign: "right", padding: "0.2rem 0" }} className="mono">{formatearQuetzales(b * c)}</td>
                      </tr>
                    );
                  })}
                  <tr style={{ borderTop: "1px solid #cbd5e1", fontWeight: 700 }}>
                    <td colSpan={2} style={{ padding: "0.3rem 0" }}>Subtotal Billetes:</td>
                    <td style={{ textAlign: "right", padding: "0.3rem 0" }} className="mono">{formatearQuetzales(totalBilletes)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Tabla Monedas */}
            <div>
              <strong style={{ display: "block", marginBottom: "0.25rem", color: "#334155" }}>Monedas</strong>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #cbd5e1", fontSize: "0.75rem", color: "#64748b" }}>
                    <th style={{ textAlign: "left", padding: "0.2rem 0" }}>Denom.</th>
                    <th style={{ textAlign: "center", padding: "0.2rem 0" }}>Cant.</th>
                    <th style={{ textAlign: "right", padding: "0.2rem 0" }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {monedas.map((m) => {
                    const c = conteoMap[m] || 0;
                    return (
                      <tr key={m} style={{ borderBottom: "1px solid #f8fafc" }}>
                        <td style={{ padding: "0.2rem 0" }}>Q {m.toFixed(2)}</td>
                        <td style={{ textAlign: "center", padding: "0.2rem 0" }} className="mono">{c}</td>
                        <td style={{ textAlign: "right", padding: "0.2rem 0" }} className="mono">{formatearQuetzales(m * c)}</td>
                      </tr>
                    );
                  })}
                  <tr style={{ borderTop: "1px solid #cbd5e1", fontWeight: 700 }}>
                    <td colSpan={2} style={{ padding: "0.3rem 0" }}>Subtotal Monedas:</td>
                    <td style={{ textAlign: "right", padding: "0.3rem 0" }} className="mono">{formatearQuetzales(totalMonedas)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div
            style={{
              marginTop: "0.75rem",
              padding: "0.5rem 0.75rem",
              background: "#f1f5f9",
              borderRadius: "6px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              fontSize: "0.85rem",
            }}
          >
            <span>Total Efectivo Físico Arqueado:</span>
            <strong className="mono" style={{ fontSize: "1rem" }}>{formatearQuetzales(totalContado)}</strong>
          </div>

          <div
            style={{
              marginTop: "0.4rem",
              padding: "0.5rem 0.75rem",
              background: diferencia === 0 ? "#ecfdf5" : (diferencia > 0 ? "#eff6ff" : "#fef2f2"),
              color: diferencia === 0 ? "#065f46" : (diferencia > 0 ? "#1e40af" : "#991b1b"),
              border: `1px solid ${diferencia === 0 ? "#a7f3d0" : (diferencia > 0 ? "#bfdbfe" : "#fecaca")}`,
              borderRadius: "6px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              fontSize: "0.85rem",
              fontWeight: 700,
            }}
          >
            <span>DIFERENCIA:</span>
            <span className="mono">
              {diferencia === 0
                ? "CUADRADO EXACTO (Q 0.00)"
                : (diferencia > 0
                    ? `SOBRANTE: ${formatearQuetzales(diferencia)}`
                    : `FALTANTE: ${formatearQuetzales(Math.abs(diferencia))}`)}
            </span>
          </div>
        </div>

        {/* Texto Legal Institucional */}
        <div style={{ fontSize: "0.76rem", color: "#334155", lineHeight: 1.4, textAlign: "justify", marginBottom: "1.75rem", borderTop: "1px solid #cbd5e1", paddingTop: "0.6rem" }}>
          El día <strong style={{ textTransform: "capitalize" }}>{fechaStr}</strong> se practicó arqueo al Receptor Pagador en su presencia, presentándonos los documentos de soporte de ingresos y egresos para la debida revisión con el Auxiliar de Caja. De acuerdo al arqueo se determinó una diferencia de <strong>{formatearQuetzales(diferencia)}</strong>. Se devolvieron todos los comprobantes y documentos de forma íntegra a la persona encargada sin que haga falta ninguno, recibiéndolos en su entera satisfacción.
        </div>

        {/* Cuadro Oficial de Firmas */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2.5rem 2rem", marginTop: "1.5rem" }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ borderTop: "1px solid #0f172a", paddingTop: "0.3rem", fontSize: "0.8rem", fontWeight: 700 }}>
              Receptor Pagador
            </div>
            <div style={{ fontSize: "0.72rem", color: "#64748b" }}>Cajero de Ventanilla</div>
          </div>

          <div style={{ textAlign: "center" }}>
            <div style={{ borderTop: "1px solid #0f172a", paddingTop: "0.3rem", fontSize: "0.8rem", fontWeight: 700 }}>
              Presidente
            </div>
            <div style={{ fontSize: "0.72rem", color: "#64748b" }}>Comisión de Vigilancia</div>
          </div>

          <div style={{ textAlign: "center" }}>
            <div style={{ borderTop: "1px solid #0f172a", paddingTop: "0.3rem", fontSize: "0.8rem", fontWeight: 700 }}>
              Secretaria
            </div>
            <div style={{ fontSize: "0.72rem", color: "#64748b" }}>Comisión de Vigilancia</div>
          </div>

          <div style={{ textAlign: "center" }}>
            <div style={{ borderTop: "1px solid #0f172a", paddingTop: "0.3rem", fontSize: "0.8rem", fontWeight: 700 }}>
              Vocal I
            </div>
            <div style={{ fontSize: "0.72rem", color: "#64748b" }}>Comisión de Vigilancia</div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
