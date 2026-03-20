# Речь для защиты проекта Digital Menu API

---

## 🏗️ РАЗРАБОТЧИК А: Архитектор и Back-office

### Вступление
Добрый день! Я разработчик А, отвечаю за архитектуру приложения, безопасность и систему управления контентом. Мой основной фокус - надежный фундамент, изоляция данных и администраторский интерфейс.

### 1️⃣ База данных и Изоляция (Tenant Isolation)

**Проблема:** В системе рестораны должны быть полностью изолированы друг от друга. История ресторана А никогда не должна быть видна ресторану Б.

**Решение:**
- Реализовал **полную мультитенант архитектуру** на уровне БД
- Каждый запрос автоматически фильтруется по `restaurantId` из JWT токена
- Невозможно обойти эту защиту благодаря middleware валидации

```javascript
// Пример: Товары ресторана всегда фильтруются
router.get("/menu-items", async (req, res) => {
  const items = await prisma.menuItem.findMany({
    where: {
      restaurantId: req.restaurantId  // ← Автоматическое ограничение
    }
  });
});
```

**Ключевые модели БД:**
- `Restaurant` - контейнер для всех данных ресторана
- `MenuItem` - блюда с категориями
- `MenuCategory` - организация меню
- `Inventory` - отслеживание количества
- `Table` - столы в ресторане
- `Order` - заказы гостей
- `User` - сотрудники с ролями

### 2️⃣ Система ролей и Авторизация

**3 уровня доступа:**
- **OWNER** - полный доступ (регистрация, управление ролями)
- **MANAGER** - меню, столы, инвентарь
- **KITCHEN** - только просмотр и обновление статуса заказов

```javascript
// Middleware проверяет роль перед каждым endpoint'ом
router.patch("/menu-items/:id", authorizeOwnerOrManager, updateMenuItem);
```

### 3️⃣ Панель управления (Admin API)

**Управление категориями:**
```
GET    /api/menu-categories           # Все категории
POST   /api/menu-categories           # Создать новую
PATCH  /api/menu-categories/{id}      # Обновить
DELETE /api/menu-categories/{id}      # Удалить
POST   /api/menu-categories/reorder   # Переупорядочить
```

**Управление товарами:**
```
GET    /api/menu-items/{id}           # Просмотр товара
POST   /api/menu-items                # Создать товар
PATCH  /api/menu-items/{id}           # Обновить свойства
DELETE /api/menu-items/{id}           # Удалить товар
PATCH  /api/menu-items/{id}/inventory # Обновить остатки
POST   /api/menu-items/{id}/decrement # Уменьшить на N единиц
```

**Управление столами с QR:**
```
GET    /api/tables                    # Все столы с QR кодами
POST   /api/tables                    # Создать стол
POST   /api/tables/bulk               # Создать несколько столов
PATCH  /api/tables/{id}               # Обновить
DELETE /api/tables/{id}               # Удалить
```

### 4️⃣ HARD PART: Атомарный Инвентарь

**Проблема:** При создании заказа нужно гарантировать, что товара действительно хватит. Если два заказа приходят одновременно на последний товар - нужно продать только одному.

**Решение: Prisma транзакции**

```javascript
const updated = await tx.inventory.updateMany({
  where: {
    menuItemId: dish.id,
    quantityAvailable: { gte: qty }  // ← Атомарная проверка + декремент
  },
  data: {
    quantityAvailable: { decrement: qty }
  }
});

if (updated.count === 0) {
  throw new Error("Out of stock");  // Вся транзакция откатывается
}
```

**Почему это работает:**
- Проверка и обновление - **одна операция** в БД (не два отдельных SQL запроса)
- Если товара нет → UPDATE ничего не обновляет → count === 0
- Вся транзакция откатывается → деньги не снимаются, товар не зарезервирован

### 5️⃣ Генерация QR кодов

