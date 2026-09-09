/**
 * Convierte un arreglo de objetos a CSV y descarga el archivo.
 * Compatible con Excel (codificación UTF-8 con BOM).
 */
export function exportarCSV(
  filas: Record<string, unknown>[],
  nombreArchivo: string,
  columnas?: { campo: string; titulo: string }[],
) {
  if (filas.length === 0) return;

  const cols = columnas ?? Object.keys(filas[0]).map((k) => ({ campo: k, titulo: k }));

  const escapar = (v: unknown): string => {
    if (v === null || v === undefined) return "";
    const str = String(v).replace(/"/g, '""');
    return str.includes(",") || str.includes("\n") || str.includes('"') ? `"${str}"` : str;
  };

  const encabezado = cols.map((c) => escapar(c.titulo)).join(",");
  const cuerpo = filas.map((fila) => cols.map((c) => escapar(fila[c.campo])).join(",")).join("\n");

  // BOM para que Excel abra correctamente caracteres especiales (tildes, ñ)
  const bom = "﻿";
  const contenido = bom + encabezado + "\n" + cuerpo;

  const blob = new Blob([contenido], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${nombreArchivo}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
