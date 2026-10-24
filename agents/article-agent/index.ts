// =====================================================================
// kediaman-article-agent — agen artikel SEO otomatis untuk kediaman.co
// Berjalan sebagai Railway Function dengan cron (setiap hari 08:00 WIB).
//
// Alur satu kali jalan:
//   1. Pilih keyword target yang paling jarang dipakai.
//   2. Claude menulis artikel (HTML) memakai data venue asli dari database.
//   3. Gambar utama: stok Google Drive Anda -> Pexels (jika ada key) -> Openverse (lisensi bebas komersial).
//   4. Gambar dikecilkan (WebP) dan diunggah ke MinIO, artikel disimpan ke tabel `articles`.
//
// Variabel lingkungan:
//   DATABASE_URL, MINIO_ENDPOINT, MINIO_ROOT_USER, MINIO_ROOT_PASSWORD   (wajib)
//   ANTHROPIC_API_KEY                                                    (wajib)
//   STORAGE_PUBLIC_URL      default https://bucket-jwta-production.up.railway.app
//   GDRIVE_FOLDER_ID + GOOGLE_API_KEY   folder Drive yang dibagikan "siapa saja yang memiliki link"
//   PEXELS_API_KEY          opsional, sumber gambar cadangan
//   ANTHROPIC_MODEL         default claude-sonnet-5-5
//   PUBLISH                 "true" (default) langsung tayang, "false" simpan sebagai draft
//   DRY_RUN                 "true" = hanya tulis ke log, tidak menyimpan apa pun
// =====================================================================
import { SQL, S3Client } from "bun";
import sharp from "sharp";

const env = Bun.env;
const KEYWORDS = ["wedding", "venue", "sewa ballroom", "ballroom jakarta", "ballroom bandung", "ballroom tangerang selatan"];
const CATEGORIES = ["Tips & Trik", "Event", "Venue", "Wedding", "Corporate", "News", "Program"];
const SITE_URL = "https://kediaman.co";
const MODEL = env.ANTHROPIC_MODEL || "claude-sonnet-5-5";
const PUBLISH = (env.PUBLISH ?? "true").toLowerCase() !== "false";
const DRY_RUN = (env.DRY_RUN ?? "false").toLowerCase() === "true";
const STORAGE_URL = (env.STORAGE_PUBLIC_URL || "https://bucket-jwta-production.up.railway.app").replace(/\/$/, "");

const log = (...a: unknown[]) => console.log("[article-agent]", ...a);

// ------------------------------------------------------------------ util
export function slugify(text: string): string {
  return text.toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 90).replace(/-+$/, "");
}

const ALLOWED_TAGS = new Set(["p", "h2", "h3", "h4", "ul", "ol", "li", "strong", "em", "b", "i", "a", "blockquote", "br", "table", "thead", "tbody", "tr", "th", "td"]);

/** Allowlist sanitizer: hanya tag teks dasar, atribut dibuang kecuali href aman pada <a>. */
export function sanitizeHtml(html: string): string {
  let out = html.replace(/<(script|style|iframe|object|embed|noscript|template)[\s\S]*?<\/\1\s*>/gi, "");
  out = out.replace(/<!--[\s\S]*?-->/g, "");
  out = out.replace(/<\/?([a-zA-Z0-9]+)([^>]*)>/g, (tag, name: string, attrs: string) => {
    const t = name.toLowerCase();
    if (!ALLOWED_TAGS.has(t)) return "";
    if (tag.startsWith("</")) return `</${t}>`;
    if (t === "a") {
      const href = attrs.match(/href\s*=\s*"([^"]*)"/i)?.[1] ?? attrs.match(/href\s*=\s*'([^']*)'/i)?.[1] ?? "";
      const safe = /^\/[a-z0-9\-/]*$/i.test(href) || /^https:\/\/[^\s"'<>]+$/i.test(href);
      if (!safe) return "<a>";
      const external = href.startsWith("https://") && !href.startsWith(SITE_URL);
      return `<a href="${href.replace(/"/g, "&quot;")}"${external ? ' target="_blank" rel="noopener noreferrer"' : ""}>`;
    }
    return t === "br" ? "<br>" : `<${t}>`;
  });
  return out.trim();
}

