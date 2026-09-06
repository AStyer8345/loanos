import { NextResponse } from 'next/server';
import { operationalContext } from '@/lib/operations/server';
import { loadOperationalSnapshot } from '@/lib/operations/load-snapshot';
export const dynamic = 'force-dynamic';
const headers = { 'Cache-Control': 'private, no-store' };
export async function GET(req: Request) {
    let ctx: Awaited<ReturnType<typeof operationalContext>>;
    try { ctx = await operationalContext(req); }
    catch { return NextResponse.json({ error: 'Sign in to your LoanOS account.' }, { status: 401, headers }); }
    try { return NextResponse.json(await loadOperationalSnapshot(ctx), { headers }); }
    catch { return NextResponse.json({ error: 'The complete operational record could not be loaded. No partial totals are shown.' }, { status: 503, headers }); }
}
