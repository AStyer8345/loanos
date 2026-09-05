import { NextResponse } from 'next/server';
import { operationalContext } from '@/lib/operations/server';
export async function POST(req: Request) {
    let ctx: Awaited<ReturnType<typeof operationalContext>>;
    try {
        ctx = await operationalContext(req);
    }
    catch {
        return NextResponse.json({ error: 'Sign in required' }, { status: 401 });
    }
    try {
        const { inquiry_id, loan_id, evidence } = await req.json();
        const { data, error } = await ctx.db.rpc('review_inquiry_loan_link', { p_inquiry: inquiry_id, p_loan: loan_id, p_evidence: evidence });
        if (error)
            throw error;
        return NextResponse.json({ id: data });
    }
    catch {
        return NextResponse.json({ error: 'Link was not saved. It must be a matched inquiry and an unlinked loan for the same contact, with review evidence.' }, { status: 400 });
    }
}
