# Mobile OTP Login Implementation - MySanjeevani

## 🎯 Complete Real-Life Fast2SMS Integration

This document provides a complete guide to the production-grade Mobile OTP authentication system using Fast2SMS for MySanjeevani.

---

## 📋 Table of Contents

1. [Quick Start](#quick-start)
2. [System Architecture](#system-architecture)
3. [API Documentation](#api-documentation)
4. [Frontend Implementation](#frontend-implementation)
5. [Database Schema](#database-schema)
6. [Environment Configuration](#environment-configuration)
7. [Fast2SMS Integration](#fast2sms-integration)
8. [Testing Guide](#testing-guide)
9. [Troubleshooting](#troubleshooting)
10. [Best Practices](#best-practices)

---

## 🚀 Quick Start

### 1. Setup Environment Variables

Update `.env.local` with Fast2SMS and JWT credentials:

```env
# Fast2SMS Configuration
FAST2SMS_API_KEY="Your_API_Key_From_Fast2SMS"
OTP_TEST_MODE="false"           # Set to "true" for development
OTP_TTL_SECONDS="300"           # OTP validity in seconds (5 minutes)
OTP_RESEND_COOLDOWN_SECONDS="60" # Minimum wait between OTP requests
OTP_HASH_SECRET="your_random_secret_string"

# JWT Configuration for Session Management
JWT_SECRET="your_jwt_secret_key"
JWT_REFRESH_SECRET="your_jwt_refresh_secret_key"
JWT_EXPIRY="24h"
JWT_REFRESH_EXPIRY="30d"
```

### 2. Get Fast2SMS API Key

1. Visit [Fast2SMS Dashboard](https://www.fast2sms.com/dashboard/dev-api)
2. Sign up or login
3. Copy your **Authorization Key** from the Dev API section
4. Add it to `.env.local`

### 3. Test OTP in Development

Use **Test Mode** for development:

```env
OTP_TEST_MODE="true"
```

In test mode:

- OTPs are NOT actually sent to phones
- All OTP requests return success
- Debug OTP code `123456` is returned in API response

---

## 🏗️ System Architecture

### Authentication Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     SIGNUP/LOGIN FLOW                           │
└─────────────────────────────────────────────────────────────────┘

SIGNUP FLOW:
1. User enters phone & name
         ↓
2. POST /api/auth/phone/signup
         ↓
3. Validate & Check Duplicate
         ↓
4. Generate 6-digit OTP
         ↓
5. Send via Fast2SMS
         ↓
6. Store hashed OTP in DB with expiry
         ↓
7. Return to user for verification
         ↓
8. User enters OTP
         ↓
9. POST /api/auth/phone/register-confirm
         ↓
10. Verify OTP hash
         ↓
11. Create new user account
         ↓
12. Generate JWT tokens
         ↓
13. Return auth tokens + user data

LOGIN FLOW:
1. User enters phone
         ↓
2. POST /api/auth/phone/send-otp
         ↓
3. Find existing user
         ↓
4. Generate & send OTP
         ↓
5. User enters OTP
         ↓
6. POST /api/auth/phone/verify-otp
         ↓
7. Verify OTP
         ↓
8. Generate JWT tokens
         ↓
9. Return auth tokens + user data
```

### Component Structure

```
Frontend:
├── PhoneSignup.tsx          # Signup UI component
├── PhoneLogin.tsx           # Login UI component
└── usePhoneAuth.ts          # Signup/Login hook
    ├── usePhoneAuth()       # Full signup flow
    └── usePhoneLogin()      # Login only flow

Backend:
├── /api/auth/phone/
│   ├── signup/route.ts      # Step 1: Phone + Name
│   ├── register-confirm/route.ts  # Step 2: OTP verification
│   ├── send-otp/route.ts    # Get OTP for login
│   └── verify-otp/route.ts  # Verify login OTP
├── lib/
│   ├── fast2sms.ts          # Fast2SMS API client
│   ├── jwtUtils.ts          # JWT token generation
│   ├── phoneAuthUtils.ts    # Phone normalization
│   └── models/PhoneOtp.ts   # OTP schema
```

---

## 📡 API Documentation

### 1. Send Signup OTP

**Endpoint:** `POST /api/auth/phone/signup`

**Request:**

```json
{
  "phone": "9876543210",
  "fullName": "John Doe",
  "email": "john@example.com",
  "role": "user"
}
```

**Response (200):**

```json
{
  "message": "OTP sent successfully. Please verify to complete signup.",
  "phone": "9876543210",
  "cooldownSeconds": 60,
  "expiresIn": 300,
  "otp_code": "123456" // Only in test mode
}
```

**Error Responses:**

- `400` - Invalid phone/name format
- `409` - Phone already registered
- `429` - Rate limit exceeded
- `500` - Fast2SMS API error

---

### 2. Verify Signup & Create Account

**Endpoint:** `POST /api/auth/phone/register-confirm`

**Request:**

```json
{
  "phone": "9876543210",
  "otp": "123456",
  "fullName": "John Doe",
  "email": "john@example.com",
  "role": "user"
}
```

**Response (201):**

```json
{
  "message": "Account created successfully. You can now login.",
  "user": {
    "id": "user_id",
    "phone": "9876543210",
    "email": "john@example.com",
    "fullName": "John Doe",
    "role": "user",
    "isVerified": true
  },
  "sessionToken": "uuid",
  "requiresApproval": false
}
```

**Special Cases:**

- **Vendor:** `requiresApproval: true` (Admin must verify vendor)
- **Doctor:** `requiresApproval: true` (Admin must approve doctor)

---

### 3. Send Login OTP

**Endpoint:** `POST /api/auth/phone/send-otp`

**Request:**

```json
{
  "phone": "9876543210",
  "role": "user"
}
```

**Response (200):**

```json
{
  "message": "OTP sent successfully",
  "phone": "9876543210",
  "cooldownSeconds": 60,
  "expiresIn": 300,
  "otp_code": "123456" // Only in test mode
}
```

---

### 4. Verify Login OTP

**Endpoint:** `POST /api/auth/phone/verify-otp`

**Request:**

```json
{
  "phone": "9876543210",
  "otp": "123456",
  "role": "user"
}
```

**Response (200):**

```json
{
  "message": "Login successful",
  "user": {
    "id": "user_id",
    "email": "john@example.com",
    "fullName": "John Doe",
    "phone": "9876543210",
    "role": "user",
    "isVerified": true
  },
  "token": "uuid"
}
```

---

## 💻 Frontend Implementation

### Using Signup Component

```tsx
import { PhoneSignup } from "@/components/PhoneSignup";
import { useRouter } from "next/navigation";

export function SignupPage() {
  const router = useRouter();

  const handleSuccess = (data) => {
    console.log("Signup successful:", data);

    if (data.requiresApproval) {
      // Show pending approval message
      router.push("/approval-pending");
    } else {
      // Auto-login or redirect to dashboard
      router.push("/dashboard");
    }
  };

  return (
    <PhoneSignup
      role="user"
      onSuccess={handleSuccess}
      onSwitchToLogin={() => router.push("/login")}
    />
  );
}
```

### Using Login Component

```tsx
import { PhoneLogin } from "@/components/PhoneLogin";
import { useRouter } from "next/navigation";

export function LoginPage() {
  const router = useRouter();

  const handleSuccess = (data) => {
    // Store token
    localStorage.setItem("auth_token", data.token);

    // Redirect to dashboard
    router.push("/dashboard");
  };

  return (
    <PhoneLogin
      role="user"
      onSuccess={handleSuccess}
      onSwitchToSignup={() => router.push("/signup")}
    />
  );
}
```

### Using Hook Directly

```tsx
import { usePhoneAuth } from "@/lib/hooks/usePhoneAuth";

export function CustomSignup() {
  const {
    phone,
    fullName,
    email,
    otpStep,
    error,
    isLoading,
    cooldownSeconds,
    debugOtp,
    sendOtp,
    verifyOtp,
    resendOtp,
  } = usePhoneAuth("user");

  if (otpStep === "info") {
    return (
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          await sendOtp();
        }}
      >
        <input
          value={phone}
          onChange={(e) => handlePhoneChange(e.target.value)}
          placeholder="Phone number"
        />
        <input
          value={fullName}
          onChange={(e) => handleNameChange(e.target.value)}
          placeholder="Full name"
        />
        <button type="submit">Send OTP</button>
      </form>
    );
  }

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        await verifyOtp(otp);
      }}
    >
      <input placeholder="6-digit OTP" maxLength={6} />
      <button type="submit">Verify</button>
      <button onClick={resendOtp} disabled={cooldownSeconds > 0}>
        Resend ({cooldownSeconds}s)
      </button>
    </form>
  );
}
```

---

## 🗄️ Database Schema

### PhoneOtp Collection

```mongodb
{
  _id: ObjectId,
  phone: "9876543210",           // Normalized phone number
  role: "user",                  // user | vendor | doctor
  otpHash: "sha256_hash",        // Hashed OTP for security
  expiresAt: ISODate,            // OTP expiration time
  consumed: false,               // Mark as used after verification
  createdAt: ISODate,            // Created timestamp
  updatedAt: ISODate,            // Updated timestamp
  __v: 0
}
```

**Indexes:**

- `{ phone: 1, role: 1 }` - Find OTPs by phone & role
- `{ expiresAt: 1 }` - Auto-delete expired OTPs (TTL index)
- `{ consumed: 1 }` - Quick lookup of unconsumed OTPs

### User Model (Updated Fields)

```mongodb
{
  fullName: String,
  phone: String,                 // Phone number
  email: String,
  isPhoneVerified: Boolean,      // True if phone OTP was verified
  role: String,                  // user | vendor | doctor
  isVerified: Boolean,           // Overall verification status
  createdAt: ISODate,
  ...otherFields
}
```

---

## ⚙️ Environment Configuration

### Required Variables

```env
# Fast2SMS
FAST2SMS_API_KEY=your_api_key_here
OTP_TEST_MODE=false
OTP_TTL_SECONDS=300
OTP_RESEND_COOLDOWN_SECONDS=60
OTP_HASH_SECRET=your_random_secret

# JWT
JWT_SECRET=your_jwt_secret_32_bytes
JWT_REFRESH_SECRET=your_refresh_secret_32_bytes
JWT_EXPIRY=24h
JWT_REFRESH_EXPIRY=30d

# Database
MONGODB_URI=your_mongodb_uri

# Firebase (for other features)
FIREBASE_PROJECT_ID=your_project_id
```

### Generate Secure Secrets

```bash
# Generate JWT secrets (32 bytes hex)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Generate OTP hash secret
node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"
```

---

## 🔌 Fast2SMS Integration

### Sending OTP Functions

```typescript
// Send OTP via SMS (Quick SMS route - cheapest)
import { sendOtpViaFast2Sms } from "@/lib/fast2sms";

const result = await sendOtpViaFast2Sms(
  "9876543210", // Phone number
  "123456", // OTP code
  "login", // Purpose: 'login' | 'signup' | 'reset'
);

console.log(result); // { success: true, message: '...', requestId: '...' }
```

### Alternative: WhatsApp OTP

```typescript
import { sendOtpViaWhatsApp } from "@/lib/fast2sms";

const result = await sendOtpViaWhatsApp("9876543210", "123456", "signup");
```

### Check Wallet Balance

```typescript
import { getFast2SmsBalance } from "@/lib/fast2sms";

const balance = await getFast2SmsBalance();
console.log(`Available SMS credits: ${balance}`);
```

### API Request Format

```http
POST https://www.fast2sms.com/dev/bulkV2
Authorization: YOUR_API_KEY
Content-Type: application/json

{
  "route": "q",
  "language": "english",
  "flash": 0,
  "numbers": "9876543210",
  "message": "Your MySanjeevani OTP is 123456. It expires in 5 minutes."
}
```

### Response Format

```json
{
  "return": true,
  "status_code": 200,
  "message": ["SMS sent successfully"],
  "request_id": "unique_id"
}
```

---

## 🧪 Testing Guide

### Development Testing (Test Mode)

```env
OTP_TEST_MODE=true
```

**In test mode:**

- No actual SMS is sent
- OTP `123456` is always returned
- Phone number required: at least 10 digits
- All API validations still work

**Test Phone Numbers:**

- `9876543210`
- `8765432109`
- `+919876543210` (with country code)

### API Testing Examples

#### cURL - Send Signup OTP

```bash
curl -X POST http://localhost:3000/api/auth/phone/signup \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "9876543210",
    "fullName": "John Doe",
    "email": "john@example.com",
    "role": "user"
  }'
```

#### cURL - Verify Signup

```bash
curl -X POST http://localhost:3000/api/auth/phone/register-confirm \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "9876543210",
    "otp": "123456",
    "fullName": "John Doe",
    "email": "john@example.com",
    "role": "user"
  }'
```

#### cURL - Send Login OTP

```bash
curl -X POST http://localhost:3000/api/auth/phone/send-otp \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "9876543210",
    "role": "user"
  }'
```

#### cURL - Verify Login

```bash
curl -X POST http://localhost:3000/api/auth/phone/verify-otp \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "9876543210",
    "otp": "123456",
    "role": "user"
  }'
```

### JavaScript Testing

```javascript
// Test Signup
async function testSignup() {
  const response = await fetch("/api/auth/phone/signup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      phone: "9876543210",
      fullName: "Test User",
      email: "test@example.com",
      role: "user",
    }),
  });

  const data = await response.json();
  console.log("OTP Test:", data.otp_code); // 123456 in test mode

  // Verify with OTP
  const verifyResponse = await fetch("/api/auth/phone/register-confirm", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      phone: "9876543210",
      otp: data.otp_code,
      fullName: "Test User",
      role: "user",
    }),
  });

  const result = await verifyResponse.json();
  console.log("Signup Result:", result);
}