const escapeHtml = (v: string) => v.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");

// ------------------------------------------------------------------ data
type Venue = { name: string; slug: string | null; id: string; category: string | null; address: string | null;
  ballroom_layout_capacity: string | null; facilities: unknown; is_coming_soon: boolean | null };

async function loadContext(sql: SQL) {
  await sql`CREATE TABLE IF NOT EXISTS article_agent_runs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    keyword text NOT NULL,
    article_id uuid,
    image_source text,
    image_ref text,
    status text NOT NULL,
    error text,
    created_at timestamptz NOT NULL DEFAULT now())`;
  const venues = await sql`SELECT id, name, slug, category, address, ballroom_layout_capacity, facilities, is_coming_soon
                           FROM locations WHERE is_active ORDER BY sort_order` as Venue[];
  const titles = (await sql`SELECT title FROM articles ORDER BY created_at DESC LIMIT 200`).map((r: any) => r.title as string);
  const usage = await sql`SELECT keyword, count(*)::int AS n, max(created_at) AS last FROM article_agent_runs
                          WHERE status = 'published' OR status = 'draft' GROUP BY keyword`;
  const usedImages = new Set((await sql`SELECT image_ref FROM article_agent_runs WHERE image_ref IS NOT NULL`).map((r: any) => r.image_ref as string));
  return { venues, titles, usage, usedImages };
}

export function pickKeyword(usage: { keyword: string; n: number; last: string | Date | null }[]): string {
  const stats = new Map(usage.map((u) => [u.keyword, u]));
  return [...KEYWORDS].sort((a, b) => {
    const ua = stats.get(a), ub = stats.get(b);
    const na = ua?.n ?? 0, nb = ub?.n ?? 0;
    if (na !== nb) return na - nb;
    return new Date(ua?.last ?? 0).getTime() - new Date(ub?.last ?? 0).getTime();
  })[0];
}

// ------------------------------------------------------------------ Google Drive
type DriveFile = { id: string; name: string; path: string; mimeType: string };

/** Terima ID folder maupun link lengkap Google Drive (…/folders/<id>?usp=sharing, ?id=<id>). */
export function driveFolderId(value: string | undefined): string {
  const v = String(value ?? "").trim();
  return v.match(/\/folders\/([\w-]{10,})/)?.[1] ?? v.match(/[?&]id=([\w-]{10,})/)?.[1] ?? v.replace(/[^\w-]/g, "");
}

