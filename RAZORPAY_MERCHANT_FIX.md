# 🔧 Fix Razorpay Merchant Error - Complete Guide

## Problem

**Error:** "This payment has failed due to an issue with the merchant. Do get in touch with site/app admin regarding the issue."

## Root Causes (According to Razorpay Documentation)

1. **Merchant account not activated** (MOST COMMON) ❌
2. **Payment methods disabled** in merchant account ❌
3. **Invalid API keys** (test vs live mismatch) ❌
4. **Incomplete KYC verification** ❌
5. **Account suspended/locked** ❌

---

## ✅ SOLUTION: Step-by-Step Fix

### Phase 1: Diagnose the Issue

#### Step 1.1: Check Server Logs

When booking a lab test, look for logs like:

```
❌ Merchant validation failed: Merchant account not activated (status: pending)
```

**Other possible messages:**

- `Invalid Razorpay API keys`
- `Merchant account validation failed`
- `Merchant account issue detected`

#### Step 1.2: Check Razorpay Dashboard

1. Go to: https://dashboard.razorpay.com
2. Login with your account
3. Go to **Settings** → **Account Settings**
4. Look for **Account Status**:
   - ✅ `activated` = Account is ready
   - ⏳ `pending_activation` = Waiting for approval
   - ❌ `suspended` = Account is locked
   - ⛔ `on_hold` = Account on hold

### Phase 2: Activate Your Account

#### If Status is `pending_activation`:

1. **Complete KYC (Know Your Customer):**
   - Dashboard → Verification
   - Complete all required documents:
     - Business registration
     - Owner ID proof
     - Address proof
     - Bank account details
   - Upload high-quality photos
   - Submit for verification

2. **Wait for approval** (usually 1-3 business days)
   - You'll receive email notification
   - Once approved, status → `activated`

#### If Status is `suspended` or `on_hold`:

1. **Contact Razorpay Support:**
   - Dashboard → Help & Support
   - Create support ticket
   - Mention: "Account suspended - need reactivation"
   - Provide business details

### Phase 3: Enable Payment Methods

#### Step 3.1: Verify Payment Methods Are Enabled

1. Go to: https://dashboard.razorpay.com/app/settings/payment-methods
2. Look for these items - **ALL should have toggles ON ✓**:
   - ✓ Cards (Debit/Credit)
   - ✓ UPI
   - ✓ Netbanking
   - ✓ Wallets
   - ✓ BNPL

#### Step 3.2: If Any Are Disabled

1. Click the toggle to enable
2. Some methods may require approval:
   - **Cards:** Usually instant
   - **UPI:** Usually instant
   - **International Cards:** May require review
   - **Custom methods:** May need approval

3. If you see a message like:
   ```
   "This method requires additional KYC"
   ```

   - Complete the additional verification
   - Submit for review

### Phase 4: Verify API Keys

#### Step 4.1: Check if Keys Match Your Account

1. Go to: https://dashboard.razorpay.com/app/keys
2. You'll see two options:
   - **Live Key ID** - starts with `rzp_live_`
   - **Test Key ID** - starts with `rzp_test_`

3. **Check your `.env.local`:**

   ```env
   RAZORPAY_KEY_ID=???
   ```

4. **Compare:**
   - If using live keys (`rzp_live_*`): Account MUST be activated
   - If using test keys (`rzp_test_*`): Account can be in any state

#### Step 4.2: Update Keys if Needed

If keys don't match:

1. Copy the correct key from dashboard
2. Update `.env.local`:

   ```env
   RAZORPAY_KEY_ID="rzp_live_YOUR_KEY_HERE"
   RAZORPAY_KEY_SECRET="YOUR_SECRET_HERE"
   NEXT_PUBLIC_RAZORPAY_KEY_ID="rzp_live_YOUR_KEY_HERE"
   ```

3. Restart server:
   ```bash
   npm run dev
   ```

### Phase 5: Test Payment Flow

#### Step 5.1: Try Booking a Lab Test

1. Login
2. Go to Lab Tests
3. Click "View Details" on any test
4. Click "Book Now"
5. Fill form with:
   - Valid email (must have @)
   - Valid phone (10+ digits)
   - Date and time