**Логика:**
```
1. Администратор создает стол → POST /api/tables
2. система генерирует уникальный tableCode
3. Создается QR код с URL: http://localhost:3000/api/diner/sessions/start?restaurant_id=1&table_code=T01
4. Гость сканирует QR → получает session token на 2 часа
5. Может заказывать блюда
```

**Технически:**
- Используем `qrcode` библиотеку
- Каждый QR закодирует полный URL для начала сессии
- QR возвращается в формате data:image/png для отображения в браузере

### 📦 Мои файлы (Developer A):

```
src/
├── controllers/
│   ├── menuCategory.controller.js       ← Категории CRUD
│   ├── menu.controller.js               ← Товары CRUD, Теги, Инвентарь
│   └── table.controller.js              ← Столы с QR образами
├── middleware/
│   └── authorizeRole.js                 ← Role-based контроль доступа
├── routes/
│   ├── menu.routes.js                   ← Admin меню endpoints
│   └── tables.routes.js                 ← Admin столы endpoints
├── services/
│   └── qrCode.service.js                ← Генерация QR кодов
└── prisma/
    └── schema.prisma                    ← MenuCategory модель + миграция
```

### 🔐 Ключевые достижения:

✅ **Полная изоляция** - рестораны не видят данные друг друга
✅ **Атомарный инвентарь** - нет overselling даже при concurrent запросах
✅ **Простой CRUD** для администраторов - интуитивный API
✅ **QR коды** - гости легко начинают сессию
✅ **Role-based access** - разные уровни доступа для разных сотрудников

---

## 🎯 РАЗРАБОТЧИК Б: Product & Flow

### Вступление
Привет! Я разработчик Б, мой фокус на пользовательском опыте. Я реализовал весь жизненный цикл гостя - от сканирования QR до получения готового блюда, а также систему для кухни.

### 1️⃣ Сессия гостя и Menu API

**Жизненный цикл сессии:**

```
Гость приходит
    ↓
Сканирует QR на столе
    ↓
POST /api/diner/sessions/start?table_code=T01
    ↓
Получает session token (валиден 2 часа)
    ↓
Может просматривать меню и делать заказы
    ↓
Через 2 часа сессия автоматически истекает
    ↓
Старый токен больше не работает
```

**Получение меню с фильтрацией:**

```bash
GET /api/diner/menu?diet=vegan,spicy
Headers: x-session-token: {token}

Response: Только доступные блюда отфильтрованные по тегам
[
  {
    "id": 1,
    "name": "Vegan Pasta",
    "price": 14.99,
    "tags": [{ "tag": { "name": "vegan" } }],
    "quantity": 25  # Осталось 25 порций
  }
]
```

### 2️⃣ Создание заказа с гарантией наличия товара

**Процесс:**

```
Гость выбирает: 2x Caesar Salad, 1x Grilled Salmon
    ↓
POST /api/diner/orders с items[]
    ↓
Сервер ВНУТРИ ТРАНЗАКЦИИ:
  1. Создает Order запись
  2. Для каждого товара:
     - Проверяет: quantityAvailable >= требуемое количество
     - Если да: декрементирует инвентарь АТОМАРНО
     - Если нет: выбрасывает ошибку "Out of stock"
  3. Если все товары в наличии: закрепляет заказ
  4. Если хотя бы один товар кончился: откатывает всю транзакцию
    ↓
Гость получает подтвержденный заказ
```

**Пример ответа:**
```json
{
  "success": true,
  "order": {
    "id": 42,
    "tableCode": "T01",
    "status": "QUEUED",
    "totalPrice": 42.98,
    "items": [
      { "menuItemId": 1, "quantity": 2, "priceSnapshot": 12.99 },
      { "menuItemId": 5, "quantity": 1, "priceSnapshot": 16.00 }
    ]
  }
}
```

### 3️⃣ Kitchen Queue и Статус-машина

**Для кухни:**

