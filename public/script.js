// ==============================
// Global variables
// ==============================
let currentUser = null
let featuredItems = []
let items = []

// API Base URL
const API_BASE = "http://localhost:5000/api"

// ==============================
// DOM Content Loaded
// ==============================
document.addEventListener("DOMContentLoaded", () => {
  initializeApp()
  loadFeaturedItems()
  setupEventListeners()
  setupSearchAndFilters()
  loadCart() // 🔹 Load cart on page load if logged in
})

// ==============================
// Initialize App
// ==============================
function initializeApp() {
  const token = localStorage.getItem("token")
  if (token) {
    fetchCurrentUser()
  }
  setupMobileNav()
}

// ==============================
// Event Listeners
// ==============================
function setupEventListeners() {
  document.querySelectorAll(".category-card").forEach((card) => {
    card.addEventListener("click", function () {
      const category = this.dataset.category
      window.location.href = `items.html?category=${category}`
    })
  })

  const loginForm = document.getElementById("loginForm")
  if (loginForm) loginForm.addEventListener("submit", handleLogin)

  const registerForm = document.getElementById("registerForm")
  if (registerForm) registerForm.addEventListener("submit", handleRegister)

  window.addEventListener("click", (event) => {
    if (event.target.classList.contains("modal")) {
      event.target.style.display = "none"
    }
  })
}

// ==============================
// Mobile Navigation
// ==============================
function setupMobileNav() {
  const navToggle = document.getElementById("nav-toggle")
  const navMenu = document.getElementById("nav-menu")

  if (navToggle && navMenu) {
    navToggle.addEventListener("click", () => {
      navMenu.classList.toggle("active")
    })
    document.querySelectorAll(".nav-link").forEach((link) => {
      link.addEventListener("click", () => navMenu.classList.remove("active"))
    })
  }
}

// ==============================
// Search & Filters
// ==============================
function setupSearchAndFilters() {
  const searchBtn = document.querySelector(".search-bar button")
  if (searchBtn) searchBtn.addEventListener("click", () => performSearch())

  const applyBtn = document.querySelector(".filters .btn-outline")
  if (applyBtn) applyBtn.addEventListener("click", () => applyFilters())

  const clearBtn = document.querySelector(".filters .btn-secondary")
  if (clearBtn) clearBtn.addEventListener("click", () => clearFilters())
}

function performSearch() {
  const query = document.getElementById("searchInput").value.trim()
  const params = new URLSearchParams(window.location.search)
  query ? params.set("search", query) : params.delete("search")
  window.location.href = `items.html?${params.toString()}`
}

function applyFilters() {
  const category = document.getElementById("categoryFilter").value
  const minPrice = document.getElementById("minPrice").value
  const maxPrice = document.getElementById("maxPrice").value
  const sortBy = document.getElementById("sortBy").value
  const search = document.getElementById("searchInput").value.trim()

  const params = new URLSearchParams()
  if (search) params.set("search", search)
  if (category) params.set("category", category)
  if (minPrice) params.set("minPrice", minPrice)
  if (maxPrice) params.set("maxPrice", maxPrice)
  if (sortBy) params.set("sort", sortBy)

  window.location.href = `items.html?${params.toString()}`
}

function clearFilters() {
  document.getElementById("searchInput").value = ""
  document.getElementById("categoryFilter").value = ""
  document.getElementById("minPrice").value = ""
  document.getElementById("maxPrice").value = ""
  document.getElementById("sortBy").value = "newest"
  window.location.href = "items.html"
}

// ==============================
// Modal Functions
// ==============================
function showLoginModal() {
  const modal = document.getElementById("loginModal")
  if (modal) modal.style.display = "block"
}

function showRegisterModal() {
  const modal = document.getElementById("registerModal")
  if (modal) modal.style.display = "block"
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId)
  if (modal) modal.style.display = "none"
}

function switchModal(currentModal, targetModal) {
  closeModal(currentModal)
  const target = document.getElementById(targetModal)
  if (target) target.style.display = "block"
}

// ==============================
// Authentication
// ==============================
async function handleLogin(event) {
  event.preventDefault()
  const email = document.getElementById("loginEmail").value
  const password = document.getElementById("loginPassword").value

  try {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    })

    const data = await response.json()
    if (response.ok) {
      localStorage.setItem("token", data.token)
      currentUser = data.user
      updateUIForLoggedInUser()
      closeModal("loginModal")
      showNotification("Login successful!", "success")
      loadCart()
    } else {
      showNotification(data.message || "Login failed", "error")
    }
  } catch (error) {
    console.error("Login error:", error)
    showNotification("Network error. Please try again.", "error")
  }
}

