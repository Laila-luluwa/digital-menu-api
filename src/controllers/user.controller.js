import { userRepository } from "../repositories/user.repository.js";
import bcrypt from "bcryptjs";

// Get all users for a restaurant
export const getAllUsers = async (req, res) => {
  try {
    const restaurantId = Number(req.restaurantId);

    const users = await userRepository.findByRestaurant(restaurantId);

    res.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ error: "Failed to fetch users" });
  }
};

// Create a new user for a restaurant
export const createUser = async (req, res) => {
  try {
    const { email, name, role, password } = req.body;
    const restaurantId = Number(req.restaurantId);

    // Validate required fields
    if (!email || !name || !role || !password) {
      return res.status(400).json({
        error: "Missing required fields: email, name, role, password"
      });
    }

    // Check if user already exists
    const existingUser = await userRepository.findByEmail(email);
    if (existingUser) {
      return res.status(409).json({ error: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await userRepository.create({
      email,
      name,
      password: hashedPassword,
      role,
      restaurantId
    });

    // Create RestaurantUser relationship
    await userRepository.createRestaurantUser(restaurantId, user.id, role);

    res.status(201).json({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      restaurantId: user.restaurantId
    });
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).json({ error: "Failed to create user" });
  }
};

// Get user by ID
export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const restaurantId = Number(req.restaurantId);

    const user = await userRepository.findById(Number(id));

    if (!user || user.restaurantId !== restaurantId) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      restaurantId: user.restaurantId
    });
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ error: "Failed to fetch user" });
  }
};

// Update user
export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, role } = req.body;
    const restaurantId = Number(req.restaurantId);

    const user = await userRepository.findById(Number(id));

    if (!user || user.restaurantId !== restaurantId) {
      return res.status(404).json({ error: "User not found" });
    }

    const updatedUser = await userRepository.update(Number(id), {
      name: name || user.name,
      role: role || user.role
    });

    if (role) {
      await userRepository.updateRestaurantUserRole(restaurantId, Number(id), role);
    }

    res.json({
      id: updatedUser.id,
      email: updatedUser.email,
      name: updatedUser.name,
      role: updatedUser.role,
      restaurantId: updatedUser.restaurantId
    });
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ error: "Failed to update user" });
  }
};

// Delete user
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const restaurantId = Number(req.restaurantId);

    const user = await userRepository.findById(Number(id));

    if (!user || user.restaurantId !== restaurantId) {
      return res.status(404).json({ error: "User not found" });
    }

    await userRepository.deleteRestaurantUser(restaurantId, Number(id));
    await userRepository.delete(Number(id));

    res.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ error: "Failed to delete user" });
  }
};
