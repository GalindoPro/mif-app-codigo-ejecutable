import "dotenv/config";
import path from "path";
import openpyxl from "child_process";
import { pool } from "./pool";

interface PrestamoOficialExcel {
  sheet: "HIPOTECARIO" | "FIDUCIARIO";
  asocNo: string | null;
  nombre: string;
  doc: string | null;
  ubicacion: string | null;
  fiador: string | null;
  plazoRaw: string | null;
  plazoMeses: number;
  fechaDesembolso: string | null;
  fechaVencimiento: string | null;
  monto: number;
  saldo: number;
}

function parsePlazoMeses(raw: string | null): number {
  if (!raw) return 12;
  const s = raw.toUpperCase().trim();
  if (s.includes("15")) return 180;
  if (s.includes("10")) return 120;
  if (s.includes("8")) return 96;
  if (s.includes("7")) return 84;
  if (s.includes("5")) return 60;
  if (s.includes("4")) return 48;
  if (s.includes("1 Y 1/2") || s.includes("1 CON 6") || s.includes("1 ANO CON 6") || s.includes("1 AÑO CON 6")) return 18;
  if (s.includes("1 CON 3") || s.includes("1 ANO CON 3") || s.includes("1 AÑO CON 3")) return 15;
  if (s.includes("3")) return 36;
  if (s.includes("2")) return 24;
  if (s.includes("1")) return 12;
  return 12;
}

