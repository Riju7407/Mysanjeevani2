# Cloudinary Medicine Image Integration Guide

## Overview

This guide explains how to upload medicine images to Cloudinary and store the URLs in the database. The system follows this flow:

1. **Admin uploads image** → Sent to server
2. **Server uploads to Cloudinary** → Gets secure URL back
3. **Server stores URL in database** → Image persisted
4. **Users see image on medicine cards** → Displayed from Cloudinary

## Configuration

### Environment Variables (Already Set)

Your `.env.local` now has:

```env
CLOUDINARY_CLOUD_NAME="df4x2ygkw"
CLOUDINARY_API_KEY="421715977637776"
CLOUDINARY_API_SECRET="5Mjdd8mAfOB9e1tzBw0nIrlfBpA"
CLOUDINARY_URL="cloudinary://421715977637776:5Mjdd8mAfOB9e1tzBw0nIrlfBpA@df4x2ygkw"
```

## Files Created

### 1. **Cloudinary Utilities** (`/lib/cloudinaryUtils.ts`)
Helper functions for uploading and managing images on Cloudinary:
- `uploadImageToCloudinary()` - Upload base64 images
- `uploadImageBufferToCloudinary()` - Upload file buffers
- `deleteImageFromCloudinary()` - Remove images from Cloudinary

### 2. **Image Upload API** (`/api/medicines/upload-image`)
POST endpoint that accepts both:
- **FormData** - For file uploads (recommended)
- **JSON** - For base64 images

### 3. **Image Upload Hook** (`/lib/hooks/useImageUpload.ts`)
React hook for handling image uploads in components:
- state management for uploading/error
- preview URL handling
- file validation

### 4. **Product Model** 
Already has `image` field to store Cloudinary URLs

## How to Use

### Option 1: Upload Image in Standalone Route (Recommended)

**Step 1:** Upload image to Cloudinary using the dedicated endpoint

```bash
# Using FormData (file upload)
curl -X POST http://localhost:3000/api/medicines/upload-image \
  -F "image=@/path/to/medicine.jpg"
```

Response:
```json
{
  "success": true,
  "message": "Image uploaded successfully",
  "imageUrl": "https://res.cloudinary.com/df4x2ygkw/image/upload/v1711123456/medicines/abc123.webp",
  "publicId": "medicines/abc123"
}
```

**Step 2:** Use the returned `imageUrl` when creating/updating medicine

```bash
curl -X POST http://localhost:3000/api/products \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Amoxicillin 500mg",
    "price": 150,
    "category": "antibiotics",
    "image": "https://res.cloudinary.com/df4x2ygkw/image/upload/v1711123456/medicines/abc123.webp",
    "description": "Antibiotic medication",
    "stock": 100
  }'
```

Or update existing:

```bash
curl -X PUT http://localhost:3000/api/admin/products/[product-id] \
  -H "Content-Type: application/json" \
  -d '{
    "image": "https://res.cloudinary.com/df4x2ygkw/image/upload/v1711123456/medicines/abc123.webp",
    "name": "Updated Medicine Name"
  }'
```

### Option 2: Frontend Form Integration

#### Basic File Input

