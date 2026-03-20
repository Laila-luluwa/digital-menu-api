import express from "express";
import dinerRoutes from "./routes/diner.routes.js";
import kitchenRoutes from "./routes/kitchen.routes.js";
import authRoutes from "./routes/auth.routes.js";
import restaurantRoutes from "./routes/restaurants.routes.js";
import menuRoutes from "./routes/menu.routes.js";
import tableRoutes from "./routes/tables.routes.js";
import userRoutes from "./routes/users.routes.js";
import { validateJWT } from "./middleware/validateJWT.js";

const app = express();

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
  res.send("Digital Menu API is running");
});

app.listen(3000, () => {
  console.log("Server running on port 3000");
});

