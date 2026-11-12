// =====================================================================
// Kantor virtual Kediaman — "karyawan agent" yang bekerja terjadwal di dalam API.
//
// Agent internal (dijalankan di sini):
//   sales   Sari  — Sales follow-up: booking masuk yang belum ditindaklanjuti → draf pesan WhatsApp (perlu disetujui)
//   seo     Bima  — Analis SEO & laporan: laporan mingguan (Senin 07:00 WIB) dari data booking, artikel, newsletter, Rewards
//   social  Nadia — Admin media sosial: tiap pagi draf caption Instagram/TikTok dari artikel, portfolio, promo (perlu disetujui)
//   guard   Raka  — Penjaga website: cek halaman penting tiap 30 menit, lapor bila error/lambat
// Agent eksternal (hanya dipantau): writer Dewi (Railway Function article-agent), chat Ayu (chat website).
//
// Aturan: TIDAK ADA yang terkirim ke klien/publik tanpa persetujuan tim. Draf masuk "meja persetujuan"
// (office_tasks status 'pending'); tim menyetujui lalu mengirim sendiri (WhatsApp dibuka dengan teks terisi).
// Laporan & peringatan internal (status 'info') juga dikirim ke Telegram tim bila TELEGRAM_* diisi.
//
// Penjadwal: cek tiap menit; klaim atomik lewat kolom running_since sehingga aman walau ada >1 instance API.
// Env: ANTHROPIC_API_KEY (+ OFFICE_MODEL), TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID, PUBLIC_SITE_URL (default https://kediaman.co)
// =====================================================================
import type { Hono } from "hono";
import type { SQL } from "bun";

type Ctx = { userId: string | null; isAdmin: boolean };
type Deps = {
  app: Hono;
  sql: SQL;
  getCtx: (auth?: string | null) => Promise<Ctx>;
  limited: (key: string, max: number, windowMs?: number) => boolean;
  ip: (c: any) => string;
  tooMany: (c: any, msg?: string, retry?: number) => Response;
  env: Record<string, string | undefined>;
};

export const OFFICE_SQL = `
CREATE TABLE IF NOT EXISTS office_agents (
  id text PRIMARY KEY,
  is_active boolean NOT NULL DEFAULT true,
  last_run_at timestamptz,
  last_status text,
  last_summary text,
  running_since timestamptz,
  state jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS office_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id text NOT NULL,
  trigger text NOT NULL DEFAULT 'jadwal',
  status text NOT NULL DEFAULT 'running',
  summary text,
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz
);
CREATE INDEX IF NOT EXISTS office_runs_agent_idx ON office_runs (agent_id, started_at DESC);
CREATE TABLE IF NOT EXISTS office_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id text NOT NULL,
  kind text NOT NULL,
  title text NOT NULL,
  body text NOT NULL DEFAULT '',
  target text,
  link text,
  image_url text,
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'pending',
  dedupe_key text,
  created_at timestamptz NOT NULL DEFAULT now(),
  decided_at timestamptz,
  decided_by uuid
);
CREATE UNIQUE INDEX IF NOT EXISTS office_tasks_dedupe_key ON office_tasks (dedupe_key) WHERE dedupe_key IS NOT NULL;
CREATE INDEX IF NOT EXISTS office_tasks_status_idx ON office_tasks (status, created_at DESC);
`;

type AgentDef = {
  id: string; name: string; role: string; avatar: string; schedule: string; description: string;
  external?: boolean;
  /** Apakah agent jatuh tempo pada waktu WIB ini (jam 0-23, hari 0=Minggu), dengan waktu jalan terakhir. */
  due?: (wib: { h: number; m: number; dow: number; date: string }, last: Date | null, now: Date) => boolean;
  run?: (d: Deps) => Promise<string>;
};

const SITE = () => (process.env.PUBLIC_SITE_URL || "https://kediaman.co").replace(/\/$/, "");
const MIN = 60_000;

function wibParts(now = new Date()) {
  const f = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", weekday: "short", hourCycle: "h23" });
  const p = Object.fromEntries(f.formatToParts(now).map((x) => [x.type, x.value]));
  const dow = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(p.weekday);
  return { h: Number(p.hour), m: Number(p.minute), dow, date: `${p.year}-${p.month}-${p.day}` };
}
const wibDate = (d: Date) => wibParts(d).date;

/** Nomor HP Indonesia → format internasional tanpa + (untuk wa.me). */
export function waNumber(raw: string | null | undefined): string | null {
  let d = String(raw ?? "").replace(/\D/g, "");
  if (d.startsWith("0")) d = `62${d.slice(1)}`;
  else if (d.startsWith("8")) d = `62${d}`;
  return d.length >= 10 && d.length <= 15 ? d : null;
}

