import prisma from '../../../prisma/client.js';

export const createOrder = async (req, res) => {
  const { items, tableCode, restaurantId } = req.body;

  try {
    const newOrder = await prisma.$transaction(async (tx) => {
      let total = 0;

      // 1. Создаем запись самого заказа
      const order = await tx.order.create({
        data: {
          tableCode,
          restaurantId,
          totalPrice: 0, // Посчитаем ниже
        }
      });

      // 2. Обрабатываем каждое блюдо
      for (const item of items) {
        const dish = await tx.menuItem.findUnique({ where: { id: item.item_id } });

        if (!dish || dish.quantity < item.qty) {
          throw new Error(`Недостаточно товара: ${dish?.name || 'ID ' + item.item_id}`);
        }

        // Списываем со склада
        await tx.menuItem.update({
          where: { id: item.item_id },
          data: { quantity: { decrement: item.qty } }
        });

        // Создаем запись в OrderItem
        await tx.orderItem.create({
          data: {
            orderId: order.id,
            menuItemId: item.item_id,
            quantity: item.qty
          }
        });

        total += dish.price * item.qty;
      }

      // 3. Обновляем итоговую сумму в заказе
      return await tx.order.update({
        where: { id: order.id },
        data: { totalPrice: total },
        include: { items: true } // Вернем заказ вместе с позициями
      });
    });

    res.status(201).json({ success: true, order: newOrder });

  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};