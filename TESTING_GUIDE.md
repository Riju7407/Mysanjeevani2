# Multi-Vendor Platform - Quick Start Testing Guide

## 🚀 Getting Started

### 1. Start the Development Server

```bash
npm run dev
# Server starts on http://localhost:3000
```

---

## 👨‍💼 Test as a Vendor

### Step 1: Register as Vendor

1. Go to **http://localhost:3000/vendor/register**
2. Fill the registration form:
   - Business Name: `Test Pharmacy`
   - Email: `test@pharmacy.com`
   - Password: `password123`
   - Phone: `9999999999`
   - Business Type: `Pharmacy`
   - Address: `123 Test Street, New Delhi, Delhi, 110001`
3. Click **Register as Vendor**
   - You'll see: ✅ "Registration successful! Awaiting admin approval"
   - You'll be redirected to login page

### Step 2: Wait for Admin Approval

- Vendor account starts with status: **pending**
- Cannot login until admin approves
- Go to admin panel (Step 3)

---

## 👨‍💻 Test as Admin

### Step 1: Access Admin Panel

1. Login with admin account first:
   - Go to **http://localhost:3000/login**
   - Email: `admin@mysanjeevani.com`
   - Password: `admin123`
2. Go to **http://localhost:3000/admin/vendors**

### Step 2: Approve Pending Vendor

1. You'll see vendors filtered by "pending" status
2. Find your test vendor (`Test Pharmacy`)
3. See vendor details:
   - Name, Email, Phone
   - Business Type, Address, etc.
4. Click **Approve** button
   - Status changes to **verified**
   - Vendor can now login

### Step 3: Manage Vendors

- Click **Verified** tab to see approved vendors
- **Reject** pending vendors with reason
- **Suspend** verified vendors if needed
- **Reactivate** suspended vendors

---

## 🏪 Back to Vendor Dashboard

### Step 1: Login as Vendor

1. Go to **http://localhost:3000/vendor/login**
2. Enter credentials:
   - Email: `test@pharmacy.com`
   - Password: `password123`
3. Click **Login**
   - ✅ "Login successful! Redirecting to dashboard..."
   - Redirected to dashboard

### Step 2: View Vendor Dashboard

You'll see:

- **Dashboard Tab** (Overview)
  - Total Products: 0
  - Total Orders: 0
  - Rating: Not rated yet
  - Commission: 10%

### Step 3: Add Products

1. Click **Products** tab
2. Click **+ Add Product** button
3. Fill product form:
   - Product Name: `Aspirin 500mg`
   - Price: `45`
   - Category: `Generic`
   - Stock: `100`
   - Description: `Effective pain reliever`
4. Click **Add Product**
5. Product appears in your product list

### Step 4: Add More Products

Repeat Step 3 with:

- `Cough Syrup` - ₹65
- `Multivitamin` - ₹150
- `Joint Care Oil` - ₹200

---

## 🛍️ Test as Customer

### Step 1: Browse Multi-Vendor Products

1. Go to **http://localhost:3000/medicines**
2. You'll see:
   - Products with vendor tags showing "Test Pharmacy"
   - Vendor filter in sidebar showing your vendor
   - Each product shows vendor name and rating

### Step 2: Filter by Vendor

1. Look for **Vendors** section in left sidebar
2. Click on **Test Pharmacy**
3. Products from only that vendor appear
4. Click **All Vendors** to see all again

### Step 3: View Product Details

1. Click on any product from "Test Pharmacy"
2. You'll see:
   - 🏪 "Test Pharmacy ⭐ 5" tag (vendor info)
   - Vendor name displayed
   - Product price and rating

### Step 4: Add to Cart

1. Click **Add to Cart** on any product
2. ✅ Product added notification appears
3. Go to **http://localhost:3000/cart**
4. See product with vendor information

---

## 📊 Complete Test Workflow

```mermaid
Vendor Registration → Admin Approval → Vendor Login → Add Products →
    ↓
Products visible on Medicines page → Customer sees vendor tag →
    ↓
Customer filters by vendor → Add to cart → Cart shows vendor → Checkout
```

---

## 🧪 Test API Endpoints Directly

### Using cURL or Postman

#### 1. Register Vendor

```bash
POST http://localhost:3000/api/vendor/register
Content-Type: application/json

{
  "vendorName": "Test Pharmacy 2",
  "email": "test2@pharmacy.com",
  "password": "password123",
  "phone": "9876543210",
  "businessType": "pharmacy",
  "businessAddress": {
    "street": "456 Main St",
    "city": "Mumbai",
    "state": "Maharashtra",
    "pincode": "400001"
  }
}
```

