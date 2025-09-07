-- Complete workflow fix for DevPort Backend
-- This script fixes the foreign key constraints and adds missing workflow steps

-- Step 1: Fix profiles table foreign key constraint
-- Drop existing constraints
ALTER TABLE customers DROP CONSTRAINT IF EXISTS customers_user_id_fkey;
ALTER TABLE shippers DROP CONSTRAINT IF EXISTS shippers_user_id_fkey;

-- Drop and recreate profiles table with correct foreign key
DROP TABLE IF EXISTS profiles CASCADE;

CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    phone TEXT,
    role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'shipper', 'admin', 'superadmin')),
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 2: Recreate customers table
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

-- Step 3: Recreate shippers table
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

-- Step 4: Update shipment_requests table with new workflow statuses
ALTER TABLE shipment_requests DROP CONSTRAINT IF EXISTS shipment_requests_customer_id_fkey;

CREATE TABLE shipment_requests_new (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    origin TEXT NOT NULL,
    destination TEXT NOT NULL,
    preferred_mode VARCHAR(50),
    cargo_type VARCHAR(100),
    container_type VARCHAR(100),
    weight NUMERIC(10,2),
    volume NUMERIC(10,2),
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN (
        'pending',           -- Customer created, waiting for admin
        'sent_to_shippers',  -- Admin sent to shippers
        'quotations_received', -- Shippers submitted quotations
        'quotation_selected',  -- Admin selected a quotation
        'customer_approved',   -- Customer approved admin's selection
        'quotation_accepted',  -- Final acceptance
        'cancelled'           -- Cancelled at any stage
    )),
    admin_notes TEXT,        -- Admin notes when sending to shippers
    selected_quotation_id UUID, -- Which quotation admin selected
    customer_approval_notes TEXT, -- Customer approval notes
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Migrate existing data
INSERT INTO shipment_requests_new (id, customer_id, origin, destination, preferred_mode, cargo_type, container_type, weight, volume, status, notes, created_at, updated_at)
SELECT id, customer_id, origin, destination, preferred_mode, cargo_type, container_type, weight, volume, status, notes, created_at, updated_at
FROM shipment_requests;

-- Drop old table and rename new one
DROP TABLE shipment_requests CASCADE;
ALTER TABLE shipment_requests_new RENAME TO shipment_requests;

-- Step 5: Update quotations table with new workflow
ALTER TABLE quotations DROP CONSTRAINT IF EXISTS quotations_shipment_request_id_fkey;
ALTER TABLE quotations DROP CONSTRAINT IF EXISTS quotations_shipper_id_fkey;

