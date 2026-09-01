import { pool } from "../../db/pool";
import { registrarAuditoria } from "../../utils/auditoria";
import { badRequest, notFound, forbidden, conflict } from "../../utils/errors";
import { calcularPlazoFijo } from "./calculo";
import type { ParametrosPlazoFijo } from "./calculo";

export async function siguienteCertificado(agenciaId: string): Promise<string> {
  const { rows } = await pool.query(
    `select count(*)::int as total
     from plazo_fijo_contratos pf
     join cuentas c on c.id = pf.cuenta_id
     where c.agencia_id = $1`,
    [agenciaId],
  );
  return String(rows[0].total + 1);
}

export async function siguienteCodigoCuenta(agenciaId: string): Promise<string> {
  const { rows: agencias } = await pool.query(`select codigo from agencias where id = $1`, [agenciaId]);
  const codigoAgencia = agencias[0]?.codigo ?? "MIF";

  const { rows } = await pool.query(
    `select count(*)::int as total from cuentas where agencia_id = $1 and tipo = 'AHORRO_PLAZO_FIJO'`,
    [agenciaId],
  );
  const secuencial = String(rows[0].total + 1).padStart(4, "0");
  return `${codigoAgencia}-PF-${secuencial}`;
}

export async function listar(params: {
  agenciaId: string | null;
  estado?: "ACTIVO" | "LIQUIDADO";
  q?: string;
}) {
  const condiciones: string[] = ["c.tipo = 'AHORRO_PLAZO_FIJO'"];
  const valores: unknown[] = [];

  if (params.agenciaId) {
    valores.push(params.agenciaId);
    condiciones.push(`c.agencia_id = $${valores.length}`);
  }
  if (params.estado) {
    valores.push(params.estado);
    condiciones.push(`pf.estado = $${valores.length}`);
  }
  if (params.q) {
    const qClean = params.q.replace(/\D/g, "");
    valores.push(`%${params.q.toLowerCase()}%`);
    const idx = valores.length;
    if (qClean.length >= 3) {
      valores.push(`%${qClean}%`);
      const idxClean = valores.length;
      condiciones.push(
        `(lower(s.nombres) like $${idx} or lower(c.numero_cuenta) like $${idx} or pf.numero_certificacion like $${idx} or s.dpi like $${idx} or regexp_replace(coalesce(s.dpi, ''), '[^0-9]', '', 'g') like $${idxClean})`,
      );
    } else {
      condiciones.push(
        `(lower(s.nombres) like $${idx} or lower(c.numero_cuenta) like $${idx} or pf.numero_certificacion like $${idx} or s.dpi like $${idx})`,
      );
    }
  }

  const query = `
    select pf.*,
           c.id as cuenta_id, c.numero_cuenta, c.agencia_id,
           s.id as socio_id, s.nombres as socio_nombres, s.numero_asociado, s.dpi as socio_dpi, s.telefono as socio_telefono,
           a.nombre as agencia_nombre, a.codigo as agencia_codigo,
           coalesce(sc.saldo_actual, c.saldo_inicial) as saldo_actual
    from plazo_fijo_contratos pf
    join cuentas c on c.id = pf.cuenta_id
    join socios s on s.id = c.socio_id
    join agencias a on a.id = c.agencia_id
    left join saldos_cuenta sc on sc.cuenta_id = c.id
    where ${condiciones.join(" and ")}
    order by pf.created_at desc
  `;

  const { rows } = await pool.query(query, valores);
  return rows;
}

export async function obtener(id: string, agenciaVisible: string | null) {
  const query = `
    select pf.*,
           c.id as cuenta_id, c.numero_cuenta, c.agencia_id, c.estado as cuenta_estado,
           s.id as socio_id, s.nombres as socio_nombres, s.numero_asociado, s.dpi as socio_dpi, s.telefono as socio_telefono, s.direccion as socio_direccion,
           a.nombre as agencia_nombre, a.codigo as agencia_codigo,
           coalesce(sc.saldo_actual, c.saldo_inicial) as saldo_actual
    from plazo_fijo_contratos pf
    join cuentas c on c.id = pf.cuenta_id
    join socios s on s.id = c.socio_id
    join agencias a on a.id = c.agencia_id
    left join saldos_cuenta sc on sc.cuenta_id = c.id
    where pf.id = $1
  `;

  const { rows } = await pool.query(query, [id]);
  const contrato = rows[0];
  if (!contrato) throw notFound("Contrato de plazo fijo no encontrado");
  if (agenciaVisible && contrato.agencia_id !== agenciaVisible) {
    throw forbidden("Ese contrato pertenece a otra agencia");
  }

  return contrato;
}

