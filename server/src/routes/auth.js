import express from 'express';
import bcrypt from 'bcryptjs';
import { query } from '../config/db.js';
import { authenticateToken, generateToken } from '../middleware/auth.js';

const router = express.Router();

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { email, password, name, phone, address } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const existing = await query('SELECT id FROM users WHERE email = $1', [email.toLowerCase().trim()]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'An account with this email already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // If registering the owner email, assign admin role
    const role = email.toLowerCase().trim() === 'sohamkedar02@gmail.com' ? 'admin' : 'customer';

    const result = await query(`
      INSERT INTO users (email, password_hash, name, role, phone, address)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, email, name, role, phone, address, created_at
    `, [email.toLowerCase().trim(), passwordHash, name || 'User', role, phone || null, address || null]);

    const user = result.rows[0];
    const token = generateToken(user);

    res.status(201).json({ ok: true, token, user });
  } catch (err) {
    console.error('Error in /register:', err);
    res.status(500).json({ error: 'Server error during registration' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const result = await query('SELECT * FROM users WHERE email = $1', [normalizedEmail]);

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = result.rows[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = generateToken(user);
    res.json({
      ok: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        phone: user.phone,
        address: user.address,
        created_at: user.created_at
      }
    });
  } catch (err) {
    console.error('Error in /login:', err);
    res.status(500).json({ error: 'Server error during login' });
  }
});

// GET /api/auth/me
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const result = await query(`
      SELECT id, email, name, role, phone, address, created_at
      FROM users WHERE id = $1
    `, [req.user.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ ok: true, user: result.rows[0] });
  } catch (err) {
    console.error('Error in /me:', err);
    res.status(500).json({ error: 'Server error fetching user profile' });
  }
});

export default router;
