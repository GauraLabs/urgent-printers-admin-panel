import { apiClient } from './client';
import type { MediaUploadResult } from '@/types/product';

export async function uploadMedia(
  file: File,
  context: string,
  onProgress?: (pct: number) => void
): Promise<MediaUploadResult> {
  const form = new FormData();
  form.append('file', file);
  form.append('context', context);

  // Use apiClient directly so we can pass onUploadProgress.
  // The response interceptor still unwraps { data, message } → payload.
  const res = await apiClient.post<MediaUploadResult>('/admin/media/upload', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (e) => {
      if (onProgress && e.total) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    },
  });
  return res.data;
}

export async function deleteMedia(key: string): Promise<void> {
  await apiClient.delete('/admin/media', { data: { key } });
}
