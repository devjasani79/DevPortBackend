-- DevPort Logistics SaaS Database Schema
-- This file contains the complete database structure for the logistics platform

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    phone TEXT,
    role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'shipper', 'admin', 'superadmin')),
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Customers table
CREATE TABLE IF NOT EXISTS customers (
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

-- Shippers table
CREATE TABLE IF NOT EXISTS shippers (
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
    license_number VARCHAR(100),
    status VARCHAR(50) DEFAULT 'pending_verification' CHECK (status IN ('pending_verification', 'verified', 'suspended', 'inactive')),
    modes_supported TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Shipment requests table
CREATE TABLE IF NOT EXISTS shipment_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    origin TEXT NOT NULL,
    destination TEXT NOT NULL,
    preferred_mode VARCHAR(50),
    cargo_type VARCHAR(100),
    container_type VARCHAR(100),
    weight NUMERIC(10,2),
    volume NUMERIC(10,2),
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'quotations_received', 'quotation_accepted', 'cancelled')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Quotations table
CREATE TABLE IF NOT EXISTS quotations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shipment_request_id UUID NOT NULL REFERENCES shipment_requests(id) ON DELETE CASCADE,
    shipper_id UUID NOT NULL REFERENCES shippers(id) ON DELETE CASCADE,
    price NUMERIC(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    estimated_delivery_days INTEGER NOT NULL,
    valid_until DATE NOT NULL,
    additional_terms TEXT,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'expired')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Shipments table (actual shipments created when quotation is accepted)
CREATE TABLE IF NOT EXISTS shipments (
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
    status VARCHAR(50) DEFAULT 'in_transit' CHECK (status IN ('pending', 'in_transit', 'delivered', 'cancelled', 'delayed')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_customers_user_id ON customers(user_id);
CREATE INDEX IF NOT EXISTS idx_shippers_user_id ON shippers(user_id);
CREATE INDEX IF NOT EXISTS idx_shipment_requests_customer_id ON shipment_requests(customer_id);
CREATE INDEX IF NOT EXISTS idx_quotations_shipment_request_id ON quotations(shipment_request_id);
CREATE INDEX IF NOT EXISTS idx_quotations_shipper_id ON quotations(shipper_id);
CREATE INDEX IF NOT EXISTS idx_shipments_quotation_id ON shipments(quotation_id);
CREATE INDEX IF NOT EXISTS idx_shipments_shipper_id ON shipments(shipper_id);
CREATE INDEX IF NOT EXISTS idx_shipments_customer_id ON shipments(customer_id);

-- Create updated_at trigger function
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

-- Insert sample data (optional - for testing)
-- INSERT INTO profiles (id, full_name, role, is_verified) VALUES 
--     ('550e8400-e29b-41d4-a716-446655440000', 'Admin User', 'admin', true),
--     ('550e8400-e29b-41d4-a716-446655440001', 'Super Admin', 'superadmin', true);

-- Row Level Security (RLS) policies for Supabase
-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE shippers ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipment_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipments ENABLE ROW LEVEL SECURITY;

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