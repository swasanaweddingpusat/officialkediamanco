// CMS: Paket & Harga per venue (tabel venue_packages).
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
import { useVenuePackages, useSaveRow, useDeleteRow, formatRupiah, type VenuePackage } from '@/hooks/useOta';

const empty = {
  location_id: '', name: '', description: '', inclusions: '', price: '', price_note: '', min_pax: '', max_pax: '',
  image_url: '', is_featured: false, sort_order: 0, is_active: true,
};

const AdminPackages = () => {
  const { data: packages = [], isLoading } = useVenuePackages();
  const { data: locations = [] } = useLocations();
  const save = useSaveRow('venue_packages', 'Paket');
  const remove = useDeleteRow('venue_packages', 'Paket');
  const [formOpen, setFormOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editing, setEditing] = useState<VenuePackage | null>(null);
  const [form, setForm] = useState(empty);

  const open = (item?: VenuePackage) => {
    setEditing(item ?? null);
    setForm(item ? {
      location_id: item.location_id || '', name: item.name, description: item.description || '', inclusions: item.inclusions.join('\n'),
      price: item.price !== null ? String(item.price) : '', price_note: item.price_note || '', min_pax: item.min_pax ? String(item.min_pax) : '',
      max_pax: item.max_pax ? String(item.max_pax) : '', image_url: item.image_url || '', is_featured: item.is_featured, sort_order: item.sort_order, is_active: item.is_active,
    } : empty);
    setFormOpen(true);
  };

  const num = (v: string) => (v.trim() === '' ? null : Number(v.replace(/[^0-9.]/g, '')));
  const submit = async () => {
    if (!form.name.trim()) return;
    await save.mutateAsync({
      id: editing?.id,
      location_id: form.location_id || null,
      name: form.name.trim(),
      description: form.description.trim() || null,
      inclusions: form.inclusions.split('\n').map((t) => t.trim()).filter(Boolean),
      price: num(form.price),
      price_note: form.price_note.trim() || null,
      min_pax: num(form.min_pax),
      max_pax: num(form.max_pax),
      image_url: form.image_url || null,
      is_featured: form.is_featured,
      sort_order: Number(form.sort_order) || 0,
      is_active: form.is_active,
    });
    setFormOpen(false);
  };

  const venueName = (id: string | null) => locations.find((l) => l.id === id)?.name || 'Semua venue';
  const columns = [
    { key: 'name', label: 'Paket' },
    { key: 'location_id', label: 'Venue', render: (i: VenuePackage) => venueName(i.location_id) },
    { key: 'price', label: 'Harga mulai', render: (i: VenuePackage) => formatRupiah(i.price) ?? '-' },
    { key: 'pax', label: 'Tamu', render: (i: VenuePackage) => (i.min_pax || i.max_pax ? `${i.min_pax ?? ''}–${i.max_pax ?? ''}` : '-') },
    { key: 'sort_order', label: 'Urutan' },
    { key: 'is_active', label: 'Status', render: (i: VenuePackage) => <div className="flex gap-1">{i.is_featured && <Badge variant="outline">Unggulan</Badge>}<Badge variant={i.is_active ? 'default' : 'secondary'}>{i.is_active ? 'Aktif' : 'Nonaktif'}</Badge></div> },
  ];

  return (
    <AdminLayout title="Paket & Harga">
      <p className="text-sm text-muted-foreground mb-4">Paket tampil di halaman venue, halaman Paket &amp; Harga, dan kartu "Paket mulai" (harga terendah per venue).</p>
      <AdminTable data={packages} columns={columns} onEdit={open} onDelete={(i) => setDeleteId(i.id)} onCreate={() => open()} createLabel="Tambah paket" isLoading={isLoading} />

      <AdminFormDialog open={formOpen} onOpenChange={setFormOpen} title={editing ? 'Ubah paket' : 'Tambah paket'} onSubmit={submit} isSubmitting={save.isPending}>
        <div>
          <Label>Venue</Label>
          <select value={form.location_id} onChange={(e) => setForm({ ...form, location_id: e.target.value })} className="mt-1 w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
            <option value="">Semua venue</option>
            {locations.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
          </select>
        </div>
        <div><Label>Nama paket *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Sapphire" /></div>
        <div><Label>Deskripsi singkat</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Paket all-in untuk resepsi malam." /></div>
        <div><Label>Isi paket (satu baris = satu poin)</Label><Textarea rows={6} value={form.inclusions} onChange={(e) => setForm({ ...form, inclusions: e.target.value })} placeholder={'Sewa ballroom 4 jam\nKatering 800 pax\nDekorasi pelaminan'} /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><Label>Harga mulai (Rp)</Label><Input inputMode="numeric" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="224200000" /></div>
          <div><Label>Keterangan harga</Label><Input value={form.price_note} onChange={(e) => setForm({ ...form, price_note: e.target.value })} placeholder="Mulai / per 100 pax" /></div>
          <div><Label>Tamu minimal</Label><Input inputMode="numeric" value={form.min_pax} onChange={(e) => setForm({ ...form, min_pax: e.target.value })} /></div>
          <div><Label>Tamu maksimal</Label><Input inputMode="numeric" value={form.max_pax} onChange={(e) => setForm({ ...form, max_pax: e.target.value })} /></div>
        </div>
        <div><Label>Gambar (opsional)</Label><ImageUpload value={form.image_url} onChange={(url) => setForm({ ...form, image_url: url })} folder="packages" /></div>
        <div><Label>Urutan</Label><Input type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: parseInt(e.target.value) || 0 })} /></div>
        <div className="flex items-center gap-2"><Switch checked={form.is_featured} onCheckedChange={(c) => setForm({ ...form, is_featured: c })} /><Label>Tandai "Terpopuler" (tampil di beranda)</Label></div>
        <div className="flex items-center gap-2"><Switch checked={form.is_active} onCheckedChange={(c) => setForm({ ...form, is_active: c })} /><Label>Aktif</Label></div>
      </AdminFormDialog>

      <DeleteConfirmDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)} onConfirm={async () => { if (deleteId) { await remove.mutateAsync(deleteId); setDeleteId(null); } }} isDeleting={remove.isPending} title="Hapus paket" />
    </AdminLayout>
  );
};

export default AdminPackages;
