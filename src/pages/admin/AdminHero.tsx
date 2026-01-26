import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { AdminTable } from '@/components/admin/AdminTable';
import { AdminFormDialog } from '@/components/admin/AdminFormDialog';
import { DeleteConfirmDialog } from '@/components/admin/DeleteConfirmDialog';
import { ImageUpload } from '@/components/admin/ImageUpload';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useHeroSlides, useCreateHeroSlide, useUpdateHeroSlide, useDeleteHeroSlide } from '@/hooks/useCMS';
import { Badge } from '@/components/ui/badge';

type HeroSlide = {
  id: string;
  title: string;
  subtitle: string | null;
  image_url: string | null;
  button_text: string | null;
  button_link: string | null;
  sort_order: number | null;
  is_active: boolean | null;
};

const AdminHero = () => {
  const { data: slides = [], isLoading } = useHeroSlides();
  const createMutation = useCreateHeroSlide();
  const updateMutation = useUpdateHeroSlide();
  const deleteMutation = useDeleteHeroSlide();

  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<HeroSlide | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    image_url: '',
    button_text: '',
    button_link: '',
    sort_order: 0,
    is_active: true,
  });

  const resetForm = () => {
    setFormData({
      title: '',
      subtitle: '',
      image_url: '',
      button_text: '',
      button_link: '',
      sort_order: 0,
      is_active: true,
    });
    setEditingItem(null);
  };

  const handleCreate = () => {
    resetForm();
    setFormOpen(true);
  };

  const handleEdit = (item: HeroSlide) => {
    setEditingItem(item);
    setFormData({
      title: item.title,
      subtitle: item.subtitle || '',
      image_url: item.image_url || '',
      button_text: item.button_text || '',
      button_link: item.button_link || '',
      sort_order: item.sort_order || 0,
      is_active: item.is_active ?? true,
    });
    setFormOpen(true);
  };

  const handleDelete = (item: HeroSlide) => {
    setDeletingId(item.id);
    setDeleteOpen(true);
  };

  const handleSubmit = async () => {
    if (editingItem) {
      await updateMutation.mutateAsync({ id: editingItem.id, ...formData });
    } else {
      await createMutation.mutateAsync(formData);
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
      render: (item: HeroSlide) => item.image_url ? (
        <img src={item.image_url} alt="" className="w-16 h-10 object-cover rounded" />
      ) : <span className="text-muted-foreground">-</span>,
    },
    { key: 'title', label: 'Title' },
    { key: 'sort_order', label: 'Order' },
    {
      key: 'is_active',
      label: 'Status',
      render: (item: HeroSlide) => (
        <Badge variant={item.is_active ? 'default' : 'secondary'}>
          {item.is_active ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
  ];

  return (
    <AdminLayout title="Hero Slides">
      <AdminTable
        data={slides as HeroSlide[]}
        columns={columns}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onCreate={handleCreate}
        createLabel="Add Slide"
        isLoading={isLoading}
      />

      <AdminFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        title={editingItem ? 'Edit Slide' : 'Add Slide'}
        onSubmit={handleSubmit}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
      >
        <div className="space-y-4">
          <div>
            <Label>Image</Label>
            <ImageUpload
              value={formData.image_url}
              onChange={(url) => setFormData({ ...formData, image_url: url })}
              folder="hero"
            />
          </div>
          <div>
            <Label>Title *</Label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="GET STRONG GET REWARDS"
            />
          </div>
          <div>
            <Label>Subtitle</Label>
            <Input
              value={formData.subtitle}
              onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
              placeholder="Transform your body"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Button Text</Label>
              <Input
                value={formData.button_text}
                onChange={(e) => setFormData({ ...formData, button_text: e.target.value })}
                placeholder="Join Now"
              />
            </div>
            <div>
              <Label>Button Link</Label>
              <Input
                value={formData.button_link}
                onChange={(e) => setFormData({ ...formData, button_link: e.target.value })}
                placeholder="/register"
              />
            </div>
          </div>
          <div>
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
        title="Delete Slide"
      />
    </AdminLayout>
  );
};

export default AdminHero;
