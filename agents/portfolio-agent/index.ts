// =====================================================================
// kediaman-portfolio-agent — posting portfolio pengantin otomatis ke kediaman.co
// Railway Function dengan cron (1 portfolio per hari).
//
// Alur satu kali jalan:
//   1. Baca semua Google Sheet portfolio venue (dibaca ulang setiap jalan, jadi baris baru ikut terbaca).
//   2. Kumpulkan pasangan yang punya link foto Google Drive dan belum pernah diposting.
//   3. Pilih satu (venue bergiliran, acara terbaru dulu), ambil foto dari folder Drive-nya.
//   4. Claude melihat foto (pilih sampul, buang yang tidak layak) dan menulis cerita singkat.
//   5. Foto dikecilkan (WebP) ke MinIO, entri dibuat di tabel `trainers` (Portfolio).
//
// Variabel lingkungan:
//   DATABASE_URL, MINIO_ENDPOINT, MINIO_ROOT_USER, MINIO_ROOT_PASSWORD, ANTHROPIC_API_KEY, GOOGLE_API_KEY (wajib)
//   PORTFOLIO_SHEETS   opsional, satu per baris: "Nama Venue | link sheet" (menggantikan daftar bawaan)
//   STORAGE_PUBLIC_URL default https://bucket-jwta-production.up.railway.app
//   ANTHROPIC_MODEL    default claude-sonnet-5-5
//   PER_RUN            jumlah portfolio per jalan (default 1)
//   PUBLISH            "true" (default) langsung tayang, "false" masuk CMS sebagai nonaktif
//   DRY_RUN            "true" = hanya log, tidak menyimpan apa pun
// =====================================================================
import { SQL, S3Client } from "bun";
import * as XLSX from "xlsx";
import sharp from "sharp";

const env = Bun.env;
const SITE_URL = "https://kediaman.co";
const MODEL = env.ANTHROPIC_MODEL || "claude-sonnet-5-5";
const PUBLISH = (env.PUBLISH ?? "true").toLowerCase() !== "false";
const DRY_RUN = (env.DRY_RUN ?? "false").toLowerCase() === "true";
const PER_RUN = Math.max(1, Number(env.PER_RUN || 1));
const STORAGE_URL = (env.STORAGE_PUBLIC_URL || "https://bucket-jwta-production.up.railway.app").replace(/\/$/, "");
const KEY = env.GOOGLE_API_KEY?.trim() ?? "";
const GALLERY_SIZE = 12;

const DEFAULT_SHEETS = `
Lippo Kuningan | 1q2r4wLQ7-ZDiGdEdr9nUA6YYYvEqiTGgd2-Fpp_sN7E
Brin Gatsu | 1TXvQAMvU3yusI2lEQTIF9YHqYu6abxnp0_Sa3Ti5yhI
Patra Jasa | 1KdT8O1I0ofM2JkYO338fpwdZi3xC6YWhevd0Y5zQVNI
Dharmagati | 131d53k3sBSxM3lAPuEudwbdRUQHfVhI0
Grand Slipi | 1bjggs4UJBDCuGq0pcpnVpjf1TEt7HxdWjoo2-DotEVw
Seskoad | 12mJAuDfe_Wk2_jXHjBr3AxDK6eoqz6V2ohkAMxB4drc
Graha Paramita | 1J7B7n2b_xof3qdJFn2KZBBI7B9LUX3oLg2nPqNa03qk
Brin Thamrin | 1BsQHYXVeaYyY7PKoWoLZqolLRLjKwJ5wSxS1Aoo_Wbg
`;

const log = (...a: unknown[]) => console.log("[portfolio-agent]", ...a);

// ------------------------------------------------------------------ util
export function sheetId(value: string): string {
  const v = value.trim();
  return v.match(/\/d\/([\w-]{20,})/)?.[1] ?? v.match(/[?&]id=([\w-]{20,})/)?.[1] ?? v.replace(/[^\w-]/g, "");
}

export function parseSheetList(text: string): { venue: string; id: string }[] {
  return text.split(/\n/).map((l) => l.trim()).filter((l) => l && !l.startsWith("#") && l.includes("|"))
    .map((l) => { const [venue, link] = l.split("|"); return { venue: venue.trim(), id: sheetId(link) }; })
    .filter((s) => s.venue && s.id.length >= 20);
}

