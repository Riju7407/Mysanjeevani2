# Multi-Vendor Platform Implementation - Complete Guide

## Overview

The MySanjeevani platform now supports a multi-vendor marketplace where registered vendors can list and sell their own products alongside MySanjeevani's official offerings. This enables healthcare businesses (pharmacies, clinics, suppliers) to reach more customers.

---

## Features Implemented

### 1. **Vendor Management System**

- ✅ Vendor registration with business information
- ✅ Admin approval/rejection workflow
- ✅ Vendor verification status tracking
- ✅ Vendor suspension/reactivation
- ✅ Rating and review system per vendor
- ✅ Commission management per vendor

### 2. **Vendor Portal**

- ✅ Vendor registration page (`/vendor/register`)
- ✅ Vendor login page (`/vendor/login`)
- ✅ Vendor dashboard (`/vendor/dashboard`)
- ✅ Vendor product management (CRUD)

### 3. **Admin Controls**

- ✅ Vendor approval interface (`/admin/vendors`)
- ✅ Vendor status management (approve/reject/suspend/reactivate)
- ✅ Vendor listing by status (pending/verified/rejected/suspended)

### 4. **Customer Features**

- ✅ Multi-vendor product display on medicines page
- ✅ Vendor filtering by name and rating
- ✅ Vendor information displayed on product cards
- ✅ "Become a Vendor" link in header/navigation

---

## Database Schema

### Vendor Model

Located at: `/src/lib/models/Vendor.ts`

```typescript
{
  vendorName: String (required, unique),
  email: String (required, unique),
  password: String (hashed with SHA256),
  phone: String (required),
  businessType: String (pharmacy|clinic|hospital|lab|supplier|other),

  // Business Info
  description: String,
  logo: String (URL),
  banner: String (URL),

  // Address
  businessAddress: {
    street: String,
    city: String,
    state: String,
    pincode: String,
    country: String (default: "India")
  },

  // Documents
  documents: {
    registrationNumber: String,
    licenseNumber: String,
    licenseDocument: String (URL),
    gstNumber: String
  },

  // Banking Details
  banking: {
    accountHolderName: String,
    bankName: String,
    accountNumber: String,
    ifscCode: String
  },

  // Status & Verification
  status: String (pending|verified|rejected|suspended),
  verifiedAt: Date,
  rejectionReason: String,

  // Ratings
  rating: Number (0-5),
  totalReviews: Number,
  totalOrders: Number,
  revenue: Number,

  // Commission
  commissionPercentage: Number (default: 10),

  // Timestamps
  createdAt: Date,
  updatedAt: Date
}
```

### Updated Product Model

Fields added to support multi-vendor:

```typescript
{
  vendorId: ObjectId (reference to Vendor collection),
  vendorName: String (default: "MySanjeevani"),
  vendorRating: Number (0-5, default: 5 for official products)
}
```

---

## API Endpoints

### Vendor APIs

#### 1. **Vendor Registration**

- **Route:** `POST /api/vendor/register`
- **Body:**

```json
{
  "vendorName": "Pharmacy Name",
  "email": "vendor@example.com",
  "password": "password123",
  "phone": "9999999999",
  "businessType": "pharmacy",
  "businessAddress": {
    "street": "123 Main St",
    "city": "Delhi",
    "state": "Delhi",
    "pincode": "110001"
  }
}
```

- **Response:**

```json
{
  "message": "Vendor registered successfully. Awaiting admin approval.",
  "vendor": {
    "_id": "vendor_id",
    "vendorName": "Pharmacy Name",
    "email": "vendor@example.com",
    "status": "pending"
  },
  "token": "uuid_token"
}
```

#### 2. **Vendor Login**

- **Route:** `POST /api/vendor/login`
- **Body:**

```json
{
  "email": "vendor@example.com",
  "password": "password123"
}
```

- **Response:**

```json
{
  "message": "Login successful",
  "vendor": {
    "_id": "vendor_id",
    "vendorName": "Pharmacy Name",
    "email": "vendor@example.com",
    "status": "verified",
    "rating": 4.5,
    "totalOrders": 150,
    "commissionPercentage": 10
  },
  "token": "uuid_token"
}
```

#### 3. **Get Vendor Products**

- **Route:** `GET /api/vendor/products?vendorId={vendorId}`
- **Response:**

