// Example: Medicine Admin Panel Add/Edit Component
// This is a reference component showing how to integrate image upload with medicine creation/update

'use client';

import { useImageUpload } from '@/lib/hooks/useImageUpload';
import { useState } from 'react';

interface Medicine {
  _id?: string;
  name: string;
  price: number;
  category: string;
  stock: number;
  description?: string;
  images?: string[];
  brand?: string;
  manufacturer?: string;
  dosage?: string;
  healthConcerns?: string[];
  requiresPrescription?: boolean;
}

interface MedicineFormProps {
  medicineId?: string;
  initialData?: Medicine;
  onSuccess?: (medicine: Medicine) => void;
  onCancel?: () => void;
}

export default function MedicineAdminForm({
  medicineId,
  initialData,
  onSuccess,
  onCancel,
}: MedicineFormProps) {
  const { uploadImage, uploading, error: uploadError } = useImageUpload();
  const [images, setImages] = useState<string[]>(initialData?.images || []);
  const [previews, setPreviews] = useState<string[]>(initialData?.images || []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState<Medicine>(
    initialData || {
      name: '',
      price: 0,
      category: '',
      stock: 0,
      description: '',
      images: [],
      brand: '',
      manufacturer: '',
      dosage: '',
      healthConcerns: [],
      requiresPrescription: false,
    }
  );

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    if (images.length + files.length > 4) {
      setError('You can upload up to 4 images.');
      return;
    }
    setError('');
    const newImages: string[] = [];
    const newPreviews: string[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const result = await uploadImage(file);
      if (result?.success && result.imageUrl) {
        newImages.push(result.imageUrl);
        newPreviews.push(result.imageUrl);
      } else {
        setError('Failed to upload one or more images.');
      }
    }
    setImages(prev => [...prev, ...newImages].slice(0, 4));
    setPreviews(prev => [...prev, ...newPreviews].slice(0, 4));
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value, type } = e.target;
    
    let newValue: any = value;
    if (type === 'number') {
      newValue = parseFloat(value);
    } else if (type === 'checkbox') {
      newValue = (e.target as HTMLInputElement).checked;
    }

    setFormData(prev => ({
      ...prev,
      [name]: newValue,
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    if (images.length === 0 && !medicineId) {
      setError('Please upload at least one image');
      return;
    }

    if (!formData.name.trim()) {
      setError('Medicine name is required');
      return;
    }

    if (formData.price <= 0) {
      setError('Price must be greater than 0');
      return;
    }

    if (formData.stock < 0) {
      setError('Stock cannot be negative');
      return;
    }

    try {
      setLoading(true);

      const submitData = {
        ...formData,
        images,
      };

      const url = medicineId
        ? `/api/admin/products/${medicineId}`
        : '/api/products';
      const method = medicineId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save medicine');
      }

      const data = await response.json();
      const savedMedicine = data.product || submitData;

      // Show success
      alert(
        medicineId
          ? '✅ Medicine updated successfully!'
          : '✅ Medicine added successfully!'
      );

      onSuccess?.(savedMedicine);

      // Reset form if adding new
      if (!medicineId) {
        setFormData({
          name: '',
          price: 0,
          category: '',
          stock: 0,
          description: '',
          images: [],
          brand: '',
          manufacturer: '',
          dosage: '',
          healthConcerns: [],
          requiresPrescription: false,
        });
        setImages([]);
        setPreviews([]);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          {medicineId ? 'Edit Medicine' : 'Add New Medicine'}
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Image Upload Section */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 bg-gray-50">
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Medicine Images (up to 4) {!medicineId && '*'}
            </label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageSelect}
              disabled={uploading || images.length >= 4}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50"
            />
            {uploadError && (
              <p className="mt-2 text-red-600 text-sm font-medium">
                ❌ Upload Error: {uploadError}
              </p>
            )}
            {uploading && (
              <p className="mt-2 text-blue-600 text-sm font-medium">
                ⏳ Uploading image...
              </p>
            )}
            {previews.length > 0 && (
              <div className="mt-4 grid grid-cols-2 gap-4">
                {previews.map((url, idx) => (
                  <div key={idx} className="flex flex-col items-center">
                    <img
                      src={url}
                      alt={`Medicine ${idx + 1}`}
                      className="w-32 h-32 object-cover rounded-lg border border-gray-200"
                    />
                    <button
                      type="button"
                      className="mt-2 text-xs text-red-600 hover:underline"
                      onClick={() => {
                        setImages(prev => prev.filter((_, i) => i !== idx));
                        setPreviews(prev => prev.filter((_, i) => i !== idx));
                      }}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
            {images.length >= 4 && (
              <p className="mt-2 text-yellow-600 text-sm font-medium">
                Maximum 4 images allowed.
              </p>
            )}
          </div>

          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Medicine Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="e.g., Amoxicillin 500mg"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Price (₹) *
              </label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleInputChange}
                placeholder="150"
                required
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Category *
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Category</option>
                <option value="ayurveda">Ayurveda</option>
                <option value="homeopathy">Homeopathy</option>
                <option value="allopathy">Allopathy</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Stock Quantity *
              </label>
              <input
                type="number"
                name="stock"
                value={formData.stock}
                onChange={handleInputChange}
                placeholder="100"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Additional Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Brand
              </label>
              <input
                type="text"
                name="brand"
                value={formData.brand}
                onChange={handleInputChange}
                placeholder="e.g., Cipla"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Manufacturer
              </label>
              <input
                type="text"
                name="manufacturer"
                value={formData.manufacturer}
                onChange={handleInputChange}
                placeholder="e.g., Cipla Ltd"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Dosage
              </label>
              <input
                type="text"
                name="dosage"
                value={formData.dosage}
                onChange={handleInputChange}
                placeholder="e.g., 500mg"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center pt-6">
              <input
                type="checkbox"
                id="prescription"
                name="requiresPrescription"
                checked={formData.requiresPrescription}
                onChange={handleInputChange}
                className="w-4 h-4 text-blue-600"
              />
              <label
                htmlFor="prescription"
                className="ml-2 text-sm font-medium text-gray-700"
              >
                Requires Prescription
              </label>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Enter detailed medicine description..."
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">❌ {error}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={loading || uploading || (!imageUrl && !medicineId)}
              className={`flex-1 py-2 px-4 rounded-lg font-semibold text-white transition ${
                loading || uploading || (!imageUrl && !medicineId)
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800'
              }`}
            >
              {loading ? '⏳ Saving...' : medicineId ? '✏️ Update Medicine' : '➕ Add Medicine'}
            </button>

            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="px-6 py-2 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition"
              >
                Cancel
              </button>
            )}
          </div>

          {/* Info Box */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-blue-700 text-sm">
              💡 <strong>Tip:</strong> Upload a clear, high-quality image of the medicine.
              Supported formats: JPG, PNG, WebP. Maximum size: 5MB.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
