import express from "express";
import {
  getAllRestaurants,
  createRestaurant,
  getRestaurantById,
  updateRestaurant,
  deleteRestaurant
} from "../controllers/restaurant.controller.js";
import { authorizeRole } from "../middleware/authorizeRole.js";

const router = express.Router();

router.get("/restaurants", authorizeRole("PLATFORM_ADMIN", "OWNER"), getAllRestaurants);

router.post("/restaurants", authorizeRole("PLATFORM_ADMIN"), createRestaurant);

router.get("/restaurants/:id", authorizeRole("PLATFORM_ADMIN", "OWNER"), getRestaurantById);

router.patch("/restaurants/:id", authorizeRole("PLATFORM_ADMIN", "OWNER"), updateRestaurant);

router.delete("/restaurants/:id", authorizeRole("PLATFORM_ADMIN", "OWNER"), deleteRestaurant);

export default router;
