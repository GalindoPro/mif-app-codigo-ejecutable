import { pool } from "../../db/pool";
import { Socio } from "../../types/models";
import { registrarAuditoria } from "../../utils/auditoria";
import { badRequest, notFound, forbidden, conflict } from "../../utils/errors";

export interface FiltrosSocios {
  agenciaId: string | null; // null = todas (ADMIN/GERENCIA)
  q?: string;
  estado?: "ACTIVO" | "INACTIVO";
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

  const where = condiciones.length ? `where ${condiciones.join(" and ")}` : "";
  const offset = (filtros.page - 1) * filtros.pageSize;

  valores.push(filtros.pageSize, offset);
  const limitIdx = valores.length - 1;
  const offsetIdx = valores.length;

  const [{ rows }, { rows: countRows }] = await Promise.all([
    pool.query(
      `select s.*, a.nombre as agencia_nombre, a.codigo as agencia_codigo,
              coalesce(cnt.total_cuentas, 0)::int as total_cuentas
       from socios s
       join agencias a on a.id = s.agencia_id
       left join (select socio_id, count(*) as total_cuentas from cuentas group by socio_id) cnt
              on cnt.socio_id = s.id
       ${where}
       order by s.numero_asociado asc, s.created_at asc
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
  edad?: number | null;
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

  if (data.dpi && data.dpi.trim()) {
    const rawDpi = data.dpi.replace(/\D/g, "");
    if (rawDpi.length === 13) {
      const { rows: dpiRepetido } = await pool.query(
        `select dpi, nombres, numero_asociado from socios where regexp_replace(dpi, '[^0-9]', '', 'g') = $1 limit 1`,
        [rawDpi],
      );
      if (dpiRepetido[0]) {
        throw conflict(
          `El DPI "${data.dpi.trim()}" ya está registrado para el socio "${dpiRepetido[0].nombres}" (Asociado: ${dpiRepetido[0].numero_asociado}).`,
        );
      }
    }
  }

  // Validación de teléfono del socio (no repetible en todo el sistema)
  if (data.telefono && data.telefono.trim()) {
    const rawTel = data.telefono.replace(/\D/g, "");
    const localTel = rawTel.startsWith("502") && rawTel.length > 8 ? rawTel.slice(3) : rawTel.slice(-8);
    if (localTel.length === 8) {
      const { rows: telRepetido } = await pool.query(
        `select telefono, nombres, numero_asociado from socios where regexp_replace(telefono, '[^0-9]', '', 'g') like $1 limit 1`,
        [`%${localTel}`],
      );
      if (telRepetido[0]) {
        throw conflict(
          `El teléfono "${data.telefono.trim()}" ya está registrado para el socio "${telRepetido[0].nombres}" (Asociado: ${telRepetido[0].numero_asociado}). No se permiten números de teléfono duplicados.`,
        );
      }
    }
  }

  // Validación de teléfono del beneficiario (no repetible con otro socio ni beneficiario)
  if (data.telefonoBeneficiario && data.telefonoBeneficiario.trim()) {
    const rawTelBen = data.telefonoBeneficiario.replace(/\D/g, "");
    const localTelBen = rawTelBen.startsWith("502") && rawTelBen.length > 8 ? rawTelBen.slice(3) : rawTelBen.slice(-8);
    if (localTelBen.length === 8) {
      const { rows: telBenRepetido } = await pool.query(
        `select nombres, numero_asociado, 'Socio' as tipo from socios where regexp_replace(telefono, '[^0-9]', '', 'g') like $1
         union all
         select coalesce(nombre_beneficiario, nombres) as nombres, numero_asociado, 'Beneficiario' as tipo from socios where regexp_replace(telefono_beneficiario, '[^0-9]', '', 'g') like $1
         limit 1`,
        [`%${localTelBen}`],
      );
      if (telBenRepetido[0]) {
        throw conflict(
          `El teléfono del beneficiario "${data.telefonoBeneficiario.trim()}" ya está registrado en el sistema (${telBenRepetido[0].tipo}: ${telBenRepetido[0].nombres}, Asociado: ${telBenRepetido[0].numero_asociado}).`,
        );
      }
    }
  }

  // Validación obligatoria de número de boleta / recibo de pago
  if (!data.reciboAportacionInicial || !data.reciboAportacionInicial.trim()) {
    throw badRequest("El número de boleta o recibo de pago es obligatorio para respaldar la aportación estatutaria inicial.");
  }

  const { rows } = await pool.query<Socio>(
    `insert into socios
      (numero_asociado, agencia_id, nombres, genero, edad, fecha_ingreso, dpi, direccion, telefono, nombre_beneficiario, dpi_beneficiario, telefono_beneficiario, parentesco_beneficiario, creado_por_id)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
     returning *`,
    [
      data.numeroAsociado,
      data.agenciaId,
      capitalizarNombre(data.nombres)!,
      data.genero ?? null,
      data.edad ?? null,
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

export async function verificarDpi(dpi: string, socioIdActual?: string) {
  const rawDpi = dpi.replace(/\D/g, "");
  if (rawDpi.length !== 13) {
    return { valido: false, mensaje: "El DPI debe contener 13 dígitos numéricos" };
  }
  const params: unknown[] = [rawDpi];
  let query = `select id, nombres, numero_asociado, dpi from socios where regexp_replace(dpi, '[^0-9]', '', 'g') = $1`;
  if (socioIdActual) {
    params.push(socioIdActual);
    query += ` and id != $2`;
  }
  query += ` limit 1`;

  const { rows } = await pool.query(query, params);
  if (rows[0]) {
    return {
      valido: true,
      disponible: false,
      socio: {
        id: rows[0].id,
        nombres: rows[0].nombres,
        numeroAsociado: rows[0].numero_asociado,
        dpi: rows[0].dpi,
      },
    };
  }
  return { valido: true, disponible: true };
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

  // 2. Si se verifica beneficiario, también verificar en beneficiarios registrados
  if (tipo === "BENEFICIARIO") {
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
          nombres: benRows[0].nombre_beneficiario || benRows[0].nombres,
          numeroAsociado: benRows[0].numero_asociado,
          rol: `Beneficiario del socio ${benRows[0].nombres}`,
        },
      };
    }
  }

  return { valido: true, disponible: true };
}

export async function abrirAportacionSocio(
  socioId: string,
  monto: number = 100,
  recibo?: string | null,
  usuarioId: string = ""
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

  return cuentaRows[0];
}

export async function actualizar(
  id: string,
  data: Partial<DatosSocio> & { estado?: "ACTIVO" | "INACTIVO" },
  usuarioId: string,
  agenciaVisibleParaUsuario: string | null,
): Promise<Socio> {
  const anterior = await obtener(id, agenciaVisibleParaUsuario);

  if (data.dpi && data.dpi.trim()) {
    const rawDpi = data.dpi.replace(/\D/g, "");
    if (rawDpi.length === 13) {
      const { rows: dpiRepetido } = await pool.query(
        `select dpi, nombres, numero_asociado from socios 
         where regexp_replace(dpi, '[^0-9]', '', 'g') = $1 and id != $2 limit 1`,
        [rawDpi, id],
      );
      if (dpiRepetido[0]) {
        throw conflict(
          `El DPI "${data.dpi.trim()}" ya está registrado para el socio "${dpiRepetido[0].nombres}" (Asociado: ${dpiRepetido[0].numero_asociado}).`,
        );
      }
    }
  }

  if (data.telefono && data.telefono.trim()) {
    const rawTel = data.telefono.replace(/\D/g, "");
    const localTel = rawTel.startsWith("502") && rawTel.length > 8 ? rawTel.slice(3) : rawTel.slice(-8);
    if (localTel.length === 8) {
      const { rows: telRepetido } = await pool.query(
        `select telefono, nombres, numero_asociado from socios 
         where regexp_replace(telefono, '[^0-9]', '', 'g') like $1 and id != $2 limit 1`,
        [`%${localTel}`, id],
      );
      if (telRepetido[0]) {
        throw conflict(
          `El teléfono "${data.telefono.trim()}" ya está registrado para el socio "${telRepetido[0].nombres}" (Asociado: ${telRepetido[0].numero_asociado}).`,
        );
      }
    }
  }

  if (data.telefonoBeneficiario && data.telefonoBeneficiario.trim()) {
    const rawTelBen = data.telefonoBeneficiario.replace(/\D/g, "");
    const localTelBen = rawTelBen.startsWith("502") && rawTelBen.length > 8 ? rawTelBen.slice(3) : rawTelBen.slice(-8);
    if (localTelBen.length === 8) {
      const { rows: telBenRepetido } = await pool.query(
        `select nombres, numero_asociado, 'Socio' as tipo from socios 
         where regexp_replace(telefono, '[^0-9]', '', 'g') like $1 and id != $2
         union all
         select coalesce(nombre_beneficiario, nombres) as nombres, numero_asociado, 'Beneficiario' as tipo from socios 
         where regexp_replace(telefono_beneficiario, '[^0-9]', '', 'g') like $1 and id != $2
         limit 1`,
        [`%${localTelBen}`, id],
      );
      if (telBenRepetido[0]) {
        throw conflict(
          `El teléfono del beneficiario "${data.telefonoBeneficiario.trim()}" ya está registrado en el sistema (${telBenRepetido[0].tipo}: ${telBenRepetido[0].nombres}, Asociado: ${telBenRepetido[0].numero_asociado}).`,
        );
      }
    }
  }

  const campos: Record<string, unknown> = {
    nombres: data.nombres !== undefined ? (data.nombres ? capitalizarNombre(data.nombres) : data.nombres) : undefined,
    genero: data.genero,
    edad: data.edad,
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
    select s.id as socio_id, s.numero_asociado, s.nombres, s.dpi, s.edad, s.genero, s.fecha_ingreso, s.direccion, s.telefono,
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
