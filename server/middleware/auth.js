import jwt from 'jsonwebtoken';
import { query, toApiRecord } from '../config/db.js';

export async function protect(req, res, next) {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    const token = header.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const result = await query('SELECT id, name, email, role, phone, address, created_at, updated_at FROM users WHERE id = $1', [decoded.id]);
    if (!result.rows.length) return res.status(401).json({ message: 'User not found' });

    req.user = toApiRecord(result.rows[0]);
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid or expired token' });
  }
}

export function adminOnly(req, res, next) {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
}
