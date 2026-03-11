// src/app/api/outlook-auth/route.ts
// Step 1 of OAuth — redirects to Microsoft login

import { NextResponse } from 'next/server';

const MICROSOFT_CLIENT_ID = process.env.MICROSOFT_CLIENT_ID;
const MICROSOFT_TENANT_ID = process.env.MICROSOFT_TENANT_ID;
const MICROSOFT_REDIRECT_URI = process.env.MICROSOFT_REDIRECT_URI;
const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const SCOPES = [
  'https://graph.microsoft.com/Mail.Read',
  'https://graph.microsoft.com/Mail.ReadWrite',
  'offline_access',
  'https://graph.microsoft.com/User.Read',
].join(' ');

function sbHeaders() {
  return {
    apikey: SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    'Content-Type': 'application/json',
  };
}

function generateState() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function GET() {
  if (!MICROSOFT_CLIENT_ID || !MICROSOFT_TENANT_ID || !MICROSOFT_REDIRECT_URI) {
    return NextResponse.json(
      {
        error:
          'Missing MICROSOFT_CLIENT_ID, MICROSOFT_TENANT_ID, or MICROSOFT_REDIRECT_URI env vars. See docs/outlook-azure-setup.md',
      },
      { status: 500 }
    );
  }

  const state = generateState();

  // Store CSRF state in Supabase
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/oauth_state`, {
      method: 'POST',
      headers: { ...sbHeaders(), Prefer: 'return=minimal' },
      body: JSON.stringify({ state }),
    });
    if (!res.ok) {
      const text = await res.text();
      console.error('[outlook-auth] Failed to store state:', text);
    }
  } catch (err: unknown) {
    console.error('[outlook-auth] State storage error:', err instanceof Error ? err.message : err);
  }

  const params = new URLSearchParams({
    client_id: MICROSOFT_CLIENT_ID,
    response_type: 'code',
    redirect_uri: MICROSOFT_REDIRECT_URI,
    scope: SCOPES,
    state,
    response_mode: 'query',
    prompt: 'select_account',
  });

  const authUrl = `https://login.microsoftonline.com/${MICROSOFT_TENANT_ID}/oauth2/v2.0/authorize?${params}`;

  return NextResponse.redirect(authUrl);
}
