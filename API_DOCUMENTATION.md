# Digital Menu API - Complete Implementation Guide

## Overview

This is a comprehensive digital menu and order management system built with Node.js, Express, Prisma, and PostgreSQL. It supports:

- **Multi-tenant restaurant management** (complete isolation)
- **Role-based access control** (Owner, Manager, Kitchen Staff)
- **Real-time WebSocket notifications** for kitchen staff
- **Atomic inventory transactions** (prevents overselling)
- **QR code generation** for table sessions
- **Automatic session expiration** management
- **Full menu categorization and tagging**

## Project Structure

```
src/
├── controllers/
│   ├── auth.controller.js          # User registration and login
│   ├── menu.controller.js          # Menu items, categories, tags
│   ├── menuCategory.controller.js  # Category CRUD
│   ├── table.controller.js         # Table management with QR codes
│   ├── diner/
│   │   ├── menu.controller.js      # Public menu API for guests
│   │   ├── order.controller.js     # Guest order creation
│   │   └── session.controller.js   # Session start for guests
│   └── kitchen/
│       └── queue.controller.js     # Kitchen order queue
├── middleware/
│   ├── authorizeRole.js            # Role-based authorization
│   ├── validateJWT.js              # JWT validation
│   ├── validateTableSession.js     # Table session validation
│   └── tenant.middleware.js        # Tenant isolation
├── services/
│   ├── notification.service.js     # WebSocket notifications
│   ├── qrCode.service.js           # QR code generation
│   └── sessionExpiration.service.js # Background session cleanup
└── routes/
    ├── auth.routes.js              # Authentication endpoints
    ├── diner.routes.js             # Guest-facing endpoints
    ├── kitchen.routes.js           # Kitchen management
    ├── menu.routes.js              # Menu management API
    ├── tables.routes.js            # Table management API
    └── ...
```

---

## DEVELOPER A: Backend Architecture & Admin API

### 1. Database Schema & Tenant Isolation

#### Key Models:
- **Restaurant**: Multi-tenant container
- **User**: Staff users (OWNER, MANAGER, KITCHEN)
- **MenuCategory**: Organize menu items
- **MenuItem**: Individual dishes
- **Inventory**: Track quantity_available atomically
- **Table**: Restaurant tables with unique tableCode
- **Order**: Customer orders (status: QUEUED→COOKING→READY→SERVED)
- **TableSession**: Guest session with expiration

#### Tenant Isolation:
Every admin API endpoint automatically filters by `restaurantId` from JWT token:

```javascript
// Example: All menu items are scoped to the authenticated restaurant
router.get("/menu-items", authorizeOwnerOrManager, async (req, res) => {
  const items = await prisma.menuItem.findMany({
    where: {
      restaurantId: req.restaurantId  // ← Automatic filtering
    }
  });
});
```

### 2. Admin API Endpoints

#### Authentication
```bash
POST /api/auth/register
{
  "email": "owner@restaurant.com",
  "name": "Owner Name",
  "password": "SecurePass123!",
  "role": "OWNER",
  "restaurantId": 1
}

POST /api/auth/login
{
  "email": "owner@restaurant.com",
  "password": "SecurePass123!"
}
Response: { token: "jwt_token_here", user: {...} }
```

#### Menu Categories (Admin Only)
```bash
# Get all categories
GET /api/menu-categories
Headers: Authorization: Bearer {token}

# Create category
POST /api/menu-categories
{
  "name": "Appetizers",
  "description": "Starter dishes",
  "displayOrder": 1
}

# Update category
PATCH /api/menu-categories/{id}
{
  "name": "Updated Name",
  "displayOrder": 2
}

# Delete category
DELETE /api/menu-categories/{id}

# Reorder categories
POST /api/menu-categories/reorder
{
  "categoryOrders": [
    { "id": 1, "displayOrder": 1 },
    { "id": 2, "displayOrder": 2 }
  ]
}
```

#### Menu Items Management (Admin Only)
```bash
# Get all menu items
GET /api/menu-items
Headers: Authorization: Bearer {token}

# Get single item
GET /api/menu-items/{id}

# Create menu item
POST /api/menu-items
{
  "name": "Grilled Salmon",
  "description": "Fresh Atlantic salmon",
  "price": 24.99,
  "quantity": 50,
  "categoryId": 1
}

# Update menu item
PATCH /api/menu-items/{id}
{
  "name": "New Name",
  "price": 25.99,
  "quantity": 40,
  "description": "Updated description"
}

# Update inventory (ATOMIC operation)
PATCH /api/menu-items/{id}/inventory
{
  "quantityAvailable": 30
}
# This atomically updates both Inventory and MenuItem tables

# Decrement inventory
POST /api/menu-items/{id}/decrement
{
  "amount": 5  # Decrements by 5 units atomically
}

# Delete item
DELETE /api/menu-items/{id}
```

