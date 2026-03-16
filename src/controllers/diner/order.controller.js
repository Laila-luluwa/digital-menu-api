export const createOrder = async (req, res) => {
  const { items } = req.body;
  const sessionToken = req.headers['x-session-token'];

  try {
    // 1. Имитируем расчет стоимости (в будущем это будет из БД)
    // Допустим, каждый товар в среднем стоит 2000 тенге
    const itemPrice = 2000; 
    const totalAmount = items.reduce((sum, item) => sum + (item.qty * itemPrice), 0);

    // 2. Рассчитываем примерное время ожидания
    // Например: 10 минут база + 5 минут на каждый товар
    const estimatedTime = 10 + (items.length * 5);

    // 3. Генерируем ID заказа
    const orderId = `ORD-${Math.floor(1000 + Math.random() * 9000)}`;

    console.log(`[Order] Заказ ${orderId} создан для сессии ${sessionToken}`);

    // Возвращаем гостю "Цифровой чек"
    res.status(201).json({
      success: true,
      message: "Заказ успешно оформлен!",
      order_details: {
        id: orderId,
        status: "preparing", // Статус: Готовится
        items_count: items.length,
        total_amount: totalAmount,
        currency: "KZT",
        wait_time_estimate: `${estimatedTime} min`
      }
    });

  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: "Ошибка при обработке чека", 
      error: error.message 
    });
  }
};