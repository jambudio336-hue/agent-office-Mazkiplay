#!/usr/bin/env bash
set -Eeuo pipefail
ROOT="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
command -v node >/dev/null || { echo "Pasang Node.js 20+ terlebih dahulu." >&2; exit 1; }
command -v npm >/dev/null || { echo "npm tidak ditemukan." >&2; exit 1; }
NODE_MAJOR="$(node -p 'Number(process.versions.node.split(".")[0])')"
(( NODE_MAJOR >= 20 )) || { echo "Diperlukan Node.js >=20; terdeteksi $(node --version)." >&2; exit 1; }
echo "==> npm ci"
npm ci
echo "==> Typecheck"
npm run typecheck
echo "==> Tes"
npm test
echo "==> Build"
npm run build
echo
echo "Buka http://localhost:4600 pada browser di komputer ini."
echo "Tekan Ctrl+C untuk menghentikan server."
exec npm start -- --host 127.0.0.1 --port 4600 --no-open
