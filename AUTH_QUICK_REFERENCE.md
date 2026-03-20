# 🚀 Quick Reference - Authentication

## 📌 Get JWT Token

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@test.com",
    "name": "User",
    "password": "Pass123!",
    "role": "OWNER",
    "restaurantId": 1
  }'
```

**Response includes:** `"token": "eyJhbGc..."`

---

## 🔐 Use JWT Token

```bash
TOKEN="your-token-here"
curl -X GET http://localhost:3000/api/menu-items \
  -H "Authorization: Bearer $TOKEN"
```

---

## 🔸 Use Basic Auth

### Method 1: curl -u (easiest)
```bash
curl -X GET http://localhost:3000/api/menu-items \
  -u "user@test.com:Pass123!"
```

### Method 2: Manual base64
```bash
# Generate base64
echo -n "user@test.com:Pass123!" | base64
# Result: dXNlckB0ZXN0LmNvbTpQYXNzMTIzIQ==

# Use it
curl -X GET http://localhost:3000/api/menu-items \
  -H "Authorization: Basic dXNlckB0ZXN0LmNvbTpQYXNzMTIzIQ=="
```

---

## ✅ Test Both Methods

```bash
bash test-auth.sh
```

---

## 📋 Protected Routes (Both Auth Types)

```
GET    /api/menu-items
POST   /api/menu-items
PATCH  /api/menu-items/:id
DELETE /api/menu-items/:id
GET    /api/tables
POST   /api/tables
GET    /api/users
POST   /api/users
GET    /api/restaurants
POST   /api/restaurants
GET    /api/kitchen/orders
PATCH  /api/kitchen/orders/:id/status
GET    /api/auth/validate
```

---

## 🔓 Public Routes (No Auth)

```
POST /api/auth/register
POST /api/auth/login
POST /api/diner/sessions/start
GET  /api/diner/menu
POST /api/diner/orders
```

---

## 🛠️ Implementation

- **Middleware:** `src/middleware/validateBasicAuth.js` (validateCombinedAuth)
- **Entry Point:** `index.js` (uses validateCombinedAuth on protected routes)
- **Controller:** `src/controllers/auth.controller.js` (register/login + JWT)
- **Password Hashing:** bcryptjs (10 rounds)
- **Token TTL:** 24 hours

---

## 📚 Full Documentation

See `BASIC_AUTH_GUIDE.md` for complete guide with:
- 300+ lines of documentation
- 20+ cURL examples
- Postman setup
- Bash script templates
- Security best practices
