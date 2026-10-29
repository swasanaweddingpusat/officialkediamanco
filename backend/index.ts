// =====================================================================
// kediaman-api — pengganti Supabase / Lovable Cloud
// Bun + Hono, PostgreSQL (Railway) + MinIO.
//
// Endpoint (dipakai oleh src/integrations/supabase/client.ts di frontend):
//   POST /rest/v1/query                 query builder (select/insert/update/delete)
//   POST /auth/v1/signup | /auth/v1/token, GET /auth/v1/user
//   POST /storage/v1/object/:bucket/*   upload file (admin)
//   POST /functions/v1/track-booking | external-deals | chat
//
// Variabel lingkungan:
//   DATABASE_URL, JWT_SECRET, MINIO_ENDPOINT, MINIO_ROOT_USER, MINIO_ROOT_PASSWORD,
//   STORAGE_PUBLIC_URL (mis. https://bucket-jwta-production.up.railway.app)
//   ADMIN_EMAIL + ADMIN_PASSWORD   (opsional: set password admin yang masih kosong)
//   EXTERNAL_SUPABASE_URL + EXTERNAL_SUPABASE_ANON_KEY   (opsional: data "deals")
//   LLM_API_KEY [+ LLM_API_URL, LLM_MODEL]   (opsional: chat asisten, API kompatibel OpenAI)
//   IMPORT_SUPABASE_URL + IMPORT_SUPABASE_KEY (opsional, sekali pakai: impor tabel publik lama)
// =====================================================================
import { Hono } from "hono";
import { cors } from "hono/cors";
import { sign, verify } from "hono/jwt";
import { SQL, S3Client } from "bun";
import sharp from "sharp";
import { randomBytes, timingSafeEqual } from "node:crypto";

const env = Bun.env;
const sql = new SQL(env.DATABASE_URL!);
const JWT_SECRET = env.JWT_SECRET!;
const BUCKETS = new Set(["gym-images"]);
const SESSION_SECONDS = 60 * 60 * 24 * 7;

// ---------------------------------------------------------------------
// 1. Schema tambahan (tabel yang belum ada di ekspor CSV). Idempoten.
// ---------------------------------------------------------------------
const BOOTSTRAP = `
CREATE TABLE IF NOT EXISTS features (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  icon text,
  sort_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS testimonials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  role text,
  content text NOT NULL,
  photo_url text,
  rating integer DEFAULT 5,
  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS venue_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id uuid NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  name text NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  price numeric(14,2) NOT NULL DEFAULT 0,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS ballroom_bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id uuid NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  booking_date date NOT NULL,
  start_time time,
  end_time time,
  contact_name text NOT NULL,
  contact_email text NOT NULL,
  contact_phone text NOT NULL,
  event_name text NOT NULL,
  event_type text,
  guest_count integer,
  notes text,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','awaiting_payment','paid','approved','rejected','cancelled','completed')),
  admin_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  session_id uuid REFERENCES venue_sessions(id) ON DELETE SET NULL,
  total_amount numeric(14,2) NOT NULL DEFAULT 0,
  payment_type text NOT NULL DEFAULT 'full' CHECK (payment_type IN ('dp','full')),
  payment_amount numeric(14,2) NOT NULL DEFAULT 0,
  payment_status text NOT NULL DEFAULT 'pending'
    CHECK (payment_status IN ('pending','paid','failed','expired','refunded','cancelled')),
  midtrans_order_id text UNIQUE,
  midtrans_snap_token text,
  midtrans_transaction_id text,
  payment_method text,
  paid_at timestamptz
);
CREATE INDEX IF NOT EXISTS ballroom_bookings_email_idx ON ballroom_bookings (lower(contact_email));
CREATE INDEX IF NOT EXISTS venue_sessions_location_idx ON venue_sessions (location_id);
CREATE OR REPLACE TRIGGER venue_sessions_set_updated_at BEFORE UPDATE ON venue_sessions
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE OR REPLACE TRIGGER ballroom_bookings_set_updated_at BEFORE UPDATE ON ballroom_bookings
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Promo per jadwal ballroom (Special/Limited Offer) dari versi Lovable terbaru.
ALTER TABLE ballroom_schedules ADD COLUMN IF NOT EXISTS promo_type text;
ALTER TABLE ballroom_schedules ADD COLUMN IF NOT EXISTS promo_label text;
ALTER TABLE ballroom_schedules ADD COLUMN IF NOT EXISTS promo_expires_at timestamptz;

-- Statistik minat venue (dilihat, tanggal diklik, permintaan booking).
CREATE TABLE IF NOT EXISTS venue_interest_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id uuid NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  event_type text NOT NULL CHECK (event_type IN ('venue_view', 'date_click', 'booking_request')),
  visitor_key text NOT NULL,
  schedule_date date,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS venue_interest_events_lookup_idx
  ON venue_interest_events (location_id, event_type, schedule_date);

-- Slug untuk URL ramah (/portfolio/<slug>, /tentang-kami/<slug>, lokasi). Diisi otomatis dari nama.
CREATE OR REPLACE FUNCTION kdm_slugify(t text) RETURNS text AS $$
  SELECT nullif(trim(both '-' from regexp_replace(lower(coalesce(t, '')), '[^a-z0-9]+', '-', 'g')), '')
$$ LANGUAGE sql IMMUTABLE;

CREATE OR REPLACE FUNCTION kdm_unique_slug(tbl text, base text, rid uuid) RETURNS text AS $$
DECLARE cand text := base; n int := 1; taken boolean;
BEGIN
  LOOP
    EXECUTE format('SELECT EXISTS (SELECT 1 FROM %I WHERE slug = $1 AND id <> $2)', tbl) INTO taken USING cand, rid;
    EXIT WHEN NOT taken;
    n := n + 1;
    cand := base || '-' || n;
  END LOOP;
  RETURN cand;
END $$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION kdm_fill_slug() RETURNS trigger AS $$
DECLARE j jsonb := to_jsonb(NEW);
BEGIN
  IF coalesce(NEW.slug, '') = '' THEN
    NEW.slug := kdm_unique_slug(TG_TABLE_NAME,
      coalesce(kdm_slugify(j->>'name'), kdm_slugify(j->>'title'), left(NEW.id::text, 8)), NEW.id);
  END IF;
  RETURN NEW;
END $$ LANGUAGE plpgsql;

DO $$
DECLARE t text; r record;
BEGIN
  FOREACH t IN ARRAY ARRAY['trainers', 'locations', 'programs'] LOOP
    EXECUTE format('ALTER TABLE %I ADD COLUMN IF NOT EXISTS slug text', t);
    EXECUTE format('CREATE OR REPLACE TRIGGER %I BEFORE INSERT OR UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION kdm_fill_slug()', t || '_fill_slug', t);
    IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = t || '_set_updated_at') THEN
      EXECUTE format('ALTER TABLE %I DISABLE TRIGGER %I', t, t || '_set_updated_at');
    END IF;
    FOR r IN EXECUTE format('SELECT id, to_jsonb(x) AS j FROM %I x WHERE coalesce(slug, %L) = %L ORDER BY created_at, id', t, '', '') LOOP
      EXECUTE format('UPDATE %I SET slug = $1 WHERE id = $2', t)
        USING kdm_unique_slug(t, coalesce(kdm_slugify(r.j->>'name'), kdm_slugify(r.j->>'title'), left(r.id::text, 8)), r.id), r.id;
    END LOOP;
    IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = t || '_set_updated_at') THEN
      EXECUTE format('ALTER TABLE %I ENABLE TRIGGER %I', t, t || '_set_updated_at');
    END IF;
    EXECUTE format('CREATE UNIQUE INDEX IF NOT EXISTS %I ON %I (slug)', t || '_slug_key', t);
  END LOOP;
END $$;

-- Paket & harga per venue (CMS "Paket & Harga")
CREATE TABLE IF NOT EXISTS venue_packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id uuid REFERENCES locations(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  inclusions jsonb NOT NULL DEFAULT '[]'::jsonb,
  price numeric(14,2),
  price_note text,
  min_pax integer,
  max_pax integer,
  image_url text,
  is_featured boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS venue_packages_location_idx ON venue_packages (location_id);
CREATE OR REPLACE TRIGGER venue_packages_set_updated_at BEFORE UPDATE ON venue_packages
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Bantuan / FAQ (CMS "FAQ")
CREATE TABLE IF NOT EXISTS faqs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL DEFAULT 'Umum',
  question text NOT NULL,
  answer text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE OR REPLACE TRIGGER faqs_set_updated_at BEFORE UPDATE ON faqs
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Ulasan pasangan (diinput & dimoderasi admin)
CREATE TABLE IF NOT EXISTS venue_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id uuid REFERENCES locations(id) ON DELETE SET NULL,
  reviewer_name text NOT NULL,
  event_date date,
  event_type text,
  rating integer NOT NULL DEFAULT 5 CHECK (rating BETWEEN 1 AND 5),
  title text,
  body text NOT NULL,
  photo_url text,
  is_published boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS venue_reviews_location_idx ON venue_reviews (location_id);
CREATE OR REPLACE TRIGGER venue_reviews_set_updated_at BEFORE UPDATE ON venue_reviews
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Detail promo (tabel programs = promo)
ALTER TABLE programs ADD COLUMN IF NOT EXISTS start_date date;
ALTER TABLE programs ADD COLUMN IF NOT EXISTS end_date date;
ALTER TABLE programs ADD COLUMN IF NOT EXISTS content text;
ALTER TABLE programs ADD COLUMN IF NOT EXISTS terms jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE programs ADD COLUMN IF NOT EXISTS promo_code text;
ALTER TABLE programs ADD COLUMN IF NOT EXISTS location_ids jsonb NOT NULL DEFAULT '[]'::jsonb;

-- Paket yang dipilih pengunjung di form booking (nama disalin agar tetap terbaca bila paket dihapus)
ALTER TABLE ballroom_bookings ADD COLUMN IF NOT EXISTS package_id uuid REFERENCES venue_packages(id) ON DELETE SET NULL;
ALTER TABLE ballroom_bookings ADD COLUMN IF NOT EXISTS package_name text;

-- Pelanggan newsletter (diisi dari CTA "Langganan" di website; dikirim otomatis oleh agent)
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  name text,
  source text,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'unsubscribed')),
  unsubscribe_token text NOT NULL,
  consent_at timestamptz NOT NULL DEFAULT now(),
  unsubscribed_at timestamptz,
  last_sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS newsletter_subscribers_email_key ON newsletter_subscribers (lower(email));
CREATE UNIQUE INDEX IF NOT EXISTS newsletter_subscribers_token_key ON newsletter_subscribers (unsubscribe_token);
CREATE INDEX IF NOT EXISTS newsletter_subscribers_status_idx ON newsletter_subscribers (status, created_at);
CREATE OR REPLACE TRIGGER newsletter_subscribers_set_updated_at BEFORE UPDATE ON newsletter_subscribers
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
`;

