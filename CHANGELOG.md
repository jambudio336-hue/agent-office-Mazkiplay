## [Unreleased] — Patch Lab secret guard

### Security
- Pemindai lokal sebelum operasi tulis memeriksa pola berkeyakinan tinggi untuk private key, GitHub token, AWS access key, OpenAI project key, dan Google API key pada usulan satu file maupun multi-file.
- Jika pola terdeteksi, operasi pembuatan branch/commit/PR dibatalkan dan aplikasi menampilkan nama kategori serta path, tanpa menampilkan nilai rahasia.
- Pemindai berbasis pola dapat melewatkan rahasia yang tidak dikenal dan dapat menghasilkan false positive; lakukan secret scanning khusus di CI dan rotasi kredensial yang terlanjur terekspos.

---

## [Unreleased] — Patch Lab safety tests and diagnostics reliability

### Improved
- Tes regresi Patch Lab memeriksa validasi branch/path, pemuatan file sumber, konfirmasi sebelum menulis, Draft PR, serta batas 5 file dan 18.000 karakter konteks.
- Tombol diagnostik mengembalikan Promise pemeriksaan agar dapat diuji secara deterministik tanpa jeda berbasis timer.
- Default branch pada GitHub Workspace dan Patch Lab diselaraskan dengan branch pengembangan aktif `feat/free-local-ai-mode`.
- Workflow Android memasukkan suite tes keamanan Patch Lab ke tahap validasi.

### Verification
- Pemeriksaan CI sebelumnya menemukan dua tes Pusat Performa membaca status sebelum pemeriksaan asinkron selesai. Handler dan tes telah diperbaiki agar pengujian dapat menunggu hasil sebenarnya.
- Hasil build terbaru perlu dilihat pada run yang dipicu oleh commit pengujian ini; belum menyatakan APK final lulus sebelum run selesai.

---

## [Unreleased] — QA Lab and Release Gate

### Added
- Panel QA Lab untuk memeriksa status workflow Android APK melalui GitHub API read-only setelah GitHub Workspace terhubung.
- Status CI dianggap lulus hanya jika workflow Android APK selesai dengan kesimpulan sukses dan SHA run sama dengan HEAD branch yang diperiksa.
- Checklist manual terpisah untuk review source, instalasi APK, inferensi AI lokal, izin perangkat, dan verifikasi checksum.
- Tes regresi untuk validasi wiring QA Lab, perbandingan SHA branch, dan gerbang checklist; workflow Android menjalankan tes ini sebelum build native.

### Security and limitations
- Pemeriksaan status CI memerlukan token GitHub yang memiliki izin Actions: read dan Contents: read; token tetap dikelola melalui mekanisme penyimpanan rahasia aplikasi yang ada.
- Checklist manual tidak memverifikasi perangkat secara otomatis dan hanya boleh ditandai setelah pengujian benar-benar dilakukan.
- Status workflow terbaru masih berjalan saat dokumentasi ini diperbarui; APK belum dinyatakan lulus build dari run tersebut.

---

## [Unreleased] — AI Mission Control

### Added
- Panel AI Mission Control untuk mengubah satu tujuan menjadi empat tahap: perencanaan, implementasi, QA, dan tinjauan keamanan.
- Eksekusi misi berurutan melalui Task Board yang sudah ada; hanya satu tahap dijalankan pada satu waktu.
- Keluaran tahap sebelumnya diteruskan sebagai konteks ke tahap berikutnya, dengan batas konteks agar ukuran prompt tetap terkendali.
- Status progres, pemulihan misi yang terputus sebagai dijeda, percobaan ulang tahap gagal, serta kontrol jeda setelah tugas aktif selesai.
- Tautan navigasi drawer dan pemeriksaan CI untuk kelengkapan UI, logika orkestrasi, serta CSS Mission Control.

### Security and limitations
- Mission Control menghasilkan keluaran AI untuk ditinjau; ia tidak menerapkan patch ke repository, tidak merge, dan tidak menyatakan tes lulus tanpa bukti.
- Setiap tahap membutuhkan AI lokal yang aktif atau provider API yang sudah dikonfigurasi; provider cloud dapat memakai kuota/biaya.
- Build Android dan pengujian runtime terbaru tetap perlu dikonfirmasi melalui GitHub Actions dan perangkat fisik.

