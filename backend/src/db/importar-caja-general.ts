import "dotenv/config";
import { pool } from "./pool";
import { randomUUID } from "crypto";
import path from "path";
import XLSX from "xlsx";

/**
 * Script Oficial de Importación — Fase 6: Libro de Caja General y Arqueos
 *
 * Archivo fuente:
 *   importar/integracionesCaja COMIF CHAJUL 31-07-2026.xlsx
 *
 * Hojas procesadas:
 *   1. "LIBRO DE CAJA (2)" — 2,639 movimientos año 2026 (Enero–Julio)
 *   2. Arqueos históricos (10 arqueos desde 2023 hasta Abril 2026)
 *
 * Totales 2026 a cuadrar:
 *   - Ingresos caja:  Q 11,220,843.10
 *   - Egresos caja:   Q 11,161,637.59
 */

function parseFechaSerial(val: any): string {
  if (!val) return "2026-01-01";
  if (typeof val === "number") {
    const d = new Date(Math.round((val - 25569) * 86400 * 1000));
    return d.toISOString().split("T")[0];
  }
  const s = String(val).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  return "2026-01-01";
}

// Mapeo de descripciones del Excel a tipos internos del sistema
const DESC_TO_TIPO: Record<string, string> = {
  "DEPOSITO DE AHORRO CORRIENTE":               "DEPOSITO_AHORRO",
  "DEPOSITO DE ASOCIADO":                       "DEPOSITO_AHORRO",
  "RETIRO DE AHORRO CORRIENTE":                 "RETIRO_AHORRO",
  "RETIRO DE AHORRO A PLAZO FIJO":              "RETIRO_PLAZO_FIJO",
  "RETIRO DE AHORRO A PLAZO INTERES NETO":      "RETIRO_PLAZO_FIJO",
  "RETIRO DE AHORRO A PLAzo INTERES NETO":      "RETIRO_PLAZO_FIJO",
  "ABONO SOBRE PRESTAMOS HIPOTECARIOS":         "ABONO_HIPOTECARIO",
  "ABONO SOBRE PRESTAMOS FIDUCIARIOS":          "ABONO_FIDUCIARIO",
  "INTERESES HIPOTECARIOS":                     "INTERES_HIPOTECARIO",
  "INTERESES FIDUCIARIOS":                      "INTERES_FIDUCIARIO",
  "MORA SOBRE PRESTAMOS":                       "MORA_PRESTAMO",
  "COMISIONES SOBRE PRESTAMOS":                 "COMISION_PRESTAMO",
  "DESEMBOLSO DE CREDITO":                      "DESEMBOLSO_CREDITO",
  "APORTACION ORDINARIA":                       "APORTACION_ORDINARIA",
  "CUOTA DE INGRESO":                           "CUOTA_INGRESO",
  "GASTOS ADMINISTRATIVOS":                     "GASTO_ADMINISTRATIVO",
  "LIQUIDACION DE CAJA CHICA":                  "GASTO_CAJA_CHICA",
  "COBROS POR CUENTA AJENA BI DEPOSITOS":       "SERVICIO_BANCARIO",
  "COBROS POR CUENTA AJENA BI SERVICIOS":       "SERVICIO_BANCARIO",
  "COBROS POR CUENTA AJENA BI PAQUETIGOS":      "SERVICIO_BANCARIO",
  "PAGOS POR CUENTA AJENA BI REMESA":           "SERVICIO_BANCARIO",
};

interface MovimientoCaja {
  fecha: string;
  anio: number;
  mes: string;
  tipo: "INGRESO" | "EGRESO";
  docNo: string;
  cuentaNo: string;
  nombreBeneficiario: string;
  descripcion: string;
  tipoInterno: string;
  monto: number;
}

interface ArqueoCaja {
  fecha: string;
  nombreHoja: string;
  saldoInicial: number;
  totalIngresos: number;
  totalEgresos: number;
  totalDepositos: number;
  saldoFinal: number;
  observaciones: string;
}

