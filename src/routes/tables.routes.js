const express = require("express");
const router = express.Router();
const prisma = require("../prismaClient");

// создать стол + QR ссылку
router.post("/tables", async (req, res) => {
  try {

    const tableCode = Math.random().toString(36).substring(2, 8);

    const table = await prisma.table.create({
      data: {
        tableCode: tableCode,
        restaurantId: req.restaurantId
      }
    });

    const qrLink = `http://localhost:3000/menu?table=${tableCode}`;

    res.json({
      table,
      qrLink
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to create table" });
  }
});

module.exports = router;