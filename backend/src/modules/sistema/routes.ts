import { Router } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { requireAuth, requireRole } from "../../middleware/auth";
import { pool } from "../../db/pool";
import { registrarAuditoria } from "../../utils/auditoria";

export const sistemaRouter = Router();
sistemaRouter.use(requireAuth);

sistemaRouter.post(
  "/reset",
  requireRole("ADMIN"),
  asyncHandler(async (req, res) => {
    await pool.query(`
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

    await pool.query(`
      insert into agencias (codigo, nombre, direccion, activa)
      values ('CHAJUL', 'Agencia Chajul', 'Chajul, Quiché', true)
      on conflict (codigo) do update set activa = true;
    `);

    if (req.user) {
      await registrarAuditoria({
        usuarioId: req.user.id,
        accion: "ELIMINAR",
        entidad: "sistema",
        entidadId: req.user.id,
        datosNuevos: { motivo: "Reinicio completo del sistema desde cero para pruebas" },
      });
    }

    res.json({ ok: true, mensaje: "El sistema ha sido reiniciado desde cero exitosamente." });
  }),
);
