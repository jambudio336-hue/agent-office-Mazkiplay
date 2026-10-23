# Mazkiplay Agent Office untuk Android

## Status dan rancangan

Workflow `.github/workflows/android-apk.yml` membangun paket APK Android melalui GitHub Actions. APK ini merupakan **klien Android yang membuka server Agent Office yang sudah di-deploy**, bukan server Node.js penuh yang berjalan di dalam ponsel.

Server Agent Office memakai Node.js, proses terminal/PTY, dan coding-agent CLI. Komponen tersebut tidak otomatis dapat dijalankan di Android hanya dengan membungkus halaman web. Karena itu server harus tersedia di alamat HTTPS yang bisa dijangkau ponsel.

## Cara membuat APK

1. Deploy server Agent Office terlebih dahulu pada server Linux/hosting yang mendukung Node.js dan proses worker.
2. Pastikan server menggunakan HTTPS dan login/akun dilindungi.
3. Buka tab **Actions** di GitHub.
4. Jalankan workflow **Android APK** dengan tombol **Run workflow**.
5. Isi `office_server_url` dengan alamat HTTPS server milik sendiri.
6. Pilih apakah ingin menerbitkan GitHub Release publik.
7. Setelah workflow berhasil, unduh APK dari bagian **Artifacts** atau dari **Releases** bila opsi publikasi dipilih.

## Catatan keamanan dan batasan

- APK dibangun sebagai `unsigned` release untuk tahap awal. Sebelum distribusi yang lebih luas, tandatangani dengan Android keystore milik pemilik aplikasi; jangan pernah commit keystore atau kata sandinya ke repo.
- Jangan memasukkan API key provider ke URL server atau ke kode sumber.
- URL server harus HTTPS. Jangan gunakan server demo yang tidak dikuasai sendiri untuk menyimpan rahasia atau menjalankan tugas.
- Workflow ini belum membuat server cloud, belum menambahkan integrasi langsung API OpenAI/Gemini/DeepSeek/Claude/OpenRouter, dan belum mengubah pekerja menjadi 20 orang. Itu pekerjaan backend terpisah yang perlu ditambahkan dan diuji.
- Untuk mengubah URL server yang digunakan APK, jalankan ulang workflow dengan alamat HTTPS baru.
