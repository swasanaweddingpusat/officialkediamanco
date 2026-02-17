import { useState, useEffect, useCallback } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { useAboutSections, useCreateAboutSection, useUpdateAboutSection, useDeleteAboutSection, useBulkUpdateAboutSectionOrder } from '@/hooks/useCMS';
import { Save, Undo2 } from 'lucide-react';
import { SectionEditor } from '@/components/admin/about-builder/SectionEditor';
import { SectionPreview } from '@/components/admin/about-builder/SectionPreview';
import { SectionTypeSelector } from '@/components/admin/about-builder/SectionTypeSelector';
import { toast } from 'sonner';

type SectionData = {
  id: string;
  section_type: string;
  title: string | null;
  content: Record<string, any>;
  styling: Record<string, any>;
  is_visible: boolean;
  sort_order: number;
};

const DEFAULT_CONTENT: Record<string, any> = {
  hero: { subtitle: '', title: 'New Hero Section', description: '' },
  text: { subtitle: '', title: 'New Text Section', description: '' },
  text_columns: { left_label: '', left_title: '', left_description: '', right_label: '', right_items: [] },
  values: { heading_script: '', heading: '', items: [] },
  stats: { items: [], show_dynamic: false },
  cta: { subtitle: '', title: '', description: '', button_text: 'Button', button_link: '/', show_whatsapp: false },
  quote: { quote: '', author: '' },
};

const AdminAbout = () => {
  const { data: dbSections, isLoading } = useAboutSections();
  const createMutation = useCreateAboutSection();
  const updateMutation = useUpdateAboutSection();
  const deleteMutation = useDeleteAboutSection();
  const reorderMutation = useBulkUpdateAboutSectionOrder();

  const [sections, setSections] = useState<SectionData[]>([]);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (dbSections) {
      setSections(dbSections.map((s: any) => ({
        id: s.id,
        section_type: s.section_type,
        title: s.title,
        content: (s.content as Record<string, any>) || {},
        styling: (s.styling as Record<string, any>) || {},
        is_visible: s.is_visible,
        sort_order: s.sort_order,
      })));
      setHasChanges(false);
    }
  }, [dbSections]);

  const handleUpdate = useCallback((id: string, updates: Partial<SectionData>) => {
    setSections((prev) => prev.map((s) => (s.id === id ? { ...s, ...updates } : s)));
    setHasChanges(true);
  }, []);

  const handleMoveUp = useCallback((index: number) => {
    setSections((prev) => {
      const arr = [...prev];
      [arr[index - 1], arr[index]] = [arr[index], arr[index - 1]];
      return arr.map((s, i) => ({ ...s, sort_order: i }));
    });
    setHasChanges(true);
  }, []);

  const handleMoveDown = useCallback((index: number) => {
    setSections((prev) => {
      const arr = [...prev];
      [arr[index], arr[index + 1]] = [arr[index + 1], arr[index]];
      return arr.map((s, i) => ({ ...s, sort_order: i }));
    });
    setHasChanges(true);
  }, []);

  const handleAddSection = async (type: string) => {
    const maxOrder = sections.length > 0 ? Math.max(...sections.map((s) => s.sort_order)) + 1 : 0;
    await createMutation.mutateAsync({
      section_type: type,
      title: DEFAULT_CONTENT[type]?.title || 'New Section',
      content: DEFAULT_CONTENT[type] || {},
      sort_order: maxOrder,
    });
  };

  const handleDelete = async (id: string) => {
    await deleteMutation.mutateAsync(id);
  };

  const handleSaveAll = async () => {
    try {
      // Save order
      await reorderMutation.mutateAsync(sections.map((s) => ({ id: s.id, sort_order: s.sort_order })));
      // Save each section's content/styling/visibility
      for (const s of sections) {
        await updateMutation.mutateAsync({
          id: s.id,
          title: s.title,
          content: s.content as any,
          styling: s.styling as any,
          is_visible: s.is_visible,
        });
      }
      setHasChanges(false);
      toast.success('Semua perubahan berhasil disimpan!');
    } catch {
      toast.error('Gagal menyimpan perubahan');
    }
  };

  const handleReset = () => {
    if (dbSections) {
      setSections(dbSections.map((s: any) => ({
        id: s.id,
        section_type: s.section_type,
        title: s.title,
        content: (s.content as Record<string, any>) || {},
        styling: (s.styling as Record<string, any>) || {},
        is_visible: s.is_visible,
        sort_order: s.sort_order,
      })));
      setHasChanges(false);
    }
  };

  if (isLoading) {
    return (
      <AdminLayout title="Page Builder — Tentang Kami">
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Page Builder — Tentang Kami">
      {/* Sticky save bar */}
      {hasChanges && (
        <div className="fixed bottom-6 left-64 right-0 z-50 flex justify-center pointer-events-none">
          <div className="bg-card border border-border shadow-lg rounded-full px-6 py-3 flex items-center gap-3 pointer-events-auto">
            <span className="text-sm text-muted-foreground">Ada perubahan yang belum disimpan</span>
            <Button variant="outline" size="sm" onClick={handleReset}><Undo2 className="w-4 h-4 mr-1" /> Reset</Button>
            <Button size="sm" onClick={handleSaveAll}><Save className="w-4 h-4 mr-1" /> Simpan Semua</Button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        {/* Editor Panel */}
        <div className="xl:col-span-3 space-y-3">
          {sections.map((section, index) => (
            <SectionEditor
              key={section.id}
              section={section}
              onUpdate={handleUpdate}
              onDelete={handleDelete}
              onMoveUp={() => handleMoveUp(index)}
              onMoveDown={() => handleMoveDown(index)}
              isFirst={index === 0}
              isLast={index === sections.length - 1}
            />
          ))}
          <SectionTypeSelector onSelect={handleAddSection} />
        </div>

        {/* Live Preview Panel */}
        <div className="xl:col-span-2">
          <div className="sticky top-8">
            <h3 className="text-sm font-medium text-muted-foreground mb-3">Live Preview</h3>
            <SectionPreview sections={sections} />
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminAbout;
