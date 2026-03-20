import WebSocket from "ws";

/**
 * WebSocket event dispatcher for real-time notifications
 * Manages connections and broadcasts events to subscribed clients
 */
export class NotificationService {
  constructor() {
    this.clients = new Map();
    this.kitchenSubscribers = new Map(); // restaurant -> set of kitchen staff connections
  }

  /**
   * Register a kitchen staff WebSocket connection for a restaurant
   */
  registerKitchenConnection(restaurantId, ws) {
    if (!this.kitchenSubscribers.has(restaurantId)) {
      this.kitchenSubscribers.set(restaurantId, new Set());
    }

    this.kitchenSubscribers.get(restaurantId).add(ws);
    console.log(`Kitchen staff connected for restaurant ${restaurantId}`);

    // Handle disconnection
    ws.on("close", () => {
      const subscribers = this.kitchenSubscribers.get(restaurantId);
      if (subscribers) {
        subscribers.delete(ws);
        console.log(`Kitchen staff disconnected for restaurant ${restaurantId}`);
      }
    });
  }

  /**
   * Broadcast new order to kitchen staff
   */
  broadcastNewOrder(restaurantId, order) {
    const subscribers = this.kitchenSubscribers.get(restaurantId);
    if (!subscribers || subscribers.size === 0) {
      console.log(`No kitchen staff connected for restaurant ${restaurantId}`);
      return false;
    }

    const message = JSON.stringify({
      type: "NEW_ORDER",
      timestamp: new Date().toISOString(),
      data: order
    });

    let sentCount = 0;
    subscribers.forEach((ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(message);
        sentCount++;
      }
    });

    console.log(`Broadcast new order #${order.id} to ${sentCount} kitchen staff`);
    return true;
  }

  /**
   * Broadcast order status update
   */
  broadcastOrderStatusUpdate(restaurantId, orderId, newStatus) {
    const subscribers = this.kitchenSubscribers.get(restaurantId);
    if (!subscribers || subscribers.size === 0) {
      return false;
    }

    const message = JSON.stringify({
      type: "ORDER_STATUS_UPDATE",
      timestamp: new Date().toISOString(),
      orderId,
      status: newStatus
    });

    let sentCount = 0;
    subscribers.forEach((ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(message);
        sentCount++;
      }
    });

    return true;
  }

  /**
   * Broadcast inventory update
   */
  broadcastInventoryUpdate(restaurantId, menuItemId, newQuantity) {
    const subscribers = this.kitchenSubscribers.get(restaurantId);
    if (!subscribers || subscribers.size === 0) {
      return false;
    }

    const message = JSON.stringify({
      type: "INVENTORY_UPDATE",
      timestamp: new Date().toISOString(),
      menuItemId,
      quantityAvailable: newQuantity
    });

    subscribers.forEach((ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(message);
      }
    });

    return true;
  }

  /**
   * Send ping to check connection status
   */
  ping(restaurantId) {
    const subscribers = this.kitchenSubscribers.get(restaurantId);
    if (!subscribers) return;

    subscribers.forEach((ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.ping();
      }
    });
  }
}

export const notificationService = new NotificationService();
