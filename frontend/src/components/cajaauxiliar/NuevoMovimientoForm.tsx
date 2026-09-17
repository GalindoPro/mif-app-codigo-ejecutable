import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { api, mensajeError } from "../../lib/api";
import BuscadorSocio from "../BuscadorSocio";
import BuscadorCuenta from "../BuscadorCuenta";
import {
  CATEGORIAS_AUXILIAR,
  CATEGORIA_AUXILIAR_KEYS,
  formatoQ,
} from "../../types";
import type {
  CajaCategoria,
  Cuenta,
  Socio,
} from "../../types";

export const GRUPOS = [
  { key: "PROPIO_INGRESO", seccion: "PROPIO", tipo: "INGRESO", titulo: "Ingreso propio" },
  { key: "PROPIO_EGRESO", seccion: "PROPIO", tipo: "EGRESO", titulo: "Egreso propio" },
  { key: "BI_INGRESO", seccion: "BI", tipo: "INGRESO", titulo: "Ingreso BI" },
  { key: "BI_EGRESO", seccion: "BI", tipo: "EGRESO", titulo: "Egreso BI" },
] as const;

export function categoriasDeGrupo(seccion: "BI" | "PROPIO", tipo: "INGRESO" | "EGRESO"): CajaCategoria[] {
  return CATEGORIA_AUXILIAR_KEYS.filter(
    (k) =>
      CATEGORIAS_AUXILIAR[k].seccion === seccion &&
      CATEGORIAS_AUXILIAR[k].tipo === tipo &&
      !k.includes("PRESTAMO") &&
      !k.includes("HIPOTECARIO") &&
      !k.includes("FIDUCIARIO")
  );
}

export interface NuevoMovimientoFormProps {
  agenciaId: string;
  diaId: string;
  onCreado: () => void;
}

interface SocioPendiente {
  id: string;
  nombres: string;
  numero_asociado: string;
  saldo_aportacion: number | null;
}

