# Bitácora de Mejoras y Actualizaciones — Sistema MIF COOP

Este documento recopila de forma detallada todas las mejoras funcionales, reglas de negocio, formatos guatemaltecos y optimizaciones contables implementadas en el sistema.

---

## 1. Orden y Reestructuración del Formulario de Asociados (`SocioForm.tsx`)
- **Fila 1:** No. de asociado (y Agencia responsable).
- **Fila 2:** Nombres completos del socio (con autocompletado y capitalización inteligente).
- **Fila 3:** Género (M / F) y **DPI del asociado** (`xxxx-xxxxx-xxxx`).
- **Fila 4:** **Edad (años)** (ingreso numérico manual ágil) y **Fecha de ingreso**.
- **Fila 5:** **Teléfono (WhatsApp)** con prefijo visible `+502` y formato `xxxx-xxxx`.
- **Fila 6:** Dirección / Comunidad (con capitalización inicial).
- **Sección Beneficiario:** DPI del beneficiario (`xxxx-xxxxx-xxxx`), Teléfono (`+502`), Nombre completo y **Parentesco / Relación**.

---

## 2. Validación y Detección de DPI Duplicado (13 Dígitos)
- **Máscara Automática:** Formatea en tiempo real a `xxxx-xxxxx-xxxx`. Solo admite números.
- **Detección de Duplicados en Vivo:**
  - Al completar los 13 dígitos, el backend consulta si el DPI ya existe.
  - Si ya está registrado: Muestra advertencia en rojo `⚠️ Ya registrado para: [NOMBRE] ([NO. ASOCIADO])` y **bloquea el guardado**.
  - Si está disponible: Muestra confirmación verde `✓ DPI válido y disponible (13 dígitos)`.

---

## 3. Teléfono con Estándar WhatsApp (+502)
- Prefijo integrado `+502` con 8 dígitos locales (`xxxx-xxxx`).
- Enlace directo a WhatsApp en el detalle del socio (`SocioDetail.tsx`) para contactar con un solo clic.

---

## 4. Selector de Parentesco del Beneficiario
- Lista desplegable con opciones oficiales:
  `Cónyuge / Esposo(a)`, `Hijo(a)`, `Padre / Madre`, `Hermano(a)`, `Abuelo(a)`, `Nieto(a)`, `Tío(a)`, `Primo(a)`, `Sobrino(a)`, `Suegro(a)`, `Yerno / Nuera`, `Amigo(a)`, `Otro`.
- Se almacena en la columna `parentesco_beneficiario` de la tabla `socios` y se visualiza tanto en la ficha del socio como en el padrón de aportaciones.

---

## 5. Aportación Inicial Estatutaria (Mínimo Q 100.00 Obligatorio)
- **Problema previo:** Las aportaciones se inicializaban en cero (0.00).
- **Regla Cooperativa Implementada:**
  - En el formulario de nuevo socio se incluye la sección **Aportación Inicial Estatutaria** con un monto mínimo de Q 100.00 y No. de boleta/recibo de pago.
  - Se valida a nivel de backend que ningún socio pueda abrir cuentas de Ahorro Corriente, Programado, Infantil o Plazo Fijo si tiene menos de Q 100.00 de aportación activa.
  - En los formularios de apertura se incluye un banner de verificación en tiempo real del saldo de aportación.

---

## 6. Capitalización Inteligente y Autocompletado de Nombres
- **Nombres Propios (Title Case):** Cada palabra empieza automáticamente en mayúscula (`Juan Carlos Pérez`).
- **Respeto a Conectores:** Palabras como `de`, `del`, `la`, `los`, `las`, `y` no son alteradas ni forzadas a nombres (ej. `Juan Escobar del Barrio`, `Rosa de Canay`).
- **Corrección de Tildes:** Palabras como `tomas`, `sanchez`, `perez` se corrigen con su tilde al presionar espacio (`Tomás`, `Sánchez`, `Pérez`).
- **Borrado Fluido:** El usuario puede borrar letra por letra o palabras enteras sin que el sistema se trabe.

---

## 7. Módulo de Ahorro sobre Préstamo (Garantía de Crédito)
- Tipo de cuenta `AHORRO_SOBRE_PRESTAMO` con correlativo `CHAJUL-ASP-xxxx`.
- **Regla de Bloqueo ("No se toca"):** Mientras el crédito asociado esté activo (`SOLICITUD`, `APROBADO`, `DESEMBOLSADO`), los retiros en ventanilla están 100% bloqueados. Se libera automáticamente al quedar `CANCELADO`.
- **Cobro de Cuota con Débito a Ahorro:** En Ventanilla de Caja se permite cobrar cuotas atrasadas debitando directamente de la cuenta de Ahorro sobre Préstamo.
- **Apertura Automática:** Al solicitar un crédito nuevo, se incluye la casilla marcada por defecto para crear la cuenta de garantía vinculada.

---

## 8. Optimización del Formulario de Solicitud de Crédito (`/creditos/nuevo`)
- **Tipo de Crédito:** Opciones oficiales: **Fiduciario** e **Hipotecario**.
- **Tasa Fija al 2.0% mensual:** Bloqueada en modo de solo lectura.
- **Amortización:** Fijada exclusivamente en **Sobre saldos (Capital constante)**.
- **Casillas Individuales del Fiador:**
  - Nombre completo del fiador.
  - No. de DPI del fiador (13 dígitos formateados).
  - Teléfono del fiador (`+502` y 8 dígitos).
  - Lugar / Comunidad o Trabajo del fiador.
- **Garantía Hipotecaria Dinámica:** Descripción del bien, No. de Finca/Folio/Libro y Ubicación.
- **Eliminación de Observaciones:** Se eliminó el campo de texto libre redundante.

---

## 9. Simplificación de Apertura de Cuentas de Ahorro (`/ahorros/.../nueva`)
- Se eliminó el campo innecesario **"Justificación de apertura en campo"** para permitir aperturas ágiles en segundos.
- La etiqueta de cuota se precisó como **"Cuota mensual acordada (Q)"**.

---

