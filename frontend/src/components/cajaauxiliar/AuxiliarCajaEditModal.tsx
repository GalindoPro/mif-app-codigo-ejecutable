import { useState, type FormEvent } from "react";
import { api, mensajeError } from "../../lib/api";
import { CATEGORIAS_AUXILIAR, type CajaCategoria } from "../../types";
import type { CajaMovimientoAuxiliar } from "../../types";
import { categoriasDeGrupo } from "./NuevoMovimientoForm";

export default function AuxiliarCajaEditModal({
  registro,
  onClose,
  onSuccess
}: {
  registro: CajaMovimientoAuxiliar;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [seccion, setSeccion] = useState<"BI" | "PROPIO">(registro.seccion);
  const [tipo, setTipo] = useState<"INGRESO" | "EGRESO">(registro.tipo);
  const [categoria, setCategoria] = useState<CajaCategoria>(registro.categoria);
  const [monto, setMonto] = useState(registro.monto.toString());
  const [referencia, setReferencia] = useState(registro.referencia || "");
  const [descripcion, setDescripcion] = useState(registro.descripcion || "");
  const [motivo, setMotivo] = useState("");

  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function guardar(e: FormEvent) {
    e.preventDefault();
    if (motivo.trim().length < 10) {
      setError("El motivo de corrección debe tener al menos 10 caracteres.");
      return;
    }
    setError(null);
    setGuardando(true);
    try {
      await api.patch(`/caja-auxiliar/movimiento/${registro.id}`, {
        seccion,
        categoria,
        tipo,
        monto: Number(monto),
        referencia: referencia || undefined,
        descripcion: descripcion || undefined,
        motivo
      });
      onSuccess();
    } catch (err) {
      setError(mensajeError(err));
    } finally {
      setGuardando(false);
    }
  }

  const opcionesCategoria = categoriasDeGrupo(seccion, tipo);

  return (
    <div className="modal">
      <div className="modal-content" style={{ maxWidth: 450 }}>
        <h2 style={{ color: "var(--ink)" }}>✏️ Corregir Movimiento</h2>
        <p style={{ fontSize: "0.82rem", color: "var(--ink-soft)", marginBottom: "1rem" }}>
          Las modificaciones quedarán registradas en la bitácora de auditoría.
        </p>

        {error && <div className="alert-error" style={{ marginBottom: "1rem" }}>{error}</div>}

        <form onSubmit={guardar} style={{ display: "flex", flexDirection: "column", gap: "0.8rem" }}>
          <div className="field-group">
            <div className="field">
              <label>Sección</label>
              <select value={seccion} onChange={(e) => {
                const s = e.target.value as "BI" | "PROPIO";
                setSeccion(s);
                const opts = categoriasDeGrupo(s, tipo);
                setCategoria(opts.includes(categoria) ? categoria : opts[0]);
              }}>
                <option value="PROPIO">Fondo Propio (Caja)</option>
                <option value="BI">Banco Industrial (BI)</option>
              </select>
            </div>
            <div className="field">
              <label>Tipo</label>
              <select
                value={tipo}
                onChange={(e) => {
                  const t = e.target.value as "INGRESO" | "EGRESO";
                  setTipo(t);
                  const opts = categoriasDeGrupo(seccion, t);
                  setCategoria(opts.includes(categoria) ? categoria : opts[0]);
                }}
              >
                <option value="INGRESO">Ingreso (Recibo)</option>
                <option value="EGRESO">Egreso (Pago)</option>
              </select>
            </div>
          </div>

          <div className="field">
            <label>Categoría</label>
            <select value={categoria} onChange={(e) => setCategoria(e.target.value as CajaCategoria)}>
              <option value="" disabled>Seleccione categoría</option>
              {opcionesCategoria.map((c) => (
                <option key={c} value={c}>{CATEGORIAS_AUXILIAR[c].descripcion}</option>
              ))}
            </select>
          </div>

          <div className="field">
            <label>Monto Exacto (Q)</label>
            <input type="number" required min="0.01" step="0.01" value={monto} onChange={(e) => setMonto(e.target.value)} />
          </div>

          <div className="field">
            <label>Referencia (Doc, Boleta, etc.)</label>
            <input type="text" value={referencia} onChange={(e) => setReferencia(e.target.value)} />
          </div>

          <div className="field">
            <label>Descripción / Justificación</label>
            <input type="text" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} />
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
                placeholder="Ej: Se ingresó mal el monto, el correcto era Q50.00"
                style={{ borderColor: "rgba(234,179,8,0.3)" }}
              />
            </div>
          </div>

          <div className="actions" style={{ marginTop: "1rem" }}>
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={guardando}>Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={guardando}>
              {guardando ? "Guardando..." : "Guardar Corrección"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
