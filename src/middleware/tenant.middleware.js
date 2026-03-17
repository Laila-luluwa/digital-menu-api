export default function tenantMiddleware(req, res, next) {
  const restaurantId = req.headers["x-restaurant-id"];

  if (!restaurantId) {
    return res.status(400).json({
      error: "Restaurant ID is required in x-restaurant-id header"
    });
  }

  const parsed = Number(restaurantId);
  if (Number.isNaN(parsed)) {
    return res.status(400).json({
      error: "Restaurant ID must be a number"
    });
  }

  req.restaurantId = parsed;
  next();
}
