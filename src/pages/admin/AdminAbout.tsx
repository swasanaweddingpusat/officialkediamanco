import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useAboutSettings, useUpdateAboutSettings } from '@/hooks/useCMS';
import { Save, Plus, Trash2 } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

type ValueItem = { icon: string; title: string; description: string };
type StatItem = { number: string; label: string };

const AdminAbout = () => {
  const { data: about, isLoading } = useAboutSettings();
  const updateMutation = useUpdateAboutSettings();

  const [formData, setFormData] = useState({
    hero_subtitle: '',
    hero_title: '',
    hero_description: '',
    vision_title: '',
    vision_description: '',
    mission_items: [] as string[],
    values_items: [] as ValueItem[],
    stats_items: [] as StatItem[],
    cta_subtitle: '',
    cta_title: '',
    cta_description: '',
  });

  useEffect(() => {
    if (about) {
      setFormData({
        hero_subtitle: about.hero_subtitle || '',
        hero_title: about.hero_title || '',
        hero_description: about.hero_description || '',
        vision_title: about.vision_title || '',
        vision_description: about.vision_description || '',
        mission_items: (about.mission_items as string[]) || [],
        values_items: (about.values_items as ValueItem[]) || [],
        stats_items: (about.stats_items as StatItem[]) || [],
        cta_subtitle: about.cta_subtitle || '',
        cta_title: about.cta_title || '',
        cta_description: about.cta_description || '',
      });
    }
  }, [about]);

  const handleSave = async () => {
    if (!about?.id) return;
    await updateMutation.mutateAsync({
      id: about.id,
      ...formData,
    });
  };

  // Mission helpers
  const addMission = () => setFormData(prev => ({ ...prev, mission_items: [...prev.mission_items, ''] }));
  const removeMission = (i: number) => setFormData(prev => ({ ...prev, mission_items: prev.mission_items.filter((_, idx) => idx !== i) }));
  const updateMission = (i: number, val: string) => setFormData(prev => ({ ...prev, mission_items: prev.mission_items.map((m, idx) => idx === i ? val : m) }));

  // Values helpers
  const addValue = () => setFormData(prev => ({ ...prev, values_items: [...prev.values_items, { icon: 'Heart', title: '', description: '' }] }));
  const removeValue = (i: number) => setFormData(prev => ({ ...prev, values_items: prev.values_items.filter((_, idx) => idx !== i) }));
  const updateValue = (i: number, key: keyof ValueItem, val: string) => setFormData(prev => ({ ...prev, values_items: prev.values_items.map((v, idx) => idx === i ? { ...v, [key]: val } : v) }));

  // Stats helpers
  const addStat = () => setFormData(prev => ({ ...prev, stats_items: [...prev.stats_items, { number: '', label: '' }] }));
  const removeStat = (i: number) => setFormData(prev => ({ ...prev, stats_items: prev.stats_items.filter((_, idx) => idx !== i) }));
  const updateStat = (i: number, key: keyof StatItem, val: string) => setFormData(prev => ({ ...prev, stats_items: prev.stats_items.map((s, idx) => idx === i ? { ...s, [key]: val } : s) }));

  if (isLoading) {
    return (
      <AdminLayout title="Tentang Kami">
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Tentang Kami">
      <div className="max-w-4xl space-y-6">
        {/* Hero Section */}
        <Card className="p-6">
          <h2 className="font-serif text-xl font-bold mb-4">Hero Section</h2>
          <div className="space-y-4">
            <div>
              <Label>Subtitle</Label>
              <Input value={formData.hero_subtitle} onChange={e => setFormData({ ...formData, hero_subtitle: e.target.value })} />
            </div>
            <div>
              <Label>Title</Label>
              <Input value={formData.hero_title} onChange={e => setFormData({ ...formData, hero_title: e.target.value })} />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea value={formData.hero_description} onChange={e => setFormData({ ...formData, hero_description: e.target.value })} />
            </div>
          </div>
        </Card>

        {/* Vision */}
        <Card className="p-6">
          <h2 className="font-serif text-xl font-bold mb-4">Visi</h2>
          <div className="space-y-4">
            <div>
              <Label>Title</Label>
              <Input value={formData.vision_title} onChange={e => setFormData({ ...formData, vision_title: e.target.value })} />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea value={formData.vision_description} onChange={e => setFormData({ ...formData, vision_description: e.target.value })} />
            </div>
          </div>
        </Card>

        {/* Mission */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-serif text-xl font-bold">Misi</h2>
            <Button variant="outline" size="sm" onClick={addMission}><Plus className="w-4 h-4 mr-1" /> Tambah</Button>
          </div>
          <div className="space-y-3">
            {formData.mission_items.map((item, i) => (
              <div key={i} className="flex gap-2">
                <Input value={item} onChange={e => updateMission(i, e.target.value)} placeholder={`Misi ${i + 1}`} />
                <Button variant="ghost" size="icon" onClick={() => removeMission(i)} className="text-destructive shrink-0">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </Card>

        {/* Values */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-serif text-xl font-bold">Nilai-Nilai</h2>
            <Button variant="outline" size="sm" onClick={addValue}><Plus className="w-4 h-4 mr-1" /> Tambah</Button>
          </div>
          <div className="space-y-4">
            {formData.values_items.map((item, i) => (
              <div key={i} className="border border-border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">Item {i + 1}</span>
                  <Button variant="ghost" size="icon" onClick={() => removeValue(i)} className="text-destructive">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Icon (Heart, Star, Users, Award, dll)</Label>
                    <Input value={item.icon} onChange={e => updateValue(i, 'icon', e.target.value)} />
                  </div>
                  <div>
                    <Label>Title</Label>
                    <Input value={item.title} onChange={e => updateValue(i, 'title', e.target.value)} />
                  </div>
                </div>
                <div>
                  <Label>Description</Label>
                  <Textarea value={item.description} onChange={e => updateValue(i, 'description', e.target.value)} />
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Stats */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-serif text-xl font-bold">Statistik</h2>
            <Button variant="outline" size="sm" onClick={addStat}><Plus className="w-4 h-4 mr-1" /> Tambah</Button>
          </div>
          <div className="space-y-3">
            {formData.stats_items.map((item, i) => (
              <div key={i} className="flex gap-3 items-end">
                <div className="flex-1">
                  <Label>Angka</Label>
                  <Input value={item.number} onChange={e => updateStat(i, 'number', e.target.value)} placeholder="500+" />
                </div>
                <div className="flex-1">
                  <Label>Label</Label>
                  <Input value={item.label} onChange={e => updateStat(i, 'label', e.target.value)} placeholder="Event Sukses" />
                </div>
                <Button variant="ghost" size="icon" onClick={() => removeStat(i)} className="text-destructive shrink-0">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </Card>

        {/* CTA */}
        <Card className="p-6">
          <h2 className="font-serif text-xl font-bold mb-4">Call to Action</h2>
          <div className="space-y-4">
            <div>
              <Label>Subtitle</Label>
              <Input value={formData.cta_subtitle} onChange={e => setFormData({ ...formData, cta_subtitle: e.target.value })} />
            </div>
            <div>
              <Label>Title</Label>
              <Input value={formData.cta_title} onChange={e => setFormData({ ...formData, cta_title: e.target.value })} />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea value={formData.cta_description} onChange={e => setFormData({ ...formData, cta_description: e.target.value })} />
            </div>
          </div>
        </Card>

        <Separator />

        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={updateMutation.isPending} size="lg">
            <Save className="w-5 h-5 mr-2" />
            {updateMutation.isPending ? 'Menyimpan...' : 'Simpan Perubahan'}
          </Button>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminAbout;
