# Mazkiplay Agent Office — APK mandiri

Folder android-standalone adalah antarmuka lokal yang dibundel ke APK. Aplikasi tidak meminta URL hosting untuk dibuka.

## Fitur prototipe lokal
- Dashboard kantor bergaya 3D ilustratif.
- Membuat/menghapus maksimal 20 profil pekerja dengan pilihan peran dan provider.
- Task board lokal dengan tanda selesai dan hapus.
- Ekspor/impor cadangan JSON untuk profil dan tugas; API key sengaja tidak diekspor.
- Tombol hapus seluruh data lokal, termasuk konfigurasi provider dan API key.
- Form konfigurasi OpenRouter, OpenAI, Gemini, DeepSeek, Claude, dan endpoint kompatibel OpenAI.
- Data profil/tugas/konfigurasi disimpan di penyimpanan lokal WebView.

## Batas yang belum selesai
- Profil pekerja belum menjadi proses AI otonom yang menjalankan coding.
- Terminal Node.js/PTY, Git worktree, clone repo, GitHub PR automation, voice chat, panggilan/SMS, dan eksekusi agent CLI dari aplikasi desktop belum dipindahkan ke Android.
- Uji koneksi provider memakai API kompatibel OpenAI dan memerlukan internet, key, model, kuota, serta dukungan jaringan/native runtime. Beberapa provider/API memerlukan penyesuaian.
- API key saat ini berada di penyimpanan lokal WebView; ini bukan Android Keystore dan belum memenuhi standar penyimpanan rahasia produksi. Jangan gunakan key sensitif sebelum secure storage ditambahkan.
- Tidak ada model cloud yang berjalan offline hanya karena antarmuka ada di APK.
- APK ini tidak menjalankan server Node.js penuh di Android. Backend terminal/PTY harus direkayasa ulang terpisah.

## Build
Workflow Android APK membundel isi folder ini tanpa URL hosting. Jalankan workflow manual; setelah sukses, APK debug tersedia sebagai artifact. APK debug untuk pengujian, bukan rilis Play Store.