```bash
GET /api/kitchen/orders
Headers: 
  Authorization: Bearer {jwt_token}
  x-restaurant-id: 1

Response: Все активные заказы
[
  {
    "id": 42,
    "tableCode": "T01",
    "status": "QUEUED",
    "items": [
      { "menuItem": { "name": "Caesar Salad" }, "quantity": 2 }
    ]
  }
]
```

**Обновление статуса:**
```
QUEUED  →  COOKING  →  READY  →  SERVED

PATCH /api/kitchen/orders/42/status
{ "status": "COOKING" }

→ WebSocket автоматически уведомляет
```

### 4️⃣ HARD PART: Real-Time WebSocket Уведомления

**Проблема:** Повар не должен перезагружать страницу, чтобы увидеть новый заказ. Нужны instant notifications.

**Решение: WebSocket сервер**

```javascript
// Кухня подключается к WebSocket
ws://localhost:3000/api/kitchen/ws

// Когда гость создает заказ:
notificationService.broadcastNewOrder(restaurantId, orderData);

// Повар МГНОВЕННО видит новый заказ БЕЗ F5
```

**Три типа событий:**

1. **NEW_ORDER** - новый заказ в очереди
```json
{
  "type": "NEW_ORDER",
  "timestamp": "2026-03-20T13:26:00Z",
  "data": { "id": 42, "tableCode": "T01", "items": [...] }
}
```

2. **ORDER_STATUS_UPDATE** - статус заказа изменился
```json
{
  "type": "ORDER_STATUS_UPDATE",
  "orderId": 42,
  "status": "COOKING"
}
```

3. **INVENTORY_UPDATE** - остатки товара изменились
```json
{
  "type": "INVENTORY_UPDATE",
  "menuItemId": 1,
  "quantityAvailable": 23
}
```

### 5️⃣ Автоматическое истечение сессий

**Проблема:** Гость ушел из ресторана. Его старый токен сессии не должен позволять делать новые заказы.

**Решение: Background job**

```javascript
// Фоновый job запускается при старте сервера
startSessionCleanupJob();

// Каждые 5 минут:
// 1. Находит все сессии где expiresAt < NOW()
// 2. Обновляет их status = "EXPIRED"
// 3. Старые токены автоматически отклоняются middleware
```

```javascript
// validateTableSession middleware:
if (session.status !== "ACTIVE" || session.expiresAt <= now) {
  return res.status(403).json({ error: "Session expired" });
}
```

### 📦 Мои файлы (Developer B):

```
src/
├── controllers/
│   └── diner/
│       ├── session.controller.js        ← Начало сессии (POST /sessions/start)
│       ├── menu.controller.js           ← Публичное меню (GET /menu)
│       └── order.controller.js          ← Создание заказа (POST /orders)
├── controllers/
│   └── kitchen/
│       └── queue.controller.js          ← Очередь кухни
├── middleware/
│   └── validateJWT.js                   ← validateTableSession для гостей
├── routes/
│   ├── diner.routes.js                  ← Гостевые endpoints
│   └── kitchen.routes.js                ← Кухонные endpoints
├── services/
│   ├── notification.service.js          ← WebSocket broadcasting
│   └── sessionExpiration.service.js     ← Background cleanup job
└── src/
    └── server.js                        ← WebSocket server setup
```

### 🔄 Полный жизненный цикл (мой фокус):

