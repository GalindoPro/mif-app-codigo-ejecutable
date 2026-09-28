import "dotenv/config";
import path from "path";
import openpyxl from "child_process";
import { pool } from "./pool";

interface PrestamoExcel {
  asocNo: string;
  nombre: string;
  tipo: "HIPOTECARIO" | "FIDUCIARIO";
  ubicacion: string | null;
  fiador: string | null;
  plazoRaw: string | null;
  fechaDesembolso: string | null;
  fechaVencimiento: string | null;
  monto: number;
}

async function sincronizar() {
  const client = await pool.connect();
  try {
    console.log("================================================================================");
    console.log("🔄 SINCRONIZACIÓN DE TIPOS DE CRÉDITO (HIPOTECARIO / FIDUCIARIO) DESDE EXCEL");
    console.log("================================================================================\n");

    const excelPath = path.resolve(__dirname, "../../../promotor/KARDEX PRESTAMOS 01-07-26 AL 31-07-26 promotor 2.xlsx");

    // Ejecutar script python auxiliar para extraer de forma fiel los registros de ambas hojas
    const pyScript = `
import openpyxl, json, os, datetime

def clean_val(v):
    if v is None: return None
    if isinstance(v, (datetime.datetime, datetime.date)):
        return v.strftime('%Y-%m-%d')
    return str(v).strip()

def clean_float(v):
    if v is None: return 0.0
    try:
        s = str(v).replace(',', '').strip()
        if '..' in s:
            s = s.replace('..', '.')
        return float(s)
    except:
        return 0.0

wb = openpyxl.load_workbook('${excelPath}', data_only=True)
items = []

for sheet_name in ['HIPOTECARIO', 'FIDUCIARIO']:
    if sheet_name not in wb.sheetnames: continue
    ws = wb[sheet_name]
    for r in range(7, ws.max_row + 1):
        nom = ws.cell(r, 2).value
        if not nom or not str(nom).strip() or 'TOTAL' in str(nom).upper():
            continue
        asoc_no = ws.cell(r, 1).value
        doc = ws.cell(r, 4).value
        if sheet_name == 'HIPOTECARIO':
            ubi = ws.cell(r, 5).value or ws.cell(r, 6).value
            fiador = ws.cell(r, 7).value
            plazo = ws.cell(r, 9).value
            f_pres = ws.cell(r, 10).value
            f_venc = ws.cell(r, 11).value
            monto = ws.cell(r, 12).value
        else:
            ubi = ws.cell(r, 5).value
            fiador = ws.cell(r, 6).value
            plazo = ws.cell(r, 8).value
            f_pres = ws.cell(r, 9).value
            f_venc = ws.cell(r, 10).value
            monto = ws.cell(r, 11).value

        items.append({
            'asocNo': clean_val(asoc_no),
            'nombre': clean_val(nom),
            'tipo': sheet_name,
            'ubicacion': clean_val(ubi),
            'fiador': clean_val(fiador),
            'plazoRaw': clean_val(plazo),
            'fechaDesembolso': clean_val(f_pres),
            'fechaVencimiento': clean_val(f_venc),
            'monto': clean_float(monto)
        })

print(json.dumps(items))
`;

    const rawJson = openpyxl.execSync(`python3 -c "${pyScript.replace(/"/g, '\\"')}"`, {
      maxBuffer: 50 * 1024 * 1024,
    }).toString();

    const excelItems: PrestamoExcel[] = JSON.parse(rawJson);
    console.log(`📊 Leídos del Excel: ${excelItems.length} créditos (${excelItems.filter(i => i.tipo === 'HIPOTECARIO').length} Hipotecarios, ${excelItems.filter(i => i.tipo === 'FIDUCIARIO').length} Fiduciarios)\n`);

    // Consultar préstamos actuales en base de datos con nombres de socios
    const { rows: dbPrestamos } = await client.query<{
      id: string;
      codigo: string;
      socio_id: string;
      socio_nombres: string;
      tipo: string;
      monto_aprobado: string;
    }>(`
      select p.id, p.codigo, p.socio_id, s.nombres as socio_nombres, p.tipo, p.monto_aprobado
      from prestamos p
      join socios s on s.id = p.socio_id
    `);

    console.log(`🔍 Evaluando ${dbPrestamos.length} créditos en la base de datos...`);

    let hipotecariosActualizados = 0;
    let fiduciariosActualizados = 0;

    for (const dp of dbPrestamos) {
      const nomNorm = dp.socio_nombres.toUpperCase().trim();

      // Buscar coincidencia en Excel
      const match = excelItems.find((e) => {
        const eNom = e.nombre.toUpperCase().trim();
        return eNom === nomNorm || nomNorm.includes(eNom) || eNom.includes(nomNorm);
      });

      if (match) {
        const nuevoTipo = match.tipo;
        const ubicacion = match.ubicacion || (nuevoTipo === "HIPOTECARIO" ? "Inmueble Chajul" : "Comunidad Chajul");
        const fiador = match.fiador || (nuevoTipo === "HIPOTECARIO" ? "Garantía Hipotecaria (Inmueble / Terreno)" : "Fiador solidario");
        const fVenc = match.fechaVencimiento ? match.fechaVencimiento.slice(0, 10) : null;

        await client.query(
          `update prestamos
           set tipo = $1,
               ubicacion_garantia = coalesce(ubicacion_garantia, $2),
               nombre_fiador = coalesce(nombre_fiador, $3),
               fecha_vencimiento = coalesce(fecha_vencimiento, $4)
           where id = $5`,
          [nuevoTipo, ubicacion, fiador, fVenc, dp.id]
        );

        if (nuevoTipo === "HIPOTECARIO") {
          hipotecariosActualizados++;
        } else {
          fiduciariosActualizados++;
        }
      }
    }

    console.log("\n================================================================================");
    console.log("✅ RESULTADO DE LA RECLASIFICACIÓN:");
    console.log(`   🏠 Créditos clasificados como HIPOTECARIOS: ${hipotecariosActualizados}`);
    console.log(`   🤝 Créditos clasificados como FIDUCIARIOS:   ${dbPrestamos.length - hipotecariosActualizados}`);
    console.log("================================================================================\n");

  } finally {
    client.release();
    await pool.end();
  }
}

sincronizar().catch((err) => {
  console.error("Error en sincronización:", err);
  process.exit(1);
});
