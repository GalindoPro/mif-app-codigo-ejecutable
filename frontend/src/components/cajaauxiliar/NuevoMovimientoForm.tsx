import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { api, mensajeError } from "../../lib/api";
import BuscadorSocio from "../BuscadorSocio";
import BuscadorCuenta from "../BuscadorCuenta";
import {
  CATEGORIAS_AUXILIAR,
  CATEGORIA_AUXILIAR_KEYS,
} from "../../types";
import type {
  CajaCategoria,
  Cuenta,
  Socio,
} from "../../types";

export const GRUPOS = [
  { key: "PROPIO_INGRESO", seccion: "PROPIO", tipo: "INGRESO", titulo: "Ingreso propio" },
  { key: "PROPIO_EGRESO", seccion: "PROPIO", tipo: "EGRESO", titulo: "Egreso propio" },
  { key: "BI_INGRESO", seccion: "BI", tipo: "INGRESO", titulo: "Ingreso BI" },
  { key: "BI_EGRESO", seccion: "BI", tipo: "EGRESO", titulo: "Egreso BI" },
] as const;

export function categoriasDeGrupo(seccion: "BI" | "PROPIO", tipo: "INGRESO" | "EGRESO"): CajaCategoria[] {
  return CATEGORIA_AUXILIAR_KEYS.filter(
    (k) => CATEGORIAS_AUXILIAR[k].seccion === seccion && CATEGORIAS_AUXILIAR[k].tipo === tipo,
  );
}

export interface NuevoMovimientoFormProps {
  agenciaId: string;
  diaId: string;
  onCreado: () => void;
}

