import express from "express";
import http from "http";
import cors from "cors";
import { WebSocketServer } from "ws";
import jwt from "jsonwebtoken";
import dinerRoutes from "./routes/diner.routes.js";
import kitchenRoutes from "./routes/kitchen.routes.js";
import authRoutes from "./routes/auth.routes.js";
import restaurantRoutes from "./routes/restaurants.routes.js";
import menuRoutes from "./routes/menu.routes.js";
import tableRoutes from "./routes/tables.routes.js";
import userRoutes from "./routes/users.routes.js";
import { validateCombinedAuth } from "./middleware/validateBasicAuth.js";
import { notificationService } from "./services/notification.service.js";
import { startSessionCleanupJob } from "./services/sessionExpiration.service.js";
import { getJwtSecret } from "./config/env.js";
import { loggerMiddleware } from "./utils/logger.js";
import { apiLimiter, authLimiter, corsConfig } from "./config/security.js";
import { errorHandler } from "./utils/errors.js";

const app = express();
const server = http.createServer(app);
const JWT_SECRET = getJwtSecret();

// Create WebSocket server
const wss = new WebSocketServer({
  server,
  path: "/api/kitchen/ws"
});

// ========== MIDDLEWARE ==========
app.use(cors(corsConfig));
app.use(express.json());
app.use(loggerMiddleware);
app.use(apiLimiter);

// ========== PUBLIC ROUTES (БЕЗ защиты) ==========
app.use("/api/auth", authLimiter, authRoutes);

// Diner routes (table-based, uses session tokens not JWT)
app.use("/api/diner", dinerRoutes);

// ========== PROTECTED ROUTES ==========
app.use("/api/kitchen", validateCombinedAuth, kitchenRoutes);
app.use("/api", validateCombinedAuth, restaurantRoutes);
app.use("/api", validateCombinedAuth, menuRoutes);
app.use("/api", validateCombinedAuth, tableRoutes);
app.use("/api", validateCombinedAuth, userRoutes);

app.get("/", (req, res) => {
  res.json({
    message: "Digital Menu API is running",
    timestamp: new Date().toISOString()
  });
});

// ========== WEBSOCKET CONNECTION HANDLER ==========
wss.on("connection", (ws, req) => {
  const restaurantIdHeader = req.headers["x-restaurant-id"];
  const authorization = req.headers.authorization;

  if (!authorization || !authorization.startsWith("Bearer ")) {
    ws.close(1008, "Missing Bearer token");
    return;
  }

  try {
    const token = authorization.slice(7);
    const decoded = jwt.verify(token, JWT_SECRET);
    const tokenRestaurantId = Number(decoded.restaurantId);

    if (!Number.isFinite(tokenRestaurantId)) {
      ws.close(1008, "Invalid token payload");
      return;
    }

    if (restaurantIdHeader !== undefined) {
      const parsedHeaderRestaurantId = Number(restaurantIdHeader);
      if (
        !Number.isFinite(parsedHeaderRestaurantId) ||
        parsedHeaderRestaurantId !== tokenRestaurantId
      ) {
        ws.close(1008, "Restaurant mismatch");
        return;
      }
    }

    console.log(`WebSocket connection from restaurant ${tokenRestaurantId}`);

    // Register this connection for the restaurant
    notificationService.registerKitchenConnection(tokenRestaurantId, ws);

    // Handle incoming messages (ping/heartbeat)
    ws.on("message", (message) => {
      try {
        const data = JSON.parse(message.toString());
        
        if (data.type === "ping") {
          ws.send(JSON.stringify({ type: "pong", timestamp: new Date().toISOString() }));
        }
      } catch (error) {
        console.error("Invalid message:", error);
      }
    });

    // Handle connection errors
    ws.on("error", (error) => {
      console.error("WebSocket error:", error);
    });

    // Handle disconnection
    ws.on("close", () => {
      console.log(`Kitchen staff disconnected from restaurant ${tokenRestaurantId}`);
    });

  } catch (error) {
    console.error("WebSocket connection error:", error);
    ws.close(1011, "Server error");
  }
});

// ========== ERROR HANDLER ==========
app.use(errorHandler);

// ========== START SERVER AND SERVICES ==========

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`\nAPI Endpoints:`);
  console.log(`- Auth: POST /api/auth/register, POST /api/auth/login`);
  console.log(`- Diner: POST /api/diner/sessions/start, GET /api/diner/menu`);
  console.log(`- Kitchen: GET /api/kitchen/orders, PATCH /api/kitchen/orders/:id/status`);
  console.log(`- WebSocket: ws://localhost:${PORT}/api/kitchen/ws`);
  console.log(`- Menu Admin: GET /api/menu-items, POST /api/menu-items`);
  console.log(`- Table Admin: GET /api/tables, POST /api/tables`);
  
  // Start background jobs
  startSessionCleanupJob();
  console.log(`✓ Session cleanup job started`);
});

