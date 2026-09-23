-- ============================================================================
-- Kaveri Nursery & Garden Centre - PostgreSQL Database Schema (Pure PostgreSQL)
-- Stores all data and binary media files in PostgreSQL. ZERO Firebase dependencies.
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ----------------------------------------------------------------------------
-- 1. USERS
-- Stores customer profiles and administrator privileges.
-- Securely hashes passwords using bcrypt (stored in password_hash).
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL DEFAULT 'User',
    role VARCHAR(50) NOT NULL DEFAULT 'customer' CHECK (role IN ('admin', 'customer')),
    phone VARCHAR(50),
    address TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- ----------------------------------------------------------------------------
-- 2. PLANTS
-- Inventory of nursery plants, pricing, stock, and botanical care guide.
-- Binary images stored in image_data BYTEA.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS plants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    scientific_name VARCHAR(255) DEFAULT 'Add scientific name',
    category VARCHAR(100) NOT NULL DEFAULT 'Indoor',
    price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
    stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
    discount INTEGER NOT NULL DEFAULT 0 CHECK (discount >= 0 AND discount <= 100),
    description TEXT,
    image_data BYTEA,
    image_mime_type VARCHAR(100),
    image_file_name VARCHAR(255),
    care_level VARCHAR(50) NOT NULL DEFAULT 'Easy' CHECK (care_level IN ('Easy', 'Moderate', 'Expert')),
    water_schedule VARCHAR(255),
    sunlight_req VARCHAR(255),
    fertilizer_guide TEXT,
    soil_type VARCHAR(255),
    growth_rate VARCHAR(100),
    blooming_season VARCHAR(100),
    temperature VARCHAR(100) DEFAULT '18-32°C',
    common_diseases TEXT,
    disease_treatment TEXT,
    care_tips TEXT,
    seasonal_care TEXT,
    benefits TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_plants_category ON plants(category);
CREATE INDEX IF NOT EXISTS idx_plants_care_level ON plants(care_level);
CREATE INDEX IF NOT EXISTS idx_plants_name ON plants(name);

-- ----------------------------------------------------------------------------
-- 3. PROJECTS (PAST WORK / GALLERY)
-- High-end landscaping, farm work, and garden design showcases.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL DEFAULT 'Garden Design',
    location VARCHAR(255),
    duration VARCHAR(100),
    scope TEXT NOT NULL,
    result TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_projects_category ON projects(category);

-- ----------------------------------------------------------------------------
-- 4. PROJECT_IMAGES
-- Normalized gallery photos (before, after, and additional transformation views)
-- stored as binary BYTEA.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS project_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    image_data BYTEA NOT NULL,
    mime_type VARCHAR(100) NOT NULL DEFAULT 'image/jpeg',
    file_name VARCHAR(255),
    image_type VARCHAR(50) NOT NULL DEFAULT 'additional' CHECK (image_type IN ('before', 'after', 'additional')),
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_project_images_project_id ON project_images(project_id);
CREATE INDEX IF NOT EXISTS idx_project_images_type ON project_images(project_id, image_type);

-- ----------------------------------------------------------------------------
-- 5. PROJECT_PLANTS
-- Normalized many-to-many link between projects and plants used.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS project_plants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    plant_id UUID REFERENCES plants(id) ON DELETE SET NULL,
    plant_name VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_project_plant_name UNIQUE (project_id, plant_name)
);

CREATE INDEX IF NOT EXISTS idx_project_plants_project_id ON project_plants(project_id);
CREATE INDEX IF NOT EXISTS idx_project_plants_plant_id ON project_plants(plant_id);

-- ----------------------------------------------------------------------------
-- 6. REVIEWS
-- Customer feedback, star ratings, and plant photos stored as binary BYTEA.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    text TEXT NOT NULL,
    avatar_data BYTEA,
    avatar_mime_type VARCHAR(100),
    plant_photo_data BYTEA,
    plant_photo_mime_type VARCHAR(100),
    approved BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reviews_approved ON reviews(approved);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON reviews(created_at DESC);

-- ----------------------------------------------------------------------------
-- 7. BILLS (INVOICES & QUOTATIONS)
-- Sales bills, counter receipts, and customer quotations.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS bills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bill_number VARCHAR(50) NOT NULL UNIQUE,
    type VARCHAR(50) NOT NULL CHECK (type IN ('Bill', 'Quotation')),
    customer_name VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(50),
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    total NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (total >= 0),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bills_bill_number ON bills(bill_number);
CREATE INDEX IF NOT EXISTS idx_bills_date ON bills(date);
CREATE INDEX IF NOT EXISTS idx_bills_type_date ON bills(type, date);

