/**
 * JWT Authentication Testing Examples
 * 
 * Run the server first:
 *   npm run dev
 * 
 * Then uncomment and run these examples in Node.js or use with Postman/cURL
 */

// ============================================
// 1. REGISTER A NEW USER
// ============================================

async function registerUser() {
  const response = await fetch('http://localhost:3000/api/auth/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      email: 'owner@restaurant.com',
      name: 'Restaurant Owner',
      password: 'SecurePass123!',
      role: 'OWNER',
      restaurantId: 1
    })
  });

  const data = await response.json();
  console.log('Register Response:', data);
  return data.token;
}

// Example cURL:
// curl -X POST http://localhost:3000/api/auth/register \
//   -H "Content-Type: application/json" \
//   -d '{
//     "email": "owner@restaurant.com",
//     "name": "Restaurant Owner",
//     "password": "SecurePass123!",
//     "role": "OWNER",
//     "restaurantId": 1
//   }'

// ============================================
// 2. LOGIN USER
// ============================================

async function loginUser() {
  const response = await fetch('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      email: 'owner@restaurant.com',
      password: 'SecurePass123!'
    })
  });

  const data = await response.json();
  console.log('Login Response:', data);
  return data.token; // Save this token for API calls
}

// Example cURL:
// curl -X POST http://localhost:3000/api/auth/login \
//   -H "Content-Type: application/json" \
//   -d '{
//     "email": "owner@restaurant.com",
//     "password": "SecurePass123!"
//   }'

// ============================================
// 3. VALIDATE TOKEN
// ============================================

async function validateToken(token) {
  const response = await fetch('http://localhost:3000/api/auth/validate', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  const data = await response.json();
  console.log('Validate Token Response:', data);
}

// Example cURL:
// curl -X GET http://localhost:3000/api/auth/validate \
//   -H "Authorization: Bearer YOUR_JWT_TOKEN"

// ============================================
// 4. GET MENU ITEMS (Protected Route)
// ============================================

async function getMenuItems(token) {
  const response = await fetch('http://localhost:3000/api/menu-items', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  const data = await response.json();
  console.log('Menu Items:', data);
}

// Example cURL:
// curl -X GET http://localhost:3000/api/menu-items \
//   -H "Authorization: Bearer YOUR_JWT_TOKEN"

// ============================================
// 5. CREATE MENU ITEM (Protected Route)
// ============================================

async function createMenuItem(token) {
  const response = await fetch('http://localhost:3000/api/menu-items', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: 'Margherita Pizza',
      price: 12.99,
      quantity: 50
    })
  });

  const data = await response.json();
  console.log('Created Menu Item:', data);
}

// Example cURL:
// curl -X POST http://localhost:3000/api/menu-items \
//   -H "Authorization: Bearer YOUR_JWT_TOKEN" \
//   -H "Content-Type: application/json" \
//   -d '{
//     "name": "Margherita Pizza",
//     "price": 12.99,
//     "quantity": 50
//   }'

// ============================================
// 6. CREATE TABLE (Protected Route)
// ============================================

async function createTable(token) {
  const response = await fetch('http://localhost:3000/api/tables', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  const data = await response.json();
  console.log('Created Table:', data);
  return data.table.tableCode; // Save this for QR code generation
}

// Example cURL:
// curl -X POST http://localhost:3000/api/tables \
//   -H "Authorization: Bearer YOUR_JWT_TOKEN" \
//   -H "Content-Type: application/json"

// ============================================
// 7. GET KITCHEN ORDERS (Protected Route)
// ============================================

async function getKitchenOrders(token) {
  const response = await fetch('http://localhost:3000/api/kitchen/orders', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  const data = await response.json();
  console.log('Kitchen Orders:', data);
}

// Example cURL:
// curl -X GET http://localhost:3000/api/kitchen/orders \
//   -H "Authorization: Bearer YOUR_JWT_TOKEN"

// ============================================
// 8. UPDATE ORDER STATUS (Protected Route)
// ============================================

async function updateOrderStatus(token, orderId) {
  const response = await fetch(`http://localhost:3000/api/kitchen/orders/${orderId}/status`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      status: 'COOKING'
    })
  });

  const data = await response.json();
  console.log('Updated Order:', data);
}

