# Lab Test Details Page Implementation

## 📋 Overview

A comprehensive lab test details page that displays all information about a specific lab test and allows users to book appointments with integrated payment processing.

## 📁 Files Created

### 1. **API Endpoint** - `/api/lab-tests/[id]/route.ts`

Fetches individual lab test details by ID from the database.

**Features:**

- Validates test exists and is active
- Returns complete test information
- Error handling for not found tests

**Request:**

```bash
GET /api/lab-tests/{testId}
```

**Response:**

```json
{
  "message": "Lab test fetched successfully",
  "test": {
    "_id": "test_id_123",
    "name": "Blood Test",
    "description": "Complete blood count",
    "price": 299,
    "mrp": 499,
    "category": "general",
    "sampleType": "blood",
    "reportTime": "24 hours",
    "fasting": true,
    "fastingHours": 8,
    "homeCollectionAvailable": true,
    "centerCollectionAvailable": true,
    "testsIncluded": "RBC, WBC, Hemoglobin, Platelets...",
    "rating": 4.5,
    "reviews": 125,
    "isActive": true
  }
}
```

---

### 2. **Details Page** - `/lab-tests/[id]/page.tsx`

A dynamic page that displays comprehensive lab test information with booking functionality.

**URL Route:** `/lab-tests/[test-id]`

**Page Features:**

#### Layout

- **3-column responsive grid** (2 columns on desktop, 1 on mobile)
- **Left section (2 cols):** Test details
- **Right section (1 col):** Sticky booking card

#### Information Displayed

```
┌─────────────────────────────────────────┐
│  Test Image/Icon                        │
├─────────────────────────────────────────┤
│  ★ Rating & Reviews                     │
│  • Stock Status (Available/Out of Stock) │
│  • Category Badge                        │
├─────────────────────────────────────────┤
│  PRICE SECTION                          │
│  ₹299  ₹499 (Original)  40% OFF        │
├─────────────────────────────────────────┤
│  Description                            │
├─────────────────────────────────────────┤
│  TEST DETAILS                           │
│  • Sample Type (Blood/Urine)            │
│  • Report Time (24-48 hours)            │
│  • Fasting Required (Yes/No)            │
│  • Collection Type (Home/Center)        │
│  • Tests Included                       │
└─────────────────────────────────────────┘
```

#### Booking Card (Right Sidebar)

- **Price display**
- **Book Now button**
- **Quick benefits list:**
  - ✓ Free home collection
  - ✓ Secure & private
  - ✓ 24-48 hrs report

#### Booking Form (Two-Step)

**Step 1 - Collection Details:**

```
1. Collection Type (Radio)
   - 🏠 Home Collection
   - 🏥 Visit Centre

2. Collection Date (Date Picker)
   - Min: Today
   - Format: YYYY-MM-DD

3. Collection Time (Select)
   - 7:00 AM - 9:00 AM
   - 9:00 AM - 11:00 AM
   - 11:00 AM - 1:00 PM
   - 2:00 PM - 4:00 PM
   - 4:00 PM - 6:00 PM

4. Address (TextArea) - If Home Collection
   - Required field
   - Placeholder: "Enter your home address"

5. Special Instructions (TextArea) - Optional
   - Placeholder: "Any allergies, timing preferences, etc."
```

**Step 2 - Payment:**

- Razorpay payment integration
- Automatic order creation
- Payment verification
- Success confirmation

---

## 🎯 User Flow

```
1. User clicks "View Details" on lab test card
   ↓
2. Navigates to /lab-tests/[id]
   ↓
3. Views complete test information
   ↓
4. [If authenticated] Clicks "Book Now"
   ↓
5. [If not authenticated] Redirects to login
   ↓
6. Fills booking form (date, time, address, notes)
   ↓
7. Confirms booking
   ↓
8. Razorpay payment opens
   ↓
9. User completes payment
   ↓
10. Booking saved to database
   ↓
11. Success message shown
   ↓
12. Redirects to "My Bookings" tab
```

---

## 🔐 Authentication

**Uses:** localStorage (`token` + `user` object)

**Authentication Check:**

```typescript
const { user, token, isAuthenticated } = useAuth();

if (!isAuthenticated) {
  router.push(`/login?redirect=${currentPage}`);
}
```

**Login Redirect:**
If user is not authenticated and clicks "Book Now":

```
/login?redirect=/lab-tests/[id]
```

---

## 💳 Payment Integration

**Payment Provider:** Razorpay

**Flow:**

1. Click "Confirm Booking"
2. API creates Razorpay order (`/api/payments/razorpay/create-order`)
3. Razorpay checkout opens
4. User completes payment
5. Payment callback returns payment details
6. API creates booking (`/api/lab-test-bookings`)
7. Success confirmation shown

**Payment Info:**

```json
{
  "amount": 29900, // in paise (₹299 = 29900 paise)
  "currency": "INR",
  "description": "Lab Test: Blood Test"
}
```

---

## 🪝 React Hooks Used

### useAuth()

```typescript
const { user, token, isAuthenticated, loading } = useAuth();
```

**Returns:**

- `user`: User object from localStorage
- `token`: JWT token from localStorage
- `isAuthenticated`: Boolean if token exists
- `loading`: Boolean while checking auth

---

### useParams() & useRouter()

```typescript
const params = useParams();
const router = useRouter();

const testId = params.id as string;

// Navigate
router.push(`/lab-tests/[id]`);
router.back();
```

