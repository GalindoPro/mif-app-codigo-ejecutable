import { PoolClient } from "pg";
import { pool } from "../../db/pool";
import { withTransaction } from "../../db/transaction";
import { registrarAuditoria } from "../../utils/auditoria";
import { badRequest, notFound, forbidden, conflict } from "../../utils/errors";

// Prefijo del número de cuenta sugerido por tipo — solo una ayuda visual,
// el usuario puede cambiarlo antes de guardar.
const PREFIJO_TIPO: Record<string, string> = {
  AHORRO_CORRIENTE: "AC",
  AHORRO_PROGRAMADO: "AP",
  AHORRO_INFANTO_JUVENIL: "AIJ",
  AHORRO_SOBRE_PRESTAMO: "ASP",
};

export type TipoCuentaAhorro =
  | "AHORRO_CORRIENTE"
  | "AHORRO_PROGRAMADO"
  | "AHORRO_INFANTO_JUVENIL"
  | "AHORRO_SOBRE_PRESTAMO";

export async function listar(params: {
  tipo: TipoCuentaAhorro;
  agenciaId: string | null;
  q?: string;
}) {
  const condiciones = ["c.tipo = $1"];
  const valores: unknown[] = [params.tipo];

  if (params.agenciaId) {
    valores.push(params.agenciaId);
    condiciones.push(`c.agencia_id = $${valores.length}`);
  }
  if (params.q) {
    valores.push(`%${params.q.toLowerCase()}%`);
    const idx = valores.length;
    condiciones.push(`(lower(s.nombres) like $${idx} or lower(c.numero_cuenta) like $${idx})`);
  }

  const { rows } = await pool.query(
    `select c.*, s.nombres as socio_nombres, s.numero_asociado,
            p.codigo as prestamo_codigo, p.estado as prestamo_estado,
            coalesce(sc.saldo_actual, c.saldo_inicial) as saldo_actual
     from cuentas c
     join socios s on s.id = c.socio_id
     left join prestamos p on p.id = c.prestamo_id
     left join saldos_cuenta sc on sc.cuenta_id = c.id
     where ${condiciones.join(" and ")}
     order by c.created_at desc`,
    valores,
  );
  return rows;
}

export async function resumen(params: { tipo: TipoCuentaAhorro; agenciaId: string | null }) {
  const condiciones = ["c.tipo = $1"];
  const valores: unknown[] = [params.tipo];

  if (params.agenciaId) {
    valores.push(params.agenciaId);
    condiciones.push(`c.agencia_id = $${valores.length}`);
  }
  const where = condiciones.join(" and ");

  // saldo_total se calcula en una subconsulta aparte de los depósitos/retiros
  // a propósito: unir cuentas con movimientos en la MISMA consulta multiplica
  // (fan-out) cada fila de cuenta por su número de movimientos, así que sumar
  // el saldo (un valor por cuenta, no por movimiento) ahí lo duplicaba tantas
  // veces como movimientos tuviera esa cuenta.
  const { rows } = await pool.query(
    `select
       (select count(distinct c.id)::int from cuentas c where ${where}) as total_cuentas,
       (select coalesce(sum(coalesce(sc.saldo_actual, c.saldo_inicial)), 0)
        from cuentas c left join saldos_cuenta sc on sc.cuenta_id = c.id
        where ${where}) as saldo_total,
       coalesce(sum(case when m.tipo = 'DEPOSITO' then m.monto else 0 end), 0) as total_depositos,
       coalesce(sum(case when m.tipo = 'RETIRO' then m.monto else 0 end), 0) as total_retiros
     from cuentas c
     left join movimientos m on m.cuenta_id = c.id
     where ${where}`,
    valores,
  );
  const fila = rows[0];
  return {
    totalCuentas: Number(fila.total_cuentas),
    saldoTotal: Number(fila.saldo_total),
    totalDepositos: Number(fila.total_depositos),
    totalRetiros: Number(fila.total_retiros),
  };
}

export async function siguienteNumero(agenciaId: string, tipo: TipoCuentaAhorro) {
  // Máximo número ya usado, no count(*) (ver misma corrección en
  // socios/service.ts y prestamos/service.ts: un hueco en la secuencia hace
  // que count(*) genere un número que ya existe).
  const { rows } = await pool.query(
    `select a.codigo, coalesce(max(nullif(regexp_replace(c.numero_cuenta, '\\D', '', 'g'), '')::int), 0) as max_num
     from agencias a left join cuentas c on c.agencia_id = a.id and c.tipo = $2
     where a.id = $1
     group by a.codigo`,
    [agenciaId, tipo],
  );
  const fila = rows[0];
  if (!fila) throw notFound("Agencia no encontrada");
  const prefijo = PREFIJO_TIPO[tipo] ?? tipo;
  const siguiente = String(fila.max_num + 1).padStart(4, "0");
  return { numeroCuenta: `${fila.codigo}-${prefijo}-${siguiente}` };
}

