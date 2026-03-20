import express from "express";
import {
  getMenuCategories,
  getMenuCategory,
  createMenuCategory,
  updateMenuCategory,
  deleteMenuCategory,
  reorderMenuCategories
} from "../controllers/menuCategory.controller.js";
import {
  getMenuItems,
  getMenuItem,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  updateInventory,
  decrementInventory,
  getTags,
  createTag,
  deleteTag,
  addTagsToMenuItem,
  replaceMenuItemTags
} from "../controllers/menu.controller.js";
import { authorizeOwnerOrManager } from "../middleware/authorizeRole.js";

const router = express.Router();

// ========== MENU CATEGORIES (ADMIN ONLY) ==========

// Get all menu categories with items
router.get("/menu-categories", authorizeOwnerOrManager, getMenuCategories);

// Get single category
router.get("/menu-categories/:id", authorizeOwnerOrManager, getMenuCategory);

// Create menu category
router.post("/menu-categories", authorizeOwnerOrManager, createMenuCategory);

// Update menu category
router.patch("/menu-categories/:id", authorizeOwnerOrManager, updateMenuCategory);

// Delete menu category
router.delete("/menu-categories/:id", authorizeOwnerOrManager, deleteMenuCategory);

// Reorder menu categories
router.post(
  "/menu-categories/reorder",
  authorizeOwnerOrManager,
  reorderMenuCategories
);

// ========== MENU ITEMS (ADMIN ONLY) ==========

// Admin menu - Get all items
router.get("/menu-items", authorizeOwnerOrManager, getMenuItems);

// Get single menu item
router.get("/menu-items/:id", authorizeOwnerOrManager, getMenuItem);

// Create menu item
router.post("/menu-items", authorizeOwnerOrManager, createMenuItem);

// Update menu item
router.patch("/menu-items/:id", authorizeOwnerOrManager, updateMenuItem);

// Delete menu item
router.delete("/menu-items/:id", authorizeOwnerOrManager, deleteMenuItem);

// Update inventory quantity (PATCH for atomic inventory updates)
router.patch(
  "/menu-items/:id/inventory",
  authorizeOwnerOrManager,
  updateInventory
);

// Decrement inventory by amount
router.post(
  "/menu-items/:id/decrement",
  authorizeOwnerOrManager,
  decrementInventory
);

// ========== TAGS (ADMIN ONLY) ==========

// Get all tags for restaurant
router.get("/tags", authorizeOwnerOrManager, getTags);

// Create tag
router.post("/tags", authorizeOwnerOrManager, createTag);

// Delete tag
router.delete("/tags/:id", authorizeOwnerOrManager, deleteTag);

// Add tags to menu item
router.post("/menu-items/:id/tags", authorizeOwnerOrManager, addTagsToMenuItem);

// Replace tags for menu item (replace all tags)
router.patch("/menu-items/:id/tags", authorizeOwnerOrManager, replaceMenuItemTags);

export default router;

