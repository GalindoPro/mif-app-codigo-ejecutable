# Sistema Integral MIF — Estado y Control de Desarrollo

Este documento registra el **avance real y completo** del sistema de la COOPERATIVA MAYA INVERSIONES FUTURAS R.L. "COMIF R.L.", detallando los módulos completados, la estructura operativa y las siguientes funciones en cola.

---

## 1. Estado Actual de Módulos

### ✅ Módulos Completados y Probados

1. **Autenticación y Matriz de Roles:**
   - Roles configurados: `ADMIN` (Administrador), `GERENCIA` (Gerencia), `SUPERVISOR` (Jefe de agencia), `CAJERO` (Operador de ventanilla), `CAJA_CHICA` (Operador de caja chica y ventanilla auxiliar) y `PROMOTOR` (Promotor de crédito).
   - Control de permisos en Frontend y Backend: cada rol ve exclusivamente las opciones y tarjetas que le corresponden.
   - Gestión de usuarios y asignación de personal a agencias (`/usuarios`).
   - Base de datos conectada localmente a PostgreSQL 18 (`mif_dev`, usuario `galindo`).

2. **Módulo de Socios y Padrón de Aportaciones (`/socios` y `/aportaciones`):**
   - Basado en el libro oficial `caja/APORTACIONES 31-08-26.xlsx`.
   - **Campos del asociado:** Nombres, DPI, Género (`M`/`F`), Dirección y Teléfono (el campo Edad fue eliminado globalmente a favor de utilizar la fecha de nacimiento extraída del DPI en el futuro).
   - **Datos de la persona beneficiaria:** Nombre completo, Parentesco, DPI/CUI y Teléfono.
   - **Reglas Globales de Unicidad:** Bloqueo cruzado estricto donde el DPI/CUI o teléfono de un asociado no puede repetirse en ningún otro asociado ni beneficiario, con auto-restricción para evitar que el asociado sea su propio beneficiario.
   - **Apertura automática de Aportaciones:** Creación de cuenta `CHAJUL-APOR-XXXX` para cada socio.
   - **Padrón de Aportaciones de Capital (`/aportaciones`):**
     - Métricas clave: Capital Social Total Aportado, Total de Asociados Inscritos, Aportación Promedio por Socio.
     - Tabla del padrón con filtro en tiempo real y vista imprimible (`🖨️ Imprimir`).
   - Permiso habilitado para que los **Promotores de crédito (`PROMOTOR`)** registren y actualicen asociados directamente en campo.

