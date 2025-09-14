/*const jwt = require("jsonwebtoken")

const auth = (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "")

    if (!token) {
      return res.status(401).json({ message: "No token, authorization denied" })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "fallback-secret")
    req.userId = decoded.userId
    next()
  } catch (error) {
    res.status(401).json({ message: "Token is not valid" })
  }
}

module.exports = auth*/

const jwt = require("jsonwebtoken");

const auth = (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({ message: "No token, authorization denied" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "fallback-secret");

    // ✅ Attach a `user` object with `id` so cart.js works
    req.user = {
      id: decoded.id || decoded.userId, // handle both cases
      email: decoded.email || null
    };

    next();
  } catch (error) {
    console.error("Auth error:", error.message);
    res.status(401).json({ message: "Token is not valid" });
  }
};

module.exports = auth;


