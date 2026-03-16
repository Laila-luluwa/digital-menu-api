// Контроллер для оформления заказов
export const createOrder = async (req, res) => {
  // Данные приходят из Body (список блюд)
  const { items, total_price } = req.body;
  
  // Токен мы берем из заголовков (он там уже проверен middleware)
  const sessionToken = req.headers['x-session-token'];

  if (!items || items.length === 0) {
    return res.status(400).json({ error: "Корзина пуста!" });
  }

  try {
    console.log(`[Order] Получен заказ от сессии: ${sessionToken}`);
    console.log(`[Items]`, items);

    /* ГОРЯЧАЯ ТОЧКА (Hard Part): 
       Здесь мы вызываем логику напарницы. 
       Она должна обернуть это в ТРАНЗАКЦИЮ:
       1. Создать запись в таблице orders.
       2. Для каждого item уменьшить quantity в таблице inventory.
       3. Если на складе 0 — отменить всю транзакцию (Rollback).
    */

    // Имитируем успешное создание заказа
    const orderId = Math.floor(Math.random() * 10000);

    res.status(201).json({
      success: true,
      message: "Заказ принят! Кухня уже начала готовить.",
      order_id: orderId,
      status: "queued"
    });

  } catch (error) {
    res.status(500).json({ error: "Ошибка при создании заказа" });
  }
};