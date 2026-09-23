import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api, mensajeError } from "../lib/api";
import type { Socio, EstadoPrestamo, TipoPrestamo } from "../types";
import {
  PARENTESCOS_BENEFICIARIO,
  PARENTESCOS_BENEFICIARIO_MENOR,
  formatoQ,
} from "../types";
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
  const [cuotaIngresoApor, setCuotaIngresoApor] = useState("");
  const [abriendoApor, setAbriendoApor] = useState(false);

  const [form, setForm] = useState({
    nombres: "",
    genero: "" as "M" | "F" | "",
    dpi: "",
    direccion: "",
    telefono: "",
    nombreBeneficiario: "",
    parentescoBeneficiario: "",
    dpiBeneficiario: "",
    telefonoBeneficiario: "",
  });

  const [dpiDuplicado, setDpiDuplicado] = useState<{ nombres: string; numeroAsociado: string; rol?: string } | null>(null);
  const [verificandoDpi, setVerificandoDpi] = useState(false);

  const [telefonoDuplicado, setTelefonoDuplicado] = useState<{ nombres: string; numeroAsociado: string; rol?: string } | null>(null);
  const [verificandoTelefono, setVerificandoTelefono] = useState(false);

  const [dpiDuplicadoBen, setDpiDuplicadoBen] = useState<{ nombres: string; numeroAsociado: string; rol?: string } | null>(null);
  const [verificandoDpiBen, setVerificandoDpiBen] = useState(false);

  const [telefonoDuplicadoBen, setTelefonoDuplicadoBen] = useState<{ nombres: string; numeroAsociado: string; rol?: string } | null>(null);
  const [verificandoTelefonoBen, setVerificandoTelefonoBen] = useState(false);

  const esMenorBeneficiario = form.parentescoBeneficiario && PARENTESCOS_BENEFICIARIO_MENOR.includes(form.parentescoBeneficiario as any);

  function cargar() {
    if (!id) return;
    api
      .get<SocioConCuentas>(`/socios/${id}`)
      .then(({ data }) => {
        setSocio(data);
        setForm({
          nombres: data.nombres,
          genero: (data.genero as "M" | "F" | "") ?? "",
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
            registrado?: { nombres: string; numeroAsociado: string; rol?: string };
            socio?: { nombres: string; numeroAsociado: string };
          }>("/socios/verificar-dpi", { params: { dpi: rawDpi, socioId: id } })
          .then(({ data }) => {
            if (data.disponible === false && data.registrado) {
              setDpiDuplicado(data.registrado);
            } else if (data.disponible === false && data.socio) {
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

  // Verificación Teléfono Socio
  useEffect(() => {
    if (!editando) {
      setTelefonoDuplicado(null);
      setVerificandoTelefono(false);
      return;
    }
    const rawTel = form.telefono.replace(/\D/g, "");
    const localTel = rawTel.startsWith("502") && rawTel.length > 8 ? rawTel.slice(3) : rawTel.slice(-8);
    if (localTel.length === 8) {
      setVerificandoTelefono(true);
      const timer = setTimeout(() => {
        api
          .get<{
            valido: boolean;
            disponible?: boolean;
            registrado?: { nombres: string; numeroAsociado: string; rol: string };
          }>("/socios/verificar-telefono", { params: { telefono: localTel, socioId: id, tipo: "SOCIO" } })
          .then(({ data }) => {
            if (data.disponible === false && data.registrado) {
              setTelefonoDuplicado(data.registrado);
            } else {
              setTelefonoDuplicado(null);
            }
          })
          .catch(() => setTelefonoDuplicado(null))
          .finally(() => setVerificandoTelefono(false));
      }, 250);
      return () => clearTimeout(timer);
    } else {
      setTelefonoDuplicado(null);
      setVerificandoTelefono(false);
    }
  }, [form.telefono, editando, id]);

  // Verificación DPI Beneficiario
  useEffect(() => {
    if (!editando || esMenorBeneficiario) {
      setDpiDuplicadoBen(null);
      setVerificandoDpiBen(false);
      return;
    }
    const rawDpi = form.dpiBeneficiario.replace(/\D/g, "");
    if (rawDpi.length === 13) {
      setVerificandoDpiBen(true);
      const timer = setTimeout(() => {
        api
          .get<{
            valido: boolean;
            disponible?: boolean;
            registrado?: { nombres: string; numeroAsociado: string; rol: string };
            socio?: { nombres: string; numeroAsociado: string };
          }>("/socios/verificar-dpi", { params: { dpi: rawDpi, socioId: id, tipo: "BENEFICIARIO" } })
          .then(({ data }) => {
            if (data.disponible === false && data.registrado) {
              setDpiDuplicadoBen(data.registrado);
            } else if (data.disponible === false && data.socio) {
              setDpiDuplicadoBen({ ...data.socio, rol: "Socio registrado" });
            } else {
              setDpiDuplicadoBen(null);
            }
          })
          .catch(() => setDpiDuplicadoBen(null))
          .finally(() => setVerificandoDpiBen(false));
      }, 250);
      return () => clearTimeout(timer);
    } else {
      setDpiDuplicadoBen(null);
      setVerificandoDpiBen(false);
    }
  }, [form.dpiBeneficiario, editando, id, esMenorBeneficiario]);

  // Verificación Teléfono Beneficiario
  useEffect(() => {
    if (!editando || esMenorBeneficiario) {
      setTelefonoDuplicadoBen(null);
      setVerificandoTelefonoBen(false);
      return;
    }
    const rawTel = form.telefonoBeneficiario.replace(/\D/g, "");
    const localTel = rawTel.startsWith("502") && rawTel.length > 8 ? rawTel.slice(3) : rawTel.slice(-8);
    if (localTel.length === 8) {
      setVerificandoTelefonoBen(true);
      const timer = setTimeout(() => {
        api
          .get<{
            valido: boolean;
            disponible?: boolean;
            registrado?: { nombres: string; numeroAsociado: string; rol: string };
          }>("/socios/verificar-telefono", { params: { telefono: localTel, socioId: id, tipo: "BENEFICIARIO" } })
          .then(({ data }) => {
            if (data.disponible === false && data.registrado) {
              setTelefonoDuplicadoBen(data.registrado);
            } else {
              setTelefonoDuplicadoBen(null);
            }
          })
          .catch(() => setTelefonoDuplicadoBen(null))
          .finally(() => setVerificandoTelefonoBen(false));
      }, 250);
      return () => clearTimeout(timer);
    } else {
      setTelefonoDuplicadoBen(null);
      setVerificandoTelefonoBen(false);
    }
  }, [form.telefonoBeneficiario, editando, id, esMenorBeneficiario]);

  async function guardar(e: FormEvent) {
    e.preventDefault();
    if (!id) return;
    if (dpiDuplicado) {
      setError(
        `El DPI ya está registrado (${dpiDuplicado.rol || "Socio"}: ${dpiDuplicado.nombres}, Asociado: ${dpiDuplicado.numeroAsociado}). Modifícalo antes de guardar.`
      );
      return;
    }
    if (telefonoDuplicado) {
      setError(
        `El teléfono ya está registrado (${telefonoDuplicado.rol || "Socio"}: ${telefonoDuplicado.nombres}, Asociado: ${telefonoDuplicado.numeroAsociado}). Modifícalo antes de guardar.`
      );
      return;
    }
    if (!esMenorBeneficiario && dpiDuplicadoBen) {
      setError(
        `El DPI/CUI del beneficiario ya pertenece a un registro (${dpiDuplicadoBen.rol || "Socio"}: ${dpiDuplicadoBen.nombres}, Asociado: ${dpiDuplicadoBen.numeroAsociado}). Modifícalo antes de guardar.`
      );
      return;
    }
    if (!esMenorBeneficiario && telefonoDuplicadoBen) {
      setError(
        `El teléfono del beneficiario ya pertenece a un registro (${telefonoDuplicadoBen.rol || "Socio"}: ${telefonoDuplicadoBen.nombres}, Asociado: ${telefonoDuplicadoBen.numeroAsociado}). Modifícalo antes de guardar.`
      );
      return;
    }

    const cleanDpi = form.dpi ? form.dpi.replace(/\D/g, "") : "";
    const cleanDpiBen = form.dpiBeneficiario ? form.dpiBeneficiario.replace(/\D/g, "") : "";
    if (cleanDpi && cleanDpiBen && cleanDpi === cleanDpiBen) {
      setError("El DPI del socio y el DPI/CUI del beneficiario no pueden ser iguales.");
      return;
    }

    const cleanTel = form.telefono ? form.telefono.replace(/\D/g, "") : "";
    const cleanTelBen = form.telefonoBeneficiario ? form.telefonoBeneficiario.replace(/\D/g, "") : "";
    if (cleanTel && cleanTelBen && cleanTel === cleanTelBen) {
      setError("El teléfono del socio y el teléfono del beneficiario no pueden ser iguales.");
      return;
    }
    setGuardando(true);
    setError(null);
    try {
      await api.patch(`/socios/${id}`, {
        nombres: form.nombres,
        genero: form.genero || undefined,
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
    const cuotaIngreso = cuotaIngresoApor.trim() ? Number(cuotaIngresoApor) : undefined;
    if (cuotaIngreso !== undefined && (isNaN(cuotaIngreso) || cuotaIngreso < 0)) {
      setError("La cuota de ingreso debe ser mayor a 0.");
      return;
    }
    setAbriendoApor(true);
    setError(null);
    try {
      const { data } = await api.post(`/socios/${id}/abrir-aportacion`, {
        monto,
        recibo: reciboApor.trim() || undefined,
        cuotaIngreso: cuotaIngreso,
      });
      setMostrarModalAportacion(false);
      setCuotaIngresoApor("");
      setReciboApor("");
      const msgCuota = data.cuotaIngresoRegistrada
        ? ` La cuota de ingreso de Q ${cuotaIngreso?.toFixed(2)} fue registrada en la caja del día.`
        : cuotaIngreso && cuotaIngreso > 0 ? " (No hay caja abierta hoy: la cuota de ingreso no pudo registrarse en caja)" : "";
      setMensajeExito(`¡Cuenta de Aportación ${data.numero_cuenta} creada con éxito con saldo de ${formatoQ(monto)}!${msgCuota} El socio ya puede aperturar cuentas de ahorro y créditos.`);
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

  // Cálculos de portafolio financiero del socio
  const totalAhorroLiquido = socio.cuentas
    .filter((c) => ["AHORRO_CORRIENTE", "AHORRO_PROGRAMADO", "AHORRO_INFANTO_JUVENIL", "AHORRO_SOBRE_PRESTAMO"].includes(c.tipo))
    .reduce((acc, c) => acc + Number(c.saldo_actual || 0), 0);

  const totalPlazoFijo = socio.cuentas
    .filter((c) => c.tipo === "AHORRO_PLAZO_FIJO")
    .reduce((acc, c) => acc + Number(c.saldo_actual || 0), 0);

  const totalCreditosActivos = (socio.prestamos || [])
    .filter((p) => ["APROBADO", "DESEMBOLSADO", "MIGRADO_ACTIVO"].includes(p.estado))
    .reduce((acc, p) => acc + Number(p.saldo_capital ?? p.monto_aprobado ?? p.monto_solicitado ?? 0), 0);

  const iniciales = socio.nombres
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", paddingBottom: "2rem" }}>
      {/* NAVEGACIÓN Y ENLACE DE RETORNO */}
      <div style={{ marginBottom: "0.75rem" }}>
        <button
          className="link-btn"
          onClick={() => navigate("/socios")}
          style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem", fontSize: "0.82rem", fontWeight: 700 }}
        >
          ← Volver a listado de asociados
        </button>
      </div>

      {/* TARJETA DE PERFIL HERO / CABECERA EJECUTIVA */}
      <div
        className="card"
        style={{
          background: "linear-gradient(135deg, var(--paper) 0%, var(--paper-raised) 100%)",
          border: "1px solid var(--line)",
          borderRadius: "12px",
          padding: "1.2rem 1.4rem",
          marginBottom: "1rem",
          boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "1rem",
        }}
      >
        {/* Lado Izquierdo: Avatar + Nombres + Badges */}
        <div style={{ display: "flex", alignItems: "center", gap: "1rem", minWidth: 0 }}>
          <div
            style={{
              width: "56px",
              height: "56px",
              borderRadius: "50%",
              background: "linear-gradient(135deg, #059669 0%, #047857 100%)",
              color: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 800,
              fontSize: "1.35rem",
              letterSpacing: "1px",
              boxShadow: "0 4px 12px rgba(5, 150, 105, 0.35)",
              flexShrink: 0,
            }}
          >
            {iniciales || "S"}
          </div>

          <div style={{ minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
              <h1 style={{ margin: 0, fontSize: "1.35rem", fontWeight: 800, letterSpacing: "-0.02em" }}>
                {socio.nombres}
              </h1>
              <span
                className={`badge ${socio.estado === "ACTIVO" ? "activo" : "inactivo"}`}
                style={{ fontSize: "0.75rem", padding: "0.15rem 0.5rem", fontWeight: 700 }}
              >
                {socio.estado === "ACTIVO" ? "● Activo" : "○ Inactivo"}
              </span>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.35rem", flexWrap: "wrap", fontSize: "0.82rem", color: "var(--ink-soft)" }}>
              <span className="mono" style={{ background: "rgba(0,0,0,0.05)", padding: "0.1rem 0.45rem", borderRadius: "4px", fontWeight: 700, color: "var(--ink)" }}>
                💳 No. {socio.numero_asociado}
              </span>
              <span>·</span>
              <span>🏢 {socio.agencia_nombre}</span>
              <span>·</span>
              <span>📁 {socio.cuentas.length} cuenta(s)</span>
              {socio.genero && (
                <>
                  <span>·</span>
                  <span>{socio.genero === "F" ? "👩 Femenino" : "👨 Masculino"}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Lado Derecho: Acciones Principales */}
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
          {!tieneAportacion && (
            <button
              type="button"
              className="btn"
              style={{ background: "#059669", borderColor: "#059669", fontWeight: 700, fontSize: "0.84rem" }}
              onClick={() => setMostrarModalAportacion(true)}
            >
              ➕ Aperturar Aportación (Q 100)
            </button>
          )}

          {!editando && (
            <button
              type="button"
              className="btn secondary"
              style={{ fontSize: "0.84rem", fontWeight: 600, display: "flex", alignItems: "center", gap: "0.3rem" }}
              onClick={() => setEditando(true)}
            >
              ✏️ Editar Expediente
            </button>
          )}

          {socio.estado === "ACTIVO" ? (
            <button className="btn secondary" style={{ fontSize: "0.84rem" }} onClick={() => cambiarEstado("INACTIVO")}>
              Marcar Inactivo
            </button>
          ) : (
            <button className="btn secondary" style={{ fontSize: "0.84rem" }} onClick={() => cambiarEstado("ACTIVO")}>
              Reactivar Socio
            </button>
          )}
        </div>
      </div>

      {mensajeExito && <div className="alert success" style={{ marginBottom: "1rem" }}>{mensajeExito}</div>}
      {error && <div className="alert error" style={{ marginBottom: "1rem" }}>{error}</div>}

      {/* CINTILLO EJECUTIVO DE KPIS FINANCIEROS DEL SOCIO */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "0.75rem",
          marginBottom: "1rem",
        }}
      >
        {/* KPI 1: Aportaciones */}
        <div
          className="card"
          style={{
            padding: "0.85rem 1rem",
            background: "var(--paper)",
            border: "1px solid var(--line)",
            borderRadius: "10px",
            borderLeft: "4px solid #059669",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.2rem" }}>
            <span style={{ fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", color: "var(--ink-soft)", letterSpacing: "0.03em" }}>
              Aportación Estatutaria
            </span>
            <span style={{ fontSize: "1rem" }}>🏛️</span>
          </div>
          <strong className="mono" style={{ fontSize: "1.25rem", color: tieneAportacionMinima ? "#059669" : "#d97706", display: "block" }}>
            {formatoQ(saldoAportacion)}
          </strong>
          <span style={{ fontSize: "0.72rem", color: tieneAportacionMinima ? "var(--ink-soft)" : "#d97706", fontWeight: 600 }}>
            {tieneAportacionMinima ? "✓ Al día con estatutos" : "⚠️ Mínimo Q 100.00 requerido"}
          </span>
        </div>

        {/* KPI 2: Ahorros Líquidos */}
        <div
          className="card"
          style={{
            padding: "0.85rem 1rem",
            background: "var(--paper)",
            border: "1px solid var(--line)",
            borderRadius: "10px",
            borderLeft: "4px solid #0284c7",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.2rem" }}>
            <span style={{ fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", color: "var(--ink-soft)", letterSpacing: "0.03em" }}>
              Ahorro Disponible
            </span>
            <span style={{ fontSize: "1rem" }}>💰</span>
          </div>
          <strong className="mono" style={{ fontSize: "1.25rem", color: "var(--ink)", display: "block" }}>
            {formatoQ(totalAhorroLiquido)}
          </strong>
          <span style={{ fontSize: "0.72rem", color: "var(--ink-soft)" }}>
            Corriente · Programado · Infanto
          </span>
        </div>

        {/* KPI 3: Plazo Fijo */}
        <div
          className="card"
          style={{
            padding: "0.85rem 1rem",
            background: "var(--paper)",
            border: "1px solid var(--line)",
            borderRadius: "10px",
            borderLeft: "4px solid #7c3aed",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.2rem" }}>
            <span style={{ fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", color: "var(--ink-soft)", letterSpacing: "0.03em" }}>
              Inversiones a Plazo
            </span>
            <span style={{ fontSize: "1rem" }}>📈</span>
          </div>
          <strong className="mono" style={{ fontSize: "1.25rem", color: "#7c3aed", display: "block" }}>
            {formatoQ(totalPlazoFijo)}
          </strong>
          <span style={{ fontSize: "0.72rem", color: "var(--ink-soft)" }}>
            Certificados a término fijo
          </span>
        </div>

        {/* KPI 4: Créditos / Saldo Deudor */}
        <div
          className="card"
          style={{
            padding: "0.85rem 1rem",
            background: "var(--paper)",
            border: "1px solid var(--line)",
            borderRadius: "10px",
            borderLeft: "4px solid #dc2626",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.2rem" }}>
            <span style={{ fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", color: "var(--ink-soft)", letterSpacing: "0.03em" }}>
              Cartera de Créditos
            </span>
            <span style={{ fontSize: "1rem" }}>📋</span>
          </div>
          <strong className="mono" style={{ fontSize: "1.25rem", color: totalCreditosActivos > 0 ? "#dc2626" : "var(--ink)", display: "block" }}>
            {formatoQ(totalCreditosActivos)}
          </strong>
          <span style={{ fontSize: "0.72rem", color: "var(--ink-soft)" }}>
            {totalCreditosActivos > 0 ? "Saldo deudor vigente" : "Sin créditos pendientes"}
          </span>
        </div>
      </div>

      {/* ALERTA ESTATUTARIA SI NO TIENE APORTACIÓN */}
      {!tieneAportacionMinima && (
        <div
          className="alert warning"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "1rem",
            marginBottom: "1rem",
            borderLeft: "4px solid #f59e0b",
            borderRadius: "8px",
          }}
        >
          <div>
            <strong style={{ fontSize: "0.92rem" }}>
              ⚠️ Asociado sin Cuenta de Aportaciones Estatutaria ({socio.cuentas.length} cuentas registradas)
            </strong>
            <p style={{ margin: "0.25rem 0 0", fontSize: "0.82rem", color: "var(--ink-soft)" }}>
              Por estatuto cooperativo de COMIF-R.L., todo asociado debe contar con su <strong>Cuenta de Aportación Inicial (Mínimo Q 100.00)</strong> para aperturar cuentas de ahorro o solicitar créditos.
            </p>
          </div>
          <button
            type="button"
            className="btn"
            style={{ background: "#059669", borderColor: "#059669", fontWeight: 700, fontSize: "0.84rem" }}
            onClick={() => setMostrarModalAportacion(true)}
          >
            ➕ Aperturar Aportación Inicial (Q 100)
          </button>
        </div>
      )}

      {/* PANEL DE ACCIONES RÁPIDAS MODERNO */}
      <div
        className="card"
        style={{
          marginBottom: "1.25rem",
          background: "var(--paper-raised)",
          border: "1px solid var(--line)",
          borderRadius: "10px",
          padding: "0.75rem 1rem",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.6rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <span style={{ fontSize: "1rem" }}>⚡</span>
            <strong style={{ fontSize: "0.86rem" }}>Operaciones Rápidas:</strong>
            <span style={{ fontSize: "0.78rem", color: "var(--ink-soft)" }}>
              Aperturar productos vinculados automáticamente a este asociado
            </span>
          </div>

          <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
            {!tieneAportacion && (
              <button
                type="button"
                className="btn"
                style={{ background: "#059669", borderColor: "#059669", fontSize: "0.76rem", padding: "0.25rem 0.6rem", fontWeight: 700 }}
                onClick={() => setMostrarModalAportacion(true)}
              >
                + Aportación
              </button>
            )}
            <Link
              to={`/ahorros/corriente/nueva?socioId=${socio.id}`}
              className="btn secondary"
              style={{ fontSize: "0.76rem", padding: "0.25rem 0.6rem", fontWeight: 600 }}
            >
              + Ahorro Corriente
            </Link>
            <Link
              to={`/ahorros/programado/nueva?socioId=${socio.id}`}
              className="btn secondary"
              style={{ fontSize: "0.76rem", padding: "0.25rem 0.6rem", fontWeight: 600 }}
            >
              + Ahorro Programado
            </Link>
            <Link
              to={`/ahorros/infanto-juvenil/nueva?socioId=${socio.id}`}
              className="btn secondary"
              style={{ fontSize: "0.76rem", padding: "0.25rem 0.6rem", fontWeight: 600 }}
            >
              + Infanto Juvenil
            </Link>
            <Link
              to={`/ahorros/plazo-fijo/nuevo?socioId=${socio.id}`}
              className="btn secondary"
              style={{ fontSize: "0.76rem", padding: "0.25rem 0.6rem", fontWeight: 600 }}
            >
              + Plazo Fijo
            </Link>
            <Link
              to={`/creditos/nuevo?socioId=${socio.id}`}
              className="btn"
              style={{ fontSize: "0.76rem", padding: "0.25rem 0.65rem", fontWeight: 700 }}
            >
              + Solicitar Crédito
            </Link>
          </div>
        </div>
      </div>

      {/* CUADRÍCULA PRINCIPAL: EXPEDIENTE (IZQUIERDA) Y PORTAFOLIO DE CUENTAS (DERECHA) */}
      <div style={{ display: "grid", gridTemplateColumns: "1.05fr 1.15fr", gap: "1.25rem", alignItems: "start" }}>
        {/* EXPEDIENTE Y DATOS GENERALES DEL ASOCIADO */}
        <div
          className="card"
          style={{
            background: "var(--paper)",
            border: "1px solid var(--line)",
            borderRadius: "10px",
            padding: "1rem 1.15rem",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.85rem", borderBottom: "1px solid var(--line)", paddingBottom: "0.45rem" }}>
            <h3 style={{ fontFamily: "inherit", fontSize: "0.95rem", fontWeight: 800, margin: 0, display: "flex", alignItems: "center", gap: "0.35rem" }}>
              <span>📋</span> Expediente del Asociado
            </h3>
            {!editando && (
              <button
                type="button"
                className="btn secondary"
                style={{ padding: "0.2rem 0.5rem", fontSize: "0.76rem", fontWeight: 600 }}
                onClick={() => setEditando(true)}
              >
                ✏️ Modificar
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
                      🔴 Registrado ({dpiDuplicado.rol || "Socio"}: {dpiDuplicado.nombres})
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
                <div style={{ minHeight: "1.1rem", marginTop: "0.15rem" }}>
                  {verificandoTelefono && <span className="hint">🔍 Verificando teléfono...</span>}
                  {telefonoDuplicado && (
                    <span style={{ color: "#ef4444", fontSize: "0.78rem", fontWeight: 600, display: "block" }}>
                      🔴 Registrado ({telefonoDuplicado.rol || "Socio"}: {telefonoDuplicado.nombres})
                    </span>
                  )}
                  {!verificandoTelefono && !telefonoDuplicado && form.telefono.replace(/\D/g, "").length === 8 && (
                    <span style={{ color: "#10b981", fontSize: "0.78rem", fontWeight: 600, display: "block" }}>
                      ✓ Teléfono válido
                    </span>
                  )}
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
                  style={{ borderColor: dpiDuplicadoBen && !esMenorBeneficiario ? "var(--danger)" : undefined }}
                />
                <div style={{ minHeight: "1.1rem", marginTop: "0.15rem" }}>
                  {verificandoDpiBen && !esMenorBeneficiario && <span className="hint">🔍 Verificando...</span>}
                  {dpiDuplicadoBen && !esMenorBeneficiario && (
                    <span style={{ color: "#ef4444", fontSize: "0.78rem", fontWeight: 600, display: "block" }}>
                      🔴 Registrado ({dpiDuplicadoBen.rol || "Socio"}: {dpiDuplicadoBen.nombres})
                    </span>
                  )}
                  {!verificandoDpiBen && !dpiDuplicadoBen && !esMenorBeneficiario && form.dpiBeneficiario.replace(/\D/g, "").length === 13 && (
                    <span style={{ color: "#10b981", fontSize: "0.78rem", fontWeight: 600, display: "block" }}>
                      ✓ DPI válido
                    </span>
                  )}
                </div>
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
                <div style={{ minHeight: "1.1rem", marginTop: "0.15rem" }}>
                  {verificandoTelefonoBen && !esMenorBeneficiario && <span className="hint">🔍 Verificando...</span>}
                  {telefonoDuplicadoBen && !esMenorBeneficiario && (
                    <span style={{ color: "#ef4444", fontSize: "0.78rem", fontWeight: 600, display: "block" }}>
                      🔴 Registrado ({telefonoDuplicadoBen.rol || "Socio"}: {telefonoDuplicadoBen.nombres})
                    </span>
                  )}
                  {!verificandoTelefonoBen && !telefonoDuplicadoBen && !esMenorBeneficiario && form.telefonoBeneficiario.replace(/\D/g, "").length === 8 && (
                    <span style={{ color: "#10b981", fontSize: "0.78rem", fontWeight: 600, display: "block" }}>
                      ✓ Teléfono válido
                    </span>
                  )}
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
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {/* Fila 1: Fecha Ingreso y Género */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
                <div style={{ background: "var(--paper-raised)", padding: "0.55rem 0.75rem", borderRadius: "8px", border: "1px solid var(--line)" }}>
                  <span style={{ fontSize: "0.72rem", color: "var(--ink-soft)", fontWeight: 600, display: "block" }}>Fecha de Ingreso</span>
                  <strong className="mono" style={{ fontSize: "0.85rem", color: "var(--ink)", display: "block", marginTop: "2px" }}>
                    {new Date(socio.fecha_ingreso).toLocaleDateString("es-GT")}
                  </strong>
                </div>

                <div style={{ background: "var(--paper-raised)", padding: "0.55rem 0.75rem", borderRadius: "8px", border: "1px solid var(--line)" }}>
                  <span style={{ fontSize: "0.72rem", color: "var(--ink-soft)", fontWeight: 600, display: "block" }}>Género</span>
                  <strong style={{ fontSize: "0.85rem", color: "var(--ink)", display: "block", marginTop: "2px" }}>
                    {socio.genero === "F" ? "👩 Femenino" : socio.genero === "M" ? "👨 Masculino" : "—"}
                  </strong>
                </div>
              </div>

              {/* Fila 2: DPI */}
              <div style={{ background: "var(--paper-raised)", padding: "0.55rem 0.75rem", borderRadius: "8px", border: "1px solid var(--line)" }}>
                <span style={{ fontSize: "0.72rem", color: "var(--ink-soft)", fontWeight: 600, display: "block" }}>Documento Personal de Identificación (DPI)</span>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "2px" }}>
                  <strong className="mono" style={{ fontSize: "0.95rem", letterSpacing: "0.5px", color: "var(--ink)" }}>
                    {socio.dpi ? formatearDPI(socio.dpi) : "—"}
                  </strong>
                  {socio.dpi && (
                    <button
                      type="button"
                      className="btn secondary"
                      style={{ padding: "0.15rem 0.45rem", fontSize: "0.72rem" }}
                      onClick={() => navigator.clipboard.writeText((socio.dpi || "").replace(/\D/g, ""))}
                      title="Copiar DPI"
                    >
                      Copiar
                    </button>
                  )}
                </div>
              </div>

              {/* Fila 3: Teléfono con WhatsApp */}
              <div style={{ background: "var(--paper-raised)", padding: "0.55rem 0.75rem", borderRadius: "8px", border: "1px solid var(--line)" }}>
                <span style={{ fontSize: "0.72rem", color: "var(--ink-soft)", fontWeight: 600, display: "block" }}>Teléfono Principal</span>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "2px", flexWrap: "wrap", gap: "0.4rem" }}>
                  <strong className="mono" style={{ fontSize: "0.95rem", color: "var(--ink)" }}>
                    {socio.telefono ? socio.telefono : "—"}
                  </strong>
                  {socio.telefono && (
                    <a
                      href={`https://wa.me/${socio.telefono.replace(/\D/g, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn"
                      style={{
                        padding: "0.2rem 0.6rem",
                        fontSize: "0.75rem",
                        borderRadius: "20px",
                        background: "#25D366",
                        color: "#ffffff",
                        borderColor: "#25D366",
                        fontWeight: 700,
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.25rem",
                      }}
                      title="Contactar vía WhatsApp"
                    >
                      💬 WhatsApp
                    </a>
                  )}
                </div>
              </div>

              {/* Fila 4: Dirección */}
              <div style={{ background: "var(--paper-raised)", padding: "0.55rem 0.75rem", borderRadius: "8px", border: "1px solid var(--line)" }}>
                <span style={{ fontSize: "0.72rem", color: "var(--ink-soft)", fontWeight: 600, display: "block" }}>Dirección y Residencia</span>
                <strong style={{ fontSize: "0.85rem", color: "var(--ink)", display: "block", marginTop: "2px" }}>
                  {socio.direccion ?? "—"}
                </strong>
              </div>

              {/* Fila 5: Beneficiario Registrado */}
              <div style={{ background: "rgba(2, 132, 199, 0.05)", padding: "0.65rem 0.8rem", borderRadius: "8px", border: "1px solid rgba(2, 132, 199, 0.2)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "0.72rem", color: "#0284c7", fontWeight: 700, textTransform: "uppercase" }}>
                    Persona Beneficiaria
                  </span>
                  {socio.parentesco_beneficiario && (
                    <span style={{ fontSize: "0.72rem", fontWeight: 700, padding: "0.1rem 0.45rem", borderRadius: "4px", background: "rgba(2, 132, 199, 0.15)", color: "#0284c7" }}>
                      {socio.parentesco_beneficiario}
                    </span>
                  )}
                </div>
                <strong style={{ fontSize: "0.9rem", color: "var(--ink)", display: "block", marginTop: "3px" }}>
                  {socio.nombre_beneficiario ?? "Sin beneficiario asignado"}
                </strong>
                {(socio.dpi_beneficiario || socio.telefono_beneficiario) && (
                  <div style={{ fontSize: "0.78rem", color: "var(--ink-soft)", marginTop: "0.25rem" }}>
                    {socio.dpi_beneficiario ? `DPI: ${formatearDPI(socio.dpi_beneficiario)} ` : ""}
                    {socio.telefono_beneficiario ? `· Tel: ${socio.telefono_beneficiario}` : ""}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* PORTAFOLIO DE CUENTAS DEL ASOCIADO */}
        <div
          className="card"
          style={{
            background: "var(--paper)",
            border: "1px solid var(--line)",
            borderRadius: "10px",
            padding: "1rem 1.15rem",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.85rem", borderBottom: "1px solid var(--line)", paddingBottom: "0.45rem" }}>
            <h3 style={{ fontFamily: "inherit", fontSize: "0.95rem", fontWeight: 800, margin: 0, display: "flex", alignItems: "center", gap: "0.35rem" }}>
              <span>🏦</span> Cuentas y Portafolio ({socio.cuentas.length})
            </h3>
            {!tieneAportacion && (
              <button
                type="button"
                className="btn"
                style={{ fontSize: "0.75rem", padding: "0.2rem 0.55rem", background: "#059669", borderColor: "#059669", fontWeight: 700 }}
                onClick={() => setMostrarModalAportacion(true)}
              >
                + Aportación
              </button>
            )}
          </div>

          {socio.cuentas.length === 0 ? (
            <div style={{ textAlign: "center", padding: "2rem 1rem", color: "var(--ink-soft)" }}>
              <div style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>📂</div>
              <p style={{ margin: "0 0 0.75rem", fontSize: "0.9rem", fontWeight: 600 }}>
                Este asociado todavía no tiene cuentas activas en el sistema.
              </p>
              <button
                type="button"
                className="btn"
                style={{ background: "#059669", borderColor: "#059669", fontWeight: 700, fontSize: "0.84rem" }}
                onClick={() => setMostrarModalAportacion(true)}
              >
                ➕ Aperturar Cuenta de Aportaciones (Q 100)
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
              {socio.cuentas.map((c) => {
                const slug = TIPO_SLUG[c.tipo];
                const esApor = c.tipo === "APORTACION";
                const esPF = c.tipo === "AHORRO_PLAZO_FIJO";
                const esASP = c.tipo === "AHORRO_SOBRE_PRESTAMO";
                const saldoNum = Number(c.saldo_actual || 0);

                return (
                  <div
                    key={c.id}
                    style={{
                      background: esApor ? "rgba(5, 150, 105, 0.04)" : "var(--paper-raised)",
                      border: `1px solid ${esApor ? "rgba(5, 150, 105, 0.25)" : "var(--line)"}`,
                      borderRadius: "8px",
                      padding: "0.65rem 0.85rem",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: "0.6rem",
                    }}
                  >
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                        <span
                          className="badge"
                          style={{
                            background: esApor ? "rgba(5, 150, 105, 0.15)" : esPF ? "rgba(124, 58, 237, 0.15)" : esASP ? "rgba(217, 119, 6, 0.15)" : "rgba(2, 132, 199, 0.15)",
                            color: esApor ? "#059669" : esPF ? "#7c3aed" : esASP ? "#d97706" : "#0284c7",
                            fontWeight: 700,
                            fontSize: "0.72rem",
                            padding: "0.1rem 0.45rem",
                          }}
                        >
                          {TIPO_CUENTA_LABEL[c.tipo] ?? c.tipo}
                        </span>
                      </div>
                      <div className="mono" style={{ fontWeight: 700, fontSize: "0.86rem", color: "var(--ink)", marginTop: "3px" }}>
                        {c.numero_cuenta}
                      </div>
                    </div>

                    <div style={{ textAlign: "right" }}>
                      <span style={{ fontSize: "0.68rem", color: "var(--ink-soft)", display: "block", textTransform: "uppercase", fontWeight: 600 }}>
                        Saldo Actual
                      </span>
                      <strong className="mono" style={{ fontSize: "1.05rem", color: esApor ? "#059669" : "var(--ink)", display: "block" }}>
                        {formatoQ(saldoNum)}
                      </strong>
                      <div style={{ marginTop: "2px" }}>
                        {slug ? (
                          <Link to={`/ahorros/${slug}/${c.id}`} style={{ fontSize: "0.74rem", fontWeight: 700, textDecoration: "none" }}>
                            Ver Cuenta →
                          </Link>
                        ) : (
                          <Link to="/aportaciones" style={{ fontSize: "0.74rem", fontWeight: 700, textDecoration: "none" }}>
                            Ver Aportación →
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
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

              {/* CUOTA DE INGRESO */}
              <div
                style={{
                  background: "rgba(191, 153, 3, 0.07)",
                  border: "1px solid rgba(191, 153, 3, 0.3)",
                  borderRadius: "8px",
                  padding: "0.85rem",
                  marginTop: "0.25rem",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", marginBottom: "0.5rem" }}>
                  <span style={{ fontSize: "1rem" }}>🎫</span>
                  <strong style={{ fontSize: "0.88rem", color: "var(--ink)" }}>Cuota de Ingreso (Opcional)</strong>
                </div>
                <div className="field" style={{ margin: 0 }}>
                  <label htmlFor="modal-cuota-ingreso" style={{ fontSize: "0.82rem" }}>
                    Monto de la cuota de membresía (Q)
                  </label>
                  <input
                    id="modal-cuota-ingreso"
                    type="number"
                    min="0"
                    step="0.01"
                    value={cuotaIngresoApor}
                    onChange={(e) => setCuotaIngresoApor(e.target.value)}
                    placeholder="Ej. 25.00 ó 50.00"
                    style={{ fontSize: "1rem", fontWeight: 600 }}
                  />
                  <span className="hint" style={{ color: "var(--ink-soft)" }}>
                    Pago único por inscripción al ingresar como socio. Se registrará automáticamente en la caja del día si hay turno abierto.
                  </span>
                </div>
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
