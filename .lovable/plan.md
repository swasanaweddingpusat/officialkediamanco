# Perbaikan metadata SEO halaman

## Tujuan
- Memendekkan deskripsi beranda menjadi 50–160 karakter dan tetap relevan dengan layanan Kediaman Corp.
- Memberikan judul dan deskripsi unik pada setiap halaman detail venue berdasarkan data venue.
- Menambahkan canonical yang mengarah ke URL halaman itu sendiri pada semua halaman yang memakai `useSEO`.

## Perubahan
- Perbarui metadata beranda dengan deskripsi ringkas serta domain resmi `https://official.kediaman.co`.
- Perluas `useSEO` agar membuat atau memperbarui satu tag canonical, menggunakan domain resmi dan path halaman aktif sebagai sumber utama.
- Gunakan `useSEO` pada detail venue dengan nama venue, kategori/alamat, deskripsi yang dibatasi panjangnya, foto utama, dan canonical `/lokasi/{id}`.
- Rapikan URL metadata lama pada halaman publik lain yang sudah memakai `useSEO` agar sesuai rute aktual dan domain resmi.
- Samakan metadata fallback di HTML utama dengan metadata beranda yang baru.

## Validasi
- Pastikan setiap halaman hanya memiliki satu canonical dan nilainya sesuai URL halaman.
- Periksa panjang deskripsi beranda serta metadata detail venue setelah data dimuat.
- Pastikan pemeriksaan TypeScript dan build preview berhasil, lalu tandai temuan SEO sebagai diperbaiki.

## Catatan teknis
- Metadata tetap memakai pola `useSEO` yang sudah ada agar tidak mengubah struktur aplikasi.
- Canonical tidak menyertakan query atau hash sehingga variasi pencarian tidak dianggap halaman terpisah.
