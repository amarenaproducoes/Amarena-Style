-- Fix product_id type in purchase_items
ALTER TABLE IF EXISTS purchase_items ALTER COLUMN product_id TYPE TEXT;
