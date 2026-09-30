import { pool } from "../../db/pool";
import { Socio } from "../../types/models";
import { registrarAuditoria } from "../../utils/auditoria";
import { badRequest, notFound, forbidden, conflict } from "../../utils/errors";
import { validarDpiGuatemala, formatearDPI, type ResultadoValidacionDPI } from "../../utils/dpiGuatemala";

export interface FiltrosSocios {
  agenciaId: string | null; // null = todas (ADMIN/GERENCIA)
  q?: string;
  estado?: "ACTIVO" | "INACTIVO";
  vinculacion?: "TODOS" | "SOCIOS" | "CREDITOS" | "HISTORICOS";
  page: number;
  pageSize: number;
}

const CONECTORES_NOMBRE = new Set(["de", "del", "la", "las", "los", "y", "e"]);

export function capitalizarNombre(valor?: string | null): string | null | undefined {
  if (!valor) return valor;
  let texto = valor.trim();
  if (/^[\p{Lu}\s\p{P}]+$/u.test(texto) && texto.length > 2) {
    texto = texto.toLowerCase();
  }
  const palabras = texto.split(/(\s+)/);
  return palabras
    .map((p, idx) => {
      if (/^\s+$/.test(p)) return p;
      const norm = p.toLowerCase();
      if (idx > 0 && CONECTORES_NOMBRE.has(norm)) {
        return norm;
      }
      return p.replace(/(^|[^\p{L}\p{N}])(\p{L})/gu, (_, sep, letra) => sep + letra.toUpperCase());
    })
    .join("");
}

export function capitalizarDescripcion(valor?: string | null): string | null | undefined {
  if (!valor) return valor;
  const texto = valor.trim();
  const primerIndice = texto.search(/\S/);
  if (primerIndice === -1) return texto;
  return (
    texto.slice(0, primerIndice) +
    texto.charAt(primerIndice).toUpperCase() +
    texto.slice(primerIndice + 1)
  );
}

export async function listar(filtros: FiltrosSocios) {
  const condiciones: string[] = [];
  const valores: unknown[] = [];

  if (filtros.agenciaId) {
    valores.push(filtros.agenciaId);
    condiciones.push(`s.agencia_id = $${valores.length}`);
  }
  if (filtros.estado) {
    valores.push(filtros.estado);
    condiciones.push(`s.estado = $${valores.length}`);
  }
  if (filtros.q) {
    const qClean = filtros.q.replace(/\D/g, "");
    valores.push(`%${filtros.q.toLowerCase()}%`);
    const idx = valores.length;
    if (qClean.length >= 3) {
      valores.push(`%${qClean}%`);
      const idxClean = valores.length;
      condiciones.push(
        `(lower(s.nombres) like $${idx} or s.dpi like $${idx} or lower(s.numero_asociado) like $${idx} or regexp_replace(coalesce(s.dpi, ''), '[^0-9]', '', 'g') like $${idxClean} or regexp_replace(coalesce(s.telefono, ''), '[^0-9]', '', 'g') like $${idxClean})`,
      );
    } else {
      condiciones.push(
        `(lower(s.nombres) like $${idx} or s.dpi like $${idx} or lower(s.numero_asociado) like $${idx})`,
      );
    }
  }

  // Filtro de vinculación y año 2026
  if (filtros.vinculacion === "HISTORICOS") {
    // Históricos: Todos los de 2025 o antes, o inactivos explícitos
    condiciones.push(`(s.fecha_ingreso < '2026-01-01' or s.estado = 'INACTIVO')`);
  } else {
    // Para TODOS, SOCIOS y CREDITOS, solo aplica a los activos desde 2026 en adelante
    condiciones.push(`s.fecha_ingreso >= '2026-01-01' and s.estado = 'ACTIVO'`);
    
    if (filtros.vinculacion === "SOCIOS") {
      condiciones.push(`exists (select 1 from cuentas where socio_id = s.id and estado = 'ACTIVA')`);
    } else if (filtros.vinculacion === "CREDITOS") {
      condiciones.push(`not exists (select 1 from cuentas where socio_id = s.id and estado = 'ACTIVA') and exists (select 1 from prestamos where socio_id = s.id and estado = 'DESEMBOLSADO' and saldo_capital > 0)`);
    }
  }

  const where = condiciones.length ? `where ${condiciones.join(" and ")}` : "";
  const offset = (filtros.page - 1) * filtros.pageSize;

  valores.push(filtros.pageSize, offset);
  const limitIdx = valores.length - 1;
  const offsetIdx = valores.length;

  const [{ rows }, { rows: countRows }] = await Promise.all([
    pool.query(
      `select s.*, a.nombre as agencia_nombre, a.codigo as agencia_codigo,
              coalesce(c_agg.total_cuentas, 0)::int as total_cuentas,
              coalesce(c_agg.tiene_aportacion, false) as tiene_aportacion,
              coalesce(c_agg.tiene_ahorro_corriente, false) as tiene_ahorro_corriente,
              coalesce(c_agg.tiene_plazo_fijo, false) as tiene_plazo_fijo,
              coalesce(p_cnt.total_creditos_activos, 0)::int as creditos_activos
       from socios s
       join agencias a on a.id = s.agencia_id
       left join (
         select socio_id,
                count(*) as total_cuentas,
                bool_or(tipo = 'APORTACION' and estado = 'ACTIVA') as tiene_aportacion,
                bool_or(tipo = 'AHORRO_CORRIENTE' and estado = 'ACTIVA') as tiene_ahorro_corriente,
                bool_or(tipo = 'AHORRO_PLAZO_FIJO' and estado = 'ACTIVA') as tiene_plazo_fijo
         from cuentas
         group by socio_id
       ) c_agg on c_agg.socio_id = s.id
       left join (
         select socio_id, count(*) as total_creditos_activos
         from prestamos
         where estado = 'DESEMBOLSADO' and saldo_capital > 0
         group by socio_id
       ) p_cnt on p_cnt.socio_id = s.id
       ${where}
       order by s.numero_asociado desc, s.created_at desc
       limit $${limitIdx} offset $${offsetIdx}`,
      valores,
    ),
    pool.query(`select count(*)::int as total from socios s ${where}`, valores.slice(0, -2)),
  ]);

  return { data: rows, total: countRows[0].total, page: filtros.page, pageSize: filtros.pageSize };
}

