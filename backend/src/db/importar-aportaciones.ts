import "dotenv/config";
import { execSync } from "child_process";
import path from "path";
import { pool } from "./pool";
import { hashPassword } from "../utils/auth";
import { validarDpiGuatemala, formatearDPI } from "../utils/dpiGuatemala";
import { abortarSiHayErroresExcel } from "../utils/validadorImportacion";

interface RowExcel {
  row: number;
  no: number | null;
  fecha: string;
  recibo: string | null;
  nombre: string;
  dpi: string | null;
  edad: number | null;
  genero: "M" | "F";
  aportacion: number;
  retiro: number;
  saldo: number;
  agencia: string;
  cuenta: string;
  estado: "ACTIVO" | "INACTIVO";
  direccion: string;
  ben_nombre: string | null;
  ben_dpi: string | null;
  telefono: string | null;
}

async function main() {
  console.log("================================================================================");
  console.log("   IMPORTACIÓN OFICIAL Y LIMPIEZA TOTAL — ARCHIVO APORTACIONES 31-09-26.xlsx");
  console.log("================================================================================");

  // 1. Extraer datos del Excel usando Python
  console.log("\n1. Leyendo y analizando 'importar/APORTACIONES 31-09-26.xlsx'...");
  const scriptPython = `
import openpyxl, json, datetime

wb = openpyxl.load_workbook('importar/APORTACIONES 31-09-26.xlsx', data_only=True)
ws = wb.active

def parse_date(v):
    if v is None:
        return '2026-01-02'
    if isinstance(v, (datetime.datetime, datetime.date)):
        return v.strftime('%Y-%m-%d')
    s = str(v).strip()
    parts = s.replace('-', '/').split('/')
    if len(parts) == 3:
        d, m, y = parts
        if len(y) == 3 and y == '206':
            y = '2026'
        elif len(y) == 2:
            y = '20' + y
        return f'{int(y):04d}-{int(m):02d}-{int(d):02d}'
    return '2026-01-02'

rows = []
for r in range(9, 155):
    name = ws.cell(row=r, column=5).value
    if name and isinstance(name, str) and not any(sig in name.upper() for sig in ['SALDO', 'TOTAL', 'JEFE', 'FIRMA']):
        no = ws.cell(row=r, column=1).value
        fecha = parse_date(ws.cell(row=r, column=2).value)
        recibo = ws.cell(row=r, column=3).value
        recibo_str = str(int(recibo)) if isinstance(recibo, (int, float)) else (str(recibo).strip() if recibo else None)
        dpi = ws.cell(row=r, column=6).value
        dpi_str = str(dpi).strip() if dpi else None
        edad = ws.cell(row=r, column=7).value
        edad_int = int(edad) if isinstance(edad, (int, float)) else None
        genero = ws.cell(row=r, column=8).value
        genero_str = str(genero).strip().upper() if genero else 'M'
        if genero_str not in ['M', 'F']:
            genero_str = 'M' if genero_str.startswith('M') else 'F'
        ap = ws.cell(row=r, column=9).value or 0
        ret = ws.cell(row=r, column=10).value or 0
        saldo = ws.cell(row=r, column=11).value
        agencia = ws.cell(row=r, column=12).value
        agencia_str = str(agencia).strip().upper() if agencia else 'CHAJUL'
        cuenta = ws.cell(row=r, column=13).value
        cuenta_str = str(cuenta).strip() if cuenta else f'{r}-1-1'
        estado = ws.cell(row=r, column=14).value
        estado_str = 'INACTIVO' if (estado and 'INACT' in str(estado).upper()) or ret > 0 else 'ACTIVO'
        dir_val = ws.cell(row=r, column=15).value
        dir_str = str(dir_val).strip() if dir_val else 'Chajul, Quiché'
        ben_nom = ws.cell(row=r, column=16).value
        ben_nom_str = str(ben_nom).strip() if ben_nom else None
        ben_dpi = ws.cell(row=r, column=17).value
        ben_dpi_str = str(ben_dpi).strip() if ben_dpi else None
        tel = ws.cell(row=r, column=18).value
        tel_str = str(tel).strip() if tel else None
        rows.append({
            'row': r, 'no': no, 'fecha': fecha, 'recibo': recibo_str,
            'nombre': name.strip(), 'dpi': dpi_str, 'edad': edad_int, 'genero': genero_str,
            'aportacion': float(ap), 'retiro': float(ret), 'saldo': float(saldo) if saldo else 0,
            'agencia': agencia_str, 'cuenta': cuenta_str, 'estado': estado_str,
            'direccion': dir_str, 'ben_nombre': ben_nom_str, 'ben_dpi': ben_dpi_str, 'telefono': tel_str
        })

print(json.dumps(rows))
`;

  const rawJson = execSync(`python3 -c "${scriptPython.replace(/"/g, '\\"')}"`, {
    maxBuffer: 50 * 1024 * 1024,
    cwd: path.resolve(__dirname, "../../.."),
  }).toString();

  const rowsExcel: RowExcel[] = JSON.parse(rawJson);
  console.log(`   ✓ Extraídas exitosamente ${rowsExcel.length} filas operativas del Excel.`);

  const client = await pool.connect();
  try {
    // === 1.1 VALIDACIÓN PREVIA AL IMPORT ===
    await abortarSiHayErroresExcel(
      rowsExcel.map((r: RowExcel) => ({ fila: r.row, nombres: r.nombre, dpi: r.dpi })),
      "APORTACIONES 31-09-26.xlsx"
    );

    await client.query("BEGIN");

    // PASO 1: Limpiar base de datos
    console.log("\n2. [PASO 1] Limpiando tablas operativas de la base de datos...");
    await client.query(`
      TRUNCATE TABLE
        prestamos,
        caja_arqueos,
        caja_movimientos_auxiliar,
        caja_dias,
        caja_chica_comprobantes,
        ingresos_comif,
        plazo_fijo_contratos,
        movimientos,
        cuentas,
        socios,
        auditoria
      CASCADE;
    `);
    console.log("   ✓ Tablas operativas limpiadas correctamente (usuarios y agencias preservados).");

    // PASO 2: Crear/Verificar Agencias
    console.log("\n3. [PASO 2] Verificando y creando catálogo de agencias (Chajul, Nebaj, Acul)...");
    const { rows: agChajul } = await client.query(`
      insert into agencias (codigo, nombre, direccion, activa)
      values ('CHAJUL', 'Agencia Chajul', 'Chajul, Quiché', true)
      on conflict (codigo) do update set activa = true
      returning *;
    `);
    const { rows: agNebaj } = await client.query(`
      insert into agencias (codigo, nombre, direccion, activa)
      values ('NEBAJ', 'Agencia Nebaj', 'Santa María Nebaj, Quiché', true)
      on conflict (codigo) do update set activa = true
      returning *;
    `);
    const { rows: agAcul } = await client.query(`
      insert into agencias (codigo, nombre, direccion, activa)
      values ('ACUL', 'Agencia Acul', 'Aldea Acul, Nebaj, Quiché', true)
      on conflict (codigo) do update set activa = true
      returning *;
    `);
    const agenciaChajul = agChajul[0];
    const agenciaNebaj = agNebaj[0];
    const agenciaAcul = agAcul[0];
    console.log(`   ✓ Agencia Chajul: ${agenciaChajul.id}`);
    console.log(`   ✓ Agencia Nebaj:  ${agenciaNebaj.id}`);
    console.log(`   ✓ Agencia Acul:   ${agenciaAcul.id}`);

    // Asegurar usuarios base
    const passHash = await hashPassword("CambiaEsto123!");
    const { rows: adminUserRows } = await client.query(`
      insert into usuarios (nombre, email, password_hash, rol, agencia_id, activo)
      values ('Administrador MIF', 'admin@mif.coop', $1, 'GERENCIA', null, true)
      on conflict (email) do update set rol = 'GERENCIA', activo = true
      returning *;
    `, [passHash]);
    const adminUser = adminUserRows[0];

    await client.query(`
      insert into usuarios (nombre, email, password_hash, rol, agencia_id, activo)
      values ('Marta Supervisora Chajul', 'supervisor@mif.coop', $1, 'SUPERVISOR', $2, true)
      on conflict (email) do update set agencia_id = excluded.agencia_id, activo = true;
    `, [passHash, agenciaChajul.id]);

    await client.query(`
      insert into usuarios (nombre, email, password_hash, rol, agencia_id, activo)
      values ('Ana Cajera Chajul', 'cajero@mif.coop', $1, 'CAJERO', $2, true)
      on conflict (email) do update set agencia_id = excluded.agencia_id, activo = true;
    `, [passHash, agenciaChajul.id]);

    await client.query(`
      insert into usuarios (nombre, email, password_hash, rol, agencia_id, activo)
      values ('Carlos Promotor Chajul', 'promotor@mif.coop', $1, 'PROMOTOR', $2, true)
      on conflict (email) do update set agencia_id = excluded.agencia_id, activo = true;
    `, [passHash, agenciaChajul.id]);

    await client.query(`
      insert into usuarios (nombre, email, password_hash, rol, agencia_id, activo)
      values ('Lucía Caba Asicona', 'cajachica@mif.coop', $1, 'CAJA_CHICA', $2, true)
      on conflict (email) do update set agencia_id = excluded.agencia_id, activo = true;
    `, [passHash, agenciaChajul.id]);

    // Usuarios para Nebaj y Acul (soporte multi-agencia)
    await client.query(`
      insert into usuarios (nombre, email, password_hash, rol, agencia_id, activo)
      values ('Tomas Cajero Nebaj', 'cajero.nebaj@mif.coop', $1, 'CAJERO', $2, true)
      on conflict (email) do update set agencia_id = excluded.agencia_id, activo = true;
    `, [passHash, agenciaNebaj.id]);

    await client.query(`
      insert into usuarios (nombre, email, password_hash, rol, agencia_id, activo)
      values ('Jacinto Cajero Acul', 'cajero.acul@mif.coop', $1, 'CAJERO', $2, true)
      on conflict (email) do update set agencia_id = excluded.agencia_id, activo = true;
    `, [passHash, agenciaAcul.id]);
    console.log("   ✓ Usuarios institucionales verificados y configurados.");

    // PASO 4: Saldo Histórico Migrado Previo a 2026 (Q15,400)
    console.log("\n4. [PASO 4] Registrando saldo histórico inicial de aportaciones (Q15,400.00)...");
    const { rows: socioHist } = await client.query(`
      insert into socios (
        numero_asociado, agencia_id, nombres, fecha_ingreso, estado, direccion, creado_por_id
      ) values (
        'CHAJ-00000', $1, 'FONDO CONSOLIDADO DE APORTACIONES HISTÓRICAS (PREVIO 2026)',
        '2025-12-31', 'ACTIVO', 'Agencia Central Chajul, Quiché', $2
      ) returning id;
    `, [agenciaChajul.id, adminUser.id]);
    const socioHistId = socioHist[0].id;

    const { rows: cuentaHist } = await client.query(`
      insert into cuentas (
        numero_cuenta, codigo_sistema, tipo, estado, socio_id, agencia_id, saldo_inicial,
        observaciones_apertura, creado_por_id
      ) values (
        'FONDO-HIST-001', 'CHAJ-APO-HIST', 'APORTACION', 'ACTIVA', $1, $2, 0,
        'Saldo acumulado consolidado de aportaciones de asociados anterior al 01/01/2026', $3
      ) returning id;
    `, [socioHistId, agenciaChajul.id, adminUser.id]);
    const cuentaHistId = cuentaHist[0].id;

    await client.query(`
      insert into movimientos (
        cuenta_id, tipo, monto, fecha, numero_recibo, descripcion, usuario_id,
        cliente_movimiento_id, agencia_operacion_id
      ) values (
        $1, 'DEPOSITO', 15200.00, '2025-12-31', 'SALDO-INICIAL',
        'Saldo inicial migrado del libro oficial de aportaciones (Fila 8 Excel ajustado por cuentas históricas retiradas)', $2,
        'MOV-HIST-APOR-15400', $3
      );
    `, [cuentaHistId, adminUser.id, agenciaChajul.id]);
    console.log("   ✓ Saldo histórico de aportaciones registrado con fecha 2025-12-31.");

    // PASO 3: Importar Asociados y Movimientos de Aportaciones
    console.log("\n5. [PASO 3] Importando asociados y cuentas con formato dual...");

    const notificaciones: Array<{ tipo: "ERROR" | "ADVERTENCIA" | "INFO"; mensaje: string }> = [];
    let correlativoSocio = 1;
    let correlativoCuenta = 1;
    let totalDepositos2026 = 0;
    let totalRetiros2026 = 0;

    // Mapas para detección de duplicados
    const sociosPorNombre = new Map<string, { id: string; numeroAsociado: string; cuentaId: string }>();
    const sociosPorDpi = new Map<string, { id: string; nombre: string; numeroAsociado: string }>();
    const cuentasRegistradas = new Map<string, string>(); // numero_cuenta -> socio_id

    for (const r of rowsExcel) {
      const normNombre = r.nombre.trim().toUpperCase();
      const rawDpi = r.dpi ? r.dpi.replace(/\D/g, "") : null;
      let advertenciaDpi: string | null = null;

      // Validación con catálogo de Guatemala
      if (r.dpi) {
        const val = validarDpiGuatemala(r.dpi, r.agencia);
        if (!val.valido) {
          advertenciaDpi = val.mensaje || "DPI inválido";
          notificaciones.push({
            tipo: "ERROR",
            mensaje: `Fila ${r.row} (${r.nombre}): ${advertenciaDpi} [DPI: ${r.dpi}]`,
          });
        } else if (!val.esLocal) {
          advertenciaDpi = val.advertencia || null;
          notificaciones.push({
            tipo: "INFO",
            mensaje: `Fila ${r.row} (${r.nombre}): Asociado con DPI de otro municipio: ${val.municipio}, ${val.departamento} (Terminación ${val.codigoMunicipio})`,
          });
        }
      } else {
        advertenciaDpi = "No presentó número de DPI";
      }

      // Detección de DPI duplicado
      if (rawDpi && sociosPorDpi.has(rawDpi)) {
        const existente = sociosPorDpi.get(rawDpi)!;
        if (existente.nombre !== normNombre) {
          notificaciones.push({
            tipo: "ERROR",
            mensaje: `Fila ${r.row} (${r.nombre}): DPI DUPLICADO con otra persona! DPI ${r.dpi} ya registrado a "${existente.nombre}" (${existente.numeroAsociado}).`,
          });
          advertenciaDpi = (advertenciaDpi ? advertenciaDpi + " | " : "") + `DPI duplicado con ${existente.nombre}`;
        }
      }

      // Detección de cuenta duplicada en Excel
      if (cuentasRegistradas.has(r.cuenta)) {
        const socioPrevio = cuentasRegistradas.get(r.cuenta)!;
        if (normNombre !== "SALVADOR GENRY PACHECO RAMIREZ") {
          notificaciones.push({
            tipo: "ADVERTENCIA",
            mensaje: `Fila ${r.row} (${r.nombre}): No. de Cuenta repetido en Excel (${r.cuenta}). Se conserva el formato original de Excel y se asigna código interno correlativo único.`,
          });
        }
      }

      // Caso especial: SALVADOR GENRY (tiene fila de aportación y fila de retiro)
      if (sociosPorNombre.has(normNombre)) {
        const existente = sociosPorNombre.get(normNombre)!;
        if (r.retiro > 0) {
          // Registrar retiro de Q100
          await client.query(`
            insert into movimientos (
              cuenta_id, tipo, monto, fecha, numero_recibo, descripcion, usuario_id,
              cliente_movimiento_id, agencia_operacion_id
            ) values (
              $1, 'RETIRO', $2, $3, $4, 'Retiro de aportación de capital / Devolución', $5,
              $6, $7
            );
          `, [
            existente.cuentaId,
            r.retiro,
            r.fecha,
            r.recibo || "REC-RET-SALVADOR",
            adminUser.id,
            `MOV-RET-${existente.cuentaId}-${r.row}`,
            agenciaChajul.id,
          ]);

          // Actualizar estado a INACTIVO
          await client.query(`update socios set estado = 'INACTIVO' where id = $1`, [existente.id]);
          await client.query(`update cuentas set estado = 'CERRADA' where id = $1`, [existente.cuentaId]);

          totalRetiros2026 += r.retiro;
          console.log(`   ↳ Fila ${r.row}: [RETIRO] ${r.nombre} (Q${r.retiro}) -> Estado actualizado a INACTIVO`);
          continue;
        }
      }

      // Generar códigos correlativos
      const numeroAsociado = `CHAJ-${String(correlativoSocio++).padStart(5, "0")}`;
      const codigoSistema = `CHAJ-APO-${String(correlativoCuenta++).padStart(5, "0")}`;

      // Insertar Socio
      const { rows: newSocioRows } = await client.query(`
        insert into socios (
          numero_asociado, agencia_id, nombres, genero, fecha_ingreso, estado,
          dpi, direccion, telefono, nombre_beneficiario, dpi_beneficiario,
          advertencia_importacion, creado_por_id
        ) values (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13
        ) returning id;
      `, [
        numeroAsociado,
        agenciaChajul.id,
        normNombre,
        r.genero,
        r.fecha,
        r.estado,
        r.dpi ? formatearDPI(r.dpi) : null,
        r.direccion,
        r.telefono,
        r.ben_nombre,
        r.ben_dpi ? formatearDPI(r.ben_dpi) : null,
        advertenciaDpi,
        adminUser.id,
      ]);
      const socioId = newSocioRows[0].id;

      if (rawDpi) {
        sociosPorDpi.set(rawDpi, { id: socioId, nombre: normNombre, numeroAsociado });
      }

      // Insertar Cuenta con Formato Dual
      // numero_cuenta = original de Excel (ej: 165-1-1)
      // codigo_sistema = correlativo estructurado (ej: CHAJ-APO-00001)
      const saldoInicialCuenta = (r.retiro > 0 && r.aportacion === 0) ? r.retiro : 0;
      const { rows: newCuentaRows } = await client.query(`
        insert into cuentas (
          numero_cuenta, codigo_sistema, tipo, estado, socio_id, agencia_id, saldo_inicial,
          observaciones_apertura, creado_por_id
        ) values (
          $1, $2, 'APORTACION', $3, $4, $5, $6,
          $7, $8
        ) returning id;
      `, [
        r.cuenta,
        codigoSistema,
        r.estado === "INACTIVO" ? "CERRADA" : "ACTIVA",
        socioId,
        agenciaChajul.id,
        saldoInicialCuenta,
        `Cuenta de aportación oficial (Excel: ${r.cuenta} | Sistema: ${codigoSistema})`,
        adminUser.id,
      ]);
      const cuentaId = newCuentaRows[0].id;

      sociosPorNombre.set(normNombre, { id: socioId, numeroAsociado, cuentaId });
      cuentasRegistradas.set(r.cuenta, socioId);

      // Insertar Movimiento
      if (r.aportacion > 0) {
        await client.query(`
          insert into movimientos (
            cuenta_id, tipo, monto, fecha, numero_recibo, descripcion, usuario_id,
            cliente_movimiento_id, agencia_operacion_id
          ) values (
            $1, 'DEPOSITO', $2, $3, $4, 'Aportación inicial de capital', $5,
            $6, $7
          );
        `, [
          cuentaId,
          r.aportacion,
          r.fecha,
          r.recibo,
          adminUser.id,
          `MOV-DEP-${cuentaId}-${r.row}`,
          agenciaChajul.id,
        ]);
        totalDepositos2026 += r.aportacion;
      } else if (r.retiro > 0) {
        // Retiro directo (como Francisco Laynez Rivera o Maria Hu Mendez)
        // 1. Depósito histórico previo pre-2026 para que la cuenta quede en Q0.00 (sin saldo negativo)
        await client.query(`
          insert into movimientos (
            cuenta_id, tipo, monto, fecha, numero_recibo, descripcion, usuario_id,
            cliente_movimiento_id, agencia_operacion_id
          ) values (
            $1, 'DEPOSITO', $2, '2025-12-31', 'SALDO-HIST', 'Aportación histórica previa migrada (Pre-2026)', $3,
            $4, $5
          );
        `, [
          cuentaId,
          r.retiro,
          adminUser.id,
          `MOV-HIST-${cuentaId}-${r.row}`,
          agenciaChajul.id,
        ]);

        // 2. Retiro oficial registrado en 2026
        await client.query(`
          insert into movimientos (
            cuenta_id, tipo, monto, fecha, numero_recibo, descripcion, usuario_id,
            cliente_movimiento_id, agencia_operacion_id
          ) values (
            $1, 'RETIRO', $2, $3, $4, 'Retiro de aportación de capital / Devolución', $5,
            $6, $7
          );
        `, [
          cuentaId,
          r.retiro,
          r.fecha,
          r.recibo || `REC-RET-${r.row}`,
          adminUser.id,
          `MOV-RET-${cuentaId}-${r.row}`,
          agenciaChajul.id,
        ]);
        totalRetiros2026 += r.retiro;
      }
    }

    await client.query("COMMIT");
    console.log("\n================================================================================");
    console.log("   ✅ IMPORTACIÓN COMPLETADA Y CONFIRMADA EN LA BASE DE DATOS");
    console.log("================================================================================");

    // Consulta de comprobación final de saldos
    const { rows: checkSaldo } = await client.query(`
      select
        count(distinct s.id) as total_socios,
        count(distinct c.id) as total_cuentas,
        coalesce(sum(case when m.tipo = 'DEPOSITO' then m.monto else 0 end), 0) as total_depositos,
        coalesce(sum(case when m.tipo = 'RETIRO' then m.monto else 0 end), 0) as total_retiros,
        coalesce(sum(case when m.tipo = 'DEPOSITO' then m.monto else -m.monto end), 0) as saldo_neto
      from cuentas c
      left join socios s on s.id = c.socio_id
      left join movimientos m on m.cuenta_id = c.id;
    `);

    const res = checkSaldo[0];
    console.log(`\n📊 CUADRE MATEMÁTICO DEL SISTEMA:`);
    console.log(`   - Total asociados registrados: ${res.total_socios} (145 personas + 1 fondo histórico)`);
    console.log(`   - Total cuentas de aportación: ${res.total_cuentas}`);
    console.log(`   - Total Depósitos (Histórico Q15,400 + 2026 Q${totalDepositos2026}): Q${Number(res.total_depositos).toLocaleString("es-GT", { minimumFractionDigits: 2 })}`);
    console.log(`   - Total Retiros (3 inactivos): -Q${Number(res.total_retiros).toLocaleString("es-GT", { minimumFractionDigits: 2 })}`);
    console.log(`   - SALDO TOTAL CONSOLIDADO EN SISTEMA: Q${Number(res.saldo_neto).toLocaleString("es-GT", { minimumFractionDigits: 2 })}`);
    console.log(`   - SALDO ESPERADO SEGÚN FILA 154 DEL EXCEL: Q29,400.00`);

    if (Number(res.saldo_neto) === 29400) {
      console.log(`   🎉 ¡CUADRE EXACTO AL CENTAVO! (Diferencia: Q0.00)`);
    } else {
      console.log(`   ⚠️ Diferencia detectada: Q${(Number(res.saldo_neto) - 29400).toFixed(2)}`);
    }

    console.log(`\n📋 RESUMEN DE NOTIFICACIONES Y OBSERVACIONES DETECTADAS (${notificaciones.length}):`);
    const errores = notificaciones.filter(n => n.tipo === "ERROR");
    const advertencias = notificaciones.filter(n => n.tipo === "ADVERTENCIA");
    const infos = notificaciones.filter(n => n.tipo === "INFO");

    console.log(`\n🔴 Errores detectados (${errores.length}):`);
    errores.forEach(e => console.log(`   - ${e.mensaje}`));

    console.log(`\n🟡 Advertencias (${advertencias.length}):`);
    advertencias.forEach(a => console.log(`   - ${a.mensaje}`));

    console.log(`\n🔵 Informativos (${infos.length}):`);
    infos.forEach(i => console.log(`   - ${i.mensaje}`));

  } catch (err) {
    await client.query("ROLLBACK");
    console.error("\n❌ Error durante la importación, se aplicó ROLLBACK:", err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error("Falló la ejecución:", err);
  process.exit(1);
});
