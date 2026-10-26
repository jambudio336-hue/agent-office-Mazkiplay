#!/data/data/com.termux/files/usr/bin/bash
set -Eeuo pipefail
if [[ -z "${PREFIX:-}" || "$PREFIX" != *com.termux* ]]; then
  echo "Skrip ini khusus Termux." >&2
  exit 1
fi
pkg update
pkg install -y nodejs-lts git python make clang
ROOT="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
NODE_MAJOR="$(node -p 'Number(process.versions.node.split(".")[0])')"
(( NODE_MAJOR >= 20 )) || { echo "Diperlukan Node.js >=20." >&2; exit 1; }
if ! npm ci; then
  cat >&2 <<'MSG'
Dependensi native gagal dipasang. Proyek menggunakan @lydell/node-pty, dan
dukungan pseudo-terminal native pada Android/Termux bergantung pada ABI dan
toolchain. Tidak aman untuk menyamarkan kegagalan ini.
Jika error menyebut node-pty atau node-gyp, dukungan Termux membutuhkan adapter
PTY yang kompatibel atau pemisahan fitur terminal terlebih dahulu.
MSG
  exit 2
fi
npm run typecheck
npm test
npm run build
echo "Buka http://127.0.0.1:4600 di browser Android. Hentikan dengan Ctrl+C."
exec npm start -- --host 127.0.0.1 --port 4600 --no-open
