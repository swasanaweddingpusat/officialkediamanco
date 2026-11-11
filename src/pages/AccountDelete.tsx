// /hapus-akun — hapus akun Kediaman (Rewards) secara mandiri. Wajib untuk Play Store & App Store.
import { FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import { Trash2, ShieldCheck, Loader2, CheckCircle2 } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Breadcrumbs } from '@/components/ota/OtaKit';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { useSiteSettings } from '@/hooks/useCMS';
import { useSEO } from '@/hooks/useSEO';
import { supabase } from '@/integrations/supabase/client';

const AccountDelete = () => {
  const { user, loading, signOut } = useAuth();
  const { data: settings } = useSiteSettings();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  useSEO({
    title: 'Hapus Akun | Kediaman',
    description: 'Cara menghapus akun Kediaman beserta data Kediaman Rewards Anda.',
    url: 'https://kediaman.co/hapus-akun',
  });

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (confirm.trim().toUpperCase() !== 'HAPUS') { setError('Ketik HAPUS (huruf besar) untuk konfirmasi.'); return; }
    setBusy(true);
    try {
      const { error: err } = await supabase.functions.invoke('account/delete', { body: { password, confirm } });
      if (err) { setError(err.message || 'Gagal menghapus akun. Coba lagi.'); return; }
      setDone(true);
      await signOut();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Layout>
      <div className="ota-container py-8 md:py-12 max-w-2xl">
        <Breadcrumbs items={[{ name: 'Hapus akun' }]} className="mb-6" />
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">Hapus akun</h1>
        <p className="mt-3 text-muted-foreground">
          Akun Kediaman dipakai untuk program <Link to="/rewards" className="font-semibold text-primary hover:underline">Kediaman Rewards</Link>.
          Anda bisa menghapusnya kapan saja dari halaman ini, di website maupun di aplikasi.
        </p>

        <section className="mt-6 ota-card p-5 md:p-6 space-y-3 text-sm">
          <h2 className="font-extrabold text-base flex items-center gap-2"><ShieldCheck className="size-5 text-primary" aria-hidden="true" />Yang terjadi saat akun dihapus</h2>
          <ul className="list-disc pl-5 space-y-1.5 text-muted-foreground">
            <li>Email login, password, profil Rewards (nama, nomor HP, kode referral), saldo poin, dan riwayat penukaran <b className="text-foreground">dihapus permanen</b> saat itu juga.</li>
            <li>Poin yang belum ditukar ikut hangus dan tidak bisa dikembalikan.</li>
            <li>Data booking venue yang pernah Anda ajukan tetap disimpan tim Kediaman untuk keperluan kontrak, pembayaran, dan pajak, tetapi tidak lagi terhubung ke akun.</li>
          </ul>
        </section>

        <section className="mt-6 ota-card p-5 md:p-6">
          {done ? (
            <div className="text-center py-4">
              <CheckCircle2 className="mx-auto size-10 text-primary" aria-hidden="true" />
              <h2 className="mt-3 text-lg font-extrabold">Akun Anda sudah dihapus</h2>
              <p className="mt-1 text-sm text-muted-foreground">Terima kasih pernah bergabung di Kediaman Rewards.</p>
              <Link to="/" className="mt-4 inline-flex h-11 items-center rounded-xl bg-primary px-5 text-sm font-bold text-primary-foreground">Kembali ke beranda</Link>
            </div>
          ) : loading ? (
            <p className="text-sm text-muted-foreground">Memuat…</p>
          ) : !user ? (
            <div className="space-y-3 text-sm">
              <h2 className="text-base font-extrabold">Masuk dulu untuk menghapus akun</h2>
              <p className="text-muted-foreground">Demi keamanan, akun hanya bisa dihapus oleh pemiliknya. Masuk lewat halaman Rewards, lalu kembali ke sini.</p>
              <Link to="/rewards" className="inline-flex h-11 items-center rounded-xl bg-primary px-5 font-bold text-primary-foreground">Masuk ke akun</Link>
              <p className="text-muted-foreground pt-2">
                Tidak bisa masuk? Kirim permintaan hapus akun ke{' '}
                {settings?.email ? <a className="font-semibold text-primary hover:underline" href={`mailto:${settings.email}?subject=Permintaan%20hapus%20akun`}>{settings.email}</a> : 'email resmi Kediaman'}
                {' '}dari email yang terdaftar. Kami proses paling lambat 7 hari kerja.
              </p>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-4">
              <h2 className="text-base font-extrabold flex items-center gap-2"><Trash2 className="size-5 text-destructive" aria-hidden="true" />Hapus akun {user.email}</h2>
              <div className="space-y-1.5">
                <Label htmlFor="del-pw">Password</Label>
                <Input id="del-pw" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="del-confirm">Ketik <b>HAPUS</b> untuk konfirmasi</Label>
                <Input id="del-confirm" autoComplete="off" autoCapitalize="characters" required value={confirm} onChange={(e) => setConfirm(e.target.value)} />
              </div>
              {error && <p role="alert" className="text-sm font-semibold text-destructive">{error}</p>}
              <button type="submit" disabled={busy}
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-destructive px-5 text-sm font-bold text-destructive-foreground disabled:opacity-60">
                {busy ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Trash2 className="size-4" aria-hidden="true" />}
                Hapus akun permanen
              </button>
            </form>
          )}
        </section>
        <p className="mt-6 text-sm text-muted-foreground">Lihat juga <Link to="/kebijakan-privasi" className="font-semibold text-primary hover:underline">Kebijakan Privasi</Link>.</p>
      </div>
    </Layout>
  );
};

export default AccountDelete;