3. **Caja Chica (`/caja-chica`):**
   - Basado en `caja/Caja Chica 30-07-2026.xlsx`.
   - **Diseño de Pantalla Única (100vh Sin Scroll):** Arquitectura balanceada de 2 columnas. Columna izquierda con panel de gastos por categoría, barras de presupuesto y botones de acción. Columna derecha con buscador y tabla de comprobantes con cabecera fija (`sticky`) y scroll interno.
   - Registro de comprobantes de ingreso y egreso con categorías contables y documentos (DTE, factura, recibo).
   - **Trazabilidad de Roles:** Columna "Registrado Por" con insignias de rol (`[📥 Caja Chica]`, `[💵 Cajero]`, `[🛡️ Admin]`, `[👁️ Supervisor]`).
   - **Vistas Integradas en Pantalla (Sin Modales Flotantes):**
     - **Informe de Rendición de Gastos:** Conmuta directamente a pantalla completa en la misma vista (`CajaChicaReporteView`) con botón `← Volver al Libro de Caja Chica`, filtros de período rápido, exportación a Excel (CSV) y generación de PDF limpia en 1 hoja carta sin superposición de elementos de fondo.
     - **Corrección de Comprobantes para Administrador y Cajeros (✏️):** Formulario embebido directamente en el panel lateral izquierdo (reemplazando temporalmente el formulario de nuevo comprobante/reposición), habilitando al rol `GERENCIA` (Administrador) a editar comprobantes históricos con motivo de corrección de auditoría sin ventanas flotantes ni desbordes.
   - **Reposición del Fondo Fijo (`📥 Reponer Fondo (Cheque)`):**
     - Recarga oficial del saldo de caja chica mediante cheque emitido por la cooperativa (`No. CH.`, ej. *1290*, *2000*).
     - Validación anti-duplicados contra Caja Chica y Auxiliar de Caja para evitar registrar dos veces el mismo cheque.
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
   - **Diseño de Pantalla Única (100vh Sin Scroll):** Cabecera compacta de 1 sola línea con tabs integradas (`Cartera` y `Fiadores`), franja horizontal de KPIs ultra compacta con filtrado con un clic, buscador y chips rápidos en 1 línea, tabla compacta con scroll interno suave y paginación fija al fondo.
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
   - **Operativa Multirrol y Trazabilidad:**
     - Habilitado para el rol `CAJA_CHICA` en ventanilla (movimientos, cobro de cuotas, desembolsos y liquidación de plazo fijo).
     - **Control de Arqueo Diario:** El botón `🔒 Cerrar Caja del Día` y el formulario de cierre quedan ocultos y bloqueados (403 Forbidden) para `CAJA_CHICA`, reservado exclusivamente para `CAJERO`, `SUPERVISOR` y `GERENCIA`.
     - **Insignias de Rol:** Cada fila de la tabla de movimientos muestra el nombre del usuario y su rol (`[📥 Caja Chica]`, `[💵 Cajero]`, `[🛡️ Admin]`, `[👁️ Supervisor]`, `[📂 Promotor]`).
   - **Arqueo y Cierre Diario de Caja:** recuento interactivo de billetes y monedas (Q200 a Q0.01) con cálculo de diferencia (cuadrada, sobrante o faltante).
   - **Vista de Caja Cerrada y Acta Oficial de Arqueo (`🖨️ Imprimir Acta Oficial de Arqueo`):**
     - Basado en las hojas reales de auditoría `Arqueo Caja Ag Chaj...` de `Auxiliar de Caja COMIF CHAJUL 15-08-2026.xlsx`.
     - Resumen de turno finalizado: Saldo inicial, total ingresos, total egresos, saldo final del libro, total efectivo contado y diferencia de arqueo.
     - **Acta Oficial Imprimible:** Encabezado de *COOPERATIVA MAYA INVERSIONES FUTURAS R.L. "COMIF R.L."*, cuadro de recuento de billetes y monedas, texto formal de auditoría y 4 firmas institucionales de conformidad (**Receptor Pagador, Presidente, Secretaria y Vocal I de la Comisión de Vigilancia**).
   - **Historial de Días de Caja (`📅 Historial de Cajas`):**
     - Consulta cronológica de cajas diarias anteriores para supervisores y auditoría.
     - Permite inspeccionar movimientos de cualquier fecha anterior y reimprimir su Acta Oficial de Arqueo en un clic.

8. **Escudo Anti-Duplicados y Validación Cruzada en Tiempo Real:**
   - Previene el doble trabajo y los errores de digitación durante el uso de talonarios físicos de papel.
   - **Bloqueo estricto de números de recibo / documento:** validación cruzada instantánea bidireccional entre Auxiliar de Caja (`caja_movimientos_auxiliar`), Caja Chica (`caja_chica_comprobantes`), Ahorros (`movimientos`) y Créditos (`prestamo_pagos`). Si un recibo ya se usó en cualquiera de estos módulos, el sistema lo bloquea y notifica en vivo: módulo de origen, fecha, beneficiario y usuario emisor con su rol.
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
    - **Barra Lateral Institucional:** Emblema esmeralda `[M] COOP COMIF R.L.`, indicador de operatividad `🟢 Agencia Chajul · Activa`, navegación categorizada por áreas de trabajo y tarjeta de usuario con avatar.

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
      3. **En el Tablero Principal (`/tablero`):** Agrupados en el menú desplegable `⚙️ Opciones del Sistema ▾`, optimizando el espacio vertical de la cabecera.

