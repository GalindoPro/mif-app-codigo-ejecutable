import { useEffect, useRef, useState } from "react";
import { api } from "../lib/api";
import { formatoQ } from "../types";
import type { Cuenta, TipoCuentaAhorro } from "../types";

export default function BuscadorCuenta({
  tipo,
  agenciaId,
  permitirInterAgencia = false,
  seleccionada,
  onSeleccionar,
}: {
  tipo: TipoCuentaAhorro;
  agenciaId?: string;
  permitirInterAgencia?: boolean;
  seleccionada: Cuenta | null;
  onSeleccionar: (cuenta: Cuenta | null) => void;
}) {
  const [q, setQ] = useState("");
  const [resultados, setResultados] = useState<Cuenta[]>([]);
  const [abierto, setAbierto] = useState(false);
  const cajaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!q || q.length < 2) {
      setResultados([]);
      return;
    }
    const timeout = setTimeout(() => {
      api
        .get<Cuenta[]>("/cuentas", {
          params: {
            tipo,
            q,
            interAgencia: permitirInterAgencia ? "true" : undefined,
          },
        })
        .then(({ data }) => {
          if (permitirInterAgencia) {
            setResultados(data);
          } else {
            setResultados(data.filter((c) => !agenciaId || c.agencia_id === agenciaId));
          }
        });
    }, 250);
    return () => clearTimeout(timeout);
  }, [q, tipo, agenciaId, permitirInterAgencia]);

  useEffect(() => {
    function onClickFuera(e: MouseEvent) {
      if (cajaRef.current && !cajaRef.current.contains(e.target as Node)) setAbierto(false);
    }
    document.addEventListener("mousedown", onClickFuera);
    return () => document.removeEventListener("mousedown", onClickFuera);
  }, []);

  if (seleccionada) {
    const esInterAgencia = Boolean(agenciaId && seleccionada.agencia_id && seleccionada.agencia_id !== agenciaId);
    return (
      <div className="socio-chip">
        <div style={{ display: "flex", alignItems: "center", gap: "0.45rem", flexWrap: "wrap" }}>
          <strong>{seleccionada.socio_nombres}</strong>
          <span className="mono"> · {seleccionada.numero_cuenta}</span>
          <span> · saldo {formatoQ(seleccionada.saldo_actual)}</span>
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
              🔄 Inter-Agencia: {seleccionada.agencia_nombre || "Otra Agencia"}
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
        placeholder={permitirInterAgencia ? "Escribe el nombre del socio o número de cuenta (búsqueda inter-agencia)…" : "Escribe el nombre del socio o número de cuenta…"}
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          setAbierto(true);
        }}
        onFocus={() => setAbierto(true)}
      />
      {abierto && resultados.length > 0 && (
        <ul className="buscador-dropdown">
          {resultados.map((c) => {
            const esOtraAgencia = Boolean(agenciaId && c.agencia_id && c.agencia_id !== agenciaId);
            return (
              <li key={c.id}>
                <button
                  type="button"
                  onClick={() => {
                    onSeleccionar(c);
                    setAbierto(false);
                    setQ("");
                  }}
                  style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.5rem" }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                    <span>{c.socio_nombres}</span>
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
                        🔄 {c.agencia_nombre || "Inter-Agencia"}
                      </span>
                    )}
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <span className="mono" style={{ display: "block" }}>{c.numero_cuenta}</span>
                    <span style={{ fontSize: "0.74rem", color: "var(--accent)" }}>{formatoQ(c.saldo_actual)}</span>
                  </div>
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
