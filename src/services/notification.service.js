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

  broadcastToRestaurant(restaurantId, payload) {
    const subscribers = this.kitchenSubscribers.get(restaurantId);
    if (!subscribers || subscribers.size === 0) {
      return false;
    }

    const message = JSON.stringify({
      timestamp: new Date().toISOString(),
      ...payload
    });

    let sentCount = 0;
    subscribers.forEach((ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(message);
        sentCount++;
      }
    });

    return sentCount > 0;
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
    const sent = this.broadcastToRestaurant(restaurantId, {
      type: "NEW_ORDER",
      data: order
    });

    if (!sent) {
      console.log(`No kitchen staff connected for restaurant ${restaurantId}`);
      return false;
    }

    console.log(`Broadcast new order #${order.id} to kitchen staff`);
    return true;
  }

  /**
   * Broadcast order status update
   */
  broadcastOrderStatusUpdate(restaurantId, orderId, newStatus) {
    return this.broadcastToRestaurant(restaurantId, {
      type: "ORDER_STATUS_UPDATE",
      orderId,
      status: newStatus
    });
  }

  /**
   * Broadcast inventory update
   */
  broadcastInventoryUpdate(restaurantId, menuItemId, newQuantity) {
    return this.broadcastToRestaurant(restaurantId, {
      type: "INVENTORY_UPDATE",
      menuItemId,
      quantityAvailable: newQuantity
    });
  }

  broadcastMenuItemUpdated(restaurantId, menuItem) {
    return this.broadcastToRestaurant(restaurantId, {
      type: "MENU_ITEM_UPDATED",
      data: menuItem
    });
  }

  broadcastMenuItemDeleted(restaurantId, menuItemId) {
    return this.broadcastToRestaurant(restaurantId, {
      type: "MENU_ITEM_DELETED",
      menuItemId
    });
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
