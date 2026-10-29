// CMS: Pelanggan newsletter (tabel newsletter_subscribers). Daftar ini dipakai agent newsletter.
import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Download, Search } from 'lucide-react';
import { toast } from 'sonner';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { AdminTable } from '@/components/admin/AdminTable';
import { AdminFormDialog } from '@/components/admin/AdminFormDialog';
import { DeleteConfirmDialog } from '@/components/admin/DeleteConfirmDialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';

type Subscriber = {
  id: string; email: string; name: string | null; source: string | null; status: 'active' | 'unsubscribed';
  created_at: string; unsubscribed_at: string | null; last_sent_at: string | null;
};

const KEY = ['newsletter-subscribers'];
const fmt = (d: string | null) => (d ? new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-');
const newToken = () => Array.from(crypto.getRandomValues(new Uint8Array(32)), (b) => b.toString(16).padStart(2, '0')).join('');

const AdminNewsletter = () => {
  const qc = useQueryClient();
  const { data: subs = [], isLoading } = useQuery({
    queryKey: KEY,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('newsletter_subscribers')
        .select('id,email,name,source,status,created_at,unsubscribed_at,last_sent_at')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as Subscriber[];
    },
  });

  const save = useMutation({
    mutationFn: async (row: { id?: string; email: string; name: string | null; status: Subscriber['status'] }) => {
      const values = { email: row.email, name: row.name, status: row.status, unsubscribed_at: row.status === 'unsubscribed' ? new Date().toISOString() : null };
      const { error } = row.id
        ? await supabase.from('newsletter_subscribers').update(values).eq('id', row.id)
        : await supabase.from('newsletter_subscribers').insert({ ...values, source: 'admin', unsubscribe_token: newToken() });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: KEY }); toast.success('Pelanggan disimpan'); },
    onError: (e: Error) => toast.error(/duplicate|unique/i.test(e.message) ? 'Email ini sudah terdaftar' : e.message),
  });
  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('newsletter_subscribers').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: KEY }); toast.success('Pelanggan dihapus'); },
    onError: (e: Error) => toast.error(e.message),
  });

  const [query, setQuery] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editing, setEditing] = useState<Subscriber | null>(null);
  const [form, setForm] = useState({ email: '', name: '', active: true });

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? subs.filter((s) => s.email.toLowerCase().includes(q) || s.name?.toLowerCase().includes(q)) : subs;
  }, [subs, query]);
  const active = subs.filter((s) => s.status === 'active');
  const last30 = active.filter((s) => Date.now() - new Date(s.created_at).getTime() < 30 * 864e5).length;

  const open = (item?: Subscriber) => {
    setEditing(item ?? null);
    setForm(item ? { email: item.email, name: item.name || '', active: item.status === 'active' } : { email: '', name: '', active: true });
    setFormOpen(true);
  };
  const submit = async () => {
    const email = form.email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { toast.error('Email tidak valid'); return; }
    await save.mutateAsync({ id: editing?.id, email, name: form.name.trim() || null, status: form.active ? 'active' : 'unsubscribed' });
    setFormOpen(false);
  };

  const exportCsv = () => {
    const esc = (v: string | null) => `"${(v ?? '').replace(/"/g, '""')}"`;
    const lines = ['email,nama,sumber,tanggal_daftar', ...active.map((s) => [esc(s.email), esc(s.name), esc(s.source), esc(s.created_at.slice(0, 10))].join(','))];
    const url = URL.createObjectURL(new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `newsletter-kediaman-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const columns = [
    { key: 'email', label: 'Email' },
    { key: 'name', label: 'Nama', render: (i: Subscriber) => i.name || '-' },
    { key: 'source', label: 'Sumber', render: (i: Subscriber) => i.source || '-' },
    { key: 'created_at', label: 'Daftar', render: (i: Subscriber) => fmt(i.created_at) },
    { key: 'last_sent_at', label: 'Terakhir dikirim', render: (i: Subscriber) => fmt(i.last_sent_at) },
    { key: 'status', label: 'Status', render: (i: Subscriber) => <Badge variant={i.status === 'active' ? 'default' : 'secondary'}>{i.status === 'active' ? 'Aktif' : 'Berhenti'}</Badge> },
  ];

  return (
    <AdminLayout title="Newsletter" description="Email yang berlangganan dari CTA di beranda. Agent newsletter mengirim ke pelanggan berstatus Aktif; pelanggan yang klik “berhenti berlangganan” otomatis dikeluarkan.">
      <div className="grid grid-cols-3 gap-3 mb-4">
        {[['Pelanggan aktif', active.length], ['Baru 30 hari', last30], ['Berhenti', subs.length - active.length]].map(([label, value]) => (
          <div key={label} className="ota-card p-4"><p className="text-2xl font-extrabold">{value}</p><p className="text-sm text-muted-foreground">{label}</p></div>
        ))}
      </div>
      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <label className="flex items-center gap-2 h-10 px-3 rounded-lg border border-input bg-card flex-1 sm:max-w-sm">
          <Search className="size-4 text-muted-foreground" aria-hidden="true" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Cari email atau nama" className="bg-transparent outline-none text-sm w-full" />
        </label>
        <Button variant="outline" onClick={exportCsv} disabled={!active.length}><Download className="size-4 mr-2" />Ekspor CSV (aktif)</Button>
      </div>

      <AdminTable data={filtered} columns={columns} onEdit={open} onDelete={(i) => setDeleteId(i.id)} onCreate={() => open()} createLabel="Tambah pelanggan" isLoading={isLoading} />

      <AdminFormDialog open={formOpen} onOpenChange={setFormOpen} title={editing ? 'Ubah pelanggan' : 'Tambah pelanggan'} onSubmit={submit} isSubmitting={save.isPending}>
        <p className="text-sm text-muted-foreground">Tambahkan hanya email yang sudah setuju menerima newsletter.</p>
        <div><Label>Email *</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
        <div><Label>Nama</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
        <div className="flex items-center gap-2"><Switch checked={form.active} onCheckedChange={(c) => setForm({ ...form, active: c })} /><Label>Aktif menerima newsletter</Label></div>
      </AdminFormDialog>
      <DeleteConfirmDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)} onConfirm={async () => { if (deleteId) { await remove.mutateAsync(deleteId); setDeleteId(null); } }} isDeleting={remove.isPending} title="Hapus pelanggan" />
    </AdminLayout>
  );
};

export default AdminNewsletter;
