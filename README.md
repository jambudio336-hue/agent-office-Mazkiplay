<div align="center">

<img src="assets/office-hero.svg" alt="Mazkiplay Agent Office — neon AI workspace" width="100%">

# M4zk1pL4y.ap — Agent Office

### AI workspace untuk menjalankan tugas, mengelola tim, dan meninjau hasil kerja.

<p>
  <a href="https://github.com/jambudio336-hue/agent-office-Mazkiplay/actions"><img alt="Build status" src="https://img.shields.io/github/actions/workflow/status/jambudio336-hue/agent-office-Mazkiplay/android-apk.yml?branch=feat%2Ffree-local-ai-mode&style=for-the-badge&label=ANDROID%20BUILD"></a>
  <img alt="Animated dark anime theme" src="assets/dark-anime-app-icon.svg" width="52" height="52">
  <a href="assets/office-hero.svg"><img alt="Animated neon office" src="https://img.shields.io/badge/Animated-Neon%20Office-8b5cf6?style=for-the-badge"></a>
  <a href="https://github.com/jambudio336-hue/agent-office-Mazkiplay/pull/5"><img alt="Development PR" src="https://img.shields.io/badge/Development-PR%20%235-7657ff?style=for-the-badge"></a>
  <a href="LICENSE"><img alt="License MIT" src="https://img.shields.io/badge/License-MIT-28c7a5?style=for-the-badge"></a>
  <img alt="Platform Android" src="https://img.shields.io/badge/Platform-Android-35b86b?style=for-the-badge">
</p>

**Plan it. Assign it. Build it. Review it.**

