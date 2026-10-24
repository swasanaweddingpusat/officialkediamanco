// Pengganti @supabase/supabase-js untuk backend kediaman-api di Railway.
// API-nya sengaja dibuat sama dengan supabase-js (bagian yang dipakai aplikasi ini),
// sehingga kode lain cukup tetap memakai:
//   import { supabase } from "@/integrations/supabase/client";
//
// Variabel build (Vite):
//   VITE_API_URL             mis. https://kediaman-api-production.up.railway.app
//   VITE_STORAGE_PUBLIC_URL  mis. https://bucket-jwta-production.up.railway.app

const API_URL = String(import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "");
const STORAGE_URL = String(import.meta.env.VITE_STORAGE_PUBLIC_URL ?? "").replace(/\/$/, "");
const SESSION_KEY = "kediaman-auth-session";

// ------------------------------------------------------------------ sesi
type Session = {
  access_token: string;
  token_type: string;
  expires_in: number;
  expires_at: number;
  refresh_token: string;
  user: { id: string; email: string; [k: string]: any };
};
type AuthEvent = "INITIAL_SESSION" | "SIGNED_IN" | "SIGNED_OUT";
type Listener = (event: AuthEvent, session: Session | null) => void;

const listeners = new Set<Listener>();

function loadSession(): Session | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw) as Session;
    if (!s?.access_token || s.expires_at * 1000 < Date.now()) {
      localStorage.removeItem(SESSION_KEY);
      return null;
    }
    return s;
  } catch {
    return null;
  }
}

function saveSession(s: Session | null) {
  try {
    if (s) localStorage.setItem(SESSION_KEY, JSON.stringify(s));
    else localStorage.removeItem(SESSION_KEY);
  } catch { /* storage tidak tersedia */ }
}

function emit(event: AuthEvent, s: Session | null) {
  for (const l of listeners) {
    try { l(event, s); } catch (e) { console.error(e); }
  }
}

function authHeaders(): Record<string, string> {
  const s = loadSession();
  return s ? { Authorization: `Bearer ${s.access_token}` } : {};
}

class AuthError extends Error {
  status?: number;
  constructor(message: string, status?: number) { super(message); this.name = "AuthError"; this.status = status; }
}

