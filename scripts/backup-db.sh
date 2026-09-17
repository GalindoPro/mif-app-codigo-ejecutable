#!/bin/bash
# ==============================================================================
# Script de Respaldo Automatizado de Base de Datos - Sistema COOP COMIF R.L.
# Ejecutar diariamente vía cron (ej: 23:00 cada noche tras el cierre de caja):
# 0 23 * * * /ruta/al/proyecto/scripts/backup-db.sh >> /var/log/mif-backup.log 2>&1
# ==============================================================================

set -e

BACKUP_DIR="$(dirname "$0")/../backups"
FECHA=$(date +"%Y-%m-%d_%H-%M-%S")
ARCHIVO="$BACKUP_DIR/mif_prod_$FECHA.sql.gz"

mkdir -p "$BACKUP_DIR"

echo "[$FECHA] Iniciando respaldo de base de datos..."

# Realizar volcado directo desde el contenedor PostgreSQL de Docker
docker exec mif-postgres pg_dump -U "${POSTGRES_USER:-mif_admin}" "${POSTGRES_DB:-mif_prod}" | gzip > "$ARCHIVO"

echo "[$FECHA] Respaldo generado con éxito: $ARCHIVO ($(du -h "$ARCHIVO" | cut -f1))"

# Política de retención: Eliminar respaldos locales de más de 30 días
find "$BACKUP_DIR" -name "*.sql.gz" -mtime +30 -exec rm {} \;
echo "[$FECHA] Limpieza de respaldos anteriores a 30 días completada."
