import { useState } from "react";
import { api, mensajeError } from "../../lib/api";
import type { CobroCampo } from "../../types";

interface Props {
  prestamoId: string;
  socioId: string;
  socioNombres: string;
  onClose: () => void;
  onSuccess: () => void;
  cobroExistente?: CobroCampo;
}

export function CobroCampoModal({ prestamoId, socioId, socioNombres, onClose, onSuccess, cobroExistente }: Props) {
  const [numeroReciboFisico, setNumeroReciboFisico] = useState(cobroExistente?.numero_recibo_fisico || "");
  const [monto, setMonto] = useState(cobroExistente?.monto ? String(cobroExistente.monto) : "");
  const [justificacion, setJustificacion] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const esEdicion = !!cobroExistente;
  const yaEditado = esEdicion && cobroExistente.veces_editado >= 1;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setGuardando(true);

    try {
      if (esEdicion) {
        if (!justificacion || justificacion.trim().length < 5) {
          throw new Error("Debe proveer una justificación válida de por qué edita este cobro.");
        }
        await api.patch(`/cobros-campo/${cobroExistente.id}`, {
          monto: Number(monto),
          justificacion_edicion: justificacion,
        });
      } else {
        await api.post("/cobros-campo", {
          prestamo_id: prestamoId,
          socio_id: socioId,
          numero_recibo_fisico: numeroReciboFisico,
          monto: Number(monto),
        });
      }
      onSuccess();
    } catch (err) {
      setError(mensajeError(err));
      setGuardando(false);
    }
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: 450 }}>
        <h2 style={{ marginTop: 0, color: "var(--accent)" }}>
          {esEdicion ? "✏️ Editar Cobro de Campo" : "💰 Registrar Cobro de Campo"}
        </h2>

        <p style={{ fontSize: "0.85rem", color: "var(--ink-soft)" }}>
          <strong>Socio:</strong> {socioNombres}
        </p>

        {yaEditado && (
          <div className="alert error" style={{ fontSize: "0.8rem", padding: "0.5rem" }}>
            ⛔ Este cobro ya fue editado una vez. No se permiten más modificaciones.
          </div>
        )}

        {esEdicion && !yaEditado && (
          <div className="alert warning" style={{ fontSize: "0.8rem", padding: "0.5rem" }}>
            ⚠️ <strong>Advertencia:</strong> Solo tienes UNA oportunidad para corregir este cobro. El cajero verá tu justificación.
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem", marginTop: "1rem" }}>
          <div>
            <label style={{ display: "block", marginBottom: "0.25rem", fontSize: "0.85rem", fontWeight: 600 }}>No. de Recibo Físico (Papel)</label>
            <input
              type="text"
              required
              disabled={esEdicion}
              value={numeroReciboFisico}
              onChange={(e) => setNumeroReciboFisico(e.target.value)}
              placeholder="Ej. 10245"
              style={{ width: "100%", padding: "0.4rem", borderRadius: "4px", border: "1px solid var(--line)" }}
            />
          </div>

          <div>
            <label style={{ display: "block", marginBottom: "0.25rem", fontSize: "0.85rem", fontWeight: 600 }}>Monto Cobrado (Q)</label>
            <input
              type="number"
              required
              step="0.01"
              min="0.01"
              disabled={yaEditado}
              value={monto}
              onChange={(e) => setMonto(e.target.value)}
              placeholder="Ej. 500.00"
              style={{ width: "100%", padding: "0.4rem", borderRadius: "4px", border: "1px solid var(--line)" }}
            />
          </div>

          {esEdicion && !yaEditado && (
            <div>
              <label style={{ display: "block", marginBottom: "0.25rem", fontSize: "0.85rem", fontWeight: 600 }}>Motivo de la Corrección</label>
              <input
                type="text"
                required
                value={justificacion}
                onChange={(e) => setJustificacion(e.target.value)}
                placeholder="Ej. Me equivoqué al digitar el monto"
                style={{ width: "100%", padding: "0.4rem", borderRadius: "4px", border: "1px solid var(--line)" }}
              />
            </div>
          )}

          {error && <div className="alert error" style={{ margin: 0 }}>{error}</div>}

          <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end", marginTop: "1rem" }}>
            <button type="button" className="btn secondary" onClick={onClose} disabled={guardando}>
              Cancelar
            </button>
            {!yaEditado && (
              <button type="submit" className="btn primary" disabled={guardando}>
                {guardando ? "Guardando..." : "Guardar Cobro"}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
