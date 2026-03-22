import prisma from "../prismaClient.js";

export const userRepository = {
  // Find user by email and restaurant (for multi-tenant support)
  findByEmail: async (email, restaurantId = null) => {
    if (restaurantId) {
      return await prisma.user.findFirst({
        where: { email, restaurantId }
      });
    }
    // Falls back to finding by email only (for login - assume user knows their restaurant context)
    return await prisma.user.findFirst({
      where: { email }
    });
  },

  // Find user by ID
  findById: async (id) => {
    return await prisma.user.findUnique({
      where: { id }
    });
  },

  // Create new user
  create: async (data) => {
    return await prisma.user.create({
      data
    });
  },

  // Update user
  update: async (id, data) => {
    return await prisma.user.update({
      where: { id },
      data
    });
  },

  // Delete user
  delete: async (id) => {
    return await prisma.user.delete({
      where: { id }
    });
  },

  // Find all users by restaurant
  findByRestaurant: async (restaurantId) => {
    return await prisma.user.findMany({
      where: { restaurantId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        restaurantId: true,
        createdAt: true
      }
    });
  },

  // Create RestaurantUser relationship
  createRestaurantUser: async (restaurantId, userId, role) => {
    return await prisma.restaurantUser.create({
      data: {
        restaurantId,
        userId,
        role
      }
    });
  },

  updateRestaurantUserRole: async (restaurantId, userId, role) => {
    return await prisma.restaurantUser.update({
      where: {
        restaurantId_userId: {
          restaurantId,
          userId
        }
      },
      data: { role }
    });
  },

  countByRole: async (role) => {
    return await prisma.user.count({
      where: { role }
    });
  },

  deleteRestaurantUser: async (restaurantId, userId) => {
    return await prisma.restaurantUser.delete({
      where: {
        restaurantId_userId: {
          restaurantId,
          userId
        }
      }
    });
  }
};