export interface DatosCrearPlazoFijo {
  agenciaId: string;
  socioId: string;
  numeroCuenta?: string;
  numeroCertificacion?: string;
  montoDeposito: number;
  plazoMeses: number;
  tasaAnual: number;
  isrPorcentaje?: number;
  fechaInicio?: string;
}

export async function crear(data: DatosCrearPlazoFijo, usuarioId: string) {
  if (data.montoDeposito <= 0) throw badRequest("El monto debe ser mayor a cero");
  if (data.plazoMeses < 1) throw badRequest("El plazo mínimo es de 1 mes");
  if (data.tasaAnual < 0) throw badRequest("La tasa de interés no puede ser negativa");

  const calc = calcularPlazoFijo({
    montoDeposito: data.montoDeposito,
    plazoMeses: data.plazoMeses,
    tasaAnual: data.tasaAnual,
    isrPorcentaje: data.isrPorcentaje,
    fechaInicio: data.fechaInicio,
  });

  const numeroCuenta = data.numeroCuenta || (await siguienteCodigoCuenta(data.agenciaId));
  const numeroCert = data.numeroCertificacion || (await siguienteCertificado(data.agenciaId));

  const { rows: certRepetido } = await pool.query(
    `select pf.numero_certificacion, s.nombres as socio_nombres
     from plazo_fijo_contratos pf
     join cuentas c on c.id = pf.cuenta_id
     join socios s on s.id = c.socio_id
     where lower(trim(pf.numero_certificacion)) = lower(trim($1))
     limit 1`,
    [numeroCert],
  );
  if (certRepetido[0]) {
    throw conflict(
      `El número de certificado "${numeroCert}" ya fue emitido al socio "${certRepetido[0].socio_nombres}". Verifique el talonario o certificación física; no se permiten certificados duplicados.`,
    );
  }

  const { rows: cuentaRepetida } = await pool.query(
    `select c.numero_cuenta, s.nombres as socio_nombres
     from cuentas c
     join socios s on s.id = c.socio_id
     where lower(trim(c.numero_cuenta)) = lower(trim($1))
     limit 1`,
    [numeroCuenta],
  );
  if (cuentaRepetida[0]) {
    throw conflict(
      `El número de cuenta "${numeroCuenta}" ya está registrado para el socio "${cuentaRepetida[0].socio_nombres}". No se permiten números de cuenta duplicados.`,
    );
  }

  const { rows: aporRows } = await pool.query(
    `select coalesce(sc.saldo_actual, c.saldo_inicial) as saldo_aportacion
     from cuentas c
     left join saldos_cuenta sc on sc.cuenta_id = c.id
     where c.socio_id = $1 and c.tipo = 'APORTACION' and c.estado = 'ACTIVA'
     limit 1`,
    [data.socioId],
  );
  const saldoApor = aporRows[0] ? Number(aporRows[0].saldo_aportacion) : 0;
  if (saldoApor < 100) {
    throw badRequest(
      `Regla de la cooperativa: El socio debe tener una aportación mínima de Q 100.00 para constituir contratos de ahorro a plazo fijo (saldo actual de aportación: Q ${saldoApor.toFixed(2)}).`,
    );
  }

  const client = await pool.connect();
  try {
    await client.query("begin");

    // 1. Crear cuenta bancaria de Ahorro Plazo Fijo
    const { rows: cuentaRows } = await client.query(
      `insert into cuentas (numero_cuenta, tipo, estado, socio_id, agencia_id, saldo_inicial)
       values ($1, 'AHORRO_PLAZO_FIJO', 'ACTIVA', $2, $3, $4)
       returning *`,
      [numeroCuenta, data.socioId, data.agenciaId, calc.montoDeposito],
    );
    const cuenta = cuentaRows[0];

    // 2. Crear contrato de Plazo Fijo
    const { rows: contratoRows } = await client.query(
      `insert into plazo_fijo_contratos (
         cuenta_id, numero_certificacion, plazo_meses, tasa_anual, isr_porcentaje,
         monto_deposito, fecha_inicio, fecha_vencimiento, interes_generado, interes_neto,
         saldo_liquido_a_pagar, estado
       ) values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'ACTIVO')
       returning *`,
      [
        cuenta.id,
        numeroCert,
        calc.plazoMeses,
        calc.tasaAnual,
        calc.isrPorcentaje,
        calc.montoDeposito,
        calc.fechaInicio,
        calc.fechaVencimiento,
        calc.interesGenerado,
        calc.interesNeto,
        calc.saldoLiquidoAPagar,
      ],
    );
    const contrato = contratoRows[0];

    await client.query("commit");

    await registrarAuditoria({
      entidad: "PlazoFijoContrato",
      entidadId: contrato.id,
      accion: "CREAR",
      usuarioId,
      datosNuevos: { contrato, cuenta },
    });

    return { ...contrato, cuenta };
  } catch (err) {
    await client.query("rollback");
    throw err;
  } finally {
    client.release();
  }
}

