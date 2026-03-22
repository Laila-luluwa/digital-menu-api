import prisma from "../prismaClient.js";

export const menuCategoryRepository = {
  // Get all categories for restaurant
  findByRestaurant: async (restaurantId) => {
    return await prisma.menuCategory.findMany({
      where: { restaurantId },
      include: {
        menuItems: {
          include: {
            inventory: true,
            tags: { include: { tag: true } }
          }
        }
      },
      orderBy: { displayOrder: "asc" }
    });
  },

  // Get single category
  findById: async (id, restaurantId) => {
    return await prisma.menuCategory.findFirst({
      where: {
        id,
        restaurantId
      },
      include: {
        menuItems: {
          include: {
            inventory: true,
            tags: { include: { tag: true } }
          }
        }
      }
    });
  },

  // Create category
  create: async (data) => {
    return await prisma.menuCategory.create({
      data
    });
  },

  // Update category
  update: async (id, restaurantId, data) => {
    const updated = await prisma.menuCategory.updateMany({
      where: { id, restaurantId },
      data
    });

    if (updated.count === 0) {
      return null;
    }

    return await prisma.menuCategory.findFirst({
      where: { id, restaurantId },
      include: {
        menuItems: {
          include: {
            inventory: true,
            tags: { include: { tag: true } }
          }
        }
      }
    });
  },

  // Delete category
  delete: async (id, restaurantId) => {
    const deleted = await prisma.menuCategory.deleteMany({
      where: { id, restaurantId }
    });

    return deleted.count > 0;
  },

  // Check if name exists
  existsByName: async (name, restaurantId, excludeId = null) => {
    const where = {
      name,
      restaurantId
    };
    if (excludeId) {
      where.id = { not: excludeId };
    }
    return await prisma.menuCategory.findFirst({ where });
  },

  // Count items in category
  countItems: async (id, restaurantId) => {
    return await prisma.menuItem.count({
      where: {
        categoryId: id,
        restaurantId
      }
    });
  }
};
