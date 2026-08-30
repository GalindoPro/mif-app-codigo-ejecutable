import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { api, mensajeError } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import type { Agencia } from "../types";

export default function SocioForm() {
  const { usuario } = useAuth();
  const navigate = useNavigate();
  const puedeElegirAgencia = usuario?.rol === "ADMIN" || usuario?.rol === "GERENCIA";

  const [agencias, setAgencias] = useState<Agencia[]>([]);
  const [agenciaId, setAgenciaId] = useState(usuario?.agenciaId ?? "");
  const [numeroAsociado, setNumeroAsociado] = useState("");
  const [nombres, setNombres] = useState("");
  const [genero, setGenero] = useState<"M" | "F" | "">("");
  const [edad, setEdad] = useState("");
  const [fechaIngreso, setFechaIngreso] = useState(() => new Date().toISOString().slice(0, 10));
  const [dpi, setDpi] = useState("");
  const [direccion, setDireccion] = useState("");
  const [telefono, setTelefono] = useState("");
  const [nombreBeneficiario, setNombreBeneficiario] = useState("");
  const [dpiBeneficiario, setDpiBeneficiario] = useState("");
  const [telefonoBeneficiario, setTelefonoBeneficiario] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (puedeElegirAgencia) {
      api.get<Agencia[]>("/agencias").then(({ data }) => setAgencias(data));
    }
  }, [puedeElegirAgencia]);

  useEffect(() => {
    if (!agenciaId) return;
    api
      .get<{ numeroAsociado: string }>("/socios/siguiente-numero", { params: { agenciaId } })
      .then(({ data }) => setNumeroAsociado(data.numeroAsociado));
  }, [agenciaId]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setGuardando(true);
    try {
      const { data } = await api.post("/socios", {
        numeroAsociado,
        agenciaId,
        nombres,
        genero: genero || undefined,
        edad: edad ? Number(edad) : undefined,
        fechaIngreso,
        dpi: dpi || undefined,
        direccion: direccion || undefined,
        telefono: telefono || undefined,
        nombreBeneficiario: nombreBeneficiario || undefined,
        dpiBeneficiario: dpiBeneficiario || undefined,
        telefonoBeneficiario: telefonoBeneficiario || undefined,
      });
      navigate(`/socios/${data.id}`);
    } catch (err) {
      setError(mensajeError(err));
      setGuardando(false);
    }
  }

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Nuevo socio</h1>
          <p>Datos generales del asociado. Después podrás abrirle cuentas de ahorro o aportación.</p>
        </div>
      </div>

      {error && <div className="alert error">{error}</div>}

      <form className="card" onSubmit={onSubmit} style={{ maxWidth: 640 }}>
        <div className="form-grid">
          {puedeElegirAgencia && (
            <div className="field">
              <label htmlFor="agencia">Agencia</label>
              <select id="agencia" value={agenciaId} onChange={(e) => setAgenciaId(e.target.value)} required>
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

          <div className="field">
            <label htmlFor="numero">No. de asociado</label>
            <input id="numero" value={numeroAsociado} onChange={(e) => setNumeroAsociado(e.target.value)} required />
            <span className="hint">Sugerido automáticamente; puedes ajustarlo.</span>
          </div>

          <div className="field" style={{ gridColumn: "1 / -1" }}>
            <label htmlFor="nombres">Nombres completos</label>
            <input id="nombres" value={nombres} onChange={(e) => setNombres(e.target.value)} required />
          </div>

          <div className="field">
            <label htmlFor="genero">Género</label>
            <select id="genero" value={genero} onChange={(e) => setGenero(e.target.value as "M" | "F" | "")}>
              <option value="">Sin especificar</option>
              <option value="F">Femenino</option>
              <option value="M">Masculino</option>
            </select>
          </div>

          <div className="field">
            <label htmlFor="edad">Edad (años)</label>
            <input
              id="edad"
              type="number"
              min="1"
              max="120"
              value={edad}
              onChange={(e) => setEdad(e.target.value)}
              placeholder="Ej. 35"
            />
          </div>

          <div className="field">
            <label htmlFor="fecha">Fecha de ingreso</label>
            <input
              id="fecha"
              type="date"
              value={fechaIngreso}
              onChange={(e) => setFechaIngreso(e.target.value)}
              required
            />
          </div>

          <div className="field">
            <label htmlFor="dpi">DPI del asociado</label>
            <input id="dpi" value={dpi} onChange={(e) => setDpi(e.target.value)} maxLength={13} placeholder="13 dígitos" />
          </div>

          <div className="field">
            <label htmlFor="telefono">Teléfono</label>
            <input id="telefono" value={telefono} onChange={(e) => setTelefono(e.target.value)} placeholder="8 dígitos" />
          </div>

          <div className="field" style={{ gridColumn: "1 / -1" }}>
            <label htmlFor="direccion">Dirección / Comunidad</label>
            <input id="direccion" value={direccion} onChange={(e) => setDireccion(e.target.value)} placeholder="Ej. Cantón Ilom, Chajul" />
          </div>

          <div style={{ gridColumn: "1 / -1", marginTop: "0.5rem", borderTop: "1px solid var(--line)", paddingTop: "1rem" }}>
            <h3 style={{ margin: "0 0 0.5rem", fontSize: "1rem" }}>Datos de la Persona Beneficiaria</h3>
            <p style={{ margin: "0 0 1rem", fontSize: "0.82rem", color: "var(--ink-soft)" }}>
              Persona designada por el asociado según el libro oficial de aportaciones.
            </p>
          </div>

          <div className="field" style={{ gridColumn: "1 / -1" }}>
            <label htmlFor="beneficiario">Nombre completo del beneficiario</label>
            <input
              id="beneficiario"
              value={nombreBeneficiario}
              onChange={(e) => setNombreBeneficiario(e.target.value)}
              placeholder="Ej. María Elena Pérez Gómez"
            />
          </div>

          <div className="field">
            <label htmlFor="dpi-ben">DPI del beneficiario</label>
            <input
              id="dpi-ben"
              value={dpiBeneficiario}
              onChange={(e) => setDpiBeneficiario(e.target.value)}
              maxLength={13}
              placeholder="13 dígitos"
            />
          </div>

          <div className="field">
            <label htmlFor="tel-ben">Teléfono del beneficiario</label>
            <input
              id="tel-ben"
              value={telefonoBeneficiario}
              onChange={(e) => setTelefonoBeneficiario(e.target.value)}
              placeholder="8 dígitos"
            />
          </div>
        </div>

        <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.5rem" }}>
          <button type="submit" className="btn" disabled={guardando || !agenciaId}>
            {guardando ? "Guardando…" : "Guardar socio"}
          </button>
          <button type="button" className="btn secondary" onClick={() => navigate(-1)}>
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
