import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { api, mensajeError } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import BuscadorSocio from "../components/BuscadorSocio";
import type {
  Agencia,
  Socio,
  TipoAmortizacion,
  TipoPrestamo,
  UsuarioItem,
} from "../types";

export default function CreditoForm() {
  const { usuario } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const puedeElegirAgencia = usuario?.rol === "ADMIN" || usuario?.rol === "GERENCIA";

  const [agencias, setAgencias] = useState<Agencia[]>([]);
  const [agenciaId, setAgenciaId] = useState(usuario?.agenciaId ?? "");
  const [promotores, setPromotores] = useState<UsuarioItem[]>([]);

  const [socio, setSocio] = useState<Socio | null>(null);
  const [promotorId, setPromotorId] = useState(usuario?.rol === "PROMOTOR" ? usuario.id : "");
  const [tipo, setTipo] = useState<TipoPrestamo>("FIDUCIARIO");
  const [tipoAmortizacion, setTipoAmortizacion] = useState<TipoAmortizacion>(
    (searchParams.get("tipoAmort") as TipoAmortizacion) || "CUOTA_NIVELADA",
  );
  const [montoSolicitado, setMontoSolicitado] = useState(searchParams.get("monto") || "10000");
  const [plazoMeses, setPlazoMeses] = useState(searchParams.get("plazo") || "12");
  const [tasaInteresMensual, setTasaInteresMensual] = useState(searchParams.get("tasa") || "2.0");
  const [destino, setDestino] = useState("Capital de trabajo / Comercio");
  const [garantia, setGarantia] = useState("");
  const [ubicacionGarantia, setUbicacionGarantia] = useState("");
  const [nombreFiador, setNombreFiador] = useState("");
  const [observaciones, setObservaciones] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (puedeElegirAgencia) {
      api.get<Agencia[]>("/agencias").then(({ data }) => setAgencias(data));
    }
    api.get<UsuarioItem[]>("/usuarios").then(({ data }) => {
      // Filtrar promotores
      const p = data.filter((u) => u.rol === "PROMOTOR" || u.rol === "SUPERVISOR");
      setPromotores(p.length > 0 ? p : data);
    });
  }, [puedeElegirAgencia]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!socio) {
      setError("Selecciona el socio solicitante.");
      return;
    }
    if (!agenciaId) {
      setError("Selecciona una agencia.");
      return;
    }

    setError(null);
    setGuardando(true);

    try {
      const { data } = await api.post("/prestamos", {
        agenciaId,
        socioId: socio.id,
        promotorId: promotorId || undefined,
        tipo,
        tipoAmortizacion,
        montoSolicitado: Number(montoSolicitado),
        plazoMeses: Number(plazoMeses),
        tasaInteresMensual: Number(tasaInteresMensual),
        destino: destino || undefined,
        garantia: garantia || undefined,
        ubicacionGarantia: ubicacionGarantia || undefined,
        nombreFiador: nombreFiador || undefined,
        observaciones: observaciones || undefined,
      });
      navigate(`/creditos/${data.id}`);
    } catch (err) {
      setError(mensajeError(err));
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Nueva Solicitud de Crédito</h1>
          <p>Registra un préstamo fiduciario o hipotecario asignado a un socio y a su promotor de crédito.</p>
        </div>
      </div>

      {error && <div className="alert error">{error}</div>}

      <form className="card" onSubmit={onSubmit} style={{ maxWidth: 680 }}>
        <h2 style={{ marginTop: 0, fontSize: "1.1rem" }}>Datos generales del crédito</h2>

        <div className="form-grid">
          {puedeElegirAgencia && (
            <div className="field">
              <label htmlFor="cred-agencia">Agencia</label>
              <select id="cred-agencia" value={agenciaId} onChange={(e) => setAgenciaId(e.target.value)} required>
                <option value="" disabled>
                  Selecciona una agencia
                </option>
                {agencias.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.nombre}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="field" style={{ gridColumn: "1 / -1" }}>
            <label>Socio solicitante</label>
            <BuscadorSocio agenciaId={agenciaId || undefined} seleccionado={socio} onSeleccionar={setSocio} />
          </div>

          <div className="field">
            <label htmlFor="cred-promotor">Promotor de crédito responsable</label>
            <select id="cred-promotor" value={promotorId} onChange={(e) => setPromotorId(e.target.value)}>
              <option value="">(Sin asignar o promotor actual)</option>
              {promotores.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.nombre} ({u.rol})
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label htmlFor="cred-tipo">Tipo de crédito</label>
            <select id="cred-tipo" value={tipo} onChange={(e) => setTipo(e.target.value as TipoPrestamo)}>
              <option value="FIDUCIARIO">Fiduciario (con fiador)</option>
              <option value="HIPOTECARIO">Hipotecario (con bien inmueble)</option>
            </select>
          </div>

          <div className="field">
            <label htmlFor="cred-monto">Monto solicitado (Q)</label>
            <input
              id="cred-monto"
              type="number"
              min="500"
              step="100"
              value={montoSolicitado}
              onChange={(e) => setMontoSolicitado(e.target.value)}
              required
            />
          </div>

          <div className="field">
            <label htmlFor="cred-plazo">Plazo (meses)</label>
            <input
              id="cred-plazo"
              type="number"
              min="1"
              max="120"
              value={plazoMeses}
              onChange={(e) => setPlazoMeses(e.target.value)}
              required
            />
          </div>

          <div className="field">
            <label htmlFor="cred-tasa">Tasa de interés mensual (%)</label>
            <input
              id="cred-tasa"
              type="number"
              step="0.1"
              value={tasaInteresMensual}
              onChange={(e) => setTasaInteresMensual(e.target.value)}
              required
            />
            <span className="hint">MIF estándar: 2.0% mensual</span>
          </div>

          <div className="field">
            <label>Sistema de amortización</label>
            <select
              value={tipoAmortizacion}
              onChange={(e) => setTipoAmortizacion(e.target.value as TipoAmortizacion)}
            >
              <option value="CUOTA_NIVELADA">Cuota Nivelada (Fija)</option>
              <option value="SOBRE_SALDOS">Sobre Saldos (Capital constante)</option>
            </select>
          </div>

          <div className="field" style={{ gridColumn: "1 / -1" }}>
            <label htmlFor="cred-destino">Destino del crédito</label>
            <input
              id="cred-destino"
              value={destino}
              onChange={(e) => setDestino(e.target.value)}
              placeholder="Ej. Compra de mercadería para tienda, abono agrícola, etc."
            />
          </div>

          <div className="field" style={{ gridColumn: "1 / -1" }}>
            <label htmlFor="cred-garantia">
              {tipo === "FIDUCIARIO" ? "Datos del fiador / Garantía fiduciaria" : "Datos de la garantía hipotecaria"}
            </label>
            <textarea
              id="cred-garantia"
              rows={2}
              value={garantia}
              onChange={(e) => setGarantia(e.target.value)}
              placeholder={
                tipo === "FIDUCIARIO"
                  ? "Nombre del fiador, DPI, teléfono, lugar de trabajo o ingresos..."
                  : "Número de finca, folio, libro, ubicación del inmueble, valor estimado..."
              }
              style={{
                border: "1px solid var(--line)",
                borderRadius: "8px",
                padding: "0.55rem",
                background: "var(--paper)",
                color: "var(--ink)",
                fontFamily: "inherit",
              }}
            />
          </div>

          <div className="field">
            <label htmlFor="cred-ubicacion">Ubicación de garantía / Comunidad</label>
            <input
              id="cred-ubicacion"
              value={ubicacionGarantia}
              onChange={(e) => setUbicacionGarantia(e.target.value)}
              placeholder="Ej. Cantón Ilom, Aldea Campo Alegre, Chajul"
            />
            <span className="hint">Identifica la comunidad para la visita y el Kardex del Promotor</span>
          </div>

          {tipo === "FIDUCIARIO" && (
            <div className="field">
              <label htmlFor="cred-fiador">Nombre del Fiador Principal</label>
              <input
                id="cred-fiador"
                value={nombreFiador}
                onChange={(e) => setNombreFiador(e.target.value)}
                placeholder="Nombre completo del fiador"
              />
            </div>
          )}

          <div className="field" style={{ gridColumn: "1 / -1" }}>
            <label htmlFor="cred-observaciones">Observaciones adicionales</label>
            <textarea
              id="cred-observaciones"
              rows={2}
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              placeholder="Notas de evaluación del promotor..."
              style={{
                border: "1px solid var(--line)",
                borderRadius: "8px",
                padding: "0.55rem",
                background: "var(--paper)",
                color: "var(--ink)",
                fontFamily: "inherit",
              }}
            />
          </div>
        </div>

        <div style={{ marginTop: "1.5rem", display: "flex", gap: "0.75rem" }}>
          <button type="submit" className="btn" disabled={guardando || !socio}>
            {guardando ? "Registrando solicitud…" : "Crear solicitud de crédito"}
          </button>
          <button type="button" className="btn secondary" onClick={() => navigate(-1)}>
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
