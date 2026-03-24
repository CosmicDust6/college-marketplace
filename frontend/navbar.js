// ✅ navbar.js — dynamically update navbar for Buyer or Seller
document.addEventListener("DOMContentLoaded", () => {
  const navbar = document.querySelector(".navbar");
  if (!navbar) return;

  // Hide navbar on login page
  const path = window.location.pathname;
  if (path.includes("login.html")) {
    navbar.style.display = "none";
    return;
  }

  const role = localStorage.getItem("role");
  const navLinks = document.querySelectorAll(".nav-links li a");

  navLinks.forEach(link => {
    const href = link.getAttribute("href");

    // 🔹 Buyer view
    if (role === "Buyer") {
      if (href.includes("sold.html") || href.includes("addproduct.html")) {
        link.parentElement.style.display = "none";
      }
    }

    // 🔹 Seller view
    else if (role === "Seller") {
      if (href.includes("orders.html")) {
        link.parentElement.style.display = "none";
      }
      if (href.includes("addproduct.html")) {
        link.innerHTML = '<i class="fa-solid fa-cart-plus"></i> Add Product';
      }
    }

    // 🔹 Not logged in
    else {
      if (!href.includes("login.html")) {
        link.parentElement.style.display = "none";
      }
    }
  });
});