## 10. Certificados a Plazo Fijo con Cálculo por Días Calendario Reales (`/ahorros/plazo-fijo/nuevo`)
- **Plazo Flexible:** Permite ingresar cualquier número de meses (ej. 6, 12, 14, 20 meses).
- **Botones Directos:** `[6%]` y `[14%]`.
  - Al pulsar `[6%]`: se asignan **6 meses** y tasa del **6.0%**.
  - Al pulsar `[14%]`: se asignan **12 meses** y tasa del **14.0%**.
- **Tasa Automática:** Cualquier plazo mayor o igual a 12 meses aplica automáticamente la tasa del **14.0%**.
- **Eliminación de la Palabra "Anual":** Se muestra simplemente como **Tasa de interés** (`6.0%` o `14.0%`) para concordar con los plazos en meses.
- **Retención ISR al 10.0% Bloqueada:** Cumplimiento tributario guatemalteco de ley.
- **Cálculo Diario Exacto por Días Calendario Reales:**
  - Respeta los días reales de cada mes (meses de 31, 30 y febrero de 28/29 días).
  - Ejemplo: del 20 de agosto al 20 de febrero = **184 días exactos**.
  - Fórmula: $\text{Interés} = \text{Monto} \times \left(\frac{\text{Tasa}}{100}\right) \times \left(\frac{\text{Días Exactos}}{365}\right)$.
- **Transparencia Total en Pantalla:**
  - Tarjeta de **Días Exactos de Inversión** (ej. 184 días o 365 días).
  - Fecha exacta de vencimiento.
  - Interés bruto devengado.
  - Retención ISR (10%).
  - Interés neto que cobrará el asociado.
  - Saldo líquido total (Capital + Interés neto).
  - Resumen del Certificado redactado automáticamente.

---

## 11. Módulo de Informe y Rendición de Gastos de Caja Chica (`/caja-chica`)
- **Acceso:** Botón **`📄 Informe de Gastos`** en la barra principal.
- **Filtros de Período Inteligentes:**
  - `📅 Hoy` (comprobantes del día).
  - `📆 Esta Semana` (gastos de la semana en curso).
  - `📊 Este Mes` (gastos del mes calendario).
  - `🔄 Desde última reposición` (audita el ciclo desde el último cheque `No. CH.` hasta agotar el fondo).
  - `Rango personalizado` y filtro por categoría de gasto.
- **Estructura Ultracompacta en 1 Sola Hoja Carta (Impresión y PDF):**
  - **Ocultamiento de fondo:** Se eliminaron las páginas sobrantes de la pantalla base mediante `.no-print`.
  - **Cintillo Ejecutivo:** Resumen en 1 sola fila con Gastos Justificados, Reposiciones, Efectivo en Caja y Monto a Reponer.
  - **Detalle de Gastos:** Tabla compacta con tipografía ajustada para optimizar el espacio vertical.
  - **Columnas Paralelas (Lado a Lado):** Subtotales por categoría a la izquierda y Cheques de Reposición con Cuadre Matemático a la derecha.
  - **Bloque de Firmas Oficiales:** Líneas de firma condensadas para *Elaborado por (Cajero)*, *Revisado por (Jefe de Agencia)* y *Aprobado por (Gerencia General)*.
- **Acciones de Exportación:**
  - `🖨️ Imprimir / Guardar PDF` (ajustado para caber exactamente en 1 hoja carta).
  - `📥 Exportar Excel (CSV)` con codificación UTF-8 compatible con Microsoft Excel.

---

## 12. Optimización de Impresión Oficial del Kardex de Cartera (`/promotor/cartera`)
- **Orientación Horizontal (`landscape`):** Ajustado a hoja carta horizontal con márgenes de `0.6cm`, garantizando que todas las 11 columnas financieras quepan al 100% sin cortes en los bordes.
- **Cintillo Ejecutivo Superior (1 Sola Fila):** Reemplaza las tarjetas voluminosas de la pantalla por un cintillo compacto que agrupa:
  - Cartera Activa Viva (Monto y cantidad)
  - Préstamos Hipotecarios y Fiduciarios
  - Total Cobrado en el Mes
  - Socios al Día y Pendientes
- **Aprovechamiento Vertical Inmediato:** La tabla comienza en la parte superior de la Página 1 inmediatamente debajo del cintillo.
- **Listado Completo Auditado:** Muestra todos los créditos filtrados en papel con totales consolidados al pie de la tabla.
- **Bloque de Firmas Oficiales:** Espacio para *Elaborado por (Promotor / Oficial de Cartera)*, *Revisado por (Jefe de Agencia)* y *Aprobado por (Gerencia General / Consejo)*.

---

## 13. Formato Notarial y Estatutario del Acta de Arqueo Mensual (`/arqueos/mensual`)
- **Estructura Notarial por Puntos de Agenda:**
  - **Encabezado:** Nombre cooperativo oficial, Agencia y Correlativo (`ACTA NÚMERO: CV-MM-AAAA`).
  - **PUNTO PRIMERO (Apertura y Quórum):** Municipio, fecha, hora de apertura, comparecencia formal de la Comisión de Vigilancia y el Receptor Pagador.
  - **PUNTO SEGUNDO (Revisión de Sábana y Cierres):** Cintillo ejecutivo con cálculo corregido de efectividad de cuadre (100%), ingresos, egresos y sábana cronológica de días operados con fila de totales.
  - **PUNTO TERCERO (Hallazgos y Dictamen de Auditoría):** Cláusula de dictamen editable para que la Comisión registre observaciones oficiales.
  - **PUNTO CUARTO (Cierre y Ratificación):** Hora de conclusión y ratificación legal.
  - **Bloque de 4 Firmas con Nombres Reales:** Presidente, Secretaria, Vocal I y Receptor Pagador.
- **Panel de Opciones y Personalización:**
  - Configuración de No. de Acta, Municipio, Horas de sesión y Nombres reales de los integrantes.
  - Botón **`📥 Excel (CSV)`** para descargar la sábana mensual en formato CSV.
  - Botón **`🖨️ Imprimir Acta Oficial`** para imprimir el acta lista para firmas físicas.

