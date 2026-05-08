'use client';

import { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, ArrowUp, ArrowDown, Film, AlertCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { uploadMedia, deleteMedia } from '@/lib/api/media';
import type { ProductImage, ProductVideo, MediaUploadImageResult, MediaUploadVideoResult } from '@/types/product';

// ── Image item state machine ───────────────────────────────────────────────────
type ImageItem =
  | { status: 'uploading'; tempId: string; blobUrl: string; progress: number }
  | { status: 'done';      tempId: string; blobUrl: string; result: MediaUploadImageResult }
  | { status: 'error';     tempId: string; blobUrl: string; message: string };

type VideoItem =
  | { status: 'uploading'; blobUrl: string; progress: number }
  | { status: 'done';      blobUrl: string; result: MediaUploadVideoResult }
  | { status: 'error';     blobUrl: string; message: string };

// ── Helpers ────────────────────────────────────────────────────────────────────
function fromExistingImage(img: ProductImage): ImageItem {
  return {
    status: 'done',
    tempId: img.id,
    blobUrl: img.thumb_url,
    result: {
      type: 'image',
      key: img.key,
      original: { url: img.original_url, width: 0, height: 0, size_bytes: 0 },
      variants: {
        thumb: { url: img.thumb_url, width: 300, height: 300 },
        md:    { url: img.md_url,    width: 800, height: 533 },
        lg:    { url: img.lg_url,    width: 1600, height: 1067 },
      },
    },
  };
}

function fromExistingVideo(v: ProductVideo): VideoItem {
  return {
    status: 'done',
    blobUrl: v.thumbnail_url,
    result: {
      type: 'video',
      key: v.key,
      video: { url: v.video_url, size_bytes: 0, duration_seconds: v.duration_seconds },
      thumbnail: { url: v.thumbnail_url, width: 1280, height: 720 },
    },
  };
}

// ── Props ──────────────────────────────────────────────────────────────────────
interface MediaSectionProps {
  context?: string;                          // R2 folder prefix, e.g. "product"
  initialImages?: ProductImage[];
  initialVideo?: ProductVideo | null;
  onImagesChange?: (keys: string[]) => void; // called with ordered array of done keys
  onVideoChange?: (key: string | null) => void;
}

export function MediaSection({
  context = 'product',
  initialImages = [],
  initialVideo = null,
  onImagesChange,
  onVideoChange,
}: MediaSectionProps) {
  const [images, setImages] = useState<ImageItem[]>(() =>
    [...initialImages]
      .sort((a, b) => a.sort_order - b.sort_order)
      .map(fromExistingImage)
  );
  const [video, setVideo] = useState<VideoItem | null>(
    initialVideo ? fromExistingVideo(initialVideo) : null
  );

  // Notify parent of done image keys in current order
  useEffect(() => {
    const keys = images
      .filter((i): i is Extract<ImageItem, { status: 'done' }> => i.status === 'done')
      .map((i) => i.result.key);
    onImagesChange?.(keys);
  }, [images]); // eslint-disable-line react-hooks/exhaustive-deps

  // Notify parent of video key
  useEffect(() => {
    if (!video) { onVideoChange?.(null); return; }
    if (video.status === 'done') onVideoChange?.(video.result.key);
  }, [video]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Image actions ────────────────────────────────────────────────────────────
  function moveImage(idx: number, dir: 'up' | 'down') {
    setImages((prev) => {
      const next = [...prev];
      const swap = dir === 'up' ? idx - 1 : idx + 1;
      if (swap < 0 || swap >= next.length) return prev;
      [next[idx], next[swap]] = [next[swap], next[idx]];
      return next;
    });
  }

  async function removeImage(idx: number) {
    const item = images[idx];
    if (item.status === 'done') {
      await deleteMedia(item.result.key).catch(() => null);
    }
    URL.revokeObjectURL(item.blobUrl);
    setImages((prev) => prev.filter((_, i) => i !== idx));
  }

  const onImageDrop = useCallback((files: File[]) => {
    files.slice(0, 8 - images.length).forEach((file) => {
      const blobUrl = URL.createObjectURL(file);
      const tempId = crypto.randomUUID();

      setImages((prev) => [
        ...prev,
        { status: 'uploading', tempId, blobUrl, progress: 0 },
      ]);

      uploadMedia(file, context, (pct) => {
        setImages((prev) =>
          prev.map((item) =>
            item.tempId === tempId && item.status === 'uploading'
              ? { ...item, progress: pct }
              : item
          )
        );
      })
        .then((result) => {
          if (result.type !== 'image') return;
          setImages((prev) =>
            prev.map((item) =>
              item.tempId === tempId
                ? { status: 'done', tempId, blobUrl, result }
                : item
            )
          );
        })
        .catch((err: Error) => {
          setImages((prev) =>
            prev.map((item) =>
              item.tempId === tempId
                ? { status: 'error', tempId, blobUrl, message: err.message ?? 'Upload failed' }
                : item
            )
          );
        });
    });
  }, [context, images.length]);

  // ── Video actions ────────────────────────────────────────────────────────────
  async function removeVideo() {
    if (video?.status === 'done') {
      await deleteMedia(video.result.key).catch(() => null);
    }
    if (video) URL.revokeObjectURL(video.blobUrl);
    setVideo(null);
  }

  const onVideoDrop = useCallback((files: File[]) => {
    const file = files[0];
    if (!file) return;
    const blobUrl = URL.createObjectURL(file);
    setVideo({ status: 'uploading', blobUrl, progress: 0 });

    uploadMedia(file, context, (pct) => {
      setVideo((prev) =>
        prev?.status === 'uploading' ? { ...prev, progress: pct } : prev
      );
    })
      .then((result) => {
        if (result.type !== 'video') return;
        setVideo({ status: 'done', blobUrl, result });
      })
      .catch((err: Error) => {
        setVideo({ status: 'error', blobUrl, message: err.message ?? 'Upload failed' });
      });
  }, [context]);

  // ── Dropzones ────────────────────────────────────────────────────────────────
  const { getRootProps: imgRootProps, getInputProps: imgInputProps, isDragActive: imgDrag } = useDropzone({
    onDrop: onImageDrop,
    accept: { 'image/*': ['.jpg', '.jpeg', '.png', '.webp'] },
    multiple: true,
    disabled: images.length >= 8,
  });

  const { getRootProps: vidRootProps, getInputProps: vidInputProps, isDragActive: vidDrag } = useDropzone({
    onDrop: onVideoDrop,
    accept: { 'video/*': ['.mp4', '.mov', '.webm'] },
    maxFiles: 1,
    multiple: false,
    disabled: !!video,
  });

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5">
      {/* Image grid */}
      {images.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {images.map((item, i) => (
            <div key={item.tempId} className="relative group w-24 h-24 flex-shrink-0">
              <img
                src={item.blobUrl}
                alt={`Image ${i + 1}`}
                className={cn(
                  'w-full h-full object-cover rounded-lg border',
                  item.status === 'error' ? 'border-destructive' : 'border-border'
                )}
              />

              {/* Primary badge */}
              {i === 0 && item.status === 'done' && (
                <span className="absolute top-1 left-1 text-[9px] font-bold px-1.5 py-0.5 bg-primary text-primary-foreground rounded leading-none">
                  Primary
                </span>
              )}

              {/* Upload progress overlay */}
              {item.status === 'uploading' && (
                <div className="absolute inset-0 bg-black/60 rounded-lg flex flex-col items-center justify-center gap-1">
                  <Loader2 className="h-4 w-4 text-white animate-spin" />
                  <div className="w-14 h-1 bg-white/30 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-white rounded-full transition-all"
                      style={{ width: `${item.progress}%` }}
                    />
                  </div>
                  <span className="text-[9px] text-white">{item.progress}%</span>
                </div>
              )}

              {/* Error overlay */}
              {item.status === 'error' && (
                <div className="absolute inset-0 bg-destructive/70 rounded-lg flex flex-col items-center justify-center gap-1 p-1">
                  <AlertCircle className="h-4 w-4 text-white" />
                  <span className="text-[9px] text-white text-center leading-tight">{item.message}</span>
                </div>
              )}

              {/* Hover controls (done only) */}
              {item.status === 'done' && (
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-1.5">
                  <button type="button" onClick={() => moveImage(i, 'up')} disabled={i === 0}
                    className="p-1 bg-white/20 hover:bg-white/40 rounded disabled:opacity-25 transition-colors">
                    <ArrowUp className="h-3 w-3 text-white" />
                  </button>
                  <button type="button" onClick={() => moveImage(i, 'down')} disabled={i === images.length - 1}
                    className="p-1 bg-white/20 hover:bg-white/40 rounded disabled:opacity-25 transition-colors">
                    <ArrowDown className="h-3 w-3 text-white" />
                  </button>
                  <button type="button" onClick={() => removeImage(i)}
                    className="p-1 bg-red-500/90 hover:bg-red-600 rounded transition-colors">
                    <X className="h-3 w-3 text-white" />
                  </button>
                </div>
              )}

              {/* Remove button for error state */}
              {item.status === 'error' && (
                <button type="button" onClick={() => removeImage(i)}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-destructive rounded-full flex items-center justify-center">
                  <X className="h-3 w-3 text-white" />
                </button>
              )}

              {/* Position label */}
              {i > 0 && item.status === 'done' && (
                <span className="absolute bottom-1 right-1 text-[9px] font-medium px-1 py-0.5 bg-black/50 text-white rounded leading-none">
                  {i + 1}
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {images.length > 0 && (
        <p className="text-[11px] text-muted-foreground">
          First image is the primary / cover. Hover to reorder or remove. Each image is stored as thumb, medium, and full-quality variants.
        </p>
      )}

      {/* Image dropzone */}
      {images.length < 8 && (
        <div {...imgRootProps()} className={cn(
          'border-2 border-dashed rounded-lg p-5 text-center cursor-pointer transition-colors',
          imgDrag ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50 hover:bg-muted/30'
        )}>
          <input {...imgInputProps()} />
          <Upload className="h-6 w-6 mx-auto mb-1.5 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            {imgDrag ? 'Drop images here' : 'Drag & drop or click to upload images'}
          </p>
          <p className="text-[11px] text-muted-foreground/70 mt-0.5">
            JPG, PNG, WebP · Up to {8 - images.length} more · Variants generated automatically
          </p>
        </div>
      )}

      {/* Video */}
      <div className="pt-3 border-t border-border space-y-3">
        <p className="flex items-center gap-1.5 text-xs font-medium text-foreground">
          <Film className="h-3.5 w-3.5 text-muted-foreground" />
          Product Video
          <span className="text-muted-foreground font-normal">— optional</span>
        </p>

        {video ? (
          <div className="relative rounded-lg overflow-hidden border border-border bg-black aspect-video max-w-xs">
            {/* Show thumbnail or video preview */}
            {video.status === 'done' ? (
              <video src={video.result.video.url} controls poster={video.result.thumbnail.url}
                className="w-full h-full object-contain" />
            ) : (
              <video src={video.blobUrl} controls className="w-full h-full object-contain" />
            )}

            {/* Progress overlay */}
            {video.status === 'uploading' && (
              <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center gap-2">
                <Loader2 className="h-6 w-6 text-white animate-spin" />
                <div className="w-32 h-1.5 bg-white/30 rounded-full overflow-hidden">
                  <div className="h-full bg-white rounded-full transition-all" style={{ width: `${video.progress}%` }} />
                </div>
                <span className="text-xs text-white">Uploading {video.progress}%</span>
              </div>
            )}

            {video.status === 'error' && (
              <div className="absolute inset-0 bg-destructive/70 flex flex-col items-center justify-center gap-1 p-4">
                <AlertCircle className="h-6 w-6 text-white" />
                <span className="text-xs text-white text-center">{video.message}</span>
              </div>
            )}

            <button type="button" onClick={removeVideo}
              className="absolute top-2 right-2 p-1 bg-black/60 hover:bg-red-600 rounded-full transition-colors" title="Remove video">
              <X className="h-3.5 w-3.5 text-white" />
            </button>

            {video.status === 'done' && (
              <span className="absolute bottom-2 left-2 text-[10px] font-medium px-1.5 py-0.5 bg-black/60 text-white rounded">
                {Math.round(video.result.video.duration_seconds)}s · thumbnail auto-generated
              </span>
            )}
          </div>
        ) : (
          <div {...vidRootProps()} className={cn(
            'border-2 border-dashed rounded-lg p-5 text-center cursor-pointer transition-colors',
            vidDrag ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50 hover:bg-muted/30'
          )}>
            <input {...vidInputProps()} />
            <Film className="h-6 w-6 mx-auto mb-1.5 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              {vidDrag ? 'Drop video here' : 'Drag & drop or click to upload video'}
            </p>
            <p className="text-[11px] text-muted-foreground/70 mt-0.5">
              MP4, MOV, WebM · Thumbnail extracted automatically
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
