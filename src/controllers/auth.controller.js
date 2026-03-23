import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { userRepository } from "../repositories/user.repository.js";
import prisma from "../prismaClient.js";
import { getJwtSecret } from "../config/env.js";
import { registerSchema, loginSchema } from "../schema/validation.js";
import { ERROR_CODES } from "../utils/errors.js";

const JWT_SECRET = getJwtSecret();
const PLATFORM_ADMIN_BOOTSTRAP_HEADER = "x-platform-admin-bootstrap-key";
const PLATFORM_ADMIN_BOOTSTRAP_KEY =
  process.env.PLATFORM_ADMIN_BOOTSTRAP_KEY || "";

// Register a new user
export const register = async (req, res, next) => {
  try {
    // Validate request
    const validated = registerSchema.parse(req.body);
    const { email, name, password, role, restaurantId } = validated;

    if (role === "PLATFORM_ADMIN") {
      const providedBootstrapKey =
        req.headers[PLATFORM_ADMIN_BOOTSTRAP_HEADER] ||
        req.headers[PLATFORM_ADMIN_BOOTSTRAP_HEADER.toLowerCase()];

      if (!PLATFORM_ADMIN_BOOTSTRAP_KEY) {
        return res.status(403).json({
          code: ERROR_CODES.FORBIDDEN.code,
          message: "Platform admin registration is disabled",
          timestamp: new Date().toISOString()
        });
      }

      if (providedBootstrapKey !== PLATFORM_ADMIN_BOOTSTRAP_KEY) {
        return res.status(403).json({
          code: ERROR_CODES.FORBIDDEN.code,
          message: "Invalid bootstrap key for platform admin registration",
          timestamp: new Date().toISOString()
        });
      }

      const platformAdminCount = await userRepository.countByRole("PLATFORM_ADMIN");
      if (platformAdminCount > 0) {
        return res.status(409).json({
          code: ERROR_CODES.DUPLICATE_RESOURCE.code,
          message: "Platform admin already exists",
          timestamp: new Date().toISOString()
        });
      }
    }

    // Check if user already exists in this restaurant
    const existingUser = await userRepository.findByEmail(email, restaurantId);

    if (existingUser) {
      return res.status(409).json({
        code: ERROR_CODES.USER_ALREADY_EXISTS.code,
        message: "User already exists in this restaurant",
        timestamp: new Date().toISOString()
      });
    }

    const restaurantExists = await prisma.restaurant.findUnique({
      where: { id: Number(restaurantId) },
      select: { id: true }
    });

    if (!restaurantExists) {
      return res.status(404).json({
        code: ERROR_CODES.RESOURCE_NOT_FOUND.code,
        message: "Restaurant not found",
        timestamp: new Date().toISOString()
      });
    }

    // Hash password (bcrypt enforces complexity)
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await userRepository.create({
      email,
      name,
      password: hashedPassword,
      role,
      restaurantId: Number(restaurantId)
    });

    // Create RestaurantUser relationship
    await userRepository.createRestaurantUser(Number(restaurantId), user.id, role);

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role, restaurantId: user.restaurantId },
      JWT_SECRET,
      { expiresIn: "24h" }
    );

    res.status(201).json({
      message: "User registered successfully",
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        restaurantId: user.restaurantId
      },
      token
    });
  } catch (error) {
    if (error.name === "ZodError") {
      return res.status(400).json({
        code: ERROR_CODES.VALIDATION_ERROR.code,
        errors: error.issues.map((e) => ({
          field: e.path.join("."),
          message: e.message
        })),
        timestamp: new Date().toISOString()
      });
    }
    if (error.code === "P2002") {
      return res.status(409).json({
        code: ERROR_CODES.USER_ALREADY_EXISTS.code,
        message: "User already exists",
        timestamp: new Date().toISOString()
      });
    }
    if (error.code === "P2003") {
      return res.status(404).json({
        code: ERROR_CODES.RESOURCE_NOT_FOUND.code,
        message: "Restaurant not found",
        timestamp: new Date().toISOString()
      });
    }
    next(error);
  }
};

// Login user
export const login = async (req, res, next) => {
  try {
    // Validate request
    const validated = loginSchema.parse(req.body);
    const { email, password } = validated;

    // Find user by email (globally for login)
    const user = await userRepository.findByEmail(email);

    if (!user || !user.password) {
      return res.status(401).json({
        code: ERROR_CODES.INVALID_CREDENTIALS.code,
        message: "Invalid email or password",
        timestamp: new Date().toISOString()
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        code: ERROR_CODES.INVALID_CREDENTIALS.code,
        message: "Invalid email or password",
        timestamp: new Date().toISOString()
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role, restaurantId: user.restaurantId },
      JWT_SECRET,
      { expiresIn: "24h" }
    );

    res.json({
      message: "Login successful",
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        restaurantId: user.restaurantId
      },
      token
    });
  } catch (error) {
    if (error.name === "ZodError") {
      return res.status(400).json({
        code: ERROR_CODES.VALIDATION_ERROR.code,
        errors: error.issues.map((e) => ({
          field: e.path.join("."),
          message: e.message
        })),
        timestamp: new Date().toISOString()
      });
    }
    next(error);
  }
};

// Validate token (for testing)
export const validateToken = async (req, res) => {
  res.json({
    message: "Token is valid",
    user: req.user
  });
};
