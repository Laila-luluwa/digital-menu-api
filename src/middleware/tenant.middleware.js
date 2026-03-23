export default function tenantMiddleware(req, res, next) {
  const tokenRestaurantId = Number(req.restaurantId || req.user?.restaurantId);
  const headerRestaurantId = req.headers["x-restaurant-id"];

  if (!Number.isFinite(tokenRestaurantId)) {
    return res.status(401).json({
      error: "Authenticated restaurant context is missing"
    });
  }

  if (headerRestaurantId !== undefined) {
    const parsedHeaderRestaurantId = Number(headerRestaurantId);
    if (!Number.isFinite(parsedHeaderRestaurantId)) {
      return res.status(400).json({
        error: "Restaurant ID in x-restaurant-id must be a number"
      });
    }

    if (parsedHeaderRestaurantId !== tokenRestaurantId) {
      return res.status(403).json({
        error: "x-restaurant-id does not match authenticated restaurant"
      });
    }
  }

  req.restaurantId = tokenRestaurantId;
  next();
}
