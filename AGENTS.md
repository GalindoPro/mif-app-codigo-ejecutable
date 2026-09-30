# Regla de Sincronización Automática de Documentación .md

Cada vez que se realice un cambio preciso, mejora o nueva funcionalidad en el código del sistema:

1. **Actualización de `MEJORAS_SISTEMA_MIF.md`:**
   - Registrar de forma obligatoria la nueva mejora con su número correlativo consecutivo.
   - Detallar los archivos modificados, las reglas contables o de negocio aplicadas, las fórmulas utilizadas y los componentes visuales actualizados.

2. **Actualización de `00-INDICE.md`:**
   - Mantener al día el estado de los módulos completados.
   - Documentar la arquitectura y el comportamiento operativo final para no duplicar tareas ya realizadas.

3. **Actualización de `02-codigo-frontend.md` / `01-codigo-backend.md`:**
   - Si se modifican archivos documentados en estos compendios (por ejemplo: `Tablero.tsx`, `app.css`, `types.ts`, routers o controladores del backend), sincronizar el bloque de código correspondiente con la versión final.

4. **Sincronización Bidireccional de Espacios de Trabajo:**
   - Mantener actualizados tanto el directorio `/Users/galindo/Downloads/mif-app-codigo-ejecutable` como el directorio activo de ejecución `/Users/galindo/Documents/proyects/carpet/mif-app-codigo-ejecutable`.

5. **Regla Permanente de Colores Institucionales, Tipografía y Modales (COOP COMIF R.L.):**
   - **NO PREGUNTAR AL USUARIO sobre colores de fondo, paletas o tipos de letra.** El sistema ya tiene definidos y consolidados sus estándares visuales institucionales, los cuales deben aplicarse automáticamente en toda nueva funcionalidad, modal o componente:
     * **Verde Institucional / Esmeralda Cooperativo:** `#059669` / `#10b981` / `#0f766e` (para botones primarios de acción, confirmaciones, saldos de ingresos, badges de estado activo y títulos cooperativos).
     * **Dorado / Oro Maya (Gold):** `#BF9903` / `#d97706` / `#f59e0b` (para acentos, tarjetas de saldo de arrastre, saldos acumulados de libro, distintivos destacados y montos en Quetzales).
     * **Fondo Dark Slate / Azul Noche Institucional:** `#070738` (sidebar institucional), `#0f172a` (fondos oscuros de modales elevados y pantalla general), `#1e293b` (tarjetas, inputs, elevaciones `var(--paper-raised)`), con bordes sutiles en `#334155` o `rgba(148, 163, 184, 0.2)`.
     * **Tipografía de Alto Contraste:** Títulos y textos principales en `#f8fafc` / `#e2e8f0` (alto contraste nítido, sin tonos grises pálidos o transparentes), subtítulos y etiquetas en `#94a3b8` / `#cbd5e1`.
     * **Cifras Monetarias y Códigos:** Obligatoriamente en `"IBM Plex Mono", monospace` con `font-variant-numeric: tabular-nums`.
     * **Arquitectura Obligatoria de Modales Emergentes:** Todo diálogo emergente debe construirse con el contenedor `.modal-overlay` (fixed, centrado con backdrop-filter blur) y la tarjeta interior `.modal-card` con fondo opaco institucional `#0f172a`, bordes definidos `1px solid rgba(148, 163, 184, 0.25)`, esquinas `14px`, sombra elevada `box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.75)` y padding de `1.5rem`. Queda estrictamente prohibido anidar clases duplicadas o dejar tarjetas transparentes.

6. **Regla de Fidelidad Absoluta a los Libros Excel Oficiales y Validación Previa:**
   - La base indiscutible de datos, saldos, nombres y operaciones son exclusivamente los archivos **Excel oficiales de la cooperativa** (`importar/...` y `caja/...`). Queda estrictamente prohibido inventar o alterar cifras contables, supuestos o saldos que no provengan directamente de las hojas Excel.
   - Si se detecta alguna discrepancia matemática, duplicidad o inconsistencia en la información, es de carácter **OBLIGATORIO** verificar primero el contenido real en los archivos Excel y notificar al usuario mediante preguntas estructuradas (`ask_question`), obteniendo su autorización previa antes de aplicar cualquier cambio o corrección en la base de datos o en el código del sistema.

