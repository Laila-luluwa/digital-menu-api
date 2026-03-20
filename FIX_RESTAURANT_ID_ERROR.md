# ✅ Исправление ошибки "Restaurant ID is required"

## Проблема

При попытке регистрации получается ошибка:
```json
{
  "error": "Restaurant ID is required in x-restaurant-id header"
}
```

## Причина

В файле `src/server.js` все маршруты были повешены на один путь `/api` с разными middleware:

```javascript
// ❌ БЫЛО (неправильно)
app.use("/api", authRoutes);              // Публичные маршруты
app.use("/api", validateJWT, menuRoutes); // Защищенные маршруты
```

Это вызывало конфликт маршрутов, где защищенные маршруты могли перехватывать публичные запросы.

## Решение

### 1. ✅ Обновлен `src/server.js`

Разделили маршруты по разным путям:

```javascript
// ПУБЛИЧНЫЕ маршруты (БЕЗ защиты)
app.use("/api/auth", authRoutes);         // /api/auth/login, /api/auth/register

// ЗАЩИЩЕННЫЕ маршруты (требуют JWT)
app.use("/api/kitchen", validateJWT, kitchenRoutes);     // /api/kitchen/orders
app.use("/api", validateJWT, restaurantRoutes);          // /api/restaurants
app.use("/api", validateJWT, menuRoutes);                // /api/menu-items
app.use("/api", validateJWT, tableRoutes);               // /api/tables
app.use("/api", validateJWT, userRoutes);                // /api/users

// ДАЙНЕР маршруты (сессионные, БЕЗ JWT)
app.use("/api/diner", dinerRoutes);      // Столы, заказы, сеансы
```

### 2. ✅ Обновлен `src/routes/auth.routes.js`

Удалены дублирующиеся пути в самих роутерах:

```javascript
// ✅ БЫЛО
router.post("/auth/login", login);
router.post("/auth/register", register);

// ✅ СТАЛО - теперь при монтировании на /api/auth получится правильный путь
router.post("/login", login);
router.post("/register", register);
```

## Результат

### Правильная иерархия маршрутов:

| Маршрут | Методы | Аутентификация | Описание |
|---------|--------|---|----------|
| POST `/api/auth/register` | POST | ❌ НЕ требуется | Регистрация нового пользователя |
| POST `/api/auth/login` | POST | ❌ НЕ требуется | Логин пользователя |
| GET `/api/auth/validate` | GET | ✅ JWT требуется | Проверка валидности токена |
| GET `/api/menu-items` | GET | ✅ JWT требуется | Получить меню |
| POST `/api/menu-items` | POST | ✅ JWT требуется | Создать пункт меню |
| PATCH `/api/menu-items/:id` | PATCH | ✅ JWT требуется | Обновить пункт меню |
| DELETE `/api/menu-items/:id` | DELETE | ✅ JWT требуется | Удалить пункт меню |
| POST `/api/tables` | POST | ✅ JWT требуется | Создать стол |
| GET `/api/users` | GET | ✅ JWT требуется | Получить пользователей |
| POST `/api/users` | POST | ✅ JWT требуется | Создать пользователя |
| GET `/api/restaurants` | GET | ✅ JWT требуется | Получить рестораны |
| POST `/api/restaurants` | POST | ✅ JWT требуется | Создать ресторан |
| GET `/api/kitchen/orders` | GET | ✅ JWT требуется | Получить заказы кухни |
| PATCH `/api/kitchen/orders/:id/status` | PATCH | ✅ JWT требуется | Обновить статус заказа |
| POST `/api/diner/sessions/start` | POST | ❌ НЕ требуется | Начать сеанс дайнера |
| GET `/api/diner/menu` | GET | ❌ Требуется session token | Меню для дайнера |
| POST `/api/diner/orders` | POST | ❌ Требуется session token | Создать заказ дайнера |

## Как перепроверить

### Способ 1: Быстрый тест через bash скрипт

```bash
bash test-api.sh
```

### Способ 2: Вручную с cURL

```bash
# 1. Регистрация (БЕЗ JWT, БЕЗ x-restaurant-id header)
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@test.com",
    "name": "Test User",
    "password": "SecurePass123!",
    "role": "OWNER",
    "restaurantId": 1
  }'

# Ожидаемый ответ (201 Created):
# {
#   "message": "User registered successfully",
#   "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
#   "user": { ... }
# }

# 2. Логин
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@test.com",
    "password": "SecurePass123!"
  }'

# 3. Защищенный маршрут (ТРЕБУЕТСЯ JWT)
curl -X GET http://localhost:3000/api/menu-items \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## Шаг за шагом для проверки

1. **Запустить сервер:**
   ```bash
   npm run dev
   ```

2. **Открыть новый терминал и запустить тесты:**
   ```bash
   bash test-api.sh
   ```

3. **Если тесты прошли - всё работает! ✅**

4. **Если ошибки - проверьте:**
   - Сервер запущен на http://localhost:3000
   - Нет старого process, слушающего на порту 3000
   - База данных подключена

## Важные изменения

| Файл | Что изменилось |
|------|---|
| `src/server.js` | Разделены маршруты по разным путям |
| `src/routes/auth.routes.js` | Удалены дублирующиеся `/auth` в пути |
| `src/routes/users.routes.js` | Теперь используется `req.restaurantId` из JWT |
| `src/routes/menu.routes.js` | Теперь используется `req.restaurantId` из JWT |
| `src/routes/tables.routes.js` | Теперь используется `req.restaurantId` из JWT |

## Как это работает теперь

```
┌─────────────────────────────────────────────────────┐
│          HTTP REQUEST TO /api/something              │
└────────────────────┬────────────────────────────────┘
                     │
         ┌───────────┼───────────┐
         │           │           │
    ┌────▼─────┐ ┌──▼──┐ ┌─────▼────┐
    │ /api/auth │ │/api/│ │/api/diner│
    │ (public)  │ │(JWT)│ │(session) │
    └──────────┘ └─────┘ └──────────┘
       │           │         │
       ✅          ✅ JWT    ✅ Session Token
       NO AUTH    REQUIRED   REQUIRED
```

## Дополнительные команды для проверки

### Попробовать без токена (должна быть ошибка):
```bash
curl http://localhost:3000/api/menu-items
# 401 Unauthorized: "No authorization token provided"
```

### Попробовать с неправильным токеном (должна быть ошибка):
```bash
curl -X GET http://localhost:3000/api/menu-items \
  -H "Authorization: Bearer invalid_token"
# 401 Unauthorized: "Invalid token"
```

### Дайнер endpoints без JWT (должны работать с session token):
```bash
curl -X POST "http://localhost:3000/api/diner/sessions/start?table_code=abc123"
# 200 OK: { "token": "...", "sessionId": 1 }
```

---

## ✅ Проблема решена!

Теперь:
- ✅ Регистрация работает БЕЗ `x-restaurant-id` header
- ✅ Регистрация принимает `restaurantId` из JSON body
- ✅ Защищенные маршруты требуют JWT
- ✅ Дайнер маршруты используют session tokens
- ✅ Нет конфликтов между маршрутами
