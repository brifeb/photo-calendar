# Photo Calendar — Technical Design

## Stack

- React + TypeScript + Vite
- Tailwind CSS v4
- Capacitor 7
- Kotlin Android plugin untuk MediaStore dan AndroidX ExifInterface
- LocalStorage untuk preference MVP; cover mapping dipisahkan dari global appearance

## Data flow

`PhotoLibrary.requestAccess()` → `listPhotos(startDate, endDate, offset, limit)` → normalisasi tanggal → grouping per `yyyy-MM-dd` → kalender. Thumbnail dan metadata dimuat terpisah agar scrolling tidak memuat seluruh galeri sekaligus.

## Android permissions

- Android 14+: `READ_MEDIA_IMAGES` dan `READ_MEDIA_VISUAL_USER_SELECTED`; hasil `limited` dipertahankan sebagai kondisi valid.
- Android 13: `READ_MEDIA_IMAGES`.
- Android 12 dan lebih lama: `READ_EXTERNAL_STORAGE`.

## Cover selection

Manual cover disimpan sebagai `{ [date]: mediaStoreId }`. Resolver cover melakukan urutan: manual → automatic mode. Reset settings hanya menulis ulang `DEFAULT_APPEARANCE`.

## Build

```bash
npm install
npm run build
npx cap sync android
cd android && ./gradlew assembleDebug
```

Artifact GitHub Actions berada di `android/app/build/outputs/apk/debug/app-debug.apk`.
