# JWT Authentication Guide

## Обзор миграции

Проект был успешно перемиграван с session-based аутентификации на **JWT (JSON Web Token) аутентификацию** с поддержкой пароля и логина.

## Установленные пакеты

- `jsonwebtoken` - для создания и валидации JWT токенов
- `bcryptjs` - для хеширования паролей

## Структура изменений

### 1. Обновленная схема БД (`schema.prisma`)
- Добавлено поле `password: String` в модель `User`
- Миграция: `20260319201426_add_password_to_users`

### 2. Новые файлы

#### `src/controllers/auth.controller.js`
Контроллер аутентификации с методами:
- `register(email, name, password, role, restaurantId)` - регистрация нового пользователя
- `login(email, password)` - вход пользователя
- `validateToken()` - проверка валидности токена (для тестирования)

#### `src/middleware/validateJWT.js`
Middleware для проверки JWT токенов:
- `validateJWT` - основное middleware для защиты маршрутов
- `authorizeRole(...roles)` - проверка роли пользователя
- `validateTableSession` - для session токенов столов (дайнеры)

#### `src/routes/auth.routes.js`
Новые маршруты аутентификации:
- `POST /api/auth/register` - регистрация
- `POST /api/auth/login` - вход
- `GET /api/auth/validate` - проверка токена (требует JWT)

### 3. Обновленные файлы

#### `src/server.js`
- Добавлена защита JWT для маршрутов: `/kitchen`, `/menu-items`, `/tables`, `/users`, `/restaurants`
- Дайнер маршруты (`/api/diner`) остаются с session токенам (сканирование QR кода)

---

## API Примеры использования

### 1. Регистрация нового пользователя

```bash
POST /api/auth/register
Content-Type: application/json

{
  "email": "admin@restaurant.com",
  "name": "Admin User",
  "password": "securePassword123",
  "role": "OWNER",
  "restaurantId": 1
}
```

