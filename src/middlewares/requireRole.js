const { createApiError } = require("../shared/http/apiError");

function requireRole(...allowedRoles) {
  return (req, _res, next) => {
    const role = req.user && req.user.role;

    if (!role) {
      return next(createApiError(401, "Authentication is required"));
    }

    if (!allowedRoles.includes(role)) {
      return next(createApiError(403, "You do not have permission to access this resource"));
    }

    return next();
  };
}

module.exports = { requireRole };
