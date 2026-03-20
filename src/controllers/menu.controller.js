import prisma from "../prismaClient.js";
import { notificationService } from "../services/notification.service.js";

/**
 * Get all menu items for a restaurant
 */
export const getMenuItems = async (req, res) => {
  try {
    const items = await prisma.menuItem.findMany({
      where: {
        restaurantId: req.restaurantId
      },
      include: {
        inventory: true,
        category: true,
        tags: { include: { tag: true } }
      }
    });

    res.json(items);
  } catch (error) {
    console.error("MENU ERROR:", error);
    res.status(500).json({ error: "Failed to fetch menu items" });
  }
};

/**
 * Get single menu item
 */
export const getMenuItem = async (req, res) => {
  try {
    const itemId = parseInt(req.params.id);

    const item = await prisma.menuItem.findFirst({
      where: {
        id: itemId,
        restaurantId: req.restaurantId
      },
      include: {
        inventory: true,
        category: true,
        tags: { include: { tag: true } }
      }
    });

    if (!item) {
      return res.status(404).json({ error: "Menu item not found" });
    }

    res.json(item);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch menu item" });
  }
};

/**
 * Create menu item
 */
export const createMenuItem = async (req, res) => {
  try {
    const { name, description = "", price, quantity = 0, categoryId } = req.body;

    if (!name || !price) {
      return res
        .status(400)
        .json({ error: "name and price are required" });
    }

    const item = await prisma.menuItem.create({
      data: {
        name,
        description,
        price: Number(price),
        quantity: Number(quantity),
        restaurantId: req.restaurantId,
        ...(categoryId ? { categoryId: Number(categoryId) } : {}),
        inventory: {
          create: {
            quantityAvailable: Number(quantity)
          }
        }
      },
      include: {
        inventory: true,
        category: true
      }
    });

    res.status(201).json(item);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to create menu item" });
  }
};

/**
 * Update menu item
 */
export const updateMenuItem = async (req, res) => {
  try {
    const itemId = parseInt(req.params.id);
    const { name, description, price, quantity, categoryId } = req.body;

    const updated = await prisma.$transaction(async (tx) => {
      const result = await tx.menuItem.updateMany({
        where: {
          id: itemId,
          restaurantId: req.restaurantId
        },
        data: {
          ...(name ? { name } : {}),
          ...(description !== undefined ? { description } : {}),
          ...(price ? { price: Number(price) } : {}),
          ...(Number.isFinite(quantity) ? { quantity: Number(quantity) } : {}),
          ...(categoryId ? { categoryId: Number(categoryId) } : {})
        }
      });

      if (result.count === 0) {
        return null;
      }

      if (Number.isFinite(quantity)) {
        await tx.inventory.upsert({
          where: { menuItemId: itemId },
          update: { quantityAvailable: Number(quantity) },
          create: { menuItemId: itemId, quantityAvailable: Number(quantity) }
        });
      }

      return tx.menuItem.findUnique({
        where: { id: itemId },
        include: {
          inventory: true,
          category: true,
          tags: { include: { tag: true } }
        }
      });
    });

    if (!updated) {
      return res.status(404).json({ error: "Menu item not found" });
    }

    // Broadcast inventory update if quantity changed
    if (Number.isFinite(quantity) && updated.inventory) {
      notificationService.broadcastInventoryUpdate(
        req.restaurantId,
        itemId,
        updated.inventory.quantityAvailable
      );
    }

    res.json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to update menu item" });
  }
};

/**
 * Delete menu item
 */
export const deleteMenuItem = async (req, res) => {
  try {
    const itemId = parseInt(req.params.id);

    const result = await prisma.menuItem.deleteMany({
      where: {
        id: itemId,
        restaurantId: req.restaurantId
      }
    });

    if (result.count === 0) {
      return res.status(404).json({ error: "Menu item not found" });
    }

    res.json({ message: "Menu item deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to delete menu item" });
  }
};

/**
 * Update inventory quantity for a menu item (atomic operation)
 */
export const updateInventory = async (req, res) => {
  try {
    const itemId = parseInt(req.params.id);
    const { quantityAvailable } = req.body;

    if (!Number.isFinite(quantityAvailable)) {
      return res
        .status(400)
        .json({ error: "quantityAvailable must be a number" });
    }

    const updated = await prisma.$transaction(async (tx) => {
      const inventory = await tx.inventory.updateMany({
        where: {
          menuItemId: itemId,
          menuItem: { restaurantId: req.restaurantId }
        },
        data: {
          quantityAvailable: Number(quantityAvailable)
        }
      });

      if (inventory.count === 0) {
        return null;
      }

      await tx.menuItem.updateMany({
        where: { id: itemId, restaurantId: req.restaurantId },
        data: { quantity: Number(quantityAvailable) }
      });

      return tx.inventory.findUnique({
        where: { menuItemId: itemId }
      });
    });

    if (!updated) {
      return res.status(404).json({ error: "Menu item not found" });
    }

    // Broadcast inventory update
    notificationService.broadcastInventoryUpdate(
      req.restaurantId,
      itemId,
      updated.quantityAvailable
    );

    res.json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to update inventory" });
  }
};

