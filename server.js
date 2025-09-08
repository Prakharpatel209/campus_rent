// Load environment variables
require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({ origin: process.env.CLIENT_URL || "*" }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use(express.static(path.join(__dirname, "public")));

// MongoDB connection
const MONGODB_URI =
  process.env.NODE_ENV === "production"
    ? process.env.MONGODB_URI // Atlas in production
    : "mongodb://127.0.0.1:27017/item-rental"; // Local in development

mongoose
  .connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err.message);
    process.exit(1); // Exit if DB connection fails
  });

// Helper to safely load routes
function loadRoute(pathName, routePath) {
  const fullPath = path.join(__dirname, routePath);
  if (fs.existsSync(fullPath + ".js")) {
    try {
      app.use(pathName, require(fullPath));
      console.log(`✅ Loaded route: ${pathName}`);
    } catch (err) {
      console.error(`❌ Failed to load route ${pathName}:`, err.message);
    }
  } else {
    console.warn(`⚠ Route file not found: ${routePath}.js`);
  }
}

// Load routes
loadRoute("/api/auth", "./routes/auth");
loadRoute("/api/items", "./routes/items");
loadRoute("/api/rentals", "./routes/rentals");
loadRoute("/api/cart", "./routes/cart"); // ⬅️ Added Cart route

// Root route
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Error handler
app.use((err, req, res, next) => {
  console.error("🔥 Error:", err.stack);
  res.status(500).json({ message: "Something went wrong!" });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});

