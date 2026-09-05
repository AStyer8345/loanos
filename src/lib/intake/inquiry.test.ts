import { describe,it,expect,beforeEach } from 'vitest'
import {normalizeInquiry,encryptInquiry,decryptInquiry} from './inquiry'
describe('inquiry identity and protected capture',()=>{
 beforeEach(()=>{process.env.PII_ENCRYPTION_KEY='a'.repeat(64)})
 const base={inquiry_id:'inquiry-test-1234',email:'Adam@thestyerteam.com',first_name:'Adam',phone:'(512) 956-6010'}
 it('uses one event key and matching hash across the two delivery transports',()=>{
  const direct=normalizeInquiry(base),netlify=normalizeInquiry({id:'netlify-record',created_at:'2026-09-01T12:00:00Z',data:base})
  expect(direct.key).toBe(netlify.key);expect(direct.hash).toBe(netlify.hash)
 })
 it('keeps a new inquiry from the same person distinct',()=>expect(normalizeInquiry({...base,inquiry_id:'inquiry-test-5678'}).key).not.toBe(normalizeInquiry(base).key))
 it('requires durable IDs and valid contact information',()=>{expect(()=>normalizeInquiry({...base,inquiry_id:''})).toThrow();expect(()=>normalizeInquiry({...base,email:'bad',phone:''})).toThrow()})
 it('allows internal-only tests and marks followups without another confirmation',()=>{
  expect(normalizeInquiry({...base,test_mode:true}).isTest).toBe(true)
  expect(()=>normalizeInquiry({...base,email:'customer@example.com',test_mode:true})).toThrow()
  expect(normalizeInquiry({...base,form_name:'qualification-followup'}).input.suppress_confirmation).toBe(true)
 })
 it('encrypts captured free text and rejects tampering',()=>{
  const p={situation:'Private original inquiry',email:base.email};const encrypted=encryptInquiry(p)
  expect(JSON.stringify(encrypted)).not.toContain(p.situation);expect(decryptInquiry(encrypted)).toEqual(p)
  expect(()=>decryptInquiry({...encrypted,tag:Buffer.alloc(16).toString('base64')})).toThrow()
 })
 it('does not treat a visitor first-touch time as inquiry arrival',()=>expect(normalizeInquiry({...base,first_touch_at:'2020-01-01T00:00:00Z'}).input.received_at).not.toBe('2020-01-01T00:00:00Z'))
})
