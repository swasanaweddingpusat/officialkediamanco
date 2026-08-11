import { X, Plus } from 'lucide-react';
import { VideoUpload } from './VideoUpload';

interface MultiVideoUploadProps {
  value: string[];
  onChange: (urls: string[]) => void;
  folder?: string;
  maxVideos?: number;
}

export function MultiVideoUpload({
  value = [],
  onChange,
  folder = 'videos',
  maxVideos = 10,
}: MultiVideoUploadProps) {
  const handleAdd = (url: string) => {
    if (!url) return;
    onChange([...value, url]);
  };

  const handleRemove = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  const isEmbed = (url: string) =>
    url.includes('youtube.com') || url.includes('youtu.be') || url.includes('tiktok.com');

  return (
    <div className="space-y-3">
      {value.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {value.map((url, i) => (
            <div key={`${url}-${i}`} className="relative group">
              {isEmbed(url) ? (
                <div className="w-full h-32 bg-secondary rounded-lg border border-border flex items-center justify-center px-3">
                  <p className="text-xs text-muted-foreground break-all line-clamp-3">{url}</p>
                </div>
              ) : (
                <video
                  src={url}
                  className="w-full h-32 object-cover rounded-lg border border-border"
                  controls
                />
              )}
              <button
                type="button"
                onClick={() => handleRemove(i)}
                className="absolute top-2 right-2 p-1.5 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {value.length < maxVideos ? (
        <div className="border border-dashed border-border rounded-lg p-3">
          <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
            <Plus className="w-3 h-3" /> Tambah video ({value.length}/{maxVideos})
          </p>
          <VideoUpload value="" onChange={handleAdd} folder={folder} />
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">Maksimal {maxVideos} video</p>
      )}
    </div>
  );
}
