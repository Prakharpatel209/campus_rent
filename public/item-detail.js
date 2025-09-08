// Item detail page functionality
let currentItem = null
const API_BASE = "http://localhost:5000/api"

document.addEventListener("DOMContentLoaded", () => {
  const urlParams = new URLSearchParams(window.location.search)
  const itemId = urlParams.get("id")

  if (itemId) {
    loadItemDetails(itemId)
  } else {
    showItemNotFound()
  }

  setupRentalForm()
})

async function loadItemDetails(itemId) {
  const content = document.getElementById("itemDetailContent")
  content.innerHTML = '<div class="loading"><div class="spinner"></div></div>'

  try {
    const response = await fetch(`${API_BASE}/items/${itemId}`)

    if (response.ok) {
      currentItem = await response.json()
      renderItemDetails()
    } else {
      throw new Error("Item not found")
    }
  } catch (error) {
    console.error("Load item error:", error)
    showSampleItemDetail(itemId)
  }
}

function showSampleItemDetail(itemId) {
  // Show sample item for demo
  currentItem = {
    _id: itemId,
    title: "Professional DSLR Camera",
    description:
      "High-quality Canon EOS R5 camera perfect for professional photography and videography. Includes 24-70mm lens, extra batteries, memory cards, and carrying case. Ideal for weddings, events, portraits, and commercial shoots.",
    category: "Electronics",
    pricePerDay: 25,
    images: ["/placeholder.svg?key=camera1", "/placeholder.svg?key=camera2"],
    owner: {
      name: "John Smith",
      email: "john@example.com",
      phone: "(555) 123-4567",
    },
    location: { city: "New York", state: "NY" },
    condition: "Like New",
    deposit: 100,
    availability: true,
    createdAt: new Date().toISOString(),
  }

  renderItemDetails()
}

function renderItemDetails() {
  const content = document.getElementById("itemDetailContent")
  const breadcrumb = document.getElementById("breadcrumbTitle")

  breadcrumb.textContent = currentItem.title

  content.innerHTML = `
        <div class="item-detail-grid">
            <div class="item-images">
                <div class="main-image">
                    <img src="${currentItem.images[0] || "/placeholder.svg?key=main-item"}" alt="${currentItem.title}" id="mainImage">
                </div>
                ${
                  currentItem.images.length > 1
                    ? `
                    <div class="image-thumbnails">
                        ${currentItem.images
                          .map(
                            (img, index) => `
                            <img src="${img}" alt="Thumbnail ${index + 1}" onclick="changeMainImage('${img}')" class="${index === 0 ? "active" : ""}">
                        `,
                          )
                          .join("")}
                    </div>
                `
                    : ""
                }
            </div>
            
            <div class="item-info">
                <div class="item-header">
                    <h1>${currentItem.title}</h1>
                    <div class="item-meta">
                        <span class="category-badge">${currentItem.category}</span>
                        <span class="condition-badge condition-${currentItem.condition.toLowerCase().replace(" ", "-")}">${currentItem.condition}</span>
                        ${currentItem.availability ? '<span class="availability-badge available">Available</span>' : '<span class="availability-badge unavailable">Not Available</span>'}
                    </div>
                </div>

                <div class="pricing-info">
                    <div class="price-main">$${currentItem.pricePerDay}/day</div>
                    ${currentItem.deposit > 0 ? `<div class="deposit-info">Security Deposit: $${currentItem.deposit}</div>` : ""}
                </div>

                <div class="item-description">
                    <h3>Description</h3>
                    <p>${currentItem.description}</p>
                </div>

                <div class="item-details">
                    <h3>Details</h3>
                    <div class="details-grid">
                        <div class="detail-item">
                            <i class="fas fa-map-marker-alt"></i>
                            <span>Location: ${currentItem.location?.city || "Not specified"}, ${currentItem.location?.state || ""}</span>
                        </div>
                        <div class="detail-item">
                            <i class="fas fa-calendar-alt"></i>
                            <span>Listed: ${formatDate(currentItem.createdAt)}</span>
                        </div>
                        <div class="detail-item">
                            <i class="fas fa-shield-alt"></i>
                            <span>Verified Owner</span>
                        </div>
                    </div>
                </div>

                <div class="rental-actions">
                    ${
                      currentItem.availability
                        ? `
                        <button class="btn-primary btn-large" onclick="showRentalModal()">
                            <i class="fas fa-calendar-check"></i>
                            Rent This Item
                        </button>
                        <button class="btn-outline" onclick="contactOwner()">
                            <i class="fas fa-message"></i>
                            Contact Owner
                        </button>
                    `
                        : `
                        <button class="btn-secondary btn-large" disabled>
                            Currently Unavailable
                        </button>
                    `
                    }
                </div>
            </div>
        </div>

        <div class="owner-info">
            <h3>Owner Information</h3>
            <div class="owner-card">
                <div class="owner-avatar">
                    <i class="fas fa-user"></i>
                </div>
                <div class="owner-details">
                    <h4>${currentItem.owner.name}</h4>
                    <div class="owner-rating">
                        <div class="stars">
                            <i class="fas fa-star"></i>
                            <i class="fas fa-star"></i>
                            <i class="fas fa-star"></i>
                            <i class="fas fa-star"></i>
                            <i class="fas fa-star"></i>
                        </div>
                        <span>5.0 (24 reviews)</span>
                    </div>
                    <p>Trusted member since 2022</p>
                </div>
                <div class="owner-actions">
                    <button class="btn-outline" onclick="contactOwner()">Contact</button>
                </div>
            </div>
        </div>

        <div class="similar-items">
            <h3>Similar Items</h3>
            <div class="similar-items-grid" id="similarItemsGrid">
                <!-- Similar items will be loaded here -->
            </div>
        </div>
    `

  loadSimilarItems()
}

