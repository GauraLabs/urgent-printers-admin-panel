/**
 * Client-side advisory-only image quality checks for upload-time guidance.
 *
 * Backend variant generation (`urgent-printers-backend/app/services/media_service.py`,
 * `_VARIANTS`) derives thumb (300×300 hard crop), md (800px wide), and lg (1600px wide)
 * from whatever source image an admin uploads — there's no separate upload per size, so
 * a low-res source makes the lg variant a blurry upscale. This module never blocks an
 * upload; it only informs the admin before/after they pick a file.
 */

export type ImageQualityTier = 'good' | 'ok' | 'poor';

export interface ImageDimensions {
  width: number;
  height: number;
}

/**
 * 'shortSide' — for images the backend hard-crops to a square thumb (category/product
 * photos, avatars): both dimensions matter, so the smaller one is the bottleneck.
 * 'width' — for aspect-preserving wide images (hero banners): only width is ever scaled.
 */
export type QualityMeasure = 'shortSide' | 'width';

export interface QualityThresholds {
  measure: QualityMeasure;
  minPx: number;
  recommendedPx: number;
}

export interface QualityResult {
  tier: ImageQualityTier;
  label: string;
}

export function probeImageDimensions(source: File | Blob | string): Promise<ImageDimensions> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = typeof source === 'string' ? null : URL.createObjectURL(source);

    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
    img.onerror = () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      reject(new Error('Could not read image dimensions'));
    };
    img.src = objectUrl ?? (source as string);
  });
}

export function getImageQualityTier(dims: ImageDimensions, thresholds: QualityThresholds): QualityResult {
  const value = thresholds.measure === 'shortSide' ? Math.min(dims.width, dims.height) : dims.width;
  if (value >= thresholds.recommendedPx) return { tier: 'good', label: 'Good quality' };
  if (value >= thresholds.minPx) return { tier: 'ok', label: 'Usable, not ideal' };
  return { tier: 'poor', label: 'Too small — will look blurry' };
}

export const QUALITY_TIER_STYLES: Record<ImageQualityTier, { dot: string; text: string }> = {
  good: { dot: 'bg-emerald-500', text: 'text-emerald-600 dark:text-emerald-400' },
  ok: { dot: 'bg-amber-500', text: 'text-amber-600 dark:text-amber-400' },
  poor: { dot: 'bg-destructive', text: 'text-destructive' },
};

/** Matches the backend's real variant pipeline — reuse these, don't invent new numbers. */
export const IMAGE_GUIDANCE = {
  /** Category/product photos and avatars — hard-cropped to a 300×300 square thumb. */
  square: {
    thresholds: { measure: 'shortSide', minPx: 800, recommendedPx: 1600 } satisfies QualityThresholds,
    hint: 'Recommended: 1600×1600px or larger, square-ish. Minimum 800×800px. The same source image is cropped to a square thumbnail and scaled up to 1600px wide for larger displays, so low-res sources look blurry once enlarged.',
  },
  /** Hero/content banners — aspect-preserving, scaled up to 1600px wide. */
  banner: {
    thresholds: { measure: 'width', minPx: 800, recommendedPx: 1600 } satisfies QualityThresholds,
    hint: 'Recommended: 1600×500px or larger (~3.2:1 wide) — the storefront hero renders full-bleed up to 520px tall, so smaller or lower-res images will upscale and look soft. Minimum 800px wide.',
  },
  /** Small circular avatars (testimonials) — square-cropped but displayed tiny, so a lower bar. */
  avatar: {
    thresholds: { measure: 'shortSide', minPx: 300, recommendedPx: 800 } satisfies QualityThresholds,
    hint: 'Recommended: 800×800px or larger, square-ish. Minimum 300×300px.',
  },
} as const;
