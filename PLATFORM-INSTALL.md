# Mazkiplay Agent Office — instalasi lintas platform

Dokumen ini menjelaskan cara menjalankan server dan antarmuka web Agent Office di localhost. Ini bukan installer desktop bertanda tangan, bukan paket macOS .app/Windows .exe, dan bukan APK. APK Android tetap dibangun lewat workflow Android APK terpisah.

## Persyaratan

- Node.js 20 atau lebih baru dan npm.
- Git untuk mengambil repository.
- Koneksi internet saat mengambil repository/dependensi pertama kali.
- Pada Linux, toolchain build native mungkin diperlukan oleh dependensi terminal.
- Beberapa fitur pekerja memerlukan CLI/provider AI tersendiri dan kredensial yang valid. UI kantor dapat dibuka tanpa berarti semua provider telah dikonfigurasi.

## Ambil kode

\`\`\`bash
git clone --branch feat/free-local-ai-mode https://github.com/jambudio336-hue/agent-office-Mazkiplay.git
cd agent-office-Mazkiplay
\`\`\`

## Linux dan macOS

Di dalam folder repository, jalankan:

\`\`\`bash
bash scripts/install-local.sh
\`\`\`

Skrip memasang dependensi terkunci, menjalankan typecheck dan tes, membuat build, lalu memulai server yang hanya mendengarkan di loopback. Buka http://localhost:4600 di browser pada komputer yang sama. Tekan Ctrl+C untuk berhenti.

## Windows 10/11 (PowerShell)

Di dalam folder repository, jalankan:

\`\`\`powershell
Set-ExecutionPolicy -Scope Process Bypass
.\scripts\install-local.ps1
\`\`\`

Skrip memeriksa Node.js, memasang dependensi, menjalankan typecheck/tes/build, lalu menjalankan server pada http://localhost:4600. Jika pemasangan dependensi native gagal, baca error npm; jangan abaikan kegagalan tersebut.

## Termux di Android — eksperimental

Termux bukan distribusi Linux desktop dan menggunakan ABI Android. Dependensi terminal native proyek mungkin belum kompatibel di semua perangkat. Coba setelah meng-clone repository:

\`\`\`bash
bash scripts/install-termux.sh
\`\`\`

Skrip berhenti dengan pesan yang jelas bila pemasangan dependensi native gagal. Jangan menganggap Termux didukung penuh sebelum skrip, tes, dan fitur terminal berhasil pada perangkat nyata. Jika gagal di @lydell/node-pty/node-gyp, jalur Termux memerlukan adapter PTY Android atau pemisahan fitur terminal terlebih dahulu.

## Keamanan localhost

- Server diarahkan ke 127.0.0.1; hanya perangkat/komputer itu sendiri yang dapat mengaksesnya.
- Jangan mengganti host ke 0.0.0.0 pada jaringan publik. Aplikasi dapat menjalankan perintah/pekerja pada mesin lokal.
- Jangan commit password, token GitHub, API key, atau file konfigurasi lokal.
- Fitur AI cloud dapat memakai kuota/biaya provider. Localhost tidak otomatis berarti inferensi AI berjalan offline.
- Perintah setup ini melakukan pemeriksaan proyek; hasil sukses pada satu OS tidak membuktikan semua OS kompatibel. Setiap platform tetap perlu diuji secara terpisah.

## Batas dukungan saat ini

| Platform | Jalur | Status |
|---|---|---|
| Android | APK mandiri dari GitHub Releases | Build CI dapat menghasilkan APK; uji perangkat fisik tetap diperlukan |
| Linux desktop | Node.js + localhost | Skrip tersedia; perlu uji pada distro target |
| macOS | Node.js + localhost | Skrip tersedia; perlu uji pada Intel dan Apple Silicon bila ditargetkan |
| Windows | PowerShell + localhost | Skrip tersedia; perlu uji pada Windows target |
| Termux | Node.js + localhost | Eksperimental; modul PTY native mungkin tidak kompatibel |

Lihat GitHub Actions dan Releases untuk status build aktual:
- https://github.com/jambudio336-hue/agent-office-Mazkiplay/actions
- https://github.com/jambudio336-hue/agent-office-Mazkiplay/releases
