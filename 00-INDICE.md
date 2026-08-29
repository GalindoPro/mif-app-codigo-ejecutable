# Sistema Integral MIF — Código para revisión

Estos archivos contienen el **código real y completo** del proyecto, tal como
está construido y probado hasta ahora (Fase 1 + avance de Fase 2), en formato
Markdown para que lo puedas leer, comentar y pedir cambios antes de la
siguiente entrega (el zip con el proyecto listo para instalar).

## Cómo están organizados

- **`01-codigo-backend.md`** — la API (Node.js + TypeScript + PostgreSQL):
  esquema de base de datos, autenticación, roles, auditoría, y los módulos de
  agencias, usuarios, socios, cuentas de ahorro (corriente/programado/infanto
  juvenil), caja chica, **auxiliar de caja** (libro de caja diario) y tablero
  (dashboard). Incluye también, al final, el borrador de esquema adaptado a
  Supabase (`db/schema.supabase.sql`), en pausa por el tema de red que ya
  hablamos.
- **`02-codigo-frontend.md`** — la app web (React + TypeScript + Vite,
  configurada como PWA): login, tablero, socios, cuentas de ahorro, caja
  chica, auxiliar de caja y agencias.

Cada archivo del proyecto aparece con su ruta como título (por ejemplo
`backend/src/modules/socios/service.ts`) y su contenido completo en un bloque
de código, en el mismo orden en que están en el proyecto real.

## Estado actual

- ✅ **Fase 1 completa y probada**: esquema de base de datos, autenticación
  con roles, módulo de Socios de punta a punta (alta, edición, búsqueda,
  activar/inactivar), auditoría.
- ✅ **Fase 2 en avance, probado**: roles renombrados en la interfaz
  (Operador / Jefe de agencia), Tablero con resumen consolidado y detalle por
  agencia, módulo de Caja Chica (con categorías de gasto y número de
  documento por defecto "DTE"), el módulo genérico de Ahorro (Corriente,
  Programado, Infanto Juvenil) con búsqueda de socio, registro de depósitos y
  retiros, y totales de depósitos/retiros por tipo de cuenta, y el nuevo
  **Auxiliar de Caja** (libro de caja diario, ver más abajo).
- 🔜 **Pendiente**: ajustar el número de cuenta al formato real de la
  cooperativa (`agencia-asociado-tipo-secuencia`, ya tengo los códigos por
  tipo de cuenta, falta el número de agencia de Chajul) y construir el nuevo
  módulo de **Créditos** (roles de Promotor, tabla de amortización, 2% de
  interés mensual, simulador de crédito).

## Auxiliar de Caja (nuevo)
Construido a partir del Excel real "Auxiliar de Caja COMIF CHAJUL" que
compartiste. Funciona así:
- Cada día la caja se **abre** con el saldo de cierre del día anterior
  (automático) o, la primera vez, con un saldo que se captura manualmente.
- Se registran movimientos en dos secciones, igual que en el Excel:
  **transacciones como agente Banco Industrial** (Servicios, Depósitos,
  Retiro, Remesa — con beneficiario libre y número de autorización BI) e
  **ingresos/egresos propios** (Ahorro Corriente/Programado/Infanto Juvenil,
  Plazo Fijo, Aportación, Ingreso de asociado, Comisión, abonos/intereses/
  mora de préstamos hipotecarios y fiduciarios, colocación de préstamos,
  varios). Cada categoría lleva su propio contador correlativo, continuo por
  agencia (nunca se reinicia por día), igual que en el libro real.
- Cuando el movimiento es de Ahorro Corriente/Programado/Infanto Juvenil,
  **crea automáticamente el depósito o retiro real** en la cuenta del socio
  (la misma que ves en `/ahorros/...`) y arma la referencia con el formato
  que pediste: `{número de cuenta}-IN` para ingresos y `{número de
  cuenta}-EN` para egresos.
- Al final del día se **cierra la caja**: se captura el conteo de billetes y
  monedas de Guatemala (Q200 a Q0.01) y el sistema exige que cuadre
  exactamente con el saldo calculado antes de dejar cerrar — si no cuadra,
  muestra la diferencia para que se revise.
- Lo que todavía no tiene módulo propio (Plazo Fijo real y Colocación de
  préstamos, porque esos módulos no están construidos aún) queda igual
  registrado en el auxiliar del día para que la caja cuadre hoy mismo, listo
  para conectarse a esos módulos cuando se construyan.
- 🔜 **Pendiente de decidir**: cómo terminamos de conectar Supabase. Ya
  preparé el esquema con Row Level Security (`db/schema.supabase.sql`), pero
  el código del backend y el frontend que ves aquí **todavía usa el login
  propio (usuario/contraseña con JWT) y PostgreSQL local** — no está
  reescrito para usar Supabase Auth todavía.

## Cómo pedir cambios

Dime el archivo y qué quieres ajustar (por ejemplo: "en
`backend/src/modules/socios/service.ts`, agrega tal validación") y lo aplico
directo sobre el proyecto real; estos `.md` son una copia de lectura, no la
fuente que edito.

Cuando quede como quieres, te entrego el proyecto completo en un `.zip` listo
para instalar (con su `README.md` de instrucciones).
