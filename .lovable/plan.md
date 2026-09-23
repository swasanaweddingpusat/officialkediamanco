# Indikator Minat dan Promo Venue

## Tujuan
Menambahkan penanda bergaya aplikasi perjalanan pada tiap venue dan tanggal, tanpa membuat angka palsu. Angka minat berasal dari aktivitas nyata, sedangkan label promo dikendalikan admin.

## Yang Akan Dibangun
- Catat aktivitas pengunjung saat membuka detail venue, memilih tanggal, dan mengajukan booking.
- Agregasikan aktivitas per venue dan tanggal agar yang tampil hanya angka ringkas, bukan data pribadi.
- Tambahkan pengaturan admin pada jadwal untuk label seperti **Special Offer**, **Limited Offer**, atau tanpa label.
- Tampilkan pada kalender booking:
  - penanda tanggal yang sedang diminati,
  - label promo pada tanggal terkait,
  - pesan kontekstual setelah tanggal dipilih, misalnya “Dilihat 18 kali dalam 7 hari terakhir”.
- Tampilkan ringkasan pada halaman detail venue, dekat area pemesanan.
- Tampilkan badge ringkas pada kartu di daftar venue, berdasarkan promo aktif atau minat terbaru.

## Aturan Kejujuran dan Privasi
- Tidak menggunakan angka acak atau hitungan buatan.
- Tidak menampilkan nama, kontak, atau identitas pengunjung.
- Angka kecil tidak ditampilkan agar tidak terasa sepi dan mengurangi risiko identifikasi; sebagai gantinya gunakan teks netral seperti “Mulai diminati”.
- Penghitungan kunjungan dibatasi per sesi/periode agar refresh berulang tidak menaikkan angka secara berlebihan.
- Status “Terbatas” hanya muncul jika ditetapkan admin atau ketersediaan sesi memang menipis.

## Pengelolaan Admin
- Pada menu Jadwal Ballroom, admin dapat memilih jenis label promo dan teks pendek opsional.
- Label mempunyai tanggal berlaku dan mengikuti venue/tanggal jadwal yang dipilih.
- Tabel admin menampilkan status promo agar mudah diperiksa.

## Teknis
- Tambahkan tabel aktivitas publik yang hanya menerima event terbatas dan tidak dapat dibaca langsung oleh pengunjung.
- Tambahkan fungsi database aman untuk mencatat event serta fungsi agregasi publik yang hanya mengembalikan jumlah.
- Tambahkan kolom promo pada jadwal ballroom, lengkap dengan izin akses dan kebijakan keamanan.
- Gunakan data booking/jadwal yang sudah ada untuk menghitung ketersediaan; aktivitas baru hanya menjadi sinyal minat, bukan penentu slot penuh.
- Terapkan komponen badge bersama agar gaya kalender, detail venue, dan daftar venue konsisten dengan tema hijau–krem–emas.

## Verifikasi
- Uji pencatatan buka venue, klik tanggal, dan submit booking.
- Pastikan hitungan bertambah sesuai pembatasan dan tidak membuka data pribadi.
- Pastikan label admin muncul pada tiga lokasi tampilan yang dipilih.
- Periksa kalender pada ponsel dan desktop, lalu pastikan proses booking tetap berjalan seperti sebelumnya.