async function handleRegister(event) {
  event.preventDefault()
  const name = document.getElementById("registerName").value
  const email = document.getElementById("registerEmail").value
  const phone = document.getElementById("registerPhone").value
  const password = document.getElementById("registerPassword").value

  try {
    const response = await fetch(`${API_BASE}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, phone, password }),
    })

    const data = await response.json()
    if (response.ok) {
      localStorage.setItem("token", data.token)
      currentUser = data.user
      updateUIForLoggedInUser()
      closeModal("registerModal")
      showNotification("Registration successful!", "success")
      loadCart()
    } else {
      showNotification(data.message || "Registration failed", "error")
    }
  } catch (error) {
    console.error("Registration error:", error)
    showNotification("Network error. Please try again.", "error")
  }
}

async function fetchCurrentUser() {
  const token = localStorage.getItem("token")
  if (!token) return

  try {
    const response = await fetch(`${API_BASE}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (response.ok) {
      currentUser = await response.json()
      updateUIForLoggedInUser()
    } else {
      localStorage.removeItem("token")
    }
  } catch (error) {
    console.error("Fetch user error:", error)
    localStorage.removeItem("token")
  }
}

function updateUIForLoggedInUser() {
  const navAuth = document.querySelector(".nav-auth")
  if (currentUser && navAuth) {
    navAuth.innerHTML = `
      <span>Welcome, ${currentUser.name}</span>
      <button class="btn-secondary" onclick="logout()">Logout</button>
    `
  }
}

function logout() {
  localStorage.removeItem("token")
  currentUser = null
  location.reload()
}

// ==============================
// Featured Items
// ==============================
async function loadFeaturedItems() {
  const grid = document.getElementById("featured-items-grid")
  if (!grid) return
  grid.innerHTML = '<div class="loading"><div class="spinner"></div></div>'

  try {
    const response = await fetch(`${API_BASE}/items`)
    const itemsk = await response.json()
    items = itemsk
    if (response.ok) {
      renderFeaturedItems(items)
    } else {
      grid.innerHTML = '<p class="text-center">Unable to load items at this time.</p>'
    }
  } catch (error) {
    console.error("Load items error:", error)
    showSampleItems()
  }
}

function renderFeaturedItems(itemsd) {
  const grid = document.getElementById("featured-items-grid")
  if (!grid) return

  if (itemsd.length === 0) {
    showSampleItems()
    return  
  }

  grid.innerHTML = itemsd.map((item) => `
    <div class="item-card" onclick="viewItem('${item._id}')">
      <div class="item-image">
        <img src="${getItemImage(item.category)}" alt="${item.name}" />
      </div>
      <div class="item-content">
        <h3 class="item-title">${item.name}</h3>
        <div class="item-price">$${item.price}/day</div>
        <div class="item-location">
          <i class="fas fa-map-marker-alt"></i>
          ${item.location?.city || "Location not specified"}
        </div>
        <button class="btn-primary btn-cart" onclick="addToCart('${item._id}', event)">
          <i class="fas fa-cart-plus"></i> Add to Cart
        </button>
        <button class="btn-secondary btn-rent" onclick="rentItem('${item._id}', event)">
          <i class="fas fa-calendar-plus"></i> Rent Now
        </button>
      </div>
    </div>
  `).join("")
}

function showSampleItems() {
  const grid = document.getElementById("featured-items-grid")
  if (!grid) return
  const sampleItems = [
    { id: "1", title: "Professional Camera", price: 25, location: "New York", category: "Electronics" },
    { id: "2", title: "Power Drill Set", price: 15, location: "Los Angeles", category: "Tools" },
    { id: "3", title: "Mountain Bike", price: 30, location: "Chicago", category: "Sports" },
  ]
  grid.innerHTML = sampleItems.map((item) => `
    <div class="item-card">
      <div class="item-image">
        <img src="${getItemImage(item.category)}" alt="${item.title}" />
      </div>
      <div class="item-content">
        <h3 class="item-title">${item.title}</h3>
        <div class="item-price">$${item.price}/day</div>
        <div class="item-location"><i class="fas fa-map-marker-alt"></i> ${item.location}</div>
        <button class="btn-primary btn-cart" onclick="addToCart('${item.id}', event)">
          <i class="fas fa-cart-plus"></i> Add to Cart
        </button>
        <button class="btn-secondary btn-rent" onclick="rentSampleItem('${item.id}', event)">
          <i class="fas fa-calendar-plus"></i> Rent Now
        </button>
      </div>
    </div>
  `).join("")
}

function viewItem(itemId) {
  window.location.href = `item-detail.html?id=${itemId}`
}

// ==============================
// Notifications
// ==============================
function showNotification(message, type = "info") {
  const notification = document.createElement("div")
  notification.className = `notification notification-${type}`
  notification.innerHTML = `
    <div class="notification-content">
      <span>${message}</span>
      <button class="notification-close" onclick="this.parentElement.parentElement.remove()">×</button>
    </div>
  `
  if (!document.querySelector("#notification-styles")) {
    const styles = document.createElement("style")
    styles.id = "notification-styles"
    styles.textContent = `
      .notification { position: fixed; top: 90px; right: 20px; background: white;
        border-radius: 8px; box-shadow: 0 8px 30px rgba(0,0,0,0.15);
        z-index: 3000; min-width: 300px; animation: slideIn 0.3s ease; }
      .notification-success { border-left: 4px solid #10b981; }
      .notification-error { border-left: 4px solid #ef4444; }
      .notification-info { border-left: 4px solid #3b82f6; }
      .notification-content { padding: 1rem; display: flex; justify-content: space-between; align-items: center; }
      .notification-close { background: none; border: none; font-size: 1.5rem; cursor: pointer; color: #6b7280; }
      @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
    `
    document.head.appendChild(styles)
  }
  document.body.appendChild(notification)
  setTimeout(() => { if (notification.parentElement) notification.remove() }, 5000)
}

// ==============================
// Utility Functions
// ==============================
function getItemImage(category) {
  const imageMap = {
    Electronics: "/professional-camera.png",
    Tools: "/rental-item.png",
    Sports: "/mountain-bike-trail.png",
    Furniture: "/rental-item.png",
    Vehicles: "/mountain-bike-trail.png",
    Other: "/rental-item.png",
  }
  return imageMap[category] || "/rental-item.png"
}

// ==============================
// Rentals
// ==============================
async function rentItem(itemId, event) {
  event.stopPropagation()
  if (!currentUser) {
    showNotification("Please login to rent items", "error")
    showLoginModal()
    return
  }
  try {
    const response = await fetch(`${API_BASE}/rentals`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify({
        itemId,
        startDate: new Date().toISOString().split("T")[0],
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      }),
    })
    const data = await response.json()
    response.ok
      ? showNotification("Rental request sent successfully!", "success")
      : showNotification(data.message || "Failed to create rental request", "error")
  } catch (error) {
    console.error("Rental error:", error)
    showNotification("Network error. Please try again.", "error")
  }
}

