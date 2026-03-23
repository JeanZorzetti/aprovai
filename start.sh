#!/bin/sh
set -e

echo "[AprovAI] Running database migrations..."
npx prisma migrate deploy 2>/dev/null || echo "[AprovAI] Migration skipped (DB may not be ready)"

echo "[AprovAI] Starting server..."
node server.js