**Ответ (201 Created):**
```json
{
  "message": "User registered successfully",
  "user": {
    "id": 1,
    "email": "admin@restaurant.com",
    "name": "Admin User",
    "role": "OWNER",
    "restaurantId": 1
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

### 2. Вход пользователя (Логин)

```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "admin@restaurant.com",
  "password": "securePassword123"
}
```

**Ответ (200 OK):**
```json
{
  "message": "Login successful",
  "user": {
    "id": 1,
    "email": "admin@restaurant.com",
    "name": "Admin User",
    "role": "OWNER",
    "restaurantId": 1
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

### 3. Использование JWT токена для защищенных маршрутов

Все защищенные маршруты требуют JWT токен в одном из способов:

#### Способ 1: Authorization Header (рекомендуется)
```bash
GET /api/menu-items
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### Способ 2: Custom Header
```bash
GET /api/menu-items
X-Auth-Token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### Способ 3: Query Parameter
```bash
GET /api/menu-items?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### Способ 4: Request Body
```bash
POST /api/menu-items
Content-Type: application/json

{
  "name": "Pizza",
  "price": 15.99,
  "quantity": 50,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

### 4. Защищенные маршруты (требуют JWT)

#### Меню
```bash
GET /api/menu-items
Authorization: Bearer <JWT_TOKEN>
```

#### Столы
```bash
POST /api/tables
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{
  "restaurantId": 1
}
```

#### Пользователи
```bash
GET /api/users
Authorization: Bearer <JWT_TOKEN>
```

```bash
POST /api/users
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{
  "email": "manager@restaurant.com",
  "name": "Manager",
  "role": "MANAGER"
}
```

#### Кухня (Kitchen)
```bash
GET /api/kitchen/orders
Authorization: Bearer <JWT_TOKEN>
```

```bash
PATCH /api/kitchen/orders/:id/status
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{
  "status": "COOKING"
}
```

---

### 5. Дайнер маршруты (остаются с session токенами)

Дайнер endpoints используют **session токены** (для сканирования QR кодов столов), а не JWT:

```bash
# Начать сеанс по коду стола
POST /api/diner/sessions/start?table_code=abc123

# Получить меню (требует session token)
GET /api/diner/menu
X-Session-Token: <SESSION_TOKEN>

# Создать заказ (требует session token)
POST /api/diner/orders
X-Session-Token: <SESSION_TOKEN>
Content-Type: application/json

{
  "items": [
    {
      "menuItemId": 1,
      "quantity": 2
    }
  ]
}
```

---

## Структура JWT токена

JWT токен содержит следующую информацию (payload):

```json
{
  "userId": 1,
  "email": "admin@restaurant.com",
  "role": "OWNER",
  "restaurantId": 1,
  "iat": 1695000000,
  "exp": 1695086400
}
```

**Срок действия токена:** 24 часа (по умолчанию)

---

## Переменные окружения

Обновите файл `.env`:

```bash
# Существующие переменные
DATABASE_URL="postgres://..."
PORT=3000
NODE_ENV=development

# НОВАЯ переменная для JWT
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"

# Для продакшена используйте сложный ключ:
# JWT_SECRET="$(openssl rand -base64 32)"
```

---

## Коды ошибок

| Статус | Описание |
|--------|---------|
| 200 OK | Успешный запрос |
| 201 Created | Пользователь успешно создан |
| 400 Bad Request | Отсутствуют обязательные поля |
| 401 Unauthorized | Токен отсутствует или невалидный |
| 403 Forbidden | Недостаточно прав доступа |
| 409 Conflict | Пользователь с таким email уже существует |
| 500 Internal Server Error | Ошибка сервера |

---

## Миграция с старой системы

## 🧪 Полное тестирование API - Все команды

### 📌 ВАЖНО: Перед началом

1. Убедитесь, что сервер запущен:
   ```bash
   npm run dev
   ```
   Должно показать: `Server running on port 3000`

2. Сохненяйте JWT токен после логина для использования в других командах

### 🔑 РАЗДЕЛ 1: АУТЕНТИФИКАЦИЯ (Authentication)

#### 1.1 Регистрация нового пользователя
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "owner@restaurant.com",
    "name": "Restaurant Owner",
    "password": "SecurePass123!",
    "role": "OWNER",
    "restaurantId": 1
  }'
```

**Ожидаемый ответ (201 Created):**
```json
{
  "message": "User registered successfully",
  "user": {
    "id": 1,
    "email": "owner@restaurant.com",
    "name": "Restaurant Owner",
    "role": "OWNER",
    "restaurantId": 1
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

#### 1.2 Регистрация менеджера
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "manager@restaurant.com",
    "name": "Restaurant Manager",
    "password": "SecurePass123!",
    "role": "MANAGER",
    "restaurantId": 1
  }'
```

---

#### 1.3 Регистрация кухонного персонала
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "kitchen@restaurant.com",
    "name": "Kitchen Staff",
    "password": "SecurePass123!",
    "role": "KITCHEN",
    "restaurantId": 1
  }'
```

---

#### 1.4 Логин (получить JWT токен)
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "owner@restaurant.com",
    "password": "SecurePass123!"
  }'
```

**Ожидаемый ответ (200 OK):**
```json
{
  "message": "Login successful",
  "user": {
    "id": 1,
    "email": "owner@restaurant.com",
    "name": "Restaurant Owner",
    "role": "OWNER",
    "restaurantId": 1
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**⚠️ ВАЖНО:** Скопируйте значение `token` и сохраните как переменную в терминале:
```bash
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
# или используйте в других командах вместо YOUR_JWT_TOKEN
```

---

#### 1.5 Проверка валидности токена
```bash
curl -X GET http://localhost:3000/api/auth/validate \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Ожидаемый ответ (200 OK):**
```json
{
  "message": "Token is valid",
  "user": {
    "userId": 1,
    "email": "owner@restaurant.com",
    "role": "OWNER",
    "restaurantId": 1,
    "iat": 1695000000,
    "exp": 1695086400
  }
}
```

---

#### 1.6 Логин с неправильным паролем (ошибка)
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "owner@restaurant.com",
    "password": "WrongPassword"
  }'
```

**Ожидаемый ответ (401 Unauthorized):**
```json
{
  "error": "Invalid email or password"
}
```

---

### 📋 РАЗДЕЛ 2: МЕНЮ (Menu Items)

#### 2.1 Получить все пункты меню
```bash
curl -X GET http://localhost:3000/api/menu-items \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Ожидаемый ответ (200 OK):**
```json
[
  {
    "id": 1,
    "name": "Margherita Pizza",
    "price": 12.99,
    "quantity": 50,
    "restaurantId": 1,
    "inventory": {
      "id": 1,
      "menuItemId": 1,
      "quantityAvailable": 50
    },
    "tags": []
  }
]
```

---

#### 2.2 Создать новый пункт меню
```bash
curl -X POST http://localhost:3000/api/menu-items \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Margherita Pizza",
    "price": 12.99,
    "quantity": 50
  }'
```

**Ожидаемый ответ (200 OK):**
```json
{
  "id": 1,
  "name": "Margherita Pizza",
  "price": 12.99,
  "quantity": 50,
  "restaurantId": 1,
  "inventory": {
    "id": 1,
    "menuItemId": 1,
    "quantityAvailable": 50
  }
}
```

---

#### 2.3 Создать еще меню (для тестирования заказов)
```bash
curl -X POST http://localhost:3000/api/menu-items \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Caesar Salad",
    "price": 8.99,
    "quantity": 30
  }'

curl -X POST http://localhost:3000/api/menu-items \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Coca Cola",
    "price": 2.99,
    "quantity": 100
  }'
```

---

#### 2.4 Обновить пункт меню
```bash
curl -X PATCH http://localhost:3000/api/menu-items/1 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Margherita Pizza Premium",
    "price": 14.99,
    "quantity": 40
  }'
