// ==============================
// Global Variables
// ==============================
let currentUser = null;
let items = [];
const API_BASE = "http://localhost:5000/api";

// ==============================
// Initialization
// ==============================
document.addEventListener("DOMContentLoaded", async () => {
  await initializeApp();
  await loadFeaturedItems();
  setupEventListeners();
  setupSearchAndFilters();
  if (currentUser) await loadCart();
});

async function initializeApp() {
  const token = localStorage.getItem("token");
  if (token) await fetchCurrentUser();
  setupMobileNav();
}

// ==============================
// Event Listeners
// ==============================
function setupEventListeners() {
  // Category cards
  document.querySelectorAll(".category-card").forEach((card) => {
    card.addEventListener("click", () => {
      const category = card.dataset.category;
      window.location.href = `items.html?category=${encodeURIComponent(category)}`;
    });
  });

  // Login / Register forms
  document.getElementById("loginForm")?.addEventListener("submit", handleLogin);
  document.getElementById("registerForm")?.addEventListener("submit", handleRegister);

  // Seller add-item form
  document.getElementById("addItemForm")?.addEventListener("submit", handleAddItem);

  // Close modals when clicking outside
  window.addEventListener("click", (e) => {
    if (e.target.classList.contains("modal")) e.target.style.display = "none";
  });
}

// ==============================
// Mobile Navigation
// ==============================
function setupMobileNav() {
  const navToggle = document.getElementById("nav-toggle");
  const navMenu = document.getElementById("nav-menu");
  if (navToggle && navMenu) {
    navToggle.addEventListener("click", () => navMenu.classList.toggle("active"));
    document.querySelectorAll(".nav-link").forEach((link) =>
      link.addEventListener("click", () => navMenu.classList.remove("active"))
    );
  }
}

// ==============================
// Authentication
// ==============================
async function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById("loginEmail").value;
  const password = document.getElementById("loginPassword").value;

  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (res.ok) {
      localStorage.setItem("token", data.token);
      currentUser = data.user;
      updateUIForLoggedInUser();
      closeModal("loginModal");
      showNotification("Login successful!", "success");
      if (currentUser.isSeller) showSellerDashboard();
      await loadCart();
    } else {
      showNotification(data.message || "Login failed", "error");
    }
  } catch {
    showNotification("Network error. Please try again.", "error");
  }
}

async function handleRegister(e) {
  e.preventDefault();
  const name = document.getElementById("registerName").value;
  const email = document.getElementById("registerEmail").value;
  const phone = document.getElementById("registerPhone").value;
  const password = document.getElementById("registerPassword").value;
  const isSeller = document.getElementById("registerSeller")?.checked || false;

  try {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, phone, password, isSeller }),
    });
    const data = await res.json();
    if (res.ok) {
      localStorage.setItem("token", data.token);
      currentUser = data.user;
      updateUIForLoggedInUser();
      closeModal("registerModal");
      showNotification("Registration successful!", "success");
      if (currentUser.isSeller) showSellerDashboard();
      await loadCart();
    } else {
      showNotification(data.message || "Registration failed", "error");
    }
  } catch {
    showNotification("Network error. Please try again.", "error");
  }
}

async function fetchCurrentUser() {
  try {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    });
    if (!res.ok) throw new Error("Not authorized");
    const data = await res.json();
    currentUser = data.user || data;
    updateUIForLoggedInUser();
  } catch {
    localStorage.removeItem("token");
    currentUser = null;
  }
}

function updateUIForLoggedInUser() {
  const navAuth = document.querySelector(".nav-auth");
  if (currentUser && navAuth) {
    navAuth.innerHTML = `
      <span>Welcome, ${escapeHtml(currentUser.name)}</span>
      <button class="btn-secondary" onclick="logout()">Logout</button>
    `;
  }
}

function logout() {
  localStorage.removeItem("token");
  currentUser = null;
  renderCart([]); // clear cart UI immediately
  location.reload();
}

