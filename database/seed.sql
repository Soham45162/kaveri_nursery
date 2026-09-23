-- ============================================================================
-- Kaveri Nursery & Garden Centre - PostgreSQL Database Seed Data
-- ============================================================================

-- 1. Initialize Site Statistics
INSERT INTO site_stats (key, value)
VALUES ('visitors', 0)
ON CONFLICT (key) DO NOTHING;

-- 2. Initialize App Settings (Billing letterhead)
INSERT INTO app_settings (key, value)
VALUES (
    'billing',
    '{"letterheadType": "digital", "customLetterheadUrl": ""}'::jsonb
)
ON CONFLICT (key) DO NOTHING;

-- 3. Bootstrap Admin User Placeholder
INSERT INTO users (email, name, role)
VALUES ('sohamkedar02@gmail.com', 'Ramnath Kedar (Owner)', 'admin')
ON CONFLICT (email) DO NOTHING;
