import express from "express";
import {
  getAllUsers,
  createUser,
  getUserById,
  updateUser,
  deleteUser
} from "../controllers/user.controller.js";
import { authorizeOwnerOrManager } from "../middleware/authorizeRole.js";

const router = express.Router();

// All user operations require OWNER or MANAGER role
router.use(authorizeOwnerOrManager);

// Get all users for restaurant
router.get("/users", getAllUsers);

// Create new user
router.post("/users", createUser);

// Get user by ID
router.get("/users/:id", getUserById);

// Update user
router.patch("/users/:id", updateUser);

// Delete user
router.delete("/users/:id", deleteUser);

export default router;
