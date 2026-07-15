import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Layout } from "@/components/layout/Layout";
import { Loader2, ShieldCheck } from "lucide-react";

// Beta OAuth namespace on supabase-js — type it locally so TS is happy.
type OAuthClient = { name?: string; client_name?: string; redirect_uri?: string };
type AuthDetails = { client?: OAuthClient; scope?: string; redirect_url?: string; redirect_to?: string };
type OAuthApi = {
  getAuthorizationDetails: (id: string) => Promise<{ data: AuthDetails | null; error: { message: string } | null }>;
  approveAuthorization: (id: string) => Promise<{ data: { redirect_url?: string; redirect_to?: string } | null; error: { message: string } | null }>;
  denyAuthorization: (id: string) => Promise<{ data: { redirect_url?: string; redirect_to?: string } | null; error: { message: string } | null }>;
};
const oauth = (supabase.auth as unknown as { oauth: OAuthApi }).oauth;

export default function OAuthConsent() {
  const [params] = useSearchParams();
  const authorizationId = params.get("authorization_id") ?? "";
  const [details, setDetails] = useState<AuthDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      if (!authorizationId) {
        setError("Missing authorization_id");
        return;
      }
      const { data: sess } = await supabase.auth.getSession();
      if (!sess.session) {
        const next = window.location.pathname + window.location.search;
        window.location.href = "/auth?next=" + encodeURIComponent(next);
        return;
      }
      const { data, error } = await oauth.getAuthorizationDetails(authorizationId);
      if (!active) return;
      if (error) {
        setError(error.message);
        return;
      }
      const immediate = data?.redirect_url ?? data?.redirect_to;
      if (immediate && !data?.client) {
        window.location.href = immediate;
        return;
      }
      setDetails(data);
    })();
    return () => {
      active = false;
    };
  }, [authorizationId]);

  async function decide(approve: boolean) {
    setBusy(true);
    const { data, error } = approve
      ? await oauth.approveAuthorization(authorizationId)
      : await oauth.denyAuthorization(authorizationId);
    if (error) {
      setBusy(false);
      setError(error.message);
      return;
    }
    const target = data?.redirect_url ?? data?.redirect_to;
    if (!target) {
      setBusy(false);
      setError("No redirect returned by the authorization server.");
      return;
    }
    window.location.href = target;
  }

  const clientName = details?.client?.name ?? details?.client?.client_name ?? "an application";

  return (
    <Layout>
      <div className="min-h-[calc(100vh-5rem)] flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-card border border-border rounded-2xl p-8 shadow-xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-primary/10 rounded-lg">
              <ShieldCheck className="w-6 h-6 text-primary" />
            </div>
            <h1 className="font-serif text-2xl font-bold">Otorisasi Akses</h1>
          </div>

          {error && (
            <div className="text-sm text-destructive mb-4">
              Tidak dapat memuat permintaan otorisasi: {error}
            </div>
          )}

          {!error && !details && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" /> Memuat…
            </div>
          )}

          {details && (
            <>
              <p className="text-base mb-2">
                Hubungkan <strong>{clientName}</strong> ke akun Anda di Kediaman Corp.
              </p>
              <p className="text-sm text-muted-foreground mb-6">
                Aplikasi ini akan dapat memanggil tool Kediaman Corp yang tersedia
                selama Anda tetap masuk. Izin data tetap dibatasi oleh kebijakan
                akses akun Anda (RLS).
              </p>
              {details.client?.redirect_uri && (
                <p className="text-xs text-muted-foreground mb-6 break-all">
                  Redirect URI: <code>{details.client.redirect_uri}</code>
                </p>
              )}
              <div className="flex gap-3">
                <Button onClick={() => decide(true)} disabled={busy} className="flex-1">
                  Setujui
                </Button>
                <Button onClick={() => decide(false)} disabled={busy} variant="outline" className="flex-1">
                  Tolak
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </Layout>
  );
}
