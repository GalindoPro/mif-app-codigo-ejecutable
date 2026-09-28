import { useEffect, useRef, useState } from "react";
import { api } from "../lib/api";
import type { Socio } from "../types";

export default function BuscadorSocio({
  agenciaId,
  permitirInterAgencia = false,
  seleccionado,
  onSeleccionar,
}: {
  agenciaId?: string;
  permitirInterAgencia?: boolean;
  seleccionado: Socio | null;
  onSeleccionar: (socio: Socio | null) => void;
}) {
  const [q, setQ] = useState("");
  const [resultados, setResultados] = useState<Socio[]>([]);
  const [abierto, setAbierto] = useState(false);
  const cajaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!q || q.length < 2) {
      setResultados([]);
      return;
    }
    const timeout = setTimeout(() => {
      api
        .get<{ data: Socio[] }>("/socios", {
          params: {
            q,
            pageSize: 8,
            estado: "ACTIVO",
            interAgencia: permitirInterAgencia ? "true" : undefined,
          },
        })
        .then(({ data }) => {
          if (permitirInterAgencia) {
            setResultados(data.data);
          } else {
            setResultados(data.data.filter((s) => !agenciaId || s.agencia_id === agenciaId));
          }
        });
    }, 250);
    return () => clearTimeout(timeout);
  }, [q, agenciaId, permitirInterAgencia]);

  useEffect(() => {
    function onClickFuera(e: MouseEvent) {
      if (cajaRef.current && !cajaRef.current.contains(e.target as Node)) setAbierto(false);
    }
    document.addEventListener("mousedown", onClickFuera);
    return () => document.removeEventListener("mousedown", onClickFuera);
  }, []);

  if (seleccionado) {
    const esInterAgencia = Boolean(agenciaId && seleccionado.agencia_id && seleccionado.agencia_id !== agenciaId);
    const cantCreditosSel = seleccionado.creditos_activos ?? 0;
    return (
      <div className="socio-chip">
        <div style={{ display: "flex", alignItems: "center", gap: "0.45rem", flexWrap: "wrap" }}>
          <strong>{seleccionado.nombres}</strong>
          <span className="mono"> · {seleccionado.numero_asociado}</span>
          {cantCreditosSel > 0 && (
            <span
              className="badge"
              style={{
                background: "rgba(16, 185, 129, 0.15)",
                color: "#059669",
                border: "1px solid rgba(16, 185, 129, 0.4)",
                fontSize: "0.72rem",
                fontWeight: 700,
                padding: "0.12rem 0.45rem",
              }}
            >
              💼 {cantCreditosSel} crédito{cantCreditosSel > 1 ? "s" : ""} activo{cantCreditosSel > 1 ? "s" : ""}
            </span>
          )}
          {esInterAgencia && (
            <span
              className="badge"
              style={{
                background: "rgba(147, 51, 234, 0.15)",
                color: "#c084fc",
                border: "1px solid rgba(147, 51, 234, 0.4)",
                fontSize: "0.72rem",
                fontWeight: 700,
                padding: "0.15rem 0.5rem",
              }}
            >
              🔄 Inter-Agencia: {seleccionado.agencia_nombre || seleccionado.agencia_codigo}
            </span>
          )}
        </div>
        <button type="button" className="link-btn" onClick={() => onSeleccionar(null)}>
          Cambiar
        </button>
      </div>
    );
  }

  return (
    <div className="buscador-socio" ref={cajaRef}>
      <input
        placeholder={permitirInterAgencia ? "Escribe el nombre, DPI o número de asociado (búsqueda inter-agencia)…" : "Escribe el nombre o número de asociado…"}
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          setAbierto(true);
        }}
        onFocus={() => setAbierto(true)}
      />
      {abierto && resultados.length > 0 && (
        <ul className="buscador-dropdown">
          {resultados.map((s) => {
            const esOtraAgencia = Boolean(agenciaId && s.agencia_id && s.agencia_id !== agenciaId);
            const cantCreditos = s.creditos_activos ?? 0;
            return (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => {
                    onSeleccionar(s);
                    setAbierto(false);
                    setQ("");
                  }}
                  style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.5rem" }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", flexWrap: "wrap" }}>
                    <span>{s.nombres}</span>
                    {cantCreditos > 0 ? (
                      <span
                        style={{
                          fontSize: "0.68rem",
                          background: "rgba(16, 185, 129, 0.15)",
                          color: "#059669",
                          border: "1px solid rgba(16, 185, 129, 0.35)",
                          padding: "0.08rem 0.4rem",
                          borderRadius: "4px",
                          fontWeight: 700,
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "0.2rem",
                        }}
                      >
                        💼 {cantCreditos} crédito{cantCreditos > 1 ? "s" : ""} activo{cantCreditos > 1 ? "s" : ""}
                      </span>
                    ) : (
                      <span style={{ fontSize: "0.66rem", color: "var(--ink-soft)" }}>
                        (Sin préstamos)
                      </span>
                    )}
                    {esOtraAgencia && (
                      <span
                        style={{
                          fontSize: "0.68rem",
                          background: "rgba(147, 51, 234, 0.12)",
                          color: "#c084fc",
                          border: "1px solid rgba(147, 51, 234, 0.35)",
                          padding: "0.1rem 0.4rem",
                          borderRadius: "4px",
                          fontWeight: 700,
                        }}
                      >
                        🔄 {s.agencia_nombre || s.agencia_codigo}
                      </span>
                    )}
                  </div>
                  <span className="mono">{s.numero_asociado}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
      {abierto && q.length >= 2 && resultados.length === 0 && (
        <div className="buscador-dropdown empty-msg">Sin resultados para "{q}"</div>
      )}
    </div>
  );
}
