#!/usr/bin/env sh
set -eu

if [ ! -f "pack-requests.dump.sql" ]; then
  echo "Missing pack-requests.dump.sql"
  exit 1
fi

mkdir -p ".runtime"
rm -f ".runtime/pack-requests.sqlite"
sqlite3 ".runtime/pack-requests.sqlite" < "pack-requests.dump.sql"

echo "Database restored from pack-requests.dump.sql"
