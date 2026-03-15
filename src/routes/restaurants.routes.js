const express = require("express");
const router = express.Router();
const prisma = require("../prismaClient");


// Получить все рестораны
router.get("/restaurants", async (req, res) => {
  try {
    const restaurants = await prisma.restaurant.findMany();
    res.json(restaurants);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch restaurants" });
  }
});


// Создать ресторан
router.post("/restaurants", async (req, res) => {
  try {
    const { name } = req.body;

    const restaurant = await prisma.restaurant.create({
      data: {
        name: name
      }
    });

    res.json(restaurant);
  } catch (error) {
    res.status(500).json({ error: "Failed to create restaurant" });
  }
});

module.exports = router;