// ---------------------------------------------------------------------
// 2. Aturan akses — meniru RLS Supabase dari folder supabase/migrations
// ---------------------------------------------------------------------
type Ctx = { userId: string | null; isAdmin: boolean };
type Filter = [string, string, unknown];

// Tabel konten: publik boleh baca (dengan filter di bawah), hanya admin boleh menulis.
const CONTENT_TABLES = new Set([
  "site_settings", "hero_slides", "features", "programs", "trainers", "locations", "testimonials",
  "ballroom_schedules", "articles", "video_testimonials", "about_sections", "about_settings", "venue_sessions",
  "venue_packages", "faqs", "venue_reviews",
]);
// Filter wajib untuk pengunjung non-admin (sama dengan policy SELECT di Supabase).
const PUBLIC_ROW_FILTER: Record<string, Filter> = {
  hero_slides: ["is_active", "eq", true],
  features: ["is_active", "eq", true],
  programs: ["is_active", "eq", true],
  trainers: ["is_active", "eq", true],
  locations: ["is_active", "eq", true],
  testimonials: ["is_active", "eq", true],
  venue_sessions: ["is_active", "eq", true],
  articles: ["is_published", "eq", true],
  about_sections: ["is_visible", "eq", true],
  venue_packages: ["is_active", "eq", true],
  faqs: ["is_active", "eq", true],
  venue_reviews: ["is_published", "eq", true],
};

class ApiError extends Error {
  constructor(public status: number, message: string, public code = "API_ERROR") { super(message); }
}

/** Mengembalikan filter tambahan yang wajib diterapkan, atau melempar error jika aksi tidak diizinkan. */
export function authorize(table: string, action: string, ctx: Ctx, values?: any[]): Filter[] {
  if (ctx.isAdmin) return [];
  const deny = () => { throw new ApiError(403, `Tidak diizinkan: ${action} pada ${table}`, "42501"); };

  if (CONTENT_TABLES.has(table)) {
    if (action !== "select") deny();
    const f = PUBLIC_ROW_FILTER[table];
    return f ? [f] : [];
  }
  if (table === "user_roles") {
    if (action !== "select" || !ctx.userId) deny();
    return [["user_id", "eq", ctx.userId]];
  }
  if (table === "profiles") {
    if (!ctx.userId || (action !== "select" && action !== "update")) deny();
    return [["user_id", "eq", ctx.userId]];
  }
  if (table === "ballroom_bookings") {
    if (action === "insert") {
      for (const v of values ?? []) {
        if (v.user_id != null && v.user_id !== ctx.userId) deny();
        // pengunjung tidak boleh mengatur kolom pembayaran/status sendiri
        for (const k of ["status", "admin_notes", "payment_status", "paid_at", "midtrans_order_id",
          "midtrans_snap_token", "midtrans_transaction_id"]) if (k in v) deny();
      }
      return [];
    }
    if (action === "select" && ctx.userId) return [["user_id", "eq", ctx.userId]];
    deny();
  }
  deny();
  return [];
}

// ---------------------------------------------------------------------
// 3. Query builder (tabel & kolom divalidasi dengan information_schema)
// ---------------------------------------------------------------------
type Schema = Record<string, Record<string, string>>; // table -> column -> udt_name
let schema: Schema = {};
const HIDDEN_TABLES = new Set(["users", "venue_interest_events"]);

async function loadSchema() {
  const rows = await sql`SELECT table_name, column_name, udt_name FROM information_schema.columns
                         WHERE table_schema = 'public' ORDER BY table_name, ordinal_position`;
  const s: Schema = {};
  for (const r of rows) (s[r.table_name] ??= {})[r.column_name] = r.udt_name;
  schema = s;
}

