import express from "express";
import { createOrder } from "../controllers/diner/order.controller.js";
import { getMenu } from "../controllers/diner/menu.controller.js";
import { startSession } from "../controllers/diner/session.controller.js";
import { validateTableSession } from "../middleware/validateJWT.js";
import { validateRequest } from "../middleware/validateRequest.js";

const router = express.Router();

// Start session by table code (QR) - no auth required
router.post("/sessions/start", startSession);

// Menu for active session - using session token
router.get("/menu", validateTableSession, getMenu);

// Create order for active session - using session token
router.post("/orders", validateTableSession, validateRequest, createOrder);

export default router;
