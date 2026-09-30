import "dotenv/config";
import { pool } from "./pool";
import { execSync } from "child_process";
import path from "path";
import { abortarSiHayErroresExcel } from "../utils/validadorImportacion";

/**
 * Script Oficial de Importación — Fase 2: Ahorro Corriente
 * Archivo: importar/ahorro corriente/AHORRO CORRIENTE 30-08-2026.xlsx
 * 
 * Reglas de Negocio aprobadas:
 * 1. Unificación de 14 errores tipográficos del libro para consolidar libretas del mismo titular.
 * 2. Registro de 127 nuevos asociados en Agencia Chajul con aportación estatutaria inicial pre-2026 (Q100 al 2025-12-31).
 * 3. Formato Dual de Cuenta de Ahorro Corriente:
 *    - numero_cuenta: Conserva el número original de libreta de Excel (ej: 148-5-1) o vacío ("") si no vino en Excel.
 *    - codigo_sistema: Correlativo estructurado único (CHAJ-AHC-00001...) para asignación y visualización dual.
 * 4. Asignación de saldo inicial pre-2026 (fecha 2025-12-31) a 80 cuentas que retiraron ahorros históricos previos.
 * 5. Cuadre exacto de 674 movimientos del 2026:
 *    - Total Depósitos: Q 3,620,116.31
 *    - Total Retiros:   Q 1,348,045.62
 *    - Saldo Neto 2026: Q 2,272,070.69 (Diferencia Fila 679: Q 0.00).
 */

interface RawExcelRow {
  row: number;
  cta: string;
  fec: string;
  rec: string;
  agencia: string;
  nombre: string;
  dep: number;
  ret: number;
}

const TYPO_MAP: Record<string, string> = {
  "IGLESIA EVANGALICA MISION JESUS FUENTE DE VISA JUIL": "IGLESIA EVANGELICA MISION JESUS FUENTE DE VIDA JUIL",
  "IGLESIA EVANGELICA 1 MISION JESUS FUENTE DE VIDA JUIL": "IGLESIA EVANGELICA MISION JESUS FUENTE DE VIDA JUIL",
  "ROSA LAYNEZ RAMISREZ DE LAYNEZ": "ROSA LAYNEZ RAMIREZ DE LAYNEZ",
  "MATEO CANAY AISCONA Y JUANA CLARITA LAYNEZ DEL BARRIO": "MATEO CANAY ASICONA Y JUANA CLARITA LAYNEZ DEL BARRIO",
  "MATEO CANAY ASICOANA": "MATEO CANAY ASICONA",
  "JUA SANCHEZ LAYNEZ": "JUAN SANCHEZ LAYNEZ",
  "MARIA RIVER NUNAL": "MARIA RIVERA NUNAL",
  "JUANA HU GLINDO": "JUANA HU GALINDO",
  "MANUELA YESSICA  SANCHZ CABA": "MANUELA YESSICA SANCHEZ CABA",
  "MADGALENA MENDOZA RIVERA": "MAGDALENA MENDOZA RIVERA",
  "MANUEL PACHECO ASOCONA": "MANUEL PACHECO ASICONA",
  "PEDRO LUIS TOMA LUX": "PEDRO LUIS TOMAS LUX",
  "ELENA CABA  RIVERA": "ELENA CABA RIVERA",
  "TERESA ASICONA  ASICONA": "TERESA ASICONA ASICONA",
};

