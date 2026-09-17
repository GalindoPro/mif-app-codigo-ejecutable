import { useEffect } from "react";
import type { Prestamo } from "../types";
import { formatearDPI, formatearQuetzales } from "../lib/formatters";

interface Props {
  prestamo: Prestamo;
  onClose: () => void;
}

function numeroALetras(num: number): string {
  // Conversión simple y robusta a texto en Quetzales
  const enteros = Math.floor(num);
  const centavos = Math.round((num - enteros) * 100);
  const centavosStr = `${centavos.toString().padStart(2, "0")}/100`;

  const unidades = ["", "UN", "DOS", "TRES", "CUATRO", "CINCO", "SEIS", "SIETE", "OCHO", "NUEVE"];
  const decenas = ["", "DIEZ", "VEINTE", "TREINTA", "CUARENTA", "CINCUENTA", "SESENTA", "SETENTA", "OCHENTA", "NOVENTA"];
  const especiales: Record<number, string> = {
    11: "ONCE", 12: "DOCE", 13: "TRECE", 14: "CATORCE", 15: "QUINCE",
    16: "DIECISÉIS", 17: "DIECISIETE", 18: "DIECIOCHO", 19: "DIECINUEVE",
    21: "VEINTIÚN", 22: "VEINTIDÓS", 23: "VEINTITRÉS", 24: "VEINTICUATRO", 25: "VEINTICINCO",
    26: "VEINTISÉIS", 27: "VEINTISIETE", 28: "VEINTIOCHO", 29: "VEINTINUEVE"
  };
  const centenas = ["", "CIENTO", "DOSCIENTOS", "TRESCIENTOS", "CUATROCIENTOS", "QUINIENTOS", "SEISCIENTOS", "SETECIENTOS", "OCHOCIENTOS", "NOVECIENTOS"];

  function convertirGrupo(n: number): string {
    if (n === 0) return "";
    if (n === 100) return "CIEN";
    let res = "";
    const c = Math.floor(n / 100);
    const d = Math.floor((n % 100) / 10);
    const u = n % 10;
    const du = n % 100;

    if (c > 0) res += centenas[c] + " ";
    if (especiales[du]) {
      res += especiales[du] + " ";
    } else {
      if (d > 0) {
        res += decenas[d];
        if (u > 0) res += " Y " + unidades[u] + " ";
        else res += " ";
      } else if (u > 0) {
        res += unidades[u] + " ";
      }
    }
    return res.trim();
  }

  if (enteros === 0) return `CERO QUETZALES CON ${centavosStr}`;

  let texto = "";
  const miles = Math.floor(enteros / 1000);
  const resto = enteros % 1000;

  if (miles > 0) {
    if (miles === 1) texto += "MIL ";
    else texto += convertirGrupo(miles) + " MIL ";
  }
  if (resto > 0) {
    texto += convertirGrupo(resto) + " ";
  }

  return `${texto.trim()} QUETZALES CON ${centavosStr} CENTAVOS (Q ${num.toLocaleString("es-GT", { minimumFractionDigits: 2, maximumFractionDigits: 2 })})`;
}

