import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { AdminTable } from '@/components/admin/AdminTable';
import { AdminFormDialog } from '@/components/admin/AdminFormDialog';
import { DeleteConfirmDialog } from '@/components/admin/DeleteConfirmDialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useTrainers, useCreateTrainer, useUpdateTrainer, useDeleteTrainer } from '@/hooks/useCMS';
import { Badge } from '@/components/ui/badge';

type Trainer = {
  id: string;
  name: string;
  specialization: string | null;
  bio: string | null;
  photo_url: string | null;
  instagram: string | null;
  certifications: string[] | null;
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
    instagram: '',
    certifications: '',
    sort_order: 0,
    is_active: true,
  });

  const resetForm = () => {
    setFormData({ name: '', specialization: '', bio: '', photo_url: '', instagram: '', certifications: '', sort_order: 0, is_active: true });
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
      instagram: item.instagram || '',
      certifications: item.certifications?.join(', ') || '',
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
      instagram: formData.instagram || undefined,
      certifications: formData.certifications ? formData.certifications.split(',').map(s => s.trim()).filter(Boolean) : undefined,
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
    { key: 'name', label: 'Name' },
    { key: 'specialization', label: 'Specialization' },
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
    <AdminLayout title="Trainers">
      <AdminTable
        data={trainers as Trainer[]}
        columns={columns}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onCreate={handleCreate}
        createLabel="Add Trainer"
        isLoading={isLoading}
      />

      <AdminFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        title={editingItem ? 'Edit Trainer' : 'Add Trainer'}
        onSubmit={handleSubmit}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
      >
        <div className="space-y-4">
          <div>
            <Label>Name *</Label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="John Doe"
            />
          </div>
          <div>
            <Label>Specialization</Label>
            <Input
              value={formData.specialization}
              onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
              placeholder="Strength & Conditioning"
            />
          </div>
          <div>
            <Label>Bio</Label>
            <Textarea
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              placeholder="10+ years of experience..."
            />
          </div>
          <div>
            <Label>Photo URL</Label>
            <Input
              value={formData.photo_url}
              onChange={(e) => setFormData({ ...formData, photo_url: e.target.value })}
              placeholder="https://..."
            />
          </div>
          <div>
            <Label>Instagram Username</Label>
            <Input
              value={formData.instagram}
              onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
              placeholder="johndoe_fitness"
            />
          </div>
          <div>
            <Label>Certifications (comma separated)</Label>
            <Input
              value={formData.certifications}
              onChange={(e) => setFormData({ ...formData, certifications: e.target.value })}
              placeholder="ACE, NASM, CrossFit L1"
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
        title="Delete Trainer"
      />
    </AdminLayout>
  );
};

export default AdminTrainers;
