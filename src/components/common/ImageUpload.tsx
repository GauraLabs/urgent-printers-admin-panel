'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface ImageUploadProps {
  value?: string[];
  onChange: (files: File[]) => void;
  maxFiles?: number;
  accept?: string[];
  className?: string;
}

export function ImageUpload({
  value = [],
  onChange,
  maxFiles = 1,
  accept = ['image/jpeg', 'image/png', 'image/webp'],
  className,
}: ImageUploadProps) {
  const [previews, setPreviews] = useState<string[]>(value);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const urls = acceptedFiles.map((f) => URL.createObjectURL(f));
      setPreviews((prev) => [...prev, ...urls].slice(0, maxFiles));
      onChange(acceptedFiles);
    },
    [maxFiles, onChange]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': accept.map((a) => a.replace('image/', '.')) },
    maxFiles,
    multiple: maxFiles > 1,
  });

  const remove = (idx: number) => {
    setPreviews((prev) => prev.filter((_, i) => i !== idx));
  };

  return (
    <div className={cn('space-y-3', className)}>
      <div
        {...getRootProps()}
        className={cn(
          'border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors',
          isDragActive
            ? 'border-[var(--primary)] bg-[var(--info-bg)]'
            : 'border-[var(--border)] hover:border-[var(--primary)] hover:bg-[var(--surface-secondary)]'
        )}
      >
        <input {...getInputProps()} />
        <Upload className="h-8 w-8 mx-auto mb-2 text-[var(--text-muted)]" />
        <p className="text-sm text-[var(--text-secondary)]">
          {isDragActive ? 'Drop files here' : 'Drag & drop or click to upload'}
        </p>
        <p className="text-xs text-[var(--text-muted)] mt-1">
          {accept.join(', ')} · Max {maxFiles} file{maxFiles > 1 ? 's' : ''}
        </p>
      </div>

      {previews.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {previews.map((url, i) => (
            <div key={i} className="relative group w-20 h-20">
              {url.startsWith('blob:') || url.startsWith('http') ? (
                <img
                  src={url}
                  alt={`Preview ${i + 1}`}
                  className="w-full h-full object-cover rounded-md border border-[var(--border)]"
                />
              ) : (
                <div className="w-full h-full rounded-md border border-[var(--border)] bg-[var(--surface-secondary)] flex items-center justify-center">
                  <ImageIcon className="h-6 w-6 text-[var(--text-muted)]" />
                </div>
              )}
              <button
                onClick={(e) => { e.stopPropagation(); remove(i); }}
                className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-[var(--danger)] text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-3 w-3" />
              </button>
              {i === 0 && (
                <span className="absolute bottom-0 left-0 right-0 text-[10px] text-center bg-black/50 text-white rounded-b-md py-0.5">
                  Main
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
