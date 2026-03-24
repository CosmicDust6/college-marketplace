const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const authenticateToken = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Set up image storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '..', 'uploads')),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname)),
});

// File filter to allow only image file types
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);
  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'));
  }
};

const upload = multer({ storage, fileFilter });

// Add a new product (only logged-in users, with image upload)
router.post('/add', authenticateToken, upload.single('image'), async (req, res) => {
  try {
    const { name, description, price, pickup_point, contact_number } = req.body;
    if (!name || !price || !pickup_point) return res.status(400).json({ error: 'Please fill in all required fields.' });

    const seller_id = req.user.id;
    const image_path = req.file ? `uploads/${req.file.filename}` : null;

    await pool.query(
      'INSERT INTO products (seller_id, name, description, price, pickup_point, contact_number, image_path) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [seller_id, name, description, price, pickup_point, contact_number, image_path]
    );

    res.status(201).json({ message: 'Product added successfully ✅', image_path, contact_number });
  } catch (err) {
    console.error('❌ ADD PRODUCT ERROR:', err.message);
    res.status(500).json({ error: 'Server error while adding product.' });
  }
});

// Get all products
router.get('/', async (req, res) => {
  try {
    const [products] = await pool.query(
      'SELECT products.*, users.name AS seller_name FROM products JOIN users ON products.seller_id = users.id ORDER BY products.created_at DESC'
    );
    res.json(products);
  } catch (err) {
    console.error('❌ FETCH PRODUCTS ERROR:', err.message);
    res.status(500).json({ error: 'Server error fetching products.' });
  }
});

// Get products for logged-in seller
router.get('/seller', authenticateToken, async (req, res) => {
  try {
    const seller_id = req.user.id;
    const [products] = await pool.query('SELECT * FROM products WHERE seller_id = ? ORDER BY created_at DESC', [seller_id]);
    res.json(products);
  } catch (err) {
    console.error('❌ FETCH SELLER PRODUCTS ERROR:', err.message);
    res.status(500).json({ error: 'Server error fetching seller products.' });
  }
});

// Update a product (only by the seller) — accepts optional image replacement
router.put('/:id', authenticateToken, upload.single('image'), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, price, pickup_point } = req.body;
    const seller_id = req.user.id;

    const [rows] = await pool.query('SELECT * FROM products WHERE id = ? AND seller_id = ?', [id, seller_id]);
    if (rows.length === 0) return res.status(403).json({ error: 'You are not authorized to update this product.' });

    const product = rows[0];

    // If a new image was uploaded, remove the old file
    let image_path = product.image_path;
    if (req.file) {
      try {
        if (product.image_path) {
          const old = path.join(__dirname, '..', product.image_path);
          if (fs.existsSync(old)) fs.unlinkSync(old);
        }
      } catch (err) {
        console.error('Failed to delete old image file:', err.message);
      }

      image_path = `uploads/${req.file.filename}`;
    }

    // Build update
    const fields = [];
    const values = [];
    if (name !== undefined) { fields.push('name = ?'); values.push(name); }
    if (description !== undefined) { fields.push('description = ?'); values.push(description); }
    if (price !== undefined) { fields.push('price = ?'); values.push(price); }
    if (pickup_point !== undefined) { fields.push('pickup_point = ?'); values.push(pickup_point); }
    if (req.file) { fields.push('image_path = ?'); values.push(image_path); }

    if (fields.length === 0) return res.status(400).json({ error: 'No fields to update' });

    const sql = `UPDATE products SET ${fields.join(', ')} WHERE id = ?`;
    values.push(id);
    await pool.query(sql, values);

    res.json({ message: '✅ Product updated successfully!' });
  } catch (err) {
    console.error('❌ UPDATE PRODUCT ERROR:', err.message);
    res.status(500).json({ error: 'Server error updating product.' });
  }
});

// Delete a product (only by the seller) — remove image file from disk if present
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const seller_id = req.user.id;

    const [rows] = await pool.query('SELECT * FROM products WHERE id = ? AND seller_id = ?', [id, seller_id]);
    if (rows.length === 0) return res.status(403).json({ error: 'You are not authorized to delete this product.' });

    const product = rows[0];
    try {
      if (product.image_path) {
        const file = path.join(__dirname, '..', product.image_path);
        if (fs.existsSync(file)) fs.unlinkSync(file);
      }
    } catch (err) {
      console.error('Error deleting image file for product', id, err.message);
      // continue even if file deletion fails
    }

    await pool.query('DELETE FROM products WHERE id = ?', [id]);
    res.json({ message: '🗑️ Product deleted successfully!' });
  } catch (err) {
    console.error('❌ DELETE PRODUCT ERROR:', err.message);
    res.status(500).json({ error: 'Server error deleting product.' });
  }
});

module.exports = router;