#### Inventory Transactions

The system uses atomic Prisma transactions to guarantee:
- **No overselling**: `quantityAvailable: { gte: qty }` ensures stock exists
- **Consistency**: Both Inventory and MenuItem are updated together
- **Isolation**: Concurrent requests don't cause race conditions

```javascript
// Example: Atomic inventory decrement during order creation
const updated = await tx.inventory.updateMany({
  where: {
    menuItemId: dish.id,
    quantityAvailable: { gte: qty }  // ← Only update if enough stock
  },
  data: {
    quantityAvailable: { decrement: qty }
  }
});

if (updated.count === 0) {
  throw new Error("Out of stock");  // ← Transaction rolled back
}
```

#### Tags Management
```bash
# Get all tags
GET /api/tags

# Create tag
POST /api/tags
{
  "name": "Vegan"
}

# Add tags to menu item
POST /api/menu-items/{id}/tags
{
  "tagIds": [1, 2, 3]  # Can add multiple tags
}

# Replace all tags for menu item
PATCH /api/menu-items/{id}/tags
{
  "tagIds": [2, 4]  # Replaces existing tags
}

# Delete tag
DELETE /api/tags/{id}
```

### 3. Table Management with QR Code Generation

#### Table CRUD
```bash
# Get all tables
GET /api/tables
Response includes QR code for each table

# Get single table with QR code
GET /api/tables/{id}
{
  "id": 1,
  "tableCode": "T01",
  "restaurantId": 1,
  "qrCode": {
    "qrUrl": "data:image/png;base64,iVBORw0KGg...",
    "sessionUrl": "http://localhost:3000/api/diner/sessions/start?restaurant_id=1&table_code=T01"
  }
}

# Create single table
POST /api/tables
{
  "tableCode": "T05"
}

# Create multiple tables (bulk)
POST /api/tables/bulk
{
  "tableCodes": ["T01", "T02", "T03", "T04"]
}

# Update table
PATCH /api/tables/{id}
{
  "tableCode": "T01-Updated"
}

# Delete table
DELETE /api/tables/{id}
```

#### QR Code Usage
The QR code encodes the session start URL:
```
http://localhost:3000/api/diner/sessions/start?restaurant_id=1&table_code=T01
```

When a guest scans the QR code, they:
1. GET the session start endpoint
2. Receive a session token with 2-hour expiration
3. Use that token to view the menu and place orders

### 4. Role-Based Authorization

Three roles with increasing permissions:

```javascript
Role.KITCHEN   // Can only view and update order statuses
Role.MANAGER   // Manage menu, tables, inventory
Role.OWNER     // Full admin access
```

**Authorization Examples:**
```bash
# Only OWNER and MANAGER can manage menu
router.patch("/menu-items/:id", authorizeOwnerOrManager, updateMenuItem)

# Only KITCHEN can update order status (actually KITCHEN + header check)
router.patch("/kitchen/orders/:id/status", updateOrderStatus)
```

---

## DEVELOPER B: Product & Flow

### 1. Session Management (Guest Session Flow)

#### Start Session (No Auth Required)
```bash
POST /api/diner/sessions/start
{
  "tableCode": "T01",
  "restaurantId": 1
}
# OR use: ?restaurant_id=1&table_code=T01

Response:
{
  "token": "uuid-session-token",
  "expiresAt": "2026-03-20T15:35:00Z"
}
# Session valid for 2 hours
```

#### Session Token Usage
For all guest endpoints, include session token:
```bash
# Option 1: Header
GET /api/diner/menu
Headers: x-session-token: {token}

# Option 2: Query parameter
GET /api/diner/menu?session_token={token}

# Option 3: Request body
GET /api/diner/menu
{
  "sessionToken": "{token}"
}
```

#### Automatic Session Expiration
```javascript
// Background job runs every 5 minutes
startSessionCleanupJob()

// Marks expired sessions as EXPIRED in database
// Old session tokens automatically rejected
```

### 2. Guest Menu API

#### Get Menu (with Tag Filtering)
```bash
GET /api/diner/menu
Headers: x-session-token: {token}

# With tag filtering (comma-separated)
GET /api/diner/menu?diet=vegan,spicy
Headers: x-session-token: {token}

Response:
[
  {
    "id": 1,
    "name": "Caesar Salad",
    "price": 12.99,
    "quantity": 45,
    "categoryId": 1,
    "tags": [
      { "tag": { "id": 5, "name": "vegan" } }
    ],
    "inventory": {
      "quantityAvailable": 45
    }
  }
]
```