---

## 🔄 State Management

```typescript
const [test, setTest] = useState<LabTest | null>(null);
const [loading, setLoading] = useState(true);
const [error, setError] = useState("");
const [showBookingForm, setShowBookingForm] = useState(false);
const [bookingSuccess, setBookingSuccess] = useState(false);
const [bookingForm, setBookingForm] = useState<BookingForm>({
  testId: testId,
  testName: "",
  testPrice: 0,
  collectionType: "home",
  collectionDate: "",
  collectionTime: "",
  address: "",
  notes: "",
});
```

---

## 📊 Data Model

### LabTest Interface

```typescript
interface LabTest {
  _id: string;
  name: string;
  description?: string;
  price: number;
  mrp?: number;
  category: string;
  image?: string;
  icon?: string;
  rating?: number;
  reviews?: number;
  isActive: boolean;
  homeCollectionAvailable?: boolean;
  centerCollectionAvailable?: boolean;
  sampleType?: string;
  reportTime?: string;
  fasting?: boolean;
  fastingHours?: number;
  testsIncluded?: string;
  createdAt?: string;
}
```

### BookingForm Interface

```typescript
interface BookingForm {
  testId: string;
  testName: string;
  testPrice: number;
  collectionType: "home" | "center";
  collectionDate: string;
  collectionTime: string;
  address: string;
  notes: string;
}
```

---

## 🛣️ Navigation Changes

**Lab Tests Listing Page** - Updated "View Details" button:

**Before:**

```typescript
onClick={() => setBookingModal(test)}  // Opens modal on same page
```

**After:**

```typescript
onClick={() => router.push(`/lab-tests/${test._id}`)}  // Navigates to detail page
```

---

## 🎨 UI/UX Features

### Responsive Design

- **Desktop (lg):** 3-column layout with sticky sidebar
- **Tablet (md):** Adjusted grid
- **Mobile (sm):** Full-width single column

### Visual Feedback

- **Loading state:** Spinner animation
- **Error state:** Error message with back button
- **Success state:** Checkmark with confetti-like animation
- **Disabled states:** Out of stock tests show disabled buttons

### Tooltips & Helpers

- **Fasting info:** Shows hours if fasting required
- **Discount badge:** Shows percentage OFF if applicable
- **Rating stars:** Visual star rating display
- **Status badges:** Available/Out of Stock indicators

---

## 🔍 Error Handling

**Scenarios Handled:**

1. **Test not found:** 404 with "Lab test not found" message
2. **Invalid test ID:** Error message displayed
3. **Not authenticated:** Redirect to login
4. **Payment failed:** User-friendly error message
5. **Booking failed:** Error message with retry option
6. **Network error:** Catch and display error message

---

## 📱 Mobile Optimization

- **Touch-friendly buttons:** Large tap targets (44px minimum)
- **Responsive forms:** Full-width inputs on mobile
- **Readable text:** Font sizes scale appropriately
- **Optimized images:** Lazy loading for images
- **Sticky booking card:** Fixed position on desktop, scrolls on mobile

---

## 🚀 Performance Optimizations

1. **Code Splitting:** Dynamic page component
2. **Image Optimization:** Next.js Image component
3. **State Optimization:** useCallback for event handlers
4. **Lazy Script Loading:** Razorpay script loaded only when needed
5. **API Caching:** Browser cache for image resources

---

## 🧪 Testing Scenarios

### Happy Path

```
1. User not logged in
2. Click "View Details"
3. Redirected to login
4. Login performed
5. Return to /lab-tests/[id]
6. See test details
7. Click "Book Now"
8. Fill form
9. Make payment
10. See success ✓
```

### Edge Cases

```
1. Test doesn't exist → 404 error
2. Test out of stock → "Book Now" disabled
3. No collection date selected → Alert shown
4. No collection time selected → Alert shown
5. Payment failed → Razorpay error message
6. Form submission fails → Error message displayed
```

---

## 📚 Related Components

- **Header.tsx** - Navigation header
- **Footer.tsx** - Footer component
- **PhoneLogin.tsx** - Authentication component
- **RazorpayCheckout.tsx** - Payment component

---

## 🔗 Related APIs

- `GET /api/lab-tests/{id}` - Fetch test details
- `POST /api/payments/razorpay/create-order` - Create Razorpay order
- `POST /api/lab-test-bookings` - Save booking
- `GET /api/lab-test-bookings` - Fetch user's bookings

---

## ✅ Features Implemented

✅ Dynamic test details page
✅ Complete test information display
✅ Responsive layout (mobile/tablet/desktop)
✅ Authentication check with redirect
✅ Two-step booking form
✅ Home/Center collection options
✅ Date & time slot selection
✅ Address input for home collection
✅ Razorpay payment integration
✅ Error handling
✅ Success confirmation
✅ Navigation controls
✅ Stock status display
✅ Discount calculation
✅ Rating & reviews display
✅ Fasting requirements display

---

## 🎯 Future Enhancements

- [ ] Add test reviews/testimonials section
- [ ] Add similar tests recommendations
- [ ] Add lab location map
- [ ] Add FAQ section
- [ ] Add health tips related to test
- [ ] Add test result tracking
- [ ] Email confirmation after booking
- [ ] SMS reminder before booking
- [ ] Cancel booking option
- [ ] Reschedule booking option

---

**Build Status:** ✅ **SUCCESS** - All files compile without errors!
