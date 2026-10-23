# MazkiplayAgentOffice Android — local-agent preview

`android/` adalah klien Android native Jetpack Compose yang menambahkan agent tool-loop terbatas di perangkat. Ini merupakan **preview eksperimen dan belum setara dengan full desktop Agent Office**.

## Yang benar-benar berjalan di APK

- API key BYOK dienkripsi secara lokal menggunakan AES-GCM dan key non-exportable dari Android Keystore. Preferensi yang berisi key dikecualikan dari Android backup/device transfer.
- Katalog model dan chat satu putaran dikirim langsung melalui HTTPS ke provider yang dipilih. Tidak ada backend Mazkiplay/Manus untuk inference.
- Agent menjalankan loop tool-calling OpenAI-compatible dari perangkat: `workspace_list`, `workspace_read`, `workspace_search`, dan `workspace_write`.
- Workspace berada di direktori privat aplikasi (`files/agent-workspace`), bukan seluruh penyimpanan HP. Pembacaan/penulisan dibatasi dalam sandbox itu; traversal dan symlink keluar ditolak.
- Setiap pembuatan/penggantian file membutuhkan konfirmasi eksplisit pengguna dengan preview isi. Penolakan dilaporkan sebagai `SKIPPED`; batas loop adalah 8 giliran model/20 pemanggilan tool. File teks dibatasi 256 KiB.
- Workspace dapat diekspor sebagai ZIP melalui Android document picker (maksimum 500 file dan 20 MiB). File tidak otomatis dibagikan atau diunggah.
- OpenRouter, OpenAI, DeepSeek, Cerebras, dan endpoint OpenAI-compatible kustom dapat dicoba untuk tool-calling jika model/endpoint terkait benar-benar mendukung OpenAI Chat Completions `tools`. Provider dapat menolak pemanggilan tools atau mengenakan biaya sesuai model dan akun.

Saat pengguna menjalankan agent, API key, prompt/tugas, konteks file yang diminta agent, dan hasil tool yang relevan dikirim langsung ke provider untuk menghasilkan langkah berikutnya. Jangan masukkan data sensitif ke workspace atau prompt kecuali pengguna memahami pengiriman tersebut.

## Status capability yang belum didukung

- **Claude/Anthropic dan Gemini:** chat biasa didukung oleh gateway yang ada; tool-calling agent native belum diimplementasikan dan harus dilaporkan `NOT_SUPPORTED`, bukan disimulasikan.
- **Desktop CLI workers/OpenCode runtime, shell/terminal, PTY, proses Node, git/worktree/GitHub, boards/queue, akun/kolaborasi, relay, kantor 3D, dan inference offline:** belum dipindahkan ke Android. APK tidak menjalankan perintah shell atau mengakses repo/folder eksternal.
- Tidak ada impor otomatis proyek dari folder HP pada preview ini. Workspace baru berada di sandbox privat aplikasi; pengguna dapat mengekspor ZIP untuk mengambil berkas.
- Provider live calls, performa pada perangkat fisik, dan instalasi di emulator belum diuji pada sesi build ini. Tanpa konfigurasi key/provider yang nyata, statusnya **NOT TESTED**.

“OpenCode” adalah runtime CLI, bukan nama protokol endpoint model. Memasukkan endpoint kompatibel hanya bekerja jika servis tersebut benar-benar mengimplementasikan protokol dan tool calling yang diharapkan.

## Build & verifikasi

Membutuhkan JDK 17, Android SDK Platform 35, dan Build Tools 35.0.0.

```sh
cd android
ANDROID_HOME="$HOME/Android/Sdk" ./gradlew testDebugUnitTest lintDebug assembleDebug
```

Validasi preview dilakukan dengan unit test workspace nyata (operasi tulis/baca/cari/list, traversal, symlink, dan isi ZIP), Android lint, dan kompilasi APK debug. **NOT TESTED:** UI pada perangkat/emulator dan transaksi provider live. APK debug bukan APK release untuk distribusi publik.

Jangan menyimpan API key provider, password signing, atau keystore release di repo, APK, log, atau CI publik. Release publik harus menggunakan signing key yang pemilik aplikasi kendalikan.
