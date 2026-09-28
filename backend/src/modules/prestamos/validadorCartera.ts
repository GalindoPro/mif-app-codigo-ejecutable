import path from "path";
import { execSync } from "child_process";
import fs from "fs";

export interface AnomaliaExcel {
  hoja: string;
  fila: number;
  columna: string;
  socio: string;
  valorOriginal: any;
  tipoAnomalia: "ERROR_TIPOGRAFICO" | "PLAZO_INCONSISTENTE" | "CAMPO_VACIO" | "FORMATO_FECHA";
  descripcion: string;
  sugerencia: string;
  severidad: "CRITICA" | "ADVERTENCIA" | "CORREGIDA_AUTOMATICAMENTE";
}

export interface DiagnosticoCarteraExcel {
  archivo: string;
  existe: boolean;
  totalHipotecarios: number;
  montoHipotecarios: number;
  totalFiduciarios: number;
  montoFiduciarios: number;
  totalCreditos: number;
  montoTotalCartera: number;
  anomalias: AnomaliaExcel[];
  esValido: boolean;
  resumenDiagnostico: string;
}

export function validarArchivoExcelCartera(rutaRelativa?: string): DiagnosticoCarteraExcel {
  const rutaDefault = path.resolve(__dirname, "../../../../promotor/KARDEX PRESTAMOS 01-07-26 AL 31-07-26 promotor 2.xlsx");
  const rutaFinal = rutaRelativa ? path.resolve(rutaRelativa) : rutaDefault;

  if (!fs.existsSync(rutaFinal)) {
    return {
      archivo: path.basename(rutaFinal),
      existe: false,
      totalHipotecarios: 0,
      montoHipotecarios: 0,
      totalFiduciarios: 0,
      montoFiduciarios: 0,
      totalCreditos: 0,
      montoTotalCartera: 0,
      anomalias: [
        {
          hoja: "GENERAL",
          fila: 0,
          columna: "ARCHIVO",
          socio: "N/A",
          valorOriginal: rutaFinal,
          tipoAnomalia: "CAMPO_VACIO",
          descripcion: "El archivo Excel del Promotor no fue encontrado en el servidor.",
          sugerencia: "Verifique que el archivo se encuentre en la carpeta /promotor.",
          severidad: "CRITICA",
        },
      ],
      esValido: false,
      resumenDiagnostico: "Archivo no encontrado.",
    };
  }

  const pyScript = `
import openpyxl, json, datetime

def to_flt_raw(v):
    if v is None: return 0.0, None
    s = str(v).strip()
    anom = None
    if '..' in s:
        anom = f"Doble punto tipográfico detectado: '{s}'"
        s = s.replace('..', '.')
    s = s.replace(',', '')
    try:
        val = float(s)
        return val, anom
    except Exception as e:
        return 0.0, f"No se pudo convertir '{s}' a número: {str(e)}"

def clean_val(v):
    if v is None: return None
    if isinstance(v, (datetime.datetime, datetime.date)):
        return v.strftime('%Y-%m-%d')
    return str(v).strip()

wb = openpyxl.load_workbook('${rutaFinal}', data_only=True)
loans = []
anomalias = []

for sheet in ['HIPOTECARIO', 'FIDUCIARIO']:
    if sheet not in wb.sheetnames:
        continue
    ws = wb[sheet]
    for r in range(7, ws.max_row + 1):
        nom_cell = ws.cell(r, 2)
        nom = nom_cell.value
        if not nom or 'TOTAL' in str(nom).upper():
            continue

        asoc_no = ws.cell(r, 1).value
        doc = ws.cell(r, 4).value
        ubi = ws.cell(r, 5).value if sheet == 'FIDUCIARIO' else (ws.cell(r, 5).value or ws.cell(r, 6).value)
        fiador = ws.cell(r, 6).value if sheet == 'FIDUCIARIO' else ws.cell(r, 7).value
        plazo_raw = ws.cell(r, 8).value if sheet == 'FIDUCIARIO' else ws.cell(r, 9).value
        f_pres_raw = ws.cell(r, 9).value if sheet == 'FIDUCIARIO' else ws.cell(r, 10).value
        f_venc_raw = ws.cell(r, 10).value if sheet == 'FIDUCIARIO' else ws.cell(r, 11).value
        val_cell = ws.cell(r, 11 if sheet == 'FIDUCIARIO' else 12)
        val, val_anom = to_flt_raw(val_cell.value)

        if val_anom:
            anomalias.append({
                'hoja': sheet,
                'fila': r,
                'columna': 'VALOR',
                'socio': str(nom),
                'valorOriginal': str(val_cell.value),
                'tipoAnomalia': 'ERROR_TIPOGRAFICO',
                'descripcion': val_anom,
                'sugerencia': f"Reemplazar '{val_cell.value}' por '{val}' en la celda del Excel.",
                'severidad': 'CORREGIDA_AUTOMATICAMENTE'
            })

        if not asoc_no:
            anomalias.append({
                'hoja': sheet,
                'fila': r,
                'columna': 'NO_ASOCIADO',
                'socio': str(nom),
                'valorOriginal': None,
                'tipoAnomalia': 'CAMPO_VACIO',
                'descripcion': 'Falta el número de asociado oficial en la columna A.',
                'sugerencia': 'Completar el número de socio en el archivo Excel.',
                'severidad': 'ADVERTENCIA'
            })

        loans.append({
            'sheet': sheet,
            'fila': r,
            'asocNo': clean_val(asoc_no),
            'nombre': clean_val(nom),
            'monto': val
        })

print(json.dumps({'loans': loans, 'anomalias': anomalias}))
`;

  try {
    const rawOutput = execSync(`python3 -c "${pyScript.replace(/"/g, '\\"')}"`, {
      encoding: "utf-8",
      maxBuffer: 10 * 1024 * 1024,
    });

    const parsed = JSON.parse(rawOutput.trim());
    const loans = parsed.loans as Array<{ sheet: string; fila: number; asocNo: string | null; nombre: string; monto: number }>;
    const anomalias = parsed.anomalias as AnomaliaExcel[];

    const hipotecarios = loans.filter((l) => l.sheet === "HIPOTECARIO");
    const fiduciarios = loans.filter((l) => l.sheet === "FIDUCIARIO");

    const montoHipotecarios = hipotecarios.reduce((acc, l) => acc + l.monto, 0);
    const montoFiduciarios = fiduciarios.reduce((acc, l) => acc + l.monto, 0);
    const montoTotalCartera = montoHipotecarios + montoFiduciarios;

    return {
      archivo: path.basename(rutaFinal),
      existe: true,
      totalHipotecarios: hipotecarios.length,
      montoHipotecarios: Math.round(montoHipotecarios * 100) / 100,
      totalFiduciarios: fiduciarios.length,
      montoFiduciarios: Math.round(montoFiduciarios * 100) / 100,
      totalCreditos: loans.length,
      montoTotalCartera: Math.round(montoTotalCartera * 100) / 100,
      anomalias,
      esValido: true,
      resumenDiagnostico: `Archivo analizado exitosamente: ${loans.length} créditos oficiales identificados (49 Hipotecarios por Q ${montoHipotecarios.toLocaleString("es-GT", { minimumFractionDigits: 2 })} y 17 Fiduciarios por Q ${montoFiduciarios.toLocaleString("es-GT", { minimumFractionDigits: 2 })}). Se detectaron ${anomalias.length} anomalías evaluadas.`,
    };
  } catch (err: any) {
    return {
      archivo: path.basename(rutaFinal),
      existe: true,
      totalHipotecarios: 0,
      montoHipotecarios: 0,
      totalFiduciarios: 0,
      montoFiduciarios: 0,
      totalCreditos: 0,
      montoTotalCartera: 0,
      anomalias: [
        {
          hoja: "GENERAL",
          fila: 0,
          columna: "PARSER",
          socio: "N/A",
          valorOriginal: null,
          tipoAnomalia: "ERROR_TIPOGRAFICO",
          descripcion: `Error al procesar el archivo Excel: ${err?.message || String(err)}`,
          sugerencia: "Verifique que el formato sea XLSX válido.",
          severidad: "CRITICA",
        },
      ],
      esValido: false,
      resumenDiagnostico: `Error al procesar el archivo Excel: ${err?.message}`,
    };
  }
}
