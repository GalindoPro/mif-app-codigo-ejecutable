import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api, mensajeError } from "../lib/api";
import type { Socio } from "../types";
import { PARENTESCOS_BENEFICIARIO } from "../types";
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

type SocioConCuentas = Socio & { cuentas: Cuenta[] };

const TIPO_CUENTA_LABEL: Record<string, string> = {
  APORTACION: "Aportación",
  AHORRO_CORRIENTE: "Ahorro corriente",
  AHORRO_PROGRAMADO: "Ahorro programado",
  AHORRO_INFANTO_JUVENIL: "Ahorro infanto juvenil",
  AHORRO_PLAZO_FIJO: "Ahorro a plazo fijo",
};

const TIPO_SLUG: Record<string, string> = {
  AHORRO_CORRIENTE: "corriente",
  AHORRO_PROGRAMADO: "programado",
  AHORRO_INFANTO_JUVENIL: "infanto-juvenil",
  AHORRO_PLAZO_FIJO: "plazo-fijo",
};

export default function SocioDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [socio, setSocio] = useState<SocioConCuentas | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editando, setEditando] = useState(false);
  const [guardando, setGuardando] = useState(false);

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

  if (error && !socio) return <div className="alert error">{error}</div>;
  if (!socio) return <p>Cargando…</p>;

  return (
    <div>
      <div className="page-head">
        <div>
          <button className="link-btn" onClick={() => navigate("/socios")} style={{ marginBottom: "0.5rem" }}>
            ← Volver a socios
          </button>
          <h1>{socio.nombres}</h1>
          <p>
            <span className="mono">{socio.numero_asociado}</span> · {socio.agencia_nombre}
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.6rem" }}>
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

      {error && <div className="alert error">{error}</div>}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem", alignItems: "start" }}>
        <div className="card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
            <h3 style={{ fontFamily: "inherit", fontSize: "1rem" }}>Datos generales</h3>
            {!editando && (
              <button className="btn secondary" onClick={() => setEditando(true)}>
                Editar
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
                  style={{ fontFamily: "monospace", letterSpacing: "0.5px" }}
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
              <div style={{ display: "flex", gap: "0.6rem" }}>
                <button
                  className="btn"
                  type="submit"
                  disabled={guardando || Boolean(dpiDuplicado) || verificandoDpi}
                >
                  {guardando ? "Guardando…" : "Guardar cambios"}
                </button>
                <button className="btn secondary" type="button" onClick={() => setEditando(false)}>
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

        <div className="card">
          <h3 style={{ fontFamily: "inherit", fontSize: "1rem", marginBottom: "0.75rem" }}>Cuentas</h3>
          {socio.cuentas.length === 0 ? (
            <p style={{ color: "var(--ink-soft)", fontSize: "0.9rem" }}>
              Este socio todavía no tiene cuentas registradas. La apertura de cuentas de ahorro y plazo fijo se
              habilita en la fase 2.
            </p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Cuenta</th>
                  <th>Tipo</th>
                  <th>Saldo</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {socio.cuentas.map((c) => {
                  const slug = TIPO_SLUG[c.tipo];
                  return (
                    <tr key={c.id}>
                      <td className="mono">
                        {slug ? (
                          <Link to={`/ahorros/${slug}/${c.id}`}>{c.numero_cuenta}</Link>
                        ) : (
                          c.numero_cuenta
                        )}
                      </td>
                      <td>{TIPO_CUENTA_LABEL[c.tipo] ?? c.tipo}</td>
                      <td className="mono">Q {Number(c.saldo_actual).toLocaleString("es-GT", { minimumFractionDigits: 2 })}</td>
                      <td>
                        {slug && (
                          <Link to={`/ahorros/${slug}/${c.id}`} style={{ fontSize: "0.85rem", textDecoration: "none" }}>
                            Ver movimientos →
                          </Link>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <p style={{ marginTop: "1.5rem" }}>
        <Link to="/socios">← Volver al listado</Link>
      </p>
    </div>
  );
}
