const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require('path');

const app = express();
dotenv.config();

// serve uploads folder as static so files are reachable at /uploads/...
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ✅ Middleware
app.use(cors());
app.use(express.json());

// ✅ Simple root test route
app.get("/", (req, res) => {
  res.send("🚀 College Marketplace Backend is Running");
});

// ✅ User routes
const userRoutes = require("./routes/users");
app.use("/api/users", userRoutes);

// ✅ Product routes (if created)
const productRoutes = require("./routes/products");
app.use("/api/products", productRoutes);

// ✅ Order routes
const orderRoutes = require("./routes/orders");
app.use("/api/orders", orderRoutes);

// ✅ Start server
const pool = require("./config/db");
const PORT = process.env.PORT || 5050;

pool
  .getConnection()
  .then(() => {
    console.log("✅ MySQL Connected Successfully!");
    app.listen(PORT, () =>
      console.log(`🚀 Server running on port ${PORT}`)
    );
  })
  .catch((err) =>
    console.error("❌ Database connection failed:", err.message)
  );

  app.use("/uploads", require("express").static("uploads"));