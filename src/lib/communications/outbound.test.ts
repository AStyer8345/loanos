import {describe,it,expect} from 'vitest'
import {graphPageUrl,normalizeOutbound} from './outbound'
const message={id:'source-id',internetMessageId:'<internal-test>',from:{emailAddress:{address:'adam@thestyerteam.com'}},sentDateTime:'2026-09-05T04:00:00Z',toRecipients:[{emailAddress:{address:'ADAM.STYERASSISTANT@GMAIL.COM'}}],subject:'Internal verification',webLink:'https://outlook.office.com/mail/id/test',hasAttachments:true}
describe('outbound metadata boundary',()=>{
 it('uses stable internet identity despite provider ID changes',()=>{expect(normalizeOutbound(message)?.event_key).toBe(normalizeOutbound({...message,id:'moved-id'})?.event_key)})
 it('excludes bodies, attachments and automatic engagement claims',()=>{const r=normalizeOutbound({...message,body:{content:'private document text'}} as typeof message);expect(JSON.stringify(r)).not.toContain('private document text');expect(r?.payload.metadata.authorship).toBe('unverified');expect(r?.recipients).toEqual(['adam.styerassistant@gmail.com'])})
 it('holds sensitive subjects and strips content from unmatched references',()=>{const r=normalizeOutbound({...message,subject:'Bank statement 123-45-6789'});expect(r?.payload.subject).not.toContain('123-45');expect(r?.held.subject).toBe('Unmatched sent-mail reference')})
 it('rejects foreign senders, drafts and foreign pagination origins',()=>{expect(normalizeOutbound({...message,isDraft:true})).toBeNull();expect(normalizeOutbound({...message,from:{emailAddress:{address:'someone@example.com'}}})).toBeNull();expect(()=>graphPageUrl('','','https://example.com/me/messages')).toThrow()})
 it('requests only sent-folder metadata in a bounded date window',()=>{const u=new URL(graphPageUrl('2026-09-01','2026-09-05',null));expect(u.pathname).toContain('/sentitems/messages');expect(u.searchParams.get('$select')).not.toMatch(/body|attachments/);expect(u.searchParams.get('$filter')).toContain('sentDateTime lt 2026-09-05')})
})
