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
