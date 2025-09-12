const express = require("express");
const router = express.Router();
const Cart = require("../models/Cart");
const auth = require("../middleware/auth"); // middleware to decode JWT

// =======================
// Add item to cart
// =======================
/*router.post("/add", auth, async (req, res) => {
  try {
    const userId = req.user.id; // from JWT middleware
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


    // populate item details in response
    await cartItem.populate("itemId");

    res.status(200).json({ message: "Item added to cart", cartItem });
  } catch (error) {
    console.error("Cart add error:", error.message);
    res.status(500).json({ error: "Error adding to cart" });
  }
});*/



router.post("/add", auth, async (req, res) => {
  try {
    console.log("Incoming Add to Cart:", req.body, "User:", req.user);

    const userId = req.user.id;
    const { itemId, quantity } = req.body;
    console.log("UserID:", userId, "ItemID:", itemId, "Quantity:", quantity);
    if (!itemId) {
      return res.status(400).json({ message: "Item ID required" });
    }

    let cartItem = await Cart.findOne({ userId});
    console.log("Found Cart Item:", Cart);
    if (cartItem) {
      cartItem.quantity += quantity || 1;
      await cartItem.save();
    } else {
      cartItem = new Cart({ userId, itemId, quantity: quantity || 1 });
      await cartItem.save();
    }

    res.status(200).json({ message: "Item added to cart", cartItem });
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
    const userId = req.user.id;

    // populate itemId so frontend gets title, price, category, etc.
    const cart = await Cart.find({ userId }).populate("itemId");

    res.json(cart);
  } catch (error) {
    console.error("Cart fetch error:", error.message);
    res.status(500).json({ error: "Error fetching cart" });
  }
});

// =======================
// Remove item from cart
// =======================
/*router.delete("/:itemId", auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const itemId = req.params.itemId;

    await Cart.findOneAndDelete({ userId, itemId });
    res.json({ message: "Item removed from cart" });
  } catch (error) {
    console.error("Cart remove error:", error.message);
    res.status(500).json({ error: "Error removing item" });
  }
});*/

// DELETE /api/cart/:itemId  -> remove the item completely from user's cart (protected)
router.delete('/:itemId', auth, async (req, res) => {
  try {
    const { itemId } = req.params;

    // validate
    if (!mongoose.Types.ObjectId.isValid(itemId)) {
      return res.status(400).json({ error: 'Invalid itemId' });
    }

    const cart = await Cart.findOne({ user: req.userId });
    if (!cart) return res.status(404).json({ error: 'Cart not found' });

    const itemExists = cart.items.some(it => it.product.toString() === itemId);
    if (!itemExists) return res.status(404).json({ error: 'Item not in cart' });

    cart.items = cart.items.filter(it => it.product.toString() !== itemId);

    await cart.save();
    await cart.populate('items.product');

    return res.json({
      ok: true,
      message: 'Item removed from cart',
      cart,
    });
  } catch (err) {
    console.error('Cart delete error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});


module.exports = router;

