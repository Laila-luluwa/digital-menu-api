import express from "express";
import prisma from "../prismaClient.js";

const router = express.Router();

router.post("/users", async (req, res) => {
  try {
    const { email, name, role } = req.body;

    const user = await prisma.user.upsert({
      where: { email },
      update: { name, role, restaurantId: req.restaurantId },
      create: {
        email,
        name,
        role,
        restaurantId: req.restaurantId
      }
    });

    await prisma.restaurantUser.upsert({
      where: {
        restaurantId_userId: {
          restaurantId: req.restaurantId,
          userId: user.id
        }
      },
      update: { role },
      create: {
        restaurantId: req.restaurantId,
        userId: user.id,
        role
      }
    });

    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to create user" });
  }
});

router.get("/users", async (req, res) => {
  try {
    const users = await prisma.restaurantUser.findMany({
      where: { restaurantId: req.restaurantId },
      include: { user: true }
    });

    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

export default router;
