// script.js (refactored & updated)

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
document.addEventListener("DOMContentLoaded", async () => {
  await initializeApp()            // ensure user is loaded before dependent actions
  await loadFeaturedItems()
  setupEventListeners()           // attaches delegated handlers too
  setupSearchAndFilters()
  if (currentUser) await loadCart() // load cart only if logged in (safe)
})

// ------------------------------
// Patch: Initialize App (await user fetch)
// ------------------------------
async function initializeApp() {
  const token = localStorage.getItem("token")
  if (token) {
    // await so currentUser is set before other calls (like loadCart)
    await fetchCurrentUser()
  }
  setupMobileNav()
}

// ==============================
// Event Listeners
// ==============================
function setupEventListeners() {
  // category cards (static)
  document.querySelectorAll(".category-card").forEach((card) => {
    card.addEventListener("click", function () {
      const category = this.dataset.category
      window.location.href = `items.html?category=${encodeURIComponent(category)}`
    })
  })

  // login / register forms
  const loginForm = document.getElementById("loginForm")
  if (loginForm) loginForm.addEventListener("submit", handleLogin)

  const registerForm = document.getElementById("registerForm")
  if (registerForm) registerForm.addEventListener("submit", handleRegister)

  // click outside modal to close
  window.addEventListener("click", (event) => {
    if (event.target.classList && event.target.classList.contains("modal")) {
      event.target.style.display = "none"
    }
  })

  // Delegated handlers for items grid (avoids inline onclick issues)
  const featuredGrid = document.getElementById("featured-items-grid")
  if (featuredGrid) {
    featuredGrid.addEventListener("click", (e) => {
      // Rent button
      const rentBtn = e.target.closest(".btn-rent")
      if (rentBtn) {
        e.stopPropagation()
        const id = rentBtn.dataset.itemId
        if (id) rentItem(id, rentBtn)
        return
      }

      // Add to cart button
      const cartBtn = e.target.closest(".btn-cart")
      if (cartBtn) {
        e.stopPropagation()
        const id = cartBtn.dataset.itemId
        if (id) addToCart(id, cartBtn)
        return
      }

      // Card click -> view item
      const card = e.target.closest(".item-card")
      if (card && card.dataset && card.dataset.id) {
        viewItem(card.dataset.id)
      }
    })
  }
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
  const queryInput = document.getElementById("searchInput")
  const query = queryInput ? queryInput.value.trim() : ""
  const params = new URLSearchParams(window.location.search)
  query ? params.set("search", query) : params.delete("search")
  window.location.href = `items.html?${params.toString()}`
}

function applyFilters() {
  const category = document.getElementById("categoryFilter")?.value || ""
  const minPrice = document.getElementById("minPrice")?.value || ""
  const maxPrice = document.getElementById("maxPrice")?.value || ""
  const sortBy = document.getElementById("sortBy")?.value || ""
  const search = document.getElementById("searchInput")?.value.trim() || ""

  const params = new URLSearchParams()
  if (search) params.set("search", search)
  if (category) params.set("category", category)
  if (minPrice) params.set("minPrice", minPrice)
  if (maxPrice) params.set("maxPrice", maxPrice)
  if (sortBy) params.set("sort", sortBy)

  window.location.href = `items.html?${params.toString()}`
}