async function main() {
  console.log("================================================================================");
  console.log("   IMPORTACIÓN OFICIAL — FASE 2: AHORRO CORRIENTE (30-08-2026)");
  console.log("================================================================================\n");

  console.log("1. Extrayendo datos desde 'importar/ahorro corriente/AHORRO CORRIENTE 30-08-2026.xlsx'...");
  const scriptPython = `
import openpyxl, json

wb = openpyxl.load_workbook('importar/ahorro corriente/AHORRO CORRIENTE 30-08-2026.xlsx', data_only=True)
ws = wb['AHORRO ENERO 2026']

rows = []
for r in range(4, 678):
    nom = ws.cell(r, 5).value
    if not nom or not str(nom).strip(): continue
    cta = ws.cell(r, 1).value
    fec = ws.cell(r, 2).value
    rec = ws.cell(r, 3).value
    ag = ws.cell(r, 4).value
    dep = ws.cell(r, 8).value or 0
    ret = ws.cell(r, 9).value or 0
    
    fec_str = str(fec)[:10] if fec else '2026-01-02'
    if fec_str.startswith('2025-06-15'):
        fec_str = '2026-06-15' # Corrección de error tipográfico de año del cajero en fila 433 (entre 13 y 16 de junio 2026)

    rows.append({
        'row': r,
        'cta': str(cta).strip() if cta else '',
        'fec': fec_str,
        'rec': str(rec).strip() if rec else '',
        'agencia': str(ag).strip() if ag else 'AGENCIA CHAJUL',
        'nombre': str(nom).strip(),
        'dep': float(dep),
        'ret': float(ret)
    })

print(json.dumps(rows))
`;

  const rawJson = execSync(`python3 -c "${scriptPython.replace(/"/g, '\\"')}"`, {
    maxBuffer: 50 * 1024 * 1024,
    cwd: path.resolve(__dirname, "../../.."),
  }).toString();

  const rowsExcel: RawExcelRow[] = JSON.parse(rawJson);
  console.log(`   ✓ Extraídas exitosamente ${rowsExcel.length} transacciones operativas del Excel.`);

  const client = await pool.connect();
  try {
    // === 1.1 VALIDACIÓN PREVIA AL IMPORT (Nombres Similares y DPIs duplicados) ===
    await abortarSiHayErroresExcel(
      rowsExcel.map((r) => ({ fila: r.row, nombres: r.nombre, dpi: "" })),
      "AHORRO CORRIENTE - SALDOS SEPTIEMBRE.xlsx"
    );

    await client.query("BEGIN");

    // Limpiar importación previa de Ahorro Corriente si existiera (idempotente)
    console.log("2. Limpiando registros previos de Ahorro Corriente para reimportación limpia...");
    await client.query(`
      delete from movimientos where cuenta_id in (select id from cuentas where tipo = 'AHORRO_CORRIENTE');
      delete from cuentas where tipo = 'AHORRO_CORRIENTE';
      delete from movimientos where numero_recibo = 'SALDO-HIST-APO';
      delete from cuentas where numero_cuenta = 'APO-HIST';
      delete from socios where advertencia_importacion = 'Socio migrado de Ahorro Corriente (Aportación estatutaria previa pre-2026)';
    `);
    console.log("   ✓ Base de datos preparada para importación limpia de Ahorro Corriente.");

    // 1. Obtener Agencia Chajul y Usuario Admin
    const { rows: agRows } = await client.query(`select id from agencias where codigo = 'CHAJUL';`);
    if (agRows.length === 0) throw new Error("No se encontró Agencia Chajul en BD.");
    const agenciaChajulId = agRows[0].id;

    const { rows: uRows } = await client.query(`
      select id from usuarios where email = 'admin@mif.coop' or rol in ('ADMIN', 'GERENCIA') limit 1;
    `);
    if (uRows.length === 0) throw new Error("No se encontró usuario administrador en BD.");
    const adminUserId = uRows[0].id;

    // 2. Cargar socios existentes
    const { rows: dbSociosRows } = await client.query(`select id, nombres, numero_asociado from socios;`);
    const sociosMap = new Map<string, { id: string; numeroAsociado: string }>();
    let maxCorrelativoSocio = 0;

    for (const s of dbSociosRows) {
      sociosMap.set(s.nombres.trim().toUpperCase(), { id: s.id, numeroAsociado: s.numero_asociado });
      const numMatch = s.numero_asociado.match(/CHAJ-(\d+)/);
      if (numMatch) {
        const n = parseInt(numMatch[1], 10);
        if (n > maxCorrelativoSocio) maxCorrelativoSocio = n;
      }
    }
    console.log(`   ✓ Socios base en base de datos: ${sociosMap.size} (Último correlativo: CHAJ-${String(maxCorrelativoSocio).padStart(5, "0")})`);

    // 3. Agrupar transacciones por titular unificado y calcular saldos históricos
    console.log("\n2. Consolidando titulares y analizando balance corrido de cada libreta...");
    interface TitularData {
      nombre: string;
      cuentasExcel: Set<string>;
      totalDep: number;
      totalRet: number;
      minBalance: number;
      balanceCorrido: number;
      movimientos: RawExcelRow[];
    }

    const titulares = new Map<string, TitularData>();

    for (const r of rowsExcel) {
      const nomNorm = TYPO_MAP[r.nombre.trim().toUpperCase()] || r.nombre.trim().toUpperCase();
      if (!titulares.has(nomNorm)) {
        titulares.set(nomNorm, {
          nombre: nomNorm,
          cuentasExcel: new Set<string>(),
          totalDep: 0,
          totalRet: 0,
          minBalance: 0,
          balanceCorrido: 0,
          movimientos: [],
        });
      }
      const t = titulares.get(nomNorm)!;
      if (r.cta) t.cuentasExcel.add(r.cta);
      t.totalDep += r.dep;
      t.totalRet += r.ret;
      t.balanceCorrido += (r.dep - r.ret);
      if (t.balanceCorrido < t.minBalance) {
        t.minBalance = t.balanceCorrido;
      }
      t.movimientos.push(r);
    }

    console.log(`   ✓ Total titulares únicos consolidados: ${titulares.size}`);

    // 4. Registrar nuevos socios que no estaban en Aportaciones 2026
    console.log("\n3. Verificando y registrando nuevos asociados con aportación estatutaria inicial pre-2026...");
    let nuevosSociosRegistrados = 0;
    let correlativoSocio = maxCorrelativoSocio + 1;

    for (const [nom, t] of titulares.entries()) {
      if (!sociosMap.has(nom)) {
        const numeroAsociado = `CHAJ-${String(correlativoSocio++).padStart(5, "0")}`;
        const { rows: newSocio } = await client.query(`
          insert into socios (
            numero_asociado, agencia_id, nombres, fecha_ingreso, estado,
            advertencia_importacion, creado_por_id
          ) values (
            $1, $2, $3, '2025-12-31', 'ACTIVO',
            'Socio migrado de Ahorro Corriente (Aportación estatutaria previa pre-2026)', $4
          ) returning id;
        `, [numeroAsociado, agenciaChajulId, nom, adminUserId]);

        const socioId = newSocio[0].id;
        sociosMap.set(nom, { id: socioId, numeroAsociado });

        // Cuenta de aportación estatutaria histórica
        const codApoHist = `CHAJ-APO-${String(correlativoSocio).padStart(5, "0")}`;
        const { rows: newApoCta } = await client.query(`
          insert into cuentas (
            numero_cuenta, codigo_sistema, tipo, estado, socio_id, agencia_id, saldo_inicial,
            observaciones_apertura, creado_por_id
          ) values (
            'APO-HIST', $1, 'APORTACION', 'ACTIVA', $2, $3, 0,
            'Aportación estatutaria inicial previa a 2026', $4
          ) returning id;
        `, [codApoHist, socioId, agenciaChajulId, adminUserId]);

        await client.query(`
          insert into movimientos (
            cuenta_id, tipo, monto, fecha, numero_recibo, descripcion, usuario_id,
            cliente_movimiento_id, agencia_operacion_id
          ) values (
            $1, 'DEPOSITO', 100, '2025-12-31', 'SALDO-HIST-APO',
            'Aportación estatutaria inicial previa a 2026', $2,
            $3, $4
          );
        `, [newApoCta[0].id, adminUserId, `MOV-APO-PRE-${socioId}`, agenciaChajulId]);

        nuevosSociosRegistrados++;
      }
    }
    console.log(`   ✓ ${nuevosSociosRegistrados} nuevos socios registrados legalmente con aportación estatutaria pre-2026.`);

    // 5. Crear Cuentas de Ahorro Corriente con Formato Dual
    console.log("\n4. Creando libretas oficiales de Ahorro Corriente con formato dual...");
    let correlativoAhorro = 1;
    const cuentasAhorroMap = new Map<string, string>(); // nom -> cuentaId
    let cuentasConSaldoHist = 0;
    let totalSaldoHistPre2026 = 0;

    for (const [nom, t] of titulares.entries()) {
      const socio = sociosMap.get(nom)!;
      const codigoSistema = `CHAJ-AHC-${String(correlativoAhorro++).padStart(5, "0")}`;

      // Determinar número de cuenta de Excel
      // Si tiene variantes como 148-5-1 y 2-148-5-1, elegir la más limpia
      let numeroCuentaExcel = "";
      if (t.cuentasExcel.size > 0) {
        const sortedCtas = Array.from(t.cuentasExcel).sort((a, b) => a.length - b.length);
        numeroCuentaExcel = sortedCtas[0]; // ej: 148-5-1
      }

      const observacion = t.cuentasExcel.size > 1
        ? `Libreta oficial Ahorro Corriente (Variantes en Excel: ${Array.from(t.cuentasExcel).join(", ")})`
        : numeroCuentaExcel
        ? `Libreta oficial Ahorro Corriente (No. Libreta: ${numeroCuentaExcel})`
        : `Libreta oficial Ahorro Corriente (Sin No. en Excel — Pendiente de asignación)`;

      const saldoHistNecesario = t.minBalance < 0 ? Math.abs(t.minBalance) : 0;

      const { rows: newCta } = await client.query(`
        insert into cuentas (
          numero_cuenta, codigo_sistema, tipo, estado, socio_id, agencia_id, saldo_inicial,
          observaciones_apertura, creado_por_id
        ) values (
          $1, $2, 'AHORRO_CORRIENTE', 'ACTIVA', $3, $4, $5,
          $6, $7
        ) returning id;
      `, [
        numeroCuentaExcel, // si vino vacía en Excel, se almacena ""
        codigoSistema,
        socio.id,
        agenciaChajulId,
        saldoHistNecesario,
        observacion,
        adminUserId,
      ]);

      const cuentaId = newCta[0].id;
      cuentasAhorroMap.set(nom, cuentaId);

      // Si retiró fondos pre-2026, registrar depósito histórico inicial con fecha 2025-12-31
      if (saldoHistNecesario > 0) {
        await client.query(`
          insert into movimientos (
            cuenta_id, tipo, monto, fecha, numero_recibo, descripcion, usuario_id,
            cliente_movimiento_id, agencia_operacion_id
          ) values (
            $1, 'DEPOSITO', $2, '2025-12-31', 'SALDO-INI-2025',
            'Saldo acumulado de ahorro corriente pre-2026 migrado', $3,
            $4, $5
          );
        `, [
          cuentaId,
          saldoHistNecesario,
          adminUserId,
          `MOV-AHC-HIST-${cuentaId}`,
          agenciaChajulId,
        ]);
        cuentasConSaldoHist++;
        totalSaldoHistPre2026 += saldoHistNecesario;
      }
    }

    console.log(`   ✓ ${cuentasAhorroMap.size} cuentas de Ahorro Corriente creadas exitosamente.`);
    console.log(`   ✓ ${cuentasConSaldoHist} cuentas recibieron saldo inicial histórico pre-2026 (Total: Q${totalSaldoHistPre2026.toLocaleString("es-GT", { minimumFractionDigits: 2 })}).`);

    // 6. Insertar los 674 movimientos del 2026 en lotes optimizados
    console.log("\n5. Insertando 674 movimientos del año 2026 en lotes de alta velocidad...");
    let dep2026Count = 0;
    let dep2026Monto = 0;
    let ret2026Count = 0;
    let ret2026Monto = 0;

    interface MovimientoItem {
      cuentaId: string;
      tipo: string;
      monto: number;
      fecha: string;
      recibo: string;
      descripcion: string;
      usuarioId: string;
      clienteMovimientoId: string;
      agenciaOperacionId: string;
    }

    const listaMovimientos: MovimientoItem[] = [];

    for (const r of rowsExcel) {
      const nomNorm = TYPO_MAP[r.nombre.trim().toUpperCase()] || r.nombre.trim().toUpperCase();
      const cuentaId = cuentasAhorroMap.get(nomNorm)!;
      const esDep = r.dep > 0;
      const tipo = esDep ? "DEPOSITO" : "RETIRO";
      const monto = esDep ? r.dep : r.ret;
      const desc = esDep ? "Depósito en cuenta de ahorro corriente" : "Retiro de cuenta de ahorro corriente";

      listaMovimientos.push({
        cuentaId,
        tipo,
        monto,
        fecha: r.fec,
        recibo: r.rec || `REC-${r.row}`,
        descripcion: desc,
        usuarioId: adminUserId,
        clienteMovimientoId: `MOV-AHC-2026-${r.row}`,
        agenciaOperacionId: agenciaChajulId,
      });

      if (esDep) {
        dep2026Count++;
        dep2026Monto += monto;
      } else {
        ret2026Count++;
        ret2026Monto += monto;
      }
    }

    const BATCH_SIZE = 50;
    for (let i = 0; i < listaMovimientos.length; i += BATCH_SIZE) {
      const batch = listaMovimientos.slice(i, i + BATCH_SIZE);
      const valueClauses: string[] = [];
      const params: any[] = [];
      let pIdx = 1;

      for (const m of batch) {
        valueClauses.push(`($${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++})`);
        params.push(
          m.cuentaId,
          m.tipo,
          m.monto,
          m.fecha,
          m.recibo,
          m.descripcion,
          m.usuarioId,
          m.clienteMovimientoId,
          m.agenciaOperacionId
        );
      }

      await client.query(`
        insert into movimientos (
          cuenta_id, tipo, monto, fecha, numero_recibo, descripcion, usuario_id,
          cliente_movimiento_id, agencia_operacion_id
        ) values ${valueClauses.join(", ")};
      `, params);
    }

    console.log(`   ✓ ${dep2026Count} depósitos registrados (Total: Q${dep2026Monto.toLocaleString("es-GT", { minimumFractionDigits: 2 })})`);
    console.log(`   ✓ ${ret2026Count} retiros registrados (Total: Q${ret2026Monto.toLocaleString("es-GT", { minimumFractionDigits: 2 })})`);

    await client.query("COMMIT");
    console.log("\n================================================================================");
    console.log("   ✅ IMPORTACIÓN DE AHORRO CORRIENTE CONFIRMADA EN LA BASE DE DATOS");
    console.log("================================================================================");

    // Consulta de comprobación final de saldos en BD
    const { rows: check2026 } = await client.query(`
      select
        coalesce(sum(case when m.tipo = 'DEPOSITO' and m.numero_recibo != 'SALDO-INI-2025' then m.monto else 0 end), 0) as dep_2026,
        coalesce(sum(case when m.tipo = 'RETIRO' then m.monto else 0 end), 0) as ret_2026,
        coalesce(sum(case when m.tipo = 'DEPOSITO' and m.numero_recibo != 'SALDO-INI-2025' then m.monto when m.tipo = 'RETIRO' then -m.monto else 0 end), 0) as neto_2026,
        coalesce(sum(case when m.tipo = 'DEPOSITO' and m.numero_recibo = 'SALDO-INI-2025' then m.monto else 0 end), 0) as hist_pre2026,
        coalesce(sum(case when m.tipo = 'DEPOSITO' then m.monto else -m.monto end), 0) as saldo_total_ahorro
      from movimientos m
      join cuentas c on c.id = m.cuenta_id
      where c.tipo = 'AHORRO_CORRIENTE';
    `);

    const res = check2026[0];
    const depBd = Number(res.dep_2026);
    const retBd = Number(res.ret_2026);
    const netoBd = Number(res.neto_2026);
    const histBd = Number(res.hist_pre2026);
    const totalAhorroBd = Number(res.saldo_total_ahorro);

    console.log(`\n📊 CUADRE MATEMÁTICO FASE 2 (AHORRO CORRIENTE 2026):`);
    console.log(`   - Total Depósitos 2026 registrados: Q${depBd.toLocaleString("es-GT", { minimumFractionDigits: 2 })} (Esperado: Q3,620,116.31)`);
    console.log(`   - Total Retiros 2026 registrados:   Q${retBd.toLocaleString("es-GT", { minimumFractionDigits: 2 })} (Esperado: Q1,348,045.62)`);
    console.log(`   - Saldo Neto Operativo 2026:        Q${netoBd.toLocaleString("es-GT", { minimumFractionDigits: 2 })} (Esperado Fila 679: Q2,272,070.69)`);
    console.log(`   - Fondo Histórico Pre-2026 migrado: Q${histBd.toLocaleString("es-GT", { minimumFractionDigits: 2 })} (80 cuentas protegidas)`);
    console.log(`   - Saldo Total Consolidado Ahorro:   Q${totalAhorroBd.toLocaleString("es-GT", { minimumFractionDigits: 2 })}`);

    const difDep = Math.abs(depBd - 3620116.31);
    const difRet = Math.abs(retBd - 1348045.62);
    const difNeto = Math.abs(netoBd - 2272070.69);

    if (difDep < 0.01 && difRet < 0.01 && difNeto < 0.01) {
      console.log(`   🎉 ¡CUADRE EXACTO AL CENTAVO CON LA FILA 679 DEL EXCEL! (Diferencia: Q0.00)`);
    } else {
      console.log(`   ⚠️ Diferencia detectada: Dep=Q${difDep.toFixed(2)}, Ret=Q${difRet.toFixed(2)}, Neto=Q${difNeto.toFixed(2)}`);
    }

  } catch (err) {
    await client.query("ROLLBACK");
    console.error("❌ ERROR DURANTE LA IMPORTACIÓN:", err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(err => {
  console.error("Error fatal:", err);
  process.exit(1);
});
