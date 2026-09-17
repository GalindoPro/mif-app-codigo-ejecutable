import "dotenv/config";
import { pool } from "../db/pool";
import * as CajaAuxiliarService from "../modules/cajaauxiliar/service";
import * as PrestamosService from "../modules/prestamos/service";
import * as CuentasService from "../modules/cuentas/service";
import { calcularAmortizacion, sumarMesesFinanciero } from "../modules/prestamos/amortizacion";
import { distribuirMontoCobro } from "../modules/prestamos/liquidacion";

async function runE2EStressTest() {
  console.log("================================================================================");
  console.log("🏦 COOP COMIF R.L. - SUITE DE PRUEBAS END-TO-END Y AUDITORÍA FINANCIERA (FASE 4)");
  console.log("================================================================================\n");

  let totalTests = 0;
  let passedTests = 0;

  function assert(condition: boolean, testName: string, details?: any) {
    totalTests++;
    if (condition) {
      passedTests++;
      console.log(`  ✅ [PASSED] ${testName}`);
    } else {
      console.error(`  ❌ [FAILED] ${testName}`);
      if (details) console.error("     Detalles:", details);
    }
  }

  try {
    const docSuffix = Date.now().toString().slice(-6);

    // 0. Setup test agency and test socio
    console.log("📋 1. Configuración de Entorno de Prueba (Agencia, Socio y Usuario)...");
    const { rows: agencias } = await pool.query("SELECT id, nombre FROM agencias LIMIT 1");
    if (!agencias[0]) throw new Error("No hay agencias en la base de datos.");
    const agenciaId = agencias[0].id;
    console.log(`   Agencia de prueba: ${agencias[0].nombre} (${agenciaId})`);

    const { rows: usuarios } = await pool.query("SELECT id, nombre, email FROM usuarios LIMIT 1");
    if (!usuarios[0]) throw new Error("No hay usuarios en la base de datos.");
    const usuario = { id: usuarios[0].id, nombre: usuarios[0].nombre, rol: "ADMIN" as const, agenciaId };
    console.log(`   Operador/Cajero: ${usuario.nombre} (${usuario.id})`);

    // Crear un socio de prueba exclusivo para esta ejecución
    const dpiTest = `9999${Date.now().toString().slice(-9)}`;
    const { rows: socioRows } = await pool.query(
      `INSERT INTO socios (numero_asociado, nombres, fecha_ingreso, dpi, telefono, direccion, agencia_id, estado)
       VALUES ($1, $2, CURRENT_DATE, $3, $4, $5, $6, 'ACTIVO')
       RETURNING id, nombres, dpi, numero_asociado`,
      [`SOC-${docSuffix}`, "Socio Prueba E2E Hardening", dpiTest, "55554444", "Guatemala", agenciaId]
    );
    const socio = socioRows[0];
    console.log(`   Socio de prueba creado: ${socio.nombres} (DPI: ${socio.dpi}, No: ${socio.numero_asociado})\n`);

    // 1. Motor Financiero y Cálculo de Fechas
    console.log("📐 2. Prueba del Motor Financiero Unificado (Amortización y Fechas 365 días)...");
    const fechaInicio = "2026-01-31";
    const fechaMes1 = sumarMesesFinanciero(fechaInicio, 1);
    const fechaMes2 = sumarMesesFinanciero(fechaInicio, 2);
    assert(fechaMes1 === "2026-02-28", `Rollover de fin de mes correcto: 31 Ene -> 28 Feb (obtenido: ${fechaMes1})`);
    assert(fechaMes2 === "2026-03-31", `Restauración a día 31 correcto: 31 Ene -> 31 Mar (obtenido: ${fechaMes2})`);

    const resultadoAmort = calcularAmortizacion({
      monto: 10000,
      plazoMeses: 12,
      tasaInteresMensual: 2.0,
      fechaInicio: "2026-01-15",
    });
    const tablaAmort = resultadoAmort.tabla;
    assert(tablaAmort.length === 12, `La tabla de amortización genera exactamente 12 cuotas (obtenido: ${tablaAmort.length})`);
    assert(tablaAmort[0].interes === 200.0, `Interés cuota 1 es Q 200.00 (obtenido: Q ${tablaAmort[0].interes})`);
    const sumaCapital = tablaAmort.reduce((sum, c) => sum + c.capital, 0);
    assert(Math.round(sumaCapital * 100) / 100 === 10000.0, `La suma de amortizaciones a capital es exactamente Q 10,000.00 (obtenido: Q ${sumaCapital.toFixed(2)})`);
    assert(tablaAmort[11].saldoRestante === 0.0, "El saldo final tras 12 cuotas es exactamente Q 0.00\n");

    // 2. Apertura de Caja Auxiliar
    console.log("💵 3. Apertura de Caja Auxiliar y Verificación de Saldo Inicial...");
    let estadoCaja = await CajaAuxiliarService.estado(agenciaId, null);
    let diaId: string;
    if (estadoCaja.estado === "SIN_ABRIR") {
      const diaAbierto = await CajaAuxiliarService.abrirDia(agenciaId, usuario.id, null, 50000);
      diaId = diaAbierto.id;
    } else if (estadoCaja.estado === "ABIERTO") {
      diaId = estadoCaja.dia.id;
    } else {
      // Si estaba cerrada hoy, creamos un registro para testing
      const { rows: dRows } = await pool.query(
        `INSERT INTO caja_dias (agencia_id, fecha, abierto_por, saldo_inicial, estado)
         VALUES ($1, CURRENT_DATE + interval '1 day', $2, 50000, 'ABIERTO')
         RETURNING id`,
        [agenciaId, usuario.id]
      );
      diaId = dRows[0].id;
    }

    const detalleCajaInicio = await CajaAuxiliarService.detalle(diaId, null);
    const saldoInicialCaja = Number(detalleCajaInicio.saldoActual);
    assert(saldoInicialCaja >= 10000, `Caja auxiliar abierta con saldo suficiente (Saldo actual: Q ${saldoInicialCaja})`);

    // 3. Creación y Aprobación de Préstamo
    console.log("\n📑 4. Creación y Aprobación de Crédito Fiduciario (Q 10,000.00 a 12 meses)...");
    const fiadorDpiTest = `8888${Date.now().toString().slice(-9)}`;
    const prestamoCreado = await PrestamosService.crear(
      {
        socioId: socio.id,
        agenciaId: agenciaId,
        tipo: "FIDUCIARIO",
        origenFondos: "FONDOS_PROPIOS",
        montoSolicitado: 10000,
        plazoMeses: 12,
        tasaInteresMensual: 2.0,
        tipoAmortizacion: "CUOTA_NIVELADA",
        fechaSolicitud: "2026-02-15",
        destino: "Comercio",
        garantia: "Fiador solidario",
        nombreFiador: "Fiador Test E2E",
        dpiFiador: fiadorDpiTest,
      },
      usuario.id
    );
    assert(prestamoCreado.estado === "SOLICITADO" || prestamoCreado.estado === "APROBADO", `Préstamo creado (ID: ${prestamoCreado.id}, Estado: ${prestamoCreado.estado})`);

    let prestamoAprobado = prestamoCreado;
    if (prestamoCreado.estado !== "APROBADO") {
      prestamoAprobado = await PrestamosService.cambiarEstado(
        prestamoCreado.id,
        "APROBADO",
        usuario.id,
        null,
        10000
      );
    }
    assert(prestamoAprobado.estado === "APROBADO", `Préstamo aprobado con monto Q 10,000.00`);

    // 4. Desembolso en Caja Auxiliar con Retención de ASP (5% = Q 500.00)
    console.log("\n📤 5. Desembolso en Caja con Retención del 5% para Ahorro sobre Préstamo (ASP)...");
    const resultadoDesembolso = await CajaAuxiliarService.desembolsarCredito(
      diaId,
      {
        prestamoId: prestamoAprobado.id,
        docNo: `CHQ-${docSuffix}`,
        origenFondos: "FONDOS_PROPIOS",
        montoAhorroSobrePrestamo: 500.0,
      },
      usuario.id,
      null
    );

    assert(resultadoDesembolso.prestamo.estado === "DESEMBOLSADO", "El crédito cambió a estado DESEMBOLSADO");
    assert(resultadoDesembolso.efectivoNetoEntregado === 9500.0, `Efectivo neto entregado en ventanilla es Q 9,500.00 (obtenido: Q ${resultadoDesembolso.efectivoNetoEntregado})`);
    assert(resultadoDesembolso.ahorroSobrePrestamoRetenido === 500.0, `Retención ASP acreditada es Q 500.00 (obtenido: Q ${resultadoDesembolso.ahorroSobrePrestamoRetenido})`);

    // Verificar que la cuenta ASP fue creada y tiene Q 500.00 de saldo a través de saldos_cuenta
    const { rows: cuentasSocio } = await pool.query(
      `SELECT c.id, c.numero_cuenta, c.tipo, s.saldo_actual, c.prestamo_id 
       FROM cuentas c
       JOIN saldos_cuenta s on s.cuenta_id = c.id
       WHERE c.socio_id = $1`,
      [socio.id]
    );
    const cuentaASP = cuentasSocio.find((c: any) => c.tipo === "AHORRO_SOBRE_PRESTAMO");
    assert(!!cuentaASP, "Se creó automáticamente la cuenta de AHORRO_SOBRE_PRESTAMO para el socio");
    assert(Number(cuentaASP?.saldo_actual) === 500.0, `Saldo en cuenta ASP es Q 500.00 (obtenido: Q ${cuentaASP?.saldo_actual})`);

    // Verificar que el retiro de fondos de la cuenta ASP está bloqueado por el crédito activo
    console.log("\n🛡️ 6. Prueba de Seguridad Financiera: Intento de Retiro Ilegal en Cuenta de Garantía ASP...");
    let retiroBloqueado = false;
    try {
      await CuentasService.registrarMovimiento(
        cuentaASP!.id,
        {
          tipo: "RETIRO",
          monto: 200,
          descripcion: "Intento de retiro indebido de ASP",
        },
        usuario.id,
        null
      );
    } catch (err: any) {
      retiroBloqueado = true;
      assert(true, `El sistema BLOQUEÓ el retiro de ASP con regla de garantía: "${err.message}"`);
    }
    if (!retiroBloqueado) {
      assert(false, "ERROR DE SEGURIDAD: Se permitió retirar fondos de una cuenta de ASP con crédito activo!");
    }

    // 5. Cobro de Cuota Ordinaria en Ventanilla
    console.log("\n💵 7. Prueba de Cobro de Cuota Ordinaria (Capital Q 745.60 + Interés Q 200.00)...");
    const cobro1 = await CajaAuxiliarService.cobrarCuotaCredito(
      diaId,
      {
        prestamoId: prestamoAprobado.id,
        socioId: socio.id,
        abonoCapital: 745.60,
        interes: 200.00,
        mora: 0,
        ahorroSobrePrestamo: 0,
        docNo: `REC-${docSuffix}-1`,
        origenFondos: "FONDOS_PROPIOS",
      },
      usuario.id,
      null
    );

    assert(Number(cobro1.pago.abono_capital) === 745.60, "Abono a capital registrado: Q 745.60");
    assert(Number(cobro1.pago.interes) === 200.00, "Interés registrado: Q 200.00");
    const saldoEsperadoTrasCobro1 = Math.round((10000 - 745.60) * 100) / 100;
    assert(Number(cobro1.saldoCapitalRestante) === saldoEsperadoTrasCobro1, `Saldo restante del crédito es Q ${saldoEsperadoTrasCobro1} (obtenido: Q ${cobro1.saldoCapitalRestante})`);

    // 6. Prueba de Cascada de Cobro con Mora y Excedente Extraordinario a Capital
    console.log("\n⚡ 8. Prueba de Cobro con Mora y Cascada de Excedente Extraordinario a Capital...");
    const saldoRestanteActual = Number(cobro1.saldoCapitalRestante);
    const dist = distribuirMontoCobro(3000.0, 25.0, 185.08, saldoRestanteActual);
    assert(dist.pagoMora === 25.0, `Mora pagada con prioridad: Q 25.00 (obtenido: Q ${dist.pagoMora})`);
    assert(dist.pagoInteres === 185.08, `Interés cubierto al 100%: Q 185.08 (obtenido: Q ${dist.pagoInteres})`);
    const capitalEsperado = Math.round((3000 - 25 - 185.08) * 100) / 100;
    assert(dist.pagoCapital === capitalEsperado, `Excedente directo a amortizar Capital: Q ${capitalEsperado} (obtenido: Q ${dist.pagoCapital})`);
    assert(dist.cambio === 0, "Cambio es Q 0.00");

    const cobro2 = await CajaAuxiliarService.cobrarCuotaCredito(
      diaId,
      {
        prestamoId: prestamoAprobado.id,
        socioId: socio.id,
        abonoCapital: dist.pagoCapital,
        interes: dist.pagoInteres,
        mora: dist.pagoMora,
        ahorroSobrePrestamo: 0,
        docNo: `REC-${docSuffix}-2`,
        origenFondos: "FONDOS_PROPIOS",
      },
      usuario.id,
      null
    );

    const saldoEsperadoTrasCobro2 = Math.round((saldoRestanteActual - dist.pagoCapital) * 100) / 100;
    assert(Number(cobro2.saldoCapitalRestante) === saldoEsperadoTrasCobro2, `Saldo de capital actualizado tras abono extraordinario: Q ${saldoEsperadoTrasCobro2} (obtenido: Q ${cobro2.saldoCapitalRestante})`);

    // 7. Prueba de Liquidación / Cancelación Total del Crédito
    console.log("\n🏁 9. Liquidación Total del Préstamo y Desbloqueo Automático de Garantía ASP...");
    const saldoFinalPorPagar = Number(cobro2.saldoCapitalRestante);
    const cobroCancelacion = await CajaAuxiliarService.cobrarCuotaCredito(
      diaId,
      {
        prestamoId: prestamoAprobado.id,
        socioId: socio.id,
        abonoCapital: saldoFinalPorPagar,
        interes: 50.0,
        mora: 0,
        ahorroSobrePrestamo: 0,
        docNo: `REC-${docSuffix}-FIN`,
        origenFondos: "FONDOS_PROPIOS",
      },
      usuario.id,
      null
    );

    assert(Number(cobroCancelacion.saldoCapitalRestante) === 0, "Saldo de capital restante es exactamente Q 0.00");

    const { rows: prestamoFinalRows } = await pool.query("SELECT estado, saldo_capital FROM prestamos WHERE id = $1", [prestamoAprobado.id]);
    assert(prestamoFinalRows[0].estado === "CANCELADO", `El préstamo pasó automáticamente a estado CANCELADO (obtenido: ${prestamoFinalRows[0].estado})`);
    assert(Number(prestamoFinalRows[0].saldo_capital) === 0, "El saldo_capital en base de datos quedó en Q 0.00");

    // Verificar que ahora el socio puede disponer de su cuenta de Ahorro sobre Préstamo
    await CuentasService.registrarMovimiento(
      cuentaASP!.id,
      {
        tipo: "RETIRO",
        monto: 500,
        descripcion: "Retiro legítimo de ASP tras crédito cancelado",
      },
      usuario.id,
      null
    );
    const cuentaASPLiquidada = await CuentasService.obtener(cuentaASP!.id, null);
    assert(Number(cuentaASPLiquidada.saldo_actual) === 0.0, `Retiro de ASP permitido con éxito tras cancelación (Saldo restante: Q ${cuentaASPLiquidada.saldo_actual})`);

    // 8. Verificación de Arqueo Físico de Caja y Cierre
    console.log("\n🔒 10. Arqueo Físico de Efectivo y Cierre de Turno en Caja Auxiliar...");
    const detalleCajaAntesCierre = await CajaAuxiliarService.detalle(diaId, null);
    const saldoEsperadoCierre = Number(detalleCajaAntesCierre.saldoActual);

    // Algoritmo voraz de desglose exacto de efectivo
    let remCentavos = Math.round(saldoEsperadoCierre * 100);
    const denomsCentavos = [20000, 10000, 5000, 2000, 1000, 500, 100, 50, 25, 10, 5, 1];
    const conteoExacto = denomsCentavos.map((d) => {
      const cant = Math.floor(remCentavos / d);
      remCentavos = remCentavos % d;
      return { valor: d / 100, cantidad: cant };
    });

    const diaCerrado = await CajaAuxiliarService.cerrarDia(diaId, conteoExacto, usuario.id, null);
    assert(diaCerrado.estado === "CERRADO", "El turno de caja cambió a estado CERRADO");
    const { rows: arqueoRows } = await pool.query("SELECT diferencia, total_contado FROM caja_arqueos WHERE caja_dia_id = $1", [diaId]);
    assert(Number(arqueoRows[0]?.diferencia) === 0.0, `El arqueo cerró CUADRADO EXACTO con diferencia Q 0.00 (obtenido: Q ${arqueoRows[0]?.diferencia})`);

    // Verificar que transacciones posteriores en la caja cerrada sean RECHAZADAS
    let rechazoCajaCerrada = false;
    try {
      await CajaAuxiliarService.crearMovimiento(
        diaId,
        {
          categoria: "DEPOSITO_AHORRO_CORRIENTE",
          monto: 100,
          beneficiario: "Test",
        },
        usuario.id,
        null
      );
    } catch (err: any) {
      rechazoCajaCerrada = true;
      assert(true, `El sistema RECHAZÓ transacciones sobre caja cerrada: "${err.message}"`);
    }
    if (!rechazoCajaCerrada) {
      assert(false, "ERROR: Se permitió registrar movimiento sobre una caja CERRADA!");
    }

    console.log("\n================================================================================");
    console.log(`🎉 RESULTADOS DE AUDITORÍA: ${passedTests} / ${totalTests} PRUEBAS SUPERADAS CON ÉXITO (${Math.round((passedTests / totalTests) * 100)}%)`);
    console.log("================================================================================\n");

  } catch (error: any) {
    console.error("❌ Error no controlado durante la prueba E2E:", error);
  } finally {
    await pool.end();
  }
}

runE2EStressTest();
