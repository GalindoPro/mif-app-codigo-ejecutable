import { useEffect, useRef, useState } from "react";
import { api } from "../lib/api";
import { formatoQ } from "../types";
import type { Cuenta, TipoCuentaAhorro } from "../types";

export default function BuscadorCuenta({
  tipo,
  agenciaId,
  seleccionada,
  onSeleccionar,
}: {
  tipo: TipoCuentaAhorro;
  agenciaId?: string;
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
        .get<Cuenta[]>("/cuentas", { params: { tipo, q } })
        .then(({ data }) => setResultados(data.filter((c) => !agenciaId || c.agencia_id === agenciaId)));
    }, 250);
    return () => clearTimeout(timeout);
  }, [q, tipo, agenciaId]);

  useEffect(() => {
    function onClickFuera(e: MouseEvent) {
      if (cajaRef.current && !cajaRef.current.contains(e.target as Node)) setAbierto(false);
    }
    document.addEventListener("mousedown", onClickFuera);
    return () => document.removeEventListener("mousedown", onClickFuera);
  }, []);

  if (seleccionada) {
    return (
      <div className="socio-chip">
        <div>
          <strong>{seleccionada.socio_nombres}</strong>
          <span className="mono"> · {seleccionada.numero_cuenta}</span>
          <span> · saldo {formatoQ(seleccionada.saldo_actual)}</span>
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
        placeholder="Busca por socio o número de cuenta…"
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          setAbierto(true);
        }}
        onFocus={() => setAbierto(true)}
      />
      {abierto && resultados.length > 0 && (
        <ul className="buscador-dropdown">
          {resultados.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                onClick={() => {
                  onSeleccionar(c);
                  setAbierto(false);
                  setQ("");
                }}
              >
                <span>{c.socio_nombres}</span>
                <span className="mono">
                  {c.numero_cuenta} · {formatoQ(c.saldo_actual)}
                </span>
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
