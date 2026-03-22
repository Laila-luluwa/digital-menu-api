import { menuCategoryRepository } from "../repositories/menuCategory.repository.js";

/**
 * Get all menu categories for a restaurant
 */
export const getMenuCategories = async (req, res) => {
  try {
    const categories = await menuCategoryRepository.findByRestaurant(req.restaurantId);
    res.json(categories);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch menu categories" });
  }
};

/**
 * Get single menu category with items
 */
export const getMenuCategory = async (req, res) => {
  try {
    const categoryId = parseInt(req.params.id);

    const category = await menuCategoryRepository.findById(categoryId, req.restaurantId);

    if (!category) {
      return res.status(404).json({ error: "Menu category not found" });
    }

    res.json(category);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch menu category" });
  }
};

/**
 * Create new menu category
 */
export const createMenuCategory = async (req, res) => {
  try {
    const { name, description = "", displayOrder = 0 } = req.body;

    if (!name) {
      return res.status(400).json({ error: "Category name is required" });
    }

    const category = await menuCategoryRepository.create({
      name,
      description,
      displayOrder: Number(displayOrder),
      restaurantId: req.restaurantId
    });

    res.status(201).json(category);
  } catch (error) {
    if (error.code === "P2002") {
      return res
        .status(409)
        .json({ error: "Category name already exists for this restaurant" });
    }
    console.error(error);
    res.status(500).json({ error: "Failed to create menu category" });
  }
};

/**
 * Update menu category
 */
export const updateMenuCategory = async (req, res) => {
  try {
    const categoryId = parseInt(req.params.id);
    const { name, description, displayOrder } = req.body;

    const updatedCategory = await menuCategoryRepository.update(categoryId, req.restaurantId, {
      ...(name ? { name } : {}),
      ...(description !== undefined ? { description } : {}),
      ...(displayOrder !== undefined ? { displayOrder: Number(displayOrder) } : {})
    });

    if (!updatedCategory) {
      return res.status(404).json({ error: "Menu category not found" });
    }

    res.json(updatedCategory);
  } catch (error) {
    if (error.code === "P2002") {
      return res
        .status(409)
        .json({ error: "Category name already exists for this restaurant" });
    }
    console.error(error);
    res.status(500).json({ error: "Failed to update menu category" });
  }
};

/**
 * Delete menu category
 */
export const deleteMenuCategory = async (req, res) => {
  try {
    const categoryId = parseInt(req.params.id);

    // Check if category has items
    const itemCount = await menuCategoryRepository.countItems(categoryId, req.restaurantId);

    if (itemCount > 0) {
      return res
        .status(409)
        .json({ 
          error: "Cannot delete category with existing menu items. Remove or reassign items first." 
        });
    }

    const deleted = await menuCategoryRepository.delete(categoryId, req.restaurantId);

    if (!deleted) {
      return res.status(404).json({ error: "Menu category not found" });
    }

    res.json({ message: "Menu category deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to delete menu category" });
  }
};

/**
 * Reorder menu categories
 */
export const reorderMenuCategories = async (req, res) => {
  try {
    const { categoryOrders } = req.body;

    if (!Array.isArray(categoryOrders)) {
      return res
        .status(400)
        .json({ error: "categoryOrders array is required" });
    }

    // Update display order for each category
    const updated = await Promise.all(
      categoryOrders.map((item) =>
        menuCategoryRepository.update(item.id, req.restaurantId, {
          displayOrder: item.displayOrder
        })
      )
    );

    res.json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to reorder menu categories" });
  }
};
