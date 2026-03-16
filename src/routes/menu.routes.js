const express = require("express");
const router = express.Router();
const prisma = require("../prismaClient");

// получить меню ресторана
router.get("/menu-items", async (req, res) => {
  try {
    const items = await prisma.menuItem.findMany({
      where: {
        restaurantId: req.restaurantId
      }
    });

    res.json(items);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch menu items" });
  }
});

// создать блюдо
router.post("/menu-items", async (req, res) => {
  try {
    const { name, price, quantity } = req.body;

    const item = await prisma.menuItem.create({
      data: {
        name,
        price,
        quantity,
        restaurantId: req.restaurantId
      }
    });

    res.json(item);
  } catch (error) {
    res.status(500).json({ error: "Failed to create menu item" });
  }
});

module.exports = router;