async function listDriveImages(): Promise<DriveFile[]> {
  const folder = driveFolderId(env.GDRIVE_FOLDER_ID), key = env.GOOGLE_API_KEY?.trim();
  if (!folder || !key) return [];
  log(`Folder Drive: ${folder.slice(0, 4)}…${folder.slice(-4)} (${folder.length} karakter)`);
  const meta = await fetch(`https://www.googleapis.com/drive/v3/files/${folder}?fields=id,name,mimeType&supportsAllDrives=true&key=${key}`);
  if (!meta.ok) throw new Error(`Folder tidak bisa diakses (HTTP ${meta.status}). Pastikan ID benar dan folder dibagikan "Siapa saja yang memiliki link".`);
  const info = await meta.json() as { name: string; mimeType: string };
  if (info.mimeType !== "application/vnd.google-apps.folder") throw new Error(`ID tersebut bukan folder (${info.mimeType}).`);
  log(`Folder Drive ditemukan: "${info.name}"`);
  const files: DriveFile[] = [];
  const walk = async (folderId: string, path: string, depth: number) => {
    if (Date.now() > deadline || folders >= MAX_FOLDERS || files.length >= MAX_FILES) return;
    folders++;
    let pageToken = "";
    const sub: Promise<void>[] = [];
    do {
      const url = new URL("https://www.googleapis.com/drive/v3/files");
      url.searchParams.set("q", `'${folderId}' in parents and trashed = false and (mimeType = 'application/vnd.google-apps.folder' or mimeType contains 'image/')`);
      url.searchParams.set("fields", "nextPageToken, files(id, name, mimeType)");
      url.searchParams.set("pageSize", "1000");
      url.searchParams.set("supportsAllDrives", "true");
      url.searchParams.set("includeItemsFromAllDrives", "true");
      url.searchParams.set("key", key);
      if (pageToken) url.searchParams.set("pageToken", pageToken);
      const res = await limit(() => fetch(url, { signal: AbortSignal.timeout(15000) }));
      if (!res.ok) throw new Error(`Drive HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`);
      const body = await res.json() as { nextPageToken?: string; files: { id: string; name: string; mimeType: string }[] };
      for (const f of body.files) {
        if (f.mimeType === "application/vnd.google-apps.folder") {
          if (depth < 4) sub.push(walk(f.id, `${path}${f.name}/`, depth + 1).catch((e) => log(`Lewati folder ${path}${f.name}:`, e?.message)));
        } else if (f.mimeType.startsWith("image/")) files.push({ ...f, path: `${path}${f.name}` });
      }
      pageToken = body.nextPageToken ?? "";
    } while (pageToken && Date.now() < deadline);
    await Promise.all(sub);
  };
  // Folder besar: telusuri subfolder paralel (maks 8 request bersamaan) dengan batas waktu & jumlah.
  const MAX_FOLDERS = 400, MAX_FILES = 5000, deadline = Date.now() + 90_000;
  let folders = 0, active = 0;
  const queue: (() => void)[] = [];
  const limit = async <T>(fn: () => Promise<T>): Promise<T> => {
    if (active >= 8) await new Promise<void>((r) => queue.push(r));
    active++;
    try { return await fn(); } finally { active--; queue.shift()?.(); }
  };
  await walk(folder, "", 0);
  log(`Drive ditelusuri: ${folders} folder, ${files.length} gambar${Date.now() > deadline ? " (batas waktu tercapai)" : ""}`);
  return files;
}

async function downloadDrive(file: DriveFile): Promise<Uint8Array> {
  const res = await fetch(`https://www.googleapis.com/drive/v3/files/${file.id}?alt=media&key=${env.GOOGLE_API_KEY?.trim()}&supportsAllDrives=true`);
  if (!res.ok) throw new Error(`Drive download HTTP ${res.status}`);
  return new Uint8Array(await res.arrayBuffer());
}

// ------------------------------------------------------------------ gambar luar
type ExternalImage = { url: string; credit: string; ref: string; source: string };

async function searchExternal(query: string, used: Set<string>): Promise<ExternalImage | null> {
  if (env.PEXELS_API_KEY) {
    try {
      const res = await fetch(`https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=15&orientation=landscape`, {
        headers: { Authorization: env.PEXELS_API_KEY },
      });
      if (res.ok) {
        const body = await res.json() as { photos: { id: number; photographer: string; url: string; src: { large2x: string } }[] };
        const photo = body.photos.find((p) => !used.has(`pexels:${p.id}`));
        if (photo) return { url: photo.src.large2x, ref: `pexels:${photo.id}`, source: "pexels",
          credit: `Foto: ${escapeHtml(photo.photographer)} / <a href="${photo.url}">Pexels</a>` };
      }
    } catch (e: any) { log("Pexels gagal:", e?.message); }
  }
  try {
    const url = `https://api.openverse.org/v1/images/?q=${encodeURIComponent(query)}&license_type=commercial,modification&page_size=20&aspect_ratio=wide`;
    const res = await fetch(url, { headers: { "User-Agent": "kediaman-article-agent/1.0 (+https://kediaman.co)" } });
    if (res.ok) {
      const body = await res.json() as { results: { id: string; url: string; creator?: string; license: string; license_version?: string; foreign_landing_url: string; width?: number }[] };
      const img = body.results.find((r) => !used.has(`openverse:${r.id}`) && (r.width ?? 1200) >= 1000);
      if (img) return { url: img.url, ref: `openverse:${img.id}`, source: "openverse",
        credit: `Foto: ${escapeHtml(img.creator || "Tidak diketahui")}, <a href="${img.foreign_landing_url}">sumber</a> (CC ${escapeHtml(img.license.toUpperCase())} ${escapeHtml(img.license_version ?? "")})` };
    }
  } catch (e: any) { log("Openverse gagal:", e?.message); }
  return null;
}