---

## 14. Flujo de Aportación Inicial Estatutaria y Acciones Rápidas para Socios con 0 Cuentas (`/socios/:id`)
- **Regla Cooperativa Estatutaria:** Todo asociado debe contar con su Aportación Inicial mínima de Q 100.00 para tener derecho a voz, voto y apertura de cualquier línea de ahorro o crédito.
- **Aviso Dinámico y Botón de Apertura Rápida:**
  - En la Ficha del Socio (`SocioDetail.tsx`), si el socio tiene 0 cuentas o no tiene Aportación, se despliega un banner de alerta con el botón **`➕ Aperturar Aportación Inicial (Q 100.00)`**.
  - Modal rápido para registrar el monto y número de comprobante, creando de inmediato la cuenta oficial (`CHAJUL-APOR-XXXXX`).
- **Panel de Acciones Rápidas:** Botones directos en la ficha para aperturar `+ Ahorro Corriente`, `+ Ahorro Programado`, `+ Infanto Juvenil`, `+ Plazo Fijo` y `+ Solicitar Crédito`, precargando automáticamente los datos del socio.
- **Asistente en Formularios de Ahorro y Plazo Fijo:**
  - Si se selecciona un socio con saldo de aportación insuficiente (< Q 100), el formulario ofrece el botón **`➕ Aperturar Aportación (Q 100) Ahora`** para habilitar la cuenta en 1 solo paso sin salir del formulario.

---

## 15. Aprobación Automática y Acciones Rápidas para el Jefe de Agencia en Créditos (`/creditos`)
- **Aprobación Automática al Crear Créditos:** Al ingresar una nueva solicitud, el sistema la establece inmediatamente en estado `APROBADO` con fecha de aprobación y saldo de capital asignado, dejándola lista para desembolsar.
- **Acciones Rápidas con 1 Clic en la Tabla:**
  - **`💵 Desembolsar`**: Para créditos aprobados, abre confirmación y desembolsa al instante, sumándolo a la Cartera Activa.
  - **`💰 Cobrar`**: Acceso directo para registrar cobro de cuota en Caja Auxiliar.
  - **`Finalizar`**: Para liquidar o cancelar créditos totalmente pagados.
  - **`✓ Aprobar` y `✕ Rechazar`**: Para solicitudes pendientes.
- **Chips de Filtrado Directo:** `Todos`, `Listos para Desembolso`, `Desembolsados` y `Cancelados / Pagados`.

---

## 16. Optimización del Menú Lateral y Segregación de Funciones para el Jefe de Agencia (`Layout.tsx`)
- **Segregación de Funciones de Control Interno:**
  - Se eliminó el bloque **`⚙️ Control de Datos`** (`📥 Recargar Excel` y `⚠️ Reiniciar a Cero`) del perfil del Jefe de Agencia (`SUPERVISOR`), restringiéndolo exclusivamente al usuario **`ADMIN` (Sistemas)** para garantizar la integridad y seguridad de la base de datos oficial.
- **Menú Ejecutivo de 3 Secciones Claras:**
  - **Supervisión y Control:** `📊 Tablero & Analítica`, `📑 Libro Mensual Arqueos`.
  - **Cartera y Créditos:** `📄 Bandeja de Créditos`, `📂 Kardex Cartera`, `💵 Arqueos e Historial de Caja`.
  - **Padrón y Captaciones:** `👥 Padrón de Socios`, `🏛️ Aportaciones de Capital`, `💰 Cuentas de Ahorro`, `📈 Inversiones Plazo Fijo`.

---

## 17. Espaciadora Inteligente y No Invasiva en Autocompletado de Nombres (`InputNombreAutoCompletar.tsx`)
- **Respeto a Palabras Exactas:** Al escribir una palabra (ej. `rosa`), presionar la barra espaciadora **NUNCA la sustituye por una palabra más larga** (como `Rosales`). El texto se conserva como `Rosa `.
- **Tildes Exactas y Capitalización:** La espaciadora aplica tilde cuando la palabra lo requiere (ej. `tomas ` -> `Tomás `, `sanchez ` -> `Sánchez `) y capitaliza respetando la raíz ingresada.
- **Respeto a Borrados y Edición:** Si el usuario borra caracteres o corrige manualmente, la barra espaciadora respeta lo escrito sin volver a sobreescribirlo.
- **Autocompletado con `[Tab]` o Toque:** Si se desea autocompletar una sugerencia más larga (`Rosales`), se presiona la tecla `Tab` o se hace clic en la sugerencia en pantalla.

---

## 18. Liquidación Diaria de Créditos, Mora tras 4 Días de Gracia y Abono Extraordinario a Capital (`AuxiliarCaja.tsx`, `CreditoDetail.tsx`, `liquidacion.ts`)
- **Interés Diario Exacto según Días Transcurridos (Base 365 días):**
  - Fórmula: $\text{Interés Diario} = \frac{\text{Saldo Capital} \times 24\%}{365}$.
  - $\text{Interés Acumulado} = \text{Interés Diario} \times \text{Días Transcurridos desde el último pago (o desembolso)}$.
- **Regla Oficial de Mora (4 Días de Gracia y Q 25.00 a partir del 5to día):**
  - Si el pago se realiza dentro de los 4 días de gracia (días 1 a 4 de atraso): **Mora = Q 0.00**.
  - A partir del **5to día de atraso** (día 5 o más): Se aplica un recargo fijo de **Q 25.00** por cada cuota mensual que haya cumplido más de 4 días de gracia.
- **Distribución Automática de Excedentes a Capital:**
  - Cuando el socio entrega una cantidad mayor a la cuota requerida: primero se cubre mora, luego interés diario, y **todo el remanente se abona DIRECTAMENTE al Capital**, amortizando y disminuyendo el saldo deudor inmediatamente con alerta visual de confirmación.
- **Paneles en Tiempo Real:** En la ventanilla de cobro de **Auxiliar de Caja** y en la **Ficha del Crédito** con el saldo exacto para liquidar y cancelar hoy.

