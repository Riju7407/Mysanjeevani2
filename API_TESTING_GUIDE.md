# MySanjeevani API Testing Guide

## Base URL

```
http://localhost:3000/api
```

---

## 1. SIGNUP API

### Endpoint

```
POST /auth/signup
```

### Request Headers

```
Content-Type: application/json
```

### Request Body

```json
{
  "fullName": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "phone": "9876543210"
}
```

### cURL Command

```bash
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "John Doe",
    "email": "john@example.com",
    "password": "password123",
    "phone": "9876543210"
  }'
```

### PowerShell Command

```powershell
$body = @{
    fullName = "John Doe"
    email = "john@example.com"
    password = "password123"
    phone = "9876543210"
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:3000/api/auth/signup" `
  -Method POST `
  -Headers @{"Content-Type"="application/json"} `
  -Body $body
```

### Expected Success Response (201)

```json
{
  "message": "User registered successfully",
  "user": {
    "id": "ObjectId",
    "email": "john@example.com",
    "fullName": "John Doe",
    "phone": "9876543210"
  },
  "token": "uuid-token"
}
```

### Validation Rules

- **fullName**: Required, minimum 2 characters
- **email**: Required, must be valid email format
- **password**: Required, minimum 6 characters
- **phone**: Optional

### Error Responses

**Missing Required Fields** (400)

```json
{
  "error": "Missing required fields"
}
```

**User Already Exists** (409)

```json
{
  "error": "User already exists with this email"
}
```

**Invalid Email Format** (400)

```json
{
  "error": "Invalid email format"
}
```

**Password Too Short** (400)

```json
{
  "error": "Password must be at least 6 characters long"
}
```

---

## 2. LOGIN API

### Endpoint

```
POST /auth/login
```

### Request Headers

```
Content-Type: application/json
```

### Request Body

```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

### cURL Command

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'
```

### PowerShell Command

```powershell
$body = @{
    email = "john@example.com"
    password = "password123"
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:3000/api/auth/login" `
  -Method POST `
  -Headers @{"Content-Type"="application/json"} `
  -Body $body
```

### Expected Success Response (200)

```json
{
  "message": "Login successful",
  "user": {
    "id": "ObjectId",
    "email": "john@example.com",
    "fullName": "John Doe",
    "phone": "9876543210"
  },
  "token": "uuid-token"
}
```

### Error Responses

**Missing Credentials** (400)

```json
{
  "error": "Email and password are required"
}
```

**Invalid Credentials** (401)

```json
{
  "error": "Invalid email or password"
}
```

---

## 3. POSTMAN TESTING

### Setup in Postman

1. **Create New Request**
   - Method: POST
   - URL: http://localhost:3000/api/auth/signup (or /login)

2. **Headers Tab**
   - Key: `Content-Type`
   - Value: `application/json`

3. **Body Tab**
   - Select: `raw`
   - Paste JSON body from above examples

4. **Click Send**

### Test Sequence

**Step 1: Register New User**

```json
{
  "fullName": "Test User",
  "email": "test@example.com",
  "password": "test123456",
  "phone": "9999999999"
}
```

**Step 2: Login with Same Credentials**

```json
{
  "email": "test@example.com",
  "password": "test123456"
}
```

**Step 3: Test with Wrong Password**

```json
{
  "email": "test@example.com",
  "password": "wrongpassword"
}
```

Expected: 401 error

---

## 4. TESTING CHECKLIST

- [ ] Signup with valid data → 201 Success
- [ ] Signup with duplicate email → 409 Error
- [ ] Signup with invalid email → 400 Error
- [ ] Signup with short password → 400 Error
- [ ] Signup missing fullName → 400 Error
- [ ] Login with correct credentials → 200 Success
- [ ] Login with wrong password → 401 Error
- [ ] Login with non-existent email → 401 Error
- [ ] Login missing email → 400 Error
- [ ] Login missing password → 400 Error

---

## 5. RESPONSE TOKEN

Both APIs return a `token` field in the response. This token can be used for:

- Storing in localStorage
- Sending in Authorization header for authenticated requests
- Session management

Example authenticated request:

```bash
curl -X GET http://localhost:3000/api/profile \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## 6. DATABASE STORAGE

All registered users are stored in MongoDB with:

- `_id`: MongoDB ObjectId
- `email`: Unique email address
- `password`: SHA256 hashed password
- `fullName`: User's full name
- `phone`: Phone number (optional)
- `createdAt`: Timestamp

---

## Quick Test Commands

### Test Registration

```bash
curl -X POST http://localhost:3000/api/auth/signup -H "Content-Type: application/json" -d "{\"fullName\":\"Admin User\",\"email\":\"admin@mysanjeevani.com\",\"password\":\"admin123456\",\"phone\":\"9289996241\"}"
```

### Test Login

```bash
curl -X POST http://localhost:3000/api/auth/login -H "Content-Type: application/json" -d "{\"email\":\"admin@mysanjeevani.com\",\"password\":\"admin123456\"}"
```

---
