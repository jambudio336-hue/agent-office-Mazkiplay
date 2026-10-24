# APK Android

Repository ini sekarang memiliki aplikasi pendamping Android native untuk dashboard mobile Agent Office. APK membuka halaman kantor `/lite` di dalam Android WebView yang dibatasi ke server HTTPS. Alamat server yang dimasukkan di ponsel disimpan untuk pemakaian berikutnya. APK adalah klien jarak jauh; APK tidak menjalankan Node.js atau CLI penyedia AI di ponsel.

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
