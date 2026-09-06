import {describe,it,expect} from 'vitest'
import {teamRecords} from './projection'
import {estimateCompensation} from './types'
import {teamEdit} from './edits'
import {staffPathAllowed} from '../staff-access'
import type {Snapshot} from '../operations/types'
const s={asOf:'2026-09-06',organizationId:'o',viewerId:'u',members:[],contacts:[],inquiries:[],preferences:[],tasks:[],milestones:[],activity:[],health:[],delivery:[],links:[],
 compensation:[{loan_id:'l',gross_comp:8000,net_comp:7777,gross_source:'manual',payout_status:'paid'}],
 loans:[{id:'l',borrower_first_name:'Sample',borrower_last_name:'Borrower',loan_amount:400000,status:'Funded',commission_amount:8000,originator_comp:200,raw_payload:{private:'OWNER_SECRET'},notes:'OWNER_SECRET'}],
} as unknown as Snapshot

describe('team compensation privacy',()=>{
 it('projects only the viewers compensation, excludes private amounts and raw data',()=>{
  const records=teamRecords(s,25);expect(records[0].ownCompensation).toBe(1000)
  expect(Object.keys(records[0]).sort()).toEqual(['id','kind','name','email','phone','stage','source','referral','amount','product','closingDate','priority','ariveOwned','ownCompensation'].sort())
  const text=JSON.stringify(records);for(const secret of ['8000','7777','OWNER_SECRET','gross_comp','originator_comp','raw_payload','notes'])expect(text).not.toContain(secret)
  expect(teamRecords(s,200)[0].ownCompensation).toBe(8000)
 })
 it('leaves unknown amounts unknown and rounds at loan level',()=>{
  expect(estimateCompensation(null,25)).toBeNull();expect(estimateCompensation(0,25)).toBeNull();expect(estimateCompensation(333333.33,25)).toBe(833.33)
 })
 it('does not accept financial or membership fields in edits',()=>{
  const r={...teamRecords(s,25)[0],kind:'contact' as const}
  for(const changes of [{comp_bps:200},{commission_amount:10},{role:'owner'},{organization_id:'other'},{notes:'private'},{raw_payload:{}}])expect(()=>teamEdit(r,changes)).toThrow()
  expect(teamEdit(r,{email:'test@example.test'})).toEqual({email:'test@example.test'})
 })
 it('prevents overwriting verified ARIVE facts',()=>{
  const r={...teamRecords(s,25)[0],kind:'lead' as const,ariveOwned:true}
  for(const changes of [{status:'Funded'},{amount_note:'10'},{product_note:'new'}])expect(()=>teamEdit(r,changes)).toThrow('ARIVE')
  expect(teamEdit(r,{priority_follow_up:true})).toEqual({priority_follow_up:true})
 })
 it('only permits reviewed staff routes, including exact path boundaries',()=>{
  for(const path of ['/team','/api/team','/invite/accept'])expect(staffPathAllowed(path)).toBe(true)
  for(const path of ['/api/comp/plan','/api/operations','/api/activity','/api/admin/users','/api/team/export/private','/dashboard','/dashboard/loans/x.png','/api/agents/data','/admin'])expect(staffPathAllowed(path)).toBe(false)
 })
})