---

## 19. Rediseño del Tablero a Pantalla Completa (Sin Scroll en PC), Tiempo Real Automático (10s) y Menú Desplegable (`Tablero.tsx`, `app.css`)
- **Visualización en Una Sola Pantalla en PC (100vh):**
  - **Banda Superior de 8 KPIs:** Distribuida en 4 columnas x 2 filas compactas (*Caja Chica, Ahorro Corriente, Ahorro Programado, Ahorro Infantil, Ahorro Plazo Fijo, Aportaciones Capital, Socios Activos, Cartera de Crédito*).
  - **Cifras Monetarias Continuas:** Aplicación de `white-space: nowrap` y tipografía responsiva `clamp()` en `.stat-card .value` y `.kpi-tile-value` para evitar que montos grandes como `Q 2,657,460.40` quiebren los decimales en una segunda línea.
  - **Dos Columnas Inferiores Balanceadas:**
    - *Columna Izquierda:* Panel de Supervisión y Control (o Accesos Rápidos según rol) + Tabla compacta de Desglose por Agencia.
    - *Columna Derecha:* Monitoreo Estratégico de Servicios con filtros por área, métricas destacadas y barras proporcionales con scroll interno acotado a 200px.
  - **Cero Huecos Vacíos:** Eliminación de espacios negros muertos y distribución simétrica de la altura en pantallas de escritorio.
- **Actualización Continua en Tiempo Real (10 Segundos):**
  - **Supresión del Botón Manual `🔄 Actualizar`:** Cabecera limpia y libre de botones redundantes.
  - **Polling Silencioso:** Consulta periódica automática cada 10 segundos para actualizar tanto el resumen financiero como la analítica de servicios sin parpadeos visuales.
  - **Refresco Inmediato por Visibilidad:** Al regresar a la pestaña del navegador (`window.focus` / `visibilitychange`), los datos se actualizan al instante.
  - **Insignia Animada:** Indicador `● En Vivo · En Tiempo Real` con animación de pulso verde que confirma la conexión activa.
- **Menú Desplegable de Administración (`⚙️ Opciones del Sistema`):**
  - Botones administrativos (`📥 Recargar Datos Existentes (Excel)` y `⚠️ Reiniciar a Cero`) agrupados en un menú emergente con confirmación de seguridad, liberando valiosa altura vertical.
- **Adaptabilidad Responsiva Completa:**
  - **Escritorio (PC):** Vista unificada en 1 pantalla sin scrollbar vertical forzado.
  - **Tablet (768px - 1024px):** Cuadrícula fluida de 2 columnas para KPIs y reorganización táctil de paneles.
  - **Móvil (375px - 640px):** Cuadrícula de 2 columnas para tarjetas financieras y apilamiento vertical natural con navegación táctil fluida.

---

## 20. Optimización de Espacios y Acordeón Desplegable en el Libro Mensual de Arqueos (`LibroArqueoMensual.tsx`)
- **Ocupación del 100% del Ancho (Eliminación de Vacíos Laterales):**
  - Se retiró la limitación fija `maxWidth: 1050px` del contenedor del acta notarial, permitiendo que la sábana de operaciones, el encabezado institucional y las firmas se expandan al 100% del ancho útil de la pantalla en monitores y laptops sin dejar huecos negros en los costados.
- **Acordeón Desplegable de Parámetros Notariales (`mostrarConfiguracion`):**
  - **Problema previo:** Los 9 campos de configuración ocupaban un recuadro fijo de más de 220px de alto en la parte superior, empujando todo el documento fuera de la vista inicial.
  - **Solución implementada:** Se integró una barra superior compacta de solo ~36px con insignias de resumen (`Acta: CV-09-2026`, `📍 San Gaspar Chajul`, `⏰ 17:00 – 18:15`, `👤 Pres.: Jacinto Asicona Brito`) y el botón conmutador **`▼ Modificar Datos y Firmantes` / `▲ Ocultar Parámetros`**.
  - Al hacer clic, el formulario se despliega en cuadrículas simétricas de 4 columnas para parámetros generales y firmantes, manteniendo una navegación ultra rápida.
- **Cintillo de Cifras Clave Responsivo:**
  - La franja de 5 indicadores (`Días Operados`, `Efectividad de Cuadre`, `Ingresos`, `Egresos`, `Diferencia`) se adaptó con `grid-template-columns: repeat(auto-fit, minmax(130px, 1fr))` para redistribuirse fluidamente en cualquier tamaño de pantalla sin apiñarse ni quebrar texto.
- **Firmas Notariales con Auto-Fit:**
  - Las 4 firmas oficiales ahora fluyen a 2 columnas en tablets y móviles, y a 4 columnas balanceadas en pantallas grandes.

---

## 21. Optimización Integral de Pantallas del Sistema: Ocupación al 100% de Ancho, Eliminación de Espacios Vacíos y Nuevas Vistas Administrativas (`Alertas.tsx`, `Sesiones.tsx`, `Auditoria.tsx`, `CajaChica.tsx`, `AuxiliarCaja.tsx`, `AhorroList.tsx`, `SociosList.tsx`, `Usuarios.tsx`, `Agencias.tsx`, `app.css`)
- **Aprovechamiento Integral de Pantalla (Escritorio / PC):**
  - **Retiro de Límites Rígidos:** Se eliminaron las restricciones fijas (`maxWidth: 480px`, `560px`, `580px`, `640px`) en formularios y cuadrículas que dejaban franjas negras muertas en pantallas de PC.
  - **Fluid Grid en Tarjetas de Métricas (`1fr`):** En todos los módulos (`Auxiliar de caja`, `Caja chica`, `Cuentas de Ahorro`, `Padrón de Socios`, `Usuarios`, `Agencias`, `Alertas`, `Sesiones`), los cintillos de tarjetas ahora utilizan `grid-template-columns: repeat(auto-fit, minmax(200px, 1fr))` garantizando que las tarjetas se estiren y cubran el 100% del monitor sin huecos al final.
  - **Padding de Contenedor Optimizado:** En `app.css`, `.content` se ajustó a `padding: 1rem 1.5rem` maximizando el área útil visible.