22. **Rediseño del Tablero en Una Sola Pantalla (100vh), Tiempo Real Automático (10s) y Adaptabilidad Total:**
    - **Visualización en Una Sola Pantalla en PC (100vh):**
      * **Banda Superior de 8 KPIs:** Estructura en 4 columnas x 2 filas compactas (*Caja Chica, Ahorro Corriente, Ahorro Programado, Ahorro Infantil, Ahorro Plazo Fijo, Aportaciones Capital, Socios Activos y Cartera de Crédito*).
      * **Cifras Monetarias Continuas:** Resuelto el problema de desbordamiento mediante `white-space: nowrap` y tipografía adaptable `clamp()`, impidiendo que montos grandes (ej. `Q 2,657,460.40`) quiebren decimales en líneas separadas.
      * **Dos Columnas Inferiores Balanceadas:** Columna Izquierda (Supervisión/Accesos según rol + Desglose de agencias) y Columna Derecha (Monitoreo Estratégico de Servicios con scroll interno acotado a 200px).
      * **Cero Desperdicio de Espacio:** Aprovechamiento total del ancho y balanceo simétrico de alturas en desktop sin barra de scroll vertical forzada.
    - **Actualización Continua en Tiempo Real (10s):**
      * **Eliminación del Botón Manual `🔄 Actualizar`:** La cabecera se mantiene limpia y despejada.
      * **Sincronización Automática Silenciosa:** Consulta periódica en segundo plano cada 10 segundos tanto del resumen financiero como de la analítica de servicios.
      * **Refresco Inmediato por Visibilidad:** Actualización al instante cuando el usuario vuelve a enfocar la pestaña del navegador (`focus` / `visibilitychange`).
      * **Insignia Animada:** `● En Vivo · En Tiempo Real` con animación de pulso verde que garantiza la conexión activa.
    - **Menú Desplegable `⚙️ Opciones del Sistema ▾`:**
      * Botones administrativos (`📥 Recargar Excel` y `⚠️ Reiniciar a Cero`) agrupados con modal de confirmación, reduciendo la altura de cabecera.
    - **Responsividad Integral:**
      * **Escritorio (PC):** Vista completa en 1 pantalla (100vh).
      * **Tablet (768px - 1024px):** Cuadrícula fluida de 2 columnas para KPIs y reorganización táctil de paneles.
      * **Móvil (375px - 640px):** Cuadrícula de 2 columnas para tarjetas financieras y apilamiento vertical natural con navegación táctil fluida.
23. **Optimización del Libro Mensual de Arqueos (`/arqueos/mensual`) y Ocupación del 100% de Pantalla:**
    - **Supresión de Vacíos Laterales:** Eliminada la restricción fija de 1,050px, haciendo que el acta oficial, sábana de cierres y firmas aprovechen el 100% del ancho del monitor.
    - **Panel Desplegable de Parámetros Notariales:** Barra superior compacta (~36px) con resumen de parámetros y botón de conmutación `▼ Modificar Datos y Firmantes`, dejando el acta completamente a la vista sin scroll forzado.
    - **Cintillo y Firmas Adaptables:** Franja de indicadores con `auto-fit` y bloque de firmas que fluye a 2 columnas en dispositivos táctiles y a 4 columnas simétricas en PC.

24. **Optimización Global de Pantallas al 100% de Ancho y Nuevas Vistas Administrativas (`/alertas`, `/sesiones`, `/auditoria`):**
    - **Aprovechamiento Integral de Pantalla:** Eliminación de limitaciones rígidas (`maxWidth: 480px`, `560px`, `580px`, `640px`) en formularios y cuadrículas en todos los módulos operativos y administrativos.
    - **Métricas Fluidas (`1fr`):** Cintillos de tarjetas adaptables con `repeat(auto-fit, minmax(200px, 1fr))` que garantizan la ocupación del 100% del monitor sin huecos negros en PC, tablets ni teléfonos.
    - **Panel de Alertas del Sistema (`/alertas`):** Diagnóstico en vivo de créditos en mora, cajas auxiliares desfasadas, certificados a plazo fijo por vencer (≤ 15 días), alerta de saldo bajo en caja chica y socios con expediente incompleto, con enlaces directos para resolver en cada módulo.
    - **Control de Sesiones y Accesos Activos (`/sesiones`):** Monitoreo en tiempo real de colaboradores habilitados, última operación auditada, roles y agencias conectadas.
    - **Bitácora de Auditoría Conectada (`/auditoria`):** Backend activado con paginación, filtros multicriterio y visualización de cambios JSON.










25. **Modernización Global de Submenús, Botones Fintech Pro y Modales Responsivos (100vh Multi-Dispositivo):**
    - **Botones Fintech Pro con Micro-Interacciones:** Gradientes esmeralda y carmesí con elevación suave (`translateY(-1px)`), sombras perimetrales difusas y feedback táctil activo (`scale(0.98)`).
    - **Modales con Glassmorphism Blur (`backdrop-filter: blur(8px)`):** Ventanas emergentes de acción y arqueo con aislamiento visual elegante, cabecera y pie de acciones fijos, y scroll interno que nunca desborda la pantalla en PC (`max-height: 88vh`).
    - **Adaptación Responsiva en Teléfonos Móviles y Tabletas:**
      * **Móvil (< 768px):** Modales convertidos en Bottom-Sheets ergonómicos con bordes redondeados superiores (`18px 18px 0 0`) y `max-height: 94vh`.
      * **Tabletas (768px - 1024px):** Menú lateral táctil deslizable con fondo ejecutivo `#070738` y paneles de 2 columnas.
      * **PC / Laptops (> 1024px):** Icon-rail colapsable con tooltips universales flotantes de alto contraste y visión 100vh sin scroll de ventana.

