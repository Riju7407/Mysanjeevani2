# 🚀 QUICK FIX: Razorpay Merchant Error - Fallback Mode

## ⚡ Instant Fix (2 Steps)

Your Razorpay merchant account appears to have restrictions/compliance issues causing the "merchant" error. Here's the instant fix:

### Step 1: Enable Fallback Mode

Edit `.env.local` and change:

```env
RAZORPAY_TEST_MODE="false"
RAZORPAY_FALLBACK_MODE="false"
```

**To:**

```env
RAZORPAY_TEST_MODE="false"
RAZORPAY_FALLBACK_MODE="true"
```

### Step 2: Restart Server

```bash
npm run dev
```

✅ **Done!** Now payments will work with mock orders (for development).

---

## 🎯 How It Works

### When Fallback Mode is Enabled:

1. User books a lab test
2. Razorpay order creation attempted
3. **If merchant error → Automatically generates mock order** ✓
4. Mock Razorpay checkout opens (simulated)
5. Payment goes through successfully
6. Booking saved ✓

### Example Payment Flow with Fallback:

```
User clicks "Book Now"
    ↓
API attempts real Razorpay order
    ↓
❌ Merchant error detected
    ↓
✅ Fallback → Generate mock order
    ↓
Mock order opens in Razorpay checkout
    ↓
User completes payment (simulated)
    ↓
✅ Booking confirmed
```

---

## 🧪 Test Payment (With Fallback Enabled)

### Testing Steps:

1. Login / Signup
2. Go to "Lab Tests"
3. Click "View Details" on any test
4. Click "Book Now"
5. Fill booking form
6. Click "Confirm Booking"
7. Razorpay opens → Click "Pay"
8. ✅ Success message

No need for real payment cards!

---

## ⚙️ Configuration Options

### 1. **Fallback Mode** (Recommended for Merchant Issues)

```env
RAZORPAY_TEST_MODE="false"
RAZORPAY_FALLBACK_MODE="true"
```

- Uses real API if possible
- Falls back to mock on merchant error
- Best for development with occasional live payments

### 2. **Test Mode** (Best for Development)

```env
RAZORPAY_TEST_MODE="true"
RAZORPAY_FALLBACK_MODE="false"
```

- Always generates mock orders
- No actual Razorpay API calls
- Perfect for testing without account issues

### 3. **Live Mode** (Production Only)

```env
RAZORPAY_TEST_MODE="false"
RAZORPAY_FALLBACK_MODE="false"
```

- Uses real Razorpay API
- No fallback
- Requires merchant account to be active

---

## 📊 Server Console Output

### With Fallback Mode Enabled - Error Detected:

```
❌ Razorpay API Error: Invalid merchant account
⚠️ Merchant account issue detected, switching to mock order
📝 Mock order generated: order_a1b2c3d4e5f6g7h8
```

### With Fallback Mode Enabled - Success:

```
✅ Real Razorpay order created successfully
Order ID: order_1234567890abc
Amount: 29900 paise (₹299)
```

---

## 🔧 Troubleshooting

### Still Getting Error?

1. **Check console logs** in browser DevTools
2. **Check server logs** in terminal running `npm run dev`
3. **Restart server** after changing `.env.local`
4. **Clear browser cache** - Ctrl+Shift+Delete

### Payment Still Not Working?

1. Verify Razorpay script is loading (Network tab → razorpay checkout.js)
2. Check auth token is present
3. Ensure test amount > ₹1
4. Try in incognito mode (bypass cache)

---

## 📝 Next Steps: Fix Merchant Account

To use real payments, you need to fix your Razorpay merchant account:

### Action Items:

1. **Login to Razorpay Dashboard:**
   - https://dashboard.razorpay.com

2. **Check Account Status:**
   - Settings → Account Settings
   - Status should be: ✓ Active
   - If suspended → Contact Razorpay support

3. **Enable Payment Methods:**
   - Settings → Payment Methods
   - Enable: ✓ Cards, ✓ UPI, ✓ Netbanking

4. **Verify API Keys:**
   - Settings → API Keys
   - Copy keys (no spaces, exact match)
   - Update `.env.local` if different

5. **Submit Compliance Documents:**
   - If account is new, might need KYC verification
   - Check Dashboard for any pending verification

---

## 🔐 Security Note

**For Production:**

- ❌ Do NOT use `RAZORPAY_FALLBACK_MODE="true"` on production
- ✅ Fix merchant account first
- ✅ Use `RAZORPAY_FALLBACK_MODE="false"` on live servers
- ⚠️ Mock payments won't actually charge customers

---

## 📱 Testing With Real Payment

Once merchant account is fixed:

1. Set `RAZORPAY_FALLBACK_MODE="false"`
2. Use test cards:
   - **Card:** 4111 1111 1111 1111
   - **Exp:** Any future date
   - **CVV:** Any 3 digits
3. Payment should process successfully

---

## ✅ Success Indicators

After enabling fallback mode, you should see:

✅ No "merchant error"
✅ Mock Razorpay checkout opens
✅ Payment processes
✅ "Booking Confirmed!" message
✅ Booking appears in "My Bookings"
✅ Database entry created

---

## 📞 Still Need Help?

### Check Razorpay Status:

- https://status.razorpay.com
- Any ongoing incidents?

### Razorpay Support:

- Dashboard → Help
- Contact support@razorpay.com

### Common Issues:

| Issue                   | Solution                  |
| ----------------------- | ------------------------- |
| 401 Unauthorized        | API keys incorrect        |
| 400 Bad Request         | Merchant account inactive |
| Payment method disabled | Enable in Payment Methods |
| Minimum amount error    | Test price > ₹1           |

---

**Current Status:** ✅ Build successful - Ready to test with fallback mode!
