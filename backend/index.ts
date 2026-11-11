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
//   ANTHROPIC_API_KEY [+ CHAT_MODEL]         (opsional: chat website dengan Claude)
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
-- Perbaikan link CTA lama "/locations" (404) → "/lokasi"
DO $fixcta$ BEGIN
  UPDATE about_sections SET content = jsonb_set(content, '{button_link}', to_jsonb(regexp_replace(content->>'button_link', '/locations', '/lokasi')))
    WHERE content->>'button_link' ~ '/locations(/|$)';
EXCEPTION WHEN others THEN NULL; END $fixcta$;
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
-- Form booking ringkas (nama, HP, venue, pesan): tanggal, email, dan nama acara jadi opsional
ALTER TABLE ballroom_bookings ALTER COLUMN booking_date DROP NOT NULL;
ALTER TABLE ballroom_bookings ALTER COLUMN contact_email DROP NOT NULL;
ALTER TABLE ballroom_bookings ALTER COLUMN event_name DROP NOT NULL;

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

-- =====================================================================
-- Loyalty & referral ("Kediaman Rewards")
-- =====================================================================
CREATE TABLE IF NOT EXISTS loyalty_settings (
  id integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  is_enabled boolean NOT NULL DEFAULT true,
  program_name text NOT NULL DEFAULT 'Kediaman Rewards',
  referral_points integer NOT NULL DEFAULT 500 CHECK (referral_points >= 0),
  booking_points integer NOT NULL DEFAULT 200 CHECK (booking_points >= 0),
  referee_benefit text,
  terms text,
  updated_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO loyalty_settings (id, referee_benefit, terms) VALUES (1,
  'Teman yang Anda ajak mendapat prioritas penawaran dan bonus spesial dari tim kami.',
  'Poin diberikan setelah booking dikonfirmasi tim Kediaman. Poin tidak dapat diuangkan. Penukaran hadiah diproses tim dalam 3x24 jam kerja dan tergantung ketersediaan.')
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS loyalty_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  phone text NOT NULL,
  referral_code text NOT NULL UNIQUE,
  referred_by uuid REFERENCES loyalty_members(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE OR REPLACE TRIGGER loyalty_members_set_updated_at BEFORE UPDATE ON loyalty_members
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS loyalty_rewards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  image_url text,
  points_cost integer NOT NULL CHECK (points_cost > 0),
  stock integer CHECK (stock IS NULL OR stock >= 0),
  terms text,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE OR REPLACE TRIGGER loyalty_rewards_set_updated_at BEFORE UPDATE ON loyalty_rewards
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS loyalty_redemptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id uuid NOT NULL REFERENCES loyalty_members(id) ON DELETE CASCADE,
  reward_id uuid REFERENCES loyalty_rewards(id) ON DELETE SET NULL,
  reward_name text NOT NULL,
  points_cost integer NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'fulfilled', 'rejected')),
  admin_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS loyalty_redemptions_member_idx ON loyalty_redemptions (member_id);
CREATE OR REPLACE TRIGGER loyalty_redemptions_set_updated_at BEFORE UPDATE ON loyalty_redemptions
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Buku besar poin: saldo = SUM(points). Tidak pernah diubah langsung oleh client.
CREATE TABLE IF NOT EXISTS loyalty_points (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id uuid NOT NULL REFERENCES loyalty_members(id) ON DELETE CASCADE,
  points integer NOT NULL,
  type text NOT NULL CHECK (type IN ('referral', 'booking', 'redeem', 'refund', 'adjust')),
  booking_id uuid REFERENCES ballroom_bookings(id) ON DELETE SET NULL,
  redemption_id uuid REFERENCES loyalty_redemptions(id) ON DELETE SET NULL,
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS loyalty_points_member_idx ON loyalty_points (member_id, created_at);
CREATE UNIQUE INDEX IF NOT EXISTS loyalty_points_award_once ON loyalty_points (type, booking_id)
  WHERE booking_id IS NOT NULL AND type IN ('referral', 'booking');

ALTER TABLE ballroom_bookings ADD COLUMN IF NOT EXISTS referral_code text;

-- Poin otomatis saat booking dikonfirmasi admin (approved/paid/completed); dicabut lagi bila status dibatalkan.
CREATE OR REPLACE FUNCTION kdm_norm_phone(p text) RETURNS text AS $$
  SELECT regexp_replace(regexp_replace(coalesce(p, ''), '[^0-9]', '', 'g'), '^62', '0')
$$ LANGUAGE sql IMMUTABLE;

CREATE OR REPLACE FUNCTION kdm_loyalty_award() RETURNS trigger AS $$
DECLARE
  st loyalty_settings;
  owner loyalty_members;
  ref loyalty_members;
  ok_new boolean := NEW.status IN ('approved', 'paid', 'completed');
  ok_old boolean := TG_OP = 'UPDATE' AND OLD.status IN ('approved', 'paid', 'completed');
BEGIN
  IF ok_new AND NOT ok_old THEN
    SELECT * INTO st FROM loyalty_settings WHERE id = 1;
    IF NOT FOUND OR NOT st.is_enabled THEN RETURN NEW; END IF;
    IF NEW.user_id IS NOT NULL THEN
      SELECT * INTO owner FROM loyalty_members WHERE user_id = NEW.user_id;
    END IF;
    IF owner.id IS NOT NULL AND st.booking_points > 0 THEN
      INSERT INTO loyalty_points (member_id, points, type, booking_id, description)
      VALUES (owner.id, st.booking_points, 'booking', NEW.id, 'Booking dikonfirmasi')
      ON CONFLICT DO NOTHING;
    END IF;
    IF NEW.referral_code IS NOT NULL AND NEW.referral_code <> '' THEN
      SELECT * INTO ref FROM loyalty_members WHERE referral_code = upper(NEW.referral_code);
    ELSIF owner.referred_by IS NOT NULL THEN
      SELECT * INTO ref FROM loyalty_members WHERE id = owner.referred_by;
    END IF;
    IF ref.id IS NOT NULL AND st.referral_points > 0
       AND ref.id IS DISTINCT FROM owner.id
       AND kdm_norm_phone(ref.phone) <> kdm_norm_phone(NEW.contact_phone) THEN
      INSERT INTO loyalty_points (member_id, points, type, booking_id, description)
      VALUES (ref.id, st.referral_points, 'referral', NEW.id,
              'Referral: booking ' || split_part(trim(NEW.contact_name), ' ', 1) || ' dikonfirmasi')
      ON CONFLICT DO NOTHING;
    END IF;
  ELSIF ok_old AND NOT ok_new THEN
    DELETE FROM loyalty_points WHERE booking_id = NEW.id AND type IN ('referral', 'booking');
  END IF;
  RETURN NEW;
END $$ LANGUAGE plpgsql;
CREATE OR REPLACE TRIGGER ballroom_bookings_loyalty AFTER INSERT OR UPDATE OF status ON ballroom_bookings
  FOR EACH ROW EXECUTE FUNCTION kdm_loyalty_award();

-- Penukaran ditolak admin -> poin & stok dikembalikan (dan sebaliknya bila status dipulihkan).
CREATE OR REPLACE FUNCTION kdm_loyalty_redemption() RETURNS trigger AS $$
BEGIN
  IF NEW.status = 'rejected' AND OLD.status <> 'rejected' THEN
    INSERT INTO loyalty_points (member_id, points, type, redemption_id, description)
    VALUES (NEW.member_id, NEW.points_cost, 'refund', NEW.id, 'Poin dikembalikan: ' || NEW.reward_name);
    UPDATE loyalty_rewards SET stock = stock + 1 WHERE id = NEW.reward_id AND stock IS NOT NULL;
  ELSIF OLD.status = 'rejected' AND NEW.status <> 'rejected' THEN
    INSERT INTO loyalty_points (member_id, points, type, redemption_id, description)
    VALUES (NEW.member_id, -NEW.points_cost, 'redeem', NEW.id, 'Tukar: ' || NEW.reward_name);
    UPDATE loyalty_rewards SET stock = stock - 1 WHERE id = NEW.reward_id AND stock IS NOT NULL AND stock > 0;
  END IF;
  RETURN NEW;
END $$ LANGUAGE plpgsql;
CREATE OR REPLACE TRIGGER loyalty_redemptions_status AFTER UPDATE OF status ON loyalty_redemptions
  FOR EACH ROW EXECUTE FUNCTION kdm_loyalty_redemption();

-- =====================================================================
-- Karier: lowongan (publik), pelamar & berkas CV (khusus admin)
-- =====================================================================
CREATE TABLE IF NOT EXISTS jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text,
  department text,
  location_text text,
  employment_type text NOT NULL DEFAULT 'Full-time',
  work_mode text NOT NULL DEFAULT 'On-site',
  experience_level text,
  salary_min numeric(14,0),
  salary_max numeric(14,0),
  show_salary boolean NOT NULL DEFAULT false,
  summary text,
  description text,
  responsibilities jsonb NOT NULL DEFAULT '[]'::jsonb,
  requirements jsonb NOT NULL DEFAULT '[]'::jsonb,
  benefits jsonb NOT NULL DEFAULT '[]'::jsonb,
  deadline date,
  is_active boolean NOT NULL DEFAULT true,
  is_featured boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE OR REPLACE TRIGGER jobs_fill_slug BEFORE INSERT OR UPDATE ON jobs FOR EACH ROW EXECUTE FUNCTION kdm_fill_slug();
CREATE UNIQUE INDEX IF NOT EXISTS jobs_slug_key ON jobs (slug);
CREATE OR REPLACE TRIGGER jobs_set_updated_at BEFORE UPDATE ON jobs FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS job_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid REFERENCES jobs(id) ON DELETE SET NULL,
  job_title text NOT NULL,
  full_name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  domicile text,
  linkedin_url text,
  portfolio_url text,
  expected_salary text,
  available_from text,
  cover_letter text,
  has_cv boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'review', 'interview', 'offer', 'hired', 'rejected')),
  rating integer CHECK (rating IS NULL OR rating BETWEEN 1 AND 5),
  admin_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS job_applications_job_idx ON job_applications (job_id, created_at DESC);
