import rateLimit, { ipKeyGenerator } from "express-rate-limit";

/**
 * General API rate limiter (100 requests per 15 minutes)
 */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: {
    code: "RATE_LIMIT_EXCEEDED",
    message: "Too many requests, please try again later"
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => process.env.NODE_ENV === "development"
});

/**
 * Authentication rate limiter (5 requests per 15 minutes per IP/email)
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: {
    code: "RATE_LIMIT_EXCEEDED",
    message: "Too many login/register attempts, please try again later"
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Use email as key if provided, otherwise use IP
    return req.body?.email || ipKeyGenerator(req);
  },
  skip: (req) => process.env.NODE_ENV === "development"
});

/**
 * Order creation rate limiter (10 per minute per session)
 */
export const orderLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: {
    code: "RATE_LIMIT_EXCEEDED",
    message: "Too many orders, please wait"
  },
  keyGenerator: (req) => req.session?.token || ipKeyGenerator(req),
  skip: (req) => process.env.NODE_ENV === "development"
});

/**
 * CORS configuration
 */
export const corsConfig = {
  origin: (origin, callback) => {
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(",") || [
      "http://localhost:3000",
      "http://localhost:3001",
      "http://localhost:5173"
    ];

    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "x-restaurant-id",
    "x-session-token",
    "x-auth-token",
    "x-request-id"
  ],
  maxAge: 3600
};
