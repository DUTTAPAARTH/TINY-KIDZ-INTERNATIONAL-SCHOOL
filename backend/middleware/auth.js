// Create Express middleware called protect that reads a Bearer token from Authorization header, verifies it using jsonwebtoken with JWT_SECRET from .env, attaches decoded user to req.user, returns 401 if missing or invalid.

const jwt = require("jsonwebtoken");

const protect = async (req, res, next) => {
  let token;

  // Check for token in Authorization header
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return res
      .status(401)
      .json({ message: "Not authorized to access this route" });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // JWT was signed with { id: user._id }, normalize so req.user._id always works
    req.user = { ...decoded, _id: decoded.id || decoded._id };
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid token or token expired" });
  }
};

module.exports = protect;
