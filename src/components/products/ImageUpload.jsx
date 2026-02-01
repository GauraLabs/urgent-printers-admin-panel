/**
 * Image Upload Component
 * Upload product images and videos with automatic resizing
 */

import { useState, useCallback } from 'react';
import { Upload, X, Image as ImageIcon, Film, Loader2, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const ImageUpload = ({ onUploadComplete, productId = null, maxFiles = 5, type = 'image' }) => {
  const [uploading, setUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [dragActive, setDragActive] = useState(false);

  const uploadFile = async (file) => {
    // Validate file type
    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');

    if (type === 'image' && !isImage) {
      toast.error('Please upload an image file');
      return null;
    }

    if (type === 'video' && !isVideo) {
      toast.error('Please upload a video file');
      return null;
    }

    // Validate file size
    const maxSize = type === 'image' ? 10 * 1024 * 1024 : 100 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error(`File too large. Maximum size is ${type === 'image' ? '10' : '100'}MB`);
      return null;
    }

    // Create form data
    const formData = new FormData();
    formData.append('file', file);
    if (productId) {
      formData.append('product_id', productId);
    }
    formData.append('alt_text', file.name);

    try {
      // Get auth token
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Please log in to upload files');
        return null;
      }

      // Upload to backend
      const endpoint = type === 'image'
        ? '/api/v1/media/products/images'
        : '/api/v1/media/products/videos';

      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}${endpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Upload failed');
      }

      const data = await response.json();

      return {
        name: file.name,
        type: file.type,
        size: file.size,
        variants: data.variants || null,
        url: data.url || data.variants?.medium || null,
        response: data,
      };

    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error.message || 'Failed to upload file');
      return null;
    }
  };

  const handleFiles = async (files) => {
    const fileArray = Array.from(files);

    // Check max files limit
    if (uploadedFiles.length + fileArray.length > maxFiles) {
      toast.error(`Maximum ${maxFiles} files allowed`);
      return;
    }

    setUploading(true);

    const results = [];
    for (const file of fileArray) {
      const result = await uploadFile(file);
      if (result) {
        results.push(result);
        toast.success(`${file.name} uploaded successfully`);
      }
    }

    if (results.length > 0) {
      const newFiles = [...uploadedFiles, ...results];
      setUploadedFiles(newFiles);

      // Notify parent component
      if (onUploadComplete) {
        onUploadComplete(newFiles);
      }
    }

    setUploading(false);
  };

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  }, [uploadedFiles, maxFiles]);

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
  };

  const removeFile = (index) => {
    const newFiles = uploadedFiles.filter((_, i) => i !== index);
    setUploadedFiles(newFiles);
    if (onUploadComplete) {
      onUploadComplete(newFiles);
    }
  };

  const acceptedTypes = type === 'image'
    ? 'image/jpeg,image/png,image/webp,image/gif'
    : 'video/mp4,video/webm,video/quicktime';

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div
        className={cn(
          'relative border-2 border-dashed rounded-lg p-8 transition-colors',
          dragActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50',
          uploading && 'opacity-50 cursor-not-allowed'
        )}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          id="file-upload"
          className="hidden"
          multiple={maxFiles > 1}
          accept={acceptedTypes}
          onChange={handleChange}
          disabled={uploading || uploadedFiles.length >= maxFiles}
        />

        <label
          htmlFor="file-upload"
          className={cn(
            'flex flex-col items-center justify-center gap-3 cursor-pointer',
            (uploading || uploadedFiles.length >= maxFiles) && 'cursor-not-allowed'
          )}
        >
          {uploading ? (
            <>
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Uploading...</p>
            </>
          ) : (
            <>
              {type === 'image' ? (
                <ImageIcon className="h-12 w-12 text-muted-foreground" />
              ) : (
                <Film className="h-12 w-12 text-muted-foreground" />
              )}
              <div className="text-center">
                <p className="text-sm font-medium">
                  Drop {type === 'image' ? 'images' : 'videos'} here or click to browse
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {type === 'image'
                    ? 'JPEG, PNG, WEBP, GIF up to 10MB'
                    : 'MP4, WebM, MOV up to 100MB'}
                </p>
                {maxFiles > 1 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {uploadedFiles.length}/{maxFiles} files uploaded
                  </p>
                )}
              </div>
              {type === 'image' && (
                <p className="text-xs text-muted-foreground bg-muted px-3 py-1 rounded">
                  Automatically resized to 5 sizes for optimal performance
                </p>
              )}
            </>
          )}
        </label>
      </div>

      {/* Uploaded Files List */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">Uploaded Files</p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {uploadedFiles.map((file, index) => (
              <div
                key={index}
                className="relative group rounded-lg border border-border overflow-hidden bg-card"
              >
                {/* Preview */}
                <div className="aspect-square bg-muted flex items-center justify-center">
                  {file.type.startsWith('image/') ? (
                    <img
                      src={file.variants?.small || file.url}
                      alt={file.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Film className="h-12 w-12 text-muted-foreground" />
                  )}
                </div>

                {/* File Info */}
                <div className="p-2">
                  <p className="text-xs font-medium truncate">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                  {file.variants && (
                    <p className="text-xs text-green-600 flex items-center gap-1 mt-1">
                      <CheckCircle className="h-3 w-3" />
                      5 sizes created
                    </p>
                  )}
                </div>

                {/* Remove Button */}
                <button
                  onClick={() => removeFile(index)}
                  className="absolute top-2 right-2 p-1 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Size Variants Info (for images) */}
      {type === 'image' && uploadedFiles.length > 0 && uploadedFiles[0].variants && (
        <div className="rounded-lg border border-border bg-muted/50 p-4">
          <p className="text-sm font-medium mb-2">Available Sizes:</p>
          <div className="grid grid-cols-5 gap-2 text-xs">
            <div className="text-center">
              <div className="font-medium">Thumbnail</div>
              <div className="text-muted-foreground">150×150</div>
            </div>
            <div className="text-center">
              <div className="font-medium">Small</div>
              <div className="text-muted-foreground">300×300</div>
            </div>
            <div className="text-center">
              <div className="font-medium">Medium</div>
              <div className="text-muted-foreground">600×600</div>
            </div>
            <div className="text-center">
              <div className="font-medium">Large</div>
              <div className="text-muted-foreground">1200×1200</div>
            </div>
            <div className="text-center">
              <div className="font-medium">Original</div>
              <div className="text-muted-foreground">Optimized</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageUpload;
