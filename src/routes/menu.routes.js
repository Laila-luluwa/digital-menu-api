import express from "express";
import prisma from "../prismaClient.js";

const router = express.Router();

// Admin menu
router.get("/menu-items", async (req, res) => {
  try {
    const items = await prisma.menuItem.findMany({
      where: {
        restaurantId: req.restaurantId
      },
      include: {
        inventory: true,
        tags: { include: { tag: true } }
      }
    });

    res.json(items);
  } catch (error) {
    console.error("MENU ERROR:", error);
    res.status(500).json({ error: "Failed to fetch menu items" });
  }
});

// Create menu item
router.post("/menu-items", async (req, res) => {
  try {
    const { name, price, quantity = 0 } = req.body;

    const item = await prisma.menuItem.create({
      data: {
        name,
        price,
        quantity,
        restaurantId: req.restaurantId,
        inventory: {
          create: {
            quantityAvailable: quantity
          }
        }
      },
      include: { inventory: true }
    });

    res.json(item);
  } catch (error) {
    res.status(500).json({ error: "Failed to create menu item" });
  }
});

router.patch("/menu-items/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { name, price, quantity } = req.body;

    const updated = await prisma.$transaction(async (tx) => {
      const result = await tx.menuItem.updateMany({
        where: {
          id,
          restaurantId: req.restaurantId
        },
        data: {
          name,
          price,
          ...(Number.isFinite(quantity) ? { quantity } : {})
        }
      });

      if (result.count === 0) {
        return null;
      }

      if (Number.isFinite(quantity)) {
        await tx.inventory.upsert({
          where: { menuItemId: id },
          update: { quantityAvailable: quantity },
          create: { menuItemId: id, quantityAvailable: quantity }
        });
      }

      return tx.menuItem.findUnique({
        where: { id },
        include: { inventory: true }
      });
    });

    if (!updated) {
      return res.status(404).json({ error: "Menu item not found" });
    }

    res.json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to update menu item" });
  }
});

router.delete("/menu-items/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    const result = await prisma.menuItem.deleteMany({
      where: {
        id,
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
});

// Decrement inventory by 1
router.post("/menu-items/:id/decrement", async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    const result = await prisma.inventory.updateMany({
      where: {
        menuItemId: id,
        menuItem: { restaurantId: req.restaurantId },
        quantityAvailable: { gt: 0 }
      },
      data: {
        quantityAvailable: { decrement: 1 }
      }
    });

    if (result.count === 0) {
      return res.status(400).json({ error: "Item out of stock" });
    }

    await prisma.menuItem.updateMany({
      where: { id, restaurantId: req.restaurantId },
      data: { quantity: { decrement: 1 } }
    });

    const item = await prisma.menuItem.findUnique({
      where: { id },
      include: { inventory: true }
    });
    res.json(item);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to decrement inventory" });
  }
});

// Tags
router.get("/tags", async (req, res) => {
  try {
    const tags = await prisma.tag.findMany({
      where: { restaurantId: req.restaurantId },
      orderBy: { name: "asc" }
    });
    res.json(tags);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch tags" });
  }
});

router.post("/tags", async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: "name is required" });

    const tag = await prisma.tag.create({
      data: { name, restaurantId: req.restaurantId }
    });
    res.json(tag);
  } catch (error) {
    res.status(500).json({ error: "Failed to create tag" });
  }
});

router.post("/menu-items/:id/tags", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { tagIds = [] } = req.body;

    if (!Array.isArray(tagIds) || tagIds.length === 0) {
      return res.status(400).json({ error: "tagIds must be a non-empty array" });
    }

    const menuItem = await prisma.menuItem.findFirst({
      where: { id, restaurantId: req.restaurantId }
    });
    if (!menuItem) return res.status(404).json({ error: "Menu item not found" });

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
      data: tags.map((t) => ({ menuItemId: id, tagId: t.id })),
      skipDuplicates: true
    });

    const updated = await prisma.menuItem.findUnique({
      where: { id },
      include: { tags: { include: { tag: true } } }
    });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: "Failed to assign tags" });
  }
});

router.patch("/menu-items/:id/tags", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { tagIds = [] } = req.body;

    if (!Array.isArray(tagIds)) {
      return res.status(400).json({ error: "tagIds must be an array" });
    }

    const menuItem = await prisma.menuItem.findFirst({
      where: { id, restaurantId: req.restaurantId }
    });
    if (!menuItem) return res.status(404).json({ error: "Menu item not found" });

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
      await tx.menuItemTag.deleteMany({ where: { menuItemId: id } });

      if (tags.length > 0) {
        await tx.menuItemTag.createMany({
          data: tags.map((t) => ({ menuItemId: id, tagId: t.id })),
          skipDuplicates: true
        });
      }
    });

    const updated = await prisma.menuItem.findUnique({
      where: { id },
      include: { tags: { include: { tag: true } } }
    });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: "Failed to replace tags" });
  }
});

export default router;