/**
 * Decrement inventory by specified amount (atomic operation)
 */
export const decrementInventory = async (req, res) => {
  try {
    const itemId = parseInt(req.params.id);
    const { amount = 1 } = req.body;

    if (!Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({ error: "amount must be a positive number" });
    }

    const result = await prisma.inventory.updateMany({
      where: {
        menuItemId: itemId,
        menuItem: { restaurantId: req.restaurantId },
        quantityAvailable: { gte: amount }
      },
      data: {
        quantityAvailable: { decrement: amount }
      }
    });

    if (result.count === 0) {
      const item = await prisma.menuItem.findFirst({
        where: { id: itemId, restaurantId: req.restaurantId },
        include: { inventory: true }
      });

      return res.status(400).json({
        error: `Insufficient inventory. Available: ${item?.inventory?.quantityAvailable || 0}`
      });
    }

    await prisma.menuItem.updateMany({
      where: { id: itemId, restaurantId: req.restaurantId },
      data: { quantity: { decrement: amount } }
    });

    const item = await prisma.menuItem.findUnique({
      where: { id: itemId },
      include: { inventory: true }
    });

    // Broadcast inventory update
    if (item?.inventory) {
      notificationService.broadcastInventoryUpdate(
        req.restaurantId,
        itemId,
        item.inventory.quantityAvailable
      );
    }

    res.json(item);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to decrement inventory" });
  }
};

// ========== TAGS ==========

/**
 * Get all tags for restaurant
 */
export const getTags = async (req, res) => {
  try {
    const tags = await prisma.tag.findMany({
      where: { restaurantId: req.restaurantId },
      orderBy: { name: "asc" }
    });
    res.json(tags);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch tags" });
  }
};

/**
 * Create tag
 */
export const createTag = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: "name is required" });

    const tag = await prisma.tag.create({
      data: { name, restaurantId: req.restaurantId }
    });
    res.status(201).json(tag);
  } catch (error) {
    if (error.code === "P2002") {
      return res
        .status(409)
        .json({ error: "Tag already exists for this restaurant" });
    }
    res.status(500).json({ error: "Failed to create tag" });
  }
};

/**
 * Delete tag
 */
export const deleteTag = async (req, res) => {
  try {
    const tagId = parseInt(req.params.id);

    const tag = await prisma.tag.deleteMany({
      where: {
        id: tagId,
        restaurantId: req.restaurantId
      }
    });

    if (tag.count === 0) {
      return res.status(404).json({ error: "Tag not found" });
    }

    res.json({ message: "Tag deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete tag" });
  }
};

/**
 * Add tags to menu item
 */
export const addTagsToMenuItem = async (req, res) => {
  try {
    const itemId = parseInt(req.params.id);
    const { tagIds = [] } = req.body;

    if (!Array.isArray(tagIds) || tagIds.length === 0) {
      return res.status(400).json({ error: "tagIds must be a non-empty array" });
    }

    const menuItem = await prisma.menuItem.findFirst({
      where: { id: itemId, restaurantId: req.restaurantId }
    });
    if (!menuItem)
      return res.status(404).json({ error: "Menu item not found" });

    const tags = await prisma.tag.findMany({
      where: {
        id: { in: tagIds.map((t) => Number(t)) },
        restaurantId: req.restaurantId
      }
    });
    if (tags.length === 0) {
      return res.status(400).json({ error: "No valid tags for this restaurant" });
    }

    await prisma.menuItemTag.createMany({
      data: tags.map((t) => ({ menuItemId: itemId, tagId: t.id })),
      skipDuplicates: true
    });

    const updated = await prisma.menuItem.findUnique({
      where: { id: itemId },
      include: { tags: { include: { tag: true } } }
    });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: "Failed to assign tags" });
  }
};

/**
 * Replace tags for menu item
 */
export const replaceMenuItemTags = async (req, res) => {
  try {
    const itemId = parseInt(req.params.id);
    const { tagIds = [] } = req.body;

    if (!Array.isArray(tagIds)) {
      return res.status(400).json({ error: "tagIds must be an array" });
    }

    const menuItem = await prisma.menuItem.findFirst({
      where: { id: itemId, restaurantId: req.restaurantId }
    });
    if (!menuItem)
      return res.status(404).json({ error: "Menu item not found" });

    const tags = await prisma.tag.findMany({
      where: {
        id: { in: tagIds.map((t) => Number(t)) },
        restaurantId: req.restaurantId
      }
    });

    if (tagIds.length > 0 && tags.length === 0) {
      return res.status(400).json({ error: "No valid tags for this restaurant" });
    }

    await prisma.$transaction(async (tx) => {
      await tx.menuItemTag.deleteMany({ where: { menuItemId: itemId } });

      if (tags.length > 0) {
        await tx.menuItemTag.createMany({
          data: tags.map((t) => ({ menuItemId: itemId, tagId: t.id })),
          skipDuplicates: true
        });
      }
    });

    const updated = await prisma.menuItem.findUnique({
      where: { id: itemId },
      include: { tags: { include: { tag: true } } }
    });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: "Failed to replace tags" });
  }
};
