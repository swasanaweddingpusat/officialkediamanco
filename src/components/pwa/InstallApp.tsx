// Tombol & banner "Pasang aplikasi" + panduan pemasangan iPhone/Android.
import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Download, Share, SquarePlus, X, MoreVertical, Smartphone, Check } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useInstallApp } from '@/lib/pwa';
import { cn } from '@/lib/utils';

const DISMISS_KEY = 'kdm_install_dismissed_at';
const VISITS_KEY = 'kdm_visits';
const DISMISS_DAYS = 14;

const readNum = (k: string) => { try { return Number(localStorage.getItem(k) ?? 0) || 0; } catch { return 0; } };
const writeNum = (k: string, v: number) => { try { localStorage.setItem(k, String(v)); } catch { /* mode privat */ } };

export function InstallSteps({ platform, iosNeedsSafari }: { platform: string; iosNeedsSafari?: boolean }) {
  if (platform === 'ios') {
    return (
      <ol className="space-y-3 text-sm">
        {iosNeedsSafari && (
          <li className="rounded-xl bg-muted p-3 font-semibold">Buka halaman ini di <b>Safari</b> dulu — di iPhone, aplikasi hanya bisa dipasang lewat Safari.</li>
        )}
        <li className="flex gap-3"><Step n={1} /><span>Ketuk tombol <b>Bagikan</b> <Share className="inline size-4 -mt-0.5" aria-label="ikon Bagikan" /> di bawah layar Safari.</span></li>
        <li className="flex gap-3"><Step n={2} /><span>Gulir lalu pilih <b>Tambah ke Layar Utama</b> <SquarePlus className="inline size-4 -mt-0.5" aria-hidden="true" />.</span></li>
        <li className="flex gap-3"><Step n={3} /><span>Ketuk <b>Tambah</b>. Ikon Kediaman muncul di layar utama iPhone kamu.</span></li>
      </ol>
    );
  }
  return (
    <ol className="space-y-3 text-sm">
      <li className="flex gap-3"><Step n={1} /><span>Buka halaman ini di <b>Chrome</b>, lalu ketuk menu <MoreVertical className="inline size-4 -mt-0.5" aria-label="ikon menu" /> di pojok kanan atas.</span></li>
      <li className="flex gap-3"><Step n={2} /><span>Pilih <b>Instal aplikasi</b> atau <b>Tambahkan ke layar utama</b>.</span></li>
      <li className="flex gap-3"><Step n={3} /><span>Ketuk <b>Instal</b>. Aplikasi Kediaman muncul di layar utama & daftar aplikasi.</span></li>
    </ol>
  );
}

const Step = ({ n }: { n: number }) => (
  <span className="grid place-items-center size-6 shrink-0 rounded-full bg-primary text-primary-foreground text-xs font-bold">{n}</span>
);

/** Tombol yang membuka dialog pasang bawaan (Android) atau panduan (iPhone/lainnya). */
export function InstallAppButton({ className, label = 'Pasang aplikasi', onDone }: { className?: string; label?: string; onDone?: () => void }) {
  const { installed, canPrompt, platform, iosNeedsSafari, install } = useInstallApp();
  const [guide, setGuide] = useState(false);
  if (installed) {
    return <span className={cn('inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground', className)}><Check className="size-4" /> Aplikasi sudah terpasang</span>;
  }
  const onClick = async () => {
    if (canPrompt) {
      const r = await install();
      if (r !== 'unavailable') { onDone?.(); return; }
    }
    setGuide(true);
  };
  return (
    <>
      <button type="button" onClick={onClick} className={className}>
        <Download className="size-4" aria-hidden="true" /> {label}
      </button>
      <Dialog open={guide} onOpenChange={setGuide}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Pasang aplikasi Kediaman</DialogTitle>
            <DialogDescription>Gratis, ringan, dan tidak perlu lewat Play Store / App Store.</DialogDescription>
          </DialogHeader>
          <InstallSteps platform={platform === 'ios' ? 'ios' : 'android'} iosNeedsSafari={iosNeedsSafari} />
        </DialogContent>
      </Dialog>
    </>
  );
}

/** Banner kecil di HP: muncul mulai kunjungan ke-2 (atau setelah 25 detik), bisa ditutup 14 hari. */
export function InstallAppBanner() {
  const { installed, canPrompt, platform } = useInstallApp();
  const { pathname } = useLocation();
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (installed || pathname.startsWith('/admin') || pathname === '/aplikasi') { setShow(false); return; }
    if (platform !== 'ios' && platform !== 'android') return;
    if (platform === 'android' && !canPrompt) return;           // tunggu browser siap
    const dismissed = readNum(DISMISS_KEY);
    if (dismissed && Date.now() - dismissed < DISMISS_DAYS * 864e5) return;
    const visits = readNum(VISITS_KEY);
    if (visits >= 1) { setShow(true); return; }
    const t = window.setTimeout(() => setShow(true), 25_000);
    return () => window.clearTimeout(t);
  }, [installed, canPrompt, platform, pathname]);

  useEffect(() => {
    // hitung kunjungan sekali per sesi tab
    try {
      if (!sessionStorage.getItem('kdm_visit_counted')) {
        sessionStorage.setItem('kdm_visit_counted', '1');
        writeNum(VISITS_KEY, readNum(VISITS_KEY) + 1);
      }
    } catch { /* abaikan */ }
  }, []);

  useEffect(() => {
    // Geser tombol chat ke atas selama banner tampil (lihat .kdm-install-banner di index.css)
    document.documentElement.classList.toggle('kdm-install-banner', show);
    return () => document.documentElement.classList.remove('kdm-install-banner');
  }, [show]);

  if (!show) return null;
  const close = () => { writeNum(DISMISS_KEY, Date.now()); setShow(false); };
  return (
    <div role="region" aria-label="Pasang aplikasi"
      className="md:hidden fixed inset-x-3 z-[45] bottom-[calc(4.75rem+env(safe-area-inset-bottom))] rounded-2xl border border-border bg-card shadow-xl p-3.5 flex items-center gap-3 animate-in slide-in-from-bottom-4 fade-in duration-300">
      <img src="/icons/icon-192.png" alt="" className="size-11 rounded-xl" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-extrabold leading-tight">Pasang aplikasi Kediaman</p>
        <p className="text-xs text-muted-foreground leading-snug">Cek venue & jadwal lebih cepat dari layar utama.</p>
      </div>
      <InstallAppButton label="Pasang" onDone={close}
        className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-primary px-3.5 text-xs font-bold text-primary-foreground" />
      <button type="button" onClick={close} aria-label="Tutup" className="grid size-8 shrink-0 place-items-center rounded-full text-muted-foreground hover:bg-muted">
        <X className="size-4" />
      </button>
    </div>
  );
}

/** Kartu ajakan untuk footer / halaman lain. */
export function InstallAppLink({ className }: { className?: string }) {
  const { installed } = useInstallApp();
  if (installed) return null;
  return (
    <Link to="/aplikasi" className={cn('inline-flex items-center gap-2', className)}>
      <Smartphone className="size-4" aria-hidden="true" /> Aplikasi Kediaman
    </Link>
  );
}
