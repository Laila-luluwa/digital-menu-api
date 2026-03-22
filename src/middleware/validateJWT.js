import jwt from "jsonwebtoken";
import { getJwtSecret } from "../config/env.js";

const JWT_SECRET = getJwtSecret();

export const validateJWT = (req, res, next) => {
  const token = 
    req.headers.authorization?.split(" ")[1] || 
    req.headers["x-auth-token"] ||
    req.query.token ||
    req.body.token;

  if (!token) {
    return res.status(401).json({
      error: "No authorization token provided"
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    req.userId = decoded.userId;
    req.restaurantId = decoded.restaurantId;
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Token expired" });
    }
    return res.status(401).json({ error: "Invalid token" });
  }
};

// Middleware to check user role
export const authorizeRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "No user information" });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: "Insufficient permissions"
      });
    }

    next();
  };
};

// Validate token for table sessions (diner)
export const validateTableSession = async (req, res, next) => {
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
    const prisma = (await import("../prismaClient.js")).default;
    
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