- **Nuevas Vistas y Endpoints del Módulo de Administración:**
  - **Panel de Alertas (`/alertas`):** Vista en tiempo real con diagnóstico financiero automatizado: créditos con cuotas pendientes o en mora, cajas auxiliares desfasadas o abiertas sin arqueo, certificados a plazo fijo vencidos o por vencer (≤ 15 días), alerta de saldo bajo en caja chica (< Q 500), y expedientes incompletos en el padrón de socios. Incluye badges de severidad (`Peligro`, `Advertencia`, `Informativa`), pestañas de filtro por categoría y botón de atención directa (`Atender en módulo →`).
  - **Control de Sesiones y Accesos Activos (`/sesiones`):** Tablero administrativo conectado a la base de datos que lista en tiempo real los colaboradores del sistema, correos institucionales, roles, agencias asignadas, estado de cuenta (`🟢 Habilitado`), última acción auditada y fecha/hora exacta de última actividad.
  - **Bitácora de Auditoría Conectada (`/auditoria`):** Backend activado con paginación, filtros por texto, entidad, tipo de acción (`CREAR`, `ACTUALIZAR`, `ELIMINAR`) y fechas, con visualización de registros y diferencias JSON al 100% del ancho.
- **Optimización de Operaciones y Captaciones:**
  - **Caja Chica (`/caja-chica`):** Tarjetas de Saldo actual, Ingresos y Egresos expandidas al 100%, tabla de comprobantes fluida y formularios de comprobante y reposición de fondo fijo distribuidos en cuadrículas responsivas.
  - **Auxiliar de Caja (`/auxiliar-caja`):** Tarjetas de fondos (`Saldo inicial`, `Total ingresos`, `Total egresos`, `Saldo actual`) ocupando el 100% del ancho con `minmax(200px, 1fr)`.
  - **Cuentas de Ahorro (`/ahorros/corriente`, `/programado`, `/infanto-juvenil`, `/sobre-prestamo`):** Reemplazo de anchos fijos de 220px por `minmax(220px, 1fr)` en `AhorroList.tsx`, cubriendo las cuatro modalidades de ahorro con presentación a pantalla completa.
  - **Padrón de Socios (`/socios`):** Incorporación de cintillo de métricas fluidas (`Total Asociados`, `Prospectos / Fiadores`, `Bloque de Padrón`) y barra de búsqueda de ancho completo.
  - **Usuarios y Agencias (`/usuarios`, `/agencias`):** Adición de tiras de indicadores ejecutivos, formularios en 2-3 columnas responsivas y tablas de padrón al 100% de ancho.
- **Adaptabilidad Multi-Dispositivo (PC, Tablet y Móvil):**
  - **Tablet (768px - 1024px):** Menú lateral colapsable en barra superior con botón hamburguesa, reflow automático de tarjetas en 2 columnas y tablas con scroll suave.
---

## 22. Arquitectura de Pantalla Completa (100vh Sin Scroll de Ventana) y 2 Columnas Balanceadas en Operaciones y Créditos (`CajaChica.tsx`, `CreditosList.tsx`, `app.css`)
- **Problema Previo:**
  - Las pantallas operativas tenían tarjetas KPI gigantes apiladas verticalmente y tablas empujadas hacia el fondo, obligando al usuario a realizar scroll vertical extenso de página completa en pantallas de laptop y PC, dejando además zonas de espacio negro desaprovechadas.
- **Nueva Arquitectura de Pantalla Única (`.screen-container`):**
  - Contenedor con altura exacta calculada `height: calc(100vh - 2.2rem)` y `overflow: hidden` en monitores de escritorio (con reflow natural a scroll en tablets y móviles).
  - Cero scroll en la ventana principal del navegador (`Page Height == Viewport Height`).
- **Rediseño de Caja Chica (`CajaChica.tsx`):**
  - **Cabecera Compacta en 1 Línea (`.screen-header`):** Título descriptivo y botones de acción rápida agrupados.
  - **Franja Horizontal de KPIs Delgada (`.screen-kpis`):** 4 indicadores (Saldo Actual, Total Ingresos, Total Egresos, Comprobantes) en una sola fila compacta de ~50px.
  - **Distribución en 2 Columnas Balanceadas (`.screen-split-layout`):**
    - *Columna Izquierda (360px):* Panel "Egresos por Categoría" con barras de progreso dinámicas, montos monetarios y porcentajes del presupuesto consumido, además de formularios emergentes de comprobante y reposición de fondo fijo.
    - *Columna Derecha (Flex 1):* Buscador en vivo de comprobantes y tabla de registros con encabezado fijo (`sticky`) y scroll interno contenido (`.table-scroll-container`).
- **Rediseño del Módulo de Créditos (`CreditosList.tsx`):**
  - **Cabecera Unificada con Pestañas Integradas:** Botones conmutadores de `Cartera ({total})` y `Fiadores ({total})` integrados directamente en el encabezado junto a los accesos al `Simulador` y `+ Nueva solicitud`, ahorrando más de 80px de altura.
  - **Franja de KPIs Ultra Compacta:** Tarjetas interactivas con iconos y montos continuos (*Cartera Activa*, *Por Desembolsar*, *En Solicitud*, *Total Créditos*) que filtran la tabla al hacer clic.
  - **Barra de Herramientas Compacta (`.screen-toolbar`):** Buscador instantáneo y botones de estado rápido (`Todos`, `⚡ Desembolso`, `Cobro`, `Pagados`) en 1 sola fila de 36px.
---

## 23. Optimización del Kardex de Cartera a Pantalla Completa (100vh) y Formato Limpio de Vencimientos (`KardexCarteraPromotor.tsx`)
- **Problema Previo:**
  - Las 6 tarjetas superiores ocupaban un espacio vertical excesivo y truncaban las cifras de Quetzales con puntos suspensivos (`Q 2,657,460...` y `Q 3,831,594...`).
  - Las fechas de vencimiento en la tabla mostraban marcas de tiempo UTC crudas (`2029-02-18T06:00:00.000Z`).
  - La tabla generaba scroll de ventana completa obligando a bajar la página para ver la paginación.