-- ----------------------------------------------------------------------------
-- 8. BILL_ITEMS
-- Normalized line items for each bill or quotation.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS bill_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bill_id UUID NOT NULL REFERENCES bills(id) ON DELETE CASCADE,
    plant_id UUID REFERENCES plants(id) ON DELETE SET NULL,
    plant_name VARCHAR(255) NOT NULL,
    qty NUMERIC(10, 2) NOT NULL DEFAULT 1 CHECK (qty > 0),
    rate NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (rate >= 0),
    line_total NUMERIC(12, 2) GENERATED ALWAYS AS (qty * rate) STORED,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bill_items_bill_id ON bill_items(bill_id);
CREATE INDEX IF NOT EXISTS idx_bill_items_plant_id ON bill_items(plant_id);

-- ----------------------------------------------------------------------------
-- 9. LABOURS (WORKER DIRECTORY)
-- Master profile for nursery workers with wage structure and photo BYTEA.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS labours (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    skill_type VARCHAR(100) NOT NULL DEFAULT 'Gardener',
    phone VARCHAR(20) NOT NULL,
    address TEXT,
    joining_date DATE NOT NULL DEFAULT CURRENT_DATE,
    salary_type VARCHAR(50) NOT NULL DEFAULT 'daily' CHECK (salary_type IN ('daily', 'monthly')),
    salary_rate NUMERIC(10, 2) NOT NULL CHECK (salary_rate >= 0),
    photo_data BYTEA,
    photo_mime_type VARCHAR(100),
    photo_file_name VARCHAR(255),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_labours_is_active ON labours(is_active);
CREATE INDEX IF NOT EXISTS idx_labours_skill_type ON labours(skill_type);

-- ----------------------------------------------------------------------------
-- 10. LABOUR_WAGE_HISTORY
-- Audit trail of wage revisions per worker.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS labour_wage_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    labour_id UUID NOT NULL REFERENCES labours(id) ON DELETE CASCADE,
    effective_date DATE NOT NULL DEFAULT CURRENT_DATE,
    rate NUMERIC(10, 2) NOT NULL CHECK (rate >= 0),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_labour_wage_history_labour_id ON labour_wage_history(labour_id, effective_date DESC);

-- ----------------------------------------------------------------------------
-- 11. LABOUR_ATTENDANCE
-- Normalized daily attendance logs per worker.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS labour_attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    labour_id UUID NOT NULL REFERENCES labours(id) ON DELETE CASCADE,
    attendance_date DATE NOT NULL,
    status VARCHAR(50) NOT NULL CHECK (status IN ('P', 'A', 'HD', 'Full', 'Half', 'Present', 'Absent', 'HalfDay', 'Custom')),
    custom_amount NUMERIC(10, 2) CHECK (custom_amount IS NULL OR custom_amount >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_labour_attendance_date UNIQUE (labour_id, attendance_date)
);

CREATE INDEX IF NOT EXISTS idx_labour_attendance_lookup ON labour_attendance(labour_id, attendance_date);
CREATE INDEX IF NOT EXISTS idx_labour_attendance_date_range ON labour_attendance(attendance_date);

-- ----------------------------------------------------------------------------
-- 12. LABOUR_PAYMENTS
-- Monthly salary disbursements and payments to workers.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS labour_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    labour_id UUID NOT NULL REFERENCES labours(id) ON DELETE CASCADE,
    payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    amount NUMERIC(10, 2) NOT NULL CHECK (amount > 0),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_labour_payments_labour_id ON labour_payments(labour_id, payment_date);
CREATE INDEX IF NOT EXISTS idx_labour_payments_date ON labour_payments(payment_date);

-- ----------------------------------------------------------------------------
-- 13. LABOUR_ADVANCES
-- Petty advances and salary advance loans given to workers.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS labour_advances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    labour_id UUID NOT NULL REFERENCES labours(id) ON DELETE CASCADE,
    advance_date DATE NOT NULL DEFAULT CURRENT_DATE,
    amount NUMERIC(10, 2) NOT NULL CHECK (amount > 0),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_labour_advances_labour_id ON labour_advances(labour_id, advance_date);
CREATE INDEX IF NOT EXISTS idx_labour_advances_date ON labour_advances(advance_date);

-- ----------------------------------------------------------------------------
-- 14. SITE_STATS
-- High-level counter aggregates (e.g. total website visitors).
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS site_stats (
    key VARCHAR(100) PRIMARY KEY,
    value BIGINT NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 15. APP_SETTINGS
-- Global application preferences and billing letterhead binary BYTEA storage.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS app_settings (
    key VARCHAR(100) PRIMARY KEY,
    value JSONB NOT NULL DEFAULT '{}'::jsonb,
    letterhead_data BYTEA,
    letterhead_mime_type VARCHAR(100),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
