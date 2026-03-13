-- 014: Consolidate mobile_phone → phone_mobile, then drop mobile_phone
-- mobile_phone came from Salesforce import; phone_mobile is the canonical column (migration 012)

-- Copy non-null mobile_phone values into phone_mobile where phone_mobile IS NULL
UPDATE contacts
SET phone_mobile = mobile_phone
WHERE mobile_phone IS NOT NULL
  AND phone_mobile IS NULL;

-- Drop the duplicate column
ALTER TABLE contacts DROP COLUMN IF EXISTS mobile_phone;
