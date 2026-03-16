import express from "express";
import restaurantRoutes from "./routes/restaurants.routes.js";
import tenantMiddleware from "./middleware/tenant.middleware.js";
import menuRoutes from "./routes/menu.routes.js";
import tableRoutes from "./routes/tables.routes.js";
import userRoutes from "./routes/users.routes.js";

const app = express();

app.use(express.json());
app.use(tenantMiddleware);
app.use("/api", menuRoutes);
app.use("/api", tableRoutes);
app.use("/api", restaurantRoutes);
app.use("/api", userRoutes);


app.get("/", (req, res) => {
  res.send("Digital Menu API is running");
});

app.listen(3000, () => {
  console.log("Server running on port 3000");
});