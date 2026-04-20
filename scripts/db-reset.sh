#!/usr/bin/env sh
set -eu

mkdir -p ".runtime"
rm -f ".runtime/pack-requests.sqlite"
sqlite3 ".runtime/pack-requests.sqlite" < "pack-requests.schema.sql"

echo "Database reset: .runtime/pack-requests.sqlite"
