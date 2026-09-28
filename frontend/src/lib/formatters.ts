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

/**
 * Formatea fechas YYYY-MM-DD a DD/MM/YYYY evitando desfases de huso horario (GMT-6).
 */
export function formatearFechaLocal(fecha: string | Date | null | undefined): string {
  if (!fecha) return "-";
  if (fecha instanceof Date) return fecha.toLocaleDateString("es-GT");
  const str = String(fecha).slice(0, 10);
  const parts = str.split("-");
  if (parts.length === 3) {
    const [y, m, d] = parts.map(Number);
    if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
      return `${String(d).padStart(2, "0")}/${String(m).padStart(2, "0")}/${y}`;
    }
  }
  return str;
}

/**
 * Calcula la edad exacta en años a partir de una fecha de nacimiento (YYYY-MM-DD).
 */
export function calcularEdad(fechaNacStr?: string | null): number | null {
  if (!fechaNacStr) return null;
  const str = String(fechaNacStr).slice(0, 10);
  const parts = str.split("-");
  if (parts.length !== 3) return null;
  const [y, m, d] = parts.map(Number);
  if (isNaN(y) || isNaN(m) || isNaN(d)) return null;

  const hoy = new Date();
  let edad = hoy.getFullYear() - y;
  const mesActual = hoy.getMonth() + 1;
  const diaActual = hoy.getDate();

  if (mesActual < m || (mesActual === m && diaActual < d)) {
    edad--;
  }
  return edad;
}

/**
 * Convierte un valor numérico a su representación en letras en Quetzales.
 * Ej: 500 -> "QUINIENTOS QUETZALES EXACTOS"
 */
export function numeroALetras(num: number): string {
  const enteros = Math.floor(Math.abs(num));
  const centavos = Math.round((Math.abs(num) - enteros) * 100);
  const centavosStr = centavos === 0 ? "EXACTOS" : `CON ${centavos.toString().padStart(2, "0")}/100 CENTAVOS`;

  const unidades = ["", "UN", "DOS", "TRES", "CUATRO", "CINCO", "SEIS", "SIETE", "OCHO", "NUEVE"];
  const decenas = ["", "DIEZ", "VEINTE", "TREINTA", "CUARENTA", "CINCUENTA", "SESENTA", "SETENTA", "OCHENTA", "NOVENTA"];
  const especiales: Record<number, string> = {
    11: "ONCE", 12: "DOCE", 13: "TRECE", 14: "CATORCE", 15: "QUINCE",
    16: "DIECISÉIS", 17: "DIECISIETE", 18: "DIECIOCHO", 19: "DIECINUEVE",
    21: "VEINTIÚN", 22: "VEINTIDÓS", 23: "VEINTITRÉS", 24: "VEINTICUATRO", 25: "VEINTICINCO",
    26: "VEINTISÉIS", 27: "VEINTISIETE", 28: "VEINTIOCHO", 29: "VEINTINUEVE",
  };
  const centenas = ["", "CIENTO", "DOSCIENTOS", "TRESCIENTOS", "CUATROCIENTOS", "QUINIENTOS", "SEISCIENTOS", "SETECIENTOS", "OCHOCIENTOS", "NOVECIENTOS"];

  function convertirGrupo(n: number): string {
    if (n === 0) return "";
    if (n === 100) return "CIEN";
    let res = "";
    const c = Math.floor(n / 100);
    const d = Math.floor((n % 100) / 10);
    const u = n % 10;
    const du = n % 100;

    if (c > 0) res += centenas[c] + " ";
    if (especiales[du]) {
      res += especiales[du] + " ";
    } else {
      if (d > 0) {
        res += decenas[d];
        if (u > 0) res += " Y " + unidades[u] + " ";
        else res += " ";
      } else if (u > 0) {
        res += unidades[u] + " ";
      }
    }
    return res.trim();
  }

  if (enteros === 0) return `CERO QUETZALES ${centavosStr}`;

  let texto = "";
  const millones = Math.floor(enteros / 1000000);
  const miles = Math.floor((enteros % 1000000) / 1000);
  const resto = enteros % 1000;

  if (millones > 0) {
    if (millones === 1) texto += "UN MILLÓN ";
    else texto += convertirGrupo(millones) + " MILLONES ";
  }

  if (miles > 0) {
    if (miles === 1) texto += "MIL ";
    else texto += convertirGrupo(miles) + " MIL ";
  }

  if (resto > 0) {
    texto += convertirGrupo(resto) + " ";
  }

  const sufijoMoneda = enteros === 1 ? "QUETZAL" : "QUETZALES";
  return `${texto.trim()} ${sufijoMoneda} ${centavosStr}`.trim();
}

