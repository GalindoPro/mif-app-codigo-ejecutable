import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { api, mensajeError } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import BuscadorSocio from "../components/BuscadorSocio";
import BuscadorCuenta from "../components/BuscadorCuenta";
import ReciboCobroCreditoModal, { type DatosReciboCobro } from "../components/ReciboCobroCreditoModal";
import {
  CATEGORIAS_AUXILIAR,
  CATEGORIA_AUXILIAR_KEYS,
  DENOMINACIONES_GT,
  formatoQ,
  labelDenominacion,
} from "../types";
import type { ResultadoLiquidacion } from "../lib/liquidacionCredito";
import { distribuirMontoCobro } from "../lib/liquidacionCredito";
import type {
  Agencia,
  CajaCategoria,
  Cuenta,
  DetalleCajaAuxiliar,
  EstadoCajaAuxiliar,
  OrigenFondos,
  PlazoFijoContrato,
  Prestamo,
  Socio,
} from "../types";
import {
  ORIGEN_FONDOS_LABEL,
  ORIGEN_FONDOS_SHORT_LABEL,
  ORIGEN_FONDOS_BADGE_STYLE,
} from "../types";

const GRUPOS = [
  { key: "PROPIO_INGRESO", seccion: "PROPIO", tipo: "INGRESO", titulo: "Ingreso propio" },
  { key: "PROPIO_EGRESO", seccion: "PROPIO", tipo: "EGRESO", titulo: "Egreso propio" },
  { key: "BI_INGRESO", seccion: "BI", tipo: "INGRESO", titulo: "Ingreso BI" },
  { key: "BI_EGRESO", seccion: "BI", tipo: "EGRESO", titulo: "Egreso BI" },
] as const;

function categoriasDeGrupo(seccion: "BI" | "PROPIO", tipo: "INGRESO" | "EGRESO"): CajaCategoria[] {
  return CATEGORIA_AUXILIAR_KEYS.filter(
    (k) => CATEGORIAS_AUXILIAR[k].seccion === seccion && CATEGORIAS_AUXILIAR[k].tipo === tipo,
  );
}

