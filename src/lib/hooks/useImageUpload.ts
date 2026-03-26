'use client';

import { ChangeEvent, useState } from 'react';

interface UploadImageResponse {
  success: boolean;
  imageUrl?: string;
  publicId?: string;
  error?: string;
  message?: string;
}

export function useImageUpload() {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  /**
   * Upload image using FormData (recommended for files)
   */
  const uploadImage = async (file: File): Promise<UploadImageResponse | null> => {
    try {
      setUploading(true);
      setError(null);

      // Validate file
      if (!file.type.startsWith('image/')) {
        const err = 'Please select a valid image file';
        setError(err);
        return { success: false, error: err };
      }

      if (file.size > 5 * 1024 * 1024) {
        const err = 'Image size must be less than 5MB';
        setError(err);
        return { success: false, error: err };
      }

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrl(e.target?.result as string);
      };
      reader.readAsDataURL(file);

      // Upload to server
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch('/api/medicines/upload-image', {
        method: 'POST',
        body: formData,
      });

      const data: UploadImageResponse = await response.json();

      if (!response.ok) {
        const err = data.error || 'Image upload failed';
        setError(err);
        return { success: false, error: err };
      }

      setError(null);
      return data;
    } catch (err: any) {
      const error = err.message || 'Image upload failed';
      setError(error);
      return { success: false, error };
    } finally {
      setUploading(false);
    }
  };

  /**
   * Upload image from base64 string
   */
  const uploadBase64 = async (base64Data: string): Promise<UploadImageResponse | null> => {
    try {
      setUploading(true);
      setError(null);

      const response = await fetch('/api/medicines/upload-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64Data }),
      });

      const data: UploadImageResponse = await response.json();

      if (!response.ok) {
        const err = data.error || 'Image upload failed';
        setError(err);
        return { success: false, error: err };
      }

      setError(null);
      return data;
    } catch (err: any) {
      const error = err.message || 'Image upload failed';
      setError(error);
      return { success: false, error };
    } finally {
      setUploading(false);
    }
  };

  /**
   * Handle file input change
   */
  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      return uploadImage(file);
    }
  };

  return {
    uploadImage,
    uploadBase64,
    handleFileChange,
    uploading,
    error,
    previewUrl,
  };
}