/** Kolom DATE dari Postgres bisa berupa Date atau string → "YYYY-MM-DD" (tanpa geser zona waktu). */
const ymd = (v: unknown): string | null => {
  if (!v) return null;
  if (v instanceof Date) return `${v.getFullYear()}-${String(v.getMonth() + 1).padStart(2, "0")}-${String(v.getDate()).padStart(2, "0")}`;
  const m = String(v).match(/^\d{4}-\d{2}-\d{2}/);
  return m ? m[0] : null;
};
const rupiah = (n: unknown) => { const v = Number(n); return v > 0 ? `Rp${v.toLocaleString("id-ID")}` : "-"; };
const tanggal = (d: unknown) => { const v = ymd(d); return v ? new Date(`${v}T00:00:00`).toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" }) : "belum ditentukan"; };

async function claude(env: Deps["env"], system: string, user: string, maxTokens = 900): Promise<string> {
  const key = env.ANTHROPIC_API_KEY;
  if (!key) throw new Error("ANTHROPIC_API_KEY belum diisi");
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "x-api-key": key, "anthropic-version": "2023-06-01", "content-type": "application/json" },
    body: JSON.stringify({ model: env.OFFICE_MODEL || env.CHAT_MODEL || "claude-sonnet-5-5", max_tokens: maxTokens, system, messages: [{ role: "user", content: user }] }),
    signal: AbortSignal.timeout(90_000),
  });
  if (!res.ok) throw new Error(`Claude HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const out = await res.json() as { content: { type: string; text?: string }[] };
  return out.content.filter((b) => b.type === "text").map((b) => b.text).join("\n").trim();
}

const escTg = (v: unknown) => String(v ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
async function telegram(env: Deps["env"], html: string): Promise<void> {
  const token = env.TELEGRAM_BOT_TOKEN?.trim();
  const chats = String(env.TELEGRAM_CHAT_ID ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  if (!token || !chats.length) return;
  for (const chat_id of chats) {
    try {
      await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: "POST", headers: { "content-type": "application/json" }, signal: AbortSignal.timeout(15_000),
        body: JSON.stringify({ chat_id, text: html.slice(0, 4096), parse_mode: "HTML", link_preview_options: { is_disabled: true } }),
      });
    } catch (e) { console.error("office telegram:", (e as Error)?.message); }
  }
}

/** Tambah tugas ke meja persetujuan; dedupe_key mencegah draf ganda. Return true bila baru. */
async function addTask(sql: SQL, t: { agent: string; kind: string; title: string; body: string; target?: string | null; link?: string | null; image?: string | null; meta?: unknown; status?: string; dedupe?: string | null }): Promise<boolean> {
  const rows = await sql`INSERT INTO office_tasks (agent_id, kind, title, body, target, link, image_url, meta, status, dedupe_key)
    VALUES (${t.agent}, ${t.kind}, ${t.title.slice(0, 300)}, ${t.body}, ${t.target ?? null}, ${t.link ?? null}, ${t.image ?? null},
            ${JSON.stringify(t.meta ?? {})}::jsonb, ${t.status ?? "pending"}, ${t.dedupe ?? null})
    ON CONFLICT DO NOTHING RETURNING id`;
  return rows.length > 0;
}

// ------------------------------------------------------------------ Sari · Sales follow-up
async function runSales(d: Deps): Promise<string> {
  const { sql, env } = d;
  // Booking/permintaan yang masih "pending": follow-up pertama setelah 30 menit, follow-up kedua 3 hari kemudian.
  const rows = await sql`
    SELECT b.id, b.contact_name, b.contact_phone, b.booking_date, b.event_type, b.guest_count, b.notes, b.created_at,
           l.name AS venue, l.slug AS venue_slug,
           (SELECT min(p.price) FROM venue_packages p WHERE p.location_id = l.id AND p.is_active AND p.price > 0) AS min_price,
           (SELECT max(t.created_at) FROM office_tasks t WHERE t.agent_id = 'sales' AND t.meta->>'booking_id' = b.id::text) AS last_task_at,
           (SELECT count(*)::int FROM office_tasks t WHERE t.agent_id = 'sales' AND t.meta->>'booking_id' = b.id::text) AS task_count
    FROM ballroom_bookings b JOIN locations l ON l.id = b.location_id
    WHERE b.status = 'pending' AND b.created_at > now() - interval '21 days' AND b.created_at < now() - interval '30 minutes'
    ORDER BY b.created_at ASC LIMIT 40`;
  const todo = (rows as any[]).filter((r) => r.task_count === 0 || (r.task_count === 1 && r.last_task_at && Date.now() - new Date(r.last_task_at).getTime() > 3 * 24 * 3600_000)).slice(0, 8);
  let made = 0;
  const urgent: string[] = [];
  for (const b of todo) {
    const stage = b.task_count === 0 ? 1 : 2;
    const phone = waNumber(b.contact_phone);
    const fromChat = b.event_type === "Chat";
    const brief = [
      `Nama calon klien: ${b.contact_name}`,
      `Venue diminati: ${b.venue} (${SITE()}/lokasi/${b.venue_slug})`,
      `Tanggal acara: ${tanggal(b.booking_date)}`,
      b.guest_count ? `Jumlah tamu: ${b.guest_count}` : "",
      b.min_price ? `Paket venue ini mulai: ${rupiah(b.min_price)}` : "",
      `Sumber: ${fromChat ? "chat website" : "form booking website"}`,
      b.notes ? `Catatan/pesan klien: ${String(b.notes).slice(0, 500)}` : "",
      `Tahap: ${stage === 1 ? "follow-up pertama (perkenalan & tindak lanjut permintaan)" : "follow-up kedua (klien belum membalas 3 hari)"}`,
    ].filter(Boolean).join("\n");
    const text = await claude(env,
      `Kamu admin sales Kediaman (venue & ballroom pernikahan/acara). Tulis SATU pesan WhatsApp dalam Bahasa Indonesia yang hangat, sopan, dan natural seperti admin manusia (sapaan "Kak"), maksimal 90 kata, tanpa markdown/bullet berlebihan, boleh 1 emoji. ` +
      `Tujuan: menindaklanjuti permintaan booking dan mengajak langkah berikutnya (konfirmasi tanggal & jumlah tamu, tawarkan jadwal survei venue atau kirim pricelist). ` +
      `Jangan menjanjikan diskon, ketersediaan tanggal, atau harga selain yang diberikan. Akhiri dengan pertanyaan singkat. Tanda tangan: "Admin Kediaman". Tulis HANYA isi pesannya.`,
      brief, 400);
    const ok = await addTask(sql, {
      agent: "sales", kind: "whatsapp",
      title: `Follow-up ${stage === 2 ? "ke-2 " : ""}${b.contact_name} · ${b.venue} · ${ymd(b.booking_date) ?? "tanggal belum ada"}`,
      body: text, target: phone, link: `/admin/ballroom-bookings`,
      meta: { booking_id: String(b.id), stage, phone_raw: b.contact_phone, source: fromChat ? "chat" : "form" },
      dedupe: `sales:${b.id}:${stage}`,
    });
    if (ok) made++;
    const ev = ymd(b.booking_date);
    if (ev && new Date(`${ev}T00:00:00`).getTime() - Date.now() < 30 * 24 * 3600_000) urgent.push(`${b.contact_name} (${b.venue}, ${ev})`);
  }
  const [{ n: pendingAll }] = await sql`SELECT count(*)::int AS n FROM ballroom_bookings WHERE status = 'pending'`;
  if (made) {
    await telegram(env, `💼 <b>Sari (Sales)</b> menyiapkan ${made} draf follow-up WhatsApp.\n${urgent.length ? `⏰ Acara < 30 hari: ${escTg(urgent.join(", "))}\n` : ""}Setujui & kirim di ${SITE()}/admin/kantor`);
  }
  return made ? `${made} draf follow-up baru · ${pendingAll} booking masih pending${urgent.length ? ` · ${urgent.length} acara < 30 hari` : ""}` : `Tidak ada follow-up baru · ${pendingAll} booking pending`;
}

// ------------------------------------------------------------------ Bima · Analis SEO & laporan
async function runSeo(d: Deps): Promise<string> {
  const { sql, env } = d;
  const [week] = await sql`
    SELECT
      (SELECT count(*)::int FROM ballroom_bookings WHERE created_at > now() - interval '7 days') AS bookings_7,
      (SELECT count(*)::int FROM ballroom_bookings WHERE created_at > now() - interval '14 days' AND created_at <= now() - interval '7 days') AS bookings_prev,
      (SELECT count(*)::int FROM ballroom_bookings WHERE created_at > now() - interval '7 days' AND event_type = 'Chat') AS chat_leads_7,
      (SELECT count(*)::int FROM ballroom_bookings WHERE status = 'pending') AS pending_all,
      (SELECT count(*)::int FROM ballroom_bookings WHERE status IN ('approved','paid','completed') AND updated_at > now() - interval '7 days') AS won_7,
      (SELECT count(*)::int FROM articles WHERE is_published AND published_at > now() - interval '7 days') AS articles_7,
      (SELECT count(*)::int FROM articles WHERE is_published) AS articles_all,
      (SELECT count(*)::int FROM newsletter_subscribers WHERE created_at > now() - interval '7 days') AS newsletter_7,
      (SELECT count(*)::int FROM loyalty_members WHERE created_at > now() - interval '7 days') AS rewards_7,
      (SELECT count(*)::int FROM job_applications WHERE created_at > now() - interval '7 days') AS applicants_7`;
  const byVenue = await sql`
    SELECT l.name, count(b.id)::int AS n
    FROM locations l LEFT JOIN ballroom_bookings b ON b.location_id = l.id AND b.created_at > now() - interval '28 days'
    WHERE l.is_active GROUP BY l.name ORDER BY n DESC, l.name LIMIT 15`;
  let segments: any[] = [];
  try {
    segments = await sql`SELECT coalesce(segment,'umum') AS segment, count(*)::int AS n FROM article_agent_runs
                         WHERE status IN ('published','draft') AND created_at > now() - interval '7 days' GROUP BY 1 ORDER BY n DESC`;
  } catch { /* tabel agen artikel belum ada */ }
  const recent = await sql`SELECT title, slug FROM articles WHERE is_published ORDER BY published_at DESC NULLS LAST LIMIT 8`;
  const popular = await sql`SELECT title, coalesce(view_count, 0)::int AS views FROM articles WHERE is_published ORDER BY view_count DESC NULLS LAST LIMIT 5`;
  const data = [
    `Booking/permintaan masuk 7 hari: ${week.bookings_7} (minggu sebelumnya ${week.bookings_prev}); dari chat: ${week.chat_leads_7}`,
    `Booking pending (semua): ${week.pending_all}; deal/approved/paid 7 hari: ${week.won_7}`,
    `Permintaan per venue 28 hari: ${(byVenue as any[]).map((v) => `${v.name}=${v.n}`).join(", ")}`,
    `Artikel terbit 7 hari: ${week.articles_7} (total ${week.articles_all}); per segmen: ${segments.map((s) => `${s.segment}=${s.n}`).join(", ") || "-"}`,
    `Artikel terbaru: ${(recent as any[]).map((a) => a.title).join(" | ")}`,
    `Artikel paling banyak dibaca (total): ${(popular as any[]).map((a) => `${a.title} (${a.views}x)`).join(" | ")}`,
    `Newsletter baru 7 hari: ${week.newsletter_7}; anggota Rewards baru: ${week.rewards_7}; pelamar kerja: ${week.applicants_7}`,
    `Catatan: data Google Search Console/GA4 belum tersambung ke agent; hasil Search Console terakhir (28 hari s.d. 9 Nov 2026): 96 klik, 3.116 tayangan, CTR 3,1%, 57% klik dari pencarian "kediaman corp"; pencarian nama venue 1.217 tayangan tapi 1 klik.`,
  ].join("\n");
  const report = await claude(env,
    `Kamu analis SEO & growth untuk Kediaman (operator venue/ballroom pernikahan & acara, website kediaman.co). Tulis laporan mingguan singkat dalam Bahasa Indonesia untuk pemilik bisnis, format teks polos dengan judul bagian berhuruf kapital dan poin "- ". ` +
    `Bagian: RINGKASAN (2-3 kalimat), ANGKA MINGGU INI, YANG PERLU PERHATIAN, 3 AKSI MINGGU DEPAN (konkret, bisa dikerjakan tim/agent; prioritaskan yang menaikkan booking). ` +
    `Jangan mengarang angka di luar data; sebutkan bila data tidak tersedia. Maksimal 280 kata.`,
    data, 1200);
  const week_no = wibDate(new Date());
  await addTask(sql, { agent: "seo", kind: "report", title: `Laporan mingguan ${week_no}`, body: report, status: "info", meta: { data }, dedupe: `seo:${week_no}` });
  await telegram(env, `📊 <b>Bima (SEO)</b> — laporan mingguan siap.\nBooking 7 hari: ${week.bookings_7} (sebelumnya ${week.bookings_prev}) · artikel: ${week.articles_7}\nBaca lengkap: ${SITE()}/admin/kantor`);
  return `Laporan mingguan dibuat · booking 7 hari ${week.bookings_7} (sebelumnya ${week.bookings_prev})`;
}

// ------------------------------------------------------------------ Nadia · Admin media sosial
async function runSocial(d: Deps): Promise<string> {
  const { sql, env } = d;
  const used = new Set((await sql`SELECT meta->>'ref' AS ref FROM office_tasks WHERE agent_id = 'social' AND created_at > now() - interval '30 days'`).map((r: any) => String(r.ref)));
  const picks: { ref: string; type: string; title: string; text: string; link: string; image: string | null }[] = [];
  const articles = await sql`SELECT id, title, slug, excerpt, featured_image FROM articles WHERE is_published ORDER BY published_at DESC NULLS LAST LIMIT 10`;
  const a = (articles as any[]).find((x) => !used.has(`article:${x.id}`));
  if (a) picks.push({ ref: `article:${a.id}`, type: "Artikel", title: a.title, text: a.excerpt ?? "", link: `${SITE()}/artikel/${a.slug}`, image: a.featured_image });
  const portfolios = await sql`SELECT id, name, slug, specialization, bio, photo_url FROM trainers WHERE is_active ORDER BY random() LIMIT 10`;
  const p = (portfolios as any[]).find((x) => !used.has(`portfolio:${x.id}`));
  if (p) picks.push({ ref: `portfolio:${p.id}`, type: "Portfolio acara", title: p.name, text: `${p.specialization ?? ""} ${String(p.bio ?? "").replace(/<[^>]*>/g, " ").slice(0, 400)}`, link: `${SITE()}/portfolio/${p.slug ?? p.id}`, image: p.photo_url });
  const promos = await sql`SELECT id, name, slug, description, image_url FROM programs WHERE is_active ORDER BY created_at DESC LIMIT 5`;
  const pr = (promos as any[]).find((x) => !used.has(`promo:${x.id}`));
  if (pr && picks.length < 3) picks.push({ ref: `promo:${pr.id}`, type: "Promo", title: pr.name, text: String(pr.description ?? "").replace(/<[^>]*>/g, " ").slice(0, 400), link: `${SITE()}/promo/${pr.slug ?? pr.id}`, image: pr.image_url });
  let made = 0;
  const today = wibDate(new Date());
  for (const it of picks.slice(0, 2)) {
    const caption = await claude(env,
      `Kamu admin media sosial Kediaman (venue & ballroom pernikahan/acara, Instagram & TikTok). Buat draf posting Bahasa Indonesia untuk disetujui tim. Format teks polos persis:\n` +
      `CAPTION:\n<caption Instagram 60-120 kata, hangat & mengajak, boleh 2-4 emoji, ajakan "cek jadwal/booking via link di bio" atau DM>\n\nHASHTAG:\n<10-15 hashtag relevan, campur umum & lokal (mis. #venuejakarta #weddingjakarta #kediaman)>\n\nHOOK TIKTOK/REELS:\n<1 kalimat pembuka video 3 detik pertama>\n\nIDE VISUAL:\n<1-2 kalimat foto/video yang dipakai>\n\nJAM POSTING:\n<saran jam posting WIB>\n` +
      `Jangan mengarang harga, testimoni, atau fakta yang tidak ada di bahan. Jangan sebut nama klien kecuali memang ada di judul portfolio.`,
      `Jenis konten: ${it.type}\nJudul: ${it.title}\nRingkasan: ${it.text}\nLink: ${it.link}`, 900);
    const ok = await addTask(sql, { agent: "social", kind: "caption", title: `${it.type}: ${it.title}`, body: caption, link: it.link, image: it.image, meta: { ref: it.ref, type: it.type }, dedupe: `social:${it.ref}:${today}` });
    if (ok) made++;
  }
  if (made) await telegram(env, `📱 <b>Nadia (Medsos)</b> menyiapkan ${made} draf posting untuk hari ini. Setujui di ${SITE()}/admin/kantor`);
  return made ? `${made} draf posting baru` : "Belum ada bahan konten baru";
}

