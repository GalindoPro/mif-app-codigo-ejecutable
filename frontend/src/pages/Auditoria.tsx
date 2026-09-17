import { useEffect, useState } from "react";
import { api, mensajeError } from "../lib/api";
import { formatoQ } from "../types";

interface RegistroAuditoria {
  id: string;
  entidad: string;
  entidad_id: string;
  accion: "CREAR" | "ACTUALIZAR" | "ELIMINAR";
  datos_anteriores: Record<string, unknown> | null;
  datos_nuevos: Record<string, unknown> | null;
  fecha: string;
  motivo?: string;
  usuario_nombre: string;
  usuario_rol: string;
}

interface Pagina {
  data: RegistroAuditoria[];
  total: number;
  page: number;
  pageSize: number;
}

const ACCION_COLOR: Record<string, { bg: string; color: string; label: string }> = {
  CREAR:     { bg: "rgba(22,163,74,0.15)",  color: "#16a34a", label: "Creación"     },
  ACTUALIZAR:{ bg: "rgba(180,83,9,0.15)",   color: "#d97706", label: "Modificación" },
  ELIMINAR:  { bg: "rgba(220,38,38,0.15)",  color: "#ef4444", label: "Eliminación"  },
};

// Campos que nunca aportan valor a un supervisor leyendo el diff (ruido puramente técnico).
const CAMPOS_OCULTOS = new Set(["id", "created_at", "updated_at"]);

// Campos monetarios (se formatean como Q 0.00).
const CAMPOS_MONTO = new Set([
  "monto", "saldo_inicial", "saldo_final", "saldo_actual", "saldo_acumulado",
  "cuota_pactada", "cuota_mensual", "monto_solicitado", "monto_aprobado", "saldo_capital",
  "abono_capital", "interes", "mora", "total_pagado", "saldo_capital_restante",
  "monto_deposito", "interes_generado", "interes_neto", "saldo_liquido_a_pagar", "monto_liquidado",
]);

// Campos de porcentaje/tasa (se formatean con %).
const CAMPOS_PORCENTAJE = new Set(["tasa_interes_mensual", "tasa_anual", "isr_porcentaje"]);

// Etiquetas en español para los campos más comunes de las entidades auditadas.
const CAMPO_LABEL: Record<string, string> = {
  agencia_id: "Agencia", agencia_nombre: "Agencia",
  socio_id: "Socio", socio_nombres: "Socio",
  usuario_id: "Usuario", usuario_nombre: "Usuario", creado_por_id: "Creado por",
  cuenta_id: "Cuenta", prestamo_id: "Préstamo", caja_dia_id: "Caja del día",
  caja_movimiento_id: "Movimiento de caja", movimiento_id: "Movimiento",
  ingreso_comif_id: "Ingreso COMIF", promotor_id: "Promotor", promotor_nombre: "Promotor",
  estado: "Estado", tipo: "Tipo", fecha: "Fecha", descripcion: "Descripción",
  observaciones: "Observaciones", observaciones_apertura: "Observaciones de apertura",
  motivo: "Motivo", categoria: "Categoría", seccion: "Sección", contador: "Contador",
  referencia: "Referencia", doc_no: "No. de documento", numero_documento: "No. de documento",
  numero_recibo: "No. de recibo", numero_asociado: "No. de asociado", numero_cuenta: "No. de cuenta",
  numero_certificacion: "No. de certificación", numero_credito_anterior: "No. de crédito anterior",
  beneficiario: "Beneficiario", nombre_beneficiario: "Nombre del beneficiario",
  dpi_beneficiario: "DPI/CUI del beneficiario", telefono_beneficiario: "Teléfono del beneficiario",
  parentesco_beneficiario: "Parentesco del beneficiario",
  titular_menor_nombre: "Nombre del menor", titular_menor_parentesco: "Parentesco del menor",
  titular_menor_cui: "CUI del menor", titular_menor_fecha_nacimiento: "Fecha de nacimiento del menor",
  nombres: "Nombres", genero: "Género", dpi: "DPI", direccion: "Dirección", telefono: "Teléfono",
  fecha_ingreso: "Fecha de ingreso",
  saldo_inicial: "Saldo inicial", saldo_final: "Saldo final", saldo_actual: "Saldo actual",
  saldo_acumulado: "Saldo acumulado", cuota_pactada: "Cuota pactada", cuota_mensual: "Cuota mensual",
  codigo: "Código", tipo_amortizacion: "Tipo de amortización", monto_solicitado: "Monto solicitado",
  monto_aprobado: "Monto aprobado", tasa_interes_mensual: "Tasa de interés mensual",
  plazo_meses: "Plazo (meses)", destino: "Destino", garantia: "Garantía",
  fecha_solicitud: "Fecha de solicitud", fecha_aprobacion: "Fecha de aprobación",
  fecha_desembolso: "Fecha de desembolso", saldo_capital: "Saldo de capital",
  ubicacion_garantia: "Ubicación de la garantía", nombre_fiador: "Nombre del fiador",
  dpi_fiador: "DPI del fiador", telefono_fiador: "Teléfono del fiador",
  documento_desembolso: "Documento de desembolso", fecha_vencimiento: "Fecha de vencimiento",
  origen_fondos: "Origen de fondos", es_migracion: "Es migración",
  abono_capital: "Abono a capital", interes: "Interés", mora: "Mora",
  total_pagado: "Total pagado", saldo_capital_restante: "Saldo de capital restante",
  tasa_anual: "Tasa anual", isr_porcentaje: "ISR (%)", monto_deposito: "Monto del depósito",
  interes_generado: "Interés generado", interes_neto: "Interés neto",
  saldo_liquido_a_pagar: "Saldo líquido a pagar", fecha_retiro: "Fecha de retiro",
  recibo_retiro: "Recibo de retiro", monto_liquidado: "Monto liquidado",
  abierto_por: "Abierto por", cerrado_por: "Cerrado por", cerrado_at: "Cerrado el",
};

