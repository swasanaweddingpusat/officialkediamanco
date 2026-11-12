// Tampilan saat halaman sedang dimuat & penangkap error halaman (pengganti layar putih kosong).
import { Component, type ReactNode } from 'react';
import { reloadForNewVersion } from '@/lib/lazy-page';

/** Kerangka ringan: bilah header + indikator pemuatan, langsung tampil tanpa menunggu data. */
export function RouteFallback() {
  return (
    <div className="min-h-screen bg-background" aria-busy="true" aria-live="polite">
      <div className="fixed inset-x-0 top-0 z-[60] h-0.5 overflow-hidden bg-primary/10">
        <div className="h-full w-1/3 bg-primary animate-[kdm-progress_1.1s_ease-in-out_infinite]" />
      </div>
      <div className="h-16 border-b border-border bg-card">
        <div className="ota-container flex h-full items-center gap-3">
          <img src="/icons/icon-192.png" alt="" className="size-9 rounded-lg" />
          <span className="h-4 w-28 rounded-full bg-muted animate-pulse" />
          <span className="ml-auto hidden h-10 w-72 rounded-full bg-muted animate-pulse md:block" />
        </div>
      </div>
      <div className="ota-container space-y-4 py-8">
        <div className="h-48 rounded-2xl bg-muted animate-pulse md:h-72" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => <div key={i} className="h-40 rounded-2xl bg-muted animate-pulse" />)}
        </div>
      </div>
      <span className="sr-only">Memuat halaman…</span>
    </div>
  );
}

type State = { error: Error | null };

/** Bila halaman gagal dimuat/dirender: tampilkan pesan + tombol muat ulang, bukan layar putih. */
export class RouteErrorBoundary extends Component<{ children: ReactNode; resetKey?: string }, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error) {
    console.error('Halaman gagal dimuat:', error);
    if (/dynamically imported module|Importing a module script failed|ChunkLoadError/i.test(error.message)) reloadForNewVersion();
  }

  componentDidUpdate(prev: { resetKey?: string }) {
    if (this.state.error && prev.resetKey !== this.props.resetKey) this.setState({ error: null });
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="min-h-screen grid place-items-center bg-background px-4 text-center">
        <div className="max-w-sm">
          <img src="/icons/icon-192.png" alt="" className="mx-auto size-14 rounded-2xl" />
          <h1 className="mt-4 text-xl font-extrabold">Halaman belum bisa ditampilkan</h1>
          <p className="mt-2 text-sm text-muted-foreground">Mungkin koneksi sedang lemah atau ada versi website yang lebih baru. Coba muat ulang.</p>
          <button type="button" onClick={() => window.location.reload()} className="mt-5 inline-flex h-11 items-center rounded-xl bg-primary px-5 text-sm font-bold text-primary-foreground">
            Muat ulang
          </button>
        </div>
      </div>
    );
  }
}
