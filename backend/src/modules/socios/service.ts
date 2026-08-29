import { pool } from "../../db/pool";
import { Socio } from "../../types/models";
import { registrarAuditoria } from "../../utils/auditoria";
import { notFound, forbidden } from "../../utils/errors";

export interface FiltrosSocios {
  agenciaId: string | null; // null = todas (ADMIN/GERENCIA)
  q?: string;
  estado?: "ACTIVO" | "INACTIVO";
  page: number;
  pageSize: number;
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
    valores.push(`%${filtros.q.toLowerCase()}%`);
    const idx = valores.length;
    condiciones.push(
      `(lower(s.nombres) like $${idx} or s.dpi like $${idx} or lower(s.numero_asociado) like $${idx})`,
    );
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
       order by s.created_at desc
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
  genero?: "M" | "F";
  fechaIngreso: string;
  dpi?: string;
  direccion?: string;
  telefono?: string;
  nombreBeneficiario?: string;
}

export async function crear(data: DatosSocio, usuarioId: string): Promise<Socio> {
  const { rows } = await pool.query<Socio>(
    `insert into socios
      (numero_asociado, agencia_id, nombres, genero, fecha_ingreso, dpi, direccion, telefono, nombre_beneficiario, creado_por_id)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
     returning *`,
    [
      data.numeroAsociado,
      data.agenciaId,
      data.nombres,
      data.genero ?? null,
      data.fechaIngreso,
      data.dpi ?? null,
      data.direccion ?? null,
      data.telefono ?? null,
      data.nombreBeneficiario ?? null,
      usuarioId,
    ],
  );
  const socio = rows[0];
  await registrarAuditoria({ entidad: "Socio", entidadId: socio.id, accion: "CREAR", usuarioId, datosNuevos: socio });
  return socio;
}

export async function actualizar(
  id: string,
  data: Partial<DatosSocio> & { estado?: "ACTIVO" | "INACTIVO" },
  usuarioId: string,
  agenciaVisibleParaUsuario: string | null,
): Promise<Socio> {
  const anterior = await obtener(id, agenciaVisibleParaUsuario);

  const campos: Record<string, unknown> = {
    nombres: data.nombres,
    genero: data.genero,
    fecha_ingreso: data.fechaIngreso,
    dpi: data.dpi,
    direccion: data.direccion,
    telefono: data.telefono,
    nombre_beneficiario: data.nombreBeneficiario,
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
  const socio = rows[0];
  await registrarAuditoria({
    entidad: "Socio",
    entidadId: id,
    accion: "ACTUALIZAR",
    usuarioId,
    datosAnteriores: anterior,
    datosNuevos: socio,
  });
  return socio;
}