export async function obtener(id: string, agenciaVisible: string | null) {
  const { rows } = await pool.query(
    `select c.*, s.nombres as socio_nombres, s.numero_asociado, a.nombre as agencia_nombre,
            p.codigo as prestamo_codigo, p.estado as prestamo_estado, p.saldo_capital as prestamo_saldo_capital,
            coalesce(sc.saldo_actual, c.saldo_inicial) as saldo_actual
     from cuentas c
     join socios s on s.id = c.socio_id
     join agencias a on a.id = c.agencia_id
     left join prestamos p on p.id = c.prestamo_id
     left join saldos_cuenta sc on sc.cuenta_id = c.id
     where c.id = $1`,
    [id],
  );
  const cuenta = rows[0];
  if (!cuenta) throw notFound("Cuenta no encontrada");
  if (agenciaVisible && cuenta.agencia_id !== agenciaVisible) throw forbidden("Esa cuenta pertenece a otra agencia");

  const { rows: movimientos } = await pool.query(
    `select m.*, u.nombre as usuario_nombre
     from movimientos m join usuarios u on u.id = m.usuario_id
     where m.cuenta_id = $1
     order by m.fecha desc, m.created_at desc`,
    [id],
  );

  return { ...cuenta, movimientos };
}

export interface DatosCuenta {
  tipo: TipoCuentaAhorro;
  agenciaId: string;
  socioId: string;
  numeroCuenta: string;
  saldoInicial?: number;
  cuotaPactada?: number | null;
  observacionesApertura?: string | null;
  prestamoId?: string | null;
}

export async function crear(data: DatosCuenta, usuarioId: string) {
  return withTransaction(async (client) => {
    const { rows: aporRows } = await client.query(
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
        `Regla de la cooperativa: El asociado debe tener una aportación mínima de Q 100.00 para poder abrir cuentas de ahorro infantil, corriente, programado o sobre préstamo (saldo actual de aportaciones: Q ${saldoApor.toFixed(2)}).`,
      );
    }

    // Verificación de cuenta existente
    if (data.tipo === "AHORRO_SOBRE_PRESTAMO" && data.prestamoId) {
      const { rows: existente } = await client.query(
        `select numero_cuenta from cuentas where socio_id = $1 and tipo = $2 and prestamo_id = $3 and estado = 'ACTIVA'`,
        [data.socioId, data.tipo, data.prestamoId],
      );
      if (existente[0]) {
        throw conflict(
          `El socio ya tiene una cuenta de Ahorro sobre Préstamo activa vinculada a este crédito (${existente[0].numero_cuenta}).`,
        );
      }
    } else {
      const { rows: existente } = await client.query(
        `select numero_cuenta from cuentas where socio_id = $1 and tipo = $2 and estado = 'ACTIVA'`,
        [data.socioId, data.tipo],
      );
      if (existente[0]) {
        throw conflict(
          `El socio ya tiene una cuenta activa de este tipo (${existente[0].numero_cuenta}). Cada socio solo puede tener una cuenta por tipo de ahorro.`,
        );
      }
    }

    const { rows: cuentaRepetida } = await client.query(
      `select c.numero_cuenta, s.nombres as socio_nombres
       from cuentas c
       join socios s on s.id = c.socio_id
       where lower(trim(c.numero_cuenta)) = lower(trim($1))
       limit 1`,
      [data.numeroCuenta],
    );
    if (cuentaRepetida[0]) {
      throw conflict(
        `El número de cuenta "${data.numeroCuenta}" ya existe y pertenece al socio "${cuentaRepetida[0].socio_nombres}". No se permiten números de cuenta duplicados.`,
      );
    }

    const { rows } = await client.query(
      `insert into cuentas (numero_cuenta, tipo, socio_id, agencia_id, saldo_inicial, cuota_pactada, observaciones_apertura, prestamo_id, creado_por_id)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       returning *`,
      [
        data.numeroCuenta,
        data.tipo,
        data.socioId,
        data.agenciaId,
        data.saldoInicial ?? 0,
        data.cuotaPactada ?? null,
        data.observacionesApertura ?? null,
        data.prestamoId ?? null,
        usuarioId,
      ],
    );
    const cuenta = rows[0];
    await registrarAuditoria({ entidad: "Cuenta", entidadId: cuenta.id, accion: "CREAR", usuarioId, datosNuevos: cuenta });
    return cuenta;
  });
}

