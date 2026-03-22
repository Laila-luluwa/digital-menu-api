import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import prisma from "../prismaClient.js";
import { userRepository } from "../repositories/user.repository.js";
import { getJwtSecret } from "../config/env.js";

/**
 * Basic Authentication Middleware
 *
 * Accepts credentials in format: Authorization: Basic base64(email:password)
 */

const JWT_SECRET = getJwtSecret();

const parseBasicCredentials = (authHeader) => {
  if (!authHeader || !authHeader.startsWith("Basic ")) {
    return null;
  }

  const base64Credentials = authHeader.slice(6);
  const credentials = Buffer.from(base64Credentials, "base64").toString("utf-8");
  const [email, password] = credentials.split(":");

  if (!email || !password) {
    return { error: "Invalid basic auth format" };
  }

  return { email, password };
};

const getRequestedRestaurantId = (req) => {
  const rawHeader = req.headers["x-restaurant-id"];
  if (rawHeader === undefined) {
    return null;
  }

  const parsed = Number(rawHeader);
  if (!Number.isFinite(parsed)) {
    return { error: "x-restaurant-id must be a number" };
  }

  return parsed;
};

const authenticateBasicUser = async (req) => {
  const parsed = parseBasicCredentials(req.headers.authorization);
  if (!parsed) {
    return { status: 401, body: { error: "No basic auth credentials provided", hint: "Use Authorization: Basic base64(email:password)" } };
  }
  if (parsed.error) {
    return { status: 400, body: { error: parsed.error, hint: "Format should be: email:password" } };
  }

  const requestedRestaurantId = getRequestedRestaurantId(req);
  if (requestedRestaurantId && requestedRestaurantId.error) {
    return { status: 400, body: { error: requestedRestaurantId.error } };
  }

  const user = await userRepository.findByEmail(parsed.email, requestedRestaurantId || undefined);

  if (!user || !user.password) {
    return { status: 401, body: { error: "Invalid email or password" } };
  }

  const isPasswordValid = await bcrypt.compare(parsed.password, user.password);
  if (!isPasswordValid) {
    return { status: 401, body: { error: "Invalid email or password" } };
  }

  return {
    user: {
      userId: user.id,
      email: user.email,
      role: user.role,
      restaurantId: user.restaurantId
    }
  };
};

export const validateBasicAuth = async (req, res, next) => {
  try {
    const authResult = await authenticateBasicUser(req);
    if (authResult.status) {
      return res.status(authResult.status).json(authResult.body);
    }

    req.user = authResult.user;
    req.userId = authResult.user.userId;
    req.restaurantId = authResult.user.restaurantId;

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
    } catch {
      return res.status(401).json({
        error: "Invalid or expired JWT token"
      });
    }
  }

  // Try Basic Auth
  if (authHeader && authHeader.startsWith("Basic ")) {
    try {
      const authResult = await authenticateBasicUser(req);
      if (authResult.status) {
        return res.status(authResult.status).json(authResult.body);
      }

      req.user = authResult.user;
      req.userId = authResult.user.userId;
      req.restaurantId = authResult.user.restaurantId;
      req.authType = "BasicAuth";
      return next();
    } catch (error) {
      console.error("Basic Auth Error:", error);
      return res.status(400).json({
        error: "Invalid basic auth credentials"
      });
    }
  }

  return res.status(401).json({
    error: "No authorization credentials provided",
    hint: "Use either JWT (Bearer TOKEN) or Basic Auth (email:password)"
  });
};
