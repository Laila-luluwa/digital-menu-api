import express from "express";
import { getActiveOrders, updateOrderStatus } from "../controllers/kitchen/queue.controller.js";
import tenantMiddleware from "../middleware/tenant.middleware.js";
import { authorizeRole } from "../middleware/authorizeRole.js";

const router = express.Router();

router.use(tenantMiddleware);

// Kitchen staff endpoints - requires KITCHEN, MANAGER, OWNER, or PLATFORM_ADMIN role
router.use(authorizeRole("KITCHEN", "MANAGER", "OWNER", "PLATFORM_ADMIN"));

// Queue for kitchen - get active orders (QUEUED, COOKING, READY)
router.get("/orders", getActiveOrders);

// Update order status
router.patch("/orders/:id/status", updateOrderStatus);

// WebSocket endpoint for real-time updates
// This will be handled in the server setup with ws.on('connection')
router.get("/ws", (req, res) => {
  res.status(400).json({ 
    code: "INVALID_METHOD",
    message: "WebSocket connection required. Use ws:// instead of http://" 
  });
});

export default router;