const q = (id: string) => `"${id.replace(/"/g, '""')}"`;

export type QueryReq = {
  table: string;
  action: "select" | "insert" | "update" | "delete";
  select?: string | null;
  filters?: Filter[];
  order?: { column: string; ascending?: boolean; nullsFirst?: boolean }[];
  limit?: number | null;
  single?: "single" | "maybe" | null;
  values?: any;
  returning?: boolean;
};

function splitTop(s: string): string[] {
  const out: string[] = []; let depth = 0; let cur = "";
  for (const ch of s) {
    if (ch === "(") depth++;
    if (ch === ")") depth--;
    if (ch === "," && depth === 0) { out.push(cur); cur = ""; } else cur += ch;
  }
  if (cur.trim()) out.push(cur);
  return out.map((x) => x.trim()).filter(Boolean);
}

export function buildSelectList(table: string, select: string, sch: Schema): string {
  const cols = sch[table];
  const parts: string[] = [];
  for (const item of splitTop(select || "*")) {
    const m = item.match(/^([a-zA-Z_][\w]*)\s*\((.*)\)$/s);
    if (m) {
      const rel = m[1];
      const relCols = sch[rel];
      if (!relCols || HIDDEN_TABLES.has(rel)) throw new ApiError(400, `Relasi tidak dikenal: ${rel}`, "PGRST200");
      const fk = rel.replace(/s$/, "") + "_id";
      if (!cols[fk]) throw new ApiError(400, `Tidak ada relasi ${table} -> ${rel}`, "PGRST200");
      const inner = splitTop(m[2] || "*");
      const obj = inner.includes("*")
        ? "row_to_json(e)"
        : "json_build_object(" + inner.map((c) => {
            if (!relCols[c]) throw new ApiError(400, `Kolom ${rel}.${c} tidak ada`, "42703");
            return `'${c}', e.${q(c)}`;
          }).join(", ") + ")";
      parts.push(`(SELECT ${obj} FROM ${q(rel)} e WHERE e.id = t.${q(fk)}) AS ${q(rel)}`);
    } else if (item === "*") {
      parts.push("t.*");
    } else {
      if (!cols[item]) throw new ApiError(400, `Kolom ${table}.${item} tidak ada`, "42703");
      parts.push(`t.${q(item)}`);
    }
  }
  return parts.join(", ");
}

class Params {
  list: unknown[] = [];
  add(value: unknown, udt: string) {
    let v = value;
    if (udt === "jsonb" || udt === "json") v = value === null || value === undefined ? null : JSON.stringify(value);
    else if (value !== null && typeof value === "object") v = JSON.stringify(value);
    this.list.push(v);
    // json/jsonb dikirim sebagai teks lalu di-cast, supaya driver tidak meng-encode JSON dua kali
    const cast = udt === "jsonb" || udt === "json" ? `text::${udt}` : udt;
    return `$${this.list.length}::${cast}`;
  }
}

function buildWhere(table: string, filters: Filter[], p: Params, sch: Schema, alias = "t"): string {
  const cols = sch[table];
  const conds = filters.map(([col, op, val]) => {
    const udt = cols[col];
    if (!udt) throw new ApiError(400, `Kolom ${table}.${col} tidak ada`, "42703");
    const c = `${alias}.${q(col)}`;
    switch (op) {
      case "eq": return val === null ? `${c} IS NULL` : `${c} = ${p.add(val, udt)}`;
      case "neq": return val === null ? `${c} IS NOT NULL` : `${c} IS DISTINCT FROM ${p.add(val, udt)}`;
      case "gt": return `${c} > ${p.add(val, udt)}`;
      case "gte": return `${c} >= ${p.add(val, udt)}`;
      case "lt": return `${c} < ${p.add(val, udt)}`;
      case "lte": return `${c} <= ${p.add(val, udt)}`;
      case "is": return val === null ? `${c} IS NULL` : val === true ? `${c} IS TRUE` : `${c} IS FALSE`;
      case "in": {
        const arr = Array.isArray(val) ? val : [];
        return arr.length ? `${c} IN (${arr.map((v) => p.add(v, udt)).join(", ")})` : "FALSE";
      }
      default: throw new ApiError(400, `Operator tidak didukung: ${op}`);
    }
  });
  return conds.length ? " WHERE " + conds.join(" AND ") : "";
}

export function buildQuery(r: QueryReq, forced: Filter[], sch: Schema): { text: string; params: unknown[] } {
  const cols = sch[r.table];
  if (!cols || HIDDEN_TABLES.has(r.table)) throw new ApiError(404, `Tabel tidak dikenal: ${r.table}`, "42P01");
  const p = new Params();
  const filters = [...(r.filters ?? []), ...forced];
  const T = q(r.table);
  const wrap = (inner: string) => `WITH r AS (${inner}) SELECT coalesce(json_agg(r), '[]'::json) AS data FROM r`;

  if (r.action === "select") {
    const sel = buildSelectList(r.table, r.select ?? "*", sch);
    let text = `SELECT ${sel} FROM ${T} t` + buildWhere(r.table, filters, p, sch);
    if (r.order?.length) {
      text += " ORDER BY " + r.order.map((o) => {
        if (!cols[o.column]) throw new ApiError(400, `Kolom ${r.table}.${o.column} tidak ada`, "42703");
        const asc = o.ascending !== false;
        const nulls = o.nullsFirst === undefined ? "" : o.nullsFirst ? " NULLS FIRST" : " NULLS LAST";
        return `t.${q(o.column)} ${asc ? "ASC" : "DESC"}${nulls}`;
      }).join(", ");
    }
    if (r.limit != null) text += ` LIMIT ${Math.max(0, Math.floor(Number(r.limit)))}`;
    return { text: `SELECT coalesce(json_agg(x), '[]'::json) AS data FROM (${text}) x`, params: p.list };
  }

  if (r.action === "insert") {
    const rows: any[] = Array.isArray(r.values) ? r.values : [r.values];
    if (!rows.length) throw new ApiError(400, "Tidak ada data untuk disimpan");
    const keys = [...new Set(rows.flatMap((row) => Object.keys(row ?? {}).filter((k) => row[k] !== undefined)))];
    for (const k of keys) if (!cols[k]) throw new ApiError(400, `Kolom ${r.table}.${k} tidak ada`, "PGRST204");
    const valuesSql = rows.map((row) =>
      "(" + keys.map((k) => (row[k] === undefined ? "DEFAULT" : p.add(row[k], cols[k]))).join(", ") + ")",
    ).join(", ");
    const ins = keys.length
      ? `INSERT INTO ${T} (${keys.map(q).join(", ")}) VALUES ${valuesSql} RETURNING *`
      : `INSERT INTO ${T} DEFAULT VALUES RETURNING *`;
    return { text: wrap(ins), params: p.list };
  }

  if (r.action === "update") {
    const v = r.values ?? {};
    const keys = Object.keys(v).filter((k) => v[k] !== undefined);
    if (!keys.length) throw new ApiError(400, "Tidak ada kolom untuk diubah");
    for (const k of keys) if (!cols[k]) throw new ApiError(400, `Kolom ${r.table}.${k} tidak ada`, "PGRST204");
    if (!r.filters?.length) throw new ApiError(400, "UPDATE wajib memakai filter", "21000");
    const set = keys.map((k) => `${q(k)} = ${p.add(v[k], cols[k])}`).join(", ");
    return { text: wrap(`UPDATE ${T} t SET ${set}` + buildWhere(r.table, filters, p, sch) + " RETURNING t.*"), params: p.list };
  }

  if (r.action === "delete") {
    if (!r.filters?.length) throw new ApiError(400, "DELETE wajib memakai filter", "21000");
    return { text: wrap(`DELETE FROM ${T} t` + buildWhere(r.table, filters, p, sch) + " RETURNING t.*"), params: p.list };
  }
  throw new ApiError(400, `Aksi tidak dikenal: ${r.action}`);
}

