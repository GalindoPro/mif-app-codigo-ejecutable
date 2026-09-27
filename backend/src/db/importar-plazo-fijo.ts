import "dotenv/config";
import { pool } from "./pool";
import { execSync } from "child_process";
import { randomUUID } from "crypto";
import path from "path";
import { calcularVencimiento, calcularDiasExactos } from "../modules/plazofijo/calculo";

/**
 * Script Oficial de Importación — Fase 3: Depósito a Plazo Fijo (Kardex PF 2018-2026)
 * Archivo: importar/deposito a plazo fijo/KARDEX AHORRO PF 2026-08.xlsx
 * 
 * Reglas de Negocio aprobadas:
 * 1. Importación histórica completa: 695 certificados válidos desde 2018 hasta 2026 (descartando 47 anulados).
 * 2. Registro de 418 nuevos inversores/asociados en Agencia Chajul con aportación estatutaria inicial pre-2026.
 * 3. Formato Dual de Cuentas de Plazo Fijo:
 *    - numero_cuenta: Número de cuenta original de Excel (ej: 1-467-6-1, 2-95-6-2, 1188-2019).
 *    - codigo_sistema: Correlativo estructurado único (CHAJ-PF-00001...).
 * 4. Tasas cooperativas oficiales:
 *    - 6.0% anual para plazos de 6 meses o menos.
 *    - 14.0% anual para plazos de 12 meses o más.
 *    - 10.0% de retención legal de ISR sobre intereses brutos.
 * 5. Estados de los contratos:
 *    - 689 contratos con fecha y recibo de retiro se marcan como LIQUIDADO.
 *    - 6 contratos vigentes del 2026 se marcan como ACTIVO (con vencimiento en 2027).
 *    - Total capital auditado: Q 20,269,666.22.
 * 6. Optimización en Lotes (Batch Inserts): Ejecución ultrarrápida y atómica.
 */

interface RawCertRow {
  row: number;
  cta: string;
  nombre: string;
  agencia: string;
  fecEntrada: string;
  docIn: string;
  noDoc: string;
  noCert: string;
  plazoMeses: number;
  estadoExcel: string;
  monto: number;
  fecRetiro: string | null;
  reciboRetiro: string | null;
}

