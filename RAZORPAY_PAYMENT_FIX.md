# Razorpay Payment Error Fixes & Troubleshooting

## ✅ Fixes Applied

### 1. **Double Multiplication Bug Fixed**

**Problem:** Amount was multiplied by 100 twice (once on frontend, once in API endpoint)

- Frontend sent: `₹299 × 100 = 29,900`
- API converted: `29,900 × 100 = 2,990,000` (₹29,900 instead of ₹299!)

**Solution:**

- Frontend now sends amount in **INR** (e.g., 299)
- API converts to paise (e.g., 29,900)
- Result: Correct amount ✓

### 2. **Order ID Mismatch Fixed**

**Problem:** Code expected `orderData.orderId` but API returned `orderData.order`

**Solution:**

- Updated to use `orderData.order.id` from correct response structure
- Added proper error checking for order response

### 3. **Better Error Handling Added**

- Console logging for debugging
- Specific error messages for different failure scenarios
- Payment method validation errors explained
- Merchant account configuration checks

---

## 🔧 Configuration Checklist

### Verify Razorpay Setup

**1. Check API Keys** (in `.env.local`):

```env
RAZORPAY_KEY_ID="rzp_live_SUcsurW9fkbXe3"       ✓ Must have "rzp_live" or "rzp_test"
RAZORPAY_KEY_SECRET="N5tsZgj4ZFlXxJLnchfsiyO2"  ✓ Must not be exposed in frontend
NEXT_PUBLIC_RAZORPAY_KEY_ID="rzp_live_..."      ✓ Can be public (frontend only)
```

**2. Verify Keys on Razorpay Dashboard:**

- Visit: https://dashboard.razorpay.com/app/keys
- Copy keys exactly (no spaces, special characters)
- Ensure keys belong to same merchant account

**3. Enable Payment Methods:**

- Go: https://dashboard.razorpay.com/app/settings/payment-methods
- Enable: Cards, UPI, Netbanking, Wallets (as needed)
- Likely cause of merchant error if disabled

---

## 🐛 Common Error Messages & Solutions

### Error: "This payment has failed due to an issue with the merchant"

**Cause 1: Payment Method Disabled**

```
Solution:
1. Go to https://dashboard.razorpay.com/app/settings/payment-methods
2. Enable:
   - ✓ Cards (Debit/Credit)
   - ✓ UPI
   - ✓ Netbanking
   - ✓ Wallets
3. Wait 2-3 minutes for changes to propagate
4. Try payment again
```

**Cause 2: Incorrect API Keys**

```
Solution:
1. Verify keys in .env.local match Razorpay Dashboard exactly
2. No spaces, no typos
3. Restart Next.js server: npm run dev
```

**Cause 3: Amount Too Low**

```
Solution:
Minimum order amount is ₹1
Verify test.price > 0
Check database for valid test prices
```

---

## 🧪 Testing Payment Flow

### Step 1: Test Order Creation

```bash
curl -X POST http://localhost:3000/api/payments/razorpay/create-order \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "amount": 299,
    "currency": "INR",
    "description": "Lab Test: Blood Test"
  }'
```

**Expected Response:**

```json
{
  "success": true,
  "order": {
    "id": "order_123456789",
    "amount": 29900,
    "currency": "INR",
    "status": "created"
  },
  "keyId": "rzp_live_xxx"
}
```

### Step 2: Test Payment Methods

```bash
curl -X GET https://api.razorpay.com/v1/methods \
  -u "YOUR_KEY_ID:YOUR_KEY_SECRET"
```

**Expected Response:**

```json
{
  "card": {...},
  "upi": {...},
  "netbanking": {...},
  "wallet": {...}
}
```

### Step 3: Browser Console Testing

Open DevTools and check console for:

- ✓ Order creation success
- ✓ Razorpay script loaded
- ✓ Checkout opened
- ✓ Payment handler called

---

## 📱 Payment Testing Cards

**Development (Test Mode):**

```
Card: 4111 1111 1111 1111
Exp: Any future date (e.g., 12/25)
CVV: Any 3 digits (e.g., 123)
```

**UPI Testing:**

```
UPI ID: success@razorpay
Account: Test Account
```

⚠️ **Note:** Test cards only work with `rzp_test_xxx` keys, not `rzp_live_xxx`

---

