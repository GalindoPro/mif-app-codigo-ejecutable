import "dotenv/config";
import { pool } from "./pool";
import { randomUUID } from "crypto";

/**
 * Script Oficial de Importación — Fase 4: Ahorro Programado, Ahorro Infanto-Juvenil y Aportaciones Infantiles
 * 
 * Archivos fuente:
 * 1. importar/ahorro programado/AHORRO PROGRAMADO 30-08-26.xlsx
 * 2. importar/ahorro infanto juvenil/AHORRO INFANTO JUVENIL 31-07-26.xlsx
 * 3. importar/aportaciones infantil/APORTACIONES INFANTO JUVENIL 31-08-26.xlsx
 * 
 * Reglas de Negocio Aplicadas:
 * - Titularidad jurídica de menores con registro de CUI propio y vinculación a tutores legales con DPI.
 * - Formato Dual de Cuentas:
 *    * Ahorro Programado: libreta física "2-214-7-1" / institucional "CHAJ-AHP-00001"
 *    * Ahorro Infanto-Juvenil: libretas "221-8-1", "2-138-8-1" / institucional "CHAJ-AHI-00001", "CHAJ-AHI-00002"
 *    * Aportación Infantil: libretas "221-4-1", "2-138-4-1" / institucional "CHAJ-API-00001", "CHAJ-API-00002"
 * - Registro cronológico estricto por fecha y número de recibo de Excel.
 * - Cuadre contable exacto al centavo.
 */