async function main() {
  console.log("================================================================================");
  console.log("   IMPORTACIÓN OFICIAL — FASE 3: PLAZO FIJO (KARDEX PF 2018-2026)");
  console.log("================================================================================\n");

  console.log("1. Extrayendo certificados desde 'importar/deposito a plazo fijo/KARDEX AHORRO PF 2026-08.xlsx'...");
  const scriptPython = `
import openpyxl, json

wb = openpyxl.load_workbook('importar/deposito a plazo fijo/KARDEX AHORRO PF 2026-08.xlsx', data_only=True)
ws = wb['Hoja1']

certs = []
for r in range(8, ws.max_row + 1):
    c1 = ws.cell(r, 1).value
    c2 = ws.cell(r, 2).value
    c3 = ws.cell(r, 3).value
    c4 = ws.cell(r, 4).value
    c5 = ws.cell(r, 5).value
    c6 = ws.cell(r, 6).value
    c7 = ws.cell(r, 7).value
    c8 = ws.cell(r, 8).value
    c9 = ws.cell(r, 9).value
    c10 = ws.cell(r, 10).value
    c17 = ws.cell(r, 17).value
    c18 = ws.cell(r, 18).value
    
    nom_str = str(c2).strip() if c2 else ''
    if not nom_str or 'ANULADO' in nom_str.upper() or 'ANULADA' in nom_str.upper():
        continue
    
    if c1 and str(c1).strip() and c10 is not None:
        try:
            monto = float(c10)
        except:
            continue
        if monto > 0:
            plazo = 12
            if c8 and str(c8).isdigit():
                plazo = int(c8)
            
            fec_in = str(c4)[:10] if c4 else '2026-01-02'
            fec_ret = str(c17)[:10] if c17 else None
            rec_ret = str(c18).strip() if c18 and str(c18).strip() not in ['', 'None'] else None

            certs.append({
                'row': r,
                'cta': str(c1).strip(),
                'nombre': nom_str.strip().upper(),
                'agencia': str(c3).strip() if c3 else 'CHAJUL',
                'fecEntrada': fec_in,
                'docIn': str(c5).strip() if c5 else 'IN',
                'noDoc': str(c6).strip() if c6 else '',
                'noCert': str(c7).strip() if c7 else str(len(certs) + 1),
                'plazoMeses': plazo,
                'estadoExcel': str(c9).strip().upper() if c9 else 'ACTIVO',
                'monto': monto,
                'fecRetiro': fec_ret,
                'reciboRetiro': rec_ret
            })

print(json.dumps(certs))
`;

  const rawJson = execSync(`python3 -c "${scriptPython.replace(/"/g, '\\"')}"`, {
    maxBuffer: 50 * 1024 * 1024,
    cwd: path.resolve(__dirname, "../../.."),
  }).toString();

  const certsExcel: RawCertRow[] = JSON.parse(rawJson);
  console.log(`   ✓ Extraídos exitosamente ${certsExcel.length} certificados válidos de inversión.`);

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Limpieza idempotente previa de Plazo Fijo
    console.log("\n2. Limpiando registros previos de Plazo Fijo para importación limpia...");
    await client.query(`
      delete from plazo_fijo_contratos;
      delete from movimientos where cuenta_id in (select id from cuentas where tipo = 'AHORRO_PLAZO_FIJO');
      delete from cuentas where tipo = 'AHORRO_PLAZO_FIJO';
      delete from movimientos where numero_recibo = 'SALDO-HIST-APO-PF';
      delete from cuentas where numero_cuenta = 'APO-HIST-PF';
      delete from socios where advertencia_importacion = 'Socio migrado de Plazo Fijo (Certificados de Inversión)';
    `);
    console.log("   ✓ Base de datos preparada para importación limpia de Plazo Fijo.");

    // Obtener Agencia Chajul y Admin
    const { rows: agRows } = await client.query(`select id from agencias where codigo = 'CHAJUL';`);
    if (agRows.length === 0) throw new Error("No se encontró Agencia Chajul en BD.");
    const agenciaChajulId = agRows[0].id;

    const { rows: uRows } = await client.query(`
      select id from usuarios where email = 'admin@mif.coop' or rol in ('ADMIN', 'GERENCIA') limit 1;
    `);
    const adminUserId = uRows[0].id;

    // Cargar socios existentes
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

    // Preparar y registrar nuevos socios en lotes
    console.log("\n3. Verificando y registrando nuevos inversores en el padrón de socios...");
    let correlativoSocio = maxCorrelativoSocio + 1;

    const titularesPF = new Set<string>();
    for (const c of certsExcel) {
      titularesPF.add(c.nombre);
    }

    interface NuevoSocioItem {
      socioId: string;
      numeroAsociado: string;
      nombre: string;
      apoCtaId: string;
      codApoHist: string;
    }

    const nuevosSociosList: NuevoSocioItem[] = [];

    for (const nom of titularesPF) {
      if (!sociosMap.has(nom)) {
        const socioId = randomUUID();
        const apoCtaId = randomUUID();
        const numeroAsociado = `CHAJ-${String(correlativoSocio++).padStart(5, "0")}`;
        const codApoHist = `CHAJ-APO-${String(correlativoSocio).padStart(5, "0")}`;

        sociosMap.set(nom, { id: socioId, numeroAsociado });
        nuevosSociosList.push({ socioId, numeroAsociado, nombre: nom, apoCtaId, codApoHist });
      }
    }

    // Inserción en lotes de nuevos socios
    const BATCH_SIZE = 50;
    for (let i = 0; i < nuevosSociosList.length; i += BATCH_SIZE) {
      const batch = nuevosSociosList.slice(i, i + BATCH_SIZE);

      // Socios
      const socioValues: string[] = [];
      const socioParams: any[] = [];
      let pIdx = 1;
      for (const s of batch) {
        socioValues.push(`($${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, '2025-12-31', 'ACTIVO', 'Socio migrado de Plazo Fijo (Certificados de Inversión)', $${pIdx++})`);
        socioParams.push(s.socioId, s.numeroAsociado, agenciaChajulId, s.nombre, adminUserId);
      }
      await client.query(`
        insert into socios (id, numero_asociado, agencia_id, nombres, fecha_ingreso, estado, advertencia_importacion, creado_por_id)
        values ${socioValues.join(", ")};
      `, socioParams);

      // Cuentas Aportación
      const ctaValues: string[] = [];
      const ctaParams: any[] = [];
      pIdx = 1;
      for (const s of batch) {
        ctaValues.push(`($${pIdx++}, 'APO-HIST-PF', $${pIdx++}, 'APORTACION', 'ACTIVA', $${pIdx++}, $${pIdx++}, 100, 'Aportación estatutaria previa de socio inversor', $${pIdx++})`);
        ctaParams.push(s.apoCtaId, s.codApoHist, s.socioId, agenciaChajulId, adminUserId);
      }
      await client.query(`
        insert into cuentas (id, numero_cuenta, codigo_sistema, tipo, estado, socio_id, agencia_id, saldo_inicial, observaciones_apertura, creado_por_id)
        values ${ctaValues.join(", ")};
      `, ctaParams);

      // Movimientos Aportación
      const movValues: string[] = [];
      const movParams: any[] = [];
      pIdx = 1;
      for (const s of batch) {
        movValues.push(`($${pIdx++}, 'DEPOSITO', 100, '2025-12-31', 'SALDO-HIST-APO-PF', 'Aportación estatutaria previa de socio inversor', $${pIdx++}, $${pIdx++}, $${pIdx++})`);
        movParams.push(s.apoCtaId, adminUserId, `MOV-APO-PF-${s.socioId}`, agenciaChajulId);
      }
      await client.query(`
        insert into movimientos (cuenta_id, tipo, monto, fecha, numero_recibo, descripcion, usuario_id, cliente_movimiento_id, agencia_operacion_id)
        values ${movValues.join(", ")};
      `, movParams);
    }
    console.log(`   ✓ ${nuevosSociosList.length} nuevos socios registrados en lotes con aportación estatutaria.`);

    // Preparar Cuentas de Plazo Fijo, Contratos y Movimientos
    console.log("\n4. Preparando cuentas de Plazo Fijo y contratos en lotes...");
    let correlativoPF = 1;
    let totalContratos = 0;
    let contratosActivos = 0;
    let contratosLiquidados = 0;
    let totalCapitalInvertido = 0;
    let totalLiquidadoMonto = 0;

    const certsVistos = new Set<string>();

    interface CuentaPFItem {
      id: string;
      numeroCuenta: string;
      codigoSistema: string;
      estadoCuenta: string;
      socioId: string;
      monto: number;
      observacion: string;
    }

    interface ContratoPFItem {
      cuentaId: string;
      certNumero: string;
      plazoMeses: number;
      tasaAnual: number;
      isrPct: number;
      monto: number;
      fechaInicio: string;
      fechaVencimiento: string;
      interesGenerado: number;
      interesNeto: number;
      saldoLiquido: number;
      estadoContrato: string;
      fechaRetiro: string | null;
      reciboRetiro: string | null;
      montoLiquidado: number | null;
    }

    interface MovPFItem {
      cuentaId: string;
      tipo: string;
      monto: number;
      fecha: string;
      recibo: string;
      descripcion: string;
      clienteMovimientoId: string;
    }

    const cuentasList: CuentaPFItem[] = [];
    const contratosList: ContratoPFItem[] = [];
    const movimientosList: MovPFItem[] = [];

    for (const c of certsExcel) {
      const socio = sociosMap.get(c.nombre)!;
      const cuentaId = randomUUID();
      const codigoSistema = `CHAJ-PF-${String(correlativoPF++).padStart(5, "0")}`;

      let certNumero = c.noCert;
      if (certsVistos.has(certNumero)) {
        certNumero = `${certNumero}-R`;
      }
      certsVistos.add(certNumero);

      const estaLiquidado = !!c.reciboRetiro;
      const estadoContrato = estaLiquidado ? "LIQUIDADO" : "ACTIVO";
      const estadoCuenta = estaLiquidado ? "CERRADA" : "ACTIVA";

      // Cálculos Financieros
      const tasaAnual = c.plazoMeses <= 6 ? 6.0 : 14.0;
      const isrPct = 10.0;
      const fechaInicio = c.fecEntrada;
      const fechaVencimiento = calcularVencimiento(fechaInicio, c.plazoMeses);
      const diasExactos = calcularDiasExactos(fechaInicio, fechaVencimiento);

      const interesGenerado = Math.round(c.monto * (tasaAnual / 100) * (diasExactos / 365) * 100) / 100;
      const isrRetencion = Math.round(interesGenerado * (isrPct / 100) * 100) / 100;
      const interesNeto = Math.round((interesGenerado - isrRetencion) * 100) / 100;
      const saldoLiquido = Math.round((c.monto + interesNeto) * 100) / 100;

      const montoLiquidado = estaLiquidado ? saldoLiquido : null;
      const fechaRetiro = estaLiquidado ? (c.fecRetiro || fechaVencimiento) : null;

      cuentasList.push({
        id: cuentaId,
        numeroCuenta: c.cta,
        codigoSistema,
        estadoCuenta,
        socioId: socio.id,
        monto: c.monto,
        observacion: `Certificado de Inversión a Plazo Fijo #${certNumero} (${c.plazoMeses} meses)`,
      });

      contratosList.push({
        cuentaId,
        certNumero,
        plazoMeses: c.plazoMeses,
        tasaAnual,
        isrPct,
        monto: c.monto,
        fechaInicio,
        fechaVencimiento,
        interesGenerado,
        interesNeto,
        saldoLiquido,
        estadoContrato,
        fechaRetiro,
        reciboRetiro: c.reciboRetiro,
        montoLiquidado,
      });

      movimientosList.push({
        cuentaId,
        tipo: "DEPOSITO",
        monto: c.monto,
        fecha: fechaInicio,
        recibo: c.noDoc || `CERT-${certNumero}`,
        descripcion: `Apertura de Certificado Plazo Fijo #${certNumero} (${c.plazoMeses} meses al ${tasaAnual}%)`,
        clienteMovimientoId: `MOV-PF-DEP-${cuentaId}`,
      });

      if (estaLiquidado) {
        movimientosList.push({
          cuentaId,
          tipo: "RETIRO",
          monto: c.monto,
          fecha: fechaRetiro!,
          recibo: c.reciboRetiro || `REC-LIQ-${certNumero}`,
          descripcion: `Liquidación oficial de Certificado Plazo Fijo #${certNumero}`,
          clienteMovimientoId: `MOV-PF-RET-${cuentaId}`,
        });
        contratosLiquidados++;
        totalLiquidadoMonto += c.monto;
      } else {
        contratosActivos++;
      }

      totalContratos++;
      totalCapitalInvertido += c.monto;
    }

    // Inserción en lotes de Cuentas de Plazo Fijo
    console.log(`   ↳ Insertando ${cuentasList.length} cuentas de Plazo Fijo...`);
    for (let i = 0; i < cuentasList.length; i += BATCH_SIZE) {
      const batch = cuentasList.slice(i, i + BATCH_SIZE);
      const values: string[] = [];
      const params: any[] = [];
      let pIdx = 1;
      for (const c of batch) {
        values.push(`($${pIdx++}, $${pIdx++}, $${pIdx++}, 'AHORRO_PLAZO_FIJO', $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++})`);
        params.push(c.id, c.numeroCuenta, c.codigoSistema, c.estadoCuenta, c.socioId, agenciaChajulId, c.monto, c.observacion, adminUserId);
      }
      await client.query(`
        insert into cuentas (id, numero_cuenta, codigo_sistema, tipo, estado, socio_id, agencia_id, saldo_inicial, observaciones_apertura, creado_por_id)
        values ${values.join(", ")};
      `, params);
    }

    // Inserción en lotes de Contratos de Plazo Fijo
    console.log(`   ↳ Insertando ${contratosList.length} contratos en plazo_fijo_contratos...`);
    for (let i = 0; i < contratosList.length; i += BATCH_SIZE) {
      const batch = contratosList.slice(i, i + BATCH_SIZE);
      const values: string[] = [];
      const params: any[] = [];
      let pIdx = 1;
      for (const c of batch) {
        values.push(`($${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++})`);
        params.push(
          c.cuentaId, c.certNumero, c.plazoMeses, c.tasaAnual, c.isrPct,
          c.monto, c.fechaInicio, c.fechaVencimiento, c.interesGenerado, c.interesNeto,
          c.saldoLiquido, c.estadoContrato, c.fechaRetiro, c.reciboRetiro, c.montoLiquidado
        );
      }
      await client.query(`
        insert into plazo_fijo_contratos (
          cuenta_id, numero_certificacion, plazo_meses, tasa_anual, isr_porcentaje,
          monto_deposito, fecha_inicio, fecha_vencimiento, interes_generado, interes_neto,
          saldo_liquido_a_pagar, estado, fecha_retiro, recibo_retiro, monto_liquidado
        ) values ${values.join(", ")};
      `, params);
    }

    // Inserción en lotes de Movimientos
    console.log(`   ↳ Insertando ${movimientosList.length} movimientos de apertura y liquidación...`);
    for (let i = 0; i < movimientosList.length; i += BATCH_SIZE) {
      const batch = movimientosList.slice(i, i + BATCH_SIZE);
      const values: string[] = [];
      const params: any[] = [];
      let pIdx = 1;
      for (const m of batch) {
        values.push(`($${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++})`);
        params.push(m.cuentaId, m.tipo, m.monto, m.fecha, m.recibo, m.descripcion, adminUserId, m.clienteMovimientoId, agenciaChajulId);
      }
      await client.query(`
        insert into movimientos (cuenta_id, tipo, monto, fecha, numero_recibo, descripcion, usuario_id, cliente_movimiento_id, agencia_operacion_id)
        values ${values.join(", ")};
      `, params);
    }

    await client.query("COMMIT");
    console.log("\n================================================================================");
    console.log("   ✅ IMPORTACIÓN DE PLAZO FIJO CONFIRMADA EN LA BASE DE DATOS");
    console.log("================================================================================");

    // Consulta de Comprobación
    const { rows: stats } = await client.query(`
      select
        count(*) as total_contratos,
        count(*) filter (where estado = 'ACTIVO') as activos,
        count(*) filter (where estado = 'LIQUIDADO') as liquidados,
        coalesce(sum(monto_deposito), 0) as total_capital,
        coalesce(sum(monto_deposito) filter (where estado = 'ACTIVO'), 0) as capital_activo,
        coalesce(sum(monto_deposito) filter (where estado = 'LIQUIDADO'), 0) as capital_liquidado,
        coalesce(sum(interes_neto) filter (where estado = 'ACTIVO'), 0) as intereses_activos
      from plazo_fijo_contratos;
    `);

    const r = stats[0];
    console.log(`\n📊 CUADRE MATEMÁTICO FASE 3 (PLAZO FIJO KARDEX 2018-2026):`);
    console.log(`   - Total contratos migrados:     ${r.total_contratos} certificados`);
    console.log(`   - Contratos Activos Vigentes:   ${r.activos} certificados (Monto: Q${Number(r.capital_activo).toLocaleString("es-GT", { minimumFractionDigits: 2 })})`);
    console.log(`   - Contratos Liquidados Hist.:   ${r.liquidados} certificados (Monto: Q${Number(r.capital_liquidado).toLocaleString("es-GT", { minimumFractionDigits: 2 })})`);
    console.log(`   - TOTAL CAPITAL INVERTIDO:      Q${Number(r.total_capital).toLocaleString("es-GT", { minimumFractionDigits: 2 })} (Esperado: Q20,269,666.22)`);
    console.log(`   - Intereses Netos en custodia:  Q${Number(r.intereses_activos).toLocaleString("es-GT", { minimumFractionDigits: 2 })}`);

    const difCapital = Math.abs(Number(r.total_capital) - 20269666.22);
    if (difCapital < 0.01) {
      console.log(`   🎉 ¡CUADRE EXACTO AL CENTAVO CON EL KARDEX MAESTRO! (Diferencia: Q0.00)`);
    } else {
      console.log(`   ⚠️ Diferencia detectada: Q${difCapital.toFixed(2)}`);
    }

  } catch (err) {
    await client.query("ROLLBACK");
    console.error("❌ ERROR EN LA IMPORTACIÓN DE PLAZO FIJO:", err);
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