```
1. ГОСТЬ ПРИХОДИТ
   POST /api/diner/sessions/start
   ↓
2. ГОСТЬ СМОТРИТ МЕНЮ
   GET /api/diner/menu?diet=vegan
   ↓
3. ГОСТЬ ЗАКАЗЫВАЕТ
   POST /api/diner/orders
   ├─ Атомарная проверка инвентаря (от Developer A)
   └─ WebSocket уведомляет кухню
   ↓
4. ПОВАР ВИДИТ ЗАКАЗ (WebSocket)
   GET /api/kitchen/orders (актуально)
   ↓
5. ПОВАР ГОТОВИТ
   PATCH /api/kitchen/orders/42/status = "COOKING"
   └─ WebSocket уведомляет гостя (потом)
   ↓
6. БЛЮДО ГОТОВО
   PATCH /api/kitchen/orders/42/status = "READY"
   └─ WebSocket уведомляет гостя
   ↓
7. ГОСТЬ УШЕЛ / 2 ЧАСА ПРОШЛО
   Background job → session status = "EXPIRED"
   └─ Старый токен больше не работает
```

### 🎯 Ключевые достижения:

✅ **Seamless UX** - гостю просто, удобно, интуитивно
✅ **Real-time kitchen** - повар видит заказы без перезагрузки
✅ **Atomic ordering** - гарантировано не будет overselling
✅ **Auto-expiration** - сессии автоматически истекают
✅ **Fault tolerant** - если гость потеряет connection, его сессия еще валидна 2 часа

---

## 🤝 Как мы работали вместе

**Developer A (мне нужна какая-то функция):**
> "Нужна проверка в заказе что товара достаточно"

**Developer B:**
> "Отлично, ставлю вызов `tx.inventory.updateMany()` с `{ gte: qty }`, это атомарно?"

**Developer A:**
> "Точно! Это одна SQL операция, даже при race condition будет правильно"

---

## 📋 Общая архитектура системы

```
              АДМИН (Owner/Manager)
              ↓
    [Admin Panel] 
         ↓
    JWT Auth
         ↓
    /api/menu-* (CRUD)
    /api/tables/* (CRUD)
    /api/kitchen/* (Queue)
         ↓
    [Database] ← Tenant Isolation по restaurantId


              ГОСТЬ
              ↓
    [QR Code] → Стол
         ↓
    /api/diner/sessions/start
         ↓
    Session Token (2ч)
         ↓
    /api/diner/menu (+фильтры)
    /api/diner/orders (+инвентарь)
         ↓
    [Database + WebSocket]


              ПОВАР
              ↓
    JWT Auth
         ↓
    WebSocket: /api/kitchen/ws
         ↓
    Real-time NEW_ORDER, STATUS_UPDATE
         ↓
    /api/kitchen/orders (GET, PATCH status)
```

---

## 🎓 Что мы доказали

1. **Мультитенант архитектура** работает (полная изоляция)
2. **Авторизация на разных уровнях** - OWNER, MANAGER, KITCHEN все имеют правильный доступ
3. **Инвентарь НИКОГДА не будет oversold** благодаря atomic transactions
4. **WebSocket уведомления real-time** - без задержек
5. **SQL Injection защита** - используем Prisma параметризованные запросы
6. **Session security** - токены с истечением, автоматическая очистка

---

## 🚀 Как запустить тестирование

```bash
# 1. Регистрируем владельца ресторана
POST /api/auth/register
{ email, password, role: "OWNER", restaurantId: 1 }

# 2. Логинимся и получаем JWT
POST /api/auth/login
{ email, password }
→ { token: "jwt..." }

# 3. Создаем стол с QR кодом (Admin A)
POST /api/tables
Headers: Authorization: Bearer {jwt}
{ tableCode: "T01" }

# 4. Гость сканирует QR → начинает сессию (App B)
POST /api/diner/sessions/start?restaurant_id=1&table_code=T01
→ { token: "session-uuid", expiresAt: "..." }

# 5. Гость смотрит меню и заказывает (App B)
POST /api/diner/orders
Headers: x-session-token: {session-uuid}
{ items: [{ menuItemId: 1, qty: 2 }] }

# 6. Повар видит заказ в WebSocket и обновляет статус (App B)
PATCH /api/kitchen/orders/42/status
{ status: "COOKING" }
```

---

**Спасибо за внимание!** 🎉