CREATE TABLE quotations_new (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shipment_request_id UUID NOT NULL REFERENCES shipment_requests(id) ON DELETE CASCADE,
    shipper_id UUID NOT NULL REFERENCES shippers(id) ON DELETE CASCADE,
    price NUMERIC(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    estimated_delivery_days INTEGER NOT NULL,
    valid_until DATE NOT NULL,
    additional_terms TEXT,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN (
        'pending',           -- Shipper submitted
        'admin_selected',    -- Admin selected this quotation
        'customer_approved', -- Customer approved admin's selection
        'accepted',          -- Final acceptance
        'rejected',          -- Rejected by admin or customer
        'expired'            -- Expired
    )),
    admin_selection_notes TEXT, -- Why admin selected this quotation
    customer_approval_notes TEXT, -- Customer approval notes
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Migrate existing data
INSERT INTO quotations_new (id, shipment_request_id, shipper_id, price, currency, estimated_delivery_days, valid_until, additional_terms, status, created_at, updated_at)
SELECT id, shipment_request_id, shipper_id, price, currency, estimated_delivery_days, valid_until, additional_terms, status, created_at, updated_at
FROM quotations;

-- Drop old table and rename new one
DROP TABLE quotations CASCADE;
ALTER TABLE quotations_new RENAME TO quotations;

-- Step 6: Update shipments table
ALTER TABLE shipments DROP CONSTRAINT IF EXISTS shipments_quotation_id_fkey;
ALTER TABLE shipments DROP CONSTRAINT IF EXISTS shipments_shipper_id_fkey;
ALTER TABLE shipments DROP CONSTRAINT IF EXISTS shipments_customer_id_fkey;

CREATE TABLE shipments_new (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quotation_id UUID NOT NULL REFERENCES quotations(id) ON DELETE CASCADE,
    shipper_id UUID NOT NULL REFERENCES shippers(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    origin TEXT NOT NULL,
    destination TEXT NOT NULL,
    cargo_type VARCHAR(100),
    container_type VARCHAR(100),
    weight NUMERIC(10,2),
    volume NUMERIC(10,2),
    estimated_delivery_date DATE,
    tracking_number VARCHAR(100),
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN (
        'pending',           -- Created but not started
        'in_transit',        -- Shipment in progress
        'delivered',         -- Successfully delivered
        'cancelled',         -- Cancelled
        'delayed'            -- Delayed
    )),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Migrate existing data
INSERT INTO shipments_new (id, quotation_id, shipper_id, customer_id, origin, destination, cargo_type, container_type, weight, volume, estimated_delivery_date, tracking_number, status, notes, created_at, updated_at)
SELECT id, quotation_id, shipper_id, customer_id, origin, destination, cargo_type, container_type, weight, volume, estimated_delivery_date, tracking_number, status, notes, created_at, updated_at
FROM shipments;

-- Drop old table and rename new one
DROP TABLE shipments CASCADE;
ALTER TABLE shipments_new RENAME TO shipments;

-- Step 7: Create indexes
CREATE INDEX IF NOT EXISTS idx_customers_user_id ON customers(user_id);
CREATE INDEX IF NOT EXISTS idx_shippers_user_id ON shippers(user_id);
CREATE INDEX IF NOT EXISTS idx_shipment_requests_customer_id ON shipment_requests(customer_id);
CREATE INDEX IF NOT EXISTS idx_shipment_requests_status ON shipment_requests(status);
CREATE INDEX IF NOT EXISTS idx_quotations_shipment_request_id ON quotations(shipment_request_id);
CREATE INDEX IF NOT EXISTS idx_quotations_shipper_id ON quotations(shipper_id);
CREATE INDEX IF NOT EXISTS idx_quotations_status ON quotations(status);
CREATE INDEX IF NOT EXISTS idx_shipments_quotation_id ON shipments(quotation_id);
CREATE INDEX IF NOT EXISTS idx_shipments_shipper_id ON shipments(shipper_id);
CREATE INDEX IF NOT EXISTS idx_shipments_customer_id ON shipments(customer_id);

-- Step 8: Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_shippers_updated_at BEFORE UPDATE ON shippers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_shipment_requests_updated_at BEFORE UPDATE ON shipment_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_quotations_updated_at BEFORE UPDATE ON quotations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_shipments_updated_at BEFORE UPDATE ON shipments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Step 9: Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE shippers ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipment_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipments ENABLE ROW LEVEL SECURITY;

-- Step 10: Create RLS policies
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

-- Shipment requests policies
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
CREATE POLICY "Admins can update requests" ON shipment_requests FOR UPDATE USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() AND role IN ('admin', 'superadmin')
    )
);

-- Quotations policies
CREATE POLICY "Shippers can view own quotations" ON quotations FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM shippers 
        WHERE id = shipper_id AND user_id = auth.uid()
    )
);
CREATE POLICY "Shippers can insert own quotations" ON quotations FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM shippers 
        WHERE id = shipper_id AND user_id = auth.uid()
    )
);
CREATE POLICY "Customers can view quotations for their requests" ON quotations FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM shipment_requests sr
        JOIN customers c ON sr.customer_id = c.id
        WHERE sr.id = shipment_request_id AND c.user_id = auth.uid()
    )
);
CREATE POLICY "Admins can view all quotations" ON quotations FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() AND role IN ('admin', 'superadmin')
    )
);
CREATE POLICY "Admins can update quotations" ON quotations FOR UPDATE USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() AND role IN ('admin', 'superadmin')
    )
);

-- Shipments policies
CREATE POLICY "Users can view shipments they're involved in" ON shipments FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM customers 
        WHERE id = customer_id AND user_id = auth.uid()
    ) OR
    EXISTS (
        SELECT 1 FROM shippers 
        WHERE id = shipper_id AND user_id = auth.uid()
    )
);
CREATE POLICY "Admins can view all shipments" ON shipments FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() AND role IN ('admin', 'superadmin')
    )
);
CREATE POLICY "Admins can insert shipments" ON shipments FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() AND role IN ('admin', 'superadmin')
    )
);
CREATE POLICY "Admins can update shipments" ON shipments FOR UPDATE USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() AND role IN ('admin', 'superadmin')
    )
);

