#!/usr/bin/env bash
set -euo pipefail

HOSTNAME="localhost"
PORT="5432"
DATABASE="taskflow"
USERNAME="postgres"
PSQL_PATH="psql"
PASSWORD="1234"

usage() {
  cat <<'EOF'
Usage: ./database/apply-all.sh [options]

Options:
  -h <host>         DB host (default: localhost)
  -p <port>         DB port (default: 5432)
  -d <database>     DB name (default: taskflow)
  -U <username>     DB user (default: postgres)
  -P <psql_path>    psql binary path (default: psql)
  -W <password>     password (default: 1234)
EOF
}

while getopts ":h:p:d:U:P:W:" opt; do
  case "$opt" in
    h) HOSTNAME="$OPTARG" ;;
    p) PORT="$OPTARG" ;;
    d) DATABASE="$OPTARG" ;;
    U) USERNAME="$OPTARG" ;;
    P) PSQL_PATH="$OPTARG" ;;
    W) PASSWORD="$OPTARG" ;;
    *) usage; exit 1 ;;
  esac
done

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "Applying migrations..."
"$SCRIPT_DIR/apply-migrations.sh" -h "$HOSTNAME" -p "$PORT" -d "$DATABASE" -U "$USERNAME" -P "$PSQL_PATH" -W "$PASSWORD"

echo ""
echo "Applying seeds..."
"$SCRIPT_DIR/apply-seeds.sh" -h "$HOSTNAME" -p "$PORT" -d "$DATABASE" -U "$USERNAME" -P "$PSQL_PATH" -W "$PASSWORD"

