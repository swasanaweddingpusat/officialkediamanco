import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ImageUpload } from '@/components/admin/ImageUpload';
import { Plus, Trash2, ArrowUp, ArrowDown } from 'lucide-react';

export interface FacilityItem {
  name: string;
  image_url: string;
  description?: string;
}

interface FacilityItemsEditorProps {
  value: FacilityItem[];
  onChange: (items: FacilityItem[]) => void;
}

export function FacilityItemsEditor({ value, onChange }: FacilityItemsEditorProps) {
  const update = (index: number, patch: Partial<FacilityItem>) => {
    onChange(value.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  };

  const remove = (index: number) => onChange(value.filter((_, i) => i !== index));

  const move = (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= value.length) return;
    const next = [...value];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };

  return (
    <div className="space-y-4">
      {value.length === 0 && (
        <p className="text-sm text-muted-foreground">
          Belum ada fasilitas berfoto. Tambahkan untuk menampilkan kartu fasilitas dengan gambar di halaman detail venue.
        </p>
      )}

      {value.map((item, index) => (
        <div key={index} className="rounded-lg border border-border p-4 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs uppercase tracking-wider text-muted-foreground">Fasilitas {index + 1}</span>
            <div className="flex gap-1">
              <Button type="button" variant="ghost" size="icon" onClick={() => move(index, -1)} disabled={index === 0}>
                <ArrowUp className="w-4 h-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => move(index, 1)}
                disabled={index === value.length - 1}
              >
                <ArrowDown className="w-4 h-4" />
              </Button>
              <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
                <Trash2 className="w-4 h-4 text-destructive" />
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Nama Fasilitas</Label>
            <Input
              value={item.name}
              onChange={(e) => update(index, { name: e.target.value })}
              placeholder="Contoh: Ballroom Utama"
            />
          </div>

          <div className="space-y-2">
            <Label>Keterangan (opsional)</Label>
            <Textarea
              value={item.description || ''}
              onChange={(e) => update(index, { description: e.target.value })}
              placeholder="Kapasitas 500 tamu, full AC"
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label>Foto Fasilitas</Label>
            <ImageUpload
              value={item.image_url}
              onChange={(url) => update(index, { image_url: url })}
              folder="facilities"
            />
          </div>
        </div>
      ))}

      <Button
        type="button"
        variant="outline"
        onClick={() => onChange([...value, { name: '', image_url: '', description: '' }])}
        className="w-full"
      >
        <Plus className="w-4 h-4 mr-2" />
        Tambah Fasilitas
      </Button>
    </div>
  );
}
