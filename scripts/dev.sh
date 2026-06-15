#!/usr/bin/env bash
set -e

# ─────────────────────────────────────────────────────────────
# Development Server Startup Script
# 1. Kill services on ports 5100, 4000
# 2. Verify shared PostgreSQL container is running
# 3. Create project database if needed
# 4. Push Drizzle schema
# 5. Launch all dev servers in parallel
# ─────────────────────────────────────────────────────────────

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

if [ -f "$PROJECT_ROOT/.env" ]; then
  export $(grep -v '^#' "$PROJECT_ROOT/.env" | xargs)
fi

DB_CONTAINER="${POSTGRES_CONTAINER:-postgres-local}"
DB_NAME="${POSTGRES_DB:-agentclave_dev}"
DB_USER="${POSTGRES_USER:-postgres}"
DB_PASSWORD="${POSTGRES_PASSWORD:-postgres}"
DB_PORT="${POSTGRES_PORT:-5432}"
DB_HOST="${POSTGRES_HOST:-localhost}"
DB_ADMIN_DB="${POSTGRES_ADMIN_DB:-postgres}"

ensure_container_running() {
  if ! docker ps --format '{{.Names}}' | grep -q "^${DB_CONTAINER}$"; then
    echo "  Starting PostgreSQL container..."
    docker start "$DB_CONTAINER" 2>/dev/null || {
      echo "  Creating new PostgreSQL container..."
      docker run -d \
        --name "$DB_CONTAINER" \
        -e POSTGRES_USER="$DB_USER" \
        -e POSTGRES_PASSWORD="$DB_PASSWORD" \
        -e POSTGRES_DB="$DB_NAME" \
        -p "$DB_PORT:5432" \
        postgres:16-alpine
    }
  fi
}

wait_for_postgres() {
  local retries=30
  while [ $retries -gt 0 ]; do
    if docker exec "$DB_CONTAINER" pg_isready -U "$DB_USER" -d "$DB_NAME" > /dev/null 2>&1; then
      return 0
    fi
    retries=$((retries - 1))
    sleep 1
  done
  echo "  Error: PostgreSQL not ready after 30 seconds"
  return 1
}

ensure_database_exists() {
  local db_exists
  db_exists=$(docker exec "$DB_CONTAINER" psql -U "$DB_USER" -tAc "SELECT 1 FROM pg_database WHERE datname='$DB_NAME'" 2>/dev/null || echo "")
  if [ "$db_exists" != "1" ]; then
    echo "  Creating database '$DB_NAME'..."
    docker exec "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_ADMIN_DB" -c "CREATE DATABASE \"$DB_NAME\"" > /dev/null 2>&1
  fi
}

push_schema() {
  echo "  Pushing Drizzle schema..."
  cd "$PROJECT_ROOT"
  pnpm db:push 2>/dev/null || echo "  Warning: db:push failed (schema may need manual setup)"
}

run_schema_setup() {
  if wait_for_postgres; then
    ensure_database_exists
    push_schema
  else
    echo "  Warning: PostgreSQL not available, skipping schema push"
  fi
}

echo "Starting development environment..."
echo ""

echo "Killing existing services on ports 5100, 4000, 4301..."
for PORT in 5100 4000 4301; do
  PID=$(lsof -ti :"$PORT" 2>/dev/null || true)
  if [ -n "$PID" ]; then
    kill -9 $PID 2>/dev/null || true
  fi
done
sleep 2
echo "Ports cleared"
echo ""

echo "Checking PostgreSQL container '${DB_CONTAINER}'..."
cd "$PROJECT_ROOT"
ensure_container_running

if wait_for_postgres; then
  echo "PostgreSQL is ready"
else
  echo "Warning: PostgreSQL not ready"
fi

echo ""
ensure_database_exists
run_schema_setup

echo ""
echo "Starting MinIO..."
docker compose up -d minio minio-setup 2>/dev/null || echo "Warning: MinIO compose services not available (continuing without MinIO)"
sleep 3
echo "MinIO ready"
echo ""

echo "Starting Redis..."
docker compose up -d redis 2>/dev/null || echo "Warning: Redis compose service not available (continuing without Redis)"
sleep 2
echo "Redis ready"
echo ""

echo "Starting workspace dev servers..."
exec pnpm -r --parallel --filter '@agentclave/api-server' --filter '@agentclave/web' --filter '@agentclave/worker' --filter '@agentclave/demo-inventory-api' dev
