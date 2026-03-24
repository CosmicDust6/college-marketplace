require("dotenv").config(); // ✅ Load env variables

const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();

// ✅ Middleware
app.use(cors());
app.use(express.json());

// ✅ Serve uploaded images
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ✅ Routes
const userRoutes = require("./routes/users");
const productRoutes = require("./routes/products");
const orderRoutes = require("./routes/orders");

// Use routes
app.use("/api/users", userRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);

// ✅ Test route
app.get("/", (req, res) => {
  res.send("🚀 College Marketplace Backend Running");
});

// ✅ Start server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});