// ------------------------------------------------------------------ Raka · Penjaga website
async function runGuard(d: Deps): Promise<string> {
  const { sql, env } = d;
  const base = SITE();
  const [venue] = await sql`SELECT slug FROM locations WHERE is_active AND slug IS NOT NULL ORDER BY sort_order LIMIT 1`;
  const [article] = await sql`SELECT slug FROM articles WHERE is_published ORDER BY published_at DESC NULLS LAST LIMIT 1`;
  const checks = [
    { name: "Beranda", url: `${base}/`, expect: "<div id=\"root\"" },
    { name: "Daftar venue", url: `${base}/lokasi`, expect: "<div id=\"root\"" },
    venue ? { name: "Detail venue", url: `${base}/lokasi/${venue.slug}`, expect: "<div id=\"root\"" } : null,
    article ? { name: "Artikel terbaru", url: `${base}/artikel/${article.slug}`, expect: "<div id=\"root\"" } : null,
    { name: "Sitemap", url: `${base}/sitemap.xml`, expect: "<urlset" },
  ].filter(Boolean) as { name: string; url: string; expect: string }[];
  const results: { name: string; ok: boolean; ms: number; note: string }[] = [];
  for (const c of checks) {
    const t0 = Date.now();
    try {
      const res = await fetch(c.url, { headers: { "User-Agent": "KediamanGuard/1.0" }, signal: AbortSignal.timeout(20_000), redirect: "follow" });
      const body = await res.text();
      const ms = Date.now() - t0;
      const ok = res.ok && body.includes(c.expect);
      results.push({ name: c.name, ok, ms, note: ok ? (ms > 4000 ? "lambat" : "") : `HTTP ${res.status}` });
    } catch (e) {
      results.push({ name: c.name, ok: false, ms: Date.now() - t0, note: (e as Error)?.name === "TimeoutError" ? "timeout" : "tidak bisa diakses" });
    }
  }
  // Database & data penting
  try { await sql`SELECT 1`; results.push({ name: "Database", ok: true, ms: 0, note: "" }); }
  catch { results.push({ name: "Database", ok: false, ms: 0, note: "tidak terhubung" }); }

  const failed = results.filter((r) => !r.ok);
  const slow = results.filter((r) => r.ok && r.note === "lambat");
  const [agent] = await sql`SELECT state FROM office_agents WHERE id = 'guard'`;
  const prevFailed: string[] = (agent?.state?.failed ?? []) as string[];
  const nowFailed = failed.map((f) => f.name);
  const newlyFailed = nowFailed.filter((n) => !prevFailed.includes(n));
  const recovered = prevFailed.filter((n) => !nowFailed.includes(n));
  await sql`UPDATE office_agents SET state = ${JSON.stringify({ failed: nowFailed, results, checked_at: new Date().toISOString() })}::jsonb WHERE id = 'guard'`;
  if (newlyFailed.length) {
    const msg = failed.map((f) => `• ${f.name}: ${f.note}`).join("\n");
    await addTask(sql, { agent: "guard", kind: "alert", title: `Website bermasalah: ${newlyFailed.join(", ")}`, body: msg, status: "info" });
    await telegram(env, `🚨 <b>Raka (Penjaga website)</b> menemukan masalah:\n${escTg(msg)}\n${base}`);
  }
  if (recovered.length) await telegram(env, `✅ <b>Raka</b>: ${escTg(recovered.join(", "))} sudah normal kembali.`);
  const avg = Math.round(results.filter((r) => r.ms).reduce((s, r) => s + r.ms, 0) / Math.max(1, results.filter((r) => r.ms).length));
  if (failed.length) throw new Error(`${failed.length} cek gagal: ${failed.map((f) => `${f.name} (${f.note})`).join(", ")}`);
  return `${results.length} cek normal · rata-rata ${avg} ms${slow.length ? ` · lambat: ${slow.map((s) => s.name).join(", ")}` : ""}`;
}

