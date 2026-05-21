import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query, toApiRecord } from '../config/db.js';

const signToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });
const publicUser = (user) => ({ id: user._id, name: user.name, email: user.email, role: user.role });

export async function register(req, res) {
  const { name, email, password } = req.body;
  const exists = await query('SELECT id FROM users WHERE email = $1', [email]);
  if (exists.rows.length) return res.status(409).json({ message: 'Email already registered' });

  const hashedPassword = await bcrypt.hash(password, 12);
  const result = await query(
    `INSERT INTO users (name, email, password, role)
     VALUES ($1, $2, $3, $4)
     RETURNING id, name, email, role`,
    [name, email, hashedPassword, 'customer']
  );
  const user = toApiRecord(result.rows[0]);
  res.status(201).json({ token: signToken(user._id), user: publicUser(user) });
}

export async function login(req, res) {
  const { email, password } = req.body;
  const result = await query('SELECT * FROM users WHERE email = $1', [email]);
  const userRow = result.rows[0];
  if (!userRow || !(await bcrypt.compare(password, userRow.password))) {
    return res.status(401).json({ message: 'Invalid email or password' });
  }

  const user = toApiRecord(userRow);
  res.json({ token: signToken(user._id), user: publicUser(user) });
}

export async function profile(req, res) {
  res.json(req.user);
}
