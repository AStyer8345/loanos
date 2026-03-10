// outlook-refresh.js — internal token refresh utility
// Not a public endpoint — called by outlook-sync.js
// Exports: getValidAccessToken()

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const MICROSOFT_CLIENT_ID = process.env.MICROSOFT_CLIENT_ID;
const MICROSOFT_CLIENT_SECRET = process.env.MICROSOFT_CLIENT_SECRET;
const MICROSOFT_TENANT_ID = process.env.MICROSOFT_TENANT_ID || "common";

function sbHeaders() {
  return {
    apikey: SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    "Content-Type": "application/json",
    Prefer: "return=representation",
  };
}

/**
 * Fetch the stored token row from outlook_tokens.
 * Returns null if no token exists.
 */
async function fetchStoredToken(email) {
  const url = email
    ? `${SUPABASE_URL}/rest/v1/outlook_tokens?email=eq.${encodeURIComponent(email)}&limit=1`
    : `${SUPABASE_URL}/rest/v1/outlook_tokens?order=updated_at.desc&limit=1`;

  const res = await fetch(url, { headers: sbHeaders() });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Failed to fetch outlook_tokens: ${res.status} ${body}`);
  }
  const rows = await res.json();
  return rows.length > 0 ? rows[0] : null;
}

/**
 * Call Microsoft token endpoint with refresh_token grant.
 * Returns { access_token, refresh_token, expires_in }.
 */
async function refreshTokens(refreshToken) {
  const tokenUrl = `https://login.microsoftonline.com/${MICROSOFT_TENANT_ID}/oauth2/v2.0/token`;

  const body = new URLSearchParams({
    client_id: MICROSOFT_CLIENT_ID,
    client_secret: MICROSOFT_CLIENT_SECRET,
    grant_type: "refresh_token",
    refresh_token: refreshToken,
    scope: "Mail.Read Mail.ReadWrite offline_access User.Read",
  });

  const res = await fetch(tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(`Token refresh failed: ${res.status} ${errBody}`);
  }

  return await res.json();
}

/**
 * Persist refreshed tokens back to outlook_tokens.
 */
async function updateStoredToken(email, accessToken, refreshToken, expiresAt) {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/outlook_tokens?email=eq.${encodeURIComponent(email)}`,
    {
      method: "PATCH",
      headers: sbHeaders(),
      body: JSON.stringify({
        access_token: accessToken,
        refresh_token: refreshToken,
        expires_at: expiresAt,
        updated_at: new Date().toISOString(),
      }),
    }
  );

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Failed to update token: ${res.status} ${body}`);
  }
}

/**
 * Main export: returns a valid access_token, refreshing if needed.
 * @param {string|null} email - Specific email to use, or null for most recent
 * @returns {{ accessToken: string, email: string }}
 */
async function getValidAccessToken(email = null) {
  const stored = await fetchStoredToken(email);

  if (!stored) {
    throw new Error(
      "No Outlook token found. Connect Outlook in /dashboard/settings first."
    );
  }

  // Buffer: refresh if token expires within 5 minutes
  const bufferMs = 5 * 60 * 1000;
  const expiresAt = new Date(stored.expires_at).getTime();
  const isExpired = Date.now() + bufferMs >= expiresAt;

  if (!isExpired) {
    // Token is still valid
    return { accessToken: stored.access_token, email: stored.email };
  }

  // Token is expired or about to expire — refresh it
  console.log(`[outlook-refresh] Refreshing token for ${stored.email}...`);

  const newTokens = await refreshTokens(stored.refresh_token);

  const newExpiresAt = new Date(
    Date.now() + newTokens.expires_in * 1000
  ).toISOString();

  await updateStoredToken(
    stored.email,
    newTokens.access_token,
    // Microsoft may or may not return a new refresh_token — keep old one if not
    newTokens.refresh_token || stored.refresh_token,
    newExpiresAt
  );

  console.log(`[outlook-refresh] Token refreshed. New expiry: ${newExpiresAt}`);

  return { accessToken: newTokens.access_token, email: stored.email };
}

// Also expose as a Netlify handler for manual token status checks
exports.handler = async (event) => {
  if (event.httpMethod !== "GET") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const { email } = await getValidAccessToken();
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ok: true,
        email,
        message: "Token is valid (or was refreshed).",
      }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ok: false, error: err.message }),
    };
  }
};

exports.getValidAccessToken = getValidAccessToken;
