import prisma from "../prismaClient.js";

export const sessionRepository = {
  // Find session by token
  findByToken: async (token) => {
    return await prisma.tableSession.findUnique({
      where: { token },
      include: { table: true }
    });
  },

  // Find session by ID
  findById: async (id) => {
    return await prisma.tableSession.findUnique({
      where: { id },
      include: { table: true }
    });
  },

  // Create new session
  create: async (tableId, expiresAt) => {
    return await prisma.tableSession.create({
      data: {
        tableId,
        expiresAt
      }
    });
  },

  // Update session status
  updateStatus: async (id, status) => {
    return await prisma.tableSession.update({
      where: { id },
      data: { status }
    });
  },

  // Close session
  close: async (id) => {
    return await prisma.tableSession.update({
      where: { id },
      data: { status: "EXPIRED" }
    });
  },

  // Find active sessions for table
  findActiveForTable: async (tableId) => {
    return await prisma.tableSession.findMany({
      where: {
        tableId,
        status: "ACTIVE"
      },
      include: { table: true }
    });
  },

  // Check if session is valid (not expired)
  isValid: async (token) => {
    const session = await prisma.tableSession.findUnique({
      where: { token }
    });
    
    if (!session || session.status !== "ACTIVE") {
      return false;
    }
    
    return new Date() < session.expiresAt;
  }
};