async function runQuery(r: QueryReq, ctx: Ctx) {
  const rows = Array.isArray(r.values) ? r.values : r.values ? [r.values] : [];
  const forced = authorize(r.table, r.action, ctx, rows);
  const { text, params } = buildQuery(r, forced, schema);
  const [res] = await sql.unsafe(text, params);
  let data: any = typeof res.data === "string" ? JSON.parse(res.data) : res.data;

  if (r.action !== "select" && !r.returning) return null;
  if (r.single === "single") {
    if (data.length !== 1) throw new ApiError(406, "JSON object requested, multiple (or no) rows returned", "PGRST116");
    return data[0];
  }
  if (r.single === "maybe") {
    if (data.length > 1) throw new ApiError(406, "JSON object requested, multiple rows returned", "PGRST116");
    return data[0] ?? null;
  }
  return data;
}

// ---------------------------------------------------------------------
// 4. Auth (email + password, JWT HS256)
// ---------------------------------------------------------------------
const adminCache = new Map<string, { v: boolean; at: number }>();

async function isAdmin(userId: string) {
  const c = adminCache.get(userId);
  if (c && Date.now() - c.at < 30_000) return c.v;
  const rows = await sql`SELECT 1 FROM user_roles WHERE user_id = ${userId}::uuid AND role = 'admin' LIMIT 1`;
  const v = rows.length > 0;
  adminCache.set(userId, { v, at: Date.now() });
  return v;
}

async function getCtx(authHeader?: string | null): Promise<Ctx> {
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) return { userId: null, isAdmin: false };
  try {
    const payload: any = await verify(token, JWT_SECRET, "HS256");
    const userId = String(payload.sub);
    return { userId, isAdmin: await isAdmin(userId) };
  } catch {
    return { userId: null, isAdmin: false };
  }
}

function publicUser(u: any) {
  return {
    id: u.id, email: u.email, aud: "authenticated", role: "authenticated",
    app_metadata: { provider: "email" }, user_metadata: {}, created_at: u.created_at,
  };
}

async function makeSession(u: any) {
  const exp = Math.floor(Date.now() / 1000) + SESSION_SECONDS;
  const access_token = await sign({ sub: u.id, email: u.email, role: "authenticated", exp }, JWT_SECRET, "HS256");
  return { access_token, token_type: "bearer", expires_in: SESSION_SECONDS, expires_at: exp, refresh_token: "", user: publicUser(u) };
}

const loginAttempts = new Map<string, { n: number; reset: number }>();
function limited(key: string, max: number, windowMs = 60_000) {
  const now = Date.now();
  const e = loginAttempts.get(key);
  if (!e || e.reset < now) { loginAttempts.set(key, { n: 1, reset: now + windowMs }); return false; }
  e.n++;
  return e.n > max;
}
const validEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e) && e.length <= 255;

// ---------------------------------------------------------------------
// 5. App
// ---------------------------------------------------------------------
const app = new Hono();
app.use("*", cors({ origin: "*", allowHeaders: ["authorization", "content-type", "x-upsert", "cache-control"], maxAge: 86400 }));
const ip = (c: any) => c.req.header("x-forwarded-for")?.split(",")[0].trim() || "unknown";
const fail = (c: any, e: any) => {
  const status = e instanceof ApiError ? e.status : 400;
  if (!(e instanceof ApiError)) console.error("query error:", e?.message ?? e);
  return c.json({ data: null, error: { message: e?.message ?? String(e), code: e?.code ?? e?.errno ?? "ERROR" } }, status);
};

app.get("/", (c) => c.json({ ok: true, service: "kediaman-api" }));

app.post("/rest/v1/query", async (c) => {
  try {
    const ctx = await getCtx(c.req.header("authorization"));
    const body = (await c.req.json()) as QueryReq;
    return c.json({ data: await runQuery(body, ctx), error: null });
  } catch (e) {
    return fail(c, e);
  }
});

app.post("/auth/v1/token", async (c) => {
  const { email, password } = await c.req.json().catch(() => ({}));
  const em = String(email ?? "").trim().toLowerCase();
  if (limited(`login:${ip(c)}`, 10)) return c.json({ error: { message: "Terlalu banyak percobaan, coba lagi dalam 1 menit." } }, 429);
  const [u] = await sql`SELECT * FROM users WHERE lower(email) = ${em}`;
  const ok = u?.password_hash && (await Bun.password.verify(String(password ?? ""), u.password_hash));
  if (!ok) return c.json({ error: { message: "Invalid login credentials" } }, 400);
  return c.json({ data: await makeSession(u), error: null });
});

app.post("/auth/v1/signup", async (c) => {
  const { email, password } = await c.req.json().catch(() => ({}));
  const em = String(email ?? "").trim().toLowerCase();
  if (limited(`signup:${ip(c)}`, 5)) return c.json({ error: { message: "Terlalu banyak percobaan, coba lagi nanti." } }, 429);
  if (!validEmail(em)) return c.json({ error: { message: "Email tidak valid" } }, 400);
  if (String(password ?? "").length < 6) return c.json({ error: { message: "Password should be at least 6 characters" } }, 400);
  const [exists] = await sql`SELECT 1 FROM users WHERE lower(email) = ${em}`;
  if (exists) return c.json({ error: { message: "User already registered" } }, 400);
  const hash = await Bun.password.hash(String(password));
  const u = await sql.begin(async (tx) => {
    const [row] = await tx`INSERT INTO users (email, password_hash) VALUES (${em}, ${hash}) RETURNING *`;
    await tx`INSERT INTO profiles (user_id, email) VALUES (${row.id}, ${em})`;
    return row;
  });
  return c.json({ data: await makeSession(u), error: null });
});

app.get("/auth/v1/user", async (c) => {
  const ctx = await getCtx(c.req.header("authorization"));
  if (!ctx.userId) return c.json({ error: { message: "Not authenticated" } }, 401);
  const [u] = await sql`SELECT * FROM users WHERE id = ${ctx.userId}::uuid`;
  if (!u) return c.json({ error: { message: "User not found" } }, 401);
  return c.json({ data: { user: publicUser(u) }, error: null });
});

