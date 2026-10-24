// Runs after `vite build` (npm "postbuild"). For every public route it writes
// dist/<route>/index.html with that page's own <title>, description, canonical URL,
// Open Graph tags and BreadcrumbList JSON-LD. Search engines then see a distinct title,
// description and canonical URL for each page straight from the HTML (before running
// JavaScript), which helps Google understand the site sections it can show as sitelinks.

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

export const SITE_URL = "https://kediaman.co";
const SITE_NAME = "Kediaman Corp";

export interface PageMeta {
  path: string;
  title: string;
  description: string;
  image?: string | null;
  heading: string;
  breadcrumbs: { name: string; path: string }[];
}

export const MAIN_SECTIONS = [
  { name: "Tentang Kami", path: "/tentang-kami" },
  { name: "Portfolio", path: "/portfolio" },
  { name: "Lokasi Venue", path: "/lokasi" },
  { name: "Paket & Promo", path: "/paket" },
  { name: "Artikel", path: "/artikel" },
];

const HOME = { name: "Beranda", path: "/" };

export const STATIC_PAGES: PageMeta[] = [
  {
    path: "/tentang-kami",
    title: `Tentang Kami | ${SITE_NAME}`,
    description: `Kenali lebih dekat ${SITE_NAME}, penyedia venue dan layanan event premium terpercaya.`,
    heading: "Tentang Kami",
    breadcrumbs: [HOME, { name: "Tentang Kami", path: "/tentang-kami" }],
  },
  {
    path: "/portfolio",
    title: `Portfolio Acara & Pernikahan | ${SITE_NAME}`,
    description: "Temukan inspirasi dari berbagai acara yang telah kami selenggarakan.",
    heading: "Portfolio",
    breadcrumbs: [HOME, { name: "Portfolio", path: "/portfolio" }],
  },
  {
    path: "/lokasi",
    title: `Lokasi Venue & Ballroom | ${SITE_NAME}`,
    description: "Kunjungi lokasi-lokasi premium Kediaman Corp di Jakarta, Bintaro, dan Bandung.",
    heading: "Lokasi Venue",
    breadcrumbs: [HOME, { name: "Lokasi", path: "/lokasi" }],
  },
  {
    path: "/paket",
    title: `Paket & Promo Venue | ${SITE_NAME}`,
    description: `Daftar lengkap paket dan promo venue ${SITE_NAME}. Pilih kategori, cek detail, dan ajukan penawaran langsung lewat formulir WhatsApp.`,
    heading: "Paket & Promo Venue",
    breadcrumbs: [HOME, { name: "Paket & Promo", path: "/paket" }],
  },
  {
    path: "/artikel",
    title: `Artikel & Tips Acara | ${SITE_NAME}`,
    description: "Baca artikel terbaru, tips, dan informasi seputar venue dan event management.",
    heading: "Artikel & Tips",
    breadcrumbs: [HOME, { name: "Artikel", path: "/artikel" }],
  },
];

const escapeHtml = (value: string) =>
  value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");

const plain = (value: unknown, max = 160) => {
  const text = String(value ?? "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  return text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text;
};

function setTag(html: string, pattern: RegExp, replacement: string, insertBeforeHeadEnd = true) {
  if (pattern.test(html)) return html.replace(pattern, replacement);
  return insertBeforeHeadEnd ? html.replace("</head>", `    ${replacement}\n  </head>`) : html;
}

export function renderPage(template: string, page: PageMeta): string {
  const url = `${SITE_URL}${page.path === "/" ? "/" : page.path}`;
  const title = escapeHtml(page.title);
  const description = escapeHtml(page.description);
  let html = template;
  html = html.replace(/<title>[\s\S]*?<\/title>/, `<title>${title}</title>`);
  html = setTag(html, /<meta name="description"[^>]*>/, `<meta name="description" content="${description}" />`);
  html = setTag(html, /<meta property="og:title"[^>]*>/, `<meta property="og:title" content="${title}" />`);
  html = setTag(html, /<meta property="og:description"[^>]*>/, `<meta property="og:description" content="${description}" />`);
  html = setTag(html, /<meta property="og:url"[^>]*>/, `<meta property="og:url" content="${url}" />`);
  html = setTag(html, /<meta name="twitter:title"[^>]*>/, `<meta name="twitter:title" content="${title}" />`);
  html = setTag(html, /<meta name="twitter:description"[^>]*>/, `<meta name="twitter:description" content="${description}" />`);
  if (page.image) {
    const image = escapeHtml(page.image);
    html = setTag(html, /<meta property="og:image"[^>]*>/, `<meta property="og:image" content="${image}" />`);
    html = setTag(html, /<meta name="twitter:image"[^>]*>/, `<meta name="twitter:image" content="${image}" />`);
  }
  html = setTag(html, /<link rel="canonical"[^>]*>/, `<link rel="canonical" href="${url}" />`);

  if (page.breadcrumbs.length > 1) {
    const breadcrumb = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: page.breadcrumbs.map((crumb, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: crumb.name,
        item: `${SITE_URL}${crumb.path}`,
      })),
    };
    // data-seo: useSEO() replaces this script once the app has loaded.
    const json = JSON.stringify(breadcrumb).replace(/</g, "\\u003c");
    html = html.replace("</head>", `    <script type="application/ld+json" data-seo>${json}</script>\n  </head>`);
  }

  return html;
}

type Row = Record<string, unknown>;

