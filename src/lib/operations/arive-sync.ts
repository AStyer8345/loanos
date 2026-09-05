/** Minimal ARIVE facts. Identity supports matching; no documents or underwriting payloads. */
export type AriveFact = {
 arive_loan_id:string; source_updated_at:string; checked_at?:string;
 status:string; status_date:string|null; loan_amount:number|null; base_loan_amount:number|null;
 financed_fees:number|null; product:string|null; purpose:string|null; archived:boolean;
 borrower_name:string; borrower_email:string|null; borrower_phone:string|null;
 co_borrower_name:string|null; co_borrower_email:string|null;
};
export type AriveMatch={state:'matched'|'review'|'not_found';ids:string[];checked_at:string;reason:string};
const string=(v:unknown)=>typeof v==='string'?v.trim():'';
const email=(v:unknown)=>string(v).toLowerCase();
const phone=(v:unknown)=>string(v).replace(/\D/g,'').slice(-10);
const number=(v:unknown):number|null=>v===null||v===undefined||v===''?null:typeof v==='number'&&Number.isFinite(v)&&v>=0?v:null;
export function normalizeAriveRows(input:unknown,now=Date.now(),knownLoanIds:string[]=[]):AriveFact[]{
 if(!input||typeof input!=='object')throw Error('A complete ARIVE loan list is required');
 const {rows,count}=input as {rows:unknown[];count:number};
 if(!Array.isArray(rows)||rows.length>1000||count!==rows.length)throw Error('Incomplete ARIVE loan list; collect every page before submitting');
 const ids=new Set<string>();
 return rows.filter(value=>!!value&&typeof value==='object'&&(email((value as Record<string,unknown>).loanOriginatorEmail)==='adam.styer@hypersmart.loan'||knownLoanIds.includes(String((value as Record<string,unknown>).ariveLoanId)))).map(value=>{
  if(!value||typeof value!=='object')throw Error('Invalid ARIVE record');
  const r=value as Record<string,unknown>,id=String(r.ariveLoanId||''),stamp=string(r.modifiedDateTime);
  if(!/^\d+$/.test(id)||ids.has(id))throw Error('Missing or duplicate ARIVE loan ID');ids.add(id);
  if(!/^\d{4}-\d{2}-\d{2}T/.test(stamp)||!Number.isFinite(Date.parse(stamp))||Date.parse(stamp)>now+300000)throw Error('ARIVE modification timestamp is missing or invalid');
  if(email(r.loanOriginatorEmail)!=='adam.styer@hypersmart.loan'&&!knownLoanIds.includes(id))throw Error('ARIVE loan belongs to a different loan originator');
  const status=string(r.currentLoanStatus_status);if(!status)throw Error('ARIVE status is missing');
  const base=number(r.baseLoanAmount),fees=number(r.financedFees),total=number(r.totalLoanAmount);
  return {arive_loan_id:id,source_updated_at:new Date(stamp).toISOString(),status,status_date:string(r.currentLoanStatus_date)||null,
   loan_amount:total??(base!==null&&fees!==null?base+fees:null),base_loan_amount:base,financed_fees:fees,
   product:string(r.lenderProductName)||string(r.mortgageType)||null,purpose:string(r.loanPurpose)||null,archived:r.archiveIndicator===true,
   borrower_name:[r.loanBorrower1_firstName,r.loanBorrower1_lastName].map(string).filter(Boolean).join(' '),borrower_email:email(r.loanBorrower1_emailAddressText)||null,borrower_phone:phone(r.loanBorrower1_mobilePhone10digit)||null,
   co_borrower_name:[r.loanBorrower2_firstName,r.loanBorrower2_lastName].map(string).filter(Boolean).join(' ')||null,co_borrower_email:email(r.loanBorrower2_emailAddressText)||null};
 });
}
function nameAgrees(name:string,f:AriveFact){const words=name.toLowerCase().replace(/[^a-z0-9 ]/g,' ').split(/\s+/).filter(w=>w.length>1);return [f.borrower_name,f.co_borrower_name||''].some(n=>{const parts=n.toLowerCase().split(/\s+/).filter(Boolean);return parts.length>=2&&parts.filter(p=>words.includes(p)).length>=2;});}
export function matchAriveLead(lead:{name:string;email?:string|null;phone?:string|null;originalLoan?:string;note?:string;previous?:AriveMatch},facts:AriveFact[],checkedAt:string):AriveMatch{
 const result=(state:AriveMatch['state'],ids:string[],reason:string):AriveMatch=>({state,ids,checked_at:checkedAt,reason});
 // Keep reviewed matches stable. An absent loan is an exception, never a reason to match another scenario.
 if(lead.previous?.state==='matched')return lead.previous.ids.every(id=>facts.some(f=>f.arive_loan_id===id))?result('matched',lead.previous.ids,'Previously verified ARIVE loan IDs'):result('review',lead.previous.ids,'A previously linked loan is absent from the latest ARIVE list');
 if(/identity conflict|Anthony Vu|Thanh.*conflict/i.test(lead.note||''))return result('review',[],'Borrower identity or alternative scenarios need review');
 const explicit:string[]=lead.originalLoan?.match(/\b\d{7,10}\b/g)||[];
 const candidates=explicit.length?facts.filter(f=>explicit.includes(f.arive_loan_id)):facts.filter(f=>!!email(lead.email)&&[f.borrower_email,f.co_borrower_email].includes(email(lead.email))||!!phone(lead.phone)&&phone(lead.phone)===f.borrower_phone);
 const verified=candidates.filter(f=>nameAgrees(lead.name,f)||!!email(lead.email)&&[f.borrower_email,f.co_borrower_email].includes(email(lead.email))&&[f.borrower_name,f.co_borrower_name||''].some(n=>lead.name.toLowerCase().split(/[^a-z]+/).includes(n.toLowerCase().split(/\s+/).at(-1)||'')));
 if(explicit.length&&verified.length!==explicit.length)return result('review',[],'Saved loan IDs and borrower identity could not all be verified');
 if(!verified.length)return result(candidates.length?'review':'not_found',[],candidates.length?'Identity needs review':'No verified loan match in the current ARIVE list');
 if(verified.length>1)return result('review',verified.map(f=>f.arive_loan_id),'Multiple loan scenarios: choose which belongs in this lead view');
 return result('matched',verified.map(f=>f.arive_loan_id),explicit.length?'Saved ARIVE ID and borrower name verified':'Unique email or phone plus borrower name verified');
}
