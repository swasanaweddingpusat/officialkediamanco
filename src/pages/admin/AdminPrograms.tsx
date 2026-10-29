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
import { usePrograms, useCreateProgram, useUpdateProgram, useDeleteProgram, useLocations } from '@/hooks/useCMS';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';

type Program = {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  category: string | null;
  sort_order: number | null;
  is_active: boolean | null;
  cta_label: string | null;
  cta_link: string | null;
  start_date?: string | null;
  end_date?: string | null;
  content?: string | null;
  terms?: unknown;
  promo_code?: string | null;
  location_ids?: unknown;
};

const toList = (v: unknown): string[] => (Array.isArray(v) ? v.map(String).filter(Boolean) : []);

const AdminPrograms = () => {
  const { data: programs = [], isLoading } = usePrograms();
  const createMutation = useCreateProgram();
  const updateMutation = useUpdateProgram();
  const deleteMutation = useDeleteProgram();
  const { data: locations = [] } = useLocations();

  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Program | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    image_url: '',
    category: '',
    sort_order: 0,
    is_active: true,
    cta_label: '',
    cta_link: '',
    start_date: '',
    end_date: '',
    content: '',
    terms: '',
    promo_code: '',
    location_ids: [] as string[],
  });

  const resetForm = () => {
    setFormData({ name: '', description: '', image_url: '', category: '', sort_order: 0, is_active: true, cta_label: '', cta_link: '', start_date: '', end_date: '', content: '', terms: '', promo_code: '', location_ids: [] });
    setEditingItem(null);
  };

  const handleCreate = () => {
    resetForm();
    setFormOpen(true);
  };

  const handleEdit = (item: Program) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      description: item.description || '',
      image_url: item.image_url || '',
      category: item.category || '',
      sort_order: item.sort_order || 0,
      is_active: item.is_active ?? true,
      cta_label: item.cta_label || '',
      cta_link: item.cta_link || '',
      start_date: item.start_date || '',
      end_date: item.end_date || '',
      content: item.content || '',
      terms: toList(item.terms).join('\n'),
      promo_code: item.promo_code || '',
      location_ids: toList(item.location_ids),
    });
    setFormOpen(true);
  };

  const handleDelete = (item: Program) => {
    setDeletingId(item.id);
    setDeleteOpen(true);
  };

  const handleSubmit = async () => {
    const payload = {
      ...formData,
      start_date: formData.start_date || null,
      end_date: formData.end_date || null,
      content: formData.content || null,
      promo_code: formData.promo_code.trim() || null,
      terms: formData.terms.split('\n').map((t) => t.trim()).filter(Boolean),
      location_ids: formData.location_ids,
    };
    if (editingItem) {
      await updateMutation.mutateAsync({ id: editingItem.id, ...payload });
    } else {
      await createMutation.mutateAsync(payload as unknown as Parameters<typeof createMutation.mutateAsync>[0]);
    }
    setFormOpen(false);
    resetForm();
  };

  const handleConfirmDelete = async () => {
    if (deletingId) {
      await deleteMutation.mutateAsync(deletingId);
      setDeleteOpen(false);
      setDeletingId(null);
    }
  };

  const columns = [
    {
      key: 'image_url',
      label: 'Image',
      render: (item: Program) => item.image_url ? (
        <img src={item.image_url} alt="" className="w-16 h-10 object-cover rounded" />
      ) : <span className="text-muted-foreground">-</span>,
    },
    { key: 'name', label: 'Offer Name' },
    { key: 'category', label: 'Category' },
    { key: 'end_date', label: 'Berakhir', render: (item: Program) => item.end_date || '-' },
    { key: 'sort_order', label: 'Order' },
    {
      key: 'is_active',
      label: 'Status',
      render: (item: Program) => (
        <Badge variant={item.is_active ? 'default' : 'secondary'}>
          {item.is_active ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
  ];

  return (
    <AdminLayout title="Special Offers">
      <AdminTable
        data={programs as Program[]}
        columns={columns}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onCreate={handleCreate}
        createLabel="Add Offer"
        isLoading={isLoading}
      />

      <AdminFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        title={editingItem ? 'Edit Special Offer' : 'Add Special Offer'}
        onSubmit={handleSubmit}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
      >
        <div className="space-y-4">
          <div>
            <Label>Image</Label>
            <ImageUpload
              value={formData.image_url}
              onChange={(url) => setFormData({ ...formData, image_url: url })}
              folder="programs"
            />
          </div>
          <div>
            <Label>Offer Name *</Label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Summer Program 50% Off"
            />
          </div>
          <div>
            <Label>Description</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Get 50% off for all membership packages..."
            />
          </div>
          <div>
            <Label>Category</Label>
            <Input
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              placeholder="Membership, Package, Discount..."
            />
          </div>
          <div>
            <Label>Sort Order</Label>
            <Input
              type="number"
              value={formData.sort_order}
              onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
            />
          </div>
          <div>
            <Label>Button Label (CTA)</Label>
            <Input
              value={formData.cta_label}
              onChange={(e) => setFormData({ ...formData, cta_label: e.target.value })}
              placeholder="Get This Offer"
            />
          </div>
          <div>
            <Label>Button Link (URL)</Label>
            <Input
              value={formData.cta_link}
              onChange={(e) => setFormData({ ...formData, cta_link: e.target.value })}
              placeholder="https://wa.me/62... atau /kontak"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Mulai berlaku</Label>
              <Input type="date" value={formData.start_date} onChange={(e) => setFormData({ ...formData, start_date: e.target.value })} />
            </div>
            <div>
              <Label>Berakhir</Label>
              <Input type="date" value={formData.end_date} onChange={(e) => setFormData({ ...formData, end_date: e.target.value })} />
            </div>
          </div>
          <div>
            <Label>Kode promo (opsional)</Label>
            <Input value={formData.promo_code} onChange={(e) => setFormData({ ...formData, promo_code: e.target.value })} placeholder="WMF2026" />
          </div>
          <div>
            <Label>Detail promo (halaman detail)</Label>
            <Textarea rows={6} value={formData.content} onChange={(e) => setFormData({ ...formData, content: e.target.value })} placeholder="Penjelasan lengkap promo, bonus yang didapat, dan cara klaim." />
          </div>
          <div>
            <Label>Syarat &amp; ketentuan (satu baris = satu poin)</Label>
            <Textarea rows={5} value={formData.terms} onChange={(e) => setFormData({ ...formData, terms: e.target.value })} placeholder={'Berlaku untuk booking baru\nTidak dapat digabung dengan promo lain'} />
          </div>
          <div>
            <Label>Berlaku di venue</Label>
            <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto rounded-md border border-border p-3">
              {locations.map((l) => (
                <label key={l.id} className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={formData.location_ids.includes(l.id)}
                    onCheckedChange={(c) => setFormData({ ...formData, location_ids: c ? [...formData.location_ids, l.id] : formData.location_ids.filter((x) => x !== l.id) })}
                  />
                  {l.name}
                </label>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              checked={formData.is_active}
              onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
            />
            <Label>Active</Label>
          </div>
        </div>
      </AdminFormDialog>

      <DeleteConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onConfirm={handleConfirmDelete}
        isDeleting={deleteMutation.isPending}
        title="Delete Special Offer"
      />
    </AdminLayout>
  );
};

export default AdminPrograms;
