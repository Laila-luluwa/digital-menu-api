import { menuRepository } from "../../repositories/menu.repository.js";

export const getMenu = async (req, res) => {
  try {
    const diet = req.query.diet;
    const dietList = diet
      ? String(diet)
          .split(",")
          .map((d) => d.trim())
          .filter(Boolean)
      : [];

    const menu = await menuRepository.findAvailable(req.restaurantId, dietList);

    res.json(menu);
  } catch (error) {
    res.status(500).json({ error: "Failed to load menu." });
  }
};
