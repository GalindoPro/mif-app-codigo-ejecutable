import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api, mensajeError } from "../lib/api";
import type { Socio, EstadoPrestamo, TipoPrestamo } from "../types";
import { PARENTESCOS_BENEFICIARIO, formatoQ } from "../types";
import {
  formatearDPI,
  formatearTelefono,
  prepararTelefonoParaGuardar,
  capitalizarDescripcion,
} from "../lib/formatters";
import InputNombreAutoCompletar from "../components/InputNombreAutoCompletar";

interface Cuenta {
  id: string;
  numero_cuenta: string;
  tipo: string;
  estado: string;
  saldo_actual: string;
}

interface PrestamoBrief {
  id: string;
  codigo: string;
  tipo: TipoPrestamo;
  estado: EstadoPrestamo;
  monto_aprobado: string | number | null;
  monto_solicitado: string | number;
  saldo_capital: string | number | null;
  cuota_mensual: string | number;
  plazo_meses: number;
  tasa_interes_mensual: string | number;
  fecha_solicitud: string;
  fecha_desembolso: string | null;
  promotor_nombre: string | null;
  ultimo_pago_fecha: string | null;
  es_migracion: boolean;
  numero_credito_anterior: string | null;
}

type SocioConCuentas = Socio & { cuentas: Cuenta[]; prestamos: PrestamoBrief[] };

const TIPO_CUENTA_LABEL: Record<string, string> = {
  APORTACION: "Aportación Estatutaria",
  AHORRO_CORRIENTE: "Ahorro Corriente",
  AHORRO_PROGRAMADO: "Ahorro Programado",
  AHORRO_INFANTO_JUVENIL: "Ahorro Infanto Juvenil",
  AHORRO_SOBRE_PRESTAMO: "Ahorro sobre Préstamo",
  AHORRO_PLAZO_FIJO: "Ahorro a Plazo Fijo",
};

const TIPO_SLUG: Record<string, string> = {
  APORTACION: "aportacion",
  AHORRO_CORRIENTE: "corriente",
  AHORRO_PROGRAMADO: "programado",
  AHORRO_INFANTO_JUVENIL: "infanto-juvenil",
  AHORRO_SOBRE_PRESTAMO: "sobre-prestamo",
  AHORRO_PLAZO_FIJO: "plazo-fijo",
};

