const express = require("express")
const Item = require("../models/Item")
const auth = require("../middleware/auth")

const router = express.Router()

// Get all items
router.get("/", async (req, res) => {
  try {
    const { category, search, minPrice, maxPrice } = req.query
    const query = { availability: true }
    
    if (category) query.category = category
    if (search) {
      query.$or = [{ title: { $regex: search, $options: "i" } }, { description: { $regex: search, $options: "i" } }]
    }
    if (minPrice || maxPrice) {
      query.pricePerDay = {}
      if (minPrice) query.pricePerDay.$gte = Number(minPrice)
        if (maxPrice) query.pricePerDay.$lte = Number(maxPrice)
        }
      
      const items = await Item.find()
      console.log(items)
  
    res.json(items)
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
})

// Get single item
router.get("/:id", async (req, res) => {
  try {
    const item = await Item.findById(req.params.id).populate("owner", "name email phone")

    if (!item) {
      return res.status(404).json({ message: "Item not found" })
    }

    res.json(item)
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
})

// Create new item (protected route)
router.post("/", auth, async (req, res) => {
  try {
    const itemData = {
      ...req.body,
      owner: req.userId,
    }

    const item = new Item(itemData)
    await item.save()

    const populatedItem = await Item.findById(item._id).populate("owner", "name email")

    res.status(201).json(populatedItem)
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
})

// Update item (protected route)
router.put("/:id", auth, async (req, res) => {
  try {
    const item = await Item.findById(req.params.id)

    if (!item) {
      return res.status(404).json({ message: "Item not found" })
    }

    // Check if user owns the item
    if (item.owner.toString() !== req.userId) {
      return res.status(403).json({ message: "Not authorized" })
    }

    const updatedItem = await Item.findByIdAndUpdate(req.params.id, req.body, { new: true }).populate(
      "owner",
      "name email",
    )

    res.json(updatedItem)
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
})

// Delete item (protected route)
router.delete("/:id", auth, async (req, res) => {
  try {
    const item = await Item.findById(req.params.id)

    if (!item) {
      return res.status(404).json({ message: "Item not found" })
    }

    // Check if user owns the item
    if (item.owner.toString() !== req.userId) {
      return res.status(403).json({ message: "Not authorized" })
    }

    await Item.findByIdAndDelete(req.params.id)
    res.json({ message: "Item deleted successfully" })
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
})

module.exports = router
