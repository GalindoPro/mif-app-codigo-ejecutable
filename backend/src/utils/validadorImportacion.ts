import { pool } from "../db/pool";

export interface FilaExcelBase {
  fila: number;
  nombres: string;
  dpi?: string | null;
}

export interface ErrorValidacion {
  fila: number;
  nombreExcel: string;
  dpiExcel: string | null;
  tipoError: "NOMBRE_SIMILAR" | "DPI_DUPLICADO";
  mensaje: string;
  sugerencia: string;
}

/**
 * Valida un conjunto de filas extraídas de un Excel contra la base de datos actual.
 * Detecta:
 * 1. DPIs que ya existen en la BD pero pertenecen a un nombre diferente.
 * 2. Nombres en el Excel que son "casi iguales" (similitud > 85%) a nombres existentes.
 * 
 * Si hay errores, imprime la tabla de errores y aborta la importación.
 */
export async function abortarSiHayErroresExcel(filasExcel: FilaExcelBase[], nombreArchivo: string): Promise<void> {
  console.log(`\n🔍 Verificando integridad de datos para '${nombreArchivo}' antes de importar...`);
  const errores: ErrorValidacion[] = [];
  const client = await pool.connect();

  try {
    const { rows: sociosDb } = await client.query(`SELECT id, nombres, dpi, numero_asociado FROM socios`);

    const nombresExactosDb = new Set(sociosDb.map(s => s.nombres.trim().toUpperCase()));
    
    const dpiMapDb = new Map<string, { nombres: string, codigo: string }>();
    for (const s of sociosDb) {
      if (s.dpi && s.dpi.trim().length >= 13) {
        dpiMapDb.set(s.dpi.replace(/\D/g, ""), { nombres: s.nombres, codigo: s.numero_asociado });
      }
    }

    const dpiMapExcel = new Map<string, { fila: number, nombres: string }>();

    for (const fila of filasExcel) {
      const nombreLimpiado = fila.nombres.trim().toUpperCase();
      const dpiLimpiado = fila.dpi ? fila.dpi.replace(/\D/g, "") : null;

      if (nombresExactosDb.has(nombreLimpiado)) {
        continue;
      }

      const { rows: similitud } = await client.query(`
        SELECT nombres, numero_asociado, similarity(LOWER(nombres), LOWER($1)) as similitud
        FROM socios
        WHERE similarity(LOWER(nombres), LOWER($1)) > 0.85
        ORDER BY similitud DESC
        LIMIT 1
      `, [nombreLimpiado]);

      if (similitud.length > 0) {
        errores.push({
          fila: fila.fila,
          nombreExcel: fila.nombres,
          dpiExcel: fila.dpi || null,
          tipoError: "NOMBRE_SIMILAR",
          mensaje: `El nombre '${fila.nombres}' es muy similar a '${similitud[0].nombres}' (${similitud[0].numero_asociado}).`,
          sugerencia: "Si es la misma persona, escriba el nombre EXACTAMENTE igual en el Excel. Si son distintas, verifique el CUI."
        });
      }

      if (dpiLimpiado && dpiLimpiado.length >= 13) {
        if (dpiMapDb.has(dpiLimpiado)) {
          const sDb = dpiMapDb.get(dpiLimpiado)!;
          if (sDb.nombres.trim().toUpperCase() !== nombreLimpiado) {
            errores.push({
              fila: fila.fila,
              nombreExcel: fila.nombres,
              dpiExcel: fila.dpi || null,
              tipoError: "DPI_DUPLICADO",
              mensaje: `El DPI ${dpiLimpiado} ya está registrado bajo el nombre '${sDb.nombres}' (${sDb.codigo}).`,
              sugerencia: "Corriga el DPI en el Excel o utilice el nombre exacto registrado."
            });
          }
        }

        if (dpiMapExcel.has(dpiLimpiado)) {
          const anterior = dpiMapExcel.get(dpiLimpiado)!;
          if (anterior.nombres.trim().toUpperCase() !== nombreLimpiado) {
            errores.push({
              fila: fila.fila,
              nombreExcel: fila.nombres,
              dpiExcel: fila.dpi || null,
              tipoError: "DPI_DUPLICADO",
              mensaje: `El DPI ${dpiLimpiado} aparece duplicado en el Excel para nombres distintos ('${anterior.nombres}' y '${fila.nombres}').`,
              sugerencia: "Unifique el nombre o corrija el DPI."
            });
          }
        }
        dpiMapExcel.set(dpiLimpiado, { fila: fila.fila, nombres: fila.nombres });
      }
    }

    if (errores.length > 0) {
      console.error("\n❌ ¡ERROR CRÍTICO: SE ENCONTRARON INCONSISTENCIAS EN EL EXCEL!");
      console.error("Para mantener la integridad de la BD y evitar duplicados, corrija estos errores antes de continuar:\n");
      console.table(errores.map(e => ({ Fila: e.fila, Tipo: e.tipoError, Nombre_Excel: e.nombreExcel, Mensaje: e.mensaje })));
      console.error("\n👉 Solución sugerida: Abra el archivo Excel, corrija los datos para que coincidan EXACTAMENTE con la BD, y vuelva a importar.\n");
      process.exit(1);
    } else {
      console.log("   ✅ Integridad validada. Cero DPIs duplicados, cero nombres ambiguos.");
    }
  } finally {
    client.release();
  }
}
