# Mazkiplay Hacker AI — APK Android

Repository ini sekarang memiliki aplikasi pendamping Android native untuk dashboard mobile Mazkiplay Hacker AI. APK membuka halaman kantor `/lite` di dalam Android WebView yang dibatasi ke server HTTPS. Alamat server yang dimasukkan di ponsel disimpan untuk pemakaian berikutnya. APK adalah klien jarak jauh; APK tidak menjalankan Node.js atau CLI penyedia AI di ponsel.

## Lokasi karyawan AI berjalan

Server Agent Office harus tetap hidup di komputer atau server yang memiliki Node.js serta minimal satu CLI agen yang didukung dan sudah login. Worker berjalan di sana, tempat file proyek dan tool penyedia AI tersedia. APK menghubungkan ponsel ke kantor itu agar Anda dapat melihat karyawan, membuka terminal live, memberi tugas, dan memakai kontrol mobile. Menutup APK tidak menghentikan worker selama server host dan proses worker tetap hidup.

Kemampuan tiap worker bergantung pada provider, model, izin proyek, dan tool yang tersedia. APK tidak menyediakan akun AI, kredit API, atau jumlah worker tanpa batas. Batas worker kantor dan kapasitas mesin host tetap berlaku.

## Membuat dan memasang APK debug

Pasang JDK 17 atau yang lebih baru serta Android SDK Platform 36 dan Build Tools 36.0.0. Dari root repository, jalankan:

```sh
cd android
./gradlew assembleDebug
```

APK debug yang bisa dipasang berada di `android/app/build/outputs/apk/debug/app-debug.apk`. Untuk memasangnya lewat USB debugging pada perangkat Android yang sudah diotorisasi:

```sh
adb install -r app/build/outputs/apk/debug/app-debug.apk
```

Workflow GitHub Actions juga membangun APK ini pada pull request dan menyimpan artefak bernama `m4zkiplay-agent-office-android-debug` selama 14 hari. Tanda tangan debug cocok untuk pengujian dan pemasangan manual; publikasi melalui Google Play memerlukan build release yang ditandatangani dengan release key milik Anda.

## Menghubungkan ponsel

Saat pertama dibuka, masukkan alamat HTTPS kantor, misalnya `https://agent-office.example.com`; aplikasi akan menambahkan `/lite`. Tekan **Server** di bar atas jika ingin mengganti alamat. APK hanya menerima HTTPS, menyimpan alamat server secara lokal, dan menyerahkan autentikasi kantor ke halaman login Agent Office. APK tidak menanam kredensial provider dan tidak melewati sertifikat TLS yang tidak valid.

Server yang hanya mendengarkan di `127.0.0.1` pada laptop tidak dapat dijangkau sebagai `localhost` milik ponsel. Berikan kantor alamat HTTPS valid yang bisa dijangkau ponsel, misalnya melalui deployment server atau Tailscale Serve. Sertifikat self-signed atau kedaluwarsa sengaja ditolak. Jangan membuka kantor langsung ke internet publik tanpa HTTPS dan kontrol akses.

APK memerlukan koneksi jaringan. APK belum menyediakan notifikasi push latar belakang, dan proses AI tidak di-host di ponsel. Biarkan komputer/server host hidup agar pekerjaan yang ditugaskan bisa terus berjalan.

## AI provider modes in the chat client

The web chat settings offer three kinds of operation:
- **OpenRouter/OpenAI/custom online API:** requires a user-supplied API key. Free model availability and limits depend on the provider and can change.
- **Local LLM endpoint:** no provider API key is sent when using the `local` mode. A compatible model server must already be running and reachable from the same Android device, for example a llama.cpp server exposed at `http://127.0.0.1:8080/v1`. The user must install/download the runtime and model separately. On Ollama, configure its actual local endpoint and model ID instead. WebView/browser local-network and CORS restrictions may require server configuration; this is not yet validated on a physical phone.
- **Offline basic mode:** runs a small rule-based helper in the client with no network and no API key. It is not an LLM, does not run commands, and is not a substitute for Qwen or another language model.

No hosted LLM can be promised to work online for free without credentials or a service budget. The client must not claim a request was sent to a model if it used the offline rules. The local-model path is a configured endpoint only; automatic model installation, model download management, and the complete Termux execution/result loop are still separate work.

## Catatan rilis Mazkiplay JARVIS (30 Oktober 2026)

Halaman web `/jarvis.html` kini memakai antarmuka suara tanpa transkrip atau balon chat yang terlihat. Gaya respons default diarahkan ke Bahasa Indonesia santai dengan sapaan gue–lu dan panggilan bro yang wajar. Halaman ini membaca konfigurasi provider/model dari penyimpanan browser Agent Office (`mazkiplay.ai.settings.v1`) dan memerlukan izin mikrofon, browser yang mendukung Web Speech API, koneksi/provider AI yang dikonfigurasi, serta suara Bahasa Indonesia yang tersedia pada perangkat.

**Batas integrasi Android:** APK native saat ini tetap merupakan klien jarak jauh yang membuka `/chat.html` pada server HTTPS. APK tidak membundel halaman web/server dan belum menjadikan `/jarvis.html` sebagai layar awal atau menyediakan pengujian mikrofon native khusus untuk halaman JARVIS. Untuk memakai JARVIS, halaman web harus tersedia pada server Agent Office yang terhubung dan dibuka melalui browser yang mendukung fitur suara. Build APK di GitHub Actions adalah varian release yang ditandatangani dengan debug keystore untuk distribusi uji, bukan signing key produksi.
