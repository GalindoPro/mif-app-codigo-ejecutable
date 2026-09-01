import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { api, mensajeError } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import BuscadorSocio from "../components/BuscadorSocio";
import type {
  Agencia,
  Socio,
  TipoPrestamo,
  UsuarioItem,
} from "../types";
import {
  capitalizarDescripcion,
  formatearDPI,
  formatearTelefono,
  limpiarDPI,
  prepararTelefonoParaGuardar,
} from "../lib/formatters";
import InputNombreAutoCompletar from "../components/InputNombreAutoCompletar";

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
  const [montoSolicitado, setMontoSolicitado] = useState(searchParams.get("monto") || "10000");
  const [plazoMeses, setPlazoMeses] = useState(searchParams.get("plazo") || "12");
  const [destino, setDestino] = useState("Capital de trabajo / Comercio");
  const [garantia, setGarantia] = useState("");
  const [ubicacionGarantia, setUbicacionGarantia] = useState("");
  const [nombreFiador, setNombreFiador] = useState("");
  const [dpiFiador, setDpiFiador] = useState("");
  const [telefonoFiador, setTelefonoFiador] = useState("");
  const [documentoDesembolso, setDocumentoDesembolso] = useState("");
  const [crearCuentaAhorro, setCrearCuentaAhorro] = useState(true);

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
        tipoAmortizacion: "SOBRE_SALDOS",
        montoSolicitado: Number(montoSolicitado),
        plazoMeses: Number(plazoMeses),
        tasaInteresMensual: 2.0,
        destino: destino || undefined,
        garantia:
          tipo === "FIDUCIARIO"
            ? nombreFiador
              ? `Fiador: ${nombreFiador}${dpiFiador ? `, DPI: ${dpiFiador}` : ""}${telefonoFiador ? `, Tel: ${telefonoFiador}` : ""}`
              : undefined
            : garantia || undefined,
        ubicacionGarantia: ubicacionGarantia || undefined,
        nombreFiador: tipo === "FIDUCIARIO" ? nombreFiador || undefined : undefined,
        dpiFiador: tipo === "FIDUCIARIO" ? (dpiFiador ? limpiarDPI(dpiFiador) : undefined) : undefined,
        telefonoFiador: tipo === "FIDUCIARIO" ? (telefonoFiador ? prepararTelefonoParaGuardar(telefonoFiador) : undefined) : undefined,
        documentoDesembolso: tipo === "HIPOTECARIO" ? documentoDesembolso || undefined : undefined,
        crearCuentaAhorroSobrePrestamo: crearCuentaAhorro,
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
              <option value="FIDUCIARIO">Fiduciario</option>
              <option value="HIPOTECARIO">Hipotecario</option>
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
            <label htmlFor="cred-tasa">Tasa de interés mensual</label>
            <input
              id="cred-tasa"
              value="2.0% mensual"
              readOnly
              disabled
              style={{
                background: "rgba(0,0,0,0.06)",
                cursor: "not-allowed",
                fontWeight: 700,
                color: "var(--ink)",
              }}
            />
            <span className="hint">🔒 Tasa oficial cooperativa: 2.0% mensual fija</span>
          </div>

          <div className="field">
            <label>Sistema de amortización</label>
            <input
              value="Sobre saldos (Capital constante)"
              readOnly
              disabled
              style={{
                background: "rgba(0,0,0,0.06)",
                cursor: "not-allowed",
                fontWeight: 700,
                color: "var(--ink)",
              }}
            />
            <span className="hint">🔒 Sistema oficial MIF: Amortización sobre saldos</span>
          </div>

          <div className="field" style={{ gridColumn: "1 / -1" }}>
            <label htmlFor="cred-destino">Destino del crédito</label>
            <input
              id="cred-destino"
              value={destino}
              onChange={(e) => setDestino(capitalizarDescripcion(e.target.value))}
              placeholder="Ej. Compra de mercadería para tienda, abono agrícola, etc."
            />
          </div>

          {tipo === "FIDUCIARIO" && (
            <div
              style={{
                gridColumn: "1 / -1",
                background: "var(--paper-raised)",
                border: "1px solid var(--line)",
                borderRadius: "10px",
                padding: "1rem 1.25rem",
                marginTop: "0.25rem",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.85rem" }}>
                <span style={{ fontSize: "1.15rem" }}>👤</span>
                <h3 style={{ margin: 0, fontSize: "1rem", color: "var(--ink)", fontWeight: 700 }}>
                  Datos del Fiador (Garantía Fiduciaria)
                </h3>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1rem" }}>
                <div className="field">
                  <label htmlFor="fiador-nombre">Nombre completo del fiador</label>
                  <InputNombreAutoCompletar
                    id="fiador-nombre"
                    value={nombreFiador}
                    onChange={setNombreFiador}
                    placeholder="Ej. Juan Escobar del Barrio"
                  />
                </div>

                <div className="field">
                  <label htmlFor="fiador-dpi">No. de DPI del fiador</label>
                  <input
                    id="fiador-dpi"
                    value={dpiFiador}
                    onChange={(e) => setDpiFiador(formatearDPI(e.target.value))}
                    placeholder="xxxx-xxxxx-xxxx (13 dígitos)"
                    maxLength={15}
                  />
                  <span className="hint">{limpiarDPI(dpiFiador).length}/13 dígitos</span>
                </div>

                <div className="field">
                  <label htmlFor="fiador-tel">Teléfono del fiador</label>
                  <div style={{ display: "flex", alignItems: "center" }}>
                    <span
                      style={{
                        padding: "0.55rem 0.65rem",
                        background: "rgba(0,0,0,0.05)",
                        border: "1px solid var(--line)",
                        borderRight: "none",
                        borderRadius: "8px 0 0 8px",
                        fontSize: "0.85rem",
                        color: "var(--ink-soft)",
                        fontWeight: 600,
                      }}
                    >
                      +502
                    </span>
                    <input
                      id="fiador-tel"
                      value={telefonoFiador}
                      onChange={(e) => setTelefonoFiador(formatearTelefono(e.target.value))}
                      placeholder="xxxx-xxxx"
                      maxLength={9}
                      style={{ borderRadius: "0 8px 8px 0" }}
                    />
                  </div>
                </div>

                <div className="field">
                  <label htmlFor="fiador-lugar">Lugar / Comunidad o Trabajo del fiador</label>
                  <input
                    id="fiador-lugar"
                    value={ubicacionGarantia}
                    onChange={(e) => setUbicacionGarantia(capitalizarDescripcion(e.target.value))}
                    placeholder="Ej. Cantón Ilom, Chajul"
                  />
                </div>
              </div>
            </div>
          )}

          {tipo === "HIPOTECARIO" && (
            <div
              style={{
                gridColumn: "1 / -1",
                background: "var(--paper-raised)",
                border: "1px solid var(--line)",
                borderRadius: "10px",
                padding: "1rem 1.25rem",
                marginTop: "0.25rem",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.85rem" }}>
                <span style={{ fontSize: "1.15rem" }}>🏡</span>
                <h3 style={{ margin: 0, fontSize: "1rem", color: "var(--ink)", fontWeight: 700 }}>
                  Datos de la Garantía Hipotecaria (Bien Inmueble)
                </h3>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1rem" }}>
                <div className="field" style={{ gridColumn: "1 / -1" }}>
                  <label htmlFor="hip-desc">Descripción del bien inmueble o terreno</label>
                  <input
                    id="hip-desc"
                    value={garantia}
                    onChange={(e) => setGarantia(capitalizarDescripcion(e.target.value))}
                    placeholder="Ej. Terreno de 20x30 mts con cultivo de café y construcción de block"
                  />
                </div>

                <div className="field">
                  <label htmlFor="hip-doc">No. de Finca / Folio / Libro (o Título de posesión)</label>
                  <input
                    id="hip-doc"
                    value={documentoDesembolso}
                    onChange={(e) => setDocumentoDesembolso(e.target.value)}
                    placeholder="Ej. Finca 1245, Folio 45, Libro 89 de El Quiché"
                  />
                </div>

                <div className="field">
                  <label htmlFor="hip-lugar">Ubicación / Comunidad del inmueble</label>
                  <input
                    id="hip-lugar"
                    value={ubicacionGarantia}
                    onChange={(e) => setUbicacionGarantia(capitalizarDescripcion(e.target.value))}
                    placeholder="Ej. Aldea Xolcuay, Chajul, Quiché"
                  />
                </div>
              </div>
            </div>
          )}

          <div
            className="field"
            style={{
              gridColumn: "1 / -1",
              background: "rgba(16, 185, 129, 0.08)",
              border: "1px solid rgba(16, 185, 129, 0.3)",
              borderRadius: "8px",
              padding: "0.85rem 1rem",
            }}
          >
            <label style={{ display: "flex", alignItems: "center", gap: "0.6rem", cursor: "pointer", fontWeight: 700, color: "#065f46" }}>
              <input
                type="checkbox"
                checked={crearCuentaAhorro}
                onChange={(e) => setCrearCuentaAhorro(e.target.checked)}
                style={{ width: "1.15rem", height: "1.15rem" }}
              />
              🛡️ Apertura automática de Cuenta de Ahorro sobre Préstamo (Garantía de Crédito)
            </label>
            <p style={{ margin: "0.4rem 0 0 1.75rem", fontSize: "0.82rem", color: "var(--ink-soft)", lineHeight: 1.4 }}>
              Abre automáticamente una cuenta de ahorro vinculada a este crédito. Los fondos permanecerán bloqueados (no se tocan)
              hasta la cancelación total del préstamo, protegiendo a la cooperativa para cubrir cuotas atrasadas ante cualquier impago.
            </p>
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