// ==============================
// Seller Features
// ==============================
function showSellerDashboard() {
  const modal = document.getElementById("sellerDashboardModal");
  if (modal) {
    modal.style.display = "block";
    loadSellerItems();
  }
}

async function handleAddItem(e) {
  e.preventDefault();
  if (!currentUser?.isSeller) {
    showNotification("Only sellers can add items", "error");
    return;
  }

  const formData = new FormData(e.target);
  try {
    const res = await fetch(`${API_BASE}/items`, {
      method: "POST",
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      body: formData,
    });
    if (res.ok) {
      showNotification("Item added successfully!", "success");
      e.target.reset();
      loadSellerItems();
    } else {
      const data = await res.json();
      showNotification(data.message || "Failed to add item", "error");
    }
  } catch {
    showNotification("Network error. Please try again.", "error");
  }
}

async function loadSellerItems() {
  if (!currentUser?.isSeller) return;
  const tableBody = document.getElementById("sellerItemsList");
  if (!tableBody) return;

  tableBody.innerHTML = "<tr><td colspan='4'>Loading...</td></tr>";

  try {
    const res = await fetch(`${API_BASE}/items?owner=${currentUser._id}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    });
    const items = await res.json();
    if (res.ok) {
      tableBody.innerHTML = items
        .map(
          (it) => `
          <tr>
            <td>${escapeHtml(it.title)}</td>
            <td>${it.availability ? "Available" : "Not Available"}</td>
            <td>${it.status || "—"}</td>
            <td><button class="btn-danger" onclick="deleteSellerItem('${it._id}')">Remove</button></td>
          </tr>`
        )
        .join("");
    } else {
      tableBody.innerHTML = "<tr><td colspan='4'>Failed to load items</td></tr>";
    }
  } catch {
    tableBody.innerHTML = "<tr><td colspan='4'>Error loading items</td></tr>";
  }
}

async function deleteSellerItem(itemId) {
  if (!confirm("Are you sure you want to remove this item?")) return;
  try {
    const res = await fetch(`${API_BASE}/items/${itemId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    });
    if (res.ok) {
      showNotification("Item removed successfully!", "success");
      loadSellerItems();
    } else {
      showNotification("Failed to remove item", "error");
    }
  } catch {
    showNotification("Network error. Please try again.", "error");
  }
}

// ==============================
// Featured Items
// ==============================
async function loadFeaturedItems() {
  const grid = document.getElementById("featured-items-grid");
  if (!grid) return;
  grid.innerHTML = '<div class="loading"><div class="spinner"></div></div>';

  try {
    const res = await fetch(`${API_BASE}/items`);
    const itemsData = await res.json();
    items = itemsData.map((it) => normalizeItem(it));
    renderFeaturedItems(items);
  } catch {
    grid.innerHTML = "<p>Failed to load items.</p>";
  }
}

function normalizeItem(raw) {
  return {
    _id: raw._id,
    title: raw.title,
    price: raw.pricePerDay,
    category: raw.category,
    location: raw.location,
    image: raw.images?.length ? raw.images[0] : getItemImage(raw.category),
  };
}

function renderFeaturedItems(items) {
  const grid = document.getElementById("featured-items-grid");
  if (!grid) return;
  grid.innerHTML = items
    .map(
      (item) => `
      <div class="item-card" data-id="${item._id}">
        <div class="item-image"><img src="${item.image}" alt="${escapeHtml(item.title)}"></div>
        <div class="item-content">
          <h3>${escapeHtml(item.title)}</h3>
          <p>₹${item.price}/day</p>
          <p><i class="fas fa-map-marker-alt"></i> ${escapeHtml(item.location?.city || "Unknown")}</p>
          <button class="btn-primary" onclick="addToCart('${item._id}')">Add to Cart</button>
          <button class="btn-secondary" onclick="rentItem('${item._id}')">Rent Now</button>
        </div>
      </div>`
    )
    .join("");
}

