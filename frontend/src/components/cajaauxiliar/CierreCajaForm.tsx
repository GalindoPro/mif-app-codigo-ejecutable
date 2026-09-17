import { useState } from "react";
import { api, mensajeError } from "../../lib/api";
import {
  DENOMINACIONES_GT,
  formatoQ,
  labelDenominacion,
} from "../../types";

export interface DenominacionRowProps {
  valor: number;
  cantidad: string;
  onCambiar: (v: string) => void;
}

export function DenominacionRow({
  valor,
  cantidad,
  onCambiar,
}: DenominacionRowProps) {
  const subtotal = valor * Number(cantidad || 0);
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "0.5rem",
        padding: "0.35rem 0.6rem",
        borderRadius: "6px",
        background: Number(cantidad || 0) > 0 ? "rgba(2, 132, 199, 0.08)" : "var(--mono-bg)",
        border: Number(cantidad || 0) > 0 ? "1px solid rgba(2, 132, 199, 0.3)" : "1px solid var(--line)",
        marginBottom: "0.35rem",
        transition: "all 0.15s ease",
      }}
    >
      <span
        className="mono"
        style={{
          fontWeight: 700,
          fontSize: "0.85rem",
          minWidth: "62px",
          color: "var(--ink)",
        }}
      >
        {labelDenominacion(valor)}
      </span>
      <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
        <span style={{ fontSize: "0.75rem", color: "var(--ink-soft)" }}>×</span>
        <input
          type="number"
          min="0"
          step="1"
          value={cantidad}
          onChange={(e) => onCambiar(e.target.value)}
          onFocus={(e) => e.target.select()}
          style={{
            width: "84px",
            padding: "0.3rem 0.5rem",
            fontSize: "0.9rem",
            fontWeight: 700,
            textAlign: "right",
            borderRadius: "6px",
            border: "1px solid var(--line)",
            background: "var(--paper)",
          }}
          placeholder="0"
        />
      </div>
      <span
        className="mono"
        style={{
          fontWeight: 700,
          fontSize: "0.85rem",
          minWidth: "95px",
          textAlign: "right",
          color: subtotal > 0 ? "#059669" : "var(--ink-soft)",
        }}
      >
        {formatoQ(subtotal)}
      </span>
    </div>
  );
}

export interface CierreCajaFormProps {
  diaId: string;
  saldoEsperado: number;
  onCerrada: () => void;
}