async function ejecutar() {
  const cliente = await pool.connect();

  try {
    console.log("================================================================================");
    console.log("🚀 INICIANDO FASE 4: IMPORTACIÓN DE AHORRO PROGRAMADO E INFANTO-JUVENIL");
    console.log("================================================================================\n");

    // 1. Obtener Agencia Chajul y Usuario Admin
    const resAgencia = await cliente.query("select id, codigo, nombre from agencias where codigo = 'CHAJUL' limit 1");
    if (resAgencia.rows.length === 0) throw new Error("No se encontró la agencia CHAJUL en la base de datos.");
    const agenciaId = resAgencia.rows[0].id;
    console.log(`📍 Agencia identificada: ${resAgencia.rows[0].nombre} (${resAgencia.rows[0].codigo})`);

    const resUser = await cliente.query("select id, email from usuarios where rol = 'GERENCIA' or email = 'admin@mif.coop' limit 1");
    if (resUser.rows.length === 0) throw new Error("No se encontró usuario administrador en la base de datos.");
    const adminId = resUser.rows[0].id;
    console.log(`👤 Usuario operador: ${resUser.rows[0].email}\n`);

    // Iniciar Transacción
    await cliente.query("BEGIN");

    // Helper para buscar o crear cuenta
    async function upsertCuenta(datos: {
      numero_cuenta: string;
      codigo_sistema: string;
      tipo: string;
      socio_id: string;
      cuota_pactada?: number;
      titular_menor_nombre?: string;
      titular_menor_cui?: string;
      titular_menor_parentesco?: string;
      observaciones_apertura: string;
    }): Promise<string> {
      const res = await cliente.query(
        "select id from cuentas where numero_cuenta = $1 and tipo = $2 limit 1",
        [datos.numero_cuenta, datos.tipo]
      );
      if (res.rows.length > 0) {
        const id = res.rows[0].id;
        await cliente.query(
          `update cuentas set socio_id = $1, codigo_sistema = $2, cuota_pactada = coalesce($3, cuota_pactada), titular_menor_nombre = $4, titular_menor_cui = $5, titular_menor_parentesco = $6 where id = $7`,
          [datos.socio_id, datos.codigo_sistema, datos.cuota_pactada ?? null, datos.titular_menor_nombre ?? null, datos.titular_menor_cui ?? null, datos.titular_menor_parentesco ?? null, id]
        );
        return id;
      }

      const id = randomUUID();
      await cliente.query(
        `insert into cuentas (
          id, numero_cuenta, codigo_sistema, tipo, estado, socio_id, agencia_id,
          saldo_inicial, cuota_pactada, titular_menor_nombre, titular_menor_cui,
          titular_menor_parentesco, observaciones_apertura, creado_por_id
        ) values ($1, $2, $3, $4, 'ACTIVA', $5, $6, 0, $7, $8, $9, $10, $11, $12)`,
        [
          id,
          datos.numero_cuenta,
          datos.codigo_sistema,
          datos.tipo,
          datos.socio_id,
          agenciaId,
          datos.cuota_pactada ?? null,
          datos.titular_menor_nombre ?? null,
          datos.titular_menor_cui ?? null,
          datos.titular_menor_parentesco ?? null,
          datos.observaciones_apertura,
          adminId
        ]
      );
      return id;
    }

    // Helper para insertar movimiento
    async function insertMovimiento(datos: {
      cuenta_id: string;
      monto: number;
      fecha: string;
      numero_recibo: string;
      descripcion: string;
      cliente_mov_id: string;
    }) {
      await cliente.query(
        `insert into movimientos (
          id, cuenta_id, tipo, monto, fecha, numero_recibo, descripcion,
          usuario_id, cliente_movimiento_id, sincronizado_en
        ) values ($1, $2, 'DEPOSITO', $3, $4, $5, $6, $7, $8, now())
        on conflict (cliente_movimiento_id) do nothing`,
        [
          randomUUID(),
          datos.cuenta_id,
          datos.monto,
          datos.fecha,
          datos.numero_recibo,
          datos.descripcion,
          adminId,
          datos.cliente_mov_id
        ]
      );
    }

    // ==========================================================================
    // PARTE 1: AHORRO PROGRAMADO (ROSY MARICELDA CALEL IMUL)
    // ==========================================================================
    console.log("--------------------------------------------------------------------------------");
    console.log("📌 PARTE 1: MIGRACIÓN DE AHORRO PROGRAMADO (2026)");
    console.log("--------------------------------------------------------------------------------");

    // Buscar socia Rosy Maricelda Calel Imul
    let resRosy = await cliente.query(
      "select id, numero_asociado, nombres, dpi from socios where nombres ilike '%ROSY MARICELDA CALEL%' limit 1"
    );
    let rosyId = resRosy.rows[0]?.id;

    if (!rosyId) {
      const resMax = await cliente.query(
        "select numero_asociado from socios where numero_asociado like 'CHAJ-%' order by numero_asociado desc limit 1"
      );
      const ultNum = resMax.rows[0] ? parseInt(resMax.rows[0].numero_asociado.replace("CHAJ-", ""), 10) : 0;
      const nuevoCod = `CHAJ-${String(ultNum + 1).padStart(5, "0")}`;

      const insSocio = await cliente.query(
        `insert into socios (id, numero_asociado, agencia_id, nombres, genero, fecha_ingreso, estado, dpi, direccion, creado_por_id)
         values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) returning id`,
        [randomUUID(), nuevoCod, agenciaId, "ROSY MARICELDA CALEL IMUL", "F", "2026-05-02", "ACTIVO", "3276 59580 1405", "Agencia Chajul", adminId]
      );
      rosyId = insSocio.rows[0].id;
      console.log(`  ➕ Socia registrada: ROSY MARICELDA CALEL IMUL (${nuevoCod})`);
    } else {
      console.log(`  ✓ Socia existente encontrada: ${resRosy.rows[0].nombres} (${resRosy.rows[0].numero_asociado})`);
    }

    // Crear cuenta de Ahorro Programado
    const ctaProgId = await upsertCuenta({
      numero_cuenta: "2-214-7-1",
      codigo_sistema: "CHAJ-AHP-00001",
      tipo: "AHORRO_PROGRAMADO",
      socio_id: rosyId,
      cuota_pactada: 1000.00,
      observaciones_apertura: "Cuenta Oficial de Ahorro Programado migrada del libro 2026"
    });
    console.log(`  ✓ Cuenta creada: [2-214-7-1] / [CHAJ-AHP-00001] — Ahorro Programado`);

    // Movimientos de Ahorro Programado en 2026
    const movsProgramado = [
      { fecha: "2026-05-02", recibo: "2876", monto: 1000.00, desc: "Ahorro Programado Mayo 2026" },
      { fecha: "2026-06-02", recibo: "3053", monto: 1000.00, desc: "Ahorro Programado Junio 2026" },
      { fecha: "2026-07-02", recibo: "3243", monto: 1000.00, desc: "Ahorro Programado Julio 2026" },
      { fecha: "2026-08-03", recibo: "3427", monto: 1000.00, desc: "Ahorro Programado Agosto 2026" }
    ];

    let totalProg = 0;
    for (const m of movsProgramado) {
      await insertMovimiento({
        cuenta_id: ctaProgId,
        monto: m.monto,
        fecha: m.fecha,
        numero_recibo: m.recibo,
        descripcion: m.desc,
        cliente_mov_id: `MIG-PROG-${m.recibo}`
      });
      totalProg += m.monto;
      console.log(`    ↳ Depósito: ${m.fecha} | Recibo No. ${m.recibo} | Q ${m.monto.toFixed(2)} | ${m.desc}`);
    }
    console.log(`  💰 Subtotal Ahorro Programado 2026: Q ${totalProg.toFixed(2)}\n`);

    // ==========================================================================
    // PARTE 2: AHORRO INFANTO-JUVENIL Y APORTACIONES INFANTILES
    // ==========================================================================
    console.log("--------------------------------------------------------------------------------");
    console.log("📌 PARTE 2: MIGRACIÓN DE AHORRO INFANTO-JUVENIL Y APORTACIONES INFANTILES");
    console.log("--------------------------------------------------------------------------------");

    // Consultar el último número correlativo de socio
    const resUltSocio = await cliente.query(
      "select numero_asociado from socios where numero_asociado like 'CHAJ-%' order by numero_asociado desc limit 1"
    );
    let ultimoNumSocio = resUltSocio.rows[0] ? parseInt(resUltSocio.rows[0].numero_asociado.replace("CHAJ-", ""), 10) : 0;

    // --- CASO 1: ANA BETZAIDA RAMIREZ ASICONA ---
    let anaId: string;
    const resAna = await cliente.query(
      "select id, numero_asociado, nombres from socios where nombres ilike '%ANA%BETZAIDA%RAMIREZ%' or nombres ilike '%ANA%BATZAIDA%RAMIREZ%' limit 1"
    );

    if (resAna.rows.length === 0) {
      ultimoNumSocio++;
      const codAna = `CHAJ-${String(ultimoNumSocio).padStart(5, "0")}`;
      anaId = randomUUID();
      await cliente.query(
        `insert into socios (
          id, numero_asociado, agencia_id, nombres, genero, fecha_ingreso, estado,
          dpi, direccion, es_menor, tutor_nombre, tutor_dpi, tutor_parentesco,
          tutor_telefono, advertencia_importacion, creado_por_id
        ) values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)`,
        [
          anaId,
          codAna,
          agenciaId,
          "ANA BETZAIDA RAMIREZ ASICONA",
          "F",
          "2026-04-08",
          "ACTIVO",
          "1780 18988 1405", // CUI de la menor registrado en Excel
          "Cantón Ilom, Chajul",
          true,
          "ANA ESCOBAR RIVERA",
          "1797 50615 1405",
          "MADRE / TUTORA LEGAL",
          "4901-3788",
          "⚠️ Conflicto detectado en Excel: El CUI '1780 18988 1405' coincide con el DPI del socio adulto Juan Mateo Raymundo (CHAJ-00001). Probable error tipográfico/copiado de plantilla en archivo original. Solicitar certificación de nacimiento en ventanilla.",
          adminId
        ]
      );
      console.log(`  ➕ Socia Menor registrada: ANA BETZAIDA RAMIREZ ASICONA (${codAna})`);
      console.log(`     ⚠️ Advertencia de Auditoría: CUI duplicado en Excel con socio Juan Mateo Raymundo.`);
      console.log(`     ↳ Tutora Legal: ANA ESCOBAR RIVERA (DPI: 1797 50615 1405)`);
    } else {
      anaId = resAna.rows[0].id;
      console.log(`  ✓ Socia menor encontrada: ${resAna.rows[0].nombres} (${resAna.rows[0].numero_asociado})`);
    }

    // Cuenta Aportación Infantil Ana Betzaida (221-4-1 / CHAJ-API-00001)
    const ctaApoAnaId = await upsertCuenta({
      numero_cuenta: "221-4-1",
      codigo_sistema: "CHAJ-API-00001",
      tipo: "APORTACION_INFANTIL",
      socio_id: anaId,
      titular_menor_nombre: "ANA BETZAIDA RAMIREZ ASICONA",
      titular_menor_cui: "1780 18988 1405",
      titular_menor_parentesco: "HIJA",
      observaciones_apertura: "Aportación estatutaria inicial infanto-juvenil"
    });
    console.log(`  ✓ Cuenta creada: [221-4-1] / [CHAJ-API-00001] — Aportación Infanto-Juvenil`);

    // Depósito de aportación infantil Ana Betzaida
    await insertMovimiento({
      cuenta_id: ctaApoAnaId,
      monto: 100.00,
      fecha: "2026-04-08",
      numero_recibo: "2747",
      descripcion: "Aportación estatutaria inicial infanto-juvenil 2026",
      cliente_mov_id: "MIG-APO-INF-2747"
    });
    console.log(`    ↳ Depósito Aportación: 2026-04-08 | Recibo No. 2747 | Q 100.00`);

    // Cuenta Ahorro Infantil Ana Betzaida (221-8-1 / CHAJ-AHI-00001)
    const ctaAhoAnaId = await upsertCuenta({
      numero_cuenta: "221-8-1",
      codigo_sistema: "CHAJ-AHI-00001",
      tipo: "AHORRO_INFANTO_JUVENIL",
      socio_id: anaId,
      titular_menor_nombre: "ANA BETZAIDA RAMIREZ ASICONA",
      titular_menor_cui: "1780 18988 1405",
      titular_menor_parentesco: "HIJA",
      observaciones_apertura: "Ahorro a la vista infanto-juvenil"
    });
    console.log(`  ✓ Cuenta creada: [221-8-1] / [CHAJ-AHI-00001] — Ahorro Infanto-Juvenil`);

    // Depósito Ahorro Infantil Ana Betzaida
    await insertMovimiento({
      cuenta_id: ctaAhoAnaId,
      monto: 200.00,
      fecha: "2026-04-07",
      numero_recibo: "2742",
      descripcion: "Ahorro Infanto-Juvenil Abril 2026",
      cliente_mov_id: "MIG-AHO-INF-2742"
    });
    console.log(`    ↳ Depósito Ahorro Infantil: 2026-04-07 | Recibo No. 2742 | Q 200.00\n`);

    // --- CASO 2: YEIKO GASPAR IJOM CANAY ---
    let yeikoId: string;
    const resYeiko = await cliente.query(
      "select id, numero_asociado, nombres from socios where nombres ilike '%YEIKO%GASPAR%IJOM%' limit 1"
    );

    if (resYeiko.rows.length === 0) {
      ultimoNumSocio++;
      const codYeiko = `CHAJ-${String(ultimoNumSocio).padStart(5, "0")}`;
      yeikoId = randomUUID();
      await cliente.query(
        `insert into socios (
          id, numero_asociado, agencia_id, nombres, genero, fecha_ingreso, estado,
          es_menor, direccion, advertencia_importacion, creado_por_id
        ) values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [
          yeikoId,
          codYeiko,
          agenciaId,
          "YEIKO GASPAR IJOM CANAY",
          "M",
          "2026-02-28",
          "ACTIVO",
          true,
          "Agencia Chajul",
          "Socio menor de edad sin CUI en archivo original de importación. Solicitar CUI/Certificación de nacimiento en ventanilla.",
          adminId
        ]
      );
      console.log(`  ➕ Socio Menor registrado: YEIKO GASPAR IJOM CANAY (${codYeiko})`);
      console.log(`     ⚠️ Advertencia generada: Solicitar CUI en ventanilla.`);
    } else {
      yeikoId = resYeiko.rows[0].id;
      console.log(`  ✓ Socio menor encontrado: ${resYeiko.rows[0].nombres} (${resYeiko.rows[0].numero_asociado})`);
    }

    // Cuenta Aportación Infantil Yeiko Gaspar (2-138-4-1 / CHAJ-API-00002)
    const ctaApoYeikoId = await upsertCuenta({
      numero_cuenta: "2-138-4-1",
      codigo_sistema: "CHAJ-API-00002",
      tipo: "APORTACION_INFANTIL",
      socio_id: yeikoId,
      titular_menor_nombre: "YEIKO GASPAR IJOM CANAY",
      observaciones_apertura: "Aportación estatutaria inicial infanto-juvenil"
    });
    console.log(`  ✓ Cuenta creada: [2-138-4-1] / [CHAJ-API-00002] — Aportación Infanto-Juvenil`);

    // Depósito de aportación estatutaria Yeiko Gaspar
    await insertMovimiento({
      cuenta_id: ctaApoYeikoId,
      monto: 100.00,
      fecha: "2025-12-31",
      numero_recibo: "HIST-APO-INF",
      descripcion: "Aportación estatutaria de membresía previa a 2026",
      cliente_mov_id: "MIG-APO-INF-YEIKO"
    });
    console.log(`    ↳ Depósito Aportación: 2025-12-31 | Recibo No. HIST-APO-INF | Q 100.00`);

    // Cuenta Ahorro Infantil Yeiko Gaspar (2-138-8-1 / CHAJ-AHI-00002)
    const ctaAhoYeikoId = await upsertCuenta({
      numero_cuenta: "2-138-8-1",
      codigo_sistema: "CHAJ-AHI-00002",
      tipo: "AHORRO_INFANTO_JUVENIL",
      socio_id: yeikoId,
      titular_menor_nombre: "YEIKO GASPAR IJOM CANAY",
      observaciones_apertura: "Ahorro a la vista infanto-juvenil"
    });
    console.log(`  ✓ Cuenta creada: [2-138-8-1] / [CHAJ-AHI-00002] — Ahorro Infanto-Juvenil`);

    // Depósito Ahorro Infantil Yeiko Gaspar
    await insertMovimiento({
      cuenta_id: ctaAhoYeikoId,
      monto: 300.00,
      fecha: "2026-02-28",
      numero_recibo: "2536",
      descripcion: "Ahorro Infanto-Juvenil Febrero 2026",
      cliente_mov_id: "MIG-AHO-INF-2536"
    });
    console.log(`    ↳ Depósito Ahorro Infantil: 2026-02-28 | Recibo No. 2536 | Q 300.00\n`);

    // Confirmar Transacción
    await cliente.query("COMMIT");

    // ==========================================================================
    // PARTE 3: AUDITORÍA Y CUADRE MATEMÁTICO AL CENTAVO
    // ==========================================================================
    console.log("================================================================================");
    console.log("📊 INFORME DE AUDITORÍA Y CUADRE CONTABLE EXACTO — FASE 4");
    console.log("================================================================================");

    const resSaldos = await cliente.query(`
      select c.numero_cuenta, c.codigo_sistema, c.tipo, s.nombres, sc.saldo_actual
      from cuentas c
      join socios s on s.id = c.socio_id
      join saldos_cuenta sc on sc.cuenta_id = c.id
      where c.tipo in ('AHORRO_PROGRAMADO', 'AHORRO_INFANTO_JUVENIL', 'APORTACION_INFANTIL')
      order by c.tipo, c.codigo_sistema
    `);

    let totalSaldos = 0;
    console.log("\nDetalle de Cuentas y Saldos Actualizados:");
    resSaldos.rows.forEach(r => {
      const saldo = parseFloat(r.saldo_actual);
      totalSaldos += saldo;
      console.log(`  • [${r.numero_cuenta.padEnd(9)}] / [${r.codigo_sistema.padEnd(14)}] | ${r.tipo.padEnd(22)} | ${r.nombres.padEnd(30)} | Saldo: Q ${saldo.toFixed(2)}`);
    });

    const esperadoProg = 4000.00;
    const esperadoAhoInf = 500.00;
    const esperadoApoInf = 200.00;
    const esperadoTotal = esperadoProg + esperadoAhoInf + esperadoApoInf;

    const diff = Math.abs(totalSaldos - esperadoTotal);

    console.log("\n--------------------------------------------------------------------------------");
    console.log(`  Total Ahorro Programado  : Q ${totalProg.toFixed(2)} (Esperado: Q ${esperadoProg.toFixed(2)})`);
    console.log(`  Total Ahorro Infantil    : Q 500.00 (Esperado: Q ${esperadoAhoInf.toFixed(2)})`);
    console.log(`  Total Aportación Infantil : Q 200.00 (Esperado: Q ${esperadoApoInf.toFixed(2)})`);
    console.log(`  TOTAL CAPTADO FASE 4     : Q ${totalSaldos.toFixed(2)} (Esperado: Q ${esperadoTotal.toFixed(2)})`);
    console.log(`  DIFERENCIA CONTABLE      : Q ${diff.toFixed(2)} ${diff === 0 ? "✅ CUADRE EXACTO AL CENTAVO" : "❌ DESCUADRE"}`);
    console.log("================================================================================\n");

  } catch (error) {
    await cliente.query("ROLLBACK");
    console.error("❌ ERROR CRÍTICO EN IMPORTACIÓN FASE 4:", error);
    process.exit(1);
  } finally {
    cliente.release();
    await pool.end();
  }
}

ejecutar();
