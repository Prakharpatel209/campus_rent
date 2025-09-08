const express = require("express")
const Rental = require("../models/Rental")
const Item = require("../models/Item")
const auth = require("../middleware/auth")

const router = express.Router()

// Create new rental (protected route)
router.post("/", auth, async (req, res) => {
  try {
    const { itemId, startDate, endDate } = req.body

    // Find the item
    const item = await Item.findById(itemId)
    if (!item) {
      return res.status(404).json({ message: "Item not found" })
    }

    if (!item.availability) {
      return res.status(400).json({ message: "Item is not available" })
    }

    // Calculate total cost
    const start = new Date(startDate)
    const end = new Date(endDate)
    const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24))
    const totalCost = days * item.pricePerDay

    // Create rental
    const rental = new Rental({
      item: itemId,
      renter: req.userId,
      owner: item.owner,
      startDate,
      endDate,
      totalCost,
    })

    await rental.save()

    const populatedRental = await Rental.findById(rental._id)
      .populate("item", "title pricePerDay")
      .populate("renter", "name email")
      .populate("owner", "name email")

    res.status(201).json(populatedRental)
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
})

// Get user's rentals (protected route)
router.get("/my-rentals", auth, async (req, res) => {
  try {
    const rentals = await Rental.find({ renter: req.userId })
      .populate("item", "title pricePerDay images")
      .populate("owner", "name email")
      .sort({ createdAt: -1 })

    res.json(rentals)
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
})

// Get items being rented out by user (protected route)
router.get("/my-items", auth, async (req, res) => {
  try {
    const rentals = await Rental.find({ owner: req.userId })
      .populate("item", "title pricePerDay images")
      .populate("renter", "name email")
      .sort({ createdAt: -1 })

    res.json(rentals)
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
})

// Update rental status (protected route)
router.put("/:id/status", auth, async (req, res) => {
  try {
    const { status } = req.body
    const rental = await Rental.findById(req.params.id)

    if (!rental) {
      return res.status(404).json({ message: "Rental not found" })
    }

    // Only owner can approve/reject rentals
    if (rental.owner.toString() !== req.userId) {
      return res.status(403).json({ message: "Not authorized" })
    }

    rental.status = status
    await rental.save()

    const updatedRental = await Rental.findById(rental._id)
      .populate("item", "title pricePerDay")
      .populate("renter", "name email")
      .populate("owner", "name email")

    res.json(updatedRental)
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
})

module.exports = router
