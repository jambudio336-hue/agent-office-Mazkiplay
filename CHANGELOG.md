# Changelog

Semua perubahan penting proyek dicatat di sini. Format mengikuti prinsip Keep a Changelog; versi dan tanggal rilis hanya ditetapkan ketika rilis benar-benar diterbitkan.

## [Unreleased] — 2026-10-25

### Added
- Kontrol ganti nama untuk setiap profil karyawan AI; nama baru langsung tercermin di daftar dan pemilih perintah karyawan, dengan validasi nama kosong dan batas 48 karakter.
- Pengujian regresi untuk alur ganti nama karyawan AI dan keterpanggilan melalui Pusat Perintah Perangkat.
- Fondasi plugin native `MazkiplayDeviceBridge` untuk memeriksa status layanan aksesibilitas Android, membuka pengaturannya, dan meminta ringkasan layar.
- Layanan aksesibilitas dengan opt-in manual, pembacaan atas permintaan, pengecualian node yang dikenali sebagai kolom kata sandi, batas jumlah teks, dan tanpa pengiriman otomatis.
- Kontrol Device Bridge pada aplikasi mandiri untuk memeriksa izin serta menampilkan ringkasan layar lokal.
- Artwork hero SVG bertema kantor neon untuk halaman README.
- Dokumentasi proyek yang berorientasi pada APK Android: README, roadmap, panduan instalasi, validasi, privasi, dan keamanan.

### Changed
- Panel operasional kantor kini menerima event mulai/selesai/gagal dari eksekusi tugas AI, memperbarui status serta log aktivitas berdasarkan tugas yang benar-benar dijalankan.
- Refresh UI/UX premium dengan palet arang dan emas lembut, hierarki tipografi lebih rapi, panel dashboard yang konsisten, fokus keyboard, serta responsivitas layar kecil dan orientasi landscape.
- Perbaikan safe-area intro pada Android: gambar memakai object-fit contain, teks dibatasi area aman, tombol Lewati intro tetap terjangkau, dan tinggi viewport dinamis.
- Pembaruan visual kantor virtual agar zonasi, meja, layar, log aktivitas, dan status keamanan lebih terbaca tanpa menyamarkan animasi simulasi sebagai aktivitas AI nyata.
- Workflow Android menyalin sumber plugin native, service, dan resource aksesibilitas ke proyek Capacitor saat build.
- Manifest Android dibubuhi deklarasi AccessibilityService dengan permission dan metadata service.
- Pengujian Device Bridge diselaraskan dengan label kontrol aksesibilitas yang benar pada UI terbaru.
- README menjelaskan perbedaan animasi kantor, status tugas, konektor smoke-test, dan integrasi yang sudah berfungsi.

### Fixed
- Menyamakan dokumentasi aset intro di `intro.js` dengan nama PNG yang benar-benar dipaketkan oleh workflow Android; menghindari kebingungan saat menelusuri aset startup.
- Menghapus deklarasi ganda backupStatus pada APK mandiri yang menyebabkan pemeriksaan sintaks JavaScript gagal sebelum suite pengujian selesai.
- Memperbaiki ekspektasi pengujian lama yang mencari teks aksesibilitas yang sudah tidak digunakan sehingga tes tidak lagi gagal hanya karena perubahan label UI.

### Security
- Aksesibilitas tetap memerlukan persetujuan/aktivasi pengguna di pengaturan Android.
- Bridge saat ini tidak melakukan klik, mengetik, submit formulir, pendaftaran akun otomatis, atau mengunggah isi layar.
- Jangan menganggap ringkasan layar aman untuk dibagikan; informasi sensitif yang terlihat di layar tetap perlu dihindari.

### Validation status
- Pemeriksaan sumber dan pengujian workflow harus diverifikasi pada [GitHub Actions](https://github.com/jambudio336-hue/agent-office-Mazkiplay/actions).
- APK tidak dinyatakan tervalidasi sampai build terbaru selesai sukses dan artefak APK dari run yang sama tersedia.
- Pengujian pada perangkat Android fisik tetap diperlukan untuk memastikan perilaku runtime dan kompatibilitas perangkat.

## Riwayat format

- **Added** — fitur baru.
- **Changed** — perubahan perilaku atau dokumentasi.
- **Fixed** — perbaikan bug.
- **Security** — perubahan yang berkaitan dengan keamanan dan privasi.
- **Validation status** — status pemeriksaan, bukan klaim bahwa semua pengujian telah lulus.
