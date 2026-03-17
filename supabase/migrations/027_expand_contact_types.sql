-- Expand allowed contact_type values to support partner categories
ALTER TABLE contacts
  DROP CONSTRAINT IF EXISTS contacts_contact_type_check;

ALTER TABLE contacts
  ADD CONSTRAINT contacts_contact_type_check
  CHECK (contact_type IN ('borrower', 'realtor', 'other', 'advisor', 'title', 'insurance'));

