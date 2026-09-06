import { NextResponse } from 'next/server'
import { teamContext } from '@/lib/team/server'
import { loadOperationalSnapshot } from '@/lib/operations/load-snapshot'
import { teamRecords } from '@/lib/team/projection'
import { teamEdit } from '@/lib/team/edits'
import { collectPages } from '@/lib/command-center-pages'
export const dynamic = 'force-dynamic'
const headers = {'Cache-Control':'private, no-store'}

export async function GET(req: Request) {
  let ctx: Awaited<ReturnType<typeof teamContext>>
  try { ctx = await teamContext(req) } catch { return NextResponse.json({error:'Team access required'}, {status:403,headers}) }
  try {
    const [source, notes] = await Promise.all([
      loadOperationalSnapshot(ctx,false),
      collectPages(async (from,to) => ctx.db.from('team_record_notes').select('id,record_kind,record_id,author_name,body,created_at').eq('organization_id',ctx.organizationId).order('id').range(from,to)),
    ])
    const records = teamRecords(source,ctx.compBps)
    const keys = new Set(records.map(r => `${r.kind}:${r.id}`))
    return NextResponse.json({asOf:source.asOf,displayName:ctx.displayName,compBps:ctx.compBps,owner:ctx.owner,records,
      notes:notes.filter(n => keys.has(`${n.record_kind}:${n.record_id}`)),
    }, {headers})
  } catch { return NextResponse.json({error:'The complete team workspace could not be loaded. Please retry.'}, {status:503,headers}) }
}

export async function POST(req: Request) {
  let ctx: Awaited<ReturnType<typeof teamContext>>
  try { ctx = await teamContext(req) } catch { return NextResponse.json({error:'Team access required'}, {status:403,headers}) }
  try {
    if (Number(req.headers.get('content-length') || 0)>20000) throw new Error('Request too large')
    const input = await req.json()
    if (!input || typeof input !== 'object' || Array.isArray(input) || Object.keys(input).some(k => !['id','kind','note','changes'].includes(k))) throw new Error('Invalid request')
    const snapshot = await loadOperationalSnapshot(ctx,false)
    const record = teamRecords(snapshot,ctx.compBps).find(r => r.id===input.id && r.kind===input.kind)
    if (!record) return NextResponse.json({error:'Record not available'}, {status:404,headers})
    if ('note' in input && !('changes' in input)) {
      if (typeof input.note !== 'string' || !input.note.trim() || input.note.length>10000) throw new Error('Enter a note of up to 10,000 characters')
      const {error} = await ctx.db.from('team_record_notes').insert({organization_id:ctx.organizationId,record_kind:record.kind,record_id:record.id,author_id:ctx.userId,author_name:ctx.displayName,body:input.note.trim()})
      if (error) throw new Error('The note could not be saved')
    } else if ('changes' in input && !('note' in input)) {
      const update = teamEdit(record,input.changes)
      if (record.kind==='lead' && !snapshot.preferences.some(p => p.id===record.id)) throw new Error('This new inquiry needs to be linked to a saved lead before its fields can be edited')
      const {data,error} = await ctx.db.from(record.kind==='contact'?'contacts':'lead_desk_preferences')
        .update({...update,updated_at:new Date().toISOString()}).eq('organization_id',ctx.organizationId).eq('id',record.id).select('id').maybeSingle()
      if (error || !data) throw new Error('Changes could not be saved')
    } else throw new Error('Choose a note or field changes')
    return NextResponse.json({saved:true}, {headers})
  } catch (e) { return NextResponse.json({error:e instanceof Error?e.message:'Invalid request'}, {status:400,headers}) }
}
