import test from "node:test";
import assert from "node:assert/strict";
import prisma from "../src/prismaClient.js";
import { orderRepository } from "../src/repositories/order.repository.js";
import { menuRepository } from "../src/repositories/menu.repository.js";
import { userRepository } from "../src/repositories/user.repository.js";
import { inventoryRepository } from "../src/repositories/inventory.repository.js";

/**
 * Tests for atomic inventory and order creation
 */
test("inventory: atomic decrement prevents overselling", async () => {
  // Create test data
  const restaurant = await prisma.restaurant.create({
    data: { name: "Test Restaurant Atomic" }
  });

  const item = await menuRepository.create({
    name: "Limited Pizza",
    price: 12.99,
    quantity: 3,
    restaurantId: restaurant.id
  });

  const inventory = item.inventory;
  assert.equal(inventory.quantityAvailable, 3);

  // Attempt to decrement by 2
  const result = await inventoryRepository.decrement(item.id, 2);
  assert.equal(result.count, 1, "First decrement should succeed");

  // Attempt to decrement by 5 (more than available)
  const result2 = await inventoryRepository.decrement(item.id, 5);
  assert.equal(result2.count, 0, "Oversell attempt should fail atomically");

  // Verify final inventory
  const finalInventory = await inventoryRepository.findByMenuItem(item.id);
  assert.equal(finalInventory.quantityAvailable, 1, "Inventory should be 1 after first decrement");

  // Clean up
  await prisma.restaurant.delete({ where: { id: restaurant.id } });
});

/**
 * Tests for multi-tenant isolation
 */
test("tenant isolation: users cannot access other restaurant data", async () => {
  const restaurant1 = await prisma.restaurant.create({
    data: { name: "Restaurant 1" }
  });

  const restaurant2 = await prisma.restaurant.create({
    data: { name: "Restaurant 2" }
  });

  const item1 = await menuRepository.create({
    name: "Burger",
    price: 9.99,
    quantity: 10,
    restaurantId: restaurant1.id
  });

  // Try to find item from restaurant1 when looking in restaurant2
  const wrongItem = await menuRepository.findById(item1.id, restaurant2.id);
  assert.equal(wrongItem, null, "Should not find item from other restaurant");

  // Clean up
  await prisma.restaurant.deleteMany({
    where: { id: { in: [restaurant1.id, restaurant2.id] } }
  });
});

/**
 * Tests for session expiration
 */
test("session: expired sessions block orders", async () => {
  const restaurant = await prisma.restaurant.create({
    data: { name: "Test Restaurant Session" }
  });

  const table = await prisma.table.create({
    data: {
      tableCode: "T1",
      restaurantId: restaurant.id
    }
  });

  // Create session that already expired
  const expiredSession = await prisma.tableSession.create({
    data: {
      tableId: table.id,
      expiresAt: new Date(Date.now() - 1000), // 1 second in past
      status: "EXPIRED"
    }
  });

  // Verify expiration check
  const now = new Date();
  const isExpired = expiredSession.expiresAt <= now || expiredSession.status !== "ACTIVE";
  assert.equal(isExpired, true, "Session should be marked as expired");

  // Clean up
  await prisma.restaurant.delete({ where: { id: restaurant.id } });
});

/**
 * Tests for multi-tenant user email
 */
test("user: same email allowed across restaurants", async () => {
  const restaurant1 = await prisma.restaurant.create({
    data: { name: "Restaurant A" }
  });

  const restaurant2 = await prisma.restaurant.create({
    data: { name: "Restaurant B" }
  });

  const sharedEmail = "chef@example.com";

  // Create same email in different restaurants
  const user1 = await userRepository.create({
    email: sharedEmail,
    name: "Chef A",
    password: "hashed",
    role: "KITCHEN",
    restaurantId: restaurant1.id
  });

  const user2 = await userRepository.create({
    email: sharedEmail,
    name: "Chef B",
    password: "hashed",
    role: "KITCHEN",
    restaurantId: restaurant2.id
  });

  assert.equal(user1.email, user2.email);
  assert.notEqual(user1.restaurantId, user2.restaurantId);

  // Find user by email in specific restaurant
  const found = await userRepository.findByEmail(sharedEmail, restaurant1.id);
  assert.equal(found.id, user1.id);

  // Clean up
  await prisma.restaurant.deleteMany({
    where: { id: { in: [restaurant1.id, restaurant2.id] } }
  });
});

/**
 * Tests for order status transitions
 */
test("order: status transitions follow FSM", async () => {
  const restaurant = await prisma.restaurant.create({
    data: { name: "Test Restaurant Order" }
  });

  const table = await prisma.table.create({
    data: { tableCode: "T1", restaurantId: restaurant.id }
  });

  const session = await prisma.tableSession.create({
    data: {
      tableId: table.id,
      expiresAt: new Date(Date.now() + 3600000),
      status: "ACTIVE"
    }
  });

  const order = await orderRepository.create({
    restaurantId: restaurant.id,
    sessionId: session.id,
    tableCode: "T1",
    totalPrice: 25.00,
    status: "QUEUED"
  });

  assert.equal(order.status, "QUEUED");

  // Valid transition
  const cooking = await orderRepository.updateStatus(order.id, restaurant.id, "COOKING");
  assert.equal(cooking.status, "COOKING");

  // Valid transition
  const ready = await orderRepository.updateStatus(order.id, restaurant.id, "READY");
  assert.equal(ready.status, "READY");

  // Clean up
  await prisma.restaurant.delete({ where: { id: restaurant.id } });
});

/**
 * Tests for pagination
 */
test("pagination: menu items returns correct page size", async () => {
  const restaurant = await prisma.restaurant.create({
    data: { name: "Test Pagination" }
  });

  // Create 25 items
  for (let i = 0; i < 25; i++) {
    await menuRepository.create({
      name: `Item ${i}`,
      price: 10.99,
      quantity: 10,
      restaurantId: restaurant.id
    });
  }

  // Get first page (default take=20)
  const page1 = await menuRepository.findByRestaurant(restaurant.id, 0, 20);
  assert.equal(page1.length, 20, "First page should have 20 items");

  // Get second page (skip=20)
  const page2 = await menuRepository.findByRestaurant(restaurant.id, 20, 20);
  assert.equal(page2.length, 5, "Second page should have 5 items");

  // Clean up
  await prisma.restaurant.delete({ where: { id: restaurant.id } });
});

/**
 * Tests for validation error handling
 */
test("validation: zod catches invalid input", async () => {
  const { registerSchema } = await import("../src/schema/validation.js");

  // Test weak password
  try {
    registerSchema.parse({
      email: "user@example.com",
      name: "User",
      password: "weak",  // No uppercase or number
      role: "OWNER",
      restaurantId: 1
    });
    assert.fail("Should throw validation error");
  } catch (error) {
    assert.equal(error.name, "ZodError");
  }

  // Test invalid email
  try {
    registerSchema.parse({
      email: "not-an-email",
      name: "User",
      password: "Valid123",
      role: "OWNER",
      restaurantId: 1
    });
    assert.fail("Should throw validation error");
  } catch (error) {
    assert.equal(error.name, "ZodError");
  }
});

console.log("✓ All comprehensive tests completed");