```json
{
  "products": [
    {
      "_id": "product_id",
      "name": "Product Name",
      "price": 100,
      "stock": 50,
      "vendorId": "vendor_id",
      "vendorName": "Vendor Name"
    }
  ],
  "count": 1
}
```

#### 4. **Add Product**

- **Route:** `POST /api/vendor/products`
- **Headers:** `Authorization: Bearer {token}`
- **Body:**

```json
{
  "vendorId": "vendor_id",
  "name": "Product Name",
  "description": "Product description",
  "price": 100,
  "category": "generic",
  "stock": 50,
  "image": "image_url"
}
```

#### 5. **Update Product**

- **Route:** `PUT /api/vendor/products?productId={productId}`
- **Headers:** `Authorization: Bearer {token}`
- **Body:** (Same as add product)

#### 6. **Delete Product**

- **Route:** `DELETE /api/vendor/products?productId={productId}`
- **Headers:** `Authorization: Bearer {token}`

---

### Admin Vendor APIs

#### 1. **Get Vendors by Status**

- **Route:** `GET /api/admin/vendors?status={status}`
- **Status Options:** `pending|verified|rejected|suspended`
- **Response:**

```json
{
  "vendors": [
    {
      "_id": "vendor_id",
      "vendorName": "Pharmacy Name",
      "email": "vendor@example.com",
      "businessType": "pharmacy",
      "status": "pending",
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ],
  "count": 1
}
```

#### 2. **Approve/Reject Vendor**

- **Route:** `POST /api/admin/vendors`
- **Body:**

```json
{
  "vendorId": "vendor_id",
  "action": "approve"
}
```

Or for rejection:

```json
{
  "vendorId": "vendor_id",
  "action": "reject",
  "rejectionReason": "Documents not verified"
}
```

#### 3. **Suspend/Reactivate Vendor**

- **Route:** `PUT /api/admin/vendors`
- **Body:**

```json
{
  "vendorId": "vendor_id",
  "action": "suspend"
}
```

Or for reactivation:

```json
{
  "vendorId": "vendor_id",
  "action": "reactivate"
}
```

---

## Frontend Pages

### 1. **Vendor Registration** (`/vendor/register`)

- Multi-step form for vendor onboarding
- Business information collection (name, type, contact)
- Address information
- Password setup
- Status: Awaiting admin approval after registration

### 2. **Vendor Login** (`/vendor/login`)

- Email and password authentication
- Status verification (rejects rejected/suspended vendors)
- Redirects to vendor dashboard on success

### 3. **Vendor Dashboard** (`/vendor/dashboard`)

- Overview tab with key metrics:
  - Total products count
  - Total orders
  - Vendor rating
  - Commission percentage
- Products tab:
  - List all vendor's products
  - Add new products (only if verified)
  - Delete products
- Orders tab (placeholder for future)
- Analytics tab (placeholder for future)

### 4. **Admin Vendor Management** (`/admin/vendors`)

- Filter vendors by status (pending/verified/rejected/suspended)
- View vendor details and registration info
- Approve vendors (sets status to verified)
- Reject vendors with reason
- Suspend verified vendors
- Reactivate suspended vendors

### 5. **Updated Medicines Page** (`/medicines`)

- Added vendor filter in sidebar
- Shows MySanjeevani official + approved vendors
- Displays vendor name and rating on product cards
- Filter products by vendor

---

## User Workflow

### For Vendors

1. **Registration**
   - Click "Become a Vendor" in header (or visit `/vendor/register`)
   - Fill business details (name, email, phone, address)
   - Choose business type (pharmacy, clinic, lab, etc.)
   - Set password
   - Account status: **Pending** (awaiting admin approval)

2. **Waiting for Approval**
   - Admin reviews vendor registration at `/admin/vendors?status=pending`
   - Admin can approve or reject with reason

3. **After Approval**
   - Vendor receives notification (implement email in production)
   - Vendor logs in at `/vendor/login`
   - Redirected to dashboard at `/vendor/dashboard`

4. **Managing Products**
   - Only verified vendors can add products
   - Click "+ Add Product" button in dashboard
   - Fill product details (name, price, stock, category)
   - Product automatically linked to vendor
   - Can update or delete products anytime

5. **Product Visibility**
   - Products appear on medicines page immediately
   - Shows vendor name and rating with product
   - Customers can filter by vendor

### For Customers

1. **Browsing Multi-Vendor Products**
   - View medicines with vendor information
   - Filter products by vendor
   - See vendor ratings alongside products
   - Select products from preferred vendors

