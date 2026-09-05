import { NextRequest, NextResponse } from 'next/server'
import { validateAgentSecret } from '@/lib/auth/validateAgentSecret'
import { intakeOrganization } from '@/lib/intake/server'
export async function POST(req:NextRequest) {
 const authError=validateAgentSecret(req);if(authError)return authError
 try {
  const b=await req.json();const {db,organizationId}=await intakeOrganization(b.org_slug)
  if(!['draft_created','provider_accepted','delivered','needs_review'].includes(b.status))return NextResponse.json({error:'Unsupported receipt'},{status:400})
  const {data:old,error:readError}=await db.from('inquiry_outbox').select('*').eq('id',b.outbox_id).eq('organization_id',organizationId).single()
  if(readError||!old)return NextResponse.json({error:'Delivery not found'},{status:404})
  if(['provider_accepted','delivered'].includes(old.status)&&b.status!=='delivered')return NextResponse.json({success:true,duplicate:true})
  if(b.status==='draft_created'&&(!b.provider_message_id||old.status!=='sending'))return NextResponse.json({error:'Invalid draft transition'},{status:409})
  if(b.status==='provider_accepted'&&old.status!=='draft_created')return NextResponse.json({error:'A recorded draft is required'},{status:409})
  const patch:Record<string,unknown>={status:b.status,execution_id:typeof b.execution_id==='string'?b.execution_id:old.execution_id}
  if(b.status==='draft_created'){patch.provider_message_id=String(b.provider_message_id);patch.provider_internet_id=typeof b.provider_internet_id==='string'?b.provider_internet_id:null}
  if(b.status==='provider_accepted')patch.accepted_at=new Date().toISOString()
  if(b.status==='delivered')patch.delivered_at=new Date().toISOString()
  if(b.status==='needs_review')patch.last_error='Delivery outcome requires reconciliation; do not resend blindly'
  const {data:changed,error}=await db.from('inquiry_outbox').update(patch).eq('id',old.id).eq('organization_id',organizationId).eq('status',old.status).select('id').maybeSingle()
  if(error)throw error
  if(!changed)return NextResponse.json({error:'Delivery state changed; reconcile before retrying'},{status:409})
  return NextResponse.json({success:true,provider_message_id:patch.provider_message_id||old.provider_message_id})
 }catch{return NextResponse.json({error:'Receipt could not be recorded'},{status:503})}
}
