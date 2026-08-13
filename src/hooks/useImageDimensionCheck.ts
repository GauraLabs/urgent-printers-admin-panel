'use client';

import { useEffect, useRef, useState } from 'react';
import {
  probeImageDimensions,
  getImageQualityTier,
  type ImageDimensions,
  type ImageQualityTier,
  type QualityThresholds,
} from '@/lib/utils/imageQuality';

export interface ImageDimensionCheckResult {
  dims: ImageDimensions | null;
  tier: ImageQualityTier | null;
  label: string | null;
  loading: boolean;
}

/**
 * Probes the natural dimensions of a single image source (a freshly dropped `File`, or an
 * already-saved/pasted URL string) and tiers it against `thresholds`. Advisory only — the
 * caller decides what (if anything) to render; this never blocks anything.
 */
export function useImageDimensionCheck(
  source: File | string | null | undefined,
  thresholds: QualityThresholds
): ImageDimensionCheckResult {
  const [dims, setDims] = useState<ImageDimensions | null>(null);
  const [loading, setLoading] = useState(false);
  const requestId = useRef(0);

  // Reset derived state synchronously during render when `source` changes, rather than in
  // an effect — the recommended "adjusting state when a prop changes" pattern, avoids an
  // extra cascading render from a bare setState at the top of an effect body.
  const [trackedSource, setTrackedSource] = useState(source);
  if (source !== trackedSource) {
    setTrackedSource(source);
    setDims(null);
    setLoading(!!source);
  }

  useEffect(() => {
    const id = ++requestId.current;
    if (!source) return;
    probeImageDimensions(source)
      .then((d) => {
        if (requestId.current !== id) return;
        setDims(d);
        setLoading(false);
      })
      .catch(() => {
        if (requestId.current !== id) return;
        setDims(null);
        setLoading(false);
      });
  }, [source]);

  if (!dims) {
    return { dims: null, tier: null, label: null, loading };
  }
  const { tier, label } = getImageQualityTier(dims, thresholds);
  return { dims, tier, label, loading: false };
}
