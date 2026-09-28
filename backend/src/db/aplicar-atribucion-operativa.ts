import "dotenv/config";
import { pool } from "./pool";

export async function aplicarAtribucionOperativa() {
  const client = await pool.connect();
  try {
    console.log("================================================================================");
    console.log("🚀 APLICANDO ATRIBUCIÓN OPERATIVA OFICIAL EN BASE A ARCHIVOS EXCEL COMIF R.L.");
    console.log("================================================================================\n");

    // 1. Obtener IDs de usuarios
    const { rows: users } = await client.query<{ id: string; email: string; nombre: string; rol: string }>(
      "SELECT id, email, nombre, rol FROM usuarios"
    );

    const admin = users.find((u) => u.email === "admin@mif.coop");
    const diego = users.find((u) => u.email === "diego.promotor@mif.coop");
    const walter = users.find((u) => u.email === "walter.promotor@mif.coop");
    const tereza = users.find((u) => u.email === "tereza.caja@mif.coop");
    const rosy = users.find((u) => u.email === "rosy.cajachica@mif.coop");

    if (!admin || !diego || !walter || !tereza || !rosy) {
      throw new Error("No se encontraron todos los usuarios requeridos en la base de datos.");
    }

    console.log("👥 Personal Identificado:");
    console.log(`   👔 Gerencia General:   ${admin.nombre} (${admin.id})`);
    console.log(`   🌾 Promotor 1:         ${diego.nombre} (${diego.id})`);
    console.log(`   🌾 Promotor 2:         ${walter.nombre} (${walter.id})`);
    console.log(`   💵 Caja Auxiliar:      ${tereza.nombre} (${tereza.id})`);
    console.log(`   📦 Caja Chica:         ${rosy.nombre} (${rosy.id})\n`);

    // 2. Cartera de Créditos (prestamos)
    // 66 oficiales de promotor 2 -> Walter
    const rWalter = await client.query(
      `UPDATE prestamos 
       SET promotor_id = $1, updated_at = NOW() 
       WHERE origen_cartera = 'OFICIAL_PROMOTOR' OR origen_cartera IS NULL
       RETURNING id`,
      [walter.id]
    );
    console.log(`✓ ${rWalter.rowCount} créditos oficiales asignados a Walter (Promotor 2)`);

    // 84 créditos de caja Chajul -> Diego (Promotor 1)
    const rDiego = await client.query(
      `UPDATE prestamos 
       SET promotor_id = $1, updated_at = NOW() 
       WHERE origen_cartera = 'POR_REGULARIZAR'
       RETURNING id`,
      [diego.id]
    );
    console.log(`✓ ${rDiego.rowCount} créditos de cartera asignados a Diego (Promotor 1)`);

    // 3. Cobros de Campo
    const rCobrosW = await client.query(
      `UPDATE cobros_campo 
       SET promotor_id = $1 
       WHERE prestamo_id IN (SELECT id FROM prestamos WHERE promotor_id = $1)`,
      [walter.id]
    );
    const rCobrosD = await client.query(
      `UPDATE cobros_campo 
       SET promotor_id = $1 
       WHERE prestamo_id IN (SELECT id FROM prestamos WHERE promotor_id = $1)`,
      [diego.id]
    );
    console.log(`✓ Cobros de campo sincronizados con sus promotores (Walter: ${rCobrosW.rowCount}, Diego: ${rCobrosD.rowCount})`);

    // 4. Pagos de Préstamos en Ventanilla (prestamo_pagos) -> Tereza
    const rPagos = await client.query(
      `UPDATE prestamo_pagos 
       SET usuario_id = $1`,
      [tereza.id]
    );
    console.log(`✓ ${rPagos.rowCount} cobros de préstamos en ventanilla atribuidos a Tereza (Caja Auxiliar)`);

    // 5. Caja Auxiliar: Turnos de Caja (caja_dias) -> Tereza
    const rCajaDias = await client.query(
      `UPDATE caja_dias 
       SET abierto_por = $1, cerrado_por = COALESCE(cerrado_por, $1)`,
      [tereza.id]
    );
    console.log(`✓ ${rCajaDias.rowCount} jornadas de caja diaria atribuidas a Tereza`);

    // 6. Caja Auxiliar: Movimientos detallados (caja_movimientos_auxiliar) -> Tereza
    const rCajaMov = await client.query(
      `UPDATE caja_movimientos_auxiliar 
       SET usuario_id = $1`,
      [tereza.id]
    );
    console.log(`✓ ${rCajaMov.rowCount} movimientos de libro de caja auxiliar atribuidos a Tereza`);

    // 7. Arqueos de Caja (caja_arqueos & arqueos_caja) -> Tereza
    const rArqueos1 = await client.query(
      `UPDATE caja_arqueos 
       SET usuario_id = $1`,
      [tereza.id]
    );
    const rArqueos2 = await client.query(
      `UPDATE arqueos_caja 
       SET usuario_id = $1`,
      [tereza.id]
    );
    console.log(`✓ ${(rArqueos1.rowCount || 0) + (rArqueos2.rowCount || 0)} arqueos físicos de caja atribuidos a Tereza`);

    // 8. Movimientos de Cuentas de Ahorro y Aportaciones (movimientos & movimientos_caja) -> Tereza
    const rMovs = await client.query(
      `UPDATE movimientos 
       SET usuario_id = $1`,
      [tereza.id]
    );
    const rMovsCaja = await client.query(
      `UPDATE movimientos_caja 
       SET usuario_id = $1`,
      [tereza.id]
    );
    console.log(`✓ ${(rMovs.rowCount || 0) + (rMovsCaja.rowCount || 0)} transacciones de libretas y cuentas atribuidas a Tereza`);

    // 9. Ingresos COMIF (ingresos_comif) -> Tereza
    const rIngresos = await client.query(
      `UPDATE ingresos_comif 
       SET usuario_id = $1`,
      [tereza.id]
    );
    console.log(`✓ ${rIngresos.rowCount} partidas del libro de ingresos atribuidas a Tereza`);

    // 10. Caja Chica (caja_chica_comprobantes)
    // Gastos / egresos -> Rosy
    const rGastosRosy = await client.query(
      `UPDATE caja_chica_comprobantes 
       SET usuario_id = $1 
       WHERE tipo = 'EGRESO' OR tipo IS NULL`,
      [rosy.id]
    );
    // Reposiciones de fondo fijo con cheque (ingresos) -> Aprobadas por Gerencia
    const rIngresosAdmin = await client.query(
      `UPDATE caja_chica_comprobantes 
       SET usuario_id = $1 
       WHERE tipo = 'INGRESO'`,
      [admin.id]
    );
    console.log(`✓ Comprobantes de Caja Chica atribuidos: ${rGastosRosy.rowCount} compras a Rosy y ${rIngresosAdmin.rowCount} reposiciones a Gerencia`);

    // 11. Auditoría (auditoria)
    await client.query(
      `UPDATE auditoria 
       SET usuario_id = $1 
       WHERE entidad IN ('caja_chica_comprobantes')`,
      [rosy.id]
    );
    await client.query(
      `UPDATE auditoria 
       SET usuario_id = $1 
       WHERE entidad IN ('caja_dias', 'caja_movimientos_auxiliar', 'prestamo_pagos', 'ingresos_comif')`,
      [tereza.id]
    );
    await client.query(
      `UPDATE auditoria 
       SET usuario_id = $1 
       WHERE entidad = 'prestamos' AND entidad_id::text IN (SELECT id::text FROM prestamos WHERE promotor_id = $1)`,
      [walter.id]
    );
    await client.query(
      `UPDATE auditoria 
       SET usuario_id = $1 
       WHERE entidad = 'prestamos' AND entidad_id::text IN (SELECT id::text FROM prestamos WHERE promotor_id = $1)`,
      [diego.id]
    );
    console.log("✓ Bitácora de auditoría histórica alineada con cada responsable operativo.");

    console.log("\n================================================================================");
    console.log("🎉 ATRIBUCIÓN OPERATIVA COMPLETADA CON ÉXITO AL 100%");
    console.log("================================================================================");
  } finally {
    client.release();
  }
}

if (require.main === module) {
  aplicarAtribucionOperativa()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("Error en atribución:", err);
      process.exit(1);
    });
}