export default function CierreCajaForm({
  diaId,
  saldoEsperado,
  onCerrada,
}: CierreCajaFormProps) {
  const [cantidades, setCantidades] = useState<Record<number, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  const totalContado = Math.round(
    DENOMINACIONES_GT.reduce((acc, d) => acc + d * Number(cantidades[d] || 0), 0) * 100
  ) / 100;
  const diferencia = Math.round((totalContado - saldoEsperado) * 100) / 100;
  const estaCuadrada = Math.abs(diferencia) < 0.001;

  async function cerrar() {
    setError(null);
    setGuardando(true);
    try {
      const conteo = DENOMINACIONES_GT.map((valor) => ({ valor, cantidad: Number(cantidades[valor] || 0) }));
      await api.post(`/caja-auxiliar/${diaId}/cerrar`, { conteo });
      onCerrada();
    } catch (err) {
      setError(mensajeError(err));
    } finally {
      setGuardando(false);
    }
  }

  const billetes = DENOMINACIONES_GT.filter((d) => d >= 5);
  const monedas = DENOMINACIONES_GT.filter((d) => d < 5);

  const totalBilletes = Math.round(
    billetes.reduce((acc, d) => acc + d * Number(cantidades[d] || 0), 0) * 100
  ) / 100;

  const totalMonedas = Math.round(
    monedas.reduce((acc, d) => acc + d * Number(cantidades[d] || 0), 0) * 100
  ) / 100;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem", width: "100%" }}>
      {/* CABECERA INFORMATIVA */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "0.5rem" }}>
        <div>
          <h2 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 800, letterSpacing: "-0.01em" }}>
            🪙 Conteo Físico de Efectivo (Arqueo de Cierre)
          </h2>
          <p style={{ margin: "0.2rem 0 0", fontSize: "0.8rem", color: "var(--ink-soft)" }}>
            Ingresa el conteo físico de cada denominación para cuadrar con el saldo del libro de caja.
          </p>
        </div>
      </div>

      {/* CUADRÍCULA BILLETES Y MONEDAS EN 2 COLUMNAS AMPLIAS */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1rem" }}>
        {/* COLUMNA BILLETES */}
        <div
          style={{
            background: "var(--paper-raised)",
            border: "1px solid var(--line)",
            borderRadius: "8px",
            padding: "0.85rem",
            boxShadow: "var(--shadow)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.6rem", borderBottom: "1px solid var(--line)", paddingBottom: "0.4rem" }}>
            <span style={{ fontWeight: 700, fontSize: "0.88rem", display: "flex", alignItems: "center", gap: "0.35rem" }}>
              💵 Billetes (Q 200 a Q 5)
            </span>
            <span className="mono" style={{ fontSize: "0.82rem", fontWeight: 700, color: totalBilletes > 0 ? "#059669" : "var(--ink-soft)" }}>
              Subtotal: {formatoQ(totalBilletes)}
            </span>
          </div>

          {billetes.map((d) => (
            <DenominacionRow
              key={d}
              valor={d}
              cantidad={cantidades[d] ?? ""}
              onCambiar={(v) => setCantidades((c) => ({ ...c, [d]: v }))}
            />
          ))}
        </div>

        {/* COLUMNA MONEDAS */}
        <div
          style={{
            background: "var(--paper-raised)",
            border: "1px solid var(--line)",
            borderRadius: "8px",
            padding: "0.85rem",
            boxShadow: "var(--shadow)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.6rem", borderBottom: "1px solid var(--line)", paddingBottom: "0.4rem" }}>
            <span style={{ fontWeight: 700, fontSize: "0.88rem", display: "flex", alignItems: "center", gap: "0.35rem" }}>
              🪙 Monedas (Q 1 a 1 ctv.)
            </span>
            <span className="mono" style={{ fontSize: "0.82rem", fontWeight: 700, color: totalMonedas > 0 ? "#059669" : "var(--ink-soft)" }}>
              Subtotal: {formatoQ(totalMonedas)}
            </span>
          </div>

          {monedas.map((d) => (
            <DenominacionRow
              key={d}
              valor={d}
              cantidad={cantidades[d] ?? ""}
              onCambiar={(v) => setCantidades((c) => ({ ...c, [d]: v }))}
            />
          ))}
        </div>
      </div>

      {/* 3 TARJETAS RESUMEN DE ALTA VISIBILIDAD (SIN TRUNCAMIENTO Y 2 DECIMALES EXACTOS) */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "0.75rem",
          width: "100%",
        }}
      >
        <div
          style={{
            background: "var(--paper-raised)",
            border: "1px solid var(--line)",
            borderRadius: "8px",
            padding: "0.75rem 1rem",
            display: "flex",
            flexDirection: "column",
            gap: "0.2rem",
          }}
        >
          <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--ink-soft)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
            TOTAL CONTADO (FÍSICO)
          </span>
          <span
            className="mono"
            style={{
              fontSize: "clamp(1.1rem, 1.4vw, 1.35rem)",
              fontWeight: 800,
              color: "var(--ink)",
              whiteSpace: "nowrap",
            }}
          >
            {formatoQ(totalContado)}
          </span>
          <span style={{ fontSize: "0.72rem", color: "var(--ink-soft)" }}>
            Billetes ({formatoQ(totalBilletes)}) + Monedas ({formatoQ(totalMonedas)})
          </span>
        </div>

        <div
          style={{
            background: "var(--paper-raised)",
            border: "1px solid rgba(2, 132, 199, 0.4)",
            borderLeft: "4px solid #0284c7",
            borderRadius: "8px",
            padding: "0.75rem 1rem",
            display: "flex",
            flexDirection: "column",
            gap: "0.2rem",
          }}
        >
          <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--ink-soft)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
            SALDO ESPERADO (LIBRO)
          </span>
          <span
            className="mono"
            style={{
              fontSize: "clamp(1.1rem, 1.4vw, 1.35rem)",
              fontWeight: 800,
              color: "#0284c7",
              whiteSpace: "nowrap",
            }}
          >
            {formatoQ(saldoEsperado)}
          </span>
          <span style={{ fontSize: "0.72rem", color: "var(--ink-soft)" }}>
            Saldo final acumulado del día
          </span>
        </div>

        <div
          style={{
            background: estaCuadrada ? "rgba(16, 185, 129, 0.08)" : "rgba(239, 68, 68, 0.08)",
            border: estaCuadrada ? "1px solid rgba(16, 185, 129, 0.4)" : "1px solid rgba(239, 68, 68, 0.4)",
            borderLeft: estaCuadrada ? "4px solid #10b981" : "4px solid #ef4444",
            borderRadius: "8px",
            padding: "0.75rem 1rem",
            display: "flex",
            flexDirection: "column",
            gap: "0.2rem",
          }}
        >
          <span style={{ fontSize: "0.72rem", fontWeight: 700, color: estaCuadrada ? "#059669" : "#dc2626", textTransform: "uppercase", letterSpacing: "0.04em" }}>
            DIFERENCIA DE ARQUEO
          </span>
          <span
            className="mono"
            style={{
              fontSize: "clamp(1.1rem, 1.4vw, 1.35rem)",
              fontWeight: 800,
              color: estaCuadrada ? "#059669" : "#dc2626",
              whiteSpace: "nowrap",
            }}
          >
            {estaCuadrada
              ? "Q 0.00"
              : diferencia > 0
              ? `+${formatoQ(diferencia)}`
              : formatoQ(diferencia)}
          </span>
          <span style={{ fontSize: "0.72rem", color: estaCuadrada ? "#059669" : "#dc2626", fontWeight: 600 }}>
            {estaCuadrada ? "✓ Caja cuadrada y lista para cierre" : diferencia > 0 ? "⚠️ Sobrante de efectivo" : "⚠️ Faltante de efectivo"}
          </span>
        </div>
      </div>

      {/* ALERTAS */}
      {error && <div className="alert error">{error}</div>}

      {/* BOTÓN DE CIERRE */}
      <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: "1rem", marginTop: "0.5rem" }}>
        <button
          type="button"
          className="btn"
          style={{
            background: estaCuadrada ? "#059669" : "#d97706",
            borderColor: estaCuadrada ? "#059669" : "#d97706",
            fontWeight: 700,
            padding: "0.65rem 1.75rem",
            fontSize: "0.95rem",
          }}
          disabled={guardando}
          onClick={cerrar}
        >
          {guardando ? "Cerrando turno y guardando arqueo..." : "🔒 Confirmar y Cerrar Caja del Día"}
        </button>
      </div>
    </div>
  );
}

