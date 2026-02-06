import { useState, useCallback } from 'react';
import { Upload, X, Video, Loader2, Link as LinkIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface VideoUploadProps {
  value?: string;
  onChange: (url: string) => void;
  folder?: string;
  className?: string;
}

export function VideoUpload({ value, onChange, folder = 'videos', className }: VideoUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);

  const isValidUrl = (url: string): boolean => {
    try {
      const urlObj = new URL(url);
      return (
        urlObj.hostname.includes('youtube.com') ||
        urlObj.hostname.includes('youtu.be') ||
        urlObj.hostname.includes('tiktok.com')
      );
    } catch {
      return false;
    }
  };

  const handleUrlSubmit = () => {
    if (!urlInput.trim()) {
      toast.error('Please enter a valid URL');
      return;
    }

    if (!isValidUrl(urlInput)) {
      toast.error('Only YouTube and TikTok URLs are supported');
      return;
    }

    onChange(urlInput.trim());
    setUrlInput('');
    setShowUrlInput(false);
    toast.success('Video URL added successfully');
  };

  const uploadFile = async (file: File) => {
    if (!file.type.startsWith('video/')) {
      toast.error('Please upload a video file');
      return;
    }

    if (file.size > 100 * 1024 * 1024) {
      toast.error('Video must be less than 100MB');
      return;
    }

    setIsUploading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('gym-images')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('gym-images')
        .getPublicUrl(fileName);

      onChange(publicUrl);
      toast.success('Video uploaded successfully');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload video');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) uploadFile(file);
  }, [folder]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
  };

  const handleRemove = () => {
    onChange('');
  };

  return (
    <div className={cn("space-y-2", className)}>
      {value ? (
        <div className="relative group">
          {value.includes('youtube.com') || value.includes('youtu.be') ? (
            <div className="w-full h-48 bg-gray-900 rounded-lg border border-border flex items-center justify-center">
              <div className="text-center">
                <LinkIcon className="w-8 h-8 text-primary mx-auto mb-2" />
                <p className="text-sm text-muted-foreground truncate max-w-xs px-4">{value}</p>
              </div>
            </div>
          ) : value.includes('tiktok.com') ? (
            <div className="w-full h-48 bg-gray-900 rounded-lg border border-border flex items-center justify-center">
              <div className="text-center">
                <LinkIcon className="w-8 h-8 text-primary mx-auto mb-2" />
                <p className="text-sm text-muted-foreground truncate max-w-xs px-4">{value}</p>
              </div>
            </div>
          ) : (
            <video
              src={value}
              className="w-full h-48 object-cover rounded-lg border border-border"
              controls
            />
          )}
          <button
            type="button"
            onClick={handleRemove}
            className="absolute top-2 right-2 p-1.5 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : showUrlInput ? (
        <div className="space-y-2 p-4 border border-border rounded-lg bg-secondary/30">
          <label className="text-sm font-medium">Enter Video URL</label>
          <input
            type="text"
            placeholder="Paste YouTube or TikTok URL (e.g., https://youtu.be/... or https://www.tiktok.com/@.../video/...)"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleUrlSubmit()}
            className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleUrlSubmit}
              className="flex-1 px-3 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90"
            >
              Add URL
            </button>
            <button
              type="button"
              onClick={() => {
                setShowUrlInput(false);
                setUrlInput('');
              }}
              className="flex-1 px-3 py-2 bg-secondary text-secondary-foreground rounded-md text-sm font-medium hover:bg-secondary/80"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={cn(
              "relative border-2 border-dashed rounded-lg p-8 transition-colors cursor-pointer",
              isDragging
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/50",
              isUploading && "pointer-events-none opacity-50"
            )}
          >
            <input
              type="file"
              accept="video/*"
              onChange={handleFileSelect}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              disabled={isUploading}
            />
            <div className="flex flex-col items-center justify-center text-center">
              {isUploading ? (
                <>
                  <Loader2 className="w-10 h-10 text-primary animate-spin mb-3" />
                  <p className="text-sm text-muted-foreground">Uploading...</p>
                </>
              ) : (
                <>
                  <div className="p-3 bg-primary/10 rounded-full mb-3">
                    {isDragging ? (
                      <Video className="w-6 h-6 text-primary" />
                    ) : (
                      <Upload className="w-6 h-6 text-primary" />
                    )}
                  </div>
                  <p className="text-sm font-medium mb-1">
                    {isDragging ? 'Drop video here' : 'Drag & drop video'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    or click to browse (max 100MB)
                  </p>
                </>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowUrlInput(true)}
            className="w-full px-4 py-2 border border-border rounded-lg text-sm font-medium hover:bg-secondary/50 transition-colors flex items-center justify-center gap-2"
          >
            <LinkIcon className="w-4 h-4" />
            Add YouTube or TikTok URL
          </button>
        </div>
      )}
    </div>
  );
}
