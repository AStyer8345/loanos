import { NextRequest, NextResponse } from 'next/server'
import { validateAgentSecret } from '@/lib/auth/validateAgentSecret'
import { normalizeInquiry, encryptInquiry } from '@/lib/intake/inquiry'
import { intakeOrganization } from '@/lib/intake/server'
export const dynamic = 'force-dynamic'
export async function POST(req: NextRequest) {
  const authError = validateAgentSecret(req); if (authError) return authError
  let raw: Record<string,unknown>
  try { raw = await req.json(); if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new Error() }
  catch { return NextResponse.json({error:'Invalid inquiry body'},{status:400}) }
  if (typeof raw.dispatch_inquiry_id === 'string') {
    try {
      const {db,organizationId}=await intakeOrganization(raw.org_slug)
      const {data,error}=await db.from('inquiries').select('id').eq('organization_id',organizationId).eq('id',raw.dispatch_inquiry_id).single()
      if(error||!data)return NextResponse.json({error:'Saved inquiry not found'},{status:404})
      return NextResponse.json({success:true,captured:true,inquiry_id:data.id})
    }catch{return NextResponse.json({error:'Saved inquiry unavailable'},{status:503})}
  }
  let normalized: ReturnType<typeof normalizeInquiry>
  try { normalized = normalizeInquiry(raw) }
  catch (e) { return NextResponse.json({error:e instanceof Error ? e.message : 'Invalid inquiry'},{status:400}) }
  try {
    const {db,organizationId,owner} = await intakeOrganization(raw.org_slug)
    const {key,input,isTest,hash,original} = normalized
    const cipher = encryptInquiry({...original,...input})
    const {data,error} = await db.rpc('capture_inquiry',{p_org:organizationId,p_actor:owner.id,p_key:key,p_input:input,p_cipher:cipher,p_hash:hash,p_test:isTest})
    if (error) throw error
    if (data.payload_conflict) return NextResponse.json({error:'Inquiry ID already belongs to different contact information; review required',inquiry_id:data.id,captured:true},{status:409})
    return NextResponse.json({success:true,captured:true,inquiry_id:data.id,contact_id:data.contact_id,task_id:data.task_id,match_state:data.match_state,duplicate:data.duplicate,ownerNotified:null},{headers:{'Cache-Control':'no-store'}})
  } catch { return NextResponse.json({error:'Inquiry capture unavailable; retry with the same inquiry_id',captured:false},{status:503}) }
}
