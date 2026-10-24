// Runs before Vite dev/build and writes public/sitemap.xml.

import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";

const BASE_URL = "https://kediaman.co";

interface SitemapEntry {
  path: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: string;
}

interface ContentSource {
  table: "articles" | "locations" | "programs" | "trainers";
  select: string;
  filter: string;
  toPath: (row: Record<string, unknown>) => string | null;
  changefreq: SitemapEntry["changefreq"];
  priority: string;
}

const staticEntries: SitemapEntry[] = [
  { path: "/", changefreq: "weekly", priority: "1.0" },
  { path: "/landing", changefreq: "weekly", priority: "0.8" },
  { path: "/venue-only", changefreq: "weekly", priority: "0.8" },
  { path: "/tentang-kami", changefreq: "monthly", priority: "0.8" },
  { path: "/portfolio", changefreq: "weekly", priority: "0.8" },
  { path: "/paket", changefreq: "weekly", priority: "0.9" },
  { path: "/lokasi", changefreq: "weekly", priority: "0.9" },
  { path: "/artikel", changefreq: "weekly", priority: "0.8" },
];

const contentSources: ContentSource[] = [
  {
    table: "articles",
    select: "slug",
    filter: "is_published=eq.true",
    toPath: (row) => typeof row.slug === "string" ? `/artikel/${row.slug}` : null,
    changefreq: "monthly",
    priority: "0.7",
  },
  {
    table: "locations",
    select: "id,slug",
    filter: "is_active=eq.true",
    toPath: (row) => typeof row.slug === "string" && row.slug ? `/lokasi/${row.slug}` : typeof row.id === "string" ? `/lokasi/${row.id}` : null,
    changefreq: "monthly",
    priority: "0.8",
  },
  {
    table: "programs",
    select: "slug",
    filter: "is_active=eq.true",
    toPath: (row) => typeof row.slug === "string" && row.slug ? `/tentang-kami/${row.slug}` : null,
    changefreq: "monthly",
    priority: "0.7",
  },
  {
    table: "trainers",
    select: "slug",
    filter: "is_active=eq.true",
    toPath: (row) => typeof row.slug === "string" && row.slug ? `/portfolio/${row.slug}` : null,
    changefreq: "monthly",
    priority: "0.7",
  },
];

function readLocalEnv() {
  const envPath = resolve(".env");
  if (!existsSync(envPath)) return {};

  return Object.fromEntries(
    readFileSync(envPath, "utf8")
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#") && line.includes("="))
      .map((line) => {
        const separator = line.indexOf("=");
        const key = line.slice(0, separator).trim();
        const value = line.slice(separator + 1).trim().replace(/^['"]|['"]$/g, "");
        return [key, value];
      }),
  );
}

// Backend Railway (kediaman-api). Dipakai lebih dulu bila VITE_API_URL tersedia.
function railwayApiUrl() {
  const localEnv = readLocalEnv();
  return (process.env.VITE_API_URL || localEnv.VITE_API_URL || "").replace(/\/$/, "");
}

async function railwayQuery(apiUrl: string, table: string, select: string, filter = "", extra: Record<string, unknown> = {}) {
  const [filterName, filterValue] = filter.split("=");
  const filters: [string, string, unknown][] = [];
  if (filterName && filterValue?.startsWith("eq.")) {
    const raw = filterValue.slice(3);
    filters.push([filterName, "eq", raw === "true" ? true : raw === "false" ? false : raw]);
  }
  const response = await fetch(`${apiUrl}/rest/v1/query`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ table, action: "select", select, filters, ...extra }),
    signal: AbortSignal.timeout(10000),
  });
  const json = await response.json() as { data: Record<string, unknown>[] | null; error: { message: string } | null };
  if (!response.ok || json.error) throw new Error(`${table}: ${json.error?.message ?? `HTTP ${response.status}`}`);
  return json.data ?? [];
}

function escapeXml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

