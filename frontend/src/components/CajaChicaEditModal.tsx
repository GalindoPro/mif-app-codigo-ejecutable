import { useState, type FormEvent } from "react";
import { api, mensajeError } from "../lib/api";
import { CATEGORIA_CAJA_CHICA_LABEL, type CategoriaCajaChica, type CajaChicaComprobante } from "../types";

const CATEGORIAS = Object.entries(CATEGORIA_CAJA_CHICA_LABEL) as [CategoriaCajaChica, string][];

export default function CajaChicaEditModal({ 
  registro, 
  onClose, 
  onSuccess 
}: { 
  registro: CajaChicaComprobante;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [fecha, setFecha] = useState(() => registro.fecha.slice(0, 10));
  const [beneficiario, setBeneficiario] = useState(registro.beneficiario);
  const [descripcion, setDescripcion] = useState(registro.descripcion);
  const [monto, setMonto] = useState(registro.monto.toString());
  const [numeroDocumento, setNumeroDocumento] = useState(registro.numero_documento || "");
  const [tipo, setTipo] = useState<"INGRESO" | "EGRESO">(registro.tipo as "INGRESO" | "EGRESO");
  const [categoria, setCategoria] = useState<CategoriaCajaChica | "">((registro.categoria as CategoriaCajaChica) || "");
  const [motivo, setMotivo] = useState("");
  
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function guardar(e: FormEvent) {
    e.preventDefault();
    if (motivo.trim().length < 10) {
      setError("El motivo de corrección debe tener al menos 10 caracteres explicativos.");
      return;
    }
    setError(null);
    setGuardando(true);
    try {
      await api.patch(`/caja-chica/${registro.id}`, {
        fecha,
        beneficiario,
        descripcion,
        tipo,
        categoria: tipo === "EGRESO" && categoria ? categoria : undefined,
        monto: Number(monto),
        numeroDocumento: numeroDocumento || undefined,
        motivo
      });
      onSuccess();
    } catch (err) {
      setError(mensajeError(err));
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="modal">
      <div className="modal-content" style={{ maxWidth: 450 }}>
        <h2 style={{ color: "var(--ink)" }}>✏️ Corregir Comprobante</h2>
        <p style={{ fontSize: "0.82rem", color: "var(--ink-soft)", marginBottom: "1rem" }}>
          Las modificaciones quedarán registradas en la bitácora de auditoría.
        </p>
        
        {error && <div className="alert-error" style={{ marginBottom: "1rem" }}>{error}</div>}
        
        <form onSubmit={guardar} style={{ display: "flex", flexDirection: "column", gap: "0.8rem" }}>
          <div className="field">
            <label>Tipo de Comprobante</label>
            <select value={tipo} onChange={(e) => setTipo(e.target.value as "INGRESO" | "EGRESO")}>
              <option value="EGRESO">Egreso (Gasto)</option>
              <option value="INGRESO">Ingreso (Reintegro / Reposición)</option>
            </select>
          </div>
          
          <div className="field-group">
            <div className="field">
              <label>Fecha</label>
              <input type="date" required value={fecha} onChange={(e) => setFecha(e.target.value)} />
            </div>
            <div className="field">
              <label>No. Documento (Opcional)</label>
              <input type="text" value={numeroDocumento} onChange={(e) => setNumeroDocumento(e.target.value)} />
            </div>
          </div>
          
          <div className="field">
            <label>Beneficiario</label>
            <input type="text" required minLength={2} value={beneficiario} onChange={(e) => setBeneficiario(e.target.value)} />
          </div>
          
          <div className="field">
            <label>Concepto / Descripción</label>
            <input type="text" required minLength={2} value={descripcion} onChange={(e) => setDescripcion(e.target.value)} />
          </div>
          
          {tipo === "EGRESO" && (
            <div className="field">
              <label>Categoría</label>
              <select required value={categoria} onChange={(e) => setCategoria(e.target.value as CategoriaCajaChica)}>
                <option value="" disabled>Seleccione categoría</option>
                {CATEGORIAS.map(([val, label]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>
            </div>
          )}
          
          <div className="field">
            <label>Monto Exacto (Q)</label>
            <input type="number" required min="0.01" step="0.01" value={monto} onChange={(e) => setMonto(e.target.value)} />
          </div>

          <div style={{ padding: "1rem", background: "rgba(234, 179, 8, 0.1)", borderRadius: "8px", marginTop: "0.5rem" }}>
            <div className="field" style={{ marginBottom: 0 }}>
              <label style={{ color: "#a16207", fontWeight: 700 }}>Motivo de la Corrección (Obligatorio)</label>
              <textarea 
                required 
                minLength={10} 
                rows={2} 
                value={motivo} 
                onChange={(e) => setMotivo(e.target.value)}
                placeholder="Ej: Me equivoqué al digitar el monto, el correcto es Q150.00"
                style={{ borderColor: "rgba(234,179,8,0.3)" }}
              />
            </div>
          </div>
          
          <div className="actions" style={{ marginTop: "1rem" }}>
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={guardando}>Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={guardando}>{guardando ? "Guardando..." : "Guardar Corrección"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