```

**Ожидаемый ответ (200 OK):**
```json
{
  "id": 1,
  "name": "Margherita Pizza Premium",
  "price": 14.99,
  "quantity": 40,
  "restaurantId": 1
}
```

---

#### 2.5 Удалить пункт меню
```bash
curl -X DELETE http://localhost:3000/api/menu-items/1 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

### 🚪 РАЗДЕЛ 3: СТОЛЫ (Tables)

#### 3.1 Создать новый стол
```bash
curl -X POST http://localhost:3000/api/tables \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

**Ожидаемый ответ (200 OK):**
```json
{
  "table": {
    "id": 1,
    "tableCode": "abc123",
    "restaurantId": 1
  },
  "qrLink": "http://localhost:3000/api/diner/sessions/start?table_code=abc123"
}
```

**⚠️ ВАЖНО:** Сохраните `tableCode` для использования в дайнер endpoints:
```bash
TABLE_CODE="abc123"  # используйте значение из ответа
```

---

#### 3.2 Создать несколько столов
```bash
for i in {1..5}; do
  curl -X POST http://localhost:3000/api/tables \
    -H "Authorization: Bearer YOUR_JWT_TOKEN" \
    -H "Content-Type: application/json"
  echo "Table $i created"
done
```

---

### 👥 РАЗДЕЛ 4: ПОЛЬЗОВАТЕЛИ (Users)

#### 4.1 Получить всех пользователей ресторана
```bash
curl -X GET http://localhost:3000/api/users \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Ожидаемый ответ (200 OK):**
```json
[
  {
    "id": 1,
    "restaurantId": 1,
    "userId": 1,
    "role": "OWNER",
    "createdAt": "2026-03-20T12:00:00.000Z",
    "user": {
      "id": 1,
      "email": "owner@restaurant.com",
      "name": "Restaurant Owner",
      "role": "OWNER",
      "restaurantId": 1,
      "createdAt": "2026-03-20T12:00:00.000Z"
    }
  }
]
```

---

#### 4.2 Создать нового пользователя (добавить в ресторан)
```bash
curl -X POST http://localhost:3000/api/users \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "waiter@restaurant.com",
    "name": "Waiter",
    "role": "MANAGER"
  }'
```

---

### 🍽️ РАЗДЕЛ 5: КУХНЯ (Kitchen Queue)