---

## [Unreleased] — AI offline download hardening

### Fixed
- Gunakan referensi koneksi HTTP non-null yang eksplisit untuk setiap hop redirect dan koneksi final; ini menghindari ketergantungan pada smart-cast variabel nullable saat kompilasi Kotlin.

### Security
- Batasi setiap unduhan model Qwen3 hingga batas maksimum ukuran berkas, termasuk ketika server tidak mengirim Content-Length, untuk mengurangi risiko penyimpanan terkuras oleh berkas berlebihan.
- Validasi setiap redirect unduhan model dan tolak tujuan HTTP/non-HTTPS atau rantai redirect berlebihan.
- Pulihkan tombol diagnostik performa pada blok `finally` meskipun runtime melempar error; tampilkan pesan error yang bisa ditindaklanjuti.

### Validation
- Menambahkan tes regresi untuk pemulihan diagnostik ketika probe runtime gagal.
- Build Android dan tes runtime terbaru tetap harus dikonfirmasi lewat GitHub Actions; belum ada klaim verifikasi perangkat fisik.

---

## [Unreleased] — Adaptive Performance Center

### Added
- Tes runtime Node.js untuk memverifikasi pemulihan preferensi, penyimpanan toggle, estimasi storage, jumlah pekerja/tugas, dan penanganan storage yang tidak tersedia.
- Workflow Android menjalankan tes runtime Performance Center sebelum membuat proyek native, sehingga regresi logika lokal dapat menghentikan build lebih awal.
- Panel diagnostik lokal untuk menampilkan indikator perangkat yang tersedia, estimasi penyimpanan, jumlah pekerja, dan jumlah tugas.
- Mode Hemat Performa yang mengurangi animasi/transisi dekoratif untuk membantu responsivitas pada perangkat terbatas.
- Preferensi mode hemat disimpan secara lokal; panel tidak mengirim telemetry atau membuat permintaan jaringan.
- Validasi workflow untuk sintaks modul, wiring UI, dan stylesheet pusat performa.

### Notes
- Mode hemat tidak mengubah kecepatan CPU/GPU, inferensi model, atau kualitas jaringan.
- Nilai RAM/thread bergantung pada dukungan WebView; diagnostik bukan benchmark perangkat atau uji inferensi.
- Status build Actions terbaru dan pengujian pada perangkat fisik tetap harus diperiksa.

---

## [Unreleased] — Adaptive launcher icon coverage

### Fixed
- Workflow APK kini menghasilkan ikon karakter anime dark untuk bitmap launcher biasa, ikon bulat, dan adaptive foreground Android pada semua density standar.
- Menambahkan pemeriksaan resource agar foreground adaptive ikut tersedia ketika template launcher Capacitor merujuknya.

### Validation
- Perubahan workflow sudah dikomit; status build baru harus diperiksa di GitHub Actions sebelum APK dinyatakan berhasil.
- Tampilan ikon pada launcher perangkat fisik tetap belum diverifikasi.

---

## [Unreleased] — Android launcher icon

### Added
- Workflow Android kini merender aset `assets/dark-anime-app-icon.svg` menjadi bitmap launcher `ic_launcher.png` untuk density mdpi sampai xxxhdpi saat build APK.
- Pemasangan ikon dijalankan setelah Capacitor membuat proyek Android, sehingga tidak perlu menyimpan hasil PNG turunan secara manual di repository.

### Validation
- Periksa hasil Android APK workflow terbaru. Keberhasilan build tidak menggantikan verifikasi visual ikon di launcher perangkat fisik.

---

## [Unreleased] — Visual refresh

### Added
- Menambahkan ilustrasi karakter anime dark orisinal dalam format SVG di `assets/dark-anime-app-icon.svg`.
- Memperbarui README dengan aset visual animasi kantor neon dan ilustrasi karakter.
- Menambahkan catatan transparan bahwa aset SVG belum otomatis menjadi launcher icon pada APK.