export default function SocioDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [socio, setSocio] = useState<SocioConCuentas | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);
  const [editando, setEditando] = useState(false);
  const [guardando, setGuardando] = useState(false);

  // Modal de Apertura de Aportación Inicial
  const [mostrarModalAportacion, setMostrarModalAportacion] = useState(false);
  const [montoApor, setMontoApor] = useState("100");
  const [reciboApor, setReciboApor] = useState("");
  const [abriendoApor, setAbriendoApor] = useState(false);

  const [form, setForm] = useState({
    nombres: "",
    genero: "" as "M" | "F" | "",
    edad: "",
    dpi: "",
    direccion: "",
    telefono: "",
    nombreBeneficiario: "",
    parentescoBeneficiario: "",
    dpiBeneficiario: "",
    telefonoBeneficiario: "",
  });

  const [dpiDuplicado, setDpiDuplicado] = useState<{ nombres: string; numeroAsociado: string } | null>(null);
  const [verificandoDpi, setVerificandoDpi] = useState(false);

  function cargar() {
    if (!id) return;
    api
      .get<SocioConCuentas>(`/socios/${id}`)
      .then(({ data }) => {
        setSocio(data);
        setForm({
          nombres: data.nombres,
          genero: (data.genero as "M" | "F" | "") ?? "",
          edad: data.edad ? String(data.edad) : "",
          dpi: data.dpi ? formatearDPI(data.dpi) : "",
          direccion: data.direccion ?? "",
          telefono: data.telefono ? formatearTelefono(data.telefono) : "",
          nombreBeneficiario: data.nombre_beneficiario ?? "",
          parentescoBeneficiario: data.parentesco_beneficiario ?? "",
          dpiBeneficiario: data.dpi_beneficiario ? formatearDPI(data.dpi_beneficiario) : "",
          telefonoBeneficiario: data.telefono_beneficiario ? formatearTelefono(data.telefono_beneficiario) : "",
        });
      })
      .catch((err) => setError(mensajeError(err)));
  }

  useEffect(cargar, [id]);

  // Verificación en vivo de DPI duplicado en edición (excluyendo este socio)
  useEffect(() => {
    if (!editando) {
      setDpiDuplicado(null);
      setVerificandoDpi(false);
      return;
    }
    const rawDpi = form.dpi.replace(/\D/g, "");
    if (rawDpi.length === 13) {
      setVerificandoDpi(true);
      const timer = setTimeout(() => {
        api
          .get<{
            valido: boolean;
            disponible?: boolean;
            socio?: { nombres: string; numeroAsociado: string };
          }>("/socios/verificar-dpi", { params: { dpi: rawDpi, socioId: id } })
          .then(({ data }) => {
            if (data.disponible === false && data.socio) {
              setDpiDuplicado(data.socio);
            } else {
              setDpiDuplicado(null);
            }
          })
          .catch(() => setDpiDuplicado(null))
          .finally(() => setVerificandoDpi(false));
      }, 250);
      return () => clearTimeout(timer);
    } else {
      setDpiDuplicado(null);
      setVerificandoDpi(false);
    }
  }, [form.dpi, editando, id]);

  async function guardar(e: FormEvent) {
    e.preventDefault();
    if (!id) return;
    if (dpiDuplicado) {
      setError(
        `El DPI ya está registrado para el socio ${dpiDuplicado.nombres} (${dpiDuplicado.numeroAsociado}). Modifícalo antes de guardar.`
      );
      return;
    }
    setGuardando(true);
    setError(null);
    try {
      await api.patch(`/socios/${id}`, {
        nombres: form.nombres,
        genero: form.genero || undefined,
        edad: form.edad ? Number(form.edad) : null,
        dpi: form.dpi ? form.dpi.trim() : undefined,
        direccion: form.direccion || undefined,
        telefono: prepararTelefonoParaGuardar(form.telefono),
        nombreBeneficiario: form.nombreBeneficiario || undefined,
        parentescoBeneficiario: form.parentescoBeneficiario || undefined,
        dpiBeneficiario: form.dpiBeneficiario ? form.dpiBeneficiario.trim() : undefined,
        telefonoBeneficiario: prepararTelefonoParaGuardar(form.telefonoBeneficiario),
      });
      setEditando(false);
      setMensajeExito("Datos del socio actualizados correctamente.");
      setTimeout(() => setMensajeExito(null), 4000);
      cargar();
    } catch (err) {
      setError(mensajeError(err));
    } finally {
      setGuardando(false);
    }
  }

  async function cambiarEstado(nuevoEstado: "ACTIVO" | "INACTIVO") {
    if (!id) return;
    try {
      await api.patch(`/socios/${id}`, { estado: nuevoEstado });
      cargar();
    } catch (err) {
      setError(mensajeError(err));
    }
  }

  async function handleAbrirAportacion(e: FormEvent) {
    e.preventDefault();
    if (!id) return;
    const monto = Number(montoApor);
    if (isNaN(monto) || monto < 100) {
      setError("La aportación estatutaria mínima es de Q 100.00.");
      return;
    }
    setAbriendoApor(true);
    setError(null);
    try {
      const { data } = await api.post(`/socios/${id}/abrir-aportacion`, {
        monto,
        recibo: reciboApor.trim() || undefined,
      });
      setMostrarModalAportacion(false);
      setMensajeExito(`¡Cuenta de Aportación ${data.numero_cuenta} creada con éxito con saldo de ${formatoQ(monto)}! El socio ya puede aperturar cuentas de ahorro y créditos.`);
      setTimeout(() => setMensajeExito(null), 6000);
      cargar();
    } catch (err) {
      setError(mensajeError(err));
    } finally {
      setAbriendoApor(false);
    }
  }

  if (error && !socio) return <div className="alert error">{error}</div>;
  if (!socio) return <p>Cargando…</p>;

  const cuentaAportacion = socio.cuentas.find((c) => c.tipo === "APORTACION");
  const tieneAportacion = Boolean(cuentaAportacion);
  const saldoAportacion = cuentaAportacion ? Number(cuentaAportacion.saldo_actual) : 0;
  const tieneAportacionMinima = saldoAportacion >= 100;

  return (
    <div>
      <div className="page-head">
        <div>
          <button className="link-btn" onClick={() => navigate("/socios")} style={{ marginBottom: "0.5rem" }}>
            ← Volver a socios
          </button>
          <h1>{socio.nombres}</h1>
          <p>
            <span className="mono">{socio.numero_asociado}</span> · {socio.agencia_nombre} · {socio.cuentas.length} cuenta(s) registradas
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap", alignItems: "center" }}>
          {!tieneAportacion && (
            <button
              type="button"
              className="btn"
              style={{ background: "#059669", borderColor: "#059669", fontWeight: 700 }}
              onClick={() => setMostrarModalAportacion(true)}
            >
              ➕ Aperturar Aportación (Q 100)
            </button>
          )}
          <span className={`badge ${socio.estado === "ACTIVO" ? "activo" : "inactivo"}`}>
            {socio.estado === "ACTIVO" ? "Activo" : "Inactivo"}
          </span>
          {socio.estado === "ACTIVO" ? (
            <button className="btn secondary" onClick={() => cambiarEstado("INACTIVO")}>
              Marcar inactivo
            </button>
          ) : (
            <button className="btn secondary" onClick={() => cambiarEstado("ACTIVO")}>
              Reactivar
            </button>
          )}
        </div>
      </div>

      {mensajeExito && <div className="alert success" style={{ marginBottom: "1rem" }}>{mensajeExito}</div>}
      {error && <div className="alert error" style={{ marginBottom: "1rem" }}>{error}</div>}

      {/* ALERTA: SOCIO CON 0 CUENTAS O SIN APORTACIÓN ESTATUTARIA */}
      {!tieneAportacionMinima && (
        <div
          className="alert warning"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "1rem",
            marginBottom: "1.25rem",
            borderLeft: "4px solid #f59e0b",
          }}
        >
          <div>
            <strong style={{ fontSize: "0.95rem" }}>
              ⚠️ Asociado sin Cuenta de Aportaciones Estatutaria ({socio.cuentas.length} cuentas registradas)
            </strong>
            <p style={{ margin: "0.25rem 0 0", fontSize: "0.85rem", color: "var(--ink-soft)" }}>
              Por estatuto cooperativo, todo asociado debe contar con su <strong>Cuenta de Aportación Inicial (Mínimo Q 100.00)</strong> para poder abrir cuentas de Ahorro Corriente, Programado, Plazo Fijo o solicitar Créditos.
            </p>
          </div>
          <button
            type="button"
            className="btn"
            style={{ background: "#059669", borderColor: "#059669", fontWeight: 700, fontSize: "0.88rem" }}
            onClick={() => setMostrarModalAportacion(true)}
          >
            ➕ Aperturar Aportación Inicial (Q 100.00)
          </button>
        </div>
      )}

      {/* PANEL DE ACCIONES RÁPIDAS PARA ESTE SOCIO */}
      <div
        className="card"
        style={{
          marginBottom: "1.25rem",
          background: "var(--paper-raised)",
          border: "1px solid var(--line)",
          padding: "0.85rem 1rem",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.75rem" }}>
          <div>
            <strong style={{ fontSize: "0.88rem", display: "flex", alignItems: "center", gap: "0.35rem" }}>
              <span>⚡</span> Acciones Rápidas para {socio.nombres.split(" ")[0]}
            </strong>
            <span style={{ fontSize: "0.75rem", color: "var(--ink-soft)" }}>
              Abre nuevas cuentas o solicitudes vinculadas automáticamente a este socio:
            </span>
          </div>
          <div style={{ display: "flex", gap: "0.45rem", flexWrap: "wrap" }}>
            {!tieneAportacion && (
              <button
                type="button"
                className="btn"
                style={{ background: "#059669", borderColor: "#059669", fontSize: "0.78rem", padding: "0.25rem 0.6rem" }}
                onClick={() => setMostrarModalAportacion(true)}
              >
                + Aportación
              </button>
            )}
            <Link
              to={`/ahorros/corriente/nueva?socioId=${socio.id}`}
              className="btn secondary"
              style={{ fontSize: "0.78rem", padding: "0.25rem 0.6rem" }}
            >
              + Ahorro Corriente
            </Link>
            <Link
              to={`/ahorros/programado/nueva?socioId=${socio.id}`}
              className="btn secondary"
              style={{ fontSize: "0.78rem", padding: "0.25rem 0.6rem" }}
            >
              + Ahorro Programado
            </Link>
            <Link
              to={`/ahorros/infanto-juvenil/nueva?socioId=${socio.id}`}
              className="btn secondary"
              style={{ fontSize: "0.78rem", padding: "0.25rem 0.6rem" }}
            >
              + Infanto Juvenil
            </Link>
            <Link
              to={`/ahorros/plazo-fijo/nuevo?socioId=${socio.id}`}
              className="btn secondary"
              style={{ fontSize: "0.78rem", padding: "0.25rem 0.6rem" }}
            >
              + Plazo Fijo
            </Link>
            <Link
              to={`/creditos/nuevo?socioId=${socio.id}`}
              className="btn"
              style={{ fontSize: "0.78rem", padding: "0.25rem 0.6rem" }}
            >
              + Solicitar Crédito
            </Link>
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: "1.25rem", alignItems: "start" }}>
        {/* DATOS GENERALES DEL SOCIO */}
        <div className="card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
            <h3 style={{ fontFamily: "inherit", fontSize: "1rem", margin: 0 }}>Datos generales</h3>
            {!editando && (
              <button className="btn secondary" onClick={() => setEditando(true)}>
                ✏️ Editar Datos
              </button>
            )}
          </div>

          {editando ? (
            <form onSubmit={guardar}>
              <div className="field">
                <label htmlFor="edit-nombres">Nombres completos</label>
                <InputNombreAutoCompletar
                  id="edit-nombres"
                  value={form.nombres}
                  onChange={(val) => setForm({ ...form, nombres: val })}
                  required
                />
              </div>
              <div className="field">
                <label htmlFor="edit-genero">Género</label>
                <select
                  id="edit-genero"
                  value={form.genero}
                  onChange={(e) => setForm({ ...form, genero: e.target.value as "M" | "F" | "" })}
                >
                  <option value="">Sin especificar</option>
                  <option value="F">Femenino</option>
                  <option value="M">Masculino</option>
                </select>
              </div>
              <div className="field">
                <label htmlFor="edit-dpi">DPI (13 dígitos)</label>
                <input
                  id="edit-dpi"
                  value={form.dpi}
                  onChange={(e) => setForm({ ...form, dpi: formatearDPI(e.target.value) })}
                  maxLength={15}
                  placeholder="xxxx-xxxxx-xxxx"
                  style={{
                    fontFamily: "monospace",
                    letterSpacing: "0.5px",
                    borderColor: dpiDuplicado ? "var(--danger)" : undefined,
                  }}
                />
                <div style={{ minHeight: "1.1rem", marginTop: "0.15rem" }}>
                  {verificandoDpi && <span className="hint">🔍 Verificando disponibilidad...</span>}
                  {dpiDuplicado && (
                    <span style={{ color: "#ef4444", fontSize: "0.78rem", fontWeight: 600, display: "block" }}>
                      ⚠️ Ya registrado para: {dpiDuplicado.nombres} ({dpiDuplicado.numeroAsociado})
                    </span>
                  )}
                  {!verificandoDpi && !dpiDuplicado && form.dpi.replace(/\D/g, "").length === 13 && (
                    <span style={{ color: "#10b981", fontSize: "0.78rem", fontWeight: 600, display: "block" }}>
                      ✓ DPI válido y disponible (13 dígitos)
                    </span>
                  )}
                </div>
              </div>
              <div className="field">
                <label htmlFor="edit-edad">Edad (años)</label>
                <input
                  id="edit-edad"
                  type="number"
                  min="1"
                  max="120"
                  value={form.edad}
                  onChange={(e) => setForm({ ...form, edad: e.target.value })}
                  placeholder="Ej. 35"
                />
                <span className="hint">Ingreso manual (buena práctica en campo)</span>
              </div>
              <div className="field">
                <label htmlFor="edit-telefono">Teléfono (WhatsApp)</label>
                <div style={{ display: "flex", alignItems: "stretch" }}>
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.25rem",
                      padding: "0 0.65rem",
                      background: "var(--mono-bg, #1e293b)",
                      border: "1px solid var(--line)",
                      borderRight: "none",
                      borderTopLeftRadius: "8px",
                      borderBottomLeftRadius: "8px",
                      fontSize: "0.85rem",
                      fontWeight: 600,
                      color: "var(--ink)",
                      userSelect: "none",
                    }}
                  >
                    🇬🇹 +502
                  </span>
                  <input
                    id="edit-telefono"
                    value={form.telefono}
                    onChange={(e) => setForm({ ...form, telefono: formatearTelefono(e.target.value) })}
                    placeholder="xxxx-xxxx"
                    maxLength={9}
                    style={{
                      borderTopLeftRadius: 0,
                      borderBottomLeftRadius: 0,
                      fontFamily: "monospace",
                      letterSpacing: "0.5px",
                    }}
                  />
                </div>
              </div>
              <div className="field">
                <label htmlFor="edit-direccion">Dirección / Comunidad</label>
                <input
                  id="edit-direccion"
                  value={form.direccion}
                  onChange={(e) => setForm({ ...form, direccion: capitalizarDescripcion(e.target.value) })}
                />
              </div>
              <div className="field">
                <label htmlFor="edit-beneficiario">Persona beneficiaria</label>
                <InputNombreAutoCompletar
                  id="edit-beneficiario"
                  value={form.nombreBeneficiario}
                  onChange={(val) => setForm({ ...form, nombreBeneficiario: val })}
                />
              </div>
              <div className="field">
                <label htmlFor="edit-parentesco-ben">Parentesco con el asociado</label>
                <select
                  id="edit-parentesco-ben"
                  value={form.parentescoBeneficiario}
                  onChange={(e) => setForm({ ...form, parentescoBeneficiario: e.target.value })}
                >
                  <option value="">Selecciona el parentesco…</option>
                  {PARENTESCOS_BENEFICIARIO.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
                <span className="hint">Vínculo familiar del beneficiario</span>
              </div>
              <div className="field">
                <label htmlFor="edit-dpi-ben">DPI Beneficiario</label>
                <input
                  id="edit-dpi-ben"
                  value={form.dpiBeneficiario}
                  onChange={(e) => setForm({ ...form, dpiBeneficiario: formatearDPI(e.target.value) })}
                  maxLength={15}
                  placeholder="xxxx-xxxxx-xxxx"
                />
              </div>
              <div className="field">
                <label htmlFor="edit-tel-ben">Teléfono Beneficiario</label>
                <div style={{ display: "flex", alignItems: "stretch" }}>
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.25rem",
                      padding: "0 0.65rem",
                      background: "var(--mono-bg, #1e293b)",
                      border: "1px solid var(--line)",
                      borderRight: "none",
                      borderTopLeftRadius: "8px",
                      borderBottomLeftRadius: "8px",
                      fontSize: "0.85rem",
                      fontWeight: 600,
                      color: "var(--ink)",
                      userSelect: "none",
                    }}
                  >
                    🇬🇹 +502
                  </span>
                  <input
                    id="edit-tel-ben"
                    value={form.telefonoBeneficiario}
                    onChange={(e) => setForm({ ...form, telefonoBeneficiario: formatearTelefono(e.target.value) })}
                    placeholder="xxxx-xxxx"
                    maxLength={9}
                    style={{
                      borderTopLeftRadius: 0,
                      borderBottomLeftRadius: 0,
                      fontFamily: "monospace",
                      letterSpacing: "0.5px",
                    }}
                  />
                </div>
              </div>
              <div style={{ display: "flex", gap: "0.5rem", marginTop: "1rem" }}>
                <button type="submit" className="btn" disabled={guardando}>
                  {guardando ? "Guardando…" : "Guardar cambios"}
                </button>
                <button type="button" className="btn secondary" onClick={() => setEditando(false)}>
                  Cancelar
                </button>
              </div>
            </form>
          ) : (
            <dl style={{ margin: 0, display: "grid", gridTemplateColumns: "auto 1fr", rowGap: "0.6rem", columnGap: "1rem" }}>
              <dt style={{ color: "var(--ink-soft)", fontSize: "0.85rem" }}>Fecha de ingreso</dt>
              <dd className="mono" style={{ margin: 0 }}>{new Date(socio.fecha_ingreso).toLocaleDateString("es-GT")}</dd>
              <dt style={{ color: "var(--ink-soft)", fontSize: "0.85rem" }}>Género</dt>
              <dd style={{ margin: 0 }}>{socio.genero === "F" ? "Femenino" : socio.genero === "M" ? "Masculino" : "—"}</dd>
              <dt style={{ color: "var(--ink-soft)", fontSize: "0.85rem" }}>Edad</dt>
              <dd className="mono" style={{ margin: 0 }}>{socio.edad ? `${socio.edad} años` : "—"}</dd>
              <dt style={{ color: "var(--ink-soft)", fontSize: "0.85rem" }}>DPI</dt>
              <dd className="mono" style={{ margin: 0 }}>{socio.dpi ? formatearDPI(socio.dpi) : "—"}</dd>
              <dt style={{ color: "var(--ink-soft)", fontSize: "0.85rem" }}>Teléfono</dt>
              <dd style={{ margin: 0 }}>
                {socio.telefono ? (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem" }}>
                    <span className="mono">{socio.telefono}</span>
                    <a
                      href={`https://wa.me/${socio.telefono.replace(/\D/g, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn secondary"
                      style={{ padding: "0.15rem 0.45rem", fontSize: "0.75rem", borderRadius: "4px" }}
                      title="Enviar WhatsApp"
                    >
                      💬 WhatsApp
                    </a>
                  </span>
                ) : (
                  "—"
                )}
              </dd>
              <dt style={{ color: "var(--ink-soft)", fontSize: "0.85rem" }}>Dirección</dt>
              <dd style={{ margin: 0 }}>{socio.direccion ?? "—"}</dd>
              <dt style={{ color: "var(--ink-soft)", fontSize: "0.85rem" }}>Beneficiario</dt>
              <dd style={{ margin: 0 }}>
                <strong>{socio.nombre_beneficiario ?? "—"}</strong>
                {socio.parentesco_beneficiario && (
                  <span
                    style={{
                      marginLeft: "0.45rem",
                      fontSize: "0.78rem",
                      fontWeight: 600,
                      padding: "0.12rem 0.45rem",
                      borderRadius: "4px",
                      background: "var(--mono-bg)",
                      border: "1px solid var(--line)",
                      color: "var(--accent)",
                    }}
                  >
                    {socio.parentesco_beneficiario}
                  </span>
                )}
                {(socio.dpi_beneficiario || socio.telefono_beneficiario) && (
                  <div style={{ fontSize: "0.8rem", color: "var(--ink-soft)", marginTop: "0.2rem" }}>
                    {socio.dpi_beneficiario ? `DPI: ${formatearDPI(socio.dpi_beneficiario)} ` : ""}
                    {socio.telefono_beneficiario ? `· Tel: ${socio.telefono_beneficiario}` : ""}
                  </div>
                )}
              </dd>
            </dl>
          )}
        </div>

        {/* CUENTAS DEL ASOCIADO */}
        <div className="card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
            <h3 style={{ fontFamily: "inherit", fontSize: "1rem", margin: 0 }}>
              Cuentas Registradas ({socio.cuentas.length})
            </h3>
            {!tieneAportacion && (
              <button
                type="button"
                className="btn secondary"
                style={{ fontSize: "0.78rem", padding: "0.2rem 0.5rem", borderColor: "#059669", color: "#10b981" }}
                onClick={() => setMostrarModalAportacion(true)}
              >
                + Aportación
              </button>
            )}
          </div>

          {socio.cuentas.length === 0 ? (
            <div style={{ textAlign: "center", padding: "1.5rem 0.5rem", color: "var(--ink-soft)" }}>
              <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>📂</div>
              <p style={{ margin: "0 0 0.75rem", fontSize: "0.88rem" }}>
                Este socio todavía no tiene cuentas activas en el sistema.
              </p>
              <button
                type="button"
                className="btn"
                style={{ background: "#059669", borderColor: "#059669", fontWeight: 700, fontSize: "0.82rem" }}
                onClick={() => setMostrarModalAportacion(true)}
              >
                ➕ Aperturar Cuenta de Aportaciones (Q 100)
              </button>
            </div>
          ) : (
            <div className="table-wrap" style={{ border: "1px solid var(--line)" }}>
              <table style={{ fontSize: "0.82rem", width: "100%", margin: 0 }}>
                <thead>
                  <tr style={{ background: "var(--paper-raised)" }}>
                    <th style={{ padding: "4px 8px" }}>Cuenta</th>
                    <th style={{ padding: "4px 8px" }}>Tipo</th>
                    <th style={{ textAlign: "right", padding: "4px 8px" }}>Saldo</th>
                    <th style={{ width: "90px", textAlign: "center", padding: "4px 8px" }}></th>
                  </tr>
                </thead>
                <tbody>
                  {socio.cuentas.map((c) => {
                    const slug = TIPO_SLUG[c.tipo];
                    const esApor = c.tipo === "APORTACION";
                    return (
                      <tr key={c.id}>
                        <td className="mono" style={{ fontWeight: 600, padding: "4px 8px" }}>
                          {slug ? (
                            <Link to={`/ahorros/${slug}/${c.id}`}>{c.numero_cuenta}</Link>
                          ) : (
                            c.numero_cuenta
                          )}
                        </td>
                        <td style={{ padding: "4px 8px" }}>
                          <span
                            className="badge"
                            style={{
                              background: esApor ? "rgba(5, 150, 105, 0.15)" : undefined,
                              color: esApor ? "#059669" : undefined,
                              fontWeight: 600,
                            }}
                          >
                            {TIPO_CUENTA_LABEL[c.tipo] ?? c.tipo}
                          </span>
                        </td>
                        <td className="mono" style={{ textAlign: "right", fontWeight: 700, padding: "4px 8px" }}>
                          {formatoQ(c.saldo_actual)}
                        </td>
                        <td style={{ textAlign: "center", padding: "4px 8px" }}>
                          {slug ? (
                            <Link to={`/ahorros/${slug}/${c.id}`} style={{ fontSize: "0.78rem", textDecoration: "none" }}>
                              Ver →
                            </Link>
                          ) : (
                            <Link to="/aportaciones" style={{ fontSize: "0.78rem", textDecoration: "none" }}>
                              Ver →
                            </Link>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* MODAL RÁPIDO DE APERTURA DE CUENTA DE APORTACIÓN */}
      {mostrarModalAportacion && (
        <div
          className="caja-chica-modal-overlay"
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
          }}
        >
          <div
            className="card"
            style={{
              width: "100%",
              maxWidth: "500px",
              background: "var(--paper)",
              borderRadius: "10px",
              boxShadow: "0 20px 40px -10px rgba(0, 0, 0, 0.5)",
              border: "1px solid var(--line)",
              padding: "1.25rem",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem", borderBottom: "1px solid var(--line)", paddingBottom: "0.5rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                <span style={{ fontSize: "1.25rem" }}>🏛️</span>
                <h3 style={{ margin: 0, fontSize: "1.1rem" }}>Aperturar Cuenta de Aportaciones</h3>
              </div>
              <button
                type="button"
                className="btn secondary"
                style={{ padding: "0.2rem 0.5rem", fontSize: "0.85rem" }}
                onClick={() => setMostrarModalAportacion(false)}
              >
                ✕
              </button>
            </div>

            <p style={{ fontSize: "0.85rem", color: "var(--ink-soft)", margin: "0 0 1rem" }}>
              Asociado: <strong>{socio.nombres}</strong> (<span className="mono">{socio.numero_asociado}</span>) · Agencia: {socio.agencia_nombre}
            </p>

            <form onSubmit={handleAbrirAportacion}>
              <div className="field">
                <label htmlFor="modal-monto-apor">
                  Monto de Aportación Inicial (Q) <span style={{ color: "#059669", fontWeight: 700 }}>* Mínimo Q 100.00</span>
                </label>
                <input
                  id="modal-monto-apor"
                  type="number"
                  min="100"
                  step="0.01"
                  value={montoApor}
                  onChange={(e) => setMontoApor(e.target.value)}
                  required
                  style={{ fontSize: "1rem", fontWeight: 700 }}
                />
                <span className="hint">Monto estatutario obligatorio para operar en la cooperativa.</span>
              </div>

              <div className="field">
                <label htmlFor="modal-recibo-apor">No. de Recibo o Comprobante (Opcional)</label>
                <input
                  id="modal-recibo-apor"
                  type="text"
                  value={reciboApor}
                  onChange={(e) => setReciboApor(e.target.value)}
                  placeholder="Ej. REC-009842"
                />
              </div>

              <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end", marginTop: "1.25rem" }}>
                <button
                  type="button"
                  className="btn secondary"
                  onClick={() => setMostrarModalAportacion(false)}
                  disabled={abriendoApor}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn"
                  style={{ background: "#059669", borderColor: "#059669", fontWeight: 700 }}
                  disabled={abriendoApor}
                >
                  {abriendoApor ? "Creando cuenta…" : "✓ Confirmar y Crear Aportación"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <p style={{ marginTop: "1.5rem" }}>
        <Link to="/socios">← Volver al listado</Link>
      </p>
    </div>
  );
}
