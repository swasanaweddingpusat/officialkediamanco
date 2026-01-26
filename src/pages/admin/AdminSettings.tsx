import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useSiteSettings, useUpdateSiteSettings } from '@/hooks/useCMS';
import { Skeleton } from '@/components/ui/skeleton';
import { ImageUpload } from '@/components/admin/ImageUpload';

const AdminSettings = () => {
  const { data: settings, isLoading } = useSiteSettings();
  const updateMutation = useUpdateSiteSettings();

  const [formData, setFormData] = useState({
    site_name: '',
    tagline: '',
    phone: '',
    email: '',
    address: '',
    whatsapp_link: '',
    instagram_link: '',
    facebook_link: '',
    tiktok_link: '',
    youtube_link: '',
    logo_url: '',
  });

  useEffect(() => {
    if (settings) {
      setFormData({
        site_name: settings.site_name || '',
        tagline: settings.tagline || '',
        phone: settings.phone || '',
        email: settings.email || '',
        address: settings.address || '',
        whatsapp_link: settings.whatsapp_link || '',
        instagram_link: settings.instagram_link || '',
        facebook_link: settings.facebook_link || '',
        tiktok_link: (settings as any).tiktok_link || '',
        youtube_link: (settings as any).youtube_link || '',
        logo_url: settings.logo_url || '',
      });
    }
  }, [settings]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (settings?.id) {
      await updateMutation.mutateAsync({ id: settings.id, ...formData });
    }
  };

  if (isLoading) {
    return (
      <AdminLayout title="Site Settings">
        <Card className="p-6 space-y-4">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </Card>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Site Settings">
      <form onSubmit={handleSubmit}>
        <Card className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <h3 className="font-display text-xl mb-4">Branding</h3>
            </div>

            <div className="md:col-span-2">
              <Label>Logo</Label>
              <p className="text-sm text-muted-foreground mb-2">
                Upload logo untuk ditampilkan di navbar (rekomendasi: PNG transparan, max 200x60px)
              </p>
              <ImageUpload
                value={formData.logo_url}
                onChange={(url) => setFormData({ ...formData, logo_url: url })}
                folder="branding"
              />
            </div>

            <div className="md:col-span-2">
              <h3 className="font-display text-xl mb-4 mt-4">General</h3>
            </div>
            
            <div>
              <Label>Site Name</Label>
              <Input
                value={formData.site_name}
                onChange={(e) => setFormData({ ...formData, site_name: e.target.value })}
                placeholder="Power Gym"
              />
            </div>
            <div>
              <Label>Tagline</Label>
              <Input
                value={formData.tagline}
                onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                placeholder="Get Strong Get Rewards"
              />
            </div>

            <div className="md:col-span-2">
              <h3 className="font-display text-xl mb-4 mt-4">Contact Information</h3>
            </div>

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
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="info@powergym.com"
              />
            </div>
            <div className="md:col-span-2">
              <Label>Address</Label>
              <Input
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Jakarta, Indonesia"
              />
            </div>

            <div className="md:col-span-2">
              <h3 className="font-display text-xl mb-4 mt-4">Social Media</h3>
            </div>

            <div>
              <Label>WhatsApp Link</Label>
              <Input
                value={formData.whatsapp_link}
                onChange={(e) => setFormData({ ...formData, whatsapp_link: e.target.value })}
                placeholder="https://wa.me/6281234567890"
              />
            </div>
            <div>
              <Label>Instagram Link</Label>
              <Input
                value={formData.instagram_link}
                onChange={(e) => setFormData({ ...formData, instagram_link: e.target.value })}
                placeholder="https://instagram.com/powergym"
              />
            </div>
            <div>
              <Label>Facebook Link</Label>
              <Input
                value={formData.facebook_link}
                onChange={(e) => setFormData({ ...formData, facebook_link: e.target.value })}
                placeholder="https://facebook.com/powergym"
              />
            </div>
            <div>
              <Label>TikTok Link</Label>
              <Input
                value={formData.tiktok_link}
                onChange={(e) => setFormData({ ...formData, tiktok_link: e.target.value })}
                placeholder="https://tiktok.com/@powergym"
              />
            </div>
            <div>
              <Label>YouTube Link</Label>
              <Input
                value={formData.youtube_link}
                onChange={(e) => setFormData({ ...formData, youtube_link: e.target.value })}
                placeholder="https://youtube.com/@powergym"
              />
            </div>
          </div>

          <div className="mt-8 flex justify-end">
            <Button type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? 'Saving...' : 'Save Settings'}
            </Button>
          </div>
        </Card>
      </form>
    </AdminLayout>
  );
};

export default AdminSettings;
