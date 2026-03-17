export const validateRequest = (req, res, next) => {
  const { items } = req.body;

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({
      error: "Validation failed: items must be a non-empty array."
    });
  }

  for (const item of items) {
    const itemId =
      item.item_id || item.menu_item_id || item.menuItemId || item.id;
    const qty = Number(item.qty);

    if (!itemId) {
      return res.status(400).json({
        error: "Validation failed: each item must have an id."
      });
    }

    if (!Number.isFinite(qty) || qty <= 0) {
      return res.status(400).json({
        error: "Validation failed: qty must be a positive number."
      });
    }
  }

  next();
};