function etiquetaCampo(clave: string): string {
  return CAMPO_LABEL[clave] ?? clave.replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase());
}

function pareceFecha(clave: string, valor: string): boolean {
  return /^\d{4}-\d{2}-\d{2}/.test(valor) && (clave.includes("fecha") || clave.endsWith("_at"));
}

function formatearValor(clave: string, valor: unknown): string {
  if (valor === null || valor === undefined || valor === "") return "—";
  if (typeof valor === "boolean") return valor ? "Sí" : "No";
  if (CAMPOS_PORCENTAJE.has(clave) && !isNaN(Number(valor))) return `${Number(valor)}%`;
  if (CAMPOS_MONTO.has(clave) && !isNaN(Number(valor))) return formatoQ(valor as string | number);
  if (typeof valor === "string" && pareceFecha(clave, valor)) {
    const d = new Date(valor);
    if (!isNaN(d.getTime())) {
      return valor.includes("T")
        ? d.toLocaleString("es-GT", { dateStyle: "medium", timeStyle: "short" })
        : d.toLocaleDateString("es-GT");
    }
  }
  if (typeof valor === "object") return JSON.stringify(valor);
  return String(valor);
}

interface FilaDiff {
  clave: string;
  antes: unknown;
  despues: unknown;
  cambio: boolean;
}

// Sufijos de campos de "nombre para mostrar" que suelen venir de un join (ej. agencia_nombre
// junto a agencia_id). No son atributos propios de la entidad, así que no se auditan como cambio.
const SUFIJOS_ENRIQUECIDOS = ["_nombre", "_nombres", "_codigo", "_email", "_telefono", "_rol", "_dpi"];

function calcularDiff(
  antes: Record<string, unknown> | null,
  despues: Record<string, unknown> | null,
): FilaDiff[] {
  const claves = new Set([
    ...(antes ? Object.keys(antes) : []),
    ...(despues ? Object.keys(despues) : []),
  ]);
  const prefijosConId = new Set(
    [...claves].filter((k) => k.endsWith("_id")).map((k) => k.slice(0, -3)),
  );

  const filas: FilaDiff[] = [];
  for (const clave of claves) {
    if (CAMPOS_OCULTOS.has(clave)) continue;
    const a = antes ? antes[clave] : undefined;
    const d = despues ? despues[clave] : undefined;
    // Colecciones anidadas (ej. "cuentas" de un socio) son datos de otra entidad, no propios.
    if (Array.isArray(a) || Array.isArray(d)) continue;
    // Campos de despliegue derivados de un _id ya presente en el registro (join, no atributo real).
    const esEnriquecido = SUFIJOS_ENRIQUECIDOS.some(
      (suf) => clave.endsWith(suf) && prefijosConId.has(clave.slice(0, -suf.length)),
    );
    if (esEnriquecido) continue;
    filas.push({ clave, antes: a, despues: d, cambio: JSON.stringify(a) !== JSON.stringify(d) });
  }
  filas.sort((x, y) => {
    if (x.cambio !== y.cambio) return x.cambio ? -1 : 1;
    return etiquetaCampo(x.clave).localeCompare(etiquetaCampo(y.clave), "es");
  });
  return filas;
}