### Pending verification
- Pemasangan ikon Android memerlukan resource launcher yang sesuai dengan struktur native Android dan validasi build APK terbaru.
- Build APK terbaru dan tampilan pada perangkat fisik belum dinyatakan lulus sampai GitHub Actions dan pengujian perangkat diperiksa.

---

## [Unreleased] — Task Board quick-start templates

### Added
- Template tugas cepat untuk audit QA, audit keamanan defensif, rancangan aplikasi web full-stack, dan rancangan aplikasi Android.
- Setiap template menyimpan instruksi khusus bersama tugas sehingga konteks tersebut benar-benar dikirim ke model AI saat tugas dijalankan.
- Template tetap menjadi titik awal: hasil harus ditinjau, dan aplikasi tidak mengklaim pengujian atau perubahan kode telah terjadi tanpa bukti.

### Validation
- Android APK workflow perlu diperiksa pada commit terbaru sebelum menyatakan build lulus.

---

## [Unreleased] — Task reliability and checkpoints

### Added
- Metadata tugas yang menampilkan jumlah percobaan dan waktu pembaruan terakhir.
- Checkpoint hasil: sebelum tugas dijalankan ulang, output lama disimpan dan dapat dipulihkan dari Task Board.
- Tombol pemulihan checkpoint memperbarui penyimpanan lokal dan meminta pengguna memeriksa hasil sebelum dipakai.
- Tes regresi untuk metadata tugas, penyimpanan output sebelumnya, kontrol pemulihan, dan styling terkait.

### Notes
- Checkpoint menyimpan output teks tugas, bukan snapshot penuh file repository atau rollback Git.
- Hasil AI tetap perlu ditinjau; metadata dan checkpoint tidak membuktikan kode telah diuji atau diterapkan.
- Validasi build setelah perubahan ini harus diperiksa pada GitHub Actions terbaru.

# Changelog

## Unreleased — Android stability audit

- Added regression tests for Capacitor native notification registration, Android notification permission wiring, and standalone clock/theme persistence.
- Verified the latest Android APK workflow builds successfully and uploads the `Mazkiplay-Agent-Office-Android-APK` artifact.
- A previous Android build failed before the notification plugin was registered in `MainActivity`; the plugin is now registered and the subsequent APK workflow passes.
- CI success confirms automated build and checks only. Real-device tests for notification permission prompts, local model inference, accessibility permissions, and long-running background behavior remain required before calling the APK fully device-verified.

Semua perubahan penting proyek dicatat di sini. Format mengikuti prinsip Keep a Changelog; versi dan tanggal rilis hanya ditetapkan ketika rilis benar-benar diterbitkan.

## [Unreleased] — 2026-10-25

### Fixed
- Mendaftarkan `MazkiplayNotificationsPlugin` ke `MainActivity` agar UI dapat memanggil bridge notifikasi native.
- Memasukkan plugin notifikasi ke proses build APK dan menambahkan deklarasi izin `POST_NOTIFICATIONS` pada manifest hasil build.
- Mempertahankan permintaan izin notifikasi eksplisit; fitur uji harus diverifikasi pada APK terpasang dan perangkat nyata.

### Notes
- Notifikasi ini bersifat lokal dan bukan bukti worker AI 24/7. Pekerjaan berkelanjutan saat aplikasi ditutup masih membutuhkan desain worker/foreground service dan pengujian batasan Android.
- Build Actions dan tes perangkat belum dinyatakan lulus hanya dari perubahan source.

### Added
- Menu hamburger responsif di pojok kiri atas dengan drawer navigasi untuk Dashboard, Karyawan AI, Kantor Virtual, AI Offline, Task Board, GitHub, Coding, Code Canvas, plugin, keamanan, cadangan, dan pengaturan.
- Overlay drawer, penutupan lewat tombol tutup, backdrop, tombol Escape, navigasi ke bagian fitur, serta dukungan safe-area dan reduced-motion.
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
- Menghapus ID HTML duplikat pada status impor data; elemen impor kini memakai `import-data-status`, sehingga validasi APK mandiri dapat berjalan.
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
