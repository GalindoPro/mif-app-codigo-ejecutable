import "dotenv/config";
import { pool } from "./pool";
import { hashPassword } from "../utils/auth";

export async function actualizarUsuariosCooperativa() {
  const client = await pool.connect();
  try {
    const { rows: chAg } = await client.query<{ id: string }>(
      "select id from agencias where codigo = 'CHAJUL' or upper(nombre) like '%CHAJUL%' limit 1"
    );
    const chajulId = chAg[0]?.id;

    // 1. Tereza - Caja Auxiliar Chajul
    await client.query(
      `update usuarios 
       set nombre = 'Tereza - Caja Auxiliar Chajul',
           email = 'tereza.caja@mif.coop',
           updated_at = now()
       where email in ('cajero@mif.coop', 'tereza.caja@mif.coop') or id = 'b6605a0d-b4d1-4539-a299-a63f91aa8b05'`
    );

    // 2. Rosy - Caja Chica Chajul
    await client.query(
      `update usuarios 
       set nombre = 'Rosy - Caja Chica Chajul',
           email = 'rosy.cajachica@mif.coop',
           updated_at = now()
       where email in ('cajachica@mif.coop', 'rosy.cajachica@mif.coop') or id = 'b701113e-f662-4faa-b06d-69efc50f5146'`
    );

    // 3. Diego - Promotor 1 Chajul
    await client.query(
      `update usuarios 
       set nombre = 'Diego - Promotor 1 Chajul',
           email = 'diego.promotor@mif.coop',
           updated_at = now()
       where email in ('promotor@mif.coop', 'diego.promotor@mif.coop') or id = '204e698e-4661-417e-84d1-3b7d461187c7'`
    );

    // 4. Walter - Promotor 2 Chajul
    const { rows: wRows } = await client.query(
      "select id from usuarios where email = 'walter.promotor@mif.coop'"
    );
    if (wRows.length === 0) {
      const pwd = await hashPassword("Password123!");
      await client.query(
        `insert into usuarios (nombre, email, password_hash, rol, agencia_id, activo)
         values ('Walter - Promotor 2 Chajul', 'walter.promotor@mif.coop', $1, 'PROMOTOR', $2, true)`,
        [pwd, chajulId]
      );
      console.log("✓ Walter - Promotor 2 Chajul creado.");
    } else {
      await client.query(
        `update usuarios 
         set nombre = 'Walter - Promotor 2 Chajul', updated_at = now()
         where email = 'walter.promotor@mif.coop'`
      );
      console.log("✓ Walter - Promotor 2 Chajul actualizado.");
    }

    const { rows: finalUsers } = await client.query(
      "select id, nombre, email, rol, activo from usuarios order by nombre"
    );
    console.log("\n✅ Lista Oficial de Usuarios Actualizada:");
    console.table(finalUsers);
  } finally {
    client.release();
  }
}

if (require.main === module) {
  actualizarUsuariosCooperativa()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("Error al actualizar usuarios:", err);
      process.exit(1);
    });
}
