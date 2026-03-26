# MySanjeevani API Documentation

## Complete API Reference for Phase 2

### Base URL

```
http://localhost:3000/api
```

---

## Authentication APIs

### 1. User Signup

```
POST /auth/signup
Content-Type: application/json

Body:
{
  "fullName": "John Doe",
  "email": "john@example.com",
  "phone": "9876543210",
  "password": "password123"
}

Response (201):
{
  "message": "User created successfully",
  "user": {
    "id": "user_id",
    "email": "john@example.com",
    "fullName": "John Doe",
    "phone": "9876543210",
    "role": "user",
    "isVerified": false
  },
  "token": "uuid-token"
}
```

### 2. User Login

```
POST /auth/login
Content-Type: application/json

Body:
{
  "email": "john@example.com",
  "password": "password123"
}

Response (200):
{
  "message": "Login successful",
  "user": {
    "id": "user_id",
    "email": "john@example.com",
    "fullName": "John Doe",
    "role": "user",
    "isVerified": true
  },
  "token": "uuid-token"
}
```

---

## Products APIs

### 1. Get Products

```
GET /products?category=allopathy&search=aspirin&healthConcern=Fever&page=1&limit=20

Response (200):
{
  "message": "Products fetched successfully",
  "products": [
    {
      "_id": "product_id",
      "name": "Aspirin 500mg",
      "price": 45,
      "category": "allopathy",
      "brand": "Bayer",
      "rating": 4.5,
      "reviews": 234,
      "healthConcerns": ["Fever", "Pain"],
      "stock": 100,
      "requiresPrescription": false
    }
  ],
  "pagination": {
    "total": 150,
    "page": 1,
    "pages": 8
  }
}
```

### 2. Create Product (Admin)

```
POST /products
Content-Type: application/json

Body:
{
  "name": "Vitamin D 1000IU",
  "price": 150,
  "category": "nutrition",
  "brand": "Nature Made",
  "stock": 200,
  "healthConcerns": ["Immunity", "Bone Health"],
  "dosage": "1000 IU",
  "requiresPrescription": false
}
```

---

## Doctor Consultation APIs

### 1. Get Doctor Consultations

```
GET /doctor-consultation?userId=user_id&status=scheduled

Response (200):
{
  "message": "Consultations fetched successfully",
  "consultations": [
    {
      "_id": "consultation_id",
      "doctorName": "Dr. Rajesh Kumar",
      "specialization": "General Physician",
      "consultationType": "video",
      "status": "scheduled",
      "startTime": "2026-02-04T15:00:00Z",
      "duration": 30,
      "fees": 299
    }
  ],
  "total": 3
}
```

### 2. Schedule Doctor Consultation

```
POST /doctor-consultation
Content-Type: application/json

Body:
{
  "userId": "user_id",
  "doctorName": "Dr. Rajesh Kumar",
  "specialization": "General Physician",
  "consultationType": "video",
  "startTime": "2026-02-04T15:00:00Z",
  "duration": 30,
  "fees": 299
}

Response (201):
{
  "message": "Consultation scheduled successfully",
  "consultation": { ... }
}
```

---

## Lab Tests APIs

### 1. Get Lab Tests

```
GET /lab-tests?category=cardiac&search=heart&page=1&limit=20

Response (200):
{
  "message": "Lab tests fetched successfully",
  "tests": [
    {
      "_id": "test_id",
      "testName": "Full Body Checkup",
      "price": 1499,
      "category": "general",
      "homeCollectionAvailable": true,
      "reportTime": "24 hours",
      "sampleType": "blood",
      "fasting": true,
      "fastingHours": 12,
      "rating": 4.6,
      "reviews": 523
    }
  ],
  "pagination": { ... }
}
```

### 2. Create Lab Test (Admin)

```
POST /lab-tests
Content-Type: application/json

Body:
{
  "testName": "COVID-19 RT-PCR",
  "price": 399,
  "category": "infectious",
  "reportTime": "24 hours",
  "sampleType": "throat-swab",
  "fasting": false,
  "description": "Rapid COVID test"
}
```

