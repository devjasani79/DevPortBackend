// middleware/roleMiddleware.js
const asyncHandler = require("express-async-handler");

/**
 * Role-based authorization middleware
 * @param {...string} roles - Allowed roles
 */
const authorizeRoles = (...roles) => {
  return asyncHandler(async (req, res, next) => {
    if (!req.user || !req.user.user_metadata?.role) {
      return res.status(401).json({ error: "Not authorized, user role missing" });
    }

    const userRole = req.user.user_metadata.role;

    if (!roles.includes(userRole)) {
      return res.status(403).json({ error: `Access denied, requires role: ${roles.join(", ")}` });
    }

    next();
  });
};

module.exports = { authorizeRoles };
