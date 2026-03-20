#!/bin/bash

# Проверка всех endpoints API
# Используйте: bash test-api.sh

BASE_URL="http://localhost:3000"
echo "🧪 Тестирование API endpoints..."
echo "================================"

# Цвета для вывода
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Функция для проверки ответа
check_response() {
    local response=$1
    local expected_code=$2
    local test_name=$3
    
    if echo $response | grep -q '"error"'; then
        echo -e "${RED}✗ FAIL: $test_name${NC}"
        echo "  Error: $(echo $response | grep -o '"error":"[^"]*' | cut -d'"' -f4)"
    else
        echo -e "${GREEN}✓ PASS: $test_name${NC}"
    fi
}

# 1. РЕГИСТРАЦИЯ
echo -e "\n${YELLOW}1. РЕГИСТРАЦИЯ${NC}"
REGISTER=$(curl -s -X POST $BASE_URL/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test'$(date +%s)'@example.com",
    "name": "Test User",
    "password": "TestPass123!",
    "role": "OWNER",
    "restaurantId": 1
  }')

echo "Response: $REGISTER"
TOKEN=$(echo $REGISTER | grep -o '"token":"[^"]*' | head -1 | cut -d'"' -f4)
echo "Token: $TOKEN"

if [ -z "$TOKEN" ]; then
    echo -e "${RED}✗ Регистрация не удалась!${NC}"
    echo "Полный ответ: $REGISTER"
    exit 1
else
    echo -e "${GREEN}✓ Регистрация успешна!${NC}"
fi

# 2. ЛОГИН
echo -e "\n${YELLOW}2. ЛОГИН${NC}"
LOGIN=$(curl -s -X POST $BASE_URL/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test'$(date +%s)'@example.com",
    "password": "TestPass123!"
  }')

echo "Response: $LOGIN"

# 3. ПРОВЕРКА ТОКЕНА
echo -e "\n${YELLOW}3. ПРОВЕРКА ТОКЕНА${NC}"
VALIDATE=$(curl -s -X GET $BASE_URL/api/auth/validate \
  -H "Authorization: Bearer $TOKEN")

echo "Response: $VALIDATE"
check_response "$VALIDATE" 200 "Validation Token"

# 4. СОЗДАНИЕ ПУНКТА МЕНЮ
echo -e "\n${YELLOW}4. СОЗДАНИЕ ПУНКТА МЕНЮ${NC}"
MENU=$(curl -s -X POST $BASE_URL/api/menu-items \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Pizza",
    "price": 12.99,
    "quantity": 50
  }')

echo "Response: $MENU"
check_response "$MENU" 200 "Create Menu Item"

# 5. ПОЛУЧЕНИЕ МЕНЮ
echo -e "\n${YELLOW}5. ПОЛУЧЕНИЕ МЕНЮ${NC}"
GET_MENU=$(curl -s -X GET $BASE_URL/api/menu-items \
  -H "Authorization: Bearer $TOKEN")

echo "Response: $GET_MENU"
check_response "$GET_MENU" 200 "Get Menu Items"

# 6. СОЗДАНИЕ СТОЛА
echo -e "\n${YELLOW}6. СОЗДАНИЕ СТОЛА${NC}"
TABLE=$(curl -s -X POST $BASE_URL/api/tables \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json")

echo "Response: $TABLE"
check_response "$TABLE" 200 "Create Table"
TABLE_CODE=$(echo $TABLE | grep -o '"tableCode":"[^"]*' | cut -d'"' -f4)
echo "Table Code: $TABLE_CODE"

# 7. НАЧАЛО ДАЙНЕР СЕАНСА
echo -e "\n${YELLOW}7. НАЧАЛО ДАЙНЕР СЕАНСА (БЕЗ JWT)${NC}"
DINER_SESSION=$(curl -s -X POST "$BASE_URL/api/diner/sessions/start?table_code=$TABLE_CODE")

echo "Response: $DINER_SESSION"
check_response "$DINER_SESSION" 200 "Start Diner Session"
SESSION_TOKEN=$(echo $DINER_SESSION | grep -o '"token":"[^"]*' | head -1 | cut -d'"' -f4)
echo "Session Token: $SESSION_TOKEN"

# 8. ПОЛУЧЕНИЕ МЕНЮ ДЛЯ ДАЙНЕРА
echo -e "\n${YELLOW}8. ПОЛУЧЕНИЕ МЕНЮ ДЛЯ ДАЙНЕРА${NC}"
DINER_MENU=$(curl -s -X GET $BASE_URL/api/diner/menu \
  -H "X-Session-Token: $SESSION_TOKEN")

echo "Response: $DINER_MENU"
check_response "$DINER_MENU" 200 "Get Diner Menu"

# 9. СОЗДАНИЕ ЗАКАЗА
echo -e "\n${YELLOW}9. СОЗДАНИЕ ЗАКАЗА${NC}"
ORDER=$(curl -s -X POST $BASE_URL/api/diner/orders \
  -H "X-Session-Token: $SESSION_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      {
        "menuItemId": 1,
        "quantity": 2
      }
    ]
  }')

echo "Response: $ORDER"
check_response "$ORDER" 200 "Create Order"

# 10. ПОЛУЧЕНИЕ ЗАКАЗОВ КУХНИ
echo -e "\n${YELLOW}10. ПОЛУЧЕНИЕ ЗАКАЗОВ КУХНИ${NC}"
KITCHEN=$(curl -s -X GET $BASE_URL/api/kitchen/orders \
  -H "Authorization: Bearer $TOKEN")

echo "Response: $KITCHEN"
check_response "$KITCHEN" 200 "Get Kitchen Orders"

echo -e "\n${GREEN}================================${NC}"
echo -e "${GREEN}✅ Все тесты завершены!${NC}"
echo -e "${GREEN}================================${NC}"
