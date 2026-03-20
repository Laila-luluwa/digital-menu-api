import express from "express";
import http from "http";
import WebSocket from "ws";
import dinerRoutes from "./routes/diner.routes.js";
import kitchenRoutes from "./routes/kitchen.routes.js";
import authRoutes from "./routes/auth.routes.js";
import restaurantRoutes from "./routes/restaurants.routes.js";
import menuRoutes from "./routes/menu.routes.js";
import tableRoutes from "./routes/tables.routes.js";
import userRoutes from "./routes/users.routes.js";
import { validateJWT } from "./middleware/validateJWT.js";
import { notificationService } from "./services/notification.service.js";
import { startSessionCleanupJob } from "./services/sessionExpiration.service.js";

const app = express();
const server = http.createServer(app);

// Create WebSocket server
const wss = new WebSocket.Server({ 
  server,
  path: "/api/kitchen/ws"
});

app.use(express.json());

// Public routes (БЕЗ защиты - доступны всем)
app.use("/api/auth", authRoutes);

// Diner routes (table-based, uses session tokens not JWT)
app.use("/api/diner", dinerRoutes);

// Protected routes that require JWT authentication
app.use("/api/kitchen", validateJWT, kitchenRoutes);
app.use("/api", validateJWT, restaurantRoutes);
app.use("/api", validateJWT, menuRoutes);
app.use("/api", validateJWT, tableRoutes);
app.use("/api", validateJWT, userRoutes);

app.get("/", (req, res) => {
  res.json({
    message: "Digital Menu API is running",
    timestamp: new Date().toISOString()
  });
});

// ========== WEBSOCKET CONNECTION HANDLER ==========
wss.on("connection", (ws, req) => {
  const restaurantId = req.headers["x-restaurant-id"];
  const authorization = req.headers.authorization;

  console.log(`WebSocket connection from restaurant ${restaurantId}`);

  // Validate connection - must have JWT token and restaurant ID
  if (!authorization || !restaurantId) {
    ws.close(1008, "Missing authorization or restaurant ID");
    return;
  }

  try {
    // Register this connection for the restaurant
    notificationService.registerKitchenConnection(Number(restaurantId), ws);

    // Handle incoming messages (ping/heartbeat)
    ws.on("message", (message) => {
      try {
        const data = JSON.parse(message);
        
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
      console.log(`Kitchen staff disconnected from restaurant ${restaurantId}`);
    });

  } catch (error) {
    console.error("WebSocket connection error:", error);
    ws.close(1011, "Server error");
  }
});

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

