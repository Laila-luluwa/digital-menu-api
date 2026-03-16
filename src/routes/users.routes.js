const express = require("express");
const router = express.Router();
const prisma = require("../prismaClient");

// создать пользователя
router.post("/users", async (req, res) => {
  try {
    const { email, name, role } = req.body;

    const user = await prisma.user.create({
      data: {
        email,
        name,
        role,
        restaurantId: req.restaurantId
      }
    });

    res.json(user);
    
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to create user" });
  }
});

// получить пользователей ресторана
router.get("/users", async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      where: {
        restaurantId: req.restaurantId
      }
    });

    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

module.exports = router;