[Unduh APK](https://github.com/jambudio336-hue/agent-office-Mazkiplay/releases) · [Build terbaru](https://github.com/jambudio336-hue/agent-office-Mazkiplay/actions) · [Changelog](CHANGELOG.md) · [Lisensi](LICENSE)

</div>

---

> [!IMPORTANT]
> **Status: aktif dikembangkan.** Fitur, tampilan, kompatibilitas perangkat, dan format penyimpanan dapat berubah. Jangan gunakan build eksperimen untuk data yang tidak memiliki cadangan.

## ✨ Tentang proyek\n\n**Developer / brand:** M4zk1pL4y.ap

**Mazkiplay Agent Office** adalah pengembangan/fork dari [Agent Office](https://github.com/AgentSystemLabs/agent-office) yang diarahkan ke pengalaman Android: dashboard kantor virtual, pengelolaan tugas, pilihan provider AI, workspace developer, dan jembatan perangkat yang memerlukan izin pengguna.

Tujuannya adalah memberi satu tempat untuk mengatur pekerjaan AI tanpa berpura-pura bahwa animasi kantor adalah pekerja AI yang sedang menjalankan tugas nyata. Animasi kantor adalah visualisasi; status tugas nyata hanya ditampilkan ketika proses terkait memang berjalan.

## 🚀 Fitur utama

| Modul | Fungsi | Status/catatan |
|---|---|---|
| Kantor virtual | Ruang Developer Lab, Riset, Rapat, dan Security Center | Animasi visual; bukan bukti eksekusi AI |
| Pekerja & Task Board | Membuat profil pekerja dan menugaskan tugas | Eksekusi bergantung pada provider yang dikonfigurasi |
| AI Mission Control | Memecah tujuan menjadi 4 tahap berurutan, meneruskan konteks, menampilkan progres, dan mendukung jeda/ulang tahap gagal | Hasil AI tetap perlu ditinjau; tidak menerapkan patch atau menjalankan tes secara otomatis |
| QA Lab / Release Gate | Memeriksa status GitHub Actions untuk commit branch terbaru dan mencatat checklist uji manual | Membutuhkan token GitHub dengan izin Actions: read; checklist perangkat diisi operator berdasarkan bukti nyata |
| AI generatif lokal | Integrasi eksperimen Qwen3 0.6B INT4 | Unduhan model besar; performa tergantung RAM/chipset dan kompatibilitas runtime |
| Provider AI | OpenRouter, OpenAI, Google Gemini, DeepSeek, Anthropic Claude, CyberNeurova OpenRoute, dan endpoint OpenAI-compatible | Model cloud membutuhkan API key; harga/kuota mengikuti provider. Model Claude Opus/Sonnet/Haiku dan katalog lainnya mengikuti akses akun dan daftar API terbaru |
| GitHub Workspace | Membaca konteks repository dan alur usulan patch/Draft PR | Izin token minimum; tinjau perubahan sebelum dikirim |
| Patch Lab | Usulan AI satu/multi-file, editor tinjauan, branch terpisah, commit, Draft PR, dan pemindai pola rahasia lokal | Maksimum 5 file / 18.000 karakter konteks; pemindai berbasis pola bukan jaminan; tidak merge otomatis |
| Canvas / workspace kode | Mengedit berkas lokal, preview HTML yang didukung, dan ekspor | Preview bukan sandbox keamanan untuk kode yang tidak tepercaya |
| Plugin Hub | Pemeriksaan koneksi dasar untuk layanan terpilih | Banyak konektor masih berupa smoke test/read-only, bukan integrasi penuh |
| Device Bridge | Membuka pengaturan aksesibilitas dan membaca ringkasan layar atas permintaan | Belum mendukung kendali otomatis penuh lintas aplikasi |
| APK pipeline | GitHub Actions membangun APK dan menyiapkan artefak/release | Keberhasilan harus dikonfirmasi pada run terbaru |

## 📲 Unduh dan instal APK

1. Buka halaman [GitHub Releases](https://github.com/jambudio336-hue/agent-office-Mazkiplay/releases).
2. Pilih **release terbaru yang memiliki aset APK**. Jangan menganggap build lama setara dengan commit terbaru.
3. Unduh berkas APK dari bagian **Assets**.
4. Di Android, buka berkas tersebut dan izinkan instalasi dari sumber itu jika diminta oleh sistem.
5. Jika Android menampilkan peringatan atau versi lama bentrok, baca detailnya terlebih dahulu. Jangan menghapus data aplikasi tanpa cadangan.

Jika belum ada release APK baru, buka [GitHub Actions](https://github.com/jambudio336-hue/agent-office-Mazkiplay/actions), pilih workflow **Android APK**, dan periksa status run terbaru. Build yang masih berjalan atau gagal bukan APK rilis yang tervalidasi.

## 🧰 Pengembangan lokal

Persyaratan umum:
- Node.js sesuai versi yang ditetapkan proyek dan npm.
- Git.
- Java/JDK dan Android SDK untuk build Android lokal.
- Android Studio opsional untuk membuka dan memeriksa proyek Android.

Perintah awal:

```bash
git clone https://github.com/jambudio336-hue/agent-office-Mazkiplay.git
cd agent-office-Mazkiplay
npm ci
npm test
npm run typecheck
```

> Perintah dan dependensi dapat berbeda pada cabang eksperimen. Periksa bagian `scripts` pada `package.json` sebelum menjalankan perintah. Build APK publik yang digunakan proyek ini dijalankan melalui GitHub Actions.

## 🤖 Model AI dan biaya

- **Tanpa API key:** mode lokal Android memakai Qwen3 0.6B INT4 setelah diunduh ke perangkat (sekitar 347 MiB). Tidak ada biaya API; kecepatan/kualitas bergantung pada RAM, chipset, dan kompatibilitas. Preview browser hanya memakai AI Lite berbasis aturan, bukan LLM generatif.
- **OpenRouter Free Router:** `openrouter/free` memilih model gratis yang tersedia secara otomatis. Model gratis OpenRouter tetap memerlukan akun dan API key OpenRouter serta internet; kuota dan ketersediaan dapat berubah. Daftar model dapat dimuat ulang dari API.
- **OpenAI, Gemini, DeepSeek, dan Anthropic Claude:** masukkan API key provider, lalu gunakan **Cari model tersedia**. Claude Opus, Sonnet, dan Haiku muncul jika tersedia untuk key/akun tersebut. Jangan menganggap model berbayar gratis hanya karena bisa dipilih.
- **CyberNeurova OpenRoute:** endpoint kompatibel OpenAI di `https://openroute.cyberneurova.com/v1`; memerlukan API key `sk-cnor-...` dan saldo bayar-per-pemakaian. Ini bukan opsi tanpa biaya.
- **Endpoint custom:** mendukung server OpenAI-compatible tepercaya; endpoint lokal tanpa key bergantung pada konfigurasi server lokal dan izin jaringan.
- **Fallback:** model OpenRouter spesifik yang gagal dicoba ulang melalui `openrouter/free`; fallback lintas provider bersifat opsional karena provider cadangan bisa menghabiskan kuota atau biaya.

## 🔐 Privasi dan keamanan

- Jangan commit API key, token GitHub, token bot, password, atau kredensial OAuth.
- Gunakan token dengan izin minimum dan cabut token yang tidak lagi diperlukan.
- Integrasi aksesibilitas Android **harus diaktifkan secara manual oleh pengguna** melalui Pengaturan Android.
- Ringkasan layar diminta secara eksplisit. Kolom yang dikenali sebagai password dikecualikan, tetapi jangan tampilkan informasi sensitif saat menggunakan fitur ini.
- Device Bridge saat ini **tidak** otomatis mengklik tombol, mengetik ke aplikasi lain, mendaftar akun, melewati CAPTCHA, atau mengirim isi layar ke server.
- Jangan memasukkan rahasia ke provider AI cloud kecuali kamu memahami kebijakan privasi dan pemrosesannya.
- Pencadangan Android otomatis dinonaktifkan untuk mencegah pemulihan data terenkripsi tanpa kunci Android Keystore. Gunakan fitur ekspor cadangan manual untuk menyimpan pekerja dan tugas; API key tidak ikut diekspor.

Laporkan kerentanan secara bertanggung jawab melalui halaman [Issues](https://github.com/jambudio336-hue/agent-office-Mazkiplay/issues) tanpa mempublikasikan kredensial atau data pribadi.

## 🗺️ Roadmap

- [x] Dashboard kantor dan Task Board
- [x] Integrasi awal workspace GitHub dan Plugin Hub
- [x] Fondasi native Device Bridge dengan izin eksplisit
- [x] Validasi CI Android: pemeriksaan sintaks/struktur, tes regresi, kompilasi APK, checksum, dan preview release
- [ ] Instalasi dan uji fitur inti pada perangkat Android fisik
- [ ] Memperluas pengujian Canvas, navigasi, dan penyimpanan lokal
- [x] Pemulihan kredensial provider dari Android Keystore serta pesan error yang dapat ditindaklanjuti
- [ ] Menambah otomasi lintas aplikasi yang aman, transparan, dan hanya dengan persetujuan pengguna

## ⚡ Pusat Performa & Diagnostik

Panel **Pusat Performa & Diagnostik** menyediakan:
- Mode Hemat Performa untuk mengurangi animasi dan transisi dekoratif pada perangkat terbatas.
- Ringkasan lokal jumlah pekerja/tugas tersimpan dan indikator perangkat yang tersedia melalui browser.
- Estimasi penggunaan/kuota penyimpanan origin jika runtime mendukung Storage API.
- Pemeriksaan lokal tanpa telemetry dan tanpa mengirim data diagnostik ke server.

**Batasan:** mode hemat mengurangi beban efek visual, bukan mempercepat komputasi model atau jaringan secara otomatis. Indikator thread/RAM tidak tersedia pada semua WebView. Diagnostik bukan benchmark CPU/GPU, uji inferensi, atau pemeriksaan keamanan menyeluruh. Untuk menilai kecepatan AI, jalankan benchmark provider terpisah; model lokal tetap bergantung pada kompatibilitas runtime, RAM, chipset, dan ukuran model.

## 🧪 Validasi

Sebelum rilis, periksa:
1. Tes unit/integrasi yang didefinisikan di `package.json`.
2. Typecheck dan validasi aset HTML/JS.
3. Workflow **Android APK** hingga semua langkah build selesai.
4. Keberadaan APK pada artefak atau release dari run yang sama.
5. Instalasi dan uji fitur inti pada perangkat Android nyata.
6. Checksum APK jika disediakan oleh workflow.

Badge build di bagian atas mengacu pada workflow; statusnya dapat berubah. Selalu buka run terbaru untuk melihat hasil aktual.

## 📚 Dokumentasi

- [Changelog](CHANGELOG.md)
- [Lisensi](LICENSE)
- [Source APK mandiri](android-standalone/)
- [Native Android bridge](android-standalone/native-android/)
- [GitHub Actions](https://github.com/jambudio336-hue/agent-office-Mazkiplay/actions)
- [Pull Request pengembangan #5](https://github.com/jambudio336-hue/agent-office-Mazkiplay/pull/5)
- [Proyek upstream Agent Office](https://github.com/AgentSystemLabs/agent-office)

## ⚙️ Batasan operasional yang transparan

- Tugas hanya benar-benar dijalankan ketika pengguna menekan tombol jalankan dan model AI tersedia.
- Profil karyawan adalah pengatur peran/penugasan, bukan proses otonom yang selalu berjalan di latar belakang.
- Tampilan ruang, meja, dan avatar adalah representasi visual antarmuka, bukan simulasi pekerja digital yang bekerja mandiri.
- Pengeditan repository, aksesibilitas Android, dan tindakan lintas aplikasi memerlukan integrasi, izin, serta konfirmasi yang sesuai.
- Jangan menandai output AI sebagai perubahan file atau pengujian sukses sebelum hasilnya diverifikasi.

## 🙌 Kredit dan lisensi

Proyek ini merupakan fork/pengembangan dari **Agent Office** oleh AgentSystemLabs. Lisensi MIT dan atribusi upstream dipertahankan; lihat [LICENSE](LICENSE) untuk ketentuan lengkap. Perubahan dan fitur khusus Mazkiplay harus dibaca bersama lisensi dependensi serta model yang digunakan.

<div align="center">

**Mazkiplay Agent Office**  
*by.m4zk1pl4y*

</div>


## 🌌 Animasi & tema visual

<div align="center">

<img src="assets/office-hero.svg" alt="Animasi kantor AI neon" width="100%">

<img src="assets/dark-anime-app-icon.svg" alt="Ikon karakter anime dark orisinal" width="180">

</div>

Ilustrasi ikon karakter anime dark dibuat sebagai aset SVG orisinal dan header kantor memakai SVG dengan animasi. GitHub dapat menonaktifkan sebagian animasi pada konteks tertentu; buka aset SVG langsung untuk melihat animasinya jika didukung.

> **Catatan ikon APK:** workflow Android APK mengonversi aset SVG menjadi PNG untuk seluruh density launcher dan memasang resource ikon pada proyek Android saat build. Tampilan ikon tetap perlu dikonfirmasi pada perangkat fisik karena launcher Android dapat menerapkan adaptive icon secara berbeda.


## 🧠 Skill Registry dan Playbook Tugas

Registry menyediakan playbook yang dapat dipilih untuk membantu menyusun instruksi tugas secara konsisten. Kategori mencakup full-stack web, Android/APK, pemrograman dan debugging, QA, rekayasa AI agent, DevOps/release, riset keamanan defensif, pentest berizin, perencanaan red/blue/purple team, analisis teknikal dan fundamental forex, kuantitatif/backtesting, pemasaran digital, SEO/e-commerce, analisis sumber publik, UI/UX/dokumentasi, grey-box/white-hat, serta riset aktor ancaman dan hacktivisme.

- Playbook membantu membentuk prompt dan tugas; **tidak otomatis memberi agent kemampuan, akses API, izin perangkat, atau akses repository**.
- Hasil coding dan security harus divalidasi dengan tes, bukti, serta tinjauan manusia. Pengujian keamanan hanya untuk sistem milik sendiri atau yang memiliki izin tertulis.
- Analisis forex bukan sinyal transaksi yang dijamin. Data real-time memerlukan feed/API yang tersedia; hasil backtest bukan jaminan performa masa depan.
- “Belajar mandiri” dibatasi pada peningkatan playbook, pencatatan hasil, dan evaluasi yang dapat ditinjau. Perubahan kode, akses baru, pengeluaran, publikasi, dan tindakan sensitif tetap memerlukan kontrol serta persetujuan yang sesuai.
