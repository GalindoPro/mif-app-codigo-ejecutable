import { useEffect, useState, useMemo } from "react";
import type { FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api, mensajeError } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { TIPOS_AHORRO, PARENTESCOS_BENEFICIARIO_MENOR } from "../types";
import type { Agencia, Socio, Prestamo } from "../types";
import { formatearDPI, calcularEdad } from "../lib/formatters";
import BuscadorSocio from "../components/BuscadorSocio";
import InputNombreAutoCompletar from "../components/InputNombreAutoCompletar";

export default function AhorroCuentaForm() {
  const { slug } = useParams<{ slug: string }>();
  const config = TIPOS_AHORRO.find((t) => t.slug === slug);
  const { usuario } = useAuth();
  const navigate = useNavigate();
  const puedeElegirAgencia = usuario?.rol === "GERENCIA";

  const [agencias, setAgencias] = useState<Agencia[]>([]);
  const [agenciaId, setAgenciaId] = useState(usuario?.agenciaId ?? "");
  const [socio, setSocio] = useState<Socio | null>(null);
  const [numeroCuenta, setNumeroCuenta] = useState("");
  const [saldoInicial, setSaldoInicial] = useState("0");
  const [cuotaPactada, setCuotaPactada] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [cuentaExistente, setCuentaExistente] = useState<{ id: string; numero_cuenta: string } | null>(null);
  const [saldoAportacion, setSaldoAportacion] = useState<number | null>(null);
  const [creandoAportacionRapida, setCreandoAportacionRapida] = useState(false);
  const [prestamosSocio, setPrestamosSocio] = useState<Prestamo[]>([]);
  const [prestamoSeleccionadoId, setPrestamoSeleccionadoId] = useState<string>("");

  const [titularMenorNombre, setTitularMenorNombre] = useState("");
  const [titularMenorParentesco, setTitularMenorParentesco] = useState("Hijo(a)");
  const [titularMenorCui, setTitularMenorCui] = useState("");
  const [titularMenorFechaNacimiento, setTitularMenorFechaNacimiento] = useState("");

  const esProgramadoOInfanto =
    config?.tipo === "AHORRO_PROGRAMADO" || config?.tipo === "AHORRO_INFANTO_JUVENIL";
  const esInfanto = config?.tipo === "AHORRO_INFANTO_JUVENIL";

  const edadMenor = useMemo(() => {
    if (!esInfanto || !titularMenorFechaNacimiento) return null;
    return calcularEdad(titularMenorFechaNacimiento);
  }, [esInfanto, titularMenorFechaNacimiento]);

  const esMayorDeEdad = edadMenor !== null && edadMenor >= 18;
  const esFechaFutura = edadMenor !== null && edadMenor < 0;

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sId = params.get("socioId");
    if (sId && !socio) {
      api
        .get<Socio>(`/socios/${sId}`)
        .then(({ data }) => {
          setSocio(data);
          if (data.agencia_id) setAgenciaId(data.agencia_id);
        })
        .catch(() => {});
    }
  }, []);

  useEffect(() => {
    if (puedeElegirAgencia) api.get<Agencia[]>("/agencias").then(({ data }) => setAgencias(data));
  }, [puedeElegirAgencia]);

  useEffect(() => {
    if (!agenciaId || !config) return;
    api
      .get<{ numeroCuenta: string }>("/cuentas/siguiente-numero", { params: { agenciaId, tipo: config.tipo } })
      .then(({ data }) => setNumeroCuenta(data.numeroCuenta));
  }, [agenciaId, config]);

  useEffect(() => {
    if (!socio || !config) {
      setCuentaExistente(null);
      setSaldoAportacion(null);
      setPrestamosSocio([]);
      setPrestamoSeleccionadoId("");
      return;
    }
    api
      .get<{ cuentas: Array<{ id: string; numero_cuenta: string; tipo: string; estado: string; saldo_actual?: string }> }>(`/socios/${socio.id}`)
      .then(({ data }) => {
        const apor = data.cuentas?.find((c) => c.tipo === "APORTACION" && c.estado === "ACTIVA");
        const saldo = apor ? Number(apor.saldo_actual ?? 0) : 0;
        setSaldoAportacion(saldo);

        const encontrada = data.cuentas?.find((c) => c.tipo === config.tipo && c.estado === "ACTIVA");
        setCuentaExistente(encontrada ? { id: encontrada.id, numero_cuenta: encontrada.numero_cuenta } : null);
      })
      .catch(() => {
        setCuentaExistente(null);
        setSaldoAportacion(null);
      });

    if (config.tipo === "AHORRO_SOBRE_PRESTAMO") {
      api
        .get<Prestamo[]>("/prestamos", { params: { socioId: socio.id } })
        .then(({ data }) => {
          const activos = data.filter((p) => p.estado !== "CANCELADO" && p.estado !== "RECHAZADO");
          setPrestamosSocio(activos);
          if (activos[0]) setPrestamoSeleccionadoId(activos[0].id);
        })
        .catch(() => setPrestamosSocio([]));
    }
  }, [socio, config]);

  async function handleAperturarAportacionRapida() {
    if (!socio) return;
    setCreandoAportacionRapida(true);
    setError(null);
    try {
      await api.post(`/socios/${socio.id}/abrir-aportacion`, { monto: 100 });
      setSaldoAportacion(100);
    } catch (err) {
      setError(mensajeError(err));
    } finally {
      setCreandoAportacionRapida(false);
    }
  }

  if (!config) return <div className="alert error">Tipo de ahorro no reconocido.</div>;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!socio) {
      setError("Selecciona primero el socio dueño de la cuenta.");
      return;
    }
    if (cuentaExistente) {
      setError(`Este socio ya tiene la cuenta ${cuentaExistente.numero_cuenta} de ${config!.titulo}.`);
      return;
    }
    if (saldoAportacion !== null && saldoAportacion < 100) {
      setError(
        `Regla de la cooperativa: El socio debe tener un saldo de aportaciones de al menos Q 100.00 para poder abrir cuentas de ahorro infantil, corriente o programado (saldo actual: Q ${saldoAportacion.toFixed(2)}).`
      );
      return;
    }
    if (esInfanto) {
      if (!titularMenorNombre.trim()) {
        setError("Indica el nombre completo del menor titular de la cuenta.");
        return;
      }
      if (!titularMenorParentesco.trim()) {
        setError("Indica el parentesco del menor con el socio responsable.");
        return;
      }
      if (!titularMenorFechaNacimiento) {
        setError("Indica la fecha de nacimiento del menor titular.");
        return;
      }
      if (esFechaFutura) {
        setError("La fecha de nacimiento no puede ser una fecha futura.");
        return;
      }
      if (esMayorDeEdad) {
        setError(
          `Titular mayor de edad (${edadMenor} años): Las cuentas de Ahorro Infanto Juvenil son exclusivas para menores de 18 años.`
        );
        return;
      }
    }
    setError(null);
    setGuardando(true);
    try {
      const { data } = await api.post("/cuentas", {
        tipo: config!.tipo,
        agenciaId,
        socioId: socio.id,
        numeroCuenta,
        saldoInicial: Number(saldoInicial) || 0,
        cuotaPactada: cuotaPactada ? Number(cuotaPactada) : undefined,
        prestamoId: prestamoSeleccionadoId || undefined,
        titularMenorNombre: esInfanto ? titularMenorNombre.trim() : undefined,
        titularMenorParentesco: esInfanto ? titularMenorParentesco.trim() : undefined,
        titularMenorCui: esInfanto ? titularMenorCui.replace(/[^0-9-]/g, "") || undefined : undefined,
        titularMenorFechaNacimiento: esInfanto ? titularMenorFechaNacimiento || undefined : undefined,
      });
      navigate(`/ahorros/${config!.slug}/${data.id}`);
    } catch (err) {
      setError(mensajeError(err));
      setGuardando(false);
    }
  }

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Nueva cuenta — {config.titulo}</h1>
          <p>Abre la cuenta a nombre de un socio ya registrado; los depósitos se agregan después.</p>
        </div>
      </div>

      {error && <div className="alert error">{error}</div>}

      {socio && saldoAportacion !== null && saldoAportacion < 100 && (
        <div
          className="alert warning"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "0.75rem",
            marginBottom: "1rem",
            borderLeft: "4px solid #f59e0b",
          }}
        >
          <div>
            <strong>⚠️ Este asociado no cuenta con Aportación Inicial estatutaria (Q {saldoAportacion.toFixed(2)})</strong>
            <p style={{ margin: "0.2rem 0 0", fontSize: "0.85rem", color: "var(--ink-soft)" }}>
              Para habilitar la apertura de su {config.titulo}, es obligatorio registrar su Aportación Estatutaria mínima de Q 100.00.
            </p>
          </div>
          <button
            type="button"
            className="btn"
            style={{ background: "#059669", borderColor: "#059669", fontWeight: 700, fontSize: "0.85rem" }}
            onClick={handleAperturarAportacionRapida}
            disabled={creandoAportacionRapida}
          >
            {creandoAportacionRapida ? "Aperturando…" : "➕ Aperturar Aportación (Q 100) Ahora"}
          </button>
        </div>
      )}

      <form className="card" onSubmit={onSubmit} style={{ maxWidth: 560 }}>
        {puedeElegirAgencia && (
          <div className="field">
            <label htmlFor="agencia">Agencia</label>
            <select id="agencia" value={agenciaId} onChange={(e) => setAgenciaId(e.target.value)} required>
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

        <div className="field">
          <label>Socio</label>
          <BuscadorSocio agenciaId={agenciaId || undefined} seleccionado={socio} onSeleccionar={setSocio} />
          {cuentaExistente && (
            <div
              style={{
                marginTop: "0.5rem",
                padding: "0.75rem",
                borderRadius: "8px",
                background: "#fef3c7",
                color: "#92400e",
                border: "1px solid #f59e0b",
                fontSize: "0.88rem",
              }}
            >
              ⚠️ <strong>{socio?.nombres}</strong> ya tiene una cuenta de {config.titulo}:{" "}
              <strong>{cuentaExistente.numero_cuenta}</strong>. Cada socio solo puede tener una cuenta por tipo de ahorro.
              <div style={{ marginTop: "0.5rem" }}>
                <button
                  type="button"
                  className="btn secondary"
                  style={{ fontSize: "0.85rem", padding: "0.35rem 0.75rem" }}
                  onClick={() => navigate(`/ahorros/${config.slug}/${cuentaExistente.id}`)}
                >
                  Ver cuenta y movimientos →
                </button>
              </div>
            </div>
          )}

          {socio && saldoAportacion !== null && (
            saldoAportacion < 100 ? (
              <div
                style={{
                  marginTop: "0.6rem",
                  padding: "0.75rem 0.9rem",
                  borderRadius: "8px",
                  background: "rgba(239, 68, 68, 0.1)",
                  color: "#ef4444",
                  border: "1px solid rgba(239, 68, 68, 0.3)",
                  fontSize: "0.86rem",
                  lineHeight: 1.45,
                }}
              >
                ⚠️ <strong>Aportación estatutaria insuficiente:</strong> El socio tiene un saldo de aportaciones de{" "}
                <strong>Q {saldoAportacion.toFixed(2)}</strong>. La regla de la cooperativa exige contar con al menos{" "}
                <strong>Q 100.00</strong> en aportaciones para habilitar la apertura de cuentas de {config.titulo.toLowerCase()}.
              </div>
            ) : (
              <div
                style={{
                  marginTop: "0.6rem",
                  padding: "0.5rem 0.8rem",
                  borderRadius: "8px",
                  background: "rgba(16, 185, 129, 0.1)",
                  color: "#10b981",
                  border: "1px solid rgba(16, 185, 129, 0.25)",
                  fontSize: "0.82rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.4rem",
                }}
              >
                <span>✓</span> Aportación estatutaria activa: <strong>Q {saldoAportacion.toFixed(2)}</strong> (Cumple con el requisito mínimo de Q 100.00)
              </div>
            )
          )}
        </div>

        {esInfanto && (
          <div
            style={{
              background: "rgba(14, 165, 233, 0.08)",
              border: "1px solid rgba(14, 165, 233, 0.3)",
              borderRadius: "8px",
              padding: "0.85rem 1rem",
              marginBottom: "1rem",
            }}
          >
            <div style={{ fontWeight: 700, color: "#0284c7", marginBottom: "0.6rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <span>🧒</span> Datos del menor titular de la cuenta
            </div>
            <p style={{ fontSize: "0.82rem", color: "var(--ink-soft)", margin: "0 0 0.75rem" }}>
              {socio ? <strong>{socio.nombres}</strong> : "El socio"} figura como responsable/tutor de la cuenta, pero el ahorro pertenece al menor. Indica sus datos.
            </p>

            <div className="field" style={{ marginBottom: "0.6rem" }}>
              <label htmlFor="menor-nombre">
                Nombre completo del menor <span style={{ color: "var(--danger, #dc2626)" }}>*</span>
              </label>
              <InputNombreAutoCompletar
                id="menor-nombre"
                value={titularMenorNombre}
                onChange={setTitularMenorNombre}
                placeholder="Ej. Juanito Tomás Sánchez Pérez"
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
              <div className="field" style={{ marginBottom: "0.6rem" }}>
                <label htmlFor="menor-parentesco">
                  Parentesco con el tutor <span style={{ color: "var(--danger, #dc2626)" }}>*</span>
                </label>
                <select
                  id="menor-parentesco"
                  value={titularMenorParentesco}
                  onChange={(e) => setTitularMenorParentesco(e.target.value)}
                >
                  <option value="">Selecciona el parentesco…</option>
                  {PARENTESCOS_BENEFICIARIO_MENOR.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field" style={{ marginBottom: "0.6rem" }}>
                <label htmlFor="menor-fecha-nac">
                  Fecha de nacimiento <span style={{ color: "var(--danger, #dc2626)" }}>*</span>
                </label>
                <input
                  id="menor-fecha-nac"
                  type="date"
                  value={titularMenorFechaNacimiento}
                  onChange={(e) => setTitularMenorFechaNacimiento(e.target.value)}
                  max={new Date().toISOString().split("T")[0]}
                  required
                />
              </div>
            </div>

            {edadMenor !== null && (
              <div
                style={{
                  marginTop: "0.25rem",
                  marginBottom: "0.75rem",
                  padding: "0.6rem 0.85rem",
                  borderRadius: "6px",
                  fontSize: "0.85rem",
                  fontWeight: 500,
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  backgroundColor:
                    esMayorDeEdad || esFechaFutura
                      ? "rgba(220, 38, 38, 0.1)"
                      : "rgba(16, 185, 129, 0.12)",
                  color: esMayorDeEdad || esFechaFutura ? "#b91c1c" : "#047857",
                  border: `1px solid ${
                    esMayorDeEdad || esFechaFutura ? "#fca5a5" : "#a7f3d0"
                  }`,
                }}
              >
                {esFechaFutura ? (
                  <span>⚠️ <strong>Fecha inválida:</strong> La fecha de nacimiento no puede ser una fecha futura.</span>
                ) : esMayorDeEdad ? (
                  <span>
                    🚫 <strong>Titular mayor de edad ({edadMenor} años):</strong> No es apto para crear esta cuenta. Las cuentas Infanto Juvenil son exclusivas para menores de 18 años.
                  </span>
                ) : (
                  <span>
                    🎂 <strong>Edad calculada:</strong> {edadMenor} {edadMenor === 1 ? "año" : "años"} (Menor de edad apto para Cuenta Juvenil).
                  </span>
                )}
              </div>
            )}

            <div className="field" style={{ marginBottom: 0 }}>
              <label htmlFor="menor-cui">CUI del menor (RENAP) — opcional</label>
              <input
                id="menor-cui"
                inputMode="numeric"
                value={titularMenorCui}
                onChange={(e) => setTitularMenorCui(formatearDPI(e.target.value.replace(/[^0-9-]/g, "")))}
                maxLength={15}
                placeholder="xxxx-xxxxx-xxxx (CUI de partida)"
                style={{ fontFamily: "monospace", letterSpacing: "0.5px" }}
              />
              <span className="hint">Si aún no tiene CUI emitido, puedes dejarlo en blanco.</span>
            </div>
          </div>
        )}

        <div className="field">
          <label htmlFor="numero">Número de cuenta</label>
          <input id="numero" value={numeroCuenta} onChange={(e) => setNumeroCuenta(e.target.value)} required />
          <span className="hint">Sugerido automáticamente; puedes ajustarlo.</span>
        </div>

        {config.tipo === "AHORRO_SOBRE_PRESTAMO" && (
          <div
            className="field"
            style={{
              background: "rgba(59, 130, 246, 0.08)",
              border: "1px solid rgba(59, 130, 246, 0.25)",
              borderRadius: "8px",
              padding: "0.85rem 1rem",
            }}
          >
            <label htmlFor="prestamo-vinculado" style={{ fontWeight: 700, color: "var(--accent)" }}>
              🛡️ Préstamo vinculado en garantía
            </label>
            {prestamosSocio.length > 0 ? (
              <select
                id="prestamo-vinculado"
                value={prestamoSeleccionadoId}
                onChange={(e) => setPrestamoSeleccionadoId(e.target.value)}
                style={{ width: "100%", padding: "0.5rem", marginTop: "0.4rem" }}
              >
                {prestamosSocio.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.codigo} — {p.tipo} ({p.estado}) · Saldo/Monto: Q{Number(p.saldo_capital || p.monto_aprobado || p.monto_solicitado).toFixed(2)}
                  </option>
                ))}
              </select>
            ) : (
              <p style={{ fontSize: "0.85rem", color: "var(--ink-soft)", margin: "0.4rem 0 0" }}>
                El socio no tiene créditos activos registrados. Esta cuenta actuará como fondo de garantía de crédito general.
              </p>
            )}
            <span className="hint" style={{ marginTop: "0.5rem", display: "block" }}>
              🔒 <strong>Regla estatutaria:</strong> Esta cuenta no permite retiros en ventanilla mientras el crédito esté activo.
              Si el asociado cae en mora o deja de pagar su cuota, la cooperativa podrá debitar de este ahorro para cubrir el saldo adeudado.
            </span>
          </div>
        )}

        {esProgramadoOInfanto && (
          <div className="field">
            <label htmlFor="cuota-pactada">Cuota mensual acordada (Q)</label>
            <input
              id="cuota-pactada"
              type="number"
              min="0"
              step="0.01"
              placeholder="Ej. 100.00"
              value={cuotaPactada}
              onChange={(e) => setCuotaPactada(e.target.value)}
            />
            <span className="hint">
              Monto mensual comprometido por el socio (se reflejará en tiempo real en Auxiliar de Caja).
            </span>
          </div>
        )}

        <div className="field">
          <label htmlFor="saldo">Saldo inicial (si viene de otro registro)</label>
          <input
            id="saldo"
            type="number"
            min="0"
            step="0.01"
            value={saldoInicial}
            onChange={(e) => setSaldoInicial(e.target.value)}
          />
        </div>

        <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.5rem" }}>
          <button
            type="submit"
            className="btn"
            disabled={
              guardando ||
              !agenciaId ||
              Boolean(cuentaExistente) ||
              (saldoAportacion !== null && saldoAportacion < 100) ||
              (config.tipo === "AHORRO_SOBRE_PRESTAMO" && !prestamoSeleccionadoId) ||
              (esInfanto && (
                !titularMenorNombre.trim() ||
                !titularMenorParentesco.trim() ||
                !titularMenorFechaNacimiento ||
                esMayorDeEdad ||
                esFechaFutura
              ))
            }
          >
            {guardando ? "Guardando…" : "Abrir cuenta"}
          </button>
          <button type="button" className="btn secondary" onClick={() => navigate(-1)}>
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