#### 2. Login Vendor

```bash
POST http://localhost:3000/api/vendor/login
Content-Type: application/json

{
  "email": "test@pharmacy.com",
  "password": "password123"
}
```

Response includes `token` - save this for next requests.

#### 3. Get Vendor Products

```bash
GET http://localhost:3000/api/vendor/products?vendorId=VENDOR_ID
```

#### 4. Add Product

```bash
POST http://localhost:3000/api/vendor/products
Content-Type: application/json
Authorization: Bearer YOUR_TOKEN

{
  "vendorId": "VENDOR_ID",
  "name": "New Product",
  "price": 99,
  "category": "generic",
  "stock": 50,
  "description": "Product description"
}
```

#### 5. Get Vendors by Status

```bash
GET http://localhost:3000/api/admin/vendors?status=pending
```

#### 6. Approve Vendor

```bash
POST http://localhost:3000/api/admin/vendors
Content-Type: application/json

{
  "vendorId": "VENDOR_ID",
  "action": "approve"
}
```

---

## ✅ Quick Checklist

- [ ] Vendor registration works
- [ ] Admin can see pending vendors
- [ ] Admin can approve vendors
- [ ] Vendor can login after approval
- [ ] Vendor can add products
- [ ] Products appear on medicines page
- [ ] Vendor filter shows in sidebar
- [ ] Customer can filter by vendor
- [ ] Product cards show vendor name
- [ ] Products can be added to cart
- [ ] Cart shows vendor information

---

## 🐛 Troubleshooting

### Vendor Can't Login

- Check status: Go to admin panel `/admin/vendors?status=verified`
- If pending: Ask admin to approve
- If rejected: Clear localStorage and register again

### Products Don't Appear

- Verify vendor status is "verified" (not pending)
- Check `/vendor/dashboard` Products tab
- Verify MongoDB has Vendor collection

### Filter Not Showing Vendors

- Need at least one verified vendor with products
- Go to `/medicines` page
- Look for **Vendors** section in left sidebar

### API Returns 404

- Ensure MongoDB is connected
- Check that Vendor model exists
- API routes need products in database

---

## 📱 Pages to Test

| URL                              | Test                        | Expected Result                     |
| -------------------------------- | --------------------------- | ----------------------------------- |
| `/vendor/register`               | Vendor sign up              | Registration form loads             |
| `/vendor/login`                  | Login with pending account  | "Account awaiting approval" message |
| `/vendor/login`                  | Login with verified account | Redirects to dashboard              |
| `/vendor/dashboard`              | View dashboard              | Shows metrics & products            |
| `/vendor/dashboard`              | Add product                 | Product saved in database           |
| `/admin/vendors`                 | View pending                | Shows unverified vendors            |
| `/admin/vendors?status=verified` | View verified               | Shows approved vendors              |
| `/medicines`                     | Browse products             | Shows vendor filter                 |
| `/medicines`                     | Filter by vendor            | Shows only vendor products          |

---

## Sample Test Account

**Vendor Account (Create New):**

- Email: `test@pharmacy.com`
- Password: `password123`
- Status: Pending → Verified (after admin approval)

**Admin Account (Existing):**

- Email: `admin@mysanjeevani.com`
- Password: `admin123`
- Access: `/admin/vendors` page

**Customer Account:**

- Any existing user account
- Or create new via `/signup`
- Browse `/medicines` to see multi-vendor products

---

## 🎬 Demo Flow (5 minutes)

1. **2 min:** Register vendor → Fill form → See success message
2. **1 min:** Login to admin → Go to `/admin/vendors` → Approve vendor
3. **1 min:** Login as vendor → Add 3 products → See in dashboard
4. **1 min:** View `/medicines` → See vendor filter → Filter by vendor → Add to cart

**Total: 5 minutes to see multi-vendor platform in action!**

---

## 📞 Support

For more details, see:

- [MULTI_VENDOR_GUIDE.md](./MULTI_VENDOR_GUIDE.md) - Complete technical guide
- [MULTI_VENDOR_COMPLETION.md](./MULTI_VENDOR_COMPLETION.md) - Implementation details
- Code comments in: `/src/app/api/vendor/` and `/src/app/vendor/`

---

## Next Steps

After testing:

1. **Order Management** - Create `/vendor/orders` page
2. **Commission System** - Calculate payouts per vendor
3. **Vendor Analytics** - Show sales reports and metrics
4. **Ratings System** - Integrate customer reviews with vendor ratings

Happy Testing! 🎉
