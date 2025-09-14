/**
 * Role-based access middleware
 * Example: router.post("/items", auth, isSeller, handler)
 */

const isSeller = (req, res, next) => {
  if (req.user && req.user.role === "seller") {
    return next();
  }
  return res.status(403).json({ message: "Access denied: sellers only" });
};

const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    return next();
  }
  return res.status(403).json({ message: "Access denied: admins only" });
};

module.exports = { isSeller, isAdmin };
