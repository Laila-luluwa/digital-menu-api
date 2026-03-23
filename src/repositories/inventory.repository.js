import prisma from "../prismaClient.js";

export const inventoryRepository = {
  // Find inventory by menu item ID
  findByMenuItem: async (menuItemId) => {
    return await prisma.inventory.findUnique({
      where: { menuItemId }
    });
  },

  // Update inventory quantity
  updateQuantity: async (menuItemId, quantityAvailable) => {
    return await prisma.inventory.upsert({
      where: { menuItemId },
      update: { quantityAvailable },
      create: { menuItemId, quantityAvailable }
    });
  },

  // Decrement inventory
  decrement: async (menuItemId, amount) => {
    return await prisma.inventory.updateMany({
      where: {
        menuItemId,
        quantityAvailable: { gte: amount }
      },
      data: {
        quantityAvailable: { decrement: amount }
      }
    });
  }
};