// Upload file ke MinIO (admin). Path: /storage/v1/object/<bucket>/<path/nama-file>
app.post("/storage/v1/object/:bucket/*", async (c) => {
  try {
    const ctx = await getCtx(c.req.header("authorization"));
    if (!ctx.isAdmin) throw new ApiError(403, "Hanya admin yang boleh upload", "42501");
    const bucket = c.req.param("bucket");
    if (!BUCKETS.has(bucket)) throw new ApiError(400, "Bucket tidak dikenal");
    const prefix = `/storage/v1/object/${bucket}/`;
    const key = decodeURIComponent(c.req.path.slice(prefix.length));
    if (!key || key.includes("..") || key.startsWith("/")) throw new ApiError(400, "Nama file tidak valid");
    const s3 = new S3Client({
      accessKeyId: env.MINIO_ROOT_USER, secretAccessKey: env.MINIO_ROOT_PASSWORD,
      endpoint: env.MINIO_ENDPOINT, bucket,
    });
    if (c.req.header("x-upsert") !== "true" && (await s3.exists(key))) {
      throw new ApiError(409, "The resource already exists", "Duplicate");
    }
    const body = await c.req.arrayBuffer();
    await s3.write(key, new Uint8Array(body), {
      type: c.req.header("content-type") || "application/octet-stream",
    });
    return c.json({ data: { path: key, fullPath: `${bucket}/${key}`, id: key }, error: null });
  } catch (e) {
    return fail(c, e);
  }
});

// ---------------------------------------------------------------------
// Gambar responsif: /img/<path di bucket gym-images>?w=640&q=70 -> WebP yang sudah dikecilkan.
// Hasil disimpan di MinIO (_r/...) sehingga hanya dibuat sekali, lalu di-cache browser/CDN 1 tahun.
// ---------------------------------------------------------------------
const IMG_WIDTHS = [48, 96, 160, 320, 480, 640, 768, 960, 1280, 1440, 1920];
const imgBucket = () => new S3Client({
  accessKeyId: env.MINIO_ROOT_USER, secretAccessKey: env.MINIO_ROOT_PASSWORD,
  endpoint: env.MINIO_ENDPOINT, bucket: "gym-images",
});
const imgInflight = new Map<string, Promise<Uint8Array>>();
const IMG_HEADERS = {
  "Content-Type": "image/webp",
  "Cache-Control": "public, max-age=31536000, immutable",
  "Access-Control-Allow-Origin": "*",
  "Timing-Allow-Origin": "*",
};

app.get("/img/*", async (c) => {
  const key = decodeURIComponent(c.req.path.slice("/img/".length));
  if (!key || key.includes("..") || key.startsWith("/") || key.startsWith("_r/")) return c.text("Bad path", 400);
  const reqW = Number(c.req.query("w") ?? 1280);
  const w = IMG_WIDTHS.find((x) => x >= reqW) ?? IMG_WIDTHS[IMG_WIDTHS.length - 1];
  const q = Math.min(90, Math.max(40, Math.round(Number(c.req.query("q") ?? 70)) || 70));
  const original = `${(env.STORAGE_PUBLIC_URL || "https://bucket-jwta-production.up.railway.app").replace(/\/$/, "")}/gym-images/${key}`;
  if (/\.(svg|gif)$/i.test(key)) return c.redirect(original, 302);
  const cacheKey = `_r/w${w}q${q}/${key}.webp`;
  const s3 = imgBucket();
  try {
    const cached = s3.file(cacheKey);
    if (await cached.exists()) return new Response(cached.stream(), { headers: IMG_HEADERS });
    let job = imgInflight.get(cacheKey);
    if (!job) {
      job = (async () => {
        const src = new Uint8Array(await s3.file(key).arrayBuffer());
        const out = await sharp(src, { failOn: "none" }).rotate()
          .resize({ width: w, withoutEnlargement: true })
          .webp({ quality: q, effort: 4 }).toBuffer();
        const bytes = new Uint8Array(out);
        await s3.write(cacheKey, bytes, { type: "image/webp" });
        return bytes;
      })().finally(() => imgInflight.delete(cacheKey));
      imgInflight.set(cacheKey, job);
    }
    return new Response(await job, { headers: IMG_HEADERS });
  } catch (e: any) {
    console.error("img error:", key, e?.message ?? e);
    return c.redirect(original, 302);
  }
});

// ---------------------------------------------------------------------
// Sitemap dinamis (diproxy Caddy dari kediaman.co/sitemap.xml) agar artikel/venue baru
// langsung terdaftar tanpa deploy ulang frontend.
// ---------------------------------------------------------------------
const SITEMAP_BASE = "https://kediaman.co";
const SITEMAP_STATIC: [string, string, string][] = [
  ["/", "weekly", "1.0"], ["/landing", "weekly", "0.8"], ["/venue-only", "weekly", "0.8"],
  ["/tentang-kami", "monthly", "0.8"], ["/portfolio", "weekly", "0.8"], ["/paket", "weekly", "0.9"],
  ["/lokasi", "weekly", "0.9"], ["/artikel", "daily", "0.8"],
];
let sitemapCache: { xml: string; at: number } | null = null;
const xmlEscape = (v: string) => v.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&apos;");

app.get("/sitemap.xml", async (c) => {
  if (!sitemapCache || Date.now() - sitemapCache.at > 10 * 60_000) {
    const entries: { path: string; freq: string; pri: string; mod?: string }[] =
      SITEMAP_STATIC.map(([path, freq, pri]) => ({ path, freq, pri }));
    const day = (d: any) => (d ? new Date(d).toISOString().slice(0, 10) : undefined);
    for (const r of await sql`SELECT slug, updated_at FROM articles WHERE is_published AND slug IS NOT NULL ORDER BY published_at DESC NULLS LAST`)
      entries.push({ path: `/artikel/${r.slug}`, freq: "monthly", pri: "0.7", mod: day(r.updated_at) });
    for (const r of await sql`SELECT id, slug, updated_at FROM locations WHERE is_active ORDER BY sort_order`)
      entries.push({ path: `/lokasi/${r.slug || r.id}`, freq: "monthly", pri: "0.8", mod: day(r.updated_at) });
    for (const r of await sql`SELECT slug, updated_at FROM programs WHERE is_active AND slug IS NOT NULL ORDER BY sort_order`)
      entries.push({ path: `/tentang-kami/${r.slug}`, freq: "monthly", pri: "0.7", mod: day(r.updated_at) });
    for (const r of await sql`SELECT slug, updated_at FROM trainers WHERE is_active AND slug IS NOT NULL ORDER BY sort_order`)
      entries.push({ path: `/portfolio/${r.slug}`, freq: "monthly", pri: "0.6", mod: day(r.updated_at) });
    const seen = new Set<string>();
    const urls = entries.filter((e) => !seen.has(e.path) && seen.add(e.path)).map((e) =>
      `  <url>\n    <loc>${xmlEscape(SITEMAP_BASE + e.path)}</loc>\n${e.mod ? `    <lastmod>${e.mod}</lastmod>\n` : ""}    <changefreq>${e.freq}</changefreq>\n    <priority>${e.pri}</priority>\n  </url>`);
    sitemapCache = {
      xml: `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>\n`,
      at: Date.now(),
    };
  }
  return new Response(sitemapCache.xml, {
    headers: { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "public, max-age=600" },
  });
});

// Pengganti fungsi database (supabase.rpc) yang dipakai frontend.
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const INTEREST_EVENTS = new Set(["venue_view", "date_click", "booking_request"]);

