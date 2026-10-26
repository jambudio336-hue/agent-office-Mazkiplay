$ErrorActionPreference = "Stop"
Set-Location (Join-Path $PSScriptRoot "..")
if (-not (Get-Command node -ErrorAction SilentlyContinue) -or -not (Get-Command npm -ErrorAction SilentlyContinue)) {
  throw "Node.js 20+ dan npm wajib terpasang. Unduh Node.js dari https://nodejs.org/ lalu buka ulang PowerShell."
}
$nodeMajor = [int]((& node -p "Number(process.versions.node.split('.')[0])").Trim())
if ($nodeMajor -lt 20) { throw "Proyek memerlukan Node.js >=20." }
npm ci
if ($LASTEXITCODE -ne 0) { throw "npm ci gagal." }
npm run typecheck
if ($LASTEXITCODE -ne 0) { throw "Typecheck gagal." }
npm test
if ($LASTEXITCODE -ne 0) { throw "Tes gagal." }
npm run build
if ($LASTEXITCODE -ne 0) { throw "Build gagal." }
Write-Host "Buka http://localhost:4600 pada browser komputer ini. Tekan Ctrl+C untuk berhenti."
npm start -- --host 127.0.0.1 --port 4600 --no-open
exit $LASTEXITCODE