---

## Lab Test Booking APIs

### 1. Get Lab Test Bookings

```
GET /orders?userId=user_id

Body: Already implemented in orders API
```

---

## Prescription APIs

### 1. Get Prescriptions

```
GET /prescriptions?userId=user_id&status=active

Response (200):
{
  "message": "Prescriptions fetched successfully",
  "prescriptions": [
    {
      "_id": "prescription_id",
      "userId": "user_id",
      "doctorName": "Dr. Sharma",
      "hospitalName": "City Hospital",
      "issueDate": "2026-02-01T00:00:00Z",
      "expiryDate": "2026-05-01T00:00:00Z",
      "medicines": [
        {
          "name": "Paracetamol",
          "dosage": "500mg",
          "frequency": "Twice daily",
          "duration": "5 days"
        }
      ],
      "status": "active",
      "isVerified": true
    }
  ],
  "total": 2
}
```

### 2. Upload Prescription

```
POST /prescriptions
Content-Type: application/json

Body:
{
  "userId": "user_id",
  "prescriptionFile": "https://cdn.example.com/prescription.pdf",
  "doctorName": "Dr. Sharma",
  "hospitalName": "City Hospital",
  "issueDate": "2026-02-01T00:00:00Z",
  "expiryDate": "2026-05-01T00:00:00Z",
  "medicines": [
    {
      "name": "Paracetamol",
      "dosage": "500mg",
      "frequency": "Twice daily",
      "duration": "5 days"
    }
  ]
}
```

---

## Health Articles APIs

### 1. Get Articles

```
GET /articles?category=wellness&search=diabetes&page=1&limit=10

Response (200):
{
  "message": "Articles fetched successfully",
  "articles": [
    {
      "_id": "article_id",
      "title": "Managing Diabetes: A Complete Guide",
      "slug": "managing-diabetes",
      "content": "Article content here...",
      "summary": "Learn how to manage diabetes effectively",
      "author": "Dr. Smith",
      "category": "disease",
      "tags": ["diabetes", "health", "lifestyle"],
      "viewCount": 1250,
      "likes": 340,
      "readTime": 8
    }
  ],
  "pagination": { ... }
}
```

### 2. Create Article (Admin)

```
POST /articles
Content-Type: application/json

Body:
{
  "title": "10 Tips for Better Sleep",
  "content": "Full article content...",
  "summary": "Improve your sleep quality",
  "author": "Dr. Johnson",
  "category": "wellness",
  "tags": ["sleep", "health", "wellness"],
  "readTime": 6
}
```

---

## Offers/Coupons APIs

### 1. Get Active Offers

```
GET /offers

Response (200):
{
  "message": "Offers fetched successfully",
  "offers": [
    {
      "_id": "offer_id",
      "code": "HEALTH20",
      "description": "Get 20% off on all medicines",
      "discountType": "percentage",
      "discountValue": 20,
      "minCartValue": 500,
      "validFrom": "2026-02-01T00:00:00Z",
      "validUntil": "2026-02-28T23:59:59Z",
      "usageLimit": 1000
    }
  ],
  "total": 5
}
```

### 2. Validate Coupon Code

```
PUT /offers?code=HEALTH20

Response (200):
{
  "message": "Coupon code is valid",
  "offer": {
    "code": "HEALTH20",
    "discountType": "percentage",
    "discountValue": 20,
    "minCartValue": 500
  }
}

Response (400):
{
  "error": "Coupon code has expired"
}
```

### 3. Create Offer (Admin)

```
POST /offers
Content-Type: application/json

Body:
{
  "code": "WELLNESS30",
  "description": "30% off on wellness products",
  "discountType": "percentage",
  "discountValue": 30,
  "minCartValue": 1000,
  "validFrom": "2026-02-01T00:00:00Z",
  "validUntil": "2026-02-28T23:59:59Z",
  "usageLimit": 500
}
```

---

## Wishlist APIs

### 1. Get Wishlist

