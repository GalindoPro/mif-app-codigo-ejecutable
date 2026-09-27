import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import type { Traslado, Agencia, Socio } from "../types";

interface EstadisticasTraslados {
  pendientes: string;
  aprobados: string;
  rechazados: string;
  total: string;
}

export default function TrasladosInterAgencia() {
  const { usuario } = useAuth();
  const [traslados, setTraslados] = useState<Traslado[]>([]);
  const [stats, setStats] = useState<EstadisticasTraslados | null>(null);
  const [agencias, setAgencias] = useState<Agencia[]>([]);
  const [cargando, setCargando] = useState(true);
  const [filtroEstado, setFiltroEstado] = useState<string>("TODOS");
  const [busqueda, setBusqueda] = useState("");

  // Modal nueva solicitud
  const [mostrarModal, setMostrarModal] = useState(false);
  const [sociosBusqueda, setSociosBusqueda] = useState<Socio[]>([]);
  const [busquedaSocio, setBusquedaSocio] = useState("");
  const [socioSeleccionado, setSocioSeleccionado] = useState<Socio | null>(null);
  const [agenciaDestino, setAgenciaDestino] = useState("");
  const [motivo, setMotivo] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [avisos, setAvisos] = useState<string[]>([]);

  // Modal resolución
  const [trasladoResolucion, setTrasladoResolucion] = useState<Traslado | null>(null);
  const [accionResolucion, setAccionResolucion] = useState<"APROBAR" | "RECHAZAR" | null>(null);
  const [notasAdmin, setNotasAdmin] = useState("");
  const [resolviendo, setResolviendo] = useState(false);

  const puedeAprobar = ["GERENCIA", "ADMIN", "SUPERVISOR"].includes(usuario?.rol ?? "");
  const puedeSolicitar = !["GERENCIA", "ADMIN"].includes(usuario?.rol ?? "") || true;

  const cargarDatos = async () => {
    setCargando(true);
    try {
      const [tRes, sRes, aRes] = await Promise.all([
        api.get<Traslado[]>("/traslados"),
        api.get<EstadisticasTraslados>("/traslados/estadisticas"),
        api.get<Agencia[]>("/agencias"),
      ]);
      setTraslados(tRes.data);
      setStats(sRes.data);
      setAgencias(aRes.data.filter(a => a.activa));
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => { cargarDatos(); }, []);

  // Búsqueda de socios para nueva solicitud
  useEffect(() => {
    if (busquedaSocio.length < 3) { setSociosBusqueda([]); return; }
    const timer = setTimeout(async () => {
      try {
        const { data } = await api.get<{ socios: Socio[] }>("/socios", {
          params: { q: busquedaSocio, limit: 8 }
        });
        setSociosBusqueda(data.socios ?? []);
      } catch { setSociosBusqueda([]); }
    }, 350);
    return () => clearTimeout(timer);
  }, [busquedaSocio]);

  const trasladosFiltrados = traslados.filter(t => {
    const matchEstado = filtroEstado === "TODOS" || t.estado === filtroEstado;
    const q = busqueda.toLowerCase();
    const matchBusqueda = !q ||
      t.socio_nombre.toLowerCase().includes(q) ||
      t.numero_asociado.toLowerCase().includes(q) ||
      t.agencia_origen_nombre.toLowerCase().includes(q) ||
      t.agencia_destino_nombre.toLowerCase().includes(q);
    return matchEstado && matchBusqueda;
  });

  async function enviarSolicitud() {
    if (!socioSeleccionado || !agenciaDestino || !motivo.trim()) return;
    setEnviando(true);
    try {
      const { data } = await api.post("/traslados", {
        socio_id: socioSeleccionado.id,
        agencia_destino_id: agenciaDestino,
        motivo: motivo.trim(),
      });
      setAvisos(data.avisos ?? []);
      if ((data.avisos ?? []).length === 0) {
        setMostrarModal(false);
        resetFormulario();
        cargarDatos();
      } else {
        await cargarDatos();
      }
    } catch (e: any) {
      alert(e.response?.data?.error ?? "Error al solicitar traslado");
    } finally {
      setEnviando(false);
    }
  }

  async function resolverTraslado() {
    if (!trasladoResolucion || !accionResolucion) return;
    if (accionResolucion === "RECHAZAR" && !notasAdmin.trim()) {
      alert("Debe indicar el motivo del rechazo.");
      return;
    }
    setResolviendo(true);
    try {
      const endpoint = accionResolucion === "APROBAR" ? "aprobar" : "rechazar";
      await api.patch(`/traslados/${trasladoResolucion.id}/${endpoint}`, {
        notas_admin: notasAdmin.trim() || undefined,
      });
      setTrasladoResolucion(null);
      setAccionResolucion(null);
      setNotasAdmin("");
      cargarDatos();
    } catch (e: any) {
      alert(e.response?.data?.error ?? "Error al procesar traslado");
    } finally {
      setResolviendo(false);
    }
  }

  function resetFormulario() {
    setSocioSeleccionado(null);
    setBusquedaSocio("");
    setSociosBusqueda([]);
    setAgenciaDestino("");
    setMotivo("");
    setAvisos([]);
  }

  const badgeEstado = (estado: string) => {
    if (estado === "PENDIENTE") return <span className="badge info">⏳ Pendiente</span>;
    if (estado === "APROBADO") return <span className="badge activo">✅ Aprobado</span>;
    return <span className="badge danger">❌ Rechazado</span>;
  };

  return (
    <div className="screen-container">
      {/* KPIs */}
      <div className="screen-kpi-row">
        <div className="screen-kpi-tile" style={{ borderColor: "#f59e0b" }}>
          <span className="screen-kpi-label">⏳ Pendientes</span>
          <span className="screen-kpi-value" style={{ color: "#f59e0b" }}>
            {stats?.pendientes ?? 0}
          </span>
        </div>
        <div className="screen-kpi-tile" style={{ borderColor: "#10b981" }}>
          <span className="screen-kpi-label">✅ Aprobados</span>
          <span className="screen-kpi-value" style={{ color: "#10b981" }}>
            {stats?.aprobados ?? 0}
          </span>
        </div>
        <div className="screen-kpi-tile" style={{ borderColor: "#ef4444" }}>
          <span className="screen-kpi-label">❌ Rechazados</span>
          <span className="screen-kpi-value" style={{ color: "#ef4444" }}>
            {stats?.rechazados ?? 0}
          </span>
        </div>
        <div className="screen-kpi-tile" style={{ borderColor: "#6366f1" }}>
          <span className="screen-kpi-label">📋 Total</span>
          <span className="screen-kpi-value" style={{ color: "#6366f1" }}>
            {stats?.total ?? 0}
          </span>
        </div>
      </div>

      {/* Cabecera y controles */}
      <div className="screen-header" style={{ gap: "0.75rem", flexWrap: "wrap" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: "1.1rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
            🔀 Traslados Inter-Agencia
          </h1>
          <p className="sub" style={{ margin: 0, fontSize: "0.78rem" }}>
            Solicitudes de traslado de asociados entre agencias
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap", marginLeft: "auto" }}>
          <input
            className="input"
            placeholder="🔍 Buscar asociado, agencia..."
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            style={{ minWidth: 220, fontSize: "0.85rem" }}
          />
          <div style={{ display: "flex", gap: "0.3rem" }}>
            {["TODOS", "PENDIENTE", "APROBADO", "RECHAZADO"].map(e => (
              <button
                key={e}
                className={`btn btn-xs${filtroEstado === e ? "" : " secondary"}`}
                onClick={() => setFiltroEstado(e)}
                style={{ fontSize: "0.75rem" }}
              >
                {e === "TODOS" ? "Todos" : e === "PENDIENTE" ? "⏳ Pendiente" : e === "APROBADO" ? "✅ Aprobado" : "❌ Rechazado"}
              </button>
            ))}
          </div>
          {puedeSolicitar && (
            <button className="btn" onClick={() => { setMostrarModal(true); resetFormulario(); }}>
              ➕ Nueva Solicitud
            </button>
          )}
        </div>
      </div>

      {/* Tabla */}
      <div className="table-scroll-container">
        {cargando ? (
          <p style={{ padding: "2rem", textAlign: "center", color: "var(--ink-soft)" }}>Cargando traslados…</p>
        ) : trasladosFiltrados.length === 0 ? (
          <div className="alert info" style={{ margin: "1rem" }}>
            {filtroEstado === "PENDIENTE"
              ? "🎉 No hay solicitudes de traslado pendientes."
              : "No se encontraron solicitudes con esos filtros."}
          </div>
        ) : (
          <table className="table-compact">
            <thead>
              <tr>
                <th>Asociado</th>
                <th>Agencia Origen</th>
                <th>→ Destino</th>
                <th>Estado</th>
                <th>Solicitud</th>
                <th>Solicitó</th>
                <th>Alertas</th>
                {puedeAprobar && <th style={{ textAlign: "center" }}>Acciones</th>}
              </tr>
            </thead>
            <tbody>
              {trasladosFiltrados.map(t => (
                <tr key={t.id}>
                  <td>
                    <div style={{ fontWeight: 600, fontSize: "0.85rem" }}>{t.socio_nombre}</div>
                    <div className="mono sub" style={{ fontSize: "0.72rem" }}>{t.numero_asociado}</div>
                    {t.socio_dpi && <div className="sub" style={{ fontSize: "0.70rem" }}>DPI: {t.socio_dpi}</div>}
                  </td>
                  <td>
                    <span className="badge info" style={{ fontSize: "0.73rem" }}>{t.agencia_origen_codigo}</span>
                    <div className="sub" style={{ fontSize: "0.72rem" }}>{t.agencia_origen_nombre}</div>
                  </td>
                  <td>
                    <span className="badge activo" style={{ fontSize: "0.73rem" }}>{t.agencia_destino_codigo}</span>
                    <div className="sub" style={{ fontSize: "0.72rem" }}>{t.agencia_destino_nombre}</div>
                  </td>
                  <td>{badgeEstado(t.estado)}</td>
                  <td className="mono" style={{ fontSize: "0.78rem" }}>
                    {new Date(t.fecha_solicitud).toLocaleDateString("es-GT")}
                    {t.fecha_resolucion && (
                      <div className="sub" style={{ fontSize: "0.70rem" }}>
                        Res: {new Date(t.fecha_resolucion).toLocaleDateString("es-GT")}
                      </div>
                    )}
                  </td>
                  <td style={{ fontSize: "0.78rem" }}>
                    {t.solicitado_por_nombre}
                    <div className="sub" style={{ fontSize: "0.70rem" }}>[{t.solicitado_por_rol}]</div>
                  </td>
                  <td style={{ fontSize: "0.75rem" }}>
                    {t.tiene_credito_activo && (
                      <div style={{ color: "#f59e0b" }}>⚠️ Crédito activo</div>
                    )}
                    {t.tiene_saldo_ahorro && (
                      <div style={{ color: "#6366f1" }}>💰 Tiene saldo</div>
                    )}
                    {t.notas_admin && (
                      <div className="sub" title={t.notas_admin} style={{ fontSize: "0.70rem", maxWidth: 140, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        📝 {t.notas_admin}
                      </div>
                    )}
                  </td>
                  {puedeAprobar && (
                    <td style={{ textAlign: "center" }}>
                      {t.estado === "PENDIENTE" ? (
                        <div style={{ display: "flex", gap: "0.25rem", justifyContent: "center" }}>
                          <button
                            className="btn btn-xs"
                            style={{ background: "#10b981", borderColor: "#10b981", color: "#fff" }}
                            onClick={() => { setTrasladoResolucion(t); setAccionResolucion("APROBAR"); setNotasAdmin(""); }}
                          >
                            ✅ Aprobar
                          </button>
                          <button
                            className="btn btn-xs secondary"
                            style={{ borderColor: "#ef4444", color: "#ef4444" }}
                            onClick={() => { setTrasladoResolucion(t); setAccionResolucion("RECHAZAR"); setNotasAdmin(""); }}
                          >
                            ❌ Rechazar
                          </button>
                        </div>
                      ) : (
                        <span className="sub" style={{ fontSize: "0.73rem" }}>
                          {t.aprobado_por_nombre ?? "—"}
                        </span>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ====== MODAL NUEVA SOLICITUD ====== */}
      {mostrarModal && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(15,23,42,0.72)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 9990, padding: "1rem" }}>
          <div className="modal-content" style={{ maxWidth: 560, width: "100%", maxHeight: "88vh", overflowY: "auto", background: "var(--paper-raised)", padding: "1.35rem 1.5rem", borderRadius: 14, boxShadow: "0 25px 50px -12px rgba(15,23,42,0.35)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", borderBottom: "1px solid var(--line)", paddingBottom: "0.65rem" }}>
              <h2 style={{ margin: 0, fontSize: "1rem" }}>🔀 Nueva Solicitud de Traslado</h2>
              <button className="btn secondary" onClick={() => { setMostrarModal(false); resetFormulario(); }}>✕</button>
            </div>

            {avisos.length > 0 && (
              <div style={{ marginBottom: "1rem" }}>
                {avisos.map((a, i) => (
                  <div key={i} className="alert info" style={{ marginBottom: "0.5rem", fontSize: "0.83rem" }}>{a}</div>
                ))}
                <button className="btn" onClick={() => { setMostrarModal(false); resetFormulario(); cargarDatos(); }}>
                  ✓ Entendido — Ver Solicitudes
                </button>
              </div>
            )}

            {avisos.length === 0 && (
              <>
                {/* Búsqueda de socio */}
                <div className="form-group">
                  <label className="label">Buscar Asociado</label>
                  <input
                    className="input"
                    placeholder="Escriba nombre o número de asociado..."
                    value={busquedaSocio}
                    onChange={e => { setBusquedaSocio(e.target.value); setSocioSeleccionado(null); }}
                  />
                  {sociosBusqueda.length > 0 && !socioSeleccionado && (
                    <div style={{ border: "1px solid var(--line)", borderRadius: 8, marginTop: 4, background: "var(--paper-raised)", maxHeight: 180, overflowY: "auto" }}>
                      {sociosBusqueda.map(s => (
                        <div
                          key={s.id}
                          style={{ padding: "0.5rem 0.75rem", cursor: "pointer", borderBottom: "1px solid var(--line)", fontSize: "0.83rem" }}
                          onClick={() => { setSocioSeleccionado(s); setBusquedaSocio(s.nombres); setSociosBusqueda([]); }}
                        >
                          <strong>{s.nombres}</strong>
                          <span className="sub" style={{ marginLeft: 8 }}>{s.numero_asociado}</span>
                          <span className="sub" style={{ marginLeft: 8, fontSize: "0.73rem" }}>— {s.agencia_nombre ?? s.agencia_id}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {socioSeleccionado && (
                    <div className="alert info" style={{ marginTop: 6, fontSize: "0.83rem" }}>
                      ✅ <strong>{socioSeleccionado.nombres}</strong> · {socioSeleccionado.numero_asociado} · Agencia: {socioSeleccionado.agencia_nombre ?? "—"}
                    </div>
                  )}
                </div>

                {/* Agencia destino */}
                <div className="form-group">
                  <label className="label">Agencia Destino</label>
                  <select
                    className="input"
                    value={agenciaDestino}
                    onChange={e => setAgenciaDestino(e.target.value)}
                  >
                    <option value="">— Seleccione la agencia destino —</option>
                    {agencias
                      .filter(a => !socioSeleccionado || a.id !== socioSeleccionado.agencia_id)
                      .map(a => (
                        <option key={a.id} value={a.id}>{a.nombre} ({a.codigo})</option>
                      ))
                    }
                  </select>
                </div>

                {/* Motivo */}
                <div className="form-group">
                  <label className="label">Motivo del Traslado</label>
                  <textarea
                    className="input"
                    rows={3}
                    placeholder="Ej: El asociado cambió su residencia a la comunidad de Nebaj y solicita continuar sus operaciones en la agencia más cercana."
                    value={motivo}
                    onChange={e => setMotivo(e.target.value)}
                    style={{ resize: "vertical" }}
                  />
                </div>

                <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
                  <button className="btn secondary" onClick={() => { setMostrarModal(false); resetFormulario(); }}>
                    Cancelar
                  </button>
                  <button
                    className="btn"
                    disabled={!socioSeleccionado || !agenciaDestino || !motivo.trim() || enviando}
                    onClick={enviarSolicitud}
                  >
                    {enviando ? "Enviando…" : "📤 Enviar Solicitud"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ====== MODAL RESOLUCIÓN (APROBAR/RECHAZAR) ====== */}
      {trasladoResolucion && accionResolucion && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(15,23,42,0.72)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 9990, padding: "1rem" }}>
          <div className="modal-content" style={{ maxWidth: 480, width: "100%", background: "var(--paper-raised)", padding: "1.35rem 1.5rem", borderRadius: 14, boxShadow: "0 25px 50px -12px rgba(15,23,42,0.35)" }}>
            <h2 style={{ margin: "0 0 1rem", fontSize: "1rem" }}>
              {accionResolucion === "APROBAR" ? "✅ Aprobar Traslado" : "❌ Rechazar Traslado"}
            </h2>

            <div style={{ background: "var(--paper)", borderRadius: 8, padding: "0.75rem", marginBottom: "1rem", fontSize: "0.85rem" }}>
              <div><strong>{trasladoResolucion.socio_nombre}</strong> · {trasladoResolucion.numero_asociado}</div>
              <div className="sub" style={{ marginTop: 4 }}>
                {trasladoResolucion.agencia_origen_nombre} → {trasladoResolucion.agencia_destino_nombre}
              </div>
              <div className="sub" style={{ marginTop: 4 }}>Motivo: {trasladoResolucion.motivo}</div>
              {trasladoResolucion.tiene_credito_activo && (
                <div style={{ color: "#f59e0b", marginTop: 6, fontWeight: 600 }}>
                  ⚠️ El socio tiene un crédito activo — verifique que esté cancelado antes de aprobar.
                </div>
              )}
            </div>

            <div className="form-group">
              <label className="label">
                {accionResolucion === "APROBAR" ? "Notas (opcional)" : "Motivo del rechazo *"}
              </label>
              <textarea
                className="input"
                rows={3}
                placeholder={accionResolucion === "APROBAR"
                  ? "Observaciones adicionales para el expediente..."
                  : "Indique la razón del rechazo..."}
                value={notasAdmin}
                onChange={e => setNotasAdmin(e.target.value)}
                style={{ resize: "vertical" }}
              />
            </div>

            <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
              <button className="btn secondary" onClick={() => { setTrasladoResolucion(null); setAccionResolucion(null); }}>
                Cancelar
              </button>
              <button
                className="btn"
                disabled={resolviendo || (accionResolucion === "RECHAZAR" && !notasAdmin.trim())}
                style={accionResolucion === "APROBAR"
                  ? { background: "#10b981", borderColor: "#10b981" }
                  : { background: "#ef4444", borderColor: "#ef4444" }}
                onClick={resolverTraslado}
              >
                {resolviendo ? "Procesando…" : accionResolucion === "APROBAR" ? "✅ Confirmar Aprobación" : "❌ Confirmar Rechazo"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
