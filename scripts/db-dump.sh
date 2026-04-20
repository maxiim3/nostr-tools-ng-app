#!/usr/bin/env sh
set -eu

if [ ! -f ".runtime/pack-requests.sqlite" ]; then
  echo "Missing .runtime/pack-requests.sqlite"
  exit 1
fi

sqlite3 ".runtime/pack-requests.sqlite" ".dump pack_requests" > "pack-requests.dump.sql"

echo "Dump written to pack-requests.dump.sql"
