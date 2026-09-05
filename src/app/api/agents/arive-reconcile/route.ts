import {NextResponse} from 'next/server';
import {timingSafeEqual} from 'node:crypto';
import {intakeDb} from '@/lib/intake/server';
import {normalizeAriveRows,matchAriveLead,type AriveFact} from '@/lib/operations/arive-sync';
import type {DeskPreference} from '@/lib/operations/simple-desk';
export const maxDuration=60;
const org='18613f82-fdd9-42dd-a09e-f3c577328258';
const headers={'Cache-Control':'private, no-store'};
export async function POST(req:Request){
 const secret=process.env.ARIVE_WEBHOOK_SECRET||'',provided=req.headers.get('x-webhook-secret')||'';
 if(secret.length<20||provided.length!==secret.length||!timingSafeEqual(Buffer.from(secret),Buffer.from(provided)))return NextResponse.json({error:'Unauthorized'},{status:401,headers});
 const db=intakeDb();
 try{
  const raw=await req.text();if(raw.length>3000000)throw Error('ARIVE snapshot is too large');
  const {data:known,error:ke}=await db.from('lead_desk_preferences').select('provenance').eq('organization_id',org);if(ke)throw Error('Saved loan IDs unavailable');
  const knownIds=(known||[]).flatMap(p=>[...(p.provenance?.restored_lead?.loan?.match(/\b\d{7,10}\b/g)||[]),...(p.provenance?.arive_match?.ids||[])]);
  const facts=normalizeAriveRows(JSON.parse(raw),Date.now(),knownIds);if(!facts.length)throw Error('No loans for the configured owner');
  const {data:result,error}=await db.rpc('reconcile_arive_facts',{p_rows:facts});if(error)throw Error('ARIVE facts could not be saved');
  const [{data:preferences,error:pe},{data:stored,error:fe}]=await Promise.all([
   db.from('lead_desk_preferences').select('id,contact_id,provenance,status,amount_note,product_note').eq('organization_id',org),
   db.from('arive_loan_facts').select('*').eq('organization_id',org).in('arive_loan_id',facts.map(f=>f.arive_loan_id))
  ]);if(pe||fe)throw Error('ARIVE lead matches could not be checked');
  const ids=(preferences||[]).map(p=>p.contact_id).filter(Boolean);
  const {data:contacts,error:ce}=ids.length?await db.from('contacts').select('id,first_name,last_name,email,phone').eq('organization_id',org).in('id',ids):{data:[],error:null};
  if(ce)throw Error('Lead identities could not be checked');
  let matched=0,review=0;const checkedAt=new Date().toISOString();
  for(const p of (preferences||[]) as DeskPreference[]){
   const original=p.provenance?.restored_lead||{},c=contacts?.find(c=>c.id===p.contact_id);
   const match=matchAriveLead({name:original.name||[c?.first_name,c?.last_name].filter(Boolean).join(' ')||p.provenance?.display_name||'',email:c?.email||original.email,phone:c?.phone,originalLoan:original.loan,note:original.note,previous:p.provenance?.arive_match},stored as AriveFact[],checkedAt);
   if(match.state==='matched')matched++;if(match.state==='review')review++;
   // Retain saved notes and the retired overrides as evidence. Only loan-owned fields are cleared.
   const provenance={...p.provenance,arive_match:match,...(match.state==='matched'&&!p.provenance?.arive_match?{retired_arive_overrides:{status:p.status,amount_note:p.amount_note,product_note:p.product_note}}:{})};
   const {error:saveError}=await db.from('lead_desk_preferences').update({provenance,...(match.state==='matched'?{status:null,amount_note:null,product_note:null}:{})}).eq('id',p.id).eq('organization_id',org);
   if(saveError)throw Error('ARIVE match could not be saved');
  }
  return NextResponse.json({...result,matched,review,checked_at:checkedAt},{headers});
 }catch{
  await db.from('communication_source_health').upsert({organization_id:org,source:'arive_loans',status:'partial',last_attempt_at:new Date().toISOString(),detail:'ARIVE recovery check failed. Previously verified values are retained.',inbound:true,outbound:false},{onConflict:'organization_id,source'});
  return NextResponse.json({error:'ARIVE recovery check failed. Check the source connection and complete loan list.'},{status:503,headers});
 }
}
