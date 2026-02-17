import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { GripVertical, Trash2, ChevronDown, ChevronUp, Eye, EyeOff, Plus } from 'lucide-react';
import { useState } from 'react';

interface SectionData {
  id: string;
  section_type: string;
  title: string | null;
  content: Record<string, any>;
  styling: Record<string, any>;
  is_visible: boolean;
  sort_order: number;
}

interface Props {
  section: SectionData;
  onUpdate: (id: string, updates: Partial<SectionData>) => void;
  onDelete: (id: string) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  isFirst: boolean;
  isLast: boolean;
}

const TYPE_LABELS: Record<string, string> = {
  hero: 'Hero Banner',
  text: 'Teks',
  text_columns: 'Dua Kolom',
  values: 'Nilai / Fitur',
  stats: 'Statistik',
  cta: 'Call to Action',
  quote: 'Kutipan',
};

export function SectionEditor({ section, onUpdate, onDelete, onMoveUp, onMoveDown, isFirst, isLast }: Props) {
  const [expanded, setExpanded] = useState(false);
  const content = section.content || {};
  const styling = section.styling || {};

  const updateContent = (key: string, value: any) => {
    onUpdate(section.id, { content: { ...content, [key]: value } });
  };

  const updateStyling = (key: string, value: string) => {
    onUpdate(section.id, { styling: { ...styling, [key]: value } });
  };

  return (
    <Card className={`transition-all ${!section.is_visible ? 'opacity-60' : ''}`}>
      {/* Header */}
      <div className="flex items-center gap-2 p-4 cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <GripVertical className="w-4 h-4 text-muted-foreground shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded">
              {TYPE_LABELS[section.section_type] || section.section_type}
            </span>
            <span className="font-medium truncate">{section.title || 'Untitled'}</span>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); onUpdate(section.id, { is_visible: !section.is_visible }); }}>
            {section.is_visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" disabled={isFirst} onClick={(e) => { e.stopPropagation(); onMoveUp(); }}>
            <ChevronUp className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" disabled={isLast} onClick={(e) => { e.stopPropagation(); onMoveDown(); }}>
            <ChevronDown className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={(e) => { e.stopPropagation(); onDelete(section.id); }}>
            <Trash2 className="w-4 h-4" />
          </Button>
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </div>

      {/* Content Editor */}
      {expanded && (
        <div className="border-t border-border p-4 space-y-4">
          {/* Section Name */}
          <div>
            <Label>Nama Section</Label>
            <Input value={section.title || ''} onChange={(e) => onUpdate(section.id, { title: e.target.value })} placeholder="Nama section" />
          </div>

          {/* Styling Options */}
          <div className="grid grid-cols-3 gap-3 p-3 bg-muted/50 rounded-lg">
            <div>
              <Label className="text-xs">Background</Label>
              <Select value={styling.bg_color || 'default'} onValueChange={(v) => updateStyling('bg_color', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Default</SelectItem>
                  <SelectItem value="card">Card</SelectItem>
                  <SelectItem value="primary">Primary</SelectItem>
                  <SelectItem value="muted">Muted</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Padding</Label>
              <Select value={styling.padding || 'normal'} onValueChange={(v) => updateStyling('padding', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="small">Kecil</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="large">Besar</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Text Align</Label>
              <Select value={styling.text_align || 'left'} onValueChange={(v) => updateStyling('text_align', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="left">Kiri</SelectItem>
                  <SelectItem value="center">Tengah</SelectItem>
                  <SelectItem value="right">Kanan</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Type-specific content editor */}
          {section.section_type === 'hero' && <HeroEditor content={content} onChange={updateContent} />}
          {section.section_type === 'text' && <TextEditor content={content} onChange={updateContent} />}
          {section.section_type === 'text_columns' && <TextColumnsEditor content={content} onChange={updateContent} />}
          {section.section_type === 'values' && <ValuesEditor content={content} onChange={updateContent} />}
          {section.section_type === 'stats' && <StatsEditor content={content} onChange={updateContent} />}
          {section.section_type === 'cta' && <CTAEditor content={content} onChange={updateContent} />}
          {section.section_type === 'quote' && <QuoteEditor content={content} onChange={updateContent} />}
        </div>
      )}
    </Card>
  );
}

// === Type-Specific Editors ===

function HeroEditor({ content, onChange }: { content: any; onChange: (k: string, v: any) => void }) {
  return (
    <div className="space-y-3">
      <div><Label>Subtitle</Label><Input value={content.subtitle || ''} onChange={(e) => onChange('subtitle', e.target.value)} /></div>
      <div><Label>Title</Label><Input value={content.title || ''} onChange={(e) => onChange('title', e.target.value)} /></div>
      <div><Label>Description</Label><Textarea value={content.description || ''} onChange={(e) => onChange('description', e.target.value)} /></div>
    </div>
  );
}

function TextEditor({ content, onChange }: { content: any; onChange: (k: string, v: any) => void }) {
  return (
    <div className="space-y-3">
      <div><Label>Subtitle (script)</Label><Input value={content.subtitle || ''} onChange={(e) => onChange('subtitle', e.target.value)} /></div>
      <div><Label>Title</Label><Input value={content.title || ''} onChange={(e) => onChange('title', e.target.value)} /></div>
      <div><Label>Description</Label><Textarea value={content.description || ''} onChange={(e) => onChange('description', e.target.value)} rows={5} /></div>
    </div>
  );
}

function TextColumnsEditor({ content, onChange }: { content: any; onChange: (k: string, v: any) => void }) {
  const rightItems: string[] = content.right_items || [];
  return (
    <div className="space-y-4">
      <h4 className="font-medium text-sm text-muted-foreground">Kolom Kiri</h4>
      <div><Label>Label</Label><Input value={content.left_label || ''} onChange={(e) => onChange('left_label', e.target.value)} /></div>
      <div><Label>Title</Label><Input value={content.left_title || ''} onChange={(e) => onChange('left_title', e.target.value)} /></div>
      <div><Label>Description</Label><Textarea value={content.left_description || ''} onChange={(e) => onChange('left_description', e.target.value)} /></div>
      
      <h4 className="font-medium text-sm text-muted-foreground">Kolom Kanan (List)</h4>
      <div><Label>Label</Label><Input value={content.right_label || ''} onChange={(e) => onChange('right_label', e.target.value)} /></div>
      {rightItems.map((item, i) => (
        <div key={i} className="flex gap-2">
          <Input value={item} onChange={(e) => { const arr = [...rightItems]; arr[i] = e.target.value; onChange('right_items', arr); }} />
          <Button variant="ghost" size="icon" className="text-destructive shrink-0" onClick={() => onChange('right_items', rightItems.filter((_, idx) => idx !== i))}>
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={() => onChange('right_items', [...rightItems, ''])}><Plus className="w-4 h-4 mr-1" /> Tambah Item</Button>
    </div>
  );
}

function ValuesEditor({ content, onChange }: { content: any; onChange: (k: string, v: any) => void }) {
  const items: Array<{ icon: string; title: string; description: string }> = content.items || [];
  return (
    <div className="space-y-4">
      <div><Label>Heading Script</Label><Input value={content.heading_script || ''} onChange={(e) => onChange('heading_script', e.target.value)} /></div>
      <div><Label>Heading</Label><Input value={content.heading || ''} onChange={(e) => onChange('heading', e.target.value)} /></div>
      {items.map((item, i) => (
        <div key={i} className="border border-border rounded-lg p-3 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs text-muted-foreground">Item {i + 1}</span>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => onChange('items', items.filter((_, idx) => idx !== i))}>
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div><Label className="text-xs">Icon</Label><Input value={item.icon} onChange={(e) => { const arr = [...items]; arr[i] = { ...arr[i], icon: e.target.value }; onChange('items', arr); }} placeholder="Heart, Star, Users..." /></div>
            <div><Label className="text-xs">Title</Label><Input value={item.title} onChange={(e) => { const arr = [...items]; arr[i] = { ...arr[i], title: e.target.value }; onChange('items', arr); }} /></div>
          </div>
          <div><Label className="text-xs">Description</Label><Textarea value={item.description} onChange={(e) => { const arr = [...items]; arr[i] = { ...arr[i], description: e.target.value }; onChange('items', arr); }} rows={2} /></div>
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={() => onChange('items', [...items, { icon: 'Heart', title: '', description: '' }])}><Plus className="w-4 h-4 mr-1" /> Tambah Item</Button>
    </div>
  );
}

function StatsEditor({ content, onChange }: { content: any; onChange: (k: string, v: any) => void }) {
  const items: Array<{ number: string; label: string }> = content.items || [];
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <Switch checked={content.show_dynamic ?? true} onCheckedChange={(v) => onChange('show_dynamic', v)} />
        <Label>Tampilkan data dinamis (Lokasi & Portfolio)</Label>
      </div>
      {items.map((item, i) => (
        <div key={i} className="flex gap-2 items-end">
          <div className="flex-1"><Label className="text-xs">Angka</Label><Input value={item.number} onChange={(e) => { const arr = [...items]; arr[i] = { ...arr[i], number: e.target.value }; onChange('items', arr); }} /></div>
          <div className="flex-1"><Label className="text-xs">Label</Label><Input value={item.label} onChange={(e) => { const arr = [...items]; arr[i] = { ...arr[i], label: e.target.value }; onChange('items', arr); }} /></div>
          <Button variant="ghost" size="icon" className="text-destructive shrink-0" onClick={() => onChange('items', items.filter((_, idx) => idx !== i))}><Trash2 className="w-4 h-4" /></Button>
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={() => onChange('items', [...items, { number: '', label: '' }])}><Plus className="w-4 h-4 mr-1" /> Tambah</Button>
    </div>
  );
}

function CTAEditor({ content, onChange }: { content: any; onChange: (k: string, v: any) => void }) {
  return (
    <div className="space-y-3">
      <div><Label>Subtitle</Label><Input value={content.subtitle || ''} onChange={(e) => onChange('subtitle', e.target.value)} /></div>
      <div><Label>Title</Label><Input value={content.title || ''} onChange={(e) => onChange('title', e.target.value)} /></div>
      <div><Label>Description</Label><Textarea value={content.description || ''} onChange={(e) => onChange('description', e.target.value)} /></div>
      <div className="grid grid-cols-2 gap-3">
        <div><Label>Teks Tombol</Label><Input value={content.button_text || ''} onChange={(e) => onChange('button_text', e.target.value)} /></div>
        <div><Label>Link Tombol</Label><Input value={content.button_link || ''} onChange={(e) => onChange('button_link', e.target.value)} /></div>
      </div>
      <div className="flex items-center gap-3">
        <Switch checked={content.show_whatsapp ?? true} onCheckedChange={(v) => onChange('show_whatsapp', v)} />
        <Label>Tampilkan tombol WhatsApp</Label>
      </div>
    </div>
  );
}

function QuoteEditor({ content, onChange }: { content: any; onChange: (k: string, v: any) => void }) {
  return (
    <div className="space-y-3">
      <div><Label>Kutipan</Label><Textarea value={content.quote || ''} onChange={(e) => onChange('quote', e.target.value)} rows={3} /></div>
      <div><Label>Author</Label><Input value={content.author || ''} onChange={(e) => onChange('author', e.target.value)} /></div>
    </div>
  );
}
