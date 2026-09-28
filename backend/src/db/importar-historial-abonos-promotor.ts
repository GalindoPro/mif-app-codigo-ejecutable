import "dotenv/config";
import path from "path";
import { execSync } from "child_process";
import { pool } from "./pool";

export async function importarHistorialAbonosPromotor() {
  const client = await pool.connect();
  try {
    console.log("================================================================================");
    console.log("🚀 IMPORTACIÓN OFICIAL DE HISTORIAL DE ABONOS 2026 (KARDEX DEL PROMOTOR)");
    console.log("================================================================================\n");

    const excelPath = path.resolve(__dirname, "../../../promotor/KARDEX PRESTAMOS 01-07-26 AL 31-07-26 promotor 2.xlsx");

    const pyScript = `
import openpyxl, json, datetime, re

def to_flt(v):
    if v is None: return 0.0
    s = str(v).replace(',', '').strip()
    if '..' in s: s = s.replace('..', '.')
    try: return float(s)
    except: return 0.0

def parse_fecha(v, fallback_mes):
    if v is None: return f"{fallback_mes}-15"
    if isinstance(v, (datetime.datetime, datetime.date)):
        return v.strftime('%Y-%m-%d')
    s = str(v).strip()
    # Si contiene multiples fechas (ej: "7/05/2026 -28-05-2026") tomar la primera o ultima
    match = re.search(r'(\\d{1,2})[/\\-](\\d{1,2})[/\\-](\\d{2,4})', s)
    if match:
        d, m, y = match.group(1), match.group(2), match.group(3)
        if len(y) == 2: y = "20" + y
        try:
            dt = datetime.date(int(y), int(m), int(d))
            return dt.strftime('%Y-%m-%d')
        except: pass
    return f"{fallback_mes}-15"

wb = openpyxl.load_workbook('${excelPath}', data_only=True)

meses = [
    ("2026-01", 14, 13),
    ("2026-02", 20, 19),
    ("2026-03", 26, 25),
    ("2026-04", 32, 31),
    ("2026-05", 38, 37),
    ("2026-06", 44, 43),
    ("2026-07", 50, 49),
    ("2026-08", 56, 55),
    ("2026-09", 62, 61),
    ("2026-10", 68, 67),
    ("2026-11", 74, 73),
    ("2026-12", 80, 79),
]

resultados = []

for sheet in ['HIPOTECARIO', 'FIDUCIARIO']:
    if sheet not in wb.sheetnames: continue
    ws = wb[sheet]
    col_val = 12 if sheet == 'HIPOTECARIO' else 11
    
    for r in range(7, ws.max_row + 1):
        nom = ws.cell(r, 2).value
        if not nom or 'TOTAL' in str(nom).upper(): continue
        asoc_no = ws.cell(r, 1).value
        val_orig = to_flt(ws.cell(r, col_val).value)
        
        pagos = []
        ultimo_saldo = val_orig
        
        for mes_str, col_hip, col_fid in meses:
            base_col = col_hip if sheet == 'HIPOTECARIO' else col_fid
            fecha_raw = ws.cell(r, base_col).value
            doc_raw = ws.cell(r, base_col + 1).value
            pago_no_raw = ws.cell(r, base_col + 2).value
            abono_raw = ws.cell(r, base_col + 4).value
            saldo_raw = ws.cell(r, base_col + 5).value
            
            abono = to_flt(abono_raw)
            if abono > 0:
                saldo_restante = to_flt(saldo_raw)
                if saldo_restante <= 0:
                    saldo_restante = max(0.0, ultimo_saldo - abono)
                ultimo_saldo = saldo_restante
                
                f_limpia = parse_fecha(fecha_raw, mes_str)
                doc_limpio = str(doc_raw).strip() if doc_raw else f"ABONO-{mes_str}"
                pago_no = str(pago_no_raw).strip() if pago_no_raw else str(len(pagos) + 1)
                
                pagos.append({
                    'mes': mes_str,
                    'fecha': f_limpia,
                    'docNo': doc_limpio,
                    'pagoNo': pago_no,
                    'abono': abono,
                    'saldoRestante': ultimo_saldo
                })
        
        resultados.append({
            'sheet': sheet,
            'fila': r,
            'nombre': str(nom).strip(),
            'asocNo': str(asoc_no).strip() if asoc_no else None,
            'montoOriginal': val_orig,
            'saldoFinal': ultimo_saldo,
            'pagos': pagos
        })

print(json.dumps(resultados))
`;

    const rawOutput = execSync(`python3 -c "${pyScript.replace(/"/g, '\\"')}"`, {
      encoding: "utf-8",
      maxBuffer: 15 * 1024 * 1024,
    });

    const prestamosExcel = JSON.parse(rawOutput.trim()) as Array<{
      sheet: string;
      fila: number;
      nombre: string;
      asocNo: string | null;
      montoOriginal: number;
      saldoFinal: number;
      pagos: Array<{
        mes: string;
        fecha: string;
        docNo: string;
        pagoNo: string;
        abono: number;
        saldoRestante: number;
      }>;
    }>;

    console.log(`📊 Procesando ${prestamosExcel.length} créditos oficiales del Excel...`);

    // Obtener administrador para registrar pagos
    const { rows: uRows } = await client.query<{ id: string }>(
      "select id from usuarios where rol in ('GERENCIA', 'ADMIN') order by id asc limit 1"
    );
    const adminId = uRows[0]?.id;

    // Obtener préstamos oficiales en base de datos
    const { rows: dbPrestamos } = await client.query<{
      id: string;
      codigo: string;
      socio_id: string;
      agencia_id: string;
      socio_nombres: string;
    }>(`
      select p.id, p.codigo, p.socio_id, p.agencia_id, s.nombres as socio_nombres
      from prestamos p
      join socios s on s.id = p.socio_id
      where p.origen_cartera = 'OFICIAL_PROMOTOR'
    `);

    console.log(`🔍 Se encontraron ${dbPrestamos.length} préstamos oficiales en la base de datos.`);

    let totalPagosInsertados = 0;
    let totalAmortizado = 0;

    await client.query("BEGIN");

    // Limpiar pagos históricos de los préstamos oficiales para recargar de forma idempotente y limpia
    const dbPrestamoIds = dbPrestamos.map((p) => p.id);
    if (dbPrestamoIds.length > 0) {
      await client.query(
        `delete from prestamo_pagos 
         where prestamo_id = any($1::uuid[]) and caja_dia_id is null`,
        [dbPrestamoIds]
      );
    }

    for (const ex of prestamosExcel) {
      const exNom = ex.nombre.toUpperCase().trim();
      const match = dbPrestamos.find((dp) => {
        const dpNom = dp.socio_nombres.toUpperCase().trim();
        return dpNom === exNom || dpNom.includes(exNom) || exNom.includes(dpNom);
      });

      if (!match) {
        console.warn(`⚠️ No se encontró préstamo en BD para socio: ${ex.nombre}`);
        continue;
      }

      // Insertar cada abono en prestamo_pagos
      for (const p of ex.pagos) {
        await client.query(
          `insert into prestamo_pagos (
             prestamo_id, socio_id, agencia_id, caja_dia_id, caja_movimiento_id,
             fecha, numero_recibo, abono_capital, interes, mora, total_pagado,
             saldo_capital_restante, origen_fondos, usuario_id, created_at
           ) values (
             $1, $2, $3, null, null,
             $4::date, $5, $6, 0.00, 0.00, $6,
             $7, 'FONDOS_PROPIOS', $8, ($4::date + time '12:00:00')
           )`,
          [
            match.id,
            match.socio_id,
            match.agencia_id,
            p.fecha,
            p.docNo.startsWith("DOC") || p.docNo.startsWith("REC") ? p.docNo : `DOC-${p.docNo}`,
            p.abono,
            p.saldoRestante,
            adminId,
          ]
        );
        totalPagosInsertados++;
        totalAmortizado += p.abono;
      }

      // Actualizar el saldo capital del préstamo al último saldo registrado
      const ultimoPago = ex.pagos[ex.pagos.length - 1];
      const saldoFinal = ex.pagos.length > 0 ? ex.saldoFinal : ex.montoOriginal;
      const fechaUltimoPago = ultimoPago ? ultimoPago.fecha : null;

      await client.query(
        `update prestamos
         set saldo_capital = $1::numeric,
             fecha_ultimo_pago_migracion = coalesce($2::date, fecha_ultimo_pago_migracion),
             estado = case when $1::numeric <= 0 then 'CANCELADO'::estado_prestamo else 'DESEMBOLSADO'::estado_prestamo end
         where id = $3`,
        [saldoFinal, fechaUltimoPago, match.id]
      );
    }

    await client.query("COMMIT");

    console.log("\n================================================================================");
    console.log("✅ RESULTADO DE LA IMPORTACIÓN HISTÓRICA DE ABONOS:");
    console.log(`   • Total Cuotas/Abonos Registrados: ${totalPagosInsertados}`);
    console.log(`   • Monto Total Amortizado a Capital: Q ${totalAmortizado.toLocaleString("es-GT", { minimumFractionDigits: 2 })}`);
    console.log("================================================================================\n");

    return {
      ok: true,
      totalPagosInsertados,
      totalAmortizado,
    };
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("❌ Error importando historial de abonos:", err);
    throw err;
  } finally {
    client.release();
  }
}

if (require.main === module) {
  importarHistorialAbonosPromotor()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