export async function obtener(id: string, agenciaVisible: string | null) {
  const { rows } = await pool.query(
    `select s.*, a.nombre as agencia_nombre, a.codigo as agencia_codigo
     from socios s join agencias a on a.id = s.agencia_id
     where s.id = $1`,
    [id],
  );
  const socio = rows[0];
  if (!socio) throw notFound("Socio no encontrado");
  if (agenciaVisible && socio.agencia_id !== agenciaVisible) throw forbidden("Ese socio pertenece a otra agencia");

  const { rows: cuentas } = await pool.query(
    `select c.*, coalesce(sc.saldo_actual, c.saldo_inicial) as saldo_actual
     from cuentas c
     left join saldos_cuenta sc on sc.cuenta_id = c.id
     where c.socio_id = $1
     order by c.created_at`,
    [id],
  );

  return { ...socio, cuentas };
}

export async function siguienteNumero(agenciaId: string) {
  const { rows } = await pool.query(
    `select a.codigo, count(s.id)::int as total
     from agencias a left join socios s on s.agencia_id = a.id
     where a.id = $1
     group by a.codigo`,
    [agenciaId],
  );
  const fila = rows[0];
  if (!fila) throw notFound("Agencia no encontrada");
  const siguiente = String(fila.total + 1).padStart(4, "0");
  return { numeroAsociado: `${fila.codigo}-${siguiente}` };
}

export interface DatosSocio {
  numeroAsociado: string;
  agenciaId: string;
  nombres: string;
  genero?: "M" | "F" | null;
  fechaIngreso: string;
  dpi?: string | null;
  direccion?: string | null;
  telefono?: string | null;
  nombreBeneficiario?: string | null;
  dpiBeneficiario?: string | null;
  telefonoBeneficiario?: string | null;
  parentescoBeneficiario?: string | null;
  montoAportacionInicial?: number;
  reciboAportacionInicial?: string | null;
}

