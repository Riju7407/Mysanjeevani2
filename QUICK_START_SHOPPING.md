# 🚀 Quick Start Guide - Shopping & Payment System

## ⚡ Test the Complete Cart & Payment System

### **1. Start Your App**

```bash
npm run dev
```

Visit: http://localhost:3000

---

### **2. Complete Shopping Journey (2 minutes)**

#### **Step A: Create Account**

- Click "Sign Up"
- Fill: Name, Email, Password
- Click "Sign Up"

#### **Step B: Browse & Add Medicines**

- Click "Medicines" in header
- Browse available products (Aspirin, Cough Syrup, etc.)
- Click "Add to Cart" on any medicine
- **Notice:** Red badge appears in header showing cart count
- Add more items - quantity auto-increments if same product

#### **Step C: View Shopping Cart**

- Click "Cart" in header (with red badge)
- See all items with:
  - Product name and brand
  - Price per item
  - Quantity controls (+/-)
  - Remove option
  - **Order Summary** showing:
    - Subtotal
    - 10% automatic discount
    - After discount price
    - Delivery charge (FREE if >₹299)
    - **Total Amount**

#### **Step D: Checkout & Pay**

- Click "💳 Buy Now" button
- **Payment Method Selection Modal** appears
- Choose one of 6 payment options:
  1. 💳 **Credit/Debit Card** (Visa, Mastercard, Amex)
  2. 🏦 **Net Banking** (All Indian Banks)
  3. 📱 **UPI** (Google Pay, PhonePe, Paytm)
  4. 💰 **Digital Wallets** (Paytm, Amazon Pay, Airtel Money)
  5. 📅 **Buy Now Pay Later** (Razorpay, Simpl, LazyPay)
  6. 🚚 **Cash on Delivery** (Pay on delivery)
- Select a payment method
- Click "Pay Now"
- Order is created and saved!

#### **Step E: View Orders**

- Automatically redirected to `/orders` page
- See your order with:
  - Order ID
  - Order date & time
  - Status badge (Confirmed)
  - Total amount
  - Number of items
  - Click to expand and see:
    - All items with quantities
    - Price breakdown
    - Payment method used
    - Expected delivery date

---

## 📊 Data Stored

### **In Browser (localStorage):**

- `cart` - Items currently in cart
- `user` - Logged-in user info
- `orders` - All orders created

### **Cart Item Structure:**

```json
{
  "id": 1,
  "name": "Aspirin 500mg",
  "price": 45,
  "quantity": 2,
  "brand": "Bayer",
  "image": "💊"
}
```

### **Order Structure:**

```json
{
  "id": "abc123xyz",
  "userId": "user-id",
  "items": [...],
  "totalAmount": 450.50,
  "paymentMethod": "card",
  "status": "confirmed",
  "createdAt": "2026-02-04T10:30:00Z"
}
```

---

## ✨ Features Included

### **Cart Page**

- ✅ Add/remove items
- ✅ Update quantities
- ✅ Real-time total calculation
- ✅ 10% automatic discount
- ✅ Free delivery indicator
- ✅ "Continue Shopping" link
- ✅ Mobile responsive

### **Payment Modal**

- ✅ 6 payment methods
- ✅ Select with radio buttons
- ✅ Clear amount display
- ✅ Processing state
- ✅ Beautiful icons and descriptions

### **Orders Page**

- ✅ All past orders listed
- ✅ Click to expand details
- ✅ Status badges (color-coded)
- ✅ Itemized breakdown
- ✅ Payment method displayed
- ✅ Delivery info
- ✅ Support contact options

### **Header Updates**

- ✅ Cart icon with count badge
- ✅ Real-time badge updates
- ✅ Links to cart and orders

---

## 🎯 Key Metrics

| Metric              | Value        |
| ------------------- | ------------ |
| Payment Methods     | 6            |
| Cart Pages          | 1            |
| Orders Pages        | 1            |
| Automatic Discount  | 10%          |
| Free Delivery       | Orders >₹299 |
| Mobile Responsive   | ✅ YES       |
| Data Persistence    | localStorage |
| User Authentication | Required     |

---

## 💡 Testing Scenarios

### **Scenario 1: Single Item Purchase**

1. Add Aspirin to cart
2. Go to cart
3. Click "Buy Now"
4. Select "UPI" payment
5. Confirm payment
6. View order in orders page

### **Scenario 2: Multiple Items**

1. Add 3 different medicines
2. View cart
3. Increase quantity of one item
4. Remove one item
5. Notice discount and total update
6. Checkout with "Card" payment
7. Order appears in orders page

### **Scenario 3: Free Delivery Check**

1. Add items totaling >₹299 after discount
2. See "FREE" delivery badge
3. Add small item to go below ₹299
4. See ₹49 delivery charge appear
5. Remove item to go above ₹299 again
6. Delivery becomes FREE

### **Scenario 4: Cart Persistence**

1. Add items to cart
2. Refresh page (F5)
3. Cart still has items (localStorage saved)
4. Navigate away and back
5. Cart still persisted

---

## 🔄 Complete User Flow

```
Home Page
    ↓
Browse Medicines (/medicines)
    ↓ Add to Cart
Shopping Cart (/cart)
    ↓ Update quantities
Order Summary (visible on cart page)
    ↓ Click "Buy Now"
Payment Modal (select method)
    ↓ Click "Pay Now"
Order Created
    ↓
Orders Page (/orders) - Auto redirect
    ↓ View order details
Track Order
    ↓
Contact Support if needed
```

---

## 🛠️ Customization Tips

### **Change Discount Percentage**

Edit in `/src/app/cart/page.tsx`:

```typescript
const discount = Math.floor(totalPrice * 0.1); // Change 0.10 to desired %
```

### **Change Delivery Threshold**

Edit in `/src/app/cart/page.tsx`:

```typescript
const deliveryCharge = finalPrice > 299 ? 0 : 49; // Change 299 to threshold
```

### **Change Delivery Fee**

Edit in `/src/app/cart/page.tsx`:

```typescript
const deliveryCharge = finalPrice > 299 ? 0 : 49; // Change 49 to fee amount
```

### **Add More Payment Methods**

Edit payment modal in `/src/app/cart/page.tsx` - add more radio button options

---

## 📝 Files Modified

| File                          | Changes                    |
| ----------------------------- | -------------------------- |
| `/src/app/cart/page.tsx`      | NEW - Complete cart system |
| `/src/app/orders/page.tsx`    | NEW - Order management     |
| `/src/app/medicines/page.tsx` | Updated addToCart function |
| `/src/components/Header.tsx`  | Added cart count badge     |

---

## 🎉 You're All Set!

Everything is working and ready to use. The cart persists data, payment modal works beautifully, and orders are saved with all details.

**For Phase 3, integrate:**

- Razorpay API for real payments
- Backend API for order storage
- Email notifications
- SMS tracking updates

**Happy Shopping! 🛍️**
