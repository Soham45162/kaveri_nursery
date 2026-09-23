import pg from 'pg';
import bcrypt from 'bcryptjs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const { Client } = pg;

async function seedDatabase() {
  const dbName = process.env.DB_NAME || 'kaveri_nursery';
  const user = process.env.DB_USER || 'postgres';
  const password = process.env.DB_PASSWORD || 'postgres';
  const host = process.env.DB_HOST || 'localhost';
  const port = parseInt(process.env.DB_PORT || '5432', 10);

  const client = new Client({ host, port, user, password, database: dbName });

  try {
    await client.connect();
    console.log(`Connected to '${dbName}' for seeding...`);

    // 1. Seed Site Stats
    await client.query(`
      INSERT INTO site_stats (key, value)
      VALUES ('visitors', 0)
      ON CONFLICT (key) DO NOTHING;
    `);
    console.log('Seeded site_stats.');

    // 2. Seed App Settings (billing)
    await client.query(`
      INSERT INTO app_settings (key, value)
      VALUES ('billing', '{"letterheadType": "digital", "customLetterheadUrl": ""}'::jsonb)
      ON CONFLICT (key) DO NOTHING;
    `);
    console.log('Seeded app_settings.');

    // 3. Seed Default Admin User from environment
    const adminEmail = (process.env.ADMIN_EMAIL || 'sohamkedar02@gmail.com').toLowerCase().trim();
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminPassword) {
      console.warn('⚠️  ADMIN_PASSWORD is not set in environment. Skipping admin password creation.');
    } else {
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(adminPassword, salt);

      await client.query(`
        INSERT INTO users (email, password_hash, name, role)
        VALUES ($1, $2, $3, 'admin')
        ON CONFLICT (email) 
        DO UPDATE SET role = 'admin', name = 'Ramnath Kedar (Owner)', password_hash = EXCLUDED.password_hash;
      `, [adminEmail, passwordHash, 'Ramnath Kedar (Owner)']);
      console.log(`Seeded/updated admin user account (${adminEmail}).`);
    }

    console.log('Database seeding completed successfully!');
  } catch (err) {
    console.error('Seeding failed:', err);
  } finally {
    await client.end();
  }
}

seedDatabase();
