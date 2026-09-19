#!/usr/bin/env bash
set -euo pipefail

# NAS Persistent Mount 기반 PROD DB Backup
PERSISTENT_ROOT="/opt/portfolio/persistent"
BACKUP_DIR="${PERSISTENT_ROOT}/backups/database/prod"
TIMESTAMP="$(date '+%Y%m%d_%H%M%S')"
TMP_FILE="${BACKUP_DIR}/portfolio_prod_${TIMESTAMP}.dump.tmp"
FINAL_FILE="${BACKUP_DIR}/portfolio_prod_${TIMESTAMP}.dump"

if [[ ! -d "${PERSISTENT_ROOT}" || -L "${PERSISTENT_ROOT}" ]]; then
  logger -t portfolio-backup "PROD DB backup failed: NAS persistent root unavailable"
  exit 1
fi

if ! findmnt -rn -T "${PERSISTENT_ROOT}" -t nfs,nfs4 >/dev/null; then
  logger -t portfolio-backup "PROD DB backup failed: NAS persistent mount unavailable"
  exit 1
fi

mkdir -p "${BACKUP_DIR}"

docker exec portfolio-prod-postgres \
  pg_dump \
  -U portfolio_prod \
  -d portfolio_prod \
  -Fc > "${TMP_FILE}"

mv "${TMP_FILE}" "${FINAL_FILE}"

find "${BACKUP_DIR}" \
  -maxdepth 1 \
  -type f \
  -name 'portfolio_prod_*.dump' \
  -mtime +180 \
  -delete

logger -t portfolio-backup "PROD DB backup completed: ${FINAL_FILE}"