CREATE OR REPLACE TRIGGER job_applications_set_updated_at BEFORE UPDATE ON job_applications FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- CV disimpan di database (privat), bukan di bucket publik; hanya bisa diunduh admin lewat endpoint khusus.
CREATE TABLE IF NOT EXISTS job_application_files (
  application_id uuid PRIMARY KEY REFERENCES job_applications(id) ON DELETE CASCADE,
  filename text NOT NULL,
  mime text NOT NULL,
  size integer NOT NULL,
  data bytea NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
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
  "venue_packages", "faqs", "venue_reviews", "loyalty_rewards", "loyalty_settings", "jobs",
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
  loyalty_rewards: ["is_active", "eq", true],
  jobs: ["is_active", "eq", true],
};

const BOOKING_FIELDS = new Set([
  "location_id", "booking_date", "start_time", "end_time", "contact_name", "contact_email", "contact_phone",
  "event_name", "event_type", "guest_count", "notes", "session_id", "package_id", "package_name", "user_id",
  "referral_code",
]);

/** Validasi server untuk booking dari pengunjung (jangan percaya validasi di browser saja). */
function validatePublicBooking(v: any) {
  const bad = (msg: string) => { throw new ApiError(400, msg, "22023"); };
  if (!v || typeof v !== "object" || Array.isArray(v)) bad("Data booking tidak valid");
  for (const k of Object.keys(v)) if (!BOOKING_FIELDS.has(k)) bad(`Kolom tidak diizinkan: ${k}`);
  const str = (k: string, min: number, max: number, required = false) => {
    const val = v[k];
    if (val == null || val === "") { if (required) bad(`${k} wajib diisi`); return; }
    if (typeof val !== "string") bad(`${k} tidak valid`);
    const t = val.trim();
    if (t.length < min || t.length > max) bad(`${k} harus ${min}–${max} karakter`);
  };
  str("contact_name", 2, 100, true);
  str("contact_phone", 8, 20, true);
  const digits = String(v.contact_phone).replace(/\D/g, "");
  if (digits.length < 8 || digits.length > 15 || !/^[+\d\s().-]+$/.test(String(v.contact_phone))) bad("Nomor HP tidak valid");
  if (typeof v.location_id !== "string" || !UUID_RE.test(v.location_id)) bad("Venue wajib dipilih");
  str("notes", 0, 1000);
  str("event_name", 0, 200);
  str("event_type", 0, 50);
  str("package_name", 0, 120);
  if (v.contact_email != null && v.contact_email !== "" && !validEmail(String(v.contact_email))) bad("Email tidak valid");
  if (v.booking_date != null && v.booking_date !== "" && !DATE_RE.test(String(v.booking_date))) bad("Tanggal tidak valid");
  for (const k of ["session_id", "package_id"]) if (v[k] != null && v[k] !== "" && !UUID_RE.test(String(v[k]))) bad(`${k} tidak valid`);
  for (const k of ["start_time", "end_time"]) if (v[k] != null && v[k] !== "" && !/^\d{2}:\d{2}(:\d{2})?$/.test(String(v[k]))) bad(`${k} tidak valid`);
  if (v.referral_code != null && v.referral_code !== "") {
    if (typeof v.referral_code !== "string" || !/^[A-Za-z0-9]{6,12}$/.test(v.referral_code.trim())) bad("Kode referral tidak valid");
    v.referral_code = v.referral_code.trim().toUpperCase();
  }
  if (v.guest_count != null && (!Number.isInteger(v.guest_count) || v.guest_count < 1 || v.guest_count > 10000)) bad("Jumlah tamu tidak valid");
}

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
      if (!values || values.length !== 1) deny();
      for (const v of values ?? []) {
        validatePublicBooking(v);
        if (v.user_id != null && v.user_id !== ctx.userId) deny();
        // Client yang login: booking otomatis tertaut ke akunnya (untuk poin loyalty)
        if (ctx.userId) v.user_id = ctx.userId;
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
const HIDDEN_TABLES = new Set(["users", "venue_interest_events", "job_application_files"]);

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

// Rate limiter in-memory (fixed window). Kunci = jenis aksi + IP (atau identitas lain).
// Reset saat server restart; cukup untuk menahan bot/brute-force tanpa layanan tambahan.
const hits = new Map<string, { n: number; reset: number }>();
function limited(key: string, max: number, windowMs = 60_000) {
  const now = Date.now();
  const e = hits.get(key);
  if (!e || e.reset < now) {
    if (hits.size > 200_000) hits.clear(); // pengaman memori bila diserang dari banyak IP
    hits.set(key, { n: 1, reset: now + windowMs });
    return false;
  }
  e.n++;
  return e.n > max;
}
setInterval(() => {
  const now = Date.now();
  for (const [k, e] of hits) if (e.reset < now) hits.delete(k);
}, 60_000);
const validEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e) && e.length <= 255;

// ---------------------------------------------------------------------
// 5. App
// ---------------------------------------------------------------------
const app = new Hono();
app.use("*", cors({ origin: "*", allowHeaders: ["authorization", "content-type", "x-upsert", "cache-control"], maxAge: 86400 }));
// Railway mengisi X-Real-IP dengan IP asli pengunjung. Entri pertama X-Forwarded-For bisa dipalsukan klien,
// jadi bila X-Real-IP tidak ada, pakai entri terakhir (yang ditambahkan proxy).
const ip = (c: any): string =>
  c.req.header("x-real-ip")?.trim() || c.req.header("x-forwarded-for")?.split(",").pop()?.trim() || "unknown";
const tooMany = (c: any, message = "Terlalu banyak permintaan. Coba lagi sebentar lagi.", retryAfter = 60) => {
  c.header("Retry-After", String(retryAfter));
  return c.json(c.req.path.startsWith("/rest/") ? { data: null, error: { message, code: "RATE_LIMITED" } } : { error: message }, 429);
};

