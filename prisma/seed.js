import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  console.log('Начинаю заполнение базы данных...')

  const restaurant = await prisma.restaurant.create({
    data: {
      name: "Asanali's Digital Cafe",
    },
  })

  const items = [
    { name: 'Бургер "Классика"', price: 2200, quantity: 40, restaurantId: restaurant.id },
    { name: 'Пицца Маргарита', price: 3500, quantity: 25, restaurantId: restaurant.id },
    { name: 'Картофель фри', price: 950, quantity: 60, restaurantId: restaurant.id },
    { name: 'Кока-кола 0.5', price: 600, quantity: 100, restaurantId: restaurant.id },
    { name: 'Чизкейк', price: 1800, quantity: 15, restaurantId: restaurant.id },
  ]

  for (const item of items) {
    const menuItem = await prisma.menuItem.create({ data: item })
    await prisma.inventory.create({
      data: { menuItemId: menuItem.id, quantityAvailable: item.quantity }
    })
  }

  await prisma.table.createMany({
    data: [
      { tableCode: 'TABLE-01', restaurantId: restaurant.id },
      { tableCode: 'TABLE-02', restaurantId: restaurant.id },
      { tableCode: 'TABLE-03', restaurantId: restaurant.id },
    ],
  })

  console.log('База успешно наполнена: 1 ресторан, 5 блюд, 3 стола.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
