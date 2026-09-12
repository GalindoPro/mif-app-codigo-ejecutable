import { useEffect, useState } from "react";
import { api, mensajeError } from "../../lib/api";
import { formatoQ } from "../../types";
import type { CobroCampo } from "../../types";

interface LiquidacionGrupo {
  promotor_id: string;
  promotor_nombre: string;
  cantidad_recibos: number;
  total_efectivo: number;
  cobros: CobroCampo[];
}

export interface LiquidacionesCampoProps {
  agenciaId: string;
  onLiquidado: () => void;
}

export default function LiquidacionesCampo({ agenciaId, onLiquidado }: LiquidacionesCampoProps) {
  const [grupos, setGrupos] = useState<LiquidacionGrupo[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [procesandoId, setProcesandoId] = useState<string | null>(null);

  useEffect(() => {
    cargarLiquidaciones();
  }, [agenciaId]);

  async function cargarLiquidaciones() {
    setCargando(true);
    setError(null);
    try {
      const { data } = await api.get<LiquidacionGrupo[]>("/caja-auxiliar/liquidaciones", { params: { agenciaId } });
      setGrupos(data);
    } catch (err) {
      setError(mensajeError(err));
    } finally {
      setCargando(false);
    }
  }

  async function handleAprobar(promotorId: string, nombre: string, total: number) {
    const confirmado = window.confirm(`¿Confirmas que recibiste EXACTAMENTE ${formatoQ(total)} en efectivo físico del promotor ${nombre}?`);
    if (!confirmado) return;

    setProcesandoId(promotorId);
    setError(null);
    try {
      await api.post("/caja-auxiliar/liquidaciones/aprobar", { promotorId });
      alert(`✅ Liquidación del promotor ${nombre} aprobada exitosamente. Se aplicaron los pagos a los créditos.`);
      cargarLiquidaciones();
      onLiquidado();
    } catch (err) {
      setError(mensajeError(err));
    } finally {
      setProcesandoId(null);
    }
  }

  if (cargando) return null;
  if (grupos.length === 0) return null;

  return (
    <div
      style={{
        background: "linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)",
        border: "1px solid #fed7aa",
        borderRadius: "10px",
        padding: "1rem",
        marginBottom: "1.5rem",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
        <h3 style={{ margin: 0, fontSize: "0.95rem", color: "#9a3412", display: "flex", alignItems: "center", gap: "0.4rem" }}>
          <span>💰</span> Liquidaciones de Campo Pendientes (Promotores)
        </h3>
        <span className="badge warning" style={{ background: "#ffedd5", color: "#9a3412" }}>
          {grupos.length} {grupos.length === 1 ? "promotor" : "promotores"}
        </span>
      </div>
      <p style={{ margin: "0 0 1rem", fontSize: "0.82rem", color: "#9a3412" }}>
        Los promotores han registrado pagos en campo. Recibe el efectivo y aprueba el bloque para aplicar los movimientos a caja.
      </p>

      {error && <div className="alert error" style={{ padding: "0.5rem", marginBottom: "1rem" }}>{error}</div>}

      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {grupos.map((g) => (
          <div key={g.promotor_id} style={{ background: "#fff", border: "1px solid #fed7aa", borderRadius: "8px", padding: "1rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.75rem" }}>
              <div>
                <h4 style={{ margin: "0 0 0.25rem", color: "var(--ink)", fontSize: "0.95rem" }}>Promotor: {g.promotor_nombre}</h4>
                <div style={{ fontSize: "0.82rem", color: "var(--ink-soft)" }}>
                  Recibos: <strong>{g.cantidad_recibos}</strong> | Efectivo Total: <strong style={{ color: "#16a34a", fontSize: "0.9rem" }}>{formatoQ(g.total_efectivo)}</strong>
                </div>
              </div>
              <button
                type="button"
                className="btn primary"
                disabled={procesandoId === g.promotor_id}
                onClick={() => handleAprobar(g.promotor_id, g.promotor_nombre, g.total_efectivo)}
              >
                {procesandoId === g.promotor_id ? "Aprobando..." : "✅ Recibir Efectivo y Aprobar"}
              </button>
            </div>

            <details>
              <summary style={{ cursor: "pointer", fontSize: "0.8rem", color: "var(--accent)", fontWeight: 600 }}>Ver detalle de recibos ({g.cobros.length})</summary>
              <div style={{ marginTop: "0.5rem" }}>
                <table className="table-compact" style={{ width: "100%", fontSize: "0.75rem" }}>
                  <thead>
                    <tr>
                      <th>Socio / Crédito</th>
                      <th>Recibo</th>
                      <th style={{ textAlign: "right" }}>Capital</th>
                      <th style={{ textAlign: "right" }}>Int.</th>
                      <th style={{ textAlign: "right" }}>Mora</th>
                      <th style={{ textAlign: "right" }}>Total</th>
                      <th>Novedad</th>
                    </tr>
                  </thead>
                  <tbody>
                    {g.cobros.map(c => (
                      <tr key={c.id}>
                        <td>{c.socio_nombres} <br/><span className="mono" style={{color: "var(--ink-soft)"}}>{c.prestamo_codigo}</span></td>
                        <td className="mono">{c.numero_recibo_fisico}</td>
                        <td className="mono" style={{ textAlign: "right", color: "var(--ink-soft)" }}>{formatoQ(c.pago_capital || 0)}</td>
                        <td className="mono" style={{ textAlign: "right", color: "var(--ink-soft)" }}>{formatoQ(c.pago_interes || 0)}</td>
                        <td className="mono" style={{ textAlign: "right", color: "var(--ink-soft)" }}>{formatoQ(c.pago_mora || 0)}</td>
                        <td className="mono" style={{ textAlign: "right", fontWeight: 600 }}>{formatoQ(c.monto)}</td>
                        <td>
                          {c.veces_editado > 0 ? (
                            <div className="alert warning" style={{ padding: "0.2rem 0.4rem", margin: 0, fontSize: "0.7rem", lineHeight: 1.2 }}>
                              <strong>Editado:</strong> {c.justificacion_edicion}
                            </div>
                          ) : <span style={{ color: "var(--ink-soft)" }}>Ok</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </details>
          </div>
        ))}
      </div>
    </div>
  );
}
