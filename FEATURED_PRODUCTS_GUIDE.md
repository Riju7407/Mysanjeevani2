# Featured Products Section - Implementation Guide

## Overview

This implementation adds a new "Featured Products" section to the homepage that displays brand cards before the hero section. Admins can upload product images (via Cloudinary), manage brand names, and control display order through a dedicated admin panel.

## Features Implemented

### 1. **Database Model**

- **File:** `src/lib/models/FeaturedProduct.ts`
- Schema includes:
  - `brandName`: String (required) - Brand name to display
  - `imageUrl`: String (required) - Cloudinary URL of the image
  - `cloudinaryPublicId`: String - For deleting images from Cloudinary
  - `displayOrder`: Number - For sorting products on homepage
  - `isActive`: Boolean - To toggle visibility
  - `createdBy`: String - Admin user ID who created it
  - Timestamps auto-added (createdAt, updatedAt)

### 2. **API Endpoints**

#### Get Featured Products (Public)

```
GET /api/featured-products
```

Returns all active featured products sorted by displayOrder.

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "brandName": "Brand Name",
      "imageUrl": "https://cloudinary.com/...",
      "displayOrder": 0,
      "isActive": true,
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

#### Create Featured Product (Admin Only)

```
POST /api/featured-products
Headers: Authorization: Bearer {adminToken}
Content-Type: application/json

{
  "brandName": "Brand Name",
  "imageUrl": "https://cloudinary.com/...",
  "displayOrder": 0,
  "createdBy": "admin-user-id"
}
```

#### Update Featured Product (Admin Only)

```
PUT /api/featured-products/{id}
Headers: Authorization: Bearer {adminToken}
Content-Type: application/json

{
  "brandName": "New Brand Name",
  "displayOrder": 1,
  "imageUrl": "https://..."  // optional if not changing image
}
```

#### Delete Featured Product (Admin Only)

```
DELETE /api/featured-products/{id}
Headers: Authorization: Bearer {adminToken}
```

### 3. **Image Upload Endpoint**

- **File:** `src/app/api/upload/route.ts`
- Handles base64 image uploads to Cloudinary
- Supports custom folder parameter
- Auto-converts to WebP format for optimization

```
POST /api/upload
Content-Type: application/json

{
  "image": "base64-image-data or data:image/...",
  "folder": "featured-products"  // optional
}
```

### 4. **Components**

#### FeaturedProductCard Component

- **File:** `src/components/FeaturedProductCard.tsx`
- Displays individual product card (300px × 500px responsive)
- Shows brand name and image
- Admin mode: includes Edit/Delete buttons
- Image error handling with fallback
- Hover effects and smooth transitions

#### FeaturedProductsSection Component

- **File:** `src/components/FeaturedProductsSection.tsx`
- Fetches and displays all active featured products
- Loading state with skeleton cards
- Hides section if no products available
- Responsive grid layout (1 col mobile, 2 tablets, 4 desktop)
- Styled with blue gradient theme

### 5. **Admin Management Page**

- **File:** `src/app/admin/featured-products/page.tsx`
- Full CRUD interface for managing featured products
- Features:
  - **List View:** Display all featured products in grid
  - **Add New:** Form to create new featured product
  - **Edit:** Update existing product details/image
  - **Delete:** Remove products with confirmation
  - **Image Upload:** Drag-and-drop Cloudinary integration
  - **Display Order:** Control product ordering
  - Error/Success messaging
  - Loading states

### 6. **Homepage Integration**

- **File:** `src/app/page.tsx`
- Added import: `import FeaturedProductsSection from '@/components/FeaturedProductsSection';`
- Placed after `<Header />` and before the Hero Section (as requested)
- Maintains responsive design consistency

### 7. **Admin Sidebar Update**

- **File:** `src/components/AdminSidebar.tsx`
- Added "Featured Products" menu item
- Links to `/admin/featured-products`
- Full navigation integration

## How to Use

### For Admins: Adding Featured Products

