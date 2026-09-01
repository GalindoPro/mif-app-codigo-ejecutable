# Sistema Integral MIF — Estado y Control de Desarrollo

Este documento registra el **avance real y completo** del sistema de la Cooperativa Integral de Ahorro y Crédito "Maya Inversiones Futuras" R.L. (MIF), detallando los módulos completados, la estructura operativa y las siguientes funciones en cola.

---

## 1. Estado Actual de Módulos

### ✅ Módulos Completados y Probados

1. **Autenticación y Matriz de Roles:**
   - Roles configurados: `ADMIN` (Administrador), `GERENCIA` (Gerencia), `SUPERVISOR` (Jefe de agencia), `CAJERO` (Operador) y `PROMOTOR` (Promotor de crédito).
   - Control de permisos en Frontend y Backend: cada rol ve exclusivamente las opciones y tarjetas que le corresponden.
   - Gestión de usuarios y asignación de personal a agencias (`/usuarios`).
   - Base de datos conectada localmente a PostgreSQL 18 (`mif_dev`, usuario `galindo`).

2. **Módulo de Socios y Padrón de Aportaciones (`/socios` y `/aportaciones`):**
   - Basado en el libro oficial `caja/APORTACIONES 31-08-26.xlsx`.
   - **Campos del asociado:** Nombres, DPI, Género (`M`/`F`), Edad (años), Dirección y Teléfono.
   - **Datos de la persona beneficiaria:** Nombre completo, DPI y Teléfono de contacto.
   - **Apertura automática de Aportaciones:** Creación de cuenta `CHAJUL-APOR-XXXX` para cada socio.
   - **Padrón de Aportaciones de Capital (`/aportaciones`):**
     - Métricas clave: Capital Social Total Aportado, Total de Asociados Inscritos, Aportación Promedio por Socio.
     - Tabla del padrón con filtro en tiempo real y vista imprimible (`🖨️ Imprimir`).
   - Permiso habilitado para que los **Promotores de crédito (`PROMOTOR`)** registren y actualicen asociados directamente en campo.

3. **Caja Chica (`/caja-chica`):**
   - Basado en `caja/Caja Chica 30-07-2026.xlsx`.
   - Registro de comprobantes de ingreso y egreso con categorías contables y documentos (DTE, factura, recibo).
   - **Reposición del Fondo Fijo (`📥 Reponer Fondo (Cheque)`):**
     - Recarga oficial del saldo de caja chica mediante cheque emitido por la cooperativa (`No. CH.`, ej. *1290*, *2000*).
     - Validación anti-duplicados para evitar registrar dos veces el mismo cheque.
     - Incremento inmediato del saldo disponible para gastos operativos.
   - Arqueo físico interactivo de billetes y monedas (Q200 a Q0.01) con cálculo de diferencia y saldo acumulado.


4. **Cuentas de Ahorro a la Vista y Programado (`/ahorros/...`):**
   - Basado en `caja/AHORRO CORRIENTE`, `AHORRO PROGRAMADO` y `AHORRO INFANTO JUVENIL`.
   - Libreta única por producto para cada asociado (evita duplicación accidental).
   - Registro de movimientos, depósitos, retiros y cálculo de saldo acumulado en tiempo real con la vista `saldos_cuenta`.

5. **Ahorro a Plazo Fijo — Kardex PF (`/ahorros/plazo-fijo`):**
   - Basado en `caja/KARDEX AHORRO PF 2026-08.xlsx` y `caja/EJEMPLO 2.xlsx`.
   - Emisión de Certificados de Inversión a Plazo Fijo con correlativo (`CHAJUL-PF-XXXX`).
   - Motor financiero oficial:
     - Interés generado al plazo pactado: $P \times (r / 100) \times (n / 12)$.
     - Retención legal de ISR del 10% sobre intereses brutos.
     - Interés neto y saldo líquido a pagar.
     - Cálculo exacto de fecha de vencimiento.
   - Alertas visuales para certificados vencidos listos para cobro.
   - Liquidación y pago del certificado al vencimiento (`LIQUIDADO`) con generación de recibo contable.