// ------------------------------------------------------------------ daftar karyawan
export const AGENTS: AgentDef[] = [
  {
    id: "sales", name: "Sari", role: "Sales follow-up", avatar: "SR", schedule: "Tiap jam, 08:00–20:00 WIB",
    description: "Memantau booking masuk yang belum ditindaklanjuti, menyiapkan draf pesan WhatsApp follow-up (pertama & setelah 3 hari).",
    due: (w, last, now) => w.h >= 8 && w.h <= 20 && (!last || now.getTime() - last.getTime() >= 55 * MIN), run: runSales,
  },
  {
    id: "seo", name: "Bima", role: "Analis SEO & laporan", avatar: "BM", schedule: "Senin 07:00 WIB",
    description: "Menyusun laporan mingguan: booking per venue, artikel, newsletter, Rewards, plus 3 aksi prioritas minggu depan.",
    // Tiap Senin ≥07:00 WIB, sekali per Senin (jalan manual di hari lain tidak menggeser jadwal)
    due: (w, last) => w.dow === 1 && w.h >= 7 && (!last || wibDate(last) !== w.date), run: runSeo,
  },
  {
    id: "social", name: "Nadia", role: "Admin media sosial", avatar: "ND", schedule: "Tiap hari 07:30 WIB",
    description: "Menyiapkan draf caption Instagram/TikTok, hashtag, hook video, dan jam posting dari artikel, portfolio, dan promo terbaru.",
    due: (w, last) => (w.h > 7 || (w.h === 7 && w.m >= 30)) && w.h < 22 && (!last || wibDate(last) !== w.date), run: runSocial,
  },
  {
    id: "guard", name: "Raka", role: "Penjaga website", avatar: "RK", schedule: "Tiap 30 menit",
    description: "Mengecek beranda, venue, artikel, sitemap, dan database. Memberi peringatan bila ada yang error atau lambat.",
    due: (_w, last, now) => !last || now.getTime() - last.getTime() >= 29 * MIN, run: runGuard,
  },
  { id: "writer", name: "Dewi", role: "Penulis artikel", avatar: "DW", schedule: "5 artikel/hari, 05:00–00:00 WIB", external: true,
    description: "Menulis artikel SEO berniat booking (umum, syar'i, Gen Z, MICE) lengkap dengan gambar yang dicek relevansinya." },
  { id: "chat", name: "Ayu", role: "Admin chat website", avatar: "AY", schedule: "24 jam", external: true,
    description: "Menjawab chat pengunjung seperti admin manusia, cek jadwal ballroom, dan menyimpan kontak calon klien ke Booking masuk." },
];