- **Solución Implementada:**
  - **Estructura `.screen-container` de 100vh:** Altura exacta calculada `calc(100vh - 2.2rem)` con `overflow: hidden` en escritorio.
  - **Cabecera Compacta en 1 Sola Línea:** Título principal con selector de mes integrado y botonera de acciones agrupadas (`🖨️ Imprimir`, `+ Nueva Solicitud`, `📥 Excel`, `⚠️ Reset`).
---

## 24. Optimización del Padrón de Socios a Pantalla Completa (100vh Sin Scroll) (`SociosList.tsx`)
- **Problema Previo:**
  - Las 3 tarjetas de asociados ocupaban una altura excesiva en la parte superior.
  - La fila de pestañas y el buscador estaban apilados verticalmente, empujando la tabla hacia abajo y forzando un scroll de página completa para poder consultar la paginación.
- **Solución Implementada:**
  - **Estructura `.screen-container` de 100vh:** Altura exacta `calc(100vh - 2.2rem)` con `overflow: hidden` en monitores de PC.
  - **Cabecera Unificada en 1 Sola Línea:** Título principal con pestañas conmutadoras integradas (`Padrón ({total})` y `🎯 Prospectos ({fiadores})`) y botón `+ Nuevo socio` a la derecha.
  - **Franja de KPIs Ultra Delgada:** 3 mini tarjetas compactas de 1 fila (*Total Asociados*, *Prospectos / Fiadores*, *Bloque de Padrón*).
  - **Barra de Búsqueda Compacta (`.screen-toolbar`):** Input estilizado de ancho completo en una sola línea de 34px.
  - **Tabla Compacta con Cabecera Sticky (`.table-scroll-container`):** Altura de celdas optimizada para visualizar 10 asociados por vista cómodamente, cabecera fija y scrollbar interno sutil.
  - **Paginación Fija al Fondo (`.screen-footer`):** Controles `← Anterior` y `Siguiente →` integrados al pie inferior sin desbordar el viewport.
  - **Sincronización Dual Continua:** Copia simultánea entre `/Users/galindo/Downloads/mif-app-codigo-ejecutable` y `/Users/galindo/Documents/proyects/carpet/mif-app-codigo-ejecutable`.




## 25. Optimización de Aportaciones, Ahorros y Auxiliar de Caja a Pantalla Completa (100vh Sin Scroll) - Cobertura Global Completada

- **Alcance:** `AportacionesList.tsx`, `AhorroList.tsx`, `PlazoFijoList.tsx`, `AuxiliarCaja.tsx`, `CajaAbierta.tsx`, `CajaCerradaCard.tsx`, `app.css`
- **Problema Previo:**
  - Las pantallas de Aportaciones, Ahorros y Auxiliar de Caja usaban la estructura antigua `page-head` y `stat-grid` con tarjetas KPI grandes apiladas verticalmente, causando scroll de ventana completa.
  - CajaAbierta mostraba KPIs, consolidado de fondos, novedades de campo y botones de acción todos apilados antes de la tabla, dejando la tabla de movimientos muy abajo y pequeña.
  - CajaCerradaCard presentaba los 6 KPIs del arqueo con valores truncados (números con `...`).
- **Solución Implementada:**
  - **Padrón de Aportaciones (`AportacionesList.tsx`):** Estructura `.screen-container` de 100vh, cabecera 1 línea con badge "Capital Social Oficial", 4 KPI tiles horizontales (Capital Aportado, Asociados, Promedio, Bloque), barra de búsqueda `.screen-toolbar`, tabla compacta con sticky header y `.screen-footer` con paginación.
  - **Ahorro Corriente y Cuentas (`AhorroList.tsx`):** Cubre `/ahorros/corriente`, `/programado`, `/infanto-juvenil`, `/sobre-prestamo`. Misma estructura 100vh: 4 KPI tiles (Saldo Total, Depósitos, Retiros, Vista de Cuentas), búsqueda compacta, tabla con columna de acción "Ver cuenta →", scroll interno.
  - **Ahorro a Plazo Fijo (`PlazoFijoList.tsx`):** 4 KPI tiles (Capital a PF, Intereses Netos, Certificados Vigentes, Vencidos/Por Liquidar), toolbar con buscador y selector de estado, tabla con columnas optimizadas (Plazo/Tasa fusionadas), scroll interno, footer paginación. Fecha formateada con `formatearFechaCorta` para evitar ISO timestamps.
  - **Auxiliar de Caja (`AuxiliarCaja.tsx`):** Cabecera `.screen-header` compacta en 1 línea con selector de agencia y botón Historial. Fix automático: ADMIN/GERENCIA auto-selecciona primera agencia disponible cuando `agenciaId` es null.
  - **Caja Abierta (`CajaAbierta.tsx`):** Rediseño a layout 2 columnas `.screen-split-layout` (340px + flex 1):
    - Panel izquierdo scrollable: Botonera de ventanilla en grid 2×2 (💵 Cobro Cuota, 📤 Desembolso, 📦 Liquidar PF, + Nuevo Mov.) + Botón 🔒 Cerrar Caja a ancho completo + Consolidado de Fuentes de Fondos compacto (MIF/FEDERURAL/CHN) + Panel de Novedades de Campo.
    - Panel derecho: 4 KPI tiles (Saldo Inicial, Ingresos, Egresos, Saldo Actual) + área dinámica que muestra el formulario activo O la tabla de movimientos con sticky header + footer contador de operaciones.
  - **Caja Cerrada (`CajaCerradaCard.tsx`):** Barra de estado compacta de 1 línea con badge "Turno Finalizado" y botón Imprimir Acta. 6 KPI tiles horizontales sin truncamiento (Saldo Inicial, Ingresos, Egresos, Saldo Libro, Efectivo Contado, Diferencia Arqueo con color semáforo). Tabla de movimientos del día con scroll interno y sticky header. Footer con botón de historial.
  - **CSS Global (`app.css`):** Nuevas clases `.screen-kpi-tile`, `.screen-kpi-tile.accent`, `.screen-kpi-label`, `.screen-kpi-value`, `.screen-kpi-sub` para uniformar KPIs en todos los módulos.