6. **Créditos y Promotor (`/creditos`):**
   - Roles de promotores de campo asignados a cada crédito.
   - **Simulador de crédito:** cotizador al 2% mensual (24% anual) con cuota nivelada (francesa) y sobre saldos (alemana).
   - Generación de tabla mensual oficial de amortización (No. cuota, fecha de pago, cuota mensual, capital, intereses y saldo deudor).
   - Solicitudes de crédito fiduciario e hipotecario, registro de garantías/fiadores y flujo de estados (`SOLICITUD` → `APROBADO` → `DESEMBOLSADO` → `CANCELADO`).

7. **Auxiliar de Caja — Ventanilla e Ingresos COMIF (`/auxiliar-caja`):**
   - Basado en `caja/INGRESOS COMIF CHAJUL 31-08-26.xlsx` y `caja/EJEMPLO 2.xlsx`.
   - Libro de caja diario: operaciones como agente Banco Industrial y operaciones propias de la cooperativa.
   - Correlativos continuos por agencia y categoría.
   - **Cobro ágil de cuota de crédito en ventanilla (`💵 Cobro cuota de crédito`):**
     - Búsqueda de socio y detección automática de préstamos activos.
     - Desglose inteligente de cuota: **Abono a Capital**, **Intereses al 2% mensual** y **Mora**.
     - Impacto simultáneo en un solo clic:
       1. Incrementa el saldo diario en caja con referencia contable `{codigo_prestamo}-CUOTA`.
       2. Registra las partidas desglosadas en el libro oficial de `ingresos_comif`.
       3. Guarda el recibo en la tabla `prestamo_pagos`.
       4. Descuenta el saldo deudor del préstamo (`saldo_capital`), cancelándolo automáticamente si el saldo llega a Q 0.00.
   - **Desembolso de crédito en ventanilla (`📤 Desembolso de crédito`):**
     - Detección de préstamos en estado `APROBADO` en la agencia.
     - Validación de saldo físico disponible en caja antes de entregar el dinero.
     - Registro del comprobante de egreso y descuento automático del efectivo en la categoría contable oficial **Colocación**.
     - Activación automática del crédito a `DESEMBOLSADO` con su fecha de entrega y saldo capital activo.
   - **Liquidación de Plazo Fijo en Ventanilla (`📦 Liquidar Plazo Fijo`):**
     - Basado en el libro real `LIQUIDACION DE PF 2025 8.xlsx` y `KARDEX AHORRO PF 2026-08.xlsx`.
     - Detección de contratos de plazo fijo vigentes en la agencia.
     - Opción de entrega de fondos: **Solo Capital** (Q) o **Capital + Interés Neto Líquido** (Q).
     - **Control de solvencia física:** valida que la gaveta de caja tenga suficiente efectivo antes de autorizar la entrega.
     - **Registro obligatorio de `RE. No.` (Recibo de Retiro):** protegido contra duplicados en todo el sistema.
     - Impacto simultáneo: descuenta el efectivo en el Auxiliar de Caja en la categoría contable oficial **Retiro de Plazo Fijo**, registra el retiro en la cuenta y actualiza el contrato a `LIQUIDADO` con su fecha y monto entregado.
   - **Panel de Novedades de Campo en Tiempo Real (`🔔 Novedades de Campo`):**
     - Visualización instantánea para el cajero de cuentas creadas por Promotores en campo con cuota pactada (Programado / Infanto-Juvenil) y justificación de apertura.
     - Botón directo para registrar el primer depósito sin tener que buscar o reescribir datos.
   - **Arqueo y Cierre Diario de Caja:** recuento interactivo de billetes y monedas (Q200 a Q0.01) con cálculo de diferencia (cuadrada, sobrante o faltante).
   - **Vista de Caja Cerrada y Acta Oficial de Arqueo (`🖨️ Imprimir Acta Oficial de Arqueo`):**
     - Basado en las hojas reales de auditoría `Arqueo Caja Ag Chaj...` de `Auxiliar de Caja COMIF CHAJUL 15-08-2026.xlsx`.
     - Resumen de turno finalizado: Saldo inicial, total ingresos, total egresos, saldo final del libro, total efectivo contado y diferencia de arqueo.
     - **Acta Oficial Imprimible:** Encabezado de *Maya Inversiones Futuras, R.L.*, cuadro de recuento de billetes y monedas, texto formal de auditoría y 4 firmas institucionales de conformidad (**Receptor Pagador, Presidente, Secretaria y Vocal I de la Comisión de Vigilancia**).
   - **Historial de Días de Caja (`📅 Historial de Cajas`):**
     - Consulta cronológica de cajas diarias anteriores para supervisores y auditoría.
     - Permite inspeccionar movimientos de cualquier fecha anterior y reimprimir su Acta Oficial de Arqueo en un clic.

