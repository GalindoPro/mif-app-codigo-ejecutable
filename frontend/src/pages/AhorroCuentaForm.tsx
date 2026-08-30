import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api, mensajeError } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { TIPOS_AHORRO } from "../types";
import type { Agencia, Socio } from "../types";
import BuscadorSocio from "../components/BuscadorSocio";

export default function AhorroCuentaForm() {
  const { slug } = useParams<{ slug: string }>();
  const config = TIPOS_AHORRO.find((t) => t.slug === slug);
  const { usuario } = useAuth();
  const navigate = useNavigate();
  const puedeElegirAgencia = usuario?.rol === "ADMIN" || usuario?.rol === "GERENCIA";

  const [agencias, setAgencias] = useState<Agencia[]>([]);
  const [agenciaId, setAgenciaId] = useState(usuario?.agenciaId ?? "");
  const [socio, setSocio] = useState<Socio | null>(null);
  const [numeroCuenta, setNumeroCuenta] = useState("");
  const [saldoInicial, setSaldoInicial] = useState("0");
  const [cuotaPactada, setCuotaPactada] = useState("");
  const [observacionesApertura, setObservacionesApertura] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [cuentaExistente, setCuentaExistente] = useState<{ id: string; numero_cuenta: string } | null>(null);

  const esProgramadoOInfanto =
    config?.tipo === "AHORRO_PROGRAMADO" || config?.tipo === "AHORRO_INFANTO_JUVENIL";

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
      return;
    }
    api
      .get<{ cuentas: Array<{ id: string; numero_cuenta: string; tipo: string; estado: string }> }>(`/socios/${socio.id}`)
      .then(({ data }) => {
        const encontrada = data.cuentas?.find((c) => c.tipo === config.tipo && c.estado === "ACTIVA");
        setCuentaExistente(encontrada ? { id: encontrada.id, numero_cuenta: encontrada.numero_cuenta } : null);
      })
      .catch(() => setCuentaExistente(null));
  }, [socio, config]);

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
        observacionesApertura: observacionesApertura || undefined,
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
        </div>

        <div className="field">
          <label htmlFor="numero">Número de cuenta</label>
          <input id="numero" value={numeroCuenta} onChange={(e) => setNumeroCuenta(e.target.value)} required />
          <span className="hint">Sugerido automáticamente; puedes ajustarlo.</span>
        </div>

        {esProgramadoOInfanto && (
          <div className="field">
            <label htmlFor="cuota-pactada">Cuota periódica acordada (Q)</label>
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
              Monto periódico comprometido por el socio (se reflejará en tiempo real en Auxiliar de Caja).
            </span>
          </div>
        )}

        <div className="field">
          <label htmlFor="obs-apertura">
            {usuario?.rol === "PROMOTOR" ? "Justificación de apertura en campo" : "Observaciones de apertura"}
          </label>
          <input
            id="obs-apertura"
            placeholder="Ej. Apertura en visita de campo comunidad Ilom, cuota pactada Q100"
            value={observacionesApertura}
            onChange={(e) => setObservacionesApertura(e.target.value)}
          />
          <span className="hint">
            Visible inmediatamente para el Auxiliar de Caja para no duplicar movimientos.
          </span>
        </div>

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
          <button type="submit" className="btn" disabled={guardando || !agenciaId || Boolean(cuentaExistente)}>
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
