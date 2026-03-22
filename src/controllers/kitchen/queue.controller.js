import { orderRepository } from "../../repositories/order.repository.js";
import { notificationService } from "../../services/notification.service.js";
import {
  ORDER_STATUSES,
  canTransitionOrderStatus,
  parseKitchenStatusFilter
} from "../../domain/orderStatus.js";
import { paginationSchema } from "../../schema/validation.js";

export const getActiveOrders = async (req, res) => {
  try {
    const parsed = parseKitchenStatusFilter(req.query.status);
    if (parsed.error) {
      return res.status(400).json({ 
        code: "INVALID_REQUEST",
        error: parsed.error 
      });
    }

    const pagination = paginationSchema.parse(req.query);
    const { skip, take } = pagination;

    const orders = await orderRepository.getActiveOrders(
      req.restaurantId,
      parsed.statuses,
      skip,
      take
    );

    res.json({
      data: orders,
      pagination: {
        skip,
        take,
        total: orders.length
      }
    });
  } catch (error) {
    console.error("Failed to load kitchen orders:", error);
    res.status(500).json({ 
      code: "INTERNAL_ERROR",
      error: "Failed to load kitchen orders" 
    });
  }
};

export const updateOrderStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const nextStatus = String(status || "").toUpperCase();
  const orderId = Number(id);

  if (!Number.isFinite(orderId)) {
    return res.status(400).json({ error: "Invalid order id" });
  }

  if (!ORDER_STATUSES.includes(nextStatus)) {
    return res.status(400).json({
      error: "Invalid status. Valid statuses: QUEUED, COOKING, READY, SERVED"
    });
  }

  try {
    const currentOrder = await orderRepository.findById(orderId, req.restaurantId);
    if (!currentOrder) {
      return res.status(404).json({ error: "Order not found" });
    }

    if (!canTransitionOrderStatus(currentOrder.status, nextStatus)) {
      return res.status(409).json({
        error: `Invalid status transition: ${currentOrder.status} -> ${nextStatus}`
      });
    }

    const updatedOrder = await orderRepository.updateStatus(orderId, req.restaurantId, nextStatus);

    if (!updatedOrder) {
      return res.status(404).json({ error: "Order not found" });
    }

    // Broadcast order status update to kitchen staff
    notificationService.broadcastOrderStatusUpdate(
      req.restaurantId,
      orderId,
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
