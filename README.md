# Digital Menu API

## Base URL
- http://localhost:3000

## Headers
- `x-restaurant-id`: required for tenant admin and kitchen routes
- `x-session-token`: required for diner session-scoped routes

## Endpoints

### Tenant Admin
- `GET /api/restaurants`
- `POST /api/restaurants`
- `GET /api/menu-items`
- `POST /api/menu-items`
- `PATCH /api/menu-items/:id`
- `DELETE /api/menu-items/:id`
- `POST /api/menu-items/:id/decrement`
- `GET /api/tags`
- `POST /api/tags`
- `POST /api/menu-items/:id/tags`
- `PATCH /api/menu-items/:id/tags`
- `POST /api/tables`
- `GET /api/users`
- `POST /api/users`

### Diner
- `POST /api/diner/sessions/start?table_code=...`
- `GET /api/diner/menu?diet=tag1,tag2`
- `POST /api/diner/orders`

### Kitchen
- `GET /api/kitchen/orders`
- `PATCH /api/kitchen/orders/:id/status`

## Notes
- `diet` filter matches tag names.
- `PATCH /api/menu-items/:id/tags` replaces all tags for the item.
