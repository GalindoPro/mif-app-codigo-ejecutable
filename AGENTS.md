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
