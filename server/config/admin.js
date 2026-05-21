import bcrypt from 'bcryptjs';
import { query } from './db.js';

export default async function ensureAdmin() {
  const name = process.env.ADMIN_NAME || 'Soham Kedar';
  const email = process.env.ADMIN_EMAIL || 'sohamkedar02@gmail.com';
  const password = process.env.ADMIN_PASSWORD || 'Soham@123';

  if (!email || !password) {
    console.warn('ADMIN_EMAIL or ADMIN_PASSWORD is missing. Skipping automatic admin setup.');
    return;
  }

  const hashedPassword = await bcrypt.hash(password, 12);
  await query(
    `INSERT INTO users (name, email, password, role)
     VALUES ($1, $2, $3, 'admin')
     ON CONFLICT (email)
     DO UPDATE SET name = EXCLUDED.name, password = EXCLUDED.password, role = 'admin', updated_at = NOW()`,
    [name, email, hashedPassword]
  );

  console.log(`Admin account ready: ${email}`);
}
