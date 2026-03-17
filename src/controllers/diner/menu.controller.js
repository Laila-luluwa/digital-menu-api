import prisma from '../../../prisma/client.js'; // Путь к её файлу с Prisma

export const getMenu = async (req, res) => {
  try {
    // Достаем все блюда, которые есть в наличии (quantity > 0)
    const menu = await prisma.menuItem.findMany({
      where: {
        quantity: { gt: 0 } 
      }
    });

    res.json(menu);
  } catch (error) {
    res.status(500).json({ error: "Не удалось загрузить меню из базы" });
  }
};