```
GET /wishlist?userId=user_id

Response (200):
{
  "message": "Wishlist fetched successfully",
  "items": [
    {
      "_id": "wishlist_item_id",
      "productId": "product_id",
      "productName": "Vitamin D",
      "price": 150,
      "image": "image_url"
    }
  ],
  "total": 5
}
```

### 2. Add to Wishlist

```
POST /wishlist
Content-Type: application/json

Body:
{
  "userId": "user_id",
  "productId": "product_id",
  "productName": "Vitamin D",
  "price": 150,
  "image": "image_url"
}
```

### 3. Remove from Wishlist

```
DELETE /wishlist?userId=user_id&productId=product_id
```

---

## Reviews APIs

### 1. Get Product Reviews

```
GET /reviews?productId=product_id

Response (200):
{
  "message": "Reviews fetched successfully",
  "reviews": [
    {
      "_id": "review_id",
      "userId": "user_id",
      "rating": 5,
      "title": "Great product!",
      "comment": "Very effective and fast delivery",
      "userName": "John Doe",
      "helpful": 45,
      "createdAt": "2026-02-01T10:00:00Z"
    }
  ],
  "total": 234,
  "averageRating": "4.6"
}
```

### 2. Post Review

```
POST /reviews
Content-Type: application/json

Body:
{
  "userId": "user_id",
  "productId": "product_id",
  "rating": 5,
  "title": "Excellent medicine",
  "comment": "Works perfectly as described",
  "userName": "John Doe"
}
```

---

## Q&A APIs

### 1. Get Product Questions

```
GET /questions?productId=product_id

Response (200):
{
  "message": "Questions fetched successfully",
  "questions": [
    {
      "_id": "question_id",
      "productId": "product_id",
      "question": "Is this suitable for kids?",
      "userName": "Jane Doe",
      "answers": [
        {
          "answer": "Yes, it's safe for children above 5 years",
          "userName": "Seller",
          "createdAt": "2026-02-01T12:00:00Z"
        }
      ],
      "isAnswered": true
    }
  ],
  "total": 12
}
```

### 2. Ask Question

```
POST /questions
Content-Type: application/json

Body:
{
  "userId": "user_id",
  "productId": "product_id",
  "question": "Is this product FDA approved?",
  "userName": "John Doe"
}
```

---

## Cart APIs

### 1. Get Cart

```
GET /cart?userId=user_id

Response (200):
{
  "message": "Cart fetched successfully",
  "cart": {
    "_id": "cart_id",
    "userId": "user_id",
    "items": [
      {
        "productId": "product_id",
        "productName": "Aspirin",
        "quantity": 2,
        "price": 45,
        "total": 90
      }
    ],
    "totalPrice": 90,
    "totalItems": 2
  }
}
```

### 2. Update Cart

```
POST /cart
Content-Type: application/json

Body:
{
  "userId": "user_id",
  "items": [
    {
      "productId": "product_id",
      "productName": "Aspirin",
      "quantity": 2,
      "price": 45,
      "total": 90
    }
  ],
  "totalPrice": 90,
  "totalItems": 2
}
```

### 3. Clear Cart

```
DELETE /cart?userId=user_id
```

---

## Address APIs

### 1. Get Addresses

```
GET /addresses?userId=user_id

Response (200):
{
  "message": "Addresses fetched successfully",
  "addresses": [
    {
      "_id": "address_id",
      "type": "home",
      "fullName": "John Doe",
      "phone": "9876543210",
      "addressLine1": "123 Main St",
      "city": "Mumbai",
      "state": "Maharashtra",
      "pincode": "400001",
      "isDefault": true
    }
  ],
  "total": 2
}
```

### 2. Add Address

```
POST /addresses
Content-Type: application/json

Body:
{
  "userId": "user_id",
  "type": "home",
  "fullName": "John Doe",
  "phone": "9876543210",
  "addressLine1": "123 Main St",
  "addressLine2": "Apt 4B",
  "city": "Mumbai",
  "state": "Maharashtra",
  "pincode": "400001",
  "isDefault": true
}
```

---

## Orders APIs

### 1. Get Orders

