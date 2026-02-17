import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Type, Columns, Heart, BarChart3, Megaphone, Image, Quote } from 'lucide-react';
import { useState } from 'react';

const SECTION_TYPES = [
  { type: 'hero', label: 'Hero Banner', icon: Image, description: 'Section header dengan judul besar dan deskripsi' },
  { type: 'text', label: 'Teks', icon: Type, description: 'Section teks sederhana dengan judul dan paragraf' },
  { type: 'text_columns', label: 'Dua Kolom', icon: Columns, description: 'Konten dua kolom (Visi & Misi)' },
  { type: 'values', label: 'Nilai / Fitur', icon: Heart, description: 'Grid kartu dengan icon, judul, deskripsi' },
  { type: 'stats', label: 'Statistik', icon: BarChart3, description: 'Angka statistik perusahaan' },
  { type: 'cta', label: 'Call to Action', icon: Megaphone, description: 'Section ajakan dengan tombol aksi' },
  { type: 'quote', label: 'Kutipan', icon: Quote, description: 'Kutipan inspiratif' },
];

interface Props {
  onSelect: (type: string) => void;
}

export function SectionTypeSelector({ onSelect }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full border-dashed border-2 py-8">
          <Plus className="w-5 h-5 mr-2" /> Tambah Section Baru
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Pilih Tipe Section</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3 mt-4">
          {SECTION_TYPES.map((s) => (
            <button
              key={s.type}
              onClick={() => { onSelect(s.type); setOpen(false); }}
              className="flex flex-col items-center gap-2 p-4 rounded-xl border border-border hover:border-primary hover:bg-primary/5 transition-all text-center"
            >
              <s.icon className="w-8 h-8 text-primary" />
              <span className="font-medium text-sm">{s.label}</span>
              <span className="text-xs text-muted-foreground">{s.description}</span>
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
