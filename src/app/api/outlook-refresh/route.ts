// src/app/api/outlook-refresh/route.ts
// GET — check token status / trigger refresh manually

import { NextResponse } from 'next/server';
import { getValidAccessToken } from '@/lib/outlook/refresh';

export async function GET() {
  try {
    const { email } = await getValidAccessToken();
    return NextResponse.json({ ok: true, email, message: 'Token is valid (or was refreshed).' });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