async function fetchDynamicEntries(): Promise<SitemapEntry[]> {
  const railway = railwayApiUrl();
  if (railway) {
    const results = await Promise.allSettled(contentSources.map(async (source) => {
      const rows = await railwayQuery(railway, source.table, source.select, source.filter);
      return rows.flatMap((row) => {
        const path = source.toPath(row);
        return path ? [{ path, changefreq: source.changefreq, priority: source.priority }] : [];
      });
    }));
    return results.flatMap((result, index) => {
      if (result.status === "fulfilled") return result.value;
      console.warn(`Skipped dynamic ${contentSources[index].table} URLs: ${result.reason}`);
      return [];
    });
  }
  const localEnv = readLocalEnv();
  const apiUrl = process.env.VITE_SUPABASE_URL || localEnv.VITE_SUPABASE_URL;
  const apiKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || localEnv.VITE_SUPABASE_PUBLISHABLE_KEY;

  if (!apiUrl || !apiKey) {
    console.warn("CMS configuration unavailable; generating sitemap with static routes only.");
    return [];
  }

  const results = await Promise.allSettled(contentSources.map(async (source) => {
    const url = new URL(`${apiUrl}/rest/v1/${source.table}`);
    url.searchParams.set("select", source.select);
    const [filterName, filterValue] = source.filter.split("=");
    if (filterName && filterValue) url.searchParams.set(filterName, filterValue);

    const response = await fetch(url, {
      headers: {
        apikey: apiKey,
        Authorization: `Bearer ${apiKey}`,
      },
    });

    if (!response.ok) throw new Error(`${source.table}: HTTP ${response.status}`);
    const rows = await response.json() as Record<string, unknown>[];

    return rows.flatMap((row) => {
      const path = source.toPath(row);
      return path ? [{ path, changefreq: source.changefreq, priority: source.priority }] : [];
    });
  }));

  return results.flatMap((result, index) => {
    if (result.status === "fulfilled") return result.value;
    console.warn(`Skipped dynamic ${contentSources[index].table} URLs: ${result.reason}`);
    return [];
  });
}

function generateSitemap(entries: SitemapEntry[]) {
  const uniqueEntries = [...new Map(entries.map((entry) => [entry.path, entry])).values()];
  const urls = uniqueEntries.map((entry) => [
    "  <url>",
    `    <loc>${escapeXml(`${BASE_URL}${entry.path}`)}</loc>`,
    entry.changefreq ? `    <changefreq>${entry.changefreq}</changefreq>` : null,
    entry.priority ? `    <priority>${entry.priority}</priority>` : null,
    "  </url>",
  ].filter(Boolean).join("\n"));

  return {
    count: uniqueEntries.length,
    xml: [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
      ...urls,
      "</urlset>",
      "",
    ].join("\n"),
  };
}

const dynamicEntries = await fetchDynamicEntries();
// A public-only snapshot allows the first hero to render before the live CMS request.
async function writeHeroSnapshot() {
  const railway = railwayApiUrl();
  if (railway) {
    try {
      const slides = await railwayQuery(railway, "hero_slides", "*", "is_active=eq.true", {
        order: [{ column: "sort_order", ascending: true }],
      });
      mkdirSync(resolve('src/generated'), { recursive: true });
      writeFileSync(resolve('src/generated/hero-slides.json'), JSON.stringify(slides));
    } catch {
      console.warn('Hero snapshot unavailable; keeping the previous public snapshot.');
    }
    return;
  }
  const env = readLocalEnv();
  const apiUrl = process.env.VITE_SUPABASE_URL || env.VITE_SUPABASE_URL;
  const apiKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!apiUrl || !apiKey) return;
  try {
    const response = await fetch(`${apiUrl}/rest/v1/hero_slides?select=*&is_active=eq.true&order=sort_order.asc`, {
      headers: { apikey: apiKey, Authorization: `Bearer ${apiKey}` },
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const slides = await response.json();
    mkdirSync(resolve('src/generated'), { recursive: true });
    writeFileSync(resolve('src/generated/hero-slides.json'), JSON.stringify(slides));
  } catch {
    console.warn('Hero snapshot unavailable; keeping the previous public snapshot.');
  }
}
await writeHeroSnapshot();
const sitemap = generateSitemap([...staticEntries, ...dynamicEntries]);
writeFileSync(resolve("public/sitemap.xml"), sitemap.xml);
console.log(`sitemap.xml written (${sitemap.count} entries)`);