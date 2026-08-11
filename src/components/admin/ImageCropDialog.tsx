import { useCallback, useState } from 'react';
import Cropper, { Area } from 'react-easy-crop';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';

interface ImageCropDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageSrc: string;
  isSaving?: boolean;
  onCropped: (blob: Blob) => void | Promise<void>;
}

const ASPECTS = [
  { label: '4:5', value: 4 / 5 },
  { label: '1:1', value: 1 },
  { label: '4:3', value: 4 / 3 },
  { label: '16:9', value: 16 / 9 },
  { label: '3:4', value: 3 / 4 },
];

async function getCroppedBlob(imageSrc: string, crop: Area): Promise<Blob> {
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = imageSrc;
  });

  const canvas = document.createElement('canvas');
  canvas.width = Math.round(crop.width);
  canvas.height = Math.round(crop.height);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas not supported');

  ctx.drawImage(
    image,
    crop.x,
    crop.y,
    crop.width,
    crop.height,
    0,
    0,
    canvas.width,
    canvas.height,
  );

  return await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Crop failed'))),
      'image/jpeg',
      0.92,
    ),
  );
}

export function ImageCropDialog({ open, onOpenChange, imageSrc, isSaving, onCropped }: ImageCropDialogProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [aspect, setAspect] = useState<number>(4 / 5);
  const [areaPixels, setAreaPixels] = useState<Area | null>(null);
  const [processing, setProcessing] = useState(false);

  const onCropComplete = useCallback((_: Area, pixels: Area) => {
    setAreaPixels(pixels);
  }, []);

  const handleSave = async () => {
    if (!areaPixels) return;
    setProcessing(true);
    try {
      const blob = await getCroppedBlob(imageSrc, areaPixels);
      await onCropped(blob);
    } finally {
      setProcessing(false);
    }
  };

  const busy = processing || isSaving;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Atur Cropping Gambar</DialogTitle>
        </DialogHeader>

        <div className="relative w-full h-[320px] bg-muted rounded-lg overflow-hidden">
          {imageSrc && (
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={aspect}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
            />
          )}
        </div>

        <div className="space-y-4">
          <div>
            <Label className="mb-2 block">Rasio</Label>
            <div className="flex flex-wrap gap-2">
              {ASPECTS.map((a) => (
                <Button
                  key={a.label}
                  type="button"
                  size="sm"
                  variant={aspect === a.value ? 'default' : 'outline'}
                  onClick={() => setAspect(a.value)}
                >
                  {a.label}
                </Button>
              ))}
            </div>
          </div>
          <div>
            <Label className="mb-2 block">Zoom</Label>
            <Slider
              value={[zoom]}
              min={1}
              max={4}
              step={0.05}
              onValueChange={(v) => setZoom(v[0])}
            />
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
            Batal
          </Button>
          <Button type="button" onClick={handleSave} disabled={busy || !areaPixels}>
            {busy && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Simpan Crop
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
