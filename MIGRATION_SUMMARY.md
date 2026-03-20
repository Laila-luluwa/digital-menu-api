# ✅ JWT Authentication Migration - Summary

## Что было сделано

Проект успешно перемигрирован с **session-based аутентификации** на **JWT (JSON Web Token) аутентификацию** с поддержкой пароля и логина.

---

## 📦 Установленные зависимости

```bash
npm install jsonwebtoken bcryptjs
```

- **jsonwebtoken** (^8.5.1) - создание и валидация JWT токенов
- **bcryptjs** (^2.4.3) - безопасное хеширование паролей

---

## 🗂️ Новые файлы

### 1. **src/controllers/auth.controller.js**
Контроллер аутентификации с методами:
- `register()` - регистрация нового пользователя с паролем
- `login()` - вход по email и пароль
- `validateToken()` - проверка валидности JWT

**Особенности:**
- Хеширование пароля с помощью bcryptjs (10 rounds)
- Генерация JWT токена на 24 часа
- Проверка уникальности email
- Создание RestaurantUser relationship

### 2. **src/middleware/validateJWT.js**
Middleware для защиты маршрутов:
- `validateJWT` - основное middleware, парсит токен из Authorization header
- `authorizeRole(...roles)` - проверка роли пользователя
- `validateTableSession` - для session токенов столов (дайнеры) - оставлено для обратной совместимости

**Поддерживаемые способы передачи токена:**
1. Authorization Header: `Authorization: Bearer <token>`
2. Custom Header: `X-Auth-Token: <token>`
3. Query Parameter: `?token=<token>`
4. Request Body: `{ token: <token> }`

### 3. **src/routes/auth.routes.js**
Новые публичные маршруты:
- `POST /api/auth/register` - регистрация
- `POST /api/auth/login` - вход
- `GET /api/auth/validate` - проверка токена (защищено JWT)

---

## 📝 Обновленные файлы

### 1. **prisma/schema.prisma**
```diff
model User {
  id           Int      @id @default(autoincrement())
  email        String   @unique
  name         String
+ password     String        // ← НОВОЕ
  role         Role
  restaurantId Int
  ...
}
```

**Миграция:** `20260319201426_add_password_to_users`

### 2. **src/server.js**
- Добавлена защита JWT для маршрутов admin/staff:
  - `/api/kitchen` - кухня
  - `/api/menu-items` - меню
  - `/api/tables` - столы
  - `/api/users` - пользователи
  - `/api/restaurants` - рестораны
  
- Маршруты дайнеров (`/api/diner`) остаются с session токенами для обратной совместимости

### 3. **src/routes/diner.routes.js**
- Обновлено использование middleware `validateTableSession` вместо `validateSession`
- Дайнер маршруты остаются с session-based auth (QR коды столов)

### 4. **.env**
Добавлена новая переменная окружения:
```bash
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
```

---

## 🔐 Структура JWT токена

**Payload содержит:**
```json
{
  "userId": 1,
  "email": "user@example.com",
  "role": "OWNER",
  "restaurantId": 1,
  "iat": 1695000000,      // issued at
  "exp": 1695086400       // expires at (24 часа)
}
```

**Best Practice для продакшена:**
```bash
JWT_SECRET=$(openssl rand -base64 32)
```

---

## 📚 Примеры использования

### Регистрация
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@restaurant.com",
    "name": "Admin",
    "password": "SecurePass123!",
    "role": "OWNER",
    "restaurantId": 1
  }'
```

**Ответ:**
```json
{
  "message": "User registered successfully",
  "user": {
    "id": 1,
    "email": "admin@restaurant.com",
    "name": "Admin",
    "role": "OWNER",
    "restaurantId": 1
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Логин
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@restaurant.com",
    "password": "SecurePass123!"
  }'
```

### Использование защищенного маршрута
```bash
curl -X GET http://localhost:3000/api/menu-items \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## 🔄 Архитектура аутентификации

### Admin/Staff (JWT-based)
```
User Registration/Login → JWT Token → Protected Routes
```

### Diners (Session-based - оставлено)
```
QR Code Scan → Table Code → Session Token → Diner Routes
```

---

## ✨ Изменения API

### Было (Session-based)
```
tenant.middleware (x-restaurant-id header) → Route
```

### Стало (JWT-based)
```
validateJWT middleware → JWT Payload extracts restaurantId → Route
```

**Преимущества:**
- ✅ Более безопасные пароли вместо UUID токенов
- ✅ Автоматическое истечение токена (24 часа)
- ✅ Содержит информацию о пользователе
- ✅ Стандарт для REST APIs
- ✅ Легч интегрируется с фронтенд фреймворками

---

## 📂 Файлы для тестирования

- **JWT_AUTH_GUIDE.md** - полная документация по API
- **test-jwt-endpoints.js** - примеры использования endpoints

```bash
# Для тестирования можно скопировать функции из test-jwt-endpoints.js
node -e "require('./test-jwt-endpoints.js').fullWorkflow()"
```

---

## 🚀 Следующие шаги

1. **Обновите фронтенд:**
   - Используйте `Authorization: Bearer <token>` вместо `x-restaurant-id`
   - Сохраняйте токен в localStorage/sessionStorage
   - Добавьте интерцепторы для обновления токена перед истечением

2. **Обновите переменные окружения для продакшена:**
   ```bash
   JWT_SECRET=$(openssl rand -base64 32)
   NODE_ENV=production
   ```

3. **Логирование:**
   - Логируйте попытки несанкционированного доступа
   - Мониторьте истечение токенов

4. **Безопасность:**
   - Используйте HTTPS в продакшене
   - Установите CORS политику
   - Добавьте rate limiting для /auth endpoints

---

## 🐛 Обратная совместимость

✅ **Дайнер маршруты остаются без изменений** (session-based)
- `/api/diner/sessions/start` - запуск сеанса по коду стола
- `/api/diner/menu` - меню (требует session token)
- `/api/diner/orders` - создание заказа (требует session token)

---

## 📊 Структура проекта после изменений

```
src/
├── controllers/
│   ├── auth.controller.js          ← NEW (register, login)
│   ├── diner/
│   │   ├── menu.controller.js
│   │   ├── order.controller.js
│   │   └── session.controller.js
│   └── kitchen/
│       └── queue.controller.js
├── middleware/
│   ├── validateJWT.js              ← NEW (JWT validation)
│   ├── validateSession.js          ← DEPRECATED
│   ├── tenant.middleware.js        ← STILL USED (где нужно)
│   └── validateRequest.js
├── routes/
│   ├── auth.routes.js              ← NEW
│   ├── diner.routes.js             ← UPDATED
│   ├── kitchen.routes.js
│   ├── menu.routes.js
│   ├── restaurants.routes.js
│   ├── tables.routes.js
│   └── users.routes.js
└── server.js                        ← UPDATED

prisma/
├── schema.prisma                    ← UPDATED (added password)
└── migrations/
    └── 20260319201426_add_password_to_users/
```

---

## ✅ Проверка работоспособности

```bash
# Сервер должен запуститься без ошибок
npm run dev

# Ожидаемый вывод:
# Server running on http://localhost:3000
```

---

## 📞 Вопросы?

Полная документация находится в `JWT_AUTH_GUIDE.md`
Примеры API calls в `test-jwt-endpoints.js`

---

**Дата миграции:** 20 марта 2026
**Версия:** 1.0.0