#### 5.1 Получить активные заказы в кухне
```bash
curl -X GET http://localhost:3000/api/kitchen/orders \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Ожидаемый ответ (200 OK):**
```json
[
  {
    "id": 1,
    "tableCode": "abc123",
    "restaurantId": 1,
    "totalPrice": 12.99,
    "status": "QUEUED",
    "createdAt": "2026-03-20T12:00:00.000Z",
    "items": [
      {
        "id": 1,
        "orderId": 1,
        "menuItemId": 1,
        "quantity": 2,
        "priceSnapshot": 12.99
      }
    ]
  }
]
```

---

#### 5.2 Обновить статус заказа на COOKING
```bash
curl -X PATCH http://localhost:3000/api/kitchen/orders/1/status \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "COOKING"
  }'
```

---

#### 5.3 Обновить статус заказа на READY
```bash
curl -X PATCH http://localhost:3000/api/kitchen/orders/1/status \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "READY"
  }'
```

---

#### 5.4 Обновить статус заказа на SERVED
```bash
curl -X PATCH http://localhost:3000/api/kitchen/orders/1/status \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "SERVED"
  }'
```

---

### 🍴 РАЗДЕЛ 6: ДАЙНЕР (Customer - Session-based, БЕЗ JWT)

#### 6.1 Начать сеанс по коду стола (QR Code)
```bash
curl -X POST "http://localhost:3000/api/diner/sessions/start?table_code=TABLE_CODE" \
  -H "Content-Type: application/json"
```

**Замените `TABLE_CODE` на коду вашего стола (например: `abc123`)**

**Ожидаемый ответ (200 OK):**
```json
{
  "token": "550e8400-e29b-41d4-a716-446655440000",
  "sessionId": 1,
  "restaurantId": 1,
  "table": {
    "id": 1,
    "tableCode": "abc123",
    "restaurantId": 1
  },
  "expiresAt": "2026-03-21T12:00:00.000Z"
}
```

**⚠️ ВАЖНО:** Сохраните `token` для дайнер commands:
```bash
SESSION_TOKEN="550e8400-e29b-41d4-a716-446655440000"
```

---

#### 6.2 Получить меню (используя SESSION TOKEN)
```bash
curl -X GET http://localhost:3000/api/diner/menu \
  -H "X-Session-Token: YOUR_SESSION_TOKEN"
```

**Ожидаемый ответ (200 OK):**
```json
[
  {
    "id": 1,
    "name": "Margherita Pizza",
    "price": 12.99,
    "quantity": 50,
    "restaurantId": 1,
    "tags": []
  }
]
```

---

#### 6.3 Создать заказ (используя SESSION TOKEN)
```bash
curl -X POST http://localhost:3000/api/diner/orders \
  -H "X-Session-Token: YOUR_SESSION_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      {
        "menuItemId": 1,
        "quantity": 2
      },
      {
        "menuItemId": 2,
        "quantity": 1
      }
    ]
  }'
```

**Ожидаемый ответ (200 OK):**
```json
{
  "id": 1,
  "tableCode": "abc123",
  "restaurantId": 1,
  "totalPrice": 28.97,
  "status": "QUEUED",
  "createdAt": "2026-03-20T12:00:00.000Z",
  "items": [
    {
      "id": 1,
      "orderId": 1,
      "menuItemId": 1,
      "quantity": 2,
      "priceSnapshot": 12.99
    },
    {
      "id": 2,
      "orderId": 1,
      "menuItemId": 2,
      "quantity": 1,
      "priceSnapshot": 8.99
    }
  ]
}
```

---

### 🏪 РАЗДЕЛ 7: РЕСТОРАНЫ (Restaurants)

#### 7.1 Получить все рестораны
```bash
curl -X GET http://localhost:3000/api/restaurants
```

**Ожидаемый ответ (200 OK):**
```json
[
  {
    "id": 1,
    "name": "My Restaurant",
    "createdAt": "2026-03-20T10:00:00.000Z"
  }
]
```

---

#### 7.2 Создать новый ресторан
```bash
curl -X POST http://localhost:3000/api/restaurants \
  -H "Content-Type: application/json" \
  -d '{
    "name": "New Restaurant Name"
  }'