async function authRequest(path: string, body: unknown) {
  try {
    const res = await fetch(`${API_URL}/auth/v1/${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || json.error) {
      return { data: { user: null, session: null }, error: new AuthError(json?.error?.message ?? `HTTP ${res.status}`, res.status) };
    }
    const session = json.data as Session;
    saveSession(session);
    emit("SIGNED_IN", session);
    return { data: { user: session.user, session }, error: null };
  } catch (e: any) {
    return { data: { user: null, session: null }, error: new AuthError(e?.message ?? "Network error") };
  }
}

const notSupported = async () => ({ data: null, error: new AuthError("Fitur OAuth tidak tersedia") });

const auth = {
  async getSession() {
    return { data: { session: loadSession() }, error: null };
  },
  async getUser() {
    const s = loadSession();
    return { data: { user: s?.user ?? null }, error: null };
  },
  onAuthStateChange(callback: Listener) {
    listeners.add(callback);
    setTimeout(() => callback("INITIAL_SESSION", loadSession()), 0);
    return { data: { subscription: { unsubscribe: () => listeners.delete(callback) } } };
  },
  signInWithPassword(creds: { email: string; password: string }) {
    return authRequest("token", creds);
  },
  signUp(creds: { email: string; password: string; options?: unknown }) {
    return authRequest("signup", { email: creds.email, password: creds.password });
  },
  async signOut() {
    saveSession(null);
    emit("SIGNED_OUT", null);
    return { error: null };
  },
  // Dipakai halaman OAuthConsent (fitur MCP Lovable) — tidak tersedia di luar Lovable.
  oauth: {
    getAuthorizationDetails: notSupported,
    approveAuthorization: notSupported,
    denyAuthorization: notSupported,
  },
};

// ------------------------------------------------------------------ query builder
type Result = { data: any; error: any; status: number };
type Filter = [string, string, unknown];

class QueryBuilder implements PromiseLike<Result> {
  private req: {
    table: string;
    action: "select" | "insert" | "update" | "delete";
    select: string;
    filters: Filter[];
    order: { column: string; ascending?: boolean; nullsFirst?: boolean }[];
    limit: number | null;
    single: "single" | "maybe" | null;
    values: any;
    returning: boolean;
  };

  constructor(table: string) {
    this.req = { table, action: "select", select: "*", filters: [], order: [], limit: null, single: null, values: null, returning: false };
  }

  select(columns = "*", _options?: unknown) {
    if (this.req.action === "select") this.req.select = columns.replace(/\s+/g, " ").trim();
    else this.req.returning = true;
    return this;
  }
  insert(values: any, _options?: unknown) { this.req.action = "insert"; this.req.values = values; return this; }
  update(values: any, _options?: unknown) { this.req.action = "update"; this.req.values = values; return this; }
  delete(_options?: unknown) { this.req.action = "delete"; return this; }

  private f(column: string, op: string, value: unknown) { this.req.filters.push([column, op, value]); return this; }
  eq(column: string, value: unknown) { return this.f(column, "eq", value); }
  neq(column: string, value: unknown) { return this.f(column, "neq", value); }
  gt(column: string, value: unknown) { return this.f(column, "gt", value); }
  gte(column: string, value: unknown) { return this.f(column, "gte", value); }
  lt(column: string, value: unknown) { return this.f(column, "lt", value); }
  lte(column: string, value: unknown) { return this.f(column, "lte", value); }
  in(column: string, values: unknown[]) { return this.f(column, "in", values); }
  is(column: string, value: unknown) { return this.f(column, "is", value); }

  order(column: string, options: { ascending?: boolean; nullsFirst?: boolean } = {}) {
    this.req.order.push({ column, ascending: options.ascending, nullsFirst: options.nullsFirst });
    return this;
  }
  limit(count: number) { this.req.limit = count; return this; }
  single() { this.req.single = "single"; if (this.req.action !== "select") this.req.returning = true; return this; }
  maybeSingle() { this.req.single = "maybe"; if (this.req.action !== "select") this.req.returning = true; return this; }

  async execute(): Promise<Result> {
    try {
      const res = await fetch(`${API_URL}/rest/v1/query`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify(this.req),
      });
      const json = await res.json().catch(() => ({ data: null, error: { message: `HTTP ${res.status}` } }));
      return { data: json.data ?? null, error: json.error ?? null, status: res.status };
    } catch (e: any) {
      return { data: null, error: { message: e?.message ?? "Network error", code: "NETWORK" }, status: 0 };
    }
  }

  then<A = Result, B = never>(
    onfulfilled?: ((value: Result) => A | PromiseLike<A>) | null,
    onrejected?: ((reason: any) => B | PromiseLike<B>) | null,
  ): Promise<A | B> {
    return this.execute().then(onfulfilled, onrejected);
  }
}

// ------------------------------------------------------------------ storage (MinIO)
const encodePath = (p: string) => p.split("/").map(encodeURIComponent).join("/");

const storage = {
  from(bucket: string) {
    return {
      async upload(path: string, file: Blob, options: { upsert?: boolean; contentType?: string; cacheControl?: string } = {}) {
        try {
          const res = await fetch(`${API_URL}/storage/v1/object/${bucket}/${encodePath(path)}`, {
            method: "POST",
            headers: {
              "Content-Type": options.contentType || (file as File).type || "application/octet-stream",
              "x-upsert": options.upsert ? "true" : "false",
              ...authHeaders(),
            },
            body: file,
          });
          const json = await res.json().catch(() => ({}));
          if (!res.ok || json.error) return { data: null, error: { message: json?.error?.message ?? `HTTP ${res.status}`, statusCode: res.status } };
          return { data: json.data, error: null };
        } catch (e: any) {
          return { data: null, error: { message: e?.message ?? "Network error" } };
        }
      },
      getPublicUrl(path: string) {
        return { data: { publicUrl: `${STORAGE_URL}/${bucket}/${encodePath(path)}` } };
      },
    };
  },
};

// ------------------------------------------------------------------ functions
const functions = {
  async invoke(name: string, options: { body?: unknown; method?: string } = {}) {
    try {
      const res = await fetch(`${API_URL}/functions/v1/${name}`, {
        method: options.method ?? "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: options.body === undefined ? undefined : JSON.stringify(options.body),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) return { data: null, error: new Error(json?.error ?? `HTTP ${res.status}`) };
      return { data: json, error: null };
    } catch (e: any) {
      return { data: null, error: e instanceof Error ? e : new Error(String(e)) };
    }
  },
};

// ------------------------------------------------------------------ rpc (fungsi database)
async function rpc(name: string, args: Record<string, unknown> = {}) {
  try {
    const res = await fetch(`${API_URL}/rest/v1/rpc/${encodeURIComponent(name)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify(args),
    });
    const json = await res.json().catch(() => ({ data: null, error: { message: `HTTP ${res.status}` } }));
    return { data: json.data ?? null, error: json.error ?? null, status: res.status };
  } catch (e: any) {
    return { data: null, error: { message: e?.message ?? "Network error", code: "NETWORK" }, status: 0 };
  }
}

// ------------------------------------------------------------------ export
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const supabase: any = {
  from: (table: string) => new QueryBuilder(table),
  rpc,
  auth,
  storage,
  functions,
};
