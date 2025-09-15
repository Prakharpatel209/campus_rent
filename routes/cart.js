const express = require("express");
const mongoose = require("mongoose");
const Cart = require("../models/Cart");
const auth = require("../middleware/auth");
const router = express.Router();

// =======================
// Add item to cart
// =======================
router.post("/add", auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { itemId, quantity } = req.body;

    if (!itemId) {
      return res.status(400).json({ message: "Item ID required" });
    }

    let cartItem = await Cart.findOne({ userId, itemId });
    if (cartItem) {
      cartItem.quantity += quantity || 1;
      await cartItem.save();
    } else {
      cartItem = new Cart({ userId, itemId, quantity: quantity || 1 });
      await cartItem.save();
    }

    await cartItem.populate("itemId", "title pricePerDay images");
    res.json(cartItem);
  } catch (error) {
    console.error("Cart add error:", error);
    res.status(500).json({ error: "Error adding to cart" });
  }
});

// =======================
// Get current user cart
// =======================
router.get("/", auth, async (req, res) => {
  try {
    const cart = await Cart.find({ userId: req.user.id })
      .populate("itemId", "title pricePerDay images");
    res.json(cart);
  } catch (error) {
    console.error("Cart fetch error:", error);
    res.status(500).json({ error: "Error fetching cart" });
  }
});

// =======================
// Update quantity
// =======================
router.put("/:cartId", auth, async (req, res) => {
  try {
    const { cartId } = req.params;
    const { quantity } = req.body;

    if (!mongoose.Types.ObjectId.isValid(cartId)) {
      return res.status(400).json({ error: "Invalid cartId" });
    }

    const cartItem = await Cart.findOne({ _id: cartId, userId: req.user.id });
    if (!cartItem) return res.status(404).json({ error: "Cart item not found" });

    if (quantity <= 0) {
      await cartItem.deleteOne();
      return res.json({ message: "Item removed from cart" });
    }

    cartItem.quantity = quantity;
    await cartItem.save();
    await cartItem.populate("itemId", "title pricePerDay images");

    res.json(cartItem);
  } catch (error) {
    console.error("Cart update error:", error);
    res.status(500).json({ error: "Error updating cart" });
  }
});

// =======================
// Remove item from cart
// =======================
router.delete("/:cartId", auth, async (req, res) => {
  try {
    const { cartId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(cartId)) {
      return res.status(400).json({ error: "Invalid cartId" });
    }

    const deleted = await Cart.findOneAndDelete({ _id: cartId, userId: req.user.id });
    if (!deleted) return res.status(404).json({ error: "Cart item not found" });

    res.json({ message: "Item removed from cart" });
  } catch (error) {
    console.error("Cart delete error:", error);
    res.status(500).json({ error: "Error removing item" });
  }
});

module.exports = router;

