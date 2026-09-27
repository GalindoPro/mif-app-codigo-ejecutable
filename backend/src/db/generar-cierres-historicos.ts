import "dotenv/config";
import { pool } from "./pool";
import { randomUUID } from "crypto";

/**
 * Script: Generar Cierres de Caja Históricos Mensuales
 *
 * Crea registros en caja_dias (uno por mes) y caja_movimientos_auxiliar
 * para cada movimiento importado en movimientos_caja (Enero–Julio 2026),
 * de modo que el Historial de Cajas muestre los datos importados.
 */

async function ejecutar() {
  const cliente = await pool.connect();

  try {
    console.log("================================================================================");
    console.log("📅 GENERANDO CIERRES HISTÓRICOS DE CAJA (Enero–Julio 2026)");
    console.log("================================================================================\n");

    const resAgencia = await cliente.query("select id, nombre from agencias where codigo = 'CHAJUL' limit 1");
    const agenciaId = resAgencia.rows[0].id;
    console.log(`📍 Agencia: ${resAgencia.rows[0].nombre}`);

    const resUser = await cliente.query("select id, email from usuarios where rol = 'GERENCIA' or email = 'admin@mif.coop' limit 1");
    const adminId = resUser.rows[0].id;
    console.log(`👤 Operador: ${resUser.rows[0].email}\n`);

    // Verificar que hay movimientos importados
    const resMovs = await cliente.query(
      `select anio, mes, 
        count(*) as total_movs,
        sum(case when tipo = 'INGRESO' then monto else 0 end) as total_ingresos,
        sum(case when tipo = 'EGRESO' then monto else 0 end) as total_egresos,
        min(fecha) as fecha_inicio,
        max(fecha) as fecha_fin
      from movimientos_caja
      where agencia_id = $1 and es_migracion = true
      group by anio, mes
      order by anio, mes`,
      [agenciaId]
    );

    if (resMovs.rows.length === 0) {
      console.log("❌ No hay movimientos importados en movimientos_caja. Ejecute primero importar-caja-general.ts");
      return;
    }

    console.log(`📊 Meses encontrados en movimientos_caja: ${resMovs.rows.length}`);
    resMovs.rows.forEach(r => {
      console.log(`   • ${r.anio}-${r.mes}: ${r.total_movs} movs | Ing: Q${Number(r.total_ingresos).toFixed(2)} | Eg: Q${Number(r.total_egresos).toFixed(2)}`);
    });

    await cliente.query("BEGIN");

    // Verificar si ya existen caja_dias históricos para no duplicar
    const resExistentes = await cliente.query(
      `select count(*) as cnt from caja_dias where agencia_id = $1`,
      [agenciaId]
    );
    if (Number(resExistentes.rows[0].cnt) > 0) {
      console.log(`\n⚠️  Ya existen ${resExistentes.rows[0].cnt} registros en caja_dias para esta agencia. Limpiando datos previos de migración...`);
      // Solo limpiar los que tienen es_migracion si existe esa columna, si no, verificar por fecha
      await cliente.query(
        `delete from caja_movimientos_auxiliar where agencia_id = $1 and descripcion like '%[MIGRACIÓN]%'`,
        [agenciaId]
      );
      await cliente.query(
        `delete from caja_dias where agencia_id = $1 and abierto_por = $2 and cast(fecha as text) < '2026-08-01'`,
        [agenciaId, adminId]
      );
    }

    let saldoAcumulado = 0;
    let totalCajasDiasCreadas = 0;
    let totalMovimientosVinculados = 0;

    // Para cada mes, crear UN registro de cierre de caja mensual
    for (const mes of resMovs.rows) {
      const fechaCierre = mes.fecha_fin as string; // Último día del mes con movimientos
      const totalIngresos = Number(mes.total_ingresos);
      const totalEgresos = Number(mes.total_egresos);
      const saldoInicial = saldoAcumulado;
      const saldoFinal = saldoInicial + totalIngresos - totalEgresos;
      saldoAcumulado = saldoFinal;

      // Crear caja_dia (cierre mensual)
      const cajaDiaId = randomUUID();
      await cliente.query(
        `insert into caja_dias (
          id, agencia_id, fecha, saldo_inicial, saldo_final,
          estado, abierto_por, cerrado_por, cerrado_at, created_at
        ) values ($1, $2, $3::date, $4, $5, 'CERRADO', $6, $6,
          ($3::date || ' 17:00:00')::timestamp at time zone 'America/Guatemala',
          ($3::date || ' 08:00:00')::timestamp at time zone 'America/Guatemala')`,
        [cajaDiaId, agenciaId, fechaCierre, saldoInicial, saldoFinal, adminId]
      );

      console.log(`\n   📆 ${mes.anio}-${mes.mes} → caja_dia creado (${fechaCierre}) | S.Ini: Q${saldoInicial.toFixed(2)} | S.Fin: Q${saldoFinal.toFixed(2)}`);

      // Obtener todos los movimientos de este mes para crear los caja_movimientos_auxiliar
      const resMovsMes = await cliente.query(
        `select * from movimientos_caja
         where agencia_id = $1 and anio = $2 and mes = $3 and es_migracion = true
         order by fecha, doc_no`,
        [agenciaId, mes.anio, mes.mes]
      );

      // Batch insert en caja_movimientos_auxiliar
      let contadorMes = 1;
      let saldoAcumMes = saldoInicial;

      const bIds: string[] = [];
      const bCajaDiaIds: string[] = [];
      const bAgIds: string[] = [];
      const bFechas: string[] = [];
      const bSecciones: string[] = [];
      const bCategorias: string[] = [];
      const bTipos: string[] = [];
      const bContadores: number[] = [];
      const bBeneficiarios: string[] = [];
      const bDescripciones: string[] = [];
      const bDocNos: string[] = [];
      const bMontos: number[] = [];
      const bSaldosAcum: number[] = [];
      const bUsrIds: string[] = [];

      for (const mov of resMovsMes.rows) {
        const monto = Number(mov.monto);
        saldoAcumMes = mov.tipo === "INGRESO"
          ? saldoAcumMes + monto
          : saldoAcumMes - monto;

        // Mapear tipo_interno a sección y categoría del sistema
        const { seccion, categoria } = mapearTipoInterno(mov.tipo_interno, mov.tipo);

        bIds.push(randomUUID());
        bCajaDiaIds.push(cajaDiaId);
        bAgIds.push(agenciaId);
        bFechas.push(mov.fecha);
        bSecciones.push(seccion);
        bCategorias.push(categoria);
        bTipos.push(mov.tipo);
        bContadores.push(contadorMes++);
        bBeneficiarios.push(mov.nombre_beneficiario || "—");
        bDescripciones.push(`[MIGRACIÓN] ${mov.descripcion || mov.tipo_interno}`);
        bDocNos.push(mov.doc_no || "");
        bMontos.push(monto);
        bSaldosAcum.push(saldoAcumMes);
        bUsrIds.push(adminId);
      }

      if (bIds.length > 0) {
        await cliente.query(
          `insert into caja_movimientos_auxiliar (
            id, caja_dia_id, agencia_id, fecha, seccion, categoria, tipo,
            contador, beneficiario, descripcion, doc_no, monto,
            saldo_acumulado, usuario_id
          )
          select
            unnest($1::uuid[]), unnest($2::uuid[]), unnest($3::uuid[]),
            unnest($4::date[]), unnest($5::text[])::caja_seccion, unnest($6::text[])::caja_categoria,
            unnest($7::text[])::tipo_comprobante_caja,
            unnest($8::int[]), unnest($9::text[]), unnest($10::text[]),
            unnest($11::text[]), unnest($12::numeric[]),
            unnest($13::numeric[]), unnest($14::uuid[])`,
          [bIds, bCajaDiaIds, bAgIds, bFechas, bSecciones, bCategorias, bTipos,
           bContadores, bBeneficiarios, bDescripciones, bDocNos, bMontos, bSaldosAcum, bUsrIds]
        );
        totalMovimientosVinculados += bIds.length;
        console.log(`      ✓ ${bIds.length} movimientos vinculados en caja_movimientos_auxiliar`);
      }

      totalCajasDiasCreadas++;
    }

    await cliente.query("COMMIT");

    console.log("\n================================================================================");
    console.log("📊 RESUMEN FINAL");
    console.log("================================================================================");
    console.log(`  Cierres de caja (caja_dias) creados : ${totalCajasDiasCreadas} meses`);
    console.log(`  Movimientos vinculados              : ${totalMovimientosVinculados}`);
    console.log(`  Saldo final acumulado (Julio 2026)  : Q ${saldoAcumulado.toFixed(2)}`);
    console.log("  ✅ El Historial de Cajas ahora mostrará los datos históricos importados.");
    console.log("================================================================================\n");

  } catch (error) {
    await cliente.query("ROLLBACK");
    console.error("❌ ERROR:", error);
    process.exit(1);
  } finally {
    cliente.release();
    await pool.end();
  }
}

