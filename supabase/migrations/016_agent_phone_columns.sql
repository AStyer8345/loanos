-- Add phone columns for listing agent and buyer's agent
ALTER TABLE loans ADD COLUMN IF NOT EXISTS listing_agent_phone text;
ALTER TABLE loans ADD COLUMN IF NOT EXISTS buyers_agent_phone  text;
