#!/usr/bin/env bash
# Starts backend + frontend + admin together. Ctrl-C stops all.
set -e
here="$(cd "$(dirname "$0")" && pwd)"
( cd "$here/onward-integration/backend" && npm install && npm start ) &
( cd "$here/onward-react" && npm install && npm run dev ) &
( cd "$here/onward-admin" && npm install && npm run dev ) &
trap 'kill 0' EXIT
wait