export async function crear(data: DatosSocio, usuarioId: string): Promise<Socio> {
  const { rows: asocRepetido } = await pool.query(
    `select numero_asociado, nombres from socios where lower(trim(numero_asociado)) = lower(trim($1)) limit 1`,
    [data.numeroAsociado],
  );
  if (asocRepetido[0]) {
    throw conflict(
      `El número de asociado "${data.numeroAsociado}" ya está asignado al socio "${asocRepetido[0].nombres}". No se permiten números de asociado duplicados.`,
    );
  }

  const montoApor = data.montoAportacionInicial !== undefined ? Number(data.montoAportacionInicial) : 100;
  if (isNaN(montoApor) || montoApor < 100) {
    throw badRequest("La aportación inicial mínima de la cooperativa es de Q 100.00 para afiliarse como socio.");
  }

  // Validaciones Cruzadas (Socio y Beneficiario)
  const dpiSocio = data.dpi?.trim();
  const dpiBen = data.dpiBeneficiario?.trim();
  const telSocio = data.telefono?.trim();
  const telBen = data.telefonoBeneficiario?.trim();

  // Auto-restricción: Un socio no puede ser su propio beneficiario (ni usar mismo DPI ni teléfono)
  if (dpiSocio && dpiBen && dpiSocio === dpiBen) {
    throw badRequest("El DPI del socio y el DPI/CUI del beneficiario no pueden ser iguales.");
  }
  if (telSocio && telBen && telSocio === telBen) {
    throw badRequest("El teléfono del socio y el teléfono del beneficiario no pueden ser iguales.");
  }

  // DPI Socio
  if (dpiSocio) {
    const res = await verificarDpi(dpiSocio, undefined, "SOCIO");
    if (!res.valido) throw badRequest(res.mensaje!);
    if (!res.disponible) throw conflict(`El DPI "${dpiSocio}" ya está registrado en el sistema (${res.registrado?.rol}: ${res.registrado?.nombres}).`);
  }

  // Teléfono Socio
  if (telSocio) {
    const res = await verificarTelefono(telSocio, undefined, "SOCIO");
    if (!res.valido) throw badRequest(res.mensaje!);
    if (!res.disponible) throw conflict(`El teléfono "${telSocio}" ya está registrado en el sistema (${res.registrado?.rol}: ${res.registrado?.nombres}).`);
  }

  // DPI Beneficiario
  if (dpiBen) {
    const res = await verificarDpi(dpiBen, undefined, "BENEFICIARIO");
    if (!res.valido) throw badRequest(res.mensaje!);
    if (!res.disponible) throw conflict(`El DPI/CUI del beneficiario "${dpiBen}" ya pertenece a un socio registrado (${res.registrado?.nombres}).`);
  }

  // Teléfono Beneficiario
  if (telBen) {
    const res = await verificarTelefono(telBen, undefined, "BENEFICIARIO");
    if (!res.valido) throw badRequest(res.mensaje!);
    if (!res.disponible) throw conflict(`El teléfono del beneficiario "${telBen}" ya pertenece a un socio registrado (${res.registrado?.nombres}).`);
  }

  // Validación obligatoria de número de boleta / recibo de pago
  if (!data.reciboAportacionInicial || !data.reciboAportacionInicial.trim()) {
    throw badRequest("El número de boleta o recibo de pago es obligatorio para respaldar la aportación estatutaria inicial.");
  }

  const { rows } = await pool.query<Socio>(
    `insert into socios
      (numero_asociado, agencia_id, nombres, genero, fecha_ingreso, dpi, direccion, telefono, nombre_beneficiario, dpi_beneficiario, telefono_beneficiario, parentesco_beneficiario, creado_por_id)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
     returning *`,
    [
      data.numeroAsociado,
      data.agenciaId,
      capitalizarNombre(data.nombres)!,
      data.genero ?? null,
      data.fechaIngreso,
      data.dpi ?? null,
      capitalizarDescripcion(data.direccion) ?? null,
      data.telefono ?? null,
      capitalizarNombre(data.nombreBeneficiario) ?? null,
      data.dpiBeneficiario ?? null,
      data.telefonoBeneficiario ?? null,
      data.parentescoBeneficiario ?? null,
      usuarioId,
    ],
  );
  const socio = rows[0];

  // Crear automáticamente la cuenta de APORTACION del socio con la aportación estatutaria inicial (mínimo Q 100.00)
  const { rows: agencias } = await pool.query(`select codigo from agencias where id = $1`, [data.agenciaId]);
  const codAgencia = agencias[0]?.codigo ?? "MIF";
  const numCuentaAportacion = `${codAgencia}-APOR-${data.numeroAsociado}`;
  const obsApertura = data.reciboAportacionInicial
    ? `Aportación estatutaria inicial. Comprobante/Recibo: ${data.reciboAportacionInicial.trim()}`
    : "Aportación estatutaria inicial al afiliarse";

  await pool.query(
    `insert into cuentas (numero_cuenta, tipo, estado, socio_id, agencia_id, saldo_inicial, observaciones_apertura, creado_por_id)
     values ($1, 'APORTACION', 'ACTIVA', $2, $3, $4, $5, $6)
     on conflict (numero_cuenta) do update set saldo_inicial = $4, observaciones_apertura = $5`,
    [numCuentaAportacion, socio.id, data.agenciaId, montoApor, obsApertura, usuarioId],
  );

  await registrarAuditoria({ entidad: "Socio", entidadId: socio.id, accion: "CREAR", usuarioId, datosNuevos: socio });
  return socio;
}

export interface ResultadoVerificarDpi extends Partial<ResultadoValidacionDPI> {
  valido: boolean;
  disponible: boolean;
  mensaje?: string;
  registrado?: {
    id: string;
    nombres: string;
    numeroAsociado: string;
    rol: string;
  };
}