6. Click "Confirm Booking"

#### Step 5.2: Check Server Logs

Look for success message:

```
✅ Merchant account validated: {
  email: "your_business@example.com",
  status: "activated",
  business_type: "partnership"
}
✅ Merchant account valid, proceeding with order creation
```

#### Step 5.3: If Still Failing

Check console for detailed error:

```
❌ Merchant validation failed: [specific error message]
```

---

## 🚨 Emergency Fix: Enable Fallback Mode

If merchant account fix takes time, enable fallback mode:

### Option 1: Quick Temporary Fix

Edit `.env.local`:

```env
RAZORPAY_FALLBACK_MODE="true"
```

This will:

- Use real API if account works
- Use mock orders on failure
- Let payments process with mock payment

### Option 2: Test Mode (While Fixing Account)

Edit `.env.local`:

```env
RAZORPAY_TEST_MODE="true"
```

This will:

- Always use mock orders
- No real Razorpay API calls
- Perfect for development/testing

---

## 📊 Merchant Account Checklist

Go through each item BEFORE attempting payment:

### Account Status ✓

- [ ] Account status is `activated`
- [ ] Account not suspended
- [ ] KYC verification complete

### Payment Methods ✓

- [ ] Cards enabled
- [ ] UPI enabled
- [ ] Netbanking enabled
- [ ] At least 1 method is active

### API Configuration ✓

- [ ] API keys copied correctly
- [ ] No spaces in keys
- [ ] Keys match account (live vs test)
- [ ] `.env.local` updated
- [ ] Server restarted

### User Data ✓

- [ ] User has valid email
- [ ] User phone is 10+ digits
- [ ] Phone starts with country code (+91 for India)
- [ ] Profile is complete

### Business Details ✓

- [ ] Bank account verified
- [ ] Business address confirmed
- [ ] Owner ID verified
- [ ] Tax ID submitted

---

## 🔍 Diagnostic Tool

When merchant error occurs, server now logs:

```json
{
  "error": "Merchant account not activated (status: pending_activation)",
  "code": "MERCHANT_ACCOUNT_ISSUE",
  "help": "Please contact admin to fix merchant account",
  "debug": {
    "statusCode": 400,
    "key_id": "***configured***"
  }
}
```

Check server console for these details!

---

## 📱 Testing With Real Account

Once merchant account is activated:

### Test Cards (Razorpay):

```
Card: 4111 1111 1111 1111
Exp: 12/25 (any future date)
CVV: 123 (any 3 digits)
OTP: 000000 (if prompted)
```

### Test UPI (Razorpay):

```
UPI: success@razorpay
```

### Expected Flow:

1. Payment modal opens ✓
2. Enter card/UPI details ✓
3. Payment processes ✓
4. Success page shows ✓
5. Booking confirmed ✓

---

## 🆘 When Nothing Works

### Contact Razorpay Support

1. **Dashboard Help:**
   - https://dashboard.razorpay.com/support
   - Click "Create New Ticket"

2. **Email:**
   - support@razorpay.com

3. **Phone:**
   - India: +91-9871151309
   - International: Check website

4. **What to mention:**
   - Merchant account email
   - Issue: "Payment failing with merchant error"
   - Screenshots of error
   - API key ID (first 10 chars only)

### Enable Fallback Mode While Waiting

```env
RAZORPAY_FALLBACK_MODE="true"
```

This allows:

- Users to test booking flow
- Mock payments to process
- Real payments when account fixed

---

## ✅ Success Checklist

After implementing fixes, verify:

- [ ] Server logs show merchant validation passing
- [ ] No "merchant error" on payment
- [ ] Razorpay modal opens
- [ ] Payment can be completed
- [ ] Booking appears in database
- [ ] User sees success message

---

## 📘 Razorpay Documentation References

- **Account Setup:** https://razorpay.com/docs/get-started/
- **Payment Methods:** https://razorpay.com/docs/payment-gateway/payments/support-payment-types/
- **Errors & Troubleshooting:** https://razorpay.com/docs/payment-gateway/errors/
- **Merchant Account:** https://razorpay.com/app/dashboard

---

**Status:** ✅ Build successful - Ready to fix merchant account!
