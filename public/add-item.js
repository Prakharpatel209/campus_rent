const API_BASE = "http://localhost:5000/api";

document.getElementById("addItemForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const token = localStorage.getItem("token");
  if (!token) {
    alert("Please login as a seller to add items.");
    return;
  }

  const itemData = {
    title: document.getElementById("title").value,
    description: document.getElementById("description").value,
    category: document.getElementById("category").value,
    pricePerDay: document.getElementById("pricePerDay").value,
    location: {
      city: document.getElementById("city").value,
      state: document.getElementById("state").value,
    },
    condition: document.getElementById("condition").value,
    deposit: document.getElementById("deposit").value,
  };

  try {
    const res = await fetch(`${API_BASE}/items/add`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(itemData),
    });

    const data = await res.json();
    if (res.ok) {
      document.getElementById("message").innerText = "✅ Item added successfully!";
      document.getElementById("addItemForm").reset();
    } else {
      document.getElementById("message").innerText = data.message || "Failed to add item.";
    }
  } catch (err) {
    console.error("Error adding item:", err);
    document.getElementById("message").innerText = "Network error, please try again.";
  }
});
