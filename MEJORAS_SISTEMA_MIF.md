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
