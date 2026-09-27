import React from "react";

interface DualCuentaBadgeProps {
  numeroCuenta: string;
  codigoSistema?: string | null;
  className?: string;
}

/**
 * Componente oficial de visualización dual de cuenta:
 * Muestra arriba el número de cuenta original del libro oficial (ej. 165-1-1)
 * y abajo el código interno estructurado del sistema (ej. CHAJ-APO-00001).
 */
export const DualCuentaBadge: React.FC<DualCuentaBadgeProps> = ({
  numeroCuenta,
  codigoSistema,
  className = "",
}) => {
  return (
    <div
      className={`dual-cuenta-badge ${className}`}
      style={{
        display: "inline-flex",
        flexDirection: "column",
        alignItems: "flex-start",
        lineHeight: 1.25,
      }}
    >
      <span
        className="mono"
        style={{
          fontWeight: 700,
          color: "var(--ink, #0f172a)",
          fontSize: "0.88rem",
          letterSpacing: "0.02em",
        }}
      >
        {numeroCuenta}
      </span>
      {codigoSistema && codigoSistema !== numeroCuenta && (
        <span
          className="mono"
          style={{
            fontSize: "0.72rem",
            color: "var(--accent, #0284c7)",
            background: "rgba(2, 132, 199, 0.08)",
            padding: "0.08rem 0.35rem",
            borderRadius: "4px",
            marginTop: "0.15rem",
            fontWeight: 600,
            border: "1px solid rgba(2, 132, 199, 0.2)",
          }}
          title="Código correlativo estructurado del sistema"
        >
          {codigoSistema}
        </span>
      )}
    </div>
  );
};
