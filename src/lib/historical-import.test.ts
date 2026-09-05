import {describe,it,expect} from 'vitest'
import {historyRow,type HistoryMetadata} from './historical-import'
const meta:HistoryMetadata={entity_type:'loan',external_id:'L1',contact_id:null,loan_id:null,disposition:'review',reason:'Borrower match needs review'}
describe('historical source display',()=>{
 it('keeps unresolved rows visible without creating a target or inventing an amount',()=>{
  const result=historyRow(meta,{'Borrower Name':'Example Client','Loan Amount':null,'Loan Status':'Pre-Approved','Notes':'Original source note','SSN':'sensitive fixture','Taxable Income':99999})
  expect(result).toMatchObject({name:'Example Client',amount:null,stage:'Pre-Approved',notes:'Original source note',href:null,disposition:'review'})
  expect(JSON.stringify(result)).not.toContain('sensitive fixture');expect(JSON.stringify(result)).not.toContain('Taxable Income')
 })
 it('links verified contact records and preserves source referral notes',()=>{
  const result=historyRow({...meta,entity_type:'contact',contact_id:'known-contact',disposition:'matched'},{'First Name':'Example','Last Name':'Client','Email':'example@example.com','Referral Source':'Example Realtor'})
  expect(result).toMatchObject({name:'Example Client',href:'/dashboard/contacts/known-contact',referral:'Example Realtor',email:'example@example.com'})
 })
})
