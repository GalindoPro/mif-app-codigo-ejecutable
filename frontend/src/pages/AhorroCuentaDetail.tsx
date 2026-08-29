import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api, mensajeError } from "../lib/api";
import { formatoQ, TIPOS_AHORRO } from "../types";
import type { CuentaConMovimientos } from "../types";

export default function AhorroCuentaDetail() {
  const { slug, id } = useParams<{ slug: string; id: string }>();
  const config = TIPOS_AHORRO.find((t) => t.slug === slug);
  const navigate = useNavigate();

  const [cuenta, setCuenta] = useState<CuentaConMovimientos | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tipoMov, setTipoMov] = useState<"DEPOSITO" | "RETIRO">("DEPOSITO");
  const [monto, setMonto] = useState("");
  const [fecha, setFecha] = useState(() => new Date().toISOString().slice(0, 10));
  const [numeroRecibo, setNumeroRecibo] = useState("");
  const [guardando, setGuardando] = useState(false);

  function cargar() {
    if (!id) return;
    api
      .get<CuentaConMovimientos>(`/cuentas/${id}`)
      .then(({ data }) => setCuenta(data))
      .catch((err) => setError(mensajeError(err)));
  }

  useEffect(cargar, [id]);

  async function registrarMovimiento(e: FormEvent) {
    e.preventDefault();
    if (!id) return;
    setError(null);
    setGuardando(true);
    try {
      await api.post(`/cuentas/${id}/movimientos`, {
        tipo: tipoMov,
        monto: Number(monto),
        fecha,
        numeroRecibo: numeroRecibo || undefined,
      });
      setMonto("");
      setNumeroRecibo("");
      cargar();
    } catch (err) {
      setError(mensajeError(err));
    } finally {
      setGuardando(false);
    }
  }

  if (!config) return <div className="alert error">Tipo de ahorro no reconocido.</div>;
  if (error && !cuenta) return <div className="alert error">{error}</div>;
  if (!cuenta) return <p>Cargando…</p>;

  return (
    <div>
      <div className="page-head">
        <div>
          <button className="link-btn" onClick={() => navigate(`/ahorros/${config.slug}`)} style={{ marginBottom: "0.5rem" }}>
            ← Volver a {config.titulo}
          </button>
          <h1>{cuenta.socio_nombres}</h1>
          <p>
            <span className="mono">{cuenta.numero_cuenta}</span> · {config.titulo}
          </p>
        </div>
        <div className="stat-card accent" style={{ minWidth: 180 }}>
          <span className="label">Saldo actual</span>
          <span className="value">{formatoQ(cuenta.saldo_actual)}</span>
        </div>
      </div>

      {error && <div className="alert error">{error}</div>}

      <form className="movs-form" onSubmit={registrarMovimiento}>
        <div className="tipo-toggle">
          <button
            type="button"
            className={tipoMov === "DEPOSITO" ? "on deposito" : ""}
            onClick={() => setTipoMov("DEPOSITO")}
          >
            Depósito
          </button>
          <button type="button" className={tipoMov === "RETIRO" ? "on retiro" : ""} onClick={() => setTipoMov("RETIRO")}>
            Retiro
          </button>
        </div>
        <div className="field">
          <label htmlFor="mov-monto">Monto</label>
          <input
            id="mov-monto"
            type="number"
            min="0.01"
            step="0.01"
            value={monto}
            onChange={(e) => setMonto(e.target.value)}
            required
          />
        </div>
        <div className="field">
          <label htmlFor="mov-fecha">Fecha</label>
          <input id="mov-fecha" type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} required />
        </div>
        <div className="field grow">
          <label htmlFor="mov-recibo">No. de recibo</label>
          <input id="mov-recibo" value={numeroRecibo} onChange={(e) => setNumeroRecibo(e.target.value)} />
        </div>
        <button type="submit" className="btn" disabled={guardando}>
          {guardando ? "Guardando…" : "Registrar"}
        </button>
      </form>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Tipo</th>
              <th>Monto</th>
              <th>Recibo</th>
              <th>Registrado por</th>
            </tr>
          </thead>
          <tbody>
            {cuenta.movimientos.map((m) => (
              <tr key={m.id}>
                <td className="mono">{new Date(m.fecha).toLocaleDateString("es-GT")}</td>
                <td>{m.tipo === "DEPOSITO" ? "Depósito" : m.tipo === "RETIRO" ? "Retiro" : "Ajuste"}</td>
                <td className={`mono movimiento-monto ${m.tipo === "RETIRO" ? "retiro" : "deposito"}`}>
                  {m.tipo === "RETIRO" ? "−" : "+"} {formatoQ(m.monto)}
                </td>
                <td className="mono">{m.numero_recibo ?? "—"}</td>
                <td>{m.usuario_nombre}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {cuenta.movimientos.length === 0 && <div className="empty">Todavía no hay movimientos en esta cuenta.</div>}
      </div>

      <p style={{ marginTop: "1.5rem" }}>
        <Link to={`/socios/${cuenta.socio_id}`}>Ver ficha completa del socio →</Link>
      </p>
    </div>
  );
}
