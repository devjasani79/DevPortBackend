-- Minimal fix for foreign key constraint error
-- This script only fixes the foreign key issue without dropping existing data

-- Step 1: Drop existing foreign key constraints
ALTER TABLE customers DROP CONSTRAINT IF EXISTS customers_user_id_fkey;
ALTER TABLE shippers DROP CONSTRAINT IF EXISTS shippers_user_id_fkey;
ALTER TABLE shipment_requests DROP CONSTRAINT IF EXISTS shipment_requests_customer_id_fkey;

-- Step 2: Check if profiles table exists and has correct structure
-- If profiles table doesn't exist, create it
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    phone TEXT,
    role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'shipper', 'admin', 'superadmin')),
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 3: If profiles table exists but has wrong structure, we need to fix it
-- First, let's check if the profiles table has the correct foreign key
-- If not, we'll need to recreate it

-- Step 4: Add foreign key constraints back
ALTER TABLE customers 
ADD CONSTRAINT customers_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE shippers 
ADD CONSTRAINT shippers_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE shipment_requests 
ADD CONSTRAINT shipment_requests_customer_id_fkey 
FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE;

-- Step 5: Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_customers_user_id ON customers(user_id);
CREATE INDEX IF NOT EXISTS idx_shippers_user_id ON shippers(user_id);
CREATE INDEX IF NOT EXISTS idx_shipment_requests_customer_id ON shipment_requests(customer_id);

-- Step 6: Enable RLS if not already enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE shippers ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipment_requests ENABLE ROW LEVEL SECURITY;

-- Step 7: Create RLS policies if they don't exist
DO $$
BEGIN
    -- Profiles policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Users can view own profile') THEN
        CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Users can update own profile') THEN
        CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Users can insert own profile') THEN
        CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
    END IF;

    -- Customers policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'customers' AND policyname = 'Users can view own customer profile') THEN
        CREATE POLICY "Users can view own customer profile" ON customers FOR SELECT USING (user_id = auth.uid());
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'customers' AND policyname = 'Users can update own customer profile') THEN
        CREATE POLICY "Users can update own customer profile" ON customers FOR UPDATE USING (user_id = auth.uid());
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'customers' AND policyname = 'Users can insert own customer profile') THEN
        CREATE POLICY "Users can insert own customer profile" ON customers FOR INSERT WITH CHECK (user_id = auth.uid());
    END IF;

    -- Shippers policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'shippers' AND policyname = 'Users can view own shipper profile') THEN
        CREATE POLICY "Users can view own shipper profile" ON shippers FOR SELECT USING (user_id = auth.uid());
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'shippers' AND policyname = 'Users can update own shipper profile') THEN
        CREATE POLICY "Users can update own shipper profile" ON shippers FOR UPDATE USING (user_id = auth.uid());
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'shippers' AND policyname = 'Users can insert own shipper profile') THEN
        CREATE POLICY "Users can insert own shipper profile" ON shippers FOR INSERT WITH CHECK (user_id = auth.uid());
    END IF;

    -- Shipment requests policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'shipment_requests' AND policyname = 'Customers can view own requests') THEN
        CREATE POLICY "Customers can view own requests" ON shipment_requests FOR SELECT USING (
            EXISTS (
                SELECT 1 FROM customers 
                WHERE id = customer_id AND user_id = auth.uid()
            )
        );
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'shipment_requests' AND policyname = 'Customers can insert own requests') THEN
        CREATE POLICY "Customers can insert own requests" ON shipment_requests FOR INSERT WITH CHECK (
            EXISTS (
                SELECT 1 FROM customers 
                WHERE id = customer_id AND user_id = auth.uid()
            )
        );
    END IF;
END $$;

-- Step 8: Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Step 9: Create triggers for updated_at if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_profiles_updated_at') THEN
        CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_customers_updated_at') THEN
        CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_shippers_updated_at') THEN
        CREATE TRIGGER update_shippers_updated_at BEFORE UPDATE ON shippers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_shipment_requests_updated_at') THEN
        CREATE TRIGGER update_shipment_requests_updated_at BEFORE UPDATE ON shipment_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;


