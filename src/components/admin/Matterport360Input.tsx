import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { X, Link as LinkIcon, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface Matterport360InputProps {
  value?: string;
  onChange: (url: string) => void;
  className?: string;
}

export function Matterport360Input({ value, onChange, className }: Matterport360InputProps) {
  const [urlInput, setUrlInput] = useState('');
  const [isValidating, setIsValidating] = useState(false);

  const isValidMatterportUrl = (url: string): boolean => {
    try {
      const urlObj = new URL(url);
      return (
        urlObj.hostname.includes('matterport.com') ||
        urlObj.hostname.includes('my.matterport.com')
      );
    } catch {
      return false;
    }
  };

  const handleAddUrl = async () => {
    if (!urlInput.trim()) {
      toast.error('Please enter a valid Matterport URL');
      return;
    }

    if (!isValidMatterportUrl(urlInput)) {
      toast.error('Please enter a valid Matterport URL (e.g., https://my.matterport.com/...)');
      return;
    }

    setIsValidating(true);
    try {
      onChange(urlInput.trim());
      setUrlInput('');
      toast.success('Matterport 360 URL added successfully');
    } catch (error) {
      console.error('Error adding URL:', error);
      toast.error('Failed to add Matterport URL');
    } finally {
      setIsValidating(false);
    }
  };

  const handleRemove = () => {
    onChange('');
    toast.success('Matterport URL removed');
  };

  return (
    <div className={cn("space-y-3", className)}>
      <Label>Matterport 360 Link</Label>
      
      {value ? (
        <div className="relative group p-4 border border-border rounded-lg bg-secondary/30">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 flex-1">
              <div className="p-2 bg-primary/10 rounded-lg">
                <LinkIcon className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium mb-1">Matterport Tour URL</p>
                <p className="text-xs text-muted-foreground truncate">{value}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleRemove}
              className="p-1.5 hover:bg-destructive/10 rounded-full transition-colors text-destructive"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3 p-4 border border-dashed border-border rounded-lg bg-secondary/20">
          <div>
            <input
              type="text"
              placeholder="Paste Matterport URL (e.g., https://my.matterport.com/show/...)"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddUrl()}
              className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <button
            type="button"
            onClick={handleAddUrl}
            disabled={isValidating || !urlInput.trim()}
            className="w-full px-3 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isValidating && <Loader2 className="w-4 h-4 animate-spin" />}
            Add Matterport URL
          </button>
          <p className="text-xs text-muted-foreground">
            Enter a Matterport tour link to add 360° tour capability to this location.
          </p>
        </div>
      )}
    </div>
  );
}
