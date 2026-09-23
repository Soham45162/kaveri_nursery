# PostgreSQL Database Setup Guide - Kaveri Nursery

This guide details how to initialize, seed, configure, and connect the PostgreSQL database for Kaveri Nursery & Garden Centre.

---

## 1. Prerequisites
- PostgreSQL 14+ installed and running locally or hosted on a cloud provider (e.g. Supabase, Neon, AWS RDS).
- Node.js 18+ and `pg` package installed in backend.

---

## 2. Create the Database

Using `psql` or pgAdmin / GUI:

```sql
CREATE DATABASE kaveri_nursery;
```

Or from terminal:
```bash
createdb -U postgres kaveri_nursery
```

---

## 3. Run Schema Migration

Execute `schema.sql` to initialize all 15 normalized tables, foreign keys, check constraints, and performance indexes:

```bash
psql -U postgres -d kaveri_nursery -f database/schema.sql
```

---

## 4. Run Initial Seed Data

Populate the baseline configuration settings and initial counter metrics:

```bash
psql -U postgres -d kaveri_nursery -f database/seed.sql
```

---

## 5. Environment Configuration (`.env`)

Add the connection parameters to your server environment file (`server/.env`):

```env
PORT=5000
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/kaveri_nursery

# Or granular parameters:
PGHOST=localhost
PGPORT=5432
PGDATABASE=kaveri_nursery
PGUSER=postgres
PGPASSWORD=your_password
```

---

## 6. Connecting with Node.js / Express (`pg` pool)

Example connection pool configuration:

```javascript
import pg from 'pg';
const { Pool } = pg;

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Test connection
pool.connect()
  .then(client => {
    console.log('Successfully connected to PostgreSQL database (kaveri_nursery)');
    client.release();
  })
  .catch(err => console.error('Database connection error:', err.stack));
```

---

## 7. Verifying the Connection & Tables

Run the following query to verify all tables were created:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

Expected output (15 tables):
1. `app_settings`
2. `bill_items`
3. `bills`
4. `labour_advances`
5. `labour_attendance`
6. `labour_payments`
7. `labour_wage_history`
8. `labours`
9. `plants`
10. `project_images`
11. `project_plants`
12. `projects`
13. `reviews`
14. `site_stats`
15. `users`
