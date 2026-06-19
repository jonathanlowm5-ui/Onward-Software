#!/usr/bin/env bash
#
# firebase-deploy.sh — build the two frontends and deploy the whole stack
# (Hosting x2 + Cloud Functions API + Firestore rules) to Firebase.
#
# Prerequisites (one-time, see FIREBASE_DEPLOY.md):
#   1. The Firebase project must be on the Blaze (pay-as-you-go) plan.
#   2. A Firestore database must exist (Native mode).
#   3. Export a CI token:  export FIREBASE_TOKEN="$(firebase login:ci output)"
#
# Usage:  FIREBASE_TOKEN=1//xxxx ./firebase-deploy.sh
#
set -euo pipefail

PROJECT="${FIREBASE_PROJECT:-onwards-61e6c}"
ADMIN_SITE="${FIREBASE_ADMIN_SITE:-onwards-61e6c-admin}"
ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"

if [ -z "${FIREBASE_TOKEN:-}" ]; then
  echo "ERROR: FIREBASE_TOKEN is not set."
  echo "  On your own machine run:  firebase login:ci"
  echo "  then:  export FIREBASE_TOKEN='<the token it prints>'"
  exit 1
fi

echo "==> [1/5] Building customer frontend (onward-react)"
( cd onward-react && npm install --no-audit --no-fund && npm run build )

echo "==> [2/5] Building admin panel (onward-admin)"
( cd onward-admin && npm install --no-audit --no-fund && npm run build )

echo "==> [3/5] Ensuring admin Hosting site '$ADMIN_SITE' exists"
firebase hosting:sites:create "$ADMIN_SITE" --project "$PROJECT" 2>/dev/null \
  || echo "    (site already exists — continuing)"

echo "==> [4/5] Binding Hosting targets"
firebase target:apply hosting frontend "$PROJECT"    --project "$PROJECT"
firebase target:apply hosting admin    "$ADMIN_SITE" --project "$PROJECT"

echo "==> [5/5] Deploying Firestore rules + Functions + Hosting"
firebase deploy \
  --only firestore:rules,functions,hosting \
  --project "$PROJECT" \
  --non-interactive --force

echo ""
echo "==> Deploy complete."
echo "    Customer site : https://${PROJECT}.web.app"
echo "    Admin panel   : https://${ADMIN_SITE}.web.app"
echo "    API health    : https://${PROJECT}.web.app/api/health"
