import express from "express";
import { createOrder } from "../controllers/diner/order.controller.js";
import { getMenu } from "../controllers/diner/menu.controller.js";
import { startSession } from "../controllers/diner/session.controller.js";
import { validateSession } from "../middleware/validateSession.js";
import { validateRequest } from "../middleware/validateRequest.js";

const router = express.Router();

// Start session by table code (QR)
router.post("/sessions/start", startSession);

// Menu for active session
router.get("/menu", validateSession, getMenu);

// Create order for active session
router.post("/orders", validateSession, validateRequest, createOrder);

export default router;