// Example cURL:
// curl -X PATCH http://localhost:3000/api/kitchen/orders/1/status \
//   -H "Authorization: Bearer YOUR_JWT_TOKEN" \
//   -H "Content-Type: application/json" \
//   -d '{"status": "COOKING"}'

// ============================================
// 9. DINER ENDPOINTS (Session-based, no JWT needed)
// ============================================

async function startDinerSession(tableCode) {
  const response = await fetch(
    `http://localhost:3000/api/diner/sessions/start?table_code=${tableCode}`,
    { method: 'POST' }
  );

  const data = await response.json();
  console.log('Session Started:', data);
  return data.token; // This is a session token, not JWT
}

// Example cURL:
// curl -X POST "http://localhost:3000/api/diner/sessions/start?table_code=abc123"

async function getDinerMenu(sessionToken) {
  const response = await fetch('http://localhost:3000/api/diner/menu', {
    method: 'GET',
    headers: {
      'X-Session-Token': sessionToken
    }
  });

  const data = await response.json();
  console.log('Diner Menu:', data);
}

// Example cURL:
// curl -X GET http://localhost:3000/api/diner/menu \
//   -H "X-Session-Token: YOUR_SESSION_TOKEN"

async function createDinerOrder(sessionToken, orderItems) {
  const response = await fetch('http://localhost:3000/api/diner/orders', {
    method: 'POST',
    headers: {
      'X-Session-Token': sessionToken,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      items: orderItems
    })
  });

  const data = await response.json();
  console.log('Order Created:', data);
}

// Example cURL:
// curl -X POST http://localhost:3000/api/diner/orders \
//   -H "X-Session-Token: YOUR_SESSION_TOKEN" \
//   -H "Content-Type: application/json" \
//   -d '{
//     "items": [
//       {
//         "menuItemId": 1,
//         "quantity": 2
//       }
//     ]
//   }'

// ============================================
// FULL WORKFLOW EXAMPLE
// ============================================

async function fullWorkflow() {
  console.log('=== ADMIN/STAFF WORKFLOW ===\n');

  // 1. Register or Login
  console.log('1. Logging in...');
  let token;
  try {
    token = await loginUser();
  } catch (err) {
    console.log('Login failed, trying to register...');
    token = await registerUser();
  }

  // 2. Validate token
  console.log('\n2. Validating token...');
  await validateToken(token);

  // 3. Get menu items
  console.log('\n3. Fetching menu items...');
  await getMenuItems(token);

  // 4. Create menu item
  console.log('\n4. Creating menu item...');
  await createMenuItem(token);

  // 5. Create table
  console.log('\n5. Creating table...');
  const tableCode = await createTable(token);

  // 6. Get kitchen orders
  console.log('\n6. Getting kitchen orders...');
  await getKitchenOrders(token);

  console.log('\n=== DINER WORKFLOW ===\n');

  // 7. Start diner session
  console.log('7. Starting diner session...');
  const sessionToken = await startDinerSession(tableCode);

  // 8. Get diner menu
  console.log('\n8. Getting diner menu...');
  await getDinerMenu(sessionToken);

  // 9. Create diner order
  console.log('\n9. Creating diner order...');
  await createDinerOrder(sessionToken, [
    { menuItemId: 1, quantity: 2 }
  ]);
}

// Uncomment to run the full workflow:
// fullWorkflow().catch(console.error);

module.exports = {
  registerUser,
  loginUser,
  validateToken,
  getMenuItems,
  createMenuItem,
  createTable,
  getKitchenOrders,
  updateOrderStatus,
  startDinerSession,
  getDinerMenu,
  createDinerOrder,
  fullWorkflow
};
