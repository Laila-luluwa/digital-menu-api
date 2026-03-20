import prisma from "../prismaClient.js";

/**
 * Get all menu categories for a restaurant
 */
export const getMenuCategories = async (req, res) => {
  try {
    const categories = await prisma.menuCategory.findMany({
      where: {
        restaurantId: req.restaurantId
      },
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

    const category = await prisma.menuCategory.findFirst({
      where: {
        id: categoryId,
        restaurantId: req.restaurantId
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

    const category = await prisma.menuCategory.create({
      data: {
        name,
        description,
        displayOrder: Number(displayOrder),
        restaurantId: req.restaurantId
      }
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

    const category = await prisma.menuCategory.updateMany({
      where: {
        id: categoryId,
        restaurantId: req.restaurantId
      },
      data: {
        ...(name ? { name } : {}),
        ...(description !== undefined ? { description } : {}),
        ...(displayOrder !== undefined ? { displayOrder: Number(displayOrder) } : {})
      }
    });

    if (category.count === 0) {
      return res.status(404).json({ error: "Menu category not found" });
    }

    const updatedCategory = await prisma.menuCategory.findUnique({
      where: { id: categoryId },
      include: {
        menuItems: {
          include: {
            inventory: true,
            tags: { include: { tag: true } }
          }
        }
      }
    });

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
    const count = await prisma.menuItem.count({
      where: {
        categoryId,
        restaurantId: req.restaurantId
      }
    });

    if (count > 0) {
      return res
        .status(409)
        .json({ 
          error: "Cannot delete category with existing menu items. Remove or reassign items first." 
        });
    }

    const category = await prisma.menuCategory.deleteMany({
      where: {
        id: categoryId,
        restaurantId: req.restaurantId
      }
    });

    if (category.count === 0) {
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

    const updates = categoryOrders.map((item) =>
      prisma.menuCategory.updateMany({
        where: {
          id: item.id,
          restaurantId: req.restaurantId
        },
        data: {
          displayOrder: item.displayOrder
        }
      })
    );

    await prisma.$transaction(updates);

    const categories = await prisma.menuCategory.findMany({
      where: {
        restaurantId: req.restaurantId
      },
      orderBy: { displayOrder: "asc" }
    });

    res.json(categories);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to reorder menu categories" });
  }
};