export default function NuevoMovimientoForm({
  agenciaId,
  diaId,
  onCreado,
}: NuevoMovimientoFormProps) {
  const [grupo, setGrupo] = useState<(typeof GRUPOS)[number]["key"]>("PROPIO_INGRESO");
  const opcionesGrupo = useMemo(() => {
    const g = GRUPOS.find((x) => x.key === grupo)!;
    return categoriasDeGrupo(g.seccion, g.tipo);
  }, [grupo]);

  const [categoria, setCategoria] = useState<CajaCategoria>(opcionesGrupo[0]);
  const info = CATEGORIAS_AUXILIAR[categoria];

  const [socio, setSocio] = useState<Socio | null>(null);
  const [socioManual, setSocioManual] = useState(false);
  const [cuenta, setCuenta] = useState<Cuenta | null>(null);
  const [beneficiario, setBeneficiario] = useState("");
  const [sugerencias, setSugerencias] = useState<string[]>([]);
  const [referenciaAut, setReferenciaAut] = useState("");
  const [docNo, setDocNo] = useState("");
  const [monto, setMonto] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function cambiarGrupo(nuevo: (typeof GRUPOS)[number]["key"]) {
    setGrupo(nuevo);
    const g = GRUPOS.find((x) => x.key === nuevo)!;
    const opciones = categoriasDeGrupo(g.seccion, g.tipo);
    setCategoria(opciones[0]);
    setSocio(null);
    setCuenta(null);
    setBeneficiario("");
    setReferenciaAut("");
    setDocNo("");
  }

  useEffect(() => {
    if (info.seccion !== "BI") return;
    if (!beneficiario || beneficiario.length < 2) {
      setSugerencias([]);
      return;
    }
    const t = setTimeout(() => {
      api
        .get<string[]>("/caja-auxiliar/beneficiarios", { params: { agenciaId, q: beneficiario } })
        .then(({ data }) => setSugerencias(data));
    }, 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [beneficiario, info.seccion]);

  async function enviar(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const beneficiarioFinal = info.requiereCuenta ? undefined : socio ? socio.nombres : beneficiario;
    if (!info.requiereCuenta && !beneficiarioFinal) {
      setError("Indica el beneficiario");
      return;
    }
    if (info.requiereCuenta && !cuenta) {
      setError("Selecciona la cuenta");
      return;
    }

    setGuardando(true);
    try {
      await api.post(`/caja-auxiliar/${diaId}/movimientos`, {
        categoria,
        monto: Number(monto),
        beneficiario: beneficiarioFinal,
        socioId: socio?.id,
        cuentaId: cuenta?.id,
        docNo: docNo || undefined,
        referenciaAut: referenciaAut || undefined,
      });
      onCreado();
    } catch (err) {
      setError(mensajeError(err));
    } finally {
      setGuardando(false);
    }
  }

  const referenciaPreview = cuenta ? `${cuenta.numero_cuenta}-${info.tipo === "INGRESO" ? "IN" : "EN"}` : null;

  return (
    <form className="card" onSubmit={enviar} style={{ marginBottom: "1.5rem" }}>
      <div className="tabs" style={{ marginBottom: "1rem" }}>
        {GRUPOS.map((g) => (
          <button key={g.key} type="button" className={grupo === g.key ? "on" : ""} onClick={() => cambiarGrupo(g.key)}>
            {g.titulo}
          </button>
        ))}
      </div>

      <div className="form-grid">
        <div className="field" style={{ gridColumn: "1 / -1" }}>
          <label htmlFor="aux-categoria">Tipo de movimiento</label>
          <select id="aux-categoria" value={categoria} onChange={(e) => setCategoria(e.target.value as CajaCategoria)}>
            {opcionesGrupo.map((c) => (
              <option key={c} value={c}>
                {CATEGORIAS_AUXILIAR[c].descripcion}
                {CATEGORIAS_AUXILIAR[c].sinModuloReal ? " (solo registro de caja)" : ""}
              </option>
            ))}
          </select>
        </div>

        {info.requiereCuenta && (
          <div className="field" style={{ gridColumn: "1 / -1" }}>
            <label>Cuenta del socio</label>
            <BuscadorCuenta tipo={info.requiereCuenta} agenciaId={agenciaId} seleccionada={cuenta} onSeleccionar={setCuenta} />
            {referenciaPreview && (
              <span className="sub mono" style={{ marginTop: "0.35rem", display: "inline-block" }}>
                Referencia: {referenciaPreview}
              </span>
            )}
            {info.tipo === "EGRESO" && cuenta?.tipo === "AHORRO_SOBRE_PRESTAMO" && cuenta.prestamo_estado && cuenta.prestamo_estado !== "CANCELADO" && cuenta.prestamo_estado !== "RECHAZADO" && (
              <div
                style={{
                  marginTop: "0.6rem",
                  padding: "0.75rem 0.9rem",
                  borderRadius: "8px",
                  background: "#fee2e2",
                  color: "#991b1b",
                  border: "1px solid #ef4444",
                  fontSize: "0.85rem",
                  lineHeight: 1.45,
                }}
              >
                🛑 <strong>Retiro bloqueado (Cuenta en garantía):</strong> Esta cuenta está asociada al crédito{" "}
                <strong>{cuenta.prestamo_codigo || "activo"}</strong> ({cuenta.prestamo_estado}). Por política estatutaria de la cooperativa,
                los fondos de <em>Ahorro sobre Préstamo</em> <strong>no se pueden tocar</strong> hasta que el crédito termine de pagarse por completo.
              </div>
            )}
          </div>
        )}

        {!info.requiereCuenta && info.seccion === "PROPIO" && info.requiereSocio && (
          <div className="field" style={{ gridColumn: "1 / -1" }}>
            <label>Socio / beneficiario</label>
            {!socioManual ? (
              <>
                <BuscadorSocio agenciaId={agenciaId} seleccionado={socio} onSeleccionar={setSocio} />
                <button type="button" className="link-btn" style={{ marginTop: "0.35rem" }} onClick={() => setSocioManual(true)}>
                  No es socio / escribir el nombre manualmente
                </button>
              </>
            ) : (
              <>
                <input
                  placeholder="Nombre del beneficiario"
                  value={beneficiario}
                  onChange={(e) => setBeneficiario(e.target.value)}
                />
                <button
                  type="button"
                  className="link-btn"
                  style={{ marginTop: "0.35rem" }}
                  onClick={() => {
                    setSocioManual(false);
                    setBeneficiario("");
                  }}
                >
                  Buscar en socios
                </button>
              </>
            )}
          </div>
        )}

        {!info.requiereCuenta && info.seccion === "PROPIO" && !info.requiereSocio && (
          <div className="field" style={{ gridColumn: "1 / -1" }}>
            <label htmlFor="aux-beneficiario">Beneficiario</label>
            <input id="aux-beneficiario" value={beneficiario} onChange={(e) => setBeneficiario(e.target.value)} />
          </div>
        )}

        {info.seccion === "BI" && (
          <>
            <div className="field" style={{ gridColumn: "1 / -1" }}>
              <label htmlFor="aux-beneficiario-bi">Beneficiario</label>
              <input
                id="aux-beneficiario-bi"
                list="aux-beneficiarios-datalist"
                value={beneficiario}
                onChange={(e) => setBeneficiario(e.target.value)}
              />
              <datalist id="aux-beneficiarios-datalist">
                {sugerencias.map((s) => (
                  <option key={s} value={s} />
                ))}
              </datalist>
            </div>
            <div className="field">
              <label htmlFor="aux-aut">Núm. de autorización BI</label>
              <input id="aux-aut" placeholder="AUT:000000" value={referenciaAut} onChange={(e) => setReferenciaAut(e.target.value)} />
            </div>
          </>
        )}

        {!info.requiereCuenta && (
          <div className="field">
            <label htmlFor="aux-doc">No. de documento</label>
            <input id="aux-doc" value={docNo} onChange={(e) => setDocNo(e.target.value)} />
          </div>
        )}
        {info.requiereCuenta && (
          <div className="field">
            <label htmlFor="aux-doc-cuenta">No. de recibo</label>
            <input id="aux-doc-cuenta" value={docNo} onChange={(e) => setDocNo(e.target.value)} />
          </div>
        )}

        <div className="field">
          <label htmlFor="aux-monto">Monto</label>
          <input
            id="aux-monto"
            type="number"
            min="0.01"
            step="0.01"
            value={monto}
            onChange={(e) => setMonto(e.target.value)}
            required
          />
        </div>
      </div>

      {error && <div className="alert error">{error}</div>}

      {(() => {
        const retiroBloqueado = Boolean(
          info.tipo === "EGRESO" &&
          cuenta?.tipo === "AHORRO_SOBRE_PRESTAMO" &&
          cuenta.prestamo_estado &&
          cuenta.prestamo_estado !== "CANCELADO" &&
          cuenta.prestamo_estado !== "RECHAZADO"
        );
        return (
          <button type="submit" className="btn" disabled={guardando || retiroBloqueado}>
            {guardando ? "Guardando…" : retiroBloqueado ? "Retiro bloqueado por crédito activo" : `Registrar ${info.tipo === "INGRESO" ? "ingreso" : "egreso"}`}
          </button>
        );
      })()}
    </form>
  );
}
