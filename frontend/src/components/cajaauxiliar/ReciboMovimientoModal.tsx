import { useEffect } from "react";
import { createPortal } from "react-dom";
import { formatoQ, CATEGORIAS_AUXILIAR } from "../../types";
import type { CajaMovimientoAuxiliar } from "../../types";

interface Props {
  movimiento: CajaMovimientoAuxiliar;
  onClose: () => void;
}

export default function ReciboMovimientoModal({ movimiento, onClose }: Props) {
  useEffect(() => {
    // Inject style into head to override @page from app.css reliably
    const styleEl = document.createElement("style");
    styleEl.innerHTML = `
      @media print {
        @page {
          size: 80mm auto;
          margin: 0;
        }
        body {
          margin: 0 !important;
          padding: 0 !important;
          background: #ffffff !important;
          color: #000000 !important;
        }
        #root, .no-print, .sidebar, .topbar, .screen-container {
          display: none !important;
        }
        .print-only {
          display: block !important;
        }
        .printable-ticket {
          display: block !important;
          width: 76mm;
          margin: 0 auto;
          padding: 5mm 2mm;
        }
      }
    `;
    document.head.appendChild(styleEl);

    let timer: ReturnType<typeof setTimeout>;
    
    // Auto-print upon rendering, with enough delay for DOM/CSSOM paint
    timer = setTimeout(() => {
      window.print();
      // Fallback for browsers where print() blocks and afterprint doesn't fire well
      // But we will primarily rely on the afterprint event if possible.
      // Actually, since afterprint can be flaky, we will do a double-check.
    }, 500);
    
    const handleAfterPrint = () => {
      onClose();
    };
    
    window.addEventListener("afterprint", handleAfterPrint);

    // Some browsers block on window.print(), some don't.
    // If it blocked, the line after window.print() executes when dialog closes.
    // To be safe and compatible with both, we can just use an interval to check if it's still focused,
    // but the cleanest way is `afterprint`. For Chrome desktop, print() blocks.
    // Let's ensure onClose is called when focus returns as a fallback.
    const handleFocus = () => {
      // If we got focus back, the print dialog is probably closed.
      // Give it a tiny delay to not clash with afterprint
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
  const modalContent = (
    <div className="print-only">
      {/* CONTENIDO DEL RECIBO TIPO TICKET */}
      <div className="printable-ticket print-only" style={{ fontFamily: "monospace", fontSize: "12px", lineHeight: "1.4", color: "#000" }}>
          <div style={{ textAlign: "center", marginBottom: "1rem" }}>
            <h2 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 800 }}>MIF COOP</h2>
            <div style={{ fontSize: "0.75rem" }}>Maya Inversiones Futuras R.L.</div>
            <div style={{ fontSize: "0.75rem", marginTop: "0.2rem" }}>
              Comprobante de Caja Auxiliar
            </div>
          </div>

          <div style={{ borderBottom: "1px dashed #ccc", paddingBottom: "0.5rem", marginBottom: "0.5rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Fecha:</span>
              <span>{fechaStr}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Hora:</span>
              <span>{horaStr}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Transacción:</span>
              <span>#{movimiento.contador}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Atendió:</span>
              <span>{movimiento.usuario_nombre}</span>
            </div>
          </div>

          <div style={{ borderBottom: "1px dashed #ccc", paddingBottom: "0.5rem", marginBottom: "0.5rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Beneficiario:</span>
              <span style={{ fontWeight: 600, textAlign: "right" }}>{movimiento.beneficiario || "Consumidor Final"}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Operación:</span>
              <span>{movimiento.tipo}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Sección:</span>
              <span>{movimiento.seccion}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem" }}>
              <span>Concepto:</span>
              <span style={{ textAlign: "right" }}>{categoriaInfo?.descripcion || movimiento.categoria}</span>
            </div>
            {movimiento.descripcion && (
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: "0.2rem" }}>
                <span>Detalle:</span>
                <span style={{ textAlign: "right", fontSize: "0.75rem" }}>{movimiento.descripcion}</span>
              </div>
            )}
            {movimiento.doc_no && (
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: "0.2rem" }}>
                <span>Documento:</span>
                <span>{movimiento.doc_no}</span>
              </div>
            )}
            {movimiento.referencia && (
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: "0.2rem" }}>
                <span>Referencia:</span>
                <span>{movimiento.referencia}</span>
              </div>
            )}
          </div>

          <div style={{ textAlign: "center", margin: "1rem 0" }}>
            <div style={{ fontSize: "1.4rem", fontWeight: 800 }}>
              {formatoQ(movimiento.monto)}
            </div>
          </div>

          <div style={{ textAlign: "center", marginTop: "2rem", fontSize: "0.75rem" }}>
            <p>___________________________________</p>
            <p>Firma Cliente / Socio</p>
          </div>
          
          <div style={{ textAlign: "center", marginTop: "1rem", fontSize: "0.7rem", color: "#666" }}>
            Gracias por confiar en nosotros.
            <br />
            Revise su comprobante, no se aceptan reclamos posteriores.
          </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
