const mongoose = require("mongoose")

const itemSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
      enum: ["Electronics", "Tools", "Sports", "Furniture", "Vehicles", "Other"],
    },
    pricePerDay: {
      type: Number,
      required: true,
      min: 0,
    },
    //images: [
      /*{
        type: String,
      },
    ]*/
   images: [
      {
        type: String,
        get: (v) => {
          // if already full URL, keep it
          if (v.startsWith("http")) return v
          // otherwise, prefix with server URL
          return `${process.env.BASE_URL || "http://localhost:5000"}/uploads/${v}`
        },
      },
    ],
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    location: {
      city: String,
      state: String,
    },
    availability: {
      type: Boolean,
      default: true,
    },
    condition: {
      type: String,
      enum: ["New", "Like New", "Good", "Fair", "Poor"],
      default: "Good",
    },
    deposit: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  },
)

module.exports = mongoose.model("Item", itemSchema)
