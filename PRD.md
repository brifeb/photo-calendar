# Photo Calendar — Product Requirements

## Tujuan

Photo Calendar adalah kalender foto offline untuk Android yang mengubah galeri lokal menjadi timeline visual berbasis tanggal. Aplikasi tidak memiliki backend dan tidak pernah mengubah file foto asli.

## MVP

- Kalender gelap dengan 7 kolom, tanpa tanggal dari bulan lain.
- Scroll vertikal lintas bulan dengan lazy loading per rentang tanggal.
- Cover foto per tanggal; jika lebih dari satu foto tampilkan badge `+N`.
- Detail tanggal berupa grid foto; cover dapat dipilih manual melalui long press.
- Viewer fullscreen dengan navigasi foto dan panel metadata EXIF.
- Appearance Settings dengan live preview: single, 2×2, 4 kolom, 4 baris, tinggi sel 60–200%, gap 0–16px, radius 0–100%, badge on/off.
- Cover otomatis: terbaru, terlama, atau acak deterministik. Cover manual selalu menang.
- Reset hanya mengembalikan pengaturan global, bukan cover manual.
- Izin Android modern: Android 13 media permission dan Android 14 partial photo access.
- GitHub Actions untuk debug APK.

## Non-goals MVP

Sinkronisasi cloud, edit foto, upload, album manual, notifikasi, dan publikasi Play Store.

## Acceptance criteria

1. Kalender dapat dirender tanpa tanggal luar bulan dan tetap usable pada layar kecil.
2. Setiap perubahan Appearance langsung terlihat dan bertahan setelah reload.
3. Memilih cover manual mengubah cover tanggal terkait dan tidak hilang saat Reset.
4. Viewer tidak mengubah foto asli.
5. Data yang dibaca hanya berasal dari MediaStore lokal; aplikasi tetap dapat dibuka offline.
6. `npm run build` sukses dan workflow Actions dapat menghasilkan `app-debug.apk`.
