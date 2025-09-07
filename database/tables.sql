-- ===========================
-- PROFILES
-- ===========================
CREATE TABLE profiles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name varchar(255),
    phone varchar(50),
    role varchar(50),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- ===========================
-- CUSTOMERS
-- ===========================
CREATE TABLE customers (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    company_name varchar(255),
    contact_name varchar(255),
    contact_email varchar(255),
    contact_phone varchar(50),
    address_line1 varchar(255),
    address_line2 varchar(255),
    city varchar(255),
    state varchar(100),
    postal_code varchar(20),
    country varchar(100),
    status varchar(50),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- ===========================
-- SHIPPERS
-- ===========================
CREATE TABLE shippers (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    company_name varchar(255),
    contact_name varchar(255),
    contact_email varchar(255),
    contact_phone varchar(50),
    address_line1 varchar(255),
    address_line2 varchar(255),
    city varchar(255),
    state varchar(100),
    postal_code varchar(20),
    country varchar(100),
    license_number varchar(100),
    status varchar(50),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- ===========================
-- SHIPMENT REQUESTS
-- ===========================
CREATE TABLE shipment_requests (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    origin varchar(255),
    destination varchar(255),
    preferred_mode varchar(100),
    cargo_type varchar(100),
    volume numeric,
    weight numeric,
    status varchar(50),
    customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- ===========================
-- SHIPMENT REQUEST SHIPPERS
-- ===========================
CREATE TABLE shipment_request_shippers (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    shipment_request_id uuid NOT NULL REFERENCES shipment_requests(id) ON DELETE CASCADE,
    shipper_id uuid NOT NULL REFERENCES shippers(id) ON DELETE CASCADE,
    status varchar(50),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- ===========================
-- QUOTATIONS
-- ===========================
CREATE TABLE quotations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    shipment_request_id uuid NOT NULL REFERENCES shipment_requests(id) ON DELETE CASCADE,
    shipper_id uuid NOT NULL REFERENCES shippers(id) ON DELETE CASCADE,
    price numeric(10,2),
    additional_charges numeric(10,2),
    valid_until timestamp with time zone,
    estimated_arrival_time timestamp with time zone,
    currency varchar(10),
    status varchar(50),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);
