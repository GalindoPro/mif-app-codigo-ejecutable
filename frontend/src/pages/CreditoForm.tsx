import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { api, mensajeError } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import BuscadorSocio from "../components/BuscadorSocio";
import type {
  Agencia,
  CuotaAmortizacion,
  OrigenFondos,
  ResultadoSimulacion,
  Socio,
  TipoPrestamo,
  UsuarioItem,
} from "../types";
import {
  capitalizarDescripcion,
  formatearDPI,
  formatearFechaLocal,
  formatearTelefono,
  limpiarDPI,
  prepararTelefonoParaGuardar,
} from "../lib/formatters";
import {
  calcularAmortizacion,
  sumarMesesFinanciero,
} from "../lib/motorFinanciero";
import InputNombreAutoCompletar from "../components/InputNombreAutoCompletar";

export default function CreditoForm() {
  const { usuario } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const puedeElegirAgencia = usuario?.rol === "GERENCIA";

  const [agencias, setAgencias] = useState<Agencia[]>([]);
  const [agenciaId, setAgenciaId] = useState(usuario?.agenciaId ?? "");
  const [promotores, setPromotores] = useState<UsuarioItem[]>([]);

  const [socio, setSocio] = useState<Socio | null>(null);
  const [promotorId, setPromotorId] = useState(usuario?.rol === "PROMOTOR" ? usuario.id : "");
  const [origenFondos, setOrigenFondos] = useState<OrigenFondos>("FONDOS_PROPIOS");
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

  // Migración de crédito histórico
  const [esMigracion, setEsMigracion] = useState(false);
  const [numeroCreditoAnterior, setNumeroCreditoAnterior] = useState("");
  const [montoOriginalContrato, setMontoOriginalContrato] = useState("39772.73");
  const [plazoTotalContrato, setPlazoTotalContrato] = useState("36");
  const [cuotasPagadas, setCuotasPagadas] = useState("6");
  const [saldoCapitalActual, setSaldoCapitalActual] = useState("33143.93");
  const [fechaDesembolsoOriginal, setFechaDesembolsoOriginal] = useState("2026-02-18");
  const [fechaUltimoPago, setFechaUltimoPago] = useState("2026-08-18");
  const [fechaProximoPago, setFechaProximoPago] = useState("2026-09-18");
  const [mostrarTablaAmortizacion, setMostrarTablaAmortizacion] = useState(false);
  const [simulacionAmortizacion, setSimulacionAmortizacion] = useState<ResultadoSimulacion | null>(null);
  const [cargandoSimulacion, setCargandoSimulacion] = useState(false);

  function recalcularMigracion(
    montoOrigStr: string,
    plazoTotStr: string,
    cuotasPagStr: string,
    fechaDesembStr: string,
  ) {
    const m = Number(montoOrigStr) || 0;
    const p = Number(plazoTotStr) || 0;
    const pag = Math.max(0, Number(cuotasPagStr) || 0);

    const cuotaCap = p > 0 ? Math.round((m / p) * 100) / 100 : 0;
    const saldo = Math.max(0, Math.round((m - (pag * cuotaCap)) * 100) / 100);

    setSaldoCapitalActual(String(saldo));
    setMontoSolicitado(montoOrigStr);
    setPlazoMeses(plazoTotStr);

    if (fechaDesembStr) {
      if (pag > 0) {
        setFechaUltimoPago(sumarMesesFinanciero(fechaDesembStr, pag));
      } else {
        setFechaUltimoPago(fechaDesembStr);
      }
      setFechaProximoPago(sumarMesesFinanciero(fechaDesembStr, pag + 1));
    }
  }

  // Cálculo de atraso en tiempo real si es migración
  const calculoAtraso = useMemo(() => {
    if (!esMigracion || !fechaUltimoPago) return null;
    const dUltimo = new Date(fechaUltimoPago + "T00:00:00");
    const dHoy = new Date(new Date().toISOString().slice(0, 10) + "T00:00:00");
    const diffMs = dHoy.getTime() - dUltimo.getTime();
    const dias = Math.max(0, Math.round(diffMs / (1000 * 60 * 60 * 24)));
    if (dias < 1) return null;

    const saldo = Number(saldoCapitalActual) || Number(montoOriginalContrato) || Number(montoSolicitado) || 0;
    const plazo = Number(plazoTotalContrato) || Number(plazoMeses) || 12;
    const montoOrig = Number(montoOriginalContrato) || Number(montoSolicitado) || saldo;
    const cuotaCapBase = Math.round((montoOrig / plazo) * 100) / 100;

    const cuotasVencidas = Math.floor(dias / 30);
    const diasAtraso = Math.max(0, dias - 30);

    // Interés diario (24% anual / 365)
    const interesDiario = (saldo * 0.24) / 365;
    const interesAcumulado = Math.round(interesDiario * dias * 100) / 100;

    // Mora: Q 25 por cada cuota mensual vencida que superó 4 días de gracia
    let cuotasConMora = 0;
    for (let k = 1; k <= cuotasVencidas + 1; k++) {
      if (dias > k * 30 + 4) {
        cuotasConMora++;
      }
    }
    const moraAcumulada = cuotasConMora * 25;
    const capitalAtrasado = Math.min(saldo, Math.round(cuotaCapBase * Math.max(1, cuotasVencidas) * 100) / 100);
    const totalPonerseAlDia = Math.round((capitalAtrasado + interesAcumulado + moraAcumulada) * 100) / 100;
    const totalCancelar = Math.round((saldo + interesAcumulado + moraAcumulada) * 100) / 100;

    return {
      dias,
      cuotasVencidas,
      diasAtraso,
      cuotasConMora,
      interesAcumulado,
      moraAcumulada,
      capitalAtrasado,
      totalPonerseAlDia,
      totalCancelar,
      estaEnMora: cuotasConMora > 0,
    };
  }, [esMigracion, fechaUltimoPago, saldoCapitalActual, montoOriginalContrato, montoSolicitado, plazoTotalContrato, plazoMeses]);

  const [fiadorDuplicado, setFiadorDuplicado] = useState<{
    motivo: string;
    mensaje: string;
    prestamo?: { codigo: string; socioNombre: string; numeroAsociado: string; estado: string };
  } | null>(null);
  const [fiadorInfo, setFiadorInfo] = useState<string | null>(null);
  const [verificandoFiador, setVerificandoFiador] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  async function cargarSimulacionAmortizacion() {
    setCargandoSimulacion(true);
    const monto = esMigracion ? (Number(montoOriginalContrato) || Number(montoSolicitado) || 1000) : (Number(montoSolicitado) || 1000);
    const plazo = esMigracion ? (Number(plazoTotalContrato) || Number(plazoMeses) || 12) : (Number(plazoMeses) || 12);
    const fechaBase = esMigracion && fechaDesembolsoOriginal ? fechaDesembolsoOriginal : undefined;

    const simLocal = calcularAmortizacion({
      monto,
      plazoMeses: plazo,
      tasaInteresMensual: 2.0,
      tipoAmortizacion: "SOBRE_SALDOS",
      fechaInicio: fechaBase,
    });
    setSimulacionAmortizacion(simLocal);
    setMostrarTablaAmortizacion(true);

    try {
      const { data } = await api.post<ResultadoSimulacion>("/prestamos/simular", {
        monto,
        plazoMeses: plazo,
        tasaInteresMensual: 2.0,
        tipoAmortizacion: "SOBRE_SALDOS",
        fechaInicio: fechaBase,
      });
      setSimulacionAmortizacion(data);
    } catch {
      // Si falla la red, simLocal sigue activo
    } finally {
      setCargandoSimulacion(false);
    }
  }

  useEffect(() => {
    const sId = searchParams.get("socioId");
    if (sId && !socio) {
      api
        .get<Socio>(`/socios/${sId}`)
        .then(({ data }) => {
          setSocio(data);
          if (data.agencia_id) setAgenciaId(data.agencia_id);
        })
        .catch(() => {});
    }
  }, [searchParams]);

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

  // Verificación en tiempo real de DPI del fiador (evitar duplicados o que sea el mismo socio)
  useEffect(() => {
    if (tipo !== "FIDUCIARIO") {
      setFiadorDuplicado(null);
      setFiadorInfo(null);
      setVerificandoFiador(false);
      return;
    }
    const raw = limpiarDPI(dpiFiador);
    if (raw.length === 13) {
      setVerificandoFiador(true);
      const timer = setTimeout(() => {
        api
          .get<{
            valido: boolean;
            disponible?: boolean;
            motivo?: string;
            mensaje?: string;
            prestamo?: { codigo: string; socioNombre: string; numeroAsociado: string; estado: string };
          }>("/prestamos/verificar-fiador", {
            params: { dpi: raw, socioId: socio?.id },
          })
          .then(({ data }) => {
            if (data.disponible === false) {
              setFiadorDuplicado({
                motivo: data.motivo || "DUPLICADO",
                mensaje: data.mensaje || "El fiador no está disponible.",
                prestamo: data.prestamo,
              });
              setFiadorInfo(null);
            } else {
              setFiadorDuplicado(null);
              setFiadorInfo(data.mensaje || "✓ Fiador válido y disponible (13 dígitos)");
            }
          })
          .catch(() => {
            setFiadorDuplicado(null);
            setFiadorInfo(null);
          })
          .finally(() => setVerificandoFiador(false));
      }, 250);
      return () => clearTimeout(timer);
    } else {
      setFiadorDuplicado(null);
      setFiadorInfo(null);
      setVerificandoFiador(false);
    }
  }, [dpiFiador, socio, tipo]);

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
    if (tipo === "FIDUCIARIO" && fiadorDuplicado) {
      setError(fiadorDuplicado.mensaje);
      return;
    }

    const montoFinal = esMigracion ? (Number(montoOriginalContrato) || Number(montoSolicitado)) : Number(montoSolicitado);
    const plazoFinal = esMigracion ? (Number(plazoTotalContrato) || Number(plazoMeses)) : Number(plazoMeses);
    const saldoFinal = esMigracion ? Number(saldoCapitalActual) : montoFinal;

    if (esMigracion) {
      if (saldoCapitalActual === "" || isNaN(saldoFinal) || saldoFinal < 0) {
        setError("Indica el saldo de capital pendiente actual del crédito.");
        return;
      }
      if (montoFinal <= 0) {
        setError("Indica el monto original del crédito.");
        return;
      }
      if (saldoFinal > montoFinal) {
        setError("El saldo de capital pendiente no puede ser mayor al monto original solicitado.");
        return;
      }
      if (!fechaDesembolsoOriginal) {
        setError("Indica la fecha de desembolso original del crédito.");
        return;
      }
      if (!fechaUltimoPago) {
        setError("Indica la fecha en que el asociado realizó su último pago.");
        return;
      }
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
        montoSolicitado: montoFinal,
        plazoMeses: plazoFinal,
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
        origenFondos,
        esMigracion,
        numeroCreditoAnterior: esMigracion ? (numeroCreditoAnterior.trim() || undefined) : undefined,
        saldoCapitalActual: esMigracion ? saldoFinal : undefined,
        fechaDesembolsoOriginal: esMigracion ? fechaDesembolsoOriginal : undefined,
        fechaUltimoPago: esMigracion ? fechaUltimoPago : undefined,
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
          {/* SELECCIÓN DE ORIGEN DE FONDOS */}
          <div className="field" style={{ gridColumn: "1 / -1" }}>
            <label style={{ fontWeight: 700, marginBottom: "0.4rem", display: "block" }}>
              🏛️ Origen / Fuente de Fondos del Crédito
            </label>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: "0.5rem" }}>
              {(
                [
                  { id: "FONDOS_PROPIOS", label: "🏦 Fondos Propios (COMIF R.L.)", desc: "Recursos propios" },
                  { id: "FEDERURAL", label: "🌾 FEDERURAL", desc: "Línea Federural" },
                  { id: "CHN_GUATEMALA", label: "🏛️ CHN-GUATEMALA", desc: "Crédito Hipotecario Nal." },
                ] as const
              ).map((opt) => {
                const activo = origenFondos === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setOrigenFondos(opt.id)}
                    style={{
                      padding: "0.65rem 0.75rem",
                      borderRadius: "8px",
                      border: activo ? "2px solid #059669" : "1px solid var(--line)",
                      background: activo ? "rgba(5, 150, 105, 0.1)" : "var(--paper)",
                      color: activo ? "#065f46" : "var(--ink)",
                      fontWeight: activo ? 700 : 500,
                      cursor: "pointer",
                      textAlign: "left",
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.2rem",
                      transition: "all 0.15s ease",
                    }}
                  >
                    <span style={{ fontSize: "0.88rem" }}>{opt.label}</span>
                    <span style={{ fontSize: "0.72rem", color: activo ? "#047857" : "var(--ink-soft)" }}>{opt.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>

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

          {!esMigracion && (
            <>
              <div className="field">
                <label htmlFor="cred-monto">Monto solicitado (Q)</label>
                <input
                  id="cred-monto"
                  type="number"
                  min="1"
                  step="any"
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
            </>
          )}

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

          {/* SECCIÓN DE MIGRACIÓN DE CRÉDITO HISTÓRICO / PREEXISTENTE */}
          <div
            className="field"
            style={{
              gridColumn: "1 / -1",
              background: esMigracion ? "rgba(245, 158, 11, 0.08)" : "var(--paper-raised)",
              border: esMigracion ? "2px solid #f59e0b" : "1px solid var(--line)",
              borderRadius: "10px",
              padding: "1rem 1.15rem",
              transition: "all 0.2s ease",
            }}
          >
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.65rem",
                cursor: "pointer",
                fontWeight: 700,
                color: esMigracion ? "#b45309" : "var(--ink)",
                fontSize: "0.95rem",
                marginBottom: esMigracion ? "0.85rem" : 0,
              }}
            >
              <input
                type="checkbox"
                checked={esMigracion}
                onChange={(e) => {
                  const val = e.target.checked;
                  setEsMigracion(val);
                  if (val) {
                    if (!saldoCapitalActual) setSaldoCapitalActual(montoSolicitado);
                    if (!fechaDesembolsoOriginal) {
                      const hace6m = new Date();
                      hace6m.setMonth(hace6m.getMonth() - 6);
                      setFechaDesembolsoOriginal(hace6m.toISOString().slice(0, 10));
                    }
                    if (!fechaUltimoPago) {
                      const hace1m = new Date();
                      hace1m.setMonth(hace1m.getMonth() - 1);
                      setFechaUltimoPago(hace1m.toISOString().slice(0, 10));
                    }
                  }
                }}
                style={{ width: "1.2rem", height: "1.2rem", accentColor: "#f59e0b" }}
              />
              📂 ¿Es un crédito que ya viene pagando (migración / preexistente)?
            </label>

            {esMigracion && (
              <div>
                <p style={{ fontSize: "0.82rem", color: "var(--ink-soft)", margin: "0 0 1rem", lineHeight: 1.45 }}>
                  Utiliza esta opción para ingresar asociados antiguos que ya tienen un crédito activo desembolsado en meses o años anteriores. El crédito se registrará directamente como <strong>DESEMBOLSADO</strong> con su saldo adeudado real, <strong>sin registrar egresos falsos de efectivo en la caja de hoy</strong>.
                </p>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "0.85rem" }}>
                  <div className="field">
                    <label htmlFor="mig-num-credito" style={{ color: "#b45309", fontWeight: 700 }}>
                      📋 No. Crédito Físico / Anterior
                    </label>
                    <input
                      id="mig-num-credito"
                      type="text"
                      value={numeroCreditoAnterior}
                      onChange={(e) => setNumeroCreditoAnterior(e.target.value)}
                      placeholder="Ej. 2-189-1-2026"
                      style={{ fontWeight: 600, borderColor: "#f59e0b" }}
                    />
                    <span className="hint">Pagaré o número de crédito en la hoja física</span>
                  </div>

                  <div className="field">
                    <label htmlFor="mig-monto-orig" style={{ color: "#b45309", fontWeight: 700 }}>
                      💰 Monto Original del Crédito (Q) *
                    </label>
                    <input
                      id="mig-monto-orig"
                      type="number"
                      step="any"
                      min="1"
                      value={montoOriginalContrato}
                      onChange={(e) => {
                        const val = e.target.value;
                        setMontoOriginalContrato(val);
                        recalcularMigracion(val, plazoTotalContrato, cuotasPagadas, fechaDesembolsoOriginal);
                      }}
                      required={esMigracion}
                      placeholder="Ej. 39772.73"
                      style={{ fontWeight: 700, fontSize: "1.05rem", borderColor: "#f59e0b" }}
                    />
                    <span className="hint">Capital original desembolsado según la hoja</span>
                  </div>

                  <div className="field">
                    <label htmlFor="mig-plazo-orig" style={{ color: "#b45309", fontWeight: 700 }}>
                      📅 Plazo Total Original (Meses) *
                    </label>
                    <input
                      id="mig-plazo-orig"
                      type="number"
                      min="1"
                      max="120"
                      value={plazoTotalContrato}
                      onChange={(e) => {
                        const val = e.target.value;
                        setPlazoTotalContrato(val);
                        recalcularMigracion(montoOriginalContrato, val, cuotasPagadas, fechaDesembolsoOriginal);
                      }}
                      required={esMigracion}
                      placeholder="Ej. 36"
                      style={{ fontWeight: 700, fontSize: "1.05rem", borderColor: "#f59e0b" }}
                    />
                    <span className="hint">Plazo total acordado en el contrato físico</span>
                  </div>

                  <div className="field">
                    <label htmlFor="mig-fecha-desemb" style={{ color: "#b45309", fontWeight: 700 }}>
                      🗓️ Fecha de Entrega / Desembolso Original *
                    </label>
                    <input
                      id="mig-fecha-desemb"
                      type="date"
                      value={fechaDesembolsoOriginal}
                      onChange={(e) => {
                        const val = e.target.value;
                        setFechaDesembolsoOriginal(val);
                        recalcularMigracion(montoOriginalContrato, plazoTotalContrato, cuotasPagadas, val);
                      }}
                      required={esMigracion}
                      style={{ borderColor: "#f59e0b", fontWeight: 600 }}
                    />
                    <span className="hint">Fecha de entrega según encabezado físico</span>
                  </div>

                  <div className="field">
                    <label htmlFor="mig-cuotas-pagadas" style={{ color: "#065f46", fontWeight: 700 }}>
                      🔢 Cuotas ya pagadas *
                    </label>
                    <input
                      id="mig-cuotas-pagadas"
                      type="number"
                      min="0"
                      max={Number(plazoTotalContrato) || 120}
                      value={cuotasPagadas}
                      onChange={(e) => {
                        const val = e.target.value;
                        setCuotasPagadas(val);
                        recalcularMigracion(montoOriginalContrato, plazoTotalContrato, val, fechaDesembolsoOriginal);
                      }}
                      required={esMigracion}
                      placeholder="Ej. 6"
                      style={{ fontWeight: 700, fontSize: "1.05rem", borderColor: "#059669" }}
                    />
                    <span className="hint">Número de cuotas pagadas</span>
                  </div>

                  <div className="field">
                    <label htmlFor="mig-saldo-actual" style={{ color: "#059669", fontWeight: 700 }}>
                      💰 Saldo Capital Vivo Actual (Q) *
                    </label>
                    <input
                      id="mig-saldo-actual"
                      type="number"
                      step="any"
                      min="0"
                      value={saldoCapitalActual}
                      onChange={(e) => setSaldoCapitalActual(e.target.value)}
                      required={esMigracion}
                      placeholder="Ej. 33143.93"
                      style={{ fontWeight: 700, fontSize: "1.05rem", borderColor: "#059669", background: "#f0fdf4" }}
                    />
                    <span className="hint">Monto real adeudado (puedes editarlo si dio abonos extra)</span>
                  </div>
                </div>

                {/* RESUMEN EN VIVO DE LAS CUOTAS CALCULADAS EXACTAS */}
                {Number(montoOriginalContrato) > 0 && Number(plazoTotalContrato) > 0 && (
                  <div
                    style={{
                      marginTop: "0.85rem",
                      padding: "0.85rem",
                      borderRadius: "8px",
                      background: "var(--paper)",
                      border: "1px solid var(--line)",
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
                      gap: "0.75rem",
                      fontSize: "0.82rem",
                    }}
                  >
                    <div style={{ background: "var(--paper-raised)", padding: "0.5rem 0.75rem", borderRadius: "6px", border: "1px solid var(--line)" }}>
                      <span style={{ color: "var(--ink-soft)", display: "block", fontSize: "0.72rem" }}>
                        💳 Cuota Capital Fija
                      </span>
                      <strong style={{ fontSize: "1.05rem", color: "var(--ink)" }}>
                        Q {(Number(montoOriginalContrato) / Number(plazoTotalContrato)).toFixed(2)} / mes
                      </strong>
                      <span style={{ fontSize: "0.68rem", color: "var(--ink-soft)", display: "block" }}>
                        (Q {Number(montoOriginalContrato).toFixed(2)} ÷ {plazoTotalContrato}m)
                      </span>
                    </div>

                    <div style={{ background: "var(--paper-raised)", padding: "0.5rem 0.75rem", borderRadius: "6px", border: "1px solid var(--line)" }}>
                      <span style={{ color: "var(--ink-soft)", display: "block", fontSize: "0.72rem" }}>
                        🏦 Saldo Original (Anterior)
                      </span>
                      <strong style={{ fontSize: "1.05rem", color: "var(--ink)" }}>
                        Q {Number(montoOriginalContrato).toFixed(2)}
                      </strong>
                      <span style={{ fontSize: "0.68rem", color: "var(--ink-soft)", display: "block" }}>
                        Monto inicial desembolsado
                      </span>
                    </div>

                    <div style={{ background: "var(--paper-raised)", padding: "0.5rem 0.75rem", borderRadius: "6px", border: "1px solid var(--line)" }}>
                      <span style={{ color: "#065f46", display: "block", fontSize: "0.72rem", fontWeight: 700 }}>
                        💰 Saldo Capital Vivo Actual
                      </span>
                      <strong style={{ fontSize: "1.05rem", color: "#059669" }}>
                        Q {Number(saldoCapitalActual).toFixed(2)}
                      </strong>
                      <span style={{ fontSize: "0.68rem", color: "var(--ink-soft)", display: "block" }}>
                        {cuotasPagadas} cuota(s) pagadas
                      </span>
                    </div>

                    <div style={{ background: "var(--paper-raised)", padding: "0.5rem 0.75rem", borderRadius: "6px", border: "1px solid var(--line)" }}>
                      <span style={{ color: "var(--ink-soft)", display: "block", fontSize: "0.72rem" }}>
                        ⏳ Cuotas Pendientes
                      </span>
                      <strong style={{ fontSize: "1.05rem", color: "var(--ink)" }}>
                        {Math.max(0, Number(plazoTotalContrato) - Number(cuotasPagadas))} meses
                      </strong>
                      <span style={{ fontSize: "0.68rem", color: "var(--ink-soft)", display: "block" }}>
                        de {plazoTotalContrato} totales
                      </span>
                    </div>

                    <div style={{ background: "var(--paper-raised)", padding: "0.5rem 0.75rem", borderRadius: "6px", border: "1px solid var(--line)" }}>
                      <span style={{ color: "var(--ink-soft)", display: "block", fontSize: "0.72rem" }}>
                        📅 Próxima Cuota Exigible
                      </span>
                      <strong style={{ fontSize: "1.02rem", color: "#0284c7" }}>
                        {fechaProximoPago || "—"}
                      </strong>
                      <span style={{ fontSize: "0.68rem", color: "var(--ink-soft)", display: "block" }}>
                        Cuota No. {Number(cuotasPagadas) + 1}
                      </span>
                    </div>
                  </div>
                )}

                {/* ALERTA EN VIVO DE CUOTAS Y DÍAS DE ATRASO / MORA DETECTADA */}
                {calculoAtraso && calculoAtraso.dias > 0 && (
                  <div
                    style={{
                      marginTop: "1rem",
                      padding: "0.85rem 1rem",
                      borderRadius: "8px",
                      background: calculoAtraso.estaEnMora ? "rgba(239, 68, 68, 0.08)" : "rgba(245, 158, 11, 0.08)",
                      border: calculoAtraso.estaEnMora ? "1.5px solid #ef4444" : "1.5px solid #f59e0b",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem", flexWrap: "wrap", gap: "0.5rem" }}>
                      <span style={{ fontWeight: 800, fontSize: "0.88rem", color: calculoAtraso.estaEnMora ? "#b91c1c" : "#b45309", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                        <span>⚠️</span> Atraso Detectado: {calculoAtraso.cuotasVencidas > 0 ? `${calculoAtraso.cuotasVencidas} cuota(s) / ` : ""}{calculoAtraso.dias} días transcurridos sin pago
                      </span>
                      <span
                        style={{
                          fontSize: "0.72rem",
                          fontWeight: 700,
                          padding: "0.15rem 0.5rem",
                          borderRadius: "4px",
                          background: calculoAtraso.estaEnMora ? "#fee2e2" : "#fef3c7",
                          color: calculoAtraso.estaEnMora ? "#991b1b" : "#92400e",
                          border: calculoAtraso.estaEnMora ? "1px solid #fca5a5" : "1px solid #fde68a",
                        }}
                      >
                        {calculoAtraso.estaEnMora ? `En Mora (${calculoAtraso.cuotasConMora} cuota(s) × Q25)` : "En período de gracia (Q 0 mora)"}
                      </span>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "0.5rem", fontSize: "0.82rem" }}>
                      <div style={{ background: "var(--paper)", padding: "0.45rem 0.6rem", borderRadius: "6px", border: "1px solid var(--line)" }}>
                        <span style={{ color: "var(--ink-soft)", display: "block", fontSize: "0.7rem" }}>Capital vencido ({calculoAtraso.cuotasVencidas} cuotas)</span>
                        <strong style={{ fontSize: "0.95rem", color: "var(--ink)" }}>Q {calculoAtraso.capitalAtrasado.toFixed(2)}</strong>
                      </div>
                      <div style={{ background: "var(--paper)", padding: "0.45rem 0.6rem", borderRadius: "6px", border: "1px solid var(--line)" }}>
                        <span style={{ color: "var(--ink-soft)", display: "block", fontSize: "0.7rem" }}>Interés devengado ({calculoAtraso.dias}d al 2%)</span>
                        <strong style={{ fontSize: "0.95rem", color: "#d97706" }}>Q {calculoAtraso.interesAcumulado.toFixed(2)}</strong>
                      </div>
                      <div style={{ background: "var(--paper)", padding: "0.45rem 0.6rem", borderRadius: "6px", border: "1px solid var(--line)" }}>
                        <span style={{ color: "var(--ink-soft)", display: "block", fontSize: "0.7rem" }}>Mora sugerida ({calculoAtraso.cuotasConMora} cuotas)</span>
                        <strong style={{ fontSize: "0.95rem", color: calculoAtraso.estaEnMora ? "#b91c1c" : "var(--ink)" }}>
                          Q {calculoAtraso.moraAcumulada.toFixed(2)}
                        </strong>
                      </div>
                      <div style={{ background: "var(--paper)", padding: "0.45rem 0.6rem", borderRadius: "6px", border: "1.5px solid #059669" }}>
                        <span style={{ color: "#065f46", display: "block", fontSize: "0.7rem", fontWeight: 700 }}>Total para ponerse al día</span>
                        <strong style={{ fontSize: "1rem", color: "#059669" }}>Q {calculoAtraso.totalPonerseAlDia.toFixed(2)}</strong>
                      </div>
                    </div>

                    <p style={{ margin: "0.5rem 0 0", fontSize: "0.74rem", color: "var(--ink-soft)", lineHeight: 1.35 }}>
                      💡 <em>Nota operativa:</em> Al ingresar la migración, este atraso se registrará en el expediente. Cuando el asociado acuda a pagar a ventanilla, el cajero podrá cobrar este desglose exacto o editar cualquier monto según acuerdos aprobados.
                    </p>
                  </div>
                )}

                {/* BOTÓN Y TABLA DE AMORTIZACIÓN PARA CUADRE FÍSICO (CON 3 SECCIONES DE COLOR) */}
                <div style={{ marginTop: "1rem" }}>
                  <button
                    type="button"
                    className="btn secondary"
                    onClick={() => {
                      if (mostrarTablaAmortizacion) {
                        setMostrarTablaAmortizacion(false);
                      } else {
                        cargarSimulacionAmortizacion();
                      }
                    }}
                    style={{
                      fontSize: "0.82rem",
                      padding: "0.4rem 0.75rem",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.4rem",
                    }}
                  >
                    <span>{mostrarTablaAmortizacion ? "▲ Ocultar Plan de Amortización" : "📊 Comparar con Hoja de Pagos Física del Asociado"}</span>
                  </button>

                  {cargandoSimulacion && (
                    <span className="hint" style={{ marginLeft: "0.75rem" }}>Generando tabla de amortización…</span>
                  )}

                  {mostrarTablaAmortizacion && simulacionAmortizacion && (
                    <div
                      style={{
                        marginTop: "0.85rem",
                        background: "var(--paper)",
                        border: "1px solid var(--line)",
                        borderRadius: "8px",
                        padding: "0.75rem",
                        maxHeight: "380px",
                        overflowY: "auto",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.4rem" }}>
                        <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--ink)" }}>
                          Plan Oficial de Amortización (Cuadre con Hoja Física)
                        </span>
                        <span style={{ fontSize: "0.75rem", color: "var(--ink-soft)" }}>
                          Monto original: Q {Number(montoSolicitado).toLocaleString("es-GT")} | Plazo: {plazoMeses} meses
                        </span>
                      </div>

                      {/* LEYENDA DE 3 SECCIONES DE COLOR */}
                      <div style={{ display: "flex", gap: "0.85rem", marginBottom: "0.6rem", flexWrap: "wrap", fontSize: "0.72rem" }}>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem" }}>
                          <span style={{ width: "10px", height: "10px", borderRadius: "2px", background: "#d1fae5", border: "1px solid #10b981" }} />
                          <strong style={{ color: "#065f46" }}>Verde:</strong> Cuotas Pagadas (Históricas)
                        </span>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem" }}>
                          <span style={{ width: "10px", height: "10px", borderRadius: "2px", background: "#fee2e2", border: "1px solid #ef4444" }} />
                          <strong style={{ color: "#991b1b" }}>Rojo:</strong> Cuotas Vencidas / Atrasadas
                        </span>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem" }}>
                          <span style={{ width: "10px", height: "10px", borderRadius: "2px", background: "var(--mono-bg)", border: "1px solid var(--line)" }} />
                          <strong style={{ color: "var(--ink-soft)" }}>Gris:</strong> Cuotas Futuras
                        </span>
                      </div>

                      <table style={{ width: "100%", fontSize: "0.78rem", borderCollapse: "collapse" }}>
                        <thead>
                          <tr style={{ background: "var(--mono-bg)", textAlign: "left" }}>
                            <th style={{ padding: "0.35rem 0.5rem" }}>No.</th>
                            <th style={{ padding: "0.35rem 0.5rem" }}>Fecha programada</th>
                            <th style={{ padding: "0.35rem 0.5rem", textAlign: "right" }}>Cuota Total</th>
                            <th style={{ padding: "0.35rem 0.5rem", textAlign: "right" }}>Saldo Anterior</th>
                            <th style={{ padding: "0.35rem 0.5rem", textAlign: "right" }}>Capital</th>
                            <th style={{ padding: "0.35rem 0.5rem", textAlign: "right" }}>Interés (2%)</th>
                            <th style={{ padding: "0.35rem 0.5rem", textAlign: "right" }}>Saldo Actual</th>
                            <th style={{ padding: "0.35rem 0.5rem", textAlign: "center" }}>Estado Cuadre</th>
                          </tr>
                        </thead>
                        <tbody>
                          {simulacionAmortizacion.tabla.map((c: CuotaAmortizacion) => {
                            const hoyStr = new Date().toISOString().slice(0, 10);
                            const cPagNum = Number(cuotasPagadas) || 0;
                            const esPagada = cPagNum > 0 ? c.numero <= cPagNum : (fechaUltimoPago ? c.fechaPago <= fechaUltimoPago : false);
                            const esAtrasada = !esPagada && (c.fechaPago < hoyStr);

                            let bgRow = undefined;
                            let colorEstado = "var(--ink-soft)";
                            let labelEstado = "Futura";

                            if (esPagada) {
                              bgRow = "rgba(16, 185, 129, 0.12)";
                              colorEstado = "#065f46";
                              labelEstado = "✓ Pagada (Histórica)";
                            } else if (c.numero === cPagNum + 1) {
                              bgRow = esAtrasada ? "rgba(239, 68, 68, 0.14)" : "rgba(2, 132, 199, 0.12)";
                              colorEstado = esAtrasada ? "#991b1b" : "#0284c7";
                              labelEstado = esAtrasada ? "⚠️ Atrasada (+ Mora Q25)" : "👉 Próxima a Cobrar";
                            } else if (esAtrasada) {
                              bgRow = "rgba(239, 68, 68, 0.14)";
                              colorEstado = "#991b1b";
                              labelEstado = "⚠️ Atrasada (+ Mora Q25)";
                            }

                            const saldoAnterior = c.saldoRestante + c.capital;

                            return (
                              <tr
                                key={c.numero}
                                style={{
                                  borderBottom: "1px solid var(--line)",
                                  background: bgRow,
                                  fontWeight: (c.numero === cPagNum + 1 || esAtrasada) ? 700 : undefined,
                                }}
                              >
                                <td style={{ padding: "0.35rem 0.5rem" }}>{c.numero}</td>
                                <td style={{ padding: "0.35rem 0.5rem" }}>{formatearFechaLocal(c.fechaPago)}</td>
                                <td style={{ padding: "0.35rem 0.5rem", textAlign: "right" }}>Q {c.cuota.toFixed(2)}</td>
                                <td style={{ padding: "0.35rem 0.5rem", textAlign: "right", color: "var(--ink-soft)", fontWeight: 400 }}>Q {saldoAnterior.toFixed(2)}</td>
                                <td style={{ padding: "0.35rem 0.5rem", textAlign: "right", fontWeight: 700 }}>Q {c.capital.toFixed(2)}</td>
                                <td style={{ padding: "0.35rem 0.5rem", textAlign: "right" }}>Q {c.interes.toFixed(2)}</td>
                                <td style={{ padding: "0.35rem 0.5rem", textAlign: "right", fontWeight: 700 }}>
                                  Q {c.saldoRestante.toFixed(2)}
                                </td>
                                <td style={{ padding: "0.35rem 0.5rem", textAlign: "center", color: colorEstado, fontSize: "0.72rem", fontWeight: 700 }}>
                                  {labelEstado}
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
            )}
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
                    inputMode="numeric"
                    value={dpiFiador}
                    onChange={(e) => setDpiFiador(formatearDPI(e.target.value.replace(/[^0-9-]/g, "")))}
                    placeholder="xxxx-xxxxx-xxxx (13 dígitos)"
                    maxLength={15}
                    style={{
                      fontFamily: "monospace",
                      letterSpacing: "0.5px",
                      borderColor: fiadorDuplicado ? "var(--danger, #ef4444)" : undefined,
                    }}
                  />
                  <div style={{ minHeight: "1.1rem", marginTop: "0.2rem" }}>
                    {verificandoFiador && <span className="hint">🔍 Verificando fiador en el sistema...</span>}
                    {fiadorDuplicado && (
                      <span style={{ color: "#ef4444", fontSize: "0.78rem", fontWeight: 600, display: "block" }}>
                        ⚠️ {fiadorDuplicado.mensaje}
                      </span>
                    )}
                    {!verificandoFiador && !fiadorDuplicado && fiadorInfo && limpiarDPI(dpiFiador).length === 13 && (
                      <span style={{ color: "#10b981", fontSize: "0.78rem", fontWeight: 600, display: "block" }}>
                        {fiadorInfo}
                      </span>
                    )}
                    {limpiarDPI(dpiFiador).length > 0 && limpiarDPI(dpiFiador).length < 13 && (
                      <span className="hint">{limpiarDPI(dpiFiador).length}/13 dígitos numéricos</span>
                    )}
                  </div>
                </div>

                <div className="field">
                  <label htmlFor="fiador-tel">Teléfono del fiador</label>
                  <div style={{ display: "flex", alignItems: "center" }}>
                    <span
                      style={{
                        padding: "0.55rem 0.65rem",
                        background: "var(--mono-bg, #1e293b)",
                        border: "1px solid var(--line)",
                        borderRight: "none",
                        borderRadius: "8px 0 0 8px",
                        fontSize: "0.85rem",
                        color: "var(--ink)",
                        fontWeight: 600,
                      }}
                    >
                      🇬🇹 +502
                    </span>
                    <input
                      id="fiador-tel"
                      inputMode="numeric"
                      value={telefonoFiador}
                      onChange={(e) => setTelefonoFiador(formatearTelefono(e.target.value.replace(/[^0-9-]/g, "")))}
                      placeholder="xxxx-xxxx"
                      maxLength={9}
                      style={{
                        borderRadius: "0 8px 8px 0",
                        fontFamily: "monospace",
                        letterSpacing: "0.5px",
                      }}
                    />
                  </div>
                  <span className="hint">8 dígitos locales (opcional)</span>
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
          <button
            type="submit"
            className="btn"
            disabled={
              guardando ||
              !socio ||
              !agenciaId ||
              (tipo === "FIDUCIARIO" && Boolean(fiadorDuplicado)) ||
              verificandoFiador
            }
          >
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
