# Digital Menu API

A multi-tenant restaurant management API with real-time order tracking, JWT and Basic Auth support.

## Base URL
- http://localhost:3000

## Authentication

### JWT (Bearer Token)
```bash
curl -H "Authorization: Bearer {token}" http://localhost:3000/api/restaurants
```

### Basic Auth (email:password)
```bash
curl -u email@example.com:password http://localhost:3000/api/restaurants
```

Both methods are supported on all protected endpoints.

## Required Headers

- `x-restaurant-id`: Restaurant ID (required for protected admin endpoints)
- `Authorization`: JWT Bearer token OR Basic Auth (email:password in Base64)

## Project Structure

```
src/
├── controllers/          # HTTP request handlers
├── repositories/         # Database access layer (abstraction)
├── routes/              # Express route definitions
├── middleware/          # Authentication & validation
├── services/            # Business logic services
└── server.js            # Express app setup
```

## Authentication Flow

1. **Register**: `POST /api/auth/register` - Create account
2. **Login**: `POST /api/auth/login` - Get JWT token
3. **Use Token**: Include `Authorization: Bearer {token}` in protected requests
4. **Or Basic Auth**: Include `Authorization: Basic {base64(email:password)}` instead

## Endpoints

### Public Routes

#### Auth (No authentication required)
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login and get JWT token
- `GET /api/auth/validate` - Validate token (requires JWT or Basic Auth)

### Protected Routes (Requires JWT or Basic Auth + x-restaurant-id)

#### Restaurants (ADMIN only)
- `GET /api/restaurants` - List all restaurants
- `POST /api/restaurants` - Create restaurant
- `GET /api/restaurants/:id` - Get restaurant details
- `PATCH /api/restaurants/:id` - Update restaurant
- `DELETE /api/restaurants/:id` - Delete restaurant

#### Menu Items (OWNER/MANAGER)
- `GET /api/menu-items` - Get all menu items for restaurant
- `POST /api/menu-items` - Create menu item
- `GET /api/menu-items/:id` - Get menu item details
- `PATCH /api/menu-items/:id` - Update menu item
- `DELETE /api/menu-items/:id` - Delete menu item
- `POST /api/menu-items/:id/decrement` - Reduce inventory by 1

#### Menu Categories (OWNER/MANAGER)
- `GET /api/menu-categories` - Get all categories with items
- `POST /api/menu-categories` - Create category
- `GET /api/menu-categories/:id` - Get category details
- `PATCH /api/menu-categories/:id` - Update category
- `DELETE /api/menu-categories/:id` - Delete category
- `POST /api/menu-categories/reorder` - Reorder categories

#### Tags (OWNER/MANAGER)
- `GET /api/tags` - Get all tags
- `POST /api/tags` - Create tag
- `POST /api/menu-items/:id/tags` - Add tags to menu item
- `PATCH /api/menu-items/:id/tags` - Replace all tags for menu item
- `DELETE /api/tags/:id` - Delete tag

#### Tables (OWNER/MANAGER)
- `GET /api/tables` - Get all tables
- `POST /api/tables` - Create single table
- `GET /api/tables/:id` - Get table with QR code
- `PATCH /api/tables/:id` - Update table
- `DELETE /api/tables/:id` - Delete table
- `POST /api/tables/bulk` - Create multiple tables

#### Users (OWNER/MANAGER)
- `GET /api/users` - Get all users for restaurant
- `POST /api/users` - Create new user
- `GET /api/users/:id` - Get user details
- `PATCH /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

#### Diner (Table-based sessions)
- `POST /api/diner/sessions/start?table_code=...` - Start diner session from QR code
- `GET /api/diner/menu` - Get menu for active session
- `GET /api/diner/menu?diet=tag1,tag2` - Filter menu by dietary tags
- `POST /api/diner/orders` - Place order from active session
- `GET /api/diner/orders` - View orders for active session
- `GET /api/diner/sessions/:id` - Get session details

#### Kitchen Queue (KITCHEN staff)
- `GET /api/kitchen/orders` - Get active orders (QUEUED, COOKING, READY)
- `PATCH /api/kitchen/orders/:id/status` - Update order status
- `WebSocket /api/kitchen/ws` - Real-time order updates (upgrade connection to WS)

## Notes

- `diet` filter matches tag names
- `PATCH /api/menu-items/:id/tags` replaces all tags for the item
- Multi-tenant: All queries automatically filtered by `x-restaurant-id`
- Session tokens: Diner endpoints use separate session tokens, not JWT
