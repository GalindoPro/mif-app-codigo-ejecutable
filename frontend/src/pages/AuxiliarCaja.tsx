import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { api, mensajeError } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import BuscadorSocio from "../components/BuscadorSocio";
import BuscadorCuenta from "../components/BuscadorCuenta";
import {
  CATEGORIAS_AUXILIAR,
  CATEGORIA_AUXILIAR_KEYS,
  DENOMINACIONES_GT,
  formatoQ,
  labelDenominacion,
} from "../types";
import type {
  Agencia,
  CajaCategoria,
  Cuenta,
  DetalleCajaAuxiliar,
  EstadoCajaAuxiliar,
  PlazoFijoContrato,
  Prestamo,
  Socio,
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
        <CobroCreditoForm
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

      <button type="submit" className="btn" disabled={guardando}>
        {guardando ? "Guardando…" : `Registrar ${info.tipo === "INGRESO" ? "ingreso" : "egreso"}`}
      </button>
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

function CobroCreditoForm({
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

  const [abonoCapital, setAbonoCapital] = useState("");
  const [interes, setInteres] = useState("");
  const [mora, setMora] = useState("0");
  const [docNo, setDocNo] = useState("");

  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function seleccionarPrestamo(p: Prestamo) {
    setPrestamo(p);
    const saldo = Number(
      p.saldo_capital !== null && p.saldo_capital !== undefined
        ? p.saldo_capital
        : p.monto_aprobado || p.monto_solicitado,
    );
    const tasa = Number(p.tasa_interes_mensual) / 100;
    const interesMes = Math.round(saldo * tasa * 100) / 100;
    const cuotaTotal = Number(p.cuota_mensual);
    const capitalMes = Math.max(0, Math.min(saldo, Math.round((cuotaTotal - interesMes) * 100) / 100));

    setAbonoCapital(String(capitalMes));
    setInteres(String(interesMes));
    setMora("0");
  }

  useEffect(() => {
    if (!socio) {
      setPrestamos([]);
      setPrestamo(null);
      return;
    }
    setCargandoPrestamos(true);
    api
      .get<Prestamo[]>("/prestamos", { params: { socioId: socio.id } })
      .then(({ data }) => {
        const activos = data.filter((p) => p.estado === "DESEMBOLSADO" || p.estado === "APROBADO");
        setPrestamos(activos);
        if (activos[0]) {
          seleccionarPrestamo(activos[0]);
        } else {
          setPrestamo(null);
        }
      })
      .catch((err) => setError(mensajeError(err)))
      .finally(() => setCargandoPrestamos(false));
  }, [socio]);

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
  const totalCobro = capNum + intNum + morNum;
  const saldoNuevo = Math.max(0, Math.round((saldoActual - capNum) * 100) / 100);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!prestamo || !socio) return;
    if (totalCobro <= 0) {
      setError("El monto total a cobrar debe ser mayor a cero.");
      return;
    }

    setError(null);
    setGuardando(true);
    try {
      await api.post(`/caja-auxiliar/${diaId}/cobro-credito`, {
        prestamoId: prestamo.id,
        socioId: socio.id,
        abonoCapital: capNum,
        interes: intNum,
        mora: morNum,
        docNo: docNo || undefined,
      });
      onCobrado();
    } catch (err) {
      setError(mensajeError(err));
      setGuardando(false);
    }
  }

  return (
    <form className="card" onSubmit={onSubmit} style={{ maxWidth: 680, marginBottom: "1.5rem", border: "2px solid #059669" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
        <h2 style={{ margin: 0, fontSize: "1.1rem", color: "#065f46" }}>💵 Cobro de Cuota de Crédito en Ventanilla</h2>
        <span className="badge" style={{ background: "#ecfdf5", color: "#065f46", fontWeight: 700 }}>
          Ingresos COMIF
        </span>
      </div>
      <p style={{ fontSize: "0.85rem", color: "var(--ink-soft)", margin: "0 0 1rem" }}>
        Desglose automático de abono a capital e interés según la amortización oficial del préstamo.
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
              if (p) seleccionarPrestamo(p);
            }}
          >
            {prestamos.map((p) => (
              <option key={p.id} value={p.id}>
                {p.codigo} — {p.tipo} (Saldo: {formatoQ(p.saldo_capital ?? p.monto_aprobado ?? p.monto_solicitado)})
              </option>
            ))}
          </select>
        </div>
      )}

      {prestamo && (
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
              <span style={{ color: "var(--ink-soft)" }}>Crédito:</span> <strong>{prestamo.codigo}</strong>
            </div>
            <div>
              <span style={{ color: "var(--ink-soft)" }}>Tipo:</span> <strong>{prestamo.tipo}</strong>
            </div>
            <div>
              <span style={{ color: "var(--ink-soft)" }}>Cuota pactada:</span> <strong>{formatoQ(prestamo.cuota_mensual)}</strong>
            </div>
            <div>
              <span style={{ color: "var(--ink-soft)" }}>Saldo deudor:</span>{" "}
              <strong style={{ color: "var(--accent)" }}>{formatoQ(saldoActual)}</strong>
            </div>
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
              <span className="hint">Reduce el saldo deudor del préstamo</span>
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
              <span className="hint">Al 2.0% mensual pactado</span>
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
            </div>

            <div className="field">
              <label htmlFor="doc-no-recibo">No. de Recibo Oficial</label>
              <input
                id="doc-no-recibo"
                placeholder="Ej. 2257"
                value={docNo}
                onChange={(e) => setDocNo(e.target.value)}
                required
              />
              <span className="hint">Número impreso en el recibo entregado</span>
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
                Saldo deudor tras el pago: <strong>{formatoQ(saldoNuevo)}</strong>
                {saldoNuevo === 0 && (
                  <span style={{ marginLeft: "0.5rem", color: "#15803d", fontWeight: 700 }}>
                    🎉 ¡Crédito Liquidado al 100%!
                  </span>
                )}
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <span style={{ fontSize: "0.82rem", color: "#166534" }}>Total a recibir en caja: </span>
              <strong style={{ fontSize: "1.25rem", color: "#166534" }}>{formatoQ(totalCobro)}</strong>
            </div>
          </div>

          <div style={{ display: "flex", gap: "0.75rem", marginTop: "1rem" }}>
            <button
              type="submit"
              className="btn"
              style={{ background: "#059669", borderColor: "#059669" }}
              disabled={guardando || totalCobro <= 0}
            >
              {guardando ? "Registrando cobro…" : `💵 Registrar cobro de ${formatoQ(totalCobro)}`}
            </button>
          </div>
        </>
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
        if (data[0]) setPrestamo(data[0]);
      })
      .catch((err) => setError(mensajeError(err)))
      .finally(() => setCargando(false));
  }, [agenciaId]);

  const montoAprobado = prestamo ? Number(prestamo.monto_aprobado || prestamo.monto_solicitado) : 0;
  const saldoInsuficiente = montoAprobado > saldoCajaActual;

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
        Entrega física de efectivo al socio por crédito aprobado. Reduce el efectivo de caja y activa el préstamo.
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
                if (p) setPrestamo(p);
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

              <div className="form-grid">
                <div className="field">
                  <label>Monto a entregar en efectivo</label>
                  <input
                    type="text"
                    value={formatoQ(montoAprobado)}
                    disabled
                    style={{ fontWeight: 700, fontSize: "1.1rem" }}
                  />
                  <span className="hint">Monto aprobado por el comité / supervisor</span>
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
                  ⚠️ Saldo insuficiente en caja: Se requieren {formatoQ(montoAprobado)}, pero la caja física solo tiene {formatoQ(saldoCajaActual)}. Ingrese fondos antes de desembolsar.
                </div>
              ) : (
                <div
                  style={{
                    background: "#eff6ff",
                    border: "1px solid #bfdbfe",
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
                  <div style={{ fontSize: "0.82rem", color: "#1e40af" }}>
                    Saldo de caja tras la entrega:{" "}
                    <strong>{formatoQ(saldoCajaActual - montoAprobado)}</strong>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <span style={{ fontSize: "0.82rem", color: "#1e40af" }}>Total a entregar: </span>
                    <strong style={{ fontSize: "1.25rem", color: "#1e40af" }}>{formatoQ(montoAprobado)}</strong>
                  </div>
                </div>
              )}

              <div style={{ display: "flex", gap: "0.75rem", marginTop: "1rem" }}>
                <button
                  type="submit"
                  className="btn"
                  style={{ background: "#2563eb", borderColor: "#2563eb" }}
                  disabled={guardando || saldoInsuficiente}
                >
                  {guardando ? "Desembolsando…" : `📤 Entregar ${formatoQ(montoAprobado)} en efectivo`}
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
              <span className="badge" style={{ background: "#f1f5f9", color: "#334155", fontWeight: 700, padding: "0.3rem 0.75rem" }}>
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
          <h4 style={{ margin: "0 0 0.5rem", fontSize: "0.88rem", color: "#1e293b", textTransform: "uppercase", borderBottom: "1px solid #cbd5e1", paddingBottom: "0.25rem" }}>
            1. Movimientos según Libro Auxiliar de Caja
          </h4>
          <table style={{ width: "100%", fontSize: "0.85rem", borderCollapse: "collapse" }}>
            <tbody>
              <tr style={{ borderBottom: "1px solid #f1f5f9" }}>
                <td style={{ padding: "0.35rem 0" }}>Saldo Inicial Según Auxiliar:</td>
                <td style={{ textAlign: "right", fontWeight: 600 }} className="mono">{formatoQ(dia.saldo_inicial)}</td>
              </tr>
              <tr style={{ borderBottom: "1px solid #f1f5f9" }}>
                <td style={{ padding: "0.35rem 0", color: "#065f46" }}>(+) Total Ingresos del Día:</td>
                <td style={{ textAlign: "right", fontWeight: 600, color: "#065f46" }} className="mono">{formatoQ(detalle.totalIngreso)}</td>
              </tr>
              <tr style={{ borderBottom: "1px solid #f1f5f9" }}>
                <td style={{ padding: "0.35rem 0", color: "#991b1b" }}>(-) Total Egresos del Día:</td>
                <td style={{ textAlign: "right", fontWeight: 600, color: "#991b1b" }} className="mono">{formatoQ(detalle.totalEgreso)}</td>
              </tr>
              <tr style={{ borderTop: "2px solid #334155", background: "#f8fafc" }}>
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
                      <span className="badge" style={{ background: d.estado === "ABIERTO" ? "#ecfdf5" : "#f1f5f9", color: d.estado === "ABIERTO" ? "#065f46" : "#475569" }}>
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




