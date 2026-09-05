import { operationalContext } from '@/lib/operations/server';
import { authorizedVersion, verifiedSource } from '@/lib/documents/server';
import { intakeDb } from '@/lib/intake/server';
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
    const v = await authorizedVersion(ctx, params.id);
    const d = await verifiedSource(ctx, v);
    const { data, error: signError } = await intakeDb().storage.from('documents').createSignedUrl(d.file_path, 120);
    if (signError || !data)
        throw Error();
    return Response.json({ url: data.signedUrl }, { headers: { 'Cache-Control': 'private, no-store' } });
}
catch {
    return Response.json({ error: 'Source document unavailable' }, { status: 404 });
} }
