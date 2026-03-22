import prisma from "../prismaClient.js";
import { isPlatformAdmin } from "../middleware/authorizeRole.js";

const canAccessRestaurant = (req, restaurantId) => {
  if (isPlatformAdmin(req)) {
    return true;
  }

  return req.user?.role === "OWNER" && Number(req.user.restaurantId) === restaurantId;
};

export const getAllRestaurants = async (req, res) => {
  try {
    const restaurants = await prisma.restaurant.findMany({
      where: isPlatformAdmin(req)
        ? undefined
        : { id: Number(req.user.restaurantId) },
      select: {
        id: true,
        name: true,
        createdAt: true
      }
    });

    res.json(restaurants);
  } catch (error) {
    console.error("Error fetching restaurants:", error);
    res.status(500).json({ error: "Failed to fetch restaurants" });
  }
};

export const createRestaurant = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ error: "Restaurant name is required" });
    }

    const restaurant = await prisma.restaurant.create({
      data: { 
        name
      }
    });

    res.status(201).json(restaurant);
  } catch (error) {
    console.error("Error creating restaurant:", error);
    res.status(500).json({ error: "Failed to create restaurant" });
  }
};

// Get restaurant by ID
export const getRestaurantById = async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isFinite(id)) {
      return res.status(400).json({ error: "Invalid restaurant id" });
    }

    if (!canAccessRestaurant(req, id)) {
      return res.status(403).json({ error: "Access denied" });
    }

    const restaurant = await prisma.restaurant.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        createdAt: true
      }
    });

    if (!restaurant) {
      return res.status(404).json({ error: "Restaurant not found" });
    }

    res.json(restaurant);
  } catch (error) {
    console.error("Error fetching restaurant:", error);
    res.status(500).json({ error: "Failed to fetch restaurant" });
  }
};

// Update restaurant
export const updateRestaurant = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { name } = req.body;

    if (!Number.isFinite(id)) {
      return res.status(400).json({ error: "Invalid restaurant id" });
    }

    if (!name) {
      return res.status(400).json({ error: "Restaurant name is required" });
    }

    if (!canAccessRestaurant(req, id)) {
      return res.status(403).json({ error: "Access denied" });
    }

    const restaurant = await prisma.restaurant.update({
      where: { id },
      data: { name }
    });

    res.json(restaurant);
  } catch (error) {
    if (error.code === "P2025") {
      return res.status(404).json({ error: "Restaurant not found" });
    }
    console.error("Error updating restaurant:", error);
    res.status(500).json({ error: "Failed to update restaurant" });
  }
};

// Delete restaurant
export const deleteRestaurant = async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isFinite(id)) {
      return res.status(400).json({ error: "Invalid restaurant id" });
    }

    if (!canAccessRestaurant(req, id)) {
      return res.status(403).json({ error: "Access denied" });
    }

    await prisma.restaurant.delete({
      where: { id }
    });

    res.json({ message: "Restaurant deleted successfully" });
  } catch (error) {
    if (error.code === "P2025") {
      return res.status(404).json({ error: "Restaurant not found" });
    }
    console.error("Error deleting restaurant:", error);
    res.status(500).json({ error: "Failed to delete restaurant" });
  }
};