export async function verificarDpi(
  dpi: string,
  socioIdActual?: string,
  tipo: "SOCIO" | "BENEFICIARIO" = "SOCIO",
  agenciaCodigo?: string,
): Promise<ResultadoVerificarDpi> {
  // Validación de estructura y municipio oficial de Guatemala
  const valGuatemala = validarDpiGuatemala(dpi, agenciaCodigo);
  if (!valGuatemala.valido) {
    return {
      ...valGuatemala,
      valido: false,
      disponible: false,
      mensaje: valGuatemala.mensaje,
    };
  }

  const rawDpi = valGuatemala.dpiFormateado ? valGuatemala.dpiFormateado.replace(/\D/g, "") : dpi.replace(/\D/g, "");
  const params: unknown[] = [rawDpi];
  
  // 1. Verificar si coincide con DPI de algún SOCIO
  let querySocio = `select id, nombres, numero_asociado, dpi from socios where regexp_replace(dpi, '[^0-9]', '', 'g') = $1`;
  if (socioIdActual) {
    querySocio += ` and id != $2`;
    params.push(socioIdActual);
  }
  querySocio += ` limit 1`;

  const { rows: socioRows } = await pool.query(querySocio, params);
  if (socioRows[0]) {
    return {
      ...valGuatemala,
      valido: true,
      disponible: false,
      registrado: {
        id: socioRows[0].id,
        nombres: socioRows[0].nombres,
        numeroAsociado: socioRows[0].numero_asociado,
        rol: "Socio registrado",
      },
    };
  }

  // 2. Si se verifica SOCIO, también verificar que su DPI no esté ya como DPI de algún Beneficiario
  if (tipo === "SOCIO") {
    let queryBen = `select id, nombres, numero_asociado, nombre_beneficiario, dpi_beneficiario from socios where regexp_replace(dpi_beneficiario, '[^0-9]', '', 'g') = $1`;
    if (socioIdActual) {
      queryBen += ` and id != $2`;
    }
    queryBen += ` limit 1`;

    const { rows: benRows } = await pool.query(queryBen, params);
    if (benRows[0]) {
      return {
        ...valGuatemala,
        valido: true,
        disponible: false,
        registrado: {
          id: benRows[0].id,
          nombres: benRows[0].nombre_beneficiario,
          numeroAsociado: benRows[0].numero_asociado,
          rol: `Beneficiario del socio ${benRows[0].nombres}`,
        },
      };
    }
  }

  return {
    ...valGuatemala,
    valido: true,
    disponible: true,
  };
}

export async function verificarTelefono(
  telefono: string,
  socioIdActual?: string,
  tipo: "SOCIO" | "BENEFICIARIO" = "SOCIO",
) {
  const rawTel = telefono.replace(/\D/g, "");
  const localTel = rawTel.startsWith("502") && rawTel.length > 8 ? rawTel.slice(3) : rawTel.slice(-8);

  if (localTel.length !== 8) {
    return { valido: false, mensaje: "El teléfono debe contener 8 dígitos numéricos" };
  }

  // 1. Verificar si coincide con el teléfono de algún socio
  let querySocio = `select id, nombres, numero_asociado, telefono from socios where regexp_replace(telefono, '[^0-9]', '', 'g') like $1`;
  const paramsSocio: unknown[] = [`%${localTel}`];
  if (socioIdActual) {
    paramsSocio.push(socioIdActual);
    querySocio += ` and id != $2`;
  }
  querySocio += ` limit 1`;

  const { rows: socioRows } = await pool.query(querySocio, paramsSocio);
  if (socioRows[0]) {
    return {
      valido: true,
      disponible: false,
      registrado: {
        id: socioRows[0].id,
        nombres: socioRows[0].nombres,
        numeroAsociado: socioRows[0].numero_asociado,
        rol: "Socio registrado",
      },
    };
  }

  // 2. Si se verifica SOCIO, también verificar en beneficiarios registrados
  if (tipo === "SOCIO") {
    let queryBen = `select id, nombres, numero_asociado, nombre_beneficiario, telefono_beneficiario from socios where regexp_replace(telefono_beneficiario, '[^0-9]', '', 'g') like $1`;
    const paramsBen: unknown[] = [`%${localTel}`];
    if (socioIdActual) {
      paramsBen.push(socioIdActual);
      queryBen += ` and id != $2`;
    }
    queryBen += ` limit 1`;

    const { rows: benRows } = await pool.query(queryBen, paramsBen);
    if (benRows[0]) {
      return {
        valido: true,
        disponible: false,
        registrado: {
          id: benRows[0].id,
          nombres: benRows[0].nombre_beneficiario,
          numeroAsociado: benRows[0].numero_asociado,
          rol: `Beneficiario del socio ${benRows[0].nombres}`,
        },
      };
    }
  }

  return { valido: true, disponible: true };
}

/**
 * Retorna socios sin cuenta de APORTACION o con saldo_actual < 100
 * para que el cajero los aperture directamente desde la ventanilla.
 */
