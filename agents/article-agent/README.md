# Agen artikel otomatis (Railway Function `article-agent`)

Kode yang berjalan ada di service **article-agent** di Railway; file di folder ini salinannya.

- Jadwal: setiap hari 08.00 WIB (`0 1 * * *` UTC).
- Keyword dirotasi: wedding, venue, sewa ballroom, ballroom jakarta, ballroom bandung, ballroom tangerang selatan.
- Gambar utama: folder Google Drive -> Pexels (bila `PEXELS_API_KEY` diisi) -> Openverse (lisensi komersial, kredit otomatis).
- Riwayat dan error: tabel `article_agent_runs` di Postgres.

Variabel yang wajib diisi di service article-agent: `ANTHROPIC_API_KEY`, `GDRIVE_FOLDER_ID`, `GOOGLE_API_KEY`.
Opsional: `PEXELS_API_KEY`, `PUBLISH=false` (simpan sebagai draft), `DRY_RUN=true` (uji tanpa menyimpan).
