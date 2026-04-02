# Razorpay Payment Gateway Integration

Complete Razorpay integration for MySanjeevani e-commerce platform supporting Medicines, Lab Tests, Doctor Consultations, and general product orders.

## Table of Contents

1. [Setup](#setup)
2. [API Endpoints](#api-endpoints)
3. [Frontend Integration](#frontend-integration)
4. [Payment Flow](#payment-flow)
5. [Webhook Configuration](#webhook-configuration)
6. [Examples](#examples)
7. [Troubleshooting](#troubleshooting)

---

## Setup

### Prerequisites

- Razorpay Account (https://razorpay.com)
- API Keys from Razorpay Dashboard

### Environment Variables

Add these to `.env.local`:

```env
# Razorpay Keys (from https://dashboard.razorpay.com/app/keys)
RAZORPAY_KEY_ID="rzp_live_YOUR_KEY_ID"
RAZORPAY_KEY_SECRET="rzp_live_YOUR_KEY_SECRET"
NEXT_PUBLIC_RAZORPAY_KEY_ID="rzp_live_YOUR_KEY_ID"

# Webhook Secret (for validating webhook signatures)
RAZORPAY_WEBHOOK_SECRET="whsec_live_YOUR_WEBHOOK_SECRET"
```

**Important:**

- Store `RAZORPAY_KEY_SECRET` securely (server-side only)
- `RAZORPAY_WEBHOOK_SECRET` must match your Razorpay webhook configuration
- Only `NEXT_PUBLIC_RAZORPAY_KEY_ID` should be exposed to frontend

---

## API Endpoints

### 1. Create Order Payment

**Endpoint:** `POST /api/payments/razorpay/order`

**Purpose:** Create a new order with Razorpay payment integration

**Request Body:**

```json
{
  "userId": "user_id_mongodb",
  "items": [
    {
      "productId": "prod_123",
      "productName": "Aspirin",
      "quantity": 2,
      "price": 100,
      "total": 200
    }
  ],
  "totalPrice": 500,
  "deliveryAddress": "123 Main St, City, State 12345",
  "currency": "INR",
  "notes": {
    "customField": "value"
  }
}
```

**Response (Success - 201):**

```json
{
  "success": true,
  "order": {
    "_id": "order_mongodb_id",
    "razorpayOrderId": "order_7Oy8S65Cu511fR",
    "amount": 500,
    "currency": "INR"
  },
  "keyId": "rzp_live_YOUR_KEY_ID"
}
```

**Response (Error - 400/500):**

```json
{
  "error": "Invalid amount specified",
  "code": "INVALID_AMOUNT"
}
```

---

### 2. Get Order Details

**Endpoint:** `GET /api/payments/razorpay/order?orderId=<orderId>`

**Purpose:** Fetch existing order details

**Response (Success):**

```json
{
  "success": true,
  "order": {
    "_id": "order_mongodb_id",
    "userId": "user_id",
    "items": [...],
    "totalPrice": 500,
    "paymentStatus": "pending",
    "razorpayOrderId": "order_7Oy8S65Cu511fR",
    "status": "pending",
    "createdAt": "2024-03-15T10:30:00Z"
  }
}
```

---

### 3. Verify Order Payment

**Endpoint:** `POST /api/payments/razorpay/verify-order-payment`

**Purpose:** Verify payment signature and mark order as paid

**Request Body:**

```json
{
  "razorpay_order_id": "order_7Oy8S65Cu511fR",
  "razorpay_payment_id": "pay_7Oy8S65Cu511fR",
  "razorpay_signature": "9ef4dffbfd84f1318f6739a3ce19f9d85851857ae648f114332d8401e0949a3d",
  "orderId": "mongodb_order_id"
}
```

**Response (Success):**

```json
{
  "success": true,
  "verified": true,
  "message": "Payment verified successfully",
  "order": {
    "_id": "order_mongodb_id",
    "paymentStatus": "completed",
    "status": "confirmed",
    "razorpayPaymentId": "pay_7Oy8S65Cu511fR"
  }
}
```

**Response (Invalid Signature):**

```json
{
  "success": false,
  "verified": false,
  "error": "Invalid payment signature"
}
```

---

### 4. Create Simple Payment Order (Legacy)

**Endpoint:** `POST /api/payments/razorpay/create-order`

**Purpose:** Create basic Razorpay order without database entry

**Request Body:**

```json
{
  "amount": 500,
  "currency": "INR",
  "receipt": "receipt_123",
  "notes": {
    "userId": "user_123",
    "purpose": "medicine_purchase"
  },
  "selectedPaymentMethod": "upi"
}
```

---

### 5. Verify Simple Payment

**Endpoint:** `POST /api/payments/razorpay/verify-order`

**Purpose:** Verify payment without database update

**Request Body:**

```json
{
  "razorpay_order_id": "order_7Oy8S65Cu511fR",
  "razorpay_payment_id": "pay_7Oy8S65Cu511fR",
  "razorpay_signature": "9ef4dffbfd84f1318f6739a3ce19f9d85851857ae648f114332d8401e0949a3d"
}
```

---

### 6. Webhook Endpoint

**Endpoint:** `POST /api/payments/razorpay/webhook`

**Purpose:** Receive and process Razorpay webhook events

**Webhook Events Handled:**

- `payment.captured` - Payment successful
- `payment.failed` - Payment failed

**Webhook Configuration in Razorpay:**

1. Go to Settings → Webhooks
2. Add webhook URL: `https://yourdomain.com/api/payments/razorpay/webhook`
3. Select Events:
   - `payment.authorized`
   - `payment.captured`
   - `payment.failed`

---

## Frontend Integration

### Using the Payment Hook

```typescript
import { useRazorpayPayment } from '@/lib/hooks/useRazorpayPayment';

function MyComponent() {
  const { checkout, createOrder, initiatePayment } = useRazorpayPayment();

  const handlePayment = async () => {
    try {
      const result = await checkout({
        userId: 'user_123',
        items: [{ productId: '1', productName: 'Medicine', quantity: 1, price: 100, total: 100 }],
        totalPrice: 100,
        deliveryAddress: '123 Main St',
        userEmail: 'user@example.com',
        userName: 'John Doe',
        userPhone: '9999999999'
      });

      console.log('Payment successful:', result);
    } catch (error) {
      console.error('Payment failed:', error);
    }
  };

  return <button onClick={handlePayment}>Pay Now</button>;
}
```

### Using the Checkout Component

```tsx
import RazorpayCheckout from "@/components/RazorpayCheckout";

export default function Cart() {
  return (
    <RazorpayCheckout
      userId="user_123"
      cartItems={items}
      totalPrice={500}
      userEmail="user@example.com"
      userName="John Doe"
      userPhone="9999999999"
    />
  );
}
```

---

## Payment Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                     PAYMENT FLOW DIAGRAM                        │
└─────────────────────────────────────────────────────────────────┘

1. User clicks "Pay Now" on Checkout page
    ↓
2. Frontend calls POST /api/payments/razorpay/order
    ↓
3. Backend creates Order in DB + Razorpay order
    ↓
4. Frontend receives razorpayOrderId & keyId
    ↓
5. Razorpay checkout modal opens (client-side)
    ↓
6. User enters payment details & authorizes
    ↓
7. Razorpay processes payment
    ↓
8. Webhook callback (background)
    ├─ Updates database
    └─ Sets paymentStatus = 'completed'
    ↓
9. Razorpay returns signature to frontend
    ↓
10. Frontend calls POST /api/payments/razorpay/verify-order-payment
    ↓
11. Backend verifies signature & updates order
    ↓
12. User redirected to success page
    ↓
13. User receives order confirmation
```

---

## Webhook Configuration

### Setup in Razorpay Dashboard

1. Login to https://dashboard.razorpay.com
2. Go to **Settings** → **Webhooks**
3. Click **Add New Webhook**
4. Enter:
   - **URL:** `https://yourdomain.com/api/payments/razorpay/webhook`
   - **Events:** Select these events:
     - `payment.authorized`
     - `payment.captured`
     - `payment.failed`
     - `payment.pending`
5. Copy the **Webhook Secret** and add to `.env.local`:
   ```env
   RAZORPAY_WEBHOOK_SECRET="whsec_live_xxxxxxxxxxxxx"
   ```

### Webhook Events Processed

| Event                | Action                                                                    |
| -------------------- | ------------------------------------------------------------------------- |
| `payment.captured`   | Mark order as completed, update DoctorConsultation, LabTestBooking, Order |
| `payment.failed`     | Mark order as failed in all models                                        |
| `payment.authorized` | Log for audit trail                                                       |

---

## Examples

### Example 1: Complete Checkout Flow

```typescript
// 1. Get cart items from state
const cartItems = [
  {
    productId: "123",
    productName: "Diabetes Care Kit",
    quantity: 1,
    price: 500,
    total: 500,
  },
];

// 2. Collect user info
const userInfo = {
  userId: user._id,
  userEmail: user.email,
  userName: user.name,
  userPhone: user.phone,
  deliveryAddress: selectedAddress,
};

// 3. Trigger checkout
const result = await checkout({
  ...userInfo,
  items: cartItems,
  totalPrice: 500,
  notes: {
    referrerCode: "HEALTH20",
  },
});

// 4. Handle success
if (result.success) {
  // Order confirmed, proceed to order details
  router.push(`/orders/${result.orderId}`);
}
```

### Example 2: Manual Payment Flow

```typescript
// Create order first
const orderResult = await createOrder({
  userId: user._id,
  items: cartItems,
  totalPrice: 500,
  deliveryAddress: address,
});

const { razorpayOrderId, order } = orderResult;

// Then initiate payment
const paymentResult = await initiatePayment({
  orderId: order._id,
  razorpayOrderId,
  amount: 500,
  userEmail: user.email,
  userName: user.name,
  userPhone: user.phone,
});
```

### Example 3: Handle Payment Errors

```typescript
try {
  const result = await checkout(payload);
} catch (error) {
  if (error.message.includes("cancelled")) {
    // User cancelled payment
    setStatus("Payment cancelled. Please try again.");
  } else if (error.message.includes("signature")) {
    // Invalid signature
    setStatus("Payment verification failed. Contact support.");
  } else {
    setStatus("Payment failed: " + error.message);
  }
}
```

---

## Database Schema

### Order Model

```typescript
{
  _id: ObjectId,
  userId: ObjectId (ref: User),
  items: [{
    productId: String,
    productName: String,
    quantity: Number,
    price: Number,
    total: Number
  }],
  totalPrice: Number,
  deliveryAddress: String,
  status: enum['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'],
  paymentStatus: enum['pending', 'completed', 'failed'],

  // Razorpay fields
  razorpayOrderId: String,
  razorpayPaymentId: String,
  razorpaySignature: String,

  orderNotes: String,
  createdAt: Date,
  updatedAt: Date
}
```

---

## Troubleshooting

### Issue 1: "Razorpay keys are not configured"

**Solution:**

- Verify `.env.local` has `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET`
- Restart development server: `npm run dev`

### Issue 2: "Invalid payment signature"

**Solution:**

- Ensure webhook secret is correct in `.env.local`
- Check that callback data structure matches verification code
- Verify signature generation uses correct order format

### Issue 3: Webhook not being called

**Solution:**

- Verify webhook URL in Razorpay dashboard
- Check network logs for webhook requests
- Test webhook manually in Razorpay dashboard
- Ensure RAZORPAY_WEBHOOK_SECRET is set

### Issue 4: Payment successful but order not updated

**Solution:**

- Check database connection in webhook handler
- Verify models are correctly imported
- Check browser console for payment verification failures
- Ensure order exists before verification

### Issue 5: Razorpay checkout won't open

**Solution:**

- Verify `NEXT_PUBLIC_RAZORPAY_KEY_ID` is set
- Check that script loads: `window.Razorpay` exists
- Clear browser cache and reload
- Test in incognito mode

---

## Security Considerations

1. **Never expose `RAZORPAY_KEY_SECRET`** in frontend code
2. **Always verify signatures** on webhook and payment verification
3. **Use HTTPS** for all payment endpoints
4. **Validate user input** before creating orders
5. **Rate limit** payment endpoints to prevent abuse
6. **Log all payment activities** for audit trail
7. **Use strong webhook secrets** for webhook validation

---

## Testing

### Test Cards

| Card Number      | Expiry          | CVV          | Status  |
| ---------------- | --------------- | ------------ | ------- |
| 4111111111111111 | Any future date | Any 3 digits | Success |
| 4000000000000002 | Any future date | Any 3 digits | Failed  |

### Test UPI IDs

- `success@upi` - Payment succeeds
- `failure@upi` - Payment fails

---

## Support & Resources

- **Razorpay Documentation:** https://razorpay.com/docs
- **API Reference:** https://razorpay.com/docs/api/
- **Webhook Guide:** https://razorpay.com/docs/webhooks/
- **Testing Guide:** https://razorpay.com/docs/payments/test-mode/

---

## API Status Monitoring

Keep track of Razorpay API status at: https://status.razorpay.com/
