// src/middleware/validateRequest.js

export const validateRequest = (req, res, next) => {
  const { items } = req.body;

  // Базовая проверка: есть ли вообще товары
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ 
      error: "Validation failed: Корзина не может быть пустой." 
    });
  }

  // Проверка на количество
  if (items.some(i => i.qty <= 0)) {
    return res.status(400).json({ 
      error: "Validation failed: Количество товара должно быть больше нуля." 
    });
  }

  next(); // Всё ок, идем дальше
};