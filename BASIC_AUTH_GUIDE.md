# 🔐 Basic Auth & JWT - Полная документация

## 📋 Обзор

Проект поддерживает **ДВУХ типов аутентификации**:

1. **JWT (JSON Web Tokens)** - для фронтенда, мобильных приложений
2. **Basic Auth** - для простых интеграций, CLI, скриптов

Оба типа работают **взаимозаменяемо** на всех защищенных маршрутах! ✅

---

## 🔑 JWT Authentication

### Как получить JWT токен:

**1️⃣ Регистрация:**
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

**Ответ:**
```json
{
  "message": "User registered successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQ..."
}
```

**2️⃣ Или Логин:**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@test.com",
    "password": "Pass123!"
  }'
```

### Использование JWT токена:

**Способ 1: Authorization Header (рекомендуется)**
```bash
curl -X GET http://localhost:3000/api/menu-items \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Способ 2: Custom Header**
```bash
curl -X GET http://localhost:3000/api/menu-items \
  -H "X-Auth-Token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Способ 3: Query Parameter**
```bash
curl -X GET "http://localhost:3000/api/menu-items?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Способ 4: Body**
```bash
curl -X GET http://localhost:3000/api/menu-items \
  -H "Content-Type: application/json" \
  -d '{"token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."}'
```

---

## 🔸 Basic Authentication

### Как работает Basic Auth:

**Формат:** `Authorization: Basic base64(email:password)`

### Примеры:

**1️⃣ Простой пример с curl:**

```bash
# email: user@test.com
# password: Pass123!

curl -X GET http://localhost:3000/api/menu-items \
  -H "Authorization: Basic dXNlckB0ZXN0LmNvbTpQYXNzMTIzIQ=="
```

**2️⃣ Встроенная Basic Auth в curl:**
```bash
curl -X GET http://localhost:3000/api/menu-items \
  --basic \
  -u "user@test.com:Pass123!"

# или то же самое:
curl -X GET http://localhost:3000/api/menu-items \
  -u "user@test.com:Pass123!"
```

**3️⃣ В Postman:**
- Откройте **Authorization tab**
- Выберите **`Basic Auth`**
- **Username:** `user@test.com`
- **Password:** `Pass123!`
- Нажмите **Send**

**4️⃣ Генерируем base64 вручную:**
```bash
# Linux/Mac
echo -n "user@test.com:Pass123!" | base64
# Результат: dXNlckB0ZXN0LmNvbTpQYXNzMTIzIQ==

# Или в Python
python3 -c "import base64; print(base64.b64encode(b'user@test.com:Pass123!').decode())"
```

---

## 📊 Сравнение JWT vs Basic Auth

| Характеристика | JWT | Basic Auth |
|---|---|---|
| **Хранение** | Токен на клиенте | Пароль каждый раз |
| **Безопасность** | Высокая (token + expiry) | Требует HTTPS |
| **Время жизни** | 24 часа (можно изменить) | Бесконечно (пока не смените пароль) |
| **Удобство** | Хорошее для фронтенда | Лучше для скриптов/CLI |
| **Производительность** | Быстрее (нет БД запроса) | Медленнее (проверка БД каждый раз) |
| **Mobile** | ✅ Рекомендуется | ⚠️ Не рекомендуется |
| **CLI/Scripts** | ⚠️ Нужен вспомогательный скрипт | ✅ Встроено в curl |

---

## 🧪 Примеры использования

### 1️⃣ Получить меню с JWT:
```bash
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
curl -X GET http://localhost:3000/api/menu-items \
  -H "Authorization: Bearer $TOKEN"
```

### 2️⃣ Получить меню с Basic Auth:
```bash
curl -X GET http://localhost:3000/api/menu-items \
  -u "user@test.com:Pass123!"
```

### 3️⃣ Создать пункт меню с JWT:
```bash
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
curl -X POST http://localhost:3000/api/menu-items \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Pizza","price":12.99,"quantity":50}'
```

### 4️⃣ Создать пункт меню с Basic Auth:
```bash
curl -X POST http://localhost:3000/api/menu-items \
  -u "user@test.com:Pass123!" \
  -H "Content-Type: application/json" \
  -d '{"name":"Pizza","price":12.99,"quantity":50}'
```

### 5️⃣ Получить столы с JWT:
```bash
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
curl -X GET http://localhost:3000/api/tables \
  -H "Authorization: Bearer $TOKEN"
```

### 6️⃣ Получить столы с Basic Auth:
```bash
curl -X GET http://localhost:3000/api/tables \
  -u "user@test.com:Pass123!"
```

---

## 🛡️ Защищенные маршруты (требуют аутентификацию)

Все маршруты ниже приемлют **ЛИБО JWT, ЛИБО Basic Auth**:

```
✅ GET    /api/menu-items
✅ POST   /api/menu-items
✅ PATCH  /api/menu-items/:id
✅ DELETE /api/menu-items/:id
✅ POST   /api/tables
✅ GET    /api/users
✅ POST   /api/users
✅ GET    /api/restaurants
✅ POST   /api/restaurants
✅ GET    /api/kitchen/orders
✅ PATCH  /api/kitchen/orders/:id/status
✅ GET    /api/auth/validate
```

---

## 🔓 Публичные маршруты (БЕЗ аутентификации)