app.post("/rest/v1/rpc/:fn", async (c) => {
  const fn = c.req.param("fn");
  const args: any = await c.req.json().catch(() => ({}));
  try {
    if (fn === "track_venue_interest") {
      if (limited(`interest:${ip(c)}`, 60)) throw new ApiError(429, "Too many requests");
      const loc = String(args?._location_id ?? "");
      const type = String(args?._event_type ?? "");
      const visitor = String(args?._visitor_key ?? "").slice(0, 100);
      const date = args?._schedule_date == null || args._schedule_date === "" ? null : String(args._schedule_date);
      if (!UUID_RE.test(loc) || !INTEREST_EVENTS.has(type) || !visitor || (date !== null && !DATE_RE.test(date))) {
        throw new ApiError(400, "Argumen tidak valid", "22023");
      }
      // Satu pengunjung dihitung sekali per hari untuk venue/tanggal/jenis yang sama.
      await sql`
        INSERT INTO venue_interest_events (location_id, event_type, visitor_key, schedule_date)
        SELECT ${loc}::uuid, ${type}, ${visitor}, ${date}::date
        WHERE EXISTS (SELECT 1 FROM locations WHERE id = ${loc}::uuid)
          AND NOT EXISTS (
            SELECT 1 FROM venue_interest_events
            WHERE location_id = ${loc}::uuid AND event_type = ${type} AND visitor_key = ${visitor}
              AND schedule_date IS NOT DISTINCT FROM ${date}::date
              AND created_at > now() - interval '1 day')`;
      return c.json({ data: null, error: null });
    }
    if (fn === "get_venue_interest") {
      const loc = args?._location_id ? String(args._location_id) : null;
      if (loc !== null && !UUID_RE.test(loc)) throw new ApiError(400, "Argumen tidak valid", "22023");
      const [row] = await sql`
        WITH ev AS (
          SELECT * FROM venue_interest_events WHERE (${loc}::uuid IS NULL OR location_id = ${loc}::uuid)
        ), views AS (
          SELECT location_id, count(DISTINCT visitor_key) AS view_count FROM ev
          WHERE event_type = 'venue_view' AND created_at > now() - interval '30 days'
          GROUP BY location_id
        ), dates AS (
          SELECT location_id, schedule_date,
                 count(DISTINCT visitor_key) FILTER (WHERE event_type = 'date_click') AS date_click_count,
                 count(DISTINCT visitor_key) FILTER (WHERE event_type = 'booking_request') AS booking_count
          FROM ev WHERE schedule_date IS NOT NULL AND schedule_date >= current_date
          GROUP BY location_id, schedule_date
        )
        SELECT coalesce(json_agg(json_build_object(
          'location_id', coalesce(d.location_id, v.location_id),
          'schedule_date', d.schedule_date,
          'view_count', coalesce(v.view_count, 0),
          'date_click_count', coalesce(d.date_click_count, 0),
          'booking_count', coalesce(d.booking_count, 0))), '[]'::json) AS data
        FROM views v FULL JOIN dates d ON d.location_id = v.location_id`;
      const data = typeof row.data === "string" ? JSON.parse(row.data) : row.data;
      return c.json({ data, error: null });
    }
    throw new ApiError(404, `Fungsi tidak dikenal: ${fn}`, "PGRST202");
  } catch (e) {
    return fail(c, e);
  }
});

// ---------------------------------------------------------------------
// Newsletter: langganan publik, berhenti langganan, dan akses untuk agent pengirim
// ---------------------------------------------------------------------
const TOKEN_RE = /^[a-f0-9]{64}$/;

app.post("/functions/v1/newsletter-subscribe", async (c) => {
  if (limited(`newsletter:${ip(c)}`, 5, 10 * 60_000)) return c.json({ error: "Terlalu banyak percobaan, coba lagi nanti." }, 429);
  const body: any = await c.req.json().catch(() => ({}));
  // Honeypot: bot biasanya mengisi semua kolom. Balas sukses tanpa menyimpan.
  if (String(body?.company ?? "").trim()) return c.json({ ok: true });
  const email = String(body?.email ?? "").trim().toLowerCase();
  if (!validEmail(email)) return c.json({ error: "Alamat email tidak valid." }, 400);
  const name = String(body?.name ?? "").trim().slice(0, 100) || null;
  const source = String(body?.source ?? "website").trim().slice(0, 50) || "website";
  const token = randomBytes(32).toString("hex");
  try {
    await sql`
      INSERT INTO newsletter_subscribers (email, name, source, unsubscribe_token)
      VALUES (${email}, ${name}, ${source}, ${token})
      ON CONFLICT ((lower(email))) DO UPDATE SET
        status = 'active', unsubscribed_at = NULL, consent_at = now(),
        name = coalesce(EXCLUDED.name, newsletter_subscribers.name)`;
    return c.json({ ok: true });
  } catch (e: any) {
    console.error("newsletter-subscribe:", e?.message ?? e);
    return c.json({ error: "Gagal menyimpan, coba lagi." }, 500);
  }
});

app.post("/functions/v1/newsletter-unsubscribe", async (c) => {
  if (limited(`unsub:${ip(c)}`, 20)) return c.json({ error: "Terlalu banyak percobaan." }, 429);
  const body: any = await c.req.json().catch(() => ({}));
  const token = String(body?.token ?? "").trim().toLowerCase();
  if (!TOKEN_RE.test(token)) return c.json({ ok: false }, 400);
  const r = await sql`UPDATE newsletter_subscribers SET status = 'unsubscribed', unsubscribed_at = now()
                      WHERE unsubscribe_token = ${token} RETURNING id`;
  return c.json({ ok: r.length > 0 });
});

/** Agent pengirim newsletter memakai header x-agent-key = env NEWSLETTER_AGENT_KEY. */
function agentAuthorized(c: any): boolean {
  const expected = env.NEWSLETTER_AGENT_KEY;
  const given = c.req.header("x-agent-key") ?? "";
  if (!expected || !given) return false;
  const a = Buffer.from(expected), b = Buffer.from(given);
  return a.length === b.length && timingSafeEqual(a, b);
}

app.get("/functions/v1/newsletter-subscribers", async (c) => {
  if (!env.NEWSLETTER_AGENT_KEY) return c.json({ error: "Newsletter agent belum dikonfigurasi" }, 503);
  if (limited(`agent:${ip(c)}`, 30)) return c.json({ error: "Too many requests" }, 429);
  if (!agentAuthorized(c)) return c.json({ error: "Unauthorized" }, 401);
  const limit = Math.min(500, Math.max(1, Number(c.req.query("limit") ?? 500) || 500));
  const after = c.req.query("after");
  const afterId = after && UUID_RE.test(after) ? after : null;
  const rows = await sql`
    SELECT id, email, name, unsubscribe_token, last_sent_at, created_at FROM newsletter_subscribers
    WHERE status = 'active' AND (${afterId}::uuid IS NULL OR id > ${afterId}::uuid)
    ORDER BY id LIMIT ${limit}`;
  return c.json({ data: rows, next: rows.length === limit ? rows[rows.length - 1].id : null });
});

app.post("/functions/v1/newsletter-mark-sent", async (c) => {
  if (!env.NEWSLETTER_AGENT_KEY) return c.json({ error: "Newsletter agent belum dikonfigurasi" }, 503);
  if (limited(`agent:${ip(c)}`, 30)) return c.json({ error: "Too many requests" }, 429);
  if (!agentAuthorized(c)) return c.json({ error: "Unauthorized" }, 401);
  const body: any = await c.req.json().catch(() => ({}));
  const ids = (Array.isArray(body?.ids) ? body.ids : []).map(String).filter((x: string) => UUID_RE.test(x)).slice(0, 1000);
  if (!ids.length) return c.json({ updated: 0 });
  const r = await sql`UPDATE newsletter_subscribers SET last_sent_at = now() WHERE id = ANY(string_to_array(${ids.join(",")}, ',')::uuid[]) RETURNING id`;
  return c.json({ updated: r.length });
});