8. **Escudo Anti-Duplicados y Validación Cruzada en Tiempo Real:**
   - Previene el doble trabajo y los errores de digitación durante el uso de talonarios físicos de papel.
   - **Bloqueo estricto de números de recibo / documento:** validación cruzada instantánea entre Auxiliar de Caja (`caja_movimientos_auxiliar`), Ahorros (`movimientos`) y Créditos (`prestamo_pagos`). Si un recibo ya se usó, el sistema lo bloquea y notifica: fecha, cuenta y nombre del socio original.
   - **Bloqueo de número de cuenta y certificados:** previene registrar dos cuentas o certificados a plazo fijo con el mismo correlativo.
   - **Bloqueo de número de asociado y DPI:** previene duplicar socios en el padrón.

9. **Herramientas de Soporte y Pruebas:**
   - Botón y endpoint de **Reinicio a Cero** (`POST /api/sistema/reset` y script `npm run db:reset`), para limpiar datos de prueba manteniendo la agencia y usuarios intactos.

10. **Kardex Maestro de Cartera del Promotor (`/promotor/cartera`):**
    - Elimina por completo la transcripción manual del Excel de 168 columnas (`KARDEX PRESTAMOS... promotor 2.xlsx`).
    - **Pestañas Hipotecario y Fiduciario:** clasificación automática de la cartera por tipo de garantía.
    - **Ficha de colocación enriquecida:** captura de comunidad / ubicación de garantía (*Aldea Campo Alegre*, *Cantón Ilom*, etc.), nombre del fiador, documento de desembolso y fecha de vencimiento.
    - **Alimentación automática en vivo:** cada vez que el cajero cobra una cuota en ventanilla, el abono a capital, fecha, recibo y saldo deudor restante se registran de inmediato en el Kardex del Promotor sin intervención manual.
    - **Semáforo de cobro mensual:** detección inteligente de socios 🟢 Al día vs 🔴 Pendientes de pago del mes para enfocar las visitas de cobro en campo.
    - **Reporte oficial imprimible:** botón directo `🖨️ Imprimir Kardex` para supervisión y gerencia.

11. **Carga Inicial y Migración Masiva de Datos Históricos (`npm run db:seed:excel`):**
    - Script de importación automatizada desde los archivos reales de la cooperativa:
      * **`caja/APORTACIONES 31-08-26.xlsx`:** Importa el padrón con DPI, fecha de ingreso, edad, género y cuenta de aportación de capital.
      * **`promotor/KARDEX PRESTAMOS 01-07-26 AL 31-07-26 promotor 2.xlsx`:** Importa la cartera hipotecaria y fiduciaria con su saldo vivo al 2026, fiador, comunidad de garantía y vencimiento.
      * **`caja/KARDEX AHORRO PF 2026-08.xlsx`:** Importa el histórico completo de certificados de plazo fijo, depósitos, intereses netos, retenciones de ISR y registros de liquidación con `RE. No.`.
    - **Totales Reales Migrados:**
      * **569 Socios** registrados y unificados sin duplicados.
      * **Q 11,600.00** en Aportaciones de Capital activas.
      * **66 Préstamos Vivos** con un saldo deudor total de **Q 15,221,556.49**.
      * **692 Certificados de Inversión a Plazo Fijo** con un total invertido de **Q 19,897,503.72**.

12. **Gráfica y Monitoreo de Servicios para el Supervisor (`/tablero`):**
    - Selector interactivo de período: **Semanal (7 días)**, **Mensual (30 días)** y **Anual (año en curso)**.
    - Métricas clave: Servicio Top 1 más demandado, total de transacciones procesadas y volumen financiero operado (Q).
    - Gráfica de barras horizontales con ranking y porcentaje: Agente Banco Industrial, Cobros de Crédito (Capital, Intereses, Mora), Ahorros (Corriente, Programado, Infantil), Plazo Fijo, Aportaciones y Desembolsos.
    - Permite al Jefe de Agencia / Supervisor tomar decisiones de liquidez, promociones y asignación de ventanillas.

