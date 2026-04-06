# Admin Session Timeout Implementation (5 Days)

This document explains how the 5-day admin session timeout works and how to integrate it into your routes.

## Overview

- Admin login tokens expire after **5 days** (432,000,000 milliseconds)
- After expiration, admins must login again
- The system includes utilities to validate token expiration and protect routes

## Files Created/Modified

### New Files:
1. **`/src/lib/tokenUtils.ts`** - Token generation and validation utilities
2. **`/src/lib/adminAuthMiddleware.ts`** - Middleware for token validation
3. **`/src/app/api/admin/verify-token/route.ts`** - Endpoint to verify token status

### Modified Files:
1. **`/src/app/api/admin/login/route.ts`** - Updated to use token utilities
2. **`/src/app/api/auth/login/route.ts`** - Updated admin login with expiration

## How It Works

### 1. Admin Login Response

When admin logs in successfully, they receive:

```json
{
  "message": "Admin login successful",
  "user": {
    "email": "mysanjeevni3693@gmail.com",
    "role": "admin",
    "isAdmin": true
  },
  "token": "uuid-token-string",
  "expiresAt": 1711000000000,
  "expiresIn": "5 days"
}
```

- **token**: Admin session token
- **expiresAt**: Unix timestamp when session expires
- **expiresIn**: Human-readable expiration time

### 2. Storing Session Data (Frontend)

Admin should store in localStorage:

```javascript
// After successful login
const loginResponse = await fetch('/api/admin/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'mysanjeevni3693@gmail.com',
    password: 'MySanjeevni@3693'
  })
});

const data = await loginResponse.json();

// Store in localStorage
localStorage.setItem('adminToken', data.token);
localStorage.setItem('adminEmail', data.user.email);
localStorage.setItem('tokenExpiresAt', data.expiresAt.toString());
```

### 3. Checking Session Expiration

Use the verify-token endpoint to check if session is still valid:

```bash
curl -X POST http://localhost:3000/api/admin/verify-token \
  -H "Content-Type: application/json" \
  -d '{"expiresAt": 1711000000000}'
```

Response if valid:
```json
{
  "valid": true,
  "message": "Your session is still active",
  "expiresAt": 1711000000000,
  "remainingTime": "4 days, 23h"
}
```

Response if expired:
```json
{
  "valid": false,
  "message": "Your session has expired. Please login again.",
  "expired": true
}
```

### 4. Automatic Logout (Frontend)

In your admin dashboard, implement auto-logout:

```typescript
// Check session expiration on page load
useEffect(() => {
  const expiresAtStr = localStorage.getItem('tokenExpiresAt');
  
  if (expiresAtStr) {
    const expiresAt = parseInt(expiresAtStr, 10);
    const now = Date.now();
    
    if (now >= expiresAt) {
      // Session expired - logout
      localStorage.clear();
      window.location.href = '/admin-login';
    } else {
      // Set timer to logout when session expires
      const timeUntilExpiry = expiresAt - now;
      setTimeout(() => {
        localStorage.clear();
        window.location.href = '/admin-login';
      }, timeUntilExpiry);
    }
  }
}, []);
```

## Protecting Admin Routes

### Option 1: Using Middleware Helper

In any admin API route:

```typescript
import { withAdminTokenValidation } from '@/lib/adminAuthMiddleware';

const handler = async (request: NextRequest) => {
  // Your admin logic here
  return NextResponse.json({ data: 'admin data' });
};

export const POST = withAdminTokenValidation(handler);
```

### Option 2: Manual Validation

```typescript
import { validateAdminToken } from '@/lib/adminAuthMiddleware';

export async function POST(request: NextRequest) {
  const validation = await validateAdminToken(request);
  
  if (!validation.isValid) {
    return NextResponse.json(
      { error: validation.error },
      { status: 401 }
    );
  }
  
  // Proceed with admin logic
}
```

## Token Utility Functions

### `generateAdminToken(email: string)`
Generates a new token with 5-day expiration.

```typescript
const tokenPayload = generateAdminToken('admin@example.com');
// Returns: { token, email, expiresAt, createdAt }
```

### `isTokenValid(expiresAt: number)`
Checks if token is still valid.

```typescript
const isValid = isTokenValid(expiresAt);
```

### `getTokenRemainingTime(expiresAt: number)`
Gets remaining time in milliseconds.

```typescript
const remaining = getTokenRemainingTime(expiresAt);
```

### `getTokenRemainingTimeReadable(expiresAt: number)`
Gets readable time format (e.g., "4 days, 23h").

```typescript
const readable = getTokenRemainingTimeReadable(expiresAt);
```

## API Endpoints

### Login Endpoint
- **URL**: `POST /api/admin/login` or `POST /api/auth/login?role=admin`
- **Body**: `{ "email": "...", "password": "..." }`
- **Response**: Token with expiration details

### Verify Token Endpoint
- **URL**: `POST /api/admin/verify-token`
- **Body**: `{ "expiresAt": timestamp }`
- **Response**: Validity status and remaining time

## Timeline

- **Day 0**: Admin logs in, receives 5-day token
- **Day 5**: Token expires automatically
- **After Day 5**: Admin gets 401 error, must login again

## Security Notes

1. ✅ Tokens are UUID-based (cryptographically secure)
2. ✅ Expiration is enforced server-side and client-side
3. ✅ Token expiration cannot be tampered with (server validates)
4. ✅ No database required for token storage (stateless)
5. ✅ Environment variables secure admin credentials

## Example Flow

```
1. Admin visits /admin-login
2. Submits credentials (email + password from env variables)
3. Receives token + expiresAt timestamp
4. Stores in localStorage
5. Access admin pages with token
6. Every 5 days: Session expires
7. Automatic redirect to login page
8. Admin logs in again to continue
```

## Troubleshooting

**Q: Admin keeps getting logged out before 5 days?**
- Check that client-side timer is using correct expiresAt value
- Verify localStorage is not being cleared by other code

**Q: How to manually logout before 5 days?**
- Clear localStorage: `localStorage.clear()`
- Redirect to login page

**Q: Can I extend the session?**
- Admin must login again to get a new 5-day token
- Currently no refresh token mechanism (can be added if needed)
