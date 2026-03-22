/**
 * Standard error codes for API responses
 * Allows clients to programmatically handle different error types
 */
export const ERROR_CODES = {
  // Authentication & Authorization
  INVALID_CREDENTIALS: { code: "INVALID_CREDENTIALS", status: 401 },
  TOKEN_EXPIRED: { code: "TOKEN_EXPIRED", status: 401 },
  TOKEN_INVALID: { code: "TOKEN_INVALID", status: 401 },
  UNAUTHORIZED: { code: "UNAUTHORIZED", status: 401 },
  FORBIDDEN: { code: "FORBIDDEN", status: 403 },
  INSUFFICIENT_PERMISSIONS: { code: "INSUFFICIENT_PERMISSIONS", status: 403 },

  // Validation
  VALIDATION_ERROR: { code: "VALIDATION_ERROR", status: 400 },
  INVALID_REQUEST: { code: "INVALID_REQUEST", status: 400 },
  
  // Resource not found
  NOT_FOUND: { code: "NOT_FOUND", status: 404 },
  RESTAURANT_NOT_FOUND: { code: "NOT_FOUND", status: 404, message: "Restaurant not found" },
  MENU_ITEM_NOT_FOUND: { code: "NOT_FOUND", status: 404, message: "Menu item not found" },
  TABLE_NOT_FOUND: { code: "NOT_FOUND", status: 404, message: "Table not found" },
  ORDER_NOT_FOUND: { code: "NOT_FOUND", status: 404, message: "Order not found" },
  USER_NOT_FOUND: { code: "NOT_FOUND", status: 404, message: "User not found" },
  SESSION_NOT_FOUND: { code: "NOT_FOUND", status: 404, message: "Session not found" },

  // Business logic errors
  DUPLICATE_RESOURCE: { code: "DUPLICATE_RESOURCE", status: 409 },
  USER_ALREADY_EXISTS: { code: "DUPLICATE_RESOURCE", status: 409, message: "User already exists" },
  TABLE_CODE_EXISTS: { code: "DUPLICATE_RESOURCE", status: 409, message: "Table code already exists" },
  SESSION_EXPIRED: { code: "SESSION_EXPIRED", status: 403 },
  OUT_OF_STOCK: { code: "OUT_OF_STOCK", status: 400 },
  INSUFFICIENT_INVENTORY: { code: "OUT_OF_STOCK", status: 400 },
  INVALID_STATUS_TRANSITION: { code: "INVALID_STATUS_TRANSITION", status: 409 },
  RESTAURANT_MISMATCH: { code: "TENANT_MISMATCH", status: 403 },
  TENANT_MISMATCH: { code: "TENANT_MISMATCH", status: 403 },

  // Internal errors
  INTERNAL_ERROR: { code: "INTERNAL_ERROR", status: 500 },
  DATABASE_ERROR: { code: "INTERNAL_ERROR", status: 500 },
  TRANSACTION_FAILED: { code: "INTERNAL_ERROR", status: 500 }
};

/**
 * Create a structured error response
 */
export class AppError extends Error {
  constructor(errorDef, message = null) {
    super(message || errorDef.message || errorDef.code);
    this.code = errorDef.code;
    this.status = errorDef.status;
    this.originalMessage = message;
  }

  toJSON() {
    return {
      code: this.code,
      message: this.message,
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Global error handler middleware
 */
export const errorHandler = (err, req, res, next) => {
  console.error("Error:", err);

  if (err instanceof AppError) {
    return res.status(err.status).json(err.toJSON());
  }

  if (err.code === "P2002") {
    // Prisma unique constraint violation
    const field = err.meta?.target?.[0] || "field";
    return res.status(409).json({
      code: "DUPLICATE_RESOURCE",
      message: `Unique constraint failed on ${field}`,
      timestamp: new Date().toISOString()
    });
  }

  // Default error
  res.status(500).json({
    code: "INTERNAL_ERROR",
    message: process.env.NODE_ENV === "production" ? "Internal server error" : err.message,
    timestamp: new Date().toISOString()
  });
};
