// src/lib/outlook/refresh.ts
// Shared token management — used by /api/outlook-refresh and /api/outlook-sync

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const MICROSOFT_CLIENT_ID = process.env.MICROSOFT_CLIENT_ID!;
const MICROSOFT_CLIENT_SECRET = process.env.MICROSOFT_CLIENT_SECRET!;
const MICROSOFT_TENANT_ID = process.env.MICROSOFT_TENANT_ID || 'common';

function sbHeaders() {
  return {
    apikey: SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    'Content-Type': 'application/json',
    Prefer: 'return=representation',
  };
}

async function fetchStoredToken(email: string | null) {
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

async function refreshTokens(refreshToken: string) {
  const tokenUrl = `https://login.microsoftonline.com/${MICROSOFT_TENANT_ID}/oauth2/v2.0/token`;

  const body = new URLSearchParams({
    client_id: MICROSOFT_CLIENT_ID,
    client_secret: MICROSOFT_CLIENT_SECRET,
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    scope: 'Mail.Read Mail.ReadWrite offline_access User.Read',
  });

  const res = await fetch(tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });

  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(`Token refresh failed: ${res.status} ${errBody}`);
  }

  return res.json();
}

async function updateStoredToken(
  email: string,
  accessToken: string,
  refreshToken: string,
  expiresAt: string
) {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/outlook_tokens?email=eq.${encodeURIComponent(email)}`,
    {
      method: 'PATCH',
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
 * Returns a valid access token, refreshing if it expires within 5 minutes.
 */
export async function getValidAccessToken(
  email: string | null = null
): Promise<{ accessToken: string; email: string }> {
  const stored = await fetchStoredToken(email);

  if (!stored) {
    throw new Error(
      'No Outlook token found. Connect Outlook in /dashboard/settings first.'
    );
  }

  const bufferMs = 5 * 60 * 1000;
  const expiresAt = new Date(stored.expires_at).getTime();
  const isExpired = Date.now() + bufferMs >= expiresAt;

  if (!isExpired) {
    return { accessToken: stored.access_token, email: stored.email };
  }

  console.log(`[outlook-refresh] Refreshing token for ${stored.email}...`);

  const newTokens = await refreshTokens(stored.refresh_token);
  const newExpiresAt = new Date(Date.now() + newTokens.expires_in * 1000).toISOString();

  await updateStoredToken(
    stored.email,
    newTokens.access_token,
    newTokens.refresh_token || stored.refresh_token,
    newExpiresAt
  );

  console.log(`[outlook-refresh] Token refreshed. New expiry: ${newExpiresAt}`);

  return { accessToken: newTokens.access_token, email: stored.email };
}
