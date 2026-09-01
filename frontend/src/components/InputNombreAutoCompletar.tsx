import React, { useState, useRef, useEffect } from "react";
import type { KeyboardEvent, ChangeEvent } from "react";
import {
  buscarSugerenciasNombre,
  corregirTildeExacta,
  PARTICULAS_IGNORADAS,
  normalizarParaBusqueda,
} from "../lib/nombresDiccionario";
import { capitalizarNombre } from "../lib/formatters";

interface Props {
  id?: string;
  value: string;
  onChange: (valor: string) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  style?: React.CSSProperties;
  className?: string;
  autoFocus?: boolean;
}

export default function InputNombreAutoCompletar({
  id,
  value,
  onChange,
  placeholder,
  required,
  disabled,
  style,
  className,
  autoFocus,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [cursorPos, setCursorPos] = useState(value.length);
  const [enfocado, setEnfocado] = useState(false);
  const [sugerencias, setSugerencias] = useState<string[]>([]);
  const [palabraActual, setPalabraActual] = useState<{ palabra: string; inicio: number; fin: number }>({
    palabra: "",
    inicio: 0,
    fin: 0,
  });

  // Extrae la palabra que se está editando bajo la posición del cursor
  function extraerPalabra(texto: string, pos: number) {
    const textoHastaCursor = texto.slice(0, pos);
    const match = textoHastaCursor.match(/([^\s]+)$/);
    if (!match) {
      return { palabra: "", inicio: pos, fin: pos };
    }
    const palabra = match[1];
    const inicio = pos - palabra.length;
    return { palabra, inicio, fin: pos };
  }

  // Actualiza sugerencias disponibles
  useEffect(() => {
    if (!enfocado) {
      setSugerencias([]);
      return;
    }
    const actual = extraerPalabra(value, cursorPos);
    setPalabraActual(actual);

    const norm = normalizarParaBusqueda(actual.palabra);
    // No sugerir si es conector (de, del, la) o está vacío
    if (actual.palabra.length >= 1 && !PARTICULAS_IGNORADAS.has(norm)) {
      const sugs = buscarSugerenciasNombre(actual.palabra, 3);
      setSugerencias(sugs);
    } else {
      setSugerencias([]);
    }
  }, [value, cursorPos, enfocado]);

  // Aplica la sugerencia seleccionada
  function aplicarSugerencia(sugerencia: string) {
    const { inicio, fin } = palabraActual;
    const antes = value.slice(0, inicio);
    const despues = value.slice(fin);

    const tieneEspacioDespues = despues.startsWith(" ");
    const nuevoTexto = antes + sugerencia + (tieneEspacioDespues ? "" : " ") + despues;

    onChange(capitalizarNombre(nuevoTexto));

    const nuevaPos = inicio + sugerencia.length + (tieneEspacioDespues ? 0 : 1);
    setCursorPos(nuevaPos);

    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        inputRef.current.setSelectionRange(nuevaPos, nuevaPos);
      }
    }, 15);
  }

  // Manejo de teclado (PC y laptops)
  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    // Tecla Tab: autocompleta la primera sugerencia si existe
    if (e.key === "Tab" && sugerencias.length > 0) {
      e.preventDefault();
      aplicarSugerencia(sugerencias[0]);
      return;
    }

    // Tecla Escape: descarta sugerencias
    if (e.key === "Escape") {
      setSugerencias([]);
      return;
    }

    // Tecla Barra Espaciadora:
    // Solo autocompleta con espacio si la palabra tiene 2 o más letras (ej. 'tom' -> 'Tomás', 'sanc' -> 'Sánchez')
    // NUNCA autocompleta en una sola letra (para permitir letras sueltas como 'J.', 'T.')
    // y NUNCA en conectores como 'de', 'del', 'la'
    if (e.key === " " && sugerencias.length > 0) {
      const palabra = palabraActual.palabra;
      const norm = normalizarParaBusqueda(palabra);

      if (palabra.length >= 2 && !PARTICULAS_IGNORADAS.has(norm)) {
        e.preventDefault();
        aplicarSugerencia(sugerencias[0]);
      }
    }
  }

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const nuevoValor = e.target.value;
    const nuevaPos = e.target.selectionStart ?? nuevoValor.length;

    // REGLA CRÍTICA 1: Si el usuario está BORRANDO (longitud menor), NUNCA interferir ni trabar
    if (nuevoValor.length < value.length) {
      setCursorPos(nuevaPos);
      onChange(nuevoValor);
      return;
    }

    // REGLA CRÍTICA 2: Si el usuario ingresó un espacio al final de una palabra
    // Verificamos si la palabra recién terminada lleva tilde (ej. 'tomas ' -> 'Tomás ', 'sanchez ' -> 'Sánchez ')
    if (nuevoValor.endsWith(" ") && !value.endsWith(" ")) {
      const palabras = nuevoValor.trim().split(/\s+/);
      const ultimaPalabra = palabras[palabras.length - 1];

      if (ultimaPalabra) {
        // ¿Lleva tilde según el diccionario?
        const tildeExacta = corregirTildeExacta(ultimaPalabra);
        if (tildeExacta) {
          palabras[palabras.length - 1] = tildeExacta;
          const textoAcentuado = palabras.join(" ") + " ";
          setCursorPos(textoAcentuado.length);
          onChange(capitalizarNombre(textoAcentuado));
          return;
        }

        // Si escribió 2 o más letras y había sugerencia activa (soporte móvil virtual keyboard)
        const norm = normalizarParaBusqueda(ultimaPalabra);
        if (ultimaPalabra.length >= 2 && !PARTICULAS_IGNORADAS.has(norm)) {
          const sugs = buscarSugerenciasNombre(ultimaPalabra, 1);
          if (sugs.length > 0) {
            palabras[palabras.length - 1] = sugs[0];
            const textoCompletado = palabras.join(" ") + " ";
            setCursorPos(textoCompletado.length);
            onChange(capitalizarNombre(textoCompletado));
            return;
          }
        }
      }
    }

    setCursorPos(nuevaPos);
    onChange(capitalizarNombre(nuevoValor));
  }

  function handleSelect(e: React.SyntheticEvent<HTMLInputElement>) {
    const target = e.target as HTMLInputElement;
    setCursorPos(target.selectionStart ?? value.length);
  }

  return (
    <div style={{ position: "relative", width: "100%" }}>
      <input
        ref={inputRef}
        id={id}
        type="text"
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onSelect={handleSelect}
        onFocus={() => setEnfocado(true)}
        onBlur={() => {
          // Timeout para permitir toque/clic en los botones de sugerencia
          setTimeout(() => setEnfocado(false), 220);
        }}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        className={className}
        autoFocus={autoFocus}
        autoComplete="off"
        style={{
          ...style,
          width: "100%",
        }}
      />

      {/* Barra de sugerencias visibles para Tocar en Móvil o Clic en PC */}
      {sugerencias.length > 0 && enfocado && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            left: 0,
            right: 0,
            zIndex: 40,
            background: "var(--paper-raised, #1e293b)",
            border: "1px solid var(--accent, #38bdf8)",
            borderRadius: "8px",
            padding: "0.4rem 0.6rem",
            boxShadow: "0 8px 20px rgba(0, 0, 0, 0.35)",
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: "0.4rem",
          }}
        >
          <span
            style={{
              fontSize: "0.76rem",
              color: "var(--ink-soft, #94a3b8)",
              display: "inline-flex",
              alignItems: "center",
              gap: "0.25rem",
              marginRight: "0.15rem",
              userSelect: "none",
            }}
          >
            <span>💡</span> Toca para completar:
          </span>

          {sugerencias.map((sug, idx) => (
            <button
              key={sug}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                aplicarSugerencia(sug);
              }}
              onTouchStart={(e) => {
                e.preventDefault();
                aplicarSugerencia(sug);
              }}
              title={`Completar con ${sug}`}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.3rem",
                background: idx === 0 ? "rgba(56, 189, 248, 0.2)" : "rgba(255, 255, 255, 0.05)",
                border: idx === 0 ? "1px solid var(--accent, #38bdf8)" : "1px solid var(--line, #334155)",
                color: idx === 0 ? "var(--accent, #38bdf8)" : "var(--ink, #f8fafc)",
                borderRadius: "6px",
                padding: "0.22rem 0.6rem",
                fontSize: "0.82rem",
                fontWeight: idx === 0 ? 700 : 500,
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              {idx === 0 && <span style={{ fontSize: "0.75rem" }}>✨</span>}
              <span>{sug}</span>
            </button>
          ))}

          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              setSugerencias([]);
            }}
            title="Cerrar sugerencias"
            style={{
              marginLeft: "auto",
              background: "transparent",
              border: "none",
              color: "var(--ink-soft, #94a3b8)",
              cursor: "pointer",
              fontSize: "0.78rem",
              padding: "0.1rem 0.3rem",
            }}
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
