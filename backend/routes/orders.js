const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const authenticateToken = require('../middleware/auth');

// ✅ Place a new order (when buyer clicks Buy Now)
router.post('/add', authenticateToken, async (req, res) => {
  try {
    const buyer_id = req.user.id;
    const { product_id, seller_id } = req.body;

    if (!product_id || !seller_id) {
      return res.status(400).json({ error: 'Product ID and Seller ID are required.' });
    }

    await pool.query(
      'INSERT INTO orders (buyer_id, product_id, seller_id, status) VALUES (?, ?, ?, ?)',
      [buyer_id, product_id, seller_id, 'Pending']
    );

    res.status(201).json({ message: '✅ Order placed successfully!' });
  } catch (err) {
    console.error('❌ ORDER ERROR:', err.message);
    res.status(500).json({ error: 'Server error while placing order.' });
  }
});

// ✅ View all orders placed by the logged-in buyer
router.get('/', authenticateToken, async (req, res) => {
  try {
    const buyer_id = req.user.id;
    const [orders] = await pool.query(
      `SELECT o.id, p.name AS product_name, p.price, p.pickup_point, 
              o.status, o.order_date, u.name AS seller_name
       FROM orders o
       JOIN products p ON o.product_id = p.id
       JOIN users u ON o.seller_id = u.id
       WHERE o.buyer_id = ?
       ORDER BY o.order_date DESC`,
      [buyer_id]
    );

    res.json(orders);
  } catch (err) {
    console.error('❌ FETCH ORDERS ERROR:', err.message);
    res.status(500).json({ error: 'Server error fetching orders.' });
  }
});

// ✅ View all items sold by the logged-in seller
router.get('/sold', authenticateToken, async (req, res) => {
  try {
    const seller_id = req.user.id;
    const [sales] = await pool.query(
      `SELECT o.id, p.name AS product_name, p.price, o.status, o.order_date, u.name AS buyer_name
       FROM orders o
       JOIN products p ON o.product_id = p.id
       JOIN users u ON o.buyer_id = u.id
       WHERE o.seller_id = ?
       ORDER BY o.order_date DESC`,
      [seller_id]
    );

    res.json(sales);
  } catch (err) {
    console.error('❌ FETCH SOLD ITEMS ERROR:', err.message);
    res.status(500).json({ error: 'Server error fetching sold items.' });
  }
});

// ✅ Update order status (Seller confirms delivery)
// ✅ Update order status + mark product as sold
router.put('/update-status/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const seller_id = req.user.id;

    // 1️⃣ Get order info
    const [order] = await pool.query(
      'SELECT product_id FROM orders WHERE id = ? AND seller_id = ?',
      [id, seller_id]
    );

    if (order.length === 0)
      return res.status(403).json({ error: 'Unauthorized or order not found.' });

    const productId = order[0].product_id;

    // 2️⃣ Update both order + product status
    await pool.query('UPDATE orders SET status = "Delivered" WHERE id = ?', [id]);
    await pool.query('UPDATE products SET status = "Sold" WHERE id = ?', [productId]);

    res.json({ message: '✅ Order marked as Delivered and Product marked as Sold!' });
  } catch (err) {
    console.error('❌ Error updating order/product:', err.message);
    res.status(500).json({ error: 'Server error updating order and product.' });
  }
});
// ✅ Fetch all orders received by the logged-in seller
router.get('/received', authenticateToken, async (req, res) => {
  try {
    const sellerId = req.user.id;

    const [rows] = await pool.query(
      `SELECT o.id, p.name AS product_name, p.price, p.pickup_point, o.status,
              o.order_date, u.name AS buyer_name
       FROM orders o
       JOIN products p ON o.product_id = p.id
       JOIN users u ON o.buyer_id = u.id
       WHERE o.seller_id = ?
       ORDER BY o.order_date DESC`,
      [sellerId]
    );

    res.json(rows);
  } catch (err) {
    console.error("❌ ERROR FETCHING RECEIVED ORDERS:", err);
    res.status(500).json({ error: "Server error while fetching received orders." });
  }
});


// ✅ Mark an order as Dispatched (Seller updates order status)
router.put('/mark-dispatched/:id', authenticateToken, async (req, res) => {
  try {
    const orderId = req.params.id;
    const sellerId = req.user.id;

    const [result] = await pool.query(
      `UPDATE orders 
       SET status = 'Dispatched' 
       WHERE id = ? AND seller_id = ?`,
      [orderId, sellerId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Order not found or unauthorized." });
    }

    res.json({ message: "✅ Order marked as Dispatched successfully!" });
  } catch (err) {
    console.error("❌ ERROR MARKING ORDER AS DISPATCHED:", err);
    res.status(500).json({ error: "Server error while updating order status." });
  }
});

module.exports = router;
