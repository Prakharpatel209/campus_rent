// Dashboard functionality
let currentUser = null
let userItems = []
let userRentals = []
let rentalRequests = []
let editingItemId = null
const API_BASE = "http://localhost:5000/api"

function updateUIForLoggedInUser() {
  // Placeholder for updateUIForLoggedInUser function
  console.log("UI updated for logged-in user")
}

function formatDate(date) {
  // Placeholder for formatDate function
  return new Date(date).toLocaleDateString()
}

function closeModal(modalId) {
  // Placeholder for closeModal function
  document.getElementById(modalId).style.display = "none"
}

function showNotification(message, type) {
  // Placeholder for showNotification function
  console.log(`Notification: ${message} (Type: ${type})`)
}

document.addEventListener("DOMContentLoaded", () => {
  checkAuthentication()
  setupDashboard()
})

function checkAuthentication() {
  const token = localStorage.getItem("token")
  console.log("token" , token)
  if (!token) {
    // Redirect to home page or show login modal
    window.location.href = "index.html"
    return
  }

  fetchCurrentUser()
}
console.log("dashboard js loaded")
// Patch: Fetch current user (handle different API shapes)
// ------------------------------
async function fetchCurrentUser() {
  const token = localStorage.getItem("token")
  if (!token) return false

  try {
    const response = await fetch(`${API_BASE}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!response.ok) {
      localStorage.removeItem("token")
      return false
    }
    const data = await response.json()
    // Some APIs return { user: {...} } and some return the user object directly.
    currentUser = data.user || data || null

    // make sure we have a valid object
    if (currentUser && typeof currentUser === "object") {
      updateUIForLoggedInUser()
      return true
    } else {
      localStorage.removeItem("token")
      currentUser = null
      return false
    }
  } catch (error) {
    console.error("Fetch user error:", error)
    localStorage.removeItem("token")
    currentUser = null
    return false
  }
}

function setupDashboard() {
  // Setup form handlers
  document.getElementById("itemForm").addEventListener("submit", handleItemSubmission)
  document.getElementById("profileForm").addEventListener("submit", handleProfileUpdate)
}

function showDashboardSection(sectionId) {
  // Hide all sections
  document.querySelectorAll(".dashboard-section").forEach((section) => {
    section.classList.remove("active")
  })

  // Remove active class from all nav buttons
  document.querySelectorAll(".dash-nav-btn").forEach((btn) => {
    btn.classList.remove("active")
  })

  // Show selected section
  document.getElementById(sectionId).classList.add("active")

  // Add active class to clicked button
  event.target.classList.add("active")

  // Load section-specific data
  switch (sectionId) {
    case "my-items":
      loadUserItems()
      break
    case "my-rentals":
      loadUserRentals()
      break
    case "rental-requests":
      loadRentalRequests()
      break
    case "profile":
      loadUserProfile()
      break
  }
}

async function loadDashboardData() {
  loadUserItems()
  loadUserRentals()
  loadRentalRequests()
  loadUserProfile()
}

function loadSampleData() {
  // Load sample data for demo
  userItems = [
    {
      _id: "1",
      title: "Professional DSLR Camera",
      category: "Electronics",
      pricePerDay: 25,
      condition: "Like New",
      availability: true,
      images: ["/placeholder.svg?key=user-item1"],
      createdAt: new Date().toISOString(),
    },
    {
      _id: "2",
      title: "Power Drill Set",
      category: "Tools",
      pricePerDay: 15,
      condition: "Good",
      availability: false,
      images: ["/placeholder.svg?key=user-item2"],
      createdAt: new Date().toISOString(),
    },
  ]

  userRentals = [
    {
      _id: "1",
      item: {
        title: "Mountain Bike",
        pricePerDay: 30,
        images: ["/placeholder.svg?key=rental1"],
      },
      startDate: "2024-01-15",
      endDate: "2024-01-18",
      totalCost: 90,
      status: "active",
    },
  ]

  rentalRequests = [
    {
      _id: "1",
      item: {
        title: "Professional DSLR Camera",
        pricePerDay: 25,
      },
      renter: {
        name: "Jane Smith",
        email: "jane@example.com",
      },
      startDate: "2024-01-20",
      endDate: "2024-01-22",
      totalCost: 50,
      status: "pending",
    },
  ]

  renderUserItems()
  renderUserRentals()
  renderRentalRequests()
}

async function loadUserItems() {
  const grid = document.getElementById("myItemsGrid")
  grid.innerHTML = '<div class="loading"><div class="spinner"></div></div>'

  try {
    const token = localStorage.getItem("token")
    const response = await fetch(`${API_BASE}/items?owner=${currentUser._id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (response.ok) {
      userItems = await response.json()
      renderUserItems()
    } else {
      throw new Error("Failed to load items")
    }
  } catch (error) {
    console.error("Load user items error:", error)
    renderUserItems() // Show sample data
  }
}

function renderUserItems() {
  const grid = document.getElementById("myItemsGrid")

  if (userItems.length === 0) {
    grid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-box-open"></i>
                <h3>No items yet</h3>
                <p>Start earning by listing your first item</p>
                <button class="btn-primary" onclick="showAddItemModal()">Add Your First Item</button>
            </div>
        `
    return
  }

  grid.innerHTML = userItems
    .map(
      (item) => `
        <div class="user-item-card">
            <div class="item-image">
                <img src="${item.images[0] || "/placeholder.svg?key=default-item"}" alt="${item.title}">
                <div class="item-status ${item.availability ? "available" : "unavailable"}">
                    ${item.availability ? "Available" : "Unavailable"}
                </div>
            </div>
            <div class="item-content">
                <h3>${item.title}</h3>
                <div class="item-price">$${item.pricePerDay}/day</div>
                <div class="item-meta">
                    <span class="category">${item.category}</span>
                    <span class="condition">${item.condition}</span>
                </div>
                <div class="item-actions">
                    <button class="btn-outline btn-small" onclick="editItem('${item._id}')">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="btn-secondary btn-small" onclick="toggleItemAvailability('${item._id}', ${!item.availability})">
                        <i class="fas fa-${item.availability ? "pause" : "play"}"></i>
                        ${item.availability ? "Pause" : "Activate"}
                    </button>
                    <button class="btn-danger btn-small" onclick="deleteItem('${item._id}')">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </div>
        </div>
    `,
    )
    .join("")
}

async function loadUserRentals() {
  const list = document.getElementById("myRentalsList")
  list.innerHTML = '<div class="loading"><div class="spinner"></div></div>'

  try {
    const token = localStorage.getItem("token")
    const response = await fetch(`${API_BASE}/rentals/my-rentals`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (response.ok) {
      userRentals = await response.json()
      renderUserRentals()
    } else {
      throw new Error("Failed to load rentals")
    }
  } catch (error) {
    console.error("Load user rentals error:", error)
    renderUserRentals() // Show sample data
  }
}

function renderUserRentals() {
  const list = document.getElementById("myRentalsList")

  if (userRentals.length === 0) {
    list.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-calendar-times"></i>
                <h3>No active rentals</h3>
                <p>You haven't rented any items yet</p>
                <a href="items.html" class="btn-primary">Browse Items</a>
            </div>
        `
    return
  }

  list.innerHTML = userRentals
    .map(
      (rental) => `
        <div class="rental-card">
            <div class="rental-image">
                <img src="${rental.item.images[0] || "/placeholder.svg?key=rental-item"}" alt="${rental.item.title}">
            </div>
            <div class="rental-info">
                <h3>${rental.item.title}</h3>
                <div class="rental-dates">
                    <i class="fas fa-calendar"></i>
                    ${formatDate(rental.startDate)} - ${formatDate(rental.endDate)}
                </div>
                <div class="rental-cost">Total: $${rental.totalCost}</div>
                <div class="rental-status status-${rental.status}">${rental.status.charAt(0).toUpperCase() + rental.status.slice(1)}</div>
            </div>
            <div class="rental-actions">
                <button class="btn-outline btn-small" onclick="viewRentalDetails('${rental._id}')">View Details</button>
                ${rental.status === "active" ? `<button class="btn-secondary btn-small" onclick="contactOwner('${rental.owner._id}')">Contact Owner</button>` : ""}
            </div>
        </div>
    `,
    )
    .join("")
}

async function loadRentalRequests() {
  const list = document.getElementById("rentalRequestsList")
  list.innerHTML = '<div class="loading"><div class="spinner"></div></div>'

  try {
    const token = localStorage.getItem("token")
    const response = await fetch(`${API_BASE}/rentals/my-items`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (response.ok) {
      rentalRequests = await response.json()
      renderRentalRequests()
    } else {
      throw new Error("Failed to load rental requests")
    }
  } catch (error) {
    console.error("Load rental requests error:", error)
    renderRentalRequests() // Show sample data
  }
}

function renderRentalRequests() {
  const list = document.getElementById("rentalRequestsList")

  if (rentalRequests.length === 0) {
    list.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-inbox"></i>
                <h3>No rental requests</h3>
                <p>When people request to rent your items, they'll appear here</p>
            </div>
        `
    return
  }

  list.innerHTML = rentalRequests
    .map(
      (request) => `
        <div class="request-card">
            <div class="request-info">
                <h3>${request.item.title}</h3>
                <div class="requester-info">
                    <i class="fas fa-user"></i>
                    ${request.renter.name} (${request.renter.email})
                </div>
                <div class="request-dates">
                    <i class="fas fa-calendar"></i>
                    ${formatDate(request.startDate)} - ${formatDate(request.endDate)}
                </div>
                <div class="request-cost">Total: $${request.totalCost}</div>
                <div class="request-status status-${request.status}">${request.status.charAt(0).toUpperCase() + request.status.slice(1)}</div>
            </div>
            <div class="request-actions">
                ${
                  request.status === "pending"
                    ? `
                    <button class="btn-primary btn-small" onclick="approveRental('${request._id}')">
                        <i class="fas fa-check"></i> Approve
                    </button>
                    <button class="btn-danger btn-small" onclick="rejectRental('${request._id}')">
                        <i class="fas fa-times"></i> Reject
                    </button>
                `
                    : ""
                }
                <button class="btn-outline btn-small" onclick="contactRenter('${request.renter.email}')">Contact</button>
            </div>
        </div>
    `,
    )
    .join("")
}

function loadUserProfile() {
  if (currentUser) {
    document.getElementById("profileName").value = currentUser.name || ""
    document.getElementById("profileEmail").value = currentUser.email || ""
    document.getElementById("profilePhone").value = currentUser.phone || ""
    document.getElementById("profileAddress").value = currentUser.address
      ? `${currentUser.address.street || ""}\n${currentUser.address.city || ""}, ${currentUser.address.state || ""} ${currentUser.address.zipCode || ""}`.trim()
      : ""
  }
}

function showAddItemModal() {
  editingItemId = null
  document.getElementById("itemModalTitle").textContent = "Add New Item"
  document.getElementById("itemForm").reset()
  document.getElementById("addItemModal").style.display = "block"
}

function editItem(itemId) {
  const item = userItems.find((i) => i._id === itemId)
  if (!item) return

  editingItemId = itemId
  document.getElementById("itemModalTitle").textContent = "Edit Item"

  // Populate form with item data
  document.getElementById("itemTitle").value = item.title
  document.getElementById("itemCategory").value = item.category
  document.getElementById("itemDescription").value = item.description
  document.getElementById("itemPrice").value = item.pricePerDay
  document.getElementById("itemCondition").value = item.condition
  document.getElementById("itemDeposit").value = item.deposit || 0
  document.getElementById("itemAvailability").value = item.availability.toString()

  document.getElementById("addItemModal").style.display = "block"
}

async function handleItemSubmission(event) {
  event.preventDefault()

  const formData = {
    title: document.getElementById("itemTitle").value,
    category: document.getElementById("itemCategory").value,
    description: document.getElementById("itemDescription").value,
    pricePerDay: Number.parseFloat(document.getElementById("itemPrice").value),
    condition: document.getElementById("itemCondition").value,
    deposit: Number.parseFloat(document.getElementById("itemDeposit").value) || 0,
    availability: document.getElementById("itemAvailability").value === "true",
  }

  try {
    const token = localStorage.getItem("token")
    const url = editingItemId ? `${API_BASE}/items/${editingItemId}` : `${API_BASE}/items`
    const method = editingItemId ? "PUT" : "POST"

    const response = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(formData),
    })

    const data = await response.json()

    if (response.ok) {
      closeModal("addItemModal")
      showNotification(editingItemId ? "Item updated successfully!" : "Item added successfully!", "success")
      loadUserItems()
    } else {
      showNotification(data.message || "Failed to save item", "error")
    }
  } catch (error) {
    console.error("Item submission error:", error)
    showNotification("Network error. Please try again.", "error")
  }
}

async function deleteItem(itemId) {
  if (!confirm("Are you sure you want to delete this item?")) return

  try {
    const token = localStorage.getItem("token")
    const response = await fetch(`${API_BASE}/items/${itemId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (response.ok) {
      showNotification("Item deleted successfully!", "success")
      loadUserItems()
    } else {
      const data = await response.json()
      showNotification(data.message || "Failed to delete item", "error")
    }
  } catch (error) {
    console.error("Delete item error:", error)
    showNotification("Network error. Please try again.", "error")
  }
}

async function toggleItemAvailability(itemId, newAvailability) {
  try {
    const token = localStorage.getItem("token")
    const response = await fetch(`${API_BASE}/items/${itemId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ availability: newAvailability }),
    })

    if (response.ok) {
      showNotification(`Item ${newAvailability ? "activated" : "paused"} successfully!`, "success")
      loadUserItems()
    } else {
      const data = await response.json()
      showNotification(data.message || "Failed to update item", "error")
    }
  } catch (error) {
    console.error("Toggle availability error:", error)
    showNotification("Network error. Please try again.", "error")
  }
}

async function approveRental(rentalId) {
  await updateRentalStatus(rentalId, "approved")
}

async function rejectRental(rentalId) {
  await updateRentalStatus(rentalId, "cancelled")
}

async function updateRentalStatus(rentalId, status) {
  try {
    const token = localStorage.getItem("token")
    const response = await fetch(`${API_BASE}/rentals/${rentalId}/status`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status }),
    })

    if (response.ok) {
      showNotification(`Rental ${status} successfully!`, "success")
      loadRentalRequests()
    } else {
      const data = await response.json()
      showNotification(data.message || "Failed to update rental", "error")
    }
  } catch (error) {
    console.error("Update rental status error:", error)
    showNotification("Network error. Please try again.", "error")
  }
}

function contactRenter(email) {
  window.location.href = `mailto:${email}`
}

async function handleProfileUpdate(event) {
  event.preventDefault()

  const profileData = {
    name: document.getElementById("profileName").value,
    email: document.getElementById("profileEmail").value,
    phone: document.getElementById("profilePhone").value,
    address: document.getElementById("profileAddress").value,
  }

  try {
    const token = localStorage.getItem("token")
    const response = await fetch(`${API_BASE}/auth/profile`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(profileData),
    })

    if (response.ok) {
      showNotification("Profile updated successfully!", "success")
      currentUser = { ...currentUser, ...profileData }
      updateUIForLoggedInUser()
    } else {
      const data = await response.json()
      showNotification(data.message || "Failed to update profile", "error")
    }
  } catch (error) {
    console.error("Profile update error:", error)
    showNotification("Network error. Please try again.", "error")
  }
}