## 🔍 Debugging Steps

### 1. Check Server Logs

```
Look for console output when booking:
✓ Razorpay create-order error: { message: "...", code: "..." }
✓ This shows what API is returning
```

### 2. Check Browser Console

```
DevTools → Console tab
Look for:
- Failed to create order
- Payment handler logs
- Razorpay checkout errors
```

### 3. Check Network Tab

```
DevTools → Network tab
Look for:
- POST /api/payments/razorpay/create-order
  - Status: 200 (success) or 500 (error)
  - Response: Full order object or error message

Example success response:
{
  "success": true,
  "order": {
    "id": "order_...",
    "amount": 29900
  }
}

Example error response:
{
  "error": "Payment method (card) is disabled",
  "code": "METHOD_DISABLED"
}
```

---

## 🚀 Code Changes Summary

### File: `/src/app/lab-tests/[id]/page.tsx`

**Before:**

```typescript
// Double multiplication bug
body: JSON.stringify({
  amount: bookingForm.testPrice * 100,  // ₹299 → 29,900
}),

// Wrong order ID
order_id: orderData.orderId,  // Undefined!
amount: bookingForm.testPrice * 100,
```

**After:**

```typescript
// Send in INR, let API convert to paise
body: JSON.stringify({
  amount: bookingForm.testPrice,  // ₹299
  currency: 'INR',
}),

// Correct order ID from response
order_id: orderData.order.id,  // ✓ Correct
amount: orderData.order.amount,  // Use actual amount from server
```

---

### File: `/src/app/api/payments/razorpay/create-order/route.ts`

**Changes:**

- Send amount in **INR** (not paise)
- Single multiplication: `INR * 100 = paise`
- Better error logging with details
- Minimum amount validation (₹1)
- Response structure validation

---

## 📊 Payment Status Monitoring

### After Payment Success

1. ✓ Razorpay returns payment details
2. ✓ Booking endpoint (`/api/lab-test-bookings`) called
3. ✓ Booking saved to database
4. ✓ Success message shown
5. ✓ Redirect to "My Bookings"

### Check Booking in Database

```javascript
// Check MongoDB
db.labTestBookings.findOne({
  razorpayOrderId: "order_123456789"
})

// Expected fields
{
  userId: "user_id",
  testName: "Blood Test",
  testPrice: 299,  // In INR
  razorpayOrderId: "order_123456789",
  razorpayPaymentId: "pay_123456789",
  razorpaySignature: "...",
  status: "completed"
}
```

---

## 🔐 Security Checklist

✓ RAZORPAY_KEY_SECRET never exposed in frontend
✓ NEXT_PUBLIC_RAZORPAY_KEY_ID is public (safe for frontend)
✓ Payment verification with signature validation
✓ User token verified before booking
✓ Order amount server-side generated
✓ Database transaction safety

---

## 📞 Still Having Issues?

### Quick Fixes to Try

1. **Restart dev server:**

   ```bash
   npm run dev
   ```

2. **Clear browser cache:**
   - Chrome DevTools → Application → Clear site data
   - Or: Ctrl+Shift+Delete

3. **Test with different browser:**
   - Chrome, Firefox, Safari
   - Check if issue is browser-specific

4. **Check Razorpay status:**
   - https://status.razorpay.com
   - Any ongoing incidents?

5. **Verify merchant account:**
   - https://dashboard.razorpay.com/app/settings/account
   - Account status: Active/Suspended?

### Advanced Debugging

```javascript
// In browser console, log response details
fetch("/api/payments/razorpay/create-order", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  },
  body: JSON.stringify({
    amount: 299,
    currency: "INR",
  }),
})
  .then((r) => r.json())
  .then((data) => {
    console.log("Full Response:", data);
    console.log("Order ID:", data.order?.id);
    console.log("Amount:", data.order?.amount);
  })
  .catch((err) => console.error("Request failed:", err));
```

---

## ✅ Success Indicators

After fixes, you should see:

✓ No "double multiplication" in order amount
✓ Razorpay payment modal opens correctly
✓ Payment methods available (Cards, UPI, etc.)
✓ Payment processes without "merchant" error
✓ Order created in database with correct amount
✓ Booking confirmed
✓ Redirect to "My Bookings" page

---

**Build Status:** ✅ **Compiled successfully**
