import prisma from "../prismaClient.js";

export const tableRepository = {
  // Get all tables for restaurant
  findByRestaurant: async (restaurantId) => {
    return await prisma.table.findMany({
      where: { restaurantId },
      include: {
        sessions: {
          where: { status: "ACTIVE" }
        }
      }
    });
  },

  // Get table by ID
  findById: async (id, restaurantId) => {
    return await prisma.table.findFirst({
      where: {
        id,
        restaurantId
      },
      include: {
        sessions: {
          where: { status: "ACTIVE" },
          orderBy: { createdAt: "desc" },
          take: 1
        }
      }
    });
  },

  // Create table
  create: async (data) => {
    return await prisma.table.create({
      data
    });
  },

  // Update table
  update: async (id, data) => {
    return await prisma.table.update({
      where: { id },
      data
    });
  },

  // Delete table
  delete: async (id) => {
    return await prisma.table.delete({
      where: { id }
    });
  },

  // Find by table code
  findByCode: async (tableCode, restaurantId) => {
    return await prisma.table.findFirst({
      where: {
        tableCode,
        restaurantId
      }
    });
  },

  // Check if table code exists
  existsByCode: async (tableCode, restaurantId) => {
    return await prisma.table.findFirst({
      where: {
        tableCode,
        restaurantId
      }
    });
  }
};
