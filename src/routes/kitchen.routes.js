import express from "express";
import { getActiveOrders, updateOrderStatus } from "../controllers/kitchen/queue.controller.js";
import tenantMiddleware from "../middleware/tenant.middleware.js";

const router = express.Router();

router.use(tenantMiddleware);

// Queue for kitchen
router.get("/orders", getActiveOrders);

// Update order status
router.patch("/orders/:id/status", updateOrderStatus);

export default router;
