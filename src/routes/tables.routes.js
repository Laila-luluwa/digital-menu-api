import express from "express";
import prisma from "../prismaClient.js";

const router = express.Router();

router.post("/tables", async (req, res) => {
  try {
    const tableCode = Math.random().toString(36).substring(2, 8);

    const table = await prisma.table.create({
      data: {
        tableCode,
        restaurantId: req.restaurantId
      }
    });

    const qrLink = `http://localhost:3000/api/diner/sessions/start?table_code=${tableCode}`;

    res.json({
      table,
      qrLink
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to create table" });
  }
});

export default router;