export async function sociosSinAportacion(
  agenciaIdParam: string | null,
  agenciaVisible: string | null
) {
  const agenciaId = agenciaIdParam || agenciaVisible;
  const { rows } = await pool.query(
    `select
       s.id, s.nombres, s.numero_asociado,
       c.saldo_actual as saldo_aportacion
     from socios s
     left join cuentas c on c.socio_id = s.id and c.tipo = 'APORTACION' and c.estado = 'ACTIVA'
     where s.estado = 'ACTIVO'
       and ($1::uuid is null or s.agencia_id = $1::uuid)
       and (c.id is null or c.saldo_actual < 100)
     order by s.nombres asc`,
    [agenciaId || null]
  );
  return rows;
}

export async function abrirAportacionSocio(
  socioId: string,
  monto: number = 100,
  recibo?: string | null,
  usuarioId: string = "",
  cuotaIngreso?: number
) {
  const { rows: socioRows } = await pool.query(
    `select s.*, a.codigo as agencia_codigo from socios s join agencias a on a.id = s.agencia_id where s.id = $1`,
    [socioId]
  );
  if (!socioRows[0]) throw notFound("Socio no encontrado");
  const socio = socioRows[0];

  const montoApor = Number(monto) >= 100 ? Number(monto) : 100;
  const codAgencia = socio.agencia_codigo ?? "MIF";
  const numCuentaAportacion = `${codAgencia}-APOR-${socio.numero_asociado}`;
  const obsApertura = recibo?.trim()
    ? `Aportación estatutaria inicial. Comprobante/Recibo: ${recibo.trim()}`
    : "Aportación estatutaria inicial";

  const { rows: cuentaRows } = await pool.query(
    `insert into cuentas (numero_cuenta, tipo, estado, socio_id, agencia_id, saldo_inicial, observaciones_apertura, creado_por_id)
     values ($1, 'APORTACION', 'ACTIVA', $2, $3, $4, $5, $6)
     on conflict (numero_cuenta) do update set saldo_inicial = $4, estado = 'ACTIVA', observaciones_apertura = $5
     returning *`,
    [numCuentaAportacion, socio.id, socio.agencia_id, montoApor, obsApertura, usuarioId || null]
  );

  await registrarAuditoria({
    entidad: "Cuenta",
    entidadId: cuentaRows[0].id,
    accion: "CREAR",
    usuarioId,
    datosNuevos: { tipo: "APORTACION", saldo_inicial: montoApor, socio_id: socio.id },
  });

  // Si se registró cuota de ingreso y hay caja auxiliar abierta hoy, registrar el ingreso
  if (cuotaIngreso && cuotaIngreso > 0) {
    const { rows: diaRows } = await pool.query(
      `select id, fecha, saldo_inicial, agencia_id from caja_dias
       where agencia_id = $1 and estado = 'ABIERTO' and fecha = current_date
       order by created_at desc limit 1`,
      [socio.agencia_id]
    );
    if (diaRows[0]) {
      const dia = diaRows[0];
      // Obtener saldo acumulado actual
      const { rows: saldoRows } = await pool.query(
        `select saldo_acumulado from caja_movimientos_auxiliar where caja_dia_id = $1 order by created_at desc limit 1`,
        [dia.id]
      );
      const saldoPrevio = saldoRows[0] ? Number(saldoRows[0].saldo_acumulado) : Number(dia.saldo_inicial);
      const saldoAcumulado = saldoPrevio + cuotaIngreso;

      // Contador para INGRESO_ASOCIADO
      const { rows: contRows } = await pool.query(
        `select count(*)::int as total from caja_movimientos_auxiliar where agencia_id = $1 and categoria = 'INGRESO_ASOCIADO'`,
        [socio.agencia_id]
      );
      const contador = contRows[0].total + 1;

      await pool.query(
        `insert into caja_movimientos_auxiliar (
           caja_dia_id, agencia_id, fecha, seccion, categoria, tipo, contador,
           referencia, socio_id, beneficiario, descripcion, doc_no, monto, saldo_acumulado,
           origen_fondos, usuario_id
         ) values ($1, $2, $3, 'PROPIO', 'INGRESO_ASOCIADO', 'INGRESO', $4, $5, $6, $7, $8, $9, $10, $11, 'FONDOS_PROPIOS', $12)`,
        [
          dia.id, socio.agencia_id, dia.fecha, contador,
          socio.numero_asociado, socio.id, socio.nombres,
          `Cuota de ingreso nuevo asociado ${socio.nombres} (${socio.numero_asociado})`,
          recibo ?? null, cuotaIngreso, saldoAcumulado, usuarioId || null
        ]
      );
    }
  }

  return { ...cuentaRows[0], cuotaIngresoRegistrada: cuotaIngreso && cuotaIngreso > 0 };
}

