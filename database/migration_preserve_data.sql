-- Safe migration script to fix profiles table while preserving data
-- This script should be run in your Supabase SQL editor

-- Step 1: Create a backup of existing data
CREATE TABLE IF NOT EXISTS profiles_backup AS SELECT * FROM profiles;
CREATE TABLE IF NOT EXISTS customers_backup AS SELECT * FROM customers;
CREATE TABLE IF NOT EXISTS shippers_backup AS SELECT * FROM shippers;

-- Step 2: Create a new profiles table with correct structure
CREATE TABLE IF NOT EXISTS profiles_new (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    phone TEXT,
    role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'shipper', 'admin', 'superadmin')),
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 3: Migrate existing profiles data
-- Note: This assumes existing profiles have matching auth.users records
-- You may need to manually create profiles for users who don't have them
INSERT INTO profiles_new (id, full_name, phone, role, is_verified, created_at, updated_at)
SELECT 
    p.id,
    p.full_name,
    p.phone,
    p.role,
    p.is_verified,
    p.created_at,
    p.updated_at
FROM profiles p
WHERE EXISTS (SELECT 1 FROM auth.users u WHERE u.id = p.id);

-- Step 4: Create new customers table
CREATE TABLE IF NOT EXISTS customers_new (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles_new(id) ON DELETE CASCADE,
    company_name VARCHAR(255) NOT NULL,
    contact_name VARCHAR(255) NOT NULL,
    contact_email VARCHAR(255) NOT NULL,
    contact_phone VARCHAR(50),
    address_line1 TEXT,
    address_line2 TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(100),
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Step 5: Migrate customers data
INSERT INTO customers_new (id, user_id, company_name, contact_name, contact_email, contact_phone, address_line1, address_line2, city, state, postal_code, country, status, created_at, updated_at)
SELECT 
    c.id,
    c.user_id,
    c.company_name,
    c.contact_name,
    c.contact_email,
    c.contact_phone,
    c.address_line1,
    c.address_line2,
    c.city,
    c.state,
    c.postal_code,
    c.country,
    c.status,
    c.created_at,
    c.updated_at
FROM customers c
WHERE EXISTS (SELECT 1 FROM profiles_new p WHERE p.id = c.user_id);

-- Step 6: Create new shippers table
CREATE TABLE IF NOT EXISTS shippers_new (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles_new(id) ON DELETE CASCADE,
    company_name VARCHAR(255) NOT NULL,
    contact_name VARCHAR(255) NOT NULL,
    contact_email VARCHAR(255) NOT NULL,
    contact_phone VARCHAR(50),
    address_line1 TEXT,
    address_line2 TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100),
    license_number VARCHAR(100),
    status VARCHAR(50) DEFAULT 'pending_verification' CHECK (status IN ('pending_verification', 'verified', 'suspended', 'inactive')),
    modes_supported TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Step 7: Migrate shippers data
INSERT INTO shippers_new (id, user_id, company_name, contact_name, contact_email, contact_phone, address_line1, address_line2, city, state, country, license_number, status, modes_supported, created_at, updated_at)
SELECT 
    s.id,
    s.user_id,
    s.company_name,
    s.contact_name,
    s.contact_email,
    s.contact_phone,
    s.address_line1,
    s.address_line2,
    s.city,
    s.state,
    s.country,
    s.license_number,
    s.status,
    s.modes_supported,
    s.created_at,
    s.updated_at
FROM shippers s
WHERE EXISTS (SELECT 1 FROM profiles_new p WHERE p.id = s.user_id);

-- Step 8: Update shipment_requests to reference new customer IDs
-- First, create a mapping table
CREATE TEMP TABLE customer_id_mapping AS
SELECT 
    c_old.id as old_id,
    c_new.id as new_id
FROM customers c_old
JOIN customers_new c_new ON c_old.user_id = c_new.user_id;

-- Update shipment_requests
UPDATE shipment_requests 
SET customer_id = cm.new_id
FROM customer_id_mapping cm
WHERE shipment_requests.customer_id = cm.old_id;

-- Step 9: Update quotations to reference new shipper IDs
CREATE TEMP TABLE shipper_id_mapping AS
SELECT 
    s_old.id as old_id,
    s_new.id as new_id
FROM shippers s_old
JOIN shippers_new s_new ON s_old.user_id = s_new.user_id;

UPDATE quotations 
SET shipper_id = sm.new_id
FROM shipper_id_mapping sm
WHERE quotations.shipper_id = sm.old_id;

-- Step 10: Drop old tables and rename new ones
DROP TABLE IF EXISTS customers CASCADE;
DROP TABLE IF EXISTS shippers CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

ALTER TABLE profiles_new RENAME TO profiles;
ALTER TABLE customers_new RENAME TO customers;
ALTER TABLE shippers_new RENAME TO shippers;

-- Step 11: Recreate indexes and policies
CREATE INDEX IF NOT EXISTS idx_customers_user_id ON customers(user_id);
CREATE INDEX IF NOT EXISTS idx_shippers_user_id ON shippers(user_id);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE shippers ENABLE ROW LEVEL SECURITY;

-- Recreate policies
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can view all profiles" ON profiles FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() AND role IN ('admin', 'superadmin')
    )
);

CREATE POLICY "Users can view own customer profile" ON customers FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can update own customer profile" ON customers FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can insert own customer profile" ON customers FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Admins can view all customers" ON customers FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() AND role IN ('admin', 'superadmin')
    )
);

CREATE POLICY "Users can view own shipper profile" ON shippers FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can update own shipper profile" ON shippers FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can insert own shipper profile" ON shippers FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Admins can view all shippers" ON shippers FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() AND role IN ('admin', 'superadmin')
    )
);

-- Clean up backup tables (optional - comment out if you want to keep backups)
-- DROP TABLE IF EXISTS profiles_backup;
-- DROP TABLE IF EXISTS customers_backup;
-- DROP TABLE IF EXISTS shippers_backup;