- **Cobertura Completada:** Todas las pantallas del sistema (Tablero, Caja Chica, Créditos, Kardex Cartera, Socios, Aportaciones, Ahorro Corriente/Programado/Infanto-Juvenil/Sobre-Préstamo, Plazo Fijo, Auxiliar de Caja) ahora aplican la arquitectura 100vh single-screen de forma global.
- **Archivos Modificados:** `frontend/src/pages/AportacionesList.tsx`, `frontend/src/pages/AhorroList.tsx`, `frontend/src/pages/PlazoFijoList.tsx`, `frontend/src/pages/AuxiliarCaja.tsx`, `frontend/src/components/cajaauxiliar/CajaAbierta.tsx`, `frontend/src/components/cajaauxiliar/CajaCerradaCard.tsx`, `frontend/src/styles/app.css`
- **Sincronización Dual:** Downloads ↔ Documents aplicada en todos los archivos.

## 26. Optimización del Panel de Alertas a Pantalla Completa (100vh Sin Scroll) (`Alertas.tsx`)

- **Problema Previo:**
  - La pantalla `/alertas` usaba `page-head` y `stat-grid` con tarjetas KPI grandes apiladas verticalmente.
  - La lista de alertas se extendía en un contenedor `<div>` sin límite de altura, obligando al usuario a hacer scroll de ventana completa (page height: 1352px vs viewport: 701px).
