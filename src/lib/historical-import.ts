export type HistoryRow = {
  id: string; kind: 'contact'|'loan'; name: string; email: string; loanNumber: string;
  address: string; amount: number|null; stage: string; notes: string; referral: string;
  disposition: 'matched'|'created'|'review'|'excluded'; reason: string; href: string|null;
}
export type HistoryMetadata = {entity_type:'contact'|'loan';external_id:string;contact_id:string|null;loan_id:string|null;disposition:HistoryRow['disposition'];reason:string}
/** Only these display fields leave the encrypted source archive. */
export function historyRow(meta:HistoryMetadata, record:Record<string,unknown>):HistoryRow {
  const value=(k:string,max=500)=>record[k]==null?'':String(record[k]).slice(0,max)
  const amount=Number(String(record['Loan Amount']??'').replace(/[$, ]/g,''))
  const loan=meta.entity_type==='loan'
  return {
    id:meta.entity_type+':'+meta.external_id,kind:meta.entity_type,
    name:loan?value('Borrower Name'):[value('First Name'),value('Last Name')].filter(Boolean).join(' '),
    email:loan?'':value('Email'),loanNumber:loan?value('Loan Number'):'',
    address:value(loan?'Property Street':'Mailing Street'),
    amount:loan&&record['Loan Amount']!=null&&record['Loan Amount']!==''&&Number.isFinite(amount)?amount:null,
    stage:value(loan?'Loan Status':'Client Status'),notes:value('Notes',20000),
    referral:value(loan?'Referral Partner':'Referral Source'),disposition:meta.disposition,reason:meta.reason,
    href:loan?(meta.loan_id?'/dashboard/loans/'+meta.loan_id:null):(meta.contact_id?'/dashboard/contacts/'+meta.contact_id:null),
  }
}
