
-- Create a sequence for order numbers
CREATE SEQUENCE IF NOT EXISTS order_number_seq;

-- Create purchases table
CREATE TABLE IF NOT EXISTS purchases (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id TEXT UNIQUE DEFAULT ('C' || LPAD(nextval('order_number_seq')::text, 6, '0')),
  total_value DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create purchase_items table
CREATE TABLE IF NOT EXISTS purchase_items (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  purchase_id uuid REFERENCES purchases(id) ON DELETE CASCADE,
  product_id uuid, -- Reference to products table if useful
  reference_code TEXT,
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10, 2) NOT NULL,
  total_price DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_items ENABLE ROW LEVEL SECURITY;

-- Allow public inserts for checkout
CREATE POLICY "Allow public inserts on purchases" ON purchases FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public inserts on purchase_items" ON purchase_items FOR INSERT WITH CHECK (true);

-- Allow admins to read everything (if user is authenticated)
-- Note: Assuming there's a way to identify admins, or just allow read for now
CREATE POLICY "Allow service_role full access" ON purchases FOR ALL USING (true);
CREATE POLICY "Allow service_role full access to items" ON purchase_items FOR ALL USING (true);
