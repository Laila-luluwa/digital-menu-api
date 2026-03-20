import express from "express";
import { login, register, validateToken } from "../controllers/auth.controller.js";
import { validateCombinedAuth } from "../middleware/validateBasicAuth.js";

const router = express.Router();

// Public routes
router.post("/login", login);
router.post("/register", register);

// Protected routes (accepts JWT or Basic Auth)
router.get("/validate", validateCombinedAuth, validateToken);

export default router;
