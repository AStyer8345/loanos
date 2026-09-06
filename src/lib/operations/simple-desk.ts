import type {Snapshot,Preference,Contact} from './types';
import {matchAriveLead,type AriveMatch} from './arive-sync';
export const STAGES = ['Lead','Lead Contacted','Application Started','Pre-approved','Loan in Process','Funded','Cold','Archived/not qualified'] as const;
export const SOURCES = ['AI','Realtor Referral','Financial Advisor Referral','Other'] as const;
export type ReportingSource = typeof SOURCES[number];
export type WorkingStage = typeof STAGES[number];
export type SavedLead = {name?:string;added?:string;source?:string;action?:string;note?:string;tag?:string;amount?:string;product?:string;loan?:string;contact?:string;email?:string;planning_volume?:number};
export type DeskPreference = Preference & {reporting_source?:ReportingSource|null;referral_name?:string|null;next_action?:string|null;provenance?:Preference['provenance'] & {restored_lead?:SavedLead;arive_match?:AriveMatch}};
type DeskContact = Contact & {notes?:string|null;referred_by?:string|null;referral_type?:string|null;referred_by_contact_id?:string|null;referral_source_notes?:string|null};
export type DeskRow = {ariveIds:string[];ariveCheckedAt:string|null;ariveReview:string;ariveOwned:boolean;id:string;contactId:string|null;inquiryId:string|null;preference:DeskPreference|null;name:string;email:string;phone:string;stage:WorkingStage;source:ReportingSource;originalSource:string;referral:string;amount:number|null;amountText:string;product:string;notes:string;context:string;nextAction:string;priority:boolean;hidden:boolean;receivedAt:string|null;owner:string;inquiryCount:number};
export function workingStage(value:string|null|undefined):WorkingStage {
 const s=(value||'').toLowerCase().replace(/[-_]/g,' ');
 if(/funded|closed/.test(s))return 'Funded';
 if(/adverse|archive|not qualified|denied|withdrawn|cancel|lost|dead/.test(s))return 'Archived/not qualified';
 if(/cold|inactive/.test(s))return 'Cold';
 if(/pre.?approv/.test(s))return 'Pre-approved';
 if(/process|underwrit|conditional|clear to close|closing|approved|loan setup|disclosure|re submittal/.test(s))return 'Loan in Process';
 if(/application|prequal|pre qual/.test(s))return 'Application Started';
 if(/contacted|engaged/.test(s))return 'Lead Contacted';
 return 'Lead';
}
// Planning amounts are editable notes, never writes to loan financial fields.
// A price range, down payment, or TBD must not silently become loan volume.
export function planningAmount(value:string|null|undefined):number|null {
 if(!value || /tbd|unknown|price|down payment|range|–|\d\s*-\s*\d/i.test(value))return null;
 const match=value.replace(/,/g,'').match(/(?:about\s*|approximately\s*|~\s*)?\$?\s*(\d+(?:\.\d+)?)\s*([km])?(?:\b|$)/i);
 if(!match)return null;
 const n=Number(match[1])*(match[2]?.toLowerCase()==='m'?1e6:match[2]?.toLowerCase()==='k'?1e3:1);
 return Number.isFinite(n)&&n>0?n:null;
}
export function reportingSource(source:string,referralType='',isWebsite=false):ReportingSource {
 const text=source+' '+referralType;
 if(/^Direct email$/i.test(source))return 'Other';
 if(/financial|advisor|adviser|wealth/i.test(text))return 'Financial Advisor Referral';
 if(/realtor|real estate|real-estate|agent referral/i.test(text))return 'Realtor Referral';
 if(isWebsite || /chatgpt|openai|\bai\b|website|web lead|google|bing|organic|search|online/i.test(text))return 'AI';
 return 'Other';
}
const name=(c:Contact|undefined)=>c?[c.first_name,c.last_name].filter(Boolean).join(' '):'';
export function deskRows(s:Snapshot):DeskRow[] {
 const contacts=new Map(s.contacts.map(c=>[c.id,c as DeskContact]));
 const inquiries=s.inquiries.filter(i=>!i.is_test&&i.legitimacy==='inquiry').sort((a,b)=>b.received_at.localeCompare(a.received_at));
 const preferences=s.preferences as DeskPreference[];
 const rows:DeskRow[]=[];const seen=new Set<string>();
 const build=(p:DeskPreference|null,i:typeof inquiries[number]|undefined):DeskRow=>{
  const original=p?.provenance?.restored_lead||{},cid=p?.contact_id||i?.contact_id||null,c=cid?contacts.get(cid):undefined;
  const related=inquiries.filter(x=>cid?x.contact_id===cid:x.id===i?.id);
  const latest=i||related[0];
  const linkedIds=new Set(s.links.filter(x=>related.some(j=>j.id===x.inquiry_id)).map(x=>x.loan_id));
  const explicitLoans=s.loans.filter(l=>linkedIds.has(l.id)||!!original.loan&&(l.arive_loan_id===original.loan||l.loan_number===original.loan));
  const ariveMatch=p?.provenance?.arive_match||(s.ariveFacts?matchAriveLead({name:original.name||name(c)||latest?.displayName||p?.provenance?.display_name||'',email:c?.email||original.email||latest?.email,phone:c?.phone||latest?.phone,originalLoan:original.loan,note:original.note,previous:p?.provenance?.arive_match},s.ariveFacts,s.health.find(h=>h.source==='arive_loans')?.last_success_at||s.asOf):null);
  const facts=ariveMatch?.state==='matched'?(s.ariveFacts||[]).filter(f=>ariveMatch.ids.includes(f.arive_loan_id)):[];
  const ariveOwned=facts.length>0,ariveReview=ariveMatch?.state==='review'?ariveMatch.reason:ariveMatch?.state==='matched'&&facts.length!==ariveMatch.ids.length?'Linked ARIVE loan is unavailable':'';
  const amountText=p?.amount_note?.trim()||original.amount||'';
  const known=explicitLoans.map(l=>l.loan_amount).filter((n):n is number=>n!==null);
  const amount=ariveReview?null:ariveOwned?(facts.every(f=>f.loan_amount!==null)?facts.reduce((v,f)=>v+f.loan_amount!,0):null):p?.amount_note?.trim()?planningAmount(p.amount_note):original.planning_volume||planningAmount(original.amount)||(known.length?known.reduce((a,b)=>a+Number(b),0):null);
  const rawSource=original.source||latest?.source||c?.lead_source||'Not recorded';
  const partner=c?.referred_by_contact_id?contacts.get(c.referred_by_contact_id):undefined;
  const namedSource=rawSource.includes('·')?rawSource.split('·')[0].trim():'';
  const referral=p?.referral_name??(latest?.referral_partner||name(partner)||c?.referred_by||(/referral/i.test(rawSource)?namedSource:''));
  const source=p?.reporting_source||reportingSource(rawSource,c?.referral_type||'',!!latest?.form_name||!!latest?.source_page);
  const task=s.tasks.find(t=>!(t.is_complete||['completed','done','cancelled'].includes(t.status||''))&&(t.id===latest?.task_id||!!cid&&t.related_contact_id===cid));
  const dated=original.added&&!/tbd/i.test(original.added)?new Date(original.added+', 2026'):null;
  return {ariveOwned,ariveIds:ariveMatch?.ids||[],ariveCheckedAt:facts.length?facts.map(f=>f.checked_at||'').sort()[0]||null:null,ariveReview,id:p?.id||latest!.id,contactId:cid,inquiryId:latest?.id||null,preference:p,name:original.name||name(c)||latest?.displayName||p?.provenance?.display_name||'Lead to review',email:c?.email||original.email||latest?.email||'',phone:c?.phone||original.contact||latest?.phone||'',stage:workingStage(ariveOwned?(facts[0].archived?'archived':facts[0].status):p?.status||c?.stage),source,originalSource:rawSource,referral,amount,amountText,product:ariveOwned?facts.map(f=>f.product).filter(Boolean).join(', '):p?.product_note||original.product||explicitLoans.map(l=>l.loan_program||l.loan_type).filter(Boolean).join(', ')||'',notes:p?.notes||'',context:[original.note,c?.notes,c?.referral_source_notes].filter((v,ix,all)=>v&&all.indexOf(v)===ix).join('\n\n'),nextAction:p?.next_action??task?.title??task?.text??original.action??'',priority:!!p?.priority_follow_up,hidden:!!p?.hidden,receivedAt:latest?.received_at||(dated&&!isNaN(dated.valueOf())?dated.toISOString():null),owner:s.members.find(m=>m.id===s.viewerId)?.full_name||'Adam Styer',inquiryCount:related.length};
 };
 for(const p of preferences){if(p.contact_id)seen.add(p.contact_id);rows.push(build(p,undefined));}
 for(const i of inquiries){const key=i.contact_id||i.id;if(seen.has(key))continue;seen.add(key);rows.push(build(null,i));}
 return rows.sort((a,b)=>Number(b.priority)-Number(a.priority)||(b.receivedAt||'').localeCompare(a.receivedAt||'')||a.name.localeCompare(b.name));
}
export type DeskFilters={stage:string;source:string;query:string;showHidden:boolean;priorityOnly:boolean};
export function filterDesk(rows:DeskRow[],f:DeskFilters){const q=f.query.trim().toLowerCase();return rows.filter(r=>(f.showHidden||!r.hidden)&&(f.stage==='All'||r.stage===f.stage)&&(f.source==='All'||r.source===f.source)&&(!f.priorityOnly||r.priority)&&(!q||[r.name,r.email,r.phone,r.notes,r.context,r.referral,r.source,r.product,r.nextAction].join(' ').toLowerCase().includes(q)));}
export function deskTotals(rows:DeskRow[]){const known=rows.filter(r=>r.amount!==null);const volume=known.reduce((n,r)=>n+r.amount!,0);return {count:rows.length,volume,compensation:volume*.02,known:known.length,tbd:rows.length-known.length,average:known.length?volume/known.length:null};}
