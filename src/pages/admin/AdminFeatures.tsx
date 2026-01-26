import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { AdminTable } from '@/components/admin/AdminTable';
import { AdminFormDialog } from '@/components/admin/AdminFormDialog';
import { DeleteConfirmDialog } from '@/components/admin/DeleteConfirmDialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useFeatures, useCreateFeature, useUpdateFeature, useDeleteFeature } from '@/hooks/useCMS';
import { Badge } from '@/components/ui/badge';

type Feature = {
  id: string;
  title: string;
  description: string | null;
  icon: string | null;
  sort_order: number | null;
  is_active: boolean | null;
};

const iconOptions = ['Dumbbell', 'Users', 'Clock', 'Zap', 'Shield', 'Award', 'Heart', 'Target'];

const AdminFeatures = () => {
  const { data: features = [], isLoading } = useFeatures();
  const createMutation = useCreateFeature();
  const updateMutation = useUpdateFeature();
  const deleteMutation = useDeleteFeature();

  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Feature | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    icon: 'Dumbbell',
    sort_order: 0,
    is_active: true,
  });

  const resetForm = () => {
    setFormData({ title: '', description: '', icon: 'Dumbbell', sort_order: 0, is_active: true });
    setEditingItem(null);
  };

  const handleCreate = () => {
    resetForm();
    setFormOpen(true);
  };

  const handleEdit = (item: Feature) => {
    setEditingItem(item);
    setFormData({
      title: item.title,
      description: item.description || '',
      icon: item.icon || 'Dumbbell',
      sort_order: item.sort_order || 0,
      is_active: item.is_active ?? true,
    });
    setFormOpen(true);
  };

  const handleDelete = (item: Feature) => {
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
    { key: 'title', label: 'Title' },
    { key: 'icon', label: 'Icon' },
    { key: 'sort_order', label: 'Order' },
    {
      key: 'is_active',
      label: 'Status',
      render: (item: Feature) => (
        <Badge variant={item.is_active ? 'default' : 'secondary'}>
          {item.is_active ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
  ];

  return (
    <AdminLayout title="Features">
      <AdminTable
        data={features as Feature[]}
        columns={columns}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onCreate={handleCreate}
        createLabel="Add Feature"
        isLoading={isLoading}
      />

      <AdminFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        title={editingItem ? 'Edit Feature' : 'Add Feature'}
        onSubmit={handleSubmit}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
      >
        <div className="space-y-4">
          <div>
            <Label>Title *</Label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Modern Equipment"
            />
          </div>
          <div>
            <Label>Description</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="State-of-the-art fitness equipment..."
            />
          </div>
          <div>
            <Label>Icon</Label>
            <Select value={formData.icon} onValueChange={(value) => setFormData({ ...formData, icon: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {iconOptions.map((icon) => (
                  <SelectItem key={icon} value={icon}>{icon}</SelectItem>
                ))}
              </SelectContent>
            </Select>
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
        title="Delete Feature"
      />
    </AdminLayout>
  );
};

export default AdminFeatures;