function clearFilters() {
  const searchInput = document.getElementById("searchInput")
  if (searchInput) searchInput.value = ""
  if (document.getElementById("categoryFilter")) document.getElementById("categoryFilter").value = ""
  if (document.getElementById("minPrice")) document.getElementById("minPrice").value = ""
  if (document.getElementById("maxPrice")) document.getElementById("maxPrice").value = ""
  if (document.getElementById("sortBy")) document.getElementById("sortBy").value = "newest"
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
  const email = document.getElementById("loginEmail")?.value || ""
  const password = document.getElementById("loginPassword")?.value || ""

  try {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    })

    const data = await response.json().catch(() => ({}))
    if (response.ok) {
      if (data.token) localStorage.setItem("token", data.token)
      // server might return user inside data.user or just user object - handle both
      currentUser = data.user || data
      updateUIForLoggedInUser()
      closeModal("loginModal")
      showNotification("Login successful!", "success")
      await loadCart()
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
  const name = document.getElementById("registerName")?.value || ""
  const email = document.getElementById("registerEmail")?.value || ""
  const phone = document.getElementById("registerPhone")?.value || ""
  const password = document.getElementById("registerPassword")?.value || ""

  try {
    const response = await fetch(`${API_BASE}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, phone, password }),
    })

    const data = await response.json().catch(() => ({}))
    if (response.ok) {
      if (data.token) localStorage.setItem("token", data.token)
      currentUser = data.user || data
      updateUIForLoggedInUser()
      closeModal("registerModal")
      showNotification("Registration successful!", "success")
      await loadCart()
    } else {
      showNotification(data.message || "Registration failed", "error")
    }
  } catch (error) {
    console.error("Registration error:", error)
    showNotification("Network error. Please try again.", "error")
  }
}

// ------------------------------
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

function updateUIForLoggedInUser() {
  const navAuth = document.querySelector(".nav-auth")
  if (currentUser && navAuth) {
    const name = currentUser.name || currentUser.fullName || "User"
    navAuth.innerHTML = `
      <span>Welcome, ${escapeHtml(name)}</span>
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
    if (!response.ok) {
      console.error("Failed to load items, status:", response.status)
      showSampleItems()
      return
    }
    const json = await response.json().catch(() => [])
    // normalize items to consistent shape
    items = (Array.isArray(json) ? json : (json.items || [])).map(normalizeItem)
    if (items.length === 0) {
      showSampleItems()
      return
    }
    renderFeaturedItems(items)
  } catch (error) {
    console.error("Load items error:", error)
    showSampleItems()
  }
}

function normalizeItem(raw) {
  // map different possible API shapes into a consistent one
  const _id = raw._id || raw.id || raw.itemId || ""
  const name = raw.name || raw.title || raw.itemName || "Untitled"
  const price = raw.pricePerDay || raw.price || raw.dailyPrice || 0
  const category = raw.category || raw.cat || "Other"
  const location = raw.location || (raw.city ? { city: raw.city } : null) || {}
  const image = raw.image || raw.img || null
  return { _id, name, price, category, location, image }
}

function renderFeaturedItems(itemsd) {
  const grid = document.getElementById("featured-items-grid")
  if (!grid) return

  if (!Array.isArray(itemsd) || itemsd.length === 0) {
    showSampleItems()
    return
  }
//   container to remove item from the cart and add to cart
  grid.innerHTML = itemsd
    .map((item) => {
      const imgSrc = item.image || getItemImage(item.category)
      const title = escapeHtml(item.name)
      const price = Number(item.price).toFixed(2)
      // contain data-id so delegated handler can use it. Buttons have data-item-id.
      return `
        <div class="item-card" data-id="${item._id}">
          <div class="item-image"><img src="${imgSrc}" alt="${title}" /></div>
          <div class="item-content">
            <h3 class="item-title">${title}</h3>
            <div class="item-price">Rs${price}/day</div>
            <div class="item-location">
              <i class="fas fa-map-marker-alt"></i>
              ${escapeHtml(item.location?.city || "Location not specified")}
            </div>
    
            <div class="item-actions">
              <button class="btn-primary btn-cart" data-item-id="${item._id}">
                <i class="fas fa-cart-plus"></i> Add to Cart
              </button>
               <button class="btn-secondary btn-rent" data-item-id="${item._id}">
                <i class="fas fa-calendar-plus"></i> Rent Now
              </button> 
              <button class="btn-primary btn-rent" data-item-id="${item._id}">
                <i class="fas fa-cart-plus"></i> Remove Now
              </button> 
              
            </div>
          </div>
        </div>
      `
    })
    .join("")
}

function showSampleItems() {
  const grid = document.getElementById("featured-items-grid")
  if (!grid) return
  const sampleItems = [
    { _id: "s1", name: "Professional Camera", price: 25, location: { city: "New York" }, category: "Electronics" },
    { _id: "s2", name: "Power Drill Set", price: 15, location: { city: "Los Angeles" }, category: "Tools" },
    { _id: "s3", name: "Mountain Bike", price: 30, location: { city: "Chicago" }, category: "Sports" },
  ]
  items = sampleItems
  renderFeaturedItems(items)
}

function viewItem(itemId) {
  window.location.href = `item-detail.html?id=${encodeURIComponent(itemId)}`
}

// ==============================
// Notifications
// ==============================
function showNotification(message, type = "info") {
  const notification = document.createElement("div")
  notification.className = `notification notification-${type}`
  notification.innerHTML = `
    <div class="notification-content">
      <span>${escapeHtml(message)}</span>
      <button class="notification-close" aria-label="Close">×</button>
    </div>
  `
  notification.querySelector(".notification-close").addEventListener("click", () => {
    if (notification.parentElement) notification.remove()
  })

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
  const cat = (category || "Other").toString()
  const imageMap = {
    Electronics: "/electronic.png",
    Tools: "/tools.png",
    Sports: "/sport.png",
    Furniture: "/furniture.png",
    Vehicles: "/mountain-bike-trail.png",
    Other: "/rental-item.png",
  }
  return imageMap[cat] || "/rental-item.png"
}

function escapeHtml(str) {
  if (!str) return ""
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
}

// ------------------------------
// Patch: update cart count UI helper
// Add a small span in your HTML: <span id="cartCount">0</span>
// ------------------------------
function updateCartCountUI(totalCount = 0) {
  const countEl = document.getElementById("cartCount")
  if (countEl) countEl.textContent = totalCount
}

// ==============================
// Rentals
// ==============================
async function rentItem(itemId, buttonElement) {
  if (!currentUser) {
    showNotification("Please login to rent items", "error")
    showLoginModal()
    return
  }
  const btn = buttonElement instanceof Element ? buttonElement : null
  try {
    if (btn) btn.disabled = true
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
    const data = await response.json().catch(() => ({}))
    if (response.ok) {
      showNotification("Rental request sent successfully!", "success")
    } else {
      showNotification(data.message || "Failed to create rental request", "error")
    }
  } catch (error) {
    console.error("Rental error:", error)
    showNotification("Network error. Please try again.", "error")
  } finally {
    if (btn) btn.disabled = false
  }
}

function rentSampleItem(itemId, event) {
  event?.stopPropagation()
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
// ------------------------------
// Patch: Load cart (will also set a cart count badge)
// ------------------------------
async function loadCart() {
  // if not logged in, clear cart UI / count
  if (!currentUser) {
    renderCart([]) // clears UI and count
    return
  }

  try {
    const response = await fetch(`${API_BASE}/cart`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    })
    const cart = await response.json()
    if (response.ok && Array.isArray(cart)) {
      renderCart(cart)
    } else if (response.ok && cart.items) {
      // some APIs return { items: [...] }
      renderCart(cart.items)
    } else {
      renderCart([])
    }
  } catch (error) {
    console.error("Load cart error:", error)
    renderCart([])
  }
}

async function addToCart(itemId, buttonElement) {
  if (!currentUser) {
    showNotification("Please login to add items to cart", "error")
    showLoginModal()
    return
  }
  const btn = buttonElement instanceof Element ? buttonElement : null
  try {
    if (btn) btn.disabled = true
    const response = await fetch(`${API_BASE}/cart/add`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify({ itemId, quantity: 1 }),
    })
    const data = await response.json().catch(() => ({}))
    // ------------------------------
    // Patch small addition: after addToCart success call loadCart()
    // ------------------------------
    if (response.ok) {
      showNotification("Item added to cart!", "success")
      // reload cart and update UI/count
      await loadCart()
    } else {
      showNotification(data.message || "Failed to add item to cart", "error")
    }
  } catch (error) {
    console.error("Cart error:", error)
    showNotification("Network error. Please try again.", "error")
  } finally {
    if (btn) btn.disabled = false
  }
}