13. **Libro Mensual de Arqueos para la Comisión de Vigilancia (`/arqueos/mensual`):**
    - Resuelve la auditoría mensual sin necesidad de revisar día por día.
    - Selector por mes (ej. *Agosto 2026*).
    - Sábana consolidada de todos los días operados en el mes: Saldo inicial, ingresos, egresos, saldo de libro, recuento físico contado, diferencia (cuadrado / faltante / sobrante) y cajero operador.
    - Resumen mensual: Total de días operados, % de días cuadrados, total ingresos y total egresos.
    - **Acta Mensual Imprimible (`🖨️ Imprimir Acta Mensual Consolidada`):** Formato institucional con texto legal de auditoría y 4 firmas de conformidad (**Presidente, Secretaria, Vocal I de la Comisión de Vigilancia y Receptor Pagador**).

14. **Control de Acceso y Menú Estricto por Rol (RBAC):**
    - Filtro de navegación y redirección inteligente para que cada usuario solo vea su pantalla:
      * **`CAJERO`:** Entrada directa a Auxiliar de Caja (`/auxiliar-caja`), Caja Chica y Consulta de Socios.
      * **`PROMOTOR`:** Entrada directa a Kardex de Cartera (`/promotor/cartera`), Afiliación de Socios en campo, Cuentas de Ahorro y Créditos & Simulador.
      * **`SUPERVISOR`:** Entrada directa a Tablero (`/tablero`), Gráficas de Servicios, Libro Mensual de Arqueos (`/arqueos/mensual`), Bandeja de Créditos, Kardex de Cartera, Historial de Cajas y Socios/Aportaciones.
      * **`ADMIN` / `GERENCIA`:** Acceso total a todos los módulos, Agencias y Gestión de Usuarios.

15. **Ajuste Responsivo (PC, Tablet y Móvil), Impresión y Listado de 10 Asociados Ascendente:**
    - **Gráfica de Servicios Unificada en Vivo:** Agrega y visualiza de inmediato las operaciones del sistema (Plazos Fijos, Aportaciones, Créditos desembolsados y Ventanilla), con opción de filtro por agencia o consolidado global.
    - **Listado de Asociados de 10 en 10 Ascendente:** Padrón ordenado correlativamente desde el socio No. 1 (`CHAJ-0001` en adelante) con paginación fluida.
    - **Tipografía y Diseño Adaptativo Multi-Dispositivo:**
      * **PC:** Vista completa a pantalla panorámica con barra lateral fija.
      * **Tablet y Móvil:** Barra de navegación superior con desplazamiento horizontal táctil, cuadrícula de estadísticas compacta de 2 columnas y contenedores con scroll protegido para no desbordar la pantalla.
      * **Tipografía moderna:** Fuentes geométricas y nítidas de alta legibilidad en pantallas táctiles y Retina.
    - **Optimización de Impresión Oficial (`@media print`):** Oculta automáticamente barras laterales, botones de acción y controles interactivos, ajustando el contenido al 100% de la hoja tamaño Carta con bordes negros de alta precisión para auditorías y actas.

16. **Paginación Universal de 10 en 10 en Todas las Cuentas y Filtro Dinámico Temporal de Gráficas:**
    - **Paginación estándar de 10 en 10:** Aplicada en todos los módulos de cuentas y cartera del sistema con barra de navegación (`Anterior` / `Siguiente`):
      * **Ahorro Corriente, Programado e Infanto-Juvenil** (`/ahorros/...`).
      * **Padrón de Aportaciones de Capital** (`/aportaciones`).
      * **Kardex de Plazo Fijo** (`/ahorros/plazo-fijo`) (gestión ágil de los 692 certificados).
      * **Módulo de Créditos** (`/creditos`).
      * **Kardex de Cartera del Promotor** (`/promotor/cartera`).
    - **Filtro Temporal Dinámico de la Gráfica del Supervisor (`/tablero`):**
      * Corrección del rango de fechas (`fecha >= fechaInicioSql and fecha <= current_date`) en todas las operaciones unificadas.
      * Ahora al alternar entre **Semanal**, **Mensual** y **Anual**, la gráfica actualiza en tiempo real sus volúmenes, operaciones y el ranking de demanda por servicio.

