# Cloudinary Medicine Image Upload - Quick Reference

## ✅ What Was Set Up

### 1. **Environment Variables** (`.env.local`)
```env
CLOUDINARY_CLOUD_NAME="df4x2ygkw"
CLOUDINARY_API_KEY="421715977637776"
CLOUDINARY_API_SECRET="5Mjdd8mAfOB9e1tzBw0nIrlfBpA"
CLOUDINARY_URL="cloudinary://421715977637776:5Mjdd8mAfOB9e1tzBw0nIrlfBpA@df4x2ygkw"
```

### 2. **Files Created**

| File | Purpose |
|------|---------|
| `/lib/cloudinaryUtils.ts` | Utility functions for Cloudinary uploads |
| `/api/medicines/upload-image/route.ts` | API endpoint to upload images |
| `/lib/hooks/useImageUpload.ts` | React hook for image uploads |
| `/components/MedicineAdminForm.tsx` | Complete admin form with image upload |
| `/components/MedicineCard.tsx` | Medicine card component displaying Cloudinary images |
| `CLOUDINARY_INTEGRATION.md` | Complete documentation |

## 🚀 Quick Start

### Step 1: Upload Image to Cloudinary

```javascript
// Using FormData (recommended)
const formData = new FormData();
formData.append('image', fileInput.files[0]);

const response = await fetch('/api/medicines/upload-image', {
  method: 'POST',
  body: formData
});

const data = await response.json();
const imageUrl = data.imageUrl; // Use this in medicine data
```

### Step 2: Save Medicine with Image URL

```javascript
const medicineData = {
  name: "Amoxicillin 500mg",
  price: 150,
  category: "antibiotics",
  stock: 100,
  image: imageUrl, // From step 1
  description: "Antibiotic medication"
};

const response = await fetch('/api/products', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(medicineData)
});
```

### Step 3: Display Images on Medicine Cards

```tsx
import MedicineCard from '@/components/MedicineCard';

export default function MedicinesPage() {
  const medicines = [ /* from API */ ];
  
  return (
    <div className="grid grid-cols-4 gap-4">
      {medicines.map(medicine => (
        <MedicineCard 
          key={medicine._id}
          medicine={medicine}
          onAddCart={(id) => {/* handle add cart */}}
        />
      ))}
    </div>
  );
}
```

## 📋 Integration Examples

### Using the React Hook

```tsx
import { useImageUpload } from '@/lib/hooks/useImageUpload';

function MyForm() {
  const { uploadImage, uploading, error, previewUrl } = useImageUpload();
  const [imageUrl, setImageUrl] = useState('');

  const handleUpload = async (file: File) => {
    const result = await uploadImage(file);
    if (result?.success) {
      setImageUrl(result.imageUrl!);
    }
  };

  return (
    <>
      <input 
        type="file" 
        onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])}
      />
      {previewUrl && <img src={previewUrl} className="w-32 h-32" />}
      {error && <p className="text-red-500">{error}</p>}
    </>
  );
}
```

### Using the Complete Form Component

```tsx
import MedicineAdminForm from '@/components/MedicineAdminForm';

export default function AddMedicineAdminPage() {
  return (
    <MedicineAdminForm 
      onSuccess={(medicine) => {
        console.log('Medicine added:', medicine);
        // Redirect or refresh list
      }}
    />
  );
}
```

### Edit Existing Medicine

```tsx
<MedicineAdminForm 
  medicineId="123"
  initialData={{
    name: "Existing Medicine",
    price: 150,
    category: "antibiotics",
    stock: 50,
    image: "https://res.cloudinary.com/..."
  }}
  onSuccess={(medicine) => {
    // Handle update success
  }}
/>
```

## 🔄 Complete Flow

```
1. UPLOAD IMAGE
   User selects image file
   ↓
   Sent to /api/medicines/upload-image
   ↓
   Uploaded to Cloudinary
   ↓
   Returns: https://res.cloudinary.com/df4x2ygkw/...

2. SAVE MEDICINE
   Admin fills form with medicine details
   ↓
   Includes Cloudinary URL in image field
   ↓
   Sent to /api/products (create) or /api/admin/products/{id} (update)
   ↓
   Stored in MongoDB

3. DISPLAY TO USERS
   Fetch medicines from /api/products
   ↓
   Each medicine has image URL from database
   ↓
   Displayed on MedicineCard component
   ↓
   Image loads from Cloudinary CDN
```

## 🎯 API Endpoints

### Upload Endpoint
```
POST /api/medicines/upload-image

Request (FormData):
- image: File

Response:
{
  "success": true,
  "imageUrl": "https://res.cloudinary.com/...",
  "publicId": "medicines/xyz123"
}
```

### Create Medicine
```
POST /api/products

Request:
{
  "name": "Medicine Name",
  "price": 150,
  "category": "antibiotics",
  "stock": 100,
  "image": "https://res.cloudinary.com/...",
  "description": "Description"
}

Response:
{
  "message": "Product created successfully",
  "product": { /* created medicine */ }
}
```

### Update Medicine
```
PUT /api/admin/products/{id}

Request: (same as create)

Response:
{
  "message": "Product updated",
  "product": { /* updated medicine */ }
}
```

## 💡 Tips & Best Practices

1. **Always upload before submitting form** - Image URL must be ready before saving medicine
2. **Add fallback emoji** - Display 💊 if image fails to load
3. **Validate file size** - Max 5MB enforced by API
4. **Use lazy loading** - Add `loading="lazy"` to img tags
5. **Handle errors gracefully** - Show user-friendly error messages
6. **Optimize images** - Cloudinary auto-converts to WebP format
7. **Show preview** - Give users feedback before final submission

## 🔐 Security Features

✅ **File Type Validation** - Only images allowed
✅ **File Size Limit** - Max 5MB per upload
✅ **API Key Protection** - Credentials in environment variables
✅ **Secure URLs** - HTTPS only (https://res.cloudinary.com...)
✅ **Folder Organization** - Images stored in /medicines folder on Cloudinary

## 📚 Documentation Files

1. **CLOUDINARY_INTEGRATION.md** - Full documentation with code examples
2. **ADMIN_SESSION_TIMEOUT.md** - 5-day admin session implementation

## 🐛 Troubleshooting

### Upload fails with 403
**Fix:** Check Cloudinary credentials in `.env.local`

### Image not showing on card
**Fix:** Verify image URL is correctly stored in database
- Check: `db.products.findOne({_id: "..."}).image`

### CORS errors
**Fix:** Cloudinary CDN is public, shouldn't cause issues. Check browser console for actual error.

### File too large error
**Fix:** Resize image before upload (max 5MB)

## 📞 Support Commands

```javascript
// Check if image URL is valid
fetch(imageUrl).then(r => console.log('Image accessible:', r.ok))

// List images on Cloudinary
// Visit: https://console.cloudinary.com/console/c-df4x2ygkw/media_library

// Check database
// db.products.find({image: {$exists: true}})
```

## Next Steps

1. ✅ Environment variables configured
2. ✅ Upload API ready
3. ✅ Components created
4. 📝 **Test with real form**
5. 📝 **Update existing medicines** with images
6. 📝 **Verify display** on frontend
7. 📝 **Monitor Cloudinary usage** (free tier: 25GB/month)

---

**Last Updated:** March 20, 2026
**Cloudinary Account:** df4x2ygkw
**API Status:** ✅ Ready for use
