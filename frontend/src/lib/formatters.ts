/**
 * Funciones de formato y utilidades para DPI y Teléfono (Guatemala)
 */

/**
 * Formatea un número de DPI guatemalteco (CUI) al formato xxxx-xxxxx-xxxx (13 dígitos numéricos).
 * Solo permite dígitos y máximo 13 números.
 */
export function formatearDPI(valor: string): string {
  const digits = valor.replace(/\D/g, "").slice(0, 13);
  if (digits.length <= 4) return digits;
  if (digits.length <= 9) return `${digits.slice(0, 4)}-${digits.slice(4)}`;
  return `${digits.slice(0, 4)}-${digits.slice(4, 9)}-${digits.slice(9)}`;
}

/**
 * Extrae únicamente los dígitos numéricos del DPI.
 */
export function limpiarDPI(valor: string): string {
  return valor.replace(/\D/g, "");
}

/**
 * Formatea un número telefónico de Guatemala (8 dígitos locales) a formato xxxx-xxxx.
 * Si el valor incluye prefijo 502, lo normaliza a los 8 dígitos locales.
 */
export function formatearTelefono(valor: string): string {
  let digits = valor.replace(/\D/g, "");
  if (digits.startsWith("502") && digits.length > 8) {
    digits = digits.slice(3);
  }
  digits = digits.slice(0, 8);
  if (digits.length <= 4) return digits;
  return `${digits.slice(0, 4)}-${digits.slice(4)}`;
}

/**
 * Retorna el número telefónico formateado con el código internacional +502
 * para compatibilidad directa con envíos a WhatsApp.
 */
export function prepararTelefonoParaGuardar(valor: string): string | undefined {
  const digits = valor.replace(/\D/g, "");
  if (!digits) return undefined;
  if (digits.length === 8) {
    return `+502 ${digits.slice(0, 4)}-${digits.slice(4)}`;
  }
  if (digits.startsWith("502") && digits.length === 11) {
    return `+502 ${digits.slice(3, 7)}-${digits.slice(7)}`;
  }
  return valor.trim() || undefined;
}

/**
 * Capitaliza palabra por palabra (Title Case) para nombres propios de personas.
 * Cada palabra comienza automáticamente con mayúscula inicial (ej. "Juan Carlos Pérez").
 * Si se pega texto en mayúsculas sostenidas, lo normaliza elegantemente palabra por palabra.
 */
const CONECTORES_NOMBRE = new Set(["de", "del", "la", "las", "los", "y", "e"]);

export function capitalizarNombre(valor: string): string {
  if (!valor) return "";
  let texto = valor;
  if (/^[\p{Lu}\s\p{P}]+$/u.test(texto) && texto.length > 2) {
    texto = texto.toLowerCase();
  }
  const palabras = texto.split(/(\s+)/);
  return palabras
    .map((p, idx) => {
      if (/^\s+$/.test(p)) return p;
      const norm = p.toLowerCase();
      // Conectores como 'de', 'del' se mantienen en minúsculas salvo que sean la primera palabra
      if (idx > 0 && CONECTORES_NOMBRE.has(norm)) {
        return norm;
      }
      return p.replace(/(^|[^\p{L}\p{N}])(\p{L})/gu, (_, sep, letra) => sep + letra.toUpperCase());
    })
    .join("");
}

/**
 * Capitaliza únicamente la primera letra al principio de un texto o descripción (Sentence Case).
 * El resto del texto se conserva tal cual se escribe (ej. "Aldea san juan, chajul, quiché").
 */
export function capitalizarDescripcion(valor: string): string {
  if (!valor) return "";
  const primerIndice = valor.search(/\S/);
  if (primerIndice === -1) return valor;
  return (
    valor.slice(0, primerIndice) +
    valor.charAt(primerIndice).toUpperCase() +
    valor.slice(primerIndice + 1)
  );
}

export function formatearQuetzales(valor: number | string | null | undefined): string {
  if (valor === null || valor === undefined || valor === "") return "Q 0.00";
  const num = typeof valor === "string" ? parseFloat(valor) : valor;
  if (isNaN(num)) return "Q 0.00";
  return `Q ${num.toLocaleString("es-GT", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}


