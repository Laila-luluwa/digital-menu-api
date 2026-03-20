#!/bin/bash

API="http://localhost:3000"
EMAIL="auth-test-$(date +%s)@demo.com"
PASSWORD="TestPass123!"

echo "🧪 Testing Combined Authentication System"
echo "========================================"
echo ""

# Register user
echo "1️⃣ Registering test user..."
REG=$(curl -s -X POST $API/api/auth/register \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$EMAIL\",
    \"name\": \"Auth Tester\",
    \"password\": \"$PASSWORD\",
    \"role\": \"OWNER\",
    \"restaurantId\": 1
  }")

TOKEN=$(echo "$REG" | grep -o '"token":"[^"]*' | cut -d'"' -f4 | head -1)

if [ -z "$TOKEN" ]; then
  echo "❌ Registration failed!"
  echo "$REG"
  exit 1
fi

echo "✅ User registered successfully"
echo "   Email: $EMAIL"
echo "   Password: $PASSWORD"
echo "   Token: ${TOKEN:0:30}..."
echo ""

# Test JWT
echo "2️⃣ Testing JWT Authentication..."
JWT_RESULT=$(curl -s -X GET $API/api/menu-items \
  -H "Authorization: Bearer $TOKEN" \
  -w "\n%{http_code}")

HTTP_CODE=$(echo "$JWT_RESULT" | tail -1)
BODY=$(echo "$JWT_RESULT" | head -n -1)

if [ "$HTTP_CODE" = "200" ]; then
  echo "✅ JWT Authentication works!"
  echo "   Response (first 100 chars): $(echo $BODY | head -c 100)..."
else
  echo "❌ JWT Authentication failed (HTTP $HTTP_CODE)"
  echo "   Response: $BODY"
fi
echo ""

# Test Basic Auth
echo "3️⃣ Testing Basic Auth Authentication..."
BASIC_RESULT=$(curl -s -X GET $API/api/menu-items \
  -u "$EMAIL:$PASSWORD" \
  -w "\n%{http_code}")

HTTP_CODE=$(echo "$BASIC_RESULT" | tail -1)
BODY=$(echo "$BASIC_RESULT" | head -n -1)

if [ "$HTTP_CODE" = "200" ]; then
  echo "✅ Basic Auth Authentication works!"
  echo "   Response (first 100 chars): $(echo $BODY | head -c 100)..."
else
  echo "❌ Basic Auth failed (HTTP $HTTP_CODE)"
  echo "   Response: $BODY"
fi
echo ""

# Test with manual base64
echo "4️⃣ Testing Manual Base64 Basic Auth..."
BASIC_B64=$(echo -n "$EMAIL:$PASSWORD" | base64)
B64_RESULT=$(curl -s -X GET $API/api/menu-items \
  -H "Authorization: Basic $BASIC_B64" \
  -w "\n%{http_code}")

HTTP_CODE=$(echo "$B64_RESULT" | tail -1)
BODY=$(echo "$B64_RESULT" | head -n -1)

if [ "$HTTP_CODE" = "200" ]; then
  echo "✅ Manual Base64 Basic Auth works!"
  echo "   Base64: $BASIC_B64"
  echo "   Response (first 100 chars): $(echo $BODY | head -c 100)..."
else
  echo "❌ Manual Base64 failed (HTTP $HTTP_CODE)"
  echo "   Response: $BODY"
fi
echo ""

echo "========================================"
echo "🎉 Combined Authentication Test Complete!"
echo "========================================"
