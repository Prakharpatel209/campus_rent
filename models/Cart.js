const mongoose = require("mongoose");

const cartSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    itemId: { type: mongoose.Schema.Types.ObjectId, ref: "Item", required: true },
    quantity: { type: Number, default: 1 },
  },
  { timestamps: true ,versionKey: false}
);

module.exports = mongoose.model("Cart", cartSchema);
