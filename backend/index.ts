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
const HIDDEN_TABLES = new Set(["users"]);

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