// ==============================
// Rentals
// ==============================
async function rentItem(itemId) {
  if (!currentUser) {
    showNotification("Please login to rent items", "error");
    showLoginModal();
    return;
  }
  try {
    const res = await fetch(`${API_BASE}/rentals`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify({
        itemId,
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 7 * 86400000).toISOString(),
      }),
    });
    if (res.ok) {
      showNotification("Rental request sent!", "success");
    } else {
      showNotification("Failed to rent item", "error");
    }
  } catch {
    showNotification("Network error. Please try again.", "error");
  }
}

// ==============================
// Cart
// ==============================
async function loadCart() {
  if (!currentUser) {
    renderCart([]);
    return;
  }
  try {
    const res = await fetch(`${API_BASE}/cart`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    });
    const data = await res.json();
    if (res.ok) renderCart(data);
    else renderCart([]);
  } catch {
    renderCart([]);
  }
}

async function addToCart(itemId) {
  if (!currentUser) {
    showNotification("Please login to add items", "error");
    showLoginModal();
    return;
  }
  try {
    const res = await fetch(`${API_BASE}/cart/add`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify({ itemId, quantity: 1 }),
    });
    if (res.ok) {
      showNotification("Item added to cart!", "success");
      await loadCart();
    } else {
      showNotification("Failed to add to cart", "error");
    }
  } catch {
    showNotification("Network error. Please try again.", "error");
  }
}

async function removeFromCart(cartId) {
  try {
    const res = await fetch(`${API_BASE}/cart/${cartId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    });
    if (res.ok) {
      showNotification("Item removed from cart", "info");
      await loadCart();
    } else {
      showNotification("Failed to remove item", "error");
    }
  } catch {
    showNotification("Network error. Please try again.", "error");
  }
}

async function updateCartQuantity(cartId, newQty) {
  if (newQty <= 0) return removeFromCart(cartId);
  try {
    const res = await fetch(`${API_BASE}/cart/${cartId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify({ quantity: newQty }),
    });
    if (res.ok) {
      showNotification("Cart updated", "success");
      await loadCart();
    } else {
      const data = await res.json();
      showNotification(data.message || "Failed to update cart", "error");
    }
  } catch {
    showNotification("Network error. Please try again.", "error");
  }
}

function renderCart(cartItems) {
  const cartDiv = document.getElementById("cart-items");
  const countEl = document.getElementById("cartCount");

  // update badge
  if (countEl) {
    const totalCount = cartItems.reduce((sum, it) => sum + (it.quantity || 0), 0);
    countEl.textContent = totalCount;
  }

  if (!cartDiv) return;

  if (!Array.isArray(cartItems) || cartItems.length === 0) {
    cartDiv.innerHTML = "<p>Your cart is empty.</p>";
    return;
  }

  let total = 0;
  cartDiv.innerHTML = cartItems
    .map((item) => {
      const product = item.itemId;
      const title = product?.title || "Untitled";
      const price = product?.pricePerDay || 0;
      const quantity = item.quantity || 1;
      const subtotal = price * quantity;
      total += subtotal;

      const imgSrc =
        product?.images?.[0] || getItemImage(product?.category || "Other");

      return `
        <div class="cart-item">
          <img src="${imgSrc}" alt="${escapeHtml(title)}" class="cart-thumb"/>
          <div class="cart-info">
            <h4>${escapeHtml(title)}</h4>
            <p>₹${price}/day</p>
            <div class="cart-qty">
              <button onclick="updateCartQuantity('${item._id}', ${quantity - 1})">-</button>
              <span>${quantity}</span>
              <button onclick="updateCartQuantity('${item._id}', ${quantity + 1})">+</button>
            </div>
          </div>
          <div class="cart-actions">
            <span>₹${subtotal}</span>
            <button class="btn-danger" onclick="removeFromCart('${item._id}')">Remove</button>
          </div>
        </div>
      `;
    })
    .join("");

  cartDiv.innerHTML += `
    <div class="cart-total">
      <strong>Total:</strong> ₹${total}
    </div>
  `;
}

// ==============================
// Search & Filters
// ==============================
function setupSearchAndFilters() {
  document.querySelector(".search-bar button")?.addEventListener("click", performSearch);
  document.querySelector(".filters .btn-outline")?.addEventListener("click", applyFilters);
  document.querySelector(".filters .btn-secondary")?.addEventListener("click", clearFilters);
}

