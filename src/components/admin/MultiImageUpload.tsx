import { useState, useCallback } from 'react';
import { X, Image as ImageIcon, Loader2, Plus, AlertCircle, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

interface MultiImageUploadProps {
  value?: string[];
  onChange: (urls: string[]) => void;
  folder?: string;
  className?: string;
  maxImages?: number;
}

interface UploadError {
  fileName: string;
  message: string;
  code?: string;
}

export function MultiImageUpload({ 
  value = [], 
  onChange, 
  folder = 'general', 
  className,
  maxImages = 10 
}: MultiImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadErrors, setUploadErrors] = useState<UploadError[]>([]);
  const [uploadProgress, setUploadProgress] = useState<string>('');

  const clearErrors = () => setUploadErrors([]);

  const uploadFile = async (file: File): Promise<{ url: string | null; error: UploadError | null }> => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      return {
        url: null,
        error: {
          fileName: file.name,
          message: 'File harus berupa gambar (JPG, PNG, WebP, atau GIF)',
          code: 'INVALID_TYPE'
        }
      };
    }

    // Validate file size
    if (file.size > 5 * 1024 * 1024) {
      return {
        url: null,
        error: {
          fileName: file.name,
          message: `Ukuran file ${(file.size / 1024 / 1024).toFixed(2)}MB melebihi batas 5MB`,
          code: 'FILE_TOO_LARGE'
        }
      };
    }

    try {
      // Check if user is authenticated
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        return {
          url: null,
          error: {
            fileName: file.name,
            message: `Session error: ${sessionError.message}`,
            code: 'SESSION_ERROR'
          }
        };
      }

      if (!session) {
        return {
          url: null,
          error: {
            fileName: file.name,
            message: 'Anda harus login untuk upload gambar. Silakan refresh halaman dan login kembali.',
            code: 'NOT_AUTHENTICATED'
          }
        };
      }

      const fileExt = file.name.split('.').pop()?.toLowerCase();
      const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      setUploadProgress(`Mengupload ${file.name}...`);

      const { data, error: uploadError } = await supabase.storage
        .from('gym-images')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        let errorMessage = uploadError.message;
        let errorCode = 'UPLOAD_ERROR';

        // Parse common error messages
        if (uploadError.message.includes('not allowed')) {
          errorMessage = 'Anda tidak memiliki izin untuk upload. Pastikan Anda login sebagai admin.';
          errorCode = 'PERMISSION_DENIED';
        } else if (uploadError.message.includes('Bucket not found')) {
          errorMessage = 'Storage bucket tidak ditemukan. Hubungi administrator.';
          errorCode = 'BUCKET_NOT_FOUND';
        } else if (uploadError.message.includes('mime type')) {
          errorMessage = 'Tipe file tidak didukung. Gunakan JPG, PNG, WebP, atau GIF.';
          errorCode = 'INVALID_MIME_TYPE';
        }

        return {
          url: null,
          error: {
            fileName: file.name,
            message: errorMessage,
            code: errorCode
          }
        };
      }

      const { data: { publicUrl } } = supabase.storage
        .from('gym-images')
        .getPublicUrl(fileName);

      return { url: publicUrl, error: null };
    } catch (error: any) {
      return {
        url: null,
        error: {
          fileName: file.name,
          message: error?.message || 'Terjadi kesalahan yang tidak diketahui',
          code: 'UNKNOWN_ERROR'
        }
      };
    }
  };

  const handleFiles = async (files: FileList) => {
    clearErrors();

    if (value.length + files.length > maxImages) {
      setUploadErrors([{
        fileName: 'Multiple files',
        message: `Maksimal ${maxImages} gambar. Anda sudah memiliki ${value.length} gambar.`,
        code: 'MAX_IMAGES_EXCEEDED'
      }]);
      return;
    }

    setIsUploading(true);
    const errors: UploadError[] = [];
    const successfulUrls: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setUploadProgress(`Mengupload ${i + 1}/${files.length}: ${file.name}`);
      
      const result = await uploadFile(file);
      
      if (result.error) {
        errors.push(result.error);
      } else if (result.url) {
        successfulUrls.push(result.url);
      }
    }

    if (successfulUrls.length > 0) {
      onChange([...value, ...successfulUrls]);
      toast.success(`${successfulUrls.length} gambar berhasil diupload`);
    }

    if (errors.length > 0) {
      setUploadErrors(errors);
    }

    setIsUploading(false);
    setUploadProgress('');
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  }, [value, folder]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files);
    }
  };

  const handleRemove = (index: number) => {
    const newImages = [...value];
    newImages.splice(index, 1);
    onChange(newImages);
  };

  const handleRetry = () => {
    clearErrors();
    // User can try uploading again
  };

  return (
    <div className={cn("space-y-3", className)}>
      {/* Error Display */}
      {uploadErrors.length > 0 && (
        <Alert variant="destructive" className="border-destructive/50">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle className="flex items-center justify-between">
            <span>Upload Gagal ({uploadErrors.length} file)</span>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleRetry}
              className="h-6 px-2 text-xs"
            >
              <RefreshCw className="w-3 h-3 mr-1" />
              Coba Lagi
            </Button>
          </AlertTitle>
          <AlertDescription className="mt-2">
            <ul className="space-y-1 text-sm">
              {uploadErrors.map((error, index) => (
                <li key={index} className="flex flex-col">
                  <span className="font-medium">{error.fileName}</span>
                  <span className="text-destructive-foreground/80">{error.message}</span>
                  {error.code && (
                    <span className="text-xs text-destructive-foreground/60">
                      Kode error: {error.code}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Image Grid */}
      {value.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {value.map((url, index) => (
            <div key={index} className="relative group aspect-video">
              <img
                src={url}
                alt={`Image ${index + 1}`}
                className="w-full h-full object-cover rounded-lg border border-border"
              />
              <button
                type="button"
                onClick={() => handleRemove(index)}
                className="absolute top-1 right-1 p-1 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-3 h-3" />
              </button>
              {index === 0 && (
                <span className="absolute bottom-1 left-1 text-[10px] bg-primary text-primary-foreground px-1.5 py-0.5 rounded">
                  Utama
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Upload Area */}
      {value.length < maxImages && (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={cn(
            "relative border-2 border-dashed rounded-lg p-6 transition-colors cursor-pointer",
            isDragging
              ? "border-primary bg-primary/5"
              : "border-border hover:border-primary/50",
            isUploading && "pointer-events-none opacity-50"
          )}
        >
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            multiple
            onChange={handleFileSelect}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            disabled={isUploading}
          />
          <div className="flex flex-col items-center justify-center text-center">
            {isUploading ? (
              <>
                <Loader2 className="w-8 h-8 text-primary animate-spin mb-2" />
                <p className="text-sm font-medium text-primary">{uploadProgress || 'Uploading...'}</p>
                <p className="text-xs text-muted-foreground">Mohon tunggu...</p>
              </>
            ) : (
              <>
                <div className="p-2 bg-primary/10 rounded-full mb-2">
                  {isDragging ? (
                    <ImageIcon className="w-5 h-5 text-primary" />
                  ) : (
                    <Plus className="w-5 h-5 text-primary" />
                  )}
                </div>
                <p className="text-sm font-medium">
                  {value.length === 0 ? 'Upload gambar' : 'Tambah gambar lagi'}
                </p>
                <p className="text-xs text-muted-foreground">
                  Drag & drop atau klik (maks {maxImages} gambar, 5MB per file)
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Format: JPG, PNG, WebP, GIF
                </p>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