export async function actualizar(
  id: string,
  data: Partial<DatosSocio> & { estado?: "ACTIVO" | "INACTIVO" },
  usuarioId: string,
  agenciaVisibleParaUsuario: string | null,
): Promise<Socio> {
  const anterior = await obtener(id, agenciaVisibleParaUsuario);

  // Validaciones Cruzadas (Socio y Beneficiario)
  const dpiSocio = data.dpi?.trim();
  const dpiBen = data.dpiBeneficiario?.trim();
  const telSocio = data.telefono?.trim();
  const telBen = data.telefonoBeneficiario?.trim();

  // Auto-restricción: Un socio no puede ser su propio beneficiario (ni usar mismo DPI ni teléfono)
  const finalDpiSocio = dpiSocio ?? anterior.dpi;
  const finalDpiBen = dpiBen ?? anterior.dpi_beneficiario;
  if (finalDpiSocio && finalDpiBen && finalDpiSocio === finalDpiBen) {
    throw badRequest("El DPI del socio y el DPI/CUI del beneficiario no pueden ser iguales.");
  }

  const finalTelSocio = telSocio ?? anterior.telefono;
  const finalTelBen = telBen ?? anterior.telefono_beneficiario;
  if (finalTelSocio && finalTelBen && finalTelSocio === finalTelBen) {
    throw badRequest("El teléfono del socio y el teléfono del beneficiario no pueden ser iguales.");
  }

  // DPI Socio
  if (dpiSocio) {
    const res = await verificarDpi(dpiSocio, id, "SOCIO");
    if (!res.valido) throw badRequest(res.mensaje!);
    if (!res.disponible) throw conflict(`El DPI "${dpiSocio}" ya está registrado en el sistema (${res.registrado?.rol}: ${res.registrado?.nombres}).`);
  }

  // Teléfono Socio
  if (telSocio) {
    const res = await verificarTelefono(telSocio, id, "SOCIO");
    if (!res.valido) throw badRequest(res.mensaje!);
    if (!res.disponible) throw conflict(`El teléfono "${telSocio}" ya está registrado en el sistema (${res.registrado?.rol}: ${res.registrado?.nombres}).`);
  }

  // DPI Beneficiario
  if (dpiBen) {
    const res = await verificarDpi(dpiBen, id, "BENEFICIARIO");
    if (!res.valido) throw badRequest(res.mensaje!);
    if (!res.disponible) throw conflict(`El DPI/CUI del beneficiario "${dpiBen}" ya pertenece a un socio registrado (${res.registrado?.nombres}).`);
  }

  // Teléfono Beneficiario
  if (telBen) {
    const res = await verificarTelefono(telBen, id, "BENEFICIARIO");
    if (!res.valido) throw badRequest(res.mensaje!);
    if (!res.disponible) throw conflict(`El teléfono del beneficiario "${telBen}" ya pertenece a un socio registrado (${res.registrado?.nombres}).`);
  }

  const campos: Record<string, unknown> = {
    nombres: data.nombres !== undefined ? (data.nombres ? capitalizarNombre(data.nombres) : data.nombres) : undefined,
    genero: data.genero,
    fecha_ingreso: data.fechaIngreso,
    dpi: data.dpi,
    direccion: data.direccion !== undefined ? (data.direccion ? capitalizarDescripcion(data.direccion) : data.direccion) : undefined,
    telefono: data.telefono,
    nombre_beneficiario: data.nombreBeneficiario !== undefined ? (data.nombreBeneficiario ? capitalizarNombre(data.nombreBeneficiario) : data.nombreBeneficiario) : undefined,
    dpi_beneficiario: data.dpiBeneficiario,
    telefono_beneficiario: data.telefonoBeneficiario,
    parentesco_beneficiario: data.parentescoBeneficiario,
    estado: data.estado,
  };

  const sets: string[] = [];
  const valores: unknown[] = [];
  for (const [col, val] of Object.entries(campos)) {
    if (val === undefined) continue;
    valores.push(val);
    sets.push(`${col} = $${valores.length}`);
  }
  if (sets.length === 0) return anterior as unknown as Socio;

  sets.push(`updated_at = now()`);
  valores.push(id);

  const { rows } = await pool.query<Socio>(
    `update socios set ${sets.join(", ")} where id = $${valores.length} returning *`,
    valores,
  );
  const actualizado = rows[0];
  await registrarAuditoria({
    entidad: "Socio",
    entidadId: id,
    accion: "ACTUALIZAR",
    usuarioId,
    datosAnteriores: anterior,
    datosNuevos: actualizado,
  });
  return actualizado;
}

export async function cambiarEstado(
  id: string,
  nuevoEstado: "ACTIVO" | "INACTIVO",
  usuarioId: string,
  agenciaVisibleParaUsuario: string | null,
): Promise<Socio> {
  return actualizar(id, { estado: nuevoEstado }, usuarioId, agenciaVisibleParaUsuario);
}