// ------------------------------------------------------------------ Claude
type Draft = {
  title: string; meta_title: string; meta_description: string; excerpt: string; category: string;
  tags: string[]; meta_keywords: string; content_html: string; reading_time: number;
  drive_image_id: string; image_search_query: string; image_alt: string;
};

const ARTICLE_TOOL = {
  name: "submit_article",
  description: "Kirim artikel SEO yang sudah selesai ditulis.",
  input_schema: {
    type: "object",
    required: ["title", "meta_title", "meta_description", "excerpt", "category", "tags", "meta_keywords",
      "content_html", "reading_time", "drive_image_id", "image_search_query", "image_alt"],
    properties: {
      title: { type: "string", description: "Judul artikel (H1), maks 70 karakter, memuat keyword utama secara alami." },
      meta_title: { type: "string", description: "Judul SEO maks 60 karakter." },
      meta_description: { type: "string", description: "Deskripsi SEO 140-160 karakter, ajakan yang jelas." },
      excerpt: { type: "string", description: "Ringkasan 1-2 kalimat untuk daftar artikel." },
      category: { type: "string", enum: CATEGORIES },
      tags: { type: "array", items: { type: "string" }, description: "4-6 tag huruf kecil." },
      meta_keywords: { type: "string", description: "Keyword dipisah koma." },
      content_html: { type: "string", description: "Isi artikel HTML: hanya <p>, <h2>, <h3>, <ul>, <ol>, <li>, <strong>, <em>, <a href>, <blockquote>. Tanpa <h1>, tanpa gambar." },
      reading_time: { type: "integer", description: "Perkiraan menit baca." },
      drive_image_id: { type: "string", description: "ID file Drive yang paling relevan untuk gambar utama, atau string kosong bila tidak ada yang cocok." },
      image_search_query: { type: "string", description: "Kata kunci bahasa Inggris (3-6 kata) untuk mencari foto stok bila tidak ada gambar Drive yang cocok." },
      image_alt: { type: "string", description: "Teks alt gambar utama dalam bahasa Indonesia." },
    },
  },
};

