#!/usr/bin/env bash
set -e

echo "Subindo infraestrutura..."
docker compose up -d

echo "Infraestrutura iniciada."
echo "Postgres: localhost:5432"
echo "LocalStack: http://localhost:4566"