-- Migration script to fix profiles table foreign key constraint issue
-- This script should be run in your Supabase SQL editor

-- Step 1: Drop existing foreign key constraints that depend on profiles
ALTER TABLE customers DROP CONSTRAINT IF EXISTS customers_user_id_fkey;
ALTER TABLE shippers DROP CONSTRAINT IF EXISTS shippers_user_id_fkey;

-- Step 2: Drop the existing profiles table (this will cascade delete customers and shippers)
-- WARNING: This will delete all existing customer and shipper data!
-- Only run this if you don't have important data, or backup first
DROP TABLE IF EXISTS profiles CASCADE;

-- Step 3: Recreate profiles table with correct foreign key to auth.users
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    phone TEXT,
    role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'shipper', 'admin', 'superadmin')),
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 4: Recreate customers table
CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
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

-- Step 5: Recreate shippers table
CREATE TABLE shippers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
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

-- Step 6: Recreate indexes
CREATE INDEX IF NOT EXISTS idx_customers_user_id ON customers(user_id);
CREATE INDEX IF NOT EXISTS idx_shippers_user_id ON shippers(user_id);

-- Step 7: Recreate RLS policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE shippers ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can view all profiles" ON profiles FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() AND role IN ('admin', 'superadmin')
    )
);

-- Customers policies
CREATE POLICY "Users can view own customer profile" ON customers FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can update own customer profile" ON customers FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can insert own customer profile" ON customers FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Admins can view all customers" ON customers FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() AND role IN ('admin', 'superadmin')
    )
);

-- Shippers policies
CREATE POLICY "Users can view own shipper profile" ON shippers FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can update own shipper profile" ON shippers FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can insert own shipper profile" ON shippers FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Admins can view all shippers" ON shippers FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() AND role IN ('admin', 'superadmin')
    )
);

-- Step 8: Recreate shipment_requests policies (they should still exist)
CREATE POLICY "Customers can view own requests" ON shipment_requests FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM customers 
        WHERE id = customer_id AND user_id = auth.uid()
    )
);
CREATE POLICY "Customers can insert own requests" ON shipment_requests FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM customers 
        WHERE id = customer_id AND user_id = auth.uid()
    )
);
CREATE POLICY "Admins can view all requests" ON shipment_requests FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() AND role IN ('admin', 'superadmin')
    )
);

