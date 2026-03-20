import express from "express";
import { login, register, validateToken } from "../controllers/auth.controller.js";
import { validateJWT } from "../middleware/validateJWT.js";

const router = express.Router();

// Public routes
router.post("/login", login);
router.post("/register", register);

// Protected routes
router.get("/validate", validateJWT, validateToken);

export default router;
