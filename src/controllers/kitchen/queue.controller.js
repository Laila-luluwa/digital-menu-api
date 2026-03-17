import prisma from '../../../prisma/client.js';

// 1. Получить все активные заказы (которые еще не поданы)
export const getActiveOrders = async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      where: {
        status: { in: ['queued', 'cooking', 'ready'] } // Игнорируем завершенные 'served'
      },
      include: {
        items: {
          include: { menuItem: true } // Чтобы повар видел название блюда, а не просто ID
        }
      },
      orderBy: { createdAt: 'asc' } // Сначала самые старые (первым пришел — первым обслужен)
    });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: "Не удалось загрузить заказы для кухни" });
  }
};

// 2. Изменить статус заказа (например, с 'queued' на 'cooking')
export const updateOrderStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body; // Ожидаем: 'cooking', 'ready' или 'served'

  try {
    const updatedOrder = await prisma.order.update({
      where: { id: Number(id) },
      data: { status }
    });

    res.json({
      success: true,
      message: `Статус заказа #${id} изменен на ${status}`,
      order: updatedOrder
    });
  } catch (error) {
    res.status(400).json({ error: "Ошибка при обновлении статуса. Проверь ID заказа." });
  }
};