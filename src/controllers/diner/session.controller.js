import prisma from "../../prismaClient.js";

export const startSession = async (req, res) => {
  const tableCode = req.query.table_code || req.body?.table_code || req.body?.tableCode;
  const restaurantIdHeader = req.headers["x-restaurant-id"];
  const restaurantIdQuery = req.query.restaurant_id || req.body?.restaurant_id;
  const restaurantId = restaurantIdHeader || restaurantIdQuery;

  if (!tableCode) {
    return res.status(400).json({ error: "table_code is required" });
  }

  try {
    const restaurantFilter = restaurantId
      ? { restaurantId: Number(restaurantId) }
      : {};

    if (restaurantId && Number.isNaN(restaurantFilter.restaurantId)) {
      return res.status(400).json({ error: "restaurant_id must be a number" });
    }

    const table = await prisma.table.findFirst({
      where: {
        tableCode: String(tableCode),
        ...restaurantFilter
      }
    });

    if (!table) {
      return res.status(404).json({ error: "Table not found" });
    }

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 2);

    const session = await prisma.tableSession.create({
      data: {
        tableId: table.id,
        expiresAt
      }
    });

    res.status(201).json({
      token: session.token,
      expiresAt: session.expiresAt
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to create session" });
  }
};
