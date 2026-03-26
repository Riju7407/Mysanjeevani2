# Localhost Payment Testing Guide

## Pre-Testing Checklist

### 1. Verify Environment Setup
- [ ] Check that `.env.local` has Razorpay live keys configured
- [ ] Verify app is running on `http://localhost:3000`
- [ ] Check browser console for any JavaScript errors
- [ ] Verify Razorpay SDK loads correctly (check Network tab)

### 2. Test Data Setup
You'll need:
- Valid payment method (UPI app, Card, Netbanking, or Wallet)
- User account (login/signup if needed)
- Test product(s) in cart or consultation/lab test booking

---

## Testing Flows

### Flow 1: Cart Checkout (Medicines/Products)

**Steps:**
1. Go to `http://localhost:3000`
2. Browse medicines and add items to cart
3. Click "Proceed to Checkout"
4. Select payment method (UPI, Card, Netbanking, or Wallet)
5. Click "Pay with Razorpay"
6. **Expected: Razorpay Checkout window opens**

**What to verify:**
- [ ] Razorpay checkout popup appears
- [ ] Selected payment method is the only one available (method restriction working)
- [ ] Payment is processed successfully with valid credentials
- [ ] Order is created in database after successful payment
- [ ] Order confirmation page appears
- [ ] No "merchant issue" error appears

**Test commands to run in Browser Console:**
```javascript
// Check if Razorpay is loaded
console.log(typeof window.Razorpay);

// Check environment
console.log('App running on:', window.location.href);
```

---

### Flow 2: Doctor Consultation Booking

**Steps:**
1. Go to `http://localhost:3000/doctor-consultation`
2. Select a doctor from the list
3. Choose consultation date/time
4. Click "Book Consultation"
5. Select payment method (UPI, Card, Netbanking, or Wallet)
6. Click to proceed with Razorpay
7. **Expected: Razorpay Checkout window opens**

**What to verify:**
- [ ] Doctor details are prefilled in checkout
- [ ] Razorpay checkout loads with correct amount (doctor fee)
- [ ] Only selected payment method is available
- [ ] After payment, consultation booking is created
- [ ] Consultation appears in user's profile/orders
- [ ] No "merchant issue" error appears

**Diagnostic check in Browser Console:**
```javascript
// Verify doctor consultation API response
fetch('/api/doctors')
  .then(r => r.json())
  .then(d => console.log('Doctors available:', d.length))
  .catch(e => console.error('API error:', e.message));
```

---

### Flow 3: Lab Test Booking

**Steps:**
1. Go to `http://localhost:3000/lab-tests`
2. Select a lab test from the list
3. Choose dates and time slots
4. Enter personal details
5. Click "Book Now"
6. Select payment method
7. Click to proceed with Razorpay
8. **Expected: Razorpay Checkout window opens**

**What to verify:**
- [ ] Test details are prefilled in checkout form
- [ ] Correct test amount is calculated
- [ ] Razorpay checkout loads correctly
- [ ] Method restriction applies (only selected method available)
- [ ] After payment, lab booking is created
- [ ] Booking appears in user's profile
- [ ] No "merchant issue" error appears

**Diagnostic check in Browser Console:**
```javascript
// Verify lab tests are available
fetch('/api/lab-tests')
  .then(r => r.json())
  .then(d => console.log('Lab tests available:', d.length))
  .catch(e => console.error('API error:', e.message));
```

---

## Troubleshooting

### Issue: "This payment has failed due to an issue with the merchant"

**Diagnosis:**
1. Open Browser DevTools → Network tab
2. Check the `create-order` API call response
3. Look for error code `METHOD_DISABLED`
4. If present: Your selected payment method is disabled on Razorpay merchant account

**Fix:**
1. Go to Razorpay Live Dashboard
2. Navigate to Payment Methods
3. Enable the methods you want to use (UPI, Card, Netbanking, Wallet)
4. Refresh localhost page and retry

### Issue: Razorpay SDK not loading

**Diagnosis:**
- Open Browser DevTools → Console tab
- Check if you see: `Razorpay loaded successfully` or error
- Check Network tab for CDN script load

**Fix:**
1. Verify `.env.local` has `NEXT_PUBLIC_RAZORPAY_KEY_ID` set correctly
2. Check browser console for SDK initialization errors
3. Restart Next.js dev server: `npm run dev`

### Issue: Signature verification fails (400 error)

**Diagnosis:**
- Check server terminal for error logs
- Verify `.env.local` has correct `RAZORPAY_KEY_SECRET`

**Fix:**
1. Confirm `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` match Razorpay account
2. Check no typos in `.env.local`
3. Restart Next.js server to reload env variables
4. Retry payment

---

## Testing with Real Payment Methods

### ⚠️ Important Note on Live Keys

**Live keys require REAL payment methods** - you cannot use test cards.

**Options:**
1. **UPI**: Use your actual UPI ID (recommended for quick testing)
2. **Card**: Use a real debit/credit card (will charge actual amount)
3. **Netbanking**: Use actual bank credentials
4. **Wallet**: Use Razorpay wallet if you have balance

### Safe Testing Strategy

1. **Start with small amounts** (₹1 to ₹10)
2. **Use UPI** (fastest and safest)
3. **Test one flow at a time**
4. **Monitor your Razorpay dashboard** for all transactions

---

## Verification Checklist

After each successful payment:

**Backend Verification:**
```bash
# Check MongoDB for created orders/bookings
# In MongoDB shell or compass:
# View orders: db.orders.findOne({}, {sort: {createdAt: -1}})
# View consultations: db.doctorconsultations.findOne({}, {sort: {createdAt: -1}})
# View lab bookings: db.labtestbookings.findOne({}, {sort: {createdAt: -1}})
```

**API Response Validation:**
- [ ] Response includes `razorpayOrderId`
- [ ] Response includes `razorpayPaymentId`
- [ ] Response includes `paymentStatus: 'completed'`
- [ ] Response includes `paymentGateway: 'razorpay'`

**Frontend Verification:**
- [ ] Success page displays after payment
- [ ] Booking/Order reference number is shown
- [ ] User can view booking in their profile

---

## Next Steps After Localhost Testing

1. ✅ Verify all three flows work without "merchant issue" error
2. ✅ Confirm payment signatures verify correctly
3. ✅ Check database has correct payment metadata
4. → Then: Register webhook in Razorpay dashboard
5. → Then: Deploy to production with proper domain

---

## Quick Command Reference

```bash
# Start dev server
npm run dev

# Check Razorpay connection
node -e "const Razorpay=require('razorpay'); const r=new Razorpay({key_id: 'rzp_live_SUcsurW9fkbXe3', key_secret: 'N5tsZgj4ZFlXxJLnchfsiyO2'}); r.orders.create({amount:100,currency:'INR',receipt:'test_'+Date.now()}).then(o=>{console.log('✓ Connection OK:', o.id);}).catch(e=>{console.log('✗ Error:', e?.error?.description || e?.message);});"

# View .env.local
cat .env.local | grep RAZORPAY
```

---

## Success Criteria

**All three flows tested successfully when:**
- [ ] Cart checkout → Creates order in localStorage → Shows confirmation
- [ ] Doctor consultation → Creates booking in MongoDB → Shows confirmation page
- [ ] Lab test → Creates booking in MongoDB → Shows booking reference
- [ ] All payments have correct signature verification
- [ ] No "merchant issue" errors appear
- [ ] Payment methods restrict to selected option only
- [ ] Currency and amounts are correct (INR)