function rentSampleItem(itemId, event) {
  event.stopPropagation()
  if (!currentUser) {
    showNotification("Please login to rent items", "error")
    showLoginModal()
    return
  }
  showNotification("This is a demo item. In a real app, this would create a rental request!", "info")
}

// ==============================
// Cart Functions
// ==============================
async function addToCart(itemId, event) {
  event.stopPropagation()
  if (!currentUser) {
    showNotification("Please login to add items to cart", "error")
    showLoginModal()
    return
  }
  try {
    const response = await fetch(`${API_BASE}/cart/add`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify({ itemId, quantity: 1 }),
    })
    const data = await response.json()
    if (response.ok) {
      showNotification("Item added to cart!", "success")
      loadCart()
    } else {
      showNotification(data.message || "Failed to add item to cart", "error")
    }
  } catch (error) {
    console.error("Cart error:", error)
    showNotification("Network error. Please try again.", "error")
  }
}

async function loadCart() {
  if (!currentUser) return
  try {
    const response = await fetch(`${API_BASE}/cart`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    })
    const cart = await response.json()
    if (response.ok) renderCart(cart)
  } catch (error) {
    console.error("Load cart error:", error)
  }
}

function renderCart(cartItems) {
  const cartDiv = document.getElementById("cart-items")
  if (!cartDiv) return

  if (cartItems.length === 0) {
    cartDiv.innerHTML = "<p>Your cart is empty.</p>"
    return
  }

  let total = 0
  cartDiv.innerHTML = cartItems
    .map((item) => {
      const product = item.product
      if (!product) return ""
      const subtotal = product.pricePerDay * item.quantity
      total += subtotal
      return `
        <div class="cart-item">
          <span>${product.title} (x${item.quantity})</span>
          <span>$${subtotal}</span>
          <button onclick="removeFromCart('${product._id}')">Remove</button>
        </div>
      `
    })
    .join("")

  cartDiv.innerHTML += `
    <div class="cart-total">
      <strong>Total:</strong> $${total}
    </div>
  `
}

async function removeFromCart(itemId) {
  try {
    const response = await fetch(`${API_BASE}/cart/${itemId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    })
    const data = await response.json()
    if (response.ok) {
      showNotification("Item removed from cart", "info")
      loadCart()
    } else {
      showNotification(data.message || "Failed to remove item", "error")
    }
  } catch (error) {
    console.error("Remove cart error:", error)
  }
}

