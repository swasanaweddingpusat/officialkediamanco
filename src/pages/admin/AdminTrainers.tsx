import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { AdminTable } from '@/components/admin/AdminTable';
import { AdminFormDialog } from '@/components/admin/AdminFormDialog';
import { DeleteConfirmDialog } from '@/components/admin/DeleteConfirmDialog';
import { ImageUpload } from '@/components/admin/ImageUpload';
import { MultiImageUpload } from '@/components/admin/MultiImageUpload';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTrainers, useCreateTrainer, useUpdateTrainer, useDeleteTrainer } from '@/hooks/useCMS';
import { Badge } from '@/components/ui/badge';

const eventCategories = [
  'Wedding',
  'Corporate Event',
  'Birthday Party',
  'Engagement',
  'Anniversary',
  'Gala Dinner',
  'Exhibition',
  'Conference',
  'Seminar',
  'Product Launch',
  'Private Party',
  'Other',
];

type Trainer = {
  id: string;
  name: string;
  specialization: string | null;
  bio: string | null;
  photo_url: string | null;
  instagram: string | null;
  certifications: string[] | null;
  images: string[] | null;
  sort_order: number | null;
  is_active: boolean | null;
};

const AdminTrainers = () => {
  const { data: trainers = [], isLoading } = useTrainers();
  const createMutation = useCreateTrainer();
  const updateMutation = useUpdateTrainer();
  const deleteMutation = useDeleteTrainer();

  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Trainer | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    specialization: '',
    bio: '',
    photo_url: '',
    images: [] as string[],
    sort_order: 0,
    is_active: true,
  });

  const resetForm = () => {
    setFormData({ 
      name: '', 
      specialization: '', 
      bio: '', 
      photo_url: '', 
      images: [],
      sort_order: 0, 
      is_active: true 
    });
    setEditingItem(null);
  };

  const handleCreate = () => {
    resetForm();
    setFormOpen(true);
  };

  const handleEdit = (item: Trainer) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      specialization: item.specialization || '',
      bio: item.bio || '',
      photo_url: item.photo_url || '',
      images: item.images || [],
      sort_order: item.sort_order || 0,
      is_active: item.is_active ?? true,
    });
    setFormOpen(true);
  };

  const handleDelete = (item: Trainer) => {
    setDeletingId(item.id);
    setDeleteOpen(true);
  };

  const handleSubmit = async () => {
    const submitData = {
      name: formData.name,
      specialization: formData.specialization || undefined,
      bio: formData.bio || undefined,
      photo_url: formData.photo_url || undefined,
      images: formData.images.length > 0 ? formData.images : undefined,
      sort_order: formData.sort_order,
      is_active: formData.is_active,
    };

    if (editingItem) {
      await updateMutation.mutateAsync({ id: editingItem.id, ...submitData });
    } else {
      await createMutation.mutateAsync(submitData);
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
      key: 'photo_url',
      label: 'Photo',
      render: (item: Trainer) => item.photo_url ? (
        <img src={item.photo_url} alt="" className="w-12 h-12 object-cover rounded-lg" />
      ) : <div className="w-12 h-12 bg-secondary rounded-lg" />,
    },
    { key: 'name', label: 'Name' },
    { 
      key: 'specialization', 
      label: 'Category',
      render: (item: Trainer) => item.specialization ? (
        <Badge variant="outline">{item.specialization}</Badge>
      ) : '-',
    },
    {
      key: 'images',
      label: 'Gallery',
      render: (item: Trainer) => (
        <span className="text-sm text-muted-foreground">
          {item.images?.length || 0} foto
        </span>
      ),
    },
    { key: 'sort_order', label: 'Order' },
    {
      key: 'is_active',
      label: 'Status',
      render: (item: Trainer) => (
        <Badge variant={item.is_active ? 'default' : 'secondary'}>
          {item.is_active ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
  ];

  return (
    <AdminLayout title="Portfolio">
      <AdminTable
        data={trainers as Trainer[]}
        columns={columns}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onCreate={handleCreate}
        createLabel="Add Portfolio"
        isLoading={isLoading}
      />

      <AdminFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        title={editingItem ? 'Edit Portfolio' : 'Add Portfolio'}
        onSubmit={handleSubmit}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Photo (Cover)</Label>
            <ImageUpload
              value={formData.photo_url}
              onChange={(url) => setFormData({ ...formData, photo_url: url })}
              folder="portfolio"
            />
            <p className="text-xs text-muted-foreground">
              Foto utama yang ditampilkan di halaman portfolio
            </p>
          </div>

          <div className="space-y-2">
            <Label>Name *</Label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Wedding Reception John & Jane"
            />
          </div>

          <div className="space-y-2">
            <Label>Event Category</Label>
            <Select
              value={formData.specialization}
              onValueChange={(value) => setFormData({ ...formData, specialization: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih kategori event" />
              </SelectTrigger>
              <SelectContent>
                {eventCategories.map((cat) => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              placeholder="Deskripsi singkat tentang event ini..."
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label>Gallery</Label>
            <MultiImageUpload
              value={formData.images}
              onChange={(urls) => setFormData({ ...formData, images: urls })}
              folder="portfolio"
              maxImages={20}
            />
            <p className="text-xs text-muted-foreground">
              Upload foto-foto dokumentasi event (maksimal 20 foto)
            </p>
          </div>

          <div className="space-y-2">
            <Label>Sort Order</Label>
            <Input
              type="number"
              value={formData.sort_order}
              onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
            />
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
        title="Delete Portfolio"
      />
    </AdminLayout>
  );
};

export default AdminTrainers;
