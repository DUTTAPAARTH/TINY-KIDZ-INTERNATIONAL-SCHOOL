// Create middleware called authorize that accepts an array of roles, checks req.user.role against them, returns 403 Forbidden if not allowed.

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    if (!roles.includes(req.user.role)) {
      return res
        .status(403)
        .json({ message: "User role not authorized to access this route" });
    }

    next();
  };
};

module.exports = authorize;
