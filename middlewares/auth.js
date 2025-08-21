const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res
      .status(401)
      .json({ message: "Unauthorized - No token provided" });
  }

  const token = authHeader.split(" ")[1];

  if (!token) {
    return res
      .status(401)
      .json({ message: "Unauthorized - Token missing after Bearer" });
  }

  try {
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    console.log("✅ JWT decoded:", decoded);

    req.user = { userId: decoded.userId };

    console.log("req.user" , req.user);

    if (!req.user.userId) {
      return res
        .status(401)
        .json({ message: "Unauthorized - User ID missing in token" });
    }
    next();
  } catch (err) {
    console.error("❌ JWT verification failed:", err.message);
    return res
      .status(401)
      .json({ message: "Unauthorized - Invalid or expired token" });
  }
};

module.exports = authMiddleware;
