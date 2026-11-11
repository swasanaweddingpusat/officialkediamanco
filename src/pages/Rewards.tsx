// /rewards — program loyalty & referral untuk client (akun email + password).
import { useMemo, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Gift, Share2, Copy, CalendarCheck, Sparkles, Loader2, LogOut, Coins, MessageCircle, CheckCircle2, History, Award } from 'lucide-react';
import { toast } from 'sonner';
import { Layout } from '@/components/layout/Layout';
import { Breadcrumbs } from '@/components/ota/OtaKit';
import { CMSImage } from '@/components/CMSImage';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/useAuth';
import { useSEO } from '@/hooks/useSEO';
import {
  useLoyaltyMe, useLoyaltyRewards, useLoyaltySettings, useJoinLoyalty, useRedeemReward,
  getStoredReferral, LEDGER_LABEL, REDEMPTION_STATUS, formatPoints, type LoyaltyReward,
} from '@/hooks/useLoyalty';
import { cn } from '@/lib/utils';

const fieldCls = 'mt-1.5 h-11 w-full rounded-xl border border-input bg-card px-3.5 text-sm outline-none focus:ring-2 focus:ring-ring';
const fmtDate = (d: string) => new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
const validPhone = (p: string) => { const d = p.replace(/\D/g, ''); return /^[+\d\s().-]+$/.test(p) && d.length >= 8 && d.length <= 15; };

