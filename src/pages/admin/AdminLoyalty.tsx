// CMS: Loyalty & Referral (Kediaman Rewards).
// Poin booking/referral masuk otomatis (trigger DB) saat booking di-approve; penukaran yang ditolak
// otomatis mengembalikan poin & stok.
import { useEffect, useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Check, X, PackageCheck, PlusCircle } from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { AdminTable } from '@/components/admin/AdminTable';
import { AdminFormDialog } from '@/components/admin/AdminFormDialog';
import { DeleteConfirmDialog } from '@/components/admin/DeleteConfirmDialog';
import { ImageUpload } from '@/components/admin/ImageUpload';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useLoyaltyRewards, useLoyaltySettings, REDEMPTION_STATUS, type LoyaltyReward } from '@/hooks/useLoyalty';
import { useSaveRow, useDeleteRow } from '@/hooks/useOta';

type Member = { id: string; user_id: string; full_name: string; phone: string; referral_code: string; referred_by: string | null; created_at: string };
type Redemption = { id: string; member_id: string; reward_name: string; points_cost: number; status: string; admin_notes: string | null; created_at: string };
type PointRow = { member_id: string; points: number };

const fmt = (d: string) => new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });

function useAdminLoyalty() {
  return useQuery({
    queryKey: ['loyalty-admin'],
    queryFn: async () => {
      const [m, r, p] = await Promise.all([
        supabase.from('loyalty_members').select('id,user_id,full_name,phone,referral_code,referred_by,created_at').order('created_at', { ascending: false }).limit(5000),
        supabase.from('loyalty_redemptions').select('*').order('created_at', { ascending: false }).limit(1000),
        supabase.from('loyalty_points').select('member_id,points').limit(50000),
      ]);
      if (m.error) throw m.error;
      if (r.error) throw r.error;
      if (p.error) throw p.error;
      return { members: (m.data ?? []) as Member[], redemptions: (r.data ?? []) as Redemption[], points: (p.data ?? []) as PointRow[] };
    },
  });
}

const emptyReward = { name: '', description: '', image_url: '', points_cost: '', stock: '', terms: '', sort_order: 0, is_active: true };

