import {describe,it,expect} from 'vitest'
import {normalizeInbound} from './inbound'
const base={from_address:'buyer@example.com',from_name:'Test Buyer',message_id:'source-message-1',received_at:'2026-09-06T14:08:00Z',subject:'DSCR loan',body_snippet:"I'm buying a fully rented duplex. Can you price this across your lenders?",conversation_id:'conversation-1'}
describe('inbound email intake',()=>{
 it('captures a direct mortgage inquiry with source time and no confirmation',()=>{expect(normalizeInbound(base)).toMatchObject({inquiry:true,input:{source:'Direct email',suppress_confirmation:true,first_name:'Test',last_name:'Buyer',received_at:new Date(base.received_at).toISOString(),provenance:{transport:'outlook_email'}}})})
 it('does not turn newsletters or quoted replies into new inquiries',()=>{expect(normalizeInbound({...base,subject:'New listing',body_snippet:'New listing. Unsubscribe.'})?.inquiry).toBe(false);expect(normalizeInbound({...base,body_snippet:'Thanks!\nOn Sun, someone wrote:\n'+base.body_snippet})?.inquiry).toBe(false)})
 it('skips internal copies without creating contacts',()=>{expect(normalizeInbound({...base,from_address:'adam.styer@hypersmart.loan'})).toBeNull()})
 it('uses one inquiry key per sender and conversation while preserving distinct messages',()=>{const a=normalizeInbound(base)!,b=normalizeInbound({...base,message_id:'message-2'})!;expect(a.key).toBe(b.key);expect(a.messageId).not.toBe(b.messageId);expect(normalizeInbound({...base,conversation_id:'new-conversation'})?.key).not.toBe(a.key)})
 it('rejects missing source identity or timestamp and never derives names from email',()=>{expect(()=>normalizeInbound({...base,message_id:''})).toThrow();expect(()=>normalizeInbound({...base,received_at:''})).toThrow();expect(normalizeInbound({...base,from_name:base.from_address})?.input.first_name).toBe('')})
})
