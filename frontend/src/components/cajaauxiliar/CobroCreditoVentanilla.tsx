import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { api, mensajeError } from "../../lib/api";
import BuscadorSocio from "../BuscadorSocio";
import {
  formatoQ,
} from "../../types";
import type { ResultadoLiquidacion } from "../../lib/liquidacionCredito";
import { distribuirMontoCobro } from "../../lib/liquidacionCredito";
import type {
  Cuenta,
  OrigenFondos,
  Prestamo,
  Socio,
} from "../../types";
import {
  ORIGEN_FONDOS_LABEL,
} from "../../types";

export interface CobroCreditoVentanillaProps {
  agenciaId: string;
  diaId: string;
  onCobrado: () => void;
}

interface ItemPendienteCobro {
  id: string;
  codigo: string;
  numero_credito_anterior: string | null;
  socio_id: string;
  socio_nombres: string;
  numero_asociado: string;
  saldo_capital: number;
  cuota_mensual: number;
  fecha_ultimo_pago: string;
  fecha_proxima_cuota: string;
  dias_atraso: number;
  en_mora: boolean;
}

function ListaPendientesCobro({
  titulo,
  icono,
  items,
  cargando,
  colorAcento,
  vacio,
  onSeleccionar,
  cargandoSocioId,
}: {
  titulo: string;
  icono: string;
  items: ItemPendienteCobro[];
  cargando: boolean;
  colorAcento: string;
  vacio: string;
  onSeleccionar: (item: ItemPendienteCobro) => void;
  cargandoSocioId: string | null;
}) {
  return (
    <div style={{ background: "var(--paper-raised)", border: "1px solid var(--line)", borderRadius: "8px", padding: "0.65rem 0.75rem" }}>
      <div style={{ fontSize: "0.8rem", fontWeight: 700, color: colorAcento, marginBottom: "0.4rem" }}>
        {icono} {titulo}
      </div>
      {cargando ? (
        <p style={{ fontSize: "0.78rem", color: "var(--ink-soft)", margin: 0 }}>Cargando…</p>
      ) : items.length === 0 ? (
        <p style={{ fontSize: "0.78rem", color: "var(--ink-soft)", margin: 0 }}>{vacio}</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem", maxHeight: "220px", overflowY: "auto" }}>
          {items.map((it) => (
            <button
              key={it.id}
              type="button"
              onClick={() => onSeleccionar(it)}
              disabled={cargandoSocioId === it.socio_id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: "0.5rem",
                background: "var(--paper)",
                border: "1px solid var(--line)",
                borderRadius: "6px",
                padding: "0.4rem 0.6rem",
                cursor: "pointer",
                textAlign: "left",
              }}
            >
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--ink)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {cargandoSocioId === it.socio_id ? "Cargando…" : it.socio_nombres}
                </div>
                <div style={{ fontSize: "0.7rem", color: "var(--ink-soft)" }}>
                  {it.numero_asociado} · {it.codigo} · Saldo {formatoQ(it.saldo_capital)}
                </div>
              </div>
              <span
                style={{
                  fontSize: "0.68rem",
                  fontWeight: 700,
                  whiteSpace: "nowrap",
                  color: it.en_mora ? "#b91c1c" : "var(--ink-soft)",
                  background: it.en_mora ? "rgba(239,68,68,0.12)" : "rgba(2,132,199,0.08)",
                  border: it.en_mora ? "1px solid rgba(239,68,68,0.3)" : "1px solid rgba(2,132,199,0.2)",
                  borderRadius: "4px",
                  padding: "0.15rem 0.4rem",
                }}
              >
                {it.en_mora ? `${it.dias_atraso}d atraso` : new Date(it.fecha_proxima_cuota).toLocaleDateString("es-GT")}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function CobroCreditoVentanilla({
  agenciaId,
  diaId,
  onCobrado,
}: CobroCreditoVentanillaProps) {
  const [socio, setSocio] = useState<Socio | null>(null);
  const [prestamos, setPrestamos] = useState<Prestamo[]>([]);
  const [prestamo, setPrestamo] = useState<Prestamo | null>(null);
  const [cargandoPrestamos, setCargandoPrestamos] = useState(false);

  const [proximosAPagar, setProximosAPagar] = useState<ItemPendienteCobro[]>([]);
  const [enMora, setEnMora] = useState<ItemPendienteCobro[]>([]);
  const [cargandoPendientes, setCargandoPendientes] = useState(false);
  const [socioIdCargando, setSocioIdCargando] = useState<string | null>(null);

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

  const [numeroCuota, setNumeroCuota] = useState("1");
  const [cantidadCuotas, setCantidadCuotas] = useState("1");
  const [saldoAnteriorReportado, setSaldoAnteriorReportado] = useState("");
  const [saldoActualReportado, setSaldoActualReportado] = useState("");
  const [descripcion, setDescripcion] = useState("");

  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function cargarLiquidacion(p: Prestamo) {
    setPrestamo(p);
    setOrigenFondos(p.origen_fondos || "FONDOS_PROPIOS");
    setCargandoLiquidacion(true);

    const saldoBase = Number(
      p.saldo_capital !== null && p.saldo_capital !== undefined
        ? p.saldo_capital
        : p.monto_aprobado || p.monto_solicitado
    );

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

      setSaldoActualReportado(String(Math.max(0, Math.round((saldoBase - capSugerido) * 100) / 100)));
      const cuotaRef = data.liquidacion.cuotaProgramadaOficial || Number(p.cuota_mensual) || 1;
      setCantidadCuotas(String(Math.max(1, Math.floor((totalSugerido + 0.01) / cuotaRef))));

    } catch {
      const tasa = Number(p.tasa_interes_mensual || 2.0) / 100;
      const interesMes = Math.round(saldoBase * tasa * 100) / 100;
      const cuotaTotal = Number(p.cuota_mensual);
      const capitalMes = Math.max(0, Math.min(saldoBase, Math.round((cuotaTotal - interesMes) * 100) / 100));

      setAbonoCapital(String(capitalMes));
      setInteres(String(interesMes));
      setMora("0");
      const totalSugerido = capitalMes + interesMes;
      setMontoEntregadoInput(String(totalSugerido));
      setLiquidacion(null);

      setSaldoActualReportado(String(Math.max(0, Math.round((saldoBase - capitalMes) * 100) / 100)));
      const cuotaRef = Number(p.cuota_mensual) || 1;
      setCantidadCuotas(String(Math.max(1, Math.floor((totalSugerido + 0.01) / cuotaRef))));

    } finally {
      // Pre-fill fields based on prestamo
      setNumeroCuota(String((p.cuotas_pagadas || 0) + 1));
      setSaldoAnteriorReportado(String(saldoBase));
      setDescripcion("");
      setCargandoLiquidacion(false);
    }
  }

  function cargarPendientesCobro() {
    setCargandoPendientes(true);
    api
      .get<{ proximosAPagar: ItemPendienteCobro[]; enMora: ItemPendienteCobro[] }>("/prestamos/pendientes-cobro", {
        params: { agenciaId, limite: 10 },
      })
      .then(({ data }) => {
        setProximosAPagar(data.proximosAPagar);
        setEnMora(data.enMora);
      })
      .catch(() => {
        setProximosAPagar([]);
        setEnMora([]);
      })
      .finally(() => setCargandoPendientes(false));
  }

  useEffect(() => {
    cargarPendientesCobro();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agenciaId]);

  async function seleccionarDesdeLista(item: ItemPendienteCobro) {
    setSocioIdCargando(item.socio_id);
    setError(null);
    try {
      const { data } = await api.get<Socio>(`/socios/${item.socio_id}`);
      setSocio(data);
    } catch (err) {
      setError(mensajeError(err));
    } finally {
      setSocioIdCargando(null);
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

    // Auto-rellenar Saldo Actual
    const nuevoSaldo = Math.max(0, Math.round((saldo - dist.pagoCapital) * 100) / 100);
    setSaldoActualReportado(String(nuevoSaldo));

    // Auto-rellenar Cantidad de Cuotas
    const cuotaRef = liquidacion?.cuotaProgramadaOficial || Number(prestamo.cuota_mensual) || 1;
    const cuotasCubiertas = Math.max(1, Math.floor((num + 0.01) / cuotaRef));
    setCantidadCuotas(String(cuotasCubiertas));
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
      await api.post(`/caja-auxiliar/${diaId}/cobro-credito`, {
        prestamoId: prestamo.id,
        socioId: socio.id,
        abonoCapital: capNum,
        interes: intNum,
        mora: morNum,
        ahorroSobrePrestamo: aspNum,
        origenFondos,
        docNo: docNo || undefined,
        cuentaDebitoId: usarDebitoAhorro && cuentaDebitoSeleccionada ? cuentaDebitoSeleccionada : undefined,
        numeroCuota: Number(numeroCuota) || undefined,
        cantidadCuotas: Number(cantidadCuotas) || undefined,
        saldoAnteriorReportado: Number(saldoAnteriorReportado) || undefined,
        saldoActualReportado: Number(saldoActualReportado) || undefined,
        descripcion: descripcion.trim() || undefined,
      });

      setDocNo("");
      setSocio(null);
      setPrestamo(null);
      setMontoEntregadoInput("");
      setDescripcion("");
      cargarPendientesCobro();
      onCobrado();
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
        <span className="hint">Busca un asociado en específico por nombre o número, o elige uno de las listas de abajo.</span>
      </div>

      {!socio && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "0.75rem", marginBottom: "1rem" }}>
          <ListaPendientesCobro
            titulo="Próximos a pagar"
            icono="🕐"
            items={proximosAPagar}
            cargando={cargandoPendientes}
            colorAcento="#0369a1"
            vacio="No hay créditos próximos a vencer."
            onSeleccionar={seleccionarDesdeLista}
            cargandoSocioId={socioIdCargando}
          />
          <ListaPendientesCobro
            titulo={`En mora / sin pagar${enMora.length ? ` (${enMora.length})` : ""}`}
            icono="⚠️"
            items={enMora}
            cargando={cargandoPendientes}
            colorAcento="#b91c1c"
            vacio="No hay créditos en mora. 🎉"
            onSeleccionar={seleccionarDesdeLista}
            cargandoSocioId={socioIdCargando}
          />
        </div>
      )}

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
          {prestamo.tiene_cobro_campo_pendiente && (
            <div className="alert warning" style={{ marginTop: "1rem", marginBottom: "1rem" }}>
              ⚠️ Este crédito ya tiene un pago de campo registrado hoy que está pendiente de ser liquidado/aprobado. No se puede realizar un cobro por ventanilla hasta que el cobro de campo se apruebe o rechace.
            </div>
          )}
          {!prestamo.tiene_cobro_campo_pendiente && (
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
                  { id: "FONDOS_PROPIOS", num: "1", label: "Fondos Propios", icon: "🏦", desc: "COOP COMIF R.L." },
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

          {/* CONTROL DE CUOTA */}
          <div style={{ marginBottom: "1rem" }}>
            <div className="field">
              <label htmlFor="num-cuota">Número de Cuota a pagar</label>
              <input
                id="num-cuota"
                type="number"
                min="1"
                value={numeroCuota}
                onChange={(e) => setNumeroCuota(e.target.value)}
              />
              <span className="hint">
                Cuota inicial de este pago. (La cantidad de cuotas que cubre se calcula automáticamente en el sistema).
              </span>
            </div>
          </div>

          {/* CONTROL DE SALDOS MANUALES */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
            <div className="field">
              <label htmlFor="saldo-ant">Saldo Anterior (del Recibo)</label>
              <input
                id="saldo-ant"
                type="number"
                step="0.01"
                value={saldoAnteriorReportado}
                onChange={(e) => setSaldoAnteriorReportado(e.target.value)}
              />
              <span className="hint">Saldo antes del pago</span>
            </div>
            <div className="field">
              <label htmlFor="saldo-act">Saldo Actual (del Recibo)</label>
              <input
                id="saldo-act"
                type="number"
                step="0.01"
                value={saldoActualReportado}
                onChange={(e) => setSaldoActualReportado(e.target.value)}
              />
              <span className="hint">Saldo después del pago</span>
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
                type="text"
                placeholder="Ej. REC-2023-001 (Opcional)"
                value={docNo}
                onChange={(e) => setDocNo(e.target.value)}
              />
              <span className="hint">Si se emite recibo físico numerado</span>
            </div>

            <div className="field" style={{ gridColumn: "1 / -1" }}>
              <label htmlFor="descripcion-cobro" style={{ color: "var(--ink)", fontWeight: 700 }}>Observación / Justificación</label>
              <input
                id="descripcion-cobro"
                type="text"
                placeholder="Ej. Atraso de dos meses, pago ajustado, etc."
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                required={
                  Number(mora) !== (liquidacion?.moraFijaSugerida || 0) ||
                  Number(cantidadCuotas) > 1
                }
                style={{
                  borderColor: (Number(mora) !== (liquidacion?.moraFijaSugerida || 0) || Number(cantidadCuotas) > 1) && !descripcion.trim() ? "#ef4444" : "var(--line)",
                  background: (Number(mora) !== (liquidacion?.moraFijaSugerida || 0) || Number(cantidadCuotas) > 1) && !descripcion.trim() ? "rgba(239, 68, 68, 0.05)" : "var(--paper)"
                }}
              />
              <span className="hint" style={{ color: (Number(mora) !== (liquidacion?.moraFijaSugerida || 0) || Number(cantidadCuotas) > 1) ? "#b91c1c" : "var(--ink-soft)" }}>
                Obligatorio si se paga más de una cuota o si se modifica la mora sugerida.
              </span>
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
        </>
      )}
    </form>
  );
}
