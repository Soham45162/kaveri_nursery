import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import authRoutes from './routes/auth.js';
import plantRoutes from './routes/plants.js';
import projectRoutes from './routes/projects.js';
import reviewRoutes from './routes/reviews.js';
import billRoutes from './routes/bills.js';
import labourRoutes from './routes/labours.js';
import labourLedgerRoutes from './routes/labourLedger.js';
import statRoutes from './routes/stats.js';
import settingRoutes from './routes/settings.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(morgan('dev'));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/plants', plantRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/bills', billRoutes);
app.use('/api/labours', labourRoutes);
app.use('/api', labourLedgerRoutes); // /api/attendance, /api/payments, /api/advances
app.use('/api/stats', statRoutes);
app.use('/api/settings', settingRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString(), database: 'PostgreSQL 18' });
});

// Root handler
app.get('/', (req, res) => {
  res.send('Kaveri Nursery & Garden Centre - PostgreSQL Backend API');
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled API Error:', err);
  res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
});

async function initDatabase() {
  try {
    const { query } = await import('./config/db.js');
    const fs = (await import('fs')).default;
    const schemaPath = path.resolve(__dirname, '../../database/schema.sql');

    if (fs.existsSync(schemaPath)) {
      // Safely preserve legacy tables by renaming to old_<name> if columns differ
      const legacyTables = ['plants', 'gallery', 'reviews', 'orders', 'contacts', 'newsletters'];
      for (const tbl of legacyTables) {
        const checkTbl = await query(`
          SELECT column_name FROM information_schema.columns 
          WHERE table_schema = 'public' AND table_name = $1
        `, [tbl]);

        if (checkTbl.rows.length > 0) {
          const cols = checkTbl.rows.map(r => r.column_name);
          const isOld = (tbl === 'plants' && !cols.includes('image_data')) ||
                        (tbl === 'reviews' && !cols.includes('avatar_data')) ||
                        (tbl === 'gallery') || (tbl === 'orders') || (tbl === 'contacts') || (tbl === 'newsletters');

          if (isOld) {
            const oldName = `old_${tbl}`;
            console.log(`[InitDB] Preserving legacy table '${tbl}' as '${oldName}'...`);
            await query(`DROP TABLE IF EXISTS "${oldName}" CASCADE;`);
            await query(`ALTER TABLE "${tbl}" RENAME TO "${oldName}";`);
          }
        }
      }

      const schemaSql = fs.readFileSync(schemaPath, 'utf8');
      await query(schemaSql);
      console.log('[InitDB] PostgreSQL schema verified and applied successfully.');
    }
  } catch (err) {
    console.warn('[InitDB] Notice:', err.message);
  }
}

async function bootstrapAdmin() {
  try {
    const { query } = await import('./config/db.js');
    const bcrypt = (await import('bcryptjs')).default;
    const adminEmail = (process.env.ADMIN_EMAIL || 'sohamkedar02@gmail.com').toLowerCase().trim();
    const adminPassword = process.env.ADMIN_PASSWORD;

    // 1. Ensure password_hash column exists on users table (safe non-destructive DDL)
    await query('ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255)');

    // 2. If legacy password column exists, backfill password_hash
    await query(`
      DO $$
      BEGIN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'password') THEN
          UPDATE users SET password_hash = password WHERE password_hash IS NULL AND password IS NOT NULL;
        END IF;
      END $$;
    `);

    if (!adminPassword) {
      console.log(`[Bootstrap] Notice: ADMIN_PASSWORD is not set in environment. Skipping password synchronization for ${adminEmail}.`);
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(adminPassword, salt);

    const checkUser = await query('SELECT id, email, password_hash, role FROM users WHERE LOWER(TRIM(email)) = $1', [adminEmail]);

    if (checkUser.rows.length === 0) {
      await query(`
        INSERT INTO users (email, password_hash, name, role)
        VALUES ($1, $2, 'Ramnath Kedar (Owner)', 'admin')
        ON CONFLICT (email) 
        DO UPDATE SET role = 'admin', name = 'Ramnath Kedar (Owner)', password_hash = EXCLUDED.password_hash;
      `, [adminEmail, passwordHash]);
      console.log(`[Bootstrap] Admin account (${adminEmail}) created with configured ADMIN_PASSWORD.`);
    } else {
      await query(`
        UPDATE users 
        SET password_hash = $1, role = 'admin', name = COALESCE(name, 'Ramnath Kedar (Owner)')
        WHERE LOWER(TRIM(email)) = $2
      `, [passwordHash, adminEmail]);
      console.log(`[Bootstrap] Admin account (${adminEmail}) password synchronized successfully.`);
    }
  } catch (err) {
    console.warn('[Bootstrap] Notice:', err.message);
  }
}

app.listen(PORT, '0.0.0.0', async () => {
  console.log(`\n======================================================`);
  console.log(`  Kaveri Nursery API Server Running on Port ${PORT}`);
  console.log(`  Database: PostgreSQL 18 (kaveri_nursery)`);
  console.log(`  Health check: http://localhost:${PORT}/api/health`);
  console.log(`======================================================\n`);
  await initDatabase();
  await bootstrapAdmin();
});
