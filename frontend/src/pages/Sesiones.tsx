import { useEffect, useState } from "react";
import { api, mensajeError } from "../lib/api";
import { useAuth } from "../context/AuthContext";

interface Sesion {
  jti: string;
  usuario_id: string;
  usuario_nombre: string;
  usuario_rol: string;
  ip: string | null;
  user_agent: string | null;
  activa: boolean;
  created_at: string;
  expires_at: string;
  revocada_at: string | null;
  revocada_por_nombre: string | null;
}

function parsearNavegador(ua: string | null): string {
  if (!ua) return "Desconocido";
  if (ua.includes("Chrome")) return "Chrome";
  if (ua.includes("Firefox")) return "Firefox";
  if (ua.includes("Safari")) return "Safari";
  if (ua.includes("Edge")) return "Edge";
  return ua.slice(0, 40);
}

export default function Sesiones() {
  const { usuario } = useAuth();
  const [sesiones, setSesiones] = useState<Sesion[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [exito, setExito] = useState<string | null>(null);
  const [revocando, setRevocando] = useState<string | null>(null);
  const esAdmin = usuario?.rol === "ADMIN" || usuario?.rol === "GERENCIA";

  function cargar() {
    api.get<Sesion[]>("/auth/sesiones")
      .then(({ data }) => setSesiones(data))
      .catch((err) => setError(mensajeError(err)));
  }

  useEffect(cargar, []);

  async function revocarSesion(jti: string) {
    setRevocando(jti);
    setError(null);
    try {
      await api.delete(`/auth/sesiones/${jti}`);
      setExito("Sesión revocada correctamente.");
      setTimeout(() => setExito(null), 4000);
      cargar();
    } catch (err) {
      setError(mensajeError(err));
    } finally {
      setRevocando(null);
    }
  }

  async function revocarTodas() {
    if (!window.confirm("¿Revocar todas las demás sesiones activas? Esta acción cerrará la sesión en todos los otros dispositivos.")) return;
    setError(null);
    try {
      const { data } = await api.post<{ revocadas: number }>("/auth/sesiones/revocar-todas");
      setExito(`${data.revocadas} sesione(s) revocadas correctamente.`);
      setTimeout(() => setExito(null), 5000);
      cargar();
    } catch (err) {
      setError(mensajeError(err));
    }
  }

  const activas = sesiones.filter((s) => s.activa);
  const inactivas = sesiones.filter((s) => !s.activa);

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Sesiones Activas</h1>
          <p>{esAdmin ? "Gestión de sesiones del sistema. Puedes revocar accesos de cualquier usuario." : "Tus sesiones activas. Cierra cualquier sesión que no reconozcas."}</p>
        </div>
        {activas.length > 1 && (
          <button className="btn secondary" style={{ borderColor: "#dc2626", color: "#dc2626" }} onClick={revocarTodas}>
            Cerrar otras sesiones ({activas.length - 1})
          </button>
        )}
      </div>

      {error && <div className="alert error">{error}</div>}
      {exito && <div className="alert success">{exito}</div>}

      <h3 style={{ fontSize: "0.95rem", marginBottom: "0.75rem" }}>
        Sesiones activas ({activas.length})
      </h3>

      <div className="table-wrap">
        <table style={{ fontSize: "0.84rem" }}>
          <thead>
            <tr>
              {esAdmin && <th>Usuario</th>}
              <th>Navegador / Dispositivo</th>
              <th>IP</th>
              <th>Inicio de sesión</th>
              <th>Expira</th>
              <th style={{ textAlign: "center" }}>Acción</th>
            </tr>
          </thead>
          <tbody>
            {activas.map((s) => {
              const esPropia = s.usuario_id === usuario?.id;
              return (
                <tr key={s.jti} style={{ background: esPropia ? "rgba(16,185,129,0.04)" : undefined }}>
                  {esAdmin && (
                    <td>
                      <div style={{ fontWeight: 600 }}>{s.usuario_nombre}</div>
                      <div style={{ fontSize: "0.72rem", color: "var(--ink-soft)" }}>{s.usuario_rol}</div>
                    </td>
                  )}
                  <td>
                    <div style={{ fontWeight: 600 }}>{parsearNavegador(s.user_agent)}</div>
                    {esPropia && <span style={{ fontSize: "0.72rem", color: "#10b981", fontWeight: 700 }}>✓ Sesión actual</span>}
                  </td>
                  <td className="mono" style={{ fontSize: "0.79rem" }}>{s.ip ?? "—"}</td>
                  <td className="mono" style={{ fontSize: "0.79rem" }}>
                    {new Date(s.created_at).toLocaleString("es-GT", { dateStyle: "short", timeStyle: "short" })}
                  </td>
                  <td className="mono" style={{ fontSize: "0.79rem" }}>
                    {new Date(s.expires_at).toLocaleString("es-GT", { dateStyle: "short", timeStyle: "short" })}
                  </td>
                  <td style={{ textAlign: "center" }}>
                    {!esPropia && (
                      <button
                        className="btn secondary"
                        style={{ fontSize: "0.75rem", padding: "0.2rem 0.5rem", borderColor: "#dc2626", color: "#dc2626" }}
                        disabled={revocando === s.jti}
                        onClick={() => revocarSesion(s.jti)}
                      >
                        {revocando === s.jti ? "Revocando…" : "Revocar"}
                      </button>
                    )}
                    {esPropia && <span style={{ fontSize: "0.75rem", color: "#10b981" }}>Activa</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {activas.length === 0 && <div className="empty">No hay sesiones activas registradas.</div>}
      </div>

      {inactivas.length > 0 && (
        <>
          <h3 style={{ fontSize: "0.95rem", margin: "1.5rem 0 0.75rem", color: "var(--ink-soft)" }}>
            Historial de sesiones ({inactivas.length})
          </h3>
          <div className="table-wrap">
            <table style={{ fontSize: "0.82rem" }}>
              <thead>
                <tr>
                  {esAdmin && <th>Usuario</th>}
                  <th>Navegador</th>
                  <th>IP</th>
                  <th>Inicio</th>
                  <th>Revocada</th>
                  <th>Revocada por</th>
                </tr>
              </thead>
              <tbody>
                {inactivas.slice(0, 20).map((s) => (
                  <tr key={s.jti} style={{ opacity: 0.6 }}>
                    {esAdmin && <td>{s.usuario_nombre}</td>}
                    <td>{parsearNavegador(s.user_agent)}</td>
                    <td className="mono" style={{ fontSize: "0.79rem" }}>{s.ip ?? "—"}</td>
                    <td className="mono" style={{ fontSize: "0.79rem" }}>
                      {new Date(s.created_at).toLocaleString("es-GT", { dateStyle: "short", timeStyle: "short" })}
                    </td>
                    <td className="mono" style={{ fontSize: "0.79rem" }}>
                      {s.revocada_at ? new Date(s.revocada_at).toLocaleString("es-GT", { dateStyle: "short", timeStyle: "short" }) : "Expirada"}
                    </td>
                    <td style={{ fontSize: "0.79rem" }}>{s.revocada_por_nombre ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