1. **Navigate to Admin Panel**
   - Go to `/admin`
   - Click "Featured Products" in sidebar

2. **Add New Product**
   - Click "+ Add New Product" button
   - Fill in Brand Name
   - Set Display Order (lower numbers appear first)
   - Upload image:
     - Recommended size: 300px × 500px
     - Drag-and-drop or click to upload
     - Supports: JPG, PNG, WebP, GIF
   - Click "Create Product"

3. **Edit Product**
   - Click "Edit" on any card
   - Update brand name or display order
   - Change image (optional)
   - Click "Update Product"

4. **Delete Product**
   - Click "Delete" on any card
   - Confirm deletion
   - Image is auto-removed from Cloudinary

### For Users: Viewing Featured Products

- Featured products appear on homepage
- Section displays directly after header, before hero carousel
- Products shown in responsive grid (1-4 columns)
- Images load from Cloudinary with auto-optimization
- Clicking products: future expansion point for navigation

## Technical Details

### Dependencies Used

- Next.js 16.1.6
- React 19.2.3
- Mongoose 9.1.5
- Cloudinary 2.0.0
- Tailwind CSS 4

### Authentication

- All CRUD operations (Create/Update/Delete) require admin token
- Admin token verified via `adminAuthMiddleware`
- GET requests are public (no auth required)

### Image Handling

- Base64 conversion for upload
- Automatic WebP compression
- Cloudinary storage with auto-generated URLs
- Public IDs saved for future deletion capability

### Database Indexing

- Default sorting by `displayOrder` (ascending)
- Secondary sort by `createdAt` (descending)
- `isActive` flag for soft-delete capability

## File Structure

```
src/
├── app/
│   ├── admin/
│   │   └── featured-products/
│   │       └── page.tsx          # Admin management interface
│   ├── api/
│   │   ├── featured-products/
│   │   │   ├── route.ts          # GET/POST endpoints
│   │   │   └── [id]/route.ts     # GET/PUT/DELETE endpoints
│   │   └── upload/
│   │       └── route.ts          # Image upload endpoint
│   └── page.tsx                  # Updated homepage
├── components/
│   ├── AdminSidebar.tsx          # Updated with new menu item
│   ├── FeaturedProductCard.tsx   # Card component
│   └── FeaturedProductsSection.tsx # Section component
└── lib/
    └── models/
        └── FeaturedProduct.ts    # Database model
```

## Cloudinary Configuration

Ensure these environment variables are set in `.env.local`:

```
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

## Styling & Responsive Design

- **Card Size:** 300px x 500px (responsive equivalent on mobile)
- **Grid Columns:**
  - Mobile (< 640px): 1 column
  - Tablet (640px - 1024px): 2 columns
  - Desktop (> 1024px): 4 columns
- **Theme:** Blue gradient with consistent MySanjeevani branding
- **Animations:** Smooth hover effects, fade-in loading states

## Future Enhancement Ideas

1. **Reordering:** Drag-and-drop to reorder products
2. **Categories:** Group featured products by category
3. **Analytics:** Track featured product views/clicks
4. **Scheduling:** Set date ranges for automatic display
5. **A/B Testing:** Compare featured product performance
6. **Linked Products:** Connect to specific medicine/lab test products

## Troubleshooting

### Products not showing on homepage?

- Check if products are marked as `isActive: true`
- Verify Cloudinary credentials in `.env.local`
- Check browser console for API errors

### Image upload failing?

- Ensure image file < 5MB
- Verify Cloudinary credentials
- Check network tab for upload response

### Admin can't access management page?

- Verify admin authentication token in localStorage
- Check `adminAuthMiddleware` configuration
- Ensure user has admin role

## API Error Codes

| Code | Error                   | Solution                             |
| ---- | ----------------------- | ------------------------------------ |
| 400  | Missing required fields | Provide brandName and imageUrl       |
| 401  | Unauthorized            | Include valid admin token            |
| 404  | Product not found       | Check product ID                     |
| 500  | Server error            | Check Cloudinary config, server logs |
