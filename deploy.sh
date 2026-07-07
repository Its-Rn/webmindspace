#!/usr/bin/env bash
set -euo pipefail

echo "=== Building for production ==="

# Install dependencies
npm ci

# Build client
npm run build --workspace client

# Copy .env if needed
if [ ! -f server/.env ]; then
  cp .env.example server/.env
  echo "Created server/.env from .env.example — update it with production values."
fi

# Start server (serves API + built client)
echo "=== Starting server ==="
npm run start