```tsx
'use client';

import { useImageUpload } from '@/lib/hooks/useImageUpload';
import { useState } from 'react';

export default function MedicineForm() {
  const { uploadImage, uploading, error, previewUrl } = useImageUpload();
  const [imageUrl, setImageUrl] = useState('');

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const result = await uploadImage(file);
      if (result?.success) {
        setImageUrl(result.imageUrl!);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);
    const medicineData = {
      name: formData.get('name'),
      price: parseFloat(formData.get('price') as string),
      category: formData.get('category'),
      image: imageUrl, // Include uploaded image URL
      description: formData.get('description'),
      stock: parseInt(formData.get('stock') as string),
    };

    const response = await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(medicineData),
    });

    if (response.ok) {
      alert('Medicine added successfully with image!');
      setImageUrl('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Image Upload */}
      <div>
        <label className="block text-sm font-medium">Medicine Image</label>
        <input
          type="file"
          accept="image/*"
          onChange={handleImageChange}
          disabled={uploading}
          className="block w-full"
        />
        {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
        {uploading && <p className="text-blue-500 text-sm mt-1">Uploading...</p>}
        
        {/* Image Preview */}
        {previewUrl && (
          <div className="mt-2">
            <img 
              src={previewUrl} 
              alt="Preview" 
              className="w-32 h-32 object-cover rounded"
            />
          </div>
        )}
      </div>

      {/* Other Fields */}
      <div>
        <label className="block text-sm font-medium">Medicine Name</label>
        <input 
          type="text" 
          name="name" 
          required 
          className="border p-2 w-full rounded"
        />
      </div>

      <div>
        <label className="block text-sm font-medium">Price</label>
        <input 
          type="number" 
          name="price" 
          required 
          className="border p-2 w-full rounded"
        />
      </div>

      <div>
        <label className="block text-sm font-medium">Category</label>
        <select name="category" required className="border p-2 w-full rounded">
          <option value="">Select Category</option>
          <option value="ayurveda">Ayurveda</option>
          <option value="homeopathy">Homeopathy</option>
          <option value="allopathy">Allopathy</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium">Stock</label>
        <input 
          type="number" 
          name="stock" 
          required 
          className="border p-2 w-full rounded"
        />
      </div>

      <button 
        type="submit" 
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
      >
        Add Medicine
      </button>
    </form>
  );
}
```

#### Using Tailwind (Better UI)

```tsx
'use client';

import { useImageUpload } from '@/lib/hooks/useImageUpload';
import { useState } from 'react';

export default function MedicineFormAdvanced() {
  const { uploadImage, uploading, error, previewUrl } = useImageUpload();
  const [imageUrl, setImageUrl] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    category: '',
    description: '',
    stock: '',
  });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const result = await uploadImage(file);
      if (result?.success) {
        setImageUrl(result.imageUrl!);
        console.log('✅ Image uploaded:', result.imageUrl);
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!imageUrl) {
      alert('Please upload an image first');
      return;
    }

    const medicineData = {
      ...formData,
      price: parseFloat(formData.price),
      stock: parseInt(formData.stock),
      image: imageUrl,
    };

    try {
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(medicineData),
      });

      if (response.ok) {
        const data = await response.json();
        alert('✅ Medicine added successfully with image!');
        console.log('Created medicine:', data.product);
        
        // Reset form
        setFormData({ name: '', price: '', category: '', description: '', stock: '' });
        setImageUrl('');
      } else {
        const error = await response.json();
        alert('❌ Error: ' + (error.error || 'Failed to create medicine'));
      }
    } catch (error) {
      console.error('Error:', error);
      alert('❌ Error submitting form');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Add New Medicine</h2>

      {/* Image Upload Section */}
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 bg-gray-50">
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Medicine Image *
        </label>
        
        <input
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          disabled={uploading}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />

        {uploading && (
          <div className="mt-3 text-blue-600 text-sm font-medium">
            ⏳ Uploading image...
          </div>
        )}

        {error && (
          <div className="mt-3 text-red-600 text-sm font-medium">
            ❌ Error: {error}
          </div>
        )}

        {previewUrl && (
          <div className="mt-4">
            <p className="text-sm text-gray-600 mb-2">Preview:</p>
            <img
              src={previewUrl}
              alt="Preview"
              className="w-40 h-40 object-cover rounded-lg border border-gray-200"
            />
          </div>
        )}

        {imageUrl && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded">
            <p className="text-sm text-green-700">
              ✅ Image uploaded successfully!
            </p>
          </div>
        )}
      </div>

      {/* Medicine Details */}
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
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., Amoxicillin 500mg"
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
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="150"
            step="0.01"
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
            Stock *
          </label>
          <input
            type="number"
            name="stock"
            value={formData.stock}
            onChange={handleInputChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="100"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">
          Description
        </label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleInputChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={3}
          placeholder="Enter medicine description..."
        />
      </div>

      <button
        type="submit"
        disabled={!imageUrl || uploading}
        className={`w-full py-2 px-4 rounded-lg font-semibold text-white transition ${
          !imageUrl || uploading
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800'
        }`}
      >
        {uploading ? 'Uploading...' : 'Add Medicine'}
      </button>
    </form>
  );
}
```

