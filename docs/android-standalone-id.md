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
- Hub GitHub baca-saja: validasi token dan repository, membaca direktori/file pada branch/ref, dan mengirim konteks file ke Task Board untuk dianalisis AI. Token disimpan di Android Keystore bila plugin native tersedia; browser hanya menyimpannya di memori sesi.
- APK Android menggunakan plugin native khusus yang mengenkripsi API key dengan AES-GCM dan kunci yang disimpan di Android Keystore. Nilai terenkripsi disimpan di SharedPreferences; kunci AES tidak disimpan sebagai teks biasa.
- Mode browser/preview tidak memiliki Android Keystore, sehingga API key hanya berada di memori sesi dan tidak ditulis ke localStorage.

## Batas yang belum selesai
- Hub GitHub versi ini hanya membaca repository. Belum ada penulisan/commit file, pembuatan branch, pembukaan pull request, atau pengujian kode secara otomatis.
- Profil pekerja belum menjadi proses AI otonom yang menjalankan coding atau mengubah repository.
- Terminal Node.js/PTY, Git worktree, clone repo, GitHub PR automation, voice chat, panggilan/SMS, dan eksekusi agent CLI dari aplikasi desktop belum dipindahkan ke Android.
- Panggilan provider memerlukan internet, API key, model, kuota, serta dukungan endpoint/jaringan.
- Implementasi penyimpanan aman perlu diverifikasi lewat build Android dan uji perangkat. Jika Android Keystore gagal, jangan mengandalkan key untuk tersimpan.
- Tidak ada model cloud yang berjalan offline hanya karena antarmuka ada di APK.
- APK debug hanya untuk pengujian, bukan rilis Play Store.

## Build
Workflow Android APK membundel isi folder ini tanpa URL hosting, menyalin plugin Android Keystore native, lalu membangun APK debug. Setelah workflow sukses, APK tersedia sebagai artifact GitHub Actions.