17. **Diseño Panorámico Moderno de Pantalla Completa y Eliminación de Espacios Vacíos:**
    - **Aprovechamiento Integral de Pantalla:** Se retiró el límite estrecho de 1,180px, haciendo que la aplicación utilice el 100% del ancho del monitor o laptop de forma fluida, eliminando espacios en blanco innecesarios.
    - **Tablero Ejecutivo en 2 Columnas Balanceadas (`.dashboard-grid`):**
      * **Columna Izquierda:** Cuadrícula de 7 KPIs financieros de alta densidad + Panel de accesos directos de ventanilla y campo (`💵 Ventanilla`, `📂 Kardex Cartera`, `📑 Libro Arqueos`, `👥 Padrón`, `🔒 Plazo Fijo`, `🏛️ Aportaciones`) + Desglose por agencia.
      * **Columna Derecha:** Gráfica interactiva de demanda de servicios en tiempo real alineada a la misma altura, con podio y barras de progreso en Quetzales. Toda la visión operativa se aprecia en una sola pantalla.
    - **Barra Lateral Institucional:** Emblema esmeralda `[M] MIF COOP`, indicador de operatividad `🟢 Agencia Chajul · Activa`, navegación categorizada por áreas de trabajo y tarjeta de usuario con avatar.

18. **Eliminación de Colores Claros/Brillantes y Supresión Total del Cambio de Color en Hover:**
    - **Cero cambio de color al pasar el cursor:** Se eliminó por completo el efecto hover en filas (`tbody tr:hover { background: inherit !important; }`), garantizando una navegación fija y estable sin parpadeos ni destellos claros en ningún módulo (Kardex, Plazos Fijos, Cuentas de Ahorro, Créditos, Socios, Caja).
    - **Paleta Oscura Uniforme y Descansada:** Se reemplazaron los fondos blancos deslumbrantes en tablas (`#f1f5f9`, `#f8fafc`, `rgba(248, 250, 252, ...)`) por tonos pizarra oscuros consistentes (`--paper: #0b121e`, `--paper-raised: #111a2d`, `--mono-bg: #1e293b`).
    - **Distintivos y Badges de Estado Nítidos:** Las píldoras de estado (`Activo`, `Liquidado / Pagado`, `Al Día`, `Pendiente`) ahora utilizan fondos traslúcidos oscuros con bordes suaves de color (`.badge.activo`, `.badge.inactivo`, `.badge.danger`, `.badge.info`), eliminando los recuadros blancos que contrastaban negativamente.

19. **Distribución Panorámica Equilibrada y Corrección de Espacios Vacíos en Kardex de Cartera:**
    - **Alineación Perfecta de Columnas:** Se subsanó la estructura HTML del listado donde una celda externa comprimía los 9 datos en la primera columna, desplazando los encabezados y generando vacíos gigantes a la derecha.
    - **Ocupación Total del Ancho sin Scroll Horizontal:** Las 9 columnas (`Código/Socio 16%`, `Comunidad 13%`, `Garantía/Fiador 14%`, `Plazo/Vence 10%`, `Valor Crédito 11%`, `Saldo Vivo 11%`, `Cuota Mensual 10%`, `Estado 8%`, `Acción 7%`) cubren el 100% de la pantalla de forma simétrica y limpia, sin huecos vacíos ni barras de desplazamiento innecesarias.

20. **Panel de Supervisión del Jefe de Agencia y Gráfica Segmentada por Categorías:**
    - **Segmentación Dinámica de Servicios (Drill-Down):** La gráfica del supervisor incorpora un selector de pestañas para alternar entre `🌐 Consolidado General`, `🏦 Ahorros & Plazo Fijo`, `💼 Cartera & Préstamos`, `☕ Caja Chica & Gastos` y `💵 Agente BI & Ventanilla`. Cada categoría recalcula porcentajes, barras y podios de demanda en tiempo real.
    - **Panel de Control y Auditoría de Jefatura:** Los accesos directos se ajustaron según el rol del usuario; para el Jefe de Agencia se configuraron enlaces de supervisión (`📑 Libro Arqueos`, `🤝 Aprobar Créditos`, `📂 Kardex Cartera`, `👥 Padrón Socios`, `🔒 Plazos Fijos`, `🏛️ Aportaciones`, `📊 Historial Cierres`), excluyendo operaciones de cobro en ventanilla bajo el principio de segregación de funciones.
    - **Métricas Financieras Vivas en KPIs:** El tablero principal ahora refleja los saldos consolidados reales: Cartera de Crédito activa (Q 15,210,193.13), Plazos Fijos (Q 19,897,503.72), Aportaciones de Capital (Q 11,600.00) y Socios activos (569).

