// /kebijakan-privasi — kebijakan privasi website & aplikasi Kediaman (dibutuhkan Play Store & App Store).
import { Link } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Breadcrumbs } from '@/components/ota/OtaKit';
import { useSiteSettings } from '@/hooks/useCMS';
import { useSEO } from '@/hooks/useSEO';

const UPDATED = '12 November 2026';

const PrivacyPolicy = () => {
  const { data: settings } = useSiteSettings();
  const name = settings?.site_name || 'Kediaman Corp';
  const email = settings?.email;

  useSEO({
    title: `Kebijakan Privasi | ${name}`,
    description: `Bagaimana ${name} mengumpulkan, memakai, dan melindungi data pribadi Anda di website kediaman.co dan aplikasi Kediaman.`,
    url: 'https://kediaman.co/kebijakan-privasi',
  });

  return (
    <Layout>
      <article className="ota-container py-8 md:py-12 max-w-3xl">
        <Breadcrumbs items={[{ name: 'Kebijakan privasi' }]} className="mb-6" />
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">Kebijakan Privasi</h1>
        <p className="mt-2 text-sm text-muted-foreground">Terakhir diperbarui: {UPDATED}</p>

        <div className="mt-8 space-y-8 text-[15px] leading-relaxed [&_h2]:text-xl [&_h2]:font-extrabold [&_h2]:mb-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1.5 [&_p]:text-muted-foreground [&_li]:text-muted-foreground">
          <section>
            <p>
              Kebijakan ini menjelaskan bagaimana {name} ("Kediaman", "kami") mengelola data pribadi pengguna website{' '}
              <b className="text-foreground">kediaman.co</b> dan aplikasi Kediaman untuk Android & iPhone. Kami mengelola data sesuai
              Undang-Undang No. 27 Tahun 2022 tentang Pelindungan Data Pribadi.
            </p>
          </section>

          <section>
            <h2>1. Data yang kami kumpulkan</h2>
            <ul>
              <li><b className="text-foreground">Formulir booking & konsultasi:</b> nama, nomor HP/WhatsApp, venue yang diminati, dan pesan Anda.</li>
              <li><b className="text-foreground">Akun Kediaman Rewards:</b> email, password (disimpan dalam bentuk hash, tidak bisa dibaca), nama, nomor HP, kode referral, poin, dan riwayat penukaran.</li>
              <li><b className="text-foreground">Newsletter:</b> alamat email bila Anda berlangganan.</li>
              <li><b className="text-foreground">Lamaran kerja:</b> data diri, riwayat kerja, dan berkas CV yang Anda unggah di halaman Karier.</li>
              <li><b className="text-foreground">Chat:</b> isi percakapan di jendela chat website/aplikasi.</li>
              <li><b className="text-foreground">Data teknis:</b> alamat IP, jenis perangkat & browser, halaman yang dibuka, dan data statistik kunjungan (Google Analytics / Google Tag Manager).</li>
            </ul>
            <p className="mt-3">Aplikasi Kediaman tidak mengakses kontak, lokasi presisi, kamera, mikrofon, atau berkas di HP Anda, kecuali berkas yang Anda pilih sendiri untuk diunggah (misalnya CV).</p>
          </section>

          <section>
            <h2>2. Untuk apa data dipakai</h2>
            <ul>
              <li>Menindaklanjuti permintaan booking, penawaran, survei venue, dan konsultasi acara.</li>
              <li>Menjalankan program Rewards: mencatat referral, memberi poin, dan memproses penukaran hadiah.</li>
              <li>Mengirim newsletter (hanya bila Anda berlangganan; bisa berhenti kapan saja lewat link di setiap email).</li>
              <li>Memproses lamaran kerja.</li>
              <li>Menjawab pertanyaan lewat chat. Pesan chat diproses oleh penyedia AI (Anthropic) untuk membantu menyusun jawaban.</li>
              <li>Menjaga keamanan layanan (misalnya membatasi percobaan berlebihan) dan memahami cara website dipakai agar bisa kami perbaiki.</li>
            </ul>
            <p className="mt-3">Kami tidak menjual data pribadi Anda.</p>
          </section>

          <section>
            <h2>3. Pihak yang membantu kami</h2>
            <p>Data disimpan dan diproses oleh penyedia layanan yang membantu operasional kami, antara lain penyedia server & penyimpanan (Railway), analitik (Google), penyedia AI untuk chat (Anthropic), dan WhatsApp bila Anda memilih menghubungi kami lewat WhatsApp. Mereka hanya memproses data sesuai keperluan layanan tersebut.</p>
          </section>

          <section>
            <h2>4. Berapa lama data disimpan</h2>
            <ul>
              <li>Data akun Rewards: selama akun aktif; terhapus saat Anda menghapus akun.</li>
              <li>Data booking & transaksi: selama diperlukan untuk kontrak, pembayaran, dan kewajiban hukum/pajak.</li>
              <li>Lamaran kerja: paling lama 1 tahun setelah proses rekrutmen, kecuali Anda meminta dihapus lebih cepat.</li>
              <li>Email newsletter: sampai Anda berhenti berlangganan.</li>
            </ul>
          </section>

          <section>
            <h2>5. Hak Anda</h2>
            <p>Anda berhak meminta akses, perbaikan, atau penghapusan data pribadi Anda, serta menarik persetujuan. Akun Rewards dapat dihapus sendiri kapan saja di halaman{' '}
              <Link to="/hapus-akun" className="font-semibold text-primary hover:underline">Hapus akun</Link>. Untuk permintaan lain, hubungi kami lewat kontak di bawah.</p>
          </section>

          <section>
            <h2>6. Keamanan</h2>
            <p>Koneksi ke website & aplikasi dienkripsi (HTTPS), password disimpan dalam bentuk hash, dan akses data dibatasi untuk tim yang berwenang. Tidak ada sistem yang 100% aman, tetapi kami terus menjaga dan memperbarui perlindungannya.</p>
          </section>

          <section>
            <h2>7. Anak-anak</h2>
            <p>Layanan kami ditujukan untuk pengguna dewasa (18 tahun ke atas) yang merencanakan acara. Kami tidak dengan sengaja mengumpulkan data anak-anak.</p>
          </section>

          <section>
            <h2>8. Perubahan kebijakan</h2>
            <p>Kebijakan ini dapat diperbarui sewaktu-waktu. Tanggal pembaruan terakhir tercantum di bagian atas halaman ini.</p>
          </section>

          <section>
            <h2>9. Hubungi kami</h2>
            <p>
              {name}{settings?.address ? `, ${settings.address}` : ''}.<br />
              {email && <>Email: <a href={`mailto:${email}`} className="font-semibold text-primary hover:underline">{email}</a><br /></>}
              {settings?.phone && <>Telepon/WhatsApp: {settings.phone}</>}
            </p>
          </section>
        </div>
      </article>
    </Layout>
  );
};

export default PrivacyPolicy;
