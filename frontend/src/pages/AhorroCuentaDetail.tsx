import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api, mensajeError } from "../lib/api";
import { formatoQ, TIPOS_AHORRO } from "../types";
import type { CuentaConMovimientos } from "../types";
import { calcularEdad } from "../lib/formatters";

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
          <button
            className="link-btn"
            onClick={() => navigate(config.tipo === "APORTACION" ? "/aportaciones" : `/ahorros/${config.slug}`)}
            style={{ marginBottom: "0.5rem" }}
          >
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

      {cuenta.tipo === "AHORRO_INFANTO_JUVENIL" && (
        <div
          style={{
            background: "rgba(14, 165, 233, 0.08)",
            border: "1px solid rgba(14, 165, 233, 0.3)",
            borderRadius: "8px",
            padding: "0.85rem 1rem",
            marginBottom: "1.25rem",
            color: "#075985",
          }}
        >
          <div style={{ fontWeight: 700, display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span>🧒</span> Menor titular de la cuenta
          </div>
          {cuenta.titular_menor_nombre ? (
            <p style={{ fontSize: "0.84rem", margin: "0.35rem 0 0", lineHeight: 1.4 }}>
              <strong>{cuenta.titular_menor_nombre}</strong>
              {cuenta.titular_menor_parentesco ? ` · ${cuenta.titular_menor_parentesco} de ${cuenta.socio_nombres}` : ""}
              {cuenta.titular_menor_fecha_nacimiento ? (
                <>
                  {` · Nacimiento: ${new Date(
                    cuenta.titular_menor_fecha_nacimiento + "T00:00:00"
                  ).toLocaleDateString("es-GT")}`}
                  {calcularEdad(cuenta.titular_menor_fecha_nacimiento) !== null && (
                    <span style={{ marginLeft: "4px", color: "#0369a1", fontWeight: 600 }}>
                      ({calcularEdad(cuenta.titular_menor_fecha_nacimiento)} años)
                    </span>
                  )}
                </>
              ) : ""}
              {cuenta.titular_menor_cui ? ` · CUI: ${cuenta.titular_menor_cui}` : ""}
            </p>
          ) : (
            <p style={{ fontSize: "0.84rem", margin: "0.35rem 0 0", lineHeight: 1.4 }}>
              Esta cuenta no tiene registrados los datos del menor. {cuenta.socio_nombres} figura solo como responsable/tutor.
            </p>
          )}
        </div>
      )}

      {cuenta.tipo === "AHORRO_SOBRE_PRESTAMO" && (
        <div
          style={{
            background: cuenta.prestamo_estado === "CANCELADO" ? "#ecfdf5" : "rgba(245, 158, 11, 0.1)",
            border: `1px solid ${cuenta.prestamo_estado === "CANCELADO" ? "#10b981" : "#f59e0b"}`,
            borderRadius: "8px",
            padding: "0.85rem 1rem",
            marginBottom: "1.25rem",
            color: cuenta.prestamo_estado === "CANCELADO" ? "#065f46" : "#92400e",
          }}
        >
          <div style={{ fontWeight: 700, display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span>🛡️</span> Cuenta de Ahorro sobre Préstamo (Fondo en Garantía)
            {cuenta.prestamo_codigo && (
              <span className="mono" style={{ background: "rgba(0,0,0,0.06)", padding: "0.15rem 0.4rem", borderRadius: "4px" }}>
                Crédito: {cuenta.prestamo_codigo} ({cuenta.prestamo_estado})
              </span>
            )}
          </div>
          <p style={{ fontSize: "0.84rem", margin: "0.35rem 0 0", lineHeight: 1.4 }}>
            {cuenta.prestamo_estado === "CANCELADO"
              ? "✓ El crédito vinculado ha sido cancelado en su totalidad. Los retiros y liquidaciones de esta cuenta han sido habilitados."
              : "🔒 Por política estatutaria, los fondos de esta cuenta están en garantía de crédito activo y NO se pueden retirar hasta su liquidación total. Ante mora o atraso, la cooperativa puede aplicar débitos para cubrir cuotas."}
          </p>
        </div>
      )}

      {error && <div className="alert error">{error}</div>}

      {(() => {
        const retiroBloqueado = Boolean(
          cuenta.tipo === "AHORRO_SOBRE_PRESTAMO" &&
          cuenta.prestamo_estado &&
          cuenta.prestamo_estado !== "CANCELADO" &&
          cuenta.prestamo_estado !== "RECHAZADO" &&
          tipoMov === "RETIRO"
        );
        return (
          <form className="movs-form" onSubmit={registrarMovimiento}>
            <div className="tipo-toggle">
              <button
                type="button"
                className={tipoMov === "DEPOSITO" ? "on deposito" : ""}
                onClick={() => setTipoMov("DEPOSITO")}
              >
                Depósito
              </button>
              <button
                type="button"
                className={tipoMov === "RETIRO" ? "on retiro" : ""}
                onClick={() => setTipoMov("RETIRO")}
              >
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
            <button type="submit" className="btn" disabled={guardando || retiroBloqueado}>
              {guardando ? "Guardando…" : retiroBloqueado ? "Retiro bloqueado (crédito activo)" : "Registrar"}
            </button>
          </form>
        );
      })()}

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