const pageSize = 25;

export default function Auditoria() {
  const [pagina, setPagina]           = useState<Pagina | null>(null);
  const [entidades, setEntidades]     = useState<string[]>([]);
  const [error, setError]             = useState<string | null>(null);
  const [cargando, setCargando]       = useState(false);
  const [page, setPage]               = useState(1);
  const [q, setQ]                     = useState("");
  const [entidadFiltro, setEntidadFiltro] = useState("");
  const [accionFiltro, setAccionFiltro]   = useState("");
  const [desde, setDesde]             = useState("");
  const [hasta, setHasta]             = useState("");
  const [detalle, setDetalle]         = useState<RegistroAuditoria | null>(null);
  const [mostrarTodosCampos, setMostrarTodosCampos] = useState(false);

  useEffect(() => {
    api.get<string[]>("/auditoria/entidades")
      .then(({ data }) => setEntidades(data))
      .catch(() => {});
  }, []);

  useEffect(() => { setPage(1); }, [q, entidadFiltro, accionFiltro, desde, hasta]);

  useEffect(() => {
    setCargando(true);
    setError(null);
    api
      .get<Pagina>("/auditoria", {
        params: {
          page, pageSize,
          q: q || undefined,
          entidad: entidadFiltro || undefined,
          accion:  accionFiltro  || undefined,
          desde:   desde         || undefined,
          hasta:   hasta         || undefined,
        },
      })
      .then(({ data }) => setPagina(data))
      .catch((err) => setError(mensajeError(err)))
      .finally(() => setCargando(false));
  }, [page, q, entidadFiltro, accionFiltro, desde, hasta]);

  const totalPaginas = pagina ? Math.max(1, Math.ceil(pagina.total / pageSize)) : 1;
  const hayFiltros   = !!(q || entidadFiltro || accionFiltro || desde || hasta);

  function limpiarFiltros() {
    setQ(""); setEntidadFiltro(""); setAccionFiltro(""); setDesde(""); setHasta("");
  }

  return (
    <div className="screen-container">
      {/* ── HEADER 1 LÍNEA ── */}
      <div className="screen-header">
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span>🔍</span>
          <h1 style={{ margin: 0, fontSize: "1rem", fontWeight: 700 }}>Bitácora de Auditoría</h1>
          <span style={{ fontSize: "0.75rem", color: "var(--ink-soft)" }}>
            — Registro inmutable de acciones del sistema
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          {cargando && (
            <span style={{ fontSize: "0.72rem", color: "var(--ink-soft)" }}>Cargando…</span>
          )}
          {hayFiltros && (
            <button
              type="button"
              className="btn secondary"
              style={{ fontSize: "0.75rem", padding: "0.25rem 0.6rem" }}
              onClick={limpiarFiltros}
            >
              ✕ Limpiar filtros
            </button>
          )}
        </div>
      </div>

      {error && <div className="alert error" style={{ margin: "0 1rem", flexShrink: 0 }}>{error}</div>}

      {/* ── KPI STRIP FINTECH ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "0.5rem", flexShrink: 0 }}>
        <div
          style={{
            background: "var(--paper)",
            border: "1px solid var(--line)",
            borderLeft: "4px solid #0284c7",
            borderRadius: "8px",
            padding: "0.45rem 0.65rem",
            display: "flex",
            flexDirection: "column",
            boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "0.65rem", fontWeight: 700, color: "#0284c7", letterSpacing: "0.03em" }}>
              TOTAL EVENTOS AUDITADOS
            </span>
            <span style={{ fontSize: "0.85rem" }}>🛡️</span>
          </div>
          <span style={{ fontSize: "1.08rem", fontWeight: 700, color: "var(--ink)", fontFamily: "monospace" }}>
            {pagina?.total.toLocaleString("es-GT") ?? "0"}
          </span>
          <span style={{ fontSize: "0.65rem", color: "var(--ink-soft)" }}>Trazabilidad completa inmutable</span>
        </div>

        <div
          style={{
            background: "var(--paper)",
            border: "1px solid var(--line)",
            borderLeft: "4px solid #6366f1",
            borderRadius: "8px",
            padding: "0.45rem 0.65rem",
            display: "flex",
            flexDirection: "column",
            boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "0.65rem", fontWeight: 700, color: "#6366f1", letterSpacing: "0.03em" }}>
              ENTIDADES MONITOREADAS
            </span>
            <span style={{ fontSize: "0.85rem" }}>📦</span>
          </div>
          <span style={{ fontSize: "1.08rem", fontWeight: 700, color: "#6366f1", fontFamily: "monospace" }}>
            {entidades.length}
          </span>
          <span style={{ fontSize: "0.65rem", color: "var(--ink-soft)" }}>Módulos bajo supervisión</span>
        </div>

        <div
          style={{
            background: "var(--paper)",
            border: "1px solid var(--line)",
            borderLeft: "4px solid #059669",
            borderRadius: "8px",
            padding: "0.45rem 0.65rem",
            display: "flex",
            flexDirection: "column",
            boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "0.65rem", fontWeight: 700, color: "#059669", letterSpacing: "0.03em" }}>
              VISTA ACTUAL
            </span>
            <span style={{ fontSize: "0.85rem" }}>📄</span>
          </div>
          <span style={{ fontSize: "1.08rem", fontWeight: 700, color: "var(--ink)", fontFamily: "monospace" }}>
            Pág {page} de {totalPaginas}
          </span>
          <span style={{ fontSize: "0.65rem", color: "var(--ink-soft)" }}>{pageSize} registros por bloque</span>
        </div>
      </div>

      {/* ── BARRA DE FILTROS COMPACTA ── */}
      <div
        className="screen-toolbar"
        style={{ gap: "0.4rem", flexWrap: "wrap", alignItems: "center", flexShrink: 0 }}
      >
        {/* Búsqueda */}
        <div className="searchbar" style={{ flex: "1 1 180px", minWidth: 180, marginBottom: 0 }}>
          <input
            placeholder="Buscar por usuario o entidad…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            style={{ fontSize: "0.8rem" }}
          />
        </div>

        {/* Entidad */}
        <select
          value={entidadFiltro}
          onChange={(e) => setEntidadFiltro(e.target.value)}
          style={{
            padding: "0.3rem 0.55rem", borderRadius: "6px",
            border: "1px solid var(--line)", fontSize: "0.8rem",
            background: "var(--paper)", color: "var(--ink)",
          }}
        >
          <option value="">Todas las entidades</option>
          {entidades.map((e) => <option key={e} value={e}>{e}</option>)}
        </select>

        {/* Acción */}
        <select
          value={accionFiltro}
          onChange={(e) => setAccionFiltro(e.target.value)}
          style={{
            padding: "0.3rem 0.55rem", borderRadius: "6px",
            border: "1px solid var(--line)", fontSize: "0.8rem",
            background: "var(--paper)", color: "var(--ink)",
          }}
        >
          <option value="">Todas las acciones</option>
          <option value="CREAR">✅ Creaciones</option>
          <option value="ACTUALIZAR">✏️ Modificaciones</option>
          <option value="ELIMINAR">🗑️ Eliminaciones</option>
        </select>

        {/* Desde */}
        <div style={{ display: "flex", gap: "0.3rem", alignItems: "center" }}>
          <label style={{ fontSize: "0.75rem", color: "var(--ink-soft)", whiteSpace: "nowrap" }}>Desde</label>
          <input
            type="date" value={desde} onChange={(e) => setDesde(e.target.value)}
            style={{
              padding: "0.28rem 0.45rem", borderRadius: "6px",
              border: "1px solid var(--line)", fontSize: "0.78rem",
              background: "var(--paper)", color: "var(--ink)",
            }}
          />
        </div>

        {/* Hasta */}
        <div style={{ display: "flex", gap: "0.3rem", alignItems: "center" }}>
          <label style={{ fontSize: "0.75rem", color: "var(--ink-soft)", whiteSpace: "nowrap" }}>Hasta</label>
          <input
            type="date" value={hasta} onChange={(e) => setHasta(e.target.value)}
            style={{
              padding: "0.28rem 0.45rem", borderRadius: "6px",
              border: "1px solid var(--line)", fontSize: "0.78rem",
              background: "var(--paper)", color: "var(--ink)",
            }}
          />
        </div>
      </div>

      {/* ── TABLA CON SCROLL INTERNO ── */}
      <div className="table-scroll-container" style={{ flex: 1 }}>
        <table style={{ fontSize: "0.8rem", width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={{ width: "13%" }}>Fecha y Hora</th>
              <th style={{ width: "18%" }}>Usuario</th>
              <th style={{ width: "18%" }}>Entidad</th>
              <th style={{ width: "11%", textAlign: "center" }}>Acción</th>
              <th style={{ width: "17%" }}>ID del Registro</th>
              <th style={{ width: "10%", textAlign: "center" }}>Detalles</th>
            </tr>
          </thead>
          <tbody>
            {cargando && (
              <tr>
                <td colSpan={6} style={{ textAlign: "center", padding: "2rem", color: "var(--ink-soft)" }}>
                  Cargando registros…
                </td>
              </tr>
            )}
            {!cargando && pagina?.data.map((r) => {
              const cfg = ACCION_COLOR[r.accion] ?? { bg: "rgba(100,100,100,0.15)", color: "#6b7280", label: r.accion };
              return (
                <tr key={r.id}>
                  <td className="mono" style={{ whiteSpace: "nowrap", fontSize: "0.75rem" }}>
                    {new Date(r.fecha).toLocaleString("es-GT", { dateStyle: "short", timeStyle: "medium" })}
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, fontSize: "0.8rem" }}>{r.usuario_nombre}</div>
                    <div style={{ fontSize: "0.68rem", color: "var(--ink-soft)" }}>{r.usuario_rol}</div>
                  </td>
                  <td style={{ fontWeight: 600, fontSize: "0.8rem" }}>{r.entidad}</td>
                  <td style={{ textAlign: "center" }}>
                    <span style={{
                      display: "inline-block", fontSize: "0.69rem", fontWeight: 700,
                      padding: "0.12rem 0.4rem", borderRadius: "4px",
                      background: cfg.bg, color: cfg.color,
                      border: `1px solid ${cfg.color}44`,
                    }}>
                      {cfg.label}
                    </span>
                  </td>
                  <td className="mono" style={{ fontSize: "0.69rem", color: "var(--ink-soft)" }}>
                    {r.entidad_id.slice(0, 10)}…
                  </td>
                  <td style={{ textAlign: "center" }}>
                    {(r.datos_anteriores || r.datos_nuevos) && (
                      <button
                        className="link-btn"
                        style={{ fontSize: "0.75rem" }}
                        onClick={() => { setDetalle(r); setMostrarTodosCampos(false); }}
                      >
                        Ver cambios
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
            {!cargando && pagina?.data.length === 0 && (
              <tr>
                <td colSpan={6} style={{ textAlign: "center", padding: "2rem", color: "var(--ink-soft)" }}>
                  No se encontraron registros con los filtros aplicados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ── FOOTER / PAGINACIÓN ── */}
      <div className="screen-footer" style={{ justifyContent: "space-between" }}>
        <span style={{ fontSize: "0.75rem", color: "var(--ink-soft)" }}>
          {pagina
            ? `${pagina.data.length} registros mostrados · Total: ${pagina.total.toLocaleString("es-GT")}`
            : "—"}
        </span>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <button
            className="btn secondary"
            style={{ fontSize: "0.75rem", padding: "0.2rem 0.6rem" }}
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            ← Anterior
          </button>
          <span style={{ fontSize: "0.78rem", color: "var(--ink-soft)" }}>
            Página {page} de {totalPaginas}
          </span>
          <button
            className="btn secondary"
            style={{ fontSize: "0.75rem", padding: "0.2rem 0.6rem" }}
            disabled={page >= totalPaginas}
            onClick={() => setPage((p) => p + 1)}
          >
            Siguiente →
          </button>
        </div>
      </div>

      {/* ── MODAL DE DETALLE DE CAMBIOS ── */}
      {detalle && (
        <div
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)",
            display: "flex", alignItems: "center", justifyContent: "center", zIndex: 300,
          }}
          onClick={() => setDetalle(null)}
        >
          <div
            style={{
              background: "var(--paper)", borderRadius: "12px", padding: "1.5rem",
              width: "100%", maxWidth: "700px", maxHeight: "80vh", overflow: "auto",
              margin: "1rem", boxShadow: "0 8px 32px rgba(0,0,0,0.35)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
              <div>
                <h3 style={{ margin: "0 0 0.2rem", fontSize: "1rem" }}>
                  {detalle.entidad} — {ACCION_COLOR[detalle.accion]?.label ?? detalle.accion}
                </h3>
                <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--ink-soft)" }}>
                  Por <strong>{detalle.usuario_nombre}</strong> el{" "}
                  {new Date(detalle.fecha).toLocaleString("es-GT", { dateStyle: "long", timeStyle: "medium" })}
                </p>
              </div>
              <button className="btn secondary" style={{ fontSize: "0.78rem" }} onClick={() => setDetalle(null)}>
                Cerrar
              </button>
            </div>

            {detalle.motivo && (
              <div style={{
                background: "rgba(234, 179, 8, 0.1)",
                border: "1px solid rgba(234, 179, 8, 0.3)",
                padding: "1rem",
                borderRadius: "8px",
                marginBottom: "1.5rem"
              }}>
                <h4 style={{ margin: "0 0 0.4rem", fontSize: "0.85rem", color: "#a16207" }}>
                  Motivo de la Corrección:
                </h4>
                <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--ink)", lineHeight: 1.5 }}>
                  {detalle.motivo}
                </p>
              </div>
            )}

            {(() => {
              const esModificacion = !!(detalle.datos_anteriores && detalle.datos_nuevos);
              const filas = calcularDiff(detalle.datos_anteriores, detalle.datos_nuevos);
              const totalCambios = filas.filter((f) => f.cambio).length;
              const filasVisibles = esModificacion
                ? mostrarTodosCampos ? filas : filas.filter((f) => f.cambio)
                : filas.filter((f) => {
                    const v = f.antes ?? f.despues;
                    return v !== null && v !== undefined && v !== "";
                  });

              return (
                <div>
                  {esModificacion && (
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.6rem" }}>
                      <span style={{ fontSize: "0.78rem", color: "var(--ink-soft)" }}>
                        {totalCambios === 0
                          ? "No se detectaron campos con valores distintos."
                          : `${totalCambios} campo${totalCambios === 1 ? "" : "s"} modificado${totalCambios === 1 ? "" : "s"}.`}
                      </span>
                      <label style={{ display: "flex", alignItems: "center", gap: "0.35rem", fontSize: "0.78rem", color: "var(--ink-soft)", cursor: "pointer" }}>
                        <input
                          type="checkbox"
                          checked={mostrarTodosCampos}
                          onChange={(e) => setMostrarTodosCampos(e.target.checked)}
                        />
                        Mostrar todos los campos
                      </label>
                    </div>
                  )}

                  {filasVisibles.length === 0 ? (
                    <p style={{ fontSize: "0.82rem", color: "var(--ink-soft)" }}>Sin campos que mostrar.</p>
                  ) : esModificacion ? (
                    <div style={{ border: "1px solid var(--line)", borderRadius: "8px", overflow: "hidden" }}>
                      <table style={{ width: "100%", fontSize: "0.8rem", borderCollapse: "collapse" }}>
                        <thead>
                          <tr style={{ background: "var(--paper-raised)" }}>
                            <th style={{ textAlign: "left", padding: "0.45rem 0.6rem" }}>Campo</th>
                            <th style={{ textAlign: "left", padding: "0.45rem 0.6rem", color: "#d97706" }}>Antes</th>
                            <th style={{ textAlign: "left", padding: "0.45rem 0.6rem", color: "#16a34a" }}>Después</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filasVisibles.map((f) => (
                            <tr key={f.clave} style={{ borderTop: "1px solid var(--line)", opacity: f.cambio ? 1 : 0.55 }}>
                              <td style={{ padding: "0.4rem 0.6rem", fontWeight: 600 }}>{etiquetaCampo(f.clave)}</td>
                              <td style={{ padding: "0.4rem 0.6rem", color: f.cambio ? "#b45309" : "var(--ink-soft)" }}>
                                {formatearValor(f.clave, f.antes)}
                              </td>
                              <td style={{ padding: "0.4rem 0.6rem", color: f.cambio ? "#15803d" : "var(--ink-soft)", fontWeight: f.cambio ? 700 : 400 }}>
                                {formatearValor(f.clave, f.despues)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div style={{ border: "1px solid var(--line)", borderRadius: "8px", overflow: "hidden" }}>
                      <table style={{ width: "100%", fontSize: "0.8rem", borderCollapse: "collapse" }}>
                        <tbody>
                          {filasVisibles.map((f) => (
                            <tr key={f.clave} style={{ borderTop: "1px solid var(--line)" }}>
                              <td style={{ padding: "0.4rem 0.6rem", fontWeight: 600, width: "40%", background: "var(--paper-raised)" }}>
                                {etiquetaCampo(f.clave)}
                              </td>
                              <td style={{ padding: "0.4rem 0.6rem" }}>
                                {formatearValor(f.clave, f.antes ?? f.despues)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
