# Mazkiplay Agent Office — APK Android mandiri

## Status

Workflow `.github/workflows/android-apk.yml` sekarang membundel folder `android-standalone/` langsung ke APK melalui Capacitor. APK dapat membuka dashboard lokal tanpa URL Vercel, Netlify, Supabase, atau server web milik kita. APK debug dibuat otomatis oleh GitHub Actions untuk pengujian.

## Fitur prototipe yang ada di APK

- Dashboard kantor dengan ilustrasi ruang kantor bergaya 3D.
- Profil pekerja lokal hingga maksimum 20 orang, dengan pilihan peran dan provider.
- Task board lokal: tambah tugas, tandai selesai, hapus, dan tetapkan tugas ke pekerja.
- Tombol Jalankan AI mengirimkan tugas ke model dari provider yang dikonfigurasi dan menyimpan responsnya pada task board.
- Form konfigurasi OpenRouter, OpenAI, Google Gemini, DeepSeek, Claude, dan endpoint kompatibel OpenAI.
- Pengaturan profil/tugas/provider tersimpan di penyimpanan lokal aplikasi.

## Build APK

1. Buka tab **Actions** pada repositori GitHub.
2. Pilih workflow **Android APK** lalu **Run workflow**.
3. Pilih apakah akan membuat GitHub Release publik.
4. Tunggu sampai seluruh job hijau.
5. Unduh `Mazkiplay-Agent-Office.apk` dari bagian **Artifacts**, atau dari **Releases** jika publikasi dipilih.

Workflow belum dijalankan oleh dokumentasi ini; APK baru tersedia setelah job berhasil.

## Batas penting

- Ini adalah prototipe local-first, belum pemindahan penuh semua kemampuan desktop ke Android.
- Profil pekerja saat ini belum menjalankan agen coding otonom. Terminal Node.js/PTY, CLI coding agent, Git worktree, clone repo dan automasi GitHub PR belum dipindahkan ke APK.
- Panggilan/SMS Android belum diimplementasikan.
- Integrasi provider masih tahap awal; request memerlukan internet, API key valid, kuota, dan dukungan endpoint. Sebagian provider bisa memerlukan penyesuaian tambahan.
- API key saat ini disimpan dalam penyimpanan lokal WebView, bukan Android Keystore. Jangan gunakan key sensitif/bernilai tinggi sebelum secure storage native ditambahkan.
- APK debug ditujukan untuk pengujian. Distribusi produksi memerlukan signing key yang dijaga sebagai rahasia dan proses rilis terpisah.