export default function AuxiliarCaja() {
  const { usuario } = useAuth();
  const puedeElegirAgencia = usuario?.rol === "ADMIN" || usuario?.rol === "GERENCIA";

  const [agencias, setAgencias] = useState<Agencia[]>([]);
  const [agenciaId, setAgenciaId] = useState(usuario?.agenciaId ?? "");
  const [estadoInfo, setEstadoInfo] = useState<EstadoCajaAuxiliar | null>(null);
  const [detalle, setDetalle] = useState<DetalleCajaAuxiliar | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);
  const [mostrarHistorial, setMostrarHistorial] = useState(false);

  useEffect(() => {
    api.get<Agencia[]>("/agencias").then(({ data }) => setAgencias(data));
  }, []);

  function cargarEstado() {
    if (!agenciaId) return;
    api
      .get<EstadoCajaAuxiliar>("/caja-auxiliar/estado", { params: { agenciaId } })
      .then(({ data }) => setEstadoInfo(data))
      .catch((err) => setError(mensajeError(err)));
  }

  useEffect(() => {
    setDetalle(null);
    setEstadoInfo(null);
    cargarEstado();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agenciaId]);

  function cargarDetalle(diaId: string) {
    api
      .get<DetalleCajaAuxiliar>(`/caja-auxiliar/${diaId}`)
      .then(({ data }) => setDetalle(data))
      .catch((err) => setError(mensajeError(err)));
  }

  useEffect(() => {
    if (estadoInfo?.estado === "ABIERTO") cargarDetalle(estadoInfo.dia.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [estadoInfo]);

  async function abrirCaja(saldoInicial?: number) {
    setError(null);
    setCargando(true);
    try {
      await api.post("/caja-auxiliar/abrir", { agenciaId, saldoInicial });
      cargarEstado();
    } catch (err) {
      setError(mensajeError(err));
    } finally {
      setCargando(false);
    }
  }

  if (!agenciaId) {
    return (
      <div>
        <h1>Auxiliar de caja</h1>
        <div className="alert error">Debes tener una agencia asignada o seleccionar una.</div>
      </div>
    );
  }

  const agenciaActualNombre = agencias.find((a) => a.id === agenciaId)?.nombre ?? "Agencia";

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Auxiliar de caja</h1>
          <p>Libro de caja del día: transacciones agente Banco Industrial e ingresos/egresos propios.</p>
        </div>
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", flexWrap: "wrap" }}>
          <button className="btn secondary" onClick={() => setMostrarHistorial(true)}>
            📅 Historial de Cajas
          </button>
          {puedeElegirAgencia && (
            <select value={agenciaId} onChange={(e) => setAgenciaId(e.target.value)} style={{ maxWidth: 240 }}>
              {agencias.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.nombre}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {error && <div className="alert error">{error}</div>}

      {estadoInfo?.estado === "SIN_ABRIR" && (
        <AbrirCajaCard estadoInfo={estadoInfo} cargando={cargando} onAbrir={abrirCaja} />
      )}

      {estadoInfo?.estado === "ABIERTO" && detalle && (
        <CajaAbierta
          agenciaId={agenciaId}
          detalle={detalle}
          onRecargar={() => cargarDetalle(detalle.dia.id)}
          onCerrada={() => {
            setDetalle(null);
            cargarEstado();
          }}
        />
      )}

      {estadoInfo?.estado === "CERRADO" && (
        <CajaCerradaCard
          agenciaNombre={agenciaActualNombre}
          detalle={estadoInfo.detalle}
          onVerHistorial={() => setMostrarHistorial(true)}
        />
      )}

      {mostrarHistorial && (
        <HistorialCajasModal
          agenciaId={agenciaId}
          agenciaNombre={agenciaActualNombre}
          onCerrar={() => setMostrarHistorial(false)}
        />
      )}
    </div>
  );
}

function AbrirCajaCard({
  estadoInfo,
  cargando,
  onAbrir,
}: {
  estadoInfo: Extract<EstadoCajaAuxiliar, { estado: "SIN_ABRIR" }>;
  cargando: boolean;
  onAbrir: (saldoInicial?: number) => void;
}) {
  const [saldoManual, setSaldoManual] = useState("");
  const hoy = new Date().toLocaleDateString("es-GT", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

  return (
    <div className="card" style={{ maxWidth: 480 }}>
      <h2 style={{ marginTop: 0 }}>Abrir caja de hoy</h2>
      <p className="sub" style={{ textTransform: "capitalize" }}>
        {hoy}
      </p>
      {estadoInfo.esPrimeraVez ? (
        <>
          <p>Es la primera vez que se abre la caja de esta agencia. Indica el saldo inicial de hoy.</p>
          <div className="field">
            <label htmlFor="aux-saldo-manual">Saldo inicial</label>
            <input
              id="aux-saldo-manual"
              type="number"
              min="0"
              step="0.01"
              value={saldoManual}
              onChange={(e) => setSaldoManual(e.target.value)}
            />
          </div>
          <button className="btn" disabled={cargando || !saldoManual} onClick={() => onAbrir(Number(saldoManual))}>
            {cargando ? "Abriendo…" : "Abrir caja"}
          </button>
        </>
      ) : (
        <>
          <p>
            El saldo inicial de hoy se toma automáticamente del cierre del{" "}
            {estadoInfo.fechaUltimoCierre ? new Date(estadoInfo.fechaUltimoCierre).toLocaleDateString("es-GT") : "día anterior"}:
          </p>
          <div className="stat-card accent" style={{ marginBottom: "1rem" }}>
            <span className="label">Saldo inicial de hoy</span>
            <span className="value">{formatoQ(estadoInfo.saldoSugerido ?? 0)}</span>
          </div>
          <button className="btn" disabled={cargando} onClick={() => onAbrir()}>
            {cargando ? "Abriendo…" : "Abrir caja de hoy"}
          </button>
        </>
      )}
    </div>
  );
}

function CajaAbierta({
  agenciaId,
  detalle,
  onRecargar,
  onCerrada,
}: {
  agenciaId: string;
  detalle: DetalleCajaAuxiliar;
  onRecargar: () => void;
  onCerrada: () => void;
}) {
  const [mostrarForm, setMostrarForm] = useState(false);
  const [mostrarCobroCredito, setMostrarCobroCredito] = useState(false);
  const [mostrarDesembolso, setMostrarDesembolso] = useState(false);
  const [mostrarLiquidarPF, setMostrarLiquidarPF] = useState(false);
  const [mostrarCierre, setMostrarCierre] = useState(false);

  const resumenFondos = useMemo(() => {
    const r: Record<
      OrigenFondos,
      { cobros: number; colocacion: number; countCobros: number; countColocacion: number }
    > = {
      FONDOS_PROPIOS: { cobros: 0, colocacion: 0, countCobros: 0, countColocacion: 0 },
      FEDERURAL: { cobros: 0, colocacion: 0, countCobros: 0, countColocacion: 0 },
      CHN_GUATEMALA: { cobros: 0, colocacion: 0, countCobros: 0, countColocacion: 0 },
    };

    detalle.movimientos.forEach((m) => {
      let origen: OrigenFondos | null = (m.origen_fondos as OrigenFondos) || null;
      if (!origen) {
        if (
          m.categoria === "COLOCACION_PRESTAMO" ||
          (m.referencia && m.referencia.includes("CUOTA"))
        ) {
          origen = "FONDOS_PROPIOS";
        }
      }
      if (!origen || !r[origen]) return;

      if (m.tipo === "INGRESO") {
        r[origen].cobros += Number(m.monto);
        r[origen].countCobros += 1;
      } else if (m.tipo === "EGRESO") {
        r[origen].colocacion += Number(m.monto);
        r[origen].countColocacion += 1;
      }
    });

    return r;
  }, [detalle.movimientos]);

  const tieneMovimientosCredito =
    resumenFondos.FONDOS_PROPIOS.countCobros > 0 ||
    resumenFondos.FONDOS_PROPIOS.countColocacion > 0 ||
    resumenFondos.FEDERURAL.countCobros > 0 ||
    resumenFondos.FEDERURAL.countColocacion > 0 ||
    resumenFondos.CHN_GUATEMALA.countCobros > 0 ||
    resumenFondos.CHN_GUATEMALA.countColocacion > 0;

  return (
    <div>
      <div className="stat-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(170px, 210px))" }}>
        <div className="stat-card">
          <span className="label">Saldo inicial</span>
          <span className="value">{formatoQ(detalle.dia.saldo_inicial)}</span>
        </div>
        <div className="stat-card">
          <span className="label">Total ingresos</span>
          <span className="value">{formatoQ(detalle.totalIngreso)}</span>
        </div>
        <div className="stat-card">
          <span className="label">Total egresos</span>
          <span className="value">{formatoQ(detalle.totalEgreso)}</span>
        </div>
        <div className="stat-card accent">
          <span className="label">Saldo actual</span>
          <span className="value">{formatoQ(detalle.saldoActual)}</span>
        </div>
      </div>

      {/* CONSOLIDADO DE FONDOS INSTITUCIONALES (FONDOS PROPIOS, FEDERURAL, CHN) */}
      <div
        className="card"
        style={{
          background: "var(--paper-raised)",
          border: "1px solid var(--line)",
          borderRadius: "10px",
          padding: "0.85rem 1rem",
          marginBottom: "1.25rem",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.6rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.45rem" }}>
            <span style={{ fontSize: "1.1rem" }}>🏛️</span>
            <span style={{ fontWeight: 700, fontSize: "0.9rem", color: "var(--ink)" }}>
              Consolidado de Cartera por Fuente de Fondos (Hoy)
            </span>
          </div>
          <span style={{ fontSize: "0.75rem", color: "var(--ink-soft)" }}>
            {tieneMovimientosCredito ? "Movimientos registrados hoy" : "Sin colocación/cobro aún"}
          </span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "0.65rem" }}>
          {(
            [
              { id: "FONDOS_PROPIOS", icon: "🏦", label: "Fondos Propios (MIF)", data: resumenFondos.FONDOS_PROPIOS, color: "#059669" },
              { id: "FEDERURAL", icon: "🌾", label: "FEDERURAL", data: resumenFondos.FEDERURAL, color: "#d97706" },
              { id: "CHN_GUATEMALA", icon: "🏛️", label: "CHN-GUATEMALA", data: resumenFondos.CHN_GUATEMALA, color: "#2563eb" },
            ] as const
          ).map((f) => {
            const neto = f.data.cobros - f.data.colocacion;
            return (
              <div
                key={f.id}
                style={{
                  background: "var(--paper)",
                  border: "1px solid var(--line)",
                  borderRadius: "8px",
                  padding: "0.65rem 0.8rem",
                  fontSize: "0.82rem",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.35rem" }}>
                  <span style={{ fontWeight: 700, color: f.color, display: "flex", alignItems: "center", gap: "0.3rem" }}>
                    <span>{f.icon}</span> {f.label}
                  </span>
                  <span
                    style={{
                      fontSize: "0.68rem",
                      fontWeight: 700,
                      padding: "0.1rem 0.35rem",
                      borderRadius: "4px",
                      ...ORIGEN_FONDOS_BADGE_STYLE[f.id],
                    }}
                  >
                    {f.data.countCobros + f.data.countColocacion} ops
                  </span>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.3rem", fontSize: "0.76rem" }}>
                  <div>
                    <span style={{ color: "var(--ink-soft)", display: "block" }}>Cobrado:</span>
                    <strong style={{ color: "#059669" }} className="mono">{formatoQ(f.data.cobros)}</strong>
                  </div>
                  <div>
                    <span style={{ color: "var(--ink-soft)", display: "block" }}>Colocado:</span>
                    <strong style={{ color: "#2563eb" }} className="mono">{formatoQ(f.data.colocacion)}</strong>
                  </div>
                </div>

                <div style={{ marginTop: "0.4rem", paddingTop: "0.3rem", borderTop: "1px dashed var(--line)", fontSize: "0.74rem", display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--ink-soft)" }}>Flujo Neto:</span>
                  <strong className="mono" style={{ color: neto >= 0 ? "#059669" : "#dc2626" }}>
                    {formatoQ(neto)}
                  </strong>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <PanelNovedadesCampo
        agenciaId={agenciaId}
        onSeleccionarCuenta={() => {
          setMostrarForm(true);
          setMostrarCobroCredito(false);
          setMostrarDesembolso(false);
          setMostrarLiquidarPF(false);
          setMostrarCierre(false);
        }}
      />

      <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
        <button
          className="btn"
          onClick={() => {
            setMostrarForm((v) => !v);
            setMostrarCobroCredito(false);
            setMostrarDesembolso(false);
            setMostrarLiquidarPF(false);
            setMostrarCierre(false);
          }}
        >
          {mostrarForm ? "Cancelar" : "+ Nuevo movimiento"}
        </button>
        <button
          className="btn"
          style={{ background: "#059669", borderColor: "#059669" }}
          onClick={() => {
            setMostrarCobroCredito((v) => !v);
            setMostrarForm(false);
            setMostrarDesembolso(false);
            setMostrarLiquidarPF(false);
            setMostrarCierre(false);
          }}
        >
          {mostrarCobroCredito ? "Cancelar cobro" : "💵 Cobro cuota de crédito"}
        </button>
        <button
          className="btn"
          style={{ background: "#2563eb", borderColor: "#2563eb" }}
          onClick={() => {
            setMostrarDesembolso((v) => !v);
            setMostrarForm(false);
            setMostrarCobroCredito(false);
            setMostrarLiquidarPF(false);
            setMostrarCierre(false);
          }}
        >
          {mostrarDesembolso ? "Cancelar desembolso" : "📤 Desembolso de crédito"}
        </button>
        <button
          className="btn"
          style={{ background: "#7c3aed", borderColor: "#7c3aed" }}
          onClick={() => {
            setMostrarLiquidarPF((v) => !v);
            setMostrarForm(false);
            setMostrarCobroCredito(false);
            setMostrarDesembolso(false);
            setMostrarCierre(false);
          }}
        >
          {mostrarLiquidarPF ? "Cancelar liquidación" : "📦 Liquidar Plazo Fijo"}
        </button>
        <button
          className="btn secondary"
          onClick={() => {
            setMostrarCierre((v) => !v);
            setMostrarForm(false);
            setMostrarCobroCredito(false);
            setMostrarDesembolso(false);
            setMostrarLiquidarPF(false);
          }}
        >
          {mostrarCierre ? "Cancelar cierre" : "Cerrar caja del día"}
        </button>
      </div>

      {mostrarDesembolso && (
        <DesembolsoCreditoForm
          agenciaId={agenciaId}
          diaId={detalle.dia.id}
          saldoCajaActual={detalle.saldoActual}
          onDesembolsado={() => {
            setMostrarDesembolso(false);
            onRecargar();
          }}
        />
      )}

      {mostrarLiquidarPF && (
        <LiquidarPlazoFijoForm
          agenciaId={agenciaId}
          diaId={detalle.dia.id}
          saldoCajaActual={detalle.saldoActual}
          onLiquidado={() => {
            setMostrarLiquidarPF(false);
            onRecargar();
          }}
        />
      )}

      {mostrarForm && (
        <NuevoMovimientoForm
          agenciaId={agenciaId}
          diaId={detalle.dia.id}
          onCreado={() => {
            setMostrarForm(false);
            onRecargar();
          }}
        />
      )}

      {mostrarCobroCredito && (
        <CobroCreditoVentanilla
          agenciaId={agenciaId}
          diaId={detalle.dia.id}
          onCobrado={() => {
            setMostrarCobroCredito(false);
            onRecargar();
          }}
        />
      )}

      {mostrarCierre && (
        <CierreCajaForm
          diaId={detalle.dia.id}
          saldoEsperado={detalle.saldoActual}
          onCerrada={() => {
            setMostrarCierre(false);
            onCerrada();
          }}
        />
      )}

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Hora</th>
              <th>Movimiento</th>
              <th>Referencia</th>
              <th>Beneficiario</th>
              <th>Doc.</th>
              <th>Ingreso</th>
              <th>Egreso</th>
              <th>Saldo</th>
              <th>Usuario</th>
            </tr>
          </thead>
          <tbody>
            {detalle.movimientos.map((m) => (
              <tr key={m.id}>
                <td className="mono">
                  {new Date(m.created_at).toLocaleTimeString("es-GT", { hour: "2-digit", minute: "2-digit" })}
                </td>
                <td>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem", alignItems: "flex-start" }}>
                    <span>{m.descripcion}</span>
                    {m.origen_fondos && (
                      <span
                        style={{
                          fontSize: "0.68rem",
                          fontWeight: 700,
                          padding: "0.1rem 0.35rem",
                          borderRadius: "4px",
                          width: "fit-content",
                          ...ORIGEN_FONDOS_BADGE_STYLE[m.origen_fondos as OrigenFondos],
                        }}
                      >
                        {ORIGEN_FONDOS_SHORT_LABEL[m.origen_fondos as OrigenFondos]}
                      </span>
                    )}
                  </div>
                </td>
                <td className="mono">{m.referencia ?? "—"}</td>
                <td>{m.beneficiario}</td>
                <td className="mono">{m.doc_no ?? "—"}</td>
                <td className="mono movimiento-monto deposito">{m.tipo === "INGRESO" ? formatoQ(m.monto) : ""}</td>
                <td className="mono movimiento-monto retiro">{m.tipo === "EGRESO" ? formatoQ(m.monto) : ""}</td>
                <td className="mono">{formatoQ(m.saldo_acumulado)}</td>
                <td>{m.usuario_nombre}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {detalle.movimientos.length === 0 && <div className="empty">Todavía no hay movimientos registrados hoy.</div>}
      </div>
    </div>
  );
}

function NuevoMovimientoForm({ agenciaId, diaId, onCreado }: { agenciaId: string; diaId: string; onCreado: () => void }) {
  const [grupo, setGrupo] = useState<(typeof GRUPOS)[number]["key"]>("PROPIO_INGRESO");
  const opcionesGrupo = useMemo(() => {
    const g = GRUPOS.find((x) => x.key === grupo)!;
    return categoriasDeGrupo(g.seccion, g.tipo);
  }, [grupo]);

  const [categoria, setCategoria] = useState<CajaCategoria>(opcionesGrupo[0]);
  const info = CATEGORIAS_AUXILIAR[categoria];

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [beneficiario, info.seccion]);

  async function enviar(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const beneficiarioFinal = info.requiereCuenta ? undefined : socio ? socio.nombres : beneficiario;
    if (!info.requiereCuenta && !beneficiarioFinal) {
      setError("Indica el beneficiario");
      return;
    }
    if (info.requiereCuenta && !cuenta) {
      setError("Selecciona la cuenta");
      return;
    }

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
      onCreado();
    } catch (err) {
      setError(mensajeError(err));
    } finally {
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
          <select id="aux-categoria" value={categoria} onChange={(e) => setCategoria(e.target.value as CajaCategoria)}>
            {opcionesGrupo.map((c) => (
              <option key={c} value={c}>
                {CATEGORIAS_AUXILIAR[c].descripcion}
                {CATEGORIAS_AUXILIAR[c].sinModuloReal ? " (solo registro de caja)" : ""}
              </option>
            ))}
          </select>
        </div>

        {info.requiereCuenta && (
          <div className="field" style={{ gridColumn: "1 / -1" }}>
            <label>Cuenta del socio</label>
            <BuscadorCuenta tipo={info.requiereCuenta} agenciaId={agenciaId} seleccionada={cuenta} onSeleccionar={setCuenta} />
            {referenciaPreview && (
              <span className="sub mono" style={{ marginTop: "0.35rem", display: "inline-block" }}>
                Referencia: {referenciaPreview}
              </span>
            )}
            {info.tipo === "EGRESO" && cuenta?.tipo === "AHORRO_SOBRE_PRESTAMO" && cuenta.prestamo_estado && cuenta.prestamo_estado !== "CANCELADO" && cuenta.prestamo_estado !== "RECHAZADO" && (
              <div
                style={{
                  marginTop: "0.6rem",
                  padding: "0.75rem 0.9rem",
                  borderRadius: "8px",
                  background: "#fee2e2",
                  color: "#991b1b",
                  border: "1px solid #ef4444",
                  fontSize: "0.85rem",
                  lineHeight: 1.45,
                }}
              >
                🛑 <strong>Retiro bloqueado (Cuenta en garantía):</strong> Esta cuenta está asociada al crédito{" "}
                <strong>{cuenta.prestamo_codigo || "activo"}</strong> ({cuenta.prestamo_estado}). Por política estatutaria de la cooperativa,
                los fondos de <em>Ahorro sobre Préstamo</em> <strong>no se pueden tocar</strong> hasta que el crédito termine de pagarse por completo.
              </div>
            )}
          </div>
        )}

        {!info.requiereCuenta && info.seccion === "PROPIO" && info.requiereSocio && (
          <div className="field" style={{ gridColumn: "1 / -1" }}>
            <label>Socio / beneficiario</label>
            {!socioManual ? (
              <>
                <BuscadorSocio agenciaId={agenciaId} seleccionado={socio} onSeleccionar={setSocio} />
                <button type="button" className="link-btn" style={{ marginTop: "0.35rem" }} onClick={() => setSocioManual(true)}>
                  No es socio / escribir el nombre manualmente
                </button>
              </>
            ) : (
              <>
                <input
                  placeholder="Nombre del beneficiario"
                  value={beneficiario}
                  onChange={(e) => setBeneficiario(e.target.value)}
                />
                <button
                  type="button"
                  className="link-btn"
                  style={{ marginTop: "0.35rem" }}
                  onClick={() => {
                    setSocioManual(false);
                    setBeneficiario("");
                  }}
                >
                  Buscar en socios
                </button>
              </>
            )}
          </div>
        )}

        {!info.requiereCuenta && info.seccion === "PROPIO" && !info.requiereSocio && (
          <div className="field" style={{ gridColumn: "1 / -1" }}>
            <label htmlFor="aux-beneficiario">Beneficiario</label>
            <input id="aux-beneficiario" value={beneficiario} onChange={(e) => setBeneficiario(e.target.value)} />
          </div>
        )}

        {info.seccion === "BI" && (
          <>
            <div className="field" style={{ gridColumn: "1 / -1" }}>
              <label htmlFor="aux-beneficiario-bi">Beneficiario</label>
              <input
                id="aux-beneficiario-bi"
                list="aux-beneficiarios-datalist"
                value={beneficiario}
                onChange={(e) => setBeneficiario(e.target.value)}
              />
              <datalist id="aux-beneficiarios-datalist">
                {sugerencias.map((s) => (
                  <option key={s} value={s} />
                ))}
              </datalist>
            </div>
            <div className="field">
              <label htmlFor="aux-aut">Núm. de autorización BI</label>
              <input id="aux-aut" placeholder="AUT:000000" value={referenciaAut} onChange={(e) => setReferenciaAut(e.target.value)} />
            </div>
          </>
        )}

        {!info.requiereCuenta && (
          <div className="field">
            <label htmlFor="aux-doc">No. de documento</label>
            <input id="aux-doc" value={docNo} onChange={(e) => setDocNo(e.target.value)} />
          </div>
        )}
        {info.requiereCuenta && (
          <div className="field">
            <label htmlFor="aux-doc-cuenta">No. de recibo</label>
            <input id="aux-doc-cuenta" value={docNo} onChange={(e) => setDocNo(e.target.value)} />
          </div>
        )}

        <div className="field">
          <label htmlFor="aux-monto">Monto</label>
          <input
            id="aux-monto"
            type="number"
            min="0.01"
            step="0.01"
            value={monto}
            onChange={(e) => setMonto(e.target.value)}
            required
          />
        </div>
      </div>

      {error && <div className="alert error">{error}</div>}

      {(() => {
        const retiroBloqueado = Boolean(
          info.tipo === "EGRESO" &&
          cuenta?.tipo === "AHORRO_SOBRE_PRESTAMO" &&
          cuenta.prestamo_estado &&
          cuenta.prestamo_estado !== "CANCELADO" &&
          cuenta.prestamo_estado !== "RECHAZADO"
        );
        return (
          <button type="submit" className="btn" disabled={guardando || retiroBloqueado}>
            {guardando ? "Guardando…" : retiroBloqueado ? "Retiro bloqueado por crédito activo" : `Registrar ${info.tipo === "INGRESO" ? "ingreso" : "egreso"}`}
          </button>
        );
      })()}
    </form>
  );
}

function CierreCajaForm({
  diaId,
  saldoEsperado,
  onCerrada,
}: {
  diaId: string;
  saldoEsperado: number;
  onCerrada: () => void;
}) {
  const [cantidades, setCantidades] = useState<Record<number, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  const totalContado = DENOMINACIONES_GT.reduce((acc, d) => acc + d * Number(cantidades[d] || 0), 0);
  const diferencia = Math.round((totalContado - saldoEsperado) * 100) / 100;

  async function cerrar() {
    setError(null);
    setGuardando(true);
    try {
      const conteo = DENOMINACIONES_GT.map((valor) => ({ valor, cantidad: Number(cantidades[valor] || 0) }));
      await api.post(`/caja-auxiliar/${diaId}/cerrar`, { conteo });
      onCerrada();
    } catch (err) {
      setError(mensajeError(err));
    } finally {
      setGuardando(false);
    }
  }

  const billetes = DENOMINACIONES_GT.filter((d) => d >= 5);
  const monedas = DENOMINACIONES_GT.filter((d) => d < 5);

  return (
    <div className="card" style={{ marginBottom: "1.5rem", maxWidth: 640 }}>
      <h2 style={{ marginTop: 0 }}>Conteo de efectivo (arqueo)</h2>
      <p className="sub">Cuenta los billetes y monedas para cuadrar la caja con el saldo calculado.</p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
        <div>
          <h3>Billetes</h3>
          {billetes.map((d) => (
            <DenominacionRow key={d} valor={d} cantidad={cantidades[d] ?? ""} onCambiar={(v) => setCantidades((c) => ({ ...c, [d]: v }))} />
          ))}
        </div>
        <div>
          <h3>Monedas</h3>
          {monedas.map((d) => (
            <DenominacionRow key={d} valor={d} cantidad={cantidades[d] ?? ""} onCambiar={(v) => setCantidades((c) => ({ ...c, [d]: v }))} />
          ))}
        </div>
      </div>

      <div className="stat-grid" style={{ marginTop: "1.25rem", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 200px))" }}>
        <div className="stat-card">
          <span className="label">Total contado</span>
          <span className="value">{formatoQ(totalContado)}</span>
        </div>
        <div className="stat-card">
          <span className="label">Saldo esperado</span>
          <span className="value">{formatoQ(saldoEsperado)}</span>
        </div>
        <div className={`stat-card ${diferencia === 0 ? "accent" : ""}`}>
          <span className="label">Diferencia</span>
          <span className="value" style={{ color: diferencia === 0 ? undefined : "var(--danger)" }}>
            {formatoQ(diferencia)}
          </span>
        </div>
      </div>

      {error && <div className="alert error">{error}</div>}

      <button className="btn" style={{ marginTop: "1rem" }} disabled={guardando} onClick={cerrar}>
        {guardando ? "Cerrando…" : "Cerrar caja"}
      </button>
    </div>
  );
}

function DenominacionRow({
  valor,
  cantidad,
  onCambiar,
}: {
  valor: number;
  cantidad: string;
  onCambiar: (v: string) => void;
}) {
  const subtotal = valor * Number(cantidad || 0);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.4rem" }}>
      <span className="mono" style={{ width: 64 }}>
        {labelDenominacion(valor)}
      </span>
      <input
        type="number"
        min="0"
        step="1"
        value={cantidad}
        onChange={(e) => onCambiar(e.target.value)}
        style={{ width: 80 }}
        placeholder="0"
      />
      <span className="mono sub">= {formatoQ(subtotal)}</span>
    </div>
  );
}

function CobroCreditoVentanilla({
  agenciaId,
  diaId,
  onCobrado,
}: {
  agenciaId: string;
  diaId: string;
  onCobrado: () => void;
}) {
  const [socio, setSocio] = useState<Socio | null>(null);
  const [prestamos, setPrestamos] = useState<Prestamo[]>([]);
  const [prestamo, setPrestamo] = useState<Prestamo | null>(null);
  const [cargandoPrestamos, setCargandoPrestamos] = useState(false);

  const { usuario } = useAuth();
  const [reciboModal, setReciboModal] = useState<DatosReciboCobro | null>(null);

  const [liquidacion, setLiquidacion] = useState<ResultadoLiquidacion | null>(null);
  const [cargandoLiquidacion, setCargandoLiquidacion] = useState(false);

  const [montoEntregadoInput, setMontoEntregadoInput] = useState("");
  const [abonoCapital, setAbonoCapital] = useState("");
  const [interes, setInteres] = useState("");
  const [mora, setMora] = useState("0");
  const [ahorroSobrePrestamo, setAhorroSobrePrestamo] = useState("0");
  const [origenFondos, setOrigenFondos] = useState<OrigenFondos>("FONDOS_PROPIOS");
  const [docNo, setDocNo] = useState("");

  const [cuentasDebito, setCuentasDebito] = useState<Cuenta[]>([]);
  const [usarDebitoAhorro, setUsarDebitoAhorro] = useState(false);
  const [cuentaDebitoSeleccionada, setCuentaDebitoSeleccionada] = useState<string>("");

  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function cargarLiquidacion(p: Prestamo) {
    setPrestamo(p);
    setOrigenFondos(p.origen_fondos || "FONDOS_PROPIOS");
    setCargandoLiquidacion(true);
    try {
      const { data } = await api.get<{ prestamo: Prestamo; liquidacion: ResultadoLiquidacion }>(
        `/prestamos/${p.id}/liquidacion`,
      );
      setLiquidacion(data.liquidacion);
      const capSugerido = data.liquidacion.cuotaCapitalBase || data.liquidacion.cuotaCapitalSugerida;
      const intSugerido = data.liquidacion.estaEnMora || data.liquidacion.cuotasVencidas > 0
        ? data.liquidacion.interesDevengado
        : (data.liquidacion.interesMesCompleto || data.liquidacion.interesDevengado);
      const totalSugerido = data.liquidacion.estaEnMora || data.liquidacion.cuotasVencidas > 0
        ? data.liquidacion.pagoMinimoSugerido
        : (data.liquidacion.cuotaProgramadaOficial || data.liquidacion.pagoMinimoSugerido);

      setAbonoCapital(String(capSugerido));
      setInteres(String(intSugerido));
      setMora(String(data.liquidacion.moraFijaSugerida));
      setMontoEntregadoInput(String(totalSugerido));
    } catch {
      const saldo = Number(
        p.saldo_capital !== null && p.saldo_capital !== undefined
          ? p.saldo_capital
          : p.monto_aprobado || p.monto_solicitado,
      );
      const tasa = Number(p.tasa_interes_mensual || 2.0) / 100;
      const interesMes = Math.round(saldo * tasa * 100) / 100;
      const cuotaTotal = Number(p.cuota_mensual);
      const capitalMes = Math.max(0, Math.min(saldo, Math.round((cuotaTotal - interesMes) * 100) / 100));

      setAbonoCapital(String(capitalMes));
      setInteres(String(interesMes));
      setMora("0");
      setMontoEntregadoInput(String(capitalMes + interesMes));
      setLiquidacion(null);
    } finally {
      setCargandoLiquidacion(false);
    }
  }

  useEffect(() => {
    if (!socio) {
      setPrestamos([]);
      setPrestamo(null);
      setLiquidacion(null);
      setCuentasDebito([]);
      setUsarDebitoAhorro(false);
      setCuentaDebitoSeleccionada("");
      return;
    }
    setCargandoPrestamos(true);
    api
      .get<Prestamo[]>("/prestamos", { params: { socioId: socio.id } })
      .then(({ data }) => {
        const activos = data.filter((p) => p.estado === "DESEMBOLSADO" || p.estado === "APROBADO");
        setPrestamos(activos);
        if (activos[0]) {
          cargarLiquidacion(activos[0]);
        } else {
          setPrestamo(null);
          setLiquidacion(null);
        }
      })
      .catch((err) => setError(mensajeError(err)))
      .finally(() => setCargandoPrestamos(false));

    // Cargar cuentas del socio para verificar si tiene Ahorro sobre Préstamo u otras cuentas de ahorro disponibles
    api
      .get<{ cuentas?: Cuenta[] }>(`/socios/${socio.id}`)
      .then(({ data }) => {
        // La Aportación Estatutaria es capital social institucional y NUNCA se debita para pagar cuotas de créditos.
        const activas = (data.cuentas || []).filter(
          (c) => c.estado === "ACTIVA" && Number(c.saldo_actual) > 0 && (c.tipo as string) !== "APORTACION_ESTATUTARIA",
        );
        setCuentasDebito(activas);
        const asp = activas.find((c) => c.tipo === "AHORRO_SOBRE_PRESTAMO");
        if (asp) setCuentaDebitoSeleccionada(asp.id);
        else if (activas[0]) setCuentaDebitoSeleccionada(activas[0].id);
        else setCuentaDebitoSeleccionada("");
      })
      .catch(() => setCuentasDebito([]));
  }, [socio]);

  function handleMontoEntregadoChange(val: string) {
    setMontoEntregadoInput(val);
    const num = Number(val) || 0;
    if (!prestamo) return;

    const saldo = Number(
      prestamo.saldo_capital !== null && prestamo.saldo_capital !== undefined
        ? prestamo.saldo_capital
        : prestamo.monto_aprobado || prestamo.monto_solicitado,
    );

    const moraReq = liquidacion?.moraFijaSugerida ?? Number(mora) ?? 0;
    const intReq = liquidacion?.interesDevengado ?? Number(interes) ?? 0;

    const dist = distribuirMontoCobro(num, moraReq, intReq, saldo);
    setMora(String(dist.pagoMora));
    setInteres(String(dist.pagoInteres));
    setAbonoCapital(String(dist.pagoCapital));
  }

  const saldoActual = prestamo
    ? Number(
        prestamo.saldo_capital !== null && prestamo.saldo_capital !== undefined
          ? prestamo.saldo_capital
          : prestamo.monto_aprobado || prestamo.monto_solicitado,
      )
    : 0;
  const capNum = Number(abonoCapital) || 0;
  const intNum = Number(interes) || 0;
  const morNum = Number(mora) || 0;
  const aspNum = Number(ahorroSobrePrestamo) || 0;
  const totalCobro = capNum + intNum + morNum + aspNum;
  const saldoNuevo = Math.max(0, Math.round((saldoActual - capNum) * 100) / 100);

  const esExcedenteCapital =
    liquidacion && capNum > liquidacion.cuotaCapitalSugerida && capNum <= saldoActual;
  const excedenteMonto = liquidacion ? Math.round((capNum - liquidacion.cuotaCapitalSugerida) * 100) / 100 : 0;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!prestamo || !socio) return;
    if (totalCobro <= 0) {
      setError("El monto total a cobrar debe ser mayor a cero.");
      return;
    }

    if (usarDebitoAhorro && !cuentaDebitoSeleccionada) {
      setError("Selecciona la cuenta de ahorro a debitar.");
      return;
    }

    setError(null);
    setGuardando(true);
    try {
      const { data } = await api.post<{
        pago: { numero_recibo?: string };
        cajaMovimiento: { contador?: number };
        saldoCapitalRestante?: number;
        ahorroSobrePrestamoAcreditado?: number;
        cuentaAsp?: { id: string; numero_cuenta: string };
      }>(`/caja-auxiliar/${diaId}/cobro-credito`, {
        prestamoId: prestamo.id,
        socioId: socio.id,
        abonoCapital: capNum,
        interes: intNum,
        mora: morNum,
        ahorroSobrePrestamo: aspNum,
        origenFondos,
        docNo: docNo || undefined,
        cuentaDebitoId: usarDebitoAhorro && cuentaDebitoSeleccionada ? cuentaDebitoSeleccionada : undefined,
      });

      const aspPrev = cuentasDebito.find((c) => c.tipo === "AHORRO_SOBRE_PRESTAMO")?.saldo_actual;
      const saldoAspTotal = (Number(aspPrev) || 0) + aspNum;

      setReciboModal({
        numeroRecibo: docNo || data.pago?.numero_recibo || String(data.cajaMovimiento?.contador || "—"),
        fecha: new Date().toLocaleDateString("es-GT"),
        hora: new Date().toLocaleTimeString("es-GT", { hour: "2-digit", minute: "2-digit" }),
        socioNombre: socio.nombres,
        socioNumero: socio.numero_asociado,
        socioDpi: socio.dpi,
        socioTelefono: socio.telefono,
        creditoCodigo: prestamo.codigo,
        creditoTipo: prestamo.tipo,
        numeroCreditoAnterior: prestamo.numero_credito_anterior,
        origenFondos,
        agenciaNombre: prestamo.agencia_nombre || "Agencia MIF COOP",
        saldoCapitalAnterior: saldoActual,
        abonoCapital: capNum,
        interes: intNum,
        mora: morNum,
        ahorroSobrePrestamo: aspNum,
        totalPagado: totalCobro,
        saldoCapitalRestante: data.saldoCapitalRestante ?? saldoNuevo,
        cuentaAspNumero: data.cuentaAsp?.numero_cuenta,
        saldoAspAcumulado: aspNum > 0 ? saldoAspTotal : undefined,
        cajeroNombre: usuario?.nombre || "Cajero en Turno",
        formaPago: usarDebitoAhorro ? "DÉBITO DE CUENTA" : "EFECTIVO",
      });
    } catch (err) {
      setError(mensajeError(err));
    } finally {
      setGuardando(false);
    }
  }

  return (
    <form className="card" onSubmit={onSubmit} style={{ maxWidth: 740, marginBottom: "1.5rem", border: "2px solid #059669" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
        <h2 style={{ margin: 0, fontSize: "1.1rem", color: "#065f46" }}>💵 Cobro de Cuota de Crédito en Ventanilla</h2>
        <span className="badge" style={{ background: "#ecfdf5", color: "#065f46", fontWeight: 700 }}>
          Ingresos COMIF
        </span>
      </div>
      <p style={{ fontSize: "0.85rem", color: "var(--ink-soft)", margin: "0 0 1rem" }}>
        Liquidación automática de intereses diarios exactos (base 365 días), mora fija de Q 25 tras 4 días de gracia y distribución de excedentes directo a Capital.
      </p>

      {error && <div className="alert error">{error}</div>}

      <div className="field">
        <label>Socio que realiza el pago</label>
        <BuscadorSocio agenciaId={agenciaId} seleccionado={socio} onSeleccionar={setSocio} />
      </div>

      {cargandoPrestamos && <p style={{ fontSize: "0.85rem", color: "var(--ink-soft)" }}>Buscando créditos activos…</p>}

      {socio && !cargandoPrestamos && prestamos.length === 0 && (
        <div className="alert warning" style={{ marginTop: "0.5rem" }}>
          El socio <strong>{socio.nombres}</strong> no tiene préstamos activos para cobro.
        </div>
      )}

      {prestamos.length > 1 && (
        <div className="field">
          <label>Selecciona el préstamo a cobrar</label>
          <select
            value={prestamo?.id ?? ""}
            onChange={(e) => {
              const p = prestamos.find((x) => x.id === e.target.value);
              if (p) cargarLiquidacion(p);
            }}
          >
            {prestamos.map((p) => (
              <option key={p.id} value={p.id}>
                {p.codigo} {p.numero_credito_anterior ? `[Ref: ${p.numero_credito_anterior}]` : ""} — {p.tipo} (Saldo: {formatoQ(p.saldo_capital ?? p.monto_aprobado ?? p.monto_solicitado)})
              </option>
            ))}
          </select>
        </div>
      )}

      {prestamo && (
        <>
          {prestamo.numero_credito_anterior && (
            <div
              style={{
                marginBottom: "0.85rem",
                padding: "0.55rem 0.85rem",
                background: "rgba(245, 158, 11, 0.08)",
                border: "1px solid #f59e0b",
                borderRadius: "8px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "0.5rem",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span style={{ fontSize: "1.1rem" }}>📋</span>
                <span style={{ fontSize: "0.86rem", color: "#92400e", fontWeight: 700 }}>
                  Expediente Físico / Crédito Anterior: <span className="mono" style={{ fontSize: "0.95rem" }}>{prestamo.numero_credito_anterior}</span>
                </span>
              </div>
              <span className="badge" style={{ background: "#fef3c7", color: "#b45309", border: "1px solid #fde68a", fontSize: "0.72rem", fontWeight: 700 }}>
                CRÉDITO MIGRADO
              </span>
            </div>
          )}

          {/* SELECCIÓN DE 3 OPCIONES DE ORIGEN DE FONDOS */}
          <div
            style={{
              background: "var(--paper-raised)",
              border: "1px solid var(--line)",
              borderRadius: "8px",
              padding: "0.85rem",
              marginBottom: "1rem",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
              <span style={{ fontWeight: 700, fontSize: "0.86rem", color: "var(--ink)" }}>
                🏛️ Fuente / Origen de Fondos:
              </span>
              <span style={{ fontSize: "0.74rem", color: "var(--ink-soft)" }}>
                {prestamo.origen_fondos ? `Asignado al crédito: ${ORIGEN_FONDOS_LABEL[prestamo.origen_fondos]}` : "Predeterminado: Fondos Propios"}
              </span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "0.5rem" }}>
              {(
                [
                  { id: "FONDOS_PROPIOS", num: "1", label: "Fondos Propios", icon: "🏦", desc: "MIF COOP" },
                  { id: "FEDERURAL", num: "2", label: "FEDERURAL", icon: "🌾", desc: "Línea Federural" },
                  { id: "CHN_GUATEMALA", num: "3", label: "CHN-GUATEMALA", icon: "🏛️", desc: "Crédito Hipotecario Nal." },
                ] as const
              ).map((opt) => {
                const activo = origenFondos === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setOrigenFondos(opt.id)}
                    style={{
                      padding: "0.6rem 0.75rem",
                      borderRadius: "8px",
                      border: activo ? "2px solid #059669" : "1px solid var(--line)",
                      background: activo ? "rgba(5, 150, 105, 0.12)" : "var(--paper)",
                      color: activo ? "#065f46" : "var(--ink)",
                      fontWeight: activo ? 700 : 500,
                      cursor: "pointer",
                      textAlign: "left",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.55rem",
                      transition: "all 0.15s ease",
                    }}
                  >
                    <span style={{ fontSize: "1.25rem" }}>{opt.icon}</span>
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      <span style={{ fontSize: "0.86rem", fontWeight: activo ? 800 : 600 }}>
                        <span style={{ opacity: 0.65, marginRight: "0.25rem" }}>{opt.num}.</span>
                        {opt.label}
                      </span>
                      <span style={{ fontSize: "0.7rem", color: activo ? "#047857" : "var(--ink-soft)" }}>
                        {opt.desc}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* PANEL DE LIQUIDACIÓN EN VIVO (DÍAS TRANSCURRIDOS, INTERÉS DIARIO Y MORA) */}
          <div
            style={{
              background: "rgba(16, 185, 129, 0.06)",
              border: "1px solid rgba(16, 185, 129, 0.3)",
              borderRadius: "8px",
              padding: "0.85rem",
              marginBottom: "1rem",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.6rem" }}>
              <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "#065f46", textTransform: "uppercase" }}>
                ⚡ Liquidación al Día de Hoy ({liquidacion ? liquidacion.fechaLiquidacion : "Hoy"})
              </span>
              <span style={{ fontSize: "0.78rem", color: "var(--ink-soft)" }}>
                {cargandoLiquidacion ? "Calculando días…" : `Último pago: ${liquidacion?.fechaUltimoPago ?? "—"}`}
              </span>
            </div>

            {liquidacion ? (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
                  gap: "0.6rem",
                  fontSize: "0.82rem",
                }}
              >
                <div style={{ background: "var(--paper)", padding: "0.5rem", borderRadius: "6px", border: "1px solid var(--line)" }}>
                  <span style={{ color: "var(--ink-soft)", display: "block", fontSize: "0.72rem" }}>Días transcurridos</span>
                  <strong style={{ fontSize: "0.95rem", color: "var(--ink)" }}>{liquidacion.diasTranscurridos} días</strong>
                  <span style={{ fontSize: "0.68rem", color: "var(--ink-soft)", display: "block" }}>
                    {liquidacion.diasAtraso > 0 ? `${liquidacion.diasAtraso} días de atraso` : "Al día"}
                  </span>
                </div>

                <div style={{ background: "var(--paper)", padding: "0.5rem", borderRadius: "6px", border: "1px solid var(--line)" }}>
                  <span style={{ color: "var(--ink-soft)", display: "block", fontSize: "0.72rem" }}>Interés diario ({liquidacion.tasaInteresAnual}% anual)</span>
                  <strong style={{ fontSize: "0.95rem", color: "#d97706" }}>{formatoQ(liquidacion.interesDiario)} / día</strong>
                  <span style={{ fontSize: "0.68rem", color: "var(--ink-soft)", display: "block" }}>
                    ({formatoQ(saldoActual)} × 24% / 365)
                  </span>
                </div>

                <div style={{ background: "var(--paper)", padding: "0.5rem", borderRadius: "6px", border: "1px solid var(--line)" }}>
                  <span style={{ color: "var(--ink-soft)", display: "block", fontSize: "0.72rem" }}>Interés acumulado ({liquidacion.diasTranscurridos}d)</span>
                  <strong style={{ fontSize: "0.95rem", color: "#d97706" }}>{formatoQ(liquidacion.interesDevengado)}</strong>
                  <span style={{ fontSize: "0.68rem", color: "var(--ink-soft)", display: "block" }}>
                    {formatoQ(liquidacion.interesDiario)} × {liquidacion.diasTranscurridos}d
                  </span>
                </div>

                <div
                  style={{
                    background: liquidacion.estaEnMora ? "rgba(220, 38, 38, 0.08)" : "var(--paper)",
                    border: liquidacion.estaEnMora ? "1px solid #ef4444" : "1px solid var(--line)",
                    padding: "0.5rem",
                    borderRadius: "6px",
                  }}
                >
                  <span style={{ color: liquidacion.estaEnMora ? "#b91c1c" : "var(--ink-soft)", display: "block", fontSize: "0.72rem" }}>
                    Recargo por mora
                  </span>
                  <strong style={{ fontSize: "0.95rem", color: liquidacion.estaEnMora ? "#b91c1c" : "var(--ink)" }}>
                    {formatoQ(liquidacion.moraFijaSugerida)}
                  </strong>
                  <span style={{ fontSize: "0.68rem", color: liquidacion.estaEnMora ? "#b91c1c" : "var(--ink-soft)", display: "block" }}>
                    {liquidacion.estaEnMora ? `(Q25 × ${Math.round(liquidacion.moraFijaSugerida / 25)} cuotas vencidas)` : "4 días gracia: Q 0.00"}
                  </span>
                </div>
              </div>
            ) : null}

            {/* BOTONES DE PRECARGA RÁPIDA (CUOTA OFICIAL DE TABLA, LIQUIDACIÓN A HOY O CANCELACIÓN) */}
            {liquidacion && (
              <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.75rem", flexWrap: "wrap" }}>
                <button
                  type="button"
                  className="btn secondary"
                  style={{
                    fontSize: "0.78rem",
                    padding: "0.3rem 0.65rem",
                    background: "rgba(16, 185, 129, 0.12)",
                    border: "1.5px solid #059669",
                    color: "#065f46",
                    fontWeight: 700,
                  }}
                  onClick={() => {
                    const cap = liquidacion.cuotaCapitalBase || liquidacion.cuotaCapitalSugerida;
                    const int = liquidacion.interesMesCompleto || liquidacion.interesDevengado;
                    const mor = liquidacion.moraFijaSugerida || 0;
                    const tot = Math.round((cap + int + mor) * 100) / 100;
                    setAbonoCapital(String(cap));
                    setInteres(String(int));
                    setMora(String(mor));
                    setMontoEntregadoInput(String(tot));
                  }}
                >
                  📅 Cuota Oficial de la Tabla ({formatoQ(liquidacion.cuotaProgramadaOficial || (liquidacion.cuotaCapitalBase ? liquidacion.cuotaCapitalBase + (liquidacion.interesMesCompleto || 0) : liquidacion.pagoMinimoSugerido))})
                </button>

                <button
                  type="button"
                  className="btn secondary"
                  style={{ fontSize: "0.76rem", padding: "0.3rem 0.65rem" }}
                  onClick={() => {
                    const cap = liquidacion.cuotaCapitalSugerida;
                    const int = liquidacion.interesDevengado;
                    const mor = liquidacion.moraFijaSugerida;
                    const tot = Math.round((cap + int + mor) * 100) / 100;
                    setAbonoCapital(String(cap));
                    setInteres(String(int));
                    setMora(String(mor));
                    setMontoEntregadoInput(String(tot));
                  }}
                >
                  ⚡ Liquidación a Hoy ({liquidacion.diasTranscurridos}d: {formatoQ(Math.round((liquidacion.cuotaCapitalSugerida + liquidacion.interesDevengado + liquidacion.moraFijaSugerida) * 100) / 100)})
                </button>

                <button
                  type="button"
                  className="btn secondary"
                  style={{ fontSize: "0.76rem", padding: "0.3rem 0.65rem", borderColor: "#10b981", color: "#10b981", fontWeight: 700 }}
                  onClick={() => {
                    const cap = saldoActual;
                    const int = liquidacion.interesDevengado;
                    const mor = liquidacion.moraFijaSugerida;
                    const tot = Math.round((cap + int + mor) * 100) / 100;
                    setAbonoCapital(String(cap));
                    setInteres(String(int));
                    setMora(String(mor));
                    setMontoEntregadoInput(String(tot));
                  }}
                >
                  🏁 Liquidar / Cancelar Total ({formatoQ(liquidacion.saldoCancelacionTotal)})
                </button>
              </div>
            )}
          </div>

          {/* CAMPO: MONTO ENTREGADO POR EL SOCIO */}
          <div
            style={{
              background: "var(--paper-raised)",
              padding: "0.85rem",
              borderRadius: "8px",
              border: "1px solid var(--accent)",
              marginBottom: "1rem",
            }}
          >
            <label htmlFor="monto-entregado" style={{ fontWeight: 700, fontSize: "0.92rem", display: "block", marginBottom: "0.3rem" }}>
              💵 Monto Total Entregado por el Socio (Q)
            </label>
            <input
              id="monto-entregado"
              type="number"
              step="0.01"
              min="0"
              placeholder="Ingresa la cantidad que el socio va a pagar…"
              value={montoEntregadoInput}
              onChange={(e) => handleMontoEntregadoChange(e.target.value)}
              style={{ fontSize: "1.15rem", fontWeight: 700, width: "100%", padding: "0.55rem" }}
            />
            <span className="hint" style={{ marginTop: "0.3rem", display: "block" }}>
              Si el socio paga más de la cuota mínima, el excedente se aplicará automáticamente directo a amortizar el Capital.
            </span>
          </div>

          {/* AVISO DE ABONO EXTRAORDINARIO A CAPITAL (COMPACTO) */}
          {esExcedenteCapital && (
            <div
              style={{
                marginBottom: "0.85rem",
                padding: "0.45rem 0.75rem",
                background: "rgba(16, 185, 129, 0.12)",
                border: "1px solid rgba(16, 185, 129, 0.4)",
                borderRadius: "6px",
                display: "flex",
                alignItems: "center",
                gap: "0.45rem",
                fontSize: "0.8rem",
                color: "#065f46",
              }}
            >
              <span style={{ fontSize: "0.95rem" }}>⚡</span>
              <span>
                <strong>Abono Extraordinario:</strong> Excedente de <strong>{formatoQ(excedenteMonto)}</strong> directo a Capital (Saldo nuevo: <strong>{formatoQ(saldoNuevo)}</strong>).
              </span>
            </div>
          )}

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
            <span style={{ fontSize: "0.86rem", fontWeight: 700, color: "var(--ink)" }}>
              Desglose de Pago (100% editable por ventanilla)
            </span>
            <button
              type="button"
              className="btn secondary"
              style={{ fontSize: "0.74rem", padding: "0.2rem 0.55rem" }}
              onClick={() => {
                if (prestamo) cargarLiquidacion(prestamo);
              }}
              title="Restablecer a los valores calculados automáticamente por el sistema"
            >
              ↺ Restablecer valores sugeridos
            </button>
          </div>

          <div className="form-grid">
            <div className="field">
              <label htmlFor="abono-cap">Abono a Capital (Q)</label>
              <input
                id="abono-cap"
                type="number"
                step="0.01"
                min="0"
                value={abonoCapital}
                onChange={(e) => setAbonoCapital(e.target.value)}
                required
              />
              <span className="hint">Amortización directa al capital</span>
            </div>

            <div className="field">
              <label htmlFor="abono-int">Interés del Préstamo (Q)</label>
              <input
                id="abono-int"
                type="number"
                step="0.01"
                min="0"
                value={interes}
                onChange={(e) => setInteres(e.target.value)}
                required
              />
              <span className="hint">Interés devengado por días de uso</span>
            </div>

            <div className="field">
              <label htmlFor="abono-asp" style={{ color: "#0369a1", fontWeight: 700 }}>
                🛡️ Ahorro sobre Préstamo (Q)
              </label>
              <input
                id="abono-asp"
                type="number"
                step="0.01"
                min="0"
                value={ahorroSobrePrestamo}
                onChange={(e) => setAhorroSobrePrestamo(e.target.value)}
              />
              <span className="hint" style={{ color: "#0284c7" }}>Se deposita a su cuenta de garantía</span>
            </div>

            <div className="field">
              <label htmlFor="abono-mora">Mora / Recargo (Q)</label>
              <input
                id="abono-mora"
                type="number"
                step="0.01"
                min="0"
                value={mora}
                onChange={(e) => setMora(e.target.value)}
              />
              <span className="hint">Q25 tras 4 días de gracia</span>
            </div>

            <div className="field" style={{ gridColumn: "1 / -1" }}>
              <label htmlFor="doc-no-recibo">No. de Recibo Oficial</label>
              <input
                id="doc-no-recibo"
                placeholder="Ej. 2257"
                value={docNo}
                onChange={(e) => setDocNo(e.target.value)}
                required
              />
              <span className="hint">Número impreso en el recibo entregado al socio</span>
            </div>
          </div>

          <div
            style={{
              background: "#f0fdf4",
              border: "1px solid #bbf7d0",
              borderRadius: "8px",
              padding: "0.8rem",
              marginTop: "0.5rem",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "0.5rem",
            }}
          >
            <div>
              <div style={{ fontSize: "0.82rem", color: "#166534" }}>
                Saldo capital restante tras el pago: <strong>{formatoQ(saldoNuevo)}</strong>
                {saldoNuevo === 0 && (
                  <span style={{ marginLeft: "0.5rem", color: "#15803d", fontWeight: 700 }}>
                    🎉 ¡Crédito Liquidado al 100%!
                  </span>
                )}
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <span style={{ fontSize: "0.82rem", color: "#166534" }}>Total a ingresar a caja: </span>
              <strong style={{ fontSize: "1.25rem", color: "#166534" }}>{formatoQ(totalCobro)}</strong>
            </div>
          </div>

          {/* Opción de cobro mediante Ahorro sobre Préstamo (Garantía) */}
          <div
            className="field"
            style={{
              background: usarDebitoAhorro ? "rgba(245, 158, 11, 0.08)" : "var(--paper-raised)",
              border: usarDebitoAhorro ? "1px solid #f59e0b" : "1px solid var(--line)",
              padding: "0.85rem 1rem",
              borderRadius: "8px",
              marginTop: "0.75rem",
            }}
          >
            <label style={{ display: "flex", alignItems: "center", gap: "0.6rem", cursor: "pointer", fontWeight: 700, color: "var(--ink)" }}>
              <input
                type="checkbox"
                checked={usarDebitoAhorro}
                onChange={(e) => setUsarDebitoAhorro(e.target.checked)}
                style={{ width: "1.15rem", height: "1.15rem" }}
              />
              🛡️ Cobrar cuota mediante débito a Cuenta de Ahorro sobre Préstamo (Garantía)
            </label>
            {usarDebitoAhorro && (
              <div style={{ marginTop: "0.6rem" }}>
                <p style={{ fontSize: "0.82rem", color: "var(--ink-soft)", margin: "0 0 0.5rem" }}>
                  Aplica fondos de la cuenta de ahorro en garantía del socio para amortizar esta cuota (por mora o impago).
                </p>
                {cuentasDebito.length > 0 ? (
                  <select
                    value={cuentaDebitoSeleccionada}
                    onChange={(e) => setCuentaDebitoSeleccionada(e.target.value)}
                    style={{ width: "100%", padding: "0.55rem", borderRadius: "6px", border: "1px solid var(--line)", background: "var(--paper)" }}
                  >
                    {cuentasDebito.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.tipo === "AHORRO_SOBRE_PRESTAMO" ? "🛡️ [Ahorro sobre Préstamo] " : ""}
                        {c.numero_cuenta} — Saldo disponible: {formatoQ(c.saldo_actual)}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div style={{ color: "#ef4444", fontSize: "0.85rem", marginTop: "0.4rem" }}>
                    ⚠️ El socio no tiene cuentas de ahorro con saldo disponible para debitar.
                  </div>
                )}
              </div>
            )}
          </div>

          <div style={{ display: "flex", gap: "0.75rem", marginTop: "1rem" }}>
            <button
              type="submit"
              className="btn"
              style={{
                background: usarDebitoAhorro ? "#d97706" : "#059669",
                borderColor: usarDebitoAhorro ? "#d97706" : "#059669",
                fontWeight: 700,
              }}
              disabled={guardando || totalCobro <= 0 || (usarDebitoAhorro && (!cuentaDebitoSeleccionada || cuentasDebito.length === 0))}
            >
              {guardando
                ? "Registrando cobro…"
                : usarDebitoAhorro
                ? `🛡️ Cobrar con Débito de Ahorro ${formatoQ(totalCobro)}`
                : `💵 Registrar Cobro de ${formatoQ(totalCobro)} en Caja`}
            </button>
          </div>
        </>
      )}

      {reciboModal && (
        <ReciboCobroCreditoModal
          datos={reciboModal}
          onClose={() => {
            setReciboModal(null);
            onCobrado();
          }}
        />
      )}
    </form>
  );
}

function DesembolsoCreditoForm({
  agenciaId,
  diaId,
  saldoCajaActual,
  onDesembolsado,
}: {
  agenciaId: string;
  diaId: string;
  saldoCajaActual: number;
  onDesembolsado: () => void;
}) {
  const [prestamos, setPrestamos] = useState<Prestamo[]>([]);
  const [prestamo, setPrestamo] = useState<Prestamo | null>(null);
  const [origenFondos, setOrigenFondos] = useState<OrigenFondos>("FONDOS_PROPIOS");
  const [cargando, setCargando] = useState(true);
  const [docNo, setDocNo] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setCargando(true);
    api
      .get<Prestamo[]>("/prestamos", { params: { agenciaId, estado: "APROBADO" } })
      .then(({ data }) => {
        setPrestamos(data);
        if (data[0]) {
          setPrestamo(data[0]);
          setOrigenFondos(data[0].origen_fondos || "FONDOS_PROPIOS");
        }
      })
      .catch((err) => setError(mensajeError(err)))
      .finally(() => setCargando(false));
  }, [agenciaId]);

  const [retencionAspOpcion, setRetencionAspOpcion] = useState<"0" | "5" | "10" | "custom">("5");
  const [retencionAspMontoInput, setRetencionAspMontoInput] = useState<string>("");

  const montoAprobado = prestamo ? Number(prestamo.monto_aprobado || prestamo.monto_solicitado) : 0;
  
  let montoAspRetenido = 0;
  if (retencionAspOpcion === "5") montoAspRetenido = Math.round(montoAprobado * 0.05 * 100) / 100;
  else if (retencionAspOpcion === "10") montoAspRetenido = Math.round(montoAprobado * 0.10 * 100) / 100;
  else if (retencionAspOpcion === "custom") montoAspRetenido = Math.max(0, Math.min(montoAprobado, Number(retencionAspMontoInput) || 0));

  const efectivoNetoAEntregar = Math.max(0, Math.round((montoAprobado - montoAspRetenido) * 100) / 100);
  const saldoInsuficiente = efectivoNetoAEntregar > saldoCajaActual;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!prestamo) return;
    if (saldoInsuficiente) {
      setError("No hay suficiente saldo físico en la caja para desembolsar este crédito.");
      return;
    }
    setError(null);
    setGuardando(true);
    try {
      await api.post(`/caja-auxiliar/${diaId}/desembolso-credito`, {
        prestamoId: prestamo.id,
        docNo: docNo || undefined,
        origenFondos,
        montoAhorroSobrePrestamo: montoAspRetenido,
      });
      onDesembolsado();
    } catch (err) {
      setError(mensajeError(err));
      setGuardando(false);
    }
  }

  return (
    <form className="card" onSubmit={onSubmit} style={{ maxWidth: 680, marginBottom: "1.5rem", border: "2px solid #2563eb" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
        <h2 style={{ margin: 0, fontSize: "1.1rem", color: "#1d4ed8" }}>📤 Desembolso de Crédito en Ventanilla</h2>
        <span className="badge" style={{ background: "#dbeafe", color: "#1e40af", fontWeight: 700 }}>
          Colocación (Egreso)
        </span>
      </div>
      <p style={{ fontSize: "0.85rem", color: "var(--ink-soft)", margin: "0 0 1rem" }}>
        Entrega física de efectivo al socio por crédito aprobado. Reduce el efectivo de caja, acredita el Ahorro sobre Préstamo y activa el préstamo.
      </p>

      {error && <div className="alert error">{error}</div>}

      {cargando && <p style={{ fontSize: "0.85rem", color: "var(--ink-soft)" }}>Buscando créditos aprobados…</p>}

      {!cargando && prestamos.length === 0 && (
        <div className="alert info">
          No hay créditos en estado <strong>APROBADO</strong> pendientes de desembolsar en esta agencia.
        </div>
      )}

      {prestamos.length > 0 && (
        <>
          <div className="field">
            <label>Selecciona el crédito aprobado a desembolsar</label>
            <select
              value={prestamo?.id ?? ""}
              onChange={(e) => {
                const p = prestamos.find((x) => x.id === e.target.value);
                if (p) {
                  setPrestamo(p);
                  setOrigenFondos(p.origen_fondos || "FONDOS_PROPIOS");
                }
              }}
            >
              {prestamos.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.codigo} — {p.socio_nombres} ({p.tipo}) - {formatoQ(p.monto_aprobado || p.monto_solicitado)}
                </option>
              ))}
            </select>
          </div>

          {prestamo && (
            <>
              {/* SELECCIÓN DE ORIGEN DE FONDOS EN DESEMBOLSO */}
              <div
                style={{
                  background: "var(--paper-raised)",
                  border: "1px solid var(--line)",
                  borderRadius: "8px",
                  padding: "0.85rem",
                  marginBottom: "1rem",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                  <span style={{ fontWeight: 700, fontSize: "0.86rem", color: "var(--ink)" }}>
                    🏛️ Fuente / Origen de Fondos a Desembolsar:
                  </span>
                  <span style={{ fontSize: "0.74rem", color: "var(--ink-soft)" }}>
                    {prestamo.origen_fondos ? `Asignado: ${ORIGEN_FONDOS_LABEL[prestamo.origen_fondos]}` : "Predeterminado: Fondos Propios"}
                  </span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "0.5rem" }}>
                  {(
                    [
                      { id: "FONDOS_PROPIOS", num: "1", label: "Fondos Propios", icon: "🏦", desc: "MIF COOP" },
                      { id: "FEDERURAL", num: "2", label: "FEDERURAL", icon: "🌾", desc: "Línea Federural" },
                      { id: "CHN_GUATEMALA", num: "3", label: "CHN-GUATEMALA", icon: "🏛️", desc: "Crédito Hipotecario Nal." },
                    ] as const
                  ).map((opt) => {
                    const activo = origenFondos === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setOrigenFondos(opt.id)}
                        style={{
                          padding: "0.6rem 0.75rem",
                          borderRadius: "8px",
                          border: activo ? "2px solid #2563eb" : "1px solid var(--line)",
                          background: activo ? "rgba(37, 99, 235, 0.1)" : "var(--paper)",
                          color: activo ? "#1d4ed8" : "var(--ink)",
                          fontWeight: activo ? 700 : 500,
                          cursor: "pointer",
                          textAlign: "left",
                          display: "flex",
                          alignItems: "center",
                          gap: "0.55rem",
                          transition: "all 0.15s ease",
                        }}
                      >
                        <span style={{ fontSize: "1.25rem" }}>{opt.icon}</span>
                        <div style={{ display: "flex", flexDirection: "column" }}>
                          <span style={{ fontSize: "0.86rem", fontWeight: activo ? 800 : 600 }}>
                            <span style={{ opacity: 0.65, marginRight: "0.25rem" }}>{opt.num}.</span>
                            {opt.label}
                          </span>
                          <span style={{ fontSize: "0.7rem", color: activo ? "#1d4ed8" : "var(--ink-soft)" }}>
                            {opt.desc}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
                  gap: "0.5rem",
                  background: "var(--paper-raised)",
                  padding: "0.75rem",
                  borderRadius: "8px",
                  marginBottom: "1rem",
                  fontSize: "0.85rem",
                }}
              >
                <div>
                  <span style={{ color: "var(--ink-soft)" }}>Socio:</span>{" "}
                  <strong>{prestamo.socio_nombres}</strong>
                </div>
                <div>
                  <span style={{ color: "var(--ink-soft)" }}>Tipo:</span> <strong>{prestamo.tipo}</strong>
                </div>
                <div>
                  <span style={{ color: "var(--ink-soft)" }}>Plazo:</span>{" "}
                  <strong>{prestamo.plazo_meses} meses</strong>
                </div>
                <div>
                  <span style={{ color: "var(--ink-soft)" }}>Cuota mensual pactada:</span>{" "}
                  <strong>{formatoQ(prestamo.cuota_mensual)}</strong>
                </div>
              </div>

              {/* SECCIÓN DE RETENCIÓN DE AHORRO SOBRE PRÉSTAMO */}
              <div
                style={{
                  background: "rgba(14, 165, 233, 0.08)",
                  border: "1px solid rgba(14, 165, 233, 0.35)",
                  borderRadius: "8px",
                  padding: "0.85rem 1rem",
                  marginBottom: "1rem",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                  <label style={{ fontWeight: 700, color: "var(--ink)", margin: 0, fontSize: "0.9rem" }}>
                    🛡️ Retención de Ahorro sobre Préstamo (Garantía Institucional)
                  </label>
                  <span className="badge" style={{ background: "#e0f2fe", color: "#0369a1", fontWeight: 700, fontSize: "0.75rem" }}>
                    {montoAspRetenido > 0 ? `+ ${formatoQ(montoAspRetenido)} a su cuenta` : "Sin retención"}
                  </span>
                </div>
                <p style={{ fontSize: "0.8rem", color: "var(--ink-soft)", margin: "0 0 0.6rem" }}>
                  Se acreditará automáticamente a la cuenta de <strong>Ahorro sobre Préstamo</strong> del socio como respaldo de garantía.
                </p>

                <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center" }}>
                  {[
                    { id: "5", label: `5% (${formatoQ(montoAprobado * 0.05)})` },
                    { id: "10", label: `10% (${formatoQ(montoAprobado * 0.10)})` },
                    { id: "custom", label: "Monto personalizado (Q)" },
                    { id: "0", label: "0% (Sin retención)" },
                  ].map((op) => (
                    <button
                      key={op.id}
                      type="button"
                      className={`btn ${retencionAspOpcion === op.id ? "" : "secondary"}`}
                      style={{
                        padding: "0.3rem 0.65rem",
                        fontSize: "0.8rem",
                        fontWeight: retencionAspOpcion === op.id ? 700 : 500,
                        background: retencionAspOpcion === op.id ? "#0284c7" : undefined,
                        borderColor: retencionAspOpcion === op.id ? "#0284c7" : undefined,
                      }}
                      onClick={() => setRetencionAspOpcion(op.id as any)}
                    >
                      {op.label}
                    </button>
                  ))}
                </div>

                {retencionAspOpcion === "custom" && (
                  <div style={{ marginTop: "0.6rem", maxWidth: "250px" }}>
                    <label style={{ fontSize: "0.78rem", color: "var(--ink-soft)" }}>Monto en Quetzales a retener:</label>
                    <input
                      type="number"
                      min="0"
                      max={montoAprobado}
                      step="0.01"
                      placeholder="Ej. 250.00"
                      value={retencionAspMontoInput}
                      onChange={(e) => setRetencionAspMontoInput(e.target.value)}
                      style={{ padding: "0.4rem", borderRadius: "6px" }}
                    />
                  </div>
                )}
              </div>

              <div className="form-grid">
                <div className="field">
                  <label>Monto total del préstamo aprobado</label>
                  <input
                    type="text"
                    value={formatoQ(montoAprobado)}
                    disabled
                    style={{ fontWeight: 700, fontSize: "1.05rem" }}
                  />
                </div>

                <div className="field">
                  <label htmlFor="doc-desembolso">No. Comprobante / Cheque de Egreso</label>
                  <input
                    id="doc-desembolso"
                    placeholder="Ej. 003512 o CHQ-4451"
                    value={docNo}
                    onChange={(e) => setDocNo(e.target.value)}
                    required
                  />
                  <span className="hint">Número impreso en el documento de entrega firmado</span>
                </div>
              </div>

              {saldoInsuficiente ? (
                <div className="alert error" style={{ marginTop: "0.75rem" }}>
                  ⚠️ Saldo insuficiente en caja: Se requieren {formatoQ(efectivoNetoAEntregar)} en efectivo neto, pero la caja física solo tiene {formatoQ(saldoCajaActual)}. Ingrese fondos antes de desembolsar.
                </div>
              ) : (
                <div
                  style={{
                    background: "#eff6ff",
                    border: "1px solid #bfdbfe",
                    borderRadius: "8px",
                    padding: "0.85rem",
                    marginTop: "0.5rem",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: "0.5rem",
                  }}
                >
                  <div style={{ fontSize: "0.82rem", color: "#1e40af" }}>
                    <div>Monto Aprobado: <strong>{formatoQ(montoAprobado)}</strong></div>
                    {montoAspRetenido > 0 && (
                      <div style={{ color: "#0369a1" }}>
                        🛡️ Ahorro Retenido: <strong>- {formatoQ(montoAspRetenido)}</strong>
                      </div>
                    )}
                    <div>Saldo en caja tras entrega: <strong>{formatoQ(saldoCajaActual - efectivoNetoAEntregar)}</strong></div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <span style={{ fontSize: "0.82rem", color: "#1e40af" }}>Efectivo neto a entregar al socio: </span>
                    <div style={{ fontSize: "1.35rem", fontWeight: 800, color: "#1e40af" }}>
                      {formatoQ(efectivoNetoAEntregar)}
                    </div>
                  </div>
                </div>
              )}

              <div style={{ display: "flex", gap: "0.75rem", marginTop: "1rem" }}>
                <button
                  type="submit"
                  className="btn"
                  style={{ background: "#2563eb", borderColor: "#2563eb", fontWeight: 700 }}
                  disabled={guardando || saldoInsuficiente}
                >
                  {guardando ? "Desembolsando…" : `📤 Desembolsar y Entregar ${formatoQ(efectivoNetoAEntregar)}`}
                </button>
              </div>
            </>
          )}
        </>
      )}
    </form>
  );
}

function PanelNovedadesCampo({
  agenciaId,
  onSeleccionarCuenta,
}: {
  agenciaId: string;
  onSeleccionarCuenta: (cuenta: Cuenta) => void;
}) {
  const [novedades, setNovedades] = useState<Cuenta[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    api
      .get<Cuenta[]>("/cuentas/novedades-campo", { params: { agenciaId } })
      .then(({ data }) => setNovedades(data))
      .catch(() => {})
      .finally(() => setCargando(false));
  }, [agenciaId]);

  if (cargando || novedades.length === 0) return null;

  return (
    <div
      style={{
        background: "linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)",
        border: "1px solid #a7f3d0",
        borderRadius: "10px",
        padding: "1rem",
        marginBottom: "1.5rem",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
        <h3 style={{ margin: 0, fontSize: "0.95rem", color: "#065f46", display: "flex", alignItems: "center", gap: "0.4rem" }}>
          <span>🔔</span> Novedades de Campo (Cuentas aperturadas por Promotores)
        </h3>
        <span className="badge" style={{ background: "#d1fae5", color: "#065f46" }}>
          {novedades.length} {novedades.length === 1 ? "cuenta reciente" : "cuentas recientes"}
        </span>
      </div>
      <p style={{ margin: "0 0 0.75rem", fontSize: "0.82rem", color: "#047857" }}>
        El promotor registró estas cuentas con cuotas pactadas en campo. Haz clic para cobrar el depósito en ventanilla sin reescribir datos:
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "0.75rem" }}>
        {novedades.slice(0, 4).map((c) => (
          <div
            key={c.id}
            style={{
              background: "#fff",
              border: "1px solid #d1fae5",
              borderRadius: "8px",
              padding: "0.75rem",
              fontSize: "0.85rem",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
          >
            <div>
              <div style={{ fontWeight: 700, color: "var(--ink)" }}>{c.socio_nombres}</div>
              <div className="mono" style={{ fontSize: "0.8rem", color: "var(--ink-soft)" }}>
                {c.numero_cuenta} — {c.tipo.replace("AHORRO_", "")}
              </div>
              {c.promotor_nombre && (
                <div style={{ fontSize: "0.78rem", color: "var(--accent)", marginTop: "0.2rem" }}>
                  Promotor: <strong>{c.promotor_nombre}</strong>
                </div>
              )}
              {c.cuota_pactada && (
                <div style={{ marginTop: "0.25rem", color: "#059669", fontWeight: 600 }}>
                  Cuota pactada: {formatoQ(c.cuota_pactada)}
                </div>
              )}
              {c.observaciones_apertura && (
                <div style={{ fontSize: "0.78rem", color: "var(--ink-soft)", fontStyle: "italic", marginTop: "0.2rem" }}>
                  "{c.observaciones_apertura}"
                </div>
              )}
            </div>
            <div style={{ marginTop: "0.6rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span className="mono" style={{ fontSize: "0.78rem", color: Number(c.saldo_actual) > 0 ? "#16a34a" : "#dc2626" }}>
                Saldo: {formatoQ(c.saldo_actual)}
              </span>
              <button
                type="button"
                className="btn secondary"
                style={{ fontSize: "0.78rem", padding: "0.25rem 0.5rem" }}
                onClick={() => onSeleccionarCuenta(c)}
              >
                + Cobrar depósito
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function LiquidarPlazoFijoForm({
  agenciaId,
  diaId,
  saldoCajaActual,
  onLiquidado,
}: {
  agenciaId: string;
  diaId: string;
  saldoCajaActual: number;
  onLiquidado: () => void;
}) {
  const [contratos, setContratos] = useState<PlazoFijoContrato[]>([]);
  const [contrato, setContrato] = useState<PlazoFijoContrato | null>(null);
  const [cargando, setCargando] = useState(true);
  const [reciboRetiro, setReciboRetiro] = useState("");
  const [incluirIntereses, setIncluirIntereses] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setCargando(true);
    api
      .get<PlazoFijoContrato[]>("/plazo-fijo", { params: { agenciaId, estado: "ACTIVO" } })
      .then(({ data }) => {
        setContratos(data);
        if (data[0]) setContrato(data[0]);
      })
      .catch((err) => setError(mensajeError(err)))
      .finally(() => setCargando(false));
  }, [agenciaId]);

  const montoALiquidar = contrato
    ? (incluirIntereses ? Number(contrato.saldo_liquido_a_pagar) : Number(contrato.monto_deposito))
    : 0;

  const saldoInsuficiente = montoALiquidar > saldoCajaActual;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!contrato) return;
    if (!reciboRetiro.trim()) {
      setError("El número de recibo de egreso (RE. No.) es obligatorio.");
      return;
    }
    if (saldoInsuficiente) {
      setError("No hay suficiente saldo físico en la caja para liquidar este certificado.");
      return;
    }
    setError(null);
    setGuardando(true);
    try {
      await api.post(`/caja-auxiliar/${diaId}/liquidar-plazo-fijo`, {
        contratoId: contrato.id,
        reciboRetiro: reciboRetiro.trim(),
        incluirIntereses,
      });
      onLiquidado();
    } catch (err) {
      setError(mensajeError(err));
      setGuardando(false);
    }
  }

  return (
    <form className="card" onSubmit={onSubmit} style={{ maxWidth: 680, marginBottom: "1.5rem", border: "2px solid #7c3aed" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
        <h2 style={{ margin: 0, fontSize: "1.1rem", color: "#6d28d9" }}>📦 Liquidación de Plazo Fijo en Ventanilla</h2>
        <span className="badge" style={{ background: "#ede9fe", color: "#5b21b6", fontWeight: 700 }}>
          Retiro Plazo Fijo (Egreso)
        </span>
      </div>
      <p style={{ fontSize: "0.85rem", color: "var(--ink-soft)", margin: "0 0 1rem" }}>
        Entrega física de efectivo al socio por cancelación o retiro de Certificado de Plazo Fijo.
      </p>

      {error && <div className="alert error">{error}</div>}

      {cargando && <p style={{ fontSize: "0.85rem", color: "var(--ink-soft)" }}>Buscando certificados activos…</p>}

      {!cargando && contratos.length === 0 && (
        <div className="alert info">
          No hay certificados de <strong>Ahorro a Plazo Fijo</strong> activos en esta agencia.
        </div>
      )}

      {contratos.length > 0 && (
        <>
          <div className="field">
            <label>Selecciona el certificado a liquidar</label>
            <select
              value={contrato?.id ?? ""}
              onChange={(e) => {
                const c = contratos.find((x) => x.id === e.target.value);
                if (c) setContrato(c);
              }}
            >
              {contratos.map((c) => (
                <option key={c.id} value={c.id}>
                  Certificado #{c.numero_certificacion ?? "—"} • {c.socio_nombres} ({c.numero_cuenta}) — {formatoQ(c.monto_deposito)}
                </option>
              ))}
            </select>
          </div>

          {contrato && (
            <>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
                  gap: "0.5rem",
                  background: "var(--paper-raised)",
                  padding: "0.75rem",
                  borderRadius: "8px",
                  marginBottom: "1rem",
                  fontSize: "0.85rem",
                }}
              >
                <div>
                  <span style={{ color: "var(--ink-soft)" }}>Socio:</span>{" "}
                  <strong>{contrato.socio_nombres}</strong>
                </div>
                <div>
                  <span style={{ color: "var(--ink-soft)" }}>Cuenta:</span>{" "}
                  <strong>{contrato.numero_cuenta}</strong>
                </div>
                <div>
                  <span style={{ color: "var(--ink-soft)" }}>Capital invertido:</span>{" "}
                  <strong>{formatoQ(contrato.monto_deposito)}</strong>
                </div>
                <div>
                  <span style={{ color: "var(--ink-soft)" }}>Interés neto generado:</span>{" "}
                  <strong style={{ color: "#16a34a" }}>{formatoQ(contrato.interes_neto)}</strong>
                </div>
                <div>
                  <span style={{ color: "var(--ink-soft)" }}>Vencimiento:</span>{" "}
                  <strong>{new Date(contrato.fecha_vencimiento).toLocaleDateString("es-GT")}</strong>
                </div>
              </div>

              <div className="field">
                <label>Modalidad de Entrega de Fondos</label>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginTop: "0.25rem" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }}>
                    <input
                      type="radio"
                      name="pf-modalidad"
                      checked={!incluirIntereses}
                      onChange={() => setIncluirIntereses(false)}
                    />
                    <span>
                      <strong>Solo Capital:</strong> {formatoQ(contrato.monto_deposito)}
                    </span>
                  </label>
                  <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }}>
                    <input
                      type="radio"
                      name="pf-modalidad"
                      checked={incluirIntereses}
                      onChange={() => setIncluirIntereses(true)}
                    />
                    <span>
                      <strong>Capital + Interés Neto:</strong> {formatoQ(contrato.saldo_liquido_a_pagar)}
                    </span>
                  </label>
                </div>
              </div>

              <div className="form-grid">
                <div className="field">
                  <label>Monto a entregar en efectivo</label>
                  <input
                    type="text"
                    value={formatoQ(montoALiquidar)}
                    disabled
                    style={{ fontWeight: 700, fontSize: "1.1rem" }}
                  />
                </div>

                <div className="field">
                  <label htmlFor="recibo-pf-egreso">
                    No. Recibo de Retiro (<strong>RE. No.</strong>)
                  </label>
                  <input
                    id="recibo-pf-egreso"
                    placeholder="Ej. 882 o RE-1406"
                    value={reciboRetiro}
                    onChange={(e) => setReciboRetiro(e.target.value)}
                    required
                    style={{ fontWeight: 700 }}
                  />
                  <span className="hint">Número impreso en el recibo de egreso firmado por el socio</span>
                </div>
              </div>

              {saldoInsuficiente ? (
                <div className="alert error" style={{ marginTop: "0.75rem" }}>
                  ⚠️ Saldo insuficiente en caja: Se requieren {formatoQ(montoALiquidar)}, pero la caja solo tiene {formatoQ(saldoCajaActual)}. Ingrese fondos antes de liquidar.
                </div>
              ) : (
                <div
                  style={{
                    background: "#f5f3ff",
                    border: "1px solid #ddd6fe",
                    borderRadius: "8px",
                    padding: "0.8rem",
                    marginTop: "0.5rem",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: "0.5rem",
                  }}
                >
                  <div style={{ fontSize: "0.82rem", color: "#5b21b6" }}>
                    Saldo en caja tras el egreso:{" "}
                    <strong>{formatoQ(saldoCajaActual - montoALiquidar)}</strong>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <span style={{ fontSize: "0.82rem", color: "#5b21b6" }}>Total a pagar: </span>
                    <strong style={{ fontSize: "1.25rem", color: "#5b21b6" }}>{formatoQ(montoALiquidar)}</strong>
                  </div>
                </div>
              )}

              <div style={{ display: "flex", gap: "0.75rem", marginTop: "1rem" }}>
                <button
                  type="submit"
                  className="btn"
                  style={{ background: "#7c3aed", borderColor: "#7c3aed" }}
                  disabled={guardando || saldoInsuficiente}
                >
                  {guardando ? "Liquidando…" : `📦 Entregar ${formatoQ(montoALiquidar)} en efectivo`}
                </button>
              </div>
            </>
          )}
        </>
      )}
    </form>
  );
}

function CajaCerradaCard({
  agenciaNombre,
  detalle,
  onVerHistorial,
}: {
  agenciaNombre: string;
  detalle: DetalleCajaAuxiliar;
  onVerHistorial: () => void;
}) {
  const [mostrarActa, setMostrarActa] = useState(false);
  const [mostrarMovimientos, setMostrarMovimientos] = useState(false);

  const diferencia = Number(detalle.arqueo?.diferencia ?? 0);
  const totalContado = Number(detalle.arqueo?.total_contado ?? (detalle.dia.saldo_final ?? detalle.saldoActual));

  return (
    <div>
      <div className="card" style={{ borderTop: "4px solid #475569", marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <span className="badge inactivo" style={{ fontWeight: 700, padding: "0.3rem 0.75rem" }}>
                🔒 Caja del Día Cerrada
              </span>
              <span className="sub" style={{ margin: 0, fontWeight: 600 }}>
                {new Date(detalle.dia.fecha).toLocaleDateString("es-GT", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
              </span>
            </div>
            <h2 style={{ margin: "0.75rem 0 0.25rem" }}>{agenciaNombre} · Turno Finalizado</h2>
            <p className="sub" style={{ margin: 0 }}>
              El arqueo de cierre y conteo físico de efectivo fue registrado exitosamente.
            </p>
          </div>

          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
            <button className="btn" style={{ background: "#0f766e", borderColor: "#0f766e" }} onClick={() => setMostrarActa(true)}>
              🖨️ Imprimir Acta Oficial de Arqueo
            </button>
            <button className="btn secondary" onClick={() => setMostrarMovimientos((v) => !v)}>
              {mostrarMovimientos ? "Ocultar movimientos" : `📜 Ver movimientos (${detalle.movimientos.length})`}
            </button>
            <button className="btn secondary" onClick={onVerHistorial}>
              📅 Historial de cajas
            </button>
          </div>
        </div>

        <div className="stat-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", marginTop: "1.25rem" }}>
          <div className="stat-card">
            <span className="label">Saldo inicial</span>
            <span className="value">{formatoQ(detalle.dia.saldo_inicial)}</span>
          </div>
          <div className="stat-card">
            <span className="label">Total ingresos</span>
            <span className="value">{formatoQ(detalle.totalIngreso)}</span>
          </div>
          <div className="stat-card">
            <span className="label">Total egresos</span>
            <span className="value">{formatoQ(detalle.totalEgreso)}</span>
          </div>
          <div className="stat-card accent">
            <span className="label">Saldo final según libro</span>
            <span className="value">{formatoQ(detalle.dia.saldo_final ?? detalle.saldoActual)}</span>
          </div>
          <div className="stat-card">
            <span className="label">Efectivo contado</span>
            <span className="value">{formatoQ(totalContado)}</span>
          </div>
          <div className={`stat-card ${diferencia === 0 ? "" : "danger"}`}>
            <span className="label">Diferencia de Arqueo</span>
            <span className="value" style={{ color: diferencia === 0 ? "#16a34a" : "#dc2626" }}>
              {diferencia === 0 ? "Cuadrada (Q 0.00)" : (diferencia > 0 ? `Sobrante ${formatoQ(diferencia)}` : `Faltante ${formatoQ(Math.abs(diferencia))}`)}
            </span>
          </div>
        </div>
      </div>

      {mostrarMovimientos && (
        <div className="card" style={{ marginBottom: "1.5rem" }}>
          <h3 style={{ marginTop: 0 }}>Movimientos del día cerrado ({detalle.movimientos.length})</h3>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Hora</th>
                  <th>Movimiento</th>
                  <th>Referencia</th>
                  <th>Beneficiario</th>
                  <th>Doc.</th>
                  <th>Ingreso</th>
                  <th>Egreso</th>
                  <th>Saldo</th>
                  <th>Usuario</th>
                </tr>
              </thead>
              <tbody>
                {detalle.movimientos.map((m) => (
                  <tr key={m.id}>
                    <td className="mono">{new Date(m.created_at).toLocaleTimeString("es-GT", { hour: "2-digit", minute: "2-digit" })}</td>
                    <td>{m.descripcion}</td>
                    <td className="mono">{m.referencia ?? "—"}</td>
                    <td>{m.beneficiario}</td>
                    <td className="mono">{m.doc_no ?? "—"}</td>
                    <td className="mono movimiento-monto deposito">{m.tipo === "INGRESO" ? formatoQ(m.monto) : ""}</td>
                    <td className="mono movimiento-monto retiro">{m.tipo === "EGRESO" ? formatoQ(m.monto) : ""}</td>
                    <td className="mono">{formatoQ(m.saldo_acumulado)}</td>
                    <td>{m.usuario_nombre}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {mostrarActa && (
        <ActaArqueoModal
          agenciaNombre={agenciaNombre}
          detalle={detalle}
          onCerrar={() => setMostrarActa(false)}
        />
      )}
    </div>
  );
}

function ActaArqueoModal({
  agenciaNombre,
  detalle,
  onCerrar,
}: {
  agenciaNombre: string;
  detalle: DetalleCajaAuxiliar;
  onCerrar: () => void;
}) {
  const dia = detalle.dia;
  const arqueo = detalle.arqueo;
  const fechaStr = new Date(dia.fecha).toLocaleDateString("es-GT", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const conteoMap: Record<number, number> = {};
  if (arqueo && Array.isArray(arqueo.detalle)) {
    for (const item of arqueo.detalle) {
      conteoMap[Number(item.valor)] = Number(item.cantidad);
    }
  }

  const billetes = [200, 100, 50, 20, 10, 5, 1];
  const monedas = [1.0, 0.5, 0.25, 0.1, 0.05, 0.01];

  const totalBilletes = billetes.reduce((sum, d) => sum + d * (conteoMap[d] || 0), 0);
  const totalMonedas = monedas.reduce((sum, d) => sum + d * (conteoMap[d] || 0), 0);
  const totalContado = Number(arqueo?.total_contado ?? (totalBilletes + totalMonedas));
  const saldoEsperado = Number(dia.saldo_final ?? detalle.saldoActual);
  const diferencia = Number(arqueo?.diferencia ?? (totalContado - saldoEsperado));

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0, 0, 0, 0.65)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 9999,
        padding: "1rem",
        overflowY: "auto",
      }}
    >
      <div
        className="card print-container"
        style={{
          maxWidth: 720,
          width: "100%",
          maxHeight: "92vh",
          overflowY: "auto",
          background: "#fff",
          color: "#0f172a",
          padding: "2rem",
          boxShadow: "0 20px 25px -5px rgba(0,0,0,0.2)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }} className="no-print">
          <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#0f766e" }}>DOCUMENTO OFICIAL DE CONTROL Y AUDITORÍA</span>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button className="btn" onClick={() => window.print()}>
              🖨️ Imprimir Acta
            </button>
            <button className="btn secondary" onClick={onCerrar}>
              ✕ Cerrar
            </button>
          </div>
        </div>

        {/* Encabezado Institucional */}
        <div style={{ textAlign: "center", borderBottom: "2px solid #0f172a", paddingBottom: "0.75rem", marginBottom: "1rem" }}>
          <h2 style={{ margin: 0, fontSize: "1.05rem", textTransform: "uppercase", letterSpacing: "0.03em" }}>
            COOPERATIVA INTEGRAL DE AHORRO Y CRÉDITO
          </h2>
          <h3 style={{ margin: "0.2rem 0", fontSize: "1.2rem", color: "#047857", fontWeight: 800 }}>
            "MAYA INVERSIONES FUTURAS", R.L.
          </h3>
          <h4 style={{ margin: "0.4rem 0 0.2rem", fontSize: "0.95rem", textDecoration: "underline" }}>
            ACTA DE ARQUEO DE CAJA
          </h4>
          <p style={{ margin: 0, fontSize: "0.85rem", color: "#475569" }}>
            Agencia: <strong>{agenciaNombre}</strong> · Cifras expresadas en Quetzales (Q)
          </p>
          <p style={{ margin: "0.25rem 0 0", fontSize: "0.82rem", color: "#64748b" }}>
            Fecha de Arqueo: <strong style={{ textTransform: "capitalize" }}>{fechaStr}</strong>
          </p>
        </div>

        {/* Resumen del Libro de Caja */}
        <div style={{ marginBottom: "1.25rem" }}>
          <h4 style={{ margin: "0 0 0.5rem", fontSize: "0.88rem", color: "var(--ink)", textTransform: "uppercase", borderBottom: "1px solid var(--line)", paddingBottom: "0.25rem" }}>
            1. Movimientos según Libro Auxiliar de Caja
          </h4>
          <table style={{ width: "100%", fontSize: "0.85rem", borderCollapse: "collapse" }}>
            <tbody>
              <tr style={{ borderBottom: "1px solid var(--line)" }}>
                <td style={{ padding: "0.35rem 0" }}>Saldo Inicial Según Auxiliar:</td>
                <td style={{ textAlign: "right", fontWeight: 600 }} className="mono">{formatoQ(dia.saldo_inicial)}</td>
              </tr>
              <tr style={{ borderBottom: "1px solid var(--line)" }}>
                <td style={{ padding: "0.35rem 0", color: "#34d399" }}>(+) Total Ingresos del Día:</td>
                <td style={{ textAlign: "right", fontWeight: 600, color: "#34d399" }} className="mono">{formatoQ(detalle.totalIngreso)}</td>
              </tr>
              <tr style={{ borderBottom: "1px solid var(--line)" }}>
                <td style={{ padding: "0.35rem 0", color: "#f87171" }}>(-) Total Egresos del Día:</td>
                <td style={{ textAlign: "right", fontWeight: 600, color: "#f87171" }} className="mono">{formatoQ(detalle.totalEgreso)}</td>
              </tr>
              <tr style={{ borderTop: "2px solid var(--line)", background: "var(--mono-bg)" }}>
                <td style={{ padding: "0.5rem 0", fontWeight: 700 }}>(=) Saldo Final según Auxiliar de Caja:</td>
                <td style={{ textAlign: "right", fontWeight: 800, fontSize: "0.95rem" }} className="mono">{formatoQ(saldoEsperado)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Conteo Físico del Efectivo (Billetes y Monedas) */}
        <div style={{ marginBottom: "1.25rem" }}>
          <h4 style={{ margin: "0 0 0.5rem", fontSize: "0.88rem", color: "#1e293b", textTransform: "uppercase", borderBottom: "1px solid #cbd5e1", paddingBottom: "0.25rem" }}>
            2. Arqueo del Efectivo Físico
          </h4>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", fontSize: "0.82rem" }}>
            {/* Tabla Billetes */}
            <div>
              <strong style={{ display: "block", marginBottom: "0.25rem", color: "#334155" }}>Billetes</strong>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #cbd5e1", fontSize: "0.75rem", color: "#64748b" }}>
                    <th style={{ textAlign: "left", padding: "0.2rem 0" }}>Denom.</th>
                    <th style={{ textAlign: "center", padding: "0.2rem 0" }}>Cant.</th>
                    <th style={{ textAlign: "right", padding: "0.2rem 0" }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {billetes.map((b) => {
                    const c = conteoMap[b] || 0;
                    return (
                      <tr key={b} style={{ borderBottom: "1px solid #f8fafc" }}>
                        <td style={{ padding: "0.2rem 0" }}>Q {b.toFixed(2)}</td>
                        <td style={{ textAlign: "center", padding: "0.2rem 0" }} className="mono">{c}</td>
                        <td style={{ textAlign: "right", padding: "0.2rem 0" }} className="mono">{formatoQ(b * c)}</td>
                      </tr>
                    );
                  })}
                  <tr style={{ borderTop: "1px solid #cbd5e1", fontWeight: 700 }}>
                    <td colSpan={2} style={{ padding: "0.3rem 0" }}>Subtotal Billetes:</td>
                    <td style={{ textAlign: "right", padding: "0.3rem 0" }} className="mono">{formatoQ(totalBilletes)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Tabla Monedas */}
            <div>
              <strong style={{ display: "block", marginBottom: "0.25rem", color: "#334155" }}>Monedas</strong>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #cbd5e1", fontSize: "0.75rem", color: "#64748b" }}>
                    <th style={{ textAlign: "left", padding: "0.2rem 0" }}>Denom.</th>
                    <th style={{ textAlign: "center", padding: "0.2rem 0" }}>Cant.</th>
                    <th style={{ textAlign: "right", padding: "0.2rem 0" }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {monedas.map((m) => {
                    const c = conteoMap[m] || 0;
                    return (
                      <tr key={m} style={{ borderBottom: "1px solid #f8fafc" }}>
                        <td style={{ padding: "0.2rem 0" }}>Q {m.toFixed(2)}</td>
                        <td style={{ textAlign: "center", padding: "0.2rem 0" }} className="mono">{c}</td>
                        <td style={{ textAlign: "right", padding: "0.2rem 0" }} className="mono">{formatoQ(m * c)}</td>
                      </tr>
                    );
                  })}
                  <tr style={{ borderTop: "1px solid #cbd5e1", fontWeight: 700 }}>
                    <td colSpan={2} style={{ padding: "0.3rem 0" }}>Subtotal Monedas:</td>
                    <td style={{ textAlign: "right", padding: "0.3rem 0" }} className="mono">{formatoQ(totalMonedas)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div
            style={{
              marginTop: "0.75rem",
              padding: "0.5rem 0.75rem",
              background: "#f1f5f9",
              borderRadius: "6px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              fontSize: "0.85rem",
            }}
          >
            <span>Total Efectivo Físico Arqueado:</span>
            <strong className="mono" style={{ fontSize: "1rem" }}>{formatoQ(totalContado)}</strong>
          </div>

          <div
            style={{
              marginTop: "0.4rem",
              padding: "0.5rem 0.75rem",
              background: diferencia === 0 ? "#ecfdf5" : (diferencia > 0 ? "#eff6ff" : "#fef2f2"),
              color: diferencia === 0 ? "#065f46" : (diferencia > 0 ? "#1e40af" : "#991b1b"),
              border: `1px solid ${diferencia === 0 ? "#a7f3d0" : (diferencia > 0 ? "#bfdbfe" : "#fecaca")}`,
              borderRadius: "6px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              fontSize: "0.85rem",
              fontWeight: 700,
            }}
          >
            <span>DIFERENCIA:</span>
            <span className="mono">
              {diferencia === 0
                ? "CUADRADO EXACTO (Q 0.00)"
                : (diferencia > 0
                    ? `SOBRANTE: ${formatoQ(diferencia)}`
                    : `FALTANTE: ${formatoQ(Math.abs(diferencia))}`)}
            </span>
          </div>
        </div>

        {/* Texto Legal Institucional */}
        <div style={{ fontSize: "0.76rem", color: "#334155", lineHeight: 1.4, textAlign: "justify", marginBottom: "1.75rem", borderTop: "1px solid #cbd5e1", paddingTop: "0.6rem" }}>
          El día <strong style={{ textTransform: "capitalize" }}>{fechaStr}</strong> se practicó arqueo al Receptor Pagador en su presencia, presentándonos los documentos de soporte de ingresos y egresos para la debida revisión con el Auxiliar de Caja. De acuerdo al arqueo se determinó una diferencia de <strong>{formatoQ(diferencia)}</strong>. Se devolvieron todos los comprobantes y documentos de forma íntegra a la persona encargada sin que haga falta ninguno, recibiéndolos en su entera satisfacción.
        </div>

        {/* Cuadro Oficial de Firmas */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2.5rem 2rem", marginTop: "1.5rem" }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ borderTop: "1px solid #0f172a", paddingTop: "0.3rem", fontSize: "0.8rem", fontWeight: 700 }}>
              Receptor Pagador
            </div>
            <div style={{ fontSize: "0.72rem", color: "#64748b" }}>Cajero de Ventanilla</div>
          </div>

          <div style={{ textAlign: "center" }}>
            <div style={{ borderTop: "1px solid #0f172a", paddingTop: "0.3rem", fontSize: "0.8rem", fontWeight: 700 }}>
              Presidente
            </div>
            <div style={{ fontSize: "0.72rem", color: "#64748b" }}>Comisión de Vigilancia</div>
          </div>

          <div style={{ textAlign: "center" }}>
            <div style={{ borderTop: "1px solid #0f172a", paddingTop: "0.3rem", fontSize: "0.8rem", fontWeight: 700 }}>
              Secretaria
            </div>
            <div style={{ fontSize: "0.72rem", color: "#64748b" }}>Comisión de Vigilancia</div>
          </div>

          <div style={{ textAlign: "center" }}>
            <div style={{ borderTop: "1px solid #0f172a", paddingTop: "0.3rem", fontSize: "0.8rem", fontWeight: 700 }}>
              Vocal I
            </div>
            <div style={{ fontSize: "0.72rem", color: "#64748b" }}>Comisión de Vigilancia</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function HistorialCajasModal({
  agenciaId,
  agenciaNombre,
  onCerrar,
}: {
  agenciaId: string;
  agenciaNombre: string;
  onCerrar: () => void;
}) {
  const [dias, setDias] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const [detalleSeleccionado, setDetalleSeleccionado] = useState<DetalleCajaAuxiliar | null>(null);

  useEffect(() => {
    api
      .get<any[]>("/caja-auxiliar/historial", { params: { agenciaId } })
      .then(({ data }) => setDias(data))
      .finally(() => setCargando(false));
  }, [agenciaId]);

  function abrirActa(diaId: string) {
    api
      .get<DetalleCajaAuxiliar>(`/caja-auxiliar/${diaId}`)
      .then(({ data }) => setDetalleSeleccionado(data));
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0,0,0,0.6)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 9990,
        padding: "1rem",
      }}
    >
      <div
        className="card"
        style={{
          maxWidth: 860,
          width: "100%",
          maxHeight: "85vh",
          overflowY: "auto",
          background: "var(--paper)",
          padding: "1.5rem",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <div>
            <h2 style={{ margin: 0, fontSize: "1.15rem" }}>📅 Historial de Cajas Diarias · {agenciaNombre}</h2>
            <p className="sub" style={{ margin: 0 }}>Consulta de cierres anteriores y actas de arqueo</p>
          </div>
          <button className="btn secondary" onClick={onCerrar}>✕ Cerrar</button>
        </div>

        {cargando && <p>Cargando historial…</p>}

        {!cargando && dias.length === 0 && (
          <div className="alert info">No hay registros de cajas anteriores para esta agencia.</div>
        )}

        {dias.length > 0 && (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Estado</th>
                  <th>Saldo Inicial</th>
                  <th>Ingresos</th>
                  <th>Egresos</th>
                  <th>Saldo Final</th>
                  <th>Operador</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {dias.map((d) => (
                  <tr key={d.id}>
                    <td className="mono" style={{ fontWeight: 600 }}>
                      {new Date(d.fecha).toLocaleDateString("es-GT")}
                    </td>
                    <td>
                      <span className={`badge ${d.estado === "ABIERTO" ? "activo" : "inactivo"}`}>
                        {d.estado === "ABIERTO" ? "🟢 Abierto" : "🔒 Cerrado"}
                      </span>
                    </td>
                    <td className="mono">{formatoQ(d.saldo_inicial)}</td>
                    <td className="mono" style={{ color: "#16a34a" }}>{formatoQ(d.total_ingresos)}</td>
                    <td className="mono" style={{ color: "#dc2626" }}>{formatoQ(d.total_egresos)}</td>
                    <td className="mono" style={{ fontWeight: 700 }}>{formatoQ(d.saldo_final ?? d.saldo_inicial)}</td>
                    <td style={{ fontSize: "0.82rem" }}>{d.cerrado_por_nombre || d.abierto_por_nombre || "—"}</td>
                    <td>
                      <button
                        className="btn secondary"
                        style={{ fontSize: "0.78rem", padding: "0.25rem 0.5rem" }}
                        onClick={() => abrirActa(d.id)}
                      >
                        🖨️ Ver Acta
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {detalleSeleccionado && (
          <ActaArqueoModal
            agenciaNombre={agenciaNombre}
            detalle={detalleSeleccionado}
            onCerrar={() => setDetalleSeleccionado(null)}
          />
        )}
      </div>
    </div>
  );
}