- **Solución Implementada:**
  - **Estructura `.screen-container` de 100vh:** Altura exacta `calc(100vh - 2.2rem)` con `overflow: hidden` en escritorio.
  - **Cabecera Compacta en 1 Línea (`.screen-header`):** Título con emoji 🔔 + subtítulo descriptivo + indicador de monitoreo activo animado + botón `🔄 Actualizar` manual.
  - **Franja de 4 KPI Tiles (`.screen-kpis`):** 4 columnas iguales: Total Alertas (accent), ⚡ Atención Inmediata (rojo #ef4444), ⚠️ Advertencias (ámbar #f59e0b), ℹ️ Informativos (azul #3b82f6). Cada tile muestra `label + valor grande + sub` sin truncamiento.
  - **Barra de Filtros Compacta (`.screen-toolbar`):** 6 botones de categoría en 1 fila (Todas, Caja Auxiliar, Créditos, Plazo Fijo, Caja Chica, Padrón Socios) con contador entre paréntesis. Padding de 0.28rem para máxima compacidad.
  - **Lista de Alertas con Scroll Interno (`.table-scroll-container`):** `flex: 1` para ocupar todo el espacio restante. Cada alerta en tarjeta compacta de ~70px de altura (vs. ~90px anteriores): padding `0.65rem 1rem`, tipografía reducida (0.88rem título, 0.82rem descripción, 0.74rem detalle). Botón "Atender →" en lugar de "Atender en módulo →" para ahorrar espacio.
  - **Footer Fijo (`.screen-footer`):** Contador "Mostrando X de Y alertas · Filtro: CATEGORIA" + "Actualización automática cada 20 segundos".
- **Archivos Modificados:** `frontend/src/pages/Alertas.tsx`
- **Sincronización Dual:** Downloads ↔ Documents completada.

## 27. Optimización de la Bitácora de Auditoría a Pantalla Completa (100vh Sin Scroll) (`Auditoria.tsx`)

- **Problema Previo:**
  - La pantalla `/auditoria` usaba `page-head` y `stat-grid` con tarjetas KPI grandes que empujaban la tabla hacia abajo.
  - Los filtros (búsqueda, entidad, acción, fechas) estaban en filas independientes, consumiendo ~120px de altura antes de la tabla.
  - La tabla de 25 registros obligaba al usuario a hacer scroll de ventana completa.
- **Solución Implementada:**
  - **Estructura `.screen-container` de 100vh:** Altura exacta `calc(100vh - 2.2rem)` con `overflow: hidden` en escritorio.
  - **Cabecera Compacta en 1 Línea (`.screen-header`):** Título con emoji 🔍 + subtítulo descriptivo + botón contextual "✕ Limpiar filtros" (solo visible cuando hay filtros activos) + indicador de carga.
  - **Franja de 3 KPI Tiles (`.screen-kpis`):** 3 columnas iguales: Total Eventos Auditados (accent verde), Entidades Monitoreadas (neutro), Página Actual X/Y (neutro). Valores sin truncamiento.
  - **Barra de Filtros Ultra Compacta (`.screen-toolbar`):** Todos los controles en 1 sola fila horizontal: buscador flex, selector de entidades, selector de acción (con emojis ✅/✏️/🗑️), inputs de fecha Desde/Hasta. Padding de 0.28rem para máxima densidad. Limpiar filtros movido al header para mayor claridad.
  - **Tabla con Scroll Interno (`.table-scroll-container`):** `flex: 1` para ocupar todo el espacio restante. Tipografía compacta (0.8rem filas, 0.75rem secundario, 0.69rem mono). Badges de acción con fondos semitransparentes `rgba()` para consistencia con el modo oscuro.
  - **Footer Fijo (`.screen-footer`):** Contador "X registros mostrados · Total: N" a la izquierda + paginación ← / → con número de página al centro derecha.
  - **Modal de Detalle Actualizado:** Fondos `rgba()` semitransparentes (naranja/verde) en lugar de amarillos/verdes sólidos que rompían la paleta oscura.
- **Archivos Modificados:** `frontend/src/pages/Auditoria.tsx`
- **Sincronización Dual:** Downloads ↔ Documents completada.

## 28. Rediseño Completo del Menú Lateral (Sidebar Moderno y Profesional) (`Layout.tsx`, `app.css`)

- **Problema Previo:**
  - El sidebar usaba el mismo color de fondo `var(--paper-raised)` que el contenido, sin diferenciación visual clara.
  - Los links de navegación eran bloques simples sin íconos alineados ni indicador visual de activo elegante.
  - El área de marca era texto plano con opción de agencia en un badge verde básico.
  - El footer de usuario era texto sin jerarquía visual clara.
- **Nuevo Diseño Implementado:**
  - **Fondo Gradiente Oscuro Profundo:** `linear-gradient(180deg, #0b1628, #0d1f3c, #0b1628)` — distinto al contenido, crea una separación visual nítida sin borde duro.
  - **Barra Superior Animada (Shimmer):** Línea de 3px de gradiente esmeralda `#059669 → #34d399 → #059669` con animación de barrido continuo. Efecto de "acento vivo" en el tope del sidebar.
  - **Área de Marca (`.brand`):** Logo `M` con gradiente esmeralda + sombra verde (`boxShadow: rgba(5,150,105,0.4)`), nombre en blanco uppercase, subtítulo en `#34d399`. Badge de agencia con punto pulsante animado y borde `rgba(52,211,153,0.2)`.
  - **Links de Navegación (`.nav a`):** Icono + texto en fila (`display: flex`), color `rgba(255,255,255,0.5)` en reposo → `rgba(255,255,255,0.9)` + `translateX(2px)` en hover. Activo: gradiente verde semitransparente + `box-shadow` con glow + barra indicadora verde de 3px en el borde derecho.
  - **Etiquetas de Sección (`.nav-section`):** `0.6rem uppercase`, `rgba(255,255,255,0.28)` — discretas pero legibles, sin acaparar altura.
  - **Scrollbar del Nav:** Oculta (3px) con `scrollbar-width: thin` para mantener la estética sin perder funcionalidad.
  - **Control de Datos Compacto:** Dos botones horizontales compactos ("📥 Excel" / "⚠️ Reset") con fondos semitransparentes en azul/rojo, sin texto largo que ocupe demasiado espacio.
  - **Footer de Usuario:** Avatar circular con iniciales en 2 letras + gradiente verde, nombre truncado con ellipsis, rol en gris suave, botón ⏏️ de cierre de sesión en rojo semitransparente (icon-only, con tooltip).
  - **Ancho Reducido:** 250px → 240px para maximizar el área de contenido.
- **Archivos Modificados:** `frontend/src/pages/Layout.tsx`, `frontend/src/styles/app.css`
- **Sincronización Dual:** Downloads ↔ Documents completada.

## 29. Sidebar Colapsable Tipo "Icon Rail" — Menú Profesional Moderno (`Layout.tsx`, `app.css`)

- **Patrón elegido:** Sidebar colapsable con estado `collapsed` — el estándar de apps profesionales como VS Code, Linear, Notion y ERPs bancarios. Óptimo para el perfil mixto PC+tablet del sistema MIF.
- **Comportamiento:**
  - **Expandido (240px):** Ícono + texto + etiquetas de sección visibles. Borde activo en derecha.
  - **Colapsado (56px):** Solo íconos centrados. Etiquetas de sección ocultas (altura 0). Borde activo en izquierda. Tooltip CSS-only al hacer hover sobre cada ítem.
  - **Toggle:** Clic en el área de marca/logo (`sidebar-toggle`) alterna entre estados con transición suave `cubic-bezier(0.4, 0, 0.2, 1)` de 0.25s. Chevron `‹` rota 180° al colapsar.
  - **Mobile/Tablet:** Hamburger `☰` en top bar superior + overlay backdrop. Sidebar como drawer lateral completo.
- **Detalles CSS:**
  - Variables CSS: `--sidebar-w: 240px`, `--sidebar-collapsed-w: 56px`, `--sidebar-transition`.
  - `.shell.sidebar-collapsed` modifica `grid-template-columns` y el ancho del `.sidebar`.
  - `.nav a[data-tooltip]::before`: tooltip posicionado absolutamente en `left: calc(56px - 4px)` con delay de 0.3s para no mostrar en paso rápido.
  - Sidebar `position: sticky; height: 100vh` — se mantiene en pantalla al hacer scroll del contenido.
  - `overflow: hidden` en sidebar controla clip del texto durante la transición.
- **Archivos Modificados:** `frontend/src/pages/Layout.tsx`, `frontend/src/styles/app.css`
- **Sincronización Dual:** Downloads ↔ Documents completada.

## 30. Tooltip Flotante Universal en Menú Lateral — Pill con Flecha, Siempre Activo (`Layout.tsx`, `app.css`)

- **Funcionalidad:** Al pasar el cursor sobre cualquier ítem del menú (tanto en modo colapsado como expandido), aparece una etiqueta flotante tipo "pill" oscuro a la derecha del ítem con el nombre del módulo.
- **Implementación:** Tooltip React con `getBoundingClientRect()` + `position: fixed` — evita problemas de `overflow: hidden` del sidebar y del scroll del nav. Timer de 300ms con `useRef<setTimeout>` para no mostrar en pase rápido.
- **Diseño del tooltip:**
  - Fondo `#162033` (azul marino oscuro profundo, distinto al sidebar).
  - Borde `rgba(52,211,153,0.22)` — acento esmeralda suave.
  - Triángulo apuntando izquierda (hacia el ícono) mediante borders CSS transparentes.
  - `box-shadow: 0 6px 20px rgba(0,0,0,0.5)` — sombra profunda para efecto flotante.
  - Animación `tooltip-in` de 0.12s: slide desde `-4px` + fade in.
  - Texto: `0.76rem`, `fontWeight: 600`, `#e2e8f0`.
- **Comportamiento:**
  - Aparece 300ms después de entrar al ítem (no interrumpe navegación rápida).
  - Desaparece inmediatamente al salir del ítem (`onMouseLeave`).
  - Funciona en **ambos modos** — colapsado (íconos) y expandido (texto visible).
  - Timer cancelado correctamente en `onMouseLeave` para evitar tooltips fantasma.
- **Archivos Modificados:** `frontend/src/pages/Layout.tsx`, `frontend/src/styles/app.css`
- **Sincronización Dual:** Downloads ↔ Documents completada.
