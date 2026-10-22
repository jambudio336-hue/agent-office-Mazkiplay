# MazkiplayAgentOffice Android — status eksperimental

Folder `android/` berisi fondasi aplikasi Android native Jetpack Compose dengan application ID `com.mazkiplay.agentoffice`. Ini **belum** merupakan port penuh Agent Office dan tidak boleh dipromosikan sebagai APK fullstack setara desktop.

## Yang sudah berfungsi di source saat ini

- Formulir untuk memasukkan API key milik pengguna dan pilihan provider: OpenRouter, OpenAI, Anthropic Claude, DeepSeek, Google Gemini, Cerebras, serta endpoint OpenAI-compatible khusus.
- Key provider dienkripsi dengan AES-GCM sebelum disimpan ke preferensi privat aplikasi. Kunci AES dibuat di Android Keystore dan tidak diekspor oleh aplikasi. Preferensi aplikasi dikecualikan dari backup cloud dan transfer perangkat Android.
- Permintaan katalog model dan chat dikirim langsung dari aplikasi ke endpoint HTTPS provider; tidak ada service/backend Manus atau server Mazkiplay sebagai perantara.
- Katalog OpenRouter diminta secara langsung. Filter “Gratis saja” hanya menampilkan model yang respons katalog saat itu tandai berharga nol; ketersediaan dan syarat model gratis dapat berubah di sisi provider.
- UI native beridentitas MazkiplayAgentOffice, layout Android adaptif, dan kontrol error untuk request/provider.

Saat menekan tombol kirim, API key dan prompt dikirim ke layanan provider yang dipilih, sesuai tindakan pengguna. Untuk OpenRouter, permintaan melalui OpenRouter; untuk provider lain, permintaan langsung ke endpoint provider tersebut. Aplikasi tidak mengklaim inference berjalan lokal/offline.

## Yang belum dipindahkan

Kode desktop yang ada menjalankan worker sebagai proses CLI dan memakai node-pty, git/GitHub CLI, sistem repositori, boards, queue, account sharing, relay/multiplayer, serta kantor 3D. Komponen-komponen tersebut **belum tersedia** di APK ini. Tidak ada local agent/tool loop, shell/worktree Git untuk proyek, worker yang dapat dihire, 3D office, atau mode offline. “OpenCode” adalah runtime CLI, bukan endpoint model API; runtime OpenCode dan integrasi CLI desktop belum dipaketkan untuk Android. Custom OpenAI-compatible hanya bisa digunakan jika layanan tujuan sungguh mendukung protokol itu.

Oleh karena itu artefak sekarang hanya vertical slice native untuk kredensial, katalog model, dan satu request chat; jangan menganggapnya sebagai release lengkap yang memenuhi seluruh fitur repo desktop.

## Build dan status validasi

Memerlukan JDK 17, Android SDK Platform 35 dan Build Tools 35.0.0.

```sh
cd android
ANDROID_HOME="$HOME/Android/Sdk" ./gradlew assembleDebug
```

Status yang benar untuk checkout ini:

- **BUILD SUCCESSFUL** — `assembleDebug` berhasil dikompilasi.
- **VERIFIED** — application ID, label aplikasi, min SDK 26, target SDK 35, dan izin INTERNET diverifikasi dari APK.
- **NOT TESTED** — pemasangan/launch pada perangkat atau emulator; saat build tidak ada perangkat Android/emulator yang terhubung.
- **SKIPPED** — request langsung ke provider dan pengujian model live karena tidak ada API key pengguna yang diberikan (key tidak boleh dikomit atau diminta di chat).
- **NOT RELEASED** — belum ada APK release bertanda tangan pemilik aplikasi; jangan gunakan debug APK sebagai distribusi release.

Jangan menyimpan API key pengguna, keystore penandatanganan release, password signing, atau kredensial provider di repo, APK, log, maupun workflow publik. APK release untuk distribusi perlu ditandatangani dengan kunci release yang pemiliknya kendalikan.
