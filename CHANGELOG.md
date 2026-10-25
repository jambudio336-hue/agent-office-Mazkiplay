# Changelog

Semua perubahan penting proyek dicatat di sini. Format mengikuti prinsip Keep a Changelog; versi dan tanggal rilis hanya ditetapkan ketika rilis benar-benar diterbitkan.

## [Unreleased] — 2026-10-25

### Added
- Fondasi plugin native `MazkiplayDeviceBridge` untuk memeriksa status layanan aksesibilitas Android, membuka pengaturannya, dan meminta ringkasan layar.
- Layanan aksesibilitas dengan opt-in manual, pembacaan atas permintaan, pengecualian node yang dikenali sebagai kolom kata sandi, batas jumlah teks, dan tanpa pengiriman otomatis.
- Kontrol Device Bridge pada aplikasi mandiri untuk memeriksa izin serta menampilkan ringkasan layar lokal.
- Artwork hero SVG bertema kantor neon untuk halaman README.
- Dokumentasi proyek yang berorientasi pada APK Android: README, roadmap, panduan instalasi, validasi, privasi, dan keamanan.

### Changed
- Workflow Android menyalin sumber plugin native, service, dan resource aksesibilitas ke proyek Capacitor saat build.
- Manifest Android dibubuhi deklarasi AccessibilityService dengan permission dan metadata service.
- Pengujian Device Bridge diselaraskan dengan label kontrol aksesibilitas yang benar pada UI terbaru.
- README menjelaskan perbedaan animasi kantor, status tugas, konektor smoke-test, dan integrasi yang sudah berfungsi.

### Fixed
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
