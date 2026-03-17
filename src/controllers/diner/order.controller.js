import prisma from "../../prismaClient.js";

export const createOrder = async (req, res) => {
  const { items } = req.body;

  try {
    const session = req.session;
    const restaurantId = req.restaurantId;
    const tableCode = session.table.tableCode;

    const newOrder = await prisma.$transaction(async (tx) => {
      let total = 0;

      const order = await tx.order.create({
        data: {
          tableCode,
          restaurantId,
          sessionId: session.id,
          totalPrice: 0
        }
      });

      for (const item of items) {
        const itemId =
          item.item_id || item.menu_item_id || item.menuItemId || item.id;
        const qty = Number(item.qty);

        if (!itemId || !Number.isFinite(qty) || qty <= 0) {
          throw new Error("Invalid order item payload");
        }

        const dish = await tx.menuItem.findFirst({
          where: {
            id: Number(itemId),
            restaurantId
          },
          include: { inventory: true }
        });

        if (!dish || !dish.inventory) {
          throw new Error(`Menu item not found: ${itemId}`);
        }

        const updated = await tx.inventory.updateMany({
          where: {
            menuItemId: dish.id,
            quantityAvailable: { gte: qty }
          },
          data: {
            quantityAvailable: { decrement: qty }
          }
        });

        if (updated.count === 0) {
          throw new Error(`Out of stock: ${dish.name}`);
        }

        await tx.menuItem.updateMany({
          where: { id: dish.id, restaurantId },
          data: { quantity: { decrement: qty } }
        });

        await tx.orderItem.create({
          data: {
            orderId: order.id,
            menuItemId: dish.id,
            quantity: qty,
            priceSnapshot: dish.price
          }
        });

        total += dish.price * qty;
      }

      return await tx.order.update({
        where: { id: order.id },
        data: { totalPrice: total },
        include: { items: true }
      });
    });

    res.status(201).json({ success: true, order: newOrder });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};
