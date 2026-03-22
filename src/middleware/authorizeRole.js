/**
 * Role-based authorization middleware
 * Ensures user has one of the allowed roles
 */
export const authorizeRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res
        .status(401)
        .json({ error: "No user information in token" });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Access denied. Required roles: ${allowedRoles.join(", ")}. Your role: ${req.user.role}`
      });
    }

    next();
  };
};

export const isPlatformAdmin = (req) =>
  Boolean(req.user && req.user.role === "PLATFORM_ADMIN");

/**
 * Check if user is the restaurant owner or manager
 */
export const authorizeOwnerOrManager = (req, res, next) => {
  return authorizeRole("PLATFORM_ADMIN", "OWNER", "MANAGER")(req, res, next);
};

/**
 * Check if user is the restaurant owner
 */
export const authorizeOwner = (req, res, next) => {
  return authorizeRole("PLATFORM_ADMIN", "OWNER")(req, res, next);
};
