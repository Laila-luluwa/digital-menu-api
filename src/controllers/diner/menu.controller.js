import prisma from "../../prismaClient.js";

export const getMenu = async (req, res) => {
  try {
    const diet = req.query.diet;
    const dietList = diet
      ? String(diet)
          .split(",")
          .map((d) => d.trim())
          .filter(Boolean)
      : [];

    const menu = await prisma.menuItem.findMany({
      where: {
        restaurantId: req.restaurantId,
        inventory: { quantityAvailable: { gt: 0 } },
        ...(dietList.length
          ? {
              tags: {
                some: {
                  tag: { name: { in: dietList } }
                }
              }
            }
          : {})
      },
      include: {
        inventory: true,
        tags: { include: { tag: true } }
      }
    });

    res.json(menu);
  } catch (error) {
    res.status(500).json({ error: "Failed to load menu." });
  }
};
