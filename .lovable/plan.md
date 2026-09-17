# Tambahkan sitemap publik

## Perubahan
- Buat generator `sitemap.xml` untuk seluruh halaman publik statis dan detail konten yang tersimpan di CMS.
- Ambil hanya konten publik: artikel terbit, lokasi aktif, portfolio aktif, dan penawaran yang tersedia.
- Gunakan domain resmi `https://official.kediaman.co`; jangan membuat `lastmod` tanpa sumber perubahan halaman yang pasti.
- Jalankan generator otomatis sebelum preview dan build agar sitemap selalu mengikuti konten terbaru.
- Tambahkan alamat sitemap ke `robots.txt` tanpa mengubah aturan crawler yang sudah ada.

## Verifikasi
- Pastikan `/sitemap.xml` menghasilkan XML valid dan memuat rute publik tanpa halaman admin, autentikasi, atau internal.
- Periksa build dan tandai temuan SEO sebagai diperbaiki setelah seluruh perubahan berhasil.

## Detail teknis
- Mekanisme baru: `scripts/generate-sitemap.ts`, dijalankan melalui `predev` dan `prebuild`.
- Data dinamis dibaca dari sumber CMS yang sama dengan halaman publik, dengan fallback aman agar rute statis tetap tersedia bila layanan data sementara tidak dapat dijangkau.