// ------------------------------------------------------------------ mesin
async function execute(d: Deps, def: AgentDef, trigger: string): Promise<{ ok: boolean; summary: string }> {
  const { sql } = d;
  const claimed = await sql`UPDATE office_agents SET running_since = now()
    WHERE id = ${def.id} AND (running_since IS NULL OR running_since < now() - interval '20 minutes') RETURNING id`;
  if (!claimed.length) return { ok: false, summary: "Sedang berjalan" };
  const [run] = await sql`INSERT INTO office_runs (agent_id, trigger) VALUES (${def.id}, ${trigger}) RETURNING id`;
  let ok = true, summary = "";
  try { summary = await def.run!(d); }
  catch (e) { ok = false; summary = String((e as Error)?.message ?? e).slice(0, 500); console.error(`office ${def.id}:`, summary); }
  await sql`UPDATE office_runs SET status = ${ok ? "ok" : "gagal"}, summary = ${summary}, finished_at = now() WHERE id = ${run.id}`;
  await sql`UPDATE office_agents SET running_since = NULL, last_run_at = now(), last_status = ${ok ? "ok" : "gagal"}, last_summary = ${summary}, updated_at = now() WHERE id = ${def.id}`;
  return { ok, summary };
}

export async function officeBootstrap(sql: SQL): Promise<void> {
  await sql.unsafe(OFFICE_SQL);
  for (const a of AGENTS) await sql`INSERT INTO office_agents (id) VALUES (${a.id}) ON CONFLICT (id) DO NOTHING`;
  // Bila server mati saat agent berjalan, lepaskan klaim lama
  await sql`UPDATE office_agents SET running_since = NULL WHERE running_since < now() - interval '20 minutes'`;
  await sql`DELETE FROM office_runs WHERE started_at < now() - interval '60 days'`;
}

