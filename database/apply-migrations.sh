#!/usr/bin/env bash
set -euo pipefail

HOSTNAME="localhost"
PORT="5432"
DATABASE="taskflow"
USERNAME="postgres"
MIGRATIONS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/migrations"
PSQL_PATH="psql"
PASSWORD="1234"

usage() {
  cat <<'EOF'
Usage: ./database/apply-migrations.sh [options]

Options:
  -h <host>         DB host (default: localhost)
  -p <port>         DB port (default: 5432)
  -d <database>     DB name (default: taskflow)
  -U <username>     DB user (default: postgres)
  -m <dir>          migrations dir (default: database/migrations)
  -P <psql_path>    psql binary path (default: psql)
  -W <password>     password (default: 1234)
EOF
}

while getopts ":h:p:d:U:m:P:W:" opt; do
  case "$opt" in
    h) HOSTNAME="$OPTARG" ;;
    p) PORT="$OPTARG" ;;
    d) DATABASE="$OPTARG" ;;
    U) USERNAME="$OPTARG" ;;
    m) MIGRATIONS_DIR="$OPTARG" ;;
    P) PSQL_PATH="$OPTARG" ;;
    W) PASSWORD="$OPTARG" ;;
    *) usage; exit 1 ;;
  esac
done

if ! command -v "$PSQL_PATH" >/dev/null 2>&1; then
  echo "Required command '$PSQL_PATH' was not found. Install PostgreSQL client tools, add psql to PATH, or pass -P to this script." >&2
  exit 1
fi

if [[ ! -d "$MIGRATIONS_DIR" ]]; then
  echo "Migrations directory not found: $MIGRATIONS_DIR" >&2
  exit 1
fi

echo "Target DB: ${USERNAME}@${HOSTNAME}:${PORT}/${DATABASE}"

# Convenience for this project: supply password to psql via env var.
export PGPASSWORD="$PASSWORD"

psql_base=( "$PSQL_PATH" -v ON_ERROR_STOP=1 -h "$HOSTNAME" -p "$PORT" -U "$USERNAME" -d "$DATABASE" )

# Ensure migration tracking table exists (idempotent).
"${psql_base[@]}" -c "CREATE TABLE IF NOT EXISTS schema_migrations (version TEXT PRIMARY KEY, applied_at TIMESTAMPTZ NOT NULL DEFAULT now());" >/dev/null

applied="$("${psql_base[@]}" -X -A -t -c "SELECT version FROM schema_migrations ORDER BY version;" || true)"

shopt -s nullglob
files=( "$MIGRATIONS_DIR"/*.sql )
if (( ${#files[@]} == 0 )); then
  echo "No migration files found in $MIGRATIONS_DIR"
  exit 0
fi

IFS=$'\n' sorted=( $(printf '%s\n' "${files[@]}" | sort) )
unset IFS

for f in "${sorted[@]}"; do
  version="$(basename "$f" .sql)"
  if printf '%s\n' "$applied" | grep -Fxq "$version"; then
    echo "Skipping (already applied): $version"
    continue
  fi

echo "Applying: $f"
"${psql_base[@]}" -f "$f"

  # Safety net in case a migration forgets to insert into schema_migrations.
  "${psql_base[@]}" -c "INSERT INTO schema_migrations(version) VALUES ('$version') ON CONFLICT (version) DO NOTHING;" >/dev/null
  echo "Applied: $version"
done

echo "Migrations complete."