function performSearch() {
  const query = document.getElementById("searchInput").value.trim();
  const params = new URLSearchParams(window.location.search);
  query ? params.set("search", query) : params.delete("search");
  window.location.href = `items.html?${params.toString()}`;
}

function applyFilters() {
  const category = document.getElementById("categoryFilter")?.value;
  const minPrice = document.getElementById("minPrice")?.value;
  const maxPrice = document.getElementById("maxPrice")?.value;
  const sortBy = document.getElementById("sortBy")?.value;
  const search = document.getElementById("searchInput")?.value.trim();

  const params = new URLSearchParams();
  if (search) params.set("search", search);
  if (category) params.set("category", category);
  if (minPrice) params.set("minPrice", minPrice);
  if (maxPrice) params.set("maxPrice", maxPrice);
  if (sortBy) params.set("sort", sortBy);

  window.location.href = `items.html?${params.toString()}`;
}

function clearFilters() {
  window.location.href = "items.html";
}

// ==============================
// Modals
// ==============================
function showLoginModal() { document.getElementById("loginModal").style.display = "block"; }
function showRegisterModal() { document.getElementById("registerModal").style.display = "block"; }
function closeModal(id) { document.getElementById(id).style.display = "none"; }

// ==============================
// Notifications
// ==============================
function showNotification(message, type = "info", timeout = 4000) {
  // Create container if not exists
  let container = document.getElementById("notification-container");
  if (!container) {
    container = document.createElement("div");
    container.id = "notification-container";
    document.body.appendChild(container);
  }

  // Create notification
  const notification = document.createElement("div");
  notification.className = `notification notification-${type}`;
  notification.innerHTML = `
    <div class="notification-content">
      <span>${message}</span>
      <button class="notification-close">&times;</button>
    </div>
  `;

  // Close on click
  notification.querySelector(".notification-close").addEventListener("click", () => {
    notification.classList.add("fade-out");
    setTimeout(() => notification.remove(), 300);
  });

  container.appendChild(notification);

  // Auto dismiss
  setTimeout(() => {
    if (notification.parentElement) {
      notification.classList.add("fade-out");
      setTimeout(() => notification.remove(), 300);
    }
  }, timeout);

  // Inject styles once
  if (!document.querySelector("#notification-styles")) {
    const styles = document.createElement("style");
    styles.id = "notification-styles";
    styles.textContent = `
      #notification-container {
        position: fixed;
        top: 80px;
        right: 20px;
        z-index: 9999;
        display: flex;
        flex-direction: column;
        gap: 10px;
      }
      .notification {
        background: white;
        border-radius: 8px;
        box-shadow: 0 8px 30px rgba(0,0,0,0.15);
        min-width: 280px;
        max-width: 350px;
        animation: slideIn 0.3s ease;
        overflow: hidden;
      }
      .notification-success { border-left: 4px solid #10b981; }
      .notification-error { border-left: 4px solid #ef4444; }
      .notification-info { border-left: 4px solid #3b82f6; }
      .notification-content {
        padding: 1rem;
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-family: "Open Sans", sans-serif;
      }
      .notification-close {
        background: none;
        border: none;
        font-size: 1.2rem;
        cursor: pointer;
        color: #6b7280;
      }
      @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
      .fade-out {
        animation: fadeOut 0.3s ease forwards;
      }
      @keyframes fadeOut {
        from { opacity: 1; transform: translateX(0); }
        to { opacity: 0; transform: translateX(100%); }
      }
    `;
    document.head.appendChild(styles);
  }
}


// ==============================
// Utilities
// ==============================
function escapeHtml(str) {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function getItemImage(category) {
  const images = {
    Electronics: "/electronic.png",
    Tools: "/tools.png",
    Sports: "/sport.png",
    Furniture: "/furniture.png",
    Vehicles: "/mountain-bike-trail.png",
    Other: "/rental-item.png",
  };
  return images[category] || images.Other;
}
