// Имитируем базу заказов
let orders = [
  { id: 101, table: "STOL_01", items: [{ name: "Burger", qty: 2 }], status: "queued" },
  { id: 102, table: "STOL_05", items: [{ name: "Salad", qty: 1 }], status: "cooking" }
];

// 1. Получить список всех активных заказов
export const getActiveOrders = async (req, res) => {
  // В будущем тут будет: prisma.orders.findMany({ where: { status: { not: 'served' } } })
  res.status(200).json(orders);
};

// 2. Изменить статус заказа (Hard Part: Status Machine)
export const updateOrderStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body; // например, 'cooking' или 'ready'

  const order = orders.find(o => o.id === parseInt(id));
  if (!order) return res.status(404).json({ error: "Заказ не найден" });

  order.status = status;
  console.log(`[Kitchen] Заказ ${id} теперь в статусе: ${status}`);

  res.status(200).json({ message: `Статус обновлен на ${status}`, order });
};