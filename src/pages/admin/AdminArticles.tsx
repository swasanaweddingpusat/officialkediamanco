import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { AdminTable } from '@/components/admin/AdminTable';
import { AdminFormDialog } from '@/components/admin/AdminFormDialog';
import { DeleteConfirmDialog } from '@/components/admin/DeleteConfirmDialog';
import { ImageUpload } from '@/components/admin/ImageUpload';
import { RichTextEditor } from '@/components/admin/RichTextEditor';
import { ArticlePreview } from '@/components/admin/ArticlePreview';
import { useArticles, useCreateArticle, useUpdateArticle, useDeleteArticle } from '@/hooks/useCMS';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { format } from 'date-fns';
import { Eye } from 'lucide-react';

const categories = [
  'Tips & Trik',
  'Event',
  'Venue',
  'Wedding',
  'Corporate',
  'News',
  'Promo',
];

type Article = NonNullable<ReturnType<typeof useArticles>['data']>[number];

const AdminArticles = () => {
  const { data: articles, isLoading } = useArticles();
  const createMutation = useCreateArticle();
  const updateMutation = useUpdateArticle();
  const deleteMutation = useDeleteArticle();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Article | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    featured_image: '',
    author_name: '',
    category: '',
    tags: '',
    meta_title: '',
    meta_description: '',
    meta_keywords: '',
    reading_time: 5,
    is_published: false,
    sort_order: 0,
  });

  const columns = [
    {
      key: 'featured_image' as const,
      label: 'Image',
      render: (item: Article) => item.featured_image ? (
        <img src={item.featured_image} alt="" className="w-16 h-12 object-cover rounded" />
      ) : (
        <div className="w-16 h-12 bg-muted rounded flex items-center justify-center text-xs">No img</div>
      ),
    },
    { key: 'title' as const, label: 'Title' },
    { key: 'category' as const, label: 'Category' },
    { key: 'author_name' as const, label: 'Author' },
    {
      key: 'is_published' as const,
      label: 'Status',
      render: (item: Article) => (
        <Badge variant={item.is_published ? 'default' : 'secondary'}>
          {item.is_published ? 'Published' : 'Draft'}
        </Badge>
      ),
    },
    {
      key: 'published_at' as const,
      label: 'Published',
      render: (item: Article) => item.published_at ? format(new Date(item.published_at), 'dd/MM/yyyy') : '-',
    },
    { 
      key: 'view_count' as const, 
      label: 'Views',
      render: (item: Article) => item.view_count || 0,
    },
  ];

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const handleCreate = () => {
    setEditingItem(null);
    setFormData({
      title: '',
      slug: '',
      excerpt: '',
      content: '',
      featured_image: '',
      author_name: '',
      category: '',
      tags: '',
      meta_title: '',
      meta_description: '',
      meta_keywords: '',
      reading_time: 5,
      is_published: false,
      sort_order: 0,
    });
    setIsDialogOpen(true);
  };

  const handleEdit = (item: Article) => {
    setEditingItem(item);
    setFormData({
      title: item.title,
      slug: item.slug,
      excerpt: item.excerpt || '',
      content: item.content || '',
      featured_image: item.featured_image || '',
      author_name: item.author_name || '',
      category: item.category || '',
      tags: item.tags?.join(', ') || '',
      meta_title: item.meta_title || '',
      meta_description: item.meta_description || '',
      meta_keywords: item.meta_keywords || '',
      reading_time: item.reading_time || 5,
      is_published: item.is_published || false,
      sort_order: item.sort_order || 0,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (item: Article) => {
    setDeletingId(item.id);
    setIsDeleteDialogOpen(true);
  };

  const handleSubmit = async () => {
    const submitData = {
      title: formData.title,
      slug: formData.slug || generateSlug(formData.title),
      excerpt: formData.excerpt || null,
      content: formData.content || null,
      featured_image: formData.featured_image || null,
      author_name: formData.author_name || null,
      category: formData.category || null,
      tags: formData.tags ? formData.tags.split(',').map(s => s.trim()).filter(Boolean) : null,
      meta_title: formData.meta_title || null,
      meta_description: formData.meta_description || null,
      meta_keywords: formData.meta_keywords || null,
      reading_time: formData.reading_time,
      is_published: formData.is_published,
      published_at: formData.is_published ? new Date().toISOString() : null,
      sort_order: formData.sort_order,
    };

    if (editingItem) {
      await updateMutation.mutateAsync({ id: editingItem.id, ...submitData });
    } else {
      await createMutation.mutateAsync(submitData);
    }
    setIsDialogOpen(false);
  };

  const confirmDelete = async () => {
    if (deletingId) {
      await deleteMutation.mutateAsync(deletingId);
      setIsDeleteDialogOpen(false);
      setDeletingId(null);
    }
  };

  return (
    <AdminLayout title="Manage Articles">
      <AdminTable
        data={articles || []}
        columns={columns}
        isLoading={isLoading}
        onCreate={handleCreate}
        onEdit={handleEdit}
        onDelete={handleDelete}
        createLabel="Add Article"
      />

      <AdminFormDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSubmit={handleSubmit}
        title={editingItem ? 'Edit Article' : 'Create Article'}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
        extraActions={
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => setIsPreviewOpen(true)}
            className="gap-2"
          >
            <Eye className="w-4 h-4" />
            Preview
          </Button>
        }
      >
        <Tabs defaultValue="content" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="content">Konten</TabsTrigger>
            <TabsTrigger value="seo">SEO</TabsTrigger>
            <TabsTrigger value="settings">Pengaturan</TabsTrigger>
          </TabsList>

          <TabsContent value="content" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="title">Judul Artikel *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => {
                  setFormData({ 
                    ...formData, 
                    title: e.target.value,
                    slug: generateSlug(e.target.value)
                  });
                }}
                placeholder="Masukkan judul artikel"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">Slug URL</Label>
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                placeholder="judul-artikel-url-friendly"
              />
              <p className="text-xs text-muted-foreground">
                URL: /blog/{formData.slug || 'judul-artikel'}
              </p>
            </div>

            <div className="space-y-2">
              <Label>Featured Image</Label>
              <ImageUpload
                value={formData.featured_image}
                onChange={(url) => setFormData({ ...formData, featured_image: url })}
                folder="articles"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="excerpt">Ringkasan / Excerpt</Label>
              <Textarea
                id="excerpt"
                value={formData.excerpt}
                onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                placeholder="Ringkasan singkat artikel (160 karakter)"
                rows={3}
              />
              <p className="text-xs text-muted-foreground">
                {formData.excerpt.length}/160 karakter
              </p>
            </div>

            <div className="space-y-2">
              <Label>Konten Artikel</Label>
              <RichTextEditor
                value={formData.content}
                onChange={(content) => setFormData({ ...formData, content })}
                placeholder="Mulai menulis konten artikel..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Kategori</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih kategori" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="author_name">Penulis</Label>
                <Input
                  id="author_name"
                  value={formData.author_name}
                  onChange={(e) => setFormData({ ...formData, author_name: e.target.value })}
                  placeholder="Nama penulis"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tags">Tags (pisahkan dengan koma)</Label>
              <Input
                id="tags"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                placeholder="wedding, venue, tips"
              />
            </div>
          </TabsContent>

          <TabsContent value="seo" className="space-y-4 mt-4">
            <div className="p-4 bg-muted rounded-lg mb-4">
              <h3 className="font-semibold mb-2">Tips SEO untuk Ranking Google #1</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Meta Title: Maksimal 60 karakter, sertakan keyword utama</li>
                <li>• Meta Description: 155-160 karakter, menarik & informatif</li>
                <li>• Keywords: 3-5 keyword utama yang relevan</li>
                <li>• Gunakan heading (H1, H2, H3) dalam konten</li>
                <li>• Sertakan internal & external links</li>
              </ul>
            </div>

            <div className="space-y-2">
              <Label htmlFor="meta_title">Meta Title</Label>
              <Input
                id="meta_title"
                value={formData.meta_title}
                onChange={(e) => setFormData({ ...formData, meta_title: e.target.value })}
                placeholder="Judul untuk SEO (maks 60 karakter)"
                maxLength={60}
              />
              <p className="text-xs text-muted-foreground">
                {formData.meta_title.length}/60 karakter
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="meta_description">Meta Description</Label>
              <Textarea
                id="meta_description"
                value={formData.meta_description}
                onChange={(e) => setFormData({ ...formData, meta_description: e.target.value })}
                placeholder="Deskripsi untuk hasil pencarian Google (155-160 karakter)"
                rows={3}
                maxLength={160}
              />
              <p className="text-xs text-muted-foreground">
                {formData.meta_description.length}/160 karakter
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="meta_keywords">Meta Keywords</Label>
              <Input
                id="meta_keywords"
                value={formData.meta_keywords}
                onChange={(e) => setFormData({ ...formData, meta_keywords: e.target.value })}
                placeholder="keyword1, keyword2, keyword3"
              />
            </div>

            {/* SEO Preview */}
            <div className="space-y-2">
              <Label>Preview di Google</Label>
              <div className="p-4 bg-background border rounded-lg">
                <p className="text-primary text-lg hover:underline cursor-pointer truncate">
                  {formData.meta_title || formData.title || 'Judul Artikel'}
                </p>
                <p className="text-sm text-muted-foreground">
                  kediamancorp.com/blog/{formData.slug || 'judul-artikel'}
                </p>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {formData.meta_description || formData.excerpt || 'Deskripsi artikel akan muncul di sini...'}
                </p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="settings" className="space-y-4 mt-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Publikasikan</Label>
                <p className="text-sm text-muted-foreground">
                  Artikel akan terlihat di halaman blog
                </p>
              </div>
              <Switch
                checked={formData.is_published}
                onCheckedChange={(checked) => setFormData({ ...formData, is_published: checked })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="reading_time">Waktu Baca (menit)</Label>
                <Input
                  id="reading_time"
                  type="number"
                  min="1"
                  value={formData.reading_time}
                  onChange={(e) => setFormData({ ...formData, reading_time: parseInt(e.target.value) || 5 })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sort_order">Sort Order</Label>
                <Input
                  id="sort_order"
                  type="number"
                  value={formData.sort_order}
                  onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </AdminFormDialog>

      {/* Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-5xl h-[90vh] p-0">
          <ArticlePreview
            title={formData.title}
            excerpt={formData.excerpt}
            content={formData.content}
            featured_image={formData.featured_image}
            author_name={formData.author_name}
            category={formData.category}
            tags={formData.tags}
            reading_time={formData.reading_time}
            onClose={() => setIsPreviewOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <DeleteConfirmDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={confirmDelete}
        isDeleting={deleteMutation.isPending}
      />
    </AdminLayout>
  );
};

export default AdminArticles;
