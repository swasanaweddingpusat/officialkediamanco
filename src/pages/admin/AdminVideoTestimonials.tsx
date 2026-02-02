import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { AdminTable } from '@/components/admin/AdminTable';
import { AdminFormDialog } from '@/components/admin/AdminFormDialog';
import { DeleteConfirmDialog } from '@/components/admin/DeleteConfirmDialog';
import { VideoUpload } from '@/components/admin/VideoUpload';
import { ImageUpload } from '@/components/admin/ImageUpload';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Play } from 'lucide-react';
import { useAllVideoTestimonials, useCreateVideoTestimonial, useUpdateVideoTestimonial, useDeleteVideoTestimonial } from '@/hooks/useCMS';
import { Dialog, DialogContent } from '@/components/ui/dialog';

interface VideoTestimonial {
  id: string;
  name: string;
  role: string | null;
  video_url: string;
  thumbnail_url: string | null;
  is_active: boolean | null;
  sort_order: number | null;
}

const AdminVideoTestimonials = () => {
  const { data: testimonials, isLoading } = useAllVideoTestimonials();
  const createMutation = useCreateVideoTestimonial();
  const updateMutation = useUpdateVideoTestimonial();
  const deleteMutation = useDeleteVideoTestimonial();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<VideoTestimonial | null>(null);
  const [previewVideo, setPreviewVideo] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    role: '',
    video_url: '',
    thumbnail_url: '',
    is_active: true,
    sort_order: 0,
  });

  const columns = [
    {
      key: 'video_url' as keyof VideoTestimonial,
      label: 'Video',
      render: (item: VideoTestimonial) => (
        <div
          className="w-16 h-24 bg-secondary rounded-lg overflow-hidden cursor-pointer relative group"
          onClick={() => setPreviewVideo(item.video_url)}
        >
          <video src={item.video_url} className="w-full h-full object-cover" muted preload="metadata" />
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <Play className="w-6 h-6 text-white" fill="currentColor" />
          </div>
        </div>
      ),
    },
    { key: 'name' as keyof VideoTestimonial, label: 'Nama' },
    { key: 'role' as keyof VideoTestimonial, label: 'Role' },
    { key: 'sort_order' as keyof VideoTestimonial, label: 'Urutan' },
    {
      key: 'is_active' as keyof VideoTestimonial,
      label: 'Status',
      render: (item: VideoTestimonial) => (
        <span className={`px-2 py-1 rounded-full text-xs ${item.is_active ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}>
          {item.is_active ? 'Active' : 'Inactive'}
        </span>
      ),
    },
  ];

  const handleAdd = () => {
    setSelectedItem(null);
    setFormData({
      name: '',
      role: '',
      video_url: '',
      thumbnail_url: '',
      is_active: true,
      sort_order: (testimonials?.length || 0) + 1,
    });
    setIsFormOpen(true);
  };

  const handleEdit = (item: VideoTestimonial) => {
    setSelectedItem(item);
    setFormData({
      name: item.name,
      role: item.role || '',
      video_url: item.video_url,
      thumbnail_url: item.thumbnail_url || '',
      is_active: item.is_active ?? true,
      sort_order: item.sort_order ?? 0,
    });
    setIsFormOpen(true);
  };

  const handleDelete = (item: VideoTestimonial) => {
    setSelectedItem(item);
    setIsDeleteOpen(true);
  };

  const handleSubmit = async () => {
    if (selectedItem) {
      await updateMutation.mutateAsync({ id: selectedItem.id, ...formData });
    } else {
      await createMutation.mutateAsync(formData);
    }
    setIsFormOpen(false);
  };

  const handleConfirmDelete = async () => {
    if (selectedItem) {
      await deleteMutation.mutateAsync(selectedItem.id);
      setIsDeleteOpen(false);
    }
  };

  return (
    <AdminLayout title="Video Testimonials">
      <AdminTable
        data={testimonials || []}
        columns={columns}
        isLoading={isLoading}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onCreate={handleAdd}
        createLabel="Add Video Testimonial"
      />

      <AdminFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        title={selectedItem ? 'Edit Video Testimonial' : 'Add Video Testimonial'}
        onSubmit={handleSubmit}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
      >
        <div className="space-y-4">
          <div>
            <Label>Video *</Label>
            <VideoUpload
              value={formData.video_url}
              onChange={(url) => setFormData({ ...formData, video_url: url })}
              folder="video-testimonials"
            />
          </div>

          <div>
            <Label>Thumbnail (Optional)</Label>
            <ImageUpload
              value={formData.thumbnail_url}
              onChange={(url) => setFormData({ ...formData, thumbnail_url: url })}
              folder="video-testimonials"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Jika tidak diupload, frame pertama video akan digunakan
            </p>
          </div>

          <div>
            <Label htmlFor="name">Nama *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Nama klien"
              required
            />
          </div>

          <div>
            <Label htmlFor="role">Role / Posisi</Label>
            <Input
              id="role"
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              placeholder="e.g. CEO, Entrepreneur, etc."
            />
          </div>

          <div>
            <Label htmlFor="sort_order">Sort Order</Label>
            <Input
              id="sort_order"
              type="number"
              value={formData.sort_order}
              onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="is_active">Active</Label>
            <Switch
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
            />
          </div>
        </div>
      </AdminFormDialog>

      <DeleteConfirmDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        onConfirm={handleConfirmDelete}
        title="Delete Video Testimonial"
        description={`Are you sure you want to delete "${selectedItem?.name}"? This action cannot be undone.`}
        isDeleting={deleteMutation.isPending}
      />

      {/* Video Preview Modal */}
      <Dialog open={!!previewVideo} onOpenChange={() => setPreviewVideo(null)}>
        <DialogContent className="max-w-3xl p-0 bg-black border-none overflow-hidden">
          {previewVideo && (
            <video
              src={previewVideo}
              className="w-full aspect-[9/16] max-h-[80vh] object-contain"
              controls
              autoPlay
            />
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminVideoTestimonials;
