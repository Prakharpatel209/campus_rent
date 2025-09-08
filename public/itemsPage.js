// Items page specific functionality
let allItems = []
let filteredItems = []
let currentPage = 1
const itemsPerPage = 12
//const API_BASE = "http://localhost:5000/api" // Backend API

document.addEventListener("DOMContentLoaded", () => {
  initializeItemsPage()
  loadItems()
})

function initializeItemsPage() {
  const urlParams = new URLSearchParams(window.location.search)
  const category = urlParams.get("category")
  const search = urlParams.get("search")

  if (category) document.getElementById("categoryFilter").value = category
  if (search) document.getElementById("searchInput").value = search

  document.getElementById("categoryFilter").addEventListener("change", applyFilters)
  document.getElementById("minPrice").addEventListener("input", debounce(applyFilters, 500))
  document.getElementById("maxPrice").addEventListener("input", debounce(applyFilters, 500))
  document.getElementById("sortBy").addEventListener("change", applyFilters)

  document.getElementById("searchInput").addEventListener("keypress", (e) => {
    if (e.key === "Enter") performSearch()
  })
}

// ✅ Load items from API or fallback
async function loadItems(filters = {}) {
  const grid = document.getElementById("itemsGrid")
  const resultsCount = document.getElementById("resultsCount")

  grid.innerHTML = '<div class="loading"><div class="spinner"></div></div>'
  resultsCount.textContent = "Loading items..."

  try {
    const params = new URLSearchParams(filters).toString()
    const response = await fetch(`${API_BASE}/items?${params}`)

    if (response.ok) {
      allItems = await response.json()
      filteredItems = [...allItems]
      applyFilters()
    } else {
      throw new Error("Failed to load items")
    }
  } catch (error) {
    console.error("Load items error:", error)
    showSampleItemsForBrowsing()
  }
}

// ✅ Fallback sample items
function showSampleItemsForBrowsing() {
  allItems = [
    {
      _id: "1",
      title: "Professional DSLR Camera",
      description: "High-quality camera perfect for photography",
      category: "Electronics",
      pricePerDay: 25,
      images: ["/professional-camera.png"],
      location: { city: "New York", state: "NY" },
      condition: "Like New",
      createdAt: new Date().toISOString(),
    },
    {
      _id: "2",
      title: "Camping Tent",
      description: "4-person waterproof camping tent",
      category: "Sports",
      pricePerDay: 18,
      images: ["/camping-tent.png"],
      location: { city: "Phoenix", state: "AZ" },
      condition: "Good",
      createdAt: new Date().toISOString(),
    },
    {
      _id: "3",
      title: "HD Projector",
      description: "High-definition projector for movies",
      category: "Electronics",
      pricePerDay: 35,
      images: ["/hd-projector.png"],
      location: { city: "Philadelphia", state: "PA" },
      condition: "Like New",
      createdAt: new Date().toISOString(),
    },
  ]

  filteredItems = [...allItems]
  applyFilters()
}

// ✅ Apply filters and sorting
function applyFilters() {
  const category = document.getElementById("categoryFilter").value
  const minPrice = Number(document.getElementById("minPrice").value) || 0
  const maxPrice = Number(document.getElementById("maxPrice").value) || Infinity
  const sortBy = document.getElementById("sortBy").value
  const searchTerm = document.getElementById("searchInput").value.toLowerCase()

  filteredItems = allItems.filter((item) => {
    const matchesCategory = !category || item.category === category
    const matchesPrice = item.pricePerDay >= minPrice && item.pricePerDay <= maxPrice
    const matchesSearch =
      !searchTerm ||
      item.title.toLowerCase().includes(searchTerm) ||
      item.description.toLowerCase().includes(searchTerm)

    return matchesCategory && matchesPrice && matchesSearch
  })

  switch (sortBy) {
    case "price-low":
      filteredItems.sort((a, b) => a.pricePerDay - b.pricePerDay)
      break
    case "price-high":
      filteredItems.sort((a, b) => b.pricePerDay - a.pricePerDay)
      break
    case "newest":
    default:
      filteredItems.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      break
  }

  currentPage = 1
  renderItems()
  updateResultsCount()
  renderPagination()
}

// ✅ Render items
function renderItems() {
  const grid = document.getElementById("itemsGrid")
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const itemsToShow = filteredItems.slice(startIndex, endIndex)

  if (itemsToShow.length === 0) {
    grid.innerHTML = `<p>No items found.</p>`
    return
  }

  grid.innerHTML = itemsToShow
    .map(
      (item) => `
        <div class="item-card" onclick="viewItem('${item._id}')">
          <img src="${item.images[0] || "/rental-item.png"}" alt="${item.title}" />
          <h3>${item.title}</h3>
          <p>${item.category} • ₹${item.pricePerDay}/day</p>
          <small>${item.location.city}, ${item.location.state}</small>
        </div>
      `
    )
    .join("")
}

// ✅ Update results count
function updateResultsCount() {
  const resultsCount = document.getElementById("resultsCount")
  const total = filteredItems.length
  const startIndex = (currentPage - 1) * itemsPerPage + 1
  const endIndex = Math.min(currentPage * itemsPerPage, total)

  if (total === 0) {
    resultsCount.textContent = "No items found"
  } else {
    resultsCount.textContent = `Showing ${startIndex}-${endIndex} of ${total} items`
  }
}

// ✅ Pagination
function renderPagination() {
  const pagination = document.getElementById("pagination")
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage)
  if (totalPages <= 1) {
    pagination.innerHTML = ""
    return
  }

  let html = ""
  if (currentPage > 1) {
    html += `<button onclick="changePage(${currentPage - 1})">Previous</button>`
  }
  for (let i = 1; i <= totalPages; i++) {
    html += `<button class="${i === currentPage ? "active" : ""}" onclick="changePage(${i})">${i}</button>`
  }
  if (currentPage < totalPages) {
    html += `<button onclick="changePage(${currentPage + 1})">Next</button>`
  }
  pagination.innerHTML = html
}

function changePage(page) {
  currentPage = page
  renderItems()
  updateResultsCount()
  renderPagination()
  document.querySelector(".items-listing").scrollIntoView({ behavior: "smooth" })
}

// ✅ Search + Filters
function performSearch() {
  applyFilters()
}
function clearFilters() {
  document.getElementById("categoryFilter").value = ""
  document.getElementById("minPrice").value = ""
  document.getElementById("maxPrice").value = ""
  document.getElementById("sortBy").value = "newest"
  document.getElementById("searchInput").value = ""
  applyFilters()
}

// ✅ Utility: debounce
function debounce(func, wait) {
  let timeout
  return (...args) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}