21. **Botones de Reinicio del Sistema a Cero y Recarga de Datos Existentes (Excel):**
    - **⚠️ Reiniciar a Cero:** Permite vaciar todas las tablas transaccionales (socios, cuentas de ahorro, aportaciones, préstamos, contratos de plazo fijo, movimientos, comprobantes y arqueos de caja) para dejar la base de datos completamente limpia y lista para nuevas pruebas o para iniciar en producción.
    - **📥 Recargar Datos Existentes (Excel):** Ejecuta la migración automatizada de los libros originales de Excel en menos de 2 segundos, restaurando los 568 asociados, 65 préstamos de cartera viva (Q 15.2M) y 692 certificados de plazo fijo (Q 19.8M).
    - **Disponibilidad Omnipresente:** Los botones están disponibles en tres ubicaciones estratégicas:
      1. **En el Menú Lateral (Sidebar):** En una caja permanente titulada `⚙️ Control de Datos`, accesible desde cualquier pantalla del sistema sin importar el rol activo.
      2. **En el Kardex de Cartera de Préstamos (`/promotor/cartera`):** En la cabecera superior, junto al botón de nueva solicitud e imprimir.
      3. **En el Tablero Principal (`/tablero`):** En la esquina superior derecha, junto a refrescar.










## 2. Usuarios de Prueba Configurados

| Rol | Correo electrónico | Contraseña | Enfoque |
| :--- | :--- | :--- | :--- |
| **Administrador** | `admin@mif.coop` | `CambiaEsto123!` | Configuración total, agencias, usuarios y reinicio. |
| **Jefe de Agencia** | `supervisor@mif.coop` | `CambiaEsto123!` | Supervisión de agencia, aprobación de créditos y arqueos. |
| **Cajero (Operador)** | `cajero@mif.coop` | `CambiaEsto123!` | Ventanilla de caja, depósitos, retiros y caja chica. |
| **Promotor de crédito** | `promotor@mif.coop` | `CambiaEsto123!` | Campo, prospectación de socios, créditos y ahorros. |

---

## 3. Bitácora de Mejoras Recientes Implementadas

Todas las especificaciones operativas y estatutarias acordadas se encuentran documentadas en detalle en [MEJORAS_SISTEMA_MIF.md](file:///Users/galindo/Downloads/mif-app-codigo-ejecutable/MEJORAS_SISTEMA_MIF.md):

1. **Formato DPI y Detección de Duplicados en Vivo:** Estándar `xxxx-xxxxx-xxxx` con bloqueo al detectar DPIs repetidos.
2. **Teléfono con WhatsApp (+502):** Conexión directa para notificaciones de apertura de cuenta.
3. **Parentesco del Beneficiario:** Lista oficial de parentescos en ficha de socio y padrón.
4. **Aportación Inicial Estatutaria Mínima de Q 100.00:** Validación obligatoria para aperturas de cuentas de ahorro y plazo fijo.
5. **Autocompletado Inteligente y Corrección de Tildes:** Con respeto a conectores (`de`, `del`, `la`) y borrado fluido.
6. **Módulo de Ahorro sobre Préstamo (Garantía):** Línea `ASP` con retiros bloqueados ("no se toca") y cobro de cuotas mediante débito.
7. **Formulario de Créditos Optimizado:** Tipos Fiduciario e Hipotecario, tasa fija al 2.0%, Sobre Saldos, y casillas individuales para fiador.
8. **Simplificación en Ahorros:** Retiro del campo de justificación de apertura para altas inmediatas.
9. **Plazo Fijo con Rendimiento Diario Exacto:** Botones `[6%]` (para 6 meses) y `[14%]` (para 12 meses o más), cálculo día por día según calendario real (365 días), retención ISR del 10% y desglose total en pantalla.

