// Контроллер для работы гостя с меню
export const getMenu = async (req, res) => {
  // Имитируем данные из базы
  const mockMenu = [
    { id: 1, name: "Burger", price: 2500, tags: ["meat"] },
    { id: 2, name: "Vegan Salad", price: 1800, tags: ["vegan"] }
  ];

  res.status(200).json({
    restaurant_id: req.query.restaurant_id || 1,
    items: mockMenu
  });
};