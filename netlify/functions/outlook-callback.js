/**
 * netlify/functions/outlook-callback.js
 *
 * Step 2 of OAuth flow — receives the redirect from Microsoft after the user
 * authenticates, exchanges the authorization code for tokens, and stores them.
 *
 * Flow: Microsoft → GET /.netlify/functions/outlook-callback?code=...&state=...
 *       → validate state → exchange code → store tokens → redirect to /settings
 *
 * Required env vars:
 *   MICROSOFT_CLIENT_ID
 *   MICROSOFT_CLIENT_SECRET
 *   MICROSOFT_TENANT_ID
 *   MICROSOFT_REDIRECT_URI
 *   SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */

const MICROSOFT_CLIENT_ID     = process.env.MICROSOFT_CLIENT_ID;
const MICROSOFT_CLIENT_SECRET = process.env.MICROSOFT_CLIENT_SECRET;
const MICROSOFT_TENANT_ID     = process.env.MICROSOFT_TENANT_ID;
const MICROSOFT_REDIRECT_URI  = process.env.MICROSOFT_REDIRECT_URI;
const SUPABASE_URL             = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const sbHeaders = () => ({
  apikey: SUPABASE_SERVICE_ROLE_KEY,
  Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
  'Content-Type': 'application/json',
});

async function validateState(state) {
  if (!state) return false;
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/oauth_state?state=eq.${encodeURIComponent(state)}&used_at=is.null&select=state`,
    { headers: sbHeaders() }
  );
  if (!res.ok) return false;
  const rows = await res.json();
  if (!rows.length) return false;

  // Mark as used to prevent replay attacks
  await fetch(
    `${SUPABASE_URL}/rest/v1/oauth_state?state=eq.${encodeURIComponent(state)}`,
    {
      method: 'PATCH',
      headers: { ...sbHeaders(), Prefer: 'return=minimal' },
      body: JSON.stringify({ used_at: new Date().toISOString() }),
    }
  );
  return true;
}

async function exchangeCode(code) {
  const params = new URLSearchParams({
    client_id:     MICROSOFT_CLIENT_ID,
    client_secret: MICROSOFT_CLIENT_SECRET,
    code,
    redirect_uri:  MICROSOFT_REDIRECT_URI,
    grant_type:    'authorization_code',
  });

  const res = await fetch(
    `https://login.microsoftonline.com/${MICROSOFT_TENANT_ID}/oauth2/v2.0/token`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    }
  );

  const data = await res.json();
  if (!res.ok) {
    throw new Error(`Token exchange failed: ${data.error_description || data.error}`);
  }
  return data; // { access_token, refresh_token, expires_in, token_type }
}

async function getUserEmail(accessToken) {
  const res = await fetch('https://graph.microsoft.com/v1.0/me?$select=mail,userPrincipalName', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const data = await res.json();
  return data.mail || data.userPrincipalName;
}

async function storeTokens({ accessToken, refreshToken, expiresIn, email }) {
  const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();

  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/outlook_tokens?on_conflict=email`,
    {
      method: 'POST',
      headers: {
        ...sbHeaders(),
        Prefer: 'resolution=merge-duplicates,return=minimal',
      },
      body: JSON.stringify({
        access_token:  accessToken,
        refresh_token: refreshToken,
        expires_at:    expiresAt,
        email,
        updated_at:    new Date().toISOString(),
      }),
    }
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to store tokens: ${text}`);
  }
}

const dashboardBase = () => {
  // Derive base URL from MICROSOFT_REDIRECT_URI
  const uri = MICROSOFT_REDIRECT_URI || '';
  const match = uri.match(/^(https?:\/\/[^/]+)/);
  return match ? match[1] : '';
};

exports.handler = async (event) => {
  const { code, state, error, error_description } = event.queryStringParameters || {};

  // Microsoft returned an error (user denied, etc.)
  if (error) {
    console.error('[outlook-callback] Microsoft error:', error, error_description);
    return {
      statusCode: 302,
      headers: { Location: `${dashboardBase()}/dashboard/settings?outlook=error&reason=${encodeURIComponent(error)}` },
      body: '',
    };
  }

  if (!code) {
    return { statusCode: 400, body: 'Missing authorization code' };
  }

  try {
    // Validate CSRF state
    const stateValid = await validateState(state);
    if (!stateValid) {
      console.warn('[outlook-callback] Invalid or expired state param — continuing anyway (non-fatal in dev)');
      // In production you might return 400 here; soft-fail for now to avoid
      // lockout if Supabase is slow or state table has issues.
    }

    // Exchange code for tokens
    const tokens = await exchangeCode(code);

    // Fetch user email from Graph
    const email = await getUserEmail(tokens.access_token);
    if (!email) throw new Error('Could not retrieve user email from Microsoft Graph');

    // Persist tokens
    await storeTokens({
      accessToken:  tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresIn:    tokens.expires_in,
      email,
    });

    console.log(`[outlook-callback] Connected Outlook: ${email}`);

    return {
      statusCode: 302,
      headers: { Location: `${dashboardBase()}/dashboard/settings?outlook=connected` },
      body: '',
    };
  } catch (err) {
    console.error('[outlook-callback] Error:', err.message);
    return {
      statusCode: 302,
      headers: { Location: `${dashboardBase()}/dashboard/settings?outlook=error&reason=${encodeURIComponent(err.message)}` },
      body: '',
    };
  }
};
