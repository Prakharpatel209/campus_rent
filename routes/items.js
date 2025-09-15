const express = require("express");
const multer = require("multer");
const path = require("path");
const Item = require("../models/Item");
const auth = require("../middleware/auth");

const router = express.Router();

// -------------------- Multer Setup --------------------
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // make sure /uploads exists
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

// -------------------- GET ALL ITEMS --------------------
router.get("/", async (req, res) => {
  try {
    const { category, search, minPrice, maxPrice } = req.query;
    const query = { availability: true };

    if (category) query.category = category;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }
    if (minPrice || maxPrice) {
      query.pricePerDay = {};
      if (minPrice) query.pricePerDay.$gte = Number(minPrice);
      if (maxPrice) query.pricePerDay.$lte = Number(maxPrice);
    }

    const items = await Item.find(query).populate("owner", "name email");
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// -------------------- GET SINGLE ITEM --------------------
router.get("/:id", async (req, res) => {
  try {
    const item = await Item.findById(req.params.id).populate(
      "owner",
      "name email phone"
    );
    if (!item) return res.status(404).json({ message: "Item not found" });
    res.json(item);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// -------------------- CREATE NEW ITEM --------------------
router.post("/", auth, upload.array("images", 5), async (req, res) => {
  try {
    const { title, description, category, pricePerDay, city, state } = req.body;
    if (!title || !description || !category || !pricePerDay) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const images = req.files ? req.files.map((f) => f.filename) : [];

    const item = new Item({
      title,
      description,
      category,
      pricePerDay,
      images,
      location: { city, state }, // ✅ Save location
      owner: req.user.id,
      availability: true,
    });

    await item.save();
    const populatedItem = await Item.findById(item._id).populate(
      "owner",
      "name email"
    );

    res.status(201).json(populatedItem);
  } catch (error) {
    console.error("Add item error:", error);
    res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
});

// -------------------- UPDATE ITEM --------------------
router.put("/:id", auth, upload.array("images", 5), async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) return res.status(404).json({ message: "Item not found" });

    if (item.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized" });
    }

    // if new images uploaded, replace
    const images = req.files && req.files.length ? req.files.map((f) => f.filename) : item.images;

    const updatedData = {
      ...req.body,
      images,
      location: {
        city: req.body.city || item.location.city,
        state: req.body.state || item.location.state,
      },
    };

    const updatedItem = await Item.findByIdAndUpdate(req.params.id, updatedData, {
      new: true,
    }).populate("owner", "name email");

    res.json(updatedItem);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// -------------------- DELETE ITEM --------------------
router.delete("/:id", auth, async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) return res.status(404).json({ message: "Item not found" });

    if (item.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized" });
    }

    // HARD DELETE
    await Item.findByIdAndDelete(req.params.id);

    // SOFT DELETE alternative (uncomment if preferred)
    // item.availability = false;
    // await item.save();

    res.json({ message: "Item deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

module.exports = router;