2. **Adding to Cart**
   - Add products to cart from any vendor
   - Cart items include vendor information
   - (Future: Order management per vendor)

### For Admins

1. **Vendor Approvals**
   - Navigate to `/admin/vendors?status=pending`
   - Review vendor information
   - Approve (becomes verified) or reject (with reason)

2. **Vendor Management**
   - View approved vendors: `/admin/vendors?status=verified`
   - Suspend vendors if needed
   - Reactivate suspended vendors
   - Track vendor performance (orders, ratings)

---

## Technical Notes

### Authentication

- Vendor login uses SHA256 password hashing
- UUID token for session management
- Store token in localStorage on client side

### Ownership Verification

- Products linked to vendor via `vendorId`
- Only vendor who created product can edit/delete it
- API validates vendor ownership before modifications

### Status Workflow

```
Registration → Pending → Approval Decision
                          ├─ Approved → Verified (can sell)
                          └─ Rejected → Cannot login

Verified → Suspend → Suspended (cannot sell)
           ↓↓↓↓
        Reactivate → Verified (can sell again)
```

### Commission System

- Default commission: 10% per vendor
- Configurable per vendor in Vendor model
- Can be used for payout calculations (future)

---

## Next Steps / Future Enhancements

1. **Order Management**
   - Create `/vendor/orders` page
   - Show only vendor's orders
   - Track order status per vendor
   - Manage order fulfillment

2. **Commission & Payouts**
   - Implement commission calculation logic
   - Create payout processing system
   - Add earnings dashboard for vendors
   - Generate commission reports

3. **Vendor Ratings**
   - Integrate reviews with vendor ratings
   - Display customer reviews per vendor
   - Allow rating update based on new reviews
   - Show rating distribution on vendor profile

4. **Advanced Features**
   - Vendor analytics dashboard
   - Sales reports per vendor
   - Product inventory management
   - Return/refund management per vendor
   - Vendor messaging system (support)
   - Promotional campaigns for vendors

5. **Email Notifications**
   - Send approval/rejection emails
   - Order notifications to vendors
   - Payment/payout alerts

---

## Testing Guide

### Test Vendor Registration

```
1. Go to /vendor/register
2. Fill form with test data:
   - Business Name: "Test Pharmacy"
   - Email: "test@pharmacy.com"
   - Password: "password123"
   - Phone: "9876543210"
   - Business Type: "pharmacy"
3. Complete registration
4. View pending vendor at /admin/vendors?status=pending
```

### Test Vendor Approval

```
1. Go to /admin/vendors?status=pending
2. Click "Approve" for pending vendor
3. Vendor moves to /admin/vendors?status=verified
4. Vendor receives token (check localStorage)
```

### Test Vendor Product Addition

```
1. Login with vendor at /vendor/login
2. Go to /vendor/dashboard
3. Click "+ Add Product"
4. Fill product details
5. Check /medicines page - product appears with vendor tag
```

### Test Vendor Filtering

```
1. Go to /medicines
2. Scroll sidebar filters
3. Find vendor filter section
4. Click vendor name to filter products
5. Only products from that vendor should show
```

---

## File Structure

```
/src
├─ lib/models/
│  ├─ Vendor.ts (NEW - Vendor schema)
│  └─ Product.ts (UPDATED - Added vendor fields)
├─ app/
│  ├─ vendor/
│  │  ├─ register/page.tsx (NEW - Vendor registration)
│  │  ├─ login/page.tsx (NEW - Vendor login)
│  │  └─ dashboard/page.tsx (NEW - Vendor dashboard)
│  ├─ admin/
│  │  └─ vendors/page.tsx (NEW - Admin vendor management)
│  ├─ api/
│  │  ├─ vendor/
│  │  │  ├─ register/route.ts (NEW)
│  │  │  ├─ login/route.ts (NEW)
│  │  │  └─ products/route.ts (NEW)
│  │  └─ admin/
│  │     └─ vendors/route.ts (NEW)
│  ├─ medicines/page.tsx (UPDATED - Multi-vendor support)
│  └─ layout.tsx
├─ components/
│  └─ Header.tsx (UPDATED - Added vendor link)
```

---

## Environment Variables

No new environment variables required. Uses existing MongoDB connection and authentication methods.

---

## Support & Contact

For vendor support or issues with the multi-vendor platform, customers should:

1. View vendor contact information on product cards
2. Access vendor dashboard for performance metrics
3. Contact MySanjeevani support for platform issues