export async function reestructurarCartera() {
  const client = await pool.connect();
  try {
    console.log("================================================================================");
    console.log("🚀 REESTRUCTURACIÓN OFICIAL DE CARTERA: FIDELIDAD 1 A 1 AL EXCEL DEL PROMOTOR");
    console.log("================================================================================\n");

    // 1. Asegurar columna origen_cartera
    await client.query(`
      ALTER TABLE prestamos ADD COLUMN IF NOT EXISTS origen_cartera varchar(50) DEFAULT 'OFICIAL_PROMOTOR';
    `);

    const excelPath = path.resolve(__dirname, "../../../promotor/KARDEX PRESTAMOS 01-07-26 AL 31-07-26 promotor 2.xlsx");

    // Script Python para leer fielmente las hojas oficiales
    const pyScript = `
import openpyxl, json, datetime

def to_flt(v):
    if not v: return 0.0
    s = str(v).replace(',', '').strip()
    if '..' in s: s = s.replace('..', '.')
    try: return float(s)
    except: return 0.0

def clean_val(v):
    if v is None: return None
    if isinstance(v, (datetime.datetime, datetime.date)):
        return v.strftime('%Y-%m-%d')
    return str(v).strip()

wb = openpyxl.load_workbook('${excelPath}', data_only=True)
loans = []
for sheet in ['HIPOTECARIO', 'FIDUCIARIO']:
    if sheet not in wb.sheetnames: continue
    ws = wb[sheet]
    for r in range(7, ws.max_row + 1):
        nom = ws.cell(r, 2).value
        if not nom or 'TOTAL' in str(nom).upper(): continue
        asoc_no = ws.cell(r, 1).value
        doc = ws.cell(r, 4).value
        ubi = ws.cell(r, 5).value if sheet == 'FIDUCIARIO' else (ws.cell(r, 5).value or ws.cell(r, 6).value)
        fiador = ws.cell(r, 6).value if sheet == 'FIDUCIARIO' else ws.cell(r, 7).value
        plazo = ws.cell(r, 8).value if sheet == 'FIDUCIARIO' else ws.cell(r, 9).value
        f_pres = ws.cell(r, 9).value if sheet == 'FIDUCIARIO' else ws.cell(r, 10).value
        f_venc = ws.cell(r, 10).value if sheet == 'FIDUCIARIO' else ws.cell(r, 11).value
        val = to_flt(ws.cell(r, 11 if sheet == 'FIDUCIARIO' else 12).value)
        saldo = to_flt(ws.cell(r, 12 if sheet == 'FIDUCIARIO' else 13).value) or val
        loans.append({
            'sheet': sheet,
            'asocNo': clean_val(asoc_no),
            'nombre': clean_val(nom),
            'doc': clean_val(doc),
            'ubicacion': clean_val(ubi),
            'fiador': clean_val(fiador),
            'plazoRaw': clean_val(plazo),
            'fechaDesembolso': clean_val(f_pres),
            'fechaVencimiento': clean_val(f_venc),
            'monto': val,
            'saldo': saldo
        })
print(json.dumps(loans))
`;

    const rawJson = openpyxl.execSync(`python3 -c "${pyScript.replace(/"/g, '\\"')}"`, {
      maxBuffer: 50 * 1024 * 1024,
    }).toString();

    const excelLoans: PrestamoOficialExcel[] = JSON.parse(rawJson).map((l: any) => ({
      ...l,
      plazoMeses: parsePlazoMeses(l.plazoRaw),
    }));

    console.log(`📊 Leídos del Excel Oficial: ${excelLoans.length} créditos legítimos.`);
    const hipExcel = excelLoans.filter(l => l.sheet === "HIPOTECARIO");
    const fidExcel = excelLoans.filter(l => l.sheet === "FIDUCIARIO");
    const totalMontoHip = hipExcel.reduce((acc, l) => acc + l.monto, 0);
    const totalMontoFid = fidExcel.reduce((acc, l) => acc + l.monto, 0);
    console.log(`   🏡 Hipotecarios: ${hipExcel.length} créditos | Monto: Q ${totalMontoHip.toLocaleString("es-GT", { minimumFractionDigits: 2 })}`);
    console.log(`   🤝 Fiduciarios:   ${fidExcel.length} créditos | Monto: Q ${totalMontoFid.toLocaleString("es-GT", { minimumFractionDigits: 2 })}`);
    console.log(`   💰 TOTAL CARTERA OFICIAL: Q ${(totalMontoHip + totalMontoFid).toLocaleString("es-GT", { minimumFractionDigits: 2 })}\n`);

    // Consultar todos los préstamos actuales en la base de datos
    const { rows: dbPrestamos } = await client.query<{
      id: string;
      codigo: string;
      socio_id: string;
      socio_nombres: string;
    }>(`
      select p.id, p.codigo, p.socio_id, s.nombres as socio_nombres
      from prestamos p
      join socios s on s.id = p.socio_id
      order by p.codigo asc
    `);

    const { rows: agRows } = await client.query<{ id: string }>(
      "select id from agencias where codigo = 'CHAJUL' or upper(nombre) like '%CHAJUL%' limit 1"
    );
    const agenciaId = agRows[0]?.id;

    const { rows: uRows } = await client.query<{ id: string }>(
      "select id from usuarios where rol in ('GERENCIA', 'ADMIN') order by id asc limit 1"
    );
    const adminId = uRows[0]?.id;

    console.log(`🔍 Analizando ${dbPrestamos.length} créditos existentes en base de datos...`);

    // Marcar inicialmente todos como POR_REGULARIZAR
    await client.query(`update prestamos set origen_cartera = 'POR_REGULARIZAR'`);

    let oficialesVinculados = 0;
    const prestamosAsignados = new Set<string>();

    for (const el of excelLoans) {
      const elNom = el.nombre.toUpperCase().trim();

      // Buscar préstamo en DB por nombre de socio
      const match = dbPrestamos.find((dp) => {
        if (prestamosAsignados.has(dp.id)) return false;
        const dpNom = dp.socio_nombres.toUpperCase().trim();
        return dpNom === elNom || dpNom.includes(elNom) || elNom.includes(dpNom);
      });

      if (match) {
        prestamosAsignados.add(match.id);
        oficialesVinculados++;

        // Actualizar datos exactos al pie de la letra
        await client.query(
          `update prestamos
           set origen_cartera = 'OFICIAL_PROMOTOR',
               tipo = $1,
               monto_solicitado = $2,
               monto_aprobado = $2,
               saldo_capital = $3,
               plazo_meses = $4,
               fecha_desembolso = coalesce($5::date, fecha_desembolso),
               fecha_vencimiento = coalesce($6::date, fecha_vencimiento),
               documento_desembolso = coalesce($7, documento_desembolso),
               numero_credito_anterior = coalesce($8, numero_credito_anterior),
               ubicacion_garantia = coalesce($9, ubicacion_garantia),
               nombre_fiador = coalesce($10, nombre_fiador),
               observaciones = 'Crédito oficial registrado en el Kardex del Promotor de Negocios'
           where id = $11`,
          [
            el.sheet,
            el.monto,
            el.saldo,
            el.plazoMeses,
            el.fechaDesembolso,
            el.fechaVencimiento,
            el.doc,
            el.asocNo,
            el.ubicacion || (el.sheet === "HIPOTECARIO" ? "Inmueble Chajul" : "Comunidad Chajul"),
            el.fiador || (el.sheet === "HIPOTECARIO" ? "Garantía Hipotecaria (Inmueble / Terreno)" : "Fiador solidario"),
            match.id,
          ]
        );
      } else {
        // El crédito oficial del Excel no estaba en la BD -> Insertarlo con precisión
        // 1. Obtener o crear socio
        const { rows: sMatch } = await client.query<{ id: string }>(
          `select id from socios where upper(trim(nombres)) = $1 or upper(trim(nombres)) like $2 limit 1`,
          [elNom, `%${elNom}%`]
        );
        let socioId = sMatch[0]?.id;
        if (!socioId) {
          const { rows: maxSocio } = await client.query(
            "select numero_asociado from socios where numero_asociado like 'CHAJ-%' order by numero_asociado desc limit 1"
          );
          const ultNum = maxSocio[0] ? parseInt(maxSocio[0].numero_asociado.replace("CHAJ-", ""), 10) : 0;
          const nuevoCod = `CHAJ-${String(ultNum + 1).padStart(5, "0")}`;
          const { rows: newS } = await client.query(
            `insert into socios (numero_asociado, agencia_id, nombres, genero, fecha_ingreso, estado, direccion)
             values ($1, $2, $3, 'M', '2026-01-01', 'ACTIVO', 'Agencia Chajul') returning id`,
            [nuevoCod, agenciaId, el.nombre]
          );
          socioId = newS[0].id;
        }

        // 2. Correlativo de crédito
        const { rows: maxCred } = await client.query(
          "select codigo from prestamos where codigo like 'CHAJ-CR-%' order by codigo desc limit 1"
        );
        const ultCredNum = maxCred[0] ? parseInt(maxCred[0].codigo.replace("CHAJ-CR-", ""), 10) : 0;
        const nuevoCodigoCred = `CHAJ-CR-${String(ultCredNum + 1).padStart(4, "0")}`;

        // 3. Cuota mensual estimada
        const r = 0.02;
        const n = el.plazoMeses;
        const cuota = (el.monto * (r * Math.pow(1 + r, n))) / (Math.pow(1 + r, n) - 1);
        const cuotaRedondeada = Math.round(cuota * 100) / 100;

        await client.query(
          `insert into prestamos (
             codigo, socio_id, agencia_id, promotor_id, tipo, estado, tipo_amortizacion,
             monto_solicitado, monto_aprobado, saldo_capital, tasa_interes_mensual, plazo_meses, cuota_mensual,
             fecha_solicitud, fecha_aprobacion, fecha_desembolso, fecha_vencimiento, documento_desembolso,
             numero_credito_anterior, ubicacion_garantia, nombre_fiador, origen_cartera, observaciones
           ) values (
             $1, $2, $3, $4, $5, 'DESEMBOLSADO', 'CUOTA_NIVELADA',
             $6, $6, $7, 2.0, $8, $9,
             coalesce($10::date, '2026-01-20'::date), coalesce($10::date, '2026-01-20'::date),
             coalesce($10::date, '2026-01-20'::date), $11::date, $12,
             $13, $14, $15, 'OFICIAL_PROMOTOR', 'Crédito oficial registrado en el Kardex del Promotor de Negocios'
           )`,
          [
            nuevoCodigoCred,
            socioId,
            agenciaId,
            adminId,
            el.sheet,
            el.monto,
            el.saldo,
            el.plazoMeses,
            cuotaRedondeada,
            el.fechaDesembolso,
            el.fechaVencimiento,
            el.doc,
            el.asocNo,
            el.ubicacion || (el.sheet === "HIPOTECARIO" ? "Inmueble Chajul" : "Comunidad Chajul"),
            el.fiador || (el.sheet === "HIPOTECARIO" ? "Garantía Hipotecaria (Inmueble / Terreno)" : "Fiador solidario"),
          ]
        );
        oficialesVinculados++;
      }
    }

    const { rows: conteos } = await client.query<{ origen_cartera: string; count: string; total_monto: string; total_saldo: string }>(`
      select origen_cartera, count(*), sum(monto_aprobado) as total_monto, sum(saldo_capital) as total_saldo
      from prestamos
      group by origen_cartera
      order by origen_cartera desc
    `);

    console.log("\n================================================================================");
    console.log("✅ RESULTADO DE LA REESTRUCTURACIÓN:");
    for (const c of conteos) {
      console.log(`   • ${c.origen_cartera}: ${c.count} créditos | Monto: Q ${Number(c.total_monto).toLocaleString("es-GT", { minimumFractionDigits: 2 })} | Saldo: Q ${Number(c.total_saldo).toLocaleString("es-GT", { minimumFractionDigits: 2 })}`);
    }
    console.log("================================================================================\n");

  } finally {
    client.release();
  }
}

if (require.main === module) {
  reestructurarCartera()
    .then(() => {
      console.log("Reestructuración finalizada exitosamente.");
      process.exit(0);
    })
    .catch((err) => {
      console.error("Error en reestructuración:", err);
      process.exit(1);
    });
}