export async function listarAportaciones(params: { agenciaId: string | null; q?: string }) {
  const condiciones: string[] = [];
  const valores: unknown[] = [];

  if (params.agenciaId) {
    valores.push(params.agenciaId);
    condiciones.push(`s.agencia_id = $${valores.length}`);
  }
  if (params.q) {
    const qClean = params.q.replace(/\D/g, "");
    valores.push(`%${params.q.toLowerCase()}%`);
    const idx = valores.length;
    if (qClean.length >= 3) {
      valores.push(`%${qClean}%`);
      const idxClean = valores.length;
      condiciones.push(
        `(lower(s.nombres) like $${idx} or lower(s.numero_asociado) like $${idx} or s.dpi like $${idx} or regexp_replace(coalesce(s.dpi, ''), '[^0-9]', '', 'g') like $${idxClean} or regexp_replace(coalesce(s.telefono, ''), '[^0-9]', '', 'g') like $${idxClean})`,
      );
    } else {
      condiciones.push(`(lower(s.nombres) like $${idx} or lower(s.numero_asociado) like $${idx} or s.dpi like $${idx})`);
    }
  }

  const where = condiciones.length ? `where ${condiciones.join(" and ")}` : "";

  const query = `
    select s.id as socio_id, s.numero_asociado, s.nombres, s.dpi, s.genero, s.fecha_ingreso, s.direccion, s.telefono,
           s.nombre_beneficiario, s.dpi_beneficiario, s.telefono_beneficiario, s.parentesco_beneficiario, s.estado,
           a.nombre as agencia_nombre,
           coalesce(sum(coalesce(sc.saldo_actual, c.saldo_inicial)), 0) as total_aportaciones
    from socios s
    join agencias a on a.id = s.agencia_id
    left join cuentas c on c.socio_id = s.id and c.tipo = 'APORTACION'
    left join saldos_cuenta sc on sc.cuenta_id = c.id
    ${where}
    group by s.id, a.nombre
    order by s.numero_asociado asc
  `;

  const { rows } = await pool.query(query, valores);
  return rows;
}

// ─── PANEL DE AUDITORÍA DE IMPORTACIÓN ──────────────────────────────────────
// Socios sin DPI, posibles duplicados por nombre y estadísticas de integridad.

export async function auditarImportacion(agenciaId: string | null) {
  const agCondicion = agenciaId ? `AND s.agencia_id = '${agenciaId}'` : "";

  // 1. Socios sin DPI
  const { rows: sinDpi } = await pool.query(`
    SELECT
      s.id, s.numero_asociado, s.nombres, s.estado,
      s.dpi, s.advertencia_importacion, s.created_at,
      COALESCE(a.nombre, 'Sin agencia') AS agencia,
      COUNT(c.id) AS total_cuentas,
      COUNT(m.id) AS total_movimientos
    FROM socios s
    LEFT JOIN agencias a ON a.id = s.agencia_id
    LEFT JOIN cuentas c ON c.socio_id = s.id
    LEFT JOIN movimientos m ON m.cuenta_id = c.id
    WHERE (s.dpi IS NULL OR TRIM(s.dpi) = '' OR LENGTH(TRIM(s.dpi)) < 5)
      ${agCondicion}
    GROUP BY s.id, a.nombre
    ORDER BY s.numero_asociado DESC
  `);

  // 2. Posibles duplicados por nombre (mismo nombre exacto, diferente código)
  const { rows: duplicados } = await pool.query(`
    SELECT
      s1.id AS id1, s1.numero_asociado AS codigo1, s1.nombres AS nombre1,
      s1.dpi AS dpi1,
      s2.id AS id2, s2.numero_asociado AS codigo2, s2.nombres AS nombre2,
      s2.dpi AS dpi2
    FROM socios s1
    JOIN socios s2 ON LOWER(TRIM(s1.nombres)) = LOWER(TRIM(s2.nombres))
      AND s1.id <> s2.id
      AND s1.numero_asociado < s2.numero_asociado
    ${agenciaId ? `WHERE s1.agencia_id = '${agenciaId}' AND s2.agencia_id = '${agenciaId}'` : ""}
    ORDER BY s1.nombres ASC
    LIMIT 50
  `);

  // 3. Estadísticas generales de integridad
  const { rows: stats } = await pool.query(`
    SELECT
      COUNT(*) AS total_socios,
      COUNT(*) FILTER (WHERE dpi IS NOT NULL AND TRIM(dpi) <> '' AND LENGTH(TRIM(dpi)) >= 5) AS con_dpi,
      COUNT(*) FILTER (WHERE dpi IS NULL OR TRIM(dpi) = '' OR LENGTH(TRIM(dpi)) < 5) AS sin_dpi,
      COUNT(*) FILTER (WHERE advertencia_importacion IS NOT NULL) AS con_advertencia
    FROM socios s
    ${agenciaId ? `WHERE s.agencia_id = '${agenciaId}'` : ""}
  `);

  return {
    sinDpi: sinDpi.map((r) => ({
      ...r,
      total_cuentas: Number(r.total_cuentas),
      total_movimientos: Number(r.total_movimientos),
      se_puede_eliminar: Number(r.total_cuentas) === 0 && Number(r.total_movimientos) === 0,
    })),
    duplicados,
    estadisticas: {
      totalSocios: Number(stats[0]?.total_socios || 0),
      conDpi: Number(stats[0]?.con_dpi || 0),
      sinDpi: Number(stats[0]?.sin_dpi || 0),
      conAdvertencia: Number(stats[0]?.con_advertencia || 0),
    },
  };
}