### 3. Order Placement with Atomic Inventory

#### Create Order
```bash
POST /api/diner/orders
Headers: x-session-token: {token}
{
  "items": [
    { "menuItemId": 1, "qty": 2 },
    { "menuItemId": 5, "qty": 1 }
  ]
}

Response:
{
  "success": true,
  "order": {
    "id": 42,
    "tableCode": "T01",
    "status": "QUEUED",
    "totalPrice": 50.97,
    "items": [
      {
        "menuItemId": 1,
        "quantity": 2,
        "priceSnapshot": 12.99
      }
    ],
    "createdAt": "2026-03-20T13:26:00Z"
  }
}
```

#### Order Processing Flow

1. **Atomic Inventory Deduction**:
   - Check if quantity available ≥ requested
   - If yes: decrement atomically
   - If no: return 400 "Out of stock"

2. **Order Creation**:
   - Create Order record with status: QUEUED
   - Create OrderItem records
   - Calculate totalPrice

3. **Real-Time Notification**:
   - Kitchen staff receive order via WebSocket
   - Display order in queue automatically

### 4. Kitchen Queue API

#### Get Active Orders
```bash
GET /api/kitchen/orders
Headers: 
  Authorization: Bearer {jwt_token}
  x-restaurant-id: 1

Response: Array of orders with status in [QUEUED, COOKING, READY]
[
  {
    "id": 42,
    "tableCode": "T01",
    "status": "QUEUED",
    "totalPrice": 50.97,
    "items": [
      {
        "menuItemId": 1,
        "quantity": 2,
        "menuItem": {"id": 1, "name": "Caesar Salad"}
      }
    ],
    "session": {
      "table": {"tableCode": "T01"}
    },
    "createdAt": "2026-03-20T13:26:00Z"
  }
]
```

#### Update Order Status
```bash
PATCH /api/kitchen/orders/{id}/status
Headers: 
  Authorization: Bearer {jwt_token}
  x-restaurant-id: 1

{
  "status": "COOKING"  # QUEUED → COOKING → READY → SERVED
}

Response: Updated order object
# WebSocket notification automatically sent to all kitchen staff
```

#### Status Transitions
```
QUEUED  →  COOKING  →  READY  →  SERVED
```

### 5. Real-Time Notifications (WebSocket)

#### Connect to WebSocket
```javascript
// Client-side example
const restaurantId = 1;
const token = "jwt_token_here";

const ws = new WebSocket(`ws://localhost:3000/api/kitchen/ws`, {
  headers: {
    "x-restaurant-id": restaurantId,
    "authorization": `Bearer ${token}`
  }
});

ws.onopen = () => {
  console.log("Connected to kitchen notifications");
};

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  
  if (message.type === "NEW_ORDER") {
    console.log("New order:", message.data);
    // Update UI with new order in queue
  } else if (message.type === "ORDER_STATUS_UPDATE") {
    console.log(`Order ${message.orderId} is now ${message.status}`);
    // Update order status in UI
  } else if (message.type === "INVENTORY_UPDATE") {
    console.log(`Item ${message.menuItemId} now has ${message.quantityAvailable} units`);
    // Update inventory display
  }
};

