import prisma from "../prismaClient.js";

export const validateSession = async (req, res, next) => {
  const token =
    req.headers["x-session-token"] ||
    req.query.session_token ||
    req.body.session_token ||
    req.body.sessionToken;

  if (!token) {
    return res.status(401).json({
      error: "No session token. Scan the QR code first."
    });
  }

  try {
    const session = await prisma.tableSession.findUnique({
      where: { token: String(token) },
      include: { table: true }
    });

    if (!session) {
      return res.status(401).json({ error: "Invalid session token." });
    }

    const now = new Date();
    const isExpired = session.expiresAt <= now || session.status !== "ACTIVE";

    if (isExpired) {
      if (session.status !== "EXPIRED") {
        await prisma.tableSession.update({
          where: { id: session.id },
          data: { status: "EXPIRED" }
        });
      }
      return res.status(403).json({ error: "Session expired." });
    }

    req.session = session;
    req.tableId = session.tableId;
    req.restaurantId = session.table.restaurantId;
    next();
  } catch (error) {
    res.status(500).json({ error: "Failed to validate session." });
  }
};