```

---

### ⚠️ РАЗДЕЛ 8: ТЕСТИРОВАНИЕ ОШИБОК

#### 8.1 Попытка доступа БЕЗ токена
```bash
curl -X GET http://localhost:3000/api/menu-items
```

**Ожидаемый ответ (401 Unauthorized):**
```json
{
  "error": "No authorization token provided"
}
```

---

#### 8.2 С невалидным токеном
```bash
curl -X GET http://localhost:3000/api/menu-items \
  -H "Authorization: Bearer invalid_token"
```

**Ожидаемый ответ (401 Unauthorized):**
```json
{
  "error": "Invalid token"
}
```

---

#### 8.3 Регистрация с дублирующимся email
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "owner@restaurant.com",
    "name": "Another Owner",
    "password": "Pass123!",
    "role": "OWNER",
    "restaurantId": 1
  }'
```

**Ожидаемый ответ (409 Conflict):**
```json
{
  "error": "User already exists"
}
```

---

#### 8.4 Регистрация без обязательных полей
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@restaurant.com"
  }'
```

**Ожидаемый ответ (400 Bad Request):**
```json
{
  "error": "Missing required fields: email, name, password, role, restaurantId"
}
```

---

### 🔄 РАЗДЕЛ 9: ПОЛНЫЙ WORKFLOW ПРИМЕР

#### Полный процесс от регистрации до заказа:

```bash
#!/bin/bash

# 1. Регистрация владельца
OWNER_LOGIN=$(curl -s -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "owner@test.com",
    "name": "Owner",
    "password": "Pass123!",
    "role": "OWNER",
    "restaurantId": 1
  }')

OWNER_TOKEN=$(echo $OWNER_LOGIN | grep -o '"token":"[^"]*' | cut -d'"' -f4)
echo "Owner Token: $OWNER_TOKEN"

# 2. Создание пункта меню
curl -s -X POST http://localhost:3000/api/menu-items \
  -H "Authorization: Bearer $OWNER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "Pizza", "price": 12.99, "quantity": 50}'

# 3. Создание стола
TABLE=$(curl -s -X POST http://localhost:3000/api/tables \
  -H "Authorization: Bearer $OWNER_TOKEN")

TABLE_CODE=$(echo $TABLE | grep -o '"tableCode":"[^"]*' | cut -d'"' -f4)
echo "Table Code: $TABLE_CODE"

# 4. Начало сеанса дайнера
DINER_SESSION=$(curl -s -X POST "http://localhost:3000/api/diner/sessions/start?table_code=$TABLE_CODE")

SESSION_TOKEN=$(echo $DINER_SESSION | grep -o '"token":"[^"]*' | cut -d'"' -f4)
echo "Session Token: $SESSION_TOKEN"

# 5. Получение меню
curl -s -X GET http://localhost:3000/api/diner/menu \
  -H "X-Session-Token: $SESSION_TOKEN"

# 6. Создание заказа
curl -s -X POST http://localhost:3000/api/diner/orders \
  -H "X-Session-Token: $SESSION_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"items": [{"menuItemId": 1, "quantity": 2}]}'
```

---

### 🛠️ РАЗДЕЛ 10: ИСПОЛЬЗОВАНИЕ ПЕРЕМЕННЫХ В ПОСТМАН

Если вы используете Postman, установите переменные:

```
BASE_URL = http://localhost:3000
TOKEN = (скопируйте из ответа логина)
SESSION_TOKEN = (скопируйте из diner/sessions/start)
TABLE_CODE = (скопируйте из api/tables)
RESTAURANT_ID = 1
```

Затем используйте в запросах:
```
Authorization: Bearer {{TOKEN}}
X-Session-Token: {{SESSION_TOKEN}}
```

---

## Поддерживаемые роли

- `OWNER` - владелец ресторана
- `MANAGER` - менеджер ресторана
- `KITCHEN` - кухонный персонал

---

## Контакты и поддержка

Для вопросов или проблем с JWT миграцией создайте issue в репозитории.