ws.onclose = () => {
  console.log("Disconnected from kitchen notifications");
};
```

#### Message Types

**1. New Order**
```json
{
  "type": "NEW_ORDER",
  "timestamp": "2026-03-20T13:26:00Z",
  "data": {
    "id": 42,
    "tableCode": "T01",
    "status": "QUEUED",
    "items": [{"menuItemId": 1, "quantity": 2}]
  }
}
```

**2. Order Status Update**
```json
{
  "type": "ORDER_STATUS_UPDATE",
  "timestamp": "2026-03-20T13:27:00Z",
  "orderId": 42,
  "status": "COOKING"
}
```

**3. Inventory Update**
```json
{
  "type": "INVENTORY_UPDATE",
  "timestamp": "2026-03-20T13:28:00Z",
  "menuItemId": 1,
  "quantityAvailable": 43
}
```

---

## Security Features

### 1. Tenant Isolation
- Every request scoped to `restaurantId`
- Impossible to access another restaurant's data
- Header validation: `x-restaurant-id`

### 2. Authentication
- JWT tokens for staff (24-hour expiration)
- Session tokens for guests (2-hour expiration)
- Passwords hashed with bcryptjs

### 3. Authorization
- Role-based access control (OWNER, MANAGER, KITCHEN)
- Endpoint-level middleware checks
- Example: Only OWNER/MANAGER can modify menu

### 4. Atomic Transactions
- Inventory never oversells
- Orders and inventory updates atomic
- Race conditions prevented

### 5. Session Management
- Guest sessions expire after 2 hours
- Background job cleans expired sessions
- Session status tracked (ACTIVE/EXPIRED)

---

## Database Transactions (Atomic Operations)

### Order Creation Transaction
```javascript
const newOrder = await prisma.$transaction(async (tx) => {
  // Step 1: Create order
  const order = await tx.order.create({...});

  // Step 2: For each item, atomically:
  for (const item of items) {
    // Ensure stock exists AND decrement atomically
    const updated = await tx.inventory.updateMany({
      where: {
        menuItemId: item.id,
        quantityAvailable: { gte: item.qty }  // ← Atomic check
      },
      data: { quantityAvailable: { decrement: item.qty } }
    });

    if (updated.count === 0) {
      throw new Error("Out of stock");  // ← Entire transaction rolls back
    }
  }

  return order;
});
// If any item is out of stock, entire order creation fails and rolls back
```

---

## Testing the API

### 1. Register Owner
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "owner@test.com",
    "name": "Restaurant Owner",
    "password": "SecurePass123!",
    "role": "OWNER",
    "restaurantId": 1
  }'
```

### 2. Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "owner@test.com",
    "password": "SecurePass123!"
  }'
# Returns: { token: "jwt_token", user: {...} }
```

### 3. Create Table
```bash
curl -X POST http://localhost:3000/api/tables \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer JWT_TOKEN" \
  -d '{
    "tableCode": "T01"
  }'
# Returns: table with QR code
```

### 4. Guest: Start Session
```bash
curl -X POST "http://localhost:3000/api/diner/sessions/start?restaurant_id=1&table_code=T01"
# Returns: { token: "session_token", expiresAt: "..." }
```

### 5. Guest: Get Menu
```bash
curl -X GET "http://localhost:3000/api/diner/menu?diet=vegan" \
  -H "x-session-token: SESSION_TOKEN"
```

### 6. Guest: Place Order
```bash
curl -X POST http://localhost:3000/api/diner/orders \
  -H "Content-Type: application/json" \
  -H "x-session-token: SESSION_TOKEN" \
  -d '{
    "items": [
      { "menuItemId": 1, "qty": 2 }
    ]
  }'
```

### 7. Kitchen: Get Orders
```bash
curl -X GET http://localhost:3000/api/kitchen/orders \
  -H "Authorization: Bearer JWT_TOKEN" \
  -H "x-restaurant-id: 1"
```

### 8. Kitchen: Update Order Status
```bash
curl -X PATCH http://localhost:3000/api/kitchen/orders/1/status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer JWT_TOKEN" \
  -H "x-restaurant-id: 1" \
  -d '{
    "status": "COOKING"
  }'
# WebSocket clients automatically notified
```

---

## Deployment Notes

### Environment Variables (.env)
```
DATABASE_URL=postgresql://user:password@localhost:5432/digital_menu
JWT_SECRET=your-super-secret-key-change-this
PORT=3000
```

### Running the Server
```bash
npm install        # Install dependencies
npm run dev        # Development with watch mode
npm start          # Production
```

### Database Setup
```bash
npx prisma migrate dev        # Apply migrations
npx prisma db push           # Push schema to database
npx prisma studio            # Open Prisma Studio GUI
```

---

## Architecture Highlights

### 1. Separation of Concerns
- **Controllers**: Business logic
- **Routes**: API definitions
- **Middleware**: Cross-cutting concerns
- **Services**: Shared utilities (QR, WebSocket, etc.)

### 2. Scalability
- JWT for stateless authentication
- Database connection pooling via Prisma
- WebSocket for real-time updates
- Background jobs for cleanup

### 3. Reliability
- Atomic transactions prevent data corruption
- Session expiration prevents stale tokens
- Error handling and validation on every endpoint
- Graceful WebSocket disconnection handling

---

## Future Enhancements

1. **Payment Integration**: Stripe/PayPal support
2. **Printer Integration**: Print kitchen tickets
3. **Customer Analytics**: Order history, preferences
4. **Loyalty Program**: Points and discounts
5. **Mobile App**: React Native client
6. **Push Notifications**: Order ready alerts
7. **Email Notifications**: Order confirmation
8. **Reservation System**: Book tables in advance
