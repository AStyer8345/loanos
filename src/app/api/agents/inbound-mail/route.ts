import {NextRequest,NextResponse} from 'next/server'
import {validateAgentSecret} from '@/lib/auth/validateAgentSecret'
import {normalizeInbound} from '@/lib/communications/inbound'
import {encryptInquiry} from '@/lib/intake/inquiry'
import {intakeOrganization} from '@/lib/intake/server'
export const dynamic='force-dynamic'
export async function POST(req:NextRequest) {
  const auth=validateAgentSecret(req);if(auth)return auth
  let raw:Record<string,unknown>,mail:ReturnType<typeof normalizeInbound>
  try{raw=await req.json();if(!raw||typeof raw!=='object'||Array.isArray(raw))throw Error();mail=normalizeInbound(raw)}
  catch{return NextResponse.json({error:'Invalid inbound email'},{status:400})}
  if(!mail)return NextResponse.json({success:true,skipped:'internal_sender'})
  try{
    const {db,organizationId,owner}=await intakeOrganization(raw.org_slug)
    const {data,error}=await db.rpc('capture_inbound_email',{p_org:organizationId,p_actor:owner.id,p_message:mail.messageId,p_input:mail.input,p_inquiry:mail.inquiry,p_key:mail.key,p_hash:mail.hash,p_inquiry_cipher:encryptInquiry({...mail.input,message:mail.payload.body_snippet}),p_activity_cipher:encryptInquiry(mail.payload),p_ai:mail.ai})
    if(error)throw error
    return NextResponse.json({success:true,...data},{headers:{'Cache-Control':'no-store'}})
  }catch{return NextResponse.json({error:'Email capture failed; retry the same message ID'},{status:503})}
}
