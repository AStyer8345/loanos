import { operationalContext } from '@/lib/operations/server';
import { reviewDetails } from '@/lib/documents/server';
export const dynamic = 'force-dynamic';
export async function GET(req: Request, { params }: {
    params: {
        id: string;
    };
}) { let ctx; try {
    ctx = await operationalContext(req);
}
catch {
    return Response.json({ error: 'Sign in required' }, { status: 401 });
} try {
    return Response.json(await reviewDetails(ctx, params.id), { headers: { 'Cache-Control': 'private, no-store' } });
}
catch {
    return Response.json({ error: 'Document review not found' }, { status: 404 });
} }
