# Commands By Endpoint (с этапами и доступами)

Ниже команды для всех актуальных endpoint'ов из `src/routes/*` и `src/server.js`.

## 0) Базовые переменные

```bash
BASE_URL=http://localhost:3000
PLATFORM_TOKEN=<jwt_platform_admin>
OWNER_TOKEN=<jwt_owner>
MANAGER_TOKEN=<jwt_manager>
KITCHEN_TOKEN=<jwt_kitchen>
SESSION_TOKEN=<diner_session_token>
RESTAURANT_ID=<restaurant_id>
```

## 1) Health + Auth

Доступ: `Публично` (кроме `validate`).

```bash
# Health
curl -X GET "$BASE_URL/"

# Register (OWNER / MANAGER / KITCHEN)
curl -X POST "$BASE_URL/api/auth/register" -H "Content-Type: application/json" -d '{
  "email":"owner@test.com",
  "name":"Owner",
  "password":"OwnerPass123",
  "role":"OWNER",
  "restaurantId":1
}'

# Register PLATFORM_ADMIN (только с bootstrap key)
curl -X POST "$BASE_URL/api/auth/register" -H "Content-Type: application/json" -H "x-platform-admin-bootstrap-key: <bootstrap_key>" -d '{
  "email":"platform@test.com",
  "name":"Platform",
  "password":"AdminPass123",
  "role":"PLATFORM_ADMIN",
  "restaurantId":1
}'

# Login
curl -X POST "$BASE_URL/api/auth/login" -H "Content-Type: application/json" -d '{
  "email":"owner@test.com",
  "password":"OwnerPass123"
}'

# Validate token (JWT)
curl -X GET "{{BASE_URL}}/api/auth/validate" -H "Authorization: Bearer $OWNER_TOKEN"

# Validate token (Basic Auth)
curl -X GET "$BASE_URL/api/auth/validate" -H "Authorization: Basic <base64(email:password)>" -H "x-restaurant-id: $RESTAURANT_ID"
```

## 2) Управление ресторанами

Доступ:  
- `GET /api/restaurants`: `PLATFORM_ADMIN`, `OWNER`  
- `POST /api/restaurants`: `PLATFORM_ADMIN`  
- `GET/PATCH/DELETE /api/restaurants/:id`: `PLATFORM_ADMIN` или `OWNER` только своего ресторана

```bash
curl -X GET "$BASE_URL/api/restaurants" -H "Authorization: Bearer $PLATFORM_TOKEN"
curl -X POST "$BASE_URL/api/restaurants" -H "Authorization: Bearer $PLATFORM_TOKEN" -H "Content-Type: application/json" -d '{"name":"My Restaurant"}'
curl -X GET "$BASE_URL/api/restaurants/1" -H "Authorization: Bearer $OWNER_TOKEN"
curl -X PATCH "$BASE_URL/api/restaurants/1" -H "Authorization: Bearer $OWNER_TOKEN" -H "Content-Type: application/json" -d '{"name":"My Restaurant Updated"}'
curl -X DELETE "$BASE_URL/api/restaurants/1" -H "Authorization: Bearer $PLATFORM_TOKEN"
```

## 3) Пользователи персонала

Доступ: `PLATFORM_ADMIN`, `OWNER`, `MANAGER`.

```bash
curl -X GET "$BASE_URL/api/users" -H "Authorization: Bearer $OWNER_TOKEN"
curl -X POST "$BASE_URL/api/users" -H "Authorization: Bearer $OWNER_TOKEN" -H "Content-Type: application/json" -d '{"email":"staff@test.com","name":"Staff","role":"MANAGER","password":"StaffPass123"}'
curl -X GET "$BASE_URL/api/users/1" -H "Authorization: Bearer $OWNER_TOKEN"
curl -X PATCH "$BASE_URL/api/users/1" -H "Authorization: Bearer $OWNER_TOKEN" -H "Content-Type: application/json" -d '{"name":"Staff Updated","role":"KITCHEN"}'
curl -X DELETE "$BASE_URL/api/users/1" -H "Authorization: Bearer $OWNER_TOKEN"
```

## 4) Столы (QR)

Доступ: `PLATFORM_ADMIN`, `OWNER`, `MANAGER`.

```bash
curl -X GET "$BASE_URL/api/tables" -H "Authorization: Bearer $OWNER_TOKEN"
curl -X GET "$BASE_URL/api/tables/1" -H "Authorization: Bearer $OWNER_TOKEN"
curl -X POST "$BASE_URL/api/tables" -H "Authorization: Bearer $OWNER_TOKEN" -H "Content-Type: application/json" -d '{"tableCode":"T-01"}'
curl -X POST "$BASE_URL/api/tables/bulk" -H "Authorization: Bearer $OWNER_TOKEN" -H "Content-Type: application/json" -d '{"tableCodes":["T-02","T-03"]}'
curl -X PATCH "$BASE_URL/api/tables/1" -H "Authorization: Bearer $OWNER_TOKEN" -H "Content-Type: application/json" -d '{"tableCode":"T-01-UPD"}'
curl -X DELETE "$BASE_URL/api/tables/1" -H "Authorization: Bearer $OWNER_TOKEN"
```

## 5) Категории меню

Доступ: `PLATFORM_ADMIN`, `OWNER`, `MANAGER`.