async function writeArticle(keyword: string, venues: Venue[], titles: string[], driveFiles: DriveFile[]): Promise<Draft> {
  const venueLines = venues.map((v) =>
    `- ${v.name}${v.is_coming_soon ? " (segera hadir)" : ""} | area: ${v.category ?? "-"} | alamat: ${v.address ?? "-"} | kapasitas ballroom: ${v.ballroom_layout_capacity ?? "-"} | link: ${SITE_URL}/lokasi/${v.slug || v.id}`,
  ).join("\n");
  // Stok besar: kirim 400 file paling relevan (cocok keyword/venue di nama folder/file), sisanya acak.
  const terms = [...keyword.split(/\s+/), "wedding", "ballroom", "venue", "resepsi", "dekor", "pernikahan", ...venues.map((v) => v.name)]
    .map((t) => t.toLowerCase()).filter((t) => t.length > 2);
  const score = (f: DriveFile) => terms.reduce((s, t) => s + (f.path.toLowerCase().includes(t) ? 1 : 0), 0) + Math.random() * 0.5;
  const driveLines = driveFiles.map((f) => [f, score(f)] as const).sort((a, b) => b[1] - a[1]).slice(0, 400)
    .map(([f]) => `${f.id} | ${f.path}`).join("\n");
  const system = `Anda penulis konten SEO senior untuk Kediaman Corp (${SITE_URL}), operator venue dan ballroom pernikahan & acara di Indonesia.
Tulis dalam Bahasa Indonesia yang hangat, profesional, dan mudah dibaca.

Aturan wajib:
- Gunakan HANYA fakta venue dari data di bawah. Jangan mengarang harga, kapasitas, fasilitas, testimoni, penghargaan, atau statistik.
- Bila menyebut harga, katakan harga bervariasi dan arahkan pembaca menghubungi tim Kediaman untuk penawaran.
- Sertakan 2-4 tautan internal yang relevan ke halaman venue (pakai link dari data) dan bila cocok ke ${SITE_URL}/lokasi atau ${SITE_URL}/portfolio. Gunakan path relatif, contoh <a href="/lokasi/slug">.
- Struktur: paragraf pembuka yang menjawab niat pencarian, 4-7 bagian <h2> (boleh <h3>), daftar bila membantu, bagian FAQ singkat (3-4 pertanyaan sebagai <h3>), dan penutup dengan ajakan menghubungi Kediaman.
- Panjang 900-1400 kata. Keyword utama muncul di judul, paragraf pertama, minimal satu <h2>, dan secara alami di isi (jangan berlebihan).
- Topik harus berbeda dari judul yang sudah ada.

Data venue Kediaman (aktif):
${venueLines || "(belum ada data venue)"}`;
  const user = `Keyword utama hari ini: "${keyword}".
Keyword pendukung yang boleh dipakai bila relevan: ${KEYWORDS.filter((k) => k !== keyword).join(", ")}.

Judul artikel yang sudah ada (jangan diulang atau dibuat mirip):
${titles.slice(0, 120).map((t) => `- ${t}`).join("\n") || "(belum ada)"}

Stok gambar Google Drive (format: id | folder/nama file). Pilih satu yang paling relevan dengan isi artikel berdasarkan nama folder/file; kosongkan bila tidak ada yang jelas cocok:
${driveLines || "(tidak ada stok gambar Drive)"}

Tulis artikelnya, lalu WAJIB kirim hasilnya dengan memanggil tool submit_article (jangan menulis artikel di luar tool).`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "x-api-key": env.ANTHROPIC_API_KEY!, "anthropic-version": "2023-06-01", "content-type": "application/json" },
    body: JSON.stringify({
      model: MODEL, max_tokens: 16000, system,
      // Beberapa model tidak mendukung tool_choice paksa; pakai "auto" + instruksi eksplisit.
      tools: [ARTICLE_TOOL], tool_choice: { type: "auto" },
      messages: [{ role: "user", content: user }],
    }),
  });
  if (!res.ok) throw new Error(`Claude API HTTP ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const body = await res.json() as { content: { type: string; name?: string; input?: Draft }[] };
  const call = body.content.find((c) => c.type === "tool_use" && c.name === "submit_article");
  if (!call?.input) throw new Error(`Claude tidak memanggil submit_article (stop: ${(body as any).stop_reason ?? "?"})`);
  return call.input;
}

// ------------------------------------------------------------------ simpan gambar
async function storeImage(bytes: Uint8Array, s3: S3Client): Promise<string> {
  const webp = await sharp(bytes, { failOn: "none" }).rotate()
    .resize({ width: 1600, height: 1000, fit: "cover", withoutEnlargement: true })
    .webp({ quality: 78 }).toBuffer();
  const key = `articles/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.webp`;
  await s3.write(key, new Uint8Array(webp), { type: "image/webp" });
  return `${STORAGE_URL}/gym-images/${key}`;
}

// ------------------------------------------------------------------ main
async function run() {
  for (const k of ["DATABASE_URL", "ANTHROPIC_API_KEY", "MINIO_ENDPOINT", "MINIO_ROOT_USER", "MINIO_ROOT_PASSWORD"]) {
    if (!env[k]) { log(`Variabel ${k} belum diisi. Tidak ada yang dijalankan.`); return; }
  }
  const sql = new SQL(env.DATABASE_URL!);
  const s3 = new S3Client({ accessKeyId: env.MINIO_ROOT_USER, secretAccessKey: env.MINIO_ROOT_PASSWORD, endpoint: env.MINIO_ENDPOINT, bucket: "gym-images" });
  let keyword = "";
  try {
    const { venues, titles, usage, usedImages } = await loadContext(sql);
    keyword = pickKeyword(usage as any);
    log(`Keyword: ${keyword} (mode: ${PUBLISH ? "tayang" : "draft"}${DRY_RUN ? ", DRY RUN" : ""})`);

    let driveFiles: DriveFile[] = [];
    try { driveFiles = (await listDriveImages()).filter((f) => !usedImages.has(`drive:${f.id}`)); }
    catch (e: any) { log("Drive tidak bisa dibaca:", e?.message); }
    log(`Stok gambar Drive yang belum dipakai: ${driveFiles.length}`);

    const draft = await writeArticle(keyword, venues, titles, driveFiles);
    const content = sanitizeHtml(draft.content_html);
    if (content.replace(/<[^>]*>/g, " ").split(/\s+/).filter(Boolean).length < 400) throw new Error("Artikel terlalu pendek, dibatalkan");

    // Gambar utama
    let imageBytes: Uint8Array | null = null, imageRef: string | null = null, imageSource = "none", credit = "";
    const driveFile = driveFiles.find((f) => f.id === draft.drive_image_id);
    if (driveFile) {
      try { imageBytes = await downloadDrive(driveFile); imageRef = `drive:${driveFile.id}`; imageSource = "drive"; }
      catch (e: any) { log("Unduh Drive gagal:", e?.message); }
    }
    if (!imageBytes) {
      const queries = [draft.image_search_query, `${keyword} wedding ballroom`, "wedding reception ballroom"].filter(Boolean);
      for (const q of queries) {
        const ext = await searchExternal(q, usedImages);
        if (!ext) continue;
        try {
          const r = await fetch(ext.url, { headers: { "User-Agent": "kediaman-article-agent/1.0" } });
          if (!r.ok) continue;
          imageBytes = new Uint8Array(await r.arrayBuffer()); imageRef = ext.ref; imageSource = ext.source; credit = ext.credit;
          break;
        } catch { /* coba sumber berikutnya */ }
      }
    }

    let slug = slugify(draft.title) || `artikel-${Date.now()}`;
    const [{ n }] = await sql`SELECT count(*)::int AS n FROM articles WHERE slug = ${slug}`;
    if (n > 0) slug = `${slug}-${new Date().toISOString().slice(0, 10)}`;
    const body = credit ? `${content}\n<p><em>${credit}</em></p>` : content;

    if (DRY_RUN) {
      log("DRY RUN judul:", draft.title, "| slug:", slug, "| gambar:", imageSource, imageRef, driveFile ? `(${driveFile.path})` : "", "| kata:", content.replace(/<[^>]*>/g, " ").split(/\s+/).length);
      return;
    }
    const featured = imageBytes ? await storeImage(imageBytes, s3) : null;
    const [article] = await sql`
      INSERT INTO articles (title, slug, excerpt, content, featured_image, author_name, category, tags,
                            meta_title, meta_description, meta_keywords, reading_time, is_published, published_at)
      VALUES (${draft.title.slice(0, 200)}, ${slug}, ${draft.excerpt}, ${body}, ${featured}, ${"Tim Kediaman"},
              ${CATEGORIES.includes(draft.category) ? draft.category : "Wedding"}, ${JSON.stringify(draft.tags.slice(0, 8))}::text::jsonb,
              ${draft.meta_title.slice(0, 70)}, ${draft.meta_description.slice(0, 170)}, ${draft.meta_keywords},
              ${Math.max(1, Math.round(draft.reading_time || 5))}, ${PUBLISH}, ${PUBLISH ? new Date().toISOString() : null})
      RETURNING id, slug`;
    await sql`INSERT INTO article_agent_runs (keyword, article_id, image_source, image_ref, status)
              VALUES (${keyword}, ${article.id}, ${imageSource}, ${imageRef}, ${PUBLISH ? "published" : "draft"})`;
    log(`Selesai: "${draft.title}" -> ${SITE_URL}/artikel/${article.slug} (gambar: ${imageSource})`);
  } catch (e: any) {
    log("GAGAL:", e?.message ?? e);
    try { await sql`INSERT INTO article_agent_runs (keyword, status, error) VALUES (${keyword || "-"}, 'failed', ${String(e?.message ?? e).slice(0, 1000)})`; } catch { /* abaikan */ }
    process.exitCode = 1;
  } finally {
    await sql.close();
  }
}

if (import.meta.main) await run();
