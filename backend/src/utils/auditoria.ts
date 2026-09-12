import { PoolClient } from "pg";
import { pool } from "../db/pool";

type Accion = "CREAR" | "ACTUALIZAR" | "ELIMINAR";

// Deja constancia de quién creó, modificó o eliminó un registro y cuándo.
// Se llama desde cada servicio de escritura (ver modules/socios/service.ts).
export async function registrarAuditoria(
  params: {
    entidad: string;
    entidadId: string;
    accion: Accion;
    usuarioId: string;
    datosAnteriores?: unknown;
    datosNuevos?: unknown;
    motivo?: string;
  },
  client: Pick<PoolClient, "query"> = pool,
) {
  await client.query(
    `insert into auditoria (entidad, entidad_id, accion, usuario_id, datos_anteriores, datos_nuevos, motivo)
     values ($1, $2, $3, $4, $5, $6, $7)`,
    [
      params.entidad,
      params.entidadId,
      params.accion,
      params.usuarioId,
      params.datosAnteriores ? JSON.stringify(params.datosAnteriores) : null,
      params.datosNuevos ? JSON.stringify(params.datosNuevos) : null,
      params.motivo || null,
    ],
  );
}