async function query(apiUrl: string, table: string, select: string, filterColumn: string): Promise<Row[]> {
  const response = await fetch(`${apiUrl}/rest/v1/query`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ table, action: "select", select, filters: [[filterColumn, "eq", true]] }),
    signal: AbortSignal.timeout(15000),
  });
  const json = (await response.json()) as { data: Row[] | null; error: { message: string } | null };
  if (!response.ok || json.error) throw new Error(`${table}: ${json.error?.message ?? `HTTP ${response.status}`}`);
  return json.data ?? [];
}

export async function dynamicPages(apiUrl: string): Promise<PageMeta[]> {
  const pages: PageMeta[] = [];
  const settle = async (label: string, run: () => Promise<void>) => {
    try { await run(); } catch (error) { console.warn(`prerender: skipped ${label} (${(error as Error).message})`); }
  };

  await settle("locations", async () => {
    for (const row of await query(apiUrl, "locations", "id,slug,name,category,address,image_url", "is_active")) {
      const path = `/lokasi/${row.slug || row.id}`;
      const name = plain(row.name, 90);
      const where = [row.category, row.address].map((v) => plain(v, 120)).filter(Boolean).join(" — ");
      pages.push({
        path,
        title: `${name} | ${SITE_NAME}`,
        description: plain(`${name}: venue ${SITE_NAME}${where ? ` di ${where}` : ""}. Lihat fasilitas, galeri, jadwal tersedia, dan informasi pemesanan.`),
        image: (row.image_url as string) || null,
        heading: name,
        breadcrumbs: [HOME, { name: "Lokasi", path: "/lokasi" }, { name, path }],
      });
    }
  });

  await settle("portfolio", async () => {
    for (const row of await query(apiUrl, "trainers", "slug,name,bio,specialization,photo_url", "is_active")) {
      if (!row.slug) continue;
      const path = `/portfolio/${row.slug}`;
      const name = plain(row.name, 90);
      pages.push({
        path,
        title: `${name} | Portfolio ${SITE_NAME}`,
        description: plain(row.bio) || `Dokumentasi ${plain(row.specialization, 40) || "acara"} di venue ${SITE_NAME}.`,
        image: (row.photo_url as string) || null,
        heading: name,
        breadcrumbs: [HOME, { name: "Portfolio", path: "/portfolio" }, { name, path }],
      });
    }
  });

  await settle("programs", async () => {
    for (const row of await query(apiUrl, "programs", "slug,name,description,image_url", "is_active")) {
      if (!row.slug) continue;
      const path = `/tentang-kami/${row.slug}`;
      const name = plain(row.name, 90);
      pages.push({
        path,
        title: `${name} | Promosi ${SITE_NAME}`,
        description: plain(row.description) || `Penawaran dan paket venue ${SITE_NAME} untuk acara Anda.`,
        image: (row.image_url as string) || null,
        heading: name,
        breadcrumbs: [HOME, { name: "Tentang Kami", path: "/tentang-kami" }, { name, path }],
      });
    }
  });

  await settle("articles", async () => {
    const rows = await query(apiUrl, "articles", "slug,title,meta_title,meta_description,excerpt,featured_image", "is_published");
    for (const row of rows) {
      if (!row.slug) continue;
      const path = `/artikel/${row.slug}`;
      const name = plain(row.meta_title || row.title, 90);
      pages.push({
        path,
        title: `${name} | ${SITE_NAME}`,
        description: plain(row.meta_description || row.excerpt) || `Artikel dari ${SITE_NAME}.`,
        image: (row.featured_image as string) || null,
        heading: plain(row.title, 120),
        breadcrumbs: [HOME, { name: "Artikel", path: "/artikel" }, { name, path }],
      });
    }
  });

  return pages;
}

function readEnv(name: string): string {
  if (process.env[name]) return process.env[name] as string;
  const envPath = resolve(".env");
  if (!existsSync(envPath)) return "";
  const line = readFileSync(envPath, "utf8").split(/\r?\n/).find((l) => l.trim().startsWith(`${name}=`));
  return line ? line.slice(line.indexOf("=") + 1).trim().replace(/^['"]|['"]$/g, "") : "";
}

async function main() {
  const distIndex = resolve("dist/index.html");
  if (!existsSync(distIndex)) {
    console.warn("prerender: dist/index.html not found; skipped.");
    return;
  }
  const template = readFileSync(distIndex, "utf8");
  const apiUrl = readEnv("VITE_API_URL").replace(/\/$/, "");
  const pages = [...STATIC_PAGES, ...(apiUrl ? await dynamicPages(apiUrl) : [])];

  for (const page of pages) {
    const file = resolve("dist", `.${page.path}`, "index.html");
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, renderPage(template, page));
  }

  // Home page: same treatment so it also carries its canonical URL and crawlable navigation.
  const unescape = (v: string) => v.replaceAll("&quot;", '"').replaceAll("&lt;", "<").replaceAll("&gt;", ">").replaceAll("&amp;", "&");
  writeFileSync(distIndex, renderPage(template, {
    path: "/",
    title: unescape(template.match(/<title>([\s\S]*?)<\/title>/)?.[1] ?? SITE_NAME),
    description: unescape(template.match(/<meta name="description" content="([^"]*)"/)?.[1] ?? ""),
    heading: "Kediaman Corp — Venue & Ballroom Pernikahan",
    breadcrumbs: [HOME],
  }));

  console.log(`prerender: wrote ${pages.length + 1} pages`);
}

if (process.argv[1] && resolve(process.argv[1]) === resolve("scripts/prerender-meta.ts")) {
  await main();
}
