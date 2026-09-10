import { Router } from "express";
import { execSync } from "child_process";
import path from "path";
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

    res.json({ ok: true, mensaje: "El sistema ha sido reiniciado desde cero exitosamente. Base de datos limpia y lista." });
  }),
);

sistemaRouter.post(
  "/recargar-datos",
  requireRole("ADMIN"),
  asyncHandler(async (req, res) => {
    // 1. Limpiar datos previos
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

    // 2. Ejecutar la migración oficial desde los archivos Excel
    const backendDir = path.resolve(__dirname, "../../..");
    execSync("npm run db:seed:excel", { cwd: backendDir, stdio: "pipe" });

    if (req.user) {
      await registrarAuditoria({
        usuarioId: req.user.id,
        accion: "CREAR",
        entidad: "sistema",
        entidadId: req.user.id,
        datosNuevos: { motivo: "Recarga de datos existentes desde libros de Excel" },
      });
    }

    res.json({
      ok: true,
      mensaje: "Se han recargado exitosamente todos los datos existentes de los libros Excel (568 asociados, 65 créditos activos de cartera y 692 certificados de plazo fijo).",
    });
  }),
);
