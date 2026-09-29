import bcrypt from 'bcryptjs';
import { pool, query } from '../config/db.js';

async function seedDatabase() {
  try {
    console.log('Seeding PostgreSQL database...');

    // 1. Seed Site Stats
    await query(`
      INSERT INTO site_stats (key, value)
      VALUES ('visitors', 0)
      ON CONFLICT (key) DO NOTHING;
    `);
    console.log('Seeded site_stats.');

    // 2. Seed App Settings (billing)
    await query(`
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

      await query(`
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
    await pool.end();
  }
}

seedDatabase();