async function ejecutar() {
  const cliente = await pool.connect();

  try {
    console.log("================================================================================");
    console.log("🏦 INICIANDO FASE 6: IMPORTACIÓN DE LIBRO DE CAJA GENERAL Y ARQUEOS");
    console.log("================================================================================\n");

    // 1. Obtener agencia y admin
    const resAgencia = await cliente.query("select id, codigo, nombre from agencias where codigo = 'CHAJUL' limit 1");
    if (resAgencia.rows.length === 0) throw new Error("No se encontró la agencia CHAJUL.");
    const agenciaId = resAgencia.rows[0].id;
    console.log(`📍 Agencia: ${resAgencia.rows[0].nombre}`);

    const resUser = await cliente.query("select id, email from usuarios where rol = 'GERENCIA' or email = 'admin@mif.coop' limit 1");
    if (resUser.rows.length === 0) throw new Error("No se encontró usuario administrador.");
    const adminId = resUser.rows[0].id;
    console.log(`👤 Operador: ${resUser.rows[0].email}\n`);

    // 2. Leer archivo Excel
    const rutaArchivo = path.resolve(__dirname, "../../../importar/integracionesCaja COMIF CHAJUL 31-07-2026.xlsx");
    const wb = XLSX.readFile(rutaArchivo);
    console.log(`📂 Archivo cargado. Hojas disponibles: ${wb.SheetNames.length}`);

    // ===================================================================
    // PASO A: Procesar LIBRO DE CAJA (2) — Movimientos 2026
    // ===================================================================
    console.log("\n--- PASO A: Procesando Libro de Caja General 2026 ---");
    const wsLibro = wb.Sheets["LIBRO DE CAJA (2)"];
    const rowsLibro = XLSX.utils.sheet_to_json(wsLibro, { header: 1 }) as any[][];

    const movimientos: MovimientoCaja[] = [];
    let totalIngBruto = 0;
    let totalEgBruto = 0;

    for (let i = 5; i < rowsLibro.length; i++) {
      const r = rowsLibro[i];
      if (!r || !r[1]) continue;
      const anio = Number(r[1]);
      if (anio !== 2026) continue; // Solo 2026

      const fecha = parseFechaSerial(r[0]);
      const mes = String(r[2] || "01").trim().padStart(2, "0");
      const docNo = r[4] ? String(r[4]).trim() : "";
      const cuentaNo = r[5] ? String(r[5]).trim() : "";
      const nombre = r[6] ? String(r[6]).trim().toUpperCase() : "";
      const descRaw = r[7] ? String(r[7]).trim().toUpperCase() : "";
      const ingreso = Number(r[10]) || 0;
      const egreso = Number(r[11]) || 0;

      if (ingreso === 0 && egreso === 0) continue;

      const tipoInterno = DESC_TO_TIPO[descRaw] ?? "OTRO";
      const tipo: "INGRESO" | "EGRESO" = ingreso > 0 ? "INGRESO" : "EGRESO";
      const monto = ingreso > 0 ? ingreso : egreso;

      movimientos.push({
        fecha,
        anio,
        mes,
        tipo,
        docNo,
        cuentaNo,
        nombreBeneficiario: nombre,
        descripcion: descRaw,
        tipoInterno,
        monto,
      });

      totalIngBruto += ingreso;
      totalEgBruto += egreso;
    }

    console.log(`   ✓ ${movimientos.length} movimientos extraídos del Libro de Caja 2026`);
    console.log(`     ↳ Ingresos brutos: Q ${totalIngBruto.toFixed(2)}`);
    console.log(`     ↳ Egresos brutos:  Q ${totalEgBruto.toFixed(2)}`);

    // Desglose por tipo
    const resumenTipos = new Map<string, { count: number; total: number }>();
    movimientos.forEach(m => {
      const key = `${m.tipo}:${m.tipoInterno}`;
      const e = resumenTipos.get(key) ?? { count: 0, total: 0 };
      e.count++;
      e.total += m.monto;
      resumenTipos.set(key, e);
    });
    console.log("\n   Desglose por tipo de movimiento:");
    [...resumenTipos.entries()].sort((a, b) => b[1].total - a[1].total).forEach(([k, v]) => {
      console.log(`     ${k.padEnd(40)} | ${String(v.count).padStart(4)} movs | Q ${v.total.toFixed(2).padStart(14)}`);
    });

    // ===================================================================
    // PASO B: Procesar Arqueos de Caja históricos
    // ===================================================================
    console.log("\n--- PASO B: Procesando Arqueos de Caja históricos ---");
    const hojasArqueo = wb.SheetNames.filter(n => n.toLowerCase().includes("arqueo"));
    const arqueos: ArqueoCaja[] = [];

    for (const nombreHoja of hojasArqueo) {
      const wsArq = wb.Sheets[nombreHoja];
      const rowsArq = XLSX.utils.sheet_to_json(wsArq, { header: 1 }) as any[][];

      // Extraer fecha del nombre de hoja (ej: "Arqueo Caja Ag Chaj 22-04-2026")
      const fechaMatch = nombreHoja.match(/(\d{2})-(\d{2})-(\d{4})/);
      const fechaArqueo = fechaMatch
        ? `${fechaMatch[3]}-${fechaMatch[2]}-${fechaMatch[1]}`
        : "2026-01-01";

      // Buscar totales en las filas del arqueo
      let saldoInicial = 0, totalIngresos = 0, totalEgresos = 0, totalDepositos = 0, saldoFinal = 0;

      for (let i = 0; i < rowsArq.length; i++) {
        const r = rowsArq[i];
        if (!r) continue;
        const texto = r.map((c: any) => String(c || "").trim().toLowerCase()).join(" ");

        // Buscar saldo inicial
        if (texto.includes("saldo inicial") || texto.includes("saldo anterior")) {
          for (let j = i; j < Math.min(i + 3, rowsArq.length); j++) {
            const rr = rowsArq[j];
            if (!rr) continue;
            for (const cell of rr) {
              const n = Number(cell);
              if (!isNaN(n) && n > 1000) { saldoInicial = Math.max(saldoInicial, n); break; }
            }
          }
        }

        // Buscar totales de ingresos y egresos
        if (texto.includes("total") || texto.includes("gran total")) {
          const nums = (r as any[]).map((c: any) => Number(c)).filter(n => !isNaN(n) && n > 0);
          if (nums.length >= 2) {
            totalIngresos = Math.max(totalIngresos, nums[0] || 0);
            totalEgresos = Math.max(totalEgresos, nums[1] || 0);
          }
        }

        // Buscar depósitos bancarios
        if (texto.includes("deposit") && texto.includes("banco")) {
          const nums = (r as any[]).map((c: any) => Number(c)).filter(n => !isNaN(n) && n > 0);
          if (nums.length > 0) totalDepositos = Math.max(totalDepositos, nums[0]);
        }

        // Saldo final
        if (texto.includes("saldo final") || texto.includes("efectivo en caja")) {
          const nums = (r as any[]).map((c: any) => Number(c)).filter(n => !isNaN(n) && n > 0);
          if (nums.length > 0) saldoFinal = Math.max(saldoFinal, nums[0]);
        }
      }

      arqueos.push({
        fecha: fechaArqueo,
        nombreHoja,
        saldoInicial,
        totalIngresos,
        totalEgresos,
        totalDepositos,
        saldoFinal,
        observaciones: `Arqueo importado de hoja: ${nombreHoja}`,
      });

      console.log(`   • ${nombreHoja} | Fecha: ${fechaArqueo} | S.Inicial: Q${saldoInicial.toFixed(0)} | Depósitos: Q${totalDepositos.toFixed(0)}`);
    }

    // ===================================================================
    // PASO C: Insertar en Base de Datos
    // ===================================================================
    console.log("\n--- PASO C: Insertando en base de datos ---");
    await cliente.query("BEGIN");

    // Verificar si la tabla movimientos_caja existe
    const existeTabla = await cliente.query(`
      select exists (
        select 1 from information_schema.tables
        where table_schema = 'public' and table_name = 'movimientos_caja'
      ) as existe
    `);

    if (!existeTabla.rows[0].existe) {
      console.log("   ⚙️  Creando tabla movimientos_caja...");
      await cliente.query(`
        create table if not exists movimientos_caja (
          id            uuid primary key default gen_random_uuid(),
          agencia_id    uuid not null references agencias(id),
          fecha         date not null,
          anio          int not null,
          mes           varchar(2) not null,
          tipo          varchar(10) not null check (tipo in ('INGRESO','EGRESO')),
          tipo_interno  varchar(50) not null,
          doc_no        varchar(30),
          cuenta_no     varchar(30),
          nombre_beneficiario text,
          descripcion   text,
          monto         numeric(14,2) not null,
          es_migracion  boolean default false,
          usuario_id    uuid references usuarios(id),
          creado_en     timestamptz default now()
        );
        create index if not exists idx_movcaja_agencia_fecha on movimientos_caja(agencia_id, fecha);
        create index if not exists idx_movcaja_tipo on movimientos_caja(tipo_interno);
      `);
      console.log("   ✓ Tabla movimientos_caja creada.");
    }

    // Verificar tabla arqueos_caja
    const existeArqueos = await cliente.query(`
      select exists (
        select 1 from information_schema.tables
        where table_schema = 'public' and table_name = 'arqueos_caja'
      ) as existe
    `);

    if (!existeArqueos.rows[0].existe) {
      console.log("   ⚙️  Creando tabla arqueos_caja...");
      await cliente.query(`
        create table if not exists arqueos_caja (
          id              uuid primary key default gen_random_uuid(),
          agencia_id      uuid not null references agencias(id),
          fecha           date not null,
          nombre_hoja     varchar(100),
          saldo_inicial   numeric(14,2) default 0,
          total_ingresos  numeric(14,2) default 0,
          total_egresos   numeric(14,2) default 0,
          total_depositos numeric(14,2) default 0,
          saldo_final     numeric(14,2) default 0,
          observaciones   text,
          es_migracion    boolean default true,
          usuario_id      uuid references usuarios(id),
          creado_en       timestamptz default now()
        );
        create index if not exists idx_arqueos_agencia_fecha on arqueos_caja(agencia_id, fecha);
      `);
      console.log("   ✓ Tabla arqueos_caja creada.");
    }

    // Batch insert movimientos_caja (2,639 en un solo query)
    console.log(`\n   Insertando ${movimientos.length} movimientos en movimientos_caja (batch)...`);
    {
      const ids = movimientos.map(() => randomUUID());
      const agIds = movimientos.map(() => agenciaId);
      const fechas = movimientos.map(m => m.fecha);
      const anios = movimientos.map(m => m.anio);
      const meses = movimientos.map(m => m.mes);
      const tipos = movimientos.map(m => m.tipo);
      const tiposInt = movimientos.map(m => m.tipoInterno);
      const docNos = movimientos.map(m => m.docNo);
      const cuentas = movimientos.map(m => m.cuentaNo);
      const nombres = movimientos.map(m => m.nombreBeneficiario);
      const descs = movimientos.map(m => m.descripcion);
      const montos = movimientos.map(m => m.monto);
      const usrIds = movimientos.map(() => adminId);

      await cliente.query(
        `insert into movimientos_caja (
          id, agencia_id, fecha, anio, mes, tipo, tipo_interno,
          doc_no, cuenta_no, nombre_beneficiario, descripcion,
          monto, es_migracion, usuario_id
        )
        select
          unnest($1::uuid[]), unnest($2::uuid[]), unnest($3::date[]),
          unnest($4::int[]), unnest($5::text[]), unnest($6::text[]),
          unnest($7::text[]), unnest($8::text[]), unnest($9::text[]),
          unnest($10::text[]), unnest($11::text[]),
          unnest($12::numeric[]), true, unnest($13::uuid[])`,
        [ids, agIds, fechas, anios, meses, tipos, tiposInt, docNos, cuentas, nombres, descs, montos, usrIds]
      );
      console.log(`   ✓ ${movimientos.length} movimientos insertados en movimientos_caja.`);
    }

    // Insertar arqueos históricos
    console.log(`\n   Insertando ${arqueos.length} arqueos históricos...`);
    {
      const ids = arqueos.map(() => randomUUID());
      const agIds = arqueos.map(() => agenciaId);
      const fechas = arqueos.map(a => a.fecha);
      const hojas = arqueos.map(a => a.nombreHoja);
      const sInic = arqueos.map(a => a.saldoInicial);
      const tIng = arqueos.map(a => a.totalIngresos);
      const tEg = arqueos.map(a => a.totalEgresos);
      const tDep = arqueos.map(a => a.totalDepositos);
      const sFin = arqueos.map(a => a.saldoFinal);
      const obs = arqueos.map(a => a.observaciones);
      const usrIds = arqueos.map(() => adminId);

      await cliente.query(
        `insert into arqueos_caja (
          id, agencia_id, fecha, nombre_hoja, saldo_inicial,
          total_ingresos, total_egresos, total_depositos, saldo_final,
          observaciones, es_migracion, usuario_id
        )
        select
          unnest($1::uuid[]), unnest($2::uuid[]), unnest($3::date[]),
          unnest($4::text[]), unnest($5::numeric[]),
          unnest($6::numeric[]), unnest($7::numeric[]), unnest($8::numeric[]),
          unnest($9::numeric[]), unnest($10::text[]), true, unnest($11::uuid[])`,
        [ids, agIds, fechas, hojas, sInic, tIng, tEg, tDep, sFin, obs, usrIds]
      );
      console.log(`   ✓ ${arqueos.length} arqueos históricos insertados.`);
    }

    await cliente.query("COMMIT");

    // ===================================================================
    // AUDITORÍA FINAL
    // ===================================================================
    console.log("\n================================================================================");
    console.log("📊 INFORME DE AUDITORÍA — FASE 6: CAJA GENERAL");
    console.log("================================================================================");

    const resMovs = await cliente.query(`
      select tipo, tipo_interno, count(*)::int as movs, sum(monto)::numeric as total
      from movimientos_caja
      where agencia_id = $1 and es_migracion = true
      group by tipo, tipo_interno
      order by total desc
    `, [agenciaId]);

    let totalIngBD = 0, totalEgBD = 0;
    console.log("\nDesglose de Movimientos de Caja en Base de Datos:");
    resMovs.rows.forEach(r => {
      const t = parseFloat(r.total);
      if (r.tipo === "INGRESO") totalIngBD += t;
      else totalEgBD += t;
      console.log(`  [${r.tipo}] ${r.tipo_interno.padEnd(28)} | ${String(r.movs).padStart(4)} movs | Q ${t.toFixed(2).padStart(14)}`);
    });

    const esperadoIng = 11220843.10;
    const esperadoEg  = 11161637.59;
    const diffIng = Math.abs(totalIngBD - esperadoIng);
    const diffEg  = Math.abs(totalEgBD  - esperadoEg);

    console.log("--------------------------------------------------------------------------------");
    console.log(`  Total Ingresos Caja: Q ${totalIngBD.toFixed(2).padStart(14)} (Esperado: Q ${esperadoIng.toFixed(2)}) → Diff: Q ${diffIng.toFixed(2)} ${diffIng === 0 ? "✅" : "⚠️"}`);
    console.log(`  Total Egresos  Caja: Q ${totalEgBD.toFixed(2).padStart(14)} (Esperado: Q ${esperadoEg.toFixed(2)})  → Diff: Q ${diffEg.toFixed(2)}  ${diffEg === 0 ? "✅" : "⚠️"}`);
    console.log(`  Arqueos registrados: ${arqueos.length}`);
    console.log("================================================================================\n");

  } catch (error) {
    await cliente.query("ROLLBACK");
    console.error("❌ ERROR CRÍTICO EN FASE 6:", error);
    process.exit(1);
  } finally {
    cliente.release();
    await pool.end();
  }
}

ejecutar();