// Batas umum per IP untuk semua endpoint (gambar diberi kuota lebih besar karena satu halaman memuat banyak foto).
app.use("*", async (c, next) => {
  if (c.req.method === "OPTIONS") return next();
  const isImg = c.req.path.startsWith("/img/");
  if (limited(`global:${isImg ? "img" : "api"}:${ip(c)}`, isImg ? 600 : 300)) return tooMany(c);
  await next();
});
const fail = (c: any, e: any) => {
  const status = e instanceof ApiError ? e.status : 400;
  if (!(e instanceof ApiError)) console.error("query error:", e?.message ?? e);
  return c.json({ data: null, error: { message: e?.message ?? String(e), code: e?.code ?? e?.errno ?? "ERROR" } }, status);
};

app.get("/", (c) => c.json({ ok: true, service: "kediaman-api" }));

app.post("/rest/v1/query", async (c) => {
  try {
    const ctx = await getCtx(c.req.header("authorization"));
    const raw = await c.req.text();
    if (raw.length > 64 * 1024 && !ctx.isAdmin) throw new ApiError(413, "Permintaan terlalu besar", "PAYLOAD_TOO_LARGE");
    const body = JSON.parse(raw || "{}") as QueryReq;
    if (!ctx.isAdmin) {
      const who = ip(c);
      // Pembacaan data publik (daftar venue, pencarian venue/area, jadwal, dll.)
      if (body.action === "select" && limited(`query:${who}`, 240)) return tooMany(c);
      // Kirim form booking: maks 5 per 10 menit dan 20 per hari per IP
      if (body.action === "insert" && body.table === "ballroom_bookings" &&
          (limited(`booking:${who}`, 5, 10 * 60_000) || limited(`booking-day:${who}`, 20, 24 * 60 * 60_000))) {
        return tooMany(c, "Terlalu banyak permintaan booking dari perangkat ini. Coba lagi dalam beberapa menit atau hubungi kami via WhatsApp.", 600);
      }
      if (body.action !== "select" && limited(`write:${who}`, 30)) return tooMany(c);
    }
    return c.json({ data: await runQuery(body, ctx), error: null });
  } catch (e) {
    return fail(c, e);
  }
});

let dummyHashPromise: Promise<string> | null = null;
const dummyHash = () => (dummyHashPromise ??= Bun.password.hash("kdm-dummy-password"));

app.post("/auth/v1/token", async (c) => {
  const { email, password } = await c.req.json().catch(() => ({}));
  const em = String(email ?? "").trim().toLowerCase();
  if (limited(`login:${ip(c)}`, 10)) return c.json({ error: { message: "Terlalu banyak percobaan, coba lagi dalam 1 menit." } }, 429);
  // Batas per akun juga, supaya password satu email tidak bisa ditebak dari banyak IP
  if (em && limited(`login-email:${em}`, 10, 15 * 60_000)) return c.json({ error: { message: "Terlalu banyak percobaan untuk akun ini, coba lagi dalam 15 menit." } }, 429);
  const [u] = await sql`SELECT * FROM users WHERE lower(email) = ${em}`;
  // Tetap verifikasi hash palsu bila akun tidak ada, agar waktu respons tidak membocorkan email terdaftar
  const ok = u?.password_hash
    ? await Bun.password.verify(String(password ?? ""), u.password_hash)
    : (await Bun.password.verify("x", await dummyHash()), false);
  if (!ok) return c.json({ error: { message: "Invalid login credentials" } }, 400);
  return c.json({ data: await makeSession(u), error: null });
});

