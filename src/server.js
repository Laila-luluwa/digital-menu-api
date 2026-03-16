const express = require("express");
const restaurantRoutes = require("./routes/restaurants.routes");
const tenantMiddleware = require("./middleware/tenant.middleware");
const menuRoutes = require("./routes/menu.routes");
const tableRoutes = require("./routes/tables.routes");

const app = express();

app.use(express.json());
app.use(tenantMiddleware);
app.use("/api", menuRoutes);
app.use("/api", tableRoutes);
app.use("/api", restaurantRoutes);

app.get("/", (req, res) => {
  res.send("Digital Menu API is running");
});

app.listen(3000, () => {
  console.log("Server running on port 3000");
});