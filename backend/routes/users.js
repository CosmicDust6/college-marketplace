const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const authenticateToken = require('../middleware/auth');

// ✅ REGISTER
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, roll_no, college } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required.' });
    }

    const [existing] = await pool.query(
      'SELECT * FROM users WHERE email = ?', 
      [email]
    );

    if (existing.length > 0) {
      return res.status(400).json({ error: 'User already exists.' });
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    await pool.query(
      'INSERT INTO users (name, email, password_hash, roll_no, college) VALUES (?, ?, ?, ?, ?)',
      [name, email, password_hash, roll_no, college]
    );

    res.status(201).json({ message: 'User registered successfully ✅' });

  } catch (err) {
    console.error("❌ REGISTER ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

// ✅ LOGIN
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const user = await pool.query(
      'SELECT * FROM users WHERE email = ?', 
      [email]
    );

    if (user.length === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const validPassword = await bcrypt.compare(password, user[0].password_hash);

    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid password.' });
    }

    const token = jwt.sign(
      { id: user[0].id, email: user[0].email },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.status(200).json({
      message: 'Login successful ✅',
      token,
      user: {
        id: user[0].id,
        name: user[0].name,
        email: user[0].email
      }
    });

  } catch (err) {
    console.error("❌ LOGIN ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

// ✅ PROFILE
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, name, email, roll_no, college FROM users WHERE id = ?',
      [req.user.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(rows[0]);

  } catch (err) {
    console.error('❌ PROFILE ERROR:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;