export const norm = (s: string) => s.toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, " ").trim();

const COUPLE_RE = /^[\p{L}][\p{L}'.\- ]{0,30}\s*(?:&|\+|\bdan\b|\band\b|\bx\b)\s*[\p{L}][\p{L}'.\- ]{0,30}$/iu;
export const isCouple = (s: string) => COUPLE_RE.test(s.trim()) && !/\d/.test(s);

/** "BANI & NANDA" / "ochi dan luthfi" -> "Bani & Nanda" / "Ochi & Luthfi" */
export function coupleName(s: string): string {
  return s.trim().replace(/\s*(?:&|\+|\bdan\b|\band\b|\bx\b)\s*/i, " & ").replace(/\s+/g, " ")
    .toLowerCase().replace(/(^|[\s'\-&])(\p{L})/gu, (_, p, c) => p + c.toUpperCase());
}

/** Nama depan kedua mempelai, mis. "Rani Putri & Yuda" -> ["rani", "yuda"]. */
export function partners(name: string): string[] {
  return coupleName(name).split(" & ").map((p) => norm(p).split(" ")[0]).filter(Boolean);
}

/** Sudah ada di website bila nama depan KEDUA mempelai muncul di nama portfolio mana pun (urutan & format bebas). */
export function alreadyOnWeb(pair: string[], existing: Set<string>[]): boolean {
  if (pair.length < 2) return existing.some((t) => pair.every((p) => t.has(p)));
  return existing.some((t) => t.has(pair[0]) && t.has(pair[1]));
}

const MONTHS: Record<string, number> = {
  jan: 1, januari: 1, january: 1, feb: 2, februari: 2, february: 2, mar: 3, maret: 3, march: 3, apr: 4, april: 4,
  mei: 5, may: 5, jun: 6, juni: 6, june: 6, jul: 7, juli: 7, july: 7, agu: 8, agt: 8, ags: 8, agustus: 8, aug: 8, august: 8,
  sep: 9, sept: 9, september: 9, okt: 10, oktober: 10, oct: 10, october: 10, nov: 11, nopember: 11, november: 11,
  des: 12, desember: 12, dec: 12, december: 12,
};

/** Tanggal bebas -> "YYYY-MM-DD" atau null. us=true untuk format m/d/yyyy (Google Form). */
export function parseDate(text: string, us = false): string | null {
  const t = text.toLowerCase().replace(/(\d)([a-z])/g, "$1 $2").replace(/([a-z])(\d)/g, "$1 $2").trim();
  const ok = (y: number, m: number, d: number) => {
    if (y < 100) y += 2000;
    if (y < 2015 || y > 2035 || m < 1 || m > 12 || d < 1 || d > 31) return null;
    return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  };
  let m = t.match(/(\d{1,2})\s*[-\s]?\s*([a-z]{3,9})\.?\s*[-\s]?\s*(\d{2,4})/);
  if (m && MONTHS[m[2]]) return ok(+m[3], MONTHS[m[2]], +m[1]);
  m = t.match(/(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (m) return ok(+m[1], +m[2], +m[3]);
  m = t.match(/(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{2,4})/);
  if (m) return us ? ok(+m[3], +m[1], +m[2]) : ok(+m[3], +m[2], +m[1]);
  return null;
}

type DriveRef = { kind: "folder" | "file" | "unknown"; id: string };

export function driveRefs(links: string[]): DriveRef[] {
  const out: DriveRef[] = [];
  for (const l of links) {
    let m = l.match(/\/folders\/([\w-]{10,})/);
    if (m) { out.push({ kind: "folder", id: m[1] }); continue; }
    m = l.match(/folderview\?(?:.*&)?id=([\w-]{10,})/);
    if (m) { out.push({ kind: "folder", id: m[1] }); continue; }
    m = l.match(/\/file\/d\/([\w-]{10,})/);
    if (m) { out.push({ kind: "file", id: m[1] }); continue; }
    m = l.match(/drive\.google\.com\/.*[?&]id=([\w-]{10,})/);
    if (m) out.push({ kind: "unknown", id: m[1] });
  }
  return out.filter((r, i) => out.findIndex((x) => x.id === r.id) === i);
}

// ------------------------------------------------------------------ baca sheet
type Couple = {
  key: string; venue: string; sheetId: string; tab: string; row: number;
  name: string; date: string | null; concept: string; venueCell: string;
  vendors: Record<string, string>; links: string[];
};

async function driveJson(path: string): Promise<any> {
  const sep = path.includes("?") ? "&" : "?";
  const res = await fetch(`https://www.googleapis.com/drive/v3/${path}${sep}supportsAllDrives=true&key=${KEY}`, { signal: AbortSignal.timeout(20000) });
  if (!res.ok) { const e: any = new Error(`Drive HTTP ${res.status}`); e.status = res.status; throw e; }
  return res.json();
}

async function loadWorkbook(id: string): Promise<{ name: string; wb: XLSX.WorkBook }> {
  const meta = await driveJson(`files/${id}?fields=name,mimeType`);
  const url = meta.mimeType === "application/vnd.google-apps.spreadsheet"
    ? `https://www.googleapis.com/drive/v3/files/${id}/export?mimeType=${encodeURIComponent("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")}&key=${KEY}`
    : `https://www.googleapis.com/drive/v3/files/${id}?alt=media&supportsAllDrives=true&key=${KEY}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(60000) });
  if (!res.ok) throw new Error(`Sheet "${meta.name}" HTTP ${res.status}`);
  return { name: meta.name, wb: XLSX.read(new Uint8Array(await res.arrayBuffer()), { type: "array" }) };
}

const HEADER_RE = /pengantin|tanggal|link|konsep|gdrive|g drive|nama/;
const VENDOR_RE = /catering|dekorasi|rias|photography|entertain|^mc$|foodstall|photobooth|usher|busana/;
const SKIP_TABS = /instagram|quotation|harga|price|jadwal upload/i;

export function parseTab(ws: XLSX.WorkSheet, tab: string, venue: string, id: string): Couple[] {
  if (!ws["!ref"] || SKIP_TABS.test(tab)) return [];
  const range = XLSX.utils.decode_range(ws["!ref"]);
  const maxC = Math.min(range.e.c, 40), maxR = Math.min(range.e.r, 5000);
  const text = (r: number, c: number) => { const cell = ws[XLSX.utils.encode_cell({ r, c })]; return String(cell?.w ?? cell?.v ?? "").replace(/\s+/g, " ").trim(); };
  const link = (r: number, c: number) => {
    const cell = ws[XLSX.utils.encode_cell({ r, c })];
    const target = cell?.l?.Target as string | undefined;
    if (target && /^https?:\/\//i.test(target)) return target;
    const t = text(r, c);
    const m = t.match(/(https?:\/\/\S+|(?:drive\.google\.com|photos\.app\.goo\.gl|photos\.google\.com)\/\S+)/i);
    return m ? (m[1].startsWith("http") ? m[1] : `https://${m[1]}`) : "";
  };

  // baris header = baris dengan kata kunci header terbanyak di 15 baris pertama
  let header = -1, best = 1;
  for (let r = range.s.r; r <= Math.min(range.s.r + 15, maxR); r++) {
    let hits = 0;
    for (let c = range.s.c; c <= maxC; c++) if (HEADER_RE.test(text(r, c).toLowerCase()) && text(r, c).length < 40) hits++;
    if (hits > best) { best = hits; header = r; }
  }
  if (header < 0) return [];
  const heads: string[] = [];
  for (let c = 0; c <= maxC; c++) heads[c] = text(header, c).toLowerCase();
  let start = header + 1;
  const vendors: Record<number, string> = {};
  const sub = header + 1;
  let subHits = 0;
  for (let c = 0; c <= maxC; c++) if (VENDOR_RE.test(text(sub, c).toLowerCase())) subHits++;
  if (subHits >= 2) {
    for (let c = 0; c <= maxC; c++) { const v = text(sub, c); if (v && !/^dll$/i.test(v)) vendors[c] = v; }
    start = sub + 1;
  }
  const find = (re: RegExp, not?: RegExp) => heads.findIndex((h) => re.test(h) && !(not && not.test(h)));
  const usDates = /form responses/i.test(tab) || heads.includes("timestamp");
  const dateCol = find(/tanggal|^date/, /timestamp/);
  const conceptCol = find(/konsep/);
  const venueCol = find(/^venue$/);
  const pkgCols = Object.keys(vendors).map(Number);

  // kolom nama: pilih kolom dengan isi pola "A & B" terbanyak
  let nameCol = -1, nameHits = 0;
  for (let c = 0; c <= maxC; c++) {
    if (pkgCols.includes(c)) continue;
    let n = 0;
    for (let r = start; r <= Math.min(maxR, start + 400); r++) if (isCouple(text(r, c))) n++;
    if (n > nameHits) { nameHits = n; nameCol = c; }
  }
  if (nameCol < 0 || nameHits < 2) return [];

  const out: Couple[] = [];
  let cur: Couple | null = null;
  for (let r = start; r <= maxR; r++) {
    const name = text(r, nameCol);
    const links: string[] = [];
    for (let c = 0; c <= maxC; c++) { const l = link(r, c); if (l) links.push(l); }
    if (isCouple(name)) {
      const v: Record<string, string> = {};
      for (const [c, label] of Object.entries(vendors)) {
        const val = text(r, +c);
        if (val && !/takeout|^-+$|^x$/i.test(val) && !/^https?:/i.test(val)) v[label] = val.replace(/^\*+/, "");
      }
      const date = dateCol >= 0 ? parseDate(text(r, dateCol), usDates) : null;
      cur = {
        key: `${id}|${norm(tab)}|${norm(coupleName(name))}|${date ?? ""}`,
        venue, sheetId: id, tab, row: r + 1, name: coupleName(name), date,
        concept: conceptCol >= 0 ? text(r, conceptCol).slice(0, 80) : "",
        venueCell: venueCol >= 0 ? text(r, venueCol) : "", vendors: v, links,
      };
      out.push(cur);
    } else if (!name && cur && links.length && !text(r, 0).match(/^\d+$/)) {
      cur.links.push(...links); // baris lanjutan berisi link tambahan untuk pasangan di atasnya
    } else if (name) {
      cur = null;
    }
  }
  return out;
}

// ------------------------------------------------------------------ foto Drive
type Img = { id: string; name: string; path: string; size: number; width: number; height: number };
const BAD_PATH = /\b(raw|mentah|video|teaser|reels?|story|stories|clip|behind|bts|cetak|print)\b/i;
const GOOD_PATH = /\b(edit|edited|final|highlight|best|resepsi|akad|selected|pilihan|foto|photo)\b/i;

async function listImages(ref: DriveRef, budget: { calls: number }): Promise<Img[]> {
  const imgs: Img[] = [];
  const pushFile = (f: any, path: string) => {
    if (!String(f.mimeType).startsWith("image/") || /heic|heif|svg/i.test(f.mimeType)) return;
    const size = Number(f.size || 0);
    if (size && (size < 80_000 || size > 45_000_000)) return;
    imgs.push({ id: f.id, name: f.name, path: `${path}${f.name}`, size, width: f.imageMediaMetadata?.width ?? 0, height: f.imageMediaMetadata?.height ?? 0 });
  };
  let kind = ref.kind;
  if (kind !== "folder") {
    const f = await driveJson(`files/${ref.id}?fields=id,name,mimeType,size,imageMediaMetadata(width,height)`);
    budget.calls--;
    if (f.mimeType !== "application/vnd.google-apps.folder") { pushFile(f, ""); return imgs; }
    kind = "folder";
  }
  const walk = async (folderId: string, path: string, depth: number) => {
    let pageToken = "";
    const subs: { id: string; name: string }[] = [];
    do {
      if (budget.calls-- <= 0 || imgs.length > 3000) return;
      const q = encodeURIComponent(`'${folderId}' in parents and trashed = false`);
      const body = await driveJson(`files?q=${q}&pageSize=1000&includeItemsFromAllDrives=true&fields=${encodeURIComponent("nextPageToken,files(id,name,mimeType,size,imageMediaMetadata(width,height))")}${pageToken ? `&pageToken=${pageToken}` : ""}`);
      for (const f of body.files ?? []) {
        if (f.mimeType === "application/vnd.google-apps.folder") subs.push(f);
        else pushFile(f, path);
      }
      pageToken = body.nextPageToken ?? "";
    } while (pageToken);
    if (depth >= 3) return;
    // telusuri subfolder foto dulu, lewati folder video/raw bila ada alternatif
    subs.sort((a, b) => Number(BAD_PATH.test(a.name)) - Number(BAD_PATH.test(b.name)) || Number(GOOD_PATH.test(b.name)) - Number(GOOD_PATH.test(a.name)));
    for (const s of subs.slice(0, 25)) await walk(s.id, `${path}${s.name}/`, depth + 1);
  };
  await walk(ref.id, "", 0);
  return imgs;
}

/** Pilih `n` foto tersebar merata, utamakan folder hasil edit & resolusi cukup. */
export function pickSpread(imgs: Img[], n: number): Img[] {
  let pool = imgs.filter((i) => !BAD_PATH.test(i.path));
  if (pool.length < n) pool = imgs;
  const good = pool.filter((i) => GOOD_PATH.test(i.path));
  if (good.length >= n) pool = good;
  const sized = pool.filter((i) => !i.width || Math.max(i.width, i.height) >= 1200);
  if (sized.length >= Math.min(n, 4)) pool = sized;
  pool = [...pool].sort((a, b) => a.path.localeCompare(b.path, undefined, { numeric: true }));
  if (pool.length <= n) return pool;
  const step = pool.length / n;
  return Array.from({ length: n }, (_, i) => pool[Math.floor(i * step + step / 2)]);
}

async function downloadImage(id: string): Promise<Uint8Array> {
  const res = await fetch(`https://www.googleapis.com/drive/v3/files/${id}?alt=media&supportsAllDrives=true&key=${KEY}`, { signal: AbortSignal.timeout(90000) });
  if (!res.ok) throw new Error(`Unduh foto HTTP ${res.status}`);
  return new Uint8Array(await res.arrayBuffer());
}

// ------------------------------------------------------------------ Claude
type Story = { bio: string; specialization: string; cover_index: number; exclude_indexes: number[] };

const STORY_TOOL = {
  name: "submit_portfolio",
  description: "Kirim hasil kurasi foto dan cerita portfolio.",
  input_schema: {
    type: "object",
    required: ["bio", "specialization", "cover_index", "exclude_indexes"],
    properties: {
      bio: { type: "string", description: "Satu paragraf 70-120 kata, Bahasa Indonesia, teks biasa tanpa markdown/emoji." },
      specialization: { type: "string", description: "Kategori singkat 1-3 kata (contoh: Adat Sunda, Internasional). Pakai salah satu kategori yang sudah ada bila cocok." },
      cover_index: { type: "integer", description: "Nomor foto (mulai 0) terbaik untuk sampul: pasangan pengantin terlihat jelas dan indah." },
      exclude_indexes: { type: "array", items: { type: "integer" }, description: "Nomor foto yang TIDAK layak tampil: buram, tangkapan layar, dokumen, foto tidak terkait pernikahan, atau terlalu mirip foto lain." },
    },
  },
};

async function writeStory(c: Couple, venueName: string, thumbs: Uint8Array[], categories: string[]): Promise<Story> {
  const vendorText = Object.entries(c.vendors).map(([k, v]) => `${k}: ${v}`).join("; ");
  const dateText = c.date ? new Date(`${c.date}T00:00:00Z`).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }) : "(tidak tercatat)";
  const content: any[] = thumbs.map((b, i) => [
    { type: "text", text: `Foto ${i}:` },
    { type: "image", source: { type: "base64", media_type: "image/jpeg", data: Buffer.from(b).toString("base64") } },
  ]).flat();
  content.push({ type: "text", text: `Data pernikahan:
- Pasangan: ${c.name}
- Tanggal: ${dateText}
- Venue: ${venueName}
- Konsep/adat: ${c.concept || "(tidak tercatat)"}
- Vendor: ${vendorText || "(tidak tercatat)"}

Kategori portfolio yang sudah ada di website: ${categories.join(", ") || "(belum ada)"}

Tugas:
1. Pilih foto sampul terbaik dan tandai foto yang tidak layak tampil.
2. Tulis satu paragraf cerita (70-120 kata) yang hangat untuk halaman portfolio Kediaman: sebut nama pasangan, venue, dan konsep. Boleh menggambarkan suasana, dekorasi, warna, dan momen yang TERLIHAT di foto. Jangan mengarang hal yang tidak ada di data atau foto (nama keluarga, jumlah tamu, kisah cinta, kutipan). Jangan sebut nama vendor perorangan atau PIC; nama vendor dekorasi/rias boleh disebut bila ada.
3. Tentukan kategori singkat (utamakan kategori yang sudah ada).
Kirim hasil dengan memanggil tool submit_portfolio.` });

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "x-api-key": env.ANTHROPIC_API_KEY!, "anthropic-version": "2023-06-01", "content-type": "application/json" },
    body: JSON.stringify({
      model: MODEL, max_tokens: 2000,
      system: "Anda kurator portfolio dan penulis konten untuk Kediaman Corp (kediaman.co), operator venue pernikahan di Indonesia. Tulis dalam Bahasa Indonesia yang elegan dan jujur.",
      tools: [STORY_TOOL], tool_choice: { type: "auto" },
      messages: [{ role: "user", content }],
    }),
  });
  if (!res.ok) throw new Error(`Claude API HTTP ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const body = await res.json() as any;
  const call = body.content?.find((x: any) => x.type === "tool_use" && x.name === "submit_portfolio");
  if (!call?.input) throw new Error(`Claude tidak memanggil submit_portfolio (stop: ${body.stop_reason ?? "?"})`);
  return call.input as Story;
}

// ------------------------------------------------------------------ venue
type Location = { id: string; name: string };

export function matchLocation(label: string, locations: Location[]): Location | null {
  const want = norm(label).split(" ").filter((w) => w.length > 2 && !/^(ballroom|hall|gedung|swasana|convention|kediaman|grand)$/.test(w));
  if (!want.length) return null;
  let best: Location | null = null, score = 0;
  for (const l of locations) {
    const name = norm(l.name);
    const s = want.filter((w) => name.includes(w)).length / want.length;
    if (s > score) { score = s; best = l; }
  }
  return score >= 0.5 ? best : null;
}

// ------------------------------------------------------------------ main
async function run() {
  for (const k of ["DATABASE_URL", "ANTHROPIC_API_KEY", "GOOGLE_API_KEY", "MINIO_ENDPOINT", "MINIO_ROOT_USER", "MINIO_ROOT_PASSWORD"]) {
    if (!env[k]) { log(`Variabel ${k} belum diisi. Tidak ada yang dijalankan.`); return; }
  }
  const sql = new SQL(env.DATABASE_URL!);
  const s3 = new S3Client({ accessKeyId: env.MINIO_ROOT_USER, secretAccessKey: env.MINIO_ROOT_PASSWORD, endpoint: env.MINIO_ENDPOINT, bucket: "gym-images" });
  try {
    await sql`CREATE TABLE IF NOT EXISTS portfolio_agent_rows (
      key text PRIMARY KEY, sheet_id text, tab text, row_no int, couple text, event_date date,
      venue text, status text NOT NULL, reason text, trainer_id uuid,
      created_at timestamptz NOT NULL DEFAULT now())`;
    const locations = await sql`SELECT id, name FROM locations ORDER BY sort_order` as Location[];
    const existingNames = (await sql`SELECT name FROM trainers`).map((r: any) => String(r.name ?? ""));
    const existing = existingNames.map((n) => new Set(norm(n).split(" ").filter(Boolean)));
    const categories = (await sql`SELECT DISTINCT specialization FROM trainers WHERE specialization IS NOT NULL AND is_active`).map((r: any) => r.specialization as string).slice(0, 30);
    const done = new Set((await sql`SELECT key FROM portfolio_agent_rows`).map((r: any) => r.key as string));
    const perVenue = new Map((await sql`SELECT venue, count(*)::int AS n FROM portfolio_agent_rows WHERE status = 'published' GROUP BY venue`).map((r: any) => [r.venue, r.n]));
    log(`Mode: ${PUBLISH ? "tayang" : "nonaktif"}${DRY_RUN ? ", DRY RUN" : ""} | portfolio di DB: ${existing.length} | kategori: ${categories.join(", ")}`);

    // 1. baca semua sheet
    const sheets = parseSheetList(env.PORTFOLIO_SHEETS || DEFAULT_SHEETS);
    const all: Couple[] = [];
    for (const s of sheets) {
      try {
        const { name, wb } = await loadWorkbook(s.id);
        const found: Couple[] = [];
        for (const tab of wb.SheetNames) found.push(...parseTab(wb.Sheets[tab], tab, s.venue, s.id));
        const withDrive = found.filter((c) => driveRefs(c.links).length).length;
        log(`Sheet "${name}" (${s.venue}): ${found.length} pasangan, ${withDrive} dengan link Drive`);
        all.push(...found);
      } catch (e: any) { log(`Sheet ${s.venue} gagal dibaca: ${e?.message}`); }
    }

    // 2. kandidat: ada link Drive, belum pernah diproses, tidak duplikat portfolio yang sudah ada, acara sudah lewat
    const today = new Date().toISOString().slice(0, 10);
    const seen = new Set<string>();
    let dupWeb = 0;
    const candidates = all.filter((c) => {
      const pair = partners(c.name);
      const dup = `${[...pair].sort().join("&")}|${c.date ?? ""}`;
      if (seen.has(dup)) return false; // pasangan sama muncul di beberapa sheet/tab
      seen.add(dup);
      if (!driveRefs(c.links).length || done.has(c.key) || (c.date && c.date > today)) return false;
      if (alreadyOnWeb(pair, existing)) { dupWeb++; return false; }
      return true;
    });
    log(`Dilewati karena sudah ada di website: ${dupWeb} | contoh nama portfolio yang ada: ${existingNames.slice(0, 12).join(" | ")}`);
    const byVenue = new Map<string, number>();
    for (const c of candidates) byVenue.set(c.venue, (byVenue.get(c.venue) ?? 0) + 1);
    log(`Kandidat siap posting: ${candidates.length} (${[...byVenue].map(([v, n]) => `${v}: ${n}`).join(", ")})`);
    log(`Venue di website: ${locations.map((l) => l.name).join(", ")}`);
    for (const s of sheets) log(`  ${s.venue} -> ${matchLocation(s.venue, locations)?.name ?? "(tidak cocok, venue dikosongkan)"}`);

    // 3. venue bergiliran (paling sedikit diposting), acara terbaru dulu
    const venueOf = (c: Couple) => (c.venueCell && matchLocation(c.venueCell, locations)) || matchLocation(c.tab, locations) || matchLocation(c.venue, locations);
    candidates.sort((a, b) =>
      (perVenue.get(a.venue) ?? 0) - (perVenue.get(b.venue) ?? 0) ||
      String(b.date ?? "0").localeCompare(String(a.date ?? "0")));

    let posted = 0, attempts = 0;
    const budget = { calls: 400 };
    for (const c of candidates) {
      if (posted >= PER_RUN || attempts >= 8 || budget.calls <= 0) break;
      attempts++;
      const loc = venueOf(c);
      const label = `${c.name} (${c.venue}, ${c.tab} baris ${c.row}, ${c.date ?? "tanpa tanggal"})`;
      const mark = async (status: string, reason: string | null, trainerId: string | null = null) => {
        if (DRY_RUN) return;
        await sql`INSERT INTO portfolio_agent_rows (key, sheet_id, tab, row_no, couple, event_date, venue, status, reason, trainer_id)
                  VALUES (${c.key}, ${c.sheetId}, ${c.tab}, ${c.row}, ${c.name}, ${c.date}, ${c.venue}, ${status}, ${reason}, ${trainerId})
                  ON CONFLICT (key) DO UPDATE SET status = EXCLUDED.status, reason = EXCLUDED.reason, trainer_id = EXCLUDED.trainer_id`;
      };

      // foto
      let imgs: Img[] = [];
      let accessError = false;
      for (const ref of driveRefs(c.links)) {
        try { imgs.push(...await listImages(ref, budget)); }
        catch (e: any) { if (e?.status === 403 || e?.status === 404) accessError = true; else log(`  ${label}: ${e?.message}`); }
        if (imgs.length >= 60) break;
      }
      if (imgs.length < 4) {
        const reason = imgs.length ? `hanya ${imgs.length} foto` : accessError ? "folder Drive tidak bisa diakses publik" : "tidak ada foto di folder";
        log(`Lewati ${label}: ${reason}`);
        await mark("skipped", reason);
        continue;
      }
      const picked = pickSpread(imgs, GALLERY_SIZE);
      log(`Memproses ${label}: ${imgs.length} foto ditemukan, ${picked.length} dipilih, venue web: ${loc?.name ?? "(tidak cocok)"}`);

      const files: { full: Buffer; thumb: Uint8Array }[] = [];
      for (const p of picked) {
        try {
          const raw = await downloadImage(p.id);
          const base = sharp(raw, { failOn: "none" }).rotate();
          const full = await base.clone().resize({ width: 2000, height: 2000, fit: "inside", withoutEnlargement: true }).webp({ quality: 80 }).toBuffer();
          const thumb = new Uint8Array(await base.clone().resize({ width: 512, height: 512, fit: "inside" }).jpeg({ quality: 70 }).toBuffer());
          files.push({ full, thumb });
        } catch (e: any) { log(`  foto ${p.path} gagal: ${e?.message}`); }
      }
      if (files.length < 4) { log(`Lewati ${label}: foto gagal diunduh`); await mark("skipped", "foto gagal diunduh"); continue; }

      const story = await writeStory(c, loc?.name ?? c.venue, files.map((f) => f.thumb), categories);
      const excluded = new Set((story.exclude_indexes ?? []).filter((i) => i !== story.cover_index));
      const order = [story.cover_index, ...files.map((_, i) => i).filter((i) => i !== story.cover_index)]
        .filter((i) => i >= 0 && i < files.length && !excluded.has(i));
      if (order.length < 3) { log(`Lewati ${label}: foto layak kurang dari 3`); await mark("skipped", "foto layak kurang dari 3"); continue; }
      const bio = story.bio.replace(/[*_#`]/g, "").replace(/\s+/g, " ").trim();
      const specialization = story.specialization.trim().slice(0, 40);

      if (DRY_RUN) {
        log(`DRY RUN ${c.name} | kategori: ${specialization} | sampul: foto ${story.cover_index} (${picked[story.cover_index]?.path}) | galeri ${order.length} foto | dibuang: ${[...excluded].join(",") || "-"}`);
        log(`DRY RUN cerita: ${bio}`);
        posted++;
        continue;
      }
      // cek ulang tepat sebelum simpan, untuk jaga-jaga ada yang baru ditambah lewat CMS
      const fresh = (await sql`SELECT name FROM trainers`).map((r: any) => new Set(norm(String(r.name ?? "")).split(" ").filter(Boolean)));
      if (alreadyOnWeb(partners(c.name), fresh)) { log(`Lewati ${label}: sudah ada di website`); await mark("skipped", "sudah ada di website"); continue; }
      const slugBase = norm(c.name).replace(/ /g, "-") || "portfolio";
      const urls: string[] = [];
      for (const [n, i] of order.entries()) {
        const key = `portfolio/${slugBase}-${Date.now().toString(36)}-${n + 1}.webp`;
        await s3.write(key, new Uint8Array(files[i].full), { type: "image/webp" });
        urls.push(`${STORAGE_URL}/gym-images/${key}`);
      }
      const [row] = await sql`
        INSERT INTO trainers (name, specialization, bio, photo_url, images, location_id, is_active, sort_order)
        VALUES (${c.name}, ${specialization}, ${bio}, ${urls[0]},
                ARRAY(SELECT jsonb_array_elements_text(${JSON.stringify(urls.slice(1))}::text::jsonb)),
                ${loc?.id ?? null}, ${PUBLISH}, (SELECT COALESCE(max(sort_order), 0) + 1 FROM trainers))
        RETURNING id, slug`;
      await mark("published", null, row.id);
      perVenue.set(c.venue, (perVenue.get(c.venue) ?? 0) + 1);
      log(`Selesai: ${c.name} -> ${SITE_URL}/portfolio/${row.slug ?? row.id} (${urls.length} foto, ${PUBLISH ? "tayang" : "nonaktif"})`);
      posted++;
    }
    if (!posted) log("Tidak ada portfolio yang diposting kali ini.");
  } catch (e: any) {
    log("GAGAL:", e?.message ?? e);
    process.exitCode = 1;
  } finally {
    await sql.close();
  }
}

if (import.meta.main) await run();