testSignup();
```

---

## 🐛 Troubleshooting

### Issue: OTP Not Received

**Causes:**

- Fast2SMS API key is invalid
- Phone number format is wrong
- SMS route is blocked in your region
- Account SMS balance is low

**Solutions:**

```env
# 1. Verify API key
FAST2SMS_API_KEY="Check from https://www.fast2sms.com/dashboard/dev-api"

# 2. Use test mode to verify setup
OTP_TEST_MODE=true

# 3. Check wallet balance
curl "https://www.fast2sms.com/dev/wallet?authorization=YOUR_KEY"

# 4. Use WhatsApp route as fallback
sendOtpViaWhatsApp(...) // Instead of sendOtpViaFast2Sms(...)
```

### Issue: "Invalid OTP" Error

**Causes:**

- OTP expired (default 5 minutes)
- Wrong OTP entered
- OTP already used
- Phone number mismatch

**Solutions:**

```typescript
// 1. Check OTP expiry time
const otpRecord = await PhoneOtp.findOne({...});
console.log('Expires at:', otpRecord.expiresAt);
console.log('Expired?', new Date() > otpRecord.expiresAt);

// 2. Extend OTP TTL if needed
OTP_TTL_SECONDS=600  // 10 minutes instead of 5
```

### Issue: Rate Limiting

**Error Message:**

```
Too many OTP requests from this IP. Try again in Xs.
```

**Solutions:**

```env
# Increase limits temporarily in development
# Or adjust cooldown:
OTP_RESEND_COOLDOWN_SECONDS=30  # Wait 30s between requests

