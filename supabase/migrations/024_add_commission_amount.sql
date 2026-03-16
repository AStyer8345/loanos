-- Add commission_amount to loans table for tracking originator compensation
ALTER TABLE loans ADD COLUMN IF NOT EXISTS commission_amount DECIMAL(10,2);