### Option 3: Display Images on Medicine Cards

```tsx
// In your medicine card component
interface MedicineCardProps {
  medicine: {
    _id: string;
    name: string;
    price: number;
    image?: string;
    rating: number;
    reviews: number;
    category: string;
  };
}

export function MedicineCard({ medicine }: MedicineCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition">
      {/* Image Section */}
      <div className="relative w-full h-48 bg-gray-200">
        {medicine.image ? (
          <img
            src={medicine.image}
            alt={medicine.name}
            className="w-full h-full object-cover"
            loading="lazy"
            onError={(e) => {
              // Fallback to placeholder if image fails
              (e.target as HTMLImageElement).src = '/images/medicine-placeholder.png';
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl">
            💊
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="p-4">
        <h3 className="font-semibold text-gray-800 line-clamp-2">
          {medicine.name}
        </h3>
        
        <div className="mt-2 flex items-center justify-between">
          <span className="text-lg font-bold text-blue-600">
            ₹{medicine.price}
          </span>
          
          {medicine.rating > 0 && (
            <div className="flex items-center gap-1">
              <span className="text-yellow-500">⭐</span>
              <span className="text-sm text-gray-600">
                {medicine.rating.toFixed(1)} ({medicine.reviews})
              </span>
            </div>
          )}
        </div>

        <button className="mt-4 w-full bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg transition">
          Add to Cart
        </button>
      </div>
    </div>
  );
}
```

## API Endpoints Reference

### Upload Image
- **URL**: `POST /api/medicines/upload-image`
- **Accepts**: FormData (file) or JSON (base64)
- **Returns**: `{ success, imageUrl, publicId }`
- **Max Size**: 5MB
- **Formats**: Any image format (auto-converted to WebP)

### Create Medicine
- **URL**: `POST /api/products`
- **Body**:
  ```json
  {
    "name": "Medicine Name",
    "price": 150,
    "category": "category",
    "image": "https://cloudinary-url...",
    "description": "...",
    "stock": 100,
    "brand": "...",
    "requiresPrescription": false
  }
  ```

### Update Medicine
- **URL**: `PUT /api/admin/products/{id}`
- **Body**: Same as create (only need fields to update)

## Features

✅ **Automatic Format Conversion** - All images converted to WebP for optimization
✅ **Optimized Delivery** - Cloudinary CDN ensures fast loading globally
✅ **Fallback Support** - Emoji fallback if image not available
✅ **Error Handling** - Detailed error messages for uploads
✅ **File Validation** - Checks file type and size before upload
✅ **Preview URL** - See preview before final submission
✅ **No Database Overhead** - Images stored on Cloudinary, only URLs in DB

## Troubleshooting

**Q: Image upload fails with 403 error?**
A: Check Cloudinary credentials in `.env.local` are correct.

**Q: Images not loading on medicine cards?**
A: Verify image URL is stored in the database. Check Cloudinary dashboard for uploaded images.

**Q: How to delete old images?**
A: Use `deleteImageFromCloudinary(publicId)` function from `cloudinaryUtils.ts`.

**Q: Can I change image quality?**
A: Modify `quality: 'auto'` in `cloudinaryUtils.ts` to a specific value (0-100).

## Next Steps

1. ✅ Environment variables configured
2. ✅ Upload endpoint ready
3. ✅ Hook created for frontend
4. 📝 Integrate into admin medicine form
5. 📝 Display images on medicine cards
6. 📝 Add edit functionality with image update
