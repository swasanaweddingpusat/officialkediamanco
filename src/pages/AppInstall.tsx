// /aplikasi — halaman unduh/pasang aplikasi Kediaman (PWA) untuk Android & iPhone.
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Zap, BellRing, WifiOff, HardDrive, Check, Smartphone, Apple } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Breadcrumbs } from '@/components/ota/OtaKit';
import { InstallAppButton, InstallSteps } from '@/components/pwa/InstallApp';
import { useInstallApp } from '@/lib/pwa';
import { useSEO } from '@/hooks/useSEO';
import { cn } from '@/lib/utils';

const BENEFITS = [
  { icon: Zap, title: 'Buka sekali ketuk', text: 'Ikon Kediaman langsung di layar utama, tampil layar penuh seperti aplikasi biasa.' },
  { icon: HardDrive, title: 'Ringan', text: 'Tidak sampai 1 MB dan tidak memenuhi memori HP.' },
  { icon: WifiOff, title: 'Tetap bisa dibuka', text: 'Halaman venue yang pernah dilihat tetap tampil saat sinyal lemah.' },
  { icon: BellRing, title: 'Selalu terbaru', text: 'Promo, paket, dan jadwal ikut diperbarui otomatis tanpa update manual.' },
];

const AppInstall = () => {
  const { installed, platform, iosNeedsSafari } = useInstallApp();
  const [tab, setTab] = useState<'android' | 'ios'>(platform === 'ios' ? 'ios' : 'android');

  useSEO({
    title: 'Aplikasi Kediaman untuk Android & iPhone',
    description: 'Pasang aplikasi Kediaman gratis di Android dan iPhone: cari venue & ballroom, cek jadwal, lihat paket, dan booking langsung dari layar utama HP.',
    url: 'https://kediaman.co/aplikasi',
    breadcrumbs: [{ name: 'Home', url: 'https://kediaman.co/' }, { name: 'Aplikasi', url: 'https://kediaman.co/aplikasi' }],
  });

  return (
    <Layout>
      <section className="relative overflow-hidden bg-primary text-primary-foreground">
        <div className="pointer-events-none absolute -right-24 -top-24 size-96 rounded-full bg-gold/20 blur-3xl" aria-hidden="true" />
        <div className="ota-container relative py-8 md:py-14 grid md:grid-cols-[1.2fr_1fr] gap-10 items-center">
          <div>
            <Breadcrumbs items={[{ name: 'Aplikasi' }]} className="mb-6 [&_a]:text-primary-foreground/70 text-primary-foreground/70" />
            <p className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-wide"><Smartphone className="size-3.5" />Android & iPhone</p>
            <h1 className="mt-4 text-3xl md:text-5xl font-extrabold tracking-tight leading-[1.1] max-w-xl">Kediaman, langsung dari layar utama HP kamu</h1>
            <p className="mt-4 max-w-lg text-primary-foreground/80">Cari venue, cek jadwal, bandingkan paket, dan pantau status booking — lebih cepat, tanpa buka browser.</p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              {installed ? (
                <span className="inline-flex h-12 items-center gap-2 rounded-xl bg-white/10 px-5 text-sm font-bold"><Check className="size-4" /> Aplikasi sudah terpasang di perangkat ini</span>
              ) : (
                <InstallAppButton label="Pasang aplikasi gratis"
                  className="inline-flex h-12 items-center gap-2 rounded-xl bg-gold px-6 text-sm font-extrabold text-primary hover:brightness-105" />
              )}
              <a href="#cara-pasang" className="inline-flex h-12 items-center rounded-xl border border-white/30 px-5 text-sm font-bold hover:bg-white/10">Lihat cara pasang</a>
            </div>
          </div>

          {/* Mockup ponsel */}
          <div className="hidden md:flex justify-center" aria-hidden="true">
            <div className="relative w-64 aspect-[9/19] rounded-[2.5rem] bg-black/40 p-2.5 shadow-2xl ring-1 ring-white/15">
              <div className="h-full w-full rounded-[2rem] bg-background overflow-hidden flex flex-col">
                <div className="h-14 bg-card border-b border-border flex items-center gap-2 px-4">
                  <img src="/icons/icon-192.png" alt="" className="size-7 rounded-lg" />
                  <span className="text-sm font-extrabold text-foreground">Kediaman</span>
                </div>
                <div className="p-3 space-y-2.5 flex-1">
                  <div className="h-24 rounded-xl bg-primary/85" />
                  <div className="grid grid-cols-2 gap-2">
                    {[0, 1, 2, 3].map((i) => <div key={i} className="h-20 rounded-xl bg-muted" />)}
                  </div>
                  <div className="h-10 rounded-xl bg-muted" />
                </div>
                <div className="h-12 border-t border-border grid grid-cols-5">
                  {[0, 1, 2, 3, 4].map((i) => <span key={i} className={cn('m-auto size-2 rounded-full', i === 0 ? 'bg-primary' : 'bg-muted-foreground/30')} />)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="ota-container py-10 md:py-14 space-y-12">
        <section className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {BENEFITS.map((b) => (
            <div key={b.title} className="ota-card p-5">
              <span className="grid place-items-center size-11 rounded-xl bg-secondary text-primary"><b.icon className="size-5" aria-hidden="true" /></span>
              <h2 className="mt-3 font-extrabold">{b.title}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{b.text}</p>
            </div>
          ))}
        </section>

        <section id="cara-pasang" className="scroll-mt-32 max-w-2xl">
          <h2 className="text-2xl font-extrabold">Cara pasang</h2>
          <p className="mt-1 text-sm text-muted-foreground">Pilih jenis HP kamu.</p>
          <div role="tablist" aria-label="Jenis HP" className="mt-5 inline-flex rounded-full bg-muted p-1">
            {([['android', 'Android', Smartphone], ['ios', 'iPhone / iPad', Apple]] as const).map(([id, label, Icon]) => (
              <button key={id} type="button" role="tab" aria-selected={tab === id} onClick={() => setTab(id)}
                className={cn('inline-flex h-10 items-center gap-2 rounded-full px-4 text-sm font-bold transition-colors', tab === id ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground')}>
                <Icon className="size-4" aria-hidden="true" />{label}
              </button>
            ))}
          </div>
          <div className="mt-5 ota-card p-5 md:p-6">
            <InstallSteps platform={tab} iosNeedsSafari={tab === 'ios' && iosNeedsSafari} />
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            Butuh bantuan? <Link to="/bantuan" className="font-semibold text-primary underline-offset-2 hover:underline">Hubungi tim kami</Link>.
          </p>
        </section>
      </div>
    </Layout>
  );
};

export default AppInstall;
