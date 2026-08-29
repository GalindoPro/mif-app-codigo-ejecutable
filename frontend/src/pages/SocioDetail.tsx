import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api, mensajeError } from "../lib/api";
import type { Socio } from "../types";

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
    dpi: "",
    direccion: "",
    telefono: "",
    nombreBeneficiario: "",
  });

  function cargar() {
    if (!id) return;
    api
      .get<SocioConCuentas>(`/socios/${id}`)
      .then(({ data }) => {
        setSocio(data);
        setForm({
          nombres: data.nombres,
          dpi: data.dpi ?? "",
          direccion: data.direccion ?? "",
          telefono: data.telefono ?? "",
          nombreBeneficiario: data.nombre_beneficiario ?? "",
        });
      })
      .catch((err) => setError(mensajeError(err)));
  }

  useEffect(cargar, [id]);

  async function guardar(e: FormEvent) {
    e.preventDefault();
    if (!id) return;
    setGuardando(true);
    setError(null);
    try {
      await api.patch(`/socios/${id}`, {
        nombres: form.nombres,
        dpi: form.dpi || undefined,
        direccion: form.direccion || undefined,
        telefono: form.telefono || undefined,
        nombreBeneficiario: form.nombreBeneficiario || undefined,
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
                <input
                  id="edit-nombres"
                  value={form.nombres}
                  onChange={(e) => setForm({ ...form, nombres: e.target.value })}
                  required
                />
              </div>
              <div className="field">
                <label htmlFor="edit-dpi">DPI</label>
                <input
                  id="edit-dpi"
                  value={form.dpi}
                  onChange={(e) => setForm({ ...form, dpi: e.target.value })}
                  maxLength={13}
                />
              </div>
              <div className="field">
                <label htmlFor="edit-telefono">Teléfono</label>
                <input
                  id="edit-telefono"
                  value={form.telefono}
                  onChange={(e) => setForm({ ...form, telefono: e.target.value })}
                />
              </div>
              <div className="field">
                <label htmlFor="edit-direccion">Dirección</label>
                <input
                  id="edit-direccion"
                  value={form.direccion}
                  onChange={(e) => setForm({ ...form, direccion: e.target.value })}
                />
              </div>
              <div className="field">
                <label htmlFor="edit-beneficiario">Persona beneficiaria</label>
                <input
                  id="edit-beneficiario"
                  value={form.nombreBeneficiario}
                  onChange={(e) => setForm({ ...form, nombreBeneficiario: e.target.value })}
                />
              </div>
              <div style={{ display: "flex", gap: "0.6rem" }}>
                <button className="btn" type="submit" disabled={guardando}>
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
              <dt style={{ color: "var(--ink-soft)", fontSize: "0.85rem" }}>DPI</dt>
              <dd className="mono" style={{ margin: 0 }}>{socio.dpi ?? "—"}</dd>
              <dt style={{ color: "var(--ink-soft)", fontSize: "0.85rem" }}>Teléfono</dt>
              <dd style={{ margin: 0 }}>{socio.telefono ?? "—"}</dd>
              <dt style={{ color: "var(--ink-soft)", fontSize: "0.85rem" }}>Dirección</dt>
              <dd style={{ margin: 0 }}>{socio.direccion ?? "—"}</dd>
              <dt style={{ color: "var(--ink-soft)", fontSize: "0.85rem" }}>Beneficiario</dt>
              <dd style={{ margin: 0 }}>{socio.nombre_beneficiario ?? "—"}</dd>
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
