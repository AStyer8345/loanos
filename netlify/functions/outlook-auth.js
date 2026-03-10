/**
 * netlify/functions/outlook-auth.js
 *
 * Step 1 of OAuth flow — generates the Microsoft authorization URL and
 * redirects the user to Microsoft login.
 *
 * Flow: LoanOS Settings → GET /.netlify/functions/outlook-auth
 *       → redirect to login.microsoftonline.com → user authenticates
 *       → Microsoft redirects to outlook-callback with ?code=...&state=...
 *
 * Required env vars:
 *   MICROSOFT_CLIENT_ID    Azure App Registration client ID
 *   MICROSOFT_TENANT_ID    Azure Directory (tenant) ID
 *   MICROSOFT_REDIRECT_URI https://[site]/.netlify/functions/outlook-callback
 *   SUPABASE_URL           https://uuqedsvjlkeszrbwzizl.supabase.co
 *   SUPABASE_SERVICE_ROLE_KEY
 */

const MICROSOFT_CLIENT_ID    = process.env.MICROSOFT_CLIENT_ID;
const MICROSOFT_TENANT_ID    = process.env.MICROSOFT_TENANT_ID;
const MICROSOFT_REDIRECT_URI = process.env.MICROSOFT_REDIRECT_URI;
const SUPABASE_URL            = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const SCOPES = [
  'https://graph.microsoft.com/Mail.Read',
  'https://graph.microsoft.com/Mail.ReadWrite',
  'offline_access',
  'https://graph.microsoft.com/User.Read',
].join(' ');

const sbHeaders = () => ({
  apikey: SUPABASE_SERVICE_ROLE_KEY,
  Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
  'Content-Type': 'application/json',
});

function generateState() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

exports.handler = async (event) => {
  if (!MICROSOFT_CLIENT_ID || !MICROSOFT_TENANT_ID || !MICROSOFT_REDIRECT_URI) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Missing MICROSOFT_CLIENT_ID, MICROSOFT_TENANT_ID, or MICROSOFT_REDIRECT_URI env vars. See docs/outlook-azure-setup.md',
      }),
    };
  }

  // Generate CSRF state token
  const state = generateState();

  // Store state in Supabase for validation in callback
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/oauth_state`, {
      method: 'POST',
      headers: { ...sbHeaders(), Prefer: 'return=minimal' },
      body: JSON.stringify({ state }),
    });
    if (!res.ok) {
      const text = await res.text();
      console.error('[outlook-auth] Failed to store state:', text);
      // Non-fatal — continue without CSRF protection (log the risk)
    }
  } catch (err) {
    console.error('[outlook-auth] State storage error:', err.message);
  }

  // Build Microsoft OAuth2 URL
  const params = new URLSearchParams({
    client_id:     MICROSOFT_CLIENT_ID,
    response_type: 'code',
    redirect_uri:  MICROSOFT_REDIRECT_URI,
    scope:         SCOPES,
    state,
    response_mode: 'query',
    prompt:        'select_account',
  });

  const authUrl = `https://login.microsoftonline.com/${MICROSOFT_TENANT_ID}/oauth2/v2.0/authorize?${params}`;

  return {
    statusCode: 302,
    headers: { Location: authUrl },
    body: '',
  };
};
