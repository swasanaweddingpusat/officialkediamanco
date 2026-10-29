// CMS: Ulasan pasangan (tabel venue_reviews). Ulasan baru tampil setelah "Terbitkan" dinyalakan.
import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { AdminTable } from '@/components/admin/AdminTable';
import { AdminFormDialog } from '@/components/admin/AdminFormDialog';
import { DeleteConfirmDialog } from '@/components/admin/DeleteConfirmDialog';
import { ImageUpload } from '@/components/admin/ImageUpload';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useLocations } from '@/hooks/useCMS';
import { useVenueReviews, useSaveRow, useDeleteRow, type VenueReview } from '@/hooks/useOta';

const empty = { location_id: '', reviewer_name: '', event_date: '', event_type: 'Pernikahan', rating: 5, title: '', body: '', photo_url: '', is_published: false, sort_order: 0 };

const AdminReviews = () => {
  const { data: reviews = [], isLoading } = useVenueReviews();
  const { data: locations = [] } = useLocations();
  const save = useSaveRow('venue_reviews', 'Ulasan');
  const remove = useDeleteRow('venue_reviews', 'Ulasan');
  const [formOpen, setFormOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editing, setEditing] = useState<VenueReview | null>(null);
  const [form, setForm] = useState(empty);

  const open = (item?: VenueReview) => {
    setEditing(item ?? null);
    setForm(item ? {
      location_id: item.location_id || '', reviewer_name: item.reviewer_name, event_date: item.event_date || '', event_type: item.event_type || '',
      rating: item.rating, title: item.title || '', body: item.body, photo_url: item.photo_url || '', is_published: item.is_published, sort_order: item.sort_order,
    } : empty);
    setFormOpen(true);
  };
  const submit = async () => {
    if (!form.reviewer_name.trim() || !form.body.trim()) return;
    await save.mutateAsync({
      id: editing?.id,
      location_id: form.location_id || null,
      reviewer_name: form.reviewer_name.trim(),
      event_date: form.event_date || null,
      event_type: form.event_type.trim() || null,
      rating: Math.min(5, Math.max(1, Number(form.rating) || 5)),
      title: form.title.trim() || null,
      body: form.body.trim(),
      photo_url: form.photo_url || null,
      is_published: form.is_published,
      sort_order: Number(form.sort_order) || 0,
    });
    setFormOpen(false);
  };

  const columns = [
    { key: 'reviewer_name', label: 'Nama' },
    { key: 'location_id', label: 'Venue', render: (i: VenueReview) => i.locations?.name || '-' },
    { key: 'rating', label: 'Rating', render: (i: VenueReview) => '★'.repeat(i.rating) },
    { key: 'event_date', label: 'Tanggal acara', render: (i: VenueReview) => i.event_date || '-' },
    { key: 'is_published', label: 'Status', render: (i: VenueReview) => <Badge variant={i.is_published ? 'default' : 'secondary'}>{i.is_published ? 'Terbit' : 'Draf'}</Badge> },
  ];

  return (
    <AdminLayout title="Ulasan Pasangan">
      <p className="text-sm text-muted-foreground mb-4">Masukkan ulasan asli dari pasangan (dengan izin mereka). Ulasan tampil di /ulasan, halaman venue, dan beranda setelah diterbitkan.</p>
      <AdminTable data={reviews} columns={columns} onEdit={open} onDelete={(i) => setDeleteId(i.id)} onCreate={() => open()} createLabel="Tambah ulasan" isLoading={isLoading} />
      <AdminFormDialog open={formOpen} onOpenChange={setFormOpen} title={editing ? 'Ubah ulasan' : 'Tambah ulasan'} onSubmit={submit} isSubmitting={save.isPending}>
        <div>
          <Label>Venue</Label>
          <select value={form.location_id} onChange={(e) => setForm({ ...form, location_id: e.target.value })} className="mt-1 w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
            <option value="">Tanpa venue</option>
            {locations.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
          </select>
        </div>
        <div><Label>Nama pasangan *</Label><Input value={form.reviewer_name} onChange={(e) => setForm({ ...form, reviewer_name: e.target.value })} placeholder="Nindy & Gerry" /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><Label>Tanggal acara</Label><Input type="date" value={form.event_date} onChange={(e) => setForm({ ...form, event_date: e.target.value })} /></div>
          <div><Label>Jenis acara</Label><Input value={form.event_type} onChange={(e) => setForm({ ...form, event_type: e.target.value })} /></div>
        </div>
        <div>
          <Label>Rating</Label>
          <select value={form.rating} onChange={(e) => setForm({ ...form, rating: Number(e.target.value) })} className="mt-1 w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
            {[5, 4, 3, 2, 1].map((r) => <option key={r} value={r}>{'★'.repeat(r)} ({r})</option>)}
          </select>
        </div>
        <div><Label>Judul (opsional)</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
        <div><Label>Isi ulasan *</Label><Textarea rows={6} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} /></div>
        <div><Label>Foto (opsional)</Label><ImageUpload value={form.photo_url} onChange={(url) => setForm({ ...form, photo_url: url })} folder="reviews" /></div>
        <div><Label>Urutan</Label><Input type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: parseInt(e.target.value) || 0 })} /></div>
        <div className="flex items-center gap-2"><Switch checked={form.is_published} onCheckedChange={(c) => setForm({ ...form, is_published: c })} /><Label>Terbitkan</Label></div>
      </AdminFormDialog>
      <DeleteConfirmDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)} onConfirm={async () => { if (deleteId) { await remove.mutateAsync(deleteId); setDeleteId(null); } }} isDeleting={remove.isPending} title="Hapus ulasan" />
    </AdminLayout>
  );
};

export default AdminReviews;