function AuthPanel({ defaultRef }: { defaultRef: string | null }) {
  const { signIn, signUp } = useAuth();
  const join = useJoinLoyalty();
  const [mode, setMode] = useState<'daftar' | 'masuk'>('daftar');
  const [form, setForm] = useState({ name: '', phone: '', email: '', password: '', ref: defaultRef ?? '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    const email = form.email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setError('Masukkan email yang valid.');
    if (mode === 'daftar') {
      if (form.name.trim().length < 2) return setError('Masukkan nama lengkap.');
      if (!validPhone(form.phone.trim())) return setError('Nomor HP 8–15 digit.');
      if (form.password.length < 8) return setError('Password minimal 8 karakter.');
      if (form.ref.trim() && !/^[A-Za-z0-9]{6,12}$/.test(form.ref.trim())) return setError('Kode referral tidak valid.');
    }
    setBusy(true);
    try {
      if (mode === 'masuk') {
        const { error: err } = await signIn(email, form.password);
        if (err) setError(/invalid/i.test(err.message) ? 'Email atau password salah.' : err.message);
        return;
      }
      const { error: err } = await signUp(email, form.password);
      if (err) {
        setError(/already/i.test(err.message) ? 'Email sudah terdaftar. Silakan masuk.' : err.message);
        if (/already/i.test(err.message)) setMode('masuk');
        return;
      }
      await join.mutateAsync({ full_name: form.name.trim(), phone: form.phone.trim(), ref: form.ref.trim() || null });
      toast.success('Selamat bergabung di Kediaman Rewards!');
    } catch (err) {
      setError((err as Error).message || 'Gagal, coba lagi.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="ota-card p-5 md:p-6">
      <div role="tablist" className="grid grid-cols-2 gap-1 rounded-xl bg-muted p-1 mb-5">
        {(['daftar', 'masuk'] as const).map((m) => (
          <button key={m} type="button" role="tab" aria-selected={mode === m} onClick={() => { setMode(m); setError(''); }}
            className={cn('h-10 rounded-lg text-sm font-bold transition-colors', mode === m ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground')}>
            {m === 'daftar' ? 'Daftar gratis' : 'Masuk'}
          </button>
        ))}
      </div>
      <form onSubmit={submit} className="space-y-3.5" noValidate>
        {mode === 'daftar' && (
          <>
            <div><label htmlFor="rw-name" className="text-sm font-bold">Nama lengkap</label><input id="rw-name" autoComplete="name" value={form.name} onChange={set('name')} className={fieldCls} /></div>
            <div><label htmlFor="rw-phone" className="text-sm font-bold">Nomor HP (WhatsApp)</label><input id="rw-phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="08xxxxxxxxxx" value={form.phone} onChange={set('phone')} className={fieldCls} /></div>
          </>
        )}
        <div><label htmlFor="rw-email" className="text-sm font-bold">Email</label><input id="rw-email" type="email" autoComplete="email" value={form.email} onChange={set('email')} className={fieldCls} /></div>
        <div><label htmlFor="rw-pass" className="text-sm font-bold">Password</label><input id="rw-pass" type="password" autoComplete={mode === 'daftar' ? 'new-password' : 'current-password'} value={form.password} onChange={set('password')} className={fieldCls} />{mode === 'daftar' && <p className="mt-1 text-xs text-muted-foreground">Minimal 8 karakter.</p>}</div>
        {mode === 'daftar' && (
          <div><label htmlFor="rw-ref" className="text-sm font-bold">Kode referral teman <span className="font-normal text-muted-foreground">(opsional)</span></label><input id="rw-ref" value={form.ref} onChange={(e) => setForm({ ...form, ref: e.target.value.toUpperCase() })} placeholder="ANAT7K2P" className={cn(fieldCls, 'font-mono uppercase tracking-wider')} /></div>
        )}
        {error && <p className="text-sm font-semibold text-destructive" role="alert">{error}</p>}
        <button type="submit" disabled={busy} className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-extrabold text-sm inline-flex items-center justify-center gap-2 disabled:opacity-70">
          {busy && <Loader2 className="size-4 animate-spin" />}{mode === 'daftar' ? 'Daftar & dapatkan kode referral' : 'Masuk'}
        </button>
      </form>
    </div>
  );
}

function JoinPanel({ defaultRef }: { defaultRef: string | null }) {
  const join = useJoinLoyalty();
  const [form, setForm] = useState({ name: '', phone: '', ref: defaultRef ?? '' });
  const [error, setError] = useState('');
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (form.name.trim().length < 2) return setError('Masukkan nama lengkap.');
    if (!validPhone(form.phone.trim())) return setError('Nomor HP 8–15 digit.');
    try {
      await join.mutateAsync({ full_name: form.name.trim(), phone: form.phone.trim(), ref: form.ref.trim() || null });
      toast.success('Selamat bergabung di Kediaman Rewards!');
    } catch (err) {
      setError((err as Error).message || 'Gagal, coba lagi.');
    }
  };
  return (
    <form onSubmit={submit} className="ota-card p-5 md:p-6 space-y-3.5" noValidate>
      <div><h2 className="text-lg font-extrabold">Lengkapi data member</h2><p className="text-sm text-muted-foreground">Sekali saja, untuk membuat kode referral Anda.</p></div>
      <div><label htmlFor="jn-name" className="text-sm font-bold">Nama lengkap</label><input id="jn-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={fieldCls} /></div>
      <div><label htmlFor="jn-phone" className="text-sm font-bold">Nomor HP (WhatsApp)</label><input id="jn-phone" type="tel" inputMode="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={fieldCls} /></div>
      <div><label htmlFor="jn-ref" className="text-sm font-bold">Kode referral teman <span className="font-normal text-muted-foreground">(opsional)</span></label><input id="jn-ref" value={form.ref} onChange={(e) => setForm({ ...form, ref: e.target.value.toUpperCase() })} className={cn(fieldCls, 'font-mono uppercase tracking-wider')} /></div>
      {error && <p className="text-sm font-semibold text-destructive" role="alert">{error}</p>}
      <button type="submit" disabled={join.isPending} className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-extrabold text-sm inline-flex items-center justify-center gap-2 disabled:opacity-70">
        {join.isPending && <Loader2 className="size-4 animate-spin" />}Gabung sekarang
      </button>
    </form>
  );
}

const Rewards = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const { data: settings } = useLoyaltySettings();
  const { data: rewards = [], isLoading: rewardsLoading } = useLoyaltyRewards();
  const { data: me, isLoading: meLoading } = useLoyaltyMe(!!user);
  const redeem = useRedeemReward();
  const [confirm, setConfirm] = useState<LoyaltyReward | null>(null);
  const storedRef = useMemo(() => getStoredReferral(), []);

  const programName = settings?.program_name || 'Kediaman Rewards';
  const refPts = settings?.referral_points ?? 500;
  const bookPts = settings?.booking_points ?? 200;
  const member = me?.member ?? null;
  const balance = me?.balance ?? 0;
  const shareLink = member ? `${window.location.origin}/?ref=${member.referral_code}` : '';
  const shareText = member
    ? `Lagi cari venue nikahan/acara? Coba Kediaman, ballroom-nya bagus! Pakai kode referral aku *${member.referral_code}* atau buka ${shareLink}${settings?.referee_benefit ? ` — ${settings.referee_benefit}` : ''}`
    : '';

  useSEO({
    title: `${programName} — Program Referral & Loyalty | Kediaman`,
    description: `Ajak teman booking venue di Kediaman, kumpulkan poin, dan tukarkan dengan bonus menarik.`,
    url: 'https://kediaman.co/rewards',
    breadcrumbs: [{ name: 'Home', url: 'https://kediaman.co/' }, { name: 'Rewards', url: 'https://kediaman.co/rewards' }],
  });

  const copy = (text: string, label: string) => { navigator.clipboard?.writeText(text); toast.success(`${label} disalin`); };
  const doRedeem = async () => {
    if (!confirm) return;
    try {
      await redeem.mutateAsync(confirm.id);
      toast.success('Penukaran dikirim! Tim kami akan menghubungi Anda.');
      setConfirm(null);
    } catch (e) {
      toast.error((e as Error).message || 'Gagal menukar hadiah');
    }
  };

  const steps = [
    { icon: Sparkles, title: 'Daftar gratis', text: 'Buat akun dan dapatkan kode referral pribadi Anda.' },
    { icon: Share2, title: 'Ajak teman', text: `Teman booking pakai kode/link Anda. Dapat +${refPts.toLocaleString('id-ID')} poin saat booking-nya dikonfirmasi.` },
    { icon: CalendarCheck, title: 'Booking sendiri', text: `Booking saat login juga dapat +${bookPts.toLocaleString('id-ID')} poin setelah dikonfirmasi.` },
    { icon: Gift, title: 'Tukar bonus', text: 'Tukarkan poin dengan bonus menarik pilihan Anda.' },
  ];

  const accountArea = () => {
    if (authLoading || (user && meLoading)) return <Skeleton className="h-80 rounded-2xl" />;
    if (!user) return <AuthPanel defaultRef={storedRef} />;
    if (!member) return <JoinPanel defaultRef={storedRef} />;
    return (
      <div className="space-y-4">
        <div className="relative overflow-hidden rounded-2xl bg-primary text-primary-foreground p-5 md:p-6">
          <div className="pointer-events-none absolute -right-10 -top-10 size-44 rounded-full bg-gold/25 blur-2xl" aria-hidden="true" />
          <div className="relative flex items-start justify-between gap-3">
            <div>
              <p className="text-sm text-primary-foreground/75">Halo, {member.full_name.split(' ')[0]} 👋</p>
              <p className="mt-3 text-xs font-bold uppercase tracking-wider text-primary-foreground/60">Poin Anda</p>
              <p className="text-4xl md:text-5xl font-extrabold tracking-tight"><Coins className="inline size-8 mr-2 -mt-1 text-gold" aria-hidden="true" />{balance.toLocaleString('id-ID')}</p>
            </div>
            <button type="button" onClick={signOut} className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold hover:bg-white/20"><LogOut className="size-3.5" />Keluar</button>
          </div>
          <div className="relative mt-5 grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-white/10 p-3"><p className="text-2xl font-extrabold">{me?.stats?.referred ?? 0}</p><p className="text-xs text-primary-foreground/70">Teman booking</p></div>
            <div className="rounded-xl bg-white/10 p-3"><p className="text-2xl font-extrabold">{me?.stats?.confirmed ?? 0}</p><p className="text-xs text-primary-foreground/70">Sudah dikonfirmasi</p></div>
          </div>
        </div>

        <div className="ota-card p-5">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Kode referral Anda</p>
          <div className="mt-2 flex items-center gap-2">
            <span className="flex-1 rounded-xl border-2 border-dashed border-primary/40 bg-secondary/50 px-4 py-3 text-center font-mono text-2xl font-extrabold tracking-[0.2em] text-primary">{member.referral_code}</span>
            <button type="button" onClick={() => copy(member.referral_code, 'Kode')} className="grid place-items-center size-12 rounded-xl border border-input hover:bg-muted" aria-label="Salin kode referral"><Copy className="size-4" /></button>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <a href={`https://wa.me/?text=${encodeURIComponent(shareText)}`} target="_blank" rel="noopener noreferrer" className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary text-sm font-bold text-primary-foreground"><MessageCircle className="size-4" />Bagikan ke WA</a>
            <button type="button" onClick={() => copy(shareLink, 'Link')} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-input text-sm font-bold hover:bg-muted"><Share2 className="size-4" />Salin link</button>
          </div>
          {settings?.referee_benefit && <p className="mt-3 text-xs text-muted-foreground">Untuk teman Anda: {settings.referee_benefit}</p>}
        </div>

        <div className="ota-card p-5">
          <Tabs defaultValue="poin">
            <TabsList className="grid grid-cols-2 w-full">
              <TabsTrigger value="poin"><History className="size-4 mr-1.5" />Riwayat poin</TabsTrigger>
              <TabsTrigger value="tukar"><Award className="size-4 mr-1.5" />Penukaran</TabsTrigger>
            </TabsList>
            <TabsContent value="poin">
              {(me?.ledger ?? []).length === 0 ? <p className="py-6 text-center text-sm text-muted-foreground">Belum ada poin. Bagikan kode Anda untuk mulai!</p> : (
                <ul className="divide-y divide-border">
                  {me!.ledger!.map((l) => (
                    <li key={l.id} className="py-2.5 flex items-center gap-3">
                      <div className="flex-1 min-w-0"><p className="text-sm font-semibold truncate">{l.description || LEDGER_LABEL[l.type]}</p><p className="text-xs text-muted-foreground">{LEDGER_LABEL[l.type] ?? l.type} · {fmtDate(l.created_at)}</p></div>
                      <span className={cn('text-sm font-extrabold', l.points >= 0 ? 'text-primary' : 'text-destructive')}>{l.points >= 0 ? '+' : ''}{l.points.toLocaleString('id-ID')}</span>
                    </li>
                  ))}
                </ul>
              )}
            </TabsContent>
            <TabsContent value="tukar">
              {(me?.redemptions ?? []).length === 0 ? <p className="py-6 text-center text-sm text-muted-foreground">Belum ada penukaran.</p> : (
                <ul className="divide-y divide-border">
                  {me!.redemptions!.map((r) => {
                    const st = REDEMPTION_STATUS[r.status] ?? REDEMPTION_STATUS.pending;
                    return (
                      <li key={r.id} className="py-2.5 flex items-center gap-3">
                        <div className="flex-1 min-w-0"><p className="text-sm font-semibold truncate">{r.reward_name}</p><p className="text-xs text-muted-foreground">{formatPoints(r.points_cost)} · {fmtDate(r.created_at)}</p></div>
                        <span className={st.tone}>{st.label}</span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    );
  };

  return (
    <Layout>
      {/* Hero */}
      <section className="relative overflow-hidden bg-primary text-primary-foreground">
        <div className="pointer-events-none absolute -right-24 -top-24 size-96 rounded-full bg-gold/20 blur-3xl" aria-hidden="true" />
        <div className="pointer-events-none absolute -left-16 bottom-0 size-72 rounded-full bg-white/10 blur-3xl" aria-hidden="true" />
        <div className="ota-container relative py-8 md:py-14">
          <Breadcrumbs items={[{ name: 'Rewards' }]} className="mb-6 [&_a]:text-primary-foreground/70 [&_[aria-current]]:text-primary-foreground text-primary-foreground/70" />
          <p className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-wide"><Gift className="size-3.5" />{programName}</p>
          <h1 className="mt-4 text-3xl md:text-5xl font-extrabold tracking-tight leading-[1.1] max-w-2xl">Ajak teman, kumpulkan poin, tukar bonus menarik</h1>
          <p className="mt-4 text-primary-foreground/80 max-w-xl">Setiap teman yang booking venue Kediaman lewat kode Anda memberi <span className="font-extrabold text-gold">+{refPts.toLocaleString('id-ID')} poin</span>. Kumpulkan dan tukarkan dengan bonus untuk acara Anda.</p>
          <ol className="mt-8 grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {steps.map((s, i) => (
              <li key={s.title} className="rounded-2xl bg-white/[0.07] ring-1 ring-white/10 p-4">
                <span className="flex items-center gap-2"><span className="grid place-items-center size-8 rounded-full bg-gold text-primary text-sm font-extrabold">{i + 1}</span><s.icon className="size-4 text-gold" aria-hidden="true" /></span>
                <p className="mt-3 font-extrabold">{s.title}</p>
                <p className="mt-1 text-sm text-primary-foreground/75">{s.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <div className="ota-container py-8 md:py-12">
        {settings && !settings.is_enabled && (
          <p className="mb-6 rounded-xl bg-accent p-4 text-sm font-semibold text-accent-foreground">Program rewards sedang dijeda. Poin Anda tetap aman.</p>
        )}
        <div className="grid lg:grid-cols-5 gap-6 items-start">
          <div id="akun" className="lg:col-span-2 lg:sticky lg:top-32 scroll-mt-32">{accountArea()}</div>

          <section className="lg:col-span-3">
            <div className="flex items-end justify-between gap-3 mb-4">
              <div><h2 className="text-xl md:text-2xl font-extrabold">Katalog bonus</h2><p className="text-sm text-muted-foreground">Tukarkan poin dengan hadiah untuk hari spesial Anda.</p></div>
            </div>
            {rewardsLoading ? (
              <div className="grid sm:grid-cols-2 gap-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-64 rounded-2xl" />)}</div>
            ) : rewards.length === 0 ? (
              <div className="ota-card p-8 text-center"><Gift className="size-10 mx-auto text-muted-foreground" /><p className="mt-3 font-extrabold">Katalog bonus segera hadir</p><p className="text-sm text-muted-foreground">Mulai kumpulkan poin dari sekarang.</p></div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-4">
                {rewards.map((rw) => {
                  const soldOut = rw.stock !== null && rw.stock <= 0;
                  const enough = balance >= rw.points_cost;
                  const progress = member ? Math.min(100, Math.round((balance / rw.points_cost) * 100)) : 0;
                  return (
                    <article key={rw.id} className="group ota-card overflow-hidden flex flex-col">
                      <div className="relative aspect-[16/10] bg-secondary">
                        {rw.image_url ? <CMSImage src={rw.image_url} imageWidth={600} sizes="(max-width: 640px) 100vw, 360px" alt="" className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                          : <div className="absolute inset-0 grid place-items-center"><Gift className="size-12 text-primary/40" aria-hidden="true" /></div>}
                        <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-gold px-2.5 py-1 text-xs font-extrabold text-primary"><Coins className="size-3.5" />{rw.points_cost.toLocaleString('id-ID')}</span>
                        {rw.stock !== null && <span className="absolute right-3 top-3 rounded-full bg-card/95 px-2.5 py-1 text-[11px] font-bold">{soldOut ? 'Habis' : `Sisa ${rw.stock}`}</span>}
                      </div>
                      <div className="p-4 flex flex-col gap-2 flex-1">
                        <h3 className="font-extrabold leading-snug">{rw.name}</h3>
                        {rw.description && <p className="text-sm text-muted-foreground line-clamp-3">{rw.description}</p>}
                        {member && !enough && !soldOut && (
                          <div className="mt-1">
                            <div className="h-1.5 rounded-full bg-muted overflow-hidden"><div className="h-full rounded-full bg-gold" style={{ width: `${progress}%` }} /></div>
                            <p className="mt-1 text-[11px] text-muted-foreground">Kurang {(rw.points_cost - balance).toLocaleString('id-ID')} poin</p>
                          </div>
                        )}
                        <div className="mt-auto pt-2">
                          {!member ? (
                            <a href="#akun" className="inline-flex w-full h-10 items-center justify-center rounded-xl border border-primary text-sm font-bold text-primary">{user ? 'Gabung untuk menukar' : 'Daftar untuk menukar'}</a>
                          ) : (
                            <button type="button" disabled={!enough || soldOut || !settings?.is_enabled} onClick={() => setConfirm(rw)}
                              className="w-full h-10 rounded-xl bg-primary text-primary-foreground text-sm font-extrabold disabled:bg-muted disabled:text-muted-foreground">
                              {soldOut ? 'Stok habis' : enough ? 'Tukar sekarang' : 'Poin belum cukup'}
                            </button>
                          )}
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}

            <div className="mt-8 ota-card px-5">
              <Accordion type="single" collapsible>
                <AccordionItem value="cara"><AccordionTrigger className="font-bold hover:no-underline">Kapan poin masuk?</AccordionTrigger><AccordionContent className="text-muted-foreground">Poin masuk otomatis setelah tim Kediaman mengonfirmasi booking (bukan saat form dikirim). Poin referral berlaku bila teman booking memakai link/kode Anda atau mendaftar dengan kode Anda.</AccordionContent></AccordionItem>
                <AccordionItem value="tukar"><AccordionTrigger className="font-bold hover:no-underline">Bagaimana proses penukaran?</AccordionTrigger><AccordionContent className="text-muted-foreground">Pilih bonus lalu klik Tukar. Poin langsung dipotong dan tim kami memproses serta menghubungi Anda. Bila penukaran tidak bisa diproses, poin dikembalikan penuh.</AccordionContent></AccordionItem>
                {settings?.terms && <AccordionItem value="sk"><AccordionTrigger className="font-bold hover:no-underline">Syarat & ketentuan</AccordionTrigger><AccordionContent className="text-muted-foreground whitespace-pre-line">{settings.terms}</AccordionContent></AccordionItem>}
              </Accordion>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">Siap booking? <Link to="/lokasi" className="font-bold text-primary hover:underline">Cari venue</Link> — login dulu agar booking Anda ikut menambah poin.</p>
          </section>
        </div>
      </div>

      <Dialog open={!!confirm} onOpenChange={(o) => !o && setConfirm(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Tukar {confirm?.name}?</DialogTitle>
            <DialogDescription>{confirm ? `${formatPoints(confirm.points_cost)} akan dipotong dari saldo Anda (${formatPoints(balance)}).` : ''}</DialogDescription>
          </DialogHeader>
          {confirm?.terms && <p className="text-xs text-muted-foreground whitespace-pre-line">{confirm.terms}</p>}
          <DialogFooter className="gap-2">
            <button type="button" onClick={() => setConfirm(null)} className="h-10 px-4 rounded-xl border border-input text-sm font-bold">Batal</button>
            <button type="button" onClick={doRedeem} disabled={redeem.isPending} className="h-10 px-4 rounded-xl bg-primary text-primary-foreground text-sm font-extrabold inline-flex items-center gap-2 disabled:opacity-70">
              {redeem.isPending ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}Ya, tukar
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default Rewards;