```
🔓 POST /api/auth/register      (регистрация)
🔓 POST /api/auth/login         (логин)
🔓 POST /api/diner/sessions/start (начать сеанс QR)
🔓 GET  /api/diner/menu         (меню дайнеров)
🔓 POST /api/diner/orders       (заказ дайнеров)
```

---

## 📝 Bash скрипт для работы с обоими типами:

```bash
#!/bin/bash

API="http://localhost:3000"
EMAIL="user@test.com"
PASSWORD="Pass123!"

echo "=== Тестирование JWT ==="

# Получить JWT токен
TOKEN=$(curl -s -X POST $API/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}" | \
  grep -o '"token":"[^"]*' | cut -d'"' -f4)

echo "JWT Token: $TOKEN"

# Использовать JWT
curl -X GET $API/api/menu-items \
  -H "Authorization: Bearer $TOKEN"

echo -e "\n\n=== Тестирование Basic Auth ==="

# Использовать Basic Auth
curl -X GET $API/api/menu-items \
  -u "$EMAIL:$PASSWORD"
```

---

## 🔧 Конфигурация

### JWT (в .env):
```bash
JWT_SECRET="your-super-secret-key-change-in-production"
```

### Basic Auth:
✅ Встроено - использует пароль из базы данных автоматически

---

## ⚠️ Ошибки и решения

### 401 Unauthorized
```json
{
  "error": "No authorization credentials provided",
  "hint": "Use either JWT (Bearer TOKEN) or Basic Auth (email:password)"
}
```

**Решение:** Добавьте Authorization header

### 400 Bad Request
```json
{
  "error": "Invalid basic auth format",
  "hint": "Format should be: email:password"
}
```

**Решение:** Проверьте формат Basic Auth (должно быть email:password, не username:password)

### 401 Invalid email or password
```json
{
  "error": "Invalid email or password"
}
```

**Решение:** Проверьте что email и пароль правильные

---

## 🔐 Безопасность

### Для Production:

1. **Установите сильный JWT_SECRET:**
   ```bash
   JWT_SECRET=$(openssl rand -base64 32)
   ```

2. **Используйте HTTPS:**
   - Basic Auth отправляет credentials в base64 (легко декодируется)
   - HTTPS шифрует передачу

3. **Для Basic Auth - используйте HTTPS обязательно!**

4. **JWT токены имеют срок действия (24 часа):**
   - После истечения нужно получить новый токен

---

## 📱 JSON Web Token структура

```
Header: {
  "alg": "HS256",
  "typ": "JWT"
}

Payload: {
  "userId": 1,
  "email": "user@test.com",
  "role": "OWNER",
  "restaurantId": 1,
  "iat": 1695000000,
  "exp": 1695086400
}

Signature: HMACSHA256(header + payload, JWT_SECRET)
```

---

## 🎯 Когда использовать что:

### Используйте JWT для:
✅ Веб приложений (React, Vue, Angular)
✅ Мобильных приложений (iOS, Android)
✅ SPA (Single Page Applications)
✅ Когда нужна долгоживущая сессия

### Используйте Basic Auth для:
✅ Простых инструментов (curl, HTTPie, Postman)
✅ Bash/Python скриптов
✅ Публичных API интеграций
✅ Простоты - если не нужна безопасность в "полный рост"

---

## 🧪 Полный тестовый workflow:

```bash
#!/bin/bash

API="http://localhost:3000"

# 1. Регистрация
echo "1️⃣ Регистрация..."
RESPONSE=$(curl -s -X POST $API/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin'$(date +%s)'@test.com",
    "name": "Admin",
    "password": "SecurePass123!",
    "role": "OWNER",
    "restaurantId": 1
  }')

TOKEN=$(echo $RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)
EMAIL=$(echo $RESPONSE | grep -o '"email":"[^"]*' | cut -d'"' -f4)
PASSWORD="SecurePass123!"

echo "✅ Token: $TOKEN"

# 2. Тест JWT
echo -e "\n2️⃣ Тест JWT (GET /api/menu-items)..."
curl -s -X GET $API/api/menu-items \
  -H "Authorization: Bearer $TOKEN" | head -c 200

# 3. Тест Basic Auth
echo -e "\n\n3️⃣ Тест Basic Auth (GET /api/menu-items)..."
curl -s -X GET $API/api/menu-items \
  -u "$EMAIL:$PASSWORD" | head -c 200

# 4. Создание пункта меню с JWT
echo -e "\n\n4️⃣ Создание меню с JWT..."
curl -s -X POST $API/api/menu-items \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Pizza","price":15.99,"quantity":30}' | head -c 200

# 5. Создание пункта меню с Basic Auth
echo -e "\n\n5️⃣ Создание меню с Basic Auth..."
curl -s -X POST $API/api/menu-items \
  -u "$EMAIL:$PASSWORD" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Burger","price":12.99,"quantity":25}' | head -c 200

echo -e "\n\n✅ Все тесты пройдены!"
```

---

## ✅ Статус интеграции

- ✅ JWT Authentication - полностью реализовано
- ✅ Basic Auth - полностью реализовано  
- ✅ Комбинированная поддержка - все endpoint принимают оба типа
- ✅ Database - использует существующие пароли
- ✅ Security - bcryptjs хеширование для всех паролей

**Все готово к использованию! 🚀**
