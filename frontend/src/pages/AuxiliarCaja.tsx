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

  useEffect(() => {
    if (puedeElegirAgencia) api.get<Agencia[]>("/agencias").then(({ data }) => setAgencias(data));
  }, [puedeElegirAgencia]);

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
        <div className="page-head">
          <div>
            <h1>Auxiliar de caja</h1>
            <p>Selecciona una agencia para ver o abrir la caja del día.</p>
          </div>
        </div>
        <div className="field" style={{ maxWidth: 320 }}>
          <label htmlFor="aux-agencia-inicial">Agencia</label>
          <select id="aux-agencia-inicial" value={agenciaId} onChange={(e) => setAgenciaId(e.target.value)}>
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
      </div>
    );
  }

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Auxiliar de caja</h1>
          <p>Libro de caja del día: transacciones agente Banco Industrial e ingresos/egresos propios.</p>
        </div>
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

      <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1.5rem" }}>
        <button className="btn" onClick={() => setMostrarForm((v) => !v)}>
          {mostrarForm ? "Cancelar" : "+ Nuevo movimiento"}
        </button>
        <button className="btn secondary" onClick={() => setMostrarCierre((v) => !v)}>
          {mostrarCierre ? "Cancelar cierre" : "Cerrar caja del día"}
        </button>
      </div>

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
