import prisma from "../prismaClient.js";

export const tagRepository = {
  // Get all tags for restaurant
  findByRestaurant: async (restaurantId) => {
    return await prisma.tag.findMany({
      where: { restaurantId },
      orderBy: { name: "asc" }
    });
  },

  // Find tag by ID
  findById: async (id) => {
    return await prisma.tag.findUnique({
      where: { id }
    });
  },

  findByIdsForRestaurant: async (ids, restaurantId) => {
    return await prisma.tag.findMany({
      where: {
        id: { in: ids },
        restaurantId
      }
    });
  },

  // Create tag
  create: async (data) => {
    return await prisma.tag.create({
      data
    });
  },

  // Update tag
  update: async (id, data) => {
    return await prisma.tag.update({
      where: { id },
      data
    });
  },

  // Delete tag
  deleteByRestaurant: async (id, restaurantId) => {
    const tag = await prisma.tag.findFirst({
      where: { id, restaurantId },
      select: { id: true }
    });

    if (!tag) {
      return false;
    }

    await prisma.$transaction(async (tx) => {
      await tx.menuItemTag.deleteMany({
        where: { tagId: id }
      });

      await tx.tag.delete({
        where: { id }
      });
    });

    return true;
  }
};