export function startOfficeScheduler(d: Deps): void {
  if (d.env.OFFICE_SCHEDULER === "off") { console.log("office: penjadwal dimatikan (OFFICE_SCHEDULER=off)"); return; }
  const tick = async () => {
    try {
      const rows = await d.sql`SELECT id, is_active, last_run_at FROM office_agents`;
      const byId = new Map((rows as any[]).map((r) => [r.id, r]));
      const now = new Date();
      const w = wibParts(now);
      for (const def of AGENTS) {
        const r = byId.get(def.id);
        if (!def.run || !def.due || !r?.is_active) continue;
        if (def.due(w, r.last_run_at ? new Date(r.last_run_at) : null, now)) await execute(d, def, "jadwal");
      }
    } catch (e) { console.error("office tick:", (e as Error)?.message); }
  };
  setTimeout(tick, 90_000);          // beri waktu server siap dulu
  setInterval(tick, MIN);
}

// ------------------------------------------------------------------ endpoint admin
export function registerOfficeRoutes(d: Deps): void {
  const { app, sql } = d;
  const admin = async (c: any) => {
    const ctx = await d.getCtx(c.req.header("authorization"));
    if (!ctx.userId) return { ctx, res: c.json({ error: "Silakan masuk dulu" }, 401) };
    if (!ctx.isAdmin) return { ctx, res: c.json({ error: "Khusus admin" }, 403) };
    return { ctx, res: null };
  };

  app.get("/functions/v1/office", async (c) => {
    const { res } = await admin(c); if (res) return res;
    if (d.limited(`office:${d.ip(c)}`, 120)) return d.tooMany(c);
    const rows = await sql`SELECT * FROM office_agents`;
    const byId = new Map((rows as any[]).map((r) => [r.id, r]));
    const [stats] = await sql`SELECT
      (SELECT count(*)::int FROM office_tasks WHERE status = 'pending') AS pending,
      (SELECT count(*)::int FROM office_tasks WHERE status IN ('approved','done') AND decided_at > now() - interval '7 days') AS approved_7,
      (SELECT count(*)::int FROM ballroom_bookings WHERE event_type = 'Chat' AND created_at > now() - interval '1 day') AS chat_leads_24h,
      (SELECT count(*)::int FROM ballroom_bookings WHERE event_type = 'Chat' AND created_at > now() - interval '7 days') AS chat_leads_7`;
    let writer: any = {};
    try {
      [writer] = await sql`SELECT
        (SELECT count(*)::int FROM article_agent_runs WHERE status IN ('published','draft') AND (created_at AT TIME ZONE 'Asia/Jakarta')::date = (now() AT TIME ZONE 'Asia/Jakarta')::date) AS today,
        (SELECT max(created_at) FROM article_agent_runs) AS last_run,
        (SELECT status FROM article_agent_runs ORDER BY created_at DESC LIMIT 1) AS last_status,
        (SELECT a.title FROM article_agent_runs r JOIN articles a ON a.id = r.article_id ORDER BY r.created_at DESC LIMIT 1) AS last_title`;
    } catch { /* belum ada */ }
    const agents = AGENTS.map((a) => {
      const r = byId.get(a.id) ?? {};
      const base = { id: a.id, name: a.name, role: a.role, avatar: a.avatar, schedule: a.schedule, description: a.description, external: !!a.external };
      if (a.id === "writer") return { ...base, is_active: true, last_run_at: writer?.last_run ?? null, last_status: writer?.last_status === "failed" ? "gagal" : writer?.last_run ? "ok" : null,
        last_summary: writer?.last_title ? `${writer.today ?? 0}/5 artikel hari ini · terakhir: ${writer.last_title}` : "Belum ada data" };
      if (a.id === "chat") return { ...base, is_active: true, last_run_at: null, last_status: "ok",
        last_summary: `${stats.chat_leads_24h} kontak calon klien dari chat (24 jam) · ${stats.chat_leads_7} dalam 7 hari` };
      return { ...base, is_active: r.is_active ?? true, last_run_at: r.last_run_at ?? null, last_status: r.running_since ? "berjalan" : r.last_status ?? null, last_summary: r.last_summary ?? null, state: a.id === "guard" ? r.state : undefined };
    });
    const tasks = await sql`SELECT * FROM office_tasks WHERE status = 'pending' OR created_at > now() - interval '14 days' ORDER BY (status = 'pending') DESC, created_at DESC LIMIT 120`;
    const runs = await sql`SELECT id, agent_id, trigger, status, summary, started_at, finished_at FROM office_runs ORDER BY started_at DESC LIMIT 60`;
    return c.json({ agents, tasks, runs, stats });
  });

  app.post("/functions/v1/office/agents/:id", async (c) => {
    const { res } = await admin(c); if (res) return res;
    if (d.limited(`office-w:${d.ip(c)}`, 60)) return d.tooMany(c);
    const def = AGENTS.find((a) => a.id === c.req.param("id"));
    if (!def || def.external) return c.json({ error: "Agent tidak dikenal" }, 404);
    const { is_active } = await c.req.json().catch(() => ({}));
    await sql`UPDATE office_agents SET is_active = ${!!is_active}, updated_at = now() WHERE id = ${def.id}`;
    return c.json({ ok: true });
  });

  app.post("/functions/v1/office/agents/:id/run", async (c) => {
    const { res } = await admin(c); if (res) return res;
    if (d.limited(`office-run:${d.ip(c)}`, 10)) return d.tooMany(c);
    const def = AGENTS.find((a) => a.id === c.req.param("id"));
    if (!def?.run) return c.json({ error: "Agent ini tidak bisa dijalankan dari sini" }, 400);
    // Jalankan di latar belakang; halaman memantau statusnya
    execute(d, def, "manual").catch((e) => console.error("office run:", e?.message));
    return c.json({ ok: true, started: true }, 202);
  });

  app.post("/functions/v1/office/tasks/:id", async (c) => {
    const { ctx, res } = await admin(c); if (res) return res;
    if (d.limited(`office-w:${d.ip(c)}`, 60)) return d.tooMany(c);
    const id = c.req.param("id");
    if (!/^[0-9a-f-]{36}$/i.test(id)) return c.json({ error: "ID tidak valid" }, 400);
    const { action, body } = await c.req.json().catch(() => ({}));
    const status = action === "approve" ? "approved" : action === "reject" ? "rejected" : action === "done" ? "done" : action === "reopen" ? "pending" : null;
    if (!status) return c.json({ error: "Aksi tidak dikenal" }, 400);
    const text = typeof body === "string" && body.trim() ? body.trim().slice(0, 8000) : null;
    const rows = await sql`UPDATE office_tasks SET status = ${status}, body = coalesce(${text}, body),
        decided_at = ${status === "pending" ? null : new Date().toISOString()}, decided_by = ${status === "pending" ? null : ctx.userId}::uuid
      WHERE id = ${id}::uuid RETURNING *`;
    if (!rows.length) return c.json({ error: "Tugas tidak ditemukan" }, 404);
    return c.json({ ok: true, task: rows[0] });
  });
}