# Create new IP/phone in test mode
# Or wait for rate limit to reset
```

### Issue: "FAST2SMS_API_KEY is not configured"

**Solutions:**

```env
# 1. Check .env.local has the key
cat .env.local | grep FAST2SMS_API_KEY

# 2. Restart development server after changing .env
npm run dev  # Kill and restart

# 3. Make sure it's quoted properly
FAST2SMS_API_KEY="your_key_here"  # Correct
FAST2SMS_API_KEY=your_key_here    # Also works
```

---

## ✨ Best Practices

### Security

1. **Never expose API keys in frontend**

   ```typescript
   // ✅ CORRECT - Server side only
   const apiKey = process.env.FAST2SMS_API_KEY;

   // ❌ WRONG - Would expose in client bundle
   const apiKey = process.env.NEXT_PUBLIC_FAST2SMS_API_KEY;
   ```

2. **Hash OTP before storing**

   ```typescript
   const otpHash = crypto
     .createHash("sha256")
     .update(`${phone}:${otp}:${secret}`)
     .digest("hex");
   ```

3. **Rate limit OTP requests**
   - Per IP: Max 20 requests per 15 minutes
   - Per phone: Max 5 requests per 15 minutes
   - Resend cooldown: Min 60 seconds

4. **Set appropriate OTP expiry**

   ```env
   OTP_TTL_SECONDS=300  # 5 minutes (default)
   OTP_TTL_SECONDS=600  # 10 minutes (for testing)
   ```

5. **Mark OTP as consumed after use**
   ```typescript
   otpRecord.consumed = true;
   await otpRecord.save();
   ```

### Performance

1. **Cache Fast2SMS wallet balance**

   ```typescript
   // Check balance every 24 hours instead of per request
   const balance = await getFast2SmsBalance();
   redis.setex("fast2sms:balance", 86400, balance);
   ```

2. **Use connection pooling**

   ```typescript
   // MongoDB connection is already pooled
   // Don't create new connections per request
   ```

3. **Implement request deduplication**
   ```typescript
   // Prevent duplicate OTP requests within 1 minute
   const recentOtp = await PhoneOtp.findOne({
     phone,
     createdAt: { $gt: now - 60000 },
   });
   ```

### Monitoring

1. **Log all OTP activities**

   ```typescript
   console.log("[OTP] Sent to:", phone);
   console.log("[OTP] Verified successfully");
   console.log("[OTP] Failed validation");
   ```

2. **Monitor Fast2SMS failures**

   ```typescript
   if (!data?.return) {
     console.error("[Fast2SMS] Failed:", data);
     // Alert admin if error rate is high
   }
   ```

3. **Track signup conversion rate**
   ```typescript
   // Monitor: OTP sent → OTP verified → Account created
   ```

### User Experience

1. **Clear error messages**
   - ❌ "Error"
   - ✅ "Invalid or expired OTP. Please request a new one."

2. **Visual countdown for cooldown**

   ```tsx
   <button disabled={cooldownSeconds > 0}>Resend ({cooldownSeconds}s)</button>
   ```

3. **Auto-focus OTP input after send**

   ```tsx
   <input autoFocus maxLength={6} />
   ```

4. **Allow pasting OTP**
   ```tsx
   <input value={otp} onChange={(e) => setOtp(e.target.value.slice(0, 6))} />
   ```

---

## 📞 Support & Resources

- **Fast2SMS Documentation:** https://docs.fast2sms.com/
- **Get API Key:** https://www.fast2sms.com/dashboard/dev-api
- **Check Wallet:** https://www.fast2sms.com/dashboard/
- **Rate Limits:** OTP - 5/15min, Login - 40/15min
- **Support Email:** support@fast2sms.com

---

## 🎓 Example: Complete Signup Flow

```tsx
// pages/signup.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PhoneSignup } from "@/components/PhoneSignup";

