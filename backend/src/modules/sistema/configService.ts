import { pool } from "../../db/pool";
import { badRequest } from "../../utils/errors";

export interface ConfigSistema {
  tasa_interes_mensual_default: number;
  dias_gracia_mora: number;
  mora_fija_por_cuota: number;
  aportacion_minima: number;
  isr_porcentaje_plazo_fijo: number;
  tasa_plazo_fijo_corto: number;
  tasa_plazo_fijo_largo: number;
}

const DEFAULTS: ConfigSistema = {
  tasa_interes_mensual_default: 2.0,
  dias_gracia_mora: 4,
  mora_fija_por_cuota: 25.0,
  aportacion_minima: 100.0,
  isr_porcentaje_plazo_fijo: 10.0,
  tasa_plazo_fijo_corto: 6.0,
  tasa_plazo_fijo_largo: 14.0,
};

// Cache de 5 minutos — evita un round-trip a BD en cada petición
let _cache: ConfigSistema | null = null;
let _cacheAt = 0;
const TTL_MS = 5 * 60 * 1000;

export async function getConfig(): Promise<ConfigSistema> {
  if (_cache && Date.now() - _cacheAt < TTL_MS) return _cache;

  const { rows } = await pool.query(`select clave, valor from configuracion_sistema`);
  const cfg = { ...DEFAULTS };
  for (const row of rows) {
    if (Object.prototype.hasOwnProperty.call(cfg, row.clave)) {
      (cfg as Record<string, number>)[row.clave] = Number(row.valor);
    }
  }
  _cache = cfg;
  _cacheAt = Date.now();
  return cfg;
}

export function invalidateConfig(): void {
  _cache = null;
}

export async function listarConfig() {
  const { rows } = await pool.query(
    `select clave, valor::numeric as valor, descripcion, updated_at
     from configuracion_sistema order by clave`,
  );
  return rows;
}

export async function actualizarConfig(clave: string, valor: number) {
  if (!Object.prototype.hasOwnProperty.call(DEFAULTS, clave)) {
    throw badRequest(`Clave de configuración no reconocida: "${clave}"`);
  }
  if (isNaN(valor) || valor < 0) {
    throw badRequest("El valor debe ser un número no negativo");
  }
  const { rows } = await pool.query(
    `update configuracion_sistema set valor = $1, updated_at = now()
     where clave = $2 returning *`,
    [String(valor), clave],
  );
  if (!rows[0]) throw badRequest(`Clave "${clave}" no existe en la base de datos`);
  invalidateConfig();
  return rows[0];
}