function mapearTipoInterno(tipoInterno: string, tipo: string): { seccion: string; categoria: string } {
  // caja_seccion enum: BI, PROPIO
  // caja_categoria enum: SERVICIOS_BI, DEPOSITO_AHORRO_CORRIENTE, RETIRO_AHORRO_CORRIENTE, RETIRO_PLAZO_FIJO,
  //   APORTACION, INGRESO_ASOCIADO, COMISION, ABONO_PRESTAMO_HIPOTECARIO, INTERES_PRESTAMO_HIPOTECARIO,
  //   MORA_PRESTAMO_HIPOTECARIO, ABONO_PRESTAMO_FIDUCIARIO, INTERES_PRESTAMO_FIDUCIARIO,
  //   MORA_PRESTAMO_FIDUCIARIO, COLOCACION_PRESTAMO, EGRESO_VARIO, INGRESO_VARIO, TRASLADO_FONDOS
  const map: Record<string, { seccion: string; categoria: string }> = {
    DEPOSITO_AHORRO:       { seccion: "PROPIO",  categoria: "DEPOSITO_AHORRO_CORRIENTE" },
    RETIRO_AHORRO:         { seccion: "PROPIO",  categoria: "RETIRO_AHORRO_CORRIENTE" },
    RETIRO_PLAZO_FIJO:     { seccion: "PROPIO",  categoria: "RETIRO_PLAZO_FIJO" },
    ABONO_HIPOTECARIO:     { seccion: "PROPIO",  categoria: "ABONO_PRESTAMO_HIPOTECARIO" },
    ABONO_FIDUCIARIO:      { seccion: "PROPIO",  categoria: "ABONO_PRESTAMO_FIDUCIARIO" },
    INTERES_HIPOTECARIO:   { seccion: "PROPIO",  categoria: "INTERES_PRESTAMO_HIPOTECARIO" },
    INTERES_FIDUCIARIO:    { seccion: "PROPIO",  categoria: "INTERES_PRESTAMO_FIDUCIARIO" },
    MORA_PRESTAMO:         { seccion: "PROPIO",  categoria: "MORA_PRESTAMO_FIDUCIARIO" },
    COMISION_PRESTAMO:     { seccion: "PROPIO",  categoria: "COMISION" },
    DESEMBOLSO_CREDITO:    { seccion: "PROPIO",  categoria: "COLOCACION_PRESTAMO" },
    APORTACION_ORDINARIA:  { seccion: "PROPIO",  categoria: "APORTACION" },
    CUOTA_INGRESO:         { seccion: "PROPIO",  categoria: "INGRESO_ASOCIADO" },
    GASTO_ADMINISTRATIVO:  { seccion: "PROPIO",  categoria: "EGRESO_VARIO" },
    GASTO_CAJA_CHICA:      { seccion: "PROPIO",  categoria: "EGRESO_VARIO" },
    SERVICIO_BANCARIO:     { seccion: "BI",      categoria: "SERVICIOS_BI" },
  };
  const resultado = map[tipoInterno];
  if (resultado) return resultado;
  return {
    seccion: "PROPIO",
    categoria: tipo === "INGRESO" ? "INGRESO_VARIO" : "EGRESO_VARIO"
  };
}


ejecutar();