export default function SignupPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSignupSuccess = async (data) => {
    setLoading(true);

    // Store auth token
    localStorage.setItem("auth_token", data.sessionToken);
    localStorage.setItem("user_id", data.user.id);
    localStorage.setItem("user_role", data.user.role);

    // Redirect based on role
    if (data.requiresApproval) {
      await router.push("/approval-pending");
    } else if (data.user.role === "vendor") {
      await router.push("/vendor/setup");
    } else if (data.user.role === "doctor") {
      await router.push("/doctor/setup");
    } else {
      await router.push("/dashboard");
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <PhoneSignup
          role="user"
          onSuccess={handleSignupSuccess}
          onSwitchToLogin={() => router.push("/login")}
        />
      </div>
    </div>
  );
}
```

---

## 📝 Summary

Your MySanjeevani platform now has:

✅ **Production-Grade Fast2SMS Integration**

- Proper API key management
- Full error handling and retry logic
- Test mode for development

✅ **Complete OTP Flow**

- Signup with phone verification
- Login with OTP
- Support for user/vendor/doctor roles

✅ **JWT Session Management**

- Access tokens (24h expiry)
- Refresh tokens (30d expiry)
- Secure token validation

✅ **Rate Limiting**

- Per-IP limits
- Per-phone limits
- Cooldown between requests

✅ **React Components**

- PhoneSignup - Full signup UI
- PhoneLogin - Full login UI
- usePhoneAuth - Custom hook for signup
- usePhoneLogin - Custom hook for login

✅ **Comprehensive Documentation**

- API reference
- Frontend examples
- Testing guide
- Troubleshooting
- Best practices

**Ready for production deployment!**