const AdminLoyalty = () => {
  const qc = useQueryClient();
  const { data, isLoading } = useAdminLoyalty();
  const { data: rewards = [], isLoading: rewardsLoading } = useLoyaltyRewards();
  const { data: settings } = useLoyaltySettings();
  const saveReward = useSaveRow('loyalty_rewards', 'Hadiah');
  const deleteReward = useDeleteRow('loyalty_rewards', 'Hadiah');
  const saveSettings = useSaveRow('loyalty_settings', 'Pengaturan');

  const members = data?.members ?? [];
  const redemptions = data?.redemptions ?? [];
  const balances = useMemo(() => {
    const m: Record<string, number> = {};
    for (const p of data?.points ?? []) m[p.member_id] = (m[p.member_id] ?? 0) + p.points;
    return m;
  }, [data]);
  const memberById = useMemo(() => Object.fromEntries(members.map((m) => [m.id, m])), [members]);
  const pending = redemptions.filter((r) => r.status === 'pending').length;

  // ---- penukaran
  const updateRedemption = useMutation({
    mutationFn: async ({ id, status, admin_notes }: { id: string; status: string; admin_notes?: string }) => {
      const { error } = await supabase.from('loyalty_redemptions').update({ status, ...(admin_notes !== undefined ? { admin_notes } : {}) }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['loyalty-admin'] }); qc.invalidateQueries({ queryKey: ['loyalty-rewards'] }); toast.success('Status penukaran diperbarui'); },
    onError: (e: Error) => toast.error(e.message),
  });

  // ---- hadiah
  const [rewardOpen, setRewardOpen] = useState(false);
  const [editingReward, setEditingReward] = useState<LoyaltyReward | null>(null);
  const [rewardForm, setRewardForm] = useState(emptyReward);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const openReward = (item?: LoyaltyReward) => {
    setEditingReward(item ?? null);
    setRewardForm(item ? {
      name: item.name, description: item.description || '', image_url: item.image_url || '', points_cost: String(item.points_cost),
      stock: item.stock === null ? '' : String(item.stock), terms: item.terms || '', sort_order: item.sort_order, is_active: item.is_active,
    } : emptyReward);
    setRewardOpen(true);
  };
  const submitReward = async () => {
    const cost = parseInt(rewardForm.points_cost, 10);
    if (!rewardForm.name.trim() || !(cost > 0)) { toast.error('Nama & poin (> 0) wajib diisi'); return; }
    const stock = rewardForm.stock.trim() === '' ? null : Math.max(0, parseInt(rewardForm.stock, 10) || 0);
    await saveReward.mutateAsync({
      id: editingReward?.id, name: rewardForm.name.trim(), description: rewardForm.description.trim() || null, image_url: rewardForm.image_url || null,
      points_cost: cost, stock, terms: rewardForm.terms.trim() || null, sort_order: Number(rewardForm.sort_order) || 0, is_active: rewardForm.is_active,
    });
    setRewardOpen(false);
  };

  // ---- penyesuaian poin
  const [adjust, setAdjust] = useState<{ member: Member; points: string; reason: string } | null>(null);
  const adjustMutation = useMutation({
    mutationFn: async () => {
      const pts = parseInt(adjust?.points ?? '', 10);
      if (!adjust || !pts) throw new Error('Isi jumlah poin (boleh negatif)');
      if (!adjust.reason.trim()) throw new Error('Isi alasan penyesuaian');
      const { error } = await supabase.from('loyalty_points').insert({ member_id: adjust.member.id, points: pts, type: 'adjust', description: adjust.reason.trim() });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['loyalty-admin'] }); toast.success('Poin disesuaikan'); setAdjust(null); },
    onError: (e: Error) => toast.error(e.message),
  });

  // ---- pengaturan
  const [st, setSt] = useState({ is_enabled: true, program_name: 'Kediaman Rewards', referral_points: '500', booking_points: '200', referee_benefit: '', terms: '' });
  useEffect(() => {
    if (settings) setSt({
      is_enabled: settings.is_enabled, program_name: settings.program_name, referral_points: String(settings.referral_points),
      booking_points: String(settings.booking_points), referee_benefit: settings.referee_benefit || '', terms: settings.terms || '',
    });
  }, [settings]);
  const submitSettings = () => saveSettings.mutate({
    id: 1 as unknown as string, is_enabled: st.is_enabled, program_name: st.program_name.trim() || 'Kediaman Rewards',
    referral_points: Math.max(0, parseInt(st.referral_points, 10) || 0), booking_points: Math.max(0, parseInt(st.booking_points, 10) || 0),
    referee_benefit: st.referee_benefit.trim() || null, terms: st.terms.trim() || null,
  });

  const totalOutstanding = (Object.values(balances) as number[]).reduce((a, b) => a + b, 0);

  return (
    <AdminLayout title="Loyalty & Referral" description="Program Kediaman Rewards: client mengajak teman & booking untuk mengumpulkan poin, lalu menukarnya dengan hadiah. Poin masuk otomatis saat booking di-approve.">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        {[['Member', members.length], ['Penukaran menunggu', pending], ['Total poin beredar', totalOutstanding.toLocaleString('id-ID')], ['Hadiah aktif', rewards.filter((r) => r.is_active).length]].map(([l, v]) => (
          <div key={String(l)} className="ota-card p-4"><p className="text-2xl font-extrabold">{v}</p><p className="text-sm text-muted-foreground">{l}</p></div>
        ))}
      </div>

      <Tabs defaultValue="penukaran">
        <TabsList className="mb-4 flex-wrap h-auto">
          <TabsTrigger value="penukaran">Penukaran{pending > 0 && <span className="ml-1.5 rounded-full bg-gold px-1.5 text-[11px] font-bold text-primary">{pending}</span>}</TabsTrigger>
          <TabsTrigger value="hadiah">Hadiah</TabsTrigger>
          <TabsTrigger value="member">Member</TabsTrigger>
          <TabsTrigger value="pengaturan">Pengaturan</TabsTrigger>
        </TabsList>

        <TabsContent value="penukaran">
          <div className="ota-card p-4 md:p-6">
            {isLoading ? <p className="py-8 text-center text-muted-foreground">Memuat…</p> : redemptions.length === 0 ? <p className="py-8 text-center text-muted-foreground">Belum ada penukaran.</p> : (
              <ul className="divide-y divide-border">
                {redemptions.map((r) => {
                  const m = memberById[r.member_id];
                  const s = REDEMPTION_STATUS[r.status] ?? REDEMPTION_STATUS.pending;
                  return (
                    <li key={r.id} className="py-3 flex flex-col md:flex-row md:items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-bold">{r.reward_name} <span className="text-sm font-normal text-muted-foreground">· {r.points_cost.toLocaleString('id-ID')} poin</span></p>
                        <p className="text-sm text-muted-foreground">{m ? `${m.full_name} · ${m.phone}` : 'Member terhapus'} · {fmt(r.created_at)}</p>
                        {r.admin_notes && <p className="text-xs text-muted-foreground mt-0.5">Catatan: {r.admin_notes}</p>}
                      </div>
                      <span className={s.tone}>{s.label}</span>
                      <div className="flex flex-wrap gap-2">
                        {r.status === 'pending' && <Button size="sm" onClick={() => updateRedemption.mutate({ id: r.id, status: 'approved' })}><Check className="size-4 mr-1" />Setujui</Button>}
                        {(r.status === 'pending' || r.status === 'approved') && <Button size="sm" variant="outline" onClick={() => updateRedemption.mutate({ id: r.id, status: 'fulfilled' })}><PackageCheck className="size-4 mr-1" />Sudah diberikan</Button>}
                        {r.status !== 'rejected' && r.status !== 'fulfilled' && (
                          <Button size="sm" variant="destructive" onClick={() => {
                            const note = window.prompt('Alasan penolakan (opsional, poin akan dikembalikan):') ?? undefined;
                            if (note !== undefined) updateRedemption.mutate({ id: r.id, status: 'rejected', admin_notes: note });
                          }}><X className="size-4 mr-1" />Tolak</Button>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </TabsContent>

        <TabsContent value="hadiah">
          <AdminTable
            data={rewards}
            isLoading={rewardsLoading}
            onCreate={() => openReward()}
            onEdit={openReward}
            onDelete={(i) => setDeleteId(i.id)}
            createLabel="Tambah hadiah"
            columns={[
              { key: 'name', label: 'Hadiah' },
              { key: 'points_cost', label: 'Poin', render: (i: LoyaltyReward) => i.points_cost.toLocaleString('id-ID') },
              { key: 'stock', label: 'Stok', render: (i: LoyaltyReward) => (i.stock === null ? 'Tak terbatas' : i.stock) },
              { key: 'is_active', label: 'Status', render: (i: LoyaltyReward) => <Badge variant={i.is_active ? 'default' : 'secondary'}>{i.is_active ? 'Tampil' : 'Disembunyikan'}</Badge> },
            ]}
          />
        </TabsContent>

        <TabsContent value="member">
          <div className="ota-card p-4 md:p-6">
            {members.length === 0 ? <p className="py-8 text-center text-muted-foreground">Belum ada member.</p> : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="text-left text-muted-foreground border-b border-border"><th className="py-2 pr-3">Nama</th><th className="py-2 pr-3">HP</th><th className="py-2 pr-3">Kode</th><th className="py-2 pr-3">Diajak oleh</th><th className="py-2 pr-3 text-right">Poin</th><th className="py-2 pr-3">Daftar</th><th /></tr></thead>
                  <tbody>
                    {members.map((m) => (
                      <tr key={m.id} className="border-b border-border last:border-0">
                        <td className="py-2.5 pr-3 font-semibold">{m.full_name}</td>
                        <td className="py-2.5 pr-3">{m.phone}</td>
                        <td className="py-2.5 pr-3 font-mono">{m.referral_code}</td>
                        <td className="py-2.5 pr-3">{m.referred_by ? memberById[m.referred_by]?.full_name ?? '-' : '-'}</td>
                        <td className="py-2.5 pr-3 text-right font-extrabold">{(balances[m.id] ?? 0).toLocaleString('id-ID')}</td>
                        <td className="py-2.5 pr-3">{fmt(m.created_at)}</td>
                        <td className="py-2.5"><Button size="sm" variant="ghost" onClick={() => setAdjust({ member: m, points: '', reason: '' })}><PlusCircle className="size-4 mr-1" />Poin</Button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="pengaturan">
          <div className="ota-card p-5 md:p-6 max-w-2xl space-y-4">
            <div className="flex items-center gap-2"><Switch checked={st.is_enabled} onCheckedChange={(c) => setSt({ ...st, is_enabled: c })} /><Label>Program aktif</Label></div>
            <div><Label>Nama program</Label><Input value={st.program_name} onChange={(e) => setSt({ ...st, program_name: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Poin per referral terkonfirmasi</Label><Input inputMode="numeric" value={st.referral_points} onChange={(e) => setSt({ ...st, referral_points: e.target.value })} /></div>
              <div><Label>Poin per booking sendiri</Label><Input inputMode="numeric" value={st.booking_points} onChange={(e) => setSt({ ...st, booking_points: e.target.value })} /></div>
            </div>
            <div><Label>Keuntungan untuk teman yang diajak</Label><Input value={st.referee_benefit} onChange={(e) => setSt({ ...st, referee_benefit: e.target.value })} placeholder="mis. Gratis upgrade dekorasi untuk booking pertama" /></div>
            <div><Label>Syarat & ketentuan</Label><Textarea rows={6} value={st.terms} onChange={(e) => setSt({ ...st, terms: e.target.value })} /></div>
            <p className="text-xs text-muted-foreground">Perubahan poin berlaku untuk booking yang dikonfirmasi setelah disimpan; poin yang sudah masuk tidak berubah.</p>
            <Button onClick={submitSettings} disabled={saveSettings.isPending}>Simpan pengaturan</Button>
          </div>
        </TabsContent>
      </Tabs>

      <AdminFormDialog open={rewardOpen} onOpenChange={setRewardOpen} title={editingReward ? 'Ubah hadiah' : 'Tambah hadiah'} onSubmit={submitReward} isSubmitting={saveReward.isPending}>
        <div><Label>Nama hadiah *</Label><Input value={rewardForm.name} onChange={(e) => setRewardForm({ ...rewardForm, name: e.target.value })} placeholder="Voucher dekorasi Rp2 juta" /></div>
        <div><Label>Deskripsi</Label><Textarea value={rewardForm.description} onChange={(e) => setRewardForm({ ...rewardForm, description: e.target.value })} /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><Label>Poin dibutuhkan *</Label><Input inputMode="numeric" value={rewardForm.points_cost} onChange={(e) => setRewardForm({ ...rewardForm, points_cost: e.target.value })} /></div>
          <div><Label>Stok (kosong = tak terbatas)</Label><Input inputMode="numeric" value={rewardForm.stock} onChange={(e) => setRewardForm({ ...rewardForm, stock: e.target.value })} /></div>
        </div>
        <div><Label>Syarat penukaran</Label><Textarea rows={3} value={rewardForm.terms} onChange={(e) => setRewardForm({ ...rewardForm, terms: e.target.value })} /></div>
        <div><Label>Gambar</Label><ImageUpload value={rewardForm.image_url} onChange={(url) => setRewardForm({ ...rewardForm, image_url: url })} folder="rewards" /></div>
        <div><Label>Urutan</Label><Input type="number" value={rewardForm.sort_order} onChange={(e) => setRewardForm({ ...rewardForm, sort_order: parseInt(e.target.value) || 0 })} /></div>
        <div className="flex items-center gap-2"><Switch checked={rewardForm.is_active} onCheckedChange={(c) => setRewardForm({ ...rewardForm, is_active: c })} /><Label>Tampilkan di katalog</Label></div>
      </AdminFormDialog>

      <AdminFormDialog open={!!adjust} onOpenChange={(o) => !o && setAdjust(null)} title={`Sesuaikan poin — ${adjust?.member.full_name ?? ''}`} onSubmit={() => adjustMutation.mutate()} isSubmitting={adjustMutation.isPending}>
        <p className="text-sm text-muted-foreground">Saldo sekarang: {(adjust ? balances[adjust.member.id] ?? 0 : 0).toLocaleString('id-ID')} poin. Isi angka negatif untuk mengurangi.</p>
        <div><Label>Jumlah poin</Label><Input inputMode="numeric" value={adjust?.points ?? ''} onChange={(e) => adjust && setAdjust({ ...adjust, points: e.target.value })} placeholder="mis. 300 atau -100" /></div>
        <div><Label>Alasan (tampil di riwayat member)</Label><Input value={adjust?.reason ?? ''} onChange={(e) => adjust && setAdjust({ ...adjust, reason: e.target.value })} placeholder="Bonus event pameran" /></div>
      </AdminFormDialog>

      <DeleteConfirmDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)} onConfirm={async () => { if (deleteId) { await deleteReward.mutateAsync(deleteId); setDeleteId(null); } }} isDeleting={deleteReward.isPending} title="Hapus hadiah" />
    </AdminLayout>
  );
};

export default AdminLoyalty;