export async function listarNovedadesCampo(agenciaId: string | null) {
  const where = agenciaId ? "where c.agencia_id = $1" : "";
  const params = agenciaId ? [agenciaId] : [];
  const { rows } = await pool.query(
    `select c.*, s.nombres as socio_nombres, s.numero_asociado, s.telefono as socio_telefono,
            u.nombre as promotor_nombre, u.email as promotor_email,
            coalesce(sc.saldo_actual, c.saldo_inicial) as saldo_actual
     from cuentas c
     join socios s on s.id = c.socio_id
     left join usuarios u on u.id = c.creado_por_id
     left join saldos_cuenta sc on sc.cuenta_id = c.id
     ${where}
     order by c.created_at desc
     limit 25`,
    params,
  );
  return rows;
}

export interface DatosMovimiento {
  tipo: "DEPOSITO" | "RETIRO";
  monto: number;
  fecha?: string;
  numeroRecibo?: string;
  descripcion?: string;
}

export async function registrarMovimientoConClient(
  client: PoolClient,
  cuentaId: string,
  data: DatosMovimiento,
  usuarioId: string,
  agenciaVisible: string | null,
) {
  const { rows: ctaRows } = await client.query(
    `select c.*, s.nombres as socio_nombres, s.numero_asociado, a.nombre as agencia_nombre,
            p.codigo as prestamo_codigo, p.estado as prestamo_estado, p.saldo_capital as prestamo_saldo_capital,
            coalesce(sc.saldo_actual, c.saldo_inicial) as saldo_actual
     from cuentas c
     join socios s on s.id = c.socio_id
     join agencias a on a.id = c.agencia_id
     left join prestamos p on p.id = c.prestamo_id
     left join saldos_cuenta sc on sc.cuenta_id = c.id
     where c.id = $1`,
    [cuentaId],
  );
  const cuenta = ctaRows[0];
  if (!cuenta) throw notFound("Cuenta no encontrada");
  if (agenciaVisible && cuenta.agencia_id !== agenciaVisible) throw forbidden("Esa cuenta pertenece a otra agencia");
  if (cuenta.estado !== "ACTIVA") throw badRequest("Esta cuenta está cerrada; no se pueden registrar movimientos");

  if (data.tipo === "RETIRO") {
    if (cuenta.tipo === "APORTACION") {
      throw badRequest(
        "Las aportaciones de capital social no se pueden retirar directamente. El reembolso se tramita al dar de baja al socio con el jefe de agencia.",
      );
    }
    // REGLA CRÍTICA: Ahorro sobre Préstamo no se toca hasta que termine el pago del crédito
    if (cuenta.tipo === "AHORRO_SOBRE_PRESTAMO") {
      const { rows: prestamosActivos } = await client.query(
        `select codigo, estado, saldo_capital
         from prestamos
         where (id = $1 or (socio_id = $2 and estado in ('SOLICITUD', 'APROBADO', 'DESEMBOLSADO')))
           and estado != 'CANCELADO' and estado != 'RECHAZADO'
         limit 1`,
        [cuenta.prestamo_id, cuenta.socio_id],
      );
      if (prestamosActivos[0]) {
        throw badRequest(
          `Esta cuenta de Ahorro sobre Préstamo está en garantía del crédito activo "${prestamosActivos[0].codigo}" (${prestamosActivos[0].estado}). Por regla estatutaria de la cooperativa, los fondos no pueden retirarse hasta que el préstamo sea cancelado en su totalidad.`,
        );
      }
    }

    if (Number(data.monto) > Number(cuenta.saldo_actual)) {
      throw conflict(
        `El retiro (Q ${Number(data.monto).toFixed(2)}) es mayor que el saldo disponible (Q ${Number(cuenta.saldo_actual).toFixed(2)})`,
      );
    }
  }

  // Validación de número de recibo anti-duplicados
  if (data.numeroRecibo && data.numeroRecibo.trim()) {
    const recibo = data.numeroRecibo.trim();

    // 1. Checar en movimientos de cuentas
    const { rows: repetidoMov } = await client.query(
      `select m.fecha, m.numero_recibo, c.numero_cuenta, s.nombres as socio_nombres
       from movimientos m
       join cuentas c on c.id = m.cuenta_id
       join socios s on s.id = c.socio_id
       where c.agencia_id = $1 and lower(trim(m.numero_recibo)) = lower($2)
       limit 1`,
      [cuenta.agencia_id, recibo],
    );
    if (repetidoMov[0]) {
      const fechaStr = new Date(repetidoMov[0].fecha).toLocaleDateString("es-GT");
      throw conflict(
        `El número de recibo "${recibo}" ya fue registrado el ${fechaStr} en la cuenta ${repetidoMov[0].numero_cuenta} (${repetidoMov[0].socio_nombres}). Verifique el talonario físico; no se permiten recibos duplicados.`,
      );
    }

    // 2. Checar en auxiliar de caja
    const { rows: repetidoAux } = await client.query(
      `select fecha, doc_no, beneficiario, descripcion
       from caja_movimientos_auxiliar
       where agencia_id = $1 and lower(trim(doc_no)) = lower($2)
       limit 1`,
      [cuenta.agencia_id, recibo],
    );
    if (repetidoAux[0]) {
      const fechaStr = new Date(repetidoAux[0].fecha).toLocaleDateString("es-GT");
      throw conflict(
        `El número de recibo "${recibo}" ya fue registrado en Auxiliar de Caja el ${fechaStr} (${repetidoAux[0].descripcion} - ${repetidoAux[0].beneficiario}). No se permiten recibos duplicados.`,
      );
    }
  }

  const clienteMovimientoId = `srv-${cuentaId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  const fechaMov = data.fecha || new Date().toISOString().slice(0, 10);

  const { rows } = await client.query(
    `insert into movimientos (cuenta_id, tipo, monto, fecha, numero_recibo, descripcion, usuario_id, cliente_movimiento_id)
     values ($1,$2,$3,$4,$5,$6,$7,$8)
     returning *`,
    [cuentaId, data.tipo, data.monto, fechaMov, data.numeroRecibo ?? null, data.descripcion ?? null, usuarioId, clienteMovimientoId],
  );
  const movimiento = rows[0];
  await registrarAuditoria({
    entidad: "Movimiento",
    entidadId: movimiento.id,
    accion: "CREAR",
    usuarioId,
    datosNuevos: movimiento,
  });
  return { ...movimiento, cuenta_socio_id: cuenta.socio_id, cuenta_socio_nombres: cuenta.socio_nombres, cuenta_numero: cuenta.numero_cuenta };
}

export async function registrarMovimiento(
  cuentaId: string,
  data: DatosMovimiento,
  usuarioId: string,
  agenciaVisible: string | null,
) {
  return withTransaction(async (client) => {
    return registrarMovimientoConClient(client, cuentaId, data, usuarioId, agenciaVisible);
  });
}

export async function cerrar(cuentaId: string, usuarioId: string, agenciaVisibleParam: string | null) {
  return withTransaction(async (client) => {
    const { rows: ctaRows } = await client.query(
      `select c.*, coalesce(sc.saldo_actual, c.saldo_inicial) as saldo_actual
       from cuentas c
       left join saldos_cuenta sc on sc.cuenta_id = c.id
       where c.id = $1`,
      [cuentaId],
    );
    const cuenta = ctaRows[0];
    if (!cuenta) throw notFound("Cuenta no encontrada");
    if (agenciaVisibleParam && cuenta.agencia_id !== agenciaVisibleParam) {
      throw forbidden("Esa cuenta pertenece a otra agencia");
    }
    if (cuenta.estado === "CERRADA") throw conflict("Esta cuenta ya está cerrada.");
    if (cuenta.tipo === "APORTACION") {
      throw badRequest("Las cuentas de aportación no se cierran individualmente. El cierre se gestiona al dar de baja al socio.");
    }
    const saldo = Number(cuenta.saldo_actual);
    if (saldo > 0.009) {
      throw conflict(`No se puede cerrar la cuenta con saldo pendiente de Q ${saldo.toFixed(2)}. Primero registra un retiro por el total del saldo.`);
    }
    if (cuenta.tipo === "AHORRO_SOBRE_PRESTAMO") {
      const { rows: prestamosActivos } = await client.query(
        `select codigo from prestamos where id = $1 and estado not in ('CANCELADO', 'RECHAZADO') limit 1`,
        [cuenta.prestamo_id],
      );
      if (prestamosActivos[0]) {
        throw conflict(`La cuenta está en garantía del crédito activo "${prestamosActivos[0].codigo}". Cancela el préstamo antes de cerrar esta cuenta.`);
      }
    }
    const { rows } = await client.query(
      `update cuentas set estado = 'CERRADA', updated_at = now() where id = $1 returning *`,
      [cuentaId],
    );
    await registrarAuditoria({ entidad: "Cuenta", entidadId: cuentaId, accion: "ACTUALIZAR", usuarioId, datosAnteriores: { estado: "ACTIVA" }, datosNuevos: { estado: "CERRADA" } });
    return rows[0];
  });
}
