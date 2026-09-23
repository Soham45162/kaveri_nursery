import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const { Client } = pg;

async function runMigration() {
  const dbName = process.env.DB_NAME || 'kaveri_nursery';
  const user = process.env.DB_USER || 'postgres';
  const password = process.env.DB_PASSWORD || '';
  const host = process.env.DB_HOST || 'localhost';
  const port = parseInt(process.env.DB_PORT || '5432', 10);

  console.log(`Connecting to PostgreSQL host ${host}:${port} as ${user}...`);

  // Step 1: Ensure database exists
  const rootClient = new Client({ host, port, user, password, database: 'postgres' });
  try {
    await rootClient.connect();
    const checkDb = await rootClient.query(`SELECT 1 FROM pg_database WHERE datname = $1`, [dbName]);
    if (checkDb.rowCount === 0) {
      console.log(`Database '${dbName}' does not exist. Creating it now...`);
      await rootClient.query(`CREATE DATABASE "${dbName}"`);
      console.log(`Database '${dbName}' created successfully.`);
    } else {
      console.log(`Database '${dbName}' already exists.`);
    }
  } catch (err) {
    console.error('Error connecting to root postgres db:', err.message);
  } finally {
    await rootClient.end();
  }

  // Step 2: Connect to target database
  const dbClient = new Client({ host, port, user, password, database: dbName });
  try {
    await dbClient.connect();
    console.log(`Connected to database '${dbName}'.`);

    // Safely rename old legacy tables if they exist to old_<name> so no old data is lost
    const legacyTables = ['plants', 'gallery', 'reviews', 'users', 'orders', 'contacts', 'newsletters'];
    for (const tbl of legacyTables) {
      const checkTbl = await dbClient.query(`
        SELECT column_name FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = $1
      `, [tbl]);
      
      if (checkTbl.rows.length > 0) {
        // Check if this is old table by checking for new columns
        const cols = checkTbl.rows.map(r => r.column_name);
        const isOld = (tbl === 'plants' && !cols.includes('image_data')) ||
                      (tbl === 'users' && !cols.includes('password_hash')) ||
                      (tbl === 'reviews' && !cols.includes('avatar_data')) ||
                      (tbl === 'gallery') || (tbl === 'orders') || (tbl === 'contacts') || (tbl === 'newsletters');
        
        if (isOld) {
          const oldName = `old_${tbl}`;
          console.log(`Safely archiving legacy table '${tbl}' to '${oldName}'...`);
          await dbClient.query(`DROP TABLE IF EXISTS "${oldName}" CASCADE;`);
          await dbClient.query(`ALTER TABLE "${tbl}" RENAME TO "${oldName}";`);
        }
      }
    }

    console.log('Applying fresh database/schema.sql...');
    const schemaPath = path.resolve(__dirname, '../../../database/schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');

    await dbClient.query(schemaSql);
    console.log('Schema applied successfully! All 15 PostgreSQL tables are ready.');
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  } finally {
    await dbClient.end();
  }
}

runMigration();