export interface DatosLiquidarPlazoFijo {
  reciboRetiro?: string;
  incluirIntereses?: boolean;
  montoLiquidado?: number;
}

export async function liquidar(
  id: string,
  data: DatosLiquidarPlazoFijo | undefined,
  usuarioId: string,
  agenciaVisible: string | null,
) {
  const actual = await obtener(id, agenciaVisible);
  if (actual.estado === "LIQUIDADO") throw badRequest("Este contrato ya ha sido liquidado");

  const hoy = new Date().toISOString().slice(0, 10);
  const recibo = data?.reciboRetiro?.trim() || actual.numero_certificacion || `LIQ-${Date.now()}`;

  // Validar anti-duplicados si se especificó reciboRetiro
  if (data?.reciboRetiro && data.reciboRetiro.trim()) {
    const { rows: repetidoAux } = await pool.query(
      `select fecha, doc_no, beneficiario, descripcion
       from caja_movimientos_auxiliar
       where agencia_id = $1 and lower(trim(doc_no)) = lower($2)
       limit 1`,
      [actual.agencia_id, recibo],
    );
    if (repetidoAux[0]) {
      const fechaStr = new Date(repetidoAux[0].fecha).toLocaleDateString("es-GT");
      throw conflict(
        `El número de recibo "${recibo}" ya fue registrado el ${fechaStr} en Auxiliar de Caja (${repetidoAux[0].descripcion} - ${repetidoAux[0].beneficiario}).`,
      );
    }
    const { rows: repetidoPF } = await pool.query(
      `select fecha_retiro, recibo_retiro, numero_certificacion
       from plazo_fijo_contratos
       where lower(trim(recibo_retiro)) = lower($1)
       limit 1`,
      [recibo],
    );
    if (repetidoPF[0]) {
      const fechaStr = repetidoPF[0].fecha_retiro
        ? new Date(repetidoPF[0].fecha_retiro).toLocaleDateString("es-GT")
        : "";
      throw conflict(
        `El número de recibo "${recibo}" ya fue utilizado en la liquidación del certificado No. ${repetidoPF[0].numero_certificacion} el ${fechaStr}.`,
      );
    }
  }

  const montoALiquidar =
    data?.montoLiquidado ??
    (data?.incluirIntereses ? Number(actual.saldo_liquido_a_pagar) : Number(actual.monto_deposito));

  const client = await pool.connect();
  try {
    await client.query("begin");

    // 1. Actualizar contrato a liquidado
    const { rows: pfRows } = await client.query(
      `update plazo_fijo_contratos
       set estado = 'LIQUIDADO',
           fecha_retiro = $1,
           recibo_retiro = $2,
           monto_liquidado = $3,
           updated_at = now()
       where id = $4
       returning *`,
      [hoy, recibo, montoALiquidar, id],
    );

    // 2. Registrar movimiento de liquidación en la cuenta
    const clienteMovId = `LIQ-PF-${id}-${Date.now()}`;
    await client.query(
      `insert into movimientos (cuenta_id, tipo, monto, fecha, descripcion, numero_recibo, usuario_id, cliente_movimiento_id)
       values ($1, 'RETIRO', $2, $3, $4, $5, $6, $7)`,
      [
        actual.cuenta_id,
        montoALiquidar,
        hoy,
        `Liquidación de certificado No. ${actual.numero_certificacion}`,
        recibo,
        usuarioId,
        clienteMovId,
      ],
    );

    await client.query("commit");

    const liquidado = pfRows[0];

    await registrarAuditoria({
      entidad: "PlazoFijoContrato",
      entidadId: id,
      accion: "ACTUALIZAR",
      usuarioId,
      datosAnteriores: { estado: actual.estado },
      datosNuevos: {
        estado: liquidado.estado,
        fecha_retiro: liquidado.fecha_retiro,
        recibo_retiro: recibo,
        monto_liquidado: montoALiquidar,
      },
    });

    return liquidado;
  } catch (err) {
    await client.query("rollback");
    throw err;
  } finally {
    client.release();
  }
}

export function simular(params: ParametrosPlazoFijo) {
  return calcularPlazoFijo(params);
}