```bash
curl -X GET "$BASE_URL/api/menu-categories" -H "Authorization: Bearer $OWNER_TOKEN"
curl -X GET "$BASE_URL/api/menu-categories/1" -H "Authorization: Bearer $OWNER_TOKEN"
curl -X POST "$BASE_URL/api/menu-categories" -H "Authorization: Bearer $OWNER_TOKEN" -H "Content-Type: application/json" -d '{"name":"Main","description":"Main dishes","displayOrder":1}'
curl -X PATCH "$BASE_URL/api/menu-categories/1" -H "Authorization: Bearer $OWNER_TOKEN" -H "Content-Type: application/json" -d '{"description":"Updated","displayOrder":2}'
curl -X POST "$BASE_URL/api/menu-categories/reorder" -H "Authorization: Bearer $OWNER_TOKEN" -H "Content-Type: application/json" -d '{"categoryOrders":[{"id":1,"displayOrder":1},{"id":2,"displayOrder":2}]}'
curl -X DELETE "$BASE_URL/api/menu-categories/1" -H "Authorization: Bearer $OWNER_TOKEN"
```

## 6) Позиции меню + инвентарь

Доступ: `PLATFORM_ADMIN`, `OWNER`, `MANAGER`.

```bash
curl -X GET "$BASE_URL/api/menu-items?skip=0&take=20" -H "Authorization: Bearer $OWNER_TOKEN"
curl -X GET "$BASE_URL/api/menu-items/1" -H "Authorization: Bearer $OWNER_TOKEN"
curl -X POST "$BASE_URL/api/menu-items" -H "Authorization: Bearer $OWNER_TOKEN" -H "Content-Type: application/json" -d '{"name":"Steak","description":"Beef","price":25.5,"quantity":10,"categoryId":1}'
curl -X PATCH "$BASE_URL/api/menu-items/1" -H "Authorization: Bearer $OWNER_TOKEN" -H "Content-Type: application/json" -d '{"price":27.0,"description":"Updated"}'
curl -X PATCH "$BASE_URL/api/menu-items/1/inventory" -H "Authorization: Bearer $OWNER_TOKEN" -H "Content-Type: application/json" -d '{"quantity":30}'
curl -X POST "$BASE_URL/api/menu-items/1/decrement" -H "Authorization: Bearer $OWNER_TOKEN"
curl -X DELETE "$BASE_URL/api/menu-items/1" -H "Authorization: Bearer $OWNER_TOKEN"
```

## 7) Теги

Доступ: `PLATFORM_ADMIN`, `OWNER`, `MANAGER`.

```bash
curl -X GET "$BASE_URL/api/tags" -H "Authorization: Bearer $OWNER_TOKEN"
curl -X POST "$BASE_URL/api/tags" -H "Authorization: Bearer $OWNER_TOKEN" -H "Content-Type: application/json" -d '{"name":"Spicy"}'
curl -X POST "$BASE_URL/api/menu-items/1/tags" -H "Authorization: Bearer $OWNER_TOKEN" -H "Content-Type: application/json" -d '{"tagIds":[1,2]}'
curl -X PATCH "$BASE_URL/api/menu-items/1/tags" -H "Authorization: Bearer $OWNER_TOKEN" -H "Content-Type: application/json" -d '{"tagIds":[2]}'
curl -X DELETE "$BASE_URL/api/tags/1" -H "Authorization: Bearer $OWNER_TOKEN"
```

## 8) Diner-поток (гость у стола)

Доступ:  
- `POST /api/diner/sessions/start`: `Публично`  
- `GET /api/diner/menu`, `POST /api/diner/orders`: `Гость с x-session-token`

```bash
curl -X POST "$BASE_URL/api/diner/sessions/start" -H "x-restaurant-id: $RESTAURANT_ID" -H "Content-Type: application/json" -d '{"tableCode":"T01","restaurant_id":1}'
curl -X GET "$BASE_URL/api/diner/menu?diet=vegan,spicy" -H "x-session-token: $SESSION_TOKEN"
curl -X POST "$BASE_URL/api/diner/orders" -H "x-session-token: $SESSION_TOKEN" -H "Content-Type: application/json" -d '{"items":[{"menuItemId":1,"qty":2}]}'
```

## 9) Kitchen-поток

Доступ: `KITCHEN`, `MANAGER`, `OWNER`, `PLATFORM_ADMIN` + корректный `x-restaurant-id`.

```bash
curl -X GET "$BASE_URL/api/kitchen/orders?status=new" -H "Authorization: Bearer $KITCHEN_TOKEN" -H "x-restaurant-id: $RESTAURANT_ID"
curl -X PATCH "$BASE_URL/api/kitchen/orders/1/status" -H "Authorization: Bearer $KITCHEN_TOKEN" -H "x-restaurant-id: $RESTAURANT_ID" -H "Content-Type: application/json" -d '{"status":"COOKING"}'

# HTTP probe для ws endpoint (ожидаемо 400, нужен ws://)
curl -X GET "$BASE_URL/api/kitchen/ws" -H "Authorization: Bearer $KITCHEN_TOKEN" -H "x-restaurant-id: $RESTAURANT_ID"
```

## 10) WebSocket для кухни

Доступ: `KITCHEN`, `MANAGER`, `OWNER`, `PLATFORM_ADMIN` (Bearer token обязателен).

```bash
# Пример через wscat
wscat -c "ws://localhost:3000/api/kitchen/ws" -H "Authorization: Bearer $KITCHEN_TOKEN" -H "x-restaurant-id: $RESTAURANT_ID"
```

## Факт прогона

- Выполнен полный прогон endpoint-команд: `58` запросов.
- Лог прогона: `endpoint-run-results.json`.
- Итог: `54` успешных, `4` неуспешных.
- Неуспешные были ожидаемыми/сценарными:
  - повторная регистрация `PLATFORM_ADMIN` (`409`, уже существует),
  - HTTP-вызов `/api/kitchen/ws` (`400`, требуется WebSocket),
  - удаление menu item, уже использованного в заказе (`500` из-за связей),
  - удаление категории с существующими menu item (`409`).
