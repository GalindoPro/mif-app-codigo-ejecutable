import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import type { Cuenta } from "../../types";
import { formatoQ } from "../../types";

export interface PanelNovedadesCampoProps {
  agenciaId: string;
  onSeleccionarCuenta: (cuenta: Cuenta) => void;
}

export default function PanelNovedadesCampo({
  agenciaId,
  onSeleccionarCuenta,
}: PanelNovedadesCampoProps) {
  const [novedades, setNovedades] = useState<Cuenta[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    api
      .get<Cuenta[]>("/cuentas/novedades-campo", { params: { agenciaId } })
      .then(({ data }) => setNovedades(data))
      .catch(() => {})
      .finally(() => setCargando(false));
  }, [agenciaId]);

  if (cargando || novedades.length === 0) return null;

  return (
    <div
      style={{
        background: "linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)",
        border: "1px solid #a7f3d0",
        borderRadius: "10px",
        padding: "1rem",
        marginBottom: "1.5rem",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
        <h3 style={{ margin: 0, fontSize: "0.95rem", color: "#065f46", display: "flex", alignItems: "center", gap: "0.4rem" }}>
          <span>🔔</span> Novedades de Campo (Cuentas aperturadas por Promotores)
        </h3>
        <span className="badge" style={{ background: "#d1fae5", color: "#065f46" }}>
          {novedades.length} {novedades.length === 1 ? "cuenta reciente" : "cuentas recientes"}
        </span>
      </div>
      <p style={{ margin: "0 0 0.75rem", fontSize: "0.82rem", color: "#047857" }}>
        El promotor registró estas cuentas con cuotas pactadas en campo. Haz clic para cobrar el depósito en ventanilla sin reescribir datos:
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "0.75rem" }}>
        {novedades.slice(0, 4).map((c) => (
          <div
            key={c.id}
            style={{
              background: "#fff",
              border: "1px solid #d1fae5",
              borderRadius: "8px",
              padding: "0.75rem",
              fontSize: "0.85rem",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
          >
            <div>
              <div style={{ fontWeight: 700, color: "var(--ink)" }}>{c.socio_nombres}</div>
              <div className="mono" style={{ fontSize: "0.8rem", color: "var(--ink-soft)" }}>
                {c.numero_cuenta} — {c.tipo.replace("AHORRO_", "")}
              </div>
              {c.promotor_nombre && (
                <div style={{ fontSize: "0.78rem", color: "var(--accent)", marginTop: "0.2rem" }}>
                  Promotor: <strong>{c.promotor_nombre}</strong>
                </div>
              )}
              {c.cuota_pactada && (
                <div style={{ marginTop: "0.25rem", color: "#059669", fontWeight: 600 }}>
                  Cuota pactada: {formatoQ(c.cuota_pactada)}
                </div>
              )}
              {c.observaciones_apertura && (
                <div style={{ fontSize: "0.78rem", color: "var(--ink-soft)", fontStyle: "italic", marginTop: "0.2rem" }}>
                  "{c.observaciones_apertura}"
                </div>
              )}
            </div>
            <div style={{ marginTop: "0.6rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span className="mono" style={{ fontSize: "0.78rem", color: Number(c.saldo_actual) > 0 ? "#16a34a" : "#dc2626" }}>
                Saldo: {formatoQ(c.saldo_actual)}
              </span>
              <button
                type="button"
                className="btn secondary"
                style={{ fontSize: "0.78rem", padding: "0.25rem 0.5rem" }}
                onClick={() => onSeleccionarCuenta(c)}
              >
                + Cobrar depósito
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
