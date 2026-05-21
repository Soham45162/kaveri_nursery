import dotenv from 'dotenv';
import path from 'path';
import pg from 'pg';
import { fileURLToPath } from 'url';

const { Pool } = pg;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

dotenv.config({ path: path.resolve(__dirname, '../.env') });

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false
});

export const query = (text, params) => pool.query(text, params);

export function toApiRecord(row = {}) {
  return Object.fromEntries(
    Object.entries(row).map(([key, value]) => {
      const camel = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
      return [camel === 'id' ? '_id' : camel, value];
    })
  );
}

export function toApiRecords(rows = []) {
  return rows.map(toApiRecord);
}

async function createTables() {
  await query('CREATE EXTENSION IF NOT EXISTS pgcrypto');

  await query(`
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('admin', 'customer')),
      phone TEXT,
      address TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS plants (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL,
      scientific_name TEXT NOT NULL,
      category TEXT NOT NULL,
      price NUMERIC(10, 2) NOT NULL DEFAULT 0,
      stock INTEGER NOT NULL DEFAULT 0,
      discount NUMERIC(5, 2) NOT NULL DEFAULT 0,
      image TEXT NOT NULL,
      gallery JSONB NOT NULL DEFAULT '[]',
      description TEXT NOT NULL,
      water TEXT,
      sunlight TEXT,
      soil TEXT,
      temperature TEXT,
      growth_tips TEXT,
      fertilizer TEXT,
      benefits TEXT,
      diseases TEXT,
      seasonal_care TEXT,
      is_featured BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS reviews (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
      text TEXT NOT NULL,
      plant_id UUID REFERENCES plants(id) ON DELETE SET NULL,
      photos JSONB NOT NULL DEFAULT '[]',
      approved BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS orders (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      customer JSONB NOT NULL DEFAULT '{}',
      items JSONB NOT NULL DEFAULT '[]',
      total NUMERIC(10, 2) NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'packed', 'delivered', 'cancelled')),
      payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded')),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS gallery (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      title TEXT NOT NULL,
      category TEXT NOT NULL CHECK (category IN ('Landscaping', 'Garden Design', 'Farm Work', 'Nursery')),
      image TEXT NOT NULL,
      before_image TEXT,
      after_image TEXT,
      location TEXT,
      duration TEXT,
      budget TEXT,
      scope TEXT,
      plants_used JSONB NOT NULL DEFAULT '[]',
      result TEXT,
      description TEXT,
      featured BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await query('ALTER TABLE gallery ADD COLUMN IF NOT EXISTS location TEXT');
  await query('ALTER TABLE gallery ADD COLUMN IF NOT EXISTS duration TEXT');
  await query('ALTER TABLE gallery ADD COLUMN IF NOT EXISTS budget TEXT');
  await query('ALTER TABLE gallery ADD COLUMN IF NOT EXISTS scope TEXT');
  await query("ALTER TABLE gallery ADD COLUMN IF NOT EXISTS plants_used JSONB NOT NULL DEFAULT '[]'");
  await query('ALTER TABLE gallery ADD COLUMN IF NOT EXISTS result TEXT');

  await query(`
    CREATE TABLE IF NOT EXISTS contacts (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      message TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'closed')),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS newsletters (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email TEXT NOT NULL UNIQUE,
      interests JSONB NOT NULL DEFAULT '[]',
      active BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}

export default async function connectDB() {
  if (!process.env.DATABASE_URL) {
    console.warn('DATABASE_URL is not set. API will start, but database operations will fail until PostgreSQL is configured.');
    return;
  }

  try {
    const result = await query('SELECT NOW()');
    await createTables();
    console.log(`PostgreSQL connected at ${result.rows[0].now.toISOString()}`);
  } catch (error) {
    console.error(`PostgreSQL connection error: ${error.message}`);
  }
}
