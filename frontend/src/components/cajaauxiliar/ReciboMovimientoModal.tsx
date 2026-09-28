import { useEffect } from "react";
import { createPortal } from "react-dom";
import { formatoQ, CATEGORIAS_AUXILIAR } from "../../types";
import type { CajaMovimientoAuxiliar } from "../../types";
import { numeroALetras } from "../../lib/formatters";

interface Props {
  movimiento: CajaMovimientoAuxiliar;
  onClose: () => void;
}

export default function ReciboMovimientoModal({ movimiento, onClose }: Props) {
  useEffect(() => {
    // Inyectar estilos para impresión limpia en Hoja Carta (Media Carta Duplicado)
    const styleEl = document.createElement("style");
    styleEl.innerHTML = `
      @media print {
        @page {
          size: letter portrait;
          margin: 6mm 10mm;
        }
        body {
          margin: 0 !important;
          padding: 0 !important;
          background: #ffffff !important;
          color: #000000 !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        #root, .no-print, .sidebar, .topbar, .screen-container {
          display: none !important;
        }
        .print-only {
          display: block !important;
        }
        .recibo-duplicado-pagina {
          display: flex !important;
          flex-direction: column !important;
          justify-content: space-between !important;
          height: 98vh !important;
          box-sizing: border-box !important;
        }
        .recibo-bloque-media-carta {
          border: 1.5px solid #0f172a;
          border-radius: 6px;
          padding: 5mm 6mm;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
          font-size: 8.5pt;
          line-height: 1.3;
          color: #000000;
          box-sizing: border-box;
          background: #ffffff;
        }
        .linea-corte-talon {
          text-align: center;
          font-size: 7pt;
          font-weight: 700;
          color: #475569;
          margin: 3mm 0;
          border-top: 1.5px dashed #64748b;
          padding-top: 1mm;
          letter-spacing: 2px;
        }
      }
    `;
    document.head.appendChild(styleEl);

    let timer: ReturnType<typeof setTimeout>;

    // Auto-imprimir tras montaje
    timer = setTimeout(() => {
      window.print();
    }, 400);

    const handleAfterPrint = () => {
      onClose();
    };

    window.addEventListener("afterprint", handleAfterPrint);

    const handleFocus = () => {
      setTimeout(() => onClose(), 1000);
    };
    window.addEventListener("focus", handleFocus);

    return () => {
      clearTimeout(timer);
      document.head.removeChild(styleEl);
      window.removeEventListener("afterprint", handleAfterPrint);
      window.removeEventListener("focus", handleFocus);
    };
  }, [onClose]);

  const horaStr = new Date(movimiento.created_at).toLocaleTimeString("es-GT", { hour: "2-digit", minute: "2-digit" });
  const fechaStr = new Date(movimiento.created_at).toLocaleDateString("es-GT");
  const categoriaInfo = CATEGORIAS_AUXILIAR[movimiento.categoria];
  const montoNum = Number(movimiento.monto) || 0;
  const montoEnLetras = numeroALetras(montoNum);
  const esIngreso = movimiento.tipo === "INGRESO";

  // Subcomponente que dibuja un tanto de Media Carta
  function renderReciboTanto(tipoCopia: string, esOriginal: boolean) {
    return (
      <div className="recibo-bloque-media-carta" style={{ border: "1.5px solid #0f172a", borderRadius: "6px", padding: "0.6rem 0.8rem", background: "#ffffff", color: "#000000" }}>
        {/* Encabezado Institucional */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "1.5px solid #0f172a", paddingBottom: "0.35rem", marginBottom: "0.4rem" }}>
          <div>
            <div style={{ fontSize: "0.95rem", fontWeight: 900, color: "#0f172a", letterSpacing: "-0.01em" }}>
              COOPERATIVA MAYA INVERSIONES FUTURAS R.L.
            </div>
            <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#0284c7" }}>
              "COMIF-R.L." · AGENCIA CHAJUL
            </div>
            <div style={{ fontSize: "0.72rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.5px", marginTop: "0.1rem" }}>
              Comprobante Oficial de Caja Auxiliar
            </div>
          </div>

          <div style={{ textAlign: "right" }}>
            <span
              style={{
                display: "inline-block",
                padding: "0.15rem 0.5rem",
                borderRadius: "4px",
                fontSize: "0.68rem",
                fontWeight: 800,
                border: "1px solid #0f172a",
                background: esOriginal ? "#f8fafc" : "#f1f5f9",
                color: "#0f172a",
              }}
            >
              {tipoCopia}
            </span>
            <div style={{ fontSize: "0.72rem", fontFamily: "'IBM Plex Mono', monospace", marginTop: "0.2rem" }}>
              <strong>Transacción:</strong> #{movimiento.contador}
            </div>
            <div style={{ fontSize: "0.7rem", color: "#475569" }}>
              {fechaStr} · {horaStr}
            </div>
          </div>
        </div>

        {/* Datos Principales en 2 Columnas Balanceadas */}
        <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: "0.6rem", fontSize: "0.76rem", marginBottom: "0.4rem" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.2rem" }}>
            <div>
              <span style={{ color: "#475569" }}>Asociado / Beneficiario:</span>
              <div style={{ fontWeight: 800, fontSize: "0.84rem", color: "#0f172a" }}>
                {movimiento.beneficiario || "Consumidor Final"}
              </div>
            </div>
            <div style={{ display: "flex", gap: "0.3rem" }}>
              <span style={{ color: "#475569" }}>Operación:</span>
              <strong style={{ color: esIngreso ? "#15803d" : "#b91c1c" }}>
                {esIngreso ? "🟢 ENTRADA / DEPÓSITO" : "🔴 SALIDA / RETIRO"}
              </strong>
            </div>
            <div style={{ display: "flex", gap: "0.3rem" }}>
              <span style={{ color: "#475569" }}>Concepto:</span>
              <strong>{categoriaInfo?.descripcion || movimiento.categoria}</strong>
            </div>
            {movimiento.referencia && (
              <div style={{ display: "flex", gap: "0.3rem" }}>
                <span style={{ color: "#475569" }}>Cuenta / Libreta:</span>
                <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontWeight: 700 }}>
                  {movimiento.referencia}
                </span>
              </div>
            )}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.2rem", borderLeft: "1px solid #e2e8f0", paddingLeft: "0.6rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "#475569" }}>Atendió:</span>
              <span style={{ fontWeight: 600 }}>{movimiento.usuario_nombre}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "#475569" }}>Agencia Operación:</span>
              <span>{movimiento.agencia_nombre || "Agencia Chajul"}</span>
            </div>
            {movimiento.agencia_origen_nombre && (
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#475569" }}>Agencia Origen:</span>
                <span style={{ fontWeight: 700 }}>{movimiento.agencia_origen_nombre}</span>
              </div>
            )}
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "#475569" }}>
                {movimiento.seccion === "BI" ? "No. de Cuenta:" : "Recibo Físico / Doc:"}
              </span>
              <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontWeight: 700 }}>
                {movimiento.doc_no || "—"}
              </span>
            </div>
          </div>
        </div>

        {/* Tarjeta Destacada de Monto en Números y Letras */}
        <div
          style={{
            background: "#f8fafc",
            border: "1px solid #cbd5e1",
            borderRadius: "5px",
            padding: "0.35rem 0.6rem",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "0.45rem",
          }}
        >
          <div>
            <div style={{ fontSize: "0.68rem", color: "#64748b", textTransform: "uppercase", fontWeight: 700 }}>
              Monto en Letras:
            </div>
            <div style={{ fontSize: "0.74rem", fontWeight: 800, color: "#0f172a" }}>
              {montoEnLetras}
            </div>
            {movimiento.descripcion && (
              <div style={{ fontSize: "0.68rem", color: "#475569", marginTop: "0.1rem" }}>
                Detalle: {movimiento.descripcion}
              </div>
            )}
          </div>

          <div style={{ textAlign: "right" }}>
            <span style={{ fontSize: "0.68rem", color: "#64748b", textTransform: "uppercase", fontWeight: 700 }}>
              Total Operado:
            </span>
            <div
              style={{
                fontSize: "1.25rem",
                fontWeight: 900,
                fontFamily: "'IBM Plex Mono', monospace",
                color: esIngreso ? "#15803d" : "#b91c1c",
              }}
            >
              {formatoQ(movimiento.monto)}
            </div>
          </div>
        </div>

        {/* Firmas Institucionales */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem", marginTop: "1rem", textAlign: "center", fontSize: "0.72rem" }}>
          <div>
            <div style={{ borderBottom: "1px solid #0f172a", height: "24px", marginBottom: "0.2rem" }} />
            <div style={{ fontWeight: 700, color: "#0f172a" }}>Firma Cajero(a) Receptor</div>
            <div style={{ fontSize: "0.66rem", color: "#64748b" }}>{movimiento.usuario_nombre}</div>
          </div>

          <div>
            <div style={{ borderBottom: "1px solid #0f172a", height: "24px", marginBottom: "0.2rem" }} />
            <div style={{ fontWeight: 700, color: "#0f172a" }}>Firma Asociado / Cliente</div>
            <div style={{ fontSize: "0.66rem", color: "#64748b" }}>{movimiento.beneficiario || "Firma de conformidad"}</div>
          </div>
        </div>

        {/* Pie Legal */}
        <div style={{ textAlign: "center", fontSize: "0.64rem", color: "#64748b", marginTop: "0.4rem", borderTop: "1px solid #f1f5f9", paddingTop: "0.2rem" }}>
          Revise su comprobante al momento de la operación. No se aceptan reclamos posteriores. · COOP COMIF R.L.
        </div>
      </div>
    );
  }

  const modalContent = (
    <div className="print-only">
      {/* Contenedor que agrupa el Original arriba y la Copia abajo en 1 sola hoja carta */}
      <div className="recibo-duplicado-pagina print-only">
        {/* 1. ORIGINAL: ASOCIADO (Mitad Superior) */}
        {renderReciboTanto("ORIGINAL — ASOCIADO / CLIENTE", true)}

        {/* Línea Divisoria de Corte */}
        <div className="linea-corte-talon">
          - - - - - - - - - - - - - - - - - - - - - - - - - ✂ CORTAR AQUÍ (TALÓN DUPLICADO) ✂ - - - - - - - - - - - - - - - - - - - - - - - - -
        </div>

        {/* 2. COPIA: ARCHIVO DE CAJA / CONTABILIDAD (Mitad Inferior) */}
        {renderReciboTanto("COPIA — ARCHIVO DE CAJA / CONTABILIDAD", false)}
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
