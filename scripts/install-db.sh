#!/usr/bin/env bash
# Install PostgreSQL, run it under systemd, create the app role and database.
# Usage: sudo bash scripts/install-db.sh
set -euo pipefail

APP_USER="${SUDO_USER:-$(id -un)}"
DB_NAME="${DB_NAME:-backend_servers}"

if ! command -v psql >/dev/null 2>&1; then
  apt-get update
  apt-get install -y postgresql
fi

systemctl enable --now postgresql

# Enable the versioned cluster unit too, so the server starts on boot.
for unit in $(systemctl list-unit-files 'postgresql@*.service' --no-legend | awk '{print $1}'); do
  systemctl enable --now "$unit"
done

runuser -u postgres -- psql -tAc "SELECT 1 FROM pg_roles WHERE rolname='$APP_USER'" | grep -q 1 \
  || runuser -u postgres -- createuser --createdb "$APP_USER"

runuser -u postgres -- psql -tAc "SELECT 1 FROM pg_database WHERE datname='$DB_NAME'" | grep -q 1 \
  || runuser -u postgres -- createdb -O "$APP_USER" "$DB_NAME"

systemctl --no-pager --lines=0 status postgresql || true
echo "Ready: database=$DB_NAME role=$APP_USER (unix socket, peer auth)"
