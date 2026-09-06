import { useEffect } from "react";
import { formatearDPI, formatearQuetzales } from "../lib/formatters";

export interface DatosReciboCobro {
  numeroRecibo: string;
  fecha: string;
  hora?: string;
  socioNombre: string;
  socioNumero: string;
  socioDpi?: string | null;
  socioTelefono?: string | null;
  creditoCodigo: string;
  creditoTipo: string;
  agenciaNombre: string;
  saldoCapitalAnterior: number;
  abonoCapital: number;
  interes: number;
  mora: number;
  ahorroSobrePrestamo: number;
  totalPagado: number;
  saldoCapitalRestante: number;
  cuentaAspNumero?: string | null;
  saldoAspAcumulado?: number;
  cajeroNombre: string;
  formaPago?: string; // "EFECTIVO" | "DÉBITO DE CUENTA"
}

interface Props {
  datos: DatosReciboCobro;
  onClose: () => void;
}

export default function ReciboCobroCreditoModal({ datos, onClose }: Props) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  function handleImprimir() {
    window.print();
  }

  const horaStr = datos.hora || new Date().toLocaleTimeString("es-GT", { hour: "2-digit", minute: "2-digit" });

  return (
    <div
      className="recibo-modal-overlay"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.75)",
        zIndex: 9999,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "1rem",
        overflowY: "auto",
      }}
    >
      <div
        className="recibo-modal-card"
        style={{
          width: "100%",
          maxWidth: "540px",
          background: "var(--paper, #1e293b)",
          color: "var(--ink, #f8fafc)",
          borderRadius: "12px",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.6)",
          border: "1px solid var(--line, #334155)",
          padding: "1.5rem",
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* BARRA SUPERIOR CON ACCIONES */}
        <div
          className="no-print"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderBottom: "1px solid var(--line, #334155)",
            paddingBottom: "0.75rem",
            marginBottom: "1rem",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span style={{ fontSize: "1.2rem" }}>🧾</span>
            <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700 }}>
              Recibo Oficial de Cobro
            </h3>
          </div>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button
              type="button"
              className="btn"
              onClick={handleImprimir}
              style={{
                background: "#059669",
                borderColor: "#059669",
                padding: "0.4rem 0.85rem",
                fontSize: "0.85rem",
                display: "flex",
                alignItems: "center",
                gap: "0.35rem",
                fontWeight: 700,
              }}
            >
              🖨️ Imprimir
            </button>
            <button
              type="button"
              className="btn secondary"
              onClick={onClose}
              style={{ padding: "0.4rem 0.75rem", fontSize: "0.85rem" }}
            >
              Cerrar
            </button>
          </div>
        </div>

        {/* CONTENEDOR DEL COMPROBANTE IMPRIMIBLE */}
        <div
          id="recibo-imprimible"
          style={{
            background: "#ffffff",
            color: "#0f172a",
            padding: "1.5rem",
            borderRadius: "8px",
            border: "1px solid #cbd5e1",
            fontFamily: "system-ui, -apple-system, sans-serif",
            fontSize: "0.88rem",
            lineHeight: 1.4,
            overflowY: "auto",
          }}
        >
          {/* ENCABEZADO INSTITUCIONAL */}
          <div style={{ textAlign: "center", borderBottom: "2px dashed #94a3b8", paddingBottom: "0.75rem", marginBottom: "0.85rem" }}>
            <h2 style={{ margin: "0 0 0.15rem", fontSize: "1.15rem", fontWeight: 800, letterSpacing: "0.05em", color: "#065f46" }}>
              MIF COOP
            </h2>
            <div style={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", color: "#334155" }}>
              Maya Inversiones Futuras R.L.
            </div>
            <div style={{ fontSize: "0.78rem", color: "#475569", marginTop: "0.15rem" }}>
              {datos.agenciaNombre} · Sistema Integral MIF
            </div>
            <div
              style={{
                display: "inline-block",
                background: "#f1f5f9",
                padding: "0.2rem 0.65rem",
                borderRadius: "4px",
                fontWeight: 800,
                fontSize: "0.85rem",
                marginTop: "0.4rem",
                border: "1px solid #cbd5e1",
              }}
            >
              RECIBO NO. {datos.numeroRecibo}
            </div>
          </div>

          {/* DATOS DE FECHA Y SOCIO */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.4rem", fontSize: "0.8rem", marginBottom: "0.85rem", borderBottom: "1px solid #e2e8f0", paddingBottom: "0.6rem" }}>
            <div>
              <span style={{ color: "#64748b" }}>Fecha:</span> <strong>{datos.fecha}</strong>
            </div>
            <div style={{ textAlign: "right" }}>
              <span style={{ color: "#64748b" }}>Hora:</span> <strong>{horaStr}</strong>
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <span style={{ color: "#64748b" }}>Socio:</span> <strong>{datos.socioNombre}</strong>
            </div>
            <div>
              <span style={{ color: "#64748b" }}>No. Asociado:</span> <strong className="mono">{datos.socioNumero}</strong>
            </div>
            <div style={{ textAlign: "right" }}>
              <span style={{ color: "#64748b" }}>Crédito:</span> <strong className="mono">{datos.creditoCodigo}</strong> ({datos.creditoTipo})
            </div>
            {datos.socioDpi && (
              <div style={{ gridColumn: "1 / -1", fontSize: "0.76rem", color: "#64748b" }}>
                DPI: <span className="mono">{formatearDPI(datos.socioDpi)}</span>
                {datos.socioTelefono && <span> · Tel: {datos.socioTelefono}</span>}
              </div>
            )}
          </div>

          {/* DESGLOSE CONTABLE */}
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem", marginBottom: "0.85rem" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #94a3b8", textAlign: "left", color: "#475569", fontSize: "0.75rem", textTransform: "uppercase" }}>
                <th style={{ padding: "0.3rem 0" }}>Concepto</th>
                <th style={{ padding: "0.3rem 0", textAlign: "right" }}>Monto</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ padding: "0.35rem 0", color: "#1e293b" }}>Saldo Capital Anterior</td>
                <td style={{ padding: "0.35rem 0", textAlign: "right" }} className="mono">
                  {formatearQuetzales(datos.saldoCapitalAnterior)}
                </td>
              </tr>
              <tr style={{ borderTop: "1px solid #f1f5f9" }}>
                <td style={{ padding: "0.35rem 0", color: "#065f46", fontWeight: 600 }}>(-) Abono a Capital</td>
                <td style={{ padding: "0.35rem 0", textAlign: "right", color: "#065f46", fontWeight: 700 }} className="mono">
                  {formatearQuetzales(datos.abonoCapital)}
                </td>
              </tr>
              <tr style={{ borderTop: "1px solid #f1f5f9" }}>
                <td style={{ padding: "0.35rem 0", color: "#1e293b" }}>Interés Corriente</td>
                <td style={{ padding: "0.35rem 0", textAlign: "right" }} className="mono">
                  {formatearQuetzales(datos.interes)}
                </td>
              </tr>
              {datos.ahorroSobrePrestamo > 0 && (
                <tr style={{ borderTop: "1px solid #f1f5f9", background: "#f0fdf4" }}>
                  <td style={{ padding: "0.35rem 0.2rem", color: "#0369a1", fontWeight: 700 }}>
                    🛡️ Ahorro sobre Préstamo (Garantía)
                    {datos.cuentaAspNumero && (
                      <div style={{ fontSize: "0.7rem", fontWeight: 400, color: "#0284c7" }}>
                        Cta: {datos.cuentaAspNumero}
                      </div>
                    )}
                  </td>
                  <td style={{ padding: "0.35rem 0.2rem", textAlign: "right", color: "#0369a1", fontWeight: 700 }} className="mono">
                    {formatearQuetzales(datos.ahorroSobrePrestamo)}
                  </td>
                </tr>
              )}
              {datos.mora > 0 && (
                <tr style={{ borderTop: "1px solid #f1f5f9", color: "#dc2626" }}>
                  <td style={{ padding: "0.35rem 0", fontWeight: 600 }}>Recargo por Mora</td>
                  <td style={{ padding: "0.35rem 0", textAlign: "right", fontWeight: 700 }} className="mono">
                    {formatearQuetzales(datos.mora)}
                  </td>
                </tr>
              )}
              <tr style={{ borderTop: "2px solid #0f172a", borderBottom: "2px solid #0f172a" }}>
                <td style={{ padding: "0.5rem 0", fontWeight: 800, fontSize: "0.95rem" }}>
                  TOTAL RECIBIDO
                  {datos.formaPago && (
                    <span style={{ fontSize: "0.72rem", fontWeight: 500, color: "#64748b", marginLeft: "0.35rem" }}>
                      ({datos.formaPago})
                    </span>
                  )}
                </td>
                <td style={{ padding: "0.5rem 0", textAlign: "right", fontWeight: 800, fontSize: "1.05rem", color: "#0f172a" }} className="mono">
                  {formatearQuetzales(datos.totalPagado)}
                </td>
              </tr>
            </tbody>
          </table>

          {/* ESTADO ACTUAL DEL CRÉDITO Y CUENTAS */}
          <div
            style={{
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
              borderRadius: "6px",
              padding: "0.6rem 0.75rem",
              marginBottom: "1rem",
              fontSize: "0.8rem",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.25rem" }}>
              <span style={{ color: "#475569" }}>Nuevo Saldo Capital Deudor:</span>
              <strong className="mono" style={{ color: datos.saldoCapitalRestante === 0 ? "#15803d" : "#0f172a" }}>
                {formatearQuetzales(datos.saldoCapitalRestante)}
                {datos.saldoCapitalRestante === 0 && " (¡PAGADO TOTAL!)"}
              </strong>
            </div>
            {datos.saldoAspAcumulado !== undefined && (
              <div style={{ display: "flex", justifyContent: "space-between", color: "#0369a1", paddingTop: "0.25rem", borderTop: "1px dashed #cbd5e1" }}>
                <span>🛡️ Saldo Acumulado Ahorro sobre Préstamo:</span>
                <strong className="mono">{formatearQuetzales(datos.saldoAspAcumulado)}</strong>
              </div>
            )}
          </div>

          {/* FIRMAS */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", marginTop: "1.5rem", textAlign: "center", fontSize: "0.75rem" }}>
            <div>
              <div style={{ borderBottom: "1px solid #94a3b8", height: "35px" }} />
              <div style={{ marginTop: "0.35rem", fontWeight: 700 }}>{datos.socioNombre}</div>
              <div style={{ color: "#64748b" }}>Firma del Socio</div>
            </div>
            <div>
              <div style={{ borderBottom: "1px solid #94a3b8", height: "35px" }} />
              <div style={{ marginTop: "0.35rem", fontWeight: 700 }}>{datos.cajeroNombre || "Caja / Operador"}</div>
              <div style={{ color: "#64748b" }}>Cajero / Operador</div>
            </div>
          </div>

          {/* PIE DE PÁGINA */}
          <div style={{ textAlign: "center", marginTop: "1rem", fontSize: "0.72rem", color: "#64748b", borderTop: "1px dotted #cbd5e1", paddingTop: "0.5rem" }}>
            Este comprobante certifica la amortización y el aporte de ahorro correspondiente.
            <br />
            <em>¡Gracias por su puntualidad en MIF COOP!</em>
          </div>
        </div>

        {/* ESTILOS DE IMPRESIÓN */}
        <style>{`
          @media print {
            body * {
              visibility: hidden;
            }
            .recibo-modal-overlay {
              position: static !important;
              background: transparent !important;
              padding: 0 !important;
              display: block !important;
            }
            .recibo-modal-card {
              max-width: 100% !important;
              border: none !important;
              box-shadow: none !important;
              padding: 0 !important;
              background: #ffffff !important;
            }
            #recibo-imprimible, #recibo-imprimible * {
              visibility: visible;
            }
            #recibo-imprimible {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
              max-width: 80mm;
              margin: 0 auto;
              padding: 8px;
              border: none !important;
            }
            .no-print {
              display: none !important;
            }
          }
        `}</style>
      </div>
    </div>
  );
}
