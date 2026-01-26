import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { AdminTable } from '@/components/admin/AdminTable';
import { AdminFormDialog } from '@/components/admin/AdminFormDialog';
import { DeleteConfirmDialog } from '@/components/admin/DeleteConfirmDialog';
import { MultiImageUpload } from '@/components/admin/MultiImageUpload';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useLocations, useCreateLocation, useUpdateLocation, useDeleteLocation } from '@/hooks/useCMS';
import { Badge } from '@/components/ui/badge';

type Location = {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  google_maps_url: string | null;
  image_url: string | null;
  images: string[] | null;
  facilities: string[] | null;
  is_coming_soon: boolean | null;
  sort_order: number | null;
  is_active: boolean | null;
};

const AdminLocations = () => {
  const { data: locations = [], isLoading } = useLocations();
  const createMutation = useCreateLocation();
  const updateMutation = useUpdateLocation();
  const deleteMutation = useDeleteLocation();

  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Location | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: '',
    email: '',
    google_maps_url: '',
    images: [] as string[],
    facilities: '',
    is_coming_soon: false,
    sort_order: 0,
    is_active: true,
  });

  const resetForm = () => {
    setFormData({ name: '', address: '', phone: '', email: '', google_maps_url: '', images: [], facilities: '', is_coming_soon: false, sort_order: 0, is_active: true });
    setEditingItem(null);
  };

  const handleCreate = () => {
    resetForm();
    setFormOpen(true);
  };

  const handleEdit = (item: Location) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      address: item.address || '',
      phone: item.phone || '',
      email: item.email || '',
      google_maps_url: item.google_maps_url || '',
      images: item.images || (item.image_url ? [item.image_url] : []),
      facilities: item.facilities?.join(', ') || '',
      is_coming_soon: item.is_coming_soon ?? false,
      sort_order: item.sort_order || 0,
      is_active: item.is_active ?? true,
    });
    setFormOpen(true);
  };

  const handleDelete = (item: Location) => {
    setDeletingId(item.id);
    setDeleteOpen(true);
  };

  const handleSubmit = async () => {
    const submitData = {
      name: formData.name,
      address: formData.address || undefined,
      phone: formData.phone || undefined,
      email: formData.email || undefined,
      google_maps_url: formData.google_maps_url || undefined,
      image_url: formData.images[0] || undefined,
      images: formData.images.length > 0 ? formData.images : undefined,
      facilities: formData.facilities ? formData.facilities.split(',').map(s => s.trim()).filter(Boolean) : undefined,
      is_coming_soon: formData.is_coming_soon,
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
      key: 'images',
      label: 'Images',
      render: (item: Location) => {
        const images = item.images || (item.image_url ? [item.image_url] : []);
        return images.length > 0 ? (
          <div className="flex -space-x-2">
            {images.slice(0, 3).map((url, i) => (
              <img key={i} src={url} alt="" className="w-10 h-10 object-cover rounded border-2 border-background" />
            ))}
            {images.length > 3 && (
              <div className="w-10 h-10 rounded border-2 border-background bg-muted flex items-center justify-center text-xs font-medium">
                +{images.length - 3}
              </div>
            )}
          </div>
        ) : <span className="text-muted-foreground">-</span>;
      },
    },
    { key: 'name', label: 'Name' },
    { key: 'address', label: 'Address' },
    {
      key: 'is_coming_soon',
      label: 'Coming Soon',
      render: (item: Location) => item.is_coming_soon ? <Badge variant="outline">Coming Soon</Badge> : '-',
    },
    {
      key: 'is_active',
      label: 'Status',
      render: (item: Location) => (
        <Badge variant={item.is_active ? 'default' : 'secondary'}>
          {item.is_active ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
  ];

  return (
    <AdminLayout title="Locations">
      <AdminTable
        data={locations as Location[]}
        columns={columns}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onCreate={handleCreate}
        createLabel="Add Location"
        isLoading={isLoading}
      />

      <AdminFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        title={editingItem ? 'Edit Location' : 'Add Location'}
        onSubmit={handleSubmit}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
      >
        <div className="space-y-4">
          <div>
            <Label>Images</Label>
            <MultiImageUpload
              value={formData.images}
              onChange={(urls) => setFormData({ ...formData, images: urls })}
              folder="locations"
              maxImages={10}
            />
            <p className="text-xs text-muted-foreground mt-1">Gambar pertama akan menjadi gambar utama</p>
          </div>
          <div>
            <Label>Name *</Label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Jakarta Selatan"
            />
          </div>
          <div>
            <Label>Address</Label>
            <Textarea
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Jl. Sudirman No. 123..."
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Phone</Label>
              <Input
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+62 21 1234567"
              />
            </div>
            <div>
              <Label>Email</Label>
              <Input
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="jaksel@powergym.com"
              />
            </div>
          </div>
          <div>
            <Label>Google Maps URL</Label>
            <Input
              value={formData.google_maps_url}
              onChange={(e) => setFormData({ ...formData, google_maps_url: e.target.value })}
              placeholder="https://maps.google.com/..."
            />
          </div>
          <div>
            <Label>Facilities (comma separated)</Label>
            <Input
              value={formData.facilities}
              onChange={(e) => setFormData({ ...formData, facilities: e.target.value })}
              placeholder="Sauna, Swimming Pool, Parking"
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
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Switch
                checked={formData.is_coming_soon}
                onCheckedChange={(checked) => setFormData({ ...formData, is_coming_soon: checked })}
              />
              <Label>Coming Soon</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
              <Label>Active</Label>
            </div>
          </div>
        </div>
      </AdminFormDialog>

      <DeleteConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onConfirm={handleConfirmDelete}
        isDeleting={deleteMutation.isPending}
        title="Delete Location"
      />
    </AdminLayout>
  );
};

export default AdminLocations;