app.post("/auth/v1/signup", async (c) => {
  const { email, password } = await c.req.json().catch(() => ({}));
  const em = String(email ?? "").trim().toLowerCase();
  if (limited(`signup:${ip(c)}`, 5)) return c.json({ error: { message: "Terlalu banyak percobaan, coba lagi nanti." } }, 429);
  if (!validEmail(em)) return c.json({ error: { message: "Email tidak valid" } }, 400);
  if (String(password ?? "").length < 8) return c.json({ error: { message: "Password minimal 8 karakter" } }, 400);
  if (String(password ?? "").length > 200) return c.json({ error: { message: "Password terlalu panjang" } }, 400);
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
  ["/lokasi", "weekly", "0.9"], ["/artikel", "daily", "0.8"], ["/karir", "weekly", "0.6"], ["/aplikasi", "monthly", "0.5"],
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
    for (const r of await sql`SELECT slug, updated_at FROM jobs WHERE is_active AND slug IS NOT NULL AND (deadline IS NULL OR deadline >= CURRENT_DATE)`)
      entries.push({ path: `/karir/${r.slug}`, freq: "weekly", pri: "0.6", mod: day(r.updated_at) });
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

// ---------------------------------------------------------------------
// Loyalty & referral (client login email + password)
// ---------------------------------------------------------------------
const REF_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
function makeReferralCode(name: string): string {
  const prefix = (name.normalize("NFKD").replace(/[^A-Za-z]/g, "").toUpperCase() + "KDM").slice(0, 4);
  const bytes = randomBytes(4);
  return prefix + Array.from(bytes, (b) => REF_ALPHABET[b % REF_ALPHABET.length]).join("");
}

async function loyaltyUser(c: any): Promise<string> {
  const ctx = await getCtx(c.req.header("authorization"));
  if (!ctx.userId) throw new ApiError(401, "Silakan masuk dulu", "UNAUTHENTICATED");
  return ctx.userId;
}
const loyaltyFail = (c: any, e: any) => {
  const status = e instanceof ApiError ? e.status : 500;
  if (!(e instanceof ApiError)) console.error("loyalty:", e?.message ?? e);
  return c.json({ error: e instanceof ApiError ? e.message : "Terjadi kesalahan, coba lagi." }, status);
};

app.get("/functions/v1/loyalty/me", async (c) => {
  try {
    if (limited(`loyalty:${ip(c)}`, 60)) return tooMany(c);
    const userId = await loyaltyUser(c);
    const [settings] = await sql`SELECT program_name, is_enabled, referral_points, booking_points, referee_benefit, terms FROM loyalty_settings WHERE id = 1`;
    const [member] = await sql`SELECT id, full_name, phone, referral_code, created_at FROM loyalty_members WHERE user_id = ${userId}::uuid`;
    if (!member) return c.json({ member: null, settings });
    const [{ balance }] = await sql`SELECT coalesce(sum(points), 0)::int AS balance FROM loyalty_points WHERE member_id = ${member.id}::uuid`;
    const ledger = await sql`SELECT id, points, type, description, created_at FROM loyalty_points
                             WHERE member_id = ${member.id}::uuid ORDER BY created_at DESC LIMIT 50`;
    const redemptions = await sql`SELECT id, reward_name, points_cost, status, created_at FROM loyalty_redemptions
                                  WHERE member_id = ${member.id}::uuid ORDER BY created_at DESC LIMIT 50`;
    const [stats] = await sql`
      SELECT count(*)::int AS referred,
             count(*) FILTER (WHERE status IN ('approved', 'paid', 'completed'))::int AS confirmed
      FROM ballroom_bookings WHERE referral_code = ${member.referral_code}`;
    return c.json({ member, settings, balance, ledger, redemptions, stats });
  } catch (e) {
    return loyaltyFail(c, e);
  }
});

// Hapus akun sendiri (wajib Play Store/App Store untuk aplikasi yang punya fitur akun).
// Perlu password ulang. Data akun & Rewards dihapus; riwayat booking tetap untuk keperluan
// administrasi tetapi tidak lagi terhubung ke akun (user_id SET NULL).
app.post("/functions/v1/account/delete", async (c) => {
  try {
    if (limited(`acct-del:${ip(c)}`, 5)) return tooMany(c);
    const ctx = await getCtx(c.req.header("authorization"));
    if (!ctx.userId) throw new ApiError(401, "Silakan masuk dulu", "UNAUTHENTICATED");
    if (ctx.isAdmin) throw new ApiError(403, "Akun admin tidak bisa dihapus dari sini. Hubungi pengelola situs.", "ADMIN");
    const { password, confirm } = await c.req.json().catch(() => ({}));
    if (String(confirm ?? "").trim().toUpperCase() !== "HAPUS") throw new ApiError(400, "Ketik HAPUS untuk konfirmasi");
    const [u] = await sql`SELECT id, password_hash FROM users WHERE id = ${ctx.userId}::uuid`;
    if (!u) throw new ApiError(404, "Akun tidak ditemukan");
    const ok = u.password_hash ? await Bun.password.verify(String(password ?? ""), u.password_hash) : false;
    if (!ok) throw new ApiError(400, "Password salah");
    const id = String(u.id);
    try {
      await sql.begin(async (tx) => {
        await tx`DELETE FROM loyalty_members WHERE user_id = ${id}::uuid`;
        await tx`DELETE FROM user_roles WHERE user_id = ${id}::uuid`;
        await tx`DELETE FROM profiles WHERE user_id = ${id}::uuid`;
        await tx`DELETE FROM users WHERE id = ${id}::uuid`;
      });
    } catch (e) {
      // Ada relasi lain yang menahan baris users: anonimkan saja supaya tidak bisa dipakai/dikenali lagi.
      console.error("account delete fallback:", (e as Error)?.message);
      await sql.begin(async (tx) => {
        await tx`DELETE FROM loyalty_members WHERE user_id = ${id}::uuid`;
        await tx`DELETE FROM user_roles WHERE user_id = ${id}::uuid`;
        await tx`UPDATE profiles SET email = ${`deleted-${id}@deleted.invalid`} WHERE user_id = ${id}::uuid`;
        await tx`UPDATE users SET email = ${`deleted-${id}@deleted.invalid`}, password_hash = ${await Bun.password.hash(crypto.randomUUID())} WHERE id = ${id}::uuid`;
      });
    }
    return c.json({ ok: true });
  } catch (e) {
    return loyaltyFail(c, e);
  }
});

app.post("/functions/v1/loyalty/join", async (c) => {
  try {
    if (limited(`loyalty-join:${ip(c)}`, 5, 10 * 60_000)) return tooMany(c, "Terlalu banyak percobaan, coba lagi nanti.", 600);
    const userId = await loyaltyUser(c);
    const body: any = await c.req.json().catch(() => ({}));
    const fullName = String(body?.full_name ?? "").trim();
    const phone = String(body?.phone ?? "").trim();
    const refCode = String(body?.ref ?? "").trim().toUpperCase();
    if (fullName.length < 2 || fullName.length > 100) throw new ApiError(400, "Nama 2–100 karakter");
    const digits = phone.replace(/\D/g, "");
    if (digits.length < 8 || digits.length > 15 || !/^[+\d\s().-]+$/.test(phone)) throw new ApiError(400, "Nomor HP tidak valid");
    const [existing] = await sql`SELECT id FROM loyalty_members WHERE user_id = ${userId}::uuid`;
    if (existing) return c.json({ ok: true });
    const [dupPhone] = await sql`SELECT 1 FROM loyalty_members WHERE kdm_norm_phone(phone) = kdm_norm_phone(${phone})`;
    if (dupPhone) throw new ApiError(409, "Nomor HP ini sudah terdaftar di akun lain");
    let referredBy: string | null = null;
    if (refCode) {
      if (!/^[A-Z0-9]{6,12}$/.test(refCode)) throw new ApiError(400, "Kode referral tidak valid");
      const [ref] = await sql`SELECT id FROM loyalty_members WHERE referral_code = ${refCode}`;
      if (!ref) throw new ApiError(400, "Kode referral tidak ditemukan");
      referredBy = ref.id;
    }
    for (let attempt = 0; attempt < 5; attempt++) {
      try {
        await sql`INSERT INTO loyalty_members (user_id, full_name, phone, referral_code, referred_by)
                  VALUES (${userId}::uuid, ${fullName}, ${phone}, ${makeReferralCode(fullName)}, ${referredBy}::uuid)`;
        return c.json({ ok: true });
      } catch (e: any) {
        if (!String(e?.message ?? "").includes("referral_code")) throw e;
      }
    }
    throw new ApiError(500, "Gagal membuat kode referral, coba lagi.");
  } catch (e) {
    return loyaltyFail(c, e);
  }
});

app.post("/functions/v1/loyalty/redeem", async (c) => {
  try {
    const userId = await loyaltyUser(c);
    if (limited(`loyalty-redeem:${userId}`, 10, 10 * 60_000)) return tooMany(c, "Terlalu banyak penukaran, coba lagi nanti.", 600);
    const body: any = await c.req.json().catch(() => ({}));
    const rewardId = String(body?.reward_id ?? "");
    if (!UUID_RE.test(rewardId)) throw new ApiError(400, "Hadiah tidak valid");
    const result = await sql.begin(async (tx) => {
      const [member] = await tx`SELECT id FROM loyalty_members WHERE user_id = ${userId}::uuid FOR UPDATE`;
      if (!member) throw new ApiError(403, "Daftar program rewards dulu");
      const [st] = await tx`SELECT is_enabled FROM loyalty_settings WHERE id = 1`;
      if (!st?.is_enabled) throw new ApiError(403, "Program rewards sedang tidak aktif");
      const [reward] = await tx`SELECT id, name, points_cost, stock FROM loyalty_rewards WHERE id = ${rewardId}::uuid AND is_active FOR UPDATE`;
      if (!reward) throw new ApiError(404, "Hadiah tidak tersedia");
      if (reward.stock !== null && reward.stock <= 0) throw new ApiError(409, "Stok hadiah habis");
      const [{ balance }] = await tx`SELECT coalesce(sum(points), 0)::int AS balance FROM loyalty_points WHERE member_id = ${member.id}::uuid`;
      if (balance < reward.points_cost) throw new ApiError(409, "Poin Anda belum cukup");
      const [red] = await tx`INSERT INTO loyalty_redemptions (member_id, reward_id, reward_name, points_cost)
                             VALUES (${member.id}::uuid, ${reward.id}::uuid, ${reward.name}, ${reward.points_cost}) RETURNING id`;
      await tx`INSERT INTO loyalty_points (member_id, points, type, redemption_id, description)
               VALUES (${member.id}::uuid, ${-reward.points_cost}, 'redeem', ${red.id}::uuid, ${"Tukar: " + reward.name})`;
      if (reward.stock !== null) await tx`UPDATE loyalty_rewards SET stock = stock - 1 WHERE id = ${reward.id}::uuid`;
      return { id: red.id, balance: balance - reward.points_cost };
    });
    return c.json({ ok: true, ...result });
  } catch (e) {
    return loyaltyFail(c, e);
  }
});

// Cek kode referral dari link ?ref= (hanya valid/tidak, tanpa data member)
app.get("/functions/v1/loyalty/ref/:code", async (c) => {
  if (limited(`loyalty-ref:${ip(c)}`, 30)) return tooMany(c);
  const code = c.req.param("code").trim().toUpperCase();
  if (!/^[A-Z0-9]{6,12}$/.test(code)) return c.json({ valid: false });
  const [row] = await sql`SELECT 1 FROM loyalty_members m JOIN loyalty_settings s ON s.id = 1 WHERE m.referral_code = ${code} AND s.is_enabled`;
  return c.json({ valid: Boolean(row) });
});

// ---------------------------------------------------------------------
// Karier: kirim lamaran (publik, multipart) & unduh CV (admin)
// ---------------------------------------------------------------------
const CV_MAX = 5 * 1024 * 1024;
function cvKind(bytes: Uint8Array): { mime: string; ext: string } | null {
  const b = (i: number) => bytes[i];
  if (b(0) === 0x25 && b(1) === 0x50 && b(2) === 0x44 && b(3) === 0x46) return { mime: "application/pdf", ext: "pdf" };          // %PDF
  if (b(0) === 0x50 && b(1) === 0x4b && b(2) === 0x03 && b(3) === 0x04) return { mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", ext: "docx" }; // ZIP (docx)
  if (b(0) === 0xd0 && b(1) === 0xcf && b(2) === 0x11 && b(3) === 0xe0) return { mime: "application/msword", ext: "doc" };       // OLE (doc)
  return null;
}
const httpsUrl = (v: string) => !v || (/^https?:\/\/[^\s<>"']{3,300}$/i.test(v));

app.post("/functions/v1/careers/apply", async (c) => {
  const who = ip(c);
  if (limited(`apply:${who}`, 3, 10 * 60_000) || limited(`apply-day:${who}`, 10, 24 * 60 * 60_000)) {
    return c.json({ error: "Terlalu banyak lamaran dari perangkat ini. Coba lagi nanti." }, 429);
  }
  try {
    const len = Number(c.req.header("content-length") ?? 0);
    if (len > CV_MAX + 200_000) throw new ApiError(413, "Ukuran berkas maksimal 5 MB");
    const form = await c.req.formData();
    const get = (k: string, max: number) => String(form.get(k) ?? "").trim().slice(0, max);
    if (get("website", 200)) return c.json({ ok: true }); // honeypot
    const jobId = get("job_id", 40);
    const fullName = get("full_name", 100), email = get("email", 160).toLowerCase(), phone = get("phone", 25);
    const domicile = get("domicile", 100), linkedin = get("linkedin_url", 300), portfolio = get("portfolio_url", 300);
    const expected = get("expected_salary", 60), available = get("available_from", 60), cover = get("cover_letter", 4000);
    if (!UUID_RE.test(jobId)) throw new ApiError(400, "Lowongan tidak valid");
    if (fullName.length < 2) throw new ApiError(400, "Nama lengkap wajib diisi");
    if (!validEmail(email)) throw new ApiError(400, "Email tidak valid");
    const digits = phone.replace(/\D/g, "");
    if (digits.length < 8 || digits.length > 15 || !/^[+\d\s().-]+$/.test(phone)) throw new ApiError(400, "Nomor HP tidak valid");
    if (!httpsUrl(linkedin) || !httpsUrl(portfolio)) throw new ApiError(400, "Tautan LinkedIn/portofolio harus diawali https://");
    const [job] = await sql`SELECT id, title FROM jobs WHERE id = ${jobId}::uuid AND is_active AND (deadline IS NULL OR deadline >= CURRENT_DATE)`;
    if (!job) throw new ApiError(404, "Lowongan ini sudah ditutup");
    const [dup] = await sql`SELECT 1 FROM job_applications WHERE job_id = ${jobId}::uuid AND lower(email) = ${email} AND created_at > now() - interval '30 days'`;
    if (dup) throw new ApiError(409, "Anda sudah melamar posisi ini. Tim kami akan menghubungi bila lolos seleksi berkas.");

    const file = form.get("cv");
    let cv: { name: string; mime: string; bytes: Uint8Array } | null = null;
    if (file && typeof file === "object" && "arrayBuffer" in file && (file as File).size > 0) {
      const f = file as File;
      if (f.size > CV_MAX) throw new ApiError(413, "Ukuran CV maksimal 5 MB");
      const bytes = new Uint8Array(await f.arrayBuffer());
      const kind = cvKind(bytes);
      if (!kind) throw new ApiError(400, "CV harus berformat PDF atau Word (.doc/.docx)");
      const safeName = (f.name || "cv").replace(/[^\w.\- ]+/g, "_").replace(/\.[^.]*$/, "").slice(0, 80) || "cv";
      cv = { name: `${safeName}.${kind.ext}`, mime: kind.mime, bytes };
    } else {
      throw new ApiError(400, "Mohon lampirkan CV (PDF/Word, maks 5 MB)");
    }

    const id = crypto.randomUUID();
    await sql.begin(async (tx) => {
      await tx`INSERT INTO job_applications (id, job_id, job_title, full_name, email, phone, domicile, linkedin_url, portfolio_url,
                                             expected_salary, available_from, cover_letter, has_cv)
               VALUES (${id}::uuid, ${jobId}::uuid, ${job.title}, ${fullName}, ${email}, ${phone}, ${domicile || null}, ${linkedin || null},
                       ${portfolio || null}, ${expected || null}, ${available || null}, ${cover || null}, ${!!cv})`;
      if (cv) await tx`INSERT INTO job_application_files (application_id, filename, mime, size, data)
                       VALUES (${id}::uuid, ${cv.name}, ${cv.mime}, ${cv.bytes.byteLength}, ${cv.bytes})`;
    });
    return c.json({ ok: true });
  } catch (e: any) {
    if (e instanceof ApiError) return c.json({ error: e.message }, e.status as any);
    console.error("careers apply:", e?.message ?? e);
    return c.json({ error: "Gagal mengirim lamaran, coba lagi." }, 500);
  }
});

app.get("/functions/v1/careers/cv/:id", async (c) => {
  const ctx = await getCtx(c.req.header("authorization"));
  if (!ctx.isAdmin) return c.json({ error: "Forbidden" }, 403);
  const id = c.req.param("id");
  if (!UUID_RE.test(id)) return c.json({ error: "Not found" }, 404);
  const [f] = await sql`SELECT filename, mime, data FROM job_application_files WHERE application_id = ${id}::uuid`;
  if (!f) return c.json({ error: "Not found" }, 404);
  return new Response(f.data, {
    headers: {
      "Content-Type": f.mime,
      "Content-Disposition": `attachment; filename="${String(f.filename).replace(/"/g, "")}"`,
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "private, no-store",
    },
  });
});

// Cek status booking: wajib nomor HP + kode booking (atau email lama untuk booking sebelum form ringkas).
// Dibatasi per IP dan per nomor HP agar tidak bisa ditebak/brute-force.
const normPhone = (p: string) => p.replace(/\D/g, "").replace(/^62/, "0");
app.post("/functions/v1/track-booking", async (c) => {
  if (limited(`track:${ip(c)}`, 10, 10 * 60_000)) return tooMany(c, "Terlalu banyak percobaan. Coba lagi dalam 10 menit.", 600);
  const body: any = await c.req.json().catch(() => ({}));
  const phone = normPhone(String(body?.phone ?? ""));
  const code = String(body?.code ?? "").trim().replace(/^KDM-?/i, "").toLowerCase();
  const email = String(body?.email ?? "").trim().toLowerCase();
  if (phone.length < 8 || phone.length > 15) return c.json({ error: "Nomor HP tidak valid" }, 400);
  if (code && !/^[0-9a-f]{8}$/.test(code)) return c.json({ error: "Kode booking tidak valid" }, 400);
  if (!code && !validEmail(email)) return c.json({ error: "Masukkan kode booking" }, 400);
  if (limited(`track-phone:${phone}`, 20, 60 * 60_000)) return tooMany(c, "Terlalu banyak percobaan untuk nomor ini. Coba lagi nanti.", 3600);
  const rows = await sql`
    SELECT coalesce(json_agg(x ORDER BY x.created_at DESC), '[]'::json) AS data FROM (
      SELECT upper(left(replace(b.id::text, '-', ''), 8)) AS code, b.booking_date, b.start_time, b.end_time,
             b.event_name, b.event_type, b.guest_count, b.package_name, b.status, b.created_at,
             (SELECT json_build_object('name', l.name) FROM locations l WHERE l.id = b.location_id) AS locations
      FROM ballroom_bookings b
      WHERE regexp_replace(regexp_replace(b.contact_phone, '[^0-9]', '', 'g'), '^62', '0') = ${phone}
        AND ((${code} <> '' AND left(replace(b.id::text, '-', ''), 8) = ${code})
          OR (${code} = '' AND lower(b.contact_email) = ${email}))
      LIMIT 20
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

// ---------------------------------------------------------------------
// Chat website (Claude) — gaya ngobrol seperti admin Kediaman di WhatsApp.
// Balasan dipecah jadi beberapa gelembung pendek (pemisah baris "---").
// Tool: cek_ketersediaan (jadwal ballroom), simpan_kontak (lead ke Booking masuk).
// Env: ANTHROPIC_API_KEY (wajib), CHAT_MODEL (default claude-sonnet-5-5).
// ---------------------------------------------------------------------
const rupiah = (n: unknown) => (n == null || n === "" ? null : `Rp${Number(n).toLocaleString("id-ID")}`);

async function chatKnowledge() {
  const [locations, packages, promos, faqs, [settings]] = await Promise.all([
    sql`SELECT id, name, slug, address, category, facilities, ballroom_layout_capacity, ballroom_layout_dimensions,
               is_coming_soon, matterport_360_url FROM locations WHERE is_active ORDER BY sort_order LIMIT 50`,
    sql`SELECT p.name, p.price, p.price_note, p.min_pax, p.max_pax, p.inclusions, l.name AS venue
        FROM venue_packages p LEFT JOIN locations l ON l.id = p.location_id
        WHERE p.is_active ORDER BY p.sort_order LIMIT 60`,
    sql`SELECT name, slug, description, promo_code, start_date, end_date FROM programs
        WHERE is_active AND (end_date IS NULL OR end_date >= CURRENT_DATE) ORDER BY sort_order LIMIT 15`,
    sql`SELECT question, answer FROM faqs WHERE is_active ORDER BY sort_order LIMIT 30`,
    sql`SELECT * FROM site_settings LIMIT 1`,
  ]);
  return { locations, packages, promos, faqs, settings };
}

function chatSystemPrompt(k: Awaited<ReturnType<typeof chatKnowledge>>, page: string) {
  const site = k.settings?.site_name || "Kediaman";
  const now = new Date();
  const today = now.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Jakarta" });
  const hour = Number(now.toLocaleString("en-GB", { hour: "2-digit", hour12: false, timeZone: "Asia/Jakarta" }));
  const venues = k.locations.map((l: any) => [
    `- ${l.name}${l.is_coming_soon ? " (segera dibuka)" : ""}`,
    l.category ? `area ${l.category}` : "",
    l.address ? `alamat: ${l.address}` : "",
    l.ballroom_layout_capacity ? `kapasitas: ${l.ballroom_layout_capacity}` : "",
    l.ballroom_layout_dimensions ? `ukuran: ${l.ballroom_layout_dimensions}` : "",
    Array.isArray(l.facilities) && l.facilities.length ? `fasilitas: ${l.facilities.slice(0, 8).join(", ")}` : "",
    l.matterport_360_url ? "ada tur virtual 360°" : "",
    `halaman: /lokasi/${l.slug || l.id}`,
  ].filter(Boolean).join(" | ")).join("\n");
  const packages = k.packages.map((p: any) => `- ${p.name}${p.venue ? ` (${p.venue})` : " (semua venue)"}: ${rupiah(p.price) ? `${p.price_note || "mulai"} ${rupiah(p.price)}` : "harga by request"}${p.min_pax || p.max_pax ? `, ${p.min_pax ?? ""}-${p.max_pax ?? ""} tamu` : ""}${Array.isArray(p.inclusions) && p.inclusions.length ? `, termasuk: ${p.inclusions.slice(0, 6).join(", ")}` : ""}`).join("\n");
  const promos = k.promos.map((p: any) => `- ${p.name || "Promo"}${p.promo_code ? ` (kode ${p.promo_code})` : ""}${p.end_date ? ` s.d. ${p.end_date}` : ""}: ${String(p.description ?? "").slice(0, 160)} | halaman: /promo/${p.slug}`).join("\n");
  const faqs = k.faqs.map((f: any) => `T: ${f.question}\nJ: ${String(f.answer).slice(0, 300)}`).join("\n");
  const wa = k.settings?.whatsapp_link || (k.settings?.phone ? `https://wa.me/${String(k.settings.phone).replace(/\D/g, "").replace(/^0/, "62")}` : "");
  return `Kamu admin chat ${site} di website kediaman.co. ${site} mengelola venue & ballroom untuk pernikahan dan acara di Indonesia.
Hari ini ${today}, sekitar pukul ${hour}.00 WIB. Pengunjung sedang membuka halaman: ${page || "/"}.

CARA NGOBROL (paling penting):
- Ngobrol seperti admin manusia yang ramah di WhatsApp, bukan seperti bot atau customer service kaku. Santai, hangat, sopan. Panggil "kak" (atau nama bila sudah tahu).
- Pecah balasan jadi 1-3 gelembung chat pendek. Pisahkan tiap gelembung dengan baris yang isinya hanya: ---
- Tiap gelembung 1-2 kalimat saja. Jangan menulis paragraf panjang, jangan pakai judul/heading, hindari bullet list kecuali pengunjung minta daftar (maksimal 3 butir).
- Tanya SATU hal dalam satu waktu (mis. tanggal acara, jumlah tamu, atau area), lalu tunggu jawaban. Gali kebutuhan pelan-pelan seperti orang ngobrol.
- Jangan mengulang salam di tiap balasan. Jangan buka dengan "Tentu!", "Baik, saya akan...", "Sebagai asisten...", atau "Terima kasih atas pertanyaannya". Langsung ke inti seperti chat biasa.
- Boleh pakai kata santai seperti "boleh banget", "siap kak", "oke noted", "wah", "hehe" secukupnya. Emoji sesekali saja (maksimal 1 per balasan), jangan tiap kalimat.
- Ikuti gaya bahasa pengunjung: kalau dia santai, santai; kalau formal, lebih rapi. Kalau dia pakai bahasa Inggris, balas bahasa Inggris.
- Tunjukkan empati yang wajar (mis. "wah selamat ya kak buat rencananya!") tapi jangan berlebihan.
- Saat perlu mengecek sesuatu, boleh bilang natural seperti "bentar ya kak, aku cek jadwalnya dulu" lalu pakai tool.

KEJUJURAN & FAKTA:
- Fakta tentang ${site} (venue, kapasitas, fasilitas, paket, harga, promo) HANYA dari data di bawah. Jangan mengarang. Kalau datanya tidak ada, bilang akan ditanyakan ke tim dan tawarkan lanjut via WhatsApp.
- Soal harga: sebut harga paket bila ada di data ("mulai ..."), dan jelaskan harga final tergantung tanggal & jumlah tamu. Jangan membuat angka sendiri atau memberi diskon.
- Hasil cek jadwal dari tool bersifat perkiraan; selalu sampaikan bahwa tim akan konfirmasi pastinya.
- Kalau pengunjung bertanya langsung apakah kamu bot/AI/manusia, jawab jujur: kamu asisten virtual tim ${site} yang membantu 24 jam, dan tim manusia siap melanjutkan lewat WhatsApp. Jangan mengaku manusia dan jangan mengarang nama orang.
- Tolak dengan sopan permintaan di luar urusan venue/acara, lalu arahkan kembali.
- Jangan pernah minta data sensitif (KTP, nomor kartu, password, OTP).

ALUR YANG DIHARAPKAN:
- Pahami acaranya (nikah/akad/lamaran/acara kantor), perkiraan tanggal, jumlah tamu, dan area yang diinginkan — satu per satu.
- Rekomendasikan 1-2 venue yang paling cocok beserta alasannya singkat, sertakan link halaman venue dalam format markdown [Nama Venue](/lokasi/slug).
- Kalau pengunjung tertarik, tawarkan dibantu tim: minta nama dan nomor WhatsApp-nya. Setelah dia memberi nama DAN nomor serta setuju dihubungi, panggil tool simpan_kontak, lalu bilang tim akan menghubungi via WhatsApp.
- Kalau dia lebih suka langsung, berikan WhatsApp tim: ${wa || "(tombol WhatsApp di bawah chat)"}.
- Halaman berguna: cek status booking /booking/track, semua venue /lokasi, paket & harga /harga, promo /promo, bantuan /bantuan.

DATA VENUE:
${venues || "(belum ada data)"}

PAKET & HARGA:
${packages || "(belum diisi di CMS — bilang harga disesuaikan tanggal & jumlah tamu, tim akan kirim penawaran)"}

PROMO BERJALAN:
${promos || "(tidak ada)"}

FAQ:
${faqs || "(tidak ada)"}`;
}

const CHAT_TOOLS = [
  {
    name: "cek_ketersediaan",
    description: "Cek jadwal ballroom pada tanggal tertentu dari sistem jadwal Kediaman. Pakai saat pengunjung menyebut tanggal acara.",
    input_schema: {
      type: "object", required: ["tanggal"],
      properties: {
        tanggal: { type: "string", description: "Tanggal acara format YYYY-MM-DD" },
        venue: { type: "string", description: "Nama venue (opsional; kosongkan untuk semua venue)" },
      },
    },
  },
  {
    name: "simpan_kontak",
    description: "Simpan kontak calon klien agar tim marketing menghubungi via WhatsApp. Panggil HANYA setelah pengunjung memberi nama DAN nomor HP/WhatsApp dan setuju dihubungi.",
    input_schema: {
      type: "object", required: ["nama", "no_hp"],
      properties: {
        nama: { type: "string" },
        no_hp: { type: "string" },
        venue: { type: "string", description: "Nama venue yang diminati (bila ada)" },
        tanggal: { type: "string", description: "Perkiraan tanggal acara YYYY-MM-DD (bila ada)" },
        ringkasan: { type: "string", description: "Ringkasan kebutuhan: jenis acara, jumlah tamu, preferensi, pertanyaan penting" },
      },
    },
  },
];

async function runChatTool(name: string, input: any, ctx: { ip: string; locations: any[]; leadSaved: { done: boolean } }): Promise<string> {
  const findVenue = (q: unknown) => {
    const t = String(q ?? "").toLowerCase().trim();
    if (!t) return null;
    return ctx.locations.find((l: any) => l.name.toLowerCase() === t)
      ?? ctx.locations.find((l: any) => l.name.toLowerCase().includes(t) || t.includes(l.name.toLowerCase())) ?? null;
  };
  if (name === "cek_ketersediaan") {
    const date = String(input?.tanggal ?? "");
    if (!DATE_RE.test(date)) return "Format tanggal tidak valid. Tanyakan ulang tanggalnya.";
    if (date < new Date().toISOString().slice(0, 10)) return "Tanggal itu sudah lewat. Konfirmasi ulang tanggalnya ke pengunjung.";
    const venue = findVenue(input?.venue);
    const rows = await sql`SELECT s.location_id, s.status, s.start_time, s.end_time FROM ballroom_schedules s
                           WHERE s.schedule_date = ${date}::date AND s.status IN ('booked', 'blocked')`;
    const list = (venue ? [venue] : ctx.locations.filter((l: any) => !l.is_coming_soon)).map((l: any) => {
      const taken = rows.filter((r: any) => r.location_id === l.id);
      return `${l.name}: ${taken.length ? `sudah ada jadwal terisi${taken.some((r: any) => r.start_time) ? ` (${taken.map((r: any) => `${String(r.start_time ?? "").slice(0, 5)}-${String(r.end_time ?? "").slice(0, 5)}`).join(", ")})` : ""}` : "belum ada jadwal terisi di sistem"}`;
    });
    return `Hasil sistem jadwal untuk ${date} (perkiraan, tim tetap konfirmasi):\n${list.join("\n")}`;
  }
  if (name === "simpan_kontak") {
    if (ctx.leadSaved.done) return "Kontak sudah tersimpan di percakapan ini.";
    if (limited(`chat-lead:${ctx.ip}`, 3, 60 * 60_000)) return "Batas penyimpanan kontak tercapai; arahkan ke WhatsApp.";
    const nama = String(input?.nama ?? "").trim().slice(0, 100);
    const hp = String(input?.no_hp ?? "").trim().slice(0, 20);
    const digits = hp.replace(/\D/g, "");
    if (nama.length < 2) return "Nama belum valid, tanyakan namanya.";
    if (digits.length < 8 || digits.length > 15) return "Nomor HP belum valid, minta nomor WhatsApp yang benar.";
    const venue = findVenue(input?.venue) ?? ctx.locations.find((l: any) => !l.is_coming_soon) ?? ctx.locations[0];
    if (!venue) return "Belum ada data venue; arahkan ke WhatsApp.";
    const date = DATE_RE.test(String(input?.tanggal ?? "")) ? String(input.tanggal) : null;
    const notes = `[Dari chat website] ${String(input?.ringkasan ?? "").slice(0, 900)}${findVenue(input?.venue) ? "" : " (venue belum ditentukan)"}`;
    const [row] = await sql`INSERT INTO ballroom_bookings (location_id, contact_name, contact_phone, booking_date, notes, event_type)
                            VALUES (${venue.id}::uuid, ${nama}, ${hp}, ${date}::date, ${notes}, ${"Chat"}) RETURNING id`;
    ctx.leadSaved.done = true;
    const code = `KDM-${String(row.id).replace(/-/g, "").slice(0, 8).toUpperCase()}`;
    return `Kontak tersimpan sebagai permintaan booking ${code}. Sampaikan bahwa tim akan menghubungi via WhatsApp dan kodenya bisa dipakai di /booking/track bersama nomor HP.`;
  }
  return "Tool tidak dikenal.";
}

app.post("/functions/v1/chat", async (c) => {
  const key = env.ANTHROPIC_API_KEY;
  if (!key) return c.json({ error: "Layanan chat sedang tidak tersedia." }, 503);
  const who = ip(c);
  if (limited(`chat:${who}`, 12) || limited(`chat-hour:${who}`, 120, 60 * 60_000)) {
    return c.json({ error: "Wah, chatnya lagi rame banget nih kak. Coba lagi sebentar ya, atau langsung WhatsApp tim kami." }, 429);
  }
  const body: any = await c.req.json().catch(() => ({}));
  const history = (Array.isArray(body?.messages) ? body.messages : []).slice(-24)
    .filter((m: any) => (m?.role === "user" || m?.role === "assistant") && typeof m.content === "string" && m.content.trim())
    .map((m: any) => ({ role: m.role as "user" | "assistant", content: String(m.content).slice(0, 2000) }));
  while (history.length && history[0].role !== "user") history.shift();
  if (!history.length || history[history.length - 1].role !== "user") return c.json({ error: "Pesan kosong" }, 400);
  const page = String(body?.page ?? "").slice(0, 120).replace(/[^\w\-/?=&.%]/g, "");

  try {
    const k = await chatKnowledge();
    const system = chatSystemPrompt(k, page);
    // Gabungkan pesan berurutan dari peran yang sama (mis. pengunjung kirim 2 chat beruntun)
    const msgs: any[] = [];
    for (const m of history) {
      const last = msgs[msgs.length - 1];
      if (last && last.role === m.role) last.content += `\n${m.content}`;
      else msgs.push({ role: m.role, content: m.content });
    }
    const ctx = { ip: who, locations: k.locations as any[], leadSaved: { done: false } };
    let text = "";
    for (let step = 0; step < 4; step++) {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "x-api-key": key, "anthropic-version": "2023-06-01", "content-type": "application/json" },
        body: JSON.stringify({ model: env.CHAT_MODEL || "claude-sonnet-5-5", max_tokens: 700, system, tools: CHAT_TOOLS, messages: msgs }),
        signal: AbortSignal.timeout(45000),
      });
      if (!res.ok) {
        console.error("chat claude error:", res.status, (await res.text().catch(() => "")).slice(0, 300));
        return c.json({ error: res.status === 429 ? "Lagi ramai nih kak, coba sebentar lagi ya." : "Maaf kak, chatnya lagi gangguan. Boleh lanjut via WhatsApp dulu ya." }, 502);
      }
      const out = await res.json() as { content: any[]; stop_reason: string };
      text = out.content.filter((b) => b.type === "text").map((b) => b.text).join("\n").trim();
      const uses = out.content.filter((b) => b.type === "tool_use");
      if (out.stop_reason !== "tool_use" || !uses.length) break;
      msgs.push({ role: "assistant", content: out.content });
      const results = [];
      for (const u of uses) {
        let result: string;
        try { result = await runChatTool(u.name, u.input, ctx); } catch (e: any) { console.error("chat tool:", e?.message); result = "Sistem sedang tidak bisa diakses; arahkan ke WhatsApp."; }
        results.push({ type: "tool_result", tool_use_id: u.id, content: result });
      }
      msgs.push({ role: "user", content: results });
    }
    const bubbles = text.split(/\n\s*-{3,}\s*\n?/).map((t) => t.trim()).filter(Boolean).slice(0, 4);
    if (!bubbles.length) bubbles.push("Maaf kak, boleh diulang pertanyaannya? 🙏");
    return c.json({ messages: bubbles, lead_saved: ctx.leadSaved.done });
  } catch (e: any) {
    console.error("chat error:", e?.message ?? e);
    return c.json({ error: "Maaf kak, chatnya lagi gangguan. Boleh lanjut via WhatsApp dulu ya." }, 500);
  }
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
    // Booking ringkas + validasi server + cek status (data uji dihapus lagi)
    const badB = await call("/rest/v1/query", { table: "ballroom_bookings", action: "insert", values: { location_id: anyLoc, contact_name: "X", contact_phone: "12" } });
    const okB = await call("/rest/v1/query", { table: "ballroom_bookings", action: "insert", returning: true, single: "single",
      values: { location_id: anyLoc, contact_name: "Self Test", contact_phone: "+62 811-0000-0000", notes: "self-test" } });
    const bCode = String(okB.json.data?.id ?? "").replace(/-/g, "").slice(0, 8);
    const trk = await call("/functions/v1/track-booking", { phone: "081100000000", code: `KDM-${bCode}` });
    const trBad = await call("/functions/v1/track-booking", { phone: "081100000000", code: "KDM-00000000" });
    const leak = JSON.stringify(trk.json).includes("contact_phone") || JSON.stringify(trk.json).includes("admin_notes");
    if (okB.json.data?.id) await sql`DELETE FROM ballroom_bookings WHERE id = ${okB.json.data.id}::uuid`;
    out.push(`booking invalid=${badB.status} valid=${okB.status} track=${trk.json.bookings?.length} salah=${trBad.json.bookings?.length} bocor=${leak}`);
    let rl = 0; for (let i = 0; i < 4; i++) if (limited("self-test-rl", 3)) rl++;
    hits.delete("self-test-rl");
    out.push(`ratelimit=${rl === 1 ? "ok" : "GAGAL"}`);
    // Hapus akun sendiri: salah password ditolak, benar terhapus, lalu tidak bisa login
    {
      const em = `del-${Date.now()}@kediaman.invalid`, pw = "uji-hapus-akun-123";
      const [ud] = await sql`INSERT INTO users (email, password_hash) VALUES (${em}, ${await Bun.password.hash(pw)}) RETURNING *`;
      const tk = (await makeSession(ud)).access_token;
      try {
        const anon = await call("/functions/v1/account/delete", { password: pw, confirm: "HAPUS" });
        const bad = await call("/functions/v1/account/delete", { password: "salah", confirm: "HAPUS" }, tk);
        const good = await call("/functions/v1/account/delete", { password: pw, confirm: "HAPUS" }, tk);
        const login = await call("/auth/v1/token", { email: em, password: pw });
        out.push(`hapusAkun anon=${anon.status} salah=${bad.status} ok=${good.status} loginSetelah=${login.status}`);
      } finally {
        await sql`DELETE FROM users WHERE id = ${ud.id}::uuid OR email = ${em}`;
        hits.delete("acct-del:unknown");
      }
    }
    // Loyalty: daftar, referral, booking dikonfirmasi -> poin, tukar, tolak -> refund (data uji dihapus)
    {
      const stamp = Date.now();
      const [ua] = await sql`INSERT INTO users (email, password_hash) VALUES (${`lt-a-${stamp}@kediaman.invalid`}, NULL) RETURNING *`;
      const [ub] = await sql`INSERT INTO users (email, password_hash) VALUES (${`lt-b-${stamp}@kediaman.invalid`}, NULL) RETURNING *`;
      const ta = (await makeSession(ua)).access_token, tb = (await makeSession(ub)).access_token;
      const get = async (path: string, tok: string) => {
        const res = await app.fetch(new Request(`http://local${path}`, { headers: { authorization: `Bearer ${tok}` } }));
        return { status: res.status, json: (await res.json()) as any };
      };
      try {
        const ja = await call("/functions/v1/loyalty/join", { full_name: "Ana Tes", phone: "081200000001" }, ta);
        const meA = await get("/functions/v1/loyalty/me", ta);
        const code = meA.json.member?.referral_code;
        const jb = await call("/functions/v1/loyalty/join", { full_name: "Budi Tes", phone: "081200000002", ref: code }, tb);
        const dup = await call("/functions/v1/loyalty/join", { full_name: "X", phone: "0812-0000-0001" }, tb);
        const bk = await call("/rest/v1/query", { table: "ballroom_bookings", action: "insert", returning: true, single: "single",
          values: { location_id: anyLoc, contact_name: "Budi Tes", contact_phone: "081200000002", notes: "self-test loyalty" } }, tb);
        await sql`UPDATE ballroom_bookings SET status = 'approved' WHERE id = ${bk.json.data.id}::uuid`;
        const meA2 = await get("/functions/v1/loyalty/me", ta);
        const meB2 = await get("/functions/v1/loyalty/me", tb);
        const [rw] = await sql`INSERT INTO loyalty_rewards (name, points_cost, stock, is_active) VALUES ('Self-test reward', 100, 1, true) RETURNING id`;
        const rd = await call("/functions/v1/loyalty/redeem", { reward_id: rw.id }, ta);
        const rd2 = await call("/functions/v1/loyalty/redeem", { reward_id: rw.id }, ta);
        await sql`UPDATE loyalty_redemptions SET status = 'rejected' WHERE id = ${rd.json.id}::uuid`;
        const meA3 = await get("/functions/v1/loyalty/me", ta);
        const anonRead = await call("/rest/v1/query", { table: "loyalty_points", action: "select", select: "id" });
        out.push(`loyalty join=${ja.status}/${jb.status} dupHP=${dup.status} ref=${meA2.json.balance} booking=${meB2.json.balance} redeem=${rd.status}→${rd.json.balance} stokHabis=${rd2.status} refund=${meA3.json.balance} anon=${anonRead.status}`);
        await sql`DELETE FROM ballroom_bookings WHERE id = ${bk.json.data?.id ?? null}::uuid`;
        await sql`DELETE FROM loyalty_rewards WHERE id = ${rw.id}::uuid`;
      } finally {
        await sql`DELETE FROM users WHERE id IN (${ua.id}::uuid, ${ub.id}::uuid)`;
      }
    }
    // Karier: lamar dengan CV PDF kecil, cek duplikat, CV tidak bisa diunduh/dibaca publik (data uji dihapus)
    {
      const [job] = await sql`INSERT INTO jobs (title, is_active) VALUES (${`Self Test Job ${Date.now()}`}, true) RETURNING id, slug`;
      try {
        const mk = (email: string, cvBytes: Uint8Array) => {
          const fd = new FormData();
          fd.set("job_id", job.id); fd.set("full_name", "Tes Pelamar"); fd.set("email", email); fd.set("phone", "081234567890");
          fd.set("cv", new File([cvBytes], "cv tes.pdf", { type: "application/pdf" }));
          return app.fetch(new Request("http://local/functions/v1/careers/apply", { method: "POST", body: fd }));
        };
        const pdf = new TextEncoder().encode("%PDF-1.4\n%self-test\n");
        const ok = await mk("tes@kediaman.invalid", pdf);
        const dup = await mk("tes@kediaman.invalid", pdf);
        const bad = await mk("tes2@kediaman.invalid", new TextEncoder().encode("MZ bukan pdf"));
        const anonCv = await app.fetch(new Request(`http://local/functions/v1/careers/cv/${crypto.randomUUID()}`));
        const anonApps = await call("/rest/v1/query", { table: "job_applications", action: "select", select: "id" });
        const anonFiles = await call("/rest/v1/query", { table: "job_application_files", action: "select" });
        const pub = await call("/rest/v1/query", { table: "jobs", action: "select", select: "id,slug", filters: [["id", "eq", job.id]] });
        out.push(`karir lamar=${ok.status} duplikat=${dup.status} bukanPdf=${bad.status} cvAnon=${anonCv.status} pelamarAnon=${anonApps.status} berkasAnon=${anonFiles.status} lowonganPublik=${pub.json.data?.length} slug=${job.slug}`);
      } finally {
        await sql`DELETE FROM job_applications WHERE job_id = ${job.id}::uuid`;
        await sql`DELETE FROM jobs WHERE id = ${job.id}::uuid`;
      }
    }
    if (env.ANTHROPIC_API_KEY) {
      const ch = await call("/functions/v1/chat", { messages: [{ role: "user", content: "halo kak, mau tanya venue buat nikahan bulan Maret, tamunya sekitar 800" }], page: "/" });
      out.push(`chat=${ch.status} gelembung=${ch.json.messages?.length ?? 0} contoh=${JSON.stringify(ch.json.messages ?? ch.json.error).slice(0, 300)}`);
    }
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
