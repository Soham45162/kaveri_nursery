import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB, { pool, query } from '../config/db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function resetAdmin() {
  await connectDB();
  const hashedPassword = await bcrypt.hash('Soham@123', 12);
  await query(
    `INSERT INTO users (name, email, password, role)
     VALUES ($1, $2, $3, 'admin')
     ON CONFLICT (email)
     DO UPDATE SET password = EXCLUDED.password, role = 'admin', updated_at = NOW()`,
    ['Soham Kedar', 'sohamkedar02@gmail.com', hashedPassword]
  );
  console.log('Admin login updated');
  await pool.end();
}

resetAdmin().catch(async (error) => {
  console.error(error);
  await pool.end();
  process.exit(1);
});
