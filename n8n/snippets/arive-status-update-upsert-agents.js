// Replacement body for the "Upsert Agent Contacts" Code node
// in workflow 9JyzzwKac8v3uQ7d (LoanOS — Arive Status Update → Supabase)
//
// Fixes:
//   - on_conflict column: org_id -> organization_id  (was 400'ing every call)
//   - contacts column:    account_name -> group_tag  (schema drift)
//   - Skip agents with no email AND no name (can't identify, nothing to upsert)
//   - Fall back to data.organization_id if Get Org ID returned nothing
//   - Collapse try/catch so a single bad agent can't halt the chain

const SUPABASE_URL = 'https://uuqedsvjlkeszrbwzizl.supabase.co/rest/v1';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV1cWVkc3ZqbGtlc3pyYnd6aXpsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI5ODcwMjYsImV4cCI6MjA4ODU2MzAyNn0.Wu1DKotPPigTpVpQvmdRMpa7NW9-WnEou6bTV3kakFM';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV1cWVkc3ZqbGtlc3pyYnd6aXpsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Mjk4NzAyNiwiZXhwIjoyMDg4NTYzMDI2fQ.8ybNi6Qay3WgwTlUHorSjh66C4vQMJURCiSVzVD4HmQ';

const hdrs = {
  'apikey': ANON_KEY,
  'Authorization': 'Bearer ' + SERVICE_KEY,
  'Content-Type': 'application/json',
  'Prefer': 'return=representation,resolution=merge-duplicates'
};

const data = $input.first().json;
const orgId = $('Get Org ID').first().json?.organization_id
  || data.organization_id
  || null;

async function upsertContact({ firstName, lastName, email, phone, contactType, groupTag }) {
  // Must have email; must have at least one name part — otherwise skip silently.
  if (!email) return null;
  if (!firstName && !lastName) return null;
  if (!orgId) return null;

  try {
    const created = await this.helpers.httpRequest({
      method: 'POST',
      url: SUPABASE_URL + '/contacts?on_conflict=email,organization_id',
      headers: hdrs,
      body: {
        first_name: firstName || '',
        last_name: lastName || '',
        email: String(email).toLowerCase().trim(),
        phone: phone || null,
        contact_type: contactType,
        group_tag: groupTag,
        user_id: data.userId || null,
        organization_id: orgId,
        updated_at: new Date().toISOString(),
      },
      json: true,
    });
    if (Array.isArray(created) && created.length > 0) return created[0].id;
  } catch (e) {
    console.log('Contact upsert failed for ' + email + ': ' + e.message);
  }
  return null;
}

const boundUpsert = upsertContact.bind(this);

const buyerAgentContactId = await boundUpsert({
  firstName: data.buyersAgentFirstName,
  lastName: data.buyersAgentLastName,
  email: data.buyersAgentEmail,
  phone: data.buyersAgentPhone,
  contactType: 'realtor',
  groupTag: 'Realtor Database',
});

const listingAgentContactId = await boundUpsert({
  firstName: data.listingAgentFirstName,
  lastName: data.listingAgentLastName,
  email: data.listingAgentEmail,
  phone: data.listingAgentPhone,
  contactType: 'realtor',
  groupTag: 'Realtor Database',
});

let titleContactId = null;
if (data.titleContactEmail) {
  const parts = (data.titleContactName || '').trim().split(/\s+/);
  titleContactId = await boundUpsert({
    firstName: parts[0] || null,
    lastName: parts.slice(1).join(' ') || null,
    email: data.titleContactEmail,
    phone: data.titleContactPhone,
    contactType: 'other',
    groupTag: 'Database',
  });
}

return [{
  json: {
    ...data,
    buyerAgentContactId,
    listingAgentContactId,
    titleContactId,
  }
}];