```
GET /orders?userId=user_id

Response (200):
{
  "message": "Orders fetched successfully",
  "orders": [
    {
      "_id": "order_id",
      "userId": "user_id",
      "items": [...],
      "totalPrice": 500,
      "status": "delivered",
      "paymentStatus": "completed",
      "createdAt": "2026-02-01T10:00:00Z"
    }
  ],
  "total": 5
}
```

### 2. Create Order

```
POST /orders
Content-Type: application/json

Body:
{
  "userId": "user_id",
  "items": [
    {
      "productId": "product_id",
      "productName": "Aspirin",
      "quantity": 2,
      "price": 45,
      "total": 90
    }
  ],
  "totalPrice": 90,
  "deliveryAddress": "123 Main St, Mumbai 400001"
}
```

---

## Notification APIs

### 1. Get Notifications

```
GET /notifications?userId=user_id&isRead=false

Response (200):
{
  "message": "Notifications fetched successfully",
  "notifications": [
    {
      "_id": "notification_id",
      "userId": "user_id",
      "type": "delivery",
      "title": "Order Delivered",
      "message": "Your order has been delivered",
      "isRead": false,
      "createdAt": "2026-02-04T10:00:00Z"
    }
  ],
  "unreadCount": 3,
  "total": 10
}
```

### 2. Create Notification (Admin)

```
POST /notifications
Content-Type: application/json

Body:
{
  "userId": "user_id",
  "type": "promotion",
  "title": "Special Offer",
  "message": "Get 20% off on all medicines",
  "actionUrl": "/medicines?offer=HEALTH20"
}
```

### 3. Mark as Read

```
PATCH /notifications?id=notification_id
```

---

## Health Concerns APIs

### 1. Get Health Concerns

```
GET /health-concerns?search=diabetes&page=1&limit=20

Response (200):
{
  "message": "Health concerns fetched successfully",
  "concerns": [
    {
      "_id": "concern_id",
      "name": "Diabetes",
      "description": "Chronic disease affecting blood sugar",
      "symptoms": ["Excessive thirst", "Fatigue", "Blurred vision"],
      "preventionTips": ["Regular exercise", "Balanced diet", "Weight management"],
      "suggestedProducts": [...],
      "suggestedTests": [...],
      "relatedArticles": [...]
    }
  ],
  "pagination": { ... }
}
```

### 2. Create Health Concern (Admin)

```
POST /health-concerns
Content-Type: application/json

Body:
{
  "name": "Hypertension",
  "description": "High blood pressure condition",
  "symptoms": ["Headaches", "Chest pain", "Shortness of breath"],
  "preventionTips": ["Reduce salt intake", "Regular exercise", "Stress management"]
}
```

---

## User Profile APIs

### 1. Get User Profile

```
GET /user/profile?id=user_id

Response (200):
{
  "message": "User profile fetched successfully",
  "user": {
    "id": "user_id",
    "fullName": "John Doe",
    "email": "john@example.com",
    "phone": "9876543210",
    "role": "user",
    "isVerified": true,
    "createdAt": "2026-02-01T00:00:00Z"
  }
}
```

---

## Testing the APIs

You can use Postman, Thunder Client, or any REST client to test these APIs. All endpoints return JSON responses with proper HTTP status codes:

- **200**: Success
- **201**: Created
- **400**: Bad Request
- **401**: Unauthorized
- **404**: Not Found
- **500**: Server Error

---

## MongoDB Collections Created

- `users` - User accounts
- `products` - Medicine and health product catalog
- `doctorconsultations` - Doctor consultation bookings
- `labtests` - Lab test definitions
- `labtestbookings` - Lab test bookings
- `prescriptions` - User prescriptions
- `healtharticles` - Health blog articles
- `offers` - Discount coupons and offers
- `notifications` - User notifications
- `healthconcerns` - Health condition information
- `carts` - Shopping cart data
- `orders` - Order history
- `addresses` - User delivery addresses
- `wishlist` - Saved products
- `reviews` - Product reviews
- `questions` - Product Q&A

---

**All APIs are fully integrated with MongoDB and ready for Phase 2 development!**