export async function eliminarSocioSinVinculos(socioId: string, usuarioId: string) {
  // Verificar que no tenga vínculos
  const check = await pool.query(`
    SELECT 
      (SELECT COUNT(*) FROM cuentas WHERE socio_id = $1) as cuentas,
      (SELECT COUNT(*) FROM prestamos WHERE socio_id = $1) as prestamos,
      (SELECT COUNT(*) FROM caja_movimientos_auxiliar WHERE socio_id = $1) as movs_caja,
      (SELECT COUNT(*) FROM cobros_campo WHERE socio_id = $1) as cobros
  `, [socioId]);

  const stats = check.rows[0];
  const total = Number(stats.cuentas) + Number(stats.prestamos) + Number(stats.movs_caja) + Number(stats.cobros);

  if (total > 0) {
    throw badRequest(`No se puede eliminar el socio. Tiene historial financiero activo (${total} registros). Utiliza la opción de "Fusión" si es un duplicado.`);
  }

  await registrarAuditoria({
    tabla: "socios",
    operacion: "DELETE",
    registroId: socioId,
    usuarioId,
    datosAntes: JSON.stringify({ socioId }),
    datosDespues: null,
    descripcion: "Eliminación de socio sin vínculos (limpieza de duplicados vacíos)",
  });

  await pool.query(`DELETE FROM socios WHERE id = $1`, [socioId]);
  return { mensaje: "Socio vacío eliminado correctamente." };
}

export async function fusionarSocios(socioOrigenId: string, socioDestinoId: string, usuarioId: string, agenciaVisible: string | null) {
  if (socioOrigenId === socioDestinoId) throw badRequest("No puedes fusionar un socio consigo mismo.");

  return withTransaction(async (client) => {
    // Validar que ambos existan y pertenezcan a la agencia visible
    const res = await client.query(`SELECT id, agencia_id, nombres, dpi FROM socios WHERE id IN ($1, $2)`, [socioOrigenId, socioDestinoId]);
    if (res.rows.length !== 2) throw notFound("Uno o ambos socios no existen.");
    
    const origen = res.rows.find(r => r.id === socioOrigenId);
    const destino = res.rows.find(r => r.id === socioDestinoId);
    
    if (agenciaVisible) {
      if (origen.agencia_id !== agenciaVisible || destino.agencia_id !== agenciaVisible) {
        throw forbidden("Ambos socios deben pertenecer a tu agencia para fusionarlos.");
      }
    }

    // Trasladar referencias de tablas
    await client.query(`UPDATE cuentas SET socio_id = $1 WHERE socio_id = $2`, [socioDestinoId, socioOrigenId]);
    await client.query(`UPDATE prestamos SET socio_id = $1 WHERE socio_id = $2`, [socioDestinoId, socioOrigenId]);
    await client.query(`UPDATE prestamo_pagos SET socio_id = $1 WHERE socio_id = $2`, [socioDestinoId, socioOrigenId]);
    await client.query(`UPDATE caja_movimientos_auxiliar SET socio_id = $1 WHERE socio_id = $2`, [socioDestinoId, socioOrigenId]);
    await client.query(`UPDATE cobros_campo SET socio_id = $1 WHERE socio_id = $2`, [socioDestinoId, socioOrigenId]);
    await client.query(`UPDATE ingresos_comif SET socio_id = $1 WHERE socio_id = $2`, [socioDestinoId, socioOrigenId]);
    await client.query(`UPDATE traslados SET socio_id = $1 WHERE socio_id = $2`, [socioDestinoId, socioOrigenId]);
    
    // Registrar auditoría de la fusión
    await client.query(`
      INSERT INTO auditoria (usuario_id, modulo, accion, entidad_id, motivo, datos_anteriores, fecha)
      VALUES ($1, 'SOCIOS', 'FUSIONAR', $2, $3, $4, NOW())
    `, [
      usuarioId, 
      socioDestinoId, 
      `Se absorbió la información del socio erróneo ${origen.nombres} (DPI ${origen.dpi})`, 
      JSON.stringify({ eliminado: origen, fusionadoCon: destino })
    ]);

    // Eliminar el socio origen
    await client.query(`DELETE FROM socios WHERE id = $1`, [socioOrigenId]);

    return { mensaje: `Socio ${origen.nombres} fusionado correctamente hacia ${destino.nombres}.` };
  });
}
