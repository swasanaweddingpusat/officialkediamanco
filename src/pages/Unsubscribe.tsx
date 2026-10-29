// /berhenti-langganan?token=... — tautan di setiap email newsletter.
import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { MailX, CheckCircle2, Loader2 } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { supabase } from '@/integrations/supabase/client';
import { useSEO } from '@/hooks/useSEO';

const Unsubscribe = () => {
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const [state, setState] = useState<'loading' | 'done' | 'invalid'>(token ? 'loading' : 'invalid');
  const ran = useRef(false);

  useSEO({ title: 'Berhenti berlangganan | Kediaman', description: 'Berhenti berlangganan newsletter Kediaman.', url: 'https://kediaman.co/berhenti-langganan' });

  useEffect(() => {
    if (!token || ran.current) return;
    ran.current = true;
    supabase.functions.invoke('newsletter-unsubscribe', { body: { token } }).then(({ data, error }) => {
      setState(!error && (data as { ok?: boolean } | null)?.ok ? 'done' : 'invalid');
    });
  }, [token]);

  return (
    <Layout>
      <div className="ota-container py-16 md:py-24">
        <div className="ota-card max-w-md mx-auto p-8 text-center">
          {state === 'loading' && (
            <><Loader2 className="size-10 mx-auto animate-spin text-primary" aria-hidden="true" /><p className="mt-4 font-semibold">Memproses…</p></>
          )}
          {state === 'done' && (
            <>
              <CheckCircle2 className="size-12 mx-auto text-primary" aria-hidden="true" />
              <h1 className="mt-4 text-2xl font-extrabold">Anda sudah berhenti berlangganan</h1>
              <p className="mt-2 text-sm text-muted-foreground">Kami tidak akan mengirim newsletter lagi ke email Anda. Ingin kembali? Daftar ulang kapan saja di beranda.</p>
            </>
          )}
          {state === 'invalid' && (
            <>
              <MailX className="size-12 mx-auto text-muted-foreground" aria-hidden="true" />
              <h1 className="mt-4 text-2xl font-extrabold">Tautan tidak valid</h1>
              <p className="mt-2 text-sm text-muted-foreground">Tautan berhenti berlangganan sudah tidak berlaku atau salah. Hubungi kami jika masih menerima email yang tidak diinginkan.</p>
            </>
          )}
          <Link to="/" className="mt-6 inline-flex h-11 items-center px-6 rounded-xl bg-primary text-primary-foreground font-bold text-sm">Kembali ke beranda</Link>
        </div>
      </div>
    </Layout>
  );
};

export default Unsubscribe;
