import prisma from "../../prismaClient.js";
import { notificationService } from "../../services/notification.service.js";

const ACTIVE_STATUSES = ["QUEUED", "COOKING", "READY"];
const ALL_STATUSES = ["QUEUED", "COOKING", "READY", "SERVED"];

export const getActiveOrders = async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      where: {
        restaurantId: req.restaurantId,
        status: { in: ACTIVE_STATUSES }
      },
      include: {
        items: { include: { menuItem: true } },
        session: { include: { table: true } }
      },
      orderBy: { createdAt: "asc" }
    });

    res.json(orders);
  } catch (error) {
    console.error("Failed to load kitchen orders:", error);
    res.status(500).json({ error: "Failed to load kitchen orders" });
  }
};

export const updateOrderStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const nextStatus = String(status || "").toUpperCase();

  if (!ALL_STATUSES.includes(nextStatus)) {
    return res.status(400).json({ error: "Invalid status. Valid statuses: QUEUED, COOKING, READY, SERVED" });
  }

  try {
    const result = await prisma.order.updateMany({
      where: {
        id: Number(id),
        restaurantId: req.restaurantId
      },
      data: { status: nextStatus }
    });

    if (result.count === 0) {
      return res.status(404).json({ error: "Order not found" });
    }

    const updatedOrder = await prisma.order.findUnique({
      where: { id: Number(id) },
      include: {
        items: { include: { menuItem: true } },
        session: { include: { table: true } }
      }
    });

    // Broadcast order status update to kitchen staff
    notificationService.broadcastOrderStatusUpdate(
      req.restaurantId,
      Number(id),
      nextStatus
    );

    res.json({
      success: true,
      message: `Order #${id} status updated to ${nextStatus}`,
      order: updatedOrder
    });
  } catch (error) {
    console.error("Failed to update order status:", error);
    res.status(400).json({ error: "Failed to update order status" });
  }
};