26. **Emisión e Impresión Oficial del Libro de Movimientos y Cuadre de Caja Auxiliar:**
    - **Comprobante de Caja Oficial (1-2 Hojas Carta):** Membrete COMIF R.L., Cuadro de Saldo Inicial, (+) Total Ingresos, (-) Total Egresos y (=) Saldo Final, Consolidado de Fuentes de Fondos (COMIF Propios, FEDERURAL, CHN), tabla cronológica de transacciones y doble firma de auditoría/arqueo (Cajero Responsable y Supervisor).
    - **Filtros Temporales Dinámicos:** Selector rápido para Turno Activo, Hoy, Esta Semana, Este Mes y Rango Personalizado con exportación a Excel (CSV).
    - **Disponibilidad:** Botón `🖨️ Imprimir Libro` en la tabla activa de `CajaAbierta.tsx`, cabecera de `AuxiliarCaja.tsx` y en cada día del `HistorialCajasModal.tsx`.

27. **Suite Panorámica de Inteligencia y Analítica Estratégica en Dashboard:**
    - **Eliminación de Redundancia:** Sustitución de la tarjeta repetitiva de botones por un centro de inteligencia de ancho completo (100% útil).
    - **Visualización en 3 Columnas Responsivas:** (1) Dona de distribución de transacciones, (2) Barras horizontales de volumen monetario en Quetzales, y (3) Ranking de demanda con insignias (`#1, #2, #3`) y barras de progreso visuales.
    - **Filtros Dinámicos:** Selección por agencia, períodos temporales (`Día`, `Semana`, `Mes`, `Año`) y chips por tipo de servicio.

28. **Inteligencia y Analítica Financiera Específica por Cuenta y Tendencia Temporal:**
    - **Selector Granular por Cuenta / Producto:** Filtros dedicados para Ahorro Corriente, Programado, Infantil, Ahorro s/Préstamo, Plazo Fijo, Aportaciones, Créditos, Agente BI, Caja Chica y Tesorería/Ventanilla.
    - **Balance Específico de Entradas vs Salidas:** Métricas en vivo de total captado (Depósitos), total colocado/retirado (Egresos), y Flujo Neto (`+ / - Q`).
    - **Conmutador de Vista Dual:** Modo Balance & Distribución (Donut + Barras comparativas Verde/Rojo + Ranking) y Modo Tendencia Temporal (Área cronológica Recharts con gradientes de captación vs retiros).

29. **Normalización Visual Porcentual (1-100%) y Tooltips en Quetzales Exactos:**
    - **Escala Proporcional (0% - 100%):** Gráfica de barras horizontales normalizada para que operaciones de menor cuantía no se reduzcan a líneas invisibles ante movimientos grandes.
    - **Tooltips Glassmorphism Flotantes:** Muestran el monto exacto en Quetzales (`Q`), el porcentaje de volumen (`%`), las transacciones y la naturaleza (`🟢 Entrada` o `🔴 Salida`) al pasar el cursor.

30. **Integración Integral de Aportaciones de Capital y Aperturas de Cuentas:**
    - **Captura de Aportaciones Estatutarias:** Inclusión automática de los `Q 2,100.00` de aportaciones de los 21 socios y depósitos iniciales de cuentas en la analítica financiera.
    - **Filtro Anti-Duplicidad:** Exclusión inteligente de registros duplicados entre movimientos y auxiliar de caja.





## 2. Usuarios de Prueba Configurados

