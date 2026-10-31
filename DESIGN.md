# Photo Calendar — Design

## Prinsip

Tenang, gelap, fokus pada foto, dan terasa seperti jurnal visual. Amber dipakai sebagai aksen status/cover; zinc menjadi permukaan dan teks sekunder.

## Struktur layar

- **Calendar**: header sticky, judul bulan, weekday row, 7-column grid.
- **Date sheet**: bottom sheet/center sheet berisi semua foto pada tanggal, dengan label cover.
- **Photo viewer**: fullscreen, foto di tengah, navigasi kiri/kanan, metadata ringkas di bawah.
- **Appearance**: sheet dengan live preview dan kontrol layout/slider/toggle.

## Interaksi

- Ketuk tanggal berfoto untuk membuka detail.
- Ketuk thumbnail pada detail untuk viewer.
- Long press thumbnail untuk menjadikannya cover tanggal; aksi ini selalu mengalahkan cover otomatis.
- Reset hanya mengembalikan appearance global.
- Placeholder kosong tidak dapat diklik.

## Layout rules

Grid selalu memakai tujuh kolom dan tidak menyisipkan tanggal bulan sebelumnya/berikutnya. Tinggi sel dikontrol sebagai rasio terhadap lebar. Radius 100% menjadi lingkaran untuk sel square dan kapsul untuk sel tinggi.
