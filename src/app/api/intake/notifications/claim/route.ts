import { NextRequest, NextResponse } from 'next/server'
import { validateAgentSecret } from '@/lib/auth/validateAgentSecret'
import { decryptInquiry, type CipherPayload } from '@/lib/intake/inquiry'
import { intakeOrganization } from '@/lib/intake/server'
import { confirmationHtml, assistantConfirmationHtml } from '@/lib/intake/confirmation'
export const dynamic = 'force-dynamic'
export async function POST(req: NextRequest) {
 const authError=validateAgentSecret(req); if(authError)return authError
 try {
  const body=await req.json(); const {db,organizationId,owner}=await intakeOrganization(body.org_slug)
  // An uncertain send is held for reconciliation, never put back on the send queue.
  await db.from('inquiry_outbox').update({status:'needs_review',last_error:'Delivery attempt stalled; reconcile the stored Outlook draft before any resend'})
   .eq('organization_id',organizationId).in('status',['sending','draft_created']).lt('claimed_at',new Date(Date.now()-15*60_000).toISOString())
  const {data:rows,error}=await db.rpc('claim_inquiry_notifications',{p_org:organizationId,p_inquiry:body.inquiry_id||null})
  if(error)throw error
  if(rows?.length && typeof body.execution_id==='string')await db.from('inquiry_outbox').update({execution_id:body.execution_id}).eq('organization_id',organizationId).in('id',rows.map((r:{id:string})=>r.id))
  await db.from('communication_source_health').upsert({organization_id:organizationId,source:'website_notifications',status:'connected',last_success_at:new Date().toISOString(),last_attempt_at:new Date().toISOString(),detail:'Pending delivery reconciliation is active; provider acceptance is separate from confirmed receipt.',outbound:true,inbound:false},{onConflict:'organization_id,source'})
  const messages=[]
  for(const row of rows||[]) {
   try {
    const {data:i,error:readError}=await db.from('inquiries').select('*').eq('id',row.inquiry_id).eq('organization_id',organizationId).single()
    if(readError||!i)throw readError
    const p=decryptInquiry(i.payload_cipher as CipherPayload)
    const name=[p.first_name,p.last_name].filter(Boolean).join(' ')||'Name not provided'
    const url=process.env.NEXT_PUBLIC_APP_URL||'https://loanos-self.vercel.app'
    const link=i.contact_id?`${url}/dashboard/contacts/${i.contact_id}`:`${url}/dashboard?inquiry=${i.id}`
    const content=[`New inquiry: ${name}`,`Email: ${p.email||'Not provided'}`,`Phone: ${p.phone||'Not provided'}`,`Source: ${i.source}`,`Page: ${i.source_page||'Not recorded'}`,`Referral: ${i.referral_partner||'Not recorded'}`,`Purpose: ${i.purpose||'Not specified'}`,`Owner: ${owner.full_name||owner.email}`,`Next action: ${i.match_state==='needs_review'?'Review identity match before contacting':'Review inquiry, contact the person and record next action'}`,`LoanOS: ${link}`,`Inquiry: ${i.id}`].join('\n')
    messages.push({outbox_id:row.id,inquiry_id:i.id,kind:row.kind,
     message:{subject:row.kind==='owner_alert'?`${i.is_test?'[INTERNAL TEST] ':''}New inquiry — ${name} [${i.id.slice(0,8)}]`:i.form_name==='website_assistant'?`We received your message, ${String(p.first_name||'')}`:'Got your info — Adam Styer Mortgage',
      body:{contentType:row.kind==='owner_alert'?'Text':'HTML',content:row.kind==='owner_alert'?content:i.form_name==='website_assistant'?assistantConfirmationHtml(String(p.first_name||'')):confirmationHtml(String(p.first_name||''))},
      toRecipients:[{emailAddress:{address:row.kind==='owner_alert'?owner.email:String(p.email)}}],
      internetMessageHeaders:[{name:'X-LoanOS-Inquiry-ID',value:i.id},{name:'X-LoanOS-Outbox-ID',value:row.id},{name:'X-LoanOS-Message-Class',value:row.kind}]}})
   } catch {
    await db.from('inquiry_outbox').update({status:'needs_review',last_error:'Unable to prepare delivery; no send attempted'}).eq('id',row.id).eq('organization_id',organizationId)
   }
  }
  return NextResponse.json({messages},{headers:{'Cache-Control':'no-store'}})
 } catch {return NextResponse.json({error:'Delivery queue unavailable'},{status:503})}
}
