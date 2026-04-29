#!/usr/bin/env bash
set -euo pipefail

HOSTNAME="localhost"
PORT="5432"
DATABASE="taskflow"
USERNAME="postgres"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SEED_FILE="$SCRIPT_DIR/seed.sql"
SEEDS_DIR="$SCRIPT_DIR/seeds"
PSQL_PATH="psql"
PASSWORD="1234"

usage() {
  cat <<'EOF'
Usage: ./database/apply-seeds.sh [options]

Options:
  -h <host>         DB host (default: localhost)
  -p <port>         DB port (default: 5432)
  -d <database>     DB name (default: taskflow)
  -U <username>     DB user (default: postgres)
  -f <file>         seed file (default: database/seed.sql)
  -s <dir>          seeds dir fallback (default: database/seeds)
  -P <psql_path>    psql binary path (default: psql)
  -W <password>     password (default: 1234)
EOF
}

while getopts ":h:p:d:U:f:s:P:W:" opt; do
  case "$opt" in
    h) HOSTNAME="$OPTARG" ;;
    p) PORT="$OPTARG" ;;
    d) DATABASE="$OPTARG" ;;
    U) USERNAME="$OPTARG" ;;
    f) SEED_FILE="$OPTARG" ;;
    s) SEEDS_DIR="$OPTARG" ;;
    P) PSQL_PATH="$OPTARG" ;;
    W) PASSWORD="$OPTARG" ;;
    *) usage; exit 1 ;;
  esac
done

if ! command -v "$PSQL_PATH" >/dev/null 2>&1; then
  echo "Required command '$PSQL_PATH' was not found. Install PostgreSQL client tools, add psql to PATH, or pass -P to this script." >&2
  exit 1
fi

echo "Target DB: ${USERNAME}@${HOSTNAME}:${PORT}/${DATABASE}"

export PGPASSWORD="$PASSWORD"
psql_base=( "$PSQL_PATH" -v ON_ERROR_STOP=1 -h "$HOSTNAME" -p "$PORT" -U "$USERNAME" -d "$DATABASE" )

seed_one() {
  local file="$1"
  echo "Seeding: $file"
  "${psql_base[@]}" -f "$file"
}

if [[ -f "$SEED_FILE" ]]; then
  seed_one "$SEED_FILE"
elif [[ -d "$SEEDS_DIR" ]]; then
  shopt -s nullglob
  files=( "$SEEDS_DIR"/*.sql )
  if (( ${#files[@]} == 0 )); then
    echo "No seed files found in $SEEDS_DIR"
    exit 0
  fi

  IFS=$'\n' sorted=( $(printf '%s\n' "${files[@]}" | sort) )
  unset IFS

  for f in "${sorted[@]}"; do
    seed_one "$f"
  done
else
  echo "Seed file not found: $SEED_FILE (and seeds directory not found: $SEEDS_DIR)" >&2
  exit 1
fi

echo "Seeding complete."