export default function ContratoPagareCreditoModal({ prestamo, onClose }: Props) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const monto = Number(prestamo.monto_aprobado ?? prestamo.monto_solicitado);
  const tasaMensual = Number(prestamo.tasa_interes_mensual || 2.0);
  const tasaAnual = tasaMensual * 12;
  const fechaHoy = new Date().toLocaleDateString("es-GT", { day: "2-digit", month: "long", year: "numeric" });
  const origen = prestamo.origen_fondos || "FONDOS_PROPIOS";

  let clausulaFuente = "Los recursos del presente crédito provienen de FONDOS PROPIOS INSTITUCIONALES de la COOPERATIVA MAYA INVERSIONES FUTURAS R.L. \"COMIF R.L.\".";
  let institucionFuente = "COOP COMIF R.L. (Fondos Propios)";
  if (origen === "FEDERURAL") {
    clausulaFuente = "Los recursos del presente crédito corresponden a la LÍNEA DE FINANCIAMIENTO Y DESARROLLO RURAL DE FEDERURAL, administrados y colocados bajo la supervisión operativa de COOP COMIF R.L.";
    institucionFuente = "FEDERURAL - Federación de Cooperativas de Desarrollo Rural";
  } else if (origen === "CHN_GUATEMALA") {
    clausulaFuente = "Los recursos del presente crédito son canalizados a través del programa de intermediación financiera con el CRÉDITO HIPOTECARIO NACIONAL DE GUATEMALA (CHN), sujetos a las normativas bancarias de fondeo correspondientes.";
    institucionFuente = "CHN (El Crédito Hipotecario Nacional de Guatemala)";
  }

  return (
    <div
      className="contrato-modal-overlay"
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
        className="contrato-modal-card"
        style={{
          width: "100%",
          maxWidth: "800px",
          background: "var(--paper, #1e293b)",
          color: "var(--ink, #f8fafc)",
          borderRadius: "12px",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.6)",
          border: "1px solid var(--line, #334155)",
          padding: "1.5rem",
          maxHeight: "92vh",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* BARRA SUPERIOR CON BOTONES */}
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
            <span style={{ fontSize: "1.3rem" }}>📜</span>
            <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700 }}>
              Pagaré Libre de Protesto y Contrato de Mutuo
            </h3>
          </div>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button
              type="button"
              className="btn"
              onClick={() => window.print()}
              style={{
                background: "#059669",
                borderColor: "#059669",
                padding: "0.4rem 0.9rem",
                fontSize: "0.85rem",
                display: "flex",
                alignItems: "center",
                gap: "0.4rem",
                fontWeight: 700,
              }}
            >
              🖨️ Imprimir Contrato
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

        {/* CONTENEDOR DEL CONTRATO LEGAL IMPRIMIBLE */}
        <div
          id="contrato-imprimible"
          style={{
            background: "#ffffff",
            color: "#0f172a",
            padding: "2.2rem 2.5rem",
            borderRadius: "8px",
            border: "1px solid #cbd5e1",
            fontFamily: "Georgia, serif, system-ui",
            fontSize: "0.88rem",
            lineHeight: 1.6,
            overflowY: "auto",
          }}
        >
          {/* ENCABEZADO INSTITUCIONAL */}
          <div style={{ textAlign: "center", borderBottom: "2px solid #0f172a", paddingBottom: "1rem", marginBottom: "1.25rem" }}>
            <h1 style={{ margin: "0 0 0.2rem", fontSize: "1.35rem", fontWeight: 800, letterSpacing: "0.05em", color: "#065f46" }}>
              COOPERATIVA MAYA INVERSIONES FUTURAS R.L. &quot;COMIF R.L.&quot;
            </h1>
            <div style={{ fontSize: "0.8rem", fontWeight: 700, textTransform: "uppercase", color: "#475569" }}>
              {prestamo.agencia_nombre || "Agencia Central"} · República de Guatemala
            </div>
            <div
              style={{
                display: "inline-block",
                background: "#f1f5f9",
                padding: "0.3rem 0.8rem",
                borderRadius: "6px",
                fontWeight: 800,
                fontSize: "0.95rem",
                marginTop: "0.6rem",
                border: "1px solid #cbd5e1",
              }}
            >
              PAGARÉ LIBRE DE PROTESTO NO. {prestamo.codigo}
            </div>
          </div>

          {/* VALOR Y FECHA */}
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1.2rem", fontWeight: 700, fontSize: "0.92rem" }}>
            <div>
              POR: <span style={{ color: "#065f46" }}>{formatearQuetzales(monto)}</span>
            </div>
            <div>
              LUGAR Y FECHA: <span style={{ textTransform: "uppercase" }}>{prestamo.agencia_nombre ?? "Guatemala"}, {fechaHoy}</span>
            </div>
          </div>

          {/* TEXTO LEGAL DEL PAGARÉ */}
          <p style={{ textAlign: "justify", textIndent: "1.5rem", margin: "0 0 1rem" }}>
            Yo, <strong>{prestamo.socio_nombres}</strong>, de {prestamo.socio_direccion ? `con residencia en ${prestamo.socio_direccion}, ` : ""}
            quien me identifico con el Documento Personal de Identificación (DPI) con Código Único de Identificación (CUI) número{" "}
            <strong>{prestamo.socio_dpi ? formatearDPI(prestamo.socio_dpi) : "____________________"}</strong>,
            actuando en calidad de socio deudor con Registro No. <strong>{prestamo.numero_asociado ?? "—"}</strong>;
            por el presente <strong>PAGARÉ LIBRE DE PROTESTO</strong> prometo incondicionalmente pagar a la orden de la{" "}
            <strong>COOPERATIVA MAYA INVERSIONES FUTURAS R.L. &quot;COMIF R.L.&quot;</strong> la suma principal de{" "}
            <strong>{numeroALetras(monto)}</strong>.
          </p>

          <p style={{ textAlign: "justify", textIndent: "1.5rem", margin: "0 0 1rem" }}>
            <strong>PRIMERA (PLAZO Y AMORTIZACIÓN):</strong> El plazo convenido para la amortización total del presente crédito es de{" "}
            <strong>{prestamo.plazo_meses} MESES</strong> calendario, pagaderos mediante cuotas periódicas mensuales de{" "}
            <strong>{formatearQuetzales(prestamo.cuota_mensual)}</strong>, calculadas bajo el régimen de{" "}
            <strong>{prestamo.tipo_amortizacion === "CUOTA_NIVELADA" ? "CUOTA FIJA NIVELADA" : "AMORTIZACIÓN SOBRE SALDOS DEUDORES"}</strong>.
          </p>

          <p style={{ textAlign: "justify", textIndent: "1.5rem", margin: "0 0 1rem" }}>
            <strong>SEGUNDA (TASA DE INTERÉS Y MORA):</strong> La suma mutuada devengará un interés ordinario mensual del{" "}
            <strong>{tasaMensual.toFixed(2)}%</strong> ({tasaAnual.toFixed(2)}% anual) calculado sobre saldos exactos diarios (base 365 días). En caso de mora superior al período de gracia de cuatro (4) días, el deudor reconocerá un recargo administrativo fijo de <strong>VEINTICINCO QUETZALES (Q 25.00)</strong> por cada cuota vencida.
          </p>

          {/* CLÁUSULA ESPECIAL DE ORIGEN DE FONDOS */}
          <div
            style={{
              background: "#f0fdf4",
              borderLeft: "4px solid #059669",
              padding: "0.75rem 1rem",
              margin: "1rem 0",
              borderRadius: "0 6px 6px 0",
            }}
          >
            <strong style={{ color: "#065f46", textTransform: "uppercase", fontSize: "0.85rem" }}>
              TERCERA (ORIGEN Y FUENTE DE LOS FONDOS):
            </strong>
            <p style={{ margin: "0.25rem 0 0", fontSize: "0.86rem", color: "#1e293b", textAlign: "justify" }}>
              {clausulaFuente} Fuente acreditada: <strong>{institucionFuente}</strong>. El socio deudor declara bajo juramento que los fondos otorgados serán destinados exclusivamente para: <em>{prestamo.destino || "Capital de trabajo / Actividades lícitas de comercio"}</em>.
            </p>
          </div>

          <p style={{ textAlign: "justify", textIndent: "1.5rem", margin: "0 0 1rem" }}>
            <strong>CUARTA (GARANTÍA Y AHORRO EN RESPALDO):</strong> El presente título se respalda con garantía{" "}
            <strong>{prestamo.tipo === "FIDUCIARIO" ? "FIDUCIARIA SOLIDARIA Y MANCOMUNADA" : "HIPOTECARIA PREFERENTE"}</strong>
            {prestamo.tipo === "FIDUCIARIO" && prestamo.nombre_fiador
              ? `, constituyéndose formalmente como Fiador Mancomunado y Solidario a ${prestamo.nombre_fiador}${prestamo.dpi_fiador ? `, con DPI No. ${formatearDPI(prestamo.dpi_fiador)}` : ""}${prestamo.telefono_fiador ? `, Tel. ${prestamo.telefono_fiador}` : ""}`
              : prestamo.tipo === "HIPOTECARIO" && prestamo.garantia
                ? `, gravando la propiedad descrita como: ${prestamo.garantia}`
                : ""}
            . Asimismo, el socio autoriza constituir retención o depósito en su cuenta de <strong>Ahorro sobre Préstamo</strong> como fondo pignoraticio en garantía institucional de cumplimiento.
          </p>

          <p style={{ textAlign: "justify", textIndent: "1.5rem", margin: "0 0 1.5rem" }}>
            <strong>QUINTA (RENUNCIA AL FUERO Y EJECUCIÓN):</strong> Para los efectos legales del presente título, los otorgantes renuncian expresamente al fuero de su domicilio y se someten a los tribunales competentes de la República de Guatemala que elija la cooperativa acreedora, aceptando desde ya como buenas, líquidas, exigibles y de plazo vencido las cuentas que se le formulen.
          </p>

          {/* ÁREA DE FIRMAS FORMALES */}
          <div style={{ marginTop: "2.5rem", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem", textAlign: "center", fontSize: "0.78rem" }}>
            <div>
              <div style={{ borderBottom: "1px solid #0f172a", height: "45px" }} />
              <div style={{ marginTop: "0.4rem", fontWeight: 700, fontSize: "0.85rem" }}>{prestamo.socio_nombres}</div>
              <div style={{ color: "#475569" }}>Deudor Principal (Socio No. {prestamo.numero_asociado ?? "—"})</div>
              <div style={{ color: "#64748b", fontSize: "0.72rem" }}>DPI: {prestamo.socio_dpi ? formatearDPI(prestamo.socio_dpi) : "____________________"}</div>
            </div>

            <div>
              <div style={{ borderBottom: "1px solid #0f172a", height: "45px" }} />
              <div style={{ marginTop: "0.4rem", fontWeight: 700, fontSize: "0.85rem" }}>
                {prestamo.tipo === "FIDUCIARIO" ? prestamo.nombre_fiador || "Fiador Solidario" : "Autorización Comité de Créditos"}
              </div>
              <div style={{ color: "#475569" }}>
                {prestamo.tipo === "FIDUCIARIO" ? "Fiador Mancomunado y Solidario" : "Comité de Crédito / Gerencia"}
              </div>
              {prestamo.tipo === "FIDUCIARIO" && prestamo.dpi_fiador && (
                <div style={{ color: "#64748b", fontSize: "0.72rem" }}>DPI: {formatearDPI(prestamo.dpi_fiador)}</div>
              )}
            </div>

            <div style={{ marginTop: "1rem" }}>
              <div style={{ borderBottom: "1px solid #0f172a", height: "45px" }} />
              <div style={{ marginTop: "0.4rem", fontWeight: 700, fontSize: "0.85rem" }}>{prestamo.promotor_nombre || "Promotor Asignado"}</div>
              <div style={{ color: "#475569" }}>Promotor de Crédito / Dictamen</div>
            </div>

            <div style={{ marginTop: "1rem" }}>
              <div style={{ borderBottom: "1px solid #0f172a", height: "45px" }} />
              <div style={{ marginTop: "0.4rem", fontWeight: 700, fontSize: "0.85rem" }}>Gerencia / Administración COOP COMIF R.L.</div>
              <div style={{ color: "#475569" }}>Vo.Bo. Representante Legal</div>
            </div>
          </div>

          <div style={{ textAlign: "center", marginTop: "2rem", fontSize: "0.72rem", color: "#64748b", borderTop: "1px dotted #cbd5e1", paddingTop: "0.6rem" }}>
            Documento emitido formalmente por el Sistema Integral de COOP COMIF R.L. · Impreso el {fechaHoy}
          </div>
        </div>

        {/* ESTILOS DE IMPRESIÓN */}
        <style>{`
          @media print {
            body * {
              visibility: hidden;
            }
            .contrato-modal-overlay {
              position: static !important;
              background: transparent !important;
              padding: 0 !important;
              display: block !important;
            }
            .contrato-modal-card {
              max-width: 100% !important;
              border: none !important;
              box-shadow: none !important;
              padding: 0 !important;
              background: #ffffff !important;
            }
            #contrato-imprimible, #contrato-imprimible * {
              visibility: visible;
            }
            #contrato-imprimible {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
              margin: 0;
              padding: 15mm 20mm;
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
