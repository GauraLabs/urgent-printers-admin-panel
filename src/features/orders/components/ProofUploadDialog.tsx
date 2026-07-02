'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { toast } from 'sonner';
import { Upload, FileText, CheckCircle2, X } from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { usePresignProof, useSendProof } from '../hooks/useOrders';
import { cn } from '@/lib/utils/cn';

interface ProofUploadDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  orderId: string;
  itemId: string;
  itemName: string;
  canUpload: boolean;
}

type UploadState = 'idle' | 'uploading' | 'done' | 'error';

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function ProofUploadDialog({ open, onOpenChange, orderId, itemId, itemName, canUpload }: ProofUploadDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploadState, setUploadState] = useState<UploadState>('idle');
  const [progress, setProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadedFileKey, setUploadedFileKey] = useState<string | null>(null);

  const presignMutation = usePresignProof();
  const sendMutation = useSendProof();

  const onDrop = useCallback((accepted: File[]) => {
    if (accepted[0]) {
      setFile(accepted[0]);
      setUploadState('idle');
      setUploadError(null);
      setUploadedFileKey(null);
      setProgress(0);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'], 'image/png': ['.png'], 'image/jpeg': ['.jpg', '.jpeg'] },
    maxFiles: 1,
    disabled: !canUpload || uploadState === 'uploading' || uploadState === 'done',
  });

  function reset() {
    setFile(null);
    setUploadState('idle');
    setProgress(0);
    setUploadError(null);
    setUploadedFileKey(null);
  }

  async function handleUpload() {
    if (!file) return;
    setUploadError(null);
    setUploadState('uploading');
    setProgress(0);

    let presignData: { upload_url: string; file_key: string; proof_id: number };
    try {
      presignData = await presignMutation.mutateAsync({ orderId, itemId, filename: file.name, mimeType: file.type, fileSize: file.size });
    } catch (err: unknown) {
      const status = (err as { status?: number }).status;
      if (status === 409) {
        setUploadError('A proof is already pending review for this item. Wait for customer response or rejection before re-uploading.');
      } else {
        setUploadError('Failed to start upload. Please try again.');
      }
      setUploadState('error');
      return;
    }

    await new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          setProgress(Math.round((e.loaded / e.total) * 100));
        }
      };
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve();
        } else {
          reject(new Error('Upload failed'));
        }
      };
      xhr.onerror = () => reject(new Error('Upload failed'));
      xhr.open('PUT', presignData.upload_url);
      xhr.setRequestHeader('Content-Type', file.type);
      xhr.send(file);
    }).then(() => {
      setUploadedFileKey(presignData.file_key);
      setUploadState('done');
      setProgress(100);
    }).catch(() => {
      setUploadError('Upload failed. Please try again.');
      setUploadState('error');
    });
  }

  async function handleSend() {
    try {
      await sendMutation.mutateAsync({ orderId, itemId });
      toast.success('Proof sent to customer for approval');
      reset();
      onOpenChange(false);
    } catch {
      toast.error('Failed to send proof. Please try again.');
    }
  }

  function handleClose() {
    reset();
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[var(--primary-bg,#eff6ff)] flex items-center justify-center flex-shrink-0">
              <Upload className="h-4 w-4 text-[var(--primary)]" />
            </div>
            <DialogTitle>Upload Artwork Proof</DialogTitle>
          </div>
          <DialogDescription>
            {itemName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-1">
          {!canUpload && (
            <p className="text-xs text-[var(--warning)] bg-[var(--warning-bg)] border border-[var(--warning-border)] rounded-lg px-3 py-2">
              Upload is disabled — the latest proof is already pending or approved.
            </p>
          )}

          {uploadState !== 'done' && (
            <div
              {...getRootProps()}
              className={cn(
                'border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors',
                isDragActive
                  ? 'border-[var(--primary)] bg-[var(--primary-bg,#eff6ff)]'
                  : 'border-[var(--border)] hover:border-[var(--primary)] hover:bg-[var(--surface-secondary)]',
                (!canUpload || uploadState === 'uploading') && 'opacity-50 cursor-not-allowed pointer-events-none'
              )}
            >
              <input {...getInputProps()} />
              <Upload className="mx-auto h-8 w-8 text-[var(--text-muted)] mb-2" />
              <p className="text-sm text-[var(--text-primary)] font-medium">
                {isDragActive ? 'Drop file here' : 'Drag & drop or click to select'}
              </p>
              <p className="text-xs text-[var(--text-muted)] mt-1">PDF, PNG, or JPG · single file</p>
            </div>
          )}

          {file && uploadState !== 'done' && (
            <div className="flex items-center gap-3 p-3 bg-[var(--surface-secondary)] rounded-lg">
              <FileText className="h-5 w-5 text-[var(--text-muted)] flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-[var(--text-primary)] font-medium truncate">{file.name}</p>
                <p className="text-xs text-[var(--text-muted)]">{formatBytes(file.size)}</p>
              </div>
              {uploadState === 'idle' && (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); reset(); }}
                  className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          )}

          {uploadState === 'uploading' && (
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-[var(--text-muted)]">
                <span>Uploading…</span>
                <span>{progress}%</span>
              </div>
              <div className="h-1.5 bg-[var(--border)] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[var(--primary)] rounded-full transition-all duration-200"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {uploadState === 'done' && uploadedFileKey && (
            <div className="flex items-center gap-3 p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-lg">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">Uploaded successfully</p>
                <p className="text-xs text-emerald-600 dark:text-emerald-400 truncate">{file?.name}</p>
              </div>
            </div>
          )}

          {uploadError && (
            <p className="text-xs text-[var(--danger)] bg-[var(--danger-bg)] border border-[var(--danger-border)] rounded-lg px-3 py-2">
              {uploadError}
            </p>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={handleClose} disabled={uploadState === 'uploading' || sendMutation.isPending}>
            Cancel
          </Button>
          {uploadState !== 'done' ? (
            <Button
              type="button"
              onClick={handleUpload}
              disabled={!file || !canUpload || uploadState === 'uploading'}
            >
              {uploadState === 'uploading' ? 'Uploading…' : 'Upload & Save Draft'}
            </Button>
          ) : (
            <Button
              type="button"
              onClick={handleSend}
              disabled={sendMutation.isPending}
            >
              {sendMutation.isPending ? 'Sending…' : 'Send to Customer'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
