#!/usr/bin/env bash
set -euo pipefail

cleanup() {
  if [[ -n "${BACKEND_PID:-}" ]]; then kill "$BACKEND_PID" >/dev/null 2>&1 || true; fi
  if [[ -n "${FRONTEND_PID:-}" ]]; then kill "$FRONTEND_PID" >/dev/null 2>&1 || true; fi
}
trap cleanup EXIT INT TERM

echo "Ensuring backend dependencies..."
(cd backend && [ -d node_modules ] || npm i >/dev/null)
(cd backend && npx prisma generate >/dev/null 2>&1 || true)

if [ ! -f backend/.env ]; then
  echo "Creating backend/.env with defaults ..."
  cat > backend/.env <<'EOF'
PORT=5050
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/hrm_local?schema=public"
REDIS_URL="redis://localhost:6379"
JWT_SECRET="replace-with-a-secure-secret"
NODE_ENV=development
UPLOAD_DIR=./uploads
EOF
fi

mkdir -p backend/uploads

# Read PORT from backend/.env for display
BACKEND_PORT=$(grep -E '^PORT=' backend/.env | head -n1 | cut -d'=' -f2)
if [ -z "${BACKEND_PORT}" ]; then BACKEND_PORT=5050; fi

echo "Applying Prisma schema (db push) ..."
(cd backend && npx prisma db push)
echo "Seeding database ..."
(cd backend && npm run prisma:seed)

echo "Ensuring frontend dependencies..."
(cd frontend && [ -d node_modules ] || npm i >/dev/null)

echo "Starting backend (npm run dev) ..."
(cd backend && npm run dev) &
BACKEND_PID=$!

echo "Starting frontend (npm run dev) ..."
(cd frontend && npm run dev) &
FRONTEND_PID=$!

echo "Backend PID: $BACKEND_PID | Frontend PID: $FRONTEND_PID"
echo "- Backend:  http://localhost:${BACKEND_PORT}"
echo "- Frontend: http://localhost:3000"

# On macOS default bash, wait -n is unavailable; wait for both until interrupted
wait "$BACKEND_PID"
wait "$FRONTEND_PID"


