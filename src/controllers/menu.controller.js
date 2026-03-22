import { menuRepository } from "../repositories/menu.repository.js";
import { tagRepository } from "../repositories/tag.repository.js";
import { notificationService } from "../services/notification.service.js";
import { paginationSchema } from "../schema/validation.js";

/**
 * Get all menu items for a restaurant (with pagination)
 */
export const getMenuItems = async (req, res) => {
  try {
    const pagination = paginationSchema.parse(req.query);
    const { skip, take } = pagination;

    const items = await menuRepository.findByRestaurant(req.restaurantId, skip, take);
    res.json({
      data: items,
      pagination: {
        skip,
        take,
        total: items.length
      }
    });
  } catch (error) {
    console.error("MENU ERROR:", error);
    res.status(500).json({ 
      code: "INTERNAL_ERROR",
      error: "Failed to fetch menu items" 
    });
  }
};

/**
 * Get single menu item
 */
export const getMenuItem = async (req, res) => {
  try {
    const itemId = parseInt(req.params.id);

    const item = await menuRepository.findById(itemId, req.restaurantId);

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

    const item = await menuRepository.create({
      name,
      description,
      price: Number(price),
      quantity: Number(quantity),
      restaurantId: req.restaurantId,
      ...(categoryId ? { categoryId: Number(categoryId) } : {})
    });

    notificationService.broadcastMenuItemUpdated(req.restaurantId, item);

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

    const updated = await menuRepository.update(itemId, req.restaurantId, {
      ...(name ? { name } : {}),
      ...(description !== undefined ? { description } : {}),
      ...(price ? { price: Number(price) } : {}),
      ...(Number.isFinite(quantity) ? { quantity: Number(quantity) } : {}),
      ...(categoryId ? { categoryId: Number(categoryId) } : {})
    });

    if (!updated) {
      return res.status(404).json({ error: "Menu item not found" });
    }

    notificationService.broadcastMenuItemUpdated(req.restaurantId, updated);

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

    const deleted = await menuRepository.delete(itemId, req.restaurantId);

    if (!deleted) {
      return res.status(404).json({ error: "Menu item not found" });
    }

    notificationService.broadcastMenuItemDeleted(req.restaurantId, itemId);

    res.json({ message: "Menu item deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to delete menu item" });
  }
};

// ========== TAGS ==========

/**
 * Get all tags for restaurant
 */
export const getTags = async (req, res) => {
  try {
    const tags = await tagRepository.findByRestaurant(req.restaurantId);
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

    const tag = await tagRepository.create({
      name,
      restaurantId: req.restaurantId
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

    const deleted = await tagRepository.deleteByRestaurant(tagId, req.restaurantId);

    if (!deleted) {
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

    const uniqueTagIds = [...new Set(tagIds.map(Number).filter(Number.isFinite))];

    if (uniqueTagIds.length === 0) {
      return res.status(400).json({ error: "tagIds must contain numeric ids" });
    }

    const tags = await tagRepository.findByIdsForRestaurant(uniqueTagIds, req.restaurantId);
    if (tags.length !== uniqueTagIds.length) {
      return res.status(400).json({ error: "One or more tags do not belong to this restaurant" });
    }

    const item = await menuRepository.addTagsToItem(itemId, req.restaurantId, uniqueTagIds);
    if (!item) {
      return res.status(404).json({ error: "Menu item not found" });
    }

    notificationService.broadcastMenuItemUpdated(req.restaurantId, item);

    res.json(item);
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

    const uniqueTagIds = [...new Set(tagIds.map(Number).filter(Number.isFinite))];
    if (tagIds.length > 0 && uniqueTagIds.length !== tagIds.length) {
      return res.status(400).json({ error: "tagIds must contain only numeric ids" });
    }

    if (uniqueTagIds.length > 0) {
      const tags = await tagRepository.findByIdsForRestaurant(uniqueTagIds, req.restaurantId);
      if (tags.length !== uniqueTagIds.length) {
        return res.status(400).json({ error: "One or more tags do not belong to this restaurant" });
      }
    }

    const item = await menuRepository.replaceTagsForItem(itemId, req.restaurantId, uniqueTagIds);
    if (!item) {
      return res.status(404).json({ error: "Menu item not found" });
    }

    notificationService.broadcastMenuItemUpdated(req.restaurantId, item);

    res.json(item);
  } catch (error) {
    res.status(500).json({ error: "Failed to replace tags" });
  }
};

/**
 * Update inventory quantity for menu item
 */
export const updateInventory = async (req, res) => {
  try {
    const itemId = parseInt(req.params.id);
    const { quantity } = req.body;

    if (!Number.isFinite(quantity) || quantity < 0) {
      return res.status(400).json({ error: "quantity must be a non-negative number" });
    }

    const updated = await menuRepository.update(itemId, req.restaurantId, {
      quantity: Number(quantity)
    });

    if (!updated) {
      return res.status(404).json({ error: "Menu item not found" });
    }

    notificationService.broadcastInventoryUpdate(
      req.restaurantId,
      itemId,
      Number(quantity)
    );
    notificationService.broadcastMenuItemUpdated(req.restaurantId, updated);

    res.json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to update inventory" });
  }
};

/**
 * Decrement inventory by 1 for menu item
 */
export const decrementInventory = async (req, res) => {
  try {
    const itemId = parseInt(req.params.id);

    // Get current item
    const item = await menuRepository.findById(itemId, req.restaurantId);
    if (!item) {
      return res.status(404).json({ error: "Menu item not found" });
    }

    // Check if quantity is available
    if (item.quantity <= 0) {
      return res.status(400).json({ error: "Item is out of stock" });
    }

    // Decrement by 1
    const updated = await menuRepository.update(itemId, req.restaurantId, {
      quantity: item.quantity - 1
    });

    notificationService.broadcastInventoryUpdate(
      req.restaurantId,
      itemId,
      item.quantity - 1
    );
    notificationService.broadcastMenuItemUpdated(req.restaurantId, updated);

    res.json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to decrement inventory" });
  }
};
