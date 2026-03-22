import prisma from "../prismaClient.js";

export const menuRepository = {
  // Get all menu items for restaurant (with pagination)
  findByRestaurant: async (restaurantId, skip = 0, take = 20) => {
    return await prisma.menuItem.findMany({
      where: { restaurantId },
      include: {
        inventory: true,
        category: true,
        tags: { include: { tag: true } }
      },
      skip: Number(skip),
      take: Number(take),
      orderBy: { id: "asc" }
    });
  },

  // Get single menu item
  findById: async (id, restaurantId) => {
    return await prisma.menuItem.findFirst({
      where: {
        id,
        restaurantId
      },
      include: {
        inventory: true,
        category: true,
        tags: { include: { tag: true } }
      }
    });
  },

  // Get available menu items with optional diet filter
  findAvailable: async (restaurantId, dietList = []) => {
    return await prisma.menuItem.findMany({
      where: {
        restaurantId,
        inventory: { quantityAvailable: { gt: 0 } },
        ...(dietList.length
          ? {
              tags: {
                some: {
                  tag: { name: { in: dietList } }
                }
              }
            }
          : {})
      },
      include: {
        inventory: true,
        category: true,
        tags: { include: { tag: true } }
      }
    });
  },

  // Create menu item
  create: async (data) => {
    const quantity = Number(data.quantity ?? 0);

    return await prisma.menuItem.create({
      data: {
        ...data,
        quantity,
        inventory: {
          create: {
            quantityAvailable: quantity
          }
        }
      },
      include: {
        inventory: true,
        category: true,
        tags: { include: { tag: true } }
      }
    });
  },

  // Update menu item
  update: async (id, restaurantId, data) => {
    const nextQuantity =
      data.quantity !== undefined ? Number(data.quantity) : undefined;

    const updated = await prisma.menuItem.updateMany({
      where: { id, restaurantId },
      data: {
        ...data,
        ...(nextQuantity !== undefined ? { quantity: nextQuantity } : {})
      }
    });

    if (updated.count === 0) {
      return null;
    }

    if (nextQuantity !== undefined) {
      await prisma.inventory.upsert({
        where: { menuItemId: id },
        update: { quantityAvailable: nextQuantity },
        create: {
          menuItemId: id,
          quantityAvailable: nextQuantity
        }
      });
    }

    return await prisma.menuItem.findFirst({
      where: { id, restaurantId },
      include: {
        inventory: true,
        category: true,
        tags: { include: { tag: true } }
      }
    });
  },

  addTagsToItem: async (itemId, restaurantId, tagIds) => {
    const item = await prisma.menuItem.findFirst({
      where: { id: itemId, restaurantId },
      select: { id: true }
    });

    if (!item) {
      return null;
    }

    await prisma.menuItemTag.createMany({
      data: tagIds.map((tagId) => ({
        menuItemId: itemId,
        tagId
      })),
      skipDuplicates: true
    });

    return await prisma.menuItem.findFirst({
      where: { id: itemId, restaurantId },
      include: {
        inventory: true,
        category: true,
        tags: { include: { tag: true } }
      }
    });
  },

  replaceTagsForItem: async (itemId, restaurantId, tagIds) => {
    const item = await prisma.menuItem.findFirst({
      where: { id: itemId, restaurantId },
      select: { id: true }
    });

    if (!item) {
      return null;
    }

    await prisma.$transaction(async (tx) => {
      await tx.menuItemTag.deleteMany({
        where: { menuItemId: itemId }
      });

      if (tagIds.length > 0) {
        await tx.menuItemTag.createMany({
          data: tagIds.map((tagId) => ({
            menuItemId: itemId,
            tagId
          })),
          skipDuplicates: true
        });
      }
    });

    return await prisma.menuItem.findFirst({
      where: { id: itemId, restaurantId },
      include: {
        inventory: true,
        category: true,
        tags: { include: { tag: true } }
      }
    });
  },

  // Delete menu item
  delete: async (id, restaurantId) => {
    const menuItem = await prisma.menuItem.findFirst({
      where: { id, restaurantId },
      select: { id: true }
    });

    if (!menuItem) {
      return false;
    }

    await prisma.$transaction(async (tx) => {
      await tx.menuItemTag.deleteMany({
        where: { menuItemId: id }
      });

      await tx.inventory.deleteMany({
        where: { menuItemId: id }
      });

      await tx.menuItem.delete({
        where: { id }
      });
    });

    return true;
  }
};
