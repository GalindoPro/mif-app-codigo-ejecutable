import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import { formatearQuetzales } from "../../lib/formatters";
import type { DetalleCajaAuxiliar } from "../../types";
import ActaArqueoModal from "./ActaArqueoModal";

export interface HistorialCajasModalProps {
  agenciaId: string;
  agenciaNombre: string;
  onCerrar: () => void;
}

export default function HistorialCajasModal({
  agenciaId,
  agenciaNombre,
  onCerrar,
}: HistorialCajasModalProps) {
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
                      <span className={`badge ${d.estado === "ABIERTO" ? "activo" : "inactivo"}`}>
                        {d.estado === "ABIERTO" ? "🟢 Abierto" : "🔒 Cerrado"}
                      </span>
                    </td>
                    <td className="mono">{formatearQuetzales(d.saldo_inicial)}</td>
                    <td className="mono" style={{ color: "#16a34a" }}>{formatearQuetzales(d.total_ingresos)}</td>
                    <td className="mono" style={{ color: "#dc2626" }}>{formatearQuetzales(d.total_egresos)}</td>
                    <td className="mono" style={{ fontWeight: 700 }}>{formatearQuetzales(d.saldo_final ?? d.saldo_inicial)}</td>
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