function PanelAportacionPendiente({
  agenciaId,
  onAportado,
}: {
  agenciaId: string;
  onAportado: () => void;
}) {
  const [socios, setSocios] = useState<SocioPendiente[]>([]);
  const [cargando, setCargando] = useState(true);
  const [seleccionado, setSeleccionado] = useState<SocioPendiente | null>(null);
  const [montoApor, setMontoApor] = useState("100");
  const [reciboApor, setReciboApor] = useState("");
  const [cuotaIngreso, setCuotaIngreso] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exito, setExito] = useState<string | null>(null);

  function cargarPendientes() {
    setCargando(true);
    api
      .get<SocioPendiente[]>("/socios/sin-aportacion", { params: { agenciaId } })
      .then(({ data }) => setSocios(data))
      .catch(console.error)
      .finally(() => setCargando(false));
  }

  useEffect(() => {
    cargarPendientes();
  }, [agenciaId]);

  function abrirModal(s: SocioPendiente) {
    setSeleccionado(s);
    setMontoApor("100");
    setReciboApor("");
    setCuotaIngreso("");
    setError(null);
    setExito(null);
  }

  async function handleAportar(e: FormEvent) {
    e.preventDefault();
    if (!seleccionado) return;
    const monto = Number(montoApor);
    if (isNaN(monto) || monto < 100) {
      setError("La aportacion minima es Q 100.00");
      return;
    }
    const cuota = cuotaIngreso.trim() ? Number(cuotaIngreso) : undefined;
    setGuardando(true);
    setError(null);
    try {
      const { data } = await api.post(`/socios/${seleccionado.id}/abrir-aportacion`, {
        monto,
        recibo: reciboApor.trim() || undefined,
        cuotaIngreso: cuota,
      });
      const msgCuota = data.cuotaIngresoRegistrada
        ? ` + Cuota de ingreso ${formatoQ(cuota ?? 0)} registrada en caja.`
        : "";
      setExito(`Cuenta ${data.numero_cuenta} creada (${formatoQ(monto)}).${msgCuota}`);
      setSeleccionado(null);
      cargarPendientes();
      onAportado();
      setTimeout(() => setExito(null), 5000);
    } catch (err) {
      setError(mensajeError(err));
    } finally {
      setGuardando(false);
    }
  }

  if (cargando) {
    return (
      <div style={{ padding: "1rem", fontSize: "0.82rem", color: "var(--ink-soft)", textAlign: "center" }}>
        Cargando socios pendientes...
      </div>
    );
  }

  return (
    <div>
      {exito && (
        <div className="alert success" style={{ marginBottom: "0.75rem", fontSize: "0.82rem" }}>
          {exito}
        </div>
      )}

      {socios.length === 0 ? (
        <div style={{ background: "rgba(5,150,105,0.07)", border: "1px solid rgba(5,150,105,0.3)", borderRadius: "8px", padding: "1.25rem", textAlign: "center" }}>
          <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>&#10003;</div>
          <strong style={{ fontSize: "0.92rem", color: "#059669" }}>
            Todos los socios tienen su Aportacion Estatutaria al dia
          </strong>
          <p style={{ margin: "0.4rem 0 0", fontSize: "0.78rem", color: "var(--ink-soft)" }}>
            No hay socios pendientes de apertura de cuenta de aportaciones en esta agencia.
          </p>
        </div>
      ) : (
        <>
          <div style={{ background: "rgba(245,158,11,0.07)", border: "1px solid rgba(245,158,11,0.3)", borderRadius: "6px", padding: "0.6rem 0.85rem", marginBottom: "0.6rem", fontSize: "0.8rem", color: "var(--ink-soft)" }}>
            <strong style={{ color: "var(--ink)" }}>{socios.length} socio(s)</strong> sin Aportacion Estatutaria o con saldo menor a Q 100. Haz clic para aperturar.
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem", maxHeight: "200px", overflowY: "auto" }}>
            {socios.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => abrirModal(s)}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  background: seleccionado?.id === s.id ? "rgba(2,132,199,0.1)" : "var(--mono-bg)",
                  border: seleccionado?.id === s.id ? "1px solid #0284c7" : "1px solid var(--line)",
                  borderRadius: "6px",
                  padding: "0.5rem 0.75rem",
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "all 0.15s",
                }}
              >
                <div>
                  <strong style={{ fontSize: "0.85rem", color: "var(--ink)" }}>{s.nombres}</strong>
                  <span style={{ fontSize: "0.74rem", color: "var(--ink-soft)", marginLeft: "0.5rem" }}>{s.numero_asociado}</span>
                </div>
                <span style={{ fontSize: "0.72rem", background: s.saldo_aportacion !== null ? "rgba(245,158,11,0.15)" : "rgba(239,68,68,0.12)", color: s.saldo_aportacion !== null ? "#b45309" : "#991b1b", border: "1px solid rgba(245,158,11,0.3)", borderRadius: "4px", padding: "0.15rem 0.4rem", whiteSpace: "nowrap" }}>
                  {s.saldo_aportacion !== null ? `Saldo insuf. ${formatoQ(s.saldo_aportacion)}` : "Sin cuenta"}
                </span>
              </button>
            ))}
          </div>
        </>
      )}

      {seleccionado && (
        <div style={{ marginTop: "0.85rem", background: "var(--paper-raised)", border: "1px solid #0284c7", borderRadius: "8px", padding: "1rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
            <strong style={{ fontSize: "0.9rem" }}>Aperturar Aportacion &mdash; {seleccionado.nombres}</strong>
            <button type="button" className="btn secondary" style={{ padding: "0.15rem 0.4rem", fontSize: "0.78rem" }} onClick={() => setSeleccionado(null)}>x</button>
          </div>
          {error && <div className="alert error" style={{ marginBottom: "0.5rem", fontSize: "0.8rem" }}>{error}</div>}
          <form onSubmit={handleAportar}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.6rem" }}>
              <div className="field" style={{ margin: 0 }}>
                <label htmlFor="aportar-monto" style={{ fontSize: "0.8rem" }}>Monto Aportacion (Q)</label>
                <input id="aportar-monto" type="number" min="100" step="0.01" value={montoApor} onChange={(e) => setMontoApor(e.target.value)} required style={{ fontWeight: 700, fontSize: "0.95rem" }} />
              </div>
              <div className="field" style={{ margin: 0 }}>
                <label htmlFor="aportar-cuota" style={{ fontSize: "0.8rem" }}>Cuota de Ingreso (Q)</label>
                <input id="aportar-cuota" type="number" min="0" step="0.01" value={cuotaIngreso} onChange={(e) => setCuotaIngreso(e.target.value)} placeholder="Ej. 25.00" style={{ fontWeight: 600 }} />
              </div>
            </div>
            <div className="field" style={{ marginTop: "0.6rem", marginBottom: "0.75rem" }}>
              <label htmlFor="aportar-recibo" style={{ fontSize: "0.8rem" }}>No. de Recibo / Comprobante</label>
              <input id="aportar-recibo" type="text" value={reciboApor} onChange={(e) => setReciboApor(e.target.value)} placeholder="Ej. REC-009842" />
            </div>
            <button type="submit" className="btn" style={{ width: "100%", background: "#059669", borderColor: "#059669", fontWeight: 700 }} disabled={guardando}>
              {guardando ? "Creando cuenta..." : "Confirmar y Crear Aportacion"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

export default function NuevoMovimientoForm({
  agenciaId,
  diaId,
  onCreado,
}: NuevoMovimientoFormProps) {
  const [grupo, setGrupo] = useState<(typeof GRUPOS)[number]["key"]>("PROPIO_INGRESO");
  const opcionesGrupo = useMemo(() => {
    const g = GRUPOS.find((x) => x.key === grupo)!;
    return categoriasDeGrupo(g.seccion, g.tipo);
  }, [grupo]);

  const [categoria, setCategoria] = useState<CajaCategoria>(opcionesGrupo[0]);
  const info = CATEGORIAS_AUXILIAR[categoria];
  const esAportacion = categoria === "APORTACION";

  const [socio, setSocio] = useState<Socio | null>(null);
  const [socioManual, setSocioManual] = useState(false);
  const [cuenta, setCuenta] = useState<Cuenta | null>(null);
  const [beneficiario, setBeneficiario] = useState("");
  const [sugerencias, setSugerencias] = useState<string[]>([]);
  const [referenciaAut, setReferenciaAut] = useState("");
  const [docNo, setDocNo] = useState("");
  const [monto, setMonto] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [docNoDuplicado, setDocNoDuplicado] = useState(false);
  const [infoDuplicado, setInfoDuplicado] = useState<{
    existe: boolean;
    modulo?: string;
    fecha?: string;
    beneficiario?: string;
    descripcion?: string;
    usuario?: string;
    usuarioRol?: string;
  } | null>(null);
  const [verificandoDocNo, setVerificandoDocNo] = useState(false);
  const [metodoPago, setMetodoPago] = useState<"EFECTIVO" | "CHEQUE">("EFECTIVO");
  const [bancoCheque, setBancoCheque] = useState("Banrural");

  function cambiarGrupo(nuevo: (typeof GRUPOS)[number]["key"]) {
    setGrupo(nuevo);
    const g = GRUPOS.find((x) => x.key === nuevo)!;
    const opciones = categoriasDeGrupo(g.seccion, g.tipo);
    setCategoria(opciones[0]);
    setSocio(null);
    setCuenta(null);
    setBeneficiario("");
    setReferenciaAut("");
    setDocNo("");
    setMetodoPago("EFECTIVO");
  }

  function cambiarCategoria(nueva: CajaCategoria) {
    setCategoria(nueva);
    setSocio(null);
    setCuenta(null);
    setBeneficiario("");
    setDocNo("");
    setError(null);
    setMetodoPago("EFECTIVO");
  }

  useEffect(() => {
    if (info.seccion !== "BI") return;
    if (!beneficiario || beneficiario.length < 2) {
      setSugerencias([]);
      return;
    }
    const t = setTimeout(() => {
      api
        .get<string[]>("/caja-auxiliar/beneficiarios", { params: { agenciaId, q: beneficiario } })
        .then(({ data }) => setSugerencias(data));
    }, 250);
    return () => clearTimeout(t);
  }, [beneficiario, info.seccion]);

  useEffect(() => {
    api
      .get<{ ultimoDocNo: string | null; ultimoReferenciaAut: string | null }>(`/caja-auxiliar/${diaId}/ultimo-doc-no`)
      .then(({ data }) => {
        if (data.ultimoDocNo) setDocNo((prev) => prev || data.ultimoDocNo!);
        if (data.ultimoReferenciaAut) setReferenciaAut((prev) => prev || data.ultimoReferenciaAut!);
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [diaId]);

  useEffect(() => {
    const doc = docNo.trim();
    if (!doc) {
      setDocNoDuplicado(false);
      setInfoDuplicado(null);
      return;
    }
    setVerificandoDocNo(true);
    const t = setTimeout(() => {
      api
        .get<{
          existe: boolean;
          modulo?: string;
          fecha?: string;
          beneficiario?: string;
          descripcion?: string;
          usuario?: string;
          usuarioRol?: string;
        }>(`/caja-auxiliar/${diaId}/verificar-doc-no`, { params: { docNo: doc } })
        .then(({ data }) => {
          setDocNoDuplicado(data.existe);
          setInfoDuplicado(data.existe ? data : null);
        })
        .catch(() => {
          setDocNoDuplicado(false);
          setInfoDuplicado(null);
        })
        .finally(() => setVerificandoDocNo(false));
    }, 450);
    return () => clearTimeout(t);
  }, [docNo, diaId]);

  async function enviar(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const beneficiarioFinal = info.requiereCuenta ? undefined : socio ? socio.nombres : beneficiario;
    if (!info.requiereCuenta && !beneficiarioFinal) { setError("Indica el beneficiario"); return; }
    if (info.requiereCuenta && !cuenta) { setError("Selecciona la cuenta"); return; }
    if (docNoDuplicado) { setError("El número de documento/recibo ya existe en la caja de hoy. Corrígelo antes de continuar."); return; }
    setGuardando(true);
    try {
      await api.post(`/caja-auxiliar/${diaId}/movimientos`, {
        categoria,
        monto: Number(monto),
        beneficiario: beneficiarioFinal,
        socioId: socio?.id,
        cuentaId: cuenta?.id,
        docNo: docNo || undefined,
        referenciaAut: referenciaAut || undefined,
      });
      if (metodoPago === "CHEQUE") {
        setGrupo("PROPIO_EGRESO");
        setCategoria("TRASLADO_FONDOS");
        
        const origen = (socio || cuenta) ? "asociado" : "tercero";
        const nombreQuienEntrego = socio?.nombres || (cuenta as any)?.socio_nombres || beneficiarioFinal || "COMIF R.L.";
        setBeneficiario(`Traslado-${origen} - ${nombreQuienEntrego} (${bancoCheque})`);
        
        setSocio(null);
        setCuenta(null);
        setReferenciaAut("");
        setDocNo("");
        setMetodoPago("EFECTIVO");
        setGuardando(false);
      } else {
        onCreado();
      }
    } catch (err) {
      setError(mensajeError(err));
      setGuardando(false);
    }
  }

  const referenciaPreview = cuenta ? `${cuenta.numero_cuenta}-${info.tipo === "INGRESO" ? "IN" : "EN"}` : null;

  return (
    <form className="card" onSubmit={enviar} style={{ marginBottom: "1.5rem" }}>
      <div className="tabs" style={{ marginBottom: "1rem" }}>
        {GRUPOS.map((g) => (
          <button key={g.key} type="button" className={grupo === g.key ? "on" : ""} onClick={() => cambiarGrupo(g.key)}>
            {g.titulo}
          </button>
        ))}
      </div>

      <div className="form-grid">
        <div className="field" style={{ gridColumn: "1 / -1" }}>
          <label htmlFor="aux-categoria">Tipo de movimiento</label>
          <select id="aux-categoria" value={categoria} onChange={(e) => cambiarCategoria(e.target.value as CajaCategoria)}>
            {opcionesGrupo.map((c) => (
              <option key={c} value={c}>
                {CATEGORIAS_AUXILIAR[c].descripcion}
                {CATEGORIAS_AUXILIAR[c].sinModuloReal ? " (solo registro de caja)" : ""}
              </option>
            ))}
          </select>
        </div>

        {!esAportacion && info.tipo === "INGRESO" && info.seccion === "PROPIO" && (
          <div className="field" style={{ gridColumn: "1 / -1" }}>
            <label>Método de pago</label>
            <div style={{ display: "flex", gap: "1.5rem", marginTop: "0.25rem", alignItems: "center" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "0.35rem", cursor: "pointer", fontWeight: 500 }}>
                <input type="radio" name="metodoPago" value="EFECTIVO" checked={metodoPago === "EFECTIVO"} onChange={() => setMetodoPago("EFECTIVO")} />
                Efectivo
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: "0.35rem", cursor: "pointer", fontWeight: 500 }}>
                <input type="radio" name="metodoPago" value="CHEQUE" checked={metodoPago === "CHEQUE"} onChange={() => setMetodoPago("CHEQUE")} />
                Cheque
              </label>
            </div>

            {metodoPago === "CHEQUE" && (
              <div style={{ marginTop: "0.75rem", background: "rgba(2, 132, 199, 0.05)", border: "1px solid rgba(2, 132, 199, 0.2)", borderRadius: "6px", padding: "0.6rem 0.8rem" }}>
                <label htmlFor="aux-banco" style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--ink)" }}>Banco emisor del cheque</label>
                <select
                  id="aux-banco"
                  value={bancoCheque}
                  onChange={(e) => setBancoCheque(e.target.value)}
                  style={{ marginTop: "0.3rem", width: "100%", maxWidth: "320px" }}
                >
                  <option value="Banrural">Banrural</option>
                  <option value="Banco Industrial">Banco Industrial</option>
                  <option value="CHN">CHN (Crédito Hipotecario Nacional)</option>
                  <option value="BAM">BAM (Banco Agromercantil)</option>
                  <option value="G&T Continental">G&T Continental</option>
                  <option value="Micoope">Micoope</option>
                  <option value="Otro">Otro</option>
                </select>
                <p style={{ margin: "0.35rem 0 0", fontSize: "0.74rem", color: "var(--ink-soft)" }}>
                  Al registrar el depósito en cheque, se abrirá automáticamente el egreso de <strong>Traslado de fondos</strong> con la referencia al banco seleccionado.
                </p>
              </div>
            )}
          </div>
        )}

        {esAportacion && (
          <div style={{ gridColumn: "1 / -1" }}>
            <PanelAportacionPendiente agenciaId={agenciaId} onAportado={onCreado} />
          </div>
        )}

        {!esAportacion && info.requiereCuenta && (
          <div className="field" style={{ gridColumn: "1 / -1" }}>
            <label>Cuenta del socio</label>
            <BuscadorCuenta tipo={info.requiereCuenta} agenciaId={agenciaId} seleccionada={cuenta} onSeleccionar={setCuenta} />
            {referenciaPreview && (
              <span className="sub mono" style={{ marginTop: "0.35rem", display: "inline-block" }}>Referencia: {referenciaPreview}</span>
            )}
            {info.tipo === "EGRESO" && cuenta?.tipo === "AHORRO_SOBRE_PRESTAMO" && cuenta.prestamo_estado && cuenta.prestamo_estado !== "CANCELADO" && cuenta.prestamo_estado !== "RECHAZADO" && (
              <div style={{ marginTop: "0.6rem", padding: "0.75rem 0.9rem", borderRadius: "8px", background: "#fee2e2", color: "#991b1b", border: "1px solid #ef4444", fontSize: "0.85rem", lineHeight: 1.45 }}>
                <strong>Retiro bloqueado (Cuenta en garantia):</strong> Cuenta asociada al credito <strong>{cuenta.prestamo_codigo || "activo"}</strong> ({cuenta.prestamo_estado}). No se puede tocar hasta que el credito se pague.
              </div>
            )}
          </div>
        )}

        {!esAportacion && !info.requiereCuenta && info.seccion === "PROPIO" && info.requiereSocio && (
          <div className="field" style={{ gridColumn: "1 / -1" }}>
            <label>Socio / beneficiario</label>
            {!socioManual ? (
              <>
                <BuscadorSocio agenciaId={agenciaId} seleccionado={socio} onSeleccionar={setSocio} />
                <button type="button" className="link-btn" style={{ marginTop: "0.35rem" }} onClick={() => setSocioManual(true)}>No es socio / escribir el nombre manualmente</button>
              </>
            ) : (
              <>
                <input placeholder="Nombre del beneficiario" value={beneficiario} onChange={(e) => setBeneficiario(e.target.value)} />
                <button type="button" className="link-btn" style={{ marginTop: "0.35rem" }} onClick={() => { setSocioManual(false); setBeneficiario(""); }}>Buscar en socios</button>
              </>
            )}
          </div>
        )}

        {!esAportacion && !info.requiereCuenta && info.seccion === "PROPIO" && !info.requiereSocio && (
          <div className="field" style={{ gridColumn: "1 / -1" }}>
            <label htmlFor="aux-beneficiario">Beneficiario</label>
            <input id="aux-beneficiario" value={beneficiario} onChange={(e) => setBeneficiario(e.target.value)} />
          </div>
        )}

        {!esAportacion && info.seccion === "BI" && (
          <>
            <div className="field" style={{ gridColumn: "1 / -1" }}>
              <label htmlFor="aux-beneficiario-bi">Beneficiario</label>
              <input id="aux-beneficiario-bi" list="aux-beneficiarios-datalist" value={beneficiario} onChange={(e) => setBeneficiario(e.target.value)} />
              <datalist id="aux-beneficiarios-datalist">{sugerencias.map((s) => <option key={s} value={s} />)}</datalist>
            </div>
            <div className="field">
              <label htmlFor="aux-aut">Num. de autorizacion BI</label>
              <input id="aux-aut" placeholder="AUT:000000" value={referenciaAut} onChange={(e) => setReferenciaAut(e.target.value)} />
            </div>
          </>
        )}

        {!esAportacion && (
          <>
            {!info.requiereCuenta && (
              <div className="field">
                <label htmlFor="aux-doc">
                  {info.seccion === "BI"
                    ? "No. de cuenta"
                    : metodoPago === "CHEQUE"
                    ? "No. de boleta"
                    : "No. de recibo"}
                </label>
                <input
                  id="aux-doc"
                  value={docNo}
                  onChange={(e) => setDocNo(e.target.value)}
                  placeholder={info.seccion === "BI" ? "Ej. 00-0000000-0" : undefined}
                />
                {verificandoDocNo && <span className="sub" style={{ fontSize: "0.72rem" }}>Verificando...</span>}
                {!verificandoDocNo && infoDuplicado && (
                  <div style={{ background: "rgba(220, 38, 38, 0.1)", border: "1px solid #ef4444", borderRadius: "6px", padding: "0.4rem 0.6rem", marginTop: "0.3rem", fontSize: "0.76rem", color: "#dc2626" }}>
                    <strong>⚠️ {info.seccion === "BI" ? "No. de cuenta / documento" : "Documento"} ya utilizado:</strong>
                    <div>Registrado en: <strong>{infoDuplicado.modulo}</strong> {infoDuplicado.fecha ? `el ${new Date(infoDuplicado.fecha).toLocaleDateString("es-GT")}` : ""}</div>
                    {infoDuplicado.beneficiario && <div>Beneficiario: {infoDuplicado.beneficiario}</div>}
                    {infoDuplicado.usuario && (
                      <div>Por: <strong>{infoDuplicado.usuario}</strong> {infoDuplicado.usuarioRol ? `(${infoDuplicado.usuarioRol})` : ""}</div>
                    )}
                  </div>
                )}
              </div>
            )}
            {info.requiereCuenta && (
              <div className="field">
                <label htmlFor="aux-doc-cuenta">
                  {metodoPago === "CHEQUE" ? "No. de boleta" : "No. de recibo"}
                </label>
                <input id="aux-doc-cuenta" value={docNo} onChange={(e) => setDocNo(e.target.value)} />
                {verificandoDocNo && <span className="sub" style={{ fontSize: "0.72rem" }}>Verificando...</span>}
                {!verificandoDocNo && infoDuplicado && (
                  <div style={{ background: "rgba(220, 38, 38, 0.1)", border: "1px solid #ef4444", borderRadius: "6px", padding: "0.4rem 0.6rem", marginTop: "0.3rem", fontSize: "0.76rem", color: "#dc2626" }}>
                    <strong>⚠️ Recibo ya utilizado:</strong>
                    <div>Registrado en: <strong>{infoDuplicado.modulo}</strong> {infoDuplicado.fecha ? `el ${new Date(infoDuplicado.fecha).toLocaleDateString("es-GT")}` : ""}</div>
                    {infoDuplicado.beneficiario && <div>Beneficiario: {infoDuplicado.beneficiario}</div>}
                    {infoDuplicado.usuario && (
                      <div>Por: <strong>{infoDuplicado.usuario}</strong> {infoDuplicado.usuarioRol ? `(${infoDuplicado.usuarioRol})` : ""}</div>
                    )}
                  </div>
                )}
              </div>
            )}
            <div className="field">
              <label htmlFor="aux-monto">Monto</label>
              <input id="aux-monto" type="number" min="0.01" step="0.01" value={monto} onChange={(e) => setMonto(e.target.value)} required />
            </div>
          </>
        )}
      </div>

      {error && <div className="alert error">{error}</div>}

      {!esAportacion && (() => {
        const retiroBloqueado = Boolean(info.tipo === "EGRESO" && cuenta?.tipo === "AHORRO_SOBRE_PRESTAMO" && cuenta.prestamo_estado && cuenta.prestamo_estado !== "CANCELADO" && cuenta.prestamo_estado !== "RECHAZADO");
        return (
          <button type="submit" className="btn" disabled={guardando || retiroBloqueado || docNoDuplicado}>
            {guardando
              ? "Guardando..."
              : retiroBloqueado
                ? "Retiro bloqueado por credito activo"
                : docNoDuplicado
                  ? "Documento duplicado: corrige el número"
                  : `Registrar ${info.tipo === "INGRESO" ? "ingreso" : "egreso"}`}
          </button>
        );
      })()}
    </form>
  );
}
