import {createHash} from 'node:crypto'
import {INTERNAL_EMAILS} from '@/lib/intake/inquiry'

const text=(v:unknown,max=500)=>typeof v==='string'?v.trim().slice(0,max):''
export function normalizeInbound(raw:Record<string,unknown>) {
  const email=text(raw.from_address,254).toLowerCase(),messageId=text(raw.message_id,2000)
  const received=Date.parse(text(raw.received_at)),subject=text(raw.subject),body=text(raw.body_snippet,4000)
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||!messageId||!Number.isFinite(received)||received>Date.now()+60000)throw Error('Valid sender, message ID and source timestamp required')
  if(INTERNAL_EMAILS.has(email))return null
  const authored=body.split(/(?:\r?\n\s*>|\r?\nOn .{0,200}wrote:|\r?\nFrom:)/i)[0]
  const content=subject+' '+authored
  const mortgage=/\b(?:mortgage|loan|dscr|refinanc\w*|pre[- ]?approv\w*|home financ\w*)\b/i.test(content)
  const request=/\b(?:i(?:'m| am|’m)|we(?:'re| are|’re))\s+(?:buying|purchasing|looking|interested|seeking)|\b(?:can|could)\s+you\s+(?:price|quote|help|finance)|\b(?:need|looking for|interested in|apply for|get)\s+(?:(?:a|an|the)\s+)?(?:.{0,35}\s)?(?:loan|mortgage|refinanc\w*|pre[- ]?approv\w*)\b/i.test(content)
  const noise=/\b(?:unsubscribe|rate sheet|new listing|webinar)\b/i.test(content)||/^(?:no-?reply|notifications?|alerts?|mailer-daemon)(?:[+._-]|@)/i.test(email)||raw.ai_intent==='automated'
  const inquiry= mortgage&&request&&!noise
  const senderName=text(raw.from_name,180)
  const names=(senderName.includes('@')?'':senderName).split(/\s+/)
  const conversation=text(raw.conversation_id,2000)||messageId
  const key='outlook:'+createHash('sha256').update(email+'\n'+conversation).digest('hex')
  const input={email,phone:'',first_name:names[0]||'',last_name:names.slice(1).join(' '),source:'Direct email',source_page:'',form_name:'email-inquiry',purpose:subject,received_at:new Date(received).toISOString(),suppress_confirmation:true,provenance:{transport:'outlook_email',source_id:messageId,conversation_id:conversation}}
  const hash=createHash('sha256').update(email).digest('hex')
  const url=text(raw.web_link,2000)
  const payload={subject,body_snippet:body,from_address:email,metadata:{from_name:senderName,message_id:messageId,conversation_id:conversation,webLink:/^https:\/\/outlook\.(?:office\.com|office365\.com|live\.com)\//i.test(url)?url:null,direction:'inbound'}}
  return {messageId,input,key,hash,inquiry,payload,ai:{intent:text(raw.ai_intent,40)||null,urgency:text(raw.ai_urgency,20)||null,sentiment:text(raw.ai_sentiment,20)||null,suggested_action:text(raw.ai_suggested_action,40)||null,confidence:typeof raw.ai_confidence==='number'?Math.max(0,Math.min(1,raw.ai_confidence)):null}}
}