// Pengganti edge function track-booking
app.post("/functions/v1/track-booking", async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const email = String(body?.email ?? "").trim().toLowerCase();
  if (!validEmail(email)) return c.json({ error: "Invalid email" }, 400);
  if (limited(`track:${ip(c)}:${email}`, 10)) return c.json({ error: "Too many requests, please try again later." }, 429);
  const rows = await sql`
    SELECT coalesce(json_agg(x ORDER BY x.created_at DESC), '[]'::json) AS data FROM (
      SELECT b.id, b.location_id, b.booking_date, b.start_time, b.end_time, b.contact_name, b.contact_email,
             b.event_name, b.event_type, b.guest_count, b.notes, b.status, b.admin_notes, b.created_at,
             (SELECT json_build_object('name', l.name) FROM locations l WHERE l.id = b.location_id) AS locations
      FROM ballroom_bookings b WHERE lower(b.contact_email) = ${email}
    ) x`;
  const data = typeof rows[0].data === "string" ? JSON.parse(rows[0].data) : rows[0].data;
  return c.json({ bookings: data });
});

// Pengganti edge function external-deals (data "deals" dari Supabase eksternal)
app.all("/functions/v1/external-deals", async (c) => {
  const url = env.EXTERNAL_SUPABASE_URL, key = env.EXTERNAL_SUPABASE_ANON_KEY;
  if (!url || !key) return c.json({ deals: [] });
  try {
    const res = await fetch(`${url.replace(/\/$/, "")}/rest/v1/deals?select=*&order=created_at.desc`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return c.json({ deals: await res.json() });
  } catch (e: any) {
    console.error("external-deals error:", e?.message);
    return c.json({ error: "Failed to fetch deals from external API" }, 500);
  }
});

// Pengganti edge function chat (API kompatibel OpenAI, streaming SSE)
function buildSystemPrompt(locations: any[], programs: any[], settings: any) {
  const locationInfo = locations.map((l) => {
    const parts = [`- **${l.name}**`];
    if (l.address) parts.push(`  Alamat: ${l.address}`);
    if (l.phone) parts.push(`  Telepon: ${l.phone}`);
    if (l.email) parts.push(`  Email: ${l.email}`);
    if (l.category) parts.push(`  Area: ${l.category}`);
    if (Array.isArray(l.facilities) && l.facilities.length) parts.push(`  Fasilitas: ${l.facilities.join(", ")}`);
    if (l.ballroom_layout_capacity) parts.push(`  Kapasitas Ballroom: ${l.ballroom_layout_capacity}`);
    if (l.ballroom_layout_dimensions) parts.push(`  Dimensi Ballroom: ${l.ballroom_layout_dimensions}`);
    if (l.loading_area_capacity) parts.push(`  Kapasitas Loading Area: ${l.loading_area_capacity}`);
    if (l.is_coming_soon) parts.push(`  Status: Coming Soon`);
    return parts.join("\n");
  }).join("\n\n");
  const programInfo = programs.map((p) => {
    const parts = [`- **${p.name ?? "Program"}**`];
    if (p.category) parts.push(` (${p.category})`);
    if (p.description) parts.push(`: ${String(p.description).substring(0, 150)}`);
    return parts.join("");
  }).join("\n");
  const siteName = settings?.site_name || "Kediaman Corp";
  return `Kamu adalah asisten virtual ${siteName}, venue operator terbaik di Indonesia. Jawab pertanyaan pengunjung dengan ramah dan informatif dalam Bahasa Indonesia.

## Informasi Perusahaan
- Nama: ${siteName}
${settings?.tagline ? `- Tagline: ${settings.tagline}` : ""}
${settings?.phone ? `- Telepon: ${settings.phone}` : ""}
${settings?.email ? `- Email: ${settings.email}` : ""}
${settings?.address ? `- Alamat Pusat: ${settings.address}` : ""}

## Lokasi Venue Kami
${locationInfo || "Belum ada data lokasi."}

## Program & Layanan
${programInfo || "Belum ada data program."}

## Panduan Menjawab
- Jawab singkat, ramah, dan to the point (maks 3-4 kalimat)
- Gunakan data lokasi dan program di atas untuk menjawab pertanyaan spesifik
- Jika ditanya harga, katakan bahwa harga bervariasi tergantung tanggal dan kebutuhan, sarankan hubungi WhatsApp untuk penawaran
- Jika pertanyaan di luar topik venue/event, arahkan kembali ke layanan ${siteName}
- Jika user ingin booking, konsultasi detail, atau butuh bantuan manusia, sarankan untuk menghubungi via WhatsApp
- Gunakan emoji secukupnya untuk kesan ramah
- Jangan menyebut bahwa kamu adalah AI/bot kecuali ditanya langsung`;
}

app.post("/functions/v1/chat", async (c) => {
  if (!env.LLM_API_KEY) return c.json({ error: "Layanan chat sedang tidak tersedia." }, 503);
  if (limited(`chat:${ip(c)}`, 20)) return c.json({ error: "Terlalu banyak permintaan, coba lagi nanti." }, 429);
  const { messages } = await c.req.json().catch(() => ({ messages: [] }));
  const safeMessages = (Array.isArray(messages) ? messages : []).slice(-20)
    .filter((m: any) => (m?.role === "user" || m?.role === "assistant") && typeof m.content === "string")
    .map((m: any) => ({ role: m.role, content: m.content.slice(0, 4000) }));
  const [locations, programs, [settings]] = await Promise.all([
    sql`SELECT name, address, phone, email, category, facilities, ballroom_layout_capacity, ballroom_layout_dimensions,
               loading_area_capacity, is_coming_soon FROM locations WHERE is_active ORDER BY sort_order`,
    sql`SELECT name, description, category FROM programs WHERE is_active ORDER BY sort_order`,
    sql`SELECT site_name, tagline, phone, email, address FROM site_settings LIMIT 1`,
  ]);
  const res = await fetch(`${(env.LLM_API_URL || "https://api.openai.com/v1").replace(/\/$/, "")}/chat/completions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${env.LLM_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: env.LLM_MODEL || "gpt-4o-mini",
      messages: [{ role: "system", content: buildSystemPrompt([...locations], [...programs], settings) }, ...safeMessages],
      stream: true,
    }),
  });
  if (!res.ok || !res.body) {
    console.error("LLM error:", res.status, await res.text().catch(() => ""));
    const msg = res.status === 429 ? "Terlalu banyak permintaan, coba lagi nanti." : "Gagal menghubungi AI";
    return c.json({ error: msg }, res.status === 429 ? 429 : 500);
  }
  return new Response(res.body, {
    headers: { "Content-Type": "text/event-stream", "Access-Control-Allow-Origin": "*" },
  });
});

// ---------------------------------------------------------------------
// 6. Start
// ---------------------------------------------------------------------
async function startup() {
  await sql.unsafe(BOOTSTRAP).simple();
  await loadSchema();
  console.log(`Schema dimuat: ${Object.keys(schema).length} tabel.`);

  if (env.ADMIN_EMAIL && env.ADMIN_PASSWORD) {
    const hash = await Bun.password.hash(env.ADMIN_PASSWORD);
    const r = await sql`UPDATE users SET password_hash = ${hash}
                        WHERE lower(email) = lower(${env.ADMIN_EMAIL}) AND password_hash IS NULL RETURNING email`;
    if (r.length) console.log(`Password admin diset untuk ${r[0].email}.`);
  }

  // Impor sekali pakai dari Supabase/Lovable lama untuk tabel yang belum diekspor.
  if (env.IMPORT_SUPABASE_URL && env.IMPORT_SUPABASE_KEY) {
    for (const t of ["features", "testimonials", "venue_sessions", "ballroom_bookings"]) {
      try {
        const [{ n }] = await sql.unsafe(`SELECT count(*)::int AS n FROM ${q(t)}`);
        if (n > 0) { console.log(`Impor ${t}: dilewati (sudah berisi ${n} baris).`); continue; }
        const res = await fetch(`${env.IMPORT_SUPABASE_URL.replace(/\/$/, "")}/rest/v1/${t}?select=*`, {
          headers: { apikey: env.IMPORT_SUPABASE_KEY, Authorization: `Bearer ${env.IMPORT_SUPABASE_KEY}` },
        });
        if (!res.ok) { console.log(`Impor ${t}: HTTP ${res.status}`); continue; }
        const rows = await res.json();
        if (rows.length) {
          await sql.unsafe(`INSERT INTO ${q(t)} SELECT * FROM jsonb_populate_recordset(NULL::${q(t)}, $1::text::jsonb)`, [JSON.stringify(rows)]);
        }
        console.log(`Impor ${t}: ${rows.length} baris.`);
      } catch (e: any) {
        console.log(`Impor ${t} gagal: ${e?.message ?? e}`);
      }
    }
  }
}

async function selfTest() {
  const call = async (path: string, body: unknown, token?: string) => {
    const res = await app.fetch(new Request(`http://local${path}`, {
      method: "POST",
      headers: { "content-type": "application/json", ...(token ? { authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify(body),
    }));
    return { status: res.status, json: (await res.json()) as any };
  };
  const out: string[] = [];
  try {
    const [{ t }] = await sql.unsafe("SELECT jsonb_typeof($1::text::jsonb) AS t", ["[1,2]"]);
    out.push(`jsonb=${t}`);
    const a = await call("/rest/v1/query", { table: "trainers", action: "select", select: "*, locations(name)", limit: 1, filters: [["location_id", "neq", null]] });
    const tr = a.json.data?.[0];
    out.push(`publik-baca=${a.status} images=${Array.isArray(tr?.images) ? "array" : typeof tr?.images} embed=${tr?.locations?.name ? "ok" : "KOSONG"}`);
    const b = await call("/rest/v1/query", { table: "user_roles", action: "select" });
    out.push(`anon-user_roles=${b.status}`);
    const w = await call("/rest/v1/query", { table: "hero_slides", action: "update", values: { title: "x" }, filters: [["id", "eq", "00000000-0000-0000-0000-000000000000"]] });
    out.push(`anon-tulis=${w.status}`);
    const sl = await call("/rest/v1/query", { table: "trainers", action: "select", select: "id,slug,name,locations(id, name, slug)", limit: 2 });
    out.push(`slug=${sl.status} ${JSON.stringify((sl.json.data ?? []).map((x: any) => x.slug))} ${sl.json.error?.message ?? ""}`);
    const [{ id: anyLoc }] = await sql`SELECT id FROM locations LIMIT 1`;
    const tv = await call("/rest/v1/rpc/track_venue_interest", { _location_id: anyLoc, _event_type: "venue_view", _visitor_key: "self-test" });
    const gv = await call("/rest/v1/rpc/get_venue_interest", { _location_id: anyLoc });
    await sql`DELETE FROM venue_interest_events WHERE visitor_key = 'self-test'`;
    out.push(`rpc track=${tv.status} get=${gv.status} rows=${gv.json.data?.length ?? gv.json.error?.message}`);
    const nsEmail = `self-test+${Date.now()}@kediaman.invalid`;
    const ns = await call("/functions/v1/newsletter-subscribe", { email: nsEmail, source: "self-test" });
    const [nsRow] = await sql`SELECT unsubscribe_token FROM newsletter_subscribers WHERE lower(email) = ${nsEmail}`;
    const nu = await call("/functions/v1/newsletter-unsubscribe", { token: nsRow?.unsubscribe_token ?? "" });
    const na = await call("/rest/v1/query", { table: "newsletter_subscribers", action: "select", select: "id" });
    await sql`DELETE FROM newsletter_subscribers WHERE lower(email) = ${nsEmail}`;
    out.push(`newsletter sub=${ns.status} unsub=${nu.json.ok} anon-baca=${na.status}`);
    const pr = await call("/rest/v1/query", { table: "ballroom_schedules", action: "select", select: "id,promo_type,promo_label,promo_expires_at", limit: 1 });
    out.push(`promo=${pr.status}`);
    const smRes = await app.fetch(new Request("http://local/sitemap.xml"));
    const smText = await smRes.text();
    out.push(`sitemap=${smRes.status} ${(smText.match(/<loc>/g) || []).length}url`);
    const s = await call("/rest/v1/query", { table: "ballroom_schedules", action: "select", select: "schedule_date,start_time", limit: 1 });
    out.push(`tanggal=${JSON.stringify(s.json.data?.[0] ?? null)}`);
    if (env.ADMIN_EMAIL && env.ADMIN_PASSWORD) {
      const l = await call("/auth/v1/token", { email: env.ADMIN_EMAIL, password: env.ADMIN_PASSWORD });
      const tok = l.json.data?.access_token;
      const r = await call("/rest/v1/query", { table: "user_roles", action: "select", select: "role", filters: [["role", "eq", "admin"]], single: "maybe" }, tok);
      out.push(`login-admin=${l.status} role=${r.json.data?.role ?? r.json.error?.message}`);
      const all = await call("/rest/v1/query", { table: "programs", action: "select", select: "id" }, tok);
      const pub = await call("/rest/v1/query", { table: "programs", action: "select", select: "id" });
      out.push(`programs admin=${all.json.data?.length} publik=${pub.json.data?.length}`);
    }
    const s3 = new S3Client({ accessKeyId: env.MINIO_ROOT_USER, secretAccessKey: env.MINIO_ROOT_PASSWORD, endpoint: env.MINIO_ENDPOINT, bucket: "gym-images" });
    const [{ url }] = await sql`SELECT photo_url AS url FROM trainers WHERE photo_url IS NOT NULL LIMIT 1`;
    const key = String(url).split("/gym-images/")[1];
    out.push(`minio=${key ? await s3.exists(key) : "tanpa-sampel"}`);
    if (key) {
      const t0 = Date.now();
      const ir = await app.fetch(new Request(`http://local/img/${key}?w=640&q=70`));
      const ib = await ir.arrayBuffer();
      out.push(`img=${ir.status} ${ir.headers.get("content-type")} ${ib.byteLength}B ${Date.now() - t0}ms`);
    }
  } catch (e: any) {
    out.push(`ERROR ${e?.message ?? e}`);
  }
  console.log("SELF-TEST: " + out.join(" | "));
}

if (import.meta.main !== false && env.DATABASE_URL) {
  await startup();
  await selfTest();
  Bun.serve({ port: Number(env.PORT ?? 3000), fetch: app.fetch, idleTimeout: 120, maxRequestBodySize: 200 * 1024 * 1024 });
  console.log("kediaman-api siap.");
}
