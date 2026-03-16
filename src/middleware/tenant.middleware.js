function tenantMiddleware(req, res, next) {
  const restaurantId = req.headers["x-restaurant-id"];

  if (!restaurantId) {
    return res.status(400).json({
      error: "Restaurant ID is required in x-restaurant-id header"
    });
  }
  
  req.restaurantId = parseInt(restaurantId);

  next();
}

module.exports = tenantMiddleware;
