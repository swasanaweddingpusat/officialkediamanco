# Audit dan pengamanan indeks Google

## Tujuan
- Memastikan Google dapat merayapi seluruh halaman publik tanpa hambatan.
- Menjaga setiap halaman publik memiliki satu canonical yang mengarah ke URL resminya sendiri.
- Mencegah halaman admin, autentikasi, pelacakan privat, dan halaman tidak ditemukan masuk ke indeks atau sitelink.

## Perubahan
- Pertahankan `robots.txt` karena sudah mengizinkan Googlebot dan crawler umum serta menunjuk ke sitemap resmi.
- Tambahkan pengelola SEO tingkat aplikasi untuk memastikan canonical tersedia pada semua halaman publik, tanpa query atau hash dan tanpa canonical ganda.
- Terapkan `noindex, nofollow` hanya pada halaman internal: autentikasi, admin, persetujuan OAuth, pelacakan booking, dan halaman tidak ditemukan.
- Pastikan tag robots tersebut dibersihkan saat pengguna kembali ke halaman publik.
- Perbaiki canonical artikel yang masih memakai domain preview agar menggunakan `https://official.kediaman.co`.
- Cocokkan daftar halaman publik di sitemap dengan rute aplikasi dan pastikan tidak ada `lastmod` buatan dari tanggal build/waktu saat ini.

## Validasi
- Periksa `robots.txt` dan header HTTP pada situs resmi untuk memastikan tidak ada blokir atau `X-Robots-Tag: noindex`.
- Uji halaman publik dan internal di browser: satu canonical per halaman publik, canonical memakai domain resmi, dan noindex hanya muncul pada halaman internal.
- Pastikan sitemap valid dan pemeriksaan build berhasil.

## Catatan
- Sitelink tetap dipilih otomatis oleh Google; perubahan ini menghilangkan hambatan teknis dan mengurangi peluang halaman internal dipilih sebagai sitelink.
- Perubahan baru tampil di domain resmi setelah dipublikasikan.