| Rol | Correo electrónico | Contraseña | Enfoque |
| :--- | :--- | :--- | :--- |
| **Administrador / Gerencia** | `admin@mif.coop` | `CambiaEsto123!` | Configuración total, agencias, usuarios y reinicio. |
| **Jefe de Agencia / Supervisor** | `supervisor@mif.coop` | `CambiaEsto123!` | Supervisión de agencia, aprobación de créditos y arqueos. |
| **Cajero (Operador)** | `cajero@mif.coop` | `CambiaEsto123!` | Ventanilla de caja, depósitos, retiros y cobros. |
| **Caja Chica** | `cajachica@mif.coop` | `CambiaEsto123!` | Libro de caja chica, gastos operativos y ventanilla auxiliar. |
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
10. **Informe y Rendición de Gastos de Caja Chica:** Botón `📄 Informe de Gastos` con filtros (Hoy, Esta semana, Este mes, Desde última reposición), detalle cronológico de gastos, subtotales con barras porcentuales por categoría, cheques de reposición diferenciados en verde, cuadre de caja y formato oficial imprimible con firmas.
11. **Impresión Oficial de Kardex de Cartera (Horizontal / Landscape):** Formato carta horizontal con cintillo de resumen de 1 fila, inicio inmediato de tabla en la primera página sin cortes de columnas, listado completo de cartera y firmas de auditoría.
12. **Acta Notarial y Estatutaria de Arqueo Mensual de Caja:** Estructura oficial para la Comisión de Vigilancia por puntos de agenda (Apertura, Revisión de Sábana de Cierres con cálculo al 100% de efectividad, Dictamen de Auditoría y Cierre formal), panel de configuración de directivos, exportación a Excel y 4 firmas institucionales.
13. **Flujo de Aportación Inicial para Socios con 0 Cuentas y Acciones Rápidas:** Alerta estatutaria en la Ficha del Socio con botón directo `➕ Aperturar Aportación (Q 100.00)`, panel de accesos directos para abrir cualquier producto (`+ Ahorro Corriente`, `+ Programado`, `+ Infanto Juvenil`, `+ Plazo Fijo`, `+ Crédito`) y botón de apertura en 1 clic dentro de los formularios de ahorro e inversión.
14. **Aprobación Automática y Acciones Rápidas para el Jefe de Agencia en Créditos:** Aprobación inmediata al crear créditos para dejarlos listos para entrega de fondos, columna de acciones rápidas en la tabla principal (`💵 Desembolsar` en 1 clic, `💰 Cobrar` en caja, `Finalizar / Liquidar`, `✓ Aprobar` y `✕ Rechazar`) y chips de filtrado directo por estado.
15. **Menú Lateral Ejecutivo y Segregación de Funciones para el Jefe de Agencia:** Ocultamiento total del bloque destructivo `Control de Datos` (exclusivo para Sistemas/Admin) y estructuración en 3 bloques ejecutivos claros (Supervisión y Control, Cartera y Créditos, Padrón y Captaciones).
16. **Espaciadora Inteligente y No Invasiva en Autocompletado:** La barra espaciadora solo aplica tildes y capitaliza, eliminando la sustitución invasiva por palabras más largas (ej. `rosa` nunca se convierte en `Rosales`) y permitiendo autocompletar con `[Tab]` o clic.
17. **Liquidación Diaria de Créditos, Mora tras 4 Días de Gracia y Abonos Extraordinarios a Capital:** Liquidación exacta de intereses por días transcurridos (`Saldo × 24% / 365 × días`), recargo fijo de Q 25.00 a partir del 5to día de atraso (tras 4 días de gracia), y asignación automática de todo pago excedente directo a amortizar el Capital.
18. **Arquitectura 100vh (Sin Scroll de Ventana) Completada en Todos los Módulos:** `AportacionesList.tsx`, `AhorroList.tsx`, `PlazoFijoList.tsx`, `AuxiliarCaja.tsx`, `CajaAbierta.tsx`, `CajaCerradaCard.tsx`, `CajaChica.tsx`, `CreditosList.tsx`, `KardexCarteraPromotor.tsx`, `SociosList.tsx`. Todas las pantallas del sistema utilizan `.screen-container` de altura exacta, `.screen-kpi-tile` horizontal, `.screen-split-layout`, `.table-scroll-container` (sticky header, scroll interno) y `.screen-footer` (paginación fija al pie). Fix de ADMIN/GERENCIA: `agenciaId` null auto-selecciona la primera agencia disponible al cargar `AuxiliarCaja`. Clases CSS nuevas en `app.css`: `.screen-kpi-tile`, `.screen-kpi-label`, `.screen-kpi-value`, `.screen-kpi-sub`.
32. **Sistema de Edición Operativa con Registro de Motivos (Auditoría):** Permite a roles operativos (`CAJERO`, `CAJA_CHICA`) corregir equivocaciones de digitación en sus propios registros únicamente durante el transcurso del mismo día en el que los crearon. Todo cambio operativo requiere obligatoriamente una explicación detallada en el campo `motivo` de la tabla `auditoria`. Modales `CajaChicaEditModal` y `AuxiliarCajaEditModal` implementados. La Bitácora de Auditoría fue actualizada para mostrar el motivo de la corrección junto con los datos anteriores y nuevos.
38. **Habilitación de Auxiliar de Caja para Caja Chica con Control de Cierre y Validación Cruzada:** Permite al rol `CAJA_CHICA` operar ventanilla en Auxiliar de Caja con bloqueo del botón de arqueo diario (`403 Forbidden`), trazabilidad con insignias de rol en tablas y validación debounced cruzada en tiempo real contra duplicados entre Auxiliar de Caja y Caja Chica.
39. **Infraestructura Cloud de Producción (Supabase + Vercel + Render/Railway):** Soporte de SSL dinámico en PostgreSQL pool para conexiones a Supabase, CORS compatible con `*.vercel.app`, configuración de rutas SPA en `frontend/vercel.json` y blueprint `render.yaml` para despliegue automatizado del backend.
40. **Migración y Aprovisionamiento Exitoso de Base de Datos en Supabase (PostgreSQL Cloud):** Esquema relacional de 15 tablas creado y probado en Supabase con resolución de claves foráneas diferidas e idempotentes, ampliación del enum de roles (`CAJA_CHICA`) y datos iniciales aprovisionados (Agencia Chajul y los 5 usuarios estándar).
41. **Orden Descendente Global (`DESC`) y Extracción de Errores Backend:** Listados ordenados de forma descendente en todos los módulos (`socios`, `prestamos`, `cajaauxiliar`, `cajachica`, `cobroscampo`, `alertas`) y optimización del cliente Axios (`api.ts`) para mostrar errores de conflicto `409` descriptivos.
42. **Depósitos en Efectivo vs Cheque con Boleta/Recibo, Selección de Banco y Traslado Automático en Auxiliar de Caja:** Opción de registrar depósitos con cheque o efectivo en todas las cuentas de ahorro/aportaciones, selector de banco emisor (Banrural, Industrial, CHN, etc.) y transición automática al formulario de Egreso Propio (Traslado de fondos) con beneficiario estandarizado para cuadre exacto de gaveta.
43. **Arqueo Físico y Cierre de Caja a Pantalla Completa con 2 Decimales Completos:** Cuadrícula de billetes y monedas balanceada al 100% de ancho útil, inputs ágiles y tarjetas resumen de Total Contado, Saldo Esperado y Diferencia con 2 decimales exactos sin truncamiento con puntos suspensivos.
44. **Modernización Fintech Global de Dashboards en 1 Sola Pantalla (100vh):** Transformación integral módulo por módulo (`Tablero`, `AuxiliarCaja/CajaAbierta`, `CreditosList`, `AhorroList`, `PlazoFijoList`, `AportacionesList`, `CajaChica`, `SociosList`, `Usuarios`, `Agencias`, `Sesiones`, `Auditoria`, `Alertas`) con cintillos KPI de borde de color temático, búsqueda rápida en vivo, tablas compactas con cabecera pegajosa, y eliminación completa de espacios vacíos y scrolls externos.
45. **Arquitectura Global de Impresión de Comprobantes y Reportes Modales:** Corrección en `@media print` de `app.css` eliminando el ocultamiento del nodo `#root` y `.modal` que generaba páginas en blanco. Sincronización automática de modales a documento continuo (`display: block`, `position: static`, `overflow: visible`, fondo `#ffffff`, texto nítido `#000000`, tablas `7.5pt` y protección contra saltos indebidos de página `break-inside: avoid` en firmas).
46. **Habilitación Universal de Emisión de Actas de Arqueo Mensual (Comisión de Vigilancia):** Desbloqueo permanente de los botones `🖨️ Imprimir Acta Oficial` y `📥 Excel (CSV)` en cualquier mes seleccionado (`LibroArqueoMensual.tsx`), renderizado formal de la tabla con fila notarial para períodos con 0 operaciones y auto-selección inicial de agencia activa para roles `GERENCIA_GENERAL` y `ADMIN`.
47. **Estandarización Contable de la Sábana de Cierres:** Saldo Libro dinámico calculado como `Saldo Inicial + Total Ingresos - Total Egresos`, columna añadida de `Flujo Neto (±)` e insignias contextuales de estado de turno (`⏳ En Turno` vs `✓ Cuadrado`).
48. **Cuadre Contable y Corrección de Saldo Final en Comprobante de Libro de Caja:** Corrección en backend `service.ts` y `LibroCajaReporteModal.tsx` para proyectar el Saldo Final real acumulado (`Q 336,034.60`) tanto en la tarjeta superior 4 como en el pie de tabla consolidado al cierre de la fila 19, evitando repeticiones del saldo inicial o de la primera fila.
49. **Impresión Oficial de Padrones y Listados Completos sin Cortes de Paginación:** Implementación del patrón de reporte `.print-only` en `AportacionesList.tsx` y `KardexCarteraPromotor.tsx`, permitiendo que la navegación web se mantenga ágil con paginación de 10 por página mientras que la impresión en papel o PDF genera el documento institucional continuo con la totalidad de registros (ej. los 21 asociados de aportaciones o todos los préstamos), membrete oficial, totales consolidados y firmas de legalización.
50. **Estandarización Global de Identidad Institucional (`COMIF-R.L.`):** Eliminación total de la denominación no oficial *"Asociación Integral Chajulense Va'l Vaq Quyol"* y sustitución completa del acrónimo genérico *"MIF"* por la razón social e identidad oficial **`COOPERATIVA MAYA INVERSIONES FUTURAS R.L. "COMIF-R.L."`** y **`COMIF-R.L.`** en toda la plataforma (membrates impresos, pagarés, contratos de crédito, comprobantes de caja, informes de caja chica, acta notarial mensual de arqueos, títulos de la app, manifiesto PWA y carpetas de respaldo en la nube).
51. **Emisión e Impresión de Padrones Oficiales en Todas las Cuentas de Captación:** Incorporación del botón `🖨️ Imprimir Padrón` y del reporte oficial unificado `.print-only` en todos los tipos de ahorro (`Ahorro Corriente`, `Programado`, `Infanto Juvenil`, `Sobre Préstamo`) y en `Plazo Fijo DPF`. Mantiene la visibilidad ejecutiva en el Tablero Global (cifras en Quetzales y conteo de cuentas/asociados) permitiendo a la vez generar reportes impresos completos con membrete `COMIF-R.L.`, totales acumulados y firmas de auditoría/fiscalización.
52. **Cálculo Automático de Edad y Validación Estatutaria (< 18 años) en Cuentas Infanto Juveniles:** Al ingresar la fecha de nacimiento del menor titular en `AhorroCuentaForm.tsx`, el sistema calcula en tiempo real los años cumplidos mediante `calcularEdad` en `formatters.ts`. Despliega distintivos interactivos de aprobación (`🎂 Edad calculada: X años`) o alerta roja de rechazo (`🚫 Titular mayor de edad`), inhabilitando el botón de envío y blindando la creación en el backend (`cuentas/service.ts`) para garantizar que las cuentas juveniles sean 100% exclusivas para menores de edad.
53. **Correlativo Mensual de Operaciones BI y Reportes por Flujo con Segregación de Roles:** En ventanilla de caja (`NuevoMovimientoForm.tsx`), las operaciones de corresponsalía bancaria (Ingreso/Egreso BI) cuentan con un correlativo mensual automático (ej. `BI-2026-06-001`) que reinicia obligatoriamente en 1 al comenzar cada mes natural. En el Comprobante del Libro de Caja (`LibroCajaReporteModal.tsx`) se integran filtros por flujo (`📋 Todos`, `🏛️ Operaciones Propias`, `🏦 Corresponsalía BI`, `📥 Ingresos`, `📤 Egresos`) con recálculo de saldos y encabezados adaptables para impresión y exportación a Excel, manteniendo los períodos extendidos restringidos para roles de supervisión (`GERENCIA`, `ADMIN`, `SUPERVISOR`).
54. **Optimización de Rendimiento, Consultas Paralelas y Eliminación de Congelamiento:** Optimización del backend (`dashboard/service.ts`) pasando de 9 consultas SQL secuenciales a paralelización simultánea con `Promise.all`, ajuste fino del Transaction Pooler de Supabase (`pool.ts`) a 10 conexiones máximas y guardas anti-bloqueo `cargandoRef` en `Tablero.tsx` con polling inteligente a 30s para eliminar esperas y congelamientos de interfaz.



