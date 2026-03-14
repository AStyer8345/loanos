// src/app/api/outlook-callback/route.ts
// Step 2 of OAuth — receives code from Microsoft, exchanges for tokens

import { NextRequest, NextResponse } from 'next/server';

const MICROSOFT_CLIENT_ID = process.env.MICROSOFT_CLIENT_ID!;
const MICROSOFT_CLIENT_SECRET = process.env.MICROSOFT_CLIENT_SECRET!;
const MICROSOFT_TENANT_ID = process.env.MICROSOFT_TENANT_ID!;
const MICROSOFT_REDIRECT_URI = process.env.MICROSOFT_REDIRECT_URI!;
const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

function sbHeaders() {
  return {
    apikey: SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    'Content-Type': 'application/json',
  };
}

function dashboardBase() {
  const match = MICROSOFT_REDIRECT_URI?.match(/^(https?:\/\/[^/]+)/);
  return match ? match[1] : '';
}

async function validateState(state: string) {
  if (!state) return false;
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/oauth_state?state=eq.${encodeURIComponent(state)}&used_at=is.null&select=state`,
    { headers: sbHeaders() }
  );
  if (!res.ok) return false;
  const rows = await res.json();
  if (!rows.length) return false;

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

async function exchangeCode(code: string) {
  const params = new URLSearchParams({
    client_id: MICROSOFT_CLIENT_ID,
    client_secret: MICROSOFT_CLIENT_SECRET,
    code,
    redirect_uri: MICROSOFT_REDIRECT_URI,
    grant_type: 'authorization_code',
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
  return data;
}

async function getUserEmail(accessToken: string) {
  const res = await fetch(
    'https://graph.microsoft.com/v1.0/me?$select=mail,userPrincipalName',
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  const data = await res.json();
  return data.mail || data.userPrincipalName;
}

async function storeTokens({
  accessToken,
  refreshToken,
  expiresIn,
  email,
}: {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  email: string;
}) {
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
        access_token: accessToken,
        refresh_token: refreshToken,
        expires_at: expiresAt,
        email,
        updated_at: new Date().toISOString(),
      }),
    }
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to store tokens: ${text}`);
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state') || '';
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description') || '';

  const base = dashboardBase();

  if (error) {
    console.error('[outlook-callback] Microsoft error:', error, errorDescription);
    return NextResponse.redirect(
      `${base}/dashboard/settings?outlook=error&reason=${encodeURIComponent(error)}`
    );
  }

  if (!code) {
    return new NextResponse('Missing authorization code', { status: 400 });
  }

  try {
    const stateValid = await validateState(state);
    if (!stateValid) {
      // Invalid or expired state — continuing (non-fatal)
    }

    const tokens = await exchangeCode(code);
    const email = await getUserEmail(tokens.access_token);
    if (!email) throw new Error('Could not retrieve user email from Microsoft Graph');

    await storeTokens({
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresIn: tokens.expires_in,
      email,
    });

    return NextResponse.redirect(`${base}/dashboard/settings?outlook=connected`);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[outlook-callback] Error:', msg);
    return NextResponse.redirect(
      `${base}/dashboard/settings?outlook=error&reason=${encodeURIComponent(msg)}`
    );
  }
}
