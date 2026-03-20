import bcrypt from "bcryptjs";
import prisma from "../prismaClient.js";

/**
 * Basic Authentication Middleware
 * 
 * Accepts credentials in format: Authorization: Basic base64(email:password)
 * 
 * Example:
 * Authorization: Basic dXNlckB0ZXN0LmNvbTpQYXNzMTIzIQ==
 * 
 * Where base64("user@test.com:Pass123!") = "dXNlckB0ZXN0LmNvbTpQYXNzMTIzIQ=="
 */

export const validateBasicAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Basic ")) {
    return res.status(401).json({
      error: "No basic auth credentials provided",
      hint: "Use Authorization: Basic base64(email:password)"
    });
  }

  try {
    // Extract base64 credentials
    const base64Credentials = authHeader.slice(6);
    const credentials = Buffer.from(base64Credentials, "base64").toString("utf-8");
    const [email, password] = credentials.split(":");

    if (!email || !password) {
      return res.status(400).json({
        error: "Invalid basic auth format",
        hint: "Format should be: email:password"
      });
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return res.status(401).json({
        error: "Invalid email or password"
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        error: "Invalid email or password"
      });
    }

    // Set user info in request
    req.user = {
      userId: user.id,
      email: user.email,
      role: user.role,
      restaurantId: user.restaurantId
    };
    req.userId = user.id;
    req.restaurantId = user.restaurantId;

    next();
  } catch (error) {
    console.error("Basic Auth Error:", error);
    return res.status(400).json({
      error: "Invalid basic auth credentials"
    });
  }
};

/**
 * Combined Auth Middleware (JWT or Basic Auth)
 * 
 * Tries JWT first, then falls back to Basic Auth
 */
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-this";

export const validateCombinedAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  // Try JWT first
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
      req.userId = decoded.userId;
      req.restaurantId = decoded.restaurantId;
      req.authType = "JWT";
      return next();
    } catch (error) {
      return res.status(401).json({
        error: "Invalid or expired JWT token"
      });
    }
  }

  // Try Basic Auth
  if (authHeader && authHeader.startsWith("Basic ")) {
    try {
      const base64Credentials = authHeader.slice(6);
      const credentials = Buffer.from(base64Credentials, "base64").toString("utf-8");
      const [email, password] = credentials.split(":");

      if (!email || !password) {
        return res.status(400).json({
          error: "Invalid basic auth format"
        });
      }

      const user = await prisma.user.findUnique({
        where: { email }
      });

      if (!user) {
        return res.status(401).json({
          error: "Invalid email or password"
        });
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);

      if (!isPasswordValid) {
        return res.status(401).json({
          error: "Invalid email or password"
        });
      }

      req.user = {
        userId: user.id,
        email: user.email,
        role: user.role,
        restaurantId: user.restaurantId
      };
      req.userId = user.id;
      req.restaurantId = user.restaurantId;
      req.authType = "BasicAuth";
      return next();
    } catch (error) {
      console.error("Basic Auth Error:", error);
      return res.status(400).json({
        error: "Invalid basic auth credentials"
      });
    }
  }

  // No auth provided
  return res.status(401).json({
    error: "No authorization credentials provided",
    hint: "Use either JWT (Bearer TOKEN) or Basic Auth (email:password)"
  });
};
