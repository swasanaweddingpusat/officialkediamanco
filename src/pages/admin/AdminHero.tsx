import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { AdminTable } from '@/components/admin/AdminTable';
import { AdminFormDialog } from '@/components/admin/AdminFormDialog';
import { DeleteConfirmDialog } from '@/components/admin/DeleteConfirmDialog';
import { ImageUpload } from '@/components/admin/ImageUpload';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useHeroSlides, useCreateHeroSlide, useUpdateHeroSlide, useDeleteHeroSlide } from '@/hooks/useCMS';
import { Badge } from '@/components/ui/badge';

type HeroSlide = {
  id: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  image_url: string | null;
  button_text: string | null;
  button_link: string | null;
  button_visible: boolean | null;
  button2_text: string | null;
  button2_link: string | null;
  button2_size: string | null;
  button2_visible: boolean | null;
  title_size: string | null;
  button_size: string | null;
  content_position: string | null;
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
    description: '',
    image_url: '',
    button_text: '',
    button_link: '',
    button_visible: true,
    button2_text: '',
    button2_link: '',
    button2_size: 'large',
    button2_visible: true,
    title_size: 'large',
    button_size: 'large',
    content_position: 'left',
    sort_order: 0,
    is_active: true,
  });

  const resetForm = () => {
    setFormData({
      title: '',
      subtitle: '',
      description: '',
      image_url: '',
      button_text: '',
      button_link: '',
      button_visible: true,
      button2_text: '',
      button2_link: '',
      button2_size: 'large',
      button2_visible: true,
      title_size: 'large',
      button_size: 'large',
      content_position: 'left',
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
      description: item.description || '',
      image_url: item.image_url || '',
      button_text: item.button_text || '',
      button_link: item.button_link || '',
      button_visible: item.button_visible ?? true,
      button2_text: item.button2_text || '',
      button2_link: item.button2_link || '',
      button2_size: item.button2_size || 'large',
      button2_visible: item.button2_visible ?? true,
      title_size: item.title_size || 'large',
      button_size: item.button_size || 'large',
      content_position: item.content_position || 'left',
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
          <div>
            <Label>Description</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Transform your body and mind with state-of-the-art equipment..."
              rows={3}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Title Size</Label>
              <Select
                value={formData.title_size}
                onValueChange={(value) => setFormData({ ...formData, title_size: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select size" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="small">Small</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="large">Large</SelectItem>
                  <SelectItem value="xlarge">Extra Large</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>Content Position</Label>
            <Select
              value={formData.content_position}
              onValueChange={(value) => setFormData({ ...formData, content_position: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select position" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="left">Left</SelectItem>
                <SelectItem value="center">Center</SelectItem>
                <SelectItem value="right">Right</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {/* Button 1 */}
          <div className="border rounded-lg p-4 space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">Button 1 (Primary)</Label>
              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.button_visible}
                  onCheckedChange={(checked) => setFormData({ ...formData, button_visible: checked })}
                />
                <Label className="text-sm">Visible</Label>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Button Text</Label>
                <Input
                  value={formData.button_text}
                  onChange={(e) => setFormData({ ...formData, button_text: e.target.value })}
                  placeholder="Start Your Journey"
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
              <Label>Button Size</Label>
              <Select
                value={formData.button_size}
                onValueChange={(value) => setFormData({ ...formData, button_size: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select size" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="small">Small</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="large">Large</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Button 2 */}
          <div className="border rounded-lg p-4 space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">Button 2 (Secondary)</Label>
              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.button2_visible}
                  onCheckedChange={(checked) => setFormData({ ...formData, button2_visible: checked })}
                />
                <Label className="text-sm">Visible</Label>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Button Text</Label>
                <Input
                  value={formData.button2_text}
                  onChange={(e) => setFormData({ ...formData, button2_text: e.target.value })}
                  placeholder="View Special Offers"
                />
              </div>
              <div>
                <Label>Button Link</Label>
                <Input
                  value={formData.button2_link}
                  onChange={(e) => setFormData({ ...formData, button2_link: e.target.value })}
                  placeholder="/offers"
                />
              </div>
            </div>
            <div>
              <Label>Button Size</Label>
              <Select
                value={formData.button2_size}
                onValueChange={(value) => setFormData({ ...formData, button2_size: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select size" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="small">Small</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="large">Large</SelectItem>
                </SelectContent>
              </Select>
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
