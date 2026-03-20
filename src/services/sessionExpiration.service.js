import prisma from "../prismaClient.js";

/**
 * Cleanup expired sessions periodically
 * Marks sessions as EXPIRED if their expiresAt time has passed
 */
export const cleanupExpiredSessions = async () => {
  try {
    const now = new Date();
    
    const expiredSessions = await prisma.tableSession.updateMany({
      where: {
        status: "ACTIVE",
        expiresAt: {
          lt: now
        }
      },
      data: {
        status: "EXPIRED"
      }
    });

    if (expiredSessions.count > 0) {
      console.log(`Cleaned up ${expiredSessions.count} expired sessions`);
    }

    return expiredSessions.count;
  } catch (error) {
    console.error("Error cleaning up expired sessions:", error);
  }
};

/**
 * Start periodic session cleanup job
 * Runs every 5 minutes (300000ms)
 */
export const startSessionCleanupJob = (interval = 300000) => {
  console.log("Starting session cleanup job...");
  
  setInterval(cleanupExpiredSessions, interval);
  
  // Run immediately once on startup
  cleanupExpiredSessions();
};
