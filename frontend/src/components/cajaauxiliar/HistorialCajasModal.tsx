import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import { formatoQ } from "../../types";
import type { DetalleCajaAuxiliar } from "../../types";
import ActaArqueoModal from "./ActaArqueoModal";
import LibroCajaReporteModal from "./LibroCajaReporteModal";

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
  const [detalleActa, setDetalleActa] = useState<DetalleCajaAuxiliar | null>(null);
  const [detalleLibro, setDetalleLibro] = useState<DetalleCajaAuxiliar | null>(null);

  useEffect(() => {
    api
      .get<any[]>("/caja-auxiliar/historial", { params: { agenciaId } })
      .then(({ data }) => setDias(data))
      .finally(() => setCargando(false));
  }, [agenciaId]);

  function abrirActa(diaId: string) {
    api
      .get<DetalleCajaAuxiliar>(`/caja-auxiliar/${diaId}`)
      .then(({ data }) => setDetalleActa(data));
  }

  function abrirLibro(diaId: string) {
    api
      .get<DetalleCajaAuxiliar>(`/caja-auxiliar/${diaId}`)
      .then(({ data }) => setDetalleLibro(data));
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(15, 23, 42, 0.72)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 9990,
        padding: "1rem",
      }}
    >
      <div
        className="modal-content"
        style={{
          maxWidth: 920,
          width: "100%",
          maxHeight: "88vh",
          overflowY: "auto",
          background: "var(--paper-raised, #ffffff)",
          padding: "1.35rem 1.5rem",
          borderRadius: "14px",
          boxShadow: "0 25px 50px -12px rgba(15, 23, 42, 0.35)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", borderBottom: "1px solid var(--line)", paddingBottom: "0.65rem" }}>
          <div>
            <h2 style={{ margin: 0, fontSize: "1.15rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <span>📅</span> Historial de Cajas Diarias · {agenciaNombre}
            </h2>
            <p className="sub" style={{ margin: 0, fontSize: "0.78rem" }}>
              Consulta de cierres anteriores, actas notariales de arqueo y libros de movimientos
            </p>
          </div>
          <button className="btn secondary" onClick={onCerrar}>✕ Cerrar</button>
        </div>

        {cargando && <p style={{ fontSize: "0.85rem", color: "var(--ink-soft)" }}>Cargando historial…</p>}

        {!cargando && dias.length === 0 && (
          <div className="alert info">No hay registros de cajas anteriores para esta agencia.</div>
        )}

        {dias.length > 0 && (
          <div className="table-wrap">
            <table className="table-compact">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Estado</th>
                  <th style={{ textAlign: "right" }}>Saldo Inicial</th>
                  <th style={{ textAlign: "right" }}>Ingresos</th>
                  <th style={{ textAlign: "right" }}>Egresos</th>
                  <th style={{ textAlign: "right" }}>Saldo Final</th>
                  <th>Operador</th>
                  <th style={{ textAlign: "center" }}>Acciones</th>
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
                    <td className="mono" style={{ textAlign: "right" }}>{formatoQ(d.saldo_inicial)}</td>
                    <td className="mono" style={{ color: "#059669", textAlign: "right", fontWeight: 600 }}>{formatoQ(d.total_ingresos)}</td>
                    <td className="mono" style={{ color: "#dc2626", textAlign: "right", fontWeight: 600 }}>{formatoQ(d.total_egresos)}</td>
                    <td className="mono" style={{ fontWeight: 700, textAlign: "right" }}>{formatoQ(d.saldo_final ?? d.saldo_inicial)}</td>
                    <td style={{ fontSize: "0.78rem" }}>{d.cerrado_por_nombre || d.abierto_por_nombre || "—"}</td>
                    <td style={{ textAlign: "center" }}>
                      <div style={{ display: "flex", gap: "0.3rem", justifyContent: "center" }}>
                        <button
                          type="button"
                          className="btn btn-xs"
                          onClick={() => abrirLibro(d.id)}
                          title="Imprimir Libro de Movimientos de este día"
                        >
                          🖨️ Libro
                        </button>
                        <button
                          type="button"
                          className="btn btn-xs secondary"
                          onClick={() => abrirActa(d.id)}
                          title="Ver Acta Notarial de Arqueo"
                        >
                          📑 Acta
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {detalleActa && (
          <ActaArqueoModal
            agenciaNombre={agenciaNombre}
            detalle={detalleActa}
            onCerrar={() => setDetalleActa(null)}
          />
        )}

        {detalleLibro && (
          <LibroCajaReporteModal
            agenciaId={agenciaId}
            agenciaNombre={agenciaNombre}
            detalleActual={detalleLibro}
            onClose={() => setDetalleLibro(null)}
          />
        )}
      </div>
    </div>
  );
}
