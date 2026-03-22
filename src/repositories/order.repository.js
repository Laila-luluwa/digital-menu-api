import prisma from "../prismaClient.js";

export const orderRepository = {
  // Find order by ID
  findById: async (id, restaurantId) => {
    return await prisma.order.findFirst({
      where: {
        id,
        restaurantId
      },
      include: {
        items: { include: { menuItem: true } },
        session: { include: { table: true } }
      }
    });
  },

  // Create new order
  create: async (data) => {
    return await prisma.order.create({
      data,
      include: {
        items: { include: { menuItem: true } },
        session: { include: { table: true } }
      }
    });
  },

  // Get orders for restaurant with status filter (with pagination)
  getActiveOrders: async (restaurantId, statuses = ["QUEUED", "COOKING", "READY"], skip = 0, take = 20) => {
    return await prisma.order.findMany({
      where: {
        restaurantId,
        status: { in: statuses }
      },
      include: {
        items: { include: { menuItem: true } },
        session: { include: { table: true } }
      },
      orderBy: { createdAt: "asc" },
      skip: Number(skip),
      take: Number(take)
    });
  },

  // Get all orders for restaurant
  findByRestaurant: async (restaurantId) => {
    return await prisma.order.findMany({
      where: { restaurantId },
      include: {
        items: { include: { menuItem: true } },
        session: { include: { table: true } }
      }
    });
  },

  // Update order status
  updateStatus: async (id, restaurantId, status) => {
    const updated = await prisma.order.updateMany({
      where: { id, restaurantId },
      data: { status }
    });

    if (updated.count === 0) {
      return null;
    }

    return await prisma.order.findFirst({
      where: { id, restaurantId },
      include: {
        items: { include: { menuItem: true } },
        session: { include: { table: true } }
      }
    });
  },

  // Update order total
  updateTotal: async (id, totalPrice) => {
    return await prisma.order.update({
      where: { id },
      data: { totalPrice }
    });
  },

  // Add item to order
  addItem: async (orderId, menuItemId, quantity, price) => {
    return await prisma.orderItem.create({
      data: {
        orderId,
        menuItemId,
        quantity,
        priceSnapshot: price
      },
      include: { menuItem: true }
    });
  },

  // Remove item from order
  removeItem: async (itemId) => {
    return await prisma.orderItem.delete({
      where: { id: itemId }
    });
  }
};