// ------------------------------
// Patch: renderCart — compute & update count too
// ------------------------------
function renderCart(cartItems) {
  const cartDiv = document.getElementById("cart-items")
  if (!cartDiv) {
    // still update count even if no cart area on current page
    const total = (Array.isArray(cartItems) ? cartItems.reduce((s, it) => s + (it.quantity || 0), 0) : 0)
    updateCartCountUI(total)
    return
  }

  if (!Array.isArray(cartItems) || cartItems.length === 0) {
    cartDiv.innerHTML = "<p>Your cart is empty.</p>"
    updateCartCountUI(0)
    return
  }

  let total = 0
  const html = cartItems
    .map((item) => {
      // support both shapes: item.product or item.productId/product
      const product = item.product || item.productId || item // fallback
      const price = (product && (product.pricePerDay || product.price || product.rate)) || 0
      const title = (product && (product.title || product.name)) || "Untitled"
      const id = (product && (product._id || product.id)) || (item.productId || item._id || item.id)
      const quantity = item.quantity || 1
      const subtotal = price * quantity
      total += subtotal
      return `
        <div class="cart-item">
          <span>${title} (x${quantity})</span>
          <span>$${subtotal}</span>
          <button onclick="removeFromCart('${id}')">Remove</button>
        </div>
      `
    })
    .join("")

  cartDiv.innerHTML = html + `
    <div class="cart-total">
      <strong>Total:</strong> $${total}
    </div>
  `

  // update header cart count
  const totalCount = cartItems.reduce((s, it) => s + (it.quantity || 0), 0)
  updateCartCountUI(totalCount)
}

async function removeFromCart(itemId, buttonElement) {
  if (!itemId) return;
  const btn = buttonElement instanceof Element ? buttonElement : null;

  const token = localStorage.getItem("token");
  if (!token) {
    showNotification("You must be logged in to remove items from cart", "error");
    return;
  }

  try {
    if (btn) btn.disabled = true;

    const res = await fetch(`${API_BASE}/cart/${encodeURIComponent(itemId)}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    const text = await res.text().catch(() => "");
    let data;
    try { data = text ? JSON.parse(text) : {}; } catch (e) { data = { raw: text }; }

    console.log("removeFromCart -> status:", res.status, "body:", data);

    if (res.ok && data.ok) {
      showNotification(data.message || "Item removed from cart", "info");
      await loadCart();
      return true;
    } else {
      showNotification(data.error || `Failed to remove item (${res.status})`, "error");
      return false;
    }
  } catch (err) {
    console.error("Remove cart error:", err);
    showNotification("Network error. Please try again.", "error");
    return false;
  } finally {
    if (btn) btn.disabled = false;
  }
}

// ==============================
// Scroll To Section
// ==============================
window.scrollToSection = function (id) {
  const el = document.getElementById(id)
  if (!el) {
    console.warn("No element with id:", id)
    return
  }
  el.scrollIntoView({ behavior: "smooth", block: "start" })
}