function changeMainImage(imageSrc) {
  document.getElementById("mainImage").src = imageSrc

  // Update thumbnail active state
  document.querySelectorAll(".image-thumbnails img").forEach((thumb) => {
    thumb.classList.remove("active")
    if (thumb.src === imageSrc) {
      thumb.classList.add("active")
    }
  })
}

function showRentalModal() {
  const token = localStorage.getItem("token")
  if (!token) {
    showLoginModal()
    return
  }

  document.getElementById("rentalModal").style.display = "block"
  document.getElementById("dailyRate").textContent = `$${currentItem.pricePerDay}`

  // Set minimum date to today
  const today = new Date().toISOString().split("T")[0]
  document.getElementById("startDate").min = today
  document.getElementById("endDate").min = today
}

function setupRentalForm() {
  const startDateInput = document.getElementById("startDate")
  const endDateInput = document.getElementById("endDate")

  if (startDateInput && endDateInput) {
    startDateInput.addEventListener("change", calculateRentalCost)
    endDateInput.addEventListener("change", calculateRentalCost)
  }

  const rentalForm = document.getElementById("rentalForm")
  if (rentalForm) {
    rentalForm.addEventListener("submit", handleRentalRequest)
  }
}

function calculateRentalCost() {
  const startDate = document.getElementById("startDate").value
  const endDate = document.getElementById("endDate").value

  if (startDate && endDate && currentItem) {
    const start = new Date(startDate)
    const end = new Date(endDate)
    const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24))

    if (days > 0) {
      const totalCost = days * currentItem.pricePerDay
      document.getElementById("numberOfDays").textContent = days
      document.getElementById("totalCost").textContent = `$${totalCost}`
    } else {
      document.getElementById("numberOfDays").textContent = "0"
      document.getElementById("totalCost").textContent = "$0"
    }
  }
}

async function handleRentalRequest(event) {
  event.preventDefault()

  const startDate = document.getElementById("startDate").value
  const endDate = document.getElementById("endDate").value
  const message = document.getElementById("rentalMessage").value

  if (!startDate || !endDate) {
    showNotification("Please select both start and end dates", "error")
    return
  }

  const start = new Date(startDate)
  const end = new Date(endDate)
  const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24))

  if (days <= 0) {
    showNotification("End date must be after start date", "error")
    return
  }

  try {
    const token = localStorage.getItem("token")
    const response = await fetch(`${API_BASE}/rentals`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        itemId: currentItem._id,
        startDate,
        endDate,
        message,
      }),
    })

    const data = await response.json()

    if (response.ok) {
      closeModal("rentalModal")
      showNotification("Rental request sent successfully!", "success")
      // Reset form
      document.getElementById("rentalForm").reset()
    } else {
      showNotification(data.message || "Failed to send rental request", "error")
    }
  } catch (error) {
    console.error("Rental request error:", error)
    showNotification("Network error. Please try again.", "error")
  }
}

function contactOwner() {
  if (currentItem && currentItem.owner) {
    const subject = encodeURIComponent(`Inquiry about ${currentItem.title}`)
    const body = encodeURIComponent(
      `Hi ${currentItem.owner.name},\n\nI'm interested in renting your ${currentItem.title}. Could you please provide more details?\n\nThanks!`,
    )
    window.location.href = `mailto:${currentItem.owner.email}?subject=${subject}&body=${body}`
  }
}

function loadSimilarItems() {
  const grid = document.getElementById("similarItemsGrid")
  if (!grid || !currentItem) return

  // Show sample similar items for demo
  const similarItems = [
    { title: "Canon EOS R6", price: 22, image: "/placeholder.svg?key=similar1" },
    { title: "Sony A7 III", price: 28, image: "/placeholder.svg?key=similar2" },
    { title: "Nikon Z6", price: 24, image: "/placeholder.svg?key=similar3" },
    { title: "Fujifilm X-T4", price: 26, image: "/placeholder.svg?key=similar4" },
  ]

  grid.innerHTML = similarItems
    .map(
      (item) => `
        <div class="similar-item-card">
            <div class="similar-item-image">
                <img src="${item.image}" alt="${item.title}">
            </div>
            <div class="similar-item-info">
                <h4>${item.title}</h4>
                <div class="similar-item-price">$${item.price}/day</div>
            </div>
        </div>
    `,
    )
    .join("")
}

function showItemNotFound() {
  const content = document.getElementById("itemDetailContent")
  content.innerHTML = `
        <div class="item-not-found">
            <i class="fas fa-exclamation-triangle"></i>
            <h2>Item Not Found</h2>
            <p>The item you're looking for doesn't exist or has been removed.</p>
            <a href="items.html" class="btn-primary">Browse All Items</a>
        </div>
    `
}

function formatDate(date) {
  const options = { year: "numeric", month: "long", day: "numeric" }
  return new Date(date).toLocaleDateString(undefined, options)
}

function showLoginModal() {
  // Implementation for showing login modal
  alert("Please log in to rent this item.")
}

function showNotification(message, type) {
  // Implementation for showing notifications
  alert(`${type.toUpperCase()}: ${message}`)
}

function closeModal(modalId) {
  // Implementation for closing modals
  document.getElementById(modalId).style.display = "none"
}
