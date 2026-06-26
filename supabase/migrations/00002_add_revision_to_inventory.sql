-- Migration: Add revision column to pistoleo_inventory
-- To track if an item was marked as BIEN or MAL during the initial scan

ALTER TABLE pistoleo_inventory 
ADD COLUMN revision TEXT CHECK (revision IN ('BIEN', 'MAL', 'PENDING')) DEFAULT 'PENDING';
