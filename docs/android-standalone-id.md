# Mazkiplay Agent Office — APK mandiri

Folder `android-standalone` adalah antarmuka lokal yang dibundel ke APK. Aplikasi tidak meminta URL hosting untuk dibuka.

## Fitur prototipe lokal
- Dashboard kantor bergaya 3D ilustratif.
- Membuat/menghapus maksimal 20 profil pekerja dengan pilihan peran dan provider.
- Arahan prompt berbeda sesuai peran (developer, QA, UI/UX, cybersecurity defensif, manajer proyek, dan lainnya).
- Task board lokal dengan tanda selesai dan hapus; hasil AI menunggu pemeriksaan pengguna dan tidak otomatis ditandai selesai.
- Ekspor/impor cadangan JSON untuk profil dan tugas; API key sengaja tidak diekspor.
- Tombol hapus seluruh data lokal, termasuk konfigurasi provider dan API key.
- Konfigurasi OpenRouter, OpenAI, Gemini, DeepSeek, Claude, dan endpoint kompatibel OpenAI.
- Hub GitHub: validasi token dan repository, membaca direktori/file pada branch/ref, dan mengirim konteks file ke Task Board untuk dianalisis AI. Token disimpan di Android Keystore bila plugin native tersedia.
- Patch Lab (Android APK): memuat file teks yang sudah ada, meminta provider AI aktif untuk mengusulkan revisi satu file atau hingga lima file sebagai konten lengkap JSON, menampilkan ringkasan/langkah uji/risiko, menyediakan editor isi file untuk ditinjau, lalu jika pengguna mengonfirmasi dapat membuat branch baru, commit file, dan membuka Draft Pull Request. Fitur ini memerlukan provider AI yang dikonfigurasi untuk menghasilkan patch, serta token fine-grained dengan Contents read/write dan Pull requests read/write untuk mengirim patch. Tidak ada merge otomatis atau eksekusi kode. Gunakan izin hanya pada repository yang diperlukan.
- APK Android menggunakan plugin native khusus yang mengenkripsi API key dengan AES-GCM dan kunci yang disimpan di Android Keystore. Nilai terenkripsi disimpan di SharedPreferences; kunci AES tidak disimpan sebagai teks biasa.
- Mode browser/preview tidak memiliki Android Keystore, sehingga API key hanya berada di memori sesi dan tidak ditulis ke localStorage.

## Batas yang belum selesai
- Patch Lab menghasilkan usulan untuk satu file atau maksimal lima file per permintaan dengan batas konteks 18.000 karakter; belum ada diff editor canggih, shell/terminal, atau pengujian otomatis. AI dapat menghasilkan revisi yang salah atau tidak lengkap; selalu bandingkan diff dan jalankan tes sebelum merge. Semua perubahan harus ditinjau di GitHub sebelum merge.
- Profil pekerja belum menjadi proses AI otonom yang menjalankan coding atau mengubah repository.
- Terminal Node.js/PTY, Git worktree, clone repo, GitHub PR automation, voice chat, panggilan/SMS, dan eksekusi agent CLI dari aplikasi desktop belum dipindahkan ke Android.
- Panggilan provider memerlukan internet, API key, model, kuota, serta dukungan endpoint/jaringan.
- Implementasi penyimpanan aman perlu diverifikasi lewat build Android dan uji perangkat. Jika Android Keystore gagal, jangan mengandalkan key untuk tersimpan.
- Tidak ada model cloud yang berjalan offline hanya karena antarmuka ada di APK.
- APK debug hanya untuk pengujian, bukan rilis Play Store.

## Build
Workflow Android APK membundel isi folder ini tanpa URL hosting, menyalin plugin Android Keystore native, lalu membangun APK debug. Setelah workflow sukses, APK tersedia sebagai artifact GitHub Actions.


Penemuan model AI: tombol "Cari model tersedia" mengambil katalog model melalui API provider yang dipilih (OpenRouter, OpenAI, Gemini, DeepSeek, Anthropic, atau endpoint OpenAI-compatible). Model yang terdeteksi muncul sebagai saran pada kolom Model ID, namun ID tetap dapat diisi manual. Filter "Hanya model gratis" hanya memberi label gratis secara otomatis untuk katalog OpenRouter berdasarkan metadata harga/ID gratis; untuk provider lain daftar model umumnya tidak menjamin harga atau akses gratis. OpenRouter Free Router `openrouter/free` ditawarkan sebagai pilihan routing ke model gratis yang tersedia, dengan kuota dan ketersediaan yang dapat berubah. Pengguna tetap membutuhkan API key provider masing-masing dan harus meninjau biaya/limit akun.