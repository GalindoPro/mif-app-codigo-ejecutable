import { useEffect, useRef, useState } from "react";
import { api } from "../lib/api";
import type { Socio } from "../types";

export default function BuscadorSocio({
  agenciaId,
  seleccionado,
  onSeleccionar,
}: {
  agenciaId?: string;
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
        .get<{ data: Socio[] }>("/socios", { params: { q, pageSize: 8, estado: "ACTIVO" } })
        .then(({ data }) => setResultados(data.data.filter((s) => !agenciaId || s.agencia_id === agenciaId)));
    }, 250);
    return () => clearTimeout(timeout);
  }, [q, agenciaId]);

  useEffect(() => {
    function onClickFuera(e: MouseEvent) {
      if (cajaRef.current && !cajaRef.current.contains(e.target as Node)) setAbierto(false);
    }
    document.addEventListener("mousedown", onClickFuera);
    return () => document.removeEventListener("mousedown", onClickFuera);
  }, []);

  if (seleccionado) {
    return (
      <div className="socio-chip">
        <div>
          <strong>{seleccionado.nombres}</strong>
          <span className="mono"> · {seleccionado.numero_asociado}</span>
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
        placeholder="Escribe el nombre o número de asociado…"
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          setAbierto(true);
        }}
        onFocus={() => setAbierto(true)}
      />
      {abierto && resultados.length > 0 && (
        <ul className="buscador-dropdown">
          {resultados.map((s) => (
            <li key={s.id}>
              <button
                type="button"
                onClick={() => {
                  onSeleccionar(s);
                  setAbierto(false);
                  setQ("");
                }}
              >
                <span>{s.nombres}</span>
                <span className="mono">{s.numero_asociado}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {abierto && q.length >= 2 && resultados.length === 0 && (
        <div className="buscador-dropdown empty-msg">Sin resultados para "{q}"</div>
      )}
    </div>
  );
}
